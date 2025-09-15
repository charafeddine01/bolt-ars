import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { openDb } from '../db.js';
import { authMiddleware } from '../auth.js';

export const router = Router();

router.get('/', (req, res) => {
  const enabledOnly = (req.query.enabled ?? '').toString().toLowerCase() === 'true';
  const db = openDb();
  const sql = enabledOnly ?
    'SELECT * FROM products WHERE enabled = 1 AND deleted_at IS NULL' :
    'SELECT * FROM products WHERE deleted_at IS NULL';
  db.all(sql, [], (err, rows) => {
    db.close();
    if (err) return res.status(500).json({ error: 'DB error' });
    const items = rows.map(fromRow);
    res.json(items);
  });
});

router.get('/:id', (req, res) => {
  const db = openDb();
  db.get('SELECT * FROM products WHERE id = ? AND deleted_at IS NULL', [req.params.id], (err, row) => {
    db.close();
    if (err) return res.status(500).json({ error: 'DB error' });
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(fromRow(row));
  });
});

router.post(
  '/',
  authMiddleware,
  body('id').isString().trim().notEmpty(),
  body('name').isString().trim().notEmpty(),
  body('type').isString().trim().notEmpty(),
  body('core').isString().trim().notEmpty(),
  body('thickness').isNumeric(),
  body('facing').isString().trim().notEmpty(),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const p = normalizeProduct(req.body);
    const db = openDb();
    const sql = `INSERT INTO products (
      id, name, type, core, thickness, facing, rValue, uValue, fireClass,
      color, profile, image, description, features, applications, specifications, datasheet, enabled
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const params = toParams(p);
    db.run(sql, params, function(err) {
      db.close();
      if (err) return res.status(400).json({ error: 'Insert failed', details: err.message });
      res.status(201).json(p);
    });
  }
);

router.put(
  '/:id',
  authMiddleware,
  (req, res) => {
    const p = normalizeProduct({ ...req.body, id: req.params.id });
    const db = openDb();
    const sql = `UPDATE products SET
      name=?, type=?, core=?, thickness=?, facing=?, rValue=?, uValue=?, fireClass=?,
      color=?, profile=?, image=?, description=?, features=?, applications=?, specifications=?, datasheet=?, enabled=?
      WHERE id=? AND deleted_at IS NULL`;
    const params = [
      p.name, p.type, p.core, p.thickness, p.facing, p.rValue ?? null, p.uValue ?? null, p.fireClass ?? null,
      JSON.stringify(p.color || []), p.profile, p.image, p.description,
      JSON.stringify(p.features || []), JSON.stringify(p.applications || []), JSON.stringify(p.specifications || {}),
      p.datasheet ?? null, p.enabled === false ? 0 : 1,
      p.id
    ];
    db.run(sql, params, function(err) {
      db.close();
      if (err) return res.status(400).json({ error: 'Update failed', details: err.message });
      if (this.changes === 0) return res.status(404).json({ error: 'Not found' });
      res.json(p);
    });
  }
);

router.patch('/:id/toggle', authMiddleware, (req, res) => {
  const db = openDb();
  db.run('UPDATE products SET enabled = CASE enabled WHEN 1 THEN 0 ELSE 1 END WHERE id = ? AND deleted_at IS NULL', [req.params.id], function(err) {
    if (err) {
      db.close();
      return res.status(500).json({ error: 'DB error' });
    }
    db.get('SELECT * FROM products WHERE id = ?', [req.params.id], (e, row) => {
      db.close();
      if (e || !row) return res.status(404).json({ error: 'Not found' });
      res.json(fromRow(row));
    });
  });
});

router.delete('/:id', authMiddleware, (req, res) => {
  const db = openDb();
  db.run('UPDATE products SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND deleted_at IS NULL', [req.params.id], function(err) {
    db.close();
    if (err) return res.status(500).json({ error: 'DB error' });
    if (this.changes === 0) return res.status(404).json({ error: 'Not found' });
    res.status(204).end();
  });
});

function normalizeProduct(b) {
  return {
    id: String(b.id),
    name: String(b.name),
    type: String(b.type),
    core: String(b.core),
    thickness: Number(b.thickness),
    facing: String(b.facing),
    rValue: b.rValue != null ? Number(b.rValue) : null,
    uValue: b.uValue != null ? Number(b.uValue) : null,
    fireClass: b.fireClass ?? null,
    color: Array.isArray(b.color) ? b.color.map(String) : [],
    profile: String(b.profile),
    image: String(b.image),
    description: String(b.description || ''),
    features: Array.isArray(b.features) ? b.features.map(String) : [],
    applications: Array.isArray(b.applications) ? b.applications.map(String) : [],
    specifications: b.specifications && typeof b.specifications === 'object' ? b.specifications : {},
    datasheet: b.datasheet ?? null,
    enabled: b.enabled !== false,
  };
}

function toParams(p) {
  return [
    p.id,
    p.name,
    p.type,
    p.core,
    p.thickness,
    p.facing,
    p.rValue ?? null,
    p.uValue ?? null,
    p.fireClass ?? null,
    JSON.stringify(p.color || []),
    p.profile,
    p.image,
    p.description,
    JSON.stringify(p.features || []),
    JSON.stringify(p.applications || []),
    JSON.stringify(p.specifications || {}),
    p.datasheet ?? null,
    p.enabled === false ? 0 : 1,
  ];
}

function fromRow(row) {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    core: row.core,
    thickness: row.thickness,
    facing: row.facing,
    rValue: row.rValue,
    uValue: row.uValue,
    fireClass: row.fireClass,
    color: safeParse(row.color, []),
    profile: row.profile,
    image: row.image,
    description: row.description,
    features: safeParse(row.features, []),
    applications: safeParse(row.applications, []),
    specifications: safeParse(row.specifications, {}),
    datasheet: row.datasheet,
    enabled: row.enabled === 1,
  };
}

function safeParse(json, fallback) {
  try { return JSON.parse(json); } catch { return fallback; }
}

