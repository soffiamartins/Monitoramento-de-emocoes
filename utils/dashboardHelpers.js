// Função para gerar dados do gráfico
export function generateChartData(weeklyMoods) {
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
export function generateRecommendations(weeklyMoods) {
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
      emoji: '💙',
      title: 'Cuidado e Autocompaixão',
      description: 'Permita-se sentir suas emoções. Tente conversar com um amigo, ouvir músicas que confortam ou praticar exercícios leves.'
    },
    'ansioso': {
      emoji: '🌊',
      title: 'Técnicas de Relaxamento',
      description: 'Experimente a respiração 4-7-8: inspire por 4 segundos, segure por 7 e expire por 8. Repita 3-4 vezes.'
    },
    'calmo': {
      emoji: '☁️',
      title: 'Momento de Equilíbrio',
      description: 'Excelente! Aproveite para praticar meditação ou mindfulness para manter esse estado de tranquilidade.'
    },
    'irritado': {
      emoji: '⚡',
      title: 'Gerenciamento da Energia',
      description: 'Tente canalizar essa energia através de exercícios físicos ou atividades criativas. Respire fundo antes de reagir.'
    },
    'entediado': {
      emoji: '🎯',
      title: 'Novos Desafios',
      description: 'Que tal aprender algo novo? Um hobby, curso online ou projeto pessoal pode trazer renovado interesse.'
    },
    'motivado': {
      emoji: '🚀',
      title: 'Aproveite o Momentum',
      description: 'Excelente momento para estabelecer metas e trabalhar em projetos importantes! Mantenha o foco.'
    },
    'cansado': {
      emoji: '🛌',
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
      emoji: '📊',
      title: 'Consistência Incrível!',
      description: 'Você registrou seus humores regularmente. Isso ajuda muito no autoconhecimento emocional!'
    });
  }

  // Recomendação para registrar mais
  if (weeklyMoods.length < 3) {
    recommendations.push({
      emoji: '📝',
      title: 'Continue Registrando',
      description: 'Registre mais alguns dias para obter insights mais precisos sobre seus padrões emocionais.'
    });
  }

  return recommendations;
}

// Função para buscar humores do mês atual
export function getCurrentMonthMoods(userId, callback) {
  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();
  
  const startDate = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`;
  const endDate = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-31`;

  const db = require('../config/database.js').default;
  
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
export function getLastWeekMoods(userId, callback) {
  const db = require('../config/database.js').default;
  
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