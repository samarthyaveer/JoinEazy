const router = require('express').Router();
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');
const analyticsController = require('../controllers/analytics.controller');

// All analytics routes are admin-only
router.get('/overview', authenticate, authorize('admin'), analyticsController.getOverview);
router.get('/stats', authenticate, authorize('admin'), analyticsController.getAllStats);
router.get('/assignments/:id', authenticate, authorize('admin'), analyticsController.getAssignmentAnalytics);

module.exports = router;
