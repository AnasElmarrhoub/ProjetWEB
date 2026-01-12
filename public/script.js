const API_BASE_URL = 'http://localhost:3000';

let authToken = localStorage.getItem('authToken');
let currentUser = null;

function setAuthToken(token) {
    authToken = token;
    localStorage.setItem('authToken', token);
}

function clearAuthToken() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
}

function getAuthHeaders() {
    return authToken ? { 'Authorization': `Bearer ${authToken}` } : {};
}

function updateHeaderBtn(isLoggedIn, user = null) {
    const btnLogin = document.getElementById('btn-login');
    if (!btnLogin) return;

    if (isLoggedIn) {
        btnLogin.textContent = "MON COMPTE";
        btnLogin.classList.add('btn-account');
        if (user) {
            currentUser = user;
            if (user.role === 'admin' || user.email === 'admin@cine.com') {
                // Ajouter bouton admin si pas déjà là
                if (!document.getElementById('btn-admin-dashboard')) {
                    const adminBtn = document.createElement('a');
                    adminBtn.id = 'btn-admin-dashboard';
                    adminBtn.href = 'admin.html';
                    adminBtn.className = 'btn-neon';
                    adminBtn.style.marginLeft = '10px';
                    adminBtn.textContent = 'ADMIN';
                    btnLogin.parentNode.insertBefore(adminBtn, btnLogin.nextSibling);
                }
            }
        }
    } else {
        btnLogin.textContent = "SE CONNECTER";
        btnLogin.classList.remove('btn-account');
        currentUser = null;
        const adminBtn = document.getElementById('btn-admin-dashboard');
        if (adminBtn) adminBtn.remove();
    }
}

document.addEventListener('DOMContentLoaded', function () {
    const intervalTime = 5000;
    const slides = document.querySelectorAll('.carousel-slide');
    const indicators = document.querySelectorAll('.indicator');
    let currentSlide = 0;
    let slideInterval;

    function goToSlide(n) {
        if (!slides.length) return;
        slides[currentSlide].classList.remove('active');
        indicators[currentSlide].classList.remove('active');
        currentSlide = (n + slides.length) % slides.length;
        slides[currentSlide].classList.add('active');
        indicators[currentSlide].classList.add('active');
    }

    function nextSlide() {
        goToSlide(currentSlide + 1);
    }

    if (slides.length > 0) {
        slideInterval = setInterval(nextSlide, intervalTime);

        indicators.forEach((indicator, index) => {
            indicator.addEventListener('click', () => {
                clearInterval(slideInterval);
                goToSlide(index);
                slideInterval = setInterval(nextSlide, intervalTime);
            });
        });
    }
});

const movieContainer = document.getElementById('movieContainer');
const nextBtn = document.getElementById('nextBtn');
const prevBtn = document.getElementById('prevBtn');
const scrollAmount = 300;

if (nextBtn && prevBtn && movieContainer) {
    nextBtn.addEventListener('click', () => {
        movieContainer.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    });

    prevBtn.addEventListener('click', () => {
        movieContainer.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    });
}

let allMovies = [];

async function fetchMovies() {
    try {
        const response = await fetch(`${API_BASE_URL}/films`);
        if (!response.ok) throw new Error("Erreur réseau");

        const data = await response.json();
        allMovies = data.map(film => ({
            id: film.id_film,
            title: film.titre_film,
            desc: film.description || 'Description non disponible',
            img: film.affiche_url || 'assets/img/posters/default.jpg',
            duration: film.duree ? `${film.duree} min` : 'Durée inconnue',
            genre: film.genre || 'Cinéma',
            price: 65
        }));

        console.log("Films chargés:", allMovies);
        displayMovies();
    } catch (error) {
        console.error("Impossible de charger les films:", error);
        allMovies = [];
        displayErrorMessage();
    }
}

function displayMovies() {
    if (!movieContainer) return;

    movieContainer.innerHTML = '';

    if (allMovies.length === 0) {
        movieContainer.innerHTML = '<p style="color: white; text-align: center; width: 100%;">Aucun film disponible</p>';
        return;
    }

    allMovies.forEach(movie => {
        const movieCard = document.createElement('div');
        movieCard.className = 'movie-card';
        movieCard.innerHTML = `
            <div class="movie-poster">
                <img src="${movie.img}" alt="${movie.title}" onerror="this.src='assets/img/posters/default.jpg'">
                <div class="movie-overlay">
                    <a href="#" class="btn-neon-sm btn-reserve" data-movie-id="${movie.id}">RÉSERVER</a>
                </div>
            </div>
            <div class="movie-info">
                <h3>${movie.title}</h3>
                <span class="movie-genre">${movie.genre} • ${movie.duration}</span>
            </div>
        `;
        movieContainer.appendChild(movieCard);
    });

    attachReserveButtons();
    attachHeroReserveButtons();
}

