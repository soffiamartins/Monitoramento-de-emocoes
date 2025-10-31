import db from '../config/database.js';

class User {
  // Criar usuário
  static create(email, password, callback) {
    const sql = `INSERT INTO users (email, password) VALUES (?, ?)`;
    
    db.run(sql, [email, password], function(err) {
      if (err) {
        return callback(err);
      }
      // this.lastID não funciona bem com ES Modules
      callback(null, this.lastID);
    });
  }

  // Buscar usuário por email
  static findByEmail(email, callback) {
    const sql = `SELECT * FROM users WHERE email = ?`;
    db.get(sql, [email], (err, row) => {
      callback(err, row);
    });
  }
}

export default User;