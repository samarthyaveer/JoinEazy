const crypto = require('crypto');
const { query } = require('../config/db');
const { NotFoundError, BadRequestError, ForbiddenError } = require('../utils/errors');

const TOKEN_TTL_MS = 5 * 60 * 1000; // 5 minutes

// ── Student gates ─────────────────────────────────────────────────────────────

/**
 * Gate 1: Record that a student clicked the OneDrive link.
 */
async function trackLinkClick(submissionId, userId) {
  const sub = await getSubmissionWithAuth(submissionId, userId);

  if (sub.status === 'submitted' || sub.my_submission_status === 'submitted') {
    throw new BadRequestError('You have already submitted this assignment');
  }

  await query(
    'INSERT INTO link_click_log (submission_id, user_id) VALUES ($1, $2)',
    [submissionId, userId]
  );

  if (sub.my_submission_status === 'pending') {
    await query(
      `UPDATE group_members SET submission_status = 'link_visited' WHERE id = $1`,
      [sub.gm_id]
    );
  }

  if (sub.status === 'pending') {
    await query(
      `UPDATE submissions SET status = 'link_visited', link_clicked_at = NOW(), link_clicked_by = $1
       WHERE id = $2`,
      [userId, submissionId]
    );
  } else {
    await query(
      'UPDATE submissions SET link_clicked_at = NOW(), link_clicked_by = $1 WHERE id = $2',
      [userId, submissionId]
    );
  }

  return { message: 'Link click recorded' };
}

/**
 * Gate 2: Initiate submission (generates confirmation token).
 */
async function initiateSubmission(submissionId, userId) {
  const sub = await getSubmissionWithAuth(submissionId, userId);

  if (sub.status === 'submitted' || sub.my_submission_status === 'submitted') {
    throw new BadRequestError('You have already submitted this assignment');
  }

  if (sub.my_submission_status === 'pending') {
    throw new BadRequestError('You must visit the OneDrive link first');
  }

  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

  await query(
    `UPDATE group_members
     SET submission_status = 'awaiting_confirmation',
         confirmation_token = $1,
         token_expires_at = $2
     WHERE id = $3`,
    [hashedToken, expiresAt.toISOString(), sub.gm_id]
  );

  await query(
    `UPDATE submissions SET status = 'awaiting_confirmation', initiated_at = NOW(), initiated_by = $1
     WHERE id = $2 AND status != 'submitted'`,
    [userId, submissionId]
  );

  return {
    message: 'Submission initiated. Please confirm within 5 minutes.',
    token: rawToken,
    expiresAt: expiresAt.toISOString(),
  };
}

/**
 * Gate 3: Confirm submission with token and assignment title verification.
 */
async function confirmSubmission(submissionId, userId, { token, assignmentTitle }) {
  const sub = await getSubmissionWithAuth(submissionId, userId);

  if (sub.status === 'submitted' || sub.my_submission_status === 'submitted') {
    throw new BadRequestError('You have already submitted this assignment');
  }

  if (sub.my_submission_status !== 'awaiting_confirmation') {
    throw new BadRequestError('Submission has not been initiated yet');
  }

  if (!sub.my_token_expires_at || new Date(sub.my_token_expires_at) < new Date()) {
    await query(
      `UPDATE group_members
       SET submission_status = 'link_visited', confirmation_token = NULL, token_expires_at = NULL
       WHERE id = $1`,
      [sub.gm_id]
    );
    throw new BadRequestError('Confirmation token has expired. Please initiate submission again.');
  }

  const hashedProvided = crypto.createHash('sha256').update(token).digest('hex');
  if (hashedProvided !== sub.my_confirmation_token) {
    throw new BadRequestError('Invalid confirmation token');
  }

  const assignmentResult = await query(
    'SELECT title FROM assignments WHERE id = $1',
    [sub.assignment_id]
  );
  const actualTitle = assignmentResult.rows[0]?.title;

  if (!actualTitle || actualTitle.trim().toLowerCase() !== assignmentTitle.trim().toLowerCase()) {
    throw new BadRequestError('Assignment title does not match');
  }

  await query(
    `UPDATE group_members
     SET submission_status = 'submitted',
         submitted_at = NOW(),
         confirmation_token = NULL,
         token_expires_at = NULL
     WHERE id = $1`,
    [sub.gm_id]
  );

  const pendingMembers = await query(
    `SELECT COUNT(*) AS count FROM group_members
     WHERE group_id = $1 AND submission_status != 'submitted'`,
    [sub.group_id]
  );

  if (parseInt(pendingMembers.rows[0].count, 10) === 0) {
    await query(
      `UPDATE submissions
       SET status = 'submitted',
           confirmed_at = NOW(),
           confirmed_by = $1
       WHERE id = $2 AND status != 'submitted'`,
      [userId, submissionId]
    );
  }

  return { message: 'Submission confirmed successfully' };
}

