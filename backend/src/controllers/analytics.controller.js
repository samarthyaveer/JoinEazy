const analyticsService = require('../services/analytics.service');

function parseIntParam(val, name = 'id') {
  const n = parseInt(val, 10);
  if (isNaN(n) || n <= 0) {
    const err = new Error(`Invalid ${name} parameter`);
    err.status = 400;
    throw err;
  }
  return n;
}

async function getOverview(_req, res, next) {
  try {
    const overview = await analyticsService.getOverview();
    res.json({ overview });
  } catch (err) {
    next(err);
  }
}

async function getAssignmentAnalytics(req, res, next) {
  try {
    const id = parseIntParam(req.params.id);
    const analytics = await analyticsService.getAssignmentAnalytics(id);
    if (!analytics) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    res.json({ analytics });
  } catch (err) {
    if (err.status === 400) return res.status(400).json({ error: err.message });
    next(err);
  }
}

async function getAllStats(_req, res, next) {
  try {
    const stats = await analyticsService.getAllAssignmentStats();
    res.json({ stats });
  } catch (err) {
    next(err);
  }
}

// Submission trend over the last N days (default 30)
async function getSubmissionTrends(req, res, next) {
  try {
    const days = Math.min(parseInt(req.query.days, 10) || 30, 365);
    const trends = await analyticsService.getSubmissionTrends(days);
    res.json({ trends });
  } catch (err) {
    next(err);
  }
}

// Grade distribution for one assignment or across all
async function getGradeDistribution(req, res, next) {
  try {
    const assignmentId = req.params.id ? parseIntParam(req.params.id) : null;
    const distribution = await analyticsService.getGradeDistribution(assignmentId);
    res.json({ distribution });
  } catch (err) {
    if (err.status === 400) return res.status(400).json({ error: err.message });
    next(err);
  }
}

module.exports = {
  getOverview,
  getAssignmentAnalytics,
  getAllStats,
  getSubmissionTrends,
  getGradeDistribution,
};
