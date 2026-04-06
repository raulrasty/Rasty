const API_URL_ALBUM = "http://localhost:3000/albumInfo";
const API_URL_SONGS = "http://localhost:3000/songs";
const API_URL_FAVORITES = "http://localhost:3000/favorite-songs";

let albumSongs = [];
let selectedSongIds = [];

function formatDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

async function loadAlbum() {
  const params = new URLSearchParams(window.location.search);
  const albumId = params.get("id");

  const coverImg = document.getElementById("album-cover");
  const titleEl = document.getElementById("album-title");
  const artistEl = document.getElementById("album-artist");
  const yearEl = document.getElementById("album-year");
  const songsContainer = document.getElementById("songs-container");

  if (!albumId) {
    titleEl.innerText = "Álbum no especificado";
    return;
  }

  try {
    // Cargar info del álbum
    const resAlbum = await fetch(`${API_URL_ALBUM}/${albumId}`);
    const album = await resAlbum.json();
    if (!resAlbum.ok) throw new Error(album.error || "Error al cargar el álbum");

    coverImg.src = album.cover_url?.trim() || 'images/fallback.jpg';
    titleEl.innerText = album.title || "Título no disponible";
    artistEl.innerText = album.artist || "Artista no disponible";
    yearEl.innerText = album.release_year ? `Año de lanzamiento: ${album.release_year}` : '';

    // Cargar canciones
    const resSongs = await fetch(`${API_URL_SONGS}/${albumId}`);
    const songsData = await resSongs.json();
    albumSongs = songsData.songs || [];

    songsContainer.innerHTML = '';
    if (albumSongs.length > 0) {
      albumSongs.forEach(song => {
        const li = document.createElement('li');
        li.innerText = `${song.position}. ${song.title} (${formatDuration(song.length)})`;
        songsContainer.appendChild(li);
      });
    } else {
      songsContainer.innerHTML = '<li>No hay canciones disponibles</li>';
    }

    // Si está logueado, cargar sección de favoritas
    if (isLoggedIn()) {
      await loadFavoriteSongsSection(albumId);
    }

  } catch (error) {
    console.error('Error cargando álbum o canciones:', error);
    titleEl.innerText = "Error";
    artistEl.innerText = error.message;
    coverImg.src = 'images/fallback.jpg';
    songsContainer.innerHTML = '<li>Error al cargar canciones</li>';
  }
}

// Cargar sección de canciones favoritas del álbum
async function loadFavoriteSongsSection(albumId) {
  const section = document.getElementById("favorite-songs-section");
  section.classList.remove("hidden");

  const list = document.getElementById("album-favorite-songs-list");
  list.innerHTML = "";

  // Obtener favoritas actuales del usuario para este álbum
  try {
    const res = await authFetch(`${API_URL_FAVORITES}/album/${albumId}`);
    const currentFavorites = await res.json();
    selectedSongIds = currentFavorites.map(f => f.song_id);
  } catch (_) {
    selectedSongIds = [];
  }

  // Renderizar lista de canciones seleccionables
  albumSongs.forEach(song => {
    const li = document.createElement("li");
    li.className = "favorite-song-item";
    li.dataset.songId = song.id;
    li.textContent = `${song.position}. ${song.title}`;

    if (selectedSongIds.includes(song.id)) {
      li.classList.add("selected");
    }

    li.addEventListener("click", () => toggleFavoriteSong(song.id, li));
    list.appendChild(li);
  });

  // Guardar favoritas
  document.getElementById("save-favorites-btn").addEventListener("click", async () => {
    const favMsg = document.getElementById("favorites-message");
    try {
      await authFetch(`${API_URL_FAVORITES}/album/${albumId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ songIds: selectedSongIds }),
      });
      favMsg.textContent = "Favoritas guardadas correctamente";
      favMsg.style.color = "var(--accent)";
    } catch (err) {
      favMsg.textContent = "Error al guardar favoritas";
      favMsg.style.color = "var(--red)";
    }
  });
}

// Seleccionar/deseleccionar canción favorita
function toggleFavoriteSong(songId, element) {
  const favMsg = document.getElementById("favorites-message");
  if (selectedSongIds.includes(songId)) {
    selectedSongIds = selectedSongIds.filter(id => id !== songId);
    element.classList.remove("selected");
  } else {
    if (selectedSongIds.length >= 3) {
      favMsg.textContent = "Solo puedes elegir 3 canciones favoritas";
      favMsg.style.color = "var(--red)";
      return;
    }
    selectedSongIds.push(songId);
    element.classList.add("selected");
    favMsg.textContent = "";
  }
}

loadAlbum();