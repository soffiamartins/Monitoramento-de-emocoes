// JAVASCRIPT DO CALENDÁRIO
document.addEventListener('DOMContentLoaded', function () {
    // Elementos do DOM
    const popup = document.getElementById('moodPopup');
    const closePopup = document.querySelector('.close-popup');
    const cancelBtn = document.getElementById('cancelMood');
    const saveBtn = document.getElementById('saveMood');
    const popupDate = document.getElementById('popupDate');
    const emojiOptions = document.querySelectorAll('.emoji-option');
    const moodNote = document.getElementById('moodNote');

    // Variáveis de estado
    let selectedDate = '';
    let selectedEmoji = '';
    let selectedMood = '';

    // Calendário
    const calendar = new FullCalendar.Calendar(document.getElementById('calendar'), {
        initialView: 'dayGridMonth',
        locale: 'pt-br',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,dayGridWeek'
        },

        dateClick: function (info) {
            selectedDate = info.dateStr;
            console.log('Data selecionada:', selectedDate);

            // Atualizar popup e mostrar
            updatePopupDate(selectedDate);
            resetPopup();
            showPopup();
        },

        // Carregar eventos já salvos
        events: function (fetchInfo, successCallback, failureCallback) {
            const params = new URLSearchParams({
                start: fetchInfo.startStr, // início do range visível
                end: fetchInfo.endStr      // fim do range visível
            });

            fetch(`/api/moods/month?${params.toString()}`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Erro HTTP: ' + response.status);
                    }
                    return response.json();
                })
                .then(data => {
                    console.log('Moods recebidos da API:', data);

                    if (!data.moods) {
                        console.error('Resposta inesperada de /api/moods/month');
                        successCallback([]);
                        return;
                    }

                    const events = data.moods.map(mood => ({
                        id: mood.id,
                        title: mood.emoji,
                        start: mood.date, // usa a data salva no banco
                        color: getMoodColor(mood.mood_type),
                        allDay: true
                    }));

                    successCallback(events);
                })
                .catch(err => {
                    console.error('Erro ao carregar humores:', err);
                    failureCallback(err);
                });
        }
    });

    // Renderiza o calendário
    calendar.render();

    // ================== Funções do Popup ==================
    function showPopup() {
        popup.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    function hidePopup() {
        popup.style.display = 'none';
        document.body.style.overflow = 'auto';
        resetPopup();
    }

    function resetPopup() {
        selectedEmoji = '';
        selectedMood = '';
        moodNote.value = '';
        emojiOptions.forEach(option => option.classList.remove('selected'));
        saveBtn.disabled = true;
    }

    function updatePopupDate(dateString) {
        const date = new Date(dateString);
        const formattedDate = date.toLocaleDateString('pt-BR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        popupDate.textContent = formattedDate;
    }

    // ================== Event Listeners ==================
    closePopup.addEventListener('click', hidePopup);
    cancelBtn.addEventListener('click', hidePopup);

    popup.addEventListener('click', function (event) {
        if (event.target === popup) {
            hidePopup();
        }
    });

    // Seleção de emoji
    emojiOptions.forEach(option => {
        option.addEventListener('click', function () {
            emojiOptions.forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');
            selectedEmoji = this.getAttribute('data-emoji');
            selectedMood = this.getAttribute('data-mood');
            saveBtn.disabled = false;
        });
    });

    // Salvar humor
    saveBtn.addEventListener('click', function () {
        if (!selectedEmoji) {
            alert('Por favor, selecione um humor!');
            return;
        }

        const note = moodNote.value.trim();
        saveMood(selectedEmoji, selectedMood, note, selectedDate);
    });

    // ================== Backend ==================
    // Função para salvar humor no backend
    async function saveMood(emoji, mood, note, date) {
        try {
            const response = await fetch('/api/moods', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ emoji, mood_type: mood, note, date })
            });

            if (!response.ok) throw new Error('Erro ao salvar humor');

            const result = await response.json();
            showSuccessMessage(emoji, mood, note, date);

            // Atualiza eventos sem recarregar a página
            calendar.refetchEvents();

            hidePopup();
        } catch (err) {
            alert('Erro ao salvar humor: ' + err.message);
        }
    }

    function showSuccessMessage(emoji, mood, note, date) {
        const message = note
            ? `Humor salvo! ${emoji} (${mood})\nAnotação: "${note}"`
            : `Humor salvo! ${emoji} (${mood})`;

        alert(message);
    }

    // Função para definir cores baseadas no humor
    function getMoodColor(moodType) {
        const colors = {
            'feliz': '#FFD700',
            'triste': '#4169E1',
            'ansioso': '#FF6B6B',
            'calmo': '#51CF66',
            'irritado': '#FF8C00',
            'cansado': '#A9A9A9',
            'neutro': '#6C757D',
            'motivado': '#32CD32'
        };
        return colors[moodType] || '#6C757D';
    }
});
