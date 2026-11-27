/* BiEx · Lector y Analizador de la Nueva Voluntad. Sin dependencias. */
(function () {
  "use strict";
  // hojas de estilo que cargan sin bloquear el dibujo (la página no admite manejadores en línea por su política de seguridad)
  for (const l of document.querySelectorAll("link[data-asinc]")) { const usar = () => { l.media = "all"; }; if (l.sheet) usar(); else l.addEventListener("load", usar); }
  const BASE = window.BIEX_BASE || "";
  // Fuentes de los datos en orden de preferencia (si la primera falla se usa la siguiente)
  const BASES = Array.isArray(window.BIEX_BASES) && window.BIEX_BASES.length ? window.BIEX_BASES : [BASE];
  // Dentro del sitio oficial: el lector se abre en un marco a pantalla completa (srcdoc o ?incrustado=1)
  const POR_URL = /[?&]incrustado=1/.test(location.search);
  const EMBED = !!window.BIEX_EMBED || POR_URL;
  const alPadre = (msg) => { if (!EMBED) return; try { window.parent.postMessage(msg, "*"); } catch (e) { /* ignorar */ } };
  if (EMBED) {
    window.addEventListener("error", (e) => alPadre({ biex: "error", m: String(e.message || "error") + " " + (e.filename || "") + ":" + (e.lineno || "") }));
    window.addEventListener("message", (e) => { if (e.source === window.parent && e.data && e.data.biex === "ir" && typeof e.data.hash === "string" && /^#\/[\w\/.:?=%+\-]{0,160}$/.test(e.data.hash)) location.hash = e.data.hash; });
  }
  // Regla de BiEx: un dato vacío nunca se imprime como «null» ni «undefined». append, replaceChildren, before y after
  // convierten null en el texto «null»; aquí se omiten (10-nov-2026: aparecía «null» en la ficha del Árbol).
  for (const P of [Element.prototype, DocumentFragment.prototype]) for (const m of ["append", "prepend", "replaceChildren", "before", "after"]) {
    const o = P[m]; if (typeof o !== "function" || o.__biex) continue;
    const f = function (...k) { return o.apply(this, k.filter((x) => x != null && x !== false)); }; f.__biex = 1; P[m] = f;
  }
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  // Las transliteraciones (ā, ḥ, ʿ, letras griegas mezcladas…) no deben pasar a mayúsculas en los rótulos: se envuelven en .np
  const RE_NP = /[\u0100-\u024f\u02b0-\u02ff\u0300-\u036f\u1e00-\u1eff]|[A-Za-z][\u0370-\u03ff\u1f00-\u1fff]|[\u0370-\u03ff\u1f00-\u1fff][A-Za-z]/;
  const SIN_NP = /^(option|title|textarea|script|style|select|input)$/i;
  const textoNp = (t) => String(t).split(/(\S*(?:[\u0100-\u024f\u02b0-\u02ff\u0300-\u036f\u1e00-\u1eff]|[A-Za-z][\u0370-\u03ff\u1f00-\u1fff]|[\u0370-\u03ff\u1f00-\u1fff][A-Za-z])\S*)/).filter(Boolean)
    // «cm» (10-nov-2026): las palabras con signos combinados (YēshŪ́aʿ, Hiṯgallū́ṯ) van con la letra del texto, la única que
    // apila bien los signos (la de la interfaz no los posiciona y se veían corridos)
    .map((x) => { if (!RE_NP.test(x)) return document.createTextNode(x); const sp = document.createElement("span"); sp.className = /[\u0300-\u036f]/.test(x) ? "np cm" : "np"; sp.textContent = x; return sp; });
  const h = (tag, attrs, ...kids) => {
    const el = document.createElement(tag);
    const np = !SIN_NP.test(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k === "class") el.className = v;
      else if (k === "text") { if (np && RE_NP.test(v)) el.append(...textoNp(v)); else el.textContent = v; }
      else if (k === "style") el.setAttribute("style", v);
      else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? "" : v);
    }
    for (const x of kids.flat(Infinity)) if (x != null && x !== false) { if (x.nodeType) el.append(x); else if (np && RE_NP.test(x)) el.append(...textoNp(x)); else el.append(document.createTextNode(String(x))); }
    return el;
  };
  const svg = (inner, vb) => { const s = document.createElementNS("http://www.w3.org/2000/svg", "svg"); s.setAttribute("viewBox", vb || "0 0 24 24"); s.setAttribute("aria-hidden", "true"); s.innerHTML = inner; return s; };
  const L1 = 'fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"';
  const ICO = {
    info: '<circle cx="12" cy="12" r="8.6" ' + L1 + '/><path d="M12 11v5.2" ' + L1 + '/><circle cx="12" cy="7.9" r="1.05" fill="currentColor"/>',
    // AL11 (BiEx, 22-nov-2026, 18:53): un rollo con su texto, propio de la perícopa en Jünemann (la «i» ya es de la información)
    rollo: '<path d="M7 5.2c0-.9.7-1.6 1.6-1.6h9.2c.9 0 1.6.7 1.6 1.6s-.7 1.6-1.6 1.6H8.6" ' + L1 + '/><path d="M8.6 6.8v10.4M17.8 6.8V17" ' + L1 + '/><path d="M5.4 17.2c0-.9.7-1.6 1.6-1.6h9.2c.9 0 1.6.7 1.6 1.6s-.7 1.6-1.6 1.6H7c-.9 0-1.6-.7-1.6-1.6z" ' + L1 + '/><path d="M11 9.6h4.4M11 12.4h3" ' + L1 + '/>',
    video: '<rect x="3" y="4.5" width="18" height="12" rx="2.2" ' + L1 + '/><path d="M9 20h6M12 16.5V20" ' + L1 + '/><path d="M10.4 8.2v4.6l4-2.3z" fill="currentColor"/>',
    comunidad: '<circle cx="9" cy="8.4" r="3" ' + L1 + '/><path d="M3.6 19c.6-3.3 2.8-5.1 5.4-5.1s4.8 1.8 5.4 5.1" ' + L1 + '/><circle cx="16.8" cy="9.3" r="2.4" ' + L1 + '/><path d="M15.6 14.1c2.4-.3 4.4 1.3 5 4.4" ' + L1 + '/>',
    externo: '<path d="M13.5 4.5H19.5V10.5" ' + L1 + '/><path d="M19.5 4.5L11 13" ' + L1 + '/><path d="M18 14.2v4a1.8 1.8 0 0 1-1.8 1.8H5.8A1.8 1.8 0 0 1 4 18.2V7.8A1.8 1.8 0 0 1 5.8 6h4" ' + L1 + '/>',
    buscar: '<circle cx="11" cy="11" r="6.5" ' + L1 + '/><path d="M20 20l-4.2-4.2" ' + L1 + '/>',
    refs: '<circle cx="6" cy="6.5" r="2.5" ' + L1 + '/><circle cx="18" cy="17.5" r="2.5" ' + L1 + '/><path d="M8.4 7.4c6 1.3 1.9 8.6 7.3 9.2" ' + L1 + '/>',
    tema: '<circle cx="12" cy="12" r="8.2" ' + L1 + '/><path d="M12 3.8a8.2 8.2 0 0 1 0 16.4z" fill="currentColor"/>',
    izq: '<path d="M14.5 5.5L8 12l6.5 6.5" ' + L1 + '/>',
    der: '<path d="M9.5 5.5L16 12l-6.5 6.5" ' + L1 + '/>',
    abajo: '<path d="M6.5 9.5L12 15l5.5-5.5" ' + L1 + '/>',
    // gema tallada con su destello (BiEx, 10-nov-2026: nada de estrellas ni formas de cruz)
    chispa: '<path d="M12 3.5l6.5 8.5-6.5 8.5-6.5-8.5z" ' + L1 + '/><path d="M12 7.6l3.3 4.4-3.3 4.4-3.3-4.4z" ' + L1 + '/><path d="M18.4 3.6l1.1 1.4-1.1 1.4-1.1-1.4z" fill="currentColor"/>',
    repaso: '<path d="M3.5 12.6l3.6 3.6 7.4-7.6" ' + L1 + '/><path d="M9.6 15.4l1 1 7.6-7.8" ' + L1 + '/>',
    podio: '<path d="M3.5 20.5h17" ' + L1 + '/><path d="M9 20.5V9.2h6v11.3M3.8 20.5v-6.6H9M15 20.5v-8.6h5.2v8.6" ' + L1 + '/><path d="M12 3.4l1.7 2.1-1.7 2.1-1.7-2.1z" fill="currentColor"/>',
    balanza: '<path d="M12 10.4L9.6 19.6h4.8z" ' + L1 + '/><path d="M8 20.4h8" ' + L1 + '/><path d="M4.4 9.4L19.6 6.6" ' + L1 + '/><circle cx="12" cy="8" r="1.15" fill="currentColor"/><path d="M4.4 9.4l-2.2 4.6a2.4 2.4 0 0 0 4.4 0zM19.6 6.6l-2.2 4.6a2.4 2.4 0 0 0 4.4 0z" ' + L1 + '/>',
    marca: '<path d="M5.5 12.5l4.2 4.2L18.5 7.8" ' + L1 + '/>',
    cerrar: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11" ' + L1 + '/>',
    atras: '<path d="M10 6l-6 6 6 6M4.5 12H20" ' + L1 + '/>',
    adelante: '<path d="M14 6l6 6-6 6M19.5 12H4" ' + L1 + '/>',
    historial: '<path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3M4.2 4.5v3.4h3.4" ' + L1 + '/><path d="M12 8.2V12l2.6 1.7" ' + L1 + '/>',
    actualizar: '<path d="M19.5 11a7.5 7.5 0 0 0-13.6-4.2M4.5 4.5v3.6h3.6M4.5 13a7.5 7.5 0 0 0 13.6 4.2M19.5 19.5v-3.6h-3.6" ' + L1 + '/>',
    leido: '<path d="M6 12.5l4 4 8-9" ' + L1 + '/>',
    externo: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" ' + L1 + '/>',
    rejilla: '<rect x="4" y="4" width="6.5" height="6.5" rx="1.2" ' + L1 + '/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.2" ' + L1 + '/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.2" ' + L1 + '/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.2" ' + L1 + '/>',
    libro: '<path d="M4 5.5C6.5 4.2 9.5 4.2 12 6c2.5-1.8 5.5-1.8 8-.5V19c-2.5-1.3-5.5-1.3-8 .5-2.5-1.8-5.5-1.8-8-.5z M12 6v13.5" ' + L1 + '/>',
    lupa: '<circle cx="10" cy="10" r="5.5" ' + L1 + '/><path d="M14 14l5.5 5.5" ' + L1 + '/><path d="M7.3 9.3a3 3 0 0 1 2.2-2.1" ' + L1 + '/>',
    raiz: '<path d="M12 3.2v9.3" ' + L1 + '/><path d="M12 8.6c-1.7-1.9-3.9-2.4-5.6-1.9M12 6.8c1.5-1.7 3.4-2.2 5-1.8" ' + L1 + '/><path d="M12 12.5c-.5 2.6-2.4 4.5-5.4 5.4M12 12.5c.5 2.6 2.4 4.5 5.4 5.4M12 12.5v7.6M8.9 15.9c-1.6.6-2.6 1.9-3 3.6M15.1 15.9c1.6.6 2.6 1.9 3 3.6" ' + L1 + '/>',
    texto: '<path d="M5 5.5h14M5 9.5h14M5 13.5h7" ' + L1 + '/><circle cx="16.4" cy="16.4" r="3.1" ' + L1 + '/><path d="M18.7 18.7l2.3 2.3" ' + L1 + '/>',
    literal: '<path d="M3 7.5h4M9.5 7.5h3.5M15.5 7.5h5.5M3 12.5h6M11.5 12.5h3.5M17.5 12.5h3.5" ' + L1 + '/><path d="M3 17.5h18" ' + L1 + ' opacity=".5"/>',
    lista: '<path d="M8 6.5h12M8 12h12M8 17.5h12" ' + L1 + '/><circle cx="4.5" cy="6.5" r="1" fill="currentColor"/><circle cx="4.5" cy="12" r="1" fill="currentColor"/><circle cx="4.5" cy="17.5" r="1" fill="currentColor"/>',
    filtros: '<path d="M4 7h9M17 7h3M4 17h3M11 17h9" ' + L1 + '/><circle cx="15" cy="7" r="2" ' + L1 + '/><circle cx="9" cy="17" r="2" ' + L1 + '/>',
    parrafo: '<path d="M4 6h16M4 10.5h16M4 15h16M4 19.5h10" ' + L1 + '/>',
    sinopsis: '<rect x="3.5" y="4.5" width="7" height="15" rx="1.2" ' + L1 + '/><rect x="13.5" y="4.5" width="7" height="15" rx="1.2" ' + L1 + '/><path d="M5.5 8.5h3M5.5 12h3M15.5 8.5h3M15.5 12h3M10.5 8.5h3" ' + L1 + '/>',
    compartir: '<circle cx="17.5" cy="5.5" r="2.5" ' + L1 + '/><circle cx="6.5" cy="12" r="2.5" ' + L1 + '/><circle cx="17.5" cy="18.5" r="2.5" ' + L1 + '/><path d="M8.7 10.7l6.6-3.9M8.7 13.3l6.6 3.9" ' + L1 + '/>',
    seguir: '<path d="M5 12h13M13 6.5l5.5 5.5-5.5 5.5" ' + L1 + '/>',
    opciones: '<path d="M4 7h4M12 7h8M4 17h10M18 17h2" ' + L1 + '/><circle cx="10" cy="7" r="2" ' + L1 + '/><circle cx="16" cy="17" r="2" ' + L1 + '/><path d="M4 12h2M10 12h10" ' + L1 + '/><circle cx="8" cy="12" r="2" ' + L1 + '/>',
    guia: '<circle cx="12" cy="12" r="8.5" ' + L1 + '/><path d="M9.6 9.4a2.5 2.5 0 1 1 3.4 2.3c-.7.3-1 .8-1 1.5v.6" ' + L1 + '/><circle cx="12" cy="16.6" r=".9" fill="currentColor"/>',
    manuscrito: '<path d="M6 3.5h9l3 3V20a.5.5 0 0 1-.5.5h-11A.5.5 0 0 1 6 20z M15 3.5V7h3" ' + L1 + '/><path d="M8.5 10h7M8.5 13h7M8.5 16h4.5" ' + L1 + '/>',
    tiempo: '<path d="M4 12h16" ' + L1 + '/><circle cx="7" cy="12" r="1.6" fill="currentColor"/><circle cx="12.5" cy="12" r="1.6" fill="currentColor"/><circle cx="18" cy="12" r="2.4" ' + L1 + '/><path d="M7 8.5V6M12.5 15.5V18M18 8V5.5" ' + L1 + '/>',
    filtro: '<path d="M4.5 5.5h15l-5.8 7v5.3l-3.4 1.7v-7z" ' + L1 + '/>',
    voz: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" ' + L1 + '/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" ' + L1 + '/>',
    contemplar: '<path d="M2.6 12s3.6-6 9.4-6 9.4 6 9.4 6-3.6 6-9.4 6-9.4-6-9.4-6z" ' + L1 + '/><circle cx="12" cy="12" r="2.7" ' + L1 + '/>',
    constelacion: '<circle cx="12" cy="11.5" r="2.3" fill="currentColor"/><circle cx="5.2" cy="6.8" r="1.7" ' + L1 + '/><circle cx="19" cy="6.2" r="1.7" ' + L1 + '/><circle cx="6.2" cy="18" r="1.7" ' + L1 + '/><circle cx="18.2" cy="17.5" r="1.7" ' + L1 + '/><path d="M6.8 7.8l3.3 2.3M17.4 7.2l-3.6 2.9M7.6 16.8l3-3.6M16.7 16.3l-3.1-3.2M6.9 6.6l10.4-.4" ' + L1 + ' opacity=".82"/>',
    tarjeta: '<rect x="4" y="3.5" width="16" height="17" rx="2.4" ' + L1 + '/><path d="M7.5 8.5h9M7.5 12h9M7.5 15.5h5.2" ' + L1 + '/><circle cx="16.2" cy="15.5" r="1.15" fill="currentColor"/>',
    pausa: '<path d="M9 6v12M15 6v12" ' + L1 + '/>',
    play: '<path d="M8 5.5l11 6.5-11 6.5z" ' + L1 + '/>',
    marcador: '<path d="M7 4h10a.5.5 0 0 1 .5.5V20l-5.5-4-5.5 4V4.5A.5.5 0 0 1 7 4z" ' + L1 + '/>',
    campana: '<path d="M18 15.5V10a6 6 0 1 0-12 0v5.5L4.5 17.5h15z" ' + L1 + '/><path d="M10 19.5a2.2 2.2 0 0 0 4 0" ' + L1 + '/>',
    nota: '<path d="M5 4.5h14v10.5l-4.5 4.5H5z M14.5 19.5V15H19" ' + L1 + '/><path d="M8 8.5h8M8 11.5h5" ' + L1 + '/>',
    subir: '<path d="M6 5h12M7 13.5l5-5 5 5M12 8.5V20" ' + L1 + '/>',
    bajar: '<path d="M6 19h12M7 10.5l5 5 5-5M12 15.5V4" ' + L1 + '/>',
    centro: '<path d="M5 12h3M16 12h3M8.5 6.5l3.5 3.5 3.5-3.5M8.5 17.5l3.5-3.5 3.5 3.5" ' + L1 + '/>',
    descargar: '<path d="M12 4v11M7.5 11l4.5 4.5 4.5-4.5M5 19.5h14" ' + L1 + '/>',
    importar: '<path d="M12 15.5V4.5M7.5 9l4.5-4.5L16.5 9M5 19.5h14" ' + L1 + '/>',
    nube: '<path d="M7.5 18.5h9.5a4 4 0 0 0 .6-7.95A5.5 5.5 0 0 0 6.9 9.6 4.5 4.5 0 0 0 7.5 18.5z" ' + L1 + '/><path d="M12 10.5v5.5M9.8 13.8l2.2 2.2 2.2-2.2" ' + L1 + '/>',
    papelera: '<path d="M5 7h14M10 4.5h4M7 7l.8 12a1 1 0 0 0 1 .9h6.4a1 1 0 0 0 1-.9L17 7M10.5 10.5v6M13.5 10.5v6" ' + L1 + '/>',
    copiar: '<rect x="8.5" y="8.5" width="11" height="11" rx="1.5" ' + L1 + '/><path d="M15.5 5.5v-.5A1.5 1.5 0 0 0 14 3.5H5A1.5 1.5 0 0 0 3.5 5v9A1.5 1.5 0 0 0 5 15.5h.5" ' + L1 + '/>',
    orden: '<path d="M4 7.5h11M4 12h8M4 16.5h13" ' + L1 + '/><path d="M17.5 4.5l3 3-3 3" ' + L1 + '/>',
    libros: '<path d="M4.6 4.6h3.3v14.8H4.6zM9.4 4.6h3.3v14.8H9.4z" ' + L1 + '/><path d="M14.3 5.9l3.1-.8 3.4 14.1-3.1.8z" ' + L1 + '/><path d="M3 19.4h18M6.25 8v2.4M11.05 8v2.4" ' + L1 + '/>',
    juego: '<path d="M7 4.5h10l3.5 4.6L12 19.5 3.5 9.1z" ' + L1 + '/><path d="M3.5 9.1h17M9.6 4.5L8.2 9.1 12 19.5l3.8-10.4-1.4-4.6" ' + L1 + '/>',
    mapa: '<path d="M3.5 6.5l5.5-2 6 2.2 5.5-2v12.8l-5.5 2-6-2.2-5.5 2z" ' + L1 + '/><path d="M9 4.5v12.8M15 6.7v12.8" ' + L1 + '/>',
    tarjetas: '<rect x="5.5" y="6.5" width="14.5" height="12.5" rx="2" ' + L1 + '/><path d="M3.5 14.5V6a2 2 0 0 1 2-2h10.5" ' + L1 + '/><path d="M9 11h7.5M9 14.5h5" ' + L1 + '/>',
  };
  const fmt = (n) => Number(n).toLocaleString("es");
  const pct = (x) => (x >= 10 ? x.toFixed(1) : x.toFixed(2)).replace(".", ",") + " %";
  const store = {
    get(k, d) { try { const v = localStorage.getItem("biex:" + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem("biex:" + k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento */ } if (k === "jg:t" && COPIA) COPIA.enviar(v); },
  };
  // (15-nov-2026, AC16) Copia de la sesión de Escudriña en el sitio oficial. En iPhone (WebKit) y en Brave, lo que guarda un marco
  // de otro dominio se borra al cerrar el navegador: la página que aloja (primer nivel) conserva una copia del token y la devuelve
  // al arrancar si aquí falta. Solo se habla con los anfitriones de la lista, con el origen verificado en los dos sentidos (wix/acceso.js).
  const ANFITRIONES = ["https://bibliaexacta.wixsite.com"].concat(/^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? ["http://localhost:8768", "http://127.0.0.1:8768"] : []);
  const COPIA = EMBED && window.parent !== window ? {
    enviar(t) { for (const o of ANFITRIONES) try { window.parent.postMessage({ biex: "sesion", t: typeof t === "string" ? t : null }, o); } catch (e) { /* ignorar */ } },
    pedir: () => new Promise((ok) => {
      let fin = false;
      const listo = (t) => { if (fin) return; fin = true; window.removeEventListener("message", al); ok(t); };
      const al = (e) => { if (e.source === window.parent && ANFITRIONES.includes(e.origin) && e.data && e.data.biex === "sesion") listo(typeof e.data.t === "string" && e.data.t.length > 8 && e.data.t.length < 2000 ? e.data.t : null); };
      window.addEventListener("message", al);
      for (const o of ANFITRIONES) try { window.parent.postMessage({ biex: "sesion?" }, o); } catch (e) { /* ignorar */ }
      setTimeout(() => listo(null), 1500);
    }),
  } : null;
  let sesionRecuperada = null;
  if (COPIA) {
    const t0 = store.get("jg:t", null);
    if (t0) COPIA.enviar(t0);
    else sesionRecuperada = COPIA.pedir().then((t) => {
      if (!t || store.get("jg:t", null)) return false;
      store.set("jg:t", t);
      try { if (window.BiExJuego && BiExJuego.retomarSesion) BiExJuego.retomarSesion(); } catch (e) { /* ignorar */ }
      return true;
    });
  }
  if (navigator.webdriver) window.__biexSes = { set: (t) => store.set("jg:t", t), get: () => store.get("jg:t", null) };
  // (15-nov-2026, fluidez y calor) Mientras se desplaza la página (o una ventana), html.desplazando pone en pausa lo que se mueve
  // solo de fondo (motas, brillos, respiraciones, luces del Árbol); vuelve 180 ms después del último movimiento. Las reglas ya
  // existían en el CSS, pero nada ponía la clase (se había perdido: APRENDIZAJES). Avisa con el evento «biex:desplaza».
  { let tD = 0; const raiz = document.documentElement;
    const fin = () => { tD = 0; raiz.classList.remove("desplazando"); document.dispatchEvent(new CustomEvent("biex:desplaza", { detail: false })); };
    window.addEventListener("scroll", () => {
      if (!tD) { raiz.classList.add("desplazando"); document.dispatchEvent(new CustomEvent("biex:desplaza", { detail: true })); } else clearTimeout(tD);
      tD = setTimeout(fin, 180);
    }, { passive: true, capture: true });
    // PR #20 · Rescate de toque inmediato durante inercia de desplazamiento: en Android/iOS el primer toque sobre un botón o
    // pestaña fija mientras dura la inercia suele detener el scroll y tragarse el click; si fue un toque limpio (<10 px, <340 ms)
    // y no llega click nativo en 45 ms, lo disparamos sin esperar a que el desplazamiento se detenga (sin duplicar jamás).
    const SEL_TAP = ".jg-muelle a, header.barra a, header.barra button, .barra-hoja button, .faro-btn, .jg-med, .jg-pres-pill, .btn, .jg-fila, .libs-acc-btn, .ap-gr-b";
    let tap = null, ultClickT = 0, ultClickEl = null;
    document.addEventListener("click", (e) => { ultClickT = performance.now(); ultClickEl = e.target; }, true);
    document.addEventListener("pointerdown", (e) => {
      if (e.isPrimary === false || (e.pointerType === "mouse" && e.button !== 0)) return;
      const el = e.target && e.target.closest && e.target.closest(SEL_TAP);
      if (!el || el.disabled) { tap = null; return; }
      tap = { el, x: e.clientX, y: e.clientY, t: performance.now(), desl: raiz.classList.contains("desplazando") };
    }, { passive: true, capture: true });
    document.addEventListener("pointermove", (e) => {
      if (!tap) return;
      if (raiz.classList.contains("desplazando")) tap.desl = true;
      if (Math.hypot(e.clientX - tap.x, e.clientY - tap.y) > 10) tap = null;
    }, { passive: true, capture: true });
    document.addEventListener("pointerup", (e) => {
      const g = tap; tap = null;
      if (!g || !g.desl || !g.el.isConnected) return;
      const dt = performance.now() - g.t;
      if (dt > 340 || Math.hypot(e.clientX - g.x, e.clientY - g.y) > 10) return;
      const tUp = performance.now();
      setTimeout(() => {
        if (!g.el.isConnected || g.el.disabled) return;
        if (ultClickT >= tUp - 12 && ultClickEl && (g.el === ultClickEl || g.el.contains(ultClickEl))) return;
        try { g.el.click(); } catch (er) {}
      }, 45);
    }, { passive: true, capture: true });
    document.addEventListener("pointercancel", () => { tap = null; }, { passive: true, capture: true });
  }
  // PR #20 · Congelado universal de animaciones fuera del viewport (.anim-fuera) para máximo ahorro de batería en toda la web
  const SEL_FUERA = '.encab .h [lang="he"], .banda, .hero .acciones > .btn, .jg-coloso, .jg-col-escena, .jg-col-prev, .fr-gr, .ap-gr-v, .ap-gr-b, .co-medidor, .co-cesta, .lk-libs, .aj-card-ent, .jg-yo, .jg-llave, .jg-lz.on, .ap-poder, .jg-pp-escena, .jg-piedras, .holo-ef';
  const OBS_FUERA = new WeakSet();
  const IO_FUERA = "IntersectionObserver" in window ? new IntersectionObserver((es) => {
    for (const e of es) e.target.classList.toggle("anim-fuera", !e.isIntersecting);
  }, { rootMargin: "48px 0px", threshold: 0.01 }) : null;
  const observarAnim = (nodo) => {
    if (!IO_FUERA || !nodo || nodo.nodeType !== 1) return;
    if (nodo.matches && nodo.matches(SEL_FUERA) && !OBS_FUERA.has(nodo)) { OBS_FUERA.add(nodo); IO_FUERA.observe(nodo); }
    if (nodo.querySelectorAll) for (const el of nodo.querySelectorAll(SEL_FUERA)) if (!OBS_FUERA.has(el)) { OBS_FUERA.add(el); IO_FUERA.observe(el); }
  };
  const pausarFuera = (raiz) => { if (!IO_FUERA || !raiz) return; observarAnim(raiz); };
  window.BiExPausaFuera = observarAnim;
  if (IO_FUERA && window.MutationObserver) {
    let pendObs = []; let rafObs = 0;
    const vaciarObs = () => { rafObs = 0; const l = pendObs; pendObs = []; for (const n of l) if (n && n.isConnected) observarAnim(n); };
    new MutationObserver((ms) => {
      for (const m of ms) for (const n of m.addedNodes) if (n.nodeType === 1) pendObs.push(n);
      if (pendObs.length && !rafObs) rafObs = requestAnimationFrame(vaciarObs);
    }).observe(document.documentElement, { childList: true, subtree: true });
  }
  // Historial: las últimas 24 citas consultadas (capítulos y versos), la más reciente primero (biex:historial)
  function historial(c, cap, v, m) {
    if (!c || !cap) return;
    let l = store.get("historial", []); if (!Array.isArray(l)) l = [];
    v = v == null ? null : +v;
    // un mismo capítulo abierto y enseguida un verso suyo: queda solo el verso
    if (l[0] && l[0].c === c && l[0].cap === cap && (l[0].v == null || l[0].v === v)) l.shift();
    l = l.filter((x) => !(x.c === c && x.cap === cap && (x.v == null ? null : x.v) === v));
    l.unshift({ c, cap, v, m: m === "a" ? "a" : "l", t: Date.now() });
    store.set("historial", l.slice(0, 24));
  }
  // Versos leídos: cada marca guarda el día (AAAAMMDD) y alimenta las estadísticas de lectura (biex:leidos)
  const LEI = (() => {
    let d = store.get("leidos", null); if (!d || typeof d !== "object" || Array.isArray(d)) d = {};
    const hoy = () => { const t = new Date(); return t.getFullYear() * 10000 + (t.getMonth() + 1) * 100 + t.getDate(); };
    const k = (c, cap) => c + "." + cap;
    return {
      hoy,
      es: (c, cap, v) => !!(d[k(c, cap)] && d[k(c, cap)][v]),
      cuantos: (c, cap) => Object.keys(d[k(c, cap)] || {}).length,
      marcar(c, cap, vs, si) {
        const m = d[k(c, cap)] || (d[k(c, cap)] = {}), h0 = hoy();
        for (const v of vs) { if (si) { if (!m[v]) m[v] = h0; } else delete m[v]; }
        if (!Object.keys(m).length) delete d[k(c, cap)];
        store.set("leidos", d);
      },
      todo: () => d,
      // P20 (BiEx, 12-nov-2026): las marcas desde un día (AAAAMMDD) pasan a una copia aparte (biex:leidosApartados),
      // recuperable; devuelve cuántos versos se apartaron
      apartar(desde) {
        const ap = store.get("leidosApartados", null) || {}; let n = 0;
        for (const [kk, m] of Object.entries(d)) for (const [v, dia] of Object.entries(m)) if (+dia >= desde) { (ap[kk] || (ap[kk] = {}))[v] = dia; delete m[v]; n++; if (!Object.keys(m).length) delete d[kk]; }
        if (n) { store.set("leidos", d); store.set("leidosApartados", ap); }
        return n;
      },
    };
  })();
  const sinMarcas = (s) => String(s || "").normalize("NFD").replace(/[\u0300-\u036f\u0342\u0343\u0345\u1dc0-\u1dff]/g, "").normalize("NFC");
  const claveGr = (s) => sinMarcas(s).toLowerCase().replace(/ς/g, "σ").replace(/[’'ʼ]/g, "");
  const claveEs = (s) => sinMarcas(s).toLowerCase();
  const punt = (p) => String(p || "").replace(/¶/g, "");
  const uncial = (s) => sinMarcas(s).toUpperCase().replace(/[’'ʼ]/g, "’");
  // Las direcciones internas usan siempre la dirección completa del documento (funciona también dentro de un marco srcdoc)
  const urlHash = (hh) => location.href.split("#")[0] + hh;
  // una dirección mal formada (p. ej., «%» suelto) no debe romper el lector
  const decodificar = (s) => { try { return decodeURIComponent(s); } catch (e) { return String(s).replace(/%(?![0-9a-f]{2})/gi, "%25").replace(/%[0-9a-f]{2}/gi, (m) => { try { return decodeURIComponent(m); } catch (er) { return ""; } }); } };
  const ponerHash = (hh) => { try { history.replaceState(history.state, "", urlHash(hh)); } catch (e) { /* ignorar */ } };

  // ------------------------------------------------------------------ datos y blindaje de conexión
  const redLenta = () => {
    try {
      const c = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      return !navigator.onLine || !!(c && (c.saveData || /(^|-)2g$/i.test(c.effectiveType || "") || (c.rtt && c.rtt > 900)));
    } catch (e) { return !navigator.onLine; }
  };
  function fetchConTope(url, opts, ms) {
    if (typeof AbortController === "undefined") return fetch(url, opts);
    const ac = new AbortController(), t = setTimeout(() => ac.abort(), ms || 12000);
    return fetch(url, Object.assign({}, opts || {}, { signal: ac.signal })).finally(() => clearTimeout(t));
  }
  const cache = {}, DATOS_MEM = {};
  let baseOk = 0;
  function traer(ruta, k) {
    return fetchConTope(BASES[k] + ruta, null, 11000).then((r) => { if (!r.ok) throw new Error(r.status); baseOk = k; return r.json(); })
      .then((j) => { DATOS_MEM[ruta] = j; return j; })
      .catch((e) => {
        alPadre({ biex: "error", m: "No cargó " + BASES[k] + ruta + " (" + (e && e.message) + ")" });
        if (k + 1 < BASES.length) return traer(ruta, k + 1);
        throw e;
      });
  }
  const cargar = (ruta) => (cache[ruta] = cache[ruta] || traer(ruta, baseOk).catch((e) => { delete cache[ruta]; throw e; }));
  let D = null, T = null;
  const lectura = (c) => cargar("datos/libros/" + c + ".json").then((L) => { indexarAnadidos(L); return L; });
  // Textos añadidos después (datos/libros/<LIB>.json: «an», los pasajes; x/ox, sus tramos en t/o): nunca con el formato base
  // de BiEx; van en violeta y cursiva, entre ⟦ ⟧ y con un aviso al comienzo del pasaje (indicación de BiEx, 31-oct-2026)
  const ANAD = new Map();
  function indexarAnadidos(L) {
    if (!L || !L.c || ANAD.has(L.c)) return;
    const m = new Map();
    for (const p of L.an || []) {
      const [c0, v0] = p.desde, [c1, v1] = p.hasta;
      for (const [cap, vs] of Object.entries(L.caps || {})) {
        const c = +cap;
        for (const x of vs) {
          const k = c * 1000 + x.v;
          if (k < c0 * 1000 + v0 || k > c1 * 1000 + v1) continue;
          m.set(c + ":" + x.v, { p, entero: !!(x.x && x.x.length === 1 && x.x[0][0] === 0 && x.x[0][1] >= (x.t || "").length), ini: c === c0 && x.v === v0, fin: c === c1 && x.v === v1 });
        }
      }
    }
    ANAD.set(L.c, m);
  }
  const anadido = (c, cap, v) => { const m = ANAD.get(c); return (m && m.get(cap + ":" + v)) || null; };
  const analisis = (c) => cargar("datos/analisis/" + c + ".json");
  function tablas() {
    if (T) return Promise.resolve(T);
    return cargar("datos/tablas.json").then((t) => {
      if (T) return T;
      t.P = t.M.map(parseM);
      // claves de búsqueda: se calculan la primera vez que se piden (el análisis de un capítulo no las necesita)
      const perezoso = (k, f) => { let v; Object.defineProperty(t, k, { get: () => v || (v = f()), configurable: true }); };
      perezoso("Lk", () => t.L.map(claveGr));
      perezoso("Fk", () => t.F.map(claveGr));
      perezoso("TRk", () => t.TR.map(claveEs));
      perezoso("formaLema", () => { const m = new Map(); t.LP.forEach((rows, li) => rows.forEach((r) => { if (!m.has(r[0])) m.set(r[0], li); })); return m; });
      T = t;
      return T;
    });
  }
  // Lo que pide la dirección de entrada se empieza a traer de inmediato, en paralelo con el arranque
  for (const r of ["datos/avance.json", "datos/destacados.json", "datos/cronologia.json"]) cargar(r).catch(() => {});
  (() => {
    const m = /^#\/([1-3A-Z]{3})(?:\/\d+)?(\/a)?(?:\/|$)/.exec(location.hash || "");
    if (!m) return;
    lectura(m[1]).catch(() => {});
    if (m[2]) { analisis(m[1]).catch(() => {}); tablas().catch(() => {}); }
  })();
  // (BiEx, 21-nov-2026, AF2) copiar el texto griego de un verso, de su perícopa o del capítulo, con su cita y el crédito de los datos
  async function copiarGriego(b, cap, desde, hasta, que) {
    try {
      const [A] = await Promise.all([analisis(b.c), tablas()]);
      const vs = (A.caps[cap] || []).filter(([v]) => v >= desde && v <= hasta);
      if (!vs.length) throw new Error("vacio");
      const uno = vs.length === 1;
      const cuerpo = vs.map(([v, toks]) => (uno ? "" : v + " ") + toks.map((t) => T.F[t[0]] + punt(t[4])).join(" ")).join("\n");
      const cita = nombreLibro(b) + " " + cap + (que === "capitulo" ? "" : ":" + (uno ? vs[0][0] : vs[0][0] + "–" + vs[vs.length - 1][0]));
      await navigator.clipboard.writeText(cita + " · texto griego\n" + cuerpo + "\n\nTexto griego: Center for New Testament Restoration [Centro para la Restauración del Nuevo Testamento], CC BY-SA 4.0 · BiEx – Biblia Exacta");
      avisar(que === "capitulo" ? "Copiado el griego del capítulo " + cap : que === "pericopa" ? "Copiado el griego de la perícopa" : "Copiado el griego del verso");
    } catch (e) { avisar("No se pudo copiar el griego"); }
  }
  function versoTokensSync(c, cap, v) {
    const A = DATOS_MEM["datos/analisis/" + c + ".json"];
    if (!A || !T) return null;
    const x = (A.caps[cap] || []).find((e) => e[0] === v);
    return x ? x[1] : [];
  }
  async function versoTokens(c, cap, v) {
    const ya = versoTokensSync(c, cap, v);
    if (ya) return ya;
    const [A] = await Promise.all([analisis(c), tablas()]);
    const x = (A.caps[cap] || []).find((e) => e[0] === v);
    return x ? x[1] : [];
  }

  // ------------------------------------------------------------------ morfología (códigos tipo Robinson)
  const CASO = { N: "nominativo", G: "genitivo", D: "dativo", A: "acusativo", V: "vocativo" };
  const NUM = { S: "singular", P: "plural" };
  const GEN = { M: "masculino", F: "femenino", N: "neutro" };
  const TIEMPO = { P: "presente", I: "imperfecto", F: "futuro", A: "aoristo", R: "perfecto", L: "pluscuamperfecto" };
  const MODO = { I: "indicativo", S: "subjuntivo", O: "optativo", M: "imperativo", N: "infinitivo", P: "participio", R: "participio imperativo" };
  const CLASE = { V: "verbo", N: "sustantivo", A: "adjetivo", T: "artículo", PR: "pronombre", PREP: "preposición", CONJ: "conjunción", PRT: "partícula", ADV: "adverbio", INJ: "interjección", HEB: "hebreo o arameo", X: "otra" };
  function parseM(code) {
    const m = { code: code || "", pos: "" };
    if (!code) return m;
    const p = code.split("-"), hd = p[0];
    m.pos = hd;
    if (hd === "V") {
      let t = p[1] || "";
      if (t[0] === "2") { m.second = true; t = t.slice(1); }
      m.tense = t[0]; m.voice = t[1]; m.mood = t[2];
      const c = p[2] || "";
      if (m.mood === "P" || m.mood === "R") { m.case = c[0]; m.number = c[1]; m.gender = c[2]; }
      else if (m.mood !== "N") { m.person = c[0]; m.number = c[1]; }
    } else if (["N", "A", "T", "R", "C", "D", "K", "I", "X", "Q"].includes(hd)) {
      const c = p[1] || "";
      if (!/^(PRI|NUI|LI|OI)$/.test(c)) { m.case = c[0]; m.number = c[1]; m.gender = c[2]; }
      m.propio = p.includes("P") && hd === "N";
    } else if (hd === "P" || hd === "F") {
      const c = p[1] || "";
      if (/^[123]/.test(c)) { m.person = c[0]; m.case = c[1]; m.number = c[2]; m.gender = c[3]; } else { m.case = c[0]; m.number = c[1]; m.gender = c[2]; }
    } else if (hd === "S") {
      const c = p[1] || "";
      m.person = c[0]; m.case = c[2]; m.number = c[3]; m.gender = c[4];
    }
    return m;
  }
  const AB = { P: "pres.", I: "impf.", F: "fut.", A: "aor.", R: "perf.", L: "plusc." };
  const ABM = { I: "ind.", S: "subj.", O: "opt.", M: "imper.", N: "inf.", P: "part.", R: "part." };
  const ABV = ["", "act.", "med.", "pas.", "med./pas."];
  const ABC = { N: "nom.", G: "gen.", D: "dat.", A: "ac.", V: "voc." };
  const ABG = { M: "m.", F: "f.", N: "n." };
  // Tipo de aoristo según la forma visible (sigmático, temático, atemático o ambiguo)
  const AOR_AB = ["", "sigm.", "tem.", "atem.", "amb."];
  const tipoAor = (ao) => (ao && T && T.aoristo[ao]) || "";
  // Descripción de la morfología de una palabra concreta, con su tipo de aoristo
  const mdTok = (t) => {
    const d = T.MD[t[2]] || "", ao = tipoAor(t[7]);
    return ao ? d.replace(/aoristo( 2\.º)?/, "aoristo " + ao) : d;
  };
  function abreviar(m, clase, vz, ao) {
    if (!m || !m.code) return "";
    const cng = [ABC[m.case], m.number === "P" ? "pl." : m.number === "S" ? "sg." : "", ABG[m.gender]].filter(Boolean).join(" ");
    if (m.pos === "V") {
      const parts = [AB[m.tense] + (m.tense === "A" && ao ? " " + AOR_AB[ao] : ""), ABM[m.mood], ABV[vz] || ""];
      if (m.person) parts.push(m.person + "." + (m.number === "P" ? "ª pl." : "ª sg."));
      if (m.case) parts.push(cng);
      return "v. " + parts.filter(Boolean).join(" ");
    }
    const nom = { N: "sust.", A: "adj.", T: "art.", PR: "pron.", PREP: "prep.", CONJ: "conj.", PRT: "part.", ADV: "adv.", INJ: "interj.", HEB: "heb./aram.", X: "" }[clase] || "";
    return [nom, cng].filter(Boolean).join(" ");
  }
  const mayus1 = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);

  // ------------------------------------------------------------------ preferencias
  // orden de los libros (cronológico por defecto), ampliaciones [ ] (todas · primera · base), colores de la edición BiEx,
  // paréntesis, < >, marcas voladas y filtro de niveles de la lectura
  let prefs = Object.assign({ tl: true, tr: true, mo: true, color: "clase", resalta: "", caja: "min", heroCaja: "may", disp: "versos",
    orden: "crono", lorg: true, cor: "todas", ed: true, par: true, ang: true, sup: true, nivel: "", msEsp: false }, store.get("prefs", {}));
  const guardarPrefs = () => store.set("prefs", prefs);
  const aplicarEd = () => document.documentElement.classList.toggle("ed", !!prefs.ed);
  aplicarEd();
  const AP0 = { tam: 3, letra: "clasica", inter: "normal", mov: "si", dal: "", v: 9 };
  // nueve tamaños (antes cinco: 1–5 pasan a 1, 3, 5, 7, 9)
  const K_TAM = [.9, .95, 1, 1.06, 1.12, 1.19, 1.26, 1.34, 1.42];
  let ap = Object.assign({}, AP0, store.get("ap", {}));
  if (ap.v !== 9) { ap.tam = [1, 3, 5, 7, 9][Math.min(5, Math.max(1, ap.tam | 0 || 2)) - 1]; ap.v = 9; store.set("ap", ap); }
  ap.tam = Math.min(9, Math.max(1, ap.tam | 0 || 3));
  function aplicarAp() {
    const r = document.documentElement;
    r.setAttribute("data-tam", String(ap.tam));
    r.style.setProperty("--k", String(K_TAM[ap.tam - 1]));
    r.setAttribute("data-letra", ap.letra);
    r.setAttribute("data-inter", ap.inter);
    r.setAttribute("data-mov", ap.mov);
    // visión del color (BiEx, 13-nov-2026): rv = protanopía y deuteranopía, az = tritanopía, mono = acromatopsia
    if (ap.dal) r.setAttribute("data-dal", ap.dal); else r.removeAttribute("data-dal");
    if (typeof MET !== "undefined" && MET) MET.despertar();
    if (typeof ajustarBarra === "function") requestAnimationFrame(ajustarBarra);
  }
  aplicarAp();
  const temaActual = () => document.documentElement.getAttribute("data-theme") || "dark";
  function ponerTema(t) { document.documentElement.setAttribute("data-theme", t); store.set("tema", t); }
  let avisoT = null;
  // (BiEx, 15-nov-2026, 19:25: «un mensaje breve que no duró lo suficiente para leerlo») El aviso dura lo que tarda en leerse
  // (unos 15 caracteres por segundo, de 2,8 a 8 s); va en la capa superior (popover), por encima de las ventanas abiertas, con
  // clases propias (nunca la genérica «si»: AC19).
  function avisar(txt) {
    let el = $(".aviso-flot");
    if (!el) {
      el = h("div", { class: "aviso-flot", role: "status" }); document.body.append(el);
    }
    el.textContent = txt;
    if (el.showPopover) { if (!el.hasAttribute("popover")) el.setAttribute("popover", "manual"); try { if (el.matches(":popover-open")) el.hidePopover(); el.showPopover(); } catch (e) { /* sin capa superior */ } }
    el.classList.add("af-vis");
    clearTimeout(avisoT); avisoT = setTimeout(() => el.classList.remove("af-vis"), Math.max(2800, Math.min(8000, 1200 + String(txt).length * 66)));
  }
  // Griego: minúsculas con acentos (texto de la edición) o mayúsculas sin marcas (como los códices unciales)
  const gk = (s, caja) => ((caja || prefs.caja) === "may" ? uncial(s) : s);
  const spanGk = (s, attrs) => h("span", Object.assign({ lang: "grc", "data-gk": s }, attrs || {}), gk(s));
  function aplicarCaja() {
    for (const el of $$("[data-gk]")) el.textContent = gk(el.dataset.gk);
    for (const el of $$(".pal")) el.classList.toggle("may", prefs.caja === "may");
    for (const el of $$("[data-caja]")) el.setAttribute("aria-pressed", el.dataset.caja === prefs.caja ? "true" : "false");
  }

  // ------------------------------------------------------------------ textos
  // ------------------------------------------------------------------ texto con formato
  // Cada carácter recibe sus rasgos: palabras del Mashíaḥ (tramos «m» del verso), citas de la Antigua Voluntad (tramos «c»),
  // cursiva y negrita del borrador (Markdown), ampliaciones entre corchetes (y si son la primera alternativa o una de las
  // siguientes), paréntesis, < >, marcas voladas, griego aún sin traducción (⟪…⟫ en el texto base) y hebreo.
  // Según las opciones de lectura se ocultan o se colorean; los asteriscos sueltos del texto se conservan como marcas.
  const F = { M: 1, C: 2, IT: 4, NG: 8, COR: 16, ALT: 32, PAR: 64, ANG: 128, SUP: 256, OCU: 512, HE: 1024, AN: 2048, SIG: 4096, SEL: 8192, ALT2: 16384, RA: 32768, RL: 65536 };
  const VOLADA = /[ʰ-˿ᴬ-ᶿ⁰-₟]/;
  function rasgos(t, esBase, x) {
    const n = t.length, f = new Uint32Array(n);
    for (const [a, z] of (x && x.m) || []) for (let i = a; i < z && i < n; i++) f[i] |= F.M;
    for (const [a, z] of (x && x.c) || []) for (let i = a; i < z && i < n; i++) f[i] |= F.C;
    for (const [a, z] of (x && x.x) || []) for (let i = a; i < z && i < n; i++) f[i] |= F.AN;
    // significado de un nombre o de una palabra transliterada en su primera aparición del capítulo: siempre visible (BiEx, 31-oct-2026)
    for (const [a, z] of (x && x.s) || []) for (let i = a; i < z && i < n; i++) f[i] |= F.SIG;
    // AF6 (BiEx, 21 y 22-nov-2026): palabras casi exóticas (su lema aparece 3 veces o menos en la Nueva Voluntad), marcadas en
    // los datos de cada verso (tramos «r» en Textual y «or» en la Lectura): en Textual con su color; en la Lectura, subrayado sutil
    for (const [a, z] of (x && x.r) || []) for (let i = a; i < z && i < n; i++) f[i] |= x.rl ? F.RL : F.RA;
    // la traducción de la palabra que se analiza, marcada dentro de su verso (ventana de la palabra)
    for (const [a, z] of (x && x.sel) || []) for (let i = a; i < z && i < n; i++) f[i] |= F.SEL;
    if (!esBase) {
      // negritas **…** y cursivas *…* (mismas reglas que tenía el lector: los asteriscos sueltos no cuentan)
      let t2 = t;
      for (const m of t.matchAll(/\*\*(?=\S)([^*]+?)(?<=\S)\*\*/g)) {
        const k = m.index, L = m[0].length;
        f[k] |= F.OCU; f[k + 1] |= F.OCU; f[k + L - 2] |= F.OCU; f[k + L - 1] |= F.OCU;
        for (let i = k + 2; i < k + L - 2; i++) f[i] |= F.NG;
        t2 = t2.slice(0, k) + "\u0000\u0000" + t2.slice(k + 2, k + L - 2) + "\u0000\u0000" + t2.slice(k + L);
      }
      for (const m of t2.matchAll(/(^|[\s«“‘(\[])\*(?=[^\s*])([^*]+?)(?<=[^\s*])\*(?=$|[\s»”’).,;:!?\]])/g)) {
        const a = m.index + m[1].length, z = m.index + m[0].length - 1;
        f[a] |= F.OCU; f[z] |= F.OCU;
        for (let i = a + 1; i < z; i++) f[i] |= F.IT;
      }
    }
    // corchetes: cada grupo sabe si es la primera ampliación de su palabra o una alternativa siguiente
    const pila = [];
    const saltable = (ch) => ch === " " || ch === "*" || VOLADA.test(ch);
    let cierreUlt = -2, cierreProf = -1, cierreIdx = 0;
    for (let i = 0; i < n; i++) {
      const ch = t[i];
      if (ch === "⟪") { const z = t.indexOf("⟫", i); if (z > 0) { i = z; continue; } }
      if (ch === "[") {
        let j = i - 1; while (j >= 0 && saltable(t[j])) j--;
        const alt = j >= 0 && j === cierreUlt && cierreProf === pila.length;
        pila.push({ a: i, alt, idx: alt ? cierreIdx + 1 : 0 });
      } else if (ch === "]" && pila.length) {
        const g = pila.pop();
        let a = g.a; if (a > 0 && t[a - 1] === " ") a--;
        // ALT2 (BiEx, 12-nov-2026: «Solo las dos primeras»): de la tercera ampliación de la palabra en adelante
        for (let k = a; k <= i; k++) f[k] |= F.COR | (g.alt ? F.ALT : 0) | (g.idx >= 2 ? F.ALT2 : 0);
        cierreUlt = i; cierreProf = pila.length; cierreIdx = g.idx;
      }
    }
    // paréntesis y < >
    const encerrar = (abre, cierra, bit) => {
      const p = [];
      for (let i = 0; i < n; i++) {
        if (t[i] === "⟪") { const z = t.indexOf("⟫", i); if (z > 0) { i = z; continue; } }
        if (t[i] === abre) p.push(i);
        else if (t[i] === cierra && p.length) { let a = p.pop(); if (a > 0 && t[a - 1] === " ") a--; for (let k = a; k <= i; k++) f[k] |= bit; }
      }
    };
    encerrar("(", ")", F.PAR); encerrar("<", ">", F.ANG);
    for (let i = 0; i < n; i++) {
      const ch = t[i];
      if (ch === "⟪") { const z = t.indexOf("⟫", i); if (z > 0) { i = z; continue; } }
      if (VOLADA.test(ch) || (ch === "*" && !(f[i] & F.OCU))) f[i] |= F.SUP;
      else if (/[֐-׿]/.test(ch)) f[i] |= F.HE;
    }
    return f;
  }
  let corForzado = null;
  const kCor = () => (prefs.lorg ? "corOrg" : "cor");
  const corAct = () => corForzado || (prefs.lorg ? (prefs.corOrg || "primera") : prefs.cor);
  function oculto(b) {
    if (b & F.OCU) return true;
    const cor = corAct();
    if ((b & F.COR) && !(b & F.SIG) && (cor === "base" || (cor === "primera" && (b & F.ALT)) || (cor === "dos" && (b & F.ALT2)))) return true;
    if ((b & F.PAR) && prefs.par === false) return true;
    if ((b & F.ANG) && prefs.ang === false) return true;
    if ((b & F.SUP) && prefs.sup === false) return true;
    return false;
  }
  const CLASES = [[F.M, "tm"], [F.C, "tc"], [F.IT, "it"], [F.NG, "ng"], [F.COR, "tk"], [F.HE, "he"], [F.AN, "ta"], [F.SEL, "pal-sel"], [F.RA, "rara-t"], [F.RL, "rara-l"]];
  // x: el verso (con sus tramos m y c); en el texto base, ⟪…⟫ es griego aún sin traducción fijada
  function textoLectura(t, esBase, x) {
    t = String(t || "");
    const f = rasgos(t, esBase, x);
    const frag = document.createDocumentFragment(), mapa = [];
    frag.mapa = mapa; // carácter mostrado → posición en el texto crudo (para saber qué palabra se tocó)
    let clave = -1, cont = null, buf = "", prevEsp = true;
    const vaciar = () => { if (buf) { cont.append(buf); buf = ""; } };
    // un nodo de texto por tramo del mismo estilo (antes, uno por carácter: miles de nodos por capítulo)
    const abrir = (k) => {
      if (k === clave && cont) return;
      vaciar();
      clave = k;
      const cls = CLASES.filter(([bit]) => k & bit).map(([, c]) => c);
      if (!cls.length) { cont = frag; return; }
      cont = h(k & F.HE ? "bdi" : "span", { class: cls.join(" "), lang: k & F.HE ? "he" : null });
      frag.append(cont);
    };
    const visual = (b) => b & (F.M | F.C | F.IT | F.NG | F.COR | F.HE | F.AN | F.SEL | F.RA | F.RL);
    for (let i = 0; i < t.length; i++) {
      const b = f[i];
      if (t[i] === "⟪" && esBase) {
        const z = t.indexOf("⟫", i);
        if (z > 0) {
          if (!oculto(b)) { abrir(visual(b)); vaciar(); const g = spanGk(t.slice(i + 1, z), { class: "gr" }); cont.append(g); for (let j = 0, L = g.textContent.length; j < L; j++) mapa.push(Math.min(z - 1, i + 1 + j)); prevEsp = false; }
          i = z; continue;
        }
      }
      if (oculto(b)) continue;
      const ch = t[i];
      if (ch === " " && prevEsp) continue; // sin espacios dobles al ocultar
      abrir(visual(b));
      buf += ch; mapa.push(i); prevEsp = ch === " ";
    }
    vaciar();
    return frag;
  }
  // Lectura organizada: los versos de texto base con el orden reorganizado (o, om, oc) cuando existe
  const txtVerso = (L, sel) => (prefs.lorg && L.o ? textoLectura(L.o, !!L.g, { m: L.om, c: L.oc, x: L.ox, s: L.os, r: L.or, rl: true, g: L.g, n: L.n, v: L.v, sel }) : textoLectura(L.t, !!L.g, sel || prefs.lorg ? Object.assign({}, L, { sel, rl: !!prefs.lorg }) : L));
  // AL8 (BiEx, 22-nov-2026, 18:53): fuera del capítulo (Escudriña, la cesta, el buscador, las citas, los marcadores, las referencias,
  // la línea del tiempo, los niveles…) el verso va siempre en el formato de la Lectura, la más inteligible; la Textual queda para
  // quien la elige al leer el capítulo
  const txtVersoL = (L, sel) => (L.o ? textoLectura(L.o, !!L.g, { m: L.om, c: L.oc, x: L.ox, s: L.os, r: L.or, rl: true, g: L.g, n: L.n, v: L.v, sel }) : textoLectura(L.t, !!L.g, Object.assign({}, L, { sel, rl: true })));
  const crudoVerso = (L) => String((prefs.lorg && L.o ? L.o : L.t) || "");
  // el texto del verso dentro de su propio contenedor, con el mapa de caracteres (para la palabra tocada)
  const vtx = (L) => { const fr = txtVerso(L), sp = h("span", { class: "vtx" }, fr); sp.__mapa = fr.mapa; return sp; };
  // Qué tramo del texto del verso corresponde a cada palabra griega: las traducciones de las palabras se buscan en orden
  // (el texto base es su suma; en la lectura organizada, una pospositiva movida se halla buscando desde el comienzo).
  // En los textos del autor solo vale una coincidencia única (no hay alineación palabra por palabra).
  // (7-nov-2026) la lectura puede mostrar una pieza recortada: el significado de un nombre solo va en su primera aparición del
  // capítulo (Mashíaḥ [Ungido] → Mashíaḥ), el Nombre o YēshŪ́aʿ cambian de forma… Si la pieza entera no está, se busca su
  // núcleo (sin lo que va entre [ ] ni los superíndices); y una palabra que quede sola sin hallar entre dos halladas toma el
  // hueco que dejan (antes la palabra tocada caía en la palabra griega anterior: Yôḥānā́n 1:41).
  const nucleoPieza = (s) => { let x = s, y; do { y = x; x = x.replace(/\s*\[[^\[\]]*\]/g, ""); } while (x !== y); return x.replace(/[ⁿᵐᶠ]/g, "").trim(); };
  // (21-nov-2026) La lectura organizada no solo cambia el orden de las piezas: quita la marca de caso delante («a visión
  // ocular» → «visión ocular»), rota las alternativas entre [ ] («en lo [quien] [el]» → «en el [lo] [quien]»), contrae («de el
  // [lo]» → «del [de lo]»), suelta los paréntesis y las palabras de ampliación con * («a los (quienes)*» → «los», «si* alguna
  // vez» → «alguna vez») y a veces deja solo la preposición («para lo [quien] [el]» → «para»). Si ni la pieza ni su núcleo
  // están, se prueban esas variantes (como palabras sueltas; las cortas, solo hacia delante) y, al final, su primera palabra con
  // contenido. Antes no se hallaban 9529 piezas en 6981 versos organizados y el hueco entre dos halladas se daba a ciegas a la
  // que faltaba: en Lc 1:22 el hueco «visión ocular en el [lo] [quien]» caía en el artículo, y tocar «visión ocular» abría otra
  // palabra. Ahora el hueco solo se da si comparte alguna palabra con la pieza o si es una sola palabra.
  const RX_ALT = /^([^\[\]]+?)((?:\s*\[[^\[\]]+\])+)([ⁿᵐᶠ]*)$/;
  const rotarAlt = (s, pre) => {
    const m = RX_ALT.exec(s), r = []; if (!m) return r;
    const it = [m[1].trim(), ...[...m[2].matchAll(/\[([^\[\]]+)\]/g)].map((x) => x[1])];
    for (let k = 1; k < it.length; k++) r.push(pre + it[k] + " " + it.filter((_, i) => i !== k).map((x) => "[" + x + "]").join(" ") + m[3]);
    return r;
  };
  const sinMarcaCaso = (s) => s.replace(/^(a|al)\s+(?=\S)/, "");
  function variantesPieza(tr) {
    const out = [], sm = sinMarcaCaso(tr), pm = /^(para|de|a|en|por)\s+(.+)$/.exec(tr);
    if (sm !== tr) out.push(sm);
    for (const b of pm ? [tr, sm, pm[2]] : [tr, sm]) out.push(...rotarAlt(b, ""));
    if (pm) out.push(...rotarAlt(pm[2], pm[1] + " "), pm[2]);
    out.push(nucleoPieza(sm));
    for (const [p, c] of [["de", "del"], ["a", "al"]]) {
      const m = new RegExp("^" + p + " el((?:\\s*\\[[^\\[\\]]+\\])*)([ⁿᵐᶠ]*)(.*)$").exec(tr);
      if (m) out.push(c + m[1].replace(/\[([^\[\]]+)\]/g, "[" + p + " $1]") + m[2] + m[3], c + m[3]);
      // «de el [lo]» → «de lo [del]»
      const r = new RegExp("^" + p + " el\\s*\\[([^\\[\\]]+)\\]([ⁿᵐᶠ]*)$").exec(tr);
      if (r) out.push(p + " " + r[1] + " [" + c + "]" + r[2]);
    }
    const sinPar = tr.replace(/\(([^()]*)\)\*?/g, "$1").replace(/\*/g, "").replace(/\s+/g, " ").trim();
    const sinPar2 = tr.replace(/\s*\([^()]*\)\*?/g, "").replace(/\*/g, "").trim();
    const sinAst = tr.replace(/(^|\s)[^\s()\[\]]+\*(?=\s|$)/g, " ").replace(/\s+/g, " ").trim();
    for (const x of [sinPar, sinPar2, sinAst]) if (x !== tr) out.push(x, nucleoPieza(x), sinMarcaCaso(x), sinMarcaCaso(nucleoPieza(x)));
    const limpio = nucleoPieza(tr).replace(/<[^<>]*>/g, "").replace(/[¿?¡!*]/g, "").replace(/\s+/g, " ").trim();
    if (limpio) out.push(limpio);
    return [...new Set(out)].filter((x) => x && x !== tr && x.length >= 2);
  }
  const VACIAS_AL = new Set("de del el la lo los las a al para por en y e o u que con sin un una unos unas su sus se le les me te nos os mi tu".split(" "));
  const palabrasPieza = (tr) => nucleoPieza(tr).replace(/<[^<>]*>|\([^()]*\)/g, " ").match(/[\p{L}\p{M}ʿʾ]+/gu) || [];
  const letraAl = (ch) => !!ch && /[\p{L}\p{M}]/u.test(ch) && !/[ⁿᵐᶠ]/.test(ch);
  const AUX_AL = new Set("ha han he has hemos habéis había habían habiendo haber siendo estando estaba estaban estar ser es son fue fueron era eran sea sean está están".split(" "));
  const clavePieza = (tr) => palabrasPieza(tr).filter((w) => w.length >= 3 && !VACIAS_AL.has(w) && !AUX_AL.has(w)).sort((x, y) => y.length - x.length)[0] || "";
  function alinearTokens(L, toks) {
    const raw = crudoVerso(L), bajo = raw.toLowerCase(), out = [];
    let cur = 0;
    // textos del autor: solo vale una coincidencia única (no hay alineación palabra por palabra)
    const unica = (tr) => { if (tr.length < 3) return -1; const p = bajo.indexOf(tr); return p >= 0 && bajo.indexOf(tr, p + 1) < 0 ? p : -1; };
    // texto base: cada candidata se busca como palabra suelta (no «la» dentro de «adelante», ni «a él» dentro de «encima él»),
    // primero hacia delante; hacia atrás (una pospositiva movida al comienzo) solo sin pisar una palabra ya hallada
    // ni dentro de las alternativas [ ] de otra pieza («lo» dentro de «en el [lo] [quien]»)
    // (solo los pares [ ] cerrados: un «[» suelto en los datos no deja el resto del verso «dentro»)
    const prof = new Int16Array(raw.length + 1), pila = [];
    for (let i = 0; i < raw.length; i++) if (raw[i] === "[") pila.push(i); else if (raw[i] === "]" && pila.length) { const o = pila.pop(); prof[o + 1]++; prof[i]--; }
    for (let i = 1; i <= raw.length; i++) prof[i] += prof[i - 1];
    const suelta = (p, w) => !prof[p] && !letraAl(bajo[p - 1]) && !letraAl(bajo[p + w.length]);
    const libre = (p, n) => !out.some((r) => r && r[0] < p + n && r[1] > p);
    const delante = (w, desde = cur) => { let p = bajo.indexOf(w, desde); while (p >= 0 && !suelta(p, w)) p = bajo.indexOf(w, p + 1); return p; };
    const atras = (w) => { let p = bajo.indexOf(w); while (p >= 0 && p < cur && !(suelta(p, w) && libre(p, w.length))) p = bajo.indexOf(w, p + 1); return p >= 0 && p < cur ? p : -1; };
    // una variante no toma el tramo que la pieza exacta de una de las palabras siguientes halla hacia delante (el artículo que
    // falta no se queda con el de la palabra de al lado)
    // candidatas de cada palabra: la pieza, luego su núcleo, luego las variantes de la más larga (la más precisa) a la más corta
    const fijasDe = [], otrasDe = [];
    if (L.g) toks.forEach((t, k) => {
      const s = String(T.TR[t[3] || 0] || "").toLowerCase(), nu = s ? nucleoPieza(s) : "", f = s ? [s] : [];
      if (nu && nu !== s && nu.length >= 2) f.push(nu);
      fijasDe[k] = f;
      otrasDe[k] = s ? [...new Set([...variantesPieza(s), clavePieza(s), (/^(para|de|en|por)\s/.exec(s) || [])[1]])].filter((w) => w && !f.includes(w)).sort((x, y) => y.length - x.length) : [];
    });
    const ajena = (j, p, n) => {
      for (let k = j + 1; k < toks.length; k++) for (const w of fijasDe[k]) { const q = delante(w); if (q >= 0 && q < p + n && q + w.length > p) return true; }
      return false;
    };
    // una coincidencia que salta por encima de dos o más de las palabras siguientes y cuya pieza se repite más adelante es de
    // esa otra palabra (la propia está cambiada en su sitio: «de יֵשׁוּעַ [YēshŪ́aʿ] […]» en la primera aparición, o se movió
    // al comienzo: «Pero discurseo…»); saltar una sola es un reorden («Pero he sumergido»)
    const salta = (j, p, w) => {
      let n = 0;
      for (let k = j + 1; k < toks.length && k <= j + 3; k++) if ([...fijasDe[k], ...otrasDe[k]].some((x) => { const q = delante(x); return q >= cur && q < p; })) n++;
      return n >= 2 && fijasDe.some((f, k) => k > j && (f.includes(w) || otrasDe[k].includes(w)));
    };
    const debil = new Uint8Array(toks.length); // hallada por una variante: puede tomar el hueco entero entre sus vecinas
    for (let j = 0; j < toks.length; j++) { const t = toks[j];
      let tr = String(T.TR[t[3] || 0] || "").toLowerCase();
      let a = -1, z = -1;
      if (tr && !L.g) {
        a = unica(tr);
        if (a < 0) { const nu = nucleoPieza(tr); if (nu && nu !== tr) { a = unica(nu); if (a >= 0) tr = nu; } }
        if (a >= 0) z = a + tr.length;
      } else if (tr) {
        // hacia delante la pieza y su núcleo, y si no las variantes; luego hacia atrás la pieza y su núcleo (aunque sean cortos:
        // «pero», «pues») y las variantes de más de 4 letras
        const fijas = fijasDe[j], otras = otrasDe[j];
        for (const w of fijas) { const p = delante(w); if (p >= 0 && !salta(j, p, w)) { a = p; tr = w; break; } }
        if (a < 0) for (const w of otras) { const p = delante(w); if (p >= 0 && !ajena(j, p, w.length) && !salta(j, p, w)) { a = p; tr = w; debil[j] = 1; break; } }
        if (a < 0) for (const w of fijas) { a = atras(w); if (a >= 0) { tr = w; break; } }
        if (a < 0) for (const w of otras) { if (w.length <= 4) continue; a = atras(w); if (a >= 0) { tr = w; debil[j] = 1; break; } }
        if (a >= 0) z = a + tr.length;
      } else if (L.g) { a = raw.indexOf("⟪", cur); const e = a >= 0 ? raw.indexOf("⟫", a) : -1; z = e > 0 ? e + 1 : -1; }
      if (a >= 0 && z > a) { out.push([a, z]); if (a >= cur) cur = z; } else out.push(null);
    }
    // lo que sigue pegado a lo hallado es de la misma pieza: sus alternativas [ ], < >, * y superíndices («no» + « [no]* <¿no?>»)
    // y la forma de presentación hebrea («de» + «יֵשׁוּעַ [YēshŪ́aʿ] [Salvado-Salvador de YHVH]»)
    const pisaOtra = (j, a, z) => out.some((q, k) => k !== j && q && q[0] < z && q[1] > a);
    if (L.g) out.forEach((r, j) => {
      if (!r) return; const c = /^(?:\s*(?:\[[^\[\]]*(?:\[[^\[\]]*\][^\[\]]*)*\]|<[^<>]*>|\*|[ⁿᵐᶠ]+))+/.exec(raw.slice(r[1]));
      if (c && !pisaOtra(j, r[1], r[1] + c[0].length)) r[1] += c[0].length;
    });
    if (L.g) out.forEach((r, j) => {
      if (!r) return; const m = /^\s*[\u0590-\u05FF]+(?:\s*\[[^\[\]]*\])*/.exec(raw.slice(r[1]));
      if (!m || !/[\u0590-\u05FF]/.test(m[0])) return;
      const suyas = palabrasPieza(String(T.TR[toks[j][3] || 0] || "").toLowerCase()), ahi = m[0].toLowerCase().split(/[^\p{L}\p{M}ʿʾ]+/u);
      const z = r[1] + m[0].length;
      if (suyas.some((w) => w.length >= 3 && ahi.includes(w)) && !pisaOtra(j, r[1], z)) r[1] = z;
    });
    if (L.g) for (let j = 0; j < out.length; j++) {
      if (out[j] && !debil[j]) continue;
      const ant = j > 0 ? out[j - 1] : [0, 0], sig = j + 1 < out.length ? out[j + 1] : [raw.length, raw.length];
      if (!ant || !sig) continue; // dos o más seguidas sin hallar: no se adivina
      let a = ant[1], z = sig[0];
      while (a < z && /[\s,.;:·¡!¿?«»“”‘’()]/.test(raw[a])) a++;
      while (z > a && /[\s,.;:·¡!¿?«»“”‘’()]/.test(raw[z - 1])) z--;
      if (!(z > a)) continue;
      if (out[j] && !(a <= out[j][0] && out[j][1] <= z)) continue; // la variante hallada fuera del hueco (reordenada) se queda como está
      const hueco = raw.slice(a, z).toLowerCase(), suyas = palabrasPieza(String(T.TR[toks[j][3] || 0] || "").toLowerCase());
      const una = !/\s/.test(hueco), comparte = suyas.some((w) => w.length >= 2 && hueco.split(/[^\p{L}\p{M}ʿʾ]+/u).includes(w));
      if (/\p{L}/u.test(hueco) && !pisaOtra(j, a, z) && (una || comparte)) out[j] = [a, z];
    }
    return out;
  }
  // carácter bajo el dedo o el puntero → posición en el texto crudo del verso
  function indiceToque(e, el) {
    if (!e || e.clientX == null) return null;
    let nodo = null, off = 0;
    try {
      if (document.caretPositionFromPoint) { const p = document.caretPositionFromPoint(e.clientX, e.clientY); if (p) { nodo = p.offsetNode; off = p.offset; } }
      else if (document.caretRangeFromPoint) { const r = document.caretRangeFromPoint(e.clientX, e.clientY); if (r) { nodo = r.startContainer; off = r.startOffset; } }
    } catch (er) { return null; }
    const cont = el && el.querySelector(".vtx");
    if (!nodo || !cont || !cont.contains(nodo)) return null;
    const pre = document.createRange(); pre.selectNodeContents(cont); pre.setEnd(nodo, off);
    const k = pre.toString().length, mapa = cont.__mapa;
    return mapa && mapa.length ? mapa[Math.min(k, mapa.length - 1)] : null;
  }
  // Glosa breve: la primera traducción y, aparte, las alternativas entre corchetes
  // Traducción principal arriba y alternativas debajo; si hay corchetes en medio («buen [buena] mensaje [noticia]»),
  // arriba va la lectura sin corchetes («buen mensaje») y debajo la traducción completa
  function glosa(tr) {
    const t = String(tr || "·"), k = t.indexOf(" [");
    if (k < 0 || /^\S*\[/.test(t)) return [t];
    let limpio = t;
    for (let i = 0; i < 4 && /\[[^\[\]]*\]/.test(limpio); i++) limpio = limpio.replace(/\s*\[[^\[\]]*\]/g, "");
    limpio = limpio.replace(/\s{2,}/g, " ").trim();
    if (!limpio || limpio.replace(/[\u1D2C-\u1DBF\u2070-\u209F*]+$/u, "") === t.slice(0, k)) return [t.slice(0, k), h("span", { class: "alt", text: t.slice(k + 1) })];
    return [limpio, h("span", { class: "alt", text: t })];
  }
  const nombreLibro = (b) => (b.t ? b.t + " [" + b.n + "]" : b.n);
  // Bajo la transliteración originaria, el nombre tradicional va entre comillas: se cita su uso, no se lo da por correcto (BiEx, 10-nov-2026)
  const tradQ = (b) => (b.t ? "«" + b.n + "»" : b.n);
  // Descripciones de contenido de los manuscritos: los nombres tradicionales de los libros pasan a «transliteración [tradicional]».
  let reLibros = null;
  function conNombres(txt) {
    if (!txt) return txt;
    if (!reLibros) {
      const ns = D.libros.map((b) => b.n).filter(Boolean).concat(["Hechos"]).sort((p, q) => q.length - p.length);
      reLibros = new RegExp("(^|[^\\p{L}\\d])(" + ns.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|") + ")(?![\\p{L}])", "gu");
    }
    const porN = new Map(D.libros.map((b) => [b.n, b])); porN.set("Hechos", D.libros.find((b) => b.c === "ACT"));
    return txt.replace(/\bEvangelios\b/g, "εὐαŋgέlια [buenos mensajes]").replace(reLibros, (m, a, n) => a + nombreLibro(porN.get(n)));
  }
  // Nombre del libro para rótulos: transliteración y, más tenue, el nombre tradicional entre corchetes
  const etLibro = (b, extra) => [b.t || b.n, b.t ? h("span", { class: "trad", text: " [" + b.n + "]" }) : null, extra ? " " + extra : null];
  // Fechas: a.H.D. (antes del Hijo de Dios) y d.H.D. (después del Hijo de Dios)
  const ERA_A = "a.H.D.", ERA_D = "d.H.D.";
  const libroDe = (c) => D.libros.find((b) => b.c === c);
  // Orden de los libros: cronológico (por defecto), por fecha de escritura o tradicional (datos/cronologia.json)
  let CRONO = null;
  const ORDENES = [
    ["crono", "Χrοnοlόgικο", () => "En el orden del tiempo (χrοnοlοgικός): primero los relatos de la vida de YēshŪ́aʿ, según el primer acontecimiento que narra cada uno; luego " + nombreLibro(libroDe("ACT")) + ", las cartas en el orden en que se escribieron y, al final, " + nombreLibro(libroDe("REV")) + "."],
    ["escritura", "Por escritura", "Cada libro en el orden en que se escribió, con su fecha aproximada: todos, antes del año 70."],
    ["tradicional", "Tradicional", "El orden habitual en espurias traducciones de la Biblia."]];
  const ordenActivo = () => (CRONO && CRONO.ordenes[prefs.orden] ? prefs.orden : "tradicional");
  const nombreOrden = () => ({ crono: "en orden χrοnοlόgικο", escritura: "por fecha de escritura", tradicional: "en el orden tradicional" })[ordenActivo()];
  function librosEnOrden() { const k = ordenActivo(); return k === "tradicional" ? D.libros : CRONO.ordenes[k].map(libroDe).filter(Boolean); }
  const numLibro = (b) => librosEnOrden().indexOf(b) + 1;
  // En rótulos en mayúsculas, las palabras con signos (YēshŪ́aʿ) se dejan en su forma para no deformar los diacríticos
  const protegerMay = (t) => String(t).split(/(\S*[\u0300-\u036f\u02b0-\u02ff]\S*)/).filter(Boolean).map((x) => (/[\u0300-\u036f\u02b0-\u02ff]/.test(x) ? h("span", { class: "np", text: x }) : x));
  const fechaEscrito = (b) => (CRONO && CRONO.libros[b.c] ? CRONO.libros[b.c].e || "" : "");
  // (7-nov-2026) «c. 28 – 30» → «c. 28–30», como «Escrito c. 45–60» a su lado; el guion espaciado queda solo entre eras
  const fechaNarra = (b) => (CRONO && CRONO.libros[b.c] ? (CRONO.libros[b.c].n || "").replace(/(\d) – (\d)/g, "$1–$2") : "");
  const estadoEt = (n) => (D.escala[n] || {}).etiqueta || n;
  const refCorta = (b, cap, v) => nombreLibro(b) + " " + cap + (v != null ? ":" + v : "");

  // ------------------------------------------------------------------ memoria de la posición de lectura
  // Cada paso del historial lleva una clave; al volver (atrás/adelante) la vista se restaura en la misma posición en que
  // se dejó, y una navegación nueva empieza arriba. La posición en la lista de libros se recuerda aparte para el título del libro.
  try { history.scrollRestoration = "manual"; } catch (e) { /* ignorar */ }
  const POS = (() => { try { return JSON.parse(sessionStorage.getItem("biex:pos") || "{}"); } catch (e) { return {}; } })();
  let MEMLIB = (() => { try { return JSON.parse(sessionStorage.getItem("biex:lib") || "null"); } catch (e) { return null; } })();
  let fijarInmersivo = null;
  let pasoAdelante = () => {};
  let repintarAdelante = () => {};
  var MET = null; // var: la apariencia se aplica antes de esta línea (sin zona muerta)
  const RP = { inm: null, clave: null, objetivo: null, guardar: true, t: 0, ts: 0, tg: 0, forzar: null, previa: null, actual: null, ancla: null, anclaSig: null, enSitio: false, anclaEnSitio: null, ultLinea: null, inicioCap: null, irInicio: null };
  function irCapituloInicio(ruta) {
    if (!ruta) return;
    RP.inicioCap = "tope";
    RP.ultLinea = null; RP.ultNum = null;
    if (fijarInmersivo) fijarInmersivo(false);
    location.hash = ruta;
  }
  const nuevaClave = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  function claveActual() {
    const st = history.state;
    if (st && st.bx) { RP.clave = st.bx; return true; }
    RP.clave = nuevaClave();
    try { history.replaceState(Object.assign({}, st || {}, { bx: RP.clave }), "", location.href); } catch (e) { /* sin historial */ }
    return false;
  }
  function persistirPos() {
    try {
      const ks = Object.keys(POS); if (ks.length > 120) for (const k of ks.slice(0, ks.length - 120)) delete POS[k];
      sessionStorage.setItem("biex:pos", JSON.stringify(POS));
      if (MEMLIB) sessionStorage.setItem("biex:lib", JSON.stringify(MEMLIB));
    } catch (e) { /* sin almacenamiento */ }
  }
  const esLista = (hh) => /^#\/(libros)?$/.test(hh || "");
  function anotarPos() {
    if (!RP.guardar || !RP.clave) return;
    const y = Math.round(window.scrollY);
    const a = document.querySelector("#vista .vl, #vista .vs, #vista .av") ? capturarAncla(true) : null;
    const inm = document.documentElement.classList.contains("inmersivo");
    POS[RP.clave] = a && !a.tope ? { y, a, f: firmaVista(), i: inm ? 1 : 0 } : inm ? { y, i: 1 } : y;
    RP.ultAncla = { a: a || (y < 40 ? { tope: true } : null), h: location.hash };
    if (esLista(RP.actual)) MEMLIB = { h: RP.actual, y, k: RP.clave };
    persistirPos();
    anotarUltimo();
    anotarVista(y, a, inm);
  }
  // (BiEx, 21-nov-2026: «al volver tras un rato se recarga todo y no me deja en la misma vista») la última vista de cualquier
  // sección (no solo de un capítulo) queda en «vista»: si el sistema cierra la app o la pestaña en segundo plano, «#/seguir»
  // vuelve a esa misma sección y a su posición exacta (como mucho una escritura por segundo, y siempre al ocultarse la página)
  let tVista = 0;
  function anotarVista(y, a, inm, ya) {
    const hh = RP.actual || location.hash || "#/"; // RP.actual: la vista que se ve (al cambiar de dirección aún es la anterior)
    if (/^#\/(seguir|escudrina\/i\/)/.test(hh) || (!ya && performance.now() - tVista < 1000)) return;
    tVista = performance.now();
    store.set("vista", { h: hh, y: y | 0, a: a && !a.tope ? a : null, i: inm ? 1 : 0, t: Date.now() });
  }
  const anotarVistaYa = () => { if (!RP.guardar || !D) return; const y = Math.round(window.scrollY), a = document.querySelector("#vista .vl, #vista .vs, #vista .av") ? capturarAncla(true) : null; anotarVista(y, a, document.documentElement.classList.contains("inmersivo"), true); };
  document.addEventListener("visibilitychange", () => { if (document.hidden) anotarVistaYa(); });
  window.addEventListener("pagehide", anotarVistaYa);
  // El verso que se lee queda en «ultimo» (como mucho una vez por segundo): si el sistema recarga la página o la app
  // (Android las cierra en segundo plano), «#/seguir» vuelve exactamente a él
  let tUlt = 0;
  function anotarUltimo() {
    if (!esc.libro || !/^#\/[1-3A-Z]{3}\/\d+/.test(location.hash) || performance.now() - tUlt < 1000) return;
    tUlt = performance.now();
    const u = store.get("ultimo", null); if (!u || u.c !== esc.libro || u.cap !== esc.cap) return;
    const a = capturarAncla(false);
    if (a && !a.tope && a.v != null) { u.vt = a.v; u.fr = Math.round(a.frac * 1000) / 1000; u.of = Math.round(a.off); } else delete u.vt;
    u.t = Date.now(); store.set("ultimo", u);
  }
  // «#/seguir» (lo pide la inserción del sitio oficial tras una recarga, o la app instalada al abrirse): el último punto de lectura
  function resolverSeguir() {
    if (!/^#\/seguir\/?$/.test(location.hash || "")) return false;
    const u = store.get("ultimo", null), b = u && D && libroDe(u.c);
    // la última vista de cualquier sección, si es tan reciente como el último punto de lectura (o más)
    const V = store.get("vista", null);
    if (V && typeof V.h === "string" && /^#\//.test(V.h) && !/^#\/seguir/.test(V.h) && V.h.length < 300 && (+V.t || 0) >= ((u && +u.t) || 0) - 2000) {
      try { history.replaceState(history.state, "", urlHash(V.h)); } catch (e) { location.replace(urlHash(V.h)); return true; }
      if (V.a && V.a.v != null) RP.anclaSig = V.a; else if (V.y > 0) RP.forzar = V.y;
      return true;
    }
    const cap = b ? Math.max(1, Math.min(b.caps.length, +u.cap || 1)) : 0;
    const destino = b ? "#/" + b.c + "/" + cap + (u.m === "a" ? "/a" : "") : "#/";
    try { history.replaceState(history.state, "", urlHash(destino)); } catch (e) { location.replace(urlHash(destino)); return true; }
    if (b && u.vt) RP.anclaSig = { v: u.vt, frac: u.fr || 0, off: u.of || 0 };
    return true;
  }
  window.addEventListener("scroll", () => {
    if (!RP.objetivo && performance.now() - (RP.fin || 0) > 350) { RP.ultLinea = null; RP.ultNum = null; }
    if (!RP.guardar || RP.tg) return;
    RP.tg = setTimeout(() => { RP.tg = 0; anotarPos(); }, 140);
  }, { passive: true });
  // Ampliación del navegador en la computadora (Ctrl + rueda, Ctrl +/−, pellizco del panel táctil): cambia el ancho en px CSS
  // y el texto se reacomoda varias veces durante el gesto; al terminar, la lectura vuelve al mismo verso (nunca salta)
  let anchoVista = window.innerWidth, anclaZoom = null, tZoom = 0;
  window.addEventListener("resize", () => {
    if (Math.abs(window.innerWidth - anchoVista) < 2 || modal.open) { anchoVista = window.innerWidth; return; }
    if (!anclaZoom) { const u = RP.ultAncla; anclaZoom = { a: u && u.h === location.hash ? u.a : null, h: location.hash }; RP.guardar = false; }
    clearTimeout(tZoom);
    tZoom = setTimeout(() => { anchoVista = window.innerWidth; const z = anclaZoom; anclaZoom = null; RP.guardar = true; if (z && z.a && z.h === location.hash && RP.objetivo == null && !modal.open) volverAAncla(z.a); }, 180);
  }, { passive: true });
  // salto inmediato (sin el desplazamiento suave de la página)
  const saltarA = (y) => { try { window.scrollTo({ top: y, left: 0, behavior: "instant" }); } catch (e) { window.scrollTo(0, y); } };
  // PR #18 · Borde inferior real de barras pegadas arriba (solo cuenta .barra-hoja cuando realmente está pegada, nunca cuando va en flujo bajo bandaLibro)
  const bordeSup = () => {
    let y = 0;
    const hb = document.querySelector("header.barra");
    if (hb) { const r = hb.getBoundingClientRect(); if (r.height && r.bottom > 0 && r.top <= 4) y = Math.max(y, r.bottom); }
    const bh = document.querySelector(".barra-hoja");
    if (bh && bh.classList.contains("bh-pegada")) { const r = bh.getBoundingClientRect(); if (r.height && r.bottom > y) y = r.bottom; }
    return y;
  };
  // misma anchura, tamaño, letra, interlineado y disposición: la posición exacta sirve; si algo cambió, se vuelve al verso
  const firmaVista = () => [window.innerWidth, ap.tam, ap.letra, ap.inter, prefs.disp, prefs.nivel || ""].join("|");
  // abs: medida desde el borde de la ventana (para volver atrás: con la lectura inmersiva restituida, la vista es idéntica
  // aunque las barras estén a medio camino); sin abs, desde el borde inferior de las barras (cambios de modo, filtro, tamaño…)
  function capturarAncla(abs) {
    if (window.scrollY < 40) return { tope: true };
    const top = abs ? 0 : bordeSup() + 6;
    for (const el of document.querySelectorAll("#vista [id^='v']")) {
      if (!/^v\d+$/.test(el.id)) continue;
      const r = el.getBoundingClientRect();
      if (r.bottom <= top) continue;
      // texto continuo: si de este verso solo asoma la línea que comparte con el siguiente, el ancla es el siguiente
      const rs = el.getClientRects();
      if (rs.length > 1 && [...rs].filter((q) => q.bottom > top).length === 1) continue;
      return { v: +el.id.slice(1), frac: r.top < top && r.height ? (top - r.top) / r.height : 0, off: Math.max(0, r.top - top), abs: abs ? 1 : 0 };
    }
    return null;
  }
  const cifrasNum = (el) => {
    const n = el && (el.querySelector(":scope > .vn") || el.querySelector(":scope > sup")); if (!n) return null;
    const tn = [...n.childNodes].reverse().find((x) => x.nodeType === 3 && /\d/.test(x.nodeValue));
    if (!tn) return n.getBoundingClientRect();
    const rg = document.createRange(); rg.selectNodeContents(tn); const r = rg.getBoundingClientRect(); return r.height ? r : n.getBoundingClientRect();
  };
  // PR #18/#19 · Nodos de texto puro del verso (excluye <sup>, .vn y etiquetas auxiliares para evitar saltos por superíndices)
  function nodosTextoVerso(el) {
    if (!el) return [];
    const raiz = el.querySelector(".vtx") || el.querySelector(".vt") || el;
    const out = [];
    const tw = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT, {
      acceptNode(n) {
        if (!n.nodeValue || !n.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        const p = n.parentElement;
        if (p && p.closest("sup, .vn, .marca-et, .v-tag")) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });
    let cur;
    while ((cur = tw.nextNode())) out.push(cur);
    return out;
  }
  function lineasVerso(el) {
    if (!el) return [];
    const tns = nodosTextoVerso(el);
    if (!tns.length) return [];
    const rg = document.createRange();
    const out = [];
    for (let t = 0; t < tns.length; t++) {
      rg.selectNodeContents(tns[t]);
      const rs = rg.getClientRects();
      for (let i = 0; i < rs.length; i++) {
        const r = rs[i];
        if (r.width < 1.5 || r.height < 6) continue;
        const mid = (r.top + r.bottom) * 0.5;
        let g = null;
        for (let j = out.length - 1; j >= 0; j--) {
          if (Math.abs(out[j].mid - mid) < 9) { g = out[j]; break; }
        }
        if (!g) out.push({ top: r.top, bottom: r.bottom, maxH: r.height, mid });
        else if (r.height > g.maxH) { g.top = r.top; g.bottom = r.bottom; g.maxH = r.height; g.mid = mid; }
      }
    }
    out.sort((a, b) => a.top - b.top);
    return out;
  }
  function charOffsetDeLinea(el, targetTop) {
    const tns = nodosTextoVerso(el);
    if (!tns.length) return { charOff: 0, totChars: 1 };
    const rg = document.createRange();
    let acc = 0, hallado = -1;
    for (let t = 0; t < tns.length; t++) {
      const tn = tns[t], s = tn.nodeValue || "";
      if (hallado < 0) {
        rg.selectNodeContents(tn);
        const rAll = rg.getBoundingClientRect();
        if (rAll.bottom >= targetTop - 8 && rAll.top <= targetTop + 26) {
          let lo = 0, hi = s.length - 1;
          while (lo < hi) {
            const m = (lo + hi) >> 1;
            rg.setStart(tn, m); rg.setEnd(tn, Math.min(s.length, m + 1));
            const r = rg.getBoundingClientRect();
            if (r.height && r.top < targetTop - 7) lo = m + 1;
            else hi = m;
          }
          while (lo < s.length && /\s/.test(s[lo])) lo++;
          if (lo < s.length) hallado = acc + lo;
        }
      }
      acc += s.length;
    }
    return { charOff: Math.max(0, hallado < 0 ? 0 : hallado), totChars: Math.max(1, acc) };
  }
  function topDeCharOffset(el, charOff) {
    const tns = nodosTextoVerso(el);
    if (!tns.length) return null;
    const rg = document.createRange();
    let acc = 0;
    const meta = Math.max(0, charOff | 0);
    for (let t = 0; t < tns.length; t++) {
      const tn = tns[t], s = tn.nodeValue || "";
      if (meta < acc + s.length || t === tns.length - 1) {
        let idx = Math.max(0, Math.min(s.length - 1, meta - acc));
        while (idx < s.length - 1 && /\s/.test(s[idx])) idx++;
        while (idx > 0 && /\s/.test(s[idx])) idx--;
        rg.setStart(tn, idx); rg.setEnd(tn, Math.min(s.length, idx + 1));
        const r = rg.getBoundingClientRect();
        if (r && r.height >= 4) return r.top;
      }
      acc += s.length;
    }
    return null;
  }
  // PR #18/#19 · Coincidencia exacta línea por línea entre Lectura ↔ Textual y Por versos ↔ Continuo (0 px de deriva en ida y vuelta)
  function capturarAnclaLinea() {
    if (window.scrollY <= 2) return { tope: true };
    const top = bordeSup() + 4, ref = top + (window.innerHeight - top) * 0.38;
    const fija = (a, elRef) => {
      const co = a.charOff != null ? { charOff: a.charOff, totChars: a.totChars || 1 } : (elRef ? charOffsetDeLinea(elRef, a.lineTop) : { charOff: 0, totChars: 1 });
      const out = Object.assign({}, a, { charOff: co.charOff, totChars: co.totChars, disp: prefs.disp, lorg: !!prefs.lorg });
      RP.ultLinea = { v: out.v, k: out.k, total: out.total, lineTop: out.lineTop, charOff: out.charOff, totChars: out.totChars, disp: out.disp, lorg: out.lorg };
      if (navigator.webdriver) window.__biexAnclaNum = out;
      return out;
    };
    // Cuando el encabezado del capítulo sigue a la vista arriba, se clava el renglón inicial del primer verso visible (0 px de sobresalto arriba)
    const enc = document.querySelector("#vista .encab");
    if (enc && enc.getBoundingClientRect().bottom > top + 4) {
      const p1 = document.querySelector("#vista [id^='v']");
      const ls1 = p1 && /^v\d+$/.test(p1.id) ? lineasVerso(p1) : [];
      if (ls1.length) return fija({ v: +p1.id.slice(1), k: 0, total: ls1.length, lineTop: ls1[0].top, charOff: 0, abs: 1, frac: 0, off: 0 }, p1);
    }
    if (RP.ultLinea) {
      const eu = document.getElementById("v" + RP.ultLinea.v), ls = eu ? lineasVerso(eu) : [];
      if (ls.length) {
        const tChar = RP.ultLinea.charOff != null ? topDeCharOffset(eu, RP.ultLinea.charOff) : null;
        if (tChar != null && Math.abs(tChar - RP.ultLinea.lineTop) < 3) {
          let bk = 0, bd = Infinity;
          for (let i = 0; i < ls.length; i++) { const d = Math.abs(ls[i].top - tChar); if (d < bd) { bd = d; bk = i; } }
          return fija({ v: RP.ultLinea.v, k: bk, total: ls.length, lineTop: RP.ultLinea.lineTop, charOff: RP.ultLinea.charOff, totChars: RP.ultLinea.totChars, abs: 1, frac: 0, off: 0 }, eu);
        }
        let bk = 0, bd = Infinity;
        for (let i = 0; i < ls.length; i++) { const d = Math.abs(ls[i].top - RP.ultLinea.lineTop); if (d < bd) { bd = d; bk = i; } }
        if (bd < 2.5) return fija({ v: RP.ultLinea.v, k: bk, total: ls.length, lineTop: RP.ultLinea.lineTop, abs: 1, frac: 0, off: 0 }, eu);
      }
    }
    try {
      const va = window.BiExJuego && BiExJuego.versoActivo && BiExJuego.versoActivo();
      const ea = va && document.getElementById("v" + va), lsa = ea ? lineasVerso(ea) : [];
      const visA = lsa.map((l, idx) => ({ l, idx })).filter((x) => x.l.bottom > top && x.l.top < window.innerHeight - 16);
      if (visA.length) {
        visA.sort((a, b) => Math.abs(a.l.top - ref) - Math.abs(b.l.top - ref));
        return fija({ v: va, k: visA[0].idx, total: lsa.length, lineTop: visA[0].l.top, abs: 1, frac: 0, off: 0 }, ea);
      }
    } catch (e) { /* sin juego */ }
    let mejor = null, mejorEl = null, dm = Infinity;
    for (const el of document.querySelectorAll("#vista [id^='v']")) {
      if (!/^v\d+$/.test(el.id)) continue;
      const r0 = el.getBoundingClientRect();
      if (r0.bottom <= top || r0.top >= window.innerHeight - 12) continue;
      const ls = lineasVerso(el);
      for (let i = 0; i < ls.length; i++) {
        if (ls[i].bottom <= top || ls[i].top >= window.innerHeight - 12) continue;
        const d = Math.abs(ls[i].top - ref);
        if (d < dm) { dm = d; mejorEl = el; mejor = { v: +el.id.slice(1), k: i, total: ls.length, lineTop: ls[i].top, abs: 1, frac: 0, off: 0 }; }
      }
    }
    return mejor ? fija(mejor, mejorEl) : capturarAncla(true);
  }
  function capturarAnclaNum() { return capturarAnclaLinea(); }
  function yDeAncla(a) {
    if (a && a.lineTop != null) {
      const el = document.getElementById("v" + a.v);
      if (el) {
        for (let n = el, acc = 0; n && acc < window.innerHeight * 1.6; n = n.previousElementSibling) { n.classList.add("cv-vis"); acc += n.getBoundingClientRect().height; }
        if (el.nextElementSibling) el.nextElementSibling.classList.add("cv-vis");
        // Misma traducción cambiando disposición (Por versos ↔ Continuo): ancla por posición exacta del carácter (0 px de desajuste)
        if (a.charOff != null && a.lorg === !!prefs.lorg) {
          const tC = topDeCharOffset(el, a.charOff);
          if (tC != null) return Math.max(0, window.scrollY + tC - a.lineTop);
        }
        const ls = lineasVerso(el);
        if (ls.length) {
          const k2 = a.total > 1 ? Math.min(ls.length - 1, Math.round((a.k / Math.max(1, a.total - 1)) * (ls.length - 1))) : 0;
          return Math.max(0, window.scrollY + ls[k2].top - a.lineTop);
        }
      }
    }
    if (a && a.num != null) {
      const el = document.getElementById("v" + a.v);
      if (el) {
        for (let n = el, acc = 0; n && acc < window.innerHeight * 1.6; n = n.previousElementSibling) { n.classList.add("cv-vis"); acc += n.getBoundingClientRect().height; }
        if (el.nextElementSibling) el.nextElementSibling.classList.add("cv-vis");
        const r = cifrasNum(el); if (r) return Math.max(0, window.scrollY + r.top - a.num);
      }
    }
    let el = document.getElementById("v" + a.v), exacto = true;
    if (!el) { exacto = false; for (const x of document.querySelectorAll("#vista [id^='v']")) if (/^v\d+$/.test(x.id) && +x.id.slice(1) >= a.v) { el = x; break; } }
    if (!el) return null;
    // el verso y lo que tiene encima en pantalla se dibujan ya (con «content-visibility» seguirían en su tamaño estimado y
    // al aparecer empujarían el verso hacia abajo)
    for (let n = el, acc = 0; n && acc < window.innerHeight * 1.6; n = n.previousElementSibling) { n.classList.add("cv-vis"); acc += n.getBoundingClientRect().height; }
    if (el.nextElementSibling) el.nextElementSibling.classList.add("cv-vis");
    const r = el.getBoundingClientRect(), top = a.abs ? 0 : bordeSup() + 6;
    return Math.max(0, window.scrollY + r.top - top + (exacto ? a.frac * r.height - a.off : 0));
  }
  function volverAAncla(a) {
    if (!a) return;
    if (a.tope) { saltarA(0); return; }
    RP.ancla = a; RP.guardar = false; RP.objetivo = 1;
    clearTimeout(RP.t); RP.t = setTimeout(terminarRestauracion, 5000);
    requestAnimationFrame(() => intentarRestaurar());
  }
  // Tras cambiar el filtro: si el verso que se leía (o uno posterior) sigue a la vista, se vuelve a él; si quedó oculto,
  // la barra del capítulo se queda fija donde estaba y el resultado aparece debajo (nunca se salta al comienzo de la página)
  // (7-nov-2026) al pasar entre Lectura/Orden y Análisis se llega al COMIENZO del verso que se estaba leyendo (si ya iba
  // pasado en más de la mitad, al siguiente): en el Análisis cada verso es largo y caer a media ficha desorienta
  function anclaInicioVerso() {
    const a = capturarAncla(); if (!a || a.tope || a.v == null) return a;
    if (a.frac > 0.55) { const sig = [...document.querySelectorAll("#vista [id^='v']")].find((x) => /^v\d+$/.test(x.id) && +x.id.slice(1) > a.v); if (sig) return { v: +sig.id.slice(1), frac: 0, off: 0 }; }
    return { v: a.v, frac: 0, off: a.frac > 0 ? 0 : a.off };
  }
  // el ancla de un cambio en el sitio se aplica en el mismo cuadro en que se pone el texto nuevo (nada se ve saltar)
  // (el salto es del lector: no cuenta como lectura para ocultar las barras; y la posición se sostiene mientras la página
  // termina de acomodarse, como en cualquier restauración)
  function aplicarAnclaEnSitio(a) {
    if (!a) return;
    RP.fin = performance.now();
    if (a.tope) { saltarA(0); return; }
    const hay = a.v != null && [...document.querySelectorAll("#vista [id^='v']")].some((x) => /^v\d+$/.test(x.id) && +x.id.slice(1) >= a.v);
    if (hay) { const y = yDeAncla(a); if (y != null) saltarA(y); volverAAncla(a); return; }
    if (!a.barra) return;
    const bh = $(".barra-hoja"), hoja = $(".hoja"); if (!bh || !hoja) return;
    saltarA(Math.max(0, Math.round(window.scrollY + hoja.getBoundingClientRect().top - (parseFloat(getComputedStyle(bh).top) || 0))));
  }
  // fundido corto solo del texto (la barra del capítulo no se mueve ni parpadea); por el compositor (opacidad)
  function fundirTexto() {
    if (document.documentElement.dataset.mov === "no" || (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches)) return;
    const hoja = $(".hoja", vista()); if (!hoja || !hoja.animate) return;
    for (const el of hoja.children) if (!el.matches(".barra-hoja, .bh-centinela")) el.animate([{ opacity: 0.25 }, { opacity: 1 }], { duration: 220, easing: "ease-out" });
  }
  function volverAAnclaOBarra(a) {
    if (a && a.tope) { saltarA(0); return; }
    const hay = a && a.v != null && [...document.querySelectorAll("#vista [id^='v']")].some((x) => /^v\d+$/.test(x.id) && +x.id.slice(1) >= a.v);
    if (hay) { volverAAncla(a); return; }
    const bh = $(".barra-hoja"), hoja = $(".hoja"); if (!bh || !hoja) return;
    saltarA(Math.max(0, Math.round(window.scrollY + hoja.getBoundingClientRect().top - (parseFloat(getComputedStyle(bh).top) || 0))));
  }
  function terminarRestauracion() { if (RP.inm != null && fijarInmersivo) fijarInmersivo(RP.inm); RP.inm = null; velar(false); RP.fin = performance.now(); RP.ancla = null; RP.objetivo = null; RP.guardar = true; clearTimeout(RP.t); clearTimeout(RP.ts); document.documentElement.classList.remove("restaurando"); }
  // se aplica la posición y se sostiene mientras la página siga acomodándose (datos, letras, imágenes); termina cuando lleva
  // un momento quieta, cuando la persona toca o desplaza, o a los pocos segundos
  function intentarRestaurar() {
    if (RP.objetivo == null) return false;
    document.documentElement.classList.add("restaurando");
    if (RP.ancla) {
      const ya = yDeAncla(RP.ancla);
      if (ya == null) return true; // el verso aún no está en la página: se reintenta cuando crezca
      RP.objetivo = ya;
    }
    const y = RP.objetivo, max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    if (RP.inm != null && fijarInmersivo) fijarInmersivo(RP.inm);
    saltarA(Math.min(y, max));
    if (RP.ancla || max >= y - 2) requestAnimationFrame(() => velar(false));
    if (max >= y - 2) { clearTimeout(RP.ts); RP.ts = setTimeout(() => { if (RP.ancla) { const yb = yDeAncla(RP.ancla); if (yb != null) saltarA(yb); terminarRestauracion(); } else if (RP.objetivo === y) { saltarA(y); terminarRestauracion(); } }, 650); }
    return true;
  }
  // el contenido llega por partes (datos, fuentes): mientras haya una posición pendiente, cada crecimiento de la página la reintenta
  if (window.ResizeObserver) { const ro = new ResizeObserver(() => { if (RP.objetivo != null) intentarRestaurar(); }); ro.observe(document.documentElement); if (document.body) ro.observe(document.body); }
  for (const ev of ["wheel", "touchstart", "keydown"]) window.addEventListener(ev, () => { if (RP.objetivo != null) terminarRestauracion(); }, { passive: true });
  // llamado al cambiar de dirección: decide si la nueva vista se restaura o empieza arriba
  function prepararPos() {
    if (RP.clave && RP.guardar) { clearTimeout(RP.tg); RP.tg = 0; anotarPos(); }
    RP.previa = RP.actual; RP.actual = location.hash || "#/";
    const conocida = claveActual();
    pasoAdelante(!conocida);
    const ic = RP.inicioCap; RP.inicioCap = null;
    if (ic) { RP.irInicio = ic; RP.anclaSig = null; RP.ancla = null; RP.enSitio = false; RP.objetivo = null; RP.inm = null; RP.guardar = true; clearTimeout(RP.t); return; }
    let y = null;
    const ancla = RP.anclaSig; RP.anclaSig = null; RP.ancla = null;
    const enSitio = RP.enSitio; RP.enSitio = false;
    const citaDirecta = !conocida && /^#\/[1-3A-Z]{3}\/\d+\/[loa]\/\d+/.test(RP.actual);
    if (enSitio && ancla) { RP.anclaEnSitio = ancla; RP.objetivo = null; RP.inm = null; RP.guardar = true; clearTimeout(RP.t); return; }
    if (citaDirecta) { RP.objetivo = null; RP.inm = null; RP.guardar = true; clearTimeout(RP.t); return; }
    if (ancla && !ancla.tope) { RP.ancla = ancla; y = 1; }
    else if (RP.forzar != null) { y = RP.forzar; RP.forzar = null; }
    else if (conocida && POS[RP.clave] != null) { const g = POS[RP.clave]; if (g && typeof g === "object") { y = g.y || 1; if (g.a) RP.ancla = g.a; RP.inm = !!g.i; } else { y = g; RP.inm = false; } }
    RP.objetivo = y && y > 0 ? y : null;
    if (RP.objetivo == null) RP.inm = null;
    RP.guardar = RP.objetivo == null;
    clearTimeout(RP.t);
    if (RP.objetivo != null) { RP.t = setTimeout(terminarRestauracion, 5000); velar(true); }
  }
  // velo de la vuelta: la vista aparece cuando ya está exactamente donde se dejó (como mucho 900 ms)
  let tVelo = 0;
  // (R10, BiEx 12-nov-2026: parpadeo al volver a la app instalada) al levantarse, la vista entra con un fundido breve
  // (solo opacidad) en vez de aparecer de golpe
  // (BiEx, 15-nov-2026: «parpadeo al volver y entre vistas») el velo solo oculta la vista si la vuelta tarda más de 90 ms (CSS:
  // la opacidad cambia con ese retraso); cuando la posición queda lista antes, la vista nunca se oculta ni vuelve a entrar.
  let veloDesde = 0;
  function velar(si) {
    clearTimeout(tVelo);
    const r = document.documentElement, antes = r.classList.contains("volviendo");
    if (si && !antes) veloDesde = performance.now();
    r.classList.toggle("volviendo", !!si);
    if (si) tVelo = setTimeout(() => velar(false), 900);
    else if (antes && performance.now() - veloDesde > 90 && !modal.open && !(performance.now() - (M.reabierta || -1e9) < 800)) { r.classList.add("aparece"); setTimeout(() => r.classList.remove("aparece"), 280); }
  }
  const restaurando = () => RP.objetivo != null;
  // arriba del todo, salvo que se esté volviendo a una posición guardada
  function alTope() { if (!intentarRestaurar()) saltarA(0); }
  // título del libro → lista de libros, exactamente donde se dejó
  function irALista(e) {
    if (!MEMLIB) return;
    if (RP.previa === MEMLIB.h && pasosApp > 0) { e.preventDefault(); history.back(); return; }
    RP.forzar = MEMLIB.y;
    if (MEMLIB.h !== (e.currentTarget.getAttribute("href") || "")) { e.preventDefault(); location.hash = MEMLIB.h; }
  }

  // ------------------------------------------------------------------ menús desplegables
  // Cada <select> se presenta con un botón y una lista propia de cristal esmerilado; el <select> sigue debajo (valor,
  // cambios y formularios), de modo que todo lo demás funciona igual.
  let menuAbierto = null;
  function cerrarMenu(volverFoco) {
    if (!menuAbierto) return;
    const m = menuAbierto; menuAbierto = null;
    m.pop.classList.add("sale"); m.btn.setAttribute("aria-expanded", "false");
    setTimeout(() => m.pop.remove(), 140);
    if (volverFoco) m.btn.focus({ preventScroll: true });
  }
  function abrirMenu(sel, btn) {
    if (menuAbierto && menuAbierto.sel === sel) { cerrarMenu(true); return; }
    cerrarMenu(false);
    const ops = [...sel.options].filter((o) => !o.hidden);
    const pop = h("div", { class: "mm-pop", role: "listbox", "aria-label": sel.getAttribute("aria-label") || "Opciones", tabindex: "-1" });
    const elegir = (o) => { if (sel.value !== o.value) { sel.value = o.value; sel.dispatchEvent(new Event("change", { bubbles: true })); } etiquetaMenu(sel, btn); cerrarMenu(true); };
    ops.forEach((o) => pop.append(h("button", { type: "button", class: "mm-op", role: "option", "aria-selected": String(o.value === sel.value), disabled: o.disabled || null, onclick: () => elegir(o) },
      h("span", { text: o.textContent }), svg(ICO.marca))));
    (btn.closest("dialog") || document.body).append(pop);
    const r = btn.getBoundingClientRect(), vw = window.innerWidth, vh = window.innerHeight;
    const ancho = Math.min(vw - 16, Math.max(r.width, 220));
    pop.style.minWidth = ancho + "px"; pop.style.maxWidth = Math.min(vw - 16, 420) + "px";
    const abajo = vh - r.bottom - 12, arriba = r.top - 12, haciaArriba = abajo < 220 && arriba > abajo;
    pop.style.maxHeight = Math.max(160, Math.min(440, haciaArriba ? arriba : abajo)) + "px";
    pop.style.left = Math.max(8, Math.min(r.left, vw - 8 - Math.min(pop.offsetWidth || ancho, vw - 16))) + "px";
    if (haciaArriba) { pop.style.bottom = (vh - r.top + 6) + "px"; pop.classList.add("arriba"); } else pop.style.top = Math.max(8, r.bottom + 6) + "px";
    btn.setAttribute("aria-expanded", "true");
    menuAbierto = { sel, btn, pop };
    const actual = pop.querySelector('[aria-selected="true"]') || pop.querySelector(".mm-op");
    // la opción elegida se muestra desplazando solo la lista (scrollIntoView movía la página si la barra estaba entrando)
    if (actual) { if (actual.offsetTop + actual.offsetHeight > pop.clientHeight) pop.scrollTop = actual.offsetTop - (pop.clientHeight - actual.offsetHeight) / 2; actual.focus({ preventScroll: true }); }
    pop.addEventListener("keydown", (e) => {
      const bs = [...pop.querySelectorAll(".mm-op:not(:disabled)")], i = bs.indexOf(document.activeElement);
      if (e.key === "ArrowDown") { e.preventDefault(); (bs[i + 1] || bs[0]).focus(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); (bs[i - 1] || bs[bs.length - 1]).focus(); }
      else if (e.key === "Home") { e.preventDefault(); bs[0].focus(); }
      else if (e.key === "End") { e.preventDefault(); bs[bs.length - 1].focus(); }
      else if (e.key === "Escape" || e.key === "Tab") { e.preventDefault(); e.stopPropagation(); cerrarMenu(true); }
    });
  }
  function etiquetaMenu(sel, btn) {
    const o = sel.options[sel.selectedIndex];
    btn.querySelector(".mm-tx").textContent = o ? (o.dataset.corto || o.textContent) : "";
    btn.hidden = sel.hidden;
    btn.disabled = sel.disabled;
  }
  function menuModerno(sel) {
    if (sel.dataset.mm || sel.multiple || sel.size > 1) return;
    sel.dataset.mm = "1";
    const btn = h("button", { type: "button", class: "mm-btn " + (sel.className || ""), "aria-haspopup": "listbox", "aria-expanded": "false", "aria-label": sel.getAttribute("aria-label") || null },
      h("span", { class: "mm-tx" }), svg(ICO.abajo));
    btn.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); abrirMenu(sel, btn); });
    btn.addEventListener("keydown", (e) => { if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); abrirMenu(sel, btn); } });
    sel.classList.add("mm-nativo"); sel.tabIndex = -1; sel.setAttribute("aria-hidden", "true");
    sel.after(btn);
    sel.addEventListener("change", () => etiquetaMenu(sel, btn));
    new MutationObserver(() => etiquetaMenu(sel, btn)).observe(sel, { attributes: true, childList: true, subtree: true });
    etiquetaMenu(sel, btn);
  }
  new MutationObserver((ms) => { for (const m of ms) for (const n of m.addedNodes) if (n.nodeType === 1) { if (n.tagName === "SELECT") menuModerno(n); else if (n.querySelectorAll) n.querySelectorAll("select").forEach(menuModerno); } })
    .observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener("pointerdown", (e) => { if (menuAbierto && !menuAbierto.pop.contains(e.target) && !menuAbierto.btn.contains(e.target)) cerrarMenu(false); }, true);
  window.addEventListener("resize", () => cerrarMenu(false));
  window.addEventListener("scroll", (e) => { if (menuAbierto && !menuAbierto.pop.contains(e.target)) cerrarMenu(false); }, true);

  // ------------------------------------------------------------------ ventana (diálogo modal)
  // AC15 (BiEx, 15-nov-2026): con «closedby=none» el gesto de volver de Android ya no cierra la ventana entera (la vigilancia de
  // cierre del navegador la cerraba y el lector deshacía todos sus pasos: se caía al verso base). Ahora ese gesto es un «atrás»
  // normal del historial y la ventana retrocede un paso, a la vista exacta de antes; Esc la cierra por el teclado (abajo).
  const modal = h("dialog", { class: "modal", "aria-label": "Detalle", closedby: "none" });
  // Cada ventana (y cada paso dentro de ella) deja un paso en el historial: el botón atrás del teléfono o del navegador
  // vuelve un paso o cierra la ventana, igual que ×, Esc, tocar fuera o deslizar hacia abajo la cabecera.
  const M = { pila: [], nav: null, alCerrar: null, estados: 0, saltando: false, destino: null, porHistoria: false, porRuta: false, fwd: [], encima: false, cortar: false };
  modal.addEventListener("click", (e) => { if (e.target === modal) cerrarModal(); });
  // Memoria de cada ventana: dónde quedó su desplazamiento (por título) y, si se salió de ella por un enlace,
  // la ventana entera, para reabrirla igual al volver atrás
  const MS = (() => { try { return JSON.parse(sessionStorage.getItem("biex:ms") || "{}"); } catch (e) { return {}; } })();
  // vid: número de cada paso de ventana en el historial; empieza en un valor nuevo en cada carga (sin choques tras recargar)
  const VENT = new Map(); let vidN = Date.now() % 1e9;
  const claveM = () => { const t = $(".m-tit b", modal); return t ? t.textContent : ""; };
  function guardarScrollM() {
    const c = $(".m-cuerpo", modal), k = claveM(); if (!c || !k || !modal.open || !c.clientHeight) return;
    MS[k] = Math.round(c.scrollTop);
    try { sessionStorage.setItem("biex:ms", JSON.stringify(MS)); } catch (e) { /* sin almacenamiento */ }
  }
  let tScrollM = 0, toqueM = 0;
  modal.addEventListener("scroll", () => { if (!tScrollM) tScrollM = setTimeout(() => { tScrollM = 0; guardarScrollM(); }, 150); }, true);
  // (7-nov-2026) también el teclado y el puntero (barra de desplazamiento, clic): la posición recordada nunca se impone a quien ya se mueve
  for (const ev of ["touchstart", "wheel", "keydown", "pointerdown"]) modal.addEventListener(ev, () => { toqueM = performance.now(); }, { passive: true, capture: true });
  function restaurarScrollM() {
    const k = claveM(), y = MS[k]; if (!y) return;
    const t0 = performance.now();
    // (7-nov-2026) si la ventana se abrió para estudiar una palabra tocada, manda la palabra centrada sobre la posición recordada
    const intento = () => { const c = $(".m-cuerpo", modal); if (!c || claveM() !== k || toqueM > t0 || performance.now() - (M.centrada || -1e9) < 2500) return; c.scrollTop = y; };
    intento(); requestAnimationFrame(intento); for (const ms of [120, 350, 800, 1500]) setTimeout(intento, ms);
  }
  modal.addEventListener("close", () => {
    if (modal.open) return;
    M.cerradaEn = performance.now();
    document.documentElement.classList.remove("con-modal", "teclado-abierto");
    document.documentElement.style.removeProperty("--vvh");
    document.documentElement.style.removeProperty("--vvt");
    const noG = M.noGuardar; M.noGuardar = false;
    // al salir por un enlace (Atrás la reabre) o con «atrás» (Adelante la reabre) la ventana se guarda tal como estaba
    if (!noG && M.porRuta && M.vid && M.pila.length) VENT.set(M.vid, { pila: M.pila.slice(), estados: M.estados, fwd: M.fwd.slice() });
    else if (!noG && M.porHistoria && M.vid && M.pila.length) VENT.set(M.vid, { pila: M.pila.slice(), estados: 1, fwd: M.fwd.slice() });
    M.pila = []; M.nav = null; M.fwd = [];
    const f = M.alCerrar; M.alCerrar = null;
    if (f) f();
    if (M.estados > 0 && !M.porHistoria && !M.porRuta) {
      // cerrada con ×, Esc o tocando fuera: sus pasos del historial quedan atrás y «Adelante» no los ofrece (M.cortar)
      const n = M.estados; M.estados = 0; M.destino = location.href; M.saltando = true; M.cortar = true;
      // (BiEx, 15-nov-2026: «parpadeo al cerrar con la X, no con el gesto de atrás») si la ventana había anotado su verso en la
      // dirección (#/LIB/cap/l/v), al volver los pasos el navegador avisaba un cambio de dirección y la ruta volvía a dibujar el
      // capítulo con su velo. La vista ya es la correcta: ese aviso se ignora (M.sinRuta).
      M.sinRuta = { url: M.destino, hasta: performance.now() + 1500 };
      try { history.go(-n); } catch (e) { M.saltando = false; M.cortar = false; M.sinRuta = null; }
    } else {
      // Neon (23-nov-2026): al cerrar una ventana de verso/palabra con el gesto Atrás sobre el mismo capítulo y modo ya
      // dibujados, el hashchange residual (#/LIB/cap/l/v → #/LIB/cap) no debe activar el velo de 900 ms ni redibujar la vista.
      if (M.porHistoria && esc.libro && esc.cap) {
        const mh = /^#\/([1-3A-Z]{3})\/(\d+)(?:\/([alo]))?/.exec(location.hash || "");
        const mHash = mh && mh[3] === "a" ? "a" : "l";
        if (mh && mh[1] === esc.libro && +mh[2] === esc.cap && mHash === esc.modo) M.sinRuta = { url: location.href, hasta: performance.now() + 800 };
      }
      M.estados = 0;
    }
    M.porHistoria = false;
    const porRuta = M.porRuta; M.porRuta = false;
    const pend = M.rutaPend; M.rutaPend = null;
    if (pend && !porRuta && pend !== rutaVista) mostrarRuta(pend);
    repintarAdelante();
  });
  // Neon (23, 24 y 25-nov-2026): al salir de una ventana (Biblioteca, Verso, Tu faro) hacia otra ruta, guarda primero la posición
  // exacta actual y reemplaza EN SU LUGAR la entrada temporal de la ventana con la ruta nueva (sin hacer history.go(-1) + hashchange
  // que competía en Chrome Android y en marcos incrustados). Así la entrada inmediatamente anterior queda intacta y el gesto «Atrás»
  // regresa siempre al píxel exacto de la vista previa.
  let ultHrefEnrutado = "";
  function irDesdeModal(accion) {
    anotarPos();
    M.sinRuta = null; M.cortar = false;
    const navegarEnSitio = (dest) => {
      const hh = String(dest || "");
      const actualH = location.hash || "#/";
      if (hh && hh === actualH) {
        try { history.replaceState({ bx: RP.clave }, "", location.href); } catch (e) {}
        return;
      }
      try {
        history.replaceState({ bx: nuevaClave() }, "", urlHash(hh));
      } catch (e) {
        location.hash = hh;
        return;
      }
      ultHrefEnrutado = location.href;
      pasosApp++;
      resolverSeguir();
      prepararPos();
      enrutar();
    };
    const ejecutar = () => {
      if (typeof accion === "function") { accion(); return; }
      const dest = String(accion || "");
      if (dest && location.hash === dest) { prepararPos(); enrutar(); }
      else location.hash = dest;
    };
    if (!modal.open || M.estados <= 0) {
      if (modal.open) { M.porRuta = true; M.noGuardar = true; M.alCerrar = null; cerrarModal(); }
      ejecutar();
      return;
    }
    const n = M.estados;
    M.porRuta = true; M.noGuardar = true; M.alCerrar = null; M.estados = 0; M.fwd = [];
    modal.classList.add("sin-entrada");
    cerrarModal();
    setTimeout(() => modal.classList.remove("sin-entrada"), 80);
    // Caso principal (Biblioteca, Verso, Tu faro: n === 1): reemplazar la propia entrada de la ventana in-situ.
    // La entrada [0] (vista previa exacta con su clave bx y desplazamiento guardado) jamás se toca.
    if (n === 1 && typeof accion === "string") {
      navegarEnSitio(accion);
      return;
    }
    // Ventanas con varios niveles (p. ej. Biblioteca → Libro → Capítulo): desenrollar solo n-1 pasos hasta la entrada [1]
    // y reemplazar esa entrada in-situ con el destino final.
    const retro = typeof accion === "string" ? n - 1 : n;
    if (retro <= 0) { navegarEnSitio(accion); return; }
    M.saltando = true; M.cortar = true; M.destino = null;
    M.sinRuta = { cualquiera: true, url: location.href, hasta: performance.now() + 950 };
    let hecho = false;
    const irAhora = () => {
      if (hecho) return; hecho = true;
      M.saltando = false; M.irTrasSalto = null;
      setTimeout(() => {
        M.sinRuta = null;
        if (typeof accion === "string") navegarEnSitio(accion);
        else ejecutar();
      }, 0);
    };
    M.irTrasSalto = irAhora;
    try { history.go(-retro); setTimeout(irAhora, 420); } catch (e) { irAhora(); }
  }
  // Neon › Argon (23-nov-2026): sincroniza la ventana abierta con el teclado virtual en teléfonos (visualViewport) sin sobresaltos:
  // ancla la posición visual de .mk-nota cuando cargan bloques asíncronos arriba y alinea una sola vez al asentarse el teclado.
  function enfocarEnModal(el, soloSiFuera) {
    const mc = $(".m-cuerpo", modal);
    if (!el || !mc || !el.isConnected) return;
    const rm = mc.getBoundingClientRect(), re = el.getBoundingClientRect();
    if (soloSiFuera && re.top >= rm.top + 10 && re.bottom <= rm.bottom - 10) return;
    const objetivo = mc.scrollTop + (re.top - rm.top) - Math.max(18, Math.round((rm.height - Math.min(re.height, rm.height * 0.65)) * 0.42));
    mc.scrollTop = Math.max(0, objetivo);
  }
  function conAnclaEnModal(fnMutacion) {
    const mc = modal.open ? $(".m-cuerpo", modal) : null;
    const n = mc ? $(".mk-nota", mc) : null;
    const anclar = !!(n && n.isConnected && (document.activeElement === n || performance.now() < (M.anclaNota || 0)));
    const y0 = anclar ? n.getBoundingClientRect().top : 0;
    fnMutacion();
    if (anclar && n.isConnected) {
      const dy = n.getBoundingClientRect().top - y0;
      if (Math.abs(dy) > 0.5) mc.scrollTop = Math.max(0, mc.scrollTop + dy);
    }
  }
  function irANotaEnModal() {
    const n = $(".modal[open] .mk-nota");
    if (!n) return;
    M.centrada = performance.now();
    M.anclaNota = performance.now() + 2600;
    enfocarEnModal(n, false);
    try { n.focus({ preventScroll: true }); } catch (e) { n.focus(); }
  }
  if (window.visualViewport) {
    let vvAbierto = false, tVV = 0;
    const syncVV = (esResize) => {
      const r = document.documentElement;
      if (!modal.open || window.innerWidth > 760) {
        vvAbierto = false;
        clearTimeout(tVV); tVV = 0;
        if (r.classList.contains("teclado-abierto")) { r.classList.remove("teclado-abierto"); r.style.removeProperty("--vvh"); r.style.removeProperty("--vvt"); }
        return;
      }
      const vv = window.visualViewport, abierto = vv.height < window.innerHeight - 90;
      const recien = abierto && !vvAbierto;
      vvAbierto = abierto;
      r.classList.toggle("teclado-abierto", abierto);
      if (abierto) {
        r.style.setProperty("--vvh", Math.max(220, Math.round(vv.height)) + "px");
        r.style.setProperty("--vvt", Math.max(0, Math.round(vv.offsetTop)) + "px");
        if (recien || esResize) {
          clearTimeout(tVV);
          tVV = setTimeout(() => {
            tVV = 0;
            if (!modal.open) return;
            const ae = document.activeElement;
            if (ae && /^(INPUT|TEXTAREA)$/.test(ae.tagName) && modal.contains(ae)) enfocarEnModal(ae, true);
          }, 95);
        }
      } else {
        clearTimeout(tVV); tVV = 0;
        r.style.removeProperty("--vvh"); r.style.removeProperty("--vvt");
      }
    };
    window.visualViewport.addEventListener("resize", () => syncVV(true));
    window.visualViewport.addEventListener("scroll", () => syncVV(false));
  }
  function marcarPaso() { try { const vid = ++vidN; history.pushState(Object.assign({}, history.state || {}, { biexVentana: 1, vid }), "", location.href); M.estados++; M.vid = vid; pasoAdelante(true); } catch (e) { /* sin historial (marco sin permiso) */ } }
  window.addEventListener("popstate", (e) => {
    if (M.saltando) {
      M.saltando = false;
      if (M.irTrasSalto) { const fn = M.irTrasSalto; M.irTrasSalto = null; fn(); return; }
      if (M.destino && M.destino !== location.href) { try { history.replaceState(history.state, "", M.destino); } catch (er) { /* ignorar */ } }
      M.destino = null;
      return;
    }
    if (modal.open && !e.state) return; // enlace seguido desde la ventana (paso nuevo, sin estado): lo atiende la ruta
    if (modal.open) {
      const f = M.fwd[M.fwd.length - 1];
      if (e.state && f && e.state.vid === f.vid) { M.fwd.pop(); M.pila.push(f.fn); M.vid = f.vid; M.estados++; pintarModal(); return; } // Adelante
      if (M.estados > 0) M.estados--;
      if (M.pila.length > 1) { M.fwd.push({ fn: M.pila.pop(), vid: M.vid }); M.vid = e.state && e.state.vid; pintarModal(); return; }
      M.porHistoria = true; cerrarModal(); return;
    }
    // un paso de una ventana cerrada al seguir un enlace desde ella: se reabre tal como estaba; si no se conoce, se salta
    if (e.state && e.state.biexVentana) {
      const g = VENT.get(e.state.vid);
      if (g) {
        M.pila = g.pila.slice(); M.estados = g.estados; M.fwd = (g.fwd || []).slice(); M.vid = e.state.vid; M.reabierta = performance.now();
        pintarModal();
        // AL10 + Neon (23-nov-2026): al volver atrás a una ventana (p. ej., Buscar o Herramientas) aparece ya puesta sin
        // animación ni transición @supports(overlay:auto) para eliminar por completo el doble parpadeo
        modal.classList.add("sin-entrada");
        try { modal.showModal(); } catch (er) { modal.setAttribute("open", ""); }
        void modal.offsetWidth;
        setTimeout(() => modal.classList.remove("sin-entrada"), 260);
        document.documentElement.classList.add("con-modal");
        return;
      }
      try { history.back(); } catch (er) { /* ignorar */ }
      return;
    }
    // PR #20 · Respaldo infalible de «Atrás» en móviles (Chrome/Vivaldi Android e iOS): si popstate llega tras pushState+replaceState
    // (p. ej. al volver desde Mesa sinóptica, Constelación, Atlas o Repaso abiertos desde Biblioteca) y el navegador no dispara hashchange,
    // sincronizamos la ruta en el siguiente tick sin duplicar nunca un hashchange normal.
    const hrefPop = location.href;
    document.documentElement.classList.remove("mp-fs-on", "cn-fs-on");
    setTimeout(() => {
      if (M.saltando || modal.open || location.href !== hrefPop || ultHrefEnrutado === hrefPop) return;
      const rutaNorm = "#/" + decodificar((location.hash || "").replace(/^#\/?/, "")).slice(0, 400).split("/").filter(Boolean).join("/");
      if (rutaNorm !== (rutaVista || "#/")) {
        ultHrefEnrutado = hrefPop;
        pasosApp++;
        resolverSeguir();
        prepararPos();
        enrutar();
      }
    }, 0);
  });
  // deslizar hacia abajo la cabecera de la ventana la cierra (móvil)
  let toqueCab = null;
  modal.addEventListener("touchstart", (e) => { const c = e.target.closest && e.target.closest(".m-cab"); toqueCab = c && e.touches.length === 1 ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : null; }, { passive: true });
  modal.addEventListener("touchend", (e) => {
    if (!toqueCab || !e.changedTouches.length) return;
    const dx = e.changedTouches[0].clientX - toqueCab.x, dy = e.changedTouches[0].clientY - toqueCab.y;
    toqueCab = null;
    if (dy > 70 && Math.abs(dx) < dy * 0.6) cerrarModal();
  }, { passive: true });
  // Deslizar a la izquierda o a la derecha dentro de una ventana lleva al verso siguiente o al anterior (en la ventana de una
  // palabra, las flechas de arriba recorren las palabras y el gesto, los versos). Con teclado: Mayúsculas + flechas.
  let toqueV = null;
  // (en la ventana el gesto vale también sobre las tarjetas de las palabras; no sobre campos de texto ni zonas que se
  // desplazan a lo ancho)
  const evitaDeslizarV = (el) => {
    for (let n = el; n && n !== modal; n = n.parentElement) {
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(n.tagName) || n.isContentEditable || (n.matches && n.matches(".m-cab, [data-sin-gesto], .tl-mapa"))) return true;
      if (n.scrollWidth > n.clientWidth + 4 && /auto|scroll/.test(getComputedStyle(n).overflowX)) return true;
    }
    return false;
  };
  modal.addEventListener("touchstart", (e) => { toqueV = e.touches.length === 1 && !evitaDeslizarV(e.target) ? { x: e.touches[0].clientX, y: e.touches[0].clientY, t: performance.now() } : null; }, { passive: true });
  modal.addEventListener("touchend", (e) => {
    const g = toqueV; toqueV = null;
    if (!g || !e.changedTouches.length) return;
    const dx = e.changedTouches[0].clientX - g.x, dy = e.changedTouches[0].clientY - g.y;
    if (performance.now() - g.t > 700 || Math.abs(dx) < 72 || Math.abs(dy) > Math.abs(dx) * .45) return;
    if (window.getSelection && String(window.getSelection() || "")) return;
    pasoVentana(dx < 0 ? 1 : -1);
  }, { passive: true });
  function pasoVentana(dir) {
    const n = M.navV || M.nav, f = n && (dir > 0 ? n.next : n.prev);
    if (!f) return false;
    modal.setAttribute("data-paso", dir > 0 ? "sig" : "ant"); clearTimeout(pasoVentana.t);
    pasoVentana.t = setTimeout(() => modal.removeAttribute("data-paso"), 450);
    f(); return true;
  }
  // Esc cierra la ventana (con «closedby=none» el navegador ya no lo hace solo); si algo de dentro ya lo atendió, se respeta
  // (en el documento: al rehacerse la vista de la ventana el foco puede quedar fuera de ella)
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") { M.tEsc = performance.now(); if (!e.defaultPrevented && modal.open) { e.preventDefault(); cerrarModal(); } } });
  modal.addEventListener("keydown", (e) => {
    if (e.target && /input|select|textarea/i.test(e.target.tagName)) return;
    if (e.shiftKey && (e.key === "ArrowLeft" || e.key === "ArrowRight") && M.navV) { e.preventDefault(); pasoVentana(e.key === "ArrowRight" ? 1 : -1); return; }
    if (!M.nav) return;
    if (e.key === "ArrowLeft" && M.nav.prev) { e.preventDefault(); M.nav.prev(); }
    if (e.key === "ArrowRight" && M.nav.next) { e.preventDefault(); M.nav.next(); }
  });
  function pintarModal() {
    const fn = M.pila[M.pila.length - 1];
    if (!fn) return;
    M.nav = null; M.navV = null;
    if (modal.open) guardarScrollM();
    modal.replaceChildren(fn());
    // AH + PR #14: las ventanas breves del juego y Tu faro flotan centradas a la medida de su contenido
    const esFaro = !!modal.querySelector(":scope > .m-caja > .m-cuerpo > .faro-mod");
    modal.classList.toggle("flot", esFaro || !!modal.querySelector(":scope > .m-caja > .m-cuerpo > :is(.jg-cel, .flot-cel)"));
    modal.classList.toggle("faro-flot", esFaro);
    // «Adelante» dentro de la ventana: el mismo botón de abajo a la izquierda de las páginas, encima del pie de la ventana si lo hay
    if (M.fwd.length) {
      const ad = h("button", { class: "adelante vis m-adelante", type: "button", "aria-label": "Adelante: volver a la vista de la que se regresó", title: "Adelante", onclick: () => history.forward() }, h("span", { text: "Adelante" }), svg(ICO.der));
      modal.append(ad);
      const pie = $(".m-pie", modal); if (pie && pie.offsetHeight) ad.style.bottom = "calc(" + (pie.offsetHeight + 10) + "px + env(safe-area-inset-bottom, 0px))";
    }
    const c = $(".m-cuerpo", modal); if (c) c.scrollTop = 0;
    restaurarScrollM();
    if (fn.alMostrar) fn.alMostrar();
  }
  function abrirModal(fn, alCerrar) {
    if (M.encima && modal.open) { M.encima = false; empujar(fn); return; }
    M.encima = false;
    if (modal.open && M.alCerrar && M.alCerrar !== alCerrar) { const f = M.alCerrar; M.alCerrar = null; f(); }
    M.pila = [fn]; M.fwd = []; M.alCerrar = alCerrar || null;
    const abrir = !modal.open;
    if (abrir) {
      try { modal.showModal(); } catch (e) { modal.setAttribute("open", ""); }
      M.abiertaEn = performance.now();
      document.documentElement.classList.add("con-modal");
    }
    pintarModal();
    if (abrir) {
      marcarPaso();
      repintarAdelante();
    }
    if (!modal.contains(document.activeElement)) {
      const foco = $(".m-cab .btn-icono:last-child", modal); if (foco) foco.focus({ preventScroll: true });
    }
  }
  const empujar = (fn) => { M.fwd = []; M.pila.push(fn); pintarModal(); marcarPaso(); };
  // Abre la ventana pedida como un paso más de la que está abierta (si no hay ninguna, como siempre)
  const encima = (abrir) => { M.encima = true; try { abrir(); } finally { M.encima = false; } };
  const volver = () => {
    if (M.pila.length <= 1) return;
    if (M.estados > 0) { try { history.back(); return; } catch (e) { /* sigue abajo */ } }
    M.pila.pop(); pintarModal();
  };
  const reemplazar = (fn) => { M.pila[M.pila.length - 1] = fn; pintarModal(); };
  // Navegadores sin «closedby»: el gesto de volver llega como «cancel»; si la ventana tiene un paso anterior, retrocede uno
  modal.addEventListener("cancel", (e) => {
    if (e.cancelable && M.pila.length > 1 && !(performance.now() - (M.tEsc || -1e9) < 400)) { e.preventDefault(); volver(); return; }
    guardarScrollM(); salidaModal();
  });
  // La ventana se va con un fundido suave: una copia quieta se desvanece encima mientras la de verdad se cierra al instante
  // (así ninguna lógica de historial espera a la animación)
  // Donde el navegador sabe animar la salida de la ventana misma (CSS «overlay»), la ventana real se desvanece con su cristal
  // y su velo (sin copias ni destellos); en los demás, la copia lleva también el desenfoque, y si la ventana aún estaba
  // entrando (se cierra al instante de abrirla) no se anima la salida
  const SALIDA_CSS = !!(window.CSS && CSS.supports && CSS.supports("overlay", "auto"));
  function salidaModal() {
    if (SALIDA_CSS || ap.mov === "no" || (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches)) return;
    if (performance.now() - (M.abiertaEn || 0) < 300) return;
    try {
      const r = modal.getBoundingClientRect(), caja = modal.firstElementChild;
      if (!caja || !r.width || !r.height) return;
      const cs = getComputedStyle(modal);
      const velo = h("div", { class: "modal-velo-sale", "aria-hidden": "true" }), f = h("div", { class: "modal-sale", "aria-hidden": "true" });
      const bf = cs.backdropFilter || cs.webkitBackdropFilter || "none";
      f.style.cssText = "left:" + r.left + "px;top:" + r.top + "px;width:" + r.width + "px;height:" + r.height + "px;border-radius:" + cs.borderRadius + ";background:" + cs.backgroundColor + ";border:" + cs.borderTopWidth + " solid " + cs.borderTopColor + ";box-shadow:" + cs.boxShadow + ";backdrop-filter:" + bf + ";-webkit-backdrop-filter:" + bf;
      const copia = caja.cloneNode(true);
      f.append(copia); document.body.append(velo, f);
      const cu = caja.querySelector(".m-cuerpo"), cu2 = copia.querySelector(".m-cuerpo");
      if (cu && cu2) cu2.scrollTop = cu.scrollTop;
      let hecho = false; const fin = () => { if (hecho) return; hecho = true; velo.remove(); f.remove(); };
      f.addEventListener("animationend", fin, { once: true }); setTimeout(fin, 420);
    } catch (e) { /* sin animación de salida */ }
  }
  function cerrarModal() { guardarScrollM(); if (modal.open || modal.hasAttribute("open")) salidaModal(); if (modal.open) modal.close(); else if (modal.hasAttribute("open")) { modal.removeAttribute("open"); modal.dispatchEvent(new Event("close")); } }
  // Cabecera común de la ventana: volver, título, flechas y cerrar
  function cabModal(tit, sub, nav) {
    return h("div", { class: "m-cab" },
      // AC13: el lugar de «Volver» se reserva siempre, para que el título no se corra ni la cabecera cambie de alto al aparecer
      M.pila.length > 1 ? h("button", { class: "btn-icono m-atras", type: "button", "aria-label": "Volver", title: "Volver", onclick: volver }, svg(ICO.atras)) : h("span", { class: "btn-icono m-atras m-atras-res", "aria-hidden": "true" }),
      // (BiEx, 21-nov-2026, AF1) sin flecha «Adelante» en la cabecera: va abajo a la izquierda, como en las páginas (pintarModal)
      h("div", { class: "m-tit" }, typeof tit === "string" ? h("b", { text: tit }) : tit, sub ? h("small", { text: sub }) : null),
      nav ? h("button", { class: "btn-icono", type: "button", "aria-label": nav.etiqueta[0], title: nav.etiqueta[0], disabled: !nav.prev, onclick: () => nav.prev && nav.prev() }, svg(ICO.izq)) : null,
      nav ? h("button", { class: "btn-icono", type: "button", "aria-label": nav.etiqueta[1], title: nav.etiqueta[1], disabled: !nav.next, onclick: () => nav.next && nav.next() }, svg(ICO.der)) : null,
      h("button", { class: "btn-icono", type: "button", "aria-label": "Cerrar", title: "Cerrar", onclick: cerrarModal }, svg(ICO.cerrar)));
  }
  const cajaModal = (cab, cuerpo, pie) => h("div", { class: "m-caja" }, cab, h("div", { class: "m-cuerpo" }, cuerpo), pie || null);
  const cargandoModal = (tit) => () => cajaModal(cabModal(tit || "Cargando"), h("p", { class: "cargando", text: "Abriendo el análisis…" }));

  // ------------------------------------------------------------------ compartir
  // Dentro del sitio oficial los enlaces llevan al sitio oficial (que abre el lector en ese punto), no al alojamiento del lector
  const OFICIAL = "https://bibliaexacta.wixsite.com/biex/";
  const enlacePublico = (hh) => (EMBED ? OFICIAL + "nueva-voluntad?lector=" + encodeURIComponent(String(hh || "").replace(/^#?\/?/, "")).replace(/%2F/g, "/") : location.href.split("#")[0] + hh);
  const textoPlano = (t) => String(t || "").replace(/[⟪⟫]/g, "").replace(/\*\*?/g, "");
  // Semilla (BiEx, 9-nov-2026: «todo compartir sale con un código único de quien comparte»): quien aún no juega comparte con
  // un código de 10 letras que sale de un secreto guardado solo en este dispositivo; si después crea su cuenta, todo lo que
  // sembró antes pasa a su árbol de la siembra. Nadie puede reclamarla con solo ver el enlace.
  async function semilla() {
    try {
      let s = store.get("jg:semS", null);
      if (typeof s !== "string" || s.length < 32) { s = Array.from(crypto.getRandomValues(new Uint8Array(24)), (b) => b.toString(16).padStart(2, "0")).join(""); store.set("jg:semS", s); }
      const b = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode("biex-semilla:" + s)));
      const AB = "abcdefghjkmnpqrstuvwxyz23456789";
      return Array.from(b.slice(0, 10), (x) => AB[x % AB.length]).join("");
    } catch (e) { return null; }
  }
  // La página que se ve, con la invitación de quien comparte: un verso o un capítulo van con su cita; lo demás, con el enlace
  // propio (/e/<código>, con su vista previa); sin cuenta, con la semilla del dispositivo
  async function compartirPagina() {
    const hh = location.hash || "#/";
    if (/^#\/[A-Z0-9]{3}\//.test(hh)) return compartir(String(document.title || "").split(" · ")[0] + " · Biblia Exacta", "léelo palabra por palabra del griego", hh);
    const inv = (store.get("jg:t", null) && store.get("jg:mio", null)) || (await semilla());
    const url = "https://bibliaexacta.pages.dev" + (inv && /^[a-z0-9]{4,12}$/.test(inv) ? "/e/" + inv : "/");
    const texto = "La Nueva Voluntad traducida palabra por palabra del griego, en el orden de los acontecimientos, y Escudriña, su juego para leerla juntos.";
    try { if (navigator.share) { await navigator.share({ title: "Biblia Exacta", text: texto, url }); return; } } catch (e) { if (e && e.name === "AbortError") return; }
    try { await navigator.clipboard.writeText("Biblia Exacta — " + texto + "\n" + url); avisar("Enlace con tu invitación copiado"); }
    catch (e) { avisar("No se pudo copiar; el enlace es " + url); }
  }
  async function compartir(titulo, texto, hh) {
    const hh0 = hh, juego = () => { try { if (window.BiExJuego && BiExJuego.compartido) BiExJuego.compartido(hh0); } catch (e) { /* sin juego */ } };
    const inv = (store.get("jg:t", null) && store.get("jg:mio", null)) || (await semilla());
    if (inv && /^[a-z0-9]{4,12}$/.test(inv) && /^#\/[A-Z0-9]{3}\//.test(hh || "")) hh = "#/escudrina/i/" + inv + "/" + hh.slice(2);
    const url = enlacePublico(hh);
    try { if (navigator.share) { await navigator.share({ title: titulo, text: titulo + " — " + texto, url }); juego(); return; } } catch (e) { if (e && e.name === "AbortError") return; }
    try { await navigator.clipboard.writeText(titulo + " — " + texto + "\n" + url); avisar("Verso y enlace copiados"); juego(); }
    catch (e) { avisar("No se pudo copiar; el enlace es " + url); }
  }

  // ------------------------------------------------------------------ lectura y apariencia
  const NOMBRES_5 = ["Pequeño", "Normal", "Grande", "Muy grande", "Máximo"];
  const NOMBRES_TAM = K_TAM.map((_, i) => i % 2 === 0 ? NOMBRES_5[i / 2] : "Entre " + NOMBRES_5[(i - 1) / 2].toLowerCase() + " y " + NOMBRES_5[(i + 1) / 2].toLowerCase());
  function abrirApariencia() {
    abrirModal(() => {
      const ws = D && D.portada ? D.portada.p.slice(0, 5) : [];
      const valor = { tam: () => ap.tam, letra: () => ap.letra, inter: () => ap.inter, mov: () => ap.mov, dal: () => ap.dal || "", tema: temaActual, caja: () => prefs.caja, vib: () => store.get("vib", "normal"), cont: () => document.documentElement.classList.contains("contemplar") ? "si" : "no" };
      const muestraGs = ws.map((w) => h("span", { class: "g", lang: "grc", "data-gk": w.g }, gk(w.g)));
      const cambiar = {
        tema: (v) => ponerTema(v),
        caja: (v) => { prefs.caja = v; guardarPrefs(); aplicarCaja(); },
        vib: (v) => { store.set("vib", v); try { if (navigator.vibrate) { if (v === "normal") navigator.vibrate([14, 30, 18]); else if (v === "suave") navigator.vibrate(8); } } catch (e) { /* sin vibración */ } },
        cont: (v) => {
          const on = v === "si";
          if (on && (!esc.libro || esc.modo === "a")) {
            const u = store.get("ultimo", null);
            const dest = u && u.c && u.cap ? "#/" + u.c + "/" + u.cap : "#/MAT/1";
            cerrarModal(); location.hash = dest; setTimeout(() => ponerContemplar(true), 220);
            return;
          }
          ponerContemplar(on);
          if (on) cerrarModal();
        },
      };
      const nomTam = h("span", { text: NOMBRES_TAM[ap.tam - 1] });
      const grupo = (k, ops, clase) => {
        const btns = ops.map(([v, kids, etiqueta, extra]) => h("button", Object.assign({ type: "button", "aria-pressed": String(valor[k]() === v), "aria-label": etiqueta || null, title: etiqueta || null, onclick: () => {
          if (cambiar[k]) cambiar[k](v); else { const a = capturarAncla(); ap[k] = v; store.set("ap", ap); aplicarAp(); volverAAncla(a); }
          btns.forEach((b, j) => b.setAttribute("aria-pressed", String(ops[j][0] === v)));
          if (k === "tam") nomTam.textContent = NOMBRES_TAM[v - 1];
        } }, extra || {}), kids));
        return h("div", { class: clase || "ap-ops", role: "group" }, btns);
      };
      const op = (b, sm, lang) => [h("b", { text: b, lang: lang || null }), sm ? h("small", { text: sm }) : null];
      const fila = (tit, ...kids) => h("div", { class: "ap-fila" }, h("h4", {}, tit, ...(kids.length > 1 ? [kids.shift()] : [])), kids);
      return cajaModal(cabModal("Lectura y apariencia", "Se guarda en este dispositivo"),
        h("div", { class: "ap" },
          h("div", { class: "ap-muestra", "aria-hidden": "true" },
            h("div", { class: "ap-il" }, ws.map((w, i) => h("span", {}, muestraGs[i], h("span", { class: "t" }, glosa(w.tr))))),
            h("p", { class: "e", text: "Así se verá el texto: toca cualquier palabra para abrir su análisis." })),
          fila("Tamaño del texto", nomTam, grupo("tam", K_TAM.map((k, i) => [i + 1, h("span", { style: "font-size:" + Math.round(16 * Math.pow(k, 1.9) * 10) / 10 + "px", text: "A" }), "Tamaño " + (i + 1) + " de 9: " + NOMBRES_TAM[i].toLowerCase()]), "ap-tams")),
          fila("Tipo de letra", grupo("letra", [
            ["clasica", op("Clásica", "Gentium y Cormorant, la tipografía de la casa"), null, { class: "f-clasica" }],
            ["clara", op("Lectura clara", "Atkinson Hyperlegible, pensada para la baja visión"), null, { class: "f-clara" }],
            ["dislexia", op("Para dislexia", "OpenDyslexic, con más espacio entre palabras y sin cursivas"), null, { class: "f-dislexia" }]], "ap-ops ap-letras")),
          fila("Interlineado", grupo("inter", [["normal", op("Normal")], ["amplio", op("Amplio", "Más aire entre las líneas")]])),
          fila("Tema", grupo("tema", [["dark", op("Oscuro", "Negro, marfil y oro")], ["light", op("Pergamino", "Fondo claro, tinta oscura")]])),
          fila("Griego", grupo("caja", [["min", op("αβγ", "Minúsculas con acentos y espíritus", "grc")], ["may", op("ΑΒΓ", "Mayúsculas sin marcas, como los códices unciales", "grc")]])),
          fila("Enfoque", grupo("cont", [
            ["no", op("Habitual", "Barras y herramientas de estudio visibles")],
            ["si", op("Contemplar", "Solo el texto sagrado, sin barras ni distracciones")]])),
          fila("Movimiento", grupo("mov", [["si", op("Con animaciones")], ["no", op("Sin animaciones", "Todo aparece al instante")]])),
          fila("Vibración (recompensas)", grupo("vib", [
            ["normal", op("Normal", "Vibración completa en premios y toques (también en Modo tranquilo)")],
            ["suave", op("Suave", "Pulsos más breves y delicados para momentos en calma")],
            ["no", op("Desactivada", "Sin vibración en ningún momento")]])),
          fila("Visión del color", grupo("dal", [
            ["", op("Colores habituales", "El oro, el azul y el naranja de la edición BiEx")],
            ["rv", op("Rojo y verde", "Protanopía y deuteranopía: tonos que no dependen del rojo ni del verde")],
            ["az", op("Azul y amarillo", "Tritanopía: tonos que no dependen del azul ni del amarillo")],
            ["mono", op("Sin color", "Acromatopsia: todo se distingue por la forma y el brillo")]], "ap-ops ap-dal")),
          h("div", { class: "ap-pie" },
            h("button", { class: "btn chico oro", type: "button", onclick: () => empujar(vistaOpciones()) }, svg(ICO.opciones), "Opciones del texto: colores, corchetes, paréntesis"),
            h("button", { class: "btn chico", type: "button", onclick: () => { ap = Object.assign({}, AP0); store.set("ap", ap); store.set("vib", "normal"); aplicarAp(); pintarModal(); } }, "Restablecer lectura")),
          h("p", { class: "nota-ui ap-acc", text: "Biblia Exacta está pensada para todas las personas: letra para dislexia, letra clara, nueve tamaños, interlineado amplio, modos para daltonismo, guía con voz y la opción sin animaciones. Y seguimos avanzando, paso a paso, hacia la máxima accesibilidad para las personas neurodivergentes (TDAH, dislexia, autismo…), ciegas o con baja visión, para que el Lόgος llegue sin barreras a todos los que hablan español." })));
    });
  }

  // ------------------------------------------------------------------ opciones del texto
  const OPC0 = { ed: true, cor: "todas", corOrg: "primera", par: true, ang: true, sup: true };
  // verso de muestra cuando el capítulo abierto no tiene uno con ampliaciones: Marcos 2:5 (texto de BiEx)
  const MUESTRA = { c: "MRK", cap: 2, v: 5 };
  function vistaOpciones() {
    return () => {
      // muestra: un verso del capítulo abierto que tenga corchetes (y, si hay, palabras del Mashíaḥ); si no, un ejemplo
      const vs = esc.libro ? esc.versos || [] : [];
      const conAlt = (x) => !x.g && /\[[^\]]+\]\s*\[/.test(x.t);
      let L = vs.find((x) => conAlt(x) && x.m && x.m.length) || vs.find(conAlt) || null;
      let ref = L ? refCorta(libroDe(esc.libro), esc.cap, L.v) : refCorta(libroDe(MUESTRA.c), MUESTRA.cap, MUESTRA.v);
      const muestra = h("p", { class: "op-muestra vt" });
      const pintarMuestra = () => muestra.replaceChildren(L ? txtVerso(L) : cargando("Cargando un ejemplo…"));
      pintarMuestra();
      if (!L) lectura(MUESTRA.c).then((Lc) => { L = (Lc.caps[MUESTRA.cap] || []).find((x) => x.v === MUESTRA.v) || null; if (muestra.isConnected) pintarMuestra(); }).catch(() => {});
      const cambio = () => { guardarPrefs(); aplicarEd(); pintarMuestra(); refrescarVista(); };
      const grupo = (k, ops) => {
        const btns = ops.map(([v, t, sm]) => h("button", { type: "button", "aria-pressed": String(prefs[k] === v), onclick: () => {
          prefs[k] = v; btns.forEach((b, j) => b.setAttribute("aria-pressed", String(ops[j][0] === v))); cambio();
        } }, h("b", { text: t }), sm ? h("small", { text: sm }) : null));
        return h("div", { class: "ap-ops", role: "group" }, btns);
      };
      const fila = (tit, nota, ...kids) => h("div", { class: "ap-fila" }, h("h4", {}, tit), nota ? h("p", { class: "nota-ui", text: nota }) : null, kids);
      const ley = h("div", { class: "ley-ed" },
        h("span", { class: "vt" }, "Texto"), h("span", { class: "vt" }, h("span", { class: "tm", text: "Palabras del Mashíaḥ" })),
        h("span", { class: "vt" }, h("span", { class: "tc", text: "Citas de la Antigua Voluntad" })), h("span", { class: "vt" }, h("span", { class: "it", text: "Expresiones del Eterno" })),
        h("span", { class: "vt" }, h("span", { class: "tk", text: "[ampliaciones]" })));
      return cajaModal(cabModal("Opciones del texto", "Se guardan en este dispositivo"),
        h("div", { class: "ap" },
          h("div", { class: "ap-muestra" }, h("p", { class: "eyebrow", text: "Así se ve " + ref }), muestra),
          fila("Colores de la edición BiEx", "El texto en azul; las palabras del Mashíaḥ en anaranjado; las citas de la Antigua Voluntad en mayúsculas; las expresiones del Eterno en cursiva; las ampliaciones en gris.",
            grupo("ed", [[true, "Con colores"], [false, "Sin colores"]]), ley),
          fila("Ampliaciones entre corchetes [ ]", prefs.lorg ? "En la vista Lectura (por defecto, solo la primera)." : null, grupo((prefs[kCor()] == null && (prefs[kCor()] = "primera"), kCor()), [["todas", "Todas"], ["dos", "Solo las dos primeras", "Las dos primeras ampliaciones de cada palabra"], ["primera", "Solo la primera", "La primera ampliación de cada palabra"], ["base", "Solo la palabra base", "Sin ampliaciones (el significado de cada nombre se ve en su primera aparición)"]])),
          fila("Paréntesis ( )", null, grupo("par", [[true, "Mostrar"], [false, "Ocultar"]])),
          fila("Signos < >", null, grupo("ang", [[true, "Mostrar"], [false, "Ocultar"]])),
          fila("Letras voladas y asteriscos (ᵐ ⁿ ᶠ *)", null, grupo("sup", [[true, "Mostrar"], [false, "Ocultar"]])),
          h("div", { class: "ap-pie" }, h("button", { class: "btn chico", type: "button", onclick: () => { Object.assign(prefs, OPC0); cambio(); pintarModal(); } }, "Restablecer")), esc.libro && esc.cap ? h("div", { class: "ap-exp" }, h("button", { class: "btn chico", type: "button", onclick: () => abrirExportar("cap") }, svg(ICO.descargar), h("span", { text: "Exportar este capítulo a Obsidian (.md)" })),
            // AF2 (BiEx, 21-nov-2026): el griego del capítulo entero, listo para pegar
            h("button", { class: "btn chico", type: "button", onclick: () => copiarGriego(libroDe(esc.libro), esc.cap, 1, 1e4, "capitulo") }, svg(ICO.copiar), h("span", { text: "Copiar el griego de este capítulo" }))) : null));
    };
  }
  const abrirOpciones = () => abrirModal(vistaOpciones());

  // ------------------------------------------------------------------ marco
  const raiz = $("#app");
  function marco() {
    if (EMBED) document.documentElement.classList.add("incrustado");
    const tema = h("button", { class: "btn-icono btn-aa", type: "button", "aria-label": "Lectura y apariencia: tamaño del texto, tipo de letra, interlineado y tema", title: "Lectura y apariencia", onclick: abrirApariencia }, "A", h("small", { text: "a" }));
    const buscar = h("button", { class: "btn-buscar", type: "button", "aria-label": "Buscar: escenas, citas, nombres, palabras o preguntas", onclick: () => abrirBusqueda("") }, svg(ICO.buscar), h("span", { text: "Buscar" }), h("small", { class: "bb-pista", text: "escenas, citas, palabras…" }));
    const guia = h("button", { class: "btn-icono btn-guia", type: "button", "aria-label": "Guía animada del lector", title: "Guía: cómo usar el lector", onclick: () => abrirGuia(0) }, svg(ICO.guia));
    const hist = h("button", { class: "btn-icono btn-hist", type: "button", "aria-label": "Historial: las últimas 24 citas consultadas", title: "Historial", onclick: () => abrirHistorial() }, svg(ICO.historial));
    // BiEx (10-nov-2026): los libros a un toque desde cualquier lugar de la interfaz
    const libros = h("button", { class: "btn-icono btn-libros", type: "button", "aria-label": "Libros: ir de inmediato a cualquier libro y capítulo", title: "Libros", onclick: () => abrirLibros() }, svg(ICO.libros));
    const juego = h("button", { class: "btn-icono btn-juego", type: "button", "aria-label": "Escudriña, el juego de Biblia Exacta", title: "Escudriña · el juego", onclick: () => { location.hash = "#/escudrina"; } }, svg(ICO.juego));
    // P32 (BiEx, 11-nov-2026): compartir siempre a la mano (también en la app instalada), con el código de quien comparte
    const comp = h("button", { class: "btn-icono btn-comp", type: "button", "aria-label": "Compartir Biblia Exacta con tu enlace de invitación", title: "Compartir", onclick: () => compartirPagina() }, svg(ICO.compartir));
    const herr = h("button", { class: "btn-icono btn-herr", type: "button", "aria-label": "Herramientas: lectura, análisis, buscador, manuscritos, línea del tiempo, concordancia y guía", title: "Herramientas", onclick: () => abrirHerramientas() }, svg(ICO.rejilla));
    const extra = EMBED ? [
      h("button", { class: "btn-icono", type: "button", "aria-label": "Cerrar el lector", title: "Cerrar el lector", onclick: () => { try { window.parent.postMessage({ biex: "cerrar" }, "*"); } catch (e) { /* ignorar */ } } }, svg(ICO.cerrar)),
    ] : [];
    // Fondo vivo: luces muy tenues (3 halos precargados en caché de textura GPU) y motas de luz que suben (se detiene con «Sin animaciones»)
    const motas = Array.from({ length: 10 }, (_, i) => h("i", { style: "--x:" + ((i * 61 + 7) % 100) + "%;--d:" + (34 + (i * 13) % 30) + "s;--r:-" + ((i * 7.3) % 40).toFixed(1) + "s;--s:" + (1.4 + (i % 4) * 0.5) + "px", class: "m" + ((i * 37) % 9) })); // (21-nov-2026) deriva fija por clase; Neon (23-nov-2026): 10 motas = menos capas GPU sin perder atmósfera
    const capaLuces = h("div", { class: "vivo-luces" });
    setTimeout(() => lucesVivas(capaLuces), 0);
    const fondo = h("div", { class: "fondo-vivo", "aria-hidden": "true" }, capaLuces, h("div", { class: "vivo-motas" }, motas));
    // letras hebreas y griegas que cruzan como meteoritos: lienzo propio, por delante de los contenedores y por detrás del texto
    const lienzoMet = h("div", { class: "meteoros", "aria-hidden": "true" });
    raiz.replaceChildren(fondo, lienzoMet,
      h("header", { class: "barra" }, h("div", { class: "in" },
        h("a", { class: "marca", href: "#/", "aria-label": "Inicio del lector" }, h("span", { class: "sello", text: "BiEx" }), h("span", { class: "nombre" }, h("b", { text: "Biblia Exacta" }), h("small", { text: "Lector y analizador" }))),
        h("nav", { class: "nav", "aria-label": "Secciones" }, h("a", { href: "#/", text: "Inicio" }), h("a", { href: "#/libros", text: "Libros" }), h("a", { href: "#/cronologia", text: "Cronología" }), h("a", { href: "#/buscar", text: "Avanzada" })),
        h("div", { class: "acc" }, buscar, libros, juego, comp, herr, guia, tema, hist, extra))), // (12-nov-2026) el historial, a la izquierda de la X
      h("main", { class: "pagina", id: "vista", tabindex: "-1" }),
      h("footer", { class: "pie pie-a" }, h("div", { class: "in" },
        h("div", { class: "marca-pie", text: "Biblia Exacta" }),
        h("p", { class: "nota-pie", text: "Ningún verso se da por terminado: la traducción sigue abierta a ajustes. Los versos sin traducción completa se leen como texto base, palabra por palabra; lo que aún no tiene traducción fijada se muestra en griego." }),
        h("div", { class: "autoria" },
          h("span", { text: "Traducción, transliteración y análisis:" }),
          h("strong", { text: "BiEx – Biblia Exacta ©™." }),
          h("span", {}, h("a", { href: "https://bibliaexacta.wixsite.com/biex", target: "_blank", rel: "noopener", text: "Sitio oficial" }), h("span", { id: "actualizado" })),
          h("span", { class: "pie-jer", id: "fecha-jerusalen" })),
        // AF23 (BiEx, 21-nov-2026): cuenta atrás misteriosa hasta el 16 de julio de 2027 (sin explicación), discreta, solo en la
        // pantalla principal y al leer un capítulo (Análisis, Lectura y Textual)
        h("div", { class: "cuenta-m", id: "cuenta-m", "aria-hidden": "true" }))),
      // AL6 (BiEx, 22-nov-2026, 18:53): el pie va en dos partes hermanas para que la píldora de la Sala (Escudriña) viva entre ellas,
      // pegada (sticky) al borde de la ventana mientras se lee y acomodada entre la cuenta atrás y los créditos al llegar al final;
      // juego.js la pone antes de #pie-b. Las dos partes comparten fondo: se ven como un solo pie.
      h("div", { class: "pie pie-b", id: "pie-b" }, h("div", { class: "in" },
        // Créditos de los datos (BiEx, 13-nov-2026, 18:26): desplegados en el pie de la pantalla principal; en las ventanas
        // (Manuscritos, la ficha de la palabra, las referencias) van plegados (credPleg)
        // (BiEx, 13-nov-2026, 20:32): en el pie, siempre a la vista, sin pliegue (también al pie de «Más» en Escudriña)
        // (BiEx, 14-nov-2026: «los veo desplegados por doquier») desplegados y sin pliegue SOLO en la pantalla principal y al pie
        // de «Más» de Escudriña; en las demás vistas, plegados en una línea discreta (créditosPie, al cambiar de ruta)
        h("details", { class: "creditos-det", id: "creditos-pie" }, h("summary", { class: "creditos-tit", text: "Créditos de los datos" }),
        h("p", { class: "creditos" }, "Texto griego y datos morfológicos: ", h("a", { href: "https://github.com/STEPBible/STEPBible-Data", target: "_blank", rel: "noopener", text: "TAGNT de STEPBible.org" }), " (Tyndale House, Cambridge), ",
          h("a", { href: "https://github.com/Clear-Bible/macula-greek", target: "_blank", rel: "noopener", text: "MACULA Greek Linguistic Datasets" }), " [Conjuntos de Datos Lingüísticos del Griego MACULA] (Biblica) y ",
          h("a", { href: "https://github.com/LogosBible/SBLGNT", target: "_blank", rel: "noopener", text: "SBLGNT" }), " (Society of Biblical Literature [Sociedad de Literatura Bíblica] y Logos Bible Software), con licencia CC BY 4.0.", h("br"),
          "Transcripciones de los manuscritos: ", h("a", { href: "https://greekcntr.org", target: "_blank", rel: "noopener", text: "Center for New Testament Restoration" }), " [Centro para la Restauración del Nuevo Testamento] (Alan Bunning), con licencia CC BY-SA 4.0; la comparación con el texto base se publica con la misma licencia.", h("br"),
          "Para reconocer las palabras con que se recuerda un verso, el buscador usa, sin mostrarlas, las traducciones de dominio público Reina-Valera 1909 y 1865, World [Mundial] English Bible [Biblia], King [Rey] James Version [Versión] y Berean Standard Bible [Biblia Estándar], y la Biblia en Español Sencillo (© 2018 AudioBiblia.org, CC BY 4.0).", h("br"),
          "Códigos Strong y formación de las palabras: códigos Strong extendidos de ", h("a", { href: "https://github.com/STEPBible/STEPBible-Data", target: "_blank", rel: "noopener", text: "TAGNT" }), " (STEPBible.org, CC BY 4.0) y Strong's Exhaustive Concordance [Concordancia Exhaustiva de Strong] (James Strong, 1890; datos de ", h("a", { href: "https://github.com/openscriptures/strongs", target: "_blank", rel: "noopener", text: "Open Scriptures" }), " [Escrituras Abiertas], CC BY-SA), con las familias morfológicas de BiEx; el léxico de estudio que se deriva de ellos se publica con licencia CC BY-SA 4.0.", h("br"),
          "Fechas de escritura: John Arthur Thomas Robinson [J. A. T. Robinson], Redating the New Testament [Nueva datación del Nuevo Testamento] (1976).", h("br"),
          "Referencias cruzadas: ", h("a", { href: "https://www.openbible.info/labs/cross-references/", target: "_blank", rel: "noopener", text: "OpenBible.info" }), " (CC BY), a partir del Treasury of Scripture Knowledge [Tesoro del Conocimiento de la Escritura]; nivel y categorías de BiEx.", h("br"),
          "Ciudades de Escudriña: ", h("a", { href: "https://www.geonames.org", target: "_blank", rel: "noopener", text: "GeoNames" }), " (CC BY 4.0). Citas de la Antigua Voluntad, mientras BiEx la traduce: Septuaginta en español de Wilhelm [Guillermo] Jünemann Beckschäfer (dominio público), del ", h("a", { href: "https://github.com/GIL-UNAM/SpanishParaphraseCorpora", target: "_blank", rel: "noopener", text: "corpus paralelo GIL-UNAM" }), " (CC0).")))),
      modal);
    const tg = store.get("tema", null);
    if (tg === "light" || tg === "dark") document.documentElement.setAttribute("data-theme", tg);
    else if (EMBED) document.documentElement.setAttribute("data-theme", "dark");
    ajustarBarra();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(ajustarBarra).catch(() => {});
    FARO.montar();
  }
  // créditos del pie: abiertos (sin pliegue) en la pantalla principal y al pie de «Más»; plegados en las demás vistas
  function creditosPie(abiertos) {
    const d = document.getElementById("creditos-pie"); if (!d) return;
    d.open = !!abiertos; d.classList.toggle("fijos", !!abiertos);
  }
  // La marca «Biblia Exacta» nunca se recorta (con cualquier zoom del navegador o anchura): si no cabe, primero se oculta
  // la pista del buscador y después los enlaces de secciones (siguen en Herramientas y en la portada)
  function ajustarBarra() {
    const m = $(".barra .marca"), bi = $(".barra .in"), r = document.documentElement; if (!m || !bi) return;
    // (BiEx, 14-nov-2026 + PR #14) compartir se va antes que el historial; ningún ícono visible de .acc se recorta jamás
    const PASOS = ["barra-sin-pista", "barra-sin-nav", "barra-sin-guia", "barra-sin-comp", "barra-sin-hist", "barra-estrecha"];
    r.classList.remove(...PASOS);
    const sello = $(".barra .sello"), acc = $(".barra .acc");
    const choca = () => {
      if (!acc) return false;
      const vis = Array.from(acc.children).filter((x) => x.getClientRects().length);
      if (!vis.length) return false;
      if (sello && vis[0].getBoundingClientRect().left < sello.getBoundingClientRect().right + 6) return true;
      const der = Math.min(window.innerWidth, bi.getBoundingClientRect().right) + 1;
      return vis[vis.length - 1].getBoundingClientRect().right > der;
    };
    const recorta = () => m.scrollWidth > m.clientWidth + 1 || bi.scrollWidth > bi.clientWidth + 1 || choca();
    for (const c of PASOS) { if (!recorta()) break; r.classList.add(c); }
  }
  let tAjBarra = 0;
  window.addEventListener("resize", () => { if (!tAjBarra) tAjBarra = requestAnimationFrame(() => { tAjBarra = 0; ajustarBarra(); }); }, { passive: true });
  const vista = () => $("#vista");
  const cargando = (txt) => h("p", { class: "cargando", text: txt || "Cargando…" });
  const fallo = (txt) => h("p", { class: "error", text: txt + " Revisa tu conexión y recarga la página." });
  function navActual(clave) { for (const a of $$(".nav a")) a.setAttribute("aria-current", a.getAttribute("href") === clave ? "page" : "false"); }

  // ------------------------------------------------------------------ portada
  // Verso destacado del día: rota cada día entre los tramos con traducción (Juan 1:1 si no hay otros)
  let DEST = [];
  function destacadoDelDia() {
    const base = { c: "JHN", cap: 1, v: 1, i0: 0, p: D.portada.p };
    const buenos = DEST.filter((d) => d.p && d.p.length >= 3 && d.p.length <= 9 && d.sinTr <= 1);
    if (!buenos.length) return base;
    const dia = Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 86400000);
    return buenos[dia % buenos.length];
  }
  // Franja de la biblioteca: cada tramo es un libro. Al pasar el dedo o el puntero se resalta el libro con su nombre
  // original; al soltar (o al hacer clic) se abre el elegido. Deslizar fuera de la franja hacia arriba o abajo cancela.
  function franjaLibros(L) {
    const visor = h("div", { class: "franja-visor", "aria-hidden": "true" });
    const tramos = L.map((b, i) => h("a", {
      href: "#/" + b.c + "/1", "data-i": i, draggable: "false", style: "flex:" + (b.nPal || b.total) + " 1 0",
      "aria-label": numLibro(b) + ". " + nombreLibro(b) + (fechaEscrito(b) ? ", escrito c. " + fechaEscrito(b).replace(/^c\. /, "") : "") + ", " + pct(b.palabras) + " de las palabras ya traducidas" },
      h("i", { style: "height:" + Math.min(100, b.palabras).toFixed(1) + "%" })));
    const cont = h("div", { class: "panorama", role: "group", "aria-label": "La Nueva Voluntad completa: cada tramo es un libro. Usa las flechas para recorrerla." }, tramos);
    const caja = h("div", { class: "franja" }, visor, cont);
    let activo = -1, arrastre = null;
    const pintarVisor = (i) => {
      const b = L[i]; if (!b) return;
      const fe = fechaEscrito(b);
      visor.replaceChildren(h("span", { class: "fv-n", text: String(numLibro(b)).padStart(2, "0") }),
        h("span", { class: "fv-t" }, h("b", { text: b.t || b.n }), h("small", { text: tradQ(b) + (fe ? " · c. " + fe.replace(/^c\. /, "") : "") })),
        h("span", { class: "fv-p", text: pct(b.palabras) }));
      const r = cont.getBoundingClientRect(), t = tramos[i].getBoundingClientRect();
      const ancho = visor.offsetWidth || 220, centro = t.left + t.width / 2 - r.left;
      visor.style.left = Math.max(0, Math.min(r.width - ancho, centro - ancho / 2)) + "px";
      visor.style.setProperty("--flecha", Math.max(12, Math.min(ancho - 12, centro - Math.max(0, Math.min(r.width - ancho, centro - ancho / 2)))) + "px");
    };
    const mostrar = (i) => {
      if (i === activo || i < 0) return;
      if (activo >= 0 && tramos[activo]) tramos[activo].classList.remove("activo");
      activo = i; tramos[i].classList.add("activo");
      caja.classList.add("con-visor");
      pintarVisor(i);
      if (arrastre && arrastre.movido && navigator.vibrate) { try { navigator.vibrate(4); } catch (e) { /* sin vibración */ } }
    };
    const ocultar = () => { if (activo >= 0 && tramos[activo]) tramos[activo].classList.remove("activo"); activo = -1; caja.classList.remove("con-visor"); };
    const indice = (x) => {
      for (let i = 0; i < tramos.length; i++) { const r = tramos[i].getBoundingClientRect(); if (x >= r.left && x < r.right) return i; }
      const r = cont.getBoundingClientRect();
      return x < r.left ? 0 : x >= r.right ? tramos.length - 1 : -1;
    };
    cont.addEventListener("pointerdown", (e) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      arrastre = { x: e.clientX, y: e.clientY, movido: false, id: e.pointerId };
      try { cont.setPointerCapture(e.pointerId); } catch (er) { /* sin captura */ }
      mostrar(indice(e.clientX));
    });
    cont.addEventListener("pointermove", (e) => {
      if (arrastre) {
        if (Math.abs(e.clientX - arrastre.x) > 6) arrastre.movido = true;
        const fuera = Math.abs(e.clientY - arrastre.y) > 70;
        caja.classList.toggle("cancelar", fuera);
        if (!fuera) mostrar(indice(e.clientX));
      } else if (e.pointerType === "mouse") mostrar(indice(e.clientX));
    });
    cont.addEventListener("pointerup", (e) => {
      if (!arrastre) return;
      const fuera = Math.abs(e.clientY - arrastre.y) > 70;
      arrastre = null; caja.classList.remove("cancelar");
      if (fuera) { ocultar(); return; }
      const i = indice(e.clientX);
      if (i >= 0) { mostrar(i); setTimeout(() => { location.hash = "#/" + L[i].c + "/1"; }, 140); }
    });
    cont.addEventListener("pointercancel", () => { arrastre = null; caja.classList.remove("cancelar"); ocultar(); });
    cont.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse" && !arrastre) ocultar(); });
    // el clic de ratón o dedo ya lo resuelve «pointerup»; el de teclado (Intro) sigue el enlace
    cont.addEventListener("click", (e) => { if (e.detail !== 0) e.preventDefault(); });
    cont.addEventListener("focusin", (e) => { const a = e.target.closest("a"); if (a) mostrar(+a.dataset.i); });
    cont.addEventListener("focusout", () => setTimeout(() => { if (!cont.contains(document.activeElement)) ocultar(); }, 0));
    cont.addEventListener("keydown", (e) => {
      const a = e.target.closest("a"); if (!a) return;
      const i = +a.dataset.i, j = e.key === "ArrowRight" ? i + 1 : e.key === "ArrowLeft" ? i - 1 : e.key === "Home" ? 0 : e.key === "End" ? tramos.length - 1 : null;
      if (j == null || j < 0 || j >= tramos.length) return;
      e.preventDefault(); tramos[j].focus();
    });
    return caja;
  }
  function portada(irLibros) {
    document.title = "BiEx · Lector y analizador de la Nueva Voluntad";
    navActual(irLibros ? "#/libros" : "#/");
    const P = destacadoDelDia();
    esc.dest = P;
    const lb = libroDe(P.c) || libroDe("JHN");
    const botones = P.p.map((w, i) => h("button", { type: "button", class: "il" + (prefs.heroCaja === "may" ? " may" : ""), style: "--i:" + i, "aria-pressed": "false",
      "aria-label": w.g + ": " + (w.lo || w.tr || "sin traducción fijada") + ". Abrir el análisis", onclick: () => abrirPalabraPortada(i) },
      // AL8 (22-nov-2026): bajo cada palabra, su forma en la Lectura cuando difiere de la Textual («lo»)
      h("span", { class: "g", lang: "grc", "data-gkh": w.g }, gk(w.g, prefs.heroCaja)), h("span", { class: "t" }, glosa(w.lo || w.tr))));
    const cajaBtn = (k, t, et) => h("button", { type: "button", "aria-pressed": prefs.heroCaja === k ? "true" : "false", "aria-label": et, title: et, onclick: (e) => {
      prefs.heroCaja = k; guardarPrefs();
      for (const b of botones) { const g = $(".g", b); g.textContent = gk(g.dataset.gkh, k); b.classList.toggle("may", k === "may"); }
      for (const b of $$(".seg-hero button")) b.setAttribute("aria-pressed", b === e.currentTarget ? "true" : "false");
    } }, h("span", { class: "gk", text: t }));
    const L = librosEnOrden(), ko = ordenActivo();
    const grupos = ko === "tradicional"
      ? [["Los relatos de la vida de YēshŪ́aʿ y " + nombreLibro(libroDe("ACT")), "", ["MAT", "MRK", "LUK", "JHN", "ACT"]], ["Las cartas", "", D.libros.map((b) => b.c).filter((c) => !["MAT", "MRK", "LUK", "JHN", "ACT", "REV"].includes(c))], [nombreLibro(libroDe("REV")), "", ["REV"]]]
      : CRONO.grupos[ko];
    const tarjeta = (b) => {
      const completos = b.total - b.conteo.base;
      const fe = fechaEscrito(b), na = fechaNarra(b);
      return h("a", { class: "tlibro", href: "#/" + b.c + "/1", "aria-label": nombreLibro(b) + (fe ? ", escrito c. " + fe.replace(/^c\. /, "") : "") + ": " + pct(b.palabras) + " de las palabras ya traducidas en el texto base" },
        h("span", { class: "num", text: String(numLibro(b)).padStart(2, "0") }),
        h("span", { class: "tit", text: b.t || b.n }),
        h("span", { class: "es", text: b.t ? tradQ(b) : "" }),
        fe ? h("span", { class: "fecha" }, svg(ICO.tiempo), h("span", { text: "Escrito " + (/^c\./.test(fe) ? fe : "c. " + fe) + (na && ko === "crono" ? " · narra " + na : "") })) : null,
        h("span", { class: "medidor", "aria-hidden": "true" }, h("i", { style: "width:" + Math.min(100, b.palabras).toFixed(1) + "%" })),
        h("span", { class: "dato" }, h("span", {}, h("strong", { text: pct(b.palabras) }), " texto base"), h("span", { text: completos ? fmt(completos) + " de " + fmt(b.total) + " versos con traducción completa" : fmt(b.total) + " versos" })));
    };
    const totalPal = L.reduce((s, b) => s + (b.nPal || b.total), 0);
    const panorama = franjaLibros(L);
    const txtOrden = (ORDENES.find((o) => o[0] === ko) || ORDENES[2])[2];
    const textoOrden = h("p", { class: "nota-ui orden-nota", text: typeof txtOrden === "function" ? txtOrden() : txtOrden });
    const selOrden = h("div", { class: "seg seg-orden", role: "group", "aria-label": "Orden de los libros" }, ORDENES.map(([k, t]) => h("button", {
      type: "button", "aria-pressed": String(ko === k), disabled: !CRONO && k !== "tradicional" ? true : null, onclick: () => {
        if (ordenActivo() === k) return;
        prefs.orden = k; guardarPrefs();
        const y = window.scrollY; portada(false); saltarA(y);
      } }, t)));
    const ult = store.get("ultimo", null), ub = ult && libroDe(ult.c);
    vista().replaceChildren(
      h("section", { class: "hero" }, h("div", { class: "in" },
        h("div", { class: "hero-tit" },
          h("span", { class: "eyebrow", text: "Nueva Voluntad · griego koiné → español" }),
          h("h1", {}, "Del griego al español, ", h("em", { text: "palabra por palabra" }), "."),
          h("p", { text: "Lee cada libro en su estado actual de traducción y abre cualquier palabra para ver su forma, su transliteración, su lema, su análisis morfológico completo y todas las veces que aparece." })),
        // BiEx (21-nov-2026, con la propuesta de Neon): las acciones antes del códice, para que «Leer» o «Seguir leyendo» se vean
        // sin desplazar (a 1440 × 900 quedaban debajo del pliegue)
        h("div", { class: "acciones" },
          // BiEx (10-nov-2026): «Seguir leyendo» en dos renglones centrados (el libro ya no se parte de forma asimétrica)
          ub ? h("a", { class: "btn oro seguir", href: "#/" + ub.c + "/" + ult.cap + (ult.m === "a" ? "/a" + (ult.v ? "/" + ult.v : "") : (ult.v ? "/l/" + ult.v : "")) }, h("span", { class: "seg-t" }, h("small", {}, svg(ICO.seguir), "Seguir leyendo"), h("span", { class: "seg-l" }, etLibro(ub, ult.cap + (ult.v ? ":" + ult.v : ""))))) : null,
          h("a", { class: "btn" + (ub ? "" : " oro"), href: "#/" + P.c + "/" + P.cap + "/l/" + P.v }, svg(ICO.libro), h("span", {}, "Leer ", etLibro(lb, String(P.cap)))),
          h("a", { class: "btn", href: "#/" + P.c + "/" + P.cap + "/a/" + P.v }, svg(ICO.lupa), "Analizar palabra por palabra"),
          h("a", { class: "btn", href: "#/libros" }, svg(ICO.rejilla), "Los 27 libros"),
          h("a", { class: "btn", href: "#/escudrina" }, svg(ICO.juego), "Escudriña · el juego")),
        h("div", { class: "codice" },
          h("div", { class: "codice-cab" },
            h("span", { class: "ref" }, h("b", { text: (lb.t || lb.n) + " " + P.cap + ":" + P.v }), " [" + lb.n + "]"),
            h("div", { class: "seg seg-hero", role: "group", "aria-label": "Escritura del griego" }, cajaBtn("may", "ΑΒΓ", "Mayúsculas, como los códices unciales"), cajaBtn("min", "αβγ", "Minúsculas con acentos y espíritus"))),
          h("div", { class: "interlineal" }, botones),
          h("p", { class: "pista", text: "Toca una palabra, en griego o en español, para abrir su análisis" })))),
      h("section", { class: "cifras" }, h("div", { class: "in" },
        h("div", { class: "c" }, h("b", { text: pct(D.palabras) }), h("span", { text: "de las palabras ya traducidas en el texto base (preliminar, en revisión)" })),
        h("div", { class: "c" }, h("b", { text: fmt(D.palabrasTotal) }), h("span", { text: "palabras griegas analizadas" })),
        h("div", { class: "c" }, h("b", { text: fmt(D.lemas) }), h("span", { text: "lemas distintos" })),
        h("div", { class: "c" }, h("b", { text: fmt(D.legibles) }), h("span", { text: "versos que ya se pueden leer" })))),
      h("section", { class: "seccion", id: "libros" }, h("div", { class: "in" },
        h("div", { class: "seccion-cab" }, h("span", { class: "eyebrow", text: "La biblioteca" }), h("h2", { text: "Los 27 libros de la Nueva Voluntad" }), h("div", { class: "filete" }),
          h("p", { text: "Cada tramo de la franja es un libro, a la medida de sus palabras; el oro sube con las palabras ya traducidas en el texto base. Desliza el dedo o el puntero por la franja para ver el nombre de cada libro y suelta para abrirlo." })),
        h("div", { class: "orden-libros" }, h("span", { class: "rotulo", text: "Orden" }), selOrden, textoOrden),
        panorama,
        h("div", { class: "panorama-pie" }, h("span", { text: fmt(totalPal) + " palabras griegas" }), h("span", { text: (L[0].t || L[0].n) + " → " + (L[L.length - 1].t || L[L.length - 1].n) })),
        grupos.map(([t, sub, cs]) => h("div", { class: "grupo-libros" }, h("h3", {}, h("span", {}, protegerMay(t)), sub ? h("small", { text: sub.replace(/(\d+)\s+([ad]\.H\.D\.)/g, "$1\u00a0$2").replace(/\bc\.\s+(\d)/g, "c.\u00a0$1") }) : null), h("div", { class: "tarjetas" }, cs.map((c) => tarjeta(libroDe(c)))))),
        CRONO ? h("a", { class: "tira-tiempo", href: "#/cronologia" },
          h("span", { class: "tt-ico" }, svg(ICO.tiempo)),
          h("span", { class: "tt-tx" }, h("b", { text: "Línea del tiempo" }), h("span", { text: "Qué sucedió y cuándo se escribió cada libro: de los anuncios del nacimiento a la destrucción del templo en el año 70 " + ERA_D })),
          h("span", { class: "tt-ir", text: "Abrir" })) : null,
        h("div", { class: "leyenda" }, ["exacto", "casi", "revision", "borrador", "base"].map((k) => h("span", { class: "n-" + k }, h("i"), estadoEt(k)))))));
    const tp = tarjetaPlanHoy(); if (tp) { const hero = $("#vista .hero"); if (hero) hero.after(tp); }
    if (restaurando()) intentarRestaurar();
    else if (irLibros) requestAnimationFrame(() => { const s = $("#libros"); if (s) s.scrollIntoView({ block: "start", behavior: "instant" }); });
    else saltarA(0);
  }
  // Herramientas del lector: se abren desde el botón de la barra superior
  // Novedad continua: ejemplos que cambian solos, con un fundido, mientras están en pantalla (no si se pidió «sin animaciones»
  // ni mientras el puntero o el foco están sobre ellos)
  const barajar = (xs) => { const a = xs.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
  function rotar(el, cada, siguiente, desfase) {
    const paso = () => {
      if (!el.isConnected) return;
      const quieto = ap.mov === "no" || document.hidden || el.matches(":hover") || el.contains(document.activeElement);
      if (!quieto) { el.classList.add("rota-sale"); setTimeout(() => { if (el.isConnected) { siguiente(); el.classList.remove("rota-sale"); } }, 280); }
      setTimeout(paso, cada);
    };
    setTimeout(paso, cada + (desfase || 0));
  }
  const EJ_CAPS = [["JHN", 1], ["MRK", 1], ["MRK", 4], ["MRK", 5], ["MRK", 10], ["1PE", 1], ["ROM", 8], ["HEB", 11], ["JUD", 1], ["EPH", 2], ["REV", 1], ["MAT", 5], ["COL", 1], ["JAS", 1], ["1JN", 4], ["PHP", 2]];
  const EJ_MS = [["MRK", 1, 1], ["JHN", 1, 1], ["JHN", 18, 31], ["MAT", 1, 1], ["ROM", 8, 1], ["HEB", 1, 1], ["1PE", 1, 3], ["LUK", 1, 1], ["REV", 1, 1], ["PHP", 2, 6], ["1CO", 13, 4], ["MRK", 16, 8]];
  const EJ_BQ = ["cuando calmó la tormenta", "la mujer que tocó su manto", "los cinco panes y los dos peces", "caminó sobre el mar", "la ofrenda de la viuda", "el grano de mostaza", "dejen que los niños vengan", "el sembrador salió a sembrar", "amarás a tu prójimo", "no quedará piedra sobre piedra", "vino nuevo en odres viejos", "la higuera sin fruto"];
  const EJ_PREG = ["¿Qué es el texto base?", "¿Qué significan los corchetes?", "¿Qué pasó en el año 70?", "¿Cómo veo los manuscritos?", "¿Qué es un lema?", "¿Qué es un aoristo?", "¿Cómo comparto un verso?", "¿En qué orden están los libros?", "¿Qué significan los colores del texto?", "¿Cómo sigo donde me quedé?"];
  let herrEstado = null;
  function abrirHerramientas() {
    const caps = EJ_CAPS.filter(([c, k]) => { const b = libroDe(c); return b && b.caps.length >= k; });
    const mss = EJ_MS.filter(([c, k]) => { const b = libroDe(c); return b && b.caps.length >= k; });
    // un estado por apertura: al volver atrás a esta ventana se ve lo mismo que se dejó
    const st = herrEstado = { lee: Math.random() * caps.length | 0, an: Math.random() * caps.length | 0, bq: Math.random() * EJ_BQ.length | 0, ms: Math.random() * mss.length | 0 };
    if (st.an === st.lee) st.an = (st.an + 1) % caps.length;
    const ej = {
      lee: () => { const [c, k] = caps[st.lee % caps.length]; return [["Leer ", etLibro(libroDe(c), String(k))], "#/" + c + "/" + k]; },
      an: () => { const [c, k] = caps[st.an % caps.length]; return [["Analizar ", etLibro(libroDe(c), String(k))], "#/" + c + "/" + k + "/a"]; },
      bq: () => { const q = EJ_BQ[st.bq % EJ_BQ.length]; return ["Probar: «" + q + "»", "#/buscar/" + q]; },
      ms: () => { const [c, k, v] = mss[st.ms % mss.length]; return [["Ver ", etLibro(libroDe(c), k + ":" + v)], "#/" + c + "/" + k + "/l/" + v + "/m"]; },
    };
    const hr = (ico, t, p, a, href, clave, n) => {
      const ir = h("span", { class: "herr-ir rota" }, h("span", { class: "herr-tx" }, a), svg(ICO.der));
      const el = h("a", { class: "herr", href }, svg(ico), h("h3", { text: t }), h("p", { text: p }), ir);
      // las que se abren en una ventana (buscador, manuscritos, guía, exportar) van como un paso más de Herramientas:
      // «Atrás» vuelve exactamente aquí y «Adelante» lleva de nuevo a ellas
      const sobre = { bq: () => abrirBusqueda(EJ_BQ[st.bq % EJ_BQ.length]), ms: () => { const [c, k, v] = mss[st.ms % mss.length], b = libroDe(c); if (b) abrirModal(vistaManuscritos({ b, cap: k, v })); }, guia: () => abrirGuia(0) }[clave || (href === "#/guia" ? "guia" : "")];
      if (sobre) el.addEventListener("click", (e) => { if (e.ctrlKey || e.metaKey || e.shiftKey || e.button) return; e.preventDefault(); encima(sobre); });
      if (clave) rotar(ir, 6500, () => { if (herrEstado !== st) return; st[clave]++; if (st.lee % caps.length === st.an % caps.length) st[clave]++; const [a2, h2] = ej[clave](); ir.replaceChildren(h("span", { class: "herr-tx" }, a2), svg(ICO.der)); el.setAttribute("href", h2); }, n * 1600);
      return el;
    };
    const item = (ico, t, p, clave, n) => { const [a, href] = ej[clave](); return hr(ico, t, p, a, href, clave, n); };
    // AF43 (BiEx, 21-nov-2026: «sí, esos cuatro»): Herramientas en cuatro categorías, cada una con su rótulo; una tarjeta impar
    // al final de su categoría ocupa el ancho completo, para que la distribución quede simétrica en dos columnas
    const idCat = (t) => "hc-" + t.normalize("NFD").replace(/[^a-z]/gi, "").toLowerCase();
    const cat = (t, ...els) => h("section", { class: "herr-cat", id: idCat(t), "aria-label": t }, h("p", { class: "rotulo herr-cat-t", text: t }), h("div", { class: "herramientas en-modal" }, els));
    // arriba, las cuatro categorías para ir directo a cada una (2 × 2 en teléfonos, una fila en pantallas anchas; sin desplazamiento lateral)
    const ir = (t) => { const s = document.getElementById(idCat(t)), c = s && s.closest(".m-cuerpo"); if (!c) return; const suave = !(ap.mov === "no" || (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches)); c.scrollBy({ top: s.getBoundingClientRect().top - c.getBoundingClientRect().top - 6, behavior: suave ? "smooth" : "auto" }); };
    const saltos = h("nav", { class: "herr-saltos", "aria-label": "Categorías de Herramientas" }, ["Leer y guardar", "El griego a fondo", "Historia del texto", "Juego y app"].map((t) => h("button", { type: "button", class: "herr-salto", onclick: () => ir(t), text: t })));
    abrirModal(() => cajaModal(cabModal("Herramientas", "Leer, analizar, comparar"), [saltos,
      cat("Leer y guardar",
        item(ICO.libro, "Lectura", "Cada capítulo en su estado actual. Toca un verso y se abre su griego palabra por palabra.", "lee", 0),
        item(ICO.buscar, "Buscador inteligente", "Escribe como lo recuerdes: una escena, un nombre, una cita, una palabra griega o una pregunta. Entiende también las palabras de otras traducciones.", "bq", 2),
        hr(ICO.tiempo, "Planes de lectura", "La Nueva Voluntad en orden χrοnοlόgικο en 30, 90 días o un año, los relatos de la vida de YēshŪ́aʿ y las cartas: marca cada lectura y sigue donde quedaste.", "Elegir un plan", "#/planes"),
        (() => { const el = hr(ICO.historial, "Historial", "Las últimas 24 citas que consultaste, capítulos y versos, para volver a ellas con un toque.", "Abrir", "#/"); el.addEventListener("click", (e) => { e.preventDefault(); encima(() => abrirHistorial()); }); return el; })(),
        hr(ICO.marcador, "Mis marcadores y diario", "Los versos que marcaste en 12 colores, tus notas y tu diario cronológico de estudio sincronizado con la nube.", "Abrir", "#/marcadores"),
        hr(ICO.sinopsis, "Mesa sinóptica libre", "Compara cualquier par de versos lado a lado con sus lemas y raíces griegas compartidas iluminadas en vivo.", "Comparar versos", "#/sinopsis"),
        (() => { const el = hr(ICO.descargar, "Exportar a Obsidian", "Capítulos, estudios y tus marcadores como notas .md con el mejor formato: propiedades, avisos plegables, colores de BiEx y versos enlazables.", "Exportar", "#/"); el.addEventListener("click", (e) => { e.preventDefault(); encima(() => abrirExportar()); }); return el; })(),
        hr(ICO.balanza, "Falacias lógicas", "Para conversar sobre la Escritura con altura: los errores de razonamiento más comunes y cómo responder sin contiendas innecesarias.", "Aprender", "#/falacias")),
      cat("El griego a fondo",
        item(ICO.lupa, "Análisis morfológico", "Forma, transliteración, lema, tiempo, voz, modo, caso, función en la oración y ediciones de cada palabra.", "an", 1),
        hr(ICO.constelacion, "Constelación del léxico", "Red visual interactiva de raíces griegas, lemas, referencias cruzadas y tus notas en 12 colores.", "Explorar el mapa", "#/constelacion"),
        hr(ICO.lista, "Concordancia", "Todas las apariciones de un lema en la Nueva Voluntad, con su forma, su traducción y su verso. También por su código Strong.", "Buscar una palabra", "#/lema"),
        hr(ICO.raiz, "Diccionario de raíces", "Las palabras de la Nueva Voluntad reunidas por su raíz: prefijos visibles, formación, origen hebreo o arameo, tabla de formas y cómo se traduce cada una.", "Explorar las raíces", "#/raices"),
        hr(ICO.tarjetas, "Repaso de raíces · 1 min", "Tarjetas breves de repaso espaciado con las familias griegas más importantes de la Nueva Voluntad, sincronizadas con tu cuenta.", "Repasar hoy", "#/raices/repaso"),
        hr(ICO.filtros, "Búsqueda morfológica", "Combina rasgos: los aoristos pasivos de un libro, los participios de un lema, los genitivos de un capítulo…", "Buscar", "#/buscar"),
        hr(ICO.texto, "Analizar texto griego", "Escribe o pega cualquier pasaje en griego y toca cada palabra: su lema, su morfología, su código Strong, su pronunciación y su raíz.", "Analizar un texto", "#/analizar")),
      cat("Historia del texto",
        item(ICO.manuscrito, "Manuscritos antiguos", "Cada verso en los papiros y códices más antiguos: qué dicen, en qué difieren y su transcripción letra por letra.", "ms", 3),
        hr(ICO.mapa, "Atlas bíblico", "Mapa interactivo del Mediterráneo y el Levante: los lugares de la vida de YēshŪ́aʿ, los viajes de Pαῦlος [Pablo] y las 7 convocaciones fuera [asambleas] de Ἀpοκάlυpsις.", "Explorar el mapa", "#/mapa"),
        hr(ICO.tiempo, "Línea del tiempo", "Los acontecimientos y la fecha en que se escribió cada libro, hasta la destrucción del templo en el año 70.", "Abrir", "#/cronologia"),
        hr(ICO.tiempo, "Por qué estas fechas", "Las razones de la datación temprana que sigue BiEx: el año 70, el final de Prάc̅ṣεις y el templo en presente.", "Leer", "#/fechas"),
        hr(ICO.chispa, "Lo que pocos saben", "Datos de la historia del texto y de las traducciones que cambian la manera de leer, con sus pasajes y sus fuentes.", "Descubrir", "#/datos"),
        hr(ICO.sinopsis, "La fuente Q", "Mattáy, Μᾶrκος y Lουκᾶς comparados palabra por palabra en griego: la hipótesis de la fuente Q, sus argumentos y su historia.", "Explorar", "#/fuente-q"),
        hr(ICO.podio, "Ranking de traducciones", "Las 16 ediciones bíblicas menos mal traducidas al español, según la comparación de BiEx con los textos más antiguos.", "Ver el ranking", "#/ranking")),
      cat("Juego y app",
        hr(ICO.juego, "Escudriña · el juego", "Cada verso que lees de verdad te da experiencia: misiones pequeñas cada día, hallazgos raros, clasificaciones por ciudad, departamento o estado y país, y tu árbol de la siembra. Se entra con un apodo.", "Jugar", "#/escudrina"),
        hr(ICO.nube, "Instalar y leer sin conexión", "BiEx como aplicación con su propio ícono y todo su contenido guardado en tu dispositivo para usarlo sin internet.", "Abrir", "#/app"),
        hr(ICO.guia, "Guía animada", "Todo lo que puedes hacer, en pocos pasos, con imágenes en movimiento y textos breves que se pueden escuchar.", "Ver la guía", "#/guia")),
      redesBiex()]));
  }
  // Historial: las últimas 24 citas consultadas; tocar una lleva a ella (y «Atrás» vuelve a esta lista)
  function abrirHistorial() {
    abrirModal(() => {
      const l = (store.get("historial", []) || []).filter((x) => x && libroDe(x.c));
      const hace = (t) => { const sg = (Date.now() - t) / 1000; return sg < 60 ? "hace un momento" : sg < 3600 ? "hace " + Math.round(sg / 60) + " min" : sg < 86400 ? "hace " + Math.round(sg / 3600) + " h" : new Date(t).toLocaleDateString("es", { day: "numeric", month: "short" }); };
      const ruta = (x) => "#/" + x.c + "/" + x.cap + (x.m === "a" ? "/a" + (x.v ? "/" + x.v : "") : (x.v ? "/l/" + x.v : ""));
      const lista = l.length ? h("ol", { class: "hist" }, l.map((x) => h("li", {}, h("a", { href: ruta(x) },
        h("span", { class: "hist-ref" }, etLibro(libroDe(x.c), x.cap + (x.v ? ":" + x.v : ""))),
        h("span", { class: "hist-m", text: (x.m === "a" ? "Análisis" : "Lectura") + " · " + hace(x.t) }), svg(ICO.der)))))
        : h("p", { class: "vacio", text: "Aún no hay citas consultadas: los capítulos y los versos que abras aparecerán aquí, hasta 24." });
      const borrar = l.length ? h("button", { class: "btn chico", type: "button", onclick: (ev) => {
        const bt = ev.currentTarget;
        if (!bt.dataset.seguro) { bt.dataset.seguro = "1"; bt.textContent = "Tocar otra vez para borrarlo"; setTimeout(() => { if (bt.isConnected) { delete bt.dataset.seguro; bt.textContent = "Borrar el historial"; } }, 4000); return; }
        store.set("historial", []); pintarModal();
      } }, "Borrar el historial") : null;
      return cajaModal(cabModal("Historial", l.length === 1 ? "La última cita consultada" : l.length ? "Las últimas " + l.length + " citas consultadas" : "Las últimas 24 citas consultadas"), lista, borrar ? h("div", { class: "m-pie" }, borrar) : null);
    });
  }
  // Canales de Biblia Exacta (YouTube y Facebook), con íconos genéricos propios: sin logotipos de las marcas
  function redesBiex() {
    const ext = (ico, t, p, a, href) => h("a", { class: "herr herr-ext", href, target: "_blank", rel: "noopener" }, svg(ico), h("h3", { text: t }), h("p", { text: p }),
      h("span", { class: "herr-ir" }, h("span", { class: "herr-tx", text: a }), svg(ICO.externo)));
    return h("section", { class: "herr-redes", "aria-label": "Biblia Exacta en las redes" }, h("p", { class: "rotulo", text: "Biblia Exacta en las redes" }),
      h("div", { class: "herramientas en-modal redes" },
        ext(ICO.video, "Canal de YouTube", "Los videos de Biblia Exacta, para ver y escuchar el trabajo sobre la Escritura.", "Ver el canal", "https://youtube.com/@bibliaexacta/"),
        ext(ICO.comunidad, "Página de Facebook", "Publicaciones y novedades de Biblia Exacta, para seguir el proyecto de cerca.", "Visitar la página", "https://www.facebook.com/share/19kHkR2aWw/")));
  }
  async function abrirPalabraPortada(i) {
    const P = esc.dest || { c: "JHN", cap: 1, v: 1, i0: 0, p: D.portada.p }, b = libroDe(P.c);
    const botones = $$(".interlineal .il");
    const marcar = (k) => botones.forEach((x, j) => x.setAttribute("aria-pressed", j === k ? "true" : "false"));
    marcar(i);
    const yaListo = !!T && !!cache["datos/analisis/" + P.c + ".json"] && !!cache["datos/libros/" + P.c + ".json"];
    if (!yaListo) abrirModal(cargandoModal(refCorta(b, P.cap, P.v)), () => marcar(-1));
    try {
      const [toks, Lc] = await Promise.all([versoTokens(P.c, P.cap, P.v), lectura(P.c)]);
      let j = (P.i0 || 0) + i;
      if (!toks[j] || T.F[toks[j][0]] !== P.p[i].g) j = Math.max(0, toks.findIndex((t) => T.F[t[0]] === P.p[i].g));
      const L = (Lc.caps[P.cap] || []).find((x) => x.v === P.v);
      const fn = vistaPalabra({ b, cap: P.cap, v: P.v, toks, i: j, L, desde: "portada", alMover: (k) => marcar(k - (P.i0 || 0)) });
      if (yaListo) abrirModal(fn, () => marcar(-1));
      else { if (!modal.open) return; reemplazar(fn); }
    } catch (e) {
      const errFn = () => cajaModal(cabModal("No se pudo abrir"), fallo("No se pudo cargar el análisis."));
      if (modal.open) reemplazar(errFn); else abrirModal(errFn, () => marcar(-1));
    }
  }

  // ------------------------------------------------------------------ libro
  const esc = { libro: null, cap: 0, modo: "", lista: null };
  let syncMkRapido = null;

  let hojaHecha = ""; // libro/capítulo cuyo texto completo está puesto en la vista
  async function vistaLibro(c, cap, modo, v, i) {
    const b = libroDe(c);
    if (!b) return noEncontrado();
    navActual("#/libros");
    cap = Math.max(1, Math.min(b.caps.length, cap || 1));
    document.title = nombreLibro(b) + " " + cap + " · BiEx";
    const mismo = esc.libro === c && esc.cap === cap && esc.modo === modo && esc.lorg === !!prefs.lorg && $(".libro", vista());
    // Neon (23-nov-2026): conservar el capítulo en pantalla al cambiar de modo (p. ej., Lectura → Análisis desde una palabra)
    // elimina el parpadeo blanco de «Cargando…» mientras se dibuja la nueva vista
    const mismoCap = hojaHecha === c + "/" + cap && !!$(".libro", vista());
    const enSitio = RP.anclaEnSitio != null && mismoCap;
    // si el libro (y el análisis si aplica) ya está en RAM, no borrar el capítulo ni mostrar spinner de carga (0 flasheos)
    const yaEnRam = !!cache["datos/libros/" + c + ".json"] && (modo !== "a" || (!!T && !!cache["datos/analisis/" + c + ".json"]));
    const sinVeloCarga = enSitio || yaEnRam || (mismoCap && (modo !== "a" || (!!T && !!cache["datos/analisis/" + c + ".json"])));
    const anclaS = RP.anclaEnSitio; RP.anclaEnSitio = null;
    const irIni = RP.irInicio; RP.irInicio = null;
    if (v == null) esc.vFoco = null;
    esc.libro = c; esc.cap = cap; esc.modo = modo; esc.lorg = !!prefs.lorg;
    if (mismo) {
      if (v == null) { if (irIni) { saltarA(0); velar(false); } else if (!intentarRestaurar()) { saltarA(0); velar(false); } }
      else enfocar(v, i);
      juegoCapitulo(c, cap, modo); return;
    }
    if (!sinVeloCarga) { ponerLibro(estructuraLibro(b, cap, modo, null, [cargando()])); hojaHecha = ""; if (v == null) { if (irIni) saltarA(0); else alTope(); } }
    let Lc, A = null;
    try {
      const pA = modo === "a" ? Promise.all([analisis(c), tablas()]) : null; // en paralelo con la lectura
      Lc = await lectura(c);
      if (pA) [A] = await pA;
    } catch (e) { vista().replaceChildren(fallo("No se pudo cargar " + nombreLibro(b) + ".")); velar(false); return; }
    if (esc.libro !== c || esc.cap !== cap || esc.modo !== modo) return;
    const versos = Lc.caps[cap] || [];
    esc.versos = versos;
    if (syncMkRapido) syncMkRapido();
    const cuerpo = modo === "a" ? cuerpoAnalisis(b, cap, A.caps[cap] || [], versos) : cuerpoLectura(b, cap, versos);
    ponerLibro(estructuraLibro(b, cap, modo, versos, cuerpo));
    hojaHecha = c + "/" + cap;
    if (enSitio) { aplicarAnclaEnSitio(anclaS); fundirTexto(); }
    store.set("ultimo", { c, cap, m: modo, v: v || null });
    historial(c, cap, v || null, modo);
    if (v == null) {
      if (!enSitio) {
        if (irIni) { saltarA(0); velar(false); }
        else if (!intentarRestaurar()) { saltarA(0); velar(false); }
      } else velar(false);
    } else enfocar(v, i);
    juegoCapitulo(c, cap, modo);
    // Mientras se lee (solo con buena conexión), precarga análisis, referencias, léxico y manuscritos del capítulo para abrir palabras y notas al instante sin saltos
    if (!redLenta()) {
      if (modo !== "a") setTimeout(() => { if (esc.libro === c && !redLenta()) { analisis(c).catch(() => {}); tablas().catch(() => {}); refsDe(c).catch(() => {}); lexico().catch(() => {}); testigos().catch(() => {}); msCap(c, cap).catch(() => {}); } }, 450);
      else setTimeout(() => { if (esc.libro === c && !redLenta()) { refsDe(c).catch(() => {}); lexico().catch(() => {}); testigos().catch(() => {}); msCap(c, cap).catch(() => {}); } }, 300);
    }
  }
  // Micro-barra rápida sobre el verso en lectura (Neon, 23-nov-2026): una sola capa ligera dentro de .hoja (cero nodos por verso,
  // En escritorio responde al puntero/teclado sin alterar el tamaño del verso; en móvil el marcador rápido vive en el botón
  // flotante encima de Compartir (.saltos-rap .sr-mk) para nunca chocar con la selección nativa del navegador.
  function herramientasVerso(hoja, b, cap, versos) {
    if (!hoja || !versos || !versos.length) return;
    const esTactil = !!(window.matchMedia && matchMedia("(pointer: coarse)").matches);
    if (esTactil) return;
    const porV = new Map(versos.map((x) => [x.v, x]));
    let vAct = 0, elAct = null, palAb = false, tOc = 0, scroll0 = 0;
    const pal = h("div", { class: "vq-pal", hidden: true, role: "group", "aria-label": "Elegir color de marcador" });
    const btnCop = h("button", { type: "button", class: "vq-btn", title: "Copiar verso con cita y enlace BiEx", "aria-label": "Copiar verso con cita y enlace" }, svg(ICO.copiar));
    const btnMk = h("button", { type: "button", class: "vq-btn vq-mk", title: "Marcar este verso con color", "aria-label": "Marcar verso", "aria-expanded": "false" }, svg(ICO.marcador));
    const bar = h("div", { class: "vq-bar", hidden: true }, btnCop, btnMk, pal);
    for (const ev of ["pointerdown", "touchstart", "click"]) bar.addEventListener(ev, (e) => e.stopPropagation());
    const cerrarPal = () => { palAb = false; pal.hidden = true; btnMk.setAttribute("aria-expanded", "false"); };
    const ocultar = () => { cerrarPal(); bar.hidden = true; vAct = 0; elAct = null; };
    const pintarPal = () => {
      const m = MK.get(b.c, cap, vAct) || {};
      btnMk.classList.toggle("on", !!m.col);
      if (m.col) btnMk.style.setProperty("--mkc", "var(--mk-" + m.col + ")"); else btnMk.style.removeProperty("--mkc");
      pal.replaceChildren(...MK.temas().map(([k, nom]) => h("button", { type: "button", class: "vq-dot mk-" + k + (m.col === k ? " sel" : ""), title: nom, "aria-label": nom, "aria-pressed": String(m.col === k),
        onclick: () => { const ya = (MK.get(b.c, cap, vAct) || {}).col === k; MK.poner(b.c, cap, vAct, { col: ya ? null : k }); pintarPal(); avisar(ya ? "Marca quitada" : "Marcado: " + nom); cerrarPal(); } })),
        h("button", { type: "button", class: "vq-nota-b", title: "Escribir nota de estudio", onclick: () => { const vv = vAct; ocultar(); abrirVerso(b, cap, vv, false, null, true); } }, "Nota"));
    };
    btnCop.addEventListener("click", async () => {
      const x = porV.get(vAct); if (!x) return;
      const txt = textoPlano((txtVerso(x).textContent || "").replace(/\s+/g, " ").trim());
      const hh0 = "#/" + b.c + "/" + cap + "/l/" + x.v;
      let hh = hh0;
      const inv = (store.get("jg:t", null) && store.get("jg:mio", null)) || (await semilla());
      if (inv && /^[a-z0-9]{4,12}$/.test(inv)) hh = "#/escudrina/i/" + inv + "/" + hh0.slice(2);
      const url = enlacePublico(hh);
      const salida = "«" + txt + "»\n— " + nombreLibro(b) + " " + cap + ":" + x.v + " · Biblia Exacta\n" + url;
      try {
        await navigator.clipboard.writeText(salida);
        avisar("Verso copiado con cita y enlace");
        try { if (window.BiExJuego && BiExJuego.compartido) BiExJuego.compartido(hh0); } catch (er) { /* sin juego */ }
      } catch (e) { compartir(nombreLibro(b) + " " + cap + ":" + x.v, txt, hh0); }
    });
    btnMk.addEventListener("click", () => {
      palAb = !palAb;
      if (palAb) { pintarPal(); pal.hidden = false; btnMk.setAttribute("aria-expanded", "true"); }
      else cerrarPal();
    });
    const posicionar = (el, abrirPal) => {
      if (!el || document.documentElement.classList.contains("desplazando") || modal.open) return;
      const v = +el.id.slice(1); if (!porV.has(v)) return;
      clearTimeout(tOc);
      const cambio = vAct !== v;
      vAct = v; elAct = el; scroll0 = window.scrollY;
      if (cambio) cerrarPal();
      const hr = hoja.getBoundingClientRect(), vr = el.getBoundingClientRect();
      if (!hr.width || !vr.height) return;
      const m = MK.get(b.c, cap, v) || {};
      btnMk.classList.toggle("on", !!m.col);
      if (m.col) btnMk.style.setProperty("--mkc", "var(--mk-" + m.col + ")"); else btnMk.style.removeProperty("--mkc");
      const y = Math.max(4, vr.top - hr.top - 28);
      const xRight = Math.max(8, hr.right - vr.right + 6);
      bar.style.top = y.toFixed(1) + "px";
      bar.style.right = xRight.toFixed(1) + "px";
      if (abrirPal) { pintarPal(); palAb = true; pal.hidden = false; btnMk.setAttribute("aria-expanded", "true"); }
      bar.hidden = false;
    };
    hoja.addEventListener("pointerover", (e) => {
      if (e.pointerType !== "mouse") return;
      if (bar.contains(e.target)) { clearTimeout(tOc); return; }
      const vEl = e.target.closest && e.target.closest(".vl, .vs");
      if (vEl && hoja.contains(vEl)) posicionar(vEl, false);
    });
    hoja.addEventListener("pointerleave", () => { clearTimeout(tOc); tOc = setTimeout(() => { if (!palAb) ocultar(); }, 220); });
    hoja.addEventListener("focusin", (e) => {
      if (performance.now() - (M.cerradaEn || -1e9) < 600) return;
      const vEl = e.target.closest && e.target.closest(".vl, .vs");
      if (vEl && hoja.contains(vEl)) posicionar(vEl, false);
    });
    const onScroll = () => { if (!bar.isConnected) { window.removeEventListener("scroll", onScroll); return; } if (!bar.hidden && Math.abs(window.scrollY - scroll0) > 18) ocultar(); };
    window.addEventListener("scroll", onScroll, { passive: true });
    hoja.append(bar);
  }
  // Sin parpadeo dentro de un libro: la ficha del libro (anillo y cifras, con su animación) se conserva y solo se cambia
  // lo de debajo (capítulos, barra y texto) al entrar a otro capítulo o cuando llegan los datos
  function ponerLibro(nuevo) {
    const viejo = $(".libro", vista());
    if (viejo && viejo.dataset.c === nuevo.dataset.c && viejo.children.length === 2 && nuevo.children.length === 2) viejo.replaceChild(nuevo.children[1], viejo.children[1]);
    else vista().replaceChildren(nuevo);
    if (typeof observarPegada === "function") observarPegada();
    pausarFuera(vista());
  }
  function estructuraLibro(b, cap, modo, versos, cuerpo) {
    const vb = volverBusqueda && volverBusqueda.ruta.split("/").slice(0, 3).join("/") === "#/" + b.c + "/" + cap ? volverBusqueda : null;
    const hoja = h("section", { class: "hoja" + (modo !== "a" && prefs.nivel ? " con-filtro" : "") + (modo !== "a" && prefs.disp !== "continuo" && store.get("jg:t", null) ? " jg-pies" : "") }, h("i", { class: "bh-centinela", "aria-hidden": "true" }), barraHoja(b, cap, modo, versos),
      vb ? h("button", { class: "chip-volver", type: "button", onclick: () => abrirBusqueda(vb.q) }, svg(ICO.atras), h("span", { text: "Volver a los resultados de «" + vb.q + "»" })) : null,
      ...cuerpo.filter(Boolean));
    if (modo !== "a" && versos && versos.length) {
      herramientasVerso(hoja, b, cap, versos);
      // Precarga silenciosa del análisis griego del libro actual para abrir cualquier palabra tocada al instante y sin brinco
      if (!(navigator.connection && navigator.connection.saveData)) enCalma(() => { analisis(b.c).catch(() => {}); tablas().catch(() => {}); }, 600);
    }
    return h("div", { class: "libro", "data-c": b.c }, bandaLibro(b),
      h("div", { class: "in libro-grid" },
        h("aside", { class: "riel", "aria-label": "Capítulos y versos" }, navContenido(b, cap, versos)),
        hoja));
  }
  function anilloSvg(p) {
    const r = 31, cir = 2 * Math.PI * r;
    return svg('<circle cx="37" cy="37" r="' + r + '" fill="none" stroke="var(--hoja-3)" stroke-width="3"/>' +
      '<circle cx="37" cy="37" r="' + r + '" fill="none" stroke="var(--oro)" stroke-width="3" stroke-linecap="round" stroke-dasharray="' + (cir * p / 100).toFixed(1) + " " + cir.toFixed(1) + '" transform="rotate(-90 37 37)"/>' +
      '<text x="37" y="43" text-anchor="middle" class="num">' + Math.round(p) + '%</text>', "0 0 74 74");
  }
  function bandaLibro(b) {
    const p = Math.max(0, Math.min(100, b.palabras));
    const completos = b.total - b.conteo.base;
    // tres zonas: las cifras a la izquierda, el anillo del avance en el centro y el libro a la derecha; en teléfonos el libro
    // arriba y debajo las cifras repartidas a los dos lados del anillo (todo en rem: crece y se reduce con el tamaño elegido)
    const cifra = (k, n, t) => h("div", { class: "bc " + k }, h("b", { text: fmt(n) }), h("span", { text: t }));
    return h("header", { class: "banda" }, h("div", { class: "in banda-g" },
      h("div", { class: "banda-tit" },
        h("span", { class: "eyebrow", text: "Libro " + numLibro(b) + " de 27 de la Nueva Voluntad " + nombreOrden() }),
        h("h1", {}, h("a", { class: "banda-lib", href: (MEMLIB && MEMLIB.h) || "#/libros", title: "Volver a la lista de libros", onclick: irALista },
          h("span", { class: "tr", text: b.t || b.n }), b.t ? h("span", { class: "es", text: tradQ(b) }) : null)),
        fechaEscrito(b) ? h("a", { class: "banda-fecha", href: "#/cronologia" }, svg(ICO.tiempo), "Escrito c. " + fechaEscrito(b).replace(/^c\. /, "") + (/H\.D\./.test(fechaEscrito(b)) ? "" : " " + ERA_D) + (fechaNarra(b) ? " · narra " + fechaNarra(b) : "")) : null),
      h("div", { class: "banda-ani" }, anilloSvg(p), h("p", { text: "de las palabras ya traducidas en el texto base (preliminar, en revisión)" })),
      h("div", { class: "mini-cifras" },
        cifra("c1", b.total, "versos"),
        cifra("c2", b.nPal || 0, "palabras"),
        cifra("c3", b.nLem || 0, "lemas"),
        completos ? cifra("c4", completos, "con traducción completa") : cifra("c4", b.caps.length, b.caps.length === 1 ? "capítulo" : "capítulos"))));
  }
  // Progreso local de lectura por verso y por capítulo (combina marcas de Escudriña en jg:cf / jg:rp y marcas del lector en LEI)
  function lecturaVersoNivel(c, cap, v) {
    const lc = c + "." + cap;
    const cf = ((store.get("jg:cf", null) || {})[lc] || "")[v - 1];
    const n = cf ? parseInt(cf, 36) : 0;
    const rp = ((store.get("jg:rp", null) || {})[lc] || "")[v - 1] === "1";
    const rep = store.get("jg:rep", null);
    const repHoy = !!(rep && Array.isArray(rep.k) && rep.k.includes(lc + "." + v));
    if (n >= 2 || rp || repHoy) return 2;
    if (n >= 1 || LEI.es(c, cap, v)) return 1;
    return 0;
  }
  function progresoCapLocal(b, cap) {
    const C = b.caps[cap - 1] || {}, tot = C.total || 0;
    let hechos = 0, rep = 0, ult = 0;
    for (let v = 1; v <= tot; v++) {
      const nv = lecturaVersoNivel(b.c, cap, v);
      if (nv >= 1) { hechos++; ult = v; }
      if (nv >= 2) rep++;
    }
    return { hechos, rep, tot, ult, completo: tot > 0 && hechos >= tot, parcial: hechos > 0 && hechos < tot };
  }
  function continuarEnLibro(b) {
    let ultParcial = null, priPend = null, alguno = false;
    const ult = store.get("ultimo", null);
    for (const C of b.caps) {
      const pr = progresoCapLocal(b, C.c);
      if (pr.hechos > 0) alguno = true;
      if (pr.parcial) {
        let sigV = Math.min(pr.tot, pr.ult + 1);
        for (let v = 1; v <= pr.tot; v++) { if (lecturaVersoNivel(b.c, C.c, v) === 0 && v > pr.ult) { sigV = v; break; } }
        if (lecturaVersoNivel(b.c, C.c, sigV) >= 1) { for (let v = 1; v <= pr.tot; v++) if (lecturaVersoNivel(b.c, C.c, v) === 0) { sigV = v; break; } }
        const cand = { cap: C.c, v: sigV, hechos: pr.hechos, tot: pr.tot };
        if (ult && ult.c === b.c && ult.cap === C.c) return cand;
        ultParcial = cand;
      } else if (!pr.completo && !priPend) {
        priPend = { cap: C.c, v: 1, hechos: 0, tot: pr.tot };
      }
    }
    if (!alguno) return null;
    return ultParcial || priPend;
  }
  // Capítulos y teselas numeradas de los versos (en el riel de escritorio y en la ventana del móvil)
  function navContenido(b, cap, versos, alElegir) {
    // (BiEx, 14-nov-2026) en un libro que no está abierto, tocar un capítulo muestra sus versos para elegir también el verso
    const otro = !versos || versos === "num";
    const enModal = !!alElegir;
    const irRuta = (ruta) => { if (enModal) irDesdeModal(ruta); else location.hash = ruta; };
    const cont = continuarEnLibro(b);
    const btnCont = cont ? h("button", { type: "button", class: "nav-cont", onclick: () => irRuta("#/" + b.c + "/" + cont.cap + "/" + (esc.modo === "a" ? "a" : "l") + "/" + cont.v) },
      h("span", {}, "Continuar donde quedé · ", h("b", { text: "Cap. " + cont.cap + ":" + cont.v })),
      h("small", { text: cont.hechos ? cont.hechos + "/" + cont.tot + " leídos ›" : "Siguiente cap. ›" })) : null;
    let hayMarcasCap = false;
    const caps = h("div", { class: "caps", role: "group", "aria-label": "Capítulos" }, b.caps.map((C) => {
      const pr = progresoCapLocal(b, C.c);
      if (pr.hechos > 0) hayMarcasCap = true;
      const clLei = pr.completo ? " lei-c" : pr.parcial ? " lei-p" : "";
      const txtLei = pr.completo ? " · Capítulo leído" : pr.parcial ? " · Leídos " + pr.hechos + " de " + pr.tot : "";
      const rutaC = "#/" + b.c + "/" + C.c + (esc.modo === "a" ? "/a" : "");
      return h("a", {
        class: "cap" + clLei, href: rutaC, "aria-current": C.c === cap ? "true" : "false",
        title: "Capítulo " + C.c + (C.pal != null ? ": palabras traducidas " + pctEnt(C.pal) + " · revisión " + pctEnt(C.pct) : ": " + pct(C.pct) + " de avance") + txtLei,
        // (BiEx, 21-nov-2026, AF31) en el Análisis, tocar otro capítulo también muestra sus versos para elegir el verso
        onclick: (otro || (esc.modo === "a" && C.c !== cap)) && C.total > 1
          ? (e) => { e.preventDefault(); empujar(vistaNavegador(b, C.c, "num")); }
          : (enModal ? (e) => { e.preventDefault(); irDesdeModal(rutaC); } : null) }, String(C.c),
        C.pal != null ? h("i", { class: "cap-pal", style: "width:" + Math.min(100, C.pal) + "%" }) : null, h("i", { style: "width:" + Math.min(100, C.pct) + "%" }));
    }));
    const leyLectura = (hayLeido, hayRep) => (hayLeido || hayRep) ? h("div", { class: "nav-ley-lei", "aria-hidden": "true" },
      hayLeido ? h("span", {}, h("i", { class: "nl-o" }), "Leído") : null,
      hayRep ? h("span", {}, h("i", { class: "nl-r" }), "Repasado") : null) : null;
    const cabConFiltro = (rot, caja, activo) => {
      if (!activo) return h("p", { class: "rotulo", text: rot });
      const bF = h("button", { type: "button", class: "nav-sin-leer", "aria-pressed": "false", title: "Destacar lo que falta por leer",
        onclick: () => { const on = caja.classList.toggle("solo-sin-leer"); bF.setAttribute("aria-pressed", String(on)); } }, "Sin leer");
      return h("div", { class: "nav-rot-cab" }, h("p", { class: "rotulo", text: rot }), bF);
    };
    if (versos === "num" && cap) {
      const C = b.caps[cap - 1] || {}, ir = (v) => irRuta("#/" + b.c + "/" + cap + "/" + (esc.modo === "a" ? "a" : "l") + (v ? "/" + v : ""));
      let hayL = false, hayR = false;
      const tes = Array.from({ length: C.total || 0 }, (_, i) => {
        const vn = i + 1, nv = lecturaVersoNivel(b.c, cap, vn);
        if (nv === 1) hayL = true; else if (nv >= 2) hayR = true;
        const cl = nv >= 2 ? " lei-r" : nv === 1 ? " lei-v" : "";
        const etL = nv >= 2 ? " · Repasado" : nv === 1 ? " · Leído" : "";
        return h("button", { type: "button", class: "tesela n-x" + cl, title: cap + ":" + vn + etL, "aria-label": "Verso " + vn + etL, onclick: () => ir(vn) }, String(vn));
      });
      const tesBox = h("div", { class: "teselas", role: "group", "aria-label": "Versos del capítulo " + cap }, tes);
      return [
        btnCont,
        h("div", {}, cabConFiltro("Capítulos", caps, hayMarcasCap), caps, leyLectura(hayMarcasCap, false)),
        h("div", {}, cabConFiltro("Versos del capítulo " + cap, tesBox, hayL || hayR), tesBox, leyLectura(hayL, hayR)),
        h("div", { class: "nav-ir" }, h("button", { class: "btn oro", type: "button", onclick: () => ir(0) }, h("span", { text: (esc.modo === "a" ? "Analizar el capítulo " : "Leer el capítulo ") + cap })))];
    }
    let hayLV = false, hayRV = false;
    const teselas = versos ? h("div", { class: "teselas", role: "group", "aria-label": "Versos del capítulo " + cap }, versos.map((x) => {
      const nv = lecturaVersoNivel(b.c, cap, x.v);
      if (nv === 1) hayLV = true; else if (nv >= 2) hayRV = true;
      const clL = nv >= 2 ? " lei-r" : nv === 1 ? " lei-v" : "";
      const etL = nv >= 2 ? " · Repasado" : nv === 1 ? " · Leído" : "";
      return aplicarMarca(h("button", {
        type: "button", class: "tesela n-" + x.n + clL + (esc.modo !== "a" && prefs.nivel && !pasaFiltro(x, prefs.nivel) ? " fuera" : ""), "data-v": x.v, title: cap + ":" + x.v + " · " + estadoEt(x.n) + etL, "aria-label": "Verso " + x.v + ", " + estadoEt(x.n) + etL,
        onclick: () => { if (enModal) irDesdeModal(() => irVerso(x.v)); else irVerso(x.v); } }, String(x.v)), marcaDe(b, cap, x.v));
    })) : null;
    const usados = versos ? ["exacto", "casi", "revision", "borrador", "base"].filter((k) => versos.some((x) => x.n === k)) : [];
    return [
      btnCont,
      h("div", {}, cabConFiltro("Capítulos", caps, hayMarcasCap), caps, leyLectura(hayMarcasCap, false)),
      teselas ? h("div", {}, cabConFiltro("Versos del capítulo " + cap, teselas, hayLV || hayRV), teselas, leyLectura(hayLV, hayRV)) : null,
      usados.length ? h("div", { class: "leyenda" }, usados.map((k) => h("span", { class: "n-" + k }, h("i"), estadoEt(k)))) : null];
  }
  function irVerso(v) {
    // un verso oculto por el filtro de niveles: se quita el filtro y se abre allí
    if (esc.modo !== "a" && prefs.nivel && !document.getElementById("v" + v)) { prefs.nivel = ""; guardarPrefs(); const c = esc.libro, cap = esc.cap; esc.libro = null; vistaLibro(c, cap, "l", v, null); return; }
    ponerHash("#/" + esc.libro + "/" + esc.cap + "/" + (esc.modo === "a" ? "a" : "l") + "/" + v);
    enfocar(v, null);
  }
  // Filtro de niveles en la lectura: «borrador» = en traducción o más avanzados, etc.; «base» = solo texto base
  const NIVELES = ["base", "borrador", "revision", "casi", "exacto"];
  // El filtro refleja el avance real: además de los niveles, el texto base se separa en versos con todas sus palabras ya
  // traducidas y versos que aún muestran griego sin traducción fijada (BiEx, 1-nov-2026)
  const FILTROS = [["", "Todos los versos"], ["borrador", "Con traducción (en traducción o más)"], ["revision", "En revisión o más"], ["casi", "Casi exactos o más"], ["exacto", "Exactos"], ["base", "Solo texto base"], ["base-completo", "Texto base con todas sus palabras traducidas"], ["base-griego", "Texto base con griego por traducir"]];
  const FILTRO_CORTO = { borrador: "Con traducción", "base-completo": "Base completo", "base-griego": "Base con griego" };
  const pasaFiltro = (x, f) => !f || (f === "base" ? x.n === "base" : f === "base-completo" ? x.n === "base" && +x.k >= 100 : f === "base-griego" ? x.n === "base" && +x.k < 100 : NIVELES.indexOf(x.n) >= NIVELES.indexOf(f));
  const nombreFiltro = (f) => (FILTROS.find((x) => x[0] === f) || FILTROS[0])[1];
  function barraHoja(b, cap, modo, versos) {
    const ir = (m) => "#/" + b.c + "/" + cap + (m === "a" ? "/a" : "");
    // Tres modos (BiEx, 10-nov-2026): Análisis · Lectura (la traducción en el orden natural del español, para leer de corrido;
    // ruta /o y prefs.lorg) · Textual (la misma traducción en el orden del griego, con todas sus piezas)
    const MODO_T = { a: "Análisis: cada palabra con su forma, su lema y su morfología", o: "Lectura: la traducción en el orden natural del español, para leer de corrido", l: "Textual: la traducción en el orden del griego, palabra por palabra y con todas sus piezas" };
    const activo = (m) => (m === "a" ? modo === "a" : modo !== "a" && (m === "o") === !!prefs.lorg);
    const btnModo = (m, t) => h("button", { type: "button", class: "m-" + m, "aria-label": t, "aria-pressed": activo(m) ? "true" : "false", title: MODO_T[m], onclick: () => {
      if (activo(m)) return;
      if (m !== "a") { const cambia = !!prefs.lorg !== (m === "o"); prefs.lorg = m === "o"; guardarPrefs(); if (modo !== "a") { if (cambia) { RP.anclaEnSitio = capturarAnclaLinea(); esc.libro = null; vistaLibro(b.c, cap, "l", null, null); } return; } }
      RP.anclaSig = anclaInicioVerso(); RP.enSitio = true; location.hash = ir(m);
    } }, svg(m === "a" ? ICO.lupa : m === "o" ? ICO.libro : ICO.literal), h("span", { class: "lbl", text: t }));
    const prev = cap > 1 ? "#/" + b.c + "/" + (cap - 1) + (modo === "a" ? "/a" : "") : null;
    const next = cap < b.caps.length ? "#/" + b.c + "/" + (cap + 1) + (modo === "a" ? "/a" : "") : null;
    const disp = modo !== "a" ? h("div", { class: "seg seg-ico", role: "group", "aria-label": "Disposición del texto" },
      [["versos", "Por versos", ICO.lista], ["continuo", "Continuo", ICO.parrafo]].map(([k, t, ico]) => h("button", { type: "button", "aria-pressed": prefs.disp === k ? "true" : "false", "aria-label": t, title: t, onclick: () => {
        if (prefs.disp === k) return; RP.anclaEnSitio = capturarAnclaLinea(); prefs.disp = k; guardarPrefs(); esc.libro = null; vistaLibro(b.c, cap, modo, null, null);
      } }, svg(ico), h("span", { class: "txt", text: t })))) : null;
    const filtro = modo !== "a" && versos ? h("label", { class: "filtro-niv" + (prefs.nivel ? " activo" : ""), title: "Mostrar los versos según su nivel de avance" }, svg(ICO.filtro),
      h("select", { "aria-label": "Mostrar los versos según su nivel de avance", onchange: (e) => { const a = capturarAncla(); if (a) a.barra = true; RP.anclaEnSitio = a || { barra: true, v: null }; prefs.nivel = e.target.value; guardarPrefs(); esc.libro = null; vistaLibro(b.c, cap, modo, null, null); } },
        FILTROS.map(([k, t]) => { const vs = k ? versos.filter((x) => pasaFiltro(x, k)) : versos; let n = " · " + vs.length; if (k === "base" && vs.length) n += " · " + Math.round(vs.reduce((acc, x) => acc + (+x.k || 0), 0) / vs.length) + " % traducido"; return h("option", { value: k, selected: (prefs.nivel || "") === k ? true : null, "data-corto": (FILTRO_CORTO[k] || t) + n, text: t + n }); }))) : null;
    const contemplar = modo !== "a" ? h("button", { class: "btn-icono btn-cont", type: "button", "aria-pressed": String(document.documentElement.classList.contains("contemplar")), "aria-label": "Modo Contemplar: leer sin barras ni distracciones", title: "Modo Contemplar (Mayús+C)", onclick: () => ponerContemplar(!document.documentElement.classList.contains("contemplar")) }, svg(ICO.contemplar)) : null;
    const opciones = modo !== "a" ? h("button", { class: "btn-icono btn-opc", type: "button", "aria-label": "Opciones del texto: colores, corchetes y paréntesis", title: "Opciones del texto", onclick: abrirOpciones }, svg(ICO.opciones)) : null;
    // En el centro de la barra: el libro (transliteración y nombre en español) y el capítulo en hebreo con su numeral romano
    const capH = String((b.caps[cap - 1] || {}).h || "").match(/^(.*?)\s*\[[^\]]*\]\s*(\S+)?\s*$/);
    const he = capH ? capH[1] : "", rom = capH && capH[2] ? capH[2] : String(cap);
    const titulo = h("button", { class: "bh-tit", type: "button", title: "Elegir capítulo y verso",
      "aria-label": nombreLibro(b) + ", capítulo " + cap + ". Elegir capítulo y verso", onclick: () => abrirModal(vistaNavegador(b, cap, versos)) },
      h("span", { class: "bh-lib" }, h("span", { class: "tr", text: b.t || b.n }), b.t ? h("span", { class: "es", text: tradQ(b) }) : null),
      h("span", { class: "bh-cap" }, he ? h("span", { lang: "he", dir: "rtl", text: he }) : null, h("span", { class: "rom", text: rom }), h("span", { class: "bh-de", text: "· " + cap + "/" + b.caps.length })));
    return h("div", { class: "barra-hoja" },
      h("div", { class: "seg seg-modo", role: "group", "aria-label": "Modo" }, btnModo("a", "Análisis"), btnModo("o", "Lectura"), btnModo("l", "Textual")),
      h("div", { class: "cap-grupo movil" },
        h("button", { class: "btn-icono", type: "button", "aria-label": "Capítulo anterior", title: "Capítulo anterior", disabled: !prev, onclick: () => prev && irCapituloInicio(prev) }, svg(ICO.izq)),
        h("button", { class: "btn-cap", type: "button", "aria-label": "Capítulo " + cap + " de " + b.caps.length + ". Elegir capítulo y verso", onclick: () => abrirModal(vistaNavegador(b, cap, versos)) }, svg(ICO.rejilla), h("span", { class: "cap-n" }, "Cap. " + cap, h("span", { class: "cap-de", text: "/" + b.caps.length }))), // (BiEx, 14-nov-2026) cuántos capítulos tiene el libro
        h("button", { class: "btn-icono", type: "button", "aria-label": "Capítulo siguiente", title: "Capítulo siguiente", disabled: !next, onclick: () => next && irCapituloInicio(next) }, svg(ICO.der))),
      h("span", { class: "bh-salto", "aria-hidden": "true" }),
      disp, filtro, contemplar, opciones,
      // franja fina al pie de la barra: el libro y el capítulo en el centro (en escritorio, con las flechas del capítulo a los lados)
      h("div", { class: "bh-franja" },
        h("button", { class: "btn-icono bh-fl", type: "button", "aria-label": "Capítulo anterior", title: "Capítulo anterior", disabled: !prev, onclick: () => prev && irCapituloInicio(prev) }, svg(ICO.izq)),
        titulo,
        h("button", { class: "btn-icono bh-fl", type: "button", "aria-label": "Capítulo siguiente", title: "Capítulo siguiente", disabled: !next, onclick: () => next && irCapituloInicio(next) }, svg(ICO.der)),
        // (BiEx, 22-nov-2026, 15:59) la perícopa del verso que se lee, en la traducción de Jünemann (Lectura y Textual)
        modo !== "a" ? h("button", { class: "btn-icono bh-jnm", type: "button", "aria-label": "Ver esta perícopa en la traducción de Jünemann", title: "La perícopa en Jünemann", onclick: (e) => { e.stopPropagation(); verPericopaJnm(b, cap, versos); } }, svg(ICO.rollo)) : null));
  }
  function vistaNavegador(b, cap, versos) {
    const sub = cap ? "Capítulo " + cap + " de " + b.caps.length : b.caps.length + (b.caps.length === 1 ? " capítulo" : " capítulos") + " · elige uno";
    return () => cajaModal(cabModal(nombreLibro(b), sub), h("div", { style: "display:grid;gap:22px" }, navContenido(b, cap, versos, () => cerrarModal()), navLibros(b)));
  }
  // Agrupa los botones de los 27 libros por las categorías del orden elegido (compartido por «Los 27 libros» y «Otros libros»)
  function gruposLibros(chips) {
    const ko = ordenActivo(), porCod = new Map(librosEnOrden().map((x, i) => [x.c, chips[i]]));
    return (ko === "tradicional" || !CRONO || !CRONO.grupos[ko]
      ? [["Los relatos de la vida de YēshŪ́aʿ y " + nombreLibro(libroDe("ACT")), "", ["MAT", "MRK", "LUK", "JHN", "ACT"]], ["Las cartas", "", D.libros.map((x) => x.c).filter((c) => !["MAT", "MRK", "LUK", "JHN", "ACT", "REV"].includes(c))], [nombreLibro(libroDe("REV")), "", ["REV"]]]
      : CRONO.grupos[ko]).map(([t, sub, cs]) => {
      const cx = cs.map((c) => porCod.get(c)).filter(Boolean);
      return h("section", { class: "libs-g", "aria-label": t }, h("h3", { class: "libs-gt" }, h("span", {}, protegerMay(t)), sub ? h("small", { text: sub }) : null), h("div", { class: "libs", role: "group", "aria-label": t }, cx));
    });
  }
  // Los demás libros, por categorías y en el orden elegido en la biblioteca: al tocar uno se ven sus capítulos sin salir de la ventana
  function navLibros(b) {
    const chips = librosEnOrden().map((x) => h("button", {
      type: "button", class: "lib-chip", "aria-current": x === b ? "true" : "false", title: nombreLibro(x),
      onclick: () => { if (x !== b) empujar(vistaNavegador(x, 0, null)); } },
      h("span", { class: "lt", text: x.t || x.n }), x.t ? h("span", { class: "ln", text: tradQ(x) }) : null));
    return h("div", { class: "nav-libros por-grupos" }, h("p", { class: "rotulo", text: "Otros libros" }), gruposLibros(chips));
  }
  // Los 27 libros en una ventana (botón de la barra superior): al tocar uno se ven sus capítulos sin salir de ella
  function abrirLibros() {
    if (!D) return;
    const b = esc.libro ? libroDe(esc.libro) : null;
    // P11 (BiEx, 11-nov-2026): lupa interna que filtra los libros por el nombre o las letras que se escriban (también con
    // letras latinas para las transliteraciones con letras griegas)
    const GL = { α: "a", β: "b", γ: "g", δ: "d", ε: "e", ζ: "z", η: "e", θ: "th", ι: "i", κ: "k", λ: "l", μ: "m", ν: "n", ξ: "x", ο: "o", π: "p", ρ: "r", σ: "s", ς: "s", τ: "t", υ: "u", φ: "f", χ: "j", ψ: "ps", ω: "o" };
    const llano = (t) => String(t || "").normalize("NFD").replace(/[\u0300-\u036f\u02b0-\u02ff\u1dc0-\u1dff]/g, "").toLowerCase().replace(/[α-ω]/g, (c) => GL[c] || c).replace(/[^a-z0-9ñ ]/g, "");
    const chips = librosEnOrden().map((x) => { const c = h("button", {
        type: "button", class: "lib-chip", "aria-current": x === b ? "true" : "false", title: nombreLibro(x),
        onclick: () => empujar(vistaNavegador(x, x === b ? esc.cap : 0, null)) },
        h("span", { class: "lt", text: x.t || x.n }), x.t ? h("span", { class: "ln", text: tradQ(x) }) : null);
      c._k = llano([x.t, x.n, tradQ(x), nombreLibro(x), x.c].join(" ")); return c; });
    const nada = h("p", { class: "nota-ui libs-nada", hidden: true, text: "Ningún libro con esas letras." });
    const grupos = gruposLibros(chips);
    const lupa = h("input", { type: "search", class: "libs-lupa", placeholder: "Busca un libro por su nombre…", "aria-label": "Buscar un libro por su nombre", autocomplete: "off", spellcheck: "false",
      oninput: (e) => { const q = llano(e.target.value).trim(); let n = 0; for (const c of chips) { const si = !q || q.split(/\s+/).every((w) => c._k.includes(w)); c.hidden = !si; if (si) n++; } for (const g of grupos) g.hidden = ![...g.querySelectorAll(".lib-chip")].some((c) => !c.hidden); nada.hidden = n > 0; },
      onkeydown: (e) => { if (e.key === "Enter") { const c = chips.find((x) => !x.hidden); if (c) c.click(); } } });
    const accLib = h("div", { class: "libs-acc" },
      h("button", { type: "button", class: "libs-acc-btn", onclick: () => irDesdeModal("#/sinopsis" + (b ? "/" + b.c + "." + (esc.cap || 1) + ".1" : "")) }, svg(ICO.sinopsis), h("span", { text: "Mesa sinóptica" })),
      h("button", { type: "button", class: "libs-acc-btn", onclick: () => irDesdeModal("#/constelacion" + (b ? "?capa=refs&libro=" + b.c : "")) }, svg(ICO.constelacion), h("span", { text: "Constelación" })),
      h("button", { type: "button", class: "libs-acc-btn", onclick: () => irDesdeModal("#/mapa") }, svg(ICO.mapa), h("span", { text: "Atlas bíblico" })),
      h("button", { type: "button", class: "libs-acc-btn", onclick: () => irDesdeModal("#/raices/repaso") }, svg(ICO.tarjetas), h("span", { text: "Repaso · 1 min" })));
    abrirModal(() => cajaModal(cabModal("Los 27 libros", b ? "Estás en " + nombreLibro(b) + " " + esc.cap + " · elige un libro" : "Elige un libro y luego su capítulo"),
      // (14-nov-2026) la lupa y la lista van juntas en el cuerpo de la ventana: la lista no es el pie (se montaba sobre la lupa)
      [accLib, h("label", { class: "libs-lupa-c" }, svg(ICO.buscar), lupa),
        h("div", { class: "nav-libros todos por-grupos" }, grupos, nada)]));
  }
  const rutaCap = (b, cap, modo) => "#/" + b.c + "/" + cap + (modo === "a" ? "/a" : "");
  // O99/U2 (BiEx, 12-nov-2026): dos cifras por capítulo, en vez de un «10 % de avance» que no dice nada: las palabras griegas
  // con traducción fijada y la revisión de la traducción (según el estado de cada verso). Medidores finos, simétricos.
  const pctEnt = (x) => String(Math.floor(x)).replace(".", ",") + " %";
  // AH (BiEx, 22-nov-2026): «Palabras traducidas» ya está arriba, en la ficha del libro; el capítulo deja solo la revisión (y, en la
  // Lectura, el reordenamiento) y la explicación de cómo leer pasa a un ícono de información junto a la cifra: una ventanita
  // discreta que se cierra al tocar cualquier otro punto. La cifra de palabras de cada capítulo sigue en el navegador de capítulos.
  const medidor = (cl, et, v, tt, aprox, info) => h("span", { class: "cc-m " + cl, title: tt + ": " + (aprox ? "≈ " : "") + pctEnt(v) },
    h("span", { class: "cc-et", text: et }), h("b", { text: (aprox ? "≈ " : "") + pctEnt(v) }), info || h("i", { class: "cc-i-res", "aria-hidden": "true" }),
    h("i", { class: "cc-b", "aria-hidden": "true" }, h("i", { style: "width:" + Math.max(2, Math.min(100, v)).toFixed(1) + "%" })));
  function botonInfo(contenido) {
    const pop = h("div", { class: "cc-pop", role: "note", hidden: true });
    const b = h("button", { class: "cc-info", type: "button", "aria-label": "Cómo leer este capítulo", title: "Cómo leer este capítulo", "aria-expanded": "false" }, svg(ICO.info));
    let fuera = null;
    const cerrar = () => {
      if (fuera) { document.removeEventListener("pointerdown", fuera, true); document.removeEventListener("keydown", fuera, true); fuera = null; }
      pop.classList.remove("vis"); b.setAttribute("aria-expanded", "false");
      setTimeout(() => { if (!pop.classList.contains("vis")) pop.hidden = true; }, 200);
    };
    b.addEventListener("click", (e) => {
      e.stopPropagation();
      if (pop.classList.contains("vis")) { cerrar(); return; }
      if (!pop.firstChild) pop.append(...[].concat(contenido()).filter(Boolean));
      pop.hidden = false; void pop.offsetWidth; pop.classList.add("vis"); b.setAttribute("aria-expanded", "true");
      fuera = (ev) => {
        if (ev.type === "keydown") { if (ev.key === "Escape") { ev.stopPropagation(); cerrar(); } return; }
        if (!pop.contains(ev.target) && !b.contains(ev.target)) cerrar();
      };
      document.addEventListener("pointerdown", fuera, true); document.addEventListener("keydown", fuera, true);
    });
    b._pop = pop;
    return b;
  }
  function cifrasCap(C, x) {
    if (C.pal == null) return h("div", { class: "s", text: pct(C.pct) + " de avance" });
    const info = x && x.info ? botonInfo(x.info) : null;
    return h("div", { class: "encab-cifras" + (x && x.ro != null ? " dos" : "") },
      medidor("cc-rev", "Revisión", C.pct, "Avance de la revisión de la traducción de este capítulo", false, info),
      x && x.ro != null ? medidor("cc-ro", "Reordenamiento", x.ro, "Avance estimado del reordenamiento de la Lectura en este capítulo", true) : null,
      info ? info._pop : null);
  }
  const clickCapInicio = (r) => r ? (e) => { if (!e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey && e.button === 0) { e.preventDefault(); irCapituloInicio(r); } } : null;
  function encabezado(b, cap, modo, x) {
    const C = b.caps[cap - 1];
    const partes = String(C.h || "").split(" [");
    const flecha = (c, ico, et) => {
      const r = c ? rutaCap(b, c, modo) : null;
      return r
        ? h("a", { class: "btn-icono", href: r, onclick: clickCapInicio(r), "aria-label": et, title: et }, svg(ico))
        : h("button", { class: "btn-icono", type: "button", disabled: true, "aria-label": et, title: et }, svg(ico));
    };
    return h("div", { class: "encab" + (modo !== "a" && prefs.lorg ? " encab-org" : "") },
      flecha(cap > 1 ? cap - 1 : 0, ICO.izq, "Capítulo anterior"),
      h("div", { class: "encab-c" },
        h("span", { class: "cont-lib", text: b.t || b.n }),
        // (21-nov-2026, AC11/AC21: el brillo del título hebreo movía su fondo en el hilo principal en cada cuadro, ~6 % de CPU en reposo)
        // ahora el brillo son siete luces quietas sobre el texto que se encienden en secuencia: solo opacidad, por el compositor
        C.h ? h("div", { class: "h" }, h("span", { lang: "he", class: "he-br" }, partes[0], ...Array.from({ length: 7 }, (_, k) => h("span", { class: "he-luz", "aria-hidden": "true", style: "--hk:" + k, text: partes[0] }))), partes[1] ? " [" + partes[1] : "") : h("div", { class: "h", text: "Capítulo " + cap }),
        h("div", { class: "s", text: "Capítulo " + cap + " de " + b.caps.length }), cifrasCap(C, x)),
      flecha(cap < b.caps.length ? cap + 1 : 0, ICO.der, "Capítulo siguiente"));
  }
  // Al terminar el capítulo: anterior y siguiente (o el libro siguiente) — siempre aterrizan al comienzo del capítulo elegido
  function finCap(b, cap, modo) {
    const LO = librosEnOrden(), i = LO.indexOf(b);
    const sigLibro = cap >= b.caps.length && i < LO.length - 1 ? LO[i + 1] : null;
    const antLibro = cap <= 1 && i > 0 ? LO[i - 1] : null;
    const rAnt = cap > 1 ? rutaCap(b, cap - 1, modo) : antLibro ? rutaCap(antLibro, antLibro.caps.length, modo) : null;
    const rSig = cap < b.caps.length ? rutaCap(b, cap + 1, modo) : sigLibro ? rutaCap(sigLibro, 1, modo) : null;
    const ant = cap > 1 ? h("a", { class: "btn", href: rAnt, onclick: clickCapInicio(rAnt) }, svg(ICO.izq), h("span", { text: "Capítulo " + (cap - 1) }))
      : antLibro ? h("a", { class: "btn", href: rAnt, onclick: clickCapInicio(rAnt) }, svg(ICO.izq), h("span", {}, etLibro(antLibro))) : null;
    const sig = cap < b.caps.length ? h("a", { class: "btn oro sig", href: rSig, onclick: clickCapInicio(rSig) }, h("span", { text: "Capítulo " + (cap + 1) }), svg(ICO.der))
      : sigLibro ? h("a", { class: "btn oro sig", href: rSig, onclick: clickCapInicio(rSig) }, h("span", {}, etLibro(sigLibro)), svg(ICO.der)) : null;
    return [finPlan(b, cap), finLeido(b, cap), bloquePulsoCapitulo(b, cap), h("nav", { class: "fin-cap", "aria-label": "Seguir leyendo" }, ant, sig)];
  }
  // Versos leídos en la página: se marcan o desmarcan sin volver a dibujarla
  function marcarLeidoDom(c, cap, vs, si) {
    if (esc.libro !== c || esc.cap !== cap) return;
    for (const v of vs) { const el = document.getElementById("v" + v); if (el && /^(vl|vs)$/.test(el.classList[0])) el.classList.toggle("leido", si); }
  }
  function finLeido(b, cap) {
    const vs = (esc.versos || []).map((x) => x.v), n = vs.filter((v) => LEI.es(b.c, cap, v)).length;
    if (!vs.length) return null;
    if (n === vs.length) return h("p", { class: "fin-leido hecho" }, svg(ICO.leido), h("span", { text: "Capítulo leído" }));
    // con Escudriña activo (P20) el juego pone aquí su botón, que se habilita con el tiempo de lectura del capítulo
    if (store.get("jg:t", null)) return h("div", { class: "fin-leido jg-fin" }, h("button", { class: "btn chico", type: "button", disabled: true }, svg(ICO.leido), h("span", { text: "Marcar el capítulo como leído" })));
    const btn = h("button", { class: "btn chico", type: "button", onclick: () => {
      LEI.marcar(b.c, cap, vs, true); marcarLeidoDom(b.c, cap, vs, true); avisar("Capítulo " + cap + " marcado como leído");
      btn.parentNode.replaceWith(h("p", { class: "fin-leido hecho" }, svg(ICO.leido), h("span", { text: "Capítulo leído" })));
    } }, svg(ICO.leido), h("span", { text: n ? "Marcar como leídos los " + (vs.length - n) + " versos que faltan" : "Marcar el capítulo como leído" }));
    return h("div", { class: "fin-leido" }, btn);
  }

  // Perícopas: las marcas § de BiEx cuando el capítulo las tiene; si no, los párrafos (¶) del texto griego
  // AC10 (BiEx, 15-nov-2026: «en Juan hay perícopas que no se están marcando»): antes, si el capítulo tenía alguna § de BiEx,
  // se usaban solo esas y se ignoraban los párrafos ¶ del griego; en YÔḥānā́n 1 su borrador cubre los versos 1-18 y del 19 al
  // 51 todo quedaba en una sola perícopa. Ahora, por tramos: donde el texto es de BiEx (borrador o revisión) mandan sus §;
  // donde es el texto base, los ¶ del griego; donde cambia el tramo, empieza una perícopa; y si en un tramo de BiEx pasan más
  // de 14 versos sin §, los ¶ del griego completan ese hueco. (usaP queda solo por compatibilidad de las llamadas)
  const PER_MAX = 14;
  const INI_PER = new WeakMap();
  function iniciosPericopa(todos) {
    let s = INI_PER.get(todos); if (s) return s;
    s = new Set(); const autor = (x) => x && x.n && x.n !== "base";
    for (let k = 0; k < todos.length; k++) {
      const x = todos[k], a = autor(x);
      if (k === 0 || a !== autor(todos[k - 1])) { s.add(x.v); continue; }
      if (a ? x.p : x.q) s.add(x.v);
    }
    // huecos largos en los tramos de BiEx: se completan con los ¶ del griego
    let ini = 0;
    for (let k = 1; k <= todos.length; k++) {
      if (k < todos.length && !s.has(todos[k].v)) continue;
      if (k - ini > PER_MAX && autor(todos[ini])) for (let j = ini + 1; j < k; j++) if (todos[j].q) s.add(todos[j].v);
      ini = k;
    }
    INI_PER.set(todos, s); return s;
  }
  const iniciaPericopa = (usaP, x, k, todos) => k === 0 || (todos ? iniciosPericopa(todos).has(x.v) : !!(usaP ? x.p : x.q));
  // BiEx (9-nov-2026): que nadie tome el proceso semana a semana por el resultado final. Tras «Entendido» vuelve a los 7 días.
  function notaObra() {
    // Sale como mucho un par de veces por semana (cada 84 h): al mostrarse cuenta como vista; en la misma visita sigue arriba de cada capítulo hasta «Entendido»
    if (!notaObra.visita) { if (Date.now() - (Number(store.get("obraVista", 0)) || 0) < 84 * 36e5) return null; notaObra.visita = true; store.set("obraVista", Date.now()); }
    if (notaObra.cerrada) return null;
    const el = h("div", { class: "nota-obra", role: "note" },
      h("p", {}, h("b", { text: "Biblia Exacta se construye semana a semana. " }), "Con el paso de los días, la vista Lectura reflejará de manera precisa e inteligible el mensaje de la traducción Textual. Te invitamos a ingresar varias veces por semana, e incluso a diario, para escudriñar el texto y ver las novedades y los avances en la edición del texto y del proyecto."),
      h("button", { class: "btn chico", type: "button", onclick: () => { store.set("obraVista", Date.now()); notaObra.cerrada = true; el.remove(); } }, "Entendido"));
    return el;
  }
  function cuerpoLectura(b, cap, todos) {
    const f = prefs.nivel || "";
    const versos = todos.filter((x) => pasaFiltro(x, f));
    const usaP = todos.some((x) => x.p);
    const hayBase = todos.some((v) => v.g), hayAutor = todos.some((v) => !v.g);
    const ley = prefs.ed && hayAutor ? h("span", { class: "ley-mini" }, " Colores de la edición BiEx: ", h("span", { class: "tm", text: "palabras del Mashíaḥ" }), " · ", h("span", { class: "tc", text: "citas de la Antigua Voluntad" }), " · ", h("span", { class: "tk", text: "[ampliaciones]" }), " · ",
      h("button", { class: "enlace", type: "button", onclick: abrirOpciones, text: "opciones" }), ".") : null;
    const Cc = b.caps[cap - 1] || {};
    // X2 (BiEx, 13-nov-2026): en la Lectura, cuánto se ha reordenado (estimado a la baja): que nadie la tome por el resultado final.
    // AH (22-nov-2026): esa cifra va junto a la revisión y el texto que explica cómo leer, en la ventanita de información.
    // AF6 (22-nov-2026): las palabras casi exóticas llevan su color en Textual y un subrayado punteado sutil en la Lectura.
    const hayRara = todos.some((v) => (prefs.lorg && v.o ? v.or : v.r));
    const rara = hayRara ? h("p", {}, "Palabras casi exóticas (3 veces o menos en la Nueva Voluntad): ", h("span", { class: prefs.lorg ? "rara-l" : "rara-t", text: "con un subrayado de punto y raya" }), ".") : null;
    const dorado = hayBase ? h("p", {}, "En ", h("span", { class: "gr", text: "dorado" }), ", el griego que aún no tiene traducción fijada.") : null;
    const tocar = h("p", { text: "Toca cualquier verso para abrir su griego palabra por palabra." });
    const info = () => prefs.lorg
      ? [h("p", {}, h("b", { text: "Lectura: el orden natural del español." }), " Todavía no es el resultado final: el texto completo, palabra por palabra, está en Textual."), dorado, tocar, rara, ley ? h("p", {}, ley) : null]
      : [hayBase ? h("p", { text: "Los versos en texto base se presentan palabra por palabra." }) : null, dorado, tocar, rara, ley ? h("p", {}, ley) : null];
    const cab = encabezado(b, cap, "l", { info, ro: prefs.lorg ? Cc.ro : null });
    const quitarFiltro = () => { prefs.nivel = ""; guardarPrefs(); esc.libro = null; vistaLibro(b.c, cap, "l", null, null); };
    const obra = notaObra();
    const avisoFiltro = f ? h("div", { class: "nota-filtro" }, svg(ICO.filtro), h("span", { text: (versos.length ? "Se muestran " + versos.length + " de " + todos.length + " versos" : "Ningún verso de este capítulo está aún en este nivel") + " · " + nombreFiltro(f) + "." }),
      h("button", { class: "btn chico", type: "button", onclick: quitarFiltro, text: "Mostrar todos" })) : null;
    // al tocar un verso se abre su griego palabra por palabra, con la palabra tocada iluminada
    const abrir = (x, e) => abrirVerso(b, cap, x.v, false, e && e.currentTarget ? indiceToque(e, e.currentTarget) : null);
    const salto = (n) => h("button", { class: "salto", type: "button", onclick: quitarFiltro, text: "· · ·  " + n + (n === 1 ? " verso oculto por el filtro" : " versos ocultos por el filtro") });
    const huecos = (x, k) => { const i = todos.indexOf(x), j = k > 0 ? todos.indexOf(versos[k - 1]) : -1; return i - j - 1; };
    if (prefs.disp === "continuo") {
      const parrafos = [];
      let actual = null;
      versos.forEach((x, k) => {
        if (f && huecos(x, k) > 0) { parrafos.push(salto(huecos(x, k))); actual = null; }
        const aus = avisosAusentes(b, cap, x, todos); if (aus.length) { parrafos.push(...aus); actual = null; }
        const A = anadido(b.c, cap, x.v), av = avisoAnadido(b, cap, x.v, A, false, k === 0);
        if (av) { parrafos.push(av); actual = null; }
        // § solo donde de verdad empieza una perícopa (y al comienzo del capítulo); tras una caja violeta el párrafo sigue sin §
        if (!actual || iniciaPericopa(usaP, x, k, todos)) { const ini = k === 0 || iniciaPericopa(usaP, x, k, todos); actual = h("p", { class: "peri" + (ini ? "" : " sigue") }, ini ? h("span", { class: "par", "aria-hidden": "true", text: "§" }) : null); parrafos.push(actual); }
        actual.append(aplicarMarca(h("span", { class: "vs n-" + x.n + (A ? (A.entero ? " anadido" : " an-parcial") : "") + (LEI.es(b.c, cap, x.v) ? " leido" : ""), id: "v" + x.v, role: "button", tabindex: "0", title: refCorta(b, cap, x.v) + " · " + estadoEt(x.n),
          onclick: (e) => abrir(x, e), onkeydown: (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); abrir(x); } } },
          h("sup", { text: x.v }), corcheteAn(A, 0), vtx(x), corcheteAn(A, 1)), marcaDe(b, cap, x.v)), " ");
        if (A && A.fin) actual = null;
      });
      if (f && versos.length && todos.indexOf(versos[versos.length - 1]) < todos.length - 1) parrafos.push(salto(todos.length - 1 - todos.indexOf(versos[versos.length - 1])));
      return [cab, obra, avisoFiltro, h("div", { class: "continuo" }, parrafos), finCap(b, cap, "l")];
    }
    const filas = [];
    versos.forEach((x, k) => {
      if (f && huecos(x, k) > 0) filas.push(salto(huecos(x, k)));
      filas.push(...avisosAusentes(b, cap, x, todos));
      const av = avisoAnadido(b, cap, x.v, anadido(b.c, cap, x.v), false, k === 0);
      if (av) filas.push(av);
      filas.push(filaVerso(x, k));
    });
    if (f && versos.length && todos.indexOf(versos[versos.length - 1]) < todos.length - 1) filas.push(salto(todos.length - 1 - todos.indexOf(versos[versos.length - 1])));
    return [cab, obra, avisoFiltro, h("div", { class: "lectura" }, filas), finCap(b, cap, "l")];
    function filaVerso(x, k) {
      const A = anadido(b.c, cap, x.v);
      return aplicarMarca(h("div", {
      class: "vl n-" + x.n + (iniciaPericopa(usaP, x, k, todos) ? " p" : "") + (A ? (A.entero ? " anadido" : " an-parcial") : "") + (LEI.es(b.c, cap, x.v) ? " leido" : ""), id: "v" + x.v, role: "button", tabindex: "0",
      "aria-label": "Verso " + x.v + " (" + estadoEt(x.n) + "). Abrir su griego palabra por palabra",
      onclick: (e) => abrir(x, e), onkeydown: (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); abrir(x); } } },
      // § delante del número del verso que abre la perícopa (el carácter mismo, como en los textos de BiEx: «§1.»)
      h("span", { class: "vn", title: estadoEt(x.n) + (x.n === "base" ? ": " + x.k + " % de las palabras ya traducidas" : "") },
        iniciaPericopa(usaP, x, k, todos) ? h("span", { class: "par-v", "aria-hidden": "true", text: "§" }) : null, String(x.v)),
      h("span", { class: "vt" }, corcheteAn(A, 0), vtx(x), corcheteAn(A, 1))), marcaDe(b, cap, x.v));
    }
  }
  // Versos que el texto base no trae porque se añadieron en copias posteriores (Y11, BiEx, 13-nov-2026: «En YÔḥānā́n 5 verso 4
  // no aparece la caja morada, ¿por qué?»): no hay texto que mostrar, pero en su lugar va la caja violeta, para que se
  // entienda el salto de la numeración. Declarantes más antiguos que no los traen (aparatos de NA28 y UBS5).
  const SIN_VERSO = {
    "MAT 17:21": "el Codex [Códice] Sinaiticus en su primera escritura ni el Codex [Códice] Vaticanus",
    "MAT 18:11": "el Codex [Códice] Sinaiticus ni el Codex [Códice] Vaticanus",
    "MAT 23:14": "el Codex [Códice] Sinaiticus, el Codex [Códice] Vaticanus ni el Codex [Códice] Bezae Cantabrigiensis",
    "MRK 7:16": "el Codex [Códice] Sinaiticus ni el Codex [Códice] Vaticanus",
    "MRK 9:44": "el Codex [Códice] Sinaiticus, el Codex [Códice] Vaticanus, el Codex [Códice] Ephraemi Rescriptus [reescrito] ni el Codex [Códice] Washingtonianus",
    "MRK 9:46": "el Codex [Códice] Sinaiticus, el Codex [Códice] Vaticanus, el Codex [Códice] Ephraemi Rescriptus [reescrito] ni el Codex [Códice] Washingtonianus",
    "MRK 11:26": "el Codex [Códice] Sinaiticus, el Codex [Códice] Vaticanus ni el Codex [Códice] Washingtonianus",
    "MRK 15:28": "el Codex [Códice] Sinaiticus, el Codex [Códice] Alexandrinus, el Codex [Códice] Vaticanus, el Codex [Códice] Ephraemi Rescriptus [reescrito] ni el Codex [Códice] Bezae Cantabrigiensis",
    "LUK 17:36": "𝔓⁷⁵, el Codex [Códice] Sinaiticus, el Codex [Códice] Alexandrinus, el Codex [Códice] Vaticanus ni el Codex [Códice] Washingtonianus",
    "LUK 23:17": "𝔓⁷⁵, el Codex [Códice] Alexandrinus ni el Codex [Códice] Vaticanus",
    "JHN 5:4": "𝔓⁶⁶, 𝔓⁷⁵, el Codex [Códice] Sinaiticus ni el Codex [Códice] Vaticanus",
    "ACT 8:37": "𝔓⁴⁵, 𝔓⁷⁴, el Codex [Códice] Sinaiticus, el Codex [Códice] Alexandrinus, el Codex [Códice] Vaticanus ni el Codex [Códice] Ephraemi Rescriptus [reescrito]",
    "ACT 15:34": "𝔓⁷⁴, el Codex [Códice] Sinaiticus, el Codex [Códice] Alexandrinus ni el Codex [Códice] Vaticanus",
    "ACT 24:7": "𝔓⁷⁴, el Codex [Códice] Sinaiticus, el Codex [Códice] Alexandrinus ni el Codex [Códice] Vaticanus",
    "ACT 28:29": "𝔓⁷⁴, el Codex [Códice] Sinaiticus, el Codex [Códice] Alexandrinus ni el Codex [Códice] Vaticanus" };
  // las cajas de los versos que faltan justo antes del verso x (en el orden del capítulo completo, no del filtro)
  function avisosAusentes(b, cap, x, todos) {
    const out = [], n = +x.v, hay = new Set(todos.map((y) => +y.v));
    for (let m = n - 1; m > 0 && !hay.has(m); m--) {
      const de = SIN_VERSO[b.c + " " + cap + ":" + m]; if (!de) continue;
      out.unshift(h("div", { class: "aviso-anadido aa-ausente", role: "note" },
        h("span", { class: "aa-sig", "aria-hidden": "true", text: "⟦ ⟧" }),
        h("div", { class: "aa-tx" }, h("b", { text: "Verso " + m + " · añadido después" }),
          h("p", { text: "Lo traen solo copias posteriores: no está en " + de + ", los declarantes más antiguos. Por eso aquí se pasa del verso " + (m - 1) + " al " + (m + 1) + "." }))));
    }
    return out;
  }
  // Aviso al comienzo de un pasaje añadido (o en la ventana del verso, para cualquiera de sus versos)
  // (13-nov-2026) también al abrir un capítulo que empieza a la mitad de un pasaje añadido (YÔḥānā́n 8:1-11): «continúa»
  function avisoAnadido(b, cap, v, A, siempre, primero) {
    if (!A || (!A.ini && !siempre && !primero)) return null;
    const sigue = !A.ini && primero && !siempre;
    return h("div", { class: "aviso-anadido", role: "note" },
      h("span", { class: "aa-sig", "aria-hidden": "true", text: "⟦ ⟧" }),
      h("div", { class: "aa-tx" }, h("b", { text: "Texto añadido" + (sigue ? " (continúa)" : "") + " · " + A.p.t }), h("p", { text: A.p.d }),
        h("a", { class: "enlace", href: "#/" + b.c + "/" + cap + "/l/" + v + "/m", text: "Ver los manuscritos de este verso" })));
  }
  const corcheteAn = (A, lado) => (A && A.entero && (lado ? A.fin : A.ini) ? h("span", { class: "an-cor", "aria-hidden": "true", text: lado ? " ⟧" : "⟦ " }) : null);
  function abrirVerso(b, cap, v, conManuscritos, toque, enfocarNota) {
    const versos = esc.versos || [];
    marcarVerso(v);
    historial(b.c, cap, v, "l");
    const ctx = { b, cap, v, versos, toque: toque == null ? null : toque, enfocarNota: !!enfocarNota };
    abrirModal(vistaVerso(ctx), () => { ponerHash("#/" + b.c + "/" + cap + "/l/" + (esc.vMarcado || v)); });
    ponerHash("#/" + b.c + "/" + cap + "/l/" + v);
    if (conManuscritos) empujar(vistaManuscritos(ctx));
  }
  let limpiarVnFoco = null;
  function marcarVerso(v, focoCita) {
    if (limpiarVnFoco) { limpiarVnFoco(); limpiarVnFoco = null; }
    for (const x of $$(".marcado")) x.classList.remove("marcado");
    for (const x of $$(".vn-foco")) x.classList.remove("vn-foco");
    for (const x of $$(".tesela[aria-current]")) x.removeAttribute("aria-current");
    const el = document.getElementById("v" + v);
    if (el) {
      el.classList.add("marcado");
      if (focoCita) el.classList.add("vn-foco");
    }
    for (const t of $$('.tesela[data-v="' + v + '"]')) t.setAttribute("aria-current", "true");
    esc.vMarcado = v;
    if (focoCita) {
      esc.vFoco = { c: esc.libro, cap: esc.cap, v: +v, t: Date.now() };
      try { if (window.BiExJuego && BiExJuego.fijarVersoFoco) BiExJuego.fijarVersoFoco(esc.libro, esc.cap, +v); } catch (e) { /* sin juego */ }
      let yRef = window.scrollY;
      const t0 = performance.now();
      const alDesp = () => {
        if (performance.now() - t0 < 520) { yRef = window.scrollY; return; }
        if (Math.abs(window.scrollY - yRef) > 32) soltar();
      };
      const soltar = () => {
        window.removeEventListener("scroll", alDesp);
        limpiarVnFoco = null;
        if (esc.vFoco && esc.vFoco.v === +v) esc.vFoco = null;
        for (const x of $$(".vn-foco")) x.classList.remove("vn-foco");
      };
      limpiarVnFoco = soltar;
      window.addEventListener("scroll", alDesp, { passive: true });
    }
    const u = store.get("ultimo", null);
    if (u && u.c === esc.libro && u.cap === esc.cap) { u.v = v; store.set("ultimo", u); }
  }

  // ------------------------------------------------------------------ estudio: marcadores con temas de color y notas
  // Se guardan en este navegador y, con una cuenta de Escudriña, también en el servidor (AA19); se exportan e importan.
  const TEMAS_LIBRES = { libre1: "#d86ca4", libre2: "#52b8d8", libre3: "#a8c957", libre4: "#e38f73" };
  const TEMAS_BASE = [["oro", "Clave"], ["azul", "Para estudiar"], ["verde", "Enseñanza"], ["rojo", "Advertencia"], ["violeta", "Cumplimiento"], ["turquesa", "Conexión"], ["ambar", "Promesa"], ["gris", "Pendiente"],
    ["libre1", "Personal 1"], ["libre2", "Personal 2"], ["libre3", "Personal 3"], ["libre4", "Personal 4"]];
  const HEX_OK = (s) => typeof s === "string" && /^#[0-9a-f]{6}$/i.test(s.trim());
  const MK = {
    _raw: null, _mem: null,
    todo() {
      let raw = "";
      try { raw = localStorage.getItem("biex:marcas") || ""; } catch (e) { raw = ""; }
      if (MK._raw !== raw || !MK._mem) {
        MK._raw = raw;
        let m = null;
        try { m = raw ? JSON.parse(raw) : {}; } catch (e) { m = {}; }
        MK._mem = m && typeof m === "object" && !Array.isArray(m) ? m : {};
      }
      return MK._mem;
    },
    clave: (c, cap, v) => c + "-" + cap + "-" + v,
    get: (c, cap, v) => MK.todo()[MK.clave(c, cap, v)] || null,
    poner(c, cap, v, cambios) {
      const m = Object.assign({}, MK.todo()), k = MK.clave(c, cap, v);
      const x = Object.assign({ c, cap, v }, m[k] || {}, cambios, { f: Date.now() });
      if (!x.col) delete x.col;
      if (!String(x.nota || "").trim()) delete x.nota;
      if (!x.col && !x.nota) delete m[k]; else m[k] = x;
      MK._mem = m;
      store.set("marcas", m);
      try { MK._raw = localStorage.getItem("biex:marcas") || ""; } catch (e) { MK._raw = null; }
      MK.pintar(c, cap, v); NUBE.cambio();
    },
    temas() { const t = store.get("marcasTemas", null) || {}; return TEMAS_BASE.map(([k, n]) => [k, typeof t[k] === "string" && t[k].trim() ? t[k].trim().slice(0, 40) : n]); },
    colores() {
      const g = store.get("marcasColores", null) || {}, out = {};
      for (const [k, def] of Object.entries(TEMAS_LIBRES)) out[k] = HEX_OK(g[k]) ? g[k].trim() : def;
      return out;
    },
    aplicarColores() {
      const cols = MK.colores(), st = document.documentElement.style;
      for (const [k, hex] of Object.entries(cols)) st.setProperty("--mk-" + k, hex);
    },
    nombre: (k) => (MK.temas().find((x) => x[0] === k) || [k, k])[1],
    // refleja el cambio en el capítulo abierto: el verso y su tesela
    pintar(c, cap, v) {
      if (esc.libro !== c || esc.cap !== cap) return;
      const x = MK.get(c, cap, v), el = document.getElementById("v" + v);
      if (el) aplicarMarca(el, x);
      for (const t of $$('.tesela[data-v="' + v + '"]')) aplicarMarca(t, x);
    },
  };
  MK.aplicarColores();
  // AA19 (BiEx, 14-nov-2026): con una cuenta de Escudriña, los marcadores y las notas se guardan también en el servidor (y allí
  // queda una copia de seguridad cada 12 horas). Se sube todo el conjunto 3 s después del último cambio; al abrir el lector se
  // baja lo del servidor si es más nuevo y se une con lo de este dispositivo (cada verso, su versión más reciente).
  const NUBE = {
    tok: () => { const t = store.get("jg:t", null); return typeof t === "string" && t.length > 20 ? t : null; },
    reloj: 0, bajado: false, enCurso: false,
    async pedir(ruta, cuerpo) {
      const t = NUBE.tok(); if (!t || !navigator.onLine) return null;
      try { const r = await fetchConTope(API_JG + ruta, { method: cuerpo ? "POST" : "GET", headers: Object.assign({ authorization: "Bearer " + t }, cuerpo ? { "content-type": "application/json" } : {}), body: cuerpo ? JSON.stringify(cuerpo) : undefined, credentials: "omit" }, 10000); return r.ok ? await r.json() : null; } catch (e) { return null; }
    },
    unir(srv) {
      const loc = MK.todo(), out = Object.assign({}, srv || {});
      for (const [k, x] of Object.entries(loc)) { const y = out[k]; if (!y || (x.f || 0) >= (y.f || 0)) out[k] = x; }
      return out;
    },
    cambio() { if (!NUBE.tok()) return; store.set("marcasSucio", 1); clearTimeout(NUBE.reloj); NUBE.reloj = setTimeout(() => NUBE.subir(), 3000); },
    async subir(intento) {
      if (!NUBE.tok() || NUBE.enCurso) return; NUBE.enCurso = true;
      try {
        const r = await NUBE.pedir("/notas", { marcas: MK.todo(), temas: store.get("marcasTemas", null), n: store.get("marcasN", 0) | 0 });
        if (r && r.conflicto && !intento) { store.set("marcas", NUBE.unir(r.marcas)); if (r.temas && !store.get("marcasTemas", null)) store.set("marcasTemas", r.temas); store.set("marcasN", r.n | 0); NUBE.enCurso = false; return NUBE.subir(true); }
        if (r && r.ok) { store.set("marcasN", r.n | 0); store.set("marcasSucio", 0); store.set("marcasNube", { t: r.t, copia: r.copia || 0 }); }
      } finally { NUBE.enCurso = false; }
    },
    async bajar() {
      if (NUBE.bajado || !NUBE.tok()) return; NUBE.bajado = true;
      const r = await NUBE.pedir("/notas"); if (!r || r.error) { NUBE.bajado = false; return; }
      if ((r.n | 0) > (store.get("marcasN", 0) | 0)) {
        store.set("marcas", NUBE.unir(r.marcas)); if (r.temas && !store.get("marcasTemas", null)) store.set("marcasTemas", r.temas);
        store.set("marcasN", r.n | 0); store.set("marcasNube", { t: r.t, copia: r.copia || 0 });
        if (esc.libro) for (const el of $$(".hoja [id^='v']")) { const v = +el.id.slice(1); if (v) aplicarMarca(el, MK.get(esc.libro, esc.cap, v)); }
      }
      if (store.get("marcasSucio", 0) || ((r.n | 0) === 0 && Object.keys(MK.todo()).length)) NUBE.cambio();
    },
  };
  // PR #9 (Neon, 23-nov-2026): sincronización en la nube vía GET/PUT /nube para { planes, estudio, ajedrez } (tope 128 KB, unión sin pérdida ante conflicto)
  const NUBE_DAT = {
    reloj: 0, bajado: false, enCurso: false,
    async pedir(metodo, cuerpo) {
      const t = NUBE.tok(); if (!t || !navigator.onLine) return null;
      try {
        const opt = { method: metodo || "GET", headers: Object.assign({ authorization: "Bearer " + t }, cuerpo ? { "content-type": "application/json" } : {}), body: cuerpo ? JSON.stringify(cuerpo) : undefined, credentials: "omit" };
        const r = await fetchConTope(API_JG + "/nube", opt, 10000);
        const d = await r.json().catch(() => null);
        return d && typeof d === "object" ? d : null;
      } catch (e) { return null; }
    },
    unirPlanes(srv, loc) {
      const a = srv && typeof srv === "object" ? srv : {}, b = loc && typeof loc === "object" ? loc : {};
      const out = { act: b.act != null ? b.act : (a.act || null), hechos: {}, ini: Object.assign({}, a.ini || {}, b.ini || {}), fechas: {}, ranking: b.ranking !== undefined ? !!b.ranking : !!a.ranking };
      const ids = new Set([...Object.keys(a.hechos || {}), ...Object.keys(b.hechos || {})]);
      for (const id of ids) {
        const s = new Set([...(Array.isArray((a.hechos || {})[id]) ? a.hechos[id] : []), ...(Array.isArray((b.hechos || {})[id]) ? b.hechos[id] : [])]);
        out.hechos[id] = [...s].sort((x, y) => x - y);
      }
      const fIds = new Set([...Object.keys(a.fechas || {}), ...Object.keys(b.fechas || {})]);
      for (const id of fIds) out.fechas[id] = Object.assign({}, (a.fechas || {})[id] || {}, (b.fechas || {})[id] || {});
      if (b.rk || a.rk) out.rk = b.rk || a.rk;
      return out;
    },
    unirObj(srv, loc) {
      if (!srv || typeof srv !== "object") return loc || null;
      if (!loc || typeof loc !== "object") return srv;
      const out = Object.assign({}, srv, loc);
      for (const k of Object.keys(srv)) {
        const a = srv[k], b = loc[k];
        if (a && b && typeof a === "object" && typeof b === "object" && !Array.isArray(a) && !Array.isArray(b)) {
          const m = Object.assign({}, a);
          for (const id of Object.keys(b)) m[id] = (!m[id] || ((b[id] && b[id].t) || 0) >= ((m[id] && m[id].t) || 0)) ? b[id] : m[id];
          out[k] = m;
        }
      }
      return out;
    },
    paquete() {
      return {
        planes: store.get("planes", null),
        estudio: store.get("estudio", null),
        ajedrez: store.get("ajedrez", null),
      };
    },
    cambio(k) {
      if (!NUBE.tok()) return;
      store.set("nubeSucio", 1);
      clearTimeout(NUBE_DAT.reloj);
      NUBE_DAT.reloj = setTimeout(() => NUBE_DAT.subir(false), k === "ya" ? 300 : 2200);
    },
    async subir(forzar) {
      if (!NUBE.tok() || NUBE_DAT.enCurso) return;
      NUBE_DAT.enCurso = true;
      try {
        const pk = NUBE_DAT.paquete();
        const cuerpo = Object.assign({ ts: Number(store.get("nubeTs", 0)) || 0, forzar: !!forzar }, pk);
        if (JSON.stringify(cuerpo).length > 122000) return;
        const r = await NUBE_DAT.pedir("PUT", cuerpo);
        if (!r || r.error) return;
        if (r.conflicto && !forzar) {
          if (r.planes) store.set("planes", NUBE_DAT.unirPlanes(r.planes, pk.planes));
          if (r.estudio) store.set("estudio", NUBE_DAT.unirObj(r.estudio, pk.estudio));
          if (r.ajedrez) store.set("ajedrez", NUBE_DAT.unirObj(r.ajedrez, pk.ajedrez));
          if (r.ts) store.set("nubeTs", Number(r.ts) || 0);
          NUBE_DAT.enCurso = false;
          return NUBE_DAT.subir(true);
        }
        if (r.ok || r.ts) {
          store.set("nubeTs", Number(r.ts) || Date.now());
          store.set("nubeSucio", 0);
          try { document.dispatchEvent(new Event("biex:nube")); } catch (e) {}
        }
      } finally { NUBE_DAT.enCurso = false; }
    },
    async bajar() {
      if (NUBE_DAT.bajado || !NUBE.tok()) return;
      NUBE_DAT.bajado = true;
      const r = await NUBE_DAT.pedir("GET");
      if (!r || r.error) { NUBE_DAT.bajado = false; return; }
      const tsSrv = Number(r.ts) || 0, tsLoc = Number(store.get("nubeTs", 0)) || 0;
      if (tsSrv > tsLoc) {
        if (r.planes) store.set("planes", NUBE_DAT.unirPlanes(r.planes, store.get("planes", null)));
        if (r.estudio) store.set("estudio", NUBE_DAT.unirObj(r.estudio, store.get("estudio", null)));
        if (r.ajedrez) store.set("ajedrez", NUBE_DAT.unirObj(r.ajedrez, store.get("ajedrez", null)));
        store.set("nubeTs", tsSrv);
        try { document.dispatchEvent(new Event("biex:nube")); } catch (e) {}
      }
      if (store.get("nubeSucio", 0) || (!tsSrv && (store.get("planes", null) || store.get("estudio", null) || store.get("ajedrez", null)))) NUBE_DAT.cambio();
    },
  };
  window.BiExNube = NUBE_DAT;
  // el aviso de dónde se guardan (verso, «Mis marcadores» y la app)
  const avisoGuarda = () => NUBE.tok()
    ? ["Se guarda en este dispositivo y en nuestro servidor con tu cuenta de Escudriña, donde además hacemos una copia de seguridad cada 12 horas; solo tú lo ves. Aun así, por prudencia, haz tu propio respaldo tan seguido como lo necesites: ", h("a", { href: "#/marcadores", text: "«Exportar» en Mis marcadores" }), "."]
    : ["Se guarda en este navegador. Borrar solo la caché no lo toca; si se borran los datos del sitio o se desinstala la app, se pierde. Con tu cuenta de ", h("a", { href: "#/escudrina", text: "Escudriña" }), " se guarda también en nuestro servidor, con una copia de seguridad cada 12 horas. Por prudencia, haz tu propio respaldo tan seguido como lo necesites: ", h("a", { href: "#/marcadores", text: "«Exportar» en Mis marcadores" }), "."];
  function aplicarMarca(el, x) {
    for (const [k] of TEMAS_BASE) el.classList.remove("mk-" + k);
    el.classList.toggle("mk", !!(x && x.col));
    el.classList.toggle("mk-con-nota", !!(x && x.nota));
    if (x && x.col) el.classList.add("mk-" + x.col);
    return el;
  }
  const marcaDe = (b, cap, v) => MK.get(b.c, cap, v);
  // Selector de color de estudio BiEx: armonizado con los temas Oscuro y Pergamino (sin diálogos grises del sistema)
  const PALETA_BIEX = [
    ["#d86ca4", "Rosa antiguo"], ["#52b8d8", "Zafiro celeste"], ["#a8c957", "Oliva claro"], ["#e38f73", "Terracota"],
    ["#f06f6c", "Coral"], ["#a97ef5", "Amatista"], ["#49b882", "Esmeralda"], ["#e5ad42", "Miel dorada"],
    ["#6484e8", "Índigo"], ["#d64f6e", "Carmesí"], ["#38b8a8", "Jade"], ["#cc7a44", "Cobre"]
  ];
  function hexAHsv(hex) {
    const s = HEX_OK(hex) ? hex.trim().slice(1) : "d86ca4";
    const r = parseInt(s.slice(0, 2), 16) / 255, g = parseInt(s.slice(2, 4), 16) / 255, b = parseInt(s.slice(4, 6), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
    let hh = 0;
    if (d > 1e-6) {
      if (max === r) hh = ((g - b) / d + (g < b ? 6 : 0)) * 60;
      else if (max === g) hh = ((b - r) / d + 2) * 60;
      else hh = ((r - g) / d + 4) * 60;
    }
    return [hh, max ? d / max : 0, max];
  }
  function hsvAHex(hh, s, v) {
    const c = v * s, x = c * (1 - Math.abs(((hh / 60) % 2) - 1)), m = v - c;
    let r = 0, g = 0, b = 0;
    if (hh < 60) [r, g, b] = [c, x, 0];
    else if (hh < 120) [r, g, b] = [x, c, 0];
    else if (hh < 180) [r, g, b] = [0, c, x];
    else if (hh < 240) [r, g, b] = [0, x, c];
    else if (hh < 300) [r, g, b] = [x, 0, c];
    else [r, g, b] = [c, 0, x];
    const p = (n) => Math.round(Math.max(0, Math.min(255, (n + m) * 255))).toString(16).padStart(2, "0");
    return "#" + p(r) + p(g) + p(b);
  }
  function vistaSelectorColor(nombreTema, hexIni, alAplicar) {
    return () => {
      let [H, S, V] = hexAHsv(hexIni);
      const puntero = h("span", { class: "mk-cp-pt", "aria-hidden": "true" });
      const pad = h("div", { class: "mk-cp-pad", role: "slider", tabindex: "0", "aria-label": "Saturación y luminosidad del color" }, puntero);
      const thumb = h("span", { class: "mk-cp-thumb", "aria-hidden": "true" });
      const hueBar = h("div", { class: "mk-cp-hue", role: "slider", tabindex: "0", "aria-label": "Matiz del color", "aria-valuemin": "0", "aria-valuemax": "360" }, thumb);
      const muestraDot = h("span", { class: "mk-cp-chip", "aria-hidden": "true" });
      const hexIn = h("input", { type: "text", class: "mk-cp-hex", maxlength: "7", spellcheck: "false", autocomplete: "off", "aria-label": "Código hexadecimal del color" });
      const vJn11 = "En iniciación estaba siendo el [lo]ᵐⁿ discurso [cálculo] [razonamiento] [mensaje] [principio racional] [asunto] [tema], y [e] [incluso] [también] el [lo]ᵐⁿ discurso [cálculo] [razonamiento] [mensaje] [principio racional] [asunto] [tema] estaba siendo ante el ʾĔlōhî́m [Dios], y [e] [incluso] [también] divino [(un) dios] estaba siendo el [lo]ᵐⁿ discurso [cálculo] [razonamiento] [mensaje] [principio racional] [asunto] [tema].";
      const muestraVerso = h("div", { class: "mk-cp-prev" },
        h("span", { class: "mk-cp-pv-n", text: "1" }),
        h("span", { class: "mk-cp-pv-t" }, txtVersoL({ v: 1, t: vJn11, o: vJn11 })));
      const swBtns = PALETA_BIEX.map(([hx, nom]) => h("button", { type: "button", class: "mk-cp-sw", style: "--sw:" + hx, title: nom, "aria-label": nom, "data-hex": hx.toLowerCase(),
        onclick: () => { [H, S, V] = hexAHsv(hx); pintar(true); } }));
      const pintar = (ponerHex) => {
        const hex = hsvAHex(H, S, V);
        pad.style.setProperty("--cp-h", H.toFixed(1) + "deg");
        puntero.style.left = (S * 100).toFixed(2) + "%";
        puntero.style.top = ((1 - V) * 100).toFixed(2) + "%";
        puntero.style.backgroundColor = hex;
        thumb.style.left = ((H / 360) * 100).toFixed(2) + "%";
        thumb.style.backgroundColor = "hsl(" + H.toFixed(0) + ", 100%, 50%)";
        hueBar.setAttribute("aria-valuenow", String(Math.round(H)));
        muestraDot.style.backgroundColor = hex;
        muestraVerso.style.setProperty("--mkc", hex);
        if (ponerHex !== false) hexIn.value = hex.toUpperCase();
        for (const b of swBtns) b.classList.toggle("sel", b.dataset.hex === hex.toLowerCase());
      };
      const moverPad = (e) => {
        const r = pad.getBoundingClientRect(); if (!r.width || !r.height) return;
        S = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
        V = Math.max(0, Math.min(1, 1 - (e.clientY - r.top) / r.height));
        pintar(true);
      };
      const moverHue = (e) => {
        const r = hueBar.getBoundingClientRect(); if (!r.width) return;
        H = Math.max(0, Math.min(359.5, ((e.clientX - r.left) / r.width) * 360));
        pintar(true);
      };
      const enlazarArrastre = (el, fn) => {
        let on = false;
        el.addEventListener("pointerdown", (e) => { e.preventDefault(); on = true; try { el.setPointerCapture(e.pointerId); } catch (er) {} fn(e); });
        el.addEventListener("pointermove", (e) => { if (on) fn(e); });
        const fin = (e) => { if (!on) return; on = false; try { el.releasePointerCapture(e.pointerId); } catch (er) {} };
        el.addEventListener("pointerup", fin); el.addEventListener("pointercancel", fin);
      };
      enlazarArrastre(pad, moverPad);
      enlazarArrastre(hueBar, moverHue);
      pad.addEventListener("keydown", (e) => {
        const p = e.shiftKey ? 0.1 : 0.04;
        if (e.key === "ArrowRight") S = Math.min(1, S + p);
        else if (e.key === "ArrowLeft") S = Math.max(0, S - p);
        else if (e.key === "ArrowUp") V = Math.min(1, V + p);
        else if (e.key === "ArrowDown") V = Math.max(0, V - p);
        else return;
        e.preventDefault(); pintar(true);
      });
      hueBar.addEventListener("keydown", (e) => {
        const p = e.shiftKey ? 18 : 6;
        if (e.key === "ArrowRight" || e.key === "ArrowUp") H = (H + p) % 360;
        else if (e.key === "ArrowLeft" || e.key === "ArrowDown") H = (H - p + 360) % 360;
        else return;
        e.preventDefault(); pintar(true);
      });
      hexIn.addEventListener("input", () => {
        let v = hexIn.value.trim();
        if (v && v[0] !== "#") v = "#" + v;
        if (HEX_OK(v)) { [H, S, V] = hexAHsv(v); pintar(false); }
      });
      pintar(true);
      return cajaModal(cabModal("Seleccionar color", nombreTema || "Color de libre elección"),
        h("div", { class: "flot-cel mk-cp" },
          muestraVerso,
          pad,
          hueBar,
          h("div", { class: "mk-cp-hex-fila" }, muestraDot, h("span", { class: "mk-cp-hex-et", text: "Código" }), hexIn),
          h("div", { class: "mk-cp-pal-bl" },
            h("span", { class: "mk-cp-pal-tit", text: "Paleta sugerida BiEx" }),
            h("div", { class: "mk-cp-swatches", role: "group", "aria-label": "Colores sugeridos" }, swBtns))),
        h("div", { class: "m-pie" },
          h("button", { class: "btn chico", type: "button", onclick: volver, text: "Cancelar" }),
          h("button", { class: "btn chico oro", type: "button", onclick: () => { alAplicar(hsvAHex(H, S, V)); volver(); }, text: "Aplicar color" })));
    };
  }
  // Nombres de los 12 temas y elección libre del color para los 4 marcadores personalizables (libre1..libre4)
  function abrirEditarTemas(alGuardar) {
    const draftNom = Object.fromEntries(MK.temas());
    const draftCol = Object.assign({}, MK.colores());
    const fn = () => {
      const filasFijas = [], filasLibres = [];
      for (const [k] of TEMAS_BASE) {
        const n = draftNom[k] || k;
        const i = h("input", { type: "text", maxlength: "40", value: n, "aria-label": "Nombre del tema " + n });
        i.addEventListener("input", () => { draftNom[k] = i.value; });
        if (TEMAS_LIBRES[k]) {
          const hex = draftCol[k] || TEMAS_LIBRES[k];
          const btnCol = h("button", { type: "button", class: "mk-color-btn", style: "--mkc:" + hex, "aria-label": "Seleccionar color para " + n, title: "Seleccionar color",
            onclick: () => empujar(vistaSelectorColor(draftNom[k] || n, draftCol[k] || TEMAS_LIBRES[k], (nuevo) => { draftCol[k] = nuevo; })) },
            h("i", { "aria-hidden": "true" }));
          filasLibres.push(h("div", { class: "mk-tema-ed mk-" + k }, btnCol, i));
        } else {
          filasFijas.push(h("label", { class: "mk-tema-ed mk-" + k }, h("i", { "aria-hidden": "true" }), i));
        }
      }
      const terminar = () => { if (M.pila.length > 1) volver(); else cerrarModal(); if (alGuardar) alGuardar(); };
      const guardarT = () => {
        store.set("marcasTemas", Object.fromEntries(Object.entries(draftNom).map(([k, v]) => [k, String(v || "").trim().slice(0, 40)]).filter(([, t]) => t)));
        store.set("marcasColores", Object.fromEntries(Object.keys(TEMAS_LIBRES).map((k) => [k, HEX_OK(draftCol[k]) ? draftCol[k] : TEMAS_LIBRES[k]])));
        MK.aplicarColores(); NUBE.cambio(); terminar(); avisar("Colores y temas guardados");
      };
      return cajaModal(cabModal("Colores y temas", "Personaliza los nombres y elige 4 colores libres a tu gusto"),
        h("div", { class: "mk-temas-ed" },
          h("p", { class: "mk-temas-sep", text: "4 colores de libre elección · toca el círculo para elegir" }), ...filasLibres,
          h("p", { class: "mk-temas-sep", text: "8 temas de la casa" }), ...filasFijas),
        h("div", { class: "m-pie" },
          h("button", { class: "btn chico", type: "button", onclick: () => { store.set("marcasTemas", {}); store.set("marcasColores", {}); MK.aplicarColores(); NUBE.cambio(); terminar(); avisar("Colores restablecidos"); }, text: "Restablecer" }),
          h("button", { class: "btn chico oro", type: "button", onclick: guardarT, text: "Guardar" })));
    };
    if (modal.open) empujar(fn); else abrirModal(fn);
  }
  function siguienteVersoConNota(c, cap, v) {
    const orden = new Map(librosEnOrden().map((bb, i) => [bb.c, i]));
    const conNota = Object.values(MK.todo()).filter((x) => x && x.nota && String(x.nota).trim() && libroDe(x.c))
      .sort((a, b) => (orden.get(a.c) - orden.get(b.c)) || (a.cap - b.cap) || (a.v - b.v));
    if (!conNota.length) return null;
    const oAct = orden.get(c) ?? 0;
    const otro = conNota.find((x) => {
      const ox = orden.get(x.c) ?? 0;
      return ox > oAct || (ox === oAct && (x.cap > cap || (x.cap === cap && x.v > v)));
    }) || conNota.find((x) => !(x.c === c && x.cap === cap && x.v === v));
    return otro || null;
  }
  // En la ventana del verso: elegir un tema de color (8 de la casa + 4 libres), escribir nota y saltar al siguiente verso con nota
  function bloqueEstudio(b, cap, v, alIrVerso) {
    const x = MK.get(b.c, cap, v) || {};
    const temas = h("div", { class: "mk-temas", role: "radiogroup", "aria-label": "Marcar el verso con un tema" });
    const pintarTemas = (sel) => { for (const bt of temas.children) bt.setAttribute("aria-checked", String(bt.dataset.k === sel)); };
    temas.append(...MK.temas().map(([k, n]) => h("button", { type: "button", class: "mk-tema mk-" + k, role: "radio", "data-k": k, "aria-checked": String(x.col === k),
      onclick: () => { const ya = (MK.get(b.c, cap, v) || {}).col === k; MK.poner(b.c, cap, v, { col: ya ? null : k }); pintarTemas(ya ? null : k); avisar(ya ? "Marca quitada" : "Marcado: " + n); } },
      h("i", { "aria-hidden": "true" }), h("span", { text: n }))));
    const nota = h("textarea", { class: "mk-nota", rows: "3", maxlength: "4000", spellcheck: "true", placeholder: "Tu nota de estudio sobre este verso…", "aria-label": "Nota de estudio del verso " + cap + ":" + v });
    nota.value = x.nota || "";
    let reloj = 0;
    const guardar = () => { clearTimeout(reloj); MK.poner(b.c, cap, v, { nota: nota.value.slice(0, 4000) }); };
    nota.addEventListener("input", () => { clearTimeout(reloj); reloj = setTimeout(guardar, 400); });
    nota.addEventListener("blur", guardar);
    const sig = siguienteVersoConNota(b.c, cap, v);
    const btnSig = sig ? h("button", { type: "button", class: "mk-sig-nota", title: "Ir al siguiente verso con nota: " + refCorta(libroDe(sig.c), sig.cap, sig.v),
      onclick: async () => {
        guardar();
        if (alIrVerso && sig.c === b.c) { alIrVerso(sig.cap, sig.v); return; }
        const bb = libroDe(sig.c); if (!bb) return;
        try {
          const Lc = await lectura(bb.c);
          const vs2 = Lc.caps[sig.cap] || [];
          reemplazar(vistaVerso({ b: bb, cap: sig.cap, v: sig.v, versos: vs2, toque: null }));
        } catch (e) { irDesdeModal("#/" + bb.c + "/" + sig.cap + "/l/" + sig.v); }
      } }, "Siguiente con nota ›") : null;
    const btnPers = h("button", { type: "button", class: "mk-ir", onclick: () => abrirEditarTemas(() => pintarModal()) }, "Personalizar colores");
    return h("div", { class: "bloque mk-bloque" },
      h("h4", {}, svg(ICO.marcador), h("span", { text: "Tu estudio" }),
        h("span", { class: "mk-cab-acc" }, btnSig, btnPers, h("a", { class: "mk-ir", href: "#/marcadores", text: "Mis marcadores" }))),
      temas, nota,
      h("p", { class: "nota-ui" }, ...avisoGuarda()));
  }
  // Página «Mis marcadores»: filtrar por tema, buscar en las notas, ir al verso, exportar e importar
  async function vistaMarcadores() {
    document.title = "Mis marcadores · BiEx";
    navActual("");
    const orden = new Map(librosEnOrden().map((b, i) => [b.c, i]));
    const lista = () => Object.values(MK.todo()).filter((x) => x && libroDe(x.c)).sort((a, b) => (orden.get(a.c) - orden.get(b.c)) || (a.cap - b.cap) || (a.v - b.v));
    let filtro = "", q = "";
    const cuerpo = h("div", { class: "mk-lista" });
    const chips = h("div", { class: "q-chips mk-filtros", role: "group", "aria-label": "Filtrar por tema" });
    const buscador = h("input", { class: "mk-buscar", type: "search", placeholder: "Buscar en tus notas y versos…", "aria-label": "Buscar en tus marcadores" });
    buscador.addEventListener("input", () => { q = claveEs(buscador.value.trim()); pintar(); });
    const textos = {};
    const textoDe = async (x) => { try { const Lc = await lectura(x.c); const L = (Lc.caps[x.cap] || []).find((y) => y.v === x.v); return L ? textoPlano(txtVersoL(L).textContent || "") : ""; } catch (e) { return ""; } };
    function pintarChips(todos) {
      const n = (k) => todos.filter((x) => (k === "nota" ? x.nota : x.col === k)).length;
      const ch = (k, t, cnt, cls) => h("button", { type: "button", class: "q-chip " + (cls || ""), "aria-pressed": String(filtro === k), onclick: () => { filtro = filtro === k ? "" : k; pintar(); } }, cls ? h("i", { class: "mk-punto" }) : null, t + " · " + cnt);
      chips.replaceChildren(ch("", "Todos", todos.length), ...MK.temas().filter(([k]) => n(k)).map(([k, t]) => ch(k, t, n(k), "mk-" + k)), n("nota") ? ch("nota", "Con nota", n("nota")) : null);
    }
    function pintar() {
      const todos = lista();
      pintarChips(todos);
      const vis = todos.filter((x) => (!filtro || (filtro === "nota" ? x.nota : x.col === filtro)) && (!q || claveEs((x.nota || "") + " " + (textos[MK.clave(x.c, x.cap, x.v)] || "") + " " + refCorta(libroDe(x.c), x.cap, x.v)).includes(q)));
      if (!todos.length) { cuerpo.replaceChildren(h("div", { class: "mk-vacio" }, svg(ICO.marcador), h("p", { text: "Aún no tienes marcadores." }), h("p", { class: "nota-ui", text: "Abre cualquier verso (tócalo mientras lees) y elige un tema de color o escribe una nota. Aparecerán aquí, ordenados por libro." }))); return; }
      if (!vis.length) { cuerpo.replaceChildren(h("p", { class: "nota-ui", text: "Ningún marcador coincide." })); return; }
      const grupos = [];
      let actual = null;
      for (const x of vis) {
        if (!actual || actual.c !== x.c) { actual = { c: x.c, xs: [] }; grupos.push(actual); }
        actual.xs.push(x);
      }
      cuerpo.replaceChildren(...grupos.map((g) => { const b = libroDe(g.c); return h("section", { class: "mk-grupo", "data-sec": b.t || b.n }, h("h3", {}, etLibro(b), h("small", { text: " · " + g.xs.length })), g.xs.map((x) => tarjeta(b, x))); }));
    }
    function tarjeta(b, x) {
      const k = MK.clave(x.c, x.cap, x.v);
      const tx = h("p", { class: "mk-tx" }, textos[k] != null ? textos[k] : "…");
      if (textos[k] == null) textoDe(x).then((t) => { textos[k] = t; tx.textContent = t; });
      const quitar = h("button", { class: "btn-icono mk-quitar", type: "button", "aria-label": "Quitar el marcador de " + refCorta(b, x.cap, x.v), title: "Quitar",
        onclick: () => { MK.poner(x.c, x.cap, x.v, { col: null, nota: "" }); pintar(); avisar("Marcador quitado"); } }, svg(ICO.papelera));
      return aplicarMarca(h("article", { class: "mk-card" },
        h("a", { class: "mk-ref", href: "#/" + x.c + "/" + x.cap + "/l/" + x.v }, h("span", { text: x.cap + ":" + x.v }), x.col ? h("small", { text: MK.nombre(x.col) }) : null, svg(ICO.der)),
        tx, x.nota ? h("p", { class: "mk-n" }, svg(ICO.nota), h("span", { text: x.nota })) : null, quitar), x);
    }
    // Llevar los marcadores a otro dispositivo
    const descargar = () => {
      const datos = { app: "BiEx", tipo: "marcadores", v: 1, exportado: new Date().toISOString(), temas: Object.fromEntries(MK.temas()), colores: MK.colores(), marcas: MK.todo(), planes: store.get("planes", null) };
      const a = h("a", { href: URL.createObjectURL(new Blob([JSON.stringify(datos, null, 1)], { type: "application/json" })), download: "biex-marcadores-" + new Date().toISOString().slice(0, 10) + ".json" });
      document.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
      avisar("Archivo de marcadores descargado");
    };
    const archivo = h("input", { type: "file", accept: "application/json,.json", hidden: true });
    archivo.addEventListener("change", async () => {
      const f = archivo.files && archivo.files[0]; archivo.value = ""; if (!f) return;
      try {
        if (f.size > 4e6) throw new Error("grande");
        const d = JSON.parse(await f.text());
        if (!d || d.app !== "BiEx" || d.tipo !== "marcadores" || typeof d.marcas !== "object") throw new Error("formato");
        const m = MK.todo(); let n = 0;
        for (const x of Object.values(d.marcas)) {
          if (!x || !libroDe(String(x.c)) || !(x.cap > 0) || !(x.v > 0)) continue;
          const col = TEMAS_BASE.some(([k]) => k === x.col) ? x.col : null, nota = typeof x.nota === "string" ? x.nota.slice(0, 4000) : "";
          if (!col && !nota.trim()) continue;
          const k = MK.clave(String(x.c), x.cap | 0, x.v | 0), prev = m[k] || {};
          m[k] = Object.assign({ c: String(x.c), cap: x.cap | 0, v: x.v | 0 }, prev, col ? { col } : {}, nota.trim() ? { nota: prev.nota && prev.nota !== nota ? prev.nota + "\n\n" + nota : nota } : {}, { f: +x.f || Date.now() });
          n++;
        }
        if (d.temas && typeof d.temas === "object" && !store.get("marcasTemas", null)) store.set("marcasTemas", Object.fromEntries(TEMAS_BASE.map(([k]) => [k, typeof d.temas[k] === "string" ? d.temas[k].slice(0, 40) : ""]).filter(([, t]) => t)));
        if (d.colores && typeof d.colores === "object") {
          const cols = Object.assign({}, store.get("marcasColores", null) || {});
          for (const k of Object.keys(TEMAS_LIBRES)) if (HEX_OK(d.colores[k])) cols[k] = d.colores[k].trim();
          store.set("marcasColores", cols); MK.aplicarColores();
        }
        let np = 0;
        if (d.planes && typeof d.planes === "object" && d.planes.hechos && typeof d.planes.hechos === "object") {
          const e = Object.assign({ act: null, hechos: {}, ini: {} }, store.get("planes", null) || {});
          for (const [id, hs] of Object.entries(d.planes.hechos)) if (Array.isArray(hs)) { const u = new Set([...(e.hechos[id] || []), ...hs.filter((x) => Number.isInteger(x) && x >= 0 && x < 400)]); e.hechos[id] = [...u].sort((a, b) => a - b); np += hs.length; }
          for (const [id, t] of Object.entries(d.planes.ini || {})) if (!e.ini[id] && typeof t === "string") e.ini[id] = t;
          if (!e.act && typeof d.planes.act === "string") e.act = d.planes.act;
          store.set("planes", e);
        }
        store.set("marcas", m); NUBE.cambio(); pintar(); avisar((n ? "Importados " + n + " marcadores" : "El archivo no tenía marcadores") + (np ? " y el avance de los planes" : ""));
      } catch (e) { avisar("Ese archivo no es una copia de marcadores de BiEx"); }
    });
    const copiarTexto = async () => {
      const todos = lista();
      const lineas = [];
      for (const x of todos) { const b = libroDe(x.c), k = MK.clave(x.c, x.cap, x.v); if (textos[k] == null) textos[k] = await textoDe(x); lineas.push(refCorta(b, x.cap, x.v) + (x.col ? " [" + MK.nombre(x.col) + "]" : "") + "\n" + textos[k] + (x.nota ? "\nNota: " + x.nota : "")); }
      try { await navigator.clipboard.writeText(lineas.join("\n\n")); avisar("Copiado como texto"); } catch (e) { avisar("No se pudo copiar"); }
    };
    const editarTemas = () => abrirEditarTemas(() => pintar());
    let confirmar = 0;
    const borrarTodo = h("button", { class: "btn chico mk-borrar", type: "button", onclick: (e) => {
      const bt = e.currentTarget;
      if (!confirmar) { confirmar = 1; bt.lastChild.textContent = "¿Seguro? Toca de nuevo"; setTimeout(() => { confirmar = 0; if (bt.isConnected) bt.lastChild.textContent = "Borrar todos"; }, 4000); return; }
      confirmar = 0; store.set("marcas", {}); NUBE.cambio(); bt.lastChild.textContent = "Borrar todos"; pintar(); pintarDiario(); pintarGrafo(); avisar("Marcadores borrados");
    } }, svg(ICO.papelera), h("span", { text: "Borrar todos" }));
    let modoVista = store.get("mkModo", "libros") === "diario" ? "diario" : "libros";
    const zonaGrafo = h("div", {});
    const zonaDiario = h("div", { class: "di-linea", hidden: modoVista !== "diario" });
    const ctlLibros = h("div", { class: "mk-ctl", hidden: modoVista !== "libros" }, buscador, chips);
    cuerpo.hidden = modoVista !== "libros";
    const pintarGrafo = () => {
      const todos = lista();
      if (!todos.length) { zonaGrafo.replaceChildren(); return; }
      zonaGrafo.replaceChildren(tarjetaMinigrafo("Tu constelación de notas", "Tus marcadores y notas conectados por libro y tema de color · arrastra o toca un nodo.", grafoMarcadores(), "#/constelacion?capa=notas"));
    };
    const pintarDiario = () => {
      const est = leerEstudio();
      const titIn = h("input", { class: "di-in", type: "text", maxlength: "120", placeholder: "Título de tu reflexión (ej. Ecos de lόgος en YÔḥānā́n 1)", "aria-label": "Título de la reflexión" });
      const refIn = h("input", { class: "di-in", type: "text", maxlength: "40", placeholder: "Cita opcional (ej. JHN 1:1)", "aria-label": "Cita opcional" });
      const txtIn = h("textarea", { class: "di-area", maxlength: "4000", placeholder: "Escribe tu hallazgo, observación gramatical o nota de estudio…", "aria-label": "Contenido de la reflexión" });
      const guardarEnt = () => {
        const tit = titIn.value.trim(), txt = txtIn.value.trim(), ref = refIn.value.trim();
        if (!tit && !txt) { avisar("Escribe un título o una nota para guardarla en tu diario"); return; }
        const st = leerEstudio();
        const id = "d" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
        st.diario[id] = { id, t: Date.now(), tit: tit || "Reflexión de estudio", ref, txt };
        guardarEstudio(st);
        avisar("Reflexión guardada en tu diario");
        pintarDiario();
      };
      const formDiario = h("div", { class: "di-form" },
        h("span", { class: "eyebrow", text: "Nueva entrada en tu diario de estudio" }),
        h("div", { class: "di-form-fila" }, titIn, refIn),
        txtIn,
        h("div", { class: "sn-acc" },
          h("button", { class: "btn chico oro", type: "button", onclick: guardarEnt }, svg(ICO.nota), h("span", { text: "Guardar en mi diario" })),
          h("button", { class: "btn chico", type: "button", onclick: () => exportarDiarioMd() }, svg(ICO.descargar), h("span", { text: "Exportar diario (.md)" }))));
      const pares = Object.values(est.pares || {}).sort((a, b) => (b.t || 0) - (a.t || 0));
      const secPares = pares.length ? h("div", { class: "tarjeta" },
        h("h2", { text: "Pares sinópticos guardados" }),
        h("div", { class: "di-pares" }, pares.map((p) => {
          const b1 = libroDe(p.a && p.a.c), b2 = libroDe(p.b && p.b.c);
          if (!b1 || !b2) return null;
          const et = (b1.t || b1.n) + " " + p.a.cap + ":" + p.a.v + " ↔ " + (b2.t || b2.n) + " " + p.b.cap + ":" + p.b.v;
          return h("a", { class: "di-par", href: "#/sinopsis/" + p.a.c + "." + p.a.cap + "." + p.a.v + "/" + p.b.c + "." + p.b.cap + "." + p.b.v }, svg(ICO.sinopsis), h("span", { text: et }));
        }).filter(Boolean))) : null;
      const items = [];
      for (const e of Object.values(est.diario || {})) if (e && !e.borrado) items.push({ tipo: "ent", t: +e.t || 0, e });
      for (const x of lista()) items.push({ tipo: "mk", t: +x.f || 0, x });
      items.sort((a, b) => b.t - a.t);
      const porDia = new Map();
      const fmtDia = (ms) => ms ? new Date(ms).toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : "Sin fecha registrada";
      for (const it of items) {
        const k = fmtDia(it.t);
        if (!porDia.has(k)) porDia.set(k, []);
        porDia.get(k).push(it);
      }
      const linea = items.length ? [...porDia.entries()].map(([dia, xs]) => h("section", { class: "di-dia" },
        h("h3", { class: "di-dia-h", text: dia }),
        ...xs.map((it) => {
          if (it.tipo === "mk") return tarjeta(libroDe(it.x.c), it.x);
          const e = it.e;
          const linkRef = parsearRefCorta(e.ref);
          return h("article", { class: "di-ent" },
            h("div", { class: "di-ent-cab" },
              h("b", { text: e.tit || "Reflexión" }),
              h("small", { text: e.t ? new Date(e.t).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" }) : "" })),
            e.txt ? h("p", { text: e.txt }) : null,
            h("div", { class: "di-ent-pie" },
              linkRef ? h("a", { class: "btn chico", href: "#/" + linkRef.c + "/" + linkRef.cap + "/l/" + linkRef.v }, svg(ICO.libro), h("span", { text: refCorta(libroDe(linkRef.c), linkRef.cap, linkRef.v) })) : (e.ref ? h("span", { class: "chip", text: e.ref }) : h("span")),
              h("button", { class: "btn chico", type: "button", onclick: () => { const st = leerEstudio(); st.diario[e.id] = { id: e.id, borrado: true, t: Date.now() }; guardarEstudio(st); avisar("Entrada borrada"); pintarDiario(); } }, svg(ICO.papelera), h("span", { text: "Quitar" }))));
        }))) : [h("p", { class: "nota-ui", text: "Tu diario cronológico reunirá aquí tus reflexiones libres y todos los versos que marques o anotes." })];
      zonaDiario.replaceChildren(formDiario, secPares, ...linea);
    };
    const cambiarModo = (m) => {
      modoVista = m; store.set("mkModo", m);
      ctlLibros.hidden = m !== "libros";
      cuerpo.hidden = m !== "libros";
      zonaDiario.hidden = m !== "diario";
      for (const b of tabsModo.children) b.setAttribute("aria-pressed", String(b.dataset.m === m));
      if (m === "diario") pintarDiario();
    };
    const tabsModo = h("div", { class: "di-tabs", role: "group", "aria-label": "Vista de estudio" },
      h("button", { type: "button", "data-m": "libros", "aria-pressed": String(modoVista === "libros"), text: "Por libro", onclick: () => cambiarModo("libros") }),
      h("button", { type: "button", "data-m": "diario", "aria-pressed": String(modoVista === "diario"), text: "Diario de estudio", onclick: () => cambiarModo("diario") }));
    vista().replaceChildren(h("div", { class: "in" }, h("section", { class: "panel mk-pag" },
      barraVolver(),
      h("div", { class: "panel-cab" }, h("span", { class: "eyebrow", text: "Tu estudio · marcadores, notas y diario" }), h("h1", { class: "texto", text: "Mis marcadores y diario" }),
        h("p", { class: "q-lead", text: "Los versos que marcaste en 12 colores, tus notas y tu diario cronológico de estudio. Todo se sincroniza automáticamente con tu cuenta." })),
      zonaGrafo,
      tabsModo,
      ctlLibros,
      cuerpo,
      zonaDiario,
      h("div", { class: "mk-acciones", "data-sec": "Respaldo y temas" },
        h("button", { class: "btn chico", type: "button", onclick: descargar }, svg(ICO.descargar), h("span", { text: "Exportar" })),
        h("button", { class: "btn chico", type: "button", onclick: () => abrirExportar("marcadores") }, svg(ICO.descargar), h("span", { text: "Obsidian (.md)" })),
        h("button", { class: "btn chico", type: "button", onclick: () => archivo.click() }, svg(ICO.importar), h("span", { text: "Importar" })),
        h("button", { class: "btn chico", type: "button", onclick: copiarTexto }, svg(ICO.copiar), h("span", { text: "Copiar como texto" })),
        h("button", { class: "btn chico", type: "button", onclick: editarTemas }, svg(ICO.opciones), h("span", { text: "Nombres de los temas" })),
        borrarTodo, archivo),
      h("div", { class: "nota-guarda", role: "note" }, svg(ICO.marcador), h("p", {}, h("b", { text: NUBE.tok() ? "Tus notas y diario, en este dispositivo y en la nube. " : "Tus notas viven en este dispositivo. " }), ...avisoGuarda())),
      h("p", { class: "nota-ui", text: NUBE.tok() ? "Con tu cuenta de Escudriña, tus marcadores y diario pasan solos a tus otros dispositivos al entrar con la misma cuenta. Nadie más los ve." : "Sin cuenta, tus marcadores y diario se guardan solo en este navegador: nadie más los ve. Para sincronizarlos entre dispositivos, entra con tu cuenta de Escudriña o usa «Exportar»." }))));
    pintar();
    pintarGrafo();
    if (modoVista === "diario") pintarDiario();
    alTope();
  }

  // ------------------------------------------------------------------ análisis
  const COLOR = {
    clase: (m, cl) => "var(--c-" + cl + ")",
    caso: (m) => ({ N: "var(--c-N)", G: "var(--c-A)", D: "var(--c-CONJ)", A: "var(--c-PR)", V: "var(--c-PRT)" }[m.case] || null),
    tiempo: (m) => ({ P: "var(--c-N)", I: "var(--c-CONJ)", F: "var(--c-A)", A: "var(--c-V)", R: "var(--c-PR)", L: "var(--c-PRT)" }[m.tense] || null),
    ninguno: () => null,
  };
  const CLAVES = {
    clase: () => Object.entries(CLASE).filter(([k]) => k !== "X").map(([k, t]) => [t, "var(--c-" + k + ")"]),
    caso: () => [["nominativo", "var(--c-N)"], ["genitivo", "var(--c-A)"], ["dativo", "var(--c-CONJ)"], ["acusativo", "var(--c-PR)"], ["vocativo", "var(--c-PRT)"]],
    tiempo: () => [["presente", "var(--c-N)"], ["imperfecto", "var(--c-CONJ)"], ["futuro", "var(--c-A)"], ["aoristo", "var(--c-V)"], ["perfecto", "var(--c-PR)"], ["pluscuamperfecto", "var(--c-PRT)"]],
    ninguno: () => [],
  };
  const RESALTA = {
    "": ["Nada", () => true],
    aor: ["Verbos en aoristo", (m) => m.pos === "V" && m.tense === "A"],
    aor1: ["Aoristos sigmáticos", (m, t) => m.tense === "A" && t[7] === 1],
    aor2: ["Aoristos temáticos", (m, t) => m.tense === "A" && t[7] === 2],
    aor3: ["Aoristos atemáticos", (m, t) => m.tense === "A" && t[7] === 3],
    part: ["Participios", (m) => m.pos === "V" && (m.mood === "P" || m.mood === "R")],
    inf: ["Infinitivos", (m) => m.pos === "V" && m.mood === "N"],
    imp: ["Imperativos", (m) => m.pos === "V" && m.mood === "M"],
    subj: ["Subjuntivos", (m) => m.pos === "V" && m.mood === "S"],
    gen: ["Genitivos", (m) => m.case === "G"],
    dat: ["Dativos", (m) => m.case === "D"],
    neu: ["Neutros", (m) => m.gender === "N"],
    prop: ["Nombres propios", (m) => !!m.propio],
    var: ["Palabras que faltan en alguna edición", (m, t) => !!(t[6])],
    sin: ["Palabras aún sin traducción fijada", (m, t) => !t[3]],
    raras: ["Palabras casi exóticas (3 veces o menos)", (m, t) => esRara(t)],
  };
  // AF6 (BiEx, 21-nov-2026: «las palabras casi exóticas en toda la Biblia llevan un color único»): lemas que aparecen 3 veces o
  // menos en la Nueva Voluntad (ἐφημερία, 2: Lc 1:5 y 1:8). Por ahora con los datos de la Nueva Voluntad.
  const RARA_MAX = 3;
  const esRara = (t) => !!(T && T.LN && T.LN[t[1]] > 0 && T.LN[t[1]] <= RARA_MAX);
  // Tarjeta de una palabra: griego, transliteración, traducción y morfología abreviada
  function tarjetaPalabra(t, alTocar, extra) {
    const m = T.P[t[2]], cl = T.MC[t[2]], tr = T.TR[t[3] || 0];
    const btn = h("button", Object.assign({ type: "button", class: "pal" + (t[6] ? " var" : "") + (prefs.caja === "may" ? " may" : ""), "aria-pressed": "false",
      "aria-label": T.F[t[0]] + ", " + (tr || "sin traducción fijada") + ", " + mdTok(t) + ". Abrir el análisis", onclick: alTocar }, extra || {}),
      h("span", { class: "g" }, spanGk(T.F[t[0]]), punt(t[4]) ? h("sup", { text: punt(t[4]) }) : null),
      h("span", { class: "tl", text: T.FT[t[0]] }),
      h("span", { class: "tr" + (tr ? "" : " sin"), text: tr || "·" }),
      h("span", { class: "mo", text: abreviar(m, cl, t[8], t[7]) }));
    btn._t = t; btn._m = m; btn._cl = cl;
    if (esRara(t)) { btn.classList.add("rara"); btn.title = "Palabra casi exótica: su lema aparece " + (T.LN[t[1]] === 1 ? "una sola vez" : T.LN[t[1]] + " veces") + " en la Nueva Voluntad"; }
    const k = (COLOR[prefs.color] || COLOR.clase)(m, cl);
    if (k) btn.style.setProperty("--k", k);
    return btn;
  }
  function cuerpoAnalisis(b, cap, versosA, versosL) {
    const porV = new Map(versosL.map((x) => [x.v, x]));
    const cont = h("div", { class: "analisis" });
    const lista = [];
    for (const [v, toks] of versosA) {
      const L = porV.get(v);
      const fila = h("div", { class: "palabras" }, toks.map((t, i) => {
        const btn = tarjetaPalabra(t, () => abrirPalabraAnalisis(v, i), { "data-v": v, "data-i": i });
        lista.push(btn);
        return btn;
      }));
      const A = anadido(b.c, cap, v), aviso = avisoAnadido(b, cap, v, A, false, !cont.querySelector(".av"));
      if (aviso) cont.append(aviso);
      if (A && !A.entero) { const i0 = A.ini && A.p.i != null ? A.p.i : 0, j0 = A.fin && A.p.j != null ? A.p.j : 1e9; for (const el of fila.children) if (+el.dataset.i >= i0 && +el.dataset.i <= j0) el.classList.add("an"); }
      cont.append(h("div", { class: "av" + (A ? (A.entero ? " anadido" : " an-parcial") : ""), id: "v" + v },
        h("div", { class: "av-cab" }, h("b", { text: v }), L ? h("p", {}, txtVerso(L)) : h("p")), fila));
    }
    const lente = (k, t) => h("button", { type: "button", class: "lente", "aria-pressed": prefs[k] ? "true" : "false", onclick: (e) => { prefs[k] = !prefs[k]; guardarPrefs(); e.currentTarget.setAttribute("aria-pressed", prefs[k] ? "true" : "false"); aplicarFilas(); } }, t);
    const lentes = h("div", { class: "lentes" },
      lente("tl", "Transliteración"), lente("tr", "Traducción"), lente("mo", "Morfología"),
      h("div", { class: "seg", role: "group", "aria-label": "Escritura del griego" },
        h("button", { type: "button", "data-caja": "min", "aria-pressed": prefs.caja === "min" ? "true" : "false", title: "Minúsculas con acentos", onclick: () => { prefs.caja = "min"; guardarPrefs(); aplicarCaja(); } }, h("span", { class: "gk", text: "αβγ" })),
        h("button", { type: "button", "data-caja": "may", "aria-pressed": prefs.caja === "may" ? "true" : "false", title: "Mayúsculas (uncial)", onclick: () => { prefs.caja = "may"; guardarPrefs(); aplicarCaja(); } }, h("span", { class: "gk", text: "ΑΒΓ" }))),
      h("label", {}, "Color", h("select", { "aria-label": "Colorear por", onchange: (e) => { prefs.color = e.target.value; guardarPrefs(); pintar(); } },
        [["clase", "por categoría"], ["caso", "por caso"], ["tiempo", "por tiempo verbal"], ["ninguno", "sin color"]].map(([v, t]) => h("option", { value: v, selected: prefs.color === v ? true : null, text: t })))),
      h("label", {}, "Resaltar", h("select", { "aria-label": "Resaltar", onchange: (e) => { prefs.resalta = e.target.value; guardarPrefs(); pintar(); } },
        Object.entries(RESALTA).map(([v, [t]]) => h("option", { value: v, selected: prefs.resalta === v ? true : null, text: t })))));
    const claves = h("div", { class: "claves", "aria-hidden": "true" });
    function aplicarFilas() { cont.classList.toggle("sin-tl", !prefs.tl); cont.classList.toggle("sin-tr", !prefs.tr); cont.classList.toggle("sin-mo", !prefs.mo); }
    function pintar() {
      const col = COLOR[prefs.color] || COLOR.clase, test = (RESALTA[prefs.resalta] || RESALTA[""])[1];
      for (const btn of lista) {
        const k = col(btn._m, btn._cl);
        if (k) btn.style.setProperty("--k", k); else btn.style.removeProperty("--k");
        btn.classList.toggle("apagada", !!prefs.resalta && !test(btn._m, btn._t));
      }
      claves.replaceChildren(...(CLAVES[prefs.color] || CLAVES.clase)().map(([t, k]) => h("span", { style: "--k:" + k, text: t })));
    }
    aplicarFilas(); pintar();
    esc.lista = lista;
    return [lentes, claves, guiaSeccion("analisis"), encabezado(b, cap, "a"), cont, finCap(b, cap, "a")];
  }
  function abrirPalabraAnalisis(v, i) {
    const b = libroDe(esc.libro), cap = esc.cap;
    historial(esc.libro, cap, v, "a");
    const fila = (esc.lista || []).filter((x) => +x.dataset.v === v);
    if (!fila.length) return;
    const toks = fila.map((x) => x._t);
    const L = (esc.versos || []).find((x) => x.v === v);
    const marcar = (k) => {
      for (const x of esc.lista || []) if (x.getAttribute("aria-pressed") === "true") x.setAttribute("aria-pressed", "false");
      if (k == null) return;
      const btn = fila[k]; if (btn) btn.setAttribute("aria-pressed", "true");
      ponerHash("#/" + b.c + "/" + cap + "/a/" + v + "/" + k);
    };
    marcar(i);
    abrirModal(vistaPalabra({ b, cap, v, toks, i, L, desde: "analisis", alMover: marcar }), () => {
      const sel = (esc.lista || []).find((x) => x.getAttribute("aria-pressed") === "true");
      marcar(null);
      ponerHash("#/" + b.c + "/" + cap + "/a/" + v);
      if (sel) { try { sel.focus({ preventScroll: true }); } catch (e) { /* ignorar */ } }
    });
  }
  function enfocar(v, i) {
    if (v == null) return;
    const el = document.getElementById("v" + v);
    if (!el && esc.modo !== "a" && prefs.nivel) { prefs.nivel = ""; guardarPrefs(); const c = esc.libro, cap = esc.cap; esc.libro = null; vistaLibro(c, cap, "l", v, i); return; }
    const dSig = esc.modo === "a" && i != null && i !== "m" ? destelloSig : null;
    const iraDestello = !!(dSig && dSig.c === esc.libro && dSig.cap === esc.cap && dSig.v === v && String(dSig.i) === String(i));
    if (el) {
      marcarVerso(v, true);
      if (iraDestello) {
        altoBarraHoja(); el.classList.add("cv-vis");
      } else if (!intentarRestaurar()) {
        // al comienzo de un pasaje añadido, se lleva a la vista también su aviso
        const An = anadido(esc.libro, esc.cap, v), prev = An && An.ini ? (el.classList.contains("vs") ? el.closest(".peri") || el : el).previousElementSibling : null;
        const obj = prev && prev.classList.contains("aviso-anadido") ? prev : el;
        altoBarraHoja(); el.classList.add("cv-vis");
        for (let x = el.previousElementSibling, k = 0; x && k < 6; x = x.previousElementSibling, k++) x.classList.add("cv-vis");
        asentar(obj, el);
      }
    }
    if (esc.modo === "a" && i != null && i !== "m") {
      // llegando desde «Ver en el análisis»: la palabra se muestra en su sitio y se ilumina; un enlace directo abre su ficha
      destelloSig = null;
      if (iraDestello) destellarPalabra(v, +i);
      else abrirPalabraAnalisis(v, i);
    }
    if (esc.modo !== "a" && i === "m") { const b = libroDe(esc.libro); if (b) abrirVerso(b, esc.cap, v, true); }
  }
  // PR #18 · Asienta el verso citado justo en la franja activa de lectura (~39,5 % de pantalla) para que su número quede iluminado con precisión
  function asentar(obj, elVerso) {
    const refEl = elVerso || obj;
    let n = 0, quieto = 0, parar = false;
    const alto = () => { parar = true; };
    window.addEventListener("wheel", alto, { once: true, passive: true });
    window.addEventListener("touchstart", alto, { once: true, passive: true });
    const medirDelta = () => {
      const sup = Math.max(bordeSup() + 18, parseFloat(getComputedStyle(obj).scrollMarginTop) || 110);
      const enAnalisis = esc.modo === "a";
      if (obj !== refEl || enAnalisis) {
        const meta = Math.max(sup, Math.round(window.innerHeight * 0.26));
        return obj.getBoundingClientRect().top - meta;
      }
      const rn = cifrasNum(refEl) || refEl.getBoundingClientRect();
      const meta = Math.max(sup, Math.round(window.innerHeight * 0.395));
      return rn.top - meta;
    };
    const aplicarPaso = () => {
      if (!obj.isConnected) return false;
      const d = medirDelta();
      const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      const dest = Math.max(0, Math.min(max, Math.round(window.scrollY + d)));
      const mov = Math.abs(dest - window.scrollY);
      if (mov > 1) { RP.fin = performance.now(); saltarA(dest); return true; }
      return false;
    };
    aplicarPaso();
    const paso = () => {
      if (parar || !obj.isConnected || ++n > 40 || quieto > 4) { window.removeEventListener("wheel", alto); window.removeEventListener("touchstart", alto); return; }
      if (aplicarPaso()) quieto = 0; else quieto++;
      requestAnimationFrame(paso);
    };
    requestAnimationFrame(paso);
  }
  // altura completa de la barra del capítulo (con su franja): el margen al saltar a un verso la suma a la barra superior
  function altoBarraHoja() {
    const bh = $(".barra-hoja");
    if (bh) document.documentElement.style.setProperty("--alto-hoja", Math.ceil(bh.getBoundingClientRect().height) + "px");
  }
  // La palabra buscada se centra en la pantalla y se ilumina un momento con pequeñas estrellas doradas
  let destelloSig = null;
  // Halo de estrellitas sobre una palabra. Si la palabra se parte en dos o más renglones, cada renglón lleva su propio grupo
  // de estrellitas (antes se dibujaba un marco angosto y alto entre los dos renglones: el bloque que contiene a un elemento en
  // línea partido no está definido). Arreglo del 13-nov-2026, en todo lugar que use el destello.
  function destello(el) {
    const grupo = (n) => h("span", { class: "chispas", "aria-hidden": "true" }, Array.from({ length: n }, (_, k) => h("i", { style: "--k:" + k })));
    for (const x of el.querySelectorAll(":scope > .chispas")) x.remove();
    const rs = [...el.getClientRects()].filter((r) => r.width > 2 && r.height > 2), capas = [];
    el.classList.remove("destello"); void el.offsetWidth; el.classList.add("destello");
    if (rs.length <= 1) { const ch = grupo(7); el.append(ch); capas.push(ch); }
    else {
      const cb = el.offsetParent || document.body, libre = cb === document.body && getComputedStyle(cb).position === "static";
      const rc = libre ? { left: -scrollX, top: -scrollY } : cb.getBoundingClientRect(), sx = libre ? 0 : cb.scrollLeft - cb.clientLeft, sy = libre ? 0 : cb.scrollTop - cb.clientTop;
      rs.forEach((r, k) => {
        const ch = grupo(k ? 4 : 6); ch.classList.add("suelta");
        Object.assign(ch.style, { left: Math.round(r.left - rc.left + sx - 10) + "px", top: Math.round(r.top - rc.top + sy - 10) + "px", width: Math.round(r.width + 20) + "px", height: Math.round(r.height + 20) + "px" });
        cb.append(ch); capas.push(ch);
      });
    }
    setTimeout(() => { el.classList.remove("destello"); for (const c of capas) c.remove(); }, 2600);
  }
  // centra un elemento dentro de su contenedor desplazable (la ventana) o de la página, sin animación
  // AC22 (BiEx, 15-nov-2026, regla ineludible de simetría): lo que se enfoca al saltar queda centrado en el área VISIBLE de su
  // caja (entre la cabecera y el pie de la ventana, o entre las barras fijas de la página); si es más alto que esa área, su
  // comienzo queda arriba con un margen. Se vuelve a centrar cuando termina de abrirse o de dibujarse, salvo que la persona
  // ya se haya movido.
  function centrarEnSuCaja(el) {
    let s = el.parentElement;
    while (s && s !== document.body && !(s.scrollHeight > s.clientHeight + 1 && /(auto|scroll)/.test(getComputedStyle(s).overflowY))) s = s.parentElement;
    const enVentana = !!(s && s !== document.body && s !== document.documentElement);
    const area = () => {
      if (enVentana) { const rs = s.getBoundingClientRect(); return [rs.top, rs.bottom]; }
      let sup = 0, inf = window.innerHeight;
      for (const b of document.querySelectorAll(".barra, .barra-hoja.bh-pegada")) { const r = b.getBoundingClientRect(); if (r.height && r.top <= 2 && r.bottom > sup && r.bottom < inf / 2) sup = r.bottom; }
      for (const b of document.querySelectorAll(".jg-muelle")) { const r = b.getBoundingClientRect(); if (r.height && r.bottom >= inf - 2 && r.top > inf / 2 && r.top < inf) inf = Math.min(inf, r.top); }
      return [sup, inf];
    };
    const ajustar = () => {
      if (!el.isConnected) return;
      const [sup, inf] = area(), r = el.getBoundingClientRect(), alto = inf - sup;
      const d = r.height <= alto - 24 ? (r.top + r.height / 2) - (sup + alto / 2) : r.top - (sup + 14);
      if (Math.abs(d) < 1) return;
      if (enVentana) s.scrollTop += d; else window.scrollBy({ top: d, behavior: "instant" });
    };
    let movio = false; const marca = () => { movio = true; };
    const blanco = enVentana ? s : window;
    for (const ev of ["wheel", "touchstart", "keydown"]) blanco.addEventListener(ev, marca, { passive: true, once: true });
    ajustar();
    for (const ms of [140, 420]) setTimeout(() => { if (!movio) ajustar(); }, ms);
  }
  function destellarPalabra(v, i) {
    const el = $("#vista .pal[data-v='" + v + "'][data-i='" + i + "']");
    if (!el) return;
    const vEl = document.getElementById("v" + v); if (vEl) vEl.classList.add("cv-vis");
    // ir a estudiar una palabra manda sobre la posición recordada: queda en el centro y se sostiene ahí mientras las fichas
    // de arriba terminan de medirse (si no, en los versos largos quedaba fuera de la pantalla)
    if (RP.objetivo != null) terminarRestauracion();
    for (let x = vEl && vEl.previousElementSibling, k = 0; x && k < 6; x = x.previousElementSibling, k++) x.classList.add("cv-vis");
    requestAnimationFrame(() => {
      el.scrollIntoView({ block: "center", behavior: "instant" });
      const t0 = performance.now(); let quieto = 0;
      const sostener = () => { if (!el.isConnected || performance.now() - t0 > 1200 || quieto > 8) return; const r = el.getBoundingClientRect(), d = (r.top + r.height / 2) - innerHeight / 2; if (Math.abs(d) > 3) { saltarA(window.scrollY + d); quieto = 0; } else quieto++; requestAnimationFrame(sostener); };
      const corta = () => { quieto = 99; }; for (const ev of ["wheel", "touchstart", "keydown"]) window.addEventListener(ev, corta, { once: true, passive: true });
      requestAnimationFrame(sostener);
      for (const x of $$("#vista .pal.destello")) x.classList.remove("destello");
      destello(el);
      ponerHash("#/" + esc.libro + "/" + esc.cap + "/a/" + v);
    });
  }

  // ------------------------------------------------------------------ libro de páginas (X11/Z8 y AA22, BiEx, 14-nov-2026)
  // Una lista larga se lee por páginas dentro de un marco fijo: la hoja gira sobre su lomo, en profundidad y dentro de su
  // marco (la pantalla no se mueve ni desborda), y al pie van los números para ir a cualquier página. Solo transformaciones
  // y opacidad (compositor); con «Sin animaciones» o prefers-reduced-motion, un fundido breve.
  // items: la lista; porPag: cuántos por página; pintar(item, índice) → nodo; op: { pagina(nodos) → contenedor, clase,
  // etiqueta, pag (inicial), alCambiar(p) }
  function libroPaginas(items, porPag, pintar, op = {}) {
    const n = Math.max(1, Math.ceil(items.length / porPag));
    let p = Math.min(n - 1, Math.max(0, op.pag | 0)), girando = false, alto = 0;
    const armar = (k) => { const nodos = items.slice(k * porPag, (k + 1) * porPag).map((x, i) => pintar(x, k * porPag + i)); return op.pagina ? op.pagina(nodos, k) : h("ol", { class: "lp-lista" }, nodos); };
    const hoja = h("div", { class: "lp-hoja" }, armar(p));
    const marco = h("div", { class: "lp-marco" + (op.clase ? " " + op.clase : "") + (n > 1 ? " con-lomo" : "") }, hoja);
    const pie = h("nav", { class: "lp-pie", "aria-label": op.etiqueta || "Páginas" });
    const caja = h("div", { class: "lp" }, marco, n > 1 ? pie : null);
    const sinMov = () => document.documentElement.getAttribute("data-mov") === "no" || !hoja.animate || (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
    function fijarAlto() { const a = hoja.offsetHeight; if (a > alto) { alto = a; marco.style.minHeight = a + "px"; } }
    function ir(k) {
      if (k === p || k < 0 || k >= n || girando) return;
      const dir = k > p ? 1 : -1, nueva = armar(k), vieja = hoja.firstElementChild;
      fijarAlto(); p = k; pintarPie(); if (op.alCambiar) op.alCambiar(p);
      if (sinMov() || !vieja) { hoja.replaceChildren(nueva); if (hoja.animate && !sinMov()) hoja.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 180 }); requestAnimationFrame(fijarAlto); return; }
      girando = true;
      // AC14 (BiEx, 15-nov-2026): como una hoja de verdad. Adelante: la hoja de encima se levanta hacia quien lee desde su borde
      // libre, gira sobre el lomo (izquierda) y se va, dejando ver la siguiente; atrás: la anterior vuelve desde el lado del
      // lomo, baja hacia quien lee y se asienta encima. Antes giraba hacia el fondo (se veía como si la hoja se hundiera).
      const capa = h("div", { class: "lp-hoja lp-giro", "aria-hidden": "true" }, dir > 0 ? vieja : nueva, h("i", { class: "lp-sombra" }));
      hoja.replaceChildren(dir > 0 ? nueva : vieja); marco.append(capa);
      const kf = [{ transform: "rotateY(0deg)" }, { transform: "rotateY(-98deg)" }], sh = [{ opacity: 0 }, { opacity: 0.6 }];
      const t = { duration: 620, easing: "cubic-bezier(.33,.72,.24,1)", fill: "both" };
      const a = capa.animate(dir > 0 ? kf : kf.slice().reverse(), t);
      capa.lastChild.animate(dir > 0 ? sh : sh.slice().reverse(), t);
      const fin = () => { if (dir < 0) hoja.replaceChildren(nueva); capa.remove(); girando = false; requestAnimationFrame(fijarAlto); };
      a.finished.then(fin, fin);
    }
    function pintarPie() {
      if (n < 2) return;
      const ver = new Set([0, n - 1, p - 1, p, p + 1]); if (p <= 2) [1, 2, 3].forEach((x) => ver.add(x)); if (p >= n - 3) [n - 4, n - 3, n - 2].forEach((x) => ver.add(x));
      const nums = []; let ult = -1;
      for (let k = 0; k < n; k++) { if (!ver.has(k)) continue; if (k - ult > 1) nums.push(h("span", { class: "lp-et", "aria-hidden": "true", text: "…" }));
        nums.push(h("button", { type: "button", class: "lp-n", "aria-current": k === p ? "page" : null, "aria-label": "Página " + (k + 1) + " de " + n, onclick: () => ir(k), text: String(k + 1) })); ult = k; }
      pie.replaceChildren(h("button", { type: "button", class: "lp-fl", "aria-label": "Página anterior", disabled: p === 0 ? "" : null, onclick: () => ir(p - 1) }, svg(ICO.izq)), ...nums,
        h("button", { type: "button", class: "lp-fl", "aria-label": "Página siguiente", disabled: p === n - 1 ? "" : null, onclick: () => ir(p + 1) }, svg(ICO.der)));
    }
    pintarPie();
    requestAnimationFrame(fijarAlto);
    caja.ir = ir; caja.pagina = () => p; caja.paginas = n;
    return caja;
  }
  // las apariciones de UNA forma de un lema (X11): se buscan libro por libro, empezando por donde más aparece el lema
  async function aparicionesForma(li, fi, cada) {
    const lb = T.LB[li] || [], libros = []; for (let k = 0; k < lb.length; k += 2) libros.push([lb[k], lb[k + 1]]);
    libros.sort((a, x) => x[1] - a[1]);
    for (const [bi] of libros) {
      const b = D.libros[bi]; let A; try { A = await analisis(b.c); } catch (e) { continue; }
      const hall = [];
      for (const [cap, vs] of Object.entries(A.caps)) for (const [v, toks] of vs) toks.forEach((t, i) => { if (t[0] === fi && t[1] === li) hall.push([+cap, v, i]); });
      if (hall.length && cada(b, hall) === false) return;
    }
  }
  // Selector rápido de capítulo y verso dentro del mismo libro, compartido entre la cabecera del análisis de verso y de palabra
  function selectorCapVerso(b, cap, v, alElegir) {
    let capSel = cap, soloSinLeer = false;
    const panIr = h("div", { class: "fp-ir-pan", hidden: true });
    const pintarPanIr = () => {
      const C = b.caps[capSel - 1] || {};
      let hayCapL = false, hayVL = false;
      const capsEl = h("div", { class: "caps" + (soloSinLeer ? " solo-sin-leer" : ""), role: "group", "aria-label": "Capítulos de " + nombreLibro(b) }, b.caps.map((Cx) => {
        const pr = progresoCapLocal(b, Cx.c), clL = pr.completo ? " lei-c" : pr.parcial ? " lei-p" : "";
        if (pr.hechos > 0) hayCapL = true;
        return h("button", { type: "button", class: "cap" + clL, "aria-current": Cx.c === capSel ? "true" : "false", title: "Capítulo " + Cx.c + (pr.hechos ? " · " + pr.hechos + "/" + pr.tot + " leídos" : ""),
          onclick: () => { capSel = Cx.c; pintarPanIr(); } }, String(Cx.c));
      }));
      const vsEl = h("div", { class: "teselas" + (soloSinLeer ? " solo-sin-leer" : ""), role: "group", "aria-label": "Versos del capítulo " + capSel }, Array.from({ length: C.total || 0 }, (_, idx) => {
        const vn = idx + 1, nv = lecturaVersoNivel(b.c, capSel, vn);
        if (nv >= 1) hayVL = true;
        const clL = nv >= 2 ? " lei-r" : nv === 1 ? " lei-v" : "";
        return h("button", { type: "button", class: "tesela n-x" + clL, "aria-current": capSel === cap && vn === v ? "true" : null, title: capSel + ":" + vn + (nv >= 2 ? " · Repasado" : nv === 1 ? " · Leído" : ""),
          onclick: () => { panIr.hidden = true; btnRef.setAttribute("aria-expanded", "false"); alElegir(capSel, vn); } }, String(vn));
      }));
      const bSin = (hayCapL || hayVL) ? h("button", { type: "button", class: "nav-sin-leer", "aria-pressed": String(soloSinLeer), title: "Destacar lo que falta por leer",
        onclick: () => { soloSinLeer = !soloSinLeer; pintarPanIr(); } }, "Sin leer") : null;
      panIr.replaceChildren(
        b.caps.length > 1 ? h("div", {}, h("div", { class: "nav-rot-cab" }, h("p", { class: "rotulo", text: "Capítulos de " + (b.t || b.n) }), bSin), capsEl) : null,
        h("div", {}, h("div", { class: "nav-rot-cab" }, h("p", { class: "rotulo", text: "Versos del capítulo " + capSel }), b.caps.length <= 1 ? bSin : null), vsEl));
    };
    const btnRef = h("button", { type: "button", class: "m-tit-btn", "aria-expanded": "false", "aria-label": refCorta(b, cap, v) + ". Elegir capítulo y verso en " + nombreLibro(b), title: "Elegir otro capítulo y verso en este libro",
      onclick: () => { const abrir = panIr.hidden; panIr.hidden = !abrir; btnRef.setAttribute("aria-expanded", String(abrir)); if (abrir) { capSel = cap; pintarPanIr(); const mc = $(".m-cuerpo", modal); if (mc) mc.scrollTop = 0; } } },
      h("b", { text: refCorta(b, cap, v) }), h("span", { class: "m-tit-car", "aria-hidden": "true", text: "▾" }));
    return { btnRef, panIr };
  }
  // ------------------------------------------------------------------ ficha de la palabra (ventana)
  function vistaPalabra(ctx) {
    return () => {
      const { b, cap, v, toks } = ctx;
      const t = toks[ctx.i], m = T.P[t[2]], cl = T.MC[t[2]], li = t[1], tr = T.TR[t[3] || 0];
      const n = toks.length;
      const mover = (j) => { if (j < 0 || j >= n || j === ctx.i) return; ctx.i = j; if (ctx.alMover) ctx.alMover(j); reemplazar(vistaPalabra(ctx)); };
      const nav = { prev: ctx.i > 0 ? () => mover(ctx.i - 1) : null, next: ctx.i < n - 1 ? () => mover(ctx.i + 1) : null, etiqueta: ["Palabra anterior", "Palabra siguiente"] };
      M.nav = nav;
      const irAVerso = async (c2, v2) => {
        let A, Lc; try { [A, Lc] = await Promise.all([analisis(b.c), lectura(b.c)]); } catch (e) { avisar("No se pudo abrir ese verso"); return; }
        const vs = A.caps[c2] || [];
        const enc = vs.find(([vv]) => vv === v2) || vs[0];
        if (!enc) { avisar("No se halló ese verso en este capítulo"); return; }
        const [vReal, toks2] = enc;
        Object.assign(ctx, { cap: c2, v: vReal, toks: toks2, i: 0, alMover: null, L: (Lc.caps[c2] || []).find((y) => y.v === vReal) || null });
        historial(b.c, c2, vReal, "a");
        reemplazar(vistaPalabra(ctx));
      };
      const moverV = async (dir) => {
        let A, Lc; try { [A, Lc] = await Promise.all([analisis(b.c), lectura(b.c)]); } catch (e) { return; }
        let c2 = cap, vs = A.caps[c2] || [], j = vs.findIndex(([vv]) => vv === v) + dir;
        if (j < 0 || j >= vs.length) { c2 = cap + dir; if (!A.caps[c2] || !A.caps[c2].length) { avisar(dir > 0 ? "Fin del libro" : "Comienzo del libro"); return; } vs = A.caps[c2]; j = dir > 0 ? 0 : vs.length - 1; }
        const [v2, toks2] = vs[j];
        Object.assign(ctx, { cap: c2, v: v2, toks: toks2, i: 0, alMover: null, L: (Lc.caps[c2] || []).find((y) => y.v === v2) || null });
        historial(b.c, c2, v2, "a");
        reemplazar(vistaPalabra(ctx));
      };
      M.navV = { prev: () => moverV(-1), next: () => moverV(1) };
      const { btnRef, panIr } = selectorCapVerso(b, cap, v, irAVerso);
      const vz = T.voz[t[8] || 0];
      const ao = m.tense === "A" ? tipoAor(t[7]) : "";
      const tiempo = (TIEMPO[m.tense] || "") + (ao ? " " + ao : m.second ? " (segundo)" : "");
      const chips = [[CLASE[cl], true]];
      if (m.pos === "V") chips.push([tiempo], [vz], [MODO[m.mood]]);
      if (m.person) chips.push([m.person + ".ª persona"]);
      chips.push([CASO[m.case]], [NUM[m.number]], [GEN[m.gender]]);
      const filas = [];
      const fila = (a, x) => x && filas.push(h("dt", { text: a }), h("dd", { text: x }));
      fila("Categoría", mayus1(CLASE[cl] || ""));
      if (m.pos === "V") { fila("Tiempo", mayus1(tiempo)); fila("Voz", mayus1(vz)); fila("Modo", mayus1(MODO[m.mood])); }
      if (m.person) fila("Persona", m.person + ".ª");
      fila("Caso", mayus1(CASO[m.case])); fila("Número", mayus1(NUM[m.number])); fila("Género", mayus1(GEN[m.gender]));
      fila("En la oración", mayus1(T.R[t[5] || 0]));
      fila("Código", m.code);
      const falta = t[6] || 0;
      const sin = T.ediciones.filter((_, k) => falta & (1 << k));
      const par = T.LP[li] || [];
      // X11/Z8 (BiEx, 13 y 14-nov-2026): todas las formas del lema, con su transliteración, por páginas que giran sobre su lomo;
      // al tocar una forma se ven los lugares donde aparece (sin salir de la ficha)
      const lugares = h("div", { class: "fl-lugares", hidden: true, "aria-live": "polite" });
      let formaAbierta = -1;
      const abrirForma = (r) => {
        const fi = r[0];
        if (formaAbierta === fi + "|" + r[1]) { formaAbierta = -1; lugares.hidden = true; for (const x of $$(".fl-it.abierta")) x.classList.remove("abierta"); return; }
        formaAbierta = fi + "|" + r[1]; for (const x of $$(".fl-it")) x.classList.toggle("abierta", x.dataset.k === formaAbierta);
        const lista = h("div", { class: "fl-refs" }), estado = h("p", { class: "nota-ui", text: "Reuniendo los lugares…" });
        lugares.hidden = false; lugares.replaceChildren(h("h5", {}, "Dónde aparece ", spanGk(T.F[fi]), h("small", { text: " · " + fmt(r[2]) + (r[2] === 1 ? " vez" : " veces") })), lista, estado);
        // un lugar por verso (×2 si se repite en él); como mucho 60 a la vista y el resto en la concordancia del lema
        let total = 0, cortado = false; const clave = formaAbierta, TOPE = 60;
        aparicionesForma(li, fi, (bb, hall) => {
          if (formaAbierta !== clave) return false;
          const porV = new Map(); for (const [c2, v2, i2] of hall) { const k2 = c2 + ":" + v2; if (porV.has(k2)) porV.get(k2).n++; else porV.set(k2, { c2, v2, i2, n: 1 }); }
          const vs2 = [...porV.values()].slice(0, Math.max(0, TOPE - total)); total += vs2.length;
          if (vs2.length) lista.append(h("div", { class: "fl-lib" }, h("b", { text: bb.t || bb.n, title: nombreLibro(bb) }), ...vs2.map(({ c2, v2, i2, n: nn }) => h("a", { class: "fl-ref", href: "#/" + bb.c + "/" + c2 + "/a/" + v2 + "/" + i2, onclick: () => { destelloSig = { c: bb.c, cap: c2, v: v2, i: i2 }; } }, c2 + ":" + v2, nn > 1 ? h("small", { text: "×" + nn }) : null))));
          if (total >= TOPE) { cortado = true; return false; }
        }).then(() => {
          if (formaAbierta !== clave) return;
          if (!total) { estado.textContent = "No se hallaron sus lugares."; return; }
          estado.replaceWith(cortado ? h("a", { class: "btn chico fl-todas", href: "#/lema/" + li }, svg(ICO.lista), "Todas las apariciones en la concordancia del lema") : "");
        });
        requestAnimationFrame(() => lugares.scrollIntoView({ block: "nearest", behavior: document.documentElement.getAttribute("data-mov") === "no" ? "auto" : "smooth" }));
      };
      const formaEl = (r) => h("li", { class: "fl-it fl-it-fila" + (r[0] === t[0] && r[1] === t[2] ? " esta" : ""), "data-k": r[0] + "|" + r[1] },
        h("button", { type: "button", class: "fl-b", onclick: () => abrirForma(r), "aria-label": "Lugares de " + T.F[r[0]] },
          h("span", { class: "fl-g" }, spanGk(T.F[r[0]]), h("small", { class: "fl-tl", text: T.FT[r[0]] || "" })),
          h("span", { class: "fl-n", text: fmt(r[2]) }),
          h("span", { class: "fl-m", text: (abreviar(T.P[r[1]], T.MC[r[1]], 0, r[4]) || T.MD[r[1]] || "") + (r[3] ? " · " + T.TR[r[3]] : "") })),
        botonAudioMini(T.F[r[0]]));
      const pagIni = Math.max(0, Math.floor(par.findIndex((r) => r[0] === t[0] && r[1] === t[2]) / 6));
      const cajonF = par.length > 1 ? cajonAudioFormas(par.map((r) => ({ f: T.F[r[0]], tl: T.FT[r[0]] || "" })), "Escuchar pronunciación de sus formas") : null;
      const tabla = h("div", {}, libroPaginas(par, 6, formaEl, { clase: "fl-libro", etiqueta: "Páginas de las formas", pag: pagIni, pagina: (nodos) => h("ol", { class: "fl-lista" }, nodos) }), cajonF, lugares);
      const lb = T.LB[li] || [];
      const pares = []; for (let k = 0; k < lb.length; k += 2) pares.push([lb[k], lb[k + 1]]);
      pares.sort((a, x) => x[1] - a[1]);
      const max = Math.max(1, ...pares.map((p) => p[1]));
      const contexto = h("div", { class: "contexto", lang: "grc" });
      toks.forEach((x, k) => { if (k) contexto.append(" "); contexto.append(h("button", { type: "button", "aria-current": k === ctx.i ? "true" : "false", onclick: () => mover(k), text: gk(T.F[x[0]]) }), punt(x[4])); });
      const enCap = ctx.desde === "analisis" && esc.libro === b.c && esc.cap === cap && esc.modo === "a";
      const lxFicha = () => bloqueRaiz(li, "ficha", strongTok(b.c, cap, v, ctx.i, li)).filter(Boolean);
      const cajaLx = h("div", { class: "lx-caja" }, LX ? lxFicha() : h("p", { class: "nota-ui", text: "Cargando…" }));
      if (!LX) lexico().then(() => cajaLx.replaceChildren(...lxFicha())).catch(() => cajaLx.replaceChildren(h("p", { class: "nota-ui", text: "No se pudo cargar el estudio de la palabra." })));
      const pie = h("div", { class: "m-pie" },
        h("a", { class: "btn chico", href: "#/lema/" + li }, svg(ICO.lista), "Concordancia del lema"),
        enCap ? h("button", { class: "btn chico oro", type: "button", onclick: () => { const k = ctx.i; cerrarModal(); setTimeout(() => destellarPalabra(v, k), 60); } }, svg(ICO.lupa), "Ver en el análisis del capítulo")
          : h("a", { class: "btn chico oro", href: "#/" + b.c + "/" + cap + "/a/" + v + "/" + ctx.i, onclick: () => { destelloSig = { c: b.c, cap, v, i: ctx.i }; } }, svg(ICO.lupa), "Ver en el análisis del capítulo"));
      return cajaModal(cabModal(btnRef, "Palabra " + (ctx.i + 1) + " de " + n + (b.t ? " · " + b.t : ""), nav),
        [panIr, h("div", { class: "fp" },
          h("div", { class: "fp-pal" },
            h("div", { class: "fp-g", lang: "grc", text: T.F[t[0]] }),
            h("div", { class: "fp-tl" }, T.FT[t[0]], h("span", { class: "eyebrow", style: "margin-left:12px;font-style:normal", lang: "grc", text: uncial(T.F[t[0]]) })),
            lineaPron(T.F[t[0]]),
            h("div", { class: "fp-tr" + (tr ? "" : " sin") }, h("small", { text: "Traducción" }), tr || "Aún sin traducción fijada"),
            h("div", { class: "chips" }, chips.filter((c) => c[0]).map(([x, k]) => h("span", { class: "chip" + (k ? " k" : ""), style: k ? "--k:var(--c-" + cl + ")" : null, text: x }))),
            h("div", { class: "bloque" }, h("h4", { text: "En el verso" }), contexto, ctx.L ? (() => {
              // X11 (BiEx, 13-nov-2026): tocar la palabra española también lleva a su análisis, como la griega
              const al = alinearTokens(ctx.L, toks), r = al[ctx.i], fr = txtVerso(ctx.L, r ? [r] : null), sp = h("span", { class: "vtx" }, fr); sp.__mapa = fr.mapa;
              const p = h("p", { class: "contexto-es toca", style: "margin:0", title: "Toca una palabra para ver su análisis" }, sp);
              p.addEventListener("click", (e) => { const k = indiceToque(e, p); if (k == null) return; const j = al.findIndex((q) => q && k >= q[0] && k < q[1]); if (j >= 0 && j !== ctx.i) mover(j); });
              if (r) requestAnimationFrame(() => { const m = p.querySelector(".pal-sel"); if (m) destello(m); });
              return p;
            })() : null),
            h("div", { class: "bloque" }, h("h4", { text: "Análisis morfológico" }), h("dl", { class: "dl" }, filas)),
            h("div", { class: "bloque" }, h("h4", { text: "Ediciones" }), h("p", { class: "nota-ui", text: sin.length ? "No figura en: " + sin.join(", ") + "." : "Presente en las ocho ediciones cotejadas (" + T.ediciones.join(", ") + ")." })),
            h("div", { class: "bloque" }, h("h4", { text: "En los manuscritos antiguos" }), msPalabra(ctx))),
          h("div", { class: "fp-pal" },
            h("div", { class: "bloque" }, h("h4", { text: "Lema" }),
              h("div", { class: "lema-l" }, h("span", { class: "g", lang: "grc", text: T.L[li] }), h("small", { text: T.LT[li] })),
              h("p", { class: "nota-ui", text: fmt(T.LN[li]) + " veces en la Nueva Voluntad; esta forma, " + fmt(T.FN[t[0]]) + "." })),
            h("div", { class: "bloque" }, h("h4", { text: "Raíz y formación" }), cajaLx),
            h("div", { class: "bloque" }, h("h4", { text: "Formas del lema · " + fmt(par.length) + (par.length === 1 ? " forma" : " formas") }), tabla),
            pares.length ? h("div", { class: "bloque" }, h("h4", {}, h("a", { class: "h4-enl", href: "#/lema/" + li, text: "Dónde aparece" }), h("small", { class: "h4-n", text: " · por libro" })), h("div", { class: "barras enl" }, pares.slice(0, 10).map(([bi, k]) => {
              const bb = D.libros[bi];
              // Z8: cada libro lleva a sus apariciones en la concordancia del lema (abiertas y a la vista)
              return h("a", { href: "#/lema/" + li + "/" + bb.c, "aria-label": (bb.t || bb.n) + ": " + fmt(k) + (k === 1 ? " aparición" : " apariciones") }, h("span", { text: bb.t || bb.n, title: nombreLibro(bb) }), h("i", { style: "width:" + (100 * k / max).toFixed(1) + "%" }), h("em", { text: fmt(k) }));
            })), pares.length > 10 ? h("a", { class: "nota-ui h4-mas", href: "#/lema/" + li, text: "Ver los " + pares.length + " libros con sus apariciones" }) : null) : null))],
        pie);
    };
  }
  // ------------------------------------------------------------------ manuscritos antiguos
  // datos/manuscritos/testigos.json (papiros y códices hasta c. 400) y datos/manuscritos/<LIB>/<cap>.json:
  // { "<v>": { w: [[testigo, cobertura %, transcripción MES]], v: [[tipo, posiciones, lectura, testigos]] } }
  // tipos: om (omite), add (añade tras la posición; -1 = al comienzo), sust (otra palabra), orden (cambia de lugar), ausente.
  // Transcripciones: Center for New Testament Restoration (CNTR), CC BY-SA 4.0.
  let TESTIGOS = null;
  function testigos() {
    if (TESTIGOS) return Promise.resolve(TESTIGOS);
    return cargar("datos/manuscritos/testigos.json").then((t) => { t.porId = new Map(t.testigos.map((x, i) => [x.id, Object.assign({ i }, x)])); TESTIGOS = t; return t; });
  }
  // En las transcripciones de CNTR, U+FFFD marca una letra que está pero no se puede identificar: se muestra «◌»
  const DESC = "\u25CC";
  const MS_CAP_SYNC = new Map();
  const msCap = (c, cap) => cargar("datos/manuscritos/" + c + "/" + cap + ".json").then((d) => {
    if (!d.__n) {
      for (const x of Object.values(d)) {
        if (!x || typeof x !== "object") continue;
        for (const w of x.w || []) if (typeof w[2] === "string") w[2] = w[2].replace(/\uFFFD/g, DESC);
        for (const v of x.v || []) if (typeof v[2] === "string") v[2] = v[2].replace(/\uFFFD/g, DESC);
      }
      Object.defineProperty(d, "__n", { value: true });
    }
    MS_CAP_SYNC.set(c + "." + cap, d);
    return d;
  });
  async function msVerso(c, cap, v) { const [Tg, MC] = await Promise.all([testigos(), msCap(c, cap)]); return { Tg, X: MC[String(v)] || null }; }
  const idBase = (id) => String(id).replace(/[*c]$/, "");
  const siglaDe = (Tg, id) => { const t = Tg.porId.get(idBase(id)); const suf = /\*$/.test(id) ? "*" : /c$/.test(id) ? "ᶜ" : ""; return (t ? t.s : idBase(id)) + suf; };
  const ordenarTestigos = (Tg, ids) => [...new Set(ids)].sort((a, b) => ((Tg.porId.get(idBase(a)) || {}).i ?? 999) - ((Tg.porId.get(idBase(b)) || {}).i ?? 999));
  const sigmaFinal = (s) => String(s || "").replace(/σ(?=\s|$)/g, "ς");
  const SINAITICO = { MAT: 33, MRK: 34, LUK: 35, JHN: 36, ROM: 37, "1CO": 38, "2CO": 39, GAL: 40, EPH: 41, PHP: 42, COL: 43, "1TH": 44, "2TH": 45, HEB: 46, "1TI": 47, "2TI": 48, TIT: 49, PHM: 50, ACT: 51, JAS: 52, "1PE": 53, "2PE": 54, "1JN": 55, "2JN": 56, "3JN": 57, JUD: 58, REV: 59 };
  // enlaces a las imágenes de cada manuscrito: [qué se abre, dirección, dónde] (13-nov-2026: compactos, en dos renglones)
  function enlacesImagen(id, c, cap, v) {
    const out = [];
    if (id === "01" && SINAITICO[c]) out.push(["Ver este verso en el manuscrito", "https://codexsinaiticus.org/en/manuscript.aspx?book=" + SINAITICO[c] + "&chapter=" + cap + "&lid=en&side=r&verse=" + v + "&zoomSlider=0", "Codex [Códice] Sinaiticus"]);
    if (id === "03") out.push(["Ver el manuscrito completo", "https://digi.vatlib.it/view/MSS_Vat.gr.1209", "DigiVatLib · Bibliotheca Apostolica [Biblioteca Apostólica] Vaticana (Vat. gr. 1209)"]);
    if (id === "05") out.push(["Ver el manuscrito completo", "https://cudl.lib.cam.ac.uk/view/MS-NN-00002-00041/1", "Cambridge Digital Library [Biblioteca Digital]"]);
    const doc = /^P\d+$/.test(id) ? 10000 + +id.slice(1) : /^0\d+$/.test(id) ? 20000 + +id : null;
    if (doc) out.push(["Imágenes y transcripción", "https://ntvmr.uni-muenster.de/manuscript-workspace?docID=" + doc, "Institut für Neutestamentliche Textforschung [Instituto para la Investigación Textual del Nuevo Testamento], Münster"]);
    return out;
  }
  const palBase = (toks, k) => (toks && toks[k] ? T.F[toks[k][0]] : "");
  const TIPO_MS = { om: "omite", add: "añade", sust: "otra palabra", orden: "otro orden", ausente: "sin el verso" };
  // transliteración de BiEx para la zona del aparato (Y6): la forma exacta del texto base o, para la lectura de un
  // manuscrito (sin acentos y con su ortografía), la de la misma palabra en el texto base; lo que no se halla se omite
  let MAPA_TLN = null;
  const normGk = (x) => String(x || "").normalize("NFD").replace(/[\u0300-\u036f\u1fbd\u1fbf]/g, "").toLowerCase().replace(/ς/g, "σ");
  const tlPal = (w) => {
    if (!T || !T.F || !T.FT) return "";
    if (!MAPA_TLN) { MAPA_TLN = new Map(); T.F.forEach((f, i) => { const k = normGk(f); if (!MAPA_TLN.has(k)) MAPA_TLN.set(k, T.FT[i]); }); }
    return tlDe(w) || MAPA_TLN.get(normGk(w)) || "";
  };
  const tlMs = (x) => { const ts = String(x || "").split(/\s+/).filter(Boolean).map(tlPal); return ts.some(Boolean) ? ts.map((t) => t || "…").join(" ") : ""; };
  const tlSpan = (x) => { const t = tlMs(x); return t ? h("span", { class: "ms-tl", lang: "grc-Latn", text: t }) : null; };
  function frasePlana(v, toks) {
    const [tipo, pos, lect] = v;
    const g = (s) => [h("span", { class: "gk-ms", lang: "grc", text: s }), tlSpan(s)];
    // la traducción de las palabras del texto base de las que se habla, para saber qué parte del verso se trata
    const tr = (ks) => { const ts = ks.map((k) => toks[k] && T.TR[toks[k][3] || 0]).filter(Boolean); return ts.length ? h("span", { class: "ms-trf", text: " (" + ts.join(" ") + ")" }) : null; };
    if (tipo === "ausente") return ["No contiene este verso."];
    if (tipo === "om") return ["Omite ", g(pos.map((k) => palBase(toks, k)).join(" ")), tr(pos), "."];
    if (tipo === "add") return ["Añade ", g(sigmaFinal(lect)), pos[0] >= 0 ? [" después de ", g(palBase(toks, pos[0])), tr([pos[0]])] : " al comienzo", "."];
    if (tipo === "sust") return ["Dice ", g(sigmaFinal(lect)), " en lugar de ", g(palBase(toks, pos[0])), tr([pos[0]]), "."];
    if (tipo === "orden") return ["Pone ", g(palBase(toks, pos[0])), tr([pos[0]]), " en otro lugar del verso."];
    return [tipo];
  }
  // Línea del aparato crítico, con los signos de las ediciones críticas
  // Signos del aparato crítico, dibujados (no dependen de que el dispositivo tenga la letra): ○ una palabra omitida,
  // ⸋ … ⸌ varias palabras omitidas, ⸆ añadido, ⸀ palabra cambiada, ⸉ … ⸊ orden distinto.
  const SIGNOS = {
    om1: ["Omiten esta palabra", '<circle cx="6" cy="6.2" r="3.4"/>'],
    omA: ["Comienzo de las palabras omitidas", '<rect x="2.6" y="2.8" width="6.8" height="6.8" rx=".6"/>'],
    omZ: ["Fin de las palabras omitidas", '<path d="M2.6 2.8H9.2V9.6"/>'],
    add: ["Aquí añaden algo", '<path d="M2 2.8H10M6 2.8V10"/>'],
    sust: ["Esta palabra se lee distinta", '<path d="M3 10V2.8H10"/>'],
    ordA: ["Comienzo del orden distinto", '<path d="M9.4 2.8H4.4L2.6 6.2L4.4 9.6H9.4"/>'],
    ordZ: ["Fin del orden distinto", '<path d="M2.6 2.8H7.6L9.4 6.2L7.6 9.6H2.6"/>'] };
  function signo(k, conTitulo) {
    const [t, d] = SIGNOS[k];
    const sp = h("span", { class: "sgn sgn-" + k, role: "img", "aria-label": t });
    if (conTitulo !== false) sp.title = t;
    sp.innerHTML = '<svg viewBox="0 0 12 12" aria-hidden="true" focusable="false"><g fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' + d + "</g></svg>";
    return sp;
  }
  const leyendaSignos = () => h("p", { class: "nota-ui sgn-ley" }, [["om1", "omiten una palabra"], ["omA", null], ["omZ", "omiten varias"], ["add", "añaden"], ["sust", "cambian una palabra"], ["ordA", null], ["ordZ", "otro orden"]]
    .map(([k, t]) => h("span", {}, signo(k, false), t ? " " + t : " … ")));
  function lineaAparato(v, toks, Tg) {
    const [tipo, pos, lect, ids] = v;
    // (BiEx, 13-nov-2026): cada sigla lleva a su manuscrito en la lista de abajo, que se abre y brilla un momento
    const tes = h("span", { class: "ms-sig" }, ordenarTestigos(Tg, ids).map((id) => [" ", h("button", { type: "button", class: "ms-sig-b", title: "Ver este manuscrito", onclick: (e) => irAlMs(e.currentTarget, id) }, siglaDe(Tg, id))]));
    const p = (k) => palBase(toks, k), pt = (ks) => { const x = ks.map(p).join(" "); return [x, tlSpan(x)]; };
    if (tipo === "ausente") return ["vers. om.", tes];
    if (tipo === "om") return (pos.length > 1 ? [signo("omA"), pt(pos), signo("omZ")] : [signo("om1"), pt([pos[0]])]).concat([" om.", tes]);
    if (tipo === "add") return [signo("add"), pos[0] >= 0 ? [" (tras ", pt([pos[0]]), ")"] : " (al comienzo)", " " + sigmaFinal(lect), tlSpan(lect), tes];
    if (tipo === "sust") return [signo("sust"), pt([pos[0]]), "] " + sigmaFinal(lect), tlSpan(lect), tes];
    if (tipo === "orden") return [signo("ordA"), pt([pos[0]]), signo("ordZ"), " transp.", tes];
    return [tipo, tes];
  }
  function irAlMs(btn, id) {
    const zona = btn.closest(".modal, #vista") || document, sel = '.ms-t[data-ms="' + String(idBase(id)).replace(/["\\]/g, "") + '"]';
    const det = zona.querySelector(sel) || document.querySelector(sel);
    if (!det) { avisar("Ese manuscrito no está en la lista de este verso"); return; }
    if (!det.open) det.open = true;
    requestAnimationFrame(() => { centrarEnSuCaja(det); det.classList.remove("ms-brillo"); void det.offsetWidth; det.classList.add("ms-brillo"); destello(det.querySelector("summary") || det); setTimeout(() => det.classList.remove("ms-brillo"), 2600); });
  }
  // Transcripción diplomática (formato MES del CNTR): mayúsculas, sigma lunar, nomina sacra con raya, letras dañadas con
  // punto debajo, letras perdidas entre corchetes, cambios de línea como en el manuscrito y correcciones de otra mano.
  const LETRA_MS = /[α-ωϲϛϟϗ⳨͵]/;
  function diplomatica(txt, conEspacios) {
    const cont = h("div", { class: "dipl", lang: "grc" });
    if (!txt || txt === "-") { cont.append(h("p", { class: "nota-ui", text: "Este manuscrito no contiene el verso." })); return cont; }
    let linea = h("div", { class: "dlin" }); cont.append(linea);
    const salto = (clase) => { if (!linea.childNodes.length) return; linea = h("div", { class: "dlin" + (clase ? " " + clase : "") }); cont.append(linea); };
    const palabra = (tok, extra) => {
      let ns = false, sup = false, rec = false, piezas = [];
      const caja = () => h("span", { class: "dpal" + (ns ? " ns" : "") + (sup ? " supl" : "") + (extra ? " " + extra : "") });
      let w = caja(); let hayLetras = false;
      const cerrarRec = () => { if (rec) { w.append("]"); rec = false; } };
      for (let i = 0; i < tok.length; i++) {
        const ch = tok[i];
        if (ch === "/" || ch === "\\" || ch === "|") {
          cerrarRec();
          while (/\d/.test(tok[i + 1] || "")) i++;
          if (hayLetras) { linea.append(w); w = caja(); hayLetras = false; }
          salto(ch === "/" ? "" : "col");
          continue;
        }
        if (ch === "⋄") { while (/\d/.test(tok[i + 1] || "")) i++; continue; }
        if (ch === "&" || ch === "*") { cerrarRec(); w.append(h("span", { class: "lag", text: "[…]" })); hayLetras = true; continue; }
        if ((ch === "+" || ch === "-") && i === 0) continue;
        if (ch === "~") { sup = true; w.className += " supl"; continue; }
        if (ch === "=" || ch === "$") { ns = true; w.className += " ns"; continue; }
        if (ch === "_") continue;
        if (ch === "%") { const u = w.lastChild; if (u && u.nodeType === 3) u.nodeValue += "̣"; continue; }
        if (ch === "^") { // letra perdida: va entre corchetes
          const u = w.lastChild; if (!u || u.nodeType !== 3) continue;
          const letra = u.nodeValue.slice(-1); u.nodeValue = u.nodeValue.slice(0, -1); if (!u.nodeValue) u.remove();
          if (!rec) { w.append("["); rec = true; }
          w.append(letra); continue;
        }
        if (ch === "¯") { const u = w.lastChild; if (u && u.nodeType === 3 && u.nodeValue) { const l = u.nodeValue.slice(-1); u.nodeValue = u.nodeValue.slice(0, -1); w.append(h("span", { class: "ov", text: l })); } continue; }
        if (ch === "" || /[-]/.test(ch)) { w.append(h("span", { class: "abr", title: "abreviatura", text: "ΜΟΥ" })); hayLetras = true; continue; }
        if (ch === DESC || ch === "\uFFFD") { w.append(h("span", { class: "ms-desc", title: "letra que no se puede identificar", text: DESC })); hayLetras = true; continue; }
        if (LETRA_MS.test(ch) || /[α-ω]/.test(ch)) {
          if (rec && tok[i + 1] !== "^") cerrarRec();
          const L = ch === "σ" || ch === "ς" || ch === "ϲ" ? "Ϲ" : ch.toUpperCase();
          const u = w.lastChild;
          if (u && u.nodeType === 3 && !rec) u.nodeValue += L; else w.append(L);
          hayLetras = true; continue;
        }
      }
      cerrarRec();
      if (hayLetras) linea.append(w);
      piezas = null;
    };
    const sep = () => { if (conEspacios && linea.childNodes.length) linea.append(" "); };
    const RE = /((?:x\{[^{}]*\}\s+)?\{[^{}]*\}(?:\s+[abc]\{[^{}]*\})*)|(\S+)/g;
    let m;
    while ((m = RE.exec(txt))) {
      if (m[2]) { sep(); palabra(m[2]); continue; }
      const eds = [...m[1].matchAll(/([xabc]?)\{([^{}]*)\}/g)].map((e) => [e[1], e[2]]);
      const orig = eds.filter((e) => e[0] === "x").map((e) => e[1]), base = eds.filter((e) => e[0] === "").map((e) => e[1]), corr = eds.filter((e) => /[abc]/.test(e[0])).map((e) => e[1]);
      const prim = orig.length ? orig[0] : base.length ? base[0] : "";
      const fin = corr.length ? corr[corr.length - 1] : base.length ? base[base.length - 1] : prim;
      for (const t of prim.split(/\s+/).filter(Boolean)) { sep(); palabra(t, "prim"); }
      if (fin !== prim) {
        sep();
        const marca = h("span", { class: "corr", title: "Corrección de otra mano" + (fin ? ": " + fin.replace(/[=~$]/g, "") : " (quitó lo anterior)") }, h("sup", { text: "ᶜ" }));
        linea.append(marca);
        const antes = linea;
        for (const t of fin.split(/\s+/).filter(Boolean)) { if (conEspacios) linea.append(" "); palabra(t, "cw"); }
        if (!fin) antes.append(h("span", { class: "cw", text: "⟦—⟧" }));
      }
    }
    return cont;
  }
  function msVersoSync(c, cap, v) {
    const mc = MS_CAP_SYNC.get(c + "." + cap);
    if (!TESTIGOS || !mc) return null;
    return { Tg: TESTIGOS, X: mc[String(v)] || null };
  }
  // Resumen breve en la ventana del verso
  function resumenManuscritos(ctx, al) {
    const caja = h("div", { class: "ms-res" });
    const pintar = ({ Tg, X }) => {
      if (!X || !X.w.length) { caja.replaceChildren(h("span", { class: "nota-ui", text: "Ningún manuscrito de antes del año 400 d.H.D. conserva este verso; el texto se apoya en manuscritos posteriores." })); return; }
      const pres = X.w.filter((w) => w[1] > 0);
      const fechas = pres.map((w) => Tg.testigos[w[0]]).filter(Boolean);
      const desde = fechas.length ? Math.min(...fechas.map((t) => t.a)) : 0;
      const sigs = fechas.map((t) => t.s).join(" · ");
      const nv = X.v.filter((v) => v[0] !== "ausente").length, aus = X.v.find((v) => v[0] === "ausente");
      caja.replaceChildren(
        h("p", {}, pres.length ? "Se conserva en " + pres.length + (pres.length === 1 ? " manuscrito antiguo" : " manuscritos antiguos") + (desde ? ", desde " + siglo(desde) : "") + ": " : "", h("span", { class: "ms-sig", lang: "grc", text: sigs })),
        h("p", { class: "nota-ui", text: (aus ? "Hay manuscritos que no lo contienen. " : "") + (nv ? nv + (nv === 1 ? " diferencia" : " diferencias") + " con el texto base, sin contar la ortografía." : "Coinciden con el texto base, salvo detalles de ortografía.") }),
        h("button", { class: "btn chico oro", type: "button", onclick: al }, svg(ICO.manuscrito), "Ver los manuscritos"));
    };
    const syncMs = msVersoSync(ctx.b.c, ctx.cap, ctx.v);
    if (syncMs) pintar(syncMs);
    else {
      caja.append(h("span", { class: "cargando-mini", text: "Consultando los manuscritos antiguos…" }));
      msVerso(ctx.b.c, ctx.cap, ctx.v).then((r) => conAnclaEnModal(() => pintar(r))).catch(() => conAnclaEnModal(() => caja.replaceChildren(h("span", { class: "nota-ui", text: "No se pudieron consultar los manuscritos." }))));
    }
    return caja;
  }
  const siglo = (a) => { const s = Math.floor((a - 1) / 100) + 1; return "el siglo " + ["", "I", "II", "III", "IV", "V", "VI", "VII"][s]; };
  // créditos plegados de una ventana (BiEx, 13-nov-2026, 18:26): discretos, se abren al tocarlos
  const credPleg = (...x) => h("details", { class: "cred-pleg" }, h("summary", { text: "Créditos" }), h("p", {}, ...x));
  // siglo de un manuscrito (Y8): el de sus datos o, si estos dan un año («c. 250»), el que corresponde a sus años
  const ROM_S = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"], sigloN = (a) => Math.floor((a - 1) / 100) + 1;
  const sigloMs = (t) => { if (!t) return ""; if (/^s\. /.test(t.f || "") || !t.a || !t.z) return t.f || ""; const a = sigloN(t.a), z = sigloN(t.z); return "s. " + ROM_S[a] + (z !== a ? "–" + ROM_S[z] : ""); };
  // años aproximados de un manuscrito (BiEx, 13-nov-2026: debajo del siglo, para quien no lee los siglos romanos)
  const aniosMs = (t) => (t && t.a && t.z ? "c. " + (t.a === t.z ? t.a : t.a + "–" + t.z) + " " + ERA_D : "");
  function vistaManuscritos(ctx) {
    return () => {
      const { b, cap, v } = ctx;
      const cuerpo = h("div", { class: "ms" }, cargando("Abriendo los manuscritos…"));
      const modo = "unica"; // X4 (BiEx, 13-nov-2026): una sola vista del aparato, erudita y a la vez en español claro
      Promise.all([msVerso(b.c, cap, v), ctx.toks ? Promise.resolve(ctx.toks) : versoTokens(b.c, cap, v)]).then(([{ Tg, X }, toks]) => {
        ctx.toks = toks;
        if (!cuerpo.isConnected && cuerpo.parentNode == null) { /* sigue: se pinta al mostrarse */ }
        pintarMs(cuerpo, ctx, Tg, X, toks, modo);
      }).catch(() => cuerpo.replaceChildren(fallo("No se pudieron cargar los manuscritos.")));
      return cajaModal(cabModal("Manuscritos · " + refCorta(b, cap, v), "Los declarantes griegos más antiguos (hasta c. 400 d.H.D.)"),
        h("div", {}, h("div", { class: "ms-barra" }, elegirTextoMs(ctx)), cuerpo,
          h("p", { class: "creditos-ms", text: "Fechas aproximadas." }),
          credPleg("Transcripciones: ", h("a", { href: "https://greekcntr.org", target: "_blank", rel: "noopener", text: "Center for New Testament Restoration" }), " [Centro para la Restauración del Nuevo Testamento] (Alan Bunning), con licencia CC BY-SA 4.0.")));
    };
  }
  // Elegir qué texto revisar en los manuscritos: libro, capítulo y verso
  function elegirTextoMs(ctx) {
    const { b, cap, v } = ctx;
    const ir = (c, k, w) => { const nb = libroDe(c); if (!nb) return; reemplazar(vistaManuscritos({ b: nb, cap: k, v: w })); if (/\/m$/.test(location.hash)) ponerHash("#/" + c + "/" + k + "/l/" + w + "/m"); };
    const selLib = h("select", { class: "ms-sel ms-sel-lib", "aria-label": "Libro", onchange: () => ir(selLib.value, 1, 1) },
      librosEnOrden().map((x) => h("option", { value: x.c, selected: x.c === b.c ? true : null, text: (x.t || x.n) + (x.t ? " [" + x.n + "]" : "") })));
    const selCap = h("select", { class: "ms-sel", "aria-label": "Capítulo", onchange: () => ir(b.c, +selCap.value, 1) },
      b.caps.map((_, i) => h("option", { value: String(i + 1), selected: i + 1 === cap ? true : null, text: "Capítulo " + (i + 1) })));
    const selV = h("select", { class: "ms-sel", "aria-label": "Verso", onchange: () => ir(b.c, cap, +selV.value) }, h("option", { value: String(v), selected: true, text: "Verso " + v }));
    lectura(b.c).then((Lc) => { const vs = (Lc.caps[cap] || []).map((x) => x.v); if (vs.length) selV.replaceChildren(...vs.map((n) => h("option", { value: String(n), selected: n === v ? true : null, text: "Verso " + n }))); }).catch(() => {});
    return h("div", { class: "ms-elegir", role: "group", "aria-label": "Texto que se revisa" }, svg(ICO.manuscrito), selLib, selCap, selV);
  }
  function pintarMs(cuerpo, ctx, Tg, X, toks, modo) {
    const { b, cap, v } = ctx;
    if (!X || !X.w.length) { cuerpo.replaceChildren(h("p", { class: "vacio", text: "Ningún manuscrito de antes del año 400 conserva este verso. El texto se apoya en manuscritos posteriores." })); return; }
    const experto = true; // X4: la notación del aparato siempre, y debajo la frase en español claro
    const vars = X.v;
    // palabras del texto base con sus diferencias
    const porPos = new Map();
    vars.forEach((x, k) => { if (x[0] === "add") { const p = "a" + x[1][0]; (porPos.get(p) || porPos.set(p, []).get(p)).push(k); } else for (const p of x[1]) (porPos.get(p) || porPos.set(p, []).get(p)).push(k); });
    const tarjetas = [];
    // al tocar: la palabra late en dorado y las diferencias que le corresponden se encienden con un barrido de luz
    const marcar = (ks, el) => {
      for (const t of tarjetas) { const si = ks.includes(+t.dataset.k); t.classList.toggle("sel", si); t.classList.remove("pulso"); if (si) { void t.offsetWidth; t.classList.add("pulso"); } }
      for (const x of $$(".ms-texto .toca", cuerpo)) x.classList.remove("toca", "activa");
      if (el) { void el.offsetWidth; el.classList.add("toca", "activa"); }
      const t = tarjetas.find((x) => ks.includes(+x.dataset.k)); if (t) t.scrollIntoView({ block: "nearest", behavior: "smooth" });
    };
    const texto = h("div", { class: "ms-texto" });
    const adds = (p) => { const ks = porPos.get("a" + p); if (ks) { const b2 = h("button", { type: "button", class: "ms-add", title: "Aquí algún manuscrito añade algo", "aria-label": "Aquí algún manuscrito añade algo", onclick: () => marcar(ks, b2) }, signo("add", false)); texto.append(b2); } };
    adds(-1);
    // cada palabra con su traducción debajo (la del texto base), para ver de qué parte del verso se habla
    toks.forEach((t, k) => {
      const ks = porPos.get(k);
      const tipos = ks ? [...new Set(ks.map((j) => vars[j][0]))] : [];
      const trd = T.TR[t[3] || 0];
      const partes = [h("span", { class: "ms-g", lang: "grc" }, spanGk(T.F[t[0]]), punt(t[4]) ? punt(t[4]) : ""), h("span", { class: "ms-tr" + (trd ? "" : " sin"), text: trd || "·" })];
      const el = ks ? h("button", { type: "button", class: "ms-w ms-u " + tipos.map((x) => "v-" + x).join(" "), "aria-label": T.F[t[0]] + (trd ? " (" + trd + ")" : "") + ": ver sus diferencias", onclick: () => marcar(ks, el) }, partes)
        : h("span", { class: "ms-w ms-u" + (t[6] & 1 ? " fuera-na" : "") }, partes);
      texto.append(el);
      adds(k);
    });
    // testigos en el tiempo
    const pres = X.w.map((w) => ({ t: Tg.testigos[w[0]], cob: w[1], txt: w[2] })).filter((x) => x.t);
    const min = 100, max = 500;
    const eje = h("div", { class: "ms-eje", "aria-hidden": "true" },
      // marcas en los límites de cada siglo y, debajo de cada tramo, el siglo con sus años (Y8)
      [100, 200, 300, 400, 500].map((a) => h("span", { class: "ms-marca", style: "left:" + ((a - min) / (max - min) * 100) + "%" })),
      [[100, "II"], [200, "III"], [300, "IV"], [400, "V"]].map(([a, r]) => h("span", { class: "ms-sg", style: "left:" + ((a + 50 - min) / (max - min) * 100) + "%" }, h("b", { text: "s. " + r }), h("small", { text: (a + 1) + "–" + (a + 100) }))),
      pres.map((x) => h("span", { class: "ms-punto" + (x.cob ? "" : " sin"), style: "left:" + (((x.t.a + x.t.z) / 2 - min) / (max - min) * 100).toFixed(1) + "%", title: x.t.s + " · " + (x.t.n || "") + " · " + sigloMs(x.t) + (aniosMs(x.t) ? " (" + aniosMs(x.t) + ")" : ""), text: x.t.s })));
    // diferencias
    const lista = h("div", { class: "ms-vars" }, vars.length ? vars.map((x, k) => {
      const ids = ordenarTestigos(Tg, x[3]);
      const t = h("div", { class: "ms-var v-" + x[0], "data-k": k },
        h("div", { class: "mv-tipo", text: TIPO_MS[x[0]] || x[0] }),
        h("div", { class: "mv-ap", lang: "grc" }, lineaAparato(x, toks, Tg)), h("p", { class: "mv-fr" }, frasePlana(x, toks)),
        // AA23 (BiEx, 14-nov-2026): cada sigla lleva a su manuscrito de abajo, que se abre y brilla
        h("div", { class: "mv-tes" }, ids.map((id) => { const tg = Tg.porId.get(idBase(id)) || {}; return h("button", { type: "button", class: "chip ms-ir", title: (tg.n || "") + (tg.f ? " · " + sigloMs(tg) : "") + (aniosMs(tg) ? " (" + aniosMs(tg) + ")" : "") + (/\*$/.test(id) ? " · primera mano" : /c$/.test(id) ? " · corrección posterior" : ""), "aria-label": "Ir al manuscrito " + (tg.n || siglaDe(Tg, id)), onclick: (e) => irAlMs(e.currentTarget, id) }, h("b", { text: siglaDe(Tg, id) }), tg.f ? h("small", { text: sigloMs(tg) }) : null); })));
      tarjetas.push(t);
      return t;
    }) : h("p", { class: "nota-ui", text: "Los manuscritos antiguos que conservan este verso coinciden con el texto base, salvo detalles de ortografía (itacismos, ν final, letras dobles)." }));
    // cada testigo
    const sep = !!prefs.msEsp;
    const filas = h("div", { class: "ms-testigos" + (sep ? " sep" : "") }, pres.map((x) => {
      const det = h("details", { class: "ms-t", "data-ms": x.t.id }); det._txt = x.txt;
      const im = enlacesImagen(x.t.id, b.c, cap, v);
      det.append(h("summary", {},
        h("span", { class: "mt-s", lang: "grc", text: x.t.s }),
        h("span", { class: "mt-n" }, h("b", { text: x.t.n || x.t.s }), x.t.f ? h("span", { class: "mt-f" }, h("small", { text: sigloMs(x.t) }), aniosMs(x.t) ? h("small", { class: "mt-a", text: aniosMs(x.t) }) : null) : null, x.t.in ? h("small", { text: x.t.in }) : null),
        h("span", { class: "mt-c", title: x.cob ? "Parte del verso que se lee en este manuscrito" : "No contiene el verso" }, x.cob ? h("i", { style: "width:" + x.cob + "%" }) : null, h("em", { text: x.cob ? x.cob + " %" : "—" }))));
      det.addEventListener("toggle", () => {
        if (!det.open || det.dataset.listo) return;
        det.dataset.listo = "1";
        det.append(h("div", { class: "mt-cuerpo" },
          h("p", { class: "nota-ui", text: x.t.co ? "Contiene: " + conNombres(x.t.co) + "." : "" }),
          diplomatica(x.txt, sep),
          h("p", { class: "nota-ui mt-ley", text: "Transcripción letra por letra, con los cambios de línea del manuscrito. Raya: abreviatura (nombre sagrado o número). Punto debajo: letra dañada. ◌: letra que está pero no se puede identificar. [ ]: letras perdidas. ᶜ: corrección de otra mano." }),
          im.length ? h("div", { class: "mt-img" }, im.map(([t, u, d]) => h("a", { class: "mt-enl", href: u, target: "_blank", rel: "noopener" }, svg(ICO.externo), h("span", {}, h("b", { text: t }), d ? h("small", { text: d }) : null)))) : null));
      });
      return det;
    }));
    // dos maneras de leer cada manuscrito; al cambiar, solo se rehace la transcripción de los que están abiertos (siguen abiertos)
    const ponerSep = (si) => {
      if (!!prefs.msEsp === si) return;
      prefs.msEsp = si; guardarPrefs();
      for (const b2 of sepBtn.children) b2.setAttribute("aria-pressed", String((b2.dataset.k === "sep") === si));
      filas.classList.toggle("sep", si);
      for (const det of filas.children) {
        const viejo = det.querySelector(".dipl"); if (!viejo) continue;
        const nuevo = diplomatica(det._txt, si); nuevo.classList.add("entra"); viejo.replaceWith(nuevo);
      }
    };
    const sepBtn = h("div", { class: "seg seg-ms", role: "group", "aria-label": "Cómo leer cada manuscrito" },
      h("button", { type: "button", "data-k": "cont", "aria-pressed": String(!sep), title: "Como en el manuscrito: letras seguidas, sin espacios entre palabras", onclick: () => ponerSep(false) }, "Escritura continua"),
      h("button", { type: "button", "data-k": "sep", "aria-pressed": String(sep), title: "Con un espacio entre las palabras, más fácil de leer", onclick: () => ponerSep(true) }, "Palabras separadas"));
    const abrirTodos = h("button", { class: "btn chico", type: "button", onclick: () => { const todos = [...filas.children].every((d) => d.open); for (const d of filas.children) d.open = !todos; abrirTodos.textContent = todos ? "Abrir todos" : "Cerrar todos"; } }, "Abrir todos");
    // ediciones impresas
    const sinEd = toks.map((t, k) => [t, k]).filter(([t]) => t[6]);
    const eds = sinEd.length ? h("div", { class: "bloque" }, h("h4", { text: "En las ediciones impresas del griego" }),
      h("ul", { class: "ms-eds" }, sinEd.map(([t]) => h("li", {}, h("span", { lang: "grc", text: T.F[t[0]] }), " — no figura en: " + T.ediciones.filter((_, k) => t[6] & (1 << k)).join(", ") + ".")))) : null;
    const resumen = pres.filter((x) => x.cob > 0);
    cuerpo.replaceChildren(
      // AC22 (BiEx, 15-nov-2026): textos de la introducción y del porcentaje, tal como los pidió
      h("p", { class: "ms-intro" }, "Así se lee este verso en los manuscritos griegos más antiguos que se conservan, frente al texto base (edición crítica): cada diferencia va con su notación de aparato crítico y, debajo, explicada. ",
        resumen.length + (resumen.length === 1 ? " manuscrito lo conserva" : " manuscritos lo conservan") + (vars.length ? "; " + vars.length + (vars.length === 1 ? " diferencia." : " diferencias.") : "; coinciden con el texto base.")),
      h("div", { class: "bloque" }, h("h4", { text: "En el tiempo" }), eje),
      h("div", { class: "bloque" }, h("h4", { text: "El texto base" + (vars.length ? " · toca una palabra marcada" : "") }), texto,
        vars.length ? h("p", { class: "nota-ui ms-ley" }, h("span", { class: "ms-w v-om", text: "omitida" }), " ", h("span", { class: "ms-w v-sust", text: "cambiada" }), " ", h("span", { class: "ms-w v-orden", text: "de otro orden" }), " ", h("span", { class: "ms-add" }, signo("add", false)), " añadido",
          vars.some((x) => String(x[2] || "").includes(DESC)) ? [" ", h("span", { class: "ms-desc", text: DESC }), " letra que no se puede identificar"] : null) : null),
      h("div", { class: "bloque" }, h("h4", { text: "Diferencias · aparato crítico" }), lista, vars.length ? leyendaSignos() : null),
      h("div", { class: "bloque" }, h("h4", {}, "Cada manuscrito"),
        // X4: qué significa el porcentaje de cada manuscrito
        h("p", { class: "nota-ui ms-pct", text: "El porcentaje es la parte de las palabras de este verso que se alcanza a leer en cada manuscrito: 100 % es el verso completo; menos, que el papiro o el pergamino está roto o dañado en ese lugar. Una raya (—) indica que el manuscrito no contiene el verso. No mide su calidad ni su antigüedad." }),
        h("div", { class: "ms-ctl" }, sepBtn, pres.length > 1 ? abrirTodos : null), filas),
      eds || "");
  }

  // Diferencias de los manuscritos antiguos en una palabra concreta
  function msPalabra(ctx) {
    const caja = h("div", { class: "ms-pal" });
    const { b, cap, v, toks } = ctx, i = ctx.i;
    const pintar = (Tg, X) => {
      if (!X || !X.w.length) { caja.replaceChildren(h("p", { class: "nota-ui", text: "Ningún manuscrito de antes del año 400 conserva este verso." })); return; }
      const vs = X.v.filter((x) => x[0] === "ausente" || (x[0] === "add" ? x[1][0] === i || x[1][0] === i - 1 : x[1].includes(i)));
      const verTodo = h("button", { class: "enlace", type: "button", onclick: () => empujar(vistaManuscritos({ b, cap, v, toks })), text: "Ver el verso en los manuscritos" });
      if (!vs.length) { caja.replaceChildren(h("p", { class: "nota-ui" }, "En los manuscritos antiguos que conservan este verso no hay diferencias en esta palabra. ", verTodo, ".")); return; }
      caja.replaceChildren(...vs.map((x) => h("p", { class: "ms-pal-v" }, frasePlana(x, toks), " ", h("span", { class: "ms-sig", lang: "grc", text: ordenarTestigos(Tg, x[3]).map((id) => siglaDe(Tg, id)).join(" ") }))), h("p", { class: "nota-ui" }, verTodo, "."));
    };
    const mcSync = MS_CAP_SYNC.get(b.c + "." + cap);
    if (TESTIGOS && mcSync) { pintar(TESTIGOS, mcSync[String(v)] || null); return caja; }
    caja.append(h("span", { class: "cargando-mini", text: "Consultando…" }));
    msVerso(b.c, cap, v).then(({ Tg, X }) => pintar(Tg, X)).catch(() => caja.replaceChildren(h("p", { class: "nota-ui", text: "No se pudieron consultar los manuscritos." })));
    return caja;
  }
  // Ventana del verso: su texto y todas sus palabras; cada palabra abre su ficha
  // ------------------------------------------------------------------ referencias cruzadas (W14, BiEx, 13-nov-2026)
  // datos/refs/<LIB>.json: OpenBible.info (CC BY), que parte del Treasury of Scripture Knowledge y ordena cada referencia con
  // los votos de su comunidad (tools/refs/refs.py del Taller). Seis enteros por referencia: [li, cap, v1, fin, votos, cat].
  // Niveles por votos (principales, relacionadas, todas) y categorías: citas de la Antigua Voluntad, otros relatos de la vida
  // de YēshŪ́aʿ, Nueva Voluntad y Antigua Voluntad. El texto de un verso de la Nueva Voluntad se trae solo al tocarlo (o al
  // instante si su libro ya está cargado): los libros pesan y el teléfono no tiene por qué bajarlos todos.
  // Y7 (BiEx, 13-nov-2026): para leer las citas de la Antigua Voluntad mientras no tenga texto de BiEx, tres traducciones de
  // otros en BibliaTodo: la Nueva Biblia Española (Schökel y Mateos), la Biblia Latinoamérica y la Septuaginta en español
  // (las tres traducciones de BibliaTodo de Y7 ya no se enlazan: BiEx pidió no salir del sitio; ver cargarAV y textoAV)
  const LIBROS_REF = ["GEN", "EXO", "LEV", "NUM", "DEU", "JOS", "JDG", "RUT", "1SA", "2SA", "1KI", "2KI", "1CH", "2CH", "EZR", "NEH", "EST", "JOB", "PSA", "PRO", "ECC", "SNG", "ISA", "JER", "LAM", "EZK", "DAN", "HOS", "JOL", "AMO", "OBA", "JON", "MIC", "NAM", "HAB", "ZEP", "HAG", "ZEC", "MAL",
    "MAT", "MRK", "LUK", "JHN", "ACT", "ROM", "1CO", "2CO", "GAL", "EPH", "PHP", "COL", "1TH", "2TH", "1TI", "2TI", "TIT", "PHM", "HEB", "JAS", "1PE", "2PE", "1JN", "2JN", "3JN", "JUD", "REV"];
  // Antigua Voluntad: el nombre original de cada libro (hebreo masorético) y el tradicional entre [ ], mientras BiEx fija sus
  // transliteraciones (provisional, 13-nov-2026)
  const AV_NOMBRES = [["בְּרֵאשִׁית", "Génesis"], ["שְׁמוֹת", "Éxodo"], ["וַיִּקְרָא", "Levítico"], ["בְּמִדְבַּר", "Números"], ["דְּבָרִים", "Deuteronomio"], ["יְהוֹשֻׁעַ", "Josué"], ["שֹׁפְטִים", "Jueces"], ["רוּת", "Rut"],
    ["שְׁמוּאֵל א", "1 Samuel"], ["שְׁמוּאֵל ב", "2 Samuel"], ["מְלָכִים א", "1 Reyes"], ["מְלָכִים ב", "2 Reyes"], ["דִּבְרֵי הַיָּמִים א", "1 Crónicas"], ["דִּבְרֵי הַיָּמִים ב", "2 Crónicas"], ["עֶזְרָא", "Esdras"], ["נְחֶמְיָה", "Nehemías"], ["אֶסְתֵּר", "Ester"],
    ["אִיּוֹב", "Job"], ["תְּהִלִּים", "Salmos"], ["מִשְׁלֵי", "Proverbios"], ["קֹהֶלֶת", "Eclesiastés"], ["שִׁיר הַשִּׁירִים", "Cantar de los Cantares"], ["יְשַׁעְיָהוּ", "Isaías"], ["יִרְמְיָהוּ", "Jeremías"], ["אֵיכָה", "Lamentaciones"], ["יְחֶזְקֵאל", "Ezequiel"],
    ["דָּנִיֵּאל", "Daniel"], ["הוֹשֵׁעַ", "Oseas"], ["יוֹאֵל", "Joel"], ["עָמוֹס", "Amós"], ["עֹבַדְיָה", "Abdías"], ["יוֹנָה", "Jonás"], ["מִיכָה", "Miqueas"], ["נַחוּם", "Nahúm"], ["חֲבַקּוּק", "Habacuc"], ["צְפַנְיָה", "Sofonías"], ["חַגַּי", "Hageo"], ["זְכַרְיָה", "Zacarías"], ["מַלְאָכִי", "Malaquías"]];
  const CAT_REF = ["Citas de la Antigua Voluntad", "En la Antigua Voluntad", "En los otros relatos de la vida de YēshŪ́aʿ", "En la Nueva Voluntad"];
  const ORDEN_CAT_REF = [0, 2, 3, 1];
  const NIVELES_REF = [["1", "Principales"], ["2", "Relacionadas"], ["3", "Todas"]];
  const REFS = new Map();
  const refsDe = (c) => { if (!REFS.has(c)) REFS.set(c, cargar("datos/refs/" + c + ".json").catch((e) => { REFS.delete(c); throw e; })); return REFS.get(c); };
  const nivelRef = (votos, rango) => (votos >= 12 || (rango < 3 && votos >= 4) ? 1 : votos >= 4 ? 2 : 3);
  const libroListo = (c) => !!cache["datos/libros/" + c + ".json"];
  const AVC = {};
  const cargarAV = (cod) => AVC[cod] || (AVC[cod] = cargar("datos/av/jnm/" + cod + ".json").catch((e) => { delete AVC[cod]; throw e; }));
  // (BiEx, 22-nov-2026, 15:59) la perícopa del verso que se está leyendo, en la Nueva Voluntad de Jünemann, para comparar: ventana flotante
  // desde el ícono de la franja del libro. Texto íntegro de su edición (corpus paralelo GIL-UNAM, CC0); la única modificación de BiEx es el
  // Nombre que es sobre todo nombre y el título original (tools/av/junemann_nv.py.txt del Taller)
  const JNMC = {};
  const cargarJNM = (cod) => JNMC[cod] || (JNMC[cod] = cargar("datos/nv/jnm/" + cod + ".json").catch((e) => { delete JNMC[cod]; throw e; }));
  // el verso que cruza la línea de lectura (40 % del alto de la ventana) o, si ninguno la cruza, el más cercano a ella
  function versoEnPantalla() {
    const y = innerHeight * 0.4; let mejor = null, d = 1e9;
    for (const el of document.querySelectorAll("#vista [id^='v']")) {
      if (!/^v\d+$/.test(el.id)) continue;
      const r = el.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) continue;
      const dd = r.top <= y && r.bottom >= y ? 0 : Math.min(Math.abs(r.top - y), Math.abs(r.bottom - y));
      if (dd < d) { d = dd; mejor = +el.id.slice(1); }
    }
    return mejor;
  }
  // Verso iluminado en pantalla: toma primero exactamente el verso que lleva el brillo luminoso de Escudriña (LB.v / R.vf);
  // si Escudriña no está activo, aplica la misma franja fija de lectura (38–43 % del alto) sobre el número del verso.
  function versoIluminado() {
    try {
      if (window.BiExJuego && typeof BiExJuego.versoActivo === "function") {
        const jv = BiExJuego.versoActivo(esc.libro, esc.cap);
        if (jv && document.getElementById("v" + jv)) return jv;
      }
    } catch (e) { /* sin juego */ }
    const a = innerHeight * 0.38, b = innerHeight * 0.43;
    let cruza = 0;
    for (const el of document.querySelectorAll("#vista [id^='v']")) {
      if (!/^v\d+$/.test(el.id)) continue;
      const num = el.querySelector(".vn, sup") || el;
      const r = num.getBoundingClientRect();
      if (!r.height) continue;
      if (r.top >= b) break;
      cruza = +el.id.slice(1);
      if (r.bottom > a) return cruza;
    }
    return cruza || versoEnPantalla() || esc.vMarcado || 1;
  }
  function verPericopaJnm(b, cap, versos) {
    const v = versoIluminado() || 1, ini = versos && versos.length ? iniciosPericopa(versos) : new Set();
    let a = v, z = v;
    for (const x of versos || []) { if (x.v <= v && ini.has(x.v)) a = x.v; }
    for (const x of versos || []) { if (x.v > v && ini.has(x.v)) break; if (x.v >= v) z = x.v; }
    const cuerpo = h("div", { class: "flot-cel jnm" }, h("p", { class: "nota-ui", text: "Cargando la traducción de Jünemann…" }));
    const lib = (c) => { const x = libroDe(c); return x ? nombreLibro(x) : c; };
    // AL13 (BiEx, 22-nov-2026, 18:53): la nota dice que el título también cambia en las palabras que se forman con él, y las dos citas
    // van en su propia línea, centradas y enteras (en el teléfono, una debajo de la otra): simétricas
    const pie = h("div", { class: "jnm-pie" },
      h("p", { text: "Traducción íntegra de la edición de Wilhelm [Guillermo] Jünemann Beckschäfer (dominio público), con la única modificación de BiEx de usar el Nombre que es sobre todo nombre y el título originario, también en las palabras que se forman con él:" }),
      h("p", { class: "jnm-citas" }, h("a", { href: "#/ACT/4/l/12", text: lib("ACT") + " 4:12" }), h("span", { class: "jnm-sep", "aria-hidden": "true", text: "·" }), h("a", { href: "#/PHP/2/l/9", text: lib("PHP") + " 2:9-10" })),
      h("small", { text: "Texto digital: corpus paralelo GIL-UNAM (CC0)." }));
    abrirModal(() => cajaModal(cabModal("La perícopa en Jünemann", nombreLibro(b) + " " + cap + ":" + (a === z ? a : a + "–" + z)), cuerpo));
    cargarJNM(b.c).then((d) => {
      const vs = (d.c || {})[cap] || [], lista = [];
      for (let i = a; i <= z; i++) if (vs[i - 1]) lista.push(h("p", { class: "jnm-v" + (i === v ? " act" : "") }, h("sup", { text: String(i) }), " ", vs[i - 1]));
      cuerpo.replaceChildren(lista.length ? h("div", { class: "jnm-tx", lang: "es" }, lista) : h("p", { class: "nota-ui", text: "Esta edición no trae estos versos." }), pie);
    }).catch(() => cuerpo.replaceChildren(h("p", { class: "nota-ui", text: "No se pudo cargar la traducción de Jünemann; inténtalo de nuevo en un momento." }), pie));
  }
  // el pasaje citado (un verso, un tramo o de un capítulo a otro), con el número de cada verso y de dónde viene el texto
  function textoAV(d, r) {
    const [, c1, v1, fin] = r, c2 = fin < 0 ? Math.floor(-fin / 1000) : c1, v2 = fin < 0 ? -fin % 1000 : fin > 0 ? fin : v1, piezas = [];
    for (let c = c1; c <= c2; c++) {
      const vs = (d.c || {})[c] || [], a = c === c1 ? v1 : 1, b = c === c2 ? v2 : vs.length;
      for (let v = a; v <= b && v <= vs.length; v++) if (vs[v - 1]) piezas.push(h("sup", { text: (c !== c1 ? c + ":" : "") + v }), vs[v - 1] + " ");
    }
    return [h("p", { class: "rx-av-t" }, ...(piezas.length ? piezas : ["Este verso no está en esta traducción."])),
      h("p", { class: "nota-ui rx-av-f", text: "Cita de otra traducción: Septuaginta en español de Wilhelm [Guillermo] Jünemann Beckschäfer (1928, dominio público), mientras BiEx traduce la Antigua Voluntad." })];
  }
  function etRef(r) {
    const [li, c1, v1, fin] = r, cola = c1 + ":" + v1 + (fin > 0 ? "-" + fin : fin < 0 ? "–" + Math.floor(-fin / 1000) + ":" + (-fin % 1000) : "");
    if (li < 39) { const [he, es] = AV_NOMBRES[li]; return h("span", { class: "rx-n" }, h("span", { class: "rx-he", lang: "he", text: he }), h("span", { class: "rx-es", text: " [" + es + "] " }), h("b", { text: cola })); }
    const b = D && libroDe(LIBROS_REF[li]);
    return h("span", { class: "rx-n" }, h("span", { class: "rx-lib", text: b ? (b.t || b.n) : LIBROS_REF[li] }), b && b.t ? h("span", { class: "rx-es", text: " [" + b.n + "] " }) : " ", h("b", { text: cola }));
  }
  function bloqueRefs(b, cap, v, sinAutoExpandir) {
    const caja = h("div", { class: "rx" }, h("p", { class: "nota-ui", text: "Buscando referencias…" }));
    const cuenta = h("span", { class: "rx-cuenta" });
    const construir = (R, sinc) => {
      const aplicar = () => {
        const plano = ((R.c || {})[cap] || {})[v] || [];
        const lista = []; for (let i = 0; i + 5 < plano.length; i += 6) lista.push(plano.slice(i, i + 6));
        if (!lista.length) { caja.replaceChildren(h("p", { class: "nota-ui", text: "Este verso todavía no tiene referencias cruzadas." })); return; }
        lista.forEach((r, i) => { r.nv = nivelRef(r[4], i); });
        const n1 = lista.filter((r) => r.nv === 1).length, n2 = lista.filter((r) => r.nv <= 2).length;
        let nivel = String(store.get("refsNivel", "1")); if (nivel === "1" && !n1) nivel = n2 ? "2" : "3"; else if (nivel === "2" && !n2) nivel = "3";
        cuenta.textContent = fmt(lista.length);
        const seg = h("div", { class: "seg-mini rx-seg", role: "group", "aria-label": "Nivel de las referencias" });
        const cuerpo = h("div", { class: "rx-cuerpo" });
        const pintar = () => {
          const tope = +nivel, sel = lista.filter((r) => r.nv <= tope);
          for (const bt of seg.children) bt.setAttribute("aria-pressed", String(bt.dataset.k === nivel));
          // el aviso del ranking va una sola vez, en la primera categoría con pasajes de la Antigua Voluntad (AA16)
          const catAV = ORDEN_CAT_REF.find((c) => sel.some((r) => r[5] === c && r[0] < 39));
          cuerpo.replaceChildren(...ORDEN_CAT_REF.map((cat) => {
            const it = sel.filter((r) => r[5] === cat); if (!it.length) return null;
            const ul = h("ul", { class: "rx-lista" });
            const item = (r) => {
              const fuerza = h("span", { class: "rx-f n" + r.nv, title: r.nv === 1 ? "Referencia principal" : r.nv === 2 ? "Referencia relacionada" : "Referencia ampliada", "aria-hidden": "true" }, h("i"), h("i"), h("i"));
              if (r[0] < 39) {
                // (BiEx, 13-nov-2026) la Antigua Voluntad se lee dentro de BiEx, sin salir del sitio: mientras BiEx la traduce, la
                // Septuaginta en español de Wilhelm [Guillermo] Jünemann (dominio público), marcada como cita de otra traducción
                const panel = h("div", { class: "rx-txt rx-av", hidden: true });
                const bt = h("button", { type: "button", class: "rx-cab", "aria-expanded": "false", onclick: async () => {
                  const ab = panel.hidden; panel.hidden = !ab; bt.setAttribute("aria-expanded", String(ab)); if (!ab || panel.dataset.listo) return;
                  panel.replaceChildren(h("span", { class: "nota-ui", text: "Cargando…" }));
                  try { panel.replaceChildren(...textoAV(await cargarAV(LIBROS_REF[r[0]]), r)); panel.dataset.listo = "1"; }
                  catch (e) { panel.replaceChildren(h("span", { class: "nota-ui", text: "No se pudo cargar el texto. Revisa tu conexión." })); }
                } }, etRef(r), fuerza);
                return h("li", { class: "rx-it av" }, bt, panel);
              }
              const cod = LIBROS_REF[r[0]], prev = h("div", { class: "rx-txt", hidden: true });
              const ir = h("a", { class: "rx-ir", href: refRuta([cod, r[1], r[2]]), "aria-label": "Abrir en el lector" }, svg(ICO.seguir));
              const ver = () => {
                if (prev.dataset.listo) { prev.hidden = !prev.hidden; boton.setAttribute("aria-expanded", String(!prev.hidden)); return; }
                const pintarPrev = (LB) => {
                  const vs = (LB.caps || {})[r[1]] || [], fin = r[3] > 0 ? r[3] : r[2];
                  const tr = vs.filter((x) => x.v >= r[2] && x.v <= fin);
                  prev.dataset.listo = "1";
                  prev.replaceChildren(...(tr.length ? tr.map((x) => h("p", {}, tr.length > 1 ? h("sup", { text: String(x.v) }) : null, txtVersoL(x))) : [h("span", { class: "nota-ui", text: "No se halló ese verso." })]));
                };
                const lbMem = DATOS_MEM["datos/libros/" + cod + ".json"];
                conAnclaEnModal(() => {
                  prev.hidden = false; boton.setAttribute("aria-expanded", "true");
                  if (lbMem) { indexarAnadidos(lbMem); pintarPrev(lbMem); }
                  else prev.replaceChildren(h("span", { class: "nota-ui", text: "Cargando…" }));
                });
                if (lbMem) return;
                lectura(cod).then((LB) => {
                  conAnclaEnModal(() => { pintarPrev(LB); });
                  if (prev.animate && document.documentElement.getAttribute("data-mov") !== "no") prev.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220, easing: "ease-out" });
                }).catch(() => conAnclaEnModal(() => prev.replaceChildren(h("span", { class: "nota-ui", text: "No se pudo cargar el texto." }))));
              };
              const boton = h("button", { type: "button", class: "rx-cab", "aria-expanded": "false", onclick: ver }, etRef(r), fuerza);
              const li = h("li", { class: "rx-it" }, h("div", { class: "rx-fila" }, boton, ir), prev);
              if (!sinAutoExpandir && libroListo(cod) && r.nv === 1) requestAnimationFrame(ver);
              return li;
            };
            const mostrar = (desde, n) => { ul.append(...it.slice(desde, desde + n).map(item)); return desde + n; };
            let k = mostrar(0, 6);
            const mas = it.length > k ? h("button", { class: "btn chico rx-mas", type: "button", onclick: () => { k = mostrar(k, 12); if (k >= it.length) mas.remove(); else mas.lastChild.textContent = "Ver más (" + fmt(it.length - k) + ")"; } }, svg(ICO.abajo), h("span", { text: "Ver más (" + fmt(it.length - k) + ")" })) : null;
            return h("section", { class: "rx-cat c" + cat }, h("h5", {}, h("span", { text: CAT_REF[cat] }), h("em", { text: fmt(it.length) })),
              cat === catAV ? avisoAV() : null, ul, mas);
          }).filter(Boolean));
        };
        seg.append(...NIVELES_REF.map(([k, et]) => { const n = k === "1" ? n1 : k === "2" ? n2 : lista.length; return h("button", { type: "button", "data-k": k, disabled: n ? null : "", onclick: () => { nivel = k; store.set("refsNivel", k); pintar(); } }, et + " · " + fmt(n)); }));
        caja.replaceChildren(seg, cuerpo, credPleg("Referencias cruzadas: ", h("a", { href: "https://www.openbible.info/labs/cross-references/", target: "_blank", rel: "noopener", text: "OpenBible.info" }), " (CC BY), a partir del Treasury of Scripture Knowledge [Tesoro del Conocimiento de la Escritura]; nivel y categorías de BiEx."));
        pintar();
      };
      if (sinc) aplicar(); else if (caja.isConnected) conAnclaEnModal(aplicar);
    };
    const rMem = DATOS_MEM["datos/refs/" + b.c + ".json"];
    if (rMem) construir(rMem, true);
    else refsDe(b.c).then((R) => construir(R, false)).catch(() => conAnclaEnModal(() => caja.replaceChildren(h("p", { class: "nota-ui", text: "No se pudieron cargar las referencias cruzadas." }))));
    return h("div", { class: "bloque rx-bloque" }, h("h4", {}, svg(ICO.refs), h("span", { text: "Referencias cruzadas" }), cuenta), caja);
  }
  function vistaVerso(ctx) {
    const fn = () => {
      const { b, cap, versos } = ctx;
      const k = versos.findIndex((x) => x.v === ctx.v);
      const L = versos[k] || null;
      const mover = (j) => { const x = versos[j]; if (!x) return; ctx.v = x.v; ctx.toks = null; marcarVerso(x.v); ponerHash("#/" + b.c + "/" + cap + "/l/" + x.v); reemplazar(vistaVerso(ctx)); };
      const irAVerso = async (c2, v2) => {
        try {
          const Lc = await lectura(b.c);
          const vs2 = Lc.caps[c2] || [];
          const enc = vs2.find((x) => x.v === v2) || vs2[0];
          if (!enc) { avisar("No se halló ese verso en este capítulo"); return; }
          ctx.cap = c2; ctx.v = enc.v; ctx.versos = vs2; ctx.toks = null; ctx.toque = null;
          if (esc.libro === b.c && esc.cap === c2) marcarVerso(enc.v);
          historial(b.c, c2, enc.v, "l");
          ponerHash("#/" + b.c + "/" + c2 + "/l/" + enc.v);
          reemplazar(vistaVerso(ctx));
        } catch (e) { avisar("No se pudo abrir ese verso"); }
      };
      const nav = { prev: k > 0 ? () => mover(k - 1) : null, next: k >= 0 && k < versos.length - 1 ? () => mover(k + 1) : null, etiqueta: ["Verso anterior", "Verso siguiente"] };
      M.nav = nav;
      const { btnRef, panIr } = selectorCapVerso(b, cap, ctx.v, irAVerso);
      // Si se abrió tocando una palabra o directo a Nota, se marca M.centrada antes de restaurarScrollM() para evitar sobresaltos
      const habiaToque = ctx.toque != null;
      const vaANota = !!ctx.enfocarNota;
      if (habiaToque || vaANota) M.centrada = performance.now();
      if (vaANota) M.anclaNota = performance.now() + 2600;
      const zona = h("div", { class: "palabras" });
      let elToque = null;
      const alinearToque = (toks) => {
        if (ctx.toque == null || !L) return null;
        const rs = alinearTokens(L, toks), q = ctx.toque; ctx.toque = null;
        let idx = rs.findIndex((r) => r && q >= r[0] && q < r[1]);
        if (idx < 0) { let mejor = 1e9; rs.forEach((r, j) => { if (!r) return; const d = q < r[0] ? r[0] - q : q >= r[1] ? q - r[1] + 1 : 0; if (d < mejor) { mejor = d; idx = j; } }); }
        return zona.children[idx] || null;
      };
      const llenar = (toks, sinc) => {
        const poner = () => {
          zona.replaceChildren(...toks.map((t, i) => tarjetaPalabra(t, () => empujar(vistaPalabra({ b, cap, v: ctx.v, toks, i, L, desde: "verso" })))));
        };
        if (sinc) poner(); else conAnclaEnModal(poner);
        const el = alinearToque(toks);
        if (el) {
          el.setAttribute("aria-pressed", "true");
          M.centrada = performance.now();
          if (sinc) elToque = el;
          else requestAnimationFrame(() => { if (el.isConnected) { enfocarEnModal(el); destello(el); } });
        }
      };
      const syncToks = ctx.toks || versoTokensSync(b.c, cap, ctx.v);
      if (syncToks) { ctx.toks = syncToks; llenar(syncToks, true); }
      else {
        zona.append(cargando("Cargando el griego…"));
        const vEsperado = ctx.v;
        versoTokens(b.c, cap, ctx.v).then((toks) => { if (ctx.v !== vEsperado) return; ctx.toks = toks; if (zona.isConnected) llenar(toks, false); })
          .catch(() => conAnclaEnModal(() => zona.replaceChildren(fallo("No se pudo cargar el griego del verso."))));
      }
      fn.alMostrar = elToque
        ? () => { if (elToque && elToque.isConnected) { enfocarEnModal(elToque); destello(elToque); } }
        : vaANota ? () => { ctx.enfocarNota = false; irANotaEnModal(); } : null;
      return cajaModal(cabModal(btnRef, b.t ? b.t + " " + cap + ":" + ctx.v : "", nav),
        [panIr, h("div", { class: "fv" },
          avisoAnadido(b, cap, ctx.v, anadido(b.c, cap, ctx.v), true),
          L ? h("div", { class: "chip-estado n-" + L.n }, h("i"), estadoEt(L.n) + (L.n === "base" ? " · " + L.k + " % de las palabras ya traducidas" : "")) : null,
          L ? h("p", { class: "fv-es" + (anadido(b.c, cap, ctx.v) ? " an-ventana" : "") }, txtVerso(L)) : null,
          L ? (() => {
            const mk = MK.get(b.c, cap, ctx.v) || {};
            const etAct = h("b", { text: mk.col ? MK.nombre(mk.col) : "Sin marca" });
            const ponerEt = (col) => { etAct.textContent = col ? MK.nombre(col) : "Sin marca"; etAct.className = col ? "mk-" + col : ""; };
            ponerEt(mk.col);
            const dots = MK.temas().map(([k, nom]) => h("button", { type: "button", class: "vq-dot mk-" + k + (mk.col === k ? " sel" : ""), title: nom, "aria-label": "Marcar: " + nom, "aria-pressed": String(mk.col === k),
              onclick: (ev) => {
                const ya = (MK.get(b.c, cap, ctx.v) || {}).col === k;
                MK.poner(b.c, cap, ctx.v, { col: ya ? null : k });
                ponerEt(ya ? null : k);
                for (const d of ev.currentTarget.parentNode.querySelectorAll(".vq-dot")) { const on = !ya && d === ev.currentTarget; d.classList.toggle("sel", on); d.setAttribute("aria-pressed", String(on)); }
                for (const bt of $$(".modal[open] .mk-tema")) bt.setAttribute("aria-checked", String(!ya && bt.dataset.k === k));
                avisar(ya ? "Marca quitada" : "Marcado: " + nom);
              } }));
            const cop = h("button", { type: "button", class: "fv-rap-b pri", onclick: async () => {
              const txt = textoPlano((txtVerso(L).textContent || "").replace(/\s+/g, " ").trim());
              const hh0 = "#/" + b.c + "/" + cap + "/l/" + ctx.v;
              let hh = hh0;
              const inv = (store.get("jg:t", null) && store.get("jg:mio", null)) || (await semilla());
              if (inv && /^[a-z0-9]{4,12}$/.test(inv)) hh = "#/escudrina/i/" + inv + "/" + hh0.slice(2);
              const salida = "«" + txt + "»\n— " + nombreLibro(b) + " " + cap + ":" + ctx.v + " · Biblia Exacta\n" + enlacePublico(hh);
              try { await navigator.clipboard.writeText(salida); avisar("Verso copiado con cita y enlace"); try { if (window.BiExJuego && BiExJuego.compartido) BiExJuego.compartido(hh0); } catch (e) { /* sin juego */ } }
              catch (e) { compartir(nombreLibro(b) + " " + cap + ":" + ctx.v, txt, hh0); }
            } }, svg(ICO.copiar), h("span", { text: "Copiar con enlace" }));
            const nota = h("button", { type: "button", class: "fv-rap-b", onclick: irANotaEnModal }, svg(ICO.nota), h("span", { text: "Nota de estudio" }));
            const tarj = h("button", { type: "button", class: "fv-rap-b", onclick: () => empujar(vistaTarjetaVerso({ b, cap, v: ctx.v, L, toks: ctx.toks })) }, svg(ICO.tarjeta), h("span", { text: "Tarjeta HD" }));
            const sino = h("button", { type: "button", class: "fv-rap-b", onclick: () => irDesdeModal("#/sinopsis/" + b.c + "." + cap + "." + ctx.v) }, svg(ICO.sinopsis), h("span", { text: "Sinopsis" }));
            return h("div", { class: "fv-rap" },
              h("div", { class: "fv-rap-acc" }, cop, nota, tarj, sino),
              h("div", { class: "fv-rap-col-c" },
                h("div", { class: "fv-rap-et" }, h("span", { text: "Marcar verso" }), etAct),
                h("div", { class: "fv-rap-col", role: "group", "aria-label": "Marcar con color" }, dots)));
          })() : null,
          L ? (() => {
            const cmpBody = h("div", { class: "fv-cmp-cuerpo" }, h("p", { class: "nota-ui", text: "Cargando comparación…" }));
            let cargado = false;
            const det = h("details", { class: "fv-cmp" },
              h("summary", {},
                h("span", {}, svg(ICO.sinopsis), "Comparar vistas de este verso"),
                h("small", { text: "Griego · Textual · Lectura · Jünemann" })),
              cmpBody);
            det.addEventListener("toggle", async () => {
              if (!det.open || cargado) return;
              cargado = true;
              try {
                const [toks, jnm] = await Promise.all([
                  ctx.toks ? (T ? Promise.resolve(ctx.toks) : tablas().then(() => ctx.toks)) : versoTokens(b.c, cap, ctx.v).catch(() => null),
                  cargarJNM(b.c).catch(() => null),
                ]);
                if (!det.isConnected) return;
                const grTxt = toks && toks.length && T ? toks.map((t) => T.F[t[0]] + punt(t[4])).join(" ") : "";
                const jnmV = jnm && jnm.c && jnm.c[cap] ? jnm.c[cap][ctx.v - 1] : "";
                const col = (tit, nodo, cls) => h("div", { class: "fv-cmp-col" }, h("h5", { text: tit }), h("p", cls ? { class: cls, lang: cls === "gr" ? "grc" : "es" } : {}, nodo));
                const prevCor = corForzado;
                let nodoTex, nodoLec;
                try {
                  corForzado = "todo";
                  nodoTex = textoLectura(L.t, !!L.g, Object.assign({}, L, { rl: false }));
                  corForzado = "base";
                  nodoLec = L.o ? txtVersoL(L) : textoLectura(L.t, !!L.g, Object.assign({}, L, { rl: true }));
                } finally {
                  corForzado = prevCor;
                }
                cmpBody.replaceChildren(h("div", { class: "fv-cmp-grid" },
                  grTxt ? col("Griego originario", grTxt, "gr") : null,
                  col("Textual · completa con matices", nodoTex),
                  col(L.o ? "Lectura · limpia y orden natural" : "Lectura · limpia", nodoLec),
                  col("Jünemann (traducción clásica)", jnmV || "Este verso no figura en la edición de Jünemann.")));
              } catch (e) {
                cargado = false;
                cmpBody.replaceChildren(h("p", { class: "nota-ui", text: "No se pudo cargar la comparación en este momento." }));
              }
            });
            return det;
          })() : null,
          (() => {
            const lugs = lugaresDeVerso(b.c, cap, ctx.v);
            if (!lugs.length) return null;
            return h("div", { class: "fv-lugares", "aria-label": "Lugares en el Atlas bíblico" }, lugs.map((lug) =>
              h("a", {
                class: "fv-lugar",
                href: "#/mapa/" + lug.id,
                title: "Ver " + lug.n + " [" + lug.tr + "] en el Atlas bíblico",
                onclick: (e) => { e.preventDefault(); irDesdeModal("#/mapa/" + lug.id); },
              }, svg(ICO.mapa), h("span", { text: lug.n + " [" + lug.tr + "]" }))));
          })(),
          h("div", { class: "bloque" }, h("h4", { text: "Palabra por palabra · toca una para ver su análisis" }), zona,
            (() => {
              // AF2: la perícopa del verso (los mismos inicios que la lectura) y el capítulo entero
              const ini = versos.length ? iniciosPericopa(versos) : new Set(); let a = ctx.v, z = ctx.v;
              for (const x of versos) { if (x.v <= ctx.v && ini.has(x.v)) a = x.v; }
              for (const x of versos) { if (x.v > ctx.v && ini.has(x.v)) { break; } if (x.v >= ctx.v) z = x.v; }
              const op = (t, d, hh, que) => h("button", { type: "button", class: "fv-cg-b", onclick: () => copiarGriego(b, cap, d, hh, que) }, t);
              const ops = [op("verso", ctx.v, ctx.v, "verso"), a !== z ? op("perícopa " + a + "–" + z, a, z, "pericopa") : null, op("capítulo " + cap, 1, 1e4, "capitulo")].filter(Boolean);
              return h("div", { class: "fv-cg" }, h("p", { class: "fv-cg-t" }, svg(ICO.copiar), h("span", { text: "Copiar el griego" })), h("div", { class: "fv-cg-op", style: "--n:" + ops.length }, ops));
            })()),
          bloqueRefs(b, cap, ctx.v, vaANota),
          bloqueEstudio(b, cap, ctx.v, irAVerso),
          h("div", { class: "bloque" }, h("h4", { text: "En los manuscritos antiguos" }), resumenManuscritos({ b, cap, v: ctx.v }, () => empujar(vistaManuscritos(ctx)))),
          enlaceFuenteQ(b.c, cap, ctx.v))],
        h("div", { class: "m-pie" },
          (() => {
            // AA9 (BiEx, 14-nov-2026): con Escudriña, un verso ya marcado otro día se ofrece como «Repasado» (marca doble)
            const ej = window.BiExJuego && window.BiExJuego.estadoVerso ? window.BiExJuego.estadoVerso(b.c, cap, ctx.v) : null;
            if (ej && (ej.antes || ej.repaso)) {
              const hecho = ej.hoy;
              return h("button", { class: "btn chico btn-leido repaso" + (hecho ? " si" : ""), type: "button", "aria-pressed": String(hecho), title: hecho ? "Repasado hoy" : "Marcar este verso como repasado",
                onclick: () => { if (hecho) return; if (window.BiExJuego.marcarVerso(b.c, cap, ctx.v)) { const ahora = window.BiExJuego.estadoVerso(b.c, cap, ctx.v); reemplazar(vistaVerso(ctx)); if (ahora && ahora.hoy) avisar("Verso repasado"); } } }, svg(ICO.repaso), (hecho ? "Repasado" : "Marcar como repasado") + (ej.veces >= 2 ? " · " + ej.veces + " veces" : ""));
            }
            const si = LEI.es(b.c, cap, ctx.v); return h("button", { class: "btn chico btn-leido" + (si ? " si" : ""), type: "button", "aria-pressed": String(si), title: si ? "Quitar la marca de leído" : "Marcar este verso como leído",
            onclick: () => {
              if (!si && window.BiExJuego && window.BiExJuego.marcarVerso && window.BiExJuego.marcarVerso(b.c, cap, ctx.v)) { reemplazar(vistaVerso(ctx)); return; }
              LEI.marcar(b.c, cap, [ctx.v], !si); marcarLeidoDom(b.c, cap, [ctx.v], !si); reemplazar(vistaVerso(ctx)); avisar(si ? "Marca de leído quitada" : "Verso marcado como leído"); } }, svg(ICO.leido), si ? "Leído" : "Marcar como leído"); })(),
          L ? h("button", { class: "btn chico", type: "button", onclick: () => compartir(nombreLibro(b) + " " + cap + ":" + ctx.v, textoPlano(L.t), "#/" + b.c + "/" + cap + "/l/" + ctx.v) }, svg(ICO.compartir), "Compartir") : null,
          // (BiEx, 13-nov-2026) sin el botón gris «Manuscritos»: basta el dorado «Ver los manuscritos» de su sección
          h("a", { class: "btn chico oro", href: "#/" + b.c + "/" + cap + "/a/" + ctx.v }, svg(ICO.lupa), "Analizar el capítulo")));
    };
    return fn;
  }
  // ------------------------------------------------------------------ buscador inteligente (ventana)
  // Entiende citas, libros, escenas descritas con palabras propias, nombres, palabras griegas (también con letras latinas),
  // las palabras con que se recuerdan los versos en otras traducciones y preguntas sobre el uso de la página.
  const VERSIONES = { busqueda: "3bb45c2d30", juego: "1016783e51", voz: "87ff475d00" }; // la huella de cada archivo la pone wix/sellar.py
  const scripts = {};
  function cargarScript(nombre) {
    if (scripts[nombre]) return scripts[nombre];
    const intentar = (k) => new Promise((ok, mal) => {
      const el = document.createElement("script");
      el.src = BASES[k] + nombre + ".js" + (VERSIONES[nombre] ? "?v=" + VERSIONES[nombre] : "");
      el.async = true;
      el.onload = () => ok();
      el.onerror = () => { el.remove(); if (k + 1 < BASES.length) intentar(k + 1).then(ok, mal); else mal(new Error("No cargó " + nombre)); };
      document.head.append(el);
    });
    scripts[nombre] = intentar(baseOk).catch((e) => { delete scripts[nombre]; throw e; });
    return scripts[nombre];
  }
  // ------------------------------------------------------------------ Fecha y hora de Jerusalén en el calendario hebreo
  // Meses en transliteración BiEx (forma masorética: sh, v, ḥ, ʾ/ʿ, ᵉ del shevá y acento en la sílaba tónica). Versión provisional
  // del 23-nov-2026, armada con las notas breves de transliteración y las formas ya usadas en los textos; se precisa después con los prompts A y B.
  const MESES_HEB = {
    tishri: "Tishrḗy", tishrei: "Tishrḗy",
    heshvan: "Ḥeshvā́n", cheshvan: "Ḥeshvā́n", marheshvan: "Marḥeshvā́n",
    kislev: "Kislḗv",
    tevet: "Ṭēvḗṯ", tebet: "Ṭēvḗṯ",
    shevat: "Shᵉvā́ṭ", shvat: "Shᵉvā́ṭ",
    adar: "ʾĂdā́r", "adar i": "ʾĂdā́r Rīshṓn", "adar 1": "ʾĂdā́r Rīshṓn", "adar ii": "ʾĂdā́r Shēnī́", "adar 2": "ʾĂdā́r Shēnī́",
    nisan: "Nīsā́n", nissan: "Nīsā́n",
    iyar: "ʾIyyā́r", iyyar: "ʾIyyā́r",
    sivan: "Sīvā́n",
    tamuz: "Tammū́z", tammuz: "Tammū́z",
    av: "ʾĀv", ab: "ʾĀv",
    elul: "ʾĔlū́l"
  };

  function fechaHoraJerusalen(ms) {
    const f = ms ? new Date(ms) : new Date();
    let fecha = "", hora = "";
    try {
      const pts = new Intl.DateTimeFormat("en-u-ca-hebrew", { timeZone: "Asia/Jerusalem", day: "numeric", month: "long", year: "numeric" }).formatToParts(f);
      let d = "", m = "", y = "";
      for (const p of pts) {
        if (p.type === "day") d = p.value;
        else if (p.type === "month") m = p.value;
        else if (p.type === "year") y = p.value.replace(/\D+/g, "");
      }
      const mk = String(m || "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const mEs = MESES_HEB[mk] || m;
      if (d && mEs && y) fecha = d + " de " + mEs + " de " + y;
    } catch (e) { /* sin calendario hebreo */ }
    try {
      hora = new Intl.DateTimeFormat("es", { timeZone: "Asia/Jerusalem", hour: "2-digit", minute: "2-digit", hour12: false }).format(f);
    } catch (e) { /* sin zona horaria */ }
    if (fecha && hora) return fecha + " · " + hora;
    return fecha || hora || "";
  }
  // ------------------------------------------------------------------ Escudriña, el juego (juego.js, carga diferida)
  let JGX = null;
  function cargarJuego() {
    if (!JGX) JGX = cargarScript("juego").then(() => {
      const J = window.BiExJuego; if (!J) throw new Error("juego");
      J.iniciar({ h, svg, ICO, avisar, store, abrirModal, cajaModal, cabModal, cerrarModal, reemplazarModal: (fn) => reemplazar(fn), nube: NUBE_DAT,
        fechaHoraJerusalen,
        notificar: (tag, tit, cue, ruta, cat) => BIEX_NOTIF.enviar(tag, tit, cue, ruta, cat),
        ubicarFaro: () => FARO.ubicar(),
        versoFoco: () => esc.vFoco || null,
        enPieActual: () => !!enPieGlobal,
        guiaSeccion: (sec) => guiaSeccion(sec),
        nombreLibro: (c) => { const b = D && libroDe(c); return b ? nombreLibro(b) : c; },
        ultimo: () => { const u = store.get("ultimo", null), b = u && D && libroDe(u.c); return b ? { h: "#/" + b.c + "/" + u.cap + (u.v ? "/l/" + u.v : ""), t: nombreLibro(b) + " " + u.cap + (u.v ? ":" + u.v : "") } : null; },
        irA: (hh) => { location.hash = hh; },
        volver: (dest) => { if (pasosApp > 0) history.back(); else location.hash = dest || "#/"; },
        restaurando: () => RP.objetivo != null,
        marcarLeido: (c, cap, vs) => { const n = vs.filter((v) => !LEI.es(c, cap, v)); if (!n.length) return; LEI.marcar(c, cap, n, true); marcarLeidoDom(c, cap, n, true); },
        apartarLeidos: (desde) => { const n = LEI.apartar(desde); if (n) for (const el of $$(".hoja .vl.leido, .hoja .vs.leido")) if (!LEI.es(esc.libro, esc.cap, +el.id.slice(1))) el.classList.remove("leido"); return n; },
        sinDescargas: () => SIN_DESCARGAS, sinAnimaciones: () => ap.mov === "no",
        cargar: (r) => cargar(r), leido: (c, cap, v) => LEI.es(c, cap, v),
        // Progreso local por libro (0 peticiones al servidor): combina marcas de Escudriña (cf) y del lector (LEI) para Tesoro y Misiones
        progresoLibros: (cf, K) => {
          if (!D || !Array.isArray(D.libros)) return [];
          const kk = K | 0, vc = (ch) => { if (!ch) return 0; const n = parseInt(ch, 36); return isNaN(n) ? 0 : n; };
          return librosEnOrden().map((b) => {
            let l = 0, sig = 0;
            const caps = b.caps || [];
            for (const C of caps) {
              const s = (cf && cf[b.c + "." + C.c]) || "", tot = C.total || 0;
              let cL = 0;
              for (let v = 1; v <= tot; v++) if (vc(s[v - 1]) > kk || (kk === 0 && LEI.es(b.c, C.c, v))) cL++;
              l += cL;
              if (!sig && cL < tot) sig = C.c;
            }
            return { c: b.c, n: b.t || b.n, t: b.total || 0, l, caps: caps.length, sig: sig || 1 };
          });
        },
        // (12-nov-2026) los versos de una cita con el texto de la Lectura, para la ventana de la cita en el juego
        versos: (c, cap, v1, v2) => lectura(c).then((Lc) => (Lc.caps[cap] || []).filter((x) => x.v >= v1 && x.v <= v2).map((x) => [x.v, txtVersoL(x)])),
        // (14-nov-2026) pasajes de la Antigua Voluntad (Septuaginta de Jünemann, con su nota de cita de otra traducción) y el
        // nombre de sus libros como en las referencias cruzadas: hebreo masorético y el tradicional entre [ ]
        versosAV: (cod, cap, v1, v2) => { const li = LIBROS_REF.indexOf(cod); return li < 0 || li > 38 ? Promise.reject(new Error("libro")) : cargarAV(cod).then((d) => textoAV(d, [li, cap, v1, v2 && v2 !== v1 ? v2 : 0])); },
        nombreAV: (cod) => { const li = LIBROS_REF.indexOf(cod); return li >= 0 && li < 39 ? AV_NOMBRES[li][0] + " [" + AV_NOMBRES[li][1] + "]" : cod; },
        // (13-nov-2026, V23) el verso completo en la Textual de BiEx (el orden del griego, el mismo texto de las preguntas de la
        // prueba), con los colores de la edición: devuelve una función que lo dibuja cada vez que haga falta
        versoTextual: (c, cap, v) => lectura(c).then((Lc) => { const x = (Lc.caps[cap] || []).find((y) => y.v === v); return x && x.t ? () => textoLectura(x.t, !!x.g, x) : null; }),
        // AL8 (22-nov-2026): el mismo verso en la Lectura, que es el formato por defecto fuera del capítulo
        versoLectura: (c, cap, v) => lectura(c).then((Lc) => { const x = (Lc.caps[cap] || []).find((y) => y.v === v); return x && (x.o || x.t) ? () => txtVersoL(x) : null; }) });
      return J;
    }).catch((e) => { JGX = null; throw e; });
    return JGX;
  }
  function vistaJuego(sub) {
    navActual("");
    document.title = "Escudriña · BiEx";
    const ruta = rutaVista;
    // PR #15 (0 flasheos): si juego.js ya está en memoria, delegar directo sin borrar #vista ni mostrar spinner;
    // marco() en juego.js conserva la altura anterior y realiza el cambio limpio sin brincos del pie.
    if (window.BiExJuego && JGX) {
      if (!restaurando()) saltarA(0);
      Promise.resolve(window.BiExJuego.vista(vista(), sub))
        .catch(() => { if (rutaVista === ruta) vista().replaceChildren(fallo("No se pudo abrir Escudriña.")); });
      return;
    }
    vista().replaceChildren(cargando("Abriendo Escudriña…"));
    if (!restaurando()) saltarA(0);
    cargarJuego().then((J) => { if (rutaVista === ruta) return J.vista(vista(), sub); })
      .catch(() => { if (rutaVista === ruta) vista().replaceChildren(fallo("No se pudo abrir Escudriña.")); });
  }
  // Con sesión de Escudriña, el juego observa la lectura del capítulo (sin sesión no se carga nada)
  function juegoCapitulo(c, cap, modo) {
    // AC16: si la sesión está volviendo desde el sitio oficial, el capítulo espera esa respuesta (como mucho 1,5 s)
    if (!store.get("jg:t", null) && !window.BiExJuego) { if (sesionRecuperada) sesionRecuperada.then((ok) => { if (ok && esc.libro === c && esc.cap === cap) juegoCapitulo(c, cap, modo); }); return; }
    cargarJuego().then((J) => { if (esc.libro === c && esc.cap === cap) J.capitulo(c, cap, modo); }).catch(() => {});
  }
  let BQX = null, bqListo = false;
  function prepararBuscador() {
    if (!BQX) BQX = Promise.all([cargarScript("busqueda"), cargar("datos/busqueda/indice.json"), cargar("datos/busqueda/conceptos.json").catch(() => []),
      cargar("datos/busqueda/escenas.json").catch(() => []), cargar("datos/busqueda/ayuda.json").catch(() => []), tablas()])
      .then(([, I, C, E, A]) => {
        const BQ = window.BiExBusqueda;
        const R = BQ.preparar(I);
        bqListo = true;
        return { BQ, R, ctx: { libros: D.libros, conceptos: BQ.conceptos(C), griego: BQ.prepararGriego(T), escenas: E, ayuda: A, T } };
      })
      .catch((e) => { BQX = null; throw e; });
    return BQX;
  }
  const refTexto = (r) => { const b = libroDe(r[0]); return (b ? nombreLibro(b) : r[0]) + " " + r[1] + ":" + r[2] + (r[3] !== r[1] ? "–" + r[3] + ":" + (r[4] === 999 ? "" : r[4]) : r[4] !== r[2] && r[4] !== 999 ? "-" + r[4] : ""); };
  const refRuta = (r) => "#/" + r[0] + "/" + r[1] + "/l/" + r[2];
  // Marca en el texto de un verso las palabras que coinciden con la búsqueda
  function resaltar(el, terminos, BQ) {
    if (!terminos || !terminos.size) return el;
    const nodos = []; const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) nodos.push(n);
    for (const nd of nodos) {
      if (nd.parentElement && nd.parentElement.closest("[lang=grc]")) continue;
      const txt = nd.nodeValue, re = /[\p{L}\p{M}]+/gu; let m, i = 0, hubo = false; const frag = document.createDocumentFragment();
      while ((m = re.exec(txt))) {
        const ps = BQ.palabras(m[0]);
        if (ps.length === 1 && terminos.has(BQ.raizEsN(ps[0]))) {
          hubo = true; if (m.index > i) frag.append(txt.slice(i, m.index));
          frag.append(h("mark", { text: m[0] })); i = m.index + m[0].length;
        }
      }
      if (!hubo) continue;
      if (i < txt.length) frag.append(txt.slice(i));
      nd.replaceWith(frag);
    }
    return el;
  }
  // Lemas griegos que corresponden a la búsqueda: escritos en griego, con letras latinas o por las traducciones de BiEx
  function lemasDeConsulta(r, q, X) {
    const out = new Map();
    for (const [, ls] of r.griego) for (const li of ls) out.set(li, 1000);
    for (const w of X.BQ.palabras(q)) { if (w.length < 4 || X.BQ.griego(w)) continue; const ls = X.ctx.griego.latin.get(w); if (ls) for (const li of ls) out.set(li, Math.max(out.get(li) || 0, 500)); }
    // (12-nov-2026) los lemas a los que llevó la consulta (nombres por su comienzo y conceptos): el nombre exacto a la vista
    if (r.versos && r.versos.lemas) for (const li of r.versos.lemas) if (typeof li === "number") out.set(li, Math.max(out.get(li) || 0, 600));
    const ws = X.BQ.palabras(q).filter((w) => !X.BQ.griego(w) && !X.BQ.vaciaEs(w) && w.length >= 3);
    if (!r.griego.length && ws.length && ws.length <= 2) {
      const re = new RegExp("(^|[^a-zñ])(" + ws.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|") + ")([^a-zñ]|$)");
      T.TRk.forEach((x, ti) => { if (ti && re.test(x)) for (const li of T.TL[ti] || []) out.set(li, Math.max(out.get(li) || 0, 1)); });
    }
    return [...out.entries()].sort((a, b) => b[1] - a[1] || T.LN[b[0]] - T.LN[a[0]]).slice(0, 10).map(([li]) => li);
  }
  // Acción de una respuesta de ayuda: ["Texto", "#/ruta" | "?q=búsqueda" | "opciones" | "apariencia" | "guia"]
  function accionAyuda(a, buscarAqui) {
    if (!a) return null;
    const [t, x] = a;
    const hacer = () => {
      if (x.startsWith("?q=")) return buscarAqui(x.slice(3));
      if (x.startsWith("#/")) { location.hash = x; return; }
      if (x === "opciones") return empujar(vistaOpciones());
      if (x === "apariencia") return abrirApariencia();
      if (x === "guia") return abrirGuia(0);
      if (x === "herramientas") return abrirHerramientas();
    };
    return h("button", { class: "btn chico oro", type: "button", onclick: hacer }, svg(ICO.seguir), t);
  }
  let volverBusqueda = null; // { q, ruta }: el lector ofrece volver a los resultados después de abrir uno
  const recordarBusqueda = (q, ruta) => { volverBusqueda = { q, ruta }; };
  function inicioBusqueda(elegir) {
    // cada grupo muestra unos pocos ejemplos de un conjunto mayor, y uno de ellos se renueva cada pocos segundos
    const ej = [
      ["Escenas", ["la mujer samaritana", "cuando calmó la tormenta", "el hijo pródigo", "la última cena", "los cinco panes y los dos peces", "caminó sobre el mar", "la ofrenda de la viuda", "la mujer que tocó su manto", "dejen que los niños vengan"], 4],
      ["Con tus palabras", ["bienaventurados los pobres", "Tomás no creyó", "no quedará piedra sobre piedra", "el sembrador salió a sembrar", "amarás a tu prójimo", "el grano de mostaza", "vino nuevo en odres viejos", "el que quiera ser el primero"], 4],
      ["Citas y libros", ["Jn 3:16", "Marcos 4", "1 Co 13:4-7", "Revelación", "Mc 10:45", "Ro 8:28", "Hebreos 11", "Ef 2:8-9", "1 Pe 1:3"], 4],
      ["Griego", ["λόγος", "agape", "pneuma", "χάρις", "πίστις", "kosmos", "ἐκκλησία", "aletheia", "δόξα"], 4],
      ["Preguntas y comparaciones", [...EJ_PREG, "compara Pablo y Jacobo sobre la fe", "diferencia entre alma y espíritu", "qué enseña Juan sobre el discurso"], 3]];
    const chip = (x) => h("button", { type: "button", class: "rota", lang: /[Ͱ-Ͽἀ-῿]/.test(x) ? "grc" : null, onclick: () => elegir(x), text: x });
    const grupos = ej.map(([t, todos, n], gi) => {
      const orden = barajar(todos), caja = h("div", { class: "bq-ej" }, orden.slice(0, n).map(chip));
      let sig = n, cual = 0;
      const turno = () => {
        if (!caja.isConnected) return;
        const bs = caja.children, b = bs[cual % bs.length]; cual++;
        const quieto = ap.mov === "no" || document.hidden || caja.matches(":hover") || caja.contains(document.activeElement);
        if (!quieto && b) { b.classList.add("rota-sale"); setTimeout(() => { if (!b.isConnected) return; const nuevo = chip(orden[sig++ % orden.length]); nuevo.classList.add("rota-sale"); b.replaceWith(nuevo); requestAnimationFrame(() => requestAnimationFrame(() => nuevo.classList.remove("rota-sale"))); }, 280); }
        setTimeout(turno, 4200);
      };
      setTimeout(turno, 2600 + gi * 900);
      return h("div", { class: "bq-grupo-ej" }, h("h4", { text: t }), caja);
    });
    return h("div", { class: "bq-inicio" },
      h("p", { class: "nota-ui", text: "Escribe como lo recuerdes, aunque no sea con las palabras de BiEx: el buscador entiende escenas, nombres, lugares, citas, palabras griegas, comparaciones entre autores o conceptos y preguntas sobre la página. Para buscar solo en un libro, termina con «en Marcos», «en Romanos»…" }),
      grupos);
  }
  let turnoBq = 0;
  async function pintarResultados(q, cont, estado, elegir) {
    const yo = ++turnoBq;
    q = String(q || "").trim();
    if (!q) { estado.textContent = ""; cont.replaceChildren(inicioBusqueda(elegir)); return; }
    if (!bqListo) { estado.textContent = "Preparando el buscador…"; cont.classList.add("esperando"); }
    let X;
    try { X = await prepararBuscador(); } catch (e) { if (yo === turnoBq) { estado.textContent = "No se pudo cargar el buscador. Revisa tu conexión e inténtalo de nuevo."; cont.classList.remove("esperando"); } return; }
    if (yo !== turnoBq) return;
    cont.classList.remove("esperando");
    let secc = []; try { secc = await seccionesBiex(); } catch (e) { /* sin estudios */ }
    if (yo !== turnoBq) return;
    const ctxCompleto = { ...X.ctx, secciones: secc };
    const r = X.BQ.buscar(X.R, q, ctxCompleto);
    const comp = X.BQ.comparar ? X.BQ.comparar(X.R, q, ctxCompleto) : null;
    const grupos = [];
    const grupo = (tit, ...kids) => h("section", { class: "bq-g" }, h("h3", {}, tit), kids);
    const abrirRes = (ruta) => (e) => { recordarBusqueda(q, ruta); };
    // P17 (BiEx, 11-nov-2026; 22-nov): una tarjeta responde al clic en toda su superficie, no solo en su título; los enlaces
    // y botones de dentro (citas, «Leer», «Analizar») siguen haciendo lo suyo y seleccionar texto no abre nada
    const tarjetaEntera = (el, principal) => {
      el.classList.add("tarj-clic");
      el.addEventListener("click", (e) => { if (e.target.closest("a, button, input, select, textarea") || String(getSelection && getSelection() || "").trim()) return; principal.click(); });
      return el;
    };
    // respuesta de ayuda
    if (r.ayuda.length) grupos.push(grupo("Respuesta", r.ayuda.map(({ it }) => h("div", { class: "res-ayuda" }, h("h4", { text: it.p }), h("p", { text: it.r }), accionAyuda(it.a, elegir)))));
    // síntesis comparativa y dseológica automática de BiEx
    if (comp) {
      const pintarCitaComp = (d) => {
        const [lib, c, v] = X.R.versos[d], b = libroDe(lib), ruta = "#/" + lib + "/" + c + "/l/" + v;
        const tx = h("span", { text: "…" });
        lectura(lib).then((Lc) => { const L = (Lc.caps[c] || []).find((y) => y.v === v); tx.replaceChildren(L ? txtVersoL(L) : ""); }).catch(() => { tx.textContent = ""; });
        return h("a", { class: "rc-cita", href: ruta, onclick: abrirRes(ruta) },
          h("b", { text: (b ? nombreLibro(b) : lib) + " " + c + ":" + v }), tx);
      };
      const cols = (comp.polos || []).map((p) => h("div", { class: "rc-col" },
        h("div", { class: "rc-col-cab" }, h("b", { text: p.titulo }), h("small", { text: fmt(p.total) + (p.total === 1 ? " verso" : " versos") })),
        p.lemas && p.lemas.length ? h("div", { class: "rc-lemas" }, p.lemas.map((l) => h("a", { class: "rc-lema", href: "#/lema/" + l.li, onclick: abrirRes("#/lema/" + l.li) },
          h("span", { lang: "grc", text: T.L[l.li] }), h("small", { text: (l.glosa ? l.glosa + " · " : "") + fmt(l.n) + "×" })))) : null,
        p.versos && p.versos.length ? h("div", { class: "rc-citas" }, p.versos.map((v) => pintarCitaComp(v.d))) : null));
      const estNodes = (comp.estudios || []).map((st) => h("div", { class: "rc-est" },
        h("div", { class: "rc-est-cab" }, h("b", { text: st.t }), h("a", { class: "btn chico oro", href: st.ruta, onclick: abrirRes(st.ruta) }, svg(ICO.seguir), "Ver estudio")),
        h("p", { text: st.extracto })));
      const inter = comp.interseccion && comp.interseccion.length ? h("div", { class: "rc-inter" },
        h("small", { text: "Versos donde convergen ambos términos (" + fmt(comp.totalInter || comp.interseccion.length) + ")" }),
        h("div", { class: "rc-citas" }, comp.interseccion.map((v) => pintarCitaComp(v.d)))) : null;
      grupos.push(grupo("Síntesis dseológica BiEx", h("div", { class: "res-comp" },
        h("div", { class: "res-comp-cab" }, h("h3", { text: comp.titulo }), h("span", { class: "q-orden-pct", text: comp.etiqueta || "Análisis comparativo" })),
        comp.resumen ? h("p", { class: "res-comp-res", text: comp.resumen }) : null,
        ...estNodes,
        cols.length ? h("div", { class: "rc-cols" }, cols) : null,
        inter)));
    }
    // cita
    if (r.cita && r.cita.cap) {
      const { b, cap, v, hasta } = r.cita, ruta = "#/" + b.c + "/" + cap + (v ? "/l/" + v : "");
      const snip = h("div", { class: "res-cita-tx" });
      if (v) lectura(b.c).then((Lc) => {
        const vs = (Lc.caps[cap] || []).filter((x) => x.v >= v && x.v <= (hasta || v)).slice(0, 6);
        snip.replaceChildren(...vs.map((x) => h("p", {}, h("sup", { text: x.v }), " ", txtVersoL(x))));
      }).catch(() => {});
      const leer = h("a", { class: "btn chico oro", href: ruta, onclick: abrirRes(ruta) }, svg(ICO.libro), "Leer");
      grupos.push(grupo("Cita", tarjetaEntera(h("div", { class: "res-cita" },
        h("div", { class: "rc-cab" }, h("b", { text: nombreLibro(b) + " " + cap + (v ? ":" + v + (hasta ? "-" + hasta : "") : "") }),
          h("span", { class: "rc-acc" }, leer, h("a", { class: "btn chico", href: "#/" + b.c + "/" + cap + "/a" + (v ? "/" + v : "") }, svg(ICO.lupa), "Analizar"))),
        snip), leer)));
    }
    // libros
    const libros = []; for (const b of [r.cita && !r.cita.cap ? r.cita.b : null, ...r.libros]) if (b && !libros.includes(b)) libros.push(b);
    if (libros.length) grupos.push(grupo("Libros", h("div", { class: "res-libros" }, libros.map((b) => h("a", { class: "res-libro", href: "#/" + b.c + "/1", onclick: abrirRes("#/" + b.c + "/1") },
      h("b", { text: b.t || b.n }), h("span", { text: tradQ(b) + (fechaEscrito(b) ? " · escrito c. " + fechaEscrito(b).replace(/^c\. /, "") : "") }))))));
    // filtro por libro y correcciones
    const avisos = [];
    if (r.filtro) avisos.push(h("span", { class: "chip" }, "Solo en " + nombreLibro(r.filtro) + " ", h("button", { class: "enlace", type: "button", onclick: () => elegir(q.replace(/\s+(?:en|de|del libro de|en el libro de)\s+[^]*$/i, "")), text: "(quitar)" })));
    if (r.versos && r.versos.correcciones.length) avisos.push(h("span", { class: "nota-ui", text: "También se buscó: " + r.versos.correcciones.map(([a, b]) => "«" + a + "» como " + (Array.isArray(b) ? b : [b]).map((x) => "«" + x + "»").join(" o ")).join(", ") + "." }));
    // escenas
    if (r.escenas.length) grupos.push(grupo("Escenas", h("div", { class: "res-escenas" }, r.escenas.map(({ it }) => {
      const rs = it._r || X.BQ.rangos(it.r);
      const tit = h("a", { class: "re-t", href: refRuta(rs[0]), onclick: abrirRes(refRuta(rs[0])) }, h("b", { text: it.t }), h("small", { text: it.s }));
      return tarjetaEntera(h("div", { class: "res-escena" }, tit,
        h("div", { class: "re-refs" }, rs.slice(0, 5).map((x) => h("a", { href: refRuta(x), onclick: abrirRes(refRuta(x)), text: refTexto(x) })))), tit);
    }))));
    // en los textos de BiEx (estudios y línea del tiempo): cuando la consulta coincide en buena parte con una sección
    const ts = new Set(X.BQ.terminosEs(q)), hallS = ts.size ? X.BQ.puntuarListas(q, secc, ["t", "k"]).filter((x) => x.n / ts.size >= (ts.size > 2 ? 0.6 : 1)).slice(0, 6) : [];
    if (hallS.length) grupos.push(grupo("En los textos de BiEx", h("div", { class: "res-secc" }, hallS.map(({ it }) => {
      const pal = it.k.split(/(?<=[.!?»])\s+/).find((f) => X.BQ.terminosEs(f).some((t2) => ts.has(t2))) || it.k;
      return h("a", { class: "res-sec", href: it.ruta, onclick: abrirRes(it.ruta) }, h("span", { class: "rs-s", text: it.s }), h("b", { text: it.t }),
        h("span", { class: "rs-tx" }, resaltar(h("span", { text: pal.length > 220 ? pal.slice(0, 217) + "…" : pal }), new Set(X.BQ.terminosEs(q)), X.BQ)));
    }))));
    // palabras griegas
    const lemas = lemasDeConsulta(r, q, X);
    const grupoGriego = lemas.length ? grupo("Palabras griegas", h("div", { class: "resultados" }, lemas.map((li) => {
      const tra = (T.LP[li] || []).map((x) => x[3]).filter(Boolean);
      return h("a", { class: "res-lema", href: "#/lema/" + li }, h("span", { class: "g" }, h("span", { lang: "grc", text: T.L[li] }), h("small", { text: T.LT[li] })),
        h("span", { class: "x" }, fmt(T.LN[li]) + " veces", tra.length ? h("br") : null, tra.length ? T.TR[tra[0]] : null));
    }))) : null;
    if (r.griego.length && grupoGriego) grupos.push(grupoGriego);
    // versos
    if (r.versos && r.versos.res.length) {
      const lista = r.versos.res.filter((x, k) => k < 8 || x.cubre >= 0.34);
      const terminos = new Set(r.versos.terminos);
      const ol = h("ol", { class: "res-versos" });
      let n = 0;
      const mas = h("button", { class: "btn chico", type: "button", text: "Mostrar más versos" });
      const pintaMas = () => {
        const lote = lista.slice(n, n + (n ? 20 : 10)); n += lote.length;
        ol.append(...lote.map((x) => {
          const [lib, c, v] = X.R.versos[x.d], b = libroDe(lib), ruta = "#/" + lib + "/" + c + "/l/" + v;
          const tx = h("span", { class: "rv-tx" }, h("span", { class: "cargando-mini", text: "…" }));
          lectura(lib).then((Lc) => { const L = (Lc.caps[c] || []).find((y) => y.v === v); tx.replaceChildren(L ? resaltar(h("span", { class: "vt" }, txtVersoL(L)), terminos, X.BQ) : ""); }).catch(() => { tx.textContent = ""; });
          return h("li", {}, h("a", { class: "res-verso", href: ruta, onclick: abrirRes(ruta) }, h("span", { class: "rv-ref", text: nombreLibro(b) + " " + c + ":" + v }), tx));
        }));
        mas.hidden = n >= Math.min(lista.length, 60);
      };
      mas.onclick = pintaMas;
      pintaMas();
      grupos.push(grupo(r.escenas.length ? "Versos" : "Versos encontrados", avisos.length ? h("div", { class: "bq-avisos" }, avisos) : null, ol, mas));
    } else if (avisos.length) grupos.push(h("div", { class: "bq-avisos" }, avisos));
    if (!r.griego.length && grupoGriego) grupos.push(grupoGriego);
    if (!grupos.length) grupos.push(h("div", { class: "vacio" }, h("p", { text: "No encontré nada para «" + q + "»." }), h("p", { class: "nota-ui", text: "Prueba con otras palabras, una cita (Jn 3:16), un nombre o describe la escena con tus palabras." }), inicioBusqueda(elegir)));
    estado.textContent = "";
    cont.replaceChildren(...grupos);
  }
  function abrirBusqueda(q0) {
    const st = { q: q0 || "", bq: null, inp: null };
    prepararBuscador().catch(() => {});
    const vistaBq = () => {
      if (!st.bq) {
        const inp = h("input", { type: "search", value: st.q, placeholder: "Una escena, una cita, un nombre, una palabra…", "aria-label": "Buscar", enterkeyhint: "search", autocomplete: "off", spellcheck: "false" });
        const res = h("div", { class: "bq-res" });
        const estado = h("p", { class: "bq-estado", role: "status" });
        let t = 0;
        const buscarYa = () => pintarResultados(st.q, res, estado, elegir);
        const borrar = h("button", { class: "btn-icono bq-borrar", type: "button", "aria-label": "Borrar la búsqueda", title: "Borrar", hidden: !st.q, onclick: () => { elegir(""); inp.focus(); } }, svg(ICO.cerrar));
        function elegir(x) { inp.value = st.q = x; borrar.hidden = !x; buscarYa(); }
        inp.addEventListener("input", () => { st.q = inp.value; borrar.hidden = !inp.value; clearTimeout(t); t = setTimeout(buscarYa, 160); });
        inp.addEventListener("keydown", (e) => {
          if (e.key === "Enter") { e.preventDefault(); clearTimeout(t); buscarYa(); inp.blur(); }
          else if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); cerrarModal(); } // Esc siempre sale del buscador
        });
        st.inp = inp;
        st.bq = h("div", { class: "bq" }, h("label", { class: "bq-campo" }, svg(ICO.buscar), inp, borrar, h("span", { class: "bq-linea", "aria-hidden": "true" })), estado, res);
        buscarYa();
      }
      return cajaModal(cabModal("Buscar", "Escenas, nombres, citas, palabras, griego o preguntas"),
        st.bq,
        h("div", { class: "m-pie m-pie-bq" },
          h("button", { class: "btn chico", type: "button", onclick: cerrarModal }, svg(ICO.atras), "Volver"),
          h("a", { class: "btn chico", href: "#/buscar" }, svg(ICO.filtros), "Búsqueda morfológica")));
    };
    vistaBq.alMostrar = () => { if (!st.q && st.inp) st.inp.focus({ preventScroll: true }); };
    abrirModal(vistaBq);
  }
  // «Volver»: un paso atrás dentro del lector o, si se entró directamente, al inicio
  let pasosApp = 0;
  const volverAtras = () => { if (pasosApp > 0) history.back(); else location.hash = "#/"; };
  const barraVolver = (txt) => h("div", { class: "barra-volver" }, h("button", { class: "btn chico", type: "button", onclick: volverAtras }, svg(ICO.atras), txt || "Volver"));

  // ------------------------------------------------------------------ lema y concordancia
  // Índice de la concordancia: buscar un lema en griego, con letras latinas o por su traducción; los más frecuentes y los últimos vistos
  async function vistaConcordancia() {
    document.title = "Concordancia · BiEx";
    navActual("#/buscar");
    if (!T || !LX) { vista().replaceChildren(cargando("Preparando la concordancia…")); alTope(); }
    try { await tablas(); } catch (e) { vista().replaceChildren(fallo("No se pudieron cargar los datos.")); return; }
    try { await lexico(); } catch (e) { /* sin el léxico de estudio: la búsqueda por Strong no estará */ }
    let X = null; try { X = await prepararBuscador(); } catch (e) { X = null; }
    const glosas = (li) => [...new Set((T.LP[li] || []).map((r) => r[3]).filter(Boolean))].slice(0, 3).map((x) => T.TR[x]).join(" · ");
    const fila = (li) => h("li", {}, h("a", { class: "cc-it", href: "#/lema/" + li },
      h("b", { lang: "grc", text: T.L[li] }), h("span", { class: "cc-tr", text: T.LT[li] !== T.L[li] ? T.LT[li] : "" }),
      h("span", { class: "cc-gl", text: glosas(li) }), h("em", {}, LX && LX.S[li] ? h("span", { class: "cc-st", text: strongN(LX.S[li]) }) : null, fmt(T.LN[li]))));
    const frecuentes = T.L.map((_, i) => i).sort((a, b) => T.LN[b] - T.LN[a]).slice(0, 60);
    const buscador = buscadorLemas(X);
    const buscarLemas = (q) => buscador(q).slice(0, 60);
    const entrada = h("input", { type: "search", class: "cc-q", placeholder: "λόγος · logos · discurso · G3056", "aria-label": "Buscar un lema", autocomplete: "off", autocapitalize: "off", spellcheck: "false" });
    const titulo = h("h2", { text: "Los más frecuentes" });
    const lista = h("ol", { class: "cc-lista" });
    const pintar = () => {
      const q = entrada.value.trim();
      const ls = q ? buscarLemas(q) : frecuentes;
      titulo.textContent = q ? (ls.length ? "Lemas que coinciden" : "Ningún lema coincide con «" + q + "»") : "Los más frecuentes";
      lista.replaceChildren(...ls.map(fila));
      try { history.replaceState(history.state, "", urlHash("#/lema" + (q ? "?" + encodeURIComponent(q) : ""))); } catch (e) { /* ignorar */ }
    };
    let tq = 0; entrada.addEventListener("input", () => { clearTimeout(tq); tq = setTimeout(pintar, 140); });
    const previo = decodificar(location.hash.split("?")[1] || ""); if (previo) entrada.value = previo;
    const vistos = store.get("lemasVistos", []).filter((x) => x >= 0 && x < T.L.length).slice(0, 12);
    vista().replaceChildren(h("div", { class: "in" }, h("section", { class: "panel" },
      barraVolver(),
      h("div", { class: "panel-cab" }, h("span", { class: "eyebrow", text: "Concordancia" }), h("h1", { text: "Elige una palabra griega" }),
        h("p", { class: "nota-ui", text: "Cada lema (la forma de diccionario) reúne todas sus formas y apariciones en la Nueva Voluntad. Escríbelo en griego, con letras latinas, por su traducción o por su código Strong (G3056)." })),
      h("div", { class: "cc-buscar" }, svg(ICO.buscar), entrada),
      vistos.length ? h("div", { class: "cc-vistos" }, h("span", { class: "rotulo", text: "Vistos hace poco" }), h("div", { class: "chips" }, vistos.map((li) => h("a", { class: "chip", lang: "grc", href: "#/lema/" + li, text: T.L[li] })))) : null,
      h("div", { class: "tarjeta" }, titulo, lista))));
    pintar();
    if (!EMBED && !matchMedia("(pointer: coarse)").matches) entrada.focus({ preventScroll: true });
  }
  async function vistaLema(li, libroAbrir) {
    navActual("#/buscar");
    if (!T || !LX) { vista().replaceChildren(cargando("Cargando el lema…")); alTope(); }
    try { await tablas(); } catch (e) { vista().replaceChildren(fallo("No se pudieron cargar los datos.")); return; }
    try { await lexico(); } catch (e) { /* sin el léxico de estudio */ }
    if (!(li >= 0 && li < T.L.length)) return noEncontrado();
    document.title = T.L[li] + " · BiEx";
    store.set("lemasVistos", [li].concat(store.get("lemasVistos", []).filter((x) => x !== li)).slice(0, 12));
    const par = T.LP[li] || [];
    const lb = T.LB[li] || [];
    const pares = []; for (let k = 0; k < lb.length; k += 2) pares.push([lb[k], lb[k + 1]]);
    const max = Math.max(1, ...pares.map((p) => p[1]));
    const trads = glosasLema(li, 12);
    // formas: tabla del paradigma o lista; se recuerda la elección
    const listaF = h("table", { class: "paradigma" }, h("tbody", {}, par.map((r) => h("tr", {},
      h("td", {}, spanGk(T.F[r[0]])), h("td", { class: "m", text: mdTok([r[0], 0, r[1], 0, "", 0, 0, r[4]]) }), h("td", { text: r[3] ? T.TR[r[3]] : "" }), h("td", { class: "n", text: fmt(r[2]) })))));
    const tablaF = h("div", { class: "tf-caja" }, tablaFormas(li));
    let modoF = store.get("formasModo", "tabla") === "lista" ? "lista" : "tabla";
    const cajaF = h("div", {}, modoF === "tabla" ? tablaF : listaF);
    const togF = h("div", { class: "seg-mini", role: "group", "aria-label": "Mostrar las formas" }, [["tabla", "Tabla"], ["lista", "Lista"]].map(([k, t]) => h("button", { type: "button", "data-k": k, "aria-pressed": modoF === k ? "true" : "false", text: t, onclick: () => {
      modoF = k; store.set("formasModo", k); cajaF.replaceChildren(k === "tabla" ? tablaF : listaF); for (const x of togF.children) x.setAttribute("aria-pressed", x.dataset.k === k ? "true" : "false"); } })));
    // Apariciones plegadas por libro: se ve cada libro con su número de apariciones y se abre solo el que interesa
    // (sus datos se traen al abrirlo); lo abierto se recuerda al volver atrás
    const abiertos = new Set((() => { try { return JSON.parse(sessionStorage.getItem("biex:lemaAb") || "{}")[li] || []; } catch (e) { return []; } })());
    const guardarAb = () => { try { const o = JSON.parse(sessionStorage.getItem("biex:lemaAb") || "{}"); o[li] = [...abiertos]; sessionStorage.setItem("biex:lemaAb", JSON.stringify(o)); } catch (e) { /* sin almacenamiento */ } };
    const grupos = pares.map(([bi, n]) => {
      const b = D.libros[bi];
      const lista = h("ol", { class: "citas" }), mas = h("button", { class: "btn chico", type: "button", hidden: true, text: "Mostrar más" });
      const det = h("details", { class: "ap-libro", "data-c": b.c, open: abiertos.has(b.c) ? true : null },
        h("summary", {}, h("span", { class: "apl-t" }, h("b", { text: b.t || b.n }), b.t ? h("small", { text: tradQ(b) }) : null),
          h("span", { class: "apl-n", text: fmt(n) + (n === 1 ? " aparición" : " apariciones") }), svg(ICO.abajo)),
        h("div", { class: "apl-cuerpo" }, lista, mas));
      let cargado = false;
      const cargar = async () => {
        if (cargado) return; cargado = true;
        lista.replaceChildren(h("li", { class: "nota-ui", text: "Reuniendo las apariciones…" }));
        let A, Lc;
        try { [A, Lc] = await Promise.all([analisis(b.c), lectura(b.c)]); } catch (e) { lista.replaceChildren(h("li", { class: "nota-ui", text: "No se pudieron cargar." })); cargado = false; return; }
        const todas = [];
        for (const [cap, vs] of Object.entries(A.caps)) for (const [v, toks] of vs) toks.forEach((t, i) => { if (t[1] === li) todas.push({ b, cap: +cap, v, toks, i, L: (Lc.caps[cap] || []).find((x) => x.v === v) }); });
        let k = 0;
        const pinta = () => { const lote = todas.slice(k, k + 60); k += lote.length; lista.append(...lote.map(citaEl)); mas.hidden = k >= todas.length; };
        lista.replaceChildren(); mas.onclick = pinta; pinta();
      };
      det.addEventListener("toggle", () => { if (det.open) { abiertos.add(b.c); cargar(); } else abiertos.delete(b.c); guardarAb(); });
      if (det.open) cargar();
      return det;
    });
    const abrirLibroAp = (c) => { const d = grupos.find((x) => x.dataset.c === c); if (!d) return; d.open = true; requestAnimationFrame(() => d.scrollIntoView({ block: "start", behavior: "smooth" })); };
    if (libroAbrir) { const c0 = String(libroAbrir).toUpperCase(); setTimeout(() => { if (!restaurando()) { const d = grupos.find((x) => x.dataset.c === c0); if (d) { d.open = true; requestAnimationFrame(() => { d.scrollIntoView({ block: "start", behavior: "instant" }); d.classList.add("sec-foco"); setTimeout(() => d.classList.remove("sec-foco"), 2600); }); } } }, 60); }
    const todosBtn = pares.length > 1 ? h("button", { class: "btn chico", type: "button", onclick: () => { const abrir = !grupos.every((d) => d.open); for (const d of grupos) d.open = abrir; todosBtn.textContent = abrir ? "Plegar todo" : "Desplegar todo"; } }, grupos.every((d) => d.open) ? "Plegar todo" : "Desplegar todo") : null;
    vista().replaceChildren(h("div", { class: "in" }, h("section", { class: "panel" },
      h("div", { class: "barra-volver" }, h("button", { class: "btn chico", type: "button", onclick: volverAtras }, svg(ICO.atras), "Volver"),
        h("a", { class: "btn chico", href: "#/lema" }, svg(ICO.buscar), "Otra palabra")),
      h("div", { class: "panel-cab" }, h("span", { class: "eyebrow", text: "Concordancia del lema" }),
        h("h1", { lang: "grc" }, T.L[li], h("small", { text: T.LT[li] })), lineaPron(lemaCorto(li)),
        h("p", { class: "nota-ui", text: fmt(T.LN[li]) + " apariciones en " + pares.length + (pares.length === 1 ? " libro" : " libros") + ", en " + par.length + (par.length === 1 ? " forma" : " formas") + " distintas." }),
        trads.length ? h("div", { class: "chips" }, trads.map(([x, n]) => h("span", { class: "chip", title: fmt(n) + (n === 1 ? " vez" : " veces") }, T.TR[x], h("small", { class: "chip-n", text: fmt(n) })))) : null),
      h("div", { class: "columnas" },
        h("div", { class: "tarjeta", "data-sec": "Formas" }, h("div", { class: "apl-cab" }, h("h2", { text: "Formas" }), togF), cajaF),
        LX ? h("div", { class: "tarjeta", "data-sec": "Raíz y formación" }, h("h2", { text: "Raíz y formación" }), bloqueRaiz(li, "lema")) : null),
      tarjetaMinigrafo("Red léxica de este lema", "Su raíz, familia etimológica y libros principales · arrastra o toca un nodo.", grafoLema(li), "#/constelacion?lema=" + li),
      h("div", { class: "columnas" },
        h("div", { class: "tarjeta", "data-sec": "Por libro" }, h("h2", { text: "Por libro" }), h("div", { class: "barras" }, pares.map(([bi, n]) => {
          const b = D.libros[bi];
          return h("div", {}, h("a", { href: "#/" + b.c + "/1/a", text: b.t || b.n, title: "Ver sus apariciones en " + nombreLibro(b), onclick: (e) => { e.preventDefault(); abrirLibroAp(b.c); } }), h("i", { style: "width:" + (100 * n / max).toFixed(1) + "%" }), h("em", { text: fmt(n) }));
        }))),
        h("div", { class: "tarjeta", "data-sec": "A lo largo del tiempo" }, h("h2", { text: "A lo largo del tiempo" }), h("p", { class: "nota-ui", text: "Los libros en el orden en que se escribieron; toca uno para ver sus apariciones." }), tiraTiempo(pares, abrirLibroAp))),
      h("div", { class: "tarjeta", "data-sec": "Apariciones" }, h("div", { class: "apl-cab" }, h("h2", { text: "Apariciones por libro" }), todosBtn),
        h("p", { class: "nota-ui", text: "Abre el libro que quieras revisar; toca una aparición para ver su análisis." }),
        h("div", { class: "ap-libros" }, grupos)))));
    if (restaurando()) intentarRestaurar();
  }
  function citaEl(x) {
    const ref = nombreLibro(x.b) + " " + x.cap + ":" + x.v + " · " + mdTok(x.toks[x.i]);
    const g = h("span", { class: "gtx", lang: "grc" });
    x.toks.forEach((t, i) => { if (i) g.append(" "); g.append(i === x.i ? h("mark", {}, spanGk(T.F[t[0]])) : spanGk(T.F[t[0]]), punt(t[4])); });
    const tr = T.TR[x.toks[x.i][3] || 0];
    return h("li", {}, h("button", { type: "button", class: "cita", onclick: () => abrirModal(vistaPalabra({ b: x.b, cap: x.cap, v: x.v, toks: x.toks, i: x.i, L: x.L, desde: "cita" })) },
      h("span", { class: "ref", text: ref }), g,
      x.L ? h("span", { class: "stx" }, txtVersoL(x.L)) : (tr ? h("span", { class: "stx", text: tr }) : null)));
  }

  // ------------------------------------------------------------------ estudio de la palabra: Strong, origen, raíz, formas y pronunciación
  // datos/lexico.json (Taller: tools/lexico/hacer_lexico.py.txt). S: código Strong extendido de cada lema (TAGNT de STEPBible,
  // Tyndale House, CC BY 4.0); X: código de una palabra cuando difiere del de su lema ({LIB: {"cap.v.i": código}}); O: origen
  // (h hebreo, a arameo, l latino, e extranjero, i incierto, p primaria, g formada en griego, - sin dato); D: formación en español,
  // con {n} = lema n, {g:…} = griego que no aparece en la Nueva Voluntad y {h:…} = hebreo (diccionario de Strong, 1890, en el JSON
  // de Open Scriptures, CC BY-SA); R: lemas relacionados cuando la formación no está traducida; H: palabra hebrea o aramea de base;
  // F: raíz de cada lema; B y P: base visible y prefijos de cada compuesto (familias morfológicas de BiEx).
  let LX = null, LXp = null;
  function lexico() {
    if (LX) return Promise.resolve(LX);
    return LXp || (LXp = Promise.all([cargar("datos/lexico.json"), tablas()]).then(([x]) => {
      const m = new Map();
      x.F.forEach((r, li) => { if (!m.has(r)) m.set(r, []); m.get(r).push(li); });
      for (const a of m.values()) a.sort((p, q) => T.LN[q] - T.LN[p]);
      x.fam = m; LX = x; return x;
    }).catch((e) => { LXp = null; throw e; }));
  }
  const ORIGEN = { h: "Origen hebreo", a: "Origen arameo", l: "Origen latino", e: "Origen extranjero", i: "Origen incierto", p: "Palabra primaria", g: "Formada en griego" };
  const strongN = (s) => (s || "").replace(/^([GH])0*(\d+).*$/, "$1$2");
  const strongX = (s) => (s || "").replace(/^([GH])0*(\d+)/, "$1$2");
  const strongNum = (s) => +String(s || "").replace(/^[GH]0*/, "").replace(/\D.*$/, "") || 0;
  const strongTok = (c, cap, v, i, li) => (LX && LX.X[c] && LX.X[c][cap + "." + v + "." + i]) || (LX ? LX.S[li] : "");
  const lemaCorto = (li) => String(T.L[li] == null ? "" : T.L[li]).split(",")[0];
  const tlCorta = (li) => String(T.LT[li] == null ? "" : T.LT[li]).split(",")[0];
  // traducciones de un lema por frecuencia, tal como salen en el texto
  function glosasLema(li, n) {
    const c = new Map();
    for (const r of T.LP[li] || []) if (r[3]) c.set(r[3], (c.get(r[3]) || 0) + r[2]);
    return [...c.entries()].sort((a, b) => b[1] - a[1]).slice(0, n || 99);
  }
  // glosa breve de un lema: la traducción de su infinitivo de presente (verbos) o de su nominativo singular (nombres);
  // si no la hay, la más frecuente
  function glosaBreve(li) {
    const rows = T.LP[li] || [];
    const pick = (f) => { let best = null; for (const r of rows) if (r[3] && f(T.P[r[1]] || {}) && (!best || r[2] > best[2])) best = r; return best ? T.TR[best[3]] : ""; };
    const g = claseLema(li) === "V" ? pick((m) => m.mood === "N" && m.tense === "P") || pick((m) => m.mood === "N") || pick((m) => m.mood === "I" && m.tense === "P")
      : pick((m) => m.case === "N" && m.number === "S" && m.gender !== "F" && m.gender !== "N") || pick((m) => m.case === "N" && m.number === "S") || pick((m) => m.case === "N");
    if (g) return g;
    const f = glosasLema(li, 1)[0]; return f ? T.TR[f[0]] : "";
  }
  function claseLema(li) {
    const c = new Map(); for (const r of T.LP[li] || []) { const k = T.MC[r[1]]; c.set(k, (c.get(k) || 0) + r[2]); }
    let best = "", bn = -1; for (const [k, n] of c) if (n > bn) { best = k; bn = n; } return best;
  }
  function textoFormacion(s) {
    const out = []; let k = 0; s = String(s);
    for (const m of s.matchAll(/\{(\d+)\}|\{g:([^}]*)\}|\{h:([^}]*)\}/g)) {
      if (m.index > k) out.push(s.slice(k, m.index));
      if (m[1] != null) out.push(h("a", { class: "fm-l", href: "#/lema/" + m[1], lang: "grc", text: lemaCorto(+m[1]) }));
      else if (m[2] != null) out.push(h("span", { class: "fm-g", lang: "grc", text: m[2] }));
      else out.push(h("bdi", { class: "he fm-h", lang: "he", dir: "rtl", text: m[3] }));
      k = m.index + m[0].length;
    }
    if (k < s.length) out.push(s.slice(k));
    return out;
  }
  // «Raíz y formación»: código Strong, origen (y la palabra hebrea o aramea), composición visible, formación, raíz y familia
  function bloqueRaiz(li, modo, codigo) {
    const r = LX.F[li], fam = LX.fam.get(r) || [li], o = LX.O[li];
    const filas = [];
    const fila = (a, ...x) => filas.push(h("dt", { text: a }), h("dd", {}, ...x));
    const s = codigo || LX.S[li];
    if (s) fila("Código Strong", h("span", { class: "lx-strong", text: strongN(s) }), strongX(s) !== strongN(s) ? h("small", { class: "lx-ext", text: " · extendido " + strongX(s) }) : null);
    if (ORIGEN[o]) fila("Origen", ORIGEN[o], LX.H[li] ? [" · ", h("bdi", { class: "he lx-he", lang: "he", dir: "rtl", text: LX.H[li][0] })] : null);
    const b = LX.B[li], pre = LX.P[li] || [];
    if (b != null) fila("Composición", pre.map((p) => [h("span", { class: "fm-g", lang: "grc", text: p + "-" }), " + "]), h("span", { class: "lx-aud-par" }, h("a", { class: "fm-l", href: "#/lema/" + b, lang: "grc", text: lemaCorto(b) }), botonAudioMini(lemaCorto(b))));
    if (LX.D[li]) fila("Formación", ...textoFormacion(LX.D[li]));
    else if (LX.R[li]) fila("Relacionada con", ...LX.R[li].map((x, k) => [k ? ", " : null, h("a", { class: "fm-l", href: "#/lema/" + x, lang: "grc", text: lemaCorto(x) })]));
    if (modo !== "raiz") fila("Raíz", h("span", { class: "lx-aud-par" }, h("a", { class: "fm-l", href: "#/raiz/" + r, lang: "grc", text: lemaCorto(r) }), botonAudioMini(lemaCorto(r))), fam.length > 1 ? " · familia de " + fmt(fam.length) + " palabras" : " · única de su familia en la Nueva Voluntad");
    const otros = modo === "raiz" ? [] : fam.filter((x) => x !== li).slice(0, modo === "lema" ? 24 : 8);
    const vocFam = [];
    if (modo !== "raiz" && r != null) vocFam.push({ f: lemaCorto(r), tl: tlCorta(r) });
    if (b != null && b !== r) vocFam.push({ f: lemaCorto(b), tl: tlCorta(b) });
    for (const x of otros) vocFam.push({ f: lemaCorto(x), tl: tlCorta(x) });
    const cajonFam = vocFam.length > 1 ? cajonAudioFormas(vocFam, "Escuchar pronunciación de la raíz y su familia") : null;
    return [h("dl", { class: "dl" }, filas),
      otros.length ? h("div", { class: "chips lx-fam" }, otros.map((x) => { const g = glosaBreve(x); return h("a", { class: "chip lx-chip", href: "#/lema/" + x, title: g }, h("span", { lang: "grc", text: lemaCorto(x) }), g ? h("small", { text: g }) : null); }),
        fam.length - 1 > otros.length ? h("a", { class: "chip lx-mas", href: "#/raiz/" + r, text: "+" + fmt(fam.length - 1 - otros.length) }) : null) : null,
      cajonFam,
      h("p", { class: "nota-ui lx-fuente", text: "Formación según el diccionario de Strong (1890): algunas derivaciones antiguas son discutidas." }),
      credPleg("Códigos Strong extendidos: ", h("a", { href: "https://github.com/STEPBible/STEPBible-Data", target: "_blank", rel: "noopener", text: "TAGNT de STEPBible.org" }), " (Tyndale House, Cambridge; CC BY 4.0). Formación: Strong's Exhaustive Concordance [Concordancia Exhaustiva de Strong] (James Strong, 1890; datos de Open Scriptures [Escrituras Abiertas], CC BY-SA).")];
  }
  // Apariciones por libro en el orden en que se escribieron los libros (datación temprana)
  const fechaCorta = (b) => { const f = fechaEscrito(b); return f ? "c. " + f.replace(/^c\. /, "") + (/H\.D\./.test(f) ? "" : " " + ERA_D) : ""; };
  // «A lo largo del tiempo» (BiEx, 13-nov-2026): como la franja de la biblioteca, al pasar el dedo o el puntero se resalta cada
  // libro con un visor (nombre, fecha de escritura y veces); al soltar se eligen sus apariciones. Fuera de la tira, cancela.
  function tiraTiempo(pares, alTocar) {
    const orden = CRONO && CRONO.ordenes && CRONO.ordenes.escritura ? CRONO.ordenes.escritura.map(libroDe).filter(Boolean) : D.libros;
    const m = new Map(pares.map(([bi, n]) => [D.libros[bi].c, n]));
    const max = Math.max(1, ...pares.map((p) => p[1]));
    const primero = orden.find((b) => m.get(b.c));
    const vecesDe = (n) => n ? fmt(n) + (n === 1 ? " vez" : " veces") : "no aparece";
    const barras = orden.map((b) => {
      const n = m.get(b.c) || 0, et = (b.t || b.n) + (fechaCorta(b) ? " · " + fechaCorta(b) : "") + " · " + vecesDe(n);
      return h("button", { type: "button", class: "tt-c" + (n ? "" : " cero"), title: et, "aria-label": et, disabled: n ? null : true, style: "--a:" + (n ? (0.2 + 0.8 * Math.sqrt(n / max)).toFixed(3) : "0"), onclick: (e) => { if (e.detail === 0 && alTocar) alTocar(b.c); } }, h("i"));
    });
    const tira = h("div", { class: "tt-tira" }, barras);
    const visor = h("div", { class: "tt-visor", "aria-hidden": "true" });
    const caja = h("div", { class: "tt-caja" }, visor, tira);
    let activo = -1, arr = null;
    const pintar = (i) => {
      const b = orden[i], n = m.get(b.c) || 0;
      visor.replaceChildren(h("b", { text: b.t || b.n }), h("small", { text: [tradQ(b), fechaCorta(b), vecesDe(n)].filter(Boolean).join(" · ") }));
      const r = tira.getBoundingClientRect(), t = barras[i].getBoundingClientRect(), ancho = visor.offsetWidth || 200, centro = t.left + t.width / 2 - r.left;
      const izq = Math.max(0, Math.min(r.width - ancho, centro - ancho / 2));
      visor.style.left = izq + "px"; visor.style.setProperty("--flecha", Math.max(12, Math.min(ancho - 12, centro - izq)) + "px");
    };
    const mostrar = (i) => {
      if (i < 0 || i === activo) return;
      if (activo >= 0) barras[activo].classList.remove("activo");
      activo = i; barras[i].classList.add("activo"); caja.classList.add("con-visor"); pintar(i);
      if (arr && arr.movido && navigator.vibrate) { try { navigator.vibrate(3); } catch (e) { /* sin vibración */ } }
    };
    const ocultar = () => { if (activo >= 0) barras[activo].classList.remove("activo"); activo = -1; caja.classList.remove("con-visor", "cancelar"); };
    const indice = (x) => { for (let i = 0; i < barras.length; i++) { const r = barras[i].getBoundingClientRect(); if (x >= r.left - 1.5 && x < r.right + 1.5) return i; } const r = tira.getBoundingClientRect(); return x < r.left ? 0 : x >= r.right ? barras.length - 1 : -1; };
    tira.addEventListener("pointerdown", (e) => { if (e.pointerType === "mouse" && e.button !== 0) return; arr = { x: e.clientX, y: e.clientY, movido: false }; try { tira.setPointerCapture(e.pointerId); } catch (er) { /* sin captura */ } mostrar(indice(e.clientX)); });
    tira.addEventListener("pointermove", (e) => {
      if (arr) { if (Math.abs(e.clientX - arr.x) > 6) arr.movido = true; const fuera = Math.abs(e.clientY - arr.y) > 70; caja.classList.toggle("cancelar", fuera); if (!fuera) mostrar(indice(e.clientX)); }
      else if (e.pointerType === "mouse") mostrar(indice(e.clientX));
    });
    tira.addEventListener("pointerup", (e) => {
      if (!arr) return;
      const fuera = Math.abs(e.clientY - arr.y) > 70, i = activo; arr = null;
      if (!fuera && i >= 0 && (m.get(orden[i].c) || 0) && alTocar) { const c = orden[i].c; setTimeout(ocultar, 160); alTocar(c); } else ocultar();
    });
    tira.addEventListener("pointercancel", () => { arr = null; ocultar(); });
    tira.addEventListener("pointerleave", (e) => { if (!arr && e.pointerType === "mouse") ocultar(); });
    return h("div", { class: "tt" }, caja,
      h("div", { class: "tt-ejes" }, h("span", { text: orden[0] ? fechaCorta(orden[0]) : "" }), h("span", { text: orden.length ? fechaCorta(orden[orden.length - 1]) : "" })),
      primero ? h("p", { class: "nota-ui", text: "Por fecha de escritura, aparece primero en " + (primero.t || primero.n) + (fechaCorta(primero) ? " (" + fechaCorta(primero) + ")" : "") + ". Pasa el dedo por la tira para ver cada libro; al soltar, se muestran sus apariciones." }) : null);
  }
  // Tabla de formas: el paradigma con las formas que de verdad aparecen (tiempo, modo y voz; persona y número; caso, número y género)
  const VOZ_L = { A: "activa", M: "media", D: "media", P: "pasiva", O: "pasiva", E: "media o pasiva", N: "media o pasiva" };
  const ORD_T = "PIFARL", ORD_M = "ISOMNPR";
  function tablaFormas(li) {
    const rows = (T.LP[li] || []).map((r) => ({ f: r[0], mi: r[1], n: r[2], tr: r[3], m: T.P[r[1]] || {} }));
    const celda = (xs) => xs.length ? xs.sort((a, b) => b.n - a.n).map((x) => {
      const fTxt = T.F[x.f];
      const sp = h("span", {
        class: "tf-f tf-aud", role: "button", tabindex: "0",
        title: (x.tr ? T.TR[x.tr] + " · " : "") + fmt(x.n) + (x.n === 1 ? " vez" : " veces") + " · toca para escuchar en koiné s. I",
        "aria-label": "Escuchar " + fTxt + " en griego koiné s. I",
        onclick: (e) => {
          e.stopPropagation();
          const ya = sp.classList.contains("sonando");
          KOINE_S1.parar();
          if (ya) return;
          sp.classList.add("sonando");
          KOINE_S1.hablar(fTxt, { alFin: () => sp.classList.remove("sonando") });
        },
        onkeydown: (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); sp.click(); } },
      }, spanGk(fTxt), h("small", { text: fmt(x.n) }));
      return sp;
    }) : h("span", { class: "tf-no", text: "·" });
    const nominal = (xs) => {
      const gens = ["M", "F", "N"].filter((g) => xs.some((x) => x.m.gender === g));
      const cols = [];
      for (const nn of ["S", "P"]) { if (!xs.some((x) => x.m.number === nn)) continue; if (gens.length > 1) for (const g of gens) cols.push([nn, g]); else cols.push([nn, ""]); }
      const casos = ["N", "G", "D", "A", "V"].filter((c) => xs.some((x) => x.m.case === c));
      return h("div", { class: "tf-scroll" }, h("table", { class: "tf" },
        h("thead", {}, h("tr", {}, h("th"), cols.map(([nn, g]) => h("th", { text: (nn === "S" ? "singular" : "plural") + (g ? " " + ABG[g] : "") })))),
        h("tbody", {}, casos.map((c) => h("tr", {}, h("th", { text: CASO[c] }), cols.map(([nn, g]) => h("td", {}, celda(xs.filter((x) => x.m.case === c && x.m.number === nn && (!g || x.m.gender === g))))))))));
    };
    const secs = [];
    const V = rows.filter((x) => x.m.pos === "V");
    if (V.length) {
      const g = new Map();
      for (const x of V) { const k = x.m.mood + x.m.tense + (x.m.second ? "2" : "") + (VOZ_L[x.m.voice] || ""); if (!g.has(k)) g.set(k, []); g.get(k).push(x); }
      const ks = [...g.keys()].sort((a, b) => ORD_M.indexOf(a[0]) - ORD_M.indexOf(b[0]) || ORD_T.indexOf(a[1]) - ORD_T.indexOf(b[1]) || a.localeCompare(b));
      for (const k of ks) {
        const xs = g.get(k), m = xs[0].m;
        const tit = mayus1([TIEMPO[m.tense], m.second ? "segundo" : "", MODO[m.mood], VOZ_L[m.voice] ? "· voz " + VOZ_L[m.voice] : ""].filter(Boolean).join(" "));
        let cuerpo;
        if (m.mood === "N") cuerpo = h("div", { class: "tf-lista" }, celda(xs));
        else if (m.mood === "P" || m.mood === "R") cuerpo = nominal(xs);
        else {
          const pn = (p, nn) => celda(xs.filter((x) => x.m.person === p && x.m.number === nn));
          const pers = ["1", "2", "3"].filter((p) => xs.some((x) => x.m.person === p));
          cuerpo = h("div", { class: "tf-scroll" }, h("table", { class: "tf" }, h("thead", {}, h("tr", {}, h("th"), h("th", { text: "singular" }), h("th", { text: "plural" }))),
            h("tbody", {}, pers.map((p) => h("tr", {}, h("th", { text: p + ".ª persona" }), h("td", {}, pn(p, "S")), h("td", {}, pn(p, "P")))))));
        }
        secs.push(h("section", { class: "tf-sec" }, h("h3", { text: tit }), cuerpo));
      }
    }
    const N = rows.filter((x) => x.m.pos !== "V" && x.m.case);
    if (N.length) secs.push(h("section", { class: "tf-sec" }, V.length ? h("h3", { text: "Formas declinadas" }) : null, nominal(N)));
    const O = rows.filter((x) => x.m.pos !== "V" && !x.m.case);
    if (O.length) secs.push(h("section", { class: "tf-sec" }, (V.length || N.length) ? h("h3", { text: "Formas invariables" }) : null, h("div", { class: "tf-lista" }, celda(O))));
    const cajon = cajonAudioFormas(rows.map((x) => ({ f: T.F[x.f], tl: T.FT[x.f] || "" })), "Escuchar pronunciación de sus formas");
    if (cajon) secs.push(cajon);
    return secs;
  }
  // Pronunciación (AFI): koiné del siglo I, reconstruida, y erasmiana (la de la enseñanza académica en español);
  // ˈ va antes de la sílaba tónica. Reglas generales de la lectura griega (los nombres hebreos se leen igual en griego).
  const PR_V = "αεηιουω";
  function pronunciar(forma) {
    const L = [];
    for (const ch of String(forma || "").normalize("NFD")) {
      const cp = ch.codePointAt(0);
      if (cp >= 0x300 && cp <= 0x36f) { const u = L[L.length - 1]; if (u) { if (cp === 0x301 || cp === 0x300 || cp === 0x342) u.t = 1; else if (cp === 0x314) u.a = 1; else if (cp === 0x308) u.d = 1; } continue; }
      const c = ch.toLowerCase();
      if (c === "ς") L.push({ c: "σ" }); else if (/[α-ω]/.test(c)) L.push({ c });
    }
    const U = [];
    const sorda = (x) => !x || "θκξπστφχψ".includes(x.c);
    const anterior = (j) => { const x = L[j], y = L[j + 1]; if (!x) return false; if ("εηιυ".includes(x.c)) return !(x.c === "υ" && false); if ((x.c === "α" || x.c === "ο") && y && y.c === "ι" && !y.d) return true; return false; };
    for (let i = 0; i < L.length; i++) {
      const x = L[i], n = L[i + 1];
      if (PR_V.includes(x.c)) {
        const dg = n && PR_V.includes(n.c) && !n.d ? x.c + n.c : "";
        // Koiné del siglo I (Allen, Buth, Horrocks, Gignac): el espíritu áspero inicial /h/ todavía se articula
        if (i === 0 && (x.a || (dg && n.a))) U.push({ k: "h", e: "h", c: "h" });
        if (["αι", "ει", "οι", "υι", "ου"].includes(dg)) {
          U.push({ k: { αι: "ɛ", ει: "i", οι: "y", υι: "yi", ου: "u" }[dg], e: { αι: "ai̯", ει: "ei̯", οι: "oi̯", υι: "yi̯", ου: "uː" }[dg], v: 1, t: x.t || n.t }); i++; continue;
        }
        if (["αυ", "ευ", "ηυ"].includes(dg)) {
          U.push({ k: { αυ: "a", ευ: "ɛ", ηυ: "e̝" }[dg], e: { αυ: "au̯", ευ: "eu̯", ηυ: "eːu̯" }[dg], v: 1, t: x.t || n.t });
          U.push({ k: sorda(L[i + 2]) ? "ɸ" : "β", e: "", c: "υ" }); i++; continue;
        }
        U.push({ k: { α: "a", ε: "ɛ", η: "e̝", ι: "i", ο: "o", υ: "y", ω: "o" }[x.c], e: { α: "a", ε: "e", η: "eː", ι: "i", ο: "o", υ: "y", ω: "oː" }[x.c], v: 1, t: x.t });
        continue;
      }
      const sig = n ? n.c : "";
      let K = "", E = "";
      switch (x.c) {
        case "β": K = "β"; E = "b"; break;
        case "γ": if (sig && "γκξχ".includes(sig)) { K = E = "ŋ"; } else { K = anterior(i + 1) ? "ʝ" : "ɣ"; E = "g"; } break;
        case "δ": K = "ð"; E = "d"; break;
        case "ζ": K = "z"; E = "dz"; break;
        case "θ": K = E = "θ"; break;
        case "κ": K = E = "k"; break;
        case "λ": K = E = "l"; break;
        case "μ": K = E = "m"; break;
        case "ν": K = E = "n"; break;
        case "ξ": K = E = "ks"; break;
        case "π": K = E = "p"; break;
        case "ρ": K = i === 0 && x.a ? "r̥" : "r"; E = i === 0 && x.a ? "rʰ" : "r"; break;
        case "σ": K = sig && "βγδμνρ".includes(sig) ? "z" : "s"; E = "s"; break;
        case "τ": K = E = "t"; break;
        case "φ": K = "ɸ"; E = "f"; break;
        case "χ": K = anterior(i + 1) ? "ç" : "x"; E = "x"; break;
        case "ψ": K = E = "ps"; break;
      }
      U.push({ k: K, e: E, c: x.c });
    }
    // la consonante (o el grupo que puede empezar palabra) que precede a la vocal tónica va con ella
    const INI = /^([πκτβγδθφχ][λρνμ]|σ[τκπθφχμ]|κτ|πτ|φθ|χθ|βδ|μν|γν|κν|πν|θν|τμ|δμ)$/;
    const marcar = (campo) => {
      const nuc = U.map((u, k) => (u.v ? k : -1)).filter((k) => k >= 0);
      const kt = nuc.find((k) => U[k].t);
      let ini = -1;
      if (kt != null && nuc.length > 1) {
        const j = nuc.filter((k) => k < kt).pop();
        if (j == null) ini = 0;
        else {
          const cs = []; for (let k = j + 1; k < kt; k++) if (U[k][campo]) cs.push(k);
          if (!cs.length) ini = kt;
          else if (cs.length === 1) ini = cs[0];
          else ini = INI.test(U[cs[cs.length - 2]].c + U[cs[cs.length - 1]].c) ? cs[cs.length - 2] : cs[cs.length - 1];
        }
      }
      return U.map((u, k) => (k === ini ? "ˈ" : "") + (u[campo] || "")).join("");
    };
    return { k: marcar("k"), e: marcar("e") };
  }
  // W14 / M14 (BiEx, 11 y 13-nov-2026): la lectura BiEx para hispanohablantes junto a las académicas. Es la transliteración
  // de BiEx (Prompt B, sistema mixto) partida en sílabas, con la tónica resaltada; un aviso discreto explica de dónde vienen
  // las pronunciaciones académicas. Las sílabas se cortan con las mismas reglas de la lectura griega de arriba.
  function silabasBiEx(tl) {
    const s = String(tl || "").normalize("NFD");
    // unidades: letra base + sus marcas combinantes; dígrafos de una sola consonante: ds (θ), ps (ψ), c̅ṣ (ξ), ῾h (espíritu áspero)
    const U = [];
    for (let i = 0; i < s.length; ) {
      let ch = s[i], j = i + 1;
      while (j < s.length && /[̀-ͯͅ]/.test(s[j])) j++;
      let u = { t: s.slice(i, j), b: ch.toLowerCase() };
      const sig = s[j];
      if ((u.b === "d" || u.b === "p") && sig === "s") { let k = j + 1; while (k < s.length && /[̀-ͯ]/.test(s[k])) k++; u = { t: s.slice(i, k), b: u.b === "d" ? "θ" : "ψ" }; j = k; }
      else if (u.b === "c" && /̅/.test(u.t) && sig && sig.toLowerCase() === "s") { let k = j + 1; while (k < s.length && /[̀-ͯ]/.test(s[k])) k++; u = { t: s.slice(i, k), b: "ξ" }; j = k; }
      else if (ch === "῾" && sig && sig.toLowerCase() === "h") { u = { t: s.slice(i, j + 1), b: "h" }; j = j + 1; }
      else if (ch === "ʼ") { u = { t: ch, b: "'" }; }
      U.push(u); i = j;
    }
    const VOC = "αειουaeiou";
    const esV = (u) => VOC.includes(u.b);
    const acento = (u) => /[́̀͂̂]/.test(u.t);
    const diere = (u) => /̈/.test(u.t);
    // núcleos: vocal o diptongo (αι ει οι υι αυ ευ ου ηυ; la segunda sin diéresis)
    const N = [];
    for (let k = 0; k < U.length; k++) {
      if (!esV(U[k])) continue;
      const n = U[k + 1];
      if (n && esV(n) && !diere(n) && ((n.b === "ι" && "αεουae".includes(U[k].b) && !(U[k].b === "υ")) || (n.b === "ι" && U[k].b === "υ") || (n.b === "υ" && "αεοe".includes(U[k].b))) && !acento(U[k]) ) { N.push([k, k + 1]); k++; continue; }
      N.push([k, k]);
    }
    if (N.length < 2) return [{ t: U.map((u) => u.t).join("").normalize("NFC"), ton: N.length === 1 }];
    // grupos que pueden empezar palabra van con la vocal siguiente
    const G = { p: "π", k: "κ", κ: "κ", t: "τ", τ: "τ", b: "β", β: "β", g: "γ", ŋ: "γ", δ: "δ", d: "δ", θ: "θ", f: "φ", χ: "χ", l: "λ", r: "ρ", n: "ν", m: "μ", s: "σ", ς: "σ", ζ: "ζ", ξ: "ξ", ψ: "ψ", h: "h" };
    const INI = /^([πκτβγδθφχ][λρνμ]|σ[τκπθφχμ]|κτ|πτ|φθ|χθ|βδ|μν|γν|κν|πν|θν|τμ|δμ)$/;
    const cortes = [];
    for (let q = 1; q < N.length; q++) {
      const a = N[q - 1][1] + 1, z = N[q][0];
      const cons = []; for (let k = a; k < z; k++) if (U[k].b !== "'") cons.push(k);
      if (!cons.length) { cortes.push(z); continue; }
      if (cons.length === 1) { cortes.push(cons[0]); continue; }
      const c1 = G[U[cons[cons.length - 2]].b] || "", c2 = G[U[cons[cons.length - 1]].b] || "";
      cortes.push(INI.test(c1 + c2) ? cons[cons.length - 2] : cons[cons.length - 1]);
    }
    const sil = []; let ini = 0;
    for (const c of cortes) { sil.push([ini, c]); ini = c; }
    sil.push([ini, U.length]);
    let tonica = -1;
    sil.forEach(([a, z], i) => { if (tonica < 0) for (let k = a; k < z; k++) if (esV(U[k]) && acento(U[k])) { tonica = i; break; } });
    return sil.map(([a, z], i) => ({ t: U.slice(a, z).map((u) => u.t).join("").normalize("NFC"), ton: i === tonica }));
  }
  let MAPA_TL = null;
  const tlDe = (forma) => {
    if (!T || !T.F || !T.FT) return "";
    if (!MAPA_TL) { MAPA_TL = new Map(); T.F.forEach((f, i) => MAPA_TL.set(f, T.FT[i])); (T.L || []).forEach((l, i) => { const k = String(l).split(/,\s*/)[0]; if (!MAPA_TL.has(k) && T.LT) MAPA_TL.set(k, String(T.LT[i] || "").split(",")[0]); }); }
    return MAPA_TL.get(forma) || "";
  };
  // PR #19 · Motor fonológico y sintetizador acústico Klatt de griego koiné histórico del siglo I d.H.D. (100 % local en Web Audio API)
  // Basado en el consenso histórico-filológico de W. S. Allen (Vox Graeca), R. Buth (Imperial Koine), G. Horrocks y F. Gignac:
  // conserva espíritu áspero /h/, η cerrada alta /e̝/, υ/οι anterior redondeada /y/, ε/αι /ɛ/, ει/ι /i/, ο/ω /o/, ου /u/,
  // β /β/, φ /ɸ/, δ /ð/, θ /θ/, γ /ɣ,ʝ,ŋ/, χ /x,ç/, ζ /z/, σ sonora ante βγδμνρ, geminadas y acento dinámico de intensidad.
  const KOINE_S1 = (() => {
    const INI = /^([πκτβγδθφχ][λρνμ]|σ[τκπθφχμ]|κτ|πτ|φθ|χθ|βδ|μν|γν|κν|πν|θν|τμ|δμ)$/;
    const F_TAB = {
      a:  { tipo: "v", dur: 0.098, f: [730, 1180, 2520, 3450], bw: [85, 110, 150, 220], amp: 1.00 },
      "ɛ":{ tipo: "v", dur: 0.094, f: [540, 1840, 2560, 3500], bw: [75, 105, 150, 220], amp: 0.96 },
      "e̝":{ tipo: "v", dur: 0.104, f: [360, 2180, 2760, 3620], bw: [65, 95, 145, 210],  amp: 0.95 },
      i:  { tipo: "v", dur: 0.092, f: [275, 2320, 2980, 3720], bw: [60, 90, 145, 210],  amp: 0.90 },
      o:  { tipo: "v", dur: 0.098, f: [470, 860, 2460, 3380],  bw: [75, 95, 150, 220],  amp: 0.96 },
      y:  { tipo: "v", dur: 0.096, f: [285, 1840, 2260, 3400], bw: [65, 95, 140, 210],  amp: 0.90 },
      u:  { tipo: "v", dur: 0.102, f: [315, 790, 2320, 3320],  bw: [65, 90, 145, 210],  amp: 0.90 },
      j:  { tipo: "s", dur: 0.056, f: [270, 2260, 2940, 3680], bw: [65, 95, 150, 210],  amp: 0.72 },
      l:  { tipo: "s", dur: 0.068, f: [360, 1340, 2680, 3550], bw: [80, 125, 170, 230], amp: 0.66 },
      m:  { tipo: "n", dur: 0.072, f: [260, 1020, 2240, 3250], bw: [65, 140, 180, 240], amp: 0.56 },
      n:  { tipo: "n", dur: 0.068, f: [265, 1480, 2520, 3380], bw: [65, 140, 180, 240], amp: 0.58 },
      "ŋ":{ tipo: "n", dur: 0.070, f: [255, 1180, 2360, 3280], bw: [65, 150, 190, 240], amp: 0.55 },
      r:  { tipo: "r", dur: 0.076, f: [410, 1420, 2380, 3420], bw: [85, 135, 175, 230], amp: 0.68 },
      "r̥":{ tipo: "rh", dur: 0.090, f: [420, 1460, 2420, 3420], bw: [95, 145, 185, 230], amp: 0.62, fn: 2200, qn: 1.6 },
      h:  { tipo: "f", dur: 0.064, voz: 0, fn: 1650, qn: 1.1, amp: 0.30 },
      s:  { tipo: "f", dur: 0.088, voz: 0, fn: 5400, qn: 2.6, amp: 0.40 },
      z:  { tipo: "f", dur: 0.082, voz: 1, fn: 4800, qn: 2.4, amp: 0.36, f: [300, 1650, 2550, 3480] },
      "θ":{ tipo: "f", dur: 0.082, voz: 0, fn: 3600, qn: 1.4, amp: 0.25 },
      "ð":{ tipo: "f", dur: 0.072, voz: 1, fn: 3100, qn: 1.4, amp: 0.32, f: [310, 1580, 2500, 3450] },
      "ɸ":{ tipo: "f", dur: 0.080, voz: 0, fn: 2450, qn: 1.2, amp: 0.26 },
      "β":{ tipo: "f", dur: 0.070, voz: 1, fn: 1850, qn: 1.2, amp: 0.36, f: [300, 1120, 2320, 3320] },
      x:  { tipo: "f", dur: 0.084, voz: 0, fn: 1750, qn: 1.9, amp: 0.32 },
      "ç":{ tipo: "f", dur: 0.080, voz: 0, fn: 3150, qn: 2.1, amp: 0.30 },
      "ɣ":{ tipo: "f", dur: 0.072, voz: 1, fn: 1550, qn: 1.7, amp: 0.38, f: [320, 1220, 2340, 3320] },
      "ʝ":{ tipo: "f", dur: 0.070, voz: 1, fn: 2750, qn: 1.9, amp: 0.40, f: [290, 2120, 2860, 3580] },
      p:  { tipo: "p", dur: 0.074, fn: 1150, qn: 1.3, amp: 0.44, vot: 0.015 },
      t:  { tipo: "p", dur: 0.072, fn: 3450, qn: 1.8, amp: 0.48, vot: 0.017 },
      k:  { tipo: "p", dur: 0.078, fn: 2150, qn: 2.0, amp: 0.46, vot: 0.022 },
    };
    const analizar = (forma) => {
      const texto = String(forma || "").split(/[,·;()[\]]/)[0].trim();
      const L = [];
      for (const ch of texto.normalize("NFD")) {
        const cp = ch.codePointAt(0);
        if (cp >= 0x300 && cp <= 0x36f) {
          const u = L[L.length - 1];
          if (u) {
            if (cp === 0x301 || cp === 0x300 || cp === 0x342) u.t = 1;
            else if (cp === 0x314) u.a = 1;
            else if (cp === 0x308) u.d = 1;
          }
          continue;
        }
        const c = ch.toLowerCase();
        if (c === "ς") L.push({ c: "σ" });
        else if (/[α-ω]/.test(c)) L.push({ c });
      }
      const U = [];
      const sorda = (x) => !x || "θκξπστφχψ".includes(x.c);
      const ant = (j) => {
        const x = L[j], y = L[j + 1];
        if (!x) return false;
        if ("εηιυ".includes(x.c)) return true;
        if ((x.c === "α" || x.c === "ο") && y && y.c === "ι" && !y.d) return true;
        return false;
      };
      for (let i = 0; i < L.length; i++) {
        const x = L[i], n = L[i + 1];
        if (PR_V.includes(x.c)) {
          const dg = n && PR_V.includes(n.c) && !n.d ? x.c + n.c : "";
          if (i === 0 && (x.a || (dg && n.a))) U.push({ ph: "h", c: "h" });
          if (["αι", "ει", "οι", "ου"].includes(dg)) {
            U.push({ ph: { αι: "ɛ", ει: "i", οι: "y", ου: "u" }[dg], v: 1, t: !!(x.t || n.t), c: dg });
            i++; continue;
          }
          if (dg === "υι") {
            U.push({ ph: "y", v: 1, t: !!(x.t || n.t), c: "υι" });
            U.push({ ph: "j", c: "ι" });
            i++; continue;
          }
          if (["αυ", "ευ", "ηυ"].includes(dg)) {
            U.push({ ph: { αυ: "a", ευ: "ɛ", ηυ: "e̝" }[dg], v: 1, t: !!(x.t || n.t), c: dg });
            U.push({ ph: sorda(L[i + 2]) ? "ɸ" : "β", c: "υ" });
            i++; continue;
          }
          U.push({ ph: { α: "a", ε: "ɛ", η: "e̝", ι: "i", ο: "o", υ: "y", ω: "o" }[x.c], v: 1, t: !!x.t, c: x.c });
          continue;
        }
        const sig = n ? n.c : "";
        if (x.c === "ξ") { U.push({ ph: "k", c: "ξ" }, { ph: "s", c: "ξ" }); continue; }
        if (x.c === "ψ") { U.push({ ph: "p", c: "ψ" }, { ph: "s", c: "ψ" }); continue; }
        let ph = "";
        switch (x.c) {
          case "β": ph = "β"; break;
          case "γ": ph = (sig && "γκξχ".includes(sig)) ? "ŋ" : (ant(i + 1) ? "ʝ" : "ɣ"); break;
          case "δ": ph = "ð"; break;
          case "ζ": ph = "z"; break;
          case "θ": ph = "θ"; break;
          case "κ": ph = "k"; break;
          case "λ": ph = "l"; break;
          case "μ": ph = "m"; break;
          case "ν": ph = "n"; break;
          case "π": ph = "p"; break;
          case "ρ": ph = (i === 0 && x.a) ? "r̥" : "r"; break;
          case "σ": ph = (sig && "βγδμνρ".includes(sig)) ? "z" : "s"; break;
          case "τ": ph = "t"; break;
          case "φ": ph = "ɸ"; break;
          case "χ": ph = ant(i + 1) ? "ç" : "x"; break;
        }
        if (ph) {
          // Geminación real del griego koiné s. I (λλ, μμ, νν, ρρ, σσ, ππ, ττ, κκ)
          const ult = U[U.length - 1];
          if (ult && !ult.v && ult.ph === ph && ult.c === x.c && !ult.gem) { ult.gem = true; continue; }
          U.push({ ph, c: x.c });
        }
      }
      // División silábica paralela a la ortografía griega para iluminar cada sílaba al sonar
      const nucs = U.map((u, idx) => (u.v ? idx : -1)).filter((k) => k >= 0);
      const silabas = [];
      if (!nucs.length) {
        if (U.length) silabas.push({ fons: U, ton: false });
      } else {
        const cortes = [0];
        for (let q = 1; q < nucs.length; q++) {
          const a = nucs[q - 1] + 1, z = nucs[q];
          const cs = [];
          for (let k = a; k < z; k++) cs.push(k);
          if (!cs.length) cortes.push(z);
          else if (cs.length === 1) cortes.push(cs[0]);
          else cortes.push(INI.test((U[cs[cs.length - 2]].c || "") + (U[cs[cs.length - 1]].c || "")) ? cs[cs.length - 2] : cs[cs.length - 1]);
        }
        cortes.push(U.length);
        for (let q = 0; q < cortes.length - 1; q++) {
          const fons = U.slice(cortes[q], cortes[q + 1]);
          silabas.push({ fons, ton: fons.some((x) => x.t) });
        }
      }
      if (silabas.length === 1 && !silabas[0].ton) silabas[0].ton = true;
      return { fonemas: U, silabas, afi: silabas.map((s) => (s.ton && silabas.length > 1 ? "ˈ" : "") + s.fons.map((f) => f.ph + (f.gem ? "ː" : "")).join("")).join("") };
    };

    let ac = null, fuenteAct = null, timersAct = [], finAct = null;
    const cache = new Map();
    const asegurarCtx = () => {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      if (!ac) ac = new AC();
      if (ac.state === "suspended") ac.resume().catch(() => {});
      return ac;
    };
    let sesionId = 0, ultInfo = null;
    const parar = () => {
      sesionId++;
      for (const id of timersAct) clearTimeout(id);
      timersAct = [];
      if (fuenteAct) { try { fuenteAct.onended = null; fuenteAct.stop(); fuenteAct.disconnect(); } catch (e) {} fuenteAct = null; }
      if (finAct) { const fn = finAct; finAct = null; try { fn(); } catch (e) {} }
    };
    const esSonoro = (sp) => !!sp && (sp.tipo === "v" || sp.tipo === "s" || sp.tipo === "n" || sp.tipo === "r" || sp.tipo === "rh" || (sp.tipo === "f" && !!sp.voz));
    const LOCUS_P = { p: [280, 780, 2150, 3250], t: [320, 1780, 2650, 3480], k: [300, 2080, 2480, 3380] };
    // PR #20 · Sintetizador acústico continuo de palabra completa en griego koiné s. I:
    // coarticulación cúbica sin cortes entre fonemas sonoros, fuente glotal LF cálida con micro-aliento y filtro labial natural.
    const sintetizar = (ctx, forma, lento) => {
      const clave = String(forma || "") + (lento ? "|0v2" : "|1v2");
      if (cache.has(clave)) {
        const hit = cache.get(clave);
        cache.delete(clave); cache.set(clave, hit);
        return hit;
      }
      const an = analizar(forma);
      const sr = ctx ? ctx.sampleRate : 24000;
      const esc = lento ? 1.38 : 0.96;
      const segs = [];
      const marcas = [];
      let tAcc = 0.025;
      const nSil = an.silabas.length;
      const idxTon = Math.max(0, an.silabas.findIndex((s) => s.ton));
      for (let si = 0; si < nSil; si++) {
        const sil = an.silabas[si];
        const tIniSil = tAcc;
        for (let fi = 0; fi < sil.fons.length; fi++) {
          const item = sil.fons[fi];
          const spec = F_TAB[item.ph] || F_TAB.a;
          let d = spec.dur * esc;
          if (spec.tipo === "v") {
            if (sil.ton) d *= 1.24;
            if (si === nSil - 1) d *= 1.15;
          } else if (item.gem) {
            d *= 1.5;
          } else if (spec.tipo === "p") {
            d *= 0.88;
          }
          segs.push({ ph: item.ph, spec, t0: tAcc, dur: d, ton: sil.ton, si, gem: !!item.gem, son: esSonoro(spec) });
          tAcc += d;
        }
        marcas.push({ si, t0: tIniSil, t1: tAcc });
      }
      const durTot = Math.max(0.24, tAcc + 0.13);
      const nM = Math.ceil(durTot * sr);
      const pcm = new Float32Array(nM);
      const y1 = [0, 0, 0, 0], y2 = [0, 0, 0, 0];
      let ny1 = 0, ny2 = 0, nx1 = 0, nx2 = 0, glotPrev = 0, fase = 0, seed = 2463534242;
      let lpVoz = 0, pechoY1 = 0, pechoY2 = 0, curAmp = 0;
      const rnd = () => { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return ((seed >>> 0) / 4294967296) * 2 - 1; };
      const fBase = 128; // barítono cálido, natural y cercano
      const defF = [490, 1420, 2480, 3420], defBw = [92, 125, 175, 245];
      const primerF = (segs.find((s) => s.spec.f) || {}).spec;
      let curF = (primerF && primerF.f ? primerF.f : defF).slice();
      let curBw = (primerF && primerF.bw ? primerF.bw : defBw).slice();
      const sStep = (x) => { const c = Math.max(0, Math.min(1, x)); return c * c * (3 - 2 * c); };
      const kF = 1 - Math.exp(-1 / (sr * 0.016)); // seguimiento formántico orgánico (~16 ms)
      const kA = 1 - Math.exp(-1 / (sr * 0.012)); // envolvente vocal ligada (~12 ms)
      const kLp = 1 - Math.exp(-2 * Math.PI * 3900 / sr); // calidez labial suave (evita timbre metálico)
      let segIdx = 0;
      for (let i = 0; i < nM; i++) {
        const t = i / sr;
        while (segIdx < segs.length - 1 && t >= segs[segIdx].t0 + segs[segIdx].dur) segIdx++;
        const sg = segs[segIdx];
        if (!sg || t < sg.t0 || t >= sg.t0 + sg.dur) {
          curAmp *= 0.992;
          continue;
        }
        const u = (t - sg.t0) / Math.max(0.001, sg.dur);
        const sp = sg.spec;
        const prv = segs[segIdx - 1] || null;
        const nxt = segs[segIdx + 1] || null;
        // Prosodia orgánica de palabra completa con micro-jitter natural (<0,35 %)
        const progW = Math.max(0, Math.min(1, (t - 0.025) / Math.max(0.14, tAcc - 0.025)));
        const centroTon = nSil > 1 ? (idxTon + 0.48) / nSil : 0.38;
        const picoTon = Math.exp(-Math.pow((progW - centroTon) / 0.31, 2));
        const vibr = 1 + 0.0045 * Math.sin(2 * Math.PI * 4.8 * t) + 0.0022 * rnd();
        const f0 = fBase * (1.03 + 0.16 * picoTon - 0.15 * progW) * vibr;
        fase += f0 / sr;
        if (fase >= 1) fase -= 1;
        // Pulso glotal LF suavizado con aspiración fisiológica leve
        const oq = 0.56;
        const gRaw = fase < oq * 0.72 ? 0.5 * (1 - Math.cos(Math.PI * (fase / (oq * 0.72))))
          : fase < oq ? Math.cos(Math.PI * 0.5 * ((fase - oq * 0.72) / (oq * 0.28))) : 0;
        const dGlot = (gRaw - glotPrev) * 12.6;
        glotPrev = gRaw;
        const glot = dGlot + rnd() * (0.018 + 0.018 * gRaw);

        // Coarticulación bidireccional suave (anticipatoria y regresiva) + locus de oclusivas
        const baseF = sp.f || LOCUS_P[sg.ph] || (nxt && nxt.spec.f) || (prv && prv.spec.f) || defF;
        const prevF = prv ? (prv.spec.f || LOCUS_P[prv.ph] || baseF) : baseF;
        const nextF = nxt ? (nxt.spec.f || LOCUS_P[nxt.ph] || baseF) : baseF;
        const baseBw = sp.bw || defBw;
        const wPrev = u < 0.24 ? (1 - sStep(u / 0.24)) * 0.42 : 0;
        const wNext = u > 0.66 ? sStep((u - 0.66) / 0.34) * 0.48 : 0;
        const wBase = 1 - wPrev - wNext;
        for (let k = 0; k < 4; k++) {
          const mF = prevF[k] * wPrev + baseF[k] * wBase + nextF[k] * wNext;
          curF[k] += (mF - curF[k]) * kF;
          curBw[k] += (baseBw[k] * 1.08 - curBw[k]) * kF;
        }

        // Envolvente de voz LIGADA entre segmentos sonoros (cero cortes entre sílabas ni letras sonoras)
        const conVoz = sp.tipo === "v" || sp.tipo === "s" || sp.tipo === "n" || sp.tipo === "r" || (sp.tipo === "rh" && u > 0.30) || (sp.tipo === "f" && sp.voz);
        let tarAmp = 0;
        if (conVoz) {
          tarAmp = sp.amp * (sg.ton && sp.tipo === "v" ? 1.14 : 1.0);
          if (!prv || !prv.son) {
            const tIn = Math.min(0.024, sg.dur * 0.35);
            if (t - sg.t0 < tIn) tarAmp *= sStep((t - sg.t0) / Math.max(0.004, tIn));
          }
          if (!nxt || !nxt.son) {
            const tOut = Math.min(0.044, sg.dur * 0.42);
            const rem = (sg.t0 + sg.dur) - t;
            if (rem < tOut) tarAmp *= sStep(rem / Math.max(0.005, tOut));
          }
          // Decaimiento prosódico sereno en el cierre de la palabra
          if (progW > 0.84) tarAmp *= 1 - 0.28 * sStep((progW - 0.84) / 0.16);
        }
        curAmp += (tarAmp - curAmp) * kA;

        let vozOut = 0;
        if (curAmp > 0.001) {
          let srcV = glot;
          if (sp.tipo === "r" || sp.tipo === "rh") {
            srcV *= 0.52 + 0.48 * Math.max(0, Math.sin(2 * Math.PI * 26 * (t - sg.t0)));
          }
          const pesos = sp.tipo === "n" ? [1.22, 0.32, 0.20, 0.10] : [1.05, 0.70, 0.42, 0.22];
          for (let k = 0; k < 4; k++) {
            const rad = Math.exp(-Math.PI * curBw[k] / sr);
            const a1 = 2 * rad * Math.cos(2 * Math.PI * curF[k] / sr);
            const a2 = -rad * rad;
            const g0 = 1 - a1 - a2;
            const y = g0 * srcV + a1 * y1[k] + a2 * y2[k];
            y2[k] = y1[k]; y1[k] = y;
            vozOut += y * pesos[k];
          }
          // Resonancia de pecho cálida (~270 Hz) + suavizado labial
          const rP = Math.exp(-Math.PI * 160 / sr), a1P = 2 * rP * Math.cos(2 * Math.PI * 270 / sr), a2P = -rP * rP;
          const pY = (1 - a1P - a2P) * srcV + a1P * pechoY1 + a2P * pechoY2;
          pechoY2 = pechoY1; pechoY1 = pY;
          lpVoz += (vozOut + pY * 0.22 - lpVoz) * kLp;
          vozOut = lpVoz * curAmp;
        }

        let ruiOut = 0;
        const conRuido = sp.tipo === "f" || sp.tipo === "p" || (sp.tipo === "rh" && u <= 0.42);
        if (conRuido) {
          let rEnv = 0;
          if (sp.tipo === "p") {
            const burst = (t - sg.t0) - sg.dur * 0.62;
            if (burst >= 0 && burst <= (sp.vot || 0.018)) rEnv = Math.exp(-burst / 0.0068) * 1.18;
          } else {
            const eIn = u < 0.16 ? sStep(u / 0.16) : 1;
            const eOut = u > 0.82 ? sStep((1 - u) / 0.18) : 1;
            rEnv = Math.min(eIn, eOut) * (sp.tipo === "rh" ? 0.58 : 0.86);
          }
          if (rEnv > 0.002) {
            const w0 = 2 * Math.PI * Math.min(sr * 0.44, sp.fn || 2400) / sr;
            const alpha = Math.sin(w0) / (2 * (sp.qn || 1.6));
            const b0 = alpha, b2 = -alpha, a0 = 1 + alpha, a1 = -2 * Math.cos(w0), a2 = 1 - alpha;
            const xIn = rnd();
            const ny = (b0 * xIn + b2 * nx2 - a1 * ny1 - a2 * ny2) / a0;
            nx2 = nx1; nx1 = xIn; ny2 = ny1; ny1 = ny;
            ruiOut = ny * sp.amp * rEnv * 1.68;
          }
        }
        pcm[i] = Math.tanh((vozOut + ruiOut) * 1.12) * 0.88;
      }
      // Micro-sala cálida natural (reflexiones tempranas 19 ms y 33 ms muy suaves) + normalización limpia
      const d1 = Math.round(sr * 0.019), d2 = Math.round(sr * 0.033);
      for (let i = d2; i < nM; i++) pcm[i] += pcm[i - d1] * 0.08 + pcm[i - d2] * 0.045;
      let pico = 0.001;
      for (let i = 0; i < nM; i++) { const a = Math.abs(pcm[i]); if (a > pico) pico = a; }
      const gan = Math.min(1.45, 0.88 / pico);
      for (let i = 0; i < nM; i++) pcm[i] *= gan;
      const buf = ctx ? ctx.createBuffer(1, nM, sr) : null;
      if (buf) buf.getChannelData(0).set(pcm);
      const res = { buf, pcm, sr, dur: durTot, marcas, afi: an.afi, silabas: an.silabas };
      cache.set(clave, res);
      if (cache.size > 48) cache.delete(cache.keys().next().value);
      return res;
    };
    const hablar = (forma, op = {}) => {
      parar();
      const ctx = asegurarCtx();
      if (!ctx) return null;
      const s = sintetizar(ctx, forma, !!op.lento);
      if (!s || !s.buf) return s;
      const miSes = sesionId;
      const repetir = op.repetir === false ? 1 : (op.repetir > 0 ? op.repetir : 2);
      const pausaMs = op.pausaMs != null ? Math.max(0, +op.pausaMs) : 1500;
      ultInfo = { forma, lento: !!op.lento, repetir, pausaMs, dur: s.dur, vecesIniciadas: 0 };
      finAct = () => { if (op.alFin) op.alFin(); };
      const tocarVez = (vez) => {
        if (miSes !== sesionId) return;
        ultInfo.vecesIniciadas = vez;
        if (op.alInicio) try { op.alInicio(vez, repetir); } catch (e) {}
        const src = ctx.createBufferSource();
        src.buffer = s.buf;
        const g = ctx.createGain();
        g.gain.value = 0.92;
        src.connect(g); g.connect(ctx.destination);
        fuenteAct = src;
        src.onended = () => {
          if (fuenteAct === src) fuenteAct = null;
          if (miSes !== sesionId) return;
          if (vez < repetir) {
            if (op.alPausa) try { op.alPausa(vez, repetir); } catch (e) {}
            timersAct.push(setTimeout(() => tocarVez(vez + 1), pausaMs));
          } else {
            const fn = finAct; finAct = null;
            if (fn) try { fn(); } catch (e) {}
          }
        };
        try { src.start(0); } catch (e) { parar(); }
      };
      tocarVez(1);
      return s;
    };
    const api = { analizar, sintetizar, hablar, parar, tamCache: () => cache.size, ultimo: () => ultInfo };
    window.BiExKoine = api;
    return api;
  })();

  const botonAudioMini = (forma, etiqueta) => {
    const f = String(forma || "").split(/[,·;()[\]]/)[0].trim();
    if (!f || !/[α-ωΑ-Ωἀ-῿]/.test(f)) return null;
    const bt = h("button", {
      type: "button", class: "aud-mini",
      title: "Escuchar " + f + " en griego koiné s. I (2 veces)",
      "aria-label": etiqueta || ("Escuchar " + f + " en griego koiné del siglo I"),
      onclick: (e) => {
        e.preventDefault(); e.stopPropagation();
        const ya = bt.classList.contains("sonando");
        KOINE_S1.parar();
        if (ya) return;
        bt.classList.add("sonando");
        KOINE_S1.hablar(f, { alFin: () => bt.classList.remove("sonando") });
      },
    }, svg(ICO.voz));
    return bt;
  };
  const cajonAudioFormas = (formas, titulo) => {
    const unicas = [];
    const vistas = new Set();
    for (const item of formas || []) {
      const f = String(typeof item === "string" ? item : item.f || "").split(/[,·;()[\]]/)[0].trim();
      const k = claveGr(f);
      if (!f || !k || vistas.has(k) || !/[α-ωΑ-Ωἀ-῿]/.test(f)) continue;
      vistas.add(k);
      unicas.push({ f, tl: typeof item === "object" ? (item.tl || tlDe(f)) : tlDe(f) });
      if (unicas.length >= 24) break;
    }
    if (!unicas.length) return null;
    return h("details", { class: "fl-aud-det" },
      h("summary", {}, svg(ICO.voz), h("span", { text: titulo || "Escuchar pronunciación de sus formas" }), h("small", { text: unicas.length + (unicas.length === 1 ? " forma" : " formas") })),
      h("div", { class: "fl-aud-grid" }, unicas.map(({ f, tl }) => {
        const ch = h("button", {
          type: "button", class: "fl-aud-chip",
          "aria-label": "Escuchar " + f + " en griego koiné s. I",
          onclick: (e) => {
            e.preventDefault(); e.stopPropagation();
            const ya = ch.classList.contains("sonando");
            KOINE_S1.parar();
            if (ya) return;
            ch.classList.add("sonando");
            KOINE_S1.hablar(f, { alFin: () => ch.classList.remove("sonando") });
          },
        }, svg(ICO.voz), h("b", { lang: "grc", text: f }), tl ? h("small", { text: tl }) : null);
        return ch;
      })));
  };

  const TXT_PRON = "El audio koiné del siglo I sintetiza localmente la palabra completa con coarticulación fluida según el consenso histórico-filológico (W. S. Allen, R. Buth, G. Horrocks y F. Gignac): conserva el espíritu áspero inicial /h/, η cerrada /e̝/, υ y οι como /y/, β bilabial /β/, φ /ɸ/ y el acento dinámico de la época. Cada reproducción suena 2 veces con 1,5 s de pausa para facilitar su escucha.";
  const lineaPron = (forma, tl) => {
    const p = pronunciar(forma), sil = (() => { try { const x = tl || tlDe(forma); return x ? silabasBiEx(x) : null; } catch (e) { return null; } })();
    const info = h("p", { class: "fp-pron-info", hidden: true, text: TXT_PRON });
    const bInfo = h("button", { type: "button", class: "fp-pron-i", "aria-label": "De dónde vienen estas pronunciaciones", "aria-expanded": "false", title: "De dónde vienen estas pronunciaciones",
      onclick: (e) => { e.stopPropagation(); info.hidden = !info.hidden; bInfo.setAttribute("aria-expanded", String(!info.hidden)); if (!info.hidden && info.animate && document.documentElement.getAttribute("data-mov") !== "no") info.animate([{ opacity: 0, transform: "translateY(-4px)" }, { opacity: 1, transform: "none" }], { duration: 240, easing: "ease-out" }); } }, "i");
    const silNodo = sil ? h("b", { class: "pr-sil" }, sil.flatMap((x, i) => [i ? h("i", { text: "·" }) : null, h("span", { class: "pr-s" }, x.ton ? h("em", { text: x.t }) : x.t)]).filter(Boolean)) : null;
    const bEsc = h("button", { type: "button", class: "fp-aud-btn", title: "Escuchar palabra completa en griego koiné s. I (2 veces)", "aria-label": "Escuchar " + forma + " en griego koiné del siglo I (2 veces)" }, svg(ICO.voz), h("span", { text: "Escuchar koiné s. I" }));
    const bLen = h("button", { type: "button", class: "fp-aud-btn lento", title: "Escuchar más despacio (0,7× · 2 veces)", "aria-label": "Escuchar " + forma + " más despacio en griego koiné del siglo I", text: "0,7×" });
    const caja = h("div", { class: "fp-pron-caja" });
    const iluminarPalabra = (on) => {
      if (silNodo) silNodo.classList.toggle("sonando", on);
      const pal = caja.parentElement && caja.parentElement.querySelector(".fp-g, .rr-gr, h1[lang='grc']");
      if (pal) pal.classList.toggle("sonando", on);
    };
    const disparar = (lento, btn) => (e) => {
      e.stopPropagation();
      const ya = btn.classList.contains("sonando");
      KOINE_S1.parar();
      if (ya) return;
      bEsc.classList.remove("sonando"); bLen.classList.remove("sonando");
      btn.classList.add("sonando");
      KOINE_S1.hablar(forma, {
        lento,
        repetir: 2,
        pausaMs: 1500,
        alInicio: () => iluminarPalabra(true),
        alPausa: () => iluminarPalabra(false),
        alFin: () => { btn.classList.remove("sonando"); iluminarPalabra(false); },
      });
    };
    bEsc.onclick = disparar(false, bEsc);
    bLen.onclick = disparar(true, bLen);
    caja.append(
      h("p", { class: "fp-pron" },
        silNodo ? h("span", { class: "pr-biex", title: "Lectura BiEx para hispanohablantes: la transliteración de BiEx en sílabas, con la tónica resaltada" }, "BiEx ", silNodo) : null,
        h("span", { title: "Pronunciación histórica del griego koiné del siglo I en el alfabeto fonético internacional" }, "Koiné s. I ", h("b", { text: "[" + p.k + "]" })),
        h("span", { class: "pr-ult" }, h("span", { title: "Pronunciación académica erasmiana en el alfabeto fonético internacional" }, "Erasmiana ", h("b", { text: "[" + p.e + "]" })), bInfo)),
      h("div", { class: "fp-pron-aud" }, bEsc, bLen),
      info);
    return caja;
  };
  // búsqueda de lemas compartida (concordancia y diccionario de raíces): griego, letras latinas, traducción o código Strong
  function buscadorLemas(X) {
    let latinos = null;
    return (q) => {
      const out = new Map(), pon = (li, v) => { if (li != null && li >= 0) out.set(li, Math.max(out.get(li) || 0, v)); };
      const st = /^\s*(?:strong\s*)?([gG])?\s*0*(\d{1,4})\s*([a-zA-Z])?\s*$/.exec(q);
      if (st && LX) { const n = +st[2], ext = st[3] ? st[3].toUpperCase() : ""; LX.S.forEach((s, li) => { if (s && strongNum(s) === n) pon(li, ext && strongX(s).endsWith(ext) ? 10 : 9); }); }
      else if (/[Ͱ-Ͽἀ-῿]/.test(q)) {
        const k = claveGr(q);
        T.Fk.forEach((x, fi) => { if (x === k) pon(T.formaLema.get(fi), 5); });
        T.Lk.forEach((x, li) => { if (x === k) pon(li, 6); else if (x.startsWith(k)) pon(li, 4); else if (k.length > 2 && x.includes(k)) pon(li, 2); });
      } else {
        if (X) {
          const B = X.BQ, kq = B.claveLatina(q.replace(/\s+/g, ""));
          if (!latinos) latinos = T.L.map((l) => B.claveLatina(B.translit(String(l).split(/,\s*/)[0])));
          if (kq.length >= 2) latinos.forEach((x, li) => { if (x === kq) pon(li, 6); else if (x.startsWith(kq)) pon(li, 4); });
        }
        const e = claveEs(q);
        if (e.length >= 3) T.TRk.forEach((x, ti) => { if (ti && x.includes(e)) for (const li of T.TL[ti] || []) pon(li, x === e ? 3 : 1); });
      }
      return [...out.entries()].sort((a, b) => b[1] - a[1] || T.LN[b[0]] - T.LN[a[0]]).map(([li]) => li);
    };
  }

  // ------------------------------------------------------------------ diccionario de raíces
  async function vistaRaices() {
    document.title = "Diccionario de raíces · BiEx";
    navActual("#/buscar");
    if (!LX) { vista().replaceChildren(cargando("Preparando el diccionario de raíces…")); alTope(); }
    try { await lexico(); } catch (e) { vista().replaceChildren(fallo("No se pudo cargar el diccionario.")); return; }
    let X = null; try { X = await prepararBuscador(); } catch (e) { X = null; }
    const buscar = buscadorLemas(X);
    const raices = [...LX.fam.keys()];
    const tot = new Map(raices.map((r) => [r, LX.fam.get(r).reduce((s, li) => s + T.LN[li], 0)]));
    const ORD = {
      fam: () => raices.slice().sort((a, b) => LX.fam.get(b).length - LX.fam.get(a).length || tot.get(b) - tot.get(a)),
      alfa: () => raices.slice().sort((a, b) => claveGr(lemaCorto(a)).localeCompare(claveGr(lemaCorto(b)), "el")),
      frec: () => raices.slice().sort((a, b) => tot.get(b) - tot.get(a)),
    };
    let modo = store.get("raicesOrden", "fam"); if (!ORD[modo]) modo = "fam";
    const item = (r) => {
      const fam = LX.fam.get(r), g = glosaBreve(r);
      return h("li", {}, h("a", { class: "cc-it rz-it", href: "#/raiz/" + r },
        h("b", { lang: "grc", text: lemaCorto(r) }), h("span", { class: "cc-tr", text: tlCorta(r) !== lemaCorto(r) ? tlCorta(r) : "" }),
        h("span", { class: "cc-gl", text: g }), h("em", { text: fam.length === 1 ? "1 palabra" : fmt(fam.length) + " palabras" })));
    };
    const entrada = h("input", { type: "search", class: "cc-q", placeholder: "καλέω · kaleō · llamar · G2564", "aria-label": "Buscar una raíz", autocomplete: "off", autocapitalize: "off", spellcheck: "false" });
    const titulo = h("h2");
    // AA22 (BiEx, 14-nov-2026): el diccionario no crece hacia abajo sin fin: se lee por páginas que giran sobre su lomo, con
    // los números al pie para ir a cualquier parte del orden elegido (se recuerda la página al volver)
    const lista = h("div", { class: "rz-libro" });
    const ords = h("div", { class: "seg-mini", role: "group", "aria-label": "Orden" }, [["fam", "Familias más grandes"], ["frec", "Más frecuentes"], ["alfa", "De α a ω"]].map(([k, t]) => h("button", { type: "button", "data-k": k, "aria-pressed": modo === k ? "true" : "false", text: t, onclick: () => { modo = k; store.set("raicesOrden", k); for (const b of ords.children) b.setAttribute("aria-pressed", b.dataset.k === k ? "true" : "false"); pintar(); } })));
    let todas = [];
    const clavePag = () => (entrada.value.trim() ? "q:" + entrada.value.trim() : "o:" + modo);
    const pagGuardada = () => { try { return (JSON.parse(sessionStorage.getItem("biex:raicesPag") || "{}")[clavePag()]) | 0; } catch (e) { return 0; } };
    const guardarPag = (pg) => { try { const o = JSON.parse(sessionStorage.getItem("biex:raicesPag") || "{}"); o[clavePag()] = pg; sessionStorage.setItem("biex:raicesPag", JSON.stringify(o)); } catch (e) { /* sin almacenamiento */ } };
    const pintar = () => {
      const q = entrada.value.trim();
      if (q) { const vistos = new Set(); todas = buscar(q).map((li) => LX.F[li]).filter((r) => !vistos.has(r) && vistos.add(r)); }
      else todas = ORD[modo]();
      titulo.textContent = q ? (todas.length ? "Raíces que coinciden" : "Ninguna raíz coincide con «" + q + "»") : fmt(raices.length) + " raíces";
      ords.hidden = !!q;
      lista.replaceChildren(todas.length ? libroPaginas(todas, innerWidth < 700 ? 8 : 12, item, { clase: "rz-pag", etiqueta: "Páginas del diccionario de raíces", pag: pagGuardada(), alCambiar: guardarPag, pagina: (nodos) => h("ol", { class: "cc-lista" }, nodos) }) : "");
      try { history.replaceState(history.state, "", urlHash("#/raices" + (q ? "?" + encodeURIComponent(q) : ""))); } catch (e) { /* ignorar */ }
    };
    let tq = 0; entrada.addEventListener("input", () => { clearTimeout(tq); tq = setTimeout(pintar, 140); });
    const previo = decodificar(location.hash.split("?")[1] || ""); if (previo) entrada.value = previo;
    vista().replaceChildren(h("div", { class: "in" }, h("section", { class: "panel" },
      barraVolver(),
      h("div", { class: "panel-cab" }, h("span", { class: "eyebrow", text: "Diccionario de raíces" }), h("h1", { text: "Las palabras por su raíz" }),
        h("p", { class: "nota-ui", text: "Cada raíz reúne las palabras de la Nueva Voluntad que la comparten: sus prefijos visibles, su formación, su origen y cómo se traduce cada una según su morfología y su contexto. Busca en griego, con letras latinas, por su traducción o por su código Strong." }),
        h("div", { style: "margin-top:12px;display:flex;flex-wrap:wrap;gap:9px;align-items:center" },
          h("a", { class: "btn chico oro", href: "#/raices/repaso" }, svg(ICO.tarjetas), h("span", { text: "Repaso diario · 1 min" })))),
      h("div", { class: "cc-buscar" }, svg(ICO.buscar), entrada),
      h("div", { class: "tarjeta" }, h("div", { class: "apl-cab" }, titulo, ords), lista))));
    pintar();
    if (restaurando()) intentarRestaurar();
  }
  async function vistaRaiz(r) {
    navActual("#/buscar");
    if (!LX) { vista().replaceChildren(cargando("Cargando la raíz…")); alTope(); }
    try { await lexico(); } catch (e) { vista().replaceChildren(fallo("No se pudo cargar el diccionario.")); return; }
    if (!(r >= 0 && r < T.L.length)) return noEncontrado();
    if (LX.F[r] !== r) { r = LX.F[r]; try { history.replaceState(history.state, "", urlHash("#/raiz/" + r)); } catch (e) { /* ignorar */ } }
    document.title = lemaCorto(r) + " · raíz · BiEx";
    const fam = LX.fam.get(r) || [r];
    const G = [["V", "Verbos"], ["N", "Sustantivos"], ["A", "Adjetivos"], ["", "Otras palabras"]];
    const por = new Map(G.map(([c]) => [c, []]));
    for (const li of fam) { const c = claseLema(li); por.get(["V", "N", "A"].includes(c) ? c : "").push(li); }
    const suma = new Map();
    for (const li of fam) { const lb = T.LB[li] || []; for (let k = 0; k < lb.length; k += 2) suma.set(lb[k], (suma.get(lb[k]) || 0) + lb[k + 1]); }
    const pares = [...suma.entries()], total = pares.reduce((s, p) => s + p[1], 0);
    const miembro = (li) => {
      const b = LX.B[li], pre = LX.P[li] || [], gb = glosaBreve(li), gl = [gb].concat(glosasLema(li, 3).map(([t]) => T.TR[t]).filter((x) => x !== gb)).filter(Boolean).slice(0, 3);
      return h("li", { class: "rz-m" }, h("a", { href: "#/lema/" + li },
        h("span", { class: "rz-g", lang: "grc", text: lemaCorto(li) }), h("span", { class: "rz-tl", text: tlCorta(li) }), h("em", { text: fmt(T.LN[li]) }),
        b != null ? h("span", { class: "rz-c" }, pre.map((p) => h("span", { lang: "grc", text: p + "- + " })), h("span", { lang: "grc", text: lemaCorto(b) })) : null,
        h("span", { class: "rz-gl", text: gl.join(" · ") })));
    };
    vista().replaceChildren(h("div", { class: "in" }, h("section", { class: "panel" },
      h("div", { class: "barra-volver" }, h("button", { class: "btn chico", type: "button", onclick: volverAtras }, svg(ICO.atras), "Volver"),
        h("a", { class: "btn chico", href: "#/raices" }, svg(ICO.raiz), "Todas las raíces")),
      h("div", { class: "panel-cab" }, h("span", { class: "eyebrow", text: "Diccionario de raíces" }),
        h("h1", { lang: "grc" }, lemaCorto(r), h("small", { text: tlCorta(r) })), lineaPron(lemaCorto(r)),
        h("p", { class: "nota-ui", text: fam.length > 1 ? fmt(fam.length) + " palabras de la Nueva Voluntad comparten esta raíz; juntas aparecen " + fmt(total) + " veces." : "Es la única palabra de su raíz en la Nueva Voluntad: aparece " + fmt(total) + (total === 1 ? " vez." : " veces.") })),
      h("div", { class: "columnas" },
        h("div", { class: "tarjeta", "data-sec": "La raíz" }, h("h2", { text: "La raíz" }), bloqueRaiz(r, "raiz")),
        h("div", { class: "tarjeta", "data-sec": "A lo largo del tiempo" }, h("h2", { text: "A lo largo del tiempo" }), h("p", { class: "nota-ui", text: "Toda la familia, en los libros ordenados por su fecha de escritura." }), tiraTiempo(pares, (c) => { location.hash = "#/" + c + "/1"; }))),
      tarjetaMinigrafo("Constelación de esta raíz", "Familia etimológica, compuestos y libros donde más resuena · arrastra o toca un nodo.", grafoRaiz(r), "#/constelacion?raiz=" + r),
      G.filter(([c]) => por.get(c).length).map(([c, t]) => h("div", { class: "tarjeta", "data-sec": t }, h("h2", { text: t + " · " + fmt(por.get(c).length) }), h("ol", { class: "rz-lista" }, por.get(c).map(miembro)))))));
    if (restaurando()) intentarRestaurar();
  }

  // ------------------------------------------------------------------ analizador de texto griego
  // Cualquier pasaje en griego: cada palabra con sus análisis posibles en la Nueva Voluntad (lema, morfología, Strong, traducción)
  async function vistaAnalizador() {
    document.title = "Analizar texto griego · BiEx";
    navActual("#/buscar");
    if (!T || !LX) { vista().replaceChildren(cargando("Preparando el analizador…")); alTope(); }
    try { await tablas(); } catch (e) { vista().replaceChildren(fallo("No se pudieron cargar los datos.")); return; }
    try { await lexico(); } catch (e) { /* sin el léxico de estudio: el análisis sigue */ }
    if (!T.idxFormas) {
      const m = new Map();
      T.LP.forEach((rows, li) => rows.forEach((r) => {
        const k = T.Fk[r[0]]; if (!m.has(k)) m.set(k, []);
        const a = m.get(k), igual = a.find((x) => x.li === li && x.mi === r[1] && x.tr === r[3]);
        if (igual) { igual.n += r[2]; if (r[2] > igual.nf) { igual.f = r[0]; igual.nf = r[2]; } } else a.push({ li, f: r[0], mi: r[1], n: r[2], nf: r[2], tr: r[3] });
      }));
      T.idxFormas = m;
    }
    const analisisDe = (pal) => (T.idxFormas.get(claveGr(pal)) || []).slice().sort((a, b) => b.n - a.n);
    const area = h("textarea", { class: "an-txt", lang: "grc", rows: "5", placeholder: "Ἐν ἀρχῇ ἦν ὁ λόγος, καὶ ὁ λόγος ἦν πρὸς τὸν θεόν…", "aria-label": "Texto griego para analizar", spellcheck: "false", autocapitalize: "off", autocomplete: "off" });
    area.value = store.get("analizar", "") || "";
    const salida = h("div", { class: "an-sal" }), ficha = h("div", { class: "an-ficha", "aria-live": "polite" }), fijas = h("div", { class: "chips an-fij" });
    let fij = store.get("analizarFijas", []).filter((x) => typeof x === "string").slice(0, 40);
    const pintarFij = () => { fijas.replaceChildren(...fij.map((p) => h("button", { type: "button", class: "chip", lang: "grc", text: p, onclick: () => verFicha(p, null) }))); fijasCaja.hidden = !fij.length; };
    const fijasCaja = h("div", { class: "an-fijas" }, h("span", { class: "rotulo", text: "Palabras fijadas" }), fijas,
      h("button", { class: "btn chico", type: "button", text: "Quitar todas", onclick: () => { fij = []; store.set("analizarFijas", fij); pintarFij(); } }));
    const fichaDe = (pal, an) => {
      if (!an.length) {
        const k = claveGr(pal), lemas = []; T.Lk.forEach((x, li) => { if (x === k) lemas.push(li); });
        return h("div", { class: "tarjeta an-card" }, h("div", { class: "lema-l" }, h("span", { class: "g", lang: "grc", text: pal })), lineaPron(pal),
          h("p", { class: "nota-ui", text: lemas.length ? "Es la forma de diccionario de este lema:" : "Esta forma no aparece en la Nueva Voluntad. Revisa los acentos o busca su lema en la concordancia." }),
          lemas.length ? h("div", { class: "chips" }, lemas.map((li) => h("a", { class: "chip", lang: "grc", href: "#/lema/" + li, text: T.L[li] }))) : h("a", { class: "btn chico", href: "#/lema?" + encodeURIComponent(pal) }, svg(ICO.lista), "Buscar en la concordancia"));
      }
      const porLema = new Map(); for (const x of an) { if (!porLema.has(x.li)) porLema.set(x.li, []); porLema.get(x.li).push(x); }
      const tot = an.reduce((s, x) => s + x.n, 0);
      return h("div", { class: "tarjeta an-card" },
        h("div", { class: "an-cab" }, h("div", { class: "lema-l" }, h("span", { class: "g", lang: "grc", text: T.F[an[0].f] }), h("small", { text: T.FT[an[0].f] })),
          h("button", { class: "btn chico", type: "button", onclick: () => { if (!fij.includes(pal)) { fij.unshift(pal); fij = fij.slice(0, 40); store.set("analizarFijas", fij); pintarFij(); avisar("Palabra fijada"); } } }, svg(ICO.marcador), "Fijar")),
        lineaPron(T.F[an[0].f]),
        h("p", { class: "nota-ui", text: "Esta forma aparece " + fmt(tot) + (tot === 1 ? " vez" : " veces") + " en la Nueva Voluntad" + (porLema.size > 1 ? ", de " + porLema.size + " lemas distintos" : "") + "." }),
        [...porLema.entries()].map(([li, xs]) => h("div", { class: "bloque" },
          h("div", { class: "lema-l" }, h("a", { class: "g", lang: "grc", href: "#/lema/" + li, text: T.L[li] }), h("small", { text: T.LT[li] }), LX && LX.S[li] ? h("span", { class: "chip lx-strong", text: strongN(LX.S[li]) }) : null),
          h("table", { class: "paradigma" }, h("tbody", {}, xs.map((x) => h("tr", {}, h("td", { class: "m", text: T.MD[x.mi] }), h("td", { text: x.tr ? T.TR[x.tr] : "" }), h("td", { class: "n", text: fmt(x.n) }))))),
          h("div", { class: "m-pie" }, h("a", { class: "btn chico", href: "#/lema/" + li }, svg(ICO.lista), "Concordancia"), LX ? h("a", { class: "btn chico", href: "#/raiz/" + LX.F[li] }, svg(ICO.raiz), "Su raíz") : null))));
    };
    const verFicha = (pal, btn) => {
      for (const x of salida.querySelectorAll("[aria-pressed='true']")) x.setAttribute("aria-pressed", "false");
      if (btn) btn.setAttribute("aria-pressed", "true");
      ficha.replaceChildren(fichaDe(pal, analisisDe(pal)));
      if (matchMedia("(max-width: 900px)").matches) requestAnimationFrame(() => ficha.scrollIntoView({ block: "nearest", behavior: ap.mov === "no" ? "auto" : "smooth" }));
    };
    const analizar = () => {
      const txt = area.value; store.set("analizar", txt.slice(0, 4000));
      salida.replaceChildren(); ficha.replaceChildren();
      let n = 0, sin = 0;
      for (const p of txt.split(/([^Ͱ-Ͽἀ-῿’ʼ']+)/)) {
        if (!p) continue;
        if (!/[Ͱ-Ͽἀ-῿]/.test(p)) { salida.append(p.replace(/\n{3,}/g, "\n\n")); continue; }
        const an = analisisDe(p); n++; if (!an.length) sin++;
        const cl = an.length ? T.MC[an[0].mi] : "";
        salida.append(h("button", { type: "button", lang: "grc", class: "an-pal" + (an.length ? "" : " desconocida"), style: cl ? "--k:var(--c-" + cl + ")" : null, "aria-pressed": "false", text: p, onclick: (e) => verFicha(p, e.currentTarget) }));
      }
      resumen.textContent = n ? fmt(n) + (n === 1 ? " palabra" : " palabras") + (sin ? " · " + fmt(sin) + " sin análisis en la Nueva Voluntad" : " · todas con su análisis") + ". Toca una para estudiarla." : "Escribe o pega un texto en letras griegas.";
    };
    const resumen = h("p", { class: "nota-ui an-res" });
    const ejemplo = async () => { try { const toks = await versoTokens("JHN", "1", 1); area.value = toks.map((t) => T.F[t[0]] + (t[4] || "")).join(" "); analizar(); } catch (e) { /* ignorar */ } };
    vista().replaceChildren(h("div", { class: "in" }, h("section", { class: "panel" },
      barraVolver(),
      h("div", { class: "panel-cab" }, h("span", { class: "eyebrow", text: "Analizador" }), h("h1", { text: "Analizar texto griego" }),
        h("p", { class: "nota-ui", text: "Escribe o pega cualquier pasaje en griego. Cada palabra muestra todos sus análisis posibles en la Nueva Voluntad: su lema, su morfología, su código Strong, cómo se traduce y su raíz." })),
      h("div", { class: "tarjeta an-entrada" }, area, h("div", { class: "m-pie" }, h("button", { class: "btn chico oro", type: "button", onclick: analizar }, svg(ICO.lupa), "Analizar"), h("button", { class: "btn chico", type: "button", onclick: ejemplo }, svg(ICO.libro), "Probar con un verso"), h("button", { class: "btn chico", type: "button", onclick: () => { area.value = ""; analizar(); area.focus(); } }, "Borrar"))),
      h("div", { class: "columnas an-cols" }, h("div", { class: "tarjeta" }, resumen, salida), ficha),
      fijasCaja)));
    area.addEventListener("keydown", (e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); analizar(); } });
    pintarFij();
    analizar();
  }

  // ------------------------------------------------------------------ búsqueda
  async function vistaBuscar() {
    document.title = "Búsqueda morfológica · BiEx";
    navActual("#/buscar");
    if (!T) { vista().replaceChildren(cargando("Preparando la búsqueda…")); alTope(); }
    try { await tablas(); } catch (e) { vista().replaceChildren(fallo("No se pudieron cargar los datos.")); return; }
    vista().replaceChildren(h("div", { class: "in" }, h("section", { class: "panel" },
      barraVolver(),
      h("div", { class: "panel-cab" }, h("span", { class: "eyebrow", text: "Búsqueda avanzada" }), h("h1", { class: "texto", text: "Buscar por rasgos gramaticales" }),
        h("p", { class: "nota-ui" }, "¿Buscas un verso, una escena, un nombre o una palabra? ", h("button", { class: "enlace", type: "button", onclick: () => abrirBusqueda(""), text: "Abre el buscador" }), ".")),
      buscadorMorfologico())));
  }

  function buscadorMorfologico() {
    const sel = (id, t, ops) => h("label", {}, t, h("select", { id }, h("option", { value: "", text: "cualquiera" }), Object.entries(ops).map(([v, x]) => h("option", { value: v, text: x }))));
    const libros = h("select", { id: "fm-libro" }, h("option", { value: "", text: "toda la Nueva Voluntad" }), D.libros.map((b) => h("option", { value: b.c, text: nombreLibro(b) })));
    const lema = h("input", { id: "fm-lema", type: "text", placeholder: "p. ej. λέγω", lang: "grc" });
    const salida = h("div", { class: "resultados" });
    const barra = h("div", { class: "progreso", hidden: true }, h("i"));
    const correr = async () => {
      const f = { aor: $("#fm-aor").value, pos: $("#fm-clase").value, tense: $("#fm-tiempo").value, mood: $("#fm-modo").value, voice: $("#fm-voz").value, case: $("#fm-caso").value, number: $("#fm-num").value, gender: $("#fm-gen").value, person: $("#fm-pers").value };
      const lk = claveGr(lema.value.trim());
      const lset = lk ? new Set(T.Lk.map((x, i) => (x === lk ? i : -1)).filter((i) => i >= 0)) : null;
      const okM = T.M.map((_, mi) => {
        const m = T.P[mi] || {}, cl = T.MC[mi];
        // «hebreo o arameo» no es una categoría propia en los datos: va como sufijo del código (N-ASN-HEB, V-AAM-2S-ARAM, INJ-HEB…)
        if (f.pos === "HEB") { if (!/-(HEB|ARAM)\b/.test(T.M[mi])) return false; }
        else if (f.pos && cl !== f.pos) return false;
        for (const k of ["tense", "mood", "case", "number", "gender", "person"]) if (f[k] && m[k] !== f[k]) return false;
        return true;
      });
      const libs = $("#fm-libro").value ? [libroDe($("#fm-libro").value)] : D.libros;
      const hall = [];
      salida.replaceChildren(); barra.hidden = false;
      let k = 0;
      for (const b of libs) {
        let A, Lc; try { [A, Lc] = await Promise.all([analisis(b.c), lectura(b.c)]); } catch (e) { continue; }
        for (const [cap, vs] of Object.entries(A.caps)) for (const [v, toks] of vs) toks.forEach((t, i) => {
          if (!okM[t[2]]) return;
          if (lset && !lset.has(t[1])) return;
          if (f.voice && String(t[8] || 0) !== f.voice) return;
          if (f.aor && String(t[7] || 0) !== f.aor) return;
          hall.push({ b, cap: +cap, v, toks, i, Lc });
        });
        $("i", barra).style.width = (100 * ++k / libs.length) + "%";
      }
      barra.hidden = true;
      const lista = h("ol", { class: "citas" });
      let n = 0;
      const mas = h("button", { class: "btn chico", type: "button", text: "Mostrar más" });
      const pinta = () => { lista.append(...hall.slice(n, n + 80).map((x) => { x.L = (x.Lc.caps[x.cap] || []).find((y) => y.v === x.v); return citaEl(x); })); n += 80; mas.hidden = n >= hall.length; };
      mas.onclick = pinta;
      pinta();
      salida.replaceChildren(h("p", { class: "nota-ui", text: hall.length ? fmt(hall.length) + " palabras cumplen la búsqueda. Toca una para ver su análisis." : "Ninguna palabra cumple esa combinación." }), lista, mas);
    };
    return h("div", { class: "tarjeta", id: "morfologica" }, h("h2", { text: "Búsqueda morfológica" }),
      h("p", { class: "nota-ui", text: "Combina rasgos gramaticales para encontrar todas las palabras que los cumplen, con su verso." }),
      h("div", { class: "filtros-m" },
        h("label", {}, "Lema", lema),
        sel("fm-clase", "Categoría", Object.fromEntries(Object.entries(CLASE).filter(([k]) => k !== "X"))),
        sel("fm-tiempo", "Tiempo", TIEMPO), sel("fm-aor", "Tipo de aoristo", { 1: "sigmático", 2: "temático", 3: "atemático", 4: "ambiguo" }), sel("fm-modo", "Modo", MODO), sel("fm-voz", "Voz", { 1: "activa", 2: "media", 3: "pasiva", 4: "media o pasiva" }),
        sel("fm-caso", "Caso", CASO), sel("fm-num", "Número", NUM), sel("fm-gen", "Género", GEN), sel("fm-pers", "Persona", { 1: "1.ª", 2: "2.ª", 3: "3.ª" }),
        h("label", {}, "Libro", libros)),
      h("div", {}, h("button", { class: "btn oro", type: "button", onclick: correr }, svg(ICO.filtros), "Buscar palabras")), barra, salida);
  }

  // ------------------------------------------------------------------ línea del tiempo
  // Los acontecimientos y la fecha aproximada en que se escribió cada libro (datos/cronologia.json)
  const parsearRefs = (txt) => String(txt || "").split(";").map((p) => {
    const m = p.trim().match(/^([1-3]?[A-Z]{2,3})\s+(\d+)(?::(\d+))?(?:\s*-\s*(\d+)(?::(\d+))?)?$/);
    if (!m) return null;
    const c1 = +m[2], v1 = m[3] ? +m[3] : 1;
    let c2 = c1, v2 = m[3] ? v1 : 999;
    if (m[4] && m[5]) { c2 = +m[4]; v2 = +m[5]; } else if (m[4]) { if (m[3]) v2 = +m[4]; else { c2 = +m[4]; v2 = 999; } }
    return [m[1], c1, v1, c2, v2];
  }).filter(Boolean);
  const anio = (a) => (a < 0 ? Math.round(-a) + " " + ERA_A : Math.round(a) + " " + ERA_D);
  function vistaCronologia(foco) {
    document.title = "Línea del tiempo · BiEx";
    navActual("#/cronologia");
    if (!CRONO) { vista().replaceChildren(fallo("No se pudo cargar la línea del tiempo.")); return; }
    const ver = store.get("cronoVer", "todo");
    const escritos = librosEnOrden().filter((b) => CRONO.libros[b.c] && CRONO.libros[b.c].ea != null).map((b) => ({ tipo: "es", a: CRONO.libros[b.c].ea, b }));
    const items = CRONO.eventos.map((e) => ({ tipo: "ev", a: e.a, e })).concat(escritos).sort((p, q) => p.a - q.a || (p.tipo === "ev" ? -1 : 1));
    items.forEach((x, k) => { x.id = x.tipo === "ev" && x.e.clave ? "a" + Math.round(x.e.a) : "tl-" + k; });
    const fechaDe = (x) => x.tipo === "ev" ? x.e.f : (/^c\./.test(CRONO.libros[x.b.c].e) ? CRONO.libros[x.b.c].e : "c. " + CRONO.libros[x.b.c].e) + " " + ERA_D;
    const tituloDe = (x) => x.tipo === "ev" ? x.e.t : "Se escribe " + nombreLibro(x.b);
    const visibles = items.filter((x) => ver === "todo" || (ver === "hechos" ? x.tipo === "ev" : x.tipo === "es"));
    const chips = (txt) => h("span", { class: "tl-refs" }, parsearRefs(txt).map((r) => h("a", { href: refRuta(r), text: refTexto(r) })));
    const lista = h("ol", { class: "tl" });
    let decada = null;
    for (const x of visibles) {
      const d = x.a < 0 ? "antes" : Math.floor(x.a / 10) * 10;
      if (d !== decada) { decada = d; const et = d === "antes" ? "Antes del Hijo de Dios" : d === 0 ? "Primeros años después del Hijo de Dios" : "Años " + d; lista.append(h("li", { class: "tl-dec", "data-sec": d === "antes" ? "Antes del H.D." : d === 0 ? "Primeros años" : "Años " + d }, h("span", { text: et }))); }
      if (x.tipo === "es") {
        const b = x.b;
        lista.append(h("li", { class: "tl-it tl-es", id: x.id }, h("span", { class: "tl-f", text: fechaDe(x) }),
          h("a", { class: "tl-c", href: "#/" + b.c + "/1" }, h("span", { class: "tl-k", text: "Se escribe" }), h("b", { text: b.t || b.n }), h("small", { text: tradQ(b) }))));
      } else {
        const e = x.e;
        const li = h("li", { class: "tl-it tl-ev" + (e.clave ? " tl-clave" : ""), id: x.id },
          h("span", { class: "tl-f", text: e.f }),
          h("div", { class: "tl-c" },
            h("b", { text: e.t }),
            e.d ? h("p", { text: e.d }) : null,
            e.r ? chips(e.r) : null,
            e.h ? h("p", { class: "tl-h" }, "Registro histórico: ", h("cite", { text: e.h })) : null,
            e.liga ? h("a", { class: "btn chico", href: "#/cronologia/" + e.liga }, svg(ICO.seguir), "Ver lo que sucedió en el año " + e.liga + " " + ERA_D) : null));
        if (e.clave && e.r) {
          const textos = h("div", { class: "tl-textos" });
          const btn = h("button", { class: "btn chico oro", type: "button" }, svg(ICO.libro), "Leer lo que se había anunciado");
          btn.onclick = async () => {
            btn.disabled = true; textos.replaceChildren(cargando("Reuniendo los textos…"));
            try {
              const rs = parsearRefs(e.r), libs = [...new Set(rs.map((r) => r[0]))];
              const Ls = Object.fromEntries(await Promise.all(libs.map(async (c) => [c, await lectura(c)])));
              textos.replaceChildren(...rs.map((r) => {
                const vs = []; for (const [cap, xs] of Object.entries(Ls[r[0]].caps)) for (const y of xs) { const c = +cap; if ((c > r[1] || (c === r[1] && y.v >= r[2])) && (c < r[3] || (c === r[3] && y.v <= r[4]))) vs.push([c, y]); }
                return h("div", { class: "tl-cita" }, h("a", { class: "tl-ref", href: refRuta(r), text: refTexto(r) }), vs.slice(0, 8).map(([c, y]) => h("p", {}, h("sup", { text: (c !== r[1] ? c + ":" : "") + y.v }), " ", txtVersoL(y))));
              }));
              btn.hidden = true;
            } catch (er) { textos.replaceChildren(fallo("No se pudieron cargar los textos.")); btn.disabled = false; }
          };
          li.querySelector(".tl-c").append(btn, textos);
        }
        lista.append(li);
      }
    }
    // Vista de conjunto interactiva. La escala mezcla la proporción del tiempo con la densidad de acontecimientos, para
    // que los años más llenos (los 50 y los 60) se abran y nada quede amontonado; los puntos cercanos se apilan en filas.
    const AS = items.map((x) => x.a).sort((p, q) => p - q), A0 = -8, A1 = 72;
    const cdf = (a) => { let k = 0; while (k < AS.length && AS[k] <= a) k++; return k / AS.length; };
    const escala = (a) => 0.35 * (a - A0) / (A1 - A0) + 0.65 * (cdf(a) * 0.96 + 0.02);
    const marcas = [[-7, "7 " + ERA_A], [0, "1 " + ERA_D], [28, "28"], [40, "40"], [50, "50"], [57, "57"], [62, "62"], [66, "66"], [70, "70 " + ERA_D]];
    const lienzo = h("div", { class: "tl-lienzo" });
    const info = h("div", { class: "tl-info", "aria-live": "polite" });
    const puntos = [];
    let sel = null;
    const elegir = (x, ir) => {
      sel = x;
      for (const p of puntos) p.el.classList.toggle("sel", p.x === x);
      const k = items.indexOf(x);
      const paso = (d) => { const y = items[k + d]; if (!y) return; elegir(y); const p = puntos.find((q) => q.x === y); if (p) { p.el.focus({ preventScroll: true }); const r = p.el.offsetLeft - mapa.clientWidth / 2; mapa.scrollTo({ left: r, behavior: "smooth" }); } };
      info.replaceChildren(
        h("span", { class: "ti-nav" }, h("button", { class: "btn-icono chico", type: "button", "aria-label": "Anterior", disabled: k <= 0, onclick: () => paso(-1) }, "‹"),
          h("button", { class: "btn-icono chico", type: "button", "aria-label": "Siguiente", disabled: k >= items.length - 1, onclick: () => paso(1) }, "›")),
        h("span", { class: "ti-f", text: fechaDe(x) }), h("b", { text: tituloDe(x) }),
        h("button", { class: "btn chico", type: "button", onclick: () => { const el = document.getElementById(x.id); if (el) { el.scrollIntoView({ block: "center", behavior: "smooth" }); el.classList.add("destello"); setTimeout(() => el.classList.remove("destello"), 1600); } } }, svg(ICO.seguir), "Ver en la lista"));
      if (ir) { const el = document.getElementById(x.id); if (el) el.scrollIntoView({ block: "center", behavior: "smooth" }); }
    };
    for (const x of items) {
      const el = h("button", { type: "button", class: "te-p " + x.tipo + (x.e && x.e.clave ? " clave" : ""), "aria-label": fechaDe(x) + ": " + tituloDe(x), title: fechaDe(x) + " · " + tituloDe(x),
        onclick: () => elegir(x), onmouseenter: () => elegir(x), onfocus: () => elegir(x) });
      puntos.push({ x, el, u: escala(x.a) });
      lienzo.append(el);
    }
    const ejeL = h("div", { class: "te-eje" }, marcas.map(([a, t]) => h("span", { class: "te-m", style: "left:" + (escala(a) * 100).toFixed(2) + "%", text: t })));
    lienzo.append(ejeL);
    // filas: cada banda (acontecimientos arriba, escritura abajo) apila los puntos que no caben a la par
    const repartir = () => {
      const W = lienzo.clientWidth || 700, gap = 15 / W;
      const filas = { ev: [], es: [] };
      let maxF = { ev: 0, es: 0 };
      for (const p of puntos) {
        const fs = filas[p.x.tipo]; let f = 0;
        while (fs[f] != null && p.u - fs[f] < gap) f++;
        fs[f] = p.u; p.f = f; maxF[p.x.tipo] = Math.max(maxF[p.x.tipo], f);
      }
      const fila = 14, mitad = 22 + (maxF.ev + 1) * fila;
      lienzo.style.height = (mitad + 30 + (maxF.es + 1) * fila + 6) + "px";
      ejeL.style.top = mitad + "px";
      for (const p of puntos) {
        p.el.style.left = (p.u * 100).toFixed(2) + "%";
        p.el.style.top = (p.x.tipo === "ev" ? mitad - 12 - p.f * fila : mitad + 26 + p.f * fila) + "px";
      }
    };
    const mapa = h("div", { class: "tl-mapa" }, lienzo);
    const seg = h("div", { class: "seg tl-seg", role: "group", "aria-label": "Qué mostrar" }, [["todo", "Todo"], ["hechos", "Acontecimientos"], ["escritos", "Escritura de los libros"]].map(([k, t]) => h("button", { type: "button", "aria-pressed": String(ver === k), onclick: () => { store.set("cronoVer", k); vistaCronologia(foco); } }, t)));
    vista().replaceChildren(h("div", { class: "in" }, h("section", { class: "panel" },
      barraVolver(),
      h("div", { class: "panel-cab" }, h("span", { class: "eyebrow", text: "Nueva Voluntad · c. 7 " + ERA_A + " – 70 " + ERA_D }), h("h1", { class: "texto", text: "Línea del tiempo" }),
        h("p", { class: "nota-ui tl-intro", text: "Lo que narra la Nueva Voluntad y cuándo se escribió cada libro. Todos se escribieron antes del año 70, cuando ῾Hrṓmē [Roma] destruyó Yᵉrūshāláyim [Jerusalén] y su templo, tal como se había anunciado: el propio texto da las claves para entender lo que anuncia, y la historia lo confirma." })),
      guiaSeccion("cronologia"),
      h("div", { class: "tl-conj", "data-sec": "Vista general" }, mapa, info,
        h("div", { class: "tl-ley" }, h("span", { class: "ev", text: "Acontecimiento" }), h("span", { class: "es", text: "Se escribe un libro" }), h("span", { class: "clave", text: "Año 70 " + ERA_D }), h("span", { class: "nota-era", text: ERA_A + ": antes del Hijo de Dios · " + ERA_D + ": después del Hijo de Dios" }))),
      h("div", { class: "tl-ctl" }, seg),
      lista,
      h("div", { class: "tarjeta tl-fuentes", "data-sec": "Fechas y fuentes" }, h("h2", { text: "Fechas y fuentes" }), h("p", { class: "nota-ui", text: CRONO.nota }),
        h("ul", {}, (CRONO.fuentes || []).map(([t, d]) => h("li", {}, h("cite", { text: t }), " — " + d)))))));
    repartir();
    if (window.ResizeObserver) { const ro = new ResizeObserver(() => { if (!lienzo.isConnected) { ro.disconnect(); return; } repartir(); }); ro.observe(lienzo); }
    elegir(items.find((x) => x.e && x.e.clave) || items[items.length - 1]);
    requestAnimationFrame(() => { mapa.scrollLeft = mapa.scrollWidth; });
    if (foco && !restaurando()) requestAnimationFrame(() => { const el = document.getElementById("a" + foco); if (el) el.scrollIntoView({ block: "center" }); else alTope(); });
    else alTope();
  }

  // ------------------------------------------------------------------ la fuente Q (datos/fuente_q.json)
  // Sinopsis de la doble tradición calculada sobre el griego del lector: hipótesis, argumentos y su historia
  const Q_LIB = { MAT: "Mattáy", MRK: "Μᾶrκος", LUK: "Lουκᾶς", Q: "Q", M: "M", L: "L" };
  let QD = null, QIDX = null;
  // «MAT 5:3-4; 5:6» → partes con su libro y su ruta
  const qPartes = (txt) => { let lib = null; return String(txt || "").split(";").map((p) => { p = p.trim(); const m = p.match(/^([A-Z]{3})\s+(.*)$/); if (m) { lib = m[1]; p = m[2]; } return { lib, txt: p, r: parsearRefs(lib + " " + p)[0] }; }).filter((x) => x.r); };
  const qRefs = (txt, conLibro) => h("span", { class: "q-refs" }, qPartes(txt).map((x, i) => [i ? ", " : null, h("a", { href: refRuta(x.r), text: (i === 0 && conLibro !== false ? Q_LIB[x.lib] + " " : "") + x.txt })]));
  const qTexto = (t) => String(t).split(/(\[\[[^\]]+\]\])/).filter(Boolean).map((x) => { const m = x.match(/^\[\[(.+)\]\]$/); return m ? qRefs(m[1]) : x; });
  const qLey = (items) => h("div", { class: "q-ley", role: "note" }, items.map(([k, t]) => h("span", { class: "q-ley-i" }, h("span", { class: "q-ley-m q" + k, lang: "grc", text: "λόγος" }), h("span", { class: "q-ley-t", text: t }))));
  function qColumna(lib, filas, bx, extra) {
    return h("div", { class: "q-col" }, h("h4", { class: "q-col-t" }, Q_LIB[lib], extra || null),
      filas.map(([c, cap, v, ws, L]) => h("div", { class: "q-v" },
        h("a", { class: "q-ref", href: "#/" + c + "/" + cap + "/l/" + v, "aria-label": Q_LIB[c] + " " + cap + ":" + v, text: cap + ":" + v }),
        h("p", { class: "q-g", lang: "grc" }, ws.map(([g, k, p], i) => [i ? " " : null, h("span", { class: "q" + k, "data-gk": g }, gk(g)), punt(p) || null])),
        bx && L ? h("p", { class: "q-bx" }, txtVersoL(L)) : null)));
  }
  // ------------------------------------------------------------------ ranking de BiEx (AA16, 14-nov-2026)
  // Las 16 ediciones bíblicas menos mal traducidas al español, en el orden del ranking de BiEx (página «info» del sitio
  // oficial). [n, título, sigla, años, personas]; los nombres, el original primero y el tradicional entre [ ].
  const RANKING = [
    [1, "La Biblia, Edición Popular / Nueva Biblia Española", "NBE", "1986 · 1977", "Luis Alonso Schökel y Juan Mateos"],
    [2, "Traducción del Nuevo Mundo de las Santas Escrituras con Referencias", "TNM", "1987", ""],
    [3, "Biblia Latinoamericana, Edición «Pastoral» y Formadores", "", "1995 · 2005", ""],
    [4, "Biblia Versión Septuaginta en Español", "", "2008 – 2013", "Natalio Fernández Marcos y María Victoria Spottorno Díaz-Caro"],
    [5, "La Biblia de Nuestro Pueblo", "BNP", "2006", ""],
    [6, "Biblia Castilian", "CAB", "2003", ""],
    [7, "El Libro del Pueblo de Dios", "LPD", "1981", ""],
    [8, "Nueva Biblia de Jerusalén con Deuterocanónicos", "NBJ", "1998", ""],
    [9, "La Biblia", "BSA", "1975", "Serafín de Ausejo"],
    [10, "Versión Israelita Nazarena", "VIN", "2011", ""],
    [11, "Biblia La Palabra Versión Hispano-Americana", "BLPH · BHTI", "2009 – 2011 · 2013 con Deuterocanónicos (Interconfesional)", ""],
    [12, "Biblia del Peregrino", "PER", "1993", ""],
    [13, "Biblia de Wilhelm [Guillermo] Jünemann Beckschäfer", "JÜNEMANN", "1928", "Septuaginta en español: la que BiEx usa hoy para las citas de la Antigua Voluntad"],
    [14, "Traducción en Lenguaje Actual con Deuterocanónicos", "TLA-D", "2004", ""],
    [15, "Santa Biblia Versión de la Universidad de Jerusalén", "SBVUJ", "", ""],
    [16, "«La Palabra» de Dios para Todos", "PDT", "2008", ""]];
  // aviso de las referencias de la Antigua Voluntad: el texto viene de una edición del ranking (enlazado)
  const avisoAV = () => h("p", { class: "rx-av-nota" }, "Texto extraído de una de las ediciones bíblicas menos mal traducidas, según el ",
    h("a", { href: "#/ranking", text: "ranking" }), " de BiEx: Septuaginta en español de Wilhelm [Guillermo] Jünemann Beckschäfer (1928).");
  function vistaRanking() {
    navActual("#/ranking");
    document.title = "Ranking de traducciones · BiEx";
    const item = ([n, t, sg, a, p]) => h("li", { class: "rk-it" + (n === 13 ? " usa" : ""), id: "r" + n, "data-sec": n === 1 ? "Puestos 1–5" : n === 6 ? "Puestos 6–10" : n === 11 ? "Puestos 11–16" : null },
      h("span", { class: "rk-n", "aria-label": "Puesto " + n, text: String(n) }),
      h("div", { class: "rk-c" }, h("h2", { text: t }),
        (sg || a) ? h("p", { class: "rk-d" }, sg ? h("b", { text: sg }) : null, sg && a ? " · " : null, a || null) : null,
        p ? h("p", { class: "rk-p", text: p }) : null));
    vista().replaceChildren(h("div", { class: "in" }, h("section", { class: "panel estudio rk" },
      barraVolver(),
      h("div", { class: "panel-cab" }, h("span", { class: "eyebrow", text: "Ranking de BiEx" }),
        h("h1", { class: "texto", text: "Las 16 ediciones bíblicas menos mal traducidas al español" }),
        h("p", { class: "est-sub", text: "En el orden del ranking: ninguna es exacta, pero estas son las que menos deficientemente resisten la comparación con los textos más antiguos." })), // AC2 (BiEx, 15-nov-2026)
      h("ol", { class: "rk-lista" }, RANKING.map(item)),
      h("p", { class: "rk-nota", "data-sec": "Nota del ranking" }, "BiEx consulta y compara una media de 79 traducciones frente a unas 180 ediciones en español. Ninguna de las demás supera hoy la prueba, por eso no se recomiendan para decisiones de doctrina ni para el estudio serio del texto sagrado. La lista no está completa y se revisa. ",
        // AC1 (BiEx, 15-nov-2026): dentro del sitio oficial el enlace abre la página «info» en la ventana principal (en un marco,
        // una pestaña nueva podía no abrirse, sobre todo en la app instalada); fuera de él, en una pestaña nueva
        h("a", { href: OFICIAL + "info", target: EMBED ? "_top" : "_blank", rel: "noopener", text: "Ver la página de información del sitio oficial" }), "."))));
    if (restaurando()) intentarRestaurar(); else alTope();
  }
  // Estudios: «Lo que pocos saben», «Por qué estas fechas» y «Falacias lógicas» (datos/estudios.json, con los nombres ya
  // en su forma de BiEx); los pasajes son enlaces y cada dato lleva sus fuentes
  let EST = null;
  const ESTUDIOS = [["datos", "Lo que pocos saben", ICO.chispa], ["fechas", "Por qué estas fechas", ICO.tiempo], ["falacias", "Falacias lógicas", ICO.balanza]];
  async function vistaEstudio(k, foco) {
    navActual("#/" + k);
    if (!EST) {
      vista().replaceChildren(h("div", { class: "in" }, cargando("Abriendo…")));
      try { EST = await cargar("datos/estudios.json"); } catch (e) { vista().replaceChildren(h("div", { class: "in" }, fallo("No se pudo cargar esta sección."))); return; }
      if (!new RegExp("^#/" + k).test(location.hash)) return;
    }
    const pg = EST[k]; if (!pg) return noEncontrado();
    document.title = pg.t + " · BiEx";
    const refs = (txt) => txt ? h("p", { class: "est-refs" }, svg(ICO.libro), parsearRefs(txt).map((r, i) => [i ? " · " : null, h("a", { href: refRuta(r), text: refTexto(r) })])) : null;
    const fuentes = (fs) => fs && fs.length ? h("details", { class: "est-fuentes" }, h("summary", { text: fs.length === 1 ? "Fuente" : "Fuentes" }), h("ul", {}, fs.map((f) => h("li", { text: f })))) : null;
    const pars = (ps) => (ps || []).map((t) => h("p", { text: t }));
    const nav = h("nav", { class: "est-nav", "aria-label": "Estudios" }, ESTUDIOS.map(([c, t, ico]) => h("a", { href: "#/" + c, class: "chip" + (c === k ? " activo" : ""), "aria-current": c === k ? "page" : null }, svg(ico), t)));
    let cuerpo;
    if (k === "datos") {
      cuerpo = h("div", { class: "est-lista" }, pg.items.map((it, i) => h("article", { class: "est-item", id: "e" + (i + 1), "data-sec": String(i + 1).padStart(2, "0") + " · " + it.t },
        h("span", { class: "est-n", "aria-hidden": "true", text: String(i + 1).padStart(2, "0") }),
        h("div", { class: "est-c" }, h("h2", { text: it.t }), pars(it.p), refs(it.r), fuentes(it.f)))));
    } else if (k === "fechas") {
      const L = CRONO ? CRONO.ordenes.escritura.map(libroDe).filter(Boolean) : [];
      const tabla = L.length ? h("div", { class: "est-fechas", "data-sec": "Los 27 libros por fecha" }, h("h2", { text: "Los 27 libros por su fecha de escritura" }),
        h("ol", { class: "est-tabla" }, L.map((b) => h("li", {}, h("a", { href: "#/" + b.c + "/1" }, h("b", { text: b.t || b.n }), b.t ? h("small", { text: tradQ(b) }) : null), h("span", { text: (fechaEscrito(b) || "").replace(/^c\. /, "c. ") + (/H\.D\./.test(fechaEscrito(b)) ? "" : " " + ERA_D) }))))) : null;
      cuerpo = h("div", { class: "est-secs" }, pg.secciones.map((sc, i) => h("section", { class: "est-sec", id: "s" + (i + 1), "data-sec": sc.t }, h("h2", { text: sc.t }), pars(sc.p), refs(sc.r))), tabla, fuentes(pg.f));
    } else {
      cuerpo = [h("section", { class: "est-etica", "data-sec": pg.etica.t }, h("h2", { text: pg.etica.t }), pars(pg.etica.p), refs(pg.etica.r)),
        h("div", { class: "est-fal" }, pg.items.map((it, i) => h("article", { class: "est-falacia", id: "f" + (i + 1), "data-sec": i % 4 === 0 ? "Falacias " + (i + 1) + "–" + Math.min(pg.items.length, i + 4) : null },
          h("h2", {}, it.t, it.l ? h("small", { lang: "la", text: it.l }) : null),
          h("p", { class: "est-def", text: it.d }),
          h("p", { class: "est-ej" }, h("b", { text: "Ejemplo · " }), it.e),
          h("p", { class: "est-resp" }, h("b", { text: "Con altura · " }), it.c),
          refs(it.r))))];
    }
    vista().replaceChildren(h("div", { class: "in" }, h("section", { class: "panel estudio est-" + k },
      barraVolver(),
      h("div", { class: "panel-cab" }, h("span", { class: "eyebrow", text: "Estudios BiEx" }), h("h1", { class: "texto", text: pg.t }), pg.s ? h("p", { class: "est-sub", text: pg.s }) : null, nav,
        h("button", { class: "btn chico est-exp", type: "button", onclick: async () => { try { const r = await mdEstudio(k); await mdEntregar(r.nombre, r.texto); } catch (e) { avisar("No se pudo preparar la nota"); } } }, svg(ICO.descargar), h("span", { text: "Exportar a Obsidian (.md)" }))),
      pg.intro ? h("p", { class: "est-intro", text: pg.intro }) : null,
      cuerpo)));
    const el = foco && /^[efs]\d{1,2}$/.test(foco) ? document.getElementById(foco) : null;
    if (restaurando()) intentarRestaurar();
    else if (el) requestAnimationFrame(() => { el.scrollIntoView({ block: "start", behavior: "instant" }); const halo = h("span", { class: "sec-halo", "aria-hidden": "true" }); el.classList.add("sec-foco"); el.append(halo); setTimeout(() => { halo.remove(); el.classList.remove("sec-foco"); }, 2700); });
    else alTope();
  }
  // Textos de BiEx para el buscador: los estudios (cada dato, cada sección de las fechas, cada falacia) y los
  // acontecimientos de la línea del tiempo; así se encuentran sus temas, secciones y palabras
  let SECC = null;
  async function seccionesBiex() {
    if (SECC) return SECC;
    const E = EST || (EST = await cargar("datos/estudios.json"));
    const it = [], j = (ps) => (ps || []).join(" ");
    E.datos.items.forEach((x, i) => it.push({ t: x.t, k: j(x.p), s: E.datos.t, ruta: "#/datos/e" + (i + 1) }));
    E.fechas.secciones.forEach((x, i) => it.push({ t: x.t, k: j(x.p), s: E.fechas.t, ruta: "#/fechas/s" + (i + 1) }));
    it.push({ t: E.falacias.etica.t, k: j(E.falacias.etica.p), s: E.falacias.t, ruta: "#/falacias" });
    E.falacias.items.forEach((x, i) => it.push({ t: x.t + (x.l ? " (" + x.l + ")" : ""), k: [x.d, x.e, x.c].join(" "), s: E.falacias.t, ruta: "#/falacias/f" + (i + 1) }));
    for (const ev of (CRONO && CRONO.eventos) || []) it.push({ t: ev.t, k: ev.d || "", s: "Línea del tiempo · " + ev.f, ruta: "#/cronologia", r: ev.r });
    return (SECC = it);
  }
  async function vistaFuenteQ(foco) {
    document.title = "La fuente Q · BiEx";
    navActual("#/fuente-q");
    if (!QD) {
      vista().replaceChildren(h("div", { class: "in" }, cargando("Reuniendo los textos de Mattáy, Μᾶrκος y Lουκᾶς…")));
      try { QD = await cargar("datos/fuente_q.json"); } catch (e) { vista().replaceChildren(h("div", { class: "in" }, fallo("No se pudo cargar esta sección."))); return; }
      if (!/^#\/fuente-q/.test(rutaVista || "")) return;
    }
    const X = QD.textos;
    let bx = store.get("qBx", true), ord = store.get("qOrd", "lu"), sel = +foco || store.get("qSel", 1);
    const sec = (id, eyebrow, titulo, ...kids) => h("section", { class: "q-sec", id, "data-sec": eyebrow }, h("span", { class: "eyebrow", text: eyebrow }), h("h2", { class: "q-h2", text: titulo }), kids);
    const pars = (xs, cls) => xs.map((t) => h("p", { class: cls || "q-p" }, qTexto(t)));
    const ir = (id) => {
      const el = document.getElementById(id); if (!el) return;
      const hb = document.querySelector("header.barra"), tope = hb ? hb.offsetHeight : 0, disp = Math.max(120, window.innerHeight - tope - 20), r = el.getBoundingClientRect();
      const margen = r.height <= disp * 0.85 ? Math.round((disp - r.height) / 2) : Math.round(Math.min(40, disp * 0.08));
      const y = Math.max(0, r.top + window.scrollY - tope - Math.max(14, margen));
      try { window.scrollTo({ top: y, left: 0, behavior: quieto() ? "auto" : "smooth" }); } catch (e) { window.scrollTo(0, y); }
    };

    // 1. el problema: barras por libro con foco interactivo entre tramos y leyenda porcentual
    const par = (a, b) => [a, b].sort().join("-");
    const CLS = { "LUK-MAT": "dt", "MAT-MRK": "mm", "LUK-MRK": "ml" };
    const barras = h("div", { class: "q-barras" }, ["MAT", "MRK", "LUK"].map((c) => {
      const k = QD.cuentas[c], os = ["MAT", "MRK", "LUK"].filter((x) => x !== c);
      const segs = [["ambos", "En los tres", "tr"]].concat(os.map((o) => [o, "Solo con " + Q_LIB[o] + (CLS[par(c, o)] === "dt" ? " (doble tradición)" : ""), CLS[par(c, o)]]), [["propio", c === "MRK" ? "Solo en Μᾶrκος" : "Propio (" + (c === "MAT" ? "M" : "L") + ")", "pr"]]);
      const pc = (n) => (100 * (n || 0) / k.total);
      let fijoCl = null;
      const card = h("div", { class: "q-barra" });
      const marcarSeg = (cl) => {
        card.classList.toggle("foco", !!cl);
        for (const el of card.querySelectorAll(".q-tramo, .q-barra-ley li")) el.classList.toggle("act", !!cl && el.dataset.cl === cl);
      };
      const pista = h("div", { class: "q-pista", role: "img", "aria-label": Q_LIB[c] + ": " + segs.map(([kk, t]) => t + " " + Math.round(pc(k[kk])) + " %").join("; ") },
        segs.map(([kk, t, cl]) => {
          const cnt = k[kk] || 0, p = pc(cnt);
          return h("span", { class: "q-tramo q-" + cl + (p < 13 ? " angosto" : ""), "data-cl": cl, style: "flex:" + (p >= 8.5 ? Math.max(p, 11.5) : Math.max(p, 5.5)).toFixed(2) + " 1 0%", title: t + ": " + cnt + " versos (" + Math.round(p) + " %)",
            onpointerenter: () => marcarSeg(cl), onpointerleave: () => marcarSeg(fijoCl),
            onclick: () => { fijoCl = fijoCl === cl ? null : cl; marcarSeg(fijoCl); } },
          p >= 8.5 ? h("i", { text: Math.round(p) + " %" }) : null);
        }));
      const ley = h("ul", { class: "q-barra-ley" }, segs.map(([kk, t, cl]) => {
        const p = Math.round(pc(k[kk]));
        return h("li", { "data-cl": cl, title: t + ": " + (k[kk] || 0) + " versos (" + p + " %)",
          onpointerenter: () => marcarSeg(cl), onpointerleave: () => marcarSeg(fijoCl),
          onclick: () => { fijoCl = fijoCl === cl ? null : cl; marcarSeg(fijoCl); } },
        h("i", { class: "q-" + cl }), h("span", { class: "q-ley-t", text: t }), h("b", { text: String(k[kk] || 0) }), h("em", { text: p + " %" }));
      }));
      card.append(h("div", { class: "q-barra-cab" }, h("b", { text: Q_LIB[c] }), h("span", { text: k.total + " versos" })), pista, ley);
      return card;
    }));

    // 2. sinopsis de la doble tradición
    const lista = h("ol", { class: "q-lista" });
    const visor = h("div", { class: "q-visor", id: "q-visor", "aria-live": "polite" });
    const leySin = qLey([[2, "misma forma griega, en el mismo orden"], [1, "misma palabra con otra forma"], [0, "sin coincidencia"]]);
    const tgBx = h("label", { class: "q-tg" }, h("input", { type: "checkbox", checked: bx, onchange: (e) => { bx = e.target.checked; store.set("qBx", bx); mostrarPer(sel); } }), "Mostrar el texto BiEx");
    function llenarLista() {
      const xs = QD.per.slice().sort((a, b) => ord === "lit" ? b.lit - a.lit || a.id - b.id : a.id - b.id);
      lista.replaceChildren(...xs.map((p) => h("li", {}, h("button", { type: "button", class: "q-it", "aria-pressed": String(p.id === sel), "data-id": p.id, onclick: () => mostrarPer(p.id, true) },
        h("span", { class: "q-it-t", text: p.t }), h("span", { class: "q-it-r", text: "Q " + p.lu.replace(/^LUK /, "").split(";")[0] }),
        h("span", { class: "q-it-b", "aria-hidden": "true" }, h("i", { style: "width:" + p.lit + "%" })), h("span", { class: "q-it-n", text: p.lit + " %" })))));
    }
    function mostrarPer(id, desplazar) {
      const p = QD.per.find((x) => x.id === id) || QD.per[0];
      sel = p.id; store.set("qSel", sel);
      for (const b of $$(".q-it", lista)) b.setAttribute("aria-pressed", String(+b.dataset.id === sel));
      visor.replaceChildren(
        h("div", { class: "q-visor-cab" },
          h("h3", { text: p.t }),
          h("p", { class: "q-visor-r" }, qRefs(p.mt), h("span", { class: "q-sep", text: " · " }), qRefs(p.lu)),
          h("p", { class: "q-lit" }, h("b", { text: p.lit + " %" }), " de coincidencia literal", h("span", { class: "q-lit-n", text: " · " + p.n[0] + " y " + p.n[1] + " palabras" })),
          p.mk ? h("p", { class: "nota-ui q-sup" }, "Μᾶrκος tiene una versión más breve de este pasaje (", qRefs(p.mk), "): es uno de los lugares donde Μᾶrκος y Q se superponen.") : null),
        h("div", { class: "q-visor-ctl" }, leySin.cloneNode(true), tgBx),
        h("div", { class: "q-sin" }, qColumna("MAT", p.M, bx), qColumna("LUK", p.L, bx)),
        h("div", { class: "q-visor-pie" },
          h("button", { class: "btn chico", type: "button", disabled: !QD.per.some((x) => x.id === p.id - 1), onclick: () => mostrarPer(p.id - 1, true) }, svg(ICO.izq), "Anterior"),
          h("button", { class: "btn chico", type: "button", disabled: !QD.per.some((x) => x.id === p.id + 1), onclick: () => mostrarPer(p.id + 1, true) }, "Siguiente", svg(ICO.der))));
      if (desplazar) visor.scrollIntoView({ block: "start", behavior: quieto() ? "auto" : "smooth" });
    }
    const segOrd = h("div", { class: "seg", role: "group", "aria-label": "Ordenar" }, [["lu", "Orden de Lουκᾶς"], ["lit", "Mayor coincidencia"]].map(([k, t]) =>
      h("button", { type: "button", "aria-pressed": String(ord === k), onclick: (e) => { ord = k; store.set("qOrd", k); for (const b of e.currentTarget.parentNode.children) b.setAttribute("aria-pressed", String(b === e.currentTarget)); llenarLista(); } }, t)));

    // 3. el orden: cintas Bézier entre Mattáy (arriba) y Lουκᾶς (abajo) con inspector vivo y paso a paso (tanto Q como Μᾶrκος)
    const W = 1000, Y1 = 44, Y2 = 224, YM = (Y1 + Y2) / 2, x = (f) => (24 + f * (W - 48)).toFixed(1);
    const curva = (a, b) => { const x1 = x(a), x2 = x(b); return "M" + x1 + " " + (Y1 + 7) + " C" + x1 + " " + YM + " " + x2 + " " + YM + " " + x2 + " " + (Y2 - 7); };
    const ticks = (c, y, arriba) => QD.orden.caps[c].map(([n, f]) => '<line x1="' + x(f) + '" x2="' + x(f) + '" y1="' + (y - 6) + '" y2="' + (y + 6) + '" class="q-tk"/><text x="' + x(f) + '" y="' + (arriba ? y - 13 : y + 26) + '" class="q-tn">' + n + "</text>").join("");
    const capDeFrac = (c, f) => {
      const cs = QD.orden.caps[c] || []; let cap = 1;
      for (const [n, pos] of cs) { if (f + 1e-6 >= pos) cap = n; else break; }
      return cap;
    };
    const mapaOrden = svg('<g class="q-ejes"><line x1="24" x2="' + (W - 24) + '" y1="' + Y1 + '" y2="' + Y1 + '"/><line x1="24" x2="' + (W - 24) + '" y1="' + Y2 + '" y2="' + Y2 + '"/>' + ticks("MAT", Y1, true) + ticks("LUK", Y2, false) + "</g>" +
      '<g class="q-mk">' + QD.orden.mk.map(([a, b], idx) => '<path data-mk="' + idx + '" d="' + curva(a, b) + '"/>').join("") + "</g>" +
      '<g class="q-qq">' + QD.orden.q.map(([a, b, id]) => '<path data-id="' + id + '" d="' + curva(a, b) + '"/><circle data-id="' + id + '" cx="' + x(a) + '" cy="' + (Y1 + 7) + '" r="3.2"/><circle data-id="' + id + '" cx="' + x(b) + '" cy="' + (Y2 - 7) + '" r="3.2"/>').join("") + "</g>" +
      '<circle class="q-mk-pt q-mk-p1" cx="0" cy="' + (Y1 + 7) + '" r="4.8" visibility="hidden"/><circle class="q-mk-pt q-mk-p2" cx="0" cy="' + (Y2 - 7) + '" r="4.8" visibility="hidden"/>', "0 0 " + W + " 260");
    mapaOrden.removeAttribute("aria-hidden"); mapaOrden.setAttribute("role", "img");
    mapaOrden.setAttribute("aria-label", "Mapa del orden: arriba los capítulos de Mattáy, abajo los de Lουκᾶς. Las curvas azules (pasajes que siguen a Μᾶrκος) casi no se cruzan; las doradas (doble tradición) se cruzan muchas veces.");
    const idsOrden = [...new Set(QD.orden.q.map((r) => r[2]))], nMk = QD.orden.mk.length;
    const mkP1 = mapaOrden.querySelector(".q-mk-p1"), mkP2 = mapaOrden.querySelector(".q-mk-p2");
    const qMapa = new Map();
    for (const el of mapaOrden.querySelectorAll(".q-qq [data-id]")) { const k = +el.dataset.id; if (!qMapa.has(k)) qMapa.set(k, []); qMapa.get(k).push(el); }
    const mkPaths = [...mapaOrden.querySelectorAll(".q-mk [data-mk]")];
    let modoOrden = store.get("qVerOrden", "ambos");
    if (!["ambos", "mk", "q"].includes(modoOrden)) modoOrden = "ambos";
    let ordSel = null, ordFijo = null, prevAct = []; // { tipo: "q"|"mk", id: number }
    const fichaOrden = h("div", { class: "q-orden-ficha", "aria-live": "polite" });
    const contPaso = h("span", { text: "—" });
    const limpiarAct = () => {
      for (const el of prevAct) { el.classList.remove("act"); if (el.tagName === "circle") el.setAttribute("r", "3.2"); }
      prevAct = [];
      if (mkP1) mkP1.setAttribute("visibility", "hidden");
      if (mkP2) mkP2.setAttribute("visibility", "hidden");
    };
    const pintarFichaOrden = (selObj) => {
      ordSel = selObj;
      limpiarAct();
      const activo = !!selObj;
      cajaOrden.classList.toggle("con-sel", activo);
      if (!activo) {
        const esMk = modoOrden === "mk";
        contPaso.textContent = esMk ? nMk + " pasajes" : idsOrden.length + " pasajes";
        fichaOrden.replaceChildren(
          h("div", { class: "q-orden-ficha-tx" },
            h("b", { text: esMk ? "Explora los paralelos que siguen a Μᾶrκος" : "Explora los cruces entre Mattáy y Lουκᾶς" }),
            h("small", { text: esMk ? "Toca una curva azul o usa las flechas para recorrer los " + nMk + " pasajes cuyo orden paralelo viene de Μᾶrκος." : "Toca cualquier curva dorada o azul, o usa las flechas para aislar un pasaje y ver dónde lo ubica cada autor." })));
        return;
      }
      if (selObj.tipo === "mk") {
        const idx = selObj.id, par = QD.orden.mk[idx], el = mkPaths[idx];
        if (!par || !el) return pintarFichaOrden(null);
        el.classList.add("act"); prevAct = [el];
        if (mkP1 && mkP2) { mkP1.setAttribute("cx", x(par[0])); mkP1.setAttribute("visibility", "visible"); mkP2.setAttribute("cx", x(par[1])); mkP2.setAttribute("visibility", "visible"); }
        const cMat = capDeFrac("MAT", par[0]), cLuk = capDeFrac("LUK", par[1]);
        const dif = Math.abs(par[0] - par[1]);
        contPaso.textContent = (idx + 1) + " / " + nMk;
        fichaOrden.replaceChildren(
          h("div", { class: "q-orden-ficha-tx" },
            h("div", { class: "q-orden-ficha-cab" },
              h("b", { text: "Paralelo siguiendo a Μᾶrκος · #" + (idx + 1) }),
              h("span", { class: "q-orden-pct mk", text: "Sigue a Μᾶrκος" })),
            h("small", { text: "Mattáy cap. " + cMat + " · Lουκᾶς cap. " + cLuk + (dif < 0.08 ? " · mismo orden relativo" : " · ligero desplazamiento narrativo") })),
          h("div", { class: "q-orden-ficha-acc par" },
            h("a", { class: "btn chico", href: "#/MAT/" + cMat }, svg(ICO.libro), h("span", { text: "Mattáy " + cMat })),
            h("a", { class: "btn chico", href: "#/LUK/" + cLuk }, svg(ICO.libro), h("span", { text: "Lουκᾶς " + cLuk }))));
        return;
      }
      const id = selObj.id, els = qMapa.get(id) || [];
      for (const el of els) { el.classList.add("act"); if (el.tagName === "circle") el.setAttribute("r", "5"); }
      prevAct = els;
      const idx = idsOrden.indexOf(id);
      contPaso.textContent = idx >= 0 ? (idx + 1) + " / " + idsOrden.length : idsOrden.length + " pasajes";
      const p = QD.per.find((q) => q.id === id);
      if (!p) return pintarFichaOrden(null);
      fichaOrden.replaceChildren(
        h("div", { class: "q-orden-ficha-tx" },
          h("div", { class: "q-orden-ficha-cab" },
            h("b", { text: p.t }),
            h("span", { class: "q-orden-pct", text: p.lit + " % literal" })),
          h("small", { text: "Mattáy " + p.mt.replace(/^MAT /, "") + " · Lουκᾶς " + p.lu.replace(/^LUK /, "") })),
        h("div", { class: "q-orden-ficha-acc" },
          h("button", { type: "button", class: "btn chico oro", onclick: () => mostrarPer(p.id, true) }, svg(ICO.sinopsis), h("span", { text: "Ver en columnas" }))));
    };
    const pasoOrden = (dir) => {
      const usarMk = modoOrden === "mk" || (modoOrden === "ambos" && ordFijo && ordFijo.tipo === "mk");
      if (usarMk) {
        if (!nMk) return;
        const i = ordFijo && ordFijo.tipo === "mk" ? ordFijo.id : (dir > 0 ? -1 : 0);
        ordFijo = { tipo: "mk", id: (i + dir + nMk) % nMk };
        pintarFichaOrden(ordFijo);
        return;
      }
      if (!idsOrden.length) return;
      const i = ordFijo && ordFijo.tipo === "q" ? idsOrden.indexOf(ordFijo.id) : (dir > 0 ? -1 : 0);
      ordFijo = { tipo: "q", id: idsOrden[(i + dir + idsOrden.length) % idsOrden.length] };
      pintarFichaOrden(ordFijo);
    };
    const leerObjetivo = (t) => {
      const l = t && t.closest && t.closest("[data-id], [data-mk]");
      if (!l) return null;
      if (l.dataset.id != null) return { tipo: "q", id: +l.dataset.id };
      if (l.dataset.mk != null) return { tipo: "mk", id: +l.dataset.mk };
      return null;
    };
    mapaOrden.addEventListener("click", (e) => {
      const ob = leerObjetivo(e.target);
      if (!ob) { ordFijo = null; pintarFichaOrden(null); return; }
      if (ordFijo && ordFijo.tipo === ob.tipo && ordFijo.id === ob.id) {
        if (ob.tipo === "q") mostrarPer(ob.id, true);
        else { ordFijo = null; pintarFichaOrden(null); }
      } else { ordFijo = ob; pintarFichaOrden(ob); }
    });
    mapaOrden.addEventListener("pointerover", (e) => { if (e.pointerType !== "mouse") return; const ob = leerObjetivo(e.target); if (ob) pintarFichaOrden(ob); });
    mapaOrden.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") pintarFichaOrden(ordFijo); });
    const cajaOrden = h("div", { class: "q-orden ver-" + modoOrden },
      h("div", { class: "q-orden-bar" },
        h("div", { class: "q-orden-ley" },
          h("span", {}, h("i", { class: "l-mk" }), "Sigue a Μᾶrκος"),
          h("span", {}, h("i", { class: "l-q" }), "Doble tradición (Q)")),
        h("div", { class: "q-orden-paso" },
          h("button", { type: "button", class: "btn-icono", "aria-label": "Pasaje anterior en el mapa", title: "Pasaje anterior", onclick: () => pasoOrden(-1) }, svg(ICO.izq)),
          contPaso,
          h("button", { type: "button", class: "btn-icono", "aria-label": "Siguiente pasaje en el mapa", title: "Siguiente pasaje", onclick: () => pasoOrden(1) }, svg(ICO.der)))),
      h("div", { class: "q-orden-et" }, h("span", { text: "Mattáy · capítulos" }), h("small", { text: "cap. 1 → 28" })),
      h("div", { class: "q-orden-mapa" }, mapaOrden),
      h("div", { class: "q-orden-et" }, h("span", { text: "Lουκᾶς · capítulos" }), h("small", { text: "cap. 1 → 24" })));
    pintarFichaOrden(null);
    const segOrden = h("div", { class: "seg q-orden-seg", role: "group", "aria-label": "Qué mostrar" }, [["ambos", "Todo"], ["mk", "Lo que sigue a Μᾶrκος"], ["q", "Doble tradición"]].map(([k, t]) =>
      h("button", { type: "button", "aria-pressed": String(modoOrden === k), onclick: (e) => {
        modoOrden = k; store.set("qVerOrden", k);
        if ((k === "mk" && ordFijo && ordFijo.tipo !== "mk") || (k === "q" && ordFijo && ordFijo.tipo !== "q")) ordFijo = null;
        cajaOrden.className = "q-orden ver-" + k;
        pintarFichaOrden(ordFijo);
        for (const b of e.currentTarget.parentNode.children) b.setAttribute("aria-pressed", String(b === e.currentTarget));
      } }, t)));

    // 4 y 5. argumentos
    const bloqueCorto = ({ r, B }) => h("div", { class: "q-corto" }, h("div", { class: "q-corto-r" }, qRefs(r)), B.map(([c, cap, v, ws, L]) => h("div", { class: "q-v" },
      h("p", { class: "q-g", lang: "grc" }, ws.map(([g, k, p], i) => [i ? " " : null, h("span", { "data-gk": g }, gk(g)), punt(p) || null])),
      bx && L ? h("p", { class: "q-bx" }, txtVersoL(L)) : null)));
    const selector = (items, pintar, etiqueta) => {
      const caja = h("div", { class: "q-sel-caja" });
      const botones = h("div", { class: "q-chips", role: "group", "aria-label": etiqueta }, items.map((it, i) => h("button", { type: "button", class: "q-chip", "aria-pressed": String(i === 0), onclick: (e) => { for (const b of e.currentTarget.parentNode.children) b.setAttribute("aria-pressed", String(b === e.currentTarget)); caja.replaceChildren(pintar(it)); } }, it.t)));
      caja.append(pintar(items[0]));
      return h("div", { class: "q-sel" }, botones, caja);
    };
    const anexo = {
      lit: () => h("ol", { class: "q-top" }, QD.per.slice().sort((a, b) => b.lit - a.lit).slice(0, 6).map((p) => h("li", {}, h("button", { type: "button", class: "q-link", onclick: () => mostrarPer(p.id, true) }, h("span", { text: p.t }), h("b", { text: p.lit + " %" }))))),
      orden: () => h("button", { type: "button", class: "btn chico", onclick: () => ir("q-orden") }, svg(ICO.seguir), "Ver el mapa del orden"),
      dob: () => selector(QD.dobletes, (d) => h("div", { class: "q-dob" },
        h("div", { class: "q-dob-g" }, h("h4", { text: "Siguiendo a Μᾶrκος" }), d.mk.map(bloqueCorto)),
        h("div", { class: "q-dob-g dt" }, h("h4", { text: "En la doble tradición" }), d.q.map(bloqueCorto))), "Dobletes"),
      men: () => h("div", {}, qLey([[3, "Mattáy y Lουκᾶς coinciden en esa forma y Μᾶrκος no la tiene"], [2, "misma forma que en el otro libro"], [1, "misma palabra con otra forma"]]),
        selector(QD.menores, (m) => h("div", { class: "q-tri" }, qColumna("MRK", m.K, bx), qColumna("MAT", m.M, bx), qColumna("LUK", m.L, bx)), "Acuerdos menores")),
      sup: () => h("div", { class: "q-chips" }, QD.per.filter((p) => p.mk).map((p) => h("button", { type: "button", class: "q-chip", onclick: () => mostrarPer(p.id, true) }, p.t))),
    };
    const tarjetas = (xs, cls) => h("div", { class: "q-args " + cls }, xs.map(([t, d, k]) => h("article", { class: "tarjeta q-arg" + (k === "dob" || k === "men" ? " ancho" : "") }, h("h3", { text: t }), h("p", {}, qTexto(d)), k && anexo[k] ? anexo[k]() : null)));

    // 6. hipótesis: diagrama de flechas
    const NODO = { MRK: [250, 60], Q: [750, 60], MAT: [250, 250], LUK: [750, 250], M: [70, 250], L: [930, 250] };
    const diag = (hp) => {
      const usados = new Set(hp.fl.flat());
      const flecha = ([a, b]) => { const [x1, y1] = NODO[a], [x2, y2] = NODO[b], dx = x2 - x1, dy = y2 - y1, d = Math.hypot(dx, dy), r = 54; return '<line x1="' + (x1 + dx * r / d).toFixed(1) + '" y1="' + (y1 + dy * r / d).toFixed(1) + '" x2="' + (x2 - dx * (r + 8) / d).toFixed(1) + '" y2="' + (y2 - dy * (r + 8) / d).toFixed(1) + '" marker-end="url(#q-punta)"/>'; };
      const nodo = (k) => { const [cx, cy] = NODO[k], hip = k === "Q" || k === "M" || k === "L"; return '<g class="q-n' + (hip ? " hip" : "") + '"><circle cx="' + cx + '" cy="' + cy + '" r="50"/><text x="' + cx + '" y="' + (cy + 7) + '">' + Q_LIB[k] + "</text></g>"; };
      const s = svg('<defs><marker id="q-punta" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="9" markerHeight="9" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="currentColor"/></marker></defs><g class="q-fl">' + hp.fl.map(flecha).join("") + "</g>" + Object.keys(NODO).filter((k) => usados.has(k)).map(nodo).join(""), "0 0 " + W + " 310");
      s.removeAttribute("aria-hidden"); s.setAttribute("role", "img"); s.setAttribute("aria-label", hp.t + ": " + hp.fl.map(([a, b]) => Q_LIB[a] + " hacia " + Q_LIB[b]).join(", "));
      return s;
    };
    const cajaHip = h("div", { class: "q-hip-caja" });
    const pintarHip = (hp) => cajaHip.replaceChildren(h("div", { class: "q-hip-d" }, diag(hp)), h("div", { class: "q-hip-t" },
      h("h3", {}, hp.t, h("small", { text: hp.s })), h("p", { text: hp.d }), h("p", { class: "nota-ui", text: hp.quien }),
      h("dl", {}, h("dt", { text: "A su favor" }), h("dd", { text: hp.bien }), h("dt", { text: "Su dificultad" }), h("dd", { text: hp.mal }))));
    const ROM_H = ["I", "II", "III", "IV", "V"];
    const segHip = h("div", { class: "q-chips", role: "group", "aria-label": "Hipótesis" }, X.hipotesis.map((hp, i) => h("button", { type: "button", class: "q-chip", "aria-pressed": String(i === 0), onclick: (e) => { for (const b of e.currentTarget.parentNode.children) b.setAttribute("aria-pressed", String(b === e.currentTarget)); pintarHip(hp); } }, h("span", { class: "q-hip-n", "aria-hidden": "true", text: ROM_H[i] || String(i + 1) }), h("span", { text: hp.t }))));
    pintarHip(X.hipotesis[0]);

    const indice = [["q-problema", "El problema"], ["q-sinopsis", "Sinopsis"], ["q-orden", "El orden"], ["q-favor", "A favor"], ["q-contra", "En contra"], ["q-hip", "Hipótesis"], ["q-cont", "Qué contendría"], ["q-hist", "Historia"]];
    vista().replaceChildren(h("div", { class: "in" }, h("section", { class: "panel q-pag" },
      barraVolver(),
      h("div", { class: "panel-cab" }, h("span", { class: "eyebrow", text: "Mattáy, Μᾶrκος y Lουκᾶς · el problema sinóptico" }), h("h1", { class: "texto", text: "La fuente Q" }),
        pars(X.lead, "q-lead"), h("p", { class: "q-aviso" }, X.aviso),
        h("nav", { class: "q-indice", "aria-label": "En esta página" }, indice.map(([id, t]) => h("button", { type: "button", class: "q-chip", onclick: () => ir(id) }, t)))),
      guiaSeccion("fuente-q"),
      sec("q-problema", "1 · El problema", "Tres relatos que se conocen entre sí", pars(X.problema), h("ul", { class: "q-puntos" }, X.puntos.map((t) => h("li", {}, qTexto(t)))), barras,
        h("p", { class: "nota-ui", text: "Cálculo automático: un verso cuenta como paralelo cuando comparte con otro verso varias palabras griegas o frases breves; los versos sueltos dentro de un pasaje paralelo también cuentan. Es una aproximación." })),
      sec("q-sinopsis", "2 · La doble tradición", "Mattáy y Lουκᾶς, palabra por palabra", pars(X.sinopsis),
        h("div", { class: "q-sin-ctl" }, segOrd, h("span", { class: "nota-ui", text: X.ley_lit })),
        h("div", { class: "q-sin-zona" }, lista, visor), h("p", { class: "nota-ui q-nota-bx", text: X.nota_bx })),
      sec("q-orden", "3 · El orden", "Dónde coloca cada uno lo que comparten", pars(X.orden), h("div", { class: "q-orden-ctl" }, segOrden), cajaOrden, fichaOrden),
      sec("q-favor", "4 · A favor de Q", "Por qué tantos especialistas la aceptan", tarjetas(X.favor, "favor")),
      sec("q-contra", "5 · En contra de Q", "Por qué otros prefieren prescindir de ella", tarjetas(X.contra, "contra")),
      sec("q-hip", "6 · Las hipótesis", "Cinco maneras de explicar los mismos datos", segHip, cajaHip),
      sec("q-cont", "7 · Qué contendría Q", "Una colección de dichos", pars(X.contenido), h("div", { class: "q-chips q-todos" }, QD.per.map((p) => h("button", { type: "button", class: "q-chip", onclick: () => mostrarPer(p.id, true) }, p.t)))),
      sec("q-hist", "8 · Historia", "Una pregunta de casi dos mil años", h("ol", { class: "q-hist" }, X.historia.map(([f, t, g]) => h("li", {}, h("span", { class: "q-hist-f", text: f }), h("div", {}, h("p", {}, t), g ? h("blockquote", { class: "q-cita", lang: "grc", text: g }) : null))))),
      h("section", { class: "q-sec q-cierre", "data-sec": "¿Y entonces?" }, h("h2", { class: "q-h2", text: "¿Y entonces?" }), pars(X.cierre)))));
    llenarLista();
    mostrarPer(QD.per.some((p) => p.id === sel) ? sel : 1);
    if (foco && !restaurando()) requestAnimationFrame(() => ir("q-visor"));
    else alTope();
  }
  // En la ventana de un verso de Mattáy o Lουκᾶς: si pertenece a la doble tradición, un acceso a su sinopsis
  function enlaceFuenteQ(c, cap, v) {
    const zona = h("div", { class: "bloque q-en-verso", hidden: true });
    if (c !== "MAT" && c !== "LUK") return zona;
    (QIDX ? Promise.resolve(QIDX) : cargar("datos/fuente_q_idx.json").then((x) => (QIDX = x))).then((ix) => {
      const id = ix[c + " " + cap + ":" + v];
      if (!id) return;
      zona.hidden = false;
      zona.append(h("h4", { text: "En la doble tradición (fuente Q)" }), h("p", { class: "nota-ui", text: "Este verso tiene un paralelo en " + (c === "MAT" ? "Lουκᾶς" : "Mattáy") + " que no está en Μᾶrκος." }),
        h("a", { class: "btn chico", href: "#/fuente-q/" + id }, svg(ICO.sinopsis), "Ver los dos en columnas"));
    }).catch(() => {});
    return zona;
  }

  // ------------------------------------------------------------------ explorar por nivel
  const NIVEL_TXT = { exacto: "Versos que el autor da por exactos, siempre abiertos a ajustes.", casi: "Versos con la traducción casi terminada.", revision: "Versos con traducción completa que el autor está revisando.", borrador: "Versos con una primera traducción del autor.", base: "Versos que aún se leen como texto base, palabra por palabra." };
  async function vistaNiveles(nivel, lib) {
    document.title = "Explorar por nivel · BiEx";
    navActual("#/niveles");
    alTope();
    const tot = { exacto: 0, casi: 0, revision: 0, borrador: 0, base: 0 };
    for (const b of D.libros) for (const k in tot) tot[k] += (b.conteo || {})[k] || 0;
    const total = Object.values(tot).reduce((a, x) => a + x, 0) || 1;
    const tarjetas = h("div", { class: "niv-tarjetas", "data-sec": "Niveles" }, ["exacto", "casi", "revision", "borrador", "base"].map((k) => h("a", { class: "niv-t n-" + k + (nivel === k ? " sel" : ""), href: "#/niveles/" + k, "aria-current": nivel === k ? "true" : null },
      h("span", { class: "niv-k" }, h("i"), estadoEt(k)), h("b", { text: fmt(tot[k]) }), h("small", { text: pct(100 * tot[k] / total) + " de los versos" }), h("p", { text: NIVEL_TXT[k] }))));
    const cuerpo = h("div", { class: "niv-cuerpo" });
    vista().replaceChildren(h("div", { class: "in" }, h("section", { class: "panel" },
      barraVolver(),
      h("div", { class: "panel-cab" }, h("span", { class: "eyebrow", text: "Avance de la traducción" }), h("h1", { class: "texto", text: "Explorar por nivel" }),
        h("p", { class: "nota-ui", text: "Elige un nivel para ver sus versos en toda la Nueva Voluntad. Ningún verso se da por terminado: la traducción sigue siempre abierta a ajustes." })),
      tarjetas, cuerpo)));
    if (!nivel || !tot[nivel]) { if (nivel) cuerpo.replaceChildren(h("p", { class: "vacio", text: "Todavía no hay versos en el nivel «" + estadoEt(nivel) + "». Aparecerán aquí a medida que avance la traducción." })); return; }
    const libros = librosEnOrden().filter((b) => (b.conteo || {})[nivel] > 0);
    const selLib = lib && libros.find((b) => b.c === lib) ? lib : libros[0].c;
    const pestañas = h("div", { class: "niv-libros", "data-sec": "Libros" }, libros.map((b) => h("a", { href: "#/niveles/" + nivel + "/" + b.c, "aria-current": b.c === selLib ? "true" : null }, (b.t || b.n) + " · " + fmt(b.conteo[nivel]))));
    const lista = h("div", { class: "niv-lista" }, cargando());
    cuerpo.replaceChildren(pestañas, lista);
    try {
      const Lc = await lectura(selLib), b = libroDe(selLib);
      const out = [];
      for (const [cap, vs] of Object.entries(Lc.caps)) {
        const xs = vs.filter((x) => x.n === nivel);
        if (!xs.length) continue;
        out.push(h("h3", { class: "niv-cap", "data-sec": "Capítulo " + cap }, h("a", { href: "#/" + selLib + "/" + cap, text: nombreLibro(b) + " " + cap }), h("small", { text: xs.length + " de " + vs.length + " versos" })));
        out.push(h("div", { class: "lectura niv-vs" }, xs.map((x) => h("a", { class: "vl n-" + x.n, href: "#/" + selLib + "/" + cap + "/l/" + x.v }, h("span", { class: "vn", text: x.v }), h("span", { class: "vt" }, txtVersoL(x))))));
      }
      lista.replaceChildren(...out);
    } catch (e) { lista.replaceChildren(fallo("No se pudo cargar el libro.")); }
  }

  // ------------------------------------------------------------------ guía animada
  // Pensada también para personas neurodivergentes: cada paso es una escena en movimiento con una frase breve; avanza sola
  // (o a mano), se puede pausar, se puede escuchar en voz alta y respeta «Sin animaciones» (entonces muestra cada escena quieta).
  const PASOS_GUIA = [
    { t: "La biblioteca", d: "Desliza el dedo por la franja: verás el nombre originario de cada libro. Suelta para abrirlo.", e: "franja", ir: ["Ir a la biblioteca", "#/libros"] },
    { t: "En orden cronológico", d: "Los libros aparecen según los acontecimientos y la fecha en que se escribieron. Puedes cambiar el orden cuando quieras.", e: "orden", ir: ["Ver los libros", "#/libros"] },
    { t: "Leer un capítulo", d: "Toca un verso y se abre su griego, palabra por palabra.", e: "verso", ir: ["Leer Μᾶrκος [Marcos] 1", "#/MRK/1"] },
    { t: "Cada palabra, a fondo", d: "Toca una palabra: su forma, su transliteración, su lema, su tiempo y su caso, y todas las veces que aparece.", e: "palabra", ir: ["Analizar Μᾶrκος [Marcos] 1", "#/MRK/1/a"] },
    { t: "Lee a tu manera", d: "Con los colores de la edición BiEx, con todas las ampliaciones, solo la primera o solo la palabra base.", e: "corchetes", ir: ["Opciones del texto", "opciones"] },
    { t: "Busca como lo recuerdes", d: "Escribe una escena, un nombre, una cita o una pregunta. El buscador entiende aunque no uses las palabras exactas.", e: "buscar", ir: ["Probar el buscador", "?q=cuando calmó la tormenta"] },
    { t: "Los manuscritos más antiguos", d: "Observa cada verso en los papiros y códices: qué dicen, en qué difieren y su escritura letra por letra.", e: "ms", ir: ["Ver Μᾶrκος [Marcos] 1:1", "#/MRK/1/l/1/m"] },
    { t: "La línea del tiempo", d: "Qué sucedió y cuándo se escribió cada libro: todo, antes de la destrucción del templo en el año 70.", e: "tiempo", ir: ["Abrir la línea del tiempo", "#/cronologia"] },
    { t: "A tu medida", d: "Letra más grande, letra para dislexia, más espacio entre líneas, tema claro u oscuro y sin animaciones: todo en el botón «Aa».", e: "aa", ir: ["Lectura y apariencia", "apariencia"] },
  ];
  const DUR_PASO = 8.5;
  const quieto = () => ap.mov === "no" || (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  // Cada escena devuelve tick(t) (t en segundos desde que empezó el paso)
  const ESCENAS = {
    franja(el) {
      const L = librosEnOrden();
      const barras = h("div", { class: "gf-barras" }, L.map((b) => h("i", { style: "flex:" + (b.nPal || b.total) + " 1 0;--h:" + Math.max(18, Math.min(100, b.palabras)) + "%" })));
      const dedo = h("span", { class: "g-dedo" }), burbuja = h("span", { class: "gf-burbuja" });
      el.append(h("div", { class: "gf" }, burbuja, barras, dedo));
      return (t) => {
        const u = t >= 99 ? 0.45 : Math.min(1, Math.max(0, (t - 0.6) / 4.6));
        const x = 0.04 + u * 0.92, px = x * barras.clientWidth;
        let k = 0; for (let i = 0; i < barras.children.length; i++) { const c = barras.children[i]; if (px >= c.offsetLeft) k = i; }
        dedo.style.left = (x * 100) + "%"; burbuja.style.left = (x * 100) + "%";
        dedo.classList.toggle("toca", t > 0.6 && t < 5.4 || t >= 99);
        [...barras.children].forEach((b, i) => b.classList.toggle("on", i === k));
        const b = L[k]; burbuja.replaceChildren(h("b", { text: b.t || b.n }), h("small", { text: tradQ(b) }));
        el.classList.toggle("abre", t > 5.6 && t < 99);
      };
    },
    orden(el) {
      const ords = [["crono", "Χrοnοlόgικο"], ["escritura", "Por escritura"], ["tradicional", "Tradicional"]].filter(([k]) => k === "tradicional" || (CRONO && CRONO.ordenes[k]));
      const chips = h("div", { class: "go-chips" }, ords.map(([, t]) => h("span", { text: t })));
      const lista = h("div", { class: "go-lista" });
      el.append(h("div", { class: "go" }, chips, lista));
      let ult = -1;
      return (t) => {
        const k = t >= 99 ? 0 : Math.floor(t / 2.8) % ords.length;
        if (k === ult) return; ult = k;
        [...chips.children].forEach((c, i) => c.classList.toggle("on", i === k));
        const o = ords[k][0], LO = o === "tradicional" ? D.libros : CRONO.ordenes[o].map(libroDe);
        lista.replaceChildren(...LO.slice(0, 4).map((b, i) => h("span", { style: "--i:" + i }, h("em", { text: String(i + 1).padStart(2, "0") }), h("b", {}, b.t || b.n, b.t ? h("i", { text: tradQ(b) }) : null), fechaEscrito(b) ? h("small", { text: "c. " + fechaEscrito(b).replace(/^c\. /, "") }) : null)));
      };
    },
    verso(el) {
      const ws = (D.portada && D.portada.p ? D.portada.p : []).slice(0, 4);
      const lineas = h("div", { class: "gv-lineas" }, [0, 1, 2].map((i) => h("div", { class: "gv-l" }, h("em", { text: String(i + 1) }), h("span", {}, h("i"), h("i"), h("i")))));
      const hoja = h("div", { class: "gv-hoja" }, h("i", { class: "gv-asa" }), h("div", { class: "gv-ws" }, ws.map((w) => h("span", { class: "gv-w" }, h("b", { lang: "grc", text: w.g }), h("small", { text: glosa(w.tr)[0] })))));
      const dedo = h("span", { class: "g-dedo" });
      el.append(h("div", { class: "gv" }, lineas, hoja, dedo));
      return (t) => {
        const tocado = t >= 99 || t > 1.6;
        dedo.classList.toggle("toca", t > 1.4 && t < 2.2);
        dedo.style.opacity = t >= 99 || t > 3 ? "0" : "1";
        lineas.children[1].classList.toggle("on", tocado);
        hoja.classList.toggle("on", t >= 99 || t > 2.1);
      };
    },
    palabra(el) {
      const w = (D.portada && D.portada.p && D.portada.p[0]) || { g: "Ἐν", tr: "en" };
      const carta = h("div", { class: "gp-carta" },
        h("div", { class: "gp-cara" }, h("b", { lang: "grc", text: w.g }), h("small", { text: glosa(w.tr)[0] })),
        h("div", { class: "gp-dorso" }, ["forma", "transliteración", "lema", "tiempo y caso", "apariciones"].map((x, i) => h("span", { style: "--i:" + i, text: x }))));
      el.append(h("div", { class: "gp" }, carta));
      return (t) => carta.classList.toggle("vuelta", t >= 99 || t > 1.8);
    },
    corchetes(el, marcas) {
      // cada estado entra cuando la voz lo nombra: el verso sin colores → con los colores de la edición → todas las
      // ampliaciones → solo la primera → solo la palabra base (marcas de `voz/marcas.json`; sin voz, un reparto fijo)
      const txt = h("p", { class: "gc-tx vt" });
      const modo = h("div", { class: "gc-seg" }, ["Todas", "La primera", "Solo la base"].map((x) => h("span", { text: x })));
      const caja = h("div", { class: "gc" }, modo, txt);
      el.append(caja);
      let L = null, ult = "";
      lectura("MRK").then((Lc) => { L = (Lc.caps[2] || []).find((x) => x.v === 5) || null; ult = ""; }).catch(() => {});
      const ESTADOS = [["todas", false, -1], ["todas", true, -1], ["todas", true, 0], ["primera", true, 1], ["base", true, 2]];
      const FIJAS = [0, 1.3, 3.3, 4.9, 6.3];
      return (t) => {
        const m = (marcas && marcas()) || FIJAS;
        let k = 0; for (let i = 0; i < m.length && i < ESTADOS.length; i++) if (t >= m[i] - .08) k = i;
        if (t >= 99) k = 3;
        const clave = k + (L ? "L" : "");
        if (clave === ult) return; ult = clave;
        const [cor, colores, seg] = ESTADOS[k];
        [...modo.children].forEach((c, i) => c.classList.toggle("on", i === seg));
        caja.classList.toggle("gc-sin", !colores);
        if (!L) { txt.textContent = "…"; return; }
        corForzado = cor;
        try { txt.replaceChildren(txtVerso(L)); } finally { corForzado = null; }
        txt.classList.remove("cambia"); void txt.offsetWidth; txt.classList.add("cambia");
      };
    },
    buscar(el) {
      const frase = "cuando calmó la tormenta";
      const campo = h("div", { class: "gb-campo" }, svg(ICO.buscar), h("span", { class: "gb-tx" }), h("span", { class: "gb-cursor" }));
      const res = h("div", { class: "gb-res" }, h("span", { class: "gb-r" }, h("small", { text: "Escena" }), h("b", { text: "La tempestad calmada" })), h("span", { class: "gb-r" }, h("small", { text: "Verso" }), h("b", { text: "Μᾶrκος [Marcos] 4:39" })));
      el.append(h("div", { class: "gb" }, campo, res));
      return (t) => {
        const n = t >= 99 ? frase.length : Math.max(0, Math.min(frase.length, Math.floor((t - 0.5) * 9)));
        campo.querySelector(".gb-tx").textContent = frase.slice(0, n);
        res.classList.toggle("on", t >= 99 || t > 0.5 + frase.length / 9 + 0.4);
      };
    },
    ms(el) {
      const tes = [["𝔓⁷⁵", 210], ["ℵ", 350], ["B", 350], ["W", 410], ["D", 410]];
      const eje = h("div", { class: "gm-eje" }, tes.map(([s, a], i) => h("span", { style: "left:" + ((a - 150) / 300 * 100) + "%;--i:" + i, text: s })), ["s. III", "s. IV", "s. V"].map((x, i) => h("em", { style: "left:" + (16.7 + i * 33.3) + "%", text: x })));
      const linea = h("div", { class: "gm-l", lang: "grc" }, "ἀρχὴ τοῦ εὐαγγελίου ", h("span", { class: "gm-v", text: "υἱοῦ θεοῦ" }));
      el.append(h("div", { class: "gm" }, eje, linea, h("p", { class: "gm-n", text: "ℵ*: omite «υἱοῦ θεοῦ»" })));
      return (t) => { el.classList.toggle("p1", t >= 99 || t > 0.4); el.classList.toggle("p2", t >= 99 || t > 2.6); };
    },
    tiempo(el) {
      const marcas = [[-6, "c. 6 " + ERA_A], [30, "c. 30"], [50, "50"], [70, "70 " + ERA_D]];
      const eje = h("div", { class: "gt-eje" }, marcas.map(([a, x]) => h("span", { class: a === 70 ? "clave" : "", style: "left:" + ((a + 8) / 80 * 100) + "%", text: x })), h("i", { class: "gt-cursor" }));
      el.append(h("div", { class: "gt" }, eje, h("p", { class: "gt-n", text: "Año 70: destrucción del templo" })));
      return (t) => {
        const u = t >= 99 ? 1 : Math.min(1, Math.max(0, (t - 0.4) / 4.8));
        eje.querySelector(".gt-cursor").style.left = (((-6 + u * 76) + 8) / 80 * 100) + "%";
        el.classList.toggle("llega", u >= 1);
      };
    },
    aa(el, marcas) {
      // cada estado entra cuando la narración lo nombra (marcas de tiempo de la grabación; sin voz, un reparto fijo)
      const btn = h("span", { class: "ga-btn" }, "A", h("small", { text: "a" }));
      const et = h("span", { class: "ga-et" });
      const tx = h("p", { class: "ga-tx" }, "En el principio estaba el discurso,", h("br"), "y el discurso estaba ante Dios.");
      el.append(h("div", { class: "ga" }, h("div", { class: "ga-fila" }, btn, et), tx));
      const estados = [["", "Normal"], ["grande", "Letra más grande"], ["dislexia", "Letra para dislexia"], ["amplio", "Más espacio entre líneas"], ["claro", "Tema claro"], ["oscuro", "Tema oscuro"], ["quieto", "Sin animaciones"], ["boton", "Todo en «Aa»"]];
      const FIJAS = [0, 1.1, 2.2, 3.4, 4.7, 5.5, 6.3, 7.2];
      let previo = -1;
      return (t) => {
        const m = (marcas && marcas()) || FIJAS;
        let k = 0; for (let i = 0; i < m.length && i < estados.length; i++) if (t >= m[i] - .08) k = i;
        if (t >= 99) k = 7;
        if (k === previo) return; previo = k;
        el.dataset.e = estados[k][0]; et.textContent = estados[k][1];
        btn.classList.toggle("on", k === 7 || k === 1);
      };
    },
  };
  // Narración de la guía: grabada con una voz neuronal (voz/<voz>/<paso>.mp3), igual en todos los dispositivos.
  const VOCES_GUIA = [["dora", "Voz femenina"], ["alex", "Voz masculina"]];
  function abrirGuia(inicio) {
    let k = Math.max(0, Math.min(PASOS_GUIA.length - 1, inicio || 0)), t0 = performance.now(), pausa = quieto(), voz = !!store.get("guiaVoz", false), raf = 0, tick = null, transcurrido = 0;
    const escena = h("div", { class: "g-escena", "aria-hidden": "true" });
    const tit = h("h3", { class: "g-tit" }), desc = h("p", { class: "g-desc" }), num = h("span", { class: "g-num" });
    const barra = h("div", { class: "g-prog" }, h("i"));
    const puntos = h("div", { class: "g-puntos", role: "tablist", "aria-label": "Pasos de la guía" }, PASOS_GUIA.map((p, i) => h("button", { type: "button", role: "tab", "aria-label": "Paso " + (i + 1) + ": " + p.t, onclick: () => ir(i) })));
    const btnPausa = h("button", { class: "btn-icono", type: "button" });
    const btnVoz = h("button", { class: "btn chico", type: "button" });
    const btnIr = h("button", { class: "btn chico oro", type: "button" });
    const textoG = h("div", { class: "g-texto", "aria-live": "polite" }, num, tit, desc);
    // con voz, el paso dura lo que dura su narración y una pausa breve; el reloj de la animación arranca cuando la voz empieza a
    // sonar, así imagen y voz van juntas. Sin voz, el tiempo fijo.
    const audio = new Audio(); audio.preload = "auto";
    // Notificación de medios del sistema (BiEx, 13-nov-2026): mientras suena la guía, la notificación lleva el ícono y el nombre
    // de BiEx como imagen principal (el navegador añade su ícono pequeño; instalada como app, sale solo el de BiEx).
    const fichaMedios = (titulo) => {
      try {
        if (!("mediaSession" in navigator) || typeof MediaMetadata === "undefined") return;
        const ms = navigator.mediaSession, base = BASES[baseOk];
        ms.metadata = titulo ? new MediaMetadata({ title: titulo, artist: "BiEx – Biblia Exacta", album: "Biblia Exacta", artwork: [96, 192, 1024].map((s) => ({ src: new URL(base + "icono/icon-" + s + ".png", location.href).href, sizes: s + "x" + s, type: "image/png" })) }) : null;
        ms.setActionHandler("pause", titulo ? () => { if (!pausa) btnPausa.onclick(); } : null);
        ms.setActionHandler("play", titulo ? () => { if (pausa) btnPausa.onclick(); } : null);
      } catch (e) { /* nada */ }
    };
    let vozNom = store.get("guiaVozN", "dora"); if (!VOCES_GUIA.some((v) => v[0] === vozNom)) vozNom = "dora";
    let finVoz = 0, durPaso = DUR_PASO, sonando = false, terminado = false, intentandoVoz = 0;
    // AAC 256 kbps en MP4 donde el navegador lo reproduce; si no (p. ej., Chromium sin códecs propietarios), Opus en Ogg
    const extVoz = (() => { try { return audio.canPlayType('audio/mp4; codecs="mp4a.40.2"') ? "mp4" : "ogg"; } catch (e) { return "mp4"; } })();
    const urlVoz = (i) => BASES[baseOk] + "voz/" + vozNom + "/" + i + "." + extVoz + "?v=" + VERSIONES.voz;
    // marcas de tiempo de cada frase de la narración (para que la imagen cambie cuando la voz lo dice)
    let MARCAS = null;
    cargar("voz/marcas.json?v=" + VERSIONES.voz).then((m) => { MARCAS = m; }).catch(() => {});
    const marcasDe = (i) => (voz && MARCAS && MARCAS[vozNom] && MARCAS[vozNom][i]) || null;
    const hablar = () => {
      finVoz = 0; durPaso = DUR_PASO; sonando = false; intentandoVoz = 0;
      try { audio.pause(); } catch (e) { /* nada */ }
      if (!voz) return;
      const paso = k;
      audio.onloadedmetadata = () => { if (paso === k && isFinite(audio.duration)) durPaso = Math.max(DUR_PASO * 0.6, audio.duration + 0.6); };
      audio.onplaying = () => { if (paso !== k) return; if (!sonando) { sonando = true; t0 = performance.now() - audio.currentTime * 1000; } };
      audio.onended = () => { if (paso === k) finVoz = performance.now(); };
      audio.onerror = () => { if (paso === k) { durPaso = DUR_PASO; finVoz = performance.now() + (DUR_PASO - 1.2) * 1000; } };
      audio.src = urlVoz(k);
      fichaMedios(PASOS_GUIA[k] ? "Guía · " + PASOS_GUIA[k].t : "Guía de Biblia Exacta");
      if (!pausa) { intentandoVoz = performance.now(); const pr = audio.play(); if (pr && pr.catch) pr.catch(() => { if (paso === k) finVoz = performance.now() + (DUR_PASO - 1.2) * 1000; }); }
    };
    const selVoz = h("select", { class: "g-voces", "aria-label": "Voz de la guía", hidden: true, onchange: () => { vozNom = selVoz.value; store.set("guiaVozN", vozNom); if (voz) { t0 = performance.now(); transcurrido = 0; hablar(); } } },
      VOCES_GUIA.map(([v, t]) => h("option", { value: v, selected: v === vozNom, text: t })));
    const pintarVoces = () => { selVoz.hidden = !voz; };
    const pintarBotones = () => {
      const et = terminado ? "Ver de nuevo" : pausa ? "Seguir" : "Pausar"; btnPausa.replaceChildren(svg(pausa ? ICO.play : ICO.pausa)); btnPausa.setAttribute("aria-label", et); btnPausa.title = et;
      btnVoz.replaceChildren(svg(ICO.voz), voz ? "Voz: activada" : "Escuchar en voz alta"); btnVoz.setAttribute("aria-pressed", String(voz));
      pintarVoces();
    };
    function ir(i, auto) {
      k = (i + PASOS_GUIA.length) % PASOS_GUIA.length;
      // cambiar de paso a mano (flechas, puntos, teclado) siempre reproduce imagen y voz desde el comienzo del paso
      if (!auto && (pausa || terminado) && !quieto()) { pausa = false; terminado = false; pintarBotones(); }
      const p = PASOS_GUIA[k];
      tit.textContent = p.t; desc.textContent = p.d; num.textContent = "Paso " + (k + 1) + " de " + PASOS_GUIA.length;
      [...puntos.children].forEach((b, j) => b.setAttribute("aria-selected", String(j === k)));
      // transición de cine: la escena que se va se funde y se desenfoca mientras entra la nueva
      const marco = escena.parentNode;
      if (marco && escena.childNodes.length && !quieto()) {
        marco.querySelectorAll(".g-sale").forEach((x) => x.remove());
        const sale = escena.cloneNode(true); sale.classList.add("g-sale"); sale.removeAttribute("aria-hidden"); sale.setAttribute("aria-hidden", "true");
        marco.append(sale); setTimeout(() => sale.remove(), 700);
        textoG.classList.remove("g-cambia"); void textoG.offsetWidth; textoG.classList.add("g-cambia");
      }
      escena.replaceChildren(); escena.className = "g-escena g-" + p.e;
      const paso = k;
      tick = ESCENAS[p.e] ? ESCENAS[p.e](escena, () => marcasDe(paso)) : null;
      btnIr.replaceChildren(svg(ICO.seguir), ...textoNp(p.ir[0]));
      btnIr.onclick = () => {
        const x = p.ir[1];
        if (x.startsWith("?q=")) return abrirBusqueda(x.slice(3));
        if (x === "opciones") return empujar(vistaOpciones());
        if (x === "apariencia") return abrirApariencia();
        location.hash = x;
      };
      t0 = performance.now(); transcurrido = 0;
      if (tick) tick(quieto() ? 999 : 0);
      barra.firstChild.style.width = "0%";
      hablar();
    }
    const bucle = (ahora) => {
      raf = requestAnimationFrame(bucle);
      if (!modal.open) { cancelAnimationFrame(raf); raf = 0; audio.pause(); return; }
      // otra vista encima (las opciones) o se volvió atrás: en pausa y sin dibujar hasta que vuelva a verse (alMostrar)
      if (!caja.isConnected) { if (!audio.paused) audio.pause(); t0 = ahora - transcurrido * 1000; cancelAnimationFrame(raf); raf = 0; return; }
      if (pausa) { t0 = ahora - transcurrido * 1000; if (finVoz) finVoz = ahora - Math.min(ahora - finVoz, 250); return; }
      const habla = voz && !audio.error;
      // En red lenta evita relanzar play() 60 veces por segundo mientras llega el audio (causaba tartamudeo)
      if (habla && audio.paused && !finVoz && audio.src && audio.readyState >= 2 && ahora - intentandoVoz > 1200) {
        intentandoVoz = ahora; const pr = audio.play(); if (pr && pr.catch) pr.catch(() => {});
      }
      // con voz, la animación espera a que la voz empiece a sonar (un poco más si la conexión va lenta)
      const esperaVoz = redLenta() ? 3200 : 1800;
      if (habla && !sonando && !finVoz && ahora - t0 < esperaVoz) { t0 = ahora - transcurrido * 1000; return; }
      transcurrido = Math.max(0, (ahora - t0) / 1000);
      // con la voz sonando, el reloj de la escena es el del propio audio (sincronía exacta aunque el teléfono vaya cargado)
      if (habla && sonando && !audio.paused && audio.currentTime > 0 && Math.abs(audio.currentTime - transcurrido) < 1.2 && !finVoz) { transcurrido = audio.currentTime; t0 = ahora - transcurrido * 1000; }
      if (tick && !quieto()) tick(transcurrido);
      const listo = habla ? ((finVoz && ahora - finVoz >= 250 && transcurrido >= DUR_PASO * 0.5) || transcurrido >= durPaso + 5) : transcurrido >= DUR_PASO;
      barra.firstChild.style.width = Math.min(100, transcurrido / (habla ? durPaso : DUR_PASO) * 100) + "%";
      if (listo) { if (k < PASOS_GUIA.length - 1) ir(k + 1, true); else { pausa = true; terminado = true; barra.firstChild.style.width = "100%"; pintarBotones(); } }
    };
    btnPausa.onclick = () => {
      if (terminado) { ir(0); return; }
      pausa = !pausa;
      if (pausa) audio.pause(); else if (voz && !finVoz && audio.src) { const pr = audio.play(); if (pr && pr.catch) pr.catch(() => {}); }
      pintarBotones();
    };
    btnVoz.onclick = () => { voz = !voz; store.set("guiaVoz", voz); pintarBotones(); if (voz) { t0 = performance.now(); transcurrido = 0; if (tick && !quieto()) tick(0); hablar(); } else { audio.pause(); durPaso = DUR_PASO; } };
    const caja = h("div", { class: "guia", tabindex: "-1" },
      h("div", { class: "g-marco" }, escena),
      textoG,
      barra, puntos,
      h("div", { class: "g-ctl" },
        h("button", { class: "btn-icono", type: "button", "aria-label": "Paso anterior", title: "Anterior", onclick: () => ir(k - 1) }, svg(ICO.izq)),
        btnPausa,
        h("button", { class: "btn-icono", type: "button", "aria-label": "Paso siguiente", title: "Siguiente", onclick: () => ir(k + 1) }, svg(ICO.der)),
        btnVoz, selVoz, btnIr));
    caja.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") { e.preventDefault(); ir(k + 1); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); ir(k - 1); }
      else if (e.key === " " && e.target === caja) { e.preventDefault(); btnPausa.onclick(); }
    });
    const vistaG = () => cajaModal(cabModal("Guía del lector", "Cómo usar el lector y analizador"), caja);
    vistaG.alMostrar = () => { if (!raf && modal.open && caja.isConnected) { t0 = performance.now() - transcurrido * 1000; raf = requestAnimationFrame(bucle); } };
    abrirModal(vistaG, () => { cancelAnimationFrame(raf); raf = 0; audio.pause(); audio.removeAttribute("src"); fichaMedios(null); });
    pintarBotones(); ir(k);
    raf = requestAnimationFrame(bucle);
    setTimeout(() => { try { caja.focus({ preventScroll: true }); } catch (e) { /* nada */ } }, 60);
  }


  // ------------------------------------------------------------------ gestos
  // Deslizar a la izquierda o a la derecha sobre un capítulo pasa al siguiente o al anterior.
  // Pellizcar (dentro del sitio oficial y en la app instalada): cada gesto sube o baja UN solo tamaño de los nueve, por amplio
  // que sea, y el verso que está bajo los dedos se queda en su sitio; sin escalar la vista (nada de saltos). Para seguir
  // creciendo, otro gesto. En una pestaña normal del navegador queda su ampliación propia (accesibilidad).
  const PELLIZCO = EMBED || (window.matchMedia && (matchMedia("(display-mode: standalone)").matches || matchMedia("(display-mode: fullscreen)").matches)) || navigator.standalone === true;
  if (PELLIZCO) {
    document.documentElement.style.touchAction = "pan-x pan-y";
    document.addEventListener("gesturestart", (e) => e.preventDefault()); // Safari
  }
  let gesto = null, pinza = null;
  const distT = (t) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
  const evitaDeslizar = (el) => {
    for (let n = el; n && n !== document.body; n = n.parentElement) {
      if (/^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(n.tagName) || n.isContentEditable) return true;
      if (n.matches && n.matches(".franja, .tl-mapa, .seg, .barra, .m-cab, [data-sin-gesto]")) return true;
      if (n.scrollWidth > n.clientWidth + 4 && /auto|scroll/.test(getComputedStyle(n).overflowX)) return true;
    }
    return false;
  };
  function capCercano(dir) {
    if (!esc.libro || modal.open || !/^#\/[1-3A-Z]{3}\/\d+(\/[al](\/\d+(-\d+)?(\/[\dm]+)?)?)?\/?$/.test(location.hash)) return null;
    const b = libroDe(esc.libro); if (!b) return null;
    const c = esc.cap + dir;
    if (c >= 1 && c <= b.caps.length) return rutaCap(b, c, esc.modo);
    const LO = librosEnOrden(), i = LO.indexOf(b), o = LO[i + dir];
    return o ? rutaCap(o, dir > 0 ? 1 : o.caps.length, esc.modo) : null;
  }
  const zonaPellizcoPropio = (el) => !!(el && el.closest && el.closest(".jg-arbol-vivo, .cn-caja, .cn-lienzo, .tl-mapa, [data-sin-pellizco]"));
  document.addEventListener("touchstart", (e) => {
    if (e.touches.length === 2 && PELLIZCO) {
      if (zonaPellizcoPropio(e.target) || zonaPellizcoPropio(e.touches[0] && e.touches[0].target) || zonaPellizcoPropio(e.touches[1] && e.touches[1].target)) { gesto = null; pinza = null; return; }
      gesto = null;
      clearTimeout(tInm); // la barra no cambia mientras dura el pellizco (la posición del texto depende de ella)
      const raiz = modal.open ? $(".m-cuerpo", modal) : $("#vista");
      if (!raiz) return;
      const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2, cy = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      const bajo = !modal.open && document.elementFromPoint(cx, cy);
      if (zonaPellizcoPropio(bajo)) { pinza = null; return; }
      const vEl = bajo && bajo.closest && bajo.closest("#vista [id^='v']");
      const rv = vEl ? vEl.getBoundingClientRect() : null;
      pinza = { d0: distT(e.touches), cx, cy, paso: 0, raiz, v: vEl && /^v\d+$/.test(vEl.id) ? +vEl.id.slice(1) : null, frac: rv && rv.height ? (cy - rv.top) / rv.height : 0 };
      escucharPinza(true);
      return;
    }
    if (e.touches.length !== 1 || pinza) { gesto = null; return; }
    if ((window.visualViewport && window.visualViewport.scale > 1.01) || evitaDeslizar(e.target)) { gesto = null; return; }
    gesto = { x: e.touches[0].clientX, y: e.touches[0].clientY, t: performance.now() };
  }, { passive: true });
  // El oyente que puede detener el desplazamiento (passive: false) existe solo mientras dura un pellizco: con él siempre
  // puesto, cada toque esperaba al hilo principal y, si este tardaba al volver a la app, ni el desplazamiento ni el gesto
  // de recargar respondían (BiEx, 11-nov-2026).
  const moverPinza = (e) => {
    if (!pinza || e.touches.length !== 2) return;
    if (e.cancelable) e.preventDefault();
    if (pinza.paso) return; // un gesto, un paso
    const r = distT(e.touches) / pinza.d0;
    if (r > 1.12 || r < 0.89) { pinza.paso = r > 1 ? 1 : -1; pasoPellizco(pinza, pinza.paso); }
  };
  let conPinza = false;
  function escucharPinza(si) {
    if (si === conPinza) return;
    conPinza = si;
    if (si) document.addEventListener("touchmove", moverPinza, { passive: false });
    else document.removeEventListener("touchmove", moverPinza);
  }
  const soltarGestos = () => { gesto = null; pinza = null; escucharPinza(false); };
  document.addEventListener("touchend", (e) => {
    if (pinza) {
      if (e.touches.length) return;
      soltarGestos(); RP.fin = performance.now();
      return;
    }
    const g = gesto; gesto = null;
    if (!g || !e.changedTouches.length) return;
    const dx = e.changedTouches[0].clientX - g.x, dy = e.changedTouches[0].clientY - g.y, dt = performance.now() - g.t;
    if (dt > 700 || Math.abs(dx) < 72 || Math.abs(dy) > Math.abs(dx) * .45) return;
    const sel = window.getSelection && String(window.getSelection() || ""); if (sel) return;
    const destino = capCercano(dx < 0 ? 1 : -1);
    if (!destino) return;
    document.documentElement.setAttribute("data-paso", dx < 0 ? "sig" : "ant");
    irCapituloInicio(destino);
    setTimeout(() => document.documentElement.removeAttribute("data-paso"), 700);
  }, { passive: true });
  document.addEventListener("touchcancel", soltarGestos, { passive: true });
  // al salir de la app (o si el sistema la congela) un toque a medias no queda pendiente para cuando se vuelva
  document.addEventListener("visibilitychange", () => { if (document.hidden) soltarGestos(); });
  window.addEventListener("pagehide", soltarGestos);
  document.addEventListener("freeze", soltarGestos);
  // Rescate al volver: si una presentación de apertura quedó a medias (el sistema la congeló o la descartó), nada debe seguir
  // bloqueando la página: ni la cortina negra ni el desplazamiento detenido.
  const rescatar = () => {
    if (document.hidden || document.querySelector("#biex-intro")) return;
    const c = document.getElementById("biex-cortina"); if (c) c.remove();
    for (const el of [document.documentElement, document.body]) if (el && el.style.getPropertyValue("overflow") === "hidden" && el.style.getPropertyPriority("overflow") === "important") el.style.removeProperty("overflow");
  };
  document.addEventListener("visibilitychange", () => { if (!document.hidden) setTimeout(rescatar, 1200); });
  window.addEventListener("pageshow", () => setTimeout(rescatar, 1200));
  document.addEventListener("resume", () => setTimeout(rescatar, 1200));
  // un tamaño más o menos; el verso bajo los dedos se queda en su sitio y un sello discreto junto a los dedos lo confirma
  function pasoPellizco(p, dir) {
    const nuevo = Math.max(1, Math.min(K_TAM.length, ap.tam + dir));
    sello(p.cx, p.cy, nuevo === ap.tam ? (dir > 0 ? "Tamaño máximo" : "Tamaño mínimo") : (dir > 0 ? "A+" : "A−") + "  " + nuevo + " de " + K_TAM.length, nuevo === ap.tam);
    if (nuevo === ap.tam) return;
    const yM = p.raiz && modal.open ? p.raiz.scrollTop / Math.max(1, p.raiz.scrollHeight) : null;
    ap.tam = nuevo; store.set("ap", ap); aplicarAp();
    if (navigator.vibrate) { try { navigator.vibrate(6); } catch (er) { /* sin vibración */ } }
    if (yM != null) p.raiz.scrollTop = yM * p.raiz.scrollHeight;
    else if (p.v != null) volverAAncla({ v: p.v, frac: p.frac, off: Math.max(0, p.cy - bordeSup() - 6) });
  }
  // ------------------------------------------------------------------ lupa en la computadora
  // Pellizco del panel táctil o Ctrl + rueda del ratón: el navegador ampliaba sin tope y la vista llegaba a saltar y romperse.
  // Ahora amplía el lector, por pasos estables (hasta 2,5×), sin reacomodar el texto y con el punto bajo el puntero en su
  // sitio; la página ampliada se recorre con el panel en cualquier dirección (arriba, abajo, a los lados, en diagonal).
  // Con una ventana abierta, el mismo gesto cambia el tamaño de su texto (como el pellizco en el teléfono).
  const LUPA = [1, 1.25, 1.5, 1.75, 2, 2.5];
  const fmtLupa = (z) => String(z).replace(".", ",") + "×";
  let nLupa = 0, acLupa = 0, tLupaEv = 0, tLupaPaso = 0, gestoSafari = null, lupaTurno = 0;
  // desplazarse (rueda sin Ctrl, teclado, toque) suelta el punto que se sostenía tras ampliar
  for (const ev of ["keydown", "touchstart"]) window.addEventListener(ev, () => { lupaTurno++; }, { passive: true });
  window.addEventListener("wheel", (e) => { if (!e.ctrlKey) lupaTurno++; }, { passive: true });
  function ponerLupa(n, x, y) {
    const v = vista(); if (!v) return;
    n = Math.max(0, Math.min(LUPA.length - 1, n));
    if (n === nLupa) { sello(x, y, n ? "Ampliación máxima · " + fmtLupa(LUPA[n]) : "Tamaño normal", true); return; }
    const z0 = LUPA[nLupa], z1 = LUPA[n], r0 = v.getBoundingClientRect();
    // lo que está bajo el puntero (el verso, o la página) y en qué punto de él: después de ampliar vuelve a quedar ahí
    const bajo = document.elementFromPoint(x, y), ve = bajo && bajo.closest && bajo.closest("#vista [id^='v'], #vista .tarjeta, #vista .panel");
    const ra = ve ? ve.getBoundingClientRect() : null, fx = ra && ra.width ? (x - ra.left) / ra.width : 0, fy = ra && ra.height ? (y - ra.top) / ra.height : 0;
    const px = (x - r0.left) / z0, py = (y - r0.top) / z0;
    document.documentElement.classList.add("lupa-ajuste");
    if (!nLupa) v.style.width = Math.round(r0.width) + "px"; // ancho fijo: se amplía sin reacomodar el texto
    nLupa = n;
    v.style.zoom = n ? String(z1) : "";
    if (!n) v.style.width = "";
    document.documentElement.classList.toggle("lupa", n > 0);
    if (n) document.documentElement.classList.remove("inmersivo");
    if (ve) ve.classList.add("cv-vis");
    const fijar = () => {
      let l, t;
      if (ve && ve.isConnected) { const r = ve.getBoundingClientRect(); l = window.scrollX + r.left + fx * r.width - x; t = window.scrollY + r.top + fy * r.height - y; }
      else { const r1 = v.getBoundingClientRect(); l = window.scrollX + r1.left + px * z1 - x; t = window.scrollY + r1.top + py * z1 - y; }
      try { window.scrollTo({ left: l, top: t, behavior: "instant" }); } catch (e) { window.scrollTo(l, t); }
    };
    // lo de arriba puede terminar de dibujarse con su altura real y las barras de acomodarse: se sostiene el punto cuadro a
    // cuadro un momento (hasta que queda quieto, como mucho 0,7 s; se suelta si la persona desplaza)
    // (sin desplazamiento suave ni el anclaje propio del navegador mientras tanto: los dos movían la página por su cuenta)
    const raizH = document.documentElement; raizH.classList.add("lupa-ajuste");
    const yo = ++lupaTurno; let quietos = 0, k = 0, yAnt = -1;
    const sostener = () => {
      if (yo !== lupaTurno || ++k > 42 || quietos > 4) { if (yo === lupaTurno) raizH.classList.remove("lupa-ajuste"); return; }
      fijar(); const yy = Math.round(window.scrollY); quietos = yy === yAnt ? quietos + 1 : 0; yAnt = yy; requestAnimationFrame(sostener);
    };
    sostener();
    sello(x, y, n ? "Lupa " + fmtLupa(z1) : "Tamaño normal", false);
  }
  let gestoN = 0, gestoModal = -1;
  function pasoGesto(dir, x, y) {
    // en una ventana, como el pellizco del teléfono: un gesto, un tamaño de texto
    if (modal.open) { if (gestoModal === gestoN) return; gestoModal = gestoN; pasoPellizco({ cx: x, cy: y, raiz: $(".m-cuerpo", modal), v: null }, dir); }
    else ponerLupa(nLupa + dir, x, y);
  }
  window.addEventListener("wheel", (e) => {
    if (!e.ctrlKey) return;
    if (zonaPellizcoPropio(e.target)) return;
    e.preventDefault(); // sin la ampliación del navegador (sin tope)
    if (gestoSafari || !e.deltaY) return;
    const ahora = performance.now();
    // PR #14 (Vivaldi / paneles táctiles de precisión en PC): los gestos de pellizco envían deltaY muy finos (±0,5 a ±4 px);
    // con umbral alto de 40 px el gesto se reiniciaba sin responder. Separamos panel táctil fino de rueda gruesa con Ctrl.
    const esFino = e.deltaMode === 0 && Math.abs(e.deltaY) < 15;
    if (ahora - tLupaEv > (esFino ? 480 : 340)) { acLupa = 0; gestoN++; } // un gesto nuevo
    tLupaEv = ahora;
    acLupa += e.deltaY * (e.deltaMode === 1 ? 33 : e.deltaMode === 2 ? 400 : 1);
    const umbral = esFino ? 10 : 28;
    const pausa = esFino ? 200 : 240;
    if (ahora - tLupaPaso < pausa || Math.abs(acLupa) < umbral) return;
    const dir = acLupa < 0 ? 1 : -1; acLupa = 0; tLupaPaso = ahora;
    pasoGesto(dir, e.clientX, e.clientY);
  }, { passive: false });
  // Safari en el Mac (gestos propios del panel táctil): un gesto, un paso
  if (!("ontouchstart" in window)) {
    document.addEventListener("gesturestart", (e) => { if (zonaPellizcoPropio(e.target)) return; e.preventDefault(); gestoSafari = { paso: 0 }; gestoN++; });
    document.addEventListener("gesturechange", (e) => {
      if (!gestoSafari) return;
      e.preventDefault();
      if (gestoSafari.paso || !(e.scale > 1.12 || e.scale < 0.89)) return;
      gestoSafari.paso = 1; pasoGesto(e.scale > 1 ? 1 : -1, e.clientX || innerWidth / 2, e.clientY || innerHeight / 2);
    });
    document.addEventListener("gestureend", (e) => { gestoSafari = null; });
  }
  // Ctrl + 0 vuelve también la lupa a su tamaño normal; si cambia el ancho de la ventana, el ancho fijo se mide de nuevo
  document.addEventListener("keydown", (e) => { if ((e.ctrlKey || e.metaKey) && e.key === "0" && nLupa) ponerLupa(0, innerWidth / 2, innerHeight / 2); });
  window.addEventListener("resize", () => {
    const v = nLupa && vista(); if (!v) return;
    const z = v.style.zoom; v.style.zoom = ""; v.style.width = "";
    v.style.width = Math.round(v.getBoundingClientRect().width) + "px"; v.style.zoom = z;
  }, { passive: true });

  function sello(x, y, txt, tope) {
    const el = h("div", { class: "sello-tam" + (tope ? " tope" : ""), "aria-hidden": "true", text: txt });
    el.style.left = Math.round(x) + "px"; el.style.top = Math.round(y) + "px";
    document.body.append(el);
    setTimeout(() => el.remove(), 900);
  }

  // ------------------------------------------------------------------ BiEx como aplicación: instalar y leer sin conexión
  // La copia sin conexión la guarda el trabajador de servicio (sw.js) del sitio donde se abre el lector como página propia.
  // Dentro del sitio oficial (marco) no se instala: se ofrece abrir BiEx como aplicación en su dirección propia.
  const APP_URL = "https://bibliaexacta.pages.dev/";
  const PWA = { prompt: null, reg: null, instalada: false };
  const puedeSW = () => !EMBED && "serviceWorker" in navigator && window.isSecureContext && !!document.querySelector('link[rel="manifest"]');
  const enApp = () => (window.matchMedia && (matchMedia("(display-mode: standalone)").matches || matchMedia("(display-mode: window-controls-overlay)").matches)) || navigator.standalone === true;
  // En la app instalada (Windows, macOS, Linux) la ventana muestra el título del documento: el nombre de la app va una sola
  // vez, el completo con ©™, y después la página («BiEx – Biblia Exacta ©™ · YÔḥānā́n [Juan] 3»), sin «BiEx» ni
  // «Biblia Exacta» repetidos
  const NOMBRE_APP = "BiEx – Biblia Exacta ©™";
  const tituloApp = (t) => {
    const r = String(t || "").replace(/BiEx\s*[–—-]\s*Biblia Exacta(\s*©?™?)?|Biblia Exacta(\s*©?™?)?|\bBiEx\b/gi, " ")
      .replace(/\s*([|·–—:-])\s*(?=[|·–—:-])/g, " ").replace(/^[\s|·–—:-]+|[\s|·–—:-]+$/g, "").replace(/\s{2,}/g, " ").trim();
    return r ? NOMBRE_APP + " · " + r : NOMBRE_APP;
  };
  if (enApp() && !EMBED) {
    const fijarTitulo = () => { const n = tituloApp(document.title); if (n !== document.title) document.title = n; };
    fijarTitulo();
    new MutationObserver(fijarTitulo).observe(document.head, { subtree: true, childList: true, characterData: true });
  }
  // Instalar en un toque (BiEx, 10-nov-2026: «cuantos menos pasos, mejor»). Ningún navegador deja abrir la instalación sin
  // un toque de la persona; lo más corto posible: apenas el navegador la ofrece, aparece «Instalar BiEx» (una sola vez por
  // semana si se descarta) y el botón de #/app se activa en vivo (antes quedaba apagado si la oferta llegaba después).
  async function instalarYa() {
    if (!PWA.prompt) { location.hash = "#/app"; return; }
    const p = PWA.prompt; PWA.prompt = null; p.prompt();
    try { const r = await p.userChoice; if (r && r.outcome === "accepted") avisar("Instalando BiEx…"); } catch (e) { /* ignorar */ }
    for (const b of $$(".btn-instalar")) b.disabled = true; const c = $(".chip-instalar"); if (c) c.remove();
  }
  function chipInstalar() {
    if (EMBED || enApp() || PWA.instalada || $(".chip-instalar") || /^#\/app/.test(location.hash)) return;
    if (Date.now() - (store.get("instalarNo", 0) || 0) < 7 * 864e5) return;
    const chip = h("div", { class: "chip-instalar", role: "region", "aria-label": "Instalar BiEx" },
      h("button", { class: "ci-si", type: "button", onclick: instalarYa }, svg(ICO.descargar), h("span", { text: "Instalar BiEx" })),
      h("button", { class: "ci-no", type: "button", "aria-label": "Ahora no", onclick: () => { store.set("instalarNo", Date.now()); chip.remove(); } }, "×"));
    document.body.append(chip); requestAnimationFrame(() => chip.classList.add("si"));
  }
  window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); PWA.prompt = e; document.documentElement.classList.add("app-instalable");
    for (const b of $$(".btn-instalar")) { b.disabled = false; const t = b.querySelector("span"); if (t) t.textContent = "Instalar BiEx"; }
    setTimeout(chipInstalar, 2500); });
  window.addEventListener("appinstalled", () => { PWA.prompt = null; PWA.instalada = true; document.documentElement.classList.remove("app-instalable"); const c = $(".chip-instalar"); if (c) c.remove(); avisar("BiEx quedó instalada"); });
  if (puedeSW()) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js", { scope: "./" }).then((r) => { PWA.reg = r; }).catch(() => {});
    });
  }
  // Conversación con el trabajador de servicio: responde por un canal propio (sin respuesta en el plazo, null)
  function alSW(msg, plazo) {
    const sw = navigator.serviceWorker && (navigator.serviceWorker.controller || (PWA.reg && PWA.reg.active));
    if (!sw) return Promise.resolve(null);
    return new Promise((ok) => {
      const ch = new MessageChannel(); const t = setTimeout(() => ok(null), plazo || 8000);
      ch.port1.onmessage = (e) => { clearTimeout(t); ok(e.data || null); };
      sw.postMessage(msg, [ch.port2]);
    });
  }
  const mb = (n) => (n / 1048576).toLocaleString("es", { maximumFractionDigits: n < 10485760 ? 1 : 0 }) + " MB";
  // De la narración de la guía basta el formato que este navegador reproduce
  const VOZ = (() => { try { const a = document.createElement("audio"); return a.canPlayType && a.canPlayType('audio/ogg; codecs="opus"') ? "ogg" : "mp4"; } catch (e) { return "mp4"; } })();
  // La publicación vigente: la página de inicio del sitio dice de dónde carga el lector (BIEX_BASES); si no lo dice,
  // de aquí mismo. La consulta va directa a la red (el trabajador no la guarda) y su firma distingue una versión de otra.
  const vDe = (s) => (/app\.js\?v=([0-9a-f]+)/.exec(s || "") || [])[1] || "";
  async function vigente() {
    const r = await fetch(new URL("./?biex-consulta=" + Date.now(), location.href).href, { cache: "no-store" });
    if (!r.ok) throw new Error(r.status);
    const html = await r.text();
    let bases = [];
    const m = /BIEX_BASES\s*=\s*(\[[^\]]*\])/.exec(html);
    try { if (m) bases = JSON.parse(m[1]).filter((u) => typeof u === "string" && /^https:\/\/[^\s"'<>]+\/$/.test(u)); } catch (e) { bases = []; }
    if (!bases.length) bases = [""];
    return { bases, firma: bases[0] + "|" + vDe(html) };
  }
  const firmaActual = () => BASES[0] + "|" + vDe((document.querySelector('script[src*="app.js"]') || {}).src);
  // Lista de archivos de una publicación (la arma wix/sellar.py): [ruta, bytes, huella]
  async function listaDe(bases) {
    let ultimo = null;
    for (const b of bases) {
      try {
        const r = await fetch(b + "datos/archivos.json", { cache: "no-store" });
        if (!r.ok) throw new Error(r.status);
        const L = await r.json();
        L.base = b; L.archivos = (L.archivos || []).filter(([x]) => !/^voz\/.+\.(mp4|ogg)$/.test(x) || x.endsWith("." + VOZ));
        return L;
      } catch (e) { ultimo = e; }
    }
    throw ultimo || new Error("sin lista");
  }
  let descarga = null, descargaCompleta = false;
  // Baja lo que falta o cambió (según las huellas) desde la publicación vigente; con «completa», también lo que nunca
  // se guardó. La copia queda al día con esa publicación solo si al final no queda nada pendiente.
  async function descargarTodo(alAvanzar, opc) {
    const o = opc || {}, completa = o.completa !== false;
    // si ya corre una revisión parcial y se pide la copia completa, se espera a que termine y se sigue con la completa
    if (descarga) { if (!completa || descargaCompleta) return descarga; await descarga.catch(() => {}); return descargarTodo(alAvanzar, opc); }
    descargaCompleta = completa;
    descarga = (async () => {
      if (completa) { try { if (navigator.storage && navigator.storage.persist) await navigator.storage.persist(); } catch (e) { /* sin permiso */ } }
      if (!navigator.serviceWorker.controller) { try { await navigator.serviceWorker.ready; } catch (e) { /* sigue */ } }
      const L = o.lista || (await listaDe(((await vigente().catch(() => null)) || { bases: BASES }).bases));
      const pedir = () => alSW({ tipo: "comparar", lista: L.archivos, completa, voz: VOZ, gen: L.gen, fecha: L.fecha }, 20000);
      const cmp = await pedir();
      if (!cmp) throw new Error("sin trabajador de servicio");
      const tam = new Map(L.archivos.map(([r, b]) => [r, b]));
      const total = L.archivos.reduce((s, [, b]) => s + b, 0);
      let hecho = cmp.hay, fallos = 0, i = 0;
      alAvanzar(hecho, total);
      const obrero = async () => {
        while (i < cmp.faltan.length) {
          const r = cmp.faltan[i++];
          try { const res = await fetch(L.base + r, { cache: "no-cache" }); if (!res.ok) throw new Error(res.status); await res.arrayBuffer(); }
          catch (e) { fallos++; }
          hecho += tam.get(r) || 0; alAvanzar(hecho, total);
        }
      };
      await Promise.all(Array.from({ length: 6 }, obrero));
      // el trabajador guarda cada archivo con su huella; se comprueba que no quede nada pendiente antes de anotar
      let quedan = 0;
      if (cmp.faltan.length) { await new Promise((ok) => setTimeout(ok, 400)); const c2 = await pedir(); quedan = c2 ? c2.faltan.length : 1; }
      await alSW({ tipo: "aplicada", gen: fallos || quedan ? null : L.gen, completa: completa || null, voz: VOZ, base: L.base });
      if (completa) store.set("sinConexion", { gen: L.gen, fecha: Date.now(), fallos });
      programarPeriodico();
      return { total, fallos, bajados: cmp.faltan.length - fallos };
    })().finally(() => { descarga = null; descargaCompleta = false; });
    return descarga;
  }
  // PR #14 + PR #15 · Gestor de notificaciones nativas de máxima compatibilidad (Chrome/Vivaldi/Edge/Firefox/Safari PWA/Android SW + guía clara en marco incrustado Wix e iOS)
  const BIEX_NOTIF = {
    esIOS() { return /iP(hone|ad|od)/.test(navigator.userAgent || "") || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1); },
    leer() {
      const d = store.get("notif", null);
      return Object.assign({ on: false, coloso: true, sala: true, lectura: true, cosecha: true }, d && typeof d === "object" ? d : {});
    },
    guardar(cambios) {
      const n = Object.assign(this.leer(), cambios || {});
      store.set("notif", n);
      this.sincronizarSW(n);
      if (this.activa()) this.suscribirPush(false).catch(() => {});
      return n;
    },
    estadoSoporte() {
      const tieneAPI = typeof Notification !== "undefined";
      // Si ya fue concedido en el origen (incluso visto desde el marco incrustado), funciona directo
      if (tieneAPI && Notification.permission === "granted") return "ok";
      if (EMBED) return "embed";
      if (!window.isSecureContext && location.hostname !== "localhost" && location.hostname !== "127.0.0.1") return "inseguro";
      if (!tieneAPI) return this.esIOS() && !enApp() ? "ios_safari" : "no_soportado";
      return "ok";
    },
    soportada() { return this.estadoSoporte() === "ok"; },
    permiso() { return typeof Notification !== "undefined" ? Notification.permission : "unsupported"; },
    activa() { return typeof Notification !== "undefined" && Notification.permission === "granted" && !!this.leer().on; },
    async asegurarSW() {
      if (!puedeSW()) return null;
      try {
        if (swReg) return swReg;
        let reg = await navigator.serviceWorker.getRegistration();
        if (!reg) reg = await navigator.serviceWorker.register("sw.js", { updateViaCache: "none" });
        swReg = reg;
        return await navigator.serviceWorker.ready.catch(() => reg);
      } catch (e) { return swReg || null; }
    },
    urlBase64ToUint8Array(b64) {
      const s = String(b64 || "").trim();
      const pad = "=".repeat((4 - (s.length % 4)) % 4);
      const raw = atob((s + pad).replace(/-/g, "+").replace(/_/g, "/"));
      const out = new Uint8Array(raw.length);
      for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
      return out;
    },
    async suscribirPush(forzar) {
      if (!this.activa() || !navigator.onLine) return false;
      try {
        const reg = await this.asegurarSW();
        if (!reg || !reg.pushManager) return false;
        const rClave = await fetchConTope(API_JG + "/push/clave", { credentials: "omit" }, 6000);
        if (!rClave.ok) return false;
        const dClave = await rClave.json().catch(() => null);
        const pub = dClave && (dClave.clave || dClave.publicKey || dClave.vapid);
        if (!pub || typeof pub !== "string") return false;
        let sub = await reg.pushManager.getSubscription();
        if (!sub) {
          sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: this.urlBase64ToUint8Array(pub) });
        }
        if (!sub) return false;
        const cfg = this.leer();
        const tok = NUBE.tok();
        const hdr = Object.assign({ "content-type": "application/json" }, tok ? { authorization: "Bearer " + tok } : {});
        const rSub = await fetchConTope(API_JG + "/push/suscribir", {
          method: "POST",
          headers: hdr,
          credentials: "omit",
          body: JSON.stringify({
            sub: sub.toJSON ? sub.toJSON() : sub,
            temas: { coloso: cfg.coloso !== false, sala: cfg.sala !== false, lectura: cfg.lectura !== false, cosecha: cfg.cosecha !== false },
            forzar: !!forzar,
          }),
        }, 8000);
        if (rSub.ok) { store.set("pushOk", Date.now()); return true; }
      } catch (e) { /* servidor aún sin VAPID o navegador sin PushManager: avisos locales siguen activos */ }
      return false;
    },
    async desuscribirPush() {
      try {
        const reg = await this.asegurarSW();
        if (!reg || !reg.pushManager) return;
        const sub = await reg.pushManager.getSubscription();
        if (!sub) return;
        const ep = sub.endpoint;
        await sub.unsubscribe().catch(() => {});
        store.set("pushOk", 0);
        if (ep && navigator.onLine) {
          const tok = NUBE.tok();
          const hdr = Object.assign({ "content-type": "application/json" }, tok ? { authorization: "Bearer " + tok } : {});
          await fetchConTope(API_JG + "/push/suscribir", { method: "DELETE", headers: hdr, credentials: "omit", body: JSON.stringify({ endpoint: ep }) }, 6000).catch(() => {});
        }
      } catch (e) {}
    },
    async sincronizarSW(cfg) {
      if (!puedeSW()) return;
      const n = cfg || this.leer();
      try { await alSW({ tipo: "notifConfig", on: n.on && this.permiso() === "granted", coloso: n.coloso, sala: n.sala, lectura: n.lectura, cosecha: n.cosecha }, 2500); } catch (e) {}
    },
    async pedirPermiso() {
      if (typeof Notification === "undefined") return "unsupported";
      if (Notification.permission !== "default") return Notification.permission;
      try {
        // Compatibilidad dual: Promesa moderna + callback de versiones anteriores de Safari/WebKit
        let res = null;
        const p = new Promise((resolve) => {
          const ret = Notification.requestPermission((perm) => resolve(perm));
          if (ret && typeof ret.then === "function") ret.then(resolve, () => resolve("denied"));
        });
        res = await p;
        return res || Notification.permission || "denied";
      } catch (e) { return Notification.permission || "denied"; }
    },
    async activar() {
      const est = this.estadoSoporte();
      if (est === "embed") { avisar("Abre BiEx en su dirección directa para conceder el permiso de avisos."); return false; }
      if (est === "ios_safari") { avisar("En iPhone y iPad, agrega BiEx a tu pantalla de inicio (Compartir › Agregar a inicio) para habilitar los avisos."); return false; }
      if (est !== "ok") { avisar("Este navegador no permite avisos del dispositivo."); return false; }
      const perm = await this.pedirPermiso();
      if (perm !== "granted") {
        this.guardar({ on: false });
        avisar(perm === "denied" ? "Los avisos están bloqueados en los ajustes de tu navegador." : "No se activaron los avisos.");
        return false;
      }
      this.guardar({ on: true });
      await this.asegurarSW();
      programarPeriodico();
      await this.suscribirPush(true);
      await this.enviar("biex-bienvenida", "Avisos de Biblia Exacta activos", "Recibirás recordatorios respetuosos de El Coloso, tu sala, tu cosecha y tu lectura.", "#/escudrina", "sistema", true);
      return true;
    },
    desactivar() {
      this.guardar({ on: false });
      this.desuscribirPush().catch(() => {});
      avisar("Avisos del dispositivo pausados.");
    },
    async enviar(tag, titulo, cuerpo, ruta, categoria, forzar) {
      if (typeof Notification === "undefined" || Notification.permission !== "granted") return false;
      const cfg = this.leer();
      if (!forzar) {
        if (!cfg.on) return false;
        if (categoria && categoria !== "sistema" && cfg[categoria] === false) return false;
      }
      const hoy = new Date().toISOString().slice(0, 10);
      const log = store.get("notifLog", null) || {};
      const clave = String(tag || titulo);
      if (!forzar && log[clave] === hoy) return false;
      const icoUrl = new URL("iconos/icon-192.png", location.href).href;
      const opts = { body: String(cuerpo || ""), icon: icoUrl, badge: icoUrl, tag: clave, renotify: !!forzar, data: { ruta: ruta || "#/" } };
      let ok = false;
      // En Chrome/Vivaldi/Edge de Android es obligatorio pasar por ServiceWorkerRegistration.showNotification()
      try {
        const reg = await this.asegurarSW();
        if (reg && reg.showNotification) { await reg.showNotification(titulo, opts); ok = true; }
      } catch (e) {}
      if (!ok) {
        try {
          const n = new Notification(titulo, opts);
          n.onclick = () => { try { window.focus(); } catch (e) {} if (ruta && /^#\//.test(ruta)) location.hash = ruta; n.close(); };
          ok = true;
        } catch (e) {}
      }
      if (ok && !forzar) {
        const ks = Object.keys(log);
        if (ks.length > 40) for (const k of ks.slice(0, ks.length - 30)) delete log[k];
        log[clave] = hoy;
        store.set("notifLog", log);
      }
      return ok;
    },
  };
  function vistaApp(queryStr) {
    document.title = "Instalar y leer sin conexión · BiEx";
    navActual("");
    const estado = h("div", { class: "app-estado" });
    const barra = h("div", { class: "app-barra", role: "progressbar", "aria-label": "Progreso de la copia sin conexión", "aria-valuemin": "0", "aria-valuemax": "100", "aria-valuenow": "0" }, h("i"));
    const txt = h("p", { class: "app-tx", role: "status" });
    let fijo = false; // un mensaje final (listo, borrado, error) no lo pisa el recuento
    const pintarAvance = (hecho, total) => { const p = total ? Math.min(100, (100 * hecho) / total) : 0; barra.firstChild.style.width = p.toFixed(1) + "%"; barra.setAttribute("aria-valuenow", String(Math.round(p))); if (!fijo) txt.textContent = mb(hecho) + " de " + mb(total) + " · " + Math.round(p) + " %"; };
    const tarjeta = (ico, t, d, ...hijos) => h("section", { class: "app-card", "data-sec": t }, h("div", { class: "app-ico" }, svg(ico)), h("div", { class: "app-cuerpo" }, h("h2", { text: t }), h("p", { text: d }), ...hijos));
    const ios = BIEX_NOTIF.esIOS();
    let instalar;
    if (EMBED || !puedeSW()) {
      instalar = tarjeta(ICO.externo, "Abrir BiEx como aplicación", "Para instalar BiEx con su propio ícono y guardar todo su contenido en tu dispositivo, ábrelo en su dirección de aplicación. Allí verás el botón «Instalar» (o, en iPhone y iPad, Compartir › «Agregar a inicio»).",
        h("a", { class: "btn oro", href: APP_URL + "#/app", target: "_blank", rel: "noopener" }, svg(ICO.externo), h("span", { text: "Abrir BiEx como aplicación" })));
    } else if (enApp() || PWA.instalada) {
      instalar = tarjeta(ICO.marca, "BiEx ya está instalada", "La estás usando como aplicación, con su propio ícono.");
    } else {
      const btn = h("button", { class: "btn oro btn-instalar", type: "button", disabled: !PWA.prompt, onclick: instalarYa }, svg(ICO.descargar), h("span", { text: PWA.prompt ? "Instalar BiEx" : "Preparando la instalación…" }));
      const pasos = ios ? h("ol", { class: "app-pasos" }, h("li", { text: "Toca el botón Compartir de Safari (el cuadrado con la flecha hacia arriba)." }), h("li", { text: "Elige «Agregar a inicio»." }), h("li", { text: "Confirma con «Agregar»: aparecerá el ícono de BiEx." }))
        : h("p", { class: "nota-ui", text: "Si el botón no se activa, usa el menú del navegador: «Instalar BiEx» o «Agregar a la pantalla de inicio». En Safari para Mac: Archivo › «Agregar al Dock»." });
      instalar = tarjeta(ICO.descargar, "Instalar BiEx", "Queda como una aplicación más, directamente en tu pantalla de inicio o en tu escritorio.", ios ? null : btn, pasos);
    }
    const bDesc = h("button", { class: "btn oro", type: "button" }, svg(ICO.nube), h("span", { text: "Descargar todo" }));
    const bBorrar = h("button", { class: "btn chico", type: "button" }, svg(ICO.papelera), h("span", { text: "Borrar la copia" }));
    bDesc.addEventListener("click", async () => {
      bDesc.disabled = true; bDesc.lastChild.textContent = "Descargando…"; fijo = false;
      try {
        const r = await descargarTodo(pintarAvance);
        fijo = true;
        txt.textContent = r.fallos ? "Listo, salvo " + r.fallos + " archivos que no respondieron: vuelve a intentarlo con conexión." : "Listo: todo BiEx está guardado en este dispositivo.";
        bDesc.lastChild.textContent = "Actualizar la copia";
      } catch (e) { fijo = true; txt.textContent = "No se pudo completar la descarga. Revisa la conexión y vuelve a intentarlo."; bDesc.lastChild.textContent = "Reintentar"; }
      bDesc.disabled = false; pintarEstado();
    });
    bBorrar.addEventListener("click", () => {
      const sw = navigator.serviceWorker && navigator.serviceWorker.controller;
      if (sw) sw.postMessage({ tipo: "borrar" }); store.set("sinConexion", null);
      barra.firstChild.style.width = "0"; fijo = true; txt.textContent = "Copia borrada. Lo que vuelvas a abrir con conexión se irá guardando de nuevo."; setTimeout(pintarEstado, 600);
    });
    async function pintarEstado() {
      const filas = [];
      try {
        const v = navigator.onLine ? await vigente().catch(() => null) : null;
        const L = await listaDe(v ? v.bases : BASES);
        const cmp = await alSW({ tipo: "comparar", lista: L.archivos, completa: true, voz: VOZ, gen: L.gen, fecha: L.fecha }, 20000);
        const total = L.archivos.reduce((s, [, b]) => s + b, 0);
        pintarAvance(cmp ? cmp.hay : 0, total);
        if (cmp && cmp.cambian) filas.push(h("li", { class: "app-aviso", text: "Hay una versión más reciente en " + cmp.cambian + (cmp.cambian === 1 ? " archivo" : " archivos") + " de tu copia: con conexión se actualiza sola, o toca «Actualizar la copia»." }));
        else if (cmp && v && cmp.hay && !cmp.faltan.length) filas.push(h("li", { text: "Tu copia está al día. Con conexión, cada publicación nueva se baja sola (solo lo que cambió)." }));
        if (cmp && cmp.hay && !cmp.faltan.length) bDesc.lastChild.textContent = "Actualizar la copia";
      } catch (e) { txt.textContent = "La lista de archivos no está disponible sin conexión todavía."; }
      try {
        if (navigator.storage && navigator.storage.estimate) { const est = await navigator.storage.estimate(); filas.push(h("li", { text: "Espacio usado por BiEx en este navegador: " + mb(est.usage || 0) + (est.quota ? " de " + mb(est.quota) + " disponibles" : "") + "." })); }
        if (navigator.storage && navigator.storage.persisted) { const pe = await navigator.storage.persisted(); filas.push(h("li", { text: pe ? "Almacenamiento persistente: concedido. El navegador no borrará la copia por sí solo." : "Almacenamiento persistente: aún no concedido. Al descargar se pide; instalar BiEx ayuda a que el navegador lo conceda." })); }
      } catch (e) { /* sin datos de almacenamiento */ }
      estado.replaceChildren(filas.length ? h("ul", { class: "app-datos" }, filas) : "");
    }
    const sinConexion = puedeSW() ? tarjeta(ICO.nube, "Leer sin conexión", "Descarga una sola vez todo el lector: los 27 libros, el análisis de cada palabra, los manuscritos, el buscador, la fuente Q y la guía con su voz. Después se puede navegar sin internet; con conexión, todo se sigue actualizando solo.",
      h("div", { class: "app-desc" }, barra, txt, h("div", { class: "app-botones" }, bDesc, bBorrar)), estado) : null;
    // PR #14 + PR #15 · Tarjeta de notificaciones reales del navegador / app instalada (compatibilidad total)
    const notifZona = h("div", {});
    const pintarNotif = () => {
      const est = BIEX_NOTIF.estadoSoporte(), perm = BIEX_NOTIF.permiso(), cfg = BIEX_NOTIF.leer(), act = BIEX_NOTIF.activa();
      const estCls = act ? " ok" : est === "embed" || est === "ios_safari" ? " amb" : perm === "denied" ? " bloq" : "";
      const estTxt = est === "embed" ? "Disponibles en la dirección directa de la app"
        : est === "ios_safari" ? "En iPhone/iPad: primero agrégala a inicio"
        : est === "inseguro" ? "Requiere conexión segura (https)"
        : est !== "ok" ? "Navegador sin soporte de notificaciones"
        : act ? "Activadas en este dispositivo"
        : perm === "denied" ? "Bloqueadas en el navegador"
        : "Listas para activar";
      const chk = (k, lbl) => {
        const inp = h("input", { type: "checkbox", checked: cfg[k] !== false ? true : null, onchange: () => { BIEX_NOTIF.guardar({ [k]: inp.checked }); avisar("Preferencia de avisos guardada"); } });
        return h("label", {}, inp, h("span", { text: lbl }));
      };
      notifZona.replaceChildren(...[
        h("span", { class: "app-notif-est" + estCls }, h("i", { "aria-hidden": "true" }), h("span", { text: estTxt })),
        ...(est === "embed" ? [
          h("p", { class: "nota-ui", text: "Estás abriendo BiEx dentro del marco del sitio oficial: por seguridad, los navegadores solo permiten activar notificaciones desde la dirección directa (bibliaexacta.pages.dev) o desde la aplicación instalada." }),
          h("div", { class: "app-botones" }, h("a", { class: "btn oro", href: APP_URL + "#/app?avisos=1", target: "_blank", rel: "noopener" }, svg(ICO.campana), h("span", { text: "Abrir BiEx y activar avisos" }))),
        ] : []),
        est === "ios_safari" ? h("ol", { class: "app-pasos" },
          h("li", { text: "En Safari, toca Compartir (cuadrado con flecha hacia arriba) y elige «Agregar a inicio»." }),
          h("li", { text: "Abre BiEx desde el nuevo ícono en tu pantalla de inicio y vuelve a esta tarjeta para activar los avisos." })) : null,
        est === "ok" && act ? h("div", { class: "app-notif-ops" },
          chk("coloso", "El Coloso de la Tradición (apertura e incursión en vivo)"),
          chk("sala", "Alguien entra en tu sala de lectura abierta"),
          chk("cosecha", "Cesta de la cosecha lista para recoger"),
          chk("lectura", "Recordatorio suave diario de lectura")) : null,
        est === "ok" ? h("div", { class: "app-botones" },
          act
            ? [
              h("button", { class: "btn oro", type: "button", onclick: () => BIEX_NOTIF.enviar("biex-prueba", "Prueba de aviso · Biblia Exacta", "Las notificaciones de tu aplicación funcionan correctamente.", "#/escudrina", "sistema", true) }, svg(ICO.campana), h("span", { text: "Probar notificación" })),
              h("button", { class: "btn chico", type: "button", onclick: () => { BIEX_NOTIF.desactivar(); pintarNotif(); } }, h("span", { text: "Pausar avisos" })),
            ]
            : h("button", { class: "btn oro", type: "button", disabled: perm === "denied", onclick: async () => { await BIEX_NOTIF.activar(); pintarNotif(); } }, svg(ICO.campana), h("span", { text: perm === "denied" ? "Bloqueadas en ajustes" : "Activar notificaciones" }))) : null,
        est === "ok" && perm === "denied" ? h("p", { class: "nota-ui", text: "Para habilitarlas de nuevo, toca el candado junto a la dirección web (o Ajustes de la app › Notificaciones en tu teléfono) y permite los avisos para bibliaexacta.pages.dev." }) : null,
      ].filter(Boolean));
    };
    pintarNotif();
    const notifTarj = tarjeta(ICO.campana, "Avisos y notificaciones", "Recibe avisos reales en tu navegador o aplicación instalada cuando despierte El Coloso de la Tradición, alguien entre en tu sala, tu cesta esté llena o quieras un recordatorio sereno de lectura. Sin exceso ni ruido.", notifZona);
    notifTarj.id = "app-avisos";
    // PR #16 · Comprobar actualización y reparar caché sin perder notas, marcadores ni sesión
    const diagEst = h("p", { class: "app-diag-est", role: "status", text: "Si notas que tu navegador conserva una versión anterior, puedes refrescar los archivos de la app en un toque sin perder tus notas, marcadores, planes ni tu cuenta de Escudriña." });
    const btnComp = h("button", { class: "btn chico", type: "button", onclick: async (ev) => {
      const bt = ev.currentTarget; bt.disabled = true; diagEst.textContent = "Comprobando si hay una versión más reciente…";
      try {
        const v = await vigente();
        if (v && v.firma && v.firma !== firmaActual()) {
          diagEst.textContent = "Hay una versión más reciente disponible. Toca «Reparar caché y recargar» para abrirla de inmediato.";
          avisoVersion();
        } else {
          diagEst.textContent = "Ya tienes la publicación más reciente de Biblia Exacta.";
        }
      } catch (e) { diagEst.textContent = "No se pudo consultar el servidor ahora; revisa tu conexión."; }
      bt.disabled = false;
    } }, h("span", { text: "Comprobar actualización" }));
    const btnRep = h("button", { class: "btn chico oro", type: "button", onclick: async (ev) => {
      const bt = ev.currentTarget; bt.disabled = true; diagEst.textContent = "Limpiando caché antigua y actualizando la aplicación…";
      try {
        if (window.caches && caches.keys) {
          const ks = await caches.keys();
          await Promise.all(ks.filter((k) => k.startsWith("biex-")).map((k) => caches.delete(k).catch(() => {})));
        }
        if (puedeSW()) {
          const regs = await navigator.serviceWorker.getRegistrations().catch(() => []);
          await Promise.all(regs.map((r) => r.update().catch(() => {})));
        }
      } catch (e) {}
      avisar("Caché renovada · recargando versión reciente");
      setTimeout(() => location.reload(), 380);
    } }, h("span", { text: "Reparar caché y recargar" }));
    const diagTarj = tarjeta(ICO.actualizar, "Actualizar versión y reparar caché", "Renueva únicamente los archivos del programa guardados por el navegador. Tus notas, marcadores, planes, partidas y cuenta permanecen intactos.",
      h("div", { class: "app-diag" }, diagEst, h("div", { class: "app-botones" }, btnComp, btnRep)));
    // AA12 (BiEx, 23-nov-2026): guía de widget de escritorio (nativo en Windows 11 con Edge) y accesos rápidos por plataforma
    const guiaWd = (tit, et, pasos, abierto) => h("details", { open: abierto ? "" : null },
      h("summary", {}, h("span", { text: tit }), h("small", { text: et })),
      Array.isArray(pasos) ? h("ol", {}, pasos.map((p) => h("li", { text: p }))) : h("p", { text: pasos }));
    const esWin = /Windows/i.test(navigator.userAgent || "");
    const widgetTarj = tarjeta(ICO.rejilla, "Widget en tu pantalla", "Ten el verso del día y tu avance de Escudriña siempre a la vista, con un toque directo al capítulo.",
      h("div", { class: "app-wd-g" },
        guiaWd("Windows 11", "Widget nativo · Edge", [
          "Abre Biblia Exacta en Microsoft Edge e instálala como aplicación con el botón «Instalar BiEx» (o desde la barra de direcciones).",
          "Abre el panel de Widgets de Windows 11 (tecla Win + W) y pulsa el botón «+» para agregar un widget.",
          "Elige «BiEx · Verso del día»: muestra el pasaje del día y tu nivel en Escudriña, actualizándose incluso sin conexión con tu copia local."
        ], esWin),
        guiaWd("Android", "App + accesos", [
          "Instala BiEx desde Chrome, Vivaldi, Edge, Brave, Samsung Internet, Opera u otro navegador compatible («Instalar aplicación» o «Agregar a la pantalla de inicio») para fijarla en tu pantalla de inicio.",
          "Mantén pulsado el ícono de BiEx para saltar al instante a Escudriña, Buscar o tu última lectura.",
          "Los navegadores de Android aún no permiten widgets de escritorio desde aplicaciones web; en cuanto lo habiliten, el mismo widget quedará listo."
        ], !esWin && !ios && /Android/i.test(navigator.userAgent || "")),
        guiaWd("iPhone y iPad", "Pantalla de inicio", [
          "En Safari, toca Compartir y elige «Agregar a inicio» para abrir BiEx a pantalla completa y sin barras.",
          "iOS aún no habilita widgets de aplicaciones web; el ícono en tu inicio reabre directamente el último capítulo leído."
        ], ios),
        guiaWd("Linux y otros equipos", "App de escritorio", [
          "Instala BiEx desde Edge, Chrome, Vivaldi, Brave, Opera u otro navegador compatible como aplicación independiente y fíjala en tu barra o lanzador.",
          "Al descargar la copia local arriba, podrás consultar los 27 libros y el griego sin conexión cuando lo necesites."
        ], false)));
    vista().replaceChildren(h("div", { class: "in" }, h("section", { class: "panel app-pag" },
      barraVolver(),
      h("div", { class: "panel-cab" }, h("span", { class: "eyebrow", text: "BiEx en tu dispositivo" }), h("h1", { class: "texto", text: "Instalar y leer sin conexión" }),
        h("p", { class: "q-lead", text: "Biblia Exacta ©™ puede quedar instalada como aplicación y guardar todo su contenido para leer, analizar y buscar aunque no haya internet." })),
      instalar, sinConexion, notifTarj, diagTarj, widgetTarj,
      h("div", { class: "nota-guarda", role: "note", "data-sec": "Marcadores y notas" }, svg(ICO.marcador), h("p", {}, h("b", { text: "Tus marcadores y notas. " }), ...avisoGuarda())),
      h("p", { class: "nota-ui", text: "La copia se guarda en este navegador. Ninguna página puede obligar al navegador a conservarla para siempre: si se borran los datos del sitio, o el dispositivo se queda sin espacio y no hay permiso persistente, habría que descargarla otra vez." }))));
    if (sinConexion) pintarEstado();
    if (queryStr && /avisos=1/.test(queryStr)) FARO.enfocar("#app-avisos");
    else alTope();
  }
  // La copia se mantiene al día sola: al abrir BiEx (8 s después) y al volver a la app tras una hora o más, se consulta
  // la publicación vigente y se baja en segundo plano solo lo que cambió (nunca con «ahorro de datos»). Si lo abierto
  // es anterior a lo publicado, un aviso discreto ofrece recargar.
  let revisando = false;
  async function actualizarCopia() {
    if (revisando || !puedeSW() || !navigator.onLine || (navigator.connection && navigator.connection.saveData)) return;
    revisando = true;
    try {
      store.set("revisionCopia", Date.now());
      const est = await alSW({ tipo: "estado" });
      if (!est) return;
      const completa = est.completa || !!store.get("sinConexion", null); // copias bajadas antes de las huellas
      if (!completa && !est.guardados) return;
      const v = await vigente();
      if (v.firma !== firmaActual()) avisoVersion();
      const L = await listaDe(v.bases);
      if (!L.gen || L.gen !== est.gen) await descargarTodo(() => {}, { lista: L, completa });
      programarPeriodico();
    } catch (e) { store.set("revisionCopia", 0); /* sin conexión o sin respuesta: se intenta otra vez */ }
    finally { revisando = false; }
  }
  // al volver, la revisión espera unos segundos y un momento libre: lo primero es que la página responda al tacto
  const enCalma = (fn, ms) => setTimeout(() => { if (document.hidden) return; if (window.requestIdleCallback) requestIdleCallback(fn, { timeout: 4000 }); else fn(); }, ms);
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible" && Date.now() - (store.get("revisionCopia", 0) || 0) >= 3600e3) enCalma(actualizarCopia, 6000); });
  window.addEventListener("online", () => { if (!store.get("revisionCopia", 0)) setTimeout(actualizarCopia, 3000); });
  // Aviso de versión nueva (BiEx, 10-nov-2026: «al volver a la app casi nunca avisa»). Antes la consulta dependía de la
  // copia sin conexión y de una hora de ausencia; ahora es una consulta ligera y propia, sin esa condición: al abrir, al
  // volver a la app o a la pestaña (también cuando Android la congela y la reanuda, o la devuelve desde la caché de
  // navegación), al recuperar la conexión o el foco, al cambiar de vista (como mucho cada 3 min) y cada 15 min a la vista.
  // (15-nov-2026, adjunto 3) El aviso va en la capa superior (popover: queda por encima de las ventanas abiertas y del juego)
  // con clases propias (antes `.si` chocó con el CSS del juego, AC19, y el aviso salió como un óvalo al final de la página);
  // si se cierra con «Ahora no», vuelve a ofrecerse al regresar a la app o al cambiar de vista pasados 20 min.
  let ultVersion = 0, versionNueva = false, versionCerrada = 0;
  async function revisarVersion(espera) {
    if (versionNueva) { if (!document.hidden && versionCerrada && Date.now() - versionCerrada > 20 * 60e3) avisoVersion(); return; }
    if (!navigator.onLine || document.hidden) return;
    const ahora = Date.now(); if (ahora - ultVersion < (espera || 0)) return;
    ultVersion = ahora;
    try {
      const v = await vigente();
      if (v.firma !== firmaActual()) {
        versionNueva = true; avisoVersion();
        if (puedeSW()) navigator.serviceWorker.getRegistration().then((r) => r && r.update()).catch(() => {});
      }
    } catch (e) { ultVersion = 0; }
  }
  const syncOculto = () => document.documentElement.classList.toggle("oculto", !!document.hidden);
  syncOculto();
  document.addEventListener("visibilitychange", () => { syncOculto(); if (document.visibilityState === "visible") enCalma(() => revisarVersion(45e3), 1500); });
  document.addEventListener("resume", () => enCalma(() => revisarVersion(0), 1500));
  window.addEventListener("pageshow", (e) => { if (e.persisted) enCalma(() => revisarVersion(0), 1500); });
  window.addEventListener("focus", () => revisarVersion(120e3));
  window.addEventListener("online", () => setTimeout(() => revisarVersion(0), 2000));
  window.addEventListener("hashchange", () => revisarVersion(180e3));
  setInterval(() => { if (!document.hidden) revisarVersion(15 * 60e3 - 5000); }, 60e3);
  // Aviso discreto: hay una versión publicada más reciente que la que está abierta
  function avisoVersion() {
    if ($(".aviso-version")) return;
    versionCerrada = 0;
    const el = h("div", { class: "aviso-version", role: "status" },
      h("span", { text: "Hay una versión nueva" }),
      h("button", { type: "button", class: "av-si", text: "Actualizar", onclick: () => location.reload() }),
      h("button", { type: "button", class: "av-no", "aria-label": "Ahora no", title: "Ahora no", onclick: () => { versionCerrada = Date.now(); el.classList.remove("av-vis"); setTimeout(() => { try { if (el.hidePopover) el.hidePopover(); } catch (e) { /* ignorar */ } el.remove(); }, 300); } }, svg(ICO.cerrar)));
    const capa = typeof el.showPopover === "function";
    if (capa) el.setAttribute("popover", "manual");
    document.body.append(el);
    if (capa) try { el.showPopover(); } catch (e) { /* sin capa superior */ }
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add("av-vis")));
  }
  // Si el navegador lo concede a la app instalada, la copia también se revisa en segundo plano (como mucho, una vez al día)
  async function programarPeriodico() {
    try {
      const reg = await navigator.serviceWorker.ready;
      if (!reg.periodicSync || !navigator.permissions) return;
      const p = await navigator.permissions.query({ name: "periodic-background-sync" });
      if (p.state === "granted") await reg.periodicSync.register("biex-actualizar", { minInterval: 24 * 3600e3 });
    } catch (e) { /* no disponible en este navegador */ }
  }

  // AA19 + PR #9 + PR #16: las notas, datos de nube (/nube) y suscripción Web Push se sincronizan en calma y al volver a la pestaña
  setTimeout(() => { const ir = () => { NUBE.bajar(); NUBE_DAT.bajar(); if (BIEX_NOTIF.activa()) BIEX_NOTIF.suscribirPush(false).catch(() => {}); }; if (window.requestIdleCallback) requestIdleCallback(ir, { timeout: 6000 }); else ir(); }, 4000);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") { NUBE.bajado = false; NUBE_DAT.bajado = false; setTimeout(() => { NUBE.bajar(); NUBE_DAT.bajar(); }, 1500); }
    else { if (store.get("marcasSucio", 0)) NUBE.subir(); if (store.get("nubeSucio", 0)) NUBE_DAT.subir(); }
  });
  // ------------------------------------------------------------------ saltos rápidos: inicio, mitad y final de la página
  // En las páginas largas aparecen al desplazarse y se retiran solos al quedarse quietos; el aro del botón central
  // muestra cuánto se ha avanzado.
  (function saltosRapidos() {
    const ir = (f) => {
      const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      const y = Math.round(max * f);
      RP.fin = performance.now();
      try { window.scrollTo({ top: y, left: 0, behavior: quieto() ? "auto" : "smooth" }); } catch (e) { window.scrollTo(0, y); }
    };
    // Aro de avance en tiempo real y sin repintar la página: dos medios aros que solo giran (una transformación por capa,
    // en el compositor). Donde el navegador lo permite, el giro va atado al desplazamiento por CSS (animation-timeline:
    // scroll()) y no pasa por JavaScript; si no, se ajusta una vez por cuadro tocando solo esas dos transformaciones.
    // (Antes era un trazo SVG: cambiarlo en cada cuadro repintaba el documento, y por eso se actualizaba solo al detenerse.)
    const m1 = h("i"), m2 = h("i");
    const aro = h("span", { class: "sr-aro", "aria-hidden": "true" }, h("span", { class: "sr-m sr-m1" }, m1), h("span", { class: "sr-m sr-m2" }, m2));
    const btn = (cls, et, ico, f, extra) => h("button", { type: "button", class: "sr-btn " + cls, "aria-label": et, title: et, onclick: () => { ir(f); mostrar(); } }, extra || null, svg(ico));
    // (BiEx, 12-nov-2026; idea de la app de junio) junto al aro, los minutos de lectura que faltan desde donde se va
    const mins = h("span", { class: "sr-min", "aria-hidden": "true" });
    // X12 (BiEx, 13-nov-2026): en las páginas con secciones (concordancia del lema, raíces, estudios…), «Secciones» sobre las
    // flechas: sus nombres llevan directo a cada parte sin buscarla desplazándose. Las vistas las declaran con data-sec.
    const secLista = h("div", { class: "sr-secs", hidden: true, role: "menu", "aria-label": "Secciones de la página" });
    const secBtn = h("button", { type: "button", class: "sr-btn sr-sec", hidden: true, "aria-label": "Ir a una sección de la página", title: "Secciones", "aria-expanded": "false", "aria-haspopup": "menu", onclick: (e) => { e.stopPropagation(); alternarSecs(); mostrar(); } }, svg(ICO.lista));
    let secCache = { k: "", t: 0, l: [] };
    const secciones = () => { const ahora = performance.now(); if (secCache.k !== location.hash || ahora - secCache.t > 1500) { const v = vista(); secCache = { k: location.hash, t: ahora, l: v ? [...v.querySelectorAll("[data-sec]")].filter((el) => el.offsetParent !== null).slice(0, 12) : [] }; } return secCache.l; };
    // AF35 (Neon, 23-nov-2026): cada sección queda centrada entre las barras (superior y, si está visible, inferior); si es más
    // alta que la zona útil, su encabezado entra holgado bajo la barra superior sin quedar cortado
    function irSec(el) {
      const hb = document.querySelector("header.barra"), bh = document.querySelector(".barra-hoja.bh-pegada"), mu = document.querySelector(".jg-muelle");
      const tope = (hb ? hb.offsetHeight : 0) + (bh ? bh.offsetHeight : 0);
      const pie = mu ? mu.offsetHeight + 16 : 16;
      const disp = Math.max(120, window.innerHeight - tope - pie), r = el.getBoundingClientRect();
      const margen = r.height <= disp * 0.85 ? Math.round((disp - r.height) / 2) : Math.round(Math.min(40, disp * 0.08));
      const y = Math.max(0, r.top + window.scrollY - tope - Math.max(14, margen));
      RP.fin = performance.now();
      try { window.scrollTo({ top: y, left: 0, behavior: quieto() ? "auto" : "smooth" }); } catch (e) { window.scrollTo(0, y); }
      el.classList.add("sec-foco"); setTimeout(() => el.classList.remove("sec-foco"), 2400);
    }
    function alternarSecs(abrir) {
      const ab = abrir != null ? abrir : secLista.hidden;
      if (!ab) { secLista.hidden = true; secBtn.setAttribute("aria-expanded", "false"); return; }
      secLista.replaceChildren(...secciones().map((el) => h("button", { type: "button", role: "menuitem", class: "sr-sec-it", onclick: () => { alternarSecs(false); irSec(el); mostrar(); } }, el.dataset.sec)));
      secLista.hidden = false; secBtn.setAttribute("aria-expanded", "true");
      if (secLista.animate && !quieto()) secLista.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 180, easing: "ease-out" });
    }
    // Marcador rápido flotante encima de Compartir (.sr-mk): siempre sincronizado con el verso iluminado en pantalla
    // (el mismo verso activo del brillo luminoso de Escudriña), sin interferir jamás con la selección de texto nativa.
    const leyendoCap = () => !!(esc.libro && esc.cap && esc.modo !== "a" && esc.versos && esc.versos.length);
    const mkPan = h("div", { class: "sr-mk-pan", hidden: true, role: "dialog", "aria-label": "Marcar verso" });
    // Argon (23-nov-2026): evitar que tocar un botón dentro de mkPan desenfoque mkBtn y dispare focusout -> replaceChildren
    // a mitad del toque (lo que obligaba a tocar dos veces).
    mkPan.addEventListener("pointerdown", (e) => { if (e.target.closest && e.target.closest("button")) e.preventDefault(); });
    let mkV = 1, mkManual = false, mkVPintado = 0, mkColPintado = null, ultToqueMk = 0, ptMk = null;
    const accionarMkBtn = (e) => {
      const ahora = performance.now();
      if (ahora - ultToqueMk < 420) return;
      ultToqueMk = ahora;
      if (e) e.stopPropagation();
      alternarMk();
      mostrar();
    };
    const mkBtn = h("button", { type: "button", class: "sr-btn sr-mk", hidden: true, "aria-label": "Marcar el verso actual", title: "Marcar verso", "aria-expanded": "false", "aria-haspopup": "dialog",
      onpointerdown: (e) => { if (e.button && e.button !== 0) return; ptMk = { x: e.clientX, y: e.clientY }; },
      onpointerup: (e) => { if (!ptMk) return; const dx = Math.abs(e.clientX - ptMk.x), dy = Math.abs(e.clientY - ptMk.y); ptMk = null; if (dx < 14 && dy < 14) { e.preventDefault(); accionarMkBtn(e); } },
      onclick: (e) => accionarMkBtn(e) }, svg(ICO.marcador));
    function actualizarBtnMk() {
      const enCap = leyendoCap();
      mkBtn.hidden = !enCap;
      if (!enCap) { alternarMk(false); return; }
      const vAct = versoIluminado();
      if (mkPan.hidden || !mkManual) mkV = vAct;
      const v = mkV;
      const b = libroDe(esc.libro);
      const ref = b ? (b.t || b.n) + " " + esc.cap + ":" + v : esc.cap + ":" + v;
      mkBtn.title = "Marcar " + ref;
      mkBtn.setAttribute("aria-label", "Marcar " + ref);
      const m = MK.get(esc.libro, esc.cap, v) || {}, colAct = m.col || null;
      mkBtn.classList.toggle("on", !!colAct);
      if (colAct) mkBtn.style.setProperty("--mkc", "var(--mk-" + colAct + ")"); else mkBtn.style.removeProperty("--mkc");
      if (!mkPan.hidden && !mkManual && (v !== mkVPintado || colAct !== mkColPintado)) pintarMkPan();
    }
    syncMkRapido = actualizarBtnMk;
    document.addEventListener("biex:verso-activo", (ev) => {
      const d = ev && ev.detail;
      if (!d || !leyendoCap()) return;
      if (d.c === esc.libro && d.cap === esc.cap && d.v) {
        if (mkPan.hidden || !mkManual) {
          const cambio = mkV !== d.v;
          mkV = d.v;
          if (cambio) actualizarBtnMk();
        }
      }
    });
    function pintarMkPan() {
      if (!leyendoCap()) { alternarMk(false); return; }
      const b = libroDe(esc.libro), vs = esc.versos || [];
      if (!b || !vs.length) return;
      let idx = vs.findIndex((x) => x.v === mkV);
      if (idx < 0) { idx = 0; mkV = vs[0].v; }
      const x = vs[idx], m = MK.get(b.c, esc.cap, x.v) || {};
      mkVPintado = x.v;
      mkColPintado = m.col || null;
      const sub = h("small", { class: m.col ? "mk-" + m.col : "", text: m.col ? MK.nombre(m.col) : "Sin marca" });
      const irPaso = (nuevoV) => {
        mkManual = true; mkV = nuevoV; marcarVerso(mkV);
        const elV = document.getElementById("v" + mkV);
        if (elV) {
          const r = elV.getBoundingClientRect();
          if (r.top < 90 || r.bottom > window.innerHeight - 80) elV.scrollIntoView({ block: "center", behavior: quieto() ? "auto" : "smooth" });
        }
        pintarMkPan(); actualizarBtnMk();
      };
      const bPrev = h("button", { type: "button", "aria-label": "Verso anterior", title: "Verso anterior", disabled: idx <= 0, onclick: () => irPaso(vs[idx - 1].v) }, svg(ICO.izq));
      const bNext = h("button", { type: "button", "aria-label": "Verso siguiente", title: "Verso siguiente", disabled: idx >= vs.length - 1, onclick: () => irPaso(vs[idx + 1].v) }, svg(ICO.der));
      const grid = h("div", { class: "sr-mk-grid", role: "group", "aria-label": "Elegir color" }, MK.temas().map(([k, nom]) =>
        h("button", { type: "button", class: "vq-dot mk-" + k + (m.col === k ? " sel" : ""), title: nom, "aria-label": nom, "aria-pressed": String(m.col === k),
          onclick: () => {
            const ya = (MK.get(b.c, esc.cap, x.v) || {}).col === k;
            MK.poner(b.c, esc.cap, x.v, { col: ya ? null : k });
            pintarMkPan(); actualizarBtnMk();
            avisar(ya ? "Marca quitada" : (b.t || b.n) + " " + esc.cap + ":" + x.v + " · " + nom);
          } })));
      const bCop = h("button", { type: "button", class: "fv-rap-b pri", onclick: async () => {
        const txt = textoPlano((txtVerso(x).textContent || "").replace(/\s+/g, " ").trim());
        const hh0 = "#/" + b.c + "/" + esc.cap + "/l/" + x.v;
        let hh = hh0;
        const inv = (store.get("jg:t", null) && store.get("jg:mio", null)) || (await semilla());
        if (inv && /^[a-z0-9]{4,12}$/.test(inv)) hh = "#/escudrina/i/" + inv + "/" + hh0.slice(2);
        const salida = "«" + txt + "»\n— " + nombreLibro(b) + " " + esc.cap + ":" + x.v + " · Biblia Exacta\n" + enlacePublico(hh);
        try { await navigator.clipboard.writeText(salida); avisar("Verso copiado con cita y enlace"); try { if (window.BiExJuego && BiExJuego.compartido) BiExJuego.compartido(hh0); } catch (er) { /* sin juego */ } }
        catch (e) { compartir(nombreLibro(b) + " " + esc.cap + ":" + x.v, txt, hh0); }
        alternarMk(false);
      } }, svg(ICO.copiar), h("span", { text: "Copiar" }));
      const bNota = h("button", { type: "button", class: "fv-rap-b", onclick: () => {
        const vv = x.v; alternarMk(false); abrirVerso(b, esc.cap, vv, false, null, true);
      } }, svg(ICO.nota), h("span", { text: "Nota" }));
      mkPan.replaceChildren(
        h("div", { class: "sr-mk-cab" },
          h("div", { class: "sr-mk-tit" }, h("b", { text: (b.t || b.n) + " " + esc.cap + ":" + x.v }), sub),
          h("div", { class: "sr-mk-paso" }, bPrev, bNext)),
        grid,
        h("div", { class: "sr-mk-acc" }, bCop, bNota));
    }
    function alternarMk(abrir) {
      const ab = abrir != null ? abrir : mkPan.hidden;
      if (!ab || !leyendoCap()) { mkManual = false; mkVPintado = 0; mkColPintado = null; mkPan.hidden = true; mkBtn.setAttribute("aria-expanded", "false"); return; }
      alternarSecs(false);
      mkManual = false;
      mkV = versoIluminado();
      // Precarga silenciosa del análisis, referencias y manuscritos del capítulo actual para que «Nota» abra al instante y sin saltos
      if (esc.libro) { analisis(esc.libro).catch(() => {}); tablas().catch(() => {}); refsDe(esc.libro).catch(() => {}); testigos().catch(() => {}); msCap(esc.libro, esc.cap).catch(() => {}); }
      pintarMkPan();
      mkPan.hidden = false; mkBtn.setAttribute("aria-expanded", "true");
      if (mkPan.animate && !quieto()) mkPan.animate([{ opacity: 0, transform: "translate3d(8px,0,0)" }, { opacity: 1, transform: "none" }], { duration: 170, easing: "ease-out" });
    }
    const caja = h("div", { class: "saltos-rap", role: "group", "aria-label": "Ir rápido por la página" }, secLista, secBtn, mkPan, mkBtn,
      // (BiEx, 14-nov-2026) compartir, encima de la flecha de subir; aparece y se oculta con ellas
      h("button", { type: "button", class: "sr-btn sr-comp", "aria-label": "Compartir con tu enlace de invitación", title: "Compartir", onclick: () => { compartirPagina(); mostrar(); } }, svg(ICO.compartir)),
      btn("sr-ini", "Ir al inicio de la página", ICO.subir, 0), btn("sr-med", "Ir a la mitad de la página", ICO.centro, 0.5, aro), btn("sr-fin", "Ir al final de la página", ICO.bajar, 1), mins);
    document.body.append(caja);
    const ATADO = !!(window.CSS && CSS.supports && CSS.supports("animation-timeline: scroll()"));
    if (ATADO) caja.classList.add("sr-atado");
    let reloj = 0, pendiente = false;
    // (15-nov-2026, fluidez) el alto de la página se mide como mucho cada 0,4 s: leerlo en cada evento de desplazamiento obligaba
    // a recalcular el estilo y el diseño a mitad del gesto
    let largoV = null, largoT = 0;
    const largo = () => { const t = performance.now(); if (largoV === null || t - largoT > 400) { largoV = document.documentElement.scrollHeight > window.innerHeight * 2.6; largoT = t; } return largoV; };
    const ocultarQuieto = () => { if (!mkPan.hidden) return; if (!caja.matches(":hover") && !caja.contains(document.activeElement)) { caja.classList.remove("vis"); alternarSecs(false); } };
    function mostrar() {
      if ((!largo() && !leyendoCap()) || modal.open) {
        if (caja.classList.contains("vis")) { caja.classList.remove("vis"); alternarSecs(false); alternarMk(false); }
        return;
      }
      if (!caja.classList.contains("vis")) {
        const hay = secciones().length >= 2; secBtn.hidden = !hay; if (!hay) alternarSecs(false);
        actualizarBtnMk();
        caja.classList.add("vis");
      }
      clearTimeout(reloj);
      if (!mkPan.hidden) return;
      // AL5 (BiEx, 22-nov-2026, 18:53): al final de la página (donde están los créditos) se apartan antes
      reloj = setTimeout(ocultarQuieto, !secLista.hidden ? 6000 : caja.classList.contains("en-fin") ? 800 : 2600);
    }
    const avance = () => { const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight); return Math.min(1, Math.max(0, window.scrollY / max)); };
    function girar() { pendiente = false; const g = avance() * 360; m1.style.transform = "rotate(" + Math.min(180, g).toFixed(1) + "deg)"; m2.style.transform = "rotate(" + Math.max(0, g - 180).toFixed(1) + "deg)"; }
    // palabras de la vista (sin forzar el diseño: textContent), una vez por ruta; unas 180 por minuto en un texto con ampliaciones
    let palabras = 0, rutaPal = "";
    const contar = () => { if (rutaPal !== location.hash || !palabras) { rutaPal = location.hash; const v = vista(); palabras = v ? (v.textContent.match(/[\p{L}\p{N}]+/gu) || []).length : 0; } return palabras; };
    function medir() {
      const p = avance(); caja.classList.toggle("en-ini", p < 0.02); caja.classList.toggle("en-fin", p > 0.98); if (!ATADO) girar();
      const hay = secciones().length >= 2; secBtn.hidden = !hay; if (!hay) alternarSecs(false);
      actualizarBtnMk();
      if (p > 0.94 && caja.classList.contains("vis") && secLista.hidden && mkPan.hidden) { clearTimeout(reloj); reloj = setTimeout(ocultarQuieto, 700); }
      const n = p > 0.88 ? 0 : Math.round((contar() * (1 - p)) / 180), txt = n >= 1 ? "≈ " + n + " min" : "";
      if (mins.textContent !== txt) mins.textContent = txt;
      caja.classList.toggle("con-min", !!txt);
    }
    let tMed = 0;
    window.addEventListener("scroll", () => { clearTimeout(tMed); tMed = setTimeout(medir, 180); mostrar(); if (!ATADO && !pendiente) { pendiente = true; requestAnimationFrame(girar); } }, { passive: true });
    window.addEventListener("hashchange", () => { caja.classList.remove("vis"); alternarSecs(false); alternarMk(false); });
    document.addEventListener("pointerdown", (e) => {
      if (!secLista.hidden && !caja.contains(e.target)) alternarSecs(false);
      if (!mkPan.hidden && !caja.contains(e.target)) { alternarMk(false); mostrar(); }
      // AL5 + PR #17: un toque en el pie o en Pulso del texto (.ps-cap) aparta al instante los saltos rápidos para no tapar nada
      if (caja.classList.contains("vis") && !caja.contains(e.target) && e.target.closest && e.target.closest(".pie, .ps-cap")) { clearTimeout(reloj); caja.classList.remove("vis"); alternarSecs(false); alternarMk(false); }
    }, true);
    const alSalirCaja = (e) => {
      if (e && e.relatedTarget && caja.contains(e.relatedTarget)) return;
      if (!caja.classList.contains("vis") || !mkPan.hidden) return;
      clearTimeout(reloj);
      reloj = setTimeout(ocultarQuieto, !secLista.hidden ? 6000 : caja.classList.contains("en-fin") ? 800 : 2600);
    };
    caja.addEventListener("mouseleave", alSalirCaja);
    caja.addEventListener("focusout", alSalirCaja);
  })();

  // ------------------------------------------------------------------ copiar con la autoría
  // (BiEx, 22-nov-2026, 15:59) al copiar un tramo de la Lectura o de la Textual con la copia del navegador, el texto pegado lleva la
  // referencia (libro, capítulo en hebreo y en romano, versos) y la autoría de Biblia Exacta, y el enlace al pasaje en el sitio oficial
  document.addEventListener("copy", (e) => {
    try {
      const sel = getSelection(), vistaE = document.getElementById("vista");
      if (!sel || sel.isCollapsed || !e.clipboardData || !vistaE || !esc.libro || !esc.cap || esc.modo === "a") return;
      const rg = sel.getRangeAt(0); if (!vistaE.contains(rg.commonAncestorContainer)) return;
      const b = libroDe(esc.libro); if (!b) return;
      const vs = [...vistaE.querySelectorAll("[id^='v']")].filter((el) => /^v\d+$/.test(el.id) && sel.containsNode(el, true)).map((el) => +el.id.slice(1));
      const texto = sel.toString().replace(/\u00a0/g, " ").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim(); if (!texto) return;
      const capH = String((b.caps[esc.cap - 1] || {}).h || "").match(/^(.*?)\s*\[[^\]]*\]\s*(\S+)?\s*$/);
      const he = capH ? capH[1] : "", rom = capH && capH[2] ? capH[2] : String(esc.cap);
      const tramo = vs.length ? (vs[0] === vs[vs.length - 1] ? String(vs[0]) : vs[0] + "–" + vs[vs.length - 1]) : "";
      const ref = (b.t || b.n) + (b.t ? " «" + b.n + "»" : "") + " " + (he ? he + " " : "") + rom + (tramo ? ", " + tramo : "");
      const enlace = mdEnlace("#/" + b.c + "/" + esc.cap + "/" + (esc.modo === "o" || prefs.lorg ? "o" : "l") + (vs.length ? "/" + vs[0] : ""));
      e.clipboardData.setData("text/plain", ref + "\nBiEx - Biblia Exacta ©:\n" + texto + "\n" + enlace);
      e.preventDefault();
    } catch (err) { /* si algo falla, queda la copia normal del navegador */ }
  });

  // ------------------------------------------------------------------ lectura inmersiva
  // En teléfonos, el primer toque pide pantalla completa (dentro del sitio oficial se lo pide a la página que lo aloja);
  // los navegadores solo lo permiten tras un gesto, y en iPhone no existe para páginas. Si la persona sale, no se insiste.
  // Además, al leer hacia abajo la barra superior se retira y vuelve con cualquier movimiento hacia arriba o del puntero.
  const TACTIL = window.matchMedia && matchMedia("(pointer: coarse)").matches;
  let pidioPantalla = (() => { try { return sessionStorage.getItem("biex:pc") === "1"; } catch (e) { return false; } })();
  // Navegadores integrados de otras aplicaciones (Messenger, Facebook, Instagram…): la pantalla completa descoloca su
  // propia barra, así que no se pide; además, en Android agrandan todo el texto con el tamaño de letra del sistema sin
  // agrandar las cajas (los rótulos se desbordan): se mide y se compensa en la raíz (BiEx, 9-nov-2026).
  const EN_APP = /FBAN|FBAV|FB_IAB|FBIOS|Instagram|Messenger|MicroMessenger|Line\/|TikTok|musical_ly|Snapchat|Pinterest|LinkedInApp/i.test(navigator.userAgent || "") || (/Android/i.test(navigator.userAgent || "") && /; wv\)/.test(navigator.userAgent || ""));
  if (EN_APP) document.documentElement.classList.add("en-app");
  (function zoomTexto() {
    try {
      const m = document.createElement("div"); m.style.cssText = "position:absolute;left:-999px;top:0;visibility:hidden;font:100px/1 sans-serif;white-space:nowrap"; m.textContent = "M";
      document.body.append(m); const z = m.offsetHeight / 100; m.remove();
      if (z > 1.06 && z < 3) { document.documentElement.style.setProperty("--zoom-texto", z.toFixed(3)); document.documentElement.classList.add("zoom-texto"); }
    } catch (e) { /* sin medición */ }
  })();
  function pedirPantalla() {
    if (pidioPantalla || !TACTIL || EN_APP) return;
    pidioPantalla = true; try { sessionStorage.setItem("biex:pc", "1"); } catch (e) { /* ignorar */ }
    if (EMBED) { alPadre({ biex: "pantalla" }); return; }
    const el = document.documentElement;
    try { if (document.fullscreenEnabled && !document.fullscreenElement && el.requestFullscreen) el.requestFullscreen({ navigationUI: "hide" }).catch(() => {}); } catch (e) { /* sin pantalla completa */ }
  }
  void pedirPantalla;
  let yInm = window.scrollY, tInm = 0, tDesp = 0;
  // (con la lupa puesta las barras no se retiran: la del capítulo va en el flujo y su cambio de altura movería la página)
  const inmersivo = (si) => { if (si && document.documentElement.classList.contains("lupa")) si = false; if (si) { medirBarraHoja(); marcarPegada(); } document.documentElement.classList.toggle("inmersivo", !!si); };
  // A9 · Modo «Contemplar» (Neon, 23-nov-2026): solo el texto sagrado, sin barras ni distracciones; sale con el botón discreto o Esc
  let btnContSalir = null;
  function ponerContemplar(si, silencioso) {
    const on = !!si;
    if (on && !btnContSalir) {
      btnContSalir = h("button", { class: "btn-cont-salir", type: "button", "aria-label": "Salir del modo Contemplar", title: "Salir de Contemplar (Esc)", onclick: () => ponerContemplar(false) },
        svg(ICO.contemplar), h("span", { class: "btn-cont-lbl" }, h("span", { text: "Salir" }), h("span", { class: "btn-cont-x", text: "\u00a0de Contemplar" })));
      document.body.append(btnContSalir);
    }
    document.documentElement.classList.toggle("contemplar", on);
    if (on) inmersivo(false);
    for (const b of document.querySelectorAll(".btn-cont")) b.setAttribute("aria-pressed", String(on));
    if (!silencioso) avisar(on ? "Modo Contemplar: solo el texto sagrado · Esc o toca abajo para salir" : "Saliste del modo Contemplar");
  }
  window.addEventListener("keydown", (e) => {
    if (modal.open) return;
    const tg = e.target && e.target.tagName;
    if (tg === "INPUT" || tg === "TEXTAREA" || tg === "SELECT" || (e.target && e.target.isContentEditable)) return;
    if (e.key === "Escape" && document.documentElement.classList.contains("contemplar")) { e.preventDefault(); ponerContemplar(false); }
    else if (e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey && (e.key === "C" || e.key === "c") && esc.libro && esc.modo !== "a") {
      e.preventDefault(); ponerContemplar(!document.documentElement.classList.contains("contemplar"));
    }
  });
  // PR #18 · Observador pasivo para .bh-pegada (cero getBoundingClientRect / getComputedStyle por evento de scroll)
  let pegadaIO = null;
  function marcarPegada() {
    const bh = $(".barra-hoja"), c = $(".bh-centinela"); if (!bh || !c) return;
    const peg = c.getBoundingClientRect().top <= (parseFloat(getComputedStyle(bh).top) || 0) + 0.5;
    if (peg !== bh.classList.contains("bh-pegada")) bh.classList.toggle("bh-pegada", peg);
  }
  function observarPegada() {
    if (pegadaIO) { pegadaIO.disconnect(); pegadaIO = null; }
    const bh = $(".barra-hoja"), c = $(".bh-centinela");
    if (!bh || !c) return;
    if (!("IntersectionObserver" in window)) { marcarPegada(); return; }
    const tope = Math.max(0, Math.round(parseFloat(getComputedStyle(bh).top) || 56));
    pegadaIO = new IntersectionObserver((es) => {
      const e = es[es.length - 1];
      if (!e || !bh.isConnected) return;
      const peg = !e.isIntersecting && e.boundingClientRect.top <= tope + 2;
      if (peg !== bh.classList.contains("bh-pegada")) bh.classList.toggle("bh-pegada", peg);
    }, { rootMargin: (-tope - 1) + "px 0px 0px 0px", threshold: 0 });
    pegadaIO.observe(c);
    marcarPegada();
  }
  window.addEventListener("resize", () => { if ($(".barra-hoja")) observarPegada(); }, { passive: true });
  // PR #18 · Ocultación inmediata de iconos flotantes inferiores al llegar al final de cualquier página (footer.pie-a)
  var enPieGlobal = false;
  let pieGlobalIO = null, finCapIO = null, hitPieGlobal = false, hitFinCap = false;
  function actualizarEnPie() {
    const maxS = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const on = (hitPieGlobal && (window.scrollY > 24 || maxS < 140)) || (hitFinCap && window.scrollY > 40);
    if (enPieGlobal === on) {
      for (const s of [".faro-btn", ".adelante", ".saltos-rap"]) { const e = $(s); if (e) e.classList.toggle("en-pie", on); }
      return;
    }
    enPieGlobal = on;
    for (const s of [".faro-btn", ".adelante", ".saltos-rap"]) { const e = $(s); if (e) e.classList.toggle("en-pie", on); }
    try { if (window.BiExJuego && BiExJuego.enPie) BiExJuego.enPie(on); } catch (e) { /* sin juego */ }
  }
  function observarFinVista() {
    if (!("IntersectionObserver" in window)) return;
    if (!pieGlobalIO) {
      const pie = document.querySelector("footer.pie-a");
      if (pie) {
        pieGlobalIO = new IntersectionObserver((es) => {
          for (const x of es) hitPieGlobal = x.isIntersecting;
          actualizarEnPie();
        }, { rootMargin: "0px 0px 180px 0px", threshold: 0 });
        pieGlobalIO.observe(pie);
      }
    }
    if (finCapIO) { finCapIO.disconnect(); finCapIO = null; }
    hitFinCap = false;
    const objetivos = [...document.querySelectorAll("#vista .fin-leido, #vista nav.fin-cap")];
    if (objetivos.length) {
      const visSet = new Set();
      finCapIO = new IntersectionObserver((es) => {
        for (const x of es) { if (x.isIntersecting) visSet.add(x.target); else visSet.delete(x.target); }
        hitFinCap = visSet.size > 0;
        actualizarEnPie();
      }, { rootMargin: "0px 0px -56px 0px", threshold: 0 });
      for (const el of objetivos) finCapIO.observe(el);
    }
    actualizarEnPie();
  }
  setTimeout(observarFinVista, 0);
  if (window.MutationObserver) {
    const vEl = document.getElementById("vista");
    if (vEl) new MutationObserver(() => requestAnimationFrame(observarFinVista)).observe(vEl, { childList: true });
  }
  window.addEventListener("hashchange", () => requestAnimationFrame(observarFinVista));

  fijarInmersivo = inmersivo;
  // al leer, la barra del capítulo deja a la vista solo la fila del capítulo y sus flechas (sube lo demás bajo el borde)
  function medirBarraHoja() {
    const bh = $(".barra-hoja"); if (!bh) return;
    const g = bh.querySelector(".cap-grupo"), visible = g && g.offsetParent ? g : null;
    const sube = visible && window.innerWidth < 1024 ? Math.max(0, visible.offsetTop - 8) : 0;
    bh.style.setProperty("--bh-sube", sube + "px");
  }
  window.addEventListener("scroll", () => {
    const y = window.scrollY, dy = y - yInm; yInm = y;
    // los saltos del propio lector (restaurar una posición, abrir un verso) no cuentan como lectura
    if (RP.objetivo != null || modal.open || document.documentElement.classList.contains("contemplar") || performance.now() - (RP.fin || 0) < 900) { clearTimeout(tInm); return; }
    if (y < 160 || menuAbierto) { clearTimeout(tInm); inmersivo(false); return; }
    if (dy < -4) { clearTimeout(tInm); inmersivo(false); }
    else if (dy > 4 && !document.documentElement.classList.contains("inmersivo")) { clearTimeout(tInm); tInm = setTimeout(() => { if (window.scrollY > 160 && !menuAbierto) inmersivo(true); }, 900); }
  }, { passive: true });
  window.addEventListener("mousemove", (e) => { if (e.clientY < 110) { clearTimeout(tInm); inmersivo(false); } }, { passive: true });
  document.addEventListener("focusin", (e) => { if (e.target.closest && e.target.closest(".barra")) inmersivo(false); });

  // Adelante: como el botón del navegador (que no existe en la app instalada), vuelve exactamente a donde se estaba; la
  // posición la restaura la memoria de lectura. Regla de BiEx: aparece SOLO cuando hay una vista real a la que avanzar, es
  // decir, después de volver atrás; nunca por los pasos de una ventana cerrada con × (que el navegador conserva pero ya no
  // llevan a nada) ni, tras recargar, por ventanas que ya no se pueden reabrir. Dentro de una ventana va en su cabecera.
  function botonAdelante() {
    const nav = window.navigation && "canGoForward" in window.navigation ? window.navigation : null;
    let P = { k: [], i: -1 };
    try { P = JSON.parse(sessionStorage.getItem("biex:pila") || "null") || P; } catch (e) { /* sin almacenamiento */ }
    if (!Array.isArray(P.k) || typeof P.i !== "number") P = { k: [], i: -1 };
    // tras cargar la página, las ventanas que quedaban adelante ya no se pueden reabrir (su memoria era de la carga anterior)
    for (let j = P.i + 1; j < P.k.length; j++) if (!/\|$/.test(P.k[j])) { P.k = P.k.slice(0, j); break; }
    const clave = () => { const st = history.state || {}; return st.bx ? st.bx + "|" + (st.vid || "") : null; };
    const guardar = () => { try { sessionStorage.setItem("biex:pila", JSON.stringify(P)); } catch (e) { /* ignorar */ } };
    const btn = h("button", { class: "adelante", type: "button", "aria-label": "Adelante: volver a donde estabas", title: "Adelante", onclick: () => { btn.classList.remove("vis"); history.forward(); } },
      h("span", { text: "Adelante" }), svg(ICO.der));
    document.body.append(btn);
    const puede = () => !modal.open && P.i >= 0 && P.i < P.k.length - 1 && (!nav || nav.canGoForward);
    const pintar = () => { btn.classList.toggle("vis", !!puede()); if (typeof FARO !== "undefined" && FARO.ubicar) FARO.ubicar(); };
    repintarAdelante = () => requestAnimationFrame(pintar);
    pasoAdelante = (nuevo) => {
      const k = clave(); if (!k) return;
      const j = P.k.lastIndexOf(k);
      if (!nuevo && j >= 0) P.i = j;
      else if (j < 0 || j !== P.i) { P.k = P.k.slice(0, P.i + 1); P.k.push(k); if (P.k.length > 300) P.k = P.k.slice(-300); P.i = P.k.length - 1; }
      guardar(); requestAnimationFrame(pintar);
    };
    window.addEventListener("popstate", () => {
      const k = clave();
      if (k) { const j = P.k.lastIndexOf(k); if (j >= 0) { P.i = j; if (M.cortar) P.k = P.k.slice(0, j + 1); guardar(); } }
      M.cortar = false;
      requestAnimationFrame(pintar);
    });
    if (nav) nav.addEventListener("currententrychange", () => requestAnimationFrame(pintar));
    pintar();
  }
  // ------------------------------------------------------------------ planes de lectura
  // Sobre el orden cronológico de BiEx (los relatos por su primer acontecimiento, luego Prάc̅ṣεις y las cartas por su fecha de
  // escritura, Ἀpοκάlυpsις al final): el reparto por días equilibra el número de versos. El avance queda en el dispositivo
  // (biex:planes) y la siguiente lectura aparece en la portada y al terminar su último capítulo.
  const NO_CARTAS = ["MAT", "MRK", "LUK", "JHN", "ACT", "REV"];
  const PLANES = [
    { id: "crono-90", t: "La Nueva Voluntad en orden χrοnοlόgικο", dias: 90, ord: "crono", d: () => "Toda la Nueva Voluntad en 90 días, en el orden en que sucedieron los hechos y se escribieron las cartas." },
    { id: "anual", t: "Un año con la Nueva Voluntad", dias: 260, ord: "crono", d: () => "Un capítulo por lectura: los 260 capítulos en orden χrοnοlόgικο, cinco por semana durante un año." },
    { id: "relatos-40", t: "Los relatos de la vida de YēshŪ́aʿ", dias: 40, ord: "crono", sel: ["LUK", "MAT", "MRK", "JHN"], d: () => ["LUK", "MAT", "MRK", "JHN"].map((c) => nombreLibro(libroDe(c))).join(", ").replace(/, ([^,]*)$/, " y $1") + ", en 40 días, según el primer acontecimiento que narra cada uno." },
    { id: "cartas-60", t: "Las cartas en el orden en que se escribieron", dias: 60, ord: "escritura", cartas: true, d: () => "Las cartas en 60 días, cada una en su momento: de la más temprana a la última, antes del año 70." },
    { id: "escritura-90", t: "La Nueva Voluntad en el orden en que se escribió", dias: 90, ord: "escritura", d: () => "Toda la Nueva Voluntad en 90 días, libro por libro en el orden en que se escribió, del más temprano al último." },
    { id: "nv-30", t: "La Nueva Voluntad en 30 días", dias: 30, ord: "crono", d: () => "Una lectura intensa, de unos nueve capítulos por día, en orden χrοnοlόgικο." },
  ];
  const planDe = (id) => PLANES.find((x) => x.id === id) || null;
  const estPlanes = () => { const e = store.get("planes", null); return e && typeof e === "object" ? Object.assign({ act: null, hechos: {}, ini: {}, fechas: {}, ranking: false }, e) : { act: null, hechos: {}, ini: {}, fechas: {}, ranking: false }; };
  const calcularRkPlan = (e) => {
    const id = e.act && planDe(e.act) ? e.act : PLANES.map((p) => [p.id, (e.hechos[p.id] || []).length]).sort((a, b) => b[1] - a[1])[0][0];
    const pl = planDe(id); if (!pl || !D) return null;
    const tot = Math.max(1, diasPlan(pl).length), dias = (e.hechos[id] || []).length;
    return { planId: id, pct: Math.min(100, Math.round((100 * dias) / tot)), dias };
  };
  const guardarPlanes = (e, ya) => {
    const rk = calcularRkPlan(e); if (rk) e.rk = rk;
    store.set("planes", e);
    NUBE_DAT.cambio(ya ? "ya" : "");
    FARO.actualizar();
  };
  // A4 · Datos clave de estudio y memoria por libro (sin transliteraciones inventadas: el nombre y fechas salen siempre del catálogo BiEx)
  const CLAVE_LIBRO = {
    LUK: "Relato investigado «desde arriba con exactitud»: conecta la historia de Israel con el alcance universal del Mensaje.",
    MAT: "Reúne cinco grandes discursos del Ungido y muestra el cumplimiento de las Escrituras de la Antigua Voluntad.",
    MRK: "Narración ágil y directa de los hechos y la autoridad del Ungido, marcada por el ritmo del «al instante».",
    JHN: "Siete señales y discursos hondos que revelan al Lόgος [Palabra] como fuente de vida y luz.",
    ACT: "Crónica de cómo el testimonio cruza desde Yᵉrūshāláyim [Jerusalén] hasta ῾Hrṓmē [Roma] por el impulso del espíritu.",
    JAS: "Sabiduría práctica: una confianza viva se comprueba en el dominio de la lengua, la imparcialidad y las obras.",
    GAL: "Defensa firme de la libertad frente a las cargas añadidas y llamado a caminar en el fruto del espíritu.",
    "1TH": "Escrito temprano de aliento en medio de la presión: perseverancia, santidad cotidiana y esperanza despierta.",
    "2TH": "Aclara rumores sobre el día del Señor y llama a la calma, al trabajo fiel y a no ceder al desánimo.",
    "1CO": "Responde a divisiones y preguntas concretas de una comunidad real, coronado por el camino superior de la benevolencia.",
    "2CO": "Revela la fuerza que se perfecciona en la debilidad y el ministerio de la reconciliación.",
    ROM: "Exposición ordenada de la justicia, la misericordia y la unidad entre judíos y naciones.",
    EPH: "Dibuja el propósito eterno de unidad y equipa al creyente con la armadura completa para mantenerse firme.",
    PHP: "Carta de gozo sereno escrita desde la prisión: humildad mental, contentamiento y mirada en la meta.",
    COL: "Coloca al Ungido por encima de toda filosofía o tradición humana vacía y llama a una vida renovada.",
    PHM: "Carta breve y personal donde la fraternidad transforma desde dentro las relaciones humanas.",
    "1TI": "Guía pastoral para cuidar la enseñanza sana, el carácter probado y el orden en la congregación.",
    TIT: "Une doctrina íntegra con conducta digna en la vida pública y doméstica.",
    "2TI": "Testamento final de fidelidad: guardar el depósito, resistir con temple y aprovechar toda Escritura inspirada.",
    HEB: "Contrasta sombras y realidad plena, llamando a acercarse con confianza y correr con perseverancia.",
    "1PE": "Fortalece a lectores extranjeros y probados recordando su identidad como cantos [bloques] viviendo.",
    "2PE": "Advierte contra distorsiones de las Escrituras y anima a añadir virtud, conocimiento y dominio propio.",
    "1JN": "Distingue luz y oscuridad: conocer de verdad se demuestra caminando en verdad y benevolencia.",
    "2JN": "Equilibrio breve entre firmeza en la enseñanza verdadera y hospitalidad con discernimiento.",
    "3JN": "Contrasta el servicio generoso con el afán de protagonismo dentro de la comunidad.",
    JUD: "Exhortación breve a contender por la confianza entregada y sostener con misericordia a quien duda.",
    REV: "Visión simbólica de consuelo y discernimiento que culmina con la renovación total de toda creación.",
  };
  const HITOS_PLAN = {
    "crono-90": [[25, "Primer cuarto · Relatos en escena", "Recorriste el arranque de la vida del Ungido y sus primeras enseñanzas."], [50, "Mitad del camino · Nacimiento de las comunidades", "Llegaste a la expansión del testimonio y las primeras cartas históricas."], [75, "Tres cuartos · Cartas de madurez", "Atas los hilos entre doctrina, ética cotidiana y discernimiento comunitario."], [100, "Travesía completa · Toda la Nueva Voluntad", "Completaste los 27 libros en orden χrοnοlόgικο."]],
    anual: [[25, "Primer trimestre · Raíz firme", "Constancia diaria sin prisas: un capítulo a la vez construye memoria duradera."], [50, "Medio año · Ritmo consolidado", "La mitad de los 260 capítulos ya forma parte de tu lectura habitual."], [75, "Tercer trimestre · Visión de conjunto", "Empiezas a notar cómo cada carta conversa con los relatos previos."], [100, "Año cumplido · 260 capítulos", "Has recorrido íntegra la Nueva Voluntad capítulo por capítulo."]],
    "relatos-40": [[25, "Primer relato · Contexto y nacimiento", "Afianzas el marco histórico y los primeros discursos."], [50, "Mitad · Señales y parábolas", "Comparas el tono y el enfoque propio de cada declarante."], [75, "Recta final · Camino a Yᵉrūshāláyim [Jerusalén]", "Se intensifican los diálogos clave y la confrontación con la tradición."], [100, "Cuatro declarantes completos", "Recorriste los cuatro relatos de la vida de YēshŪ́aʿ en orden χrοnοlόgικο."]],
    "cartas-60": [[25, "Cartas tempranas · Primeras respuestas", "Viste nacer la correspondencia práctica antes de los grandes tratados."], [50, "Núcleo epistolar · Comunidad y gracia", "Recorriste las grandes cartas sobre unidad, libertad y justicia."], [75, "Cartas desde prisión y cuidado pastoral", "Profundizas en firmeza, armadura interior y liderazgo íntegro."], [100, "Todas las cartas completadas", "Leíste las 21 cartas en el orden histórico en que fueron escritas."]],
    "escritura-90": [[25, "Primeros manuscritos en circulación", "Leíste los textos más tempranos tal como los recibieron las primeras comunidades."], [50, "Mitad · Consolidación del testimonio", "Observas cómo maduran los relatos escritos junto a las cartas."], [75, "Tercer tramo · Defensa y perseverancia", "Atraviesas escritos de firmeza ante crisis y falsas enseñanzas."], [100, "Secuencia de escritura completa", "Completaste los 27 libros del primero al último en redactarse."]],
    "nv-30": [[25, "Semana 1 · Impulso panorámico", "Captas el arco narrativo completo sin perder el hilo entre capítulos."], [50, "Mitad · Lectura de inmersión", "Superaste el ecuador de la lectura intensiva en 30 días."], [75, "Semana 3 · Conexiones vivas", "Las ideas recurrentes entre cartas y relatos resaltan con nitidez."], [100, "30 días · Visión panorámica total", "Completaste toda la Nueva Voluntad en un mes."]],
  };
  function datoDiaPlan(dia) {
    if (!dia || !dia.length) return null;
    const b = dia[0].b;
    const fe = fechaEscrito(b), fn = fechaNarra(b);
    const meta = [nombreLibro(b), fe ? "escrito c. " + fe.replace(/^c\. /, "") + (/H\.D\./.test(fe) ? "" : " " + ERA_D) : "", fn ? "narra " + fn : ""].filter(Boolean).join(" · ");
    const clave = CLAVE_LIBRO[b.c] || "Lee atento a las palabras repetidas y al contexto de todo el capítulo.";
    return { meta, clave };
  }
  const cachePlan = new Map();
  function diasPlan(pl) {
    if (cachePlan.has(pl.id)) return cachePlan.get(pl.id);
    let libros = (CRONO && CRONO.ordenes[pl.ord] ? CRONO.ordenes[pl.ord].map(libroDe) : D.libros.slice()).filter(Boolean);
    if (pl.sel) libros = libros.filter((b) => pl.sel.includes(b.c));
    if (pl.cartas) libros = libros.filter((b) => !NO_CARTAS.includes(b.c));
    const caps = []; for (const b of libros) for (const C of b.caps) caps.push({ b, c: C.c, w: C.total || 20 });
    const N = Math.min(pl.dias, caps.length), total = caps.reduce((a, x) => a + x.w, 0), dias = [];
    let acc = 0, k = 0;
    for (let d = 0; d < N; d++) {
      const meta = (total * (d + 1)) / N, dia = [];
      while (k < caps.length && caps.length - k > N - d - 1 && (!dia.length || acc + caps[k].w / 2 <= meta)) { dia.push(caps[k]); acc += caps[k].w; k++; }
      dias.push(dia);
    }
    while (k < caps.length) dias[dias.length - 1].push(caps[k++]);
    cachePlan.set(pl.id, dias);
    return dias;
  }
  // «Μᾶrκος 3–4 · YÔḥānā́n 1»
  function etDia(dia) {
    const g = []; for (const x of dia) { const u = g[g.length - 1]; if (u && u.b === x.b && x.c === u.z + 1) u.z = x.c; else g.push({ b: x.b, a: x.c, z: x.c }); }
    return g.map((u) => (u.b.t || u.b.n) + " " + u.a + (u.z > u.a ? "–" + u.z : "")).join(" · ");
  }
  const sigDia = (pl, e) => { const hs = new Set(e.hechos[pl.id] || []), n = diasPlan(pl).length; for (let i = 0; i < n; i++) if (!hs.has(i)) return i; return -1; };
  function marcarDia(pl, i, si) {
    const e = estPlanes(), hs = new Set(e.hechos[pl.id] || []);
    if (si) hs.add(i); else hs.delete(i);
    e.hechos[pl.id] = [...hs].sort((a, b) => a - b);
    // el día en que se cumplió cada lectura (gráfico «días con la meta cumplida»)
    const f = e.fechas[pl.id] || (e.fechas[pl.id] = {});
    if (si) f[i] = f[i] || LEI.hoy(); else delete f[i];
    if (si && !e.act) e.act = pl.id;
    guardarPlanes(e);
    // la lectura del día cuenta también como versos leídos
    if (si) for (const x of diasPlan(pl)[i] || []) lectura(x.b.c).then((Lc) => { const vs = (Lc.caps[x.c] || []).map((y) => y.v); LEI.marcar(x.b.c, x.c, vs, true); marcarLeidoDom(x.b.c, x.c, vs, true); }).catch(() => {});
  }
  // Tu lectura: cifras y los últimos 30 días (versos leídos por día y días con la lectura del plan cumplida), en vector
  function panelLectura() {
    const d = LEI.todo(), porDia = new Map(); let versos = 0, caps = 0;
    for (const [kc, m] of Object.entries(d)) {
      const [c, cap] = kc.split("."), b = libroDe(c), C = b && b.caps[+cap - 1], n = Object.keys(m).length;
      versos += n; if (C && n >= (C.total || 1e9)) caps++;
      for (const f of Object.values(m)) porDia.set(f, (porDia.get(f) || 0) + 1);
    }
    const e = estPlanes(), metas = new Set();
    for (const f of Object.values(e.fechas || {})) for (const x of Object.values(f)) metas.add(x);
    const aNum = (t) => t.getFullYear() * 10000 + (t.getMonth() + 1) * 100 + t.getDate();
    const dias = new Set([...porDia.keys(), ...metas]);
    // racha amable: días seguidos con lectura hasta hoy, o hasta ayer si hoy aún no se ha leído
    let racha = 0; const t = new Date(); if (!dias.has(aNum(t))) t.setDate(t.getDate() - 1);
    while (dias.has(aNum(t))) { racha++; t.setDate(t.getDate() - 1); }
    const ult = [], t2 = new Date(); t2.setDate(t2.getDate() - 29);
    for (let i = 0; i < 30; i++) { const n = aNum(t2); ult.push({ n, v: porDia.get(n) || 0, meta: metas.has(n), d: t2.getDate() }); t2.setDate(t2.getDate() + 1); }
    const max = Math.max(1, ...ult.map((x) => x.v)), W = 300, H = 78, bw = W / 30;
    const barras = ult.map((x, i) => {
      const hh = x.v ? Math.max(3, (x.v / max) * (H - 18)) : 1.5;
      return '<rect x="' + (i * bw + 1.2).toFixed(1) + '" y="' + (H - 12 - hh).toFixed(1) + '" width="' + (bw - 2.4).toFixed(1) + '" height="' + hh.toFixed(1) + '" rx="1.6" class="' + (x.v ? "b-si" : "b-no") + (i === 29 ? " b-hoy" : "") + '"><title>' + x.d + ": " + x.v + (x.v === 1 ? " verso" : " versos") + (x.meta ? " · lectura del plan cumplida" : "") + "</title></rect>" +
        (x.meta ? '<circle cx="' + (i * bw + bw / 2).toFixed(1) + '" cy="' + (H - 4) + '" r="2.2" class="b-meta"/>' : "");
    }).join("");
    const total = D.total || 7942, cifra = (n, t3) => h("div", { class: "pls-c" }, h("b", { text: fmt(n) }), h("span", { text: t3 }));
    const vacio = !versos && !metas.size;
    return h("section", { class: "pl-stats", "aria-label": "Tu lectura" },
      h("div", { class: "pls-cab" }, h("span", { class: "eyebrow", text: "Tu lectura" }), h("span", { class: "pls-pct", text: (versos / total * 100).toFixed(versos && versos / total < 0.1 ? 2 : 1).replace(".", ",") + " % de la Nueva Voluntad" })),
      h("div", { class: "pls-barra", "aria-hidden": "true" }, h("i", { style: "width:" + Math.min(100, versos / total * 100).toFixed(2) + "%" })),
      h("div", { class: "pls-cifras" }, cifra(versos, versos === 1 ? "verso leído" : "versos leídos"), cifra(caps, caps === 1 ? "capítulo completo" : "capítulos completos"), cifra(dias.size, dias.size === 1 ? "día de lectura" : "días de lectura"), cifra(racha, racha === 1 ? "día seguido" : "días seguidos")),
      vacio ? h("p", { class: "nota-ui", text: "Marca como leídos los versos (en su ventana) o los capítulos (al final de cada uno), o las lecturas de un plan, y aquí verás tu avance día a día." }) :
        h("figure", { class: "pls-graf" }, svg(barras, "0 0 " + W + " " + H), h("figcaption", {}, "Últimos 30 días: versos leídos por día", h("span", { class: "pls-ley" }, h("i"), " lectura del plan cumplida"))));
  }
  function anilloPlan(p) {
    const C = 2 * Math.PI * 17;
    return h("span", { class: "pl-anillo", "aria-hidden": "true" }, svg('<circle cx="20" cy="20" r="17" fill="none" stroke="currentColor" stroke-opacity=".2" stroke-width="3"/><circle cx="20" cy="20" r="17" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-dasharray="' + (C * p).toFixed(1) + " " + C.toFixed(1) + '" transform="rotate(-90 20 20)"/>', "0 0 40 40"), h("b", { text: Math.round(p * 100) + "%" }));
  }
  function insigniaNubePlan() {
    const con = !!NUBE.tok();
    return h("span", { class: "pl-nube-est" + (con ? " ok" : "") }, h("i", { "aria-hidden": "true" }),
      con ? "Sincronizado en la nube con tu cuenta de Escudriña" : "Guardado en este dispositivo · entra a Escudriña para llevarlo a la nube");
  }
  // Tarjeta de la siguiente lectura del plan activo (portada)
  function tarjetaPlanHoy() {
    const e = estPlanes(), pl = e.act && planDe(e.act); if (!pl || !D) return null;
    const dias = diasPlan(pl), i = sigDia(pl, e), hechos = (e.hechos[pl.id] || []).length;
    const cab = h("div", { class: "pl-hoy-cab" }, anilloPlan(hechos / dias.length), h("div", {}, h("span", { class: "eyebrow", text: "Tu plan de lectura" }), h("b", { text: pl.t })));
    if (i < 0) return h("section", { class: "pl-hoy in" }, cab, h("p", { text: "Terminaste el plan. ¡Bien hecho!" }), h("a", { class: "btn chico", href: "#/planes", text: "Elegir otro plan" }));
    const dia = dias[i];
    return h("section", { class: "pl-hoy in" }, cab,
      h("p", {}, h("span", { class: "pl-dn", text: "Siguiente · Día " + (i + 1) + " de " + dias.length + ": " }), etDia(dia)),
      h("div", { class: "pl-acc" }, h("a", { class: "btn oro chico", href: "#/" + dia[0].b.c + "/" + dia[0].c }, svg(ICO.libro), h("span", { text: "Leer" })), h("a", { class: "btn chico", href: "#/planes/" + pl.id, text: "Ver el plan" })));
  }
  // Al terminar el último capítulo de la siguiente lectura del plan: marcarla como leída
  function finPlan(b, cap) {
    const e = estPlanes(), pl = e.act && planDe(e.act); if (!pl) return null;
    const i = sigDia(pl, e); if (i < 0) return null;
    const dia = diasPlan(pl)[i], u = dia[dia.length - 1]; if (!dia.some((x) => x.b === b && x.c === cap)) return null;
    const ultimo = u.b === b && u.c === cap;
    const btn = h("button", { class: "btn chico", type: "button", onclick: () => { marcarDia(pl, i, true); avisar("Día " + (i + 1) + " del plan marcado como leído"); btn.replaceWith(h("span", { class: "pl-ok" }, svg(ICO.chispa), "Día " + (i + 1) + " leído")); } },
      svg(ICO.chispa), h("span", { text: ultimo ? "Marcar el día " + (i + 1) + " del plan como leído" : "Día " + (i + 1) + " del plan: " + etDia(dia) }));
    return h("div", { class: "fin-plan" }, h("span", { class: "eyebrow", text: pl.t }), btn);
  }
  function vistaPlanes(id) {
    navActual("");
    const e = estPlanes();
    if (id && planDe(id)) return vistaPlan(planDe(id));
    document.title = "Planes de lectura · BiEx";
    const tarjeta = (pl) => {
      const n = diasPlan(pl).length, hechos = (e.hechos[pl.id] || []).length, act = e.act === pl.id;
      return h("a", { class: "pl-tarjeta" + (act ? " act" : ""), href: "#/planes/" + pl.id }, anilloPlan(hechos / n),
        h("div", {}, h("h2", { text: pl.t }), h("p", { text: pl.d() }), h("span", { class: "pl-meta", text: n + " lecturas" + (hechos ? " · " + hechos + " hechas" : "") + (act ? " · plan activo" : "") })), svg(ICO.der));
    };
    const pLec = panelLectura(); if (pLec) pLec.dataset.sec = "Tu lectura";
    vista().replaceChildren(h("div", { class: "in" }, h("section", { class: "panel planes" },
      h("div", { class: "panel-cab" }, h("span", { class: "eyebrow", text: "Leer con constancia" }), h("h1", { class: "texto", text: "Planes de lectura" }),
        h("p", { class: "est-sub", text: "Elige un plan, aprende un dato clave cada día y avanza a tu ritmo sin castigos. Con cuenta de Escudriña tu avance viaja en la nube y puedes sumarte al ranking en vivo." }),
        insigniaNubePlan()),
      pLec,
      h("div", { class: "pl-lista", "data-sec": "Planes disponibles" }, PLANES.map(tarjeta)))));
    saltarA(0);
  }
  function vistaPlan(pl) {
    document.title = pl.t + " · Planes de lectura · BiEx";
    const abrirPerfilDesdePlan = (ap) => {
      if (!ap) return;
      cargarJuego().then((J) => { if (J && J.abrirJugador) J.abrirJugador(ap); }).catch(() => {});
    };
    const pintar = () => {
      const e = estPlanes(), dias = diasPlan(pl), hs = new Set(e.hechos[pl.id] || []), i = sigDia(pl, e), act = e.act === pl.id;
      const pct = Math.round((100 * hs.size) / Math.max(1, dias.length));
      const lista = h("ol", { class: "pl-dias", "data-sec": "Todas las lecturas" }, dias.map((dia, k) => h("li", { class: hs.has(k) ? "hecho" : k === i ? "sig" : "" },
        h("button", { type: "button", class: "pl-marca", "aria-pressed": String(hs.has(k)), "aria-label": "Día " + (k + 1) + (hs.has(k) ? ": leído. Desmarcar" : ": marcar como leído"), onclick: () => { marcarDia(pl, k, !hs.has(k)); pintar(); } }, svg('<path d="M6 12.5l4 4 8-9" ' + L1 + '/>')),
        h("span", { class: "pl-n", text: "Día " + (k + 1) }),
        h("a", { href: "#/" + dia[0].b.c + "/" + dia[0].c, text: etDia(dia) }))));
      const datoHoy = i >= 0 ? datoDiaPlan(dias[i]) : null;
      const sig = i >= 0 ? h("div", { class: "pl-sig", "data-sec": "Siguiente lectura" },
        h("span", { class: "eyebrow", text: "Siguiente lectura · Día " + (i + 1) + " de " + dias.length }),
        h("b", { text: etDia(dias[i]) }),
        datoHoy ? h("div", { class: "pl-dato" },
          h("span", { class: "pl-dato-et", text: "Dato clave y aprendizaje de hoy" }),
          h("p", { text: datoHoy.clave }),
          h("small", { text: datoHoy.meta })) : null,
        h("div", { class: "pl-hab" },
          h("div", { class: "pl-hab-tit" }, h("b", { text: "Paso amable · sin presión" }), h("small", { text: "Cada paso cuenta · si pausas un día, retomas justo aquí" })),
          h("ol", { class: "pl-pasos" },
            h("li", {}, h("em", { text: "Paso 1" }), "Abre solo el primer capítulo de hoy."),
            h("li", {}, h("em", { text: "Paso 2" }), "Lee sin distracciones o activa Contemplar."),
            h("li", {}, h("em", { text: "Paso 3" }), "Marca tu logro y suma a tu próximo hito."))),
        h("div", { class: "pl-acc" },
          h("a", { class: "btn oro chico", href: "#/" + dias[i][0].b.c + "/" + dias[i][0].c }, svg(ICO.libro), h("span", { text: "Leer" })),
          h("button", { class: "btn chico", type: "button", onclick: () => { location.hash = "#/" + dias[i][0].b.c + "/" + dias[i][0].c; setTimeout(() => ponerContemplar(true), 260); } }, svg(ICO.contemplar), h("span", { text: "Leer en Contemplar" })),
          h("button", { class: "btn chico", type: "button", onclick: () => { marcarDia(pl, i, true); avisar("¡Día " + (i + 1) + " completado! Avance guardado."); pintar(); } }, svg('<path d="M6 12.5l4 4 8-9" ' + L1 + '/>'), h("span", { text: "Marcar como leído" }))))
        : h("div", { class: "pl-sig", "data-sec": "Estado del plan" }, h("b", { text: "Plan terminado. ¡Bien hecho!" }), h("p", { class: "nota-ui", text: "Alcanzaste los 4 hitos de este plan. Puedes elegir otro plan o reiniciar cuando desees repasarlo." }));
      const hitosDef = HITOS_PLAN[pl.id] || [];
      const hitos = hitosDef.length ? h("section", { class: "pl-hitos", "data-sec": "Hitos y aprendizajes" },
        h("div", { class: "pl-hitos-cab" }, h("h2", { text: "Hitos y aprendizajes del camino" }), h("small", { text: hitosDef.filter(([p]) => pct >= p).length + " de " + hitosDef.length + " desbloqueados" })),
        h("ol", { class: "pl-hitos-g" }, hitosDef.map(([p, tit, desc]) => h("li", { class: "pl-hito" + (pct >= p ? " ok" : "") },
          h("div", { class: "pl-hito-top" }, h("span", { class: "pl-hito-pct", text: pct >= p ? "✓ " + p + " %" : p + " %" })),
          h("b", { text: tit }),
          h("p", { text: desc }))))) : null;
      // Ranking en vivo del plan (GET /planes/ranking?plan=<id>)
      const rkZona = h("div", {}, h("p", { class: "nota-ui", text: "Cargando clasificación de este plan…" }));
      const cargarRk = () => {
        fetchConTope(API_JG + "/planes/ranking?plan=" + encodeURIComponent(pl.id), { credentials: "omit" }, 8000)
          .then((r) => (r.ok ? r.json() : null))
          .then((d) => {
            if (!rkZona.isConnected) return;
            const L = d && Array.isArray(d.lista) ? d.lista : [];
            if (!L.length) return rkZona.replaceChildren(h("p", { class: "nota-ui", text: "Aún nadie se ha sumado al ranking público de este plan. Activa la casilla arriba para inaugurar la lista." }));
            rkZona.replaceChildren(h("ol", { class: "pl-rk-l" }, L.slice(0, 30).map((x, idx) => h("li", {},
              h("span", { class: "pl-rk-p", text: String(idx + 1) }),
              h("div", { class: "pl-rk-id" },
                h("button", { class: "pl-rk-nom", type: "button", title: "Ver perfil público de " + x.apodo, onclick: () => abrirPerfilDesdePlan(x.apodo) }, x.apodo || "Lector"),
                h("span", { class: "pl-rk-sub", text: "nivel " + (x.nivel | 0) + (x.poder != null ? " · poder " + fmt(x.poder) : "") }),
                h("div", { class: "pl-rk-bar", "aria-hidden": "true" }, h("i", { style: "width:" + Math.max(2, Math.min(100, Number(x.pct) || 0)) + "%" }))),
              h("div", { class: "pl-rk-pct" }, (Number(x.pct) || 0) + " %", h("small", { text: fmt(x.dias | 0) + " d" }))))));
          }).catch(() => { if (rkZona.isConnected) rkZona.replaceChildren(h("p", { class: "nota-ui", text: "No se pudo consultar el ranking del plan ahora." })); });
      };
      const chkRk = h("input", { type: "checkbox", checked: !!e.ranking, onchange: async (ev) => {
        if (!NUBE.tok()) { ev.currentTarget.checked = false; avisar("Inicia sesión en Escudriña para sumarte al ranking en vivo"); return; }
        const e2 = estPlanes(); e2.ranking = !!ev.currentTarget.checked; if (!e2.act) e2.act = pl.id;
        guardarPlanes(e2, true);
        avisar(e2.ranking ? "Te sumaste al ranking público de este plan" : "Saliste del ranking público de planes");
        setTimeout(cargarRk, 900);
      } });
      const rkSec = h("section", { class: "pl-rk", "data-sec": "Ranking del plan" },
        h("div", { class: "pl-rk-cab" },
          h("h2", { text: "Lectores en este plan" }),
          h("label", { class: "pl-rk-opt" }, chkRk, h("span", { text: "Aparecer en el ranking" }))),
        rkZona);
      vista().replaceChildren(h("div", { class: "in" }, h("section", { class: "panel planes" },
        h("div", { class: "panel-cab" }, h("a", { class: "eyebrow", href: "#/planes", text: "‹ Planes de lectura" }), h("h1", { class: "texto", text: pl.t }), h("p", { class: "est-sub", text: pl.d() }),
          insigniaNubePlan(),
          h("div", { class: "pl-cab" }, anilloPlan(hs.size / dias.length), h("span", { text: hs.size + " de " + dias.length + " lecturas" }),
            act ? [h("span", { class: "chip activo", text: "Plan activo" }), h("button", { class: "btn chico", type: "button", onclick: (ev) => {
              const bt = ev.currentTarget;
              if (!bt.dataset.seguro) { bt.dataset.seguro = "1"; bt.textContent = "Tocar otra vez para desactivarlo"; setTimeout(() => { if (bt.isConnected) { delete bt.dataset.seguro; bt.textContent = "Desactivar"; } }, 4000); return; }
              const e2 = estPlanes(); e2.act = null; guardarPlanes(e2); avisar("Plan desactivado: tus marcas quedan guardadas"); pintar();
            } }, "Desactivar")] : h("button", { class: "btn chico", type: "button", onclick: () => { const e2 = estPlanes(); e2.act = pl.id; guardarPlanes(e2); pintar(); } }, "Seguir este plan"),
            hs.size ? h("button", { class: "btn chico", type: "button", onclick: (ev) => { const bt = ev.currentTarget; if (!bt.dataset.seguro) { bt.dataset.seguro = "1"; bt.textContent = "Tocar otra vez para borrar las marcas"; setTimeout(() => { if (bt.isConnected) { delete bt.dataset.seguro; bt.textContent = "Reiniciar"; } }, 4000); return; } const e2 = estPlanes(); e2.hechos[pl.id] = []; guardarPlanes(e2); pintar(); } }, "Reiniciar") : null)),
        sig, hitos, rkSec, lista)));
      cargarRk();
    };
    pintar(); saltarA(0);
  }
  // ------------------------------------------------------------------ exportar a Obsidian (.md)
  // Notas listas para Obsidian: propiedades (YAML), encabezados, avisos plegables (callouts), referencias de bloque por verso
  // (^v12: se enlaza con [[nota#^v12]]) y los colores de la edición BiEx con <span style> (se ven en la lectura y en la vista en
  // vivo de Obsidian, con tema claro u oscuro). Se exporta lo que se ve: corchetes, paréntesis y superíndices según las opciones.
  const MDC = { tm: "#d9822b", tk: "#8a8a8a", gr: "#b8913f", ta: "#8f6fd0", vn: "#b8913f" };
  const mdTexto = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/([\\*_`$|~=^])/g, "\\$1").replace(/\[\[/g, "[\\[").replace(/%%/g, "%\\%");
  const mdLinea = (t) => mdTexto(String(t || "").replace(/\s+/g, " ").trim()).replace(/^([#>+-]|\d+\.)/, "\\$1");
  function mdDeNodo(n) {
    if (n.nodeType === 3) return mdTexto(n.nodeValue);
    if (n.nodeType !== 1 && n.nodeType !== 11) return "";
    let dentro = ""; for (const c of n.childNodes) dentro += mdDeNodo(c);
    if (n.nodeType === 11 || !dentro) return dentro;
    const cl = n.classList || { contains: () => false };
    if (cl.contains("an-cor")) return "";
    if (cl.contains("ng")) dentro = "**" + dentro + "**";
    if (cl.contains("it")) dentro = "*" + dentro + "*";
    const est = [];
    if (cl.contains("ta")) est.push("color:" + MDC.ta, "font-style:italic");
    else if (cl.contains("tm")) est.push("color:" + MDC.tm);
    else if (cl.contains("tk")) est.push("color:" + MDC.tk);
    else if (cl.contains("gr")) est.push("color:" + MDC.gr);
    if (cl.contains("tc")) est.push("font-variant:small-caps");
    return est.length ? '<span style="' + est.join(";") + '">' + dentro + "</span>" : dentro;
  }
  const mdFecha = () => new Date().toISOString().slice(0, 10);
  const mdYaml = (o) => "---\n" + Object.entries(o).filter(([, v]) => v != null && v !== "").map(([k, v]) => k + ": " + (Array.isArray(v) ? "[" + v.map((x) => JSON.stringify(String(x))).join(", ") + "]" : typeof v === "number" ? v : JSON.stringify(String(v)))).join("\n") + "\n---\n\n";
  const mdArchivo = (t) => String(t).replace(/[\\/:*?"<>|#^[\]]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 120) || "BiEx";
  // en un marco ajeno a la inserción del sitio oficial (p. ej., la página pública de Claude, que no permite descargas) se copia
  const SIN_DESCARGAS = (() => { try { return window.self !== window.top && !EMBED; } catch (e) { return true; } })();
  async function mdEntregar(nombre, texto) {
    if (SIN_DESCARGAS) return mdCopiar(texto);
    const blob = new Blob([texto], { type: "text/markdown;charset=utf-8" });
    try {
      const a = h("a", { href: URL.createObjectURL(blob), download: mdArchivo(nombre) + ".md" });
      document.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
      avisar("Nota de Obsidian descargada: " + mdArchivo(nombre) + ".md");
    } catch (e) {
      try { await navigator.clipboard.writeText(texto); avisar("No se pudo descargar: la nota quedó copiada para pegarla en Obsidian"); } catch (e2) { avisar("No se pudo exportar en este navegador"); }
    }
  }
  async function mdCopiar(texto) { try { await navigator.clipboard.writeText(texto); avisar("Copiado: pégalo en una nota de Obsidian"); } catch (e) { avisar("No se pudo copiar en este navegador"); } }
  // los enlaces de las notas llevan siempre al sitio oficial (nunca al alojamiento)
  const mdEnlace = (hh) => OFICIAL + "nueva-voluntad?lector=" + encodeURIComponent(String(hh || "").replace(/^#?\/?/, "")).replace(/%2F/g, "/");
  async function mdCapitulo(c, cap, conGriego) {
    const b = libroDe(c), L = await lectura(c), vs = (L.caps[cap] || []);
    let gr = null;
    if (conGriego) {
      const [A, T2] = await Promise.all([analisis(c), tablas()]);
      gr = new Map(((A.caps || {})[cap] || []).map(([v, toks]) => [v, toks.map((t) => T2.F[t[0]] + punt(t[4])).join(" ")]));
    }
    const nom = nombreLibro(b), C = b.caps[cap - 1] || {};
    const usaP = vs.some((x) => x.p);
    const o = [mdYaml({ title: nom + " " + cap, aliases: [b.n + " " + cap], libro: nom, capitulo: cap, hebreo: C.h || "", fuente: mdEnlace("#/" + c + "/" + cap), exportado: mdFecha(), tags: ["biex", "nueva-voluntad", claveEs(b.n).replace(/\s+/g, "-")] })];
    o.push("# " + mdLinea(nom) + " · " + cap + "\n");
    o.push("> [!info]- Biblia Exacta · cómo leer esta nota\n> Traducción, transliteración y análisis: BiEx – Biblia Exacta ©™. Ningún verso se da por terminado: la traducción sigue abierta a ajustes. Los versos sin traducción completa van como texto base, palabra por palabra; " +
      '<span style="color:' + MDC.gr + '">en dorado</span>, el griego aún sin traducción fijada; <span style="color:' + MDC.tm + '">en naranja</span>, palabras del Mashíaḥ; <span style="font-variant:small-caps">en versalitas</span>, citas de la Antigua Voluntad; <span style="color:' + MDC.tk + '">en gris</span>, las ampliaciones; ' +
      '<span style="color:' + MDC.ta + ';font-style:italic">en violeta y cursiva</span>, texto añadido después (no está en los manuscritos más antiguos).\n> Fuente: ' + mdEnlace("#/" + c + "/" + cap) + "\n");
    vs.forEach((x, k) => {
      const A2 = anadido(c, cap, x.v);
      if (A2 && A2.ini) o.push("> [!warning] Texto añadido · " + mdLinea(A2.p.t) + "\n> " + mdLinea(A2.p.d) + "\n");
      const pre = iniciaPericopa(usaP, x, k, vs) ? "**§** " : "";
      let lin = pre + '<sup style="color:' + MDC.vn + '">' + x.v + "</sup> " + mdDeNodo(txtVerso(x)).trim();
      if (gr && gr.get(x.v)) lin += '<br><span style="color:' + MDC.gr + '" lang="grc">' + mdTexto(gr.get(x.v)) + "</span>";
      o.push(lin + " ^v" + x.v + "\n");
    });
    o.push(mdPie("Exportado de BiEx – Biblia Exacta ©™ el " + mdHoy()));
    return { nombre: nom + " " + cap + " · BiEx", texto: o.join("\n") };
  }
  const mdHoy = () => new Date().toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric" });
  // Pie obligatorio de toda nota exportada: texto literal de BiEx; los libros, con la regla de nombres del lector
  function mdPie(linea) {
    const ref = (c, resto) => { const b = libroDe(c); return (b ? nombreLibro(b) : c) + resto; };
    return "---\n*" + mdLinea(linea) + ".*\n\n" +
      mdLinea("Las Sagradas Escrituras no tienen por qué ser vendidas, por nadie, el Conocimiento Sagrado que puede conducir a Comprensión no es un negocio. Usted a partir de este momento tiene autorización expresa de imprimir todo el material de traducción presentado en este documento, siempre y cuando sea en Papel Ecológico [" + ref("REV", " 11:18") + "] –el fabricado con caña de azúcar puede ser una excelente alternativa–, y en lo posible con Tintas Ecológicas, para distribución y/o enseñanza gratuita [" + ref("ACT", ", capítulo 8, verso 20") + "].") + "\n\n" +
      mdLinea("Dentro del texto queda prohibida cualquier clase de modificación o alteración intencional.") + "\n\n" +
      mdLinea("Se permite el uso de citas completas mencionando debidamente los créditos a BiEx – Biblia Exacta ©™.") + "\n";
  }
  async function mdEstudio(k) {
    const E = EST || (EST = await cargar("datos/estudios.json")), pg = E[k];
    const refs = (txt) => { const rr = parsearRefs(txt || ""); return rr.length ? "> [!quote]- Pasajes\n> " + rr.map((r) => "[" + mdLinea(refTexto(r)) + "](" + mdEnlace(refRuta(r)) + ")").join(" · ") + "\n" : ""; };
    const fts = (fs) => fs && fs.length ? "> [!note]- " + (fs.length === 1 ? "Fuente" : "Fuentes") + "\n" + fs.map((f) => "> - " + mdLinea(f)).join("\n") + "\n" : "";
    const pars = (ps) => (ps || []).map((t) => mdLinea(t) + "\n").join("\n");
    const o = [mdYaml({ title: pg.t, fuente: mdEnlace("#/" + k), exportado: mdFecha(), tags: ["biex", "estudio"] }), "# " + mdLinea(pg.t) + "\n"];
    if (pg.s) o.push("*" + mdLinea(pg.s) + "*\n");
    if (pg.intro) o.push(mdLinea(pg.intro) + "\n");
    if (k === "datos") pg.items.forEach((it, i) => o.push("## " + String(i + 1).padStart(2, "0") + " · " + mdLinea(it.t) + "\n", pars(it.p), refs(it.r), fts(it.f)));
    else if (k === "fechas") {
      pg.secciones.forEach((sc) => o.push("## " + mdLinea(sc.t) + "\n", pars(sc.p), refs(sc.r)));
      const Lb = CRONO ? CRONO.ordenes.escritura.map(libroDe).filter(Boolean) : [];
      if (Lb.length) o.push("## Los 27 libros por su fecha de escritura\n", "| # | Libro | Fecha |\n|---|---|---|\n" + Lb.map((b2, i) => "| " + (i + 1) + " | " + mdLinea(nombreLibro(b2)) + " | " + mdLinea(fechaEscrito(b2) || "") + " |").join("\n") + "\n");
      o.push(fts(pg.f));
    } else {
      o.push("## " + mdLinea(pg.etica.t) + "\n", pars(pg.etica.p), refs(pg.etica.r));
      pg.items.forEach((it, i) => o.push("## " + (i + 1) + ". " + mdLinea(it.t) + (it.l ? " · *" + mdLinea(it.l) + "*" : "") + "\n", mdLinea(it.d) + "\n", "> [!example] Ejemplo\n> " + mdLinea(it.e) + "\n", "> [!tip] Con altura\n> " + mdLinea(it.c) + "\n", refs(it.r)));
    }
    o.push(mdPie("Estudios BiEx – Biblia Exacta ©™ · exportado el " + mdHoy()));
    return { nombre: pg.t + " · BiEx", texto: o.filter(Boolean).join("\n") };
  }
  async function mdMarcadores() {
    const todos = Object.values(MK.todo()).filter((x) => x && libroDe(x.c));
    const orden = new Map(librosEnOrden().map((b, i) => [b.c, i]));
    todos.sort((a, b) => (orden.get(a.c) - orden.get(b.c)) || (a.cap - b.cap) || (a.v - b.v));
    const o = [mdYaml({ title: "Mis marcadores de BiEx", exportado: mdFecha(), tags: ["biex", "marcadores"] }), "# Mis marcadores de BiEx\n"];
    if (!todos.length) o.push("*Aún no hay marcadores.*\n");
    let libroAct = null;
    for (const x of todos) {
      const b = libroDe(x.c);
      if (b !== libroAct) { libroAct = b; o.push("## " + mdLinea(nombreLibro(b)) + "\n"); }
      let tx = "";
      try { const Lc = await lectura(x.c); const L = (Lc.caps[x.cap] || []).find((y) => y.v === x.v); if (L) tx = mdDeNodo(txtVersoL(L)).trim(); } catch (e) { /* sin texto */ }
      const tema = x.col ? MK.nombre(x.col) : "";
      o.push("> [!quote] [" + mdLinea(refCorta(b, x.cap, x.v)) + "](" + mdEnlace("#/" + x.c + "/" + x.cap + "/l/" + x.v) + ")" + (tema ? " · " + mdLinea(tema) : "") + "\n> " + tx + (x.nota ? "\n>\n> **Nota:** " + mdLinea(x.nota) : "") + "\n");
    }
    o.push(mdPie("Marcadores de BiEx – Biblia Exacta ©™ · exportados el " + mdHoy()));
    return { nombre: "Mis marcadores · BiEx", texto: o.join("\n") };
  }
  // Ventana de exportación (Herramientas, opciones del capítulo, estudios y marcadores)
  function abrirExportar(sel) {
    const ult = store.get("ultimo", null), cap = esc.libro && esc.cap ? [esc.libro, esc.cap] : ult && ult.c && libroDe(ult.c) ? [ult.c, ult.cap || 1] : null;
    const conGr = h("input", { type: "checkbox", id: "md-gr" });
    const fila = (t, p, hacer) => h("div", { class: "md-fila" }, h("div", {}, h("b", { text: t }), p ? h("p", { text: p }) : null),
      h("div", { class: "md-acc" },
        SIN_DESCARGAS ? null : h("button", { class: "btn chico oro", type: "button", onclick: async (e) => { const bt = e.currentTarget; bt.disabled = true; try { const r = await hacer(); await mdEntregar(r.nombre, r.texto); } catch (er) { avisar("No se pudo preparar la nota"); } bt.disabled = false; } }, svg(ICO.descargar), h("span", { text: "Descargar .md" })),
        h("button", { class: "btn chico", type: "button", onclick: async (e) => { const bt = e.currentTarget; bt.disabled = true; try { const r = await hacer(); await mdCopiar(r.texto); } catch (er) { avisar("No se pudo preparar la nota"); } bt.disabled = false; } }, svg(ICO.copiar || ICO.lista), h("span", { text: "Copiar" }))));
    const filas = [];
    if (cap && (!sel || sel === "cap")) {
      const b = libroDe(cap[0]);
      filas.push(fila(nombreLibro(b) + " " + cap[1], "El capítulo tal como lo ves, con los colores de la edición BiEx y cada verso enlazable (^v1, ^v2…).", () => mdCapitulo(cap[0], cap[1], conGr.checked)),
        h("label", { class: "md-op", for: "md-gr" }, conGr, h("span", { text: "Incluir el griego de cada verso" })));
    }
    if (!sel || sel === "estudios") for (const [k, t] of ESTUDIOS) filas.push(fila(t, "Estudio completo, con sus pasajes y sus fuentes en avisos plegables.", () => mdEstudio(k)));
    if (!sel || sel === "marcadores") filas.push(fila("Mis marcadores", "Tus versos marcados, con su tema y tus notas de estudio.", () => mdMarcadores()));
    abrirModal(() => cajaModal(cabModal("Exportar a Obsidian", "Notas .md con el mejor formato"), h("div", { class: "md-exp" },
      h("p", { class: "nota-ui", text: SIN_DESCARGAS ? "Aquí no se pueden descargar archivos: copia la nota y pégala en una nota nueva de Obsidian. Lleva sus propiedades, encabezados, avisos plegables y los colores de BiEx." : "Cada nota lleva sus propiedades, encabezados, avisos plegables y los colores de BiEx. Guárdala en tu bóveda de Obsidian (o pégala en una nota nueva)." }), filas)));
  }
  // ------------------------------------------------------------------ letras meteoro
  // Letras hebreas y griegas que cruzan la pantalla como meteoritos, en direcciones distintas, por delante de los contenedores
  // y por detrás del texto (capa fija -1; los contenedores llevan su fondo en la -2 y las luces, en la -3).
  // Movimiento: recta con aceleración constante en su dirección (p = p0 + v₀·t + ½·a·t², como una curva de tiempo
  // cubic-bezier exacta), giro constante de la letra (θ = θ0 + ω·t) y una estela que apunta hacia atrás. Todo es vectorial
  // (texto y degradados CSS) y lo anima el compositor (Web Animations, solo transform y opacidad): nítido a cualquier
  // densidad y sin trabajo del hilo principal mientras se desplaza la página. Se apaga con «Sin animaciones» o
  // prefers-reduced-motion; no lanza con la pestaña oculta ni con una ventana abierta.
  // Argon (23-nov-2026) · Luces del fondo (tres halos precargados en caché de textura GPU): cada halo se pinta UNA sola vez en un lienzo diminuto
  // de 128×128 px (~64 KB en VRAM, ~192 KB en total frente a los ~85 MB de las capas de pantalla completa) y la caché solo se
  // renueva si cambia el tema (Oscuro ↔ Pergamino). El desplazamiento lo ejecuta íntegramente el compositor GPU mediante CSS
  // (transform: translate3d y opacidad) a 60/120 Hz con 0 % de CPU, sin saltos al desplazar, abrir ventanas ni volver a la pestaña.
  function lucesVivas(capa) {
    if (!capa) return;
    const S = 128, R = S / 2;
    const LUZ = {
      dark: [
        [[214, 178, 104], [[0, 0.14], [0.44, 0.048], [0.76, 0]]],
        [[86, 112, 190], [[0, 0.13], [0.46, 0.042], [0.76, 0]]],
        [[150, 102, 170], [[0, 0.08], [0.45, 0.025], [0.76, 0]]],
      ],
      light: [
        [[176, 130, 48], [[0, 0.125], [0.44, 0.042], [0.76, 0]]],
        [[70, 100, 170], [[0, 0.085], [0.46, 0.028], [0.76, 0]]],
        [[150, 100, 150], [[0, 0.055], [0.45, 0.018], [0.76, 0]]],
      ],
    };
    const sprites = [0, 1, 2].map((i) => {
      const c = h("canvas", { class: "vivo-halo h" + (i + 1), width: String(S), height: String(S) });
      capa.append(c);
      return c;
    });
    let temaPintado = "";
    function renovarCache() {
      const clave = document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
      if (clave === temaPintado) return;
      temaPintado = clave;
      const pal = LUZ[clave];
      sprites.forEach((c, i) => {
        const cx = c.getContext && c.getContext("2d"); if (!cx) return;
        cx.clearRect(0, 0, S, S);
        const g = cx.createRadialGradient(R, R, 0, R, R, R);
        for (const [pos, a] of pal[i][1]) g.addColorStop(pos, "rgba(" + pal[i][0].join(",") + "," + a + ")");
        cx.fillStyle = g;
        cx.fillRect(0, 0, S, S);
      });
    }
    renovarCache();
    const syncVis = () => document.documentElement.classList.toggle("tab-oculta", !!document.hidden);
    document.addEventListener("visibilitychange", syncVis);
    syncVis();
    try { new MutationObserver(renovarCache).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] }); } catch (e) { /* sin observador */ }
  }
  function meteoros(capa) {
    if (!capa || !capa.animate) return null;
    const GR = ["Α", "Β", "Γ", "Δ", "Θ", "Λ", "Ξ", "Σ", "Φ", "Ψ", "Ω", "λ", "φ", "ψ", "ω", "ξ", "ζ"], HE = ["א", "ב", "ג", "ד", "ה", "ו", "י", "ל", "מ", "ר", "ש", "ת"];
    const reducido = window.matchMedia ? matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
    let t = 0;
    const quieto = () => ap.mov === "no" || reducido.matches;
    function lanzar() {
      const W = window.innerWidth, A = window.innerHeight, mov = W < 700;
      if (capa.childElementCount >= (mov ? 2 : 3)) return;
      const he = Math.random() < 0.45, L = he ? HE : GR, s = ((mov ? 25 : 30) + Math.random() * (mov ? 13 : 20)) * 0.65 * 1.05; // (BiEx, 21-nov-2026, AF11) un 5 % más grandes
      const ang = Math.random() * Math.PI * 2, dx = Math.cos(ang), dy = Math.sin(ang);
      const v0 = ((mov ? 170 : 240) + Math.random() * 150) * 0.5 * 0.85, a = v0 * 0.16; // (AF11) un 15 % más lentos (velocidad y aceleración)
      // nace en cualquier punto de la pantalla (con un fundido) y recorre un trecho hasta desvanecerse (pedido de BiEx, 31-oct-2026)
      const x0 = W * (0.08 + Math.random() * 0.84), y0 = A * (0.08 + Math.random() * 0.84), D = Math.hypot(W, A) * (0.35 + Math.random() * 0.3);
      const T = (-v0 + Math.sqrt(v0 * v0 + 2 * a * D)) / a, al = (v0 * T) / D;
      const largo = Math.min(120 + (v0 + a * T * 0.5) * 0.45, 330);
      const th = Math.random() * 360, w = (Math.random() < 0.5 ? -1 : 1) * (14 + Math.random() * 34);
      const letra = h("b", { class: "met-letra" + (he ? " he" : ""), text: L[Math.random() * L.length | 0] });
      const el = h("div", { class: "met" }, h("i", { class: "met-rumbo" }, h("i", { class: "met-cola" }), h("i", { class: "met-halo" })), letra);
      el.style.cssText = "--s:" + s.toFixed(1) + "px;--ang:" + (Math.atan2(dy, dx) * 180 / Math.PI).toFixed(2) + "deg;--L:" + largo.toFixed(0) + "px;--op:" + (0.36 + Math.random() * 0.16).toFixed(2);
      capa.append(el);
      const ms = T * 1000;
      const viaje = el.animate([{ transform: "translate3d(" + x0.toFixed(1) + "px," + y0.toFixed(1) + "px,0)" }, { transform: "translate3d(" + (x0 + dx * D).toFixed(1) + "px," + (y0 + dy * D).toFixed(1) + "px,0)" }],
        { duration: ms, easing: "cubic-bezier(0.3333," + (al / 3).toFixed(4) + ",0.6667," + ((al + 1) / 3).toFixed(4) + ")", fill: "both" });
      el.animate([{ opacity: 0 }, { opacity: 1, offset: 0.22 }, { opacity: 1, offset: 0.7 }, { opacity: 0 }], { duration: ms, easing: "ease-in-out", fill: "both" });
      letra.animate([{ transform: "rotate(" + th.toFixed(1) + "deg)" }, { transform: "rotate(" + (th + w * T).toFixed(1) + "deg)" }], { duration: ms, fill: "both" });
      viaje.onfinish = viaje.oncancel = () => el.remove();
    }
    function programar(primero) {
      clearTimeout(t);
      const W = window.innerWidth;
      t = setTimeout(() => {
        // el lanzamiento espera un momento libre del hilo principal y nunca corre mientras se desplaza
        const ir = () => {
          if (quieto() || document.hidden || modal.open) return;
          if (document.documentElement.classList.contains("desplazando")) { setTimeout(ir, 900); return; }
          lanzar();
        };
        if (window.requestIdleCallback) requestIdleCallback(ir, { timeout: 1500 }); else ir();
        programar(false);
      }, primero ? 1400 + Math.random() * 1600 : (W < 700 ? 14000 : 11000) * (0.55 + Math.random() * 0.9));
    }
    // la letra hebrea de los meteoros (subconjunto de Frank Ruhl Libre) se trae por adelantado, en un momento libre y solo con buena red
    const precargar = () => { if (redLenta()) return; try { if (document.fonts && document.fonts.load) document.fonts.load('500 30px "Frank Ruhl Libre"', HE.join("")).catch(() => {}); } catch (e) { /* sin API de fuentes */ } };
    if (window.requestIdleCallback) requestIdleCallback(precargar, { timeout: 4000 }); else setTimeout(precargar, 2500);
    const despertar = () => { if (quieto()) { clearTimeout(t); capa.replaceChildren(); return; } programar(true); };
    document.addEventListener("visibilitychange", () => { if (!document.hidden) despertar(); });
    if (reducido.addEventListener) reducido.addEventListener("change", despertar);
    despertar();
    return { despertar, lanzar };
  }
  function noEncontrado() { vista().replaceChildren(h("p", { class: "vacio" }, "Esa dirección no existe. ", h("a", { href: "#/", text: "Volver al inicio" }))); }

  // ------------------------------------------------------------------ rutas
  // rutaVista: la última dirección pintada como página (las ventanas de búsqueda y de guía se abren encima de ella)
  let rutaVista = null;
  // AF23: la cuenta atrás del pie (16-jul-2027, 00:00 UTC). Late cada segundo solo mientras se ve; fuera de la vista no gasta nada
  const CUENTA_FIN = Date.UTC(2027, 6, 16, 0, 0, 0);
  let cuentaT = 0, cuentaVis = false;
  function pintarCuenta() {
    const el = document.getElementById("cuenta-m"); if (!el) return;
    let ms = Math.max(0, CUENTA_FIN - Date.now()); const d = Math.floor(ms / 864e5); ms -= d * 864e5;
    const hh = Math.floor(ms / 36e5); ms -= hh * 36e5; const mm = Math.floor(ms / 6e4), ss = Math.floor((ms - mm * 6e4) / 1000), dos = (x) => String(x).padStart(2, "0");
    if (!el.firstChild) {
      el.append(h("i", { class: "cm-reloj" }, svg('<path d="M7 3.5h10M7 20.5h10M8 3.5c0 4.5 4 5.6 4 8.5s-4 4-4 8.5M16 3.5c0 4.5-4 5.6-4 8.5s4 4 4 8.5" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><path d="M10 18.6c.6-1.1 1.2-1.6 2-1.9.8.3 1.4.8 2 1.9z" fill="currentColor" opacity=".55"/>')));
      for (const t of ["d", "h", "m", "s"]) el.append(h("span", { class: "cm-u" }, h("b", { "data-k": t }), h("small", { text: t === "d" ? "días" : t === "h" ? "horas" : t === "m" ? "min" : "s" })));
    }
    const pon = (k, v) => { const b = el.querySelector('b[data-k="' + k + '"]'); if (b && b.textContent !== v) b.textContent = v; };
    pon("d", String(d)); pon("h", dos(hh)); pon("m", dos(mm)); pon("s", dos(ss));
  }
  function ajustarCuenta() {
    const hh = location.hash || "#/", ver = /^#\/?$/.test(hh) || /^#\/[1-3A-Z]{3}\/\d+/.test(hh);
    const r = document.documentElement; if (r.classList.contains("ver-cuenta") !== ver) r.classList.toggle("ver-cuenta", ver);
    const el = document.getElementById("cuenta-m"); if (!el) return;
    if (!ajustarCuenta.io && "IntersectionObserver" in window) { ajustarCuenta.io = new IntersectionObserver((es) => { cuentaVis = es.some((e) => e.isIntersecting); latirCuenta(); }); ajustarCuenta.io.observe(el); }
    pintarCuenta(); latirCuenta();
  }
  function latirCuenta() {
    clearInterval(cuentaT); cuentaT = 0;
    if (cuentaVis && !document.hidden && document.documentElement.classList.contains("ver-cuenta")) { pintarCuenta(); cuentaT = setInterval(pintarCuenta, 1000); }
  }
  document.addEventListener("visibilitychange", () => latirCuenta());
  function enrutar() {
    if (!D) return;
    ultHrefEnrutado = location.href;
    document.documentElement.classList.remove("mp-fs-on", "cn-fs-on");
    if (!/^#\/escudrina\/coloso(\/|$)/.test(location.hash || "")) document.documentElement.classList.remove("jg-col-inm");
    // (BiEx, 21-nov-2026, AF32) si la ventana de una palabra se cierra por un enlace, su palabra no queda marcada en el análisis
    for (const x of document.querySelectorAll('.analisis .pal[aria-pressed="true"]')) x.setAttribute("aria-pressed", "false");
    M.alCerrar = null;
    // Neon (23-nov-2026): cuando «Atrás» reabre una ventana (p. ej., Buscar tras volver desde un libro), diferir la reconstrucción
    // de la vista de fondo hasta cerrar la ventana evita el sobresalto de medio segundo detrás del buscador
    if (modal.open && performance.now() - (M.reabierta || -1e9) < 800) {
      M.rutaPend = location.hash;
      velar(false);
      ajustarCuenta();
      return;
    }
    M.rutaPend = null;
    if (modal.open) { guardarScrollM(); M.porRuta = true; modal.classList.add("sin-entrada"); cerrarModal(); setTimeout(() => modal.classList.remove("sin-entrada"), 80); }
    mostrarRuta();
    ajustarCuenta();
    FARO.actualizar();
  }
  function refrescarVista() {
    if (!rutaVista) return;
    const a = capturarAncla(), y = window.scrollY;
    esc.libro = null;
    mostrarRuta(rutaVista);
    if (a) volverAAncla(a); else requestAnimationFrame(() => saltarA(y));
  }
  // Abre una ventana (búsqueda, guía) sobre la página actual; si se entró directamente por su dirección, sobre el inicio
  function sobrePagina(abrir) {
    if (!rutaVista) { esc.libro = null; portada(false); rutaVista = "#/"; }
    ponerHash(rutaVista);
    setTimeout(abrir, 0);
  }
  // ================================================================== Sección D (A5 · Neon, 24-nov-2026)
  // 1) Diario de estudio sincronizado a /nube (estudio.diario + estudio.pares)
  // 2) Constelación del Léxico, Referencias y Notas (motor <canvas> 2D HiDPI estilo Obsidian, 0 % CPU en reposo) + minigrafos
  // 3) Mesa sinóptica libre (#/sinopsis) con convergencia léxica griega interactiva
  // 4) Pulso del texto al cerrar cada capítulo (.ps-cap)
  // 5) Tarjetas compartibles HD 3× (1080 × 1350 px) desde vistaVerso
  function leerEstudio() {
    const raw = store.get("estudio", null);
    const st = raw && typeof raw === "object" ? Object.assign({}, raw) : {};
    if (!st.diario || typeof st.diario !== "object") st.diario = {};
    if (!st.pares || typeof st.pares !== "object") st.pares = {};
    if (!st.repasoRaices || typeof st.repasoRaices !== "object") st.repasoRaices = {};
    return st;
  }
  function guardarEstudio(st) {
    store.set("estudio", st);
    NUBE_DAT.cambio();
  }
  function parsearRefCorta(txt) {
    const s = String(txt || "").trim();
    if (!s || !D) return null;
    const m = /^([1-3]?[A-Za-zÀ-ÿ\u0370-\u03ff\u1e00-\u1eff\u02b0-\u02ff]+)\s+(\d{1,3}):(\d{1,3})/.exec(s);
    if (!m) return null;
    const codU = m[1].toUpperCase();
    let b = libroDe(codU);
    if (!b) {
      const k = claveEs(m[1]);
      b = D.libros.find((x) => claveEs(x.n).startsWith(k) || claveEs(x.t || "").startsWith(k));
    }
    if (!b) return null;
    const cap = Math.max(1, Math.min(b.caps.length, +m[2] || 1));
    return { c: b.c, cap, v: Math.max(1, +m[3] || 1) };
  }
  function exportarDiarioMd() {
    const est = leerEstudio();
    const ents = Object.values(est.diario || {}).filter((e) => e && !e.borrado).sort((a, b) => (b.t || 0) - (a.t || 0));
    const mks = Object.values(MK.todo()).filter((x) => x && libroDe(x.c)).sort((a, b) => (+b.f || 0) - (+a.f || 0));
    const pares = Object.values(est.pares || {}).sort((a, b) => (b.t || 0) - (a.t || 0));
    const ls = ["---", "fuente: Biblia Exacta (BiEx)", "exportado: " + new Date().toISOString(), "tipo: diario-estudio", "---", "", "# Diario de estudio · BiEx", ""];
    if (ents.length) {
      ls.push("## Reflexiones", "");
      for (const e of ents) {
        const f = e.t ? new Date(e.t).toISOString().slice(0, 10) : "";
        ls.push("### " + (e.tit || "Reflexión") + (f ? " (" + f + ")" : ""));
        if (e.ref) ls.push("- Pasaje: " + e.ref);
        if (e.txt) ls.push("", e.txt);
        ls.push("");
      }
    }
    if (pares.length) {
      ls.push("## Pares sinópticos guardados", "");
      for (const p of pares) {
        const b1 = libroDe(p.a && p.a.c), b2 = libroDe(p.b && p.b.c);
        if (b1 && b2) ls.push("- " + refCorta(b1, p.a.cap, p.a.v) + " ↔ " + refCorta(b2, p.b.cap, p.b.v));
      }
      ls.push("");
    }
    if (mks.length) {
      ls.push("## Marcadores y notas", "");
      for (const x of mks) {
        const b = libroDe(x.c);
        ls.push("- **" + refCorta(b, x.cap, x.v) + "**" + (x.col ? " `[" + MK.nombre(x.col) + "]`" : "") + (x.nota ? " — " + x.nota.replace(/\n+/g, " ") : ""));
      }
      ls.push("");
    }
    const blob = new Blob([ls.join("\n")], { type: "text/markdown;charset=utf-8" });
    const a = h("a", { href: URL.createObjectURL(blob), download: "biex-diario-estudio-" + new Date().toISOString().slice(0, 10) + ".md" });
    document.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
    avisar("Diario de estudio descargado (.md)");
  }

  // --- Constelación estilo Obsidian (<canvas> 2D HiDPI, física amortiguada que duerme a 0 % CPU en reposo)
  const MK_HEX = { oro: "#d8b468", azul: "#6ea8e8", verde: "#5cc28c", rojo: "#e26e6e", violeta: "#b586ea", turquesa: "#4ec6c6", ambar: "#e69c4c", gris: "#9ea6b2" };
  const colorTemaMk = (k) => (MK.colores && MK.colores()[k]) || MK_HEX[k] || "#d0af6b";
  const CN_PAL_OSCURO = { raiz: "#f4dea8", verbo: "#7eb8f0", lema: "#7eb8f0", nombre: "#6fd4a4", adj: "#c598f2", libro: "#e0a458", av: "#e0826b", tema: "#f4dea8", marca: "#d0af6b" };
  const CN_PAL_CLARO = { raiz: "#8f6514", verbo: "#1d5694", lema: "#1d5694", nombre: "#196f4d", adj: "#6d3ca6", libro: "#9a5614", av: "#a33c26", tema: "#8a600e", marca: "#75571d" };
  const CN_STOP_GR = new Set(["ο", "και", "ειμι", "αυτοσ", "δε", "εν", "εισ", "οτι", "ου", "μη", "εκ", "επι", "προσ", "δια", "μετα", "υπο", "περι", "κατα", "παρα", "απο", "εγω", "συ", "οσ", "ουτοσ", "εκεινοσ", "τισ", "γαρ", "αλλα", "η", "ωσ", "ουν", "ει", "αν", "ινα", "μεν", "τε", "νυν", "εχω", "γινομαι", "ποιεω", "ερχομαι", "πασ"]);
  const CN_PRESETS_GR = ["λογοσ", "αγαπη", "πιστισ", "πνευμα", "χαρισ", "ζωη", "αληθεια", "βασιλεια"];
  const CN_GL = { α: "a", β: "b", γ: "g", δ: "d", ε: "e", ζ: "z", η: "e", θ: "th", ι: "i", κ: "k", λ: "l", μ: "m", ν: "n", ξ: "x", ο: "o", π: "p", ρ: "r", σ: "s", ς: "s", τ: "t", υ: "u", φ: "f", χ: "j", ψ: "ps", ω: "o" };
  const llanoCn = (s) => sinMarcas(String(s || "")).toLowerCase().replace(/[α-ω]/g, (c) => CN_GL[c] || c).replace(/[^a-z0-9ñ ]/g, "");

  function tipoNodoLema(li) {
    const cl = claseLema(li);
    return cl === "V" ? "verbo" : cl === "N" ? "nombre" : cl === "A" ? "adj" : "lema";
  }
  function grafoRaiz(r) {
    const nodos = [], aristas = [], vistos = new Set();
    const addN = (n) => { if (vistos.has(n.id)) return; vistos.add(n.id); nodos.push(n); };
    const fam = (LX && LX.fam && LX.fam.get(r)) || [r];
    addN({ id: "r:" + r, et: lemaCorto(r), sub: tlCorta(r), tipo: "raiz", r: 13.5, pivote: true, href: "#/raiz/" + r, desc: glosaBreve(r) || "Raíz principal de la familia (" + fmt(fam.length) + " palabras)." });
    const miembros = fam.slice(0, 20);
    for (const li of miembros) {
      if (li !== r) {
        const gb = glosaBreve(li);
        addN({ id: "l:" + li, et: lemaCorto(li), sub: tlCorta(li), tipo: tipoNodoLema(li), r: Math.max(5.5, Math.min(11, 5.2 + Math.log10((T.LN[li] || 1) + 1) * 2.2)), href: "#/lema/" + li, desc: (gb ? "«" + gb + "» · " : "") + fmt(T.LN[li] || 0) + " apariciones en la Nueva Voluntad." });
        const base = LX && LX.B && LX.B[li] != null ? LX.B[li] : null;
        aristas.push({ a: base != null && miembros.includes(base) && base !== li ? (base === r ? "r:" + r : "l:" + base) : "r:" + r, b: "l:" + li, peso: base != null ? 1.4 : 1 });
      }
    }
    const rels = (LX && LX.R && LX.R[r]) || [];
    for (const rx of rels.slice(0, 4)) {
      const rr = LX.F[rx] != null ? LX.F[rx] : rx;
      if (rr === r || !T.L[rr]) continue;
      addN({ id: "r:" + rr, et: lemaCorto(rr), sub: tlCorta(rr), tipo: "raiz", r: 9.5, href: "#/raiz/" + rr, desc: "Raíz afín: " + (glosaBreve(rr) || tlCorta(rr)) });
      aristas.push({ a: "r:" + r, b: "r:" + rr, peso: 0.75 });
    }
    const libSum = new Map();
    for (const li of fam) {
      const lb = T.LB[li] || [];
      for (let k = 0; k < lb.length; k += 2) libSum.set(lb[k], (libSum.get(lb[k]) || 0) + lb[k + 1]);
    }
    const topLibs = [...libSum.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
    for (const [bi, cnt] of topLibs) {
      const b = D.libros[bi]; if (!b) continue;
      addN({ id: "b:" + b.c, et: b.t || b.n, sub: b.t ? b.n : "", tipo: "libro", r: Math.max(6.8, Math.min(10.5, 6 + Math.log10(cnt + 1) * 1.9)), href: "#/" + b.c + "/1", desc: fmt(cnt) + " apariciones de esta familia en " + nombreLibro(b) + "." });
      aristas.push({ a: "r:" + r, b: "b:" + b.c, peso: 0.65 });
    }
    return { nodos, aristas };
  }
  function grafoLema(li) {
    const nodos = [], aristas = [], vistos = new Set();
    const addN = (n) => { if (vistos.has(n.id)) return; vistos.add(n.id); nodos.push(n); };
    const gb = glosaBreve(li);
    addN({ id: "l:" + li, et: lemaCorto(li), sub: tlCorta(li), tipo: tipoNodoLema(li), r: 13.5, pivote: true, href: "#/lema/" + li, desc: (gb ? "«" + gb + "» · " : "") + fmt(T.LN[li] || 0) + " apariciones." });
    const r = LX && LX.F ? LX.F[li] : li;
    if (LX && r !== li && T.L[r]) {
      addN({ id: "r:" + r, et: lemaCorto(r), sub: tlCorta(r), tipo: "raiz", r: 11.5, href: "#/raiz/" + r, desc: "Raíz de la familia · " + (glosaBreve(r) || "") });
      aristas.push({ a: "l:" + li, b: "r:" + r, peso: 1.6 });
    }
    const fam = (LX && LX.fam && LX.fam.get(r)) || [];
    for (const x of fam.filter((x) => x !== li && x !== r).slice(0, 11)) {
      addN({ id: "l:" + x, et: lemaCorto(x), sub: tlCorta(x), tipo: tipoNodoLema(x), r: Math.max(5.5, Math.min(9.5, 5.2 + Math.log10((T.LN[x] || 1) + 1) * 1.8)), href: "#/lema/" + x, desc: "Pariente de raíz · " + (glosaBreve(x) || tlCorta(x)) + " (" + fmt(T.LN[x] || 0) + ")" });
      aristas.push({ a: r !== li ? "r:" + r : "l:" + li, b: "l:" + x, peso: 0.85 });
    }
    const lb = T.LB[li] || [], ps = [];
    for (let k = 0; k < lb.length; k += 2) ps.push([lb[k], lb[k + 1]]);
    ps.sort((a, b) => b[1] - a[1]);
    for (const [bi, cnt] of ps.slice(0, 9)) {
      const b = D.libros[bi]; if (!b) continue;
      addN({ id: "b:" + b.c, et: b.t || b.n, sub: b.t ? b.n : "", tipo: "libro", r: Math.max(6.5, Math.min(10, 5.8 + Math.log10(cnt + 1) * 2)), href: "#/lema/" + li + "/" + b.c, desc: fmt(cnt) + (cnt === 1 ? " aparición" : " apariciones") + " en " + nombreLibro(b) + "." });
      aristas.push({ a: "l:" + li, b: "b:" + b.c, peso: 1 });
    }
    return { nodos, aristas };
  }
  function grafoConstelacionLexico(raizId) {
    if (raizId != null && LX && T.L[raizId]) {
      const g = grafoRaiz(LX.F[raizId] != null ? LX.F[raizId] : raizId);
      const r0 = LX.F[raizId] != null ? LX.F[raizId] : raizId;
      const fam0 = (LX.fam.get(r0) || [r0]).slice(0, 12);
      const vistos = new Set(g.nodos.map((n) => n.id));
      for (const li of fam0) {
        if (li === r0) continue;
        const lb = T.LB[li] || [], top = [];
        for (let k = 0; k < lb.length; k += 2) top.push([lb[k], lb[k + 1]]);
        top.sort((a, b) => b[1] - a[1]);
        for (const [bi] of top.slice(0, 2)) {
          const b = D.libros[bi];
          if (b && vistos.has("b:" + b.c)) g.aristas.push({ a: "l:" + li, b: "b:" + b.c, peso: 0.45 });
        }
      }
      return g;
    }
    // Panorama de la Nueva Voluntad: 27 libros + 22 grandes familias léxicas (todos los libros tejidos en la red)
    const nodos = [], aristas = [], vistos = new Set(), parVisto = new Set(), degLib = new Map();
    const addN = (n) => { if (vistos.has(n.id)) return; vistos.add(n.id); nodos.push(n); };
    const addE = (a, b, peso) => {
      const k = a < b ? a + "|" + b : b + "|" + a;
      if (parVisto.has(k)) return;
      parVisto.add(k);
      aristas.push({ a, b, peso });
      if (b.startsWith("b:")) degLib.set(b, (degLib.get(b) || 0) + 1);
    };
    const prioR = new Set(CN_PRESETS_GR.map((g) => { const li = T.L.findIndex((x) => claveGr(String(x).split(",")[0]) === g); return li >= 0 ? (LX.F[li] != null ? LX.F[li] : li) : -1; }).filter((x) => x >= 0));
    const cand = [];
    for (const [r, fam] of LX.fam.entries()) {
      const kg = claveGr(lemaCorto(r));
      if (CN_STOP_GR.has(kg) && !prioR.has(r)) continue;
      let tot = 0;
      const libs = new Map();
      for (const li of fam) {
        tot += T.LN[li] || 0;
        const lb = T.LB[li] || [];
        for (let k = 0; k < lb.length; k += 2) libs.set(lb[k], (libs.get(lb[k]) || 0) + lb[k + 1]);
      }
      if ((tot >= 40 && libs.size >= 4) || prioR.has(r)) cand.push({ r, fam, tot, libs, prio: prioR.has(r) ? 1 : 0 });
    }
    cand.sort((a, b) => (b.prio - a.prio) || ((b.fam.length * 18 + b.tot) - (a.fam.length * 18 + a.tot)));
    const sel = cand.slice(0, 22);
    // Primero raíces (capa interior) y luego libros (capa exterior) para colocación inicial sin cruces
    for (const item of sel) {
      const gb = glosaBreve(item.r);
      const topMem = [...item.fam].sort((a, b) => (T.LN[b] || 0) - (T.LN[a] || 0)).slice(0, 12);
      const nomExtras = topMem.map((x) => lemaCorto(x) + " " + tlCorta(x)).join(" ");
      addN({
        id: "r:" + item.r, et: lemaCorto(item.r), sub: tlCorta(item.r), tipo: "raiz", anillo: 0,
        r: Math.max(7.5, Math.min(12.2, 6.8 + Math.log10(item.tot + 1) * 1.9)),
        pivote: item.prio === 1,
        href: "#/raiz/" + item.r,
        focoRaiz: item.r,
        busq: nomExtras,
        desc: (gb ? "«" + gb + "» · " : "") + fmt(item.fam.length) + " palabras · " + fmt(item.tot) + " apariciones en " + item.libs.size + " libros.",
      });
    }
    for (const b of librosEnOrden()) {
      addN({ id: "b:" + b.c, et: b.t || b.n, sub: b.t ? b.n : "", tipo: "libro", anillo: 1, r: 7.4, href: "#/" + b.c + "/1", desc: nombreLibro(b) + " · " + b.caps.length + (b.caps.length === 1 ? " capítulo." : " capítulos.") });
    }
    for (const item of sel) {
      const topL = [...item.libs.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
      for (const [bi, cnt] of topL) {
        const b = D.libros[bi];
        if (b && vistos.has("b:" + b.c)) addE("r:" + item.r, "b:" + b.c, Math.min(1.9, 0.55 + cnt / 45));
      }
    }
    // Garantizar que ningún libro quede suelto: conectar cada libro con menos de 2 aristas a sus raíces más afines
    D.libros.forEach((b, bi) => {
      const bid = "b:" + b.c;
      if (!vistos.has(bid)) return;
      const falta = 2 - (degLib.get(bid) || 0);
      if (falta <= 0) return;
      const afines = sel
        .map((it) => ({ r: it.r, cnt: it.libs.get(bi) || 0, rel: (it.libs.get(bi) || 0) / Math.max(1, it.tot) }))
        .filter((x) => x.cnt > 0)
        .sort((a, b2) => (b2.rel - a.rel) || (b2.cnt - a.cnt));
      for (const af of afines.slice(0, falta)) addE("r:" + af.r, bid, 0.55);
    });
    return { nodos, aristas };
  }
  async function grafoConstelacionRefs(libroCod) {
    const b0 = libroDe(libroCod) || libroDe("JHN") || D.libros[0];
    const R = await refsDe(b0.c);
    const nodos = [], aristas = [], vistos = new Set();
    const addN = (n) => { if (vistos.has(n.id)) return; vistos.add(n.id); nodos.push(n); };
    addN({ id: "b:" + b0.c, et: b0.t || b0.n, sub: b0.t ? b0.n : "", tipo: "raiz", anillo: 0, r: 14, pivote: true, href: "#/" + b0.c + "/1", desc: "Libro central del mapa de referencias cruzadas: " + nombreLibro(b0) + "." });
    const porDest = new Map(), capDest = new Map();
    for (const [cap, vs] of Object.entries(R.c || {})) {
      const dCap = new Map();
      for (const plano of Object.values(vs || {})) {
        for (let i = 0; i + 5 < plano.length; i += 6) {
          const li = plano[i], peso = plano[i + 4] || 1;
          const cod = LIBROS_REF[li];
          if (!cod || cod === b0.c) continue;
          porDest.set(li, (porDest.get(li) || 0) + 1);
          dCap.set(li, (dCap.get(li) || 0) + peso);
        }
      }
      capDest.set(+cap, dCap);
    }
    const topCaps = [...capDest.entries()].sort((a, b) => b[1].size - a[1].size).slice(0, 9);
    for (const [cap, dCap] of topCaps) {
      const cid = "c:" + b0.c + ":" + cap;
      addN({ id: cid, et: (b0.t || b0.n).split(" ")[0] + " " + cap, sub: "Capítulo " + cap, tipo: "lema", anillo: 0, r: 6.2, href: "#/" + b0.c + "/" + cap, desc: "Capítulo " + cap + " de " + nombreLibro(b0) + " · " + dCap.size + " libros conectados." });
      aristas.push({ a: "b:" + b0.c, b: cid, peso: 0.8 });
    }
    const topDest = [...porDest.entries()].sort((a, b) => b[1] - a[1]).slice(0, 24);
    for (const [li, cnt] of topDest) {
      const cod = LIBROS_REF[li];
      if (li < 39) {
        const [he, es] = AV_NOMBRES[li] || [cod, cod];
        addN({ id: "av:" + cod, et: es, sub: he, tipo: "av", anillo: 1, r: Math.max(6.2, Math.min(11.5, 5.5 + Math.log10(cnt + 1) * 2.3)), href: "#/" + b0.c + "/1", desc: fmt(cnt) + " ecos desde " + nombreLibro(b0) + " hacia " + es + " (Antigua Voluntad)." });
        aristas.push({ a: "b:" + b0.c, b: "av:" + cod, peso: Math.min(2, 0.55 + cnt / 45) });
      } else {
        const b = libroDe(cod); if (!b) continue;
        addN({ id: "b:" + cod, et: b.t || b.n, sub: b.t ? b.n : "", tipo: "libro", anillo: 1, r: Math.max(6.5, Math.min(12, 5.8 + Math.log10(cnt + 1) * 2.4)), href: "#/" + cod + "/1", focoLibro: cod, desc: fmt(cnt) + " referencias cruzadas con " + nombreLibro(b) + "." });
        aristas.push({ a: "b:" + b0.c, b: "b:" + cod, peso: Math.min(2, 0.55 + cnt / 45) });
      }
    }
    for (const [cap, dCap] of topCaps) {
      const cid = "c:" + b0.c + ":" + cap;
      for (const [li] of [...dCap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2)) {
        const did = li < 39 ? "av:" + LIBROS_REF[li] : "b:" + LIBROS_REF[li];
        if (vistos.has(did)) aristas.push({ a: cid, b: did, peso: 0.5 });
      }
    }
    return { nodos, aristas };
  }
  function grafoMarcadores() {
    const todos = Object.values(MK.todo()).filter((x) => x && libroDe(x.c));
    const nodos = [], aristas = [], vistos = new Set();
    const addN = (n) => { if (vistos.has(n.id)) return; vistos.add(n.id); nodos.push(n); };
    const temasMap = new Map(MK.temas());
    for (const x of todos.slice(0, 68)) {
      const b = libroDe(x.c); if (!b) continue;
      const bid = "b:" + b.c;
      addN({ id: bid, et: b.t || b.n, sub: b.t ? b.n : "", tipo: "libro", anillo: 0, r: 10.5, pivote: true, href: "#/" + b.c + "/1", desc: "Libro en tu estudio: " + nombreLibro(b) + "." });
      const mid = "m:" + x.c + "." + x.cap + "." + x.v;
      const colHex = x.col ? colorTemaMk(x.col) : null;
      addN({
        id: mid, et: x.cap + ":" + x.v, sub: (b.t || b.n).split(" ")[0], tipo: "marca", color: colHex, anillo: 1,
        r: x.nota ? 7.6 : 6.2,
        href: "#/" + x.c + "/" + x.cap + "/l/" + x.v,
        desc: refCorta(b, x.cap, x.v) + (x.col ? " · " + (temasMap.get(x.col) || x.col) : "") + (x.nota ? " — «" + x.nota.slice(0, 140) + (x.nota.length > 140 ? "…" : "") + "»" : ""),
      });
      aristas.push({ a: bid, b: mid, peso: 1 });
      if (x.col) {
        const tid = "t:" + x.col;
        addN({ id: tid, et: temasMap.get(x.col) || x.col, sub: "Tema de color", tipo: "tema", color: colHex, anillo: 0, r: 10, pivote: true, href: "#/marcadores", desc: "Tema de estudio «" + (temasMap.get(x.col) || x.col) + "»." });
        aristas.push({ a: tid, b: mid, peso: 0.9 });
      }
    }
    return { nodos, aristas };
  }

  // PR #18/#19 · Motor de inmersión 2.5D / 3D a 25 fps máx (ralentiza suavemente al desplazarse sin detenerse jamás)
  const INMERSION_25D = (() => {
    let ax = 0, ay = 0, mx = 0, my = 0, g0 = null, b0 = null, raf25 = 0, ultF = 0, tieneGiro = false, ultPtr = 0, permisoPedido = false;
    const subs = new Set();
    const sinMov25 = () => ap.mov === "no" || (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
    const escenaCss = () => {
      const hh = location.hash || "#/";
      return hh === "#/" || hh === "" || /^#\/(mapa|escudrina\/(coloso|arbol|tesoro))(\/|\?|$)/.test(hh);
    };
    const bloqueado = () => document.hidden || sinMov25() || document.documentElement.classList.contains("con-modal");
    const escribirCss = (x, y) => {
      const st = document.documentElement.style;
      st.setProperty("--px25", x.toFixed(3));
      st.setProperty("--py25", y.toFixed(3));
    };
    const paso = (ahora) => {
      raf25 = 0;
      if (bloqueado()) return;
      const desl = document.documentElement.classList.contains("desplazando");
      const intMs = desl ? 72 : 40; // 25 fps máx normal, ~14 fps al desplazarse (nunca congelado)
      if (ahora - ultF < intMs) { raf25 = requestAnimationFrame(paso); return; }
      ultF = ahora;
      ax += (mx - ax) * 0.22;
      ay += (my - ay) * 0.22;
      if (escenaCss()) escribirCss(ax, ay);
      subs.forEach((fn) => { try { fn(ax, ay); } catch (e) {} });
      if (Math.hypot(mx - ax, my - ay) > 0.004 && (subs.size > 0 || escenaCss())) {
        raf25 = requestAnimationFrame(paso);
      }
    };
    const despertar25 = () => {
      if (!raf25 && !bloqueado() && (subs.size > 0 || escenaCss())) raf25 = requestAnimationFrame(paso);
    };
    if ("DeviceOrientationEvent" in window) {
      window.addEventListener("deviceorientation", (e) => {
        if (e.gamma == null || e.beta == null || bloqueado()) return;
        tieneGiro = true;
        const g = Math.max(-70, Math.min(70, +e.gamma || 0));
        const b = Math.max(-45, Math.min(120, +e.beta || 0));
        // Fijar el origen UNA sola vez al activar/calibrar (sin auto-borrado que anule la inclinación real)
        if (g0 === null) { g0 = g; b0 = b; }
        mx = Math.max(-1, Math.min(1, (g - g0) / 18));
        my = Math.max(-1, Math.min(1, (b - b0) / 18));
        despertar25();
      }, { passive: true });
    }
    window.addEventListener("pointermove", (e) => {
      if (tieneGiro || e.pointerType === "touch" || bloqueado()) return;
      const ahora = performance.now();
      if (ahora - ultPtr < 44) return;
      ultPtr = ahora;
      if (!subs.size && !escenaCss()) return;
      mx = Math.max(-0.85, Math.min(0.85, ((e.clientX / Math.max(1, window.innerWidth)) - 0.5) * 1.6));
      my = Math.max(-0.85, Math.min(0.85, ((e.clientY / Math.max(1, window.innerHeight)) - 0.5) * 1.6));
      despertar25();
    }, { passive: true });
    window.addEventListener("hashchange", () => {
      if (!escenaCss()) escribirCss(0, 0);
      else escribirCss(ax, ay);
    });
    const api = {
      leer: () => ({ x: ax, y: ay, giro: tieneGiro }),
      fijar: (nx, ny) => { mx = Math.max(-1, Math.min(1, +nx || 0)); my = Math.max(-1, Math.min(1, +ny || 0)); ax = mx; ay = my; if (escenaCss()) escribirCss(ax, ay); subs.forEach((fn) => { try { fn(ax, ay); } catch (e) {} }); },
      recalibrar: () => { g0 = null; b0 = null; mx = 0; my = 0; },
      refrescar: () => { if (!escenaCss()) escribirCss(0, 0); else escribirCss(ax, ay); },
      pedirPermiso: async () => {
        if (permisoPedido) return true;
        permisoPedido = true;
        try {
          if (typeof DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission === "function") {
            const st = await DeviceOrientationEvent.requestPermission();
            return st === "granted";
          }
          return "DeviceOrientationEvent" in window;
        } catch (e) { return false; }
      },
      suscribir: (fn) => { subs.add(fn); return () => subs.delete(fn); },
    };
    window.BiEx25D = api;
    return api;
  })();

  function motorConstelacion(cont, grafo, opts) {
    const o = opts || {};
    const mini = !!o.mini;
    const canvas = h("canvas", { class: "cn-lienzo", "data-sin-pellizco": "1", "aria-label": "Mapa interactivo tridimensional de conexiones" });
    const estBadge = h("span", { class: "cn-est" }, h("i", { "aria-hidden": "true" }), h("span", { text: "Calculando esfera 3D…" }));
    const bMas = h("button", { class: "cn-zbtn", type: "button", title: "Acercar", "aria-label": "Acercar", text: "+" });
    const bMen = h("button", { class: "cn-zbtn", type: "button", title: "Alejar", "aria-label": "Alejar", text: "−" });
    const bCen = h("button", { class: "cn-zbtn wide", type: "button", title: "Centrar y reiniciar 3D", text: "Centrar" });
    let modoOrbita = !mini, giroOn = true, fsOn = false;
    const bOrb = !mini ? h("button", { class: "cn-modo-btn", type: "button", "aria-pressed": "true", title: "Arrastra con un dedo para girar 360° en 3D", text: "Órbita 3D" }) : null;
    const bGiro = !mini ? h("button", { class: "cn-modo-btn", type: "button", "aria-pressed": "true", title: "Activar o recalibrar el giroscopio del teléfono", text: "Giroscopio" }) : null;
    const bFs = !mini ? h("button", { class: "cn-zbtn", type: "button", title: "Pantalla completa", "aria-label": "Pantalla completa de la Constelación", "aria-pressed": "false", text: "⛶" }) : null;
    const escena = h("div", { class: "cn-escena" + (mini ? " cn-mini" : ""), "data-sin-pellizco": "1" },
      h("div", { class: "cn-campo" },
        !mini ? h("div", { class: "cn-hud-izq" }, bOrb, bGiro) : null,
        h("div", { class: "cn-zoom" }, bMen, bMas, bCen, bFs),
        estBadge,
        canvas),
      o.leyenda || null);
    const insp = h("div", { class: "cn-insp", hidden: true });
    cont.replaceChildren(escena, insp);

    const ctx = canvas.getContext("2d");
    if (!ctx) return { enfocarTexto: () => false };
    // PR #19 · Esfera 3D profunda real: distribución áurea en 3 ejes (x, y, z en -185..+185) con pivotes en núcleo interior y libros/ecos en cáscara exterior
    const R3_INT = mini ? 58 : 108, R3_EXT = mini ? 118 : 196;
    const N = grafo.nodos.map((n, i) => {
      const ang = i * 2.3999632;
      const frac = (i + 0.5) / Math.max(1, grafo.nodos.length);
      const phi = Math.acos(1 - 2 * frac);
      const baseR = n.pivote && i === 0 && n.anillo !== 0 ? 0
        : (n.anillo === 1 ? R3_EXT + ((i * 19) % 34) - 16 : (mini ? 26 : 42) + Math.sqrt(i + 1) * (mini ? 18 : 26));
      const zProf = n.pivote && i === 0 ? 34
        : (n.anillo === 1 ? Math.cos(phi) * R3_EXT * 0.94 : Math.cos(phi * 1.35 + i * 0.7) * R3_INT * 0.92);
      return Object.assign({}, n, {
        x: Math.cos(ang) * baseR * (mini ? 1.02 : 1.12),
        y: Math.sin(ang) * baseR * 0.88,
        z: zProf,
        vx: 0, vy: 0, deg: 0,
        phX: i * 1.6180339, phY: i * 2.2360679 + 0.7, phH: i * 3.1415926,
        spX: 0.36 + ((i * 7) % 11) * 0.025, spX2: 0.22 + ((i * 13) % 9) * 0.024,
        spY: 0.34 + ((i * 5) % 13) * 0.022, spY2: 0.19 + ((i * 11) % 7) * 0.026,
        spH: 0.48 + ((i * 3) % 7) * 0.05,
      });
    });
    const byId = new Map(N.map((n) => [n.id, n]));
    const E = [];
    const adj = new Map(N.map((n) => [n.id, new Set()]));
    for (const ar of grafo.aristas) {
      const a = byId.get(ar.a), b = byId.get(ar.b);
      if (!a || !b || a === b) continue;
      E.push({ a, b, peso: ar.peso || 1 });
      a.deg++; b.deg++;
      adj.get(a.id).add(b.id); adj.get(b.id).add(a.id);
    }
    // Campo estelar profundo en esfera 3D (96 estrellas con paralaje al girar)
    const estrellas = Array.from({ length: mini ? 32 : 96 }, (_, i) => {
      const th = i * 2.3999632, ph = Math.acos(1 - 2 * ((i + 0.5) / (mini ? 32 : 96)));
      const rr = (mini ? 210 : 380) + (i % 7) * 28;
      return {
        x: Math.sin(ph) * Math.cos(th) * rr,
        y: Math.sin(ph) * Math.sin(th) * rr,
        z: Math.cos(ph) * rr,
        r: 0.6 + ((i * 7) % 10) * 0.12,
        a: 0.11 + ((i * 13) % 10) * 0.028,
      };
    });

    // Caché de sprites de orbes por color + tema para ahorrar gradientes radiales por cuadro
    const spriteCache = new Map();
    const getOrbeSprite = (col, claro, focoOn) => {
      const k = col + (claro ? "|L" : "|D") + (focoOn ? "|F" : "");
      if (spriteCache.has(k)) return spriteCache.get(k);
      const S = 96, c2 = document.createElement("canvas");
      c2.width = S; c2.height = S;
      const g2 = c2.getContext("2d");
      const mid = S / 2, rad = focoOn ? 11.5 : 15;
      const haloR = mid - 2;
      const rg = g2.createRadialGradient(mid, mid, rad * 0.3, mid, mid, haloR);
      rg.addColorStop(0, col);
      rg.addColorStop(0.42, claro ? "rgba(143,101,20,.22)" : "rgba(244,222,168,.26)");
      rg.addColorStop(1, "rgba(0,0,0,0)");
      g2.fillStyle = rg;
      g2.beginPath(); g2.arc(mid, mid, haloR, 0, Math.PI * 2); g2.fill();
      const cg = g2.createRadialGradient(mid - rad * 0.28, mid - rad * 0.28, rad * 0.12, mid, mid, rad);
      cg.addColorStop(0, claro ? "#fff8e8" : "#fffdf2");
      cg.addColorStop(0.42, col);
      cg.addColorStop(1, col);
      g2.fillStyle = cg;
      g2.beginPath(); g2.arc(mid, mid, rad, 0, Math.PI * 2); g2.fill();
      spriteCache.set(k, { c: c2, ratio: S / (rad * 2) });
      return spriteCache.get(k);
    };

    let W = 0, H = 0, dpr = 1, raf = 0, respRaf = 0, pasos = 0, dormido = false, camManual = false, enVista = true, tVivo = 0;
    const cam = { x: 0, y: 0, k: 1 };
    const orb = { yaw: 0.28, pitch: -0.22, vy: 0, vp: 0 };
    let hov = null, sel = null;
    let arrNodo = null, panOn = false, orbOn = false, p0 = null, movido = false;
    const ptrs = new Map();
    let pinchD0 = 0, pinchK0 = 1;
    const ptUlt = new Map();

    const esClaro = () => document.documentElement.getAttribute("data-theme") === "light";
    const colNodo = (n) => n.color || (esClaro() ? CN_PAL_CLARO : CN_PAL_OSCURO)[n.tipo] || "#d0af6b";
    const pillPath = (x, y, w, hh, r) => {
      const rr = Math.min(r, w / 2, hh / 2);
      ctx.beginPath();
      ctx.moveTo(x + rr, y);
      ctx.arcTo(x + w, y, x + w, y + hh, rr);
      ctx.arcTo(x + w, y + hh, x, y + hh, rr);
      ctx.arcTo(x, y + hh, x, y, rr);
      ctx.arcTo(x, y, x + w, y, rr);
      ctx.closePath();
    };
    const medir = () => {
      if (!canvas.isConnected) return false;
      const rc = canvas.getBoundingClientRect();
      if (!rc.width || !rc.height) return false;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = Math.round(rc.width); H = Math.round(rc.height);
      if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) {
        canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return true;
    };
    const aMundo = (sx, sy) => ({ x: (sx - W / 2) / cam.k + cam.x, y: (sy - H / 2) / cam.k + cam.y });
    const angulos3D = () => {
      const g = giroOn ? INMERSION_25D.leer() : { x: 0, y: 0 };
      const yaw = orb.yaw + g.x * 0.56 - vel.x * 0.005;
      const pitch = Math.max(-1.28, Math.min(1.28, orb.pitch + g.y * 0.44 + vel.y * 0.005));
      return { cy: Math.cos(yaw), sy: Math.sin(yaw), cx: Math.cos(pitch), sx: Math.sin(pitch), gx: g.x, gy: g.y, yaw, pitch };
    };
    const aPant3D = (wx, wy, wz, A3, esFondo) => {
      const FOCAL = mini ? 390 : 460;
      const kEsc = esFondo ? 1 : cam.k;
      const dx = (esFondo ? wx : (wx - cam.x)) * kEsc;
      const dy = (esFondo ? wy : (wy - cam.y)) * kEsc;
      const dz = (wz || 0) * (esFondo ? 1 : Math.pow(cam.k, 0.72));
      const rx = dx * A3.cy + dz * A3.sy;
      const rz1 = -dx * A3.sy + dz * A3.cy;
      const ry = dy * A3.cx - rz1 * A3.sx;
      const rz = dy * A3.sx + rz1 * A3.cx;
      const sc = FOCAL / Math.max(145, FOCAL - rz);
      const rRef = (mini ? 130 : 210) * Math.max(0.65, kEsc);
      const zn = Math.max(0, Math.min(1, (rz / Math.max(60, rRef) + 1) * 0.5));
      return { x: W / 2 + rx * sc, y: H / 2 + ry * sc, sc, rz, zn };
    };
    const posViva = (n) => {
      if (!tVivo || n === arrNodo) return { x: n.x, y: n.y, z: n.z };
      const amp = n.pivote ? 0.65 : 1;
      return {
        x: n.x + (Math.sin(tVivo * n.spX + n.phX) * 1.4 + Math.cos(tVivo * n.spX2 + n.phY) * 0.8) * amp,
        y: n.y + (Math.cos(tVivo * n.spY + n.phY) * 1.4 + Math.sin(tVivo * n.spY2 + n.phX) * 0.8) * amp,
        z: n.z + Math.sin(tVivo * 0.36 + n.phH) * 4.5,
      };
    };
    const limites = () => {
      if (!N.length || !W || !H) return { x0: -120, x1: 120, y0: -120, y1: 120, cx: 0, cy: 0, kFit: 1 };
      let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
      for (const n of N) { x0 = Math.min(x0, n.x - 36); x1 = Math.max(x1, n.x + 36); y0 = Math.min(y0, n.y - 32); y1 = Math.max(y1, n.y + 38); }
      const bw = Math.max(140, x1 - x0), bh = Math.max(140, y1 - y0);
      const kFit = Math.max(0.46, Math.min(1.55, Math.min((W - 54) / bw, (H - 68) / bh)));
      return { x0, x1, y0, y1, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, kFit };
    };
    const limitesCam = (L, k) => {
      const kk = Math.max(0.35, k || cam.k || 1);
      const bw = Math.max(80, L.x1 - L.x0), bh = Math.max(80, L.y1 - L.y0);
      const halfW = (W / 2) / kk, halfH = (H / 2) / kk;
      const padX = Math.max(18, (W * 0.14) / kk), padY = Math.max(18, (H * 0.14) / kk);
      const spanX = Math.max(16 / kk, (bw / 2) - halfW + padX);
      const spanY = Math.max(16 / kk, (bh / 2) - halfH + padY);
      return { bx0: L.cx - spanX, bx1: L.cx + spanX, by0: L.cy - spanY, by1: L.cy + spanY };
    };
    const encuadrar = () => {
      const L = limites();
      cam.x = L.cx; cam.y = L.cy; cam.k = L.kFit;
    };
    let camRaf = 0, metaCam = null, ultTap = 0, ultCamMs = 0;
    const vel = { x: 0, y: 0 };
    const pararCam = () => { if (camRaf) { cancelAnimationFrame(camRaf); camRaf = 0; } };
    const correrCam = () => {
      pararCam();
      if (!canvas.isConnected) return;
      const sinA = ap.mov === "no" || (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
      if (sinA) {
        if (metaCam) { cam.x = metaCam.x; cam.y = metaCam.y; cam.k = metaCam.k; metaCam = null; }
        else {
          const L = limites();
          cam.k = Math.max(Math.min(0.45, L.kFit * 0.85), Math.min(3.2, cam.k));
          const B = limitesCam(L, cam.k);
          cam.x = Math.max(B.bx0, Math.min(B.bx1, cam.x));
          cam.y = Math.max(B.by0, Math.min(B.by1, cam.y));
        }
        vel.x = 0; vel.y = 0; orb.vy = 0; orb.vp = 0; dibujar(); return;
      }
      const tick = (ahora) => {
        camRaf = 0;
        if (!canvas.isConnected || panOn || orbOn || arrNodo || ptrs.size >= 2) return;
        const intMs = document.documentElement.classList.contains("desplazando") ? 72 : 40;
        if (ahora - ultCamMs < intMs) { camRaf = requestAnimationFrame(tick); return; }
        ultCamMs = ahora;
        let mov = false;
        if (Math.abs(orb.vy) > 0.0012 || Math.abs(orb.vp) > 0.0012) {
          orb.yaw += orb.vy;
          orb.pitch = Math.max(-1.22, Math.min(1.22, orb.pitch + orb.vp));
          orb.vy *= 0.86; orb.vp *= 0.84;
          mov = true;
        } else { orb.vy = 0; orb.vp = 0; }
        if (metaCam) {
          const dx = metaCam.x - cam.x, dy = metaCam.y - cam.y, dk = metaCam.k - cam.k;
          if (Math.abs(dx) + Math.abs(dy) < 0.45 && Math.abs(dk) < 0.004) {
            cam.x = metaCam.x; cam.y = metaCam.y; cam.k = metaCam.k; metaCam = null;
          } else {
            cam.x += dx * 0.24; cam.y += dy * 0.24; cam.k += dk * 0.24; mov = true;
          }
        } else {
          const L = limites();
          if (Math.hypot(vel.x, vel.y) > 0.2) {
            cam.x += vel.x; cam.y += vel.y;
            vel.x *= 0.82; vel.y *= 0.82;
            mov = true;
          } else { vel.x = 0; vel.y = 0; }
          const kMin = Math.min(0.48, L.kFit * 0.85), kMax = 3.2;
          const tk = cam.k < kMin ? kMin : cam.k > kMax ? kMax : cam.k;
          const B = limitesCam(L, tk);
          const tx = cam.x < B.bx0 ? B.bx0 : cam.x > B.bx1 ? B.bx1 : cam.x;
          const ty = cam.y < B.by0 ? B.by0 : cam.y > B.by1 ? B.by1 : cam.y;
          const ex = tx - cam.x, ey = ty - cam.y, ek = tk - cam.k;
          if (Math.abs(ex) > 0.45 || Math.abs(ey) > 0.45 || Math.abs(ek) > 0.004) {
            cam.x += ex * 0.24; cam.y += ey * 0.24; cam.k += ek * 0.24;
            vel.x *= 0.55; vel.y *= 0.55;
            mov = true;
          } else {
            cam.x = tx; cam.y = ty; cam.k = tk;
          }
        }
        dibujar();
        if (mov) camRaf = requestAnimationFrame(tick);
      };
      camRaf = requestAnimationFrame(tick);
    };
    const irA = (x, y, k) => { metaCam = { x, y, k: k != null ? k : cam.k }; vel.x = 0; vel.y = 0; correrCam(); };
    const pasoFisica = (cool) => {
      const rep = mini ? 3300 : 7000;
      const lBase = mini ? 68 : 104;
      const sepMin = mini ? 22 : 34;
      const gx = mini ? 0.0048 : 0.0038;
      const gy = mini ? 0.0048 : 0.0042;
      for (let i = 0; i < N.length; i++) {
        const a = N[i];
        for (let j = i + 1; j < N.length; j++) {
          const b = N[j];
          const dx = b.x - a.x, dy = b.y - a.y;
          const d2 = dx * dx + dy * dy + 16;
          if (d2 > 480000) continue;
          const d = Math.sqrt(d2);
          let f = (rep / d2) * cool;
          const minD = a.r + b.r + sepMin;
          if (d < minD) f += (minD - d) * 0.14 * cool;
          const fx = (dx / d) * f, fy = (dy / d) * f;
          if (a !== arrNodo) { a.vx -= fx; a.vy -= fy; }
          if (b !== arrNodo) { b.vx += fx; b.vy += fy; }
        }
      }
      for (const e of E) {
        const dx = e.b.x - e.a.x, dy = e.b.y - e.a.y;
        const d = Math.sqrt(dx * dx + dy * dy) || 1;
        const ideal = lBase / Math.pow(Math.max(0.45, e.peso), 0.32);
        const f = (d - ideal) * 0.022 * cool;
        const fx = (dx / d) * f, fy = (dy / d) * f;
        if (e.a !== arrNodo) { e.a.vx += fx; e.a.vy += fy; }
        if (e.b !== arrNodo) { e.b.vx -= fx; e.b.vy -= fy; }
      }
      let energia = 0;
      for (const n of N) {
        if (n === arrNodo) { n.vx = 0; n.vy = 0; continue; }
        n.vx = (n.vx - n.x * gx * cool) * 0.80;
        n.vy = (n.vy - n.y * gy * cool) * 0.80;
        const spd = Math.hypot(n.vx, n.vy);
        if (spd > 18) { n.vx = (n.vx / spd) * 18; n.vy = (n.vy / spd) * 18; }
        n.x += n.vx; n.y += n.vy;
        energia += spd;
      }
      return energia / Math.max(1, N.length);
    };
    const dibujarAnillo3D = (rr, rotX, rotY, claro, punteado) => {
      const SEG = 44;
      const cX = Math.cos(rotX), sX = Math.sin(rotX), cY = Math.cos(rotY), sY = Math.sin(rotY);
      const A3 = angulos3D();
      for (let capa = 0; capa < 2; capa++) {
        // capa 0 = arco posterior tenue, capa 1 = arco frontal luminoso (da percepción inmediata de esfera 3D)
        ctx.save();
        ctx.strokeStyle = capa === 1
          ? (claro ? "rgba(138,96,18,.28)" : "rgba(232,196,120,.26)")
          : (claro ? "rgba(117,87,29,.09)" : "rgba(218,184,114,.08)");
        ctx.lineWidth = capa === 1 ? 1.15 : 0.85;
        if (punteado || capa === 0) ctx.setLineDash(capa === 0 ? [2.5, 5.5] : [4, 5]);
        ctx.beginPath();
        let trazando = false;
        for (let s = 0; s <= SEG; s++) {
          const th = (s / SEG) * Math.PI * 2;
          const x0 = Math.cos(th) * rr, y0 = Math.sin(th) * rr, z0 = 0;
          const y1 = y0 * cX - z0 * sX, z1 = y0 * sX + z0 * cX;
          const x2 = x0 * cY + z1 * sY, z2 = -x0 * sY + z1 * cY;
          const p = aPant3D(x2, y1, z2, A3, false);
          const enCapa = capa === 1 ? p.rz >= -6 : p.rz < 6;
          if (enCapa) {
            if (!trazando) { ctx.moveTo(p.x, p.y); trazando = true; }
            else ctx.lineTo(p.x, p.y);
          } else {
            trazando = false;
          }
        }
        ctx.stroke();
        ctx.restore();
      }
    };
    const dibujar = () => {
      if (!W || !H) return;
      const claro = esClaro();
      const A3 = angulos3D();
      ctx.clearRect(0, 0, W, H);
      // 1) Campo estelar profundo 3D girando con la esfera + 3 anillos armilares 3D reales (ecuador + 2 meridianos)
      ctx.save();
      for (let si = 0; si < estrellas.length; si++) {
        const st = estrellas[si];
        const p = aPant3D(st.x, st.y, st.z, A3, true);
        if (p.x < -10 || p.x > W + 10 || p.y < -10 || p.y > H + 10) continue;
        const pul = tVivo ? (0.82 + 0.18 * Math.sin(tVivo * (0.45 + (si % 5) * 0.12) + si * 1.7)) : 1;
        const op = Math.min(0.68, st.a * pul * (0.45 + 0.95 * p.zn));
        ctx.fillStyle = claro ? "rgba(117,87,29," + (op * 0.72).toFixed(3) + ")" : "rgba(246,230,192," + op.toFixed(3) + ")";
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.5, st.r * p.sc * 0.85), 0, Math.PI * 2);
        ctx.fill();
      }
      const rArm = mini ? 128 : 226;
      dibujarAnillo3D(rArm, Math.PI * 0.5, 0.08, claro, false);
      dibujarAnillo3D(rArm * 0.82, 0.22, Math.PI * 0.42, claro, false);
      dibujarAnillo3D(rArm * 0.96, -0.34, -Math.PI * 0.36, claro, true);
      ctx.restore();

      const foco = hov || sel;
      const vecFoco = foco ? adj.get(foco.id) : null;
      ptUlt.clear();
      for (const n of N) {
        const pv = posViva(n);
        const p = aPant3D(pv.x, pv.y, pv.z, A3, false);
        p.rad = Math.max(3.0, n.r * Math.pow(cam.k, 0.52) * p.sc);
        ptUlt.set(n.id, p);
      }

      // 2) Filamentos curvos de Bézier ordenados por profundidad media (del fondo al frente)
      const EOrd = E.slice().sort((e1, e2) => {
        const z1 = ((ptUlt.get(e1.a.id)?.rz || 0) + (ptUlt.get(e1.b.id)?.rz || 0)) * 0.5;
        const z2 = ((ptUlt.get(e2.a.id)?.rz || 0) + (ptUlt.get(e2.b.id)?.rz || 0)) * 0.5;
        return z1 - z2;
      });
      for (let i = 0; i < EOrd.length; i++) {
        const e = EOrd[i];
        const p1 = ptUlt.get(e.a.id), p2 = ptUlt.get(e.b.id);
        if (!p1 || !p2) continue;
        const viva = !foco || e.a === foco || e.b === foco;
        const mx = (p1.x + p2.x) / 2, my = (p1.y + p2.y) / 2;
        const dx = p2.x - p1.x, dy = p2.y - p1.y;
        const curv = (i % 2 === 0 ? 1 : -1) * 0.08;
        const cx = mx - dy * curv, cy = my + dx * curv;
        const profMed = (p1.zn + p2.zn) * 0.5;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.quadraticCurveTo(cx, cy, p2.x, p2.y);
        if (foco && viva) {
          ctx.save();
          ctx.strokeStyle = claro ? "rgba(163,114,22,.22)" : "rgba(244,214,140,.24)";
          ctx.lineWidth = 4.8;
          ctx.stroke();
          ctx.strokeStyle = claro ? "rgba(138,96,14,.92)" : "rgba(255,236,184,.94)";
          ctx.lineWidth = Math.max(1.3, Math.min(2.4, (1.25 + e.peso * 0.5) * (0.78 + profMed * 0.42)));
          ctx.stroke();
          ctx.restore();
        } else {
          const al = foco ? (claro ? 0.05 : 0.045) : (claro ? 0.11 + profMed * 0.28 : 0.11 + profMed * 0.30);
          ctx.strokeStyle = claro ? "rgba(126,90,26," + al.toFixed(3) + ")" : "rgba(220,186,116," + al.toFixed(3) + ")";
          ctx.lineWidth = Math.max(0.65, Math.min(1.85, (0.68 + e.peso * 0.36) * (0.72 + profMed * 0.48)));
          ctx.stroke();
        }
      }

      // 3) Orbes 3D con sprites cacheados (algoritmo del pintor: lejanos atrás atenuados, cercanos al frente grandes y nítidos)
      const NOrd = N.slice().sort((a, b) => (ptUlt.get(a.id)?.rz || 0) - (ptUlt.get(b.id)?.rz || 0));
      for (const n of NOrd) {
        const p = ptUlt.get(n.id);
        if (!p || p.x < -70 || p.x > W + 70 || p.y < -50 || p.y > H + 50) continue;
        const col = colNodo(n);
        const esFoco = foco === n;
        const esVec = !foco || esFoco || (vecFoco && vecFoco.has(n.id));
        const rad = p.rad;
        const atm = esFoco ? 1 : (0.38 + 0.62 * p.zn);
        const sp = getOrbeSprite(col, claro, esFoco);
        const respH = tVivo ? (1 + 0.05 * Math.sin(tVivo * n.spH + n.phH)) : 1;
        const drawW = rad * 2 * sp.ratio * respH;
        ctx.save();
        ctx.globalAlpha = esVec ? atm : 0.12;
        ctx.drawImage(sp.c, p.x - drawW / 2, p.y - drawW / 2, drawW, drawW);
        if (n.pivote || esFoco) {
          ctx.strokeStyle = esFoco ? (claro ? "#100d0a" : "#fff7dc") : (claro ? "rgba(16,13,10,.36)" : "rgba(255,244,212,.52)");
          ctx.lineWidth = esFoco ? 1.7 : 1;
          ctx.beginPath();
          ctx.arc(p.x, p.y, rad + (esFoco ? 4.2 : 3.0), 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
      }

      // 4) Capa de etiquetas sin colisiones (prioridad por foco, cercanía real en Z y grado)
      const ordenEt = [...N].sort((a, b) => {
        const za = ptUlt.get(a.id)?.zn || 0.5, zb = ptUlt.get(b.id)?.zn || 0.5;
        const pa = (foco === a ? 1000 : 0) + (foco && vecFoco && vecFoco.has(a.id) ? 300 : 0) + za * 65 + (a.pivote ? 48 : 0) + a.deg * 2.5 + a.r;
        const pb = (foco === b ? 1000 : 0) + (foco && vecFoco && vecFoco.has(b.id) ? 300 : 0) + zb * 65 + (b.pivote ? 48 : 0) + b.deg * 2.5 + b.r;
        return pb - pa;
      });
      const cajas = [];
      const choca = (bx) => cajas.some((c) => !(bx.x1 < c.x0 || bx.x0 > c.x1 || bx.y1 < c.y0 || bx.y0 > c.y1));
      for (const n of ordenEt) {
        const p = ptUlt.get(n.id);
        if (!p || p.x < 16 || p.x > W - 16 || p.y < 16 || p.y > H - 22) continue;
        const esFoco = foco === n;
        const esVec = !foco || esFoco || (vecFoco && vecFoco.has(n.id));
        if (foco && !esVec) continue;
        if (!esFoco && p.zn < 0.24 && N.length > 20) continue;
        const rad = p.rad;
        const fs = Math.round(Math.max(9.5, Math.min(15, (esFoco ? 13.5 : n.pivote ? 11.8 : 10.6) * Math.pow(cam.k, 0.22) * (0.82 + p.zn * 0.34))));
        ctx.save();
        ctx.globalAlpha = esFoco ? 1 : (0.52 + 0.48 * p.zn);
        ctx.font = (esFoco || n.pivote ? "700 " : "400 ") + fs + "px 'BiEx Texto', 'Gentium Plus', Georgia, serif";
        const mw = ctx.measureText(n.et).width;
        const mostrarSub = (esFoco || cam.k >= 1.55) && n.sub;
        const pw = Math.max(mw + 14, mostrarSub ? Math.min(148, n.sub.length * 6.5 + 14) : 0);
        const ph = fs + (mostrarSub ? fs + 5 : 6);
        const bx = { x0: p.x - pw / 2 - 4, x1: p.x + pw / 2 + 4, y0: p.y + rad + 4, y1: p.y + rad + 4 + ph + 3 };
        if (!esFoco && choca(bx)) { ctx.restore(); continue; }
        cajas.push(bx);
        const yPill = p.y + rad + 5;
        pillPath(p.x - pw / 2, yPill, pw, ph, 7);
        ctx.fillStyle = esFoco
          ? (claro ? "rgba(255,250,239,.95)" : "rgba(12,13,20,.94)")
          : (claro ? "rgba(247,241,229,.86)" : "rgba(7,8,13,.82)");
        ctx.fill();
        if (esFoco || n.pivote) {
          ctx.strokeStyle = esFoco ? (claro ? "rgba(143,101,20,.65)" : "rgba(244,222,168,.65)") : (claro ? "rgba(117,87,29,.22)" : "rgba(218,184,114,.22)");
          ctx.lineWidth = esFoco ? 1.1 : 0.75;
          ctx.stroke();
        }
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillStyle = esFoco ? (claro ? "#100d0a" : "#fff6dc") : (claro ? "#1c1813" : "#f2eadc");
        ctx.fillText(n.et, p.x, yPill + 3);
        if (mostrarSub) {
          ctx.font = "400 " + Math.max(9, fs - 2) + "px 'BiEx Interfaz', system-ui, sans-serif";
          ctx.fillStyle = claro ? "#785718" : "#dfc282";
          ctx.fillText(n.sub, p.x, yPill + fs + 4);
        }
        ctx.restore();
      }
    };
    const sinAnimCn = () => ap.mov === "no" || (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
    const pararRespirar = () => { if (respRaf) { clearTimeout(respRaf); respRaf = 0; } };
    // Nunca se detiene durante el scroll: al desplazarse ralentiza suavemente (~14 fps) en lugar de congelar la esfera 3D
    const puedeRespirar = () => canvas.isConnected && dormido && enVista && !document.hidden && !document.documentElement.classList.contains("con-modal") && !sinAnimCn();
    const iniciarRespirar = () => {
      if (respRaf || !puedeRespirar()) return;
      const pasoResp = () => {
        respRaf = 0;
        if (!puedeRespirar()) return;
        const desl = document.documentElement.classList.contains("desplazando");
        tVivo = performance.now() * 0.001;
        if (!arrNodo && !panOn && !orbOn && !camRaf) {
          // Auto-órbita 3D majestuosa y muy suave (25 fps normal, ~14 fps durante desplazamiento)
          if (!sel && !hov) orb.yaw += desl ? 0.0022 : 0.0044;
          dibujar();
        }
        respRaf = setTimeout(pasoResp, desl ? 72 : 40);
      };
      respRaf = setTimeout(pasoResp, 40);
    };
    const actualizarBadge = () => {
      estBadge.classList.toggle("reposo", dormido);
      const suf = dormido ? (sinAnimCn() ? " · 3D reposo" : " · Esfera 3D") : "";
      estBadge.lastChild.textContent = fmt(N.length) + " nodos · " + fmt(E.length) + " conexiones" + suf;
    };
    const pintarInspector = (n) => {
      if (!n) { insp.hidden = true; return; }
      insp.hidden = false;
      const tipoNom = { raiz: "Raíz griega", verbo: "Verbo griego", nombre: "Sustantivo", adj: "Adjetivo", lema: "Lema / Capítulo", libro: "Libro", av: "Antigua Voluntad", tema: "Tema de color", marca: "Verso marcado" }[n.tipo] || "Nodo";
      const vecs = [...(adj.get(n.id) || [])].map((id) => byId.get(id)).filter(Boolean).slice(0, 10);
      insp.replaceChildren(
        h("div", { class: "cn-insp-cab" },
          h("div", { class: "cn-insp-tit" },
            h("b", { lang: n.tipo === "raiz" || n.tipo === "verbo" || n.tipo === "nombre" || n.tipo === "adj" ? "grc" : null, text: n.et }),
            n.sub ? h("small", { text: n.sub }) : null),
          h("span", { class: "cn-insp-tipo", text: tipoNom })),
        n.desc ? h("p", { class: "cn-insp-desc", text: n.desc }) : null,
        vecs.length ? h("div", { class: "cn-insp-vec" }, vecs.map((v) => h("button", { type: "button", class: "cn-pre", onclick: () => { sel = v; camManual = true; pintarInspector(v); irA(v.x, v.y, Math.max(cam.k, 1.18)); } }, v.et))) : null,
        h("div", { class: "cn-insp-acc" },
          n.href ? h("a", { class: "btn chico oro", href: n.href }, svg(ICO.der), h("span", { text: "Abrir" })) : null,
          n.focoRaiz != null && o.alEnfocarRaiz ? h("button", { class: "btn chico", type: "button", onclick: () => o.alEnfocarRaiz(n.focoRaiz) }, svg(ICO.constelacion), h("span", { text: "Centrar familia aquí" })) : null,
          n.focoLibro && o.alEnfocarLibro ? h("button", { class: "btn chico", type: "button", onclick: () => o.alEnfocarLibro(n.focoLibro) }, svg(ICO.refs), h("span", { text: "Ver ecos de este libro" })) : null,
          h("button", { class: "btn chico", type: "button", onclick: () => { sel = null; pintarInspector(null); dibujar(); } }, h("span", { text: "Soltar foco" }))));
    };
    let ultFisMs = 0;
    const despertar = (pasosExtra) => {
      pararRespirar();
      dormido = false;
      pasos = Math.min(pasos, 165 - (pasosExtra || 45));
      actualizarBadge();
      if (!raf) raf = requestAnimationFrame(bucle);
    };
    const bucle = (ahora) => {
      raf = 0;
      if (!canvas.isConnected) return limpiar();
      const intMs = document.documentElement.classList.contains("desplazando") ? 72 : 40;
      if (ahora - ultFisMs < intMs) { raf = requestAnimationFrame(bucle); return; }
      ultFisMs = ahora;
      const cool = Math.max(0.05, 1 - pasos / 170);
      const en = pasoFisica(cool);
      pasos++;
      if (!camManual && pasos % 24 === 0) encuadrar();
      dibujar();
      if (!arrNodo && (pasos >= 175 || en < 0.025)) {
        dormido = true;
        if (!camManual) encuadrar();
        dibujar();
        actualizarBadge();
        iniciarRespirar();
        return;
      }
      raf = requestAnimationFrame(bucle);
    };
    const hitTest = (sx, sy) => {
      let mejor = null, dMin = 1e9;
      for (const n of N) {
        const p = ptUlt.get(n.id);
        if (!p) continue;
        const d = Math.hypot(p.x - sx, p.y - sy);
        const tol = Math.max(p.rad + 12, 18);
        if (d < tol && (d - p.zn * 4) < dMin) { dMin = d - p.zn * 4; mejor = n; }
      }
      return mejor;
    };
    const ptRel = (ev) => { const r = canvas.getBoundingClientRect(); return { x: ev.clientX - r.left, y: ev.clientY - r.top }; };
    let pinchMidW = null;
    canvas.addEventListener("pointerdown", (ev) => {
      ev.preventDefault();
      INMERSION_25D.pedirPermiso();
      try { const selW = window.getSelection && window.getSelection(); if (selW && !selW.isCollapsed) selW.removeAllRanges(); } catch (e) {}
      const pt = ptRel(ev);
      pararCam(); metaCam = null; vel.x = 0; vel.y = 0; orb.vy = 0; orb.vp = 0;
      ptrs.set(ev.pointerId, pt);
      try { canvas.setPointerCapture(ev.pointerId); } catch (e) {}
      if (ptrs.size === 2) {
        const [a, b] = [...ptrs.values()];
        pinchD0 = Math.hypot(b.x - a.x, b.y - a.y) || 1;
        pinchK0 = cam.k;
        pinchMidW = aMundo((a.x + b.x) / 2, (a.y + b.y) / 2);
        arrNodo = null; panOn = false; orbOn = false; camManual = true;
        return;
      }
      p0 = pt; movido = false;
      const n = hitTest(pt.x, pt.y);
      if (n && !modoOrbita) { arrNodo = n; canvas.classList.add("arrastra"); }
      else if (modoOrbita) { arrNodo = n || null; orbOn = true; canvas.classList.add("arrastra"); }
      else { panOn = true; canvas.classList.add("arrastra"); }
    });
    canvas.addEventListener("pointermove", (ev) => {
      const pt = ptRel(ev);
      if (ptrs.has(ev.pointerId)) ptrs.set(ev.pointerId, pt);
      if (ptrs.size === 2) {
        const [a, b] = [...ptrs.values()];
        const d = Math.hypot(b.x - a.x, b.y - a.y) || 1;
        const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        cam.k = Math.max(0.32, Math.min(3.5, pinchK0 * (d / pinchD0)));
        if (pinchMidW) {
          cam.x = pinchMidW.x - (mx - W / 2) / cam.k;
          cam.y = pinchMidW.y - (my - H / 2) / cam.k;
        }
        camManual = true;
        dibujar(); return;
      }
      if (orbOn && p0) {
        const dx = pt.x - p0.x, dy = pt.y - p0.y;
        if (Math.hypot(dx, dy) > 4) { movido = true; arrNodo = null; }
        const dYaw = dx * 0.0085, dPit = dy * 0.0068;
        orb.yaw += dYaw;
        orb.pitch = Math.max(-1.22, Math.min(1.22, orb.pitch + dPit));
        orb.vy = Math.max(-0.14, Math.min(0.14, orb.vy * 0.4 + dYaw * 0.6));
        orb.vp = Math.max(-0.12, Math.min(0.12, orb.vp * 0.4 + dPit * 0.6));
        p0 = pt; dibujar(); return;
      }
      if (arrNodo) {
        if (p0 && Math.hypot(pt.x - p0.x, pt.y - p0.y) > 4) movido = true;
        const m = aMundo(pt.x, pt.y);
        arrNodo.x = m.x; arrNodo.y = m.y;
        despertar(30);
        dibujar(); return;
      }
      if (panOn && p0) {
        const dx = pt.x - p0.x, dy = pt.y - p0.y;
        if (Math.hypot(dx, dy) > 4) { movido = true; camManual = true; }
        const L = limites(), B = limitesCam(L, cam.k);
        const tacto = ev.pointerType === "touch" ? 0.78 : 0.92;
        let stepX = (-dx * tacto) / cam.k, stepY = (-dy * tacto) / cam.k;
        const excX = cam.x < B.bx0 ? (B.bx0 - cam.x) : cam.x > B.bx1 ? (cam.x - B.bx1) : 0;
        const excY = cam.y < B.by0 ? (B.by0 - cam.y) : cam.y > B.by1 ? (cam.y - B.by1) : 0;
        const alejX = (cam.x < B.bx0 && stepX < 0) || (cam.x > B.bx1 && stepX > 0);
        const alejY = (cam.y < B.by0 && stepY < 0) || (cam.y > B.by1 && stepY > 0);
        if (alejX && excX > 0) stepX /= 1 + excX / (34 / Math.max(0.45, cam.k));
        if (alejY && excY > 0) stepY /= 1 + excY / (34 / Math.max(0.45, cam.k));
        const topeX = 36 / Math.max(0.45, cam.k), topeY = 36 / Math.max(0.45, cam.k);
        cam.x = Math.max(B.bx0 - topeX, Math.min(B.bx1 + topeX, cam.x + stepX));
        cam.y = Math.max(B.by0 - topeY, Math.min(B.by1 + topeY, cam.y + stepY));
        vel.x = Math.max(-20, Math.min(20, vel.x * 0.45 + stepX * 0.55));
        vel.y = Math.max(-20, Math.min(20, vel.y * 0.45 + stepY * 0.55));
        p0 = pt; dibujar(); return;
      }
      const nh = hitTest(pt.x, pt.y);
      if (nh !== hov) { hov = nh; canvas.style.cursor = nh ? "pointer" : "grab"; dibujar(); }
    });
    const soltar = (ev) => {
      const eraDrag = panOn || orbOn || ptrs.size >= 2;
      ptrs.delete(ev.pointerId);
      if (ptrs.size < 2) pinchMidW = null;
      if (arrNodo && !movido) {
        sel = sel === arrNodo ? null : arrNodo;
        pintarInspector(sel);
        if (sel) irA(sel.x, sel.y, Math.max(cam.k, 1.05));
        else dibujar();
      } else if ((panOn || orbOn) && !movido) {
        const ahora = performance.now();
        if (ahora - ultTap < 320) {
          camManual = false; sel = null; pintarInspector(null);
          orb.yaw = 0.28; orb.pitch = -0.22; orb.vy = 0; orb.vp = 0;
          const L = limites(); irA(L.cx, L.cy, L.kFit);
        } else {
          sel = null; pintarInspector(null); dibujar();
        }
        ultTap = ahora;
      }
      arrNodo = null; panOn = false; orbOn = false; canvas.classList.remove("arrastra");
      if (eraDrag && movido && !ptrs.size) correrCam();
    };
    canvas.addEventListener("pointerup", soltar);
    canvas.addEventListener("pointercancel", soltar);
    canvas.addEventListener("touchstart", (ev) => { if (ev.touches.length >= 2) ev.stopPropagation(); }, { passive: true });
    canvas.addEventListener("touchmove", (ev) => { if (ev.touches.length >= 2) { ev.stopPropagation(); if (ev.cancelable) ev.preventDefault(); } }, { passive: false });
    canvas.addEventListener("dblclick", (ev) => {
      const pt = ptRel(ev), n = hitTest(pt.x, pt.y);
      if (n && n.href) location.hash = n.href;
    });
    canvas.addEventListener("wheel", (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      pararCam(); metaCam = null;
      const pt = ptRel(ev);
      const antes = aMundo(pt.x, pt.y);
      const fac = ev.deltaY < 0 ? 1.14 : 0.88;
      const L = limites();
      cam.k = Math.max(Math.min(0.45, L.kFit * 0.85), Math.min(3.2, cam.k * fac));
      const desp = aMundo(pt.x, pt.y);
      const B = limitesCam(L, cam.k);
      cam.x = Math.max(B.bx0, Math.min(B.bx1, cam.x + antes.x - desp.x));
      cam.y = Math.max(B.by0, Math.min(B.by1, cam.y + antes.y - desp.y));
      camManual = true;
      dibujar();
      correrCam();
    }, { passive: false });
    bMas.onclick = () => { camManual = true; irA(cam.x, cam.y, Math.min(3.2, cam.k * 1.25)); };
    bMen.onclick = () => { const L = limites(); camManual = true; irA(cam.x, cam.y, Math.max(Math.min(0.48, L.kFit * 0.85), cam.k * 0.8)); };
    bCen.onclick = () => { camManual = false; orb.yaw = 0.28; orb.pitch = -0.22; orb.vy = 0; orb.vp = 0; INMERSION_25D.recalibrar(); const L = limites(); irA(L.cx, L.cy, L.kFit); };
    if (bOrb) {
      bOrb.onclick = () => {
        modoOrbita = !modoOrbita;
        bOrb.setAttribute("aria-pressed", String(modoOrbita));
        bOrb.textContent = modoOrbita ? "Órbita 3D" : "Mover 2D";
      };
    }
    if (bGiro) {
      bGiro.onclick = async () => {
        if (!giroOn) {
          await INMERSION_25D.pedirPermiso();
          INMERSION_25D.recalibrar();
          giroOn = true;
          bGiro.setAttribute("aria-pressed", "true");
          avisar("Giroscopio 3D calibrado");
        } else {
          giroOn = false;
          bGiro.setAttribute("aria-pressed", "false");
        }
        dibujar();
      };
    }
    const ponerFsCn = (on) => {
      fsOn = !!on;
      escena.classList.toggle("cn-fs", fsOn);
      document.documentElement.classList.toggle("cn-fs-on", fsOn);
      if (bFs) { bFs.setAttribute("aria-pressed", String(fsOn)); bFs.textContent = fsOn ? "✕" : "⛶"; bFs.title = fsOn ? "Salir de pantalla completa" : "Pantalla completa"; }
      requestAnimationFrame(() => { if (medir()) { if (!camManual) encuadrar(); dibujar(); } });
    };
    if (bFs) bFs.onclick = () => ponerFsCn(!fsOn);
    const onKeyCn = (ev) => { if (ev.key === "Escape" && fsOn) ponerFsCn(false); };
    window.addEventListener("keydown", onKeyCn);

    const off25d = INMERSION_25D.suscribir(() => {
      if (canvas.isConnected && enVista && giroOn && !arrNodo && !panOn && !orbOn && !camRaf) dibujar();
    });
    const ro = window.ResizeObserver ? new ResizeObserver(() => { if (medir()) { if (!camManual) encuadrar(); dibujar(); } }) : null;
    if (ro) ro.observe(canvas);
    const ioVis = "IntersectionObserver" in window ? new IntersectionObserver((es) => {
      enVista = es.some((x) => x.isIntersecting);
      if (enVista) iniciarRespirar(); else pararRespirar();
    }, { threshold: 0.02 }) : null;
    if (ioVis) ioVis.observe(canvas);
    const onVisCn = () => { if (document.hidden) pararRespirar(); else iniciarRespirar(); };
    document.addEventListener("visibilitychange", onVisCn);
    let ultTemaCn = document.documentElement.getAttribute("data-theme") || "dark";
    const moTema = new MutationObserver(() => {
      const tm = document.documentElement.getAttribute("data-theme") || "dark";
      if (tm !== ultTemaCn) { ultTemaCn = tm; spriteCache.clear(); dibujar(); }
      if (puedeRespirar()) iniciarRespirar(); else pararRespirar();
    });
    moTema.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "data-mov", "class"] });
    const limpiar = () => {
      off25d();
      if (fsOn) document.documentElement.classList.remove("cn-fs-on");
      window.removeEventListener("keydown", onKeyCn);
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      pararRespirar();
      pararCam();
      if (ro) ro.disconnect();
      if (ioVis) ioVis.disconnect();
      document.removeEventListener("visibilitychange", onVisCn);
      moTema.disconnect();
    };

    requestAnimationFrame(() => {
      if (!medir()) return;
      const sinA = sinAnimCn();
      const initPasos = sinA ? 175 : 95;
      for (let i = 0; i < initPasos; i++) pasoFisica(Math.max(0.06, 1 - i / 170));
      pasos = initPasos;
      encuadrar();
      if (sinA) { dormido = true; dibujar(); actualizarBadge(); }
      else { actualizarBadge(); raf = requestAnimationFrame(bucle); }
    });
    return {
      enfocarTexto(q) {
        const ql = llanoCn(q), ql2 = ql.replace(/ch/g, "j").replace(/ph/g, "f"), kg = claveGr(q);
        if (!ql && !kg) { sel = null; camManual = false; const L = limites(); pintarInspector(null); irA(L.cx, L.cy, L.kFit); return false; }
        const n = N.find((x) => {
          if (kg && claveGr(x.et).includes(kg)) return true;
          const hay = llanoCn(x.et + " " + (x.sub || "") + " " + (x.busq || "") + " " + (x.desc || ""));
          return (ql && hay.includes(ql)) || (ql2 && hay.includes(ql2));
        });
        if (!n) return false;
        sel = n; camManual = true;
        pintarInspector(n);
        irA(n.x, n.y, Math.max(cam.k, 1.32));
        return true;
      },
    };
  }
  function tarjetaMinigrafo(titulo, sub, grafo, hrefFull) {
    const zona = h("div", {});
    const card = h("div", { class: "tarjeta cn-mini-card", "data-sec": titulo },
      h("div", { class: "cn-mini-cab" },
        h("h2", { text: titulo }),
        h("a", { class: "btn chico oro", href: hrefFull }, svg(ICO.constelacion), h("span", { text: "Pantalla completa" }))),
      sub ? h("p", { class: "nota-ui", text: sub }) : null,
      zona);
    requestAnimationFrame(() => { if (zona.isConnected) motorConstelacion(zona, grafo, { mini: true }); });
    return card;
  }
  async function vistaConstelacion(queryStr) {
    document.title = "Constelación del léxico y notas · BiEx";
    navActual("#/buscar");
    if (!T || !LX) vista().replaceChildren(cargando("Trazando la constelación…"));
    alTope();
    try { await Promise.all([tablas(), lexico()]); } catch (e) { vista().replaceChildren(fallo("No se pudo cargar el léxico.")); return; }
    const params = new URLSearchParams(queryStr || "");
    let capa = params.get("capa") || "lexico";
    let raizSel = params.get("raiz") != null ? +params.get("raiz") : null;
    let lemaSel = params.get("lema") != null ? +params.get("lema") : null;
    let libroSel = (params.get("libro") || "JHN").toUpperCase();
    if (!libroDe(libroSel)) libroSel = "JHN";

    const buscarIn = h("input", { class: "cn-buscar", type: "search", placeholder: "Buscar un nodo (griego, transliteración, libro o tema)…", "aria-label": "Buscar nodo en la constelación" });
    const zonaPresets = h("div", { class: "cn-presets" });
    const zonaMapa = h("div", {});
    let ctrl = null;
    buscarIn.addEventListener("input", () => { if (ctrl) ctrl.enfocarTexto(buscarIn.value.trim()); });

    const presetsRaices = CN_PRESETS_GR.map((g) => {
      const li = T.L.findIndex((x) => claveGr(String(x).split(",")[0]) === g);
      return li >= 0 ? (LX.F[li] != null ? LX.F[li] : li) : -1;
    }).filter((x, i, a) => x >= 0 && a.indexOf(x) === i);

    const leyendaDe = (c) => {
      const claro = document.documentElement.getAttribute("data-theme") === "light";
      const pal = claro ? CN_PAL_CLARO : CN_PAL_OSCURO;
      const items = c === "refs"
        ? [[pal.raiz, "Libro central"], [pal.libro, "Nueva Voluntad"], [pal.av, "Antigua Voluntad"], [pal.lema, "Capítulos"]]
        : c === "notas"
          ? [[pal.libro, "Libros"], [pal.tema, "Temas de color"], [pal.marca, "Tus versos marcados"]]
          : [[pal.raiz, "Raíces griegas"], [pal.verbo, "Verbos"], [pal.nombre, "Sustantivos"], [pal.adj, "Adjetivos"], [pal.libro, "Libros"]];
      return h("div", { class: "cn-leyenda" }, items.map(([col, tx]) => h("span", { class: "cn-ley-it" }, h("i", { style: "background:" + col + ";color:" + col }), tx)));
    };
    const renderMapa = async () => {
      for (const b of barraCapas.children) b.setAttribute("aria-pressed", String(b.dataset.c === capa));
      buscarIn.value = "";
      if (capa === "lexico") {
        zonaPresets.replaceChildren(
          h("button", { type: "button", class: "cn-pre", "aria-pressed": String(raizSel == null && lemaSel == null), text: "Panorama (27 libros)", onclick: () => { raizSel = null; lemaSel = null; renderMapa(); } }),
          ...presetsRaices.map((r) => h("button", { type: "button", class: "cn-pre", "aria-pressed": String(raizSel === r), onclick: () => { raizSel = r; lemaSel = null; renderMapa(); } }, h("span", { lang: "grc", text: lemaCorto(r) }), " · " + tlCorta(r))));
        const g = lemaSel != null ? grafoLema(lemaSel) : grafoConstelacionLexico(raizSel);
        ctrl = motorConstelacion(zonaMapa, g, {
          leyenda: leyendaDe("lexico"),
          alEnfocarRaiz: (r) => { raizSel = r; lemaSel = null; renderMapa(); },
        });
      } else if (capa === "refs") {
        const selLib = h("select", { "aria-label": "Elegir libro para referencias cruzadas", onchange: (e) => { libroSel = e.target.value; renderMapa(); } },
          librosEnOrden().map((b) => h("option", { value: b.c, selected: b.c === libroSel ? true : null, text: nombreLibro(b) })));
        zonaPresets.replaceChildren(h("div", { class: "cn-foco" }, selLib));
        zonaMapa.replaceChildren(cargando("Cargando referencias cruzadas de " + nombreLibro(libroDe(libroSel)) + "…"));
        try {
          const g = await grafoConstelacionRefs(libroSel);
          ctrl = motorConstelacion(zonaMapa, g, {
            leyenda: leyendaDe("refs"),
            alEnfocarLibro: (c2) => { libroSel = c2; renderMapa(); },
          });
        } catch (e) { zonaMapa.replaceChildren(fallo("No se pudieron cargar las referencias cruzadas de este libro.")); }
      } else {
        zonaPresets.replaceChildren();
        const g = grafoMarcadores();
        if (!g.nodos.length) {
          ctrl = null;
          zonaMapa.replaceChildren(h("div", { class: "tarjeta" },
            h("h2", { text: "Tu mapa personal aún está en blanco" }),
            h("p", { class: "nota-ui", text: "Marca cualquier verso con uno de los 12 temas de color o escribe una nota mientras lees, y aquí cobrará vida tu propia constelación personal de estudio." }),
            h("div", { class: "sn-acc" },
              h("a", { class: "btn chico oro", href: "#/JHN/1" }, svg(ICO.libro), h("span", { text: "Ir a leer ahora" })),
              h("button", { class: "btn chico", type: "button", onclick: () => { capa = "lexico"; renderMapa(); } }, svg(ICO.constelacion), h("span", { text: "Explorar el léxico" })))));
          return;
        }
        ctrl = motorConstelacion(zonaMapa, g, { leyenda: leyendaDe("notas") });
      }
    };
    const barraCapas = h("div", { class: "cn-capas", role: "group", "aria-label": "Capa de la constelación" },
      h("button", { type: "button", class: "cn-capa", "data-c": "lexico", "aria-pressed": String(capa === "lexico"), onclick: () => { capa = "lexico"; renderMapa(); } }, svg(ICO.raiz), h("span", { text: "Léxico y raíces" })),
      h("button", { type: "button", class: "cn-capa", "data-c": "refs", "aria-pressed": String(capa === "refs"), onclick: () => { capa = "refs"; renderMapa(); } }, svg(ICO.refs), h("span", { text: "Referencias cruzadas" })),
      h("button", { type: "button", class: "cn-capa", "data-c": "notas", "aria-pressed": String(capa === "notas"), onclick: () => { capa = "notas"; renderMapa(); } }, svg(ICO.marcador), h("span", { text: "Mis notas (12 colores)" })));

    vista().replaceChildren(h("div", { class: "in" }, h("section", { class: "panel cn-pag" },
      barraVolver(),
      h("div", { class: "panel-cab" },
        h("span", { class: "eyebrow", text: "Cartógrafo interactivo · red de conexiones" }),
        h("h1", { class: "texto", text: "Constelación del léxico" }),
        h("p", { class: "q-lead", text: "Explora cómo se entrelazan las raíces griegas, los 27 libros, las referencias cruzadas y tus notas personales. Arrastra cualquier nodo, acerca la vista o toca una estrella para iluminar su red." })),
      guiaSeccion("constelacion"),
      h("div", { class: "cn-ctl" }, barraCapas, h("div", { class: "cn-fila" }, buscarIn), zonaPresets),
      zonaMapa)));
    renderMapa();
  }

  // --- Mesa sinóptica libre (#/sinopsis)
  const SN_PRESETS = [
    ["MAT.5.3", "LUK.6.20", "Bienaventuranzas"],
    ["JHN.1.1", "1JN.1.1", "Principio y lόgος"],
    ["MAT.3.16", "MRK.1.10", "El bautismo"],
    ["ROM.3.28", "JAS.2.24", "Fe y obras"],
    ["MAT.22.37", "MRK.12.30", "El mayor mandamiento"],
    ["1CO.13.4", "GAL.5.22", "Amor y fruto"],
  ];
  function parseSinRef(s, def) {
    const m = /^([1-3A-Z]{3})\.(\d{1,3})\.(\d{1,3})$/.exec(String(s || "").toUpperCase());
    if (m && libroDe(m[1])) return { c: m[1], cap: Math.max(1, Math.min(libroDe(m[1]).caps.length, +m[2])), v: Math.max(1, +m[3]) };
    return def;
  }
  async function vistaSinopsis(p1, p2) {
    document.title = "Mesa sinóptica libre · BiEx";
    navActual("#/buscar");
    if (!T || !LX) vista().replaceChildren(cargando("Preparando la mesa sinóptica…"));
    alTope();
    try { await Promise.all([tablas(), lexico()]); } catch (e) { vista().replaceChildren(fallo("No se pudieron cargar los datos griegos.")); return; }
    let A0 = parseSinRef(p1, { c: "MAT", cap: 5, v: 3 });
    let B0 = parseSinRef(p2, p1 && !p2 ? (A0.c === "LUK" ? { c: "MAT", cap: 5, v: 3 } : { c: "LUK", cap: 6, v: 20 }) : { c: "LUK", cap: 6, v: 20 });
    let focoClave = null;

    const zonaRes = h("div", { class: "sn-resumen" });
    const zonaGrid = h("div", { class: "sn-grid" });
    const presets = h("div", { class: "sn-presets" }, SN_PRESETS.map(([a, b, et]) => h("button", {
      type: "button", class: "cn-pre", text: et,
      onclick: () => { A0 = parseSinRef(a, A0); B0 = parseSinRef(b, B0); focoClave = null; actualizarUrl(); cargarPar(); },
    })));
    const actualizarUrl = () => {
      try { history.replaceState(history.state, "", urlHash("#/sinopsis/" + A0.c + "." + A0.cap + "." + A0.v + "/" + B0.c + "." + B0.cap + "." + B0.v)); } catch (e) {}
    };
    const crearSelector = (ref, alCambiar) => {
      const b = libroDe(ref.c) || D.libros[0];
      const sLib = h("select", { "aria-label": "Libro" }, librosEnOrden().map((x) => h("option", { value: x.c, selected: x.c === b.c ? true : null, text: nombreLibro(x) })));
      const sCap = h("select", { "aria-label": "Capítulo" }, Array.from({ length: b.caps.length }, (_, i) => h("option", { value: String(i + 1), selected: i + 1 === ref.cap ? true : null, text: "Cap. " + (i + 1) })));
      const vMax = Math.max(1, ((b.caps[ref.cap - 1] || {}).v) || 40);
      const sVer = h("select", { "aria-label": "Verso" }, Array.from({ length: vMax }, (_, i) => h("option", { value: String(i + 1), selected: i + 1 === ref.v ? true : null, text: "v. " + (i + 1) })));
      sLib.onchange = () => { ref.c = sLib.value; ref.cap = 1; ref.v = 1; alCambiar(); };
      sCap.onchange = () => { ref.cap = +sCap.value || 1; ref.v = 1; alCambiar(); };
      sVer.onchange = () => { ref.v = +sVer.value || 1; alCambiar(); };
      const campo = (et, el) => h("div", { class: "sn-campo" }, h("span", { class: "sn-campo-et", text: et }), el);
      return h("div", { class: "sn-sel-bar" }, campo("Libro", sLib), campo("Capítulo", sCap), campo("Verso", sVer));
    };
    const cargarPar = async () => {
      zonaRes.replaceChildren(h("p", { class: "nota-ui", text: "Comparando lemas y raíces griegas…" }));
      try {
        const [lA, lB, tA, tB] = await Promise.all([lectura(A0.c), lectura(B0.c), versoTokens(A0.c, A0.cap, A0.v), versoTokens(B0.c, B0.cap, B0.v)]);
        const vsA = lA.caps[A0.cap] || [], vsB = lB.caps[B0.cap] || [];
        const LA = vsA.find((x) => x.v === A0.v) || vsA[0];
        const LB = vsB.find((x) => x.v === B0.v) || vsB[0];
        if (LA) A0.v = LA.v; if (LB) B0.v = LB.v;
        const bA = libroDe(A0.c), bB = libroDe(B0.c);
        const setLA = new Set(tA.map((t) => t[1])), setLB = new Set(tB.map((t) => t[1]));
        const raizDe = (li) => (LX && LX.F && LX.F[li] != null ? LX.F[li] : li);
        const setRA = new Set(tA.map((t) => raizDe(t[1]))), setRB = new Set(tB.map((t) => raizDe(t[1])));
        const lemasCom = [...setLA].filter((li) => setLB.has(li));
        const raicesCom = [...setRA].filter((r) => setRB.has(r) && !lemasCom.some((li) => raizDe(li) === r));
        const union = new Set([...setLA, ...setLB]).size || 1;
        const afin = Math.round((100 * (lemasCom.length + raicesCom.length * 0.6)) / union);
        const fichaPal = h("div", { class: "sn-ficha", hidden: true });
        const aplicarFoco = () => {
          for (const bt of zonaGrid.querySelectorAll(".sn-w")) {
            const on = focoClave && (bt.dataset.l === focoClave || bt.dataset.r === focoClave);
            bt.classList.toggle("foco", !!on);
          }
          for (const ch of zonaRes.querySelectorAll(".sn-chip")) ch.setAttribute("aria-pressed", String(ch.dataset.k === focoClave));
          if (!focoClave) { fichaPal.hidden = true; return; }
          const esR = focoClave.startsWith("r:");
          const id = +focoClave.slice(2);
          fichaPal.hidden = false;
          fichaPal.replaceChildren(
            h("span", {}, h("b", { lang: "grc", text: lemaCorto(id) }), " · ", tlCorta(id), glosaBreve(id) ? " — «" + glosaBreve(id) + "»" : ""),
            h("div", { class: "sn-acc" },
              h("a", { class: "btn chico", href: esR ? "#/raiz/" + id : "#/lema/" + id }, svg(esR ? ICO.raiz : ICO.lista), h("span", { text: esR ? "Ver raíz" : "Ver concordancia" })),
              h("a", { class: "btn chico oro", href: "#/constelacion?" + (esR ? "raiz=" : "lema=") + id }, svg(ICO.constelacion), h("span", { text: "Constelación" }))));
        };
        const toggleFoco = (k) => { focoClave = focoClave === k ? null : k; aplicarFoco(); };
        const colDe = (ref, b, L, toks, otro) => h("article", { class: "sn-col" },
          crearSelector(ref, () => { focoClave = null; actualizarUrl(); cargarPar(); }),
          h("div", { class: "sn-ref-h" },
            h("b", { text: refCorta(b, ref.cap, ref.v) }),
            h("a", { href: "#/" + b.c + "/" + ref.cap + "/l/" + ref.v, text: "Abrir en el lector ›" })),
          L ? h("p", { class: "sn-es" }, txtVerso(L)) : h("p", { class: "nota-ui", text: "Verso no encontrado." }),
          h("div", { class: "sn-gr" }, toks.map((t) => {
            const li = t[1], r = raizDe(li);
            const esCom = otro.lemas.has(li), esRz = !esCom && otro.raices.has(r);
            const tr = T.TR[t[3] || 0] || glosaBreve(li) || "";
            return h("button", {
              type: "button",
              class: "sn-w" + (esCom ? " comun" : esRz ? " raiz" : ""),
              "data-l": "l:" + li,
              "data-r": "r:" + r,
              title: lemaCorto(li) + " (" + tlCorta(li) + ")",
              onclick: () => toggleFoco(esRz ? "r:" + r : "l:" + li),
            }, h("span", { lang: "grc", text: T.F[t[0]] }), tr ? h("small", { text: tr }) : null);
          })));
        const guardarPar = () => {
          const st = leerEstudio();
          const k = A0.c + "." + A0.cap + "." + A0.v + "_" + B0.c + "." + B0.cap + "." + B0.v;
          st.pares[k] = { id: k, t: Date.now(), a: Object.assign({}, A0), b: Object.assign({}, B0) };
          guardarEstudio(st);
          avisar("Par sinóptico guardado en tu diario de estudio");
        };
        zonaRes.replaceChildren(
          h("div", { class: "sn-res-cab" },
            h("strong", { text: fmt(lemasCom.length) + (lemasCom.length === 1 ? " lema compartido" : " lemas compartidos") + (raicesCom.length ? " · " + fmt(raicesCom.length) + (raicesCom.length === 1 ? " raíz común" : " raíces comunes") : "") }),
            h("span", { class: "sn-af-pct", text: Math.min(100, afin) + " % afinidad léxica" })),
          h("div", { class: "sn-bar", "aria-hidden": "true" }, h("i", { style: "width:" + Math.min(100, afin) + "%" })),
          (lemasCom.length || raicesCom.length)
            ? h("div", { class: "sn-chips" },
                ...lemasCom.map((li) => h("button", { type: "button", class: "sn-chip", "data-k": "l:" + li, "aria-pressed": "false", onclick: () => toggleFoco("l:" + li) }, h("span", { lang: "grc", text: lemaCorto(li) }), h("small", { text: tlCorta(li) }))),
                ...raicesCom.map((r) => h("button", { type: "button", class: "sn-chip rz", "data-k": "r:" + r, "aria-pressed": "false", onclick: () => toggleFoco("r:" + r) }, h("span", { lang: "grc", text: lemaCorto(r) }), h("small", { text: "raíz" }))))
            : h("p", { class: "nota-ui", text: "Estos dos versos no comparten lemas ni raíces griegas directas; toca cualquier palabra para consultar su lema." }),
          fichaPal,
          h("div", { class: "sn-acc" },
            h("button", { class: "btn chico", type: "button", onclick: () => { const tmp = A0; A0 = B0; B0 = tmp; focoClave = null; actualizarUrl(); cargarPar(); } }, svg(ICO.sinopsis), h("span", { text: "Intercambiar" })),
            h("button", { class: "btn chico oro", type: "button", onclick: guardarPar }, svg(ICO.marcador), h("span", { text: "Guardar en mi diario" }))));
        zonaGrid.replaceChildren(
          colDe(A0, bA, LA, tA, { lemas: setLB, raices: setRB }),
          colDe(B0, bB, LB, tB, { lemas: setLA, raices: setRA }));
        aplicarFoco();
      } catch (e) {
        zonaRes.replaceChildren(fallo("No se pudieron cargar los versos seleccionados."));
      }
    };
    vista().replaceChildren(h("div", { class: "in" }, h("section", { class: "panel sn-pag" },
      barraVolver(),
      h("div", { class: "panel-cab" },
        h("span", { class: "eyebrow", text: "Comparación griega palabra por palabra" }),
        h("h1", { class: "texto", text: "Mesa sinóptica libre" }),
        h("p", { class: "q-lead", text: "Elige dos versos cualesquiera de la Nueva Voluntad: los lemas compartidos brillan en oro y las raíces comunes en azul. Toca cualquier palabra o ficha para iluminarla en ambos pasajes." })),
      guiaSeccion("sinopsis"),
      presets,
      zonaRes,
      zonaGrid)));
    cargarPar();
  }

  // --- Pulso del texto al cerrar cada capítulo (.ps-cap, carga perezosa al acercarse al pie)
  function bloquePulsoCapitulo(b, cap) {
    const sub = h("small", { text: "Toca para ver las 5 raíces clave, joyas singulares y tiempos verbales de " + nombreLibro(b) + " " + cap });
    const cuerpo = h("div", { class: "ps-cuerpo" }, h("p", { class: "nota-ui", text: "Analizando el pulso léxico del capítulo…" }));
    const det = h("details", { class: "ps-cap" },
      h("summary", {},
        h("span", { class: "ps-sum-l" }, svg(ICO.constelacion), h("span", { class: "ps-sum-t" }, h("b", { text: "Pulso léxico del capítulo" }), sub)),
        h("span", { class: "ps-sum-r" }, h("span", { text: "Ver análisis" }), svg(ICO.abajo))),
      cuerpo);
    let listo = false;
    const cargarPulso = async () => {
      if (listo || !det.isConnected) return;
      listo = true;
      try {
        const [A] = await Promise.all([analisis(b.c), tablas(), lexico()]);
        if (!det.isConnected) return;
        const vs = (A && A.caps && A.caps[cap]) || [];
        const rzCnt = new Map(), raras = new Map();
        const verb = { aor: 0, pres: 0, part: 0, imp: 0, otros: 0 };
        let totTok = 0;
        for (const [, toks] of vs) {
          for (const t of toks) {
            totTok++;
            const li = t[1], cl = T.MC[t[2]], m = T.P[t[2]] || {};
            if (esRara(t) && !raras.has(li)) raras.set(li, T.LN[li]);
            if (cl === "V") {
              if (m.mood === "M") verb.imp++;
              else if (m.mood === "P" || m.mood === "R") verb.part++;
              else if (m.tense === "A") verb.aor++;
              else if (m.tense === "P") verb.pres++;
              else verb.otros++;
            }
            if (cl === "V" || cl === "N" || cl === "A") {
              const r = LX && LX.F && LX.F[li] != null ? LX.F[li] : li;
              if (!CN_STOP_GR.has(claveGr(lemaCorto(r)))) rzCnt.set(r, (rzCnt.get(r) || 0) + 1);
            }
          }
        }
        const topRz = [...rzCnt.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
        const maxRz = Math.max(1, topRz[0] ? topRz[0][1] : 1);
        const topRaras = [...raras.entries()].sort((a, b) => a[1] - b[1]).slice(0, 6);
        const vTot = verb.aor + verb.pres + verb.part + verb.imp + verb.otros;
        sub.textContent = fmt(totTok) + " palabras griegas · " + (topRaras.length ? fmt(topRaras.length) + (topRaras.length === 1 ? " joya singular" : " joyas singulares") : "vocabulario consolidado") + (topRz[0] ? " · raíz líder: " + tlCorta(topRz[0][0]) : "");
        const colRz = h("div", { class: "ps-blk" },
          h("h4", { text: "Raíces que pulsan en este capítulo" }),
          topRz.length ? h("ul", { class: "ps-raices" }, topRz.map(([r, n]) => h("li", {},
            h("div", { class: "ps-rz-top" },
              h("a", { href: "#/raiz/" + r }, h("span", { lang: "grc", text: lemaCorto(r) }), h("small", { text: tlCorta(r) + (glosaBreve(r) ? " · " + glosaBreve(r) : "") })),
              h("em", { text: fmt(n) + "×" })),
            h("div", { class: "ps-bar", "aria-hidden": "true" }, h("i", { style: "width:" + (100 * n / maxRz).toFixed(1) + "%" })))))
            : h("p", { class: "nota-ui", text: "Capítulo breve sin repetición de raíces conceptuales." }));
        const colRaras = h("div", { class: "ps-blk" },
          h("h4", { text: "Joyas singulares (≤ 3 veces en la Nueva Voluntad)" }),
          topRaras.length ? h("div", { class: "ps-raras" }, topRaras.map(([li, n]) => h("a", { class: "ps-rara", href: "#/lema/" + li },
            h("strong", { lang: "grc", text: lemaCorto(li) }),
            h("span", { text: tlCorta(li) + (glosaBreve(li) ? " · " + glosaBreve(li) : "") }),
            h("small", { text: n === 1 ? "única vez en la Nueva Voluntad" : fmt(n) + " veces en la Nueva Voluntad" }))))
            : h("p", { class: "nota-ui", text: "Todas las palabras de este capítulo aparecen más de 3 veces en la Nueva Voluntad." }));
        const segsV = [
          ["Aoristo", verb.aor, "#e2a452"],
          ["Presente", verb.pres, "#6ea8e8"],
          ["Participios", verb.part, "#6fd4a4"],
          ["Imperativos", verb.imp, "#e07a68"],
          ["Otros tiempos", verb.otros, "#b586ea"],
        ].filter((x) => x[1] > 0);
        const bloqV = vTot ? h("div", { class: "ps-verb" },
          h("h4", { style: "margin:0;font:600 .68rem/1.2 var(--f-ui);letter-spacing:.14em;text-transform:uppercase;color:var(--oro)", text: "Pulso verbal (" + fmt(vTot) + " verbos)" }),
          h("div", { class: "ps-vbar", "aria-hidden": "true" }, segsV.map(([, n, col]) => h("i", { style: "width:" + (100 * n / vTot).toFixed(1) + "%;background:" + col }))),
          h("div", { class: "ps-vley" }, segsV.map(([et, n, col]) => h("span", {}, h("i", { style: "background:" + col }), et + ": " + fmt(n))))) : null;
        cuerpo.replaceChildren(
          h("div", { class: "ps-grid" }, colRz, colRaras),
          bloqV,
          h("div", { class: "ps-pie" },
            h("a", { class: "btn chico oro", href: topRz[0] ? "#/constelacion?raiz=" + topRz[0][0] : "#/constelacion?capa=refs&libro=" + b.c }, svg(ICO.constelacion), h("span", { text: "Ver en Constelación" })),
            h("a", { class: "btn chico", href: "#/sinopsis/" + b.c + "." + cap + ".1" }, svg(ICO.sinopsis), h("span", { text: "Comparar en Sinopsis" }))));
      } catch (e) { cuerpo.replaceChildren(h("p", { class: "nota-ui", text: "No se pudo calcular el pulso léxico de este capítulo." })); }
    };
    det.addEventListener("toggle", () => { if (det.open) cargarPulso(); });
    if (window.IntersectionObserver) {
      const io = new IntersectionObserver((es) => { if (es[0] && es[0].isIntersecting) { io.disconnect(); cargarPulso(); } }, { rootMargin: "240px" });
      requestAnimationFrame(() => { if (det.isConnected) io.observe(det); });
    }
    return det;
  }

  // --- Tarjetas compartibles HD 3× (1080 × 1350 px en <canvas> puro estilo códice BiEx)
  function vistaTarjetaVerso({ b, cap, v, L, toks }) {
    const TEMAS_TC = {
      obsidiana: { nom: "Obsidiana y Oro", bg1: "#0c0b09", bg2: "#050506", halo: "rgba(218,176,96,.18)", marco: "#d0af6b", tinta: "#f6f0e4", tenue: "#d7c9ae", oro: "#f4dea8", sw: "#0a0a0c" },
      pergamino: { nom: "Pergamino", bg1: "#fbf6ea", bg2: "#efe6d3", halo: "rgba(166,120,38,.14)", marco: "#8e6a26", tinta: "#16120c", tenue: "#544838", oro: "#7a5718", sw: "#f5efe0" },
      zafiro: { nom: "Zafiro Nocturno", bg1: "#0c1424", bg2: "#060912", halo: "rgba(110,164,232,.2)", marco: "#c8aa68", tinta: "#f4f6fb", tenue: "#b8c5dc", oro: "#f2dba3", sw: "#0d1628" },
    };
    return () => {
      let tema = "obsidiana", conGriego = true, amplio = false, griegoTxt = "";
      const cv = h("canvas", { class: "tc-canvas", width: "1080", height: "1350", "aria-label": "Vista previa de la tarjeta compartible HD" });
      const textoLimpio = L ? textoPlano((txtVerso(L).textContent || "").replace(/\s+/g, " ").trim()) : "";
      const refTit = nombreLibro(b) + " " + cap + ":" + v;
      const dividir = (ctx, txt, maxW) => {
        const pals = String(txt || "").split(/\s+/).filter(Boolean), ls = [];
        let act = "";
        for (const p of pals) {
          const pr = act ? act + " " + p : p;
          if (ctx.measureText(pr).width > maxW && act) { ls.push(act); act = p; }
          else act = pr;
        }
        if (act) ls.push(act);
        return ls;
      };
      const pintarCard = async () => {
        try { if (document.fonts && document.fonts.ready) await document.fonts.ready; } catch (e) {}
        if (!cv.isConnected) return;
        const ctx = cv.getContext("2d"); if (!ctx) return;
        const W = 1080, H = 1350, P = TEMAS_TC[tema] || TEMAS_TC.obsidiana;
        // Fondo y halos
        const bg = ctx.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, P.bg1); bg.addColorStop(1, P.bg2);
        ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
        const hl = ctx.createRadialGradient(W * 0.5, H * 0.24, 20, W * 0.5, H * 0.28, 620);
        hl.addColorStop(0, P.halo); hl.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = hl; ctx.fillRect(0, 0, W, H);
        // Marco doble de códice + rombos geométricos en las 4 esquinas (cero cruces/estrellas/rayos)
        ctx.strokeStyle = P.marco; ctx.globalAlpha = 0.58; ctx.lineWidth = 2.5;
        ctx.strokeRect(54, 54, W - 108, H - 108);
        ctx.globalAlpha = 0.25; ctx.lineWidth = 1.4;
        ctx.strokeRect(72, 72, W - 144, H - 144);
        ctx.globalAlpha = 0.82; ctx.fillStyle = P.oro;
        for (const [cx, cy] of [[63, 63], [W - 63, 63], [63, H - 63], [W - 63, H - 63]]) {
          ctx.beginPath(); ctx.moveTo(cx, cy - 11); ctx.lineTo(cx + 11, cy); ctx.lineTo(cx, cy + 11); ctx.lineTo(cx - 11, cy); ctx.closePath(); ctx.fill();
        }
        ctx.globalAlpha = 1;
        // Cabecera («BiEx» siempre como primera palabra)
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.font = "500 24px 'BiEx Interfaz', system-ui, -apple-system, sans-serif";
        ctx.fillStyle = P.oro;
        ctx.fillText("B i E x   ·   B I B L I A   E X A C T A", W / 2, 148);
        ctx.globalAlpha = 0.45; ctx.strokeStyle = P.marco; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(W / 2 - 140, 188); ctx.lineTo(W / 2 + 140, 188); ctx.stroke();
        ctx.globalAlpha = 1;
        // Cálculo de bloques centrados verticalmente
        const maxW = W - 210;
        let grLs = [], grFs = 33;
        if (conGriego && griegoTxt) {
          ctx.font = "400 " + grFs + "px 'BiEx Texto', 'Gentium Plus', Georgia, serif";
          grLs = dividir(ctx, griegoTxt, maxW).slice(0, 5);
        }
        let fs = amplio ? 54 : 47;
        if (textoLimpio.length > 260) fs -= 8;
        else if (textoLimpio.length > 170) fs -= 5;
        ctx.font = "400 " + fs + "px 'BiEx Texto', Georgia, serif";
        let esLs = dividir(ctx, "«" + textoLimpio + "»", maxW);
        while (esLs.length > 11 && fs > 28) {
          fs -= 3;
          ctx.font = "400 " + fs + "px 'BiEx Texto', Georgia, serif";
          esLs = dividir(ctx, "«" + textoLimpio + "»", maxW);
        }
        const grH = grLs.length ? grLs.length * (grFs * 1.48) + 46 : 0;
        const esH = esLs.length * (fs * 1.46);
        let y = Math.max(255, (H - 170 - (grH + esH + 115)) / 2 + 86);
        if (grLs.length) {
          ctx.font = "400 " + grFs + "px 'BiEx Texto', 'Gentium Plus', Georgia, serif";
          ctx.fillStyle = P.tenue; ctx.globalAlpha = 0.9;
          for (const ln of grLs) { ctx.fillText(ln, W / 2, y); y += grFs * 1.48; }
          ctx.globalAlpha = 1;
          y += 22;
          ctx.fillStyle = P.oro; ctx.beginPath(); ctx.moveTo(W / 2, y - 6); ctx.lineTo(W / 2 + 6, y); ctx.lineTo(W / 2, y + 6); ctx.lineTo(W / 2 - 6, y); ctx.closePath(); ctx.fill();
          y += 42;
        }
        ctx.font = "400 " + fs + "px 'BiEx Texto', Georgia, serif";
        ctx.fillStyle = P.tinta;
        for (const ln of esLs) { ctx.fillText(ln, W / 2, y); y += fs * 1.46; }
        // Referencia oficial BiEx
        y += 38;
        ctx.font = "600 38px 'BiEx Titular', 'BiEx Texto', Georgia, serif";
        ctx.fillStyle = P.oro;
        ctx.fillText("— " + refTit, W / 2, Math.min(H - 186, y));
        // Línea ornamental y pie de marca
        ctx.globalAlpha = 0.34; ctx.strokeStyle = P.marco; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(W / 2 - 180, H - 146); ctx.lineTo(W / 2 + 180, H - 146); ctx.stroke();
        ctx.font = "400 21px 'BiEx Interfaz', system-ui, -apple-system, sans-serif";
        ctx.fillStyle = P.tenue; ctx.globalAlpha = 0.8;
        ctx.fillText("La Nueva Voluntad del griego al español, palabra por palabra · bibliaexacta.pages.dev", W / 2, H - 112);
        ctx.globalAlpha = 1;
      };
      const obtenerBlob = () => new Promise((ok) => cv.toBlob((bl) => ok(bl), "image/png", 1));
      const descargarPng = async () => {
        const bl = await obtenerBlob(); if (!bl) return;
        const a = h("a", { href: URL.createObjectURL(bl), download: "biex-" + b.c.toLowerCase() + "-" + cap + "-" + v + ".png" });
        document.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
        avisar("Tarjeta HD (1080 × 1350) descargada");
      };
      const compartirPng = async () => {
        const bl = await obtenerBlob(); if (!bl) return;
        try {
          const arch = new File([bl], "biex-" + b.c.toLowerCase() + "-" + cap + "-" + v + ".png", { type: "image/png" });
          if (navigator.canShare && navigator.canShare({ files: [arch] })) {
            await navigator.share({ title: refTit + " · BiEx", text: "«" + textoLimpio + "» — " + refTit, files: [arch] });
            return;
          }
        } catch (e) { if (e && e.name === "AbortError") return; }
        descargarPng();
      };
      const botonesTema = h("div", { class: "tc-temas", role: "group", "aria-label": "Acabado de la tarjeta" },
        Object.entries(TEMAS_TC).map(([k, d]) => h("button", { type: "button", class: "tc-tema", "aria-pressed": String(k === tema), onclick: (ev) => {
          tema = k;
          for (const bt of botonesTema.children) bt.setAttribute("aria-pressed", String(bt === ev.currentTarget));
          pintarCard();
        } }, h("i", { style: "background:" + d.sw }), h("span", { text: d.nom }))));
      const chkGr = h("input", { type: "checkbox", checked: conGriego, onchange: () => { conGriego = chkGr.checked; pintarCard(); } });
      const chkAmp = h("input", { type: "checkbox", checked: amplio, onchange: () => { amplio = chkAmp.checked; pintarCard(); } });
      const cargarGr = async () => {
        try {
          const ts = toks || (await versoTokens(b.c, cap, v));
          if (ts && ts.length && T) griegoTxt = ts.map((t) => T.F[t[0]] + (t[4] || "")).join(" ");
        } catch (e) {}
        pintarCard();
      };
      requestAnimationFrame(cargarGr);
      return cajaModal(cabModal("Tarjeta compartible HD", refTit + " · 1080 × 1350 px"),
        h("div", { class: "tc-wrap" },
          h("div", { class: "tc-prev-box" }, cv),
          botonesTema,
          h("div", { class: "tc-ops" },
            h("label", {}, chkGr, h("span", { text: "Incluir griego originario" })),
            h("label", {}, chkAmp, h("span", { text: "Letra más amplia" }))),
          h("div", { class: "tc-acc" },
            h("button", { class: "btn oro", type: "button", onclick: descargarPng }, svg(ICO.descargar), h("span", { text: "Descargar PNG HD" })),
            h("button", { class: "btn", type: "button", onclick: compartirPng }, svg(ICO.compartir), h("span", { text: "Compartir imagen" })))));
    };
  }

  // --- Consejos para principiantes por sección + Faro pulsante discreto de pendientes (PR #14–#17)
  const FARO_TIPS = [
    // Lectura general
    { sec: "lectura", t: "Griego al toque", d: "No necesitas saber griego: toca cualquier verso mientras lees para ver cada palabra traducida, cómo se pronuncia y su significado exacto." },
    { sec: "lectura", t: "Tres formas de leer", d: "Arriba del capítulo puedes alternar entre Lectura (párrafos limpios), Textual (verso a verso) y Análisis (cada palabra griega desglosada)." },
    { sec: "lectura", t: "Modo Contemplar", d: "Toca el ícono del ojo en la barra del capítulo para ocultar botones y leer con calma, como en una hoja impresa sin distracciones." },
    { sec: "lectura", t: "Marcadores en 12 colores", d: "Resalta versos por tema (promesas, fe, historia, preguntas…) y guarda notas propias: todo se reúne en tu Diario sincronizado." },
    { sec: "lectura", t: "Tarjetas HD para compartir", d: "Dentro de cualquier verso pulsa «Tarjeta HD» para generar una imagen nítida con el texto de BiEx y su griego originario." },
    { sec: "lectura", t: "Compara con Jünemann", d: "El ícono del rollo junto al título del capítulo abre la perícopa en la traducción clásica de Jünemann para contrastarla al instante." },
    // Análisis palabra por palabra
    { sec: "analisis", t: "Qué estás viendo aquí", d: "Cada tarjeta es una palabra del texto griego originario en su orden real. Toca cualquiera para ver su traducción literal, su raíz y dónde más aparece." },
    { sec: "analisis", t: "Colores que guían la lectura", d: "Los colores agrupan verbos, nombres y adjetivos. En «Color» y «Resaltar» puedes iluminar solo las acciones, los tiempos verbales o los casos." },
    { sec: "analisis", t: "Lentes a tu medida", d: "Si ves demasiada información a la vez, apaga «Transliteración» o «Morfología» arriba para quedarte solo con el griego y el español." },
    // Línea del tiempo / Cronología
    { sec: "cronologia", t: "Orden en que se escribieron", d: "Los libros de la Nueva Voluntad no se redactaron en el orden habitual de la Biblia: aquí los ves según cuándo fueron escritos y los hechos que narran." },
    { sec: "cronologia", t: "Explora cada hito", d: "Usa los filtros de arriba para centrarte en la vida de YēshŪ́aʿ, los primeros viajes o las cartas, y toca cualquier evento para saltar directo al pasaje." },
    // La fuente Q
    { sec: "fuente-q", t: "¿Qué es la fuente Q?", d: "Mattáy y Lουκᾶς comparten más de 200 versos casi iguales que no están en Μᾶrκος. Muchos estudiosos llaman «Q» a esa posible colección compartida." },
    { sec: "fuente-q", t: "Colores de coincidencia", d: "En la comparativa, los tonos dorados muestran palabras griegas idénticas y en el mismo orden; así puedes ver por ti mismo el parecido real." },
    // Constelación del léxico
    { sec: "constelacion", t: "Un mapa vivo de conexiones", d: "Cada estrella es una raíz griega, una palabra o un libro. Toca cualquiera para iluminar sus vínculos y leer abajo qué significa." },
    { sec: "constelacion", t: "Cómo moverte sin esfuerzo", d: "Arrastra el mapa con un dedo o el ratón, acerca con dos dedos o con + y −, y cambia de capa arriba entre Léxico, Referencias y Tus notas." },
    { sec: "constelacion", t: "Busca en español o griego", d: "En el buscador de arriba puedes escribir una palabra en español, una transliteración (como «agape» o «logos») o un libro para centrarlo." },
    // Mesa sinóptica libre
    { sec: "sinopsis", t: "Compara dos pasajes a la vez", d: "Elige dos versos cualesquiera o toca uno de los ejemplos de arriba: las palabras con el mismo lema griego brillan en oro y las de la misma raíz en azul." },
    { sec: "sinopsis", t: "Ilumina una palabra en ambos", d: "Toca cualquier ficha dorada o palabra griega para ver dónde reaparece en el otro pasaje, abrir su concordancia o guardar el par en tu diario." },
    // Atlas bíblico
    { sec: "mapa", t: "Capas históricas vivas", d: "Cambia arriba entre el mapa completo, la vida de YēshŪ́aʿ, los viajes de Pαῦlος [Pablo] o las 7 convocaciones fuera [asambleas] de Ἀpοκάlυpsις; cada punto abre sus pasajes." },
    { sec: "mapa", t: "Tu progreso en el mapa", d: "Los puntos en verde señalan lugares cuyos versos ya marcaste como leídos. Pellizca con dos dedos o usa + y − para acercarte." },
    // Repaso de raíces · 1 min
    { sec: "repaso", t: "Un minuto que fija familias enteras", d: "Cada tarjeta muestra una raíz griega de la Nueva Voluntad. Al evaluar si la recordaste, el sistema espaciado programa su próximo repaso en 1, 2, 4, 8 o 16 días." },
    { sec: "repaso", t: "Sincronizado con tu cuenta", d: "Tus cajas de repaso se guardan en tu dispositivo y se sincronizan con la nube al entrar en Escudriña, para continuar desde cualquier pantalla." },
    // Escudriña › Hoy
    { sec: "escudrina", t: "Aprender leyendo a tu ritmo", d: "Al leer un capítulo en BiEx y tocar «Leído» cuando termines un verso, sumas experiencia, dracmas y avanzas tus misiones sin presión." },
    { sec: "escudrina", t: "Misiones diarias sencillas", d: "Cada día tienes metas breves (leer unos versos o responder una prueba). Si un día no puedes entrar, tu avance y tu cuenta permanecen intactos." },
    // Escudriña › Tu Árbol
    { sec: "arbol", t: "Tu ser interior y la cosecha", d: "Reparte tus puntos de atributo libres para subir poder y recoge tu cesta de la cosecha cuando se llene: trae experiencia y un verso especial." },
    { sec: "arbol", t: "Las ramas de tu árbol", d: "En «Las ramas» puedes pellizcar con dos dedos o usar + y − para acercarte a quienes llegaron gracias a tu enlace, sin cambiar el tamaño de la página." },
    // Escudriña › El Coloso
    { sec: "coloso", t: "Lee la postura del Coloso", d: "Antes de atacar, mira la brecha que anuncia arriba: usar una habilidad alineada y acertar la zona dorada del Pulso multiplica tu aporte." },
    { sec: "coloso", t: "Un esfuerzo en comunidad", d: "Todos los lectores debilitan juntos al mismo Coloso durante la incursión. Tus cargas se recargan leyendo y cada golpe queda registrado." },
    // Escudriña › Ajedrez Bíblico
    { sec: "ajedrez", t: "Dos modos para entrenar la mente", d: "Enfrenta a 13 figuras bíblicas con dificultad progresiva o resuelve los Enigmas del Códice (que se abren tras leer 5 versos hoy)." },
    { sec: "ajedrez", t: "Pausa cuando quieras", d: "Cada jugada se guarda automáticamente en caché: puedes salir a leer un capítulo y volver después exactamente en el mismo movimiento." },
    // Planes, Juntos y App
    { sec: "planes", t: "Planes cronológicos guiados", d: "Elige un recorrido de 30, 90 días o un año para leer la Nueva Voluntad en orden cronológico y marca cada jornada a tu propio ritmo." },
    { sec: "juntos", t: "Leer acompañado en vivo", d: "Crea una sala en Escudriña › Juntos o únete a una abierta para recorrer el mismo capítulo con otros lectores y ganar experiencia adicional." },
    { sec: "app", t: "Lectura sin internet y avisos", d: "Desde aquí puedes guardar toda la Nueva Voluntad en tu dispositivo para leer sin conexión y activar avisos cuando haya eventos o misiones." },
  ];
  // PR #19 · Historial de consejos (máximo 2 impresiones por consejo en una ventana de 15 días) + consejos replegados por defecto
  const GUIA_HIST = (() => {
    const VENTANA_MS = 15 * 86400e3;
    const idDe = (tp) => (tp ? tp.sec + ":" + tp.t : "");
    const leer = () => {
      const raw = store.get("guiaHist", null);
      const limpio = {}, lim = Date.now() - VENTANA_MS;
      if (raw && typeof raw === "object") {
        for (const [k, arr] of Object.entries(raw)) {
          if (!Array.isArray(arr)) continue;
          const ok = arr.filter((ts) => typeof ts === "number" && ts > lim);
          if (ok.length) limpio[k] = ok;
        }
      }
      return limpio;
    };
    const vistas = (tp, hist) => ((hist || leer())[idDe(tp)] || []).length;
    const registrar = (tp) => {
      if (!tp) return;
      const hist = leer(), id = idDe(tp);
      const arr = (hist[id] || []).slice();
      arr.push(Date.now());
      hist[id] = arr.slice(-4);
      store.set("guiaHist", hist);
    };
    const elegir = (cands, evitarId) => {
      const hist = leer();
      const disp = cands.filter((tp) => vistas(tp, hist) < 2);
      if (!disp.length) return null;
      const pool = disp.length > 1 && evitarId ? disp.filter((tp) => idDe(tp) !== evitarId) : disp;
      const pref0 = pool.filter((tp) => vistas(tp, hist) === 0);
      const base = pref0.length ? pref0 : pool;
      return base[(Math.floor(Date.now() / 180000) + base.length) % base.length];
    };
    return { idDe, leer, vistas, registrar, elegir };
  })();
  if (navigator.webdriver) window.__biexGuiaHist = GUIA_HIST;
  function guiaSeccion(sec) {
    const off = store.get("guiasOff", null) || {};
    if (off[sec]) return null;
    const lista = FARO_TIPS.filter((x) => x.sec === sec);
    let actual = GUIA_HIST.elegir(lista, null);
    if (!actual) return null;
    let contado = false;
    const sumTit = h("span", { class: "guia-ctx-tit" });
    const descEl = h("p", { class: "guia-ctx-t" });
    const bOtro = h("button", { type: "button", title: "Ver otro consejo de esta sección", text: "Otro ↻" });
    const pintar = () => {
      sumTit.replaceChildren(h("b", { text: "Consejo · " }), actual.t);
      descEl.textContent = actual.d;
      const hayMas = !!GUIA_HIST.elegir(lista, GUIA_HIST.idDe(actual));
      bOtro.hidden = !hayMas;
    };
    bOtro.onclick = (e) => {
      e.preventDefault(); e.stopPropagation();
      const sig = GUIA_HIST.elegir(lista, GUIA_HIST.idDe(actual));
      if (!sig) { bOtro.hidden = true; return; }
      actual = sig;
      GUIA_HIST.registrar(actual);
      contado = true;
      pintar();
    };
    pintar();
    const caja = h("details", { class: "guia-ctx" },
      h("summary", { "aria-label": "Desplegar consejo útil de esta sección" },
        h("i", { "aria-hidden": "true" }),
        sumTit,
        h("span", { class: "guia-ctx-chev", "aria-hidden": "true" }, "Leer ", h("b", { text: "▾" }))),
      h("div", { class: "guia-ctx-cuerpo" },
        descEl,
        h("div", { class: "guia-ctx-acc" },
          bOtro,
          h("button", { type: "button", title: "Ocultar consejos en esta sección", "aria-label": "Ocultar consejos en esta sección", onclick: (e) => {
            e.preventDefault(); e.stopPropagation();
            const cur = Object.assign({}, store.get("guiasOff", null) || {});
            cur[sec] = 1; store.set("guiasOff", cur);
            caja.remove();
          } }, "Ocultar"))));
    caja.addEventListener("toggle", () => {
      if (caja.open && !contado) {
        GUIA_HIST.registrar(actual);
        contado = true;
        pintar();
      }
    });
    return caja;
  }
  const FARO = {
    btn: null,
    cnt: null,
    tipIdx: -1,
    focoTimer: 0,
    ubicarTimer: 0,
    ubicarTimer2: 0,
    pendientes() {
      const out = [];
      const hoy = new Date().toISOString().slice(0, 10);
      // 1) Plan de lectura activo con día pendiente
      try {
        const ep = estPlanes();
        if (ep.act && D) {
          const pl = planDe(ep.act);
          if (pl) {
            const ds = diasPlan(pl), hechos = new Set(ep.hechos[pl.id] || []);
            const sig = ds.findIndex((_, i) => !hechos.has(i));
            const hoyHecho = Object.values(ep.fechas || {}).some((f) => String(f || "").slice(0, 10) === hoy);
            if (sig >= 0 && !hoyHecho) {
              const pri = ds[sig] && ds[sig][0];
              out.push({
                t: "Lectura de hoy en tu plan",
                d: pl.t + " · día " + (sig + 1) + " de " + ds.length,
                accion: "Abrir plan",
                href: pri ? "#/" + pri.c + "/" + pri.cap : "#/planes/" + pl.id,
                foco: pri ? ".hoja" : ".plan-hoy",
                col: "#e8cf94",
              });
            }
          }
        }
      } catch (e) {}
      // 2) Partida de Ajedrez Bíblico guardada en caché por retomar
      try {
        const part = store.get("ajedrez:partida", null);
        if (part && part.fen && !part.fin && part.rivalNom) {
          out.push({
            t: "Partida de Ajedrez en pausa",
            d: "Frente a " + part.rivalNom + " · jugada " + Math.max(1, Math.ceil((part.hist ? part.hist.length : 0) / 2)) + " guardada en caché.",
            accion: "Retomar",
            href: "#/escudrina/ajedrez",
            foco: ".aj-arena",
            col: "#c598f2",
          });
        }
      } catch (e) {}
      // 3) Datos locales cacheados de Escudriña (Coloso con cargas, cesta/verso sin leer, misiones pendientes, puntos de Árbol)
      try {
        const tk = store.get("jg:t", null);
        if (tk) {
          const col = store.get("jg:coloso_snap", null);
          if (col && col.estado === "activo" && (col.vida | 0) > 0 && (col.cargas | 0) > 0) {
            out.push({
              t: "El Coloso de la Tradición te espera",
              d: (col.cargas | 0) + (col.cargas === 1 ? " carga lista" : " cargas listas") + " para apoyar a la comunidad.",
              accion: "Ir a la arena",
              href: "#/escudrina/coloso",
              foco: ".jg-col-escena",
              col: "#e69a52",
            });
          }
          const yo = store.get("jg:yo", null);
          const ultC = store.get("jg:cestaUlt", null);
          if (ultC && ultC.c && ultC.cap && ultC.v && !ultC.hecho && D && libroDe(ultC.c)) {
            out.push({
              t: "Verso de tu cesta por leer",
              d: nombreLibro(libroDe(ultC.c)) + " " + ultC.cap + ":" + ultC.v + " te espera en La cosecha para marcarlo leído.",
              accion: "Ir a La cosecha",
              href: "#/escudrina/arbol",
              foco: "#jg-cosecha",
              col: "#e8cf94",
            });
          } else if (yo && yo.co && yo.co.lleno && Date.now() >= yo.co.lleno) {
            out.push({
              t: "Tu cesta de la cosecha está llena",
              d: "Recógela en Tu Árbol para recibir tu experiencia y un verso.",
              accion: "Recoger",
              href: "#/escudrina/arbol",
              foco: "#jg-cosecha",
              col: "#e8cf94",
            });
          }
          if (yo) {
            const rawMs = Array.isArray(yo.mis) ? yo.mis : (Array.isArray(yo.misiones) ? yo.misiones : []);
            const ms = rawMs.filter((m) => m && !m.hecha && !m.fin);
            if (ms.length) {
              const m0 = ms[0];
              const dMis = m0.titulo || m0.desc || (m0.tipo === "versos" && m0.meta ? "Leer " + m0.meta + " versos (" + (m0.prog | 0) + " de " + m0.meta + ")" : m0.tipo === "preguntas" ? "Responder una prueba al final de un capítulo." : "Suma experiencia y dracmas con tu lectura de hoy.");
              out.push({
                t: ms.length === 1 ? "1 misión del día pendiente" : ms.length + " misiones del día pendientes",
                d: dMis,
                accion: "Ir a Misiones",
                href: "#/escudrina",
                foco: "#jg-misiones",
                col: "#7eb8f0",
              });
            }
            const libres = yo.av ? ((yo.av.pts | 0) || (yo.av.libres | 0)) : 0;
            if (libres > 0) {
              out.push({
                t: libres === 1 ? "Tienes 1 punto de atributo libre" : "Tienes " + libres + " puntos de atributo libres",
                d: "Fortalece tu Ser interior y sube poder en Tu Árbol.",
                accion: "Ir a Atributos",
                href: "#/escudrina/arbol",
                foco: "#jg-atributos",
                col: "#6fd4a4",
              });
            }
          }
          // PR #17 · Aviso 48 h antes del cierre automático de la sala por inactividad (o aviso tras cierre a los 7 días)
          const sv = window.BiExJuego && window.BiExJuego.estadoSalaVence ? window.BiExJuego.estadoSalaVence() : null;
          if (sv && sv.aviso) {
            const av = sv.aviso, et = av.nom ? "«" + av.nom + "»" : "Sala " + av.cod;
            out.unshift({
              t: "Tu sala cerrará pronto por inactividad",
              d: et + " cerrará automáticamente en " + av.faltaTxt + " si sigue sin actividad (límite de 7 días).",
              accion: "Ver sala",
              href: "#/escudrina/juntos",
              foco: ".jg-sala-av",
              col: "#f0b35a",
            });
          } else if (sv && sv.vencida && sv.vencida.c) {
            const v = sv.vencida, et = v.nombre ? "«" + v.nombre + "» (" + v.c + ")" : "La sala " + v.c;
            out.unshift({
              t: "Tu sala anterior se cerró tras 7 días",
              d: et + " venció por inactividad. Puedes crear una nueva cuando quieras volver a leer en compañía.",
              accion: "Crear otra",
              href: "#/escudrina/juntos",
              foco: ".jg-sala-av",
              col: "#e8cf94",
            });
          }
        }
      } catch (e) {}
      // 3b) Repaso breve de raíces (solo si el lector ya comenzó sus cajas y tiene tarjetas vencidas hoy)
      try {
        const rep = (leerEstudio().repasoRaices) || {};
        const ahora = Date.now();
        let venc = 0;
        for (const [k, v] of Object.entries(rep)) {
          if (k === "_hoy" || !v || typeof v !== "object") continue;
          if ((+v.prox || 0) <= ahora) venc++;
        }
        const hechoHoy = rep._hoy && rep._hoy.f === hoy && (rep._hoy.n | 0) >= 6;
        if (venc > 0 && !hechoHoy) {
          out.push({
            t: venc === 1 ? "1 raíz griega lista para repasar" : venc + " raíces griegas listas para repasar",
            d: "Ronda rápida de 1 minuto con repaso espaciado.",
            accion: "Repasar",
            href: "#/raices/repaso",
            foco: ".rr-carta",
            col: "#c8a962",
          });
        }
      } catch (e) {}
      // 4) Si aún no hay pendientes de plan/Escudriña pero el lector tiene una lectura reciente sin abrir hoy
      if (!out.length) {
        try {
          const ult = store.get("ultimo", null);
          const yo = store.get("jg:yo", null);
          const leyoHoy = yo && yo.hoy && yo.hoy.f === hoy && (yo.hoy.versos | 0) > 0;
          if (ult && ult.c && D && libroDe(ult.c) && !leyoHoy && store.get("jg:t", null)) {
            out.push({
              t: "Continúa donde quedaste",
              d: nombreLibro(libroDe(ult.c)) + " " + ult.cap + (ult.v ? ":" + ult.v : "") + " · un par de versos ya suman hoy.",
              accion: "Seguir leyendo",
              href: "#/" + ult.c + "/" + ult.cap + (ult.v ? "/l/" + ult.v : ""),
              foco: ".hoja",
              col: "#e8cf94",
            });
          }
        } catch (e) {}
      }
      return out.slice(0, 5);
    },
    ubicar() {
      if (!this.btn || this.btn.hidden || !this.btn.isConnected) return;
      const vh = window.innerHeight || 800;
      let minTop = vh - 16;
      const sels = [".jg-med", ".jg-bonos", ".jg-bonos > *", ".adelante.vis", ".jg-muelle", ".jg-sala-p"];
      for (const q of sels) {
        for (const el of document.querySelectorAll(q)) {
          if (!el.isConnected || el.hidden) continue;
          const r = el.getBoundingClientRect();
          if (r.width < 2 || r.height < 2 || r.bottom < vh * 0.4) continue;
          const cs = getComputedStyle(el);
          if (cs.display === "none" || cs.visibility === "hidden") continue;
          // No omitir .jg-med/.jg-bonos/.jg-muelle durante su transición de entrada (evita solapamiento con el Faro)
          const siempreReserva = el.matches(".jg-med, .jg-bonos, .jg-bonos > *, .jg-muelle, .jg-sala-p");
          if (!siempreReserva && parseFloat(cs.opacity) < 0.05) continue;
          if (r.left < 110) minTop = Math.min(minTop, r.top);
        }
      }
      const bPx = Math.max(16, Math.min(vh - 96, Math.round(vh - minTop + 14)));
      this.btn.style.setProperty("--faro-b", "calc(" + bPx + "px + env(safe-area-inset-bottom, 0px))");
    },
    enfocar(selector) {
      if (!selector) return;
      clearTimeout(this.focoTimer);
      let intentos = 0;
      const buscar = () => {
        const el = document.querySelector(selector);
        if (el && el.isConnected && el.getBoundingClientRect().height > 10) {
          const sinA = ap.mov === "no" || (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
          const y = Math.max(0, window.scrollY + el.getBoundingClientRect().top - Math.max(76, window.innerHeight * 0.14));
          try { window.scrollTo({ top: y, behavior: sinA ? "instant" : "smooth" }); } catch (e) { window.scrollTo(0, y); }
          el.classList.remove("faro-resaltar");
          void el.offsetWidth;
          el.classList.add("faro-resaltar");
          setTimeout(() => el.classList.remove("faro-resaltar"), 2300);
          return;
        }
        if (++intentos < 18) this.focoTimer = setTimeout(buscar, 140);
      };
      this.focoTimer = setTimeout(buscar, 120);
    },
    irA(it) {
      if (!it) return;
      irDesdeModal(it.href);
      if (it.foco) this.enfocar(it.foco);
    },
    elegirTip(siguiente) {
      const hh = location.hash || "#/";
      const sec = /^#\/escudrina\/ajedrez/.test(hh) ? "ajedrez"
        : /^#\/escudrina\/coloso/.test(hh) ? "coloso"
        : /^#\/escudrina\/arbol/.test(hh) ? "arbol"
        : /^#\/escudrina\/(juntos|sala)/.test(hh) ? "juntos"
        : /^#\/escudrina/.test(hh) ? "escudrina"
        : /^#\/sinopsis/.test(hh) ? "sinopsis"
        : /^#\/constelacion/.test(hh) ? "constelacion"
        : /^#\/mapa/.test(hh) ? "mapa"
        : /^#\/raices\/repaso/.test(hh) ? "repaso"
        : /^#\/cronologia/.test(hh) ? "cronologia"
        : /^#\/fuente-q/.test(hh) ? "fuente-q"
        : /^#\/planes/.test(hh) ? "planes"
        : /^#\/app/.test(hh) ? "app"
        : (esc.modo === "a" ? "analisis" : "lectura");
      const evitar = this.ultTipId || null;
      const deSec = !siguiente ? FARO_TIPS.filter((x) => x.sec === sec) : [];
      const elegido = GUIA_HIST.elegir(deSec, evitar) || GUIA_HIST.elegir(FARO_TIPS, evitar);
      if (!elegido) return null;
      this.ultTipId = GUIA_HIST.idDe(elegido);
      GUIA_HIST.registrar(elegido);
      return elegido;
    },
    montar() {
      if (this.btn && this.btn.isConnected) return this.actualizar();
      const cnt = h("span", { class: "faro-cnt", text: "" });
      const btn = h("button", {
        type: "button", class: "faro-btn", id: "btn-faro", hidden: true,
        title: "Tu faro de hoy · pendientes", "aria-label": "Tu faro de hoy: ver pendientes",
        onclick: () => this.abrir(),
      }, h("span", { class: "faro-nucleo", "aria-hidden": "true" }, h("i", { class: "faro-onda" })), cnt);
      this.btn = btn; this.cnt = cnt;
      document.body.append(btn);
      window.addEventListener("resize", () => this.ubicar(), { passive: true });
      this.actualizar();
    },
    actualizar() {
      if (!this.btn) return;
      const lista = this.pendientes();
      this.btn.hidden = lista.length === 0;
      if (lista.length) {
        this.cnt.textContent = String(lista.length);
        this.btn.setAttribute("aria-label", "Tu faro de hoy: " + (lista.length === 1 ? "1 paso pendiente" : lista.length + " pasos pendientes"));
        requestAnimationFrame(() => this.ubicar());
        clearTimeout(this.ubicarTimer);
        clearTimeout(this.ubicarTimer2);
        this.ubicarTimer = setTimeout(() => this.ubicar(), 260);
        this.ubicarTimer2 = setTimeout(() => this.ubicar(), 680);
      }
    },
    abrir() {
      const lista = this.pendientes();
      if (!lista.length) { this.actualizar(); return; }
      const tipP = h("p", {});
      const tpIni = this.elegirTip(false);
      const bMasTip = h("button", { type: "button", class: "faro-tip-mas", text: "Otro consejo ↻" });
      const pintarTip = (tp) => {
        if (!tp) { tipP.hidden = true; bMasTip.hidden = true; return; }
        tipP.hidden = false;
        tipP.replaceChildren(h("b", { text: tp.t + ": " }), tp.d);
        bMasTip.hidden = !GUIA_HIST.elegir(FARO_TIPS, GUIA_HIST.idDe(tp));
      };
      bMasTip.onclick = () => pintarTip(this.elegirTip(true));
      pintarTip(tpIni);
      const guiasOcultas = Object.keys(store.get("guiasOff", null) || {}).length > 0;
      const tipCaja = (tpIni || guiasOcultas) ? h("div", { class: "faro-tip" },
        tpIni ? h("div", { class: "faro-tip-cab" },
          h("span", { class: "faro-tip-et", text: "Consejo de BiEx" }),
          bMasTip) : null,
        tpIni ? tipP : null,
        guiasOcultas ? h("button", { type: "button", class: "faro-tip-mas", style: "margin-top:6px", onclick: (ev) => {
          store.set("guiasOff", {});
          ev.currentTarget.remove();
          avisar("Consejos en secciones activados de nuevo");
        }, text: "Mostrar consejos en secciones" }) : null) : null;
      const sopNotif = BIEX_NOTIF.estadoSoporte();
      const notifPie = sopNotif === "ok" ? h("div", { class: "faro-notif-pie" },
        h("span", { text: BIEX_NOTIF.activa() ? "Avisos del dispositivo activos" : "¿Recibir avisos en tu dispositivo?" }),
        BIEX_NOTIF.activa()
          ? h("button", { type: "button", class: "faro-notif-btn", onclick: () => irDesdeModal("#/app?avisos=1") }, "Ajustar avisos")
          : h("button", { type: "button", class: "faro-notif-btn", onclick: async (ev) => { const ok = await BIEX_NOTIF.activar(); if (ok && ev.currentTarget.isConnected) ev.currentTarget.textContent = "Activos ✓"; } }, "Activar avisos"))
        : sopNotif === "embed" ? h("div", { class: "faro-notif-pie" },
          h("span", { text: "Avisos disponibles en la app directa" }),
          h("a", { class: "faro-notif-btn", href: APP_URL + "#/app?avisos=1", target: "_blank", rel: "noopener" }, "Abrir y activar ↗"))
        : sopNotif === "ios_safari" ? h("div", { class: "faro-notif-pie" },
          h("span", { text: "En iPhone/iPad: añade BiEx a inicio" }),
          h("button", { type: "button", class: "faro-notif-btn", onclick: () => irDesdeModal("#/app?avisos=1") }, "Ver pasos")) : null;
      abrirModal(() => cajaModal(
        cabModal("Tu faro de hoy", lista.length === 1 ? "1 paso sencillo disponible ahora" : lista.length + " pasos disponibles ahora"),
        h("div", { class: "faro-mod" },
          h("p", { class: "faro-calm", text: "Un paso a la vez: elige solo lo que quieras hacer ahora. Nada se pierde si avanzas con calma." }),
          h("ul", { class: "faro-list" }, lista.map((it) => h("li", { class: "faro-it", style: "--fc:" + (it.col || "#e8cf94") },
            h("i", { "aria-hidden": "true" }),
            h("div", { class: "faro-it-t" }, h("b", { text: it.t }), h("small", { text: it.d })),
            h("button", { type: "button", class: "btn chico oro faro-go", onclick: () => this.irA(it) }, h("span", { text: it.accion }), svg(ICO.der))))),
          tipCaja,
          notifPie)));
    },
  };
  document.addEventListener("biex:faro", () => FARO.actualizar());
  window.addEventListener("storage", () => FARO.actualizar());

  // ================================================================== PR #17 + PR #18 · Atlas / Geografía Bíblica de museo interactiva (#/mapa)
  // 42 enclaves clave de la Nueva Voluntad con las transliteraciones exactas de BiEx, proyección cartográfica completa sin recortes
  // (1080 × 580 · costas, batimetría, ríos, relieves, gratícula, rosa de astrolabio de 8 puntas, escala dinámica, recorrido paso a paso
  // y directorio en códice con paso de hoja libroPaginas).
  const ATLAS_GEO = {
    "poligonos": [
        "-211.1,-219.6 -65.8,1.0 -16.3,-25.6 29.9,4.8 38.2,31.4 58.0,50.4 93.3,73.2 137.2,95.3 167.9,117.0 194.3,141.7 222.1,179.7 206.5,209.4 220.1,219.6 238.6,186.6 235.3,153.1 258.4,124.2 296.0,149.3 300.6,125.7 245.2,96.1 223.4,70.2 216.4,68.7 158.0,46.6 136.2,4.8 95.9,-27.5 97.6,-65.6 143.8,-73.2 138.9,-52.3 147.1,-42.7 170.2,-59.9 193.3,-14.2 231.3,8.6 287.4,40.9 335.3,73.2 327.7,124.6 350.8,156.1 373.9,179.7 397.0,202.5 420.2,204.1 446.6,215.5 449.2,219.6 454.5,238.7 447.9,255.8 431.4,277.8 414.5,265.3 404.6,247.4 396.4,212.4 436.7,208.2 469.7,219.6 483.9,230.7 482.2,213.2 452.5,183.5 447.6,167.5 436.0,140.9 447.6,120.4 462.4,141.7 479.6,136.0 492.8,128.0 496.1,109.0 542.3,106.7 572.0,120.4 560.8,138.6 588.5,125.7 646.0,102.9 649.3,93.8 612.6,61.8 611.6,20.0 635.7,-18.0 670.4,-56.1 705.1,-103.6 762.9,-92.2 762.9,-61.8 805.8,-25.6 858.6,-44.6 894.9,-59.9 937.8,-37.0 1003.9,8.6 1066.6,61.8 1225.1,-219.6 -211.1,-219.6",
        "1068.3,65.6 1001.2,101.8 941.1,99.9 889.0,91.5 850.3,63.4 792.6,72.5 727.2,91.5 652.3,97.6 657.9,112.8 641.4,125.7 601.7,128.0 554.2,141.7 550.9,160.7 571.4,168.3 575.3,194.2 586.2,201.8 558.8,206.3 589.9,219.6 589.5,236.8 595.1,255.0 621.5,267.2 667.8,286.2 698.5,270.2 704.1,260.0 746.3,272.9 774.4,292.3 809.7,282.4 833.8,263.4 875.8,264.9 883.4,272.9 876.8,290.8 871.1,312.1 872.5,352.7 861.2,374.4 857.6,386.6 852.0,397.6 844.7,414.7 841.8,426.9 837.1,444.0 820.6,471.8 764.5,480.9 717.3,464.2 677.0,476.3 644.0,487.0 587.9,476.3 519.2,461.1 478.9,441.4 419.5,413.2 353.5,426.1 317.1,503.0 237.9,476.3 188.4,430.7 125.7,411.7 56.3,377.5 41.5,301.4 53.7,253.9 15.0,243.6 -52.6,259.6 -211.1,263.4 -211.1,769.2 819.0,769.2 799.2,605.6 764.5,523.9 820.6,607.5 844.1,540.2 835.5,598.0 927.9,769.2 1225.1,769.2 1225.1,65.6",
        "205.5,208.2 130.6,210.9 100.9,224.6 138.9,248.2 189.0,267.9 188.4,236.0",
        "-4.8,94.5 9.4,105.6 10.1,141.7 5.1,174.0 -24.6,184.3 -31.2,149.3 -38.8,109.4",
        "0.9,27.6 5.1,59.9 -5.8,89.2 -22.3,75.1 -21.3,43.6",
        "467.4,310.5 495.4,312.1 520.2,318.1 558.2,324.2 541.7,334.1 505.3,333.7 469.0,323.5",
        "756.3,325.7 789.9,318.1 831.5,305.6 810.7,326.1 779.4,345.5 759.6,342.5",
        "621.5,276.7 617.6,290.0 606.0,297.6 609.3,286.2",
        "452.5,179.7 478.9,194.9 500.4,217.7 488.8,213.9 469.0,196.8",
        "554.9,165.3 566.4,177.8 545.0,179.7 543.3,170.2",
        "549.9,195.7 548.9,210.9 543.3,208.2",
        "582.9,225.4 579.6,229.9 568.1,228.4",
        "567.4,241.3 567.4,245.5 564.1,244.4",
        "162.6,293.0 170.6,300.6 163.6,299.9"
    ],
    "galilea": "864.2,411.7 866.9,413.2 866.2,418.5 863.6,418.9 862.6,414.7",
    "muerto": "863.9,454.3 863.6,465.7 859.6,479.4 857.0,478.6 857.9,464.2 860.6,455.0",
    "rios": [
        "865.9,398.4 864.5,411.7 864.2,418.9 863.9,436.4 862.6,454.3",
        "720.6,560.0 721.9,533.4 718.3,515.1",
        "718.3,515.1 706.7,491.5 694.2,468.0",
        "718.3,515.1 728.2,493.5 740.4,465.7",
        "891.6,362.3 901.5,328.0 884.4,285.4 877.1,290.8",
        "974.2,210.1 944.4,255.8 977.5,297.6 1030.3,339.4 1060.0,366.1",
        "657.2,215.8 630.8,221.5 597.8,231.1 590.5,235.6",
        "99.2,23.8 102.5,54.2 94.3,75.1"
    ],
    "montes": [
        "878.4,358.5 873.5,377.5 872.5,394.6",
        "852.7,442.1 851.3,455.4 848.0,470.6",
        "756.3,259.6 805.8,246.3 848.7,234.9 898.2,223.5",
        "393.1,111.3 409.6,137.9 406.3,168.3",
        "115.7,27.6 135.6,61.8 162.0,96.1"
    ],
    "aguas": [
        {
            "t": "MAR MEDITERRÁNEO",
            "x": 388,
            "y": 392
        },
        {
            "t": "MAR EGEO",
            "x": 512,
            "y": 262
        },
        {
            "t": "MAR ADRIÁTICO",
            "x": 264,
            "y": 98
        },
        {
            "t": "MAR NEGRO",
            "x": 742,
            "y": 64
        }
    ],
    "regiones": [
        {
            "t": "ITALIA",
            "x": 162,
            "y": 110
        },
        {
            "t": "MACEDONIA",
            "x": 430,
            "y": 94
        },
        {
            "t": "ACAYA",
            "x": 420,
            "y": 248
        },
        {
            "t": "ASIA",
            "x": 626,
            "y": 196
        },
        {
            "t": "GALACIA",
            "x": 738,
            "y": 172
        },
        {
            "t": "CILICIA",
            "x": 826,
            "y": 240
        },
        {
            "t": "SIRIA",
            "x": 926,
            "y": 326
        },
        {
            "t": "GĀLĪ́L",
            "x": 818,
            "y": 412
        },
        {
            "t": "YEHUDĀ́H",
            "x": 810,
            "y": 466
        },
        {
            "t": "EGIPTO",
            "x": 676,
            "y": 528
        },
        {
            "t": "CHIPRE",
            "x": 792,
            "y": 354
        },
        {
            "t": "CRETA",
            "x": 512,
            "y": 346
        }
    ]
};
  const ATLAS_LUGARES = [
    {"id": "jerusalen", "n": "Yᵉrūshāláyim", "tr": "Jerusalén", "reg": "Yehudā́h [Judea]", "x": 852.0, "y": 454.0, "lat": 31.78, "lon": 35.24, "pri": 1, "capas": ["yeshua", "paulos"], "desc": "Centro del recinto sagrado y de la primera convocación fuera [asamblea] tras la resurrección [puesta en pie arriba]. Escenario del Pésaḥ [Paso por encima] final de YēshŪ́aʿ, de la fecha de la quincuagésima y del encuentro de Prάc̅ṣεις 15.", "citas": [["LUK", 2, 41], ["MAT", 21, 1], ["ACT", 2, 1], ["ACT", 15, 2], ["GAL", 2, 1]]},
    {"id": "belen", "n": "Bḗṯ-Leḥém", "tr": "Belén", "reg": "Yehudā́h [Judea]", "x": 849.0, "y": 462.5, "lat": 31.7, "lon": 35.21, "pri": 0, "capas": ["yeshua"], "desc": "Ciudad de Dāvî́ḏ [David] en Yehudā́h, al sur de Yᵉrūshāláyim, donde nació YēshŪ́aʿ según lo escrito en Mîḵā́h.", "citas": [["MAT", 2, 1], ["LUK", 2, 4], ["JHN", 7, 42]]},
    {"id": "betania", "n": "Bēṯ-ʿAnyā́h", "tr": "Betania", "reg": "Yehudā́h [Judea]", "x": 860.5, "y": 455.5, "lat": 31.77, "lon": 35.26, "pri": 0, "capas": ["yeshua"], "desc": "Aldea en la ladera oriental del monte de los Olivos, hogar de Martā́ʾ [Marta], Miryā́m [María] y Laʿzā́r [Lázaro], junto a Yᵉrūshāláyim.", "citas": [["JHN", 11, 1], ["JHN", 12, 1], ["LUK", 24, 50]]},
    {"id": "jerico", "n": "Yᵉrîḥṓ", "tr": "Jericó", "reg": "Valle del Yardḗn", "x": 863.0, "y": 446.5, "lat": 31.87, "lon": 35.44, "pri": 0, "capas": ["yeshua"], "desc": "Ciudad oasis junto al descenso hacia el mar Muerto, paso habitual de quienes subían desde Gālī́l hacia Yᵉrūshāláyim.", "citas": [["MRK", 10, 46], ["LUK", 19, 1], ["HEB", 11, 30]]},
    {"id": "jordan", "n": "Yardḗn", "tr": "Río Jordán", "reg": "Valle del Yardḗn", "x": 866.0, "y": 435.5, "lat": 32.12, "lon": 35.55, "pri": 0, "capas": ["yeshua"], "desc": "Río que une el mar de Gālī́l con el mar Muerto; allí sumergía YÔḥānā́n [Juan] y allí inició públicamente YēshŪ́aʿ.", "citas": [["MAT", 3, 13], ["MRK", 1, 9], ["JHN", 1, 28]]},
    {"id": "samaria", "n": "Shōmᵉrṓn", "tr": "Samaria", "reg": "Región central", "x": 851.5, "y": 432.5, "lat": 32.28, "lon": 35.2, "pri": 0, "capas": ["yeshua"], "desc": "Región intermedia entre Yehudā́h y Gālī́l; allí conversó YēshŪ́aʿ junto a la fuente de Yaʿăqṓḇ y luego Fίlιppος proclamó al Mashíaḥ [Ungido].", "citas": [["JHN", 4, 4], ["ACT", 8, 5], ["ACT", 1, 8]]},
    {"id": "jope", "n": "Yāfṓ", "tr": "Jope", "reg": "Costa de Yehudā́h", "x": 836.5, "y": 443.5, "lat": 32.05, "lon": 34.75, "pri": 0, "capas": ["yeshua", "paulos"], "desc": "Puerto mediterráneo donde Pέτrος [Pedro] levantó a Ταβιθά [Tabita] y recibió la visión antes de ir a casa de Κοrnḗlιος [Cornelio] en Καιsάrεια.", "citas": [["ACT", 9, 36], ["ACT", 10, 9]]},
    {"id": "cesarea", "n": "Καιsάrεια", "tr": "Cesarea Marítima", "reg": "Costa de Yehudā́h", "x": 841.5, "y": 426.5, "lat": 32.5, "lon": 34.89, "pri": 1, "capas": ["yeshua", "paulos"], "desc": "Puerto edificado por ῾Hērṓͅidēs [Herodes] y sede del guía romano. Allí Κοrnḗlιος [Cornelio] recibió el espíritu [soplo] consagrado [santificado] y Pαῦlος permaneció custodiado dos años antes de partir a ῾Hrṓmē.", "citas": [["ACT", 10, 1], ["ACT", 23, 23], ["ACT", 25, 1]]},
    {"id": "nazaret", "n": "Naṫzḗret", "tr": "Nazaret", "reg": "Gālī́l [Galilea]", "x": 853.0, "y": 418.5, "lat": 32.7, "lon": 35.3, "pri": 1, "capas": ["yeshua"], "desc": "Población de las colinas de Gālī́l donde se crió YēshŪ́aʿ y donde leyó el documento [rollo] de Yᵉshaʿyā́HŪ [Isaías] en la reunión del shabbā́ṯ.", "citas": [["LUK", 1, 26], ["LUK", 4, 16], ["MAT", 2, 23], ["JHN", 1, 46]]},
    {"id": "cana", "n": "Qānā́h", "tr": "Caná de Gālī́l", "reg": "Gālī́l [Galilea]", "x": 855.0, "y": 411.5, "lat": 32.8, "lon": 35.34, "pri": 0, "capas": ["yeshua"], "desc": "Aldea de Gālī́l cercana a Naṫzḗret donde YēshŪ́aʿ constituyó la iniciación de las señales en una boda.", "citas": [["JHN", 2, 1], ["JHN", 4, 46]]},
    {"id": "capernaum", "n": "Kᵉfar-Naḥū́m", "tr": "Capernaúm", "reg": "Orilla del mar de Gālī́l", "x": 865.5, "y": 408.5, "lat": 32.88, "lon": 35.58, "pri": 1, "capas": ["yeshua"], "desc": "Aldea pesquera en la ribera norte del mar de Gālī́l que sirvió de base a la enseñanza de YēshŪ́aʿ en Gālī́l.", "citas": [["MAT", 4, 13], ["MRK", 1, 21], ["JHN", 6, 59]]},
    {"id": "tiberias", "n": "Τιβεrιάς", "tr": "Tiberias", "reg": "Orilla del mar de Gālī́l", "x": 864.0, "y": 417.0, "lat": 32.79, "lon": 35.54, "pri": 0, "capas": ["yeshua"], "desc": "Ciudad fundada por ῾Hērṓͅidēs Antipas en la costa occidental del lago, que también dio su nombre al mar de Gālī́l.", "citas": [["JHN", 6, 23], ["JHN", 21, 1]]},
    {"id": "tiro", "n": "Ṫzṓr", "tr": "Tiro", "reg": "Fenicia", "x": 851.9, "y": 397.6, "lat": 33.27, "lon": 35.2, "pri": 0, "capas": ["yeshua", "paulos"], "desc": "Antiguo puerto fenicio cuya región visitó YēshŪ́aʿ y donde luego los aprendices [estudiantes] despidieron a Pαῦlος en la playa.", "citas": [["MAT", 15, 21], ["MRK", 7, 24], ["ACT", 21, 3]]},
    {"id": "sidon", "n": "Ṫzîdṓn", "tr": "Sidón", "reg": "Fenicia", "x": 857.6, "y": 386.6, "lat": 33.56, "lon": 35.37, "pri": 0, "capas": ["yeshua", "paulos"], "desc": "Ciudad costera al norte de Ṫzṓr donde Pαῦlος hizo escala camino a ῾Hrṓmē y pudo visitar a los entrañables [afectuosos].", "citas": [["MRK", 7, 31], ["ACT", 27, 3]]},
    {"id": "damasco", "n": "Damméśeq", "tr": "Damasco", "reg": "Siria", "x": 888.5, "y": 388.5, "lat": 33.51, "lon": 36.31, "pri": 1, "capas": ["paulos"], "desc": "Ciudad caravanera antigua de Siria; en su camino YēshŪ́aʿ se apareció a Shāʾū́l [Saulo / Pαῦlος] y allí comenzó a proclamarlo.", "citas": [["ACT", 9, 2], ["2CO", 11, 32], ["GAL", 1, 17]]},
    {"id": "antioquia", "n": "Ἀnτιόχεια", "tr": "Antioquía de Siria", "reg": "Siria", "x": 883.7, "y": 286.1, "lat": 36.2, "lon": 36.16, "pri": 1, "capas": ["paulos"], "desc": "Metrópoli junto al Orontes donde los aprendices [estudiantes] fueron titulados por primera vez Mᵉshîḥiyyî́m [Del Ungido] y punto de partida de los viajes de Pαῦlος.", "citas": [["ACT", 11, 26], ["ACT", 13, 1], ["GAL", 2, 11]]},
    {"id": "tarso", "n": "Ταrsός", "tr": "Tarso", "reg": "Cilicia", "x": 841.9, "y": 258.9, "lat": 36.92, "lon": 34.9, "pri": 1, "capas": ["paulos"], "desc": "Ciudad universitaria y comercial de Cilicia, lugar de nacimiento de Shāʾū́l — Pαῦlος [Pablo].", "citas": [["ACT", 9, 11], ["ACT", 21, 39], ["ACT", 22, 3]]},
    {"id": "chipre", "n": "Κύprος", "tr": "Chipre · Pάfος y Sαlαmίς", "reg": "Mediterráneo oriental", "x": 784.3, "y": 334.9, "lat": 34.92, "lon": 33.15, "pri": 1, "capas": ["paulos"], "desc": "Isla natal de Bar-Nᵉḇā́ʾ [Bernabé] y primera etapa del primer viaje de Pαῦlος, atravesada de Sαlαmίς a Pάfος.", "citas": [["ACT", 4, 36], ["ACT", 13, 4], ["ACT", 13, 6]]},
    {"id": "perge", "n": "Pέrgē", "tr": "Perge", "reg": "Panfilia", "x": 708.5, "y": 257.3, "lat": 36.96, "lon": 30.85, "pri": 0, "capas": ["paulos"], "desc": "Ciudad de Panfilia adonde llegaron Pαῦlος y Bar-Nᵉḇā́ʾ [Bernabé] desde Pάfος; desde allí regresó YÔḥānā́n Μᾶrκος a Yᵉrūshāláyim.", "citas": [["ACT", 13, 13], ["ACT", 14, 25]]},
    {"id": "antioquia-pisidia", "n": "Ἀnτιόχεια (Pisidia)", "tr": "Antioquía de Pisidia", "reg": "Galacia · Asia Menor", "x": 719.6, "y": 206.1, "lat": 38.31, "lon": 31.19, "pri": 1, "capas": ["paulos"], "desc": "Colonia romana del interior de Asia Menor donde Pαῦlος habló extensamente en la reunión del shabbā́ṯ.", "citas": [["ACT", 13, 14], ["2TI", 3, 11]]},
    {"id": "iconio", "n": "Ἰκόnιοn", "tr": "Iconio", "reg": "Licaonia · Asia Menor", "x": 762.4, "y": 222.7, "lat": 37.87, "lon": 32.49, "pri": 0, "capas": ["paulos"], "desc": "Ciudad en la ruta comercial de Anatolia donde en la reunión confiaron [creyeron] multitud de Yᵉhūdī́m [Judíos/Judeanos] y de Ἑllḗnōn [Griegos].", "citas": [["ACT", 14, 1], ["ACT", 16, 2]]},
    {"id": "listra", "n": "Lύsτrα", "tr": "Listra", "reg": "Licaonia · Asia Menor", "x": 761.4, "y": 233.9, "lat": 37.58, "lon": 32.46, "pri": 0, "capas": ["paulos"], "desc": "Colonia licaonia donde Pαῦlος fue apedreado y de donde era originario Τιmόdsεος [Timoteo].", "citas": [["ACT", 14, 8], ["ACT", 16, 1], ["2TI", 3, 11]]},
    {"id": "derbe", "n": "Δέrβē", "tr": "Derbe", "reg": "Licaonia · Asia Menor", "x": 791.3, "y": 242.3, "lat": 37.36, "lon": 33.36, "pri": 0, "capas": ["paulos"], "desc": "Límite oriental del primer viaje por Asia Menor; allí anunciaron el buen mensaje e hicieron aprendices [estudiantes] antes de volver fortaleciendo cada convocación fuera [asamblea].", "citas": [["ACT", 14, 20], ["ACT", 16, 1]]},
    {"id": "colosas", "n": "Κοlοssαί", "tr": "Colosas", "reg": "Valle del Lico · Asia", "x": 666.0, "y": 226.5, "lat": 37.79, "lon": 29.26, "pri": 0, "capas": ["paulos"], "desc": "Ciudad del valle del Lico vecina de Lαοδίκεια; a su convocación fuera [asamblea] y a Fιlḗmōn dirigió Pαῦlος dos cartas.", "citas": [["COL", 1, 2], ["PHM", 1, 1]]},
    {"id": "laodicea", "n": "Lαοδίκεια", "tr": "Laodicea", "reg": "Las 7 convocaciones fuera · Asia", "x": 654.0, "y": 221.5, "lat": 37.84, "lon": 29.11, "pri": 0, "capas": ["paulos", "apokalypsis"], "desc": "Próspera ciudad comercial y bancaria del valle del Lico; séptima convocación fuera [asamblea] de Ἀpοκάlυpsις, amonestada por su tibieza.", "citas": [["REV", 3, 14], ["COL", 4, 16]]},
    {"id": "filadelfia", "n": "Fιlαδέlfεια", "tr": "Filadelfia", "reg": "Las 7 convocaciones fuera · Asia", "x": 631.4, "y": 204.4, "lat": 38.35, "lon": 28.52, "pri": 0, "capas": ["apokalypsis"], "desc": "Ciudad en una zona sísmica de Lidia; sexta convocación fuera [asamblea] de Ἀpοκάlυpsις, ante la cual se pone una entrada [abertura] abierta.", "citas": [["REV", 3, 7], ["REV", 1, 11]]},
    {"id": "sardis", "n": "Sάrδεις", "tr": "Sardis", "reg": "Las 7 convocaciones fuera · Asia", "x": 615.6, "y": 199.2, "lat": 38.49, "lon": 28.04, "pri": 0, "capas": ["apokalypsis"], "desc": "Antigua capital lidia famosa por su acrópolis; quinta convocación fuera [asamblea] de Ἀpοκάlυpsις, llamada a velar y afianzar lo restante.", "citas": [["REV", 3, 1], ["REV", 1, 11]]},
    {"id": "tiatira", "n": "Dsυάτειrα", "tr": "Tiatira", "reg": "Las 7 convocaciones fuera · Asia", "x": 609.0, "y": 182.7, "lat": 38.92, "lon": 27.84, "pri": 0, "capas": ["paulos", "apokalypsis"], "desc": "Ciudad artesanal célebre por sus gremios y su púrpura (de allí era Λυδία [Lidia]) y cuarta convocación fuera [asamblea] de Ἀpοκάlυpsις.", "citas": [["REV", 2, 18], ["ACT", 16, 14]]},
    {"id": "pergamo", "n": "Pέrgαmος", "tr": "Pérgamo", "reg": "Las 7 convocaciones fuera · Asia", "x": 587.3, "y": 174.7, "lat": 39.13, "lon": 27.18, "pri": 1, "capas": ["apokalypsis"], "desc": "Capital administrativa de Asia, célebre por sus santuarios y su biblioteca en pergamino; tercera convocación fuera [asamblea] de Ἀpοκάlυpsις.", "citas": [["REV", 2, 12], ["REV", 1, 11]]},
    {"id": "esmirna", "n": "Smύrnα", "tr": "Esmirna", "reg": "Las 7 convocaciones fuera · Asia", "x": 586.0, "y": 201.8, "lat": 38.42, "lon": 27.14, "pri": 0, "capas": ["apokalypsis"], "desc": "Puerto de la costa jonia; segunda convocación fuera [asamblea] de Ἀpοκάlυpsις, animada a ser confiable [fiel] en la tribulación [aflicción].", "citas": [["REV", 2, 8], ["REV", 1, 11]]},
    {"id": "efeso", "n": "Ἔfεsος", "tr": "Éfeso", "reg": "Las 7 convocaciones fuera · Asia", "x": 592.6, "y": 220.0, "lat": 37.94, "lon": 27.34, "pri": 1, "capas": ["paulos", "apokalypsis"], "desc": "Gran puerto de Asia donde Pαῦlος enseñó más de dos años y primera de las siete convocaciones fuera [asambleas] de Ἀpοκάlυpsις.", "citas": [["ACT", 19, 1], ["EPH", 1, 1], ["1TI", 1, 3], ["REV", 2, 1]]},
    {"id": "mileto", "n": "Μίlēτος", "tr": "Mileto", "reg": "Costa de Asia", "x": 590.4, "y": 235.6, "lat": 37.53, "lon": 27.28, "pri": 0, "capas": ["paulos"], "desc": "Puerto al sur de Ἔfεsος donde Pαῦlος mandó llamar a los más viejos [mayores] de la convocación fuera [asamblea] efesia camino a Yᵉrūshāláyim.", "citas": [["ACT", 20, 17], ["2TI", 4, 20]]},
    {"id": "patmos", "n": "Pάτmος", "tr": "Patmos", "reg": "Mar Egeo", "x": 566.3, "y": 243.5, "lat": 37.32, "lon": 26.55, "pri": 1, "capas": ["apokalypsis"], "desc": "Pequeña isla rocosa del Egeo donde YÔḥānā́n [Juan] estuvo desterrado y recibió las visiones de Ἀpοκάlυpsις.", "citas": [["REV", 1, 9]]},
    {"id": "troas", "n": "Τrōͅάς", "tr": "Troas", "reg": "Misia · Egeo", "x": 553.4, "y": 151.0, "lat": 39.75, "lon": 26.16, "pri": 0, "capas": ["paulos"], "desc": "Puerto del noroeste de Asia donde Pαῦlος tuvo la visión del varón de Macedonia y embarcó hacia Europa.", "citas": [["ACT", 16, 8], ["ACT", 20, 6], ["2CO", 2, 12]]},
    {"id": "filipos", "n": "Fίlιppοι", "tr": "Filipos", "reg": "Macedonia", "x": 491.7, "y": 103.2, "lat": 41.01, "lon": 24.29, "pri": 1, "capas": ["paulos"], "desc": "Colonia romana en la Vía Egnatia y primera convocación fuera [asamblea] establecida por Pαῦlος en Europa; destinataria de Fιlιppḗsιοι.", "citas": [["ACT", 16, 12], ["PHP", 1, 1], ["1TH", 2, 2]]},
    {"id": "tesalonica", "n": "Dsεssαlοnίκē", "tr": "Tesalónica", "reg": "Macedonia", "x": 447.4, "y": 117.5, "lat": 40.64, "lon": 22.94, "pri": 1, "capas": ["paulos"], "desc": "Capital portuaria de Macedonia; destinataria de las dos primeras cartas conservadas de Pαῦlος.", "citas": [["ACT", 17, 1], ["1TH", 1, 1], ["2TH", 1, 1]]},
    {"id": "berea", "n": "Βέrοια", "tr": "Berea", "reg": "Macedonia", "x": 422.9, "y": 121.8, "lat": 40.52, "lon": 22.2, "pri": 0, "capas": ["paulos"], "desc": "Ciudad macedonia célebre porque sus oyentes examinaban cada día las Escrituras para comprobar si estas cosas eran así.", "citas": [["ACT", 17, 10], ["ACT", 17, 11]]},
    {"id": "atenas", "n": "Ἀdsē̂nαι", "tr": "Atenas", "reg": "Acaya", "x": 473.2, "y": 218.8, "lat": 37.97, "lon": 23.73, "pri": 1, "capas": ["paulos"], "desc": "Cuna filosófica de Grecia donde Pαῦlος habló en el Ἀrείου pάgου [Areópago] ante estoicos y epicúreos acerca del altar «para un Dios desconocido».", "citas": [["ACT", 17, 16], ["ACT", 17, 22], ["1TH", 3, 1]]},
    {"id": "corinto", "n": "Κόrιndsος", "tr": "Corinto", "reg": "Acaya", "x": 445.2, "y": 221.3, "lat": 37.91, "lon": 22.88, "pri": 1, "capas": ["paulos"], "desc": "Puerto estratégico entre dos mares donde Pαῦlος permaneció un año y medio junto a Ἀκύlας [Aquila] y Prίsκιllα [Priscila].", "citas": [["ACT", 18, 1], ["1CO", 1, 2], ["2CO", 1, 1]]},
    {"id": "creta", "n": "Κrḗτē", "tr": "Creta", "reg": "Mar Mediterráneo", "x": 512.6, "y": 328.8, "lat": 35.08, "lon": 24.92, "pri": 1, "capas": ["paulos"], "desc": "Gran isla mediterránea donde quedó Τίτος [Tito] poniendo en orden las convocaciones fuera [asambleas] y que bordeó la nave de Pαῦlος antes de la tormenta.", "citas": [["TIT", 1, 5], ["ACT", 27, 7]]},
    {"id": "malta", "n": "Μεlίτē", "tr": "Malta", "reg": "Mediterráneo central", "x": 166.3, "y": 297.2, "lat": 35.91, "lon": 14.43, "pri": 1, "capas": ["paulos"], "desc": "Isla donde encalló la nave que llevaba a Pαῦlος hacia ῾Hrṓmē y donde pasaron el invierno con hospitalidad.", "citas": [["ACT", 28, 1], ["ACT", 28, 11]]},
    {"id": "roma", "n": "῾Hrṓmē", "tr": "Roma", "reg": "Italia", "x": 102.0, "y": 69.7, "lat": 41.89, "lon": 12.49, "pri": 1, "capas": ["paulos"], "desc": "Capital del Imperio; destinataria de la carta a ῾Hrōmαῖοι y lugar donde Pαῦlος enseñó con libertad durante su custodia.", "citas": [["ACT", 28, 16], ["ACT", 28, 30], ["ROM", 1, 7], ["2TI", 1, 17]]},
  ];
  const ATLAS_RUTAS = [
    { id: "r1", capa: "paulos", t: "1er viaje de Pαῦlος", ids: ["antioquia", "chipre", "perge", "antioquia-pisidia", "iconio", "listra", "derbe", "perge", "antioquia"] },
    { id: "r2", capa: "paulos", t: "2do viaje de Pαῦlος", ids: ["antioquia", "tarso", "derbe", "listra", "iconio", "troas", "filipos", "tesalonica", "berea", "atenas", "corinto", "efeso", "cesarea", "jerusalen"] },
    { id: "r3", capa: "paulos", t: "3er viaje de Pαῦlος", ids: ["antioquia", "tarso", "antioquia-pisidia", "efeso", "troas", "filipos", "corinto", "troas", "mileto", "tiro", "cesarea", "jerusalen"] },
    { id: "r4", capa: "paulos", t: "Travesía a ῾Hrṓmē", ids: ["cesarea", "sidon", "creta", "malta", "roma"] },
    { id: "ry", capa: "yeshua", t: "Senda de YēshŪ́aʿ", ids: ["belen", "nazaret", "jordan", "cana", "capernaum", "tiberias", "tiro", "samaria", "jerico", "betania", "jerusalen"] },
    { id: "ra", capa: "apokalypsis", t: "Las 7 convocaciones fuera", ids: ["patmos", "efeso", "esmirna", "pergamo", "tiatira", "sardis", "filadelfia", "laodicea"] },
  ];
  const ATLAS_LIBRO_DEF = {
    ROM: ["roma"], "1CO": ["corinto"], "2CO": ["corinto"], EPH: ["efeso"], PHP: ["filipos"],
    COL: ["colosas", "laodicea"], "1TH": ["tesalonica"], "2TH": ["tesalonica"], TIT: ["creta"], PHM: ["colosas"], "1TI": ["efeso"],
  };
  function lugaresDeVerso(c, cap, v) {
    const exact = [], capM = [];
    for (const lug of ATLAS_LUGARES) {
      let okV = false, okC = false;
      for (const [lc, lcap, lv] of lug.citas) {
        if (lc === c && lcap === cap && lv === v) okV = true;
        else if (lc === c && lcap === cap) okC = true;
      }
      if (okV) exact.push(lug);
      else if (okC) capM.push(lug);
    }
    const res = exact.concat(capM);
    if (!res.length && ATLAS_LIBRO_DEF[c]) {
      for (const id of ATLAS_LIBRO_DEF[c]) {
        const x = ATLAS_LUGARES.find((l) => l.id === id);
        if (x) res.push(x);
      }
    }
    const seen = new Set();
    return res.filter((x) => !seen.has(x.id) && seen.add(x.id)).slice(0, 3);
  }
  function rosaAstrolabioSVG(sEl) {
    // Rosa náutica de astrolabio estrictamente geométrica de 8 puntas alrededor de un anillo abierto (0 cruces, 0 estrellas de 5 puntas)
    const pts = [];
    for (let k = 0; k < 8; k++) {
      const ang = (k * Math.PI) / 4 - Math.PI / 2;
      const rExt = k % 2 === 0 ? 19.5 : 14.2;
      const rInt = 6.8;
      const aL = ang - 0.19, aR = ang + 0.19;
      const x1 = (24 + Math.cos(aL) * rInt).toFixed(2), y1 = (24 + Math.sin(aL) * rInt).toFixed(2);
      const xm = (24 + Math.cos(ang) * rExt).toFixed(2), ym = (24 + Math.sin(ang) * rExt).toFixed(2);
      const x2 = (24 + Math.cos(aR) * rInt).toFixed(2), y2 = (24 + Math.sin(aR) * rInt).toFixed(2);
      pts.push(sEl("polygon", {
        points: `${x1},${y1} ${xm},${ym} ${x2},${y2}`,
        fill: k === 0 ? "var(--oro-vivo)" : (k % 2 === 0 ? "rgba(218, 184, 112, .72)" : "rgba(218, 184, 112, .38)"),
        stroke: "rgba(12, 10, 8, .55)",
        "stroke-width": ".45",
      }));
    }
    return sEl("svg", { class: "mp-rosa", viewBox: "0 0 48 48", "aria-hidden": "true" },
      sEl("circle", { cx: "24", cy: "24", r: "20.5", fill: "rgba(9, 14, 22, .52)", stroke: "rgba(218, 184, 112, .38)", "stroke-width": ".8" }),
      sEl("circle", { cx: "24", cy: "24", r: "14.2", fill: "none", stroke: "rgba(218, 184, 112, .22)", "stroke-width": ".6", "stroke-dasharray": "1.5 2" }),
      ...pts,
      sEl("circle", { cx: "24", cy: "24", r: "6.4", fill: "rgba(12, 16, 24, .82)", stroke: "var(--oro)", "stroke-width": ".85" }),
      sEl("circle", { cx: "24", cy: "24", r: "1.8", fill: "var(--oro-vivo)" }),
      sEl("text", { x: "24", y: "3.9", "text-anchor": "middle", fill: "var(--oro-vivo)", style: "font:700 5.2px/1 var(--f-ui);letter-spacing:.08em" }, "N"));
  }
  function vistaMapa(lugarId) {
    navActual("#/buscar");
    document.title = "Atlas bíblico · BiEx";
    INMERSION_25D.refrescar();
    const NS = "http://www.w3.org/2000/svg";
    const sEl = (tag, attrs, ...kids) => {
      const el = document.createElementNS(NS, tag);
      if (attrs) for (const [k, v] of Object.entries(attrs)) if (v != null) el.setAttribute(k, String(v));
      for (const k of kids) if (k != null) el.append(typeof k === "string" ? document.createTextNode(k) : k);
      return el;
    };
    const porId = new Map(ATLAS_LUGARES.map((l) => [l.id, l]));
    let sel = porId.get(String(lugarId || "").toLowerCase()) || porId.get("jerusalen") || ATLAS_LUGARES[0];
    let capa = "todos";
    if (lugarId && sel) {
      if (sel.capas.length === 1) capa = sel.capas[0];
      else if (sel.id === "patmos" || sel.reg.includes("7 convocaciones")) capa = "apokalypsis";
    }
    let rutaId = capa === "yeshua" ? "ry" : capa === "apokalypsis" ? "ra" : "r1";
    let etapaIdx = -1;
    let svgEl = null;

    const ratioMarco = () => {
      const r = svgEl && svgEl.isConnected ? svgEl.getBoundingClientRect() : null;
      if (r && r.width > 30 && r.height > 30) return r.height / r.width;
      return window.innerWidth <= 640 ? 0.75 : (580 / 1080);
    };
    const presetDe = (c) => {
      const ar = ratioMarco();
      // Cajas geográficas completas sin recorte en el extremo oriental (x llega hasta 1035 con Siria, Chipre, Yehudā́h y Éufrates a la vista)
      const base = c === "yeshua"
        ? { cx: 854, cy: 432, w: 138 }
        : c === "paulos"
          ? { cx: 506, cy: 262, w: 930 }
          : c === "apokalypsis"
            ? { cx: 612, cy: 210, w: 184 }
            : { cx: 518, cy: 282, w: 996 };
      const h = base.w * ar;
      return { x: base.cx - base.w / 2, y: base.cy - h / 2, w: base.w, h };
    };
    let vb = presetDe(capa);
    let animRaf = 0;

    const lugarLeido = (l) => l.citas.some(([c, cap, v]) => LEI.es(c, cap, v));
    const visibles = () => capa === "todos" ? ATLAS_LUGARES : ATLAS_LUGARES.filter((l) => l.capas.includes(capa));

    svgEl = sEl("svg", {
      class: "mp-svg",
      viewBox: `${vb.x.toFixed(1)} ${vb.y.toFixed(1)} ${vb.w.toFixed(1)} ${vb.h.toFixed(1)}`,
      preserveAspectRatio: "xMidYMid meet",
      role: "group",
      "aria-label": "Mapa interactivo del Mediterráneo y el Levante en la Nueva Voluntad",
    });

    const defs = sEl("defs", {},
      sEl("linearGradient", { id: "mpGradTierra", x1: "0%", y1: "0%", x2: "100%", y2: "100%" },
        sEl("stop", { offset: "0%", "stop-color": "#211c14" }),
        sEl("stop", { offset: "52%", "stop-color": "#17130e" }),
        sEl("stop", { offset: "100%", "stop-color": "#251e14" })),
      sEl("linearGradient", { id: "mpGradTierraClaro", x1: "0%", y1: "0%", x2: "100%", y2: "100%" },
        sEl("stop", { offset: "0%", "stop-color": "#f5ecd9" }),
        sEl("stop", { offset: "55%", "stop-color": "#eadcc0" }),
        sEl("stop", { offset: "100%", "stop-color": "#dfd0b0" })));

    // Gratícula geográfica de meridianos y paralelos reales
    const gGrat = sEl("g", {});
    for (const lon of [15, 20, 25, 30, 35, 40]) {
      const x = (20 + ((lon - 10) / 31.5) * 1040).toFixed(1);
      gGrat.append(
        sEl("line", { class: "mp-grat", x1: x, y1: "-120", x2: x, y2: "700", "stroke-width": ".7" }),
        sEl("text", { class: "mp-grat-l", x: (+x + 3).toFixed(1), y: "24" }, lon + "°E"));
    }
    for (const lat of [31, 35, 39]) {
      const y = (560 - ((lat - 29) / 14.2) * 540).toFixed(1);
      gGrat.append(
        sEl("line", { class: "mp-grat", x1: "-120", y1: y, x2: "1200", y2: y, "stroke-width": ".7" }),
        sEl("text", { class: "mp-grat-l", x: "30", y: (+y - 3).toFixed(1) }, lat + "°N"));
    }

    const gCosta = sEl("g", {});
    const gTierra = sEl("g", {});
    for (const pts of ATLAS_GEO.poligonos) {
      gCosta.append(sEl("polygon", { class: "mp-costa-halo", points: pts, "stroke-width": "4.5" }));
      gTierra.append(sEl("polygon", { class: "mp-tierra", points: pts, "stroke-width": "1.0" }));
    }
    gTierra.append(
      sEl("polygon", { class: "mp-agua-in", points: ATLAS_GEO.galilea, "stroke-width": ".65" }),
      sEl("polygon", { class: "mp-agua-in", points: ATLAS_GEO.muerto, "stroke-width": ".65" }));
    for (const rPts of ATLAS_GEO.rios) gTierra.append(sEl("polyline", { class: "mp-rio", points: rPts, "stroke-width": "1.05" }));
    for (const mPts of ATLAS_GEO.montes) gTierra.append(sEl("polyline", { class: "mp-monte", points: mPts, "stroke-width": "1.1" }));

    const gLabels = sEl("g", {});
    for (const a of ATLAS_GEO.aguas) gLabels.append(sEl("text", { class: "mp-agua-l", x: a.x, y: a.y, "text-anchor": "middle" }, a.t));
    for (const r of ATLAS_GEO.regiones) gLabels.append(sEl("text", { class: "mp-reg-l", x: r.x, y: r.y, "text-anchor": "middle" }, r.t));
    const gRutas = sEl("g", {});
    const gPins = sEl("g", {});
    svgEl.append(defs, gGrat, gCosta, gTierra, gLabels, gRutas, gPins);

    const escalaTx = h("span", { text: "250 km" });
    const escalaHud = h("div", { class: "mp-escala", "aria-hidden": "true" }, h("i", { class: "mp-escala-b" }), escalaTx);

    const clampVb = () => {
      const ar = ratioMarco();
      vb.w = Math.max(72, Math.min(1060, vb.w));
      vb.h = vb.w * ar;
      vb.x = Math.max(-36, Math.min(1076 - vb.w, vb.x));
      const yMin = vb.h > 640 ? Math.min(-70, 310 - vb.h * 0.56) : -70;
      const yMax = vb.h > 640 ? Math.max(640 - vb.h, 310 - vb.h * 0.36) : 640 - vb.h;
      vb.y = Math.max(yMin, Math.min(yMax, vb.y));
    };
    const aplicarVb = () => {
      clampVb();
      svgEl.setAttribute("viewBox", `${vb.x.toFixed(1)} ${vb.y.toFixed(1)} ${vb.w.toFixed(1)} ${vb.h.toFixed(1)}`);
      pintarEscala();
    };
    const volarVb = (dest) => {
      if (animRaf) { cancelAnimationFrame(animRaf); animRaf = 0; }
      const ar = ratioMarco();
      const fin = { w: Math.max(72, Math.min(1060, dest.w)) };
      fin.h = fin.w * ar;
      fin.x = Math.max(-36, Math.min(1076 - fin.w, dest.x));
      const yMin = fin.h > 640 ? Math.min(-70, 310 - fin.h * 0.56) : -70;
      const yMax = fin.h > 640 ? Math.max(640 - fin.h, 310 - fin.h * 0.36) : 640 - fin.h;
      fin.y = Math.max(yMin, Math.min(yMax, dest.y));
      const sinMov = document.documentElement.getAttribute("data-mov") === "no" || (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
      if (sinMov) { vb = fin; aplicarVb(); return; }
      const ini = Object.assign({}, vb), t0 = performance.now(), dur = 260;
      let ultMs = 0;
      const paso = (now) => {
        const p = Math.min(1, (now - t0) / dur);
        if (p < 1 && now - ultMs < 40) { animRaf = requestAnimationFrame(paso); return; }
        ultMs = now;
        const e = 1 - Math.pow(1 - p, 3);
        vb.x = ini.x + (fin.x - ini.x) * e;
        vb.y = ini.y + (fin.y - ini.y) * e;
        vb.w = ini.w + (fin.w - ini.w) * e;
        vb.h = ini.h + (fin.h - ini.h) * e;
        aplicarVb();
        if (p < 1) animRaf = requestAnimationFrame(paso);
        else animRaf = 0;
      };
      animRaf = requestAnimationFrame(paso);
    };
    const zoomPor = (factor, cx, cy, anim = false) => {
      const ar = ratioMarco();
      const nw = Math.max(72, Math.min(1060, vb.w * factor));
      const nh = nw * ar;
      const rx = cx != null ? cx : vb.x + vb.w / 2;
      const ry = cy != null ? cy : vb.y + vb.h / 2;
      const dest = {
        x: rx - (rx - vb.x) * (nw / vb.w),
        y: ry - (ry - vb.y) * (nh / vb.h),
        w: nw, h: nh,
      };
      if (anim) volarVb(dest);
      else { vb = dest; aplicarVb(); }
    };
    const centrarEn = (l, ancho, anim = true) => {
      if (!l) return;
      const ar = ratioMarco();
      const w = ancho || Math.min(vb.w, 320);
      const h = w * ar;
      const dest = { x: l.x - w / 2, y: l.y - h / 2, w, h };
      if (anim) volarVb(dest);
      else { vb = dest; aplicarVb(); }
    };

    // Paneo y pellizco dentro del mapa (sin alterar jamás el tamaño general de letra de la página)
    const ptrs = new Map();
    let arrastre = null, distIni = 0, vbIni = null;
    svgEl.addEventListener("pointerdown", (e) => {
      INMERSION_25D.pedirPermiso();
      if (animRaf) { cancelAnimationFrame(animRaf); animRaf = 0; }
      if (e.target.closest && e.target.closest(".mp-pin")) return;
      try { svgEl.setPointerCapture(e.pointerId); } catch (err) {}
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (ptrs.size === 1) { arrastre = { x: e.clientX, y: e.clientY, vx: vb.x, vy: vb.y }; }
      else if (ptrs.size === 2) {
        const [a, b] = [...ptrs.values()];
        distIni = Math.hypot(a.x - b.x, a.y - b.y) || 1;
        vbIni = Object.assign({}, vb); arrastre = null;
      }
    });
    svgEl.addEventListener("pointermove", (e) => {
      if (!ptrs.has(e.pointerId)) return;
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const rect = svgEl.getBoundingClientRect();
      if (ptrs.size === 1 && arrastre && rect.width > 10) {
        vb.x = arrastre.vx - (e.clientX - arrastre.x) * (vb.w / rect.width);
        vb.y = arrastre.vy - (e.clientY - arrastre.y) * (vb.h / rect.height);
        aplicarVb();
      } else if (ptrs.size === 2 && vbIni && distIni > 0) {
        const [a, b] = [...ptrs.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y) || distIni;
        const f = distIni / d;
        const ar = ratioMarco();
        const nw = Math.max(72, Math.min(1060, vbIni.w * f));
        const nh = nw * ar;
        const mx = vbIni.x + vbIni.w / 2, my = vbIni.y + vbIni.h / 2;
        vb.w = nw; vb.h = nh; vb.x = mx - nw / 2; vb.y = my - nh / 2;
        aplicarVb();
      }
    });
    const finPtr = (e) => { ptrs.delete(e.pointerId); if (ptrs.size < 2) vbIni = null; if (ptrs.size === 0) arrastre = null; };
    svgEl.addEventListener("pointerup", finPtr);
    svgEl.addEventListener("pointercancel", finPtr);
    svgEl.addEventListener("wheel", (e) => {
      e.preventDefault();
      const rect = svgEl.getBoundingClientRect();
      const px = vb.x + ((e.clientX - rect.left) / Math.max(1, rect.width)) * vb.w;
      const py = vb.y + ((e.clientY - rect.top) / Math.max(1, rect.height)) * vb.h;
      zoomPor(e.deltaY > 0 ? 1.18 : 0.84, px, py, false);
    }, { passive: false });

    const ficha = h("aside", { class: "mp-ficha", "aria-live": "polite" });
    const dirCont = h("div", {});
    const dirSub = h("small", { text: "" });
    const rutaBar = h("div", { class: "mp-ruta-bar", hidden: true });
    const filtros = h("div", { class: "mp-filtros", role: "group", "aria-label": "Capas históricas del Atlas" });
    const busq = h("input", { type: "search", class: "libs-lupa", placeholder: "Buscar un lugar (Yᵉrūshāláyim, Éfeso, Roma, Nazaret…)", "aria-label": "Buscar un lugar bíblico", autocomplete: "off", spellcheck: "false" });
    let libroDir = null, idsEnLibro = [];

    // Desplazamientos cartográficos finos [dx, dy, anchor] para evitar solapamientos en zonas densas
    const ATLAS_OFF = {
      corinto: [-8, 3, "end"], atenas: [8, 3, "start"],
      pergamo: [-8, -6, "end"], tiatira: [8, -4, "start"], esmirna: [-8, 3, "end"],
      sardis: [8, -4, "start"], filadelfia: [8, 6, "start"], efeso: [-8, 5, "end"],
      mileto: [-8, 10, "end"], laodicea: [-8, -5, "end"], colosas: [8, 9, "start"], patmos: [-8, 8, "end"],
      sidon: [8, 1, "start"], tiro: [-8, 2, "end"], capernaum: [8, -5, "start"],
      cana: [-8, -5, "end"], nazaret: [-8, 3, "end"], tiberias: [8, 5, "start"],
      cesarea: [-8, 2, "end"], samaria: [-8, 3, "end"], jordan: [8, 2, "start"],
      jope: [-8, 4, "end"], jerico: [8, 1, "start"], jerusalen: [-8, 1, "end"],
      betania: [8, 5, "start"], belen: [-8, 9, "end"],
    };

    const pintarEscala = () => {
      const rect = svgEl.getBoundingClientRect();
      const pxW = rect.width > 40 ? rect.width : Math.min(window.innerWidth - 28, 620);
      const pxH = rect.height > 40 ? rect.height : pxW * ratioMarco();
      const sc = Math.max(0.14, Math.min(1, vb.w / 996));
      const upp = vb.w / pxW; // unidades SVG por cada píxel CSS real
      const esMov = pxW <= 560;
      const cerca = vb.w <= 520 || capa === "yeshua" || capa === "apokalypsis";
      // PR #19 · Tamaño real en píxeles CSS (doble de legibilidad en teléfono: ~11.4 px reales, ~12.4 px en escritorio) con anti-colisión
      const targetPx = esMov ? 11.4 : 12.4;
      const fs = Math.max(2.6, Math.min(34, targetPx * upp));
      const sw = Math.max(0.65, fs * 0.24);
      const offEsc = upp * (esMov ? 1.12 : 1.05);
      const cajasTx = [
        // Reservar la zona de controles (+ − ⌖ ⛶) arriba a la derecha y la rosa náutica arriba a la izquierda
        { x0: pxW - 50, x1: pxW + 4, y0: -4, y1: 170 },
        { x0: -4, x1: 58, y0: -4, y1: 58 },
      ];
      const chocaTx = (b) => cajasTx.some((c) => !(b.x1 < c.x0 || b.x0 > c.x1 || b.y1 < c.y0 || b.y0 > c.y1));
      const pinesOrd = [...gPins.children].sort((a, b) => {
        const pa = (a.classList.contains("sel") ? 100 : 0) + (a.dataset.pri === "1" ? 20 : 0) + (a.classList.contains("leido") ? 4 : 0);
        const pb = (b.classList.contains("sel") ? 100 : 0) + (b.dataset.pri === "1" ? 20 : 0) + (b.classList.contains("leido") ? 4 : 0);
        return pb - pa;
      });
      for (const g of pinesOrd) {
        const esSel = g.classList.contains("sel");
        const pri = g.dataset.pri === "1";
        const off = ATLAS_OFF[g.dataset.id] || [0, -8, "middle"];
        const halo = g.querySelector("circle.halo");
        const aro = g.querySelector("circle.aro");
        const dot = g.querySelector("circle.dot");
        const tx = g.querySelector("text");
        if (halo) halo.setAttribute("r", ((esSel ? 12.2 : 7.6) * upp).toFixed(2));
        if (aro) { aro.setAttribute("r", (8.4 * upp).toFixed(2)); aro.setAttribute("stroke-width", (1.25 * upp).toFixed(2)); }
        if (dot) { dot.setAttribute("r", ((esSel ? 5.2 : 3.9) * upp).toFixed(2)); dot.setAttribute("stroke-width", (1.25 * upp).toFixed(2)); }
        if (tx) {
          const quiere = esSel || pri || cerca;
          if (!quiere) { tx.style.display = "none"; continue; }
          const lx = Number(g.dataset.x || 0), ly = Number(g.dataset.y || 0);
          let anch = off[2], dx0 = off[0], dy0 = off[1];
          const txt = tx.textContent || "";
          const tw = Math.max(24, txt.length * targetPx * 0.58);
          const pinSx = ((lx - vb.x) / vb.w) * pxW;
          const pinSy = ((ly - vb.y) / vb.h) * pxH;
          if (pinSx < -10 || pinSx > pxW + 10 || pinSy < -10 || pinSy > pxH + 10) { tx.style.display = "none"; continue; }
          // Voltear automáticamente etiquetas cercanas al borde derecho o izquierdo para que ningún nombre se corte jamás
          if (anch === "start" && pinSx + Math.abs(dx0) + tw > pxW - 14) { anch = "end"; dx0 = -Math.max(8, Math.abs(dx0)); }
          else if (anch === "end" && pinSx - Math.abs(dx0) - tw < 10) { anch = "start"; dx0 = Math.max(8, Math.abs(dx0)); }
          else if (anch === "middle" && pinSx + tw * 0.5 > pxW - 14) { anch = "end"; dx0 = -8; }
          else if (anch === "middle" && pinSx - tw * 0.5 < 10) { anch = "start"; dx0 = 8; }
          const ox = dx0 * offEsc, oy = dy0 * offEsc;
          tx.setAttribute("x", ox.toFixed(2));
          tx.setAttribute("y", oy.toFixed(2));
          tx.setAttribute("text-anchor", anch);
          tx.style.fontSize = fs.toFixed(2) + "px";
          tx.style.strokeWidth = sw.toFixed(2) + "px";
          const sx = ((lx + ox - vb.x) / vb.w) * pxW;
          const sy = ((ly + oy - vb.y) / vb.h) * pxH;
          const x0 = anch === "start" ? sx : anch === "end" ? sx - tw : sx - tw * 0.5;
          if (!esSel && (x0 < 6 || x0 + tw > pxW - 6 || sy - targetPx < 6 || sy > pxH - 36)) { tx.style.display = "none"; continue; }
          const bx = { x0: x0 - 4, x1: x0 + tw + 4, y0: sy - targetPx - 2, y1: sy + 4 };
          if (!esSel && chocaTx(bx)) { tx.style.display = "none"; continue; }
          cajasTx.push(bx);
          tx.style.display = "";
        }
      }
      for (const p of gCosta.children) p.setAttribute("stroke-width", Math.max(1.2, 4.4 * sc).toFixed(2));
      for (const p of gTierra.children) {
        if (p.classList.contains("mp-tierra")) p.setAttribute("stroke-width", Math.max(0.32, 0.95 * sc).toFixed(2));
        else if (p.classList.contains("mp-rio")) p.setAttribute("stroke-width", Math.max(0.45, 1.15 * sc).toFixed(2));
      }
      gLabels.style.opacity = vb.w < 300 ? "0.24" : "1";
      for (const p of gRutas.children) {
        const base = p.classList.contains("mp-ruta-sombra") ? 3.2 : (p.classList.contains("mp-etapa-linea") ? 2.8 : 1.85);
        p.setAttribute("stroke-width", Math.max(0.55, base * sc).toFixed(2));
      }
      // Escala física dinámica (36 px en pantalla -> unidades SVG -> km y estadios romanos de ~185 m)
      const km36 = (36 / pxW) * vb.w * 2.726;
      const redondeado = km36 >= 200 ? Math.round(km36 / 50) * 50 : km36 >= 40 ? Math.round(km36 / 10) * 10 : Math.max(5, Math.round(km36 / 5) * 5);
      const est = Math.round(redondeado / 0.185);
      escalaTx.textContent = `~${redondeado} km · ${est} est.`;
    };

    const rutaActiva = () => {
      if (capa === "todos") return null;
      return ATLAS_RUTAS.find((r) => r.id === rutaId && r.capa === capa) || ATLAS_RUTAS.find((r) => r.capa === capa) || null;
    };

    const pintarRutaBar = () => {
      const rt = rutaActiva();
      if (!rt) { rutaBar.hidden = true; rutaBar.replaceChildren(); return; }
      rutaBar.hidden = false;
      const paradas = rt.ids.map((id) => porId.get(id)).filter(Boolean);
      const idx = etapaIdx >= 0 && etapaIdx < paradas.length ? etapaIdx : Math.max(0, paradas.findIndex((l) => sel && l.id === l.id && l.id === sel.id));
      const actual = paradas[idx] || paradas[0];
      const irEtapa = (nuevoIdx) => {
        const k = Math.max(0, Math.min(paradas.length - 1, nuevoIdx));
        etapaIdx = k;
        sel = paradas[k];
        try { history.replaceState(history.state, "", urlHash("#/mapa/" + sel.id)); } catch (e) {}
        const prev = k > 0 ? paradas[k - 1] : sel;
        const dist = Math.hypot(sel.x - prev.x, sel.y - prev.y);
        const w = capa === "yeshua" ? 132 : capa === "apokalypsis" ? 170 : Math.max(210, Math.min(540, dist * 2.4));
        centrarEn(sel, w, true);
        pintarMapa(); pintarFicha(); sincronizarPaginaLibro(); pintarRutaBar();
      };
      const selViaje = capa === "paulos" ? h("div", { style: "display:flex;flex-wrap:wrap;gap:5px" },
        ATLAS_RUTAS.filter((r) => r.capa === "paulos").map((r) => h("button", {
          type: "button", class: "mp-ruta-btn",
          style: r.id === rt.id ? "border-color:var(--oro);color:var(--oro-vivo)" : "",
          onclick: () => { rutaId = r.id; etapaIdx = 0; irEtapa(0); },
          text: r.t.replace(" de Pαῦlος", ""),
        }))) : null;

      rutaBar.replaceChildren(
        h("div", { class: "mp-ruta-info" },
          h("small", { text: `${rt.t} · Etapa ${idx + 1} de ${paradas.length}` }),
          h("b", { text: actual ? `${actual.n} (${actual.tr})` : rt.t }),
          selViaje),
        h("div", { class: "mp-ruta-acc" },
          h("button", { type: "button", class: "mp-ruta-btn", disabled: idx <= 0 ? "" : null, onclick: () => irEtapa(idx - 1) }, "‹ Anterior"),
          h("button", { type: "button", class: "mp-ruta-btn", disabled: idx >= paradas.length - 1 ? "" : null, onclick: () => irEtapa(idx + 1) }, "Siguiente ›")));
    };

    const sincronizarPaginaLibro = () => {
      if (!libroDir || !sel) return;
      const idx = idsEnLibro.indexOf(sel.id);
      if (idx >= 0) {
        const pag = Math.floor(idx / 8);
        if (pag !== libroDir.pagina()) libroDir.ir(pag);
      }
      for (const b of dirCont.querySelectorAll(".mp-cod-fila")) {
        b.setAttribute("aria-current", b.dataset.id === sel.id ? "true" : "false");
      }
    };

    const pintarMapa = () => {
      gRutas.replaceChildren();
      const mostrarRutas = capa === "todos"
        ? ATLAS_RUTAS.filter((r) => r.capa === "paulos")
        : ATLAS_RUTAS.filter((r) => r.capa === capa);
      const rtAct = rutaActiva();
      for (const rt of mostrarRutas) {
        const ptsArr = rt.ids.map((id) => porId.get(id)).filter(Boolean);
        const pts = ptsArr.map((l) => `${l.x},${l.y}`).join(" ");
        const esAct = !rtAct || rt.id === rtAct.id;
        const cls = rt.id.startsWith("r") && /^r[1-4]$/.test(rt.id) ? rt.id : (rt.id === "ry" ? "r1" : "r3");
        gRutas.append(
          sEl("polyline", { class: "mp-ruta-sombra", points: pts, opacity: capa === "todos" ? "0.22" : (esAct ? "0.5" : "0.18") }),
          sEl("polyline", { class: "mp-ruta " + cls, points: pts, opacity: capa === "todos" ? "0.46" : (esAct ? "0.92" : "0.28") }));
        if (rtAct && rt.id === rtAct.id && etapaIdx > 0 && etapaIdx < ptsArr.length) {
          const a = ptsArr[etapaIdx - 1], b = ptsArr[etapaIdx];
          gRutas.append(sEl("line", { class: "mp-etapa-linea", x1: a.x, y1: a.y, x2: b.x, y2: b.y }));
        }
      }
      gPins.replaceChildren();
      const vis = visibles();
      const ord = vis.slice().sort((a, b) => (a.id === sel.id ? 1 : b.id === sel.id ? -1 : 0));
      for (const l of ord) {
        const leido = lugarLeido(l);
        const esSel = sel && l.id === sel.id;
        const g = sEl("g", {
          class: "mp-pin" + (leido ? " leido" : "") + (esSel ? " sel" : ""),
          transform: `translate(${l.x},${l.y})`,
          tabindex: "0",
          role: "button",
          "aria-label": `${l.n} (${l.tr}), ${l.reg}${leido ? ", ya leído" : ""}`,
          "data-id": l.id,
          "data-pri": l.pri ? "1" : "0",
          "data-x": String(l.x),
          "data-y": String(l.y),
        },
          sEl("circle", { class: "halo", r: "8" }),
          esSel ? sEl("circle", { class: "aro", r: "8.8" }) : null,
          sEl("circle", { class: "dot", r: "4.0" }),
          sEl("text", { y: "-8", "text-anchor": "middle" }, l.n));
        const elegir = () => {
          sel = l;
          if (mapaFs) fsFichaOculta = false;
          const rt = rutaActiva();
          if (rt) { const k = rt.ids.indexOf(l.id); if (k >= 0) etapaIdx = k; }
          try { history.replaceState(history.state, "", urlHash("#/mapa/" + l.id)); } catch (e) {}
          pintarMapa(); pintarFicha(); sincronizarPaginaLibro(); pintarRutaBar();
        };
        g.addEventListener("click", (e) => { e.stopPropagation(); elegir(); });
        g.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); elegir(); } });
        gPins.append(g);
      }
      pintarEscala();
    };

    const aRomano = (n) => {
      const vals = [[10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];
      let x = Math.max(1, n | 0), out = "";
      for (const [v, s] of vals) while (x >= v) { out += s; x -= v; }
      return out;
    };
    const fsFicha = h("div", { class: "mp-fs-ficha", hidden: true });
    let mapaFs = false;
    let fsFichaOculta = false;
    const actFsFicha = () => {
      const hay = mapaFs && !!sel;
      fsFicha.hidden = !hay || fsFichaOculta;
      fsPill.hidden = !hay || !fsFichaOculta;
    };
    const fsPill = h("button", {
      type: "button",
      class: "mp-fs-pill",
      hidden: true,
      onclick: () => { fsFichaOculta = false; actFsFicha(); },
    });
    const codPieLbl = h("small", {});
    const ponerMapaFs = (on) => {
      mapaFs = !!on;
      if (mapaFs) fsFichaOculta = false;
      marco.classList.toggle("mp-fs", mapaFs);
      document.documentElement.classList.toggle("mp-fs-on", mapaFs);
      bMapaFs.setAttribute("aria-pressed", String(mapaFs));
      bMapaFs.textContent = mapaFs ? "✕" : "⛶";
      bMapaFs.title = mapaFs ? "Salir de pantalla completa" : "Mapa a pantalla completa";
      bMapaFs.setAttribute("aria-label", bMapaFs.title);
      actFsFicha();
      requestAnimationFrame(() => { vb = presetDe(capa); aplicarVb(); });
    };
    const limpiarMapaFs = () => {
      if (mapaFs) ponerMapaFs(false);
      window.removeEventListener("keydown", onKeyMapa);
      window.removeEventListener("hashchange", limpiarMapaFs);
    };
    const onKeyMapa = (e) => { if (e.key === "Escape" && mapaFs) ponerMapaFs(false); };
    window.addEventListener("keydown", onKeyMapa);
    window.addEventListener("hashchange", limpiarMapaFs);

    const irAlMapa = () => {
      if (!sel) return;
      const w = sel.reg.includes("Yehudā́h") || sel.reg.includes("Gālī́l") || sel.reg.includes("Yardḗn") ? 132 : 210;
      centrarEn(sel, w, true);
      if (!mapaFs) {
        try { marco.scrollIntoView({ behavior: sinMovimiento() ? "auto" : "smooth", block: "center" }); } catch (e) {}
      }
    };

    const pintarFicha = () => {
      if (!sel) return;
      const leido = lugarLeido(sel);
      const citas = sel.citas.map(([c, cap, v]) => {
        const lb = libroDe(c);
        const et = lb ? (lb.t || lb.n) + " " + cap + ":" + v : c + " " + cap + ":" + v;
        return h("a", { class: "mp-cita" + (LEI.es(c, cap, v) ? " leido" : ""), href: "#/" + c + "/" + cap + "/l/" + v, onclick: () => { if (mapaFs) ponerMapaFs(false); } },
          svg(ICO.libro), h("span", { text: et }));
      });
      const coordTxt = sel.lat && sel.lon ? `${sel.lat.toFixed(2)}° N · ${sel.lon.toFixed(2)}° E` : "";
      ficha.replaceChildren(
        h("div", { class: "mp-ficha-cab" },
          h("small", { text: sel.reg + (leido ? " · Visitado en tu lectura ✓" : "") }),
          h("h2", { text: sel.n }),
          h("span", { class: "mp-trad", text: "Tradicional: " + sel.tr }),
          coordTxt ? h("span", { class: "mp-coords", text: coordTxt }) : null),
        h("p", { class: "mp-desc", text: sel.desc }),
        h("div", { class: "mp-citas" },
          h("h4", { text: "Pasajes clave en BiEx" }),
          h("div", { class: "mp-cita-l" }, citas)),
        h("div", { style: "display:flex;flex-wrap:wrap;gap:8px;margin-top:2px" },
          h("button", { type: "button", class: "btn chico", onclick: irAlMapa }, svg(ICO.lupa), h("span", { text: "Acercar aquí" })),
          h("a", { class: "btn chico", href: "#/cronologia" }, svg(ICO.tiempo), h("span", { text: "Línea del tiempo" }))));
      codPieLbl.textContent = `Seleccionado: ${sel.n} (${sel.tr})`;
      // PR #20 · Ficha completa desplazable en mapa a pantalla completa con botón Ocultar / Ver ficha
      const citasFs = sel.citas.map(([c, cap, v]) => {
        const lb = libroDe(c);
        const et = lb ? (lb.t || lb.n) + " " + cap + ":" + v : c + " " + cap + ":" + v;
        return h("a", { class: "mp-cita" + (LEI.es(c, cap, v) ? " leido" : ""), href: "#/" + c + "/" + cap + "/l/" + v, onclick: () => ponerMapaFs(false) },
          svg(ICO.libro), h("span", { text: et }));
      });
      fsFicha.replaceChildren(
        h("div", { class: "mp-fs-f-cab" },
          h("div", { class: "mp-fs-f-tit" },
            h("b", { text: sel.n }),
            h("small", { text: sel.tr + " · " + sel.reg + (coordTxt ? " · " + coordTxt : "") + (leido ? " · Visitado ✓" : "") })),
          h("button", { type: "button", class: "mp-fs-oc", onclick: () => { fsFichaOculta = true; actFsFicha(); } }, "Ocultar")),
        h("p", { class: "mp-desc", text: sel.desc }),
        h("div", { class: "mp-cita-l" }, citasFs));
      fsPill.textContent = "Ver ficha · " + sel.n;
      actFsFicha();
    };

    // PR #19 + PR #20 · Códice de lugares iluminado de museo con folios romanos, giro 3D opaco y posición anclada sin saltos
    const pintarLista = () => {
      const q = sinMarcas(busq.value || "").toLowerCase().trim();
      const vis = visibles().filter((l) => !q || sinMarcas(l.n + " " + l.tr + " " + l.reg).toLowerCase().includes(q));
      idsEnLibro = vis.map((l) => l.id);
      if (!vis.length) {
        libroDir = null;
        dirSub.textContent = "0 lugares";
        dirCont.replaceChildren(h("p", { class: "nota-ui", text: "Ningún lugar coincide con esa búsqueda en esta capa." }));
        return;
      }
      const porPag = 8;
      const totalPags = Math.max(1, Math.ceil(vis.length / porPag));
      const idxSel = Math.max(0, vis.findIndex((l) => sel && l.id === sel.id));
      const pagIni = Math.floor(idxSel / porPag);
      const actSub = (p) => { dirSub.textContent = `${vis.length} ${vis.length === 1 ? "enclave" : "enclaves"} · Folio ${aRomano(p + 1)} de ${aRomano(totalPags)}`; };
      actSub(pagIni);
      libroDir = libroPaginas(vis, porPag, (l) => {
        const lei = lugarLeido(l);
        return h("li", {}, h("button", {
          type: "button",
          class: "mp-cod-fila" + (lei ? " leido" : ""),
          "data-id": l.id,
          "aria-current": sel && l.id === sel.id ? "true" : "false",
          onclick: (ev) => {
            const btnRef = ev.currentTarget;
            const y0 = btnRef.getBoundingClientRect().top;
            sel = l;
            const rt = rutaActiva();
            if (rt) { const k = rt.ids.indexOf(l.id); if (k >= 0) etapaIdx = k; }
            try { history.replaceState(history.state, "", urlHash("#/mapa/" + l.id)); } catch (e) {}
            centrarEn(l, l.reg.includes("Yehudā́h") || l.reg.includes("Gālī́l") || l.reg.includes("Yardḗn") ? 148 : 260, false);
            pintarMapa(); pintarFicha(); sincronizarPaginaLibro(); pintarRutaBar();
            const dy = btnRef.getBoundingClientRect().top - y0;
            if (Math.abs(dy) > 0.5) window.scrollBy({ top: dy, left: 0, behavior: "instant" });
          },
        },
          h("i", { class: "mp-cod-dot", "aria-hidden": "true" }),
          h("span", { class: "mp-cod-txt" },
            h("b", { text: l.n }),
            h("small", { text: l.tr + " · " + l.reg })),
          h("span", { class: "mp-cod-meta", text: (lei ? "✓ · " : "") + l.citas.length + (l.citas.length === 1 ? " cita ›" : " citas ›") })));
      }, {
        clase: "mp-cod-libro",
        etiqueta: "Folios del códice de lugares bíblicos",
        pag: pagIni,
        pagina: (nodos, k) => {
          const tramo = vis.slice(k * porPag, (k + 1) * porPag);
          const rango = tramo.length > 1 ? tramo[0].tr + " — " + tramo[tramo.length - 1].tr : (tramo[0] ? tramo[0].tr : "");
          return h("div", {},
            h("div", { class: "mp-cod-folio-cab" },
              h("b", { text: `Folio ${aRomano(k + 1)} · ${aRomano(totalPags)}` }),
              h("small", { text: rango })),
            h("ol", { class: "lp-lista" }, nodos));
        },
        alCambiar: (p) => actSub(p),
      });
      libroDir.classList.add("mp-cod-libro");
      const marcoHoja = libroDir.querySelector(".lp-marco");
      if (marcoHoja && totalPags > 1) {
        let sx = 0, sy = 0, activo = false;
        marcoHoja.addEventListener("pointerdown", (e) => {
          if (e.pointerType === "mouse" && e.button !== 0) return;
          sx = e.clientX; sy = e.clientY; activo = true;
        }, { passive: true });
        marcoHoja.addEventListener("pointerup", (e) => {
          if (!activo) return;
          activo = false;
          const dx = e.clientX - sx, dy = e.clientY - sy;
          if (Math.abs(dx) > 46 && Math.abs(dx) > Math.abs(dy) * 1.4) {
            libroDir.ir(libroDir.pagina() + (dx < 0 ? 1 : -1));
          }
        }, { passive: true });
      }
      dirCont.replaceChildren(libroDir);
    };

    const CAPAS = [
      ["todos", "Todo el mapa (" + ATLAS_LUGARES.length + ")"],
      ["yeshua", "Vida de YēshŪ́aʿ"],
      ["paulos", "Viajes de Pαῦlος [Pablo]"],
      ["apokalypsis", "7 convocaciones · Ἀpοκάlυpsις"],
    ];
    for (const [id, et] of CAPAS) {
      filtros.append(h("button", {
        type: "button", class: "mp-fil", "data-c": id, "aria-pressed": capa === id ? "true" : "false", text: et,
        onclick: () => {
          capa = id;
          rutaId = id === "yeshua" ? "ry" : id === "apokalypsis" ? "ra" : "r1";
          etapaIdx = 0;
          for (const b of filtros.children) b.setAttribute("aria-pressed", b.dataset.c === id ? "true" : "false");
          const vis = visibles();
          const rt = rutaActiva();
          if (rt && rt.ids.length && porId.has(rt.ids[0])) sel = porId.get(rt.ids[0]);
          else if (!vis.some((l) => l.id === sel.id)) sel = vis[0] || ATLAS_LUGARES[0];
          volarVb(presetDe(id));
          pintarMapa(); pintarFicha(); pintarLista(); pintarRutaBar();
        },
      }));
    }
    busq.addEventListener("input", pintarLista);

    const bMapaFs = h("button", { type: "button", class: "mp-ctrl", title: "Mapa a pantalla completa", "aria-label": "Mapa a pantalla completa", "aria-pressed": "false", onclick: () => ponerMapaFs(!mapaFs) }, "⛶");
    const ctrls = h("div", { class: "mp-ctrls" },
      h("button", { type: "button", class: "mp-ctrl", title: "Acercar mapa", "aria-label": "Acercar mapa", onclick: () => zoomPor(0.74, null, null, true) }, "+"),
      h("button", { type: "button", class: "mp-ctrl", title: "Alejar mapa", "aria-label": "Alejar mapa", onclick: () => zoomPor(1.34, null, null, true) }, "−"),
      h("button", { type: "button", class: "mp-ctrl", title: "Encuadrar capa completa", "aria-label": "Encuadrar capa completa", onclick: () => volarVb(presetDe(capa)) }, "⌖"),
      bMapaFs);
    const leyenda = h("div", { class: "mp-ley", "aria-hidden": "true" },
      h("span", {}, h("i", { style: "background:var(--oro-vivo)" }), "Enclave"),
      h("span", {}, h("i", { style: "background:#6fc08f" }), "Visitado"),
      h("span", {}, h("i", { style: "background:#7fb2f5" }), "Rutas"));
    const pieHud = h("div", { class: "mp-pie-hud" }, leyenda, escalaHud);
    const marco = h("div", { class: "mp-marco" }, rosaAstrolabioSVG(sEl), svgEl, ctrls, fsFicha, fsPill, pieHud);
    const colMapa = h("div", { class: "mp-col-mapa" }, marco, rutaBar);

    const leidosTot = ATLAS_LUGARES.filter(lugarLeido).length;
    vista().replaceChildren(h("div", { class: "in" }, h("section", { class: "panel mp-pag" },
      barraVolver(),
      h("div", { class: "panel-cab" },
        h("span", { class: "eyebrow", text: "Geografía de la Nueva Voluntad" }),
        h("h1", { text: "Atlas bíblico interactivo" }),
        h("p", { class: "nota-ui", text: `Recorre ${ATLAS_LUGARES.length} enclaves históricos del Levante y el Mediterráneo con las transliteraciones de BiEx. Has visitado en tu lectura ${leidosTot} de ${ATLAS_LUGARES.length} lugares.` })),
      guiaSeccion("mapa"),
      filtros,
      h("div", { class: "mp-grid" }, colMapa, ficha),
      h("div", { class: "mp-cod-caja" },
        h("div", { class: "mp-dir-cab" },
          h("h2", { style: "font:500 1.16rem/1.2 var(--f-display)", text: "Códice de lugares" }),
          dirSub),
        h("label", { class: "libs-lupa-c" }, svg(ICO.buscar), busq),
        dirCont,
        h("div", { class: "mp-cod-pie-acc" },
          codPieLbl,
          h("button", { type: "button", class: "btn chico oro", onclick: irAlMapa }, svg(ICO.lupa), h("span", { text: "Ver en el mapa" })))))));

    if (lugarId && porId.has(String(lugarId).toLowerCase())) {
      centrarEn(sel, sel.reg.includes("Yehudā́h") || sel.reg.includes("Gālī́l") ? 148 : 250, false);
    } else {
      vb = presetDe(capa);
      aplicarVb();
    }
    pintarMapa(); pintarFicha(); pintarLista(); pintarRutaBar();
    alTope();
  }

  // ================================================================== PR #17 · Tarjetas de repaso breve de raíces griegas — 1 min/día (#/raices/repaso)
  // Repaso espaciado Leitner en 5 cajas (1, 2, 4, 8 y 16 días), sincronizado vía estudio.repasoRaices a /nube.
  async function vistaRepasoRaices() {
    navActual("#/buscar");
    document.title = "Repaso de raíces · 1 min · BiEx";
    if (!LX) { vista().replaceChildren(cargando("Preparando tus tarjetas de raíces…")); alTope(); }
    try { await lexico(); } catch (e) { vista().replaceChildren(fallo("No se pudo cargar el diccionario de raíces.")); return; }

    const DIAS_CAJA = [0, 1, 2, 4, 8, 16];
    const DIA_MS = 864e5;
    const hoyKey = () => new Date().toISOString().slice(0, 10);

    // Construye el catálogo ordenado de raíces sustantivas (verbos, sustantivos y adjetivos; excluye artículos/partículas)
    // priorizando familias vivas con múltiples derivados y alta frecuencia en la Nueva Voluntad
    const pool = [];
    for (const [r, fam] of LX.fam.entries()) {
      const gl = glosaBreve(r);
      if (!gl || !T.L[r]) continue;
      const cl = claseLema(r);
      if (!["V", "N", "A"].includes(cl)) continue;
      let total = 0;
      for (const li of fam) total += (T.LN[li] | 0);
      if (total < 5 && fam.length < 2) continue;
      const peso = (fam.length >= 2 ? 1200 : 0) + fam.length * 45 + Math.min(total, 1800);
      pool.push({ r, fam, total, peso });
    }
    pool.sort((a, b) => b.peso - a.peso || a.r - b.r);

    const leerRep = () => {
      const st = leerEstudio();
      if (!st.repasoRaices || typeof st.repasoRaices !== "object") st.repasoRaices = {};
      return st;
    };

    const armarRonda = (tam = 6) => {
      const rep = leerRep().repasoRaices;
      const ahora = Date.now();
      const vencidas = [];
      const nuevas = [];
      for (const p of pool) {
        const e = rep[String(p.r)];
        if (e && typeof e === "object") {
          if ((+e.prox || 0) <= ahora) vencidas.push({ p, caja: e.caja | 0 || 1, prox: +e.prox || 0 });
        } else {
          nuevas.push(p);
        }
      }
      vencidas.sort((a, b) => a.caja - b.caja || a.prox - b.prox);
      const sel = vencidas.slice(0, tam).map((x) => x.p);
      for (const n of nuevas) {
        if (sel.length >= tam) break;
        sel.push(n);
      }
      // Si ya se dominaron todas y nada vence aún, ofrece un repaso libre de las más próximas a vencer
      if (!sel.length) {
        const todas = pool.slice().sort((a, b) => {
          const ea = rep[String(a.r)], eb = rep[String(b.r)];
          return ((ea && +ea.prox) || 0) - ((eb && +eb.prox) || 0);
        });
        return todas.slice(0, tam);
      }
      return sel;
    };

    let ronda = armarRonda(6);
    let idx = 0, revelada = false, aciertosRonda = 0;

    const statsBox = h("div", { class: "rr-stats" });
    const barraPro = h("div", { class: "rr-progreso", role: "progressbar", "aria-label": "Avance de la ronda de repaso", "aria-valuemin": "0", "aria-valuemax": String(ronda.length), "aria-valuenow": "0" }, h("i", { style: "width:0%" }));
    const escenario = h("div", {});

    const pintarStats = () => {
      const rep = leerRep().repasoRaices;
      const ahora = Date.now(), hoy = hoyKey();
      let venc = 0, dom = 0;
      for (const [k, v] of Object.entries(rep)) {
        if (k === "_hoy" || !v || typeof v !== "object") continue;
        if ((+v.prox || 0) <= ahora) venc++;
        if ((v.caja | 0) >= 4) dom++;
      }
      const hechasHoy = rep._hoy && rep._hoy.f === hoy ? (rep._hoy.n | 0) : 0;
      statsBox.replaceChildren(
        h("div", { class: "rr-stat" }, h("b", { text: String(Math.max(venc, Math.max(0, ronda.length - idx))) }), h("small", { text: "Por repasar" })),
        h("div", { class: "rr-stat" }, h("b", { text: String(dom) }), h("small", { text: "Dominadas" })),
        h("div", { class: "rr-stat" }, h("b", { text: String(hechasHoy) }), h("small", { text: "Hoy" })));
    };

    const evaluar = (nivel) => {
      const item = ronda[idx];
      if (!item) return;
      const st = leerRep();
      const k = String(item.r);
      const prev = st.repasoRaices[k] && typeof st.repasoRaices[k] === "object" ? st.repasoRaices[k] : { caja: 0, reps: 0 };
      const prevCaja = prev.caja | 0;
      const nuevaCaja = nivel === 0 ? 1 : nivel === 1 ? Math.min(5, Math.max(2, prevCaja + 1)) : Math.min(5, Math.max(4, prevCaja + 2));
      if (nivel >= 1) aciertosRonda++;
      const ahora = Date.now();
      st.repasoRaices[k] = {
        caja: nuevaCaja,
        prox: ahora + DIAS_CAJA[nuevaCaja] * DIA_MS,
        reps: (prev.reps | 0) + 1,
        t: ahora,
      };
      const hoy = hoyKey();
      const prevHoy = st.repasoRaices._hoy && st.repasoRaices._hoy.f === hoy ? (st.repasoRaices._hoy.n | 0) : 0;
      st.repasoRaices._hoy = { f: hoy, n: prevHoy + 1, t: ahora };
      guardarEstudio(st);
      document.dispatchEvent(new CustomEvent("biex:faro"));
      idx++;
      revelada = false;
      pintarCarta();
    };

    const pintarCarta = () => {
      pintarStats();
      const pctP = ronda.length ? Math.round((Math.min(idx, ronda.length) / ronda.length) * 100) : 100;
      barraPro.setAttribute("aria-valuenow", String(Math.min(idx, ronda.length)));
      barraPro.firstChild.style.width = pctP + "%";

      if (idx >= ronda.length) {
        escenario.replaceChildren(h("div", { class: "rr-fin" },
          h("h2", { text: "Ronda completada" }),
          h("p", { text: `Repasaste ${ronda.length} raíces griegas (${aciertosRonda} recordadas con firmeza). Cada tarjeta volverá justo antes de olvidarse.` }),
          h("div", { class: "rr-enlaces" },
            h("button", { type: "button", class: "btn oro", onclick: () => { ronda = armarRonda(6); idx = 0; revelada = false; aciertosRonda = 0; pintarCarta(); } }, svg(ICO.tarjetas), h("span", { text: "Otra ronda (6 raíces)" })),
            h("a", { class: "btn", href: "#/raices" }, svg(ICO.raiz), h("span", { text: "Diccionario de raíces" })),
            h("a", { class: "btn", href: "#/" }, svg(ICO.libro), h("span", { text: "Volver al inicio" })))));
        return;
      }

      const item = ronda[idx];
      const rep = leerRep().repasoRaices[String(item.r)];
      const caja = rep && rep.caja ? (rep.caja | 0) : 0;
      const badge = (caja ? `Caja ${caja} de 5` : "Nueva raíz") + ` · ${idx + 1} de ${ronda.length}`;
      const glBase = glosaBreve(item.r);
      const glOtras = glosasLema(item.r, 4).map(([t]) => T.TR[t]).filter((x) => x && x !== glBase).slice(0, 3);
      const glTexto = [glBase].concat(glOtras).filter(Boolean).join(" · ");
      const derivados = item.fam.filter((li) => li !== item.r).sort((a, b) => (T.LN[b] | 0) - (T.LN[a] | 0)).slice(0, 5);

      const sumaLib = new Map();
      for (const li of item.fam) {
        const lb = T.LB[li] || [];
        for (let j = 0; j < lb.length; j += 2) sumaLib.set(lb[j], (sumaLib.get(lb[j]) || 0) + lb[j + 1]);
      }
      const topLibs = [...sumaLib.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3)
        .map(([bi, n]) => D && D.libros[bi] ? (D.libros[bi].t || D.libros[bi].n) + " (" + n + ")" : "").filter(Boolean);

      const formaRaiz = lemaCorto(item.r);
      const grEl = h("p", { class: "rr-gr", lang: "grc", text: formaRaiz });
      const bAudR = h("button", { type: "button", class: "fp-aud-btn", title: "Escuchar pronunciación histórica en griego koiné del siglo I (2 veces)", "aria-label": "Escuchar " + formaRaiz + " en griego koiné del siglo I" }, svg(ICO.voz), h("span", { text: "Escuchar koiné s. I" }));
      const bAudL = h("button", { type: "button", class: "fp-aud-btn lento", title: "Escuchar despacio (0,7× · 2 veces)", "aria-label": "Escuchar " + formaRaiz + " más despacio", text: "0,7×" });
      const sonarRaiz = (lento, bt) => () => {
        if (bt.classList.contains("sonando")) { KOINE_S1.parar(); return; }
        bAudR.classList.remove("sonando"); bAudL.classList.remove("sonando");
        bt.classList.add("sonando");
        KOINE_S1.hablar(formaRaiz, {
          lento,
          repetir: 2,
          pausaMs: 1500,
          alInicio: () => grEl.classList.add("sonando"),
          alPausa: () => grEl.classList.remove("sonando"),
          alFin: () => { bt.classList.remove("sonando"); grEl.classList.remove("sonando"); },
        });
      };
      bAudR.onclick = sonarRaiz(false, bAudR);
      bAudL.onclick = sonarRaiz(true, bAudL);
      const carta = h("article", { class: "rr-carta" },
        h("span", { class: "rr-caja-chip", text: badge }),
        grEl,
        h("p", { class: "rr-tl", text: tlCorta(item.r) }),
        h("div", { class: "rr-aud-fila" }, bAudR, bAudL),
        h("p", { class: "rr-frec", text: `${fmt(item.total)} apariciones · ${item.fam.length === 1 ? "1 palabra" : "familia de " + fmt(item.fam.length) + " palabras"}` }),
        !revelada
          ? h("div", { style: "margin-top:6px" },
              h("button", { type: "button", class: "btn oro", onclick: () => { revelada = true; pintarCarta(); } }, svg(ICO.contemplar), h("span", { text: "Ver significado y familia" })))
          : h("div", { class: "rr-rev" },
              h("p", { class: "rr-glosa", text: glTexto }),
              derivados.length ? h("div", { class: "rr-der", "aria-label": "Palabras de la misma familia" }, derivados.map((li) =>
                h("span", {}, h("b", { lang: "grc", text: lemaCorto(li) }), glosaBreve(li) || tlCorta(li)))) : null,
              topLibs.length ? h("p", { class: "rr-frec", text: "Más frecuente en: " + topLibs.join(" · ") }) : null,
              h("div", { class: "rr-eval" },
                h("button", { type: "button", class: "btn chico", onclick: () => evaluar(0) }, "Repasar pronto (1 d)"),
                h("button", { type: "button", class: "btn chico", onclick: () => evaluar(1) }, "Lo recordé"),
                h("button", { type: "button", class: "btn chico oro", onclick: () => evaluar(2) }, "Dominada")),
              h("div", { style: "margin-top:4px" },
                h("a", { class: "nota-ui", style: "color:var(--oro-vivo);text-decoration:underline", href: "#/raiz/" + item.r, text: "Explorar toda la familia en el diccionario →" }))));
      escenario.replaceChildren(carta);
    };

    vista().replaceChildren(h("div", { class: "in" }, h("section", { class: "panel rr-pag" },
      h("div", { class: "barra-volver" },
        h("button", { class: "btn chico", type: "button", onclick: volverAtras }, svg(ICO.atras), "Volver"),
        h("a", { class: "btn chico", href: "#/raices" }, svg(ICO.raiz), "Todas las raíces")),
      h("div", { class: "panel-cab" },
        h("span", { class: "eyebrow", text: "Repaso espaciado · 1 min al día" }),
        h("h1", { text: "Tarjetas de raíces griegas" }),
        h("p", { class: "nota-ui", text: "Rondas breves de 6 raíces reales de la Nueva Voluntad. Memoriza la raíz y reconoce de golpe toda su familia de palabras." })),
      guiaSeccion("repaso"),
      statsBox,
      barraPro,
      escenario)));
    pintarCarta();
    if (restaurando()) intentarRestaurar();
  }


  function mostrarRuta(hh) {
    const partes = decodificar((hh || location.hash).replace(/^#\/?/, "")).slice(0, 400).split("/").filter((x) => x !== "");
    // Direcciones del juego mal escritas («#/escudrinabuzonn», «#/Escudriña/Buzón»): se corrigen solas a la ruta real
    const pj = sinMarcas(partes[0] || "").toLowerCase();
    if (/^escudri/.test(pj) && (partes[0] !== "escudrina" || (partes[1] && !/^(i|c|sala|arbol|clasificacion|prestigio|propuestas|buzon|cuenta|liga|coloso|ajedrez|compania|companias|tesoro|mundo|juntos|mas|guia)$/.test(partes[1])))) {
      const SUB = ["clasificacion", "prestigio", "arbol", "propuestas", "buzon", "cuenta", "liga", "coloso", "ajedrez", "companias", "compania", "sala", "tesoro", "mundo", "juntos", "guia", "mas"];
      const dist = (a, b) => { const d = Array.from({ length: b.length + 1 }, (_, j) => j); for (let i = 1; i <= a.length; i++) { let pr = d[0]; d[0] = i; for (let j = 1; j <= b.length; j++) { const t = d[j]; d[j] = Math.min(d[j] + 1, d[j - 1] + 1, pr + (a[i - 1] === b[j - 1] ? 0 : 1)); pr = t; } } return d[b.length]; };
      const cerca = (x) => { x = sinMarcas(x || "").toLowerCase().replace(/[^a-z]/g, ""); if (!x) return null; if (x === "i") return "i"; return SUB.find((k) => k === x) || SUB.find((k) => x.length >= 3 && (k.startsWith(x) || x.startsWith(k))) || SUB.find((k) => dist(x, k) <= 2) || null; };
      const resto = pj.replace(/^escudri(n|ni)?a?/, "");
      const otras = partes.slice(1);
      const sub = resto ? cerca(resto) : otras.length ? cerca(otras[0]) : null;
      const cola = resto ? otras : otras.slice(1);
      const dest = "#/escudrina" + (sub ? "/" + sub + (sub === "i" || sub === "arbol" || sub === "sala" ? (cola.length ? "/" + cola.join("/") : "") : "") : "");
      ponerHash(dest); return mostrarRuta(dest);
    }
    const ruta = "#/" + partes.join("/");
    if (partes[0] === "buscar" && partes.length > 1) return sobrePagina(() => abrirBusqueda(partes.slice(1).join("/")));
    if (partes[0] === "guia") return sobrePagina(() => abrirGuia(+partes[1] || 0));
    if (partes[0] === "escudrina" && partes[1] === "i" && /^[a-z0-9]{4,12}$/i.test(partes[2] || "")) {
      const cod = partes[2].toLowerCase();
      if (!store.get("jg:t", null)) { const pr = store.get("jg:inv", null); if (!(pr && pr.c && Date.now() - (pr.t || 0) < 30 * 864e5)) store.set("jg:inv", { c: cod, t: Date.now() }); }
      if (partes.length > 3) { const d = "#/" + partes.slice(3).join("/"); ponerHash(d); if (!store.get("jg:t", null)) setTimeout(() => cargarJuego().then((J) => J.franja(cod)).catch(() => {}), 1500); return mostrarRuta(d); }
    }
    const esLibroRuta = !!(D && libroDe(String(partes[0] || "").toUpperCase()));
    document.documentElement.classList.toggle("en-cap", esLibroRuta);
    if (!(esLibroRuta && partes[2] !== "a") && document.documentElement.classList.contains("contemplar")) ponerContemplar(false, true);
    if (partes[0] !== "escudrina" && !esLibroRuta && window.BiExJuego) window.BiExJuego.salir();
    if (window.BiExJuego && window.BiExJuego.actividadRuta) window.BiExJuego.actividadRuta(ruta);
    else if (store.get("jg:t", null) && partes[0] === "fuente-q") cargarJuego().then((J) => J.actividadRuta && J.actividadRuta(ruta)).catch(() => {});
    rutaVista = ruta;
    creditosPie(!partes.length || (partes[0] === "escudrina" && partes[1] === "mas"));
    // AC2: en el ranking sobra la nota del pie sobre los versos; tampoco va en Escudriña (BiEx, 15-nov-2026, adjunto 8)
    document.documentElement.classList.toggle("sin-nota-pie", partes[0] === "ranking" || partes[0] === "escudrina");
    if (volverBusqueda && ruta.split("/").slice(0, 3).join("/") !== volverBusqueda.ruta.split("/").slice(0, 3).join("/")) volverBusqueda = null;
    if (!partes.length) { esc.libro = null; return portada(false); }
    if (partes[0] === "libros") { esc.libro = null; return portada(true); }
    if (partes[0] === "mapa") { esc.libro = null; return vistaMapa(partes[1] || ""); }
    if (partes[0] === "constelacion" || /^constelacion\?/.test(partes[0])) { esc.libro = null; return vistaConstelacion(partes[0].includes("?") ? partes[0].split("?")[1] : ""); }
    if (partes[0] === "sinopsis") { esc.libro = null; return vistaSinopsis(partes[1] || "", partes[2] || ""); }
    if (partes[0] === "raices" && partes[1] === "repaso") { esc.libro = null; return vistaRepasoRaices(); }
    if (partes[0] === "raices" || /^raices\?/.test(partes[0])) { esc.libro = null; return vistaRaices(); }
    if (partes[0] === "raiz" && partes[1] != null) { esc.libro = null; return vistaRaiz(+partes[1]); }
    if (partes[0] === "analizar") { esc.libro = null; return vistaAnalizador(); }
    if (partes[0] === "lema" || /^lema\?/.test(partes[0])) { esc.libro = null; return partes[1] != null && partes[0] === "lema" ? vistaLema(+partes[1], partes[2] || "") : vistaConcordancia(); }
    if (partes[0] === "buscar") { esc.libro = null; return vistaBuscar(""); }
    if (partes[0] === "cronologia") { esc.libro = null; return vistaCronologia(partes[1] || ""); }
    if (partes[0] === "fuente-q") { esc.libro = null; return vistaFuenteQ(partes[1] || ""); }
    if (partes[0] === "datos" || partes[0] === "fechas" || partes[0] === "falacias") { esc.libro = null; return vistaEstudio(partes[0], partes[1] || ""); }
    if (partes[0] === "ranking") { esc.libro = null; return vistaRanking(); }
    if (partes[0] === "marcadores") { esc.libro = null; return vistaMarcadores(); }
    if (partes[0] === "planes") { esc.libro = null; return vistaPlanes(partes[1] || ""); }
    if (partes[0] === "app" || /^app\?/.test(partes[0])) { esc.libro = null; return vistaApp(partes[0].includes("?") ? partes[0].split("?")[1] : ""); }
    if (partes[0] === "escudrina") { esc.libro = null; return vistaJuego(partes.slice(1)); }
    if (partes[0] === "niveles") { esc.libro = null; return vistaNiveles(partes[1] || "", partes[2] || ""); }
    const c = partes[0].toUpperCase();
    const cap = +partes[1] || 1;
    if (partes[2] === "o" && !prefs.lorg) { prefs.lorg = true; guardarPrefs(); } // «#/LIB/cap/o»: abre la lectura organizada
    const modo = partes[2] === "a" ? "a" : "l";
    const v = partes[3] != null ? +partes[3] : null;
    const i = partes[4] == null ? null : partes[4] === "m" ? "m" : +partes[4];
    return vistaLibro(c, cap, modo, v, i);
  }
  // ------------------------------------------------------------------ mensajes que entran por los lados (X18 y P33, 13-nov-2026)
  // Para todos (con cuenta o sin ella): quién lee ahora, lo más leído, salas abiertas, la misión de todos y lo que viene en
  // Escudriña (incursiones en equipo, geografía bíblica, salas y misiones). Entran por un lado, esperan y salen; se cierran
  // con × o deslizando. Poco gasto: lo vivo se consulta como mucho cada 4 min (público y en caché) y el resto es texto fijo.
  // Nunca con una ventana abierta, la pestaña oculta, escribiendo o durante la presentación; en un capítulo, más espaciados.
  const API_JG = String(window.BIEX_JUEGO_API || (/(^|\.)bibliaexacta\.pages\.dev$/.test(location.hostname) ? "/api/juego" : "https://bibliaexacta.pages.dev/api/juego")).replace(/\/$/, "");
  // PR #17 · Telemetría ligera de errores en producción hacia POST /error (Opus 28842cf · máx. 2 envíos por sesión, sin bloquear nada)
  (() => {
    let enviados = 0;
    const mandar = (m, a, l) => {
      if (enviados >= 2 || !navigator.onLine || /^(localhost|127\.0\.0\.1)$/.test(location.hostname)) return;
      const msg = String(m || "").trim().slice(0, 260);
      if (!msg || /ResizeObserver|Script error/i.test(msg)) return;
      enviados++;
      try {
        fetch(API_JG + "/error", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ m: msg, a: String(a || "").slice(0, 120), l: +l || 0, v: "pr18" }),
          credentials: "omit",
          keepalive: true,
        }).catch(() => {});
      } catch (e) {}
    };
    window.addEventListener("error", (e) => mandar(e && (e.message || (e.error && e.error.message)), e && e.filename, e && e.lineno));
    window.addEventListener("unhandledrejection", (e) => mandar(e && e.reason && (e.reason.message || String(e.reason)), location.hash, 0));
  })();
  const DSL = { reloj: 0, el: null, lado: 0, vivo: null, vivoT: 0, cerr: 0, visDesde: performance.now() };
  const ANUNCIOS = [
    ["inc", "El Coloso de la Tradición: únete en comunidad durante las incursiones y recibe tu parte de las recompensas.", "Ir a la arena", "#/escudrina/coloso"],
    ["geo", "Atlas bíblico interactivo: recorre los lugares de la Nueva Voluntad, los viajes de Pαῦlος [Pablo] y las 7 asambleas.", "Abrir el Atlas", "#/mapa"],
    ["sala", "Lee en compañía: abre una sala, invita a quien quieras y escudriñen juntos el mismo capítulo.", "Abrir una sala", "#/escudrina/juntos"],
    ["mis", "Cada día hay misiones nuevas: cúmplelas leyendo y gana dracmas y experiencia.", "Ver las misiones", "#/escudrina"],
    ["mun", "La misión de todos avanza con cada verso que alguien marca como leído. Suma el tuyo.", "Ver la misión", "#/escudrina/mundo"]];
  const dslHoy = () => { const d = new Date(); return d.getFullYear() * 1e4 + (d.getMonth() + 1) * 100 + d.getDate(); };
  function dslCuenta() { const c = store.get("dsl", null) || {}; return c.d === dslHoy() ? c : { d: dslHoy(), n: 0, vistos: [] }; }
  function dslLibre() {
    const de = document.documentElement;
    if (document.hidden || de.classList.contains("con-modal") || de.classList.contains("volviendo") || document.querySelector(".puerta, .intro-biex, dialog[open]")) return false;
    const a = document.activeElement; if (a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) return false;
    return true;
  }
  // Y3 (BiEx, 13-nov-2026, 18:26): la experiencia debe ser confortable y nada abrumadora. Un aviso como mucho cada 20 min;
  // cada aviso dobla la espera del siguiente (20, 40, 80 y 160 min) hasta uno cada 4 h como máximo; tras 12 h sin avisos se
  // vuelve a empezar. Las novedades de Escudriña, una vez cada 12 h. Nunca al llegar ni al volver a la pestaña: hace falta
  // un rato de lectura tranquila con la página a la vista (90 s). Cerrar uno a mano aleja el siguiente. Única excepción: un
  // evento que empieza en menos de 5 min avisa una vez antes y otra al empezar (cuando el servidor anuncie eventos).
  const DSL_ESC = [20, 40, 80, 160, 240], DSL_MIN = 60e3, DSL_CALMA = 90e3, DSL_RESET = 12 * 36e5;
  const dslEst = () => { const x = store.get("dsl2", null) || {}; return { t: +x.t || 0, k: +x.k || 0, an: +x.an || 0, ev: Array.isArray(x.ev) ? x.ev : [] }; };
  const dslEspera = (x) => (!x.t || Date.now() - x.t > DSL_RESET ? 0 : DSL_ESC[Math.min(x.k, DSL_ESC.length - 1)] * DSL_MIN);
  function dslAnotar(m) {
    const x = dslEst(), ahora = Date.now();
    x.k = !x.t || ahora - x.t > DSL_RESET ? 0 : Math.min(x.k + 1, DSL_ESC.length - 1);
    x.t = ahora; if (m && /^an:/.test(m[0])) x.an = ahora;
    store.set("dsl2", x);
  }
  document.addEventListener("visibilitychange", () => { if (!document.hidden) DSL.visDesde = performance.now(); });
  async function dslVivo(max) {
    if (DSL.vivo && Date.now() - DSL.vivoT < (max || 240e3)) return DSL.vivo;
    if (!navigator.onLine) return DSL.vivo || null;
    try {
      const r = await fetchConTope(API_JG + "/presentes", { credentials: "omit" }, 7000); if (!r.ok) throw new Error(r.status);
      DSL.vivo = await r.json(); DSL.vivoT = Date.now();
    } catch (e) { DSL.vivoT = Date.now(); DSL.vivo = DSL.vivo || null; }
    return DSL.vivo;
  }
  // eventos anunciados por el servidor (cuando existan): [{ id, t (ms), tx, txi, a, r }]
  function dslEvento() {
    const v = DSL.vivo, x = dslEst(); if (!v || !Array.isArray(v.eventos)) return null;
    const ahora = Date.now();
    for (const e of v.eventos) {
      if (!e || !e.id || !e.t) continue;
      const d = e.t - ahora, pre = "p:" + e.id, ini = "i:" + e.id;
      if (d > 0 && d <= 5 * DSL_MIN && !x.ev.includes(pre) && !x.ev.includes(ini)) return [pre, [e.tx || "Empieza en unos minutos."], e.a || "Ir", e.r || "#/escudrina", ICO.juego];
      if (d <= 0 && d > -3 * DSL_MIN && !x.ev.includes(ini)) return [ini, [e.txi || e.tx || "Ya empezó."], e.a || "Ir", e.r || "#/escudrina", ICO.juego];
    }
    return null;
  }
  async function dslMensaje() {
    const c = dslCuenta(), pool = [], aqui = esc.libro ? esc.libro + "." + esc.cap : "";
    const nom = (cod) => { const b = D && libroDe(cod); return b ? (b.t || b.n) : null; };
    const v = await dslVivo();
    if (v && v.lectores) {
      const otro = v.lectores.find((x) => x.a && x.l && x.l !== aqui && x.hace < 600);
      if (otro) { const [cod, cap] = otro.l.split("."); const n = nom(cod); if (n) pool.push(["lee:" + otro.a + otro.l, [h("b", { text: otro.a }), " está leyendo ", h("span", { class: "np", text: n }), " " + cap + " ahora mismo."], "Leer también", "#/" + cod + "/" + cap, ICO.libro]); }
      const caps = Object.entries(v.caps || {}).filter(([k]) => k !== aqui).sort((a, b) => b[1] - a[1]);
      if (caps.length && caps[0][1] >= 2) { const [cod, cap] = caps[0][0].split("."); const n = nom(cod); if (n) pool.push(["mas:" + caps[0][0], ["Lo más leído en este momento: ", h("span", { class: "np", text: n }), " " + cap + " (" + caps[0][1] + " personas)."], "Leerlo", "#/" + cod + "/" + cap, ICO.chispa]); }
      const salas = Object.entries(v.salas || {}).map(([lc, l]) => [lc, l.reduce((s, x) => s + (x.n || 0), 0)]).sort((a, b) => b[1] - a[1]);
      if (salas.length) { const [cod, cap] = salas[0][0].split("."); const n = nom(cod); if (n) pool.push(["sala:" + salas[0][0], ["Sala abierta en ", h("span", { class: "np", text: n }), " " + cap + ": " + (salas[0][1] === 1 ? "una persona lee" : salas[0][1] + " personas leen") + " en compañía."], "Unirme", "#/escudrina/juntos", ICO.comunidad]); }
      if ((v.total || 0) >= 2) pool.push(["vivos:" + v.total, [h("b", { text: v.total + " personas" }), " escudriñan la Escritura en Biblia Exacta en este momento."], "Unirme a la lectura", "#/escudrina", ICO.comunidad]);
    }
    // las novedades, una vez cada 12 h
    if (Date.now() - dslEst().an >= DSL_RESET) for (const [k, tx, a, r] of ANUNCIOS) pool.push(["an:" + k, [tx], a, r, ICO.juego]);
    // lo vivo primero; de los anuncios, el que menos se ha visto
    const nuevo = pool.filter((m) => !c.vistos.includes(m[0]));
    return (nuevo.length ? nuevo : pool)[0] || null;
  }
  // borde de abajo de las barras de arriba que se ven (el aviso entra debajo de ellas, sin tapar los controles)
  function dslTope() {
    let t = 0;
    for (const q of ["header.barra", ".barra-hoja.bh-pegada"]) { const e = document.querySelector(q); if (e) { const r = e.getBoundingClientRect(); if (r.top < 260 && r.bottom > t) t = r.bottom; } }
    return t;
  }
  function dslMostrar(m) {
    if (!m || !dslLibre()) return false;
    const c = dslCuenta(); c.vistos = c.vistos.concat(m[0]).slice(-40); store.set("dsl", c);
    DSL.lado = 1 - DSL.lado;
    const der = DSL.lado === 1, sin = document.documentElement.getAttribute("data-mov") === "no" || matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (DSL.el) DSL.el.remove();
    const cerrar = (dir, manual) => {
      if (!el.isConnected || el.dataset.sale) return; el.dataset.sale = "1"; clearTimeout(t);
      if (manual) { DSL.cerr++; const x = dslEst(); x.k = Math.min(x.k + 1, DSL_ESC.length - 1); store.set("dsl2", x); }
      const xd = dir || (der ? 1 : -1), fin = () => el.remove();
      if (sin || !el.animate) return fin();
      el.animate([{ transform: el.style.transform || "translate3d(0,0,0)", opacity: 1 }, { transform: "translate3d(" + (xd * 112) + "%,0,0)", opacity: 0 }], { duration: 640, easing: "cubic-bezier(.45,.05,.55,.95)", fill: "forwards" }).onfinish = fin;
    };
    const el = h("div", { class: "dsl " + (der ? "dsl-der" : "dsl-izq"), role: "status", "aria-live": "polite" },
      h("span", { class: "dsl-ico", "aria-hidden": "true" }, svg(m[4] || ICO.chispa)),
      h("div", { class: "dsl-tx" }, h("p", {}, ...m[1]), m[2] ? h("a", { class: "dsl-ir", href: m[3], onclick: () => cerrar(der ? 1 : -1) }, m[2], svg(ICO.seguir)) : null),
      h("button", { type: "button", class: "dsl-x", "aria-label": "Cerrar el aviso", onclick: () => cerrar(der ? 1 : -1, true) }, svg(ICO.cerrar)));
    el.style.top = Math.round(dslTope() + 10) + "px";
    // deslizar hacia un lado lo cierra
    let x0 = null, dx = 0;
    el.addEventListener("pointerdown", (e) => { if (e.target.closest("a, button")) return; x0 = e.clientX; dx = 0; el.setPointerCapture(e.pointerId); });
    el.addEventListener("pointermove", (e) => { if (x0 == null) return; dx = e.clientX - x0; el.style.transform = "translate3d(" + dx + "px,0,0)"; el.style.opacity = String(Math.max(0.2, 1 - Math.abs(dx) / 260)); });
    const soltar = () => { if (x0 == null) return; x0 = null; if (Math.abs(dx) > 70) cerrar(dx > 0 ? 1 : -1, true); else { el.style.transform = ""; el.style.opacity = ""; } };
    el.addEventListener("pointerup", soltar); el.addEventListener("pointercancel", soltar);
    // a la vista 10,25 s (PR #14: −0,8 s respecto a los 11,05 s anteriores); se detiene mientras el puntero está encima
    let t = 0, resto = 10250, desde = 0;
    const seguir = () => { desde = performance.now(); t = setTimeout(() => cerrar(), resto); };
    el.addEventListener("pointerenter", () => { clearTimeout(t); resto = Math.max(2500, resto - (performance.now() - desde)); });
    el.addEventListener("pointerleave", () => { if (!el.dataset.sale) seguir(); });
    document.body.append(el); DSL.el = el;
    if (!sin && el.animate) el.animate([{ transform: "translate3d(" + (der ? 112 : -112) + "%,0,0)", opacity: 0 }, { transform: "translate3d(0,0,0)", opacity: 1 }], { duration: 760, easing: "cubic-bezier(.22,.68,.28,1)" });
    seguir();
    return true;
  }
  function dslCiclo(ms) {
    clearTimeout(DSL.reloj);
    DSL.reloj = setTimeout(async () => {
      if (DSL.cerr >= 3) return; // quien los cierra a mano ya no los ve en esta visita
      const calma = dslLibre() && performance.now() - DSL.visDesde >= DSL_CALMA;
      // un evento que empieza: su aviso no espera la escalera (pero sí la calma)
      const ev = dslEvento();
      if (ev && calma && dslMostrar(ev)) {
        const x = dslEst(); x.ev = x.ev.concat(ev[0]).slice(-30); store.set("dsl2", x);
        const txtEv = Array.isArray(ev[1]) ? ev[1].map((p) => (typeof p === "string" ? p : (p && p.textContent) || "")).join("") : String(ev[1] || "");
        BIEX_NOTIF.enviar("ev-" + ev[0], "Evento en vivo · Biblia Exacta", txtEv || "Hay un evento comunitario activo en Escudriña.", ev[3] || "#/escudrina", "coloso");
        return dslCiclo(60e3);
      }
      const hayEv = !!(DSL.vivo && Array.isArray(DSL.vivo.eventos) && DSL.vivo.eventos.length);
      if (hayEv) await dslVivo(60e3);
      const falta = (() => { const x = dslEst(); return x.t + dslEspera(x) - Date.now(); })();
      if (falta > 0) return dslCiclo(hayEv ? 60e3 : Math.min(falta + 5e3, 30 * DSL_MIN));
      if (!calma) return dslCiclo(30e3);
      let m = null; try { m = await dslMensaje(); } catch (e) { /* nada */ }
      if (m && dslMostrar(m)) { dslAnotar(m); return dslCiclo(hayEv ? 60e3 : DSL_ESC[Math.min(dslEst().k, DSL_ESC.length - 1)] * DSL_MIN); }
      dslCiclo(10 * DSL_MIN);
    }, ms);
  }
  marco();
  // BiEx (10-nov-2026): al abrir desde el sitio oficial había un brinco (la carga de la inserción, centrada, pasaba a otra
  // arriba con el pie a media pantalla): la primera carga ocupa la pantalla, centrada y con el mismo estilo que la inserción
  vista().replaceChildren(Object.assign(cargando("Abriendo el códice…"), { className: "cargando inicio" }));
  alPadre({ biex: "listo" });
  Promise.all([cargar("datos/avance.json"), cargar("datos/destacados.json").catch(() => []), cargar("datos/cronologia.json").catch(() => null)]).then(([d, dest, cr]) => {
    D = d; DEST = Array.isArray(dest) ? dest : [];
    CRONO = cr && cr.ordenes && cr.libros ? cr : null;
    const act = $("#actualizado"), jer = $("#fecha-jerusalen");
    const FECHA_ACT = "2026-11-23T12:00:00Z";
    const ponerFechaAct = (ms) => { if (act && ms) act.textContent = " · Actualizado el " + new Date(ms).toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric" }) + "."; };
    const ponerFechaJer = () => {
      if (!jer) return;
      const txt = fechaHoraJerusalen();
      if (txt) jer.textContent = "Yᵉrūshāláyim [Jerusalén]: " + txt;
    };
    let msAct = Math.max(Date.parse(D.generado) || 0, Date.parse(FECHA_ACT) || 0);
    ponerFechaAct(msAct);
    ponerFechaJer();
    document.addEventListener("visibilitychange", () => { if (!document.hidden) ponerFechaJer(); });
    setInterval(() => { if (!document.hidden) ponerFechaJer(); }, 60e3);
    cargar("datos/archivos.json").then((ar) => { const f = ar && ar.fecha ? Date.parse(ar.fecha) : 0; if (f > msAct) { msAct = f; ponerFechaAct(msAct); } }).catch(() => {});
    botonAdelante();
    window.addEventListener("hashchange", () => {
      // la vuelta de los pasos de una ventana cerrada o desenrollada (irDesdeModal): la vista no cambia aún
      if (M.saltando) return;
      const sr = M.sinRuta; M.sinRuta = null;
      if (sr && performance.now() < sr.hasta && (sr.cualquiera || location.href === sr.url)) return;
      if (typeof KOINE_S1 !== "undefined" && KOINE_S1.parar) KOINE_S1.parar();
      ultHrefEnrutado = location.href;
      pasosApp++; resolverSeguir(); prepararPos(); enrutar();
    });
    if (enApp() && !EMBED && !(location.hash || "").replace(/^#\/?/, "")) { const u = store.get("ultimo", null), V = store.get("vista", null); if ((u && u.c && (!u.t || Date.now() - u.t < 60 * 864e5)) || (V && V.h && Date.now() - (+V.t || 0) < 60 * 864e5)) ponerHash("#/seguir"); }
    resolverSeguir();
    prepararPos();
    enrutar();
    setTimeout(actualizarCopia, 8000);
    setTimeout(() => revisarVersion(0), 5000);
    setTimeout(() => { MET = meteoros($(".meteoros")); window.__biexMet = MET; }, 1500); // __biexMet: para las pruebas
    window.__biexDsl = { mostrar: async () => dslMostrar(await dslMensaje()), estado: dslEst, espera: () => dslEspera(dslEst()) }; // para las pruebas
    // Aviso de lanzamiento de El Coloso de la Tradición (BiEx, 23-nov-2026): sábado 28-nov-2026 18:00 UTC, como máximo 2 veces al día (separadas >= 6 h)
    const COLOSO_MS = Date.UTC(2026, 10, 28, 18, 0, 0);
    function avisoColoso() {
      const falta = COLOSO_MS - Date.now();
      if (falta <= 0 || !dslLibre()) return;
      const hoy = dslHoy(), st = store.get("colosoAv", null) || {};
      const n = st.d === hoy ? (st.n | 0) : 0, ult = st.d === hoy ? (+st.t || 0) : 0;
      if (n >= 2 || (ult && Date.now() - ult < 6 * 36e5)) return;
      const d = Math.floor(falta / 864e5), hh = Math.floor((falta % 864e5) / 36e5), mm = Math.floor((falta % 36e5) / 6e4);
      const tTxt = d > 0 ? (d === 1 ? "1 día" : d + " días") + (hh ? " y " + (hh === 1 ? "1 hora" : hh + " horas") : "") : (hh > 0 ? (hh === 1 ? "1 hora" : hh + " horas") + (mm ? " y " + mm + " min" : "") : Math.max(1, mm) + " min");
      const horaLoc = new Intl.DateTimeFormat("es", { weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit" }).format(new Date(COLOSO_MS));
      if (dslMostrar(["coloso:" + hoy + ":" + (n + 1), [h("b", { text: "El Coloso de la Tradición" }), " llega en ", h("b", { text: tTxt }), " (" + horaLoc + "). Prepara tu ser interior en Escudriña."], "Ver cuenta atrás", "#/escudrina/mundo", ICO.juego])) {
        store.set("colosoAv", { d: hoy, n: n + 1, t: Date.now() });
        BIEX_NOTIF.enviar("coloso-" + hoy, "El Coloso de la Tradición · " + tTxt, "Llega el " + horaLoc + ". Prepara tu ser interior en Escudriña.", "#/escudrina/mundo", "coloso");
      }
    }
    if (!navigator.webdriver && !/[?&]sin-avisos/.test(location.search)) {
      dslCiclo(DSL_CALMA); // nunca en navegadores automatizados
      setTimeout(avisoColoso, 4500);
    }
  }).catch((er) => { console.error(er); vista().replaceChildren(fallo("No se pudo cargar el avance.")); });
})();
