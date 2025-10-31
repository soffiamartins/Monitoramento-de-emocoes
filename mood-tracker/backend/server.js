import express from 'express';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';
import './config/database.js';

// Importar rotas
import authRoutes from './routes/auth.js';
import moodRoutes from './routes/mood.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Configurar EJS como template engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middlewares
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Sessions (para manter usuário logado)
app.use(session({
  secret: 'mood-tracker-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // true se usar HTTPS
}));

// Middleware para disponibilizar user nas views
app.use((req, res, next) => {
  res.locals.user = req.session.user;
  next();
});

// Rotas
app.use('/', authRoutes);
app.use('/mood', moodRoutes);

// Rota inicial
app.get('/', (req, res) => {
  if (req.session.userId) {
    res.redirect('/mood/calendar');
  } else {
    res.redirect('/login');
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log(`📍 Página inicial: http://localhost:${PORT}`);
});