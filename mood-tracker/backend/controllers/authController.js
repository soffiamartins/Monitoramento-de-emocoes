import User from '../models/User.js';

// Simulação simples de sessões (apenas para teste)
const activeSessions = {};

const authController = {
  // CADASTRO - Registrar novo usuário
  register: (req, res) => {
    const { email, password } = req.body;

    console.log('Tentativa de registro:', { email });

    // Validações básicas
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        error: 'Email e senha são obrigatórios' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false, 
        error: 'Senha deve ter pelo menos 6 caracteres'
      });
    }

    // Verificar se usuário já existe
    User.findByEmail(email, (err, existingUser) => {
      if (err) {
        console.error('Erro ao verificar email:', err);
        return res.status(500).json({ 
          success: false,
          error: 'Erro interno do servidor' 
        });
      }

      if (existingUser) {
        return res.status(409).json({ 
          success: false,
          error: 'Este email já está cadastrado' 
        });
      }

      // Criar novo usuário
      User.create(email, password, (err, userId) => {
        if (err) {
          console.error('Erro ao criar usuário:', err);
          return res.status(500).json({ 
            success: false,
            error: 'Erro ao criar usuário' 
          });
        }

        console.log('Usuário criado com ID:', userId);

        res.status(201).json({
          success: true,
          message: 'Usuário criado com sucesso!',
          user: { 
            id: userId, 
            email: email 
          }
        });
      });
    });
  },

  // LOGIN - Fazer login
  login: (req, res) => {
    const { email, password } = req.body;

    console.log('Tentativa de login:', { email });

    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        error: 'Email e senha são obrigatórios' 
      });
    }

    // Buscar usuário por email
    User.findByEmail(email, (err, user) => {
      if (err) {
        console.error('Erro ao buscar usuário:', err);
        return res.status(500).json({ 
          success: false,
          error: 'Erro interno do servidor' 
        });
      }

      if (!user) {
        return res.status(401).json({ 
          success: false,
          error: 'Email ou senha incorretos' 
        });
      }

      // Verificar senha (simples - sem criptografia por enquanto)
      if (user.password !== password) {
        return res.status(401).json({ 
          success: false,
          error: 'Email ou senha incorretos' 
        });
      }

      // Criar sessão simples
      const sessionToken = 'session_' + Date.now();
      activeSessions[sessionToken] = { 
        userId: user.id, 
        email: user.email 
      };

      console.log('Login realizado para usuário:', user.id);

      res.json({
        success: true,
        message: 'Login realizado com sucesso!',
        user: { 
          id: user.id, 
          email: user.email 
        },
        sessionToken: sessionToken
      });
    });
  },

  // VERIFICAR SESSÃO (Middleware)
  verifySession: (req, res, next) => {
    const sessionToken = req.headers.authorization?.replace('Bearer ', '');

    if (!sessionToken || !activeSessions[sessionToken]) {
      return res.status(401).json({ 
        success: false,
        error: 'Sessão inválida ou expirada' 
      });
    }

    req.user = activeSessions[sessionToken];
    next();
  },

  // LOGOUT - Encerrar sessão
  logout: (req, res) => {
    const sessionToken = req.headers.authorization?.replace('Bearer ', '');
    
    if (sessionToken && activeSessions[sessionToken]) {
      delete activeSessions[sessionToken];
      console.log(' Sessão encerrada:', sessionToken);
    }

    res.json({ 
      success: true, 
      message: 'Logout realizado com sucesso' 
    });
  }
};

export default authController;