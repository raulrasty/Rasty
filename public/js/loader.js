// GESTIÓN DEL CARGADOR DE PÁGINA
document.addEventListener("DOMContentLoaded", () => {
  const loader = document.getElementById("page-loader");
  // Verificación de existencia del elemento
  if (!loader) return;
  // LÓGICA DE OCULTACIÓN TRAS CARGA COMPLETA
  window.addEventListener("load", () => {
    setTimeout(() => {
      loader.classList.add("hidden");
    }, 900);
  });
});