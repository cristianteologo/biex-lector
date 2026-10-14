/* BiEx · Lector y Analizador de la Nueva Voluntad. Sin dependencias. */
(function () {
  "use strict";
  const BASE = window.BIEX_BASE || "";
  const $ = (s, el) => (el || document).querySelector(s);
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
  const ICO = {
    buscar: '<circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2"/><path d="M20 20l-3.5-3.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    tema: '<path d="M12 3a9 9 0 1 0 9 9 7 7 0 0 1-9-9z" fill="currentColor"/>',
    izq: '<path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    der: '<path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    cerrar: '<path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  };
  const fmt = (n) => Number(n).toLocaleString("es");
  const pct = (x) => (x >= 10 ? x.toFixed(1) : x.toFixed(2)).replace(".", ",") + " %";
  const store = {
    get(k, d) { try { const v = localStorage.getItem("biex:" + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem("biex:" + k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento */ } },
  };
  const sinMarcas = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ͂̓᷀ͅ-᷿]/g, "").normalize("NFC");
  const claveGr = (s) => sinMarcas(s).toLowerCase().replace(/ς/g, "σ").replace(/[’'ʼ]/g, "");
  const claveEs = (s) => sinMarcas(s).toLowerCase();
  const punt = (p) => String(p || "").replace(/¶/g, "");
  const uncial = (s) => sinMarcas(s).toUpperCase().replace(/[’'ʼ]/g, "’");

  // ------------------------------------------------------------------ datos
  const cache = {};
  const cargar = (ruta) => (cache[ruta] = cache[ruta] || fetch(BASE + ruta).then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); }).catch((e) => { delete cache[ruta]; throw e; }));
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
  function abreviar(m, clase, vz) {
    if (!m || !m.code) return "";
    const cng = [ABC[m.case], m.number === "P" ? "pl." : m.number === "S" ? "sg." : "", ABG[m.gender]].filter(Boolean).join(" ");
    if (m.pos === "V") {
      const parts = [AB[m.tense], ABM[m.mood], ABV[vz] || ""];
      if (m.person) parts.push(m.person + "." + (m.number === "P" ? "ª pl." : "ª sg."));
      if (m.case) parts.push(cng);
      return "v. " + parts.filter(Boolean).join(" ");
    }
    const nom = { N: "sust.", A: "adj.", T: "art.", PR: "pron.", PREP: "prep.", CONJ: "conj.", PRT: "part.", ADV: "adv.", INJ: "interj.", HEB: "heb./aram.", X: "" }[clase] || "";
    return [nom, cng].filter(Boolean).join(" ");
  }

  // ------------------------------------------------------------------ texto base: ⟪…⟫ es griego aún sin traducción fijada
  const escHtml = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  // Cursivas y negritas del borrador (Markdown); los asteriscos sueltos del texto se conservan tal cual
  const marcado = (t) => escHtml(t)
    .replace(/\*\*(?=\S)([^*]+?)(?<=\S)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[\s«“‘(\[])\*(?=[^\s*])([^*]+?)(?<=[^\s*])\*(?=$|[\s»”’).,;:!?\]])/g, "$1<em>$2</em>");
  function textoLectura(t, esBase) {
    const frag = document.createDocumentFragment();
    if (!esBase) { const s = document.createElement("span"); s.innerHTML = marcado(t); frag.append(...s.childNodes); return frag; }
    const re = /⟪([^⟫]+)⟫/g;
    let i = 0, mm;
    while ((mm = re.exec(t))) {
      if (mm.index > i) frag.append(t.slice(i, mm.index));
      frag.append(h("span", { class: "gr", lang: "grc", text: mm[1] }));
      i = re.lastIndex;
    }
    if (i < t.length) frag.append(t.slice(i));
    return frag;
  }
  const nombreLibro = (b) => (b.t ? b.t + " [" + b.n + "]" : b.n);
  const libroDe = (c) => D.libros.find((b) => b.c === c);
  const estadoEt = (n) => (D.escala[n] || {}).etiqueta || n;

  // ------------------------------------------------------------------ marco
  const raiz = $("#app");
  function marco() {
    const q = h("input", { type: "search", placeholder: "Busca una palabra griega, un término en español o una cita (Jn 1:1)", "aria-label": "Buscar", enterkeyhint: "search" });
    q.addEventListener("keydown", (e) => { if (e.key === "Enter" && q.value.trim()) { location.hash = "#/buscar/" + encodeURIComponent(q.value.trim()); q.blur(); } });
    const tema = h("button", { class: "btn-icono", type: "button", "aria-label": "Cambiar entre tema claro y oscuro", title: "Tema claro u oscuro", onclick: () => {
      const actual = document.documentElement.getAttribute("data-theme") || (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
      const nuevo = actual === "light" ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", nuevo); store.set("tema", nuevo);
    } }, svg(ICO.tema));
    const b = h("label", { class: "buscador" }, h("span", { class: "sr", text: "Buscar" }), svg(ICO.buscar), q);
    raiz.replaceChildren(
      h("header", { class: "barra-sup" }, h("div", { class: "in" }, h("a", { class: "marca", href: "#/" }, h("b", { text: "BiEx" }), h("span", { text: "Biblia Exacta · Lector y analizador" })), b, tema)),
      h("main", { class: "pagina", id: "vista", tabindex: "-1" }),
      h("footer", { class: "pie ui" },
        h("p", { text: "Ningún verso se da por terminado: la traducción sigue abierta a ajustes. Los versos sin traducción completa se leen como texto base, palabra por palabra; lo que aún no tiene traducción fijada se muestra en griego." }),
        h("p", {}, "Texto griego y datos morfológicos: ", h("a", { href: "https://github.com/STEPBible/STEPBible-Data", target: "_blank", rel: "noopener", text: "TAGNT de STEPBible.org" }), " (Tyndale House, Cambridge), ",
          h("a", { href: "https://github.com/Clear-Bible/macula-greek", target: "_blank", rel: "noopener", text: "MACULA Greek Linguistic Datasets" }), " (Biblica) y ",
          h("a", { href: "https://github.com/LogosBible/SBLGNT", target: "_blank", rel: "noopener", text: "SBLGNT" }), " (Society of Biblical Literature y Logos Bible Software), con licencia CC BY 4.0."),
        h("p", {}, "Traducción, transliteración y análisis: BiEx – Biblia Exacta ©™. ", h("a", { href: "https://bibliaexacta.wixsite.com/biex", target: "_blank", rel: "noopener", text: "Sitio oficial" }), h("span", { id: "actualizado" }))));
    const tg = store.get("tema", null);
    if (tg === "light" || tg === "dark") document.documentElement.setAttribute("data-theme", tg);
  }
  const vista = () => $("#vista");
  const cargando = (txt) => h("p", { class: "cargando", text: txt || "Cargando…" });
  const fallo = (txt) => h("p", { class: "error", text: txt + " Revisa tu conexión y recarga la página." });

  // ------------------------------------------------------------------ portada
  function portada() {
    document.title = "BiEx · Lector y analizador de la Nueva Voluntad";
    const P = D.portada;
    const lamina = h("div", { class: "lamina", "aria-live": "polite" });
    const botones = P.p.map((w, i) => h("button", { type: "button", "aria-pressed": "false", style: "--i:" + i, onclick: () => elegir(i) },
      h("span", { class: "u", lang: "grc", text: uncial(w.g) }), h("span", { class: "t", text: w.tr || "—" })));
    function elegir(i) {
      botones.forEach((b, k) => b.setAttribute("aria-pressed", k === i ? "true" : "false"));
      const w = P.p[i];
      lamina.replaceChildren(
        h("div", { class: "g" }, h("span", { lang: "grc", text: w.g }), h("small", { text: w.tl })),
        h("div", { class: "tr", text: w.tr || "Aún sin traducción fijada" }),
        h("div", { class: "d", text: w.m + (w.r ? "; en la oración: " + w.r : "") }),
        h("div", { class: "d" }, "Lema ", h("span", { lang: "grc", text: w.l }), ", " + fmt(w.ln) + " veces en la Nueva Voluntad. ", h("a", { href: "#/lema/" + w.li, text: "Ver todas" })));
    }
    const libro = libroDe("JHN");
    const L = D.libros;
    const anchoMax = Math.max(...L.map((b) => b.nPal || b.total));
    const lomo = (b) => {
      const w = Math.round(20 + 30 * Math.sqrt((b.nPal || b.total) / anchoMax));
      const lleno = Math.max(0, Math.min(100, b.palabras));
      const pleno = 100 * (b.total - b.conteo.base) / Math.max(1, b.total);
      return h("a", { class: "lomo", href: "#/" + b.c + "/1", style: "width:" + w + "px", title: nombreLibro(b) + ": " + pct(b.palabras) + " de las palabras con traducción fijada", "aria-label": nombreLibro(b) + ", " + pct(b.palabras) + " de las palabras con traducción fijada" },
        h("span", { class: "oro", style: "height:" + lleno.toFixed(1) + "%" }), pleno > 0 ? h("span", { class: "pleno", style: "height:" + pleno.toFixed(1) + "%" }) : null,
        h("span", { class: "nom", text: b.t || b.n }));
    };
    const grupos = [["Evangelios y Hechos", ["MAT", "MRK", "LUK", "JHN", "ACT"]], ["Cartas", L.map((b) => b.c).filter((c) => !["MAT", "MRK", "LUK", "JHN", "ACT", "REV"].includes(c))], ["Revelación", ["REV"]]];
    vista().replaceChildren(
      h("section", { class: "portada" },
        h("div", { class: "codice" },
          h("div", { class: "ref", text: (libro ? libro.t + " 1:1" : "Juan 1:1") + " · toca una palabra para analizarla" }),
          h("div", { class: "uncial" }, botones), lamina),
        h("div", { class: "tesis" },
          h("div", {}, h("h1", { text: "La Nueva Voluntad, del griego al español, palabra por palabra." }),
            h("p", { text: "Cada verso se lee en su estado actual de traducción, y cada palabra se abre para ver su forma, su lema, su análisis morfológico y todas las veces que aparece." })),
          h("div", { class: "cifras" },
            h("div", {}, h("b", { text: pct(D.palabras) }), h("span", { text: "de las palabras ya tienen traducción fijada" })),
            h("div", {}, h("b", { text: fmt(D.palabrasTotal) }), h("span", { text: "palabras griegas analizadas" })),
            h("div", {}, h("b", { text: fmt(D.lemas) }), h("span", { text: "lemas distintos" })),
            h("div", {}, h("b", { text: fmt(D.legibles) }), h("span", { text: "versos que ya se pueden leer" }))))),
      h("section", {},
        h("div", { class: "estante-t" }, h("h2", { text: "Los 27 libros" }), h("p", { text: "El ancho de cada lomo es el tamaño del libro; el dorado sube con las palabras ya traducidas y brilla donde hay versos con traducción completa." })),
        h("div", { class: "repisa" }, grupos.map(([t, cs]) => h("div", { class: "grupo" }, h("span", { text: t }), h("div", { class: "lomos" }, cs.map((c) => lomo(libroDe(c))))))),
        h("div", { class: "leyenda" }, ["exacto", "casi", "revision", "borrador", "base"].map((k) => h("span", {}, h("i", { class: "n-" + k }), estadoEt(k))))));
    elegir(Math.max(0, P.p.findIndex((w) => claveGr(w.g) === "λογοσ")));
  }

  // ------------------------------------------------------------------ libro
  let prefs = Object.assign({ tl: true, tr: true, mo: true, color: "clase", resalta: "" }, store.get("prefs", {}));
  const guardarPrefs = () => store.set("prefs", prefs);
  const esc = { libro: null, cap: 0, modo: "", sel: null };

  async function vistaLibro(c, cap, modo, v, i) {
    const b = libroDe(c);
    if (!b) return noEncontrado();
    cap = Math.max(1, Math.min(b.caps.length, cap || 1));
    document.title = nombreLibro(b) + " " + cap + " · BiEx";
    const mismo = esc.libro === c && esc.cap === cap && esc.modo === modo && $(".libro", vista());
    esc.libro = c; esc.cap = cap; esc.modo = modo;
    if (mismo) { enfocar(v, i); return; }
    vista().replaceChildren(h("div", { class: "libro" }, riel(b, cap, null), h("section", { class: "hoja" }, cabHoja(b, cap, modo), cargando())));
    let Lc, A = null;
    try {
      Lc = await lectura(c);
      if (modo === "a") [A] = await Promise.all([analisis(c), tablas()]);
    } catch (e) { vista().replaceChildren(fallo("No se pudo cargar " + nombreLibro(b) + ".")); return; }
    if (esc.libro !== c || esc.cap !== cap || esc.modo !== modo) return;
    const versos = Lc.caps[cap] || [];
    const C = b.caps[cap - 1];
    const hoja = h("section", { class: "hoja" }, cabHoja(b, cap, modo));
    hoja.append(...(modo === "a" ? cuerpoAnalisis(b, cap, A.caps[cap] || [], versos) : cuerpoLectura(b, cap, versos, C)).filter(Boolean));
    vista().replaceChildren(h("div", { class: "libro" }, riel(b, cap, versos), hoja));
    enfocar(v, i);
  }

  function riel(b, cap, versos) {
    const r = 36, cir = 2 * Math.PI * r, p = Math.max(0, Math.min(100, b.palabras));
    const anillo = svg('<circle cx="42" cy="42" r="' + r + '" fill="none" stroke="var(--hoja-3)" stroke-width="7"/>' +
      '<circle cx="42" cy="42" r="' + r + '" fill="none" stroke="var(--oro)" stroke-width="7" stroke-linecap="round" stroke-dasharray="' + (cir * p / 100).toFixed(1) + " " + cir.toFixed(1) + '" transform="rotate(-90 42 42)"/>' +
      '<text x="42" y="47" text-anchor="middle" class="num">' + Math.round(p) + '%</text>', "0 0 84 84");
    const completos = b.total - b.conteo.base;
    const caps = h("div", { class: "caps", role: "group", "aria-label": "Capítulos" }, b.caps.map((C) => h("a", {
      class: "cap", href: "#/" + b.c + "/" + C.c + (esc.modo === "a" ? "/a" : ""), "aria-current": C.c === cap ? "true" : "false", title: "Capítulo " + C.c + ": " + pct(C.pct) + " de avance",
      style: "text-align:center;text-decoration:none;color:inherit" }, String(C.c), h("i", { style: "width:" + Math.min(100, C.pct) + "%" }))));
    const mosaico = versos ? h("div", { class: "mosaico", role: "group", "aria-label": "Versos del capítulo por estado" }, versos.map((v) => h("button", {
      type: "button", class: "n-" + v.n, title: cap + ":" + v.v + " · " + estadoEt(v.n), "aria-label": "Verso " + v.v + ", " + estadoEt(v.n),
      onclick: () => irVerso(v.v) }))) : null;
    return h("aside", { class: "riel" },
      h("div", { class: "titulo-libro" }, h("h1", {}, b.t || b.n, h("span", { class: "es", text: b.t ? "[" + b.n + "]" : "" }))),
      h("div", { class: "anillo" }, anillo, h("p", {}, h("b", { text: pct(b.palabras) }), " de las palabras con traducción fijada. ", h("b", { text: fmt(completos) }), " de " + fmt(b.total) + " versos con traducción completa.")),
      h("div", { class: "cifras-libro" }, h("div", {}, h("b", { text: fmt(b.nPal || 0) }), "palabras griegas"), h("div", {}, h("b", { text: fmt(b.nLem || 0) }), "lemas distintos")),
      h("div", {}, h("p", { class: "rotulo", text: "Capítulos" }), caps),
      mosaico ? h("div", {}, h("p", { class: "rotulo", text: "Versos del capítulo " + cap }), mosaico) : null);
  }
  function irVerso(v) {
    if (esc.modo === "a") location.hash = "#/" + esc.libro + "/" + esc.cap + "/a/" + v;
    else location.hash = "#/" + esc.libro + "/" + esc.cap + "/l/" + v;
  }
  function cabHoja(b, cap, modo) {
    const ir = (m) => "#/" + b.c + "/" + cap + (m === "a" ? "/a" : "");
    const btn = (m, t) => h("button", { type: "button", "aria-pressed": (modo === "a") === (m === "a") ? "true" : "false", onclick: () => { location.hash = ir(m); } }, t);
    const prev = cap > 1 ? "#/" + b.c + "/" + (cap - 1) + (modo === "a" ? "/a" : "") : null;
    const next = cap < b.caps.length ? "#/" + b.c + "/" + (cap + 1) + (modo === "a" ? "/a" : "") : null;
    return h("div", { class: "hoja-cab" },
      h("div", { class: "modos", role: "group", "aria-label": "Modo" }, btn("l", "Lectura"), btn("a", "Análisis")),
      h("div", { class: "navcap" },
        h("button", { type: "button", "aria-label": "Capítulo anterior", disabled: !prev, onclick: () => prev && (location.hash = prev) }, svg(ICO.izq)),
        h("span", { text: "Capítulo " + cap + " de " + b.caps.length }),
        h("button", { type: "button", "aria-label": "Capítulo siguiente", disabled: !next, onclick: () => next && (location.hash = next) }, svg(ICO.der))));
  }
  function encabezado(b, cap) {
    const C = b.caps[cap - 1];
    const partes = String(C.h || "").split(" [");
    return h("div", { class: "encab" }, h("div", { class: "h" }, h("span", { lang: "he", text: partes[0] }), partes[1] ? " [" + partes[1] : ""), h("div", { class: "s", text: "Capítulo " + cap + ": " + pct(C.pct) + " de avance" }));
  }

  function cuerpoLectura(b, cap, versos) {
    const hayBase = versos.some((v) => v.g);
    const nota = hayBase ? h("p", { class: "nota-base" }, "En el texto base, las palabras en ", h("span", { class: "gr", lang: "grc", text: "dorado" }), " son griego que aún no tiene traducción fijada. Abre el análisis para ver cada palabra en detalle.") : null;
    const lista = h("ol", { class: "versos" }, versos.map((v) => h("li", { class: "verso" + (v.g ? " base" : ""), id: "v" + v.v },
      h("button", { class: "n", type: "button", title: "Analizar el verso " + v.v, "aria-label": "Analizar el verso " + v.v, onclick: () => { location.hash = "#/" + b.c + "/" + cap + "/a/" + v.v; } }, (v.p ? "§ " : "") + v.v),
      h("span", { class: "tx" }, textoLectura(v.t, !!v.g)),
      h("span", { class: "est" }, h("i", { class: "n-" + v.n }), v.n === "base" ? estadoEt("base") + ": " + v.k + " % de las palabras ya traducidas" : estadoEt(v.n)))));
    return [encabezado(b, cap), nota, lista];
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
  function cuerpoAnalisis(b, cap, versosA, versosL) {
    const porV = new Map(versosL.map((v) => [v.v, v]));
    const lentes = h("div", { class: "lentes" },
      ...[["tl", "Transliteración"], ["tr", "Traducción"], ["mo", "Morfología"]].map(([k, t]) => h("label", {}, h("input", { type: "checkbox", checked: prefs[k] ? true : null, onchange: (e) => { prefs[k] = e.target.checked; guardarPrefs(); aplicarFilas(); } }), t)),
      h("label", {}, "Colorear por ", h("select", { onchange: (e) => { prefs.color = e.target.value; guardarPrefs(); pintar(); } },
        [["clase", "categoría"], ["caso", "caso"], ["tiempo", "tiempo verbal"], ["ninguno", "nada"]].map(([v, t]) => h("option", { value: v, selected: prefs.color === v ? true : null, text: t })))),
      h("label", {}, "Resaltar ", h("select", { onchange: (e) => { prefs.resalta = e.target.value; guardarPrefs(); pintar(); } },
        Object.entries(RESALTA).map(([v, [t]]) => h("option", { value: v, selected: prefs.resalta === v ? true : null, text: t })))));
    const claves = h("div", { class: "claves", "aria-hidden": "true" });
    const cont = h("div", { class: "analisis" });
    const lista = [];
    for (const [v, toks] of versosA) {
      const L = porV.get(v);
      const fila = h("div", { class: "palabras" }, toks.map((t, i) => {
        const m = T.P[t[2]], cl = T.MC[t[2]];
        const tr = T.TR[t[3] || 0];
        const btn = h("button", { type: "button", class: "pal" + (t[6] ? " var" : ""), "aria-pressed": "false", "data-v": v, "data-i": i,
          "aria-label": T.F[t[0]] + ", " + (tr || "sin traducción fijada") + ", " + (T.MD[t[2]] || ""),
          onclick: () => seleccionar(v, i, true) },
          h("span", { class: "g", lang: "grc" }, T.F[t[0]], punt(t[4]) ? h("sup", { text: punt(t[4]) }) : null),
          h("span", { class: "tl", text: T.FT[t[0]] }),
          h("span", { class: "tr" + (tr ? "" : " sin"), text: tr || "·" }),
          h("span", { class: "mo", text: abreviar(m, cl, t[8]) }));
        btn._t = t; btn._m = m; btn._cl = cl;
        lista.push(btn);
        return btn;
      }));
      cont.append(h("div", { class: "av", id: "v" + v },
        h("div", { class: "av-cab" }, h("b", { text: v }), L ? h("p", {}, textoLectura(L.t, !!L.g)) : null), fila));
    }
    const ficha = h("aside", { class: "ficha", id: "ficha", hidden: true, "aria-label": "Análisis de la palabra" });
    const cuerpo = h("div", { class: "cuerpo-analisis" }, cont, ficha);
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
    esc.lista = lista; esc.ficha = ficha; esc.cuerpo = cuerpo; esc.sel = null;
    return [lentes, claves, encabezado(b, cap), cuerpo];
  }

  function seleccionar(v, i, desdeClic) {
    const lista = esc.lista || [];
    const btn = lista.find((x) => +x.dataset.v === v && +x.dataset.i === i);
    if (!btn) return;
    for (const x of lista) if (x.getAttribute("aria-pressed") === "true") x.setAttribute("aria-pressed", "false");
    btn.setAttribute("aria-pressed", "true");
    esc.sel = { v, i };
    try { history.replaceState(null, "", "#/" + esc.libro + "/" + esc.cap + "/a/" + v + "/" + i); } catch (e) { /* ignorar */ }
    mostrarFicha(btn._t, v);
    if (window.innerWidth < 1180) {
      // en pantallas angostas la ficha cubre la parte baja: la palabra queda visible arriba
      requestAnimationFrame(() => {
        const r = btn.getBoundingClientRect(), tope = window.innerHeight - esc.ficha.offsetHeight;
        if (r.bottom > tope - 8 || r.top < 185) window.scrollBy({ top: r.top - 195 });
      });
    } else if (!desdeClic) btn.scrollIntoView({ block: "center" });
  }
  function cerrarFicha() {
    if (!esc.ficha) return;
    esc.ficha.hidden = true; esc.cuerpo.classList.remove("con-ficha");
    for (const x of esc.lista || []) x.setAttribute("aria-pressed", "false");
    esc.sel = null;
  }
  function mostrarFicha(t, v) {
    const F = esc.ficha;
    const m = T.P[t[2]], li = t[1], tr = T.TR[t[3] || 0];
    const filas = [];
    const fila = (a, b) => b && filas.push(h("dt", { text: a }), h("dd", { text: b }));
    fila("Categoría", CLASE[T.MC[t[2]]] || "");
    if (m.pos === "V") { fila("Tiempo", (TIEMPO[m.tense] || "") + (m.second ? " (segundo)" : "")); fila("Voz", T.voz[t[8] || 0]); fila("Modo", MODO[m.mood]); }
    if (t[7]) fila("Aoristo", T.aoristo[t[7]]);
    if (m.person) fila("Persona", m.person + ".ª");
    fila("Caso", CASO[m.case]); fila("Número", NUM[m.number]); fila("Género", GEN[m.gender]);
    fila("En la oración", T.R[t[5] || 0]);
    fila("Código", m.code);
    const falta = t[6] || 0;
    const sin = T.ediciones.filter((_, k) => falta & (1 << k));
    const par = T.LP[li] || [];
    const tabla = h("table", { class: "paradigma" }, h("tbody", {}, par.slice(0, 14).map((r) => h("tr", { class: r[0] === t[0] && r[1] === t[2] ? "esta" : "" },
      h("td", { lang: "grc", text: T.F[r[0]] }), h("td", { class: "m", text: abreviar(T.P[r[1]], T.MC[r[1]], 0) || T.MD[r[1]] }), h("td", { text: r[3] ? T.TR[r[3]] : "" }), h("td", { class: "n", text: fmt(r[2]) })))));
    const lb = T.LB[li] || [];
    const pares = []; for (let k = 0; k < lb.length; k += 2) pares.push([lb[k], lb[k + 1]]);
    pares.sort((a, b) => b[1] - a[1]);
    const max = Math.max(1, ...pares.map((p) => p[1]));
    F.replaceChildren(
      h("button", { class: "btn-icono cerrar", type: "button", "aria-label": "Cerrar el análisis", onclick: cerrarFicha }, svg(ICO.cerrar)),
      h("div", {}, h("h3", { lang: "grc", text: T.F[t[0]] }), h("div", { class: "tlit", text: T.FT[t[0]] })),
      h("div", { class: "trad" + (tr ? "" : " sin"), text: tr || "Aún sin traducción fijada" }),
      h("dl", {}, filas),
      h("section", {}, h("h4", { text: "Lema" }),
        h("div", { class: "lema-l" }, h("span", { lang: "grc", text: T.L[li] }), h("small", { text: T.LT[li] })),
        h("div", { class: "ui", style: "font-size:.88rem;color:var(--tenue)", text: fmt(T.LN[li]) + " veces en la Nueva Voluntad; esta forma, " + fmt(T.FN[t[0]]) + "." }),
        h("a", { class: "btn oro", href: "#/lema/" + li, text: "Ver todas las apariciones" })),
      h("section", {}, h("h4", { text: "Formas del lema" + (par.length > 14 ? " (las 14 más frecuentes de " + par.length + ")" : "") }), tabla),
      pares.length > 1 ? h("section", {}, h("h4", { text: "Dónde aparece" }), h("div", { class: "barras" }, pares.slice(0, 10).map(([bi, n]) => {
        const b = D.libros[bi];
        return h("div", {}, h("span", { text: b.t || b.n, title: nombreLibro(b) }), h("i", { style: "width:" + (100 * n / max).toFixed(1) + "%" }), h("em", { text: fmt(n) }));
      }))) : null,
      h("section", {}, h("h4", { text: "Ediciones" }), h("div", { class: "ui", style: "font-size:.88rem", text: sin.length ? "No figura en: " + sin.join(", ") + "." : "Presente en las ocho ediciones cotejadas." })));
    F.hidden = false; esc.cuerpo.classList.add("con-ficha");
  }
  function enfocar(v, i) {
    if (v == null) { window.scrollTo(0, 0); return; }
    const el = document.getElementById("v" + v);
    if (el) {
      el.scrollIntoView({ block: "start" });
      if (esc.modo !== "a") { document.querySelectorAll(".verso.marcado").forEach((x) => x.classList.remove("marcado")); el.classList.add("marcado"); }
    }
    if (esc.modo === "a" && i != null) seleccionar(v, i, false);
  }
  document.addEventListener("keydown", (e) => {
    if (e.target && /input|select|textarea/i.test(e.target.tagName)) return;
    if (e.key === "Escape") cerrarFicha();
    if (!esc.sel || !esc.lista || esc.modo !== "a" || !$(".ficha:not([hidden])")) return;
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const k = esc.lista.findIndex((x) => +x.dataset.v === esc.sel.v && +x.dataset.i === esc.sel.i);
    const n = esc.lista[k + (e.key === "ArrowRight" ? 1 : -1)];
    if (n) { e.preventDefault(); seleccionar(+n.dataset.v, +n.dataset.i, false); n.focus(); }
  });

  // ------------------------------------------------------------------ lema y concordancia
  async function vistaLema(li) {
    vista().replaceChildren(cargando("Cargando el lema…"));
    try { await tablas(); } catch (e) { vista().replaceChildren(fallo("No se pudieron cargar los datos.")); return; }
    if (!(li >= 0 && li < T.L.length)) return noEncontrado();
    document.title = T.L[li] + " · BiEx";
    const par = T.LP[li] || [];
    const lb = T.LB[li] || [];
    const pares = []; for (let k = 0; k < lb.length; k += 2) pares.push([lb[k], lb[k + 1]]);
    const max = Math.max(1, ...pares.map((p) => p[1]));
    const citas = h("ol", { class: "citas" });
    const barra = h("div", { class: "progreso", "aria-hidden": "true" }, h("i"));
    const estado = h("p", { class: "ui", style: "margin:0;color:var(--tenue);font-size:.88rem", text: "Reuniendo las apariciones…" });
    const mas = h("button", { class: "btn", type: "button", hidden: true, text: "Mostrar más" });
    vista().replaceChildren(h("section", { class: "panel" },
      h("h1", {}, h("span", { lang: "grc", text: T.L[li] }), h("small", { text: T.LT[li] })),
      h("p", { class: "ui", style: "margin:0;color:var(--tenue)", text: fmt(T.LN[li]) + " apariciones en " + pares.length + (pares.length === 1 ? " libro" : " libros") + ", en " + par.length + (par.length === 1 ? " forma" : " formas") + " distintas." }),
      h("div", { class: "columnas" },
        h("div", { class: "tarjeta" }, h("h2", { text: "Formas" }), h("table", { class: "paradigma" }, h("tbody", {}, par.map((r) => h("tr", {},
          h("td", { lang: "grc", text: T.F[r[0]] }), h("td", { class: "m", text: T.MD[r[1]] }), h("td", { text: r[3] ? T.TR[r[3]] : "" }), h("td", { class: "n", text: fmt(r[2]) })))))),
        h("div", { class: "tarjeta" }, h("h2", { text: "Por libro" }), h("div", { class: "barras" }, pares.map(([bi, n]) => {
          const b = D.libros[bi];
          return h("div", {}, h("a", { href: "#/" + b.c + "/1/a", text: b.t || b.n, title: nombreLibro(b), style: "overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-decoration:none;color:inherit" }), h("i", { style: "width:" + (100 * n / max).toFixed(1) + "%" }), h("em", { text: fmt(n) }));
        })))),
      h("div", { class: "tarjeta" }, h("h2", { text: "Apariciones" }), barra, estado, citas, mas)));
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
    const ref = (x.b.t || x.b.n) + " " + x.cap + ":" + x.v;
    const g = h("div", { class: "gtx", lang: "grc" });
    x.toks.forEach((t, i) => { if (i) g.append(" "); g.append(i === x.i ? h("mark", { text: T.F[t[0]] }) : T.F[t[0]], punt(t[4])); });
    const tr = T.TR[x.toks[x.i][3] || 0];
    return h("li", {}, h("a", { class: "ref", href: "#/" + x.b.c + "/" + x.cap + "/a/" + x.v + "/" + x.i, text: ref + " · " + T.MD[x.toks[x.i][2]] }), g,
      x.L ? h("div", { class: "stx" }, textoLectura(x.L.t, !!x.L.g)) : (tr ? h("div", { class: "stx", text: tr }) : null));
  }

  // ------------------------------------------------------------------ búsqueda
  const ABREV = { MAT: ["mt", "mat", "mateo"], MRK: ["mc", "mr", "mar", "marcos"], LUK: ["lc", "lu", "luc", "lucas"], JHN: ["jn", "juan"], ACT: ["hch", "hechos"], ROM: ["ro", "rom", "romanos"],
    "1CO": ["1co", "1 co", "1 cor", "1 corintios"], "2CO": ["2co", "2 co", "2 cor", "2 corintios"], GAL: ["ga", "gal", "galatas"], EPH: ["ef", "efe", "efesios"], PHP: ["flp", "fil", "filipenses"],
    COL: ["col", "colosenses"], "1TH": ["1ts", "1 ts", "1 tes", "1 tesalonicenses"], "2TH": ["2ts", "2 ts", "2 tes", "2 tesalonicenses"], "1TI": ["1ti", "1 ti", "1 tim", "1 timoteo"], "2TI": ["2ti", "2 ti", "2 tim", "2 timoteo"],
    TIT: ["tit", "tito"], PHM: ["flm", "filem", "filemon"], HEB: ["heb", "hebreos"], JAS: ["stg", "sant", "santiago"], "1PE": ["1p", "1 p", "1 pe", "1 pedro"], "2PE": ["2p", "2 p", "2 pe", "2 pedro"],
    "1JN": ["1jn", "1 jn", "1 juan"], "2JN": ["2jn", "2 jn", "2 juan"], "3JN": ["3jn", "3 jn", "3 juan"], JUD: ["jud", "judas"], REV: ["ap", "rev", "revelacion"] };
  function libroPorNombre(s) {
    const k = claveEs(s).replace(/\s+/g, " ").replace(/\.$/, "").trim();
    for (const b of D.libros) {
      const ns = [b.c.toLowerCase(), claveEs(b.n), claveEs(b.t || ""), ...(ABREV[b.c] || [])];
      if (ns.includes(k) || ns.includes(k.replace(/^([123])\s*/, "$1 ")) || ns.includes(k.replace(/\s+/g, ""))) return b;
    }
    return null;
  }
  async function vistaBuscar(q) {
    document.title = "Buscar · BiEx";
    const inp = $(".buscador input"); if (inp && q) inp.value = q;
    vista().replaceChildren(cargando("Buscando…"));
    try { await tablas(); } catch (e) { vista().replaceChildren(fallo("No se pudieron cargar los datos.")); return; }
    const bloques = [];
    const mref = q.match(/^\s*([1-3]?\s*[^\d:]+?)\.?\s*(\d+)(?:\s*[:.,]\s*(\d+))?\s*$/);
    if (mref) {
      const b = libroPorNombre(mref[1]);
      if (b) {
        const cap = Math.min(+mref[2], b.caps.length), v = mref[3] ? +mref[3] : null;
        bloques.push(h("div", { class: "tarjeta" }, h("h2", { text: "Cita" }), h("div", { class: "resultados" },
          h("a", { class: "res-lema", href: "#/" + b.c + "/" + cap + (v ? "/l/" + v : "") }, h("span", { class: "g", text: nombreLibro(b) + " " + cap + (v ? ":" + v : "") }), h("span", { class: "x", text: "Leer" })),
          h("a", { class: "res-lema", href: "#/" + b.c + "/" + cap + "/a" + (v ? "/" + v : "") }, h("span", { class: "g", text: nombreLibro(b) + " " + cap + (v ? ":" + v : "") }), h("span", { class: "x", text: "Analizar" })))));
      }
    }
    const gr = /[Ͱ-Ͽἀ-῿]/.test(q);
    const lemas = new Map();
    if (q.trim()) {
      if (gr) {
        const k = claveGr(q.trim());
        T.Lk.forEach((x, i) => { if (x === k) lemas.set(i, 1000); else if (x.startsWith(k)) lemas.set(i, Math.max(lemas.get(i) || 0, 10)); });
        T.Fk.forEach((x, fi) => { if (x === k || x.startsWith(k)) { const li = T.formaLema.get(fi); if (li != null) lemas.set(li, Math.max(lemas.get(li) || 0, x === k ? 500 : 5)); } });
      } else if (!mref || !bloques.length) {
        const k = claveEs(q.trim());
        const re = new RegExp("(^|[^a-zñ])" + k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "([^a-zñ]|$)");
        T.TRk.forEach((x, ti) => { if (ti && re.test(x)) for (const li of T.TL[ti] || []) lemas.set(li, Math.max(lemas.get(li) || 0, 1)); });
      }
    }
    const orden = [...lemas.entries()].sort((a, b) => b[1] - a[1] || T.LN[b[0]] - T.LN[a[0]]).slice(0, 60);
    if (orden.length) bloques.push(h("div", { class: "tarjeta" }, h("h2", { text: gr ? "Lemas griegos" : "Palabras griegas con esa traducción" }), h("div", { class: "resultados" }, orden.map(([li]) => {
      const tra = (T.LP[li] || []).map((r) => r[3]).filter(Boolean);
      return h("a", { class: "res-lema", href: "#/lema/" + li }, h("span", { class: "g" }, h("span", { lang: "grc", text: T.L[li] }), h("small", { text: T.LT[li] })),
        h("span", { class: "x" }, fmt(T.LN[li]) + " veces", tra.length ? h("br") : null, tra.length ? T.TR[tra[0]] : null));
    }))));
    if (!bloques.length) bloques.push(h("p", { class: "vacio", text: q.trim() ? "No hay resultados para «" + q + "». Prueba con el lema (λόγος), una forma (λόγου), una palabra en español (discurso) o una cita (Jn 1:1)." : "Escribe una palabra griega, un término en español o una cita." }));
    vista().replaceChildren(h("section", { class: "panel" }, h("h1", { style: "font-size:clamp(1.6rem,4vw,2.2rem)", text: q ? "Resultados para «" + q + "»" : "Buscar" }), ...bloques, buscadorMorfologico()));
  }

  function buscadorMorfologico() {
    const sel = (id, t, ops) => h("label", {}, t, h("select", { id }, h("option", { value: "", text: "cualquiera" }), Object.entries(ops).map(([v, x]) => h("option", { value: v, text: x }))));
    const libros = h("select", { id: "fm-libro" }, h("option", { value: "", text: "toda la Nueva Voluntad" }), D.libros.map((b) => h("option", { value: b.c, text: nombreLibro(b) })));
    const lema = h("input", { id: "fm-lema", type: "text", placeholder: "p. ej. λέγω", lang: "grc" });
    const salida = h("div", { class: "resultados" });
    const barra = h("div", { class: "progreso", hidden: true }, h("i"));
    const correr = async () => {
      const f = { pos: $("#fm-clase").value, tense: $("#fm-tiempo").value, mood: $("#fm-modo").value, voice: $("#fm-voz").value, case: $("#fm-caso").value, number: $("#fm-num").value, gender: $("#fm-gen").value, person: $("#fm-pers").value };
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
        let A; try { A = await analisis(b.c); } catch (e) { continue; }
        for (const [cap, vs] of Object.entries(A.caps)) for (const [v, toks] of vs) toks.forEach((t, i) => {
          if (!okM[t[2]]) return;
          if (lset && !lset.has(t[1])) return;
          if (f.voice && String(t[8] || 0) !== f.voice) return;
          hall.push({ b, cap: +cap, v, toks, i });
        });
        $("i", barra).style.width = (100 * ++k / libs.length) + "%";
      }
      barra.hidden = true;
      const lista = h("ol", { class: "citas" });
      let n = 0;
      const mas = h("button", { class: "btn", type: "button", text: "Mostrar más" });
      const pinta = () => { lista.append(...hall.slice(n, n + 80).map(citaEl)); n += 80; mas.hidden = n >= hall.length; };
      mas.onclick = pinta;
      pinta();
      salida.replaceChildren(h("p", { class: "ui", style: "margin:0;color:var(--tenue)", text: hall.length ? fmt(hall.length) + " palabras cumplen la búsqueda." : "Ninguna palabra cumple esa combinación." }), lista, mas);
    };
    return h("div", { class: "tarjeta" }, h("h2", { text: "Búsqueda morfológica" }),
      h("p", { class: "ui", style: "margin:0;color:var(--tenue);font-size:.9rem", text: "Combina rasgos gramaticales para encontrar todas las palabras que los cumplen, con su verso." }),
      h("div", { class: "filtros-m" },
        h("label", {}, "Lema", lema),
        sel("fm-clase", "Categoría", Object.fromEntries(Object.entries(CLASE).filter(([k]) => k !== "X"))),
        sel("fm-tiempo", "Tiempo", TIEMPO), sel("fm-modo", "Modo", MODO), sel("fm-voz", "Voz", { 1: "activa", 2: "media", 3: "pasiva", 4: "media o pasiva" }),
        sel("fm-caso", "Caso", CASO), sel("fm-num", "Número", NUM), sel("fm-gen", "Género", GEN), sel("fm-pers", "Persona", { 1: "1.ª", 2: "2.ª", 3: "3.ª" }),
        h("label", {}, "Libro", libros)),
      h("button", { class: "btn oro", type: "button", onclick: correr, text: "Buscar palabras" }), barra, salida);
  }

  function noEncontrado() { vista().replaceChildren(h("p", { class: "vacio" }, "Esa dirección no existe. ", h("a", { href: "#/", text: "Volver al inicio" }))); }

  // ------------------------------------------------------------------ rutas
  function enrutar() {
    if (!D) return;
    const partes = decodeURIComponent(location.hash.replace(/^#\/?/, "")).split("/").filter((x) => x !== "");
    if (!partes.length) { esc.libro = null; return portada(); }
    if (partes[0] === "lema") { esc.libro = null; return vistaLema(+partes[1]); }
    if (partes[0] === "buscar") { esc.libro = null; return vistaBuscar(partes.slice(1).join("/")); }
    const c = partes[0].toUpperCase();
    const cap = +partes[1] || 1;
    const modo = partes[2] === "a" ? "a" : "l";
    const v = partes[3] != null ? +partes[3] : null;
    const i = partes[4] != null ? +partes[4] : null;
    return vistaLibro(c, cap, modo, v, i);
  }
  marco();
  vista().replaceChildren(cargando("Abriendo el códice…"));
  cargar("datos/avance.json").then((d) => {
    D = d;
    const act = $("#actualizado");
    if (act) act.textContent = " Actualizado el " + new Date(D.generado).toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric" }) + ".";
    window.addEventListener("hashchange", enrutar);
    enrutar();
  }).catch(() => vista().replaceChildren(fallo("No se pudo cargar el avance.")));
})();
