const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../database/database');

// Generate JWT Token
const generateToken = (id, email, role) => {
  return jwt.sign(
    { id, email, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

// @desc    Register user (student only - no admin registration)
// @route   POST /api/auth/register
const register = async (req, res) => {
  try {
    const { email, password, name, roll_number, department, year, phone } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();
    const db = getDb();

    if (!normalizedEmail) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Check if user exists
    const existingUserResult = await db.query('SELECT * FROM users WHERE email = $1', [normalizedEmail]);
    const existingUser = existingUserResult.rows[0];
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user (always as student - no admin registration)
    const result = await db.query(
      `INSERT INTO users (email, password, name, roll_number, department, year, phone, role) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'student')
       RETURNING id`,
      [normalizedEmail, hashedPassword, name, roll_number, department, year, phone]
    );

    const user = {
      id: result.rows[0].id,
      email: normalizedEmail,
      name,
      roll_number,
      department,
      year,
      phone,
      role: 'student'
    };

    const token = generateToken(user.id, user.email, user.role);

    res.status(201).json({
      success: true,
      token,
      user
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();
    const db = getDb();

    if (!normalizedEmail || !password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const userResult = await db.query('SELECT * FROM users WHERE email = $1', [normalizedEmail]);
    const user = userResult.rows[0];

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user.id, user.email, user.role);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roll_number: user.roll_number,
        department: user.department,
        year: user.year,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const db = getDb();
    const userResult = await db.query(
      'SELECT id, email, name, roll_number, department, year, phone, role FROM users WHERE id = $1',
      [req.user.id]
    );
    res.json(userResult.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { register, login, getMe };