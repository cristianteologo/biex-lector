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
      // (BiEx, 21-nov-2026) en la app instalada, si se leía hace menos de 3 horas, se vuelve directo a la lectura
      var app = matchMedia("(display-mode: standalone)").matches || navigator.standalone === true, vu = JSON.parse(localStorage.getItem("biex:vista") || "null");
      if (app && vu && n - (+vu.t || 0) < 108e5) return;
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
    // (BiEx, 21-nov-2026, AF3) ninguna barra de desplazamiento mientras se prepara la presentación (asomaba medio segundo a la derecha)
    var sb = document.createElement("style"); sb.id = "biex-sin-barras";
    sb.textContent = "html,body{overflow:hidden!important;scrollbar-width:none!important}html::-webkit-scrollbar,body::-webkit-scrollbar{display:none!important;width:0!important;height:0!important}";
    document.documentElement.appendChild(sb);
    var quitar = function () { if (c.parentNode) { c.style.opacity = "0"; setTimeout(function () { c.remove(); if (!window.__biexIntro && sb.parentNode) sb.remove(); }, 550); } };
    setTimeout(function () { if (!window.__biexIntro) quitar(); }, 4500);
    setTimeout(quitar, 30000);
    setTimeout(function () { if (sb.parentNode) sb.remove(); }, 60000); // salvaguarda: la página nunca queda sin desplazamiento
    var s = document.createElement("script");
    s.src = "intro.js?v=0b4f8d3df5";
    s.async = true;
    s.setAttribute("data-modo", modo);
    s.onerror = quitar;
    document.head.appendChild(s);
  } catch (e) { /* sin almacenamiento o sin permiso: el lector sigue sin presentación */ }
})();
