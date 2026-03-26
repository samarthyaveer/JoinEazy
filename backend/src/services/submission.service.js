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

  if (sub.status === 'submitted') {
    throw new BadRequestError('Assignment already submitted');
  }

  // Log the click
  await query(
    'INSERT INTO link_click_log (submission_id, user_id) VALUES ($1, $2)',
    [submissionId, userId]
  );

  // Update submission if first click
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

  if (sub.status === 'submitted') {
    throw new BadRequestError('Assignment already submitted');
  }

  if (sub.status === 'pending') {
    throw new BadRequestError('You must visit the OneDrive link first');
  }

  // Generate a confirmation token
  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

  await query(
    `UPDATE submissions
     SET status = 'awaiting_confirmation',
         initiated_at = NOW(),
         initiated_by = $1,
         confirmation_token = $2,
         token_expires_at = $3
     WHERE id = $4`,
    [userId, hashedToken, expiresAt.toISOString(), submissionId]
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

  if (sub.status === 'submitted') {
    throw new BadRequestError('Assignment already submitted');
  }

  if (sub.status !== 'awaiting_confirmation') {
    throw new BadRequestError('Submission has not been initiated yet');
  }

  // Check token expiry
  if (!sub.token_expires_at || new Date(sub.token_expires_at) < new Date()) {
    // Reset to link_visited so they can re-initiate
    await query(
      `UPDATE submissions SET status = 'link_visited', confirmation_token = NULL, token_expires_at = NULL WHERE id = $1`,
      [submissionId]
    );
    throw new BadRequestError('Confirmation token has expired. Please initiate submission again.');
  }

  // Verify token
  const hashedProvided = crypto.createHash('sha256').update(token).digest('hex');
  if (hashedProvided !== sub.confirmation_token) {
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

  // Finalize submission
  await query(
    `UPDATE submissions
     SET status = 'submitted',
         confirmed_at = NOW(),
         confirmed_by = $1,
         confirmation_token = NULL,
         token_expires_at = NULL
     WHERE id = $2`,
    [userId, submissionId]
  );

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
    `SELECT s.* FROM submissions s
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
    `SELECT s.* FROM submissions s
     JOIN group_members gm ON gm.group_id = s.group_id
     WHERE s.id = $1 AND gm.user_id = $2`,
    [submissionId, userId]
  );

  if (result.rows.length === 0) {
    throw new ForbiddenError('Submission not found or you are not a member of this group');
  }

  return result.rows[0];
}

module.exports = { trackLinkClick, initiateSubmission, confirmSubmission, getSubmission, getSubmissionByAssignmentAndUser };
