const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');

const User = require('../models/User');
const { requireAuth } = require('../middleware/auth.middleware');

const router = express.Router();

// Validation schema for user registration
const registrationSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(72),
});

// Validation schema for user login
const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(72),
});

// Helper to format user data for public responses (omitting password hash)
function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  };
}

// Helper to sign JWT and set secure HTTP-only cookie
function setAuthCookie(res, userId) {
  const token = jwt.sign(
    { sub: userId.toString() },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.cookie('onesphere_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

// Register a new user
router.post('/register', async (req, res, next) => {
  try {
    const result = registrationSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid name, email, and password of at least 8 characters.',
      });
    }

    const name = result.data.name;
    const email = result.data.email.toLowerCase();
    const { password } = result.data;

    // Check if user already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    // Hash password securely with bcrypt
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user in database
    const user = await User.create({
      name,
      email,
      passwordHash,
    });

    // Set authentication cookie
    setAuthCookie(res, user._id);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      user: publicUser(user),
    });
  } catch (error) {
    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    next(error);
  }
});

// Login existing user
router.post('/login', async (req, res, next) => {
  try {
    const result = loginSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email and password.',
      });
    }

    const email = result.data.email.toLowerCase();
    const { password } = result.data;

    // Find user and explicitly select passwordHash field
    const user = await User.findOne({ email }).select('+passwordHash');

    // Verify user exists and password matches
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Set authentication cookie
    setAuthCookie(res, user._id);

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      user: publicUser(user),
    });
  } catch (error) {
    next(error);
  }
});

// Get currently authenticated user profile
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);

    // Clear cookie and reject if user no longer exists in database
    if (!user) {
      res.clearCookie('onesphere_token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        path: '/',
      });

      return res.status(401).json({
        success: false,
        message: 'User account not found. Please log in again.',
      });
    }

    return res.status(200).json({
      success: true,
      user: publicUser(user),
    });
  } catch (error) {
    next(error);
  }
});

// Logout user by clearing the auth cookie
router.post('/logout', (req, res) => {
  res.clearCookie('onesphere_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
  });

  return res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  });
});

module.exports = router;