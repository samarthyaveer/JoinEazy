const now = Date.now();

const hoursAgo = (hours) =>
  new Date(now - hours * 60 * 60 * 1000).toISOString();

export const MOCK_ASSIGNMENT = {
  id: 1,
  title: "Linear Algebra Quiz 3",
  totalMarks: 100,
};

export const MOCK_SUBMISSIONS = [
  {
    id: "sub-1",
    assignmentId: 1,
    studentId: "stu-1",
    studentName: "Aarav Patel",
    studentEmail: "aarav@student.edu",
    submitted_at: hoursAgo(3.2),
    totalScore: 92,
    totalMarks: 100,
    status: "graded",
    isLate: false,
    regradeRequested: false,
  },
  {
    id: "sub-2",
    assignmentId: 1,
    studentId: "stu-2",
    studentName: "Priya Verma",
    studentEmail: "priya@student.edu",
    submitted_at: hoursAgo(10.5),
    totalScore: 77,
    totalMarks: 100,
    status: "graded",
    isLate: false,
    regradeRequested: true,
    regradeReason: "I believe my answer to Q2 was correct.",
  },
  {
    id: "sub-3",
    assignmentId: 1,
    studentId: "stu-3",
    studentName: "Rohan Gupta",
    studentEmail: "rohan@student.edu",
    submitted_at: hoursAgo(28),
    totalScore: 68,
    totalMarks: 100,
    status: "graded",
    isLate: true,
    regradeRequested: false,
  },
  {
    id: "sub-4",
    assignmentId: 1,
    studentId: "stu-4",
    studentName: "Sneha Joshi",
    studentEmail: "sneha@student.edu",
    submitted_at: hoursAgo(44),
    totalScore: 55,
    totalMarks: 100,
    status: "graded",
    isLate: false,
    regradeRequested: false,
  },
  {
    id: "sub-5",
    assignmentId: 1,
    studentId: "stu-5",
    studentName: "Karthik Nair",
    studentEmail: "karthik@student.edu",
    submitted_at: hoursAgo(60),
    totalScore: 45,
    totalMarks: 100,
    status: "ungraded",
    isLate: true,
    regradeRequested: false,
  },
  {
    id: "sub-6",
    assignmentId: 1,
    studentId: "stu-6",
    studentName: "Ananya Iyer",
    studentEmail: "ananya@student.edu",
    submitted_at: hoursAgo(72),
    totalScore: null,
    totalMarks: 100,
    status: "ungraded",
    isLate: false,
    regradeRequested: false,
  },
  {
    id: "sub-7",
    assignmentId: 1,
    studentId: "stu-7",
    studentName: "Devansh Roy",
    studentEmail: "devansh@student.edu",
    submitted_at: hoursAgo(96),
    totalScore: null,
    totalMarks: 100,
    status: "ungraded",
    isLate: false,
    regradeRequested: true,
    regradeReason: "Please review Q4, I attached the right reference.",
  },
  {
    id: "sub-8",
    assignmentId: 1,
    studentId: "stu-8",
    studentName: "Maya Shah",
    studentEmail: "maya@student.edu",
    submitted_at: hoursAgo(132),
    totalScore: 83,
    totalMarks: 100,
    status: "graded",
    isLate: false,
    regradeRequested: false,
  },
];

const QUESTION_BANK = [
  {
    id: "q1",
    text: "Define an eigenvector in your own words.",
    correctAnswer:
      "A non-zero vector that only scales under a linear transform.",
    maxMarks: 25,
    mostCommonWrong: "A vector that changes direction under a transform.",
  },
  {
    id: "q2",
    text: "What is the determinant of a 2x2 matrix [[a,b],[c,d]]?",
    correctAnswer: "ad - bc",
    maxMarks: 25,
    mostCommonWrong: "ab - cd",
  },
  {
    id: "q3",
    text: "Name one application of eigenvalues in real-world systems.",
    correctAnswer: "Stability analysis in dynamical systems (or PCA).",
    maxMarks: 25,
    mostCommonWrong: "Sorting algorithms.",
  },
  {
    id: "q4",
    text: "If a matrix has eigenvalues 2 and 5, what is its trace?",
    correctAnswer: "7",
    maxMarks: 25,
    mostCommonWrong: "10",
  },
];

