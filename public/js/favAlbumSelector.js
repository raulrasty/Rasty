const FAV_ALBUMS_URL = `${API_BASE}/favorite-albums`
let currentFavAlbums = [];

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

async function openFavSlotSelector(album, onSaved) {
  await loadCurrentFavAlbums();

  const overlay = document.createElement("div");
  overlay.className = "fav-slot-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", "Seleccionar posición de álbum favorito");
  overlay.innerHTML = `
    <div class="fav-slot-popup">
      <h4>¿En qué posición quieres añadir este álbum?</h4>
      <p class="fav-slot-album-name">${album.title}</p>
      <div class="fav-slot-grid" id="fav-slot-grid" role="list"></div>
      <button class="fav-slot-cancel">Cancelar</button>
    </div>
  `;

  document.body.appendChild(overlay);

  const grid = overlay.querySelector("#fav-slot-grid");
  for (let i = 1; i <= 5; i++) {
    const existing = currentFavAlbums.find(f => f.position === i);
    const slot = document.createElement("div");
    slot.className = "fav-slot-item";
    slot.setAttribute("role", "listitem");
    slot.setAttribute("tabindex", "0");
    slot.setAttribute("aria-label", existing
      ? `Posición ${i}: ${existing.title}`
      : `Posición ${i}: vacío`);

    slot.innerHTML = existing
      ? `<img src="${existing.cover_url || 'https://via.placeholder.com/60'}"
           alt="Portada de ${existing.title}">
         <span>${existing.title}</span>`
      : `<div class="fav-slot-empty" aria-hidden="true">+</div><span>Vacío</span>`;

    const selectSlot = async () => {
      await saveFavAlbumInSlot(album, i);
      document.body.removeChild(overlay);
      if (onSaved) onSaved();
    };

    slot.addEventListener("click", selectSlot);
    slot.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        selectSlot();
      }
    });

    grid.appendChild(slot);
  }

  const cancelBtn = overlay.querySelector(".fav-slot-cancel");
  cancelBtn.addEventListener("click", () => document.body.removeChild(overlay));

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) document.body.removeChild(overlay);
  });

  // Cerrar con Escape
  const handleKeydown = (e) => {
    if (e.key === "Escape") {
      document.body.removeChild(overlay);
      document.removeEventListener("keydown", handleKeydown);
    }
  };
  document.addEventListener("keydown", handleKeydown);

  // Focus al abrir
  cancelBtn.focus();
}

async function saveFavAlbumInSlot(album, position) {
  const updated = currentFavAlbums.filter(
    f => f.position !== position && f.album_id !== album.id
  );
  updated.push({ album_id: album.id, position });

  await authFetch(FAV_ALBUMS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      albums: updated.map(a => ({ album_id: a.album_id, position: a.position }))
    })
  });
}