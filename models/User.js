import db from '../config/database.js';

class User {
  // Criar usuário
  static create(name, email, password, avatar, callback) {
  const avatarPath = avatar || '/img/avatars/avatar1.png';

  const sql = `INSERT INTO users (name, email, password, avatar)
               VALUES (?, ?, ?, ?)`;

  db.run(sql, [name, email, password, avatarPath], function (err) {
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
  const sql = `SELECT id, name, email, avatar, created_at FROM users WHERE id = ?`;
  db.get(sql, [id], (err, row) => {
    callback(err, row);
  });
}

  // Atualizar nome / email / senha
  static updateById(id, { name, email, password, avatar }, callback) {
  const fields = [];
  const params = [];

  if (name !== undefined) {
    fields.push('name = ?');
    params.push(name);
  }

  if (email !== undefined) {
    fields.push('email = ?');
    params.push(email);
  }

  if (password !== undefined) {
    fields.push('password = ?');
    params.push(password);
  }

  if (avatar !== undefined) {
    fields.push('avatar = ?');
    params.push(avatar);
  }

  if (fields.length === 0) {
    return callback(null, 0);
  }

  const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
  params.push(id);

  db.run(sql, params, function (err) {
    if (err) {
      console.error('Erro ao atualizar usuário:', err.message);
      return callback(err);
    }
    callback(null, this.changes);
  });
}

}

export default User;