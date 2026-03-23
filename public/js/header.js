// main.js (o tu script global)
document.addEventListener("DOMContentLoaded", async () => {
  const headerContainer = document.getElementById("header-container");

  try {
    // Cargar header
    const response = await fetch("/components/header.html");
    const headerHTML = await response.text();
    headerContainer.innerHTML = headerHTML;

    // 🔑 Usuario y token desde localStorage
    let user = JSON.parse(localStorage.getItem("user"));
    let token = localStorage.getItem("token");

    const navLinks = document.getElementById("navLinks");
    const loginModal = document.getElementById("loginModal");
    const loginForm = document.getElementById("loginForm");

    // Función para actualizar links según login/logout
    const renderHeaderLinks = () => {
      if (user && token) {
        navLinks.innerHTML = `
          <span style="color:white;">Hola, ${user.email}</span>
          <a href="#" id="logoutBtn">Cerrar sesión</a>
        `;
      } else {
        navLinks.innerHTML = `
          <a href="#" id="loginBtn">Iniciar sesión</a>
          <a href="/register.html">Crear cuenta</a>
        `;
      }
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
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        user = null;
        token = null;
        renderHeaderLinks();
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
            token = data.token;
            user = data.user;

            localStorage.setItem("token", token);
            localStorage.setItem("user", JSON.stringify(user));

            loginModal.style.display = "none";
            renderHeaderLinks();      // Actualizamos header dinámicamente
            if (typeof fetchUserListens === "function") {
              fetchUserListens();      // Actualizamos escuchas sin recargar
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