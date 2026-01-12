const db = require('../config/db');


exports.createSession = async (req, res) => {
  const { date_heure_debut, temps_preparation, id_film, id_salle } = req.body;
  if (!date_heure_debut || !id_film || !id_salle) return res.status(400).json({ message: 'date_heure_debut, id_film and id_salle are required' });
  try {
    const [filmRows] = await db.query('SELECT id_film FROM FILM WHERE id_film = ?', [id_film]);
    if (!filmRows.length) return res.status(404).json({ message: 'Film not found' });
    const [salleRows] = await db.query('SELECT id_salle FROM SALLE WHERE id_salle = ?', [id_salle]);
    if (!salleRows.length) return res.status(404).json({ message: 'Salle not found' });

    const [result] = await db.query('INSERT INTO SCEANCE (date_heure_debut, temps_preparation, id_film, id_salle) VALUES (?,?,?,?)', [date_heure_debut, temps_preparation || 0, id_film, id_salle]);
    const id_sceance = result.insertId;
    const [rows] = await db.query('SELECT * FROM SCEANCE WHERE id_sceance = ?', [id_sceance]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};


exports.listSessions = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT sc.id_sceance, sc.date_heure_debut, sc.temps_preparation, sc.id_film, f.titre_film, sc.id_salle, sa.numero_salle
       FROM SCEANCE sc
       JOIN FILM f ON sc.id_film = f.id_film
       JOIN SALLE sa ON sc.id_salle = sa.id_salle
       ORDER BY sc.date_heure_debut ASC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};


exports.updateSession = async (req, res) => {
  const id = req.params.id;
  const { date_heure_debut, temps_preparation, id_film, id_salle } = req.body;
  if (!id) return res.status(400).json({ message: 'Session id required' });
  try {
    await db.query('UPDATE SCEANCE SET date_heure_debut = COALESCE(?, date_heure_debut), temps_preparation = COALESCE(?, temps_preparation), id_film = COALESCE(?, id_film), id_salle = COALESCE(?, id_salle) WHERE id_sceance = ?', [date_heure_debut, temps_preparation, id_film, id_salle, id]);
    const [rows] = await db.query('SELECT * FROM SCEANCE WHERE id_sceance = ?', [id]);
    if (!rows.length) return res.status(404).json({ message: 'Session not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};


exports.deleteSession = async (req, res) => {
  const id = req.params.id;
  if (!id) return res.status(400).json({ message: 'Session id required' });
  try {
    const [result] = await db.query('DELETE FROM SCEANCE WHERE id_sceance = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Session not found' });
    res.json({ message: 'Session deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};


exports.availableSeats = async (req, res) => {
  const id = req.params.id;
  if (!id) return res.status(400).json({ message: 'Session id required' });
  try {
    const [sceanceRows] = await db.query('SELECT id_sceance, id_salle FROM SCEANCE WHERE id_sceance = ?', [id]);
    if (!sceanceRows.length) return res.status(404).json({ message: 'Session not found' });
    const id_salle = sceanceRows[0].id_salle;
    const [rows] = await db.query(
      'SELECT id_siege, rangee, numero FROM SIEGE WHERE id_salle = ? AND id_siege NOT IN (SELECT id_siege FROM BILLET WHERE id_sceance = ?) ORDER BY rangee, CAST(numero AS UNSIGNED)',
      [id_salle, id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
