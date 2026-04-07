const params = new URLSearchParams(window.location.search);
const profileUserId = params.get("user_id");

document.getElementById("back-btn").addEventListener("click", () => {
  window.location.href = `/userProfile.html?user_id=${profileUserId}`;
});

async function loadAlbums() {
  try {
    const res = await fetch(`http://localhost:3000/listens/albums/${profileUserId}`);
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
      slot.innerHTML = `
        <img src="${album.cover_url || 'https://via.placeholder.com/120'}"
             alt="${album.title}"
             onerror="this.src='https://via.placeholder.com/120'">
        <div class="album-slot-info">
          <p class="album-slot-title">${album.title}</p>
          <p class="album-slot-artist">${album.artist}</p>
        </div>
      `;
      grid.appendChild(slot);
    });

  } catch (err) {
    console.error(err);
    document.getElementById("albums-grid").innerHTML = '<p class="state-msg">Error cargando álbumes</p>';
  }
}

loadAlbums();