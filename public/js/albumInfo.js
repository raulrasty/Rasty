const API_URL_ALBUM = "http://localhost:3000/albumInfo";
const API_URL_SONGS = "http://localhost:3000/songs";

function formatDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000); // convertir a segundos
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
    // Cargar datos del álbum
    const resAlbum = await fetch(`${API_URL_ALBUM}/${albumId}`);
    const album = await resAlbum.json();

    if (!resAlbum.ok) throw new Error(album.error || "Error al cargar el álbum");

    coverImg.src = album.cover_url?.trim() || 'images/fallback.jpg';
    titleEl.innerText = album.title || "Título no disponible";
    artistEl.innerText = album.artist || "Artista no disponible";
    yearEl.innerText = album.release_year ? `Año de lanzamiento: ${album.release_year}` : '';

    // Cargar canciones del álbum
    const resSongs = await fetch(`${API_URL_SONGS}/${albumId}`);
    const songsData = await resSongs.json();

    songsContainer.innerHTML = ''; // limpiar antes
    if (songsData.songs && songsData.songs.length > 0) {
      songsData.songs.forEach(song => {
        const li = document.createElement('li');
        li.innerText = `${song.position}. ${song.title} (${formatDuration(song.length)})`;
        songsContainer.appendChild(li);
      });
    } else {
      songsContainer.innerHTML = '<li>No hay canciones disponibles</li>';
    }

  } catch (error) {
    console.error('Error cargando álbum o canciones:', error);
    titleEl.innerText = "Error";
    artistEl.innerText = error.message;
    coverImg.src = 'images/fallback.jpg';
    songsContainer.innerHTML = '<li>Error al cargar canciones</li>';
  }
}

loadAlbum();