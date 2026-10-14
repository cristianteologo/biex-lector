/* BiEx · Presentación de apertura del sitio oficial.
   La carga el código del sitio solo cuando toca mostrarla (wix/intro.plantilla.html decide cuándo). Cada vez cambia el verso,
   la paleta según la hora del día, la coreografía de la luz, la tonalidad de la música y la forma de abrirse al sitio.
   Versión completa: el verso aparece en unciales continuas, como en un códice; se separa en palabras, cada una con su
   transliteración y su traducción; todo se vuelve luz y forma la marca. Versión breve: la luz forma la marca.
   El sonido es opcional: los navegadores solo dejan sonar después de un toque, así que se ofrece un botón. */
(function () {
  "use strict";
  if (window.__biexIntro) return;
  window.__biexIntro = true;

  const guion = document.currentScript;
  const BASE = guion && guion.src ? guion.src.replace(/[?#].*$/, "").replace(/[^/]*$/, "") : "./";
  let MODO = (guion && guion.getAttribute("data-modo")) || "completa";
  const REDUCIDO = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (REDUCIDO) MODO = "quieta";

  const LS = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento */ } },
  };
  const azar = (a) => a[Math.floor(Math.random() * a.length)];
  const rnd = (a, b) => a + Math.random() * (b - a);
  const lim = (x, a, b) => Math.max(a, Math.min(b, x));
  const suave = (u) => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u));
  const curva = (u) => (u <= 0 ? 0 : u >= 1 ? 1 : u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
  const salida = (u) => (u <= 0 ? 0 : u >= 1 ? 1 : 1 - Math.pow(1 - u, 3));
  const tramo = (T, a, b) => (b <= a ? (T >= b ? 1 : 0) : lim((T - a) / (b - a), 0, 1));
  // Elige una opción distinta de la última vez
  function variar(clave, opciones) {
    const previa = LS.get("biex:intro:" + clave, null);
    const v = azar(opciones.filter((o) => o !== previa).length ? opciones.filter((o) => o !== previa) : opciones);
    LS.set("biex:intro:" + clave, v);
    return v;
  }
  // Cuánto amplía el navegador la página (vista móvil de Wix a 320 px); 1 en escritorio
  function escala() {
    const vv = window.visualViewport, w = document.documentElement.clientWidth || innerWidth;
    let k = (vv && vv.scale) || 1;
    if (k < 1.05) {
      const m = document.querySelector('meta[name="viewport"]');
      if (m && /width=\s*\d/.test(m.content) && screen.width) k = (innerWidth > innerHeight ? Math.max(screen.width, screen.height) : Math.min(screen.width, screen.height)) / w;
    }
    return k > 1.05 && k < 4 ? k : 1;
  }

  // ------------------------------------------------------------------ variaciones de esta vez
  const hora = new Date().getHours();
  const MOMENTO = hora >= 5 && hora < 9 ? "alba" : hora >= 9 && hora < 17 ? "dia" : hora >= 17 && hora < 20 ? "ocaso" : "noche";
  const PALETAS = {
    alba: { fondo: ["#170c16", "#040205"], oro: "#f1c992", luz: "#fff1de", nucleo: "#fff8ee", tenue: "#c9a99b", chispas: ["#f6d4a8", "#f1b3a0", "#fff3e0"] },
    dia: { fondo: ["#0e1322", "#020306"], oro: "#e8cf94", luz: "#fff5dc", nucleo: "#fffaf0", tenue: "#a7aec0", chispas: ["#e8cf94", "#fff1cf", "#cdb37a"] },
    ocaso: { fondo: ["#1c0d07", "#040201"], oro: "#f0b469", luz: "#ffe2b2", nucleo: "#fff4e2", tenue: "#bf9f8a", chispas: ["#f2b062", "#ff9d70", "#ffe0a8"] },
    noche: { fondo: ["#0a1230", "#010208"], oro: "#dfcb9f", luz: "#eef3ff", nucleo: "#ffffff", tenue: "#9aa4bf", chispas: ["#dfcb9f", "#bccbff", "#ffffff"] },
  };
  const P = PALETAS[MOMENTO];
  const CORO = variar("coreografia", ["remolino", "lluvia", "brasas", "horizonte"]);
  const APERTURA = variar("apertura", ["iris", "puerta", "velo"]);
  const TONO = variar("tono", [146.83, 155.56, 130.81, 164.81, 174.61]); // re, mi bemol, do, mi, fa

  // ------------------------------------------------------------------ escena
  const cortina = () => document.getElementById("biex-cortina");
  const host = document.createElement("div");
  host.id = "biex-intro";
  host.style.cssText = "position:fixed;inset:0;z-index:2147483601;pointer-events:auto;contain:strict";
  (document.body || document.documentElement).appendChild(host);
  const raiz = host.attachShadow ? host.attachShadow({ mode: "open" }) : host;
  const ICO_SON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path class="on" d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/><path class="off" d="M16 9.5l5 5M21 9.5l-5 5"/></svg>';
  const ICO_SALTAR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 6l7 6-7 6zM13 6l7 6-7 6z"/></svg>';
  raiz.innerHTML = "<style>" +
    ":host{all:initial}" +
    ".esc{position:absolute;left:0;top:0;width:100%;height:100%;transform-origin:0 0;overflow:hidden;background:" + P.fondo[1] + ";color:#ece5d6;font:400 14px/1.4 'BiEx Rotulo',system-ui,sans-serif;-webkit-tap-highlight-color:transparent}" +
    "canvas{position:absolute;left:0;top:0;width:100%;height:100%;display:block}" +
    ".sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;margin:0}" +
    ".ui{position:absolute;left:0;right:0;bottom:0;display:flex;justify-content:space-between;align-items:center;gap:12px;padding:0 max(18px,env(safe-area-inset-right)) max(20px,env(safe-area-inset-bottom)) max(18px,env(safe-area-inset-left));opacity:0;transition:opacity .9s .5s}" +
    ".ui.v{opacity:1}.ui.f{opacity:0;transition:opacity .3s}" +
    "button{all:unset;box-sizing:border-box;cursor:pointer;display:inline-flex;align-items:center;gap:9px;min-height:38px;padding:0 15px;border-radius:999px;border:1px solid rgba(232,207,148,.3);background:rgba(6,6,10,.42);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);color:rgba(236,229,214,.86);font:500 10.5px/1 'BiEx Rotulo',system-ui,sans-serif;letter-spacing:.24em;text-transform:uppercase;transition:border-color .2s,color .2s,box-shadow .3s}" +
    "button:hover{border-color:rgba(232,207,148,.75);color:#fff}button:focus-visible{outline:2px solid " + P.oro + ";outline-offset:3px}" +
    "button[hidden]{display:none}button svg{width:16px;height:16px;flex:none}.son[aria-pressed=true] .off,.son[aria-pressed=false] .on{display:none}" +
    ".son.pulso{animation:pulso 1.8s ease-in-out infinite}@keyframes pulso{50%{box-shadow:0 0 0 7px rgba(232,207,148,.12);border-color:rgba(232,207,148,.85);color:#fff}}" +
    ".prog{position:absolute;left:0;bottom:0;height:2px;width:100%;transform-origin:0 50%;transform:scaleX(0);background:linear-gradient(90deg,transparent," + P.oro + ");opacity:.55;pointer-events:none}" +
    "@media (max-width:420px){button{padding:0 12px;letter-spacing:.18em}}" +
    "@media (prefers-reduced-motion:reduce){.son.pulso{animation:none}}" +
    "</style>" +
    '<div class="esc" role="dialog" aria-modal="true" aria-label="Presentación de BiEx – Biblia Exacta">' +
    '<canvas aria-hidden="true"></canvas><p class="sr" aria-live="polite"></p>' +
    '<div class="ui"><button class="son" type="button" aria-pressed="false" title="Sonido">' + ICO_SON + '<span>Sonido</span></button>' +
    '<button class="sal" type="button" title="Saltar la presentación (Esc)"><span>Saltar</span>' + ICO_SALTAR + "</button></div>" +
    '<div class="prog"></div></div>';
  const esc = raiz.querySelector(".esc"), cv = raiz.querySelector("canvas"), cx = cv.getContext("2d");
  const ui = raiz.querySelector(".ui"), btnSon = raiz.querySelector(".son"), btnSal = raiz.querySelector(".sal"), prog = raiz.querySelector(".prog"), sr = raiz.querySelector(".sr");
  const desborde = document.documentElement.style.overflow;
  document.documentElement.style.overflow = "hidden";

  let W = 0, H = 0, DPR = 1, K = 1;
  function medir() {
    K = escala();
    esc.style.width = esc.style.height = K === 1 ? "" : 100 * K + "%";
    esc.style.transform = K === 1 ? "" : "scale(" + 1 / K + ")";
    W = Math.max(1, Math.round(host.clientWidth * K));
    H = Math.max(1, Math.round(host.clientHeight * K));
    DPR = Math.min(window.devicePixelRatio || 1, 2.5);
    cv.width = Math.round(W * DPR);
    cv.height = Math.round(H * DPR);
  }
  medir();
  const MOVIL = W < 640;

  // ------------------------------------------------------------------ fuentes y datos
  const FUENTES = [["BiEx Codice", "intro-codice.woff2", {}], ["BiEx Codice", "intro-codice-it.woff2", { style: "italic" }], ["BiEx Titulo", "intro-titulo.woff2", { weight: "300 700" }],
    ["BiEx Titulo", "intro-titulo-it.woff2", { weight: "300 700", style: "italic" }], ["BiEx Rotulo", "intro-rotulo.woff2", { weight: "100 900" }]];
  const espera = (ms) => new Promise((r) => setTimeout(r, ms));
  const fuentes = Promise.race([Promise.all(FUENTES.map(([f, u, d]) => {
    try { const ff = new FontFace(f, "url(" + BASE + "fuentes/" + u + ")", d); return ff.load().then((x) => { document.fonts.add(x); return x; }).catch(() => null); }
    catch (e) { return null; }
  })), espera(2600)]);
  const datos = MODO === "completa" ? Promise.race([fetch(BASE + "datos/destacados.json").then((r) => (r.ok ? r.json() : [])).catch(() => []), espera(2600).then(() => [])]) : Promise.resolve([]);
  const F_GR = '"BiEx Codice", "Gentium Book Plus", "Gentium Plus", Georgia, serif';
  const F_TI = '"BiEx Titulo", "Cormorant Garamond", "BiEx Codice", Georgia, serif';
  const F_RO = '"BiEx Rotulo", Jost, "BiEx Codice", system-ui, sans-serif';

  // La traducción principal sin las alternativas entre corchetes (en la presentación no caben; en el lector se ven completas)
  const glosaPrincipal = (t) => {
    let s = String(t || "").trim(), r = s;
    for (let i = 0; i < 4 && /\[[^\[\]]*\]/.test(r); i++) r = r.replace(/\s*\[[^\[\]]*\]/g, "");
    r = r.replace(/\s{2,}/g, " ").trim();
    return r || s;
  };
  const unciales = (g) => g.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^\p{L}]/gu, "").toUpperCase().replace(/Σ/g, "Ϲ");
  function elegirVerso(lista) {
    const ok = (Array.isArray(lista) ? lista : []).filter((d) => d && d.p && d.p.length >= 3 && d.p.length <= 8 && d.p.every((w) => w.g && glosaPrincipal(w.tr).trim()));
    if (!ok.length) return null;
    const clave = (d) => d.c + d.cap + ":" + d.v;
    const vistos = LS.get("biex:intro:versos", []);
    const frescos = ok.filter((d) => !vistos.includes(clave(d)));
    const d = azar(frescos.length ? frescos : ok);
    LS.set("biex:intro:versos", [clave(d)].concat(vistos.filter((x) => x !== clave(d))).slice(0, Math.max(0, Math.min(4, ok.length - 1))));
    return d;
  }

  // ------------------------------------------------------------------ textos como imágenes nítidas (con halo)
  const medidor = document.createElement("canvas").getContext("2d");
  function sprite(texto, fuente, color, halo, opc) {
    opc = opc || {};
    const esp = opc.esp || 0;
    medidor.font = fuente;
    const chars = esp ? Array.from(texto) : null;
    const anchos = chars ? chars.map((c) => medidor.measureText(c).width) : null;
    const m = medidor.measureText(texto);
    const w = chars ? anchos.reduce((s, x) => s + x, 0) + esp * (chars.length - 1) : m.width;
    const fs = parseFloat(fuente.match(/(\d+(?:\.\d+)?)px/)[1]);
    const asc = Math.max(m.actualBoundingBoxAscent || 0, fs * 0.72);
    const desc = Math.max(m.actualBoundingBoxDescent || 0, 2);
    const pad = Math.ceil((halo || 0) * 1.6 + 4 + fs * 0.12);
    const kr = DPR * (opc.res || 1);
    const c = document.createElement("canvas");
    c.width = Math.ceil((w + pad * 2) * kr); c.height = Math.ceil((asc + desc + pad * 2) * kr);
    const g = c.getContext("2d");
    g.scale(kr, kr); g.font = fuente; g.textBaseline = "alphabetic";
    const pinta = () => {
      if (!chars) return g.fillText(texto, pad, pad + asc);
      let x = pad; chars.forEach((ch, i) => { g.fillText(ch, x, pad + asc); x += anchos[i] + esp; });
    };
    if (opc.degradado) { const gr = g.createLinearGradient(0, pad, 0, pad + asc + desc); opc.degradado.forEach(([p, col]) => gr.addColorStop(p, col)); g.fillStyle = gr; }
    else g.fillStyle = color;
    if (halo) { g.save(); g.shadowColor = opc.colorHalo || color; g.shadowBlur = halo * kr; g.globalAlpha = 0.85; pinta(); g.restore(); }
    pinta();
    return { c, w, asc, desc, pad, kr, an: w + pad * 2, al: asc + desc + pad * 2 };
  }
  // x: borde izquierdo del texto (ya a la escala e); yBase: línea de base
  function ponerSprite(s, x, yBase, alfa, e) {
    if (!s || alfa <= 0.003) return;
    e = e || 1;
    cx.globalAlpha = Math.min(1, alfa);
    cx.drawImage(s.c, x - s.pad * e, yBase - (s.asc + s.pad) * e, s.an * e, s.al * e);
  }
  // Puntos del trazo de un sprite (para que la luz forme las letras)
  const lector = document.createElement("canvas"), lectorCx = lector.getContext("2d", { willReadFrequently: true });
  function puntos(s, x, yBase, paso, etiqueta, salida) {
    if (lector.width < s.c.width) lector.width = s.c.width;
    if (lector.height < s.c.height) lector.height = s.c.height;
    lectorCx.clearRect(0, 0, s.c.width, s.c.height); lectorCx.drawImage(s.c, 0, 0);
    const d = lectorCx.getImageData(0, 0, s.c.width, s.c.height).data, pp = Math.max(1, Math.round(paso * s.kr));
    for (let j = 0; j < s.c.height; j += pp) for (let i = 0; i < s.c.width; i += pp) {
      if (d[(j * s.c.width + i) * 4 + 3] > 170) salida.push(x - s.pad + i / s.kr, yBase - s.asc - s.pad + j / s.kr, etiqueta);
    }
    return salida;
  }

  // ------------------------------------------------------------------ partículas
  const NP = MODO === "quieta" ? 0 : Math.round(lim((W * H) / (MOVIL ? 560 : 640), MOVIL ? 520 : 900, MOVIL ? 1300 : 2300));
  const px = new Float32Array(NP), py = new Float32Array(NP), vx = new Float32Array(NP), vy = new Float32Array(NP);
  const ax = new Float32Array(NP), ay = new Float32Array(NP), bx = new Float32Array(NP), by = new Float32Array(NP);
  const t0 = new Float32Array(NP), du = new Float32Array(NP), cu = new Float32Array(NP), ta = new Float32Array(NP);
  const sz = new Float32Array(NP), al = new Float32Array(NP), alO = new Float32Array(NP), ph = new Float32Array(NP);
  const th = new Float32Array(NP), rr = new Float32Array(NP), rO = new Float32Array(NP), om = new Float32Array(NP);
  const md = new Uint8Array(NP), col = new Uint8Array(NP), et = new Int16Array(NP);
  // modos: 0 deriva · 1 viaja a un destino · 2 fijada al destino · 3 suelta · 4 en órbita
  const brillos = P.chispas.map((c) => {
    const s = document.createElement("canvas"), n = 64; s.width = s.height = n;
    const g = s.getContext("2d"), gr = g.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2);
    gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.12, c); gr.addColorStop(0.35, c + "55"); gr.addColorStop(1, c + "00");
    g.fillStyle = gr; g.fillRect(0, 0, n, n); return s;
  });
  function sembrar() {
    const cxm = W / 2, cym = H / 2;
    for (let i = 0; i < NP; i++) {
      ph[i] = Math.random() * 6.283; col[i] = Math.random() < 0.7 ? 0 : Math.random() < 0.6 ? 1 : 2;
      sz[i] = rnd(1.1, 2.6) * (MOVIL ? 0.9 : 1); al[i] = 0; alO[i] = rnd(0.25, 0.7); et[i] = -1; md[i] = 0;
      if (CORO === "remolino") {
        md[i] = 4; th[i] = Math.random() * 6.283; rr[i] = rnd(0.25, 0.75) * Math.hypot(W, H) * 0.5; rO[i] = rr[i] * rnd(0.85, 1.05); om[i] = rnd(0.05, 0.16);
        px[i] = cxm + Math.cos(th[i]) * rr[i]; py[i] = cym + Math.sin(th[i]) * rr[i];
      } else if (CORO === "horizonte") {
        px[i] = Math.random() * W; py[i] = cym + (Math.random() - 0.5) * H * 0.18 * Math.random(); vx[i] = rnd(-6, 6); vy[i] = rnd(-5, 5);
      } else {
        px[i] = Math.random() * W; py[i] = Math.random() * H; vx[i] = rnd(-4, 4);
        vy[i] = CORO === "lluvia" ? rnd(8, 22) : CORO === "brasas" ? -rnd(8, 24) : rnd(-4, 4);
      }
    }
  }
  sembrar();
  // Mandar partículas a destinos (lista plana x, y, etiqueta) a partir del tiempo dado
  function enviar(dest, T, cuando, viaje, fraccion) {
    const n = dest.length / 3;
    if (!n) return;
    const usar = Math.min(NP, Math.round(NP * (fraccion || 0.8)));
    const orden = Array.from({ length: NP }, (_, i) => i).sort(() => Math.random() - 0.5);
    for (let k = 0; k < usar; k++) {
      const i = orden[k], j = (k * 7919) % n;
      ax[i] = px[i]; ay[i] = py[i]; bx[i] = dest[j * 3] + rnd(-0.6, 0.6); by[i] = dest[j * 3 + 1] + rnd(-0.6, 0.6); et[i] = dest[j * 3 + 2];
      const c = typeof cuando === "function" ? cuando(dest[j * 3 + 2], bx[i], by[i]) : cuando;
      du[i] = viaje * rnd(0.75, 1.25);
      if (c > T) du[i] = Math.max(0.12, Math.min(du[i], c - T));
      t0[i] = c - du[i]; cu[i] = rnd(-0.35, 0.35) * Math.hypot(bx[i] - ax[i], by[i] - ay[i]);
      ta[i] = c; md[i] = 1;
    }
    for (let k = usar; k < NP; k++) { const i = orden[k]; et[i] = -1; if (md[i] === 1 || md[i] === 2) soltar(i, 12); }
  }
  function soltar(i, f) { md[i] = 3; const a = Math.random() * 6.283, v = rnd(0.3, 1) * f; vx[i] = Math.cos(a) * v; vy[i] = Math.sin(a) * v - f * 0.2; }
  function orbitar(T, R) {
    const cxm = W / 2, cym = H / 2;
    for (let i = 0; i < NP; i++) {
      const dx = px[i] - cxm, dy = py[i] - cym;
      th[i] = Math.atan2(dy, dx); rr[i] = Math.hypot(dx, dy); rO[i] = R * rnd(0.82, 1.18); om[i] = rnd(0.9, 1.9) * (Math.random() < 0.85 ? 1 : -1);
      md[i] = 4; et[i] = -1; alO[i] = rnd(0.4, 0.95);
    }
  }
  function moverParticulas(T, dt, fuerzaOrbita) {
    const cxm = W / 2, cym = H / 2;
    for (let i = 0; i < NP; i++) {
      switch (md[i]) {
        case 0:
          px[i] += vx[i] * dt + Math.sin(T * 0.7 + ph[i]) * 0.08; py[i] += vy[i] * dt + Math.cos(T * 0.6 + ph[i]) * 0.08;
          if (py[i] > H + 10) py[i] = -10; else if (py[i] < -10) py[i] = H + 10;
          if (px[i] > W + 10) px[i] = -10; else if (px[i] < -10) px[i] = W + 10;
          break;
        case 1: {
          const u = (T - t0[i]) / du[i];
          if (u <= 0) { px[i] += vx[i] * dt * 0.6; py[i] += vy[i] * dt * 0.6; ax[i] = px[i]; ay[i] = py[i]; break; }
          const e = curva(Math.min(1, u)), dx = bx[i] - ax[i], dy = by[i] - ay[i], L = Math.hypot(dx, dy) || 1, s = Math.sin(Math.PI * e) * cu[i];
          px[i] = ax[i] + dx * e - (dy / L) * s; py[i] = ay[i] + dy * e + (dx / L) * s;
          if (u >= 1) md[i] = 2;
          break;
        }
        case 2: px[i] = bx[i] + Math.sin(T * 2.1 + ph[i]) * 0.35; py[i] = by[i] + Math.cos(T * 1.7 + ph[i]) * 0.35; break;
        case 3:
          px[i] += vx[i] * dt; py[i] += vy[i] * dt; vx[i] *= 1 - 0.7 * dt; vy[i] = vy[i] * (1 - 0.7 * dt) - 2 * dt;
          break;
        case 4: {
          rr[i] += (rO[i] - rr[i]) * Math.min(1, dt * 1.6 * fuerzaOrbita);
          th[i] += om[i] * dt * (0.25 + fuerzaOrbita) * (140 / Math.max(60, rr[i]));
          px[i] = cxm + Math.cos(th[i]) * rr[i]; py[i] = cym + Math.sin(th[i]) * rr[i] * 0.92;
          break;
        }
      }
    }
  }
  function dibujarParticulas(T, alfaGlobal, brilloExtra) {
    cx.globalCompositeOperation = "lighter";
    for (let i = 0; i < NP; i += salto) {
      const a = al[i] * alfaGlobal * (0.75 + 0.25 * Math.sin(T * 3 + ph[i] * 3)) * (salto > 1 ? 1.25 : 1);
      if (a < 0.01) continue;
      const s = sz[i] * (md[i] === 1 ? 1.5 : md[i] === 4 ? 1.25 : 1) * (1 + brilloExtra) * 3.2;
      cx.globalAlpha = Math.min(1, a);
      cx.drawImage(brillos[col[i]], px[i] - s, py[i] - s, s * 2, s * 2);
    }
    cx.globalCompositeOperation = "source-over";
    cx.globalAlpha = 1;
  }

  // ------------------------------------------------------------------ fondo
  let fondo = null;
  function pintarFondo() {
    fondo = document.createElement("canvas"); fondo.width = cv.width; fondo.height = cv.height;
    const g = fondo.getContext("2d"), R = Math.hypot(W, H) * 0.62;
    g.scale(DPR, DPR);
    const gr = g.createRadialGradient(W / 2, H * 0.46, 0, W / 2, H * 0.5, R);
    gr.addColorStop(0, P.fondo[0]); gr.addColorStop(1, P.fondo[1]);
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    // grano finísimo para que el degradado no tenga escalones
    const n = Math.round((W * H) / 900);
    for (let i = 0; i < n; i++) { g.fillStyle = Math.random() < 0.5 ? "rgba(255,255,255,.018)" : "rgba(0,0,0,.05)"; g.fillRect(Math.random() * W, Math.random() * H, 1, 1); }
  }

  // ------------------------------------------------------------------ composición del verso y de la marca
  let V = null, PLAN = null, LAY = null;
  function componer() {
    pintarFondo();
    const lay = { letras: [], palabras: [], marca: null };
    const cxm = W / 2;
    // Marca
    const fm = lim(Math.min(W / (MOVIL ? 11 : 9.2), H / 7.5), 26, 104);
    const espM = fm * 0.16;
    lay.marca = {
      biex: sprite("BiEx", "500 " + Math.round(fm * 0.2) + "px " + F_RO, P.oro, 6, { esp: fm * 0.2 * 0.55 }),
      titulo: sprite("BIBLIA EXACTA", "500 " + Math.round(fm) + "px " + F_TI, P.oro, fm * 0.16,
        { esp: espM, degradado: [[0, P.nucleo], [0.45, P.luz], [0.62, P.oro], [1, P.oro]], colorHalo: P.oro }),
      lema: sprite("Del griego al español, palabra por palabra", "italic 400 " + Math.round(lim(fm * 0.3, 15, 30)) + "px " + F_TI, P.luz, 5),
      fm,
    };
    lay.marca.y = H * 0.5 + fm * 0.32;
    lay.marca.titulo.x = cxm - lay.marca.titulo.w / 2;
    lay.marca.puntos = puntos(lay.marca.titulo, lay.marca.titulo.x, lay.marca.y, MOVIL ? 1.6 : 2.2, 0, []);
    if (V) {
      // Códice: unciales continuas en renglones de unas 13 letras, como en las columnas de los códices antiguos
      const ws = V.p.map((w) => unciales(w.g));
      const todas = []; ws.forEach((u, j) => Array.from(u).forEach((ch) => todas.push({ ch, j })));
      const N = todas.length, porRenglon = Math.ceil(N / Math.ceil(N / (MOVIL ? 11 : 15)));
      const nR = Math.ceil(N / porRenglon);
      const fc = lim(Math.min((W * 0.78) / (porRenglon * 0.78), (H * 0.42) / (nR * 1.35)), 26, 92);
      lay.fc = fc;
      const fuenteU = "400 " + Math.round(fc) + "px " + F_GR;
      const cache = {}, resU = Math.max(1, lim(Math.min(W / (MOVIL ? 8.5 : 12), H / 9), 24, 66) / fc);
      const glifo = (ch) => cache[ch] || (cache[ch] = sprite(ch, fuenteU, P.luz, fc * 0.14, { colorHalo: P.oro, res: resU }));
      const track = fc * 0.1, alto = fc * 1.38, y0 = H / 2 - ((nR - 1) * alto) / 2 + fc * 0.36;
      for (let r = 0; r < nR; r++) {
        const fila = todas.slice(r * porRenglon, (r + 1) * porRenglon);
        const ancho = fila.reduce((s, l) => s + glifo(l.ch).w, 0) + track * (fila.length - 1);
        let x = cxm - ancho / 2;
        fila.forEach((l) => { const s = glifo(l.ch); lay.letras.push({ ch: l.ch, j: l.j, s, x0: x, y0: y0 + r * alto, k: lay.letras.length }); x += s.w + track; });
      }
      lay.renglones = { nR, alto, y0, ancho: Math.min(W * 0.86, porRenglon * fc * 0.86) };
      // Interlineal: griego, transliteración y traducción, centrado y en varias filas si hace falta
      let fg = lim(Math.min(W / (MOVIL ? 8.5 : 12), H / 9), 24, 66);
      let filas, ok = false;
      for (let intento = 0; intento < 12 && !ok; intento++) {
        const fuenteG = "400 " + Math.round(fg) + "px " + F_GR, fuenteT = "400 " + Math.round(lim(fg * 0.32, 11, 19)) + "px " + F_GR, fuenteE = "italic 400 " + Math.round(lim(fg * 0.46, 14, 30)) + "px " + F_GR;
        lay.palabras = V.p.map((w, j) => {
          const gS = sprite(w.g, fuenteG, P.nucleo, fg * 0.12, { colorHalo: P.oro });
          const uS = sprite(ws[j], "400 " + Math.round(fg) + "px " + F_GR, P.luz, fg * 0.14, { colorHalo: P.oro });
          const tS = sprite(w.tl || "", fuenteT, P.tenue, 0);
          const eS = sprite(glosaPrincipal(w.tr), fuenteE, P.oro, fg * 0.1);
          const ancho = Math.max(gS.w, uS.w, tS.w, eS.w);
          return { j, gS, uS, tS, eS, ancho };
        });
        const gap = fg * 0.75, maxW = W * 0.9;
        filas = []; let fila = [], an = 0;
        lay.palabras.forEach((p) => { if (fila.length && an + gap + p.ancho > maxW) { filas.push(fila); fila = []; an = 0; } an += (fila.length ? gap : 0) + p.ancho; fila.push(p); });
        if (fila.length) filas.push(fila);
        const altoFila = fg * 2.55, altoTotal = filas.length * altoFila;
        ok = (altoTotal <= H * 0.62 && lay.palabras.every((p) => p.ancho <= maxW)) || intento === 11;
        if (!ok) { fg *= 0.9; continue; }
        const yI = H / 2 - altoTotal / 2 + fg * 0.95;
        filas.forEach((f, r) => {
          const anF = f.reduce((s, p) => s + p.ancho, 0) + gap * (f.length - 1);
          let x = cxm - anF / 2;
          f.forEach((p) => { p.cx = x + p.ancho / 2; p.yG = yI + r * altoFila; p.yT = p.yG + fg * 0.62; p.yE = p.yG + fg * 1.28; x += p.ancho + gap; });
        });
        lay.fg = fg;
      }
      // Posición de cada unicial dentro de su palabra ya separada
      lay.palabras.forEach((p, j) => {
        const ls = lay.letras.filter((l) => l.j === j);
        const tot = ls.reduce((s, l) => s + l.s.w, 0), esc2 = p.uS.w / Math.max(1, tot);
        let x = p.cx - p.uS.w / 2;
        ls.forEach((l) => { l.x1 = x; l.y1 = p.yG; l.e1 = (lay.fg / lay.fc); x += l.s.w * esc2; });
      });
      const ref = (V.t ? V.t + " " + V.cap + ":" + V.v + " · " : "") + V.n + " " + V.cap + ":" + V.v;
      lay.ref = sprite(ref, "italic 400 " + Math.round(lim(lay.fg * 0.36, 13, 22)) + "px " + F_GR, P.tenue, 0);
      const primeraY = Math.min(...lay.palabras.map((p) => p.yG));
      lay.refY = Math.max(lim(H * 0.08, 30, 70), primeraY - lay.fg * 1.9);
    }
    LAY = lay;
  }

  // ------------------------------------------------------------------ guion de tiempos
  function planear() {
    const p = {};
    if (MODO === "completa" && V) {
      const N = LAY.letras.length;
      p.linea = [0.5, 2.0];
      p.tinta0 = 2.1; p.tintaDur = lim(N * 0.085, 1.5, 3.2); p.tinta1 = p.tinta0 + p.tintaDur;
      p.t3 = p.tinta1 + 0.9;
      p.separar = [p.t3, p.t3 + 1.25]; p.minus = [p.t3 + 1.3, p.t3 + 2.2];
      p.t3b = p.t3 + 1.95;
      p.palabra = LAY.palabras.map((_, j) => p.t3b + j * 0.58);
      p.t4 = p.palabra[p.palabra.length - 1] + 1.7;
      p.disolver = [p.t4, p.t4 + 0.45]; p.destello = p.t4 + 2.25;
    } else if (MODO === "quieta") {
      p.destello = 0.2;
    } else {
      p.t4 = 0.15; p.disolver = [0, 0]; p.destello = 1.55;
    }
    const D = p.destello;
    p.marca = [D + 0.05, D + 1.05]; p.nitida = [D + 0.6, D + 1.2]; p.brillo = [D + 1.15, D + 2.15];
    p.lema = [D + 1.35, D + 2.15]; p.linea2 = [D + 1.1, D + 1.9];
    p.abrir = D + (MODO === "completa" ? 3.7 : MODO === "quieta" ? 2.6 : 2.5);
    p.abrirDur = MODO === "quieta" ? 0.9 : 1.45;
    p.fin = p.abrir + p.abrirDur;
    PLAN = p;
  }

  // ------------------------------------------------------------------ música (Web Audio, todo sintetizado aquí)
  const semi = (s) => TONO * Math.pow(2, s / 12);
  function partitura() {
    const ev = [], p = PLAN, fin = p.fin + 2.5;
    if (MODO === "completa" && V) {
      ev.push({ t: 0, dur: fin, tipo: "dron" });
      ev.push({ t: 0.2, dur: p.tinta0 + 0.6, tipo: "acorde", n: [-5, 2, 7, 12], v: 0.24, b: 0.7 });
      ev.push({ t: p.tinta0, dur: p.t3 - p.tinta0 + 0.8, tipo: "acorde", n: [0, 3, 7, 14], v: 0.24, b: 0.85 });
      LAY.letras.forEach((l, k) => ev.push({ t: p.tinta0 + (k / Math.max(1, LAY.letras.length - 1)) * p.tintaDur, tipo: "pluma" }));
      const prog = [[-4, 0, 3, 7], [3, 7, 10, 15], [-2, 2, 5, 9], [5, 8, 12, 17]];
      const escala = [0, 3, 5, 7, 10, 12, 15, 17, 19, 22, 24];
      const tramoA = p.t3, tramoB = p.t4;
      const nA = Math.max(2, Math.ceil((tramoB - tramoA) / 2.1)), paso = (tramoB - tramoA) / nA;
      for (let i = 0; i < nA; i++) ev.push({ t: tramoA + i * paso, dur: paso + 1.2, tipo: "acorde", n: prog[i % prog.length], v: 0.2, b: 0.95 });
      p.palabra.forEach((t, j) => ev.push({ t, tipo: "campana", f: semi(12 + escala[(j * 2) % escala.length]), v: 0.16, pan: ((j / Math.max(1, p.palabra.length - 1)) - 0.5) * 0.7 }));
      ev.push({ t: p.t4 + 0.1, dur: p.destello - p.t4, tipo: "acorde", n: [7, 12, 14, 19], v: 0.2, b: 1.1 });
      ev.push({ t: p.t4 + 0.05, dur: p.destello - p.t4 - 0.05, tipo: "subida" });
    } else {
      ev.push({ t: 0, dur: fin, tipo: "dron", v: 0.6 });
      ev.push({ t: 0.05, dur: p.destello + 0.3, tipo: "subida" });
    }
    const D = p.destello;
    ev.push({ t: D, tipo: "golpe" });
    ev.push({ t: D, dur: fin - D, tipo: "acorde", n: [-12, 0, 4, 7, 14, 19], v: 0.22, b: 1.35 });
    [12, 16, 19, 24, 26, 28, 31, 36].forEach((s, i) => ev.push({ t: p.brillo[0] + i * 0.11, tipo: "campana", f: semi(s + 12), v: 0.07, pan: (i % 2 ? 0.35 : -0.35) }));
    ev.push({ t: p.abrir, tipo: "campana", f: semi(24), v: 0.09, pan: 0 });
    return ev;
  }
  let SON = null;
  function crearSonido() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    let ctx;
    try { ctx = new AC({ latencyHint: "playback" }); } catch (e) { try { ctx = new AC(); } catch (e2) { return null; } }
    return montarSonido(ctx, ctx.destination);
  }
  // Separado para poder ensayarlo en un contexto sin tiempo real
  function montarSonido(ctx, salidaFinal) {
    const maestro = ctx.createGain(); maestro.gain.value = 0.0001;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16; comp.knee.value = 14; comp.ratio.value = 3.2; comp.attack.value = 0.008; comp.release.value = 0.35;
    const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 42; hp.Q.value = 0.7;
    maestro.connect(hp); hp.connect(comp); comp.connect(salidaFinal);
    const sr = ctx.sampleRate, nR = Math.floor(sr * 4.6), imp = ctx.createBuffer(2, nR, sr);
    for (let c = 0; c < 2; c++) { const d = imp.getChannelData(c); for (let i = Math.floor(sr * 0.018); i < nR; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / nR, 2.7) * 0.55; }
    const rev = ctx.createConvolver(); rev.buffer = imp;
    const envio = ctx.createGain(); envio.gain.value = 0.85; envio.connect(rev); rev.connect(maestro);
    const seco = ctx.createGain(); seco.gain.value = 0.7; seco.connect(maestro);
    const ruido = ctx.createBuffer(1, sr * 2, sr); { const d = ruido.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    const vivos = [];
    const sale = (nodo, s, h, pan) => {
      let n = nodo;
      if (pan && ctx.createStereoPanner) { const pp = ctx.createStereoPanner(); pp.pan.value = pan; n.connect(pp); n = pp; }
      const a = ctx.createGain(); a.gain.value = s; n.connect(a); a.connect(seco);
      const b = ctx.createGain(); b.gain.value = h; n.connect(b); b.connect(envio);
    };
    const osc = (tipo, f, t, fin) => { const o = ctx.createOscillator(); o.type = tipo; o.frequency.value = f; o.start(t); o.stop(fin); vivos.push(o); return o; };
    const env = (g, t, ataque, nivel, finT, caida) => {
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(nivel, t + ataque);
      g.gain.setValueAtTime(nivel, Math.max(t + ataque, finT - caida)); g.gain.exponentialRampToValueAtTime(0.0001, finT);
    };
    const I = {
      dron(t, dur, e) {
        const fin = t + dur, f = semi(-12), g = ctx.createGain(), lp = ctx.createBiquadFilter();
        lp.type = "lowpass"; lp.frequency.value = 320; lp.Q.value = 0.8;
        const lfo = osc("sine", 0.07, t, fin), lg = ctx.createGain(); lg.gain.value = 110; lfo.connect(lg); lg.connect(lp.frequency);
        [[f, "sawtooth", 0], [f * 1.0035, "sawtooth", 0], [f * 1.4983, "sawtooth", 0], [f, "sine", 0]].forEach(([fr, tp]) => { const o = osc(tp, fr, t, fin); const gg = ctx.createGain(); gg.gain.value = tp === "sine" ? 0.1 : 0.24; o.connect(gg); gg.connect(lp); });
        lp.connect(g); env(g, t, Math.min(3, dur / 3), 0.09 * ((e && e.v) || 1), fin, 2.4);
        sale(g, 0.75, 0.35);
      },
      acorde(t, dur, e) {
        const fin = t + dur, mezcla = ctx.createGain(), g = ctx.createGain();
        const vib = osc("sine", rnd(4.2, 5.2), t, fin), vg = ctx.createGain(); vg.gain.value = 4; vib.connect(vg);
        e.n.forEach((s) => {
          const f = semi(s);
          [-7, 7].forEach((d) => { const o = osc("sawtooth", f, t, fin); o.detune.value = d; vg.connect(o.detune); const gg = ctx.createGain(); gg.gain.value = 0.16; o.connect(gg); gg.connect(mezcla); });
          const tri = osc("triangle", f, t, fin); const gt = ctx.createGain(); gt.gain.value = 0.22; tri.connect(gt); gt.connect(mezcla);
        });
        [[680, 5, 1.3], [1120, 7, 0.7], [2650 * Math.min(1.25, e.b), 9, 0.32 * e.b]].forEach(([fr, q, gn]) => {
          const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = fr; bp.Q.value = q;
          const gg = ctx.createGain(); gg.gain.value = gn; mezcla.connect(bp); bp.connect(gg); gg.connect(g);
        });
        const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 900 * e.b; const gl = ctx.createGain(); gl.gain.value = 0.15; mezcla.connect(lp); lp.connect(gl); gl.connect(g);
        env(g, t, Math.min(1.5, dur / 2.5), (2.8 * e.v) / Math.sqrt(e.n.length / 3), fin, Math.min(2, dur / 2));
        sale(g, 0.5, 0.9);
      },
      campana(t, dur, e) {
        const g = ctx.createGain();
        [[1, 1, 4.6], [2.76, 0.42, 2.6], [5.4, 0.22, 1.4], [8.93, 0.1, 0.8]].forEach(([r, a, d]) => {
          if (e.f * r > ctx.sampleRate * 0.45) return;
          const o = osc("sine", e.f * r, t, t + d + 0.1), gg = ctx.createGain();
          gg.gain.setValueAtTime(0.0001, t); gg.gain.linearRampToValueAtTime(a, t + 0.004); gg.gain.exponentialRampToValueAtTime(0.0001, t + d);
          o.connect(gg); gg.connect(g);
        });
        g.gain.value = e.v;
        sale(g, 0.55, 1.1, e.pan || 0);
      },
      pluma(t) {
        const s = ctx.createBufferSource(); s.buffer = ruido; const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = rnd(3200, 6400); bp.Q.value = 1.8;
        const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.09, t + 0.002); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
        s.connect(bp); bp.connect(g); s.start(t, Math.random()); s.stop(t + 0.07); vivos.push(s);
        sale(g, 0.6, 0.35, rnd(-0.5, 0.5));
      },
      subida(t, dur) {
        const fin = t + dur, s = ctx.createBufferSource(); s.buffer = ruido; s.loop = true;
        const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.Q.value = 1.4; bp.frequency.setValueAtTime(260, t); bp.frequency.exponentialRampToValueAtTime(5200, fin);
        const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.2, fin - 0.04); g.gain.linearRampToValueAtTime(0.0001, fin + 0.03);
        s.connect(bp); bp.connect(g); s.start(t); s.stop(fin + 0.1); vivos.push(s);
        const o = osc("sine", semi(0), t, fin + 0.05); o.frequency.exponentialRampToValueAtTime(semi(24), fin);
        const go = ctx.createGain(); go.gain.setValueAtTime(0.0001, t); go.gain.exponentialRampToValueAtTime(0.05, fin - 0.05); go.gain.linearRampToValueAtTime(0.0001, fin + 0.03); o.connect(go);
        sale(g, 0.6, 0.6); sale(go, 0.5, 0.8);
      },
      golpe(t) {
        const o = osc("sine", 96, t, t + 2); o.frequency.exponentialRampToValueAtTime(36, t + 1.3);
        const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.6, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.9); o.connect(g);
        const s = ctx.createBufferSource(); s.buffer = ruido; const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.setValueAtTime(1800, t); lp.frequency.exponentialRampToValueAtTime(120, t + 0.8);
        const gn = ctx.createGain(); gn.gain.setValueAtTime(0.0001, t); gn.gain.linearRampToValueAtTime(0.45, t + 0.006); gn.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
        s.connect(lp); lp.connect(gn); s.start(t); s.stop(t + 1); vivos.push(s);
        sale(g, 0.9, 0.5); sale(gn, 0.5, 1);
      },
    };
    let EV = [];
    return {
      ctx, maestro,
      cargar(ev) { EV = ev; },
      // Programa todo lo que falta desde el momento «desde» de la presentación
      programar(desde, volumen) {
        const base = ctx.currentTime + 0.05;
        EV.forEach((e) => {
          const dur = e.dur || 0;
          if (e.t < desde - 0.03) {
            if (dur && e.t + dur > desde + 0.6 && (e.tipo === "dron" || e.tipo === "acorde")) I[e.tipo](base, e.t + dur - desde, e);
            return;
          }
          I[e.tipo](base + (e.t - desde), dur, e);
        });
        maestro.gain.cancelScheduledValues(ctx.currentTime);
        maestro.gain.setValueAtTime(Math.max(0.0001, maestro.gain.value), ctx.currentTime);
        maestro.gain.linearRampToValueAtTime(volumen == null ? 1 : volumen, ctx.currentTime + 0.6);
      },
      callar(seg) {
        const t = ctx.currentTime;
        maestro.gain.cancelScheduledValues(t); maestro.gain.setValueAtTime(Math.max(0.0001, maestro.gain.value), t); maestro.gain.linearRampToValueAtTime(0.0001, t + (seg || 0.4));
        setTimeout(() => { vivos.forEach((n) => { try { n.stop(); } catch (e) { /* ya parado */ } }); vivos.length = 0; }, (seg || 0.4) * 1000 + 80);
      },
    };
  }
  window.__biexIntroSonido = { montarSonido, partitura: () => partitura(), plan: () => PLAN };

  // ------------------------------------------------------------------ control de sonido
  let sonando = false, T = 0, fin = false;
  const prefSon = LS.get("biex:intro:sonido", null);
  function marcarSon(on, invitar) {
    btnSon.setAttribute("aria-pressed", on ? "true" : "false");
    btnSon.classList.toggle("pulso", !!invitar);
    btnSon.querySelector("span").textContent = on ? "Sonido" : invitar ? "Activar sonido" : "Sonido";
  }
  function encender(manual) {
    if (sonando || fin) return;
    if (!SON) { SON = crearSonido(); if (!SON) { btnSon.hidden = true; return; } SON.cargar(partitura()); }
    const arrancar = () => {
      if (sonando || fin || SON.ctx.state !== "running") return;
      sonando = true; SON.programar(T); marcarSon(true, false);
    };
    try { const pr = SON.ctx.resume(); if (pr && pr.then) pr.then(arrancar).catch(() => {}); } catch (e) { /* sin permiso aún */ }
    setTimeout(() => { arrancar(); if (!sonando && !manual) marcarSon(false, true); }, 260);
    if (manual) LS.set("biex:intro:sonido", "si");
  }
  function apagar() {
    if (!sonando) { marcarSon(false, false); LS.set("biex:intro:sonido", "no"); return; }
    sonando = false; SON.callar(0.5); setTimeout(() => { try { SON.ctx.suspend(); } catch (e) { /* nada */ } }, 600);
    SON.cargar(partitura()); marcarSon(false, false); LS.set("biex:intro:sonido", "no");
  }
  btnSon.addEventListener("click", (e) => { e.stopPropagation(); if (sonando) apagar(); else { if (SON && SON.ctx.state === "suspended") SON.cargar(partitura()); encender(true); } });
  btnSal.addEventListener("click", (e) => { e.stopPropagation(); terminar(true); });
  // Quien ya eligió sonido lo recupera con cualquier toque
  esc.addEventListener("pointerdown", (e) => { if (prefSon === "si" && !sonando && !(e.target.closest && e.target.closest("button"))) encender(true); });
  const teclas = (e) => { if (e.key === "Escape") { e.preventDefault(); terminar(true); } };
  document.addEventListener("keydown", teclas, true);
  const visibilidad = () => { if (document.hidden && T > 0.4) terminar(true, true); };
  document.addEventListener("visibilitychange", visibilidad);

  // ------------------------------------------------------------------ cuadro por cuadro
  let ultimo = 0, rafId = 0, abrirDesde = null, ultimaFase = -1, listo = false, lento = 0, salto = 1;
  function terminar(rapido, inmediato) {
    if (!PLAN) { cerrarTodo(); return; }
    if (fin) return;
    fin = true;
    ui.classList.add("f");
    host.style.pointerEvents = "none";
    if (sonando && SON) { SON.callar(rapido ? 0.6 : 2.6); }
    if (inmediato) { cerrarTodo(); return; }
    if (rapido) { abrirDesde = { T, dur: 0.75 }; }
  }
  function cerrarTodo() {
    cancelAnimationFrame(rafId);
    document.removeEventListener("keydown", teclas, true);
    document.removeEventListener("visibilitychange", visibilidad);
    window.removeEventListener("resize", alCambiarTam);
    document.documentElement.style.overflow = desborde;
    const c = cortina(); if (c) c.remove();
    setTimeout(() => { if (SON) { try { SON.ctx.close(); } catch (e) { /* nada */ } } }, sonando ? 2800 : 50);
    host.remove();
    try { window.dispatchEvent(new CustomEvent("biex:intro-fin")); } catch (e) { /* nada */ }
  }
  function mascara(p) {
    const w = host.clientWidth, hh = host.clientHeight;
    let m = "";
    if (APERTURA === "iris" || MODO === "quieta") {
      if (MODO === "quieta") { host.style.opacity = String(1 - p); return; }
      const R = Math.hypot(w, hh) * 0.55 * curva(p) * 1.15, b = Math.max(30, Math.min(w, hh) * 0.12);
      m = "radial-gradient(circle at 50% 50%, transparent " + Math.max(0, R - b) + "px, #000 " + (R + 1) + "px)";
    } else if (APERTURA === "puerta") {
      const a = (w / 2) * curva(p) * 1.12, b = Math.max(24, w * 0.06);
      m = "linear-gradient(90deg, #000 " + (w / 2 - a - 1) + "px, transparent " + (w / 2 - a + b) + "px, transparent " + (w / 2 + a - b) + "px, #000 " + (w / 2 + a + 1) + "px)";
      if (a < b) m = "";
    } else {
      host.style.opacity = String(1 - curva(p));
      return;
    }
    host.style.webkitMaskImage = m; host.style.maskImage = m;
  }
  function cuadro(ahora) {
    rafId = requestAnimationFrame(cuadro);
    const dt = ultimo ? Math.min(0.1, (ahora - ultimo) / 1000) : 0.016;
    ultimo = ahora;
    T += dt;
    // si el equipo va lento, se dibujan menos destellos (el tiempo de la presentación no se alarga)
    lento = lento * 0.94 + (dt > 0.034 ? 1 : 0) * 0.06;
    salto = lento > 0.55 ? 3 : lento > 0.3 ? 2 : 1;
    try { pintar(T, dt); } catch (e) { terminar(true, true); }
  }
  function pintar(T, dt) {
    const p = PLAN, cxm = W / 2, cym = H / 2;
    cx.setTransform(DPR, 0, 0, DPR, 0, 0);
    cx.globalAlpha = 1; cx.globalCompositeOperation = "source-over";
    cx.drawImage(fondo, 0, 0, W, H);
    // tiempo de apertura (natural o adelantada al saltar)
    let ab = abrirDesde ? tramo(T, abrirDesde.T, abrirDesde.T + abrirDesde.dur) : tramo(T, p.abrir, p.fin);
    if (!abrirDesde && T >= p.abrir && !fin) { fin = true; ui.classList.add("f"); host.style.pointerEvents = "none"; if (sonando && SON) setTimeout(() => SON && SON.callar(2.4), 900); }
    if (ab > 0) mascara(ab);
    if (ab >= 1) { cerrarTodo(); return; }
    prog.style.transform = "scaleX(" + Math.min(1, T / p.abrir).toFixed(4) + ")";

    const L = LAY;
    // aparición de partículas
    const nace = tramo(T, 0, MODO === "completa" ? 1.6 : 0.5);
    for (let i = 0; i < NP; i++) {
      const objetivo = md[i] === 2 ? (et[i] >= 0 ? 0.5 : alO[i]) : md[i] === 1 ? 0.95 : alO[i];
      al[i] += (objetivo * nace - al[i]) * Math.min(1, dt * 3);
    }
    let fuerza = 0.2, extra = 0;

    if (MODO === "completa" && V) {
      // Acto I · la regla de oro del renglón
      const lA = tramo(T, p.linea[0], p.linea[1]), lB = 1 - tramo(T, p.t3 + 0.2, p.t3 + 1.1);
      if (lA > 0 && lB > 0) {
        const R = L.renglones;
        for (let r = 0; r < R.nR; r++) {
          const y = R.y0 + r * R.alto + L.fc * 0.24, a = curva(tramo(T, p.linea[0] + r * 0.18, p.linea[1] + r * 0.18)) * lB;
          const w = R.ancho * a;
          const gr = cx.createLinearGradient(cxm - w / 2, 0, cxm + w / 2, 0);
          gr.addColorStop(0, P.oro + "00"); gr.addColorStop(0.5, P.oro); gr.addColorStop(1, P.oro + "00");
          cx.globalAlpha = (r === 0 ? 0.55 : 0.28) * a; cx.fillStyle = gr; cx.fillRect(cxm - w / 2, y, w, 1);
        }
        cx.globalAlpha = 1;
      }
      // Acto II · la luz entinta las unciales, letra por letra
      if (T >= p.tinta0 - 1.75 && ultimaFase < 1) {
        ultimaFase = 1;
        const dest = [];
        L.letras.forEach((l) => puntos(l.s, l.x0, l.y0, MOVIL ? 1.4 : 1.8, l.k, dest));
        const nL = L.letras.length;
        enviar(dest, T, (k) => p.tinta0 + (k / Math.max(1, nL - 1)) * p.tintaDur, 1.25, 0.82);
      }
      // Acto III · el códice se abre en palabras
      if (T >= p.t3 && ultimaFase < 2) {
        ultimaFase = 2;
        for (let i = 0; i < NP; i++) if (md[i] === 2 || md[i] === 1) { soltar(i, rnd(30, 110)); alO[i] = rnd(0.06, 0.26); }
      }
      const sep = curva(tramo(T, p.separar[0], p.separar[1]));
      const dis = tramo(T, p.disolver[0], p.disolver[1]);
      const visT = 1 - dis;
      if (T < p.minus[1] + 1 && visT > 0) {
        if (sep < 1) {
          const nL = Math.max(1, L.letras.length - 1);
          L.letras.forEach((l) => {
            const tk = p.tinta0 + (l.k / nL) * p.tintaDur, aparece = tramo(T, tk - 0.05, tk + 0.35);
            if (aparece <= 0) return;
            const x = l.x0 + (l.x1 - l.x0) * sep, y = l.y0 + (l.y1 - l.y0) * sep, e = 1 + (l.e1 - 1) * sep;
            ponerSprite(l.s, x, y, aparece * visT, e);
          });
        } else {
          L.palabras.forEach((pal, j) => {
            const mj = tramo(T, p.minus[0] + j * 0.1, p.minus[0] + j * 0.1 + 0.7);
            ponerSprite(pal.uS, pal.cx - pal.uS.w / 2, pal.yG, (1 - mj) * visT);
          });
        }
      }
      if (T >= p.minus[0]) {
        L.palabras.forEach((pal, j) => {
          const mj = sep < 1 ? 0 : tramo(T, p.minus[0] + j * 0.1, p.minus[0] + j * 0.1 + 0.7);
          if (mj > 0) ponerSprite(pal.gS, pal.cx - pal.gS.w / 2, pal.yG, mj * visT);
          const pj = tramo(T, p.palabra[j], p.palabra[j] + 0.7), sube = (1 - salida(pj)) * 10;
          if (pj > 0) {
            ponerSprite(pal.tS, pal.cx - pal.tS.w / 2, pal.yT + sube * 0.5, pj * 0.9 * visT);
            ponerSprite(pal.eS, pal.cx - pal.eS.w / 2, pal.yE + sube, pj * visT);
            const w = Math.min(pal.ancho, L.fg * 1.4) * salida(pj);
            cx.globalAlpha = 0.5 * visT; cx.fillStyle = P.oro; cx.fillRect(pal.cx - w / 2, pal.yG + L.fg * 0.3, w, 1);
          }
          // destello breve de cada palabra al recibir su traducción
          const fl = tramo(T, p.palabra[j], p.palabra[j] + 0.25) * (1 - tramo(T, p.palabra[j] + 0.25, p.palabra[j] + 1));
          if (fl > 0) {
            const g = cx.createRadialGradient(pal.cx, pal.yG - L.fg * 0.3, 0, pal.cx, pal.yG - L.fg * 0.3, L.fg * 1.6);
            g.addColorStop(0, P.luz + "55"); g.addColorStop(1, P.luz + "00");
            cx.globalAlpha = fl * visT; cx.globalCompositeOperation = "lighter"; cx.fillStyle = g; cx.fillRect(pal.cx - L.fg * 1.6, pal.yG - L.fg * 1.9, L.fg * 3.2, L.fg * 3.2); cx.globalCompositeOperation = "source-over";
          }
        });
        const rf = tramo(T, p.minus[0], p.minus[1]);
        ponerSprite(L.ref, cxm - L.ref.w / 2, L.refY, rf * 0.85 * visT);
      }
      // Acto IV · todo se vuelve luz y gira
      if (T >= p.t4 && ultimaFase < 3) {
        ultimaFase = 3;
        const dest = [];
        L.palabras.forEach((pal) => { puntos(pal.gS, pal.cx - pal.gS.w / 2, pal.yG, 2.4, 0, dest); puntos(pal.eS, pal.cx - pal.eS.w / 2, pal.yE, 2.6, 0, dest); });
        const n = dest.length / 3;
        for (let i = 0; i < NP; i++) {
          if (n && Math.random() < 0.85) { const j = Math.floor(Math.random() * n); px[i] = dest[j * 3]; py[i] = dest[j * 3 + 1]; al[i] = 0.9; }
        }
        orbitar(T, Math.min(W, H) * 0.3);
        for (let i = 0; i < NP; i++) rr[i] = Math.hypot(px[i] - cxm, py[i] - cym);
      }
      if (T >= p.t4) { fuerza = 0.15 + 2.2 * tramo(T, p.t4 + 0.3, p.destello); extra = 0.3 * tramo(T, p.t4, p.destello); }
    } else if (MODO === "breve") {
      if (ultimaFase < 3) { ultimaFase = 3; orbitar(T, Math.min(W, H) * 0.28); }
      fuerza = 0.4 + 2.4 * tramo(T, 0.2, p.destello); extra = 0.35 * tramo(T, 0, p.destello);
    }

    // Acto IV-V · destello y la marca
    if (MODO !== "quieta" && T >= p.destello && ultimaFase < 4) {
      ultimaFase = 4;
      enviar(L.marca.puntos, T, () => p.marca[1], p.marca[1] - p.destello, 0.9);
    }
    if (MODO !== "quieta") {
      moverParticulas(T, dt, fuerza);
      const desv = T > p.abrir ? 1 - tramo(T, p.abrir, p.abrir + 0.8) : 1;
      const tras = T > p.nitida[1] ? 1 - 0.55 * tramo(T, p.nitida[1], p.nitida[1] + 1) : 1;
      dibujarParticulas(T, desv * tras, extra);
    }
    // anillo de luz antes del destello
    if (MODO !== "quieta" && T > (p.t4 || 0) && T < p.destello + 0.2) {
      const a = tramo(T, (p.t4 || 0) + 0.4, p.destello) * (1 - tramo(T, p.destello, p.destello + 0.2));
      if (a > 0) {
        const R = Math.min(W, H) * 0.3, g = cx.createRadialGradient(cxm, cym, R * 0.2, cxm, cym, R * 1.3);
        g.addColorStop(0, P.luz + "00"); g.addColorStop(0.75, P.luz + "22"); g.addColorStop(1, P.luz + "00");
        cx.globalCompositeOperation = "lighter"; cx.globalAlpha = a; cx.fillStyle = g; cx.fillRect(0, 0, W, H); cx.globalCompositeOperation = "source-over";
      }
    }
    // destello
    const fl = MODO === "quieta" ? 0 : tramo(T, p.destello - 0.06, p.destello) * (1 - tramo(T, p.destello, p.destello + 0.9));
    if (fl > 0) {
      const g = cx.createRadialGradient(cxm, cym, 0, cxm, cym, Math.hypot(W, H) * 0.42);
      g.addColorStop(0, P.nucleo); g.addColorStop(0.18, P.luz + "cc"); g.addColorStop(0.5, P.oro + "33"); g.addColorStop(1, P.oro + "00");
      cx.globalCompositeOperation = "lighter"; cx.globalAlpha = Math.pow(fl, 1.6) * 0.9; cx.fillStyle = g; cx.fillRect(0, 0, W, H); cx.globalCompositeOperation = "source-over";
    }
    // marca nítida, su filete y su lema
    const M = L.marca, nit = tramo(T, p.nitida[0], p.nitida[1]);
    const crece = 1 + 0.06 * curva(ab);
    if (nit > 0) {
      ponerSprite(M.titulo, cxm - (M.titulo.w * crece) / 2, M.y, nit, crece);
      const br = tramo(T, p.brillo[0], p.brillo[1]);
      if (br > 0 && br < 1 && MODO !== "quieta" && ab === 0) {
        // reflejo que recorre las letras
        const s = M.titulo;
        if (!M.reflejo) { M.reflejo = document.createElement("canvas"); M.reflejo.width = s.c.width; M.reflejo.height = s.c.height; }
        const rg = M.reflejo.getContext("2d"), wpx = s.c.width, hpx = s.c.height, xb = (wpx + hpx) * br - hpx;
        rg.globalCompositeOperation = "source-over"; rg.clearRect(0, 0, wpx, hpx); rg.drawImage(s.c, 0, 0);
        rg.globalCompositeOperation = "source-in";
        const g = rg.createLinearGradient(xb, 0, xb + hpx * 0.8, hpx * 0.25);
        g.addColorStop(0, "rgba(255,255,255,0)"); g.addColorStop(0.5, "rgba(255,255,255,1)"); g.addColorStop(1, "rgba(255,255,255,0)");
        rg.fillStyle = g; rg.fillRect(0, 0, wpx, hpx);
        cx.globalCompositeOperation = "lighter";
        ponerSprite({ c: M.reflejo, pad: s.pad, asc: s.asc, an: s.an, al: s.al }, cxm - s.w / 2, M.y, 0.9 * Math.sin(Math.PI * br));
        cx.globalCompositeOperation = "source-over";
      }
      const bi = tramo(T, p.lema[0] - 0.3, p.lema[1] - 0.3);
      ponerSprite(M.biex, cxm - M.biex.w / 2, M.y - M.fm * 1.02 - (1 - salida(bi)) * 6, bi * 0.9);
      const li = curva(tramo(T, p.linea2[0], p.linea2[1])), lw = Math.min(W * 0.6, M.titulo.w * 0.42) * li;
      if (li > 0) {
        const gr = cx.createLinearGradient(cxm - lw / 2, 0, cxm + lw / 2, 0);
        gr.addColorStop(0, P.oro + "00"); gr.addColorStop(0.5, P.oro); gr.addColorStop(1, P.oro + "00");
        cx.globalAlpha = 0.8; cx.fillStyle = gr; cx.fillRect(cxm - lw / 2, M.y + M.fm * 0.36, lw, 1);
      }
      const le = tramo(T, p.lema[0], p.lema[1]);
      ponerSprite(M.lema, cxm - M.lema.w / 2, M.y + M.fm * 0.36 + M.lema.asc + M.fm * 0.32 + (1 - salida(le)) * 8, le);
    }
    cx.globalAlpha = 1;
    // borde de luz de la apertura
    if (ab > 0 && ab < 1 && APERTURA === "iris" && MODO !== "quieta") {
      const R = Math.hypot(W, H) * 0.55 * curva(ab) * 1.15;
      cx.globalCompositeOperation = "lighter"; cx.globalAlpha = 0.5 * (1 - ab);
      cx.strokeStyle = P.luz; cx.lineWidth = 2; cx.beginPath(); cx.arc(cxm, cym, Math.max(1, R), 0, 6.283); cx.stroke();
      cx.globalCompositeOperation = "source-over"; cx.globalAlpha = 1;
    }
    if (!listo) { listo = true; const c = cortina(); if (c) c.remove(); }
  }
  let reloj = 0;
  function alCambiarTam() {
    clearTimeout(reloj);
    reloj = setTimeout(() => {
      if (fin) return;
      const k = escala(), w = Math.round(host.clientWidth * k), h = Math.round(host.clientHeight * k);
      if (Math.abs(w - W) > 40 || Math.abs(h - H) > H * 0.25) terminar(true);
    }, 150);
  }
  window.addEventListener("resize", alCambiarTam);

  // ------------------------------------------------------------------ arranque
  (async function () {
    try {
      const [, lista] = await Promise.all([fuentes, datos]);
      if (MODO === "completa") {
        V = elegirVerso(lista);
        if (!V) MODO = "breve";
      }
      componer();
      planear();
      sr.textContent = "BiEx – Biblia Exacta. " + (V ? V.n + " " + V.cap + ":" + V.v + ": " + V.p.map((w) => w.g + " (" + glosaPrincipal(w.tr) + ")").join(" ") + ". " : "") + "Del griego al español, palabra por palabra.";
      ui.classList.add("v");
      if (MODO === "quieta") btnSon.hidden = true;
      else if (prefSon !== "no") encender(false);
      else marcarSon(false, false);
      try { btnSal.focus({ preventScroll: true }); } catch (e) { /* nada */ }
      rafId = requestAnimationFrame(cuadro);
    } catch (e) {
      cerrarTodo();
    }
  })();
  setTimeout(() => { if (!listo) cerrarTodo(); }, 9000);
})();
