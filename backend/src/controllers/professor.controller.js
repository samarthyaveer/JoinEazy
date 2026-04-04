const professorService = require('../services/professor.service');

async function getActivity(req, res, next) {
  try {
    const activity = await professorService.getActivityFeed(req.query.limit);
    res.json({ activity });
  } catch (err) {
    next(err);
  }
}

module.exports = { getActivity };
