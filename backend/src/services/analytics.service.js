const { query } = require('../config/db');

/**
 * Get overview stats for admin dashboard.
 */
async function getOverview() {
  const stats = await query(`
    SELECT
      (SELECT COUNT(*) FROM users WHERE role = 'student') AS total_students,
      (SELECT COUNT(*) FROM users WHERE role = 'admin') AS total_admins,
      (SELECT COUNT(*) FROM assignments) AS total_assignments,
      (SELECT COUNT(*) FROM groups) AS total_groups,
      (SELECT COUNT(*) FROM submissions WHERE status = 'submitted') AS total_submitted,
      (SELECT COUNT(*) FROM submissions) AS total_submissions
  `);

  const row = stats.rows[0];
  return {
    totalStudents: parseInt(row.total_students),
    totalAdmins: parseInt(row.total_admins),
    totalAssignments: parseInt(row.total_assignments),
    totalGroups: parseInt(row.total_groups),
    totalSubmitted: parseInt(row.total_submitted),
    totalSubmissions: parseInt(row.total_submissions),
    submissionRate: row.total_submissions > 0
      ? Math.round((row.total_submitted / row.total_submissions) * 100)
      : 0,
  };
}

/**
 * Get per-assignment analytics with RAG classification.
 */
async function getAssignmentAnalytics(assignmentId) {
  // Assignment info
  const assignmentResult = await query(
    'SELECT * FROM assignments WHERE id = $1',
    [assignmentId]
  );

  if (assignmentResult.rows.length === 0) return null;
  const assignment = assignmentResult.rows[0];

  // Group-level breakdown
  const groupsResult = await query(
    `SELECT g.id, g.name,
            u.full_name AS leader_name,
            s.id AS submission_id,
            s.status AS submission_status,
            s.evaluation_status,
            s.feedback,
            s.confirmed_at,
            s.link_clicked_at,
            (SELECT COUNT(*) FROM group_members gm WHERE gm.group_id = g.id) AS member_count
     FROM groups g
     JOIN users u ON u.id = g.created_by
     LEFT JOIN submissions s ON s.group_id = g.id AND s.assignment_id = g.assignment_id
     WHERE g.assignment_id = $1
     ORDER BY g.created_at ASC`,
    [assignmentId]
  );

  const now = new Date();
  const dueDate = new Date(assignment.due_date);
  const isPastDue = now > dueDate;

  // RAG classification for each group
  const groups = groupsResult.rows.map((g) => {
    let ragStatus;
    if (g.submission_status === 'submitted') {
      ragStatus = 'green';
    } else if (isPastDue) {
      ragStatus = 'red';
    } else if (g.submission_status === 'link_visited' || g.submission_status === 'awaiting_confirmation') {
      ragStatus = 'amber';
    } else {
      ragStatus = 'red';
    }
    return { ...g, rag_status: ragStatus };
  });

  // Fetch all members for these groups so admin can evaluate them individually
  if (groups.length > 0) {
    const groupIds = groups.map(g => g.id);
    const inParams = groupIds.map((_, i) => `$${i + 2}`).join(',');
    const membersResult = await query(
      `SELECT gm.id, gm.group_id, gm.user_id, u.full_name, u.email, gm.role, gm.submission_status, gm.evaluation_status, gm.feedback
       FROM group_members gm
       JOIN users u ON u.id = gm.user_id
       WHERE gm.group_id IN (${inParams})
       ORDER BY gm.joined_at ASC`,
      [assignmentId, ...groupIds]
    );

    const membersByGroup = {};
    for (const m of membersResult.rows) {
      if (!membersByGroup[m.group_id]) membersByGroup[m.group_id] = [];
      membersByGroup[m.group_id].push(m);
    }

    for (const g of groups) {
      g.members = membersByGroup[g.id] || [];
    }
  }

  // Students without a group for this assignment
  const ungroupedResult = await query(
    `SELECT u.id, u.full_name, u.email
     FROM users u
     WHERE u.role = 'student'
       AND u.id NOT IN (
         SELECT gm.user_id FROM group_members gm
         JOIN groups g ON g.id = gm.group_id
         WHERE g.assignment_id = $1
       )
     ORDER BY u.full_name ASC`,
    [assignmentId]
  );

  // Summary counts
  const summary = {
    totalGroups: groups.length,
    submitted: groups.filter(g => g.rag_status === 'green').length,
    inProgress: groups.filter(g => g.rag_status === 'amber').length,
    atRisk: groups.filter(g => g.rag_status === 'red').length,
    ungroupedStudents: ungroupedResult.rows.length,
  };

  return {
    assignment,
    groups,
    ungroupedStudents: ungroupedResult.rows,
    summary,
  };
}

/**
 * Get all assignments with their submission statistics.
 */
async function getAllAssignmentStats() {
  const result = await query(`
    SELECT a.id, a.title, a.due_date,
           COUNT(DISTINCT g.id) AS group_count,
           COUNT(DISTINCT CASE WHEN s.status = 'submitted' THEN s.id END) AS submitted_count,
           COUNT(DISTINCT s.id) AS total_submissions,
           COUNT(DISTINCT CASE WHEN s.status = 'pending' THEN s.id END) AS pending_count,
           COUNT(DISTINCT CASE WHEN s.status IN ('link_visited', 'awaiting_confirmation') THEN s.id END) AS in_progress_count
    FROM assignments a
    LEFT JOIN groups g ON g.assignment_id = a.id
    LEFT JOIN submissions s ON s.assignment_id = a.id
    GROUP BY a.id
    ORDER BY a.due_date ASC
  `);
  return result.rows;
}

module.exports = { getOverview, getAssignmentAnalytics, getAllAssignmentStats };
