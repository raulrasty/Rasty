// GESTIÓN GLOBAL DE VISIBILIDAD DE CONTRASEÑAS
document.addEventListener("click", (e) => {
  // Verificación de clic en el botón con clase "toggle-password"
  if (e.target.classList.contains("toggle-password")) {
    const targetId = e.target.dataset.target;
    const input = document.getElementById(targetId);
    // Validación de existencia del campo de entrada
    if (!input) return;

    //LÓGICA DE CONMUTACIÓN (TOGGLE)
    if (input.type === "password") {
      input.type = "text";
      e.target.textContent = "👁";
      e.target.setAttribute("aria-label", "Ocultar contraseña");
    } else {
      // Volver a tipo password para ocultar los caracteres
      input.type = "password";
      e.target.textContent = "👁";
      e.target.setAttribute("aria-label", "Mostrar contraseña");
    }
  }
});