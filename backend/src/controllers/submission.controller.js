const submissionService = require('../services/submission.service');

// Safe parseInt with 400 error on invalid input
function parseIntParam(val, name = 'id') {
  const n = parseInt(val, 10);
  if (isNaN(n) || n <= 0) {
    const err = new Error(`Invalid ${name} parameter`);
    err.status = 400;
    throw err;
  }
  return n;
}

// ─── Student-facing ─────────────────────────────────────────────────────────

async function trackClick(req, res, next) {
  try {
    const result = await submissionService.trackLinkClick(
      parseIntParam(req.params.id),
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
      parseIntParam(req.params.id),
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
      parseIntParam(req.params.id),
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

// Get own submission for a given assignment
async function getByAssignment(req, res, next) {
  try {
    const submission = await submissionService.getSubmissionByAssignmentAndUser(
      parseIntParam(req.params.assignmentId, 'assignmentId'),
      req.user.id
    );
    // Return null (not 404) — student may not have submitted yet
    res.json({ submission: submission || null });
  } catch (err) {
    next(err);
  }
}

// ─── Admin-facing ────────────────────────────────────────────────────────────

// Single submission detail (admin only)
async function getSubmission(req, res, next) {
  try {
    const submission = await submissionService.getSubmission(
      parseIntParam(req.params.id)
    );
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    res.json({ submission });
  } catch (err) {
    next(err);
  }
}

// All submissions for an assignment (admin only)
// Supports ?status=graded|ungraded|late and ?sort=newest|oldest|name
async function getAllByAssignment(req, res, next) {
  try {
    const assignmentId = parseIntParam(req.params.assignmentId, 'assignmentId');
    const { status, sort } = req.query;

    const submissions = await submissionService.getAllSubmissionsForAssignment(
      assignmentId,
      { status, sort }
    );
    res.json({ submissions: submissions || [] });
  } catch (err) {
    next(err);
  }
}

// Save a grade draft (does NOT publish to student)
async function saveGrade(req, res, next) {
  try {
    const id = parseIntParam(req.params.id);
    const { scores, totalScore, totalMarks, feedback } = req.body;

    const result = await submissionService.saveGrade(id, {
      scores,
      totalScore,
      totalMarks,
      feedback,
      gradedBy: req.user.id,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

// Publish a graded submission (makes it visible to the student)
async function publishGrade(req, res, next) {
  try {
    const id = parseIntParam(req.params.id);

    const result = await submissionService.publishGrade(id, {
      publishedBy: req.user.id,
      publishedAt: new Date(),
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

// Bulk publish multiple graded submissions
async function bulkPublish(req, res, next) {
  try {
    const { submissionIds } = req.body;

    const result = await submissionService.bulkPublishGrades(
      submissionIds.map((id) => parseInt(id, 10)),
      {
        publishedBy: req.user.id,
        publishedAt: new Date(),
      }
    );

    res.json({
      succeeded: result.count,
      failed: submissionIds.length - result.count,
      errors: [],
    });
  } catch (err) {
    next(err);
  }
}

// Review a submission (accept / reject with feedback)
// Normalises legacy 'graded' → 'accepted'
async function review(req, res, next) {
  try {
    const id = parseIntParam(req.params.id);
    const { evaluationStatus, feedback, userId } = req.body;

    const normalised =
      evaluationStatus === 'accepted' || evaluationStatus === 'graded'
        ? 'accepted'
        : 'rejected';

    const result = await submissionService.reviewSubmission(id, {
      evaluationStatus: normalised,
      feedback: feedback || '',
      userId: userId || null,
      reviewedBy: req.user.id,
      reviewedAt: new Date(),
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

// Bulk review (mark several submissions as graded at once)
async function bulkReview(req, res, next) {
  try {
    const { submissionIds, evaluationStatus, feedback } = req.body;

    const results = await Promise.allSettled(
      submissionIds.map((rawId) =>
        submissionService.reviewSubmission(parseInt(rawId, 10), {
          evaluationStatus,
          feedback: feedback || '',
          reviewedBy: req.user.id,
          reviewedAt: new Date(),
        })
      )
    );

    const succeeded = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    res.json({
      message: `Processed ${submissionIds.length} submissions`,
      succeeded,
      failed,
    });
  } catch (err) {
    next(err);
  }
}

// Count of submissions awaiting grading (used for dashboard badge)
async function getPendingCount(req, res, next) {
  try {
    const pending = await submissionService.getPendingReviewCount();
    res.json(pending || { count: 0, oldestSubmission: null });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  // Student
  trackClick,
  initiate,
  confirm,
  getByAssignment,
  // Admin
  getSubmission,
  getAllByAssignment,
  saveGrade,
  publishGrade,
  bulkPublish,
  review,
  bulkReview,
  getPendingCount,
};
