const router = require('express').Router();
const Joi = require('joi');
const { validate } = require('../middleware/validate');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');
const groupController = require('../controllers/group.controller');

// Validation schemas
const createGroupSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
});

const addMemberSchema = Joi.object({
  email: Joi.string().email().trim().lowercase().required(),
});

// Student's own groups
router.get('/my', authenticate, authorize('student'), groupController.getMyGroups);

// Groups for a specific assignment
router.get('/assignment/:assignmentId', authenticate, groupController.getByAssignment);

// Group details
router.get('/:groupId', authenticate, groupController.getDetails);

// Create a group for an assignment
router.post(
  '/assignment/:assignmentId',
  authenticate,
  authorize('student'),
  validate(createGroupSchema),
  groupController.create
);

// Add member to group
router.post(
  '/:groupId/members',
  authenticate,
  authorize('student'),
  validate(addMemberSchema),
  groupController.addMember
);

// Remove member from group
router.delete(
  '/:groupId/members/:userId',
  authenticate,
  authorize('student'),
  groupController.removeMember
);

module.exports = router;
