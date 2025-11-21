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
router.post('/configuracoes', (req, res) => {
  if (!req.session || !req.session.user) {
    return res.redirect('/login');
  }

  const userId = req.session.user.id;
  const { name, email, password, avatar } = req.body;

  console.log('POST /configuracoes body:', req.body);

  try {
    const updateData = {
      name: name ? name.trim() : req.session.user.name,
      email: email ? email.trim() : req.session.user.email,
      avatar: avatar || req.session.user.avatar || '/images/avatar/avatar1.jpg'
    };

    // Se o usuário digitou alguma coisa na senha, troca a senha
    if (password && password.trim() !== '') {
      console.log('Atualizando senha do usuário', userId);
      updateData.password = password.trim(); // 👈 sem bcrypt
    }

    User.updateById(userId, updateData, (err) => {
      if (err) {
        console.error('Erro no updateById:', err);
        return res.render('settings', {
          title: 'Configurações - MoodBit',
          user: req.session.user,
          success: null,
          error: 'Erro ao salvar alterações. Tente novamente.'
        });
      }

      // Atualiza os dados na sessão
      req.session.user.name = updateData.name;
      req.session.user.email = updateData.email;
      req.session.user.avatar = updateData.avatar;

      console.log('Configurações atualizadas com sucesso para usuário', userId);

      return res.render('settings', {
        title: 'Configurações - MoodBit',
        user: req.session.user,
        success: 'Dados atualizados com sucesso!',
        error: null
      });
    });
  } catch (e) {
    console.error('Erro no POST /configuracoes:', e);
    return res.render('settings', {
      title: 'Configurações - MoodBit',
      user: req.session.user,
      success: null,
      error: 'Erro inesperado ao atualizar usuário.'
    });
  }
});

export default router;