function displayErrorMessage() {
    if (movieContainer) {
        movieContainer.innerHTML = `
            <div style="color: white; text-align: center; width: 100%; padding: 20px;">
                <p>Erreur de connexion au serveur</p>
                <button class="btn-neon" onclick="fetchMovies()">Réessayer</button>
            </div>
        `;
    }
}

const modal = document.getElementById('auth-modal');
const btnLogin = document.getElementById('btn-login');
const spanClose = document.querySelector('.close-modal');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const showRegisterLink = document.getElementById('show-register');
const showLoginLink = document.getElementById('show-login');

if (btnLogin) {
    btnLogin.addEventListener('click', (e) => {
        e.preventDefault();
        if (authToken) {
            showProfile();
        } else {
            modal.style.display = 'flex';
            setTimeout(() => modal.classList.add('show'), 10);
        }
    });
}

function closeModal() {
    modal.classList.remove('show');
    setTimeout(() => modal.style.display = 'none', 300);
}

if (spanClose) spanClose.addEventListener('click', closeModal);

window.addEventListener('click', (e) => {
    if (e.target == modal) closeModal();
});

if (showRegisterLink && showLoginLink) {
    showRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.classList.remove('active');
        registerForm.classList.add('active');
    });

    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        registerForm.classList.remove('active');
        loginForm.classList.add('active');
    });
}

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = {
            email: formData.get('email'),
            password: formData.get('password')
        };

        const submitBtn = e.target.querySelector('button');
        const originalText = submitBtn.innerText;
        submitBtn.innerText = 'CONNEXION...';
        submitBtn.disabled = true;

        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok) {
                setAuthToken(result.token);
                updateHeaderBtn(true, result.user);
                closeModal();
                // showProfile(); // Removed to keep user on homepage
                alert('Connexion réussie !');
            } else {
                alert(result.message || 'Erreur de connexion');
            }
        } catch (error) {
            console.error('Erreur:', error);
            alert('Erreur de connexion au serveur');
        } finally {
            submitBtn.innerText = originalText;
            submitBtn.disabled = false;
        }
    });
}

