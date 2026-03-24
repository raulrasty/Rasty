const API_URL = "http://localhost:3000";
let token = localStorage.getItem("token");
let userId = localStorage.getItem("userId");

// ====================== CONTROL DE SECCIONES PRIVADAS ======================
function toggleUserSections() {
  const listensSection = document.getElementById("listens-section");
  const addListenButtons = document.querySelectorAll(".add-listen-btn");

  if (token && userId) {
    if (listensSection) listensSection.style.display = "block";
    addListenButtons.forEach(btn => btn.style.display = "inline-block");
  } else {
    if (listensSection) listensSection.style.display = "none";
    addListenButtons.forEach(btn => btn.style.display = "none");
  }
}

// ====================== BUSCAR ÁLBUM ======================
document.getElementById("search-btn").addEventListener("click", async () => {
  const title = document.getElementById("album-title").value;
  const artist = document.getElementById("album-artist").value;
  const results = document.getElementById("albums-results");
  results.innerHTML = "Buscando...";

  if (!artist) return alert("Debes ingresar un artista");

  try {
    const res = await fetch(
      `${API_URL}/albums/search-mb?title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}`
    );
    const data = await res.json();

    // El controller devuelve el array directamente
    if (!Array.isArray(data) || data.length === 0) {
      results.textContent = "No se encontraron álbumes";
      return;
    }

    results.innerHTML = "";

    data.forEach(({ album, tracks }) => {
      const albumDiv = document.createElement("div");
      albumDiv.classList.add("album-result");

      const tracksList =
        tracks && tracks.length > 0
          ? `<ul>${tracks.map(t =>
              `<li>${t.position}. ${t.title} (${t.length ? (t.length / 1000).toFixed(1) + "s" : "-"})</li>`
            ).join("")}</ul>`
          : "<p>No hay canciones registradas</p>";

      albumDiv.innerHTML = `
        <h3>${album.title} – ${album.artist}${album.release_year ? ` (${album.release_year})` : ""}</h3>
        <img src="${album.cover_url}" width="150" onerror="this.src='placeholder.png'">
        ${tracksList}
        <button class="add-listen-btn">Marcar como escuchado</button>
        <hr>
      `;

      results.appendChild(albumDiv);

      albumDiv.querySelector(".add-listen-btn").addEventListener("click", async () => {
        if (!token || !userId) return alert("Debes hacer login para registrar la escucha");

        try {
          const resListen = await fetch(`${API_URL}/listens`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ title: album.title, artist: album.artist }),
          });

          const listenData = await resListen.json();
          alert(listenData.message || "Escucha registrada!");
          fetchUserListens();
        } catch (err) {
          console.error(err);
          alert("Error al registrar la escucha");
        }
      });
    });

    toggleUserSections(); // mostrar/ocultar botones según si hay sesión
  } catch (err) {
    console.error(err);
    results.textContent = "Error al buscar álbum";
  }
});

// ====================== MIS ESCUCHAS ======================
async function fetchUserListens() {
  if (!token || !userId) return;

  try {
    const res = await fetch(`${API_URL}/listens/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      console.error("Error al obtener escuchas:", await res.text());
      return;
    }

    const listens = await res.json();
    const listensList = document.getElementById("listens-list");
    if (!listensList) return;

    listensList.innerHTML = "";
    listens.forEach(l => {
      const li = document.createElement("li");
      li.textContent = `${l.album.title} — escuchado el ${new Date(l.listen_date).toLocaleDateString()}${l.rating ? " — Rating: " + l.rating : ""}`;
      listensList.appendChild(li);
    });
  } catch (err) {
    console.error("Error al traer escuchas:", err);
  }
}

// ====================== TODOS LOS ÁLBUMES ======================
async function fetchAllAlbums() {
  try {
    const res = await fetch(`${API_URL}/albums`);
    const albums = await res.json();

    const albumsList = document.getElementById("albums-list");
    albumsList.innerHTML = "";

    for (const a of albums) {
      const albumDiv = document.createElement("div");
      albumDiv.classList.add("album");

      let tracksHtml = "";
      try {
        const resSongs = await fetch(`${API_URL}/songs/${a.id}`);
        if (resSongs.ok) {
          const dataSongs = await resSongs.json();
          const songs = dataSongs.songs;

          if (songs && songs.length > 0) {
            tracksHtml = "<ol>";
            songs.forEach(track => {
              tracksHtml += `<li>${track.position}. ${track.title} (${track.length ? (track.length / 1000).toFixed(1) + "s" : "-"})</li>`;
            });
            tracksHtml += "</ol>";
          } else {
            tracksHtml = "<p>No hay canciones registradas</p>";
          }
        } else {
          tracksHtml = "<p>Error al obtener canciones</p>";
        }
      } catch (err) {
        console.error("Error al traer canciones del álbum", a.id, err);
        tracksHtml = "<p>Error al obtener canciones</p>";
      }

      albumDiv.innerHTML = `
        <img src="${a.cover_url}" alt="Portada de ${a.title}" width="120">
        <h3>${a.title}</h3>
        <p>${a.artist}</p>
        <p>${a.release_year || "Año desconocido"}</p>
        <div class="tracks">${tracksHtml}</div>
        <button class="add-listen-btn">Marcar como escuchado</button>
      `;

      albumsList.appendChild(albumDiv);
    }

    toggleUserSections();
  } catch (err) {
    console.error("Error al traer álbumes:", err);
  }
}

// ====================== INICIAL ======================
window.addEventListener("DOMContentLoaded", () => {
  fetchAllAlbums();
  toggleUserSections();
  if (token && userId) fetchUserListens();
});