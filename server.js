const express = require('express');
const app = express();
const authRoutes = require('./routes/auth.routes'); 
const filmRoutes = require('./routes/film.routes'); // <--- (1) NEW : Importez le fichier
const reservationRoutes = require('./routes/reservation.routes');
const sessionRoutes = require('./routes/session.routes');
const salleRoutes = require('./routes/salle.routes');
const genreRoutes = require('./routes/genre.routes');
const debugRoutes = require('./routes/debug.routes');
// D'ABORD : Lire le JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// ENSUITE : Charger les routes
app.use('/auth', authRoutes);
app.use('/films', filmRoutes); // <--- (2) NEW : Activez la route // <--- Si ceci est avant express.json(), ça plante !
app.use('/reservations', reservationRoutes);
app.use('/sessions', sessionRoutes);
app.use('/salles', salleRoutes);
app.use('/genres', genreRoutes);
app.use('/debug', debugRoutes);

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));