if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = {
            nom_complet: formData.get('fullname'),
            age: parseInt(formData.get('age')),
            email: formData.get('email'),
            mot_de_passe: formData.get('password'),
            type_client: formData.get('type_client')
        };

        const submitBtn = e.target.querySelector('button');
        const originalText = submitBtn.innerText;
        submitBtn.innerText = 'CRÉATION...';
        submitBtn.disabled = true;

        try {
            const response = await fetch(`${API_BASE_URL}/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok) {
                alert('Compte créé avec succès ! Vous pouvez maintenant vous connecter.');
                registerForm.classList.remove('active');
                loginForm.classList.add('active');
                registerForm.reset();
            } else {
                alert(result.message || 'Erreur lors de la création du compte');
            }
        } catch (error) {
            console.error('Erreur:', error);
            alert('Erreur de connexion au serveur');
        } finally {
            submitBtn.innerText = originalText;
            submitBtn.disabled = false;
        }
    });
}

const videoModal = document.getElementById('video-modal');
const videoWrapper = document.getElementById('video-wrapper');
const closeVideoBtn = document.querySelector('.close-video');
const videoTriggers = document.querySelectorAll('.trigger-video');

videoTriggers.forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        const videoId = btn.getAttribute('data-video-id');
        if (videoId) {
            videoWrapper.innerHTML = `
                <iframe 
                    src="https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowfullscreen>
                </iframe>
            `;
            videoModal.style.display = 'flex';
            setTimeout(() => videoModal.classList.add('show'), 10);
        }
    });
});

function closeVideo() {
    videoModal.classList.remove('show');
    setTimeout(() => {
        videoModal.style.display = 'none';
        videoWrapper.innerHTML = '';
    }, 300);
}

if (closeVideoBtn) closeVideoBtn.addEventListener('click', closeVideo);
if (videoModal) {
    videoModal.addEventListener('click', (e) => {
        if (e.target === videoModal) closeVideo();
    });
}

const userDashboard = document.getElementById('user-dashboard');
const closeDashboardBtn = document.getElementById('close-dashboard');
const navBtns = document.querySelectorAll('.nav-btn');
const sections = document.querySelectorAll('.content-section');
const navFilms = document.getElementById('nav-films');
const navEvents = document.getElementById('nav-events');
const navAbout = document.getElementById('nav-about');
const navHomeLogo = document.getElementById('nav-home-logo');
const heroCarousel = document.querySelector('.hero-carousel');
const moviesSection = document.getElementById('movies-section');
const eventsSection = document.getElementById('events');
const aboutSection = document.getElementById('about');

navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        if (btn.classList.contains('logout-btn')) return;
        const targetId = btn.getAttribute('data-target');
        navBtns.forEach(b => b.classList.remove('active'));
        sections.forEach(s => s.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(targetId).classList.add('active');
    });
});

function showProfile() {
    window.location.href = 'profil.html';
}

function showHome() {
    window.location.href = 'index.html';
}

function showEvents() {
    // If we are on profil.html, we need to go back to index.html then scroll or just navigation
    // simpler to just reload home for now or implement event page later
    window.location.href = 'index.html';
}

function showAbout() {
    window.location.href = 'index.html#about';
}

if (navFilms) navFilms.addEventListener('click', (e) => {
    e.preventDefault();
    window.location.href = 'index.html';
});

if (navEvents) navEvents.addEventListener('click', (e) => { e.preventDefault(); showEvents(); });
if (navAbout) navAbout.addEventListener('click', (e) => { e.preventDefault(); showAbout(); });
if (navHomeLogo) navHomeLogo.addEventListener('click', (e) => { e.preventDefault(); showHome(); });

const btnBackHome = document.getElementById('btn-back-home'); // Old button id reference check, new one is btn-back-home-link
const btnBackHomeLink = document.getElementById('btn-back-home-link');

if (btnBackHome || btnBackHomeLink) {
    (btnBackHome || btnBackHomeLink).addEventListener('click', (e) => {
        // Let the default link behavior work if it's an anchor, or force it if it's a button
        if (e.target.tagName !== 'A' && e.target.parentElement.tagName !== 'A') {
            e.preventDefault();
            showHome();
        }
    });
}

if (closeDashboardBtn) {
    closeDashboardBtn.addEventListener('click', () => {
        showHome();
    });
}

async function loadUserProfile() {
    if (!authToken) return;

    try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: getAuthHeaders()
        });

        if (response.ok) {
            const userData = await response.json();
            currentUser = userData;

            // Update UI
            document.getElementById('user-name-display').textContent = userData.nom_complet || 'Utilisateur';
            document.getElementById('profile-email').value = userData.email || '';
            document.getElementById('profile-nom').value = userData.nom_complet || '';
            document.getElementById('profile-age').value = userData.age || '';
            document.getElementById('profile-telephone').value = userData.telephone || '';

            if (userData.role === 'admin' || userData.email === 'admin@cine.com' || (userData.email && userData.email.startsWith('admin'))) {
                const sideNav = document.querySelector('.side-nav');
                if (sideNav && !document.getElementById('btn-admin-sidebar')) {
                    const adminBtn = document.createElement('button');
                    adminBtn.id = 'btn-admin-sidebar';
                    adminBtn.className = 'nav-btn';
                    adminBtn.innerHTML = '<i class="fas fa-user-shield"></i> Administration';
                    adminBtn.style.color = '#00d2ff';
                    adminBtn.style.border = '1px solid #00d2ff';
                    adminBtn.style.marginBottom = '10px';

                    adminBtn.addEventListener('click', () => {
                        window.location.href = 'admin.html';
                    });

                    // Insérer au début de la liste
                    sideNav.insertBefore(adminBtn, sideNav.firstChild);
                }
            }
        }
    } catch (error) {
        console.error('Erreur chargement profil:', error);
    }
}

const profileForm = document.getElementById('profile-form');
if (profileForm) {
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const data = {
            nom_complet: document.getElementById('profile-nom').value,
            age: parseInt(document.getElementById('profile-age').value),
            telephone: document.getElementById('profile-telephone').value
        };

        try {
            const response = await fetch(`${API_BASE_URL}/auth/profile`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(data)
            });

            if (response.ok) {
                alert('Profil mis à jour avec succès !');
                loadUserProfile();
            } else {
                const result = await response.json();
                alert(result.message || 'Erreur lors de la mise à jour');
            }
        } catch (error) {
            console.error('Erreur:', error);
            alert('Erreur de connexion au serveur');
        }
    });
}

const passwordForm = document.getElementById('password-form');
if (passwordForm) {
    passwordForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const oldPassword = document.getElementById('old-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        if (newPassword !== confirmPassword) {
            alert('Les mots de passe ne correspondent pas');
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/auth/password`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ oldPassword, newPassword })
            });

            if (response.ok) {
                alert('Mot de passe modifié avec succès !');
                passwordForm.reset();
            } else {
                const result = await response.json();
                alert(result.message || 'Erreur lors de la modification');
            }
        } catch (error) {
            console.error('Erreur:', error);
            alert('Erreur de connexion au serveur');
        }
    });
}

