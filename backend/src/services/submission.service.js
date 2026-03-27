const crypto = require('crypto');
const { query } = require('../config/db');
const { NotFoundError, BadRequestError, ForbiddenError } = require('../utils/errors');

const TOKEN_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Gate 1: Record that a student clicked the OneDrive link.
 */
async function trackLinkClick(submissionId, userId) {
  // Verify submission exists and student is a member
  const sub = await getSubmissionWithAuth(submissionId, userId);

  if (sub.status === 'submitted' || sub.my_submission_status === 'submitted') {
    throw new BadRequestError('You have already submitted this assignment');
  }

  // Log the click
  await query(
    'INSERT INTO link_click_log (submission_id, user_id) VALUES ($1, $2)',
    [submissionId, userId]
  );

  // Update individual student status
  if (sub.my_submission_status === 'pending') {
    await query(
      `UPDATE group_members SET submission_status = 'link_visited' WHERE id = $1`,
      [sub.gm_id]
    );
  }

  // Update group submission if it's the first click for the group
  if (sub.status === 'pending') {
    await query(
      `UPDATE submissions SET status = 'link_visited', link_clicked_at = NOW(), link_clicked_by = $1
       WHERE id = $2`,
      [userId, submissionId]
    );
  } else {
    // Update the click timestamp for cooldown tracking
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

  // Generate a confirmation token
  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

  // Update individual token
  await query(
    `UPDATE group_members
     SET submission_status = 'awaiting_confirmation',
         confirmation_token = $1,
         token_expires_at = $2
     WHERE id = $3`,
    [hashedToken, expiresAt.toISOString(), sub.gm_id]
  );

  // Update group submission to 'awaiting_confirmation' optimally
  await query(
    `UPDATE submissions SET status = 'awaiting_confirmation', initiated_at = NOW(), initiated_by = $1 WHERE id = $2 AND status != 'submitted'`,
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

  // Check token expiry
  if (!sub.my_token_expires_at || new Date(sub.my_token_expires_at) < new Date()) {
    // Reset individual status to link_visited
    await query(
      `UPDATE group_members SET submission_status = 'link_visited', confirmation_token = NULL, token_expires_at = NULL WHERE id = $1`,
      [sub.gm_id]
    );
    throw new BadRequestError('Confirmation token has expired. Please initiate submission again.');
  }

  // Verify token
  const hashedProvided = crypto.createHash('sha256').update(token).digest('hex');
  if (hashedProvided !== sub.my_confirmation_token) {
    throw new BadRequestError('Invalid confirmation token');
  }

  // Verify assignment title matches
  const assignmentResult = await query(
    'SELECT title FROM assignments WHERE id = $1',
    [sub.assignment_id]
  );
  const actualTitle = assignmentResult.rows[0]?.title;

  if (!actualTitle || actualTitle.trim().toLowerCase() !== assignmentTitle.trim().toLowerCase()) {
    throw new BadRequestError('Assignment title does not match');
  }

  // Finalize individual submission
  await query(
    `UPDATE group_members
     SET submission_status = 'submitted',
         submitted_at = NOW(),
         confirmation_token = NULL,
         token_expires_at = NULL
     WHERE id = $1`,
    [sub.gm_id]
  );

  // Check if all members are now submitted
  const pendingMembers = await query(
    `SELECT COUNT(*) as count FROM group_members WHERE group_id = $1 AND submission_status != 'submitted'`,
    [sub.group_id]
  );

  if (parseInt(pendingMembers.rows[0].count) === 0) {
    // All members submitted! Update group submission
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

/**
 * Get submission details.
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
     JOIN groups g ON g.id = s.group_id
     WHERE s.id = $1`,
    [submissionId]
  );

  if (result.rows.length === 0) throw new NotFoundError('Submission not found');

  const submission = result.rows[0];

  // Get click log
  const clickLog = await query(
    `SELECT lcl.clicked_at, u.full_name, u.email
     FROM link_click_log lcl
     JOIN users u ON u.id = lcl.user_id
     WHERE lcl.submission_id = $1
     ORDER BY lcl.clicked_at DESC`,
    [submissionId]
  );
  submission.click_log = clickLog.rows;

  return submission;
}

/**
 * Get submission for an assignment by student's group.
 */
async function getSubmissionByAssignmentAndUser(assignmentId, userId) {
  const result = await query(
    `SELECT s.*, gm.submission_status AS my_submission_status FROM submissions s
     JOIN group_members gm ON gm.group_id = s.group_id
     WHERE s.assignment_id = $1 AND gm.user_id = $2
     LIMIT 1`,
    [assignmentId, userId]
  );
  return result.rows[0] || null;
}

// ---- Internal helper ----

async function getSubmissionWithAuth(submissionId, userId) {
  const result = await query(
    `SELECT s.*, gm.id as gm_id, gm.submission_status AS my_submission_status, gm.confirmation_token AS my_confirmation_token, gm.token_expires_at AS my_token_expires_at 
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

/**
 * Gate 4: Evaluate submission (Admin)
 */
async function reviewSubmission(submissionId, { evaluationStatus, feedback, userId }) {
  const check = await query('SELECT status, group_id FROM submissions WHERE id = $1', [submissionId]);
  if (check.rows.length === 0) throw new NotFoundError('Submission not found');
  if (check.rows[0].status !== 'submitted') {
    throw new BadRequestError('Cannot evaluate incomplete submissions');
  }

  if (userId) {
    // Individual student evaluation
    await query(
      `UPDATE group_members
       SET evaluation_status = $1, feedback = $2
       WHERE group_id = $3 AND user_id = $4`,
      [evaluationStatus, feedback, check.rows[0].group_id, userId]
    );
    return { message: `Individual submission ${evaluationStatus}`, evaluationStatus };
  } else {
    // Whole group evaluation
    await query(
      `UPDATE submissions
       SET evaluation_status = $1, feedback = $2
       WHERE id = $3`,
      [evaluationStatus, feedback, submissionId]
    );
    return { message: `Group submission ${evaluationStatus}`, evaluationStatus };
  }
}

module.exports = { trackLinkClick, initiateSubmission, confirmSubmission, getSubmission, getSubmissionByAssignmentAndUser, reviewSubmission };
