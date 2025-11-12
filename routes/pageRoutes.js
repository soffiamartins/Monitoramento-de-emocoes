import express from 'express';

const router = express.Router();

// Página inicial
router.get('/', (req, res) => {
  res.render('home', {
    title: 'Mood Tracker - Seu Diário Emocional'
  });
});

// Dashboard (PROTEGIDO)
router.get('/dashboard', (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  res.render('dashboard', { title: 'Dashboard - Mood Tracker', user: req.session.user });
});

export default router;