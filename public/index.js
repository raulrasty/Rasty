const API_URL = "http://localhost:3000"; // tu backend
let token = null; // se guarda después del login
let userId = null; // se guarda después del login

// ====================== REGISTRO ======================
document.getElementById("register-btn").addEventListener("click", async () => {
  const email = document.getElementById("reg-email").value;
  const password = document.getElementById("reg-password").value;
  const msg = document.getElementById("register-msg");

  try {
    const res = await fetch(`${API_URL}/users/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();

    if (data.id) {
      msg.textContent = "Registro exitoso! Ahora puedes hacer login.";
    } else {
      msg.textContent = data.error || "Error en el registro";
    }
  } catch (err) {
    msg.textContent = "Error en la petición";
    console.error(err);
  }
});

// ====================== LOGIN ======================
document.getElementById("login-btn").addEventListener("click", async () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const msg = document.getElementById("login-msg");

  try {
    const res = await fetch(`${API_URL}/users/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();

    if (data.token) {
      token = data.token;
      userId = data.user.id; // guardamos el ID del usuario
      msg.textContent = "Login exitoso!";
      
      fetchUserListens(); // actualizar escuchas al login
    } else {
      msg.textContent = data.error || "Error al hacer login";
    }
  } catch (err) {
    msg.textContent = "Error en la petición";
    console.error(err);
  }
});

// ====================== BUSCAR ÁLBUM ======================
document.getElementById("search-btn").addEventListener("click", async () => {
  const title = document.getElementById("album-title").value;
  const artist = document.getElementById("album-artist").value;
  const results = document.getElementById("albums-results");

  try {
    const res = await fetch(`${API_URL}/albums/search-mb?title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}`);
    const data = await res.json();

    if (data.album) {
      results.innerHTML = `
        <h3>${data.album.title} - ${data.album.artist}</h3>
        <img src="${data.album.cover_url}" width="150">
        <ul>
          ${data.tracks.map(t => `<li>${t.position}. ${t.title} (${t.length ? (t.length/1000).toFixed(1) + 's' : '-'})</li>`).join('')}
        </ul>
        <button id="add-listen-btn">Marcar como escuchado</button>
      `;

      document.getElementById("add-listen-btn").addEventListener("click", async () => {
        if (!token) return alert("Debes hacer login para registrar la escucha");

        const resListen = await fetch(`${API_URL}/listens`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ title, artist })
        });
        const listenData = await resListen.json();
        alert(listenData.message || "Escucha registrada!");
        
        fetchUserListens(); // actualizar lista inmediatamente
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
  if (!token || !userId) return;

  try {
    const res = await fetch(`${API_URL}/listens/${userId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const listens = await res.json();

    const listensList = document.getElementById("listens-list");
    listensList.innerHTML = ""; // limpiar lista

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
            songs.forEach(track => {
              tracksHtml += `<li>${track.position}. ${track.title} (${track.length ? (track.length/1000).toFixed(1) + 's' : '-'})</li>`;
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