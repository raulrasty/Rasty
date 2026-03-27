//Devuelve los datos de sesión del localStorage
function getSession() {
  return {
    token:     localStorage.getItem("token"),
    userId:    localStorage.getItem("userId"),
    userEmail: localStorage.getItem("userEmail"),
  };
}
 

// Guarda los datos de sesión en localStorage.
function saveSession(data) {
  localStorage.setItem("token",     data.session.access_token);
  localStorage.setItem("userId",    data.user.id);
  localStorage.setItem("userEmail", data.user.email);
}


//Devuelve true si hay sesión activa

function isLoggedIn() {
  const { token, userId } = getSession();
  return !!(token && userId);
}
 
/*
 Redirige a login si no hay sesión.
Parapáginas que requieren estar logueado.
 Devuelve false si no hay sesión, true si sí hay.
 */
function requireLogin() {
  if (!isLoggedIn()) {
    alert("Debes iniciar sesión para acceder a esta página");
    window.location.href = "/login.html";
    return false;
  }
  return true;
}
 
//Devuelve true si el userId de sesión coincide con el profileUserId. Usar para mostrar funciones propias de tu perfil

function isOwnProfile(profileUserId) {
  const { userId } = getSession();
  return !!(userId && userId === profileUserId);
}
 
//Elimina la sesión del localStorage

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("userId");
  localStorage.removeItem("userEmail");
}