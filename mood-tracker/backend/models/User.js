import db from '../config/database.js';

class User {
  // Criar usuário
  static create(email, password, callback) {
    const sql = `INSERT INTO users (email, password) VALUES (?, ?)`;

    db.run(sql, [email, password], function (err) {
      if (err) {
        console.error(' Erro ao criar usuário:', err);
        return callback(err);
      }
      console.log(' Usuário criado com ID:', this.lastID);
      callback(null, this.lastID);
    });
  }

  // Buscar usuário por email
  static findByEmail(email, callback) {
    const sql = `SELECT * FROM users WHERE email = ?`;
    db.get(sql, [email], (err, row) => {
      if (err) {
        console.error(' Erro ao buscar usuário:', err);
      }
      callback(err, row);
    });
  }
}

export default User;