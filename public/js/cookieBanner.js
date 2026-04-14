document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("cookiesAccepted")) return;

  const banner = document.createElement("div");
  banner.id = "cookie-banner";
  banner.className = "cookie-banner";
  banner.setAttribute("role", "dialog");
  banner.setAttribute("aria-modal", "false");
  banner.setAttribute("aria-label", "Aviso de cookies y privacidad");
  banner.innerHTML = `
    <div class="cookie-content">
      <p>
        Rasty usa almacenamiento local para guardar tu sesión y preferencias.
        Al usar la app aceptas nuestra
        <a href="/privacy.html">política de privacidad</a>.
      </p>
      <div class="cookie-actions">
        <button id="cookie-accept" class="cookie-btn-accept">Aceptar</button>
        <a href="/privacy.html" class="cookie-btn-info">Más info</a>
      </div>
    </div>
  `;

  document.body.appendChild(banner);

  document.getElementById("cookie-accept").addEventListener("click", () => {
    localStorage.setItem("cookiesAccepted", "true");
    banner.classList.add("cookie-banner-hide");
    setTimeout(() => banner.remove(), 400);
  });
});