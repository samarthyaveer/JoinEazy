const groupService = require('../services/group.service');

async function create(req, res, next) {
  try {
    const group = await groupService.createGroup({
      name: req.body.name,
      assignmentId: parseInt(req.params.assignmentId),
      userId: req.user.id,
    });
    res.status(201).json({ group });
  } catch (err) {
    next(err);
  }
}

async function getByAssignment(req, res, next) {
  try {
    const groups = await groupService.getGroupsByAssignment(
      parseInt(req.params.assignmentId)
    );
    res.json({ groups });
  } catch (err) {
    next(err);
  }
}

async function getMyGroups(req, res, next) {
  try {
    const groups = await groupService.getMyGroups(req.user.id);
    res.json({ groups });
  } catch (err) {
    next(err);
  }
}

async function getDetails(req, res, next) {
  try {
    const group = await groupService.getGroupDetails(parseInt(req.params.groupId));
    res.json({ group });
  } catch (err) {
    next(err);
  }
}

async function addMember(req, res, next) {
  try {
    const result = await groupService.addMember({
      groupId: parseInt(req.params.groupId),
      email: req.body.email,
      requestUserId: req.user.id,
    });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

async function removeMember(req, res, next) {
  try {
    const result = await groupService.removeMember({
      groupId: parseInt(req.params.groupId),
      targetUserId: parseInt(req.params.userId),
      requestUserId: req.user.id,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { create, getByAssignment, getMyGroups, getDetails, addMember, removeMember };
