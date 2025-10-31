import express from 'express';
import moodController from '../controllers/moodController.js';

const router = express.Router();

// Middleware para verificar se usuário está logado
const requireAuth = (req, res, next) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    next();
};

// Aplicar auth a todas as rotas de mood
router.use(requireAuth);

// Rota do calendário (vamos criar depois)
router.get('/calendar', moodController.showCalendar);

export default router;