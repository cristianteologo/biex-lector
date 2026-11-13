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
    S.yo = yo; A.store.set("jg:yo", yo); R.ld = 0;
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
      (tiene ? '<ellipse cx="31.5" cy="12.4" rx="3" ry="1.05" transform="rotate(-32 31.5 12.4)" fill="#fff" opacity=".85"/>' : ""), "0 0 48 48");
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
    dracma: '<circle cx="12" cy="12" r="8.2" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="5" fill="none" stroke="currentColor" stroke-width="1.2" opacity=".7"/><circle cx="12" cy="12" r="1.7" fill="currentColor"/>', // moneda sin cruz (cuidado con el arte bíblico)
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
    // el mundo con dos paralelos y un meridiano (sin una cruz dentro del círculo)
    mundo: '<circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M5 8.4c4.4 1.4 9.6 1.4 14 0M5 15.6c4.4-1.4 9.6-1.4 14 0M12 3.5c2.5 2.4 3.6 5.3 3.6 8.5s-1.1 6.1-3.6 8.5c-2.5-2.4-3.6-5.3-3.6-8.5s1.1-6.1 3.6-8.5z" fill="none" stroke="currentColor" stroke-width="1.3"/>',
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
    // «Hoy»: la hoja del día (BiEx, 10-nov-2026: nada de soles con rayos)
    hoy: '<rect x="4" y="5.5" width="16" height="14.5" rx="2.2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M4 9.9h16M8.2 3.6v3.4M15.8 3.6v3.4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><circle cx="12" cy="14.9" r="2.3" fill="currentColor"/>',
    mas: '<rect x="4.5" y="4.5" width="6" height="6" rx="1.7" fill="none" stroke="currentColor" stroke-width="1.6"/><rect x="13.5" y="4.5" width="6" height="6" rx="1.7" fill="none" stroke="currentColor" stroke-width="1.6"/><rect x="4.5" y="13.5" width="6" height="6" rx="1.7" fill="none" stroke="currentColor" stroke-width="1.6"/><rect x="13.5" y="13.5" width="6" height="6" rx="1.7" fill="none" stroke="currentColor" stroke-width="1.6"/>',
    jugar: '<circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M10.2 8.4l5.6 3.6-5.6 3.6z" fill="currentColor"/>',
    sala: '<path d="M3.5 6.5c2.8-.9 5.6-.6 8.5 1.2 2.9-1.8 5.7-2.1 8.5-1.2v11.5c-2.8-.9-5.6-.6-8.5 1.2-2.9-1.8-5.7-2.1-8.5-1.2z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M12 7.7v11.5" fill="none" stroke="currentColor" stroke-width="1.3"/>',
  };
  const ico = (k) => A.svg(ICO_JG[k]);

  // ------------------------------------------------------------------ sonido (campanas breves sintetizadas; nunca en modo tranquilo)
  let AC = null;
  // BiEx (10-nov-2026): al pasar a otra aplicación sonaba la chispa de la última tanda (se envía al ocultarse la página):
  // con la página oculta no suena nada y el contexto de audio se suspende
  document.addEventListener("visibilitychange", () => { if (document.hidden && AC && AC.state === "running") AC.suspend().catch(() => {}); });
  function sonar(tipo) {
    if (!S.yo || S.yo.tranquilo || S.silencio || document.visibilityState !== "visible") return;
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
.jg-cifras{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
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
.jg-piedras{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px 6px}
@media (min-width:560px){.jg-piedras{grid-template-columns:repeat(6,minmax(0,1fr))}}
.jg-tarjeta>*{min-width:0}
.jg-lauro-p-t b{white-space:nowrap}
.jg-piedra span{overflow-wrap:anywhere;text-align:center}
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
.ap-arbol{position:relative;width:min(100%,70vh);margin:0 auto}
.ap-svg{display:block;width:100%;height:auto}
.ap-svg .ap-ramas path{stroke-opacity:.92}
.ap-svg .ap-aro{transition:stroke-dasharray .8s cubic-bezier(.2,.8,.2,1)}
.ap-vida{position:absolute;inset:0;pointer-events:none;overflow:hidden}
.ap-vida i{position:absolute;display:block;border-radius:50%;opacity:0;will-change:transform,opacity}
.ap-gl{width:calc(var(--s) * 1%);aspect-ratio:1;background:radial-gradient(circle,#fffbe9 0,rgba(255,229,150,.85) 18%,rgba(245,198,78,.28) 42%,rgba(245,198,78,0) 70%);animation:ap-gl var(--t) ease-in-out var(--d) infinite}
.ap-gl.fr{background:radial-gradient(circle,rgba(255,250,230,.9) 0,rgba(255,226,140,.45) 30%,rgba(245,198,78,0) 70%)}
.ap-mo{width:4px;height:4px;margin:-2px 0 0 -2px;background:#ffe7a0;box-shadow:0 0 6px 1px rgba(255,220,130,.55);animation:ap-mo var(--t) linear var(--d) infinite}
.ap-copa-v{left:7%;top:4.5%;width:86%;height:45%;background:radial-gradient(closest-side,rgba(255,224,138,.2),rgba(245,198,78,.07) 60%,rgba(245,198,78,0));animation:ap-respira 7s ease-in-out infinite}
@keyframes ap-respira{0%,100%{opacity:.35}50%{opacity:1}}
@keyframes ap-gl{0%,100%{opacity:0;transform:translate(-50%,-50%) scale(.35)}40%{opacity:1;transform:translate(-50%,-50%) scale(1)}62%{opacity:.7;transform:translate(-50%,-50%) scale(.85)}}
@keyframes ap-mo{0%{opacity:0;transform:translate3d(0,0,0)}15%{opacity:.85}100%{opacity:0;transform:translate3d(0,-90px,0)}}
.ap-arbol.quieto .ap-vida i{animation-play-state:paused}
.ap-datos{display:grid;gap:10px;padding:4px 16px 16px}
.ap-ap{display:flex;flex-wrap:wrap;align-items:baseline;justify-content:center;gap:4px 12px;margin:0;text-align:center}
.ap-ap b{font:500 1.5rem/1.15 var(--f-display);color:var(--tinta)}
.ap-ap span{font:500 .86rem/1.3 var(--f-ui);color:var(--oro)}
.ap-prog{text-align:center;margin:0}
.ap-cifras{list-style:none;margin:2px 0 0;padding:0;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}
.ap-cifras li{display:grid;justify-items:center;align-content:center;gap:3px;padding:9px 4px;border-radius:13px;border:1px solid var(--linea-2);background:linear-gradient(180deg,color-mix(in srgb,var(--tinta) 6%,transparent),color-mix(in srgb,var(--tinta) 1.5%,transparent));box-shadow:inset 0 1px 0 rgba(255,255,255,.06);text-align:center}
.ap-cifras b{font:600 1.05rem/1.1 var(--f-ui);color:var(--oro-vivo);font-variant-numeric:tabular-nums}
.ap-cifras small{font:400 .7rem/1.2 var(--f-ui);color:var(--tinta-2)}
.ap-foto{justify-content:center}
.ap-cab{display:flex;justify-content:space-between;align-items:center;gap:12px}
.ap-pts{font:500 .88rem/1.2 var(--f-ui);color:var(--tinta)}
.ap-pts b{font-size:1.2rem;color:var(--oro-vivo);margin-right:2px}
.ap-poder{display:inline-flex;align-items:baseline;gap:5px;padding:5px 11px;border-radius:999px;border:1px solid color-mix(in srgb,var(--oro) 35%,transparent);background:color-mix(in srgb,var(--oro) 9%,transparent);font:500 .78rem/1 var(--f-ui);color:var(--tinta-2)}
.ap-poder b{color:var(--oro-vivo);font-size:1rem}
.ap-atr,.ap-piezas,.ap-uso,.ap-vitrina{list-style:none;margin:0;padding:0}
.ap-atr{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.ap-atr li{display:grid;justify-items:center;gap:7px;padding:10px 6px 9px;border-radius:16px;border:1px solid color-mix(in srgb,var(--ac) 26%,var(--linea-2));background:radial-gradient(120% 85% at 50% 0%,color-mix(in srgb,var(--ac) 15%,transparent),transparent 70%),linear-gradient(180deg,color-mix(in srgb,var(--tinta) 4%,transparent),transparent);box-shadow:inset 0 1px 0 rgba(255,255,255,.07);transition:border-color .2s,box-shadow .2s}
.ap-atr li.sel{border-color:color-mix(in srgb,var(--ac) 72%,transparent);box-shadow:0 0 0 3px color-mix(in srgb,var(--ac) 14%,transparent),inset 0 1px 0 rgba(255,255,255,.1)}
.ap-atr li.sube .ap-val{text-shadow:0 0 12px color-mix(in srgb,var(--ac) 70%,transparent)}
.ap-cara{all:unset;box-sizing:border-box;display:grid;justify-items:center;gap:4px;width:100%;cursor:pointer;text-align:center;border-radius:12px}
.ap-cara:focus-visible{outline:2px solid var(--oro-vivo);outline-offset:3px}
.ap-ico{display:grid;place-items:center;width:34px;height:34px;border-radius:50%;color:var(--ac);background:radial-gradient(circle at 50% 35%,color-mix(in srgb,var(--ac) 26%,transparent),color-mix(in srgb,var(--ac) 8%,transparent));box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--ac) 40%,transparent),0 0 14px -4px color-mix(in srgb,var(--ac) 60%,transparent)}
.ap-ico svg{width:19px;height:19px}
.ap-nom{display:grid;place-items:center;min-height:2.3em;font:600 .74rem/1.15 var(--f-ui);letter-spacing:.01em;color:var(--tinta)}
.ap-v{display:flex;align-items:baseline;justify-content:center;gap:3px;min-height:1.4rem}
.ap-val{font:600 1.3rem/1 var(--f-ui);color:var(--ac);font-variant-numeric:tabular-nums;transition:text-shadow .2s}
.ap-plan{font:600 .7rem/1 var(--f-ui);color:var(--oro-vivo)}
.ap-bs{display:flex;gap:8px}
.ap-b{width:30px;height:30px;border-radius:50%;border:1px solid color-mix(in srgb,var(--ac) 42%,transparent);background:linear-gradient(180deg,color-mix(in srgb,var(--tinta) 9%,transparent),color-mix(in srgb,var(--tinta) 2%,transparent));box-shadow:inset 0 1px 0 rgba(255,255,255,.1);color:var(--tinta);font:500 1.05rem/1 var(--f-ui);cursor:pointer;display:grid;place-items:center;padding:0}
.ap-b:active{transform:scale(.9)}
.ap-desc{margin:0;min-height:2.9em;font:400 .84rem/1.45 var(--f-ui)!important;color:var(--tinta-2)}
.ap-desc b{color:var(--oro-vivo);font-weight:600}
.ap-arm{display:grid;grid-template-columns:minmax(112px,40%) minmax(0,1fr);gap:10px;align-items:center}
.ap-fig{display:grid;place-items:center;padding:4px;border-radius:16px;background:radial-gradient(circle at 50% 40%,rgba(245,198,78,.12),transparent 70%)}
.av-fig{display:block;width:100%;max-width:210px;height:auto;margin:0 auto}
.ap-piezas{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}
.ap-piezas li{position:relative;display:grid}
.ap-pz{all:unset;box-sizing:border-box;display:grid;gap:6px;align-content:center;min-height:54px;padding:9px 10px;border-radius:13px;cursor:pointer;border:1px solid var(--linea-2);background:linear-gradient(180deg,color-mix(in srgb,var(--tinta) 6.5%,transparent),color-mix(in srgb,var(--tinta) 1.5%,transparent));box-shadow:inset 0 1px 0 rgba(255,255,255,.07);transition:border-color .2s,box-shadow .2s}
.ap-pz:focus-visible{outline:2px solid var(--oro-vivo);outline-offset:2px}
.ap-piezas li.sel .ap-pz{border-color:color-mix(in srgb,var(--oro-vivo) 62%,transparent);box-shadow:0 0 0 3px color-mix(in srgb,var(--oro) 13%,transparent),inset 0 1px 0 rgba(255,255,255,.1)}
.ap-piezas li.lista::after{content:"";position:absolute;top:8px;right:9px;width:6px;height:6px;border-radius:50%;background:var(--oro-vivo);box-shadow:0 0 0 3px color-mix(in srgb,var(--oro-vivo) 22%,transparent),0 0 8px var(--oro-vivo);pointer-events:none}
.ap-pz-n{font:600 .8rem/1.1 var(--f-ui);color:var(--tinta)}
.ap-pips{display:flex;gap:4px}
.ap-pips i{width:8px;height:8px;border-radius:50%;border:1px solid color-mix(in srgb,var(--tinta) 24%,transparent);box-sizing:border-box}
.ap-pips i.on{background:var(--gc);border-color:var(--gc);box-shadow:0 0 6px -1px var(--gc)}
.ap-forja{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;padding:10px 12px;border-radius:14px;border:1px solid color-mix(in srgb,var(--oro) 26%,var(--linea-2));background:linear-gradient(110deg,color-mix(in srgb,var(--oro) 9%,transparent),transparent 70%)}
.ap-forja .btn svg{width:15px;height:15px}
.ap-n{display:grid;gap:2px;min-width:0}
.ap-n b{font:600 .86rem/1.25 var(--f-ui);color:var(--tinta)}
.ap-n small{font:400 .76rem/1.35 var(--f-ui);color:var(--tinta-2)}
.jg-tarjeta .ap-nota{margin:0;font:400 .72rem/1.45 var(--f-ui);color:var(--tenue);text-align:center}
.ap-tienda-cab{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center}
.ap-saldo{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:999px;border:1px solid color-mix(in srgb,var(--oro) 42%,transparent);background:linear-gradient(180deg,color-mix(in srgb,var(--oro) 16%,transparent),color-mix(in srgb,var(--oro) 6%,transparent));box-shadow:inset 0 1px 0 rgba(255,240,200,.18);font:500 .78rem/1 var(--f-ui);color:var(--tinta-2);white-space:nowrap}
.ap-saldo b{font:600 1.02rem/1 var(--f-ui);color:var(--oro-vivo);font-variant-numeric:tabular-nums}
.ap-saldo svg{width:16px;height:16px;color:var(--oro-vivo)}
.ap-uso{display:grid;gap:6px}
.ap-uso li{display:grid;grid-template-columns:30px minmax(0,1fr) auto;gap:10px;align-items:center;padding:8px 10px;border-radius:13px;border:1px solid var(--linea-2);background:linear-gradient(180deg,color-mix(in srgb,var(--tinta) 4.5%,transparent),transparent)}
.ap-ui{display:grid;place-items:center;width:30px;height:30px;border-radius:9px;color:var(--oro-vivo);background:color-mix(in srgb,var(--oro) 12%,transparent);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--oro) 28%,transparent)}
.ap-ui svg{width:18px;height:18px}
.ap-uso .ap-n b{font-size:.84rem}
.ap-uso .ap-n small{font-size:.72rem;color:var(--tenue)}
.ap-vitrina{display:flex;flex-wrap:wrap;justify-content:center;gap:8px}
.ap-vitrina li{flex:0 0 calc((100% - 16px) / 3);box-sizing:border-box;display:grid;grid-template-rows:auto 1fr auto;justify-items:center;gap:6px;padding:10px 6px 9px;border-radius:14px;border:1px solid var(--linea-2);background:radial-gradient(110% 70% at 50% 0%,color-mix(in srgb,var(--oro) 8%,transparent),transparent 70%),linear-gradient(180deg,color-mix(in srgb,var(--tinta) 4.5%,transparent),transparent);text-align:center}
.ap-vitrina li.puesto{border-color:color-mix(in srgb,var(--oro-vivo) 62%,transparent);box-shadow:0 0 0 3px color-mix(in srgb,var(--oro) 13%,transparent)}
.ap-mu{display:grid;place-items:center;width:46px;height:46px}
.ap-mu svg{width:46px;height:46px}
.ap-mn{display:grid;place-items:center;font:500 .72rem/1.2 var(--f-ui);color:var(--tinta)}
.ap-vitrina .btn.chico{min-height:30px;padding:4px 12px;font-size:.76rem}
.ap-verfoto img{display:block;width:min(256px,70vw);height:auto;aspect-ratio:1;border-radius:50%;margin:6px auto 12px;border:2px solid var(--oro);object-fit:cover}
.emb-foto{cursor:pointer}
@media (min-width:700px){.ap-atr{grid-template-columns:repeat(6,minmax(0,1fr))}.ap-vitrina li{flex-basis:calc((100% - 24px) / 4)}}
@media (max-width:359px){.ap-arm{grid-template-columns:1fr}.ap-fig{max-width:180px;margin:0 auto}}
@media (prefers-reduced-motion:reduce){.ap-vida{display:none}}
html[data-mov="no"] .ap-vida{display:none}
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
.jg-coleccion.plegable{display:block;padding:0;margin:4px 0 0}
.jg-coleccion.plegable summary{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:12px;align-items:center;padding:10px 14px;cursor:pointer;list-style:none}
.jg-coleccion.plegable summary::-webkit-details-marker{display:none}
.jg-coleccion.plegable summary>span:nth-child(2){display:grid;gap:2px}
.jg-coleccion.plegable summary b{font:600 .9rem/1.2 var(--f-ui);color:var(--oro-vivo)}
.jg-coleccion.plegable summary small{font:400 .76rem/1.3 var(--f-ui);color:var(--tinta-2)}
.jg-col-v{width:9px;height:9px;border-right:1.6px solid var(--oro-vivo);border-bottom:1.6px solid var(--oro-vivo);transform:rotate(45deg) translate(-2px,-2px);transition:transform .25s}
.jg-coleccion.plegable[open] .jg-col-v{transform:rotate(-135deg) translate(-2px,-2px)}
.jg-coleccion.plegable p{padding:0 14px 12px;font-size:.84rem}
.jg-salas-l{list-style:none;margin:8px 0 0;padding:0;display:grid;gap:8px}
.jg-salas-l li{display:grid;grid-template-columns:auto 1fr auto;gap:12px;align-items:center;padding:10px 12px;border:1px solid var(--linea);border-radius:14px;background:color-mix(in srgb,var(--hoja-2) 70%,transparent)}
.jg-salas-l li.yo{border-color:color-mix(in srgb,var(--oro) 60%,transparent);box-shadow:0 0 0 3px color-mix(in srgb,var(--oro) 12%,transparent)}
.jg-salas-l li>svg,.jg-salas-l li>.emb{width:38px;height:38px}
.jg-salas-l .n{display:grid;gap:2px;min-width:0}
.jg-salas-l .n b{font:600 .95rem/1.25 var(--f-ui);color:var(--tinta);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.jg-salas-l .n small{font:400 .78rem/1.3 var(--f-ui);color:var(--tinta-2)}
.jg-salas-l:not(.quien) li:not(:has(svg)){grid-template-columns:1fr auto}
.jg-luces{display:grid;grid-template-columns:repeat(auto-fill,minmax(92px,1fr));gap:6px;margin:12px 0}
.jg-lz{position:relative;display:grid;place-items:center;min-height:48px;border-radius:12px;border:1px solid var(--linea);background:var(--hoja-2);color:var(--tenue);font:500 .74rem/1.15 var(--f-ui);letter-spacing:.01em;cursor:pointer;overflow:hidden;padding:7px 16px 7px 8px;text-align:center;overflow-wrap:anywhere}
.jg-lz.on{color:var(--oro-vivo);border-color:color-mix(in srgb,var(--oro) calc(var(--k) * 70%),transparent);background:radial-gradient(circle at 50% 60%,color-mix(in srgb,var(--oro) calc(var(--k) * 42%),transparent),var(--hoja-2) 75%);box-shadow:0 0 calc(var(--k) * 16px) -4px color-mix(in srgb,var(--oro) 80%,transparent)}
.jg-lz.on::after{content:"";position:absolute;inset:0;border-radius:inherit;box-shadow:inset 0 0 12px color-mix(in srgb,var(--oro) calc(var(--k) * 40%),transparent);animation:jg-latido 2.6s ease-in-out infinite;opacity:.8}
.jg-lz.sel{outline:2px solid var(--oro);outline-offset:1px}
.jg-lz b{position:absolute;right:4px;top:3px;font:700 .62rem/1 var(--f-ui);color:var(--sobre-oro,#16120b);background:var(--oro-vivo);border-radius:999px;padding:2px 5px}
@keyframes jg-latido{0%,100%{opacity:.45}50%{opacity:1}}
.jg-pres{display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px}
.jg-pres .btn{margin-left:auto}
@media (prefers-reduced-motion:reduce){.jg-lz.on::after{animation:none}}
.jg-chispas{position:fixed;inset:0;pointer-events:none;z-index:62;contain:strict}
.jg-ch{position:absolute;display:block;will-change:transform,opacity;--c:#f5c64e}
.jg-ch.p{width:2px;height:2px;margin:-1px 0 0 -1px;border-radius:50%;background:#fff8dc;box-shadow:0 0 0 1px color-mix(in srgb,var(--c) 45%,transparent)}
.jg-ch.p.g{width:3px;height:3px;margin:-1.5px 0 0 -1.5px;background:#fffdf2}
.jg-ch.s{width:1.5px;height:13px;margin:-6.5px 0 0 -.75px;border-radius:1px;background:linear-gradient(180deg,rgba(255,250,230,0),#fff6d8 55%,var(--c))}
.jg-ch.r{width:5px;height:5px;margin:-2.5px 0 0 -2.5px;background:linear-gradient(135deg,#fff 0 18%,var(--c) 45%,color-mix(in srgb,var(--c) 60%,#000));clip-path:polygon(50% 0,100% 50%,50% 100%,0 50%)}
.jg-ch.b{width:2.5px;height:2.5px;margin:-1.25px 0 0 -1.25px;border-radius:50%;background:#ffd28a;box-shadow:0 0 0 1px rgba(255,140,60,.35)}
.jg-ch.f{width:46px;height:1px;margin:-.5px 0 0 -23px;background:linear-gradient(90deg,rgba(255,250,230,0),#fffaf0,rgba(255,250,230,0))}
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
/* Control segmentado simétrico (BiEx, 10-nov-2026: «feamente distribuidas las categorías»): pista de vidrio en 6 columnas;
   2, 3 o 6 opciones por fila según cuántas haya (5 → 3 + 2, 4 → 2 + 2), nunca una sola huérfana; «.fila» las pone todas en fila. */
.jg-seg{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:4px;padding:4px;border-radius:16px;border:1px solid color-mix(in srgb,var(--tinta) 10%,transparent);background:linear-gradient(180deg,color-mix(in srgb,var(--tinta) 5%,transparent),color-mix(in srgb,var(--tinta) 1.5%,transparent));box-shadow:inset 0 1px 2px rgba(0,0,0,.25)}
.jg-seg button{grid-column:span 2;min-width:0;min-height:36px;padding:7px 6px;border-radius:12px;border:1px solid transparent;background:none;font:500 .8rem/1.15 var(--f-ui);color:var(--tinta-2);text-align:center;cursor:pointer;overflow-wrap:anywhere;transition:background .2s,color .2s,border-color .2s}
.jg-seg button:first-child:nth-last-child(2),.jg-seg button:first-child:nth-last-child(2)~button,.jg-seg button:first-child:nth-last-child(4),.jg-seg button:first-child:nth-last-child(4)~button,.jg-seg button:first-child:nth-last-child(5)~button:nth-child(n+4){grid-column:span 3}
.jg-seg button:first-child:nth-last-child(n+7),.jg-seg button:first-child:nth-last-child(n+7)~button{grid-column:span 2}
.jg-seg.fila{grid-template-columns:none;grid-auto-flow:column;grid-auto-columns:minmax(0,1fr)}
.jg-seg.fila button{grid-column:auto}
.jg-seg button[aria-pressed=true]{color:var(--oro-vivo);font-weight:600;border-color:color-mix(in srgb,var(--oro-vivo) 52%,transparent);background:linear-gradient(180deg,rgba(255,255,255,.12),rgba(255,255,255,0) 55%),linear-gradient(180deg,color-mix(in srgb,var(--oro) 32%,transparent),color-mix(in srgb,var(--oro) 12%,transparent));box-shadow:inset 0 1px 0 rgba(255,244,210,.3),0 8px 18px -12px color-mix(in srgb,var(--oro) 80%,transparent)}
.jg-seg+.jg-seg{margin-top:-2px}
@media (min-width:640px){.jg-seg{display:flex}.jg-seg button{flex:1 1 0}}
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
.jg-novedades{list-style:none;margin:0;padding:0;display:grid;gap:12px;font:400 .88rem/1.45 var(--f-ui);color:var(--tinta-2)}
.jg-novedades li{position:relative;display:grid;gap:3px;padding-left:16px}
.jg-novedades li::before{content:"";position:absolute;left:1px;top:.42em;width:6px;height:6px;border-radius:50%;background:radial-gradient(circle at 35% 35%,var(--oro-vivo),var(--oro) 70%);box-shadow:0 0 8px color-mix(in srgb,var(--oro) 55%,transparent)}
.jg-novedades li:has(.jg-nov-t)::before{top:.3em}
.jg-nov-t{font:500 .7rem/1.25 var(--f-ui);letter-spacing:.07em;color:var(--oro);font-variant-numeric:lining-nums tabular-nums}
.jg-nov-x{min-width:0;overflow-wrap:anywhere}
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
/* V24 (BiEx, 12-nov-2026): la prueba y los cofres en vidrio. La ventana no lleva backdrop-filter (K15): el vidrio se hace
   con capas translúcidas, un filo de luz en el borde (más vivo arriba a la izquierda), brillo especular y un fondo vivo
   detrás (tres luces que se desplazan despacio; solo transform). */
.jg-qz{--vd-f1:rgba(255,250,235,.105);--vd-f2:rgba(255,250,235,.03);--vd-br:rgba(255,244,214,.13);--vd-in:rgba(255,250,235,.24);--vd-so:rgba(0,0,0,.8);--vd-filo:rgba(255,238,196,.62);--vd-esp:rgba(255,255,255,.075);
  position:relative;isolation:isolate;display:grid;gap:14px;padding:2px 0 8px}
html[data-theme="light"] .jg-qz{--vd-f1:rgba(255,255,255,.86);--vd-f2:rgba(255,255,255,.52);--vd-br:rgba(124,94,34,.2);--vd-in:#fff;--vd-so:rgba(80,60,20,.22);--vd-filo:rgba(255,255,255,1);--vd-esp:rgba(255,255,255,.5)}
.jg-qz-fondo{position:absolute;inset:-18px -14px;z-index:-1;overflow:hidden;border-radius:24px;pointer-events:none}
.jg-qz-fondo i{position:absolute;width:70%;aspect-ratio:1;border-radius:50%;will-change:transform;background:radial-gradient(closest-side,color-mix(in srgb,var(--oro) 30%,transparent),transparent)}
.jg-qz-fondo i:nth-child(1){left:-22%;top:-4%;animation:jg-qz-a 27s ease-in-out infinite alternate}
.jg-qz-fondo i:nth-child(2){right:-26%;top:36%;width:82%;background:radial-gradient(closest-side,rgba(126,156,232,.15),transparent);animation:jg-qz-b 33s ease-in-out infinite alternate}
.jg-qz-fondo i:nth-child(3){left:6%;bottom:-14%;width:78%;background:radial-gradient(closest-side,color-mix(in srgb,var(--oro-vivo) 20%,transparent),transparent);animation:jg-qz-c 24s ease-in-out infinite alternate}
html[data-theme="light"] .jg-qz-fondo i{opacity:.75}
@keyframes jg-qz-a{to{transform:translate3d(26%,20%,0) scale(1.14)}}
@keyframes jg-qz-b{to{transform:translate3d(-20%,-16%,0) scale(.9)}}
@keyframes jg-qz-c{to{transform:translate3d(16%,-24%,0) scale(1.1)}}
html[data-mov="no"] .jg-qz-fondo i,html[data-mov="no"] .jg-qz .jg-preg{animation:none}
@media (prefers-reduced-motion:reduce){.jg-qz-fondo i,.jg-qz .jg-preg{animation:none}}
.jg-vid{position:relative;border-radius:18px;background:linear-gradient(155deg,var(--vd-f1),var(--vd-f2) 46%,var(--vd-f1));border:1px solid var(--vd-br);
  box-shadow:inset 0 1px 0 var(--vd-in),inset 0 -1px 0 rgba(0,0,0,.22),0 16px 36px -22px var(--vd-so)}
.jg-vid::before{content:"";position:absolute;inset:-1px;border-radius:inherit;padding:1px;pointer-events:none;
  background:linear-gradient(135deg,var(--vd-filo),transparent 30%,transparent 64%,color-mix(in srgb,var(--oro) 34%,transparent));
  -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask:linear-gradient(#000 0 0) content-box exclude,linear-gradient(#000 0 0)}
.jg-vid::after{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;background:linear-gradient(118deg,var(--vd-esp),transparent 26%)}
.jg-qz-intro{margin:0;font:400 .9rem/1.5 var(--f-ui);color:var(--tinta-2)}
.jg-qz .jg-preg{gap:12px;padding:14px 14px 16px;border-bottom:0;animation:jg-qz-entra .55s cubic-bezier(.2,.7,.2,1) both;animation-delay:calc(var(--i,0) * 90ms)}
.jg-qz.res .jg-preg{animation:none}
@keyframes jg-qz-entra{from{opacity:0;transform:translate3d(0,14px,0)}to{opacity:1;transform:none}}
.jg-preg-cab{position:relative;z-index:1;display:flex;align-items:center;justify-content:space-between;gap:10px}
.jg-qz .jg-preg .ref{display:inline-block;padding:6px 11px;border-radius:999px;letter-spacing:.1em;font-size:.7rem;
  background:linear-gradient(180deg,color-mix(in srgb,var(--oro) 26%,transparent),color-mix(in srgb,var(--oro) 8%,transparent));border:1px solid color-mix(in srgb,var(--oro) 42%,transparent);box-shadow:inset 0 1px 0 rgba(255,246,214,.3)}
.jg-preg-cab .num{font:500 .7rem/1 var(--f-ui);letter-spacing:.1em;text-transform:uppercase;color:var(--tenue)}
.jg-preg.bien .jg-preg-cab .num{color:var(--oro-vivo)}
.jg-qz .jg-preg .t{position:relative;z-index:1;font:400 1.08rem/1.7 var(--f-texto)}
.jg-qz .jg-preg .t u{min-width:5em;padding:0 .35em;border-bottom:2px solid color-mix(in srgb,var(--oro) 80%,transparent);border-radius:6px 6px 0 0;
  background:linear-gradient(0deg,color-mix(in srgb,var(--oro) 20%,transparent),transparent 72%);box-shadow:0 6px 12px -8px color-mix(in srgb,var(--oro) 70%,transparent)}
.jg-qz .jg-preg .t u.lleno{animation:jg-qz-hueco .45s cubic-bezier(.3,1.5,.5,1)}
@keyframes jg-qz-hueco{from{transform:scale(.86);opacity:.4}to{transform:none;opacity:1}}
.jg-qz .jg-ops{position:relative;z-index:1;gap:9px}
.jg-qz .jg-op{position:relative;overflow:hidden;isolation:isolate;padding:13px 26px;min-height:48px;font:500 1rem/1.25 var(--f-texto);color:var(--tinta);border-radius:14px;
  background:linear-gradient(160deg,var(--vd-f1),var(--vd-f2));border:1px solid var(--vd-br);box-shadow:inset 0 1px 0 var(--vd-in),0 10px 22px -16px var(--vd-so);
  transition:transform .2s cubic-bezier(.3,1.4,.5,1),border-color .2s,box-shadow .25s,color .2s;-webkit-tap-highlight-color:transparent}
.jg-qz .jg-op>span{position:relative;z-index:1}
.jg-qz .jg-op::after{content:"";position:absolute;z-index:0;top:-50%;bottom:-50%;left:-45%;width:38%;transform:translate3d(0,0,0) rotate(18deg);background:linear-gradient(90deg,transparent,rgba(255,246,214,.32),transparent);opacity:0;pointer-events:none}
.jg-qz .jg-op:active{transform:scale(.965)}
.jg-qz .jg-op[aria-pressed=true]{color:var(--oro-vivo);border-color:color-mix(in srgb,var(--oro-vivo) 72%,transparent);
  background:linear-gradient(160deg,color-mix(in srgb,var(--oro) 30%,transparent),color-mix(in srgb,var(--oro) 9%,transparent));
  box-shadow:inset 0 1px 0 rgba(255,246,214,.45),0 0 0 1px color-mix(in srgb,var(--oro) 26%,transparent),0 0 24px -8px color-mix(in srgb,var(--oro) 70%,transparent)}
.jg-qz .jg-op[aria-pressed=true]::after{animation:jg-qz-barre .75s ease-out 1}
html[data-mov="no"] .jg-qz .jg-op[aria-pressed=true]::after,html[data-mov="no"] .jg-qz .jg-preg .t u.lleno{animation:none}
@keyframes jg-qz-barre{0%{opacity:1;transform:translate3d(0,0,0) rotate(18deg)}100%{opacity:0;transform:translate3d(430%,0,0) rotate(18deg)}}
.jg-qz .jg-op:disabled{cursor:default}
.jg-qz .jg-op.ok{color:var(--tinta);border-color:rgba(111,191,143,.85);background:linear-gradient(160deg,rgba(111,191,143,.3),rgba(111,191,143,.08));box-shadow:inset 0 1px 0 rgba(220,255,232,.35),0 0 22px -8px rgba(111,191,143,.75)}
.jg-qz .jg-op.mal{color:var(--tinta);border-color:rgba(217,120,95,.82);background:linear-gradient(160deg,rgba(217,120,95,.26),rgba(217,120,95,.07))}
.jg-qz .jg-op.ok::before,.jg-qz .jg-op.mal::before{content:"";position:absolute;z-index:1;right:10px;top:50%;pointer-events:none}
.jg-qz .jg-op.ok::before{width:11px;height:5.5px;margin-top:-5px;border:solid #8fe0ae;border-width:0 0 2.2px 2.2px;transform:rotate(-45deg)}
.jg-qz .jg-op.mal::before{width:12px;height:12px;margin-top:-6px;border-radius:50%;border:1.8px solid #f0a08a;background:linear-gradient(135deg,transparent 44%,#f0a08a 44% 58%,transparent 58%)}
html[data-theme="light"] .jg-qz .jg-op.ok::before{border-color:#1f7a45}
html[data-theme="light"] .jg-qz .jg-op.mal::before{border-color:#b0452c;background:linear-gradient(135deg,transparent 44%,#b0452c 44% 58%,transparent 58%)}
/* daltonismo: aciertos en azul y fallos en naranja (con sus marcas, que no dependen del color) */
html[data-dal] .jg-qz .jg-op.ok{border-color:#5aa9e6;background:linear-gradient(160deg,rgba(90,169,230,.3),rgba(90,169,230,.08));box-shadow:inset 0 1px 0 rgba(220,240,255,.35),0 0 22px -8px rgba(90,169,230,.7)}
html[data-dal] .jg-qz .jg-op.ok::before{border-color:#9fd0ff}
html[data-dal] .jg-qz .jg-op.mal{border-color:#e69f00;background:linear-gradient(160deg,rgba(230,159,0,.26),rgba(230,159,0,.07))}
html[data-dal] .jg-qz .jg-op.mal::before{border-color:#ffc75e;background:linear-gradient(135deg,transparent 44%,#ffc75e 44% 58%,transparent 58%)}
html[data-dal="mono"] .jg-qz .jg-op.ok{border-color:var(--tinta);background:linear-gradient(160deg,rgba(255,255,255,.2),rgba(255,255,255,.06));box-shadow:none}
html[data-dal="mono"] .jg-qz .jg-op.mal{border-color:var(--tenue);border-style:dashed;background:transparent}
html[data-dal="mono"] .jg-qz .jg-op.ok::before{border-color:var(--tinta)}
html[data-dal="mono"] .jg-qz .jg-op.mal::before{border-color:var(--tenue);background:linear-gradient(135deg,transparent 44%,var(--tenue) 44% 58%,transparent 58%)}
/* el verso completo (Textual de BiEx) bajo cada pregunta, en un vidrio cálido como de pergamino iluminado */
.jg-vc{position:relative;z-index:1;display:grid;gap:6px;margin-top:2px;padding:12px 14px 13px;border-radius:14px;
  background:linear-gradient(180deg,color-mix(in srgb,var(--oro) 11%,transparent),color-mix(in srgb,var(--oro) 3%,transparent));border:1px solid color-mix(in srgb,var(--oro) 30%,transparent);box-shadow:inset 0 1px 0 rgba(255,246,214,.18)}
.jg-vc-et{font:500 .66rem/1.2 var(--f-ui);letter-spacing:.12em;text-transform:uppercase;color:var(--oro)}
.jg-vc-t{margin:0;font:400 1rem/1.65 var(--f-texto);color:var(--tinta)}
/* resultado: medalla con anillo de luz */
.jg-qz-res{display:grid;justify-items:center;gap:10px;padding:20px 16px 18px;text-align:center}
.jg-qz-res>*{position:relative;z-index:1}
.jg-qz-med{position:relative;width:118px;height:118px;display:grid;place-items:center;align-content:center;gap:0;border-radius:50%;
  background:radial-gradient(circle at 50% 32%,color-mix(in srgb,var(--oro) 26%,transparent),transparent 66%);filter:drop-shadow(0 0 18px color-mix(in srgb,var(--oro) 40%,transparent))}
.jg-qz-med svg{position:absolute;inset:0;width:100%;height:100%}
.jg-qz-med b{font:600 2.7rem/1 var(--f-display);color:var(--oro-vivo);font-variant-numeric:lining-nums tabular-nums;text-shadow:0 0 22px color-mix(in srgb,var(--oro) 55%,transparent)}
.jg-qz-med small{font:500 .74rem/1 var(--f-ui);letter-spacing:.14em;text-transform:uppercase;color:var(--tenue);margin-top:3px}
.jg-qz-med.plena::after{content:"";position:absolute;inset:-10px;border-radius:50%;border:1px solid color-mix(in srgb,var(--oro-vivo) 55%,transparent);animation:jg-qz-onda 2.4s ease-out infinite}
@keyframes jg-qz-onda{0%{opacity:.9;transform:scale(.9)}100%{opacity:0;transform:scale(1.25)}}
html[data-mov="no"] .jg-qz-med.plena::after{animation:none;opacity:.5}
.jg-qz-xp{margin:0;font:500 1.1rem/1.3 var(--f-display);letter-spacing:.04em;color:var(--oro-vivo)}
.jg-qz-res .jg-mini{max-width:28em}
.jg-qz-ver.listo{box-shadow:0 0 0 1px color-mix(in srgb,var(--oro-vivo) 40%,transparent),0 0 30px -6px color-mix(in srgb,var(--oro) 70%,transparent)}
.jg-qz-ver.enviando span{opacity:.6}
/* el cofre, sobre un pedestal de vidrio con luz desde lo alto */
.cf-raiz{position:relative;isolation:isolate;width:100%;box-sizing:border-box;padding:16px 14px 18px;border-radius:20px;margin:4px 0 12px;
  background:radial-gradient(70% 55% at 50% 0%,color-mix(in srgb,var(--cf-c,var(--oro)) 22%,transparent),transparent 70%),linear-gradient(170deg,rgba(255,250,235,.08),rgba(255,250,235,.02));
  border:1px solid rgba(255,244,214,.14);box-shadow:inset 0 1px 0 rgba(255,250,235,.22),0 18px 40px -26px rgba(0,0,0,.9)}
html[data-theme="light"] .cf-raiz{background:radial-gradient(70% 55% at 50% 0%,color-mix(in srgb,var(--oro) 18%,transparent),transparent 70%),linear-gradient(170deg,rgba(255,255,255,.85),rgba(255,255,255,.5));border-color:rgba(124,94,34,.2);box-shadow:inset 0 1px 0 #fff,0 18px 40px -26px rgba(80,60,20,.3)}
.cf-raiz::before{content:"";position:absolute;z-index:-1;left:0;right:0;top:0;height:78%;pointer-events:none;border-radius:20px 20px 0 0;
  background:radial-gradient(38% 100% at 50% 0%,color-mix(in srgb,var(--oro-vivo) 24%,transparent),color-mix(in srgb,var(--oro) 7%,transparent) 55%,transparent 80%)}
.cf::after{content:"";position:absolute;z-index:-1;left:6%;right:6%;bottom:0;height:16%;border-radius:50%;pointer-events:none;background:radial-gradient(closest-side,color-mix(in srgb,var(--cf,var(--oro)) 40%,transparent),transparent)}
.cf-raiz .cf-info{padding:10px 18px 12px;border-radius:16px;background:linear-gradient(160deg,rgba(255,250,235,.09),rgba(255,250,235,.025));border:1px solid rgba(255,244,214,.14);box-shadow:inset 0 1px 0 rgba(255,250,235,.22)}
html[data-theme="light"] .cf-raiz .cf-info{background:rgba(255,255,255,.7);border-color:rgba(124,94,34,.2)}
.cf-abrir{box-shadow:0 0 0 1px color-mix(in srgb,var(--oro-vivo) 40%,transparent),0 0 28px -6px color-mix(in srgb,var(--oro) 75%,transparent)}
/* la invitación a la prueba en el capítulo, también en vidrio */
.jg-prueba{position:relative;background:linear-gradient(155deg,color-mix(in srgb,var(--oro) 16%,transparent),color-mix(in srgb,var(--oro) 4%,transparent) 50%,color-mix(in srgb,var(--oro) 10%,transparent));border-color:color-mix(in srgb,var(--oro) 40%,transparent);box-shadow:inset 0 1px 0 rgba(255,246,214,.25),0 16px 34px -24px rgba(0,0,0,.85)}

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
.jg-escalera-p{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:4px;margin-top:4px}
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
@media (min-width:720px){.jg-piedras{grid-template-columns:repeat(12,minmax(0,1fr))}.jg-dos{display:grid;grid-template-columns:1fr 1fr;gap:18px;align-items:start}}
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
.jg-enlace{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;align-items:center}
.jg-enlace code{grid-column:1/-1}
.jg-enlace .btn{min-width:0}
.jg-enlace code{flex:1 1 220px;min-width:0;overflow-wrap:anywhere;font:500 .98rem/1.3 var(--f-ui);padding:10px 12px;border-radius:10px;border:1px dashed color-mix(in srgb,var(--oro) 60%,transparent);color:var(--oro-vivo);background:color-mix(in srgb,var(--hoja-2) 70%,transparent)}
.jg-redes{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}
.jg-redes .btn{min-width:0;padding-left:8px;padding-right:8px;white-space:normal;text-align:center}
.jg-redes .btn svg,.jg-enlace .btn svg{width:16px;height:16px}
.jg-escalera{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px}
.jg-escalera li{display:grid;justify-items:center;gap:1px;padding:7px 4px;border-radius:10px;border:1px solid var(--linea-2);text-align:center;opacity:.62}
.jg-escalera li b{font:600 1.05rem/1.1 var(--f-ui);color:var(--tinta)}
.jg-escalera li span{font:500 .66rem/1.18 var(--f-ui);color:var(--tenue);overflow-wrap:anywhere;hyphens:auto}
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
.jg .btn{transition:transform .15s cubic-bezier(.3,1.4,.5,1),border-color .2s,background .2s,box-shadow .2s}
.jg .btn:active{transform:scale(.97)}
/* Botones de vidrio pulido y letra armoniosa (BiEx, 10-nov-2026: «los botones amarillos están horribles»). Vidrio sin
   backdrop-filter: sobre las tarjetas se ve igual y el navegador no tiene que volver a difuminar el fondo al desplazarse. */
.jg{--vid-b:color-mix(in srgb,var(--tinta) 14%,transparent);--vid-1:color-mix(in srgb,var(--tinta) 9%,transparent);--vid-2:color-mix(in srgb,var(--tinta) 2.5%,transparent)}
.jg .btn{min-height:40px;padding:9px 18px;border-radius:999px;font:500 .86rem/1.2 var(--f-ui);letter-spacing:.012em;text-transform:none;color:var(--tinta);border:1px solid var(--vid-b);background:linear-gradient(180deg,rgba(255,255,255,.07),rgba(255,255,255,0) 55%),linear-gradient(180deg,var(--vid-1),var(--vid-2));box-shadow:inset 0 1px 0 rgba(255,255,255,.1),inset 0 -1px 0 rgba(0,0,0,.2),0 10px 22px -16px rgba(0,0,0,.85)}
.jg .btn:hover{border-color:color-mix(in srgb,var(--oro-vivo) 48%,transparent);color:var(--tinta)}
.jg .btn.oro{color:var(--oro-vivo);font-weight:600;border-color:color-mix(in srgb,var(--oro-vivo) 55%,transparent);background:linear-gradient(180deg,rgba(255,255,255,.14),rgba(255,255,255,0) 52%),linear-gradient(180deg,color-mix(in srgb,var(--oro) 36%,transparent),color-mix(in srgb,var(--oro) 14%,transparent));box-shadow:inset 0 1px 0 rgba(255,244,210,.34),inset 0 -1px 0 rgba(60,40,8,.32),0 0 0 3px color-mix(in srgb,var(--oro) 7%,transparent),0 12px 26px -16px color-mix(in srgb,var(--oro) 85%,transparent)}
.jg .btn.oro:hover{color:var(--oro-vivo);border-color:var(--oro-vivo);background:linear-gradient(180deg,rgba(255,255,255,.18),rgba(255,255,255,0) 52%),linear-gradient(180deg,color-mix(in srgb,var(--oro) 46%,transparent),color-mix(in srgb,var(--oro) 20%,transparent))}
.jg .btn.chico{min-height:34px;padding:6px 13px;font-size:.8rem}
.jg .btn svg{width:16px;height:16px}
.jg .btn:disabled,.jg .btn[aria-disabled=true]{opacity:.45;box-shadow:none;cursor:default}
.jg .btn.oro .trad{color:inherit}
:where(.jg-tarjeta) p{font-family:var(--f-ui);font-size:.92rem}
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
.jg-yo .jg-barra.jg-epica{position:relative;height:16px;border-radius:99px;background:linear-gradient(180deg,rgba(0,0,0,.5),rgba(0,0,0,.15)),var(--hoja-3);box-shadow:inset 0 1px 3px rgba(0,0,0,.65),0 0 0 1px color-mix(in srgb,var(--oro) 38%,transparent),0 0 22px -8px color-mix(in srgb,var(--oro) 70%,transparent);overflow:hidden;isolation:isolate}
.jg-yo .jg-barra.jg-epica>i.jg-relleno{position:absolute;inset:0;display:block;border-radius:inherit;overflow:hidden;background:linear-gradient(180deg,rgba(255,255,255,.42),rgba(255,255,255,0) 48%,rgba(0,0,0,.12)),linear-gradient(90deg,#7a4a0a,var(--oro-2) 35%,var(--oro-vivo) 78%,#fff1bd);transform:translate3d(calc(var(--p) * 1% - 100%),0,0)}
.jg-yo .jg-barra.jg-epica>i.jg-relleno::after{width:28%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.55),transparent)}
.jg-epica .jg-borde{position:absolute;inset:0;z-index:2;pointer-events:none;transform:translate3d(calc(var(--p) * 1% - 100%),0,0)}
.jg-epica .jg-brasa{position:absolute;right:-7px;top:50%;width:16px;height:16px;margin-top:-8px;border-radius:50%;background:radial-gradient(circle,#fff 0 22%,#ffe39a 42%,rgba(245,198,78,0) 70%);animation:jg-brasa 1.7s ease-in-out infinite}
.jg-epica .jg-marcas{position:absolute;inset:0;z-index:1;pointer-events:none;background:repeating-linear-gradient(90deg,transparent 0 calc(10% - 1px),rgba(0,0,0,.32) calc(10% - 1px) 10%)}
.jg-epica.crece{box-shadow:inset 0 1px 3px rgba(0,0,0,.65),0 0 0 1px var(--oro),0 0 26px -4px color-mix(in srgb,var(--oro-vivo) 85%,transparent)}
.jg-epica.cerca .jg-brasa{animation-duration:1s}
@keyframes jg-brasa{0%,100%{opacity:.45}50%{opacity:1}}
.jg-mis-ir{display:block;color:inherit;text-decoration:none;border-radius:10px;margin:-4px -6px;padding:4px 6px}
.jg-mis-ir:hover,.jg-mis-ir:focus-visible{background:color-mix(in srgb,var(--oro) 9%,transparent);outline:none}
.jg-mis-ir .jg-mt::after{content:" ›";color:var(--oro)}
.jg-top1{display:block;color:var(--oro-vivo);font-size:.72rem;letter-spacing:.02em}
.jg-saltos{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0 10px}
.jg-salto{display:inline-flex;align-items:baseline;gap:5px;padding:5px 11px;border-radius:99px;border:1px solid var(--linea-2);background:color-mix(in srgb,var(--hoja) 88%,transparent);color:var(--tinta-2);font:500 .8rem/1.2 var(--f-ui);cursor:pointer}
.jg-salto small{color:var(--tenue);font-size:.7rem}
.jg-salto.mio{border-color:var(--oro);color:var(--oro-vivo)}
.jg-rg{scroll-margin-top:calc(var(--alto, 64px) + 10px);margin-top:14px}
.jg-rg-t{display:flex;align-items:baseline;justify-content:space-between;gap:10px;margin:0 0 6px;padding-bottom:5px;border-bottom:1px solid color-mix(in srgb,var(--oro) 30%,var(--linea-2));font:600 .82rem/1.2 var(--f-ui);letter-spacing:.14em;text-transform:uppercase;color:var(--oro)}
.jg-rg-t small{font:400 .72rem/1.2 var(--f-ui);letter-spacing:0;text-transform:none;color:var(--tenue)}
.jg-mi-fila{position:sticky;bottom:max(10px,env(safe-area-inset-bottom));z-index:3;display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:10px;width:100%;margin-top:14px;padding:9px 14px;border-radius:14px;border:1px solid var(--oro);background:color-mix(in srgb,var(--hoja) 94%,transparent);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);color:var(--tinta);font:inherit;text-align:left;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.35)}
.jg-mi-fila .p{font:600 1rem/1 var(--f-ui);color:var(--oro-vivo)}.jg-mi-fila .n{display:grid}.jg-mi-fila .n small{color:var(--tenue);font-size:.72rem}.jg-mi-fila .x{font:600 .9rem/1 var(--f-ui);font-variant-numeric:tabular-nums}
.jg-mi-fila.sin{display:block;text-align:center;cursor:default}
.ap-fig .fa-luz.on{animation:fa-luz 1.9s ease-in-out infinite}
@keyframes fa-luz{0%,100%{opacity:.35}50%{opacity:1}}
.ap-cita{display:inline-flex;align-items:center;gap:7px;padding:2px 10px 2px 7px;border-radius:99px;border:1px solid color-mix(in srgb,var(--oro) 45%,transparent);background:color-mix(in srgb,var(--oro) 9%,transparent);color:var(--oro-vivo);font:inherit;cursor:pointer}
.ap-cita:hover,.ap-cita:focus-visible{border-color:var(--oro);outline:none}
.ap-lumbre{position:relative;flex:none;width:7px;height:7px;border-radius:50%;background:radial-gradient(circle,#fff6d6 0 30%,#f5c64e 62%,rgba(245,198,78,.2) 100%)}
.ap-lumbre::after{content:"";position:absolute;inset:-6px;border-radius:50%;background:radial-gradient(circle,rgba(245,198,78,.55),rgba(245,198,78,0) 70%);animation:jg-brasa 2.4s ease-in-out infinite}
.jg-cita-v p{margin:0 0 .6em;line-height:1.6}.jg-cita-v sup{color:var(--oro);font-size:.7em;margin-right:2px}
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
@media (min-width:720px){.jg-atajos{grid-template-columns:repeat(4,minmax(0,1fr))}}
/* menú del juego: cinco secciones siempre a la mano */
.jg-muelle{position:fixed;z-index:62;left:50%;bottom:calc(10px + env(safe-area-inset-bottom,0px));transform:translate3d(-50%,0,0);width:min(calc(100vw - 20px),440px);box-sizing:border-box;display:grid;grid-template-columns:repeat(6,minmax(0,1fr));padding:6px;border-radius:22px;border:1px solid color-mix(in srgb,var(--oro) 40%,transparent);background:color-mix(in srgb,var(--hoja) 74%,transparent);-webkit-backdrop-filter:blur(18px) saturate(1.5);backdrop-filter:blur(18px) saturate(1.5);box-shadow:inset 0 1px 0 color-mix(in srgb,#fff 9%,transparent),0 18px 40px -18px rgba(0,0,0,.85);transition:opacity .25s;animation:jg-sube-muelle .45s cubic-bezier(.2,.8,.2,1) both}
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
html.jg-con-muelle:has(.jg-sala-p) body{padding-bottom:calc(148px + env(safe-area-inset-bottom,0px))}
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
.jg-pasos{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;list-style:none;margin:0;padding:0;counter-reset:jgp}
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
.g-menu{position:relative;display:grid;grid-template-columns:repeat(6,minmax(0,1fr));width:min(92%,380px);box-sizing:border-box;padding:6px;border-radius:20px;border:1px solid color-mix(in srgb,var(--oro) 42%,transparent);background:color-mix(in srgb,var(--hoja) 82%,transparent)}
.g-menu>span:not(.luz){position:relative;display:grid;justify-items:center;gap:4px;padding:8px 0 6px;color:var(--oro-vivo);font:500 .62rem/1 var(--f-ui)}
.g-menu svg{width:22px;height:22px}
.g-menu .luz{position:absolute;left:6px;top:6px;bottom:6px;width:calc((100% - 12px)/6);border-radius:14px;background:color-mix(in srgb,var(--oro) 26%,transparent);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--oro) 46%,transparent);animation:g-menu 7.5s cubic-bezier(.3,1.3,.5,1) infinite}
@keyframes g-menu{0%,12%{transform:translate3d(0,0,0)}16%,28%{transform:translate3d(100%,0,0)}32%,44%{transform:translate3d(200%,0,0)}48%,60%{transform:translate3d(300%,0,0)}64%,76%{transform:translate3d(400%,0,0)}80%,94%{transform:translate3d(500%,0,0)}100%{transform:translate3d(0,0,0)}}
.jg-enapp .jg-acciones{margin-top:10px}
@media (prefers-reduced-motion:reduce){.ap-fig .fa-luz.on{animation:none;opacity:.85}.jg-epica .jg-brasa,.ap-lumbre::after{animation:none}.jg-escena *,.jg-escena *::after,.jg-yo .jg-emb::after,.jg-yo .jg-barra>i::after,.jg-llave::before,.jg-llave .jg-codigo span,.jg-muelle,.jg-tiembla{animation:none!important}.g-versos i::after{transform:none}.g-mis b::after,.g-dias i::after{transform:scale(1)}.g-xp{opacity:1}}
html[data-mov="no"] .ap-fig .fa-luz.on{animation:none;opacity:.85}html[data-mov="no"] .jg-epica .jg-brasa,html[data-mov="no"] .ap-lumbre::after{animation:none}html[data-mov="no"] .jg-escena *,html[data-mov="no"] .jg-escena *::after,html[data-mov="no"] .jg-yo .jg-emb::after,html[data-mov="no"] .jg-yo .jg-barra>i::after,html[data-mov="no"] .jg-llave::before,html[data-mov="no"] .jg-llave .jg-codigo span,html[data-mov="no"] .jg-muelle,html[data-mov="no"] .jg-tiembla{animation:none!important}
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
/* Cifras con números de caja alta en la letra de los títulos (su «0» de estilo antiguo se confundía con una «o») */
.jg-cifras b,.jg-fila .p,.jg-total b,.jg-med b,.jg-med .hito,.ap-ap b,.jg-cel h3{font-variant-numeric:lining-nums tabular-nums}
/* K (10-nov-2026, noche): velo breve mientras una sección vuelve a donde se dejó; X de la guía */
html.jg-volviendo #vista .panel.jg{opacity:0}
.jg-nombre .jg-pais{font:400 .82rem/1.2 var(--f-ui);color:var(--tenue)}
.jg-relevo{justify-self:start;margin:0 0 6px}
.jg-premio{bottom:calc(132px + var(--i) * 46px + env(safe-area-inset-bottom,0px))!important;background:linear-gradient(180deg,#2b2214,#17120b)!important;color:var(--oro-vivo)!important;border:1px solid color-mix(in srgb,var(--oro) 55%,transparent);opacity:0}
.jg-premio b{font-weight:700}.jg-premio.frag{color:#efe1bf!important}
.ap-vitrina li.raro{position:relative}.ap-vitrina li.raro::before{content:"Raro";position:absolute;top:6px;left:8px;font:700 .58rem/1 var(--f-ui);letter-spacing:.12em;text-transform:uppercase;color:#ffcf7a}
.ap-vitrina li.cerrado .ap-mu{opacity:.38;filter:grayscale(.6)}.ap-raro{font:400 .68rem/1.3 var(--f-ui);color:var(--tenue);text-align:center}
.jg-lb{position:fixed;left:50%;bottom:calc(14px + env(safe-area-inset-bottom,0px) + var(--jg-lb-alza,0px));z-index:63;transform:translate3d(-50%,0,0);display:inline-flex;align-items:center;gap:10px;min-height:46px;padding:6px 18px 6px 7px;border-radius:999px;cursor:pointer;-webkit-tap-highlight-color:transparent;
  font:600 .84rem/1 var(--f-ui);letter-spacing:.05em;color:var(--oro-vivo);border:1px solid color-mix(in srgb,var(--oro-vivo) 58%,transparent);
  background:radial-gradient(120% 100% at 50% -30%,rgba(255,246,214,.3),transparent 62%),linear-gradient(180deg,color-mix(in srgb,var(--oro) 26%,var(--hoja)),color-mix(in srgb,var(--oro) 9%,var(--hoja)));
  box-shadow:inset 0 1px 0 rgba(255,246,214,.45),inset 0 -10px 16px -12px rgba(255,224,140,.6),0 12px 28px -10px rgba(0,0,0,.78),0 0 0 1px rgba(0,0,0,.22);
  transition:opacity .24s ease,transform .26s cubic-bezier(.3,1.3,.5,1)}
.jg-lb::after{content:"";position:absolute;inset:-7px}
.jg-lb.fuera{opacity:0;transform:translate3d(-50%,14px,0);pointer-events:none}
.jg-lb:active{transform:translate3d(-50%,0,0) scale(.96)}
.jg-lb-i{width:30px;height:30px;border-radius:50%;border:1.5px solid currentColor;display:grid;place-items:center;flex:none;transition:background .2s}
.jg-lb-i::after{content:"";width:10px;height:5px;margin-top:-3px;border:solid currentColor;border-width:0 0 2px 2px;transform:rotate(-45deg);opacity:.5;transition:opacity .2s}
.jg-lb.hecho .jg-lb-i{background:var(--oro-vivo)}
.jg-lb.hecho .jg-lb-i::after{border-color:var(--hoja);opacity:1}
.jg-lb.espera .jg-lb-i::after{opacity:.32}
.jg-lb-t{display:grid;gap:4px;text-align:left}
.jg-lb-t b{font-weight:600}
.jg-lb-t small{font:500 .62rem/1 var(--f-ui);letter-spacing:.1em;color:var(--tenue);text-transform:uppercase}
.jg-ah{position:absolute;left:0;top:0;width:0;height:0;z-index:-1;pointer-events:none}
.jg-ah[hidden],.jg-ah [hidden]{display:none}
/* «Leído» (13-nov-2026): un hilo de luz en el margen a lo largo del verso que se marcaría y un halo suave detrás de su número;
   el verso se elige solo si se ve de verdad (su número o al menos dos renglones bajo las barras), así nada queda tapado */
.jg-ah .f{position:absolute;left:-1px;top:0;width:2px;border-radius:2px;will-change:opacity;background:linear-gradient(180deg,transparent,var(--oro-vivo) 14%,color-mix(in srgb,var(--oro-vivo) 70%,#fff8e6) 50%,var(--oro-vivo) 86%,transparent)}
.jg-ah .f::before{content:"";position:absolute;left:-10px;right:-10px;top:-4px;bottom:-4px;border-radius:50%;background:radial-gradient(closest-side,color-mix(in srgb,var(--oro) 30%,transparent),transparent)}
.jg-ah .n{position:absolute;left:0;top:0;border-radius:50%;will-change:opacity;background:radial-gradient(closest-side,color-mix(in srgb,var(--oro-vivo) 48%,transparent),color-mix(in srgb,var(--oro) 16%,transparent) 64%,transparent)}
.jg-ah .f,.jg-ah .n{animation:jg-ah 3.4s ease-in-out infinite}
@keyframes jg-ah{0%,100%{opacity:.66}50%{opacity:1}}
html[data-mov="no"] .jg-ah .f,html[data-mov="no"] .jg-ah .n{animation:none}
@media (prefers-reduced-motion:reduce){.jg-ah .f,.jg-ah .n{animation:none}}
.vn.jg-meta,.vs>sup.jg-meta{color:var(--oro-vivo)}
.vn.jg-leido,.vs>sup.jg-leido{color:var(--oro-vivo);text-shadow:0 0 10px color-mix(in srgb,var(--oro) 45%,transparent)}
.vl .vn.jg-leido::before{content:"";position:absolute;left:1px;top:.9em;width:6px;height:3px;border:solid var(--oro-vivo);border-width:0 0 1.6px 1.6px;border-radius:0;background:none;transform:rotate(-45deg);opacity:1}
.vs>sup.jg-leido{background:linear-gradient(currentColor,currentColor) 50% 100%/72% 1.5px no-repeat}
.vn.jg-quiere,.vs>sup.jg-quiere{text-decoration:underline dotted color-mix(in srgb,var(--oro-vivo) 80%,transparent);text-underline-offset:4px}
.fin-leido.jg-fin{display:grid;justify-items:center;gap:8px}
.fin-leido.jg-fin.hecho{display:flex;gap:8px;align-items:center;justify-content:center;color:var(--oro-vivo)}
.fin-leido.jg-fin.hecho svg{width:20px;height:20px}
.jg-fin-n{max-width:34em;text-align:center;margin:0}
.jg-conf{position:fixed;inset:0;z-index:95;display:grid;place-items:center;padding:20px;background:rgba(5,4,3,.64)}
:root[data-theme="light"] .jg-conf{background:rgba(40,30,15,.32)}
.jg-conf-c{width:min(420px,100%);border-radius:18px;padding:20px 20px 16px;border:1px solid var(--linea);background:linear-gradient(180deg,rgba(255,246,214,.05),transparent 70%),var(--hoja);box-shadow:var(--sombra)}
.jg-conf-c h3{margin:0 0 8px;font:500 1.22rem/1.25 var(--f-display);color:var(--tinta)}
.jg-conf-c p{margin:0 0 16px;font:400 .92rem/1.45 var(--f-ui);color:var(--tinta-2)}
.jg-conf-c .jg-acciones{display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap;margin:0}
.jg.ap:has(> .cargando:only-child){min-height:min(1180px,150vh)}
.ap-da{display:block;font:400 .64rem/1.3 var(--f-ui);color:var(--tenue);text-align:center;margin-top:2px}
.jg-tarjeta.jg-resalta{position:relative}
.jg-tarjeta.jg-resalta::after{content:"";position:absolute;inset:-2px;border-radius:inherit;pointer-events:none;box-shadow:0 0 0 2px var(--oro-vivo),0 0 26px -2px color-mix(in srgb,var(--oro-vivo) 70%,transparent);animation:jg-resalta 2.6s ease-out forwards}
@keyframes jg-resalta{0%{opacity:0}15%{opacity:1}35%{opacity:.45}55%{opacity:1}100%{opacity:0}}
.jg-cambio b{color:var(--oro-vivo);font-variant-numeric:tabular-nums}
.cf-raiz{display:grid;justify-items:center;gap:10px;margin:6px 0 14px}
.cf-tit{margin:0;color:var(--oro-vivo);letter-spacing:.08em;text-transform:uppercase;font-weight:600}
.cf{position:relative;width:min(220px,62vw);aspect-ratio:160/140;display:grid;place-items:center}
.cf-svg{position:relative;width:100%;height:100%;overflow:visible;transform-box:fill-box;transform-origin:50% 90%}
.cf-halo{position:absolute;inset:-18% -10% -6%;border-radius:50%;background:radial-gradient(circle at 50% 52%,color-mix(in srgb,var(--cf) 46%,transparent),transparent 62%);opacity:.35;pointer-events:none}
.cf-col{position:absolute;left:28%;right:28%;bottom:52%;height:120%;transform-origin:50% 100%;opacity:0;pointer-events:none;
  background:linear-gradient(0deg,color-mix(in srgb,var(--cf) 70%,#fff),color-mix(in srgb,var(--cf) 28%,transparent) 55%,transparent);border-radius:50% 50% 12px 12px/30% 30% 12px 12px;filter:blur(6px)}
.cf.n0 .cf-col{display:none}
.cf-info{display:grid;justify-items:center;gap:4px;text-align:center}
.cf-info p{margin:0}
.cf-n{font:500 1.05rem/1.2 var(--f-display);letter-spacing:.06em;color:var(--oro-vivo)}
.cf-dr{font:600 2rem/1 var(--f-display);color:var(--oro-vivo);font-variant-numeric:lining-nums tabular-nums;text-shadow:0 0 18px color-mix(in srgb,var(--oro) 50%,transparent)}
.cf-flash{position:fixed;inset:0;z-index:90;pointer-events:none;background:radial-gradient(circle at 50% 46%,#fff8dc,rgba(255,231,160,.5) 40%,transparent 75%);opacity:0}
.cf-m,.cf-g{position:fixed;width:16px;height:16px;border-radius:50%;pointer-events:none;will-change:transform,opacity}
.cf-m{border:2.4px solid var(--c);box-shadow:0 0 8px color-mix(in srgb,var(--c) 70%,transparent),inset 0 0 0 3px rgba(0,0,0,.12)}
.cf-m::after{content:"";position:absolute;left:50%;top:50%;width:3px;height:3px;margin:-1.5px;border-radius:50%;background:var(--c)}
.cf-g{width:12px;height:10px;border-radius:40%;background:radial-gradient(circle at 35% 30%,#fff,var(--c) 45%,color-mix(in srgb,var(--c) 70%,#000));box-shadow:0 0 10px var(--c)}
.jg-fan{position:fixed;inset:0;z-index:84;pointer-events:none;display:grid;place-items:center;align-content:center;gap:14px;perspective:600px}
.jg-fan-v{position:absolute;inset:0;background:radial-gradient(circle at 50% 46%,color-mix(in srgb,var(--c) 34%,transparent),rgba(5,4,3,.72) 58%,rgba(5,4,3,.82));opacity:0;will-change:opacity}
.jg-fan-l{position:absolute;left:50%;top:46%;width:min(70vw,340px);aspect-ratio:1;margin:calc(min(70vw,340px) / -2) 0 0 calc(min(70vw,340px) / -2);border-radius:50%;background:radial-gradient(closest-side,color-mix(in srgb,var(--c) 70%,#fff) 0,color-mix(in srgb,var(--c) 32%,transparent) 38%,transparent 70%);opacity:0;will-change:opacity}
.jg-fan-g{position:relative;width:min(34vw,148px);will-change:transform,opacity}.jg-fan-g svg{display:block;width:100%;height:auto}
.jg-fan-t{position:relative;margin:0;font:500 clamp(1.6rem,7vw,2.2rem)/1.1 var(--f-display);color:#fff4d2;letter-spacing:.04em;text-shadow:0 2px 14px rgba(0,0,0,.6);will-change:transform,opacity}
.ap-savia{position:absolute;left:0;top:0;width:1000px;height:1110px;transform-origin:0 0;transform:scale(var(--k,.38));pointer-events:none;display:none}
@supports (offset-path:path("M0 0")){.ap-savia{display:block}}
.ap-sv{position:absolute;left:0;top:0;width:var(--s);height:var(--s);border-radius:50%;offset-rotate:0deg;offset-anchor:50% 50%;background:radial-gradient(circle,#fffdf3 0 22%,var(--c) 40%,color-mix(in srgb,var(--c) 0%,transparent) 72%);opacity:0;animation:ap-savia var(--t) cubic-bezier(.45,.05,.55,.95) var(--d) infinite;will-change:offset-distance,opacity}
@keyframes ap-savia{0%{offset-distance:100%;opacity:0}12%{opacity:var(--o)}82%{opacity:var(--o)}100%{offset-distance:0%;opacity:0}}
.ap-bebe{position:absolute;left:500px;top:800px;width:220px;height:70px;margin:-35px 0 0 -110px;border-radius:50%;background:radial-gradient(closest-side,rgba(255,230,160,.42),rgba(245,198,78,.12) 60%,rgba(245,198,78,0));animation:ap-respira 2.6s ease-in-out infinite;will-change:opacity}
.ap-arbol.quieto .ap-savia i,.ap-arbol.quieto .ap-savia b{animation-play-state:paused}
@media (prefers-reduced-motion:reduce){.ap-savia{display:none!important}}
html[data-mov="no"] .ap-savia{display:none!important}
.jg-guia{position:relative}
.jg-cerrar{position:absolute;top:10px;right:10px;z-index:2;width:38px;height:38px;display:grid;place-items:center;border-radius:50%;color:var(--tinta);border:1px solid var(--vid-b);background:linear-gradient(180deg,rgba(255,255,255,.09),rgba(255,255,255,0) 60%),linear-gradient(180deg,var(--vid-1),var(--vid-2));box-shadow:inset 0 1px 0 rgba(255,255,255,.12),0 8px 18px -12px rgba(0,0,0,.8);cursor:pointer;transition:transform .15s,border-color .2s}
.jg-cerrar:hover{border-color:color-mix(in srgb,var(--oro-vivo) 50%,transparent)}.jg-cerrar:active{transform:scale(.94)}
.jg-cerrar svg{width:18px;height:18px}
.jg-cerrar::after{content:"";position:absolute;inset:-6px}
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
    if (MV.pend) requestAnimationFrame(restituirVista);
    const k = (S.sub || []).join("/") + "|" + (S.token ? 1 : 0);
    if (S.vistaAnim !== k) { S.vistaAnim = k; requestAnimationFrame(() => animarCifras(cont)); }
  }
  function repintar() { if (S.cont) vista(S.cont, S.sub); }
  // ------------------------------------------------------------------ memoria de la vista por sección
  // BiEx (10-nov-2026): en Escudriña rige también el principio del lector: cada sección vuelve exactamente a donde se dejó,
  // también cuando se llega por el menú. Se guarda el desplazamiento y un ancla (el bloque que está arriba en pantalla y
  // cuánto de él se ve); al volver se restituye cuando la sección ya está dibujada (los datos llegan por partes), bajo un
  // velo breve para que no se vea el salto. Con «Atrás» o «Adelante» manda la memoria del lector (no se duplica).
  const MV = { pos: (() => { try { return JSON.parse(sessionStorage.getItem("biex:jg:vista") || "{}"); } catch (e) { return {}; } })(), k: null, pend: null, hasta: 0, tg: 0, ts: 0 };
  const claveVista = () => (S.sub || []).filter(Boolean).join("/") || "hoy";
  const enJuego = () => /^#\/escudrina(\/|$)/.test(location.hash || "") && S.cont && S.cont.isConnected;
  function bordeVista() { let y = 0; for (const el of document.querySelectorAll(".barra")) { const r = el.getBoundingClientRect(); if (r.height && r.bottom > 0 && getComputedStyle(el).position !== "static") y = Math.max(y, r.bottom); } return y; }
  const bloquesVista = () => (S.cont ? Array.from(S.cont.querySelectorAll(".panel.jg > *")) : []);
  function anotarVista() {
    if (!MV.k || MV.pend || !enJuego()) return;
    const borde = bordeVista(), l = bloquesVista(), y = Math.round(window.scrollY);
    let i = -1, o = 0;
    if (y > 4) for (let n = 0; n < l.length; n++) { const r = l[n].getBoundingClientRect(); if (r.bottom > borde + 1) { i = n; o = Math.round(r.top - borde); break; } }
    MV.pos[MV.k] = y > 4 ? { y, i, o } : null;
    clearTimeout(MV.ts); MV.ts = setTimeout(() => { try { const ks = Object.keys(MV.pos); if (ks.length > 40) delete MV.pos[ks[0]]; sessionStorage.setItem("biex:jg:vista", JSON.stringify(MV.pos)); } catch (e) { /* sin almacenamiento */ } }, 400);
  }
  window.addEventListener("scroll", () => { if (MV.tg || !MV.k) return; MV.tg = setTimeout(() => { MV.tg = 0; anotarVista(); }, 120); }, { passive: true });
  // antes de cualquier toque que pueda llevar a otra vista, la posición queda anotada al instante
  for (const ev of ["pointerdown", "keydown"]) document.addEventListener(ev, () => { if (MV.k && !MV.pend) anotarVista(); }, { passive: true, capture: true });
  for (const ev of ["wheel", "touchstart", "keydown"]) window.addEventListener(ev, () => { if (MV.pend && performance.now() - MV.t0 > 120) terminarVista(); }, { passive: true });
  function terminarVista() { MV.pend = null; document.documentElement.classList.remove("jg-volviendo"); if (MV.ro) { MV.ro.disconnect(); MV.ro = null; } }
  function prepararVista() {
    const k = claveVista(); if (k === MV.k) return;
    MV.k = k; terminarVista();
    const g = MV.pos[k];
    if (!g || (A.restaurando && A.restaurando())) return;
    MV.pend = g; MV.t0 = performance.now(); MV.hasta = MV.t0 + 2600;
    document.documentElement.classList.add("jg-volviendo"); setTimeout(() => document.documentElement.classList.remove("jg-volviendo"), 900);
  }
  function restituirVista() {
    const g = MV.pend; if (!g || !enJuego()) return;
    if (performance.now() > MV.hasta) return terminarVista();
    const l = bloquesVista(), borde = bordeVista(), max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    let y = g.y;
    if (g.i >= 0 && l[g.i]) y = Math.round(window.scrollY + l[g.i].getBoundingClientRect().top - borde - g.o);
    if (max < y - 2) { if (!MV.ro && window.ResizeObserver) { MV.ro = new ResizeObserver(() => restituirVista()); MV.ro.observe(S.cont); } return; }
    try { window.scrollTo({ top: y, left: 0, behavior: "instant" }); } catch (e) { window.scrollTo(0, y); }
    document.documentElement.classList.remove("jg-volviendo");
    if (!MV.ro && window.ResizeObserver) { MV.ro = new ResizeObserver(() => restituirVista()); MV.ro.observe(S.cont); }
  }
  async function vista(cont, sub) {
    estilos();
    if (R.lib || MED.el) salir(); // BiEx (10-nov-2026): el escudo de nivel no se queda detrás del menú de Escudriña
    S.cont = cont; S.sub = sub || [];
    prepararVista();
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
              cfg.google ? h("button", { class: "btn", type: "button", onclick: () => conectar("google", "crear", pista) }, ico("google"), h("span", { text: "Empezar con Google" })) : null,
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
    libros: "Lee en " + m.meta + " libros distintos", vida: "Lee " + plural(m.meta, "verso", "versos") + " de los relatos de la vida de YēshŪ́aʿ",
    cartas: "Lee " + plural(m.meta, "verso", "versos") + " de las cartas", nuevos: "Lee " + plural(m.meta, "verso", "versos") + " que nunca habías leído",
    repaso: "Repasa " + plural(m.meta, "verso", "versos") + " que ya leíste", preguntas: "Acierta " + plural(m.meta, "pregunta", "preguntas") + " en las pruebas",
    minutos: "Lee durante " + plural(m.meta, "minuto", "minutos") }[m.tipo] || "Misión");
  // Barra de experiencia (BiEx, 12-nov-2026: «que las personas se emocionen al ver su progreso»): el relleno avanza con transform
  // (compositor), una brasa late en su borde, marcas cada 10 % y, al volver, crece desde donde se vio la última vez
  function barraEpica(y, pct) {
    const rel = h("i", { class: "jg-relleno" }), borde = h("span", { class: "jg-borde", "aria-hidden": "true" }, h("b", { class: "jg-brasa" }));
    const bar = h("div", { class: "jg-barra jg-epica" + (pct >= 90 ? " cerca" : ""), role: "progressbar", "aria-valuemin": "0", "aria-valuemax": String(y.xpSig), "aria-valuenow": String(y.xpNivel), "aria-label": "Experiencia hacia el nivel siguiente", style: "--p:" + pct.toFixed(2) },
      rel, borde, h("span", { class: "jg-marcas", "aria-hidden": "true" }));
    const visto = A.store.get("jg:xpv", null), desde = visto && visto.n === y.nivel ? visto.p : visto && visto.n < y.nivel ? 0 : null;
    A.store.set("jg:xpv", { n: y.nivel, p: pct });
    if (desde != null && desde < pct - 0.3 && !sinAnim() && rel.animate) requestAnimationFrame(() => {
      for (const el of [rel, borde]) el.animate([{ transform: "translate3d(" + (desde - 100).toFixed(2) + "%,0,0)" }, { transform: "translate3d(" + (pct - 100).toFixed(2) + "%,0,0)" }], { duration: 1400, easing: "cubic-bezier(.2,.8,.2,1)" });
      bar.classList.add("crece"); setTimeout(() => bar.classList.remove("crece"), 1700);
    });
    return bar;
  }
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
      h("div", {}, barraEpica(y, pct),
        h("div", { class: "jg-nivel" }, h("span", { text: y.enTope ? "Llegaste al nivel tope de este mes (" + y.tope + "): el 1.º del mes se abren de 2 a 7 niveles nuevos y tu reserva sube contigo" : fmt(y.xpNivel) + " de " + fmt(y.xpSig) + " para el nivel " + (y.nivel + 1) }), h("span", { text: fmt(y.xp) + " en total" }))));
    t.classList.add("jg-yo");
    return t;
  }
  function botonSeguir() {
    const u = A.ultimo && A.ultimo();
    const hh = u ? u.h : "#/MAT/1";
    return h("a", { class: "btn oro jg-grande", href: hh }, A.svg(A.ICO.seguir), h("span", {}, u ? "Seguir leyendo" : "Empezar a leer", h("small", { text: u ? u.t : "Mattáy 1" })));
  }
  // adónde lleva cada misión: a la lectura que la cumple
  function destinoMision(m) {
    const u = A.ultimo && A.ultimo(), seguir = u ? u.h : "#/MAT/1";
    if (m.tipo === "libros") return "#/libros";
    if (m.tipo === "vida") return u && /^#\/(LUK|MAT|MRK|JHN)\//.test(u.h) ? u.h : "#/LUK/1";
    if (m.tipo === "cartas") return u && !/^#\/(LUK|MAT|MRK|JHN|ACT|REV)\//.test(u.h) ? u.h : "#/libros";
    return seguir;
  }
  function tarjetaMisiones(y) {
    // una misión cumplida muestra siempre su meta completa (13-nov-2026: «0 de 1 · cumplida» tras el cambio de conteo de P20)
    const lista = h("ul", { class: "jg-misiones" }, (y.mis || []).map((m) => (m.hecha && !(m.prog >= m.meta) ? Object.assign({}, m, { prog: m.meta }) : m)).map((m, i) => h("li", { class: "jg-mision" + (m.hecha ? " hecha" : "") },
      h("span", { class: "jg-ok", "aria-hidden": "true" }, ico("marca")),
      h(m.hecha ? "div" : "a", m.hecha ? {} : { class: "jg-mis-ir", href: destinoMision(m), title: "Ir a cumplirla" }, h("div", { class: "jg-mt", text: textoMision(m) }), h("div", { class: "jg-barra", "aria-hidden": "true" }, h("i", { style: "width:" + Math.min(100, (100 * m.prog) / m.meta).toFixed(0) + "%" })),
        h("span", { class: "jg-mini", text: fmt(m.prog) + " de " + fmt(m.meta) + (m.hecha ? " · cumplida" : " · tócala para ir a cumplirla") })),
      h("div", {}, h("div", { class: "jg-pr", text: "+" + m.xp }), h("div", { class: "jg-pr", style: "opacity:.75", text: "+" + m.dr + " dr." }),
        !m.hecha && !y.cambio && i > 0 ? h("button", { class: "jg-cambiar", type: "button", onclick: () => cambiarMision(i) }, "Cambiar") : null))));
    const cambio = h("p", { class: "jg-mini jg-cambio" }, "Nuevas misiones en ", h("b", { text: hastaCambio(y.tz) }));
    const reloj = setInterval(() => { if (!cambio.isConnected) return clearInterval(reloj); cambio.lastChild.textContent = hastaCambio(y.tz); }, 1000);
    return tarjeta("Misiones de hoy", ico("marca"), cambio, lista,
      h("p", { class: "jg-mini", text: y.completo ? "¡Cumpliste todas las misiones de hoy! Mañana habrá otras." : "Todas a tu ritmo. Al cumplirlas todas ganas 500 de experiencia y 10 dracmas más." + (y.cambio ? "" : " Puedes cambiar una misión por día.") }));
  }
  // tiempo que falta para la medianoche de la zona horaria de la cuenta (allí cambian las misiones)
  function hastaCambio(tz) {
    let seg;
    try { const f = new Intl.DateTimeFormat("en-US", { timeZone: tz || undefined, hour: "numeric", minute: "numeric", second: "numeric", hourCycle: "h23" }).formatToParts(new Date()), g = (t) => +((f.find((x) => x.type === t) || {}).value || 0); seg = 86400 - ((g("hour") % 24) * 3600 + g("minute") * 60 + g("second")); }
    catch (e) { const d = new Date(); seg = 86400 - (d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds()); }
    const hh = Math.floor(seg / 3600), mm = Math.floor((seg % 3600) / 60), ss = seg % 60, d2 = (n) => String(n).padStart(2, "0");
    return hh + " h " + d2(mm) + " min " + d2(ss) + " s";
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
      h("p", {}, "Leíste ", h("b", { text: plural(n, "verso", "versos") }), " a tu ritmo: ya sumaron el 30 % de su experiencia. Si de verdad los leíste, márcalos «Leído» (en el verso o aquí, uno por uno o por capítulo) y suma el 70 %" + (y.pc && y.pc.x ? " (+" + fmt(y.pc.x) + ")" : "") + ", con la posibilidad de hallar fragmentos de papiro y dracmas."),
      h("div", { class: "jg-acciones" }, todo, nada), det,
      h("p", { class: "jg-mini", text: "Puedes marcarlos durante 7 días; lo que no marques se queda en su 30 %, como tú decidas. Tu estimación de lectura real (" + pq(q[0]) + " a ritmo justo, " + pq(q[1]) + " a ritmo holgado) es una fórmula bayesiana que aprende de tus respuestas «Lo leí» y «No lo leí»." }));
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
    cont.replaceChildren(...filas, h("p", { class: "jg-mini", text: "✓ Lo leí: recibes el 70 % que falta (y puedes hallar fragmentos y dracmas). ✗ No lo leí: se descuenta de tus estadísticas y la estimación aprende de tu respuesta (lo ganado no se quita)." }));
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
      y.lauroP != null ? h("div", { class: "jg-lauro-p", title: "Es una estimación: cada hallazgo se decide aleatoriamente en el servidor" },
        h("div", { class: "jg-lauro-p-t" }, h("span", { text: "Lauro trenzado en tu próximo hallazgo" }), h("b", { text: "≈\u00a0" + String(Math.round(y.lauroP * 1000) / 10).replace(".", ",") + "\u00a0%" })),
        h("div", { class: "jg-barra", "aria-hidden": "true" }, h("i", { style: "width:" + Math.min(100, (y.lauroP / 0.6) * 100).toFixed(1) + "%" })),
        h("p", { class: "jg-mini", text: "Estimación: sube con cada piedra que hallas y vuelve a empezar al conseguir un lauro." })) : null,
      h("p", { class: "jg-mini", text: n === 12 ? "Reuniste las doce piedras: tu experiencia vale un 5 % más para siempre." : "Piedras del fundamento: " + n + " de 12 (Ἀpοκάlυpsις 21:19-20). Cada verso leído puede revelar una, muy de vez en cuando." }));
  }
  function verPiedra(i, veces) {
    const pd = PIEDRAS[i];
    A.abrirModal(() => A.cajaModal(A.cabModal("Las doce piedras", "Ἀpοκάlυpsις 21:19-20"), h("div", { class: "jg-cel" },
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
    mision: (a) => (a.ok ? (a.e ? "¡Se logró el relevo " + (a.e + 1) + " de la misión mundial! " : "¡La misión mundial se logró! ") : (a.e ? "El relevo " + (a.e + 1) + " no se alcanzó esta vez, pero tu aporte cuenta: " : "La misión mundial no se alcanzó esta vez, pero tu aporte cuenta: ")) + "+" + horas(a.h * 3600e3) + " de experiencia doble." };
  // Hora de cada novedad, en la zona horaria de quien lee (BiEx, 13-nov-2026): «Hace 5 min · 6:35 a. m.», «Hoy · 6:40 a. m.»,
  // «Ayer · 9:12 p. m.» o «12 nov. · 9:12 p. m.»; lo reciente se actualiza solo cada minuto mientras la tarjeta está a la vista
  const LOC_ES = /^es\b/i.test(navigator.language || "") ? navigator.language : "es"; // «5:09 p. m.» o «17:09», según el país de quien lee
  const F_HORA = new Intl.DateTimeFormat(LOC_ES, { hour: "numeric", minute: "2-digit" }), F_DIA = new Intl.DateTimeFormat(LOC_ES, { day: "numeric", month: "short" });
  function cuandoFue(t) {
    if (!t) return "";
    const d = new Date(t), hoy = new Date(), hr = F_HORA.format(d), min = Math.floor((Date.now() - t) / 60000);
    const igual = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
    if (min < 1) return "Ahora · " + hr;
    if (min < 60) return "Hace " + min + " min · " + hr;
    if (igual(d, hoy)) return "Hoy · " + hr;
    const ayer = new Date(hoy); ayer.setDate(hoy.getDate() - 1);
    return (igual(d, ayer) ? "Ayer" : F_DIA.format(d) + (d.getFullYear() !== hoy.getFullYear() ? " de " + d.getFullYear() : "")) + " · " + hr;
  }
  function tarjetaNovedades(y) {
    const l = (y.avisos || []).filter((a) => NOVEDAD[a.k]).slice(0, 6);
    if (!l.length) return null;
    const horas = [];
    const ul = h("ul", { class: "jg-novedades" }, l.map((a) => {
      const t = a.t ? h("time", { class: "jg-nov-t", datetime: new Date(a.t).toISOString(), text: cuandoFue(a.t) }) : null;
      if (t) horas.push([t, a.t]);
      return h("li", {}, t, h("span", { class: "jg-nov-x", text: NOVEDAD[a.k](a) }));
    }));
    if (horas.some(([, t]) => Date.now() - t < 3600e3)) {
      const reloj = setInterval(() => { if (!ul.isConnected) return clearInterval(reloj); for (const [el, t] of horas) el.textContent = cuandoFue(t); }, 60000);
    }
    return tarjeta("Novedades", null, ul);
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
    juntos: ["Juntos", "Tu compañía y las salas de lectura"], mas: ["Más", "Tu cuenta, tu avance y tus ideas"], arbol: ["Tu Árbol", "Un centro de poder: raíces, corazón, copa y su fruto"], guia: ["Cómo se juega", "Paso a paso y a tu ritmo"] };
  let MU = null;
  function muelle(sec) {
    const raiz = document.documentElement;
    if (sec == null) { if (MU) { MU.remove(); MU = null; } raiz.classList.remove("jg-con-muelle"); return; }
    if (!MU) {
      MU = h("nav", { class: "jg-muelle", "aria-label": "Secciones de Escudriña" }, h("span", { class: "luz", "aria-hidden": "true" }),
        SECC.map(([k, t, ic]) => h("a", { href: "#/escudrina" + (k === "hoy" ? "" : "/" + k), "data-s": k, onclick: () => vibrar(8), onpointerdown: k === "arbol" ? () => { if (S.token) cargarPoder("previo").catch(() => {}); } : null }, ico(ic), h("span", { text: t }))));
      document.body.append(MU);
    }
    raiz.classList.add("jg-con-muelle");
    MU.style.setProperty("--i", String(Math.max(0, SECC.findIndex((s) => s[0] === sec))));
    for (const a of MU.querySelectorAll("a")) { const on = a.getAttribute("data-s") === sec; a.classList.toggle("act", on); if (on) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); }
    // Insignias (BiEx, 12-nov-2026): al entrar en la sección, su zona se ilumina y la insignia se apaga; vuelve solo
    // cuando cambia lo que avisa (misiones de un día nuevo; el recordatorio de asegurar la cuenta, una vez por día)
    const y = S.yo, dia = (y && y.hoy && y.hoy.f) || "", faltan = y && Array.isArray(y.mis) ? y.mis.filter((m) => !m.hecha).length : 0;
    const visto = A.store.get("jg:insig", null) || {};
    const insignia = (k, firma, val, titulo) => {
      const a = MU.querySelector('a[data-s="' + k + '"]'); if (!a) return;
      if (!firma) { a.removeAttribute("data-n"); a.removeAttribute("title"); return; }
      if (sec === k) { a.removeAttribute("data-n"); if (visto[k] !== firma) { visto[k] = firma; A.store.set("jg:insig", visto); resaltarZona(k); } return; }
      if (visto[k] === firma) { a.removeAttribute("data-n"); return; }
      a.setAttribute("data-n", val); a.title = titulo;
    };
    insignia("hoy", faltan ? "m:" + dia : "", String(faltan), "Misiones por cumplir");
    insignia("mas", y && !y.asegurado ? "a:" + dia : "", "!", "Asegura tu avance");
  }
  function resaltarZona(k) {
    setTimeout(() => {
      const zonas = [...document.querySelectorAll(".jg .jg-tarjeta")];
      const z = k === "hoy" ? zonas.find((t) => /Misiones de hoy/.test((t.querySelector("h2") || {}).textContent || "")) : zonas.find((t) => t.classList.contains("jg-asegurar") || /Asegura/.test((t.querySelector("h2") || {}).textContent || ""));
      if (!z) return;
      const r = z.getBoundingClientRect(); if (r.top > innerHeight * 0.8 || r.bottom < 80) z.scrollIntoView({ block: "center", behavior: sinAnim() ? "auto" : "smooth" });
      z.classList.add("jg-resalta"); setTimeout(() => z.classList.remove("jg-resalta"), 2600);
    }, 420);
  }
  window.addEventListener("hashchange", () => { if (!/^#\/escudrina(\/|$)/.test(location.hash)) { muelle(null); MV.k = null; terminarVista(); } });
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
        tarjetaColeccion(y),
        h("div", { class: "jg-acciones" }, h("a", { class: "btn", href: "#/escudrina/clasificacion" }, h("span", { text: "Ver la clasificación" })),
          h("a", { class: "btn", href: "#/escudrina/prestigio" }, h("span", { text: "Prestigio de las ciudades" }))), vivoLinea());
  }
  function dibujarPanel(cont, y) {
    const sec = SECC_DE[S.sub[0] || ""] || "hoy";
    if (sec !== "juntos") salasAbiertas(false).catch(() => {});
    const pend = null; // P20 (12-nov-2026): ya no se piden confirmaciones manuales
    const salaInv = (() => { const ps = A.store.get("jg:salaInv", null); return ps && ps.c && !SL.cod ? h("div", { class: "jg-aviso" }, "Te invitaron a la sala de lectura ", h("b", { text: ps.c }), ". ", h("a", { href: "#/escudrina/sala/" + ps.c, text: "Entrar" })) : null; })();
    let partes;
    if (sec === "tesoro") partes = [tarjetaHallazgos(y), tarjetaPotencias(y)];
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
    ["Lee de verdad", "Abre cualquier capítulo de la Nueva Voluntad y lee a tu ritmo. Cada verso que lees te da el 30 % de su experiencia; al terminarlo, toca «Leído» (abajo, al centro: brilla el número del verso que marcas) y suma el 70 % restante, con la posibilidad de hallar fragmentos de papiro y dracmas. Solo cuentan como leídos los versos que marcas, el capítulo que marcas al final cuando lo leíste con calma y las preguntas de la prueba bien respondidas.", "versos"],
    ["Misiones pequeñas cada día", "Cada día recibes de 2 a 5 misiones sencillas, como leer unos versos o completar un capítulo. Sin prisa y sin culpa: si un día no puedes, tu avance sigue ahí.", "misiones"],
    ["Hallazgos", "Muy de vez en cuando, un verso revela una de las doce piedras del fundamento o un lauro trenzado incorruptible. Solo aparecen leyendo.", "hallazgos"],
    ["Perseverancia", "Cada día que lees suma a tu perseverancia. Cada 7 días seguidos ganas un descanso que cubre un día sin lectura.", "perseverancia"],
    ["Nunca a solas", "Entra en la liga de la semana, aporta a la misión mundial, forma una compañía de 2 a 24 personas o abre una sala para leer en compañía.", "juntos"],
    ["Tu siembra", "Comparte tu enlace. Quien llega contigo empieza con 3 horas de experiencia doble, y tu árbol de la siembra crece generación tras generación.", "siembra"],
    // BiEx (10-nov-2026): el menú cambió (seis botones, con el Árbol): el paso 7 lo dice tal como es
    ["El menú del juego", "Abajo tienes seis botones: Hoy (tu lectura y tus misiones), Tesoro (lo que hallas leyendo), Mundo (la liga, la misión mundial y las clasificaciones), Juntos (tu compañía y las salas), Árbol (tu ser interior: atributos, armadura y tienda) y Más (tu cuenta). Con ellos llegas a todo. Y guarda bien tu acceso: es tu llave.", "menu"]];
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
    // BiEx (10-nov-2026): en vez de «Saltar y volver al juego», una X arriba que cierra y deja la vista que había antes
    const cerrar = () => { A.store.set("jg:guia", 1); S.guiaPaso = 0; vibrar(8); if (A.volver) A.volver("#/escudrina"); else A.irA("#/escudrina"); };
    const x = h("button", { class: "jg-cerrar", type: "button", "aria-label": "Cerrar la guía y volver a donde estabas", title: "Cerrar", onclick: cerrar }, A.svg(A.ICO.cerrar));
    const caja = h("section", { class: "jg-tarjeta jg-guia", tabindex: "-1" }, x, escena, h("div", { class: "jg-guia-pie" }, puntos, cuenta), tit, txt, h("div", { class: "jg-guia-nav" }, atras, sig));
    caja.addEventListener("keydown", (ev) => { if (ev.key === "ArrowRight") ir(i + 1); else if (ev.key === "ArrowLeft") ir(i - 1); else if (ev.key === "Escape") cerrar(); });
    marco(cont, cabeceraJuego("guia"), caja);
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
      if (precio && !(await confirmar("Cambiar tu apodo", "Cuesta " + precio + " dracmas y el próximo cambio será dentro de 3 semanas.", "Cambiar mi apodo"))) return;
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
  const CIUDADES = [["America/Los_Angeles", "Los Angeles [Ángeles] · hora del Pacífico"], ["America/Mexico_City", "Ciudad de México · Centroamérica"], ["America/Bogota", "Bogotá · Lima · Quito"],
    ["America/New_York", "New [Nueva] York"], ["America/Caracas", "Caracas · Santo Domingo · San Juan"], ["America/Santiago", "Santiago"], ["America/Argentina/Buenos_Aires", "Buenos Aires · São Paulo · Montevideo"],
    ["Europe/London", "London [Londres]"], ["Europe/Madrid", "Madrid · Paris [París] · Roma"]];
  // La semana del juego es la misma para todos (de domingo a sábado en la hora de Bogotá, UTC−5): se muestra cuándo
  // cambia en la hora y la ciudad (zona horaria) de quien lee
  function finSemanaMs() { const b = new Date(Date.now() - 5 * 3600e3), hoy0 = Date.UTC(b.getUTCFullYear(), b.getUTCMonth(), b.getUTCDate()); return hoy0 + (7 - b.getUTCDay()) * 864e5 + 5 * 3600e3; }
  function ciudadZona() {
    let tz = ""; try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch (e) { tz = ""; }
    const c = CIUDADES.find((x) => x[0] === tz);
    if (c) return c[1].split(" · ")[0];
    const t = tz.split("/").pop() || ""; return t ? t.replace(/_/g, " ") : "tu ciudad";
  }
  function textoSemana() {
    let cuando = ""; try { cuando = new Date(finSemanaMs()).toLocaleString("es", { weekday: "long", hour: "numeric", minute: "2-digit" }); } catch (e) { cuando = "domingo, 0:00"; }
    return "de domingo a sábado; cambia el " + cuando.replace(",", " a las") + ", hora de " + ciudadZona();
  }
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
  // Rollos de colección (lo acordado en la propuesta del juego: «La Designación»; BiEx, 10-nov-2026: con firma criptográfica).
  // No es un premio para las Primicias: cada 2 meses se entregan dos Rollos, asignados aleatoriamente con un método que cualquiera puede comprobar.
  function tarjetaColeccion(y, plegable) {
    const ico0 = () => h("span", { class: "jg-col-ico", "aria-hidden": "true" }, A.svg('<path d="M6 4.5h10.5a2.5 2.5 0 0 1 0 5H8.5v10a2 2 0 0 1-4 0V6.5a2 2 0 0 1 1.5-2z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M8.5 9.5h9v8.5a2 2 0 0 1-2 2H6.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M11 13h4.5M11 16h3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>'));
    const texto = "Cada 2 meses se entregan dos Rollos: PDF exclusivos y numerados de un libro de la Nueva Voluntad, a nombre de quien los recibe y con firma criptográfica. «La Designación» los asigna aleatoriamente, con un método que cualquiera puede comprobar y que nadie puede inclinar: uno entre los 24 primeros de cada rango del bimestre y otro para cualquiera desde el puesto 25 (con cuenta asegurada y al menos 14 días de lectura en el bimestre).";
    if (plegable) return h("details", { class: "jg-coleccion plegable" }, h("summary", {}, ico0(), h("span", {}, h("b", { text: "Rollos de colección" }), h("small", { text: "Cada 2 meses, dos PDF exclusivos y numerados" })), h("i", { class: "jg-col-v", "aria-hidden": "true" })), h("p", { text: texto }));
    return h("div", { class: "jg-coleccion" }, ico0(), h("p", {}, h("b", { text: "Rollos de colección. " }), texto));
  }
  function tarjetaCampana(y) {
    const url = enlaceInvitacion(), M = marcos(), conf = (y.invi && y.invi.conf) || 0;
    // la escalera es un bucle: cada vuelta de 100 repite los diez peldaños y sus horas (BiEx, 9-nov-2026)
    const V = (S.cfg && S.cfg.vuelta) || 100, vuelta = Math.floor(conf / V) + 1, b0 = (vuelta - 1) * V, enV = conf - b0;
    const sig = M.find((m) => enV < m[0]) || null, prev = M.filter((m) => enV >= m[0]).pop();
    const base = prev ? prev[0] : 0, pct = sig ? Math.min(100, (100 * (enV - base)) / (sig[0] - base)) : 100;
    const ab = h("b", { text: "·" }), ins = h("b", { text: fmt((y.invi && y.invi.unidos) || 0) });
    pedir("/campana/mia", { guardable: true }).then((m) => { if (!m.error) { ab.textContent = fmt(m.aperturas); ins.textContent = fmt(Math.max(m.inscritos, (y.invi && y.invi.unidos) || 0)); } });
    const red = (k, href, t) => h("a", { class: "btn chico", href: typeof href === "function" ? href() : href, target: "_blank", rel: "noopener", onpointerdown: typeof href === "function" ? (e) => { e.currentTarget.href = href(); } : null }, ico(k), h("span", { text: t }));
    const v = y.practica ? primiciasVivas() : null;
    return tarjeta(y.practica ? "Pre-registro · tu escalera del Sembrador" : "Invita a leer · escalera del Sembrador", ico("compartir"),
      v ? h("div", { class: "jg-campana mini" }, h("p", { class: "jg-quedan" }, "Primicias: quedan ", v.quedan, " de 1440 · ", v.ins), h("div", { class: "jg-barra oro", "aria-hidden": "true" }, v.barra),
        y.fundador ? h("p", { class: "jg-mini", text: "La tuya ya está reservada: Primicia n.º " + fmt(y.n) + "." } ) : null, cuentaAtras(y.lanzamiento)) : null,
      h("p", { text: "Tu enlace propio: quien entra con él recibe 3 horas de lectura con experiencia doble, y cada persona que confirma su lugar te sube en la escalera." }),
      h("div", { class: "jg-enlace" }, h("code", { text: url.replace(/^https:\/\//, "") }),
        h("button", { class: "btn oro chico", type: "button", onclick: compartirInvitacion }, ico("compartir"), h("span", { text: "Compartir" })),
        h("button", { class: "btn chico", type: "button", onclick: () => copiar(url, "Enlace copiado") }, ico("copiar"), h("span", { text: "Copiar" }))),
      elegirMensaje(),
      h("div", { class: "jg-redes" },
        red("chat", () => "https://wa.me/?text=" + encodeURIComponent(textoInv() + " " + url), "WhatsApp"),
        red("facebook", "https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(url), "Facebook"),
        red("avion", () => "https://t.me/share/url?url=" + encodeURIComponent(url) + "&text=" + encodeURIComponent(textoInv()), "Telegram"),
        red("publicar", () => "https://twitter.com/intent/tweet?text=" + encodeURIComponent(textoInv()) + "&url=" + encodeURIComponent(url), "X"),
        red("correo", () => "mailto:?subject=" + encodeURIComponent("Te invito a Escudriña · El Códice Viviente") + "&body=" + encodeURIComponent(textoInv() + "\n\n" + url), "Correo"),
        h("button", { class: "btn chico", type: "button", "aria-label": "Imagen para compartir", onclick: () => verTarjetaImagen({ tipo: "prerregistro" }) }, ico("imagen"), h("span", { text: "Imagen" }))),
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
      if ((etiquetas && n.k === 1) || (etiq2 && n.k === 2)) { const c = Math.cos(a.a), sn = Math.sin(a.a), fs = n.k === 1 ? 31 : 26; et = '<text x="' + f1(a.x + (r + 12) * c) + '" y="' + f1(a.y + (r + 12) * sn + fs * 0.35 - (n.pa && sn < -0.3 ? fs * 0.98 : 0)) + '" text-anchor="' + (c > 0.3 ? "start" : c < -0.3 ? "end" : "middle") + '" font-size="' + fs + '" fill="' + (n.k === 1 ? "var(--tinta)" : "var(--tinta-2)") + '" style="font-family:var(--f-ui)">' + esc(n.a) +
        // BiEx (10-nov-2026): el país bajo el apodo, en letra menor
        (n.pa ? '<tspan x="' + f1(a.x + (r + 12) * c) + '" dy="' + f1(fs * 0.98) + '" font-size="' + f1(fs * 0.66) + '" fill="var(--tenue)">' + esc(nombrePais(n.pa)) + "</tspan>" : "") + "</text>"; }
      s += '<g class="jg-nodo g' + n.k + '" data-c="' + esc(n.c) + '"' + (mini ? "" : ' tabindex="0" role="button" aria-label="' + esc(n.a + (n.pa ? " (" + nombrePais(n.pa) + ")" : "") + ", " + ordGen(n.k) + " generación" + (n.ok ? ", confirmó su lugar" : "") + (n.d ? ", " + n.d + " en sus ramas" : "")) + '"') + ">" +
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
    v: '<circle cx="12" cy="3.9" r="1.6" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M12 5.5v7.9" stroke="currentColor" stroke-width="1.5"/><path d="M9.3 13.4h5.4l-.8 2.5L12 21.4l-1.9-5.5z" fill="currentColor"/>', // la plomada (Amós 7:7-8), colgada de su argolla
    c: '<path d="M12 3l7 3v5c0 4.6-3 8.4-7 10-4-1.6-7-5.4-7-10V6z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8.5 12l2.4 2.4 4.6-4.8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    // balanza inclinada sobre su fiel (sin poste ni travesaño en forma de cruz; BiEx, 10-nov-2026)
    j: '<path d="M12 10.6L9.4 20h5.2z" fill="currentColor"/><path d="M8.2 21h7.6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M3.8 9.9L20.2 6.7" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><circle cx="12" cy="8.3" r="1.25" fill="currentColor"/>' +
      '<path d="M4.4 9.8L2.6 14.6M4.4 9.8L6.2 14.6M19.6 6.8L17.8 11.6M19.6 6.8L21.4 11.6" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/><path d="M2 14.6h4.8a2.4 1.7 0 0 1-4.8 0zM17.2 11.6H22a2.4 1.7 0 0 1-4.8 0z" fill="currentColor"/>',
    // ramo de olivo (Bᵉrēʾšī́ṯ 8:11 en la tradición, Génesis): la paz (BiEx, 10-nov-2026: sin formas de cruz)
    p: '<path d="M4.5 19.5C8.5 16 12.5 11.5 19.5 4.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +
      '<path d="M8 16.2c-2.6-.2-3.9-1.6-4.1-3.6 2.4-.1 3.8 1.3 4.1 3.6zM8.4 15.8c.4-2.6 1.9-3.8 3.9-3.9-.1 2.4-1.6 3.7-3.9 3.9zM12.2 11.7c-2.5-.5-3.6-2-3.6-4 2.4.2 3.6 1.7 3.6 4zM12.7 11.3c.6-2.5 2.2-3.5 4.2-3.4-.3 2.3-1.9 3.5-4.2 3.4zM16.4 7.5c-2-.7-2.8-2.1-2.6-3.8 2 .4 2.9 1.8 2.6 3.8z" fill="currentColor"/><circle cx="17.6" cy="9.6" r="1.25" fill="currentColor"/>',
    // la lámpara encendida (Salmo 119:105 en la tradición), no un sol con rayos (BiEx, 10-nov-2026)
    r: '<path d="M3.2 14.6c3 2.7 9.6 2.7 13.6 0l3.2-2.3c.6-.4.3-1.3-.5-1.2l-4 .6c-1.1-1-2.7-1.5-4.6-1.5-3.4 0-6.4 1.6-7.7 4.4z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>' +
      '<path d="M7.4 10.2C5.9 8.6 6.4 6.4 8.3 4.3c.4 1.7 1.4 2.5 1.4 3.9 0 1.1-.8 1.9-2.3 2z" fill="currentColor"/><path d="M9.6 17.8v2M6.6 20.6h6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
    b: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" fill="none" stroke="currentColor" stroke-width="1.8"/>',
  };
  const GR_COL = ["rgba(255,255,255,.12)", "#ece4cf", "#c98c4c", "#d3dae3", "#f4c652", "url(#av-gema)"];
  let PODER = null;
  async function cargarPoder(forzar) {
    if (!forzar && PODER && Date.now() - PODER.t < 15e3) return PODER;
    if (forzar === "previo" && PODER && Date.now() - PODER.t < 60e3) return PODER;
    if (CARGA_PODER) return CARGA_PODER;
    CARGA_PODER = cargarPoderRed().finally(() => { CARGA_PODER = null; }); return CARGA_PODER;
  }
  let CARGA_PODER = null;
  async function cargarPoderRed() {
    const r = await pedir("/poder"); if (r.error) return r;
    PODER = Object.assign(r, { t: Date.now() }); return PODER;
  }
  // generador determinista (el árbol de cada quien es único y siempre el mismo)
  const semilla32 = (s) => { let h = 2166136261; for (const ch of String(s || "biex")) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  const azar = (k) => () => { k = (k + 0x6d2b79f5) >>> 0; let t = k; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  function fotoUrl(f) { return /^[a-z0-9]{4,12}\.[0-9a-f]{10}$/.test(f || "") ? API_ABS + "/foto/" + f : ""; }
  let FOTO_N = 0, IO_ARBOL = null;
  // Árbol de poder (héroe de la sección)
  function arbolPoder(y, av, frutos) {
    const rnd = azar(semilla32(y.inv)), f1 = (v) => v.toFixed(1), ef = av.ef || {}, nivel = y.nivel || 1;
    const prof = 3 + Math.min(3, Math.floor(nivel / 8)), hojasMax = 110 + Math.min(420, Math.round((y.vt || 0) / 4));
    let ramas = "", luces = "", frut = "", hojas = 0;
    const puntas = [], brillos = [], frutXY = [];
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
        const dl = rnd() * 6, o = 0.35 + rnd() * 0.55; // (mismo orden de números que antes: el árbol de cada quien no cambia)
        luces += '<circle cx="' + f1(x + dx) + '" cy="' + f1(yy + dy) + '" r="' + f1(r) + '" opacity="' + o.toFixed(2) + '"/>';
        if (r > 7.5 && o > 0.55) brillos.push([x + dx, yy + dy, r, dl]);
      }
    }
    // frutos: las personas de tu siembra (hasta 24) en las puntas más altas
    const altas = puntas.slice().sort((a, b) => a[1] - b[1]);
    for (let i = 0; i < Math.min(24, frutos || 0, altas.length); i++) { const [x, yy] = altas[Math.floor(i * altas.length / Math.min(24, frutos, altas.length))];
      frutXY.push([x, yy]); frut += '<g><circle cx="' + f1(x) + '" cy="' + f1(yy) + '" r="13" fill="url(#ap-fruto)"/><circle cx="' + f1(x - 4) + '" cy="' + f1(yy - 4) + '" r="3.4" fill="#fff" opacity=".8"/></g>'; }
    // raíces: los seis atributos
    let raices = "", med = ""; const raizD = [];
    const claves = ["v", "c", "j", "p", "r", "b"], nombres = { v: "Veracidad", c: "Confiabilidad", j: "Justicia", p: "Placidez", r: "Dicho", b: "Salvífico" }; // K2 (12-nov-2026)
    claves.forEach((k, i) => {
      const val = ef[k] || 0, x = 105 + i * 158, yy = 1000 + (i % 2 ? 28 : 0), w = 5 + Math.min(20, val * 0.6), op = (0.35 + Math.min(0.65, val / 40)).toFixed(2), col = ATR_COL[k];
      const d = "M" + (488 + i * 5) + " 800C" + f1(470 + (x - 500) * 0.25) + " " + (880 + rnd() * 30).toFixed(0) + " " + f1(x + (500 - x) * 0.25) + " " + (900 + rnd() * 30).toFixed(0) + " " + x + " " + (yy - 46);
      raices += '<path d="' + d + '" stroke="' + col + '" stroke-width="' + f1(w + 10) + '" opacity=".14" fill="none" stroke-linecap="round"/><path d="' + d + '" stroke="' + col + '" stroke-width="' + f1(w) + '" opacity="' + op + '" fill="none" stroke-linecap="round"/>';
      raizD.push([d, col, val]);
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
    // Vida del árbol fuera del SVG (BiEx, 10-nov-2026: «está borroso»): el dibujo queda quieto y se rasteriza una sola vez a la
    // densidad real; los destellos de la copa, los frutos y las motas son capas pequeñas que solo cambian opacidad y posición
    // (las mueve el compositor, sin volver a pintar el árbol) y se detienen cuando el árbol sale de la pantalla.
    const pc = (x, yy) => "left:" + (x / 10).toFixed(2) + "%;top:" + (yy / 11.1).toFixed(2) + "%";
    const vida = h("div", { class: "ap-vida", "aria-hidden": "true" }, h("i", { class: "ap-copa-v" }));
    const paso = Math.max(1, Math.floor(brillos.length / 16));
    for (let i = 0, n = 0; i < brillos.length && n < 16; i += paso, n++) { const [x, yy, r, dl] = brillos[i];
      vida.append(h("i", { class: "ap-gl", style: pc(x, yy) + ";--s:" + (1.6 + r / 7).toFixed(2) + ";--d:" + dl.toFixed(2) + "s;--t:" + (4.6 + (i % 5) * 0.7).toFixed(1) + "s" })); }
    frutXY.slice(0, 8).forEach(([x, yy], i) => vida.append(h("i", { class: "ap-gl fr", style: pc(x, yy) + ";--s:4.2;--d:" + (i * 0.9).toFixed(1) + "s;--t:6.5s" })));
    for (let i = 0; i < 14; i++) vida.append(h("i", { class: "ap-mo", style: pc(80 + rnd() * 840, 160 + rnd() * 700) + ";--d:" + (rnd() * 9).toFixed(2) + "s;--t:" + (7 + rnd() * 6).toFixed(1) + "s" }));
    const el = A.svg('<defs><radialGradient id="ap-halo" cx=".5" cy=".42" r=".55"><stop offset="0" stop-color="#f5c64e" stop-opacity=".34"/><stop offset=".55" stop-color="#b9862f" stop-opacity=".1"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="ap-halo2"><stop offset="0" stop-color="#ffe9a8" stop-opacity=".55"/><stop offset="1" stop-color="#f5c64e" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="ap-tronco" x1="0" x2="1"><stop offset="0" stop-color="#4a3415"/><stop offset=".45" stop-color="#b8873a"/><stop offset=".6" stop-color="#e2b55a"/><stop offset="1" stop-color="#3b2a10"/></linearGradient>' +
      '<linearGradient id="ap-oro" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff2c4"/><stop offset=".5" stop-color="#f2c14e"/><stop offset="1" stop-color="#a8701a"/></linearGradient>' +
      '<radialGradient id="ap-copa" cx=".5" cy=".55" r=".5"><stop offset="0" stop-color="#ffe08a" stop-opacity=".30"/><stop offset=".6" stop-color="#f5c64e" stop-opacity=".1"/><stop offset="1" stop-color="#f5c64e" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="ap-fruto" cx=".38" cy=".35" r=".7"><stop offset="0" stop-color="#fff6d6"/><stop offset=".45" stop-color="#f5c64e"/><stop offset="1" stop-color="#9a5f12"/></radialGradient></defs>' +
      '<ellipse cx="500" cy="420" rx="500" ry="440" fill="url(#ap-halo)"/>' +
      '<ellipse cx="500" cy="300" rx="430" ry="250" fill="url(#ap-copa)" opacity=".85"/>' +
      '<path d="M500 806C452 790 448 640 470 470 482 446 518 446 530 470 552 640 548 790 500 806Z" fill="url(#ap-tronco)"/>' +
      '<path d="M488 790C476 700 478 600 490 500M512 792C524 700 522 600 510 500M500 800V520" fill="none" stroke="#2a1d0a" stroke-opacity=".45" stroke-width="3" stroke-linecap="round"/>' +
      '<path d="M430 818C462 796 478 786 500 776 522 786 538 796 570 818Z" fill="#3b2a10"/><ellipse cx="500" cy="818" rx="300" ry="26" fill="url(#ap-halo2)" opacity=".55"/>' +
      '<g class="ap-ramas" fill="none" stroke="url(#ap-tronco)" stroke-linecap="round">' + ramas + "</g>" + '<g class="ap-hojas" fill="#f7d77c">' + luces + "</g>" + frut +
      '<line x1="40" y1="812" x2="960" y2="812" stroke="url(#ap-oro)" stroke-opacity=".35" stroke-width="2"/>' + raices + med + corazon, "0 0 1000 1110");
    el.setAttribute("class", "ap-svg"); el.setAttribute("role", "img");
    el.setAttribute("aria-label", "Tu árbol: nivel " + nivel + ", " + Math.round(p * 100) + " % hacia el siguiente; " + claves.map((k) => nombres[k] + " " + (ef[k] || 0)).join(", ") + (frutos ? "; " + plural(frutos, "fruto de tu siembra", "frutos de tu siembra") : ""));
    // Savia (BiEx, 10-nov-2026: «me gustaba el movimiento de las raíces; vuélvelo más espectacular»): luces del color de cada
    // atributo suben por su raíz desde el medallón hasta el tronco, con su estela; cuantos más puntos tiene el atributo, más
    // luces y más rápidas. Capa aparte en las coordenadas del dibujo (offset-path): el árbol sigue quieto y nítido.
    const savia = h("div", { class: "ap-savia", "aria-hidden": "true" });
    raizD.forEach(([d, col, val], i) => {
      const n = 1 + Math.min(3, Math.floor(val / 8)), dur = Math.max(2.2, 4.8 - val * 0.06);
      for (let k = 0; k < n; k++) {
        const dl = -((dur * k) / n + i * 0.41);
        [[16, 1, 0], [11, 0.55, 0.07], [7, 0.3, 0.14]].forEach(([tam, op, lag]) => savia.append(h("i", { class: "ap-sv", style: "offset-path:path('" + d + "');--c:" + col + ";--t:" + dur.toFixed(2) + "s;--d:" + (dl - lag).toFixed(2) + "s;--s:" + tam + "px;--o:" + op })));
      }
    });
    savia.append(h("b", { class: "ap-bebe" }));
    const caja = h("div", { class: "ap-arbol" }, el, vida, savia);
    if (window.ResizeObserver) { const ro = new ResizeObserver(() => { const w = caja.clientWidth; if (w) savia.style.setProperty("--k", (w / 1000).toFixed(4)); }); ro.observe(caja); }
    if ("IntersectionObserver" in window) { if (!IO_ARBOL) IO_ARBOL = new IntersectionObserver((es) => { for (const e of es) e.target.classList.toggle("quieto", !e.isIntersecting); }); IO_ARBOL.observe(caja); }
    return caja;
  }
  // Figura por capas con la armadura (Efesios 6:13-17; nombres provisionales) y los accesorios. Vectorial y estática (se
  // dibuja una sola vez a la densidad real): cada pieza forjada es metal con luz, sombra y filo según su grado; la que falta
  // se insinúa con un trazo dorado tenue, para que la figura nunca se vea incompleta. Sin yelmo, la capucha del manto.
  let FA_N = 0;
  function figuraArmadura(av) {
    const g = (id) => Math.max(0, Math.min(5, (av.eq || {})[id] | 0)), acc = av.acc || {}, u = "fa" + (++FA_N) + "-";
    const MET = [null, ["#fbf6e6", "#e6d9b6", "#a8966a"], ["#ffd9a6", "#c9813f", "#5e3210"], ["#ffffff", "#c3ccd8", "#5f6b7a"], ["#fff3c4", "#f0c04a", "#8a5a0c"], ["#dcfff6", "#7fb8ff", "#7a4dff"]];
    const grad = (id, n) => { const c = MET[n]; return '<linearGradient id="' + u + id + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + c[0] + '"/><stop offset=".48" stop-color="' + c[1] + '"/><stop offset="1" stop-color="' + c[2] + '"/></linearGradient>'; };
    const piezas = ["coraza", "cinto", "calzado", "escudo", "yelmo", "espada"];
    let defs = piezas.filter((p) => g(p)).map((p) => grad(p, g(p))).join("");
    const auraC = { "aura-oro": "#f5c64e", "aura-zafiro": "#5b8cff", "aura-esmeralda": "#3ccf8e", "aura-amatista": "#b07cff", "aura-alba": "#ffb38a", "aura-columna": "#ff8a3d", "aura-nube": "#e3ecf8" }[acc.aura] || "#f5c64e";
    const mantoC = { "manto-lino": ["#efe7cf", "#9c9172"], "manto-escarlata": ["#c23a40", "#4e1014"], "manto-azul": ["#3a6fd0", "#101f4a"], "manto-purpura": ["#8e3fa6", "#2c0b38"] }[acc.manto] || ["#2f3a47", "#0b1015"];
    defs += '<radialGradient id="' + u + 'halo" cx=".5" cy=".42" r=".5"><stop offset="0" stop-color="' + auraC + '" stop-opacity="' + (acc.aura ? ".55" : ".3") + '"/><stop offset=".55" stop-color="' + auraC + '" stop-opacity=".08"/><stop offset="1" stop-color="' + auraC + '" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="' + u + 'haz" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6dc" stop-opacity="0"/><stop offset=".1" stop-color="#fff6dc" stop-opacity=".15"/><stop offset=".72" stop-color="#fff6dc" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="' + u + 'manto" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + mantoC[0] + '"/><stop offset="1" stop-color="' + mantoC[1] + '"/></linearGradient>' +
      '<linearGradient id="' + u + 'tela" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3d3124"/><stop offset=".5" stop-color="#4d3e2c"/><stop offset="1" stop-color="#1d1610"/></linearGradient>' +
      '<linearGradient id="' + u + 'piel" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ebc59c"/><stop offset=".55" stop-color="#c79a70"/><stop offset="1" stop-color="#7a5536"/></linearGradient>' +
      '<radialGradient id="' + u + 'suelo"><stop offset="0" stop-color="' + auraC + '" stop-opacity=".55"/><stop offset="1" stop-color="' + auraC + '" stop-opacity="0"/></radialGradient>';
    const F = (id) => "url(#" + u + id + ")";
    const fant = (d) => '<path d="' + d + '" fill="none" stroke="#e8cf94" stroke-opacity=".36" stroke-width="1.2" stroke-dasharray="3 3"/>'; // pieza por forjar
    const filo = 'stroke="rgba(0,0,0,.45)" stroke-width="1"';
    const brillo = (d) => '<path d="' + d + '" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1.1" stroke-linecap="round"/>';
    const chispa = (x, y, s) => '<path d="M' + x + " " + (y - s) + "L" + (x + s * 0.28) + " " + (y - s * 0.28) + "L" + (x + s) + " " + y + "L" + (x + s * 0.28) + " " + (y + s * 0.28) + "L" + x + " " + (y + s) + "L" + (x - s * 0.28) + " " + (y + s * 0.28) + "L" + (x - s) + " " + y + "L" + (x - s * 0.28) + " " + (y - s * 0.28) + 'Z" fill="#fff" opacity=".9"/>';
    const P = {
      coraza: "M93 90Q120 81 147 90L144 141Q120 153 96 141Z",
      hombros: "M74 98Q76 84 92 86L100 94Q90 98 84 108ZM166 98Q164 84 148 86L140 94Q150 98 156 108Z",
      cinto: "M94 147L146 147L147 160L93 160Z",
      escudo: "M146 128Q178 114 210 128L208 204Q178 228 148 204Z",
      espada: "M60.5 166L67.5 166L66.5 52L64 38L61.5 52Z",
      yelmo: "M104 60Q103 33 120 30Q137 33 136 60L132 63Q120 55 108 63Z",
      grebas: "M99 250L115 250L114 294L100 294ZM125 250L141 250L140 294L126 294Z",
    };
    const yelmo = g("yelmo");
    let s = "<defs>" + defs + "</defs>" +
      '<ellipse cx="120" cy="150" rx="118" ry="160" fill="' + F("halo") + '"/>' +
      '<path d="M96 0L144 0L200 320L40 320Z" fill="' + F("haz") + '"/>' +
      '<ellipse cx="120" cy="310" rx="88" ry="11" fill="' + F("suelo") + '"/>' +
      // manto (y la capucha, si no hay yelmo)
      '<path d="M88 92C70 140 56 222 48 306L192 306C184 222 170 140 152 92Z" fill="' + F("manto") + '"/>' +
      '<path d="M96 120C88 190 82 250 80 304M144 120C152 190 158 250 160 304M120 160C120 220 120 270 120 304" stroke="rgba(0,0,0,.28)" stroke-width="5" fill="none" stroke-linecap="round"/>' +
      '<path d="M88 92C70 140 56 222 48 306" stroke="' + mantoC[0] + '" stroke-opacity=".55" stroke-width="1.4" fill="none"/>' +
      (yelmo ? "" : '<path d="M101 64C99 40 107 25 120 24C133 25 141 40 139 64C138 76 134 84 126 90L114 90C106 84 102 76 101 64Z" fill="' + F("manto") + '"/>') +
      // piernas, faldón y torso de tela
      '<path d="M104 206L100 298L114 298L117 206ZM123 206L126 298L140 298L136 206Z" fill="#241c14"/>' +
      '<path d="M96 150L144 150L153 214Q120 224 87 214Z" fill="' + F("tela") + '"/>' +
      '<path d="M92 88Q120 79 148 88L145 152L95 152Z" fill="' + F("tela") + '"/>' +
      // brazos (la mano izquierda empuña la espada; la derecha sostiene el escudo)
      '<path d="M82 92C70 112 63 140 60 168L71 170C74 144 81 120 93 100Z" fill="' + F("tela") + '"/><circle cx="65" cy="172" r="6.5" fill="' + F("piel") + '"/>' +
      '<path d="M158 92C170 112 176 138 176 160L166 161C166 140 160 118 147 100Z" fill="' + F("tela") + '"/>' + (g("escudo") ? "" : '<circle cx="171" cy="164" r="6" fill="' + F("piel") + '"/>') +
      // cuello y rostro en penumbra, con la mirada encendida
      '<path d="M113.5 68h13v18h-13z" fill="#7a5536"/><ellipse cx="120" cy="56" rx="12.5" ry="15.5" fill="' + F("piel") + '"/>' +
      '<path d="M108.5 53.5Q120 49 131.5 53.5L131 57.8Q120 54.6 109 57.8Z" fill="rgba(40,22,10,.5)"/>' +
      '<circle cx="115" cy="56.5" r="1.15" fill="#fff8e6" opacity=".9"/><circle cx="125" cy="56.5" r="1.15" fill="#fff8e6" opacity=".9"/>' +
      '<path d="M120 58L118.7 63.6L121.3 63.9" fill="none" stroke="rgba(60,34,16,.55)" stroke-width="1" stroke-linecap="round"/><path d="M116.5 66.8Q120 68.2 123.5 66.8" fill="none" stroke="rgba(60,34,16,.45)" stroke-width="1" stroke-linecap="round"/>' +
      '<path d="M132.4 55Q131.6 67.5 120 71.6Q127.5 66.8 129.4 57Z" fill="rgba(40,22,10,.32)"/>' +
      (yelmo ? "" : '<path d="M105 52Q105 33 120 32Q135 33 135 52Q129 41.5 120 41.5Q111 41.5 105 52Z" fill="' + F("manto") + '"/><path d="M106.5 51Q120 39 133.5 51L133 55Q120 45 107 55Z" fill="rgba(0,0,0,.38)"/>' +
        '<path d="M105 52Q105 33 120 32" fill="none" stroke="' + mantoC[0] + '" stroke-opacity=".6" stroke-width="1"/>');
    // grebas y sandalias
    s += g("calzado") ? '<path d="' + P.grebas + '" fill="' + F("calzado") + '" ' + filo + '/><ellipse cx="107" cy="250" rx="9" ry="6" fill="' + F("calzado") + '" ' + filo + '/><ellipse cx="133" cy="250" rx="9" ry="6" fill="' + F("calzado") + '" ' + filo + "/>" + brillo("M103 256L103 290M129 256L129 290")
      : fant(P.grebas);
    s += '<path d="M96 296h21v9q-12 3-24 0zM123 296h21q3 3 3 9q-12 3-24 0z" fill="' + (g("calzado") ? F("calzado") : "#1a140e") + '"' + (g("calzado") ? " " + filo : "") + "/>";
    // coraza con hombreras
    s += g("coraza") ? '<path d="' + P.hombros + '" fill="' + F("coraza") + '" ' + filo + '/><path d="' + P.coraza + '" fill="' + F("coraza") + '" ' + filo + "/>" +
      '<path d="M120 86V148M100 112Q110 120 120 112Q130 120 140 112M100 126Q120 134 140 126M101 136Q120 144 139 136" stroke="rgba(0,0,0,.28)" stroke-width="1.1" fill="none"/>' + brillo("M98 96Q106 92 114 92M78 96Q82 90 90 89") +
      (g("coraza") === 5 ? chispa(106, 100, 4) : "") : fant(P.coraza) + fant(P.hombros);
    // cinto con su hebilla y tiras
    if (g("cinto")) { let tiras = ""; for (let i = 0; i < 7; i++) tiras += '<rect x="' + (96 + i * 7) + '" y="161" width="5.6" height="' + (34 + (i % 2) * 4) + '" rx="2" fill="' + F("cinto") + '" opacity=".92" ' + filo + "/>";
      s += tiras + '<path d="' + P.cinto + '" fill="' + F("cinto") + '" ' + filo + '/><rect x="113" y="144" width="14" height="19" rx="3" fill="' + F("cinto") + '" stroke="rgba(0,0,0,.5)"/>' + (g("cinto") >= 4 ? '<circle cx="120" cy="153.5" r="3.4" fill="#fff" opacity=".85"/>' : ""); }
    else s += fant(P.cinto);
    // espada en alto
    s += g("espada") ? (g("espada") >= 4 ? '<path d="M64 160V44" stroke="' + (g("espada") === 5 ? "#9fe0ff" : "#ffe08a") + '" stroke-opacity=".45" stroke-width="7" stroke-linecap="round"/>' : "") +
      '<path d="' + P.espada + '" fill="' + F("espada") + '" ' + filo + '/><path d="M64.6 158V54" stroke="rgba(0,0,0,.28)" stroke-width="1.3"/><path d="M62.6 160V52" stroke="#fff" stroke-opacity=".6" stroke-width=".8"/>' +
      '<rect x="50" y="163" width="28" height="5.4" rx="2.7" fill="' + F("espada") + '" ' + filo + '/><rect x="61" y="168" width="6" height="15" rx="2" fill="#4a2f16"/><circle cx="64" cy="186" r="4.2" fill="' + F("espada") + '" ' + filo + "/>" +
      (g("espada") === 5 ? chispa(64, 42, 5) : "") : fant(P.espada + "M51 165.5h26");
    // escudo
    s += g("escudo") ? '<path d="' + P.escudo + '" fill="' + F("escudo") + '" stroke="rgba(0,0,0,.55)" stroke-width="1.6"/><path d="M152 133Q178 121 204 133L202 202Q178 220 154 202Z" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="1.2"/>' +
      // BiEx (10-nov-2026): en la armadura no va un libro sino un rollo: papiro desenrollado desde su vara, con dos columnas
      // de escritura y el borde inferior enrollado
      '<path d="M165 156.4H191V174.2Q185.6 176.9 178 175.2Q170.4 173.5 165 176.2Z" fill="rgba(0,0,0,.18)" stroke="rgba(0,0,0,.4)" stroke-width=".9"/>' +
      '<path d="M165 176.2Q170.4 173.5 178 175.2Q185.6 176.9 191 174.2Q192.6 178.3 189.4 179.5Q184.2 181 178 179.3Q171.2 177.6 166.6 180.1Q163.6 179.9 165 176.2Z" fill="rgba(0,0,0,.26)" stroke="rgba(0,0,0,.42)" stroke-width=".8"/>' +
      '<rect x="161.6" y="151.2" width="32.8" height="5.6" rx="2.8" fill="rgba(0,0,0,.24)" stroke="rgba(0,0,0,.45)" stroke-width=".9"/><path d="M163.4 152.6H192.6" stroke="#fff" stroke-opacity=".3" stroke-width=".7" stroke-linecap="round"/>' +
      '<ellipse cx="161.6" cy="154" rx="1.5" ry="3.3" fill="rgba(0,0,0,.3)" stroke="rgba(0,0,0,.45)" stroke-width=".7"/><ellipse cx="194.4" cy="154" rx="1.5" ry="3.3" fill="rgba(0,0,0,.3)" stroke="rgba(0,0,0,.45)" stroke-width=".7"/>' +
      '<path d="M168 160.2H176.4M168 163.4H176.4M168 166.6H175.2M168 169.8H176.4M180.2 160.2H188.4M180.2 163.4H187.2M180.2 166.6H188.4M180.2 169.8H186.6" fill="none" stroke="#fff" stroke-opacity=".42" stroke-width=".8" stroke-linecap="round"/>' + brillo("M156 136Q170 128 186 128") +
      (g("escudo") === 5 ? chispa(196, 140, 4.5) : "") : fant(P.escudo);
    // yelmo con cimera
    s += yelmo ? '<path d="M120 31C121 15 134 6 152 12C140 15 130 22 125 33Z" fill="' + (yelmo >= 4 ? F("yelmo") : "#9b2c2c") + '"/><path d="' + P.yelmo + '" fill="' + F("yelmo") + '" ' + filo + '/><path d="M106 60L109 74L114 70M134 60L131 74L126 70" fill="' + F("yelmo") + '" ' + filo + "/>" + brillo("M110 42Q114 34 122 33") + (yelmo === 5 ? chispa(136, 36, 4) : "")
      : fant(P.yelmo);
    // corona y sello
    if (acc.corona) { const mirto = acc.corona === "corona-laurel", verde = mirto ? "#5f9a4c" : "#8fbf6a", cy = yelmo ? 45 : 43; let h2 = "";
      for (let i = 0; i < 6; i++) for (const a of [Math.PI * (1.08 + i * 0.07), Math.PI * (1.92 - i * 0.07)]) { const x = 120 + 17 * Math.cos(a), y = cy + 9 * Math.sin(a);
        h2 += '<ellipse cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" rx="3.4" ry="1.6" transform="rotate(' + ((a * 180) / Math.PI + 90).toFixed(0) + " " + x.toFixed(1) + " " + y.toFixed(1) + ')" fill="' + verde + '"/>'; if (mirto && i % 2) h2 += '<circle cx="' + x.toFixed(1) + '" cy="' + (y - 1.6).toFixed(1) + '" r=".9" fill="#fffaf0"/>'; }
      s += h2; }
    if (acc.sello && SELLO_RARO[acc.sello]) s += '<g transform="translate(110.4 104.4) scale(.4)"><circle cx="24" cy="24" r="19" fill="#f2c14e" stroke="#7a5212" stroke-width="2"/>' + SELLO_RARO[acc.sello] + "</g>";
    else if (acc.sello) s += '<circle cx="120" cy="114" r="7.5" fill="#f2c14e" stroke="#7a5212"/>' + (acc.sello === "sello-estrella" ? '<path d="M114.6 116.6h10.8" stroke="#7a5212" stroke-width="1.2" stroke-linecap="round"/><circle cx="120" cy="112.8" r="3.9" fill="#fff6d6" opacity=".4"/><circle cx="120" cy="112.8" r="2.1" fill="#fffaf0"/>' : '<path d="M116.5 116h7l-1.2 2.6h-4.6zM118.5 116c0-3 1.5-5 1.5-5s1.5 2 1.5 5" fill="#7a5212"/>');
    // (BiEx, 12-nov-2026) al elegir qué forjar, la pieza se ilumina en la figura: capas vectoriales que solo cambian de opacidad
    // (empiezan en opacity="0", así una copia de la figura sin estas reglas, como la imagen para compartir, no las muestra)
    const LUZ_PZ = { coraza: P.coraza + P.hombros, cinto: P.cinto, calzado: P.grebas, escudo: P.escudo, yelmo: P.yelmo, espada: P.espada };
    s += '<defs><filter id="' + u + 'luz" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="3.4"/></filter></defs>' +
      Object.entries(LUZ_PZ).map(([k, d]) => '<g class="fa-luz" data-pz="' + k + '" opacity="0"><path d="' + d + '" fill="#ffe6a3" fill-opacity=".2" stroke="#ffe39a" stroke-width="5" filter="url(#' + u + 'luz)"/><path d="' + d + '" fill="none" stroke="#fff4cf" stroke-width="1.5" stroke-linejoin="round"/></g>').join("");
    const el = A.svg(s, "0 0 240 320"); el.setAttribute("class", "av-fig"); el.setAttribute("role", "img");
    el.setAttribute("aria-label", "Tu ser interior, con su armadura: " + piezas.map((p) => p + " " + (g(p) ? "grado " + g(p) : "por forjar")).join(", "));
    return el;
  }
  const errPoder = (r) => r.error === "sin_dracmas" ? "Te faltan " + fmt(r.falta || 0) + " dracmas: cada perícopa leída te acerca" : r.error === "sin_cantos" ? "Te faltan " + plural(r.falta || 1, "canto", "cantos") + " para esa forja: aparecen al leer" : r.error === "sin_puntos" ? "No tienes tantos puntos por repartir" : r.error === "tope" ? "Ya llegaste al tope" : r.error === "ya_tienes" ? "Ya lo tienes" : mensaje(r);
  async function accionPoder(ruta, cuerpo, ok) {
    const r = await pedir(ruta, { metodo: "POST", cuerpo: cuerpo || {} });
    if (r.error) { A.avisar(errPoder(r)); return null; }
    if (r.yo) actualizarYo(r.yo); PODER = null;
    if (ok) A.avisar(ok); sonar("chispa"); vibrar([10, 30, 12]);
    return r;
  }
  // Atributos (BiEx, 10-nov-2026: «más compacto, impactante y épico»): seis medallones en rejilla simétrica (3 × 2 en
  // teléfonos, 6 en fila en pantallas anchas); al tocar uno se lee qué hace en la línea de abajo.
  function tarjetaAtributos(y, P, rehacer) {
    const av = P.av, defs = P.def.atrib, plan = {}; let libres = av.pts;
    const lista = h("ul", { class: "ap-atr" });
    const desc = h("p", { class: "ap-desc", "aria-live": "polite", text: "Cada nivel te da " + P.def.ptsNivel + " puntos: repártelos como quieras (la armadura suma 2 por grado a su atributo). Toca un atributo para ver qué hace." });
    const ver = (n, efecto, li) => { desc.replaceChildren(h("b", { text: n + ": " }), efecto + "."); for (const x of lista.children) x.classList.toggle("sel", x === li); };
    for (const [k, n, efecto] of defs) {
      const val = h("b", { class: "ap-val", text: String(av.ef[k]) }), mas = h("span", { class: "ap-plan" }), li = h("li", { style: "--ac:" + ATR_COL[k] });
      const pint = () => { mas.textContent = plan[k] ? "+" + plan[k] : ""; val.textContent = String(av.ef[k] + (plan[k] || 0)); li.classList.toggle("sube", !!plan[k]); };
      const btn = (dd, t, lbl) => h("button", { class: "ap-b", type: "button", "aria-label": lbl + " " + n, onclick: () => {
        ver(n, efecto, li);
        if (dd > 0 && libres <= 0) return A.avisar(av.pts ? "Ya repartiste todos tus puntos" : "Sube de nivel o compra un punto en la tienda");
        if (dd < 0 && !plan[k]) return;
        plan[k] = (plan[k] || 0) + dd; libres -= dd; pint(); total(); vibrar(6); } }, t);
      li.append(h("button", { class: "ap-cara", type: "button", "aria-label": n + " " + av.ef[k] + ": " + efecto, onclick: () => ver(n, efecto, li) },
        h("span", { class: "ap-ico", "aria-hidden": "true" }, A.svg(ATR_ICO[k])), h("span", { class: "ap-nom", text: n }), h("span", { class: "ap-v" }, val, mas)),
        h("span", { class: "ap-bs" }, btn(-1, "−", "Quitar un punto de"), btn(1, "+", "Sumar un punto a")));
      lista.append(li);
    }
    const quedan = h("span", { class: "ap-pts" }), confirmar = h("button", { class: "btn oro", type: "button", disabled: true, onclick: async (e) => {
      e.currentTarget.disabled = true; const r = await accionPoder("/poder/repartir", { at: plan }, "Puntos repartidos"); if (r) { chispas(16); rehacer(); } else e.currentTarget.disabled = false; } }, h("span", { text: "Repartir" }));
    function total() { const n = Object.values(plan).reduce((a, x) => a + x, 0); quedan.replaceChildren(h("b", { text: String(libres) }), " " + (libres === 1 ? "punto por repartir" : "puntos por repartir")); confirmar.disabled = !n; }
    total();
    const gratis = av.sem !== semanaClave();
    return tarjeta("Atributos", ico("arbol"), h("div", { class: "ap-cab" }, quedan, h("span", { class: "ap-poder" }, "Poder ", h("b", { text: fmt(av.poder) }))),
      lista, desc,
      h("div", { class: "jg-acciones ap-acc-b" }, confirmar,
        h("button", { class: "btn", type: "button", onclick: async () => { const r = await accionPoder("/tienda/comprar", { item: "punto" }, "Compraste un punto de atributo"); if (r) rehacer(); } }, h("span", { text: "Comprar punto · " + fmt(av.precioPunto) + " dr." })),
        av.tot - av.pts > 0 ? h("button", { class: "btn", type: "button", onclick: async () => { const r = await accionPoder("/poder/reasignar", {}, "Tus puntos volvieron: repártelos de nuevo"); if (r) rehacer(); } }, h("span", { text: gratis ? "Reasignar (gratis esta semana)" : "Reasignar · 60 dr." })) : null));
  }
  const semanaClave = () => { const d = new Date(), j = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())), dia = (j.getUTCDay() + 6) % 7; j.setUTCDate(j.getUTCDate() - dia + 3); const y0 = new Date(Date.UTC(j.getUTCFullYear(), 0, 4)); return j.getUTCFullYear() + "-" + String(1 + Math.round(((j - y0) / 864e5 - 3 + ((y0.getUTCDay() + 6) % 7)) / 7)).padStart(2, "0"); };
  const ICO_FORJA = '<path d="M5 20h9M7.5 16.5h4l1 3.5h-6zM13.6 4.2l5.6 5.6-2.3 2.3-1.6-1.6-5.4 5.4-1.8-1.8 5.4-5.4-1.6-1.6z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>';
  // Armadura: la figura y las seis piezas en rejilla (2 × 3) con su grado en cinco cuentas; la pieza elegida muestra abajo
  // qué gana con la forja siguiente y el botón para forjarla (se elige sola la primera que ya se puede forjar).
  function tarjetaArmadura(y, P, rehacer) {
    const av = P.av, d = P.def, cantos = (P.piedras || []).reduce((a, x) => a + x, 0);
    const puede = (gr) => { const s = d.forja[gr + 1]; return !!s && P.dr >= s.dr && cantos >= s.cantos; };
    const piezas = h("ul", { class: "ap-piezas" }), det = h("div", { class: "ap-forja", "aria-live": "polite" });
    const fig = h("div", { class: "ap-fig" }, figuraArmadura(av));
    const elegir = (i) => {
      const [id, n, at] = d.piezas[i], gr = av.eq[id] | 0, sig = d.forja[gr + 1], nAt = (d.atrib.find((a) => a[0] === at) || [])[1];
      [...piezas.children].forEach((li, j) => li.classList.toggle("sel", j === i));
      for (const gz of fig.querySelectorAll(".fa-luz")) gz.classList.toggle("on", gz.getAttribute("data-pz") === id);
      det.replaceChildren(h("span", { class: "ap-n" }, h("b", { text: n + " · " + d.grados[gr] + (sig ? " › " + d.grados[gr + 1] : "") }),
        h("small", { text: "Fortalece " + nAt + " (+" + 2 * gr + (sig ? " › +" + 2 * (gr + 1) : "") + ")" + (sig ? " · " + sig.dr + " dr." + (sig.cantos ? " + " + plural(sig.cantos, "canto", "cantos") : "") : " · grado máximo") })),
        sig ? h("button", { class: "btn chico" + (puede(gr) ? " oro" : ""), type: "button", onclick: async (e) => { const b = e.currentTarget; b.disabled = true;
          const r = await accionPoder("/tienda/comprar", { item: "forja:" + id }, n + " forjado en " + d.grados[gr + 1].toLowerCase()); if (r) { chispas(18); rehacer(); } else b.disabled = false; } },
          A.svg(ICO_FORJA), h("span", { text: "Forjar" })) : h("span", { class: "jg-chip", text: "Máximo" }));
    };
    d.piezas.forEach(([id, n], i) => { const gr = av.eq[id] | 0, col = gr === 5 ? "#9ff3e0" : GR_COL[gr];
      piezas.append(h("li", { class: puede(gr) ? "lista" : "" }, h("button", { class: "ap-pz", type: "button", "aria-label": n + ": " + d.grados[gr] + (puede(gr) ? ", lista para forjar" : ""), onclick: () => elegir(i) },
        h("span", { class: "ap-pz-n", text: n }), h("span", { class: "ap-pips", "aria-hidden": "true" }, [1, 2, 3, 4, 5].map((k) => h("i", k <= gr ? { class: "on", style: "--gc:" + col } : {}))))));
    });
    let i0 = d.piezas.findIndex(([id]) => puede(av.eq[id] | 0)); if (i0 < 0) i0 = d.piezas.findIndex(([id]) => (av.eq[id] | 0) < 5); elegir(Math.max(0, i0));
    // la cita, con una lumbrerita que invita a tocarla: abre los versos (BiEx, 12-nov-2026)
    const cita = A.nombreLibro("EPH") + " 6:13-17";
    // «Ser interior» (BiEx, 12-nov-2026, U3): la figura que se arma es el ser interior de quien lee (Ἐfέsιοι 3:16; 2 Κοrίndsιοι 4:16)
    const citaSI = A.nombreLibro("EPH") + " 3:16";
    return tarjeta("Tu ser interior", ico("liga"), h("div", { class: "ap-arm" }, fig, piezas), det,
      h("p", { class: "ap-nota" }, "Su armadura: ", h("button", { class: "ap-cita", type: "button", title: "Ver lo que dice", "aria-label": "Ver " + cita, onclick: () => verCita("EPH", 6, 13, 17) },
        h("i", { class: "ap-lumbre", "aria-hidden": "true" }), cita), " · el ser interior: ", h("button", { class: "ap-cita", type: "button", title: "Ver lo que dice", "aria-label": "Ver " + citaSI, onclick: () => verCita("EPH", 3, 16, 16) },
        h("i", { class: "ap-lumbre", "aria-hidden": "true" }), citaSI), " · " + d.grados.slice(1).join(" › ") + " · desde la plata la forja pide cantos"));
  }
  function verCita(c, cap, v1, v2) {
    const ref = A.nombreLibro(c) + " " + cap + ":" + v1 + (v2 && v2 !== v1 ? "-" + v2 : ""), cuerpo = h("div", { class: "jg-cita-v" }, h("p", { class: "cargando", text: "Cargando…" }));
    A.abrirModal(() => A.cajaModal(A.cabModal(ref, "Escudriña"), cuerpo,
      h("div", { class: "jg-acciones" }, h("a", { class: "btn chico oro", href: "#/" + c + "/" + cap + "/l/" + v1, onclick: () => A.cerrarModal() }, A.svg(A.ICO.libro || A.ICO.seguir), h("span", { text: "Leer en el capítulo" })))));
    (A.versos ? A.versos(c, cap, v1, v2 || v1) : Promise.reject(new Error("sin versos"))).then((l) => {
      cuerpo.replaceChildren(...l.map(([v, nodo]) => h("p", {}, h("sup", { text: String(v) }), " ", nodo)));
    }).catch(() => { cuerpo.replaceChildren(h("p", { text: "No se pudo cargar el texto. Ábrelo en el capítulo." })); });
  }
  // Muestra de cada accesorio (48 × 48), sin degradados con id para poder repetirse en la página
  // los accesorios raros (por si la configuración del servidor aún no los trae): [id, ranura, nombre, cita]
  const RAROS_C = [["aura-columna", "aura", "Aura de la columna de fuego", "Éxodo 13:21"], ["corona-palmas", "corona", "Lauro de palmas", "Ἀpοκάlυpsις 7:9"], ["manto-purpura", "manto", "Manto de púrpura", "Prάc̅ṣεις 16:14"],
    ["sello-rollo", "sello", "Sello del rollo de siete sellos", "Ἀpοκάlυpsις 5:1"], ["aura-nube", "aura", "Aura de la columna de nube", "Éxodo 13:21"], ["sello-candelero", "sello", "Sello del candelero de oro", "Ἀpοκάlυpsις 1:12"]];
  const AURA_C = { "aura-oro": "#f5c64e", "aura-zafiro": "#5b8cff", "aura-esmeralda": "#3ccf8e", "aura-amatista": "#b07cff", "aura-alba": "#ffb38a", "aura-columna": "#ff8a3d", "aura-nube": "#e3ecf8" };
  const MANTO_C = { "manto-lino": ["#efe7cf", "#9c9172"], "manto-escarlata": ["#d0454b", "#5e1418"], "manto-azul": ["#4a7fe0", "#14275a"], "manto-purpura": ["#9a48b3", "#2f0c3b"] };
  // sellos raros (vitrina y pecho de la figura): el rollo con sus siete sellos y el candelero de siete brazos
  const SELLO_RARO = {
    "sello-rollo": '<rect x="14" y="16" width="20" height="16" rx="2" fill="#fff3d0" stroke="#7a5212"/><rect x="12" y="14.5" width="24" height="3.4" rx="1.7" fill="#c9a865" stroke="#7a5212" stroke-width=".8"/><rect x="12" y="30.2" width="24" height="3.4" rx="1.7" fill="#c9a865" stroke="#7a5212" stroke-width=".8"/>' +
      [16.5, 20.2, 23.9, 27.6, 31.3].map((x) => '<circle cx="' + x + '" cy="24" r="1.45" fill="#b0302c"/>').join("") + '<circle cx="18.4" cy="27.8" r="1.25" fill="#b0302c"/><circle cx="29.6" cy="27.8" r="1.25" fill="#b0302c"/>',
    "sello-candelero": '<path d="M24 34V17M17 20c0 6 3 9 7 9s7-3 7-9M13.5 19c0 9 4.6 13.4 10.5 13.4S34.5 28 34.5 19M20.5 21.5c0 3 1.4 4.6 3.5 4.6s3.5-1.6 3.5-4.6" fill="none" stroke="#7a5212" stroke-width="1.5" stroke-linecap="round"/><path d="M19 37h10" stroke="#7a5212" stroke-width="1.8" stroke-linecap="round"/>' +
      [13.5, 17, 20.5, 24, 27.5, 31, 34.5].map((x) => '<path d="M' + x + ' 18.2c-1.3-1.3-1-2.8 0-4.3 1 1.5 1.3 3 0 4.3z" fill="#ffb347"/>').join(""),
  };
  function muestraAcc(id, ran) {
    if (ran === "aura") { const c = AURA_C[id] || "#f5c64e";
      return '<circle cx="24" cy="24" r="22" fill="' + c + '" opacity=".08"/><circle cx="24" cy="24" r="17" fill="' + c + '" opacity=".14"/><circle cx="24" cy="24" r="11.5" fill="' + c + '" opacity=".32"/><circle cx="24" cy="24" r="6.5" fill="' + c + '" opacity=".75"/><circle cx="24" cy="24" r="3" fill="#fff" opacity=".9"/>'; }
    if (ran === "manto") { const [a, b] = MANTO_C[id] || ["#2f3a47", "#0b1015"];
      return '<path d="M17 9Q24 6 31 9L41 42Q24 46 7 42Z" fill="' + b + '"/><path d="M17 9Q24 6 31 9L36 41Q24 44 12 41Z" fill="' + a + '" opacity=".92"/><path d="M20 14L17 40M28 14L31 40M24 13V42" stroke="rgba(0,0,0,.22)" stroke-width="1.6" fill="none" stroke-linecap="round"/><circle cx="24" cy="10.5" r="3" fill="#f2c14e" stroke="#7a5212"/>'; }
    if (ran === "sello" && SELLO_RARO[id]) return '<circle cx="24" cy="24" r="19" fill="#f2c14e" stroke="#7a5212" stroke-width="1.5"/>' + SELLO_RARO[id];
    if (ran === "corona") { const v = id === "corona-laurel" ? "#5f9a4c" : id === "corona-palmas" ? "#a9c94a" : "#8fbf6a"; let s = "";
      for (let i = 0; i < 7; i++) for (const lado of [-1, 1]) { const g = (lado < 0 ? 200 - i * 24 : -20 + i * 24) * Math.PI / 180, x = 24 + 15 * Math.cos(g), y = 26 + 15 * Math.sin(g);
        s += '<ellipse cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" rx="' + (id === "corona-palmas" ? "6.2" : "4.6") + '" ry="' + (id === "corona-palmas" ? "1.3" : "2") + '" transform="rotate(' + ((g * 180) / Math.PI + 90 + lado * 32).toFixed(0) + " " + x.toFixed(1) + " " + y.toFixed(1) + ')" fill="' + v + '"/>'; }
      return s + '<path d="M20 41.5c2.6 1.4 5.4 1.4 8 0" fill="none" stroke="#f2c14e" stroke-width="1.6" stroke-linecap="round"/>' + (id === "corona-olivo" ? '<circle cx="15" cy="17" r="1.8" fill="#4b6b2a"/><circle cx="33" cy="17" r="1.8" fill="#4b6b2a"/>' : '<circle cx="11.5" cy="24" r="1.3" fill="#fffaf0"/><circle cx="36.5" cy="24" r="1.3" fill="#fffaf0"/><circle cx="16" cy="13.6" r="1.1" fill="#fffaf0"/><circle cx="32" cy="13.6" r="1.1" fill="#fffaf0"/>'); }
    return '<circle cx="24" cy="24" r="17" fill="#f2c14e" stroke="#7a5212" stroke-width="1.5"/><circle cx="24" cy="24" r="13" fill="none" stroke="#7a5212" stroke-width="1" stroke-dasharray="2 2"/>' +
      (id === "sello-estrella" ? '<path d="M13.5 29.5h21" stroke="#7a5212" stroke-width="1.9" stroke-linecap="round"/><path d="M17 33.6h14" stroke="#7a5212" stroke-width="1.3" stroke-linecap="round" opacity=".7"/><circle cx="24" cy="22.4" r="6.6" fill="#fff6d6" opacity=".4"/><circle cx="24" cy="22.4" r="3.4" fill="#fffaf0"/>' : '<path d="M17 29h14l-2.2 4h-9.6zM20.5 29c0-5 3.5-9 3.5-9s3.5 4 3.5 9" fill="#7a5212"/><path d="M24 14.5c1.6 1.8 1.6 3.6 0 5-1.6-1.4-1.6-3.2 0-5z" fill="#fff6d6"/>');
  }
  const ICO_USO = {
    pergamino: '<path d="M7 4.5h9.5a2.5 2.5 0 0 1 0 5H9v9.5a2 2 0 0 1-4 0V6.5a2 2 0 0 1 2-2z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M9 9.5h8.5V18a2 2 0 0 1-2 2H7" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M11.5 13h3.5M11.5 16h2.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
    descanso: '<path d="M18.5 15.2A7.5 7.5 0 0 1 8.8 5.5a7.5 7.5 0 1 0 9.7 9.7z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M15.5 4.5h3l-3 3.5h3" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>',
    apodo: '<path d="M4 20l1.2-4.6L15.8 4.8a2 2 0 0 1 2.8 0l.6.6a2 2 0 0 1 0 2.8L8.6 18.8z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M13.8 6.8l3.4 3.4" stroke="currentColor" stroke-width="1.6"/>',
  };
  // Tienda: saldo a la vista, objetos de uso en filas finas y los accesorios en una vitrina por pestañas (una ranura a la vez)
  function tarjetaTienda(y, P, rehacer) {
    const av = P.av, d = P.def;
    const comprar = async (e, item, ok, fx) => { const b = e.currentTarget; b.disabled = true; const r = await accionPoder("/tienda/comprar", { item }, ok); if (r) { if (fx) chispas(fx); rehacer(); } else b.disabled = false; };
    const fila = (ic, n, ds, boton) => h("li", {}, h("span", { class: "ap-ui", "aria-hidden": "true" }, A.svg(ICO_USO[ic])), h("span", { class: "ap-n" }, h("b", { text: n }), h("small", { text: ds })), boton);
    const uso = h("ul", { class: "ap-uso" }, d.uso.map(([id, n, pr, ds]) => fila(id, n, ds, h("button", { class: "btn chico" + (P.dr >= pr ? " oro" : ""), type: "button", onclick: (e) => comprar(e, "uso:" + id, n + ": listo") }, h("span", { text: pr + " dr." })))),
      fila("apodo", "Cambio de apodo", "Una vez cada 3 semanas", h("a", { class: "btn chico", href: "#/escudrina/cuenta" }, h("span", { text: ((y.apodoCambio && y.apodoCambio.precio) || 120) + " dr." }))));
    const NOM = { aura: "Auras", manto: "Mantos", corona: "Lauros", sello: "Sellos" };
    // Qué da cada accesorio (BiEx, 12-nov-2026): +25 de poder al tenerlo (cifra de tu ser interior), se luce en el emblema y en
    // el Árbol, y cada uno con su enseñanza (tema en palabras de Claude, con la cita para leerla en BiEx)
    const DA = { "aura-oro": ["La luz que desciende de lo alto", "JAS", "1:17"], "aura-zafiro": ["El zafiro, segundo fundamento", "REV", "21:19"], "aura-esmeralda": ["El arco alrededor del trono, como de esmeralda", "REV", "4:3"],
      "aura-amatista": ["La amatista, duodécimo fundamento", "REV", "21:20"], "aura-alba": ["La senda que brilla como la luz del alba", "", "Proverbios 4:18"],
      "manto-lino": ["El lino fino: las obras justas", "REV", "19:8"], "manto-escarlata": ["Vestidos de escarlata para el frío", "", "Proverbios 31:21"], "manto-azul": ["Los flecos con su cordón azul, para recordar", "", "Números 15:38-39"],
      "corona-olivo": ["El lauro incorruptible", "1CO", "9:25"], "corona-laurel": ["El mirto en lugar de la ortiga", "", "Isaías 55:13"],
      "sello-lampara": ["La lámpara sobre el candelero", "MAT", "5:15"], "sello-estrella": ["La estrella resplandeciente de la mañana", "REV", "22:16"] };
    const daAcc = (id, cita) => { const x = DA[id], ref = x ? (x[1] ? A.nombreLibro(x[1]) + " " + x[2] : x[2]) : cita || "";
      return "Da +25 de poder y se luce en tu emblema y en tu ser interior." + (x ? " " + x[0] + (ref ? " (" + ref + ")." : ".") : ref ? " Enseñanza: " + ref + "." : ""); };
    let ran = A.store.get("jg:tiendaRan", "aura"); if (!d.ranuras.includes(ran)) ran = d.ranuras[0];
    const vitrina = h("ul", { class: "ap-vitrina", "aria-live": "polite" });
    const pestanas = h("div", { class: "jg-seg fila", role: "group", "aria-label": "Accesorios" }, d.ranuras.map((r) => h("button", { type: "button", "aria-pressed": String(r === ran), onclick: (e) => {
      ran = r; A.store.set("jg:tiendaRan", r); for (const b of pestanas.children) b.setAttribute("aria-pressed", String(b === e.currentTarget)); pintarV(); vibrar(6); } }, NOM[r] || r)));
    function pintarV() {
      // los raros (70 fragmentos de papiro marcando «Leído») se ven en su vitrina: con candado mientras no se abren
      const raros = (d.raros || RAROS_C).filter((x) => x[1] === ran).map((x) => [x[0], x[1], x[2], null, x[3]]), frag = y.frag || { c: 0, meta: 70 };
      vitrina.replaceChildren(...d.acc.filter((x) => x[1] === ran).concat(raros).map(([id, , n, pr, cita]) => { const tiene = av.inv.includes(id), puesto = av.acc[ran] === id;
        if (pr == null && !tiene) return h("li", { class: "raro cerrado" }, h("span", { class: "ap-mu", "aria-hidden": "true" }, A.svg(muestraAcc(id, ran), "0 0 48 48")), h("span", { class: "ap-mn", text: n }),
          h("small", { class: "ap-raro", text: "Raro · se abre con 70 fragmentos de papiro (" + (frag.c || 0) + " de " + (frag.meta || 70) + ")" }), h("small", { class: "ap-da", text: daAcc(id, cita) }));
        return h("li", { class: puesto ? "puesto" : "", title: daAcc(id, cita) }, h("span", { class: "ap-mu", "aria-hidden": "true" }, A.svg(muestraAcc(id, ran), "0 0 48 48")), h("span", { class: "ap-mn", text: n }), h("small", { class: "ap-da", text: daAcc(id, cita) }),
          tiene ? h("button", { class: "btn chico" + (puesto ? "" : " oro"), type: "button", onclick: async (e) => { const b = e.currentTarget; b.disabled = true;
            const r = await accionPoder("/poder/equipar", { ranura: ran, id: puesto ? null : id }, puesto ? "Te lo quitaste" : "Equipado"); if (r) rehacer(); else b.disabled = false; } }, h("span", { text: puesto ? "Quitar" : "Equipar" }))
            : h("button", { class: "btn chico" + (P.dr >= pr ? " oro" : ""), type: "button", "aria-label": "Comprar " + n + " por " + pr + " dracmas", onclick: (e) => comprar(e, "acc:" + id, n + ": tuyo y equipado", 14) }, h("span", { text: pr + " dr." }))); }));
    }
    pintarV();
    return tarjeta("Tienda de dracmas", ico("dracma"), h("div", { class: "ap-tienda-cab" }, h("p", { class: "jg-mini", text: "Se ganan leyendo: misiones, hallazgos y versos marcados «Leído». Nada se compra con dinero." }),
      h("span", { class: "ap-saldo", "aria-label": "Tienes " + fmt(P.dr) + " dracmas" }, ico("dracma"), h("b", { text: fmt(P.dr) }), " dr.")), uso, pestanas, vitrina);
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
        const r = await accionPoder("/foto", { img: b64 }, "Tu imagen personalizada ya se ve"); if (r) rehacer();
      } catch (e) { A.avisar("No se pudo leer esa imagen"); }
    });
    inp.click();
  }
  function verFoto(f, apodo) {
    const u = fotoUrl(f); if (!u) return;
    A.abrirModal(() => A.cajaModal(A.cabModal(apodo || "Imagen personalizada", "Imagen personalizada"), h("div", { class: "jg ap-verfoto" }, h("img", { src: u, alt: "Imagen personalizada de " + (apodo || "un lector"), width: "256", height: "256" }),
      h("p", { class: "jg-mini", text: "Las imágenes personalizadas se ven para todos. Si una no es apropiada, repórtala: con varios reportes se oculta hasta que el equipo la revise." }),
      h("div", { class: "jg-acciones" }, h("button", { class: "btn", type: "button", onclick: async (e) => { e.currentTarget.disabled = true; const r = await pedir("/foto/reportar", { metodo: "POST", cuerpo: { f } }); A.avisar(r.error ? mensaje(r) : "Gracias: el equipo la revisará"); A.cerrarModal(); } }, h("span", { text: "Reportar esta imagen" }))))));
  }
  async function pintarPoder(zona, y) {
    // (12-nov-2026, P14 y adjunto 11: sin sobresalto al entrar al Árbol) lo traído al tocar su ícono se usa en el acto
    const habia = !!zona.querySelector(".cargando");
    const P = await cargarPoder(PODER && Date.now() - PODER.t < 20e3 ? false : true); if (!zona.isConnected) return;
    if (P.error) return zona.replaceChildren(tarjeta(null, null, h("p", { text: mensaje(P) })));
    const rehacer = () => { PODER = null; pintarPoder(zona, S.yo || y); }; // tras una compra o un cambio: datos frescos
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
        h("li", { title: "Solo cuentan los versos que marcas: «Leído», el capítulo marcado o la prueba bien respondida" }, h("b", { text: fmt(yy.vc || 0) }), h("small", { text: "versos leídos" })),
        h("li", {}, h("b", { text: fmt((yy.invi && yy.invi.unidos) || 0) }), h("small", { text: "frutos de tu siembra" }))),
      tarjetaColeccion(yy, true),
      h("div", { class: "jg-acciones ap-foto" }, h("button", { class: "btn", type: "button", onclick: () => elegirFoto(rehacer) }, ico("persona"), h("span", { text: yy.foto ? "Cambiar mi imagen personalizada" : "Subir mi imagen personalizada" })),
        yy.foto ? h("button", { class: "btn", type: "button", onclick: async () => { const r = await accionPoder("/foto/quitar", {}, "Quitaste tu imagen personalizada"); if (r) rehacer(); } }, h("span", { text: "Quitar mi imagen personalizada" })) : null,
        yy.fotoOculta ? h("p", { class: "jg-mini", text: "Tu imagen personalizada está oculta mientras el equipo la revisa." }) : null));
    const heroe = h("section", { class: "ap-heroe" }, h("div", { class: "ap-lienzo" }, arbolPoder(yy, av, (yy.invi && yy.invi.unidos) || 0)), datos);
    zona.replaceChildren(heroe, tarjetaAtributos(yy, P, rehacer), h("div", { class: "jg-dos" }, tarjetaArmadura(yy, P, rehacer), tarjetaTienda(yy, P, rehacer)));
    if (habia && !sinAnim() && zona.animate) zona.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 240, easing: "ease-out" });
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
    else { marco(cont, cabeceraJuego("arbol"), poder, zona); (S.yo ? Promise.resolve(S.yo) : pedir("/yo").then((r) => { if (!r.error) actualizarYo(r.yo); return S.yo; })).then((y) => { if (y) pintarPoder(poder, y); else poder.replaceChildren(); }); }
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
      ficha.replaceChildren(h("p", { class: "jg-nombre" }, n.a, n.pa ? h("small", { class: "jg-pais", text: " · " + nombrePais(n.pa) }) : null),
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
    // P26: diseño 2, pergamino claro (misma composición, otra paleta y el mensaje de la lectura juntos)
    const P2 = op.d === 2, K = P2 ? { fondo: "#f4ecdc", luz: "176,132,52", letra: "110,82,27", marco: "122,92,32", oro: "#6e521b", oro2: "#8a6a2b", tinta: "#2a241b", tenue: "#6b6152", disco: "#fbf6ec", ap: "#2a241b" }
      : { fondo: "#07070a", luz: "201,168,101", letra: "232,207,148", marco: "201,168,101", oro: "#e8cf94", oro2: "#c9a865", tinta: "#ece5d6", tenue: "#a39a88", disco: "#121216", ap: "#f3ecdc" };
    c.fillStyle = K.fondo; c.fillRect(0, 0, W, H);
    const luz = (x, y0, r, a) => { const g = c.createRadialGradient(x, y0, 10, x, y0, r); g.addColorStop(0, "rgba(" + K.luz + "," + a + ")"); g.addColorStop(1, "rgba(" + K.luz + ",0)"); c.fillStyle = g; c.fillRect(0, 0, W, H); };
    luz(W / 2, 360, 720, 0.30); luz(140, 1230, 520, 0.10); luz(960, 1180, 460, 0.08);
    c.textAlign = "center"; c.textBaseline = "alphabetic";
    for (let i = 0; i < 46; i++) { const l = LETRAS[(i * 7) % LETRAS.length]; c.font = (26 + (i * 13) % 40) + "px " + T; c.fillStyle = "rgba(" + K.letra + "," + (0.035 + ((i * 5) % 7) / 140).toFixed(3) + ")"; c.fillText(l, (i * 233) % W, 60 + (i * 397) % (H - 80)); }
    const rr = (x, y0, w, hh, r) => { c.beginPath(); c.moveTo(x + r, y0); c.arcTo(x + w, y0, x + w, y0 + hh, r); c.arcTo(x + w, y0 + hh, x, y0 + hh, r); c.arcTo(x, y0 + hh, x, y0, r); c.arcTo(x, y0, x + w, y0, r); c.closePath(); };
    c.strokeStyle = "rgba(" + K.marco + ",.62)"; c.lineWidth = 2.5; rr(44, 44, W - 88, H - 88, 38); c.stroke();
    c.strokeStyle = "rgba(" + K.marco + ",.22)"; c.lineWidth = 1; rr(62, 62, W - 124, H - 124, 28); c.stroke();
    const txt = (t, y0, f, col, ls) => { c.font = f; c.fillStyle = col; try { c.letterSpacing = ls || "0px"; } catch (e) { /* ignorar */ } c.fillText(t, W / 2, y0); try { c.letterSpacing = "0px"; } catch (e) { /* ignorar */ } };
    const ajustar = (t, max, f0, tam) => { let s = tam; c.font = f0.replace("{t}", s); while (c.measureText(t).width > max && s > 20) { s -= 2; c.font = f0.replace("{t}", s); } return f0.replace("{t}", s); };
    txt("ESCUDRIÑA", 170, "600 76px " + D, K.oro, "14px");
    txt("El Códice Viviente", 228, "italic 400 44px " + D, K.oro2);
    // emblema
    const col = COLORES[(y.emb && y.emb.c) || 0] || COLORES[0], l = (y.emb && y.emb.l) || "α";
    c.beginPath(); c.arc(W / 2, 400, 92, 0, 2 * Math.PI); c.fillStyle = K.disco; c.fill(); c.lineWidth = 6; c.strokeStyle = col; c.stroke();
    if (y.marco) { c.beginPath(); c.arc(W / 2, 400, 108, 0, 2 * Math.PI); c.lineWidth = 2.5; c.strokeStyle = K.oro; c.stroke(); }
    c.font = "500 110px " + (/[֐-׿]/.test(l) ? "'Frank Ruhl Libre'," + T : T); c.fillStyle = col; c.fillText(l, W / 2, 438);
    txt(y.apodo || "", 560, ajustar(y.apodo || "", W - 260, "600 {t}px " + D, 62), K.ap);
    const x = op.x || {};
    let l1, l2, l3;
    if (op.tipo === "lauro") { l1 = "Hallé un lauro trenzado"; l2 = "incorruptible"; l3 = "1 Κοrίndsιοι 9:25"; }
    else if (op.tipo === "piedra") { l1 = "Hallé " + PIEDRAS[x.i][3] + " [" + PIEDRAS[x.i][1] + "],"; l2 = "una de las doce piedras"; l3 = "Ἀpοκάlυpsις 21:19-20"; }
    else if (op.tipo === "rango") { l1 = "Llegué al rango de"; l2 = x.rango || y.rangoNombre || ""; l3 = "nivel " + (x.nivel || y.nivel || 1); }
    else if (P2) { l1 = "Leeremos juntos, por primera vez en español,"; l2 = "lo que en verdad dice la Escritura"; l3 = y.practica ? "1440 Primicias · reserva la tuya" : "en el orden de los acontecimientos"; }
    else { l1 = "Ya tengo mi lugar entre"; l2 = "las 1440 Primicias"; l3 = y.fundador ? "Primicia n.º " + fmt(y.n) : "Únete antes del lanzamiento"; }
    txt(l1, 680, ajustar(l1, W - 200, "400 {t}px " + D, 66), K.tinta);
    txt(l2, 762, ajustar(l2, W - 200, "600 {t}px " + D, 78), K.oro);
    txt(l3, 834, "500 34px " + U, K.oro2, "3px");
    c.strokeStyle = "rgba(" + K.marco + ",.45)"; c.lineWidth = 1.5; c.beginPath(); c.moveTo(W / 2 - 160, 888); c.lineTo(W / 2 + 160, 888); c.stroke();
    txt("ἐρευνᾶτε τὰς γραφάς", 958, "400 46px " + T, K.oro);
    txt("«Escudriñan a las escrituras» · YÔḥānā́n 5:39", 1012, "italic 400 34px " + T, P2 ? "#5c5245" : "#bdb4a3");
    txt("Únete con mi enlace", 1118, "500 34px " + U, K.tinta, "2px");
    const u = enlaceInvitacion().replace(/^https:\/\//, "");
    txt(u, 1176, ajustar(u, W - 220, "600 {t}px " + U, 44), K.oro);
    let lz = ""; try { lz = new Date(y.lanzamiento).toLocaleString("es", { weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit", timeZoneName: "short" }); } catch (e) { lz = ""; }
    txt(y.practica && lz ? "Lanzamiento: " + lz : "El juego de Biblia Exacta", 1250, "400 28px " + U, K.tenue, "1px");
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
        puede ? h("button", { class: "btn oro", type: "button", onclick: async () => { try { await navigator.share({ files: [file], title: "Escudriña · El Códice Viviente", text: textoInv() + " " + enlaceInvitacion() }); } catch (e) { /* cancelado */ } } }, ico("compartir"), h("span", { text: "Compartir la imagen" })) : null,
        A.sinDescargas && A.sinDescargas() ? null : h("a", { class: "btn" + (puede ? "" : " oro"), href: u, download: nombre }, ico("descargar"), h("span", { text: "Descargar" })),
        h("button", { class: "btn", type: "button", onclick: () => copiar(textoInv() + " " + enlaceInvitacion(), "Texto y enlace copiados") }, ico("copiar"), h("span", { text: "Copiar el texto" }))),
      op.tipo === "prerregistro" || !op.tipo ? h("div", { class: "jg-seg fila", role: "group", "aria-label": "Diseño de la imagen" }, [[1, "Imagen 1"], [2, "Imagen 2 · pergamino"]].map(([k, t]) =>
        h("button", { type: "button", "aria-pressed": String((op.d || 1) === k), onclick: () => { A.cerrarModal(); setTimeout(() => verTarjetaImagen(Object.assign({}, op, { d: k })), 60); } }, t))) : null,
      elegirMensaje(),
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
      const tit = h("p", { class: "jg-mini", text: (q.periodo === "semana" ? "Esta semana (" + textoSemana() + ")" : "Desde el comienzo") + " · " + (pais ? nombrePais(pais) : "el mundo") });
      if (!r.lista.length) return zona.replaceChildren(tit, h("p", { text: "Todavía ninguna ciudad suma prestigio aquí. ¡La tuya puede ser la primera!" }));
      zona.replaceChildren(tit, h("ol", { class: "jg-lista" }, r.lista.map((x) => h("li", { class: "jg-fila" + (x.ciudad === lugar.ciudad && x.pais === lugar.pais ? " yo" : "") },
        h("span", { class: "p", text: String(x.p) }), h("span", { class: "jg-ciu", "aria-hidden": "true" }, A.svg('<path d="M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0 1 13 0c0 4.8-6.5 11-6.5 11z" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="12" cy="10" r="2.4" fill="currentColor"/>')), h("span", { class: "n" }, x.ciudad, h("small", { text: [x.region, q.ambito === "pais" ? "" : nombrePais(x.pais), plural(x.n, "lector", "lectores")].filter(Boolean).join(" · ") }),
          x.top ? h("small", { class: "jg-top1", text: "n.º 1: " + x.top }) : null),
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
    // (R3, BiEx 12-nov-2026) por defecto se ven todos los rangos, cada uno en su categoría, con la fila propia siempre a la vista
    const q = { ambito: st.ambito || "pais", periodo: st.periodo || "semana", rango: st.v === 2 && Number.isInteger(st.rango) ? st.rango : -1, v: 2 };
    const zona = h("div", {}, h("p", { class: "cargando", text: "Cargando…" }));
    const seg = (opciones, clave) => h("div", { class: "jg-seg", role: "group" }, opciones.map(([k, t]) => h("button", { type: "button", "aria-pressed": String(q[clave] === k), onclick: (e) => {
      q[clave] = k; A.store.set("jg:clas", q);
      for (const b of e.currentTarget.parentNode.children) b.setAttribute("aria-pressed", String(b === e.currentTarget));
      cargar();
    } }, t)));
    const lugarDe = (amb) => { const l = y.lugar || {}; return amb === "pais" ? nombrePais(l.pais) : amb === "continente" ? CONT[l.cont] || l.cont : amb === "region" ? l.region : amb === "ciudad" ? l.ciudad : "el mundo"; };
    async function cargar() {
      zona.replaceChildren(h("p", { class: "cargando", text: "Cargando…" }));
      if (q.rango === -1) return cargarTodos();
      const r = await pedir("/clasificacion?" + new URLSearchParams({ ambito: q.ambito, periodo: q.periodo, rango: String(q.rango) }));
      if (r.error) return zona.replaceChildren(h("p", { text: mensaje(r) }));
      const titulo = h("p", { class: "jg-mini", text: (q.periodo === "semana" ? "Esta semana (" + textoSemana() + ")" : "Desde el comienzo") + " · " + RANGOS[r.rango] + " · " + ((r.lugar && lugarDe(q.ambito)) || (q.ambito === "mundo" ? "el mundo" : "sin datos de tu lugar")) });
      if (!r.lista.length) return zona.replaceChildren(titulo, h("p", { text: "Todavía nadie de este rango suma experiencia aquí. ¡Puedes ser la primera persona!" }));
      const fila = (x) => { const [l, c] = embDe(x.emb); return h("li", { class: "jg-fila" + (x.yo ? " yo" : "") }, h("span", { class: "p", text: String(x.p) }), emblema(l, c, x.marco, x.foto),
        h("span", { class: "n" }, x.apodo, h("small", { text: "nivel " + x.nivel + (x.n ? " · Primicia n.º " + x.n : "") + (q.ambito !== "ciudad" && x.ciudad ? " · " + x.ciudad : "") })), h("span", { class: "x", text: fmt(x.xp) })); };
      zona.replaceChildren(...[titulo, h("ol", { class: "jg-lista" }, r.lista.map(fila)),
        r.yo && !r.lista.some((x) => x.yo) ? h("p", { class: "jg-mini", text: "Tu puesto: " + fmt(r.yo.p) + " · " + fmt(r.yo.xp) + " de experiencia." }) : null].filter(Boolean));
    }
    function filaDe(x) { const [l, c] = embDe(x.emb); return h("li", { class: "jg-fila" + (x.yo ? " yo" : "") }, h("span", { class: "p", text: String(x.p) }), emblema(l, c, x.marco, x.foto),
      h("span", { class: "n" }, x.apodo, h("small", { text: "nivel " + x.nivel + (x.n ? " · Primicia n.º " + x.n : "") + (q.ambito !== "ciudad" && x.ciudad ? " · " + x.ciudad : "") })), h("span", { class: "x", text: fmt(x.xp) })); }
    async function cargarTodos() {
      const rs = await Promise.all(RANGOS.map((_, i) => pedir("/clasificacion?" + new URLSearchParams({ ambito: q.ambito, periodo: q.periodo, rango: String(i) }))));
      if (q.rango !== -1) return;
      const err = rs.find((r) => r.error); if (err && rs.every((r) => r.error)) return zona.replaceChildren(h("p", { text: mensaje(err) }));
      const r0 = rs.find((r) => !r.error) || {};
      const titulo = h("p", { class: "jg-mini", text: (q.periodo === "semana" ? "Esta semana (" + textoSemana() + ")" : "Desde el comienzo") + " · todos los rangos · " + ((r0.lugar && lugarDe(q.ambito)) || (q.ambito === "mundo" ? "el mundo" : lugarDe(q.ambito) || "")) });
      const orden = RANGOS.map((_, i) => RANGOS.length - 1 - i); // del rango más alto al primero
      const secciones = [], saltos = [];
      let mia = null;
      for (const i of orden) {
        const r = rs[i]; if (!r || r.error) continue;
        const id = "jg-rg-" + i, lista = r.lista || [];
        if (r.yo) mia = { i, p: r.yo.p, xp: r.yo.xp, id };
        const ol = h("ol", { class: "jg-lista" }, lista.slice(0, 10).map(filaDe));
        const mas = lista.length > 10 ? h("button", { class: "btn chico", type: "button", onclick: (e) => { ol.replaceChildren(...lista.map(filaDe)); e.currentTarget.remove(); } }, "Ver los " + lista.length) : null;
        saltos.push(h("button", { class: "jg-salto" + (r.yo ? " mio" : ""), type: "button", onclick: () => { const el = document.getElementById(id); if (el) el.scrollIntoView({ block: "start", behavior: sinAnim() ? "auto" : "smooth" }); } }, RANGOS[i], h("small", { text: String(lista.length) })));
        secciones.push(h("section", { class: "jg-rg", id, "data-rg": String(i) }, h("h3", { class: "jg-rg-t" }, h("span", { text: RANGOS[i] }), h("small", { text: lista.length ? plural(lista.length, "persona", "personas") + (lista.length >= 50 ? " o más" : "") : "aún nadie" })),
          lista.length ? ol : h("p", { class: "jg-mini", text: "Todavía nadie de este rango suma experiencia aquí." }), mas));
      }
      const yoBar = mia ? h("button", { class: "jg-mi-fila", type: "button", onclick: () => { const el = document.getElementById(mia.id); if (el) el.scrollIntoView({ block: "start", behavior: sinAnim() ? "auto" : "smooth" }); } },
        h("span", { class: "p", text: fmt(mia.p) }), h("span", { class: "n" }, (S.yo && S.yo.apodo) || "Tú", h("small", { text: RANGOS[mia.i] + " · tu puesto" })), h("span", { class: "x", text: fmt(mia.xp) }))
        : h("p", { class: "jg-mini jg-mi-fila sin", text: "Lee hoy y entra en la clasificación de tu rango." });
      zona.replaceChildren(titulo, h("div", { class: "jg-saltos", role: "group", "aria-label": "Ir a un rango" }, saltos), ...secciones, yoBar);
    }
    marco(cont, h("div", { class: "panel-cab" }, h("a", { class: "eyebrow", href: "#/escudrina", text: "‹ Escudriña" }), h("h1", { class: "texto", text: "Clasificación" }),
      h("p", { class: "est-sub", text: "Cada rango tiene su propia clasificación: los nuevos compiten con nuevos y los veteranos con veteranos." })),
      tarjeta(null, null, seg(AMBITOS((y.lugar || {}).pais), "ambito"), seg([["semana", "Esta semana"], ["total", "Desde el comienzo"]], "periodo"), seg([[-1, "Todos"], ...RANGOS.map((t, i) => [i, t])], "rango")),
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
      if (!(await confirmar("Código nuevo", "Se creará un código nuevo y el anterior dejará de servir.", "Crear el código nuevo"))) return;
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
        h("button", { class: "btn", type: "button", onclick: async () => { if (await confirmar("¿Salir de Escudriña en este dispositivo?", "Para volver necesitarás tu código, tu llave o tu cuenta.", "Salir")) { olvidarSesion(false); A.irA("#/escudrina"); } } }, h("span", { text: "Salir en este dispositivo" })),
        h("button", { class: "btn", type: "button", onclick: async () => { if (!(await confirmar("Cerrar todas las sesiones", "Se cerrarán todas tus sesiones, también en otros dispositivos.", "Cerrar todas"))) return; const r = await pedir("/cuenta/salir-todos", { metodo: "POST" }); if (r.error) return A.avisar(mensaje(r)); guardarSesion(r.token); A.avisar("Cerraste las demás sesiones"); } }, h("span", { text: "Cerrar todas las sesiones" })))),
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
      if (x.error === "sin_cuenta") {
        // P29 (BiEx, 11-nov-2026): entrar con una cuenta de Google que no está registrada no crea otra: se invita a crearla
        if (pista) { pista.textContent = ""; pista.className = "jg-pista"; }
        if (await confirmar("Esa cuenta de " + (prov === "google" ? "Google" : "Facebook") + " aún no está en Escudriña", "¿Quieres crear tu cuenta con ella? Si ya juegas en otro dispositivo, entra allí con tu código o tu llave y vincula " + (prov === "google" ? "Google" : "Facebook") + " desde «Más › Tu cuenta»: así no tendrás dos cuentas.", "Crear mi cuenta")) conectar(prov, "crear", pista);
        return;
      }
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
  // P26 (BiEx, 11-nov-2026): segundo mensaje para elegir, con la gramática revisada; después del lanzamiento, sin la parte del
  // prelanzamiento ni de las Primicias (adaptación de Claude)
  const TEXTO_INV2 = "Ahora podemos registrarnos en el prelanzamiento del juego de BiEx – Biblia Exacta ©™.\n\nEn la página leeremos juntos, por primera vez en español, lo que en verdad dice la Escritura, y en el orden de los acontecimientos; participaremos en un ranking de avance que comienza por ciudad y recibiremos diversas recompensas por acercarnos, al fin, al auténtico Mensaje de Dios y de Su Hijo.\n\nLas primeras 1440 solicitudes de participación reciben un título exclusivo de Primicias que aporta beneficios únicos. Reserva el tuyo con mi enlace y, además, tus primeras 3 horas de lectura cuentan doble:";
  const TEXTO_INV2_L = "En Biblia Exacta leemos juntos, por primera vez en español, lo que en verdad dice la Escritura, y en el orden de los acontecimientos; participamos en un ranking de avance que comienza por ciudad y recibimos diversas recompensas por acercarnos, al fin, al auténtico Mensaje de Dios y de Su Hijo. Entra con mi enlace: tus primeras 3 horas de lectura cuentan doble:";
  const textoInv = () => (A.store.get("jg:msgInv", 1) === 2 ? (S.yo && S.yo.practica === false ? TEXTO_INV2_L : TEXTO_INV2) : TEXTO_INV);
  function elegirMensaje(alCambiar) {
    const actual = A.store.get("jg:msgInv", 1);
    return h("div", { class: "jg-seg fila jg-msgs", role: "group", "aria-label": "Mensaje para compartir" }, [[1, "Mensaje breve"], [2, "Mensaje completo"]].map(([k, t]) =>
      h("button", { type: "button", "aria-pressed": String(actual === k), title: k === 1 ? TEXTO_INV : TEXTO_INV2, onclick: (e) => { A.store.set("jg:msgInv", k); for (const b of e.currentTarget.parentNode.children) b.setAttribute("aria-pressed", String(b === e.currentTarget)); vibrar(6); if (alCambiar) alCambiar(); } }, t)));
  }
  function compartirInvitacion() { compartir("Escudriña · El Códice Viviente", textoInv(), enlaceInvitacion()); }
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
  const R = { tlc: {}, lib: null, cap: 0, pal: [], hoy: "", acc: new Map(), accA: new Map(), pend: new Map(), hechos: new Set(), quiere: new Set(), cola: [], vis: new Map(), els: [], io: null, reloj: 0, ultTick: 0, ultAct: 0, ultEnvio: 0, enviando: false, pred: null, prueba: false, recuperada: false, completos: new Set(), tl: {} };
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
      Object.assign(R, { lib, cap, pal: [], hoy: "", acc: new Map(), accA: new Map(), pend: new Map(), hechos: new Set(), quiere: new Set(), prueba: false });
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
    if (LB.io) { LB.io.disconnect(); LB.io = null; } if (LB.ioB) { LB.ioB.disconnect(); LB.ioB = null; }
    ponerLB(0);
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
  const valeLeer = (v) => (R.pal[v - 1] || 0) > 0 && +(R.hoy[v - 1] || 0) < 9; // todo verso leído suma algo (BiEx, 9-nov-2026)
  function tick() {
    const ahora = performance.now(), dt = Math.min(1000, Math.max(0, ahora - (R.ultTick || ahora)));
    R.ultTick = ahora;
    if (LB.el && LB.modal !== document.documentElement.classList.contains("con-modal")) elegirLB();
    if (COFRE.pend && !document.documentElement.classList.contains("con-modal")) { const cf = COFRE.pend; COFRE.pend = null; A.avisar(COFRES[Math.max(0, Math.min(4, cf.n | 0))].n + ": +" + cf.dr + " dracmas (ya están en tu cuenta)"); }
    if (SL.cod) posSala(false);
    if (R.cola.length && !R.enviando && Date.now() - R.ultEnvio > CADA) enviar(false);
    if (!R.pal.length || document.hidden || !R.ultAct || ahora - R.ultAct > (R.ventana || 45000) || document.documentElement.classList.contains("con-modal")) return;
    if (R.els.length && !R.els[0].isConnected) observar();
    let el = null, hay = false;
    for (const e of R.els) {
      const v = +e.id.slice(1);
      if (!R.vis.get(e) || R.hechos.has(v) || !valeLeer(v)) continue;
      hay = true;
      if (!R.pend.has(v)) { el = e; break; }
    }
    // tiempo de lectura activo (página a la vista, con presencia y versos por leer): minutos reales y ritmo de la fórmula
    if (el || hay) { const lc = R.lib + "." + R.cap; R.tl[lc] = (R.tl[lc] || 0) + dt; }
    if (el) {
      const v = +el.id.slice(1), t = (R.acc.get(v) || 0) + dt;
      R.acc.set(v, t);
      // «Leído» por verso (BiEx, 10-nov-2026): al tiempo mínimo el verso suma el 30 %; el 70 % llega al tocar «Leído».
      // Si ya se tocó «Leído» antes de cumplir el mínimo, al cumplirlo se acredita completo (sin quedar por marcar).
      if (t >= tMin(v)) {
        if (R.quiere.has(v)) { R.quiere.delete(v); R.hechos.add(v); acreditar(R.lib, R.cap, v, Math.round(t), 3); marcarLeidoV(v, true); if (tocaPremio()) enviar(false); }
        else { R.pend.set(v, [Math.round(t), 1]); guardarPend(); acreditar(R.lib, R.cap, v, Math.round(t), 0); }
        estadoSellos(v);
      }
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
  // «Leído» (T3 + P20, BiEx, 11 y 12-nov-2026). Un solo botón fijo abajo al centro (no tapa la sala ni los saltos) y un
  // resplandor en el número del verso que marcaría: el primero sin marcar en la mitad de arriba de la pantalla (o, si
  // todos los de arriba ya están marcados, el siguiente a la vista). Solo cuenta como leído lo marcado a mano: «Leído»,
  // el capítulo marcado con su tiempo de seguridad (0,85 s por palabra griega) o la prueba bien respondida. La
  // experiencia sigue llegando con el tiempo de lectura (30 %) y al marcar (70 %).
  const LB = { el: null, ah: null, v: 0, io: null, ioB: null, zona: new Set(), bajo: new Set(), ok: new Set(), t: 0 };
  const LD = LB; // (nombre anterior)
  const numeroDe = (el) => el && (el.querySelector(":scope > .vn") || el.querySelector(":scope > sup"));
  const cfDe = (lc) => (A.store.get("jg:cf", null) || {})[lc] || "";
  function guardarCf(lc, s) { if (typeof s !== "string") return; const o = A.store.get("jg:cf", null) || {}; if (s.includes("1")) o[lc] = s; else delete o[lc]; A.store.set("jg:cf", o); }
  const yaLeido = (v) => LB.ok.has(R.lib + "." + R.cap + "." + v);
  const marcadoAntes = (lc, v) => cfDe(lc)[v - 1] === "1";
  const marcable = (v) => (R.pal[v - 1] || 0) > 0 && !yaLeido(v) && !R.quiere.has(v);
  function sellos() {
    for (const s of document.querySelectorAll(".jg-sello, .jg-ld")) s.remove();
    if (LB.io) { LB.io.disconnect(); LB.io = null; } if (LB.ioB) { LB.ioB.disconnect(); LB.ioB = null; } if (LB.ro) { LB.ro.disconnect(); LB.ro = null; }
    LB.vis = new Set();
    if (!S.token || !R.lib || !R.pal.length || !R.els.length || !("IntersectionObserver" in window)) { ponerLB(0); return; }
    const hoja = document.querySelector(".hoja"); if (!hoja) return;
    if (!LB.el || !LB.el.isConnected) {
      LB.el = h("button", { type: "button", class: "jg-lb fuera", onclick: (ev) => { ev.stopPropagation(); tocarLB(); } },
        h("span", { class: "jg-lb-i", "aria-hidden": "true" }), h("span", { class: "jg-lb-t" }, h("b", { text: "Leído" }), h("small", { text: "" })));
      document.body.append(LB.el);
    }
    if (!LB.ah || LB.ah.parentElement !== hoja) { if (LB.ah) LB.ah.remove(); LB.ah = h("div", { class: "jg-ah", hidden: true, "aria-hidden": "true" }, h("i", { class: "f" }), h("i", { class: "n" })); hoja.append(LB.ah); }
    LB.ok = new Set([...LB.ok].filter((k) => k.startsWith(R.lib + "." + R.cap + ".")));
    pintarMarcados();
    // los versos a la vista (sin franjas fijas: la zona útil se mide con las barras reales, ver elegirLB)
    LB.io = new IntersectionObserver((ents) => { for (const e of ents) { const v = +e.target.id.slice(1); if (e.isIntersecting) LB.vis.add(v); else LB.vis.delete(v); } pedirLB(); }, { threshold: 0 });
    for (const e of R.els) LB.io.observe(e);
    // si cambia la letra, la vista o el ancho, el hilo y el halo vuelven a su verso
    if ("ResizeObserver" in window) { LB.ro = new ResizeObserver(() => { if (LB.v) ponerLB(LB.v, true); }); LB.ro.observe(hoja); }
    // al detenerse el desplazamiento, y otra vez cuando las barras terminan de esconderse o volver (.42 s)
    if (!LB.scroll) {
      LB.scroll = true;
      addEventListener("scroll", () => { clearTimeout(LB.st); LB.st = setTimeout(pedirLB, 110); }, { passive: true });
      document.addEventListener("transitionend", (e) => { if (e.propertyName === "transform" && e.target instanceof Element && e.target.matches("header.barra, .barra-hoja")) pedirLB(); }, true);
    }
    finCapJuego();
  }
  function pedirLB() { if (LB.raf) return; LB.raf = requestAnimationFrame(() => { LB.raf = 0; elegirLB(); }); }
  // borde inferior de las barras de arriba (la superior y la del capítulo cuando está pegada): lo que queda debajo no se ve
  function topeBarras() {
    let t = 0;
    for (const q of ["header.barra", ".barra-hoja.bh-pegada"]) { const el = document.querySelector(q); if (el) { const r = el.getBoundingClientRect(); if (r.top < 240 && r.bottom > t) t = r.bottom; } }
    return t;
  }
  // borde superior de lo que flota abajo (el botón «Leído», que ya sube sobre la sala)
  function pieLB() {
    const r = LB.el && LB.el.getBoundingClientRect();
    return r && r.height ? r.top - (LB.el.classList.contains("fuera") ? 14 : 0) : innerHeight - 90;
  }
  // El verso que marcaría «Leído» (13-nov-2026): el primero sin marcar en la parte de arriba de la zona útil (debajo de las
  // barras y encima de lo que flota abajo) que de verdad se vea: su número a la vista o, si su número ya subió bajo las
  // barras, al menos dos renglones de su texto. Si no hay ninguno arriba, el siguiente a la vista.
  function elegirLB() {
    if (!R.lib || !LB.vis) return ponerLB(0);
    const T = topeBarras() + 4, B = pieLB() - 4, H = B - T;
    if (H < 90) return ponerLB(LB.v && LB.vis.has(LB.v) && marcable(LB.v) ? LB.v : 0);
    const arriba = T + H * 0.55;
    let v = 0, sig = 0;
    for (const el of R.els) {
      const x = +el.id.slice(1); if (!LB.vis.has(x) || !marcable(x)) continue;
      const r = el.getBoundingClientRect(); if (r.bottom <= T || r.top >= B) continue;
      const num = numeroDe(el), nr = num && num.getBoundingClientRect(), numVe = !!nr && nr.height > 0 && nr.top >= T - 2 && nr.bottom <= B;
      const ve = Math.min(r.bottom, B) - Math.max(r.top, T), renglon = (parseFloat(getComputedStyle(el).fontSize) || 18) * 1.75;
      if (!numVe && ve < renglon * 2.1) continue;
      if (Math.max(r.top, T) <= arriba) { v = x; break; }
      if (!sig) sig = x;
    }
    ponerLB(v || sig);
  }
  function ponerLB(v, forzar) {
    if (!LB.el) return;
    LB.modal = document.documentElement.classList.contains("con-modal");
    if (!v || LB.modal) { LB.v = 0; LB.el.classList.add("fuera"); LB.el.tabIndex = -1; if (LB.ah) LB.ah.hidden = true; quitarMeta(); return; }
    const el = document.getElementById("v" + v); if (!el) return;
    const nuevo = LB.v !== v;
    if (!nuevo && !forzar && !LB.el.classList.contains("fuera")) { LB.el.classList.toggle("espera", !R.pend.has(v)); halo(el); return; }
    const lc = R.lib + "." + R.cap, rep = marcadoAntes(lc, v);
    if (nuevo) {
      LB.v = v; LB.el.classList.remove("hecho");
      LB.el.querySelector("b").textContent = rep ? "Repasado" : "Leído";
      LB.el.querySelector("small").textContent = "verso " + v;
      LB.el.setAttribute("aria-label", (rep ? "Repasado" : "Leído") + ": marcar el verso " + v + " como leído");
    }
    LB.el.classList.toggle("espera", !R.pend.has(v));
    const sp = document.querySelector(".jg-sala-p");
    LB.el.style.setProperty("--jg-lb-alza", sp ? Math.round(sp.offsetHeight + 10) + "px" : "0px");
    if (LB.el.classList.contains("fuera")) { LB.el.classList.remove("fuera"); LB.el.tabIndex = 0; }
    const hoja = LB.ah && LB.ah.parentElement; if (!hoja) return;
    const rh = hoja.getBoundingClientRect(), r = el.getBoundingClientRect();
    // el hilo: verso por fila, sobre la rayita del estado que sigue al número (la prolonga a lo largo de todo el verso);
    // en la perícopa, en el centro del margen izquierdo, a lo largo de los renglones del verso
    const num = numeroDe(el), enFila = el.classList.contains("vl");
    let fx, y0, y1;
    if (enFila && num) {
      const nr = num.getBoundingClientRect(), cs = getComputedStyle(num), ra = parseFloat(getComputedStyle(num, "::after").right), fs = parseFloat(cs.fontSize) || 18;
      fx = nr.right - (isNaN(ra) ? -8 : ra) - 1.5; y0 = nr.top + 0.55 * fs; y1 = r.bottom - 8;
    } else {
      const cont = el.closest(".lectura, .continuo") || el.parentElement, rc = cont.getBoundingClientRect(), pl = parseFloat(getComputedStyle(cont).paddingLeft) || 12;
      fx = rc.left + Math.max(4, Math.min(pl / 2, 22)); y0 = r.top + 3; y1 = r.bottom - 3;
    }
    const f = LB.ah.firstChild;
    f.style.transform = "translate3d(" + (fx - rh.left).toFixed(1) + "px," + (y0 - rh.top).toFixed(1) + "px,0)";
    f.style.height = Math.max(18, y1 - y0).toFixed(1) + "px";
    quitarMeta(); if (num) { num.classList.add("jg-meta"); LB.meta = num; }
    halo(el);
    const antes = LB.ah.hidden; LB.ah.hidden = false;
    if ((antes || nuevo) && LB.ah.animate && document.documentElement.getAttribute("data-mov") !== "no") LB.ah.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 280, easing: "ease-out" });
  }
  function quitarMeta() { if (LB.meta) { LB.meta.classList.remove("jg-meta"); LB.meta = null; } }
  // el halo detrás de las cifras del número (sin el § de la perícopa); solo si el número se ve (nunca medio tapado por las barras)
  function halo(el) {
    const n = LB.ah && LB.ah.lastChild, hoja = LB.ah && LB.ah.parentElement, num = numeroDe(el); if (!n || !hoja) return;
    if (!num) { n.hidden = true; return; }
    const tn = [...num.childNodes].reverse().find((x) => x.nodeType === 3), rg = document.createRange(); rg.selectNodeContents(tn || num);
    const r = rg.getBoundingClientRect(), rh = hoja.getBoundingClientRect(), T = topeBarras();
    if (!r.width || r.top < T + 2) { n.hidden = true; return; }
    const w = Math.max(30, r.width + 24), hh = Math.max(28, r.height + 16);
    n.style.width = w.toFixed(1) + "px"; n.style.height = hh.toFixed(1) + "px";
    n.style.transform = "translate3d(" + (r.left + r.width / 2 - w / 2 - rh.left).toFixed(1) + "px," + (r.top + r.height / 2 - hh / 2 - rh.top).toFixed(1) + "px,0)";
    n.hidden = false;
  }
  function tocarLB() {
    const v = LB.v; if (!v || !R.lib) return;
    tocarLeido(v, LB.el);
    LB.el.classList.add("hecho");
    clearTimeout(LB.t); LB.t = setTimeout(() => { if (LB.el) LB.el.classList.remove("hecho"); LB.v = 0; elegirLB(); }, 480);
  }
  // los versos ya marcados (en este u otro dispositivo) llevan su número en oro
  function pintarMarcados() {
    if (!R.lib) return;
    const lc = R.lib + "." + R.cap, cf = cfDe(lc);
    for (const el of R.els) {
      const v = +el.id.slice(1), num = numeroDe(el); if (!num) continue;
      num.classList.toggle("jg-leido", cf[v - 1] === "1" || yaLeido(v) || !!(A.leido && A.leido(R.lib, R.cap, v)));
      num.classList.toggle("jg-quiere", R.quiere.has(v));
    }
  }
  // ¿A este «Leído» le toca premio? El servidor lo decidió de antemano (S.yo.frag.pf y pd: versos marcados que faltan):
  // solo entonces se envía en el acto (para mostrarlo ya); si no, viaja con la tanda (tocar «Leído» no gasta peticiones)
  function tocaPremio() {
    const f = S.yo && S.yo.frag; R.ld = (R.ld || 0) + 1;
    return !!f && ((f.pf > 0 && R.ld >= f.pf) || (f.pd > 0 && R.ld >= f.pd));
  }
  // el verso quedó marcado: número en oro, marca de leído en el lector y copia local de lo marcado
  function marcarLeidoV(v) {
    const lc = R.lib + "." + R.cap;
    LB.ok.add(lc + "." + v);
    const num = numeroDe(document.getElementById("v" + v));
    if (num) { num.classList.remove("jg-quiere"); num.classList.add("jg-leido"); }
    if (A.marcarLeido) A.marcarLeido(R.lib, R.cap, [v]);
    const cf = cfDe(lc); if (cf[v - 1] !== "1") guardarCf(lc, pon(cf, v - 1, "1"));
  }
  function tocarLeido(v, boton) {
    if (!v || !R.lib || yaLeido(v) || R.quiere.has(v)) return;
    vibrar([12, 30, 16]); sonar("chispa");
    const p = R.pend.get(v);
    if (p) { R.pend.delete(v); guardarPend(); R.hechos.add(v); acreditar(R.lib, R.cap, v, p[0], 3, true); marcarLeidoV(v); if (tocaPremio()) enviar(false); }
    else { R.quiere.add(v); const num = numeroDe(document.getElementById("v" + v)); if (num) num.classList.add("jg-quiere"); } // cuenta completo al cumplir su tiempo
    if (boton) chispas(10, boton, Math.random() < 0.5 ? ["polvo"] : ["aro"]);
    if (!p && !A.store.get("jg:leidoEsp", 0)) { A.store.set("jg:leidoEsp", 1); A.avisar("Ese verso contará como leído cuando termines de leerlo con calma."); }
    else if (!A.store.get("jg:leidoOk2", 0)) { A.store.set("jg:leidoOk2", 1); A.avisar("«Leído»: solo cuentan como leídos los versos que marcas. Márcalo cuando de verdad lo leíste."); }
    finCapJuego();
  }
  function estadoSellos(v) {
    if (LB.el && LB.v && (v == null || v === LB.v)) LB.el.classList.toggle("espera", !R.pend.has(LB.v));
    finCapJuego();
  }
  // Marcar el capítulo entero (P20): el botón del final del capítulo se habilita cuando lo leído con su tiempo y lo ya
  // marcado cubren el 90 % del capítulo y el tiempo de lectura activo alcanza 0,85 s por palabra griega de lo que falta
  let tFin = 0;
  function estadoCap() {
    const lc = R.lib + "." + R.cap, cf = cfDe(lc), ms = (S.cfg && S.cfg.msCap) || 850;
    let total = 0, cub = 0, pal = 0, hechos = 0;
    for (let i = 0; i < R.pal.length; i++) {
      const w = R.pal[i] || 0, v = i + 1; if (!w) continue; total++;
      const marc = cf[i] === "1" || yaLeido(v);
      if (R.pend.has(v)) { cub++; pal += w; } else if (marc) cub++;
      if (marc) hechos++;
    }
    const t = (R.tlc[lc] || 0) + (R.tl[lc] || 0), req = Math.round(pal * ms);
    return { total, cub, falta: Math.max(0, Math.ceil(0.9 * total) - cub), pal, t, req, hechos, listo: total > 0 && pal > 0 && cub >= Math.ceil(0.9 * total) && t >= req };
  }
  function finCapJuego() {
    clearTimeout(tFin); tFin = setTimeout(pintarFinCap, 120);
  }
  function pintarFinCap() {
    const caja = document.querySelector(".hoja .fin-leido");
    if (!caja || !S.token || !R.lib || !R.pal.length) return;
    const E = estadoCap(), lc = R.lib + "." + R.cap;
    let firma;
    if (E.total && E.hechos >= E.total) firma = "hecho";
    else if (E.listo) firma = "listo";
    else firma = "falta:" + E.falta + ":" + Math.ceil(Math.max(0, E.req - E.t) / 60000) + ":" + E.pal;
    if (caja.dataset.jg === firma) return;
    caja.dataset.jg = firma; caja.classList.add("jg-fin"); caja.classList.toggle("hecho", firma === "hecho");
    if (firma === "hecho") return caja.replaceChildren(A.svg(ICO_JG.marca || ICO_JG.llama, "0 0 24 24"), h("span", { text: "Capítulo leído" }));
    const btn = h("button", { class: "btn chico" + (E.listo ? " oro" : ""), type: "button", disabled: !E.listo, onclick: () => marcarCapitulo(btn) },
      h("span", { text: E.hechos ? "Marcar como leídos los versos que faltan" : "Marcar el capítulo como leído" }));
    let nota;
    if (E.listo) nota = "Cuentan los versos que leíste con su tiempo de lectura.";
    else if (E.falta > 0) nota = "Se habilita cuando leas con calma " + (E.falta === 1 ? "1 verso más" : E.falta + " versos más") + " de este capítulo, o márcalos uno por uno con «Leído».";
    else nota = "Se habilita con unos " + plural(Math.max(1, Math.ceil((E.req - E.t) / 60000)), "minuto", "minutos") + " más de lectura en este capítulo (0,85 s por palabra griega).";
    caja.replaceChildren(btn, h("p", { class: "jg-mini jg-fin-n", text: nota }));
  }
  async function marcarCapitulo(btn) {
    if (!R.lib) return;
    btn.disabled = true;
    if (R.cola.length && !R.enviando) await enviar(false);
    const lc = R.lib + "." + R.cap;
    const r = await pedir("/lectura/capitulo", { metodo: "POST", cuerpo: { lc } });
    if (r.error) {
      btn.disabled = false;
      if (typeof r.t === "number") R.tlc[lc] = r.t;
      A.avisar(r.error === "faltan" ? "Aún faltan " + plural(r.faltan || 1, "verso", "versos") + " por leer con calma en este capítulo."
        : r.error === "tiempo" ? "Aún falta un poco de lectura en este capítulo (0,85 s por palabra griega)."
        : r.error === "nada" ? "No hay versos leídos con su tiempo por marcar en este capítulo." : mensaje(r));
      const c = document.querySelector(".hoja .fin-leido"); if (c) delete c.dataset.jg; finCapJuego();
      return;
    }
    for (const v of r.cf || []) { R.pend.delete(v); R.hechos.add(v); marcarLeidoV(v); }
    guardarPend();
    for (const [k, x] of Object.entries(r.cfs || {})) guardarCf(k, x);
    if (typeof r.tlc === "number") R.tlc[lc] = r.tlc; // (el servidor ya descontó el tiempo usado)
    vibrar([14, 40, 18]); sonar("chispa");
    actualizarYo(r.yo); R.pred = null; pintarMedidor();
    if (r.xp > 0) { pulsoMedidor(r.xp); chispas(10 + Math.min(14, r.conf || 0), btn); }
    if (r.subio) hitoNivel(r.subio.nivel);
    A.avisar("Capítulo marcado: " + plural((r.cf || []).length, "verso leído", "versos leídos") + ".");
    celebrar(r);
    const c = document.querySelector(".hoja .fin-leido"); if (c) delete c.dataset.jg; finCapJuego(); elegirLB();
  }
  // El verso que se marca desde la ventana del verso (P20): si es del capítulo abierto, cuenta como «Leído»
  function limpiarMarcasAuto() {
    if (!S.token || A.store.get("jg:leiLimpio", 0) || !A.apartarLeidos) return;
    A.store.set("jg:leiLimpio", 1);
    const n = A.apartarLeidos(20261109);
    if (n > 0) setTimeout(() => A.avisar("Desde hoy solo cuentan como leídos los versos que marcas. Las marcas que puso la lectura automática quedaron guardadas aparte (" + plural(n, "verso", "versos") + ")."), 1200);
  }
  function marcarVersoDesdeLector(c, cap, v) {
    if (!S.token || R.lib !== c || R.cap !== cap || !(R.pal[v - 1] > 0)) return false;
    if (yaLeido(v)) return true;
    tocarLeido(v, null); elegirLB();
    return true;
  }
  // a: 0 = leído al ritmo mínimo (30 % ahora), 3 = «Leído» (completo, o con conf solo su 70 %: no es otra lectura)
  function acreditar(lib, cap, v, ms, a, conf) {
    const lc = lib + "." + cap, cD = +(R.hoy[v - 1] || 0), sie = sieDe(lc);
    const nuevo = !conf && !(+(sie[v - 1] || 0) > 0) && !(A.leido && A.leido(lib, cap, v));
    if (!conf) { R.hoy = pon(R.hoy, v - 1, String(Math.min(9, cD + 1))); const e = espejo(); e.m[lc] = R.hoy; A.store.set("jg:hoy", e); }
    R.cola.push([lib, cap, v, ms, a == null ? 1 : a]);
    if (!R.ultEnvio) R.ultEnvio = Date.now();
    guardarCola(false);
    const antes = R.pred ? R.pred.xp : 0, suceso = predecir(lib, cap, v, ms, nuevo, conf ? Math.max(0, cD - 1) : cD, a === 0 ? 0.3 : conf ? 0.7 : 1, a === 0 ? "auto" : conf ? "conf" : "completo");
    pulsoMedidor((R.pred ? R.pred.xp : 0) - antes);
    if (suceso) enviar(false);
  }
  // ¿Va a ocurrir un suceso con este verso? (estimación local; el servidor decide). modo: «auto» (leído con su tiempo,
  // 30 %), «conf» (marcado después: su 70 %) o «completo» (marcado antes de cumplir su tiempo: todo al cumplirlo). Desde el
  // 12-nov-2026 (P20) las misiones de versos avanzan solo con lo marcado, una vez por verso y por día.
  function predecir(lib, cap, v, ms, nuevo, cD, parte, modo) {
    const y = S.yo; if (!y) return false;
    if (parte == null) parte = 1;
    const hoy = y.hoy || {}, lc = lib + "." + cap;
    const P = R.pred || (R.pred = { xp: 0, h: y.prox ? y.prox.h : 1e9, d: y.prox ? y.prox.d : 1e9, auto: 0, versos: 0, nuevos: 0, repaso: 0, vida: 0, cartas: 0, ms: 0, caps: 0, libros: new Set(hoy.libros || []) });
    const pal = R.pal[v - 1] || 0, base = nuevo ? 2 * pal : cD < 2 ? 0.5 * pal : 0.1 * pal;
    let suceso = false;
    if (base > 0) P.xp += base * (y.mult || 1) * parte;
    if (modo !== "conf") {
      P.auto++; P.ms += ms;
      if (base > 0) { P.h--; P.d--; if (P.h <= 0 || P.d <= 0) suceso = true; }
      if (!(hoy.ms > 0) && P.auto === 1) suceso = true; // primera lectura del día: perseverancia
      // capítulo recorrido hoy (90 % de sus versos con su tiempo): el servidor ofrece la prueba
      const total = R.pal.filter((x) => x > 0).length; let leidos = 0;
      for (let i = 0; i < R.pal.length; i++) if (R.pal[i] > 0 && +(R.hoy[i] || 0) > 0) leidos++;
      if (total && leidos >= Math.ceil(0.9 * total) && !R.completos.has(lc)) { R.completos.add(lc); suceso = true; }
    }
    if (modo !== "auto") {
      const e = espejo(); if (!e.c) e.c = {};
      const mc = e.c[lc] || "";
      if (mc[v - 1] !== "1") {
        e.c[lc] = pon(mc, v - 1, "1"); A.store.set("jg:hoy", e);
        P.versos++; P.libros.add(lib);
        if (marcadoAntes(lc, v)) P.repaso++; else P.nuevos++;
        if (["MAT", "MRK", "LUK", "JHN"].includes(lib)) P.vida++; else if (lib !== "ACT" && lib !== "REV") P.cartas++;
        const total = R.pal.filter((x) => x > 0).length, m2 = e.c[lc]; let n = 0;
        for (let i = 0; i < R.pal.length; i++) if (R.pal[i] > 0 && m2[i] === "1") n++;
        if (!R.ccs) R.ccs = new Set();
        if (total && n >= Math.ceil(0.9 * total) && !R.ccs.has(lc)) { R.ccs.add(lc); P.caps++; suceso = true; }
      }
    }
    if (!y.enTope && y.xpSig - y.xpNivel <= P.xp) suceso = true;
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
      if (R.lib + "." + R.cap === lc) R.hoy = x.d;
    }
    // P20: el lector marca como leídos solo los versos marcados a mano (en este u otro dispositivo)
    for (const [lc, s] of Object.entries(r.cfs || {})) guardarCf(lc, s);
    for (const [lc, vs] of Object.entries(r.cf || {})) { const [lib, cap] = lc.split("."); if (A.marcarLeido && vs.length) A.marcarLeido(lib, +cap, vs); }
    for (const [lc, ms] of Object.entries(r.tlc || {})) R.tlc[lc] = ms;
    if (R.lib) pintarMarcados();
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
  // Chispas del escudo (BiEx, 10-nov-2026: «se ven borrosas y muy gruesas; afínalas y ponles otros efectos aleatorios»):
  // partículas finas y nítidas (núcleo sólido de 1,5 a 3 px, sin desenfoque ni sombras borrosas), con seis efectos que se
  // eligen aleatoriamente en cada ráfaga para sostener la novedad: polvo de oro, estelas de forja, aro de luz, gemas de los
  // doce colores, brasas que titilan y un filo de luz. Solo transform y opacidad (compositor); nada se amplía.
  const ESTILOS_CH = ["polvo", "estela", "aro", "gemas", "brasas", "filo"];
  function chispas(n, desde, estilos, color) {
    if (sinAnim() || document.hidden || !document.body.animate) return;
    const ref = MED.el && MED.el.isConnected && !desde ? MED.el : desde && desde.isConnected ? desde : MED.el && MED.el.isConnected ? MED.el : null; if (!ref) return;
    const r = ref.getBoundingClientRect(); if (!r.width) return;
    const cx = r.left + r.width / 2, cy = r.top + r.height * 0.46, capa = h("div", { class: "jg-chispas", "aria-hidden": "true" });
    document.body.append(capa);
    const l = estilos || (() => { const a = ESTILOS_CH[Math.floor(Math.random() * ESTILOS_CH.length)]; let b = ESTILOS_CH[Math.floor(Math.random() * ESTILOS_CH.length)]; return Math.random() < 0.45 && b !== a ? [a, b] : [a]; })();
    let vivas = 0;
    const fin = () => { if (--vivas <= 0) capa.remove(); };
    const pieza = (cls, x, y, cuadros, op) => {
      const el = h("i", { class: "jg-ch " + cls }); el.style.left = x.toFixed(1) + "px"; el.style.top = y.toFixed(1) + "px";
      if (color && /^#/.test(color)) el.style.setProperty("--c", color);
      capa.append(el); vivas++;
      el.animate(cuadros, op).finished.then(fin, fin);
      return el;
    };
    const rad = Math.max(r.width, r.height) * 0.5, cuantas = Math.max(4, Math.min(28, n | 0));
    for (const est of l) {
      const k = l.length > 1 ? Math.ceil(cuantas * 0.6) : cuantas;
      if (est === "polvo") for (let i = 0; i < k; i++) {
        const x = cx + (Math.random() - 0.5) * r.width * 0.7, y = cy + (Math.random() - 0.5) * r.height * 0.4, dx = (Math.random() - 0.5) * 50, dy = -30 - Math.random() * 60;
        pieza("p" + (Math.random() < 0.3 ? " g" : ""), x, y, [{ transform: "translate3d(0,0,0)", opacity: 0 }, { opacity: 1, offset: 0.12 }, { opacity: 0.4, offset: 0.4 }, { opacity: 1, offset: 0.6 }, { transform: "translate3d(" + dx.toFixed(1) + "px," + dy.toFixed(1) + "px,0)", opacity: 0 }],
          { duration: 1100 + Math.random() * 900, delay: Math.random() * 260, easing: "cubic-bezier(.2,.6,.4,1)", fill: "both" });
      } else if (est === "estela") for (let i = 0; i < k; i++) {
        const ang = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.5, v = 40 + Math.random() * 70, g = 24 + Math.random() * 36, dx = Math.cos(ang) * v, dy = Math.sin(ang) * v;
        const rot = (ang * 180) / Math.PI + 90;
        pieza("s", cx, cy, [{ transform: "translate3d(0,0,0) rotate(" + rot.toFixed(0) + "deg)", opacity: 0 }, { opacity: 1, offset: 0.08 },
          { transform: "translate3d(" + (dx * 0.7).toFixed(1) + "px," + (dy * 0.7 + g * 0.2).toFixed(1) + "px,0) rotate(" + (rot + 8).toFixed(0) + "deg)", opacity: 0.9, offset: 0.6 },
          { transform: "translate3d(" + dx.toFixed(1) + "px," + (dy + g).toFixed(1) + "px,0) rotate(" + (rot + 18).toFixed(0) + "deg)", opacity: 0 }],
        { duration: 650 + Math.random() * 450, delay: Math.random() * 140, easing: "cubic-bezier(.15,.7,.35,1)", fill: "both" });
      } else if (est === "aro") { const m = 14; for (let i = 0; i < m; i++) {
        const ang = (i / m) * Math.PI * 2, d = rad * 1.25 + 18;
        pieza("p", cx, cy, [{ transform: "translate3d(0,0,0)", opacity: 0 }, { opacity: 1, offset: 0.15 }, { transform: "translate3d(" + (Math.cos(ang) * d).toFixed(1) + "px," + (Math.sin(ang) * d * 0.9).toFixed(1) + "px,0)", opacity: 0 }],
          { duration: 820, delay: 40, easing: "cubic-bezier(.1,.8,.3,1)", fill: "both" }); } }
      else if (est === "gemas") for (let i = 0; i < Math.ceil(k * 0.7); i++) {
        const el = pieza("r", cx + (Math.random() - 0.5) * 14, cy, [{ transform: "translate3d(0,0,0) rotate(0deg)", opacity: 0 }, { opacity: 1, offset: 0.1 },
          { transform: "translate3d(" + ((Math.random() - 0.5) * 110).toFixed(1) + "px," + (-20 - Math.random() * 50).toFixed(1) + "px,0) rotate(" + ((Math.random() - 0.5) * 300).toFixed(0) + "deg)", opacity: 1, offset: 0.55 },
          { transform: "translate3d(" + ((Math.random() - 0.5) * 140).toFixed(1) + "px," + (30 + Math.random() * 40).toFixed(1) + "px,0) rotate(" + ((Math.random() - 0.5) * 520).toFixed(0) + "deg)", opacity: 0 }],
        { duration: 1100 + Math.random() * 600, delay: Math.random() * 200, easing: "cubic-bezier(.2,.7,.4,1)", fill: "both" });
        if (!color) el.style.setProperty("--c", PIEDRAS[Math.floor(Math.random() * 12)][2]);
      } else if (est === "brasas") for (let i = 0; i < k; i++) {
        const x = cx + (Math.random() - 0.5) * r.width * 0.5, dx = (Math.random() - 0.5) * 36, dy = -40 - Math.random() * 70;
        pieza("b", x, cy + r.height * 0.15, [{ transform: "translate3d(0,0,0)", opacity: 0 }, { opacity: 1, offset: 0.1 }, { opacity: 0.25, offset: 0.25 }, { opacity: 0.95, offset: 0.4 }, { opacity: 0.3, offset: 0.58 }, { opacity: 0.85, offset: 0.72 },
          { transform: "translate3d(" + dx.toFixed(1) + "px," + dy.toFixed(1) + "px,0)", opacity: 0 }], { duration: 1500 + Math.random() * 900, delay: Math.random() * 300, easing: "ease-out", fill: "both" });
      } else if (est === "filo") {
        pieza("f", cx, cy - r.height * 0.1, [{ transform: "translate3d(-" + (rad + 20).toFixed(0) + "px,0,0)", opacity: 0 }, { opacity: 1, offset: 0.35 }, { transform: "translate3d(" + (rad + 20).toFixed(0) + "px,0,0)", opacity: 0 }],
          { duration: 700, easing: "cubic-bezier(.4,0,.2,1)", fill: "both" });
        for (let i = 0; i < 5; i++) pieza("p", cx + (i - 2) * rad * 0.35, cy - r.height * 0.1, [{ opacity: 0 }, { opacity: 1, offset: 0.5 }, { opacity: 0 }], { duration: 520, delay: 180 + i * 60, fill: "both" });
      }
    }
    if (!vivas) capa.remove();
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
    // en lo alto, la llama de la lámpara (Salmo 119:105), no una estrella ni una forma de cruz (BiEx, 10-nov-2026)
    '<path d="M29 .5C31.6 3.5 32.5 5.6 32.5 7.3 32.5 9.3 31 10.6 29 10.6S25.5 9.3 25.5 7.3C25.5 5.6 26.4 3.5 29 .5Z" style="fill:var(--m1)"/><path d="M29 5C30 6.4 30.4 7.3 30.4 8 30.4 8.9 29.8 9.4 29 9.4S27.6 8.9 27.6 8C27.6 7.3 28 6.4 29 5Z" fill="#fff" fill-opacity=".55"/>' +
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
  // Conteo rápido de 0 a la cifra (BiEx, 10-nov-2026): la cifra final llega cuando el efecto ya casi se desvanece.
  // Solo cambia el texto de un elemento pequeño y solo cuando cambia el número (sin repintar nada más).
  function contarRapido(el, hasta, ms, pre, pos) {
    if (!el) return;
    if (el._cnt) cancelAnimationFrame(el._cnt);
    const fin = Math.max(1, Math.round(hasta)), t0 = performance.now(); let ult = -1;
    const poner = (n) => { if (n !== ult) { ult = n; el.firstChild && el.firstChild.nodeType === 3 ? (el.firstChild.nodeValue = (pre || "") + fmt(n) + (pos || "")) : el.prepend((pre || "") + fmt(n) + (pos || "")); } };
    if (sinAnim() || document.hidden) { poner(fin); return; }
    const paso = (t) => { const k = Math.min(1, (t - t0) / ms), n = Math.round(fin * (1 - Math.pow(1 - k, 2.2))); poner(n); el._cnt = k < 1 ? requestAnimationFrame(paso) : 0; };
    poner(0); el._cnt = requestAnimationFrame(paso);
  }
  function pulsoMedidor(xp) {
    if (!MED.el) return;
    pintarMedidor();
    MED.el.classList.remove("pulso"); void MED.el.offsetWidth;
    if (xp > 0) { MED.mas.textContent = ""; contarRapido(MED.mas, xp, 1320, "+"); }
    MED.el.classList.add("pulso");
  }
  function hitoNivel(n) {
    if (!MED.el) return;
    MED.hito.textContent = "¡Nivel " + n + "!";
    MED.el.classList.add("sube"); vibrar([20, 40, 20]);
    clearTimeout(MED.t); MED.t = setTimeout(() => { if (MED.el) MED.el.classList.remove("sube"); }, 4200);
  }
  function pop(xp) {
    const el = h("div", { class: "jg-pop", role: "status", "aria-label": "+" + fmt(xp) + " de experiencia" }, "+0", h("small", { text: "de experiencia" }));
    document.body.append(el);
    contarRapido(el, xp, 1700, "+");
    if (sinAnim() || !el.animate) { el.style.opacity = "1"; setTimeout(() => el.remove(), 1800); return; }
    el.animate([{ opacity: 0, transform: "translate(-50%,10px)" }, { opacity: 1, transform: "translate(-50%,0)", offset: 0.15 }, { opacity: 1, transform: "translate(-50%,-6px)", offset: 0.8 }, { opacity: 0, transform: "translate(-50%,-14px)" }],
      { duration: 1900, easing: "ease-out" }).finished.then(() => el.remove(), () => el.remove());
  }
  const CEL_PEND = [];
  document.addEventListener("visibilitychange", () => {
    if (document.hidden || !CEL_PEND.length) return;
    const l = CEL_PEND.splice(0); S.silencio = true;
    setTimeout(() => { try { for (const r of l) celebrar(r); } finally { setTimeout(() => { S.silencio = false; }, 1200); } }, 450);
  });
  // Premios de «Leído» (fragmentos de papiro y dracmas): fichas pequeñas que suben, con su cifra que cuenta
  function premioPop(txt, n, clase, i) {
    const el = h("div", { class: "jg-pop jg-premio " + (clase || ""), role: "status", style: "--i:" + (i || 0) }, h("b", { text: "+0" }), h("small", { text: txt }));
    document.body.append(el); contarRapido(el.firstChild, n, 900, "+");
    if (sinAnim() || !el.animate) { setTimeout(() => el.remove(), 2200); return; }
    el.animate([{ opacity: 0, transform: "translate(-50%,12px)" }, { opacity: 1, transform: "translate(-50%,0)", offset: 0.15 }, { opacity: 1, transform: "translate(-50%,-8px)", offset: 0.82 }, { opacity: 0, transform: "translate(-50%,-18px)" }],
      { duration: 2300, delay: 260 + (i || 0) * 380, easing: "ease-out", fill: "both" }).finished.then(() => el.remove(), () => el.remove());
  }
  function celebrar(r) {
    if (document.hidden) { if (CEL_PEND.length < 6) CEL_PEND.push(r); return; }
    if (r.xp > 0) { pop(r.xp); sonar("chispa"); }
    if (r.leido) {
      const L = r.leido, f = (S.yo && S.yo.frag) || { c: 0, meta: 70 };
      let k = 0;
      if (L.frag) premioPop(L.frag === 1 ? "fragmento de papiro · " + f.c + " de " + (f.meta || 70) : "fragmentos de papiro · " + f.c + " de " + (f.meta || 70), L.frag, "frag", k++);
      if (L.dr) premioPop("dracmas", L.dr, "dr", k++);
      if (L.raro && L.raro !== "dones") setTimeout(() => celebracion({ tipo: "raro", id: L.raro }), 900);
      else if (L.raro === "dones") A.avisar("¡70 fragmentos de papiro! Ya tienes todos los accesorios raros: +100 dracmas y 1 h de experiencia doble.");
    }
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
  // Hallazgo a la vista (BiEx, 10-nov-2026: «que no pase desapercibido mientras se leen los versos»): antes de la ventana,
  // un velo con la luz del color de la piedra, la gema que sube girando como una moneda (sin ampliarse: nítida), un aro de
  // luz, gemas y polvo de oro, y el rótulo «¡Hallazgo!». Unos 1,5 s; con «menos movimiento», directo a la ventana.
  function fanfarria(x) {
    return new Promise((listo) => {
      if (sinAnim() || document.hidden || !document.body.animate || (x.tipo !== "piedra" && x.tipo !== "lauro" && x.tipo !== "raro")) return listo();
      const dr = x.tipo === "raro" ? ((S.cfg && S.cfg.raros) || RAROS_C).find((z) => z[0] === x.id) : null;
      const col = x.tipo === "piedra" ? PIEDRAS[x.i][2] : dr && dr[1] === "aura" ? AURA_C[dr[0]] || "#f5c64e" : dr && dr[1] === "manto" ? (MANTO_C[dr[0]] || ["#f5c64e"])[0] : "#f5c64e";
      const arte = x.tipo === "piedra" ? gema(x.i, true) : dr ? A.svg(muestraAcc(dr[0], dr[1]), "0 0 48 48") : lauro();
      const fig = h("div", { class: "jg-fan-g" }, arte), rot = h("p", { class: "jg-fan-t", text: x.tipo === "lauro" ? "¡Un lauro incorruptible!" : x.tipo === "raro" ? "¡Accesorio raro!" : "¡Hallazgo!" });
      const capa = h("div", { class: "jg-fan", "aria-hidden": "true", style: "--c:" + col }, h("i", { class: "jg-fan-v" }), h("i", { class: "jg-fan-l" }), fig, rot);
      document.body.append(capa); vibrar([30, 60, 30, 60, 90]);
      const fx = { duration: 1500, easing: "ease-in-out", fill: "both" };
      capa.querySelector(".jg-fan-v").animate([{ opacity: 0 }, { opacity: 1, offset: 0.18 }, { opacity: 1, offset: 0.78 }, { opacity: 0 }], fx);
      capa.querySelector(".jg-fan-l").animate([{ opacity: 0 }, { opacity: 1, offset: 0.3 }, { opacity: 0.7, offset: 0.7 }, { opacity: 0 }], fx);
      fig.animate([{ transform: "translate3d(0,46px,0) rotateY(0turn)", opacity: 0 }, { transform: "translate3d(0,0,0) rotateY(1turn)", opacity: 1, offset: 0.42 }, { transform: "translate3d(0,-4px,0) rotateY(1turn)", opacity: 1, offset: 0.8 }, { transform: "translate3d(0,-10px,0) rotateY(1turn)", opacity: 0 }],
        { duration: 1500, easing: "cubic-bezier(.2,.75,.3,1)", fill: "both" });
      rot.animate([{ transform: "translate3d(0,10px,0)", opacity: 0 }, { transform: "translate3d(0,0,0)", opacity: 1, offset: 0.4 }, { opacity: 1, offset: 0.8 }, { opacity: 0 }], { duration: 1500, easing: "ease-out", fill: "both" });
      setTimeout(() => { chispas(18, fig, ["aro", "gemas"], x.tipo === "piedra" ? col : null); chispas(14, fig, ["polvo"]); }, 560);
      setTimeout(() => { capa.remove(); listo(); }, 1450);
    });
  }
  function celebracion(x) {
    if (document.documentElement.classList.contains("con-modal")) { A.avisar(x.tipo === "rango" ? "Nuevo rango: " + x.rango : "¡Hallazgo! Lo encuentras en Escudriña"); return; }
    if ((x.tipo === "piedra" || x.tipo === "lauro" || x.tipo === "raro") && !x._fan) { x._fan = true; sonar("hallazgo"); return fanfarria(x).then(() => celebracion(Object.assign(x, { _sin: true }))); }
    if (!x._sin) sonar("hallazgo");
    let arte, titulo, texto, compartirT;
    if (x.tipo === "lauro") { arte = lauro(); titulo = h("h3", { text: "¡Un lauro trenzado incorruptible!" }); texto = "El hallazgo más raro de Escudriña (1 Κοrίndsιοι 9:25; 2 Timoteo 2:5). Durante tus próximos 30 minutos de lectura tu experiencia vale el doble: el tiempo solo corre mientras lees y no vence."; compartirT = "¡Hallé un lauro trenzado incorruptible en Escudriña, el juego de Biblia Exacta!"; }
    else if (x.tipo === "piedra") { arte = gema(x.i, true); titulo = h("h3", { text: piedraNombre(x.i) }); texto = "Hallaste la " + ORDINAL[x.i] + " piedra del fundamento (Ἀpοκάlυpsις 21:19-20). Durante tus próximos 15 minutos de lectura tu experiencia vale ×1,5 (solo corre mientras lees)." + (x.doce ? " ¡Y reuniste las doce: tu experiencia vale un 5 % más para siempre!" : ""); compartirT = "Hallé " + PIEDRAS[x.i][1] + ", una de las doce piedras del fundamento, en Escudriña, el juego de Biblia Exacta."; }
    else if (x.tipo === "liga") { arte = gema(x.nvNuevo - 1, true); titulo = h("h3", { text: "¡Subiste a la liga " + ligaNombre(x.nvNuevo) + "!" }); texto = "Quedaste en el puesto " + x.pos + " de " + x.n + " de tu grupo" + (x.h ? ": +" + horas(x.h * 3600e3) + " de experiencia doble y " + x.dr + " dracmas" : "") + ". Esta semana lees en el " + ORDF[x.nvNuevo - 1] + " fundamento."; compartirT = "¡Subí a la liga " + ligaNombre(x.nvNuevo) + " en Escudriña!"; }
    else if (x.tipo === "raro") { const d = ((S.cfg && S.cfg.raros) || RAROS_C).find((z) => z[0] === x.id) || [x.id, "aura", "Accesorio raro", ""]; arte = A.svg(muestraAcc(d[0], d[1]), "0 0 48 48"); titulo = h("h3", { text: d[2] }); texto = "Reuniste 70 fragmentos de papiro marcando «Leído»: se abrió un accesorio raro" + (d[3] ? " (" + d[3] + ")" : "") + ". Ya está en tu Árbol, en la tienda, para llevarlo puesto. Solo se consigue leyendo."; compartirT = "Reuní 70 fragmentos de papiro leyendo la Nueva Voluntad y se abrió «" + d[2] + "» en Escudriña, el juego de Biblia Exacta."; }
    else { arte = emblema(S.yo && S.yo.emb ? S.yo.emb.l : "α", S.yo && S.yo.emb ? S.yo.emb.c : 0, S.yo && S.yo.marco); titulo = h("h3", { text: "Nuevo rango: " + x.rango }); texto = "Llegaste al nivel " + x.nivel + ". Desde ahora compites en la clasificación de " + x.rango + "."; compartirT = "Llegué al rango de " + x.rango + " en Escudriña, el juego de Biblia Exacta."; }
    A.abrirModal(() => A.cajaModal(A.cabModal(x.tipo === "rango" ? "Nuevo rango" : x.tipo === "liga" ? "Liga de la semana" : x.tipo === "raro" ? "Accesorio raro" : "Hallazgo", "Escudriña"), h("div", { class: "jg-cel" },
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
    const inicio = Date.now(), resp = r.preguntas.map(() => null), n = r.preguntas.length;
    let resultado = null, completos = [], btnVer = null;
    // V24 (BiEx, 12-nov-2026): la prueba en vidrio, sin backdrop-filter en la ventana (K15): capas translúcidas con filos de
    // luz sobre un fondo vivo (luces que se desplazan despacio, solo por el compositor). Tocar una opción solo cambia esa
    // pregunta (no se vuelve a dibujar la ventana). V23: al terminar, cada pregunta muestra su verso completo (Textual de BiEx).
    const pintarListo = () => {
      if (!btnVer) return;
      const listo = resp.every((x) => x != null);
      btnVer.disabled = !listo; btnVer.classList.toggle("listo", listo);
      btnVer.querySelector("span").textContent = listo ? "Ver resultado" : "Elige una opción en cada pregunta";
    };
    const tarjetaP = (p, i) => {
      const partes = p.t.split("_____");
      const hueco = h("u", { class: resultado || resp[i] != null ? "lleno" : null, text: resultado ? p.o[resultado.correctas[i]] : resp[i] != null ? p.o[resp[i]] : "\u00a0" });
      const ops = p.o.map((o, k) => h("button", {
        type: "button", class: "jg-op" + (resultado ? (k === resultado.correctas[i] ? " ok" : resp[i] === k ? " mal" : "") : ""), "aria-pressed": String(resp[i] === k), disabled: !!resultado,
        onclick: () => {
          if (resultado) return;
          resp[i] = k; vibrar(8);
          ops.forEach((bt, j) => bt.setAttribute("aria-pressed", String(j === k)));
          hueco.textContent = o; hueco.classList.remove("lleno"); void hueco.offsetWidth; hueco.classList.add("lleno");
          pintarListo();
        } }, h("span", { text: o })));
      const bien = resultado && resp[i] === resultado.correctas[i];
      const vc = resultado && completos[i] ? h("div", { class: "jg-vc" }, h("span", { class: "jg-vc-et", text: "Verso completo · Textual de BiEx" }), h("p", { class: "jg-vc-t vt" }, completos[i]())) : null;
      return h("section", { class: "jg-preg jg-vid" + (resultado ? (bien ? " bien" : " fallo") : ""), style: "--i:" + i },
        h("div", { class: "jg-preg-cab" }, h("span", { class: "ref", text: nombreLibro(lib) + " " + cap + ":" + p.v }), h("span", { class: "num", text: resultado ? (bien ? "Acertaste" : "La palabra era otra") : (i + 1) + " de " + n })),
        h("p", { class: "t" }, partes[0], hueco, partes.slice(1).join("_____")),
        h("div", { class: "jg-ops", role: "group", "aria-label": "Opciones" }, ops), vc);
    };
    const medalla = () => {
      const a = resultado.aciertos, C = 2 * Math.PI * 34, u = "qz" + Math.random().toString(36).slice(2, 7);
      const anillo = A.svg('<defs><linearGradient id="' + u + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff3cc"/><stop offset=".5" stop-color="#e8cf94"/><stop offset="1" stop-color="#b8892f"/></linearGradient></defs>' +
        '<circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,240,200,.13)" stroke-width="4.5"/>' +
        '<circle class="arco" cx="40" cy="40" r="34" fill="none" stroke="url(#' + u + ')" stroke-width="4.5" stroke-linecap="round" stroke-dasharray="' + C.toFixed(2) + '" stroke-dashoffset="' + (C * (1 - a / n)).toFixed(2) + '" transform="rotate(-90 40 40)"/>', "0 0 80 80");
      anillo.setAttribute("aria-hidden", "true");
      const arco = anillo.querySelector(".arco");
      if (!sinAnim() && arco.animate && a > 0) arco.animate([{ strokeDashoffset: C.toFixed(2) }, { strokeDashoffset: (C * (1 - a / n)).toFixed(2) }], { duration: 1100, easing: "cubic-bezier(.2,.8,.2,1)" });
      return h("div", { class: "jg-qz-med" + (a === n ? " plena" : "") }, anillo, h("b", { text: String(a) }), h("small", { text: "de " + n }));
    };
    const cuerpo = () => {
      const preguntas = r.preguntas.map(tarjetaP);
      let pie;
      if (resultado) {
        pie = h("div", { class: "jg-qz-res jg-vid" }, medalla(),
          h("p", { class: "jg-qz-xp", text: resultado.xp ? "+" + fmt(resultado.xp) + " de experiencia" : "Esta vez no hubo aciertos; la próxima saldrá mejor." }),
          h("p", { class: "jg-mini", text: resultado.aciertos === n ? "¡Todas! Cada verso que respondiste bien quedó marcado como leído." : resultado.aciertos ? "Los versos que respondiste bien quedaron marcados como leídos." : "Vuelve a leer el capítulo con calma: los versos completos están arriba." }),
          resultado.cofre ? cofreBloque(resultado.cofre) : null,
          h("button", { class: "btn oro", type: "button", onclick: () => A.cerrarModal() }, h("span", { text: "Seguir leyendo" })));
      } else {
        btnVer = h("button", { class: "btn oro jg-grande jg-qz-ver", type: "button", disabled: true, onclick: async (e) => {
          const bt = e.currentTarget; bt.disabled = true; bt.classList.add("enviando");
          const falta = 1600 * n - (Date.now() - inicio); if (falta > 0) await esperar(falta);
          const x = await pedir("/prueba/responder", { metodo: "POST", cuerpo: { id: r.id, r: resp } });
          if (x.error) { A.avisar(mensaje(x)); bt.classList.remove("enviando"); pintarListo(); return; }
          resultado = x; actualizarYo(x.yo); quitarPrueba(); if (x.cofre) COFRE.pend = x.cofre; { const e2 = espejo(); e2.p = e2.p.filter((k) => k !== lib + "." + cap); A.store.set("jg:hoy", e2); }
          // P20: cada pregunta bien respondida marca su verso como leído
          for (const [k, sx] of Object.entries(x.cfs || {})) guardarCf(k, sx);
          if ((x.cf || []).length) { if (A.marcarLeido) A.marcarLeido(lib, cap, x.cf); if (R.lib === lib && R.cap === cap) { for (const v of x.cf) LB.ok.add(lib + "." + cap + "." + v); pintarMarcados(); elegirLB(); finCapJuego(); } }
          if (x.aciertos === n) sonar("nivel"); else if (x.aciertos) sonar("chispa");
          for (const m of x.misiones || []) A.avisar("Misión cumplida: " + textoMision(m) + " · +" + m.xp);
          // V23: el verso completo de cada pregunta, en la Textual de BiEx
          completos = await Promise.all(r.preguntas.map((p) => (A.versoTextual ? A.versoTextual(lib, cap, p.v).catch(() => null) : null)));
          A.reemplazarModal(vistaP);
          setTimeout(() => { const c = document.querySelector(".modal[open] .jg-qz-res"); if (c) c.scrollIntoView({ block: "start", behavior: sinAnim() ? "auto" : "smooth" }); }, 140);
          if (x.aciertos === n) setTimeout(() => { const m = document.querySelector(".modal[open] .jg-qz-med"); if (m) chispas(16, m, ["aro", "polvo"]); }, 700);
        } }, h("span", { text: "Elige una opción en cada pregunta" }));
        pie = btnVer; setTimeout(pintarListo, 0);
      }
      return h("div", { class: "jg-qz" + (resultado ? " res" : "") }, h("div", { class: "jg-qz-fondo", "aria-hidden": "true" }, h("i"), h("i"), h("i")),
        h("p", { class: "jg-qz-intro", text: resultado ? "Así quedó tu prueba. Debajo de cada pregunta está su verso completo." : "Completa cada verso con la palabra que falta, tal como está en la Textual de BiEx." }), ...preguntas, pie);
    };
    const vistaP = () => A.cajaModal(A.cabModal("Prueba del capítulo", nombreLibro(lib) + " " + cap), cuerpo());
    R.prueba = false;
    A.abrirModal(vistaP);
  }
  // ------------------------------------------------------------------ cofre (T8, BiEx, 12-nov-2026)
  // Al terminar la prueba del capítulo (y, cuando llegue, al derrotar al Coloso de la Tradición). El servidor decide su
  // nivel y sus dracmas y las abona en el acto: abrirlo es verlo (si la ventana se cierra sin abrirlo, un aviso lo dice).
  // Cada nivel con su cita para leer en BiEx; su animación crece con el nivel (solo transformaciones y opacidad).
  const COFRES = [
    { n: "Cofre de barro", m: ["#d48a5a", "#7d3c20", "#5f2c16", "#f0b48c"], c: ["2CO", 4, 7], est: ["polvo"], col: "#e0a27a" },
    { n: "Cofre de bronce", m: ["#e0a865", "#7a4a22", "#55331a", "#f6cf98"], c: ["MAT", 13, 44], est: ["polvo", "brasas"], col: "#f0b46a" },
    { n: "Cofre de plata", m: ["#f6f8fb", "#8e98a4", "#66707c", "#ffffff"], c: ["MAT", 13, 52], est: ["aro", "filo"], col: "#e8eef6" },
    { n: "Cofre de oro", m: ["#ffe596", "#b07a1c", "#7f540f", "#fff4cc"], c: ["1PE", 1, 7], est: ["estela", "aro", "brasas"], col: "#f5c64e" },
    { n: "Cofre de bloques preciosos", m: ["#fff0b8", "#b8821f", "#7a520e", "#fff8e0"], c: ["REV", 21, 19, 20], est: ["gemas", "estela", "aro", "filo"], col: "#f5c64e" },
  ];
  const COFRE = { pend: null };
  function cofreSVG(k) {
    const C = COFRES[k].m, u = "cf" + Math.random().toString(36).slice(2, 7);
    const gemas = k === 4 ? PIEDRAS.slice(0, 8).map((p, i) => '<ellipse cx="' + (34 + i * 13) + '" cy="' + (i % 2 ? 107 : 77) + '" rx="3.6" ry="2.8" fill="' + p[2] + '" stroke="#fff6d8" stroke-width=".8"/>').join("") : "";
    const remaches = [30, 130].map((x) => '<circle cx="' + x + '" cy="77" r="1.8" fill="' + C[3] + '"/><circle cx="' + x + '" cy="107" r="1.8" fill="' + C[3] + '"/>').join("");
    const esq = (x, y, sx, sy) => '<path d="M' + x + " " + (y + 12 * sy) + "V" + y + "H" + (x + 12 * sx) + '" fill="none" stroke="' + C[3] + '" stroke-width="3" stroke-linecap="round"/>';
    return '<defs><linearGradient id="' + u + 'c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + C[0] + '"/><stop offset="1" stop-color="' + C[1] + '"/></linearGradient>' +
      '<linearGradient id="' + u + 't" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + C[3] + '"/><stop offset=".55" stop-color="' + C[0] + '"/><stop offset="1" stop-color="' + C[1] + '"/></linearGradient>' +
      '<radialGradient id="' + u + 'l" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fffbe8"/><stop offset=".5" stop-color="#ffe7a0" stop-opacity=".8"/><stop offset="1" stop-color="#ffd76a" stop-opacity="0"/></radialGradient></defs>' +
      '<ellipse cx="80" cy="126" rx="58" ry="6" fill="#000" opacity=".35"/>' +
      '<g class="cf-cuerpo"><rect x="20" y="62" width="120" height="60" rx="8" fill="url(#' + u + 'c)" stroke="' + C[2] + '" stroke-width="1.5"/>' +
      '<rect x="20" y="73" width="120" height="7" fill="' + C[2] + '" opacity=".8"/><rect x="20" y="103" width="120" height="7" fill="' + C[2] + '" opacity=".8"/>' + remaches + gemas +
      esq(24, 118, 1, -1) + esq(136, 118, -1, -1) + '</g>' +
      '<ellipse class="cf-luz" cx="80" cy="62" rx="56" ry="11" fill="url(#' + u + 'l)" opacity="0"/>' +
      '<g class="cf-tapa"><path d="M20 64V50Q20 30 80 27Q140 30 140 50V64Z" fill="url(#' + u + 't)" stroke="' + C[2] + '" stroke-width="1.5"/>' +
      '<path d="M22 46Q80 36 138 46" fill="none" stroke="' + C[2] + '" stroke-width="5" opacity=".75"/>' + esq(24, 54, 1, -1) + esq(136, 54, -1, -1) +
      (k === 4 ? '<ellipse cx="80" cy="38" rx="5" ry="3.6" fill="' + PIEDRAS[9][2] + '" stroke="#fff6d8" stroke-width=".9"/>' : "") +
      '<circle cx="80" cy="64" r="9" fill="' + C[3] + '" stroke="' + C[2] + '" stroke-width="1.5"/><circle cx="80" cy="62.6" r="2.2" fill="' + C[2] + '"/><path d="M78.8 63.6h2.4l-.6 4h-1.2z" fill="' + C[2] + '"/></g>';
  }
  function cofreBloque(cf) {
    const k = Math.max(0, Math.min(4, cf.n | 0)), D = COFRES[k];
    const fig = A.svg(cofreSVG(k), "0 0 160 140"); fig.setAttribute("class", "cf-svg"); fig.setAttribute("aria-hidden", "true");
    const col = h("i", { class: "cf-col", "aria-hidden": "true" }), halo = h("i", { class: "cf-halo", "aria-hidden": "true" });
    const cifra = h("b", { class: "cf-dr", text: "+0" });
    const ref = D.c[0] ? A.nombreLibro(D.c[0]) + " " + D.c[1] + ":" + D.c[2] + (D.c[3] ? "-" + D.c[3] : "") : "";
    const info = h("div", { class: "cf-info", hidden: true }, h("p", { class: "cf-n", text: D.n }), h("p", {}, cifra, " dracmas"),
      ref ? h("button", { class: "ap-cita", type: "button", onclick: () => verCita(D.c[0], D.c[1], D.c[2], D.c[3] || D.c[2]) }, h("i", { class: "ap-lumbre", "aria-hidden": "true" }), ref) : null);
    const caja = h("div", { class: "cf n" + k, style: "--cf:" + D.col }, halo, col, fig);
    const btn = h("button", { class: "btn oro chico cf-abrir", type: "button", onclick: () => abrir() }, h("span", { text: "Abrir el cofre" }));
    const raiz = h("div", { class: "cf-raiz" }, h("p", { class: "jg-mini cf-tit", text: "¡Ganaste un cofre!" }), caja, btn, info);
    if (!sinAnim() && fig.animate) fig.animate([{ transform: "translateY(0)" }, { transform: "translateY(-4px)" }, { transform: "translateY(0)" }], { duration: 2600, iterations: Infinity, easing: "ease-in-out" });
    let abierto = false;
    async function abrir() {
      if (abierto) return; abierto = true; COFRE.pend = null; btn.remove();
      vibrar([[12], [12, 30, 12], [16, 40, 16], [20, 40, 20, 40, 30], [30, 50, 30, 50, 60]][k]);
      const tapa = fig.querySelector(".cf-tapa"), luz = fig.querySelector(".cf-luz");
      if (!sinAnim() && fig.animate) {
        fig.getAnimations().forEach((a) => a.cancel());
        const g = 2 + k * 1.2;
        for (let i = 0; i <= k; i++) await fig.animate([{ transform: "rotate(0)" }, { transform: "rotate(-" + g + "deg)" }, { transform: "rotate(" + g + "deg)" }, { transform: "rotate(-" + g * 0.6 + "deg)" }, { transform: "rotate(0)" }], { duration: 380 - k * 30, easing: "ease-in-out" }).finished.catch(() => {});
        tapa.style.transformOrigin = "22px 62px"; tapa.style.transformBox = "view-box";
        tapa.animate([{ transform: "translate(0,0) rotate(0)" }, { transform: "translate(0,-14px) rotate(-26deg)" }, { transform: "translate(0,-10px) rotate(-20deg)" }], { duration: 420, easing: "cubic-bezier(.2,1.4,.4,1)", fill: "forwards" });
        luz.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, fill: "forwards" });
        halo.animate([{ opacity: 0.35, transform: "scale(.8)" }, { opacity: 1, transform: "scale(1.15)" }, { opacity: 0.7, transform: "scale(1)" }], { duration: 900, fill: "forwards", easing: "ease-out" });
        if (k >= 1) col.animate([{ opacity: 0, transform: "scaleY(.1)" }, { opacity: 1, transform: "scaleY(1)" }, { opacity: 0.55, transform: "scaleY(1)" }], { duration: 900 + k * 200, fill: "forwards", easing: "ease-out" });
        if (k >= 3) { const fl = h("div", { class: "cf-flash", "aria-hidden": "true" }); document.body.append(fl); fl.animate([{ opacity: 0 }, { opacity: k === 4 ? 0.7 : 0.45 }, { opacity: 0 }], { duration: 650, easing: "ease-out" }).finished.then(() => fl.remove(), () => fl.remove()); }
        chispas(8 + k * 8, caja, D.est, D.col);
        if (k >= 2) lluviaCofre(caja, k);
        sonar(k >= 4 ? "hallazgo" : k >= 3 ? "nivel" : "chispa");
        await esperar(380);
      }
      info.hidden = false; info.scrollIntoView({ block: "nearest", behavior: sinAnim() ? "auto" : "smooth" });
      if (!sinAnim() && info.animate) info.animate([{ opacity: 0, transform: "translateY(8px)" }, { opacity: 1, transform: "translateY(0)" }], { duration: 360, easing: "ease-out" });
      contarRapido(cifra, cf.dr, 700 + k * 150, "+");
    }
    return raiz;
  }
  // Monedas (anillo y punto, como la dracma del juego) y, en el de bloques preciosos, las piedras del fundamento
  function lluviaCofre(caja, k) {
    const r = caja.getBoundingClientRect(); if (!r.width) return;
    const capa = h("div", { class: "jg-chispas", "aria-hidden": "true" }); document.body.append(capa);
    const n = k === 2 ? 6 : k === 3 ? 10 : 16, cx = r.left + r.width / 2, cy = r.top + r.height * 0.42;
    for (let i = 0; i < n; i++) {
      const gema = k === 4 && i % 2, c = gema ? PIEDRAS[i % 12][2] : "#f5c64e";
      const el = h("i", { class: gema ? "cf-g" : "cf-m", style: "left:" + cx + "px;top:" + cy + "px;--c:" + c });
      capa.append(el);
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 1.9, d = 70 + Math.random() * 90, dx = Math.cos(a) * d, dy = Math.sin(a) * d;
      el.animate([{ transform: "translate(-50%,-50%) scale(.3)", opacity: 0 }, { transform: "translate(calc(-50% + " + dx * 0.6 + "px),calc(-50% + " + dy * 0.6 + "px)) scale(1)", opacity: 1, offset: 0.35 },
        { transform: "translate(calc(-50% + " + dx + "px),calc(-50% + " + (dy + 60) + "px)) scale(.8) rotate(" + (Math.random() * 300 - 150) + "deg)", opacity: 0 }], { duration: 1100 + Math.random() * 500, delay: i * 30, easing: "cubic-bezier(.2,.7,.3,1)", fill: "forwards" });
    }
    setTimeout(() => capa.remove(), 2200);
  }
  // Ventanas propias en vez de las del navegador (P13, BiEx, 11-nov-2026): la misma estética del resto del sitio
  function confirmar(titulo, texto, si, no) {
    return new Promise((listo) => {
      const prev = document.activeElement;
      const fin = (v) => { document.removeEventListener("keydown", tecla, true); capa.remove(); try { if (prev && prev.focus) prev.focus(); } catch (e) { /* sin foco */ } listo(v); };
      const tecla = (e) => { if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); fin(false); } };
      const bSi = h("button", { class: "btn oro", type: "button", onclick: () => fin(true) }, h("span", { text: si || "Seguir" }));
      const caja = h("div", { class: "jg-conf-c", role: "alertdialog", "aria-modal": "true", "aria-labelledby": "jgConfT", "aria-describedby": "jgConfX" },
        h("h3", { id: "jgConfT", text: titulo }), texto ? h("p", { id: "jgConfX", text: texto }) : null,
        h("div", { class: "jg-acciones" }, h("button", { class: "btn", type: "button", onclick: () => fin(false) }, h("span", { text: no || "Cancelar" })), bSi));
      const capa = h("div", { class: "jg-conf", onclick: (e) => { if (e.target === capa) fin(false); } }, caja);
      document.body.append(capa); document.addEventListener("keydown", tecla, true);
      if (!sinAnim() && caja.animate) { capa.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 180 }); caja.animate([{ transform: "translateY(10px) scale(.98)", opacity: 0 }, { transform: "none", opacity: 1 }], { duration: 220, easing: "cubic-bezier(.2,1,.3,1)" }); }
      setTimeout(() => bSi.focus(), 30);
    });
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
    marco(cont, cabSub("Liga de la semana", "La semana va " + textoSemana() + ". Cada liga lleva el nombre de una de las doce piedras del fundamento (Ἀpοκάlυpsις 21:19-20): se sube de fundamento en fundamento."), zona);
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
    return "Entre todos, lean " + n + " versos" + (m.ambito === "vida" ? " de los relatos de la vida de YēshŪ́aʿ" : m.ambito === "cartas" ? " de las cartas" : m.ambito === "libro" ? " de " + nombreLibro(m.lib) : "");
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
      const pct = Math.max(0, Math.min(100, (100 * m.total) / Math.max(1, m.meta))), mio = y.mision && y.mision.k === m.k && (y.mision.e | 0) === (m.e | 0) ? y.misAporte || 0 : 0, min = (S.cfg && S.cfg.misMin) || 10;
      // relevos (BiEx, 10-nov-2026): lograda antes de tiempo, la siguiente abre a los 20 min y corre hasta el final de la franja
      zona.replaceChildren(m.e ? h("p", { class: "jg-chip jg-relevo", text: "Relevo " + (m.e + 1) + " de " + ((m.relevos || 3) + 1) }) : null,
        h("p", { class: "jg-tit jg-mis-t", text: textoMisionMundial(m) }),
        h("p", { class: "jg-total" }, cifra(m.total), " de " + fmt(m.meta) + (m.ok ? " · ¡lograda!" : "")),
        m.ok && m.relevo ? h("p", { class: "jg-aviso" }, h("b", { text: "¡Lograda antes de tiempo! " }), "El relevo " + (m.e + 2) + " abre en ", (() => { const el = h("b", { class: "jg-rel-t", text: restaTexto(m.relevo) }); const t = setInterval(() => { if (!el.isConnected) return clearInterval(t); el.textContent = m.relevo > Date.now() ? restaTexto(m.relevo) : "un momento"; }, 15000); return el; })(), ": una misión nueva hasta el final de esta franja.") : null,
        h("div", { class: "jg-barra oro", role: "progressbar", "aria-valuemin": "0", "aria-valuemax": String(m.meta), "aria-valuenow": String(m.total), "aria-label": "Avance de la misión mundial" }, h("i", { style: "width:" + pct.toFixed(1) + "%" })),
        h("p", { class: "jg-mini" }, plural(m.part, "persona aporta", "personas aportan") + " · termina en " + restaTexto(m.fin) + (mio ? " · tu aporte: " + fmt(mio) : "")),
        h("p", { class: "jg-mini" }, relojCiudades(m.fin, "Termina el")),
        h("p", { class: "jg-mini", text: "Quien aporte " + min + " versos o más recibe 1 h de experiencia doble en cuanto se logra, y 15 min si no se alcanza. Hay una misión nueva cada dos días; su hora de comienzo se alterna para que a cada región del mundo le toque una cómoda. Si se logra antes de tiempo, a los 20 min abre un relevo (hasta " + (m.relevos || 3) + ") con su propia meta y su propio premio." }),
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
        return h("li", { class: "jg-fila" + (x.j === SL.yo6 ? " yo" : "") }, emblema(l, c, x.marco), h("span", { class: "n" }, x.apodo, h("small", { text: (x.anf ? "anfitrión · " : "") + (x.pais ? nombrePais(x.pais) + " · " : "") + (x.lc ? nombreLibro(lib) + " " + cap + (x.v ? ":" + x.v : "") + (x.guia ? " · guía la lectura" : "") : "todavía no abre un capítulo") })),
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
  const corto = (b) => String(nombreLibro(b) || b).split(" [")[0].split(" «")[0];
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
  // solo para las pruebas automáticas (navegador controlado): efectos a demanda
  if (navigator.webdriver) window.__biexJg = { chispas, celebracion, fanfarria, contarRapido, pulsoMedidor };
  window.BiExJuego = {
    iniciar(api) { A = api; if (!S.token) S.token = A.store.get("jg:t", null); if (!S.yo && S.token) S.yo = A.store.get("jg:yo", null); limpiarMarcasAuto(); },
    vista, capitulo, salir, franja, guardarInvitacion, marcarVerso: marcarVersoDesdeLector, activo: () => !!S.token,
  };
})();
