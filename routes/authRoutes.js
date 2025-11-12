import express from 'express';
import User from '../models/User.js';

const router = express.Router();

// Página de login
router.get('/login', (req, res) => {
  if (req.session.user) return res.redirect('/dashboard');
  res.render('login', { error: null, title: 'Login - Mood Tracker' });
});

// Página de cadastro
router.get('/register', (req, res) => {
  if (req.session.user) return res.redirect('/dashboard');
  res.render('register', { error: null, success: null, title: 'Criar Conta - Mood Tracker' });
});

// Processar Login 
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  
  console.log('Tentativa de login:', email);
  
  User.findByEmail(email, (err, user) => {
    if (err) {
      console.error('Erro ao buscar usuário:', err);
      return res.render('login', {
        error: 'Erro interno. Tente novamente.',
        title: 'Login - Mood Tracker'
      });
    }
    
    if (!user) {
      console.log('Usuário não encontrado:', email);
      return res.render('login', {
        error: 'Email não encontrado',
        title: 'Login - Mood Tracker'
      });
    }

    // Verificar senha
    if (user.password !== password) {
      console.log('Senha incorreta para:', email);
      return res.render('login', {
        error: 'Senha incorreta',
        title: 'Login - Mood Tracker'
      });
    }

    // Login bem-sucedido
    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email
    };

    console.log('Login REAL bem-sucedido:', user.name);
    res.redirect('/dashboard');
  });
});

// Processar Cadastro
router.post('/register', (req, res) => {
  const { name, email, password, confirmPassword } = req.body;
  
  console.log('Tentativa de cadastro REAL:', { name, email });
  
  // Validações básicas
  if (!name || !email || !password || !confirmPassword) {
    return res.render('register', {
      error: 'Todos os campos são obrigatórios',
      success: null,
      title: 'Criar Conta - Mood Tracker'
    });
  }
  
  if (password !== confirmPassword) {
    return res.render('register', {
      error: 'As senhas não coincidem',
      success: null,
      title: 'Criar Conta - Mood Tracker'
    });
  }

  if (password.length < 6) {
    return res.render('register', {
      error: 'Senha deve ter pelo menos 6 caracteres',
      success: null,
      title: 'Criar Conta - Mood Tracker'
    });
  }

  // Verificar se email já existe
  User.findByEmail(email, (err, existingUser) => {
    if (err) {
      console.error('Erro ao verificar email:', err);
      return res.render('register', {
        error: 'Erro interno. Tente novamente.',
        success: null,
        title: 'Criar Conta - Mood Tracker'
      });
    }

    if (existingUser) {
      console.log('Email já cadastrado:', email);
      return res.render('register', {
        error: 'Este email já está cadastrado',
        success: null,
        title: 'Criar Conta - Mood Tracker'
      });
    }

    // Criar usuário no banco
    User.create(name, email, password, (err, userId) => {
      if (err) {
        console.error('Erro ao criar usuário:', err);
        return res.render('register', {
          error: 'Erro ao criar conta. Tente novamente.',
          success: null,
          title: 'Criar Conta - Mood Tracker'
        });
      }

      console.log('Usuário REAL criado:', name, email, 'ID:', userId);
      res.render('register', {
        error: null,
        success: 'Conta criada com sucesso! Faça login para continuar.',
        title: 'Criar Conta - Mood Tracker'
      });
    });
  });
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.log('Erro ao fazer logout:', err);
    }
    res.redirect('/');
  });
});

export default router;