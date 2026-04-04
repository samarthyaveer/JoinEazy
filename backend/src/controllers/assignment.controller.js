const assignmentService = require('../services/assignment.service');

async function create(req, res, next) {
  try {
    const assignment = await assignmentService.createAssignment({
      ...req.body,
      createdBy: req.user.id,
    });
    res.status(201).json({ assignment });
  } catch (err) {
    next(err);
  }
}

async function getAll(req, res, next) {
  try {
    const assignments = await assignmentService.getAssignments(req.user);
    res.json({ assignments });
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const assignment = await assignmentService.getAssignmentById(
      parseInt(req.params.id),
      req.user
    );
    res.json({ assignment });
  } catch (err) {
    next(err);
  }
}

async function getStats(req, res, next) {
  try {
    const stats = await assignmentService.getAssignmentStats(
      parseInt(req.params.id, 10)
    );
    res.json(stats);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const assignment = await assignmentService.updateAssignment(
      parseInt(req.params.id),
      req.body,
      req.user.id
    );
    res.json({ assignment });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await assignmentService.deleteAssignment(parseInt(req.params.id));
    res.json({ message: 'Assignment deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = { create, getAll, getById, getStats, update, remove };
