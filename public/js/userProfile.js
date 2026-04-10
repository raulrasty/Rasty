const API_URL = "http://localhost:3000/users";
const FOLLOWS_URL = "http://localhost:3000/follows";
const LISTENS_URL = "http://localhost:3000/listens";
const FAV_ALBUMS_URL = "http://localhost:3000/favorite-albums";

const params = new URLSearchParams(window.location.search);
const profileUserId = params.get("user_id");

let selectedFavAlbums = [];

document.addEventListener("DOMContentLoaded", async () => {
  if (!profileUserId) {
    displayError("No se especificó ningún usuario.");
    return;
  }

  try {
    const res = await fetch(`${API_URL}/${profileUserId}`);
    if (!res.ok) throw new Error(`Usuario con ID ${profileUserId} no encontrado`);
    const user = await res.json();
    renderUser(user);

    await Promise.all([
      loadFollowStats(),
      loadCounts(),
      loadFavoriteAlbums(),
      loadRecentListens(),
      loadUserRatingChart(),
    ]);

    if (isOwnProfile(profileUserId)) {
      const editProfileBtn = document.getElementById("editProfileBtn");
      editProfileBtn.classList.remove("hidden");
      editProfileBtn.addEventListener("click", () => {
        window.location.href = `/editUserProfile.html?user_id=${profileUserId}`;
      });

      const editFavBtn = document.getElementById("editFavAlbumsBtn");
      editFavBtn.classList.remove("hidden");
      editFavBtn.addEventListener("click", openFavAlbumsModal);
    } else if (isLoggedIn()) {
      await loadFollowButton();
    }

    // Navegación — ahora son botones
    document.getElementById("albums-nav").addEventListener("click", () => {
      window.location.href = `/userAlbums.html?user_id=${profileUserId}`;
    });
    document.getElementById("listens-nav").addEventListener("click", () => {
      window.location.href = `/listensUser.html?user_id=${profileUserId}`;
    });
    document.getElementById("followers-nav").addEventListener("click", () => {
      window.location.href = `/followers.html?user_id=${profileUserId}&type=followers`;
    });
    document.getElementById("following-nav").addEventListener("click", () => {
      window.location.href = `/followers.html?user_id=${profileUserId}&type=following`;
    });

    document.getElementById("closeFavModal")?.addEventListener("click", closeFavAlbumsModal);

    // Cerrar modal con Escape
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeFavAlbumsModal();
    });

    document.getElementById("saveFavAlbums")?.addEventListener("click", async () => {
      try {
        await authFetch(`${FAV_ALBUMS_URL}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            albums: selectedFavAlbums.map((a, i) => ({
              album_id: a.album_id,
              position: i + 1
            }))
          })
        });
        closeFavAlbumsModal();
        await loadFavoriteAlbums();
      } catch (err) {
        console.error("Error guardando álbumes favoritos:", err);
      }
    });

  } catch (err) {
    console.error(err);
    displayError("Error cargando el usuario.");
  }
});

function renderUser(user) {
  document.getElementById("username").textContent = user.username || "Sin nombre";
  document.getElementById("bio").textContent = user.bio || "";
  document.title = `${user.username} - Rasty`;

  const locationEl = document.getElementById("location");
  const birthDateEl = document.getElementById("birth_date");
  if (locationEl) locationEl.textContent = user.location ? `📍 ${user.location}` : "";
  if (birthDateEl) birthDateEl.textContent = user.birth_date
    ? `🎂 ${new Date(user.birth_date).toLocaleDateString("es-ES")}`
    : "";

  const avatarEl = document.getElementById("avatar");
  avatarEl.src = user.avatar_url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username || "U")}&background=1db954&color=000&size=128`;
  avatarEl.alt = `Avatar de ${user.username}`;
}

async function loadCounts() {
  try {
    const res = await fetch(`${LISTENS_URL}/${profileUserId}`);
    const listens = await res.json();
    const uniqueAlbums = new Set(listens.map(l => l.album_id)).size;
    document.getElementById("albums-count").textContent = uniqueAlbums;
    document.getElementById("listens-count").textContent = listens.length;
  } catch (_) {}
}

async function loadFollowStats() {
  try {
    const [followersRes, followingRes] = await Promise.all([
      fetch(`${FOLLOWS_URL}/followers/${profileUserId}`),
      fetch(`${FOLLOWS_URL}/following/${profileUserId}`)
    ]);
    const followers = await followersRes.json();
    const following = await followingRes.json();
    document.getElementById("followers-count").textContent = followers.length;
    document.getElementById("following-count").textContent = following.length;
  } catch (err) {
    console.error("Error cargando seguidores:", err);
  }
}

async function loadFollowButton() {
  try {
    const res = await authFetch(`${FOLLOWS_URL}/is-following/${profileUserId}`);
    const data = await res.json();
    const followBtn = document.getElementById("followBtn");
    followBtn.classList.remove("hidden");
    updateFollowButton(followBtn, data.following);

    followBtn.addEventListener("click", async () => {
      const isCurrentlyFollowing = followBtn.dataset.following === "true";
      if (isCurrentlyFollowing) {
        await authFetch(`${FOLLOWS_URL}/${profileUserId}`, { method: "DELETE" });
      } else {
        await authFetch(`${FOLLOWS_URL}/${profileUserId}`, { method: "POST" });
      }
      updateFollowButton(followBtn, !isCurrentlyFollowing);
      await loadFollowStats();
    });
  } catch (err) {
    console.error("Error cargando botón de seguir:", err);
  }
}

function updateFollowButton(btn, isFollowing) {
  btn.textContent = isFollowing ? "Dejar de seguir" : "Seguir";
  btn.dataset.following = isFollowing.toString();
  btn.setAttribute("aria-pressed", isFollowing.toString());
  btn.classList.toggle("following", isFollowing);
}

async function loadFavoriteAlbums() {
  try {
    const res = await fetch(`${FAV_ALBUMS_URL}/${profileUserId}`);
    const favAlbums = await res.json();
    const grid = document.getElementById("favorite-albums-grid");
    grid.innerHTML = "";

    for (let i = 1; i <= 5; i++) {
      const fav = favAlbums.find(f => f.position === i);
      const slot = document.createElement("div");
      slot.className = "fav-album-slot";

      if (fav) {
        slot.innerHTML = `
          <a href="/albumInfo.html?id=${fav.album.id}"
            aria-label="${fav.album.title} de ${fav.album.artist}">
            <img src="${fav.album.cover_url || 'https://via.placeholder.com/120'}"
                 alt="Portada de ${fav.album.title}"
                 onerror="this.src='https://via.placeholder.com/120'">
          </a>
        `;
      } else {
        slot.innerHTML = `<div class="fav-album-empty" aria-label="Slot vacío">+</div>`;
      }

      grid.appendChild(slot);
    }

    selectedFavAlbums = favAlbums.map(f => ({
      album_id: f.album.id,
      position: f.position,
      title: f.album.title,
      cover_url: f.album.cover_url
    }));

  } catch (err) {
    console.error("Error cargando álbumes favoritos:", err);
  }
}

async function loadRecentListens() {
  try {
    const res = await fetch(`${LISTENS_URL}/${profileUserId}`);
    const listens = await res.json();
    const recent = listens.slice(0, 5);

    const container = document.getElementById("recent-listens");
    container.innerHTML = "";

    if (!recent.length) {
      container.innerHTML = '<p class="empty-msg">No hay escuchas registradas</p>';
      return;
    }

    recent.forEach(l => {
      const card = document.createElement("a");
      card.className = "recent-listen-card";
      card.href = `/albumInfo.html?id=${l.album.id}`;
      card.setAttribute("aria-label", `${l.album.title} de ${l.album.artist}${l.rating ? `, valoración ${l.rating}` : ''}`);
      card.innerHTML = `
        <img src="${l.album.cover_url || 'https://via.placeholder.com/60'}"
             alt="Portada de ${l.album.title}"
             onerror="this.src='https://via.placeholder.com/60'">
        <div class="recent-listen-info">
          <p class="recent-listen-title">${l.album.title}</p>
          <p class="recent-listen-artist">${l.album.artist}</p>
          ${l.rating ? `<p class="recent-listen-rating" aria-label="Valoración ${l.rating}">★ ${l.rating}</p>` : ''}
        </div>
      `;
      container.appendChild(card);
    });

  } catch (err) {
    console.error("Error cargando escuchas recientes:", err);
  }
}

async function loadUserRatingChart() {
  try {
    const res = await fetch(`http://localhost:3000/user-ratings/${profileUserId}`);
    const { distribution, total, average } = await res.json();

    const avgEl = document.getElementById("user-rating-average");
    avgEl.textContent = total > 0
      ? `Media: ★ ${average} (${total} valoraciones)`
      : "Aún no has valorado ningún álbum";

    const chart = document.getElementById("user-rating-chart");
    chart.innerHTML = "";

    if (!total) return;

    const labels = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];
    const max = Math.max(...Object.values(distribution));

    const row = document.createElement("div");
    row.className = "rating-chart-horizontal";
    row.setAttribute("role", "img");
    row.setAttribute("aria-label", `Distribución de puntuaciones. Media: ${average}`);

    labels.forEach(val => {
      const count = distribution[val] || 0;
      const pct = max > 0 ? (count / max) * 100 : 0;

      const col = document.createElement("div");
      col.className = "rating-col";
      col.innerHTML = `
        <div class="rating-col-bar-wrap" title="${count} valoraciones con ${val} estrellas">
          <div class="rating-col-bar" style="height: ${pct}%"></div>
        </div>
        <span class="rating-col-label" aria-hidden="true">${val}</span>
        <span class="rating-col-count" aria-hidden="true">${count}</span>
      `;
      row.appendChild(col);
    });

    chart.appendChild(row);

  } catch (err) {
    console.error("Error cargando gráfica de ratings:", err);
  }
}

function openFavAlbumsModal() {
  const modal = document.getElementById("favAlbumsModal");
  modal.classList.remove("hidden");
  document.getElementById("closeFavModal").focus();
  renderSelectedFavAlbums();
}

function closeFavAlbumsModal() {
  document.getElementById("favAlbumsModal").classList.add("hidden");
  document.getElementById("editFavAlbumsBtn").focus();
}

function renderSelectedFavAlbums() {
  const container = document.getElementById("favAlbumSelected");
  container.innerHTML = "";

  for (let i = 0; i < 5; i++) {
    const fav = selectedFavAlbums[i];
    const slot = document.createElement("div");
    slot.className = "fav-selected-slot";

    if (fav) {
      slot.innerHTML = `
        <img src="${fav.cover_url || 'https://via.placeholder.com/60'}"
          alt="Portada de ${fav.title}">
        <button class="remove-fav" data-index="${i}"
          aria-label="Eliminar ${fav.title} de favoritos">✕</button>
      `;
      slot.querySelector(".remove-fav").addEventListener("click", () => {
        selectedFavAlbums.splice(i, 1);
        renderSelectedFavAlbums();
      });
    } else {
      slot.innerHTML = `<div class="fav-album-empty" aria-label="Slot vacío">+</div>`;
    }

    container.appendChild(slot);
  }
}

function displayError(message) {
  const container = document.querySelector(".profile-container");
  container.innerHTML = `<p role="alert" style="color:red;text-align:center;margin-top:50px;">${message}</p>`;
}