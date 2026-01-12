const API_BASE_URL = 'http://localhost:3000';
let authToken = localStorage.getItem('authToken');

// Check Auth
if (!authToken) {
    window.location.href = 'index.html';
}

function getAuthHeaders() {
    return {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
    };
}

// Tabs Logic
document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));

        tab.classList.add('active');
        document.getElementById(tab.getAttribute('data-target')).classList.add('active');
    });
});

// Logout
document.getElementById('btn-logout-admin').addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem('authToken');
    window.location.href = 'index.html';
});

// ================= FILMS =================
async function loadFilms() {
    try {
        const res = await fetch(`${API_BASE_URL}/films`);
        const films = await res.json();
        const tbody = document.getElementById('films-table-body');
        tbody.innerHTML = '';

        films.forEach(film => {
            tbody.innerHTML += `
                <tr>
                    <td>${film.id_film}</td>
                    <td>${film.titre_film}</td>
                    <td>${film.genre || '-'}</td>
                    <td>${film.duree} min</td>
                    <td>
                        <button class="action-btn btn-edit" onclick="editFilm(${film.id_film})">Edit</button>
                        <button class="action-btn btn-delete" onclick="deleteFilm(${film.id_film})">Suppr</button>
                    </td>
                </tr>
            `;
        });
    } catch (err) {
        console.error(err);
    }
}

const filmModal = document.getElementById('film-modal');
const filmForm = document.getElementById('film-form');

function openFilmForm() {
    document.getElementById('film-modal-title').innerText = 'Ajouter un Film';
    filmForm.reset();
    document.getElementById('film-id').value = '';
    document.getElementById('film-genre').value = ''; // Reset genre
    filmModal.style.display = 'flex';
}

function closeFilmForm() {
    filmModal.style.display = 'none';
}

async function editFilm(id) {
    try {
        const res = await fetch(`${API_BASE_URL}/films/${id}`); // Public endpoint returns film details
        if (!res.ok) throw new Error('Film not found');
        const film = await res.json(); // Assuming returns film object directly or {film: ...}

        // Handle potential wrapper if backend returns { film: {...}, genres: [...] }
        const data = film.film || film;

        document.getElementById('film-modal-title').innerText = 'Modifier un Film';
        document.getElementById('film-id').value = data.id_film;
        document.getElementById('film-titre').value = data.titre_film;
        document.getElementById('film-genre').value = data.genre || ''; // Populate genre
        document.getElementById('film-desc').value = data.description || '';
        document.getElementById('film-duree').value = data.duree;
        document.getElementById('film-affiche').value = data.affiche_url || '';

        filmModal.style.display = 'flex';
    } catch (err) {
        console.error(err);
        alert('Erreur chargement film');
    }
}

async function deleteFilm(id) {
    if (!confirm('Supprimer ce film ?')) return;

    try {
        const res = await fetch(`${API_BASE_URL}/films/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        if (res.ok) loadFilms();
        else alert('Erreur suppression');
    } catch (err) {
        console.error(err);
    }
}

filmForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('film-id').value;
    const data = {
        titre_film: document.getElementById('film-titre').value,
        genre: document.getElementById('film-genre').value, // Include genre
        description: document.getElementById('film-desc').value,
        duree: document.getElementById('film-duree').value,
        affiche_url: document.getElementById('film-affiche').value
    };

    const method = id ? 'PUT' : 'POST';
    const url = id ? `${API_BASE_URL}/films/${id}` : `${API_BASE_URL}/films`;

    try {
        const res = await fetch(url, {
            method: method,
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });

        if (res.ok) {
            closeFilmForm();
            loadFilms();
        } else {
            alert('Erreur enregistrement');
        }
    } catch (err) {
        console.error(err);
    }
});

// ================= SALLES =================
async function loadSalles() {
    try {
        const res = await fetch(`${API_BASE_URL}/salles`, { headers: getAuthHeaders() });
        const salles = await res.json();
        const tbody = document.getElementById('salles-table-body');
        tbody.innerHTML = '';

        salles.forEach(salle => {
            tbody.innerHTML += `
                <tr>
                    <td>${salle.id_salle}</td>
                    <td>${salle.numero_salle}</td>
                    <td>${salle.capacite}</td>
                    <td>Standard</td>
                    <td>
                        <button class="action-btn btn-delete" onclick="deleteSalle(${salle.id_salle})">Suppr</button>
                    </td>
                </tr>
            `;
        });
    } catch (err) {
        console.error(err);
    }
}

const salleModal = document.getElementById('salle-modal');
const salleForm = document.getElementById('salle-form');

function openSalleForm() {
    salleForm.reset();
    salleModal.style.display = 'flex';
}

function closeSalleForm() {
    salleModal.style.display = 'none';
}

async function deleteSalle(id) {
    if (!confirm('Supprimer cette salle ?')) return;
    try {
        const res = await fetch(`${API_BASE_URL}/salles/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        if (res.ok) loadSalles();
        else alert('Erreur suppression');
    } catch (err) {
        console.error(err);
    }
}

salleForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    // Backend expects { numero_salle, template: 'standard' }
    const data = {
        numero_salle: document.getElementById('salle-nom').value,
        template: 'standard'
    };

    try {
        const res = await fetch(`${API_BASE_URL}/salles`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });

        if (res.ok) {
            closeSalleForm();
            loadSalles();
        } else {
            const err = await res.json();
            alert('Erreur: ' + (err.message || 'Inconnue'));
        }
    } catch (err) {
        console.error(err);
    }
});

// ================= RESERVATIONS =================
async function loadReservations() {
    try {
        const res = await fetch(`${API_BASE_URL}/reservations`, { headers: getAuthHeaders() });
        const reservations = await res.json();
        const tbody = document.getElementById('reservations-table-body');
        tbody.innerHTML = '';

        reservations.forEach(r => {
            const clientName = (r.nom && r.prenom) ? `${r.prenom} ${r.nom}` : `Client ${r.id_client}`;
            tbody.innerHTML += `
                <tr>
                    <td>${r.id_billet}</td>
                    <td>${clientName}</td>
                    <td>${r.titre_film}</td>
                    <td>${new Date(r.date_heure_achat).toLocaleString()}</td>
                    <td>${r.montant_tarif} DH</td>
                </tr>
            `;
        });
    } catch (err) {
        console.error(err);
    }
}

// INIT
document.addEventListener('DOMContentLoaded', () => {
    loadFilms();
    loadSalles();
    loadReservations();
});
