const analyticsService = require('../services/analytics.service');

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
    const analytics = await analyticsService.getAssignmentAnalytics(
      parseInt(req.params.id)
    );
    if (!analytics) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    res.json({ analytics });
  } catch (err) {
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

module.exports = { getOverview, getAssignmentAnalytics, getAllStats };
