import express from 'express';
import authController from '../controllers/authController.js';

const router = express.Router();

// ROTA: Registrar novo usuário
router.post('/register', authController.register);

// ROTA: Fazer login
router.post('/login', authController.login);

// ROTA: Fazer logout
router.post('/logout', authController.logout);

// ROTA PROTEGIDA: Perfil do usuário (teste de autenticação)
router.get('/profile', authController.verifySession, (req, res) => {
  res.json({
    success: true,
    message: 'Perfil acessado com sucesso!',
    user: req.user
  });
});

export default router;