
const API_URL = "http://localhost:3000/users";

//// ID del usuario cuyo perfil se está visitando
const params = new URLSearchParams(window.location.search);
const profileUserId = params.get("user_id");


//Carga principal de la página
document.addEventListener("DOMContentLoaded", async () => {
  
  // Verifica que se haya pasado un user_id en la URL
  if (!profileUserId) {
    displayError("No se especificó ningún usuario.");
    return;
  }

  // Petición a la API para obtener los datos del usuario
  try {
    const res = await fetch(`${API_URL}/${profileUserId}`);
    if (!res.ok) throw new Error(`Usuario con ID ${profileUserId} no encontrado`);

    const user = await res.json();

    // Mostramos los datos del usuario
    renderUser(user);

    // Si es tu propio perfil se muestra el botón editar
    if (isOwnProfile(profileUserId)) {
      const editBtn = document.getElementById("editProfileBtn");
      editBtn.classList.remove("hidden");
      editBtn.addEventListener("click", () => {
        window.location.href = `/editUserProfile.html?user_id=${profileUserId}`;
      });
    }

  } catch (err) {
    console.error(err);
    displayError("Error cargando el usuario. Comprueba que el servidor está corriendo.");
  }
});

//Funcion para renderizar el perfil
function renderUser(user) {
  //Nombre del usuario
  document.getElementById("username").textContent = user.username || "Sin nombre";
  // Biografía
  document.getElementById("bio").textContent = user.bio || "Sin biografía";

  // Ubicación y fecha de nacimiento
  const locationEl = document.getElementById("location");
  const birthDateEl = document.getElementById("birth_date");

  // Mostrar ubicación si existe
  if (locationEl)
    locationEl.textContent = user.location ? `Ubicación: ${user.location}` : "";
 
  // Mostrar fecha de nacimiento si existe
  if (birthDateEl)
    birthDateEl.textContent = user.birth_date
      ? `Nacimiento: ${new Date(user.birth_date).toLocaleDateString("es-ES")}`
      : "";

   // Avatar del usuario, sino tiene se genera uno automático
  document.getElementById("avatar").src = user.avatar_url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username || "U")}&background=1db954&color=000&size=128`;
}

// Función pra mostrar errores en pantalla
function displayError(message) {
  const container = document.querySelector(".profile-container");
  container.innerHTML = `<p style="color:red;text-align:center;margin-top:50px;">${message}</p>`;
}