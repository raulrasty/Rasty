// Devuelve los datos de sesión del localStorage
function getSession() {
  return {
    token:     localStorage.getItem("token"),
    userId:    localStorage.getItem("userId"),
    userEmail: localStorage.getItem("userEmail"),
  };
}

// Guarda los datos de sesión en localStorage
function saveSession(data) {
  localStorage.setItem("token",     data.session.access_token);
  localStorage.setItem("userId",    data.user.id);
  localStorage.setItem("userEmail", data.user.email);
  localStorage.setItem("loginTime", Date.now());
}

// Comprueba si la sesión ha caducado
function isSessionExpired() {
  const loginTime = localStorage.getItem("loginTime");
  if (!loginTime) return true;
  const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 días
  return Date.now() - parseInt(loginTime) > SESSION_DURATION;
}

// Devuelve true si hay sesión activa y no ha caducado
function isLoggedIn() {
  const { token, userId } = getSession();
  if (!token || !userId) return false;
  if (isSessionExpired()) {
    logout();
    return false;
  }
  return true;
}

// Redirige a login si no hay sesión
function requireLogin() {
  if (!isLoggedIn()) {
    alert("Debes iniciar sesión para acceder a esta página");
    window.location.href = "/login.html";
    return false;
  }
  return true;
}

// Devuelve true si el userId de sesión coincide con el profileUserId
function isOwnProfile(profileUserId) {
  const { userId } = getSession();
  return !!(userId && userId === profileUserId);
}

// Elimina la sesión del localStorage
function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("userId");
  localStorage.removeItem("userEmail");
  localStorage.removeItem("loginTime");
}

// Petición autenticada que detecta token caducado
async function authFetch(url, options = {}) {
  const { token } = getSession();

  const res = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`
    }
  });

  if (res.status === 401) {
    logout();
    window.location.href = "/";
    return;
  }

  return res;
}