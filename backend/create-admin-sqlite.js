import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import bcrypt from 'bcryptjs';

async function run() {
  const db = await open({ filename: './prisma/dev.db', driver: sqlite3.Database });

  // Create User table if not exists (simple mapping from Prisma schema)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS User (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      passwordHash TEXT NOT NULL,
      rol TEXT NOT NULL DEFAULT 'USER',
      isActive INTEGER NOT NULL DEFAULT 1,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      lastLogin TEXT
    );
  `);

  const email = 'admin@basketball.com';
  const exists = await db.get('SELECT id FROM User WHERE email = ?', email);
  if (exists) {
    console.log('⚠️  Admin user already exists with that email');
    await db.close();
    return;
  }

  const password = 'admin123';
  const hash = await bcrypt.hash(password, 10);

  const result = await db.run(
    'INSERT INTO User (nombre, email, passwordHash, rol) VALUES (?, ?, ?, ?)',
    'Administrator',
    email,
    hash,
    'ADMIN'
  );

  console.log('✅ Admin user created successfully!');
  console.log('📧 Email:', email);
  console.log('🔑 Password: admin123');
  console.log('🆔 ID:', result.lastID);

  await db.close();
}

run().catch(err => {
  console.error('❌ Error creating admin (sqlite):', err);
});
