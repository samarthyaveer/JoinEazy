const { query } = require('../config/db');

async function getActivityFeed(limit = 10) {
  const safeLimit = Math.max(1, Math.min(parseInt(limit, 10) || 10, 50));

  const result = await query(
    `SELECT *
     FROM (
       SELECT
         'submitted' AS type,
         s.confirmed_at AS timestamp,
         s.id AS submission_id,
         s.assignment_id,
         a.title AS assignment_name,
         g.name AS group_name,
         rep.full_name AS student_name,
         1 AS count
       FROM submissions s
       JOIN assignments a ON a.id = s.assignment_id
       JOIN groups g ON g.id = s.group_id
       LEFT JOIN LATERAL (
         SELECT u.full_name
         FROM group_members gm2
         JOIN users u ON u.id = gm2.user_id
         WHERE gm2.group_id = g.id
         ORDER BY CASE WHEN gm2.role = 'leader' THEN 0 ELSE 1 END, gm2.joined_at ASC
         LIMIT 1
       ) rep ON TRUE
       WHERE s.confirmed_at IS NOT NULL

       UNION ALL

       SELECT
         'graded' AS type,
         s.graded_at AS timestamp,
         s.id AS submission_id,
         s.assignment_id,
         a.title AS assignment_name,
         g.name AS group_name,
         rep.full_name AS student_name,
         1 AS count
       FROM submissions s
       JOIN assignments a ON a.id = s.assignment_id
       JOIN groups g ON g.id = s.group_id
       LEFT JOIN LATERAL (
         SELECT u.full_name
         FROM group_members gm2
         JOIN users u ON u.id = gm2.user_id
         WHERE gm2.group_id = g.id
         ORDER BY CASE WHEN gm2.role = 'leader' THEN 0 ELSE 1 END, gm2.joined_at ASC
         LIMIT 1
       ) rep ON TRUE
       WHERE s.graded_at IS NOT NULL

       UNION ALL

       SELECT
         'published' AS type,
         s.published_at AS timestamp,
         s.id AS submission_id,
         s.assignment_id,
         a.title AS assignment_name,
         g.name AS group_name,
         rep.full_name AS student_name,
         1 AS count
       FROM submissions s
       JOIN assignments a ON a.id = s.assignment_id
       JOIN groups g ON g.id = s.group_id
       LEFT JOIN LATERAL (
         SELECT u.full_name
         FROM group_members gm2
         JOIN users u ON u.id = gm2.user_id
         WHERE gm2.group_id = g.id
         ORDER BY CASE WHEN gm2.role = 'leader' THEN 0 ELSE 1 END, gm2.joined_at ASC
         LIMIT 1
       ) rep ON TRUE
       WHERE s.published_at IS NOT NULL
     ) activity
     WHERE timestamp IS NOT NULL
     ORDER BY timestamp DESC
     LIMIT $1`,
    [safeLimit]
  );

  return result.rows.map((row) => ({
    type: row.type,
    timestamp: row.timestamp,
    submissionId: row.submission_id,
    assignmentId: row.assignment_id,
    assignmentName: row.assignment_name,
    groupName: row.group_name,
    studentName: row.student_name || row.group_name || 'Unknown group',
    count: Number(row.count || 1),
  }));
}

module.exports = { getActivityFeed };
