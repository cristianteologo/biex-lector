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
  let prefs = Object.assign({ tl: true, tr: true, mo: true, color: "clase", resalta: "", caja: "min", heroCaja: "may", disp: "versos" }, store.get("prefs", {}));
  const guardarPrefs = () => store.set("prefs", prefs);
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
  const escHtml = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  // Cursivas y negritas del borrador (Markdown); los asteriscos sueltos del texto se conservan tal cual
  const marcado = (t) => escHtml(t)
    .replace(/\*\*(?=\S)([^*]+?)(?<=\S)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[\s«“‘(\[])\*(?=[^\s*])([^*]+?)(?<=[^\s*])\*(?=$|[\s»”’).,;:!?\]])/g, "$1<em>$2</em>");
  // En el texto base, ⟪…⟫ es griego aún sin traducción fijada
  function textoLectura(t, esBase) {
    const frag = document.createDocumentFragment();
    if (!esBase) { const s = document.createElement("span"); s.innerHTML = marcado(t); frag.append(...s.childNodes); return frag; }
    const re = /⟪([^⟫]+)⟫/g;
    let i = 0, mm;
    while ((mm = re.exec(t))) {
      if (mm.index > i) frag.append(t.slice(i, mm.index));
      frag.append(spanGk(mm[1], { class: "gr" }));
      i = re.lastIndex;
    }
    if (i < t.length) frag.append(t.slice(i));
    return frag;
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
  const libroDe = (c) => D.libros.find((b) => b.c === c);
  const numLibro = (b) => D.libros.indexOf(b) + 1;
  const estadoEt = (n) => (D.escala[n] || {}).etiqueta || n;
  const refCorta = (b, cap, v) => b.n + " " + cap + (v != null ? ":" + v : "");

  // ------------------------------------------------------------------ ventana (diálogo modal)
  const modal = h("dialog", { class: "modal", "aria-label": "Detalle" });
  const M = { pila: [], nav: null, alCerrar: null };
  modal.addEventListener("click", (e) => { if (e.target === modal) cerrarModal(); });
  modal.addEventListener("close", () => {
    if (modal.open) return;
    document.documentElement.classList.remove("con-modal");
    M.pila = []; M.nav = null;
    const f = M.alCerrar; M.alCerrar = null;
    if (f) f();
  });
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
    }
    const foco = $(".m-cab .btn-icono:last-child", modal); if (foco) foco.focus({ preventScroll: true });
  }
  const empujar = (fn) => { M.pila.push(fn); pintarModal(); };
  const volver = () => { if (M.pila.length > 1) { M.pila.pop(); pintarModal(); } };
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
          h("div", {}, h("button", { class: "btn chico", type: "button", onclick: () => { ap = Object.assign({}, AP0); store.set("ap", ap); aplicarAp(); pintarModal(); } }, "Restablecer lectura"))));
    });
  }

  // ------------------------------------------------------------------ marco
  const raiz = $("#app");
  function marco() {
    if (EMBED) document.documentElement.classList.add("incrustado");
    const tema = h("button", { class: "btn-icono btn-aa", type: "button", "aria-label": "Lectura y apariencia: tamaño del texto, tipo de letra, interlineado y tema", title: "Lectura y apariencia", onclick: abrirApariencia }, "A", h("small", { text: "a" }));
    const buscar = h("button", { class: "btn-buscar", type: "button", "aria-label": "Buscar", onclick: abrirBusqueda }, svg(ICO.buscar), h("span", { text: "Buscar griego, español o cita" }));
    const extra = EMBED ? [
      EMBED ? h("button", { class: "btn-icono", type: "button", "aria-label": "Abrir en una pestaña nueva", title: "Abrir en una pestaña nueva", onclick: () => window.open(enlacePublico(location.hash), "_blank", "noopener") }, svg(ICO.externo)) : null,
      h("button", { class: "btn-icono", type: "button", "aria-label": "Cerrar el lector", title: "Cerrar el lector", onclick: () => { try { window.parent.postMessage({ biex: "cerrar" }, "*"); } catch (e) { /* ignorar */ } } }, svg(ICO.cerrar)),
    ] : [];
    raiz.replaceChildren(
      h("header", { class: "barra" }, h("div", { class: "in" },
        h("a", { class: "marca", href: "#/", "aria-label": "Inicio del lector" }, h("span", { class: "sello", text: "BiEx" }), h("span", { class: "nombre" }, h("b", { text: "Biblia Exacta" }), h("small", { text: "Lector y analizador" }))),
        h("nav", { class: "nav", "aria-label": "Secciones" }, h("a", { href: "#/", text: "Inicio" }), h("a", { href: "#/libros", text: "Libros" }), h("a", { href: "#/buscar", text: "Concordancia" })),
        h("div", { class: "acc" }, buscar, tema, extra))),
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
          h("a", { href: "https://github.com/LogosBible/SBLGNT", target: "_blank", rel: "noopener", text: "SBLGNT" }), " (Society of Biblical Literature y Logos Bible Software), con licencia CC BY 4.0."))),
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
    const L = D.libros;
    const grupos = [["Evangelios y Hechos", ["MAT", "MRK", "LUK", "JHN", "ACT"]], ["Cartas", L.map((b) => b.c).filter((c) => !["MAT", "MRK", "LUK", "JHN", "ACT", "REV"].includes(c))], ["Revelación", ["REV"]]];
    const tarjeta = (b) => {
      const completos = b.total - b.conteo.base;
      return h("a", { class: "tlibro", href: "#/" + b.c + "/1", "aria-label": nombreLibro(b) + ": " + pct(b.palabras) + " de las palabras ya traducidas en el texto base" },
        h("span", { class: "num", text: String(numLibro(b)).padStart(2, "0") }),
        h("span", { class: "tit", text: b.t || b.n }),
        h("span", { class: "es", text: b.n }),
        h("span", { class: "medidor", "aria-hidden": "true" }, h("i", { style: "width:" + Math.min(100, b.palabras).toFixed(1) + "%" })),
        h("span", { class: "dato" }, h("span", {}, h("strong", { text: pct(b.palabras) }), " texto base"), h("span", { text: completos ? fmt(completos) + " de " + fmt(b.total) + " versos con traducción completa" : fmt(b.total) + " versos" })));
    };
    const totalPal = L.reduce((s, b) => s + (b.nPal || b.total), 0);
    const panorama = h("div", { class: "panorama", role: "group", "aria-label": "La Nueva Voluntad completa: cada tramo es un libro" }, L.map((b) => h("a", {
      href: "#/" + b.c + "/1", style: "flex:" + (b.nPal || b.total) + " 1 0", title: numLibro(b) + ". " + nombreLibro(b) + " · " + pct(b.palabras) + " de las palabras ya traducidas en el texto base",
      "aria-label": nombreLibro(b) + ", " + pct(b.palabras) },
      h("i", { style: "height:" + Math.min(100, b.palabras).toFixed(1) + "%" }))));
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
          h("p", { text: "Cada tramo de la franja es un libro, a la medida de sus palabras; el oro sube con las palabras ya traducidas en el texto base." })),
        panorama,
        h("div", { class: "panorama-pie" }, h("span", { text: fmt(totalPal) + " palabras griegas" }), h("span", { text: "Mateo → Revelación" })),
        grupos.map(([t, cs]) => h("div", { class: "grupo-libros" }, h("h3", { text: t }), h("div", { class: "tarjetas" }, cs.map((c) => tarjeta(libroDe(c)))))),
        h("div", { class: "leyenda" }, ["exacto", "casi", "revision", "borrador", "base"].map((k) => h("span", { class: "n-" + k }, h("i"), estadoEt(k)))))),
      h("section", { class: "seccion" }, h("div", { class: "in" },
        h("div", { class: "seccion-cab" }, h("span", { class: "eyebrow", text: "Herramientas" }), h("h2", { text: "Leer, analizar, comparar" }), h("div", { class: "filete" })),
        h("div", { class: "herramientas" },
          herr(ICO.libro, "Lectura", "Cada capítulo en su estado actual. Toca un verso y se abre su griego palabra por palabra.", "Leer Juan 1", "#/JHN/1"),
          herr(ICO.lupa, "Análisis morfológico", "Forma, transliteración, lema, tiempo, voz, modo, caso, función en la oración y ediciones de cada palabra.", "Analizar Juan 1", "#/JHN/1/a"),
          herr(ICO.lista, "Concordancia", "Todas las apariciones de un lema en la Nueva Voluntad, con su forma, su traducción y su verso.", "Ver λόγος", "#/lema/" + liLogos),
          herr(ICO.filtros, "Búsqueda morfológica", "Combina rasgos: los aoristos pasivos de un libro, los participios de un lema, los genitivos de un capítulo…", "Buscar", "#/buscar")))));
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
    return h("div", { class: "libro" }, bandaLibro(b),
      h("div", { class: "in libro-grid" },
        h("aside", { class: "riel", "aria-label": "Capítulos y versos" }, navContenido(b, cap, versos)),
        h("section", { class: "hoja" }, barraHoja(b, cap, modo, versos), ...cuerpo.filter(Boolean))));
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
        h("span", { class: "eyebrow", text: "Libro " + numLibro(b) + " de 27 · Nueva Voluntad" }),
        h("h1", {}, h("span", { class: "tr", text: b.t || b.n }), b.t ? h("span", { class: "es", text: b.n }) : null)),
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
      type: "button", class: "tesela n-" + x.n, "data-v": x.v, title: cap + ":" + x.v + " · " + estadoEt(x.n), "aria-label": "Verso " + x.v + ", " + estadoEt(x.n),
      onclick: () => { if (alElegir) alElegir(); irVerso(x.v); } }, String(x.v)))) : null;
    const usados = versos ? ["exacto", "casi", "revision", "borrador", "base"].filter((k) => versos.some((x) => x.n === k)) : [];
    return [
      h("div", {}, h("p", { class: "rotulo", text: "Capítulos" }), caps),
      teselas ? h("div", {}, h("p", { class: "rotulo", text: "Versos del capítulo " + cap }), teselas) : null,
      usados.length ? h("div", { class: "leyenda" }, usados.map((k) => h("span", { class: "n-" + k }, h("i"), estadoEt(k)))) : null];
  }
  function irVerso(v) {
    ponerHash("#/" + esc.libro + "/" + esc.cap + "/" + (esc.modo === "a" ? "a" : "l") + "/" + v);
    enfocar(v, null);
  }
  function barraHoja(b, cap, modo, versos) {
    const ir = (m) => "#/" + b.c + "/" + cap + (m === "a" ? "/a" : "");
    const btnModo = (m, t) => h("button", { type: "button", "aria-pressed": (modo === "a") === (m === "a") ? "true" : "false", onclick: () => { if ((modo === "a") !== (m === "a")) location.hash = ir(m); } }, t);
    const prev = cap > 1 ? "#/" + b.c + "/" + (cap - 1) + (modo === "a" ? "/a" : "") : null;
    const next = cap < b.caps.length ? "#/" + b.c + "/" + (cap + 1) + (modo === "a" ? "/a" : "") : null;
    const disp = modo !== "a" ? h("div", { class: "seg seg-ico", role: "group", "aria-label": "Disposición del texto" },
      [["versos", "Por versos", ICO.lista], ["continuo", "Continuo", ICO.parrafo]].map(([k, t, ico]) => h("button", { type: "button", "aria-pressed": prefs.disp === k ? "true" : "false", "aria-label": t, title: t, onclick: () => {
        if (prefs.disp === k) return; prefs.disp = k; guardarPrefs(); esc.libro = null; vistaLibro(b.c, cap, modo, null, null);
      } }, svg(ico), h("span", { class: "txt", text: t })))) : null;
    return h("div", { class: "barra-hoja" },
      h("div", { class: "seg", role: "group", "aria-label": "Modo" }, btnModo("l", "Lectura"), btnModo("a", "Análisis")),
      h("button", { class: "btn-cap movil", type: "button", "aria-label": "Capítulo " + cap + ". Elegir capítulo y verso", onclick: () => abrirModal(vistaNavegador(b, cap, versos)) }, svg(ICO.rejilla), "Cap. " + cap),
      disp,
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
    const i = D.libros.indexOf(b);
    const sigLibro = cap >= b.caps.length && i < D.libros.length - 1 ? D.libros[i + 1] : null;
    const antLibro = cap <= 1 && i > 0 ? D.libros[i - 1] : null;
    const ant = cap > 1 ? h("a", { class: "btn", href: rutaCap(b, cap - 1, modo) }, svg(ICO.izq), h("span", { text: "Capítulo " + (cap - 1) }))
      : antLibro ? h("a", { class: "btn", href: rutaCap(antLibro, antLibro.caps.length, modo) }, svg(ICO.izq), h("span", { text: antLibro.n })) : null;
    const sig = cap < b.caps.length ? h("a", { class: "btn oro sig", href: rutaCap(b, cap + 1, modo) }, h("span", { text: "Capítulo " + (cap + 1) }), svg(ICO.der))
      : sigLibro ? h("a", { class: "btn oro sig", href: rutaCap(sigLibro, 1, modo) }, h("span", { text: sigLibro.n }), svg(ICO.der)) : null;
    return h("nav", { class: "fin-cap", "aria-label": "Seguir leyendo" }, ant, sig);
  }

  // Perícopas: las marcas § de BiEx cuando el capítulo las tiene; si no, los párrafos (¶) del texto griego
  const iniciaPericopa = (usaP, x, k) => k === 0 || !!(usaP ? x.p : x.q);
  function cuerpoLectura(b, cap, versos) {
    const usaP = versos.some((x) => x.p);
    const hayBase = versos.some((v) => v.g);
    const nota = hayBase ? h("p", { class: "nota-base" }, "Los versos en texto base se leen palabra por palabra; en ", h("span", { class: "gr", text: "dorado" }), ", el griego que aún no tiene traducción fijada. Toca cualquier verso para abrir su griego palabra por palabra.") :
      h("p", { class: "nota-base", text: "Toca cualquier verso para abrir su griego palabra por palabra." });
    const abrir = (x) => abrirVerso(b, cap, x.v);
    if (prefs.disp === "continuo") {
      const parrafos = [];
      let actual = null;
      versos.forEach((x, k) => {
        if (!actual || iniciaPericopa(usaP, x, k)) { actual = h("p", { class: "peri" }, h("span", { class: "par", "aria-hidden": "true", text: "§" })); parrafos.push(actual); }
        actual.append(h("span", { class: "vs n-" + x.n, id: "v" + x.v, role: "button", tabindex: "0", title: refCorta(b, cap, x.v) + " · " + estadoEt(x.n),
          onclick: () => abrir(x), onkeydown: (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); abrir(x); } } },
          h("sup", { text: x.v }), textoLectura(x.t, !!x.g)), " ");
      });
      return [encabezado(b, cap, "l"), nota, h("div", { class: "continuo" }, parrafos), finCap(b, cap, "l")];
    }
    return [encabezado(b, cap, "l"), nota, h("div", { class: "lectura" }, versos.map((x, k) => h("div", {
      class: "vl n-" + x.n + (iniciaPericopa(usaP, x, k) ? " p" : ""), id: "v" + x.v, role: "button", tabindex: "0",
      "aria-label": "Verso " + x.v + " (" + estadoEt(x.n) + "). Abrir su griego palabra por palabra",
      onclick: () => abrir(x), onkeydown: (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); abrir(x); } } },
      h("span", { class: "vn", title: estadoEt(x.n) + (x.n === "base" ? ": " + x.k + " % de las palabras ya traducidas" : ""), text: x.v }),
      h("span", { class: "vt" }, textoLectura(x.t, !!x.g))))), finCap(b, cap, "l")];
  }
  function abrirVerso(b, cap, v) {
    const versos = esc.versos || [];
    marcarVerso(v);
    abrirModal(vistaVerso({ b, cap, v, versos }), () => { ponerHash("#/" + b.c + "/" + cap + "/l/" + (esc.vMarcado || v)); });
    ponerHash("#/" + b.c + "/" + cap + "/l/" + v);
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
        h("div", { class: "av-cab" }, h("b", { text: v }), L ? h("p", {}, textoLectura(L.t, !!L.g)) : h("p")), fila));
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
    if (el) {
      marcarVerso(v);
      el.scrollIntoView({ block: "start", behavior: "auto" });
    }
    if (esc.modo === "a" && i != null) abrirPalabraAnalisis(v, i);
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
            h("div", { class: "bloque" }, h("h4", { text: "En el verso" }), contexto, ctx.L ? h("p", { class: "contexto-es", style: "margin:0" }, textoLectura(ctx.L.t, !!ctx.L.g)) : null),
            h("div", { class: "bloque" }, h("h4", { text: "Análisis morfológico" }), h("dl", { class: "dl" }, filas)),
            h("div", { class: "bloque" }, h("h4", { text: "Ediciones" }), h("p", { class: "nota-ui", text: sin.length ? "No figura en: " + sin.join(", ") + "." : "Presente en las ocho ediciones cotejadas (" + T.ediciones.join(", ") + ")." }))),
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
          L ? h("p", { class: "fv-es" }, textoLectura(L.t, !!L.g)) : null,
          h("div", { class: "bloque" }, h("h4", { text: "Palabra por palabra · toca una para ver su análisis" }), zona)),
        h("div", { class: "m-pie" },
          L ? h("button", { class: "btn chico", type: "button", onclick: () => compartir(nombreLibro(b) + " " + cap + ":" + ctx.v, textoPlano(L.t), "#/" + b.c + "/" + cap + "/l/" + ctx.v) }, svg(ICO.compartir), "Compartir") : null,
          h("a", { class: "btn chico oro", href: "#/" + b.c + "/" + cap + "/a/" + ctx.v }, svg(ICO.lupa), "Analizar el capítulo")));
    };
  }
  function abrirBusqueda() {
    abrirModal(() => {
      const inp = h("input", { type: "search", placeholder: "λόγος · discurso · Jn 1:1", "aria-label": "Buscar", enterkeyhint: "search", autocomplete: "off", spellcheck: "false" });
      inp.addEventListener("keydown", (e) => { if (e.key === "Enter" && inp.value.trim()) { e.preventDefault(); const q = inp.value.trim(); cerrarModal(); location.hash = "#/buscar/" + encodeURIComponent(q); } });
      setTimeout(() => inp.focus(), 30);
      const ej = ["λόγος", "ἀγάπη", "πνεῦμα", "discurso", "benevolencia", "Jn 1:1", "Mc 1:1", "Flp 2:13"];
      return cajaModal(cabModal("Buscar", "Griego, español o una cita"),
        h("div", { class: "bq" },
          h("label", { class: "bq-campo" }, svg(ICO.buscar), inp),
          h("p", { class: "nota-ui", text: "Escribe un lema o una forma griega (con o sin acentos), una palabra de la traducción o una cita, y pulsa Intro." }),
          h("div", { class: "bq-ej" }, ej.map((x) => h("a", { href: "#/buscar/" + encodeURIComponent(x), lang: /[Ͱ-Ͽἀ-῿]/.test(x) ? "grc" : null, text: x }))),
          h("p", { class: "nota-ui" }, "¿Buscas por rasgos gramaticales? ", h("a", { href: "#/buscar", text: "Abre la búsqueda morfológica" }), ".")));
    });
  }

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
      x.L ? h("span", { class: "stx" }, textoLectura(x.L.t, !!x.L.g)) : (tr ? h("span", { class: "stx", text: tr }) : null)));
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
    navActual("#/buscar");
    vista().replaceChildren(cargando("Buscando…"));
    window.scrollTo(0, 0);
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
    if (q.trim() && !bloques.length) bloques.push(h("p", { class: "vacio", text: "No hay resultados para «" + q + "». Prueba con el lema (λόγος), una forma (λόγου), una palabra en español (discurso) o una cita (Jn 1:1)." }));
    const inp = h("input", { type: "search", value: q || "", placeholder: "λόγος · discurso · Jn 1:1", "aria-label": "Buscar", enterkeyhint: "search" });
    inp.addEventListener("keydown", (e) => { if (e.key === "Enter" && inp.value.trim()) location.hash = "#/buscar/" + encodeURIComponent(inp.value.trim()); });
    vista().replaceChildren(h("div", { class: "in" }, h("section", { class: "panel" },
      h("div", { class: "panel-cab" }, h("span", { class: "eyebrow", text: "Concordancia y búsqueda" }),
        h("h1", { class: "texto", text: q ? "Resultados para «" + q + "»" : "Buscar en la Nueva Voluntad" }),
        h("label", { class: "buscador-pag" }, svg(ICO.buscar), inp)),
      ...bloques, buscadorMorfologico())));
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

  function noEncontrado() { vista().replaceChildren(h("p", { class: "vacio" }, "Esa dirección no existe. ", h("a", { href: "#/", text: "Volver al inicio" }))); }

  // ------------------------------------------------------------------ rutas
  function enrutar() {
    if (!D) return;
    M.alCerrar = null;
    cerrarModal();
    const partes = decodeURIComponent(location.hash.replace(/^#\/?/, "")).split("/").filter((x) => x !== "");
    if (!partes.length) { esc.libro = null; return portada(false); }
    if (partes[0] === "libros") { esc.libro = null; return portada(true); }
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
  alPadre({ biex: "listo" });
  Promise.all([cargar("datos/avance.json"), cargar("datos/destacados.json").catch(() => [])]).then(([d, dest]) => {
    D = d; DEST = Array.isArray(dest) ? dest : [];
    const act = $("#actualizado");
    if (act) act.textContent = " · Actualizado el " + new Date(D.generado).toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric" }) + ".";
    window.addEventListener("hashchange", enrutar);
    enrutar();
  }).catch(() => vista().replaceChildren(fallo("No se pudo cargar el avance.")));
})();
