import User from '../models/User.js';

const authController = {
  // Mostrar página de login
  showLoginPage: (req, res) => {
    res.render('login', {
      error: null
    });
  },

  // Processar login
  handleLogin: (req, res) => {
    const { email, password } = req.body;

    User.findByEmail(email, (err, user) => {
      if (err) {
        console.error('Erro ao buscar usuário:', err);
        return res.render('login', {
          error: 'Erro no servidor. Tente novamente.'
        });
      }

      if (!user || user.password !== password) {
        return res.render('login', {
          error: 'Email ou senha incorretos'
        });
      }

      // Login bem-sucedido
      req.session.userId = user.id;
      req.session.user = { id: user.id, email: user.email };

      console.log('Login realizado:', user.email);
      res.redirect('/mood/calendar');
    });
  },

  // Mostrar página de cadastro
  showRegisterPage: (req, res) => {
    res.render('register', {
      error: null,
      success: null
    });
  },

  // Processar cadastro
  handleRegister: (req, res) => {
    const { email, password } = req.body;

    // Validação simples
    if (!email || !password) {
      return res.render('register', {
        error: 'Email e senha são obrigatórios',
        success: null
      });
    }

    if (password.length < 6) {
      return res.render('register', {
        error: 'Senha deve ter pelo menos 6 caracteres',
        success: null
      });
    }

    // Verificar se usuário já existe
    User.findByEmail(email, (err, existingUser) => {
      if (err) {
        console.error('Erro ao verificar email:', err);
        return res.render('register', {
          error: 'Erro no servidor. Tente novamente.',
          success: null
        });
      }

      if (existingUser) {
        return res.render('register', {
          error: 'Este email já está cadastrado',
          success: null
        });
      }

      // Criar novo usuário
      User.create(email, password, (err, userId) => {
        if (err) {
          console.error('Erro ao criar usuário:', err);
          return res.render('register', {
            error: 'Erro ao criar conta. Tente novamente.',
            success: null
          });
        }

        console.log(' Novo usuário criado:', email);
        res.render('register', {
          error: null,
          success: 'Conta criada com sucesso! Faça login.'
        });
      });
    });
  },

  // Logout
  handleLogout: (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('Erro ao fazer logout:', err);
      }
      res.redirect('/login');
    });
  }
};

export default authController;