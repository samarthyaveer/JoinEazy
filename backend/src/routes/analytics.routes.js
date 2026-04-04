const router = require('express').Router();
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');
const analyticsController = require('../controllers/analytics.controller');

// All analytics routes require admin
router.get(
  '/overview',
  authenticate,
  authorize('admin'),
  analyticsController.getOverview
);

router.get(
  '/stats',
  authenticate,
  authorize('admin'),
  analyticsController.getAllStats
);

router.get(
  '/trends',
  authenticate,
  authorize('admin'),
  analyticsController.getSubmissionTrends
);

router.get(
  '/assignments/:id',
  authenticate,
  authorize('admin'),
  analyticsController.getAssignmentAnalytics
);

router.get(
  '/assignments/:id/grades',
  authenticate,
  authorize('admin'),
  analyticsController.getGradeDistribution
);

module.exports = router;