const SUBMISSION_RESPONSES = {
  "sub-1": {
    feedback: "Strong explanation and clean work throughout.",
    answers: {
      q1: { answer: "A vector that changes only by a scalar.", score: 25 },
      q2: { answer: "ad - bc", score: 25 },
      q3: { answer: "Used in PCA for dimensionality reduction.", score: 22 },
      q4: { answer: "7", score: 20 },
    },
  },
  "sub-2": {
    feedback: "Solid attempt. Q2 needs a cleaner determinant formula.",
    answers: {
      q1: { answer: "A vector that scales under a matrix.", score: 22 },
      q2: { answer: "ab - cd", score: 10 },
      q3: { answer: "Stability of systems.", score: 20 },
      q4: { answer: "7", score: 25 },
    },
  },
  "sub-3": {
    feedback: "Please review determinant and trace properties.",
    answers: {
      q1: { answer: "A vector that changes direction.", score: 10 },
      q2: { answer: "ab - cd", score: 0 },
      q3: { answer: "PCA is an example.", score: 18 },
      q4: { answer: "10", score: 20 },
    },
  },
  "sub-4": {
    feedback: "Keep practicing with examples.",
    answers: {
      q1: { answer: "A vector that scales.", score: 18 },
      q2: { answer: "ad - bc", score: 25 },
      q3: { answer: "Eigenvalues help in stability analysis.", score: 12 },
      q4: { answer: "7", score: 0 },
    },
  },
  "sub-5": {
    feedback: "Late submission. Try to show full steps.",
    answers: {
      q1: { answer: "A vector that changes direction.", score: 6 },
      q2: { answer: "ad - bc", score: 20 },
      q3: { answer: "Sorting algorithms.", score: 5 },
      q4: { answer: "10", score: 14 },
    },
  },
  "sub-6": {
    feedback: "",
    answers: {
      q1: { answer: "", score: 0 },
      q2: { answer: "", score: 0 },
      q3: { answer: "", score: 0 },
      q4: { answer: "", score: 0 },
    },
  },
  "sub-7": {
    feedback: "",
    answers: {
      q1: { answer: "A vector that scales.", score: 12 },
      q2: { answer: "ad - bc", score: 18 },
      q3: { answer: "Used in PCA.", score: 16 },
      q4: { answer: "7", score: 20 },
    },
  },
  "sub-8": {
    feedback: "Great progress. Keep it up.",
    answers: {
      q1: { answer: "A non-zero vector that scales.", score: 23 },
      q2: { answer: "ad - bc", score: 25 },
      q3: { answer: "Stability analysis.", score: 15 },
      q4: { answer: "7", score: 20 },
    },
  },
};

const buildQuestionStats = () =>
  QUESTION_BANK.map((q) => {
    const answers = MOCK_SUBMISSIONS.map((submission) => {
      const response = SUBMISSION_RESPONSES[submission.id]?.answers?.[q.id] || {
        answer: "",
        score: 0,
      };
      return {
        studentId: submission.studentId,
        studentName: submission.studentName,
        answer: response.answer,
        isCorrect: response.score === q.maxMarks,
        score: response.score,
      };
    });

    return {
      id: q.id,
      text: q.text,
      correctAnswer: q.correctAnswer,
      maxMarks: q.maxMarks,
      answers,
    };
  });

export const MOCK_STATS = {
  assignment: MOCK_ASSIGNMENT,
  submissionCount: MOCK_SUBMISSIONS.length,
  gradedCount: MOCK_SUBMISSIONS.filter((s) => s.status === "graded").length,
  averageScore: 75.0,
  passRate: 80.0,
  highestScore: 92,
  lowestScore: 45,
  submissions: MOCK_SUBMISSIONS,
  questions: buildQuestionStats(),
};

export const MOCK_ACTIVITY = [
  {
    type: "submitted",
    studentName: "Aarav Patel",
    assignmentName: "Linear Algebra Quiz 3",
    timestamp: hoursAgo(2),
  },
  {
    type: "regrade",
    studentName: "Priya Verma",
    assignmentName: "Linear Algebra Quiz 3",
    timestamp: hoursAgo(6),
  },
  {
    type: "published",
    studentName: "",
    assignmentName: "Linear Algebra Quiz 2",
    count: 18,
    timestamp: hoursAgo(14),
  },
  {
    type: "submitted",
    studentName: "Maya Shah",
    assignmentName: "Linear Algebra Quiz 3",
    timestamp: hoursAgo(22),
  },
  {
    type: "submitted",
    studentName: "Rohan Gupta",
    assignmentName: "Linear Algebra Quiz 3",
    timestamp: hoursAgo(26),
  },
];

export const getMockSubmissionDetail = (submissionId) => {
  const submission = MOCK_SUBMISSIONS.find((s) => s.id === submissionId);
  if (!submission) return null;

  const responseSet = SUBMISSION_RESPONSES[submissionId] || {
    feedback: "",
    answers: {},
  };

  const questions = QUESTION_BANK.map((q, index) => {
    const response = responseSet.answers[q.id] || { answer: "", score: 0 };
    return {
      id: q.id,
      order: index + 1,
      text: q.text,
      studentAnswer: response.answer,
      correctAnswer: q.correctAnswer,
      maxMarks: q.maxMarks,
      autoScore: response.score,
      isCorrect: response.score === q.maxMarks,
      mostCommonWrong: q.mostCommonWrong,
    };
  });

  return {
    id: submission.id,
    assignmentId: submission.assignmentId,
    assignmentTitle: MOCK_ASSIGNMENT.title,
    totalMarks: MOCK_ASSIGNMENT.totalMarks,
    student: {
      id: submission.studentId,
      name: submission.studentName,
      email: submission.studentEmail,
    },
    submitted_at: submission.submitted_at,
    isLate: submission.isLate,
    regradeRequested: submission.regradeRequested,
    regradeReason: submission.regradeReason,
    questions,
    feedback: responseSet.feedback,
  };
};