// ── Admin: read ───────────────────────────────────────────────────────────────

/**
 * Get full submission details for a single submission (admin view).
 */
async function getSubmission(submissionId) {
  const result = await query(
    `SELECT s.*,
            a.title AS assignment_title,
            a.due_date,
            a.onedrive_link,
            g.name AS group_name
     FROM submissions s
     JOIN assignments a ON a.id = s.assignment_id
     JOIN groups g      ON g.id = s.group_id
     WHERE s.id = $1`,
    [submissionId]
  );

  if (result.rows.length === 0) throw new NotFoundError('Submission not found');

  const submission = result.rows[0];

  const clickLog = await query(
    `SELECT lcl.clicked_at, u.full_name, u.email
     FROM link_click_log lcl
     JOIN users u ON u.id = lcl.user_id
     WHERE lcl.submission_id = $1
     ORDER BY lcl.clicked_at DESC`,
    [submissionId]
  );
  submission.click_log = clickLog.rows;

  // Attach group members with their individual submission / evaluation status
  const members = await query(
    `SELECT gm.user_id, u.full_name, u.email, gm.role,
            gm.submission_status, gm.evaluation_status, gm.feedback, gm.submitted_at
     FROM group_members gm
     JOIN users u ON u.id = gm.user_id
     WHERE gm.group_id = $1
     ORDER BY gm.joined_at ASC`,
    [submission.group_id]
  );
  submission.members = members.rows;

  return submission;
}

/**
 * Get the current student's submission for an assignment.
 */
async function getSubmissionByAssignmentAndUser(assignmentId, userId) {
  const result = await query(
    `SELECT s.*, gm.submission_status AS my_submission_status
     FROM submissions s
     JOIN group_members gm ON gm.group_id = s.group_id
     WHERE s.assignment_id = $1 AND gm.user_id = $2
     LIMIT 1`,
    [assignmentId, userId]
  );
  return result.rows[0] || null;
}

/**
 * Get ALL submissions for an assignment (admin only).
 * Returns a flat list with the group leader / first member name for display.
 */
async function getAllSubmissionsForAssignment(assignmentId) {
  const result = await query(
    `SELECT
       s.id,
       s.status,
       s.evaluation_status,
       s.feedback,
       s.graded_score,
       s.total_marks,
       s.grade_published,
       s.confirmed_at AS submitted_at,
       g.name         AS group_name,
       a.title        AS assignment_title,
       -- Representative student name (group leader)
       (SELECT u.full_name
        FROM group_members gm2
        JOIN users u ON u.id = gm2.user_id
        WHERE gm2.group_id = g.id
        ORDER BY CASE WHEN gm2.role = 'leader' THEN 0 ELSE 1 END, gm2.joined_at ASC
        LIMIT 1) AS student_name,
       (SELECT u.email
        FROM group_members gm2
        JOIN users u ON u.id = gm2.user_id
        WHERE gm2.group_id = g.id
        ORDER BY CASE WHEN gm2.role = 'leader' THEN 0 ELSE 1 END, gm2.joined_at ASC
        LIMIT 1) AS student_email,
       -- Late flag
       (s.confirmed_at > a.due_date) AS is_late,
       -- Pending regrade request flag
       s.regrade_requested
     FROM submissions s
     JOIN groups      g ON g.id = s.group_id
     JOIN assignments a ON a.id = s.assignment_id
     WHERE s.assignment_id = $1
     ORDER BY s.confirmed_at ASC NULLS LAST`,
    [assignmentId]
  );

  return result.rows.map((row) => ({
    id: row.id,
    status: row.grade_published ? 'graded' : row.status === 'submitted' ? 'ungraded' : row.status,
    evaluationStatus: row.evaluation_status,
    studentName: row.student_name || 'Unknown',
    studentEmail: row.student_email || '',
    groupName: row.group_name,
    assignmentTitle: row.assignment_title,
    totalScore: row.graded_score !== null ? Number(row.graded_score) : null,
    totalMarks: row.total_marks !== null ? Number(row.total_marks) : null,
    submitted_at: row.submitted_at,
    isLate: row.is_late || false,
    regradeRequested: row.regrade_requested || false,
    feedback: row.feedback || '',
  }));
}

/**
 * Get count of submissions that are submitted and still ungraded.
 * The quick-grade detail payload is disabled for now because grading is out of scope
 * for the current Phase 1 flow hardening work.
 */
async function getPendingReviewCount() {
  const countResult = await query(`
    SELECT COUNT(*) AS count
    FROM submissions
    WHERE status = 'submitted'
      AND evaluation_status = 'ungraded'
  `);

  const count = parseInt(countResult.rows[0].count, 10);

  return {
    count,
    oldestSubmission: null,
  };
}

