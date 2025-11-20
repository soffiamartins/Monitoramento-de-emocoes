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
        // Carrega recomendações semanais
    loadWeeklyRecommendations();

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
    if (!dateString) {
        popupDate.textContent = '';
        return;
    }

    // dateString vem no formato 'YYYY-MM-DD'
    const [year, month, day] = dateString.split('-').map(Number);

    // Aqui usamos o construtor com ano, mês (0-11) e dia -> usa fuso local, sem perder 1 dia
    const date = new Date(year, month - 1, day);

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

// ==================================
//RECOMENDAÇÕES
//==================================
    // ================== RECOMENDAÇÕES POR HUMOR ==================
    const moodRecommendations = {
        triste: {
            message: 'Sua semana parece ter sido mais pesada... que tal algo leve pra dar risada e relaxar? 💛',
            movies: [
                {
                    title: 'As Branquelas',
                    cover: '/img/movies/as-branquelas.jpg',
                    note: 'Comédia clássica pra rir sem pensar muito.'
                }

            ],
            musics: [
                {
                    title: 'Feel Good Hits',
                    cover: '/img/music/feel-good.jpg',
                    url: 'https://www.youtube.com/results?search_query=feel+good+hits+playlist',
                    note: 'Mais energia positiva pra sua semana.'
                }
            ]
        },

        feliz: {
            message: 'Semana boa, hein? Bora manter essa energia lá em cima! 😄',
            movies: [
                {
                    title: 'Mamma Mia!',
                    cover: '/img/movies/mamma-mia.jpg',
                    note: 'Musical alegre, colorido e cheio de músicas icônicas.'
                },
                {
                    title: 'Enrolados',
                    cover: '/img/movies/enrolados.jpg',
                    note: 'Animação fofa e divertida na mesma vibe.'
                }
            ],
            musics: [
                {
                    title: 'Pop Feliz',
                    cover: '/img/music/pop-feliz.jpg',
                    url: 'https://www.youtube.com/results?search_query=happy+pop+playlist',
                    note: 'Pop animado pra dançar sozinho(a) no quarto.'
                },
                {
                    title: 'Summer Hits',
                    cover: '/img/music/summer-hits.jpg',
                    url: 'https://www.youtube.com/results?search_query=summer+hits+playlist',
                    note: 'Energia de verão o ano inteiro.'
                }
            ]
        },

        ansioso: {
            message: 'Respira fundo. Vamos tentar suavizar essa ansiedade com coisas leves e confortáveis. 🌿',
            movies: [
                {
                    title: 'O Fabuloso Destino de Amélie Poulain',
                    cover: '/img/movies/amelie.jpg',
                    note: 'Calmo, delicado e aconchegante.'
                },
                {
                    title: 'Procurando Nemo',
                    cover: '/img/movies/procurando-nemo.jpg',
                    note: 'História leve e familiar, fácil de assistir.'
                }
            ],
            musics: [
                {
                    title: 'Lo-fi Beats',
                    cover: '/img/music/lofi.jpg',
                    url: 'https://www.youtube.com/results?search_query=lofi+beats',
                    note: 'Ótimo pra estudar, trabalhar ou só desacelerar.'
                },
                {
                    title: 'Relax & Chill',
                    cover: '/img/music/chill-relax.jpg',
                    url: 'https://www.youtube.com/results?search_query=chill+relax+playlist',
                    note: 'Clima calminho pra te acompanhar.'
                }
            ]
        },

        calmo: {
            message: 'Seu clima está tranquilo, e isso é lindo. Vamos manter essa paz ✨',
            movies: [
                {
                    title: 'Comer, Rezar, Amar',
                    cover: '/img/movies/comer-rezar-amar.jpg',
                    note: 'Uma jornada de autoconhecimento.'
                },
                {
                    title: 'A Procura da Felicidade',
                    cover: '/img/movies/a-procura-da-felicidade.jpg',
                    note: 'Inspirador e emocionante na medida certa.'
                }
            ],
            musics: [
                {
                    title: 'Acústico Calmante',
                    cover: '/img/music/acustico.jpg',
                    url: 'https://www.youtube.com/results?search_query=acoustic+calm+playlist',
                    note: 'Violãozinho gostoso pra momentos tranquilos.'
                },
                {
                    title: 'Chill Vibes',
                    cover: '/img/music/chill-vibes.jpg',
                    url: 'https://www.youtube.com/results?search_query=chill+vibes+playlist',
                    note: 'Músicas suaves pra fundo do dia.'
                }
            ]
        },

        irritado: {
            message: 'Semana tensa? Vamos aliviar com coisas que tirem você um pouco da realidade 🔥',
            movies: [
                {
                    title: 'Scott Pilgrim Contra o Mundo',
                    cover: '/img/movies/scott-pilgrim.jpg',
                    note: 'Visual diferente, trilha boa e muita informação pra distrair.'
                },
                {
                    title: 'Guardiões da Galáxia',
                    cover: '/img/movies/guardioes.jpg',
                    note: 'Ação + humor + trilha sonora incrível.'
                }
            ],
            musics: [
                {
                    title: 'Rock/Indie Energético',
                    cover: '/img/music/rock.jpg',
                    url: 'https://www.youtube.com/results?search_query=indie+rock+playlist',
                    note: 'Pra extravasar a energia.'
                },
                {
                    title: 'Workout Hits',
                    cover: '/img/music/workout.jpg',
                    url: 'https://www.youtube.com/results?search_query=workout+hits+playlist',
                    note: 'Se der, canaliza na atividade física.'
                }
            ]
        },

        cansado: {
            message: 'Você parece bem cansado(a). Merece descanso e conteúdos confortáveis 😴',
            movies: [
                {
                    title: 'Divertida Mente',
                    cover: '/img/movies/divertida-mente.jpg',
                    note: 'Fofinho, leve, perfeito pra ver deitado.'
                },
                {
                    title: 'Meu Amigo Totoro',
                    cover: '/img/movies/totoro.jpg',
                    note: 'Um abraço em forma de filme.'
                }
            ],
            musics: [
                {
                    title: 'Sleep/Relax',
                    cover: '/img/music/sleep.jpg',
                    url: 'https://www.youtube.com/results?search_query=sleep+music+playlist',
                    note: 'Pra relaxar antes de dormir.'
                },
                {
                    title: 'Piano Calmo',
                    cover: '/img/music/piano.jpg',
                    url: 'https://www.youtube.com/results?search_query=calm+piano+playlist',
                    note: 'Piano suave pra desacelerar.'
                }
            ]
        },

        neutro: {
            message: 'Sua semana ficou num meio-termo. Que tal experimentar um mix de vibes diferentes? 😊',
            movies: [
                {
                    title: 'O Diabo Veste Prada',
                    cover: '/img/movies/o-diabo-veste-prada.jpg',
                    note: 'Leve, divertido e com um toque de estilo.'
                },
                {
                    title: 'Aproximação',
                    cover: '/img/movies/divertida-mente.jpg',
                    note: 'Divertida Mente pra refletir sobre emoções.'
                }
            ],
            musics: [
                {
                    title: 'Mix Diário',
                    cover: '/img/music/mix-diario.jpg',
                    url: 'https://www.youtube.com',
                    note: 'Escolha uma playlist que combine com o seu momento agora.'
                },
                {
                    title: 'Indie Pop Chill',
                    cover: '/img/music/indie-pop.jpg',
                    url: 'https://www.youtube.com/results?search_query=indie+pop+chill',
                    note: 'Climinha suave, nem muito pra cima, nem muito pra baixo.'
                }
            ]
        },

        mixed: {
            message: 'Sua semana foi uma montanha-russa de emoções. Tudo bem, isso é super humano 💜',
            movies: [
                {
                    title: 'Divertida Mente',
                    cover: '/img/movies/divertida-mente.jpg',
                    note: 'Não tem filme melhor pra falar sobre emoções misturadas.'
                },
                {
                    title: 'Quem Quer Ser um Milionário?',
                    cover: '/img/movies/milionario.jpg',
                    note: 'Drama, alegria, tensão e alívio: tudo junto.'
                }
            ],
            musics: [
                {
                    title: 'Emotional Mix',
                    cover: '/img/music/emotional.jpg',
                    url: 'https://www.youtube.com/results?search_query=emotional+playlist',
                    note: 'Playlist pra acompanhar essa mistura toda.'
                },
                {
                    title: 'Mood Booster',
                    cover: '/img/music/mood-booster.jpg',
                    url: 'https://www.youtube.com/results?search_query=mood+booster+playlist',
                    note: 'Pra tentar puxar o ponteiro um pouco pro positivo.'
                }
            ]
        },

        none: {
            message: '',
            movies: [
                {
                    title: 'Tá Dando Onda',
                    cover: '/images/ta-dando-onda.jpg',
                    note: 'Leve, divertido e fácil de assistir.'
                }
            ],
            musics: [
                {
                    title: 'Lo-fi Chill',
                    cover: '/images/lofi.jpg',
                    url: 'https://www.youtube.com/results?search_query=lofi+beats',
                    note: 'Trilha leve pra qualquer momento do dia.'
                }
            ]
        }
    };
    async function loadWeeklyRecommendations() {
        const section = document.getElementById('weekly-recommendations');
        if (!section) return;

        const messageEl = section.querySelector('.recommendation-message');
        const filmesCol = section.querySelector('.rec-filmes');
        const musicasCol = section.querySelector('.rec-musicas');

        try {
            const res = await fetch('/api/moods/weekly-summary');
            if (!res.ok) throw new Error('Erro ao buscar resumo semanal');

            const data = await res.json();
            console.log('Resumo semanal:', data);

            let key;

            if (!data.hasData) {
                key = 'none';
            } else if (data.isMixed) {
                key = 'mixed';
            } else if (data.mood && data.mood.mood_type) {
                key = data.mood.mood_type; // ex: 'feliz', 'triste', etc.
            } else {
                key = 'none';
            }

            const rec = moodRecommendations[key] || moodRecommendations['none'];

            // Monta mensagem
            let moodTag = '';
            if (data.hasData && !data.isMixed && data.mood && data.mood.mood_type) {
                //moodTag = ` (humor predominante: ${data.mood.mood_type})`;
            } else if (data.isMixed) {
                moodTag = ' (humores mistos)';
            }

            messageEl.textContent = rec.message + moodTag;

            // Limpa colunas
            const filmesHeader = filmesCol.querySelector('h4');
            const musicasHeader = musicasCol.querySelector('h4');
            filmesCol.innerHTML = '';
            musicasCol.innerHTML = '';
            filmesCol.appendChild(filmesHeader);
            musicasCol.appendChild(musicasHeader);

            // Adiciona filmes
            rec.movies.forEach(movie => {
                const card = document.createElement('div');
                card.className = 'rec-card';
                card.innerHTML = `
                    <img src="${movie.cover}" alt="Capa de ${movie.title}">
                    <div class="rec-info">
                        <h5>${movie.title}</h5>
                        <p>${movie.note}</p>
                    </div>
                `;
                filmesCol.appendChild(card);
            });

            // Adiciona músicas (como links)
            rec.musics.forEach(music => {
                const card = document.createElement('a');
                card.className = 'rec-card rec-card-link';
                card.href = music.url || '#';
                card.target = music.url ? '_blank' : '_self';
                card.innerHTML = `
                    <img src="${music.cover}" alt="Capa de ${music.title}">
                    <div class="rec-info">
                        <h5>${music.title}</h5>
                        <p>${music.note}</p>
                    </div>
                `;
                musicasCol.appendChild(card);
            });

            section.style.display = 'block';
        } catch (err) {
            console.error('Erro ao carregar recomendações semanais:', err);
        }
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
