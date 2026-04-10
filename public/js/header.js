document.addEventListener("DOMContentLoaded", async () => {

  const headerContainer = document.getElementById("header-container");

  try {
    const response = await fetch("/components/header.html");
    const headerHTML = await response.text();
    headerContainer.innerHTML = headerHTML;

    const navLinks = document.getElementById("navLinks");
    const loginModal = document.getElementById("loginModal");
    const loginForm = document.getElementById("loginForm");

    const renderHeaderLinks = async () => {
      const { userId } = getSession();

      let leftHTML = `<a href="/index.html" class="logo-text">Rasty</a>`;
      let centerHTML = '';

      if (isLoggedIn()) {
        centerHTML += `<a href="/userProfile.html?user_id=${userId}">Mi perfil</a>`;
        centerHTML += `<a href="/listensUser.html?user_id=${userId}">Mis escuchas</a>`;
      }

      centerHTML += `<a href="/searchAlbums.html">Albums</a>`;
      centerHTML += `<a href="/searchUsers.html">Usuarios</a>`;

      let rightHTML = '';
      if (isLoggedIn()) {
        try {
          const res = await fetch(`http://localhost:3000/users/${userId}`);
          const user = await res.json();

          const avatarSrc = user.avatar_url ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username || "U")}&background=1db954&color=000&size=32`;

          rightHTML += `
            <a href="/userProfile.html?user_id=${userId}" class="header-user">
              <img src="${avatarSrc}" alt="${user.username}" class="header-avatar">
              <span class="header-username">${user.username}</span>
            </a>
          `;
        } catch (_) {
          rightHTML += `<span>Mi perfil</span>`;
        }

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

    await renderHeaderLinks();

    // Helpers para el modal
    function setModalError(message, fieldId = null) {
      document.getElementById("loginError").textContent = message;
      if (fieldId) {
        document.getElementById(fieldId)?.classList.add("input-error");
        const fieldError = document.getElementById(`${fieldId}Error`);
        if (fieldError) fieldError.textContent = message;
      }
    }

    function clearModalErrors() {
      document.getElementById("loginError").textContent = "";
      document.querySelectorAll(".input-error").forEach(el => el.classList.remove("input-error"));
      document.querySelectorAll(".modal-field-error").forEach(el => el.textContent = "");
    }

    function setModalLoading(loading) {
      const btn = document.getElementById("loginSubmitBtn");
      if (!btn) return;
      btn.disabled = loading;
      btn.textContent = loading ? "Entrando..." : "Entrar";
    }

    // Delegación de eventos
    document.addEventListener("click", async (e) => {

      if (e.target.id === "loginBtn") {
        e.preventDefault();
        clearModalErrors();
        loginModal.style.display = "flex";
      }

      if (e.target.id === "closeModal") {
        loginModal.style.display = "none";
        clearModalErrors();
      }

      if (e.target === loginModal) {
        loginModal.style.display = "none";
        clearModalErrors();
      }

      if (e.target.id === "logoutBtn") {
        e.preventDefault();
        logout();
        window.location.reload();
      }
    });

    // Limpiar errores al escribir
    document.addEventListener("input", (e) => {
      if (e.target.id === "loginEmail" || e.target.id === "loginPassword") {
        clearModalErrors();
      }
    });

    // Submit login
    if (loginForm) {
      loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        clearModalErrors();

        const email = document.getElementById("loginEmail").value.trim();
        const password = document.getElementById("loginPassword").value;

        if (!email) {
          setModalError("El email es obligatorio", "loginEmail");
          return;
        }

        if (!password) {
          setModalError("La contraseña es obligatoria", "loginPassword");
          return;
        }

        setModalLoading(true);

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
            if (res.status === 401) {
              setModalError("Email o contraseña incorrectos");
            } else if (res.status === 404) {
              setModalError("No existe ninguna cuenta con ese email", "loginEmail");
            } else {
              setModalError(data.error || "Error al iniciar sesión");
            }
          }
        } catch (err) {
          setModalError("No se pudo conectar con el servidor");
          console.error(err);
        } finally {
          setModalLoading(false);
        }
      });
    }

  } catch (error) {
    console.error("Error cargando el header:", error);
  }
});