const bcrypt = require('bcryptjs');
const { query } = require('../config/db');
const { signToken } = require('../utils/token');
const { BadRequestError, UnauthorizedError, ConflictError } = require('../utils/errors');

const SALT_ROUNDS = 12;

/**
 * Register a new user.
 */
async function register({ fullName, email, password, role }) {
  // Check if email already exists
  const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length > 0) {
    throw new ConflictError('An account with this email already exists');
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  // Insert user
  const result = await query(
    `INSERT INTO users (full_name, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, full_name, email, role, created_at`,
    [fullName, email, passwordHash, role]
  );

  const user = result.rows[0];

  // Generate token
  const token = signToken({ id: user.id, email: user.email, role: user.role });

  return { user, token };
}

/**
 * Authenticate user credentials.
 */
async function login({ email, password }) {
  const result = await query(
    'SELECT id, full_name, email, password_hash, role FROM users WHERE email = $1',
    [email]
  );

  if (result.rows.length === 0) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const user = result.rows[0];
  const valid = await bcrypt.compare(password, user.password_hash);

  if (!valid) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const token = signToken({ id: user.id, email: user.email, role: user.role });

  // Remove hash before returning
  const { password_hash, ...safeUser } = user;
  return { user: safeUser, token };
}

/**
 * Get user profile by ID.
 */
async function getProfile(userId) {
  const result = await query(
    'SELECT id, full_name, email, role, created_at FROM users WHERE id = $1',
    [userId]
  );
  return result.rows[0] || null;
}

module.exports = { register, login, getProfile };
