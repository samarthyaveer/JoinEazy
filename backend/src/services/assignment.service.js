const { query, getClient } = require('../config/db');
const { NotFoundError } = require('../utils/errors');

/**
 * Create a new assignment (admin only).
 */
async function createAssignment({ title, description, dueDate, onedriveLink, maxGroupSize, createdBy }) {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    const result = await client.query(
      `INSERT INTO assignments (title, description, due_date, onedrive_link, max_group_size, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [title, description, dueDate, onedriveLink, maxGroupSize || 4, createdBy]
    );

    const assignment = result.rows[0];

    await client.query('COMMIT');
    return assignment;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Get all assignments. For students, filter by visibility.
 */
async function getAssignments(user) {
  if (user.role === 'admin') {
    const result = await query(
      `SELECT a.*,
              u.full_name AS creator_name,
              (SELECT COUNT(*) FROM groups g WHERE g.assignment_id = a.id) AS group_count,
              (SELECT COUNT(*) FROM submissions s WHERE s.assignment_id = a.id AND s.status = 'submitted') AS submitted_count,
              (SELECT COUNT(*) FROM submissions s WHERE s.assignment_id = a.id) AS total_submissions
       FROM assignments a
       JOIN users u ON u.id = a.created_by
       ORDER BY a.due_date ASC`
    );
    return result.rows.map((row) => ({
      ...row,
      group_count: Number(row.group_count || 0),
      submitted_count: Number(row.submitted_count || 0),
      total_submissions: Number(row.total_submissions || 0),
    }));
  }

  // Student: return assignment + current user's group/submission summary in one pass.
  const result = await query(
    `SELECT a.*,
            u.full_name AS creator_name,
            my_state.group_id,
            my_state.group_name,
            my_state.my_role,
            my_state.member_count,
            my_state.submitted_members,
            my_state.submission_id,
            my_state.submission_status,
            my_state.my_submission_status,
            my_state.confirmed_at
     FROM assignments a
     JOIN users u ON u.id = a.created_by
     LEFT JOIN LATERAL (
       SELECT g.id AS group_id,
              g.name AS group_name,
              gm.role AS my_role,
              (SELECT COUNT(*)::int FROM group_members gm_count WHERE gm_count.group_id = g.id) AS member_count,
              (
                SELECT COUNT(*)::int
                FROM group_members gm_count
                WHERE gm_count.group_id = g.id
                  AND gm_count.submission_status = 'submitted'
              ) AS submitted_members,
              s.id AS submission_id,
              s.status AS submission_status,
              gm.submission_status AS my_submission_status,
              s.confirmed_at
       FROM groups g
       JOIN group_members gm ON gm.group_id = g.id
       LEFT JOIN submissions s ON s.group_id = g.id AND s.assignment_id = a.id
       WHERE g.assignment_id = a.id
         AND gm.user_id = $1
       LIMIT 1
     ) AS my_state ON TRUE
     ORDER BY a.due_date ASC`,
    [user.id]
  );

  return result.rows.map((row) => ({
    ...row,
    my_group: row.group_id
      ? {
          id: row.group_id,
          name: row.group_name,
          my_role: row.my_role,
          member_count: Number(row.member_count || 0),
          submitted_members: Number(row.submitted_members || 0),
        }
      : null,
    my_submission: row.submission_id
      ? {
          id: row.submission_id,
          status: row.submission_status,
          my_submission_status: row.my_submission_status,
          confirmed_at: row.confirmed_at,
        }
      : null,
  }));
}

/**
 * Get single assignment with group and submission details.
 */
async function getAssignmentById(assignmentId, user) {
  const result = await query('SELECT a.*, u.full_name AS creator_name FROM assignments a JOIN users u ON u.id = a.created_by WHERE a.id = $1', [assignmentId]);

  if (result.rows.length === 0) {
    throw new NotFoundError('Assignment not found');
  }

  const assignment = result.rows[0];

  // Get groups for this assignment
  const groupsResult = await query(
    `SELECT g.*,
            u.full_name AS leader_name,
            (SELECT COUNT(*) FROM group_members gm WHERE gm.group_id = g.id) AS member_count
     FROM groups g
     JOIN users u ON u.id = g.created_by
     WHERE g.assignment_id = $1
     ORDER BY g.created_at ASC`,
    [assignmentId]
  );

  assignment.groups = groupsResult.rows;

  // If student, get their submission status
  if (user.role === 'student') {
    const subResult = await query(
      `SELECT s.*, 
              gm.submission_status AS my_submission_status,
              gm.evaluation_status AS my_evaluation_status,
              gm.feedback AS my_feedback
       FROM submissions s
       JOIN group_members gm ON gm.group_id = s.group_id
       WHERE s.assignment_id = $1 AND gm.user_id = $2
       LIMIT 1`,
      [assignmentId, user.id]
    );
    assignment.my_submission = subResult.rows[0] || null;

    // Get user's group for this assignment
    const myGroupResult = await query(
      `SELECT g.*,
              gm.role AS my_role,
              (SELECT COUNT(*)::int FROM group_members gm_count WHERE gm_count.group_id = g.id) AS member_count,
              (
                SELECT COUNT(*)::int
                FROM group_members gm_count
                WHERE gm_count.group_id = g.id
                  AND gm_count.submission_status = 'submitted'
              ) AS submitted_members
       FROM groups g
       JOIN group_members gm ON gm.group_id = g.id
       WHERE g.assignment_id = $1 AND gm.user_id = $2
       LIMIT 1`,
      [assignmentId, user.id]
    );
    assignment.my_group = myGroupResult.rows[0] || null;

    if (assignment.my_group) {
      const membersResult = await query(
        `SELECT gm.user_id, u.full_name, u.email, gm.role, gm.submission_status, gm.evaluation_status, gm.feedback
         FROM group_members gm
         JOIN users u ON u.id = gm.user_id
         WHERE gm.group_id = $1
         ORDER BY gm.joined_at ASC`,
        [assignment.my_group.id]
      );
      assignment.my_group_members = membersResult.rows;
    }
  }

  return assignment;
}

/**
 * Update an assignment (admin only).
 */
async function updateAssignment(assignmentId, updates, userId) {
  const existing = await query('SELECT * FROM assignments WHERE id = $1', [assignmentId]);
  if (existing.rows.length === 0) throw new NotFoundError('Assignment not found');

  const { title, description, dueDate, onedriveLink, maxGroupSize } = updates;

  const result = await query(
    `UPDATE assignments
     SET title = COALESCE($1, title),
         description = COALESCE($2, description),
         due_date = COALESCE($3, due_date),
         onedrive_link = COALESCE($4, onedrive_link),
         max_group_size = COALESCE($5, max_group_size)
     WHERE id = $6
     RETURNING *`,
    [title, description, dueDate, onedriveLink, maxGroupSize, assignmentId]
  );

  return result.rows[0];
}

/**
 * Delete an assignment (admin only). Cascades delete groups, submissions.
 */
async function deleteAssignment(assignmentId) {
  const existing = await query('SELECT id FROM assignments WHERE id = $1', [assignmentId]);
  if (existing.rows.length === 0) throw new NotFoundError('Assignment not found');

  await query('DELETE FROM assignments WHERE id = $1', [assignmentId]);
  return true;
}

module.exports = { createAssignment, getAssignments, getAssignmentById, updateAssignment, deleteAssignment };
