/* BiEx · Lector y Analizador de la Nueva Voluntad. Sin dependencias. */
(function () {
  "use strict";
  const BASE = window.BIEX_BASE || "";
  // Fuentes de los datos en orden de preferencia (si la primera falla se usa la siguiente)
  const BASES = Array.isArray(window.BIEX_BASES) && window.BIEX_BASES.length ? window.BIEX_BASES : [BASE];
  // Dentro del sitio oficial: el lector se abre en un marco a pantalla completa (srcdoc o ?incrustado=1)
  const POR_URL = /[?&]incrustado=1/.test(location.search);
  const EMBED = !!window.BIEX_EMBED || POR_URL;
  const alPadre = (msg) => { if (!EMBED) return; try { window.parent.postMessage(msg, "*"); } catch (e) { /* ignorar */ } };
  if (EMBED) {
    window.addEventListener("error", (e) => alPadre({ biex: "error", m: String(e.message || "error") + " " + (e.filename || "") + ":" + (e.lineno || "") }));
    window.addEventListener("message", (e) => { if (e.source === window.parent && e.data && e.data.biex === "ir" && typeof e.data.hash === "string") location.hash = e.data.hash; });
  }
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  const h = (tag, attrs, ...kids) => {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k === "class") el.className = v;
      else if (k === "text") el.textContent = v;
      else if (k === "style") el.setAttribute("style", v);
      else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? "" : v);
    }
    for (const x of kids.flat(Infinity)) if (x != null && x !== false) el.append(x.nodeType ? x : document.createTextNode(String(x)));
    return el;
  };
  const svg = (inner, vb) => { const s = document.createElementNS("http://www.w3.org/2000/svg", "svg"); s.setAttribute("viewBox", vb || "0 0 24 24"); s.setAttribute("aria-hidden", "true"); s.innerHTML = inner; return s; };
  const L1 = 'fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"';
  const ICO = {
    buscar: '<circle cx="11" cy="11" r="6.5" ' + L1 + '/><path d="M20 20l-4.2-4.2" ' + L1 + '/>',
    tema: '<circle cx="12" cy="12" r="8.2" ' + L1 + '/><path d="M12 3.8a8.2 8.2 0 0 1 0 16.4z" fill="currentColor"/>',
    izq: '<path d="M14.5 5.5L8 12l6.5 6.5" ' + L1 + '/>',
    der: '<path d="M9.5 5.5L16 12l-6.5 6.5" ' + L1 + '/>',
    cerrar: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11" ' + L1 + '/>',
    atras: '<path d="M10 6l-6 6 6 6M4.5 12H20" ' + L1 + '/>',
    externo: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" ' + L1 + '/>',
    rejilla: '<rect x="4" y="4" width="6.5" height="6.5" rx="1.2" ' + L1 + '/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.2" ' + L1 + '/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.2" ' + L1 + '/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.2" ' + L1 + '/>',
    libro: '<path d="M4 5.5C6.5 4.2 9.5 4.2 12 6c2.5-1.8 5.5-1.8 8-.5V19c-2.5-1.3-5.5-1.3-8 .5-2.5-1.8-5.5-1.8-8-.5z M12 6v13.5" ' + L1 + '/>',
    lupa: '<circle cx="10" cy="10" r="5.5" ' + L1 + '/><path d="M14 14l5.5 5.5M7.5 10h5M10 7.5v5" ' + L1 + '/>',
    lista: '<path d="M8 6.5h12M8 12h12M8 17.5h12" ' + L1 + '/><circle cx="4.5" cy="6.5" r="1" fill="currentColor"/><circle cx="4.5" cy="12" r="1" fill="currentColor"/><circle cx="4.5" cy="17.5" r="1" fill="currentColor"/>',
    filtros: '<path d="M4 7h9M17 7h3M4 17h3M11 17h9" ' + L1 + '/><circle cx="15" cy="7" r="2" ' + L1 + '/><circle cx="9" cy="17" r="2" ' + L1 + '/>',
    parrafo: '<path d="M4 6h16M4 10.5h16M4 15h16M4 19.5h10" ' + L1 + '/>',
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
  const ponerHash = (hh) => { try { history.replaceState(null, "", urlHash(hh)); } catch (e) { /* ignorar */ } };

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
  const lectura = (c) => cargar("datos/libros/" + c + ".json");
  const analisis = (c) => cargar("datos/analisis/" + c + ".json");
  function tablas() {
    if (T) return Promise.resolve(T);
    return cargar("datos/tablas.json").then((t) => {
      if (T) return T;
      t.P = t.M.map(parseM);
      t.Lk = t.L.map(claveGr);
      t.Fk = t.F.map(claveGr);
      t.TRk = t.TR.map(claveEs);
      t.formaLema = new Map();
      t.LP.forEach((rows, li) => rows.forEach((r) => { if (!t.formaLema.has(r[0])) t.formaLema.set(r[0], li); }));
      T = t;
      return T;
    });
  }
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
  const AP0 = { tam: 2, letra: "clasica", inter: "normal", mov: "si" };
  let ap = Object.assign({}, AP0, store.get("ap", {}));
  function aplicarAp() {
    const r = document.documentElement;
    r.setAttribute("data-tam", String(ap.tam));
    r.setAttribute("data-letra", ap.letra);
    r.setAttribute("data-inter", ap.inter);
    r.setAttribute("data-mov", ap.mov);
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
  const F = { M: 1, C: 2, IT: 4, NG: 8, COR: 16, ALT: 32, PAR: 64, ANG: 128, SUP: 256, OCU: 512, HE: 1024 };
  const VOLADA = /[ʰ-˿ᴬ-ᶿ⁰-₟]/;
  function rasgos(t, esBase, x) {
    const n = t.length, f = new Uint16Array(n);
    for (const [a, z] of (x && x.m) || []) for (let i = a; i < z && i < n; i++) f[i] |= F.M;
    for (const [a, z] of (x && x.c) || []) for (let i = a; i < z && i < n; i++) f[i] |= F.C;
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
  function oculto(b) {
    if (b & F.OCU) return true;
    if ((b & F.COR) && (prefs.cor === "base" || (prefs.cor === "primera" && (b & F.ALT)))) return true;
    if ((b & F.PAR) && prefs.par === false) return true;
    if ((b & F.ANG) && prefs.ang === false) return true;
    if ((b & F.SUP) && prefs.sup === false) return true;
    return false;
  }
  const CLASES = [[F.M, "tm"], [F.C, "tc"], [F.IT, "it"], [F.NG, "ng"], [F.COR, "tk"], [F.HE, "he"]];
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
    const visual = (b) => b & (F.M | F.C | F.IT | F.NG | F.COR | F.HE);
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
  const txtVerso = (L) => textoLectura(L.t, !!L.g, L);
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
  const libroDe = (c) => D.libros.find((b) => b.c === c);
  // Orden de los libros: cronológico (por defecto), por fecha de escritura o tradicional (datos/cronologia.json)
  let CRONO = null;
  const ORDENES = [
    ["crono", "Cronológico", "Primero los evangelios, según el primer acontecimiento que narra cada uno; luego Hechos, las cartas en el orden en que se escribieron y, al final, Revelación."],
    ["escritura", "Por escritura", "Cada libro en el orden en que se escribió, con su fecha aproximada: todos, antes del año 70."],
    ["tradicional", "Tradicional", "El orden habitual de las Biblias impresas."]];
  const ordenActivo = () => (CRONO && CRONO.ordenes[prefs.orden] ? prefs.orden : "tradicional");
  const nombreOrden = () => ({ crono: "en orden cronológico", escritura: "por fecha de escritura", tradicional: "en el orden tradicional" })[ordenActivo()];
  function librosEnOrden() { const k = ordenActivo(); return k === "tradicional" ? D.libros : CRONO.ordenes[k].map(libroDe).filter(Boolean); }
  const numLibro = (b) => librosEnOrden().indexOf(b) + 1;
  // En rótulos en mayúsculas, las palabras con signos (YēshŪ́ʿa) se dejan en su forma para no deformar los diacríticos
  const protegerMay = (t) => String(t).split(/(\S*[\u0300-\u036f\u02b0-\u02ff]\S*)/).filter(Boolean).map((x) => (/[\u0300-\u036f\u02b0-\u02ff]/.test(x) ? h("span", { class: "np", text: x }) : x));
  const fechaEscrito = (b) => (CRONO && CRONO.libros[b.c] ? CRONO.libros[b.c].e || "" : "");
  const fechaNarra = (b) => (CRONO && CRONO.libros[b.c] ? CRONO.libros[b.c].n || "" : "");
  const estadoEt = (n) => (D.escala[n] || {}).etiqueta || n;
  const refCorta = (b, cap, v) => b.n + " " + cap + (v != null ? ":" + v : "");

  // ------------------------------------------------------------------ ventana (diálogo modal)
  const modal = h("dialog", { class: "modal", "aria-label": "Detalle" });
  // Cada ventana (y cada paso dentro de ella) deja un paso en el historial: el botón atrás del teléfono o del navegador
  // vuelve un paso o cierra la ventana, igual que ×, Esc, tocar fuera o deslizar hacia abajo la cabecera.
  const M = { pila: [], nav: null, alCerrar: null, estados: 0, saltando: false, destino: null, porHistoria: false, porRuta: false };
  modal.addEventListener("click", (e) => { if (e.target === modal) cerrarModal(); });
  modal.addEventListener("close", () => {
    if (modal.open) return;
    document.documentElement.classList.remove("con-modal");
    M.pila = []; M.nav = null;
    const f = M.alCerrar; M.alCerrar = null;
    if (f) f();
    if (M.estados > 0 && !M.porHistoria && !M.porRuta) {
      const n = M.estados; M.estados = 0; M.destino = location.href; M.saltando = true;
      try { history.go(-n); } catch (e) { M.saltando = false; }
    } else M.estados = 0;
    M.porHistoria = false; M.porRuta = false;
  });
  function marcarPaso() { try { history.pushState({ biexVentana: 1 }, "", location.href); M.estados++; } catch (e) { /* sin historial (marco sin permiso) */ } }
  window.addEventListener("popstate", (e) => {
    if (M.saltando) {
      M.saltando = false;
      if (M.destino && M.destino !== location.href) { try { history.replaceState(null, "", M.destino); } catch (er) { /* ignorar */ } }
      M.destino = null;
      return;
    }
    if (modal.open) {
      if (M.estados > 0) M.estados--;
      if (M.pila.length > 1) { M.pila.pop(); pintarModal(); return; }
      M.porHistoria = true; cerrarModal(); return;
    }
    // un paso de una ventana ya cerrada (p. ej., tras seguir un enlace desde ella): se salta
    if (e.state && e.state.biexVentana) { try { history.back(); } catch (er) { /* ignorar */ } }
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
    modal.replaceChildren(fn());
    const c = $(".m-cuerpo", modal); if (c) c.scrollTop = 0;
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
  function cerrarModal() { if (modal.open) modal.close(); else if (modal.hasAttribute("open")) { modal.removeAttribute("open"); modal.dispatchEvent(new Event("close")); } }
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
  const NOMBRES_TAM = ["Pequeño", "Normal", "Grande", "Muy grande", "Máximo"];
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
          if (cambiar[k]) cambiar[k](v); else { ap[k] = v; store.set("ap", ap); aplicarAp(); }
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
          fila("Tamaño del texto", nomTam, grupo("tam", [1, 2, 3, 4, 5].map((n) => [n, h("span", { style: "font-size:" + [13, 16, 19, 23, 27][n - 1] + "px", text: "A" }), "Tamaño " + NOMBRES_TAM[n - 1].toLowerCase()]), "ap-tams")),
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
  const OPC0 = { ed: true, cor: "todas", par: true, ang: true, sup: true };
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
          fila("Ampliaciones entre corchetes [ ]", null, grupo("cor", [["todas", "Todas"], ["primera", "Solo la primera", "La primera ampliación de cada palabra"], ["base", "Solo la palabra base", "Sin ampliaciones"]])),
          fila("Paréntesis ( )", null, grupo("par", [[true, "Mostrar"], [false, "Ocultar"]])),
          fila("Signos < >", null, grupo("ang", [[true, "Mostrar"], [false, "Ocultar"]])),
          fila("Letras voladas y asteriscos (ᵐ ⁿ ᶠ *)", null, grupo("sup", [[true, "Mostrar"], [false, "Ocultar"]])),
          h("div", { class: "ap-pie" }, h("button", { class: "btn chico", type: "button", onclick: () => { Object.assign(prefs, OPC0); cambio(); pintarModal(); } }, "Restablecer"))));
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
    const extra = EMBED ? [
      EMBED ? h("button", { class: "btn-icono", type: "button", "aria-label": "Abrir en una pestaña nueva", title: "Abrir en una pestaña nueva", onclick: () => window.open(enlacePublico(location.hash), "_blank", "noopener") }, svg(ICO.externo)) : null,
      h("button", { class: "btn-icono", type: "button", "aria-label": "Cerrar el lector", title: "Cerrar el lector", onclick: () => { try { window.parent.postMessage({ biex: "cerrar" }, "*"); } catch (e) { /* ignorar */ } } }, svg(ICO.cerrar)),
    ] : [];
    raiz.replaceChildren(
      h("header", { class: "barra" }, h("div", { class: "in" },
        h("a", { class: "marca", href: "#/", "aria-label": "Inicio del lector" }, h("span", { class: "sello", text: "BiEx" }), h("span", { class: "nombre" }, h("b", { text: "Biblia Exacta" }), h("small", { text: "Lector y analizador" }))),
        h("nav", { class: "nav", "aria-label": "Secciones" }, h("a", { href: "#/", text: "Inicio" }), h("a", { href: "#/libros", text: "Libros" }), h("a", { href: "#/cronologia", text: "Cronología" }), h("a", { href: "#/buscar", text: "Avanzada" })),
        h("div", { class: "acc" }, buscar, guia, tema, extra))),
      h("main", { class: "pagina", id: "vista", tabindex: "-1" }),
      h("footer", { class: "pie" }, h("div", { class: "in" },
        h("div", { class: "marca-pie", text: "Biblia Exacta" }),
        h("p", { text: "Ningún verso se da por terminado: la traducción sigue abierta a ajustes. Los versos sin traducción completa se leen como texto base, palabra por palabra; lo que aún no tiene traducción fijada se muestra en griego." }),
        h("div", { class: "autoria" },
          h("span", { text: "Traducción, transliteración y análisis:" }),
          h("strong", { text: "BiEx – Biblia Exacta ©™." }),
          h("span", {}, h("a", { href: "https://bibliaexacta.wixsite.com/biex", target: "_blank", rel: "noopener", text: "Sitio oficial" }), h("span", { id: "actualizado" }))),
        h("p", { class: "creditos" }, "Texto griego y datos morfológicos: ", h("a", { href: "https://github.com/STEPBible/STEPBible-Data", target: "_blank", rel: "noopener", text: "TAGNT de STEPBible.org" }), " (Tyndale House, Cambridge), ",
          h("a", { href: "https://github.com/Clear-Bible/macula-greek", target: "_blank", rel: "noopener", text: "MACULA Greek Linguistic Datasets" }), " (Biblica) y ",
          h("a", { href: "https://github.com/LogosBible/SBLGNT", target: "_blank", rel: "noopener", text: "SBLGNT" }), " (Society of Biblical Literature y Logos Bible Software), con licencia CC BY 4.0."),
        h("p", { class: "creditos" }, "Transcripciones de los manuscritos: ", h("a", { href: "https://greekcntr.org", target: "_blank", rel: "noopener", text: "Center for New Testament Restoration" }), " (Alan Bunning), con licencia CC BY-SA 4.0; la comparación con el texto base se publica con la misma licencia. ",
          "Para reconocer las palabras con que se recuerda un verso, el buscador usa, sin mostrarlas, las traducciones de dominio público Reina-Valera 1909 y 1865, World English Bible, King James Version y Berean Standard Bible, y la Biblia en Español Sencillo (© 2018 AudioBiblia.org, CC BY 4.0). ",
          "Fechas de escritura: J. A. T. Robinson, Redating the New Testament (1976)."))),
      modal);
    const tg = store.get("tema", null);
    if (tg === "light" || tg === "dark") document.documentElement.setAttribute("data-theme", tg);
    else if (EMBED) document.documentElement.setAttribute("data-theme", "dark");
  }
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
      ? [["Evangelios y Hechos", "", ["MAT", "MRK", "LUK", "JHN", "ACT"]], ["Cartas", "", D.libros.map((b) => b.c).filter((c) => !["MAT", "MRK", "LUK", "JHN", "ACT", "REV"].includes(c))], ["Revelación", "", ["REV"]]]
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
    const textoOrden = h("p", { class: "nota-ui orden-nota", text: (ORDENES.find((o) => o[0] === ko) || ORDENES[2])[2] });
    const selOrden = h("div", { class: "seg seg-orden", role: "group", "aria-label": "Orden de los libros" }, ORDENES.map(([k, t]) => h("button", {
      type: "button", "aria-pressed": String(ko === k), disabled: !CRONO && k !== "tradicional" ? true : null, onclick: () => {
        if (ordenActivo() === k) return;
        prefs.orden = k; guardarPrefs();
        const y = window.scrollY; portada(false); window.scrollTo(0, y);
      } }, t)));
    const liLogos = (D.portada.p.find((w) => claveGr(w.g) === "λογοσ") || D.portada.p[0]).li;
    const ult = store.get("ultimo", null), ub = ult && libroDe(ult.c);
    const herr = (ico, t, p, a, href) => h("a", { class: "herr", href }, svg(ico), h("h3", { text: t }), h("p", { text: p }), h("span", { text: a }));
    vista().replaceChildren(
      h("section", { class: "hero" }, h("div", { class: "in" },
        h("div", { class: "hero-tit" },
          h("span", { class: "eyebrow", text: "Nueva Voluntad · griego koiné → español" }),
          h("h1", {}, "Del griego al español, ", h("em", { text: "palabra por palabra" }), "."),
          h("p", { text: "Lee cada libro en su estado actual de traducción y abre cualquier palabra para ver su forma, su transliteración, su lema, su análisis morfológico completo y todas las veces que aparece." })),
        h("div", { class: "codice" },
          h("div", { class: "codice-cab" },
            h("span", { class: "ref" }, h("b", { text: (lb.t || lb.n) + " " + P.cap + ":" + P.v }), " · ", lb.n + " " + P.cap + ":" + P.v),
            h("div", { class: "seg seg-hero", role: "group", "aria-label": "Escritura del griego" }, cajaBtn("may", "ΑΒΓ", "Mayúsculas, como los códices unciales"), cajaBtn("min", "αβγ", "Minúsculas con acentos y espíritus"))),
          h("div", { class: "interlineal" }, botones),
          h("p", { class: "pista", text: "Toca una palabra, en griego o en español, para abrir su análisis" })),
        h("div", { class: "acciones" },
          ub ? h("a", { class: "btn oro", href: "#/" + ub.c + "/" + ult.cap + (ult.m === "a" ? "/a" + (ult.v ? "/" + ult.v : "") : (ult.v ? "/l/" + ult.v : "")) }, svg(ICO.seguir), "Seguir leyendo · " + ub.n + " " + ult.cap + (ult.v ? ":" + ult.v : "")) : null,
          h("a", { class: "btn" + (ub ? "" : " oro"), href: "#/" + P.c + "/" + P.cap + "/l/" + P.v }, svg(ICO.libro), "Leer " + lb.n + " " + P.cap),
          h("a", { class: "btn", href: "#/" + P.c + "/" + P.cap + "/a/" + P.v }, svg(ICO.lupa), "Analizar palabra por palabra"),
          h("a", { class: "btn", href: "#/libros" }, svg(ICO.rejilla), "Los 27 libros")))),
      h("section", { class: "cifras" }, h("div", { class: "in" },
        h("div", { class: "c" }, h("b", { text: pct(D.palabras) }), h("span", { text: "de las palabras ya traducidas en el texto base" })),
        h("div", { class: "c" }, h("b", { text: fmt(D.palabrasTotal) }), h("span", { text: "palabras griegas analizadas" })),
        h("div", { class: "c" }, h("b", { text: fmt(D.lemas) }), h("span", { text: "lemas distintos" })),
        h("div", { class: "c" }, h("b", { text: fmt(D.legibles) }), h("span", { text: "versos que ya se pueden leer" })))),
      h("section", { class: "seccion", id: "libros" }, h("div", { class: "in" },
        h("div", { class: "seccion-cab" }, h("span", { class: "eyebrow", text: "La biblioteca" }), h("h2", { text: "Los 27 libros de la Nueva Voluntad" }), h("div", { class: "filete" }),
          h("p", { text: "Cada tramo de la franja es un libro, a la medida de sus palabras; el oro sube con las palabras ya traducidas en el texto base. Desliza el dedo o el puntero por la franja para ver el nombre de cada libro y suelta para abrirlo." })),
        h("div", { class: "orden-libros" }, h("span", { class: "rotulo", text: "Orden" }), selOrden, textoOrden),
        panorama,
        h("div", { class: "panorama-pie" }, h("span", { text: fmt(totalPal) + " palabras griegas" }), h("span", { text: L[0].n + " → " + L[L.length - 1].n })),
        grupos.map(([t, sub, cs]) => h("div", { class: "grupo-libros" }, h("h3", {}, h("span", {}, protegerMay(t)), sub ? h("small", { text: sub }) : null), h("div", { class: "tarjetas" }, cs.map((c) => tarjeta(libroDe(c)))))),
        CRONO ? h("a", { class: "tira-tiempo", href: "#/cronologia" },
          h("span", { class: "tt-ico" }, svg(ICO.tiempo)),
          h("span", { class: "tt-tx" }, h("b", { text: "Línea del tiempo" }), h("span", { text: "Qué sucedió y cuándo se escribió cada libro: de los anuncios del nacimiento a la destrucción del templo en el año 70." })),
          h("span", { class: "tt-ir", text: "Abrir" })) : null,
        h("div", { class: "leyenda" }, ["exacto", "casi", "revision", "borrador", "base"].map((k) => h("span", { class: "n-" + k }, h("i"), estadoEt(k)))))),
      h("section", { class: "seccion" }, h("div", { class: "in" },
        h("div", { class: "seccion-cab" }, h("span", { class: "eyebrow", text: "Herramientas" }), h("h2", { text: "Leer, analizar, comparar" }), h("div", { class: "filete" })),
        h("div", { class: "herramientas" },
          herr(ICO.libro, "Lectura", "Cada capítulo en su estado actual. Toca un verso y se abre su griego palabra por palabra.", "Leer Juan 1", "#/JHN/1"),
          herr(ICO.lupa, "Análisis morfológico", "Forma, transliteración, lema, tiempo, voz, modo, caso, función en la oración y ediciones de cada palabra.", "Analizar Juan 1", "#/JHN/1/a"),
          herr(ICO.buscar, "Buscador inteligente", "Escribe como lo recuerdes: una escena, un nombre, una cita, una palabra griega o una pregunta. Entiende también las palabras de otras traducciones.", "Probar: «cuando calmó la tormenta»", "#/buscar/cuando calmó la tormenta"),
          herr(ICO.manuscrito, "Manuscritos antiguos", "Cada verso en los papiros y códices más antiguos: qué dicen, en qué difieren y su transcripción letra por letra.", "Ver Marcos 1:1", "#/MRK/1/l/1/m"),
          herr(ICO.tiempo, "Línea del tiempo", "Los acontecimientos y la fecha en que se escribió cada libro, hasta la destrucción del templo en el año 70.", "Abrir", "#/cronologia"),
          herr(ICO.lista, "Concordancia", "Todas las apariciones de un lema en la Nueva Voluntad, con su forma, su traducción y su verso.", "Ver λόγος", "#/lema/" + liLogos),
          herr(ICO.filtros, "Búsqueda morfológica", "Combina rasgos: los aoristos pasivos de un libro, los participios de un lema, los genitivos de un capítulo…", "Buscar", "#/buscar"),
          herr(ICO.guia, "Guía animada", "Todo lo que puedes hacer, en pocos pasos, con imágenes en movimiento y textos breves que se pueden escuchar.", "Ver la guía", "#/guia")))));
    if (irLibros) requestAnimationFrame(() => { const s = $("#libros"); if (s) s.scrollIntoView({ block: "start" }); });
    else window.scrollTo(0, 0);
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
    const mismo = esc.libro === c && esc.cap === cap && esc.modo === modo && $(".libro", vista());
    esc.libro = c; esc.cap = cap; esc.modo = modo;
    if (mismo) { enfocar(v, i); return; }
    vista().replaceChildren(estructuraLibro(b, cap, modo, null, [cargando()]));
    if (v == null) window.scrollTo(0, 0);
    let Lc, A = null;
    try {
      Lc = await lectura(c);
      if (modo === "a") [A] = await Promise.all([analisis(c), tablas()]);
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
        h("section", { class: "hoja" }, barraHoja(b, cap, modo, versos),
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
    return h("header", { class: "banda" }, h("div", { class: "in" },
      h("div", { class: "banda-tit" },
        h("span", { class: "eyebrow", text: "Libro " + numLibro(b) + " de 27 " + nombreOrden() + " · Nueva Voluntad" }),
        h("h1", {}, h("span", { class: "tr", text: b.t || b.n }), b.t ? h("span", { class: "es", text: b.n }) : null),
        fechaEscrito(b) ? h("a", { class: "banda-fecha", href: "#/cronologia" }, svg(ICO.tiempo), "Escrito c. " + fechaEscrito(b).replace(/^c\. /, "") + (fechaNarra(b) ? " · narra " + fechaNarra(b) : "")) : null),
      h("div", { class: "banda-cifras" },
        h("div", { class: "anillo" }, anilloSvg(p), h("p", { text: "de las palabras ya traducidas en el texto base" })),
        h("div", { class: "mini-cifras" },
          h("div", {}, h("b", { text: fmt(b.total) }), "versos"),
          h("div", {}, h("b", { text: fmt(b.nPal || 0) }), "palabras"),
          h("div", {}, h("b", { text: fmt(b.nLem || 0) }), "lemas"),
          completos ? h("div", {}, h("b", { text: fmt(completos) }), "con traducción completa") : null))));
  }
  // Capítulos y teselas numeradas de los versos (en el riel de escritorio y en la ventana del móvil)
  function navContenido(b, cap, versos, alElegir) {
    const caps = h("div", { class: "caps", role: "group", "aria-label": "Capítulos" }, b.caps.map((C) => h("a", {
      class: "cap", href: "#/" + b.c + "/" + C.c + (esc.modo === "a" ? "/a" : ""), "aria-current": C.c === cap ? "true" : "false",
      title: "Capítulo " + C.c + ": " + pct(C.pct) + " de avance", onclick: alElegir || null }, String(C.c), h("i", { style: "width:" + Math.min(100, C.pct) + "%" }))));
    const teselas = versos ? h("div", { class: "teselas", role: "group", "aria-label": "Versos del capítulo " + cap }, versos.map((x) => h("button", {
      type: "button", class: "tesela n-" + x.n + (esc.modo !== "a" && prefs.nivel && !pasaFiltro(x, prefs.nivel) ? " fuera" : ""), "data-v": x.v, title: cap + ":" + x.v + " · " + estadoEt(x.n), "aria-label": "Verso " + x.v + ", " + estadoEt(x.n),
      onclick: () => { if (alElegir) alElegir(); irVerso(x.v); } }, String(x.v)))) : null;
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
  const pasaFiltro = (x, f) => !f || (f === "base" ? x.n === "base" : NIVELES.indexOf(x.n) >= NIVELES.indexOf(f));
  const nombreFiltro = (f) => (FILTROS.find((x) => x[0] === f) || FILTROS[0])[1];
  function barraHoja(b, cap, modo, versos) {
    const ir = (m) => "#/" + b.c + "/" + cap + (m === "a" ? "/a" : "");
    const btnModo = (m, t) => h("button", { type: "button", "aria-pressed": (modo === "a") === (m === "a") ? "true" : "false", onclick: () => { if ((modo === "a") !== (m === "a")) location.hash = ir(m); } }, t);
    const prev = cap > 1 ? "#/" + b.c + "/" + (cap - 1) + (modo === "a" ? "/a" : "") : null;
    const next = cap < b.caps.length ? "#/" + b.c + "/" + (cap + 1) + (modo === "a" ? "/a" : "") : null;
    const disp = modo !== "a" ? h("div", { class: "seg seg-ico", role: "group", "aria-label": "Disposición del texto" },
      [["versos", "Por versos", ICO.lista], ["continuo", "Continuo", ICO.parrafo]].map(([k, t, ico]) => h("button", { type: "button", "aria-pressed": prefs.disp === k ? "true" : "false", "aria-label": t, title: t, onclick: () => {
        if (prefs.disp === k) return; prefs.disp = k; guardarPrefs(); esc.libro = null; vistaLibro(b.c, cap, modo, null, null);
      } }, svg(ico), h("span", { class: "txt", text: t })))) : null;
    const filtro = modo !== "a" && versos ? h("label", { class: "filtro-niv" + (prefs.nivel ? " activo" : ""), title: "Mostrar los versos según su nivel de avance" }, svg(ICO.filtro),
      h("select", { "aria-label": "Mostrar los versos según su nivel de avance", onchange: (e) => { prefs.nivel = e.target.value; guardarPrefs(); esc.libro = null; vistaLibro(b.c, cap, modo, null, null); } },
        FILTROS.map(([k, t]) => h("option", { value: k, selected: (prefs.nivel || "") === k ? true : null, text: t + " · " + (k ? versos.filter((x) => pasaFiltro(x, k)).length : versos.length) })))) : null;
    const opciones = modo !== "a" ? h("button", { class: "btn-icono btn-opc", type: "button", "aria-label": "Opciones del texto: colores, corchetes y paréntesis", title: "Opciones del texto", onclick: abrirOpciones }, svg(ICO.opciones)) : null;
    return h("div", { class: "barra-hoja" },
      h("div", { class: "seg", role: "group", "aria-label": "Modo" }, btnModo("l", "Lectura"), btnModo("a", "Análisis")),
      h("button", { class: "btn-cap movil", type: "button", "aria-label": "Capítulo " + cap + ". Elegir capítulo y verso", onclick: () => abrirModal(vistaNavegador(b, cap, versos)) }, svg(ICO.rejilla), "Cap. " + cap),
      disp, filtro, opciones,
      h("div", { class: "navcap" },
        h("button", { class: "btn-icono", type: "button", "aria-label": "Capítulo anterior", title: "Capítulo anterior", disabled: !prev, onclick: () => prev && (location.hash = prev) }, svg(ICO.izq)),
        h("span", { class: "lbl", text: "Capítulo " + cap + " de " + b.caps.length }),
        h("button", { class: "btn-icono", type: "button", "aria-label": "Capítulo siguiente", title: "Capítulo siguiente", disabled: !next, onclick: () => next && (location.hash = next) }, svg(ICO.der))));
  }
  function vistaNavegador(b, cap, versos) {
    return () => cajaModal(cabModal(b.n, "Capítulo " + cap + " de " + b.caps.length), h("div", { style: "display:grid;gap:22px" }, navContenido(b, cap, versos, () => cerrarModal())));
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
      : antLibro ? h("a", { class: "btn", href: rutaCap(antLibro, antLibro.caps.length, modo) }, svg(ICO.izq), h("span", { text: antLibro.n })) : null;
    const sig = cap < b.caps.length ? h("a", { class: "btn oro sig", href: rutaCap(b, cap + 1, modo) }, h("span", { text: "Capítulo " + (cap + 1) }), svg(ICO.der))
      : sigLibro ? h("a", { class: "btn oro sig", href: rutaCap(sigLibro, 1, modo) }, h("span", { text: sigLibro.n }), svg(ICO.der)) : null;
    return h("nav", { class: "fin-cap", "aria-label": "Seguir leyendo" }, ant, sig);
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
    const nota = hayBase ? h("p", { class: "nota-base" }, "Los versos en texto base se leen palabra por palabra; en ", h("span", { class: "gr", text: "dorado" }), ", el griego que aún no tiene traducción fijada. Toca cualquier verso para abrir su griego palabra por palabra.", ley) :
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
        if (!actual || iniciaPericopa(usaP, x, k)) { actual = h("p", { class: "peri" }, h("span", { class: "par", "aria-hidden": "true", text: "§" })); parrafos.push(actual); }
        actual.append(h("span", { class: "vs n-" + x.n, id: "v" + x.v, role: "button", tabindex: "0", title: refCorta(b, cap, x.v) + " · " + estadoEt(x.n),
          onclick: () => abrir(x), onkeydown: (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); abrir(x); } } },
          h("sup", { text: x.v }), txtVerso(x)), " ");
      });
      if (f && versos.length && todos.indexOf(versos[versos.length - 1]) < todos.length - 1) parrafos.push(salto(todos.length - 1 - todos.indexOf(versos[versos.length - 1])));
      return [encabezado(b, cap, "l"), nota, avisoFiltro, h("div", { class: "continuo" }, parrafos), finCap(b, cap, "l")];
    }
    const filas = [];
    versos.forEach((x, k) => {
      if (f && huecos(x, k) > 0) filas.push(salto(huecos(x, k)));
      filas.push(filaVerso(x, k));
    });
    if (f && versos.length && todos.indexOf(versos[versos.length - 1]) < todos.length - 1) filas.push(salto(todos.length - 1 - todos.indexOf(versos[versos.length - 1])));
    return [encabezado(b, cap, "l"), nota, avisoFiltro, h("div", { class: "lectura" }, filas), finCap(b, cap, "l")];
    function filaVerso(x, k) {
      return h("div", {
      class: "vl n-" + x.n + (iniciaPericopa(usaP, x, k) ? " p" : ""), id: "v" + x.v, role: "button", tabindex: "0",
      "aria-label": "Verso " + x.v + " (" + estadoEt(x.n) + "). Abrir su griego palabra por palabra",
      onclick: () => abrir(x), onkeydown: (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); abrir(x); } } },
      h("span", { class: "vn", title: estadoEt(x.n) + (x.n === "base" ? ": " + x.k + " % de las palabras ya traducidas" : ""), text: x.v }),
      h("span", { class: "vt" }, txtVerso(x)));
    }
  }
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
      cont.append(h("div", { class: "av", id: "v" + v },
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
      el.scrollIntoView({ block: "start", behavior: "auto" });
    }
    if (esc.modo === "a" && i != null && i !== "m") abrirPalabraAnalisis(v, i);
    if (esc.modo !== "a" && i === "m") { const b = libroDe(esc.libro); if (b) abrirVerso(b, esc.cap, v, true); }
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
        enCap ? null : h("a", { class: "btn chico oro", href: "#/" + b.c + "/" + cap + "/a/" + v + "/" + ctx.i }, svg(ICO.lupa), "Ver en el análisis del capítulo"));
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
  const msCap = (c, cap) => cargar("datos/manuscritos/" + c + "/" + cap + ".json");
  async function msVerso(c, cap, v) { const [Tg, MC] = await Promise.all([testigos(), msCap(c, cap)]); return { Tg, X: MC[String(v)] || null }; }
  const idBase = (id) => String(id).replace(/[*c]$/, "");
  const siglaDe = (Tg, id) => { const t = Tg.porId.get(idBase(id)); const suf = /\*$/.test(id) ? "*" : /c$/.test(id) ? "ᶜ" : ""; return (t ? t.s : idBase(id)) + suf; };
  const ordenarTestigos = (Tg, ids) => [...new Set(ids)].sort((a, b) => ((Tg.porId.get(idBase(a)) || {}).i ?? 999) - ((Tg.porId.get(idBase(b)) || {}).i ?? 999));
  const sigmaFinal = (s) => String(s || "").replace(/σ(?=\s|$)/g, "ς");
  const SINAITICO = { MAT: 33, MRK: 34, LUK: 35, JHN: 36, ROM: 37, "1CO": 38, "2CO": 39, GAL: 40, EPH: 41, PHP: 42, COL: 43, "1TH": 44, "2TH": 45, HEB: 46, "1TI": 47, "2TI": 48, TIT: 49, PHM: 50, ACT: 51, JAS: 52, "1PE": 53, "2PE": 54, "1JN": 55, "2JN": 56, "3JN": 57, JUD: 58, REV: 59 };
  function enlacesImagen(id, c, cap, v) {
    const out = [];
    if (id === "01" && SINAITICO[c]) out.push(["Ver este verso en el Códice Sinaítico", "https://codexsinaiticus.org/en/manuscript.aspx?book=" + SINAITICO[c] + "&chapter=" + cap + "&lid=en&side=r&verse=" + v + "&zoomSlider=0"]);
    if (id === "03") out.push(["Biblioteca Vaticana (Vat. gr. 1209)", "https://digi.vatlib.it/view/MSS_Vat.gr.1209"]);
    if (id === "05") out.push(["Biblioteca Digital de Cambridge", "https://cudl.lib.cam.ac.uk/view/MS-NN-00002-00041/1"]);
    const doc = /^P\d+$/.test(id) ? 10000 + +id.slice(1) : /^0\d+$/.test(id) ? 20000 + +id : null;
    if (doc) out.push(["Imágenes y transcripción del INTF (Münster)", "https://ntvmr.uni-muenster.de/manuscript-workspace?docID=" + doc]);
    return out;
  }
  const palBase = (toks, k) => (toks && toks[k] ? T.F[toks[k][0]] : "");
  const TIPO_MS = { om: "omite", add: "añade", sust: "otra palabra", orden: "otro orden", ausente: "sin el verso" };
  function frasePlana(v, toks) {
    const [tipo, pos, lect] = v;
    const g = (s) => h("span", { class: "gk-ms", lang: "grc", text: s });
    if (tipo === "ausente") return ["No contiene este verso."];
    if (tipo === "om") return ["Omite ", g(pos.map((k) => palBase(toks, k)).join(" ")), "."];
    if (tipo === "add") return ["Añade ", g(sigmaFinal(lect)), pos[0] >= 0 ? [" después de ", g(palBase(toks, pos[0]))] : " al comienzo", "."];
    if (tipo === "sust") return ["Dice ", g(sigmaFinal(lect)), " en lugar de ", g(palBase(toks, pos[0])), "."];
    if (tipo === "orden") return ["Pone ", g(palBase(toks, pos[0])), " en otro lugar del verso."];
    return [tipo];
  }
  // Línea del aparato crítico, con los signos de las ediciones críticas
  function lineaAparato(v, toks, Tg) {
    const [tipo, pos, lect, ids] = v;
    const tes = ordenarTestigos(Tg, ids).map((id) => siglaDe(Tg, id)).join(" ");
    const p = (k) => palBase(toks, k);
    if (tipo === "ausente") return "vers. om. " + tes;
    if (tipo === "om") return (pos.length > 1 ? "□" + pos.map(p).join(" ") + "\\" : "○" + p(pos[0])) + " om. " + tes;
    if (tipo === "add") return "⸆" + (pos[0] >= 0 ? " (tras " + p(pos[0]) + ")" : " (al comienzo)") + " " + sigmaFinal(lect) + " " + tes;
    if (tipo === "sust") return "⸀" + p(pos[0]) + "] " + sigmaFinal(lect) + " " + tes;
    if (tipo === "orden") return "⸉" + p(pos[0]) + "⸊ transp. " + tes;
    return tipo + " " + tes;
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
        if (ch === "\uFFFD") { w.append("?"); hayLetras = true; continue; }
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
      if (!X || !X.w.length) { caja.replaceChildren(h("span", { class: "nota-ui", text: "Ningún manuscrito de antes del año 400 conserva este verso; el texto se apoya en manuscritos posteriores." })); return; }
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
      return cajaModal(cabModal("Manuscritos · " + refCorta(b, cap, v), "Los testigos griegos más antiguos (hasta c. 400)"),
        h("div", {}, h("div", { class: "ms-barra" }, seg), cuerpo),
        h("div", { class: "m-pie" }, h("p", { class: "creditos-ms" }, "Transcripciones: ", h("a", { href: "https://greekcntr.org", target: "_blank", rel: "noopener", text: "Center for New Testament Restoration" }), " (CC BY-SA 4.0). Fechas aproximadas.")));
    };
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
    const marcar = (ks) => { for (const t of tarjetas) t.classList.toggle("sel", ks.includes(+t.dataset.k)); const t = tarjetas.find((x) => ks.includes(+x.dataset.k)); if (t) t.scrollIntoView({ block: "nearest", behavior: "smooth" }); };
    const texto = h("div", { class: "ms-texto", lang: "grc" });
    const adds = (p) => { const ks = porPos.get("a" + p); if (ks) texto.append(h("button", { type: "button", class: "ms-add", title: "Aquí algún manuscrito añade algo", onclick: () => marcar(ks), text: "⸆" }), " "); };
    adds(-1);
    toks.forEach((t, k) => {
      const ks = porPos.get(k);
      const tipos = ks ? [...new Set(ks.map((j) => vars[j][0]))] : [];
      const el = ks ? h("button", { type: "button", class: "ms-w " + tipos.map((x) => "v-" + x).join(" "), onclick: () => marcar(ks) }, spanGk(T.F[t[0]])) : h("span", { class: "ms-w" + (t[6] & 1 ? " fuera-na" : "") }, spanGk(T.F[t[0]]));
      texto.append(el, punt(t[4]) ? punt(t[4]) : "", " ");
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
        experto ? h("div", { class: "mv-ap", lang: "grc", text: lineaAparato(x, toks, Tg) }) : h("p", { class: "mv-fr" }, frasePlana(x, toks)),
        h("div", { class: "mv-tes" }, ids.map((id) => { const tg = Tg.porId.get(idBase(id)) || {}; return h("span", { class: "chip", title: (tg.n || "") + (tg.f ? " · " + tg.f : "") + (/\*$/.test(id) ? " · primera mano" : /c$/.test(id) ? " · corrección posterior" : ""), text: siglaDe(Tg, id) + (experto ? "" : tg.f ? " · " + tg.f : "") }); })));
      tarjetas.push(t);
      return t;
    }) : h("p", { class: "nota-ui", text: "Los manuscritos antiguos que conservan este verso coinciden con el texto base, salvo detalles de ortografía (itacismos, ν final, letras dobles)." }));
    // cada testigo
    const sep = !!prefs.msEsp;
    const filas = h("div", { class: "ms-testigos" }, pres.map((x) => {
      const det = h("details", { class: "ms-t" });
      const im = enlacesImagen(x.t.id, b.c, cap, v);
      det.append(h("summary", {},
        h("span", { class: "mt-s", lang: "grc", text: x.t.s }),
        h("span", { class: "mt-n" }, h("b", { text: x.t.n || x.t.s }), h("small", { text: [x.t.f, x.t.in].filter(Boolean).join(" · ") })),
        h("span", { class: "mt-c", title: x.cob ? "Parte del verso que se lee en este manuscrito" : "No contiene el verso" }, x.cob ? h("i", { style: "width:" + x.cob + "%" }) : null, h("em", { text: x.cob ? x.cob + " %" : "—" }))));
      det.addEventListener("toggle", () => {
        if (!det.open || det.dataset.listo) return;
        det.dataset.listo = "1";
        det.append(h("div", { class: "mt-cuerpo" },
          h("p", { class: "nota-ui", text: x.t.co ? "Contiene: " + x.t.co + "." : "" }),
          diplomatica(x.txt, sep),
          h("p", { class: "nota-ui mt-ley", text: "Transcripción letra por letra, con los cambios de línea del manuscrito. Raya: abreviatura (nombre sagrado o número). Punto debajo: letra dañada. [ ]: letras perdidas. ᶜ: corrección de otra mano." }),
          im.length ? h("div", { class: "mt-img" }, im.map(([t, u]) => h("a", { class: "btn chico", href: u, target: "_blank", rel: "noopener" }, svg(ICO.externo), t))) : null));
      });
      return det;
    }));
    const sepBtn = h("button", { class: "btn chico", type: "button", onclick: () => { prefs.msEsp = !prefs.msEsp; guardarPrefs(); pintarMs(cuerpo, ctx, Tg, X, toks, modo); } }, prefs.msEsp ? "Escritura continua, como en el manuscrito" : "Separar las palabras");
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
        vars.length ? h("p", { class: "nota-ui ms-ley" }, h("span", { class: "ms-w v-om", text: "omitida" }), " ", h("span", { class: "ms-w v-sust", text: "cambiada" }), " ", h("span", { class: "ms-w v-orden", text: "de otro orden" }), " ", h("span", { class: "ms-add", text: "⸆" }), " añadido") : null),
      h("div", { class: "bloque" }, h("h4", { text: experto ? "Aparato" : "Diferencias" }), lista),
      h("div", { class: "bloque" }, h("h4", {}, "Cada manuscrito", sepBtn), filas),
      eds);
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
          L ? h("div", { class: "chip-estado n-" + L.n }, h("i"), estadoEt(L.n) + (L.n === "base" ? " · " + L.k + " % de las palabras ya traducidas" : "")) : null,
          L ? h("p", { class: "fv-es" }, txtVerso(L)) : null,
          h("div", { class: "bloque" }, h("h4", { text: "Palabra por palabra · toca una para ver su análisis" }), zona),
          h("div", { class: "bloque" }, h("h4", { text: "En los manuscritos antiguos" }), resumenManuscritos({ b, cap, v: ctx.v }, () => empujar(vistaManuscritos(ctx))))),
        h("div", { class: "m-pie" },
          L ? h("button", { class: "btn chico", type: "button", onclick: () => compartir(nombreLibro(b) + " " + cap + ":" + ctx.v, textoPlano(L.t), "#/" + b.c + "/" + cap + "/l/" + ctx.v) }, svg(ICO.compartir), "Compartir") : null,
          h("button", { class: "btn chico", type: "button", onclick: () => empujar(vistaManuscritos(ctx)) }, svg(ICO.manuscrito), "Manuscritos"),
          h("a", { class: "btn chico oro", href: "#/" + b.c + "/" + cap + "/a/" + ctx.v }, svg(ICO.lupa), "Analizar el capítulo")));
    };
  }
  // ------------------------------------------------------------------ buscador inteligente (ventana)
  // Entiende citas, libros, escenas descritas con palabras propias, nombres, palabras griegas (también con letras latinas),
  // las palabras con que se recuerdan los versos en otras traducciones y preguntas sobre el uso de la página.
  const VERSIONES = { busqueda: "23a490b7e4" }; // la huella de cada archivo la pone wix/sellar.py
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
  const refTexto = (r) => { const b = libroDe(r[0]); return (b ? b.n : r[0]) + " " + r[1] + ":" + r[2] + (r[3] !== r[1] ? "–" + r[3] + ":" + (r[4] === 999 ? "" : r[4]) : r[4] !== r[2] && r[4] !== 999 ? "-" + r[4] : ""); };
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
    };
    return h("button", { class: "btn chico oro", type: "button", onclick: hacer }, svg(ICO.seguir), t);
  }
  let volverBusqueda = null; // { q, ruta }: el lector ofrece volver a los resultados después de abrir uno
  const recordarBusqueda = (q, ruta) => { volverBusqueda = { q, ruta }; };
  function inicioBusqueda(elegir) {
    const ej = [
      ["Escenas", ["la mujer samaritana", "cuando calmó la tormenta", "el hijo pródigo", "la última cena"]],
      ["Con tus palabras", ["el amor es paciente", "Tomás no creyó", "no quedará piedra sobre piedra", "el que esté sin pecado"]],
      ["Citas y libros", ["Jn 3:16", "Marcos 4", "1 Co 13:4-7", "Revelación"]],
      ["Griego", ["λόγος", "agape", "pneuma", "χάρις"]],
      ["Preguntas", ["¿Qué significan los corchetes?", "¿Qué pasó en el año 70?", "¿Cómo veo los manuscritos?"]]];
    return h("div", { class: "bq-inicio" },
      h("p", { class: "nota-ui", text: "Escribe como lo recuerdes, aunque no sea con las palabras de BiEx: el buscador entiende escenas, nombres, lugares, citas, palabras griegas y preguntas sobre la página. Para buscar solo en un libro, termina con «en Marcos», «en Romanos»…" }),
      ej.map(([t, xs]) => h("div", { class: "bq-grupo-ej" }, h("h4", { text: t }), h("div", { class: "bq-ej" }, xs.map((x) => h("button", { type: "button", lang: /[Ͱ-Ͽἀ-῿]/.test(x) ? "grc" : null, onclick: () => elegir(x), text: x }))))));
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
    if (r.filtro) avisos.push(h("span", { class: "chip" }, "Solo en " + r.filtro.n + " ", h("button", { class: "enlace", type: "button", onclick: () => elegir(q.replace(/\s+(?:en|de|del libro de|en el libro de)\s+[^]*$/i, "")), text: "(quitar)" })));
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
          return h("li", {}, h("a", { class: "res-verso", href: ruta, onclick: abrirRes(ruta) }, h("span", { class: "rv-ref", text: b.n + " " + c + ":" + v }), tx));
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
  async function vistaLema(li) {
    navActual("#/buscar");
    vista().replaceChildren(cargando("Cargando el lema…"));
    window.scrollTo(0, 0);
    try { await tablas(); } catch (e) { vista().replaceChildren(fallo("No se pudieron cargar los datos.")); return; }
    if (!(li >= 0 && li < T.L.length)) return noEncontrado();
    document.title = T.L[li] + " · BiEx";
    const par = T.LP[li] || [];
    const lb = T.LB[li] || [];
    const pares = []; for (let k = 0; k < lb.length; k += 2) pares.push([lb[k], lb[k + 1]]);
    const max = Math.max(1, ...pares.map((p) => p[1]));
    const trads = [...new Set(par.map((r) => r[3]).filter(Boolean))].slice(0, 12);
    const citas = h("ol", { class: "citas" });
    const barra = h("div", { class: "progreso", "aria-hidden": "true" }, h("i"));
    const estado = h("p", { class: "nota-ui", text: "Reuniendo las apariciones…" });
    const mas = h("button", { class: "btn chico", type: "button", hidden: true, text: "Mostrar más" });
    vista().replaceChildren(h("div", { class: "in" }, h("section", { class: "panel" },
      h("div", { class: "panel-cab" }, h("span", { class: "eyebrow", text: "Concordancia del lema" }),
        h("h1", { lang: "grc" }, T.L[li], h("small", { text: T.LT[li] })),
        h("p", { class: "nota-ui", text: fmt(T.LN[li]) + " apariciones en " + pares.length + (pares.length === 1 ? " libro" : " libros") + ", en " + par.length + (par.length === 1 ? " forma" : " formas") + " distintas." }),
        trads.length ? h("div", { class: "chips" }, trads.map((x) => h("span", { class: "chip", text: T.TR[x] }))) : null),
      h("div", { class: "columnas" },
        h("div", { class: "tarjeta" }, h("h2", { text: "Formas" }), h("table", { class: "paradigma" }, h("tbody", {}, par.map((r) => h("tr", {},
          h("td", {}, spanGk(T.F[r[0]])), h("td", { class: "m", text: mdTok([r[0], 0, r[1], 0, "", 0, 0, r[4]]) }), h("td", { text: r[3] ? T.TR[r[3]] : "" }), h("td", { class: "n", text: fmt(r[2]) })))))),
        h("div", { class: "tarjeta" }, h("h2", { text: "Por libro" }), h("div", { class: "barras" }, pares.map(([bi, n]) => {
          const b = D.libros[bi];
          return h("div", {}, h("a", { href: "#/" + b.c + "/1/a", text: b.t || b.n, title: nombreLibro(b) }), h("i", { style: "width:" + (100 * n / max).toFixed(1) + "%" }), h("em", { text: fmt(n) }));
        })))),
      h("div", { class: "tarjeta" }, h("h2", { text: "Apariciones · toca una para ver su análisis" }), barra, estado, citas, mas))));
    const hall = [];
    let mostradas = 0;
    const pinta = () => {
      const lote = hall.slice(mostradas, mostradas + 60);
      mostradas += lote.length;
      citas.append(...lote.map(citaEl));
      mas.hidden = mostradas >= hall.length;
    };
    mas.onclick = pinta;
    let k = 0;
    for (const [bi] of pares) {
      const b = D.libros[bi];
      let A, Lc;
      try { [A, Lc] = await Promise.all([analisis(b.c), lectura(b.c)]); } catch (e) { continue; }
      for (const [cap, vs] of Object.entries(A.caps)) for (const [v, toks] of vs) toks.forEach((t, i) => { if (t[1] === li) hall.push({ b, cap: +cap, v, toks, i, L: (Lc.caps[cap] || []).find((x) => x.v === v) }); });
      k++;
      $("i", barra).style.width = (100 * k / pares.length) + "%";
      if (mostradas < 60) pinta();
      if (!document.body.contains(citas)) return;
    }
    estado.textContent = fmt(hall.length) + (hall.length === 1 ? " aparición." : " apariciones, en el orden de los libros.");
    barra.hidden = true;
    if (mostradas === 0) pinta();
  }
  function citaEl(x) {
    const ref = (x.b.t || x.b.n) + " " + x.cap + ":" + x.v + " · " + x.b.n + " · " + mdTok(x.toks[x.i]);
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
    window.scrollTo(0, 0);
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
  const anio = (a) => (a < 0 ? Math.round(-a) + " a.C." : Math.round(a) + " d.C.");
  function vistaCronologia(foco) {
    document.title = "Línea del tiempo · BiEx";
    navActual("#/cronologia");
    if (!CRONO) { vista().replaceChildren(fallo("No se pudo cargar la línea del tiempo.")); return; }
    const ver = store.get("cronoVer", "todo");
    const escritos = librosEnOrden().filter((b) => CRONO.libros[b.c] && CRONO.libros[b.c].ea != null).map((b) => ({ tipo: "es", a: CRONO.libros[b.c].ea, b }));
    const items = CRONO.eventos.map((e) => ({ tipo: "ev", a: e.a, e })).concat(escritos).sort((p, q) => p.a - q.a || (p.tipo === "ev" ? -1 : 1));
    const visibles = items.filter((x) => ver === "todo" || (ver === "hechos" ? x.tipo === "ev" : x.tipo === "es"));
    const chips = (txt) => h("span", { class: "tl-refs" }, parsearRefs(txt).map((r) => h("a", { href: refRuta(r), text: refTexto(r) })));
    const lista = h("ol", { class: "tl" });
    let decada = null;
    for (const x of visibles) {
      const d = x.a < 0 ? "a.C." : Math.floor(x.a / 10) * 10;
      if (d !== decada) { decada = d; lista.append(h("li", { class: "tl-dec", "aria-hidden": "true" }, h("span", { text: d === "a.C." ? "Antes de Cristo" : d === 0 ? "Primeros años" : "Años " + d }))); }
      if (x.tipo === "es") {
        const b = x.b, c = CRONO.libros[b.c];
        lista.append(h("li", { class: "tl-it tl-es" }, h("span", { class: "tl-f", text: (/^c\./.test(c.e) ? c.e : "c. " + c.e) + " d.C." }),
          h("a", { class: "tl-c", href: "#/" + b.c + "/1" }, h("span", { class: "tl-k", text: "Se escribe" }), h("b", { text: b.t || b.n }), h("small", { text: b.n }))));
      } else {
        const e = x.e;
        const li = h("li", { class: "tl-it tl-ev" + (e.clave ? " tl-clave" : ""), id: e.clave ? "a" + Math.round(e.a) : null },
          h("span", { class: "tl-f", text: e.f }),
          h("div", { class: "tl-c" },
            h("b", { text: e.t }),
            e.d ? h("p", { text: e.d }) : null,
            e.r ? chips(e.r) : null,
            e.h ? h("p", { class: "tl-h" }, "Registro histórico: ", h("cite", { text: e.h })) : null,
            e.liga ? h("a", { class: "btn chico", href: "#/cronologia/" + e.liga }, svg(ICO.seguir), "Ver lo que sucedió en el año " + e.liga) : null));
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
    // vista de conjunto: un eje de c. 8 a.C. a 72 d.C. con cada punto
    const A = -8, Z = 72, pos = (a) => ((a - A) / (Z - A) * 100).toFixed(2) + "%";
    const eje = h("div", { class: "tl-eje", "aria-hidden": "true" },
      [-5, 10, 30, 50, 70].map((a) => h("span", { class: "te-m", style: "left:" + pos(a), text: anio(a) })),
      items.map((x) => h("span", { class: "te-p " + (x.tipo === "ev" ? "ev" : "es") + (x.e && x.e.clave ? " clave" : ""), style: "left:" + pos(x.a), title: x.tipo === "ev" ? x.e.f + ": " + x.e.t : "Se escribe " + (x.b.t || x.b.n) + " (c. " + CRONO.libros[x.b.c].e.replace(/^c\. /, "") + ")" })));
    const seg = h("div", { class: "seg", role: "group", "aria-label": "Qué mostrar" }, [["todo", "Todo"], ["hechos", "Acontecimientos"], ["escritos", "Escritura de los libros"]].map(([k, t]) => h("button", { type: "button", "aria-pressed": String(ver === k), onclick: () => { store.set("cronoVer", k); vistaCronologia(foco); } }, t)));
    vista().replaceChildren(h("div", { class: "in" }, h("section", { class: "panel" },
      barraVolver(),
      h("div", { class: "panel-cab" }, h("span", { class: "eyebrow", text: "Nueva Voluntad · c. 7 a.C. – 70 d.C." }), h("h1", { class: "texto", text: "Línea del tiempo" }),
        h("p", { class: "nota-ui tl-intro", text: "Lo que narra la Nueva Voluntad y cuándo se escribió cada libro. Todos se escribieron antes del año 70, cuando Roma destruyó Jerusalén y su templo, tal como se había anunciado: el propio texto da las claves para entender lo que anuncia, y la historia lo confirma." })),
      h("div", { class: "tl-conj" }, eje, h("div", { class: "tl-ley" }, h("span", { class: "ev", text: "Acontecimiento" }), h("span", { class: "es", text: "Se escribe un libro" }), h("span", { class: "clave", text: "Año 70" }))),
      h("div", { class: "tl-ctl" }, seg),
      lista,
      h("div", { class: "tarjeta tl-fuentes" }, h("h2", { text: "Fechas y fuentes" }), h("p", { class: "nota-ui", text: CRONO.nota }),
        h("ul", {}, (CRONO.fuentes || []).map(([t, d]) => h("li", {}, h("cite", { text: t }), " — " + d)))))));
    if (foco) requestAnimationFrame(() => { const el = document.getElementById("a" + foco); if (el) el.scrollIntoView({ block: "center" }); else window.scrollTo(0, 0); });
    else window.scrollTo(0, 0);
  }

  // ------------------------------------------------------------------ explorar por nivel
  const NIVEL_TXT = { exacto: "Versos que el autor da por exactos, siempre abiertos a ajustes.", casi: "Versos con la traducción casi terminada.", revision: "Versos con traducción completa que el autor está revisando.", borrador: "Versos con una primera traducción del autor.", base: "Versos que aún se leen como texto base, palabra por palabra." };
  async function vistaNiveles(nivel, lib) {
    document.title = "Explorar por nivel · BiEx";
    navActual("#/niveles");
    window.scrollTo(0, 0);
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
        out.push(h("h3", { class: "niv-cap" }, h("a", { href: "#/" + selLib + "/" + cap, text: b.n + " " + cap }), h("small", { text: xs.length + " de " + vs.length + " versos" })));
        out.push(h("div", { class: "lectura niv-vs" }, xs.map((x) => h("a", { class: "vl n-" + x.n, href: "#/" + selLib + "/" + cap + "/l/" + x.v }, h("span", { class: "vn", text: x.v }), h("span", { class: "vt" }, txtVerso(x))))));
      }
      lista.replaceChildren(...out);
    } catch (e) { lista.replaceChildren(fallo("No se pudo cargar el libro.")); }
  }

  // ------------------------------------------------------------------ guía animada
  // Pensada también para personas neurodivergentes: cada paso es una escena en movimiento con una frase breve; avanza sola
  // (o a mano), se puede pausar, se puede escuchar en voz alta y respeta «Sin animaciones» (entonces muestra cada escena quieta).
  const PASOS_GUIA = [
    { t: "La biblioteca", d: "Desliza el dedo por la franja: verás el nombre original de cada libro. Suelta para abrirlo.", e: "franja", ir: ["Ir a la biblioteca", "#/libros"] },
    { t: "En orden cronológico", d: "Los libros aparecen según los acontecimientos y la fecha en que se escribieron. Puedes cambiar el orden cuando quieras.", e: "orden", ir: ["Ver los libros", "#/libros"] },
    { t: "Leer un capítulo", d: "Toca un verso y se abre su griego, palabra por palabra.", e: "verso", ir: ["Leer Marcos 1", "#/MRK/1"] },
    { t: "Cada palabra, a fondo", d: "Toca una palabra: su forma, su transliteración, su lema, su tiempo y su caso, y todas las veces que aparece.", e: "palabra", ir: ["Analizar Marcos 1", "#/MRK/1/a"] },
    { t: "Lee a tu manera", d: "Con los colores de la edición BiEx, con todas las ampliaciones, solo la primera o solo la palabra base.", e: "corchetes", ir: ["Opciones del texto", "opciones"] },
    { t: "Busca como lo recuerdes", d: "Escribe una escena, un nombre, una cita o una pregunta. El buscador entiende aunque no uses las palabras exactas.", e: "buscar", ir: ["Probar el buscador", "?q=cuando calmó la tormenta"] },
    { t: "Los manuscritos más antiguos", d: "Mira cada verso en los papiros y códices: qué dicen, en qué difieren y su escritura letra por letra.", e: "ms", ir: ["Ver Marcos 1:1", "#/MRK/1/l/1/m"] },
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
        lista.replaceChildren(...LO.slice(0, 5).map((b, i) => h("span", { style: "--i:" + i }, h("em", { text: String(i + 1).padStart(2, "0") }), h("b", { text: b.n }), fechaEscrito(b) ? h("small", { text: "c. " + fechaEscrito(b).replace(/^c\. /, "") }) : null)));
      };
    },
    verso(el) {
      const ws = (D.portada && D.portada.p ? D.portada.p : []).slice(0, 4);
      const lineas = h("div", { class: "gv-lineas" }, [0, 1, 2].map((i) => h("div", { class: "gv-l" }, h("em", { text: String(i + 1) }), h("span", {}, h("i"), h("i"), h("i")))));
      const hoja = h("div", { class: "gv-hoja" }, ws.map((w) => h("span", { class: "gv-w" }, h("b", { lang: "grc", text: w.g }), h("small", { text: glosa(w.tr)[0] }))));
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
    corchetes(el) {
      const txt = h("p", { class: "gc-tx vt" }), modo = h("span", { class: "gc-modo" });
      el.append(h("div", { class: "gc" }, modo, txt));
      let L = null, ult = "";
      lectura("MRK").then((Lc) => { L = (Lc.caps[2] || []).find((x) => x.v === 5) || null; ult = ""; }).catch(() => {});
      const modos = [["todas", "Todas las ampliaciones"], ["primera", "Solo la primera"], ["base", "Solo la palabra base"]];
      return (t) => {
        const k = t >= 99 ? 1 : Math.floor(t / 2.6) % modos.length;
        const clave = k + (L ? "L" : "");
        if (clave === ult) return; ult = clave;
        modo.textContent = modos[k][1];
        if (!L) { txt.textContent = "…"; return; }
        const antes = prefs.cor; prefs.cor = modos[k][0];
        try { txt.replaceChildren(txtVerso(L)); } finally { prefs.cor = antes; }
        txt.classList.remove("cambia"); void txt.offsetWidth; txt.classList.add("cambia");
      };
    },
    buscar(el) {
      const frase = "cuando calmó la tormenta";
      const campo = h("div", { class: "gb-campo" }, svg(ICO.buscar), h("span", { class: "gb-tx" }), h("span", { class: "gb-cursor" }));
      const res = h("div", { class: "gb-res" }, h("span", { class: "gb-r" }, h("small", { text: "Escena" }), h("b", { text: "La tempestad calmada" })), h("span", { class: "gb-r" }, h("small", { text: "Verso" }), h("b", { text: "Marcos 4:39" })));
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
      const marcas = [[-6, "c. 6 a.C."], [30, "c. 30"], [50, "50"], [68, "68"], [70, "70"]];
      const eje = h("div", { class: "gt-eje" }, marcas.map(([a, x]) => h("span", { class: a === 70 ? "clave" : "", style: "left:" + ((a + 8) / 80 * 100) + "%", text: x })), h("i", { class: "gt-cursor" }));
      el.append(h("div", { class: "gt" }, eje, h("p", { class: "gt-n", text: "Año 70: destrucción del templo" })));
      return (t) => {
        const u = t >= 99 ? 1 : Math.min(1, Math.max(0, (t - 0.4) / 4.8));
        eje.querySelector(".gt-cursor").style.left = (((-6 + u * 76) + 8) / 80 * 100) + "%";
        el.classList.toggle("llega", u >= 1);
      };
    },
    aa(el) {
      const btn = h("span", { class: "ga-btn" }, "A", h("small", { text: "a" }));
      const tx = h("p", { class: "ga-tx", text: "En el principio estaba el discurso" });
      el.append(h("div", { class: "ga" }, btn, tx));
      const estados = [["", "Normal"], ["grande", "Letra grande"], ["dislexia", "Para dislexia"], ["claro", "Tema claro"]];
      return (t) => {
        const k = t >= 99 ? 0 : Math.floor(t / 2) % estados.length;
        el.dataset.e = estados[k][0];
        btn.classList.toggle("on", t < 99 && t % 2 < 0.4);
      };
    },
  };
  function abrirGuia(inicio) {
    let k = Math.max(0, Math.min(PASOS_GUIA.length - 1, inicio || 0)), t0 = performance.now(), pausa = quieto(), voz = !!store.get("guiaVoz", false), raf = 0, tick = null, transcurrido = 0;
    const escena = h("div", { class: "g-escena", "aria-hidden": "true" });
    const tit = h("h3", { class: "g-tit" }), desc = h("p", { class: "g-desc" }), num = h("span", { class: "g-num" });
    const barra = h("div", { class: "g-prog" }, h("i"));
    const puntos = h("div", { class: "g-puntos", role: "tablist", "aria-label": "Pasos de la guía" }, PASOS_GUIA.map((p, i) => h("button", { type: "button", role: "tab", "aria-label": "Paso " + (i + 1) + ": " + p.t, onclick: () => ir(i) })));
    const btnPausa = h("button", { class: "btn-icono", type: "button" });
    const btnVoz = h("button", { class: "btn chico", type: "button" });
    const btnIr = h("button", { class: "btn chico oro", type: "button" });
    const hablar = () => {
      try {
        if (!voz || !window.speechSynthesis) return;
        speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(PASOS_GUIA[k].t + ". " + PASOS_GUIA[k].d);
        u.lang = "es-ES";
        const vs = speechSynthesis.getVoices().filter((x) => /^es/i.test(x.lang));
        if (vs.length) u.voice = vs.find((x) => /es-(419|MX|CO|US)/i.test(x.lang)) || vs[0];
        u.rate = 0.95;
        speechSynthesis.speak(u);
      } catch (e) { /* sin voz */ }
    };
    const pintarBotones = () => {
      btnPausa.replaceChildren(svg(pausa ? ICO.play : ICO.pausa)); btnPausa.setAttribute("aria-label", pausa ? "Seguir" : "Pausar"); btnPausa.title = pausa ? "Seguir" : "Pausar";
      btnVoz.replaceChildren(svg(ICO.voz), voz ? "Voz: activada" : "Escuchar en voz alta"); btnVoz.setAttribute("aria-pressed", String(voz));
    };
    function ir(i) {
      k = (i + PASOS_GUIA.length) % PASOS_GUIA.length;
      const p = PASOS_GUIA[k];
      tit.textContent = p.t; desc.textContent = p.d; num.textContent = "Paso " + (k + 1) + " de " + PASOS_GUIA.length;
      [...puntos.children].forEach((b, j) => b.setAttribute("aria-selected", String(j === k)));
      escena.replaceChildren(); escena.className = "g-escena g-" + p.e;
      tick = ESCENAS[p.e] ? ESCENAS[p.e](escena) : null;
      btnIr.replaceChildren(svg(ICO.seguir), p.ir[0]);
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
      if (!modal.open) { cancelAnimationFrame(raf); try { speechSynthesis.cancel(); } catch (e) { /* nada */ } return; }
      if (!caja.isConnected) { t0 = ahora - transcurrido * 1000; return; } // otra vista encima (p. ej., las opciones): en pausa
      if (pausa) { t0 = ahora - transcurrido * 1000; return; }
      transcurrido = Math.max(0, (ahora - t0) / 1000);
      if (tick && !quieto()) tick(transcurrido);
      barra.firstChild.style.width = Math.min(100, transcurrido / DUR_PASO * 100) + "%";
      if (transcurrido >= DUR_PASO) { if (k < PASOS_GUIA.length - 1) ir(k + 1); else { pausa = true; pintarBotones(); } }
    };
    btnPausa.onclick = () => { pausa = !pausa; pintarBotones(); };
    btnVoz.onclick = () => { voz = !voz; store.set("guiaVoz", voz); pintarBotones(); if (voz) hablar(); else { try { speechSynthesis.cancel(); } catch (e) { /* nada */ } } };
    const caja = h("div", { class: "guia", tabindex: "-1" },
      h("div", { class: "g-marco" }, escena),
      h("div", { class: "g-texto", "aria-live": "polite" }, num, tit, desc),
      barra, puntos,
      h("div", { class: "g-ctl" },
        h("button", { class: "btn-icono", type: "button", "aria-label": "Paso anterior", title: "Anterior", onclick: () => ir(k - 1) }, svg(ICO.izq)),
        btnPausa,
        h("button", { class: "btn-icono", type: "button", "aria-label": "Paso siguiente", title: "Siguiente", onclick: () => ir(k + 1) }, svg(ICO.der)),
        btnVoz, btnIr));
    caja.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") { e.preventDefault(); ir(k + 1); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); ir(k - 1); }
      else if (e.key === " " && e.target === caja) { e.preventDefault(); pausa = !pausa; pintarBotones(); }
    });
    abrirModal(() => cajaModal(cabModal("Guía del lector", "Cómo usar el lector y analizador"), caja), () => { cancelAnimationFrame(raf); try { speechSynthesis.cancel(); } catch (e) { /* nada */ } });
    pintarBotones(); ir(k);
    raf = requestAnimationFrame(bucle);
    setTimeout(() => { try { caja.focus({ preventScroll: true }); } catch (e) { /* nada */ } }, 60);
  }

  function noEncontrado() { vista().replaceChildren(h("p", { class: "vacio" }, "Esa dirección no existe. ", h("a", { href: "#/", text: "Volver al inicio" }))); }

  // ------------------------------------------------------------------ rutas
  // rutaVista: la última dirección pintada como página (las ventanas de búsqueda y de guía se abren encima de ella)
  let rutaVista = null;
  function enrutar() {
    if (!D) return;
    M.alCerrar = null;
    if (modal.open) { M.porRuta = true; cerrarModal(); }
    mostrarRuta();
  }
  function refrescarVista() {
    if (!rutaVista) return;
    const y = window.scrollY;
    esc.libro = null;
    mostrarRuta(rutaVista);
    requestAnimationFrame(() => window.scrollTo(0, y));
  }
  // Abre una ventana (búsqueda, guía) sobre la página actual; si se entró directamente por su dirección, sobre el inicio
  function sobrePagina(abrir) {
    if (!rutaVista) { esc.libro = null; portada(false); rutaVista = "#/"; }
    ponerHash(rutaVista);
    setTimeout(abrir, 0);
  }
  function mostrarRuta(hh) {
    const partes = decodeURIComponent((hh || location.hash).replace(/^#\/?/, "")).split("/").filter((x) => x !== "");
    const ruta = "#/" + partes.join("/");
    if (partes[0] === "buscar" && partes.length > 1) return sobrePagina(() => abrirBusqueda(partes.slice(1).join("/")));
    if (partes[0] === "guia") return sobrePagina(() => abrirGuia(+partes[1] || 0));
    rutaVista = ruta;
    if (volverBusqueda && ruta.split("/").slice(0, 3).join("/") !== volverBusqueda.ruta.split("/").slice(0, 3).join("/")) volverBusqueda = null;
    if (!partes.length) { esc.libro = null; return portada(false); }
    if (partes[0] === "libros") { esc.libro = null; return portada(true); }
    if (partes[0] === "lema") { esc.libro = null; return vistaLema(+partes[1]); }
    if (partes[0] === "buscar") { esc.libro = null; return vistaBuscar(""); }
    if (partes[0] === "cronologia") { esc.libro = null; return vistaCronologia(partes[1] || ""); }
    if (partes[0] === "niveles") { esc.libro = null; return vistaNiveles(partes[1] || "", partes[2] || ""); }
    const c = partes[0].toUpperCase();
    const cap = +partes[1] || 1;
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
    window.addEventListener("hashchange", () => { pasosApp++; enrutar(); });
    enrutar();
  }).catch(() => vista().replaceChildren(fallo("No se pudo cargar el avance.")));
})();
