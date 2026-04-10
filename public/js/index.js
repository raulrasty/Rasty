const COMMUNITY_URL = "http://localhost:3000/community";

document.addEventListener("DOMContentLoaded", async () => {
  const main = document.getElementById("main-content");
  main.innerHTML = '<p class="state-msg">Cargando...</p>';

  try {
    const [topWeekRes, topRatedRes] = await Promise.all([
      fetch(`${COMMUNITY_URL}/top-week`),
      fetch(`${COMMUNITY_URL}/top-rated`)
    ]);

    const topWeek = await topWeekRes.json();
    const topRated = await topRatedRes.json();

    let followingActivity = [];
    let followingTopWeek = [];
    let followingTopRated = [];
    let ownActivity = [];

    if (isLoggedIn()) {
      const [activityRes, followingTopRes, followingRatedRes, ownActivityRes] = await Promise.all([
        authFetch(`${COMMUNITY_URL}/following-activity`),
        authFetch(`${COMMUNITY_URL}/following-top-week`),
        authFetch(`${COMMUNITY_URL}/following-top-rated`),
        authFetch(`${COMMUNITY_URL}/own-activity`)
      ]);
      followingActivity = await activityRes.json();
      followingTopWeek = await followingTopRes.json();
      followingTopRated = await followingRatedRes.json();
      ownActivity = await ownActivityRes.json();
    }

    renderPage(main, { topWeek, topRated, followingActivity, followingTopWeek, followingTopRated, ownActivity });

  } catch (err) {
    console.error(err);
    main.innerHTML = '<p class="state-msg" role="alert">Error cargando la página</p>';
  }
});

function renderPage(container, { topWeek, topRated, followingActivity, followingTopWeek, followingTopRated, ownActivity }) {
  container.innerHTML = `
    <div class="home">

      <section class="home-hero" aria-label="Bienvenida">
        <h1 class="home-title">Rasty</h1>
        <p class="home-tagline">Tu diario musical</p>
        <p class="home-desc">Registra los álbumes que escuchas, descubre lo que escuchan tus amigos y lleva el control de tu música favorita.</p>
        ${!isLoggedIn() ? `
          <div class="home-cta-group">
            <a href="/register.html" class="home-cta">Crear cuenta</a>
            <a href="#" id="home-login-btn" class="home-cta-secondary">Iniciar sesión</a>
          </div>
        ` : ''}
      </section>

      <div class="home-row" role="region" aria-label="Álbumes de la comunidad">
        <section class="home-section" aria-label="Más escuchados esta semana">
          <h2 class="home-section-title">🔥 Más escuchados esta semana</h2>
          <div class="home-album-list" id="top-week"></div>
        </section>
        <section class="home-section" aria-label="Mejor valorados">
          <h2 class="home-section-title">⭐ Mejor valorados</h2>
          <div class="home-album-list" id="top-rated"></div>
        </section>
      </div>

      ${isLoggedIn() ? `
      <div class="home-row" role="region" aria-label="Álbumes de tus seguidos">
        <section class="home-section" aria-label="Más escuchados entre tus seguidos">
          <h2 class="home-section-title">🎵 Más escuchados entre tus seguidos</h2>
          <div class="home-album-list" id="following-top-week"></div>
        </section>
        <section class="home-section" aria-label="Mejor valorados por tus seguidos">
          <h2 class="home-section-title">⭐ Mejor valorados por tus seguidos</h2>
          <div class="home-album-list" id="following-top-rated"></div>
        </section>
      </div>

      <div class="home-row" role="region" aria-label="Actividad reciente">
        <section class="home-section" aria-label="Última actividad de tus seguidos">
          <h2 class="home-section-title">👥 Última actividad de tus seguidos</h2>
          <div id="following-activity"></div>
        </section>
        <section class="home-section" aria-label="Tu última actividad">
          <h2 class="home-section-title">🎧 Tu última actividad</h2>
          <div id="own-activity"></div>
        </section>
      </div>
      ` : ''}

    </div>
  `;

  renderAlbumList('top-week', topWeek, true, false);
  renderAlbumList('top-rated', topRated, false, true);

  if (isLoggedIn()) {
    renderAlbumList('following-top-week', followingTopWeek, true, false);
    renderAlbumList('following-top-rated', followingTopRated, false, true);
    renderFollowingActivity('following-activity', followingActivity);
    renderOwnActivity('own-activity', ownActivity);
  } else {
    document.getElementById("home-login-btn")?.addEventListener("click", (e) => {
      e.preventDefault();
      document.getElementById("loginModal").style.display = "flex";
    });
  }
}

