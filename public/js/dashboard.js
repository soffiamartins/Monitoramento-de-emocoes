document.addEventListener('DOMContentLoaded', function() {
  var calendarEl = document.getElementById('calendar');
  
  var calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    locale: 'pt-br',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,dayGridWeek'
    },
    
    // EVENTO QUANDO CLICA EM UM DIA
    dateClick: function(info) {
      const selectedDate = info.dateStr; // "2024-01-15"
      
      // Mostrar modal ou seção para registrar humor
      openMoodModal(selectedDate);
      
      // Ou carregar humores desse dia diretamente
      loadMoodsForDate(selectedDate);
    },
    
    // MOSTRAR OS HUMORES JÁ REGISTRADOS NO CALENDÁRIO
    events: function(fetchInfo, successCallback, failureCallback) {
      // Buscar todos os humores do mês
      fetch('/api/moods/month')
        .then(response => response.json())
        .then(data => {
          const events = data.moods.map(mood => ({
            title: mood.emoji, // Mostra o emoji no calendário
            start: mood.created_at,
            color: getMoodColor(mood.mood_type),
            allDay: true
          }));
          successCallback(events);
        });
    }
  });

  calendar.render();
});

// Função para abrir modal ao clicar no dia
function openMoodModal(date) {
  // Aqui você pode abrir um modal com os emojis e campo de anotação
  // Passando a data selecionada
  console.log('Data selecionada:', date);
  // Sua lógica de emojis aqui...
}

// Função para definir cores baseadas no humor
function getMoodColor(moodType) {
  const colors = {
    'feliz': '#FFD700',
    'triste': '#4169E1', 
    'ansioso': '#FF6B6B',
    'calmo': '#51CF66',
    'irritado': '#FF8C00'
  };
  return colors[moodType] || '#6C757D';
}