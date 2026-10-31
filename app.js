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
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  // Las transliteraciones (ā, ḥ, ʿ, letras griegas mezcladas…) no deben pasar a mayúsculas en los rótulos: se envuelven en .np
  const RE_NP = /[\u0100-\u024f\u02b0-\u02ff\u0300-\u036f\u1e00-\u1eff]|[A-Za-z][\u0370-\u03ff\u1f00-\u1fff]|[\u0370-\u03ff\u1f00-\u1fff][A-Za-z]/;
  const SIN_NP = /^(option|title|textarea|script|style|select|input)$/i;
  const textoNp = (t) => String(t).split(/(\S*(?:[\u0100-\u024f\u02b0-\u02ff\u0300-\u036f\u1e00-\u1eff]|[A-Za-z][\u0370-\u03ff\u1f00-\u1fff]|[\u0370-\u03ff\u1f00-\u1fff][A-Za-z])\S*)/).filter(Boolean)
    .map((x) => { if (!RE_NP.test(x)) return document.createTextNode(x); const sp = document.createElement("span"); sp.className = "np"; sp.textContent = x; return sp; });
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
    video: '<rect x="3" y="4.5" width="18" height="12" rx="2.2" ' + L1 + '/><path d="M9 20h6M12 16.5V20" ' + L1 + '/><path d="M10.4 8.2v4.6l4-2.3z" fill="currentColor"/>',
    comunidad: '<circle cx="9" cy="8.4" r="3" ' + L1 + '/><path d="M3.6 19c.6-3.3 2.8-5.1 5.4-5.1s4.8 1.8 5.4 5.1" ' + L1 + '/><circle cx="16.8" cy="9.3" r="2.4" ' + L1 + '/><path d="M15.6 14.1c2.4-.3 4.4 1.3 5 4.4" ' + L1 + '/>',
    externo: '<path d="M13.5 4.5H19.5V10.5" ' + L1 + '/><path d="M19.5 4.5L11 13" ' + L1 + '/><path d="M18 14.2v4a1.8 1.8 0 0 1-1.8 1.8H5.8A1.8 1.8 0 0 1 4 18.2V7.8A1.8 1.8 0 0 1 5.8 6h4" ' + L1 + '/>',
    buscar: '<circle cx="11" cy="11" r="6.5" ' + L1 + '/><path d="M20 20l-4.2-4.2" ' + L1 + '/>',
    tema: '<circle cx="12" cy="12" r="8.2" ' + L1 + '/><path d="M12 3.8a8.2 8.2 0 0 1 0 16.4z" fill="currentColor"/>',
    izq: '<path d="M14.5 5.5L8 12l6.5 6.5" ' + L1 + '/>',
    der: '<path d="M9.5 5.5L16 12l-6.5 6.5" ' + L1 + '/>',
    abajo: '<path d="M6.5 9.5L12 15l5.5-5.5" ' + L1 + '/>',
    chispa: '<path d="M12 3.2l1.9 5.4 5.4 1.9-5.4 1.9L12 17.8l-1.9-5.4-5.4-1.9 5.4-1.9z" ' + L1 + '/><path d="M18.6 15.4l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z" ' + L1 + '/>',
    balanza: '<path d="M12 4v16M7 20h10M5 7h14M12 4.5v2.5" ' + L1 + '/><path d="M5 7l-2.6 6.2a2.8 2.8 0 0 0 5.2 0zM19 7l-2.6 6.2a2.8 2.8 0 0 0 5.2 0z" ' + L1 + '/>',
    marca: '<path d="M5.5 12.5l4.2 4.2L18.5 7.8" ' + L1 + '/>',
    cerrar: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11" ' + L1 + '/>',
    atras: '<path d="M10 6l-6 6 6 6M4.5 12H20" ' + L1 + '/>',
    externo: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" ' + L1 + '/>',
    rejilla: '<rect x="4" y="4" width="6.5" height="6.5" rx="1.2" ' + L1 + '/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.2" ' + L1 + '/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.2" ' + L1 + '/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.2" ' + L1 + '/>',
    libro: '<path d="M4 5.5C6.5 4.2 9.5 4.2 12 6c2.5-1.8 5.5-1.8 8-.5V19c-2.5-1.3-5.5-1.3-8 .5-2.5-1.8-5.5-1.8-8-.5z M12 6v13.5" ' + L1 + '/>',
    lupa: '<circle cx="10" cy="10" r="5.5" ' + L1 + '/><path d="M14 14l5.5 5.5M7.5 10h5M10 7.5v5" ' + L1 + '/>',
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
    pausa: '<path d="M9 6v12M15 6v12" ' + L1 + '/>',
    play: '<path d="M8 5.5l11 6.5-11 6.5z" ' + L1 + '/>',
    marcador: '<path d="M7 4h10a.5.5 0 0 1 .5.5V20l-5.5-4-5.5 4V4.5A.5.5 0 0 1 7 4z" ' + L1 + '/>',
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
  };
  const fmt = (n) => Number(n).toLocaleString("es");
  const pct = (x) => (x >= 10 ? x.toFixed(1) : x.toFixed(2)).replace(".", ",") + " %";
  const store = {
    get(k, d) { try { const v = localStorage.getItem("biex:" + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem("biex:" + k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento */ } },
  };
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

  // ------------------------------------------------------------------ datos
  const cache = {};
  let baseOk = 0;
  function traer(ruta, k) {
    return fetch(BASES[k] + ruta).then((r) => { if (!r.ok) throw new Error(r.status); baseOk = k; return r.json(); })
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
          m.set(c + ":" + x.v, { p, entero: !!(x.x && x.x[0] && x.x[0][0] === 0), ini: c === c0 && x.v === v0, fin: c === c1 && x.v === v1 });
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
  async function versoTokens(c, cap, v) {
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
    orden: "crono", cor: "todas", ed: true, par: true, ang: true, sup: true, nivel: "", msEsp: false }, store.get("prefs", {}));
  const guardarPrefs = () => store.set("prefs", prefs);
  const aplicarEd = () => document.documentElement.classList.toggle("ed", !!prefs.ed);
  aplicarEd();
  const AP0 = { tam: 3, letra: "clasica", inter: "normal", mov: "si", v: 9 };
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
    if (typeof MET !== "undefined" && MET) MET.despertar();
  }
  aplicarAp();
  const temaActual = () => document.documentElement.getAttribute("data-theme") || "dark";
  function ponerTema(t) { document.documentElement.setAttribute("data-theme", t); store.set("tema", t); }
  let avisoT = null;
  function avisar(txt) {
    let el = $(".aviso-flot");
    if (!el) { el = h("div", { class: "aviso-flot", role: "status" }); document.body.append(el); }
    el.textContent = txt; el.classList.add("si");
    clearTimeout(avisoT); avisoT = setTimeout(() => el.classList.remove("si"), 2200);
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
  const F = { M: 1, C: 2, IT: 4, NG: 8, COR: 16, ALT: 32, PAR: 64, ANG: 128, SUP: 256, OCU: 512, HE: 1024, AN: 2048 };
  const VOLADA = /[ʰ-˿ᴬ-ᶿ⁰-₟]/;
  function rasgos(t, esBase, x) {
    const n = t.length, f = new Uint16Array(n);
    for (const [a, z] of (x && x.m) || []) for (let i = a; i < z && i < n; i++) f[i] |= F.M;
    for (const [a, z] of (x && x.c) || []) for (let i = a; i < z && i < n; i++) f[i] |= F.C;
    for (const [a, z] of (x && x.x) || []) for (let i = a; i < z && i < n; i++) f[i] |= F.AN;
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
    let cierreUlt = -2, cierreProf = -1;
    for (let i = 0; i < n; i++) {
      const ch = t[i];
      if (ch === "⟪") { const z = t.indexOf("⟫", i); if (z > 0) { i = z; continue; } }
      if (ch === "[") {
        let j = i - 1; while (j >= 0 && saltable(t[j])) j--;
        const alt = j >= 0 && j === cierreUlt && cierreProf === pila.length;
        pila.push({ a: i, alt });
      } else if (ch === "]" && pila.length) {
        const g = pila.pop();
        let a = g.a; if (a > 0 && t[a - 1] === " ") a--;
        for (let k = a; k <= i; k++) f[k] |= F.COR | (g.alt ? F.ALT : 0);
        cierreUlt = i; cierreProf = pila.length;
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
    if ((b & F.COR) && (cor === "base" || (cor === "primera" && (b & F.ALT)))) return true;
    if ((b & F.PAR) && prefs.par === false) return true;
    if ((b & F.ANG) && prefs.ang === false) return true;
    if ((b & F.SUP) && prefs.sup === false) return true;
    return false;
  }
  const CLASES = [[F.M, "tm"], [F.C, "tc"], [F.IT, "it"], [F.NG, "ng"], [F.COR, "tk"], [F.HE, "he"], [F.AN, "ta"]];
  // x: el verso (con sus tramos m y c); en el texto base, ⟪…⟫ es griego aún sin traducción fijada
  function textoLectura(t, esBase, x) {
    t = String(t || "");
    const f = rasgos(t, esBase, x);
    const frag = document.createDocumentFragment();
    let clave = -1, cont = null, buf = "", prevEsp = true;
    const vaciar = () => { if (buf) { cont.append(buf); buf = ""; } };
    const abrir = (k) => {
      vaciar();
      if (k === clave && cont) return;
      clave = k;
      const cls = CLASES.filter(([bit]) => k & bit).map(([, c]) => c);
      if (!cls.length) { cont = frag; return; }
      cont = h(k & F.HE ? "bdi" : "span", { class: cls.join(" "), lang: k & F.HE ? "he" : null });
      frag.append(cont);
    };
    const visual = (b) => b & (F.M | F.C | F.IT | F.NG | F.COR | F.HE | F.AN);
    for (let i = 0; i < t.length; i++) {
      const b = f[i];
      if (t[i] === "⟪" && esBase) {
        const z = t.indexOf("⟫", i);
        if (z > 0) {
          if (!oculto(b)) { abrir(visual(b)); vaciar(); cont.append(spanGk(t.slice(i + 1, z), { class: "gr" })); prevEsp = false; }
          i = z; continue;
        }
      }
      if (oculto(b)) continue;
      const ch = t[i];
      if (ch === " " && prevEsp) continue; // sin espacios dobles al ocultar
      abrir(visual(b));
      buf += ch; prevEsp = ch === " ";
    }
    vaciar();
    return frag;
  }
  // Lectura organizada: los versos de texto base con el orden reorganizado (o, om, oc) cuando existe
  const txtVerso = (L) => (prefs.lorg && L.o ? textoLectura(L.o, !!L.g, { m: L.om, c: L.oc, x: L.ox, g: L.g, n: L.n, v: L.v }) : textoLectura(L.t, !!L.g, L));
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
    ["crono", "Cronológico", () => "Primero los relatos de la vida de YēshŪ́ʿa, según el primer acontecimiento que narra cada uno; luego " + nombreLibro(libroDe("ACT")) + ", las cartas en el orden en que se escribieron y, al final, " + nombreLibro(libroDe("REV")) + "."],
    ["escritura", "Por escritura", "Cada libro en el orden en que se escribió, con su fecha aproximada: todos, antes del año 70."],
    ["tradicional", "Tradicional", "El orden habitual en espurias Biblias impresas."]];
  const ordenActivo = () => (CRONO && CRONO.ordenes[prefs.orden] ? prefs.orden : "tradicional");
  const nombreOrden = () => ({ crono: "en orden cronológico", escritura: "por fecha de escritura", tradicional: "en el orden tradicional" })[ordenActivo()];
  function librosEnOrden() { const k = ordenActivo(); return k === "tradicional" ? D.libros : CRONO.ordenes[k].map(libroDe).filter(Boolean); }
  const numLibro = (b) => librosEnOrden().indexOf(b) + 1;
  // En rótulos en mayúsculas, las palabras con signos (YēshŪ́ʿa) se dejan en su forma para no deformar los diacríticos
  const protegerMay = (t) => String(t).split(/(\S*[\u0300-\u036f\u02b0-\u02ff]\S*)/).filter(Boolean).map((x) => (/[\u0300-\u036f\u02b0-\u02ff]/.test(x) ? h("span", { class: "np", text: x }) : x));
  const fechaEscrito = (b) => (CRONO && CRONO.libros[b.c] ? CRONO.libros[b.c].e || "" : "");
  const fechaNarra = (b) => (CRONO && CRONO.libros[b.c] ? CRONO.libros[b.c].n || "" : "");
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
  var MET = null; // var: la apariencia se aplica antes de esta línea (sin zona muerta)
  const RP = { inm: null, clave: null, objetivo: null, guardar: true, t: 0, ts: 0, tg: 0, forzar: null, previa: null, actual: null, ancla: null, anclaSig: null };
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
    if (esLista(RP.actual)) MEMLIB = { h: RP.actual, y, k: RP.clave };
    persistirPos();
  }
  window.addEventListener("scroll", () => {
    if (!RP.guardar || RP.tg) return;
    RP.tg = setTimeout(() => { RP.tg = 0; anotarPos(); }, 140);
  }, { passive: true });
  // salto inmediato (sin el desplazamiento suave de la página)
  const saltarA = (y) => { try { window.scrollTo({ top: y, left: 0, behavior: "instant" }); } catch (e) { window.scrollTo(0, y); } };
  // Ancla de lectura: el verso que está arriba en pantalla (y qué parte de él); al cambiar de modo, de disposición,
  // de filtro, de tamaño o de letra, la vista vuelve a ese mismo verso en lugar de saltar al encabezado
  const bordeSup = () => { let y = 0; for (const el of document.querySelectorAll(".barra, .barra-hoja")) { const r = el.getBoundingClientRect(); if (r.height && getComputedStyle(el).position === "sticky") y = Math.max(y, r.bottom); } return y; };
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
  function yDeAncla(a) {
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
    let y = null;
    const ancla = RP.anclaSig; RP.anclaSig = null; RP.ancla = null;
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
  function velar(si) {
    clearTimeout(tVelo);
    document.documentElement.classList.toggle("volviendo", !!si);
    if (si) tVelo = setTimeout(() => document.documentElement.classList.remove("volviendo"), 900);
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
    if (haciaArriba) { pop.style.bottom = (vh - r.top + 6) + "px"; pop.classList.add("arriba"); } else pop.style.top = (r.bottom + 6) + "px";
    btn.setAttribute("aria-expanded", "true");
    menuAbierto = { sel, btn, pop };
    const actual = pop.querySelector('[aria-selected="true"]') || pop.querySelector(".mm-op");
    if (actual) { actual.scrollIntoView({ block: "nearest" }); actual.focus({ preventScroll: true }); }
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
  const modal = h("dialog", { class: "modal", "aria-label": "Detalle" });
  // Cada ventana (y cada paso dentro de ella) deja un paso en el historial: el botón atrás del teléfono o del navegador
  // vuelve un paso o cierra la ventana, igual que ×, Esc, tocar fuera o deslizar hacia abajo la cabecera.
  const M = { pila: [], nav: null, alCerrar: null, estados: 0, saltando: false, destino: null, porHistoria: false, porRuta: false };
  modal.addEventListener("click", (e) => { if (e.target === modal) cerrarModal(); });
  // Memoria de cada ventana: dónde quedó su desplazamiento (por título) y, si se salió de ella por un enlace,
  // la ventana entera, para reabrirla igual al volver atrás
  const MS = (() => { try { return JSON.parse(sessionStorage.getItem("biex:ms") || "{}"); } catch (e) { return {}; } })();
  const VENT = new Map(); let vidN = 0;
  const claveM = () => { const t = $(".m-tit b", modal); return t ? t.textContent : ""; };
  function guardarScrollM() {
    const c = $(".m-cuerpo", modal), k = claveM(); if (!c || !k || !modal.open || !c.clientHeight) return;
    MS[k] = Math.round(c.scrollTop);
    try { sessionStorage.setItem("biex:ms", JSON.stringify(MS)); } catch (e) { /* sin almacenamiento */ }
  }
  let tScrollM = 0, toqueM = 0;
  modal.addEventListener("scroll", () => { if (!tScrollM) tScrollM = setTimeout(() => { tScrollM = 0; guardarScrollM(); }, 150); }, true);
  for (const ev of ["touchstart", "wheel"]) modal.addEventListener(ev, () => { toqueM = performance.now(); }, { passive: true, capture: true });
  function restaurarScrollM() {
    const k = claveM(), y = MS[k]; if (!y) return;
    const t0 = performance.now();
    const intento = () => { const c = $(".m-cuerpo", modal); if (!c || claveM() !== k || toqueM > t0) return; c.scrollTop = y; };
    intento(); requestAnimationFrame(intento); for (const ms of [120, 350, 800, 1500]) setTimeout(intento, ms);
  }
  modal.addEventListener("close", () => {
    if (modal.open) return;
    document.documentElement.classList.remove("con-modal");
    if (M.porRuta && M.vid && M.pila.length) VENT.set(M.vid, { pila: M.pila.slice(), estados: M.estados });
    M.pila = []; M.nav = null;
    const f = M.alCerrar; M.alCerrar = null;
    if (f) f();
    if (M.estados > 0 && !M.porHistoria && !M.porRuta) {
      const n = M.estados; M.estados = 0; M.destino = location.href; M.saltando = true;
      try { history.go(-n); } catch (e) { M.saltando = false; }
    } else M.estados = 0;
    M.porHistoria = false; M.porRuta = false;
  });
  function marcarPaso() { try { const vid = ++vidN; history.pushState(Object.assign({}, history.state || {}, { biexVentana: 1, vid }), "", location.href); M.estados++; M.vid = vid; pasoAdelante(true); } catch (e) { /* sin historial (marco sin permiso) */ } }
  window.addEventListener("popstate", (e) => {
    if (M.saltando) {
      M.saltando = false;
      if (M.destino && M.destino !== location.href) { try { history.replaceState(null, "", M.destino); } catch (er) { /* ignorar */ } }
      M.destino = null;
      return;
    }
    if (modal.open && !e.state) return; // enlace seguido desde la ventana (paso nuevo, sin estado): lo atiende la ruta
    if (modal.open) {
      if (M.estados > 0) M.estados--;
      if (M.pila.length > 1) { M.pila.pop(); M.vid = e.state && e.state.vid; pintarModal(); return; }
      M.porHistoria = true; cerrarModal(); return;
    }
    // un paso de una ventana cerrada al seguir un enlace desde ella: se reabre tal como estaba; si no se conoce, se salta
    if (e.state && e.state.biexVentana) {
      const g = VENT.get(e.state.vid);
      if (g) {
        M.pila = g.pila.slice(); M.estados = g.estados; M.vid = e.state.vid; M.reabierta = performance.now();
        pintarModal();
        try { modal.showModal(); } catch (er) { modal.setAttribute("open", ""); }
        document.documentElement.classList.add("con-modal");
        return;
      }
      try { history.back(); } catch (er) { /* ignorar */ }
    }
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
  modal.addEventListener("keydown", (e) => {
    if (e.target && /input|select|textarea/i.test(e.target.tagName)) return;
    if (!M.nav) return;
    if (e.key === "ArrowLeft" && M.nav.prev) { e.preventDefault(); M.nav.prev(); }
    if (e.key === "ArrowRight" && M.nav.next) { e.preventDefault(); M.nav.next(); }
  });
  function pintarModal() {
    const fn = M.pila[M.pila.length - 1];
    if (!fn) return;
    M.nav = null;
    if (modal.open) guardarScrollM();
    modal.replaceChildren(fn());
    const c = $(".m-cuerpo", modal); if (c) c.scrollTop = 0;
    restaurarScrollM();
  }
  function abrirModal(fn, alCerrar) {
    if (modal.open && M.alCerrar && M.alCerrar !== alCerrar) { const f = M.alCerrar; M.alCerrar = null; f(); }
    M.pila = [fn]; M.alCerrar = alCerrar || null;
    pintarModal();
    if (!modal.open) {
      try { modal.showModal(); } catch (e) { modal.setAttribute("open", ""); }
      document.documentElement.classList.add("con-modal");
      marcarPaso();
    }
    const foco = $(".m-cab .btn-icono:last-child", modal); if (foco) foco.focus({ preventScroll: true });
  }
  const empujar = (fn) => { M.pila.push(fn); pintarModal(); marcarPaso(); };
  const volver = () => {
    if (M.pila.length <= 1) return;
    if (M.estados > 0) { try { history.back(); return; } catch (e) { /* sigue abajo */ } }
    M.pila.pop(); pintarModal();
  };
  const reemplazar = (fn) => { M.pila[M.pila.length - 1] = fn; pintarModal(); };
  modal.addEventListener("cancel", () => { guardarScrollM(); salidaModal(); });
  // La ventana se va con un fundido suave: una copia quieta se desvanece encima mientras la de verdad se cierra al instante
  // (así ninguna lógica de historial espera a la animación)
  function salidaModal() {
    if (ap.mov === "no" || (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches)) return;
    try {
      const r = modal.getBoundingClientRect(), caja = modal.firstElementChild;
      if (!caja || !r.width || !r.height) return;
      const cs = getComputedStyle(modal);
      const velo = h("div", { class: "modal-velo-sale", "aria-hidden": "true" }), f = h("div", { class: "modal-sale", "aria-hidden": "true" });
      f.style.cssText = "left:" + r.left + "px;top:" + r.top + "px;width:" + r.width + "px;height:" + r.height + "px;border-radius:" + cs.borderRadius + ";background:" + cs.backgroundColor + ";border:" + cs.borderTopWidth + " solid " + cs.borderTopColor + ";box-shadow:" + cs.boxShadow;
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
      M.pila.length > 1 ? h("button", { class: "btn-icono", type: "button", "aria-label": "Volver", title: "Volver", onclick: volver }, svg(ICO.atras)) : null,
      h("div", { class: "m-tit" }, h("b", { text: tit }), sub ? h("small", { text: sub }) : null),
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
  async function compartir(titulo, texto, hh) {
    const url = enlacePublico(hh);
    try { if (navigator.share) { await navigator.share({ title: titulo, text: titulo + " — " + texto, url }); return; } } catch (e) { if (e && e.name === "AbortError") return; }
    try { await navigator.clipboard.writeText(titulo + " — " + texto + "\n" + url); avisar("Verso y enlace copiados"); }
    catch (e) { avisar("No se pudo copiar; el enlace es " + url); }
  }

  // ------------------------------------------------------------------ lectura y apariencia
  const NOMBRES_5 = ["Pequeño", "Normal", "Grande", "Muy grande", "Máximo"];
  const NOMBRES_TAM = K_TAM.map((_, i) => i % 2 === 0 ? NOMBRES_5[i / 2] : "Entre " + NOMBRES_5[(i - 1) / 2].toLowerCase() + " y " + NOMBRES_5[(i + 1) / 2].toLowerCase());
  function abrirApariencia() {
    abrirModal(() => {
      const ws = D && D.portada ? D.portada.p.slice(0, 5) : [];
      const valor = { tam: () => ap.tam, letra: () => ap.letra, inter: () => ap.inter, mov: () => ap.mov, tema: temaActual, caja: () => prefs.caja };
      const muestraGs = ws.map((w) => h("span", { class: "g", lang: "grc", "data-gk": w.g }, gk(w.g)));
      const cambiar = {
        tema: (v) => ponerTema(v),
        caja: (v) => { prefs.caja = v; guardarPrefs(); aplicarCaja(); },
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
          fila("Movimiento", grupo("mov", [["si", op("Con animaciones")], ["no", op("Sin animaciones", "Todo aparece al instante")]])),
          h("div", { class: "ap-pie" },
            h("button", { class: "btn chico oro", type: "button", onclick: () => empujar(vistaOpciones()) }, svg(ICO.opciones), "Opciones del texto: colores, corchetes, paréntesis"),
            h("button", { class: "btn chico", type: "button", onclick: () => { ap = Object.assign({}, AP0); store.set("ap", ap); aplicarAp(); pintarModal(); } }, "Restablecer lectura"))));
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
          fila("Ampliaciones entre corchetes [ ]", prefs.lorg ? "En la lectura organizada (por defecto, solo la primera)." : null, grupo((prefs[kCor()] == null && (prefs[kCor()] = "primera"), kCor()), [["todas", "Todas"], ["primera", "Solo la primera", "La primera ampliación de cada palabra"], ["base", "Solo la palabra base", "Sin ampliaciones"]])),
          fila("Paréntesis ( )", null, grupo("par", [[true, "Mostrar"], [false, "Ocultar"]])),
          fila("Signos < >", null, grupo("ang", [[true, "Mostrar"], [false, "Ocultar"]])),
          fila("Letras voladas y asteriscos (ᵐ ⁿ ᶠ *)", null, grupo("sup", [[true, "Mostrar"], [false, "Ocultar"]])),
          h("div", { class: "ap-pie" }, h("button", { class: "btn chico", type: "button", onclick: () => { Object.assign(prefs, OPC0); cambio(); pintarModal(); } }, "Restablecer")), esc.libro && esc.cap ? h("div", { class: "ap-exp" }, h("button", { class: "btn chico", type: "button", onclick: () => abrirExportar("cap") }, svg(ICO.descargar), h("span", { text: "Exportar este capítulo a Obsidian (.md)" }))) : null));
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
    const herr = h("button", { class: "btn-icono btn-herr", type: "button", "aria-label": "Herramientas: lectura, análisis, buscador, manuscritos, línea del tiempo, concordancia y guía", title: "Herramientas", onclick: () => abrirHerramientas() }, svg(ICO.rejilla));
    const extra = EMBED ? [
      EMBED ? h("button", { class: "btn-icono", type: "button", "aria-label": "Abrir en una pestaña nueva", title: "Abrir en una pestaña nueva", onclick: () => window.open(enlacePublico(location.hash), "_blank", "noopener") }, svg(ICO.externo)) : null,
      h("button", { class: "btn-icono", type: "button", "aria-label": "Cerrar el lector", title: "Cerrar el lector", onclick: () => { try { window.parent.postMessage({ biex: "cerrar" }, "*"); } catch (e) { /* ignorar */ } } }, svg(ICO.cerrar)),
    ] : [];
    // Fondo vivo: luces muy tenues que se desplazan despacio y motas de luz que suben (se detiene con «Sin animaciones»)
    const motas = Array.from({ length: 16 }, (_, i) => h("i", { style: "--x:" + ((i * 61 + 7) % 100) + "%;--d:" + (34 + (i * 13) % 30) + "s;--r:-" + ((i * 7.3) % 40).toFixed(1) + "s;--s:" + (1.4 + (i % 4) * 0.5) + "px;--w:" + (((i * 37) % 9) - 4) + "vw" }));
    const fondo = h("div", { class: "fondo-vivo", "aria-hidden": "true" }, h("i", { class: "vivo-a" }), h("i", { class: "vivo-b" }), h("i", { class: "vivo-c" }), h("div", { class: "vivo-motas" }, motas));
    // letras hebreas y griegas que cruzan como meteoritos: lienzo propio, por delante de los contenedores y por detrás del texto
    const lienzoMet = h("div", { class: "meteoros", "aria-hidden": "true" });
    raiz.replaceChildren(fondo, lienzoMet,
      h("header", { class: "barra" }, h("div", { class: "in" },
        h("a", { class: "marca", href: "#/", "aria-label": "Inicio del lector" }, h("span", { class: "sello", text: "BiEx" }), h("span", { class: "nombre" }, h("b", { text: "Biblia Exacta" }), h("small", { text: "Lector y analizador" }))),
        h("nav", { class: "nav", "aria-label": "Secciones" }, h("a", { href: "#/", text: "Inicio" }), h("a", { href: "#/libros", text: "Libros" }), h("a", { href: "#/cronologia", text: "Cronología" }), h("a", { href: "#/buscar", text: "Avanzada" })),
        h("div", { class: "acc" }, buscar, herr, guia, tema, extra))),
      h("main", { class: "pagina", id: "vista", tabindex: "-1" }),
      h("footer", { class: "pie" }, h("div", { class: "in" },
        h("div", { class: "marca-pie", text: "Biblia Exacta" }),
        h("p", { text: "Ningún verso se da por terminado: la traducción sigue abierta a ajustes. Los versos sin traducción completa se leen como texto base, palabra por palabra; lo que aún no tiene traducción fijada se muestra en griego." }),
        h("div", { class: "autoria" },
          h("span", { text: "Traducción, transliteración y análisis:" }),
          h("strong", { text: "BiEx – Biblia Exacta ©™." }),
          h("span", {}, h("a", { href: "https://bibliaexacta.wixsite.com/biex", target: "_blank", rel: "noopener", text: "Sitio oficial" }), h("span", { id: "actualizado" }))),
        h("p", { class: "creditos" }, "Texto griego y datos morfológicos: ", h("a", { href: "https://github.com/STEPBible/STEPBible-Data", target: "_blank", rel: "noopener", text: "TAGNT de STEPBible.org" }), " (Tyndale House, Cambridge), ",
          h("a", { href: "https://github.com/Clear-Bible/macula-greek", target: "_blank", rel: "noopener", text: "MACULA Greek Linguistic Datasets" }), " [Conjuntos de Datos Lingüísticos del Griego MACULA] (Biblica) y ",
          h("a", { href: "https://github.com/LogosBible/SBLGNT", target: "_blank", rel: "noopener", text: "SBLGNT" }), " (Society of Biblical Literature [Sociedad de Literatura Bíblica] y Logos Bible Software), con licencia CC BY 4.0.", h("br"),
          "Transcripciones de los manuscritos: ", h("a", { href: "https://greekcntr.org", target: "_blank", rel: "noopener", text: "Center for New Testament Restoration" }), " [Centro para la Restauración del Nuevo Testamento] (Alan Bunning), con licencia CC BY-SA 4.0; la comparación con el texto base se publica con la misma licencia.", h("br"),
          "Para reconocer las palabras con que se recuerda un verso, el buscador usa, sin mostrarlas, las traducciones de dominio público Reina-Valera 1909 y 1865, World English Bible [Biblia Mundial English], King James Version [Versión del Rey James] y Berean Standard Bible [Biblia Estándar Berean], y la Biblia en Español Sencillo (© 2018 AudioBiblia.org, CC BY 4.0).", h("br"),
          "Fechas de escritura: John Arthur Thomas Robinson [J. A. T. Robinson], Redating the New Testament [Nueva datación del Nuevo Testamento] (1976)."))),
      modal);
    const tg = store.get("tema", null);
    if (tg === "light" || tg === "dark") document.documentElement.setAttribute("data-theme", tg);
    else if (EMBED) document.documentElement.setAttribute("data-theme", "dark");
    ajustarBarra();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(ajustarBarra).catch(() => {});
  }
  // La marca «Biblia Exacta» nunca se recorta (con cualquier zoom del navegador o anchura): si no cabe, primero se oculta
  // la pista del buscador y después los enlaces de secciones (siguen en Herramientas y en la portada)
  function ajustarBarra() {
    const m = $(".barra .marca"), bi = $(".barra .in"), r = document.documentElement; if (!m || !bi) return;
    r.classList.remove("barra-sin-pista", "barra-sin-nav");
    const recorta = () => m.scrollWidth > m.clientWidth + 1 || bi.scrollWidth > bi.clientWidth + 1;
    if (recorta()) r.classList.add("barra-sin-pista");
    if (recorta()) r.classList.add("barra-sin-nav");
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
        h("span", { class: "fv-t" }, h("b", { text: b.t || b.n }), h("small", { text: b.n + (fe ? " · c. " + fe.replace(/^c\. /, "") : "") })),
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
      "aria-label": w.g + ": " + (w.tr || "sin traducción fijada") + ". Abrir el análisis", onclick: () => abrirPalabraPortada(i) },
      h("span", { class: "g", lang: "grc", "data-gkh": w.g }, gk(w.g, prefs.heroCaja)), h("span", { class: "t" }, glosa(w.tr))));
    const cajaBtn = (k, t, et) => h("button", { type: "button", "aria-pressed": prefs.heroCaja === k ? "true" : "false", "aria-label": et, title: et, onclick: (e) => {
      prefs.heroCaja = k; guardarPrefs();
      for (const b of botones) { const g = $(".g", b); g.textContent = gk(g.dataset.gkh, k); b.classList.toggle("may", k === "may"); }
      for (const b of $$(".seg-hero button")) b.setAttribute("aria-pressed", b === e.currentTarget ? "true" : "false");
    } }, h("span", { class: "gk", text: t }));
    const L = librosEnOrden(), ko = ordenActivo();
    const grupos = ko === "tradicional"
      ? [["Los relatos de la vida de YēshŪ́ʿa y " + nombreLibro(libroDe("ACT")), "", ["MAT", "MRK", "LUK", "JHN", "ACT"]], ["Las cartas", "", D.libros.map((b) => b.c).filter((c) => !["MAT", "MRK", "LUK", "JHN", "ACT", "REV"].includes(c))], [nombreLibro(libroDe("REV")), "", ["REV"]]]
      : CRONO.grupos[ko];
    const tarjeta = (b) => {
      const completos = b.total - b.conteo.base;
      const fe = fechaEscrito(b), na = fechaNarra(b);
      return h("a", { class: "tlibro", href: "#/" + b.c + "/1", "aria-label": nombreLibro(b) + (fe ? ", escrito c. " + fe.replace(/^c\. /, "") : "") + ": " + pct(b.palabras) + " de las palabras ya traducidas en el texto base" },
        h("span", { class: "num", text: String(numLibro(b)).padStart(2, "0") }),
        h("span", { class: "tit", text: b.t || b.n }),
        h("span", { class: "es", text: b.n }),
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
        h("div", { class: "codice" },
          h("div", { class: "codice-cab" },
            h("span", { class: "ref" }, h("b", { text: (lb.t || lb.n) + " " + P.cap + ":" + P.v }), " [" + lb.n + "]"),
            h("div", { class: "seg seg-hero", role: "group", "aria-label": "Escritura del griego" }, cajaBtn("may", "ΑΒΓ", "Mayúsculas, como los códices unciales"), cajaBtn("min", "αβγ", "Minúsculas con acentos y espíritus"))),
          h("div", { class: "interlineal" }, botones),
          h("p", { class: "pista", text: "Toca una palabra, en griego o en español, para abrir su análisis" })),
        h("div", { class: "acciones" },
          ub ? h("a", { class: "btn oro", href: "#/" + ub.c + "/" + ult.cap + (ult.m === "a" ? "/a" + (ult.v ? "/" + ult.v : "") : (ult.v ? "/l/" + ult.v : "")) }, svg(ICO.seguir), h("span", {}, "Seguir leyendo · ", etLibro(ub, ult.cap + (ult.v ? ":" + ult.v : "")))) : null,
          h("a", { class: "btn" + (ub ? "" : " oro"), href: "#/" + P.c + "/" + P.cap + "/l/" + P.v }, svg(ICO.libro), h("span", {}, "Leer ", etLibro(lb, String(P.cap)))),
          h("a", { class: "btn", href: "#/" + P.c + "/" + P.cap + "/a/" + P.v }, svg(ICO.lupa), "Analizar palabra por palabra"),
          h("a", { class: "btn", href: "#/libros" }, svg(ICO.rejilla), "Los 27 libros")))),
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
        grupos.map(([t, sub, cs]) => h("div", { class: "grupo-libros" }, h("h3", {}, h("span", {}, protegerMay(t)), sub ? h("small", { text: sub }) : null), h("div", { class: "tarjetas" }, cs.map((c) => tarjeta(libroDe(c)))))),
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
      if (clave) rotar(ir, 6500, () => { if (herrEstado !== st) return; st[clave]++; if (st.lee % caps.length === st.an % caps.length) st[clave]++; const [a2, h2] = ej[clave](); ir.replaceChildren(h("span", { class: "herr-tx" }, a2), svg(ICO.der)); el.setAttribute("href", h2); }, n * 1600);
      return el;
    };
    const item = (ico, t, p, clave, n) => { const [a, href] = ej[clave](); return hr(ico, t, p, a, href, clave, n); };
    abrirModal(() => cajaModal(cabModal("Herramientas", "Leer, analizar, comparar"), [h("div", { class: "herramientas en-modal" },
          item(ICO.libro, "Lectura", "Cada capítulo en su estado actual. Toca un verso y se abre su griego palabra por palabra.", "lee", 0),
          item(ICO.lupa, "Análisis morfológico", "Forma, transliteración, lema, tiempo, voz, modo, caso, función en la oración y ediciones de cada palabra.", "an", 1),
          item(ICO.buscar, "Buscador inteligente", "Escribe como lo recuerdes: una escena, un nombre, una cita, una palabra griega o una pregunta. Entiende también las palabras de otras traducciones.", "bq", 2),
          item(ICO.manuscrito, "Manuscritos antiguos", "Cada verso en los papiros y códices más antiguos: qué dicen, en qué difieren y su transcripción letra por letra.", "ms", 3),
          hr(ICO.tiempo, "Línea del tiempo", "Los acontecimientos y la fecha en que se escribió cada libro, hasta la destrucción del templo en el año 70.", "Abrir", "#/cronologia"),
          hr(ICO.chispa, "Lo que pocos saben", "Datos de la historia del texto y de las traducciones que cambian la manera de leer, con sus pasajes y sus fuentes.", "Descubrir", "#/datos"),
          hr(ICO.tiempo, "Por qué estas fechas", "Las razones de la datación temprana que sigue BiEx: el año 70, el final de Prάc̅ṣεις y el templo en presente.", "Leer", "#/fechas"),
          hr(ICO.balanza, "Falacias lógicas", "Para conversar sobre la Escritura con altura: los errores de razonamiento más comunes y cómo responder sin contiendas innecesarias.", "Aprender", "#/falacias"),
          hr(ICO.sinopsis, "La fuente Q", "Mattáy, Μᾶrκος y Lουκᾶς comparados palabra por palabra en griego: la hipótesis de la fuente Q, sus argumentos y su historia.", "Explorar", "#/fuente-q"),
          (() => { const el = hr(ICO.descargar, "Exportar a Obsidian", "Capítulos, estudios y tus marcadores como notas .md con el mejor formato: propiedades, avisos plegables, colores de BiEx y versos enlazables.", "Exportar", "#/"); el.addEventListener("click", (e) => { e.preventDefault(); abrirExportar(); }); return el; })(),
          hr(ICO.tiempo, "Planes de lectura", "La Nueva Voluntad en orden cronológico en 30, 90 días o un año, los relatos de la vida de YēshŪ́ʿa y las cartas: marca cada lectura y sigue donde quedaste.", "Elegir un plan", "#/planes"),
          hr(ICO.marcador, "Mis marcadores", "Los versos que marcaste con un tema de color y tus notas de estudio. Se exportan e importan entre dispositivos.", "Abrir", "#/marcadores"),
          hr(ICO.nube, "Instalar y leer sin conexión", "BiEx como aplicación con su propio ícono y todo su contenido guardado en tu dispositivo para usarlo sin internet.", "Abrir", "#/app"),
          hr(ICO.lista, "Concordancia", "Todas las apariciones de un lema en la Nueva Voluntad, con su forma, su traducción y su verso.", "Buscar una palabra", "#/lema"),
          hr(ICO.filtros, "Búsqueda morfológica", "Combina rasgos: los aoristos pasivos de un libro, los participios de un lema, los genitivos de un capítulo…", "Buscar", "#/buscar"),
          hr(ICO.guia, "Guía animada", "Todo lo que puedes hacer, en pocos pasos, con imágenes en movimiento y textos breves que se pueden escuchar.", "Ver la guía", "#/guia")), redesBiex()]));
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
    abrirModal(cargandoModal(refCorta(b, P.cap, P.v)), () => marcar(-1));
    try {
      const [toks, Lc] = await Promise.all([versoTokens(P.c, P.cap, P.v), lectura(P.c)]);
      let j = (P.i0 || 0) + i;
      if (!toks[j] || T.F[toks[j][0]] !== P.p[i].g) j = Math.max(0, toks.findIndex((t) => T.F[t[0]] === P.p[i].g));
      const L = (Lc.caps[P.cap] || []).find((x) => x.v === P.v);
      if (!modal.open) return;
      reemplazar(vistaPalabra({ b, cap: P.cap, v: P.v, toks, i: j, L, desde: "portada", alMover: (k) => marcar(k - (P.i0 || 0)) }));
    } catch (e) { reemplazar(() => cajaModal(cabModal("No se pudo abrir"), fallo("No se pudo cargar el análisis."))); }
  }

  // ------------------------------------------------------------------ libro
  const esc = { libro: null, cap: 0, modo: "", lista: null };

  async function vistaLibro(c, cap, modo, v, i) {
    const b = libroDe(c);
    if (!b) return noEncontrado();
    navActual("#/libros");
    cap = Math.max(1, Math.min(b.caps.length, cap || 1));
    document.title = nombreLibro(b) + " " + cap + " · BiEx";
    const mismo = esc.libro === c && esc.cap === cap && esc.modo === modo && esc.lorg === !!prefs.lorg && $(".libro", vista());
    esc.libro = c; esc.cap = cap; esc.modo = modo; esc.lorg = !!prefs.lorg;
    if (mismo) { enfocar(v, i); return; }
    vista().replaceChildren(estructuraLibro(b, cap, modo, null, [cargando()]));
    if (v == null) alTope();
    let Lc, A = null;
    try {
      const pA = modo === "a" ? Promise.all([analisis(c), tablas()]) : null; // en paralelo con la lectura
      Lc = await lectura(c);
      if (pA) [A] = await pA;
    } catch (e) { vista().replaceChildren(fallo("No se pudo cargar " + nombreLibro(b) + ".")); return; }
    if (esc.libro !== c || esc.cap !== cap || esc.modo !== modo) return;
    const versos = Lc.caps[cap] || [];
    esc.versos = versos;
    const cuerpo = modo === "a" ? cuerpoAnalisis(b, cap, A.caps[cap] || [], versos) : cuerpoLectura(b, cap, versos);
    vista().replaceChildren(estructuraLibro(b, cap, modo, versos, cuerpo));
    store.set("ultimo", { c, cap, m: modo, v: v || null });
    enfocar(v, i);
    // Mientras se lee, se trae en segundo plano el análisis para que las palabras abran al instante
    if (modo !== "a") setTimeout(() => { if (esc.libro === c) { analisis(c).catch(() => {}); tablas().catch(() => {}); } }, 2500);
  }
  function estructuraLibro(b, cap, modo, versos, cuerpo) {
    const vb = volverBusqueda && volverBusqueda.ruta.split("/").slice(0, 3).join("/") === "#/" + b.c + "/" + cap ? volverBusqueda : null;
    return h("div", { class: "libro" }, bandaLibro(b),
      h("div", { class: "in libro-grid" },
        h("aside", { class: "riel", "aria-label": "Capítulos y versos" }, navContenido(b, cap, versos)),
        h("section", { class: "hoja" + (modo !== "a" && prefs.nivel ? " con-filtro" : "") }, h("i", { class: "bh-centinela", "aria-hidden": "true" }), barraHoja(b, cap, modo, versos),
          vb ? h("button", { class: "chip-volver", type: "button", onclick: () => abrirBusqueda(vb.q) }, svg(ICO.atras), h("span", { text: "Volver a los resultados de «" + vb.q + "»" })) : null,
          ...cuerpo.filter(Boolean))));
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
        h("span", { class: "eyebrow", text: "Libro " + numLibro(b) + " de 27 " + nombreOrden() + " · Nueva Voluntad" }),
        h("h1", {}, h("a", { class: "banda-lib", href: (MEMLIB && MEMLIB.h) || "#/libros", title: "Volver a la lista de libros", onclick: irALista },
          h("span", { class: "tr", text: b.t || b.n }), b.t ? h("span", { class: "es", text: b.n }) : null)),
        fechaEscrito(b) ? h("a", { class: "banda-fecha", href: "#/cronologia" }, svg(ICO.tiempo), "Escrito c. " + fechaEscrito(b).replace(/^c\. /, "") + (/H\.D\./.test(fechaEscrito(b)) ? "" : " " + ERA_D) + (fechaNarra(b) ? " · narra " + fechaNarra(b) : "")) : null),
      h("div", { class: "banda-ani" }, anilloSvg(p), h("p", { text: "de las palabras ya traducidas en el texto base (preliminar, en revisión)" })),
      h("div", { class: "mini-cifras" },
        cifra("c1", b.total, "versos"),
        cifra("c2", b.nPal || 0, "palabras"),
        cifra("c3", b.nLem || 0, "lemas"),
        completos ? cifra("c4", completos, "con traducción completa") : cifra("c4", b.caps.length, b.caps.length === 1 ? "capítulo" : "capítulos"))));
  }
  // Capítulos y teselas numeradas de los versos (en el riel de escritorio y en la ventana del móvil)
  function navContenido(b, cap, versos, alElegir) {
    const caps = h("div", { class: "caps", role: "group", "aria-label": "Capítulos" }, b.caps.map((C) => h("a", {
      class: "cap", href: "#/" + b.c + "/" + C.c + (esc.modo === "a" ? "/a" : ""), "aria-current": C.c === cap ? "true" : "false",
      title: "Capítulo " + C.c + ": " + pct(C.pct) + " de avance", onclick: alElegir || null }, String(C.c), h("i", { style: "width:" + Math.min(100, C.pct) + "%" }))));
    const teselas = versos ? h("div", { class: "teselas", role: "group", "aria-label": "Versos del capítulo " + cap }, versos.map((x) => aplicarMarca(h("button", {
      type: "button", class: "tesela n-" + x.n + (esc.modo !== "a" && prefs.nivel && !pasaFiltro(x, prefs.nivel) ? " fuera" : ""), "data-v": x.v, title: cap + ":" + x.v + " · " + estadoEt(x.n), "aria-label": "Verso " + x.v + ", " + estadoEt(x.n),
      onclick: () => { if (alElegir) alElegir(); irVerso(x.v); } }, String(x.v)), marcaDe(b, cap, x.v)))) : null;
    const usados = versos ? ["exacto", "casi", "revision", "borrador", "base"].filter((k) => versos.some((x) => x.n === k)) : [];
    return [
      h("div", {}, h("p", { class: "rotulo", text: "Capítulos" }), caps),
      teselas ? h("div", {}, h("p", { class: "rotulo", text: "Versos del capítulo " + cap }), teselas) : null,
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
  const FILTROS = [["", "Todos los versos"], ["borrador", "Con traducción (en traducción o más)"], ["revision", "En revisión o más"], ["casi", "Casi exactos o más"], ["exacto", "Exactos"], ["base", "Solo texto base"]];
  const FILTRO_CORTO = { borrador: "Con traducción" };
  const pasaFiltro = (x, f) => !f || (f === "base" ? x.n === "base" : NIVELES.indexOf(x.n) >= NIVELES.indexOf(f));
  const nombreFiltro = (f) => (FILTROS.find((x) => x[0] === f) || FILTROS[0])[1];
  function barraHoja(b, cap, modo, versos) {
    const ir = (m) => "#/" + b.c + "/" + cap + (m === "a" ? "/a" : "");
    // Tres modos: Lectura (orden del griego), Organizada (orden del español donde ya existe) y Análisis
    const activo = (m) => (m === "a" ? modo === "a" : modo !== "a" && (m === "o") === !!prefs.lorg);
    const btnModo = (m, t, corto) => h("button", { type: "button", class: "m-" + m, "aria-label": m === "o" ? "Organizada" : t, "aria-pressed": activo(m) ? "true" : "false", title: m === "o" ? "Lectura organizada: orden del español donde ya está decidido" : null, onclick: () => {
      if (activo(m)) return;
      if (m !== "a") { const cambia = !!prefs.lorg !== (m === "o"); prefs.lorg = m === "o"; guardarPrefs(); if (modo !== "a") { if (cambia) { const a = capturarAncla(); esc.libro = null; vistaLibro(b.c, cap, "l", null, null); volverAAncla(a); } return; } }
      RP.anclaSig = capturarAncla(); location.hash = ir(m);
    } }, svg(m === "a" ? ICO.lupa : m === "o" ? ICO.orden : ICO.libro), h("span", { class: "lbl" }, corto ? [h("span", { class: "largo", text: t }), h("span", { class: "corto", "aria-hidden": "true", text: corto })] : t));
    const prev = cap > 1 ? "#/" + b.c + "/" + (cap - 1) + (modo === "a" ? "/a" : "") : null;
    const next = cap < b.caps.length ? "#/" + b.c + "/" + (cap + 1) + (modo === "a" ? "/a" : "") : null;
    const disp = modo !== "a" ? h("div", { class: "seg seg-ico", role: "group", "aria-label": "Disposición del texto" },
      [["versos", "Por versos", ICO.lista], ["continuo", "Continuo", ICO.parrafo]].map(([k, t, ico]) => h("button", { type: "button", "aria-pressed": prefs.disp === k ? "true" : "false", "aria-label": t, title: t, onclick: () => {
        if (prefs.disp === k) return; const a = capturarAncla(); prefs.disp = k; guardarPrefs(); esc.libro = null; vistaLibro(b.c, cap, modo, null, null); volverAAncla(a);
      } }, svg(ico), h("span", { class: "txt", text: t })))) : null;
    const filtro = modo !== "a" && versos ? h("label", { class: "filtro-niv" + (prefs.nivel ? " activo" : ""), title: "Mostrar los versos según su nivel de avance" }, svg(ICO.filtro),
      h("select", { "aria-label": "Mostrar los versos según su nivel de avance", onchange: (e) => { const a = capturarAncla(); prefs.nivel = e.target.value; guardarPrefs(); esc.libro = null; Promise.resolve(vistaLibro(b.c, cap, modo, null, null)).then(() => volverAAnclaOBarra(a)); } },
        FILTROS.map(([k, t]) => { const n = " · " + (k ? versos.filter((x) => pasaFiltro(x, k)).length : versos.length); return h("option", { value: k, selected: (prefs.nivel || "") === k ? true : null, "data-corto": (FILTRO_CORTO[k] || t) + n, text: t + n }); }))) : null;
    const opciones = modo !== "a" ? h("button", { class: "btn-icono btn-opc", type: "button", "aria-label": "Opciones del texto: colores, corchetes y paréntesis", title: "Opciones del texto", onclick: abrirOpciones }, svg(ICO.opciones)) : null;
    // En el centro de la barra: el libro (transliteración y nombre en español) y el capítulo en hebreo con su numeral romano
    const capH = String((b.caps[cap - 1] || {}).h || "").match(/^(.*?)\s*\[[^\]]*\]\s*(\S+)?\s*$/);
    const he = capH ? capH[1] : "", rom = capH && capH[2] ? capH[2] : String(cap);
    const titulo = h("button", { class: "bh-tit", type: "button", title: "Elegir capítulo y verso",
      "aria-label": nombreLibro(b) + ", capítulo " + cap + ". Elegir capítulo y verso", onclick: () => abrirModal(vistaNavegador(b, cap, versos)) },
      h("span", { class: "bh-lib" }, h("span", { class: "tr", text: b.t || b.n }), b.t ? h("span", { class: "es", text: b.n }) : null),
      h("span", { class: "bh-cap" }, he ? h("span", { lang: "he", dir: "rtl", text: he }) : null, h("span", { class: "rom", text: rom })));
    return h("div", { class: "barra-hoja" },
      h("div", { class: "seg seg-modo", role: "group", "aria-label": "Modo" }, btnModo("l", "Lectura"), btnModo("o", "Organizada", "Orden"), btnModo("a", "Análisis")),
      h("div", { class: "cap-grupo movil" },
        h("button", { class: "btn-icono", type: "button", "aria-label": "Capítulo anterior", title: "Capítulo anterior", disabled: !prev, onclick: () => prev && (location.hash = prev) }, svg(ICO.izq)),
        h("button", { class: "btn-cap", type: "button", "aria-label": "Capítulo " + cap + " de " + b.caps.length + ". Elegir capítulo y verso", onclick: () => abrirModal(vistaNavegador(b, cap, versos)) }, svg(ICO.rejilla), "Cap. " + cap),
        h("button", { class: "btn-icono", type: "button", "aria-label": "Capítulo siguiente", title: "Capítulo siguiente", disabled: !next, onclick: () => next && (location.hash = next) }, svg(ICO.der))),
      h("span", { class: "bh-salto", "aria-hidden": "true" }),
      disp, filtro, opciones,
      // franja fina al pie de la barra: el libro y el capítulo en el centro (en escritorio, con las flechas del capítulo a los lados)
      h("div", { class: "bh-franja" },
        h("button", { class: "btn-icono bh-fl", type: "button", "aria-label": "Capítulo anterior", title: "Capítulo anterior", disabled: !prev, onclick: () => prev && (location.hash = prev) }, svg(ICO.izq)),
        titulo,
        h("button", { class: "btn-icono bh-fl", type: "button", "aria-label": "Capítulo siguiente", title: "Capítulo siguiente", disabled: !next, onclick: () => next && (location.hash = next) }, svg(ICO.der))));
  }
  function vistaNavegador(b, cap, versos) {
    const sub = cap ? "Capítulo " + cap + " de " + b.caps.length : b.caps.length + (b.caps.length === 1 ? " capítulo" : " capítulos") + " · elige uno";
    return () => cajaModal(cabModal(nombreLibro(b), sub), h("div", { style: "display:grid;gap:22px" }, navContenido(b, cap, versos, () => cerrarModal()), navLibros(b)));
  }
  // Los demás libros, en el orden elegido en la biblioteca: al tocar uno se ven sus capítulos sin salir de la ventana
  function navLibros(b) {
    return h("div", { class: "nav-libros" }, h("p", { class: "rotulo", text: "Otros libros" }),
      h("div", { class: "libs", role: "group", "aria-label": "Elegir otro libro" }, librosEnOrden().map((x) => h("button", {
        type: "button", class: "lib-chip", "aria-current": x === b ? "true" : "false", title: nombreLibro(x),
        onclick: () => { if (x !== b) empujar(vistaNavegador(x, 0, null)); } },
        h("span", { class: "lt", text: x.t || x.n }), x.t ? h("span", { class: "ln", text: x.n }) : null))));
  }
  const rutaCap = (b, cap, modo) => "#/" + b.c + "/" + cap + (modo === "a" ? "/a" : "");
  function encabezado(b, cap, modo) {
    const C = b.caps[cap - 1];
    const partes = String(C.h || "").split(" [");
    const flecha = (c, ico, et) => h("a", { class: "btn-icono", href: c ? rutaCap(b, c, modo) : null, "aria-label": et, title: et, "aria-disabled": c ? null : "true" }, svg(ico));
    return h("div", { class: "encab" },
      flecha(cap > 1 ? cap - 1 : 0, ICO.izq, "Capítulo anterior"),
      h("div", { class: "encab-c" },
        C.h ? h("div", { class: "h" }, h("span", { lang: "he", text: partes[0] }), partes[1] ? " [" + partes[1] : "") : h("div", { class: "h", text: "Capítulo " + cap }),
        h("div", { class: "s", text: "Capítulo " + cap + " de " + b.caps.length + " · " + pct(C.pct) + " de avance" })),
      flecha(cap < b.caps.length ? cap + 1 : 0, ICO.der, "Capítulo siguiente"));
  }
  // Al terminar el capítulo: anterior y siguiente (o el libro siguiente)
  function finCap(b, cap, modo) {
    const LO = librosEnOrden(), i = LO.indexOf(b);
    const sigLibro = cap >= b.caps.length && i < LO.length - 1 ? LO[i + 1] : null;
    const antLibro = cap <= 1 && i > 0 ? LO[i - 1] : null;
    const ant = cap > 1 ? h("a", { class: "btn", href: rutaCap(b, cap - 1, modo) }, svg(ICO.izq), h("span", { text: "Capítulo " + (cap - 1) }))
      : antLibro ? h("a", { class: "btn", href: rutaCap(antLibro, antLibro.caps.length, modo) }, svg(ICO.izq), h("span", {}, etLibro(antLibro))) : null;
    const sig = cap < b.caps.length ? h("a", { class: "btn oro sig", href: rutaCap(b, cap + 1, modo) }, h("span", { text: "Capítulo " + (cap + 1) }), svg(ICO.der))
      : sigLibro ? h("a", { class: "btn oro sig", href: rutaCap(sigLibro, 1, modo) }, h("span", {}, etLibro(sigLibro)), svg(ICO.der)) : null;
    return [finPlan(b, cap), h("nav", { class: "fin-cap", "aria-label": "Seguir leyendo" }, ant, sig)];
  }

  // Perícopas: las marcas § de BiEx cuando el capítulo las tiene; si no, los párrafos (¶) del texto griego
  const iniciaPericopa = (usaP, x, k) => k === 0 || !!(usaP ? x.p : x.q);
  function cuerpoLectura(b, cap, todos) {
    const f = prefs.nivel || "";
    const versos = todos.filter((x) => pasaFiltro(x, f));
    const usaP = todos.some((x) => x.p);
    const hayBase = todos.some((v) => v.g), hayAutor = todos.some((v) => !v.g);
    const ley = prefs.ed && hayAutor ? h("span", { class: "ley-mini" }, " Colores de la edición BiEx: ", h("span", { class: "tm", text: "palabras del Mashíaḥ" }), " · ", h("span", { class: "tc", text: "citas de la Antigua Voluntad" }), " · ", h("span", { class: "tk", text: "[ampliaciones]" }), " · ",
      h("button", { class: "enlace", type: "button", onclick: abrirOpciones, text: "opciones" }), ".") : null;
    const nota = prefs.lorg ? h("p", { class: "nota-base nota-org" }, h("b", { text: "Lectura organizada. " }),
      hayBase ? ["En ", h("span", { class: "gr", text: "dorado" }), ", el griego que aún no tiene traducción fijada. "] : null, "Toca cualquier verso para abrir su griego palabra por palabra.", ley) :
      hayBase ? h("p", { class: "nota-base" }, "Los versos en texto base se presentan palabra por palabra.", h("br"), "En ", h("span", { class: "gr", text: "dorado" }), ", el griego que aún no tiene traducción fijada.", h("br"), "Toca cualquier verso para abrir su griego palabra por palabra.", ley) :
      h("p", { class: "nota-base" }, "Toca cualquier verso para abrir su griego palabra por palabra.", ley);
    const quitarFiltro = () => { prefs.nivel = ""; guardarPrefs(); esc.libro = null; vistaLibro(b.c, cap, "l", null, null); };
    const avisoFiltro = f ? h("div", { class: "nota-filtro" }, svg(ICO.filtro), h("span", { text: (versos.length ? "Se muestran " + versos.length + " de " + todos.length + " versos" : "Ningún verso de este capítulo está aún en este nivel") + " · " + nombreFiltro(f) + "." }),
      h("button", { class: "btn chico", type: "button", onclick: quitarFiltro, text: "Mostrar todos" })) : null;
    const abrir = (x) => abrirVerso(b, cap, x.v);
    const salto = (n) => h("button", { class: "salto", type: "button", onclick: quitarFiltro, text: "· · ·  " + n + (n === 1 ? " verso oculto por el filtro" : " versos ocultos por el filtro") });
    const huecos = (x, k) => { const i = todos.indexOf(x), j = k > 0 ? todos.indexOf(versos[k - 1]) : -1; return i - j - 1; };
    if (prefs.disp === "continuo") {
      const parrafos = [];
      let actual = null;
      versos.forEach((x, k) => {
        if (f && huecos(x, k) > 0) { parrafos.push(salto(huecos(x, k))); actual = null; }
        const A = anadido(b.c, cap, x.v), av = avisoAnadido(b, cap, x.v, A);
        if (av) { parrafos.push(av); actual = null; }
        if (!actual || iniciaPericopa(usaP, x, k)) { actual = h("p", { class: "peri" }, h("span", { class: "par", "aria-hidden": "true", text: "§" })); parrafos.push(actual); }
        actual.append(aplicarMarca(h("span", { class: "vs n-" + x.n + (A ? (A.entero ? " anadido" : " an-parcial") : ""), id: "v" + x.v, role: "button", tabindex: "0", title: refCorta(b, cap, x.v) + " · " + estadoEt(x.n),
          onclick: () => abrir(x), onkeydown: (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); abrir(x); } } },
          h("sup", { text: x.v }), corcheteAn(A, 0), txtVerso(x), corcheteAn(A, 1)), marcaDe(b, cap, x.v)), " ");
        if (A && A.fin) actual = null;
      });
      if (f && versos.length && todos.indexOf(versos[versos.length - 1]) < todos.length - 1) parrafos.push(salto(todos.length - 1 - todos.indexOf(versos[versos.length - 1])));
      return [encabezado(b, cap, "l"), nota, avisoFiltro, h("div", { class: "continuo" }, parrafos), finCap(b, cap, "l")];
    }
    const filas = [];
    versos.forEach((x, k) => {
      if (f && huecos(x, k) > 0) filas.push(salto(huecos(x, k)));
      const av = avisoAnadido(b, cap, x.v, anadido(b.c, cap, x.v));
      if (av) filas.push(av);
      filas.push(filaVerso(x, k));
    });
    if (f && versos.length && todos.indexOf(versos[versos.length - 1]) < todos.length - 1) filas.push(salto(todos.length - 1 - todos.indexOf(versos[versos.length - 1])));
    return [encabezado(b, cap, "l"), nota, avisoFiltro, h("div", { class: "lectura" }, filas), finCap(b, cap, "l")];
    function filaVerso(x, k) {
      const A = anadido(b.c, cap, x.v);
      return aplicarMarca(h("div", {
      class: "vl n-" + x.n + (iniciaPericopa(usaP, x, k) ? " p" : "") + (A ? (A.entero ? " anadido" : " an-parcial") : ""), id: "v" + x.v, role: "button", tabindex: "0",
      "aria-label": "Verso " + x.v + " (" + estadoEt(x.n) + "). Abrir su griego palabra por palabra",
      onclick: () => abrir(x), onkeydown: (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); abrir(x); } } },
      h("span", { class: "vn", title: estadoEt(x.n) + (x.n === "base" ? ": " + x.k + " % de las palabras ya traducidas" : ""), text: x.v }),
      h("span", { class: "vt" }, corcheteAn(A, 0), txtVerso(x), corcheteAn(A, 1))), marcaDe(b, cap, x.v));
    }
  }
  // Aviso al comienzo de un pasaje añadido (o en la ventana del verso, para cualquiera de sus versos)
  function avisoAnadido(b, cap, v, A, siempre) {
    if (!A || (!A.ini && !siempre)) return null;
    return h("div", { class: "aviso-anadido", role: "note" },
      h("span", { class: "aa-sig", "aria-hidden": "true", text: "⟦ ⟧" }),
      h("div", { class: "aa-tx" }, h("b", { text: "Texto añadido · " + A.p.t }), h("p", { text: A.p.d }),
        h("a", { class: "enlace", href: "#/" + b.c + "/" + cap + "/l/" + v + "/m", text: "Ver los manuscritos de este verso" })));
  }
  const corcheteAn = (A, lado) => (A && A.entero && (lado ? A.fin : A.ini) ? h("span", { class: "an-cor", "aria-hidden": "true", text: lado ? " ⟧" : "⟦ " }) : null);
  function abrirVerso(b, cap, v, conManuscritos) {
    const versos = esc.versos || [];
    marcarVerso(v);
    const ctx = { b, cap, v, versos };
    abrirModal(vistaVerso(ctx), () => { ponerHash("#/" + b.c + "/" + cap + "/l/" + (esc.vMarcado || v)); });
    ponerHash("#/" + b.c + "/" + cap + "/l/" + v);
    if (conManuscritos) empujar(vistaManuscritos(ctx));
  }
  function marcarVerso(v) {
    for (const x of $$(".marcado")) x.classList.remove("marcado");
    for (const x of $$(".tesela[aria-current]")) x.removeAttribute("aria-current");
    const el = document.getElementById("v" + v); if (el) el.classList.add("marcado");
    for (const t of $$('.tesela[data-v="' + v + '"]')) t.setAttribute("aria-current", "true");
    esc.vMarcado = v;
    const u = store.get("ultimo", null);
    if (u && u.c === esc.libro && u.cap === esc.cap) { u.v = v; store.set("ultimo", u); }
  }

  // ------------------------------------------------------------------ estudio: marcadores con temas de color y notas
  // Se guardan en este navegador (sin cuentas ni servidores); se exportan a un archivo y se importan en otro dispositivo.
  const TEMAS_BASE = [["oro", "Clave"], ["azul", "Para estudiar"], ["verde", "Enseñanza"], ["rojo", "Advertencia"], ["violeta", "Cumplimiento"], ["gris", "Pendiente"]];
  const MK = {
    todo() { const m = store.get("marcas", {}); return m && typeof m === "object" && !Array.isArray(m) ? m : {}; },
    clave: (c, cap, v) => c + "-" + cap + "-" + v,
    get: (c, cap, v) => MK.todo()[MK.clave(c, cap, v)] || null,
    poner(c, cap, v, cambios) {
      const m = MK.todo(), k = MK.clave(c, cap, v);
      const x = Object.assign({ c, cap, v }, m[k] || {}, cambios, { f: Date.now() });
      if (!x.col) delete x.col;
      if (!String(x.nota || "").trim()) delete x.nota;
      if (!x.col && !x.nota) delete m[k]; else m[k] = x;
      store.set("marcas", m);
      MK.pintar(c, cap, v);
    },
    temas() { const t = store.get("marcasTemas", null) || {}; return TEMAS_BASE.map(([k, n]) => [k, typeof t[k] === "string" && t[k].trim() ? t[k].trim().slice(0, 40) : n]); },
    nombre: (k) => (MK.temas().find((x) => x[0] === k) || [k, k])[1],
    // refleja el cambio en el capítulo abierto: el verso y su tesela
    pintar(c, cap, v) {
      if (esc.libro !== c || esc.cap !== cap) return;
      const x = MK.get(c, cap, v), el = document.getElementById("v" + v);
      if (el) aplicarMarca(el, x);
      for (const t of $$('.tesela[data-v="' + v + '"]')) aplicarMarca(t, x);
    },
  };
  function aplicarMarca(el, x) {
    for (const [k] of TEMAS_BASE) el.classList.remove("mk-" + k);
    el.classList.toggle("mk", !!(x && x.col));
    el.classList.toggle("mk-con-nota", !!(x && x.nota));
    if (x && x.col) el.classList.add("mk-" + x.col);
    return el;
  }
  const marcaDe = (b, cap, v) => MK.get(b.c, cap, v);
  // En la ventana del verso: elegir un tema de color y escribir una nota
  function bloqueEstudio(b, cap, v) {
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
    return h("div", { class: "bloque mk-bloque" },
      h("h4", {}, svg(ICO.marcador), h("span", { text: "Tu estudio" }), h("a", { class: "mk-ir", href: "#/marcadores", text: "Mis marcadores" })),
      temas, nota,
      h("p", { class: "nota-ui", text: "Se guarda en este navegador. En «Mis marcadores» puedes llevarlo a otro dispositivo." }));
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
    const textoDe = async (x) => { try { const Lc = await lectura(x.c); const L = (Lc.caps[x.cap] || []).find((y) => y.v === x.v); return L ? textoPlano(txtVerso(L).textContent || "") : ""; } catch (e) { return ""; } };
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
      cuerpo.replaceChildren(...grupos.map((g) => { const b = libroDe(g.c); return h("section", { class: "mk-grupo" }, h("h3", {}, etLibro(b), h("small", { text: " · " + g.xs.length })), g.xs.map((x) => tarjeta(b, x))); }));
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
      const datos = { app: "BiEx", tipo: "marcadores", v: 1, exportado: new Date().toISOString(), temas: Object.fromEntries(MK.temas()), marcas: MK.todo() };
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
        store.set("marcas", m); pintar(); avisar(n ? "Importados " + n + " marcadores" : "El archivo no tenía marcadores");
      } catch (e) { avisar("Ese archivo no es una copia de marcadores de BiEx"); }
    });
    const copiarTexto = async () => {
      const todos = lista();
      const lineas = [];
      for (const x of todos) { const b = libroDe(x.c), k = MK.clave(x.c, x.cap, x.v); if (textos[k] == null) textos[k] = await textoDe(x); lineas.push(refCorta(b, x.cap, x.v) + (x.col ? " [" + MK.nombre(x.col) + "]" : "") + "\n" + textos[k] + (x.nota ? "\nNota: " + x.nota : "")); }
      try { await navigator.clipboard.writeText(lineas.join("\n\n")); avisar("Copiado como texto"); } catch (e) { avisar("No se pudo copiar"); }
    };
    // Nombres de los temas (cada quien los llama a su manera)
    const editarTemas = () => abrirModal(() => {
      const campos = MK.temas().map(([k, n]) => { const i = h("input", { type: "text", maxlength: "40", value: n, "aria-label": "Nombre del tema " + n }); i.dataset.k = k; return h("label", { class: "mk-tema-ed mk-" + k }, h("i", { "aria-hidden": "true" }), i); });
      const guardarT = () => { store.set("marcasTemas", Object.fromEntries(campos.map((l) => { const i = l.querySelector("input"); return [i.dataset.k, i.value.trim().slice(0, 40)]; }).filter(([, t]) => t))); cerrarModal(); pintar(); avisar("Temas guardados"); };
      return cajaModal(cabModal("Nombres de los temas", "Cada color puede significar lo que tú quieras"), h("div", { class: "mk-temas-ed" }, campos),
        h("div", { class: "m-pie" }, h("button", { class: "btn chico", type: "button", onclick: () => { store.set("marcasTemas", {}); cerrarModal(); pintar(); }, text: "Restablecer" }), h("button", { class: "btn chico oro", type: "button", onclick: guardarT, text: "Guardar" })));
    });
    let confirmar = 0;
    const borrarTodo = h("button", { class: "btn chico mk-borrar", type: "button", onclick: (e) => {
      const bt = e.currentTarget;
      if (!confirmar) { confirmar = 1; bt.lastChild.textContent = "¿Seguro? Toca de nuevo"; setTimeout(() => { confirmar = 0; if (bt.isConnected) bt.lastChild.textContent = "Borrar todos"; }, 4000); return; }
      confirmar = 0; store.set("marcas", {}); bt.lastChild.textContent = "Borrar todos"; pintar(); avisar("Marcadores borrados");
    } }, svg(ICO.papelera), h("span", { text: "Borrar todos" }));
    vista().replaceChildren(h("div", { class: "in" }, h("section", { class: "panel mk-pag" },
      barraVolver(),
      h("div", { class: "panel-cab" }, h("span", { class: "eyebrow", text: "Tu estudio · marcadores y notas" }), h("h1", { class: "texto", text: "Mis marcadores" }),
        h("p", { class: "q-lead", text: "Los versos que marcaste con un tema de color y tus notas de estudio, en el orden de los libros. Toca uno para volver a él." })),
      h("div", { class: "mk-ctl" }, buscador, chips),
      cuerpo,
      h("div", { class: "mk-acciones" },
        h("button", { class: "btn chico", type: "button", onclick: descargar }, svg(ICO.descargar), h("span", { text: "Exportar" })),
        h("button", { class: "btn chico", type: "button", onclick: () => abrirExportar("marcadores") }, svg(ICO.descargar), h("span", { text: "Obsidian (.md)" })),
        h("button", { class: "btn chico", type: "button", onclick: () => archivo.click() }, svg(ICO.importar), h("span", { text: "Importar" })),
        h("button", { class: "btn chico", type: "button", onclick: copiarTexto }, svg(ICO.copiar), h("span", { text: "Copiar como texto" })),
        h("button", { class: "btn chico", type: "button", onclick: editarTemas }, svg(ICO.opciones), h("span", { text: "Nombres de los temas" })),
        borrarTodo, archivo),
      h("p", { class: "nota-ui", text: "Tus marcadores se guardan solo en este navegador, sin cuentas ni servidores: nadie más los ve. Para tenerlos en otro dispositivo, usa «Exportar» aquí e «Importar» allá." }))));
    pintar();
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
  };
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
      const A = anadido(b.c, cap, v), aviso = avisoAnadido(b, cap, v, A);
      if (aviso) cont.append(aviso);
      if (A && !A.entero && A.p.i != null) for (const el of fila.children) if (+el.dataset.i >= A.p.i) el.classList.add("an");
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
    return [lentes, claves, encabezado(b, cap, "a"), cont, finCap(b, cap, "a")];
  }
  function abrirPalabraAnalisis(v, i) {
    const b = libroDe(esc.libro), cap = esc.cap;
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
    if (el) {
      marcarVerso(v);
      if (!intentarRestaurar()) {
        // al comienzo de un pasaje añadido, se lleva a la vista también su aviso
        const An = anadido(esc.libro, esc.cap, v), prev = An && An.ini ? (el.classList.contains("vs") ? el.closest(".peri") || el : el).previousElementSibling : null;
        const obj = prev && prev.classList.contains("aviso-anadido") ? prev : el;
        altoBarraHoja(); el.classList.add("cv-vis"); obj.scrollIntoView({ block: "start", behavior: "auto" }); asentar(obj);
      }
    }
    if (esc.modo === "a" && i != null && i !== "m") {
      // llegando desde «Ver en el análisis»: la palabra se muestra en su sitio y se ilumina; un enlace directo abre su ficha
      const d = destelloSig; destelloSig = null;
      if (d && d.c === esc.libro && d.cap === esc.cap && d.v === v && String(d.i) === String(i)) destellarPalabra(v, +i);
      else abrirPalabraAnalisis(v, i);
    }
    if (esc.modo !== "a" && i === "m") { const b = libroDe(esc.libro); if (b) abrirVerso(b, esc.cap, v, true); }
  }
  // Con content-visibility, la altura de lo que está antes del verso cambia al dibujarse: se corrige el salto cuadro a cuadro
  // hasta que el verso queda quieto en su sitio (se detiene si la persona toca o desplaza)
  function asentar(el) {
    let n = 0, quieto = 0, parar = false;
    const alto = () => { parar = true; };
    window.addEventListener("wheel", alto, { once: true, passive: true });
    window.addEventListener("touchstart", alto, { once: true, passive: true });
    const paso = () => {
      if (parar || !el.isConnected || ++n > 40 || quieto > 3) { window.removeEventListener("wheel", alto); window.removeEventListener("touchstart", alto); return; }
      const d = el.getBoundingClientRect().top - (parseFloat(getComputedStyle(el).scrollMarginTop) || 0);
      if (Math.abs(d) > 1.5) { saltarA(window.scrollY + d); quieto = 0; } else quieto++;
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
  function destellarPalabra(v, i) {
    const el = $("#vista .pal[data-v='" + v + "'][data-i='" + i + "']");
    if (!el) return;
    const vEl = document.getElementById("v" + v); if (vEl) vEl.classList.add("cv-vis");
    requestAnimationFrame(() => {
      el.scrollIntoView({ block: "center", behavior: "instant" });
      for (const x of $$("#vista .pal.destello")) x.classList.remove("destello");
      const ch = h("span", { class: "chispas", "aria-hidden": "true" }, Array.from({ length: 7 }, (_, k) => h("i", { style: "--k:" + k })));
      el.querySelector(".chispas") && el.querySelector(".chispas").remove();
      el.append(ch); void el.offsetWidth; el.classList.add("destello");
      setTimeout(() => { el.classList.remove("destello"); ch.remove(); }, 2600);
      ponerHash("#/" + esc.libro + "/" + esc.cap + "/a/" + v);
    });
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
      const tabla = h("table", { class: "paradigma" }, h("tbody", {}, par.slice(0, 14).map((r) => h("tr", { class: r[0] === t[0] && r[1] === t[2] ? "esta" : "" },
        h("td", {}, spanGk(T.F[r[0]])), h("td", { class: "m", text: abreviar(T.P[r[1]], T.MC[r[1]], 0, r[4]) || T.MD[r[1]] }), h("td", { text: r[3] ? T.TR[r[3]] : "" }), h("td", { class: "n", text: fmt(r[2]) })))));
      const lb = T.LB[li] || [];
      const pares = []; for (let k = 0; k < lb.length; k += 2) pares.push([lb[k], lb[k + 1]]);
      pares.sort((a, x) => x[1] - a[1]);
      const max = Math.max(1, ...pares.map((p) => p[1]));
      const contexto = h("div", { class: "contexto", lang: "grc" });
      toks.forEach((x, k) => { if (k) contexto.append(" "); contexto.append(h("button", { type: "button", "aria-current": k === ctx.i ? "true" : "false", onclick: () => mover(k), text: gk(T.F[x[0]]) }), punt(x[4])); });
      const enCap = ctx.desde === "analisis" && esc.libro === b.c && esc.cap === cap && esc.modo === "a";
      const pie = h("div", { class: "m-pie" },
        h("a", { class: "btn chico", href: "#/lema/" + li }, svg(ICO.lista), "Concordancia del lema"),
        enCap ? h("button", { class: "btn chico oro", type: "button", onclick: () => { const k = ctx.i; cerrarModal(); setTimeout(() => destellarPalabra(v, k), 60); } }, svg(ICO.lupa), "Ver en el análisis del capítulo")
          : h("a", { class: "btn chico oro", href: "#/" + b.c + "/" + cap + "/a/" + v + "/" + ctx.i, onclick: () => { destelloSig = { c: b.c, cap, v, i: ctx.i }; } }, svg(ICO.lupa), "Ver en el análisis del capítulo"));
      return cajaModal(cabModal(refCorta(b, cap, v), "Palabra " + (ctx.i + 1) + " de " + n + (b.t ? " · " + b.t : ""), nav),
        h("div", { class: "fp" },
          h("div", { class: "fp-pal" },
            h("div", { class: "fp-g", lang: "grc", text: T.F[t[0]] }),
            h("div", { class: "fp-tl" }, T.FT[t[0]], h("span", { class: "eyebrow", style: "margin-left:12px;font-style:normal", lang: "grc", text: uncial(T.F[t[0]]) })),
            h("div", { class: "fp-tr" + (tr ? "" : " sin") }, h("small", { text: "Traducción" }), tr || "Aún sin traducción fijada"),
            h("div", { class: "chips" }, chips.filter((c) => c[0]).map(([x, k]) => h("span", { class: "chip" + (k ? " k" : ""), style: k ? "--k:var(--c-" + cl + ")" : null, text: x }))),
            h("div", { class: "bloque" }, h("h4", { text: "En el verso" }), contexto, ctx.L ? h("p", { class: "contexto-es", style: "margin:0" }, txtVerso(ctx.L)) : null),
            h("div", { class: "bloque" }, h("h4", { text: "Análisis morfológico" }), h("dl", { class: "dl" }, filas)),
            h("div", { class: "bloque" }, h("h4", { text: "Ediciones" }), h("p", { class: "nota-ui", text: sin.length ? "No figura en: " + sin.join(", ") + "." : "Presente en las ocho ediciones cotejadas (" + T.ediciones.join(", ") + ")." })),
            h("div", { class: "bloque" }, h("h4", { text: "En los manuscritos antiguos" }), msPalabra(ctx))),
          h("div", { class: "fp-pal" },
            h("div", { class: "bloque" }, h("h4", { text: "Lema" }),
              h("div", { class: "lema-l" }, h("span", { class: "g", lang: "grc", text: T.L[li] }), h("small", { text: T.LT[li] })),
              h("p", { class: "nota-ui", text: fmt(T.LN[li]) + " veces en la Nueva Voluntad; esta forma, " + fmt(T.FN[t[0]]) + "." })),
            h("div", { class: "bloque" }, h("h4", { text: "Formas del lema" + (par.length > 14 ? " · las 14 más frecuentes de " + par.length : "") }), tabla),
            pares.length > 1 ? h("div", { class: "bloque" }, h("h4", { text: "Dónde aparece" }), h("div", { class: "barras" }, pares.slice(0, 10).map(([bi, k]) => {
              const bb = D.libros[bi];
              return h("div", {}, h("span", { text: bb.t || bb.n, title: nombreLibro(bb) }), h("i", { style: "width:" + (100 * k / max).toFixed(1) + "%" }), h("em", { text: fmt(k) }));
            }))) : null)),
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
  const msCap = (c, cap) => cargar("datos/manuscritos/" + c + "/" + cap + ".json").then((d) => {
    if (!d.__n) {
      for (const x of Object.values(d)) {
        if (!x || typeof x !== "object") continue;
        for (const w of x.w || []) if (typeof w[2] === "string") w[2] = w[2].replace(/\uFFFD/g, DESC);
        for (const v of x.v || []) if (typeof v[2] === "string") v[2] = v[2].replace(/\uFFFD/g, DESC);
      }
      Object.defineProperty(d, "__n", { value: true });
    }
    return d;
  });
  async function msVerso(c, cap, v) { const [Tg, MC] = await Promise.all([testigos(), msCap(c, cap)]); return { Tg, X: MC[String(v)] || null }; }
  const idBase = (id) => String(id).replace(/[*c]$/, "");
  const siglaDe = (Tg, id) => { const t = Tg.porId.get(idBase(id)); const suf = /\*$/.test(id) ? "*" : /c$/.test(id) ? "ᶜ" : ""; return (t ? t.s : idBase(id)) + suf; };
  const ordenarTestigos = (Tg, ids) => [...new Set(ids)].sort((a, b) => ((Tg.porId.get(idBase(a)) || {}).i ?? 999) - ((Tg.porId.get(idBase(b)) || {}).i ?? 999));
  const sigmaFinal = (s) => String(s || "").replace(/σ(?=\s|$)/g, "ς");
  const SINAITICO = { MAT: 33, MRK: 34, LUK: 35, JHN: 36, ROM: 37, "1CO": 38, "2CO": 39, GAL: 40, EPH: 41, PHP: 42, COL: 43, "1TH": 44, "2TH": 45, HEB: 46, "1TI": 47, "2TI": 48, TIT: 49, PHM: 50, ACT: 51, JAS: 52, "1PE": 53, "2PE": 54, "1JN": 55, "2JN": 56, "3JN": 57, JUD: 58, REV: 59 };
  function enlacesImagen(id, c, cap, v) {
    const out = [];
    if (id === "01" && SINAITICO[c]) out.push(["Ver este verso en el Codex Sinaiticus [Códice Sinaiticus]", "https://codexsinaiticus.org/en/manuscript.aspx?book=" + SINAITICO[c] + "&chapter=" + cap + "&lid=en&side=r&verse=" + v + "&zoomSlider=0"]);
    if (id === "03") out.push(["DigiVatLib · Bibliotheca Apostolica Vaticana [Biblioteca Apostólica Vaticana] (Vat. gr. 1209)", "https://digi.vatlib.it/view/MSS_Vat.gr.1209"]);
    if (id === "05") out.push(["Cambridge Digital Library [Biblioteca Digital de Cambridge]", "https://cudl.lib.cam.ac.uk/view/MS-NN-00002-00041/1"]);
    const doc = /^P\d+$/.test(id) ? 10000 + +id.slice(1) : /^0\d+$/.test(id) ? 20000 + +id : null;
    if (doc) out.push(["Imágenes y transcripción del Institut für Neutestamentliche Textforschung [Instituto para la Investigación Textual del Nuevo Testamento], Münster", "https://ntvmr.uni-muenster.de/manuscript-workspace?docID=" + doc]);
    return out;
  }
  const palBase = (toks, k) => (toks && toks[k] ? T.F[toks[k][0]] : "");
  const TIPO_MS = { om: "omite", add: "añade", sust: "otra palabra", orden: "otro orden", ausente: "sin el verso" };
  function frasePlana(v, toks) {
    const [tipo, pos, lect] = v;
    const g = (s) => h("span", { class: "gk-ms", lang: "grc", text: s });
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
    const tes = h("span", { class: "ms-sig" }, " " + ordenarTestigos(Tg, ids).map((id) => siglaDe(Tg, id)).join(" "));
    const p = (k) => palBase(toks, k);
    if (tipo === "ausente") return ["vers. om.", tes];
    if (tipo === "om") return (pos.length > 1 ? [signo("omA"), pos.map(p).join(" "), signo("omZ")] : [signo("om1"), p(pos[0])]).concat([" om.", tes]);
    if (tipo === "add") return [signo("add"), (pos[0] >= 0 ? " (tras " + p(pos[0]) + ")" : " (al comienzo)") + " " + sigmaFinal(lect), tes];
    if (tipo === "sust") return [signo("sust"), p(pos[0]) + "] " + sigmaFinal(lect), tes];
    if (tipo === "orden") return [signo("ordA"), p(pos[0]), signo("ordZ"), " transp.", tes];
    return [tipo, tes];
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
  // Resumen breve en la ventana del verso
  function resumenManuscritos(ctx, al) {
    const caja = h("div", { class: "ms-res" }, h("span", { class: "cargando-mini", text: "Consultando los manuscritos antiguos…" }));
    msVerso(ctx.b.c, ctx.cap, ctx.v).then(({ Tg, X }) => {
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
    }).catch(() => caja.replaceChildren(h("span", { class: "nota-ui", text: "No se pudieron consultar los manuscritos." })));
    return caja;
  }
  const siglo = (a) => { const s = Math.floor((a - 1) / 100) + 1; return "el siglo " + ["", "I", "II", "III", "IV", "V", "VI", "VII"][s]; };
  function vistaManuscritos(ctx) {
    return () => {
      const { b, cap, v } = ctx;
      const cuerpo = h("div", { class: "ms" }, cargando("Abriendo los manuscritos…"));
      const modo = prefs.msModo || "sencillo";
      Promise.all([msVerso(b.c, cap, v), ctx.toks ? Promise.resolve(ctx.toks) : versoTokens(b.c, cap, v)]).then(([{ Tg, X }, toks]) => {
        ctx.toks = toks;
        if (!cuerpo.isConnected && cuerpo.parentNode == null) { /* sigue: se pinta al mostrarse */ }
        pintarMs(cuerpo, ctx, Tg, X, toks, modo);
      }).catch(() => cuerpo.replaceChildren(fallo("No se pudieron cargar los manuscritos.")));
      const seg = h("div", { class: "seg", role: "group", "aria-label": "Nivel de detalle" }, [["sencillo", "Sencillo"], ["experto", "Aparato crítico"]].map(([k, t]) => h("button", { type: "button", "aria-pressed": String(modo === k), onclick: () => { prefs.msModo = k; guardarPrefs(); reemplazar(vistaManuscritos(ctx)); } }, t)));
      return cajaModal(cabModal("Manuscritos · " + refCorta(b, cap, v), "Los declarantes griegos más antiguos (hasta c. 400 d.H.D.)"),
        h("div", {}, h("div", { class: "ms-barra" }, elegirTextoMs(ctx), seg), cuerpo,
          h("p", { class: "creditos-ms" }, "Transcripciones: ", h("a", { href: "https://greekcntr.org", target: "_blank", rel: "noopener", text: "Center for New Testament Restoration" }), " [Centro para la Restauración del Nuevo Testamento] (CC BY-SA 4.0). Fechas aproximadas.")));
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
    const experto = modo === "experto";
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
      [100, 200, 300, 400, 500].map((a) => h("span", { class: "ms-marca", style: "left:" + ((a - min) / (max - min) * 100) + "%", text: ["", "s. II", "s. III", "s. IV", "s. V"][(a - 100) / 100] || "" })),
      pres.map((x) => h("span", { class: "ms-punto" + (x.cob ? "" : " sin"), style: "left:" + (((x.t.a + x.t.z) / 2 - min) / (max - min) * 100).toFixed(1) + "%", title: x.t.s + " · " + (x.t.n || "") + " · " + x.t.f, text: x.t.s })));
    // diferencias
    const lista = h("div", { class: "ms-vars" }, vars.length ? vars.map((x, k) => {
      const ids = ordenarTestigos(Tg, x[3]);
      const t = h("div", { class: "ms-var v-" + x[0], "data-k": k },
        h("div", { class: "mv-tipo", text: TIPO_MS[x[0]] || x[0] }),
        experto ? h("div", { class: "mv-ap", lang: "grc" }, lineaAparato(x, toks, Tg)) : h("p", { class: "mv-fr" }, frasePlana(x, toks)),
        h("div", { class: "mv-tes" }, ids.map((id) => { const tg = Tg.porId.get(idBase(id)) || {}; return h("span", { class: "chip", title: (tg.n || "") + (tg.f ? " · " + tg.f : "") + (/\*$/.test(id) ? " · primera mano" : /c$/.test(id) ? " · corrección posterior" : ""), text: siglaDe(Tg, id) + (experto ? "" : tg.f ? " · " + tg.f : "") }); })));
      tarjetas.push(t);
      return t;
    }) : h("p", { class: "nota-ui", text: "Los manuscritos antiguos que conservan este verso coinciden con el texto base, salvo detalles de ortografía (itacismos, ν final, letras dobles)." }));
    // cada testigo
    const sep = !!prefs.msEsp;
    const filas = h("div", { class: "ms-testigos" + (sep ? " sep" : "") }, pres.map((x) => {
      const det = h("details", { class: "ms-t" }); det._txt = x.txt;
      const im = enlacesImagen(x.t.id, b.c, cap, v);
      det.append(h("summary", {},
        h("span", { class: "mt-s", lang: "grc", text: x.t.s }),
        h("span", { class: "mt-n" }, h("b", { text: x.t.n || x.t.s }), h("small", { text: [x.t.f, x.t.in].filter(Boolean).join(" · ") })),
        h("span", { class: "mt-c", title: x.cob ? "Parte del verso que se lee en este manuscrito" : "No contiene el verso" }, x.cob ? h("i", { style: "width:" + x.cob + "%" }) : null, h("em", { text: x.cob ? x.cob + " %" : "—" }))));
      det.addEventListener("toggle", () => {
        if (!det.open || det.dataset.listo) return;
        det.dataset.listo = "1";
        det.append(h("div", { class: "mt-cuerpo" },
          h("p", { class: "nota-ui", text: x.t.co ? "Contiene: " + conNombres(x.t.co) + "." : "" }),
          diplomatica(x.txt, sep),
          h("p", { class: "nota-ui mt-ley", text: "Transcripción letra por letra, con los cambios de línea del manuscrito. Raya: abreviatura (nombre sagrado o número). Punto debajo: letra dañada. ◌: letra que está pero no se puede identificar. [ ]: letras perdidas. ᶜ: corrección de otra mano." }),
          im.length ? h("div", { class: "mt-img" }, im.map(([t, u]) => h("a", { class: "btn chico", href: u, target: "_blank", rel: "noopener" }, svg(ICO.externo), t))) : null));
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
      h("p", { class: "ms-intro" }, experto ? "Aparato crítico de los manuscritos griegos más antiguos frente al texto base (edición crítica). " : "Así se lee este verso en los manuscritos más antiguos que se conservan. ",
        resumen.length + (resumen.length === 1 ? " manuscrito lo conserva" : " manuscritos lo conservan") + (vars.length ? "; " + vars.length + (vars.length === 1 ? " diferencia." : " diferencias.") : "; coinciden con el texto base.")),
      h("div", { class: "bloque" }, h("h4", { text: "En el tiempo" }), eje),
      h("div", { class: "bloque" }, h("h4", { text: "El texto base" + (vars.length ? " · toca una palabra marcada" : "") }), texto,
        vars.length ? h("p", { class: "nota-ui ms-ley" }, h("span", { class: "ms-w v-om", text: "omitida" }), " ", h("span", { class: "ms-w v-sust", text: "cambiada" }), " ", h("span", { class: "ms-w v-orden", text: "de otro orden" }), " ", h("span", { class: "ms-add" }, signo("add", false)), " añadido",
          vars.some((x) => String(x[2] || "").includes(DESC)) ? [" ", h("span", { class: "ms-desc", text: DESC }), " letra que no se puede identificar"] : null) : null),
      h("div", { class: "bloque" }, h("h4", { text: experto ? "Aparato" : "Diferencias" }), lista, experto && vars.length ? leyendaSignos() : null),
      h("div", { class: "bloque" }, h("h4", {}, "Cada manuscrito"), h("div", { class: "ms-ctl" }, sepBtn, pres.length > 1 ? abrirTodos : null), filas),
      eds || "");
  }

  // Diferencias de los manuscritos antiguos en una palabra concreta
  function msPalabra(ctx) {
    const caja = h("div", { class: "ms-pal" }, h("span", { class: "cargando-mini", text: "Consultando…" }));
    const { b, cap, v, toks } = ctx, i = ctx.i;
    msVerso(b.c, cap, v).then(({ Tg, X }) => {
      if (!X || !X.w.length) { caja.replaceChildren(h("p", { class: "nota-ui", text: "Ningún manuscrito de antes del año 400 conserva este verso." })); return; }
      const vs = X.v.filter((x) => x[0] === "ausente" || (x[0] === "add" ? x[1][0] === i || x[1][0] === i - 1 : x[1].includes(i)));
      const verTodo = h("button", { class: "enlace", type: "button", onclick: () => empujar(vistaManuscritos({ b, cap, v, toks })), text: "Ver el verso en los manuscritos" });
      if (!vs.length) { caja.replaceChildren(h("p", { class: "nota-ui" }, "En los manuscritos antiguos que conservan este verso no hay diferencias en esta palabra. ", verTodo, ".")); return; }
      caja.replaceChildren(...vs.map((x) => h("p", { class: "ms-pal-v" }, frasePlana(x, toks), " ", h("span", { class: "ms-sig", lang: "grc", text: ordenarTestigos(Tg, x[3]).map((id) => siglaDe(Tg, id)).join(" ") }))), h("p", { class: "nota-ui" }, verTodo, "."));
    }).catch(() => caja.replaceChildren(h("p", { class: "nota-ui", text: "No se pudieron consultar los manuscritos." })));
    return caja;
  }
  // Ventana del verso: su texto y todas sus palabras; cada palabra abre su ficha
  function vistaVerso(ctx) {
    return () => {
      const { b, cap, versos } = ctx;
      const k = versos.findIndex((x) => x.v === ctx.v);
      const L = versos[k] || null;
      const mover = (j) => { const x = versos[j]; if (!x) return; ctx.v = x.v; ctx.toks = null; marcarVerso(x.v); ponerHash("#/" + b.c + "/" + cap + "/l/" + x.v); reemplazar(vistaVerso(ctx)); };
      const nav = { prev: k > 0 ? () => mover(k - 1) : null, next: k >= 0 && k < versos.length - 1 ? () => mover(k + 1) : null, etiqueta: ["Verso anterior", "Verso siguiente"] };
      M.nav = nav;
      const zona = h("div", { class: "palabras" });
      const llenar = (toks) => {
        zona.replaceChildren(...toks.map((t, i) => tarjetaPalabra(t, () => empujar(vistaPalabra({ b, cap, v: ctx.v, toks, i, L, desde: "verso" })))));
      };
      if (ctx.toks) llenar(ctx.toks);
      else {
        zona.append(cargando("Cargando el griego…"));
        const vEsperado = ctx.v;
        versoTokens(b.c, cap, ctx.v).then((toks) => { if (ctx.v !== vEsperado) return; ctx.toks = toks; if (zona.isConnected) llenar(toks); })
          .catch(() => zona.replaceChildren(fallo("No se pudo cargar el griego del verso.")));
      }
      return cajaModal(cabModal(refCorta(b, cap, ctx.v), b.t ? b.t + " " + cap + ":" + ctx.v : "", nav),
        h("div", { class: "fv" },
          avisoAnadido(b, cap, ctx.v, anadido(b.c, cap, ctx.v), true),
          L ? h("div", { class: "chip-estado n-" + L.n }, h("i"), estadoEt(L.n) + (L.n === "base" ? " · " + L.k + " % de las palabras ya traducidas" : "")) : null,
          L ? h("p", { class: "fv-es" + (anadido(b.c, cap, ctx.v) ? " an-ventana" : "") }, txtVerso(L)) : null,
          h("div", { class: "bloque" }, h("h4", { text: "Palabra por palabra · toca una para ver su análisis" }), zona),
          bloqueEstudio(b, cap, ctx.v),
          h("div", { class: "bloque" }, h("h4", { text: "En los manuscritos antiguos" }), resumenManuscritos({ b, cap, v: ctx.v }, () => empujar(vistaManuscritos(ctx)))),
          enlaceFuenteQ(b.c, cap, ctx.v)),
        h("div", { class: "m-pie" },
          L ? h("button", { class: "btn chico", type: "button", onclick: () => compartir(nombreLibro(b) + " " + cap + ":" + ctx.v, textoPlano(L.t), "#/" + b.c + "/" + cap + "/l/" + ctx.v) }, svg(ICO.compartir), "Compartir") : null,
          h("button", { class: "btn chico", type: "button", onclick: () => empujar(vistaManuscritos(ctx)) }, svg(ICO.manuscrito), "Manuscritos"),
          h("a", { class: "btn chico oro", href: "#/" + b.c + "/" + cap + "/a/" + ctx.v }, svg(ICO.lupa), "Analizar el capítulo")));
    };
  }
  // ------------------------------------------------------------------ buscador inteligente (ventana)
  // Entiende citas, libros, escenas descritas con palabras propias, nombres, palabras griegas (también con letras latinas),
  // las palabras con que se recuerdan los versos en otras traducciones y preguntas sobre el uso de la página.
  const VERSIONES = { busqueda: "23a490b7e4", voz: "87ff475d00" }; // la huella de cada archivo la pone wix/sellar.py
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
  let BQX = null, bqListo = false;
  function prepararBuscador() {
    if (!BQX) BQX = Promise.all([cargarScript("busqueda"), cargar("datos/busqueda/indice.json"), cargar("datos/busqueda/conceptos.json").catch(() => []),
      cargar("datos/busqueda/escenas.json").catch(() => []), cargar("datos/busqueda/ayuda.json").catch(() => []), tablas()])
      .then(([, I, C, E, A]) => {
        const BQ = window.BiExBusqueda;
        const R = BQ.preparar(I);
        bqListo = true;
        return { BQ, R, ctx: { libros: D.libros, conceptos: BQ.conceptos(C), griego: BQ.prepararGriego(T), escenas: E, ayuda: A } };
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
      ["Preguntas", EJ_PREG, 3]];
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
      h("p", { class: "nota-ui", text: "Escribe como lo recuerdes, aunque no sea con las palabras de BiEx: el buscador entiende escenas, nombres, lugares, citas, palabras griegas y preguntas sobre la página. Para buscar solo en un libro, termina con «en Marcos», «en Romanos»…" }),
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
    const r = X.BQ.buscar(X.R, q, X.ctx);
    const grupos = [];
    const grupo = (tit, ...kids) => h("section", { class: "bq-g" }, h("h3", {}, tit), kids);
    const abrirRes = (ruta) => (e) => { recordarBusqueda(q, ruta); };
    // respuesta de ayuda
    if (r.ayuda.length) grupos.push(grupo("Respuesta", r.ayuda.map(({ it }) => h("div", { class: "res-ayuda" }, h("h4", { text: it.p }), h("p", { text: it.r }), accionAyuda(it.a, elegir)))));
    // cita
    if (r.cita && r.cita.cap) {
      const { b, cap, v, hasta } = r.cita, ruta = "#/" + b.c + "/" + cap + (v ? "/l/" + v : "");
      const snip = h("div", { class: "res-cita-tx" });
      if (v) lectura(b.c).then((Lc) => {
        const vs = (Lc.caps[cap] || []).filter((x) => x.v >= v && x.v <= (hasta || v)).slice(0, 6);
        snip.replaceChildren(...vs.map((x) => h("p", {}, h("sup", { text: x.v }), " ", txtVerso(x))));
      }).catch(() => {});
      grupos.push(grupo("Cita", h("div", { class: "res-cita" },
        h("div", { class: "rc-cab" }, h("b", { text: nombreLibro(b) + " " + cap + (v ? ":" + v + (hasta ? "-" + hasta : "") : "") }),
          h("span", { class: "rc-acc" }, h("a", { class: "btn chico oro", href: ruta, onclick: abrirRes(ruta) }, svg(ICO.libro), "Leer"), h("a", { class: "btn chico", href: "#/" + b.c + "/" + cap + "/a" + (v ? "/" + v : "") }, svg(ICO.lupa), "Analizar"))),
        snip)));
    }
    // libros
    const libros = []; for (const b of [r.cita && !r.cita.cap ? r.cita.b : null, ...r.libros]) if (b && !libros.includes(b)) libros.push(b);
    if (libros.length) grupos.push(grupo("Libros", h("div", { class: "res-libros" }, libros.map((b) => h("a", { class: "res-libro", href: "#/" + b.c + "/1", onclick: abrirRes("#/" + b.c + "/1") },
      h("b", { text: b.t || b.n }), h("span", { text: b.n + (fechaEscrito(b) ? " · escrito c. " + fechaEscrito(b).replace(/^c\. /, "") : "") }))))));
    // filtro por libro y correcciones
    const avisos = [];
    if (r.filtro) avisos.push(h("span", { class: "chip" }, "Solo en " + nombreLibro(r.filtro) + " ", h("button", { class: "enlace", type: "button", onclick: () => elegir(q.replace(/\s+(?:en|de|del libro de|en el libro de)\s+[^]*$/i, "")), text: "(quitar)" })));
    if (r.versos && r.versos.correcciones.length) avisos.push(h("span", { class: "nota-ui", text: "También se buscó: " + r.versos.correcciones.map(([a, b]) => "«" + a + "» como «" + b + "»").join(", ") + "." }));
    // escenas
    if (r.escenas.length) grupos.push(grupo("Escenas", h("div", { class: "res-escenas" }, r.escenas.map(({ it }) => {
      const rs = it._r || X.BQ.rangos(it.r);
      return h("div", { class: "res-escena" },
        h("a", { class: "re-t", href: refRuta(rs[0]), onclick: abrirRes(refRuta(rs[0])) }, h("b", { text: it.t }), h("small", { text: it.s })),
        h("div", { class: "re-refs" }, rs.slice(0, 5).map((x) => h("a", { href: refRuta(x), onclick: abrirRes(refRuta(x)), text: refTexto(x) }))));
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
          lectura(lib).then((Lc) => { const L = (Lc.caps[c] || []).find((y) => y.v === v); tx.replaceChildren(L ? resaltar(h("span", { class: "vt" }, txtVerso(L)), terminos, X.BQ) : ""); }).catch(() => { tx.textContent = ""; });
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
    const st = { q: q0 || "" };
    prepararBuscador().catch(() => {});
    abrirModal(() => {
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
      setTimeout(() => { if (!st.q) inp.focus(); buscarYa(); }, 30);
      return cajaModal(cabModal("Buscar", "Escenas, nombres, citas, palabras, griego o preguntas"),
        h("div", { class: "bq" }, h("label", { class: "bq-campo" }, svg(ICO.buscar), inp, borrar), estado, res),
        h("div", { class: "m-pie m-pie-bq" },
          h("button", { class: "btn chico", type: "button", onclick: cerrarModal }, svg(ICO.atras), "Volver"),
          h("a", { class: "btn chico", href: "#/buscar" }, svg(ICO.filtros), "Búsqueda morfológica")));
    });
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
    vista().replaceChildren(cargando("Preparando la concordancia…"));
    alTope();
    try { await tablas(); } catch (e) { vista().replaceChildren(fallo("No se pudieron cargar los datos.")); return; }
    let X = null; try { X = await prepararBuscador(); } catch (e) { X = null; }
    const glosas = (li) => [...new Set((T.LP[li] || []).map((r) => r[3]).filter(Boolean))].slice(0, 3).map((x) => T.TR[x]).join(" · ");
    const fila = (li) => h("li", {}, h("a", { class: "cc-it", href: "#/lema/" + li },
      h("b", { lang: "grc", text: T.L[li] }), h("span", { class: "cc-tr", text: T.LT[li] !== T.L[li] ? T.LT[li] : "" }),
      h("span", { class: "cc-gl", text: glosas(li) }), h("em", { text: fmt(T.LN[li]) })));
    const frecuentes = T.L.map((_, i) => i).sort((a, b) => T.LN[b] - T.LN[a]).slice(0, 60);
    let latinos = null;
    const buscarLemas = (q) => {
      const out = new Map(), pon = (li, v) => { if (li != null && li >= 0) out.set(li, Math.max(out.get(li) || 0, v)); };
      if (/[\u0370-\u03ff\u1f00-\u1fff]/.test(q)) {
        const k = claveGr(q);
        T.Fk.forEach((x, fi) => { if (x === k) pon(T.formaLema.get(fi), 5); });
        T.Lk.forEach((x, li) => { if (x === k) pon(li, 6); else if (x.startsWith(k)) pon(li, 4); else if (k.length > 2 && x.includes(k)) pon(li, 2); });
      } else if (X) {
        const B = X.BQ, kq = B.claveLatina(q.replace(/\s+/g, ""));
        if (!latinos) latinos = T.L.map((l) => B.claveLatina(B.translit(String(l).split(/,\s*/)[0])));
        if (kq.length >= 2) latinos.forEach((x, li) => { if (x === kq) pon(li, 6); else if (x.startsWith(kq)) pon(li, 4); });
        const e = claveEs(q);
        if (e.length >= 3) T.TRk.forEach((x, ti) => { if (ti && x.includes(e)) for (const li of T.TL[ti] || []) pon(li, x === e ? 3 : 1); });
      }
      return [...out.entries()].sort((a, b) => b[1] - a[1] || T.LN[b[0]] - T.LN[a[0]]).slice(0, 60).map(([li]) => li);
    };
    const entrada = h("input", { type: "search", class: "cc-q", placeholder: "λόγος · logos · discurso", "aria-label": "Buscar un lema", autocomplete: "off", autocapitalize: "off", spellcheck: "false" });
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
        h("p", { class: "nota-ui", text: "Cada lema (la forma de diccionario) reúne todas sus formas y apariciones en la Nueva Voluntad. Escríbelo en griego, con letras latinas o por su traducción." })),
      h("div", { class: "cc-buscar" }, svg(ICO.buscar), entrada),
      vistos.length ? h("div", { class: "cc-vistos" }, h("span", { class: "rotulo", text: "Vistos hace poco" }), h("div", { class: "chips" }, vistos.map((li) => h("a", { class: "chip", lang: "grc", href: "#/lema/" + li, text: T.L[li] })))) : null,
      h("div", { class: "tarjeta" }, titulo, lista))));
    pintar();
    if (!EMBED && !matchMedia("(pointer: coarse)").matches) entrada.focus({ preventScroll: true });
  }
  async function vistaLema(li) {
    navActual("#/buscar");
    vista().replaceChildren(cargando("Cargando el lema…"));
    alTope();
    try { await tablas(); } catch (e) { vista().replaceChildren(fallo("No se pudieron cargar los datos.")); return; }
    if (!(li >= 0 && li < T.L.length)) return noEncontrado();
    document.title = T.L[li] + " · BiEx";
    store.set("lemasVistos", [li].concat(store.get("lemasVistos", []).filter((x) => x !== li)).slice(0, 12));
    const par = T.LP[li] || [];
    const lb = T.LB[li] || [];
    const pares = []; for (let k = 0; k < lb.length; k += 2) pares.push([lb[k], lb[k + 1]]);
    const max = Math.max(1, ...pares.map((p) => p[1]));
    const trads = [...new Set(par.map((r) => r[3]).filter(Boolean))].slice(0, 12);
    // Apariciones plegadas por libro: se ve cada libro con su número de apariciones y se abre solo el que interesa
    // (sus datos se traen al abrirlo); lo abierto se recuerda al volver atrás
    const abiertos = new Set((() => { try { return JSON.parse(sessionStorage.getItem("biex:lemaAb") || "{}")[li] || []; } catch (e) { return []; } })());
    const guardarAb = () => { try { const o = JSON.parse(sessionStorage.getItem("biex:lemaAb") || "{}"); o[li] = [...abiertos]; sessionStorage.setItem("biex:lemaAb", JSON.stringify(o)); } catch (e) { /* sin almacenamiento */ } };
    const grupos = pares.map(([bi, n]) => {
      const b = D.libros[bi];
      const lista = h("ol", { class: "citas" }), mas = h("button", { class: "btn chico", type: "button", hidden: true, text: "Mostrar más" });
      const det = h("details", { class: "ap-libro", "data-c": b.c, open: abiertos.has(b.c) ? true : null },
        h("summary", {}, h("span", { class: "apl-t" }, h("b", { text: b.t || b.n }), b.t ? h("small", { text: b.n }) : null),
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
    const todosBtn = pares.length > 1 ? h("button", { class: "btn chico", type: "button", onclick: () => { const abrir = !grupos.every((d) => d.open); for (const d of grupos) d.open = abrir; todosBtn.textContent = abrir ? "Plegar todo" : "Desplegar todo"; } }, grupos.every((d) => d.open) ? "Plegar todo" : "Desplegar todo") : null;
    vista().replaceChildren(h("div", { class: "in" }, h("section", { class: "panel" },
      h("div", { class: "barra-volver" }, h("button", { class: "btn chico", type: "button", onclick: volverAtras }, svg(ICO.atras), "Volver"),
        h("a", { class: "btn chico", href: "#/lema" }, svg(ICO.buscar), "Otra palabra")),
      h("div", { class: "panel-cab" }, h("span", { class: "eyebrow", text: "Concordancia del lema" }),
        h("h1", { lang: "grc" }, T.L[li], h("small", { text: T.LT[li] })),
        h("p", { class: "nota-ui", text: fmt(T.LN[li]) + " apariciones en " + pares.length + (pares.length === 1 ? " libro" : " libros") + ", en " + par.length + (par.length === 1 ? " forma" : " formas") + " distintas." }),
        trads.length ? h("div", { class: "chips" }, trads.map((x) => h("span", { class: "chip", text: T.TR[x] }))) : null),
      h("div", { class: "columnas" },
        h("div", { class: "tarjeta" }, h("h2", { text: "Formas" }), h("table", { class: "paradigma" }, h("tbody", {}, par.map((r) => h("tr", {},
          h("td", {}, spanGk(T.F[r[0]])), h("td", { class: "m", text: mdTok([r[0], 0, r[1], 0, "", 0, 0, r[4]]) }), h("td", { text: r[3] ? T.TR[r[3]] : "" }), h("td", { class: "n", text: fmt(r[2]) })))))),
        h("div", { class: "tarjeta" }, h("h2", { text: "Por libro" }), h("div", { class: "barras" }, pares.map(([bi, n]) => {
          const b = D.libros[bi];
          return h("div", {}, h("a", { href: "#/" + b.c + "/1/a", text: b.t || b.n, title: "Ver sus apariciones en " + nombreLibro(b), onclick: (e) => { e.preventDefault(); abrirLibroAp(b.c); } }), h("i", { style: "width:" + (100 * n / max).toFixed(1) + "%" }), h("em", { text: fmt(n) }));
        })))),
      h("div", { class: "tarjeta" }, h("div", { class: "apl-cab" }, h("h2", { text: "Apariciones por libro" }), todosBtn),
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
      x.L ? h("span", { class: "stx" }, txtVerso(x.L)) : (tr ? h("span", { class: "stx", text: tr }) : null)));
  }

  // ------------------------------------------------------------------ búsqueda
  async function vistaBuscar() {
    document.title = "Búsqueda morfológica · BiEx";
    navActual("#/buscar");
    vista().replaceChildren(cargando("Preparando la búsqueda…"));
    alTope();
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
        const m = T.P[mi], cl = T.MC[mi];
        if (f.pos && cl !== f.pos) return false;
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
      if (d !== decada) { decada = d; lista.append(h("li", { class: "tl-dec", "aria-hidden": "true" }, h("span", { text: d === "antes" ? "Antes del Hijo de Dios" : d === 0 ? "Primeros años después del Hijo de Dios" : "Años " + d }))); }
      if (x.tipo === "es") {
        const b = x.b;
        lista.append(h("li", { class: "tl-it tl-es", id: x.id }, h("span", { class: "tl-f", text: fechaDe(x) }),
          h("a", { class: "tl-c", href: "#/" + b.c + "/1" }, h("span", { class: "tl-k", text: "Se escribe" }), h("b", { text: b.t || b.n }), h("small", { text: b.n }))));
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
                return h("div", { class: "tl-cita" }, h("a", { class: "tl-ref", href: refRuta(r), text: refTexto(r) }), vs.slice(0, 8).map(([c, y]) => h("p", {}, h("sup", { text: (c !== r[1] ? c + ":" : "") + y.v }), " ", txtVerso(y))));
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
    const seg = h("div", { class: "seg", role: "group", "aria-label": "Qué mostrar" }, [["todo", "Todo"], ["hechos", "Acontecimientos"], ["escritos", "Escritura de los libros"]].map(([k, t]) => h("button", { type: "button", "aria-pressed": String(ver === k), onclick: () => { store.set("cronoVer", k); vistaCronologia(foco); } }, t)));
    vista().replaceChildren(h("div", { class: "in" }, h("section", { class: "panel" },
      barraVolver(),
      h("div", { class: "panel-cab" }, h("span", { class: "eyebrow", text: "Nueva Voluntad · c. 7 " + ERA_A + " – 70 " + ERA_D }), h("h1", { class: "texto", text: "Línea del tiempo" }),
        h("p", { class: "nota-ui tl-intro", text: "Lo que narra la Nueva Voluntad y cuándo se escribió cada libro. Todos se escribieron antes del año 70, cuando ῾Hrṓmē [Roma] destruyó Yᵉrūshāláyim [Jerusalén] y su templo, tal como se había anunciado: el propio texto da las claves para entender lo que anuncia, y la historia lo confirma." })),
      h("div", { class: "tl-conj" }, mapa, info,
        h("div", { class: "tl-ley" }, h("span", { class: "ev", text: "Acontecimiento" }), h("span", { class: "es", text: "Se escribe un libro" }), h("span", { class: "clave", text: "Año 70 " + ERA_D }), h("span", { class: "nota-era", text: ERA_A + ": antes del Hijo de Dios · " + ERA_D + ": después del Hijo de Dios" }))),
      h("div", { class: "tl-ctl" }, seg),
      lista,
      h("div", { class: "tarjeta tl-fuentes" }, h("h2", { text: "Fechas y fuentes" }), h("p", { class: "nota-ui", text: CRONO.nota }),
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
        bx && L ? h("p", { class: "q-bx" }, txtVerso(L)) : null)));
  }
  // Estudios: «Lo que pocos saben», «Por qué estas fechas» y «Falacias lógicas» (datos/estudios.json, con los nombres ya
  // en su forma de BiEx); los pasajes son enlaces y cada dato lleva sus fuentes
  let EST = null;
  const ESTUDIOS = [["datos", "Lo que pocos saben", ICO.chispa], ["fechas", "Por qué estas fechas", ICO.tiempo], ["falacias", "Falacias lógicas", ICO.balanza]];
  async function vistaEstudio(k) {
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
      cuerpo = h("div", { class: "est-lista" }, pg.items.map((it, i) => h("article", { class: "est-item", id: "e" + (i + 1) },
        h("span", { class: "est-n", "aria-hidden": "true", text: String(i + 1).padStart(2, "0") }),
        h("div", { class: "est-c" }, h("h2", { text: it.t }), pars(it.p), refs(it.r), fuentes(it.f)))));
    } else if (k === "fechas") {
      const L = CRONO ? CRONO.ordenes.escritura.map(libroDe).filter(Boolean) : [];
      const tabla = L.length ? h("div", { class: "est-fechas" }, h("h2", { text: "Los 27 libros por su fecha de escritura" }),
        h("ol", { class: "est-tabla" }, L.map((b) => h("li", {}, h("a", { href: "#/" + b.c + "/1" }, h("b", { text: b.t || b.n }), b.t ? h("small", { text: b.n }) : null), h("span", { text: (fechaEscrito(b) || "").replace(/^c\. /, "c. ") + (/H\.D\./.test(fechaEscrito(b)) ? "" : " " + ERA_D) }))))) : null;
      cuerpo = h("div", { class: "est-secs" }, pg.secciones.map((sc) => h("section", { class: "est-sec" }, h("h2", { text: sc.t }), pars(sc.p), refs(sc.r))), tabla, fuentes(pg.f));
    } else {
      cuerpo = [h("section", { class: "est-etica" }, h("h2", { text: pg.etica.t }), pars(pg.etica.p), refs(pg.etica.r)),
        h("div", { class: "est-fal" }, pg.items.map((it, i) => h("article", { class: "est-falacia", id: "f" + (i + 1) },
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
    if (restaurando()) intentarRestaurar(); else alTope();
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
    const sec = (id, eyebrow, titulo, ...kids) => h("section", { class: "q-sec", id }, h("span", { class: "eyebrow", text: eyebrow }), h("h2", { class: "q-h2", text: titulo }), kids);
    const pars = (xs, cls) => xs.map((t) => h("p", { class: cls || "q-p" }, qTexto(t)));
    const ir = (id) => { const el = document.getElementById(id); if (el) el.scrollIntoView({ block: "start", behavior: quieto() ? "auto" : "smooth" }); };

    // 1. el problema: barras por libro
    const par = (a, b) => [a, b].sort().join("-");
    const CLS = { "LUK-MAT": "dt", "MAT-MRK": "mm", "LUK-MRK": "ml" };
    const barras = h("div", { class: "q-barras" }, ["MAT", "MRK", "LUK"].map((c) => {
      const k = QD.cuentas[c], os = ["MAT", "MRK", "LUK"].filter((x) => x !== c);
      const segs = [["ambos", "En los tres", "tr"]].concat(os.map((o) => [o, "Solo con " + Q_LIB[o] + (CLS[par(c, o)] === "dt" ? " (doble tradición)" : ""), CLS[par(c, o)]]), [["propio", c === "MRK" ? "Solo en Μᾶrκος" : "Propio (" + (c === "MAT" ? "M" : "L") + ")", "pr"]]);
      const pc = (n) => (100 * (n || 0) / k.total);
      return h("div", { class: "q-barra" },
        h("div", { class: "q-barra-cab" }, h("b", { text: Q_LIB[c] }), h("span", { text: k.total + " versos" })),
        h("div", { class: "q-pista", role: "img", "aria-label": Q_LIB[c] + ": " + segs.map(([kk, t]) => t + " " + Math.round(pc(k[kk])) + " %").join("; ") },
          segs.map(([kk, t, cl]) => h("span", { class: "q-tramo q-" + cl, style: "flex-basis:" + pc(k[kk]).toFixed(2) + "%", title: t + ": " + (k[kk] || 0) + " versos" }, pc(k[kk]) >= 9 ? h("i", { text: Math.round(pc(k[kk])) + " %" }) : null))),
        h("ul", { class: "q-barra-ley" }, segs.map(([kk, t, cl]) => h("li", {}, h("i", { class: "q-" + cl }), t + ": ", h("b", { text: String(k[kk] || 0) })))));
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

    // 3. el orden: Mattáy arriba, Lουκᾶς abajo; gris = lo que siguen de Μᾶrκος, oro = doble tradición
    const W = 1000, Y1 = 46, Y2 = 214, x = (f) => (24 + f * (W - 48)).toFixed(1);
    const ticks = (c, y, arriba) => QD.orden.caps[c].map(([n, f]) => '<line x1="' + x(f) + '" x2="' + x(f) + '" y1="' + (y - 6) + '" y2="' + (y + 6) + '" class="q-tk"/><text x="' + x(f) + '" y="' + (arriba ? y - 13 : y + 26) + '" class="q-tn">' + n + "</text>").join("");
    const mapaOrden = svg('<g class="q-ejes"><line x1="24" x2="' + (W - 24) + '" y1="' + Y1 + '" y2="' + Y1 + '"/><line x1="24" x2="' + (W - 24) + '" y1="' + Y2 + '" y2="' + Y2 + '"/>' + ticks("MAT", Y1, true) + ticks("LUK", Y2, false) + "</g>" +
      '<g class="q-mk">' + QD.orden.mk.map(([a, b]) => '<line x1="' + x(a) + '" y1="' + (Y1 + 7) + '" x2="' + x(b) + '" y2="' + (Y2 - 7) + '"/>').join("") + "</g>" +
      '<g class="q-qq">' + QD.orden.q.map(([a, b, id]) => '<line data-id="' + id + '" x1="' + x(a) + '" y1="' + (Y1 + 7) + '" x2="' + x(b) + '" y2="' + (Y2 - 7) + '"/>').join("") + "</g>", "0 0 " + W + " 250");
    mapaOrden.removeAttribute("aria-hidden"); mapaOrden.setAttribute("role", "img");
    mapaOrden.setAttribute("aria-label", "Mapa del orden: arriba los capítulos de Mattáy, abajo los de Lουκᾶς. Las líneas grises (pasajes que siguen a Μᾶrκος) casi no se cruzan; las doradas (doble tradición) se cruzan muchas veces.");
    const infoOrden = h("p", { class: "q-orden-info nota-ui", "aria-live": "polite", text: "Toca una línea dorada para ver ese pasaje en columnas." });
    mapaOrden.addEventListener("click", (e) => { const l = e.target.closest && e.target.closest("line[data-id]"); if (l) mostrarPer(+l.dataset.id, true); });
    mapaOrden.addEventListener("pointerover", (e) => { const l = e.target.closest && e.target.closest("line[data-id]"); if (!l) return; const p = QD.per.find((q) => q.id === +l.dataset.id); if (p) infoOrden.textContent = p.t + " · Mattáy " + p.mt.replace(/^MAT /, "") + " · Lουκᾶς " + p.lu.replace(/^LUK /, ""); });
    const verOrden = store.get("qVerOrden", "ambos");
    const cajaOrden = h("div", { class: "q-orden ver-" + verOrden }, h("div", { class: "q-orden-et", text: "Mattáy · capítulos" }), h("div", { class: "q-orden-mapa" }, mapaOrden), h("div", { class: "q-orden-et", text: "Lουκᾶς · capítulos" }));
    const segOrden = h("div", { class: "seg", role: "group", "aria-label": "Qué mostrar" }, [["ambos", "Todo"], ["mk", "Lo que sigue a Μᾶrκος"], ["q", "Doble tradición"]].map(([k, t]) =>
      h("button", { type: "button", "aria-pressed": String(verOrden === k), onclick: (e) => { store.set("qVerOrden", k); cajaOrden.className = "q-orden ver-" + k; for (const b of e.currentTarget.parentNode.children) b.setAttribute("aria-pressed", String(b === e.currentTarget)); } }, t)));

    // 4 y 5. argumentos
    const bloqueCorto = ({ r, B }) => h("div", { class: "q-corto" }, h("div", { class: "q-corto-r" }, qRefs(r)), B.map(([c, cap, v, ws, L]) => h("div", { class: "q-v" },
      h("p", { class: "q-g", lang: "grc" }, ws.map(([g, k, p], i) => [i ? " " : null, h("span", { "data-gk": g }, gk(g)), punt(p) || null])),
      bx && L ? h("p", { class: "q-bx" }, txtVerso(L)) : null)));
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
      const s = svg('<defs><marker id="q-punta" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="9" markerHeight="9" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="currentColor"/></marker></defs><g class="q-fl">' + hp.fl.map(flecha).join("") + "</g>" + Object.keys(NODO).filter((k) => usados.has(k)).map(nodo).join(""), "0 0 1000 310");
      s.removeAttribute("aria-hidden"); s.setAttribute("role", "img"); s.setAttribute("aria-label", hp.t + ": " + hp.fl.map(([a, b]) => Q_LIB[a] + " hacia " + Q_LIB[b]).join(", "));
      return s;
    };
    const cajaHip = h("div", { class: "q-hip-caja" });
    const pintarHip = (hp) => cajaHip.replaceChildren(h("div", { class: "q-hip-d" }, diag(hp)), h("div", { class: "q-hip-t" },
      h("h3", {}, hp.t, h("small", { text: hp.s })), h("p", { text: hp.d }), h("p", { class: "nota-ui", text: hp.quien }),
      h("dl", {}, h("dt", { text: "A su favor" }), h("dd", { text: hp.bien }), h("dt", { text: "Su dificultad" }), h("dd", { text: hp.mal }))));
    const segHip = h("div", { class: "q-chips", role: "group", "aria-label": "Hipótesis" }, X.hipotesis.map((hp, i) => h("button", { type: "button", class: "q-chip", "aria-pressed": String(i === 0), onclick: (e) => { for (const b of e.currentTarget.parentNode.children) b.setAttribute("aria-pressed", String(b === e.currentTarget)); pintarHip(hp); } }, hp.t)));
    pintarHip(X.hipotesis[0]);

    const indice = [["q-problema", "El problema"], ["q-sinopsis", "Sinopsis"], ["q-orden", "El orden"], ["q-favor", "A favor"], ["q-contra", "En contra"], ["q-hip", "Hipótesis"], ["q-cont", "Qué contendría"], ["q-hist", "Historia"]];
    vista().replaceChildren(h("div", { class: "in" }, h("section", { class: "panel q-pag" },
      barraVolver(),
      h("div", { class: "panel-cab" }, h("span", { class: "eyebrow", text: "Mattáy, Μᾶrκος y Lουκᾶς · el problema sinóptico" }), h("h1", { class: "texto", text: "La fuente Q" }),
        pars(X.lead, "q-lead"), h("p", { class: "q-aviso" }, X.aviso),
        h("nav", { class: "q-indice", "aria-label": "En esta página" }, indice.map(([id, t]) => h("button", { type: "button", class: "q-chip", onclick: () => ir(id) }, t)))),
      sec("q-problema", "1 · El problema", "Tres relatos que se conocen entre sí", pars(X.problema), h("ul", { class: "q-puntos" }, X.puntos.map((t) => h("li", {}, qTexto(t)))), barras,
        h("p", { class: "nota-ui", text: "Cálculo automático: un verso cuenta como paralelo cuando comparte con otro verso varias palabras griegas o frases breves; los versos sueltos dentro de un pasaje paralelo también cuentan. Es una aproximación." })),
      sec("q-sinopsis", "2 · La doble tradición", "Mattáy y Lουκᾶς, palabra por palabra", pars(X.sinopsis),
        h("div", { class: "q-sin-ctl" }, segOrd, h("span", { class: "nota-ui", text: X.ley_lit })),
        h("div", { class: "q-sin-zona" }, lista, visor), h("p", { class: "nota-ui q-nota-bx", text: X.nota_bx })),
      sec("q-orden", "3 · El orden", "Dónde coloca cada uno lo que comparten", pars(X.orden), h("div", { class: "q-orden-ctl" }, segOrden), cajaOrden, infoOrden),
      sec("q-favor", "4 · A favor de Q", "Por qué tantos especialistas la aceptan", tarjetas(X.favor, "favor")),
      sec("q-contra", "5 · En contra de Q", "Por qué otros prefieren prescindir de ella", tarjetas(X.contra, "contra")),
      sec("q-hip", "6 · Las hipótesis", "Cinco maneras de explicar los mismos datos", segHip, cajaHip),
      sec("q-cont", "7 · Qué contendría Q", "Una colección de dichos", pars(X.contenido), h("div", { class: "q-chips q-todos" }, QD.per.map((p) => h("button", { type: "button", class: "q-chip", onclick: () => mostrarPer(p.id, true) }, p.t)))),
      sec("q-hist", "8 · Historia", "Una pregunta de casi dos mil años", h("ol", { class: "q-hist" }, X.historia.map(([f, t, g]) => h("li", {}, h("span", { class: "q-hist-f", text: f }), h("div", {}, h("p", {}, t), g ? h("blockquote", { class: "q-cita", lang: "grc", text: g }) : null))))),
      h("section", { class: "q-sec q-cierre" }, h("h2", { class: "q-h2", text: "¿Y entonces?" }), pars(X.cierre)))));
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
    const tarjetas = h("div", { class: "niv-tarjetas" }, ["exacto", "casi", "revision", "borrador", "base"].map((k) => h("a", { class: "niv-t n-" + k + (nivel === k ? " sel" : ""), href: "#/niveles/" + k, "aria-current": nivel === k ? "true" : null },
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
    const pestañas = h("div", { class: "niv-libros" }, libros.map((b) => h("a", { href: "#/niveles/" + nivel + "/" + b.c, "aria-current": b.c === selLib ? "true" : null }, (b.t || b.n) + " · " + fmt(b.conteo[nivel]))));
    const lista = h("div", { class: "niv-lista" }, cargando());
    cuerpo.replaceChildren(pestañas, lista);
    try {
      const Lc = await lectura(selLib), b = libroDe(selLib);
      const out = [];
      for (const [cap, vs] of Object.entries(Lc.caps)) {
        const xs = vs.filter((x) => x.n === nivel);
        if (!xs.length) continue;
        out.push(h("h3", { class: "niv-cap" }, h("a", { href: "#/" + selLib + "/" + cap, text: nombreLibro(b) + " " + cap }), h("small", { text: xs.length + " de " + vs.length + " versos" })));
        out.push(h("div", { class: "lectura niv-vs" }, xs.map((x) => h("a", { class: "vl n-" + x.n, href: "#/" + selLib + "/" + cap + "/l/" + x.v }, h("span", { class: "vn", text: x.v }), h("span", { class: "vt" }, txtVerso(x))))));
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
        const b = L[k]; burbuja.replaceChildren(h("b", { text: b.t || b.n }), h("small", { text: b.n }));
        el.classList.toggle("abre", t > 5.6 && t < 99);
      };
    },
    orden(el) {
      const ords = [["crono", "Cronológico"], ["escritura", "Por escritura"], ["tradicional", "Tradicional"]].filter(([k]) => k === "tradicional" || (CRONO && CRONO.ordenes[k]));
      const chips = h("div", { class: "go-chips" }, ords.map(([, t]) => h("span", { text: t })));
      const lista = h("div", { class: "go-lista" });
      el.append(h("div", { class: "go" }, chips, lista));
      let ult = -1;
      return (t) => {
        const k = t >= 99 ? 0 : Math.floor(t / 2.8) % ords.length;
        if (k === ult) return; ult = k;
        [...chips.children].forEach((c, i) => c.classList.toggle("on", i === k));
        const o = ords[k][0], LO = o === "tradicional" ? D.libros : CRONO.ordenes[o].map(libroDe);
        lista.replaceChildren(...LO.slice(0, 4).map((b, i) => h("span", { style: "--i:" + i }, h("em", { text: String(i + 1).padStart(2, "0") }), h("b", {}, b.t || b.n, b.t ? h("i", { text: b.n }) : null), fechaEscrito(b) ? h("small", { text: "c. " + fechaEscrito(b).replace(/^c\. /, "") }) : null)));
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
    let vozNom = store.get("guiaVozN", "dora"); if (!VOCES_GUIA.some((v) => v[0] === vozNom)) vozNom = "dora";
    let finVoz = 0, durPaso = DUR_PASO, sonando = false, terminado = false;
    // AAC 256 kbps en MP4 donde el navegador lo reproduce; si no (p. ej., Chromium sin códecs propietarios), Opus en Ogg
    const extVoz = (() => { try { return audio.canPlayType('audio/mp4; codecs="mp4a.40.2"') ? "mp4" : "ogg"; } catch (e) { return "mp4"; } })();
    const urlVoz = (i) => BASES[baseOk] + "voz/" + vozNom + "/" + i + "." + extVoz + "?v=" + VERSIONES.voz;
    // marcas de tiempo de cada frase de la narración (para que la imagen cambie cuando la voz lo dice)
    let MARCAS = null;
    cargar("voz/marcas.json?v=" + VERSIONES.voz).then((m) => { MARCAS = m; }).catch(() => {});
    const marcasDe = (i) => (voz && MARCAS && MARCAS[vozNom] && MARCAS[vozNom][i]) || null;
    const hablar = () => {
      finVoz = 0; durPaso = DUR_PASO; sonando = false;
      try { audio.pause(); } catch (e) { /* nada */ }
      if (!voz) return;
      const paso = k;
      audio.onloadedmetadata = () => { if (paso === k && isFinite(audio.duration)) durPaso = Math.max(DUR_PASO * 0.6, audio.duration + 0.6); };
      audio.onplaying = () => { if (paso !== k) return; if (!sonando) { sonando = true; t0 = performance.now() - audio.currentTime * 1000; } };
      audio.onended = () => { if (paso === k) finVoz = performance.now(); };
      audio.onerror = () => { if (paso === k) { durPaso = DUR_PASO; finVoz = performance.now() + (DUR_PASO - 1.2) * 1000; } };
      audio.src = urlVoz(k);
      if (!pausa) { const pr = audio.play(); if (pr && pr.catch) pr.catch(() => { if (paso === k) finVoz = performance.now() + (DUR_PASO - 1.2) * 1000; }); }
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
      if (!modal.open) { cancelAnimationFrame(raf); audio.pause(); return; }
      if (!caja.isConnected) { if (!audio.paused) audio.pause(); t0 = ahora - transcurrido * 1000; return; } // otra vista encima (p. ej., las opciones): en pausa
      if (pausa) { t0 = ahora - transcurrido * 1000; if (finVoz) finVoz = ahora - Math.min(ahora - finVoz, 250); return; }
      const habla = voz && !audio.error;
      if (habla && audio.paused && !finVoz && audio.src) { const pr = audio.play(); if (pr && pr.catch) pr.catch(() => {}); }
      // con voz, la animación espera a que la voz empiece a sonar (como mucho 1,5 s)
      if (habla && !sonando && !finVoz && ahora - t0 < 1500) { t0 = ahora - transcurrido * 1000; return; }
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
    abrirModal(() => cajaModal(cabModal("Guía del lector", "Cómo usar el lector y analizador"), caja), () => { cancelAnimationFrame(raf); audio.pause(); audio.removeAttribute("src"); });
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
    if (!esc.libro || modal.open || !/^#\/[1-3A-Z]{3}\/\d+(\/a)?\/?$/.test(location.hash)) return null;
    const b = libroDe(esc.libro); if (!b) return null;
    const c = esc.cap + dir;
    if (c >= 1 && c <= b.caps.length) return rutaCap(b, c, esc.modo);
    const LO = librosEnOrden(), i = LO.indexOf(b), o = LO[i + dir];
    return o ? rutaCap(o, dir > 0 ? 1 : o.caps.length, esc.modo) : null;
  }
  document.addEventListener("touchstart", (e) => {
    if (e.touches.length === 2 && PELLIZCO) {
      gesto = null;
      clearTimeout(tInm); // la barra no cambia mientras dura el pellizco (la posición del texto depende de ella)
      const raiz = modal.open ? $(".m-cuerpo", modal) : $("#vista");
      if (!raiz) return;
      const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2, cy = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      const bajo = !modal.open && document.elementFromPoint(cx, cy);
      const vEl = bajo && bajo.closest && bajo.closest("#vista [id^='v']");
      const rv = vEl ? vEl.getBoundingClientRect() : null;
      pinza = { d0: distT(e.touches), cx, cy, paso: 0, raiz, v: vEl && /^v\d+$/.test(vEl.id) ? +vEl.id.slice(1) : null, frac: rv && rv.height ? (cy - rv.top) / rv.height : 0 };
      return;
    }
    if (e.touches.length !== 1 || pinza) { gesto = null; return; }
    if ((window.visualViewport && window.visualViewport.scale > 1.01) || evitaDeslizar(e.target)) { gesto = null; return; }
    gesto = { x: e.touches[0].clientX, y: e.touches[0].clientY, t: performance.now() };
  }, { passive: true });
  document.addEventListener("touchmove", (e) => {
    if (!pinza) return;
    if (e.touches.length !== 2) return;
    e.preventDefault();
    if (pinza.paso) return; // un gesto, un paso
    const r = distT(e.touches) / pinza.d0;
    if (r > 1.12 || r < 0.89) { pinza.paso = r > 1 ? 1 : -1; pasoPellizco(pinza, pinza.paso); }
  }, { passive: false });
  document.addEventListener("touchend", (e) => {
    if (pinza) {
      if (e.touches.length) return;
      pinza = null; RP.fin = performance.now();
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
    location.hash = destino;
    setTimeout(() => document.documentElement.removeAttribute("data-paso"), 700);
  }, { passive: true });
  document.addEventListener("touchcancel", () => { gesto = null; pinza = null; }, { passive: true });
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
  function sello(x, y, txt, tope) {
    const el = h("div", { class: "sello-tam" + (tope ? " tope" : ""), "aria-hidden": "true", text: txt });
    el.style.left = Math.round(x) + "px"; el.style.top = Math.round(y) + "px";
    document.body.append(el);
    setTimeout(() => el.remove(), 900);
  }

  // ------------------------------------------------------------------ BiEx como aplicación: instalar y leer sin conexión
  // La copia sin conexión la guarda el trabajador de servicio (sw.js) del sitio donde se abre el lector como página propia.
  // Dentro del sitio oficial (marco) no se instala: se ofrece abrir BiEx como aplicación en su dirección propia.
  const APP_URL = "https://headless-acyvpvsbblb-bibliaexacta-140c.wix-site-host.com/";
  const PWA = { prompt: null, reg: null, instalada: false };
  const puedeSW = () => !EMBED && "serviceWorker" in navigator && window.isSecureContext && !!document.querySelector('link[rel="manifest"]');
  const enApp = () => (window.matchMedia && (matchMedia("(display-mode: standalone)").matches || matchMedia("(display-mode: window-controls-overlay)").matches)) || navigator.standalone === true;
  window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); PWA.prompt = e; document.documentElement.classList.add("app-instalable"); });
  window.addEventListener("appinstalled", () => { PWA.prompt = null; PWA.instalada = true; document.documentElement.classList.remove("app-instalable"); avisar("BiEx quedó instalada"); });
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
  function vistaApp() {
    document.title = "Instalar y leer sin conexión · BiEx";
    navActual("");
    const estado = h("div", { class: "app-estado" });
    const barra = h("div", { class: "app-barra", role: "progressbar", "aria-valuemin": "0", "aria-valuemax": "100", "aria-valuenow": "0" }, h("i"));
    const txt = h("p", { class: "app-tx", role: "status" });
    let fijo = false; // un mensaje final (listo, borrado, error) no lo pisa el recuento
    const pintarAvance = (hecho, total) => { const p = total ? Math.min(100, (100 * hecho) / total) : 0; barra.firstChild.style.width = p.toFixed(1) + "%"; barra.setAttribute("aria-valuenow", String(Math.round(p))); if (!fijo) txt.textContent = mb(hecho) + " de " + mb(total) + " · " + Math.round(p) + " %"; };
    const tarjeta = (ico, t, d, ...hijos) => h("section", { class: "app-card" }, h("div", { class: "app-ico" }, svg(ico)), h("div", { class: "app-cuerpo" }, h("h2", { text: t }), h("p", { text: d }), ...hijos));
    const ios = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    let instalar;
    if (EMBED || !puedeSW()) {
      instalar = tarjeta(ICO.externo, "Abrir BiEx como aplicación", "Para instalar BiEx con su propio ícono y guardar todo su contenido en tu dispositivo, ábrelo en su dirección de aplicación. Allí verás el botón «Instalar» (o, en iPhone y iPad, Compartir › «Agregar a inicio»).",
        h("a", { class: "btn oro", href: APP_URL, target: "_blank", rel: "noopener" }, svg(ICO.externo), h("span", { text: "Abrir BiEx como aplicación" })));
    } else if (enApp() || PWA.instalada) {
      instalar = tarjeta(ICO.marca, "BiEx ya está instalada", "La estás usando como aplicación, con su propio ícono.");
    } else {
      const btn = h("button", { class: "btn oro", type: "button", disabled: !PWA.prompt, onclick: async () => { if (!PWA.prompt) return; PWA.prompt.prompt(); try { await PWA.prompt.userChoice; } catch (e) { /* ignorar */ } PWA.prompt = null; btn.disabled = true; } }, svg(ICO.descargar), h("span", { text: "Instalar BiEx" }));
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
    vista().replaceChildren(h("div", { class: "in" }, h("section", { class: "panel app-pag" },
      barraVolver(),
      h("div", { class: "panel-cab" }, h("span", { class: "eyebrow", text: "BiEx en tu dispositivo" }), h("h1", { class: "texto", text: "Instalar y leer sin conexión" }),
        h("p", { class: "q-lead", text: "Biblia Exacta ©™ puede quedar instalada como aplicación y guardar todo su contenido para leer, analizar y buscar aunque no haya internet." })),
      instalar, sinConexion,
      h("p", { class: "nota-ui", text: "La copia se guarda en este navegador. Ninguna página puede obligar al navegador a conservarla para siempre: si se borran los datos del sitio, o el dispositivo se queda sin espacio y no hay permiso persistente, habría que descargarla otra vez." }))));
    if (sinConexion) pintarEstado();
    alTope();
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
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible" && Date.now() - (store.get("revisionCopia", 0) || 0) >= 3600e3) actualizarCopia(); });
  window.addEventListener("online", () => { if (!store.get("revisionCopia", 0)) setTimeout(actualizarCopia, 3000); });
  // Aviso discreto: hay una versión publicada más reciente que la que está abierta
  function avisoVersion() {
    if ($(".aviso-version")) return;
    const el = h("div", { class: "aviso-version", role: "status" },
      h("span", { text: "Hay una versión nueva" }),
      h("button", { type: "button", class: "av-si", text: "Actualizar", onclick: () => location.reload() }),
      h("button", { type: "button", class: "av-no", "aria-label": "Ahora no", title: "Ahora no", onclick: () => { el.classList.remove("si"); setTimeout(() => el.remove(), 300); } }, svg(ICO.cerrar)));
    document.body.append(el);
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add("si")));
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
    const aro = svg('<circle cx="20" cy="20" r="17.5" class="sr-fondo"/><circle cx="20" cy="20" r="17.5" class="sr-av" transform="rotate(-90 20 20)"/>', "0 0 40 40");
    aro.classList.add("sr-aro");
    const btn = (cls, et, ico, f, extra) => h("button", { type: "button", class: "sr-btn " + cls, "aria-label": et, title: et, onclick: () => { ir(f); mostrar(); } }, extra || null, svg(ico));
    const caja = h("div", { class: "saltos-rap", role: "group", "aria-label": "Ir rápido por la página" },
      btn("sr-ini", "Ir al inicio de la página", ICO.subir, 0), btn("sr-med", "Ir a la mitad de la página", ICO.centro, 0.5, aro), btn("sr-fin", "Ir al final de la página", ICO.bajar, 1));
    document.body.append(caja);
    const av = aro.querySelector(".sr-av"), CIR = 2 * Math.PI * 17.5;
    av.setAttribute("stroke-dasharray", "0 " + CIR.toFixed(1));
    let reloj = 0, pendiente = false;
    const largo = () => document.documentElement.scrollHeight > window.innerHeight * 2.6;
    function mostrar() {
      if (!largo() || modal.open) { caja.classList.remove("vis"); return; }
      caja.classList.add("vis");
      clearTimeout(reloj);
      reloj = setTimeout(() => { if (!caja.matches(":hover") && !caja.contains(document.activeElement)) caja.classList.remove("vis"); }, 2600);
    }
    function medir() {
      pendiente = false;
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight), p = Math.min(1, Math.max(0, window.scrollY / max));
      av.setAttribute("stroke-dasharray", (CIR * p).toFixed(1) + " " + CIR.toFixed(1));
      caja.classList.toggle("en-ini", p < 0.02); caja.classList.toggle("en-fin", p > 0.98);
    }
    // el aro de avance se actualiza cuando el desplazamiento se detiene: cambiarlo en cada cuadro obligaba a repintar toda la
    // página mientras se desplazaba (medido con la traza: ~150 repintados del documento en 2 s; ahora, ninguno)
    let tMed = 0;
    window.addEventListener("scroll", () => { clearTimeout(tMed); tMed = setTimeout(medir, 180); mostrar(); }, { passive: true });
    window.addEventListener("hashchange", () => { caja.classList.remove("vis"); });
    caja.addEventListener("mouseleave", mostrar);
    caja.addEventListener("focusout", mostrar);
  })();

  // ------------------------------------------------------------------ lectura inmersiva
  // En teléfonos, el primer toque pide pantalla completa (dentro del sitio oficial se lo pide a la página que lo aloja);
  // los navegadores solo lo permiten tras un gesto, y en iPhone no existe para páginas. Si la persona sale, no se insiste.
  // Además, al leer hacia abajo la barra superior se retira y vuelve con cualquier movimiento hacia arriba o del puntero.
  const TACTIL = window.matchMedia && matchMedia("(pointer: coarse)").matches;
  let pidioPantalla = (() => { try { return sessionStorage.getItem("biex:pc") === "1"; } catch (e) { return false; } })();
  function pedirPantalla() {
    if (pidioPantalla || !TACTIL) return;
    pidioPantalla = true; try { sessionStorage.setItem("biex:pc", "1"); } catch (e) { /* ignorar */ }
    if (EMBED) { alPadre({ biex: "pantalla" }); return; }
    const el = document.documentElement;
    try { if (document.fullscreenEnabled && !document.fullscreenElement && el.requestFullscreen) el.requestFullscreen({ navigationUI: "hide" }).catch(() => {}); } catch (e) { /* sin pantalla completa */ }
  }
  document.addEventListener("touchend", pedirPantalla, { passive: true });
  let yInm = window.scrollY, tInm = 0, tDesp = 0;
  window.addEventListener("scroll", () => {
    const r = document.documentElement;
    if (!tDesp) r.classList.add("desplazando"); else clearTimeout(tDesp);
    tDesp = setTimeout(() => { tDesp = 0; r.classList.remove("desplazando"); }, 220);
  }, { passive: true });
  const inmersivo = (si) => { if (si) { medirBarraHoja(); marcarPegada(); } document.documentElement.classList.toggle("inmersivo", !!si); };
  // ¿la barra del capítulo está pegada arriba? (el centinela, justo antes de ella, ya pasó por debajo de su tope)
  function marcarPegada() {
    const bh = $(".barra-hoja"), c = $(".bh-centinela"); if (!bh || !c) return;
    const peg = c.getBoundingClientRect().top <= (parseFloat(getComputedStyle(bh).top) || 0) + 0.5;
    if (peg !== bh.classList.contains("bh-pegada")) bh.classList.toggle("bh-pegada", peg);
  }
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
    marcarPegada();
    // los saltos del propio lector (restaurar una posición, abrir un verso) no cuentan como lectura
    if (RP.objetivo != null || modal.open || performance.now() - (RP.fin || 0) < 900) { clearTimeout(tInm); return; }
    if (y < 160 || menuAbierto) { clearTimeout(tInm); inmersivo(false); return; }
    if (dy < -4) { clearTimeout(tInm); inmersivo(false); }
    else if (dy > 4 && !document.documentElement.classList.contains("inmersivo")) { clearTimeout(tInm); tInm = setTimeout(() => { if (window.scrollY > 160 && !menuAbierto) inmersivo(true); }, 900); }
  }, { passive: true });
  window.addEventListener("mousemove", (e) => { if (e.clientY < 110) { clearTimeout(tInm); inmersivo(false); } }, { passive: true });
  document.addEventListener("focusin", (e) => { if (e.target.closest && e.target.closest(".barra")) inmersivo(false); });

  // Adelante: como el botón del navegador (que no existe en la app instalada), vuelve exactamente a donde se estaba; la
  // posición la restaura la memoria de lectura. Aparece solo cuando hay un paso adelante, es decir, después de volver atrás.
  function botonAdelante() {
    const nav = window.navigation && "canGoForward" in window.navigation ? window.navigation : null;
    let P = { k: [], i: -1 };
    try { P = JSON.parse(sessionStorage.getItem("biex:pila") || "null") || P; } catch (e) { /* sin almacenamiento */ }
    const clave = () => { const st = history.state || {}; return st.bx ? st.bx + "|" + (st.vid || "") : null; };
    const guardar = () => { try { sessionStorage.setItem("biex:pila", JSON.stringify(P)); } catch (e) { /* ignorar */ } };
    const btn = h("button", { class: "adelante", type: "button", "aria-label": "Adelante: volver a donde estabas", title: "Adelante", onclick: () => { btn.classList.remove("vis"); history.forward(); } },
      h("span", { text: "Adelante" }), svg(ICO.der));
    document.body.append(btn);
    const puede = () => (nav ? nav.canGoForward : P.i >= 0 && P.i < P.k.length - 1);
    const pintar = () => btn.classList.toggle("vis", !!puede());
    pasoAdelante = (nuevo) => {
      const k = clave(); if (!k) return;
      const j = P.k.lastIndexOf(k);
      if (!nuevo && j >= 0) P.i = j;
      else if (j < 0 || j !== P.i) { P.k = P.k.slice(0, P.i + 1); P.k.push(k); if (P.k.length > 300) P.k = P.k.slice(-300); P.i = P.k.length - 1; }
      guardar(); requestAnimationFrame(pintar);
    };
    window.addEventListener("popstate", () => { const k = clave(); if (k) { const j = P.k.lastIndexOf(k); if (j >= 0) { P.i = j; guardar(); } } requestAnimationFrame(pintar); });
    if (nav) nav.addEventListener("currententrychange", () => requestAnimationFrame(pintar));
    pintar();
  }
  // ------------------------------------------------------------------ planes de lectura
  // Sobre el orden cronológico de BiEx (los relatos por su primer acontecimiento, luego Prάc̅ṣεις y las cartas por su fecha de
  // escritura, Ḥăzṓn Hiṯgallū́ṯ al final): el reparto por días equilibra el número de versos. El avance queda en el dispositivo
  // (biex:planes) y la siguiente lectura aparece en la portada y al terminar su último capítulo.
  const NO_CARTAS = ["MAT", "MRK", "LUK", "JHN", "ACT", "REV"];
  const PLANES = [
    { id: "crono-90", t: "La Nueva Voluntad en orden cronológico", dias: 90, ord: "crono", d: () => "Toda la Nueva Voluntad en 90 días, en el orden en que sucedieron los hechos y se escribieron las cartas." },
    { id: "anual", t: "Un año con la Nueva Voluntad", dias: 260, ord: "crono", d: () => "Un capítulo por lectura: los 260 capítulos en orden cronológico, cinco por semana durante un año." },
    { id: "relatos-40", t: "Los relatos de la vida de YēshŪ́ʿa", dias: 40, ord: "crono", sel: ["LUK", "MAT", "MRK", "JHN"], d: () => ["LUK", "MAT", "MRK", "JHN"].map((c) => nombreLibro(libroDe(c))).join(", ").replace(/, ([^,]*)$/, " y $1") + ", en 40 días, según el primer acontecimiento que narra cada uno." },
    { id: "cartas-60", t: "Las cartas en el orden en que se escribieron", dias: 60, ord: "escritura", cartas: true, d: () => "Las cartas en 60 días, cada una en su momento: de la más temprana a la última, antes del año 70." },
    { id: "nv-30", t: "La Nueva Voluntad en 30 días", dias: 30, ord: "crono", d: () => "Una lectura intensa, de unos nueve capítulos por día, en orden cronológico." },
  ];
  const planDe = (id) => PLANES.find((x) => x.id === id) || null;
  const estPlanes = () => { const e = store.get("planes", null); return e && typeof e === "object" ? Object.assign({ act: null, hechos: {}, ini: {} }, e) : { act: null, hechos: {}, ini: {} }; };
  const guardarPlanes = (e) => store.set("planes", e);
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
    if (si && !e.act) e.act = pl.id;
    guardarPlanes(e);
  }
  function anilloPlan(p) {
    const C = 2 * Math.PI * 17;
    return h("span", { class: "pl-anillo", "aria-hidden": "true" }, svg('<circle cx="20" cy="20" r="17" fill="none" stroke="currentColor" stroke-opacity=".2" stroke-width="3"/><circle cx="20" cy="20" r="17" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-dasharray="' + (C * p).toFixed(1) + " " + C.toFixed(1) + '" transform="rotate(-90 20 20)"/>', "0 0 40 40"), h("b", { text: Math.round(p * 100) + "%" }));
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
    vista().replaceChildren(h("div", { class: "in" }, h("section", { class: "panel planes" },
      h("div", { class: "panel-cab" }, h("span", { class: "eyebrow", text: "Leer con constancia" }), h("h1", { class: "texto", text: "Planes de lectura" }),
        h("p", { class: "est-sub", text: "Elige un plan y marca cada lectura. Tu avance queda guardado en este dispositivo; la siguiente lectura aparece en la portada." })),
      h("div", { class: "pl-lista" }, PLANES.map(tarjeta)))));
    saltarA(0);
  }
  function vistaPlan(pl) {
    document.title = pl.t + " · Planes de lectura · BiEx";
    const pintar = () => {
      const e = estPlanes(), dias = diasPlan(pl), hs = new Set(e.hechos[pl.id] || []), i = sigDia(pl, e), act = e.act === pl.id;
      const lista = h("ol", { class: "pl-dias" }, dias.map((dia, k) => h("li", { class: hs.has(k) ? "hecho" : k === i ? "sig" : "" },
        h("button", { type: "button", class: "pl-marca", "aria-pressed": String(hs.has(k)), "aria-label": "Día " + (k + 1) + (hs.has(k) ? ": leído. Desmarcar" : ": marcar como leído"), onclick: () => { marcarDia(pl, k, !hs.has(k)); pintar(); } }, svg('<path d="M6 12.5l4 4 8-9" ' + L1 + '/>')),
        h("span", { class: "pl-n", text: "Día " + (k + 1) }),
        h("a", { href: "#/" + dia[0].b.c + "/" + dia[0].c, text: etDia(dia) }))));
      const sig = i >= 0 ? h("div", { class: "pl-sig" }, h("span", { class: "eyebrow", text: "Siguiente lectura · Día " + (i + 1) }), h("b", { text: etDia(dias[i]) }),
        h("div", { class: "pl-acc" }, h("a", { class: "btn oro chico", href: "#/" + dias[i][0].b.c + "/" + dias[i][0].c }, svg(ICO.libro), h("span", { text: "Leer" })),
          h("button", { class: "btn chico", type: "button", onclick: () => { marcarDia(pl, i, true); pintar(); } }, svg('<path d="M6 12.5l4 4 8-9" ' + L1 + '/>'), h("span", { text: "Marcar como leído" }))))
        : h("div", { class: "pl-sig" }, h("b", { text: "Plan terminado. ¡Bien hecho!" }));
      vista().replaceChildren(h("div", { class: "in" }, h("section", { class: "panel planes" },
        h("div", { class: "panel-cab" }, h("a", { class: "eyebrow", href: "#/planes", text: "‹ Planes de lectura" }), h("h1", { class: "texto", text: pl.t }), h("p", { class: "est-sub", text: pl.d() }),
          h("div", { class: "pl-cab" }, anilloPlan(hs.size / dias.length), h("span", { text: hs.size + " de " + dias.length + " lecturas" }),
            act ? h("span", { class: "chip activo", text: "Plan activo" }) : h("button", { class: "btn chico", type: "button", onclick: () => { const e2 = estPlanes(); e2.act = pl.id; guardarPlanes(e2); pintar(); } }, "Seguir este plan"),
            hs.size ? h("button", { class: "btn chico", type: "button", onclick: (ev) => { const bt = ev.currentTarget; if (!bt.dataset.seguro) { bt.dataset.seguro = "1"; bt.textContent = "Tocar otra vez para borrar las marcas"; setTimeout(() => { if (bt.isConnected) { delete bt.dataset.seguro; bt.textContent = "Reiniciar"; } }, 4000); return; } const e2 = estPlanes(); e2.hechos[pl.id] = []; guardarPlanes(e2); pintar(); } }, "Reiniciar") : null)),
        sig, lista)));
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
  async function mdEntregar(nombre, texto) {
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
      const pre = usaP ? (x.p ? "**§** " : "") : (x.q ? "**§** " : "");
      let lin = pre + '<sup style="color:' + MDC.vn + '">' + x.v + "</sup> " + mdDeNodo(txtVerso(x)).trim();
      if (gr && gr.get(x.v)) lin += '<br><span style="color:' + MDC.gr + '" lang="grc">' + mdTexto(gr.get(x.v)) + "</span>";
      o.push(lin + " ^v" + x.v + "\n");
    });
    o.push("---\n*" + mdLinea("Exportado de BiEx – Biblia Exacta ©™ el " + new Date().toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric" })) + ".*\n");
    return { nombre: nom + " " + cap + " · BiEx", texto: o.join("\n") };
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
    o.push("---\n*" + mdLinea("Estudios BiEx – Biblia Exacta ©™ · exportado el " + new Date().toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric" })) + ".*\n");
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
      try { const Lc = await lectura(x.c); const L = (Lc.caps[x.cap] || []).find((y) => y.v === x.v); if (L) tx = mdDeNodo(txtVerso(L)).trim(); } catch (e) { /* sin texto */ }
      const tema = x.col ? MK.nombre(x.col) : "";
      o.push("> [!quote] [" + mdLinea(refCorta(b, x.cap, x.v)) + "](" + mdEnlace("#/" + x.c + "/" + x.cap + "/l/" + x.v) + ")" + (tema ? " · " + mdLinea(tema) : "") + "\n> " + tx + (x.nota ? "\n>\n> **Nota:** " + mdLinea(x.nota) : "") + "\n");
    }
    return { nombre: "Mis marcadores · BiEx", texto: o.join("\n") };
  }
  // Ventana de exportación (Herramientas, opciones del capítulo, estudios y marcadores)
  function abrirExportar(sel) {
    const ult = store.get("ultimo", null), cap = esc.libro && esc.cap ? [esc.libro, esc.cap] : ult && ult.c && libroDe(ult.c) ? [ult.c, ult.cap || 1] : null;
    const conGr = h("input", { type: "checkbox", id: "md-gr" });
    const fila = (t, p, hacer) => h("div", { class: "md-fila" }, h("div", {}, h("b", { text: t }), p ? h("p", { text: p }) : null),
      h("div", { class: "md-acc" },
        h("button", { class: "btn chico oro", type: "button", onclick: async (e) => { const bt = e.currentTarget; bt.disabled = true; try { const r = await hacer(); await mdEntregar(r.nombre, r.texto); } catch (er) { avisar("No se pudo preparar la nota"); } bt.disabled = false; } }, svg(ICO.descargar), h("span", { text: "Descargar .md" })),
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
      h("p", { class: "nota-ui", text: "Cada nota lleva sus propiedades, encabezados, avisos plegables y los colores de BiEx. Guárdala en tu bóveda de Obsidian (o pégala en una nota nueva)." }), filas)));
  }
  // ------------------------------------------------------------------ letras meteoro
  // Letras hebreas y griegas que cruzan la pantalla como meteoritos, en direcciones distintas, por delante de los contenedores
  // y por detrás del texto (capa fija -1; los contenedores llevan su fondo en la -2 y las luces, en la -3).
  // Movimiento: recta con aceleración constante en su dirección (p = p0 + v₀·t + ½·a·t², como una curva de tiempo
  // cubic-bezier exacta), giro constante de la letra (θ = θ0 + ω·t) y una estela que apunta hacia atrás. Todo es vectorial
  // (texto y degradados CSS) y lo anima el compositor (Web Animations, solo transform y opacidad): nítido a cualquier
  // densidad y sin trabajo del hilo principal mientras se desplaza la página. Se apaga con «Sin animaciones» o
  // prefers-reduced-motion; no lanza con la pestaña oculta ni con una ventana abierta.
  function meteoros(capa) {
    if (!capa || !capa.animate) return null;
    const GR = ["Α", "Β", "Γ", "Δ", "Θ", "Λ", "Ξ", "Σ", "Φ", "Ψ", "Ω", "λ", "φ", "ψ", "ω", "ξ", "ζ"], HE = ["א", "ב", "ג", "ד", "ה", "ו", "י", "ל", "מ", "ר", "ש", "ת"];
    const reducido = window.matchMedia ? matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
    let t = 0;
    const quieto = () => ap.mov === "no" || reducido.matches;
    function lanzar() {
      const W = window.innerWidth, A = window.innerHeight, mov = W < 700;
      if (capa.childElementCount >= (mov ? 2 : 3)) return;
      const he = Math.random() < 0.45, L = he ? HE : GR, s = (mov ? 25 : 30) + Math.random() * (mov ? 13 : 20);
      const ang = Math.random() * Math.PI * 2, dx = Math.cos(ang), dy = Math.sin(ang);
      const v0 = (mov ? 170 : 240) + Math.random() * 150, a = v0 * 0.16;
      // entra por fuera de la pantalla, del lado opuesto a su dirección, con un corrimiento lateral al azar, y sale por el otro
      const R = Math.hypot(W, A) / 2 + 90, lat = (Math.random() - 0.5) * Math.min(W, A) * 0.95;
      const x0 = W / 2 - dx * R - dy * lat, y0 = A / 2 - dy * R + dx * lat, D = 2 * R + 380;
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
      el.animate([{ opacity: 0 }, { opacity: 1, offset: 0.14 }, { opacity: 1 }], { duration: ms, fill: "both" });
      letra.animate([{ transform: "rotate(" + th.toFixed(1) + "deg)" }, { transform: "rotate(" + (th + w * T).toFixed(1) + "deg)" }], { duration: ms, fill: "both" });
      viaje.onfinish = viaje.oncancel = () => el.remove();
    }
    function programar(primero) {
      clearTimeout(t);
      const W = window.innerWidth;
      t = setTimeout(() => {
        if (!quieto() && !document.hidden && !modal.open && !document.documentElement.classList.contains("desplazando")) lanzar();
        programar(false);
      }, primero ? 1400 + Math.random() * 1600 : (W < 700 ? 4200 : 3300) * (0.55 + Math.random() * 0.9));
    }
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
  function enrutar() {
    if (!D) return;
    M.alCerrar = null;
    if (modal.open && !(performance.now() - (M.reabierta || -1e9) < 600)) { guardarScrollM(); M.porRuta = true; cerrarModal(); }
    mostrarRuta();
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
  function mostrarRuta(hh) {
    const partes = decodificar((hh || location.hash).replace(/^#\/?/, "")).slice(0, 400).split("/").filter((x) => x !== "");
    const ruta = "#/" + partes.join("/");
    if (partes[0] === "buscar" && partes.length > 1) return sobrePagina(() => abrirBusqueda(partes.slice(1).join("/")));
    if (partes[0] === "guia") return sobrePagina(() => abrirGuia(+partes[1] || 0));
    rutaVista = ruta;
    if (volverBusqueda && ruta.split("/").slice(0, 3).join("/") !== volverBusqueda.ruta.split("/").slice(0, 3).join("/")) volverBusqueda = null;
    if (!partes.length) { esc.libro = null; return portada(false); }
    if (partes[0] === "libros") { esc.libro = null; return portada(true); }
    if (partes[0] === "lema" || /^lema\?/.test(partes[0])) { esc.libro = null; return partes[1] != null && partes[0] === "lema" ? vistaLema(+partes[1]) : vistaConcordancia(); }
    if (partes[0] === "buscar") { esc.libro = null; return vistaBuscar(""); }
    if (partes[0] === "cronologia") { esc.libro = null; return vistaCronologia(partes[1] || ""); }
    if (partes[0] === "fuente-q") { esc.libro = null; return vistaFuenteQ(partes[1] || ""); }
    if (partes[0] === "datos" || partes[0] === "fechas" || partes[0] === "falacias") { esc.libro = null; return vistaEstudio(partes[0]); }
    if (partes[0] === "marcadores") { esc.libro = null; return vistaMarcadores(); }
    if (partes[0] === "planes") { esc.libro = null; return vistaPlanes(partes[1] || ""); }
    if (partes[0] === "app") { esc.libro = null; return vistaApp(); }
    if (partes[0] === "niveles") { esc.libro = null; return vistaNiveles(partes[1] || "", partes[2] || ""); }
    const c = partes[0].toUpperCase();
    const cap = +partes[1] || 1;
    if (partes[2] === "o" && !prefs.lorg) { prefs.lorg = true; guardarPrefs(); } // «#/LIB/cap/o»: abre la lectura organizada
    const modo = partes[2] === "a" ? "a" : "l";
    const v = partes[3] != null ? +partes[3] : null;
    const i = partes[4] == null ? null : partes[4] === "m" ? "m" : +partes[4];
    return vistaLibro(c, cap, modo, v, i);
  }
  marco();
  vista().replaceChildren(cargando("Abriendo el códice…"));
  alPadre({ biex: "listo" });
  Promise.all([cargar("datos/avance.json"), cargar("datos/destacados.json").catch(() => []), cargar("datos/cronologia.json").catch(() => null)]).then(([d, dest, cr]) => {
    D = d; DEST = Array.isArray(dest) ? dest : [];
    CRONO = cr && cr.ordenes && cr.libros ? cr : null;
    const act = $("#actualizado");
    if (act) act.textContent = " · Actualizado el " + new Date(D.generado).toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric" }) + ".";
    botonAdelante();
    window.addEventListener("hashchange", () => { pasosApp++; prepararPos(); enrutar(); });
    prepararPos();
    enrutar();
    setTimeout(actualizarCopia, 8000);
    setTimeout(() => { MET = meteoros($(".meteoros")); window.__biexMet = MET; }, 1500); // __biexMet: para las pruebas
  }).catch((er) => { console.error(er); vista().replaceChildren(fallo("No se pudo cargar el avance.")); });
})();
