const crypto = require('crypto');
const { query } = require('../config/db');
const {
  NotFoundError,
  BadRequestError,
  ForbiddenError,
} = require('../utils/errors');

const TOKEN_TTL_MS = 5 * 60 * 1000; // 5 minutes

const toNumber = (value) =>
  value === null || value === undefined ? null : Number(value);

const deriveReviewState = (row) => {
  if (row.status !== 'submitted') return row.status;
  if (row.grade_published) return 'published';
  if (row.graded_score !== null) return 'draft';
  return 'ungraded';
};

// ── Student gates ─────────────────────────────────────────────────────────────

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
      `UPDATE submissions
       SET status = 'link_visited', link_clicked_at = NOW(), link_clicked_by = $1
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
    `UPDATE submissions
     SET status = 'awaiting_confirmation', initiated_at = NOW(), initiated_by = $1
     WHERE id = $2 AND status != 'submitted'`,
    [userId, submissionId]
  );

  return {
    message: 'Submission initiated. Please confirm within 5 minutes.',
    token: rawToken,
    expiresAt: expiresAt.toISOString(),
  };
}

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
    `SELECT COUNT(*) AS count
     FROM group_members
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

async function getSubmission(submissionId) {
  const result = await query(
    `SELECT
       s.id,
       s.assignment_id,
       s.group_id,
       s.status,
       s.evaluation_status,
       s.feedback AS evaluation_feedback,
       s.confirmed_at,
       s.graded_score,
       s.total_marks,
       s.grade_feedback,
       s.grade_published,
       s.graded_at,
       s.published_at,
       a.title AS assignment_title,
       a.description AS assignment_description,
       a.due_date,
       a.onedrive_link,
       g.name AS group_name,
       (s.confirmed_at > a.due_date) AS is_late,
       rep.full_name AS student_name,
       rep.email AS student_email
     FROM submissions s
     JOIN assignments a ON a.id = s.assignment_id
     JOIN groups g ON g.id = s.group_id
     LEFT JOIN LATERAL (
       SELECT u.full_name, u.email
       FROM group_members gm2
       JOIN users u ON u.id = gm2.user_id
       WHERE gm2.group_id = g.id
       ORDER BY CASE WHEN gm2.role = 'leader' THEN 0 ELSE 1 END, gm2.joined_at ASC
       LIMIT 1
     ) rep ON TRUE
     WHERE s.id = $1`,
    [submissionId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Submission not found');
  }

  const row = result.rows[0];

  const clickLogResult = await query(
    `SELECT lcl.clicked_at, u.full_name, u.email
     FROM link_click_log lcl
     JOIN users u ON u.id = lcl.user_id
     WHERE lcl.submission_id = $1
     ORDER BY lcl.clicked_at DESC`,
    [submissionId]
  );

  const membersResult = await query(
    `SELECT
       gm.user_id,
       u.full_name,
       u.email,
       gm.role,
       gm.submission_status,
       gm.evaluation_status,
       gm.feedback,
       gm.submitted_at
     FROM group_members gm
     JOIN users u ON u.id = gm.user_id
     WHERE gm.group_id = $1
     ORDER BY CASE WHEN gm.role = 'leader' THEN 0 ELSE 1 END, gm.joined_at ASC`,
    [row.group_id]
  );

  const members = membersResult.rows.map((member) => ({
    ...member,
    submitted_at: member.submitted_at,
  }));

  return {
    id: row.id,
    assignmentId: row.assignment_id,
    assignmentTitle: row.assignment_title,
    assignmentDescription: row.assignment_description,
    dueDate: row.due_date,
    onedriveLink: row.onedrive_link,
    groupId: row.group_id,
    groupName: row.group_name,
    student: {
      name: row.student_name || row.group_name || 'Unknown group',
      email: row.student_email || '',
    },
    status: row.status,
    reviewState: deriveReviewState(row),
    evaluationStatus: row.evaluation_status,
    evaluationFeedback: row.evaluation_feedback || '',
    submitted_at: row.confirmed_at,
    submittedAt: row.confirmed_at,
    isLate: Boolean(row.is_late),
    totalScore: toNumber(row.graded_score),
    totalMarks: toNumber(row.total_marks),
    feedback: row.grade_feedback || '',
    gradePublished: Boolean(row.grade_published),
    gradedAt: row.graded_at,
    publishedAt: row.published_at,
    clickLog: clickLogResult.rows,
    members,
    memberCount: members.length,
    submittedMembers: members.filter((member) => member.submission_status === 'submitted').length,
  };
}

async function getSubmissionByAssignmentAndUser(assignmentId, userId) {
  const result = await query(
    `SELECT
       s.*,
       gm.submission_status AS my_submission_status,
       gm.evaluation_status AS my_evaluation_status,
       gm.feedback AS my_feedback
     FROM submissions s
     JOIN group_members gm ON gm.group_id = s.group_id
     WHERE s.assignment_id = $1 AND gm.user_id = $2
     LIMIT 1`,
    [assignmentId, userId]
  );

  const row = result.rows[0];
  if (!row) return null;

  return {
    ...row,
    graded_score: row.grade_published ? row.graded_score : null,
    total_marks: row.grade_published ? row.total_marks : null,
    grade_feedback: row.grade_published ? row.grade_feedback : null,
  };
}

async function getAllSubmissionsForAssignment(assignmentId, options = {}) {
  const { status, sort } = options;

  const result = await query(
    `SELECT
       s.id,
       s.status,
       s.evaluation_status,
       s.confirmed_at AS submitted_at,
       s.graded_score,
       s.total_marks,
       s.grade_feedback,
       s.grade_published,
       s.published_at,
       g.name AS group_name,
       (s.confirmed_at > a.due_date) AS is_late,
       (SELECT COUNT(*)::int FROM group_members gm_count WHERE gm_count.group_id = g.id) AS member_count,
       (
         SELECT COUNT(*)::int
         FROM group_members gm_count
         WHERE gm_count.group_id = g.id
           AND gm_count.submission_status = 'submitted'
       ) AS submitted_members,
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
        LIMIT 1) AS student_email
     FROM submissions s
     JOIN groups g ON g.id = s.group_id
     JOIN assignments a ON a.id = s.assignment_id
     WHERE s.assignment_id = $1`,
    [assignmentId]
  );

  let submissions = result.rows.map((row) => ({
    id: row.id,
    status: deriveReviewState(row),
    workflowStatus: row.status,
    evaluationStatus: row.evaluation_status,
    studentName: row.student_name || row.group_name || 'Unknown group',
    studentEmail: row.student_email || '',
    groupName: row.group_name,
    totalScore: toNumber(row.graded_score),
    totalMarks: toNumber(row.total_marks),
    submitted_at: row.submitted_at,
    isLate: Boolean(row.is_late),
    feedback: row.grade_feedback || '',
    gradePublished: Boolean(row.grade_published),
    publishedAt: row.published_at,
    memberCount: Number(row.member_count || 0),
    submittedMembers: Number(row.submitted_members || 0),
  }));

  if (status === 'ungraded') {
    submissions = submissions.filter((submission) => submission.status === 'ungraded');
  } else if (status === 'graded' || status === 'published') {
    submissions = submissions.filter((submission) => submission.status === 'published');
  } else if (status === 'draft') {
    submissions = submissions.filter((submission) => submission.status === 'draft');
  } else if (status === 'late') {
    submissions = submissions.filter((submission) => submission.isLate);
  }

  if (sort === 'oldest') {
    submissions.sort(
      (a, b) => new Date(a.submitted_at || 0).getTime() - new Date(b.submitted_at || 0).getTime()
    );
  } else if (sort === 'name') {
    submissions.sort((a, b) => a.studentName.localeCompare(b.studentName));
  } else {
    submissions.sort(
      (a, b) => new Date(b.submitted_at || 0).getTime() - new Date(a.submitted_at || 0).getTime()
    );
  }

  return submissions;
}

async function getPendingReviewCount() {
  const countResult = await query(
    `SELECT COUNT(*) AS count
     FROM submissions
     WHERE status = 'submitted'
       AND graded_score IS NULL`
  );

  const oldestResult = await query(
    `SELECT
       s.id,
       s.assignment_id,
       s.confirmed_at AS submitted_at,
       a.title AS assignment_title,
       (SELECT u.full_name
        FROM group_members gm2
        JOIN users u ON u.id = gm2.user_id
        WHERE gm2.group_id = s.group_id
        ORDER BY CASE WHEN gm2.role = 'leader' THEN 0 ELSE 1 END, gm2.joined_at ASC
        LIMIT 1) AS student_name
     FROM submissions s
     JOIN assignments a ON a.id = s.assignment_id
     WHERE s.status = 'submitted'
       AND s.graded_score IS NULL
     ORDER BY s.confirmed_at ASC NULLS LAST, s.id ASC
     LIMIT 1`
  );

  const oldest = oldestResult.rows[0];

  return {
    count: parseInt(countResult.rows[0].count, 10),
    oldestSubmission: oldest
      ? {
          id: oldest.id,
          assignmentId: oldest.assignment_id,
          assignmentTitle: oldest.assignment_title,
          studentName: oldest.student_name || 'Unknown group',
          submitted_at: oldest.submitted_at,
          link: `/admin/assignments/${oldest.assignment_id}/submissions/${oldest.id}`,
        }
      : null,
  };
}

// ── Admin: grading ────────────────────────────────────────────────────────────

async function saveGrade(
  submissionId,
  { scores = [], totalScore, totalMarks, feedback, gradedBy }
) {
  const check = await query(
    'SELECT id, status, grade_published, total_marks FROM submissions WHERE id = $1',
    [submissionId]
  );
  if (check.rows.length === 0) throw new NotFoundError('Submission not found');
  if (check.rows[0].status !== 'submitted') {
    throw new BadRequestError('Can only grade submitted submissions');
  }

  const resolvedTotalMarks = Number(totalMarks || check.rows[0].total_marks || 100);
  const resolvedTotalScore = Number(totalScore);

  if (!Number.isFinite(resolvedTotalMarks) || resolvedTotalMarks <= 0) {
    throw new BadRequestError('Total marks must be greater than zero');
  }
  if (!Number.isFinite(resolvedTotalScore) || resolvedTotalScore < 0) {
    throw new BadRequestError('Total score must be zero or greater');
  }
  if (resolvedTotalScore > resolvedTotalMarks) {
    throw new BadRequestError('Total score cannot exceed total marks');
  }

  await query(
    `UPDATE submissions
     SET graded_score = $1,
         total_marks = $2,
         grade_data = $3,
         grade_feedback = $4,
         graded_at = NOW(),
         graded_by = $5
     WHERE id = $6`,
    [
      resolvedTotalScore,
      resolvedTotalMarks,
      Array.isArray(scores) ? JSON.stringify(scores) : null,
      feedback || null,
      gradedBy || null,
      submissionId,
    ]
  );

  return {
    success: true,
    message: 'Draft grade saved',
    totalScore: resolvedTotalScore,
    totalMarks: resolvedTotalMarks,
  };
}

async function publishGrade(submissionId, { publishedBy, publishedAt } = {}) {
  const check = await query(
    `SELECT id, graded_score, status, evaluation_status
     FROM submissions
     WHERE id = $1`,
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
     SET grade_published = TRUE,
         published_at = COALESCE($2, NOW()),
         published_by = $3,
         evaluation_status = CASE
           WHEN evaluation_status = 'ungraded' THEN 'accepted'
           ELSE evaluation_status
         END
     WHERE id = $1`,
    [submissionId, publishedAt || null, publishedBy || null]
  );

  return { success: true, message: 'Grade published to students' };
}

async function bulkPublishGrades(submissionIds, { publishedBy, publishedAt } = {}) {
  if (!submissionIds.length) return { count: 0, success: true };

  const placeholders = submissionIds.map((_, index) => `$${index + 3}`).join(',');
  const result = await query(
    `UPDATE submissions
     SET grade_published = TRUE,
         published_at = COALESCE($1, NOW()),
         published_by = $2,
         evaluation_status = CASE
           WHEN evaluation_status = 'ungraded' THEN 'accepted'
           ELSE evaluation_status
         END
     WHERE id IN (${placeholders})
       AND status = 'submitted'
       AND graded_score IS NOT NULL
     RETURNING id`,
    [publishedAt || null, publishedBy || null, ...submissionIds]
  );

  return { count: result.rowCount, success: true };
}

async function reviewSubmission(submissionId, { evaluationStatus, feedback, userId }) {
  if (!['accepted', 'rejected'].includes(evaluationStatus)) {
    throw new BadRequestError('Review status must be accepted or rejected');
  }

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
      [evaluationStatus, feedback || '', check.rows[0].group_id, userId]
    );

    return {
      message:
        evaluationStatus === 'accepted'
          ? 'Student marked accepted'
          : 'Student marked for changes',
      evaluationStatus,
    };
  }

  await query(
    `UPDATE submissions
     SET evaluation_status = $1, feedback = $2
     WHERE id = $3`,
    [evaluationStatus, feedback || '', submissionId]
  );

  return {
    message:
      evaluationStatus === 'accepted'
        ? 'Group submission accepted'
        : 'Group submission marked for changes',
    evaluationStatus,
  };
}

// ── Internal helpers ──────────────────────────────────────────────────────────

async function getSubmissionWithAuth(submissionId, userId) {
  const result = await query(
    `SELECT
       s.*,
       gm.id AS gm_id,
       gm.submission_status AS my_submission_status,
       gm.confirmation_token AS my_confirmation_token,
       gm.token_expires_at AS my_token_expires_at
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
  getSubmissionsByAssignment: getAllSubmissionsForAssignment,
  getPendingReviewCount,
  saveGrade,
  saveGradeDraft: saveGrade,
  publishGrade,
  bulkPublishGrades,
  reviewSubmission,
};
