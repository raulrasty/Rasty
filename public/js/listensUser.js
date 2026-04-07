const params = new URLSearchParams(window.location.search);

// ID del usuario cuyo perfil estamos visitando
const profileUserId = params.get("user_id");

// Función para obtener las escuchas del usuario
async function fetchListens() {
  try {
    const res = await fetch(`http://localhost:3000/listens/${profileUserId}`);
    const listens = await res.json();
    displayListens(listens);
  } catch (err) {
    console.error(err);
    document.getElementById("listens-container").innerHTML =
      '<p class="state-msg">Error cargando escuchas</p>';
  }
}

// Función para mostrar las escuchas agrupadas por mes y día
async function displayListens(listens) {
  const container = document.getElementById("listens-container");
  container.innerHTML = "";

  if (!listens.length) {
    container.innerHTML = '<p class="state-msg">No hay escuchas registradas</p>';
    return;
  }

  // Agrupar por mes y día
  const grouped = {};

  listens.forEach((l) => {
    const date = new Date(l.listen_date);
    const monthKey = date.toLocaleDateString("es-ES", { month: "long", year: "numeric" });
    const dayKey = date.toLocaleDateString("es-ES", { day: "numeric", month: "long" });

    if (!grouped[monthKey]) grouped[monthKey] = {};
    if (!grouped[monthKey][dayKey]) grouped[monthKey][dayKey] = [];

    grouped[monthKey][dayKey].push(l);
  });

  // Renderizar agrupado
  for (const [month, days] of Object.entries(grouped)) {
    // Cabecera de mes
    const monthHeader = document.createElement("h2");
    monthHeader.className = "month-header";
    monthHeader.textContent = month.charAt(0).toUpperCase() + month.slice(1);
    container.appendChild(monthHeader);

    for (const [day, dayListens] of Object.entries(days)) {
      // Cabecera de día
      const dayHeader = document.createElement("h3");
      dayHeader.className = "day-header";
      dayHeader.textContent = day.charAt(0).toUpperCase() + day.slice(1);
      container.appendChild(dayHeader);

      // Contenedor del día
      const dayContainer = document.createElement("div");
      dayContainer.className = "day-container";
      container.appendChild(dayContainer);

      // Ordenar por hora dentro del día y luego invertir (más reciente primero)
      const sortedDayListens = [...dayListens].sort((a, b) =>
        new Date(a.listen_date) - new Date(b.listen_date)
      );

      for (const l of [...sortedDayListens].reverse()) {
        const card = document.createElement("div");
        card.className = "listen-card";

        // Portada del álbum
        const img = document.createElement("img");
        img.className = "album-cover";
        img.src = l.album.cover_url || "https://via.placeholder.com/120";
        img.alt = l.album.title;

        // Info del listen
        const info = document.createElement("div");
        info.className = "listen-info";
        info.innerHTML = `
          <h2>${l.album.title} - ${l.album.artist}</h2>
          ${l.rating ? `<p class="rating">${l.rating}/5</p>` : ""}
          ${l.liked ? `<p class="liked">💚 Te gusta</p>` : ""}
          ${l.review ? `<p><em>"${l.review}"</em></p>` : ""}
        `;

        // Canciones favoritas (bloque independiente)
        const favDiv = document.createElement("div");
        favDiv.className = "listen-favorites";

        try {
          const favRes = await fetch(`http://localhost:3000/favorite-songs/listen/${l.id}`);
          const favSongs = await favRes.json();

          if (favSongs.length > 0) {
            favDiv.innerHTML = `
              <p class="favorites-label">Canciones favoritas:</p>
              <ul>
                ${favSongs.map((f) => `<li>♪ ${f.song.title}</li>`).join("")}
              </ul>
            `;
          }
        } catch (_) {}

        // Botones a la derecha
        const btnGroup = document.createElement("div");
        btnGroup.className = "listen-actions";

        const btnAlbum = document.createElement("button");
        btnAlbum.textContent = "Ver Álbum";
        btnAlbum.className = "btn-album";
        btnAlbum.onclick = () => window.location.href = `/albumInfo.html?id=${l.album.id}`;
        btnGroup.appendChild(btnAlbum);

        if (isOwnProfile(profileUserId)) {
          const btnEdit = document.createElement("button");
          btnEdit.textContent = "Editar";
          btnEdit.className = "btn-edit";
          btnEdit.onclick = () => window.location.href = `/editListen.html?listen_id=${l.id}`;

          const btnDelete = document.createElement("button");
          btnDelete.textContent = "Eliminar";
          btnDelete.className = "btn-delete";
          btnDelete.onclick = () => deleteListen(l.id, card);

          btnGroup.appendChild(btnEdit);
          btnGroup.appendChild(btnDelete);
        }

        // Orden: foto | info | favoritas | botones
        card.appendChild(img);
        card.appendChild(info);
        card.appendChild(favDiv);
        card.appendChild(btnGroup);
        dayContainer.appendChild(card);
      }
    }
  }
}

// Eliminar una escucha
async function deleteListen(listenId, cardElement) {
  if (!confirm("¿Seguro que quieres eliminar esta escucha?")) return;

  const res = await authFetch(`http://localhost:3000/listens/${listenId}`, {
    method: "DELETE",
  });

  if (res.ok) {
    cardElement.remove();
  } else {
    alert("Error eliminando la escucha");
  }
}

fetchListens();