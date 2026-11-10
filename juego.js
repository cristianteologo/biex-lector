/* BiEx · Escudriña, el juego de Biblia Exacta (módulo del lector; se carga solo al abrir el juego o al leer con sesión).
   El lector solo informa lo que observó: cuánto tiempo estuvo cada verso a la vista, en orden. El servidor decide todo
   (experiencia, misiones, hallazgos) y firma cada sesión. Sin dependencias. */
(function () {
  "use strict";
  if (window.BiExJuego) return;
  let A = null; // lo que el lector presta: h, svg, ICO, avisar, store, ventanas, nombres de libros…
  const MIN = 60e3;
  const API = String(window.BIEX_JUEGO_API || (/(^|\.)bibliaexacta\.pages\.dev$/.test(location.hostname) ? "/api/juego" : "https://bibliaexacta.pages.dev/api/juego")).replace(/\/$/, "");
  const API_ABS = /^https?:\/\//.test(API) ? API : location.origin + API;
  const OFICIAL = "https://bibliaexacta.wixsite.com/biex";
  const S = { token: null, yo: null, cfg: null, codigoNuevo: null, cont: null, sub: [] };
  const LETRAS = "αβγδεζηθικλμνξοπρστυφχψωאבגדהוזחטיכלמנסעפצקרשת";
  const COLORES = ["#c9a865", "#d98a5e", "#6aa7d8", "#6fbf8f", "#b08bd9", "#e0b84a", "#d47a98", "#9fb7c9"];
  const RANGOS = ["Oyente", "Lector", "Examinador", "Escudriñador", "Declarante"];
  // Escalera del Sembrador: [personas confirmadas, nombre, horas de experiencia doble]; el servidor manda la vigente en /config
  const MARCOS0 = [[1, "Sembrador", 1], [3, "Cordón de tres", 2], [7, "Siete", 3], [12, "Doce", 4], [24, "Veinticuatro", 6], [30, "Treinta", 7],
    [48, "Cuarenta y ocho", 8], [60, "Sesenta", 10], [72, "Setenta y dos", 12], [100, "Ciento", 15]];
  const marcos = () => (S.cfg && Array.isArray(S.cfg.marcos) && S.cfg.marcos.length ? S.cfg.marcos : MARCOS0);
  const PUBLICO = "https://bibliaexacta.pages.dev";
  // [griego, nombre tradicional, color, transliteración BiEx (Prompt B, híbrida mixta; BiEx, 9-nov-2026: «más exclusividad y novedad»)]
  const PIEDRAS = [["ἴασπις", "jaspe", "#5f9f72", "Ἴαspις"], ["σάπφειρος", "zafiro", "#3f72d8", "Sάpfειrος"], ["χαλκηδών", "calcedonia", "#93a9c2", "Χαlκēδṓn"], ["σμάραγδος", "esmeralda", "#22a876", "Smάrαgδος"], ["σαρδόνυξ", "sardónice", "#c2643f", "Sαrδόnυc̅ṣ"], ["σάρδιον", "cornalina", "#cc452f", "Sάrδιοn"], ["χρυσόλιθος", "crisólito", "#c3c23c", "Χrυsόlιdsος"], ["βήρυλλος", "berilo", "#4db9ae", "Βḗrυllος"], ["τοπάζιον", "topacio", "#e4a92f", "Τοpάζιοn"], ["χρυσόπρασος", "crisopraso", "#86d070", "Χrυsόprαsος"], ["ὑάκινθος", "jacinto", "#e57b3d", "῾Hυάκιndsος"], ["ἀμέθυστος", "amatista", "#9663d0", "Ἀmέdsυsτος"]];
  const piedraNombre = (i) => PIEDRAS[i][3] + " [" + PIEDRAS[i][1] + "]";
  const ORDINAL = ["primera", "segunda", "tercera", "cuarta", "quinta", "sexta", "séptima", "octava", "novena", "décima", "undécima", "duodécima"];

  // ------------------------------------------------------------------ utilidades
  const fmt = (n) => Number(n || 0).toLocaleString("es");
  const esperar = (ms) => new Promise((ok) => setTimeout(ok, ms));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const b64u = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const deB64u = (s) => Uint8Array.from(atob(String(s).replace(/-/g, "+").replace(/_/g, "/") + "===".slice((String(s).length + 3) % 4)), (c) => c.charCodeAt(0));
  const plural = (n, uno, varios) => fmt(n) + " " + (Number(n) === 1 ? uno : varios);
  const mezcla = (hex, con, f) => {
    const a = parseInt(hex.slice(1), 16), b = parseInt(con.slice(1), 16);
    const c = [16, 8, 0].map((s) => Math.round(((a >> s) & 255) * (1 - f) + ((b >> s) & 255) * f));
    return "#" + c.map((x) => x.toString(16).padStart(2, "0")).join("");
  };
  const sinAnim = () => (A && A.sinAnimaciones && A.sinAnimaciones()) || (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  // Navegadores integrados de otras aplicaciones (Messenger, Facebook, Instagram, TikTok…): no guardan contraseñas ni llaves
  // de acceso y Google no deja iniciar sesión en ellos. Se detectan para ofrecer «Abrir en mi navegador» (BiEx, 9-nov-2026).
  const UA = navigator.userAgent || "";
  const EN_APP = /FBAN|FBAV|FB_IAB|FBIOS|Instagram|Messenger|MicroMessenger|Line\/|TikTok|musical_ly|Snapchat|Pinterest|LinkedInApp/i.test(UA) || (/Android/i.test(UA) && /; wv\)/.test(UA));
  // Vibración breve al tocar (solo teléfonos que la tienen; nunca en modo tranquilo ni sin animaciones)
  const vibrar = (p) => { try { if (navigator.vibrate && !(S.yo && S.yo.tranquilo) && !sinAnim()) navigator.vibrate(p); } catch (e) { /* sin vibración */ } };
  function copiar(texto, ok) {
    const fin = () => A.avisar(ok || "Copiado");
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(texto).then(fin, () => copiarViejo(texto, fin));
    copiarViejo(texto, fin);
  }
  function copiarViejo(texto, fin) {
    const t = A.h("textarea", { style: "position:fixed;left:-9999px;top:0", "aria-hidden": "true" }); t.value = texto; document.body.append(t);
    t.select(); let ok = false; try { ok = document.execCommand("copy"); } catch (e) { /* ignorar */ } t.remove();
    if (ok) fin(); else A.avisar("No se pudo copiar");
  }
  function descargarTexto(nombre, texto) {
    if (A.sinDescargas && A.sinDescargas()) return copiar(texto, "Este marco no permite descargas: el texto quedó copiado");
    const u = URL.createObjectURL(new Blob([texto], { type: "text/plain;charset=utf-8" }));
    const a = A.h("a", { href: u, download: nombre }); document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(u), 4000);
  }
  async function compartir(titulo, texto, url) {
    try { if (navigator.share) { await navigator.share({ title: titulo, text: texto, url }); return; } } catch (e) { if (e && e.name === "AbortError") return; }
    copiar(texto + "\n" + url, "Texto y enlace copiados");
  }
  const nombrePais = (() => {
    // Nombre original primero y el de la tradición entre [ ] cuando difieren (regla de nombres de BiEx)
    const LENG = { US: "en", GB: "en", CA: "en", AU: "en", NZ: "en", IE: "en", BR: "pt", PT: "pt", AO: "pt", MZ: "pt", FR: "fr", BE: "fr", CH: "de", DE: "de", AT: "de",
      IT: "it", NL: "nl", SE: "sv", NO: "nb", DK: "da", FI: "fi", PL: "pl", RO: "ro", GR: "el", RU: "ru", UA: "uk", TR: "tr", IL: "he", JP: "ja", CN: "zh", KR: "ko", PH: "fil", HT: "fr" };
    let es = null; try { es = new Intl.DisplayNames(["es"], { type: "region" }); } catch (e) { /* sin Intl */ }
    return (cod) => {
      if (!cod) return "";
      let tr = cod; try { tr = es ? es.of(cod) : cod; } catch (e) { /* código raro */ }
      const l = LENG[cod]; if (!l) return tr;
      let orig = tr; try { orig = new Intl.DisplayNames([l], { type: "region" }).of(cod); } catch (e) { /* ignorar */ }
      return orig && orig !== tr ? orig + " [" + tr + "]" : tr;
    };
  })();
  const CONT = { AF: "África", AN: "Antártida", AS: "Asia", EU: "Europa", NA: "América del Norte", OC: "Oceanía", SA: "América del Sur" };
  // Nombre de la división del país en la clasificación (lo que Cloudflare llama «region»)
  const REGION = { CO: "Departamento", PE: "Departamento", BO: "Departamento", PY: "Departamento", UY: "Departamento", GT: "Departamento", HN: "Departamento", SV: "Departamento", NI: "Departamento",
    MX: "Estado", US: "Estado", VE: "Estado", BR: "Estado", AR: "Provincia", EC: "Provincia", CU: "Provincia", DO: "Provincia", PA: "Provincia", CR: "Provincia", CA: "Provincia",
    ES: "Comunidad", CL: "Región", FR: "Región", IT: "Región", GB: "Región", PR: "Municipio" };
  const nombreRegion = (pais) => REGION[pais] || "Departamento o estado";

  // ------------------------------------------------------------------ red
  async function pedir(ruta, o) {
    o = o || {};
    const cab = {};
    if (o.cuerpo !== undefined) cab["content-type"] = "application/json";
    const t = S.token; if (t && !o.sin) cab.authorization = "Bearer " + t;
    if (o.cab) Object.assign(cab, o.cab);
    let r;
    // «guardable»: el navegador puede reutilizar la respuesta mientras valga (no gasta peticiones del plan gratuito)
    try { r = await fetch(API + ruta, { method: o.metodo || "GET", headers: cab, body: o.cuerpo !== undefined ? JSON.stringify(o.cuerpo) : undefined, keepalive: !!o.keepalive, credentials: "omit", cache: o.guardable ? "default" : "no-store" }); }
    catch (e) { return { error: "red" }; }
    let d = null;
    try { d = await r.json(); } catch (e) { d = { error: r.ok ? "datos" : "red" }; }
    if (!d || typeof d !== "object") d = { error: "datos" };
    if (!r.ok && !d.error) d.error = "http" + r.status;
    if (r.status === 401 && d.error === "sesion" && t && !o.sin) olvidarSesion(true);
    return d;
  }
  const MENSAJES = { red: "Sin conexión con el juego. Vuelve a intentarlo en un momento.", sin_servidor: "Escudriña abre muy pronto.", limite: "Demasiados intentos seguidos: espera unos minutos.",
    apodo_usado: "Ese apodo ya lo tiene otra persona.", codigo: "Ese código no existe. Revisa que esté completo.", vencido: "Se venció la espera: vuelve a intentarlo.",
    llave: "No se pudo comprobar la llave de acceso.", llave_desconocida: "Esa llave de acceso no corresponde a ningún perfil de Escudriña.", llave_usada: "Esa llave ya está en tu perfil.",
    llaves_max: "Ya tienes 10 llaves de acceso.", ya_vinculada: "Esa cuenta ya está vinculada a otro perfil.", sin_google: "La entrada con Google todavía no está activa.", sin_facebook: "La entrada con Facebook todavía no está activa.",
    ya_en_compania: "Ya estás en una compañía: para unirte a otra, primero sal de la tuya.", nombre_usado: "Ese nombre ya lo tiene otra compañía.", compania: "Ese código de compañía no existe.",
    compania_llena: "Esa compañía ya tiene 24 personas.", sala: "Esa sala no existe o ya venció.", llena: "Esa sala ya tiene 24 personas.",
    apodo_espera: "Tu apodo se puede cambiar una vez cada 3 semanas.", dracmas: "Todavía no tienes las dracmas suficientes para esto." };
  const mensaje = (r) => (r && (r.detalle && (r.error === "apodo" || r.error === "nombre") ? r.detalle : MENSAJES[r.error])) || "Algo no salió bien. Vuelve a intentarlo.";

  function guardarSesion(token, yo) {
    S.token = token; A.store.set("jg:t", token);
    if (yo) actualizarYo(yo);
    reclamarSemilla();
  }
  // Semilla: el lector la pone en lo que comparte quien todavía no tiene cuenta; al entrar, esa siembra pasa a su árbol
  function reclamarSemilla() {
    const s = A.store.get("jg:semS", null), y = S.yo;
    if (!s || typeof s !== "string" || !y || A.store.get("jg:semOk", null) === y.j) return;
    pedir("/semilla", { metodo: "POST", cuerpo: { secreto: s } }).then((r) => {
      if (r.error && r.error !== "ya_reclamada") return;
      A.store.set("jg:semOk", y.j);
      if (r.adoptados > 0) A.avisar(r.adoptados === 1 ? "1 persona que llegó con lo que compartiste antes ya está en tu árbol de la siembra" : fmt(r.adoptados) + " personas que llegaron con lo que compartiste antes ya están en tu árbol de la siembra");
    });
  }
  function actualizarYo(yo) {
    if (!yo) return;
    S.yo = yo; A.store.set("jg:yo", yo);
    const ult = Number(A.store.get("jg:avT", 0)) || 0, l = yo.avisos || [];
    if (l.length) {
      A.store.set("jg:avT", Math.max(ult, ...l.map((a) => a.t || 0)));
      const nuevos = ult ? l.filter((a) => a.t > ult && (a.k === "liga" || a.k === "compania" || a.k === "mision")) : [];
      if (nuevos.length) setTimeout(() => { for (const a of nuevos.reverse()) { if (a.k === "liga" && a.nvNuevo > a.nv) celebracion(Object.assign({ tipo: "liga" }, a)); else A.avisar(NOVEDAD[a.k](a)); } }, 1300);
    }
    if (yo.inv) A.store.set("jg:mio", yo.inv);
    A.store.set("jg:inv", null);
  }
  function olvidarSesion(aviso) {
    R.cola = []; A.store.set("jg:cola", null); A.store.set("jg:hoy", null); A.store.set("jg:sie", null);
    S.token = null; S.yo = null; A.store.set("jg:t", null); A.store.set("jg:yo", null); A.store.set("jg:mio", null);
    salirSala(true); salir();
    if (aviso) A.avisar("Tu sesión de Escudriña terminó. Entra de nuevo con tu código, tu llave o tu cuenta.");
    if (S.cont && S.cont.isConnected) repintar();
  }
  async function config() {
    if (S.cfg && !S.cfg.sinServidor) return S.cfg;
    const c = await pedir("/config", { sin: true, guardable: true });
    S.cfg = c.error ? { sinServidor: true, error: c.error, msPalabra: 450, msMin: 2500, msAuto: 3000, msAutoMin: 6000 } : c;
    return S.cfg;
  }
  const dispositivo = () => { let d = A.store.get("jg:disp", null); if (!d || typeof d !== "string") { d = b64u(crypto.getRandomValues(new Uint8Array(16))); A.store.set("jg:disp", d); } return d; };
  function guardarInvitacion(c) {
    c = String(c || "").toLowerCase();
    if (!/^[a-z0-9]{4,12}$/.test(c) || A.store.get("jg:t", null)) return;
    const p = A.store.get("jg:inv", null);
    if (p && p.c && Date.now() - (p.t || 0) < 30 * 864e5) return; // la primera invitación vale 30 días
    A.store.set("jg:inv", { c, t: Date.now() });
  }
  const invitacionPendiente = () => { const p = A.store.get("jg:inv", null); return p && p.c && Date.now() - (p.t || 0) < 30 * 864e5 ? p.c : null; };

  // ------------------------------------------------------------------ arte (vectorial, alta definición)
  function gema(i, tiene) {
    const c = PIEDRAS[i][2], cl = mezcla(c, "#ffffff", 0.45), cm = mezcla(c, "#ffffff", 0.18), co = mezcla(c, "#000000", 0.3), cx = mezcla(c, "#000000", 0.48);
    const f = tiene ? "" : ' fill-opacity=".14"';
    return A.svg('<g stroke="' + (tiene ? mezcla(c, "#ffffff", 0.6) : "currentColor") + '" stroke-width=".7" stroke-linejoin="round"' + f + '>' +
      '<path d="M6 18L14 9l6 9z" fill="' + cm + '"/><path d="M14 9h20l-6 9h-8z" fill="' + cl + '"/><path d="M34 9l8 9H28z" fill="' + c + '"/>' +
      '<path d="M6 18h14l4 24z" fill="' + co + '"/><path d="M20 18h8l-4 24z" fill="' + c + '"/><path d="M28 18h14L24 42z" fill="' + cx + '"/></g>' +
      (tiene ? '<path d="M33 10.5l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9z" fill="#fff" opacity=".85"/>' : ""), "0 0 48 48");
  }
  function lauro() {
    const cx = 24, cy = 23, r = 15.5;
    let p = '<path d="M' + (cx - 3) + " " + (cy + r + 1) + "A" + r + " " + r + " 0 0 1 " + (cx - r * Math.cos(1.2)).toFixed(2) + " " + (cy - r * Math.sin(1.2)).toFixed(2) + 'M' + (cx + 3) + " " + (cy + r + 1) + "A" + r + " " + r + " 0 0 0 " + (cx + r * Math.cos(1.2)).toFixed(2) + " " + (cy - r * Math.sin(1.2)).toFixed(2) + '" fill="none" stroke="var(--oro-2)" stroke-width="1.1" stroke-linecap="round"/>';
    for (const lado of [-1, 1]) for (let k = 0; k < 7; k++) {
      const g = (lado < 0 ? 104 + k * 22 : 76 - k * 22) * Math.PI / 180, x = cx + r * Math.cos(g), y = cy + r * Math.sin(g);
      for (const fuera of [1, -1]) {
        const off = 2.6 * fuera, lx = x + off * Math.cos(g), ly = y + off * Math.sin(g);
        const rot = (g * 180) / Math.PI + 90 + lado * (fuera > 0 ? -38 : 38);
        p += '<ellipse cx="' + lx.toFixed(2) + '" cy="' + ly.toFixed(2) + '" rx="3.6" ry="1.55" transform="rotate(' + rot.toFixed(1) + " " + lx.toFixed(2) + " " + ly.toFixed(2) + ')" fill="' + (fuera > 0 ? "var(--oro-vivo)" : "var(--oro)") + '"/>';
      }
    }
    p += '<path d="M20.5 40.5c2.2 1.3 4.8 1.3 7 0M22 41.5l-2.2 4M26 41.5l2.2 4" fill="none" stroke="var(--oro)" stroke-width="1.2" stroke-linecap="round"/>';
    return A.svg(p, "0 0 48 48");
  }
  const dracma = () => A.svg('<circle cx="12" cy="12" r="9.2" fill="var(--oro-suave)" stroke="var(--oro)" stroke-width="1.4"/><circle cx="12" cy="12" r="6.8" fill="none" stroke="var(--oro)" stroke-width=".7" opacity=".6"/><path d="M12 7.6l3.9 8H8.1z" fill="none" stroke="var(--oro-vivo)" stroke-width="1.3" stroke-linejoin="round"/>');
  function emblema(l, c, marco, foto) {
    const col = COLORES[c] || COLORES[0], heb = /[֐-׿]/.test(l || "");
    const fu = foto && /^[a-z0-9]{4,12}\.[0-9a-f]{10}$/.test(foto) ? API_ABS + "/foto/" + foto : "";
    // marco: punteado que se va cerrando (1–5), anillo pleno (6–7), doble anillo (8–9) y doble anillo con destellos (10, «Ciento»)
    let anillo = marco ? '<circle cx="24" cy="24" r="23" fill="none" stroke="var(--oro-vivo)" stroke-width="1.2" stroke-dasharray="' + (marco >= 6 ? "none" : (2 + marco) + " 2.2") + '"/>' : "";
    if (marco >= 8) anillo += '<circle cx="24" cy="24" r="21.6" fill="none" stroke="var(--oro)" stroke-width=".6"/>';
    if (marco >= 10) for (let k = 0; k < 8; k++) { const g = k * Math.PI / 4, x = (24 + 23 * Math.cos(g)).toFixed(2), y = (24 + 23 * Math.sin(g)).toFixed(2); anillo += '<circle cx="' + x + '" cy="' + y + '" r="1.1" fill="var(--oro-vivo)"/>'; }
    // la escalera es un bucle: desde la segunda vuelta completa, una marca con el número de vueltas (11 = dos vueltas…)
    const vueltas = marco > 10 ? marco - 9 : 0;
    const marca = vueltas ? '<circle cx="40" cy="40" r="7.4" fill="var(--hoja)" stroke="var(--oro-vivo)" stroke-width="1.1"/><text x="40" y="43.1" text-anchor="middle" font-size="' + (vueltas > 9 ? 7 : 8.6) + '" font-weight="600" fill="var(--oro-vivo)" style="font-family:var(--f-ui)">' + vueltas + "</text>" : "";
    if (fu) { const id = "emf" + (++EMF), el = A.svg(anillo + '<clipPath id="' + id + '"><circle cx="24" cy="24" r="19"/></clipPath><circle cx="24" cy="24" r="20" fill="var(--hoja-2)" stroke="' + col + '" stroke-width="2"/><image href="' + esc(fu) + '" x="5" y="5" width="38" height="38" clip-path="url(#' + id + ')" preserveAspectRatio="xMidYMid slice"/>' + marca, "0 0 48 48");
      el.setAttribute("data-foto", foto); el.classList.add("emb-foto"); return el; }
    return A.svg(anillo + '<circle cx="24" cy="24" r="20" fill="var(--hoja-2)" stroke="' + col + '" stroke-width="2"/><text x="24" y="' + (heb ? 31 : 32) + '" text-anchor="middle" font-size="' + (heb ? 21 : 25) +
      '" fill="' + col + '" style="font-family:' + (heb ? "'Frank Ruhl Libre','BiEx Texto',serif" : "'BiEx Texto','Gentium Book Plus',Georgia,serif") + '">' + esc(l || "α") + "</text>" + marca, "0 0 48 48");
  }
  let EMF = 0;
  // tocar la foto de otra persona en una lista: verla en grande y poder reportarla (BiEx, 10-nov-2026)
  document.addEventListener("click", (ev) => { const f = ev.target && ev.target.closest && ev.target.closest(".jg-fila .emb-foto, .jg-salas-l .emb-foto"); if (!f) return; ev.preventDefault(); const li = f.closest("li"); verFoto(f.getAttribute("data-foto"), li ? (li.querySelector(".n b, .n") || {}).textContent : ""); });
  // marco que se dibuja para la persona: «Ciento» y, desde la segunda vuelta, su número de vueltas
  const marcoVisible = (y) => (y && y.vuelta >= 1 ? 9 + y.vuelta : (y && y.marco) || 0);
  const embDe = (s) => { const t = String(s || ""); const m = /^(.+?)(\d)$/u.exec(t); return m ? [m[1], +m[2]] : ["α", 0]; };
  const ICO_JG = {
    dracma: '<circle cx="12" cy="12" r="8.2" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="5" fill="none" stroke="currentColor" stroke-width="1" opacity=".6"/><path d="M12 8.6v6.8M9.8 10.2h4.4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
    llave: '<circle cx="8" cy="12" r="3.6" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M11.6 12H20.5M17.5 12v3M20.5 12v2.4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
    google: '<path d="M20.6 12.2c0-.6-.1-1.2-.2-1.8H12v3.4h4.8a4.2 4.2 0 0 1-1.8 2.7v2.2h2.9c1.7-1.6 2.7-3.9 2.7-6.5z" fill="currentColor" opacity=".9"/><path d="M12 21c2.4 0 4.5-.8 5.9-2.2L15 16.6c-.8.5-1.8.9-3 .9-2.3 0-4.3-1.6-5-3.7H4v2.3A9 9 0 0 0 12 21z" fill="currentColor" opacity=".7"/><path d="M7 13.8a5.4 5.4 0 0 1 0-3.5V8H4a9 9 0 0 0 0 8z" fill="currentColor" opacity=".5"/><path d="M12 6.6c1.3 0 2.5.5 3.4 1.3l2.6-2.6A9 9 0 0 0 4 8l3 2.3c.7-2.1 2.7-3.7 5-3.7z" fill="currentColor" opacity=".8"/>',
    facebook: '<path d="M13.3 20.5v-7h2.4l.4-2.8h-2.8V8.9c0-.8.2-1.4 1.4-1.4h1.5V5a19 19 0 0 0-2.2-.1c-2.2 0-3.6 1.3-3.6 3.7v2.1H8v2.8h2.4v7" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>',
    codigo: '<rect x="3.5" y="7" width="17" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M7 12h.01M10 12h.01M13 12h.01M16.5 12h.01" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>',
    copiar: '<rect x="8.5" y="8.5" width="11" height="11" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M15.5 5.5v-.5A1.5 1.5 0 0 0 14 3.5H5A1.5 1.5 0 0 0 3.5 5v9A1.5 1.5 0 0 0 5 15.5h.5" fill="none" stroke="currentColor" stroke-width="1.6"/>',
    descargar: '<path d="M12 4v11M7.5 11l4.5 4.5 4.5-4.5M5 19.5h14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>',
    compartir: '<circle cx="17.5" cy="5.5" r="2.5" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="6.5" cy="12" r="2.5" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="17.5" cy="18.5" r="2.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M8.7 10.7l6.6-3.9M8.7 13.3l6.6 3.9" fill="none" stroke="currentColor" stroke-width="1.6"/>',
    marca: '<path d="M5.5 12.5l4.2 4.2L18.5 7.8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
    cambiar: '<path d="M4.5 9.5h12.5l-3-3M19.5 14.5H7l3 3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>',
    llama: '<path d="M12 21c3.6 0 6-2.5 6-5.8 0-3.6-2.7-5.6-3.6-8.7-.3 2-1.2 3-2.3 3.6C12.4 7.7 11 5 8.8 3.5c.3 3.3-2.8 5.6-2.8 10C6 18.5 8.4 21 12 21z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>',
    mundo: '<circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M3.5 12h17M12 3.5c2.5 2.4 3.6 5.3 3.6 8.5s-1.1 6.1-3.6 8.5c-2.5-2.4-3.6-5.3-3.6-8.5s1.1-6.1 3.6-8.5z" fill="none" stroke="currentColor" stroke-width="1.4"/>',
    imagen: '<rect x="3.5" y="4.5" width="17" height="15" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="9" cy="9.5" r="1.6" fill="currentColor"/><path d="M4.5 18l5.2-5.2 3.3 3.3 2.4-2.4 4.1 4.1" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>',
    idea: '<path d="M9 17.5h6M10 20.5h4M12 3.5a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1 2V17h5.2v-.7c0-.8.4-1.5 1-2A6 6 0 0 0 12 3.5z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/>',
    arriba: '<path d="M12 5l6.5 7.5H14.5V19h-5v-6.5H5.5z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>',
    chat: '<path d="M12 4a8 8 0 0 0-6.9 12.1L4 20l4-1.1A8 8 0 1 0 12 4z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>',
    avion: '<path d="M20.5 4L3.5 11l6 2.2L18 6.5l-6.8 7.8.5 5.7 3-4 4 2.5z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>',
    publicar: '<path d="M4.5 6.5h15M4.5 11h15M4.5 15.5h9" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M16 15l2 2 3.5-3.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>',
    correo: '<rect x="3.5" y="5.5" width="17" height="13" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M4.5 7l7.5 6 7.5-6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>',
    persona: '<circle cx="12" cy="8.5" r="3.6" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M5 20c.8-3.9 3.6-6 7-6s6.2 2.1 7 6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
    arbol: '<path d="M12 20.5V13.5M12 13.5L7.6 9.1M12 13.5l4.4-4.4M7.6 9.1L5.2 6.7M7.6 9.1V5.6M16.4 9.1l2.4-2.4M16.4 9.1V5.6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><circle cx="5" cy="6.3" r="1.5" fill="currentColor"/><circle cx="7.6" cy="4.6" r="1.5" fill="currentColor"/><circle cx="16.4" cy="4.6" r="1.5" fill="currentColor"/><circle cx="19" cy="6.3" r="1.5" fill="currentColor"/>',
    liga: '<path d="M6 9.5L9 5h6l3 4.5L12 19z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M6 9.5h12M9.6 9.5L12 19l2.4-9.5M9 5l.6 4.5M15 5l-.6 4.5" fill="none" stroke="currentColor" stroke-width="1.15" stroke-linejoin="round"/>',
    compania: '<circle cx="12" cy="8" r="3" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="5.8" cy="10" r="2.3" fill="none" stroke="currentColor" stroke-width="1.4"/><circle cx="18.2" cy="10" r="2.3" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M6.5 19.5c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5M2.5 18c.3-2 1.6-3.3 3.3-3.6M21.5 18c-.3-2-1.6-3.3-3.3-3.6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
    hoy: '<path d="M3.5 18h17M6.5 18a5.5 5.5 0 0 1 11 0" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M12 5.5v2.7M5.3 9l1.9 1.9M18.7 9l-1.9 1.9" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
    mas: '<rect x="4.5" y="4.5" width="6" height="6" rx="1.7" fill="none" stroke="currentColor" stroke-width="1.6"/><rect x="13.5" y="4.5" width="6" height="6" rx="1.7" fill="none" stroke="currentColor" stroke-width="1.6"/><rect x="4.5" y="13.5" width="6" height="6" rx="1.7" fill="none" stroke="currentColor" stroke-width="1.6"/><rect x="13.5" y="13.5" width="6" height="6" rx="1.7" fill="none" stroke="currentColor" stroke-width="1.6"/>',
    jugar: '<circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M10.2 8.4l5.6 3.6-5.6 3.6z" fill="currentColor"/>',
    sala: '<path d="M3.5 6.5c2.8-.9 5.6-.6 8.5 1.2 2.9-1.8 5.7-2.1 8.5-1.2v11.5c-2.8-.9-5.6-.6-8.5 1.2-2.9-1.8-5.7-2.1-8.5-1.2z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M12 7.7v11.5" fill="none" stroke="currentColor" stroke-width="1.3"/>',
  };
  const ico = (k) => A.svg(ICO_JG[k]);

  // ------------------------------------------------------------------ sonido (campanas breves sintetizadas; nunca en modo tranquilo)
  let AC = null;
  function sonar(tipo) {
    if (!S.yo || S.yo.tranquilo) return;
    try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === "suspended") AC.resume().catch(() => {}); } catch (e) { return; }
    if (AC.state !== "running") return;
    const N = { chispa: [[1046.5, 0, 0.16], [1568, 0.07, 0.22]], nivel: [[659.3, 0, 0.3], [880, 0.11, 0.3], [1318.5, 0.22, 0.55]], hallazgo: [[784, 0, 1.1], [1174.7, 0.06, 1.2], [1568, 0.12, 1.4], [2349.3, 0.18, 0.9]],
      bienvenida: [[392, 0, 1.9], [523.25, 0.22, 1.9], [659.25, 0.44, 2.1], [783.99, 0.66, 2.3], [1046.5, 1.0, 2.6], [1318.5, 1.4, 2.4]] }[tipo] || [];
    const t0 = AC.currentTime + 0.02;
    for (const [f, d, dur] of N) {
      const o = AC.createOscillator(), g = AC.createGain();
      o.type = "sine"; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t0 + d); g.gain.exponentialRampToValueAtTime(0.05, t0 + d + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t0 + d + dur);
      o.connect(g); g.connect(AC.destination); o.start(t0 + d); o.stop(t0 + d + dur + 0.05);
    }
  }

  // ------------------------------------------------------------------ estilos
  function estilos() {
    if (document.getElementById("jg-css")) return;
    const st = document.createElement("style"); st.id = "jg-css"; st.textContent = CSS; document.head.append(st);
  }
  const CSS = `
.jg{display:grid;gap:18px}
.jg .panel-cab{margin-bottom:0}
.jg-lema{font-family:var(--f-texto);color:var(--tenue);font-size:.98rem;margin:.35em 0 0;line-height:1.5}
.jg-lema [lang=grc]{color:var(--oro-vivo);font-size:1.06em}
.jg-tarjeta{position:relative;background:color-mix(in srgb,var(--hoja) 88%,transparent);border:1px solid var(--linea-2);border-radius:var(--radio);padding:18px 18px 16px;display:grid;gap:12px}
.jg-tarjeta>h2{font:600 .78rem/1.2 var(--f-ui);letter-spacing:.14em;text-transform:uppercase;color:var(--oro);margin:0;display:flex;align-items:center;gap:8px}
.jg-tarjeta>h2 svg{width:16px;height:16px;flex:none}
.jg-tarjeta p{margin:0;line-height:1.55;color:var(--tinta-2)}
.jg-mini{font:400 .82rem/1.45 var(--f-ui);color:var(--tenue)}
.jg-mini svg{width:1.05em;height:1.05em;vertical-align:-.18em;color:var(--oro)}
.jg-perfil{display:grid;grid-template-columns:auto 1fr;gap:14px;align-items:center}
.jg-perfil .jg-emb{width:64px;height:64px}
.jg-perfil .jg-emb svg{width:100%;height:100%;display:block}
.jg-nombre{font:500 1.35rem/1.15 var(--f-display);color:var(--tinta);margin:0;word-break:break-word}
.jg-rango{font:500 .84rem/1.3 var(--f-ui);color:var(--oro);margin-top:3px}
.jg-chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
.jg-chip{font:500 .74rem/1 var(--f-ui);padding:5px 9px;border-radius:999px;border:1px solid var(--linea);color:var(--oro-vivo);background:var(--oro-suave);white-space:nowrap}
.jg-chip.tenue{color:var(--tenue);background:none;border-color:var(--linea-2)}
.jg-barra{height:8px;border-radius:99px;background:var(--hoja-3);overflow:hidden}
.jg-barra>i{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,var(--oro-2),var(--oro-vivo));transform-origin:left center}
.jg-nivel{display:flex;justify-content:space-between;gap:10px;font:400 .8rem/1.3 var(--f-ui);color:var(--tenue);margin-top:6px}
.jg-grande{width:100%;justify-content:center;min-height:52px;font-size:1.02rem}
.jg-grande small{display:block;font-size:.78em;opacity:.8;font-weight:400}
.jg-cifras{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.jg-cifras div{text-align:center;padding:10px 6px;border-radius:12px;background:var(--hoja-2)}
.jg-cifras b{display:block;font:500 1.45rem/1.1 var(--f-display);color:var(--oro-vivo)}
.jg-cifras span{font:400 .74rem/1.3 var(--f-ui);color:var(--tenue)}
.jg-misiones{list-style:none;margin:0;padding:0;display:grid;gap:10px}
.jg-mision{display:grid;grid-template-columns:28px 1fr auto;gap:10px;align-items:center;padding:10px 12px;border-radius:12px;background:var(--hoja-2)}
.jg-mision .jg-ok{width:26px;height:26px;border-radius:50%;border:1.5px solid var(--linea);display:grid;place-items:center;color:var(--sobre-oro)}
.jg-mision .jg-ok svg{width:16px;height:16px;opacity:0}
.jg-mision.hecha .jg-ok{background:var(--oro);border-color:var(--oro)}
.jg-mision.hecha .jg-ok svg{opacity:1}
.jg-mision .jg-mt{font:400 .95rem/1.35 var(--f-ui);color:var(--tinta)}
.jg-mision .jg-barra{height:5px;margin-top:6px}
.jg-mision .jg-pr{font:500 .76rem/1.2 var(--f-ui);color:var(--oro);text-align:right;white-space:nowrap}
.jg-mision .jg-cambiar{display:block;margin:6px 0 0 auto;background:none;border:0;color:var(--tenue);font:400 .74rem var(--f-ui);cursor:pointer;padding:2px 0;text-decoration:underline;text-underline-offset:3px}
.jg-piedras{display:grid;grid-template-columns:repeat(6,1fr);gap:8px}
.jg-piedra{display:grid;justify-items:center;gap:2px;background:none;border:0;padding:4px 0;color:var(--linea);cursor:pointer;border-radius:10px}
.jg-piedra svg{width:100%;max-width:46px;height:auto;display:block}
.jg-piedra span{font:400 .66rem/1.2 var(--f-ui);color:var(--tenue)}
.jg-piedra b{font:500 .66rem/1 var(--f-ui);color:var(--oro-vivo)}
.jg-tesoros{display:flex;flex-wrap:wrap;gap:14px;align-items:center}
.jg-tesoro{display:flex;align-items:center;gap:8px;font:400 .88rem/1.3 var(--f-ui);color:var(--tinta-2)}
.jg-tesoro svg{width:30px;height:30px}
.ap{display:grid;gap:16px}
.ap-sub{font:500 1.35rem/1.2 var(--f-display);color:var(--tinta);margin:26px 0 4px}
.ap-heroe{position:relative;border:1px solid color-mix(in srgb,var(--oro) 40%,transparent);border-radius:22px;overflow:hidden;background:radial-gradient(120% 80% at 50% 30%,rgba(60,44,18,.55),rgba(8,7,5,.92) 70%),#070605;box-shadow:0 18px 48px -24px rgba(0,0,0,.9),inset 0 1px 0 rgba(255,236,180,.12)}
.ap-lienzo{position:relative;padding:8px 6px 0}
.ap-svg{display:block;width:100%;height:auto;max-height:78vh;margin:0 auto}
.ap-svg .ap-ramas path{stroke-opacity:.92}
.ap-svg .ap-h{opacity:var(--o);animation:ap-titila 5.5s ease-in-out var(--d) infinite;transform-box:fill-box;transform-origin:center}
.ap-svg .ap-mota{fill:#ffe7a0;opacity:0;animation:ap-mota var(--t) linear var(--d) infinite}
.ap-svg .ap-fr{animation:ap-fruto 3.6s ease-in-out var(--d) infinite;transform-box:fill-box;transform-origin:center}
.ap-svg .ap-raiz{stroke-dasharray:8 14;animation:ap-savia 2.4s linear var(--d) infinite}
.ap-svg .ap-rayos{transform-origin:500px 640px;animation:ap-gira 90s linear infinite}
.ap-svg .ap-copa{animation:ap-respira 7s ease-in-out infinite}
@keyframes ap-respira{0%,100%{opacity:.75}50%{opacity:1}}
.ap-svg .ap-aro{transition:stroke-dasharray .8s cubic-bezier(.2,.8,.2,1)}
@keyframes ap-titila{0%,100%{opacity:calc(var(--o) * .55)}50%{opacity:var(--o)}}
@keyframes ap-mota{0%{opacity:0;transform:translate3d(0,0,0)}15%{opacity:.85}100%{opacity:0;transform:translate3d(0,-120px,0)}}
@keyframes ap-fruto{0%,100%{transform:translate3d(0,0,0)}50%{transform:translate3d(0,-4px,0)}}
@keyframes ap-savia{to{stroke-dashoffset:-44}}
@keyframes ap-gira{to{transform:rotate(360deg)}}
.ap-datos{display:grid;gap:10px;padding:4px 18px 18px}
.ap-ap{display:flex;flex-wrap:wrap;align-items:baseline;justify-content:center;gap:4px 12px;margin:0;text-align:center}
.ap-ap b{font:500 1.5rem/1.15 var(--f-display);color:var(--tinta)}
.ap-ap span{font:500 .86rem/1.3 var(--f-ui);color:var(--oro)}
.ap-prog{text-align:center;margin:0}
.ap-cifras{list-style:none;margin:4px 0 0;padding:0;display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.ap-cifras li{display:grid;justify-items:center;gap:3px;padding:10px 4px;border-radius:14px;border:1px solid var(--linea);background:color-mix(in srgb,var(--hoja-2) 72%,transparent);text-align:center}
.ap-cifras b{font:600 1.08rem/1.1 var(--f-ui);color:var(--oro-vivo);font-variant-numeric:tabular-nums}
.ap-cifras small{font:400 .72rem/1.2 var(--f-ui);color:var(--tinta-2)}
.ap-foto{justify-content:center}
.ap-cab{display:flex;justify-content:space-between;align-items:center;gap:12px;margin:10px 0 6px}
.ap-pts{font:500 .92rem/1.2 var(--f-ui);color:var(--tinta)}
.ap-pts b{font-size:1.25rem;color:var(--oro-vivo);margin-right:2px}
.ap-poder{font:500 .86rem/1 var(--f-ui);color:var(--tinta-2)}
.ap-poder b{color:var(--oro-vivo);font-size:1.05rem}
.ap-atr,.ap-piezas,.ap-uso,.ap-acc{list-style:none;margin:0;padding:0;display:grid;gap:8px}
.ap-atr li{display:grid;grid-template-columns:40px 1fr auto auto;gap:10px;align-items:center;padding:10px 12px;border-radius:14px;border:1px solid color-mix(in srgb,var(--ac) 30%,var(--linea));background:linear-gradient(90deg,color-mix(in srgb,var(--ac) 10%,transparent),transparent 60%)}
.ap-ico{display:grid;place-items:center;width:40px;height:40px;border-radius:12px;color:var(--ac);background:color-mix(in srgb,var(--ac) 12%,transparent);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--ac) 35%,transparent)}
.ap-ico svg{width:22px;height:22px}
.ap-n{display:grid;gap:2px;min-width:0}
.ap-n b{font:600 .95rem/1.25 var(--f-ui);color:var(--tinta)}
.ap-n small{font:400 .78rem/1.35 var(--f-ui);color:var(--tinta-2)}
.ap-v{display:grid;justify-items:center;min-width:2.4em}
.ap-v b{font:600 1.2rem/1 var(--f-ui);color:var(--ac);font-variant-numeric:tabular-nums}
.ap-plan{font:600 .7rem/1 var(--f-ui);color:var(--oro-vivo);min-height:.7rem}
.ap-bs{display:flex;gap:6px}
.ap-b{width:34px;height:34px;border-radius:50%;border:1px solid color-mix(in srgb,var(--ac) 45%,transparent);background:var(--hoja-2);color:var(--tinta);font:600 1.1rem/1 var(--f-ui);cursor:pointer;display:grid;place-items:center}
.ap-b:active{transform:scale(.9)}
.ap-arm{display:grid;grid-template-columns:minmax(120px,38%) 1fr;gap:12px;align-items:center}
.ap-fig{display:grid;place-items:center;padding:6px;border-radius:16px;background:radial-gradient(circle at 50% 40%,rgba(245,198,78,.14),transparent 70%)}
.av-fig{width:100%;max-width:190px;height:auto}
.av-fig .av-aura{animation:ap-titila 4s ease-in-out infinite;--o:1}
.ap-piezas li,.ap-uso li,.ap-acc li{display:grid;grid-template-columns:auto 1fr auto;gap:10px;align-items:center;padding:8px 10px;border-radius:12px;border:1px solid var(--linea)}
.ap-uso li,.ap-acc li{grid-template-columns:1fr auto}
.ap-acc li.puesto{border-color:color-mix(in srgb,var(--oro) 60%,transparent);box-shadow:0 0 0 3px color-mix(in srgb,var(--oro) 12%,transparent)}
.ap-gr{display:grid;place-items:center;width:30px;height:30px;border-radius:50%;font:700 .82rem/1 var(--f-ui);color:#16120b;background:var(--gc);box-shadow:0 0 10px -2px var(--gc)}
.ap-ran{margin-top:12px}
.ap-ran>.jg-mini{margin:0 0 6px;text-transform:uppercase;letter-spacing:.12em;font-size:.7rem;color:var(--oro)}
.ap-dr b{color:var(--oro-vivo)}
.ap-verfoto img{display:block;width:min(256px,70vw);height:auto;aspect-ratio:1;border-radius:50%;margin:6px auto 12px;border:2px solid var(--oro);object-fit:cover}
.emb-foto{cursor:pointer}
@media (max-width:420px){.ap-arm{grid-template-columns:1fr}.ap-fig{max-width:200px;margin:0 auto}.ap-atr li{grid-template-columns:36px 1fr auto;grid-template-areas:"i n v" "b b b"}.ap-atr .ap-ico{grid-area:i;width:36px;height:36px}.ap-atr .ap-n{grid-area:n}.ap-atr .ap-v{grid-area:v}.ap-atr .ap-bs{grid-area:b;justify-content:flex-end}}
@media (prefers-reduced-motion:reduce){.ap-svg *,.av-fig *{animation:none!important}}
html[data-mov="no"] .ap-svg *,html[data-mov="no"] .av-fig *{animation:none!important}
.jg-ciu{display:grid;place-items:center;width:34px;height:34px;border-radius:50%;color:var(--oro);background:color-mix(in srgb,var(--oro) 10%,transparent);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--oro) 30%,transparent)}
.jg-ciu svg{width:18px;height:18px}
.jg-fila .n{min-width:0}
.jg-nivel{flex-wrap:wrap}
.jg-yo .jg-nombre{overflow-wrap:anywhere}
.jg-form{display:grid;grid-template-columns:minmax(0,1fr) 9.2em;gap:8px;align-items:stretch}
.jg-form>.btn{justify-content:center;min-width:0}
.jg-form textarea{grid-column:1/-1}
.jg-form:has(textarea)>.btn,.jg-form:has(textarea)>*{grid-column:1/-1}
@media (max-width:340px){.jg-form{grid-template-columns:1fr}}
.jg-sello button{padding:3px 6px 3px 10px!important;font-size:.66rem!important;opacity:.38!important;border-color:transparent!important;gap:6px!important}
.jg-sello .ok{width:15px!important;height:15px!important;font-size:.62rem!important}
.jg-sello.listo button{opacity:.9!important;background:transparent!important;box-shadow:none!important;border-color:color-mix(in srgb,var(--oro) 35%,transparent)!important}
.jg-sello.hecho button{opacity:.5!important}
.jg-pop{z-index:83!important;bottom:calc(150px + env(safe-area-inset-bottom,0px))!important}
html.jg-con-muelle .jg-pop{bottom:calc(196px + env(safe-area-inset-bottom,0px))!important}
html.jg-con-muelle .aviso-flot{bottom:calc(104px + env(safe-area-inset-bottom,0px))}
.jg-coleccion{display:grid;grid-template-columns:auto 1fr;gap:12px;align-items:center;margin:12px 0;padding:12px 14px;border-radius:14px;border:1px solid color-mix(in srgb,var(--oro) 45%,transparent);background:linear-gradient(110deg,color-mix(in srgb,var(--oro) 12%,transparent),transparent 70%)}
.jg-coleccion p{margin:0;font:400 .9rem/1.45 var(--f-ui);color:var(--tinta)}
.jg-coleccion b{color:var(--oro-vivo)}
.jg-col-ico{display:grid;place-items:center;width:38px;height:38px;border-radius:10px;color:var(--oro-vivo);background:color-mix(in srgb,var(--oro) 14%,transparent)}
.jg-col-ico svg{width:22px;height:22px}
.jg-salas-l{list-style:none;margin:8px 0 0;padding:0;display:grid;gap:8px}
.jg-salas-l li{display:grid;grid-template-columns:auto 1fr auto;gap:12px;align-items:center;padding:10px 12px;border:1px solid var(--linea);border-radius:14px;background:color-mix(in srgb,var(--hoja-2) 70%,transparent)}
.jg-salas-l li.yo{border-color:color-mix(in srgb,var(--oro) 60%,transparent);box-shadow:0 0 0 3px color-mix(in srgb,var(--oro) 12%,transparent)}
.jg-salas-l li>svg,.jg-salas-l li>.emb{width:38px;height:38px}
.jg-salas-l .n{display:grid;gap:2px;min-width:0}
.jg-salas-l .n b{font:600 .95rem/1.25 var(--f-ui);color:var(--tinta);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.jg-salas-l .n small{font:400 .78rem/1.3 var(--f-ui);color:var(--tinta-2)}
.jg-salas-l:not(.quien) li:not(:has(svg)){grid-template-columns:1fr auto}
.jg-luces{display:grid;grid-template-columns:repeat(auto-fill,minmax(62px,1fr));gap:6px;margin:12px 0}
.jg-lz{position:relative;display:grid;place-items:center;height:44px;border-radius:12px;border:1px solid var(--linea);background:var(--hoja-2);color:var(--tenue);font:500 .7rem/1 var(--f-ui);letter-spacing:.02em;cursor:pointer;overflow:hidden;padding:0 4px;white-space:nowrap}
.jg-lz.on{color:var(--oro-vivo);border-color:color-mix(in srgb,var(--oro) calc(var(--k) * 70%),transparent);background:radial-gradient(circle at 50% 60%,color-mix(in srgb,var(--oro) calc(var(--k) * 42%),transparent),var(--hoja-2) 75%);box-shadow:0 0 calc(var(--k) * 16px) -4px color-mix(in srgb,var(--oro) 80%,transparent)}
.jg-lz.on::after{content:"";position:absolute;inset:0;border-radius:inherit;box-shadow:inset 0 0 12px color-mix(in srgb,var(--oro) calc(var(--k) * 40%),transparent);animation:jg-latido 2.6s ease-in-out infinite;opacity:.8}
.jg-lz.sel{outline:2px solid var(--oro);outline-offset:1px}
.jg-lz b{position:absolute;right:4px;top:3px;font:700 .62rem/1 var(--f-ui);color:var(--sobre-oro,#16120b);background:var(--oro-vivo);border-radius:999px;padding:2px 5px}
@keyframes jg-latido{0%,100%{opacity:.45}50%{opacity:1}}
.jg-pres{display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px}
.jg-pres .btn{margin-left:auto}
@media (prefers-reduced-motion:reduce){.jg-lz.on::after{animation:none}}
.jg-chispas{position:fixed;inset:0;pointer-events:none;z-index:62;contain:strict}
.jg-ch{position:absolute;display:block;will-change:transform,opacity}
.jg-ch.p{width:4px;height:4px;margin:-2px 0 0 -2px;border-radius:50%;background:radial-gradient(circle,#fff 0 30%,#fbe7a6 55%,rgba(245,198,78,0) 72%);box-shadow:0 0 6px 2px rgba(245,198,78,.55)}
.jg-ch.p.g{width:6px;height:6px;margin:-3px 0 0 -3px;box-shadow:0 0 9px 3px rgba(255,214,120,.5)}
.jg-ch.e{width:11px;height:11px;margin:-5.5px 0 0 -5.5px;background:linear-gradient(135deg,#fffbe6,#f5c64e 60%,#d8962a);clip-path:polygon(50% 0,61% 39%,100% 50%,61% 61%,50% 100%,39% 61%,0 50%,39% 39%);filter:drop-shadow(0 0 3px rgba(255,214,120,.9))}
.jg-pc{margin-top:12px;border:1px solid var(--linea);border-radius:12px;overflow:hidden}
.jg-pc summary{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:11px 14px;cursor:pointer;font:500 .92rem/1.3 var(--f-ui);color:var(--tinta);list-style:none}
.jg-pc summary::-webkit-details-marker{display:none}
.jg-pc summary::after{content:"";width:8px;height:8px;border-right:1.6px solid var(--oro);border-bottom:1.6px solid var(--oro);transform:rotate(45deg);transition:transform .25s;margin-left:6px}
.jg-pc[open] summary::after{transform:rotate(225deg)}
.jg-pc summary small{margin-left:auto;color:var(--tinta-2);font-size:.8rem}
.jg-pc-lista{display:grid;gap:14px;padding:4px 12px 14px}
.jg-pc-cab{display:flex;flex-wrap:wrap;align-items:center;gap:6px 12px;padding:8px 2px 6px;border-bottom:1px solid var(--linea)}
.jg-pc-cab a{font:600 .95rem/1.2 var(--f-ui);color:var(--oro-vivo);text-decoration:none}
.jg-pc-cab small{color:var(--tinta-2);font:400 .78rem/1 var(--f-ui)}
.jg-pc-cab .btn{margin-left:auto}
.jg-pc-vs{list-style:none;margin:0;padding:0;display:grid}
.jg-pc-vs li{display:grid;grid-template-columns:auto 1fr auto;gap:10px;align-items:center;padding:9px 2px;border-bottom:1px solid color-mix(in srgb,var(--linea) 60%,transparent);transition:opacity .35s,transform .35s}
.jg-pc-vs li.ido{opacity:0;transform:translate3d(14px,0,0)}
.jg-pc-vs .rf{font:600 .82rem/1 var(--f-ui);font-variant-numeric:tabular-nums;color:var(--oro);text-decoration:none;min-width:3.2em}
.jg-pc-vs .tx{font:400 .86rem/1.45 var(--f-texto,var(--f-ui));color:var(--tinta-2);min-width:0}
.jg-pc-vs .bt{display:flex;gap:6px}
.jg-pc-vs .bt button{width:34px;height:34px;border-radius:50%;border:1px solid var(--linea-2);background:var(--hoja-2);color:var(--tinta);font:600 .95rem/1 var(--f-ui);cursor:pointer;display:grid;place-items:center}
.jg-pc-vs .bt .si{color:var(--oro-vivo);border-color:color-mix(in srgb,var(--oro) 55%,transparent)}
.jg-pc-vs .bt .no{color:var(--tinta-2)}
.jg-pc-vs .bt button:active{transform:scale(.92)}
.jg-aviso{border:1px solid var(--oro-2);background:var(--oro-suave);border-radius:12px;padding:12px 14px;color:var(--tinta);font:400 .9rem/1.5 var(--f-ui)}
.jg-aviso b{color:var(--oro-vivo);font-weight:500}
.jg-codigo{font:500 clamp(1.15rem,5.2vw,1.7rem)/1.2 ui-monospace,"SFMono-Regular",Menlo,Consolas,monospace;letter-spacing:.08em;text-align:center;padding:18px 10px;border-radius:12px;background:var(--hoja-2);border:1px dashed var(--oro-2);color:var(--oro-vivo);user-select:all;-webkit-user-select:all;word-break:break-all}
.jg-acciones{display:flex;flex-wrap:wrap;gap:8px}
.jg-acciones .btn{flex:1 1 auto;justify-content:center}
.jg-form{display:flex;gap:8px;flex-wrap:wrap}
.jg-form input{flex:1 1 180px;min-width:0;font:400 1rem/1.3 var(--f-ui);padding:12px 14px;border-radius:12px;border:1px solid var(--linea);background:var(--hoja-2);color:var(--tinta)}
.jg-form input:focus{outline:2px solid var(--oro);outline-offset:1px}
.jg-pista{font:400 .8rem/1.4 var(--f-ui);color:var(--tenue);min-height:1.2em;margin:0}
.jg-pista:empty{min-height:0;margin-top:-8px}
.jg-pista.mal{color:#e0866f}.jg-pista.bien{color:var(--oro)}
.jg-check{display:flex;gap:10px;align-items:flex-start;font:400 .92rem/1.45 var(--f-ui);color:var(--tinta);cursor:pointer}
.jg-check input{width:20px;height:20px;accent-color:var(--oro);flex:none;margin-top:1px}
.jg-seg{display:flex;flex-wrap:wrap;gap:6px}
.jg-seg button{font:400 .82rem/1 var(--f-ui);padding:9px 12px;border-radius:999px;border:1px solid var(--linea-2);background:none;color:var(--tinta-2);cursor:pointer}
.jg-seg button[aria-pressed=true]{background:var(--oro);border-color:var(--oro);color:var(--sobre-oro)}
.jg-lista{list-style:none;margin:0;padding:0;display:grid;gap:4px}
.jg-fila{display:grid;grid-template-columns:2.2em 34px 1fr auto;gap:10px;align-items:center;padding:8px 10px;border-radius:12px}
.jg-fila:nth-child(odd){background:var(--hoja-2)}
.jg-fila.yo{outline:1.5px solid var(--oro);background:var(--oro-suave)}
.jg-fila .p{font:500 .95rem/1 var(--f-display);color:var(--oro);text-align:right}
.jg-fila svg{width:34px;height:34px;display:block}
.jg-fila .n{font:400 .95rem/1.25 var(--f-ui);color:var(--tinta);overflow:hidden;text-overflow:ellipsis}
.jg-fila .n small{display:block;font-size:.74rem;color:var(--tenue)}
.jg-fila .x{font:500 .9rem/1 var(--f-ui);color:var(--oro-vivo);white-space:nowrap}
.jg-vivo{display:flex;flex-wrap:wrap;gap:6px 16px;font:400 .82rem/1.4 var(--f-ui);color:var(--tenue)}
.jg-vivo b{color:var(--oro-vivo);font-weight:500}
.jg-vivo i{display:inline-block;width:7px;height:7px;border-radius:50%;background:#7bc98f;margin-right:6px;vertical-align:1px}
.jg-novedades{list-style:none;margin:0;padding:0;display:grid;gap:6px;font:400 .88rem/1.45 var(--f-ui);color:var(--tinta-2)}
.jg-novedades li::before{content:"·";color:var(--oro);margin-right:8px}
.jg-letras{display:grid;grid-template-columns:repeat(auto-fill,minmax(38px,1fr));gap:6px}
.jg-letras button{font:400 1.25rem/1 "BiEx Texto","Gentium Book Plus",Georgia,serif;height:40px;border-radius:10px;border:1px solid var(--linea-2);background:var(--hoja-2);color:var(--tinta);cursor:pointer}
.jg-letras button[aria-pressed=true]{border-color:var(--oro);color:var(--oro-vivo);background:var(--oro-suave)}
.jg-colores{display:flex;flex-wrap:wrap;gap:8px}
.jg-colores button{width:34px;height:34px;border-radius:50%;border:2px solid transparent;cursor:pointer}
.jg-colores button[aria-pressed=true]{border-color:var(--tinta)}
.jg-pop{position:fixed;left:50%;bottom:calc(84px + env(safe-area-inset-bottom,0px));z-index:75;transform:translate(-50%,0);pointer-events:none;font:500 1rem/1 var(--f-ui);color:var(--sobre-oro);background:var(--oro-vivo);padding:9px 15px;border-radius:999px;box-shadow:0 10px 30px rgba(0,0,0,.35);opacity:0;white-space:nowrap}
.jg-pop small{font-weight:400;opacity:.8;margin-left:4px}
.jg-franja{position:fixed;left:50%;bottom:calc(16px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:70;width:min(560px,calc(100vw - 24px));display:grid;grid-template-columns:auto 1fr auto;gap:12px;align-items:center;padding:12px 12px 12px 14px;border-radius:16px;border:1px solid var(--linea);background:color-mix(in srgb,var(--hoja) 94%,transparent);box-shadow:var(--sombra);font:400 .88rem/1.4 var(--f-ui);color:var(--tinta)}
.jg-franja svg{width:30px;height:30px}
.jg-franja b{color:var(--oro-vivo);font-weight:500}
.jg-franja .btn{white-space:nowrap}
.jg-franja .x{background:none;border:0;color:var(--tenue);cursor:pointer;padding:6px;margin-left:-6px}
.jg-franja .x svg{width:18px;height:18px}
.jg-prueba{margin:22px 0 6px;display:grid;grid-template-columns:auto 1fr;gap:12px;align-items:center;padding:14px 16px;border-radius:var(--radio);border:1px solid var(--oro-2);background:var(--oro-suave)}
.jg-prueba svg{width:34px;height:34px}
.jg-prueba p{margin:0;font:400 .92rem/1.45 var(--f-ui);color:var(--tinta)}
.jg-prueba .btn{grid-column:1/-1;justify-self:start}
.jg-preg{display:grid;gap:10px;padding:14px 0;border-bottom:1px solid var(--linea-2)}
.jg-preg:last-of-type{border-bottom:0}
.jg-preg .ref{font:500 .74rem/1 var(--f-ui);letter-spacing:.12em;text-transform:uppercase;color:var(--oro)}
.jg-preg .t{font:400 1.06rem/1.6 var(--f-texto);color:var(--tinta);margin:0}
.jg-preg .t u{text-decoration:none;display:inline-block;min-width:4.5em;border-bottom:2px solid var(--oro);color:var(--oro-vivo);text-align:center}
.jg-ops{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.jg-op{font:400 .95rem/1.25 var(--f-texto);padding:11px 10px;border-radius:12px;border:1px solid var(--linea-2);background:var(--hoja-2);color:var(--tinta);cursor:pointer;text-align:center}
.jg-op[aria-pressed=true]{border-color:var(--oro);background:var(--oro-suave);color:var(--oro-vivo)}
.jg-op.ok{border-color:#6fbf8f;background:rgba(111,191,143,.16);color:var(--tinta)}
.jg-op.mal{border-color:#d9785f;background:rgba(217,120,95,.14);color:var(--tinta)}
.jg-cel{display:grid;justify-items:center;text-align:center;gap:12px;padding:6px 4px 10px}
.jg-cel .arte{width:min(150px,42vw);height:auto}
.jg-cel .arte svg{width:100%;height:auto;display:block}
.jg-cel h3{font:500 1.6rem/1.15 var(--f-display);margin:0;color:var(--tinta)}
.jg-cel h3 [lang=grc]{color:var(--oro-vivo)}
.jg-cel p{margin:0;max-width:30em;font:400 .95rem/1.55 var(--f-ui);color:var(--tinta-2)}
.jg-entrar{display:grid;gap:10px}
.jg-brillo{position:relative;display:inline-block;overflow:hidden;vertical-align:bottom}
.jg-brillo::after{content:"";position:absolute;inset:0;background:linear-gradient(100deg,transparent 35%,rgba(255,244,214,.6) 50%,transparent 65%);transform:translateX(-120%);animation:jg-barrido .95s ease-out 1 forwards;pointer-events:none}
@keyframes jg-barrido{to{transform:translateX(120%)}}
.jg-tit{font:500 1.35rem/1.15 var(--f-display);color:var(--tinta);margin:0;word-break:break-word}
.jg-heroe{background:radial-gradient(120% 140% at 0% 0%,color-mix(in srgb,var(--oro) 14%,transparent),transparent 62%),color-mix(in srgb,var(--hoja) 88%,transparent);border-color:color-mix(in srgb,var(--oro) 45%,transparent)}
.jg-liga{display:grid;gap:10px}
.jg-liga-cab{display:grid;grid-template-columns:auto 1fr;gap:14px;align-items:center}
.jg-gema-viva{width:64px;height:64px;display:block;filter:drop-shadow(0 0 14px color-mix(in srgb,var(--g) 55%,transparent))}
.jg-gema-viva svg{width:100%;height:100%;display:block}
.jg-escalera-p{display:grid;grid-template-columns:repeat(12,1fr);gap:4px;margin-top:4px}
.jg-pel{display:block;opacity:.34}
.jg-pel svg{width:100%;height:auto;display:block}
.jg-pel.ya{opacity:.78}
.jg-pel.act{opacity:1;filter:drop-shadow(0 0 7px var(--oro-vivo));transform:scale(1.18)}
.jg-lista.mini{gap:4px}
.jg-lista.sala .jg-fila{grid-template-columns:34px minmax(0,1fr) auto}
.jg-lista.sala .btn{padding:8px 14px}
.jg-cod-nuevo{justify-self:start}
.jg-liga-cab .jg-mini{text-wrap:pretty}
.jg-fila.sube .p{color:var(--oro-vivo);font-weight:600}
.jg-corte{list-style:none;text-align:center;font:600 .68rem/1 var(--f-ui);letter-spacing:.14em;text-transform:uppercase;color:var(--oro);border-top:1px dashed var(--oro-2);padding-top:7px;margin:2px 0}
.jg-comp-ico{width:36px;height:36px;display:grid;place-items:center;border-radius:50%;border:1px solid var(--linea);color:var(--oro);flex:none}
.jg-comp-ico svg{width:20px;height:20px}
.jg-mis-t{font-size:1.12rem}
.jg-sala-p{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(16px + env(safe-area-inset-bottom,0px));z-index:70;display:flex;align-items:center;gap:8px;max-width:calc(100vw - 120px);padding:9px 14px;border-radius:999px;border:1px solid color-mix(in srgb,var(--oro) 45%,transparent);background:color-mix(in srgb,var(--hoja) 72%,transparent);-webkit-backdrop-filter:blur(14px) saturate(1.3);backdrop-filter:blur(14px) saturate(1.3);color:var(--tinta);font:500 .8rem/1 var(--f-ui);cursor:pointer;box-shadow:var(--vidrio-sombra,0 8px 30px rgba(0,0,0,.3));white-space:nowrap}
.jg-sala-p span{overflow:hidden;text-overflow:ellipsis}
.jg-sala-p b{font-weight:400;color:var(--tenue)}
.jg-sala-p i{position:relative;width:8px;height:8px;border-radius:50%;background:var(--tenue);flex:none}
.jg-sala-p i.on{background:#7bc98f}
.jg-sala-p i.on::after{content:"";position:absolute;inset:-4px;border-radius:50%;border:2px solid rgba(123,201,143,.6);animation:jg-latido 2.4s ease-out infinite}
@keyframes jg-latido{from{transform:scale(.55);opacity:1}to{transform:scale(1.9);opacity:0}}
.jg-con-m{position:relative}
.jg-sala-m{position:absolute;right:-4px;top:-12px;display:flex;gap:2px;z-index:2;pointer-events:none}
.jg-sala-e{width:22px;height:22px;border-radius:50%;display:grid;place-items:center;font:500 12px/1 'Frank Ruhl Libre','BiEx Texto',serif;color:var(--c);background:var(--hoja-2);border:1.5px solid var(--c);box-shadow:0 2px 8px rgba(0,0,0,.25)}
.jg-sala-m b{font:500 10px/22px var(--f-ui);color:var(--tenue)}
.jg-luz{position:absolute;left:-14px;top:-14px;width:44px;height:44px;border-radius:50%;background:radial-gradient(circle,rgba(255,240,200,.95),rgba(232,207,148,.35) 40%,transparent 70%);pointer-events:none;z-index:2}
@media (prefers-reduced-motion:reduce){.jg-brillo::after,.jg-sala-p i.on::after{animation:none}}
.jg-empezar-con{margin-top:14px;padding-top:12px;border-top:1px solid color-mix(in srgb,var(--oro) 22%,transparent)}
.jg-empezar-con .jg-entrar{margin-top:8px}
.jg-unica{margin-top:14px}
.jg-entrar .btn{justify-content:flex-start;text-align:left}
.jg-entrar .btn svg{width:20px;height:20px}
.jg-espera{display:flex;align-items:center;gap:10px;font:400 .9rem/1.4 var(--f-ui);color:var(--tinta-2)}
@keyframes jg-sube{0%{opacity:0;transform:translate(-50%,10px)}15%{opacity:1;transform:translate(-50%,0)}80%{opacity:1;transform:translate(-50%,-6px)}100%{opacity:0;transform:translate(-50%,-14px)}}
@keyframes jg-brilla{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}
.jg-cel .arte.anim{animation:jg-brilla 1.6s ease-in-out 2}
@media (min-width:720px){.jg-piedras{grid-template-columns:repeat(12,1fr)}.jg-dos{display:grid;grid-template-columns:1fr 1fr;gap:18px;align-items:start}}
@media (prefers-reduced-motion:reduce){.jg-cel .arte.anim{animation:none}}
.jg-subt{margin:.1em 0 0;font:italic 400 1.22rem/1.2 var(--f-display,var(--f-texto));color:var(--oro);letter-spacing:.02em}
.jg-campana{position:relative;display:grid;gap:10px;text-align:center;padding:22px 18px 20px;border-radius:var(--radio);border:1px solid color-mix(in srgb,var(--oro) 55%,transparent);background:radial-gradient(120% 90% at 50% 0%,color-mix(in srgb,var(--oro) 16%,transparent),transparent 70%),color-mix(in srgb,var(--hoja) 88%,transparent)}
.jg-campana.mini{padding:12px 14px;text-align:left;gap:8px}
.jg-campana h2{margin:0;font:600 clamp(1.6rem,5vw,2.3rem)/1.15 var(--f-display,var(--f-texto));color:var(--tinta)}
.jg-campana h2 b{color:var(--oro-vivo);font-weight:600}
.jg-campana .eyebrow{justify-self:center}
.jg-campana p{margin:0}
.jg-quedan{margin:0;font:500 1rem/1.4 var(--f-ui);color:var(--tinta)}
.jg-quedan b{color:var(--oro-vivo);font-size:1.15em}
.jg-barra.oro>i{background:linear-gradient(90deg,var(--oro),var(--oro-vivo))}
.jg-cuenta{display:grid;gap:6px;justify-items:center}
.jg-campana.mini .jg-cuenta{justify-items:start}
.jg-reloj{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}
.jg-reloj>span{display:grid;justify-items:center;min-width:64px;padding:6px 8px;border-radius:10px;border:1px solid var(--linea-2);background:color-mix(in srgb,var(--hoja-2) 80%,transparent)}
.jg-reloj b{font:600 1.5rem/1.1 var(--f-ui);color:var(--oro-vivo);font-variant-numeric:tabular-nums}
.jg-reloj small{font:500 .7rem/1.2 var(--f-ui);letter-spacing:.08em;text-transform:uppercase;color:var(--tenue)}
.jg-enlace{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.jg-enlace code{flex:1 1 220px;min-width:0;overflow-wrap:anywhere;font:500 .98rem/1.3 var(--f-ui);padding:10px 12px;border-radius:10px;border:1px dashed color-mix(in srgb,var(--oro) 60%,transparent);color:var(--oro-vivo);background:color-mix(in srgb,var(--hoja-2) 70%,transparent)}
.jg-redes{display:flex;flex-wrap:wrap;gap:6px}
.jg-redes .btn svg,.jg-enlace .btn svg{width:16px;height:16px}
.jg-escalera{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(92px,1fr));gap:6px}
.jg-escalera li{display:grid;justify-items:center;gap:1px;padding:7px 4px;border-radius:10px;border:1px solid var(--linea-2);text-align:center;opacity:.62}
.jg-escalera li b{font:600 1.05rem/1.1 var(--f-ui);color:var(--tinta)}
.jg-escalera li span{font:500 .72rem/1.2 var(--f-ui);color:var(--tenue)}
.jg-escalera li small{font:500 .68rem/1.2 var(--f-ui);color:var(--oro)}
.jg-escalera li.ya{opacity:1;border-color:color-mix(in srgb,var(--oro) 70%,transparent);background:color-mix(in srgb,var(--oro) 10%,transparent)}
.jg-escalera li.ya b{color:var(--oro-vivo)}
.jg-escalera li.sig{opacity:1;border-style:dashed;border-color:var(--oro)}
.jg-form.col{flex-direction:column;align-items:stretch}
.jg-form textarea{width:100%;box-sizing:border-box;resize:vertical;min-height:96px;font:inherit;font-size:1rem;color:var(--tinta);background:var(--hoja-2);border:1px solid var(--linea-2);border-radius:10px;padding:10px 12px}
.jg-form textarea:focus{outline:2px solid var(--oro);outline-offset:1px}
.jg-props{list-style:none;margin:0;padding:0;display:grid;gap:10px}
.jg-prop{display:flex;gap:12px;align-items:flex-start;padding:12px;border-radius:12px;border:1px solid var(--linea-2)}
.jg-prop>div{min-width:0;flex:1}
.jg-prop p{margin:0 0 4px;white-space:pre-wrap;overflow-wrap:anywhere}
.jg-prop.hecha{border-color:color-mix(in srgb,var(--oro) 60%,transparent)}
.jg-prop .jg-form{margin-top:8px;flex-wrap:wrap}
.jg-voto{display:grid;justify-items:center;gap:2px;min-width:48px;padding:6px;border-radius:10px;border:1px solid var(--linea-2);background:none;color:var(--tenue);cursor:pointer;font:600 .9rem var(--f-ui)}
.jg-voto svg{width:18px;height:18px}
.jg-voto[aria-pressed=true]{color:var(--oro-vivo);border-color:var(--oro)}
.jg-voto:disabled{cursor:default}
.jg-pres{display:flex;align-items:center;justify-content:center;gap:8px;margin:14px auto 4px;font:500 .9rem/1.4 var(--f-ui);color:var(--tenue);text-align:center}
.jg-pres i{flex:none;width:7px;height:7px;border-radius:50%;background:var(--oro-vivo);box-shadow:0 0 0 3px color-mix(in srgb,var(--oro-vivo) 22%,transparent)}
.jg-img{display:block;width:min(100%,360px);height:auto;margin:0 auto;border-radius:14px;border:1px solid var(--linea-2)}
:root[data-theme=light] .jg-fila .p,:root[data-theme=light] .jg-tarjeta>h2{color:var(--oro)}
.jg-zonas{margin-top:6px}
.jg-zonas summary{cursor:pointer;font:500 .82rem/1.4 var(--f-ui);color:var(--oro-vivo);list-style-position:inside}
.jg-zonas ul{list-style:none;margin:8px 0 0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:6px 14px;text-align:left}
.jg-zonas li{display:flex;justify-content:space-between;gap:10px;font:400 .8rem/1.35 var(--f-ui);color:var(--tenue)}
.jg-zonas li b{color:var(--tinta);font-weight:600;font-variant-numeric:tabular-nums;white-space:nowrap}
.jg-aviso.tenue{background:none;border-style:dashed}
.jg-total{margin:0;font:500 1.2rem/1.2 var(--f-ui);color:var(--tinta)}
.jg-total b{font:500 2rem/1 var(--f-display);color:var(--oro-vivo);margin-right:2px}
.jg-gen{list-style:none;margin:0;padding:0;display:grid;gap:8px}
.jg-gen li{display:grid;grid-template-columns:minmax(0,auto) 1fr auto;gap:10px;align-items:center;font:500 .84rem/1.3 var(--f-ui);color:var(--tinta-2)}
.jg-gen .b{height:8px;border-radius:99px;background:var(--hoja-3);overflow:hidden;min-width:40px}
.jg-gen .b i{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,var(--oro-2),var(--oro-vivo))}
.jg-arbol-caja{max-width:620px;width:100%;margin:0 auto}
.jg-arbol{display:block;width:100%;height:auto;overflow:visible}
.jg-arbol-vivo{position:relative;overflow:hidden;border-radius:16px;touch-action:pan-y;background:radial-gradient(closest-side,color-mix(in srgb,var(--oro) 9%,transparent),transparent)}
.jg-arbol-mov{transform-origin:50% 50%;will-change:transform}
.jg-arbol-ctl button{touch-action:manipulation;-webkit-tap-highlight-color:transparent;user-select:none;-webkit-user-select:none}
.jg-arbol-vivo.cerca{cursor:grab}
.jg-arbol-luz{position:absolute;left:50%;top:50%;width:26%;aspect-ratio:1;transform:translate(-50%,-50%);border-radius:50%;background:radial-gradient(circle,color-mix(in srgb,var(--oro-vivo) 45%,transparent),transparent 70%);pointer-events:none}
.jg-arbol-pulso{position:absolute;left:0;top:0;width:100%;aspect-ratio:1;border-radius:50%;border:2px solid color-mix(in srgb,var(--oro-vivo) 70%,transparent);opacity:0;pointer-events:none}
.jg-arbol-orbita{position:absolute;left:0;top:0;width:100%;aspect-ratio:1;pointer-events:none}
.jg-arbol-orbita i{position:absolute;inset:3%}
.jg-arbol-orbita i::after{content:"";position:absolute;left:50%;top:0;width:5px;height:5px;margin-left:-2.5px;border-radius:50%;background:var(--oro-vivo);box-shadow:0 0 10px var(--oro-vivo);opacity:.7}
.jg-arbol-ctl{position:absolute;right:8px;bottom:8px;display:flex;gap:6px}
.jg-arbol-ctl button{width:36px;height:36px;border-radius:50%;border:1px solid var(--linea);background:color-mix(in srgb,var(--hoja) 70%,transparent);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);color:var(--oro-vivo);font:500 18px/1 var(--f-ui);cursor:pointer}
.jg-arbol .rama.linaje{stroke:var(--oro-vivo);stroke-width:5}
.jg-arbol .jg-nodo{transform-box:fill-box;transform-origin:center}
.jg-arbol .jg-nodo{cursor:pointer;outline:none}
.jg-arbol .jg-nodo:focus-visible .pt,.jg-arbol .jg-nodo.sel .pt{stroke:var(--tinta);stroke-width:4}
.jg-ficha{display:grid;gap:6px;padding:12px;border-radius:12px;background:var(--hoja-2)}
.jg-ficha .jg-nombre{font-size:1.15rem}
.jg-siembra{display:flex;gap:14px;align-items:center}
.jg-siembra-svg{flex:none;width:104px;height:104px;display:block}
.jg-siembra-svg svg{width:100%;height:100%}
.jg-arbol-lista{list-style:none;margin:0;padding:0;display:grid;gap:6px}
.jg-arbol-lista li{display:flex;gap:10px;align-items:baseline;justify-content:space-between;padding:8px 10px;border-radius:10px;border:1px solid var(--linea-2);min-width:0}
.jg-arbol-lista li>span:first-child{min-width:0;overflow-wrap:anywhere}
.jg-arbol-lista li small{font:400 .78rem var(--f-ui);color:var(--tenue)}
.jg-arbol-lista li.ok{border-color:color-mix(in srgb,var(--oro) 50%,transparent)}
/* ===== Interfaz de juego (9-nov-2026): menú de secciones, tarjetas con profundidad, llave de acceso y guía.
   Todo lo que se mueve usa solo transformaciones y opacidad; el cristal (desenfoque) queda solo en el menú fijo. */
.jg-tarjeta{background:linear-gradient(180deg,color-mix(in srgb,var(--hoja-2) 58%,transparent),color-mix(in srgb,var(--hoja) 90%,transparent));border-color:color-mix(in srgb,var(--oro) 20%,var(--linea-2));box-shadow:inset 0 1px 0 color-mix(in srgb,#fff 7%,transparent),0 22px 44px -34px rgba(0,0,0,.8)}
:root[data-theme="light"] .jg-tarjeta{box-shadow:inset 0 1px 0 rgba(255,255,255,.75),0 18px 36px -30px rgba(60,45,20,.45)}
.jg .btn{transition:transform .15s cubic-bezier(.3,1.4,.5,1),border-color .2s,background .2s}
.jg .btn:active{transform:scale(.97)}
@keyframes jg-gira{to{transform:rotate(360deg)}}
@keyframes jg-entra{from{opacity:0;transform:translate3d(0,12px,0)}to{opacity:1;transform:none}}
@keyframes jg-luz{from{transform:translate3d(-110%,0,0)}to{transform:translate3d(290%,0,0)}}
.jg-cab2{display:flex;align-items:flex-end;justify-content:space-between;gap:6px 14px;flex-wrap:wrap}
.jg-cab2 small{display:block;font:600 .7rem/1.2 var(--f-ui);letter-spacing:.24em;text-transform:uppercase;color:var(--oro)}
.jg-cab2 h1{margin:.08em 0 0;font:600 clamp(1.9rem,7vw,2.5rem)/1.02 var(--f-display);letter-spacing:.01em;color:var(--tinta)}
.jg-cab2 p{margin:0 0 .3em}
/* tu perfil: el emblema con su órbita, el nivel y la barra con luz */
.jg-yo{overflow:hidden;border-color:color-mix(in srgb,var(--oro) 46%,transparent);background:radial-gradient(120% 150% at 0% 0%,color-mix(in srgb,var(--oro) 17%,transparent),transparent 58%),linear-gradient(180deg,color-mix(in srgb,var(--hoja-2) 66%,transparent),color-mix(in srgb,var(--hoja) 92%,transparent))}
.jg-yo::before{content:"א";position:absolute;right:.02em;bottom:-.46em;font:500 9rem/1 "Frank Ruhl Libre",var(--f-texto);color:var(--oro);opacity:.055;pointer-events:none}
.jg-yo>*{position:relative}
.jg-yo .jg-perfil{grid-template-columns:auto 1fr auto}
.jg-pid{min-width:0;align-self:center}
.jg-chips-yo{justify-content:center;margin:10px 0 14px}
.jg-yo .jg-perfil{align-items:center}
.jg-yo .jg-perfil .jg-emb{position:relative;width:76px;height:76px;margin:6px}
.jg-yo .jg-emb::after{content:"";position:absolute;inset:-7px;border-radius:50%;border:1.5px dashed color-mix(in srgb,var(--oro) 62%,transparent);animation:jg-gira 28s linear infinite}
.jg-nv{display:grid;justify-items:center;align-content:center;width:62px;height:62px;border-radius:50%;border:1.5px solid var(--oro);background:radial-gradient(circle at 50% 30%,color-mix(in srgb,var(--oro) 30%,transparent),color-mix(in srgb,var(--oro) 6%,transparent));box-shadow:0 0 0 4px color-mix(in srgb,var(--oro) 10%,transparent)}
.jg-nv b{font:600 1.45rem/1 var(--f-ui);color:var(--oro-vivo);font-variant-numeric:tabular-nums}
.jg-nv small{font:600 .54rem/1 var(--f-ui);letter-spacing:.16em;text-transform:uppercase;color:var(--tenue);margin-top:3px}
.jg-yo .jg-barra{height:11px;box-shadow:inset 0 1px 2px rgba(0,0,0,.5)}
.jg-yo .jg-barra>i{position:relative;overflow:hidden}
.jg-yo .jg-barra>i::after{content:"";position:absolute;top:0;bottom:0;left:0;width:36%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.5),transparent);transform:translate3d(-110%,0,0);animation:jg-luz 3.2s ease-in-out 1.4s infinite}
@media (max-width:380px){.jg-nv{width:52px;height:52px}.jg-nv b{font-size:1.2rem}.jg-yo .jg-perfil .jg-emb{width:64px;height:64px}}
/* accesos del panel */
.jg-atajos{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.jg-atajo{position:relative;display:grid;gap:4px;align-content:start;padding:14px 14px 13px;border-radius:16px;border:1px solid color-mix(in srgb,var(--oro) 26%,var(--linea-2));background:linear-gradient(160deg,color-mix(in srgb,var(--oro) 11%,transparent),transparent 62%),color-mix(in srgb,var(--hoja) 88%,transparent);color:var(--tinta);text-decoration:none;box-shadow:inset 0 1px 0 color-mix(in srgb,#fff 7%,transparent);transition:transform .16s cubic-bezier(.3,1.4,.5,1),border-color .2s;-webkit-tap-highlight-color:transparent}
.jg-atajo:active{transform:scale(.97)}
.jg-atajo:hover,.jg-atajo:focus-visible{border-color:var(--oro);outline:none}
.jg-atajo svg{width:26px;height:26px;color:var(--oro-vivo)}
.jg-atajo b{font:600 1rem/1.2 var(--f-ui);letter-spacing:.02em}
.jg-atajo small{font:400 .76rem/1.35 var(--f-ui);color:var(--tenue)}
@media (min-width:720px){.jg-atajos{grid-template-columns:repeat(4,1fr)}}
/* menú del juego: cinco secciones siempre a la mano */
.jg-muelle{position:fixed;z-index:62;left:50%;bottom:calc(10px + env(safe-area-inset-bottom,0px));transform:translate3d(-50%,0,0);width:min(calc(100vw - 20px),440px);box-sizing:border-box;display:grid;grid-template-columns:repeat(6,1fr);padding:6px;border-radius:22px;border:1px solid color-mix(in srgb,var(--oro) 40%,transparent);background:color-mix(in srgb,var(--hoja) 74%,transparent);-webkit-backdrop-filter:blur(18px) saturate(1.5);backdrop-filter:blur(18px) saturate(1.5);box-shadow:inset 0 1px 0 color-mix(in srgb,#fff 9%,transparent),0 18px 40px -18px rgba(0,0,0,.85);transition:opacity .25s;animation:jg-sube-muelle .45s cubic-bezier(.2,.8,.2,1) both}
@keyframes jg-sube-muelle{from{opacity:0;transform:translate3d(-50%,26px,0)}to{opacity:1;transform:translate3d(-50%,0,0)}}
.jg-muelle a{position:relative;z-index:1;display:grid;justify-items:center;gap:4px;padding:8px 2px 7px;border-radius:16px;color:var(--tenue);text-decoration:none;font:500 .68rem/1 var(--f-ui);letter-spacing:.04em;-webkit-tap-highlight-color:transparent;transition:color .2s}
.jg-muelle a svg{width:24px;height:24px;transition:transform .32s cubic-bezier(.3,1.6,.5,1)}
.jg-muelle a.act{color:var(--oro-vivo)}
.jg-muelle a.act svg{transform:translate3d(0,-2px,0) scale(1.14)}
.jg-muelle a:active svg{transform:scale(.88)}
.jg-muelle a:focus-visible{outline:2px solid var(--oro-vivo);outline-offset:-2px}
.jg-muelle .luz{position:absolute;z-index:0;left:6px;top:6px;bottom:6px;width:calc((100% - 12px)/6);border-radius:16px;background:radial-gradient(120% 100% at 50% 0%,color-mix(in srgb,var(--oro) 36%,transparent),color-mix(in srgb,var(--oro) 10%,transparent));box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--oro) 46%,transparent);transform:translate3d(calc(var(--i,0)*100%),0,0);transition:transform .4s cubic-bezier(.3,1.3,.5,1)}
.jg-muelle a[data-n]::after{content:attr(data-n);position:absolute;top:3px;left:calc(50% + 7px);min-width:16px;height:16px;padding:0 4px;box-sizing:border-box;border-radius:9px;background:var(--oro);color:var(--sobre-oro,#16120b);font:600 .62rem/16px var(--f-ui);text-align:center}
html.con-modal .jg-muelle{opacity:0;pointer-events:none}
html.jg-con-muelle .saltos-rap,html.jg-con-muelle .adelante{bottom:calc(92px + env(safe-area-inset-bottom,0px))}
html.jg-con-muelle .aviso-flot{bottom:calc(98px + env(safe-area-inset-bottom,0px))}
html.jg-con-muelle body{padding-bottom:calc(92px + env(safe-area-inset-bottom,0px))}
html.jg-con-muelle .jg-sala-p{bottom:calc(88px + env(safe-area-inset-bottom,0px));padding:7px 12px;font-size:.84rem}
html.jg-con-muelle .jg-sala-p~.aviso-flot{bottom:calc(140px + env(safe-area-inset-bottom,0px))}
.jg-cab-d{display:flex;align-items:center;gap:8px 12px;flex-wrap:wrap}
.jg-ayuda{display:inline-flex;align-items:center;gap:6px;padding:7px 13px 7px 10px;border-radius:999px;border:1px solid color-mix(in srgb,var(--oro) 42%,transparent);background:color-mix(in srgb,var(--oro) 9%,transparent);color:var(--oro-vivo);text-decoration:none;font:500 .78rem/1 var(--f-ui);letter-spacing:.03em;-webkit-tap-highlight-color:transparent;touch-action:manipulation}
.jg-ayuda svg{width:16px;height:16px}
.jg-ayuda:active{transform:scale(.96)}
.jg-sello{display:flex;justify-content:flex-end;margin:2px 0 12px;pointer-events:none}
.continuo .jg-sello{margin:-2px 0 16px}
.jg-sello button{pointer-events:auto;display:inline-flex;align-items:center;gap:8px;padding:6px 8px 6px 14px;border-radius:999px;border:1px solid color-mix(in srgb,var(--oro) 22%,transparent);background:transparent;color:var(--tenue);font:500 .74rem/1 var(--f-ui);letter-spacing:.05em;opacity:.6;cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation;transition:opacity .35s,color .35s,border-color .35s,box-shadow .35s,background-color .35s}
.jg-sello .ok{display:inline-grid;place-items:center;width:18px;height:18px;border-radius:50%;border:1px solid currentColor;font-size:.72rem;line-height:1}
.jg-sello.listo button{opacity:1;color:var(--oro-vivo);border-color:color-mix(in srgb,var(--oro) 62%,transparent);background:color-mix(in srgb,var(--oro) 7%,transparent);box-shadow:0 0 0 3px color-mix(in srgb,var(--oro) 9%,transparent),0 8px 20px -12px color-mix(in srgb,var(--oro) 80%,transparent)}
.jg-sello.listo .ok{background:var(--oro);color:var(--sobre-oro,#16120b);border-color:var(--oro)}
.jg-sello.hecho button{opacity:.78;color:var(--oro);border-color:transparent}
.jg-sello.hecho .ok{background:color-mix(in srgb,var(--oro) 24%,transparent);border-color:transparent}
.jg-sello button:active{transform:scale(.96)}
.jg-sello button:focus-visible{outline:2px solid var(--oro-vivo);outline-offset:2px}
@media print{.jg-sello{display:none}}
@media print{.jg-muelle{display:none}}
/* la llave de acceso (código recién creado) */
.jg-llave{overflow:hidden;text-align:center;justify-items:center;border-color:color-mix(in srgb,var(--oro) 62%,transparent);background:radial-gradient(110% 70% at 50% 0%,color-mix(in srgb,var(--oro) 22%,transparent),transparent 64%),linear-gradient(180deg,color-mix(in srgb,var(--hoja-2) 82%,transparent),var(--hoja))}
.jg-llave::before{content:"";position:absolute;left:50%;top:0;width:170%;aspect-ratio:1;margin:-45% 0 0 -85%;background:conic-gradient(from 0deg,transparent 0 80%,color-mix(in srgb,var(--oro-vivo) 20%,transparent) 90%,transparent 100%);animation:jg-gira 11s linear infinite;pointer-events:none}
.jg-llave>*{position:relative;max-width:100%}
.jg-llave>p,.jg-llave>.jg-aviso,.jg-llave>.jg-guardar,.jg-llave>.jg-pasos,.jg-llave>.jg-codigo{justify-self:stretch}
.jg-llave>.jg-aviso{text-align:left}
.jg-llave .jg-emb{display:block;width:88px;height:88px;margin-top:4px}
.jg-llave .jg-emb svg{width:100%;height:100%;display:block}
.jg-bienv{font:500 clamp(1.45rem,6vw,2rem)/1.15 var(--f-display)!important;color:var(--tinta)!important}
.jg-bienv b{color:var(--oro-vivo);font-weight:600;overflow-wrap:anywhere}
.jg-llave .jg-codigo{border-style:solid;border-color:color-mix(in srgb,var(--oro) 58%,transparent);background:color-mix(in srgb,#000 32%,var(--hoja-2));box-shadow:inset 0 2px 10px rgba(0,0,0,.45),0 0 0 4px color-mix(in srgb,var(--oro) 10%,transparent);outline:none}
.jg-llave .jg-codigo span{display:inline-block;animation:jg-entra .55s cubic-bezier(.2,.7,.2,1) both}
.jg-llave .jg-codigo span:nth-of-type(2){animation-delay:.14s}.jg-llave .jg-codigo span:nth-of-type(3){animation-delay:.28s}.jg-llave .jg-codigo span:nth-of-type(4){animation-delay:.42s}
.jg-pasos{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;list-style:none;margin:0;padding:0;counter-reset:jgp}
.jg-pasos li{counter-increment:jgp;display:grid;justify-items:center;align-content:start;gap:6px;font:500 .78rem/1.25 var(--f-ui);color:var(--tenue);text-align:center}
.jg-pasos li::before{content:counter(jgp);width:30px;height:30px;border-radius:50%;display:grid;place-items:center;border:1.5px solid var(--linea);font:600 .9rem/1 var(--f-ui);transition:background .3s,border-color .3s,box-shadow .3s}
.jg-pasos li.ya{color:var(--tinta)}
.jg-pasos li.ya::before{content:"✓";background:var(--oro);border-color:var(--oro);color:var(--sobre-oro,#16120b)}
.jg-pasos li.ahora{color:var(--oro-vivo)}
.jg-pasos li.ahora::before{border-color:var(--oro-vivo);box-shadow:0 0 0 4px color-mix(in srgb,var(--oro) 18%,transparent)}
.jg-guardar{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.jg-guardar .btn{flex-direction:column;align-items:center;justify-content:center;gap:5px;min-height:78px;padding:10px 8px;text-align:center;white-space:normal}
.jg-guardar .btn svg{width:22px;height:22px}
.jg-guardar .btn small{display:block;font:400 .72rem/1.25 var(--f-ui);color:var(--tenue);letter-spacing:0;text-transform:none}
.jg-guardar .btn:last-child:nth-child(odd){grid-column:1/-1}
.jg-guardar .btn.hecho{border-color:var(--oro);background:var(--oro-suave)}
.jg-enlace-b{background:none;border:0;padding:4px 0;color:var(--tenue);font:400 .8rem/1.3 var(--f-ui);text-decoration:underline;text-underline-offset:3px;cursor:pointer}
.jg-llave-fin .jg-check{padding:13px 12px;border-radius:12px;border:1px solid var(--linea);font-size:1rem;transition:background .2s,border-color .2s}
.jg-llave-fin .jg-check input{width:26px;height:26px;margin-top:0}
.jg-llave-fin .jg-check.si{border-color:var(--oro);background:var(--oro-suave)}
.jg-llave-fin .jg-check.jg-falta{border-color:#e0866f;background:color-mix(in srgb,#e0866f 12%,transparent);box-shadow:0 0 0 3px color-mix(in srgb,#e0866f 30%,transparent)}
.jg-espera{opacity:.55;filter:saturate(.55)}
.jg-porque{margin:0;padding:12px 14px;border-radius:12px;border:1px solid #e0866f;background:color-mix(in srgb,#e0866f 14%,transparent);color:var(--tinta)!important;font:400 .95rem/1.5 var(--f-ui);animation:jg-entra .3s both}
@keyframes jg-tiembla{10%,90%{transform:translate3d(-2px,0,0)}20%,80%{transform:translate3d(4px,0,0)}30%,50%,70%{transform:translate3d(-7px,0,0)}40%,60%{transform:translate3d(7px,0,0)}}
.jg-tiembla{animation:jg-tiembla .55s cubic-bezier(.36,.07,.19,.97) both}
/* cómo se juega: escenas vectoriales que se mueven solas; se avanza a tu ritmo */
.jg-guia{gap:14px}
.jg-escena{position:relative;height:clamp(210px,36vh,300px);border-radius:16px;overflow:hidden;border:1px solid color-mix(in srgb,var(--oro) 40%,transparent);background:radial-gradient(90% 90% at 50% 18%,color-mix(in srgb,var(--oro) 17%,transparent),transparent 70%),color-mix(in srgb,#000 34%,var(--hoja-2));display:grid;place-items:center;touch-action:pan-y;-webkit-user-select:none;user-select:none}
.jg-escena>*{animation:jg-entra .6s cubic-bezier(.2,.7,.2,1) both}
.jg-guia>h2{font:600 clamp(1.5rem,6vw,2rem)/1.1 var(--f-display);color:var(--tinta);margin:0;letter-spacing:.01em;text-transform:none;display:block}
.jg-guia .jg-gt{font:400 1.08rem/1.55 var(--f-texto);color:var(--tinta-2);margin:0;min-height:5em}
.jg-guia-pie{display:flex;align-items:center;justify-content:space-between;gap:12px}
.jg-puntos{display:flex;gap:4px}
.jg-puntos button{width:26px;height:26px;padding:0;border:0;background:none;cursor:pointer;display:grid;place-items:center}
.jg-puntos button::before{content:"";width:9px;height:9px;border-radius:50%;background:var(--linea);transition:transform .2s,background .2s}
.jg-puntos button.act::before{background:var(--oro-vivo);transform:scale(1.4)}
.jg-guia-nav{display:flex;gap:8px}
.jg-guia-nav .jg-grande{flex:1}
.g-pila{display:grid;place-items:center}
.g-pila>*{grid-area:1/1}
.g-versos{position:relative;display:grid;gap:13px;width:min(76%,320px)}
.g-versos i{display:block;height:12px;border-radius:6px;background:var(--linea);position:relative;overflow:hidden}
.g-versos i:nth-child(2){width:86%}.g-versos i:nth-child(4){width:64%}
.g-versos i::after{content:"";position:absolute;inset:0;border-radius:inherit;background:linear-gradient(90deg,var(--oro),var(--oro-vivo));transform:translate3d(-101%,0,0);animation:g-lee 5.4s ease-in-out infinite}
.g-versos i:nth-child(2)::after{animation-delay:.8s}.g-versos i:nth-child(3)::after{animation-delay:1.6s}.g-versos i:nth-child(4)::after{animation-delay:2.4s}
@keyframes g-lee{0%{transform:translate3d(-101%,0,0);opacity:1}16%,84%{transform:none;opacity:1}100%{transform:none;opacity:0}}
.g-xp{position:absolute;right:-8%;top:-34px;font:600 1.35rem/1 var(--f-ui);color:var(--oro-vivo);animation:g-pop 5.4s ease-out infinite}
@keyframes g-pop{0%,52%{opacity:0;transform:translate3d(0,10px,0) scale(.8)}60%{opacity:1;transform:none}82%{opacity:1}92%,100%{opacity:0;transform:translate3d(0,-14px,0)}}
.g-mis{display:grid;gap:14px;width:min(78%,320px)}
.g-mis div{display:flex;align-items:center;gap:12px}
.g-mis b,.g-dias i{position:relative;flex:none;width:26px;height:26px;border-radius:50%;border:1.5px solid var(--oro)}
.g-mis b::after,.g-dias i::after{content:"✓";position:absolute;inset:-1.5px;border-radius:50%;background:var(--oro);color:var(--sobre-oro,#16120b);display:grid;place-items:center;font:700 .86rem/1 var(--f-ui);transform:scale(0);animation:g-ok 6s cubic-bezier(.3,1.5,.5,1) infinite}
.g-mis div:nth-child(2) b::after{animation-delay:.9s}.g-mis div:nth-child(3) b::after{animation-delay:1.8s}
@keyframes g-ok{0%,10%{transform:scale(0)}20%,88%{transform:scale(1)}97%,100%{transform:scale(0)}}
.g-mis i{flex:1;height:11px;border-radius:6px;background:var(--linea)}
.g-mis div:nth-child(2) i{flex:.7}
.g-gemas{position:relative;width:204px;height:204px;animation:jg-gira 44s linear infinite}
.g-gemas>span{position:absolute;left:50%;top:50%;width:34px;height:34px;margin:-17px 0 0 -17px}
.g-gemas svg{width:100%;height:100%;display:block}
.g-orbita>span{width:26px;height:26px;margin:-13px 0 0 -13px;border-radius:50%;box-shadow:0 0 0 2px color-mix(in srgb,#000 40%,transparent),0 0 12px 1px color-mix(in srgb,var(--oro) 40%,transparent)}
.g-centro{width:84px;height:84px}
.g-centro svg{width:100%;height:100%;display:block}
.g-pers{display:grid;justify-items:center;gap:18px}
.g-pers>svg{width:66px;height:66px;color:var(--oro-vivo);animation:jg-brilla 1.9s ease-in-out infinite}
.g-dias{display:flex;gap:8px}
.g-dias i:nth-child(2)::after{animation-delay:.45s}.g-dias i:nth-child(3)::after{animation-delay:.9s}.g-dias i:nth-child(4)::after{animation-delay:1.35s}.g-dias i:nth-child(5)::after{animation-delay:1.8s}.g-dias i:nth-child(6)::after{animation-delay:2.25s}.g-dias i:nth-child(7)::after{animation-delay:2.7s}
.g-arbol{width:min(70%,230px)}
.g-arbol svg{width:100%;height:auto;display:block}
.g-menu{position:relative;display:grid;grid-template-columns:repeat(5,1fr);width:min(88%,340px);box-sizing:border-box;padding:6px;border-radius:20px;border:1px solid color-mix(in srgb,var(--oro) 42%,transparent);background:color-mix(in srgb,var(--hoja) 82%,transparent)}
.g-menu>span:not(.luz){position:relative;display:grid;justify-items:center;gap:4px;padding:8px 0 6px;color:var(--oro-vivo);font:500 .62rem/1 var(--f-ui)}
.g-menu svg{width:22px;height:22px}
.g-menu .luz{position:absolute;left:6px;top:6px;bottom:6px;width:calc((100% - 12px)/5);border-radius:14px;background:color-mix(in srgb,var(--oro) 26%,transparent);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--oro) 46%,transparent);animation:g-menu 7.5s cubic-bezier(.3,1.3,.5,1) infinite}
@keyframes g-menu{0%,14%{transform:translate3d(0,0,0)}20%,34%{transform:translate3d(100%,0,0)}40%,54%{transform:translate3d(200%,0,0)}60%,74%{transform:translate3d(300%,0,0)}80%,94%{transform:translate3d(400%,0,0)}100%{transform:translate3d(0,0,0)}}
.jg-enapp .jg-acciones{margin-top:10px}
@media (prefers-reduced-motion:reduce){.jg-escena *,.jg-escena *::after,.jg-yo .jg-emb::after,.jg-yo .jg-barra>i::after,.jg-llave::before,.jg-llave .jg-codigo span,.jg-muelle,.jg-tiembla{animation:none!important}.g-versos i::after{transform:none}.g-mis b::after,.g-dias i::after{transform:scale(1)}.g-xp{opacity:1}}
html[data-mov="no"] .jg-escena *,html[data-mov="no"] .jg-escena *::after,html[data-mov="no"] .jg-yo .jg-emb::after,html[data-mov="no"] .jg-yo .jg-barra>i::after,html[data-mov="no"] .jg-llave::before,html[data-mov="no"] .jg-llave .jg-codigo span,html[data-mov="no"] .jg-muelle,html[data-mov="no"] .jg-tiembla{animation:none!important}
/* medidor de avance mientras se lee: nivel y aro que se llena con cada verso validado */
.jg-med{position:fixed;z-index:61;left:calc(10px + env(safe-area-inset-left,0px));bottom:calc(12px + env(safe-area-inset-bottom,0px));width:46.4px;height:54.4px;display:block;text-decoration:none;-webkit-tap-highlight-color:transparent;filter:drop-shadow(0 7px 10px rgba(0,0,0,.62));--m1:#fbe7a6;--m2:#d1a640;--m3:#6f5016;--mg:rgba(209,166,64,.55)}
.jg-med[data-r="0"]{--m1:#f6d2ad;--m2:#bd844c;--m3:#5a381a;--mg:rgba(189,132,76,.5)}
.jg-med[data-r="1"]{--m1:#f5f7fb;--m2:#b6bfcc;--m3:#535b67;--mg:rgba(182,191,204,.5)}
.jg-med[data-r="3"]{--m1:#e6fbea;--m2:#56c48c;--m3:#1b5539;--mg:rgba(86,196,140,.5)}
.jg-med[data-r="4"]{--m1:#fff7d8;--m2:#f5c64e;--m3:#99560f;--mg:rgba(245,198,78,.72)}
.jg-med svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
.jg-med .arco{transition:stroke-dasharray .6s cubic-bezier(.2,.8,.2,1)}
.jg-med .barrido{animation:jg-med-barrido 9s ease-in-out infinite}
@keyframes jg-med-barrido{0%,62%{transform:translate3d(0,0,0)}100%{transform:translate3d(96px,0,0)}}
.jg-med .nvk{position:absolute;left:0;right:0;top:17.4px;text-align:center;font:600 .36rem/1 var(--f-ui);letter-spacing:.16em;text-indent:.16em;color:var(--m2);pointer-events:none}
.jg-med b{position:absolute;left:0;right:0;top:23.2px;text-align:center;font:600 1.09rem/1 var(--f-display,serif);font-variant-numeric:lining-nums tabular-nums;color:var(--m1);text-shadow:0 0 10px var(--mg),0 1px 0 rgba(0,0,0,.7);pointer-events:none}
.jg-med.dos b{font-size:.92rem;top:24.8px}
.jg-med.tres b{font-size:.76rem;top:26.4px}
.jg-med i{position:absolute;left:50%;bottom:calc(100% + 2px);transform:translate3d(-50%,0,0);font:600 .84rem/1 var(--f-ui);font-style:normal;color:var(--m1);opacity:0;pointer-events:none;white-space:nowrap;text-shadow:0 0 8px var(--mg),0 1px 6px rgba(0,0,0,.95)}
.jg-med.pulso{animation:jg-med-p .55s cubic-bezier(.3,1.6,.5,1)}
@keyframes jg-med-p{0%{transform:scale(1)}40%{transform:scale(1.1)}100%{transform:scale(1)}}
.jg-med.pulso i{animation:jg-med-mas 1.4s ease-out both}
@keyframes jg-med-mas{0%{opacity:0;transform:translate3d(-50%,6px,0)}18%{opacity:1;transform:translate3d(-50%,-3px,0)}75%{opacity:1}100%{opacity:0;transform:translate3d(-50%,-16px,0)}}
.jg-med .rayos{position:absolute;left:50%;top:52%;width:120px;height:120px;margin:-60px 0 0 -60px;border-radius:50%;background:repeating-conic-gradient(from 0deg,var(--mg) 0 5deg,transparent 5deg 20deg);-webkit-mask:radial-gradient(circle,transparent 17%,#000 30%,transparent 70%);mask:radial-gradient(circle,transparent 17%,#000 30%,transparent 70%);opacity:0;pointer-events:none;transform:scale(.5)}
.jg-med.sube .rayos{animation:jg-med-rayos 2.6s ease-out both}
@keyframes jg-med-rayos{0%{opacity:0;transform:scale(.4) rotate(0deg)}18%{opacity:1}100%{opacity:0;transform:scale(1.4) rotate(48deg)}}
.jg-med .hito{position:absolute;left:calc(100% + 6px);top:50%;display:inline-flex;align-items:center;height:34px;padding:0 16px;border-radius:999px;background:linear-gradient(180deg,var(--m1),var(--m2));color:#16120b;font:600 1rem/1 var(--f-display,serif);letter-spacing:.05em;white-space:nowrap;opacity:0;pointer-events:none;transform:translate3d(-8px,-50%,0);box-shadow:0 0 0 4px color-mix(in srgb,var(--m2) 26%,transparent),0 10px 26px -10px rgba(0,0,0,.9)}
.jg-med.sube .hito{animation:jg-med-hito 4.2s cubic-bezier(.2,.8,.2,1) both}
@keyframes jg-med-hito{0%{opacity:0;transform:translate3d(-12px,-50%,0) scale(.9)}10%{opacity:1;transform:translate3d(0,-50%,0) scale(1)}86%{opacity:1;transform:translate3d(0,-50%,0)}100%{opacity:0;transform:translate3d(6px,-50%,0)}}
.jg-med:active{transform:scale(.94)}
.jg-bonos{position:absolute;left:calc(100% + 5px);bottom:3px;display:flex;flex-direction:column-reverse;align-items:flex-start;gap:4px;pointer-events:none}
.jg-bono{display:inline-flex;align-items:center;height:19px;padding:0 7px;border-radius:999px;font:600 .66rem/1 var(--f-ui);letter-spacing:.02em;white-space:nowrap;color:var(--m1);background:linear-gradient(180deg,color-mix(in srgb,var(--m2) 34%,#0b0906),color-mix(in srgb,var(--m3) 40%,#070504));border:1px solid color-mix(in srgb,var(--m2) 55%,transparent);box-shadow:0 4px 10px -6px rgba(0,0,0,.9),inset 0 1px 0 rgba(255,255,255,.12)}
.jg-bono.b-dob{color:#fff3c4;border-color:rgba(245,198,78,.75);box-shadow:0 0 10px -2px rgba(245,198,78,.55),inset 0 1px 0 rgba(255,255,255,.18)}
.jg-bono.b-imp{color:#ffe1b0;border-color:rgba(255,170,80,.7)}
.jg-bono.b-sala{color:#d6f5e2;border-color:rgba(110,205,150,.7)}
.jg-med.sube .jg-bonos{opacity:0}
.jg-emb{position:relative}
.jg-lapiz{position:absolute;right:-3px;bottom:-3px;width:24px;height:24px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(180deg,var(--oro-vivo),var(--oro));color:var(--sobre-oro,#16120b);box-shadow:0 0 0 2px var(--hoja),0 4px 10px -4px rgba(0,0,0,.8);pointer-events:none}
.jg-lapiz svg{width:13px;height:13px}
.jg-lauro-p{margin-top:10px;display:grid;gap:6px}
.jg-lauro-p-t{display:flex;justify-content:space-between;gap:10px;align-items:baseline;font:500 .86rem/1.3 var(--f-ui)}
.jg-lauro-p-t b{color:var(--oro-vivo);font-weight:600;font-variant-numeric:tabular-nums}
.jg-med:focus-visible{outline:2px solid var(--m1);outline-offset:3px;border-radius:12px}
@media (prefers-reduced-motion:reduce){.jg-med .barrido,.jg-med.sube .rayos,.jg-med.pulso{animation:none}.jg-med .arco{transition:none}}
html[data-mov="no"] .jg-med .barrido,html[data-mov="no"] .jg-med.sube .rayos,html[data-mov="no"] .jg-med.pulso{animation:none}
html.con-modal .jg-med{opacity:0;pointer-events:none}
html.jg-con-med .adelante{bottom:calc(88px + env(safe-area-inset-bottom,0px))}
.jg-rota{display:inline-block}
@media print{.jg-med{display:none}}
@media (prefers-reduced-motion:reduce){.jg-med.pulso::after,.jg-med.pulso i,.jg-med.sube{animation:none!important}}
html[data-mov="no"] .g-versos i::after{transform:none}html[data-mov="no"] .g-mis b::after,html[data-mov="no"] .g-dias i::after{transform:scale(1)}
`;

  // ------------------------------------------------------------------ vistas
  const h = (...a) => A.h(...a);
  function cabecera(sub) {
    return h("div", { class: "panel-cab" },
      h("span", { class: "eyebrow", text: "El juego de Biblia Exacta" }),
      h("h1", { class: "texto", text: "Escudriña" }), h("p", { class: "jg-subt", text: "El Códice Viviente" }),
      h("p", { class: "jg-lema" }, h("span", { lang: "grc", text: "ἐρευνᾶτε τὰς γραφάς" }), " · «Escudriñan a las escrituras» (", h("a", { href: "#/JHN/5/l/39", text: "YÔḥānā́n 5:39" }), ")"),
      sub ? h("p", { class: "est-sub", text: sub }) : null);
  }
  const tarjeta = (titulo, icoSvg, ...hijos) => h("section", { class: "jg-tarjeta" }, titulo ? h("h2", {}, icoSvg || null, h("span", { text: titulo })) : null, ...hijos);
  function marco(cont, ...hijos) {
    cont.replaceChildren(h("div", { class: "in" }, h("section", { class: "panel jg" }, ...hijos)));
    const k = (S.sub || []).join("/") + "|" + (S.token ? 1 : 0);
    if (S.vistaAnim !== k) { S.vistaAnim = k; requestAnimationFrame(() => animarCifras(cont)); }
  }
  function repintar() { if (S.cont) vista(S.cont, S.sub); }
  async function vista(cont, sub) {
    estilos();
    if (R.lib || MED.el) salir(); // BiEx (10-nov-2026): el escudo de nivel no se queda detrás del menú de Escudriña
    S.cont = cont; S.sub = sub || [];
    const que = S.sub[0] || "";
    if (que === "i" && S.sub[1]) guardarInvitacion(S.sub[1]);
    if (!S.token) S.token = A.store.get("jg:t", null);
    if (!S.yo && S.token) S.yo = A.store.get("jg:yo", null);
    await config();
    if (cont !== S.cont) return;
    muelle(S.token && !S.codigoNuevo && que !== "buzon" ? SECC_DE[que] || "hoy" : null);
    if (S.codigoNuevo) return pintarCodigo(cont);
    if (que === "guia") return pintarGuia(cont);
    if (que === "propuestas" && !S.token) return pintarPropuestas(cont);
    if (que === "c" && S.sub[1]) A.store.set("jg:compInv", { c: String(S.sub[1]).toUpperCase().slice(0, 10), t: Date.now() });
    if (que === "sala" && S.sub[1]) A.store.set("jg:salaInv", { c: String(S.sub[1]).toUpperCase().slice(0, 8), t: Date.now() });
    if (que === "companias") return pintarCompanias(cont);
    if (que === "buzon") return pintarBuzon(cont); // el buzón lo protege la clave del equipo, no hace falta haber entrado
    if (!S.token) return pintarEntrada(cont);
    if (que === "clasificacion") return pintarClasificacion(cont);
    if (que === "prestigio") return pintarPrestigio(cont);
    if (que === "arbol") return pintarArbol(cont, /^[a-z0-9]{4,12}$/.test(S.sub[1] || "") ? S.sub[1] : null);
    if (que === "propuestas") return pintarPropuestas(cont);
    if (que === "liga") return pintarLiga(cont);
    if (que === "compania") return pintarCompania(cont);
    if (que === "c" && S.sub[1]) return pintarUnirCompania(cont, S.sub[1]);
    if (que === "sala" && S.sub[1]) return pintarSalaRuta(cont, S.sub[1]);
    retomarSala();
    if (que === "buzon") return pintarBuzon(cont);
    if (que === "cuenta") return pintarCuenta(cont);
    return pintarPanel(cont);
  }
  function vivoLinea() {
    const el = h("p", { class: "jg-vivo", "aria-live": "polite" });
    pedir("/vivo", { sin: true }).then((v) => {
      if (v.error) return;
      el.replaceChildren(...[v.leyendo > 0 ? h("span", {}, h("i"), h("b", { text: fmt(v.leyendo) }), v.leyendo === 1 ? " persona leyendo ahora" : " personas leyendo ahora") : null,
        v.versosHoy > 0 ? h("span", {}, h("b", { text: fmt(v.versosHoy) }), v.versosHoy === 1 ? " verso leído hoy" : " versos leídos hoy") : null,
        v.jugadores > 0 ? h("span", {}, h("b", { text: fmt(v.jugadores) }), v.jugadores === 1 ? " estudiante" : " estudiantes") : null].filter(Boolean));
    });
    return el;
  }

  // --- entrada (sin sesión)
  function pintarEntrada(cont) {
    document.title = "Escudriña · el juego de Biblia Exacta · BiEx";
    const cfg = S.cfg || {};
    if (cfg.sinServidor) {
      return marco(cont, cabecera(), tarjeta("Muy pronto", null, h("p", { text: "Escudriña abre muy pronto. Cuando abra, aquí podrás empezar con un apodo: cada verso que leas de verdad te dará experiencia, con misiones pequeñas cada día y hallazgos raros." }),
        h("a", { class: "btn oro", href: "#/" }, h("span", { text: "Seguir leyendo" }))));
    }
    const inv = invitacionPendiente();
    const franjaInv = inv ? h("div", { class: "jg-aviso" }, "Llegaste con una invitación: ", h("b", { text: "tus primeras 3 horas de lectura cuentan doble." })) : null;
    const pc = A.store.get("jg:compInv", null), ps = A.store.get("jg:salaInv", null);
    const franjaGrupo = (pc && pc.c) || (ps && ps.c) ? h("div", { class: "jg-aviso tenue" }, pc && pc.c ? "Te invitaron a una compañía de Escudriña. " : "Te invitaron a leer en compañía. ", "Empieza aquí y te llevamos.") : null;
    if (inv) pedir("/invitacion?c=" + encodeURIComponent(inv) + (abrirInvitacion(inv) ? "&a=1" : ""), { sin: true }).then((r) => { if (r.apodo && franjaInv) franjaInv.replaceChildren(h("b", { text: r.apodo }), " te invitó: tus primeras 3 horas de lectura cuentan doble (no vencen)."); });
    // empezar con un apodo
    const entrada = h("input", { type: "text", maxlength: "20", autocomplete: "nickname", placeholder: "Tu apodo (3 a 20 letras)", "aria-label": "Tu apodo", spellcheck: "false" });
    const pista = h("p", { class: "jg-pista", role: "status" });
    const btn = h("button", { class: "btn oro", type: "button" }, h("span", { text: "Comenzar" }));
    let tc = null, ultimo = "";
    entrada.addEventListener("input", () => {
      clearTimeout(tc); const a = entrada.value.trim(); pista.textContent = ""; pista.className = "jg-pista";
      if (a.length < 3) return;
      tc = setTimeout(async () => {
        ultimo = a; const r = await pedir("/apodo-libre?a=" + encodeURIComponent(a), { sin: true });
        if (ultimo !== a || r.error) return;
        pista.textContent = r.libre ? "Disponible" : r.detalle || "Ese apodo ya lo tiene otra persona.";
        pista.className = "jg-pista " + (r.libre ? "bien" : "mal");
      }, 380);
    });
    const crear = async () => {
      const apodo = entrada.value.trim();
      if (apodo.length < 3) { pista.textContent = "El apodo debe tener entre 3 y 20 caracteres."; pista.className = "jg-pista mal"; entrada.focus(); return; }
      btn.disabled = true;
      const r = await pedir("/cuenta/invitado", { metodo: "POST", cuerpo: { apodo, inv: invitacionPendiente(), disp: dispositivo() }, sin: true });
      btn.disabled = false;
      if (r.error) { pista.textContent = mensaje(r); pista.className = "jg-pista mal"; return; }
      guardarSesion(r.token, r.yo);
      S.codigoNuevo = r.codigo;
      repintar();
      cinematica(r.yo, arriba);
    };
    btn.addEventListener("click", crear);
    entrada.addEventListener("keydown", (e) => { if (e.key === "Enter") crear(); });
    // ya juego
    const codigo = h("input", { type: "text", maxlength: "24", autocomplete: "off", autocapitalize: "characters", placeholder: "XXXX-XXXX-XXXX-XXXX", "aria-label": "Tu código de acceso", spellcheck: "false" });
    const pistaC = h("p", { class: "jg-pista", role: "status" });
    const entrarCodigo = async () => {
      const c = codigo.value.trim(); if (!c) { codigo.focus(); return; }
      const r = await pedir("/cuenta/entrar", { metodo: "POST", cuerpo: { codigo: c }, sin: true });
      if (r.error) { pistaC.textContent = mensaje(r); pistaC.className = "jg-pista mal"; return; }
      guardarSesion(r.token, r.yo); A.avisar("¡Qué bueno verte de nuevo, " + r.yo.apodo + "!"); repintar();
    };
    codigo.addEventListener("keydown", (e) => { if (e.key === "Enter") entrarCodigo(); });
    const formCodigo = h("div", { class: "jg-form", hidden: true }, codigo, h("button", { class: "btn", type: "button", onclick: entrarCodigo }, h("span", { text: "Entrar" })));
    const opciones = h("div", { class: "jg-entrar" },
      h("button", { class: "btn", type: "button", onclick: () => { formCodigo.hidden = !formCodigo.hidden; if (!formCodigo.hidden) codigo.focus(); } }, ico("codigo"), h("span", { text: "Entrar con mi código" })),
      formCodigo, pistaC,
      puedeLlave() ? h("button", { class: "btn", type: "button", onclick: (e) => entrarConLlave(e.currentTarget, pistaC) }, ico("llave"), h("span", { text: "Entrar con una llave de acceso" })) : null,
      cfg.google ? h("button", { class: "btn", type: "button", onclick: () => conectar("google", "entrar", pistaC) }, ico("google"), h("span", { text: "Entrar con Google" })) : null,
      cfg.facebook ? h("button", { class: "btn", type: "button", onclick: () => conectar("facebook", "entrar", pistaC) }, ico("facebook"), h("span", { text: "Entrar con Facebook" })) : null);
    marco(cont, cabecera(),
      avisoEnApp(), franjaInv, franjaGrupo, tarjetaPrerregistro(entrada),
      tarjeta("Cómo se juega", null,
        h("p", { text: "Lee la Nueva Voluntad y cada verso que de verdad lees te da experiencia. Cada día tienes de 2 a 5 misiones pequeñas, a tu ritmo y sin culpa. Al leer puedes hallar, muy de vez en cuando, una de las doce piedras del fundamento o un lauro trenzado incorruptible." }),
        h("p", { class: "jg-mini", text: "Hay clasificaciones por ciudad, departamento o estado, país y continente, separadas por rango para que nadie compita en desventaja, y el prestigio local de cada ciudad. Cada persona que llega con tu enlace hace crecer tu árbol de la siembra. Puedes crear tu cuenta oficial, o sencillamente participar con un código de invitado, sin necesidad de correo, nombre ni contraseña." }),
        h("div", { class: "jg-acciones" }, h("a", { class: "btn", href: "#/escudrina/guia", onclick: () => { S.guiaPaso = 0; } }, ico("jugar"), h("span", { text: "Ver cómo se juega, paso a paso" })))),
      h("div", { class: "jg-dos" },
        tarjeta("Empezar con un apodo", null, h("div", { class: "jg-form" }, entrada, btn), pista,
          h("p", { class: "jg-mini", text: "Recibirás un código único para entrar desde otros dispositivos; después podrás asegurar tu avance con una llave de acceso o con Google." }),
          cfg.google || cfg.facebook ? h("div", { class: "jg-empezar-con" }, h("p", { class: "jg-mini", text: "O empieza de una vez con tu cuenta oficial: tu lugar queda asegurado desde el primer momento y no tienes que guardar ningún código." }),
            h("div", { class: "jg-entrar" },
              cfg.google ? h("button", { class: "btn", type: "button", onclick: () => conectar("google", "entrar", pista) }, ico("google"), h("span", { text: "Empezar con Google" })) : null,
              cfg.facebook ? h("button", { class: "btn", type: "button", onclick: () => conectar("facebook", "entrar", pista) }, ico("facebook"), h("span", { text: "Empezar con Facebook" })) : null)) : null,
          h("div", { class: "jg-aviso tenue jg-unica" }, h("b", { text: "Tu lugar es único. " }), "Solo hay 1440 Primicias y cada una pertenece a una sola persona: crea una sola cuenta, para que 1440 personas distintas tengan la suya. Guarda muy bien tu acceso o vincúlalo con Google o con una llave de acceso (huella o rostro): si se pierde, tu número de Primicia no vuelve.")),
        tarjeta("Ya juego", null, opciones)),
      tarjetaOpinion(false),
      notaConstruccion(),
      vivoLinea());
  }

  // --- código recién creado (se muestra una sola vez): la llave de acceso
  // BiEx (9-nov-2026, prueba en el teléfono): la vista sube de inmediato al código; «Continuar» explica qué falta en vez de
  // quedarse mudo; «Guardar en el teléfono» nunca falla (si el gestor de contraseñas no responde, queda la imagen de la
  // llave en el teléfono y el código copiado).
  const arriba = () => { try { window.scrollTo({ top: 0, left: 0, behavior: "instant" }); } catch (e) { window.scrollTo(0, 0); } };
  function descargarBlob(nombre, blob) {
    const u = URL.createObjectURL(blob), a = h("a", { href: u, download: nombre }); document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(u), 6000);
  }
  async function imagenLlave(codigo) {
    const y = S.yo || {}, W = 1080, H = 1350, cv = document.createElement("canvas"); cv.width = W; cv.height = H;
    const c = cv.getContext("2d"), T = "'BiEx Texto',Georgia,serif", D = "'BiEx Titular','BiEx Texto',Georgia,serif", U = "'BiEx Interfaz','Segoe UI',sans-serif", M = "ui-monospace,'SFMono-Regular',Menlo,Consolas,monospace";
    try { await Promise.all(["600 90px 'BiEx Titular'", "italic 400 46px 'BiEx Titular'", "400 40px 'BiEx Texto'", "500 28px 'BiEx Interfaz'"].map((f) => document.fonts.load(f))); } catch (e) { /* sin fuentes: respaldo */ }
    c.fillStyle = "#07070a"; c.fillRect(0, 0, W, H);
    const luz = (x, y0, r, a) => { const g = c.createRadialGradient(x, y0, 10, x, y0, r); g.addColorStop(0, "rgba(201,168,101," + a + ")"); g.addColorStop(1, "rgba(201,168,101,0)"); c.fillStyle = g; c.fillRect(0, 0, W, H); };
    luz(W / 2, 330, 720, 0.30); luz(140, 1230, 520, 0.10); luz(960, 1180, 460, 0.08);
    c.textAlign = "center"; c.textBaseline = "alphabetic";
    for (let i = 0; i < 46; i++) { const l = LETRAS[(i * 7) % LETRAS.length]; c.font = (26 + (i * 13) % 40) + "px " + T; c.fillStyle = "rgba(232,207,148," + (0.03 + ((i * 5) % 7) / 160).toFixed(3) + ")"; c.fillText(l, (i * 233) % W, 60 + (i * 397) % (H - 80)); }
    const rr = (x, y0, w, hh, r) => { c.beginPath(); c.moveTo(x + r, y0); c.arcTo(x + w, y0, x + w, y0 + hh, r); c.arcTo(x + w, y0 + hh, x, y0 + hh, r); c.arcTo(x, y0 + hh, x, y0, r); c.arcTo(x, y0, x + w, y0, r); c.closePath(); };
    c.strokeStyle = "rgba(201,168,101,.62)"; c.lineWidth = 2.5; rr(44, 44, W - 88, H - 88, 38); c.stroke();
    c.strokeStyle = "rgba(201,168,101,.22)"; c.lineWidth = 1; rr(62, 62, W - 124, H - 124, 28); c.stroke();
    const txt = (t, y0, f, col, ls) => { c.font = f; c.fillStyle = col; try { c.letterSpacing = ls || "0px"; } catch (e) { /* ignorar */ } c.fillText(t, W / 2, y0); try { c.letterSpacing = "0px"; } catch (e) { /* ignorar */ } };
    const ajustar = (t, max, f0, tam) => { let s = tam; c.font = f0.replace("{t}", s); while (c.measureText(t).width > max && s > 20) { s -= 2; c.font = f0.replace("{t}", s); } return f0.replace("{t}", s); };
    txt("ESCUDRIÑA", 170, "600 76px " + D, "#e8cf94", "14px");
    txt("El Códice Viviente", 228, "italic 400 44px " + D, "#c9a865");
    const col = COLORES[(y.emb && y.emb.c) || 0] || COLORES[0], l = (y.emb && y.emb.l) || "α";
    c.beginPath(); c.arc(W / 2, 392, 86, 0, 2 * Math.PI); c.fillStyle = "#121216"; c.fill(); c.lineWidth = 6; c.strokeStyle = col; c.stroke();
    c.font = "500 104px " + (/[֐-׿]/.test(l) ? "'Frank Ruhl Libre'," + T : T); c.fillStyle = col; c.fillText(l, W / 2, 428);
    txt(y.apodo || "", 548, ajustar(y.apodo || "", W - 260, "600 {t}px " + D, 62), "#f3ecdc");
    if (y.fundador) txt("Primicia n.º " + fmt(y.n) + " de 1440", 606, "500 32px " + U, "#c9a865", "3px");
    txt("MI LLAVE DE ACCESO", 716, "600 34px " + U, "#e8cf94", "8px");
    c.fillStyle = "rgba(0,0,0,.5)"; rr(110, 752, W - 220, 150, 26); c.fill(); c.strokeStyle = "rgba(232,207,148,.8)"; c.lineWidth = 2.5; c.stroke();
    txt(codigo, 850, ajustar(codigo, W - 300, "600 {t}px " + M, 64), "#f3e3b5", "3px");
    txt("Con este código entras a tu avance", 978, "400 38px " + T, "#ece5d6");
    txt("desde cualquier teléfono o computadora.", 1028, "400 38px " + T, "#ece5d6");
    txt("Guárdala solo para ti: quien tenga este código", 1112, "italic 400 32px " + T, "#bdb4a3");
    txt("puede entrar a tu avance.", 1156, "italic 400 32px " + T, "#bdb4a3");
    txt("bibliaexacta.pages.dev/escudrina", 1250, "500 32px " + U, "#c9a865", "2px");
    return new Promise((ok) => cv.toBlob((b) => ok(b), "image/png"));
  }
  function verImagenLlave(blob) {
    const u = URL.createObjectURL(blob);
    A.abrirModal(() => A.cajaModal(A.cabModal("Tu llave de acceso", "Escudriña"), h("div", { class: "jg-cel" },
      h("img", { class: "jg-img", src: u, alt: "Imagen con tu apodo y tu código de acceso", width: "1080", height: "1350" }),
      h("p", { class: "jg-mini", text: "Mantén pulsada la imagen y elige «Guardar imagen» o «Descargar imagen»." }))));
  }
  function pintarCodigo(cont) {
    const c = S.codigoNuevo, y = S.yo || {}, e = y.emb || {};
    document.title = "Tu llave de acceso · Escudriña · BiEx";
    const texto = "Escudriña · Biblia Exacta\nApodo: " + (y.apodo || "") + "\nCódigo de acceso: " + c + "\n\nGuárdalo: es tu llave para entrar desde otros dispositivos mientras no asegures tu avance.\n" + PUBLICO + "/escudrina";
    let guardado = false;
    const pasos = h("ol", { class: "jg-pasos", "aria-label": "Tres pasos para continuar" }, h("li", { class: "ahora", text: "Guarda tu código" }), h("li", { text: "Marca la casilla" }), h("li", { text: "Continúa" }));
    const [p1, p2, p3] = pasos.children;
    const porque = h("p", { class: "jg-porque", role: "alert", hidden: true });
    const casilla = h("input", { type: "checkbox" });
    const etiqueta = h("label", { class: "jg-check" }, casilla, h("span", { text: "Ya guardé mi código" }));
    const sigue = h("button", { class: "btn oro jg-grande jg-espera", type: "button", "aria-disabled": "true" }, h("span", { text: "Continuar" }));
    const estado = () => {
      const si = casilla.checked;
      p1.className = guardado || si ? "ya" : "ahora"; p2.className = si ? "ya" : guardado ? "ahora" : ""; p3.className = si ? "ahora" : "";
      sigue.classList.toggle("jg-espera", !si); sigue.setAttribute("aria-disabled", String(!si)); etiqueta.classList.toggle("si", si);
      if (si) { porque.hidden = true; etiqueta.classList.remove("jg-falta"); }
    };
    const hecho = (btn) => { guardado = true; if (btn) btn.classList.add("hecho"); vibrar(12); estado(); };
    casilla.addEventListener("change", () => { vibrar(10); estado(); });
    sigue.addEventListener("click", () => {
      if (!casilla.checked) {
        // no se queda mudo: dice qué falta y lo señala (BiEx: personas con dislexia, TDAH o poca práctica con la tecnología)
        porque.hidden = false;
        porque.replaceChildren(h("b", { text: "Falta un paso. " }), guardado
          ? "Marca la casilla «Ya guardé mi código» y vuelve a tocar «Continuar». Así confirmas que lo tienes a salvo."
          : "Primero guarda tu código con uno de los botones de arriba (Copiar, Guardar imagen…). Después marca la casilla «Ya guardé mi código». Sin ese código no podrías volver a entrar desde otro teléfono.");
        etiqueta.classList.add("jg-falta"); etiqueta.classList.remove("jg-tiembla"); void etiqueta.offsetWidth; etiqueta.classList.add("jg-tiembla");
        try { etiqueta.scrollIntoView({ block: "center", behavior: sinAnim() ? "auto" : "smooth" }); } catch (er) { /* ignorar */ }
        vibrar([30, 50, 30]);
        return;
      }
      S.codigoNuevo = null; S.codigoArriba = null; vibrar(15);
      const guia = !A.store.get("jg:guia", 0);
      if (guia) S.guiaPaso = 0;
      A.irA(guia ? "#/escudrina/guia" : "#/escudrina"); repintar(); arriba();
    });
    const accion = (ic, t, d, fn) => { const b = h("button", { class: "btn", type: "button" }, ico(ic), h("span", { text: t }), h("small", { text: d })); b.addEventListener("click", () => fn(b)); return b; };
    const guardarImg = async (b, callado) => {
      let blob = null; try { blob = await imagenLlave(c); } catch (er) { blob = null; }
      if (!blob) { if (!callado) A.avisar("No se pudo crear la imagen; usa Copiar"); return false; }
      if (A.sinDescargas && A.sinDescargas()) verImagenLlave(blob); else descargarBlob("escudrina-mi-llave.png", blob);
      hecho(b);
      if (!callado) A.avisar("Imagen guardada en tu teléfono (Descargas o Galería)");
      return true;
    };
    const guardarTel = async (b) => {
      let ok = false;
      if (window.PasswordCredential && !EN_APP) { try { await navigator.credentials.store(new window.PasswordCredential({ id: y.apodo || "Escudriña", password: c, name: "Escudriña · Biblia Exacta" })); ok = true; } catch (er) { ok = false; } }
      if (ok) { hecho(b); return A.avisar("Tu teléfono te ofrece guardarlo en su gestor de contraseñas: acepta «Guardar»"); }
      // respaldo que no depende del navegador: la imagen de la llave queda en el teléfono y el código, copiado
      const img = await guardarImg(b, true);
      let cop = false; try { if (navigator.clipboard && navigator.clipboard.writeText) { await navigator.clipboard.writeText(c); cop = true; } } catch (er) { cop = false; }
      if (!img && !cop) return copiar(c, "Código copiado: pégalo en tus notas");
      hecho(b);
      A.avisar(img ? "Guardamos la imagen de tu llave en el teléfono" + (cop ? " y copiamos el código" : "") : "Código copiado: pégalo en tus notas");
    };
    const partes = String(c).split("-"), codigoEl = h("div", { class: "jg-codigo", "data-codigo": "", tabindex: "-1", role: "group", "aria-label": "Tu código de acceso" });
    partes.forEach((g, i) => { if (i) codigoEl.append("-"); codigoEl.append(h("span", { text: g })); });
    marco(cont,
      h("section", { class: "jg-tarjeta jg-llave" },
        h("span", { class: "jg-emb", "aria-hidden": "true" }, emblema(e.l, e.c, marcoVisible(y))),
        h("p", { class: "jg-bienv" }, "Te damos la bienvenida, ", h("b", { text: y.apodo || "" })),
        y.fundador ? h("div", { class: "jg-chips" }, h("span", { class: "jg-chip", text: "Primicia n.º " + fmt(y.n) + " de 1440" })) : null,
        h("h2", {}, ico("llave"), h("span", { text: "Tu código de acceso" })),
        h("p", { text: "Con este código entras a tu avance desde cualquier otro teléfono o computadora. Guárdalo ahora: solo se muestra esta vez." }),
        codigoEl, pasos,
        h("div", { class: "jg-guardar" },
          accion("copiar", "Copiar", "Pégalo en tus notas", (b) => { copiar(c, "Código copiado"); hecho(b); }),
          accion("imagen", "Guardar imagen", "Queda en tu teléfono", (b) => guardarImg(b, false)),
          navigator.share ? accion("compartir", "Enviármelo", "WhatsApp, correo…", (b) => { compartir("Mi código de Escudriña", texto, PUBLICO + "/escudrina"); hecho(b); }) : null,
          accion("llave", "Guardar en el teléfono", "Gestor de contraseñas", guardarTel)),
        (() => { const b = h("button", { class: "jg-enlace-b", type: "button", text: "Descargar como archivo de texto" }); b.addEventListener("click", () => { descargarTexto("escudrina-codigo.txt", texto); hecho(null); }); return b; })(),
        h("div", { class: "jg-aviso" }, h("b", { text: "Guárdalo bien. " }), "Este código es tu única llave mientras no asegures tu avance. Si lo pierdes antes de vincular tu perfil con una llave de acceso o con Google, tu avance no se podrá recuperar: no guardamos datos personales para reconocerte."),
        y.fundador ? h("div", { class: "jg-aviso tenue" }, h("b", { text: "Eres la Primicia n.º " + fmt(y.n) + " de 1440. " }), "Ese número es solo tuyo y no se repite: si pierdes el acceso, no vuelve. Por eso conviene vincular tu cuenta de una vez.") : null),
      tarjetaAsegurar(true),
      h("section", { class: "jg-tarjeta jg-llave-fin" }, etiqueta, porque, sigue));
    // la vista sube al código en el acto (quien se registra desde abajo de la página no lo vería)
    if (S.codigoArriba !== c) { S.codigoArriba = c; arriba(); requestAnimationFrame(() => { arriba(); try { codigoEl.focus({ preventScroll: true }); } catch (er) { /* ignorar */ } }); }
  }

  // --- asegurar el avance (llave de acceso, Google, Facebook)
  function tarjetaAsegurar(ahora) {
    const y = S.yo || {}, v = y.vinculado || {}, cfg = S.cfg || {};
    if (y.asegurado && !ahora) return null;
    const pista = h("p", { class: "jg-pista", role: "status" });
    const btns = h("div", { class: "jg-entrar" },
      puedeLlave() ? h("button", { class: "btn", type: "button", onclick: (e) => registrarLlave(e.currentTarget, pista) }, ico("llave"), h("span", { text: v.llave ? "Añadir otra llave de acceso" : "Crear una llave de acceso (huella, rostro o PIN)" })) : null,
      cfg.google && !v.google ? h("button", { class: "btn", type: "button", onclick: () => conectar("google", "vincular", pista) }, ico("google"), h("span", { text: "Vincular mi cuenta de Google" })) : null,
      cfg.facebook && !v.facebook ? h("button", { class: "btn", type: "button", onclick: () => conectar("facebook", "vincular", pista) }, ico("facebook"), h("span", { text: "Vincular mi cuenta de Facebook" })) : null);
    if (!btns.children.length) return null;
    return tarjeta(y.asegurado ? "Más formas de entrar" : "Asegura tu avance", ico("llave"),
      y.asegurado ? null : h("p", { text: "Con una llave de acceso no das ningún dato: tu teléfono la guarda y la sincroniza con tu cuenta de Google o de Apple. Con ella, o con Google, tu avance ya no depende del código." }),
      btns, pista);
  }

  // --- panel (con sesión)
  const textoMision = (m) => ({
    versos: "Lee " + plural(m.meta, "verso", "versos"), capitulo: m.meta === 1 ? "Completa un capítulo" : "Completa " + m.meta + " capítulos",
    libros: "Lee en " + m.meta + " libros distintos", vida: "Lee " + plural(m.meta, "verso", "versos") + " de los relatos de la vida de YēshŪ́ʿa",
    cartas: "Lee " + plural(m.meta, "verso", "versos") + " de las cartas", nuevos: "Lee " + plural(m.meta, "verso", "versos") + " que nunca habías leído",
    repaso: "Repasa " + plural(m.meta, "verso", "versos") + " que ya leíste", preguntas: "Acierta " + plural(m.meta, "pregunta", "preguntas") + " en las pruebas",
    minutos: "Lee durante " + plural(m.meta, "minuto", "minutos") }[m.tipo] || "Misión");
  function tarjetaPerfil(y) {
    const [l, c] = [y.emb && y.emb.l, y.emb && y.emb.c];
    const pct = y.xpSig ? Math.max(0, Math.min(100, (100 * y.xpNivel) / y.xpSig)) : 0;
    const chips = [];
    if (y.fundador) chips.push(h("span", { class: "jg-chip", title: "Las 1440 primeras cuentas de Escudriña", text: "Primicia n.º " + fmt(y.n) }));
    if (y.marco) chips.push(h("span", { class: "jg-chip", title: "Escalera del Sembrador: personas que invitaste y ya leen", text: marcos()[y.marco - 1][1] + (y.vuelta >= 1 ? " · " + plural(y.vuelta, "vuelta", "vueltas") : "") }));
    if (y.mult > 1) chips.push(h("span", { class: "jg-chip", title: "Experiencia multiplicada", text: "Experiencia ×" + String(y.mult).replace(".", ",") }));
    if (y.dob > 0) chips.push(h("span", { class: "jg-chip tenue", title: "Se gasta solo mientras lees y no vence", text: "Experiencia doble · " + horas(y.dob) + " de lectura" }));
    if (y.imp && y.imp.ms > 0) chips.push(h("span", { class: "jg-chip tenue", title: "Se gasta solo mientras lees y no vence", text: "Impulso ×" + String(y.imp.f).replace(".", ",") + " · " + horas(y.imp.ms) + " de lectura" }));
    if (y.enTope) chips.push(h("span", { class: "jg-chip tenue", title: "Cada mes se abren de 2 a 7 niveles nuevos", text: "Nivel tope del mes · reserva " + fmt(y.reserva) }));
    const t = tarjeta(null, null, h("div", { class: "jg-perfil" },
      h("a", { class: "jg-emb", href: "#/escudrina/cuenta", "aria-label": "Editar tu emblema y tu apodo", title: "Editar" }, emblema(l, c, marcoVisible(y), y.foto ? y.inv + "." + y.foto : ""),
        h("span", { class: "jg-lapiz", "aria-hidden": "true" }, A.svg('<path d="M4 20l1.2-4.6L15.8 4.8a2 2 0 0 1 2.8 0l.6.6a2 2 0 0 1 0 2.8L8.6 18.8z" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/><path d="M13.6 7l3.4 3.4" fill="none" stroke="currentColor" stroke-width="1.9"/>'))),
      h("div", { class: "jg-pid" }, h("p", { class: "jg-nombre", text: y.apodo }), h("div", { class: "jg-rango", text: y.rangoNombre + " · nivel " + y.nivel })),
      h("div", { class: "jg-nv", title: "Tu nivel" }, h("b", { text: String(y.nivel) }), h("small", { text: "nivel" }))),
      // los distintivos van en su propia fila, centrados: ya no chocan con el sello del nivel (simetría, BiEx 10-nov-2026)
      chips.length ? h("div", { class: "jg-chips jg-chips-yo" }, chips) : null,
      h("div", {}, h("div", { class: "jg-barra", role: "progressbar", "aria-valuemin": "0", "aria-valuemax": String(y.xpSig), "aria-valuenow": String(y.xpNivel), "aria-label": "Experiencia hacia el nivel siguiente" }, h("i", { style: "width:" + pct.toFixed(1) + "%" })),
        h("div", { class: "jg-nivel" }, h("span", { text: y.enTope ? "Llegaste al nivel tope de este mes (" + y.tope + "): el 1.º del mes se abren de 2 a 7 niveles nuevos y tu reserva sube contigo" : fmt(y.xpNivel) + " de " + fmt(y.xpSig) + " para el nivel " + (y.nivel + 1) }), h("span", { text: fmt(y.xp) + " en total" }))));
    t.classList.add("jg-yo");
    return t;
  }
  function botonSeguir() {
    const u = A.ultimo && A.ultimo();
    const hh = u ? u.h : "#/MAT/1";
    return h("a", { class: "btn oro jg-grande", href: hh }, A.svg(A.ICO.seguir), h("span", {}, u ? "Seguir leyendo" : "Empezar a leer", h("small", { text: u ? u.t : "Mattáy 1" })));
  }
  function tarjetaMisiones(y) {
    const lista = h("ul", { class: "jg-misiones" }, (y.mis || []).map((m, i) => h("li", { class: "jg-mision" + (m.hecha ? " hecha" : "") },
      h("span", { class: "jg-ok", "aria-hidden": "true" }, ico("marca")),
      h("div", {}, h("div", { class: "jg-mt", text: textoMision(m) }), h("div", { class: "jg-barra", "aria-hidden": "true" }, h("i", { style: "width:" + Math.min(100, (100 * m.prog) / m.meta).toFixed(0) + "%" })),
        h("span", { class: "jg-mini", text: fmt(m.prog) + " de " + fmt(m.meta) + (m.hecha ? " · cumplida" : "") })),
      h("div", {}, h("div", { class: "jg-pr", text: "+" + m.xp }), h("div", { class: "jg-pr", style: "opacity:.75", text: "+" + m.dr + " dr." }),
        !m.hecha && !y.cambio && i > 0 ? h("button", { class: "jg-cambiar", type: "button", onclick: () => cambiarMision(i) }, "Cambiar") : null))));
    return tarjeta("Misiones de hoy", ico("marca"), lista,
      h("p", { class: "jg-mini", text: y.completo ? "¡Cumpliste todas las misiones de hoy! Mañana habrá otras." : "Todas a tu ritmo. Al cumplirlas todas ganas 500 de experiencia y 10 dracmas más." + (y.cambio ? "" : " Puedes cambiar una misión por día.") }));
  }
  async function cambiarMision(i) {
    const r = await pedir("/mision/cambiar", { metodo: "POST", cuerpo: { i } });
    if (r.error) return A.avisar(r.error === "ya_cambiada" ? "Ya cambiaste una misión hoy" : mensaje(r));
    actualizarYo(r.yo); repintar();
  }
  function tarjetaHoy(y) {
    return tarjeta("Hoy", null, h("div", { class: "jg-cifras" },
      h("div", {}, h("b", { text: fmt(y.hoy.versos) }), h("span", { text: "versos" })),
      h("div", {}, h("b", { text: fmt(Math.floor((y.hoy.mr || y.hoy.ms || 0) / MIN)) }), h("span", { text: "minutos" })),
      h("div", {}, h("b", { text: fmt(y.hoy.xp) }), h("span", { text: "experiencia" }))),
      y.pers > 0 ? h("p", { class: "jg-mini" }, A.svg(ICO_JG.llama, "0 0 24 24"), " Perseverancia: ", h("b", { text: plural(y.pers, "día", "días") }), " · tu mejor marca: " + plural(y.persMejor, "día", "días") +
        " · descansos guardados: " + y.desc + " de 3. Cada 7 días seguidos ganas un descanso que cubre un día sin lectura.")
        : h("p", { class: "jg-mini" }, A.svg(ICO_JG.llama, "0 0 24 24"), " Tu perseverancia empieza con el primer verso de hoy." + (y.persMejor ? " Tu mejor marca: " + plural(y.persMejor, "día", "días") + "." : "") + " Cada 7 días seguidos ganas un descanso que cubre un día sin lectura."));
  }
  // Lectura por confirmar (BiEx, 10-nov-2026): reparto 60/40, lista desplegable de los versos y fórmula de corrección
  function tarjetaPorConfirmar(y, enHoy) {
    const loc = pendientes().reduce((a, x) => a + x[1].filter((p) => !p[2]).length, 0), srv = (y.pc && y.pc.n) || 0, n = srv + loc;
    if (!n) return null;
    if (enHoy) {
      // BiEx (10-nov-2026): el aviso cansa; en Hoy sale como mucho dos veces al día (en Tesoro sigue siempre a la mano)
      const d = new Date().toDateString(), k = A.store.get("jg:pcVisto", null) || {};
      if (k.d !== d) { k.d = d; k.n = 0; }
      if (!S.pcContado) { if (k.n >= 2) return null; k.n++; A.store.set("jg:pcVisto", k); S.pcContado = true; }
    }
    const q = (y.lect && y.lect.q) || [0.6, 0.85], pq = (x) => Math.round(x * 100) + " %";
    const lista = h("div", { class: "jg-pc-lista" }, h("p", { class: "jg-mini", text: "Cargando los versos…" }));
    const det = h("details", { class: "jg-pc" }, h("summary", {}, h("span", { text: "Ver los versos por confirmar" }), h("small", { text: plural(n, "verso", "versos") })), lista);
    det.addEventListener("toggle", () => { if (det.open && !det.dataset.ok) { det.dataset.ok = "1"; listaPend(lista); } });
    const todo = h("button", { class: "btn oro", type: "button", onclick: async (ev) => {
      const b = ev.currentTarget; b.disabled = true;
      const k = confirmarTodo(); const r = srv ? await confirmarServidor({ todo: true }) : null;
      const total = k + ((r && r.conf) || 0);
      A.avisar(total ? "Confirmado: " + plural(total, "verso", "versos") + (r && r.xp ? " · +" + fmt(r.xp) + " de experiencia" : "") : "Nada por confirmar");
      if (r || k) repintar(); else b.disabled = false;
    } }, ico("marca"), h("span", { text: "Confirmar todo" }));
    const nada = h("button", { class: "btn", type: "button", onclick: async (ev) => {
      ev.currentTarget.disabled = true;
      A.store.set("jg:pend", (() => { const o = A.store.get("jg:pend", null) || {}; for (const lc of Object.keys(o)) { o[lc].v = o[lc].v.filter((p) => p[2]); if (!o[lc].v.length) delete o[lc]; } return Object.keys(o).length ? o : null; })());
      if (R.lib) { R.pend = cargarPend(R.lib + "." + R.cap); estadoSellos(); }
      const r = srv ? await confirmarServidor({ noTodo: true }) : null;
      A.avisar("Gracias por tu sinceridad: tus estadísticas quedan más exactas" + (r && r.no ? " (" + plural(r.no, "verso", "versos") + ")" : ""));
      repintar();
    } }, h("span", { text: "No los leí" }));
    return tarjeta("Lectura por confirmar", ico("marca"),
      h("p", {}, "Leíste ", h("b", { text: plural(n, "verso", "versos") }), " a tu ritmo: ya sumaron el 60 % de su experiencia. Confírmalos con «Leí hasta aquí ✓» o aquí, uno por uno, y recibe el 40 % que falta" + (y.pc && y.pc.x ? " (+" + fmt(y.pc.x) + ")" : "") + "."),
      h("div", { class: "jg-acciones" }, todo, nada), det,
      h("p", { class: "jg-mini", text: "Lo que no confirmes en 7 días se acredita según tu estimación de lectura real (" + pq(q[0]) + " a ritmo justo, " + pq(q[1]) + " a ritmo holgado): una fórmula bayesiana que aprende de tus respuestas «Lo leí» y «No lo leí»." }));
  }
  const textoVerso = async (lib, cap, v) => {
    try { const d = await A.cargar("datos/libros/" + lib + ".json"), x = ((d.caps || {})[cap] || []).find((z) => z.v === v); const t = x ? String(x.o || x.t || "") : ""; return t.length > 170 ? t.slice(0, 168).replace(/\s+\S*$/, "") + "…" : t; }
    catch (e) { return ""; }
  };
  async function listaPend(cont) {
    const r = await pedir("/lectura/pendientes");
    const loc = pendientes().map(([lc, vs]) => [lc, vs.filter((p) => !p[2])]).filter((x) => x[1].length);
    if (r.error && !loc.length) return cont.replaceChildren(h("p", { class: "jg-mini", text: mensaje(r) }));
    const grupos = new Map();
    for (const [lc, dias, vs] of r.pc || []) grupos.set(lc, { dias, vs: vs.map((x) => ({ v: x[0], x: x[1], srv: true })) });
    for (const [lc, vs] of loc) { const g = grupos.get(lc) || { dias: 7, vs: [] }; for (const p of vs) if (!g.vs.some((z) => z.v === p[0])) g.vs.push({ v: p[0], x: 0, srv: false, ms: p[1] }); grupos.set(lc, g); }
    if (!grupos.size) return cont.replaceChildren(h("p", { class: "jg-mini", text: "No queda nada por confirmar." }));
    const filas = [];
    for (const [lc, g] of grupos) {
      const [lib, cap] = lc.split("."), cab = h("div", { class: "jg-pc-cab" },
        h("a", { href: "#/" + lib + "/" + cap, text: A.nombreLibro(lib) + " " + cap }), h("small", { text: g.dias <= 1 ? "vence hoy" : "vence en " + plural(g.dias, "día", "días") }),
        h("button", { class: "btn chico", type: "button", onclick: async (ev) => { ev.currentTarget.disabled = true; await responder(lc, g.vs.map((z) => z), true); } }, h("span", { text: "Confirmar el capítulo" })));
      const ul = h("ul", { class: "jg-pc-vs" });
      g.vs.sort((a, b) => a.v - b.v);
      for (const z of g.vs) {
        const tx = h("span", { class: "tx", text: "…" });
        textoVerso(lib, +cap, z.v).then((t) => { tx.textContent = t || ""; });
        z.li = h("li", {}, h("a", { class: "rf", href: "#/" + lib + "/" + cap + "/l/" + z.v, text: cap + ":" + z.v }), tx,
          h("span", { class: "bt" }, h("button", { class: "si", type: "button", title: "Lo leí", "aria-label": "Lo leí: " + cap + ":" + z.v, onclick: () => responder(lc, [z], true) }, "✓"),
            h("button", { class: "no", type: "button", title: "No lo leí", "aria-label": "No lo leí: " + cap + ":" + z.v, onclick: () => responder(lc, [z], false) }, "✗")));
        ul.append(z.li);
      }
      filas.push(h("section", {}, cab, ul));
    }
    cont.replaceChildren(...filas, h("p", { class: "jg-mini", text: "✓ Lo leí: recibes el 40 % que falta. ✗ No lo leí: se descuenta de tus estadísticas y la estimación aprende de tu respuesta (lo ganado no se quita)." }));
    async function responder(lc, zs, si) {
      const [lib, cap] = lc.split("."), srv = zs.filter((z) => z.srv).map((z) => z.v), dev = zs.filter((z) => !z.srv);
      for (const z of zs) if (z.li) z.li.classList.add("ido");
      if (si && dev.length) { for (const z of dev) R.cola.push([lib, +cap, z.v, z.ms, 2]); guardarCola(true); }
      if (dev.length) { const o = A.store.get("jg:pend", null) || {}; if (o[lc]) { o[lc].v = o[lc].v.filter((p) => !dev.some((z) => z.v === p[0])); if (!o[lc].v.length) delete o[lc]; A.store.set("jg:pend", Object.keys(o).length ? o : null); } }
      if (srv.length) await confirmarServidor(si ? { si: [[lc, srv]] } : { no: [[lc, srv]] });
      else if (si && dev.length) enviar(false);
      setTimeout(() => { for (const z of zs) if (z.li) z.li.remove(); }, 380);
    }
  }
  function tarjetaHallazgos(y) {
    const p = y.piedras || [], n = p.filter((x) => x > 0).length;
    return tarjeta("Hallazgos", null,
      h("div", { class: "jg-piedras" }, PIEDRAS.map((pd, i) => h("button", { class: "jg-piedra", type: "button", "aria-label": pd[3] + " [" + pd[1] + "]" + (p[i] ? ", hallada " + p[i] + (p[i] === 1 ? " vez" : " veces") : ", aún no hallada"),
        onclick: () => verPiedra(i, p[i] || 0) }, gema(i, p[i] > 0), h("span", { text: pd[3] }), p[i] > 1 ? h("b", { text: "×" + p[i] }) : null))),
      h("div", { class: "jg-tesoros" },
        h("span", { class: "jg-tesoro" }, lauro(), h("span", { text: (y.lauros && y.lauros.trenzado ? plural(y.lauros.trenzado, "lauro trenzado", "lauros trenzados") : "Ningún lauro trenzado todavía") })),
        h("span", { class: "jg-tesoro" }, dracma(), h("span", { text: plural(y.dr, "dracma", "dracmas") }))),
      y.lauroP != null ? h("div", { class: "jg-lauro-p", title: "Es una estimación: cada hallazgo se sortea en el servidor" },
        h("div", { class: "jg-lauro-p-t" }, h("span", { text: "Lauro trenzado en tu próximo hallazgo" }), h("b", { text: "≈ " + String(Math.round(y.lauroP * 1000) / 10).replace(".", ",") + " %" })),
        h("div", { class: "jg-barra", "aria-hidden": "true" }, h("i", { style: "width:" + Math.min(100, (y.lauroP / 0.6) * 100).toFixed(1) + "%" })),
        h("p", { class: "jg-mini", text: "Estimación: sube con cada piedra que hallas y vuelve a empezar al conseguir un lauro." })) : null,
      h("p", { class: "jg-mini", text: n === 12 ? "Reuniste las doce piedras: tu experiencia vale un 5 % más para siempre." : "Piedras del fundamento: " + n + " de 12 (Ḥăzṓn Hiṯgallū́ṯ 21:19-20). Cada verso leído puede revelar una, muy de vez en cuando." }));
  }
  function verPiedra(i, veces) {
    const pd = PIEDRAS[i];
    A.abrirModal(() => A.cajaModal(A.cabModal("Las doce piedras", "Ḥăzṓn Hiṯgallū́ṯ 21:19-20"), h("div", { class: "jg-cel" },
      h("div", { class: "arte" }, gema(i, veces > 0)), h("h3", { text: piedraNombre(i) }), h("p", { class: "jg-mini", lang: "grc", text: pd[0] }),
      h("p", { text: "La " + ORDINAL[i] + " piedra del fundamento del muro de la ciudad. " + (veces ? "La hallaste " + plural(veces, "vez", "veces") + "." : "Aún no la hallas: sigue leyendo.") }),
      h("a", { class: "btn chico", href: "#/REV/21/l/" + (i < 4 ? 19 : 20) }, h("span", { text: "Leer el verso" })))));
  }
  const NOVEDAD = { piedra: (a) => "Hallaste " + piedraNombre(a.i) + ".", lauro: () => "Hallaste un lauro trenzado incorruptible.", unido: (a) => a.a + " llegó con tu invitación.", leyo: (a) => a.a + " leyó sus primeros 20 versos: +" + a.xp + ".",
    conf: (a) => a.a + " confirmó su lugar: sumas un peldaño de tu escalera.", marco: (a) => "¡Subiste al peldaño «" + ((marcos()[a.m - 1] || [])[1] || "") + "» de la escalera del Sembrador" + (a.v > 1 ? " (vuelta " + a.v + ")" : "") + "!" + (a.h ? " +" + a.h + " h de experiencia doble." : ""),
    lanzamiento: (a) => "¡Escudriña abrió! " + (a.p ? "Conservaste el " + String(a.p).replace(".", ",") + " % de tu avance de práctica y, por inscribirte antes, recibiste " + a.h + " horas de experiencia doble." : "Por inscribirte antes recibiste " + a.h + " horas de experiencia doble."),
    micro: (a) => a.a + " confirmó su lugar en tu " + (a.g === 2 ? "segunda" : "tercera") + " generación" + (a.via ? " (llegó por " + a.via + ")" : "") + ": +" + a.min + " min de experiencia doble.",
    adoptados: (a) => (a.n === 1 ? "1 persona que llegó con lo que compartiste antes de tener cuenta ya está en tu árbol de la siembra." : fmt(a.n) + " personas que llegaron con lo que compartiste antes de tener cuenta ya están en tu árbol de la siembra."), propuesta: (a) => "Tu propuesta se hizo realidad: +" + a.h + " h de experiencia doble. ¡Gracias por construir Escudriña!",
    nivel10: (a) => a.a + " llegó al nivel 10: +" + a.xp + ".", libroInv: (a) => a.a + " terminó su primer libro: +" + a.xp + ".", libro: (a) => "Terminaste " + nombreLibro(a.lib) + ": +" + a.xp + ".",
    liga: (a) => "Semana de liga cerrada: puesto " + a.pos + " de " + a.n + (a.nvNuevo > a.nv ? "; ¡subiste a la liga " + ligaNombre(a.nvNuevo) + "!" : "") + (a.h ? " +" + horas(a.h * 3600e3) + " de experiencia doble" + (a.dr ? " y " + a.dr + " dracmas" : "") : "") + ".",
    compania: (a) => "¡«" + a.nombre + "» logró su meta común de la semana! +" + a.h + " h de experiencia doble.",
    mision: (a) => (a.ok ? "¡La misión mundial se logró! " : "La misión mundial no se alcanzó esta vez, pero tu aporte cuenta: ") + "+" + horas(a.h * 3600e3) + " de experiencia doble." };
  function tarjetaNovedades(y) {
    const l = (y.avisos || []).filter((a) => NOVEDAD[a.k]).slice(0, 6);
    if (!l.length) return null;
    return tarjeta("Novedades", null, h("ul", { class: "jg-novedades" }, l.map((a) => h("li", { text: NOVEDAD[a.k](a) }))));
  }
  const nombreLibro = (c) => (A.nombreLibro && A.nombreLibro(c)) || c;
  async function pintarPanel(cont) {
    document.title = "Escudriña · BiEx";
    const y = S.yo;
    if (!y) { marco(cont, cabecera(), h("p", { class: "cargando", text: "Abriendo tu avance…" })); }
    else dibujarPanel(cont, y);
    if (R.cola.length && S.token && !R.enviando) await enviar(false);
    const r = await pedir("/yo");
    if (r.error) { if (!y && S.token) marco(cont, cabecera(), tarjeta(null, null, h("p", { text: mensaje(r) }), h("button", { class: "btn", type: "button", onclick: repintar }, h("span", { text: "Reintentar" })))); return; }
    const igual = y && JSON.stringify(y) === JSON.stringify(r.yo);
    actualizarYo(r.yo);
    // sin cambios no se vuelve a pintar (nada salta ni se cierra mientras se lee el panel)
    if (!igual && cont === S.cont && S.cont.isConnected && HUB[S.sub[0] || ""]) dibujarPanel(cont, r.yo);
  }
  // ================================================================== menú del juego y secciones (BiEx, 9-nov-2026)
  // «Que la distribución tenga sus propios botones, como los menús de los juegos»: cinco secciones fijas, siempre a la mano.
  // El menú vive fuera de la vista (no parpadea al repintar) y se retira al salir de Escudriña.
  // El Árbol de la siembra con su propio botón en el menú (BiEx, 10-nov-2026)
  const SECC = [["hoy", "Hoy", "hoy"], ["tesoro", "Tesoro", "liga"], ["mundo", "Mundo", "mundo"], ["juntos", "Juntos", "compania"], ["arbol", "Árbol", "arbol"], ["mas", "Más", "mas"]];
  const SECC_DE = { tesoro: "tesoro", mundo: "mundo", liga: "mundo", clasificacion: "mundo", prestigio: "mundo", juntos: "juntos", compania: "juntos", companias: "juntos", c: "juntos", sala: "juntos", arbol: "arbol",
    mas: "mas", cuenta: "mas", propuestas: "mas", guia: "hoy" };
  const HUB = { "": 1, tesoro: 1, mundo: 1, juntos: 1, mas: 1 };
  const TIT = { hoy: ["Hoy", "Tu lectura y tus misiones"], tesoro: ["Tesoro", "Lo que has hallado leyendo"], mundo: ["Mundo", "Liga, misión mundial y clasificaciones"],
    juntos: ["Juntos", "Tu compañía y las salas de lectura"], mas: ["Más", "Tu cuenta, tu avance y tus ideas"], arbol: ["Tu Árbol", "El centro de tu poder: raíces, corazón, copa y frutos"], guia: ["Cómo se juega", "Paso a paso y a tu ritmo"] };
  let MU = null;
  function muelle(sec) {
    const raiz = document.documentElement;
    if (sec == null) { if (MU) { MU.remove(); MU = null; } raiz.classList.remove("jg-con-muelle"); return; }
    if (!MU) {
      MU = h("nav", { class: "jg-muelle", "aria-label": "Secciones de Escudriña" }, h("span", { class: "luz", "aria-hidden": "true" }),
        SECC.map(([k, t, ic]) => h("a", { href: "#/escudrina" + (k === "hoy" ? "" : "/" + k), "data-s": k, onclick: () => vibrar(8) }, ico(ic), h("span", { text: t }))));
      document.body.append(MU);
    }
    raiz.classList.add("jg-con-muelle");
    MU.style.setProperty("--i", String(Math.max(0, SECC.findIndex((s) => s[0] === sec))));
    for (const a of MU.querySelectorAll("a")) { const on = a.getAttribute("data-s") === sec; a.classList.toggle("act", on); if (on) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); }
    const y = S.yo, faltan = y && Array.isArray(y.mis) ? y.mis.filter((m) => !m.hecha).length : 0, hoy = MU.querySelector('a[data-s="hoy"]');
    if (hoy) { if (faltan) hoy.setAttribute("data-n", String(faltan)); else hoy.removeAttribute("data-n"); }
    const mas = MU.querySelector('a[data-s="mas"]');
    if (mas) { if (y && !y.asegurado) { mas.setAttribute("data-n", "!"); mas.title = "Asegura tu avance"; } else { mas.removeAttribute("data-n"); mas.removeAttribute("title"); } }
  }
  window.addEventListener("hashchange", () => { if (!/^#\/escudrina(\/|$)/.test(location.hash)) muelle(null); });
  function cabeceraJuego(sec) {
    const t = TIT[sec] || TIT.hoy;
    const ayuda = sec === "hoy" ? h("a", { class: "jg-ayuda", href: "#/escudrina/guia", title: "Cómo se juega", "aria-label": "Cómo se juega: paso a paso y a tu ritmo", onclick: () => { S.guiaPaso = 0; vibrar(8); } }, ico("jugar"), h("span", { text: "Cómo se juega" })) : null;
    return h("div", { class: "panel-cab jg-cab2" }, h("div", {}, h("small", { text: "Escudriña · El Códice Viviente" }), h("h1", { class: "texto", text: t[0] })), h("div", { class: "jg-cab-d" }, h("p", { class: "jg-mini", text: t[1] }), ayuda));
  }
  function tarjetaPotencias(y) {
    const extra = [];
    if (y.dob > 0) extra.push("Experiencia doble: " + horas(y.dob) + " de lectura (no vence).");
    if (y.imp && y.imp.ms > 0) extra.push("Impulso ×" + String(y.imp.f).replace(".", ",") + ": " + horas(y.imp.ms) + " de lectura.");
    extra.push("Tu mejor marca de perseverancia: " + plural(y.persMejor || 0, "día", "días") + ". Cada 7 días seguidos ganas un descanso que cubre un día sin lectura.");
    return tarjeta("Tus reservas", ico("llama"), h("div", { class: "jg-cifras" },
      h("div", {}, cifra(y.dr), h("span", { text: "dracmas" })),
      h("div", {}, cifra(y.pers), h("span", { text: y.pers === 1 ? "día de perseverancia" : "días de perseverancia" })),
      h("div", {}, h("b", { text: String(y.desc || 0) + " de 3" }), h("span", { text: "descansos guardados" }))),
      h("p", { class: "jg-mini", text: extra.join(" ") }));
  }
  function tarjetaClasificacion(y) {
    return tarjeta("Clasificación", ico("mundo"), h("p", { text: "Tu puesto en tu ciudad, tu " + nombreRegion((y.lugar || {}).pais).toLowerCase() + ", tu país, tu continente y el mundo, entre quienes tienen tu mismo rango, y el prestigio local de tu ciudad." }),
        h("div", { class: "jg-acciones" }, h("a", { class: "btn", href: "#/escudrina/clasificacion" }, h("span", { text: "Ver la clasificación" })),
          h("a", { class: "btn", href: "#/escudrina/prestigio" }, h("span", { text: "Prestigio de las ciudades" }))), vivoLinea());
  }
  function dibujarPanel(cont, y) {
    const sec = SECC_DE[S.sub[0] || ""] || "hoy";
    if (sec !== "juntos") salasAbiertas(false).catch(() => {});
    const pend = tarjetaPorConfirmar(y, true);
    const salaInv = (() => { const ps = A.store.get("jg:salaInv", null); return ps && ps.c && !SL.cod ? h("div", { class: "jg-aviso" }, "Te invitaron a la sala de lectura ", h("b", { text: ps.c }), ". ", h("a", { href: "#/escudrina/sala/" + ps.c, text: "Entrar" })) : null; })();
    let partes;
    if (sec === "tesoro") partes = [tarjetaHallazgos(y), tarjetaPorConfirmar(y, false), tarjetaPotencias(y)];
    else if (sec === "mundo") partes = [tarjetaQuienLee(), h("div", { class: "jg-dos" }, tarjetaLiga(y), tarjetaMision(y)), tarjetaClasificacion(y)];
    else if (sec === "juntos") partes = [salaInv, tarjetaSalasAbiertas(), h("div", { class: "jg-dos" }, tarjetaSala(y), tarjetaCompania(y)), tarjetaCampana(y)];
    else if (sec === "mas") partes = [y.asegurado ? null : tarjetaAsegurar(false),
      tarjeta("Tu cuenta", ico("persona"), h("p", { text: "Tu emblema, tu apodo, tus formas de entrar y tus preferencias." }),
        h("div", { class: "jg-acciones" }, h("a", { class: "btn", href: "#/escudrina/cuenta" }, ico("persona"), h("span", { text: "Cuenta, emblema y preferencias" })))),
      tarjetaOpinion(true), notaConstruccion()];
    else partes = [tarjetaPerfil(y), y.apodoProvisional ? tarjetaApodo(true) : null, botonSeguir(), pend,
      A.store.get("jg:guia", 0) ? null : h("div", { class: "jg-aviso" }, h("b", { text: "¿Primera vez aquí? " }), "Conoce cómo se juega en un minuto, paso a paso. ", h("a", { href: "#/escudrina/guia", text: "Ver cómo se juega" })),
      h("div", { class: "jg-dos" }, tarjetaMisiones(y), h("div", { class: "jg" }, tarjetaHoy(y), tarjetaNovedades(y))),
      salaInv,
      y.practica ? h("div", { class: "jg-aviso" }, h("b", { text: "Práctica antes del lanzamiento. " }),
        "Todo funciona de verdad. El " + fechaDia(y.lanzamiento) + " empieza el juego oficial y nada se pierde del todo: conservarás, de forma aleatoria, " + textoConserva() + " de tu experiencia, tus dracmas y tus hallazgos de práctica (los porcentajes altos son los más difíciles de alcanzar). Se conservan enteros tu cuenta, tu apodo, tu número de Primicia, tu escalera, tu árbol de la siembra, tu perseverancia y tus horas de experiencia doble; y por inscribirte antes recibirás 3 horas más.") : null];
    marco(cont, cabeceraJuego(sec), ...partes);
  }

  // ================================================================== navegadores dentro de otras aplicaciones
  const enlaceFuera = (inv) => PUBLICO + (inv ? "/e/" + inv : "/escudrina");
  function abrirFuera(inv) {
    const u = enlaceFuera(inv);
    if (/Android/i.test(UA)) { location.href = "intent://" + u.replace(/^https:\/\//, "") + "#Intent;scheme=https;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;end"; setTimeout(() => copiar(u, "Si no se abrió, el enlace quedó copiado: pégalo en tu navegador"), 1500); return; }
    if (/iPhone|iPad|iPod/i.test(UA)) { location.href = "x-safari-" + u; setTimeout(() => copiar(u, "Enlace copiado: pégalo en Safari"), 1500); return; }
    try { window.open(u, "_blank", "noopener"); } catch (e) { copiar(u, "Enlace copiado: pégalo en tu navegador"); }
  }
  function avisoEnApp() {
    if (!EN_APP) return null;
    const inv = invitacionPendiente();
    return h("div", { class: "jg-aviso jg-enapp" }, h("b", { text: "Estás en el navegador de otra aplicación. " }),
      "Aquí puedes leer y jugar, pero para guardar bien tu acceso, entrar con Google o instalar Biblia Exacta conviene abrirla en tu navegador (Chrome o Safari).",
      h("div", { class: "jg-acciones" }, h("button", { class: "btn oro chico", type: "button", onclick: () => abrirFuera(inv) }, h("span", { text: "Abrir en mi navegador" })),
        h("button", { class: "btn chico", type: "button", onclick: () => copiar(enlaceFuera(inv), "Enlace copiado: pégalo en tu navegador") }, ico("copiar"), h("span", { text: "Copiar el enlace" }))));
  }
  function avisoGoogleEnApp() {
    const inv = invitacionPendiente();
    A.abrirModal(() => A.cajaModal(A.cabModal("Abre Escudriña en tu navegador", "Entrar con Google"), h("div", { class: "jg-cel" },
      h("p", { text: "Google no permite iniciar sesión desde el navegador interno de otras aplicaciones (Messenger, Facebook, Instagram…). Abre Escudriña en Chrome o Safari y allí podrás entrar con Google." }),
      h("div", { class: "jg-acciones" }, h("button", { class: "btn oro", type: "button", onclick: () => abrirFuera(inv) }, h("span", { text: "Abrir en mi navegador" })),
        h("button", { class: "btn", type: "button", onclick: () => copiar(enlaceFuera(inv), "Enlace copiado: pégalo en tu navegador") }, ico("copiar"), h("span", { text: "Copiar el enlace" }))),
      h("p", { class: "jg-mini", text: "También puedes empezar aquí mismo con un apodo y vincular Google después." }))));
  }

  // ================================================================== cómo se juega: presentación animada, a tu ritmo
  // Siete escenas vectoriales que se mueven solas (solo transformaciones y opacidad). Se avanza con «Siguiente», con los
  // puntos, deslizando o con las flechas del teclado; nunca avanza sola (BiEx: accesible para dislexia y TDAH).
  const GUIA = [
    ["Lee de verdad", "Abre cualquier capítulo de la Nueva Voluntad y lee a tu ritmo. Cada verso que de verdad lees te da experiencia y te hace subir de nivel.", "versos"],
    ["Misiones pequeñas cada día", "Cada día recibes de 2 a 5 misiones sencillas, como leer unos versos o completar un capítulo. Sin prisa y sin culpa: si un día no puedes, tu avance sigue ahí.", "misiones"],
    ["Hallazgos", "Muy de vez en cuando, un verso revela una de las doce piedras del fundamento o un lauro trenzado incorruptible. Solo aparecen leyendo.", "hallazgos"],
    ["Perseverancia", "Cada día que lees suma a tu perseverancia. Cada 7 días seguidos ganas un descanso que cubre un día sin lectura.", "perseverancia"],
    ["Nunca a solas", "Entra en la liga de la semana, aporta a la misión mundial, forma una compañía de 2 a 24 personas o abre una sala para leer en compañía.", "juntos"],
    ["Tu siembra", "Comparte tu enlace. Quien llega contigo empieza con 3 horas de experiencia doble, y tu árbol de la siembra crece generación tras generación.", "siembra"],
    ["El menú del juego", "Abajo tienes cinco botones: Hoy, Tesoro, Mundo, Juntos y Más. Con ellos llegas a todo. Y guarda bien tu acceso: es tu llave.", "menu"]];
  function escenaGuia(k) {
    const giro = (el, grados) => { el.style.transform = "rotate(" + grados + "deg) translate3d(0,-84px,0)"; return el; };
    if (k === "versos") return h("div", { class: "g-versos" }, h("i"), h("i"), h("i"), h("i"), h("b", { class: "g-xp", text: "+12" }));
    if (k === "misiones") return h("div", { class: "g-mis" }, [0, 1, 2].map(() => h("div", {}, h("b"), h("i"))));
    if (k === "hallazgos") return h("div", { class: "g-pila" }, h("div", { class: "g-gemas" }, PIEDRAS.map((p, i) => giro(h("span", {}, gema(i, true)), i * 30))), h("div", { class: "g-centro" }, lauro()));
    if (k === "perseverancia") return h("div", { class: "g-pers" }, A.svg(ICO_JG.llama, "0 0 24 24"), h("div", { class: "g-dias" }, [0, 1, 2, 3, 4, 5, 6].map(() => h("i"))));
    if (k === "juntos") {
      const e = (S.yo && S.yo.emb) || {};
      return h("div", { class: "g-pila" }, h("div", { class: "g-gemas g-orbita" }, COLORES.map((col, i) => { const s = giro(h("span"), i * 45); s.style.background = col; return s; })), h("div", { class: "g-centro" }, emblema(e.l || "α", e.c || 0, 0)));
    }
    if (k === "siembra") {
      const n = (c, p, g, ok, d, hh) => ({ c, p, k: g, a: "", ok, d, h: hh });
      return h("div", { class: "g-arbol" }, dibujoArbol({ prof: 2, raiz: { propia: true, d: 7, a: "" }, nodos: [n("a", null, 1, 1, 2, 2), n("b", null, 1, 1, 1, 1), n("c", null, 1, 0, 1, 1), n("d", "a", 2, 1, 0, 0), n("e", "a", 2, 0, 0, 0), n("f", "b", 2, 1, 0, 0), n("g", "c", 2, 0, 0, 0)] }, true));
    }
    return h("div", { class: "g-menu" }, h("span", { class: "luz" }), SECC.map(([, t, ic]) => h("span", {}, ico(ic), h("small", { text: t }))));
  }
  function pintarGuia(cont) {
    document.title = "Cómo se juega · Escudriña · BiEx";
    let i = Math.max(0, Math.min(GUIA.length - 1, S.guiaPaso || 0)), x0 = null;
    const escena = h("div", { class: "jg-escena", "aria-hidden": "true" }), tit = h("h2", {}), txt = h("p", { class: "jg-gt", "aria-live": "polite" }), cuenta = h("span", { class: "jg-mini" });
    const puntos = h("div", { class: "jg-puntos" }, GUIA.map((g, k) => h("button", { type: "button", "aria-label": "Paso " + (k + 1) + ": " + g[0], onclick: () => ir(k) })));
    const rot = h("span", {}), atras = h("button", { class: "btn", type: "button", onclick: () => ir(i - 1) }, h("span", { text: "Atrás" }));
    const sig = h("button", { class: "btn oro jg-grande", type: "button", onclick: () => (i === GUIA.length - 1 ? fin() : ir(i + 1)) }, rot);
    const fin = () => { A.store.set("jg:guia", 1); S.guiaPaso = 0; vibrar(15); if (S.token) { const u = A.ultimo && A.ultimo(); A.irA(u ? u.h : "#/MAT/1"); } else A.irA("#/escudrina"); };
    function ir(k) {
      i = Math.max(0, Math.min(GUIA.length - 1, k)); S.guiaPaso = i;
      const g = GUIA[i];
      escena.replaceChildren(escenaGuia(g[2])); tit.textContent = g[0]; txt.textContent = g[1];
      Array.from(puntos.children).forEach((b, n) => { b.classList.toggle("act", n === i); if (n === i) b.setAttribute("aria-current", "step"); else b.removeAttribute("aria-current"); });
      atras.hidden = i === 0;
      rot.textContent = i === GUIA.length - 1 ? (S.token ? "Empezar a leer" : "Crear mi cuenta") : "Siguiente";
      cuenta.textContent = (i + 1) + " de " + GUIA.length;
      if (i === GUIA.length - 1) A.store.set("jg:guia", 1);
    }
    escena.addEventListener("pointerdown", (ev) => { x0 = ev.clientX; });
    escena.addEventListener("pointerup", (ev) => { if (x0 == null) return; const d = ev.clientX - x0; x0 = null; if (Math.abs(d) > 40) { vibrar(8); ir(i + (d < 0 ? 1 : -1)); } });
    escena.addEventListener("pointercancel", () => { x0 = null; });
    const caja = h("section", { class: "jg-tarjeta jg-guia", tabindex: "-1" }, escena, h("div", { class: "jg-guia-pie" }, puntos, cuenta), tit, txt, h("div", { class: "jg-guia-nav" }, atras, sig));
    caja.addEventListener("keydown", (ev) => { if (ev.key === "ArrowRight") ir(i + 1); else if (ev.key === "ArrowLeft") ir(i - 1); });
    marco(cont, cabeceraJuego("guia"), caja,
      h("div", { class: "jg-acciones" }, h("a", { class: "btn chico", href: "#/escudrina", onclick: () => { A.store.set("jg:guia", 1); S.guiaPaso = 0; } }, h("span", { text: S.token ? "Saltar y volver al juego" : "Volver" }))));
    ir(i);
  }
  // BiEx (9-nov-2026): que nadie confunda el proceso semana a semana con el resultado final
  // Sale como mucho un par de veces por semana (cada 84 h); en la misma visita se mantiene para que no desaparezca al repintar
  const notaConstruccion = () => {
    if (!S.obraVisita) { if (Date.now() - (Number(A.store.get("jg:obra", 0)) || 0) < 84 * 36e5) return null; S.obraVisita = true; A.store.set("jg:obra", Date.now()); }
    return h("div", { class: "jg-aviso tenue" }, h("b", { text: "Biblia Exacta se construye semana a semana. " }),
      "Con el paso de los días, la vista Orden del lector reflejará de manera cada vez más precisa e inteligible el mensaje de la traducción literal. Te invitamos a ingresar varias veces por semana, e incluso a diario, para escudriñar el texto y ver las novedades y los avances del texto y del proyecto.");
  };
  function tarjetaApodo(provisional) {
    const entrada = h("input", { type: "text", maxlength: "20", value: provisional ? "" : (S.yo && S.yo.apodo) || "", placeholder: "Tu apodo (3 a 20 letras)", "aria-label": "Tu apodo", spellcheck: "false" });
    const pista = h("p", { class: "jg-pista", role: "status" });
    // BiEx (10-nov-2026): el apodo se cambia una vez cada 3 semanas y cuesta dracmas (el primero, el del invitado, es gratis)
    const ac = (!provisional && S.yo && S.yo.apodoCambio) || null, espera = ac && ac.desde > Date.now(), precio = ac ? ac.precio || 0 : 0;
    const guardar = async () => {
      const nuevo = entrada.value.trim();
      if (!provisional && S.yo && nuevo === S.yo.apodo) { pista.textContent = "Ese ya es tu apodo."; pista.className = "jg-pista"; return; }
      if (precio && !confirm("Cambiar tu apodo cuesta " + precio + " dracmas y el próximo cambio será dentro de 3 semanas. ¿Seguir?")) return;
      const r = await pedir("/cuenta/apodo", { metodo: "POST", cuerpo: { apodo: nuevo } });
      if (r.error) {
        pista.textContent = r.error === "apodo_espera" && r.hasta ? "Podrás cambiarlo de nuevo el " + fechaDia(r.hasta) + "." : r.error === "dracmas" && r.faltan ? "Cambiar tu apodo cuesta " + r.precio + " dracmas: te faltan " + fmt(r.faltan) + "." : mensaje(r);
        pista.className = "jg-pista mal"; return;
      }
      actualizarYo(r.yo); A.avisar("Apodo guardado"); repintar();
    };
    entrada.addEventListener("keydown", (e) => { if (e.key === "Enter") guardar(); });
    // BiEx (10-nov-2026): junto al precio, cuántas dracmas tienes; si no alcanzan, se dice cuántas faltan (nada de «ya puedes»)
    const tienes = (S.yo && S.yo.dr) || 0, falta = precio ? Math.max(0, precio - tienes) : 0;
    const regla = ac ? h("p", { class: "jg-mini", text: "Cambiarlo cuesta " + precio + " dracmas (tienes " + fmt(tienes) + ") y se puede una vez cada " + plural(Math.round((ac.dias || 21) / 7), "semana", "semanas") +
      (espera ? ". Próximo cambio: " + fechaDia(ac.desde) + "." : falta ? ". Te faltan " + fmt(falta) + " dracmas: se ganan leyendo." : ". Ya puedes cambiarlo.") }) : null;
    if (espera) entrada.disabled = true;
    return tarjeta(provisional ? "Elige tu apodo" : "Apodo", ico("persona"), provisional ? h("p", { text: "Así aparecerás en las clasificaciones. Nadie verá tu nombre real. Elegirlo ahora es gratis; después, cambiarlo cuesta dracmas." }) : null,
      h("div", { class: "jg-form" }, entrada, h("button", { class: "btn oro", type: "button", disabled: espera || falta ? true : null, onclick: guardar }, h("span", { text: precio ? (falta ? "Faltan " + fmt(falta) + " dr." : "Cambiar · " + precio + " dr.") : "Guardar" }))), regla, pista);
  }

  // --- pre-registro, campaña y escalera del Sembrador
  const horas = (ms) => { const m = Math.max(1, Math.round(ms / MIN)); return m < 60 ? m + " min" : Math.floor(m / 60) + " h" + (m % 60 ? " " + (m % 60) + " min" : ""); };
  // La hora del lanzamiento se muestra en la hora local de quien lee y en las de las principales ciudades (BiEx, 9-nov-2026:
  // que el proyecto no parezca nacer de un solo punto geográfico). Los nombres van «original [tradicional]».
  const fechaLarga = (ms, tz) => { try { return new Date(ms).toLocaleString("es", Object.assign({ weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit" }, tz ? { timeZone: tz } : {})); } catch (e) { return new Date(ms).toLocaleString("es"); } };
  const fechaDia = (ms) => { try { return new Date(ms).toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long" }); } catch (e) { return ""; } };
  const CIUDADES = [["America/Los_Angeles", "Los Angeles [Los Ángeles] · hora del Pacífico"], ["America/Mexico_City", "Ciudad de México · Centroamérica"], ["America/Bogota", "Bogotá · Lima · Quito"],
    ["America/New_York", "New York [Nueva York]"], ["America/Caracas", "Caracas · Santo Domingo · San Juan"], ["America/Santiago", "Santiago"], ["America/Argentina/Buenos_Aires", "Buenos Aires · São Paulo · Montevideo"],
    ["Europe/London", "London [Londres]"], ["Europe/Madrid", "Madrid · Paris [París] · Roma"]];
  function horaEn(ms, tz) { try { return new Date(ms).toLocaleString("es", { timeZone: tz, weekday: "short", hour: "numeric", minute: "2-digit" }); } catch (e) { return ""; } }
  function zonasLanzamiento(ms) {
    return h("details", { class: "jg-zonas" }, h("summary", { text: "Ver la hora en otras ciudades" }),
      h("ul", {}, CIUDADES.map(([tz, n]) => h("li", {}, h("span", { text: n }), h("b", { text: horaEn(ms, tz) })))));
  }
  const uni = (n, a, b) => h("span", {}, h("b", { text: String(n) }), h("small", { text: n === 1 ? a : b }));
  function cuentaAtras(ms) {
    if (!ms) return null;
    const reloj = h("span", { class: "jg-reloj", role: "timer" });
    const el = h("div", { class: "jg-cuenta" }, h("span", { class: "jg-mini", text: "Lanzamiento: " + fechaLarga(ms) + " (tu hora local)" }), reloj, zonasLanzamiento(ms));
    const pintar = () => {
      const f = ms - Date.now();
      if (f <= 0) { el.replaceChildren(h("span", { text: "¡Escudriña ya abrió!" })); return false; }
      reloj.replaceChildren(uni(Math.floor(f / 864e5), "día", "días"), uni(Math.floor((f % 864e5) / 36e5), "hora", "horas"), uni(Math.floor((f % 36e5) / 6e4), "minuto", "minutos"), uni(Math.floor((f % 6e4) / 1000), "segundo", "segundos"));
      return true;
    };
    pintar();
    // con segundos, como en la portada (BiEx, 10-nov-2026); se detiene con la pestaña oculta
    const t = setInterval(() => { if (!el.isConnected || !pintar()) clearInterval(t); }, 1000);
    return el;
  }
  // Lo que se conserva al lanzar (BiEx, 9-nov-2026): nada se pierde del todo
  const textoConserva = () => { const c = (S.cfg && S.cfg.conserva) || [0.72, 40]; return "entre el " + String(c[0]).replace(".", ",") + " % y el " + String(c[1]).replace(".", ",") + " %"; };
  function primiciasVivas() {
    const quedan = h("b", { text: "…" }), ins = h("span", { class: "jg-mini" }), barra = h("i", { style: "width:0%" });
    pedir("/campana", { sin: true, guardable: true }).then((c) => {
      if (c.error) return;
      quedan.textContent = fmt(c.quedan);
      ins.textContent = plural(c.inscritos, "persona inscrita", "personas inscritas");
      barra.style.width = Math.min(100, (100 * (c.primicias - c.quedan)) / c.primicias).toFixed(1) + "%";
    });
    return { quedan, ins, barra };
  }
  // Entrada (sin sesión): invitación a reservar el lugar antes del lanzamiento
  function tarjetaPrerregistro(entrada) {
    const cfg = S.cfg || {}; if (cfg.ciclo !== "previa") return null;
    const v = primiciasVivas();
    return h("section", { class: "jg-campana" },
      h("span", { class: "eyebrow", text: "Pre-registro abierto" }),
      h("h2", {}, "Solo hay ", h("b", { text: "1440" }), " Primicias"),
      h("p", { class: "jg-quedan" }, "Quedan ", v.quedan, " lugares · ", v.ins),
      h("div", { class: "jg-barra oro", "aria-hidden": "true" }, v.barra),
      cuentaAtras(cfg.lanzamiento),
      h("p", { text: "Reserva hoy tu apodo y tu número de Primicia (se asigna de forma aleatoria), comparte tu enlace y sube la escalera del Sembrador antes del lanzamiento: cada persona que llegue contigo y confirme su lugar te da horas de experiencia doble que no vencen. Quien se inscribe antes del lanzamiento recibe además 3 horas de experiencia doble, y lo que avance en la práctica no se pierde del todo: ese día conserva, de forma aleatoria, " + textoConserva() + " de su experiencia, sus dracmas y sus hallazgos." }),
      h("button", { class: "btn oro jg-grande", type: "button", onclick: () => { try { entrada.scrollIntoView({ block: "center", behavior: sinAnim() ? "auto" : "smooth" }); } catch (e) { /* ignorar */ } entrada.focus({ preventScroll: true }); } }, h("span", { text: "Reservar mi lugar" })));
  }
  function tarjetaColeccion(y) {
    return h("div", { class: "jg-coleccion" }, h("span", { class: "jg-col-ico", "aria-hidden": "true" }, A.svg('<path d="M7 3h7l5 5v13H7z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M14 3v5h5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M10 13h6M10 16.5h4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>')),
      h("p", {}, h("b", { text: "Edición de colección. " }), y.fundador ? "Con tu Primicia n.º " + fmt(y.n) + " podrás obtener un PDF original numerado con ese mismo número, exclusivo de colección: solo existirán 1440." : "Cada Primicia podrá obtener un PDF original numerado con su número, exclusivo de colección: solo existirán 1440."));
  }
  function tarjetaCampana(y) {
    const url = enlaceInvitacion(), M = marcos(), conf = (y.invi && y.invi.conf) || 0;
    // la escalera es un bucle: cada vuelta de 100 repite los diez peldaños y sus horas (BiEx, 9-nov-2026)
    const V = (S.cfg && S.cfg.vuelta) || 100, vuelta = Math.floor(conf / V) + 1, b0 = (vuelta - 1) * V, enV = conf - b0;
    const sig = M.find((m) => enV < m[0]) || null, prev = M.filter((m) => enV >= m[0]).pop();
    const base = prev ? prev[0] : 0, pct = sig ? Math.min(100, (100 * (enV - base)) / (sig[0] - base)) : 100;
    const ab = h("b", { text: "·" }), ins = h("b", { text: fmt((y.invi && y.invi.unidos) || 0) });
    pedir("/campana/mia", { guardable: true }).then((m) => { if (!m.error) { ab.textContent = fmt(m.aperturas); ins.textContent = fmt(Math.max(m.inscritos, (y.invi && y.invi.unidos) || 0)); } });
    const red = (k, href, t) => h("a", { class: "btn chico", href, target: "_blank", rel: "noopener" }, ico(k), h("span", { text: t }));
    const v = y.practica ? primiciasVivas() : null;
    return tarjeta(y.practica ? "Pre-registro · tu escalera del Sembrador" : "Invita a leer · escalera del Sembrador", ico("compartir"),
      v ? h("div", { class: "jg-campana mini" }, h("p", { class: "jg-quedan" }, "Primicias: quedan ", v.quedan, " de 1440 · ", v.ins), h("div", { class: "jg-barra oro", "aria-hidden": "true" }, v.barra),
        y.fundador ? h("p", { class: "jg-mini", text: "La tuya ya está reservada: Primicia n.º " + fmt(y.n) + "." } ) : null, cuentaAtras(y.lanzamiento)) : null,
      // BiEx (10-nov-2026): «la posibilidad de obtener un PDF original numerado, exclusivo de colección» (condiciones por precisar)
      tarjetaColeccion(y),
      h("p", { text: "Tu enlace propio: quien entra con él recibe 3 horas de lectura con experiencia doble, y cada persona que confirma su lugar te sube en la escalera." }),
      h("div", { class: "jg-enlace" }, h("code", { text: url.replace(/^https:\/\//, "") }),
        h("button", { class: "btn oro chico", type: "button", onclick: compartirInvitacion }, ico("compartir"), h("span", { text: "Compartir" })),
        h("button", { class: "btn chico", type: "button", onclick: () => copiar(url, "Enlace copiado") }, ico("copiar"), h("span", { text: "Copiar" }))),
      h("div", { class: "jg-redes" },
        red("chat", "https://wa.me/?text=" + encodeURIComponent(TEXTO_INV + " " + url), "WhatsApp"),
        red("facebook", "https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(url), "Facebook"),
        red("avion", "https://t.me/share/url?url=" + encodeURIComponent(url) + "&text=" + encodeURIComponent(TEXTO_INV), "Telegram"),
        red("publicar", "https://twitter.com/intent/tweet?text=" + encodeURIComponent(TEXTO_INV) + "&url=" + encodeURIComponent(url), "X"),
        red("correo", "mailto:?subject=" + encodeURIComponent("Te invito a Escudriña · El Códice Viviente") + "&body=" + encodeURIComponent(TEXTO_INV + "\n\n" + url), "Correo"),
        h("button", { class: "btn chico", type: "button", onclick: () => verTarjetaImagen({ tipo: "prerregistro" }) }, ico("imagen"), h("span", { text: "Imagen para compartir" }))),
      h("div", { class: "jg-cifras" }, h("div", {}, ab, h("span", { text: "abrieron tu enlace" })), h("div", {}, ins, h("span", { text: "se inscribieron" })), h("div", {}, h("b", { text: fmt(conf) }), h("span", { text: "confirmaron" }))),
      h("div", {}, h("div", { class: "jg-barra", role: "progressbar", "aria-valuemin": "0", "aria-valuemax": "100", "aria-valuenow": pct.toFixed(0), "aria-label": "Avance hacia el peldaño siguiente" }, h("i", { style: "width:" + pct.toFixed(1) + "%" })),
        h("p", { class: "jg-mini", text: (vuelta > 1 ? "Vuelta " + vuelta + " de la escalera · " : "") + (sig ? "Te " + (sig[0] - enV === 1 ? "falta 1 persona confirmada" : "faltan " + fmt(sig[0] - enV) + " personas confirmadas") + " para «" + sig[1] + "» (+" + sig[2] + " h de experiencia doble)." : "") })),
      h("ol", { class: "jg-escalera" }, M.map((m) => h("li", { class: enV >= m[0] ? "ya" : sig && sig[0] === m[0] ? "sig" : "", title: m[1] + " · " + plural(b0 + m[0], "persona", "personas") + " · +" + m[2] + " h de experiencia doble" },
        h("b", { text: fmt(b0 + m[0]) }), h("span", { text: m[1] }), h("small", { text: "+" + m[2] + " h" })))),
      h("p", { class: "jg-mini", text: "La escalera no termina: al llegar a 100 empieza otra vuelta con los mismos peldaños y las mismas horas, y tu emblema conserva «Ciento» y suma una marca por cada vuelta. Y tu siembra sigue: por cada persona que confirma en tu 2.ª generación (las que invitan tus invitados) recibes " + (((S.cfg && S.cfg.micro) || {})[2] || 15) + " min de experiencia doble, y " + (((S.cfg && S.cfg.micro) || {})[3] || 5) + " min en la 3.ª." }),
      h("p", { class: "jg-mini", text: "Una persona se confirma cuando lee sus primeros 20 versos o asegura su cuenta (compartir red o dispositivo con tu familia no es problema). Además recibes 1000 de experiencia cuando lee sus primeros 20 versos, 3000 cuando llega al nivel 10, 5000 cuando termina su primer libro y un regalo del 5 % de lo que lea en su primer mes de juego. Las horas de experiencia doble solo se gastan mientras lees y no vencen. 30, 60 y 100: Μᾶrκος 4:8; 72: Λουκᾶς 10:1." }));
  }

  // --- árbol de la siembra (BiEx, 9-nov-2026): quién llegó con tu enlace, quién llegó por esas personas… hasta dónde llegó
  // lo que sembraste al compartir. El servidor lo calcula al pedirlo (una sola consulta) y el navegador lo guarda un minuto.
  const ORD = ["", "1.ª", "2.ª", "3.ª", "4.ª", "5.ª", "6.ª", "7.ª", "8.ª", "9.ª", "10.ª"];
  const ordGen = (k) => ORD[k] || k + ".ª";
  const diaCorto = (f) => { try { return new Date(f + "T12:00:00Z").toLocaleDateString("es", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }); } catch (e) { return f; } };
  // Dibujo radial y vectorial: tú en el centro, cada generación en su anillo; cada rama ocupa el ángulo de las hojas que sostiene
  function dibujoArbol(d, mini) {
    const C = 500, P = Math.max(1, Math.min(4, d.prof || 3)), paso = 455 / P, R = (k) => k * paso, f1 = (v) => v.toFixed(1);
    const hijos = new Map();
    for (const n of d.nodos) { const k = n.p || "@"; if (!hijos.has(k)) hijos.set(k, []); hijos.get(k).push(n); }
    const pesos = new Map();
    const peso = (c) => { if (pesos.has(c)) return pesos.get(c); const l = hijos.get(c) || []; const w = l.length ? l.reduce((a, x) => a + peso(x.c), 0) : 1; pesos.set(c, w); return w; };
    const pos = new Map([["@", { x: C, y: C, a: -Math.PI / 2 }]]);
    const colocar = (c, a0, a1) => {
      const l = hijos.get(c) || []; if (!l.length) return;
      const tot = l.reduce((a, x) => a + peso(x.c), 0); let a = a0;
      for (const x of l) { const w = ((a1 - a0) * peso(x.c)) / tot, am = a + w / 2; pos.set(x.c, { x: C + R(x.k) * Math.cos(am), y: C + R(x.k) * Math.sin(am), a: am }); colocar(x.c, a, a + w); a += w; }
    };
    colocar("@", -Math.PI / 2, 1.5 * Math.PI);
    let s = "";
    for (let k = 1; k <= P; k++) s += '<circle class="anillo g' + k + '" cx="500" cy="500" r="' + f1(R(k)) + '" fill="none" stroke="var(--linea-2)" stroke-width="1.2" stroke-dasharray="2 8"/>';
    for (const n of d.nodos) {
      const a = pos.get(n.c), b = pos.get(n.p || "@"); if (!a || !b) continue;
      const rm = R(n.k - 0.55), qx = C + rm * Math.cos(a.a), qy = C + rm * Math.sin(a.a);
      s += '<path class="rama g' + n.k + '" data-c="' + esc(n.c) + '" d="M' + f1(b.x) + " " + f1(b.y) + "Q" + f1(qx) + " " + f1(qy) + " " + f1(a.x) + " " + f1(a.y) + '" fill="none" stroke="' + (n.ok ? "var(--oro)" : "var(--linea)") + '" stroke-width="' + (n.ok ? "3.4" : "2.2") + '" stroke-linecap="round"/>';
    }
    // nombres: la 1.ª generación si cabe (hasta 12) y la 2.ª si el árbol visible es pequeño
    const n1 = (hijos.get("@") || []).length, etiquetas = !mini && n1 <= 12, etiq2 = etiquetas && d.nodos.length <= 24;
    for (const n of d.nodos) {
      const a = pos.get(n.c); if (!a) continue;
      const r = Math.min(30, (mini ? 13 : 13) + 3.4 * Math.sqrt(n.d)), ocultos = n.h - (hijos.get(n.c) || []).length;
      let et = "";
      if ((etiquetas && n.k === 1) || (etiq2 && n.k === 2)) { const c = Math.cos(a.a), sn = Math.sin(a.a), fs = n.k === 1 ? 31 : 26; et = '<text x="' + f1(a.x + (r + 12) * c) + '" y="' + f1(a.y + (r + 12) * sn + fs * 0.35) + '" text-anchor="' + (c > 0.3 ? "start" : c < -0.3 ? "end" : "middle") + '" font-size="' + fs + '" fill="' + (n.k === 1 ? "var(--tinta)" : "var(--tinta-2)") + '" style="font-family:var(--f-ui)">' + esc(n.a) + "</text>"; }
      s += '<g class="jg-nodo g' + n.k + '" data-c="' + esc(n.c) + '"' + (mini ? "" : ' tabindex="0" role="button" aria-label="' + esc(n.a + ", " + ordGen(n.k) + " generación" + (n.ok ? ", confirmó su lugar" : "") + (n.d ? ", " + n.d + " en sus ramas" : "")) + '"') + ">" +
        (mini ? "" : '<circle cx="' + f1(a.x) + '" cy="' + f1(a.y) + '" r="' + f1(r + 12) + '" fill="transparent"/>') +
        '<circle class="pt" cx="' + f1(a.x) + '" cy="' + f1(a.y) + '" r="' + f1(r) + '" fill="' + (n.ok ? "var(--oro)" : "var(--hoja-2)") + '" stroke="' + (n.ok ? "var(--oro-vivo)" : "var(--oro)") + '" stroke-width="3"/>' +
        (ocultos > 0 && !mini ? '<text x="' + f1(a.x) + '" y="' + f1(a.y + 7) + '" text-anchor="middle" font-size="20" font-weight="600" fill="' + (n.ok ? "var(--sobre-oro)" : "var(--oro-vivo)") + '" style="font-family:var(--f-ui)">+' + ocultos + "</text>" : "") + et + "</g>";
    }
    // en el centro: tu emblema (o la inicial de quien encabeza la rama que se explora)
    const y = S.yo || {}, e = y.emb || {}, propia = !!(d.raiz && d.raiz.propia), col = propia ? COLORES[e.c] || COLORES[0] : "var(--oro)";
    const l = propia ? e.l || "α" : String((d.raiz && d.raiz.a) || "·").trim().charAt(0).toUpperCase(), heb = /[֐-׿]/.test(l);
    s += '<circle cx="500" cy="500" r="' + (mini ? 50 : 38) + '" fill="var(--hoja-2)" stroke="' + col + '" stroke-width="3.5"/><text x="500" y="' + (mini ? 520 : 514) + '" text-anchor="middle" font-size="' + (mini ? 56 : 42) + '" fill="' + col + '" style="font-family:' + (heb ? "'Frank Ruhl Libre','BiEx Texto',serif" : "'BiEx Texto',Georgia,serif") + '">' + esc(l) + "</text>";
    const el = A.svg(s, "0 0 1000 1000");
    el.setAttribute("class", "jg-arbol");
    if (!mini) { el.removeAttribute("aria-hidden"); el.setAttribute("role", "group"); el.setAttribute("aria-label", "Árbol de la siembra: " + plural((d.raiz && d.raiz.d) || 0, "persona", "personas")); }
    return el;
  }
  // ================================================================== poder del jugador (tanda 4, BiEx 10-nov-2026)
  // «El Árbol como centro del poder»: el árbol vivo de cada quien (raíces = sus seis atributos, corazón = su emblema y su
  // nivel, copa = lo leído, frutos = las personas que llegaron por su siembra), el reparto manual de puntos, la armadura por
  // capas, la tienda de dracmas y los accesorios. Todo vectorial; lo que se mueve va por el compositor.
  const ATR_COL = { v: "#f2c14e", c: "#7fb6ff", j: "#e07a5f", p: "#7fd6a8", r: "#c9a7ff", b: "#ffd59a" };
  const ATR_ICO = {
    v: '<path d="M12 3l2.4 5.6 6 .5-4.6 4 1.4 5.9L12 16l-5.2 3 1.4-5.9-4.6-4 6-.5z" fill="currentColor"/>',
    c: '<path d="M12 3l7 3v5c0 4.6-3 8.4-7 10-4-1.6-7-5.4-7-10V6z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8.5 12l2.4 2.4 4.6-4.8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    j: '<path d="M12 4v16M5 7h14M7 7l-3 6h6zM17 7l-3 6h6zM8 20h8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>',
    p: '<path d="M5 13c3-6 11-6 14 0-3 5-11 5-14 0z" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 4v4M12 18v2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
    r: '<circle cx="12" cy="12" r="3" fill="currentColor"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
    b: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" fill="none" stroke="currentColor" stroke-width="1.8"/>',
  };
  const GR_COL = ["rgba(255,255,255,.12)", "#ece4cf", "#c98c4c", "#d3dae3", "#f4c652", "url(#av-gema)"];
  let PODER = null;
  async function cargarPoder(forzar) {
    if (!forzar && PODER && Date.now() - PODER.t < 15e3) return PODER;
    const r = await pedir("/poder"); if (r.error) return r;
    PODER = Object.assign(r, { t: Date.now() }); return PODER;
  }
  // generador determinista (el árbol de cada quien es único y siempre el mismo)
  const semilla32 = (s) => { let h = 2166136261; for (const ch of String(s || "biex")) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  const azar = (k) => () => { k = (k + 0x6d2b79f5) >>> 0; let t = k; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  function fotoUrl(f) { return /^[a-z0-9]{4,12}\.[0-9a-f]{10}$/.test(f || "") ? API_ABS + "/foto/" + f : ""; }
  let FOTO_N = 0;
  // Árbol de poder (héroe de la sección)
  function arbolPoder(y, av, frutos) {
    const rnd = azar(semilla32(y.inv)), f1 = (v) => v.toFixed(1), ef = av.ef || {}, nivel = y.nivel || 1;
    const prof = 3 + Math.min(3, Math.floor(nivel / 8)), hojasMax = 110 + Math.min(420, Math.round((y.vt || 0) / 4));
    let ramas = "", luces = "", frut = "", hojas = 0;
    const puntas = [];
    const rama = (x, yy, ang, len, w, d) => {
      const x2 = x + len * Math.cos(ang), y2 = yy + len * Math.sin(ang), cx = x + len * 0.5 * Math.cos(ang + (rnd() - 0.5) * 0.5), cy = yy + len * 0.5 * Math.sin(ang + (rnd() - 0.5) * 0.5);
      ramas += '<path d="M' + f1(x) + " " + f1(yy) + "Q" + f1(cx) + " " + f1(cy) + " " + f1(x2) + " " + f1(y2) + '" stroke-width="' + f1(w) + '"/>';
      if (d <= 0) { puntas.push([x2, y2]); return; }
      const n = d >= prof - 1 ? 3 : 2 + (rnd() < 0.45 ? 1 : 0);
      // las ramas se abren hacia afuera (copa ancha) y bajan un poco en las puntas, como un árbol frondoso
      const abre = (ang + Math.PI / 2) * 0.35;
      for (let i = 0; i < n; i++) rama(x2, y2, ang + abre + (i - (n - 1) / 2) * (0.58 + rnd() * 0.24) + (rnd() - 0.5) * 0.2, len * (0.64 + rnd() * 0.1), Math.max(1.6, w * 0.64), d - 1);
    };
    // la copa se abre en siete brazos amplios (BiEx, 10-nov-2026: «más épico, a tope de impacto visual»)
    for (let i = 0; i < 7; i++) rama(500 + (i - 3) * 4, 470, -Math.PI / 2 + (i - 3) * 0.33 + (rnd() - 0.5) * 0.08, 118 + rnd() * 34 - Math.abs(i - 3) * 6, 26 - Math.abs(i - 3) * 2.4, prof - 1);
    for (const [x, yy] of puntas) {
      const k = 3 + Math.floor(rnd() * 3);
      for (let i = 0; i < k && hojas < hojasMax; i++, hojas++) {
        const r = 4 + rnd() * 11, dx = (rnd() - 0.5) * 58, dy = (rnd() - 0.5) * 50;
        luces += '<circle class="ap-h" cx="' + f1(x + dx) + '" cy="' + f1(yy + dy) + '" r="' + f1(r) + '" style="--d:' + (rnd() * 6).toFixed(2) + 's;--o:' + (0.35 + rnd() * 0.55).toFixed(2) + '"/>';
      }
    }
    // frutos: las personas de tu siembra (hasta 24) en las puntas más altas
    const altas = puntas.slice().sort((a, b) => a[1] - b[1]);
    for (let i = 0; i < Math.min(24, frutos || 0, altas.length); i++) { const [x, yy] = altas[Math.floor(i * altas.length / Math.min(24, frutos, altas.length))];
      frut += '<g class="ap-fr" style="--d:' + (i * 0.17).toFixed(2) + 's"><circle cx="' + f1(x) + '" cy="' + f1(yy) + '" r="13" fill="url(#ap-fruto)"/><circle cx="' + f1(x - 4) + '" cy="' + f1(yy - 4) + '" r="3.4" fill="#fff" opacity=".8"/></g>'; }
    // raíces: los seis atributos
    let raices = "", med = "";
    const claves = ["v", "c", "j", "p", "r", "b"], nombres = { v: "Verdad", c: "Certeza", j: "Justicia", p: "Paz", r: "Principio Racional", b: "Bienestar" };
    claves.forEach((k, i) => {
      const val = ef[k] || 0, x = 105 + i * 158, yy = 1000 + (i % 2 ? 28 : 0), w = 5 + Math.min(20, val * 0.6), op = (0.35 + Math.min(0.65, val / 40)).toFixed(2), col = ATR_COL[k];
      const d = "M" + (488 + i * 5) + " 800C" + f1(470 + (x - 500) * 0.25) + " " + (880 + rnd() * 30).toFixed(0) + " " + f1(x + (500 - x) * 0.25) + " " + (900 + rnd() * 30).toFixed(0) + " " + x + " " + (yy - 46);
      raices += '<path d="' + d + '" stroke="' + col + '" stroke-width="' + f1(w + 10) + '" opacity=".14" fill="none" stroke-linecap="round"/><path class="ap-raiz" d="' + d + '" stroke="' + col + '" stroke-width="' + f1(w) + '" opacity="' + op + '" fill="none" stroke-linecap="round" style="--d:' + (i * 0.4).toFixed(1) + 's"/>';
      med += '<g class="ap-med" style="color:' + col + '"><circle cx="' + x + '" cy="' + yy + '" r="44" fill="#0d0b08" stroke="' + col + '" stroke-width="3" stroke-opacity="' + op + '"/><circle cx="' + x + '" cy="' + yy + '" r="38" fill="' + col + '" opacity=".1"/>' +
        '<g transform="translate(' + (x - 15) + " " + (yy - 30) + ') scale(1.25)">' + ATR_ICO[k] + '</g><text x="' + x + '" y="' + (yy + 25) + '" text-anchor="middle" font-size="25" font-weight="600" fill="currentColor" style="font-family:var(--f-ui)">' + val + '</text>' +
        '<text x="' + x + '" y="' + (yy + 76) + '" text-anchor="middle" font-size="' + (k === "r" ? 19 : 22) + '" fill="var(--tinta-2)" style="font-family:var(--f-ui);letter-spacing:.04em">' + nombres[k] + "</text></g>";
    });
    // corazón: emblema o foto, aro del nivel
    const e = y.emb || {}, col = COLORES[e.c] || COLORES[0], p = y.xpSig ? Math.max(0, Math.min(1, y.xpNivel / y.xpSig)) : 0, foto = y.foto ? fotoUrl(y.inv + "." + y.foto) : "", id = "apf" + (++FOTO_N);
    const corazon = '<circle cx="500" cy="640" r="96" fill="url(#ap-halo2)"/><circle cx="500" cy="640" r="74" fill="#0d0b08" stroke="' + col + '" stroke-width="4"/>' +
      (foto ? '<clipPath id="' + id + '"><circle cx="500" cy="640" r="68"/></clipPath><image href="' + esc(foto) + '" x="432" y="572" width="136" height="136" clip-path="url(#' + id + ')" preserveAspectRatio="xMidYMid slice"/>'
        : '<text x="500" y="' + (/[֐-׿]/.test(e.l || "") ? 664 : 670) + '" text-anchor="middle" font-size="78" fill="' + col + '" style="font-family:' + (/[֐-׿]/.test(e.l || "") ? "'Frank Ruhl Libre'," : "") + "'BiEx Texto','Gentium Book Plus',serif\">" + esc(e.l || "α") + "</text>") +
      '<circle cx="500" cy="640" r="86" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="7"/><circle class="ap-aro" cx="500" cy="640" r="86" fill="none" stroke="url(#ap-oro)" stroke-width="7" stroke-linecap="round" pathLength="100" stroke-dasharray="' + (p * 100).toFixed(1) + ' 100" transform="rotate(-90 500 640)"/>' +
      '<g transform="translate(500 752)"><rect x="-62" y="-20" width="124" height="40" rx="20" fill="url(#ap-oro)"/><text y="9" text-anchor="middle" font-size="25" font-weight="700" fill="#16120b" style="font-family:var(--f-ui);letter-spacing:.06em">NIVEL ' + nivel + "</text></g>";
    let rayos = ""; for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; rayos += '<path d="M500 640L' + f1(500 + 520 * Math.cos(a - 0.05)) + " " + f1(640 + 520 * Math.sin(a - 0.05)) + "L" + f1(500 + 520 * Math.cos(a + 0.05)) + " " + f1(640 + 520 * Math.sin(a + 0.05)) + 'Z"/>'; }
    let motas = ""; for (let i = 0; i < 26; i++) motas += '<circle class="ap-mota" cx="' + f1(80 + rnd() * 840) + '" cy="' + f1(120 + rnd() * 760) + '" r="' + f1(1.6 + rnd() * 2.6) + '" style="--d:' + (rnd() * 9).toFixed(2) + 's;--t:' + (7 + rnd() * 7).toFixed(1) + 's"/>';
    const el = A.svg('<defs><radialGradient id="ap-halo" cx=".5" cy=".42" r=".55"><stop offset="0" stop-color="#f5c64e" stop-opacity=".34"/><stop offset=".55" stop-color="#b9862f" stop-opacity=".1"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="ap-halo2"><stop offset="0" stop-color="#ffe9a8" stop-opacity=".55"/><stop offset="1" stop-color="#f5c64e" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="ap-tronco" x1="0" x2="1"><stop offset="0" stop-color="#4a3415"/><stop offset=".45" stop-color="#b8873a"/><stop offset=".6" stop-color="#e2b55a"/><stop offset="1" stop-color="#3b2a10"/></linearGradient>' +
      '<linearGradient id="ap-oro" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff2c4"/><stop offset=".5" stop-color="#f2c14e"/><stop offset="1" stop-color="#a8701a"/></linearGradient>' +
      '<radialGradient id="ap-copa" cx=".5" cy=".55" r=".5"><stop offset="0" stop-color="#ffe08a" stop-opacity=".30"/><stop offset=".6" stop-color="#f5c64e" stop-opacity=".1"/><stop offset="1" stop-color="#f5c64e" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="ap-fruto" cx=".38" cy=".35" r=".7"><stop offset="0" stop-color="#fff6d6"/><stop offset=".45" stop-color="#f5c64e"/><stop offset="1" stop-color="#9a5f12"/></radialGradient></defs>' +
      '<ellipse cx="500" cy="420" rx="500" ry="440" fill="url(#ap-halo)"/>' +
      '<g class="ap-rayos" fill="#f5c64e" opacity=".028">' + rayos + "</g>" +
      '<ellipse class="ap-copa" cx="500" cy="300" rx="430" ry="250" fill="url(#ap-copa)"/>' + motas +
      '<path d="M500 806C452 790 448 640 470 470 482 446 518 446 530 470 552 640 548 790 500 806Z" fill="url(#ap-tronco)"/>' +
      '<path d="M488 790C476 700 478 600 490 500M512 792C524 700 522 600 510 500M500 800V520" fill="none" stroke="#2a1d0a" stroke-opacity=".45" stroke-width="3" stroke-linecap="round"/>' +
      '<path d="M430 818C462 796 478 786 500 776 522 786 538 796 570 818Z" fill="#3b2a10"/><ellipse cx="500" cy="818" rx="300" ry="26" fill="url(#ap-halo2)" opacity=".55"/>' +
      '<g class="ap-ramas" fill="none" stroke="url(#ap-tronco)" stroke-linecap="round">' + ramas + "</g>" + '<g class="ap-hojas" fill="#f7d77c">' + luces + "</g>" + frut +
      '<line x1="40" y1="812" x2="960" y2="812" stroke="url(#ap-oro)" stroke-opacity=".35" stroke-width="2"/>' + raices + med + corazon, "0 0 1000 1110");
    el.setAttribute("class", "ap-svg"); el.setAttribute("role", "img");
    el.setAttribute("aria-label", "Tu árbol: nivel " + nivel + ", " + Math.round(p * 100) + " % hacia el siguiente; " + claves.map((k) => nombres[k] + " " + (ef[k] || 0)).join(", ") + (frutos ? "; " + plural(frutos, "fruto de tu siembra", "frutos de tu siembra") : ""));
    return el;
  }
  // Figura por capas con la armadura (Efesios 6:13-17; nombres provisionales) y los accesorios
  function figuraArmadura(av) {
    const g = (id) => Math.max(0, Math.min(5, (av.eq || {})[id] | 0)), c = (id) => GR_COL[g(id)], acc = av.acc || {};
    const auraC = { "aura-oro": "#f5c64e", "aura-zafiro": "#4f86f7", "aura-esmeralda": "#3ccf8e", "aura-amatista": "#a874f2", "aura-alba": "#ffb38a" }[acc.aura];
    const mantoC = { "manto-lino": "#e8e0c8", "manto-escarlata": "#b8323a", "manto-azul": "#2d5fb3" }[acc.manto];
    const s = '<defs><linearGradient id="av-gema" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9ff3e0"/><stop offset=".5" stop-color="#7a9cff"/><stop offset="1" stop-color="#c58bff"/></linearGradient>' +
      '<radialGradient id="av-aura"><stop offset="0" stop-color="' + (auraC || "#f5c64e") + '" stop-opacity=".55"/><stop offset="1" stop-color="' + (auraC || "#f5c64e") + '" stop-opacity="0"/></radialGradient></defs>' +
      (auraC ? '<ellipse class="av-aura" cx="100" cy="150" rx="96" ry="140" fill="url(#av-aura)"/>' : "") +
      (mantoC ? '<path d="M64 84C40 150 34 220 40 272L160 272C166 220 160 150 136 84Z" fill="' + mantoC + '" opacity=".9"/>' : "") +
      // cuerpo y túnica
      '<circle cx="100" cy="50" r="20" fill="#d9b48a"/><path d="M92 68h16v12H92z" fill="#c79f74"/>' +
      '<path d="M70 82Q100 74 130 82L146 250Q100 262 54 250Z" fill="#3a3024"/><path d="M70 82L56 160 66 162 78 98ZM130 82L144 160 134 162 122 98Z" fill="#33291e"/>' +
      // coraza
      (g("coraza") ? '<path d="M74 86Q100 78 126 86L122 140Q100 152 78 140Z" fill="' + c("coraza") + '" stroke="rgba(0,0,0,.35)"/><path d="M100 86V146" stroke="rgba(0,0,0,.25)"/>' : "") +
      // cinto
      (g("cinto") ? '<rect x="70" y="146" width="60" height="12" rx="4" fill="' + c("cinto") + '" stroke="rgba(0,0,0,.35)"/><rect x="95" y="144" width="10" height="16" rx="2" fill="' + c("cinto") + '" stroke="rgba(0,0,0,.45)"/>' : "") +
      // calzado
      (g("calzado") ? '<path d="M72 252h22v14H66q0-10 6-14zM106 252h22q6 4 6 14h-28z" fill="' + c("calzado") + '" stroke="rgba(0,0,0,.35)"/>' : '<path d="M74 252h18v10H70zM108 252h18l4 10h-22z" fill="#2a2119"/>') +
      // escudo
      (g("escudo") ? '<path d="M22 112Q44 100 66 112V170Q66 196 44 208 22 196 22 170Z" fill="' + c("escudo") + '" stroke="rgba(0,0,0,.4)" stroke-width="1.5"/><path d="M44 118V200M28 150H60" stroke="rgba(0,0,0,.28)" stroke-width="2"/>' : "") +
      // yelmo
      (g("yelmo") ? '<path d="M78 50Q78 24 100 22 122 24 122 50L118 52Q100 40 82 52Z" fill="' + c("yelmo") + '" stroke="rgba(0,0,0,.35)"/><path d="M100 22V8" stroke="' + c("yelmo") + '" stroke-width="4" stroke-linecap="round"/>' : "") +
      // espada
      (g("espada") ? '<path d="M156 96L162 96 164 214 159 222 154 214Z" fill="' + c("espada") + '" stroke="rgba(0,0,0,.35)"/><rect x="146" y="214" width="26" height="6" rx="3" fill="' + c("espada") + '"/><rect x="156" y="220" width="6" height="18" rx="2" fill="#5a3d1c"/>' : "") +
      // corona y sello
      (acc.corona ? '<path d="M80 34Q100 18 120 34" fill="none" stroke="' + (acc.corona === "corona-laurel" ? "#9fcf6a" : "#8db36b") + '" stroke-width="5" stroke-linecap="round" stroke-dasharray="6 3"/>' : "") +
      (acc.sello ? '<circle cx="100" cy="112" r="8" fill="#f5c64e" stroke="#7a5212"/><path d="M100 106l1.8 3.8 4.2.4-3.2 2.8 1 4.1-3.8-2.2-3.8 2.2 1-4.1-3.2-2.8 4.2-.4z" fill="#7a5212"/>' : "");
    const el = A.svg(s, "0 0 200 280"); el.setAttribute("class", "av-fig"); return el;
  }
  const errPoder = (r) => r.error === "sin_dracmas" ? "Te faltan " + fmt(r.falta || 0) + " dracmas: cada perícopa leída te acerca" : r.error === "sin_cantos" ? "Te faltan " + plural(r.falta || 1, "canto", "cantos") + " para esa forja: aparecen al leer" : r.error === "sin_puntos" ? "No tienes tantos puntos por repartir" : r.error === "tope" ? "Ya llegaste al tope" : r.error === "ya_tienes" ? "Ya lo tienes" : mensaje(r);
  async function accionPoder(ruta, cuerpo, ok) {
    const r = await pedir(ruta, { metodo: "POST", cuerpo: cuerpo || {} });
    if (r.error) { A.avisar(errPoder(r)); return null; }
    if (r.yo) actualizarYo(r.yo); PODER = null;
    if (ok) A.avisar(ok); sonar("chispa"); vibrar([10, 30, 12]);
    return r;
  }
  function tarjetaAtributos(y, P, rehacer) {
    const av = P.av, defs = P.def.atrib, plan = {}; let libres = av.pts;
    const filas = defs.map(([k, n, efecto]) => {
      const val = h("b", { text: String(av.ef[k]) }), mas = h("span", { class: "ap-plan" });
      const pint = () => { mas.textContent = plan[k] ? "+" + plan[k] : ""; val.textContent = String(av.ef[k] + (plan[k] || 0)); };
      const btn = (d, t, lbl) => h("button", { class: "ap-b", type: "button", "aria-label": lbl + " " + n, onclick: () => { if (d > 0 && libres <= 0) return A.avisar(av.pts ? "Ya repartiste todos tus puntos" : "Sube de nivel o compra un punto en la tienda"); if (d < 0 && !plan[k]) return; plan[k] = (plan[k] || 0) + d; libres -= d; pint(); total(); vibrar(6); } }, t);
      return h("li", { style: "--ac:" + ATR_COL[k] }, h("span", { class: "ap-ico", "aria-hidden": "true" }, A.svg(ATR_ICO[k])), h("span", { class: "ap-n" }, h("b", { text: n }), h("small", { text: efecto })),
        h("span", { class: "ap-v" }, val, mas), h("span", { class: "ap-bs" }, btn(-1, "−", "Quitar un punto de"), btn(1, "+", "Sumar un punto a")));
    });
    const quedan = h("span", { class: "ap-pts" }), confirmar = h("button", { class: "btn oro", type: "button", disabled: true, onclick: async (e) => {
      e.currentTarget.disabled = true; const r = await accionPoder("/poder/repartir", { at: plan }, "Puntos repartidos"); if (r) { chispas(16); rehacer(); } else e.currentTarget.disabled = false; } }, h("span", { text: "Repartir" }));
    function total() { const n = Object.values(plan).reduce((a, x) => a + x, 0); quedan.replaceChildren(h("b", { text: String(libres) }), " " + (libres === 1 ? "punto por repartir" : "puntos por repartir")); confirmar.disabled = !n; }
    total();
    const gratis = av.sem !== semanaClave();
    return tarjeta("Atributos", ico("arbol"), h("p", { class: "jg-mini", text: "Cada nivel te da " + P.def.ptsNivel + " puntos. Repártelos como quieras: tu poder crece hacia donde decidas. La armadura suma 2 por grado a su atributo." }),
      h("div", { class: "ap-cab" }, quedan, h("span", { class: "ap-poder" }, "Poder ", h("b", { text: fmt(av.poder) }))),
      h("ul", { class: "ap-atr" }, filas),
      h("div", { class: "jg-acciones" }, confirmar,
        h("button", { class: "btn", type: "button", onclick: async () => { const r = await accionPoder("/tienda/comprar", { item: "punto" }, "Compraste un punto de atributo"); if (r) rehacer(); } }, h("span", { text: "Comprar punto · " + fmt(av.precioPunto) + " dr." })),
        av.tot - av.pts > 0 ? h("button", { class: "btn", type: "button", onclick: async () => { const r = await accionPoder("/poder/reasignar", {}, "Tus puntos volvieron: repártelos de nuevo"); if (r) rehacer(); } }, h("span", { text: gratis ? "Reasignar (gratis esta semana)" : "Reasignar · 60 dr." })) : null));
  }
  const semanaClave = () => { const d = new Date(), j = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())), dia = (j.getUTCDay() + 6) % 7; j.setUTCDate(j.getUTCDate() - dia + 3); const y0 = new Date(Date.UTC(j.getUTCFullYear(), 0, 4)); return j.getUTCFullYear() + "-" + String(1 + Math.round(((j - y0) / 864e5 - 3 + ((y0.getUTCDay() + 6) % 7)) / 7)).padStart(2, "0"); };
  function tarjetaArmadura(y, P, rehacer) {
    const av = P.av, d = P.def, cantos = (P.piedras || []).reduce((a, x) => a + x, 0);
    const filas = d.piezas.map(([id, n, at]) => { const gr = av.eq[id] | 0, sig = d.forja[gr + 1], nAt = (d.atrib.find((a) => a[0] === at) || [])[1];
      return h("li", {}, h("span", { class: "ap-gr", style: "--gc:" + (gr === 5 ? "#9ff3e0" : GR_COL[gr]) }, String(gr)), h("span", { class: "ap-n" }, h("b", { text: n + " · " + d.grados[gr] }), h("small", { text: "Fortalece " + nAt + (gr ? " (+" + 2 * gr + ")" : "") })),
        sig ? h("button", { class: "btn chico" + (P.dr >= sig.dr && cantos >= sig.cantos ? " oro" : ""), type: "button", onclick: async () => { const r = await accionPoder("/tienda/comprar", { item: "forja:" + id }, n + " forjado en " + d.grados[gr + 1].toLowerCase()); if (r) { chispas(18); rehacer(); } } },
          h("span", { text: "Forjar · " + sig.dr + " dr." + (sig.cantos ? " + " + plural(sig.cantos, "canto", "cantos") : "") })) : h("span", { class: "jg-chip", text: "Máximo" })); });
    return tarjeta("Armadura", ico("liga"), h("div", { class: "ap-arm" }, h("div", { class: "ap-fig" }, figuraArmadura(av)), h("ul", { class: "ap-piezas" }, filas)),
      h("p", { class: "jg-mini", text: "Efesios 6:13-17. Grados: " + d.grados.slice(1).join(", ") + ". Desde la plata, la forja pide cantos de tus hallazgos (salen de los más repetidos). Nombres provisionales: se precisarán con la traducción." }));
  }
  function tarjetaTienda(y, P, rehacer) {
    const av = P.av, d = P.def;
    const uso = d.uso.map(([id, n, pr, ds]) => h("li", {}, h("span", { class: "ap-n" }, h("b", { text: n }), h("small", { text: ds })),
      h("button", { class: "btn chico" + (P.dr >= pr ? " oro" : ""), type: "button", onclick: async () => { const r = await accionPoder("/tienda/comprar", { item: "uso:" + id }, n + ": listo"); if (r) rehacer(); } }, h("span", { text: pr + " dr." }))));
    const acc = d.ranuras.map((ran) => h("div", { class: "ap-ran" }, h("p", { class: "jg-mini", text: { aura: "Auras", manto: "Mantos", corona: "Coronas", sello: "Sellos" }[ran] }),
      h("ul", { class: "ap-acc" }, d.acc.filter((x) => x[1] === ran).map(([id, , n, pr]) => { const tiene = av.inv.includes(id), puesto = av.acc[ran] === id;
        return h("li", { class: puesto ? "puesto" : "" }, h("span", { class: "ap-n" }, h("b", { text: n })),
          tiene ? h("button", { class: "btn chico" + (puesto ? "" : " oro"), type: "button", onclick: async () => { const r = await accionPoder("/poder/equipar", { ranura: ran, id: puesto ? null : id }, puesto ? "Te lo quitaste" : "Equipado"); if (r) rehacer(); } }, h("span", { text: puesto ? "Quitar" : "Equipar" }))
            : h("button", { class: "btn chico" + (P.dr >= pr ? " oro" : ""), type: "button", onclick: async () => { const r = await accionPoder("/tienda/comprar", { item: "acc:" + id }, n + ": tuyo y equipado"); if (r) { chispas(14); rehacer(); } } }, h("span", { text: pr + " dr." }))); }))));
    return tarjeta("Tienda de dracmas", ico("dracma"), h("p", { class: "ap-dr" }, "Tienes ", h("b", { text: fmt(P.dr) }), " dracmas. Se ganan leyendo: misiones, hallazgos y perícopas confirmadas. Nada se compra con dinero."),
      h("ul", { class: "ap-uso" }, uso, h("li", {}, h("span", { class: "ap-n" }, h("b", { text: "Cambio de apodo" }), h("small", { text: "Una vez cada 3 semanas" })), h("a", { class: "btn chico", href: "#/escudrina/cuenta" }, h("span", { text: ((y.apodoCambio && y.apodoCambio.precio) || 120) + " dr." })))),
      ...acc);
  }
  // Foto de perfil: se recorta al centro, 256 × 256 a la densidad exacta, WebP (o JPEG) de menos de 90 KB
  async function elegirFoto(rehacer) {
    const inp = h("input", { type: "file", accept: "image/*" });
    inp.addEventListener("change", async () => {
      const f = inp.files && inp.files[0]; if (!f) return;
      try {
        const bm = await createImageBitmap(f), lado = Math.min(bm.width, bm.height), cv = document.createElement("canvas"); cv.width = cv.height = 256;
        const cx = cv.getContext("2d"); cx.imageSmoothingQuality = "high"; cx.drawImage(bm, (bm.width - lado) / 2, (bm.height - lado) / 2, lado, lado, 0, 0, 256, 256);
        let q = 0.88, b = null, tipo = "image/webp";
        for (let i = 0; i < 6; i++) { b = await new Promise((r) => cv.toBlob(r, tipo, q)); if (!b || b.type !== tipo) { tipo = "image/jpeg"; continue; } if (b.size <= 88000) break; q -= 0.12; }
        if (!b || b.size > 90000) return A.avisar("Esa imagen no se pudo reducir lo suficiente");
        const b64 = await new Promise((r) => { const fr = new FileReader(); fr.onload = () => r(String(fr.result).split(",")[1]); fr.readAsDataURL(b); });
        const r = await accionPoder("/foto", { img: b64 }, "Tu foto de perfil ya se ve"); if (r) rehacer();
      } catch (e) { A.avisar("No se pudo leer esa imagen"); }
    });
    inp.click();
  }
  function verFoto(f, apodo) {
    const u = fotoUrl(f); if (!u) return;
    A.abrirModal(() => A.cajaModal(A.cabModal(apodo || "Foto de perfil", "Foto de perfil"), h("div", { class: "jg ap-verfoto" }, h("img", { src: u, alt: "Foto de perfil de " + (apodo || "un lector"), width: "256", height: "256" }),
      h("p", { class: "jg-mini", text: "Las fotos se ven para todos. Si una no es apropiada, repórtala: con varios reportes se oculta hasta que el equipo la revise." }),
      h("div", { class: "jg-acciones" }, h("button", { class: "btn", type: "button", onclick: async (e) => { e.currentTarget.disabled = true; const r = await pedir("/foto/reportar", { metodo: "POST", cuerpo: { f } }); A.avisar(r.error ? mensaje(r) : "Gracias: el equipo la revisará"); A.cerrarModal(); } }, h("span", { text: "Reportar esta foto" }))))));
  }
  async function pintarPoder(zona, y) {
    const P = await cargarPoder(true); if (!zona.isConnected) return;
    if (P.error) return zona.replaceChildren(tarjeta(null, null, h("p", { text: mensaje(P) })));
    const rehacer = () => pintarPoder(zona, S.yo || y);
    const yy = S.yo || y, av = P.av, pct = yy.xpSig ? Math.max(0, Math.min(100, (100 * yy.xpNivel) / yy.xpSig)) : 0;
    const datos = h("div", { class: "ap-datos" },
      h("p", { class: "ap-ap" }, h("b", { text: yy.apodo }), h("span", { text: yy.rangoNombre + " · nivel " + yy.nivel })),
      h("div", { class: "jg-barra", role: "progressbar", "aria-valuemin": "0", "aria-valuemax": String(yy.xpSig), "aria-valuenow": String(yy.xpNivel), "aria-label": "Experiencia hacia el nivel siguiente" }, h("i", { style: "width:" + pct.toFixed(1) + "%" })),
      h("p", { class: "jg-mini ap-prog", text: fmt(yy.xpNivel) + " de " + fmt(yy.xpSig) + " para el nivel " + (yy.nivel + 1) + " · " + fmt(yy.xp) + " en total" }),
      h("ul", { class: "ap-cifras" },
        h("li", {}, h("b", { text: fmt(av.poder) }), h("small", { text: "poder" })),
        h("li", {}, h("b", { text: yy.fundador ? "n.º " + fmt(yy.n) : "—" }), h("small", { text: yy.fundador ? "Primicia" : "sin Primicia" })),
        h("li", {}, h("b", { text: fmt(P.dr) }), h("small", { text: "dracmas" })),
        h("li", {}, h("b", { text: String(av.pts) }), h("small", { text: av.pts === 1 ? "punto libre" : "puntos libres" })),
        h("li", {}, h("b", { text: fmt((yy.lect && yy.lect.est) || yy.vt || 0) }), h("small", { text: "versos leídos (est.)" })),
        h("li", {}, h("b", { text: fmt((yy.invi && yy.invi.unidos) || 0) }), h("small", { text: "frutos de tu siembra" }))),
      tarjetaColeccion(yy),
      h("div", { class: "jg-acciones ap-foto" }, h("button", { class: "btn", type: "button", onclick: () => elegirFoto(rehacer) }, ico("persona"), h("span", { text: yy.foto ? "Cambiar mi foto" : "Subir mi foto" })),
        yy.foto ? h("button", { class: "btn", type: "button", onclick: async () => { const r = await accionPoder("/foto/quitar", {}, "Quitaste tu foto"); if (r) rehacer(); } }, h("span", { text: "Quitar la foto" })) : null,
        yy.fotoOculta ? h("p", { class: "jg-mini", text: "Tu foto está oculta mientras el equipo la revisa." }) : null));
    const heroe = h("section", { class: "ap-heroe" }, h("div", { class: "ap-lienzo" }, arbolPoder(yy, av, (yy.invi && yy.invi.unidos) || 0)), datos);
    zona.replaceChildren(heroe, tarjetaAtributos(yy, P, rehacer), h("div", { class: "jg-dos" }, tarjetaArmadura(yy, P, rehacer), tarjetaTienda(yy, P, rehacer)));
    animarCifras(zona);
  }
  // Ningún dato vacío se ve como «null» (BiEx, 10-nov-2026): apodos, fechas y padre con su respaldo
  function limpiarArbol(r) {
    if (!r || r.error) return r;
    const ap = (x, n) => (x != null && String(x).trim() && String(x) !== "null" ? String(x) : n ? "Primicia n.º " + n : "Lector sin apodo");
    if (r.raiz) r.raiz.a = ap(r.raiz.a);
    for (const n of r.nodos || []) { n.a = ap(n.a); if (!n.f || n.f === "null") n.f = ""; }
    if (r.padre === "null") r.padre = null;
    if (!Array.isArray(r.gens)) r.gens = [];
    if (!Array.isArray(r.nodos)) r.nodos = [];
    return r;
  }
  function tarjetaSiembra(y) {
    const zona = h("div", { class: "jg-siembra" });
    const unidos = (y.invi && y.invi.unidos) || 0;
    if (!unidos) zona.append(h("p", { text: "Cuando alguien llegue con tu enlace, aquí nacerá tu árbol: verás a cada persona y a las que lleguen por ellas, generación tras generación." }));
    else {
      zona.append(h("p", { class: "jg-mini", text: "Cargando tu árbol…" }));
      pedir("/arbol?prof=2", { guardable: true }).then((r) => {
        limpiarArbol(r);
        if (r.error) return zona.replaceChildren(h("p", { class: "jg-mini", text: "Tu árbol se verá aquí en un momento." }));
        zona.replaceChildren(h("a", { class: "jg-siembra-svg", href: "#/escudrina/arbol", "aria-label": "Ver mi árbol de la siembra" }, dibujoArbol(r, true)),
          h("div", {}, h("p", { class: "jg-total" }, cifra(r.raiz.d), " " + (r.raiz.d === 1 ? "persona" : "personas")),
            h("p", { class: "jg-mini", text: r.gens.map(([k, n]) => ordGen(k) + " generación: " + fmt(n)).join(" · ") + (r.raiz.dc ? " · " + plural(r.raiz.dc, "confirmada", "confirmadas") : "") })));
        animarCifras(zona);
      });
    }
    return tarjeta("Árbol de la siembra", ico("arbol"), zona, h("div", { class: "jg-acciones" }, h("a", { class: "btn", href: "#/escudrina/arbol" }, ico("arbol"), h("span", { text: "Ver mi árbol" }))));
  }
  async function pintarArbol(cont, raiz) {
    document.title = "Árbol de la siembra · Escudriña · BiEx";
    const zona = h("div", { class: "jg" }, h("p", { class: "cargando", text: "Cargando tu árbol…" }));
    const poder = raiz ? null : h("div", { class: "jg ap" }, h("p", { class: "cargando", text: "Despertando tu árbol…" }));
    if (raiz) marco(cont, cabSub("Árbol de la siembra", "Cada persona que llegó con tu enlace y las que llegaron por ellas, generación tras generación: hasta dónde llegó lo que sembraste al compartir el Mensaje."), zona);
    else { marco(cont, cabeceraJuego("arbol"), poder, h("h2", { class: "ap-sub", text: "Tu siembra" }), zona); (S.yo ? Promise.resolve(S.yo) : pedir("/yo").then((r) => { if (!r.error) actualizarYo(r.yo); return S.yo; })).then((y) => { if (y) pintarPoder(poder, y); else poder.replaceChildren(); }); }
    const r = await pedir("/arbol?" + new URLSearchParams(raiz ? { raiz, prof: "3" } : { prof: "3" }), { guardable: true });
    if (cont !== S.cont || !zona.isConnected) return;
    limpiarArbol(r);
    if (r.error) return zona.replaceChildren(tarjeta(null, null, h("p", { text: r.error === "no_existe" ? "Esa rama no está en tu árbol." : mensaje(r) }), h("a", { class: "btn", href: "#/escudrina/arbol" }, h("span", { text: "Ver mi árbol" }))));
    const R0 = r.raiz, propia = !!R0.propia, M = (S.cfg && S.cfg.micro) || { 2: 15, 3: 5 };
    const maxG = Math.max(1, ...r.gens.map((g) => g[1]));
    const resumen = tarjeta(propia ? "Tu siembra" : "Rama de " + R0.a, ico("arbol"),
      h("p", { class: "jg-total" }, cifra(R0.d), " " + (R0.d === 1 ? "persona" : "personas") + (r.gens.length ? " en " + plural(r.gens.length, "generación", "generaciones") : "")),
      R0.d ? h("p", { class: "jg-mini", text: plural(R0.dc, "persona confirmó su lugar", "personas confirmaron su lugar") + " (leyeron sus primeros 20 versos o aseguraron su cuenta)." }) : null,
      r.gens.length ? h("ul", { class: "jg-gen" }, r.gens.map(([k, n, c]) => h("li", {}, h("span", { text: ordGen(k) + " generación" }), h("span", { class: "b", "aria-hidden": "true" }, h("i", { style: "width:" + Math.max(4, (100 * n) / maxG).toFixed(1) + "%" })),
        h("span", {}, cifra(n), c ? " · " + fmt(c) + " ✓" : "")))) : null,
      propia && r.padre ? h("p", { class: "jg-mini", text: "Tú llegaste con la invitación de " + r.padre + "." }) : null,
      propia ? h("p", { class: "jg-mini", text: "Quien llega con tu enlace es tu 1.ª generación y te sube en la escalera del Sembrador; por cada persona que confirma en tu 2.ª generación (las que invitan tus invitados) recibes " + M[2] + " min de experiencia doble, y " + M[3] + " min en la 3.ª. Desde la 4.ª, tu árbol sigue creciendo a la vista." })
        : h("a", { class: "btn chico", href: "#/escudrina/arbol" }, h("span", { text: "‹ Volver a mi árbol" })),
      r.trunc ? h("p", { class: "jg-mini", text: "Tu árbol pasa de 20 000 personas: aquí se ve una muestra." }) : null);
    if (!R0.d) return zona.replaceChildren(resumen, tarjeta(null, null, h("p", { text: propia ? "Tu árbol nace con la primera persona que llegue con tu enlace. Comparte el Mensaje y aquí verás crecer cada rama." : R0.a + " todavía no tiene ramas." }),
      propia ? h("div", { class: "jg-acciones" }, h("button", { class: "btn oro", type: "button", onclick: compartirInvitacion }, ico("compartir"), h("span", { text: "Compartir mi enlace" }))) : null));
    const porC = new Map(r.nodos.map((n) => [n.c, n]));
    const ficha = h("div", { class: "jg-ficha", "aria-live": "polite" }, h("p", { class: "jg-mini", text: "Toca a una persona para ver su rama." }));
    const dib = dibujoArbol(r, false);
    const elegir = (c) => {
      const n = porC.get(c); if (!n) return;
      for (const g of dib.querySelectorAll(".jg-nodo.sel")) g.classList.remove("sel");
      for (const g of dib.querySelectorAll(".jg-nodo")) if (g.getAttribute("data-c") === c) g.classList.add("sel");
      // el linaje de esa persona hasta el centro se ilumina
      for (const x of dib.querySelectorAll(".rama.linaje")) x.classList.remove("linaje");
      for (let k = n, i = 0; k && i < 12; k = k.p ? porC.get(k.p) : null, i++) { const ruta = [...dib.querySelectorAll(".rama")].find((x) => x.getAttribute("data-c") === k.c); if (ruta) ruta.classList.add("linaje"); }
      const padre = n.p ? porC.get(n.p) : null;
      ficha.replaceChildren(h("p", { class: "jg-nombre", text: n.a }),
        h("p", { class: "jg-mini", text: ordGen(n.k) + " generación" + (padre ? " · llegó por " + padre.a : "") + (n.f ? " · " + diaCorto(n.f) : "") + (n.pr ? " · Primicia" : "") }),
        h("p", { text: (n.ok ? "Confirmó su lugar." : "Todavía no confirma su lugar (lo hace al leer sus primeros 20 versos o al asegurar su cuenta).") + (n.h ? " Trajo a " + plural(n.h, "persona", "personas") + (n.d > n.h ? " y su rama ya suma " + fmt(n.d) : "") + "." : "") }),
        n.h ? h("a", { class: "btn chico", href: "#/escudrina/arbol/" + n.c }, ico("arbol"), h("span", { text: "Ver su rama" })) : null);
    };
    dib.addEventListener("click", (e) => { const g = e.target.closest && e.target.closest(".jg-nodo"); if (g) elegir(g.getAttribute("data-c")); });
    dib.addEventListener("keydown", (e) => { if (e.key !== "Enter" && e.key !== " ") return; const g = e.target.closest && e.target.closest(".jg-nodo"); if (g) { e.preventDefault(); elegir(g.getAttribute("data-c")); } });
    const lista = h("ol", { class: "jg-arbol-lista" }, r.nodos.map((n) => { const padre = n.p ? porC.get(n.p) : null; return h("li", { class: n.ok ? "ok" : "" },
      h("span", {}, h("b", { text: n.a }), h("small", { text: " · " + ordGen(n.k) + (padre ? " · por " + padre.a : "") })),
      h("span", { class: "jg-mini", text: [n.d ? fmt(n.d) + " en sus ramas" : "", n.ok ? "✓" : ""].filter(Boolean).join(" · ") })); }));
    zona.replaceChildren(resumen,
      tarjeta("Las ramas", null, arbolVivo(dib, r), h("p", { class: "jg-mini", text: "● confirmó su lugar · ○ todavía no · +N: personas que se ven al abrir su rama · pellizca o usa + y − para acercarte" }), ficha),
      tarjeta("Por generación", null, lista, r.nodos.length < R0.d ? h("p", { class: "jg-mini", text: "Se muestran " + fmt(r.nodos.length) + " de " + fmt(R0.d) + " personas (hasta la " + ordGen(r.prof) + " generación). Toca una persona y abre su rama para ver más." }) : null));
    animarCifras(zona);
  }

  // Árbol vivo (BiEx, 9-nov-2026: «más espectacular e interactivo»): crece generación tras generación desde el centro, un
  // pulso de siembra sale de tu emblema, una órbita de luz gira despacio, y se puede acercar (pellizco, rueda o + y −) y
  // mover. Todo por el compositor (transformaciones y opacidad); con «Sin animaciones» queda quieto.
  function arbolVivo(svg, r) {
    const quieto = sinAnim() || !svg.animate;
    const caja = h("div", { class: "jg-arbol-caja jg-arbol-vivo" });
    const capa = h("div", { class: "jg-arbol-mov" }, svg);
    const luz = h("div", { class: "jg-arbol-luz", "aria-hidden": "true" }), pulso = h("div", { class: "jg-arbol-pulso", "aria-hidden": "true" });
    const orbita = h("div", { class: "jg-arbol-orbita", "aria-hidden": "true" }, Array.from({ length: 7 }, (_, i) => h("i", { style: "transform:rotate(" + (i * 51.4 + (i % 2) * 9) + "deg)" })));
    // Nitidez (BiEx, 10-nov-2026: «al acercar sale borroso»): durante el gesto la capa se escala por el compositor y, al
    // detenerse, la vista se fija en el viewBox del SVG (vectorial: nítido a cualquier tamaño) y la capa vuelve a su escala 1.
    // (zc, xc, yc) es la vista ya fijada en el viewBox; la capa solo lleva la diferencia con la vista pedida (z, x, y).
    const ZMAX = 6;
    let z = 1, x = 0, y = 0, movido = false; const ptrs = new Map(); let d0 = 0, z0 = 1;
    let zc = 1, xc = 0, yc = 0, tFijar = 0;
    const limitar = () => { const w = caja.clientWidth || 1, m = (z - 1) * w / 2; x = Math.max(-m, Math.min(m, x)); y = Math.max(-m, Math.min(m, y)); };
    const fijar = () => {
      clearTimeout(tFijar); if (ptrs.size) return;
      const w = caja.clientWidth || 1, k = 1000 / w, c = w / 2, vw = 1000 / z;
      svg.setAttribute("viewBox", ((c - (c + x) / z) * k).toFixed(2) + " " + ((c - (c + y) / z) * k).toFixed(2) + " " + vw.toFixed(2) + " " + vw.toFixed(2));
      zc = z; xc = x; yc = y; capa.style.transform = "none";
    };
    const aplicar = (pronto) => {
      const r = z / zc, tx = x - xc * r, ty = y - yc * r;
      capa.style.transform = Math.abs(r - 1) < 1e-4 && Math.abs(tx) < 0.05 && Math.abs(ty) < 0.05 ? "none" : "translate(" + tx.toFixed(1) + "px," + ty.toFixed(1) + "px) scale(" + r.toFixed(4) + ")";
      caja.style.touchAction = z > 1.01 ? "none" : "pan-y"; caja.classList.toggle("cerca", z > 1.01);
      clearTimeout(tFijar); tFijar = setTimeout(fijar, pronto ? 0 : 160);
    };
    const acercar = (f) => { z = Math.max(1, Math.min(ZMAX, z * f)); if (z === 1) { x = 0; y = 0; } limitar(); aplicar(); };
    const verTodo = () => { z = 1; x = 0; y = 0; aplicar(true); };
    // los botones + − ⟲ no son parte del gesto: pulsarlos rápido ya no se toma como arrastre ni como doble toque
    caja.addEventListener("pointerdown", (e) => { movido = false; if (e.target.closest && e.target.closest(".jg-arbol-ctl")) return; ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY }); if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; d0 = Math.hypot(a.x - b.x, a.y - b.y) || 1; z0 = z; } });
    caja.addEventListener("pointermove", (e) => {
      const p = ptrs.get(e.pointerId); if (!p) return;
      const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
      if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; z = Math.max(1, Math.min(ZMAX, z0 * Math.hypot(a.x - b.x, a.y - b.y) / d0)); movido = true; }
      else if (z > 1.01) { x += dx; y += dy; if (Math.abs(dx) + Math.abs(dy) > 2) movido = true; } else return;
      limitar(); aplicar();
    });
    const soltar = (e) => { if (!ptrs.delete(e.pointerId)) return; if (!ptrs.size) aplicar(true); };
    caja.addEventListener("pointerup", soltar); caja.addEventListener("pointercancel", soltar);
    caja.addEventListener("click", (e) => { if (movido) { e.stopPropagation(); e.preventDefault(); movido = false; } }, true);
    caja.addEventListener("wheel", (e) => { if (!e.ctrlKey && z === 1 && e.deltaY > 0) return; e.preventDefault(); acercar(e.deltaY < 0 ? 1.15 : 1 / 1.15); }, { passive: false });
    caja.addEventListener("dblclick", (e) => { if (e.target.closest && e.target.closest(".jg-nodo, .jg-arbol-ctl")) return; verTodo(); });
    const ctl = h("div", { class: "jg-arbol-ctl" },
      h("button", { type: "button", "aria-label": "Acercar", onclick: () => acercar(1.4) }, "+"), h("button", { type: "button", "aria-label": "Alejar", onclick: () => acercar(1 / 1.4) }, "−"),
      h("button", { type: "button", "aria-label": "Ver todo el árbol", onclick: verTodo }, "⟲"));
    caja.append(luz, orbita, capa, pulso, ctl); aplicar();
    if (!quieto) {
      const P = Math.max(1, ...r.nodos.map((n) => n.k));
      for (let k = 1; k <= P; k++) {
        const t = 260 + (k - 1) * 420;
        for (const el of svg.querySelectorAll(".anillo.g" + k)) el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 700, delay: t, fill: "backwards" });
        for (const el of svg.querySelectorAll(".rama.g" + k)) el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 650, delay: t + 80, fill: "backwards", easing: "ease-out" });
        svg.querySelectorAll(".jg-nodo.g" + k).forEach((el, i) => el.animate([{ opacity: 0, transform: "scale(.2)" }, { opacity: 1, transform: "scale(1.15)", offset: 0.7 }, { opacity: 1, transform: "none" }], { duration: 620, delay: t + 200 + Math.min(i, 30) * 14, fill: "backwards", easing: "cubic-bezier(.2,.8,.2,1)" }));
      }
      pulso.animate([{ opacity: 0.9, transform: "scale(.05)" }, { opacity: 0, transform: "scale(1)" }], { duration: 1800, delay: 200, iterations: 2, easing: "cubic-bezier(.2,.6,.3,1)", fill: "backwards" });
      orbita.animate([{ transform: "rotate(0deg)" }, { transform: "rotate(360deg)" }], { duration: 60000, iterations: Infinity, easing: "linear" });
      luz.animate([{ opacity: 0.55 }, { opacity: 1 }, { opacity: 0.55 }], { duration: 4200, iterations: Infinity, easing: "ease-in-out" });
    }
    return caja;
  }

  // --- imagen para compartir (lienzo de 1080 × 1350, a su tamaño exacto: nítida en cualquier red)
  async function imagenTarjeta(op) {
    const y = S.yo || {}, W = 1080, H = 1350, cv = document.createElement("canvas"); cv.width = W; cv.height = H;
    const c = cv.getContext("2d"), T = "'BiEx Texto',Georgia,serif", D = "'BiEx Titular','BiEx Texto',Georgia,serif", U = "'BiEx Interfaz','Segoe UI',sans-serif";
    try { await Promise.all(["600 90px 'BiEx Titular'", "italic 400 46px 'BiEx Titular'", "400 40px 'BiEx Texto'", "italic 400 34px 'BiEx Texto'", "500 28px 'BiEx Interfaz'"].map((f) => document.fonts.load(f))); } catch (e) { /* sin fuentes: respaldo */ }
    c.fillStyle = "#07070a"; c.fillRect(0, 0, W, H);
    const luz = (x, y0, r, a) => { const g = c.createRadialGradient(x, y0, 10, x, y0, r); g.addColorStop(0, "rgba(201,168,101," + a + ")"); g.addColorStop(1, "rgba(201,168,101,0)"); c.fillStyle = g; c.fillRect(0, 0, W, H); };
    luz(W / 2, 360, 720, 0.30); luz(140, 1230, 520, 0.10); luz(960, 1180, 460, 0.08);
    c.textAlign = "center"; c.textBaseline = "alphabetic";
    for (let i = 0; i < 46; i++) { const l = LETRAS[(i * 7) % LETRAS.length]; c.font = (26 + (i * 13) % 40) + "px " + T; c.fillStyle = "rgba(232,207,148," + (0.035 + ((i * 5) % 7) / 140).toFixed(3) + ")"; c.fillText(l, (i * 233) % W, 60 + (i * 397) % (H - 80)); }
    const rr = (x, y0, w, hh, r) => { c.beginPath(); c.moveTo(x + r, y0); c.arcTo(x + w, y0, x + w, y0 + hh, r); c.arcTo(x + w, y0 + hh, x, y0 + hh, r); c.arcTo(x, y0 + hh, x, y0, r); c.arcTo(x, y0, x + w, y0, r); c.closePath(); };
    c.strokeStyle = "rgba(201,168,101,.62)"; c.lineWidth = 2.5; rr(44, 44, W - 88, H - 88, 38); c.stroke();
    c.strokeStyle = "rgba(201,168,101,.22)"; c.lineWidth = 1; rr(62, 62, W - 124, H - 124, 28); c.stroke();
    const txt = (t, y0, f, col, ls) => { c.font = f; c.fillStyle = col; try { c.letterSpacing = ls || "0px"; } catch (e) { /* ignorar */ } c.fillText(t, W / 2, y0); try { c.letterSpacing = "0px"; } catch (e) { /* ignorar */ } };
    const ajustar = (t, max, f0, tam) => { let s = tam; c.font = f0.replace("{t}", s); while (c.measureText(t).width > max && s > 20) { s -= 2; c.font = f0.replace("{t}", s); } return f0.replace("{t}", s); };
    txt("ESCUDRIÑA", 170, "600 76px " + D, "#e8cf94", "14px");
    txt("El Códice Viviente", 228, "italic 400 44px " + D, "#c9a865");
    // emblema
    const col = COLORES[(y.emb && y.emb.c) || 0] || COLORES[0], l = (y.emb && y.emb.l) || "α";
    c.beginPath(); c.arc(W / 2, 400, 92, 0, 2 * Math.PI); c.fillStyle = "#121216"; c.fill(); c.lineWidth = 6; c.strokeStyle = col; c.stroke();
    if (y.marco) { c.beginPath(); c.arc(W / 2, 400, 108, 0, 2 * Math.PI); c.lineWidth = 2.5; c.strokeStyle = "#e8cf94"; c.stroke(); }
    c.font = "500 110px " + (/[֐-׿]/.test(l) ? "'Frank Ruhl Libre'," + T : T); c.fillStyle = col; c.fillText(l, W / 2, 438);
    txt(y.apodo || "", 560, ajustar(y.apodo || "", W - 260, "600 {t}px " + D, 62), "#f3ecdc");
    const x = op.x || {};
    let l1, l2, l3;
    if (op.tipo === "lauro") { l1 = "Hallé un lauro trenzado"; l2 = "incorruptible"; l3 = "1 Κοrίndsιοι 9:25"; }
    else if (op.tipo === "piedra") { l1 = "Hallé " + PIEDRAS[x.i][3] + " [" + PIEDRAS[x.i][1] + "],"; l2 = "una de las doce piedras"; l3 = "Ḥăzṓn Hiṯgallū́ṯ 21:19-20"; }
    else if (op.tipo === "rango") { l1 = "Llegué al rango de"; l2 = x.rango || y.rangoNombre || ""; l3 = "nivel " + (x.nivel || y.nivel || 1); }
    else { l1 = "Ya tengo mi lugar entre"; l2 = "las 1440 Primicias"; l3 = y.fundador ? "Primicia n.º " + fmt(y.n) : "Únete antes del lanzamiento"; }
    txt(l1, 680, ajustar(l1, W - 200, "400 {t}px " + D, 66), "#ece5d6");
    txt(l2, 762, ajustar(l2, W - 200, "600 {t}px " + D, 78), "#e8cf94");
    txt(l3, 834, "500 34px " + U, "#c9a865", "3px");
    c.strokeStyle = "rgba(201,168,101,.45)"; c.lineWidth = 1.5; c.beginPath(); c.moveTo(W / 2 - 160, 888); c.lineTo(W / 2 + 160, 888); c.stroke();
    txt("ἐρευνᾶτε τὰς γραφάς", 958, "400 46px " + T, "#e8cf94");
    txt("«Escudriñan a las escrituras» · YÔḥānā́n 5:39", 1012, "italic 400 34px " + T, "#bdb4a3");
    txt("Únete con mi enlace", 1118, "500 34px " + U, "#ece5d6", "2px");
    const u = enlaceInvitacion().replace(/^https:\/\//, "");
    txt(u, 1176, ajustar(u, W - 220, "600 {t}px " + U, 44), "#e8cf94");
    let lz = ""; try { lz = new Date(y.lanzamiento).toLocaleString("es", { weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit", timeZoneName: "short" }); } catch (e) { lz = ""; }
    txt(y.practica && lz ? "Lanzamiento: " + lz : "El juego de Biblia Exacta", 1250, "400 28px " + U, "#a39a88", "1px");
    return new Promise((ok) => cv.toBlob((b) => ok(b), "image/png"));
  }
  async function verTarjetaImagen(op) {
    const b = await imagenTarjeta(op); if (!b) return A.avisar("No se pudo crear la imagen");
    const nombre = "escudrina-" + (op.tipo || "tarjeta") + ".png", u = URL.createObjectURL(b);
    const file = typeof File === "function" ? new File([b], nombre, { type: "image/png" }) : null;
    const puede = !!(file && navigator.canShare && navigator.canShare({ files: [file] }));
    A.abrirModal(() => A.cajaModal(A.cabModal("Imagen para compartir", "Escudriña"), h("div", { class: "jg-cel" },
      h("img", { class: "jg-img", src: u, alt: "Tarjeta de Escudriña para compartir", width: "1080", height: "1350" }),
      h("div", { class: "jg-acciones" },
        puede ? h("button", { class: "btn oro", type: "button", onclick: async () => { try { await navigator.share({ files: [file], title: "Escudriña · El Códice Viviente", text: TEXTO_INV + " " + enlaceInvitacion() }); } catch (e) { /* cancelado */ } } }, ico("compartir"), h("span", { text: "Compartir la imagen" })) : null,
        A.sinDescargas && A.sinDescargas() ? null : h("a", { class: "btn" + (puede ? "" : " oro"), href: u, download: nombre }, ico("descargar"), h("span", { text: "Descargar" })),
        h("button", { class: "btn", type: "button", onclick: () => copiar(TEXTO_INV + " " + enlaceInvitacion(), "Texto y enlace copiados") }, ico("copiar"), h("span", { text: "Copiar el texto" }))),
      h("p", { class: "jg-mini", text: "1080 × 1350 píxeles, el tamaño exacto de las publicaciones verticales: se ve nítida en Instagram, Facebook, WhatsApp y las demás redes." }))));
  }

  // --- construir Escudriña con la comunidad: opiniones, propuestas y votos
  function tarjetaOpinion(conSesion) {
    const intro = h("p", { text: "Escudriña se construye con quienes lo juegan. Propón una mecánica nueva, avísanos de un error o déjanos un comentario: el equipo lo lee todo. Las propuestas que se publican las vota la comunidad, y si una se hace realidad, quien la propuso recibe 2 horas de experiencia doble." });
    const ver = h("a", { class: "btn", href: "#/escudrina/propuestas" }, h("span", { text: "Ver y votar las propuestas" }));
    if (!conSesion) return tarjeta("Construye Escudriña con nosotros", ico("idea"), intro, h("div", { class: "jg-acciones" }, ver), h("p", { class: "jg-mini", text: "Para enviar tu propuesta, primero reserva tu lugar o entra." }));
    const PH = { propuesta: "Describe la mecánica o la idea que te gustaría ver…", error: "¿Qué pasó, dónde y en qué dispositivo?", comentario: "Lo que quieras decirnos…" };
    const tipo = { v: "propuesta" };
    const area = h("textarea", { rows: "4", maxlength: "1500", placeholder: PH.propuesta, "aria-label": "Tu mensaje" });
    const seg = h("div", { class: "jg-seg", role: "group", "aria-label": "Tipo de mensaje" }, [["propuesta", "Propuesta"], ["error", "Error"], ["comentario", "Comentario"]].map(([k, t]) => h("button", { type: "button", "aria-pressed": String(k === tipo.v),
      onclick: (e) => { tipo.v = k; for (const b of seg.children) b.setAttribute("aria-pressed", String(b === e.currentTarget)); area.placeholder = PH[k]; } }, t)));
    const pista = h("p", { class: "jg-pista", role: "status" });
    const enviarO = async (e) => {
      const t = area.value.trim(); const btn = e.currentTarget;
      if (t.length < 8) { pista.textContent = "Escribe un poco más (8 letras o más)."; pista.className = "jg-pista mal"; return; }
      btn.disabled = true; const r = await pedir("/opinion", { metodo: "POST", cuerpo: { tipo: tipo.v, texto: t } }); btn.disabled = false;
      if (r.error) { pista.textContent = r.error === "limite" ? "Ya enviaste varios mensajes hoy: mañana puedes enviar más." : mensaje(r); pista.className = "jg-pista mal"; return; }
      area.value = ""; pista.textContent = "¡Gracias! Lo recibimos. Ya van " + plural(r.total, "mensaje", "mensajes") + " de la comunidad."; pista.className = "jg-pista bien"; sonar("chispa");
    };
    return tarjeta("Construye Escudriña con nosotros", ico("idea"), intro, seg, h("div", { class: "jg-form col" }, area, h("button", { class: "btn oro", type: "button", onclick: enviarO }, h("span", { text: "Enviar" }))), pista, h("div", { class: "jg-acciones" }, ver));
  }
  const ESTADOS = { nuevo: "Recibida", estudio: "En estudio", construccion: "En construcción", hecha: "¡Hecha realidad!", descartada: "No por ahora" };
  const cabSub = (t, sub) => h("div", { class: "panel-cab" }, h("a", { class: "eyebrow", href: "#/escudrina", text: "‹ Escudriña" }), h("h1", { class: "texto", text: t }), sub ? h("p", { class: "est-sub", text: sub }) : null);
  async function pintarPropuestas(cont) {
    document.title = "Propuestas de la comunidad · Escudriña · BiEx";
    const zona = h("div", {}, h("p", { class: "cargando", text: "Cargando…" }));
    marco(cont, cabSub("Propuestas de la comunidad", "Lo que la comunidad propone para Escudriña. Apoya las que quieres ver hechas realidad: las más apoyadas se estudian primero."),
      tarjeta(null, null, zona), S.token ? tarjetaOpinion(true) : tarjeta(null, null, h("a", { class: "btn oro", href: "#/escudrina" }, h("span", { text: "Reservar mi lugar para proponer y votar" }))));
    const r = await pedir("/propuestas", { guardable: true, sin: !S.token });
    if (r.error) return zona.replaceChildren(h("p", { text: mensaje(r) }));
    if (!r.lista.length) return zona.replaceChildren(h("p", { text: "Todavía no hay propuestas publicadas: ¡la tuya puede ser la primera!" }), h("p", { class: "jg-mini", text: plural(r.recibidas, "mensaje recibido", "mensajes recibidos") + " hasta hoy." }));
    zona.replaceChildren(h("ul", { class: "jg-props" }, r.lista.map((p) => {
      const n = h("b", { text: fmt(p.votos) });
      const b = h("button", { class: "jg-voto", type: "button", "aria-pressed": String(!!p.voto), disabled: !S.token || p.estado === "hecha", "aria-label": "Apoyar esta propuesta", onclick: async () => {
        const x = await pedir("/propuestas/votar", { metodo: "POST", cuerpo: { id: p.id } }); if (x.error) return A.avisar(mensaje(x));
        b.setAttribute("aria-pressed", String(x.voto)); n.textContent = fmt(x.votos); if (x.voto) sonar("chispa");
      } }, ico("arriba"), n);
      return h("li", { class: "jg-prop " + p.estado }, b, h("div", {}, h("p", { text: p.texto }), h("span", { class: "jg-mini", text: (ESTADOS[p.estado] || "") + " · propuesta de " + p.apodo + (p.nota ? " · " + p.nota : "") })));
    })), h("p", { class: "jg-mini", text: plural(r.recibidas, "mensaje recibido", "mensajes recibidos") + " de la comunidad." }));
  }
  // Buzón del equipo (solo con la clave ADMIN_CLAVE guardada como secreto del Worker en Cloudflare)
  async function pintarBuzon(cont) {
    document.title = "Buzón del equipo · Escudriña";
    const clave = h("input", { type: "password", placeholder: "Clave del equipo (ADMIN_CLAVE)", autocomplete: "current-password", "aria-label": "Clave del equipo" });
    const zona = h("div");
    const fila = (p, k) => {
      const est = h("select", { "aria-label": "Estado" }, Object.entries(ESTADOS).map(([v, t]) => h("option", { value: v, selected: v === p.estado, text: t })));
      const pub = h("input", { type: "checkbox", checked: !!p.pub }), nota = h("input", { type: "text", value: p.nota || "", placeholder: "Nota pública (opcional)", maxlength: "300" });
      const ok = h("button", { class: "btn chico", type: "button", onclick: async () => {
        const r = await pedir("/buzon/marcar", { metodo: "POST", sin: true, cab: { "x-biex-admin": k }, cuerpo: { id: p.id, estado: est.value, pub: pub.checked, nota: nota.value } });
        A.avisar(r.error ? mensaje(r) : est.value === "hecha" && p.estado !== "hecha" ? "Guardado: quien la propuso recibe 2 h de experiencia doble" : "Guardado"); if (!r.error) p.estado = est.value;
      } }, h("span", { text: "Guardar" }));
      return h("li", { class: "jg-prop " + p.estado }, h("div", {}, h("p", { text: p.texto }),
        h("span", { class: "jg-mini", text: p.tipo + " · " + p.apodo + " · " + new Date(p.t).toLocaleString("es") + " · " + plural(p.votos, "voto", "votos") }),
        h("div", { class: "jg-form" }, est, h("label", { class: "jg-check" }, pub, h("span", { text: "Pública" })), nota, ok)));
    };
    const abrirB = async () => {
      const k = A.store.get("jg:admin", ""); if (!k) return zona.replaceChildren(h("p", { class: "jg-mini", text: "Escribe la clave que guardaste en Cloudflare como secreto ADMIN_CLAVE del Worker biex-juego." }));
      const r = await pedir("/buzon", { sin: true, cab: { "x-biex-admin": k } });
      if (r.error) return zona.replaceChildren(h("p", { text: "La clave no coincide o el buzón no está activo." }));
      zona.replaceChildren(r.lista.length ? h("ul", { class: "jg-props" }, r.lista.map((p) => fila(p, k))) : h("p", { text: "El buzón está vacío por ahora." }));
    };
    marco(cont, cabSub("Buzón del equipo", "Opiniones, errores y propuestas de la comunidad. Las propuestas marcadas «Pública» aparecen para votar."),
      tarjeta(null, null, h("div", { class: "jg-form" }, clave, h("button", { class: "btn", type: "button", onclick: () => { A.store.set("jg:admin", clave.value.trim()); abrirB(); } }, h("span", { text: "Abrir" })))), tarjeta(null, null, zona));
    abrirB();
  }

  // --- prestigio local: cada ciudad suma la experiencia de sus 12 mejores lectores
  async function pintarPrestigio(cont) {
    document.title = "Prestigio local · Escudriña · BiEx";
    const y = S.yo || {}, lugar = y.lugar || {};
    const st = A.store.get("jg:pres", null) || {}; const q = { periodo: st.periodo || "semana", ambito: st.ambito || (lugar.pais ? "pais" : "mundo") };
    const zona = h("div", {}, h("p", { class: "cargando", text: "Cargando…" }));
    const seg = (opciones, k) => h("div", { class: "jg-seg", role: "group" }, opciones.map(([v, t]) => h("button", { type: "button", "aria-pressed": String(q[k] === v), onclick: (e) => {
      q[k] = v; A.store.set("jg:pres", q); for (const b of e.currentTarget.parentNode.children) b.setAttribute("aria-pressed", String(b === e.currentTarget)); cargarP();
    } }, t)));
    async function cargarP() {
      zona.replaceChildren(h("p", { class: "cargando", text: "Cargando…" }));
      const pais = q.ambito === "pais" ? lugar.pais || "" : "";
      const r = await pedir("/prestigio?" + new URLSearchParams({ periodo: q.periodo, pais }), { guardable: true });
      if (r.error) return zona.replaceChildren(h("p", { text: mensaje(r) }));
      const tit = h("p", { class: "jg-mini", text: (q.periodo === "semana" ? "Esta semana (de domingo a sábado, hora de Bogotá)" : "Desde el comienzo") + " · " + (pais ? nombrePais(pais) : "el mundo") });
      if (!r.lista.length) return zona.replaceChildren(tit, h("p", { text: "Todavía ninguna ciudad suma prestigio aquí. ¡La tuya puede ser la primera!" }));
      zona.replaceChildren(tit, h("ol", { class: "jg-lista" }, r.lista.map((x) => h("li", { class: "jg-fila" + (x.ciudad === lugar.ciudad && x.pais === lugar.pais ? " yo" : "") },
        h("span", { class: "p", text: String(x.p) }), h("span", { class: "jg-ciu", "aria-hidden": "true" }, A.svg('<path d="M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0 1 13 0c0 4.8-6.5 11-6.5 11z" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="12" cy="10" r="2.4" fill="currentColor"/>')), h("span", { class: "n" }, x.ciudad, h("small", { text: [x.region, q.ambito === "pais" ? "" : nombrePais(x.pais), plural(x.n, "lector", "lectores")].filter(Boolean).join(" · ") })),
        h("span", { class: "x", text: fmt(x.pr) })))));
    }
    marco(cont, cabSub("Prestigio local", "Cada ciudad suma la experiencia de sus 12 mejores lectores: así una ciudad pequeña puede brillar tanto como una grande. Lee e invita a los tuyos para llevar a tu ciudad a lo más alto."),
      tarjeta(null, null, seg([["pais", lugar.pais ? nombrePais(lugar.pais) : "Mi país"], ["mundo", "El mundo"]], "ambito"), seg([["semana", "Esta semana"], ["total", "Desde el comienzo"]], "periodo"),
        lugar.ciudad ? h("p", { class: "jg-mini", text: "Tu ciudad: " + lugar.ciudad + (y.verCiudad === false ? " (la ocultaste en tu perfil: tu lectura no suma a su prestigio)" : "") }) : null),
      tarjeta(null, null, zona));
    cargarP();
  }

  // --- clasificación
  const AMBITOS = (pais) => [["ciudad", "Ciudad"], ["region", nombreRegion(pais)], ["pais", "País"], ["continente", "Continente"], ["mundo", "Mundo"]];
  async function pintarClasificacion(cont) {
    document.title = "Clasificación · Escudriña · BiEx";
    const y = S.yo || {};
    const st = A.store.get("jg:clas", null) || {};
    const q = { ambito: st.ambito || "pais", periodo: st.periodo || "semana", rango: Number.isInteger(st.rango) ? st.rango : y.rango || 0 };
    const zona = h("div", {}, h("p", { class: "cargando", text: "Cargando…" }));
    const seg = (opciones, clave) => h("div", { class: "jg-seg", role: "group" }, opciones.map(([k, t]) => h("button", { type: "button", "aria-pressed": String(q[clave] === k), onclick: (e) => {
      q[clave] = k; A.store.set("jg:clas", q);
      for (const b of e.currentTarget.parentNode.children) b.setAttribute("aria-pressed", String(b === e.currentTarget));
      cargar();
    } }, t)));
    const lugarDe = (amb) => { const l = y.lugar || {}; return amb === "pais" ? nombrePais(l.pais) : amb === "continente" ? CONT[l.cont] || l.cont : amb === "region" ? l.region : amb === "ciudad" ? l.ciudad : "el mundo"; };
    async function cargar() {
      zona.replaceChildren(h("p", { class: "cargando", text: "Cargando…" }));
      const r = await pedir("/clasificacion?" + new URLSearchParams({ ambito: q.ambito, periodo: q.periodo, rango: String(q.rango) }));
      if (r.error) return zona.replaceChildren(h("p", { text: mensaje(r) }));
      const titulo = h("p", { class: "jg-mini", text: (q.periodo === "semana" ? "Esta semana (de domingo a sábado, hora de Bogotá)" : "Desde el comienzo") + " · " + RANGOS[r.rango] + " · " + (r.lugar ? lugarDe(q.ambito) : q.ambito === "mundo" ? "el mundo" : "sin datos de tu lugar") });
      if (!r.lista.length) return zona.replaceChildren(titulo, h("p", { text: "Todavía nadie de este rango suma experiencia aquí. ¡Puedes ser la primera persona!" }));
      const fila = (x) => { const [l, c] = embDe(x.emb); return h("li", { class: "jg-fila" + (x.yo ? " yo" : "") }, h("span", { class: "p", text: String(x.p) }), emblema(l, c, x.marco, x.foto),
        h("span", { class: "n" }, x.apodo, h("small", { text: "nivel " + x.nivel + (x.n ? " · Primicia n.º " + x.n : "") + (q.ambito !== "ciudad" && x.ciudad ? " · " + x.ciudad : "") })), h("span", { class: "x", text: fmt(x.xp) })); };
      zona.replaceChildren(...[titulo, h("ol", { class: "jg-lista" }, r.lista.map(fila)),
        r.yo && !r.lista.some((x) => x.yo) ? h("p", { class: "jg-mini", text: "Tu puesto: " + fmt(r.yo.p) + " · " + fmt(r.yo.xp) + " de experiencia." }) : null].filter(Boolean));
    }
    marco(cont, h("div", { class: "panel-cab" }, h("a", { class: "eyebrow", href: "#/escudrina", text: "‹ Escudriña" }), h("h1", { class: "texto", text: "Clasificación" }),
      h("p", { class: "est-sub", text: "Cada rango tiene su propia clasificación: los nuevos compiten con nuevos y los veteranos con veteranos." })),
      tarjeta(null, null, seg(AMBITOS((y.lugar || {}).pais), "ambito"), seg([["semana", "Esta semana"], ["total", "Desde el comienzo"]], "periodo"), seg(RANGOS.map((t, i) => [i, t]), "rango")),
      tarjeta(null, null, zona), vivoLinea());
    cargar();
  }

  // --- cuenta
  function pintarCuenta(cont) {
    document.title = "Cuenta · Escudriña · BiEx";
    const y = S.yo || {};
    const [l0, c0] = [y.emb ? y.emb.l : "α", y.emb ? y.emb.c : 0];
    const vista = h("div", { class: "jg-emb", style: "width:72px;height:72px" }, emblema(l0, c0, marcoVisible(y)));
    const emb = { l: l0, c: c0 };
    const guardarEmb = async () => { const r = await pedir("/cuenta/preferencias", { metodo: "POST", cuerpo: { emb } }); if (!r.error) { actualizarYo(r.yo); A.avisar("Emblema guardado"); } else A.avisar(mensaje(r)); };
    const letras = h("div", { class: "jg-letras", role: "group", "aria-label": "Letra del emblema" }, [...LETRAS].map((x) => h("button", { type: "button", "aria-pressed": String(x === emb.l), lang: /[֐-׿]/.test(x) ? "he" : "grc", text: x, onclick: (e) => {
      emb.l = x; for (const b of letras.children) b.setAttribute("aria-pressed", String(b === e.currentTarget)); vista.replaceChildren(emblema(emb.l, emb.c, marcoVisible(y))); guardarEmb();
    } })));
    const colores = h("div", { class: "jg-colores", role: "group", "aria-label": "Color del emblema" }, COLORES.map((col, i) => h("button", { type: "button", "aria-pressed": String(i === emb.c), "aria-label": "Color " + (i + 1), style: "background:" + col, onclick: (e) => {
      emb.c = i; for (const b of colores.children) b.setAttribute("aria-pressed", String(b === e.currentTarget)); vista.replaceChildren(emblema(emb.l, emb.c, marcoVisible(y))); guardarEmb();
    } })));
    const pref = (k, t, d) => { const c = h("input", { type: "checkbox", checked: !!y[k], onchange: async () => { const r = await pedir("/cuenta/preferencias", { metodo: "POST", cuerpo: { [k]: c.checked } }); if (!r.error) actualizarYo(r.yo); else { c.checked = !c.checked; A.avisar(mensaje(r)); } } });
      return h("label", { class: "jg-check" }, c, h("span", {}, t, h("br"), h("span", { class: "jg-mini", text: d }))); };
    const zonaCodigo = h("div", {});
    const codigoNuevo = async () => {
      if (!confirm("Se creará un código nuevo y el anterior dejará de servir. ¿Seguir?")) return;
      const r = await pedir("/cuenta/codigo", { metodo: "POST" });
      if (r.error) return A.avisar(mensaje(r));
      zonaCodigo.replaceChildren(h("div", { class: "jg-codigo", text: r.codigo }), h("div", { class: "jg-acciones" },
        h("button", { class: "btn", type: "button", onclick: () => copiar(r.codigo, "Código copiado") }, ico("copiar"), h("span", { text: "Copiar" })),
        h("button", { class: "btn", type: "button", onclick: () => descargarTexto("escudrina-codigo.txt", "Escudriña · Biblia Exacta\nApodo: " + y.apodo + "\nCódigo de acceso: " + r.codigo + "\n") }, ico("descargar"), h("span", { text: "Descargar" }))),
        h("p", { class: "jg-mini", text: "Guárdalo: el código anterior ya no sirve." }));
    };
    const v = y.vinculado || {};
    const estado = [v.llave ? plural(v.llave, "llave de acceso", "llaves de acceso") : null, v.google ? "Google" : null, v.facebook ? "Facebook" : null].filter(Boolean);
    const borrarIn = h("input", { type: "text", placeholder: "Escribe BORRAR", "aria-label": "Escribe BORRAR para confirmar", autocomplete: "off" });
    marco(cont, h("div", { class: "panel-cab" }, h("a", { class: "eyebrow", href: "#/escudrina", text: "‹ Escudriña" }), h("h1", { class: "texto", text: "Cuenta" })),
      tarjetaApodo(false),
      tarjeta("Emblema", null, h("div", { class: "jg-perfil" }, vista, h("p", { class: "jg-mini", text: "Elige una letra hebrea o griega y un color. Así te verán en las clasificaciones." })), letras, colores),
      tarjeta("Formas de entrar", ico("llave"), h("p", { text: estado.length ? "Tu avance está asegurado con: " + estado.join(", ") + "." : "Tu avance todavía depende solo de tu código." })),
      tarjetaAsegurar(true),
      tarjeta("Código de acceso", ico("codigo"), h("p", { text: "Si tu código anterior se pudo ver o lo perdiste, crea uno nuevo." }), h("button", { class: "btn", type: "button", onclick: codigoNuevo }, h("span", { text: "Crear un código nuevo" })), zonaCodigo),
      tarjeta("Preferencias", null, pref("verApodo", "Mostrar mi apodo", "En las clasificaciones, tu compañía y «quién está leyendo». Si lo ocultas, en su lugar se verá tu ciudad."),
        pref("verCiudad", "Mostrar mi ciudad en las clasificaciones", "Si la ocultas, sigues apareciendo en tu región, tu país, tu continente y el mundo."),
        pref("tranquilo", "Modo tranquilo", "Sin sonidos. Para menos movimiento, usa también «Sin animaciones» en la apariencia del lector.")),
      tarjeta("Sesiones", null, h("div", { class: "jg-acciones" },
        h("button", { class: "btn", type: "button", onclick: () => { if (confirm("¿Salir de Escudriña en este dispositivo? Para volver necesitarás tu código, tu llave o tu cuenta.")) { olvidarSesion(false); A.irA("#/escudrina"); } } }, h("span", { text: "Salir en este dispositivo" })),
        h("button", { class: "btn", type: "button", onclick: async () => { if (!confirm("Se cerrarán todas tus sesiones, también en otros dispositivos. ¿Seguir?")) return; const r = await pedir("/cuenta/salir-todos", { metodo: "POST" }); if (r.error) return A.avisar(mensaje(r)); guardarSesion(r.token); A.avisar("Cerraste las demás sesiones"); } }, h("span", { text: "Cerrar todas las sesiones" })))),
      tarjeta("Tu bienvenida", null, h("p", { text: "La animación con la que llegaste a Escudriña." }), h("div", { class: "jg-acciones" }, h("button", { class: "btn", type: "button", onclick: () => cinematica(S.yo) }, h("span", { text: "Ver de nuevo mi bienvenida" })))),
      tarjeta("Borrar mi cuenta", null, h("p", { text: "Se borran tu avance, tus hallazgos y tu lugar en las clasificaciones. No se puede deshacer." }),
        h("div", { class: "jg-form" }, borrarIn, h("button", { class: "btn", type: "button", onclick: async () => {
          if (borrarIn.value.trim() !== "BORRAR") { A.avisar("Escribe BORRAR para confirmar"); return; }
          const r = await pedir("/cuenta/borrar", { metodo: "POST", cuerpo: { confirmar: "BORRAR" } });
          if (r.error) return A.avisar(mensaje(r));
          olvidarSesion(false); A.avisar("Tu cuenta quedó borrada"); A.irA("#/escudrina");
        } }, h("span", { text: "Borrar" })))));
  }

  // ------------------------------------------------------------------ Google, Facebook y llaves de acceso
  let espera = null;
  async function conectar(prov, modo, pista) {
    if (prov === "google" && EN_APP) return avisoGoogleEnApp();
    // la ventana se abre ya, dentro del toque (si no, el navegador la bloquea); luego se le da su dirección
    const w = window.open("", "biex-entrar", "popup,width=480,height=680");
    const r = await pedir("/auth/" + prov + "/preparar", { metodo: "POST", cuerpo: { modo, inv: modo === "vincular" ? null : invitacionPendiente() }, sin: modo !== "vincular" });
    if (r.error) { if (w) w.close(); if (pista) { pista.textContent = mensaje(r); pista.className = "jg-pista mal"; } return; }
    const url = API_ABS + "/auth/" + prov + "/inicio?e=" + encodeURIComponent(r.estado);
    if (w) { try { w.location.href = url; } catch (e) { window.open(url, "_blank"); } } else window.open(url, "_blank");
    const yo = espera = {};
    if (pista) { pista.className = "jg-pista"; pista.replaceChildren("Esperando la confirmación en la otra ventana… ", h("button", { class: "jg-cambiar", type: "button", style: "display:inline;margin:0", onclick: () => { espera = null; pista.textContent = ""; } }, "Cancelar")); }
    const fin = Date.now() + 10 * MIN;
    while (espera === yo && Date.now() < fin) {
      await esperar(1600);
      if (espera !== yo) return;
      const x = await pedir("/auth/resultado?e=" + encodeURIComponent(r.estado), { sin: true });
      if (x.pendiente || x.error === "red") continue;
      espera = null;
      if (x.error) { if (pista) { pista.textContent = mensaje(x); pista.className = "jg-pista mal"; } return; }
      guardarSesion(x.token, x.yo);
      if (!x.nuevo) A.avisar(x.vinculada ? "Cuenta vinculada: tu avance quedó asegurado" : "¡Qué bueno verte de nuevo!");
      repintar(); if (x.nuevo) cinematica(x.yo); return;
    }
    if (espera === yo) { espera = null; if (pista) pista.textContent = "Se acabó la espera. Vuelve a intentarlo."; }
  }
  const puedeLlave = () => {
    const rp = S.cfg && S.cfg.llave;
    return !!(rp && window.PublicKeyCredential && navigator.credentials && window.isSecureContext && (location.hostname === rp || location.hostname.endsWith("." + rp)));
  };
  async function registrarLlave(btn, pista) {
    btn.disabled = true;
    try {
      const o = await pedir("/llave/opciones", { metodo: "POST", cuerpo: { modo: "registrar" } });
      if (o.error) throw o;
      const pk = o.publicKey;
      pk.challenge = deB64u(pk.challenge); pk.user.id = deB64u(pk.user.id);
      pk.excludeCredentials = (pk.excludeCredentials || []).map((c) => ({ type: "public-key", id: deB64u(c.id) }));
      let cred;
      try { cred = await navigator.credentials.create({ publicKey: pk }); }
      catch (e) { throw { error: e && e.name === "InvalidStateError" ? "llave_usada" : "cancelado" }; }
      const r = await pedir("/llave/registrar", { metodo: "POST", cuerpo: { e: o.e, cd: b64u(cred.response.clientDataJSON), ao: b64u(cred.response.attestationObject) } });
      if (r.error) throw r;
      actualizarYo(r.yo); sonar("nivel"); A.avisar("Llave de acceso creada: tu avance quedó asegurado");
      if (!S.codigoNuevo) repintar(); else if (pista) { pista.textContent = "Llave de acceso creada."; pista.className = "jg-pista bien"; }
    } catch (r) {
      if (pista && r.error !== "cancelado") { pista.textContent = mensaje(r); pista.className = "jg-pista mal"; }
    } finally { btn.disabled = false; }
  }
  async function entrarConLlave(btn, pista) {
    btn.disabled = true;
    try {
      const o = await pedir("/llave/opciones", { metodo: "POST", cuerpo: { modo: "entrar" }, sin: true });
      if (o.error) throw o;
      let cred;
      try { cred = await navigator.credentials.get({ publicKey: { challenge: deB64u(o.publicKey.challenge), rpId: o.publicKey.rpId, timeout: o.publicKey.timeout, userVerification: "preferred" } }); }
      catch (e) { throw { error: "cancelado" }; }
      const r = await pedir("/llave/entrar", { metodo: "POST", sin: true, cuerpo: { e: o.e, id: cred.id, cd: b64u(cred.response.clientDataJSON), ad: b64u(cred.response.authenticatorData), sig: b64u(cred.response.signature) } });
      if (r.error) throw r;
      guardarSesion(r.token, r.yo); A.avisar("¡Qué bueno verte de nuevo, " + r.yo.apodo + "!"); repintar();
    } catch (r) {
      if (pista && r.error !== "cancelado") { pista.textContent = mensaje(r); pista.className = "jg-pista mal"; }
    } finally { btn.disabled = false; }
  }

  // ------------------------------------------------------------------ invitaciones
  // Enlace propio de cada estudiante: página de la campaña con vista previa propia («Ana te invita…») que cuenta las aperturas
  const enlaceInvitacion = () => PUBLICO + "/e/" + ((S.yo && S.yo.inv) || A.store.get("jg:mio", ""));
  const TEXTO_INV = "Estoy leyendo la Nueva Voluntad traducida palabra por palabra del griego, y lo hago jugando a Escudriña · El Códice Viviente, el juego de Biblia Exacta. Solo hay 1440 Primicias: reserva la tuya con mi enlace y tus primeras 3 horas de lectura cuentan doble.";
  function compartirInvitacion() { compartir("Escudriña · El Códice Viviente", TEXTO_INV, enlaceInvitacion()); }
  // Una apertura por dispositivo y por enlace (lo que cuenta la campaña de quien invita)
  function abrirInvitacion(c) { const k = "jg:ab:" + c; if (A.store.get(k, false)) return false; A.store.set(k, true); return true; }
  // Franja discreta para quien abre un verso compartido con invitación (una sola vez por invitación)
  async function franja(c) {
    estilos();
    c = String(c || "").toLowerCase();
    if (A.store.get("jg:t", null) || A.store.get("jg:franja:" + c, false) || document.querySelector(".jg-franja")) return;
    const r = await pedir("/invitacion?c=" + encodeURIComponent(c) + (abrirInvitacion(c) ? "&a=1" : ""), { sin: true });
    if (r.error || !r.apodo) return;
    const cerrar = () => { A.store.set("jg:franja:" + c, true); el.remove(); };
    const el = h("div", { class: "jg-franja", role: "region", "aria-label": "Invitación a Escudriña" }, lauro(),
      h("span", {}, h("b", { text: r.apodo }), " te invitó a Escudriña, el juego de Biblia Exacta: tus primeras 3 horas de lectura cuentan doble."),
      h("span", { style: "display:flex;align-items:center;gap:4px" }, h("a", { class: "btn oro chico", href: "#/escudrina", onclick: cerrar }, h("span", { text: "Conocer" })),
        h("button", { class: "x", type: "button", "aria-label": "Cerrar", onclick: cerrar }, A.svg(A.ICO.cerrar))));
    document.body.append(el);
  }

  // ------------------------------------------------------------------ lectura validada
  // Un «cursor de lectura»: el tiempo se acredita al primer verso visible (en orden) que aún no se validó; al llegar a su
  // tiempo mínimo pasa al siguiente. Solo cuenta con la pestaña visible, sin ventanas encima y con actividad reciente.
  // Ahorro (plan gratuito): lo leído se junta —de varios capítulos— y sale en una sola petición cada 5 minutos, o en el
  // acto cuando va a ocurrir un suceso (hallazgo, dracmas, nivel, misión, capítulo completo o primer verso del día), para
  // que ningún beneficio se demore ni se pierda. Lo pendiente queda guardado en el dispositivo hasta que el servidor lo recibe.
  const CADA = Number(window.BIEX_JUEGO_CADA) || 5 * MIN; // BIEX_JUEGO_CADA: solo en pruebas locales
  const R = { lib: null, cap: 0, pal: [], hoy: "", acc: new Map(), accA: new Map(), pend: new Map(), hechos: new Set(), cola: [], vis: new Map(), els: [], io: null, reloj: 0, ultTick: 0, ultAct: 0, ultEnvio: 0, enviando: false, pred: null, prueba: false, recuperada: false, completos: new Set(), tl: {} };
  let PAL = null;
  function palabras() {
    if (!PAL) PAL = (A.cargar ? A.cargar("datos/juego/palabras.json") : Promise.reject(new Error("sin cargador")))
      .catch(() => fetch(PUBLICO + "/datos/juego/palabras.json", { credentials: "omit" }).then((r) => { if (!r.ok) throw new Error("palabras"); return r.json(); }))
      .catch((e) => { PAL = null; throw e; });
    return PAL;
  }
  const pon = (s, i, d) => s.padEnd(i + 1, "0").slice(0, i) + d + s.slice(i + 1);
  // Espejo de lo leído hoy (por capítulo) y de los capítulos con prueba pendiente; se reinicia al cambiar el día del servidor
  function espejo() {
    const f = (S.yo && S.yo.hoy && S.yo.hoy.f) || "";
    let e = A.store.get("jg:hoy", null);
    if (!e || typeof e !== "object" || (f && e.f !== f)) e = { f, m: {}, p: (S.yo && S.yo.hoy && S.yo.hoy.pend) || [] };
    return e;
  }
  const sieDe = (lc) => (A.store.get("jg:sie", null) || {})[lc] || "";
  function guardarSie(lc, s) { const o = A.store.get("jg:sie", null) || {}; o[lc] = s; A.store.set("jg:sie", o); }
  let tGuardar = 0;
  function guardarCola(ya) {
    clearTimeout(tGuardar);
    const g = () => A.store.set("jg:cola", R.cola.length ? { t: Date.now(), c: R.cola } : null);
    if (ya) g(); else tGuardar = setTimeout(g, 2500);
  }
  // Lo que quedó sin enviar en la visita anterior (pestaña cerrada, sin conexión…)
  function recuperarCola() {
    if (R.recuperada) return; R.recuperada = true;
    const p = A.store.get("jg:cola", null);
    if (!p || !Array.isArray(p.c) || !p.c.length) return;
    if (Date.now() - (p.t || 0) > 48 * 3600e3) { A.store.set("jg:cola", null); return; }
    const ya = new Set(R.cola.map((x) => x.join("|")));
    R.cola.unshift(...p.c.filter((x) => Array.isArray(x) && (x.length === 4 || x.length === 5) && !ya.has(x.join("|"))));
    setTimeout(() => enviar(false), 2500);
  }
  // BiEx (10-nov-2026): dejar un pasaje abierto no es leerlo. La lectura cuenta mientras hay señales de presencia:
  //  · la pestaña visible y la ventana con el foco (al cambiar de ventana o de aplicación se detiene hasta el próximo gesto);
  //  · un gesto reciente (desplazar, tocar, tecla, mover el puntero) dentro de una ventana de tiempo que depende de cuánto
  //    texto había en pantalla en ese gesto: lo que tarda en leerse esa pantalla, entre 45 s y 2 min 30 s. Así quien lee una
  //    pantalla entera sin tocar nada recibe su lectura, y una página olvidada deja de sumar enseguida.
  const actividad = () => {
    const t = performance.now();
    if (t - (R.ultPres || 0) > 1000) {
      R.ultPres = t; let ms = 0;
      for (const e of R.els) { const v = +e.id.slice(1); if (R.vis.get(e) && !R.hechos.has(v) && !R.pend.has(v) && valeLeer(v)) ms += Math.max(0, tMin(v) - (R.acc.get(v) || 0)); }
      R.ventana = Math.min(150000, Math.max(45000, ms * 1.25));
    }
    R.ultAct = t;
  };
  let escuchando = false;
  function escuchar() {
    if (escuchando) return; escuchando = true;
    for (const ev of ["scroll", "wheel", "touchstart", "keydown", "pointerdown"]) window.addEventListener(ev, actividad, { passive: true, capture: true });
    let pm = 0; window.addEventListener("pointermove", () => { const t = performance.now(); if (t - pm > 2000) { pm = t; actividad(); } }, { passive: true });
    // la ventana perdió el foco (otra ventana, otra aplicación, la barra del sistema): la lectura espera al próximo gesto
    window.addEventListener("blur", () => { R.ultAct = 0; });
    // al salir de la app o de la pestaña, lo pendiente sale de una vez (cuenta en el día en que se leyó)
    document.addEventListener("visibilitychange", () => { if (document.hidden) { guardarCola(true); if (Date.now() - R.ultEnvio > 30000) enviar(true); } else { R.ultTick = performance.now(); actividad(); } });
    window.addEventListener("pagehide", () => { guardarCola(true); enviar(true); });
  }
  function capitulo(lib, cap, modo) {
    if (!S.token) S.token = A.store.get("jg:t", null);
    if (!S.token || modo !== "l") { salir(); return; }
    estilos(); escuchar(); recuperarCola(); medidor(true);
    if (R.lib !== lib || R.cap !== cap) {
      soltar();
      Object.assign(R, { lib, cap, pal: [], hoy: "", acc: new Map(), accA: new Map(), pend: new Map(), hechos: new Set(), prueba: false });
      prepararCapitulo(lib, cap);
    } else if (R.prueba) setTimeout(tarjetaPrueba, 50);
    observar();
    retomarSala(); if (SL.cod) setTimeout(() => { pintarMarcas(); posSala(true); }, 400);
    actividad(); R.ultTick = performance.now();
    if (!R.reloj) R.reloj = setInterval(tick, 250);
  }
  async function prepararCapitulo(lib, cap) {
    if (!S.cfg) await config();
    let P = null; try { P = await palabras(); } catch (e) { P = null; }
    if (R.lib !== lib || R.cap !== cap || !P || !P[lib]) return;
    R.pal = String(P[lib].split(";")[cap - 1] || "").split(",").map(Number);
    const lc = lib + "." + cap, e = espejo();
    R.hoy = e.m[lc] || "";
    R.pend = cargarPend(lc);
    R.prueba = e.p.includes(lc);
    if (R.prueba) tarjetaPrueba();
    pintarPresencia(); sellos();
  }
  // Deja el capítulo (lo leído sigue en la cola: las tandas juntan varios capítulos)
  function soltar() {
    if (R.io) { R.io.disconnect(); R.io = null; }
    Object.assign(R, { els: [], vis: new Map() });
    const p = document.querySelector(".jg-pres"); if (p) p.remove();
    for (const s of document.querySelectorAll(".jg-sello")) s.remove();
  }
  function salir() {
    guardarCola(true);
    soltar(); medidor(false);
    if (R.reloj) { clearInterval(R.reloj); R.reloj = 0; }
    Object.assign(R, { lib: null, cap: 0, pal: [], acc: new Map(), accA: new Map(), pend: new Map(), hechos: new Set(), prueba: false });
    // fuera de los capítulos, lo pendiente sale a su hora (o al volver a leer)
    if (R.cola.length && S.token) setTimeout(() => { if (!R.lib && R.cola.length && Date.now() - R.ultEnvio > CADA) enviar(false); }, 1000);
  }
  function observar() {
    if (R.io) R.io.disconnect();
    R.vis = new Map();
    R.els = [...document.querySelectorAll(".hoja [id^='v']")].filter((el) => /^v\d+$/.test(el.id) && /^(vl|vs)$/.test(el.classList[0]));
    if (!("IntersectionObserver" in window)) return;
    R.io = new IntersectionObserver((ents) => {
      for (const e of ents) {
        R.vis.set(e.target, e.isIntersecting);
        // repasar en la misma visita (BiEx, 10-nov-2026): al salir de la pantalla, el verso ya leído se puede volver a leer
        if (!e.isIntersecting) { const v = +e.target.id.slice(1); if (R.hechos.has(v)) { R.hechos.delete(v); R.acc.delete(v); R.accA.delete(v); } }
      }
    }, { rootMargin: "-10% 0px -15% 0px", threshold: 0 });
    for (const el of R.els) R.io.observe(el);
    sellos();
  }
  const tMin = (v) => Math.max((S.cfg && S.cfg.msMin) || 2500, ((S.cfg && S.cfg.msPalabra) || 450) * (R.pal[v - 1] || 0));
  // Lectura atenta mixta (BiEx, 10-nov-2026): el verso se marca solo si se queda en pantalla 3 s por palabra griega; antes,
  // quien lee a su ritmo lo confirma con el sello «Leí hasta aquí ✓» al final de la perícopa (vale lo que ya cumplió tMin).
  const tAuto = (v) => Math.max((S.cfg && S.cfg.msAutoMin) || 6000, ((S.cfg && S.cfg.msAuto) || 3000) * (R.pal[v - 1] || 0));
  const valeLeer = (v) => (R.pal[v - 1] || 0) > 0 && +(R.hoy[v - 1] || 0) < 9; // todo verso leído suma algo (BiEx, 9-nov-2026)
  function tick() {
    const ahora = performance.now(), dt = Math.min(1000, Math.max(0, ahora - (R.ultTick || ahora)));
    R.ultTick = ahora;
    if (SL.cod) posSala(false);
    if (R.cola.length && !R.enviando && Date.now() - R.ultEnvio > CADA) enviar(false);
    if (!R.pal.length || document.hidden || !R.ultAct || ahora - R.ultAct > (R.ventana || 45000) || document.documentElement.classList.contains("con-modal")) return;
    if (R.els.length && !R.els[0].isConnected) observar();
    let el = null, elA = null;
    for (const e of R.els) {
      const v = +e.id.slice(1);
      if (!R.vis.get(e) || R.hechos.has(v) || !valeLeer(v)) continue;
      if (!elA) elA = e;
      if (!el && !R.pend.has(v)) el = e;
      if (el && elA) break;
    }
    // tiempo de lectura activo (página a la vista, con presencia y versos por leer): minutos reales y ritmo de la fórmula
    if (el || elA) { const lc = R.lib + "." + R.cap; R.tl[lc] = (R.tl[lc] || 0) + dt; }
    if (el) {
      const v = +el.id.slice(1), t = (R.acc.get(v) || 0) + dt;
      R.acc.set(v, t);
      // reparto 60/40 (BiEx, 10-nov-2026): al tiempo mínimo el verso ya suma el 60 %; el 40 % llega al confirmarlo
      if (t >= tMin(v)) { R.pend.set(v, [Math.round(t), 1]); guardarPend(); acreditar(R.lib, R.cap, v, Math.round(t), 0); estadoSellos(v); }
    }
    if (elA) {
      const v = +elA.id.slice(1), t = (R.accA.get(v) || 0) + dt;
      R.accA.set(v, t);
      if (t >= tAuto(v)) { const p = R.pend.get(v), ms = Math.round(Math.max(t, p ? p[0] : 0)); R.pend.delete(v); guardarPend(); R.hechos.add(v); acreditar(R.lib, R.cap, v, ms, 1, !!(p && p[1])); estadoSellos(v); }
    }
  }
  // --- sellos «Leí hasta aquí ✓» (al final de cada perícopa: marca § de BiEx o párrafo ¶; sin marcas, cada 8 versos)
  const PEND_DIAS = 7;
  function cargarPend(lc) {
    const o = A.store.get("jg:pend", null) || {}, x = o[lc];
    if (!x || !Array.isArray(x.v) || Date.now() - (x.t || 0) > PEND_DIAS * 864e5) return new Map();
    return new Map(x.v.filter((p) => Array.isArray(p) && Number.isInteger(p[0]) && (p[2] || +(R.hoy[p[0] - 1] || 0) < 9)).map((p) => [p[0], [+p[1] || 0, p[2] ? 1 : 0]]));
  }
  function guardarPend() {
    if (!R.lib) return;
    const o = A.store.get("jg:pend", null) || {}, lc = R.lib + "." + R.cap, ahora = Date.now();
    for (const k of Object.keys(o)) if (!o[k] || ahora - (o[k].t || 0) > PEND_DIAS * 864e5) delete o[k];
    if (R.pend.size) o[lc] = { t: ahora, v: [...R.pend].map(([v, p]) => [v, p[0], p[1]]) }; else delete o[lc];
    A.store.set("jg:pend", Object.keys(o).length ? o : null);
  }
  // versos leídos que esperan su sello, en todos los capítulos (para el aviso de Hoy)
  function pendientes() {
    const o = A.store.get("jg:pend", null) || {}, out = [];
    for (const [lc, x] of Object.entries(o)) if (x && Array.isArray(x.v) && x.v.length && Date.now() - (x.t || 0) <= PEND_DIAS * 864e5) out.push([lc, x.v]);
    return out;
  }
  function confirmarHasta(hasta, boton) {
    let n = 0;
    for (const [v, p] of [...R.pend].sort((a, b) => a[0] - b[0])) if (v <= hasta) { R.pend.delete(v); R.hechos.add(v); acreditar(R.lib, R.cap, v, p[0], 2, !!p[1]); n++; }
    guardarPend(); estadoSellos();
    if (!n) { A.avisar("Todavía no hay versos leídos por confirmar aquí: léelos con calma y vuelve a tocar."); return; }
    vibrar([10, 40, 14]); sonar("chispa"); chispas(10 + Math.min(10, n), boton);
    if (boton && boton.animate && !sinAnim()) boton.animate([{ transform: "scale(1)" }, { transform: "scale(1.08)" }, { transform: "scale(1)" }], { duration: 420, easing: "cubic-bezier(.3,1.6,.5,1)" });
    if (!A.store.get("jg:selloOk", 0)) { A.store.set("jg:selloOk", 1); A.avisar("Confirmado: " + plural(n, "verso", "versos") + ". Si lees con calma, también se marcan solos."); }
  }
  // Confirma desde el panel lo que quedó por confirmar en otros capítulos (lo que ya cumplió su tiempo mínimo)
  function confirmarTodo() {
    let n = 0;
    for (const [lc, vs] of pendientes()) {
      const [lib, cap] = lc.split(".");
      for (const p of vs) if (!p[2]) { R.cola.push([lib, +cap, p[0], p[1], 2]); n++; }
    }
    A.store.set("jg:pend", null);
    if (R.lib) { R.pend = new Map(); estadoSellos(); }
    if (n) { guardarCola(true); enviar(false); }
    return n;
  }
  // Confirmar en el servidor (lista del panel): si = [[lc, [v…]]], no = [[lc, [v…]]] o todo
  async function confirmarServidor(cuerpo) {
    if (R.cola.length && !R.enviando) await enviar(false);
    const r = await pedir("/lectura/confirmar", { metodo: "POST", cuerpo });
    if (r.error) { A.avisar(mensaje(r)); return null; }
    const loc = A.store.get("jg:pend", null);
    if (loc) {
      const quitar = new Map();
      for (const [lc, vs] of [...(cuerpo.si || []), ...(cuerpo.no || [])]) quitar.set(lc, new Set([...(quitar.get(lc) || []), ...vs]));
      for (const lc of Object.keys(loc)) { if (cuerpo.todo) { loc[lc].v = loc[lc].v.filter((p) => !p[2]); } else if (quitar.has(lc)) loc[lc].v = loc[lc].v.filter((p) => !quitar.get(lc).has(p[0])); if (!loc[lc].v.length) delete loc[lc]; }
      A.store.set("jg:pend", Object.keys(loc).length ? loc : null);
      if (R.lib) { R.pend = cargarPend(R.lib + "." + R.cap); estadoSellos(); }
    }
    actualizarYo(r.yo); pintarMedidor();
    if (r.xp > 0) { pulsoMedidor(r.xp); chispas(8 + Math.min(12, r.conf || 0)); }
    if (r.subio) hitoNivel(r.subio.nivel);
    celebrar(r);
    return r;
  }
  function sellos() {
    for (const s of document.querySelectorAll(".jg-sello")) s.remove();
    if (!S.token || !R.lib || !R.pal.length || !R.els.length) return;
    const els = R.els.filter((e) => e.isConnected), grupos = [];
    const conMarcas = els.some((e) => e.classList.contains("p") || e.closest("p.peri"));
    let ini = 0;
    for (let i = 0; i < els.length; i++) {
      const sig = els[i + 1];
      const corte = !sig || sig.classList.contains("p") || (sig.closest("p.peri") !== els[i].closest("p.peri")) || (!conMarcas && i - ini >= 7);
      if (corte) { grupos.push([ini, i]); ini = i + 1; }
    }
    for (const [a, b] of grupos) {
      const vs = els.slice(a, b + 1).map((e) => +e.id.slice(1)).filter((v) => (R.pal[v - 1] || 0) > 0);
      if (!vs.length) continue;
      const ult = els[b], hasta = +ult.id.slice(1);
      const s = h("div", { class: "jg-sello", "data-de": String(vs[0]), "data-hasta": String(hasta) },
        h("button", { type: "button", onclick: (e) => confirmarHasta(hasta, e.currentTarget) }, h("span", { class: "tx" }), h("span", { class: "ok", "aria-hidden": "true", text: "✓" })));
      (ult.closest("p.peri") || ult).after(s);
    }
    estadoSellos();
  }
  function estadoSellos(v) {
    for (const s of document.querySelectorAll(".jg-sello")) {
      const de = +s.getAttribute("data-de"), hasta = +s.getAttribute("data-hasta");
      if (v != null && (v < de || v > hasta)) continue;
      let pend = 0, leidos = 0, total = 0;
      for (let x = de; x <= hasta; x++) { if (!(R.pal[x - 1] > 0)) continue; total++; if (R.pend.has(x)) pend++; else if (R.hechos.has(x) || +(R.hoy[x - 1] || 0) > 0) leidos++; }
      const antes = R.pend.size ? [...R.pend.keys()].filter((x) => x < de).length : 0;
      const estado = pend || antes ? "listo" : leidos >= total ? "hecho" : "";
      if (estado === "hecho" && s.dataset.e && s.dataset.e !== "hecho") chispas(12, s.querySelector("button"));
      s.dataset.e = estado || "-";
      s.className = "jg-sello" + (estado ? " " + estado : "");
      const b = s.querySelector("button"), tx = s.querySelector(".tx");
      tx.textContent = estado === "hecho" ? "Leído" : "Leí hasta aquí";
      b.setAttribute("aria-label", estado === "hecho" ? "Leído hasta el verso " + hasta : "Leí hasta aquí: confirmar " + (pend + antes ? plural(pend + antes, "verso leído", "versos leídos") : "lo leído hasta el verso " + hasta));
      b.title = pend + antes ? plural(pend + antes, "verso listo", "versos listos") + " para confirmar" : estado === "hecho" ? "Ya cuenta para tu avance" : "Se confirma lo que ya leíste con calma";
    }
  }
  // a: 0 = leído al ritmo mínimo (60 % ahora), 1 = marcado atento, 2 = sello; conf: ese verso ya se envió al 60 % y esto
  // solo trae su 40 % (no es otra lectura)
  function acreditar(lib, cap, v, ms, a, conf) {
    const lc = lib + "." + cap, cD = +(R.hoy[v - 1] || 0), sie = sieDe(lc);
    const nuevo = !conf && !(+(sie[v - 1] || 0) > 0) && !(A.leido && A.leido(lib, cap, v));
    if (!conf) { R.hoy = pon(R.hoy, v - 1, String(Math.min(9, cD + 1))); const e = espejo(); e.m[lc] = R.hoy; A.store.set("jg:hoy", e); }
    R.cola.push([lib, cap, v, ms, a == null ? 1 : a]);
    if (!R.ultEnvio) R.ultEnvio = Date.now();
    guardarCola(false);
    const antes = R.pred ? R.pred.xp : 0, suceso = predecir(lib, cap, v, ms, nuevo, conf ? Math.max(0, cD - 1) : cD, a === 0 ? 0.6 : conf ? 0.4 : 1, conf);
    pulsoMedidor((R.pred ? R.pred.xp : 0) - antes);
    if (suceso) enviar(false);
  }
  // ¿Va a ocurrir un suceso con este verso? (estimación local; el servidor decide)
  function predecir(lib, cap, v, ms, nuevo, cD, parte, soloXp) {
    const y = S.yo; if (!y) return false;
    if (parte == null) parte = 1;
    const hoy = y.hoy || {};
    const P = R.pred || (R.pred = { xp: 0, h: y.prox ? y.prox.h : 1e9, d: y.prox ? y.prox.d : 1e9, versos: 0, nuevos: 0, repaso: 0, vida: 0, cartas: 0, ms: 0, caps: 0, libros: new Set(hoy.libros || []) });
    const pal = R.pal[v - 1] || 0, base = nuevo ? 2 * pal : cD < 2 ? 0.5 * pal : 0.1 * pal;
    let suceso = false;
    if (soloXp) { if (base > 0) P.xp += base * (y.mult || 1) * parte; return !y.enTope && y.xpSig - y.xpNivel <= P.xp; }
    P.versos++; P.ms += ms; P.libros.add(lib);
    if (nuevo) P.nuevos++; else if (cD < 2) P.repaso++;
    if (["MAT", "MRK", "LUK", "JHN"].includes(lib)) P.vida++; else if (lib !== "ACT" && lib !== "REV") P.cartas++;
    if (base > 0) { P.xp += base * (y.mult || 1) * parte; P.h--; P.d--; if (P.h <= 0 || P.d <= 0) suceso = true; }
    if (!y.enTope && y.xpSig - y.xpNivel <= P.xp) suceso = true;
    if ((hoy.versos || 0) === 0 && P.versos === 1) suceso = true; // primer verso del día: perseverancia
    // capítulo completo hoy (90 % de sus versos con palabras)
    const total = R.pal.filter((x) => x > 0).length; let leidos = 0;
    for (let i = 0; i < R.pal.length; i++) if (R.pal[i] > 0 && +(R.hoy[i] || 0) > 0) leidos++;
    const lc = lib + "." + cap;
    if (total && leidos >= Math.ceil(0.9 * total) && !R.completos.has(lc)) { R.completos.add(lc); P.caps++; suceso = true; }
    const prog = { versos: P.versos, nuevos: P.nuevos, repaso: P.repaso, vida: P.vida, cartas: P.cartas, capitulo: P.caps, libros: Math.max(0, P.libros.size - (hoy.libros || []).length) };
    for (const m of y.mis || []) {
      if (m.hecha) continue;
      if (m.tipo === "minutos") { if (Math.floor(((hoy.ms || 0) + P.ms) / MIN) >= m.meta) suceso = true; continue; }
      if (prog[m.tipo] !== undefined && m.prog + prog[m.tipo] >= m.meta) suceso = true;
    }
    return suceso;
  }
  const REINT = new Map();
  async function enviar(final) {
    if (R.enviando || !R.cola.length || !S.token) return;
    R.enviando = true; R.ultEnvio = Date.now();
    const lote = R.cola.splice(0, 400), tl = {};
    for (const [k, ms] of Object.entries(R.tl)) if (ms >= 500) tl[k] = Math.round(ms);
    R.tl = {};
    guardarCola(true);
    const r = await pedir("/lectura/tanda", { metodo: "POST", cuerpo: { t: lote, tl, donde: R.lib ? R.lib + "." + R.cap : "", fin: !!final, sala: SL.cod && SL.ws && SL.ws.readyState === 1 ? SL.cod : undefined }, keepalive: !!final && JSON.stringify(lote).length < 60000 });
    R.enviando = false;
    if (r.error) {
      if (r.error !== "sesion" && r.error !== "datos") { R.cola.unshift(...lote); guardarCola(true); for (const [k, ms] of Object.entries(tl)) R.tl[k] = (R.tl[k] || 0) + ms; }
      return;
    }
    const e = espejo();
    for (const [lc, x] of Object.entries(r.caps || {})) {
      e.m[lc] = x.d; guardarSie(lc, x.s);
      const [lib, cap] = lc.split(".");
      if (x.a && x.a.length && A.marcarLeido) A.marcarLeido(lib, +cap, x.a);
      if (R.lib + "." + R.cap === lc) R.hoy = x.d;
    }
    const reintento = [];
    for (const x of r.rechazados || []) {
      if (x[3] === "adelantado") {
        const it = lote.find((q) => q[0] === x[0] && q[1] === x[1] && q[2] === x[2]), k = it && it.join("|"), n = k ? (REINT.get(k) || 0) : 9;
        if (it && n < 3) { REINT.set(k, n + 1); reintento.push(it); continue; }
      }
      if (x[0] === R.lib && x[1] === R.cap) { R.hechos.delete(x[2]); R.acc.delete(x[2]); R.accA.delete(x[2]); }
    }
    if (reintento.length) { R.cola.push(...reintento); guardarCola(false); }
    if (R.lib) estadoSellos();
    if ((r.rechazados || []).some((x) => x[3] === "rapido")) pedir("/config", { sin: true }).then((c) => { if (c && !c.error) S.cfg = c; });
    for (const lc of r.pruebas || []) if (!e.p.includes(lc)) e.p.push(lc);
    actualizarYo(r.yo); R.pred = null; pintarMedidor();
    if (r.subio) hitoNivel(r.subio.nivel);
    if (e.f !== r.yo.hoy.f) { e.f = r.yo.hoy.f; }
    A.store.set("jg:hoy", e);
    if (r.pres) { S.pres = r.pres; pintarPresencia(); }
    celebrar(r);
    if (R.cola.length >= 400) setTimeout(() => enviar(false), 1500);
  }
  // Presencia: cuántas personas leen ahora este capítulo y este libro (sale gratis con las tandas)
  function pintarPresencia() {
    const p = S.pres; const fin = document.querySelector(".hoja nav.fin-cap");
    let el = document.querySelector(".jg-pres");
    if (!p || !fin || !R.lib || (p.cap < 2 && p.lib < 2)) { if (el) el.remove(); return; }
    const t = p.cap >= 2 ? "Tú y " + plural(p.cap - 1, "persona más leen", "personas más leen") + " este capítulo ahora" + (p.lib > p.cap ? " · " + fmt(p.lib) + " en este libro" : "")
      : "Ahora mismo, " + plural(p.lib - 1, "persona más lee", "personas más leen") + " este libro";
    if (!el) { el = h("p", { class: "jg-pres", role: "status" }); fin.before(el); }
    const lc = R.lib + "." + R.cap;
    el.replaceChildren(h("i", { "aria-hidden": "true" }), h("span", { text: t + "." }),
      SL.cod ? null : h("button", { class: "btn chico oro", type: "button", onclick: (e) => acompanar(lc, e.currentTarget) }, h("span", { text: "Acompañar" })));
  }

  // ------------------------------------------------------------------ celebraciones
  // ------------------------------------------------------------------ medidor de avance mientras se lee (BiEx, 10-nov-2026)
  // «Que la subida de nivel se vea como un hito, y un medidor del avance en la vista donde se gana la experiencia.»
  // Un sello pequeño abajo a la izquierda: el nivel y un aro que se llena con cada verso validado (estimación local al
  // instante; el servidor la confirma con cada tanda). Al subir de nivel se abre un momento con el hito. Tocarlo lleva al panel.
  const MED = { el: null, nv: null, mas: null, hito: null, t: 0 };
  function medidor(ver) {
    const raiz = document.documentElement;
    if (!ver || !S.token || !S.yo) { if (MED.el) { MED.el.remove(); MED.el = null; clearTimeout(MED.tz); } raiz.classList.remove("jg-con-med"); return; }
    if (!MED.el) {
      // Escudo de nivel (BiEx, 10-nov-2026: «vuélvelo épico»): vectorial, con el metal del rango (bronce, plata, oro,
      // esmeralda y oro radiante), anillo de avance con su punta de luz, laureles, barrido de luz y rayos al subir de nivel
      MED.nv = h("b", {}); MED.mas = h("i", { "aria-hidden": "true" }); MED.hito = h("span", { class: "hito" });
      const esc = A.svg(SVG_MED, "0 0 58 68"); esc.setAttribute("aria-hidden", "true");
      MED.arco = esc.querySelector(".arco"); MED.punta = esc.querySelector(".punta");
      MED.bonos = h("span", { class: "jg-bonos" });
      MED.el = h("a", { class: "jg-med", href: "#/escudrina" }, h("span", { class: "rayos", "aria-hidden": "true" }), esc, h("span", { class: "nvk", "aria-hidden": "true", text: "NIVEL" }), MED.nv, MED.mas, MED.hito, MED.bonos);
      document.body.append(MED.el);
      chispasAzar();
    }
    raiz.classList.add("jg-con-med");
    pintarMedidor();
  }
  // Chispas del escudo (BiEx, 10-nov-2026): salen de vez en cuando, al azar, y al confirmar lectura o completar una perícopa.
  // Puntos y estrellas vectoriales que solo se desplazan, giran y se desvanecen (compositor; nada se amplía).
  function chispas(n, desde) {
    if (sinAnim() || document.hidden || !document.body.animate) return;
    const ref = MED.el && MED.el.isConnected ? MED.el : desde && desde.isConnected ? desde : null; if (!ref) return;
    const r = ref.getBoundingClientRect(); if (!r.width) return;
    const cx = r.left + r.width / 2, cy = r.top + r.height * 0.46, capa = h("div", { class: "jg-chispas", "aria-hidden": "true" });
    document.body.append(capa);
    let vivas = n;
    const fin = () => { if (--vivas <= 0) capa.remove(); };
    for (let i = 0; i < n; i++) {
      const el = h("i", { class: "jg-ch " + (Math.random() < 0.32 ? "e" : Math.random() < 0.5 ? "p g" : "p") });
      el.style.left = (cx + (Math.random() - 0.5) * r.width * 0.5).toFixed(1) + "px"; el.style.top = (cy + (Math.random() - 0.5) * r.height * 0.3).toFixed(1) + "px";
      capa.append(el);
      const ang = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.6, vel = 26 + Math.random() * 64, g = 26 + Math.random() * 46;
      const dx = Math.cos(ang) * vel, dy = Math.sin(ang) * vel, giro = (Math.random() - 0.5) * 540, dur = 650 + Math.random() * 750;
      el.animate([{ transform: "translate3d(0,0,0) rotate(0deg)", opacity: 0 }, { opacity: 1, offset: 0.1 },
        { transform: "translate3d(" + (dx * 0.62).toFixed(1) + "px," + (dy * 0.62 + g * 0.18).toFixed(1) + "px,0) rotate(" + (giro * 0.6).toFixed(0) + "deg)", opacity: 1, offset: 0.55 },
        { transform: "translate3d(" + dx.toFixed(1) + "px," + (dy + g).toFixed(1) + "px,0) rotate(" + giro.toFixed(0) + "deg)", opacity: 0 }],
      { duration: dur, delay: Math.random() * 180, easing: "cubic-bezier(.18,.7,.35,1)", fill: "both" }).finished.then(fin, fin);
    }
  }
  function chispasAzar() {
    clearTimeout(MED.tz);
    if (!MED.el) return;
    MED.tz = setTimeout(() => { if (MED.el && !document.hidden) chispas(3 + Math.floor(Math.random() * 5)); chispasAzar(); }, 14000 + Math.random() * 30000);
  }
  const LAURO_M = '<path d="M11.5 44.5c1.6 5.6 5.6 10 11 12.4" fill="none" stroke="url(#jgm-m)" stroke-width="1.3" stroke-linecap="round"/><path d="M10.6 40.2c-1.9 1.4-2.1 3.6-.9 5.6 1.9-1 2.4-3.3.9-5.6zM12.4 47.6c-2.3.5-3.2 2.6-2.6 4.8 2.2-.3 3.4-2.4 2.6-4.8zM16 53c-2.2-.2-3.8 1.4-3.8 3.6 2.2.3 3.9-1.3 3.8-3.6zM20.6 56.6c-1.9-.9-4-.2-4.8 1.8 2 .9 4.1.1 4.8-1.8z" fill="url(#jgm-m)" opacity=".9"/>';
  const SVG_MED = '<defs><linearGradient id="jgm-m" x1="0" y1="0" x2=".85" y2="1"><stop offset="0" style="stop-color:var(--m1)"/><stop offset=".5" style="stop-color:var(--m2)"/><stop offset="1" style="stop-color:var(--m3)"/></linearGradient>' +
    '<radialGradient id="jgm-f" cx=".5" cy=".36" r=".74"><stop offset="0" stop-color="#2c2317"/><stop offset=".68" stop-color="#110d08"/><stop offset="1" stop-color="#060504"/></radialGradient>' +
    '<linearGradient id="jgm-b" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".5"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>' +
    '<clipPath id="jgm-c"><path d="M29 4.6 L52.6 14.2 V37 C52.6 50 42.4 58.8 29 64.2 C15.6 58.8 5.4 50 5.4 37 V14.2 Z"/></clipPath></defs>' +
    '<path d="M29 2 L55 12.6 V37 C55 51.6 43.6 61.2 29 67 C14.4 61.2 3 51.6 3 37 V12.6 Z" fill="url(#jgm-m)"/>' +
    '<path d="M29 4.6 L52.6 14.2 V37 C52.6 50 42.4 58.8 29 64.2 C15.6 58.8 5.4 50 5.4 37 V14.2 Z" fill="url(#jgm-f)"/>' +
    '<path d="M29 7.6 L49.8 16.1 V37 C49.8 48.4 40.7 56.4 29 61.2 C17.3 56.4 8.2 48.4 8.2 37 V16.1 Z" fill="none" stroke="url(#jgm-m)" stroke-opacity=".4" stroke-width=".7"/>' +
    '<circle cx="29" cy="35" r="18" fill="none" style="stroke:var(--m3)" stroke-opacity=".6" stroke-width="3"/>' +
    '<circle class="arco" cx="29" cy="35" r="18" fill="none" stroke="url(#jgm-m)" stroke-width="3" stroke-linecap="round" pathLength="100" stroke-dasharray="0 100" transform="rotate(-90 29 35)"/>' +
    '<circle class="punta" cx="29" cy="17" r="2.2" style="fill:var(--m1)"/>' +
    LAURO_M + '<g transform="translate(58 0) scale(-1 1)">' + LAURO_M + '</g>' +
    '<path d="M29 .2l1.6 3.3 3.3 1.6-3.3 1.6L29 10l-1.6-3.3-3.3-1.6 3.3-1.6z" style="fill:var(--m1)"/>' +
    '<g clip-path="url(#jgm-c)"><g transform="skewX(-18)"><rect class="barrido" x="-34" y="0" width="20" height="70" fill="url(#jgm-b)"/></g></g>';
  // Lo que hoy multiplica la experiencia de la lectura (el servidor decide; esto solo lo muestra)
  function bonosActivos(y) {
    const out = [], coma = (n) => String(n).replace(".", ",");
    if (y.dob > 0) out.push(["×2", "Experiencia doble: " + horas(y.dob) + " de lectura (se gasta solo mientras lees)", "dob"]);
    if (y.imp && y.imp.ms > 0) out.push(["×" + coma(y.imp.f), "Impulso por tu hallazgo: " + horas(y.imp.ms) + " de lectura", "imp"]);
    if (SL.cod && SL.ws && SL.ws.readyState === 1) out.push(["×1,25", "Leer en compañía: experiencia ×1,25 mientras estás en la sala", "sala"]);
    if (y.nivel < 20) out.push([y.nivel < 10 ? "+50 %" : "+25 %", "Primeros pasos: experiencia " + (y.nivel < 10 ? "+50 % hasta el nivel 10" : "+25 % hasta el nivel 20"), "ini"]);
    if (y.lauros && y.lauros.doce) out.push(["+5 %", "Las doce piedras del fundamento: experiencia +5 % para siempre", "doce"]);
    return out;
  }
  function pintarMedidor() {
    const y = S.yo; if (!MED.el || !y) return;
    const extra = R.pred ? R.pred.xp : 0, tramo = Math.max(1, y.xpSig - y.xpNivel), p = y.enTope ? 1 : Math.min(1, Math.max(0, (y.xp - y.xpNivel + extra) / tramo));
    MED.el.style.setProperty("--p", (p * 100).toFixed(1) + "%");
    MED.arco.setAttribute("stroke-dasharray", (p * 100).toFixed(1) + " 100");
    const ang = p * 2 * Math.PI - Math.PI / 2; MED.punta.setAttribute("cx", (29 + 18 * Math.cos(ang)).toFixed(2)); MED.punta.setAttribute("cy", (35 + 18 * Math.sin(ang)).toFixed(2));
    MED.el.setAttribute("data-r", String(Math.max(0, Math.min(4, y.rango | 0))));
    MED.el.classList.toggle("dos", y.nivel >= 10 && y.nivel < 100); MED.el.classList.toggle("tres", y.nivel >= 100);
    MED.nv.textContent = String(y.nivel);
    const bonos = bonosActivos(y), firma = bonos.map((b) => b[0] + b[2]).join("|");
    if (MED.firma !== firma) {
      MED.firma = firma;
      MED.bonos.replaceChildren(...bonos.map(([t, d, k]) => h("span", { class: "jg-bono b-" + k, title: d }, t)));
    }
    MED.el.setAttribute("aria-label", "Escudriña: nivel " + y.nivel + ", " + Math.round(p * 100) + " % hacia el siguiente. Abrir el panel");
    MED.el.title = "Nivel " + y.nivel + " · " + Math.round(p * 100) + " % hacia el siguiente";
  }
  function pulsoMedidor(xp) {
    if (!MED.el) return;
    pintarMedidor();
    if (xp > 0) MED.mas.textContent = "+" + fmt(Math.max(1, Math.round(xp)));
    MED.el.classList.remove("pulso"); void MED.el.offsetWidth; MED.el.classList.add("pulso");
  }
  function hitoNivel(n) {
    if (!MED.el) return;
    MED.hito.textContent = "¡Nivel " + n + "!";
    MED.el.classList.add("sube"); vibrar([20, 40, 20]);
    clearTimeout(MED.t); MED.t = setTimeout(() => { if (MED.el) MED.el.classList.remove("sube"); }, 4200);
  }
  function pop(xp) {
    const el = h("div", { class: "jg-pop", role: "status" }, "+" + fmt(xp), h("small", { text: "de experiencia" }));
    document.body.append(el);
    if (sinAnim() || !el.animate) { el.style.opacity = "1"; setTimeout(() => el.remove(), 1800); return; }
    el.animate([{ opacity: 0, transform: "translate(-50%,10px)" }, { opacity: 1, transform: "translate(-50%,0)", offset: 0.15 }, { opacity: 1, transform: "translate(-50%,-6px)", offset: 0.8 }, { opacity: 0, transform: "translate(-50%,-14px)" }],
      { duration: 1900, easing: "ease-out" }).finished.then(() => el.remove(), () => el.remove());
  }
  function celebrar(r) {
    if (r.xp > 0) { pop(r.xp); sonar("chispa"); }
    const avisos = [];
    for (const m of r.misiones || []) avisos.push("Misión cumplida: " + textoMision(m) + " · +" + m.xp);
    if (r.diaCompleto) avisos.push("¡Cumpliste todas las misiones de hoy! +50 y 10 dracmas");
    let grande = null;
    for (const x of r.hallazgos || []) {
      if (x.tipo === "lauro") grande = { tipo: "lauro" };
      else if (x.tipo === "piedra" && (!grande || grande.tipo !== "lauro")) grande = x;
      else if (x.tipo === "dracma") avisos.push("Hallaste " + x.dr + " dracmas");
      else if (x.tipo === "libro") avisos.push("¡Terminaste " + nombreLibro(x.lib) + "! +200 y 20 dracmas");
    }
    if (r.subio) { if (r.subio.rango && !grande) grande = { tipo: "rango", nivel: r.subio.nivel, rango: r.subio.rango }; else avisos.push("Subiste al nivel " + r.subio.nivel); sonar("nivel"); }
    for (const lc of r.pruebas || []) {
      if (lc === R.lib + "." + R.cap) { avisos.push("Capítulo completo: al final te espera su prueba"); R.prueba = true; tarjetaPrueba(); }
      else { const [l, c] = lc.split("."); avisos.push("Completaste " + nombreLibro(l) + " " + c + ": su prueba te espera al final del capítulo"); }
    }
    if (r.cansancio != null && !A.store.get("jg:cansancio:" + new Date().toDateString(), false)) {
      A.store.set("jg:cansancio:" + new Date().toDateString(), true);
      avisos.push(r.cansancio === 0 ? "Hoy ya leíste más de 10 horas: el descanso también es parte del estudio" : "Llevas muchas horas leyendo: la experiencia de hoy rinde menos. El descanso también es parte del estudio");
    }
    avisos.forEach((t, i) => setTimeout(() => A.avisar(t), 900 + i * 2400));
    if (grande) setTimeout(() => celebracion(grande), 700);
    if (S.yo && !S.yo.asegurado) {
      const k = grande && (grande.tipo === "piedra" || grande.tipo === "lauro") ? "hallazgo" : S.yo.nivel >= 5 ? "n5" : S.yo.pers >= 7 ? "p7" : null;
      if (k && !A.store.get("jg:aseg:" + k, false)) { A.store.set("jg:aseg:" + k, true); setTimeout(() => A.avisar("Ya tienes avance que cuidar: asegúralo en Escudriña › Cuenta"), 900 + avisos.length * 2400 + 2400); }
    }
  }
  function celebracion(x) {
    if (document.documentElement.classList.contains("con-modal")) { A.avisar(x.tipo === "rango" ? "Nuevo rango: " + x.rango : "¡Hallazgo! Lo encuentras en Escudriña"); return; }
    sonar("hallazgo");
    let arte, titulo, texto, compartirT;
    if (x.tipo === "lauro") { arte = lauro(); titulo = h("h3", { text: "¡Un lauro trenzado incorruptible!" }); texto = "El hallazgo más raro de Escudriña (1 Κοrίndsιοι 9:25; 2 Timoteo 2:5). Durante tus próximos 30 minutos de lectura tu experiencia vale el doble: el tiempo solo corre mientras lees y no vence."; compartirT = "¡Hallé un lauro trenzado incorruptible en Escudriña, el juego de Biblia Exacta!"; }
    else if (x.tipo === "piedra") { arte = gema(x.i, true); titulo = h("h3", { text: piedraNombre(x.i) }); texto = "Hallaste la " + ORDINAL[x.i] + " piedra del fundamento (Ḥăzṓn Hiṯgallū́ṯ 21:19-20). Durante tus próximos 15 minutos de lectura tu experiencia vale ×1,5 (solo corre mientras lees)." + (x.doce ? " ¡Y reuniste las doce: tu experiencia vale un 5 % más para siempre!" : ""); compartirT = "Hallé " + PIEDRAS[x.i][1] + ", una de las doce piedras del fundamento, en Escudriña, el juego de Biblia Exacta."; }
    else if (x.tipo === "liga") { arte = gema(x.nvNuevo - 1, true); titulo = h("h3", { text: "¡Subiste a la liga " + ligaNombre(x.nvNuevo) + "!" }); texto = "Quedaste en el puesto " + x.pos + " de " + x.n + " de tu grupo" + (x.h ? ": +" + horas(x.h * 3600e3) + " de experiencia doble y " + x.dr + " dracmas" : "") + ". Esta semana lees en el " + ORDF[x.nvNuevo - 1] + " fundamento."; compartirT = "¡Subí a la liga " + ligaNombre(x.nvNuevo) + " en Escudriña!"; }
    else { arte = emblema(S.yo && S.yo.emb ? S.yo.emb.l : "α", S.yo && S.yo.emb ? S.yo.emb.c : 0, S.yo && S.yo.marco); titulo = h("h3", { text: "Nuevo rango: " + x.rango }); texto = "Llegaste al nivel " + x.nivel + ". Desde ahora compites en la clasificación de " + x.rango + "."; compartirT = "Llegué al rango de " + x.rango + " en Escudriña, el juego de Biblia Exacta."; }
    A.abrirModal(() => A.cajaModal(A.cabModal(x.tipo === "rango" ? "Nuevo rango" : x.tipo === "liga" ? "Liga de la semana" : "Hallazgo", "Escudriña"), h("div", { class: "jg-cel" },
      h("div", { class: "arte" + (sinAnim() ? "" : " anim") }, arte), titulo, h("p", { text: texto }),
      h("div", { class: "jg-acciones" }, h("button", { class: "btn oro", type: "button", onclick: () => A.cerrarModal() }, h("span", { text: "Seguir leyendo" })),
        h("button", { class: "btn", type: "button", onclick: () => compartir("Escudriña · Biblia Exacta", compartirT + " Entra con mi enlace: tus primeras 3 horas de lectura cuentan doble.", enlaceInvitacion()) }, ico("compartir"), h("span", { text: "Compartir" })),
        h("button", { class: "btn", type: "button", onclick: () => verTarjetaImagen({ tipo: x.tipo, x }) }, ico("imagen"), h("span", { text: "Imagen" }))))));
  }

  // ------------------------------------------------------------------ prueba del capítulo
  function tarjetaPrueba() {
    if (!R.prueba || !R.lib) return;
    const fin = document.querySelector(".hoja nav.fin-cap");
    if (!fin || document.querySelector(".jg-prueba")) return;
    const lib = R.lib, cap = R.cap;
    fin.before(h("div", { class: "jg-prueba" }, lauro(), h("p", {}, h("b", { text: "Prueba del capítulo. " }), "Tres preguntas sobre lo que leíste hoy: 100 de experiencia por acierto y 150 más si aciertas todas."),
      h("button", { class: "btn oro chico", type: "button", onclick: () => abrirPrueba(lib, cap) }, h("span", { text: "Hacer la prueba" }))));
  }
  async function abrirPrueba(lib, cap) {
    const r = await pedir("/prueba/pedir", { metodo: "POST", cuerpo: { lib, cap } });
    if (r.error) {
      A.avisar(r.error === "ya_hecha" ? "Ya hiciste la prueba de este capítulo hoy" : r.error === "sin_preguntas" ? "Este capítulo aún no tiene preguntas" : r.error === "sin_capitulo" ? "Primero completa el capítulo (su lectura llega al servidor en unos segundos)" : mensaje(r));
      if (r.error === "ya_hecha") { quitarPrueba(); const e = espejo(); e.p = e.p.filter((k) => k !== lib + "." + cap); A.store.set("jg:hoy", e); }
      if (r.error === "sin_capitulo" && R.cola.length) enviar(false);
      return;
    }
    const inicio = Date.now(), resp = r.preguntas.map(() => null);
    let resultado = null;
    const cuerpo = () => {
      const preguntas = r.preguntas.map((p, i) => {
        const partes = p.t.split("_____");
        return h("div", { class: "jg-preg" }, h("span", { class: "ref", text: nombreLibro(lib) + " " + cap + ":" + p.v }),
          h("p", { class: "t" }, partes[0], h("u", { text: resultado ? p.o[resultado.correctas[i]] : resp[i] != null ? p.o[resp[i]] : " " }), partes.slice(1).join("_____")),
          h("div", { class: "jg-ops", role: "group", "aria-label": "Opciones" }, p.o.map((o, k) => h("button", {
            type: "button", class: "jg-op" + (resultado ? (k === resultado.correctas[i] ? " ok" : resp[i] === k ? " mal" : "") : ""), "aria-pressed": String(resp[i] === k), disabled: !!resultado,
            onclick: () => { resp[i] = k; A.reemplazarModal(vistaP); } }, o))));
      });
      const listo = resp.every((x) => x != null);
      const pie = resultado
        ? h("div", { class: "jg-cel" }, h("h3", { text: resultado.aciertos + " de " + r.preguntas.length }), h("p", { text: resultado.xp ? "+" + resultado.xp + " de experiencia." : "Esta vez no hubo aciertos; la próxima saldrá mejor." }),
          h("button", { class: "btn oro", type: "button", onclick: () => A.cerrarModal() }, h("span", { text: "Seguir leyendo" })))
        : h("button", { class: "btn oro jg-grande", type: "button", disabled: !listo, onclick: async (e) => {
          e.currentTarget.disabled = true;
          const falta = 1600 * r.preguntas.length - (Date.now() - inicio); if (falta > 0) await esperar(falta);
          const x = await pedir("/prueba/responder", { metodo: "POST", cuerpo: { id: r.id, r: resp } });
          if (x.error) { A.avisar(mensaje(x)); return; }
          resultado = x; actualizarYo(x.yo); quitarPrueba(); { const e = espejo(); e.p = e.p.filter((k) => k !== lib + "." + cap); A.store.set("jg:hoy", e); }
          if (x.aciertos === r.preguntas.length) sonar("nivel"); else if (x.aciertos) sonar("chispa");
          for (const m of x.misiones || []) A.avisar("Misión cumplida: " + textoMision(m) + " · +" + m.xp);
          A.reemplazarModal(vistaP);
        } }, h("span", { text: listo ? "Ver resultado" : "Elige una opción en cada pregunta" }));
      return [h("p", { class: "jg-mini", text: "Completa cada verso con la palabra que falta, tal como está en la traducción de BiEx." }), ...preguntas, pie];
    };
    const vistaP = () => A.cajaModal(A.cabModal("Prueba del capítulo", nombreLibro(lib) + " " + cap), cuerpo());
    R.prueba = false;
    A.abrirModal(vistaP);
  }
  function quitarPrueba() { R.prueba = false; const el = document.querySelector(".jg-prueba"); if (el) el.remove(); }


  // ================================================================== fase 2 · animaciones (vectoriales, por el compositor)
  // Cada vista se anima la primera vez que se pinta en la visita: tarjetas que entran escalonadas, barras que crecen,
  // cifras que cuentan hasta su valor y un barrido de luz al terminar. Nada de esto ocurre con «Sin animaciones».
  const animados = new WeakSet();
  function animarCifras(raiz) {
    if (!raiz || sinAnim() || !Element.prototype.animate) return;
    let i = 0;
    for (const t of raiz.querySelectorAll(".jg-tarjeta, .jg-campana, .jg-heroe")) {
      if (animados.has(t)) continue; animados.add(t);
      t.animate([{ opacity: 0, transform: "translateY(16px) scale(.985)" }, { opacity: 1, transform: "none" }], { duration: 560, delay: Math.min(9, i++) * 70, easing: "cubic-bezier(.2,.75,.2,1)", fill: "backwards" });
    }
    for (const b of raiz.querySelectorAll(".jg-barra>i, .jg-gen .b i, .jg-meta>i")) {
      if (animados.has(b)) continue; animados.add(b);
      b.animate([{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], { duration: 1150, delay: 200, easing: "cubic-bezier(.16,.84,.3,1)", fill: "backwards" });
    }
    for (const el of raiz.querySelectorAll("[data-cifra]")) {
      if (animados.has(el)) continue; animados.add(el);
      const fin = Number(el.getAttribute("data-cifra")); if (!(fin > 0)) continue;
      const t0 = performance.now() + 160, dur = Math.min(1700, 650 + 260 * Math.log10(fin + 1));
      el.textContent = fmt(0);
      const paso = (t) => { const p = Math.max(0, Math.min(1, (t - t0) / dur)), e = 1 - Math.pow(1 - p, 3); el.textContent = fmt(Math.round(fin * e)); if (p < 1) requestAnimationFrame(paso); else el.classList.add("jg-brillo"); };
      requestAnimationFrame(paso);
    }
    for (const g of raiz.querySelectorAll(".jg-gema-viva")) {
      if (animados.has(g)) continue; animados.add(g);
      g.animate([{ opacity: 0, transform: "scale(.4) rotate(-18deg)" }, { opacity: 1, transform: "scale(1.08) rotate(3deg)", offset: 0.7 }, { opacity: 1, transform: "none" }], { duration: 900, delay: 120, easing: "cubic-bezier(.2,.8,.2,1)", fill: "backwards" });
    }
  }
  const cifra = (n, extra) => h("b", Object.assign({ "data-cifra": String(Math.max(0, Math.round(Number(n) || 0))), text: fmt(n) }, extra || {}));

  // ================================================================== bienvenida cinematográfica
  // Al crear la cuenta (con apodo, Google o Facebook) y cuando se pida en Cuenta. Letras hebreas y griegas que llegan
  // desde los bordes y giran en órbita, un anillo de oro, tu emblema que se enciende, tu apodo y tu número de Primicia.
  // Todo vectorial; solo se animan transformaciones y opacidad. Se salta con un toque; sin animaciones, se ve quieta.
  function cinematica(yo, alTerminar) {
    const y = yo || S.yo || {}, e = y.emb || { l: "α", c: 0 }, col = COLORES[e.c] || COLORES[0], quieto = sinAnim() || !Element.prototype.animate;
    const capa = document.createElement("div"); capa.className = "jg-cine-capa";
    capa.setAttribute("role", "dialog"); capa.setAttribute("aria-modal", "true"); capa.setAttribute("aria-label", "Bienvenida a Escudriña");
    const sr = capa.attachShadow({ mode: "open" });
    const W = Math.max(320, innerWidth), H = Math.max(480, innerHeight), R0 = Math.min(W, H) * 0.34;
    const heb = /[֐-׿]/.test(e.l || "");
    const letras = Array.from({ length: Math.min(30, Math.round(W / 26)) }, (_, i) => LETRAS[(i * 7 + (e.c || 0) * 3) % LETRAS.length]);
    sr.innerHTML = `<style>
:host{all:initial;position:fixed;inset:0;z-index:2147483000;display:block;font-family:var(--f-ui,'BiEx Interfaz',system-ui,sans-serif);color:#efe6d2}
.fondo{position:absolute;inset:0;background:radial-gradient(120% 90% at 50% 46%,#16120b 0%,#070607 55%,#020203 100%)}
.halo{position:absolute;left:50%;top:44%;width:${(R0 * 3.2).toFixed(0)}px;height:${(R0 * 3.2).toFixed(0)}px;margin:-${(R0 * 1.6).toFixed(0)}px 0 0 -${(R0 * 1.6).toFixed(0)}px;border-radius:50%;background:radial-gradient(circle,rgba(232,207,148,.22) 0%,rgba(232,207,148,.08) 35%,transparent 68%);opacity:0}
.rayos{position:absolute;left:50%;top:44%;width:0;height:0;opacity:0}
.rayos i{position:absolute;left:-1px;top:-${(R0 * 1.6).toFixed(0)}px;width:2px;height:${(R0 * 1.6).toFixed(0)}px;transform-origin:50% 100%;background:linear-gradient(to top,rgba(232,207,148,.34),transparent 92%);border-radius:2px}
.letra{position:absolute;left:50%;top:44%;font-size:${Math.round(Math.min(W, H) * 0.06)}px;line-height:1;font-family:'Frank Ruhl Libre','BiEx Texto','Gentium Book Plus',serif;background:linear-gradient(135deg,#fff6dc 0%,#e8cf94 38%,#b8913f 62%,#fff1c9 100%);-webkit-background-clip:text;background-clip:text;color:transparent;opacity:0;will-change:transform,opacity}
.anillo{position:absolute;left:50%;top:44%;width:${(R0 * 2).toFixed(0)}px;height:${(R0 * 2).toFixed(0)}px;margin:-${R0.toFixed(0)}px 0 0 -${R0.toFixed(0)}px;opacity:0}
.anillo svg{width:100%;height:100%;display:block;overflow:visible}
.emb{position:absolute;left:50%;top:44%;width:${(R0 * 0.92).toFixed(0)}px;height:${(R0 * 0.92).toFixed(0)}px;margin:-${(R0 * 0.46).toFixed(0)}px 0 0 -${(R0 * 0.46).toFixed(0)}px;opacity:0}
.emb svg{width:100%;height:100%;display:block}
.flash{position:absolute;left:50%;top:44%;width:${(R0 * 2.4).toFixed(0)}px;height:${(R0 * 2.4).toFixed(0)}px;margin:-${(R0 * 1.2).toFixed(0)}px 0 0 -${(R0 * 1.2).toFixed(0)}px;border-radius:50%;background:radial-gradient(circle,rgba(255,250,235,.95) 0%,rgba(255,236,190,.4) 30%,transparent 66%);opacity:0;pointer-events:none}
.textos{position:absolute;z-index:1;left:0;right:0;top:calc(44% + ${(R0 * 1.12).toFixed(0)}px);display:grid;justify-items:center;gap:${Math.round(H * 0.012)}px;text-align:center;padding:0 22px}
.textos::before{content:"";position:absolute;inset:-34px 0 -40px;background:radial-gradient(closest-side,rgba(4,4,5,.72),rgba(4,4,5,.35) 60%,transparent);z-index:-1;pointer-events:none}
.textos>*{opacity:0;margin:0}
.eyebrow{font:600 ${Math.max(11, Math.round(W * 0.012))}px/1 var(--f-ui,system-ui);letter-spacing:.32em;text-transform:uppercase;color:#c9a865}
.bien{font:400 ${Math.max(15, Math.round(Math.min(W, H) * 0.028))}px/1.3 var(--f-display,'BiEx Titular',Georgia,serif);color:#d9cfb9}
.apodo{font:500 ${Math.max(30, Math.round(Math.min(W, H) * 0.075))}px/1.05 var(--f-display,'BiEx Titular',Georgia,serif);background:linear-gradient(100deg,#fff4d6 0%,#e8cf94 45%,#c49a4a 70%,#fff4d6 100%);-webkit-background-clip:text;background-clip:text;color:transparent;max-width:92vw;overflow-wrap:anywhere}
.primicia{font:500 ${Math.max(14, Math.round(Math.min(W, H) * 0.024))}px/1.3 var(--f-ui,system-ui);color:#efe6d2;letter-spacing:.04em}
.primicia b{font:600 1.5em/1 var(--f-display,'BiEx Titular',Georgia,serif);color:#f0d595;font-variant-numeric:tabular-nums;letter-spacing:.02em}
.unico{font:400 ${Math.max(13, Math.round(Math.min(W, H) * 0.02))}px/1.5 var(--f-ui,system-ui);color:#b9ae97;max-width:30em}
.btn{all:unset;cursor:pointer;margin-top:${Math.round(H * 0.01)}px;font:600 ${Math.max(14, Math.round(Math.min(W, H) * 0.022))}px/1 var(--f-ui,system-ui);letter-spacing:.12em;text-transform:uppercase;color:#1a1408;background:linear-gradient(135deg,#f6dea2,#d6b064 55%,#f3d58f);padding:.95em 2.1em;border-radius:999px;box-shadow:0 0 0 1px rgba(255,240,200,.4) inset,0 10px 40px rgba(201,168,101,.35);position:relative;overflow:hidden}
.btn::after{content:"";position:absolute;inset:0;background:linear-gradient(100deg,transparent 30%,rgba(255,255,255,.6) 50%,transparent 70%);transform:translateX(-130%);animation:barre 2.6s ease-in-out 1.2s infinite}
.btn:focus-visible{outline:2px solid #fff3cf;outline-offset:3px}
@keyframes barre{0%{transform:translateX(-130%)}55%,100%{transform:translateX(130%)}}
.saltar{all:unset;cursor:pointer;position:absolute;right:max(14px,env(safe-area-inset-right));top:max(12px,env(safe-area-inset-top));font:500 12px/1 var(--f-ui,system-ui);letter-spacing:.14em;text-transform:uppercase;color:rgba(239,230,210,.55);padding:10px 12px}
.saltar::after{content:"";position:absolute;inset:-8px}
@media (prefers-reduced-motion:reduce){.btn::after{animation:none}}
</style>
<div class="fondo"></div><div class="halo"></div><div class="rayos">${Array.from({ length: 16 }, (_, i) => '<i style="transform:rotate(' + (i * 22.5) + 'deg)"></i>').join("")}</div>
${letras.map((l) => '<span class="letra" aria-hidden="true">' + esc(l) + "</span>").join("")}
<div class="anillo" aria-hidden="true"><svg viewBox="0 0 200 200"><defs><linearGradient id="oro" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff2cc"/><stop offset=".45" stop-color="#d9b56a"/><stop offset="1" stop-color="#9c7a35"/></linearGradient></defs>
<circle cx="100" cy="100" r="97" fill="none" stroke="url(#oro)" stroke-width="1.6"/><circle cx="100" cy="100" r="91" fill="none" stroke="#c9a865" stroke-width=".6" stroke-dasharray="1.2 4.6"/>
${Array.from({ length: 12 }, (_, i) => { const g = (i * 30 - 90) * Math.PI / 180; return '<circle cx="' + (100 + 97 * Math.cos(g)).toFixed(2) + '" cy="' + (100 + 97 * Math.sin(g)).toFixed(2) + '" r="2.2" fill="' + PIEDRAS[i][2] + '" stroke="#fff3cf" stroke-width=".5"/>'; }).join("")}</svg></div>
<div class="flash"></div>
<div class="emb" aria-hidden="true"></div>
<div class="textos"><p class="eyebrow">Escudriña · El Códice Viviente</p><p class="bien">Te damos la bienvenida,</p><p class="apodo"></p>
${y.fundador && y.n ? '<p class="primicia">Primicia n.º <b class="num">0</b> de 1440</p>' : '<p class="primicia">Tu lugar en Escudriña está listo</p>'}
<p class="unico">${y.fundador ? "Ese número es solo tuyo y no se repite. Guarda bien tu acceso o vincúlalo con Google o con una llave de acceso." : "Cada verso que leas de verdad te dará experiencia."}</p>
<button class="btn" type="button">Comenzar</button></div>
<button class="saltar" type="button" aria-label="Saltar la bienvenida">Saltar</button>`;
    sr.querySelector(".apodo").textContent = y.apodo || "";
    sr.querySelector(".emb").append(emblema(e.l, e.c, marcoVisible(y)));
    document.body.append(capa);
    const $ = (s) => sr.querySelector(s), $$ = (s) => [...sr.querySelectorAll(s)];
    let terminado = false; const anims = [];
    const an = (el, kf, o) => { if (!el || quieto) return null; const a = el.animate(kf, Object.assign({ fill: "both", easing: "cubic-bezier(.2,.75,.2,1)" }, o)); anims.push(a); return a; };
    const num = $(".num");
    const contar = () => {
      if (!num) return; const fin = Number(y.n) || 0;
      if (quieto) { num.textContent = String(fin).padStart(4, "0"); return; }
      const t0 = performance.now(), dur = 1500;
      const paso = (t) => { const p = Math.min(1, (t - t0) / dur), k = 1 - Math.pow(1 - p, 4); num.textContent = String(Math.round(fin * k)).padStart(4, "0"); if (p < 1 && !terminado) requestAnimationFrame(paso); else num.textContent = String(fin).padStart(4, "0"); };
      requestAnimationFrame(paso);
    };
    const final = () => { for (const a of anims) { try { a.finish(); } catch (er) { /* ignorar */ } } if (num) num.textContent = String(Number(y.n) || 0).padStart(4, "0"); $(".btn").focus({ preventScroll: true }); };
    const cerrar = () => {
      if (terminado) return; terminado = true;
      const fin = () => { capa.remove(); if (typeof alTerminar === "function") alTerminar(); };
      if (quieto) return fin();
      capa.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 520, easing: "ease-in", fill: "forwards" }).finished.then(fin, fin);
    };
    $(".btn").addEventListener("click", (ev) => { ev.stopPropagation(); cerrar(); });
    $(".saltar").addEventListener("click", (ev) => { ev.stopPropagation(); final(); });
    sr.addEventListener("click", (ev) => { if (ev.target.closest && (ev.target.closest(".btn") || ev.target.closest(".saltar"))) return; final(); });
    capa.addEventListener("keydown", (ev) => { if (ev.key === "Escape") cerrar(); });
    // coreografía (unos 6,5 s): fondo → letras que llegan y orbitan → anillo → destello → emblema → textos
    an($(".fondo"), [{ opacity: 0 }, { opacity: 1 }], { duration: 700, easing: "ease-out" });
    an($(".halo"), [{ opacity: 0, transform: "scale(.6)" }, { opacity: 1, transform: "scale(1)" }], { duration: 2200, delay: 900 });
    an($(".rayos"), [{ opacity: 0, transform: "rotate(-30deg) scale(.7)" }, { opacity: 1, transform: "rotate(0deg) scale(1)" }], { duration: 2600, delay: 1500 });
    an($(".rayos"), [{ transform: "rotate(0deg)" }, { transform: "rotate(360deg)" }], { duration: 90000, delay: 4100, iterations: Infinity, easing: "linear", fill: "none", composite: "add" });
    $$(".letra").forEach((el, i, todas) => {
      // la órbita final cubre los lados y la parte de arriba (abajo van los textos) y no se sale de la pantalla
      const ang = Math.PI * 0.9 + (i / Math.max(1, todas.length - 1)) * Math.PI * 1.2, lejos = Math.max(W, H) * 0.75, k = 1.16 + (i % 3) * 0.11;
      const rx = Math.min(R0 * k, W / 2 - 26), ry = R0 * (k + 0.06);
      const x0 = Math.cos(ang) * lejos, y0 = Math.sin(ang) * lejos, x1 = Math.cos(ang) * rx, y1 = Math.sin(ang) * ry;
      if (quieto) { el.style.transform = "translate(-50%,-50%) translate(" + x1.toFixed(1) + "px," + y1.toFixed(1) + "px)"; el.style.opacity = ".55"; return; }
      an(el, [{ opacity: 0, transform: "translate(-50%,-50%) translate(" + x0.toFixed(1) + "px," + y0.toFixed(1) + "px) rotate(" + (i * 47 % 360) + "deg) scale(1.6)" },
        { opacity: 0.95, offset: 0.55 }, { opacity: 0.5, transform: "translate(-50%,-50%) translate(" + x1.toFixed(1) + "px," + y1.toFixed(1) + "px) rotate(0deg) scale(1)" }],
        { duration: 1900 + (i % 5) * 160, delay: 250 + i * 55, easing: "cubic-bezier(.12,.7,.18,1)" });
    });
    an($(".anillo"), [{ opacity: 0, transform: "scale(.55) rotate(-40deg)" }, { opacity: 1, transform: "scale(1) rotate(0deg)" }], { duration: 1500, delay: 1700 });
    an($(".flash"), [{ opacity: 0, transform: "scale(.3)" }, { opacity: 1, transform: "scale(1)", offset: 0.35 }, { opacity: 0, transform: "scale(1.5)" }], { duration: 1300, delay: 2650, easing: "ease-out" });
    an($(".emb"), [{ opacity: 0, transform: "scale(.2)" }, { opacity: 1, transform: "scale(1.12)", offset: 0.6 }, { opacity: 1, transform: "scale(1)" }], { duration: 1100, delay: 2750 });
    $$(".textos>*").forEach((el, i) => an(el, [{ opacity: 0, transform: "translateY(14px)" }, { opacity: 1, transform: "none" }], { duration: 800, delay: 3500 + i * 420 }));
    if (quieto) { for (const el of $$(".textos>*, .anillo, .emb, .halo, .rayos")) el.style.opacity = "1"; contar(); }
    else { setTimeout(() => { if (!terminado) contar(); }, 4700); setTimeout(() => { if (!terminado) sonar("bienvenida"); }, 2700); }
    setTimeout(() => { try { $(".btn").focus({ preventScroll: true }); } catch (er) { /* ignorar */ } }, quieto ? 50 : 6200);
    return capa;
  }

  // ================================================================== ligas de la semana (las doce piedras)
  const ligaNombre = (nv) => piedraNombre(Math.max(1, Math.min(12, nv || 1)) - 1);
  const ORDF = ["1.er", "2.º", "3.er", "4.º", "5.º", "6.º", "7.º", "8.º", "9.º", "10.º", "11.º", "12.º"];
  function restaTexto(ms) {
    const f = Math.max(0, ms - Date.now()), d = Math.floor(f / 864e5), hs = Math.floor((f % 864e5) / 36e5), m = Math.floor((f % 36e5) / 6e4);
    return d ? d + " d " + hs + " h" : hs ? hs + " h " + m + " min" : m + " min";
  }
  const PREMIOS_LIGA = "Premios de la semana: 1.º, 3 h de experiencia doble y 30 dracmas · 2.º, 2 h y 20 · 3.º, 1 h 30 min y 15 · 4.º a 7.º, 1 h y 10 · quien lee algo, 15 min y 3. Los 7 primeros suben de fundamento; nadie baja: lo ganado se queda.";
  function escaleraPiedras(nv) {
    return h("div", { class: "jg-escalera-p", role: "img", "aria-label": "Liga " + ligaNombre(nv) + ": " + ORDF[nv - 1] + " fundamento de 12" },
      PIEDRAS.map((p, i) => h("span", { class: "jg-pel" + (i + 1 === nv ? " act" : i + 1 < nv ? " ya" : "") , title: "Liga " + ligaNombre(i + 1) }, gema(i, i + 1 <= nv))));
  }
  function filaLiga(x, suben) {
    const [l, c] = embDe(x.emb);
    return h("li", { class: "jg-fila" + (x.yo ? " yo" : "") + (x.p <= suben && x.xp > 0 ? " sube" : "") }, h("span", { class: "p", text: String(x.p) }), emblema(l, c, x.marco, x.foto),
      h("span", { class: "n" }, x.apodo, h("small", { text: "nivel " + x.nivel + (x.n ? " · Primicia n.º " + x.n : "") })), h("span", { class: "x", text: fmt(x.xp) }));
  }
  function resumenLiga(r, mini) {
    const nv = r.nv || 1, i = nv - 1, yo = (r.lista || []).find((x) => x.yo);
    const cab = h("div", { class: "jg-liga-cab" }, h("span", { class: "jg-gema-viva", style: "--g:" + PIEDRAS[i][2] }, gema(i, true)),
      h("div", {}, h("p", { class: "jg-tit", text: "Liga " + ligaNombre(nv) }),
        h("p", { class: "jg-mini" }, h("span", { lang: "grc", text: PIEDRAS[i][0] }), " · " + ORDF[i] + " fundamento de 12 · termina en " + restaTexto(r.fin))));
    const partes = [cab];
    if (r.enGrupo && yo) partes.push(h("p", { class: "jg-total" }, "Puesto ", cifra(yo.p), " de " + fmt(r.lista.length) + (yo.p <= r.suben && yo.xp > 0 ? " · zona de ascenso" : " · suben los " + r.suben + " primeros")));
    else partes.push(h("p", { text: "Lee un verso y entras en tu grupo de esta semana (hasta " + r.tam + " personas de tu liga y tu rango)." + (r.proxima && r.proxima.nvNuevo > r.proxima.nv ? " Subes a la liga " + ligaNombre(r.proxima.nvNuevo) + " por tu puesto de la semana pasada." : "") }));
    if (mini && r.enGrupo) {
      const top = r.lista.slice(0, 3); if (yo && yo.p > 3) top.push(yo);
      partes.push(h("ol", { class: "jg-lista mini" }, top.map((x) => filaLiga(x, r.suben))));
    }
    if (r.ult && r.ult.sem !== r.sem && !mini) partes.push(h("p", { class: "jg-mini", text: "La semana pasada: puesto " + r.ult.pos + " de " + r.ult.n + " en la liga " + ligaNombre(r.ult.nv) + (r.ult.nvNuevo > r.ult.nv ? " → subiste a la liga " + ligaNombre(r.ult.nvNuevo) + "." : ".") }));
    return h("div", { class: "jg-liga" }, partes);
  }
  function tarjetaLiga() {
    const zona = h("div", {}, h("p", { class: "jg-mini", text: "Cargando tu liga…" }));
    pedir("/liga", { guardable: true }).then((r) => {
      if (!zona.isConnected) return;
      if (r.error) return zona.replaceChildren(h("p", { class: "jg-mini", text: "Tu liga de la semana se verá aquí en un momento." }));
      zona.replaceChildren(resumenLiga(r, true)); animarCifras(zona);
    });
    return tarjeta("Tu liga de la semana", ico("liga"), zona, h("div", { class: "jg-acciones" }, h("a", { class: "btn", href: "#/escudrina/liga" }, ico("liga"), h("span", { text: "Ver mi liga" }))));
  }
  async function pintarLiga(cont) {
    document.title = "Liga de la semana · Escudriña · BiEx";
    const zona = h("div", { class: "jg" }, h("p", { class: "cargando", text: "Cargando tu liga…" }));
    marco(cont, cabSub("Liga de la semana", "De domingo a sábado, hora de Bogotá. Cada liga lleva el nombre de una de las doce piedras del fundamento (Ḥăzṓn Hiṯgallū́ṯ 21:19-20): se sube de fundamento en fundamento."), zona);
    const r = await pedir("/liga");
    if (cont !== S.cont || !zona.isConnected) return;
    if (r.error) return zona.replaceChildren(tarjeta(null, null, h("p", { text: mensaje(r) })));
    zona.replaceChildren(
      h("section", { class: "jg-tarjeta jg-heroe" }, resumenLiga(r, false), escaleraPiedras(r.nv || 1)),
      r.enGrupo ? tarjeta("Tu grupo", null, h("ol", { class: "jg-lista jg-lista-liga" }, r.lista.map((x, i) => [filaLiga(x, r.suben), i + 1 === r.suben && r.lista.length > r.suben ? h("li", { class: "jg-corte", "aria-hidden": "true" }, h("span", { text: "▲ suben de fundamento" })) : null]).flat().filter(Boolean)),
        h("p", { class: "jg-mini", text: "La experiencia de la semana se actualiza cada media hora mientras lees, y al cerrar la lectura." })) : null,
      tarjeta("Premios", null, h("p", { class: "jg-mini", text: PREMIOS_LIGA })));
    animarCifras(zona);
  }

  // ================================================================== compañías (de 2 a 24)
  const enlaceCompania = (cod) => PUBLICO + "/#/escudrina/c/" + cod;
  function formCompania(pista) {
    const nombre = h("input", { type: "text", maxlength: "30", placeholder: "Nombre de la compañía (3 a 30)", "aria-label": "Nombre de la compañía" });
    const cod = h("input", { type: "text", maxlength: "10", autocapitalize: "characters", placeholder: "Código (8 letras)", "aria-label": "Código de la compañía", spellcheck: "false" });
    const hecho = (r) => { if (r.error) { pista.textContent = mensaje(r); pista.className = "jg-pista mal"; return; } actualizarYo(r.yo); A.store.set("jg:compInv", null); sonar("nivel"); A.avisar("¡Ya estás en «" + r.comp.nombre + "»!"); A.irA("#/escudrina/compania"); repintar(); };
    return h("div", { class: "jg" },
      h("div", { class: "jg-form" }, nombre, h("button", { class: "btn oro", type: "button", onclick: async (e) => { const bt = e.currentTarget; bt.disabled = true; const r = await pedir("/compania/crear", { metodo: "POST", cuerpo: { nombre: nombre.value.trim() } }); bt.disabled = false; hecho(r); } }, h("span", { text: "Crear" }))),
      h("div", { class: "jg-form" }, cod, h("button", { class: "btn", type: "button", onclick: async (e) => { const bt = e.currentTarget; bt.disabled = true; const r = await pedir("/compania/unir", { metodo: "POST", cuerpo: { cod: cod.value.trim() } }); bt.disabled = false; hecho(r); } }, h("span", { text: "Unirme" }))),
      pista);
  }
  function metaCompania(r) {
    const pct = r.meta ? Math.max(0, Math.min(100, (100 * r.v) / r.meta)) : 0;
    return h("div", { class: "jg" }, h("p", { class: "jg-total" }, cifra(r.v), " de " + fmt(r.meta) + " versos esta semana" + (r.ok ? " · ¡meta lograda!" : "")),
      h("div", { class: "jg-barra oro jg-meta-b", role: "progressbar", "aria-valuemin": "0", "aria-valuemax": String(r.meta), "aria-valuenow": String(r.v), "aria-label": "Meta común de la semana" }, h("i", { style: "width:" + pct.toFixed(1) + "%" })),
      h("p", { class: "jg-mini", text: "Meta común: " + ((S.cfg && S.cfg.comp && S.cfg.comp.meta) || 70) + " versos por persona a la semana. Al lograrla, cada quien recibe 1 h de experiencia doble." }));
  }
  function tarjetaCompania(y) {
    const pista = h("p", { class: "jg-pista", role: "status" });
    if (!y.comp) {
      const inv = A.store.get("jg:compInv", null);
      return tarjeta("Compañía", ico("compania"), h("p", { text: "Lean juntos: una compañía reúne de 2 a 24 personas con una meta común cada semana y su propia clasificación." }),
        inv && inv.c ? h("div", { class: "jg-aviso" }, "Te invitaron a una compañía. ", h("a", { href: "#/escudrina/c/" + inv.c, text: "Ver la invitación" })) : null, formCompania(pista));
    }
    const zona = h("div", {}, h("p", { class: "jg-mini", text: "Cargando…" }));
    pedir("/compania", { guardable: true }).then((r) => { if (!zona.isConnected || r.error || !r.comp) return; zona.replaceChildren(metaCompania(r)); animarCifras(zona); });
    return tarjeta("Compañía · " + y.comp.nombre, ico("compania"), zona, h("div", { class: "jg-acciones" }, h("a", { class: "btn", href: "#/escudrina/compania" }, ico("compania"), h("span", { text: "Ver mi compañía" })),
      h("a", { class: "btn", href: "#/escudrina/companias" }, h("span", { text: "Clasificación de compañías" }))));
  }
  async function pintarCompania(cont) {
    document.title = "Compañía · Escudriña · BiEx";
    const zona = h("div", { class: "jg" }, h("p", { class: "cargando", text: "Cargando…" }));
    marco(cont, cabSub("Compañía", "De 2 a 24 personas que leen juntas: meta común cada semana y su propia clasificación."), zona);
    const r = await pedir("/compania", { guardable: false });
    if (cont !== S.cont || !zona.isConnected) return;
    if (r.error) return zona.replaceChildren(tarjeta(null, null, h("p", { text: mensaje(r) })));
    const pista = h("p", { class: "jg-pista", role: "status" });
    if (!r.comp) {
      zona.replaceChildren(tarjeta("Crear o unirte", ico("compania"), h("p", { text: "Crea una compañía y comparte su código, o únete con el código que te dieron." }), formCompania(pista)),
        h("div", { class: "jg-acciones" }, h("a", { class: "btn", href: "#/escudrina/companias" }, h("span", { text: "Clasificación de compañías" }))));
      return animarCifras(zona);
    }
    const c = r.comp;
    const salir = h("button", { class: "btn", type: "button", onclick: async (e) => {
      if (!e.currentTarget.dataset.seguro) { e.currentTarget.dataset.seguro = "1"; e.currentTarget.querySelector("span").textContent = "Toca otra vez para salir"; return; }
      const x = await pedir("/compania/salir", { metodo: "POST", cuerpo: {} }); if (x.error) return A.avisar(mensaje(x));
      actualizarYo(x.yo); A.avisar("Saliste de «" + c.nombre + "»"); repintar();
    } }, h("span", { text: "Salir de la compañía" }));
    zona.replaceChildren(
      h("section", { class: "jg-tarjeta jg-heroe" }, h("p", { class: "jg-tit", text: c.nombre }), h("p", { class: "jg-mini", text: plural(c.n, "persona", "personas") + " de " + ((S.cfg && S.cfg.comp && S.cfg.comp.max) || 24) + (c.mia ? " · la cuidas tú" : "") }), metaCompania(r)),
      tarjeta("Invitar", ico("compartir"), h("div", { class: "jg-codigo", text: c.cod }),
        h("div", { class: "jg-acciones" }, h("button", { class: "btn", type: "button", onclick: () => copiar(c.cod, "Código copiado") }, ico("copiar"), h("span", { text: "Copiar el código" })),
          h("button", { class: "btn oro", type: "button", onclick: () => compartir("Escudriña · compañía «" + c.nombre + "»", "Únete a mi compañía «" + c.nombre + "» en Escudriña: leemos juntos la Nueva Voluntad traducida palabra por palabra del griego.", enlaceCompania(c.cod)) }, ico("compartir"), h("span", { text: "Compartir el enlace" }))),
        c.mia ? h("button", { class: "btn chico jg-cod-nuevo", type: "button", onclick: async () => { const x = await pedir("/compania/codigo", { metodo: "POST", cuerpo: {} }); if (x.error) return A.avisar(mensaje(x)); actualizarYo(x.yo); A.avisar("Código nuevo: el anterior ya no sirve"); repintar(); } }, "Cambiar el código") : null),
      tarjeta("Esta semana", null, h("ol", { class: "jg-lista" }, r.miembros.map((x) => { const [l, cc] = embDe(x.emb); return h("li", { class: "jg-fila" + (x.yo ? " yo" : "") }, h("span", { class: "p", text: String(x.p) }), emblema(l, cc, x.marco, x.foto),
        h("span", { class: "n" }, x.apodo, h("small", { text: plural(x.v, "verso", "versos") + " · nivel " + x.nivel })), h("span", { class: "x", text: fmt(x.x) })); })),
        h("p", { class: "jg-mini", text: "Se actualiza cada media hora mientras leen, y al cerrar la lectura." })),
      h("div", { class: "jg-acciones" }, h("a", { class: "btn", href: "#/escudrina/companias" }, h("span", { text: "Clasificación de compañías" })), salir));
    animarCifras(zona);
  }
  async function pintarCompanias(cont) {
    document.title = "Compañías · Escudriña · BiEx";
    const zona = h("div", { class: "jg" }, h("p", { class: "cargando", text: "Cargando…" }));
    marco(cont, cabSub("Clasificación de compañías", "Por la experiencia promedio de sus personas esta semana: una compañía de 2 compite de igual a igual con una de 24."), zona);
    const r = await pedir("/companias", { sin: true, guardable: true });
    if (cont !== S.cont || !zona.isConnected) return;
    if (r.error) return zona.replaceChildren(tarjeta(null, null, h("p", { text: mensaje(r) })));
    const mia = S.yo && S.yo.comp ? S.yo.comp.nombre : null;
    zona.replaceChildren(tarjeta(null, null, r.lista.length ? h("ol", { class: "jg-lista" }, r.lista.map((x) => h("li", { class: "jg-fila" + (x.nombre === mia ? " yo" : "") }, h("span", { class: "p", text: String(x.p) }),
      h("span", { class: "jg-comp-ico", "aria-hidden": "true" }, ico("compania")), h("span", { class: "n" }, x.nombre, h("small", { text: plural(x.n, "persona", "personas") + " · " + plural(x.v, "verso", "versos") + " esta semana" })), h("span", { class: "x", text: fmt(x.prom) }))))
      : h("p", { text: "Todavía no hay compañías con 2 personas o más esta semana. ¡La tuya puede ser la primera!" }),
      h("p", { class: "jg-mini", text: "Termina en " + restaTexto(r.fin) + ". La cifra es la experiencia promedio por persona." })));
    animarCifras(zona);
  }
  async function pintarUnirCompania(cont, cod) {
    document.title = "Invitación a una compañía · Escudriña · BiEx";
    const zona = h("div", { class: "jg" }, h("p", { class: "cargando", text: "Cargando…" }));
    marco(cont, cabSub("Invitación a una compañía", "Lean juntos la Nueva Voluntad con una meta común cada semana."), zona);
    const r = await pedir("/compania/ver?c=" + encodeURIComponent(String(cod || "").toUpperCase()), { sin: true, guardable: true });
    if (cont !== S.cont || !zona.isConnected) return;
    if (r.error) return zona.replaceChildren(tarjeta(null, null, h("p", { text: "Esa invitación ya no es válida: pide el código nuevo a quien te invitó." })));
    const pista = h("p", { class: "jg-pista", role: "status" });
    const ya = S.yo && S.yo.comp;
    zona.replaceChildren(h("section", { class: "jg-tarjeta jg-heroe" }, h("p", { class: "jg-tit", text: r.nombre }), h("p", { class: "jg-mini", text: plural(r.n, "persona", "personas") + " de " + r.max }),
      ya ? h("p", { text: "Ya estás en «" + ya.nombre + "». Para unirte a esta, primero sal de la tuya." }) :
        h("button", { class: "btn oro jg-grande", type: "button", disabled: r.n >= r.max, onclick: async (e) => { const bt = e.currentTarget; bt.disabled = true; const x = await pedir("/compania/unir", { metodo: "POST", cuerpo: { cod } }); bt.disabled = false;
          if (x.error) { pista.textContent = mensaje(x); pista.className = "jg-pista mal"; return; } actualizarYo(x.yo); A.store.set("jg:compInv", null); sonar("nivel"); A.avisar("¡Ya estás en «" + x.comp.nombre + "»!"); A.irA("#/escudrina/compania"); } },
        h("span", { text: r.n >= r.max ? "La compañía está completa" : "Unirme a la compañía" })), pista));
    animarCifras(zona);
  }

  // ================================================================== misión mundial
  function textoMisionMundial(m) {
    const n = fmt(m.meta);
    if (m.tipo === "capitulos") return "Entre todos, completen " + n + " capítulos";
    if (m.tipo === "lectores") return "Que " + n + " personas lean al menos " + ((S.cfg && S.cfg.misMin) || 10) + " versos";
    return "Entre todos, lean " + n + " versos" + (m.ambito === "vida" ? " de los relatos de la vida de YēshŪ́ʿa" : m.ambito === "cartas" ? " de las cartas" : m.ambito === "libro" ? " de " + nombreLibro(m.lib) : "");
  }
  // La misma hora del suceso vista desde distintas ciudades, una tras otra (BiEx, 10-nov-2026: que no salga siempre la
  // misma ciudad). Empieza por una ciudad aleatoria y cambia cada pocos segundos con un fundido.
  function relojCiudades(ms, prefijo) {
    const el = h("span", { class: "jg-rota" }); let i = Math.floor(Math.random() * CIUDADES.length);
    const pinta = () => { const c = CIUDADES[i % CIUDADES.length]; el.textContent = prefijo + " " + horaEn(ms, c[0]).replace(",", "") + " · hora de " + c[1].split(" · ")[0]; i++; };
    pinta();
    const t = setInterval(() => {
      if (!el.isConnected) { clearInterval(t); return; }
      if (sinAnim() || !el.animate) { pinta(); return; }
      el.animate([{ opacity: 1 }, { opacity: 0 }, { opacity: 1 }], { duration: 700, easing: "ease-in-out" }); setTimeout(pinta, 350);
    }, 3800);
    return el;
  }
  function tarjetaMision(y) {
    const zona = h("div", {}, h("p", { class: "jg-mini", text: "Cargando la misión…" }));
    pedir("/vivo", { sin: true, guardable: true }).then((v) => {
      if (!zona.isConnected || v.error) return;
      const m = v.mision;
      if (!m) return zona.replaceChildren(h("p", { text: v.proxMision ? "La primera misión mundial empieza el " + fechaLarga(v.proxMision) + "." : "Pronto empieza una misión mundial." }));
      const pct = Math.max(0, Math.min(100, (100 * m.total) / Math.max(1, m.meta))), mio = y.mision && y.mision.k === m.k ? y.misAporte || 0 : 0, min = (S.cfg && S.cfg.misMin) || 10;
      zona.replaceChildren(h("p", { class: "jg-tit jg-mis-t", text: textoMisionMundial(m) }),
        h("p", { class: "jg-total" }, cifra(m.total), " de " + fmt(m.meta) + (m.ok ? " · ¡lograda!" : "")),
        h("div", { class: "jg-barra oro", role: "progressbar", "aria-valuemin": "0", "aria-valuemax": String(m.meta), "aria-valuenow": String(m.total), "aria-label": "Avance de la misión mundial" }, h("i", { style: "width:" + pct.toFixed(1) + "%" })),
        h("p", { class: "jg-mini" }, plural(m.part, "persona aporta", "personas aportan") + " · termina en " + restaTexto(m.fin) + (mio ? " · tu aporte: " + fmt(mio) : "")),
        h("p", { class: "jg-mini" }, relojCiudades(m.fin, "Termina el")),
        h("p", { class: "jg-mini", text: "Quien aporte " + min + " versos o más recibe 1 h de experiencia doble si se logra, y 15 min si no se alcanza. Hay una misión nueva cada dos días; su hora de comienzo se alterna para que a cada región del mundo le toque una cómoda." }),
        v.proxMision ? h("p", { class: "jg-mini" }, relojCiudades(v.proxMision, "La siguiente empieza el")) : "");
      animarCifras(zona);
    });
    return tarjeta("Misión mundial", ico("mundo"), zona);
  }

  // ================================================================== lectura en compañía (salas en tiempo real)
  const SL = { cod: null, ws: null, miembros: [], anf: "", yo6: "", seguir: false, guia: false, ultPos: 0, pos: "", intentos: 0, cerrada: true, t: null, marcas: new Map() };
  function entrarSala(cod) {
    cod = String(cod || "").toUpperCase(); if (!/^[2-9A-HJKMNP-Z]{6}$/.test(cod) || !S.token) return false;
    if (SL.cod === cod && SL.ws && SL.ws.readyState <= 1) return true;
    salirSala(true);
    Object.assign(SL, { cod, cerrada: false, intentos: 0, miembros: [], seguir: false, guia: false });
    A.store.set("jg:sala", { c: cod, t: Date.now() });
    conectarSala(); return true;
  }
  // BiEx (10-nov-2026): la sala quedó en «conectando…» hasta recargar. Ahora: tope de 10 s para abrir, latido que detecta
  // una conexión muerta, reintentos sin rendirse (espera creciente, tope 20 s) y reconexión inmediata al volver a la página,
  // a la ventana o a la red.
  async function conectarSala() {
    if (SL.cerrada || !SL.cod || !S.token || SL.conectando || (SL.ws && SL.ws.readyState <= 1)) return;
    SL.conectando = true; clearTimeout(SL.tr);
    const otra = (ms) => { clearTimeout(SL.tr); SL.tr = setTimeout(conectarSala, ms); };
    // boleto de un minuto, solo para esta sala: la sesión nunca va en la dirección del WebSocket
    let bo; try { bo = await pedir("/sala/boleto", { metodo: "POST", cuerpo: { c: SL.cod } }); } catch (e) { bo = { error: "red" }; }
    SL.conectando = false;
    if (bo.error) { if (bo.error === "sala") { A.avisar("Esa sala ya no existe"); salirSala(true); } else otra(6000); return; }
    if (SL.cerrada) return;
    let ws; try { ws = new WebSocket(API_ABS.replace(/^http/, "ws") + "/sala/ws?c=" + SL.cod + "&b=" + encodeURIComponent(bo.b)); } catch (e) { otra(6000); return; }
    SL.ws = ws; SL.pong = Date.now();
    const tAbrir = setTimeout(() => { if (ws.readyState === 0) { try { ws.close(); } catch (e) { /* ignorar */ } } }, 10000);
    ws.onopen = () => {
      clearTimeout(tAbrir); SL.intentos = 0; SL.pos = ""; SL.pong = Date.now(); clearInterval(SL.t);
      SL.t = setInterval(() => {
        if (Date.now() - SL.pong > 65000) { try { ws.close(); } catch (e) { /* ignorar */ } return; } // sin respuesta: la conexión está muerta
        try { if (ws.readyState === 1) ws.send("ping"); } catch (e) { /* ignorar */ }
      }, 25000);
      posSala(true); pintarSalaPildora();
    };
    ws.onmessage = (ev) => { SL.pong = Date.now(); if (ev.data === "pong") return; let m; try { m = JSON.parse(ev.data); } catch (e) { return; } mensajeSala(m); };
    ws.onclose = (ev) => {
      clearTimeout(tAbrir); clearInterval(SL.t); if (SL.ws === ws) SL.ws = null;
      if (SL.cerrada || ev.code === 4000) { pintarSalaPildora(); return; }
      SL.intentos = (SL.intentos || 0) + 1; pintarSalaPildora();
      otra(Math.min(20000, 800 * 2 ** Math.min(SL.intentos, 5)));
    };
  }
  function reanimarSala() {
    if (!SL.cod || SL.cerrada) return;
    if (SL.ws && SL.ws.readyState === 1) { if (Date.now() - (SL.pong || 0) < 65000) return; try { SL.ws.close(); } catch (e) { /* ignorar */ } }
    SL.intentos = 0; clearTimeout(SL.tr); conectarSala();
  }
  window.addEventListener("online", reanimarSala); window.addEventListener("focus", reanimarSala); window.addEventListener("pageshow", reanimarSala);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) reanimarSala(); });
  function salirSala(silencio) {
    SL.cerrada = true; clearInterval(SL.t);
    if (SL.ws) { try { SL.ws.close(1000, "salir"); } catch (e) { /* ignorar */ } }
    SL.ws = null; SL.cod = null; SL.miembros = []; A.store.set("jg:sala", null); quitarMarcas(); pintarSalaPildora();
    if (!silencio) A.avisar("Saliste de la sala");
  }
  function mensajeSala(m) {
    if (m.t === "abierta") { SL.pub = !!m.on; if (SL.abierta) { try { A.reemplazarModal(SL.vista); } catch (e) { SL.abierta = false; } } return; }
    if (m.t === "estado") {
      if (m.abierta !== undefined) SL.pub = !!m.abierta;
      SL.miembros = m.miembros || []; SL.anf = m.anf || ""; if (m.yo) SL.yo6 = m.yo;
      const yo = SL.miembros.find((x) => x.j === SL.yo6); SL.guia = !!(yo && yo.guia);
      pintarSalaPildora(); pintarMarcas();
      if (SL.abierta) { try { A.reemplazarModal(SL.vista); } catch (e) { SL.abierta = false; } }
    } else if (m.t === "pos") {
      const x = SL.miembros.find((y) => y.j === m.j); if (x) { x.lc = m.lc; x.v = m.v; x.guia = !!m.guia; }
      pintarMarcas();
      if (SL.seguir && x && x.guia && x.lc) seguirA(x);
    } else if (m.t === "luz") {
      const [lib, cap] = (m.lc || "").split(".");
      if (R.lib === lib && R.cap === +cap) luzEnVerso(m.v);
      if (m.j !== SL.yo6) A.avisar(m.apodo + " encendió una luz en " + nombreLibro(lib) + " " + cap + ":" + m.v);
    }
  }
  function versoVisible() {
    if (!R.lib || !R.els.length) return 0;
    for (const e of R.els) if (R.vis.get(e)) return +e.id.slice(1);
    return 0;
  }
  function posSala(ya) {
    if (!SL.ws || SL.ws.readyState !== 1 || !R.lib) return;
    const v = versoVisible(); const k = R.lib + "." + R.cap + ":" + v;
    if (k === SL.pos || (!ya && Date.now() - SL.ultPos < 3000)) return;
    SL.pos = k; SL.ultPos = Date.now();
    try { SL.ws.send(JSON.stringify({ t: "pos", lc: R.lib + "." + R.cap, v })); } catch (e) { /* ignorar */ }
  }
  function seguirA(x) {
    const [lib, cap] = x.lc.split(".");
    if (R.lib !== lib || R.cap !== +cap) { A.irA("#/" + lib + "/" + cap + "/l" + (x.v ? "/" + x.v : "")); return; }
    if (performance.now() - (R.ultAct || 0) < 4000) return; // quien sigue está leyendo por su cuenta: no se le mueve
    const el = document.getElementById("v" + x.v);
    if (el) { const r = el.getBoundingClientRect(); if (r.top < 60 || r.bottom > innerHeight - 40) el.scrollIntoView({ block: "center", behavior: sinAnim() ? "auto" : "smooth" }); }
  }
  function quitarMarcas() { for (const el of document.querySelectorAll(".jg-sala-m")) el.remove(); for (const el of document.querySelectorAll(".jg-con-m")) if (!el.querySelector(".jg-luz")) el.classList.remove("jg-con-m"); }
  function pintarMarcas() {
    quitarMarcas();
    if (!SL.cod || !R.lib) return;
    const aqui = R.lib + "." + R.cap;
    const porVerso = new Map();
    for (const x of SL.miembros) { if (x.j === SL.yo6 || x.lc !== aqui || !x.v) continue; if (!porVerso.has(x.v)) porVerso.set(x.v, []); porVerso.get(x.v).push(x); }
    for (const [v, l] of porVerso) {
      const el = document.getElementById("v" + v); if (!el) continue;
      const m = h("span", { class: "jg-sala-m", "aria-label": l.map((x) => x.apodo).join(", ") + " lee aquí" }, l.slice(0, 3).map((x) => { const [le, c] = embDe(x.emb); return h("span", { class: "jg-sala-e", title: x.apodo, style: "--c:" + (COLORES[c] || COLORES[0]) }, le); }), l.length > 3 ? h("b", { text: "+" + (l.length - 3) }) : null);
      el.classList.add("jg-con-m"); el.prepend(m);
    }
  }
  function luzEnVerso(v) {
    const el = document.getElementById("v" + v); if (!el) return;
    const l = h("span", { class: "jg-luz", "aria-hidden": "true" }); el.classList.add("jg-con-m"); el.prepend(l);
    if (sinAnim() || !l.animate) { setTimeout(() => l.remove(), 1600); return; }
    l.animate([{ opacity: 0, transform: "scale(.4)" }, { opacity: 1, transform: "scale(1.2)", offset: 0.3 }, { opacity: 0, transform: "scale(2.2)" }], { duration: 1600, easing: "ease-out" }).finished.then(() => l.remove(), () => l.remove());
  }
  function pintarSalaPildora() {
    let p = document.querySelector(".jg-sala-p");
    if (!SL.cod) { if (p) p.remove(); return; }
    if (!p) { p = h("button", { class: "jg-sala-p", type: "button", onclick: abrirSala }); document.body.append(p); }
    const n = SL.miembros.length, conectada = SL.ws && SL.ws.readyState === 1;
    p.replaceChildren(h("i", { class: conectada ? "on" : "", "aria-hidden": "true" }), h("span", { text: "Sala " + SL.cod }), h("b", { text: conectada ? plural(n, "persona", "personas") : "conectando…" }));
    p.setAttribute("aria-label", "Sala de lectura " + SL.cod + ": " + (conectada ? plural(n, "persona", "personas") : "conectando"));
  }
  function abrirSala() {
    const vistaS = () => {
      const anf = SL.miembros.find((x) => x.anf);
      const lista = h("ul", { class: "jg-lista mini sala" }, SL.miembros.map((x) => { const [l, c] = embDe(x.emb); const [lib, cap] = (x.lc || "").split(".");
        return h("li", { class: "jg-fila" + (x.j === SL.yo6 ? " yo" : "") }, emblema(l, c, x.marco), h("span", { class: "n" }, x.apodo, h("small", { text: (x.anf ? "anfitrión · " : "") + (x.lc ? nombreLibro(lib) + " " + cap + (x.v ? ":" + x.v : "") + (x.guia ? " · guía la lectura" : "") : "todavía no abre un capítulo") })),
          x.lc && x.j !== SL.yo6 ? h("a", { class: "btn chico", href: "#/" + lib + "/" + cap + "/l" + (x.v ? "/" + x.v : ""), onclick: () => A.cerrarModal() }, h("span", { text: "Ir" })) : null); }));
      const soyAnf = anf && anf.j === SL.yo6;
      return A.cajaModal(A.cabModal("Sala " + SL.cod, "Lectura en compañía"), h("div", { class: "jg" },
        h("p", { class: "jg-mini", text: "Mientras lean el mismo capítulo con alguien de la sala, cada verso te da un 25 % más de experiencia." }), lista,
        soyAnf ? h("label", { class: "jg-check" }, h("input", { type: "checkbox", checked: SL.pub !== false, onchange: (e) => { try { SL.ws.send(JSON.stringify({ t: "abierta", on: e.currentTarget.checked })); } catch (er) { /* ignorar */ } } }), h("span", { text: "Sala abierta: aparece en la lista de Juntos y cualquiera puede entrar" })) : null,
        soyAnf ? h("label", { class: "jg-check" }, h("input", { type: "checkbox", checked: SL.guia, onchange: (e) => { try { SL.ws.send(JSON.stringify({ t: "guia", on: e.currentTarget.checked })); } catch (er) { /* ignorar */ } } }), h("span", { text: "Guiar la lectura (quien te siga irá contigo)" }))
          : anf && anf.guia ? h("label", { class: "jg-check" }, h("input", { type: "checkbox", checked: SL.seguir, onchange: (e) => { SL.seguir = e.currentTarget.checked; if (SL.seguir && anf.lc) seguirA(anf); } }), h("span", { text: "Seguir a " + anf.apodo })) : null,
        h("div", { class: "jg-acciones" },
          R.lib ? h("button", { class: "btn", type: "button", onclick: () => { const v = versoVisible(); if (v && SL.ws && SL.ws.readyState === 1) { SL.ws.send(JSON.stringify({ t: "luz", lc: R.lib + "." + R.cap, v })); sonar("chispa"); A.avisar("Quienes están en la sala ven ahora una luz en el verso " + v); } }, title: "Enciende por unos segundos una luz en el verso que tienes en pantalla, para que los demás lo vean en su texto" }, ico("idea"), h("span", { text: "Señalar este verso a la sala" })) : null,
          h("button", { class: "btn oro", type: "button", onclick: () => compartir("Escudriña · leamos juntos", "Leamos juntos la Nueva Voluntad en Escudriña: entra a mi sala.", PUBLICO + "/#/escudrina/sala/" + SL.cod) }, ico("compartir"), h("span", { text: "Invitar" })),
          h("button", { class: "btn", type: "button", onclick: () => { salirSala(false); SL.abierta = false; A.cerrarModal(); } }, h("span", { text: "Salir de la sala" })))));
    };
    SL.vista = vistaS; SL.abierta = true;
    A.abrirModal(vistaS, () => { SL.abierta = false; });
  }
  // ================================================================== salas abiertas y quién está leyendo (tanda 3)
  const VIVO = { salas: null, ts: 0, pres: new Map() };
  async function salasAbiertas(forzar) {
    if (!forzar && VIVO.salas && Date.now() - VIVO.ts < 30e3) return VIVO.salas;
    const r = await pedir("/salas", { sin: true }); if (r.error) return VIVO.salas || [];
    VIVO.salas = r.salas || []; VIVO.ts = Date.now();
    const j = MU && MU.querySelector('a[data-s="juntos"]'); if (j) { if (VIVO.salas.length) j.setAttribute("data-n", String(VIVO.salas.length)); else j.removeAttribute("data-n"); }
    return VIVO.salas;
  }
  async function presentes(lib) {
    const k = lib || "", c = VIVO.pres.get(k); if (c && Date.now() - c.t < 30e3) return c.r;
    const r = await pedir("/presentes" + (lib ? "?lib=" + lib : ""), { sin: true }); if (!r.error) VIVO.pres.set(k, { t: Date.now(), r });
    return r;
  }
  // el último capítulo abierto en este dispositivo (para anunciar la sala donde se está leyendo)
  const ultimoLC = () => { const u = A.ultimo && A.ultimo(), m = u && /^#\/([1-3A-Z]{3})\/(\d{1,3})/.exec(u.h || ""); return m ? m[1] + "." + m[2] : undefined; };
  const corto = (b) => [...String(nombreLibro(b) || b).split(" [")[0]].slice(0, 6).join("");
  const nombreLC = (lc) => { const [lib, cap] = String(lc || "").split("."); return lib ? nombreLibro(lib) + " " + cap : "Eligiendo capítulo"; };
  // «Acompañar» (BiEx, 10-nov-2026): entra a la sala abierta de ese capítulo o abre una nueva ahí mismo
  async function acompanar(lc, boton) {
    if (!S.token) return A.irA("#/escudrina");
    if (boton) boton.disabled = true;
    try {
      const p = await presentes(lc.split(".")[0]), ya = p && p.salas && p.salas[lc] && p.salas[lc].sort((a, b) => b.n - a.n)[0];
      if (SL.cod && (!ya || ya.c === SL.cod)) { abrirSala(); return; }
      if (ya) { entrarSala(ya.c); A.avisar("Entraste a la sala " + ya.c + " · " + nombreLC(lc)); }
      else { const r = await pedir("/sala/crear", { metodo: "POST", cuerpo: { abierta: true, lc } }); if (r.error) return A.avisar(mensaje(r)); SL.pub = true; entrarSala(r.cod); A.avisar("Abriste una sala en " + nombreLC(lc) + ": quien lea aquí puede acompañarte"); }
      VIVO.salas = null; VIVO.pres.clear();
      const [lib, cap] = lc.split("."); if (R.lib !== lib || R.cap !== +cap) A.irA("#/" + lib + "/" + cap);
    } finally { if (boton) boton.disabled = false; }
  }
  function tarjetaSalasAbiertas() {
    const zona = h("div", { class: "jg-salas" }, h("p", { class: "jg-mini", text: "Buscando salas abiertas…" }));
    const pintar = (L) => {
      if (!zona.isConnected && zona.dataset.ok) return;
      zona.dataset.ok = "1";
      if (!L.length) return zona.replaceChildren(h("p", { class: "jg-mini", text: "Ahora no hay salas abiertas. Crea una y aparecerá aquí para que cualquiera pueda acompañarte." }));
      zona.replaceChildren(h("ul", { class: "jg-salas-l" }, L.map((x) => { const [l, c] = embDe(x.emb);
        return h("li", { class: x.c === SL.cod ? "yo" : "" }, emblema(l, c, 0), h("span", { class: "n" }, h("b", { text: nombreLC(x.lc) }), h("small", { text: "Sala de " + (x.anf || "un lector") + " · " + plural(x.n, "persona", "personas") })),
          x.c === SL.cod ? h("button", { class: "btn chico", type: "button", onclick: abrirSala }, h("span", { text: "Abrir" }))
            : h("button", { class: "btn chico oro", type: "button", onclick: (e) => { e.currentTarget.disabled = true; entrarSala(x.c); A.avisar("Entraste a la sala " + x.c); if (x.lc) A.irA("#/" + x.lc.replace(".", "/")); else repintar(); } }, h("span", { text: "Entrar" }))); })));
    };
    salasAbiertas(true).then(pintar);
    return tarjeta("Salas abiertas", ico("sala"), h("p", { class: "jg-mini", text: "Salas de lectura que cualquiera puede ver y en las que puedes entrar sin enlace. Se actualiza cada 30 s." }), zona);
  }
  // Mundo: las luces de los 27 libros (quién lee ahora) y los lectores con «Acompañar»
  function tarjetaQuienLee() {
    const zona = h("div", { class: "jg-quien" }, h("p", { class: "jg-mini", text: "Mirando quién lee ahora…" }));
    const ver = async (lib) => {
      const r = await presentes(lib || ""); if (r.error) return zona.replaceChildren(h("p", { class: "jg-mini", text: mensaje(r) }));
      const libros = (S.cfg && S.cfg.orden) || Object.keys(r.libros || {}), max = Math.max(1, ...Object.values(r.libros || { x: 1 }));
      const mapa = h("div", { class: "jg-luces", role: "list" }, (libros.length ? libros : Object.keys(r.libros)).map((b) => { const n = (r.libros || {})[b] || 0;
        return h("button", { class: "jg-lz" + (n ? " on" : "") + (b === lib ? " sel" : ""), type: "button", role: "listitem", style: "--k:" + (n ? (0.35 + 0.65 * n / max).toFixed(2) : 0), "aria-label": nombreLibro(b) + ": " + plural(n, "persona", "personas"), title: nombreLibro(b), onclick: () => ver(b === lib ? "" : b) },
          h("span", { text: corto(b) }), n ? h("b", { text: String(n) }) : null); }));
      const caps = Object.entries(r.caps || {}).sort((a, b) => b[1] - a[1]).slice(0, 12);
      const filas = caps.map(([lc, n]) => h("li", {}, h("span", { class: "n" }, h("b", { text: nombreLC(lc) }), h("small", { text: plural(n, "persona lee", "personas leen") + ((r.salas || {})[lc] ? " · sala abierta" : "") })),
        h("button", { class: "btn chico oro", type: "button", onclick: (e) => acompanar(lc, e.currentTarget) }, h("span", { text: "Acompañar" }))));
      const quien = (r.lectores || []).slice(0, 12).map((x) => { const [l, c] = embDe(x.e); return h("li", {}, emblema(l, c, x.m, x.f), h("span", { class: "n" }, h("b", { text: x.a || "Lector" }), h("small", { text: "nivel " + x.nv + " · " + nombreLC(x.l) })),
        h("button", { class: "btn chico", type: "button", onclick: (e) => acompanar(x.l, e.currentTarget) }, h("span", { text: "Acompañar" }))); });
      zona.replaceChildren(h("p", { class: "jg-total" }, cifra(r.total || 0), " " + (r.total === 1 ? "persona lee" : "personas leen") + " ahora" + (lib ? " · " + nombreLibro(lib) : "")), mapa,
        filas.length ? h("ul", { class: "jg-salas-l" }, filas) : h("p", { class: "jg-mini", text: lib ? "Nadie lee " + nombreLibro(lib) + " en este momento." : "Cuando alguien lea, su libro se encenderá aquí." }),
        quien.length ? h("details", { class: "jg-pc" }, h("summary", {}, h("span", { text: "Quiénes leen" }), h("small", { text: plural(quien.length, "lector", "lectores") })), h("ul", { class: "jg-salas-l quien" }, quien)) : null);
      animarCifras(zona);
    };
    ver("");
    return tarjeta("Quién está leyendo", ico("mundo"), h("p", { class: "jg-mini", text: "Cada libro brilla según cuántas personas lo leen ahora. Toca uno para ver sus capítulos, y «Acompañar» para leer con quien está ahí (entras a su sala o abres una nueva)." }), zona);
  }
  function tarjetaSala() {
    const cod = h("input", { type: "text", maxlength: "8", autocapitalize: "characters", placeholder: "Código de sala (6)", "aria-label": "Código de la sala", spellcheck: "false" });
    const pista = h("p", { class: "jg-pista", role: "status" });
    const ab = h("input", { type: "checkbox", checked: true });
    const crear = async (e) => { const bt = e.currentTarget; bt.disabled = true; const r = await pedir("/sala/crear", { metodo: "POST", cuerpo: { abierta: ab.checked, lc: R.lib ? R.lib + "." + R.cap : ultimoLC() } }); bt.disabled = false;
      if (r.error) { pista.textContent = mensaje(r); pista.className = "jg-pista mal"; return; } SL.pub = r.abierta !== false; entrarSala(r.cod); A.avisar("Sala " + r.cod + (r.abierta !== false ? " abierta: aparece en la lista y puedes invitar a quien quieras" : " creada: entra quien tenga su enlace")); repintar(); };
    if (SL.cod) return tarjeta("Leer en compañía", ico("sala"), h("p", {}, "Estás en la sala ", h("b", { text: SL.cod }), " con " + plural(SL.miembros.length, "persona", "personas") + "."),
      h("div", { class: "jg-acciones" }, h("button", { class: "btn oro", type: "button", onclick: abrirSala }, ico("sala"), h("span", { text: "Abrir la sala" }))));
    return tarjeta("Leer en compañía", ico("sala"), h("p", { text: "Crea una sala y comparte su enlace: verán dónde lee cada quien, en vivo, y mientras lean el mismo capítulo cada verso da un 25 % más de experiencia." }),
      h("label", { class: "jg-check" }, ab, h("span", { text: "Sala abierta (aparece en la lista de salas y cualquiera puede entrar)" })),
      h("div", { class: "jg-acciones" }, h("button", { class: "btn oro", type: "button", onclick: crear }, ico("sala"), h("span", { text: "Crear una sala" }))),
      h("div", { class: "jg-form" }, cod, h("button", { class: "btn", type: "button", onclick: async () => { const c = cod.value.trim().toUpperCase(); const i = await pedir("/sala/info?c=" + encodeURIComponent(c), { sin: true });
        if (i.error) { pista.textContent = "Esa sala no existe o ya venció."; pista.className = "jg-pista mal"; return; } entrarSala(c); repintar(); } }, h("span", { text: "Entrar" }))), pista);
  }
  async function pintarSalaRuta(cont, cod) {
    cod = String(cod || "").toUpperCase();
    document.title = "Sala de lectura · Escudriña · BiEx";
    const zona = h("div", { class: "jg" }, h("p", { class: "cargando", text: "Entrando a la sala…" }));
    marco(cont, cabSub("Lectura en compañía", "Lean juntos, en vivo: cada quien ve dónde lee el resto."), zona);
    const i = await pedir("/sala/info?c=" + encodeURIComponent(cod), { sin: true });
    if (cont !== S.cont || !zona.isConnected) return;
    if (i.error) return zona.replaceChildren(tarjeta(null, null, h("p", { text: "Esa sala no existe o ya venció (duran 7 días). Puedes crear una nueva desde tu panel." }), h("a", { class: "btn", href: "#/escudrina" }, h("span", { text: "Ir a mi panel" }))));
    entrarSala(cod); A.store.set("jg:salaInv", null);
    zona.replaceChildren(h("section", { class: "jg-tarjeta jg-heroe" }, h("p", { class: "jg-tit", text: "Sala " + cod }), h("p", { class: "jg-mini", text: "La creó " + i.anf + " · " + plural(i.n, "persona", "personas") + " ahora" }),
      h("div", { class: "jg-acciones" }, h("button", { class: "btn oro", type: "button", onclick: () => { const a = SL.miembros.find((x) => x.anf); if (a && a.lc) { const [l, c] = a.lc.split("."); A.irA("#/" + l + "/" + c + "/l" + (a.v ? "/" + a.v : "")); } else A.irA("#/MAT/1"); } }, h("span", { text: "Ir a leer con " + i.anf })),
        h("button", { class: "btn", type: "button", onclick: abrirSala }, ico("sala"), h("span", { text: "Ver la sala" })))));
    animarCifras(zona);
  }
  // al volver al lector con una sala abierta (en las últimas 12 h), se reconecta sola
  function retomarSala() { const s = A.store.get("jg:sala", null); if (s && s.c && Date.now() - (s.t || 0) < 12 * 3600e3 && !SL.cod && S.token) entrarSala(s.c); }

  // ------------------------------------------------------------------ interfaz pública del módulo
  window.BiExJuego = {
    iniciar(api) { A = api; if (!S.token) S.token = A.store.get("jg:t", null); if (!S.yo && S.token) S.yo = A.store.get("jg:yo", null); },
    vista, capitulo, salir, franja, guardarInvitacion,
  };
})();
