import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

//importação e conexão do banco
import './config/database.js';

import authRoutes from './routes/auth.js';
// import moodRoutes from './routes/mood.js';
;



dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares básicos
app.use(cors({
  origin: 'http://localhost:5173', // Front-end do Vite
  credentials: true
}));
app.use(express.json());

app.use('/api/auth', authRoutes);

// Rota de saúde para testar
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Servidor do Mood Tracker rodando',
    timestamp: new Date().toISOString()
  });
});

// Rota simples de teste
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Back-end funcionando!',
    version: '1.0.0',
    database: 'SQLite conectado'
  });
});

app.listen(PORT, () => {
  console.log(` Servidor back-end rodando na porta ${PORT}`);
  console.log(` Health check: http://localhost:${PORT}/health`);
  console.log(` Teste API: http://localhost:${PORT}/api/test`);
});