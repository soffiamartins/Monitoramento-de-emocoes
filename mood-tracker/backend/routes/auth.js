import express from 'express';
import authController from '../controllers/authController.js';

const router = express.Router();

// Páginas de autenticação
router.get('/login', authController.showLoginPage);
router.get('/register', authController.showRegisterPage);
router.get('/logout', authController.handleLogout);

// Processamento de formulários
router.post('/login', authController.handleLogin);
router.post('/register', authController.handleRegister);

export default router;