const router = require('express').Router();
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');
const professorController = require('../controllers/professor.controller');

router.get(
  '/activity',
  authenticate,
  authorize('admin'),
  professorController.getActivity
);

module.exports = router;
