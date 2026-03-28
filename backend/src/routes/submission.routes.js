const router = require('express').Router();
const Joi = require('joi');
const { validate } = require('../middleware/validate');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');
const submissionController = require('../controllers/submission.controller');

// Validation
const confirmSchema = Joi.object({
  token: Joi.string().required(),
  assignmentTitle: Joi.string().required(),
});

// Get submission by assignment (for current student)
router.get(
  '/assignment/:assignmentId',
  authenticate,
  authorize('student'),
  submissionController.getByAssignment
);

// Get submission details (admin only — students get their data via assignment details)
router.get('/:id', authenticate, authorize('admin'), submissionController.getSubmission);

// Gate 1: Track link click
router.post(
  '/:id/track-click',
  authenticate,
  authorize('student'),
  submissionController.trackClick
);

// Gate 2: Initiate submission
router.post(
  '/:id/initiate',
  authenticate,
  authorize('student'),
  submissionController.initiate
);

// Gate 3: Confirm submission
router.post(
  '/:id/confirm',
  authenticate,
  authorize('student'),
  validate(confirmSchema),
  submissionController.confirm
);

const reviewSchema = Joi.object({
  evaluationStatus: Joi.string().valid('accepted', 'rejected').required(),
  feedback: Joi.string().allow('', null).optional(),
  userId: Joi.number().integer().optional(),
});

router.post(
  '/:id/review',
  authenticate,
  authorize('admin'),
  validate(reviewSchema),
  submissionController.review
);

module.exports = router;
