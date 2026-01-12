const db = require('../config/db');

exports.createReservation = async (req, res) => {
  const id_client = req.user && req.user.id_client;
  const { id_sceance, id_siege } = req.body;

  if (!id_client) return res.status(401).json({ message: 'Unauthorized' });
  if (!id_sceance || !id_siege) return res.status(400).json({ message: 'id_sceance and id_siege are required' });

  try {
    const [userRows] = await db.query('SELECT type_client FROM UTILISATEUR WHERE id_client = ?', [id_client]);
    if (!userRows.length) return res.status(404).json({ message: 'User not found' });
    const type_client = userRows[0].type_client || 'Normal';

    const [tarifRows] = await db.query('SELECT id_tarif FROM TARIF WHERE libelle_tarif = ?', [type_client]);
    if (!tarifRows.length) return res.status(500).json({ message: `Tariff not found for type ${type_client}` });
    const id_tarif = tarifRows[0].id_tarif;

    const [sceanceRows] = await db.query('SELECT id_sceance, id_salle FROM SCEANCE WHERE id_sceance = ?', [id_sceance]);
    if (!sceanceRows.length) return res.status(404).json({ message: 'Session not found' });
    const sceance = sceanceRows[0];

    const [siegeRows] = await db.query('SELECT id_siege, rangee, numero, id_salle FROM SIEGE WHERE id_siege = ?', [id_siege]);
    if (!siegeRows.length) return res.status(404).json({ message: 'Seat not found' });
    const siege = siegeRows[0];
    if (siege.id_salle !== sceance.id_salle) return res.status(400).json({ message: 'Seat does not belong to the session room' });

    const [result] = await db.query('INSERT INTO BILLET (id_client, id_sceance, id_tarif, id_siege) VALUES (?,?,?,?)', [id_client, id_sceance, id_tarif, id_siege]);
    const id_billet = result.insertId;

    const [rows] = await db.query(
      `SELECT b.id_billet, b.date_heure_achat, b.id_client, b.id_sceance, b.id_tarif, b.id_siege, s.rangee, s.numero, sc.date_heure_debut, f.titre_film
       FROM BILLET b
       JOIN SIEGE s ON b.id_siege = s.id_siege
       JOIN SCEANCE sc ON b.id_sceance = sc.id_sceance
       JOIN FILM f ON sc.id_film = f.id_film
       WHERE b.id_billet = ?`,
      [id_billet]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    if (err && err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Seat already booked for this session' });
    res.status(500).json({ message: 'Server error' });
  }
};

exports.listReservations = async (req, res) => {
  const id_client = req.user && req.user.id_client;
  const role = req.user && req.user.role;
  try {
    if (role === 'admin') {
      const [rows] = await db.query(
        `SELECT b.id_billet, b.date_heure_achat, u.id_client, u.nom, u.prenom, f.titre_film, sc.date_heure_debut, s.rangee, s.numero, t.libelle_tarif, t.montant_tarif
         FROM BILLET b
         JOIN UTILISATEUR u ON b.id_client = u.id_client
         JOIN SCEANCE sc ON b.id_sceance = sc.id_sceance
         JOIN FILM f ON sc.id_film = f.id_film
         JOIN SIEGE s ON b.id_siege = s.id_siege
         JOIN TARIF t ON b.id_tarif = t.id_tarif
         ORDER BY b.date_heure_achat DESC`
      );
      return res.json(rows);
    }
    if (!id_client) return res.status(401).json({ message: 'Unauthorized' });
    const [rows] = await db.query(
      `SELECT b.id_billet, b.date_heure_achat, f.titre_film, sc.date_heure_debut, s.rangee, s.numero, t.libelle_tarif, t.montant_tarif
       FROM BILLET b
       JOIN SCEANCE sc ON b.id_sceance = sc.id_sceance
       JOIN FILM f ON sc.id_film = f.id_film
       JOIN SIEGE s ON b.id_siege = s.id_siege
       JOIN TARIF t ON b.id_tarif = t.id_tarif
       WHERE b.id_client = ?
       ORDER BY b.date_heure_achat DESC`,
      [id_client]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.cancelReservation = async (req, res) => {
  const id_client = req.user && req.user.id_client;
  const role = req.user && req.user.role;
  const id_billet = req.params.id;
  if (!id_billet) return res.status(400).json({ message: 'Reservation id required' });
  try {
    const [rows] = await db.query('SELECT id_billet, id_client FROM BILLET WHERE id_billet = ?', [id_billet]);
    if (!rows.length) return res.status(404).json({ message: 'Reservation not found' });
    const ticket = rows[0];
    if (role !== 'admin' && ticket.id_client !== id_client) return res.status(403).json({ message: 'Forbidden' });
    await db.query('DELETE FROM BILLET WHERE id_billet = ?', [id_billet]);
    res.json({ message: 'Reservation cancelled' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.cancelBySeat = async (req, res) => {
  const id_client = req.user && req.user.id_client;
  const role = req.user && req.user.role;
  const { id_sceance, id_siege } = req.body;
  if (!id_sceance || !id_siege) return res.status(400).json({ message: 'id_sceance and id_siege are required' });
  try {
    const [rows] = await db.query('SELECT id_billet, id_client FROM BILLET WHERE id_sceance = ? AND id_siege = ?', [id_sceance, id_siege]);
    if (!rows.length) return res.status(404).json({ message: 'Reservation not found' });
    const ticket = rows[0];
    if (role !== 'admin' && ticket.id_client !== id_client) return res.status(403).json({ message: 'Forbidden' });
    await db.query('DELETE FROM BILLET WHERE id_billet = ?', [ticket.id_billet]);
    res.json({ message: 'Reservation cancelled' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
