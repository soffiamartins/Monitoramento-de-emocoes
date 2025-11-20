import express from 'express';


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

export default router;