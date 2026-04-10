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
    const db = getDb();

    // Check if user exists
    const existingUser = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user (always as student - no admin registration)
    const result = await db.run(
      `INSERT INTO users (email, password, name, roll_number, department, year, phone, role) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 'student')`,
      [email, hashedPassword, name, roll_number, department, year, phone]
    );

    const user = {
      id: result.lastID,
      email,
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
    const db = getDb();

    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);

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
    const user = await db.get(
      'SELECT id, email, name, roll_number, department, year, phone, role FROM users WHERE id = ?',
      [req.user.id]
    );
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { register, login, getMe };