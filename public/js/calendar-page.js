document.addEventListener('DOMContentLoaded', function () {
  const calendarEl = document.getElementById('calendar');
  if (!calendarEl) return;

  const dayDateLabel = document.getElementById('dayDateLabel');
  const dayEmoji = document.getElementById('dayEmoji');
  const dayMoodLabel = document.getElementById('dayMoodLabel');
  const dayInfoText = document.getElementById('dayInfoText');
  const moodNote = document.getElementById('moodNote');
  const saveBtn = document.getElementById('saveMood');
  const deleteBtn = document.getElementById('deleteMood');
  const emojiOptions = document.querySelectorAll('.emoji-option');

  let selectedDate = null;    // YYYY-MM-DD
  let selectedMood = null;    // 'feliz', 'triste'...
  let selectedEmoji = null;   // 😀
  let currentMoodId = null;   // id no banco (para edição)

  const moodLabels = {
    feliz: 'Feliz',
    triste: 'Triste',
    ansioso: 'Ansioso',
    irritado: 'Irritado',
    cansado: 'Cansado',
    neutro: 'Neutro',
    motivado: 'Motivado',
    calmo: 'Calmo',
  };

  function formatDateToBR(ymd) {
    if (!ymd) return '--/--/----';
    const [y, m, d] = ymd.split('-');
    return `${d}/${m}/${y}`;
  }

  function resetPanel(message = 'Selecione um dia no calendário para ver, criar ou editar seu humor.') {
    dayDateLabel.textContent = '--/--/----';
    dayEmoji.textContent = '🙂';
    dayMoodLabel.textContent = 'Nenhum dia selecionado';
    moodNote.value = '';
    selectedDate = null;
    selectedMood = null;
    selectedEmoji = null;
    currentMoodId = null;
    saveBtn.disabled = true;
    deleteBtn.style.display = 'none';
    dayInfoText.textContent = message;
    emojiOptions.forEach(o => o.classList.remove('selected'));
  }

  function fillPanelFromEvent(ev) {
    selectedDate = ev.startStr;
    currentMoodId = ev.id;
    selectedMood = ev.extendedProps.moodType;
    selectedEmoji = ev.title;
    moodNote.value = ev.extendedProps.note || '';

    dayDateLabel.textContent = formatDateToBR(selectedDate);
    dayEmoji.textContent = selectedEmoji || '🙂';
    dayMoodLabel.textContent = moodLabels[selectedMood] || 'Humor';

    emojiOptions.forEach(o => {
      const mood = o.dataset.mood;
      o.classList.toggle('selected', mood === selectedMood);
    });

    saveBtn.disabled = false;
    deleteBtn.style.display = 'inline-block';
    dayInfoText.textContent = 'Você pode editar o humor ou a anotação deste dia.';
  }

  function fillPanelForEmptyDate(dateStr) {
    selectedDate = dateStr;
    currentMoodId = null;
    selectedMood = null;
    selectedEmoji = null;
    moodNote.value = '';

    dayDateLabel.textContent = formatDateToBR(selectedDate);
    dayEmoji.textContent = '🙂';
    dayMoodLabel.textContent = 'Sem registro';

    emojiOptions.forEach(o => o.classList.remove('selected'));
    saveBtn.disabled = true;
    deleteBtn.style.display = 'none';
    dayInfoText.textContent = 'Nenhum humor registrado neste dia. Escolha um emoji e escreva algo para salvar.';
  }

  // clique nos emojis do painel
  emojiOptions.forEach(option => {
    option.addEventListener('click', () => {
      if (!selectedDate) {
        dayInfoText.textContent = 'Selecione primeiro um dia no calendário.';
        return;
      }
      emojiOptions.forEach(o => o.classList.remove('selected'));
      option.classList.add('selected');

      selectedEmoji = option.dataset.emoji;
      selectedMood = option.dataset.mood;

      dayEmoji.textContent = selectedEmoji;
      dayMoodLabel.textContent = moodLabels[selectedMood] || 'Humor';

      saveBtn.disabled = false;
    });
  });

  // salvar (criar ou editar)
  saveBtn.addEventListener('click', async () => {
    if (!selectedDate || !selectedEmoji || !selectedMood) return;

    const body = {
      emoji: selectedEmoji,
      mood_type: selectedMood,
      note: moodNote.value,
      date: selectedDate,
    };

    const url = currentMoodId ? `/api/moods/${currentMoodId}` : '/api/moods';
    const method = currentMoodId ? 'PUT' : 'POST';

    try {
      const resp = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!resp.ok) throw new Error('Erro ao salvar humor');

      dayInfoText.textContent = currentMoodId
        ? 'Humor atualizado com sucesso!'
        : 'Humor salvo com sucesso!';

      calendar.refetchEvents();
    } catch (e) {
      console.error(e);
      dayInfoText.textContent = 'Ocorreu um erro ao salvar.';
    }
  });

  // excluir
  deleteBtn.addEventListener('click', async () => {
    if (!currentMoodId) return;
    if (!confirm('Deseja realmente excluir o humor deste dia?')) return;

    try {
      const resp = await fetch(`/api/moods/${currentMoodId}`, {
        method: 'DELETE',
      });
      if (!resp.ok) throw new Error('Erro ao excluir');

      calendar.refetchEvents();
      fillPanelForEmptyDate(selectedDate);
      dayInfoText.textContent = 'Humor excluído. Você pode registrar outro para este dia.';
    } catch (e) {
      console.error(e);
      dayInfoText.textContent = 'Ocorreu um erro ao excluir.';
    }
  });

  // inicializa FullCalendar
  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    locale: 'pt-br',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,dayGridWeek'
    },
    events: async function (fetchInfo, successCallback, failureCallback) {
      try {
        const params = new URLSearchParams({
          start: fetchInfo.startStr,
          end: fetchInfo.endStr,
        });
        const resp = await fetch(`/api/moods/month?${params.toString()}`);
        const data = await resp.json();

        const events = (data.moods || []).map(m => ({
          id: m.id,
          title: m.emoji,
          start: m.date,
          allDay: true,
          color: getMoodColor(m.mood_type), 
          extendedProps: {
            moodType: m.mood_type,
            note: m.note,
          },
        }));

        successCallback(events);
      } catch (e) {
        console.error('Erro ao carregar eventos:', e);
        failureCallback(e);
      }
    },
    dateClick: function (info) {
      const dateStr = info.dateStr;
      const events = calendar.getEvents().filter(ev => ev.startStr === dateStr);

      if (events.length > 0) {
        fillPanelFromEvent(events[0]);
      } else {
        fillPanelForEmptyDate(dateStr);
      }
    },
    eventClick: function (info) {
      fillPanelFromEvent(info.event);
    },
  });

  calendar.render();
  resetPanel();
});



function getMoodColor(moodType) {
  const colors = {
    feliz:   '#FFD700',
    triste:  '#4169E1',
    ansioso: '#FF6B6B',
    calmo:   '#51CF66',
    irritado:'#FF8C00',
    cansado: '#A9A9A9',
    neutro:  '#6C757D',
    motivado:'#32CD32'
  };
  return colors[moodType] || '#6C757D';
}