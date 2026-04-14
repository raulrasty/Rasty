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

      // ESCRITORIO
      let leftHTML = `<a href="/index.html" class="logo-text">Rasty</a>`;
      let centerHTML = '';
      let rightHTML = '';

      if (isLoggedIn()) {
        centerHTML += `<a href="/userProfile.html?user_id=${userId}">Mi perfil</a>`;
        centerHTML += `<a href="/listensUser.html?user_id=${userId}">Mis escuchas</a>`;
      }

      centerHTML += `<a href="/searchAlbums.html">Albums</a>`;
      centerHTML += `<a href="/searchUsers.html">Usuarios</a>`;

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

      // MÓVIL — links del hamburguesa izquierdo
      let mobileNavLinks = '';
      if (isLoggedIn()) {
        mobileNavLinks += `<a href="/userProfile.html?user_id=${userId}" class="mobile-nav-link">Mi perfil</a>`;
        mobileNavLinks += `<a href="/listensUser.html?user_id=${userId}" class="mobile-nav-link">Mis escuchas</a>`;
      }
      mobileNavLinks += `<a href="/searchAlbums.html" class="mobile-nav-link">Albums</a>`;
      mobileNavLinks += `<a href="/searchUsers.html" class="mobile-nav-link">Usuarios</a>`;

      // MÓVIL — links del desplegable derecho
      let mobileUserLinks = '';
      if (isLoggedIn()) {
        try {
          const res = await fetch(`http://localhost:3000/users/${userId}`);
          const user = await res.json();
          const avatarSrc = user.avatar_url ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username || "U")}&background=1db954&color=000&size=32`;
          mobileUserLinks += `
            <a href="/userProfile.html?user_id=${userId}" class="mobile-nav-link mobile-user-info">
              <img src="${avatarSrc}" alt="${user.username}" class="header-avatar">
              <span>${user.username}</span>
            </a>
          `;
        } catch (_) {}
        mobileUserLinks += `<a href="#" id="mobileLogoutBtn" class="mobile-nav-link mobile-logout">Cerrar sesión</a>`;
      } else {
        mobileUserLinks += `<a href="#" id="mobileLoginBtn" class="mobile-nav-link">Iniciar sesión</a>`;
        mobileUserLinks += `<a href="/register.html" class="mobile-nav-link">Crear cuenta</a>`;
      }

      // MÓVIL — botón derecho (avatar o icono persona)
      let mobileRightBtn = '';
      if (isLoggedIn()) {
        try {
          const res = await fetch(`http://localhost:3000/users/${userId}`);
          const user = await res.json();
          const avatarSrc = user.avatar_url ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username || "U")}&background=1db954&color=000&size=32`;
          mobileRightBtn = `<img src="${avatarSrc}" alt="${user.username}" class="header-avatar mobile-user-btn" id="mobileUserBtn">`;
        } catch (_) {
          mobileRightBtn = `<button class="mobile-icon-btn" id="mobileUserBtn" aria-label="Menú usuario">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
          </button>`;
        }
      } else {
        mobileRightBtn = `<button class="mobile-icon-btn" id="mobileUserBtn" aria-label="Iniciar sesión" aria-expanded="false">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
        </button>`;
      }

      navLinks.innerHTML = `
        <div class="header-left">${leftHTML}</div>
        <div class="header-center" id="headerCenter">${centerHTML}</div>
        <div class="header-right" id="headerRight">${rightHTML}</div>

        <div class="mobile-header">
          <button class="mobile-hamburger" id="mobileHamburger" aria-label="Abrir menú" aria-expanded="false">
            <span></span><span></span><span></span>
          </button>
          <a href="/index.html" class="logo-text mobile-logo">Rasty</a>
          <div class="mobile-right-btn" id="mobileRightBtnWrap">${mobileRightBtn}</div>
        </div>

        <div class="mobile-nav-dropdown" id="mobileNavDropdown">
          ${mobileNavLinks}
        </div>

        <div class="mobile-user-dropdown" id="mobileUserDropdown">
          ${mobileUserLinks}
        </div>
      `;
    };

    await renderHeaderLinks();

    // Hamburguesa izquierda
    const mobileHamburger = document.getElementById("mobileHamburger");
    const mobileNavDropdown = document.getElementById("mobileNavDropdown");
    const mobileUserDropdown = document.getElementById("mobileUserDropdown");
    const mobileUserBtn = document.getElementById("mobileUserBtn");

    if (mobileHamburger) {
      mobileHamburger.addEventListener("click", () => {
        const isOpen = mobileHamburger.getAttribute("aria-expanded") === "true";
        mobileHamburger.setAttribute("aria-expanded", (!isOpen).toString());
        mobileNavDropdown?.classList.toggle("open", !isOpen);
        // Cerrar el otro si está abierto
        mobileUserDropdown?.classList.remove("open");
        mobileUserBtn?.setAttribute("aria-expanded", "false");
      });
    }

    // Botón derecho usuario
    if (mobileUserBtn) {
      mobileUserBtn.addEventListener("click", () => {
        const isOpen = mobileUserDropdown?.classList.contains("open");
        mobileUserDropdown?.classList.toggle("open", !isOpen);
        mobileUserBtn.setAttribute("aria-expanded", (!isOpen).toString());
        // Cerrar el otro si está abierto
        mobileNavDropdown?.classList.remove("open");
        mobileHamburger?.setAttribute("aria-expanded", "false");
      });
    }

    // Cerrar al hacer click fuera
    document.addEventListener("click", (e) => {
      if (!e.target.closest("#mobileHamburger") && !e.target.closest("#mobileNavDropdown")) {
        mobileNavDropdown?.classList.remove("open");
        mobileHamburger?.setAttribute("aria-expanded", "false");
      }
      if (!e.target.closest("#mobileUserBtn") && !e.target.closest("#mobileRightBtnWrap") && !e.target.closest("#mobileUserDropdown")) {
        mobileUserDropdown?.classList.remove("open");
      }
    });

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

      if (e.target.id === "loginBtn" || e.target.id === "mobileLoginBtn") {
        e.preventDefault();
        clearModalErrors();
        mobileUserDropdown?.classList.remove("open");
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

      if (e.target.id === "logoutBtn" || e.target.id === "mobileLogoutBtn") {
        e.preventDefault();
        logout();
        window.location.reload();
      }
    });

    document.addEventListener("input", (e) => {
      if (e.target.id === "loginEmail" || e.target.id === "loginPassword") {
        clearModalErrors();
      }
    });

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