const btnDeleteAccount = document.getElementById('btn-delete-account');
if (btnDeleteAccount) {
    btnDeleteAccount.addEventListener('click', async () => {
        const password = prompt('Entrez votre mot de passe pour confirmer la suppression :');
        if (!password) return;

        if (!confirm('Êtes-vous sûr de vouloir supprimer votre compte ? Cette opération est irréversible.')) return;

        try {
            const response = await fetch(`${API_BASE_URL}/auth/account`, {
                method: 'DELETE',
                headers: getAuthHeaders(),
                body: JSON.stringify({ password })
            });

            if (response.ok) {
                alert('Compte supprimé avec succès');
                clearAuthToken();
                window.location.href = 'index.html'; // Redirect to home
            } else {
                const result = await response.json();
                alert(result.message || 'Erreur lors de la suppression');
            }
        } catch (error) {
            console.error('Erreur:', error);
            alert('Erreur de connexion au serveur');
        }
    });
}

const btnLogoutSidebar = document.getElementById('btn-logout-sidebar');
if (btnLogoutSidebar) {
    btnLogoutSidebar.addEventListener('click', () => {
        clearAuthToken();
        alert('Déconnexion réussie');
        window.location.href = 'index.html'; // Redirect to home
    });
}


function attachHeroReserveButtons() {
    document.querySelectorAll('.carousel-content .btn-neon').forEach(btn => {
        if (btn.classList.contains('btn-play-neon') || btn.classList.contains('trigger-video')) {
            return;
        }

        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const carouselContent = btn.closest('.carousel-content');
            const filmTitle = carouselContent.querySelector('.neon-title').textContent;

            const movie = allMovies.find(m =>
                m.title.toLowerCase().includes(filmTitle.toLowerCase()) ||
                filmTitle.toLowerCase().includes(m.title.toLowerCase())
            );

            if (movie) {
                openBooking(movie.id);
            } else {
                if (allMovies.length > 0) {
                    openBooking(allMovies[0].id);
                } else {
                    alert('Aucun film disponible pour le moment');
                }
            }
        });
    });
}

const bookingModal = document.getElementById('booking-modal');
const closeBookingBtn = document.querySelector('.close-booking');
const step1 = document.getElementById('booking-step-1');
const step2 = document.getElementById('booking-step-2');
const step3 = document.getElementById('booking-step-3');

let currentMoviePrice = 65;
let selectedSeatsCount = 0;
let bookingData = {};
let currentMovie = null;

function openBooking(movieId) {
    const movie = allMovies.find(m => m.id === parseInt(movieId));
    if (!movie) {
        alert('Film non trouvé');
        return;
    }
    currentMovie = movie;
    if (currentUser) {
        if (currentUser.type_client === 'Etudiant') {
            currentMoviePrice = 50;
        } else {
            currentMoviePrice = 70;
        }
    } else {
        currentMoviePrice = 70;
    }
    document.getElementById('book-title').innerText = movie.title;
    document.getElementById('book-desc').innerText = movie.desc;
    document.getElementById('book-genre').innerText = movie.genre;
    document.getElementById('book-duration').innerText = movie.duration;
    document.getElementById('booking-bg').style.backgroundImage = `url('${movie.img}')`;
    step1.style.display = 'block';
    step2.style.display = 'none';
    step3.style.display = 'none';
    document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('selected'));
    document.getElementById('btn-go-to-seats').style.opacity = '0.5';
    document.getElementById('btn-go-to-seats').style.pointerEvents = 'none';
    generateDates();
    bookingModal.style.display = 'flex';
    setTimeout(() => bookingModal.classList.add('show'), 10);
}

function attachReserveButtons() {
    document.querySelectorAll('.btn-reserve').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const movieId = btn.getAttribute('data-movie-id');
            openBooking(movieId);
        });
    });
}

