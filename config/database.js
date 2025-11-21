import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Caminho para o arquivo do banco
const dbPath = path.join(__dirname, '..', 'mood_tracker.db');

// Conectar ao banco
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Erro ao conectar com o banco:', err.message);
  } else {
    console.log('Conectado ao SQLite Database');
    initializeDatabase();
  }
});

// Criar tabelas
function initializeDatabase() {
  // Tabela de usuários
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    avatar TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) {
      console.error('Erro ao criar tabela users:', err.message);
    } else {
      console.log('Tabela users criada/verificada');
    }
  });

  // Tabela de humores
  db.run(`CREATE TABLE IF NOT EXISTS moods (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  emoji TEXT NOT NULL,
  mood_type TEXT NOT NULL,
  note TEXT,
  date TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
)`, (err) => {
    if (err) {
      console.error('Erro ao criar tabela moods:', err.message);
    } else {
      console.log('Tabela moods criada/verificada');
    }
  });

}

export default db;