import db from '../config/database.js';

class User {
  // Criar usuário
  static create(name, email, password, callback) {
    const sql = `INSERT INTO users (name, email, password) VALUES (?, ?, ?)`;
    
    db.run(sql, [name, email, password], function(err) {
      if (err) {
        console.error('Erro ao criar usuário:', err.message);
        return callback(err);
      }
      console.log('Usuário criado com ID:', this.lastID);
      callback(null, this.lastID);
    });
  }

  // Buscar usuário por email
  static findByEmail(email, callback) {
    const sql = `SELECT * FROM users WHERE email = ?`;
    db.get(sql, [email], (err, row) => {
      if (err) {
        console.error('Erro ao buscar usuário:', err.message);
      }
      callback(err, row);
    });
  }

  // Buscar usuário por ID
  static findById(id, callback) {
    const sql = `SELECT id, name, email, created_at FROM users WHERE id = ?`;
    db.get(sql, [id], (err, row) => {
      callback(err, row);
    });
  }

  static 


}

export default User;