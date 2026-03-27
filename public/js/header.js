// Requiere: /js/auth.js cargado antes en el HTML
 
document.addEventListener("DOMContentLoaded", async () => {
 
  // Contenedor donde se cargará el header dinámico
  const headerContainer = document.getElementById("header-container");
 
  try {
    // Cargar header desde el archivo html
    const response = await fetch("/components/header.html");
    const headerHTML = await response.text();
    headerContainer.innerHTML = headerHTML;
 
    const navLinks = document.getElementById("navLinks");
    const loginModal = document.getElementById("loginModal");
    const loginForm = document.getElementById("loginForm");
 
    // Renderizar links según el login
    const renderHeaderLinks = () => {
      const { userId, userEmail } = getSession();
 
      // Izquierda: Nombre de la página
      let leftHTML = `<span class="logo-text">Rasty</span>`;
 
      // Centro: Links principales
      let centerHTML = '';
 
      // Enlaces que se muestran si estás logueado
      if (isLoggedIn()) {
        centerHTML += `<a href="/userProfile.html?user_id=${userId}">Mi perfil</a>`;
        centerHTML += `<a href="/listensUser.html?user_id=${userId}">Mis escuchas</a>`;
      }
 
      // Enlaces que se muestran siempre
      centerHTML += `<a href="/searchAlbums.html">Albums</a>`;
      centerHTML += `<a href="/searchUsers.html">Usuarios</a>`;
 
      // Derecha: Usuario y logout / Login y Registro
      let rightHTML = '';
      if (isLoggedIn()) {
        rightHTML += `<span>${userEmail}</span>`;
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
 
    // Delegación de eventos para clicks dinámicos
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
        e.preventDefault();
        logout(); // de auth.js
        window.location.reload(); 
      }
    });
 
    // Login
    if (loginForm) {
      loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
 
        // Obtener datos del formulario
        const email = document.getElementById("loginEmail").value;
        const password = document.getElementById("loginPassword").value;
        const errorText = document.getElementById("loginError");
 
        // Petición al backend
        try {
          const res = await fetch("http://localhost:3000/users/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
          });
 
          const data = await res.json();
 
          if (res.ok) {
            saveSession(data); 
            loginModal.style.display = "none";
            window.location.reload(); 
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