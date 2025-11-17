import express from 'express';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';


// Importar banco de dados
import './config/database.js';

// Importar rotas
import authRoutes from './routes/authRoutes.js';
import pageRoutes from './routes/pageRoutes.js';
import moodsRouter from './routes/moodsRouters.js';



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
// REGISTRAR ROTAS
// ======================
app.use('/', pageRoutes);
app.use('/', authRoutes);
app.use('/api/moods', moodsRouter);


// ======================
// INICIAR SERVIDOR
// ======================
app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log(' SERVIDOR RODANDO');
  console.log('='.repeat(50));
  console.log(`Servidor: http://localhost:${PORT}`);
  console.log('Banco SQLite conectado');
  console.log('='.repeat(50));
});