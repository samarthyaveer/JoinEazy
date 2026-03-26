const { query, getClient } = require('../config/db');
const { NotFoundError, BadRequestError, ConflictError, ForbiddenError } = require('../utils/errors');

/**
 * Create a group for an assignment.
 * Uses a transaction to atomically create group, add leader, and init submission.
 */
async function createGroup({ name, assignmentId, userId }) {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    // Verify assignment exists
    const assignmentResult = await client.query('SELECT id, max_group_size FROM assignments WHERE id = $1', [assignmentId]);
    if (assignmentResult.rows.length === 0) {
      throw new NotFoundError('Assignment not found');
    }

    // Check if student is already in a group for this assignment
    const existingMembership = await client.query(
      `SELECT gm.id FROM group_members gm
       JOIN groups g ON g.id = gm.group_id
       WHERE gm.user_id = $1 AND g.assignment_id = $2`,
      [userId, assignmentId]
    );
    if (existingMembership.rows.length > 0) {
      throw new ConflictError('You are already in a group for this assignment');
    }

    // Create the group
    const groupResult = await client.query(
      'INSERT INTO groups (name, assignment_id, created_by) VALUES ($1, $2, $3) RETURNING *',
      [name, assignmentId, userId]
    );
    const group = groupResult.rows[0];

    // Add creator as leader
    await client.query(
      `INSERT INTO group_members (group_id, user_id, role) VALUES ($1, $2, 'leader')`,
      [group.id, userId]
    );

    // Initialize a submission record for this group
    await client.query(
      `INSERT INTO submissions (assignment_id, group_id, status) VALUES ($1, $2, 'pending')`,
      [assignmentId, group.id]
    );

    await client.query('COMMIT');
    return group;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Get groups for an assignment.
 */
async function getGroupsByAssignment(assignmentId) {
  const result = await query(
    `SELECT g.*,
            u.full_name AS leader_name,
            u.email AS leader_email,
            a.max_group_size,
            (SELECT COUNT(*) FROM group_members gm WHERE gm.group_id = g.id) AS member_count,
            s.status AS submission_status
     FROM groups g
     JOIN users u ON u.id = g.created_by
     JOIN assignments a ON a.id = g.assignment_id
     LEFT JOIN submissions s ON s.group_id = g.id AND s.assignment_id = g.assignment_id
     WHERE g.assignment_id = $1
     ORDER BY g.created_at ASC`,
    [assignmentId]
  );
  return result.rows;
}

/**
 * Get all groups a student belongs to.
 */
async function getMyGroups(userId) {
  const result = await query(
    `SELECT g.*, gm.role AS my_role,
            a.title AS assignment_title, a.due_date,
            s.status AS submission_status,
            (SELECT COUNT(*) FROM group_members gm2 WHERE gm2.group_id = g.id) AS member_count,
            a.max_group_size
     FROM group_members gm
     JOIN groups g ON g.id = gm.group_id
     JOIN assignments a ON a.id = g.assignment_id
     LEFT JOIN submissions s ON s.group_id = g.id AND s.assignment_id = g.assignment_id
     WHERE gm.user_id = $1
     ORDER BY a.due_date ASC`,
    [userId]
  );
  return result.rows;
}

/**
 * Get group details with members.
 */
async function getGroupDetails(groupId) {
  const groupResult = await query(
    `SELECT g.*, a.max_group_size, a.title AS assignment_title
     FROM groups g
     JOIN assignments a ON a.id = g.assignment_id
     WHERE g.id = $1`,
    [groupId]
  );
  if (groupResult.rows.length === 0) throw new NotFoundError('Group not found');

  const group = groupResult.rows[0];

  const membersResult = await query(
    `SELECT gm.id AS membership_id, gm.role, gm.joined_at,
            u.id AS user_id, u.full_name, u.email
     FROM group_members gm
     JOIN users u ON u.id = gm.user_id
     WHERE gm.group_id = $1
     ORDER BY gm.role DESC, gm.joined_at ASC`,
    [groupId]
  );

  group.members = membersResult.rows;
  return group;
}

/**
 * Add a member to a group by email.
 * Only the group leader can do this.
 */
async function addMember({ groupId, email, requestUserId }) {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    // Verify the group exists and get assignment info
    const groupResult = await client.query(
      `SELECT g.*, a.max_group_size FROM groups g
       JOIN assignments a ON a.id = g.assignment_id
       WHERE g.id = $1`,
      [groupId]
    );
    if (groupResult.rows.length === 0) throw new NotFoundError('Group not found');
    const group = groupResult.rows[0];

    // Verify requester is the leader
    const leaderCheck = await client.query(
      `SELECT id FROM group_members WHERE group_id = $1 AND user_id = $2 AND role = 'leader'`,
      [groupId, requestUserId]
    );
    if (leaderCheck.rows.length === 0) {
      throw new ForbiddenError('Only the group leader can add members');
    }

    // Check current member count with row lock
    const countResult = await client.query(
      'SELECT COUNT(*) AS cnt FROM group_members WHERE group_id = $1 FOR UPDATE',
      [groupId]
    );
    const currentCount = parseInt(countResult.rows[0].cnt, 10);
    if (currentCount >= group.max_group_size) {
      throw new BadRequestError(`Group is full (max ${group.max_group_size} members)`);
    }

    // Find the student by email
    const userResult = await client.query(
      `SELECT id, full_name, email FROM users WHERE email = $1 AND role = 'student'`,
      [email]
    );
    if (userResult.rows.length === 0) {
      throw new NotFoundError('No student found with this email');
    }
    const student = userResult.rows[0];

    // Check if student is already in a group for this assignment
    const existingMembership = await client.query(
      `SELECT gm.id FROM group_members gm
       JOIN groups g ON g.id = gm.group_id
       WHERE gm.user_id = $1 AND g.assignment_id = $2`,
      [student.id, group.assignment_id]
    );
    if (existingMembership.rows.length > 0) {
      throw new ConflictError('This student is already in a group for this assignment');
    }

    // Add the member
    await client.query(
      `INSERT INTO group_members (group_id, user_id, role) VALUES ($1, $2, 'member')`,
      [groupId, student.id]
    );

    await client.query('COMMIT');
    return { message: `${student.full_name} added to the group`, student };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Remove a member from a group.
 * Only the leader can remove members. Leader cannot remove themselves.
 */
async function removeMember({ groupId, targetUserId, requestUserId }) {
  // Verify requester is the leader
  const leaderCheck = await query(
    `SELECT id FROM group_members WHERE group_id = $1 AND user_id = $2 AND role = 'leader'`,
    [groupId, requestUserId]
  );
  if (leaderCheck.rows.length === 0) {
    throw new ForbiddenError('Only the group leader can remove members');
  }

  if (parseInt(targetUserId) === requestUserId) {
    throw new BadRequestError('Cannot remove yourself as the leader');
  }

  const result = await query(
    'DELETE FROM group_members WHERE group_id = $1 AND user_id = $2 RETURNING id',
    [groupId, targetUserId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Member not found in this group');
  }

  return { message: 'Member removed' };
}

module.exports = { createGroup, getGroupsByAssignment, getMyGroups, getGroupDetails, addMember, removeMember };
