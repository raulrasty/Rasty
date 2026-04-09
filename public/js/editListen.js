if (!requireLogin()) throw new Error("No autenticado");

const params = new URLSearchParams(window.location.search);
const listenId = params.get("listen_id");
const messageDiv = document.getElementById("message");
const form = document.getElementById("editListenForm");
const submitBtn = form.querySelector("button[type='submit']");

if (!listenId) {
  alert("No se ha especificado la escucha");
  window.location.href = "/";
}

let selectedSongIds = [];
let currentAlbumId = null;
let currentListen = null;

function showError(msg) {
  messageDiv.innerHTML = `<p class="msg-error">${msg}</p>`;
}

function showSuccess(msg) {
  messageDiv.innerHTML = `<p class="msg-success">${msg}</p>`;
}

function clearMessage() {
  messageDiv.innerHTML = "";
}

function setLoading(loading) {
  submitBtn.disabled = loading;
  submitBtn.textContent = loading ? "Guardando..." : "Guardar cambios";
}

async function loadListenData() {
  const { userId } = getSession();

  try {
    const res = await authFetch(`http://localhost:3000/listens/user/${userId}`);
    if (!res.ok) throw new Error("No se pudieron cargar las escuchas");

    const listens = await res.json();
    currentListen = listens.find(l => l.id === listenId);

    if (!currentListen) throw new Error("Escucha no encontrada");

    currentAlbumId = currentListen.album.id;

    document.getElementById("album-cover").src =
      currentListen.album.cover_url || "https://via.placeholder.com/200?text=Sin+portada";
    document.getElementById("album-title").textContent = currentListen.album.title || "Título no disponible";
    document.getElementById("album-artist").textContent = currentListen.album.artist || "Artista no disponible";

    if (currentListen.rating) {
      document.getElementById("ratingValue").value = currentListen.rating;
      updateStars(currentListen.rating);
    }

    if (currentListen.liked) {
      document.getElementById("likedValue").value = "true";
      document.getElementById("heart").classList.add("liked");
    }

    if (currentListen.review) {
      document.getElementById("review").value = currentListen.review;
    }

    if (currentListen.listen_date) {
      document.getElementById("listen_date").value =
        new Date(currentListen.listen_date).toISOString().split("T")[0];
    }

    const favRes = await fetch(`http://localhost:3000/favorite-songs/listen/${listenId}`);
    const currentFavs = await favRes.json();
    selectedSongIds = currentFavs.map(f => f.song_id);

    await loadSongsForSelection(currentAlbumId);

  } catch (err) {
    console.error(err);
    showError(`Error cargando la escucha: ${err.message}`);
  }
}

async function loadSongsForSelection(albumId) {
  try {
    const res = await fetch(`http://localhost:3000/songs/${albumId}`);
    const data = await res.json();
    const songs = data.songs || [];

    const list = document.getElementById("favorite-songs-list");
    list.innerHTML = "";

    if (!songs.length) {
      list.innerHTML = '<li class="songs-empty">No hay canciones disponibles</li>';
      return;
    }

    songs.forEach(song => {
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

  } catch (err) {
    console.error("Error cargando canciones:", err);
  }
}

function toggleFavoriteSong(songId, element) {
  if (selectedSongIds.includes(songId)) {
    selectedSongIds = selectedSongIds.filter(id => id !== songId);
    element.classList.remove("selected");
    clearMessage();
  } else {
    if (selectedSongIds.length >= 3) {
      showError("Solo puedes elegir 3 canciones favoritas");
      return;
    }
    selectedSongIds.push(songId);
    element.classList.add("selected");
    clearMessage();
  }
}

loadListenData();

// Sistema de estrellas
const ratingInput = document.getElementById("ratingValue");

document.querySelectorAll(".star .half, .star .full").forEach(span => {
  span.addEventListener("click", (e) => {
    e.stopPropagation();
    const value = parseFloat(span.dataset.value);
    ratingInput.value = value;
    updateStars(value);
  });
});

function updateStars(value) {
  document.querySelectorAll(".star .half").forEach(half => {
    half.classList.toggle("filled", parseFloat(half.dataset.value) <= value);
  });
  document.querySelectorAll(".star .full").forEach(full => {
    full.classList.toggle("filled", parseFloat(full.dataset.value) <= value);
  });
}

// Sistema de corazón
const heart = document.getElementById("heart");
const likedInput = document.getElementById("likedValue");

heart.addEventListener("click", () => {
  const liked = likedInput.value === "true";
  likedInput.value = (!liked).toString();
  heart.classList.toggle("liked", !liked);
});

// Envío del formulario
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearMessage();

  const { userId } = getSession();

  const originalDate = new Date(currentListen.listen_date).toISOString().split("T")[0];
  const newDate = document.getElementById("listen_date").value;

  const body = {
    rating: ratingInput.value ? parseFloat(ratingInput.value) : null,
    liked: likedInput.value === "true",
    review: document.getElementById("review").value || null,
    listen_date: newDate !== originalDate ? newDate : null,
  };

  setLoading(true);

  try {
    const res = await authFetch(`http://localhost:3000/listens/${listenId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({ error: "Error desconocido" }));

    if (!res.ok) {
      showError(data.error || "Error al actualizar la escucha");
      return;
    }

    // Actualizar canciones favoritas del listen
    await authFetch(`http://localhost:3000/favorite-songs/listen/${listenId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ songIds: selectedSongIds }),
    });

    // Comprobar si es el listen más reciente
    const allListensRes = await authFetch(`http://localhost:3000/listens/user/${userId}`);
    const allListens = await allListensRes.json();
    const albumListens = allListens
      .filter(l => l.album.id === currentAlbumId)
      .sort((a, b) => new Date(b.listen_date) - new Date(a.listen_date));

    if (albumListens[0]?.id === listenId) {
      await authFetch(`http://localhost:3000/favorite-songs/album/${currentAlbumId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ songIds: selectedSongIds }),
      });

      if (body.rating) {
        await authFetch(`http://localhost:3000/album-ratings/${currentAlbumId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rating: body.rating }),
        });
      }
    }

    showSuccess("¡Escucha actualizada correctamente!");
    setTimeout(() => {
      window.location.href = `/listensUser.html?user_id=${userId}`;
    }, 800);

  } catch (err) {
    console.error(err);
    showError("No se pudo conectar con el servidor. Inténtalo de nuevo.");
  } finally {
    setLoading(false);
  }
});