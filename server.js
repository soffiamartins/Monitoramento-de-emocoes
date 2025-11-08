import express from 'express';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';

// Importar banco de dados
import './config/database.js';
import User from './models/User.js';

// Configurar caminhos
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Inicializar Express
const app = express();
const PORT = 3000;

// ======================
// CONFIGURAÇÕES
// ======================
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

// Sistema de Sessões
app.use(session({
  secret: 'mood-tracker-secret-2024',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    maxAge: 24 * 60 * 60 * 1000, // 1 dia
    secure: false 
  }
}));

// ======================
// MIDDLEWARE PERSONALIZADO
// ======================
app.use((req, res, next) => {
  // Torna o usuário disponível em todas as views
  res.locals.user = req.session.user;
  next();
});

// ======================
// FUNÇÕES AUXILIARES PARA DASHBOARD
// ======================

// Função para gerar dados do gráfico
function generateChartData(weeklyMoods) {
  if (!weeklyMoods || weeklyMoods.length === 0) {
    return {
      labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
      data: [0, 0, 0, 0, 0, 0, 0]
    };
  }

  // Mapear humores para valores numéricos
  const moodValues = {
    'feliz': 5,
    'motivado': 4,
    'calmo': 3,
    'entediado': 2,
    'cansado': 2,
    'ansioso': 1,
    'triste': 1,
    'irritado': 1
  };

  // Agrupar por dia da semana
  const dailyData = {
    '0': [], // Domingo
    '1': [], // Segunda
    '2': [], // Terça
    '3': [], // Quarta
    '4': [], // Quinta
    '5': [], // Sexta
    '6': []  // Sábado
  };

  weeklyMoods.forEach(mood => {
    const date = new Date(mood.created_at);
    const dayOfWeek = date.getDay(); // 0-6
    const moodValue = moodValues[mood.mood_type] || 3;
    dailyData[dayOfWeek].push(moodValue);
  });

  // Calcular média por dia
  const averages = [];
  for (let i = 1; i <= 7; i++) {
    const dayIndex = i % 7;
    const dayMoods = dailyData[dayIndex];
    if (dayMoods.length > 0) {
      const average = dayMoods.reduce((sum, val) => sum + val, 0) / dayMoods.length;
      averages.push(Number(average.toFixed(1)));
    } else {
      averages.push(0);
    }
  }

  return {
    labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
    data: averages
  };
}

// Função para gerar recomendações
function generateRecommendations(weeklyMoods) {
  if (!weeklyMoods || weeklyMoods.length === 0) {
    return [
      {
        emoji: '📝',
        title: 'Comece a Registrar',
        description: 'Registre seus primeiros humores para receber recomendações personalizadas!'
      }
    ];
  }

  // Contar frequência de cada humor
  const moodCount = {};
  weeklyMoods.forEach(mood => {
    moodCount[mood.mood_type] = (moodCount[mood.mood_type] || 0) + 1;
  });

  // Encontrar humor mais frequente
  const mostFrequentMood = Object.keys(moodCount).reduce((a, b) => 
    moodCount[a] > moodCount[b] ? a : b
  );

  const recommendations = [];

  // Recomendações baseadas no humor mais frequente
  const moodRecommendations = {
    'feliz': {
      emoji: '🌟',
      title: 'Mantenha a Energia Positiva',
      description: 'Que incrível! Continue praticando atividades que te trazem alegria e compartilhe sua energia positiva com os outros.'
    },
    'triste': {
      emoji: '',
      title: 'Cuidado e Autocompaixão',
      description: 'Permita-se sentir suas emoções. Tente conversar com um amigo, ouvir músicas que confortam ou praticar exercícios leves.'
    },
    'ansioso': {
      emoji: '',
      title: 'Técnicas de Relaxamento',
      description: 'Experimente a respiração 4-7-8: inspire por 4 segundos, segure por 7 e expire por 8. Repita 3-4 vezes.'
    },
    'calmo': {
      emoji: '',
      title: 'Momento de Equilíbrio',
      description: 'Excelente! Aproveite para praticar meditação ou mindfulness para manter esse estado de tranquilidade.'
    },
    'irritado': {
      emoji: '',
      title: 'Gerenciamento da Energia',
      description: 'Tente canalizar essa energia através de exercícios físicos ou atividades criativas. Respire fundo antes de reagir.'
    },
    'entediado': {
      emoji: '',
      title: 'Novos Desafios',
      description: 'Que tal aprender algo novo? Um hobby, curso online ou projeto pessoal pode trazer renovado interesse.'
    },
    'motivado': {
      emoji: '',
      title: 'Aproveite o Momentum',
      description: 'Excelente momento para estabelecer metas e trabalhar em projetos importantes! Mantenha o foco.'
    },
    'cansado': {
      emoji: '',
      title: 'Descanso e Recuperação',
      description: 'Priorize o sono e descanse. Uma soneca de 20 minutos ou um banho relaxante podem revitalizar.'
    }
  };

  if (moodRecommendations[mostFrequentMood]) {
    recommendations.push(moodRecommendations[mostFrequentMood]);
  }

  // Recomendação geral baseada na consistência
  if (weeklyMoods.length >= 5) {
    recommendations.push({
      emoji: '',
      title: 'Consistência Incrível!',
      description: 'Você registrou seus humores regularmente. Isso ajuda muito no autoconhecimento emocional!'
    });
  }

  // Recomendação para registrar mais
  if (weeklyMoods.length < 3) {
    recommendations.push({
      emoji: '',
      title: 'Continue Registrando',
      description: 'Registre mais alguns dias para obter insights mais precisos sobre seus padrões emocionais.'
    });
  }

  return recommendations;
}

