import express from 'express';
import User from '../models/User.js';


const router = express.Router();

// Página inicial -> redireciona para /login
router.get('/', (req, res) => {
  return res.redirect('/login');
});

// Dashboard (PROTEGIDO)
router.get('/dashboard', (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  res.render('dashboard', { title: 'Dashboard - Mood Tracker', user: req.session.user });
});

// Página só do calendário
router.get('/calendar', (req, res) => {
  if (!req.session || !req.session.user) {
    return res.redirect('/login');
  }

  res.render('calendar', {
    title: 'Calendário',
    user: req.session.user
  });
});

// Página de Configurações
router.get('/configuracoes', (req, res) => {
  if (!req.session || !req.session.user) {
    return res.redirect('/login');
  }

  // pode ser "settings.ejs", "configuracoes.ejs", etc.
  res.render('settings', {
    title: 'Configurações - MoodBit',
    user: req.session.user
  });
});

//Rota POST
router.post('/configuracoes', async (req, res) => {
  if (!req.session || !req.session.user) {
    return res.redirect('/login');
  }

  const userId = req.session.user.id;
  const { name, email, password, avatar } = req.body;

  try {
    const updateData = {
      name: name?.trim(),
      email: email?.trim(),
      avatar: avatar || '/img/avatars/avatar1.png'
    };

    if (password && password.trim() !== '') {
      const hashed = await bcrypt.hash(password.trim(), 10);
      updateData.password = hashed;
    }

    User.updateById(userId, updateData, (err) => {
      if (err) {
        // ...
      }

      // atualiza dados da sessão
      req.session.user.name = updateData.name;
      req.session.user.email = updateData.email;
      req.session.user.avatar = updateData.avatar;

      return res.render('settings', {
        title: 'Configurações - MoodBit',
        user: req.session.user,
        success: 'Dados atualizados com sucesso!',
        error: null
      });
    });
  } catch (e) {
    // ...
  }
});


export default router;