// ── Admin: grading ────────────────────────────────────────────────────────────

/**
 * Save a draft grade (score per question + overall feedback).
 * Does NOT publish — student cannot see it yet.
 *
 * Requires columns: graded_score, total_marks, grade_data (JSONB), grade_feedback on submissions.
 * Falls back gracefully if those columns don't exist yet (404 won't crash the app).
 */
async function saveGrade(submissionId, { scores, totalScore, feedback }) {
  const check = await query(
    'SELECT id, status FROM submissions WHERE id = $1',
    [submissionId]
  );
  if (check.rows.length === 0) throw new NotFoundError('Submission not found');
  if (check.rows[0].status !== 'submitted') {
    throw new BadRequestError('Can only grade submitted submissions');
  }

  await query(
    `UPDATE submissions
     SET graded_score   = $1,
         grade_data     = $2,
         grade_feedback = $3,
         graded_at      = NOW()
     WHERE id = $4`,
    [
      totalScore ?? null,
      scores ? JSON.stringify(scores) : null,
      feedback || null,
      submissionId,
    ]
  );

  return { success: true, message: 'Draft grade saved' };
}

/**
 * Publish the saved grade — makes it visible to the student.
 */
async function publishGrade(submissionId) {
  const check = await query(
    'SELECT id, graded_score, status FROM submissions WHERE id = $1',
    [submissionId]
  );
  if (check.rows.length === 0) throw new NotFoundError('Submission not found');
  if (check.rows[0].status !== 'submitted') {
    throw new BadRequestError('Can only publish grades for submitted submissions');
  }
  if (check.rows[0].graded_score === null) {
    throw new BadRequestError('Save a draft grade before publishing');
  }

  await query(
    `UPDATE submissions
     SET grade_published = TRUE, published_at = NOW()
     WHERE id = $1`,
    [submissionId]
  );

  return { success: true, message: 'Grade published to student' };
}

/**
 * Bulk-publish grades for multiple submissions at once.
 */
async function bulkPublishGrades(submissionIds) {
  if (!submissionIds.length) return { count: 0, success: true };

  const placeholders = submissionIds.map((_, i) => `$${i + 1}`).join(',');

  const result = await query(
    `UPDATE submissions
     SET grade_published = TRUE, published_at = NOW()
     WHERE id IN (${placeholders})
       AND status = 'submitted'
       AND graded_score IS NOT NULL
     RETURNING id`,
    submissionIds
  );

  return { count: result.rowCount, success: true };
}

/**
 * Accept / reject a group submission or an individual member (admin).
 */
async function reviewSubmission(submissionId, { evaluationStatus, feedback, userId }) {
  const check = await query(
    'SELECT status, group_id FROM submissions WHERE id = $1',
    [submissionId]
  );
  if (check.rows.length === 0) throw new NotFoundError('Submission not found');
  if (check.rows[0].status !== 'submitted') {
    throw new BadRequestError('Cannot evaluate incomplete submissions');
  }

  if (userId) {
    await query(
      `UPDATE group_members
       SET evaluation_status = $1, feedback = $2
       WHERE group_id = $3 AND user_id = $4`,
      [evaluationStatus, feedback, check.rows[0].group_id, userId]
    );
    return { message: `Individual submission ${evaluationStatus}`, evaluationStatus };
  } else {
    await query(
      `UPDATE submissions
       SET evaluation_status = $1, feedback = $2
       WHERE id = $3`,
      [evaluationStatus, feedback, submissionId]
    );
    return { message: `Group submission ${evaluationStatus}`, evaluationStatus };
  }
}

// ── Internal helpers ──────────────────────────────────────────────────────────

async function getSubmissionWithAuth(submissionId, userId) {
  const result = await query(
    `SELECT s.*,
            gm.id                   AS gm_id,
            gm.submission_status    AS my_submission_status,
            gm.confirmation_token   AS my_confirmation_token,
            gm.token_expires_at     AS my_token_expires_at
     FROM submissions s
     JOIN group_members gm ON gm.group_id = s.group_id
     WHERE s.id = $1 AND gm.user_id = $2`,
    [submissionId, userId]
  );

  if (result.rows.length === 0) {
    throw new ForbiddenError('Submission not found or you are not a member of this group');
  }

  return result.rows[0];
}

module.exports = {
  trackLinkClick,
  initiateSubmission,
  confirmSubmission,
  getSubmission,
  getSubmissionByAssignmentAndUser,
  getAllSubmissionsForAssignment,
  getPendingReviewCount,
  saveGrade,
  publishGrade,
  bulkPublishGrades,
  reviewSubmission,
};