function renderAlbumList(containerId, albums, showCount = false, showRating = false) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!albums.length) {
    container.innerHTML = '<p class="empty-msg">No hay datos aún</p>';
    return;
  }

  albums.forEach((item, i) => {
    const album = item.album;
    const card = document.createElement("a");
    card.className = "home-album-card";
    card.href = `/albumInfo.html?id=${album.id}`;
    card.setAttribute("aria-label", `${album.title} de ${album.artist}${showCount ? `, ${item.count} escuchas` : ''}${showRating ? `, valoración media ${item.average}` : ''}`);
    card.innerHTML = `
      <span class="home-album-pos" aria-hidden="true">${i + 1}</span>
      <img src="${album.cover_url || 'https://via.placeholder.com/48'}"
           alt="Portada de ${album.title}"
           onerror="this.src='https://via.placeholder.com/48'">
      <div class="home-album-info">
        <p class="home-album-title">${album.title}</p>
        <p class="home-album-artist">${album.artist}</p>
      </div>
      ${showCount ? `<span class="home-album-stat" aria-hidden="true">${item.count} escuchas</span>` : ''}
      ${showRating ? `<span class="home-album-stat" aria-hidden="true">★ ${item.average}</span>` : ''}
    `;
    container.appendChild(card);
  });
}

function renderFollowingActivity(containerId, listens) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!listens.length) {
    container.innerHTML = `
      <p class="empty-msg">Nadie a quien sigues ha registrado escuchas aún.</p>
      <a href="/searchUsers.html" class="feed-empty-link">Buscar usuarios</a>
    `;
    return;
  }

  listens.forEach(l => {
    const card = document.createElement("article");
    card.className = "activity-card";
    card.setAttribute("aria-label", `${l.user.username} escuchó ${l.album.title}`);

    const avatarSrc = l.user.avatar_url ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(l.user.username || "U")}&background=1db954&color=000&size=40`;

    card.innerHTML = `
      <a href="/userProfile.html?user_id=${l.user.id}" class="activity-user"
        aria-label="Ver perfil de ${l.user.username}">
        <img src="${avatarSrc}" alt="${l.user.username}" class="activity-avatar">
        <span class="activity-username">${l.user.username}</span>
      </a>
      <a href="/albumInfo.html?id=${l.album.id}" class="activity-album"
        aria-label="Ver álbum ${l.album.title} de ${l.album.artist}">
        <img src="${l.album.cover_url || 'https://via.placeholder.com/48'}"
             alt="Portada de ${l.album.title}"
             onerror="this.src='https://via.placeholder.com/48'"
             class="activity-cover">
        <div class="activity-info">
          <p class="activity-title">${l.album.title}</p>
          <p class="activity-artist">${l.album.artist}</p>
          ${l.rating ? `<p class="activity-rating" aria-label="Valoración: ${l.rating} estrellas">★ ${l.rating}</p>` : ''}
          ${l.review ? `<p class="activity-review">"${l.review}"</p>` : ''}
        </div>
      </a>
      ${l.favoriteSongs?.length ? `
        <ul class="activity-fav-songs" aria-label="Canciones favoritas">
          ${l.favoriteSongs.map(s => `<li>🎵 ${s.title}</li>`).join('')}
        </ul>` : ''}
      <p class="activity-date">
        <time datetime="${l.listen_date}">
          ${new Date(l.listen_date).toLocaleDateString('es-ES')}
        </time>
      </p>
    `;

    container.appendChild(card);
  });
}

function renderOwnActivity(containerId, listens) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!listens.length) {
    container.innerHTML = '<p class="empty-msg">Aún no has registrado ninguna escucha.</p>';
    return;
  }

  listens.forEach(l => {
    const card = document.createElement("article");
    card.className = "activity-card";
    card.setAttribute("aria-label", `Escuchaste ${l.album.title}`);

    card.innerHTML = `
      <a href="/albumInfo.html?id=${l.album.id}" class="activity-album"
        aria-label="Ver álbum ${l.album.title} de ${l.album.artist}">
        <img src="${l.album.cover_url || 'https://via.placeholder.com/48'}"
             alt="Portada de ${l.album.title}"
             onerror="this.src='https://via.placeholder.com/48'"
             class="activity-cover">
        <div class="activity-info">
          <p class="activity-title">${l.album.title}</p>
          <p class="activity-artist">${l.album.artist}</p>
          ${l.rating ? `<p class="activity-rating" aria-label="Valoración: ${l.rating} estrellas">★ ${l.rating}</p>` : ''}
          ${l.review ? `<p class="activity-review">"${l.review}"</p>` : ''}
        </div>
      </a>
      ${l.favoriteSongs?.length ? `
        <ul class="activity-fav-songs" aria-label="Canciones favoritas">
          ${l.favoriteSongs.map(s => `<li>🎵 ${s.title}</li>`).join('')}
        </ul>` : ''}
      <p class="activity-date">
        <time datetime="${l.listen_date}">
          ${new Date(l.listen_date).toLocaleDateString('es-ES')}
        </time>
      </p>
    `;

    container.appendChild(card);
  });
}