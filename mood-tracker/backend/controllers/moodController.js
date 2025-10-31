const moodController = {
    // Mostrar calendário (página inicial após login)
    showCalendar: (req, res) => {
        res.render('calendar', {
            user: req.session.user,
            message: 'Bem-vindo ao seu calendário de humores!'
        });
    }
};

export default moodController;