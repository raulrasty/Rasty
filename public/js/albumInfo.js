const API_URL_ALBUM = `${API_BASE}/albumInfo`;
const API_URL_SONGS = `${API_BASE}/songs`;
const API_URL_FAVORITES = `${API_BASE}/favorite-songs`;
const API_URL_RATINGS = `${API_BASE}/album-ratings`;

let albumSongs = [];
let selectedSongIds = [];
let currentAlbumId = null;
let currentUserRating = null;
let currentAudio = null;
let currentPlayBtn = null;

function formatDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

async function getItunesPreview(songTitle, artistName) {
  try {
    const query = encodeURIComponent(`${songTitle} ${artistName}`);
    const itunesUrl = encodeURIComponent(`https://itunes.apple.com/search?term=${query}&entity=song&limit=1&country=US`);
    const res = await fetch(`https://corsproxy.io/?${itunesUrl}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.results?.[0]?.previewUrl || null;
  } catch (_) {
    return null;
  }
}

function togglePreview(previewUrl, btn, songTitle) {
  if (currentAudio && currentPlayBtn && currentPlayBtn !== btn) {
    currentAudio.pause();
    currentAudio = null;
    currentPlayBtn.textContent = "▶";
    currentPlayBtn.setAttribute("aria-label", `Escuchar preview`);
    currentPlayBtn.classList.remove("playing");
  }

  if (currentAudio && currentPlayBtn === btn) {
    currentAudio.pause();
    currentAudio = null;
    currentPlayBtn = null;
    btn.textContent = "▶";
    btn.setAttribute("aria-label", `Escuchar preview de ${songTitle}`);
    btn.classList.remove("playing");
    return;
  }

  const audio = new Audio(previewUrl);
  audio.play();
  currentAudio = audio;
  currentPlayBtn = btn;
  btn.textContent = "⏸";
  btn.setAttribute("aria-label", `Pausar preview de ${songTitle}`);
  btn.classList.add("playing");

  audio.addEventListener("ended", () => {
    btn.textContent = "▶";
    btn.setAttribute("aria-label", `Escuchar preview de ${songTitle}`);
    btn.classList.remove("playing");
    currentAudio = null;
    currentPlayBtn = null;
  });
}

async function loadAlbum() {
  const params = new URLSearchParams(window.location.search);
  currentAlbumId = params.get("id");

  const coverImg = document.getElementById("album-cover");
  const titleEl = document.getElementById("album-title");
  const artistEl = document.getElementById("album-artist");
  const yearEl = document.getElementById("album-year");
  const songsContainer = document.getElementById("songs-container");

  if (!currentAlbumId) {
    titleEl.innerText = "Álbum no especificado";
    return;
  }

  try {
    const resAlbum = await fetch(`${API_URL_ALBUM}/${currentAlbumId}`);
    const album = await resAlbum.json();
    if (!resAlbum.ok)
      throw new Error(album.error || "Error al cargar el álbum");

    coverImg.src = album.cover_url?.trim() || "images/fallback.jpg";
    coverImg.alt = `Portada de ${album.title}`;
    titleEl.innerText = album.title || "Título no disponible";
    artistEl.innerHTML = album.artist
  ? `<a href="/searchAlbums.html?artist=${encodeURIComponent(album.artist)}" class="artist-link">${album.artist}</a>`
  : "Artista no disponible";
    yearEl.innerText = album.release_year
      ? `Año de lanzamiento: ${album.release_year}`
      : "";

    const resSongs = await fetch(`${API_URL_SONGS}/${currentAlbumId}`);
    const songsData = await resSongs.json();
    albumSongs = songsData.songs || [];

    songsContainer.innerHTML = "";
    if (albumSongs.length > 0) {
      for (const song of albumSongs) {
        const li = document.createElement("li");
        li.className = "song-item";
        li.dataset.songId = song.id;
        li.setAttribute("role", "listitem");

        const songText = document.createElement("span");
        songText.className = "song-text";
        songText.textContent = `${song.position}. ${song.title} (${formatDuration(song.length)})`;
        li.appendChild(songText);

        const previewUrl = await getItunesPreview(song.title, album.artist);
        if (previewUrl) {
          const playBtn = document.createElement("button");
          playBtn.className = "preview-btn";
          playBtn.textContent = "▶";
          playBtn.setAttribute("aria-label", `Escuchar preview de ${song.title}`);
          playBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            togglePreview(previewUrl, playBtn, song.title);
          });
          // Soporte teclado
          playBtn.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              e.stopPropagation();
              togglePreview(previewUrl, playBtn, song.title);
            }
          });
          li.appendChild(playBtn);
        }

        if (isLoggedIn()) {
          li.classList.add("clickable");
          li.setAttribute("role", "button");
          li.setAttribute("tabindex", "0");
          li.setAttribute("aria-label", `Marcar ${song.title} como favorita`);
          li.addEventListener("click", () => toggleFavoriteSong(song.id, li));
          li.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              toggleFavoriteSong(song.id, li);
            }
          });
        }

        songsContainer.appendChild(li);
      }
    } else {
      songsContainer.innerHTML = "<li>No hay canciones disponibles</li>";
    }

    await loadCommunityData(currentAlbumId);

    if (isLoggedIn()) {
      await loadUserFavorites(currentAlbumId);
      await loadUserRating(currentAlbumId);
      await loadFollowingData(currentAlbumId);

      document.getElementById("favorite-songs-section").classList.remove("hidden");
      document.getElementById("user-rating-section").classList.remove("hidden");
      document.getElementById("following-section").classList.remove("hidden");

      const favBtn = document.getElementById("fav-album-btn");
      favBtn.classList.remove("hidden");
      favBtn.addEventListener("click", () => {
        openFavSlotSelector({
          id: currentAlbumId,
          title: titleEl.innerText,
          cover_url: coverImg.src,
        });
      });

      const createListenBtn = document.getElementById("create-listen-btn");
      createListenBtn.classList.remove("hidden");
      createListenBtn.href = `/createListen.html?album_id=${currentAlbumId}`;

      document.getElementById("save-favorites-btn").addEventListener("click", async () => {
        const favMsg = document.getElementById("favorites-message");
        try {
          await authFetch(`${API_URL_FAVORITES}/album/${currentAlbumId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ songIds: selectedSongIds }),
          });
          favMsg.textContent = "Favoritas guardadas";
          favMsg.style.color = "var(--accent)";
          await loadCommunityData(currentAlbumId);
        } catch (err) {
          favMsg.textContent = "Error al guardar";
          favMsg.style.color = "var(--red)";
        }
      });

      document.getElementById("save-rating-btn").addEventListener("click", async () => {
        const ratingMsg = document.getElementById("rating-message");
        if (!currentUserRating) {
          ratingMsg.textContent = "Selecciona una puntuación";
          ratingMsg.style.color = "var(--red)";
          return;
        }
        try {
          await authFetch(`${API_URL_RATINGS}/${currentAlbumId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ rating: currentUserRating }),
          });
          ratingMsg.textContent = "Puntuación guardada";
          ratingMsg.style.color = "var(--accent)";
          await loadCommunityData(currentAlbumId);
        } catch (err) {
          ratingMsg.textContent = "Error al guardar";
          ratingMsg.style.color = "var(--red)";
        }
      });
    }
  } catch (error) {
    console.error("Error cargando álbum:", error);
    titleEl.innerText = "Error";
  }
}

async function loadUserRating(albumId) {
  try {
    const res = await authFetch(`${API_URL_RATINGS}/${albumId}/my-rating`);
    const data = await res.json();
    currentUserRating = data.rating;
    if (currentUserRating) updateAlbumStars(currentUserRating);
  } catch (_) {}

  document.querySelectorAll("#album-star-rating .half, #album-star-rating .full").forEach((span) => {
    span.addEventListener("click", (e) => {
      e.stopPropagation();
      currentUserRating = parseFloat(span.dataset.value);
      updateAlbumStars(currentUserRating);
    });
    span.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        currentUserRating = parseFloat(span.dataset.value);
        updateAlbumStars(currentUserRating);
      }
    });
  });
}

function updateAlbumStars(value) {
  document.querySelectorAll("#album-star-rating .half").forEach((half) => {
    half.classList.toggle("filled", parseFloat(half.dataset.value) <= value);
  });
  document.querySelectorAll("#album-star-rating .full").forEach((full) => {
    full.classList.toggle("filled", parseFloat(full.dataset.value) <= value);
  });
}

async function loadUserFavorites(albumId) {
  try {
    const res = await authFetch(`${API_URL_FAVORITES}/album/${albumId}`);
    const currentFavorites = await res.json();
    selectedSongIds = currentFavorites.map((f) => f.song_id);
  } catch (_) {
    selectedSongIds = [];
  }

  document.querySelectorAll(".song-item").forEach((li) => {
    const isSelected = selectedSongIds.includes(li.dataset.songId);
    li.classList.toggle("selected", isSelected);
    li.setAttribute("aria-pressed", isSelected.toString());
  });
}

function toggleFavoriteSong(songId, element) {
  const favMsg = document.getElementById("favorites-message");
  if (selectedSongIds.includes(songId)) {
    selectedSongIds = selectedSongIds.filter((id) => id !== songId);
    element.classList.remove("selected");
    element.setAttribute("aria-pressed", "false");
  } else {
    if (selectedSongIds.length >= 3) {
      favMsg.textContent = "Solo puedes elegir 3 canciones favoritas";
      favMsg.style.color = "var(--red)";
      return;
    }
    selectedSongIds.push(songId);
    element.classList.add("selected");
    element.setAttribute("aria-pressed", "true");
    favMsg.textContent = "";
  }
}

async function loadCommunityData(albumId) {
  try {
    const [avgRes, distRes, favsRes] = await Promise.all([
      fetch(`${API_URL_RATINGS}/${albumId}/average`),
      fetch(`${API_URL_RATINGS}/${albumId}/distribution`),
      fetch(`${API_URL_FAVORITES}/album/${albumId}/top`),
    ]);

    const { average } = await avgRes.json();
    const { distribution, total } = await distRes.json();
    const topSongs = await favsRes.json();

    const avgEl = document.getElementById("community-average");
    avgEl.textContent = average
      ? `Media: ★ ${average} (${total} valoraciones)`
      : "Sin valoraciones aún";

    renderRatingChart(distribution, total);

    const list = document.getElementById("community-favorites-list");
    list.innerHTML = "";
    if (!topSongs.length) {
      list.innerHTML = '<li class="empty-msg">Aún no hay favoritas</li>';
    } else {
      topSongs.forEach(({ song }) => {
        const li = document.createElement("li");
        li.textContent = `🎵 ${song.title}`;
        list.appendChild(li);
      });
    }
  } catch (err) {
    console.error("Error cargando datos comunidad:", err);
  }
}

function renderRatingChart(distribution, total) {
  const chart = document.getElementById("rating-chart");
  chart.innerHTML = "";

  if (!total) return;

  const labels = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];
  const max = Math.max(...Object.values(distribution));

  labels.forEach((val) => {
    const count = distribution[val] || 0;
    const pct = max > 0 ? (count / max) * 100 : 0;

    const row = document.createElement("div");
    row.className = "chart-row";
    row.setAttribute("role", "row");
    row.innerHTML = `
      <span class="chart-label" aria-hidden="true">${val}</span>
      <div class="chart-bar-wrap" role="progressbar"
        aria-valuenow="${count}" aria-valuemin="0" aria-valuemax="${max}"
        aria-label="${count} valoraciones con ${val} estrellas">
        <div class="chart-bar" style="width: ${pct}%"></div>
      </div>
      <span class="chart-count" aria-hidden="true">${count}</span>
    `;
    chart.appendChild(row);
  });
}

async function loadFollowingData(albumId) {
  try {
    const [favsRes, ratingsRes] = await Promise.all([
      authFetch(`${API_URL_FAVORITES}/album/${albumId}/following`),
      authFetch(`${API_URL_RATINGS}/${albumId}/following`),
    ]);

    const favsData = await favsRes.json();
    const ratingsData = await ratingsRes.json();

    const usersMap = {};

    favsData.forEach(({ user, songs }) => {
      const uid = user.id;
      if (!usersMap[uid]) usersMap[uid] = { user, songs: [], rating: null };
      usersMap[uid].songs = songs;
    });

    ratingsData.forEach(({ user, rating }) => {
      const uid = user.id;
      if (!usersMap[uid]) usersMap[uid] = { user, songs: [], rating: null };
      usersMap[uid].rating = rating;
    });

    const container = document.getElementById("following-list");
    container.innerHTML = "";

    const users = Object.values(usersMap);
    if (!users.length) {
      container.innerHTML = '<p class="empty-msg">Nadie a quien sigues ha interactuado con este álbum</p>';
      return;
    }

    users.forEach(({ user, songs, rating }) => {
      const avatarSrc =
        user.avatar_url ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username || "U")}&background=1db954&color=000&size=40`;

      const div = document.createElement("div");
      div.className = "following-item";
      div.innerHTML = `
        <a href="/userProfile.html?user_id=${user.id}" class="following-user"
          aria-label="Ver perfil de ${user.username}">
          <img src="${avatarSrc}" alt="${user.username}" class="following-avatar">
          <span class="following-username">${user.username}</span>
        </a>
        <div class="following-data">
          ${rating ? `<p class="following-rating" aria-label="Puntuación: ${rating} estrellas">★ ${rating}</p>` : ""}
          ${songs.length ? `
            <ul class="following-songs" aria-label="Canciones favoritas de ${user.username}">
              ${songs.map((s) => `<li>🎵 ${s.title}</li>`).join("")}
            </ul>` : ""}
        </div>
      `;
      container.appendChild(div);
    });
  } catch (err) {
    console.error("Error cargando datos de seguidos:", err);
  }
}

loadAlbum();