function generateDates() {
    const container = document.getElementById('date-selector');
    container.innerHTML = '';
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    const today = new Date();

    for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const card = document.createElement('div');
        card.className = `date-card ${i === 0 ? 'active' : ''}`;
        card.innerHTML = `
            <span class="date-day">${i === 0 ? "Ce soir" : days[date.getDay()]}</span>
            <span class="date-num">${date.getDate()}</span>
        `;
        card.onclick = function () {
            document.querySelectorAll('.date-card').forEach(c => c.classList.remove('active'));
            this.classList.add('active');
        };
        container.appendChild(card);
    }
}

document.querySelectorAll('.time-btn').forEach(btn => {
    btn.addEventListener('click', function () {
        document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('selected'));
        this.classList.add('selected');
        const nextBtn = document.getElementById('btn-go-to-seats');
        nextBtn.style.opacity = '1';
        nextBtn.style.pointerEvents = 'auto';
        nextBtn.innerText = "CHOISIR MA PLACE (" + this.innerText + ")";
    });
});

document.getElementById('btn-go-to-seats').addEventListener('click', () => {
    const dateEl = document.querySelector('.date-card.active');
    bookingData.date = dateEl.querySelector('.date-num').innerText + " " + dateEl.querySelector('.date-day').innerText;
    bookingData.time = document.querySelector('.time-btn.selected').innerText;
    bookingData.movie = document.getElementById('book-title').innerText;
    step1.style.display = 'none';
    step2.style.display = 'block';
    generateSeats();
    updateSummary();
});

function generateSeats() {
    const seatsGrid = document.getElementById('seats-grid');
    seatsGrid.innerHTML = '';
    selectedSeatsCount = 0;
    const rows = 6;
    const cols = 8;

    for (let i = 0; i < rows; i++) {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'seat-row';
        for (let j = 0; j < cols; j++) {
            const seat = document.createElement('div');
            seat.className = 'seat';
            if (Math.random() < 0.2) {
                seat.classList.add('occupied');
            } else {
                seat.addEventListener('click', () => {
                    seat.classList.toggle('selected');
                    if (seat.classList.contains('selected')) selectedSeatsCount++;
                    else selectedSeatsCount--;
                    updateSummary();
                });
            }
            rowDiv.appendChild(seat);
        }
        seatsGrid.appendChild(rowDiv);
    }
}

function updateSummary() {
    document.getElementById('count-seats').innerText = selectedSeatsCount;
    const total = selectedSeatsCount * currentMoviePrice;
    document.getElementById('total-price').innerText = total;

    const confirmBtn = document.getElementById('btn-confirm-booking');
    if (selectedSeatsCount > 0) {
        confirmBtn.style.opacity = '1';
        confirmBtn.style.pointerEvents = 'auto';
        confirmBtn.innerText = `CONFIRMER (${total} DH)`;
    } else {
        confirmBtn.style.opacity = '0.5';
        confirmBtn.style.pointerEvents = 'none';
        confirmBtn.innerText = "CHOISISSEZ UNE PLACE";
    }
}

document.getElementById('btn-confirm-booking').addEventListener('click', () => {
    document.getElementById('recap-movie').innerText = bookingData.movie;
    document.getElementById('recap-session').innerText = bookingData.date + " à " + bookingData.time;
    document.getElementById('recap-seats').innerText = selectedSeatsCount + " place(s)";
    document.getElementById('recap-price').innerText = document.getElementById('total-price').innerText + " DH";
    step2.style.display = 'none';
    step3.style.display = 'block';
});

document.getElementById('btn-final-pay').addEventListener('click', () => {
    const btn = document.getElementById('btn-final-pay');
    btn.innerText = "TRAITEMENT...";
    setTimeout(() => {
        alert("Paiement réussi ! Votre billet est disponible.");
        bookingModal.classList.remove('show');
        setTimeout(() => bookingModal.style.display = 'none', 300);
    }, 1500);
});

document.getElementById('btn-back-step-1').addEventListener('click', () => {
    step2.style.display = 'none';
    step1.style.display = 'block';
});

document.getElementById('btn-back-step-2').addEventListener('click', () => {
    step3.style.display = 'none';
    step2.style.display = 'block';
});

if (closeBookingBtn) {
    closeBookingBtn.addEventListener('click', () => {
        bookingModal.classList.remove('show');
        setTimeout(() => bookingModal.style.display = 'none', 300);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    fetchMovies();
    if (authToken) {
        loadUserProfile();
        updateHeaderBtn(true);
    }
    setTimeout(attachHeroReserveButtons, 500);
});
