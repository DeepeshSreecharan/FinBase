// controllers/auth.controller.js
const bcrypt = require('bcryptjs');
const User = require('../models/UserModel');
const Account = require('../models/AccountModel');
const { generateToken } = require('../utils/jwt.service');
const { sendWelcomeEmail } = require('../utils/mailer');

/**
 * Helpers
 */
const escapeRegExp = (string = '') =>
  string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const normalizeEmail = (email = '') => (typeof email === 'string' ? email.trim().toLowerCase() : email);

/**
 * Env-driven defaults (flexible for local / render / vercel)
 */
const ACCOUNT_PREFIX = process.env.ACCOUNT_PREFIX || 'CBI';
const INITIAL_BALANCE = Number(process.env.INITIAL_BALANCE) || 1000;
const BCRYPT_SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS, 10) || 12;

const authController = {
  /**
   * Register a new user
   * - Expects: { name, email, phone, password, dateOfBirth?, address? }
   */
  register: async (req, res) => {
    try {
      const { name, email, phone, password, dateOfBirth, address } = req.body || {};

      // Basic validation
      if (!name || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: name, email and password are required.'
        });
      }

      const normalizedEmail = normalizeEmail(email);

      // Case-insensitive email check
      const emailQuery = { email: { $regex: `^${escapeRegExp(normalizedEmail)}$`, $options: 'i' } };
      const existingUser = await User.findOne(emailQuery);

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Email already registered'
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

      // Create user
      const user = new User({
        name,
        email: normalizedEmail,
        phone,
        password: hashedPassword,
        dateOfBirth,
        address,
        role: 'customer'
      });

      await user.save();

      // Create savings account for the user
      const accountNumber = `${ACCOUNT_PREFIX}${Date.now()}${Math.floor(Math.random() * 1000)}`;

      const account = new Account({
        userId: user._id,
        accountNumber,
        accountType: 'savings',
        balance: INITIAL_BALANCE,
        status: 'active'
      });

      await account.save();

      // Send welcome email (optional - non-fatal)
      (async () => {
        try {
          if (typeof sendWelcomeEmail === 'function') {
            await sendWelcomeEmail(user.email, user.name, accountNumber);
          }
        } catch (err) {
          // Don't fail registration because of email issues
          if (process.env.NODE_ENV === 'development') {
            console.warn('sendWelcomeEmail error (ignored):', err?.message || err);
          }
        }
      })();

      // Generate token
      const token = generateToken(user._id);

      const userPayload = {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        accountNumber,
        balance: account.balance
      };

      // Return both new and legacy shapes for compatibility
      return res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          token,
          user: userPayload
        },
        // Legacy top-level fields for older frontend code
        token,
        user: userPayload
      });
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[auth.register] error:', error);
      }
      return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
  },

  /**
   * Login existing user
   * - Accepts either:
   *    { identifier: 'emailOrPhone', password }  OR  { email, password }
   * - Returns token + basic user info + account info
   */
  login: async (req, res) => {
    try {
      // Accept flexible payloads
      const { identifier, email, phone, password } = req.body || {};
      const providedPassword = password;

      if (!providedPassword) {
        return res.status(400).json({ success: false, message: 'Password is required.' });
      }

      // Resolve identifier to an email or phone query
      let user = null;
      if (identifier) {
        // try email first (case-insensitive), then phone
        const maybeEmail = identifier.includes('@') ? normalizeEmail(identifier) : null;
        if (maybeEmail) {
          user = await User.findOne({ email: { $regex: `^${escapeRegExp(maybeEmail)}$`, $options: 'i' } });
        }
        if (!user) {
          // attempt phone match
          user = await User.findOne({ phone: identifier });
        }
      } else if (email) {
        user = await User.findOne({ email: { $regex: `^${escapeRegExp(normalizeEmail(email))}$`, $options: 'i' } });
      } else if (phone) {
        user = await User.findOne({ phone });
      } else {
        return res.status(400).json({ success: false, message: 'Please provide email/phone (identifier) and password.' });
      }

      if (!user) {
        return res.status(400).json({ success: false, message: 'User not found' });
      }

      // Compare password
      const isMatch = await bcrypt.compare(providedPassword, user.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      // Get user's account (if any)
      const account = await Account.findOne({ userId: user._id });

      // Generate token
      const token = generateToken(user._id);

      // Build user payload (safe, no password)
      const userPayload = {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        accountNumber: account?.accountNumber || null,
        balance: account?.balance || 0
      };

      // Compatibility response: include both new and old shapes
      return res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          token,
          user: userPayload
        },
        // Old/legacy top-level fields (for older frontend expecting them)
        token,
        user: userPayload
      });
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[auth.login] error:', error);
      }
      return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
  },

  /**
   * Get user profile
   * - expects req.userId to be set (via auth middleware)
   */
  getProfile: async (req, res) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const user = await User.findById(userId).select('-password');
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const account = await Account.findOne({ userId });

      return res.json({
        success: true,
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            dateOfBirth: user.dateOfBirth,
            address: user.address,
            accountNumber: account?.accountNumber || null,
            balance: account?.balance || 0
          }
        }
      });
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[auth.getProfile] error:', error);
      }
      return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
  },

  /**
   * Update profile
   */
  updateProfile: async (req, res) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const { name, phone, address } = req.body || {};

      const user = await User.findByIdAndUpdate(
        userId,
        { ...(name ? { name } : {}), ...(phone ? { phone } : {}), ...(address ? { address } : {}) },
        { new: true }
      ).select('-password');

      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      return res.json({
        success: true,
        message: 'Profile updated successfully',
        data: { user }
      });
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[auth.updateProfile] error:', error);
      }
      return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
  }
};

module.exports = authController;
