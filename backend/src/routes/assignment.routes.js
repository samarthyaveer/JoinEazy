const router = require('express').Router();
const Joi = require('joi');
const { validate } = require('../middleware/validate');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');
const assignmentController = require('../controllers/assignment.controller');

// Validation schemas
const createSchema = Joi.object({
  title: Joi.string().min(2).max(255).required(),
  description: Joi.string().allow('', null),
  dueDate: Joi.date().iso().required(),
  onedriveLink: Joi.string().uri().required(),
  maxGroupSize: Joi.number().integer().min(1).max(20).default(4),
});

const updateSchema = Joi.object({
  title: Joi.string().min(2).max(255),
  description: Joi.string().allow('', null),
  dueDate: Joi.date().iso(),
  onedriveLink: Joi.string().uri(),
  maxGroupSize: Joi.number().integer().min(1).max(20),
}).min(1);

// Routes
router.get('/', authenticate, assignmentController.getAll);
router.get('/:id', authenticate, assignmentController.getById);
router.post('/', authenticate, authorize('admin'), validate(createSchema), assignmentController.create);
router.put('/:id', authenticate, authorize('admin'), validate(updateSchema), assignmentController.update);
router.delete('/:id', authenticate, authorize('admin'), assignmentController.remove);

module.exports = router;