// Função para buscar humores do mês atual
function getCurrentMonthMoods(userId, callback) {
  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();
  
  const startDate = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`;
  const endDate = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-31`;

  const db = require('./config/database.js').default;
  
  const sql = `SELECT * FROM moods 
               WHERE user_id = ? AND date(created_at) BETWEEN date(?) AND date(?)
               ORDER BY created_at DESC`;
  
  db.all(sql, [userId, startDate, endDate], (err, rows) => {
    if (err) {
      console.error('Erro ao buscar humores do mês:', err);
      callback(err, []);
    } else {
      callback(null, rows);
    }
  });
}

// Função para buscar humores da última semana
function getLastWeekMoods(userId, callback) {
  const db = require('./config/database.js').default;
  
  const sql = `SELECT * FROM moods 
               WHERE user_id = ? AND date(created_at) >= date('now', '-7 days')
               ORDER BY created_at ASC`;
  
  db.all(sql, [userId], (err, rows) => {
    if (err) {
      console.error('Erro ao buscar humores da semana:', err);
      callback(err, []);
    } else {
      callback(null, rows);
    }
  });
}

// ======================
// ROTAS GET (PÁGINAS)
// ======================

// Página inicial
app.get('/', (req, res) => {
  res.render('home', {
    title: 'Mood Tracker - Seu Diário Emocional'
  });
});

// Página de login
app.get('/login', (req, res) => {
  if (req.session.user) return res.redirect('/dashboard');
  res.render('login', { error: null, title: 'Login - Mood Tracker' });
});

// Página de cadastro
app.get('/register', (req, res) => {
  if (req.session.user) return res.redirect('/dashboard');
  res.render('register', { error: null, success: null, title: 'Criar Conta - Mood Tracker' });
});

// Dashboard (PROTEGIDO)
app.get('/dashboard', (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  res.render('dashboard', { title: 'Dashboard - Mood Tracker', user: req.session.user });
});

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.log('Erro ao fazer logout:', err);
    }
    res.redirect('/');
  });
});

// 🔧 ROTA TEMPORÁRIA - REMOVER DEPOIS
app.get('/debug-users', (req, res) => {
  const db = require('./config/database.js').default;
  
  db.all('SELECT * FROM users', (err, rows) => {
    if (err) {
      return res.json({ error: err.message });
    }
    res.json({ users: rows });
  });
});


// ======================
// ROTAS POST (FORMULÁRIOS)
// ======================

// Processar Login 
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  
  console.log('Tentativa de login:', email);
  console.log('Senha recebida:', password);
  
  User.findByEmail(email, (err, user) => {
    if (err) {
      console.error('Erro ao buscar usuário:', err);
      return res.render('login', {
        error: 'Erro interno. Tente novamente.',
        title: 'Login - Mood Tracker'
      });
    }

    console.log('Usuário encontrado no banco:', user);
    
    if (!user) {
      console.log('Usuário não encontrado:', email);
      return res.render('login', {
        error: 'Email não encontrado',
        title: 'Login - Mood Tracker'
      });
    }

    console.log(' Comparando senhas:');
    console.log('  - Senha digitada:', password);
    console.log('  - Senha no banco:', user.password);
    console.log('  - São iguais?', password === user.password);

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
app.post('/register', (req, res) => {
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

  // Verificar se email já existe (NO BANCO)
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

    // CRIAR USUÁRIO NO BANCO REAL
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

// ======================
// INICIAR SERVIDOR
// ======================
app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log(' DIA 2: SESSÕES & FORMULÁRIOS RODANDO!');
  console.log('='.repeat(50));
  console.log(`Servidor: http://localhost:${PORT}`);
  console.log('Banco SQLite conectado');
  console.log('Cadastro salva no banco');
  console.log('Login verifica com banco');
  console.log('='.repeat(50));
});