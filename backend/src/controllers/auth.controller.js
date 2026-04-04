const authService = require('../services/auth.service');
const { getCookieOptions, verifyToken } = require('../utils/token');

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
  res.clearCookie('token', { ...getCookieOptions(), maxAge: 0 });
  res.json({ message: 'Logged out' });
}

async function getMe(req, res, next) {
  try {
    const token = req.cookies?.token;
    if (!token) {
      return res.json({ user: null });
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      return res.json({ user: null });
    }

    const profile = await authService.getProfile(decoded.id);
    if (!profile) {
      return res.json({ user: null });
    }
    res.json({ user: profile });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, logout, getMe };
