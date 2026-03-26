const submissionService = require('../services/submission.service');

async function trackClick(req, res, next) {
  try {
    const result = await submissionService.trackLinkClick(
      parseInt(req.params.id),
      req.user.id
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function initiate(req, res, next) {
  try {
    const result = await submissionService.initiateSubmission(
      parseInt(req.params.id),
      req.user.id
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function confirm(req, res, next) {
  try {
    const result = await submissionService.confirmSubmission(
      parseInt(req.params.id),
      req.user.id,
      {
        token: req.body.token,
        assignmentTitle: req.body.assignmentTitle,
      }
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function getSubmission(req, res, next) {
  try {
    const submission = await submissionService.getSubmission(parseInt(req.params.id));
    res.json({ submission });
  } catch (err) {
    next(err);
  }
}

async function getByAssignment(req, res, next) {
  try {
    const submission = await submissionService.getSubmissionByAssignmentAndUser(
      parseInt(req.params.assignmentId),
      req.user.id
    );
    res.json({ submission });
  } catch (err) {
    next(err);
  }
}

module.exports = { trackClick, initiate, confirm, getSubmission, getByAssignment };
