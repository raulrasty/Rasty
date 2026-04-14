const params = new URLSearchParams(window.location.search);
const profileUserId = params.get("user_id");

const backBtn = document.getElementById("back-btn");

backBtn.addEventListener("click", () => {
  window.location.href = `/userProfile.html?user_id=${profileUserId}`;
});

backBtn.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    window.location.href = `/userProfile.html?user_id=${profileUserId}`;
  }
});

async function loadAlbums() {
  try {
    const res = await fetch(`${API_BASE}/listens/albums/${profileUserId}`);
    const albums = await res.json();

    const grid = document.getElementById("albums-grid");
    grid.innerHTML = "";

    if (!albums.length) {
      grid.innerHTML = '<p class="state-msg">No hay álbumes escuchados</p>';
      return;
    }

    albums.forEach(album => {
      const slot = document.createElement("a");
      slot.className = "album-slot";
      slot.href = `/albumInfo.html?id=${album.id}`;
      slot.setAttribute("aria-label", `${album.title} de ${album.artist}`);
      slot.innerHTML = `
        <img src="${album.cover_url || 'https://via.placeholder.com/120'}"
             alt="Portada de ${album.title}"
             onerror="this.src='https://via.placeholder.com/120'">
        <div class="album-slot-info" aria-hidden="true">
          <p class="album-slot-title">${album.title}</p>
          <p class="album-slot-artist">${album.artist}</p>
        </div>
      `;
      grid.appendChild(slot);
    });

  } catch (err) {
    console.error(err);
    document.getElementById("albums-grid").innerHTML =
      '<p class="state-msg" role="alert">Error cargando álbumes</p>';
  }
}

loadAlbums();