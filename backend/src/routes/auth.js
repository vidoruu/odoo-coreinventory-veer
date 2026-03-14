import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/connection.js';
import { generateToken, requireAuth } from '../middleware/auth.js';

const router = Router();

// POST /api/auth/register
router.post('/register', (req, res) => {
  try {
    const { name, username, password } = req.body;
    if (!name || !username || !password) {
      return res.status(400).json({ error: 'Name, username, and password are required' });
    }

    const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const id = uuidv4();
    const hash = bcrypt.hashSync(password, 10);
    const role = 'staff'; // default role

    db.prepare('INSERT INTO users (id, name, username, password_hash, role) VALUES (?, ?, ?, ?, ?)')
      .run(id, name, username, hash, role);

    const newUser = { id, name, username, role };
    const token = generateToken(newUser);

    res.status(201).json({ message: 'User registered successfully', token, user: newUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const token = generateToken(user);
    res.json({ 
      message: 'Login successful', 
      token, 
      user: { id: user.id, name: user.name, username: user.username, role: user.role } 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', (req, res) => {
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: 'Username is required' });

    const user = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (!user) {
      // Don't leak whether the user exists, just return success
      return res.json({ message: 'If the username exists, an OTP has been sent (simulated).' });
    }

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    // Set expiration to 15 minutes from now
    const expiresAt = Math.floor(Date.now() / 1000) + 15 * 60;

    db.prepare('UPDATE users SET otp = ?, otp_expires_at = ? WHERE username = ?')
      .run(otp, expiresAt, username);

    // In a real app we would send the email here. For this hackathon, we'll return it in dev mode (or print to console).
    console.log(`[AUTH] OTP for ${username} is: ${otp}`);
    
    res.json({ message: 'OTP generated successfully (check server logs for OTP)', otp }); // Note: exposing OTP in response for testing/hackathon purposes
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error during password reset request' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', (req, res) => {
  try {
    const { username, otp, newPassword } = req.body;
    if (!username || !otp || !newPassword) {
      return res.status(400).json({ error: 'Username, OTP, and new password are required' });
    }

    const user = db.prepare('SELECT id, otp, otp_expires_at FROM users WHERE username = ?').get(username);
    if (!user) {
      return res.status(400).json({ error: 'Invalid request' });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    const now = Math.floor(Date.now() / 1000);
    if (user.otp_expires_at < now) {
      return res.status(400).json({ error: 'OTP has expired' });
    }

    const hash = bcrypt.hashSync(newPassword, 10);
    db.prepare('UPDATE users SET password_hash = ?, otp = NULL, otp_expires_at = NULL WHERE username = ?')
      .run(hash, username);

    res.json({ message: 'Password reset successfully. You can now login.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error during password reset' });
  }
});

// GET /api/auth/me (Get current user)
router.get('/me', requireAuth, (req, res) => {
  try {
    const user = db.prepare('SELECT id, name, username, role FROM users WHERE id = ?').get(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
