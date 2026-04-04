const { query } = require('../config/db');

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
    totalStudents: parseInt(row.total_students, 10),
    totalAdmins: parseInt(row.total_admins, 10),
    totalAssignments: parseInt(row.total_assignments, 10),
    totalGroups: parseInt(row.total_groups, 10),
    totalSubmitted: parseInt(row.total_submitted, 10),
    totalSubmissions: parseInt(row.total_submissions, 10),
    submissionRate:
      Number(row.total_submissions) > 0
        ? Math.round((Number(row.total_submitted) / Number(row.total_submissions)) * 100)
        : 0,
  };
}

async function getAssignmentAnalytics(assignmentId) {
  const assignmentResult = await query(
    'SELECT * FROM assignments WHERE id = $1',
    [assignmentId]
  );

  if (assignmentResult.rows.length === 0) return null;
  const assignment = assignmentResult.rows[0];

  const groupsResult = await query(
    `SELECT
       g.id,
       g.name,
       u.full_name AS leader_name,
       s.id AS submission_id,
       s.status AS submission_status,
       s.evaluation_status,
       s.feedback,
       s.confirmed_at,
       s.link_clicked_at,
       s.grade_published,
       s.graded_score,
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

  const groups = groupsResult.rows.map((group) => {
    let ragStatus;
    if (group.submission_status === 'submitted') {
      ragStatus = 'green';
    } else if (isPastDue) {
      ragStatus = 'red';
    } else if (
      group.submission_status === 'link_visited' ||
      group.submission_status === 'awaiting_confirmation'
    ) {
      ragStatus = 'amber';
    } else {
      ragStatus = 'red';
    }

    return {
      ...group,
      rag_status: ragStatus,
    };
  });

  if (groups.length > 0) {
    const groupIds = groups.map((group) => group.id);
    const inParams = groupIds.map((_, index) => `$${index + 2}`).join(',');
    const membersResult = await query(
      `SELECT
         gm.id,
         gm.group_id,
         gm.user_id,
         u.full_name,
         u.email,
         gm.role,
         gm.submission_status,
         gm.evaluation_status,
         gm.feedback
       FROM group_members gm
       JOIN users u ON u.id = gm.user_id
       WHERE gm.group_id IN (${inParams})
       ORDER BY gm.joined_at ASC`,
      [assignmentId, ...groupIds]
    );

    const membersByGroup = {};
    for (const member of membersResult.rows) {
      if (!membersByGroup[member.group_id]) membersByGroup[member.group_id] = [];
      membersByGroup[member.group_id].push(member);
    }

    for (const group of groups) {
      group.members = membersByGroup[group.id] || [];
    }
  }

  const ungroupedResult = await query(
    `SELECT u.id, u.full_name, u.email
     FROM users u
     WHERE u.role = 'student'
       AND u.id NOT IN (
         SELECT gm.user_id
         FROM group_members gm
         JOIN groups g ON g.id = gm.group_id
         WHERE g.assignment_id = $1
       )
     ORDER BY u.full_name ASC`,
    [assignmentId]
  );

  const summary = {
    totalGroups: groups.length,
    submitted: groups.filter((group) => group.rag_status === 'green').length,
    inProgress: groups.filter((group) => group.rag_status === 'amber').length,
    atRisk: groups.filter((group) => group.rag_status === 'red').length,
    graded: groups.filter(
      (group) => group.grade_published || group.graded_score !== null
    ).length,
    ungroupedStudents: ungroupedResult.rows.length,
  };

  return {
    assignment,
    groups,
    ungroupedStudents: ungroupedResult.rows,
    summary,
  };
}

async function getAllAssignmentStats() {
  const result = await query(`
    SELECT
      a.id,
      a.title,
      a.due_date,
      COUNT(DISTINCT g.id) AS total_groups,
      COUNT(DISTINCT CASE WHEN s.status = 'submitted' THEN s.id END) AS submitted_count,
      COUNT(DISTINCT s.id) AS total_submissions,
      COUNT(DISTINCT CASE WHEN s.status = 'pending' THEN s.id END) AS pending_count,
      COUNT(DISTINCT CASE WHEN s.status IN ('link_visited', 'awaiting_confirmation') THEN s.id END) AS in_progress_count,
      COUNT(DISTINCT CASE WHEN s.graded_score IS NOT NULL THEN s.id END) AS graded_count
    FROM assignments a
    LEFT JOIN groups g ON g.assignment_id = a.id
    LEFT JOIN submissions s ON s.assignment_id = a.id
    GROUP BY a.id
    ORDER BY a.due_date ASC
  `);

  return result.rows.map((row) => ({
    ...row,
    group_count: Number(row.total_groups || 0),
    total_groups: Number(row.total_groups || 0),
    submitted_count: Number(row.submitted_count || 0),
    total_submissions: Number(row.total_submissions || 0),
    pending_count: Number(row.pending_count || 0),
    in_progress_count: Number(row.in_progress_count || 0),
    graded_count: Number(row.graded_count || 0),
  }));
}

async function getSubmissionTrends(days = 30) {
  const safeDays = Math.max(1, Math.min(parseInt(days, 10) || 30, 365));
  const result = await query(
    `SELECT
       DATE_TRUNC('day', confirmed_at)::date AS day,
       COUNT(*)::int AS submitted
     FROM submissions
     WHERE confirmed_at >= NOW() - (($1::text || ' days')::interval)
     GROUP BY DATE_TRUNC('day', confirmed_at)::date
     ORDER BY day ASC`,
    [safeDays]
  );

  return result.rows.map((row) => ({
    day: row.day,
    submitted: Number(row.submitted || 0),
  }));
}

async function getGradeDistribution(assignmentId = null) {
  const params = [];
  let assignmentClause = '';

  if (assignmentId) {
    params.push(assignmentId);
    assignmentClause = 'AND assignment_id = $1';
  }

  const result = await query(
    `SELECT graded_score, total_marks
     FROM submissions
     WHERE graded_score IS NOT NULL
       AND total_marks IS NOT NULL
       ${assignmentClause}`,
    params
  );

  const buckets = [
    { label: '0-20', count: 0 },
    { label: '21-40', count: 0 },
    { label: '41-60', count: 0 },
    { label: '61-80', count: 0 },
    { label: '81-100', count: 0 },
  ];

  for (const row of result.rows) {
    const percentage =
      Number(row.total_marks) > 0
        ? Math.round((Number(row.graded_score) / Number(row.total_marks)) * 100)
        : 0;

    if (percentage <= 20) buckets[0].count += 1;
    else if (percentage <= 40) buckets[1].count += 1;
    else if (percentage <= 60) buckets[2].count += 1;
    else if (percentage <= 80) buckets[3].count += 1;
    else buckets[4].count += 1;
  }

  return buckets;
}

module.exports = {
  getOverview,
  getAssignmentAnalytics,
  getAllAssignmentStats,
  getSubmissionTrends,
  getGradeDistribution,
};
