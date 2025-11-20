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

//HUMOR PREDOMINANTE
// Funções auxiliares para datas
function formatDateYMD(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Semana começando no DOM (domingo)
function getStartOfWeek(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0 = domingo
  d.setDate(d.getDate() - day); // volta até domingo
  return d;
}

// Fim da semana (sábado) – inclusive
function getEndOfWeekInclusive(startOfWeek) {
  const end = new Date(startOfWeek);
  end.setDate(end.getDate() + 6); // domingo + 6 = sábado
  end.setHours(0, 0, 0, 0);
  return end;
}

// =========================
// HUMOR SEMANAL (PREDOMINANTE)
// =========================
router.get('/weekly-summary', (req, res) => {
  const userId = req.session.user.id;
  const { date } = req.query; // opcional: YYYY-MM-DD

  const referenceDate = date
    ? new Date(`${date}T00:00:00`)
    : new Date();

  const startOfWeek = getStartOfWeek(referenceDate);
  const endOfWeek = getEndOfWeekInclusive(startOfWeek);

  const startStr = formatDateYMD(startOfWeek);
  const endStr = formatDateYMD(endOfWeek);

  console.log('>> Weekly summary para usuário', userId);
  console.log('   Semana de', startStr, 'até', endStr);

  const sql = `
    SELECT emoji, mood_type
    FROM moods
    WHERE user_id = ?
      AND date BETWEEN ? AND ?
  `;

  db.all(sql, [userId, startStr, endStr], (err, rows) => {
    if (err) {
      console.error('Erro ao buscar humor semanal:', err.message);
      return res.status(500).json({ error: 'Erro ao buscar humor semanal' });
    }

    console.log('   Registros da semana:', rows);

    // Nenhum registro na semana
    if (!rows || rows.length === 0) {
      return res.json({
        hasData: false,
        isMixed: false,
        mood: null,
        week: {
          start: startStr,
          end: endStr
        }
      });
    }

    // Agrupa por mood_type e conta total + qual emoji é mais usado em cada tipo
    const moodsByType = {};
    // estrutura: { [mood_type]: { total: number, emojis: { [emoji]: count } } }

    rows.forEach(row => {
      const { mood_type, emoji } = row;

      if (!moodsByType[mood_type]) {
        moodsByType[mood_type] = {
          total: 0,
          emojis: {}
        };
      }

      moodsByType[mood_type].total += 1;
      moodsByType[mood_type].emojis[emoji] =
        (moodsByType[mood_type].emojis[emoji] || 0) + 1;
    });

    console.log('   Agrupado por tipo:', moodsByType);

    // Descobre o(s) tipo(s) com maior total
    let maxTotal = 0;
    let winnerTypes = [];

    for (const type in moodsByType) {
      const total = moodsByType[type].total;

      if (total > maxTotal) {
        maxTotal = total;
        winnerTypes = [type];
      } else if (total === maxTotal) {
        winnerTypes.push(type);
      }
    }

    // Empate: emoções mistas
    if (winnerTypes.length > 1) {
      return res.json({
        hasData: true,
        isMixed: true,
        mood: null,
        mixedMoods: winnerTypes.map(t => ({
          mood_type: t,
          total: moodsByType[t].total
        })),
        week: {
          start: startStr,
          end: endStr
        }
      });
    }

    // Sem empate: escolhe o tipo vencedor e o emoji mais frequente dele
    const winnerType = winnerTypes[0];
    const info = moodsByType[winnerType];

    let bestEmoji = null;
    let bestEmojiCount = 0;
    for (const emoji in info.emojis) {
      if (info.emojis[emoji] > bestEmojiCount) {
        bestEmoji = emoji;
        bestEmojiCount = info.emojis[emoji];
      }
    }

    const winner = {
      mood_type: winnerType,
      emoji: bestEmoji,
      total: info.total
    };

    console.log('   Vencedor semanal:', winner);

    return res.json({
      hasData: true,
      isMixed: false,
      mood: winner,
      week: {
        start: startStr,
        end: endStr
      }
    });
  });
});
// =========================
// HUMOR MENSAL
// =========================
// Resumo de humores por intervalo (para gráfico de pizza)
router.get('/summary', (req, res) => {
  const userId = req.session.user.id;
  const { start, end } = req.query; // mesmo esquema do /month

  if (!start || !end) {
    return res.status(400).json({ error: 'Parâmetros start e end são obrigatórios' });
  }

  const query = `
    SELECT mood_type, emoji, COUNT(*) AS total
    FROM moods
    WHERE user_id = ?
      AND date >= ?
      AND date < ?
    GROUP BY mood_type, emoji
    ORDER BY total DESC
  `;

  db.all(query, [userId, start, end], (err, rows) => {
    if (err) {
      console.error('Erro ao buscar resumo de humores:', err.message);
      return res.status(500).json({ error: 'Erro ao buscar resumo de humores' });
    }

    return res.json({
      summary: rows // [{mood_type, emoji, total}, ...]
    });
  });
}); // Quando muda o mês no calendário, o gráfico muda junto

//========================================================
// Atualizar humor (editar registro existente)
router.put('/:id', (req, res) => {
  const userId = req.session.user.id;
  const { id } = req.params;
  const { emoji, mood_type, note, date } = req.body;

  const sql = `
    UPDATE moods
    SET emoji = ?, mood_type = ?, note = ?, date = ?
    WHERE id = ? AND user_id = ?
  `;

  db.run(sql, [emoji, mood_type, note, date, id, userId], function (err) {
    if (err) {
      console.error('Erro ao atualizar humor:', err.message);
      return res.status(500).json({ error: 'Erro ao atualizar humor' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Registro não encontrado' });
    }
    return res.json({ success: true });
  });
});

// Excluir humor
router.delete('/:id', (req, res) => {
  const userId = req.session.user.id;
  const { id } = req.params;

  const sql = `DELETE FROM moods WHERE id = ? AND user_id = ?`;

  db.run(sql, [id, userId], function (err) {
    if (err) {
      console.error('Erro ao excluir humor:', err.message);
      return res.status(500).json({ error: 'Erro ao excluir humor' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Registro não encontrado' });
    }
    return res.json({ success: true });
  });
});

export default router;
