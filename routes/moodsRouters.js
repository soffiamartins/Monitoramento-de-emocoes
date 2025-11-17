import express from 'express';
import db from '../config/database.js';

const router = express.Router();

// Garante que só usuário logado acessa as rotas
router.use((req, res, next) => {
  if (!req.session || !req.session.user) {
    console.error('Usuário não encontrado na sessão em /api/moods');
    return res.status(401).json({ error: 'Usuário não autenticado' });
  }
  next();
});

// Salvar humor
router.post('/', (req, res) => {
  console.log('POST /api/moods - body:', req.body);

  const { emoji, mood_type, note, date } = req.body;
  const userId = req.session.user.id;

  if (!emoji || !mood_type || !date) {
    console.error('Campos faltando:', { emoji, mood_type, date });
    return res.status(400).json({ error: 'Campos obrigatórios faltando' });
  }

  const query = `
    INSERT INTO moods (user_id, emoji, mood_type, note, date)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.run(query, [userId, emoji, mood_type, note, date], function (err) {
    if (err) {
      console.error('Erro ao salvar humor no SQLite:', err.message);
      return res.status(500).json({ error: 'Erro ao salvar humor', detail: err.message });
    }
    return res.status(201).json({ success: true, id: this.lastID });
  });
});

// Buscar humores do mês/intervalo visível
router.get('/month', (req, res) => {
  const userId = req.session.user.id;
  const { start, end } = req.query; // virão do FullCalendar

  console.log('GET /api/moods/month', { userId, start, end });

  let query = `SELECT * FROM moods WHERE user_id = ?`;
  const params = [userId];

  // Se vier start/end, filtra por intervalo
  if (start && end) {
    query += ` AND date >= ? AND date < ?`;
    params.push(start, end);
  }

  query += ` ORDER BY date`;

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('Erro ao buscar humores:', err.message);
      return res.status(500).json({ error: 'Erro ao buscar humores', detail: err.message });
    }
    console.log('Humores encontrados:', rows.length);
    return res.json({ moods: rows });
  });
});

export default router;
