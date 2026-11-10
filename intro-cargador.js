/* BiEx · Presentación de apertura en el lector propio (bibliaexacta.pages.dev y la app instalada), con la misma política que la
   inserción del sitio oficial (wix/intro.plantilla.html): al día, como máximo 2 completas (separadas por 8 horas o más) y
   2 breves; 5 minutos como mínimo entre una y otra; una por visita; la completa solo al entrar por el inicio. Nunca dentro de
   un marco (el sitio oficial ya muestra la suya), sin conexión, para buscadores ni para navegadores automatizados.
   Para verla a voluntad: ?intro (completa), ?intro=breve o ?intro=quieta. wix/sellar.py pone la huella de intro.js. */
(function () {
  try {
    if (window.__biexIntroDecidida) return; window.__biexIntroDecidida = true;
    if (window.top !== window.self) return;
    var m = /[?&#]intro(?:=(completa|breve|quieta))?(?:[&#]|$)/.exec(location.search + location.hash), modo = null, n = Date.now();
    if (m) modo = m[1] || "completa";
    else {
      if (navigator.onLine === false) return;
      if (navigator.webdriver || /bot|crawl|spider|slurp|lighthouse|headless|prerender|preview|facebookexternalhit|embedly|whatsapp|telegram/i.test(navigator.userAgent)) return;
      if (sessionStorage.getItem("biex:intro:visita")) return;
      sessionStorage.setItem("biex:intro:visita", "1");
      var r = JSON.parse(localStorage.getItem("biex:intro:registro") || "{}"), hoy = new Date().toDateString();
      if (r.d !== hoy) { r.d = hoy; r.c = 0; r.b = 0; }
      var inicio = /^\/(index\.html)?$/.test(location.pathname) && /^#?\/?$/.test(location.hash);
      if (n - (r.u || 0) < 3e5) return;
      if (inicio && (r.c || 0) < 2 && n - (r.tc || 0) >= 288e5) modo = "completa";
      else if ((r.b || 0) < 2) modo = "breve";
      if (!modo) return;
      sessionStorage.setItem("biex:intro:previo", JSON.stringify(r));
      if (modo === "completa") { r.c = (r.c || 0) + 1; r.tc = n; } else r.b = (r.b || 0) + 1;
      r.u = n;
      localStorage.setItem("biex:intro:registro", JSON.stringify(r));
    }
    var c = document.createElement("div");
    c.id = "biex-cortina";
    c.style.cssText = "position:fixed;inset:0;z-index:2147483600;background:#030308;box-shadow:0 0 0 100vmax #030308;transition:opacity .5s";
    document.documentElement.appendChild(c);
    var quitar = function () { if (c.parentNode) { c.style.opacity = "0"; setTimeout(function () { c.remove(); }, 550); } };
    setTimeout(function () { if (!window.__biexIntro) quitar(); }, 4500);
    setTimeout(quitar, 30000);
    var s = document.createElement("script");
    s.src = "intro.js?v=3665dd439d";
    s.async = true;
    s.setAttribute("data-modo", modo);
    s.onerror = quitar;
    document.head.appendChild(s);
  } catch (e) { /* sin almacenamiento o sin permiso: el lector sigue sin presentación */ }
})();
