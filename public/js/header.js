// main.js
document.addEventListener("DOMContentLoaded", async () => {
  const headerContainer = document.getElementById("header-container");

  try {
    // Cargar header
    const response = await fetch("/components/header.html");
    const headerHTML = await response.text();
    headerContainer.innerHTML = headerHTML;

    const navLinks = document.getElementById("navLinks");
    const loginModal = document.getElementById("loginModal");
    const loginForm = document.getElementById("loginForm");

    // Función para actualizar links según login/logout
   const renderHeaderLinks = () => {
  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");
  const userEmail = localStorage.getItem("userEmail");

  // Logo siempre a la izquierda
  let leftHTML = `<span class="logo-text">Rasty</span>`;

  // Centro: Mis escuchas solo si logueado + Buscar siempre
  let centerHTML = '';
  if (userId && token) {
    centerHTML += `<a href="/listensUser.html?user_id=${userId}" id="myListensBtn">Mis escuchas</a>`;
  }
  centerHTML += `<a href="/searchAlbums.html" id="searchBtn">Buscar</a>`;

  // Derecha: Usuario y logout solo si logueado
  let rightHTML = '';
  if (userId && token) {
    rightHTML += `<span>Hola, ${userEmail}</span>`;
    rightHTML += `<a href="#" id="logoutBtn" class="logout-link">Cerrar sesión</a>`;
  } else {
    rightHTML += `<a href="#" id="loginBtn">Iniciar sesión</a>`;
    rightHTML += `<a href="/register.html">Crear cuenta</a>`;
  }

  navLinks.innerHTML = `
    <div class="header-left">${leftHTML}</div>
    <div class="header-center">${centerHTML}</div>
    <div class="header-right">${rightHTML}</div>
  `;
};

    renderHeaderLinks();

    // =================================================
    // 🔥 Delegación de eventos para clicks dinámicos
    document.addEventListener("click", async (e) => {
      // Abrir modal login
      if (e.target.id === "loginBtn") {
        e.preventDefault();
        loginModal.style.display = "flex";
      }

      // Cerrar modal login
      if (e.target.id === "closeModal") {
        loginModal.style.display = "none";
      }

      // Logout
      if (e.target.id === "logoutBtn") {
        localStorage.removeItem("userId");
        localStorage.removeItem("token");
        localStorage.removeItem("userEmail");

        renderHeaderLinks();

        // Limpiar lista de escuchas si existe
        const listensList = document.getElementById("listens-list");
        if (listensList) listensList.innerHTML = "";
      }
    });

    // =================================================
    // 🔑 Login
    if (loginForm) {
      loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = document.getElementById("loginEmail").value;
        const password = document.getElementById("loginPassword").value;
        const errorText = document.getElementById("loginError");

        try {
          const res = await fetch("http://localhost:3000/users/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
          });

          const data = await res.json();

          if (res.ok) {
            // Guardar en localStorage
            localStorage.setItem("token", data.token);
            localStorage.setItem("userId", data.user.id);
            localStorage.setItem("userEmail", data.user.email);

            loginModal.style.display = "none";

            renderHeaderLinks(); // Actualiza header dinámicamente

            if (typeof fetchUserListens === "function") {
              fetchUserListens(); // Actualiza escuchas sin recargar
            }
          } else {
            errorText.textContent = data.error || "Error al iniciar sesión";
          }
        } catch (err) {
          errorText.textContent = "Error al conectar con el servidor";
          console.error(err);
        }
      });
    }

  } catch (error) {
    console.error("Error cargando el header:", error);
  }
});