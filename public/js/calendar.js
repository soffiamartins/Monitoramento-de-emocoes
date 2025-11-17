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

    // Elementos do card de Humor Semanal
    const weeklyEmojiEl = document.getElementById('weeklyMoodEmoji');
    const weeklyTextEl = document.getElementById('weeklyMoodText');
    const weeklyLabelEl = document.getElementById('weeklyMoodLabel'); // "Predominante", "Misto", etc.


    // Variáveis de estado
    let selectedDate = '';
    let selectedEmoji = '';
    let selectedMood = '';
    let monthlyMoodChart = null;

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

            // Atualizar card de humor semanal para a semana dessa data
            loadWeeklyMood(selectedDate);
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
                    loadMonthlyMoodSummary(fetchInfo.startStr, fetchInfo.endStr); //////
                })
                .catch(err => {
                    console.error('Erro ao carregar humores:', err);
                    failureCallback(err);
                });
        }
    });

    // Renderiza o calendário
    calendar.render();
    loadWeeklyMood();

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

    // ===============Funções do Humor predominante ==============
    function capitalizeFirst(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    // Chama a API do humor semanal
    async function loadWeeklyMood(referenceDate) {
        try {
            const params = referenceDate ? `?date=${referenceDate}` : '';
            const response = await fetch(`/api/moods/weekly-summary${params}`);

            if (!response.ok) {
                throw new Error('Erro ao buscar humor semanal');
            }

            const data = await response.json();
            updateWeeklyMoodCard(data);
        } catch (err) {
            console.error(err);
            if (weeklyEmojiEl) weeklyEmojiEl.textContent = '⚠️';
            if (weeklyTextEl) weeklyTextEl.textContent = 'Erro ao carregar humor semanal';
            if (weeklyLabelEl) weeklyLabelEl.textContent = 'Erro';
        }
    }

    // Atualiza o card na tela
    function updateWeeklyMoodCard(data) {
        if (!weeklyEmojiEl || !weeklyTextEl || !weeklyLabelEl) return;

        // Sem dados
        if (!data.hasData) {
            weeklyEmojiEl.textContent = '😶';
            weeklyLabelEl.textContent = 'Sem dados';
            weeklyTextEl.textContent = 'Nenhum humor registrado nesta semana.';
            return;
        }

        // Emoções mistas (empate)
        if (data.isMixed) {
            weeklyEmojiEl.textContent = '😐';
            weeklyLabelEl.textContent = 'Emoções mistas';
            weeklyTextEl.textContent = 'Semana com emoções variadas.';
            return;
        }

        // Predominante
        const mood = data.mood; // { emoji, mood_type, total }
        weeklyEmojiEl.textContent = mood.emoji;
        weeklyLabelEl.textContent = 'Predominante';
        weeklyTextEl.textContent = capitalizeFirst(mood.mood_type);
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

            //ATUALIZA O HUMOR SEMANAL COM A SEMANA DA DATA SALVA
            loadWeeklyMood(date);

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

    //=======FUNÇÕES CALENDARIO MENSAL ===============
    // Buscar resumo mensal (ou do intervalo visível)
async function loadMonthlyMoodSummary(start, end) {
    const emptyMsgEl = document.getElementById('monthlyMoodEmpty');

    try {
        const params = new URLSearchParams({ start, end });
        const response = await fetch(`/api/moods/summary?${params.toString()}`);

        if (!response.ok) {
            throw new Error('Erro ao buscar resumo de humores');
        }

        const data = await response.json();
        console.log('Resumo de humores (mensal):', data);

        renderMonthlyMoodChart(data.summary || []);
    } catch (err) {
        console.error(err);
        if (emptyMsgEl) {
            emptyMsgEl.style.display = 'block';
            emptyMsgEl.textContent = 'Erro ao carregar gráfico.';
        }
        if (monthlyMoodChart) {
            monthlyMoodChart.destroy();
            monthlyMoodChart = null;
        }
    }
}

// Desenhar/atualizar o gráfico de pizza
function renderMonthlyMoodChart(summary) {
    const canvas = document.getElementById('monthlyMoodPie');
    const emptyMsgEl = document.getElementById('monthlyMoodEmpty');

    if (!canvas) {
        console.warn('Canvas #monthlyMoodPie não encontrado');
        return;
    }

    // Sem dados no período
    if (!summary || summary.length === 0) {
        if (emptyMsgEl) {
            emptyMsgEl.style.display = 'block';
            emptyMsgEl.textContent = 'Nenhum humor registrado neste período.';
        }
        if (monthlyMoodChart) {
            monthlyMoodChart.destroy();
            monthlyMoodChart = null;
        }
        return;
    }

    if (emptyMsgEl) {
        emptyMsgEl.style.display = 'none';
    }

    const labels = summary.map(item => capitalizeFirst(item.mood_type));
    const counts = summary.map(item => item.total);
    const backgroundColors = summary.map(item => getMoodColor(item.mood_type));

    // Se já existir gráfico, destruir antes de redesenhar
    if (monthlyMoodChart) {
        monthlyMoodChart.destroy();
    }

    const ctx = canvas.getContext('2d');

    monthlyMoodChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: counts,
                backgroundColor: backgroundColors
            }]
        },
        options: {
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        boxWidth: 12,
                        padding: 12
                    }
                }
            }
        }
    });
}

// Helper para deixar o texto bonitinho
function capitalizeFirst(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
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
