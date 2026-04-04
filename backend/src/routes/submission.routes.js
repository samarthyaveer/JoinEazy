const router = require('express').Router();
const Joi = require('joi');
const { validate } = require('../middleware/validate');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');
const submissionController = require('../controllers/submission.controller');

// ─── Validation Schemas ───────────────────────────────────────────────────────

const confirmSchema = Joi.object({
  token: Joi.string().required(),
  assignmentTitle: Joi.string().required(),
});

const saveGradeSchema = Joi.object({
  scores: Joi.array()
    .items(
      Joi.object({
        questionId: Joi.number().integer().required(),
        score: Joi.number().min(0).required(),
        comment: Joi.string().allow('', null).optional(),
      })
    )
    .required(),
  totalScore: Joi.number().min(0).required(),
  feedback: Joi.string().allow('', null).optional(),
});

const reviewSchema = Joi.object({
  // Accept both legacy 'accepted'/'rejected' and canonical 'graded'
  evaluationStatus: Joi.string()
    .valid('accepted', 'rejected', 'graded')
    .required(),
  feedback: Joi.string().allow('', null).optional(),
  userId: Joi.number().integer().optional(),
});

const bulkPublishSchema = Joi.object({
  submissionIds: Joi.array().items(Joi.number().integer()).min(1).required(),
});

const bulkReviewSchema = Joi.object({
  submissionIds: Joi.array().items(Joi.number().integer()).min(1).required(),
  evaluationStatus: Joi.string().valid('graded').required(),
  feedback: Joi.string().allow('', null).optional(),
});

// ─── Student routes ───────────────────────────────────────────────────────────

// Own submission for an assignment
router.get(
  '/assignment/:assignmentId',
  authenticate,
  authorize('student'),
  submissionController.getByAssignment
);

// Submission flow: click → initiate → confirm
router.post(
  '/:id/track-click',
  authenticate,
  authorize('student'),
  submissionController.trackClick
);

router.post(
  '/:id/initiate',
  authenticate,
  authorize('student'),
  submissionController.initiate
);

router.post(
  '/:id/confirm',
  authenticate,
  authorize('student'),
  validate(confirmSchema),
  submissionController.confirm
);

// ─── Admin routes ─────────────────────────────────────────────────────────────

// Dashboard badge count
router.get(
  '/pending-count',
  authenticate,
  authorize('admin'),
  submissionController.getPendingCount
);

// All submissions for an assignment
router.get(
  '/by-assignment/:assignmentId',
  authenticate,
  authorize('admin'),
  submissionController.getAllByAssignment
);

// Single submission detail
router.get(
  '/:id',
  authenticate,
  authorize('admin'),
  submissionController.getSubmission
);

// Grading
router.post(
  '/:id/save-grade',
  authenticate,
  authorize('admin'),
  validate(saveGradeSchema),
  submissionController.saveGrade
);

router.post(
  '/:id/publish-grade',
  authenticate,
  authorize('admin'),
  submissionController.publishGrade
);

// Bulk operations
router.post(
  '/bulk/publish',
  authenticate,
  authorize('admin'),
  validate(bulkPublishSchema),
  submissionController.bulkPublish
);

router.post(
  '/bulk/review',
  authenticate,
  authorize('admin'),
  validate(bulkReviewSchema),
  submissionController.bulkReview
);

// Legacy review endpoint (kept for Analytics.jsx group review)
router.post(
  '/:id/review',
  authenticate,
  authorize('admin'),
  validate(reviewSchema),
  submissionController.review
);

module.exports = router;
