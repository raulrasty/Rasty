if (!requireLogin()) throw new Error("No autenticado");

const params = new URLSearchParams(window.location.search);
const albumId = params.get("album_id");
const messageDiv = document.getElementById("message");
const form = document.getElementById("listenForm");
const submitBtn = form.querySelector("button[type='submit']");

if (!albumId) {
  alert("No se ha especificado el álbum");
  window.location.href = "/";
}

document.getElementById("albumId").value = albumId;
document.getElementById("listen_date").valueAsDate = new Date();

let selectedSongIds = [];

function showError(msg) {
  messageDiv.innerHTML = `<p class="msg-error" role="alert">${msg}</p>`;
}

function showSuccess(msg) {
  messageDiv.innerHTML = `<p class="msg-success" role="status">${msg}</p>`;
}

function clearMessage() {
  messageDiv.innerHTML = "";
}

function setLoading(loading) {
  submitBtn.disabled = loading;
  submitBtn.textContent = loading ? "Guardando..." : "Registrar escucha";
  submitBtn.setAttribute("aria-busy", loading.toString());
}

async function loadAlbumInfo() {
  try {
    const res = await fetch(`http://localhost:3000/albumInfo/${albumId}`);
    if (!res.ok) throw new Error("Álbum no encontrado");

    const album = await res.json();
    const coverEl = document.getElementById("album-cover");
    coverEl.src = album.cover_url?.trim() || "https://via.placeholder.com/200?text=Sin+portada";
    coverEl.alt = `Portada de ${album.title}`;
    document.getElementById("album-title").textContent = album.title || "Título no disponible";
    document.getElementById("album-artist").textContent = album.artist || "Artista no disponible";

    await loadSongsForSelection();
  } catch (err) {
    console.error(err);
    showError(`No se pudo cargar la información del álbum: ${err.message}`);
  }
}

async function loadSongsForSelection() {
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

    songs.forEach((song) => {
      const li = document.createElement("li");
      li.className = "favorite-song-item";
      li.dataset.songId = song.id;
      li.textContent = `${song.position}. ${song.title}`;
      li.setAttribute("role", "button");
      li.setAttribute("tabindex", "0");
      li.setAttribute("aria-pressed", "false");
      li.setAttribute("aria-label", `Marcar ${song.title} como favorita`);
      li.addEventListener("click", () => toggleFavoriteSong(song.id, li));
      li.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggleFavoriteSong(song.id, li);
        }
      });
      list.appendChild(li);
    });
  } catch (err) {
    console.error("Error cargando canciones:", err);
  }
}

function toggleFavoriteSong(songId, element) {
  if (selectedSongIds.includes(songId)) {
    selectedSongIds = selectedSongIds.filter((id) => id !== songId);
    element.classList.remove("selected");
    element.setAttribute("aria-pressed", "false");
    clearMessage();
  } else {
    if (selectedSongIds.length >= 3) {
      showError("Solo puedes elegir 3 canciones favoritas");
      return;
    }
    selectedSongIds.push(songId);
    element.classList.add("selected");
    element.setAttribute("aria-pressed", "true");
    clearMessage();
  }
}

loadAlbumInfo();

// Sistema de estrellas
const ratingInput = document.getElementById("ratingValue");

document.querySelectorAll(".star .half, .star .full").forEach(span => {
  span.addEventListener("click", (e) => {
    e.stopPropagation();
    const value = parseFloat(span.dataset.value);
    ratingInput.value = value;
    updateStars(value);
  });
  span.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const value = parseFloat(span.dataset.value);
      ratingInput.value = value;
      updateStars(value);
    }
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

function toggleHeart() {
  const liked = likedInput.value === "true";
  likedInput.value = (!liked).toString();
  heart.classList.toggle("liked", !liked);
  heart.setAttribute("aria-pressed", (!liked).toString());
  heart.setAttribute("aria-label", !liked ? "Quitar me gusta" : "Marcar como me gusta");
}

heart.addEventListener("click", toggleHeart);
heart.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    toggleHeart();
  }
});

// Envío del formulario
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearMessage();

  const { userId } = getSession();
  const formData = new FormData(form);
  const body = Object.fromEntries(formData.entries());

  body.rating = body.rating ? parseFloat(body.rating) : null;
  body.liked = body.liked === "true";

  if (!body.listen_date) {
    showError("La fecha de escucha es obligatoria");
    return;
  }

  setLoading(true);

  try {
    const res = await authFetch("http://localhost:3000/listens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({ error: "Error desconocido" }));

    if (!res.ok) {
      showError(data.error || "Error al registrar la escucha");
      return;
    }

    if (selectedSongIds.length > 0) {
      await authFetch(`http://localhost:3000/favorite-songs/listen/${data.listen.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ songIds: selectedSongIds }),
      });

      await authFetch(`http://localhost:3000/favorite-songs/album/${albumId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ songIds: selectedSongIds }),
      });
    }

    if (body.rating) {
      await authFetch(`http://localhost:3000/album-ratings/${albumId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: body.rating }),
      });
    }

    showSuccess("¡Escucha registrada correctamente!");
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