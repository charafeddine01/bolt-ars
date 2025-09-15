import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import { openDb } from '../db.js';
import { signToken } from '../auth.js';

export const router = Router();

router.post(
  '/login',
  body('username').isString().trim().notEmpty(),
  body('password').isString().isLength({ min: 8 }),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;
    const db = openDb();
    db.get('SELECT id, username, password_hash, role FROM users WHERE username = ?', [username], (err, row) => {
      if (err) {
        db.close();
        return res.status(500).json({ error: 'DB error' });
      }
      if (!row || !bcrypt.compareSync(password, row.password_hash)) {
        db.close();
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      const token = signToken({ sub: row.id, username: row.username, role: row.role });
      db.close();
      return res.json({ token, user: { id: row.id, username: row.username, role: row.role } });
    });
  }
);

