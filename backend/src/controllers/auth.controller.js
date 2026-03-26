const authService = require('../services/auth.service');
const { getCookieOptions } = require('../utils/token');

async function register(req, res, next) {
  try {
    const { fullName, email, password, role } = req.body;
    const { user, token } = await authService.register({ fullName, email, password, role });
    res.cookie('token', token, getCookieOptions());
    res.status(201).json({ user });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const { user, token } = await authService.login({ email, password });
    res.cookie('token', token, getCookieOptions());
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

async function logout(_req, res) {
  res.clearCookie('token', { path: '/' });
  res.json({ message: 'Logged out' });
}

async function getMe(req, res, next) {
  try {
    const profile = await authService.getProfile(req.user.id);
    if (!profile) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user: profile });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, logout, getMe };
