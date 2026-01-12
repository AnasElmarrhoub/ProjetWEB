const db = require('../config/db');

let _dateSortieChecked = false;
let _dateSortieExists = false;

async function ensureDateSortieColumn() {
  if (_dateSortieChecked) return _dateSortieExists;
  _dateSortieChecked = true;
  try {
    const dbName = process.env.DB_NAME || process.env.MYSQL_DATABASE || 'cinema_db';
    const [cols] = await db.query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'FILM' AND COLUMN_NAME = 'date_sortie'", [dbName]);
    if (cols.length) {
      _dateSortieExists = true;
      return true;
    }
    await db.query('ALTER TABLE FILM ADD COLUMN date_sortie DATE NULL');
    _dateSortieExists = true;
    return true;
  } catch (err) {
    console.error('Error ensuring date_sortie column:', err.message);
    _dateSortieExists = false;
    return false;
  }
}

exports.createFilm = async (req, res) => {
  const { titre_film, duree, description, affiche_url, date_sortie, genre, genres } = req.body;
  if (!titre_film || !duree) return res.status(400).json({ message: 'titre_film and duree are required' });
  try {
    if (typeof date_sortie !== 'undefined' && date_sortie !== null) {
      const ok = await ensureDateSortieColumn();
      if (!ok) {
        return res.status(500).json({ message: 'Database schema missing `date_sortie` and automatic migration failed' });
      }
    }

    let result;
    if (typeof date_sortie !== 'undefined' && _dateSortieExists) {
      [result] = await db.query('INSERT INTO FILM (titre_film, duree, description, affiche_url, date_sortie) VALUES (?,?,?,?,?)', [titre_film, duree, description || null, affiche_url || null, date_sortie || null]);
    } else {
      [result] = await db.query('INSERT INTO FILM (titre_film, duree, description, affiche_url) VALUES (?,?,?,?)', [titre_film, duree, description || null, affiche_url || null]);
    }
    const id_film = result.insertId;

    const toProcess = [];
    if (typeof genre === 'string' && genre.trim()) toProcess.push(genre.trim());
    if (Array.isArray(genres)) genres.forEach(g => { if (g && g.toString().trim()) toProcess.push(g.toString().trim()); });

    const unique = [];
    const seen = new Set();
    for (const name of toProcess) {
      const key = name.toLowerCase();
      if (!seen.has(key)) { seen.add(key); unique.push(name); }
    }

    const genreIds = [];
    for (const gname of unique) {
      const [rows] = await db.query('SELECT id_genre FROM GENRE WHERE LOWER(libelle_genre) = LOWER(?)', [gname]);
      if (rows.length) genreIds.push(rows[0].id_genre);
      else {
        const [r] = await db.query('INSERT INTO GENRE (libelle_genre) VALUES (?)', [gname]);
        genreIds.push(r.insertId);
      }
    }

    if (genreIds.length) {
      const placeholders = genreIds.map(() => '(?,?)').join(',');
      const vals = [];
      genreIds.forEach(gid => { vals.push(id_film, gid); });
      await db.query(`INSERT INTO FILM_GENRE (id_film, id_genre) VALUES ${placeholders}`, vals);
    }

    const [filmRows] = await db.query('SELECT * FROM FILM WHERE id_film = ?', [id_film]);
    const [filmGenres] = await db.query('SELECT g.* FROM GENRE g JOIN FILM_GENRE fg ON g.id_genre = fg.id_genre WHERE fg.id_film = ?', [id_film]);
    res.status(201).json({ film: filmRows[0], genres: filmGenres });
  } catch (err) {
    console.error('createFilm error:', err && err.message ? err.message : err);
    const detail = err && err.message ? err.message : 'Unknown error';
    res.status(500).json({ message: 'Server error', detail });
  }
};

exports.listFilms = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT f.*, GROUP_CONCAT(g.libelle_genre SEPARATOR ', ') as genre 
      FROM FILM f
      LEFT JOIN FILM_GENRE fg ON f.id_film = fg.id_film
      LEFT JOIN GENRE g ON fg.id_genre = g.id_genre
      GROUP BY f.id_film
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateFilm = async (req, res) => {
  const id = req.params.id;
  const { titre_film, duree, description, affiche_url, date_sortie, genre, genres } = req.body;
  if (!id) return res.status(400).json({ message: 'Film id required' });
  try {
    const [existing] = await db.query('SELECT * FROM FILM WHERE id_film = ?', [id]);
    if (!existing.length) return res.status(404).json({ message: 'Film not found' });

    const fields = [];
    const values = [];
    if (typeof titre_film !== 'undefined') { fields.push('titre_film = ?'); values.push(titre_film); }
    if (typeof duree !== 'undefined') { fields.push('duree = ?'); values.push(duree); }
    if (typeof description !== 'undefined') { fields.push('description = ?'); values.push(description); }
    if (typeof description !== 'undefined') { fields.push('description = ?'); values.push(description); }
    if (typeof date_sortie !== 'undefined') { fields.push('date_sortie = ?'); values.push(date_sortie); }

    if (fields.length) {
      const sql = `UPDATE FILM SET ${fields.join(', ')} WHERE id_film = ?`;
      values.push(id);
      await db.query(sql, values);
    }

    const toProcess = [];
    if (typeof genre === 'string' && genre.trim()) toProcess.push(genre.trim());
    if (Array.isArray(genres)) genres.forEach(g => { if (g && g.toString().trim()) toProcess.push(g.toString().trim()); });

    if (toProcess.length || Array.isArray(genres)) {
      await db.query('DELETE FROM FILM_GENRE WHERE id_film = ?', [id]);

      await db.query('DELETE FROM FILM_GENRE WHERE id_film = ?', [id]);
      const unique = [];
      const seen = new Set();
      for (const name of toProcess) {
        const key = name.toLowerCase();
        if (!seen.has(key)) { seen.add(key); unique.push(name); }
      }

      const genreIds = [];
      for (const gname of unique) {
        const [rows] = await db.query('SELECT id_genre FROM GENRE WHERE LOWER(libelle_genre) = LOWER(?)', [gname]);
        if (rows.length) genreIds.push(rows[0].id_genre);
        else {
          const [r] = await db.query('INSERT INTO GENRE (libelle_genre) VALUES (?)', [gname]);
          genreIds.push(r.insertId);
        }
      }

      if (genreIds.length) {
        const placeholders = genreIds.map(() => '(?,?)').join(',');
        const vals = [];
        genreIds.forEach(gid => { vals.push(id, gid); });
        await db.query(`INSERT INTO FILM_GENRE (id_film, id_genre) VALUES ${placeholders}`, vals);
      }
    }

    const [updatedRows] = await db.query('SELECT * FROM FILM WHERE id_film = ?', [id]);
    const [filmGenres] = await db.query('SELECT g.* FROM GENRE g JOIN FILM_GENRE fg ON g.id_genre = fg.id_genre WHERE fg.id_film = ?', [id]);
    res.json({ film: updatedRows[0], genres: filmGenres });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteFilm = async (req, res) => {
  const id = req.params.id;
  if (!id) return res.status(400).json({ message: 'Film id required' });
  try {
    const [result] = await db.query('DELETE FROM FILM WHERE id_film = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Film not found' });
    res.json({ message: 'Film deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};