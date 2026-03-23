const API_URL = "http://localhost:3000"; // tu backend
let token = null; // se guarda después del login
let userId = null; // se guarda después del login

// ====================== BUSCAR ÁLBUM ======================
document.getElementById("search-btn").addEventListener("click", async () => {
  const title = document.getElementById("album-title").value;
  const artist = document.getElementById("album-artist").value;
  const results = document.getElementById("albums-results");

  try {
    const res = await fetch(
      `${API_URL}/albums/search-mb?title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}`,
    );
    const data = await res.json();

    if (data.album) {
      results.innerHTML = `
        <h3>${data.album.title} - ${data.album.artist}</h3>
        <img src="${data.album.cover_url}" width="150">
        <ul>
          ${data.tracks.map((t) => `<li>${t.position}. ${t.title} (${t.length ? (t.length / 1000).toFixed(1) + "s" : "-"})</li>`).join("")}
        </ul>
        <button id="add-listen-btn">Marcar como escuchado</button>
      `;

      document
        .getElementById("add-listen-btn")
        .addEventListener("click", async () => {
          // 🔑 Leer token y usuario desde localStorage
          const token = localStorage.getItem("token");
          const user = JSON.parse(localStorage.getItem("user"));

          if (!token || !user)
            return alert("Debes hacer login para registrar la escucha");

          try {
            const resListen = await fetch(`${API_URL}/listens`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                title: document.getElementById("album-title").value,
                artist: document.getElementById("album-artist").value,
              }),
            });

            const listenData = await resListen.json();
            alert(listenData.message || "Escucha registrada!");

            fetchUserListens(); // actualizar lista inmediatamente
          } catch (err) {
            console.error(err);
            alert("Error al registrar la escucha");
          }
        });
    } else {
      results.textContent = "Álbum no encontrado";
    }
  } catch (err) {
    results.textContent = "Error al buscar álbum";
    console.error(err);
  }
});

// ====================== MIS ESCUCHAS ======================
async function fetchUserListens() {
  // 🔑 Leer usuario y token desde localStorage
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

  if (!token || !user) return; // si no hay login, no hacemos nada

  try {
    const res = await fetch(`${API_URL}/listens/${user.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      console.error("Error al obtener escuchas:", await res.text());
      return;
    }

    const listens = await res.json();

    const listensList = document.getElementById("listens-list");
    if (!listensList) return;

    listensList.innerHTML = ""; // limpiar lista

    listens.forEach((l) => {
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
    albumsList.innerHTML = ""; // limpiar lista

    for (const a of albums) {
      const albumDiv = document.createElement("div");
      albumDiv.classList.add("album");

      // ===================== OBTENER CANCIONES DESDE EL BACKEND =====================
      let tracksHtml = "";
      try {
        const resSongs = await fetch(`${API_URL}/songs/${a.id}`);
        if (resSongs.ok) {
          const dataSongs = await resSongs.json();
          const songs = dataSongs.songs;

          if (songs && songs.length > 0) {
            tracksHtml = "<ol>";
            songs.forEach((track) => {
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

      // ===================== RENDER DEL ÁLBUM =====================
      albumDiv.innerHTML = `
        <img src="${a.cover_url}" alt="Portada de ${a.title}" width="120">
        <h3>${a.title}</h3>
        <p>${a.artist}</p>
        <p>${a.release_year || "Año desconocido"}</p>
        <div class="tracks">${tracksHtml}</div>
      `;

      albumsList.appendChild(albumDiv);
    }
  } catch (err) {
    console.error("Error al traer álbumes:", err);
  }
}
// ====================== INICIAL ======================
window.addEventListener("DOMContentLoaded", () => {
  fetchAllAlbums();
  // fetchUserListens(); <-- ya no llamamos aquí, se hace después del login
});
