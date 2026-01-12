const db = require('../config/db');

exports.createSalle = async (req, res) => {
  const { numero_salle, template, rows } = req.body;
  if (!numero_salle) return res.status(400).json({ message: 'numero_salle is required' });
  try {
    const [exists] = await db.query('SELECT id_salle FROM SALLE WHERE numero_salle = ?', [numero_salle]);
    if (exists.length) return res.status(409).json({ message: 'Salle with this name already exists' });

    let seatRows = [];
    if (template === 'standard') {
      seatRows = [
        { rangee: 'A', count: 10 },
        { rangee: 'B', count: 14 },
        { rangee: 'C', count: 14 },
        { rangee: 'D', count: 14 },
        { rangee: 'E', count: 14 },
        { rangee: 'F', count: 14 }
      ];
    } else if (Array.isArray(rows) && rows.length) {
      seatRows = rows.map(r => ({ rangee: String(r.rangee), count: Number(r.count) }));
    } else {
      return res.status(400).json({ message: 'Either template or rows must be provided' });
    }

    const capacity = seatRows.reduce((s, r) => s + (r.count || 0), 0);
    const [result] = await db.query('INSERT INTO SALLE (numero_salle, capacite) VALUES (?, ?)', [numero_salle, capacity]);
    const id_salle = result.insertId;

    const seatValues = [];
    for (const r of seatRows) {
      for (let i = 1; i <= r.count; i++) {
        seatValues.push([r.rangee, String(i), id_salle]);
      }
    }

    if (seatValues.length) {
      const placeholders = seatValues.map(() => '(?,?,?)').join(',');
      const flat = seatValues.flat();
      await db.query(`INSERT INTO SIEGE (rangee, numero, id_salle) VALUES ${placeholders}`, flat);
    }

    const [salleRows] = await db.query('SELECT * FROM SALLE WHERE id_salle = ?', [id_salle]);
    res.status(201).json({ salle: salleRows[0], seats_created: seatValues.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.listSalles = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id_salle, numero_salle, capacite FROM SALLE');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getSalleSeats = async (req, res) => {
  const id = req.params.id;
  if (!id) return res.status(400).json({ message: 'Salle id required' });
  try {
    const [salle] = await db.query('SELECT id_salle, numero_salle, capacite FROM SALLE WHERE id_salle = ?', [id]);
    if (!salle.length) return res.status(404).json({ message: 'Salle not found' });
    const [seats] = await db.query('SELECT id_siege, rangee, numero FROM SIEGE WHERE id_salle = ? ORDER BY rangee, CAST(numero AS UNSIGNED)', [id]);
    res.json({ salle: salle[0], seats });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteSalle = async (req, res) => {
  const id = req.params.id;
  if (!id) return res.status(400).json({ message: 'Salle id required' });
  try {
    const [result] = await db.query('DELETE FROM SALLE WHERE id_salle = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Salle not found' });
    res.json({ message: 'Salle deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};