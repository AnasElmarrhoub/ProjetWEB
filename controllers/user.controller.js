const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

exports.signup = async (req, res) => {
  const { nom_complet, age, email, mot_de_passe, type_client } = req.body;
  if (!nom_complet || !age || !email || !mot_de_passe) {
    return res.status(400).json({ message: 'Tous les champs sont requis' });
  }

  const nameParts = nom_complet.trim().split(' ');
  const nom = nameParts[nameParts.length - 1];
  const prenom = nameParts.slice(0, -1).join(' ') || nom;


  const validTypes = ['Normal', 'Etudiant'];
  const clientType = validTypes.includes(type_client) ? type_client : 'Normal';

  try {

    const [existing] = await db.query('SELECT id_client FROM UTILISATEUR WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }


    const hashedPassword = await bcrypt.hash(mot_de_passe, 10);


    const [result] = await db.query(
      'INSERT INTO UTILISATEUR (nom, prenom, numero_telephone, age, email, mot_de_passe, type_client) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [nom, prenom, null, age, email, hashedPassword, clientType]
    );

    res.status(201).json({
      message: 'Utilisateur créé avec succès',
      userId: result.insertId
    });
  } catch (err) {
    console.error('Erreur signup:', err);
    res.status(500).json({ message: 'Erreur lors de la création du compte' });
  }
};


exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email et mot de passe requis' });
  }

  try {
    const [rows] = await db.query('SELECT * FROM UTILISATEUR WHERE email = ?', [email]);

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.mot_de_passe);

    if (!isMatch) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }


    const token = jwt.sign(
      {
        id: user.id_client,
        email: user.email,
        role: user.role || 'client'
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );


    res.json({
      token,
      user: {
        id: user.id_client,
        nom_complet: `${user.prenom} ${user.nom}`.trim(),
        email: user.email,
        age: user.age,
        role: user.role || 'client',
        type_client: user.type_client
      }
    });
  } catch (err) {
    console.error('Erreur login:', err);
    res.status(500).json({ message: 'Erreur lors de la connexion' });
  }
};

exports.logout = async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(400).json({ message: 'Token manquant' });
  }

  const token = auth.split(' ')[1];

  try {
    const decoded = jwt.decode(token);
    const expiresAt = new Date(decoded.exp * 1000);

    await db.query(
      'INSERT INTO revoked_tokens (token, expires_at) VALUES (?, ?)',
      [token, expiresAt]
    );

    res.json({ message: 'Déconnexion réussie' });
  } catch (err) {
    console.error('Erreur logout:', err);
    res.status(500).json({ message: 'Erreur lors de la déconnexion' });
  }
};

exports.me = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id_client, nom, prenom, email, age, numero_telephone, role, type_client FROM UTILISATEUR WHERE id_client = ?',
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    const user = rows[0];
    res.json({
      id: user.id_client,
      nom_complet: `${user.prenom} ${user.nom}`.trim(),
      email: user.email,
      age: user.age,
      telephone: user.numero_telephone,
      role: user.role || 'client',
      type_client: user.type_client
    });
  } catch (err) {
    console.error('Erreur me:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

exports.updatePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const userId = req.user.id;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ message: 'Ancien et nouveau mot de passe requis' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'Le nouveau mot de passe doit contenir au moins 6 caractères' });
  }

  try {
    const [rows] = await db.query('SELECT mot_de_passe FROM UTILISATEUR WHERE id_client = ?', [userId]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    const isMatch = await bcrypt.compare(oldPassword, rows[0].mot_de_passe);
    if (!isMatch) {
      return res.status(401).json({ message: 'Ancien mot de passe incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.query('UPDATE UTILISATEUR SET mot_de_passe = ? WHERE id_client = ?', [hashedPassword, userId]);

    res.json({ message: 'Mot de passe mis à jour avec succès' });
  } catch (err) {
    console.error('Erreur update password:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

exports.updateProfile = async (req, res) => {
  const { nom_complet, age, telephone } = req.body;
  const userId = req.user.id;

  if (!nom_complet || !age) {
    return res.status(400).json({ message: 'Nom et âge requis' });
  }

  const nameParts = nom_complet.trim().split(' ');
  const nom = nameParts[nameParts.length - 1];
  const prenom = nameParts.slice(0, -1).join(' ') || nom;

  try {
    await db.query(
      'UPDATE UTILISATEUR SET nom = ?, prenom = ?, age = ?, numero_telephone = ? WHERE id_client = ?',
      [nom, prenom, age, telephone || null, userId]
    );

    res.json({
      message: 'Profil mis à jour avec succès',
      user: {
        nom_complet,
        age,
        telephone
      }
    });
  } catch (err) {
    console.error('Erreur update profile:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

exports.deleteAccount = async (req, res) => {
  const userId = req.user.id;
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ message: 'Mot de passe requis pour supprimer le compte' });
  }

  try {
    const [rows] = await db.query('SELECT mot_de_passe FROM UTILISATEUR WHERE id_client = ?', [userId]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    const isMatch = await bcrypt.compare(password, rows[0].mot_de_passe);
    if (!isMatch) {
      return res.status(401).json({ message: 'Mot de passe incorrect' });
    }

    await db.query('DELETE FROM UTILISATEUR WHERE id_client = ?', [userId]);

    res.json({ message: 'Compte supprimé avec succès' });
  } catch (err) {
    console.error('Erreur delete account:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};