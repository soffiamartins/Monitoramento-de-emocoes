import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '..', 'mood_tracker.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error(' Erro ao conectar com o banco de dados:', err);
  } else {
    console.log(' Conectado ao SQLite Database');
    initializeDatabase();
  }
});

function initializeDatabase() {
  // **TABELA USERS ATUALIZADA - COM PASSWORD**
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) console.error(' Erro criar tabela users:', err);
    else console.log(' Tabela users criada/verificada (com password)');
  });

  // Tabela de registros de humor
  db.run(`
    CREATE TABLE IF NOT EXISTS mood_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      date DATE NOT NULL,
      mood TEXT NOT NULL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id),
      UNIQUE(user_id, date)
    )
  `, (err) => {
    if (err) console.error(' Erro criar tabela mood_entries:', err);
    else console.log(' Tabela mood_entries criada/verificada');
  });

  // Tabela de recomendações
  db.run(`
    CREATE TABLE IF NOT EXISTS recommendations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mood_type TEXT NOT NULL,
      category TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      link TEXT,
      type TEXT NOT NULL
    )
  `, (err) => {
    if (err) console.error(' Erro criar tabela recommendations:', err);
    else console.log(' Tabela recommendations criada/verificada');
  });
}

export default db;