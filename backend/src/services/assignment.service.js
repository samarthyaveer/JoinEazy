const { query, getClient } = require('../config/db');
const { NotFoundError, ForbiddenError } = require('../utils/errors');

/**
 * Create a new assignment (admin only).
 */
async function createAssignment({ title, description, dueDate, onedriveLink, targetType, maxGroupSize, groupIds, createdBy }) {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    const result = await client.query(
      `INSERT INTO assignments (title, description, due_date, onedrive_link, target_type, max_group_size, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [title, description, dueDate, onedriveLink, targetType, maxGroupSize || 4, createdBy]
    );

    const assignment = result.rows[0];

    // If targeting specific groups, insert target records
    if (targetType === 'specific' && groupIds && groupIds.length > 0) {
      for (const groupId of groupIds) {
        await client.query(
          'INSERT INTO assignment_targets (assignment_id, group_id) VALUES ($1, $2)',
          [assignment.id, groupId]
        );
      }
    }

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
    return result.rows;
  }

  // Student: show assignments targeted to 'all' OR to their groups
  const result = await query(
    `SELECT DISTINCT a.*,
            u.full_name AS creator_name
     FROM assignments a
     JOIN users u ON u.id = a.created_by
     LEFT JOIN assignment_targets at ON a.id = at.assignment_id
     LEFT JOIN group_members gm ON at.group_id = gm.group_id
     WHERE a.target_type = 'all'
        OR (a.target_type = 'specific' AND gm.user_id = $1)
     ORDER BY a.due_date ASC`,
    [user.id]
  );
  return result.rows;
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
      `SELECT s.* FROM submissions s
       JOIN group_members gm ON gm.group_id = s.group_id
       WHERE s.assignment_id = $1 AND gm.user_id = $2
       LIMIT 1`,
      [assignmentId, user.id]
    );
    assignment.my_submission = subResult.rows[0] || null;

    // Get user's group for this assignment
    const myGroupResult = await query(
      `SELECT g.*, gm.role AS my_role FROM groups g
       JOIN group_members gm ON gm.group_id = g.id
       WHERE g.assignment_id = $1 AND gm.user_id = $2
       LIMIT 1`,
      [assignmentId, user.id]
    );
    assignment.my_group = myGroupResult.rows[0] || null;
  }

  return assignment;
}

/**
 * Update an assignment (admin only).
 */
async function updateAssignment(assignmentId, updates, userId) {
  const existing = await query('SELECT * FROM assignments WHERE id = $1', [assignmentId]);
  if (existing.rows.length === 0) throw new NotFoundError('Assignment not found');

  const { title, description, dueDate, onedriveLink, targetType, maxGroupSize } = updates;

  const result = await query(
    `UPDATE assignments
     SET title = COALESCE($1, title),
         description = COALESCE($2, description),
         due_date = COALESCE($3, due_date),
         onedrive_link = COALESCE($4, onedrive_link),
         target_type = COALESCE($5, target_type),
         max_group_size = COALESCE($6, max_group_size)
     WHERE id = $7
     RETURNING *`,
    [title, description, dueDate, onedriveLink, targetType, maxGroupSize, assignmentId]
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
