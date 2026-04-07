const FAV_ALBUMS_URL = "http://localhost:3000/favorite-albums";
let currentFavAlbums = [];

// Cargar favoritos actuales del usuario
async function loadCurrentFavAlbums() {
  try {
    const { userId } = getSession();
    const res = await fetch(`${FAV_ALBUMS_URL}/${userId}`);
    const data = await res.json();
    currentFavAlbums = data.map(f => ({
      album_id: f.album.id,
      position: f.position,
      title: f.album.title,
      cover_url: f.album.cover_url
    }));
  } catch (_) {
    currentFavAlbums = [];
  }
}

// Abrir popup selector de slot
async function openFavSlotSelector(album, onSaved) {
  await loadCurrentFavAlbums();

  const overlay = document.createElement("div");
  overlay.className = "fav-slot-overlay";
  overlay.innerHTML = `
    <div class="fav-slot-popup">
      <h4>¿En qué posición quieres añadir este álbum?</h4>
      <p class="fav-slot-album-name">${album.title}</p>
      <div class="fav-slot-grid" id="fav-slot-grid"></div>
      <button class="fav-slot-cancel">Cancelar</button>
    </div>
  `;

  document.body.appendChild(overlay);

  const grid = overlay.querySelector("#fav-slot-grid");
  for (let i = 1; i <= 5; i++) {
    const existing = currentFavAlbums.find(f => f.position === i);
    const slot = document.createElement("div");
    slot.className = "fav-slot-item";
    slot.innerHTML = existing
      ? `<img src="${existing.cover_url || 'https://via.placeholder.com/60'}" alt="${existing.title}">
         <span>${existing.title}</span>`
      : `<div class="fav-slot-empty">+</div><span>Vacío</span>`;

    slot.addEventListener("click", async () => {
      await saveFavAlbumInSlot(album, i);
      document.body.removeChild(overlay);
      if (onSaved) onSaved();
    });

    grid.appendChild(slot);
  }

  overlay.querySelector(".fav-slot-cancel").addEventListener("click", () => {
    document.body.removeChild(overlay);
  });

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) document.body.removeChild(overlay);
  });
}

// Guardar álbum en un slot concreto
async function saveFavAlbumInSlot(album, position) {
  const updated = currentFavAlbums.filter(f => f.position !== position && f.album_id !== album.id);
  updated.push({ album_id: album.id, position });

  await authFetch(FAV_ALBUMS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      albums: updated.map(a => ({ album_id: a.album_id, position: a.position }))
    })
  });
}