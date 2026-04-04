const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { errorHandler } = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/auth.routes');
const assignmentRoutes = require('./routes/assignment.routes');
const groupRoutes = require('./routes/group.routes');
const submissionRoutes = require('./routes/submission.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const professorRoutes = require('./routes/professor.routes');

const app = express();

// ---------------------
// Global Middleware
// ---------------------
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

// ---------------------
// Health check
// ---------------------
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ---------------------
// API Routes
// ---------------------
app.use('/api/auth', authRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/professor', professorRoutes);

// ---------------------
// 404 handler
// ---------------------
app.use((_req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// ---------------------
// Centralized error handler
// ---------------------
app.use(errorHandler);

module.exports = app;
