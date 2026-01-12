const db = require('../config/db');

exports.createGenre = async (req, res) => {
  const { libelle_genre } = req.body;
  if (!libelle_genre) return res.status(400).json({ message: 'libelle_genre is required' });
  try {
    const [exists] = await db.query('SELECT id_genre FROM GENRE WHERE libelle_genre = ?', [libelle_genre]);
    if (exists.length) return res.status(409).json({ message: 'Genre already exists' });
    const [result] = await db.query('INSERT INTO GENRE (libelle_genre) VALUES (?)', [libelle_genre]);
    const [rows] = await db.query('SELECT * FROM GENRE WHERE id_genre = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.listGenres = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id_genre, libelle_genre FROM GENRE');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Associate genre to film (admin)
exports.addGenreToFilm = async (req, res) => {
  const id_film = req.params.id;
  const { id_genre } = req.body;
  if (!id_film || !id_genre) return res.status(400).json({ message: 'id_film and id_genre are required' });
  try {
    const [filmRows] = await db.query('SELECT id_film FROM FILM WHERE id_film = ?', [id_film]);
    if (!filmRows.length) return res.status(404).json({ message: 'Film not found' });
    const [genreRows] = await db.query('SELECT id_genre FROM GENRE WHERE id_genre = ?', [id_genre]);
    if (!genreRows.length) return res.status(404).json({ message: 'Genre not found' });

    // Prevent duplicate
    const [exists] = await db.query('SELECT 1 FROM FILM_GENRE WHERE id_film = ? AND id_genre = ?', [id_film, id_genre]);
    if (exists.length) return res.status(409).json({ message: 'Genre already associated with film' });

    await db.query('INSERT INTO FILM_GENRE (id_film, id_genre) VALUES (?,?)', [id_film, id_genre]);
    res.status(201).json({ message: 'Genre added to film' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Remove association (admin)
exports.removeGenreFromFilm = async (req, res) => {
  const id_film = req.params.id;
  const id_genre = req.params.genreId;
  if (!id_film || !id_genre) return res.status(400).json({ message: 'id_film and id_genre are required' });
  try {
    const [result] = await db.query('DELETE FROM FILM_GENRE WHERE id_film = ? AND id_genre = ?', [id_film, id_genre]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Association not found' });
    res.json({ message: 'Genre removed from film' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.listGenresForFilm = async (req, res) => {
  const id_film = req.params.id;
  if (!id_film) return res.status(400).json({ message: 'Film id required' });
  try {
    const [rows] = await db.query(
      'SELECT g.id_genre, g.libelle_genre FROM GENRE g JOIN FILM_GENRE fg ON g.id_genre = fg.id_genre WHERE fg.id_film = ?',
      [id_film]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.listFilmsByGenre = async (req, res) => {
  const id_genre = req.params.id;
  if (!id_genre) return res.status(400).json({ message: 'Genre id required' });
  try {
    const [rows] = await db.query(
      'SELECT f.id_film, f.titre_film, f.duree, f.description, f.affiche_url FROM FILM f JOIN FILM_GENRE fg ON f.id_film = fg.id_film WHERE fg.id_genre = ?',
      [id_genre]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};