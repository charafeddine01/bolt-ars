import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, '..', 'data');
const dbPath = path.join(dataDir, 'app.db');

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

export function openDb() {
  const db = new sqlite3.Database(dbPath);
  db.run('PRAGMA foreign_keys = ON');
  return db;
}

export function migrate() {
  const db = openDb();
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'admin',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      core TEXT NOT NULL,
      thickness INTEGER NOT NULL,
      facing TEXT NOT NULL,
      rValue REAL,
      uValue REAL,
      fireClass TEXT,
      color TEXT NOT NULL,
      profile TEXT NOT NULL,
      image TEXT NOT NULL,
      description TEXT NOT NULL,
      features TEXT NOT NULL,
      applications TEXT NOT NULL,
      specifications TEXT NOT NULL,
      datasheet TEXT,
      enabled INTEGER NOT NULL DEFAULT 1,
      deleted_at DATETIME
    )`);
  });
  db.close();
}

export async function seed() {
  const db = openDb();
  await new Promise((resolve, reject) => {
    db.serialize(() => {
      const adminUser = process.env.ADMIN_USER || 'admin';
      const adminPass = process.env.ADMIN_PASS || 'ChangeMe!123';
      const passHash = bcrypt.hashSync(adminPass, 12);
      db.run(
        `INSERT OR IGNORE INTO users (username, password_hash, role) VALUES (?, ?, 'admin')`,
        [adminUser, passHash]
      );

      const productsSeedPath = path.join(__dirname, '..', 'seed', 'products.json');
      const raw = fs.readFileSync(productsSeedPath, 'utf8');
      const items = JSON.parse(raw);
      const stmt = db.prepare(`INSERT OR IGNORE INTO products (
        id, name, type, core, thickness, facing, rValue, uValue, fireClass,
        color, profile, image, description, features, applications, specifications, datasheet, enabled
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
      for (const p of items) {
        stmt.run([
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
        ]);
      }
      stmt.finalize(err => (err ? reject(err) : resolve()));
    });
  });
  db.close();
}

if (process.argv[2] === 'migrate') {
  migrate();
  console.log('DB migrated at', dbPath);
} else if (process.argv[2] === 'seed') {
  migrate();
  seed().then(() => console.log('DB seeded')).catch(err => console.error(err));
}

