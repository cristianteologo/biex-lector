/* BiEx · Escudriña, el juego de Biblia Exacta (módulo del lector; se carga solo al abrir el juego o al leer con sesión).
   El lector solo informa lo que observó: cuánto tiempo estuvo cada verso a la vista, en orden. El servidor decide todo
   (experiencia, misiones, hallazgos) y firma cada sesión. Sin dependencias. */
(function () {
  "use strict";
  if (window.BiExJuego) return;
  let A = null; // lo que el lector presta: h, svg, ICO, avisar, store, ventanas, nombres de libros…
  const MIN = 60e3;
  // AL15 (BiEx, 22-nov-2026): solo el sitio publicado usa su propia puerta (/api/juego); las vistas previas de las ramas
  // (<rama>.bibliaexacta.pages.dev) y las copias usan la puerta publicada, así el código de una rama nunca habla por su cuenta
  // con el servidor del juego
  const API = String(window.BIEX_JUEGO_API || (location.hostname === "bibliaexacta.pages.dev" ? "/api/juego" : "https://bibliaexacta.pages.dev/api/juego")).replace(/\/$/, "");
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
  // Vibración configurable (Normal / Suave / Desactivada en biex:vib); las recompensas pueden vibrar también en Modo tranquilo
  const vibrar = (p) => {
    try {
      if (!navigator.vibrate) return;
      const modo = A && A.store ? A.store.get("vib", "normal") : "normal";
      if (modo === "no") return;
      if (modo === "suave") {
        const s = Array.isArray(p) ? p.map((v, i) => (i % 2 === 0 ? Math.max(6, Math.round(v * 0.55)) : v)) : Math.max(6, Math.round((+p || 10) * 0.55));
        navigator.vibrate(s);
        return;
      }
      navigator.vibrate(p);
    } catch (e) { /* sin vibración */ }
  };
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
    if (!navigator.onLine) return { error: "red" };
    const cab = {};
    if (o.cuerpo !== undefined) cab["content-type"] = "application/json";
    const t = S.token; if (t && !o.sin) cab.authorization = "Bearer " + t;
    if (o.cab) Object.assign(cab, o.cab);
    let r, ctl = null, reloj = 0;
    const ms = o.timeout || 10000;
    if (!o.keepalive && typeof AbortController !== "undefined" && ms > 0) {
      ctl = new AbortController();
      reloj = setTimeout(() => { try { ctl.abort(); } catch (e) {} }, ms);
    }
    // «guardable»: el navegador puede reutilizar la respuesta mientras valga (no gasta peticiones del plan gratuito)
    try { r = await fetch(API + ruta, { method: o.metodo || "GET", headers: cab, body: o.cuerpo !== undefined ? JSON.stringify(o.cuerpo) : undefined, keepalive: !!o.keepalive, credentials: "omit", cache: o.guardable ? "default" : "no-store", signal: ctl ? ctl.signal : undefined }); }
    catch (e) { clearTimeout(reloj); return { error: "red" }; }
    clearTimeout(reloj);
    let d = null;
    try { d = await r.json(); } catch (e) { d = { error: r.ok ? "datos" : "red" }; }
    if (!d || typeof d !== "object") d = { error: "datos" };
    if (!r.ok && !d.error) d.error = "http" + r.status;
    if (r.status === 401 && d.error === "sesion" && t && !o.sin) olvidarSesion(true);
    return d;
  }
  const MENSAJES = { red: "Sin conexión con el juego. Vuelve a intentarlo en un momento.", sin_ruptura: "No tienes ninguna perseverancia rota que recuperar: ¡sigue así!", renuevo_en_curso: "Ya tienes un Renuevo en curso: cumple sus misiones.", renuevo_espera: "El Renuevo se compra uno cada 2 semanas.", sin_servidor: "Escudriña abre muy pronto.", limite: "Demasiados intentos seguidos: espera unos minutos.",
    apodo_usado: "Ese apodo ya lo tiene otra persona.", codigo: "Ese código no existe. Revisa que esté completo.", vencido: "Se venció la espera: vuelve a intentarlo.",
    llave: "No se pudo comprobar la llave de acceso.", llave_desconocida: "Esa llave de acceso no corresponde a ningún perfil de Escudriña.", llave_usada: "Esa llave ya está en tu perfil.",
    llaves_max: "Ya tienes 10 llaves de acceso.", ya_vinculada: "Esa cuenta ya está vinculada a otro perfil.", sin_google: "La entrada con Google todavía no está activa.",
    ya_en_compania: "Ya estás en una compañía: para unirte a otra, primero sal de la tuya.", nombre_usado: "Ese nombre ya lo tiene otra compañía.", compania: "Ese código de compañía no existe.",
    compania_llena: "Esa compañía ya tiene 24 personas.", sala: "Esa sala no existe o ya venció.", llena: "Esa sala ya tiene 24 personas.", max_salas: "Ya tienes 2 salas abiertas a la vez (el máximo). Cierra una o espera a que venza antes de abrir otra.",
    apodo_espera: "Tu apodo se puede cambiar una vez cada 3 semanas.", lugar_espera: "Tu ciudad se puede cambiar una vez cada 2 meses.", dracmas: "Todavía no tienes las dracmas suficientes para esto." };
  // AF14 (21-nov-2026): los fallos del servidor dicen qué pasó y, si no tienen mensaje propio, llevan su código discreto
  Object.assign(MENSAJES, { interno: "El servidor del juego tuvo un tropiezo. Vuelve a intentarlo en un momento.", preguntas: "Las preguntas de este capítulo no llegaron. Vuelve a intentarlo en un momento.",
    vencida: "Esa prueba venció sin responderse: ábrela de nuevo para recibir otra.", rapido: "Toma un momento para leer cada pregunta antes de ver el resultado.", prueba: "Esa prueba ya se respondió.",
    sin_cargas: "Aún no tienes suficientes cargas para esa habilidad. Recuperas 1 carga cada 3 horas.", derrotado: "El Coloso de la Tradición ya fue derrotado esta semana.", habilidad: "Esa habilidad táctica no está disponible.", nombre_espera: "El nombre de la sala se puede cambiar una vez al día." });
  const mensaje = (r) => (r && (r.detalle && (r.error === "apodo" || r.error === "nombre") ? r.detalle : MENSAJES[r.error])) || "Algo no salió bien" + (r && r.error ? " (código «" + String(r.error).slice(0, 24) + "»)" : "") + ". Vuelve a intentarlo.";

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
    try { document.dispatchEvent(new Event("jg:yo")); } catch (e) {}
    // AA12: comparte resumen ligero al Service Worker para el widget de escritorio (sin peticiones extra)
    try {
      const sw = navigator.serviceWorker && navigator.serviceWorker.controller;
      if (sw) sw.postMessage({ tipo: "widgetDatos", nivel: yo.nivel | 0, rango: yo.rangoNombre || "", pers: yo.perseverancia | 0, hoyV: (yo.hoy && yo.hoy.v) | 0, apodo: yo.apodo || "" });
    } catch (e) {}
    const ult = Number(A.store.get("jg:avT", 0)) || 0, l = yo.avisos || [];
    if (l.length) {
      A.store.set("jg:avT", Math.max(ult, ...l.map((a) => a.t || 0)));
      const nuevos = ult ? l.filter((a) => a.t > ult && (a.k === "liga" || a.k === "compania" || a.k === "mision")) : [];
      if (nuevos.length) setTimeout(() => { for (const a of nuevos.reverse()) { if (a.k === "liga" && a.nvNuevo > a.nv) celebracion(Object.assign({ tipo: "liga" }, a)); else A.avisar(NOVEDAD[a.k](a)); } }, 1300);
    }
    if (yo.inv) A.store.set("jg:mio", yo.inv);
    registrarPoder(yo, yo.av);
    A.store.set("jg:inv", null);
    if (yo.rpMig === false) migrarRepasos();
  }
  // Neon (23-nov-2026): historial local de puntajes de Poder para consciencia de evolución (0 peticiones extra al servidor)
  function registrarPoder(yo, av) {
    if (!A || !A.store || !yo) return [];
    const p = (av && av.poder != null ? av.poder : yo.av && yo.av.poder) | 0;
    const nv = yo.nivel | 0, inv = yo.inv || "";
    if (!p && !nv) return [];
    let st = A.store.get("jg:poderHist", null);
    if (!st || typeof st !== "object" || st.inv !== inv || !Array.isArray(st.l)) st = { inv, l: [] };
    const ult = st.l[st.l.length - 1];
    if (!ult || ult.p !== p || ult.nv !== nv) {
      st.l.push({ t: Date.now(), p, nv });
      if (st.l.length > 36) st.l = [st.l[0], ...st.l.slice(-35)];
      A.store.set("jg:poderHist", st);
    }
    return st.l;
  }
  // Pausa automática de animaciones flotantes fuera de pantalla (0 % CPU al desplazarse lejos)
  let IO_FLOT = null;
  function observarFlotantes(el) {
    if (!el || !("IntersectionObserver" in window)) return el;
    if (!IO_FLOT) IO_FLOT = new IntersectionObserver((es) => { for (const e of es) e.target.classList.toggle("jg-pausa-vis", !e.isIntersecting); }, { rootMargin: "40px 0px" });
    IO_FLOT.observe(el);
    return el;
  }
  // Estadísticas públicas de jugadores (se muestran automáticamente en clasificaciones, ligas, compañías y salas en cuanto el servidor exponga poder/pers/vc)
  function resumenStatsPub(x) {
    if (!x) return "";
    const p = [];
    if (x.poder != null) p.push("poder " + fmt(x.poder | 0));
    if (x.pers > 0) p.push(fmt(x.pers | 0) + " d");
    if (x.vc > 0) p.push(fmt(x.vc | 0) + " v.");
    return p.join(" · ");
  }
  // AD2: una sola vez por cuenta, las marcas dobles guardadas en este dispositivo (jg:rp) pasan a la cuenta del servidor
  async function migrarRepasos() {
    if (S.rpEnviando || !S.token) return; const rp = A.store.get("jg:rp", null) || {};
    const lista = Object.fromEntries(Object.entries(rp).filter(([k, x]) => typeof x === "string" && x.includes("1")).slice(0, 400));
    S.rpEnviando = true;
    const r = await pedir("/marcas/repasos", { metodo: "POST", cuerpo: { rp: lista } });
    S.rpEnviando = false;
    if (r && !r.error) { guardarMarcas(r); if (S.yo) { S.yo.rpMig = true; if (r.lk) S.yo.lk = r.lk; A.store.set("jg:yo", S.yo); } if (r.n) pintarMarcados(); }
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

  // 12 bloques del fundamento (Ἀpοκάlυpsις 21:19-20 · Neon, 23-nov-2026): cada piedra con el corte y veta propios de su material
  // real (sin ids para repetirse en Tesoro, Ligas, Celebración y Guía; cero cruces ni estrellas)
  function gema(i, tiene) {
    const c = PIEDRAS[i][2], cl = mezcla(c, "#ffffff", 0.45), cm = mezcla(c, "#ffffff", 0.18), co = mezcla(c, "#000000", 0.32), cx = mezcla(c, "#000000", 0.52);
    const st = tiene ? mezcla(c, "#ffffff", 0.56) : "currentColor", f = tiene ? "" : ' fill-opacity=".14"';
    const brillo = (x, y, rx, ry, rot) => tiene ? '<ellipse cx="' + x + '" cy="' + y + '" rx="' + rx + '" ry="' + ry + '" transform="rotate(' + rot + " " + x + " " + y + ')" fill="#fff" opacity=".78"/>' : "";
    let d = "";
    if (i === 0) { // Ἴαspις [jaspe]: bloque mineral opaco redondeado con vetas orgánicas y motas ocres
      d = '<g stroke="' + st + '" stroke-width=".75" stroke-linejoin="round"' + f + '>' +
        '<path d="M13 9C20 6.5 29 7 35 11C41 15 42 25 38 33C34 40 23 42 15 38C7.5 34 6.5 22 9 14C10 11 11.2 9.8 13 9Z" fill="' + c + '"/>' +
        '<path d="M9.5 18C16 14 25 18 39 14C40 19 39.5 24 38.5 26C28 29 18 24 8.5 28Z" fill="' + co + '" opacity=".75" stroke="none"/>' +
        '<path d="M12 31C20 27 29 33 36.5 31.5C33.5 38 24 40.5 16 37.5Z" fill="' + cx + '" opacity=".72" stroke="none"/>' +
        '<path d="M11 14.5C18 12.5 27 14 35.5 11.5" fill="none" stroke="' + cl + '" stroke-width="1.4" opacity=".68" stroke-linecap="round"/>' +
        (tiene ? '<circle cx="19" cy="21" r="1.2" fill="#d9b25f" opacity=".8"/><circle cx="31" cy="28" r="1.1" fill="#d9b25f" opacity=".75"/><circle cx="24" cy="34" r=".9" fill="#f3d893" opacity=".7"/>' : "") +
        '</g>' + brillo(18, 13.5, 4.2, 1.4, -22);
    } else if (i === 1) { // Sάpfειrος [zafiro/lapislázuli antiguo]: cabujón oval real con motas doradas de pirita
      d = '<g stroke="' + st + '" stroke-width=".75" stroke-linejoin="round"' + f + '>' +
        '<ellipse cx="24" cy="24" rx="14.5" ry="17.5" fill="' + co + '"/>' +
        '<ellipse cx="24" cy="23.5" rx="11.8" ry="14.5" fill="' + c + '" stroke="none"/>' +
        '<ellipse cx="22.5" cy="20.5" rx="7.6" ry="9.4" fill="' + cm + '" opacity=".72" stroke="none"/>' +
        '<path d="M14 14Q24 9 34 14M13.5 33.5Q24 39 34.5 33.5" fill="none" stroke="' + cl + '" stroke-width=".65" opacity=".55"/>' +
        (tiene ? '<circle cx="18" cy="27" r="1.1" fill="#f5cf6b"/><circle cx="29.5" cy="19" r=".95" fill="#ffe7a6"/><circle cx="26.5" cy="31.5" r="1.15" fill="#e6b74c"/><circle cx="21" cy="15.5" r=".75" fill="#fff2c4"/>' : "") +
        '</g>' + brillo(18.5, 14.5, 3.6, 1.3, -38);
    } else if (i === 2) { // Χαlκēδṓn [calcedonia]: piedra pulida translúcida con bandas lechosas suaves
      d = '<g stroke="' + st + '" stroke-width=".75"' + f + '>' +
        '<path d="M24 7C33.5 7 40 14 40 24.5C40 34.5 33 41 24 41C14.5 41 8 34 8 24.5C8 14.5 14.5 7 24 7Z" fill="' + co + '"/>' +
        '<path d="M24 9.5C32 9.5 37.5 15.5 37.5 24.5C37.5 33 31.8 38.5 24 38.5C16 38.5 10.5 32.8 10.5 24.5C10.5 15.8 16 9.5 24 9.5Z" fill="' + c + '" stroke="none"/>' +
        '<path d="M11 22C17 17.5 31 17.5 37 22" fill="none" stroke="' + cl + '" stroke-width="2.4" opacity=".68" stroke-linecap="round"/>' +
        '<path d="M12.5 29.5C19 26 29 26 35.5 29.5" fill="none" stroke="#ffffff" stroke-width="1.6" opacity=".42" stroke-linecap="round"/>' +
        '<ellipse cx="24" cy="18" rx="8.5" ry="5.5" fill="' + cl + '" opacity=".38" stroke="none"/>' +
        '</g>' + brillo(18, 14.5, 4.4, 1.5, -28);
    } else if (i === 3) { // Smάrαgδος [esmeralda]: talla esmeralda escalonada octagonal rectangular
      d = '<g stroke="' + st + '" stroke-width=".7" stroke-linejoin="round"' + f + '>' +
        '<path d="M15 7H33L39 13V35L33 41H15L9 35V13Z" fill="' + cx + '"/>' +
        '<path d="M15 7H33L30 12.5H18Z" fill="' + cl + '"/><path d="M9 13L15 7L18 12.5L14 16.5Z" fill="' + cm + '"/>' +
        '<path d="M33 7L39 13L34 16.5L30 12.5Z" fill="' + c + '"/><path d="M9 13L14 16.5V31.5L9 35Z" fill="' + co + '"/>' +
        '<path d="M39 13V35L34 31.5V16.5Z" fill="' + cx + '"/><path d="M14 31.5L18 35.5H30L34 31.5L39 35L33 41H15L9 35Z" fill="' + co + '"/>' +
        '<path d="M18 12.5H30L34 16.5V31.5L30 35.5H18L14 31.5V16.5Z" fill="' + c + '"/>' +
        '<rect x="17.5" y="16" width="13" height="16" rx="1.2" fill="' + cm + '" opacity=".85"/>' +
        '</g>' + brillo(21, 18.5, 3.2, 1, -24);
    } else if (i === 4) { // Sαrδόnυc̅ṣ [sardónice]: bloque camafeo con estratos paralelos terracota y marfil
      d = '<g stroke="' + st + '" stroke-width=".75"' + f + '>' +
        '<rect x="9" y="8" width="30" height="32" rx="10" fill="' + cx + '"/>' +
        '<path d="M10 15H38V20.5H10Z" fill="#f7ebd2" stroke="none" opacity=".92"/>' +
        '<path d="M9.5 20.5H38.5V27.5H9.5Z" fill="' + c + '" stroke="none"/>' +
        '<path d="M10 27.5H38V31.5H10Z" fill="#f5e3c2" stroke="none" opacity=".88"/>' +
        '<path d="M11.5 31.5H36.5C35.5 36.8 31.5 39.5 24 39.5C16.5 39.5 12.5 36.8 11.5 31.5Z" fill="' + co + '" stroke="none"/>' +
        '<path d="M13 10.5H35C36.8 11.8 37.6 13.3 38 15H10C10.4 13.3 11.2 11.8 13 10.5Z" fill="' + cm + '" stroke="none"/>' +
        '<rect x="9" y="8" width="30" height="32" rx="10" fill="none" stroke="' + st + '" stroke-width=".85"/>' +
        '</g>' + brillo(18, 12.5, 4.4, 1.2, -12);
    } else if (i === 5) { // Sάrδιοn [cornalina / sardio]: cabujón lágrima-oval traslúcido de fuego cálido
      d = '<g stroke="' + st + '" stroke-width=".75"' + f + '>' +
        '<path d="M24 6.5C31 14 38 22 38 29C38 36.5 32 41.5 24 41.5C16 41.5 10 36.5 10 29C10 22 17 14 24 6.5Z" fill="' + cx + '"/>' +
        '<path d="M24 9.5C30 16 35.5 23 35.5 29C35.5 35 30.5 39 24 39C17.5 39 12.5 35 12.5 29C12.5 23 18 16 24 9.5Z" fill="' + c + '" stroke="none"/>' +
        '<ellipse cx="24" cy="29.5" rx="7.5" ry="7" fill="' + cl + '" opacity=".5" stroke="none"/>' +
        '<circle cx="24" cy="31" r="3.6" fill="#ffd29d" opacity=".48" stroke="none"/>' +
        '</g>' + brillo(19.5, 20.5, 2.2, 4.8, 22);
    } else if (i === 6) { // Χrυsόlιdsος [crisólito]: gema cojín facetada verde-dorado luminoso
      d = '<g stroke="' + st + '" stroke-width=".7" stroke-linejoin="round"' + f + '>' +
        '<path d="M16 8Q24 5.5 32 8L40 16Q42.5 24 40 32L32 40Q24 42.5 16 40L8 32Q5.5 24 8 16Z" fill="' + co + '"/>' +
        '<path d="M16 8L24 14L32 8L40 16L34 24L40 32L32 40L24 34L16 40L8 32L14 24L8 16Z" fill="' + c + '"/>' +
        '<path d="M16 8Q24 5.5 32 8L24 14Z" fill="' + cl + '"/><path d="M8 16L16 8L14 24Z" fill="' + cm + '"/>' +
        '<path d="M18 16H30L32 24L30 32H18L16 24Z" fill="' + cl + '" opacity=".86"/>' +
        '<path d="M21 19.5H27L28.5 24L27 28.5H21L19.5 24Z" fill="#fffbe0" opacity=".42" stroke="none"/>' +
        '</g>' + brillo(20.5, 14, 3.6, 1.1, -20);
    } else if (i === 7) { // Βḗrυllος [berilo]: prisma columnar hexagonal natural con estrías finas
      d = '<g stroke="' + st + '" stroke-width=".7" stroke-linejoin="round"' + f + '>' +
        '<path d="M14 13L24 7L34 13V35L24 41L14 35Z" fill="' + co + '"/>' +
        '<path d="M14 13L20 15.5V37.5L14 35Z" fill="' + cm + '"/><path d="M20 15.5L28 15.5V37.5L20 37.5Z" fill="' + c + '"/>' +
        '<path d="M28 15.5L34 13V35L28 37.5Z" fill="' + cx + '"/><path d="M14 13L24 7L34 13L28 15.5H20Z" fill="' + cl + '"/>' +
        '<path d="M22.5 18V35M25.5 18V35" fill="none" stroke="#ffffff" stroke-width=".6" opacity=".35"/>' +
        '</g>' + brillo(22, 11.2, 3.2, 1, -15);
    } else if (i === 8) { // Τοpάζιοn [topacio]: talla radiante cálida miel-dorada de 8 caras
      d = '<g stroke="' + st + '" stroke-width=".7" stroke-linejoin="round"' + f + '>' +
        '<path d="M17 7H31L39 15V33L31 41H17L9 33V15Z" fill="' + co + '"/>' +
        '<path d="M17 7H31L27.5 13H20.5Z" fill="' + cl + '"/><path d="M9 15L17 7L20.5 13L15 18.5Z" fill="#fff4c4" opacity=".9"/>' +
        '<path d="M31 7L39 15L33 18.5L27.5 13Z" fill="' + cm + '"/><path d="M9 15L15 18.5V29.5L9 33Z" fill="' + c + '"/>' +
        '<path d="M39 15V33L33 29.5V18.5Z" fill="' + cx + '"/><path d="M15 29.5L20.5 35H27.5L33 29.5L39 33L31 41H17L9 33Z" fill="' + co + '"/>' +
        '<path d="M20.5 13H27.5L33 18.5V29.5L27.5 35H20.5L15 29.5V18.5Z" fill="' + cm + '"/>' +
        '<path d="M24 15L30.5 24L24 33L17.5 24Z" fill="' + cl + '" opacity=".75"/>' +
        '</g>' + brillo(20.5, 16, 3.1, 1.1, -30);
    } else if (i === 9) { // Χrυsόprαsος [crisopraso]: cabujón verde manzana translúcido con luz interior cálida
      d = '<g stroke="' + st + '" stroke-width=".75"' + f + '>' +
        '<rect x="8.5" y="10" width="31" height="28" rx="13" fill="' + co + '"/>' +
        '<rect x="10.8" y="12.2" width="26.4" height="23.6" rx="11" fill="' + c + '" stroke="none"/>' +
        '<ellipse cx="24" cy="24" rx="10" ry="8.5" fill="' + cm + '" opacity=".72" stroke="none"/>' +
        '<ellipse cx="22.5" cy="22" rx="5.5" ry="4.2" fill="#eaffbe" opacity=".55" stroke="none"/>' +
        '</g>' + brillo(17.5, 16, 4.2, 1.4, -24);
    } else if (i === 10) { // ῾Hυάκιndsος [jacinto]: talla marquesa encendida de fuego canela-ámbar
      d = '<g stroke="' + st + '" stroke-width=".7" stroke-linejoin="round"' + f + '>' +
        '<path d="M24 6C32.5 12.5 37.5 18.5 37.5 24C37.5 29.5 32.5 35.5 24 42C15.5 35.5 10.5 29.5 10.5 24C10.5 18.5 15.5 12.5 24 6Z" fill="' + cx + '"/>' +
        '<path d="M24 6L30 16L24 14L18 16Z" fill="' + cl + '"/><path d="M18 16L10.5 24L18 32L24 24Z" fill="' + cm + '"/>' +
        '<path d="M30 16L37.5 24L30 32L24 24Z" fill="' + co + '"/><path d="M18 32L24 42L30 32L24 34Z" fill="' + cx + '"/>' +
        '<path d="M24 14L30 24L24 34L18 24Z" fill="' + c + '"/>' +
        '<path d="M24 18L27.5 24L24 30L20.5 24Z" fill="#ffd299" opacity=".62" stroke="none"/>' +
        '</g>' + brillo(20.5, 17, 2.2, 4, 24);
    } else { // Ἀmέdsυsτος [amatista]: drusa natural de tres cristales hexagonales de cuarzo violeta
      d = '<g stroke="' + st + '" stroke-width=".7" stroke-linejoin="round"' + f + '>' +
        '<path d="M8 38L10 21L15 16L19 22L18 38Z" fill="' + co + '"/><path d="M10 21L15 16L15 38H11Z" fill="' + cm + '"/>' +
        '<path d="M30 38L29 22L33 17L38 22L40 38Z" fill="' + cx + '"/><path d="M29 22L33 17L34 38H30Z" fill="' + c + '"/>' +
        '<path d="M16.5 39V17L24 7L31.5 17V39Z" fill="' + co + '"/>' +
        '<path d="M16.5 17L24 7V39H16.5Z" fill="' + c + '"/><path d="M24 7L20 17V39H24Z" fill="' + cm + '"/>' +
        '<path d="M24 7L28 17L24 14.5L20 17Z" fill="' + cl + '"/>' +
        '<path d="M10 38H38L35 41H13Z" fill="' + cx + '"/>' +
        '</g>' + brillo(21.8, 12.5, 1.4, 3.6, 14);
    }
    return A.svg(d, "0 0 48 48");
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
    libro: '<path d="M12 6.6C10 5 7.4 4.5 4 4.7v12.9c3.4-.2 6 .3 8 1.9 2-1.6 4.6-2.1 8-1.9V4.7c-3.4-.2-6 .3-8 1.9zM12 6.6v12.9" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/>',
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
      bienvenida: [[392, 0, 1.9], [523.25, 0.22, 1.9], [659.25, 0.44, 2.1], [783.99, 0.66, 2.3], [1046.5, 1.0, 2.6], [1318.5, 1.4, 2.4]],
      // AC12 (BiEx, 15-nov-2026): un sonido propio para cada premio
      cosecha: [[392, 0, 0.9], [587.3, 0.1, 0.9], [784, 0.2, 1.1], [987.8, 0.34, 1.2], [1174.7, 0.5, 1.5]],
      reparto: [[523.25, 0, 0.5], [659.25, 0.12, 0.55], [783.99, 0.24, 0.6], [1046.5, 0.38, 0.9], [1567.98, 0.52, 1.1]],
      fragmento: [[880, 0, 0.35], [1318.5, 0.05, 0.5], [1760, 0.13, 0.6]],
      dracma: [[1975.5, 0, 0.18], [2637, 0.06, 0.22], [3951, 0.12, 0.3]],
      // (15-nov-2026) la forja: dos golpes de yunque y un acorde que se abre
      forja: [[1396.9, 0, 0.22], [2793.8, 0.008, 0.16], [1396.9, 0.3, 0.24], [2793.8, 0.308, 0.18], [523.25, 0.6, 1.2], [783.99, 0.68, 1.3], [1046.5, 0.78, 1.5], [1567.98, 0.9, 1.4]] }[tipo] || [];
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
.jg-nivel{display:flex;justify-content:center;gap:10px;text-align:center;font:400 .8rem/1.3 var(--f-ui);color:var(--tenue);margin-top:6px}
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
.ap-gr-v{position:absolute;width:19%;aspect-ratio:1;transform:translate(-50%,-50%);border-radius:50%;pointer-events:none;opacity:var(--o,.5)}
.ap-gr-v::before,.ap-gr-v::after{content:"";position:absolute;border-radius:50%;will-change:opacity}
.ap-gr-v::before{inset:0;background:radial-gradient(closest-side,rgba(255,74,104,.34),rgba(224,33,63,.12) 58%,rgba(224,33,63,0));animation:ap-gr1 6.7s ease-in-out infinite alternate}
.ap-gr-v::after{inset:-16%;background:radial-gradient(closest-side,rgba(255,160,178,.16),rgba(255,160,178,0));animation:ap-gr2 10.3s ease-in-out -3.1s infinite alternate}
@keyframes ap-gr1{0%{opacity:.5}100%{opacity:1}}
@keyframes ap-gr2{0%{opacity:.25}100%{opacity:.9}}
.ap-arbol.quieto .ap-gr-v::before,.ap-arbol.quieto .ap-gr-v::after{animation-play-state:paused}
.ap-gr-b{position:absolute;width:14%;aspect-ratio:1;transform:translate(-50%,-50%);border-radius:50%;border:0;background:none;padding:0;cursor:pointer;-webkit-tap-highlight-color:transparent}
.ap-gr-b:focus-visible{outline:2px solid rgba(255,120,144,.8);outline-offset:3px}
.co-c{display:grid;gap:12px;justify-items:center;text-align:center}
.co-cesta{position:relative;width:min(220px,58vw);aspect-ratio:200/160}
.co-cesta svg{position:relative;display:block;width:100%;height:100%}
.co-cesta::before{content:"";position:absolute;inset:-18% -10% -6%;border-radius:50%;background:radial-gradient(closest-side,rgba(255,214,120,.28),rgba(255,214,120,0));opacity:calc(.25 + var(--f,0) * .75);pointer-events:none}
.co-cesta.llena::before{animation:ap-gr1 3.9s ease-in-out infinite alternate}
.co-txt{margin:0;max-width:560px;font-size:.9rem;line-height:1.5}
.co-est{margin:0;font-size:.82rem;color:var(--tinta-2);font-variant-numeric:tabular-nums}
.co-medidor{position:relative;width:min(300px,78vw);aspect-ratio:240/140;filter:drop-shadow(0 10px 18px rgba(0,0,0,.45))}
/* AC5 (15-nov-2026): al detenerse la aguja, un barrido de luz cruza el cristal una vez (solo opacidad y traslado) */
.co-destello{position:absolute;inset:6% 10% 18%;border-radius:50% 50% 0 0/100% 100% 0 0;overflow:hidden;pointer-events:none}
.co-destello::before{content:"";position:absolute;top:0;bottom:0;left:-40%;width:30%;background:linear-gradient(100deg,transparent,rgba(255,244,214,.28),transparent);opacity:0;transform:translateX(0)}
.co-medidor.brilla .co-destello::before{animation:co-barre 1.3s ease-out .1s 1 both}
@keyframes co-barre{0%{opacity:0;transform:translateX(0)}20%{opacity:1}100%{opacity:0;transform:translateX(480%)}}
html[data-mov="no"] .co-medidor.brilla .co-destello::before{animation:none}
/* AC5 y AC6: el verso de la Lectura que acompaña la cosecha y el reparto */
.jg-vl{position:relative;display:grid;gap:6px;justify-items:center;text-align:center;max-width:34rem;margin:4px auto 0;padding:14px 16px 12px;border-radius:16px;overflow:hidden;isolation:isolate;
 background:linear-gradient(180deg,color-mix(in srgb,var(--oro) 9%,transparent),transparent 60%),color-mix(in srgb,var(--hoja-2) 86%,transparent);border:1px solid color-mix(in srgb,var(--oro) 34%,transparent);box-shadow:0 10px 26px -18px rgba(0,0,0,.6);transition:opacity .5s ease,transform .5s ease}
.jg-vl.espera{opacity:0;transform:translateY(6px)}
.jg-vl-luz{position:absolute;inset:-40% -10% auto;height:80%;z-index:-1;background:radial-gradient(closest-side,color-mix(in srgb,var(--oro) 22%,transparent),transparent);opacity:.8}
.jg-vl-rot{font:600 .68rem/1 var(--f-ui);letter-spacing:.2em;text-transform:uppercase;color:var(--oro)}
.jg-vl .jg-vl-t{margin:0;font-family:var(--f-texto);font-size:1.02rem;line-height:1.55;color:var(--tinta)}
.jg-vl-pie{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:8px 10px;margin-top:4px}
.jg-vl-ref{display:inline-flex;align-items:center;gap:4px;font:500 .82rem/1 var(--f-ui);color:var(--oro-vivo);text-decoration:none;padding:6px 10px;border-radius:999px}
.jg-vl-ref svg{width:13px;height:13px}
.jg-vl-ref:focus-visible{outline:2px solid var(--oro-vivo);outline-offset:2px}
.jg-vl-lei{appearance:none;display:inline-flex;align-items:center;gap:6px;padding:6px 13px;border-radius:999px;border:1px solid color-mix(in srgb,var(--oro-vivo) 58%,transparent);
  background:linear-gradient(180deg,color-mix(in srgb,var(--oro) 22%,var(--hoja)),color-mix(in srgb,var(--oro) 9%,var(--hoja)));
  color:var(--oro-vivo);font:600 .74rem/1 var(--f-ui);letter-spacing:.05em;cursor:pointer;box-shadow:inset 0 1px 0 rgba(255,248,224,.28);transition:transform .14s,border-color .18s,background .18s}
.jg-vl-lei:hover,.jg-vl-lei:focus-visible{border-color:var(--oro-vivo);outline:none}
.jg-vl-lei:active{transform:scale(.96)}
.jg-vl-lei.hecho{border-color:color-mix(in srgb,var(--oro) 44%,transparent);background:color-mix(in srgb,var(--oro) 12%,var(--hoja));color:var(--oro);cursor:default}
.jg-vl-lei.esp{opacity:.78;cursor:wait}
.jg-vl-lei svg{width:14px;height:14px;flex:none}
/* AC6: la celebración del reparto de atributos */
.jg-rp-l{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;justify-content:center;gap:10px}
.jg-rp-m{display:grid;justify-items:center;gap:3px;min-width:84px;padding:12px 10px 10px;border-radius:16px;border:1px solid color-mix(in srgb,var(--ac) 30%,transparent);background:color-mix(in srgb,var(--hoja-2) 80%,transparent);opacity:.45;transform:translateY(6px) scale(.96);transition:opacity .5s ease,transform .5s cubic-bezier(.2,.9,.25,1.2),box-shadow .6s ease}
.jg-rp-m.on{opacity:1;transform:none;box-shadow:0 0 0 1px color-mix(in srgb,var(--ac) 45%,transparent),0 0 26px -4px color-mix(in srgb,var(--ac) 55%,transparent)}
.jg-rp-ico svg{width:30px;height:30px;color:var(--ac);filter:drop-shadow(0 0 6px color-mix(in srgb,var(--ac) 60%,transparent))}
.jg-rp-n{font:500 .78rem/1.2 var(--f-ui);color:var(--tinta-2)}
.jg-rp-v{font:500 1.5rem/1 var(--f-display);color:var(--tinta);font-variant-numeric:lining-nums tabular-nums}
.jg-rp-m small{font:600 .72rem/1 var(--f-ui);color:var(--ac)}
.jg-rp-p{margin:0;font:500 .9rem/1.2 var(--f-ui);color:var(--tinta-2)}
.jg-rp-cita{display:grid;gap:4px;justify-items:center;text-align:center;text-wrap:balance}
.jg-rp-ref{font-size:.88em;letter-spacing:.02em;color:var(--tinta-2)}
.jg-rp-p b{font:500 1.35rem/1 var(--f-display);color:var(--oro-vivo);margin-left:4px;font-variant-numeric:lining-nums tabular-nums}
html[data-mov="no"] .jg-rp-m{transition:none}
.co-medidor svg,.co-aguja{position:absolute;inset:0;width:100%;height:100%}
.co-aguja{transform-origin:50% 85.7%;transform:rotate(-90deg);will-change:transform}
.co-res{margin:0;display:grid;gap:2px}
.co-res b{font-size:1.6rem;font-family:var(--f-display,inherit);letter-spacing:.02em;color:#ffd77a}
.co-res small{font-size:.8rem;color:var(--tinta-2)}
/* Tablero horológico interactivo «Tu avance» (Argon, 23-nov-2026: cabecera simétrica en 2 celdas para eliminar vacío a la izquierda) */
.av-z{display:grid;gap:12px;margin-top:12px}
.jg-av-cab{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));align-items:stretch;gap:10px;padding:12px 14px;border-radius:16px;
  border:1px solid color-mix(in srgb,var(--oro) 30%,var(--linea-2));
  background:radial-gradient(120% 110% at 0% 0%,color-mix(in srgb,var(--oro) 16%,transparent),transparent 62%),linear-gradient(180deg,color-mix(in srgb,var(--hoja-2) 90%,transparent),color-mix(in srgb,var(--hoja) 94%,transparent));
  box-shadow:inset 0 1px 0 rgba(255,248,224,.14)}
.jg-av-izq{display:grid;align-content:space-between;justify-items:start;gap:4px;min-width:0;text-align:left;padding-right:10px;border-right:1px solid color-mix(in srgb,var(--oro) 18%,var(--linea-2))}
.av-tit{margin:0;font:600 .64rem/1.18 var(--f-ui);letter-spacing:.15em;text-transform:uppercase;color:var(--oro-vivo)}
.av-tot{font:600 clamp(1.55rem,4.8vw,2.15rem)/1.04 var(--f-display);color:var(--tinta);font-variant-numeric:lining-nums tabular-nums;text-align:left;justify-self:start;text-shadow:0 0 18px color-mix(in srgb,var(--oro) 28%,transparent)}
.jg-av-izq small{font:400 .72rem/1.3 var(--f-ui);color:var(--tinta-2)}
.jg-av-der{display:grid;align-content:space-between;justify-items:end;text-align:right;gap:5px;min-width:0}
.av-badge{display:inline-flex;align-items:center;padding:4px 10px;border-radius:999px;font:600 .66rem/1.1 var(--f-ui);letter-spacing:.04em;color:var(--tinta-2);border:1px solid color-mix(in srgb,var(--oro) 28%,var(--linea-2));background:color-mix(in srgb,var(--oro) 8%,transparent)}
.av-badge.sube{color:#b7f5ca;border-color:rgba(130,225,165,.48);background:rgba(70,175,112,.16)}
.av-badge.pico{color:#fff0bc;border-color:rgba(245,198,78,.58);background:rgba(232,184,72,.18)}
.av-foco-v{font:600 .8rem/1.2 var(--f-ui);color:var(--oro-vivo);font-variant-numeric:tabular-nums}
.av-meta-r{font:400 .68rem/1.25 var(--f-ui);color:var(--tenue);font-variant-numeric:tabular-nums}
.lk-z{display:flex;align-items:center;gap:16px;margin:4px 0 12px}.lk-med{flex:none;width:104px;height:104px}.lk-med b{font-size:2.3rem}
.lk-tx{min-width:0}.lk-t{margin:0 0 4px;font:500 1rem/1.4 var(--f-ui);color:var(--tinta)}.lk-h small{font-size:.68rem}
@media (max-width:420px){.lk-z{flex-direction:column;text-align:center}}
@media (max-width:350px){.jg-av-cab{grid-template-columns:1fr}.jg-av-izq{padding-right:0;padding-bottom:8px;border-right:0;border-bottom:1px solid color-mix(in srgb,var(--oro) 18%,var(--linea-2))}.jg-av-der{justify-items:start;text-align:left}}
.lk-libs{margin-top:10px}
.lk-libs summary small{padding:3px 9px;border-radius:999px;border:1px solid color-mix(in srgb,var(--oro) 30%,var(--linea-2));background:color-mix(in srgb,var(--oro) 9%,transparent);color:var(--oro-vivo)!important;font:600 .7rem/1.1 var(--f-ui)!important;font-variant-numeric:tabular-nums}
.lk-libs-nota{margin:0 10px 4px!important;padding:9px 12px;border-radius:10px;border:1px solid var(--linea-2);background:color-mix(in srgb,var(--hoja-2) 60%,transparent);text-align:center;text-wrap:balance}
.lk-lib-l{list-style:none;margin:0;padding:8px 10px 10px;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
.lk-lib-l>li:last-child:nth-child(odd){grid-column:1/-1}
@media (min-width:640px){.lk-lib-l{grid-template-columns:repeat(3,minmax(0,1fr))}.lk-lib-l>li:last-child:nth-child(odd){grid-column:auto}}
@media (max-width:340px){.lk-lib-l{grid-template-columns:1fr}}
.lk-lib-a{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:5px 8px;align-items:baseline;padding:9px 11px;border-radius:12px;text-decoration:none;color:var(--tinta);border:1px solid var(--linea-2);background:color-mix(in srgb,var(--hoja-2) 76%,transparent);transition:border-color .18s}
.lk-lib-a:hover,.lk-lib-a:focus-visible{border-color:var(--oro)}
.lk-lib-l li.hecho .lk-lib-a{border-color:color-mix(in srgb,var(--oro) 55%,transparent);background:color-mix(in srgb,var(--oro) 11%,transparent)}
.lk-lib-n{font:600 .78rem/1.22 var(--f-ui);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.lk-lib-p{font:600 .74rem/1 var(--f-ui);color:var(--oro-vivo);font-variant-numeric:tabular-nums;text-align:right}
.lk-lib-bar{grid-column:1/-1;height:4px;border-radius:999px;background:color-mix(in srgb,var(--oro) 12%,transparent);overflow:hidden}
.lk-lib-bar i{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,var(--oro-2),var(--oro-vivo))}
.lk-lib-c{font:400 .65rem/1.2 var(--f-ui);color:var(--tenue);font-variant-numeric:tabular-nums;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.lk-lib-ir{font:600 .64rem/1.2 var(--f-ui);color:var(--oro);font-variant-numeric:tabular-nums;text-align:right;white-space:nowrap}
.av-cif{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px}
.av-cif li{display:grid;border-radius:14px;border:1px solid color-mix(in srgb,var(--oro) 20%,var(--linea-2));background:linear-gradient(180deg,color-mix(in srgb,var(--oro) 8%,transparent),transparent);text-align:center;transition:border-color .2s,box-shadow .2s}
.av-cif.lk-h li{justify-items:center;gap:3px;padding:10px 4px}
.av-cif li.sel{border-color:color-mix(in srgb,var(--oro-vivo) 66%,transparent);background:linear-gradient(180deg,color-mix(in srgb,var(--oro) 18%,transparent),color-mix(in srgb,var(--oro) 4%,transparent));box-shadow:inset 0 1px 0 rgba(255,248,224,.22),0 8px 20px -14px color-mix(in srgb,var(--oro) 75%,transparent)}
.av-cif-b{all:unset;box-sizing:border-box;width:100%;height:100%;display:grid;justify-items:center;align-content:center;gap:3px;padding:10px 4px;border-radius:13px;cursor:pointer;-webkit-tap-highlight-color:transparent}
.av-cif-b:focus-visible{outline:2px solid var(--oro-vivo);outline-offset:-2px}
.av-cif b{font:600 1.24rem/1 var(--f-display);color:var(--oro-vivo);font-variant-numeric:lining-nums tabular-nums;text-shadow:0 0 14px color-mix(in srgb,var(--oro) 32%,transparent)}
.av-cif small{font:500 .64rem/1.2 var(--f-ui);color:var(--tinta-2)}
.av-sube{font:600 .64rem/1 var(--f-ui);color:#9fe0b4}
.av-antes{font-size:.6rem;color:var(--tenue)}
.av-graf{position:relative;padding:18px 10px 8px 26px;border-radius:16px;border:1px solid color-mix(in srgb,var(--oro) 20%,var(--linea-2));background:radial-gradient(95% 80% at 50% 100%,color-mix(in srgb,var(--oro) 10%,transparent),transparent 72%),color-mix(in srgb,var(--hoja-2) 66%,transparent)}
.av-rej{position:absolute;left:6px;right:8px;top:18px;bottom:38px;pointer-events:none}
.av-ln{position:absolute;left:20px;right:0;border-top:1px solid color-mix(in srgb,var(--tinta) 9%,transparent)}
.av-ln em{position:absolute;right:calc(100% + 5px);top:-6px;font:500 .56rem/1 var(--f-ui);font-style:normal;color:var(--tenue);font-variant-numeric:tabular-nums;white-space:nowrap}
.av-ln-max{top:0}.av-ln-mid{top:50%}
.av-ln-med{border-top:1px dashed color-mix(in srgb,var(--oro-vivo) 44%,transparent)}
.av-bar{position:relative;z-index:1;display:flex;align-items:flex-end;justify-content:center;gap:6px;height:146px;padding:0 2px}
.av-bar.denso{gap:3px}
.av-col{all:unset;box-sizing:border-box;flex:1;min-width:0;max-width:52px;display:grid;grid-template-rows:1fr 24px;gap:6px;height:100%;cursor:pointer;-webkit-tap-highlight-color:transparent}
.av-col:focus-visible .av-pozo{outline:2px solid var(--oro-vivo);outline-offset:1px}
.av-pozo{position:relative;display:block;overflow:hidden;border-radius:8px 8px 3px 3px;background:color-mix(in srgb,var(--oro) 8%,transparent);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--oro) 10%,transparent)}
.av-pozo i{position:absolute;left:0;right:0;bottom:0;border-radius:8px 8px 3px 3px;background:linear-gradient(180deg,#fff3c8,#e8b94d 42%,#8a5a0c);box-shadow:inset 0 1px 0 rgba(255,255,255,.6);animation:av-sube .78s cubic-bezier(.2,.8,.2,1) calc(var(--i) * 38ms) both}
.av-col.ya .av-pozo i{background:linear-gradient(180deg,#ffd5dd,#ff6d87 44%,#9e122c);box-shadow:inset 0 1px 0 rgba(255,255,255,.65),0 0 14px -2px rgba(255,95,126,.5)}
.av-col.sel .av-pozo{box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--oro-vivo) 58%,transparent)}
.av-col.sel .av-et-a,.av-col.sel .av-et-b{color:var(--oro-vivo);font-weight:600}
.av-col.ya .av-et-a{color:#ff9cae;font-weight:600}
.av-pico{position:absolute;left:50%;top:4px;width:5px;height:5px;margin-left:-2.5px;border-radius:50%;background:#fff7d6;box-shadow:0 0 8px #ffd872;pointer-events:none}
.av-col small{display:grid;place-items:center;align-content:center;gap:2px;font:500 .56rem/1 var(--f-ui);color:var(--tenue);text-align:center;font-variant-numeric:tabular-nums;overflow:visible}
.av-et-a{display:block;font-size:.54rem;letter-spacing:.02em;text-transform:uppercase;color:var(--tenue);white-space:nowrap}
.av-et-b{display:block;font-size:.6rem;font-weight:600;color:var(--tinta-2);white-space:nowrap}
.av-et-c{display:none}
@keyframes av-sube{from{transform:translate3d(0,100%,0)}to{transform:none}}
:root[data-theme=light] .av-badge.sube{color:#156936;border-color:rgba(21,105,54,.35);background:rgba(21,105,54,.1)}
:root[data-theme=light] .av-badge.pico{color:#78500b;border-color:rgba(138,106,43,.45);background:rgba(176,134,50,.15)}
:root[data-theme=light] .av-sube{color:#156936}
:root[data-theme=light] .av-col.ya .av-et-a{color:#a8203c}
.lk-proy{margin:12px 0 4px;padding:13px 15px;border-radius:16px;border:1px solid color-mix(in srgb,var(--oro) 34%,var(--linea-2));background:radial-gradient(120% 90% at 100% 0%,color-mix(in srgb,var(--oro) 13%,transparent),transparent 65%),linear-gradient(180deg,color-mix(in srgb,var(--hoja-2) 86%,transparent),color-mix(in srgb,var(--hoja) 92%,transparent));box-shadow:inset 0 1px 0 rgba(255,248,224,.12);display:grid;gap:10px}
.lk-proy-cab{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}
.lk-proy-tit{font:600 .66rem/1.15 var(--f-ui);letter-spacing:.15em;text-transform:uppercase;color:var(--oro-vivo)}
.lk-proy-corte{font:500 .64rem/1 var(--f-ui);color:var(--tenue);padding:4px 9px;border-radius:999px;border:1px solid color-mix(in srgb,var(--oro) 24%,var(--linea-2));background:color-mix(in srgb,var(--hoja) 84%,transparent);font-variant-numeric:tabular-nums}
.lk-proy-hero{display:flex;align-items:center;justify-content:space-between;gap:10px 14px;flex-wrap:wrap;padding:10px 12px;border-radius:12px;border:1px solid color-mix(in srgb,var(--oro) 26%,var(--linea-2));background:linear-gradient(110deg,color-mix(in srgb,var(--oro) 12%,transparent),color-mix(in srgb,var(--hoja) 65%,transparent))}
.lk-proy-hero-izq{display:grid;gap:2px}
.lk-proy-hero-izq small{font:500 .64rem/1.15 var(--f-ui);letter-spacing:.1em;text-transform:uppercase;color:var(--tenue)}
.lk-proy-hero-izq b{font:600 clamp(1.24rem,3.8vw,1.52rem)/1.1 var(--f-display);color:var(--tinta);font-variant-numeric:lining-nums tabular-nums}
.lk-proy-meta{display:inline-flex;align-items:center;padding:5px 11px;border-radius:999px;border:1px solid color-mix(in srgb,var(--oro) 42%,transparent);background:color-mix(in srgb,var(--oro) 14%,transparent);font:600 .74rem/1.2 var(--f-ui);color:var(--oro-vivo);font-variant-numeric:tabular-nums}
.lk-proy-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
@media (max-width:440px){.lk-proy-grid{grid-template-columns:1fr}}
.lk-proy-cel{display:grid;gap:3px;align-content:start;padding:9px 11px;border-radius:11px;border:1px solid var(--linea-2);background:color-mix(in srgb,var(--hoja) 72%,transparent)}
.lk-proy-cel small{font:600 .62rem/1.15 var(--f-ui);letter-spacing:.1em;text-transform:uppercase;color:var(--tenue)}
.lk-proy-cel b{font:600 .88rem/1.25 var(--f-ui);color:var(--tinta);font-variant-numeric:tabular-nums}
.lk-proy-cel span{font:400 .72rem/1.3 var(--f-ui);color:var(--tinta-2);font-variant-numeric:tabular-nums}
.lk-proy-cel.imp{border-color:color-mix(in srgb,var(--oro) 32%,var(--linea-2));background:color-mix(in srgb,var(--oro) 7%,var(--hoja))}
.lk-proy-cel.imp b{color:var(--oro-vivo)}
.lk-proy-pie{margin:0;font:400 .72rem/1.4 var(--f-ui);color:var(--tenue);text-align:center}
.jg-hoy-jer{margin:6px 0 0;padding-top:7px;border-top:1px solid var(--linea-2);font:400 .72rem/1.35 var(--f-ui);color:var(--tenue)}
@media (max-width:480px){.av-bar.denso .av-et-l{display:none}.av-bar.denso .av-et-c{display:inline}}
@media (max-width:420px){.av-cif{gap:4px}.av-cif-b,.av-cif.lk-h li{padding:8px 2px}.av-cif b{font-size:1.02rem}.av-cif small{font-size:.53rem}.av-graf{padding:16px 6px 8px 22px}.av-ln{left:16px}.av-bar.denso{gap:2px}.av-et-a{font-size:.5rem}.av-et-b{font-size:.55rem}}
@media (prefers-reduced-motion:reduce){.av-pozo i{animation:none}}
html[data-mov="no"] .av-pozo i{animation:none}
.fr-c{display:grid;gap:14px;justify-items:center}
.fr-gr{position:relative;width:min(232px,60vw);aspect-ratio:1}
.fr-gr::before{content:"";position:absolute;inset:-14%;border-radius:50%;background:radial-gradient(closest-side,rgba(255,70,100,.2),rgba(255,70,100,0));animation:ap-gr1 7.9s ease-in-out infinite alternate;pointer-events:none}
.fr-gr svg{position:relative;display:block;width:100%;height:100%}
.fr-gr .gr-cam{transition:opacity .35s ease}
.fr-gr.elige .gr-cam:not(.sel){opacity:.55}
.fr-rej{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;width:100%;max-width:660px;list-style:none;margin:0;padding:0}
.fr-t{display:grid;justify-items:center;align-content:start;gap:4px;width:100%;min-height:100%;padding:10px 4px 9px;border-radius:14px;border:1px solid rgba(255,96,122,.2);background:linear-gradient(180deg,rgba(255,60,90,.08),rgba(255,60,90,.02));color:inherit;font:inherit;cursor:pointer;transition:border-color .25s,box-shadow .25s}
.fr-t:focus-visible{outline:2px solid rgba(255,120,144,.8);outline-offset:2px}
.fr-t.sel{border-color:rgba(255,118,142,.62);box-shadow:inset 0 0 0 1px rgba(255,118,142,.22),0 8px 22px -12px rgba(255,60,90,.7)}
.fr-dot{width:15px;height:15px;border-radius:50%;background:radial-gradient(circle at 38% 34%,#ff9aab,#c8183a 58%,#550716);box-shadow:0 0 var(--l,0px) rgba(255,70,100,.85)}
.fr-dot.cero{background:radial-gradient(circle at 38% 34%,#7a2a36,#3a0a12 70%);box-shadow:none}
.fr-t b{font-size:.78rem;font-weight:600;letter-spacing:.01em;line-height:1.2;max-width:100%;overflow-wrap:anywhere}
.fr-t small{font-size:.7rem;color:var(--tinta-2);font-variant-numeric:tabular-nums}
.fr-bar{width:76%;height:3px;border-radius:2px;background:rgba(127,127,127,.18);overflow:hidden}
.fr-bar i{display:block;height:100%;width:var(--p,0%);background:linear-gradient(90deg,#b3132e,#ff6f86)}
.fr-desc{max-width:660px;margin:0;text-align:center;font-size:.9rem;line-height:1.55}
.fr-pie{margin:0;text-align:center;font-size:.8rem;color:var(--tinta-2)}
@media (min-width:900px){.fr-c{grid-template-columns:auto minmax(0,1fr);align-items:center;justify-items:stretch;column-gap:28px}.fr-c .fr-gr{width:236px}.fr-c .fr-desc,.fr-c .fr-pie{grid-column:1/-1}}
.ap-datos{display:grid;gap:10px;padding:4px 16px 16px}
.ap-ap{display:flex;flex-wrap:wrap;align-items:baseline;justify-content:center;gap:4px 12px;margin:0;text-align:center}
.ap-ap b{font:500 1.5rem/1.15 var(--f-display);color:var(--tinta)}
.ap-ap span{font:500 .86rem/1.3 var(--f-ui);color:var(--oro)}
.ap-prog{text-align:center;margin:0}
.ap-cifras{list-style:none;margin:2px 0 0;padding:0;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}
.ap-cifras li{display:grid;justify-items:center;align-content:center;gap:3px;padding:9px 4px;border-radius:13px;border:1px solid var(--linea-2);background:linear-gradient(180deg,color-mix(in srgb,var(--tinta) 6%,transparent),color-mix(in srgb,var(--tinta) 1.5%,transparent));box-shadow:inset 0 1px 0 rgba(255,255,255,.06);text-align:center}
.ap-cifras li.ap-cif-p{padding:0;border-color:color-mix(in srgb,var(--oro) 34%,var(--linea-2))}
.ap-cif-btn{all:unset;box-sizing:border-box;display:grid;justify-items:center;align-content:center;gap:3px;width:100%;height:100%;padding:9px 4px;border-radius:12px;cursor:pointer;transition:background-color .2s,box-shadow .2s;-webkit-tap-highlight-color:transparent}
.ap-cif-btn:hover,.ap-cif-btn:focus-visible{background:color-mix(in srgb,var(--oro) 11%,transparent);outline:none;box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--oro) 55%,transparent)}
.ap-cifras b{font:600 1.05rem/1.1 var(--f-ui);color:var(--oro-vivo);font-variant-numeric:tabular-nums}
.ap-cifras small{font:400 .7rem/1.2 var(--f-ui);color:var(--tinta-2)}
.ap-foto{justify-content:center}
/* Cabecera simétrica de Atributos (Neon, 23-nov-2026): en móvil (<520 px) puntos centrados arriba y dracmas + Poder equilibrados debajo; en pantallas anchas todo en una fila limpia */
.ap-cab{display:grid;grid-template-columns:auto minmax(0,1fr);align-items:center;gap:10px 10px;padding:11px 12px;border-radius:15px;border:1px solid color-mix(in srgb,var(--oro) 22%,var(--linea-2));background:linear-gradient(180deg,color-mix(in srgb,var(--oro) 7%,transparent),transparent);box-shadow:inset 0 1px 0 rgba(255,248,224,.06)}
.ap-cab-l{display:contents}
.ap-pts{grid-column:1/-1;width:100%;text-align:center;padding-bottom:8px;border-bottom:1px solid color-mix(in srgb,var(--oro) 16%,transparent);font:500 .88rem/1.25 var(--f-ui);color:var(--tinta)}
.ap-pts b{font-size:1.2rem;color:var(--oro-vivo);margin-right:3px;font-variant-numeric:tabular-nums}
.ap-cab .ap-saldo{justify-self:start}
@media (min-width:520px){.ap-cab{grid-template-columns:minmax(0,1fr) auto;gap:10px 14px;padding:10px 14px}.ap-cab-l{display:flex;align-items:center;gap:12px;flex-wrap:wrap;min-width:0}.ap-pts{grid-column:auto;width:auto;text-align:left;padding-bottom:0;border-bottom:0}}
@media (max-width:305px){.ap-cab{grid-template-columns:1fr;justify-items:center}.ap-cab .ap-saldo,.ap-cab-r{justify-self:center}}
/* AF33 (Neon, 22-nov-2026): medallón de alta relojería para el botón de Poder; gema tallada sin cruz ni estrella, filo de oro labrado, reflejo metálico por compositor y descargas finas */
.ap-poder{position:relative;display:inline-flex;align-items:center;gap:8px;padding:6px 13px 6px 8px;border-radius:999px;border:1.25px solid transparent;cursor:pointer;isolation:isolate;-webkit-tap-highlight-color:transparent;
  background:radial-gradient(120% 150% at 22% -35%,rgba(255,244,210,.22),transparent 58%) padding-box,linear-gradient(180deg,#1a1610,#0d0b08 62%,#16120c) padding-box,linear-gradient(135deg,#fff6d6,#cfa042 24%,#5e3f10 49%,#e6c26e 76%,#fff4cc) border-box;
  box-shadow:inset 0 1px 0 rgba(255,248,224,.36),inset 0 -1px 0 rgba(201,168,101,.26),inset 0 -9px 14px -10px rgba(201,168,101,.48),0 0 0 3px color-mix(in srgb,var(--oro) 11%,transparent),0 10px 22px -12px rgba(0,0,0,.88),0 0 18px -6px rgba(155,210,255,.32);
  font:600 .64rem/1 var(--f-ui);letter-spacing:.14em;text-transform:uppercase;color:var(--oro);transition:transform .18s cubic-bezier(.2,.8,.2,1),box-shadow .22s ease}
.ap-poder:hover{transform:translateY(-1px);box-shadow:inset 0 1px 0 rgba(255,250,230,.5),inset 0 -1px 0 rgba(232,207,148,.38),inset 0 -9px 14px -10px rgba(232,207,148,.62),0 0 0 3px color-mix(in srgb,var(--oro) 18%,transparent),0 12px 24px -12px rgba(0,0,0,.92),0 0 24px -5px rgba(170,220,255,.46)}
.ap-poder:active{transform:scale(.97)}
.ap-poder:focus-visible{outline:2px solid var(--oro-vivo);outline-offset:3px}
.ap-pd-corte{position:absolute;inset:0;border-radius:inherit;overflow:hidden;pointer-events:none}
.ap-pd-brillo{position:absolute;top:-30%;bottom:-30%;left:0;width:44%;opacity:.48;background:linear-gradient(108deg,transparent 12%,rgba(255,246,214,.32) 45%,rgba(191,227,255,.26) 54%,transparent 84%);transform:translate3d(-150%,0,0);animation:ap-pd-sh 7.4s cubic-bezier(.4,0,.2,1) 1.2s infinite;will-change:transform}
@keyframes ap-pd-sh{0%,66%{transform:translate3d(-150%,0,0)}100%{transform:translate3d(380%,0,0)}}
.ap-pd-gema{position:relative;flex:none;width:22px;height:22px;border-radius:50%;display:grid;place-items:center;
  background:radial-gradient(circle at 38% 30%,#272118,#0b0a08 72%);border:1px solid rgba(232,207,148,.58);box-shadow:inset 0 1px 2px rgba(0,0,0,.85),0 0 8px rgba(150,205,255,.32)}
.ap-pd-gema svg{position:relative;z-index:1;width:14px;height:14px;display:block}
.ap-pd-gema-luz{position:absolute;inset:-4px;border-radius:50%;pointer-events:none;background:radial-gradient(closest-side,rgba(182,224,255,.52),rgba(232,207,148,.16) 56%,transparent 75%);animation:ap-orbe 3.8s ease-in-out infinite;will-change:opacity}
@keyframes ap-orbe{0%,100%{opacity:.34}50%{opacity:.95}}
.ap-pd-t{position:relative;z-index:1;color:color-mix(in srgb,var(--oro-vivo) 82%,var(--tinta-2))}
.ap-poder b{position:relative;z-index:1;font:600 1.26rem/1 var(--f-display);letter-spacing:.02em;text-transform:none;font-variant-numeric:lining-nums tabular-nums;
  background:linear-gradient(180deg,#fffdf4,#f5d685 52%,#be8e33);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;filter:drop-shadow(0 1px 4px rgba(0,0,0,.65))}
.ap-pd-ir{position:relative;z-index:1;font:500 .9rem/1 var(--f-ui);color:var(--oro);opacity:.78;margin-left:-2px}
.ap-pd-aura{position:absolute;inset:-8px;z-index:-1;border-radius:999px;pointer-events:none;opacity:0;background:radial-gradient(62% 135% at 50% 50%,rgba(175,220,255,.34),transparent 72%);box-shadow:0 0 22px 4px rgba(150,205,255,.4);will-change:opacity}
.ap-rayos{position:absolute;inset:-13px;pointer-events:none;opacity:0;filter:drop-shadow(0 0 2.5px rgba(155,210,255,.88));will-change:opacity}
.ap-rayos svg{display:block;width:100%;height:100%;overflow:visible}
:root[data-theme="light"] .ap-poder{background:radial-gradient(120% 150% at 22% -35%,rgba(255,252,240,.85),transparent 58%) padding-box,linear-gradient(180deg,#fdf9f0,#ede3cf 64%,#e2d4b8) padding-box,linear-gradient(135deg,#fff8e2,#b88c38 26%,#6e4d14 50%,#c59a45 76%,#f8e8be) border-box;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.85),inset 0 -8px 14px -10px rgba(138,106,43,.32),0 0 0 3px rgba(138,106,43,.1),0 8px 18px -12px rgba(45,32,12,.38)}
:root[data-theme="light"] .ap-pd-t{color:var(--oro)}
:root[data-theme="light"] .ap-poder b{background:linear-gradient(180deg,#5b4010,#8c6620 55%,#442e09);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;filter:none}
:root[data-theme="light"] .ap-pd-gema{background:radial-gradient(circle at 38% 30%,#2c2418,#120f0b 76%);border-color:rgba(138,106,43,.7)}
@media (prefers-reduced-motion:reduce){.ap-pd-gema-luz,.ap-pd-brillo{animation:none}.ap-pd-brillo{opacity:0}}
html[data-mov="no"] .ap-pd-gema-luz,html[data-mov="no"] .ap-pd-brillo{animation:none}html[data-mov="no"] .ap-pd-brillo{opacity:0}
/* AF33 v3 · Cámara Orbital del Poder (Neon, 23-nov-2026): optimizada para desplazamiento sedoso en móvil sin cortes —
   3 planos excéntricos de oro entrelazados en períodos coprimos, sin preserve-3d anidado dentro de clip circular, sin
   filter:drop-shadow en texto animado, pausa automática fuera de pantalla y al abrir ventana modal; cero cruces ni estrellas */
.ap-vp{--vp-c1:#e8cf94;--vp-c2:#6ea8e0;--vp-c3:#e84866;--vp-c4:#4db9ae;--vp-c5:#e8be63;--vp-c6:#c59bf0;--vp-luz:#e8cf94;display:grid;gap:14px;text-align:left;width:100%;min-width:0}
:root[data-theme="light"] .ap-vp{--vp-c1:#8a6418;--vp-c2:#275e96;--vp-c3:#a81834;--vp-c4:#1d786b;--vp-c5:#926311;--vp-c6:#6a3ea1}
.ap-vp-marco{display:grid;justify-items:center;gap:6px;width:100%}
.ap-vp-reloj{position:relative;width:min(288px,80vw);aspect-ratio:1;margin:0 auto;touch-action:pan-y;cursor:grab;user-select:none;-webkit-user-select:none;contain:layout style}
.ap-vp-reloj:active{cursor:grabbing}
.ap-vp-escena{position:relative;width:100%;height:100%;transform:none}
.ap-vp-escena.inclinada{transform:perspective(820px) rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg));will-change:transform}
.ap-vp-cam{position:absolute;inset:2px;border-radius:50%;overflow:hidden;border:1.5px solid transparent;contain:layout style paint;
  background:radial-gradient(circle at 46% 35%,#22180b 0%,#0b0805 42%,#040405 78%,#000 100%) padding-box,
    linear-gradient(135deg,#fff5cf,#d7a645 22%,#593a0e 49%,#e6c06a 76%,#fff1c2) border-box;
  box-shadow:inset 0 0 26px rgba(0,0,0,.92),inset 0 1px 0 rgba(255,246,214,.34),0 16px 30px -16px rgba(0,0,0,.85)}
:root[data-theme="light"] .ap-vp-cam{box-shadow:inset 0 0 26px rgba(0,0,0,.92),inset 0 1px 0 rgba(255,246,214,.38),0 0 0 3px rgba(138,106,43,.14),0 14px 26px -14px rgba(45,32,12,.42)}
.ap-vp-luz{position:absolute;inset:10%;border-radius:50%;pointer-events:none;
  background:radial-gradient(closest-side,color-mix(in srgb,var(--vp-luz) 28%,transparent),color-mix(in srgb,var(--vp-et,#e8cf94) 11%,transparent) 52%,transparent 78%);
  animation:ap-vp-lat 7.3s ease-in-out infinite;will-change:opacity}
@keyframes ap-vp-lat{0%,100%{opacity:.46}50%{opacity:.92}}
.ap-vp-gira{position:absolute;inset:-4%;pointer-events:none;will-change:transform;animation:ap-vp-rot var(--vt,47s) linear infinite}
.ap-vp-gira.inv{animation-direction:reverse}
.ap-vp-gira svg{display:block;width:100%;height:100%;overflow:visible}
@keyframes ap-vp-rot{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
.ap-vp-dest{position:absolute;inset:12%;pointer-events:none;will-change:transform;animation:ap-vp-rot var(--dt,23s) linear infinite}
.ap-vp-dest.inv{animation-direction:reverse}
.ap-vp-dest i{position:absolute;left:var(--dx,50%);top:var(--dy,8%);width:var(--ds,16px);height:var(--ds,16px);margin:calc(var(--ds,16px) * -.5) 0 0 calc(var(--ds,16px) * -.5);border-radius:50%;
  background:radial-gradient(closest-side,#fffdf4 0,rgba(255,232,165,.92) 24%,rgba(224,173,72,.35) 54%,transparent 80%)}
.ap-vp-anillo{position:absolute;inset:2px;pointer-events:none;transform:translate3d(calc(var(--px,0px) * .45),calc(var(--py,0px) * .45),0)}
.ap-vp-anillo svg,.ap-vp-parc svg{display:block;width:100%;height:100%;overflow:visible}
.ap-vp-parcs{position:absolute;inset:2px;pointer-events:none;transform:translate3d(calc(var(--px,0px) * .65),calc(var(--py,0px) * .65),0)}
.ap-vp-parc{position:absolute;inset:0;opacity:.62;transition:opacity .28s ease}
.ap-vp-parc.act{opacity:1}
.ap-vp-parc.ten{opacity:.28}
.ap-vp-rayos{position:absolute;inset:-4%;pointer-events:none;opacity:0;will-change:opacity}
.ap-vp-rayos svg{display:block;width:100%;height:100%;overflow:visible}
.ap-vp-velo{position:absolute;inset:21%;border-radius:50%;pointer-events:none;
  background:radial-gradient(closest-side,rgba(5,4,3,.88) 0,rgba(7,6,4,.72) 64%,rgba(7,6,4,0) 100%)}
.ap-vp-centro{position:absolute;inset:20%;display:grid;place-content:center;justify-items:center;text-align:center;gap:3px;pointer-events:none;
  transform:translate3d(var(--px,0px),var(--py,0px),0)}
.ap-vp-rot{font:600 .6rem/1 var(--f-ui);letter-spacing:.26em;text-transform:uppercase;color:#d6b267;text-shadow:0 1px 6px rgba(0,0,0,.9)}
.ap-vp-val{position:relative;font:500 clamp(2.15rem,7vw,2.75rem)/1 var(--f-display);letter-spacing:.015em;font-variant-numeric:lining-nums tabular-nums;
  background:linear-gradient(180deg,#fffef8 0%,#fce29c 36%,#d49e3c 72%,#8c5e14 100%);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
.ap-vp-et{font:600 .61rem/1.15 var(--f-ui);letter-spacing:.14em;text-transform:uppercase;color:var(--vp-et,#ffe39a);margin-top:3px;padding:3px 9px;border-radius:999px;
  border:1px solid color-mix(in srgb,var(--vp-et,#ffe39a) 44%,transparent);background:rgba(12,9,5,.82)}
.ap-vp-falta{font:400 .66rem/1.25 var(--f-ui);color:#cbc2b1;max-width:16ch;margin-top:2px;text-shadow:0 1px 5px rgba(0,0,0,.9)}
.ap-vp-pista{margin:0;text-align:center;font:500 .64rem/1.2 var(--f-ui);letter-spacing:.12em;text-transform:uppercase;color:var(--tenue);opacity:.78;transition:opacity .4s ease}
.ap-vp-pista.visto{opacity:.38}
.ap-vp-banda{display:grid;gap:8px;padding:12px 13px;border-radius:16px;border:1px solid color-mix(in srgb,var(--vp-et,var(--oro)) 34%,var(--linea-2));background:linear-gradient(180deg,color-mix(in srgb,var(--vp-et,var(--oro)) 8%,var(--hoja-2)),color-mix(in srgb,var(--hoja) 92%,transparent));contain:layout style}
.ap-vp-bcab{display:flex;justify-content:space-between;align-items:baseline;gap:6px 10px;flex-wrap:wrap;font:500 .75rem/1.3 var(--f-ui);color:var(--tinta-2)}
.ap-vp-bcab b{color:var(--oro-vivo);font-weight:600;font-variant-numeric:tabular-nums}
.ap-vp-tramo{position:relative;height:8px;border-radius:99px;background:color-mix(in srgb,var(--hoja-3) 82%,rgba(0,0,0,.4));box-shadow:inset 0 1px 3px rgba(0,0,0,.55),0 0 0 1px color-mix(in srgb,var(--oro) 22%,transparent);overflow:hidden}
.ap-vp-tramo>i{position:absolute;inset:0;display:block;border-radius:inherit;background:linear-gradient(90deg,var(--oro-2),var(--vp-et,var(--oro-vivo)) 72%,#fff4cf);transform:translate3d(calc(var(--p,0) * 1% - 100%),0,0)}
:root[data-theme="light"] .ap-vp-tramo{background:#ddd2be;box-shadow:inset 0 1px 3px rgba(45,32,12,.25)}
:root[data-theme="light"] .ap-vp-tramo>i{background:linear-gradient(90deg,#6e4e15,#b3852f 68%,#dfb862)}
.ap-vp-etapas{list-style:none;margin:2px 0 0;padding:0;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:4px}
.ap-vp-etapas li{display:grid;justify-items:center;align-content:start;gap:2px;padding:5px 2px;border-radius:10px;border:1px solid transparent;text-align:center;opacity:.52}
.ap-vp-etapas li.ok{opacity:.86}
.ap-vp-etapas li.act{opacity:1;border-color:color-mix(in srgb,var(--ec) 52%,var(--oro));background:color-mix(in srgb,var(--ec) 12%,transparent)}
:root[data-theme="light"] .ap-vp-etapas li.act{border-color:var(--oro);background:color-mix(in srgb,var(--oro) 11%,transparent)}
.ap-vp-etapas em{font:600 .56rem/1 var(--f-ui);font-style:normal;letter-spacing:.08em;color:var(--tenue)}
.ap-vp-etapas i{width:7px;height:7px;border-radius:1.5px;transform:rotate(45deg);background:var(--ec);box-shadow:0 0 6px color-mix(in srgb,var(--ec) 55%,transparent);margin:1px 0}
.ap-vp-etapas li:not(.ok):not(.act) i{background:transparent;border:1px solid var(--linea);box-shadow:none}
.ap-vp-etapas b{font:600 .62rem/1.12 var(--f-ui);color:var(--tinta);text-wrap:balance;max-width:100%}
.ap-vp-etapas small{font:400 .58rem/1 var(--f-ui);color:var(--tenue);font-variant-numeric:tabular-nums}
.ap-vp-sec{font:600 .68rem/1.2 var(--f-ui);letter-spacing:.16em;text-transform:uppercase;color:var(--oro);margin:2px 0 -4px}
.ap-vp-pilares{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;contain:layout style}
.ap-vp-pbtn{all:unset;position:relative;overflow:hidden;box-sizing:border-box;width:100%;display:grid;gap:5px;padding:10px 11px;border-radius:14px;cursor:pointer;border:1px solid color-mix(in srgb,var(--pc) 30%,var(--linea-2));
  background:radial-gradient(125% 95% at 0% 0%,color-mix(in srgb,var(--pc) 13%,transparent),transparent 72%),color-mix(in srgb,var(--hoja-2) 82%,transparent);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.08);transition:transform .2s cubic-bezier(.2,.8,.2,1),border-color .2s,box-shadow .22s;-webkit-tap-highlight-color:transparent}
.ap-vp-pbtn:hover{transform:translateY(-1.5px);border-color:color-mix(in srgb,var(--pc) 58%,transparent)}
.ap-vp-pbtn:active{transform:scale(.98)}
.ap-vp-pbtn:focus-visible{outline:2px solid var(--oro-vivo);outline-offset:2px}
.ap-vp-pbtn.sel{border-color:color-mix(in srgb,var(--pc) 82%,transparent);box-shadow:inset 0 1px 0 rgba(255,248,224,.18),inset 0 0 0 1px color-mix(in srgb,var(--pc) 26%,transparent),0 10px 22px -14px color-mix(in srgb,var(--pc) 75%,transparent)}
.ap-vp-ptop{display:flex;align-items:center;justify-content:space-between;gap:6px;font:600 .72rem/1.2 var(--f-ui);color:var(--tinta)}
.ap-vp-pnom{display:inline-flex;align-items:center;gap:6px;min-width:0}
.ap-vp-pnom i{width:7px;height:7px;border-radius:1.5px;transform:rotate(45deg);background:var(--pc);box-shadow:0 0 8px color-mix(in srgb,var(--pc) 65%,transparent);flex:none}
.ap-vp-ppct{font:500 .66rem/1 var(--f-ui);color:var(--tenue);font-variant-numeric:tabular-nums}
.ap-vp-pnum{display:flex;align-items:baseline;justify-content:space-between;gap:6px;flex-wrap:wrap}
.ap-vp-pnum b{font:600 1.28rem/1 var(--f-display);color:var(--pc);font-variant-numeric:lining-nums tabular-nums}
.ap-vp-pnum small{font:400 .66rem/1.2 var(--f-ui);color:var(--tenue);font-variant-numeric:tabular-nums}
.ap-vp-pbar{position:relative;height:3.5px;border-radius:99px;background:color-mix(in srgb,var(--tinta) 10%,transparent);overflow:hidden}
.ap-vp-pbar i{position:absolute;inset:0;display:block;border-radius:inherit;background:linear-gradient(90deg,color-mix(in srgb,var(--pc) 72%,var(--oro-2)),var(--pc));transform:translate3d(calc(var(--w,0) * 1% - 100%),0,0)}
.ap-vp-foco{margin:0;padding:10px 12px;border-radius:12px;border:1px solid color-mix(in srgb,var(--vp-luz) 30%,var(--linea-2));background:linear-gradient(110deg,color-mix(in srgb,var(--vp-luz) 8%,transparent),color-mix(in srgb,var(--hoja-2) 62%,transparent) 70%);font:400 .8rem/1.48 var(--f-ui);color:var(--tinta-2);transition:border-color .25s ease}
.ap-vp-foco b{color:var(--oro-vivo);font-weight:600}
.ap-vp-stats{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;contain:layout style}
@media (min-width:440px){.ap-vp-stats{grid-template-columns:repeat(3,minmax(0,1fr))}}
.ap-vp-stats li{display:grid;min-width:0}
.ap-vp-stbtn{all:unset;position:relative;overflow:hidden;box-sizing:border-box;width:100%;display:grid;justify-items:center;align-content:center;gap:3px;padding:11px 7px 10px;border-radius:14px;cursor:pointer;text-align:center;min-width:0;
  border:1px solid color-mix(in srgb,var(--sc,var(--oro)) 26%,var(--linea-2));
  background:radial-gradient(120% 90% at 50% -15%,color-mix(in srgb,var(--sc,var(--oro)) 15%,transparent),transparent 70%),linear-gradient(180deg,color-mix(in srgb,var(--hoja-2) 86%,transparent),color-mix(in srgb,var(--hoja) 78%,transparent));
  box-shadow:inset 0 1px 0 rgba(255,248,224,.12),0 6px 14px -12px rgba(0,0,0,.6);
  transition:transform .2s cubic-bezier(.2,.8,.2,1),border-color .2s,box-shadow .22s;-webkit-tap-highlight-color:transparent}
.ap-vp-stbtn::after{content:"";position:absolute;top:-35%;bottom:-35%;left:0;width:44%;pointer-events:none;opacity:0;
  background:linear-gradient(108deg,transparent 15%,color-mix(in srgb,var(--sc,#ffe8a8) 42%,#fff) 50%,transparent 85%);
  transform:translate3d(-170%,0,0)}
.ap-vp-stbtn.sel::after{animation:ap-vp-dest 1.15s cubic-bezier(.25,.7,.2,1) 1}
@keyframes ap-vp-dest{0%{opacity:0;transform:translate3d(-170%,0,0)}22%{opacity:.46}100%{opacity:0;transform:translate3d(360%,0,0)}}
.ap-vp-stbtn:hover{transform:translateY(-2px);border-color:color-mix(in srgb,var(--sc,var(--oro)) 62%,transparent)}
.ap-vp-stbtn:active{transform:scale(.97)}
.ap-vp-stbtn:focus-visible{outline:2px solid var(--oro-vivo);outline-offset:2px}
.ap-vp-stbtn.sel{border-color:color-mix(in srgb,var(--sc,var(--oro)) 80%,transparent);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--sc,var(--oro)) 26%,transparent),0 10px 22px -14px color-mix(in srgb,var(--sc,var(--oro)) 72%,transparent)}
.ap-vp-sttop{display:inline-flex;align-items:center;gap:5px}
.ap-vp-sttop i{width:5.5px;height:5.5px;border-radius:1.2px;transform:rotate(45deg);background:var(--sc,var(--oro));flex:none}
.ap-vp-stbtn b{font:600 1.08rem/1.1 var(--f-display);color:var(--sc,var(--oro-vivo));font-variant-numeric:lining-nums tabular-nums}
.ap-vp-stbtn span{font:600 .67rem/1.2 var(--f-ui);color:var(--tinta);letter-spacing:.02em}
.ap-vp-stbtn small{font:400 .61rem/1.2 var(--f-ui);color:var(--tenue);font-variant-numeric:tabular-nums}
:root[data-theme="light"] .ap-vp-stbtn{box-shadow:inset 0 1px 0 rgba(255,255,255,.7),0 6px 14px -12px rgba(45,32,12,.22)}
.ap-vp-stnota{margin:0;padding:8px 11px;border-radius:11px;border:1px solid var(--linea-2);background:color-mix(in srgb,var(--oro) 6%,var(--hoja-2));font:400 .76rem/1.44 var(--f-ui);color:var(--tinta-2)}
.ap-vp-stnota b{color:var(--oro-vivo);font-weight:600}
.ap-vp-pie{display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:6px 8px;padding-top:4px;font:400 .76rem/1.45 var(--f-ui);color:var(--tinta-2);text-align:center}
.ap-vp-pie .ap-cita{font:600 .76rem/1.3 var(--f-ui);color:var(--oro-vivo);display:inline-flex;align-items:center;gap:.28em;padding:2px 7px;border-radius:999px;border:1px solid color-mix(in srgb,var(--oro) 30%,transparent);background:color-mix(in srgb,var(--oro) 8%,transparent)}
.ap-vp.pausa .ap-vp-luz,.ap-vp.pausa .ap-vp-gira,.ap-vp.pausa .ap-vp-dest,.ap-vp.fuera .ap-vp-luz,.ap-vp.fuera .ap-vp-gira,.ap-vp.fuera .ap-vp-dest{animation-play-state:paused}
@media (max-width:340px){.ap-vp-pilares{grid-template-columns:1fr}.ap-vp-etapas b{font-size:.54rem}}
@media (prefers-reduced-motion:reduce){.ap-vp-luz,.ap-vp-gira,.ap-vp-dest,.ap-vp-stbtn.sel::after{animation:none}}
html[data-mov="no"] .ap-vp-luz,html[data-mov="no"] .ap-vp-gira,html[data-mov="no"] .ap-vp-dest,html[data-mov="no"] .ap-vp-stbtn.sel::after{animation:none}
/* Fluidez en Árbol y ventanas abiertas (Neon, 23-nov-2026): contención de pintura y pausa total del fondo detrás de cualquier modal */
.ap-arbol,.ser-in,.jg-tarjeta{contain:layout style}
.ser-in.quieto .si-niebla,.ser-in.quieto .si-mo,
html.con-modal #vista .ap-vida i,html.con-modal #vista .ap-gr-v::before,html.con-modal #vista .ap-gr-v::after,html.con-modal #vista .ap-bebe,
html.con-modal #vista .si-niebla,html.con-modal #vista .si-mo,html.con-modal #vista .ap-pd-gema-luz,html.con-modal #vista .ap-pd-brillo,
html.con-modal #vista .jg-yo *{animation-play-state:paused!important}
/* Cuenta atrás de El Coloso de la Tradición (sábado 28-nov-2026 · 18:00 UTC) con señal sutil de novedad (solo compositor) */
.jg-coloso{position:relative;overflow:hidden;border:1px solid color-mix(in srgb,var(--oro) 58%,transparent);border-radius:18px;padding:15px 16px;display:grid;gap:10px;
  background:radial-gradient(125% 110% at 50% -25%,color-mix(in srgb,var(--oro) 20%,transparent),transparent 62%),linear-gradient(180deg,color-mix(in srgb,var(--hoja-2) 92%,transparent),color-mix(in srgb,var(--hoja) 96%,transparent));
  box-shadow:inset 0 1px 0 rgba(255,248,224,.22),0 14px 28px -18px rgba(0,0,0,.78);contain:layout paint style}
.jg-coloso::after{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(108deg,transparent 34%,color-mix(in srgb,var(--oro-vivo) 14%,transparent) 50%,transparent 66%);transform:translate3d(-115%,0,0);animation:jg-coloso-luz 8.5s ease-in-out infinite;will-change:transform}
@keyframes jg-coloso-luz{0%,56%{transform:translate3d(-115%,0,0)}100%{transform:translate3d(115%,0,0)}}
.jg-coloso-cab{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}
.jg-coloso-nov{display:inline-flex;align-items:center;gap:7px;font:600 .64rem/1.1 var(--f-ui);letter-spacing:.16em;text-transform:uppercase;color:var(--oro-vivo)}
.jg-coloso-dot{position:relative;flex:none;width:7px;height:7px;border-radius:50%;background:var(--oro-vivo);box-shadow:0 0 8px color-mix(in srgb,var(--oro-vivo) 75%,transparent)}
.jg-coloso-dot::after{content:"";position:absolute;inset:-4px;border-radius:50%;border:1.5px solid var(--oro-vivo);opacity:0;animation:jg-coloso-pulso 2.6s ease-out infinite}
@keyframes jg-coloso-pulso{0%{transform:scale(.5);opacity:.85}100%{transform:scale(1.9);opacity:0}}
html.con-modal .jg-coloso::after,html.con-modal .jg-coloso-dot::after,html.desplazando .jg-coloso::after,html.desplazando .jg-coloso-dot::after{animation-play-state:paused}
html[data-mov="no"] .jg-coloso::after,html[data-mov="no"] .jg-coloso-dot::after{animation:none;display:none}
@media (prefers-reduced-motion:reduce){.jg-coloso::after,.jg-coloso-dot::after{animation:none;display:none}}
.jg-coloso-h{margin:0;font:500 clamp(1.18rem,4.2vw,1.48rem)/1.18 var(--f-display);color:var(--tinta);letter-spacing:.02em}
.jg-coloso-p{margin:0;font:400 .82rem/1.48 var(--f-ui);color:var(--tinta-2)}
.jg-coloso-chip{font:600 .62rem/1 var(--f-ui);letter-spacing:.14em;text-transform:uppercase;color:var(--oro-vivo);padding:4px 9px;border-radius:999px;border:1px solid color-mix(in srgb,var(--oro) 44%,transparent);background:color-mix(in srgb,var(--oro) 11%,transparent)}
.jg-coloso .jg-cuenta{margin:0;width:100%;justify-items:stretch}
.jg-coloso .jg-cuenta>.jg-mini,.jg-coloso .jg-zonas{text-align:center}
.jg-coloso .jg-reloj{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;width:100%}
.jg-coloso .jg-reloj>span{min-width:0;padding:8px 3px;border-radius:12px;border-color:color-mix(in srgb,var(--oro) 28%,var(--linea-2));background:linear-gradient(180deg,color-mix(in srgb,var(--hoja-2) 92%,transparent),color-mix(in srgb,var(--hoja) 88%,transparent))}
.jg-coloso .jg-reloj b{font:600 clamp(1.18rem,4.6vw,1.5rem)/1.1 var(--f-display);font-variant-numeric:lining-nums tabular-nums}
.jg-coloso .jg-reloj small{font-size:.58rem;letter-spacing:.05em}
@media (max-width:305px){.jg-coloso .jg-reloj{grid-template-columns:repeat(2,minmax(0,1fr))}}
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
.ap-plan{font:600 .74rem/1 var(--f-ui);color:var(--oro-vivo);white-space:nowrap;letter-spacing:.01em}
.ap-bs{display:flex;gap:8px}
.ap-b{width:30px;height:30px;border-radius:50%;border:1px solid color-mix(in srgb,var(--ac) 42%,transparent);background:linear-gradient(180deg,color-mix(in srgb,var(--tinta) 9%,transparent),color-mix(in srgb,var(--tinta) 2%,transparent));box-shadow:inset 0 1px 0 rgba(255,255,255,.1);color:var(--tinta);font:500 1.05rem/1 var(--f-ui);cursor:pointer;display:grid;place-items:center;padding:0}
.ap-b:active{transform:scale(.9)}
.ap-desc{margin:0;min-height:2.9em;font:400 .84rem/1.45 var(--f-ui)!important;color:var(--tinta-2)}
.ap-desc b{color:var(--oro-vivo);font-weight:600}
.ap-arm{display:grid;grid-template-columns:minmax(112px,40%) minmax(0,1fr);gap:10px;align-items:center}
.ap-fig{display:grid;place-items:center;padding:0;background:none}
/* AC19 (15-nov-2026): antes «.si», que chocaba con la clase de estado «si» del lector (aviso «Actualizar», «Leído», «Repasado»): nunca una clase genérica sin prefijo */.ser-in{position:relative;width:100%;max-width:230px;aspect-ratio:300/420;margin:0 auto;isolation:isolate}
.ser-in .si-c,.ser-in .si-mueve{position:absolute;inset:0;width:100%;height:100%}
.ser-in .si-mueve{will-change:transform}
.ser-in .si-fig{position:absolute;inset:0;transform-origin:50% 94%;will-change:transform}
.ser-in .si-luces,.ser-in .fa-luz,.ser-in .fa-luz>svg{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
.ser-in .fa-luz{opacity:0}
.ser-in .fa-luz.on{will-change:opacity}
/* (15-nov-2026) mientras se desplaza, en pausa lo ambiental de Escudriña (vuelve al detenerse) */
/* (BiEx, 21-nov-2026, AF5) lo ambiental del juego ya no se detiene al desplazar: todo va por el compositor (transform y opacidad) */
.ser-in svg{overflow:visible}
.ser-in .si-mueve>svg{position:absolute;inset:0;width:100%;height:100%}
.si-alma,.si-pecho{position:absolute;border-radius:50%;pointer-events:none;will-change:opacity}
.si-alma{left:41%;top:18%;width:18%;height:16%;background:radial-gradient(closest-side,color-mix(in srgb,var(--si-luz,#ffe4a0) 55%,transparent),transparent);opacity:.38}
.si-pecho{left:37%;top:31%;width:26%;height:18%;background:radial-gradient(closest-side,color-mix(in srgb,var(--si-luz,#ffe4a0) 70%,transparent),transparent);opacity:var(--si-pecho,.55)}
.si-niebla{position:absolute;left:8%;right:8%;bottom:1%;height:13%;border-radius:50%;pointer-events:none;background:radial-gradient(closest-side,rgba(255,244,214,.16),rgba(255,244,214,0));will-change:transform,opacity;animation:si-niebla 23s ease-in-out infinite alternate}
.si-niebla.n2{left:18%;right:-2%;bottom:3%;height:10%;animation-duration:31s;animation-delay:-9s;opacity:.8}
@keyframes si-niebla{0%{transform:translate3d(-3%,0,0);opacity:.55}50%{opacity:1}100%{transform:translate3d(3%,-2%,0);opacity:.7}}
.si-mo{position:absolute;bottom:14%;width:3px;height:3px;margin-left:-1.5px;border-radius:50%;background:#ffe9b0;box-shadow:0 0 5px 1px rgba(255,226,150,.5);opacity:0;pointer-events:none;will-change:transform,opacity;animation:si-mo var(--t) linear var(--d) infinite}
@keyframes si-mo{0%{opacity:0;transform:translate3d(0,0,0)}18%{opacity:.8}100%{opacity:0;transform:translate3d(0,-150px,0)}}
@media (prefers-reduced-motion:reduce){.si-niebla,.si-mo{animation:none}}
html[data-mov="no"] .si-niebla,html[data-mov="no"] .si-mo{animation:none}
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
/* Dracmas uniformes en Ser interior, Árbol, Atributos y Tienda; botones según si alcanzan (.dr-ok) o faltan (.dr-falta) */
:root{--dr-oro:#f2c45a;--dr-falta:#e27852}
:root[data-theme="light"]{--dr-oro:#a16f14;--dr-falta:#b84b2a}
.ap-saldo{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:999px;border:1px solid color-mix(in srgb,var(--dr-oro) 48%,transparent);background:linear-gradient(180deg,color-mix(in srgb,var(--dr-oro) 18%,transparent),color-mix(in srgb,var(--dr-oro) 6%,transparent));box-shadow:inset 0 1px 0 rgba(255,244,208,.2);font:500 .78rem/1 var(--f-ui);color:var(--tinta-2);white-space:nowrap}
.ap-saldo b{font:600 1.02rem/1 var(--f-ui);color:var(--dr-oro);font-variant-numeric:tabular-nums}
.ap-saldo svg{width:16px;height:16px;color:var(--dr-oro)}
.ap-cab-r{display:inline-flex;align-items:center;justify-self:end;align-self:center;gap:8px;flex-wrap:wrap;justify-content:flex-end}
.ap-cifras li.ap-cif-dr b{color:var(--dr-oro)}
.jg .btn.dr-ok{border-color:color-mix(in srgb,var(--dr-oro) 66%,transparent);background:linear-gradient(180deg,color-mix(in srgb,var(--dr-oro) 28%,var(--hoja)),color-mix(in srgb,var(--dr-oro) 13%,var(--hoja)));color:var(--dr-oro);box-shadow:inset 0 1px 0 rgba(255,246,214,.2),0 6px 16px -10px color-mix(in srgb,var(--dr-oro) 60%,transparent)}
.jg .btn.dr-ok:hover,.jg .btn.dr-ok:focus-visible{border-color:var(--dr-oro);background:linear-gradient(180deg,color-mix(in srgb,var(--dr-oro) 36%,var(--hoja)),color-mix(in srgb,var(--dr-oro) 18%,var(--hoja)))}
.jg .btn.dr-falta{border-color:color-mix(in srgb,var(--dr-falta) 44%,var(--linea-2));background:linear-gradient(180deg,color-mix(in srgb,var(--dr-falta) 11%,var(--hoja)),color-mix(in srgb,var(--dr-falta) 4%,var(--hoja)));color:color-mix(in srgb,var(--dr-falta) 88%,var(--tinta))}
.jg .btn.dr-falta:hover,.jg .btn.dr-falta:focus-visible{border-color:color-mix(in srgb,var(--dr-falta) 68%,transparent)}
/* Barra de nivel única del Árbol: conserva exactamente 8 px compactos con engaste botánico en bronce y savia dorada (0 % CPU) */
.jg-barra.ap-nivel-bar{position:relative;height:8px;border-radius:99px;border:1px solid color-mix(in srgb,var(--oro) 34%,var(--linea-2));background:repeating-linear-gradient(90deg,transparent 0 24%,rgba(255,234,174,.14) 24% calc(24% + 1px),transparent calc(24% + 1px) 25%),linear-gradient(180deg,color-mix(in srgb,#000 58%,var(--hoja)),color-mix(in srgb,#000 28%,var(--hoja-2)));box-shadow:inset 0 1.5px 3px rgba(0,0,0,.68),0 1px 0 rgba(255,244,212,.1);overflow:visible}
.jg-barra.ap-nivel-bar>i{position:relative;display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,#6e5a28 0%,#b88a34 38%,var(--oro-vivo) 82%,#fff3c8 100%);box-shadow:0 0 10px -1px color-mix(in srgb,var(--oro-vivo) 58%,transparent),inset 0 1px 0 rgba(255,252,235,.55)}
.jg-barra.ap-nivel-bar>i::after{content:"";position:absolute;right:-3px;top:50%;width:9px;height:9px;margin-top:-4.5px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#fffbe8 0 38%,var(--oro-vivo) 72%,transparent 100%);box-shadow:0 0 8px 1px color-mix(in srgb,var(--oro-vivo) 80%,transparent);pointer-events:none}
:root[data-theme="light"] .jg-barra.ap-nivel-bar{background:repeating-linear-gradient(90deg,transparent 0 24%,rgba(120,86,24,.14) 24% calc(24% + 1px),transparent calc(24% + 1px) 25%),linear-gradient(180deg,#d3c5ad,#e5dac5);box-shadow:inset 0 1px 2px rgba(45,32,12,.26)}
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
@media (max-width:480px){.ap-arm{grid-template-columns:1fr;gap:14px}.ap-fig{max-width:200px;margin:0 auto}}
@media (prefers-reduced-motion:reduce){.ap-vida{display:none}}
html[data-mov="no"] .ap-vida{display:none}
.jg-ciu{display:grid;place-items:center;width:34px;height:34px;border-radius:50%;color:var(--oro);background:color-mix(in srgb,var(--oro) 10%,transparent);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--oro) 30%,transparent)}
.jg-ciu svg{width:18px;height:18px}
.jg-fila .n{min-width:0}
.jg-nivel{flex-wrap:wrap}
.jg-yo .jg-nombre{overflow-wrap:anywhere}
.jg-form{display:grid;grid-template-columns:minmax(0,1fr) 9.2em;gap:8px;align-items:stretch}
.jg-lugar .lg-actual{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:10px;align-items:center;margin:2px 0 6px}
.jg-lugar .lg-n{display:grid;min-width:0}.jg-lugar .lg-n b{font-weight:600;overflow-wrap:anywhere}.jg-lugar .lg-n small{color:var(--tenue);font-size:.84em;overflow-wrap:anywhere}
.jg-lugar .lg-hora{font-variant-numeric:tabular-nums;color:var(--oro);font-weight:600;font-size:.92em;white-space:nowrap}
.jg-lugar .lg-panel{display:grid;gap:8px;margin-top:10px}
.jg-lugar .lg-q,.jg-lugar .lg-otra input,.jg-lugar .lg-otra select{width:100%;box-sizing:border-box;font:inherit;padding:.62em .8em;border-radius:12px;border:1px solid var(--linea);background:var(--hoja-2);color:var(--tinta)}
.jg-lugar .lg-q:focus,.jg-lugar .lg-otra input:focus,.jg-lugar .lg-otra select:focus{outline:2px solid var(--oro);outline-offset:1px}
.jg-lugar .lg-res{list-style:none;margin:0;padding:0;display:grid;gap:6px}
.jg-lugar .lg-op{all:unset;box-sizing:border-box;cursor:pointer;width:100%;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;padding:.58em .8em;border-radius:12px;background:color-mix(in srgb,var(--oro) 6%,transparent);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--oro) 18%,transparent);transition:background .18s ease}
.jg-lugar .lg-op:hover,.jg-lugar .lg-op:focus-visible{background:color-mix(in srgb,var(--oro) 14%,transparent)}
.jg-lugar .lg-z{font-variant-numeric:tabular-nums;font-size:.84em;color:var(--tenue);white-space:nowrap}
.jg-lugar .lg-link{all:unset;cursor:pointer;justify-self:start;color:var(--oro);font-size:.9em;text-decoration:underline dotted;text-underline-offset:3px}
.jg-lugar .lg-otra{display:grid;gap:8px}
.jg-lugar .lg-otra .mm-btn{width:100%;box-sizing:border-box;min-height:2.9em;font:400 1rem/1.3 var(--f-ui);padding:.62em .9em;border-radius:12px;border:1px solid var(--linea);background:var(--hoja-2);color:var(--tinta)}
@media (min-width:700px){.jg-lugar .jg-acciones .btn{flex:0 1 auto;min-width:15rem}.jg-lugar .lg-panel{max-width:40rem}}
@media (max-width:360px){.jg-lugar .lg-actual{grid-template-columns:auto minmax(0,1fr)}.jg-lugar .lg-hora{grid-column:2}.jg-lugar .lg-op{grid-template-columns:1fr}}
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
.jg-coleccion{display:grid;gap:10px;margin:12px 0;padding:13px 14px;border-radius:14px;border:1px solid color-mix(in srgb,var(--oro) 45%,transparent);background:linear-gradient(125deg,color-mix(in srgb,var(--oro) 12%,transparent),transparent 70%)}
.jg-col-cab{display:flex;align-items:center;gap:11px;min-width:0}
.jg-col-cab>div{display:grid;gap:2px;min-width:0}
.jg-col-cab b{font:600 .92rem/1.2 var(--f-ui);color:var(--oro-vivo)}
.jg-col-cab small{font:400 .74rem/1.3 var(--f-ui);color:var(--tinta-2)}
.jg-coleccion p{margin:0;font:400 .86rem/1.48 var(--f-ui);color:var(--tinta)}
.jg-coleccion b{color:var(--oro-vivo)}
.jg-col-ico{display:grid;place-items:center;flex:none;width:36px;height:36px;border-radius:10px;color:var(--oro-vivo);background:color-mix(in srgb,var(--oro) 14%,transparent);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--oro) 28%,transparent)}
.jg-col-ico svg{width:20px;height:20px}
.jg-coleccion.plegable{display:block;padding:0;margin:4px 0 0}
.jg-coleccion.plegable summary{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:12px;align-items:center;padding:10px 14px;cursor:pointer;list-style:none}
.jg-coleccion.plegable summary::-webkit-details-marker{display:none}
.jg-coleccion.plegable summary>span:nth-child(2){display:grid;gap:2px}
.jg-coleccion.plegable summary b{font:600 .9rem/1.2 var(--f-ui);color:var(--oro-vivo)}
.jg-coleccion.plegable summary small{font:400 .76rem/1.3 var(--f-ui);color:var(--tinta-2)}
.jg-col-v{width:9px;height:9px;border-right:1.6px solid var(--oro-vivo);border-bottom:1.6px solid var(--oro-vivo);transform:rotate(45deg) translate(-2px,-2px);transition:transform .25s}
.jg-coleccion.plegable[open] .jg-col-v{transform:rotate(-135deg) translate(-2px,-2px)}
.jg-coleccion.plegable p{padding:0 14px 12px;font-size:.84rem}
/* AF19: barra hacia la próxima Designación */
.jg-col-c{display:grid;gap:8px;min-width:0}
.jg-coleccion.plegable .jg-col-c{padding:0 14px 12px}
.jg-coleccion.plegable .jg-col-c p{padding:0}
.jg-dg{display:grid;gap:6px;padding:10px 12px;border-radius:12px;background:color-mix(in srgb,var(--oro) 7%,transparent);border:1px solid color-mix(in srgb,var(--oro) 22%,transparent)}
.jg-dg-f{display:flex;align-items:baseline;justify-content:space-between;gap:10px}
.jg-dg-t{font:600 .7rem/1.2 var(--f-ui);letter-spacing:.16em;text-transform:uppercase;color:var(--oro)}
.jg-dg-f b{font:500 1rem/1 var(--f-display);color:var(--oro-vivo);font-variant-numeric:lining-nums tabular-nums;white-space:nowrap}
.jg-dg .jg-barra{height:6px}
.jg-dg p{margin:0}
.jg-dg-yo{color:var(--tinta)}
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
.jg-chispas[popover]{width:auto;height:auto;margin:0;padding:0;border:0;background:none;overflow:visible;color:inherit}
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
.jg-form input,.jg-in{flex:1 1 180px;min-width:0;font:400 1rem/1.3 var(--f-ui);padding:12px 14px;border-radius:12px;border:1px solid var(--linea);background:var(--hoja-2);color:var(--tinta)}
.jg-in{display:block;width:100%;box-sizing:border-box}
.jg-form input:focus,.jg-in:focus{outline:2px solid var(--oro);outline-offset:1px}
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
.jg-lista{list-style:none;margin:0;padding:0;display:grid;gap:5px}
.jg-fila{display:grid;grid-template-columns:1.85em 34px minmax(0,1fr) auto;gap:10px;align-items:center;padding:8px 10px;border-radius:12px}
.jg-fila:nth-child(odd){background:color-mix(in srgb,var(--hoja-2) 86%,transparent)}
.jg-fila.yo{outline:1.5px solid var(--oro);background:var(--oro-suave)}
.jg-fila .p{display:grid;place-items:center;min-width:1.7em;height:1.7em;border-radius:999px;font:600 .9rem/1 var(--f-display);color:var(--oro);text-align:center}
.jg-fila.p1 .p{background:color-mix(in srgb,#f5c64e 22%,transparent);color:#ffe7a6;box-shadow:inset 0 0 0 1px color-mix(in srgb,#f5c64e 52%,transparent)}
.jg-fila.p2 .p{background:color-mix(in srgb,#c5cedb 18%,transparent);color:#e6ecf5;box-shadow:inset 0 0 0 1px color-mix(in srgb,#c5cedb 42%,transparent)}
.jg-fila.p3 .p{background:color-mix(in srgb,#cc8c54 18%,transparent);color:#f3cda8;box-shadow:inset 0 0 0 1px color-mix(in srgb,#cc8c54 44%,transparent)}
:root[data-theme=light] .jg-fila.p1 .p{color:#7a530e}:root[data-theme=light] .jg-fila.p2 .p{color:#445060}:root[data-theme=light] .jg-fila.p3 .p{color:#7a4a1e}
.jg-fila svg{width:34px;height:34px;display:block}
.jg-fila .jg-ciu svg{width:18px;height:18px}
.jg-fila .n{display:grid;gap:1px;min-width:0;font:400 .92rem/1.25 var(--f-ui);color:var(--tinta)}
.jg-fila .n b{font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.jg-fila .n small{display:block;font-size:.72rem;line-height:1.25;color:var(--tenue);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.jg-fila .x{display:grid;justify-items:end;gap:1px;font:600 .92rem/1 var(--f-ui);font-variant-numeric:tabular-nums;color:var(--oro-vivo);white-space:nowrap;text-align:right}
.jg-fila .x small{font:500 .58rem/1 var(--f-ui);letter-spacing:.08em;text-transform:uppercase;color:var(--tenue)}
.jg-vivo{display:flex;flex-wrap:wrap;gap:6px 16px;font:400 .82rem/1.4 var(--f-ui);color:var(--tenue)}
.jg-vivo b{color:var(--oro-vivo);font-weight:500}
.jg-vivo i{display:inline-block;width:7px;height:7px;border-radius:50%;background:#7bc98f;margin-right:6px;vertical-align:1px}
.jg-act{display:none}
.jg-act.on{position:relative;display:flex;align-items:center;gap:7px;margin-top:3px;font:500 .74rem/1.3 var(--f-ui);letter-spacing:.02em;color:var(--tenue)}
.jg-act.on::before{content:"";flex:none;width:7px;height:7px;border-radius:50%;background:var(--tenue)}
.jg-act.ya{color:var(--oro-vivo)}
.jg-act.ya::before{background:#7bc98f}
.jg-act.ya::after{content:"";position:absolute;left:0;top:50%;width:7px;height:7px;margin-top:-3.5px;box-sizing:border-box;border-radius:50%;border:1.5px solid #7bc98f;will-change:transform,opacity;animation:jg-act 2s ease-out infinite}
html[data-dal] .jg-act.ya::before{background:#5aa9e6}
html[data-dal] .jg-act.ya::after{border-color:#5aa9e6}
@keyframes jg-act{0%{transform:scale(1);opacity:.85}100%{transform:scale(2.8);opacity:0}}
html[data-mov="no"] .jg-act.ya::after{animation:none;opacity:0}
.jg-arbol .jg-nodo.activo .pt{stroke:#7bc98f;stroke-width:5}
html[data-dal] .jg-arbol .jg-nodo.activo .pt{stroke:#5aa9e6}
.jg-act-t:empty{display:none}
.jg-novedades{list-style:none;margin:0;padding:0;display:grid;gap:12px;font:400 .88rem/1.45 var(--f-ui);color:var(--tinta-2)}
.jg-novedades li{position:relative;display:grid;gap:3px;padding-left:16px}
.jg-novedades li::before{content:"";position:absolute;left:1px;top:.42em;width:6px;height:6px;border-radius:50%;background:radial-gradient(circle at 35% 35%,var(--oro-vivo),var(--oro) 70%);box-shadow:0 0 8px color-mix(in srgb,var(--oro) 55%,transparent)}
.jg-novedades li:has(.jg-nov-t)::before{top:.3em}
.jg-nov-t{font:500 .7rem/1.25 var(--f-ui);letter-spacing:.07em;color:var(--oro);font-variant-numeric:lining-nums tabular-nums}
.jg-nov-x{min-width:0;overflow-wrap:anywhere}
.jg-novedades li.comp{padding:9px 11px 9px 22px;border-radius:12px;border:1px solid color-mix(in srgb,var(--oro) 34%,var(--linea-2));background:linear-gradient(110deg,color-mix(in srgb,var(--oro) 11%,transparent),color-mix(in srgb,var(--hoja-2) 72%,transparent))}
.jg-novedades li.comp::before{left:9px;top:.85em;background:radial-gradient(circle at 35% 35%,#ffd49e,#e08b36 70%);box-shadow:0 0 9px rgba(235,148,58,.75)}
.jg-novedades li.subio::before{background:radial-gradient(circle at 35% 35%,#d9ffe4,#5ec284 70%);box-shadow:0 0 9px rgba(94,194,132,.7)}
.jg-nov-acc{display:inline-flex;align-items:center;gap:4px;margin-top:3px;justify-self:start;font:600 .72rem/1.2 var(--f-ui);color:var(--oro-vivo);text-decoration:none;letter-spacing:.03em}
.jg-nov-acc:hover{text-decoration:underline}
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
.jg-vc-cab{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}
.jg-vc-sel{display:inline-flex;gap:2px;padding:2px;border-radius:999px;border:1px solid color-mix(in srgb,var(--oro) 30%,transparent)}
.jg-vc-b{font:500 .62rem/1 var(--f-ui);letter-spacing:.08em;text-transform:uppercase;padding:5px 9px;border-radius:999px;border:0;background:none;color:var(--tenue);cursor:pointer}
.jg-vc-b[aria-pressed="true"]{background:color-mix(in srgb,var(--oro) 22%,transparent);color:var(--oro-vivo,var(--oro))}
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
button.jg-pel{appearance:none;-webkit-appearance:none;background:none;border:0;padding:3px 0 7px;margin:0;font:inherit;color:inherit;cursor:pointer;position:relative;border-radius:8px;transition:opacity .25s ease;-webkit-tap-highlight-color:transparent}
button.jg-pel:hover{opacity:.9}
button.jg-pel.act{transform:none}
button.jg-pel.act svg{transform:scale(1.18)}
button.jg-pel::after{content:"";position:absolute;left:28%;right:28%;bottom:1px;height:2px;border-radius:2px;background:var(--oro-vivo);opacity:0;transform:scaleX(.4);transition:opacity .25s ease,transform .25s ease}
button.jg-pel.ver{opacity:1}
button.jg-pel.ver::after{opacity:.9;transform:none}
button.jg-pel:focus-visible{outline:2px solid var(--oro-vivo);outline-offset:2px}
.jg-esc-nota{text-align:center;margin-top:8px}
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
.jg-sala-p{position:sticky;bottom:calc(16px + env(safe-area-inset-bottom,0px));z-index:70;display:flex;align-items:center;gap:8px;width:max-content;max-width:calc(100vw - 120px);height:34px;box-sizing:border-box;margin:-34px auto 0;padding:0 14px;border-radius:999px;border:1px solid color-mix(in srgb,var(--oro) 45%,transparent);background:color-mix(in srgb,var(--hoja) 72%,transparent);-webkit-backdrop-filter:blur(14px) saturate(1.3);backdrop-filter:blur(14px) saturate(1.3);color:var(--tinta);font:500 .8rem/1 var(--f-ui);cursor:pointer;box-shadow:var(--vidrio-sombra,0 8px 30px rgba(0,0,0,.3));white-space:nowrap}
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
.jg-dos{display:grid;grid-template-columns:minmax(0,1fr);gap:18px;align-items:start}
@media (min-width:720px){.jg-piedras{grid-template-columns:repeat(12,minmax(0,1fr))}.jg-dos{grid-template-columns:1fr 1fr}}
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
/* «Por generación» compacta (BiEx, 13-nov-2026): filas finas separadas por un filo, sin cajas; las primeras 6 y el resto al tocar */
.jg-arbol-lista{list-style:none;margin:0;padding:0;display:grid;gap:0;font:400 .84rem/1.3 var(--f-ui)}
.jg-arbol-lista li{display:flex;gap:10px;align-items:center;justify-content:space-between;padding:7px 2px 7px 12px;min-width:0;position:relative;border-top:1px solid var(--linea-2)}
.jg-arbol-lista li:first-child{border-top:0}
.jg-arbol-lista li::before{content:"";position:absolute;left:0;top:50%;width:5px;height:5px;margin-top:-2.5px;border-radius:50%;border:1px solid var(--tenue)}
.jg-arbol-lista li.ok::before{background:var(--oro);border-color:var(--oro)}
.jg-arbol-lista li>span:first-child{min-width:0;overflow-wrap:anywhere}
.jg-arbol-lista li b{font-weight:500;color:var(--tinta)}
.jg-arbol-lista li small{font:400 .72rem var(--f-ui);color:var(--tenue)}
.jg-arbol-lista li small.jg-gen-dat{display:block;margin-top:2px;font-size:.7rem;letter-spacing:.01em;color:color-mix(in srgb,var(--oro) 55%,var(--tenue))}
.jg-arbol-lista li>.jg-mini{flex:none;font-size:.72rem;white-space:nowrap}
.jg-arbol-lista.plegada li:nth-child(n+7){display:none}
.jg-arbol-mas{margin-top:6px}
.jg-qz .jg-ops>.jg-op:last-child:nth-child(odd){grid-column:1/-1}
.ap-uso-t{margin:16px 0 6px;font:500 .7rem/1 var(--f-ui);letter-spacing:.14em;text-transform:uppercase;color:var(--tenue)}
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
.jg-yo>.jg-esq{position:absolute;width:30px;height:30px;pointer-events:none;opacity:.7;z-index:1}
.jg-yo>.jg-esq svg{display:block;width:100%;height:100%}
.jg-yo>.jg-esq.e1{left:3px;top:3px}.jg-yo>.jg-esq.e2{right:3px;top:3px;transform:scaleX(-1)}
.jg-yo{border-color:color-mix(in srgb,var(--et,var(--oro)) 55%,transparent)}
.jg-etapa{margin-top:3px;font:600 .7rem/1.2 var(--f-ui);letter-spacing:.12em;text-transform:uppercase;color:var(--et,var(--oro-vivo))}
.jg-yo.etapa-2 .jg-emb::before,.jg-yo.etapa-3 .jg-emb::before,.jg-yo.etapa-4 .jg-emb::before,.jg-yo.etapa-5 .jg-emb::before{content:"";position:absolute;inset:-26%;border-radius:50%;z-index:-1;pointer-events:none;background:radial-gradient(closest-side,color-mix(in srgb,var(--et) 45%,transparent),transparent);will-change:opacity;animation:jg-aura-et 5.3s ease-in-out infinite alternate}
.jg-yo.etapa-4 .jg-emb::before,.jg-yo.etapa-5 .jg-emb::before{animation-duration:4.1s}
@keyframes jg-aura-et{0%{opacity:.45}100%{opacity:1}}
.jg-yo .jg-emb{position:relative;isolation:isolate}
.jg-yo>.jg-mota{position:absolute;bottom:10%;width:3px;height:3px;border-radius:50%;background:var(--et);box-shadow:0 0 6px 1px color-mix(in srgb,var(--et) 70%,transparent);opacity:0;pointer-events:none;will-change:transform,opacity;animation:si-mo var(--t) linear var(--d) infinite}
.jg-yo.etapa-5{box-shadow:0 0 0 1px color-mix(in srgb,#ff7d93 30%,transparent),0 18px 40px -22px rgba(255,90,120,.55)}
.jg-epica>.jg-hoy{position:absolute;top:1px;bottom:1px;z-index:2;border-radius:99px;pointer-events:none;background:linear-gradient(90deg,rgba(255,250,235,.04),rgba(255,250,235,.34) 82%,rgba(255,255,248,.62));box-shadow:inset -1px 0 0 rgba(255,253,242,.75)}
.jg-hoy-t{color:var(--oro-vivo);font-weight:600}
@media (prefers-reduced-motion:reduce){.jg-yo .jg-emb::before,.jg-yo>.jg-mota{animation:none}}
html[data-mov="no"] .jg-yo .jg-emb::before,html[data-mov="no"] .jg-yo>.jg-mota{animation:none}
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
/* Barra de nivel horológica en Hoy (Neon, 22-nov-2026): bisel de oro cepillado, canal hondo de obsidiana, graduaciones grabadas al filo, reflejo de cristal de zafiro y prisma facetado en la punta (compositor puro) */
.jg-epica-bl{display:grid;gap:6px}
.jg-epica-cab{display:flex;align-items:baseline;justify-content:space-between;gap:8px;padding:0 2px}
.jg-epica-rumbo{font:600 .66rem/1 var(--f-ui);letter-spacing:.15em;text-transform:uppercase;color:var(--oro)}
.jg-epica-pct{font:600 .92rem/1 var(--f-display);letter-spacing:.03em;color:var(--oro-vivo);font-variant-numeric:lining-nums tabular-nums}
.jg-epica-marco{position:relative;padding:3px;border-radius:99px;border:1px solid transparent;
  background:linear-gradient(180deg,#120f0b,#090806) padding-box,linear-gradient(180deg,color-mix(in srgb,var(--et,#ffe39a) 78%,#fff6d6),color-mix(in srgb,var(--oro) 58%,#5a3d10) 48%,color-mix(in srgb,var(--oro-2) 60%,#2c1d07)) border-box;
  box-shadow:inset 0 1px 0 rgba(255,248,220,.2),inset 0 -1px 0 rgba(0,0,0,.7),0 8px 20px -12px rgba(0,0,0,.9),0 0 18px -10px color-mix(in srgb,var(--et,var(--oro)) 70%,transparent)}
.jg-yo .jg-barra.jg-epica{position:relative;height:14px;border-radius:99px;background:linear-gradient(180deg,#070605,#14110c 58%,#0d0b08);box-shadow:inset 0 2px 5px rgba(0,0,0,.88),inset 0 -1px 0 rgba(255,236,178,.14);overflow:hidden;isolation:isolate}
.jg-yo .jg-barra.jg-epica>i.jg-relleno{position:absolute;inset:0;display:block;border-radius:inherit;overflow:hidden;
  background:linear-gradient(180deg,rgba(255,253,242,.46) 0,rgba(255,246,214,.08) 44%,rgba(0,0,0,.18) 54%,rgba(0,0,0,.28) 100%),
    linear-gradient(90deg,#4a2c07,#8c5c17 24%,#c99634 56%,#f0cb72 86%,#fff4cc);
  box-shadow:inset 0 0 0 1px rgba(255,245,210,.22);transform:translate3d(calc(var(--p) * 1% - 100%),0,0);will-change:transform}
.jg-yo .jg-barra.jg-epica>i.jg-relleno::before{content:"";position:absolute;left:0;right:0;top:50%;height:1.5px;margin-top:-.75px;background:linear-gradient(90deg,transparent,rgba(255,250,224,.32) 32%,rgba(255,252,236,.78) 92%,#fff)}
.jg-yo .jg-barra.jg-epica>i.jg-relleno::after{content:"";position:absolute;top:0;bottom:0;left:0;width:30%;background:linear-gradient(104deg,transparent 10%,rgba(255,252,238,.52) 50%,transparent 90%);transform:translate3d(-120%,0,0);animation:jg-luz 4.4s cubic-bezier(.4,0,.2,1) 1.2s infinite;will-change:transform}
.jg-epica-vidrio{position:absolute;left:2px;right:2px;top:1px;height:42%;z-index:3;border-radius:99px 99px 40% 40%;pointer-events:none;background:linear-gradient(180deg,rgba(255,255,255,.26),rgba(255,255,255,0))}
.jg-epica .jg-marcas{position:absolute;left:0;right:0;top:0;bottom:0;z-index:3;pointer-events:none;
  background:repeating-linear-gradient(90deg,transparent 0 calc(10% - 1px),rgba(240,214,148,.34) calc(10% - 1px) 10%) top/100% 3px no-repeat,
    repeating-linear-gradient(90deg,transparent 0 calc(10% - 1px),rgba(240,214,148,.24) calc(10% - 1px) 10%) bottom/100% 3px no-repeat}
.jg-epica .jg-borde{position:absolute;inset:0;z-index:4;pointer-events:none;transform:translate3d(calc(var(--p) * 1% - 100%),0,0);will-change:transform}
.jg-epica .jg-brasa{position:absolute;right:-5px;top:50%;width:10px;height:10px;margin-top:-5px;border-radius:2px;transform:rotate(45deg);
  background:linear-gradient(135deg,#fffef8 0,#ffe59e 46%,#c9922c 100%);border:1px solid rgba(255,255,245,.88);box-shadow:0 0 10px 2px rgba(255,226,140,.85)}
.jg-epica .jg-brasa::after{content:"";position:absolute;inset:-6px;border-radius:50%;background:radial-gradient(closest-side,rgba(255,242,196,.85),rgba(245,198,78,0));animation:jg-brasa 2.2s ease-in-out infinite;will-change:opacity}
.jg-epica.crece{box-shadow:inset 0 2px 5px rgba(0,0,0,.85),0 0 18px -2px color-mix(in srgb,var(--oro-vivo) 75%,transparent)}
.jg-epica.cerca .jg-brasa::after{animation-duration:1.1s}
:root[data-theme="light"] .jg-epica-marco{background:linear-gradient(180deg,#e9dfcd,#dfd2ba) padding-box,linear-gradient(180deg,#fff7df,#b88c38 48%,#6d4d15) border-box;box-shadow:inset 0 1px 0 rgba(255,255,255,.7),0 6px 14px -10px rgba(45,32,12,.35)}
:root[data-theme="light"] .jg-yo .jg-barra.jg-epica{background:linear-gradient(180deg,#cfc2ab,#dfd5c2 55%,#d5c8b2);box-shadow:inset 0 2px 4px rgba(45,32,12,.28)}
@keyframes jg-brasa{0%,100%{opacity:.4}50%{opacity:1}}
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
/* (15-nov-2026) dracmas al final de la línea de la forja; celebración de la forja con el ser interior */
.ap-tienes{white-space:nowrap}
.ap-forja .ap-tienes b{font:inherit;font-weight:600;color:var(--dr-oro);letter-spacing:0}
.ap-forja .ap-tienes.falta b{color:var(--dr-falta)}
.jg-fj-fig{width:min(210px,56vw);margin:4px auto 0}
.jg-fj-fig .ser-in{max-width:none}
.jg-fj-fig .fa-luz.on{animation:fa-luz 1.9s ease-in-out infinite}
.jg-fj-fig .fa-luz.forjada{animation:fa-forja 2.6s cubic-bezier(.2,.7,.2,1) both,fa-luz 2.2s ease-in-out 2.6s infinite}
/* (AF10, 21-nov-2026) la forja termina en .35, justo donde empieza el latido de la pieza: antes caía de .6 a .35 de golpe («un 20 % del efecto roto») */
@keyframes fa-forja{0%{opacity:0}12%{opacity:1}30%{opacity:.55}46%{opacity:1}100%{opacity:.35}}
.jg-fj-fig.anim .ser-in{animation:fj-entra .9s cubic-bezier(.2,.75,.2,1) both}
@keyframes fj-entra{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
.jg-fj-at{display:flex;justify-content:center;gap:12px;margin:0}
.jg-fj-c{display:grid;justify-items:center;gap:2px;min-width:7.5rem;padding:8px 14px;border-radius:14px;border:1px solid color-mix(in srgb,var(--ac,var(--oro)) 38%,var(--linea-2));background:color-mix(in srgb,var(--ac,var(--oro)) 9%,transparent)}
.jg-fj-c small{font:600 .68rem/1 var(--f-ui);letter-spacing:.12em;text-transform:uppercase;color:var(--tinta-2)}
.jg-fj-c b{font:500 1.7rem/1.05 var(--f-display);color:var(--ac,var(--oro-vivo));font-variant-numeric:lining-nums tabular-nums}
.jg-fj-t{margin:0;max-width:34ch;color:var(--tinta-2);font:400 .92rem/1.45 var(--f-ui)}
.jg-fj-v{display:grid;justify-items:center;gap:6px;max-width:40ch}
.jg-fj-v p{margin:0;font:400 1.02rem/1.5 var(--f-texto,inherit);color:var(--tinta)}
@media (prefers-reduced-motion:reduce){.jg-fj-fig .fa-luz.forjada{animation:none;opacity:.85}.jg-fj-fig.anim .ser-in{animation:none}}
html[data-mov="no"] .jg-fj-fig .fa-luz.forjada{animation:none;opacity:.85}html[data-mov="no"] .jg-fj-fig.anim .ser-in{animation:none}
.ap-cita{display:inline-flex;align-items:center;gap:7px;padding:2px 10px 2px 7px;border-radius:99px;border:1px solid color-mix(in srgb,var(--oro) 45%,transparent);background:color-mix(in srgb,var(--oro) 9%,transparent);color:var(--oro-vivo);font:inherit;cursor:pointer}
.ap-cita:hover,.ap-cita:focus-visible{border-color:var(--oro);outline:none}
.ap-lumbre{position:relative;flex:none;width:7px;height:7px;border-radius:50%;background:radial-gradient(circle,#fff6d6 0 30%,#f5c64e 62%,rgba(245,198,78,.2) 100%)}
.ap-lumbre::after{content:"";position:absolute;inset:-6px;border-radius:50%;background:radial-gradient(circle,rgba(245,198,78,.55),rgba(245,198,78,0) 70%);animation:jg-brasa 2.4s ease-in-out infinite}
.jg-cita-v p{margin:0 0 .6em;line-height:1.6}.jg-cita-v sup{color:var(--oro);font-size:.7em;margin-right:2px}
.jg-yo .jg-barra:not(.jg-epica)>i{position:relative;overflow:hidden}
.jg-yo .jg-barra:not(.jg-epica)>i::after{content:"";position:absolute;top:0;bottom:0;left:0;width:36%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.5),transparent);transform:translate3d(-110%,0,0);animation:jg-luz 3.2s ease-in-out 1.4s infinite}
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
.jg-muelle{position:fixed;z-index:62;left:50%;bottom:calc(10px + env(safe-area-inset-bottom,0px));transform:translate3d(-50%,0,0);width:min(calc(100vw - 20px),440px);box-sizing:border-box;display:grid;grid-template-columns:repeat(6,minmax(0,1fr));padding:6px;border-radius:22px;border:1px solid color-mix(in srgb,var(--oro) 42%,transparent);background:linear-gradient(180deg,color-mix(in srgb,var(--hoja-2) 94%,transparent),color-mix(in srgb,var(--hoja) 98%,transparent));box-shadow:inset 0 1px 0 color-mix(in srgb,#fff 12%,transparent),0 14px 30px -14px rgba(0,0,0,.88);transition:opacity .25s;animation:jg-sube-muelle .45s cubic-bezier(.2,.8,.2,1) both}
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
/* AL6 (22-nov-2026): la píldora de la Sala ya no pide espacio extra al final: se acomoda en su hueco del pie */
html.jg-con-muelle .jg-sala-p{bottom:calc(88px + env(safe-area-inset-bottom,0px));padding:0 12px;font-size:.84rem}
html.jg-con-muelle.jg-con-sala .aviso-flot{bottom:calc(140px + env(safe-area-inset-bottom,0px))}
html.jg-con-sala:not(.jg-con-muelle) .aviso-flot{bottom:calc(84px + env(safe-area-inset-bottom,0px))}
html.jg-con-lb:not(.jg-con-muelle) .aviso-flot{bottom:calc(88px + env(safe-area-inset-bottom,0px))}
html.jg-con-lb.jg-con-sala:not(.jg-con-muelle) .aviso-flot{bottom:calc(136px + env(safe-area-inset-bottom,0px))}
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
@media (prefers-reduced-motion:reduce){.ap-fig .fa-luz.on{animation:none;opacity:.85}.jg-epica .jg-brasa,.jg-epica .jg-brasa::after,.ap-lumbre::after{animation:none}.jg-escena *,.jg-escena *::after,.jg-yo .jg-emb::after,.jg-yo .jg-barra>i::after,.jg-llave::before,.jg-llave .jg-codigo span,.jg-muelle,.jg-tiembla{animation:none!important}.g-versos i::after{transform:none}.g-mis b::after,.g-dias i::after{transform:scale(1)}.g-xp{opacity:1}}
html[data-mov="no"] .ap-fig .fa-luz.on{animation:none;opacity:.85}html[data-mov="no"] .jg-epica .jg-brasa,html[data-mov="no"] .jg-epica .jg-brasa::after,html[data-mov="no"] .ap-lumbre::after{animation:none}html[data-mov="no"] .jg-escena *,html[data-mov="no"] .jg-escena *::after,html[data-mov="no"] .jg-yo .jg-emb::after,html[data-mov="no"] .jg-yo .jg-barra>i::after,html[data-mov="no"] .jg-llave::before,html[data-mov="no"] .jg-llave .jg-codigo span,html[data-mov="no"] .jg-muelle,html[data-mov="no"] .jg-tiembla{animation:none!important}
/* N10 + Nitidez HD (Neon, 23-nov-2026): sombra aplicada solo al SVG (no al padre) para que NIVEL, cifra y bonos
   se dibujen nítidos a densidad real sin pasar por capa rasterizada de filtro; tipografía en px fijos inmune a --k */
.jg-med{position:fixed;z-index:61;left:calc(10px + env(safe-area-inset-left,0px));bottom:calc(12px + env(safe-area-inset-bottom,0px));width:50px;height:59px;display:block;text-decoration:none;-webkit-tap-highlight-color:transparent;--m1:#fbe7a6;--m2:#d1a640;--m3:#6f5016;--mg:rgba(209,166,64,.55)}
.jg-med[data-r="0"]{--m1:#f6d2ad;--m2:#bd844c;--m3:#5a381a;--mg:rgba(189,132,76,.5)}
.jg-med[data-r="1"]{--m1:#f5f7fb;--m2:#b6bfcc;--m3:#535b67;--mg:rgba(182,191,204,.5)}
.jg-med[data-r="3"]{--m1:#e6fbea;--m2:#56c48c;--m3:#1b5539;--mg:rgba(86,196,140,.5)}
.jg-med[data-r="4"]{--m1:#fff7d8;--m2:#f5c64e;--m3:#99560f;--mg:rgba(245,198,78,.72)}
.jg-med svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible;filter:drop-shadow(0 6px 9px rgba(0,0,0,.58));shape-rendering:geometricPrecision}
.jg-med .arco{transition:stroke-dasharray .6s cubic-bezier(.2,.8,.2,1)}
.jg-med .barrido{animation:jg-med-barrido 9s ease-in-out infinite}
@keyframes jg-med-barrido{0%,62%{transform:translate3d(0,0,0)}100%{transform:translate3d(96px,0,0)}}
.jg-med .nvk{position:absolute;left:0;right:0;top:20px;text-align:center;font:600 5.5px/1 "BiEx Interfaz","Jost",system-ui,sans-serif;letter-spacing:.7px!important;text-indent:.7px;color:var(--m2);pointer-events:none;white-space:nowrap;-webkit-font-smoothing:antialiased;text-rendering:geometricPrecision}
.jg-med b{position:absolute;left:0;right:0;top:27px;text-align:center;font:600 15px/1 "BiEx Titular","Cormorant Garamond",Georgia,serif;letter-spacing:0!important;font-variant-numeric:lining-nums tabular-nums;color:var(--m1);text-shadow:0 0 8px var(--mg),0 1px 0 rgba(0,0,0,.78);pointer-events:none;-webkit-font-smoothing:antialiased;text-rendering:geometricPrecision}
.jg-med.dos b{font-size:13.5px;top:28px}
.jg-med.tres b{font-size:11px;top:29px}
.jg-med i{position:absolute;left:50%;bottom:calc(100% + 2px);transform:translate3d(-50%,0,0);font:600 12px/1 "BiEx Interfaz","Jost",system-ui,sans-serif;font-style:normal;color:var(--m1);opacity:0;pointer-events:none;white-space:nowrap;text-shadow:0 0 8px var(--mg),0 1px 6px rgba(0,0,0,.95)}
.jg-med.pulso{animation:jg-med-p .55s cubic-bezier(.3,1.6,.5,1)}
@keyframes jg-med-p{0%{transform:scale(1)}40%{transform:scale(1.1)}100%{transform:scale(1)}}
.jg-med.pulso i{animation:jg-med-mas 1.4s ease-out both}
@keyframes jg-med-mas{0%{opacity:0;transform:translate3d(-50%,6px,0)}18%{opacity:1;transform:translate3d(-50%,-3px,0)}75%{opacity:1}100%{opacity:0;transform:translate3d(-50%,-16px,0)}}
.jg-med .rayos{position:absolute;left:50%;top:52%;width:120px;height:120px;margin:-60px 0 0 -60px;border-radius:50%;background:repeating-conic-gradient(from 0deg,var(--mg) 0 5deg,transparent 5deg 20deg);-webkit-mask:radial-gradient(circle,transparent 17%,#000 30%,transparent 70%);mask:radial-gradient(circle,transparent 17%,#000 30%,transparent 70%);opacity:0;pointer-events:none;transform:scale(.5)}
.jg-med.sube .rayos{animation:jg-med-rayos 2.6s ease-out both}
@keyframes jg-med-rayos{0%{opacity:0;transform:scale(.4) rotate(0deg)}18%{opacity:1}100%{opacity:0;transform:scale(1.4) rotate(48deg)}}
.jg-med .hito{position:absolute;left:calc(100% + 6px);top:50%;display:inline-flex;align-items:center;height:32px;padding:0 14px;border-radius:999px;background:linear-gradient(180deg,var(--m1),var(--m2));color:#16120b;font:600 14.5px/1 "BiEx Titular","Cormorant Garamond",Georgia,serif;letter-spacing:.05em;white-space:nowrap;opacity:0;pointer-events:none;transform:translate3d(-8px,-50%,0);box-shadow:0 0 0 4px color-mix(in srgb,var(--m2) 26%,transparent),0 10px 26px -10px rgba(0,0,0,.9)}
.jg-med.sube .hito{animation:jg-med-hito 4.2s cubic-bezier(.2,.8,.2,1) both}
@keyframes jg-med-hito{0%{opacity:0;transform:translate3d(-12px,-50%,0) scale(.9)}10%{opacity:1;transform:translate3d(0,-50%,0) scale(1)}86%{opacity:1;transform:translate3d(0,-50%,0)}100%{opacity:0;transform:translate3d(6px,-50%,0)}}
.jg-med:active{transform:scale(.94)}
.jg-bonos{position:absolute;left:50%;bottom:calc(100% + 5px);transform:translateX(-50%);display:flex;flex-direction:column-reverse;align-items:center;gap:3px;pointer-events:none;transition:opacity .2s}
.jg-bono{display:inline-flex;align-items:center;justify-content:center;height:18px;padding:0 7px;border-radius:999px;font:600 10px/1 "BiEx Interfaz","Jost",system-ui,sans-serif;letter-spacing:.02em!important;white-space:nowrap;color:var(--m1);background:linear-gradient(180deg,color-mix(in srgb,var(--m2) 34%,#0b0906),color-mix(in srgb,var(--m3) 40%,#070504));border:1px solid color-mix(in srgb,var(--m2) 55%,transparent);box-shadow:0 4px 10px -6px rgba(0,0,0,.9),inset 0 1px 0 rgba(255,255,255,.12)}
.jg-bono.b-dob{color:#fff3c4;border-color:rgba(245,198,78,.75);box-shadow:0 0 10px -2px rgba(245,198,78,.55),inset 0 1px 0 rgba(255,255,255,.18)}
.jg-bono.b-imp{color:#ffe1b0;border-color:rgba(255,170,80,.7)}
.jg-bono.b-sala{color:#d6f5e2;border-color:rgba(110,205,150,.7)}
.jg-med.sube .jg-bonos,.jg-med.pulso .jg-bonos{opacity:0}
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
html.jg-con-med .adelante{bottom:calc(122px + env(safe-area-inset-bottom,0px))}
html.jg-con-med.jg-con-lb .adelante{bottom:calc(134px + env(safe-area-inset-bottom,0px))}
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
/* (BiEx, 21-nov-2026, AF12) las dracmas y los fragmentos van sobre la experiencia, sin tocarla */
.jg-premio{bottom:calc(200px + var(--i) * 48px + env(safe-area-inset-bottom,0px))!important;background:linear-gradient(180deg,#2b2214,#17120b)!important;color:var(--oro-vivo)!important;border:1px solid color-mix(in srgb,var(--oro) 55%,transparent);opacity:0}
html.jg-con-muelle .jg-premio{bottom:calc(246px + var(--i) * 48px + env(safe-area-inset-bottom,0px))!important}
.jg-premio b{font-weight:700}.jg-premio.frag{color:#efe1bf!important}
/* AC12 (15-nov-2026): la figura del premio gira y brilla una vez; el rollo de papiros de Tesoro */
.jg-premio-fig{display:block;width:34px;height:34px;margin:0 auto 2px;filter:drop-shadow(0 0 8px rgba(255,214,140,.55));animation:jg-fig 1.1s cubic-bezier(.2,.9,.25,1.1) .25s both}
.jg-premio-fig svg{width:100%;height:100%;display:block}
@keyframes jg-fig{0%{transform:rotate(-24deg) scale(.4);opacity:0}60%{transform:rotate(8deg) scale(1.12);opacity:1}100%{transform:rotate(0) scale(1)}}
html[data-mov="no"] .jg-premio-fig{animation:none}
.jg-pp{width:100%;max-width:440px;margin:0 auto;aspect-ratio:2/1}
.jg-pp svg{width:100%;height:100%;display:block;filter:drop-shadow(0 8px 16px rgba(0,0,0,.35))}
.jg-pp-c{display:flex;align-items:baseline;justify-content:center;flex-wrap:wrap;gap:4px;margin:0}
.jg-pp-c b{font:500 1.6rem/1 var(--f-display);color:var(--oro-vivo);font-variant-numeric:lining-nums tabular-nums}
.jg-pp-c small{flex-basis:100%;text-align:center;font:400 .78rem/1.3 var(--f-ui);color:var(--tenue)}
/* Vitrina por escalón de rareza y coste (Neon, 23-nov-2026): t1 estándar, t2 fino, t3 selecto, t4 raro (relicario prismático);
   las piezas raras cerradas conservan su esplendor bajo velo de oro con barra de papiros en vez de apagarse en gris */
.ap-vitrina li.raro{position:relative}.ap-vitrina li.raro.cerrado::before{content:"Raro";position:absolute;top:8px;right:12px;font:700 .56rem/1 var(--f-ui);letter-spacing:.14em;text-transform:uppercase;color:#ffe49e;padding:3px 7px;border-radius:999px;border:1px solid rgba(255,214,122,.45);background:linear-gradient(180deg,rgba(44,30,10,.88),rgba(20,14,6,.92));box-shadow:0 2px 10px rgba(0,0,0,.45)}
.ap-rtag{display:inline-flex;align-items:center;margin-left:6px;vertical-align:middle;font:700 .54rem/1 var(--f-ui);font-style:normal;letter-spacing:.13em;text-transform:uppercase;color:#ffe49e;padding:2.5px 6px;border-radius:999px;border:1px solid rgba(255,214,122,.45);background:linear-gradient(180deg,rgba(44,30,10,.88),rgba(20,14,6,.92))}
:root[data-theme="light"] .ap-vitrina li.raro.cerrado::before,:root[data-theme="light"] .ap-rtag{color:#6a480d;border-color:rgba(138,106,43,.45);background:linear-gradient(180deg,#fff7df,#efe1be)}
/* X3 (BiEx, 13-nov-2026): simetría en PC. Escudriña en una columna central (el Árbol ya no queda en 760 px por la clase .ap
   del lector); la armadura y la tienda una debajo de otra; la vitrina en filas (muestra, nombre, precio y lo que da),
   en dos columnas en pantallas anchas: sin columnas largas ni huecos */
@media (min-width:1100px){.panel.jg{max-width:1080px;margin-inline:auto;width:100%}}
.panel.jg > .ap{max-width:none;width:100%;gap:18px}
.jg-dos.ap-dos{grid-template-columns:minmax(0,1fr)!important}
.ap-vitrina{display:grid!important;grid-template-columns:minmax(0,1fr);gap:9px}
.ap-vitrina li{position:relative;overflow:hidden;display:grid;grid-template-columns:52px minmax(0,1fr) auto;grid-template-areas:"mu mn bt" "mu da da";justify-items:start;align-items:center;column-gap:12px;row-gap:3px;padding:11px 12px;text-align:left;transition:border-color .2s,box-shadow .22s}
.ap-vitrina li .ap-mu{position:relative;overflow:hidden;grid-area:mu;width:52px;height:52px;border-radius:14px;align-self:center;display:grid;place-items:center;
  background:radial-gradient(circle at 42% 32%,color-mix(in srgb,var(--ac-c,#d4a84a) 22%,#1a150e),#090807 78%);
  border:1px solid color-mix(in srgb,var(--ac-c,#c9a865) 34%,var(--linea-2));
  box-shadow:inset 0 1px 0 rgba(255,248,224,.18),0 6px 14px -10px rgba(0,0,0,.8)}
.ap-vitrina li .ap-mu svg{position:relative;z-index:1;width:46px;height:46px;display:block}
.ap-vitrina li.ap-acc-t2{border-color:color-mix(in srgb,var(--ac-c,var(--oro)) 34%,var(--linea-2));
  background:radial-gradient(115% 80% at 8% 0%,color-mix(in srgb,var(--ac-c,var(--oro)) 12%,transparent),transparent 66%),linear-gradient(180deg,color-mix(in srgb,var(--tinta) 5%,transparent),transparent)}
.ap-vitrina li.ap-acc-t2 .ap-mu{border-color:color-mix(in srgb,var(--ac-c,#e6bf67) 58%,transparent);box-shadow:inset 0 1px 0 rgba(255,248,224,.28),0 0 14px -6px color-mix(in srgb,var(--ac-c,#e6bf67) 55%,transparent)}
.ap-vitrina li.ap-acc-t3{border-color:color-mix(in srgb,var(--ac-c,var(--oro-vivo)) 48%,var(--linea-2));
  background:radial-gradient(120% 90% at 8% 0%,color-mix(in srgb,var(--ac-c,var(--oro)) 16%,transparent),transparent 68%),linear-gradient(180deg,color-mix(in srgb,var(--oro) 8%,transparent),transparent);
  box-shadow:inset 0 1px 0 rgba(255,246,214,.14),0 10px 22px -18px color-mix(in srgb,var(--ac-c,var(--oro)) 65%,transparent)}
.ap-vitrina li.ap-acc-t3 .ap-mu{border:1.25px solid transparent;
  background:radial-gradient(circle at 42% 30%,color-mix(in srgb,var(--ac-c,#f2c65e) 30%,#1b150c),#080706 78%) padding-box,linear-gradient(135deg,#fff5cf,var(--ac-c,#e3b756) 45%,#5e3f10 75%,#ffeeb8) border-box;
  box-shadow:inset 0 1px 0 rgba(255,248,224,.36),0 0 18px -5px color-mix(in srgb,var(--ac-c,#f2c65e) 68%,transparent)}
.ap-vitrina li.ap-acc-t4{border:1.2px solid transparent;
  background:radial-gradient(130% 105% at 0% 0%,color-mix(in srgb,var(--ac-c,#f5c64e) 18%,transparent),transparent 64%) padding-box,
    radial-gradient(110% 90% at 100% 100%,rgba(140,185,255,.09),transparent 62%) padding-box,
    linear-gradient(180deg,color-mix(in srgb,var(--hoja-2) 94%,transparent),color-mix(in srgb,var(--hoja) 96%,transparent)) padding-box,
    linear-gradient(135deg,rgba(255,244,205,.65),color-mix(in srgb,var(--ac-c,#f5c64e) 68%,transparent) 38%,rgba(128,176,255,.45) 72%,rgba(255,232,168,.58)) border-box;
  box-shadow:inset 0 1px 0 rgba(255,248,224,.22),0 14px 26px -18px rgba(0,0,0,.85),0 0 22px -12px color-mix(in srgb,var(--ac-c,#f5c64e) 55%,transparent)}
.ap-vitrina li.ap-acc-t4 .ap-mu{border:1.4px solid transparent;border-radius:15px;
  background:radial-gradient(circle at 42% 28%,color-mix(in srgb,var(--ac-c,#f5c64e) 34%,#21180d),#070606 78%) padding-box,
    linear-gradient(135deg,#fff8de,var(--ac-c,#f5c64e) 32%,#8bbcff 66%,#ffe9a8) border-box;
  box-shadow:inset 0 1px 1px rgba(255,250,232,.4),0 0 20px -4px color-mix(in srgb,var(--ac-c,#f5c64e) 76%,transparent)}
.ap-vitrina li.ap-acc-t3 .ap-mu::after,.ap-vitrina li.ap-acc-t4 .ap-mu::after{content:"";position:absolute;inset:-25%;pointer-events:none;opacity:.34;
  background:linear-gradient(118deg,transparent 28%,rgba(255,248,224,.42) 48%,rgba(175,218,255,.28) 58%,transparent 76%);
  transform:translate3d(-18%,0,0);transition:transform .55s cubic-bezier(.2,.8,.2,1),opacity .3s ease}
.ap-vitrina li:hover .ap-mu::after{transform:translate3d(26%,0,0);opacity:.58}
.ap-vitrina li.cerrado .ap-mu{opacity:.9;box-shadow:inset 0 0 0 1px rgba(255,232,168,.26),0 0 16px -6px color-mix(in srgb,var(--ac-c,#f5c64e) 58%,transparent)}
.ap-vitrina li.puesto{border-color:color-mix(in srgb,var(--oro-vivo) 72%,transparent);box-shadow:0 0 0 3px color-mix(in srgb,var(--oro) 15%,transparent),inset 0 1px 0 rgba(255,248,224,.24)}
.ap-vitrina li .ap-mn{grid-area:mn;display:block;font:600 .86rem/1.25 var(--f-ui)}
.ap-vitrina li .ap-da,.ap-vitrina li .ap-raro{font:400 .78rem/1.42 var(--f-ui);color:var(--tinta-2);text-align:left;justify-self:start}
.ap-vitrina li .ap-da,.ap-vitrina li .ap-raro{grid-column:2/-1}
.ap-vitrina li .ap-raro{display:grid;gap:4px;width:100%;max-width:260px;color:var(--oro-vivo);font-weight:500}
.ap-raro-bar{display:block;position:relative;height:4px;border-radius:99px;background:color-mix(in srgb,var(--tinta) 12%,transparent);overflow:hidden}
.ap-raro-bar i{position:absolute;inset:0;display:block;border-radius:inherit;background:linear-gradient(90deg,var(--oro-2),var(--ac-c,var(--oro-vivo)) 72%,#fff4cf);transform:translate3d(calc(var(--rp,0) * 1% - 100%),0,0)}
.ap-vitrina li .btn{grid-area:bt;justify-self:end}
.ap-vitrina li.raro.cerrado{grid-template-areas:"mu mn mn" "mu da da"}
.ap-vitrina li.raro.cerrado .ap-mn{padding-right:52px}
.ap-vitrina li .ap-da .ap-cita{font:inherit;font-weight:600;color:var(--oro-vivo);display:inline-flex;align-items:center;gap:.28em;padding:0;vertical-align:baseline}
.ap-cita-fl{font-size:.8em;opacity:.8;transition:transform .2s}.ap-cita[aria-expanded="true"] .ap-cita-fl{transform:rotate(180deg)}
.ap-versos{margin:.45rem 0 .1rem;padding:.55rem .7rem;border-left:2px solid color-mix(in srgb,var(--oro) 55%,transparent);border-radius:0 10px 10px 0;background:color-mix(in srgb,var(--oro) 7%,transparent)}
.ap-versos p{margin:0 0 .3rem;font:400 .86rem/1.5 var(--f-texto);color:var(--tinta)}.ap-versos p:last-child{margin-bottom:0}
.ap-versos sup{font:600 .62rem/1 var(--f-ui);color:var(--oro);margin-right:.15em}
.ap-versos .rx-av-f{font:400 .68rem/1.4 var(--f-ui);color:var(--tenue);margin-top:.35rem}
@media (min-width:900px){.ap-vitrina{grid-template-columns:repeat(2,minmax(0,1fr))}.ap-uso{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}}.ap-raro{font:400 .68rem/1.3 var(--f-ui);color:var(--tenue);text-align:center}
@media (prefers-reduced-motion:reduce){.ap-vitrina li .ap-mu::after{animation:none;opacity:0}}
html[data-mov="no"] .ap-vitrina li .ap-mu::after{animation:none;opacity:0}
.jg-lb,.jg-lbp{position:fixed;left:50%;bottom:calc(14px + env(safe-area-inset-bottom,0px) + var(--jg-lb-alza,0px));z-index:63;transform:translate3d(-50%,0,0);display:inline-flex;align-items:center;justify-content:center;gap:.42rem;min-height:1.62rem;padding:.22rem .62rem .22rem .34rem;border-radius:999px;cursor:pointer;-webkit-tap-highlight-color:transparent;
  font:600 .72rem/1 var(--f-ui);letter-spacing:.05em;color:var(--oro-vivo);border:1px solid color-mix(in srgb,var(--oro-vivo) 58%,transparent);
  background:radial-gradient(120% 100% at 50% -30%,rgba(255,246,214,.3),transparent 62%),linear-gradient(180deg,color-mix(in srgb,var(--oro) 26%,var(--hoja)),color-mix(in srgb,var(--oro) 9%,var(--hoja)));
  box-shadow:inset 0 1px 0 rgba(255,246,214,.45),inset 0 -10px 16px -12px rgba(255,224,140,.6),0 12px 28px -10px rgba(0,0,0,.78),0 0 0 1px rgba(0,0,0,.22);
  transition:opacity .24s ease,transform .26s cubic-bezier(.3,1.3,.5,1)}
.jg-lb::after,.jg-lbp::after{content:"";position:absolute;inset:-.6rem -.3rem}
.jg-lb.fuera,.jg-lbp.fuera{opacity:0;transform:translate3d(-50%,14px,0);pointer-events:none}
.jg-lb:active,.jg-lbp:active{transform:translate3d(-50%,0,0) scale(.96)}
/* X16: la perícopa entera, encima del botón del verso (vista continua) */
.jg-lbp{bottom:calc(14px + env(safe-area-inset-bottom,0px) + var(--jg-lb-alza,0px) + 2.25rem);min-height:1.5rem;padding:.18rem .56rem .18rem .3rem;color:var(--tinta)}
.jg-lbp .jg-lb-i{width:1rem;height:1rem}
/* X15: «Leído» al pie del verso (vista por versos), sobre el borde de la fila: no mueve el texto */
/* (15-nov-2026, fluidez) el pie vive en la capa de la hoja y se coloca con una transformación: nunca cambia la fila mientras se lee */
.jg-pie{position:absolute;left:0;top:0;right:auto;bottom:auto;z-index:3;display:inline-flex;gap:.32rem;align-items:center;will-change:transform;transition:transform .26s cubic-bezier(.2,.7,.2,1)}
.jg-pie.jg-pie-quieto{transition:none}
/* cada fila reserva desde el principio, bajo su último renglón, el lugar de su «Leído» (sin crecer ni encoger al leer) */
.hoja.jg-pies .vl{padding-bottom:calc(9px + 1.14rem)}
@media (max-width:600px){.hoja.jg-pies .vl{padding-bottom:calc(7px + 1.14rem)}}
.jg-pie-n{font:600 .56rem/1 var(--f-ui);letter-spacing:.04em;opacity:.78}
.jg-pie-n:not(:empty)::before{content:"·";margin:0 .3em 0 .1em;opacity:.7}
.jg-pie[hidden],.jg-pie [hidden]{display:none}
.jg-pie-b{all:unset;box-sizing:border-box;position:relative;display:inline-flex;align-items:center;gap:.3rem;height:1.14rem;padding:0 .56rem 0 .16rem;border-radius:999px;cursor:pointer;-webkit-tap-highlight-color:transparent;
  font:600 .58rem/1 var(--f-ui);letter-spacing:.08em;text-transform:uppercase;color:var(--oro-vivo);border:1px solid color-mix(in srgb,var(--oro-vivo) 46%,transparent);
  background:radial-gradient(120% 100% at 50% -30%,rgba(255,246,214,.24),transparent 62%),linear-gradient(180deg,color-mix(in srgb,var(--oro) 22%,var(--hoja)),color-mix(in srgb,var(--oro) 8%,var(--hoja)));
  box-shadow:inset 0 1px 0 rgba(255,246,214,.38),0 8px 18px -10px rgba(0,0,0,.75);transition:transform .2s cubic-bezier(.3,1.3,.5,1),opacity .2s}
.jg-pie-b::after{content:"";position:absolute;inset:-.62rem -.28rem}
.jg-pie-b:active{transform:scale(.95)}
.jg-pie-b:focus-visible{outline:2px solid var(--oro);outline-offset:2px}
.jg-pie-p{color:var(--tinta);border-color:color-mix(in srgb,var(--oro) 32%,transparent)}
.jg-pie-i{width:.82rem;height:.82rem;border-radius:50%;border:1.1px solid currentColor;display:grid;place-items:center;flex:none;transition:background .2s}
.jg-pie-i::after{content:"";width:.3rem;height:.15rem;margin-top:-.08rem;border:solid currentColor;border-width:0 0 1.3px 1.3px;transform:rotate(-45deg);opacity:.6;transition:opacity .2s}
.jg-pie.espera .jg-pie-v .jg-pie-i::after{opacity:.28}
/* (BiEx, 21-nov-2026, AF51) la marca se enciende solo en el botón tocado: «Leído» no enciende la perícopa */
.jg-pie.hecho-p .jg-pie-i,.jg-pie.hecho-v .jg-pie-v .jg-pie-i{background:var(--oro-vivo)}
.jg-pie.hecho-p .jg-pie-i::after,.jg-pie.hecho-v .jg-pie-v .jg-pie-i::after{border-color:var(--hoja);opacity:1}
.jg-lb-i{width:1.12rem;height:1.12rem;border-radius:50%;border:1.3px solid currentColor;display:grid;place-items:center;flex:none;transition:background .2s}
.jg-lb-i::after{content:"";width:.4rem;height:.2rem;margin-top:-.1rem;border:solid currentColor;border-width:0 0 1.5px 1.5px;transform:rotate(-45deg);opacity:.5;transition:opacity .2s}
.jg-lb.hecho .jg-lb-i,.jg-lbp.hecho .jg-lb-i{background:var(--oro-vivo)}
.jg-lb.hecho .jg-lb-i::after{border-color:var(--hoja);opacity:1}
.jg-lb.espera .jg-lb-i::after{opacity:.32}
.jg-lb-t{display:flex;align-items:baseline;gap:.4em;text-align:left;white-space:nowrap}
.jg-lb-t b{font-weight:600}
.jg-lb-t small{font:500 .56rem/1 var(--f-ui);letter-spacing:.09em;color:var(--tenue);text-transform:uppercase}
.jg-lb-t small:not(:empty)::before{content:"·";margin-right:.4em;opacity:.7}
.jg-rec{position:fixed;inset:0;z-index:95;display:grid;place-items:center;padding:20px}
.jg-rec-velo{position:absolute;inset:0;background:rgba(6,5,3,.62)}
.jg-rec-c{position:relative;width:min(420px,100%);display:grid;justify-items:center;gap:10px;padding:22px 18px 18px;border-radius:22px;border:1px solid color-mix(in srgb,var(--oro-vivo) 45%,transparent);background:linear-gradient(180deg,color-mix(in srgb,var(--oro) 12%,transparent),transparent 42%),color-mix(in srgb,var(--hoja) 94%,transparent);box-shadow:inset 0 1px 0 var(--vidrio-filo,rgba(255,255,255,.12)),0 30px 60px -24px rgba(0,0,0,.8)}
.jg-rec-sello{width:56px;height:56px;display:grid;place-items:center;filter:drop-shadow(0 6px 14px rgba(255,200,90,.35))}.jg-rec-sello svg{width:100%;height:100%}
.jg-rec-c h3{margin:0;font:500 1.42rem/1.15 var(--f-display);color:var(--oro-vivo);letter-spacing:.02em}
.jg-rec-l{list-style:none;margin:2px 0 4px;padding:0;width:100%;display:grid;gap:6px}
.jg-rec-it{display:grid;grid-template-columns:30px minmax(0,1fr) auto;align-items:center;gap:10px;padding:8px 10px;border-radius:12px;border:1px solid var(--linea-2);background:color-mix(in srgb,var(--hoja-2) 80%,transparent)}
.jg-rec-i{width:30px;height:30px;display:grid;place-items:center;border-radius:50%;color:var(--oro-vivo);background:color-mix(in srgb,var(--oro) 14%,transparent)}.jg-rec-i svg{width:17px;height:17px}
.jg-rec-t{display:grid;min-width:0}.jg-rec-t b{font:600 .86rem/1.25 var(--f-ui);color:var(--tinta)}.jg-rec-t small{font:400 .74rem/1.3 var(--f-ui);color:var(--tinta-2);overflow:hidden;text-overflow:ellipsis}
.jg-rec-v{display:grid;justify-items:end;gap:1px;font-variant-numeric:tabular-nums}.jg-rec-v b{font:600 1rem/1 var(--f-ui);color:var(--oro-vivo)}.jg-rec-v small{font:400 .62rem/1 var(--f-ui);color:var(--tenue)}.jg-rec-v em{display:inline-flex;align-items:center;gap:3px;font:500 .74rem/1 var(--f-ui);font-style:normal;color:var(--tinta-2)}.jg-rec-v em svg{width:13px;height:13px}
.jg-rec-b{min-width:12rem;margin-top:4px}
.jg-ren{margin-top:10px;padding:10px 12px;border-radius:14px;border:1px solid color-mix(in srgb,#7cc47a 40%,var(--linea-2));background:color-mix(in srgb,#7cc47a 6%,transparent)}
.jg-ren-cab{display:flex;align-items:center;gap:10px}.jg-ren-cab b{display:block;font:600 .9rem/1.2 var(--f-ui);color:var(--tinta)}.jg-ren-cab small{font:400 .74rem/1.3 var(--f-ui);color:var(--tinta-2)}
.jg-ren-i{display:inline-grid;place-items:center;width:28px;height:28px;flex:none;color:#8fd48d}.jg-ren-i svg{width:22px;height:22px}
.jg-ren-l{list-style:none;margin:8px 0 0;padding:0;display:grid;gap:7px}.jg-ren-l li{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:3px 10px;font:400 .78rem/1.3 var(--f-ui);color:var(--tinta-2)}
.jg-ren-l li em{font-style:normal;font-variant-numeric:tabular-nums;color:var(--tinta)}.jg-ren-l li.ok em{color:#8fd48d}.jg-ren-l .jg-barra{grid-column:1/-1}
.jg-ren-esp{display:flex;gap:8px;align-items:flex-start}
.jg-ah{position:absolute;left:0;top:0;width:0;height:0;z-index:-1;pointer-events:none}
.jg-ah[hidden],.jg-ah [hidden]{display:none}
/* «Leído» (13-nov-2026): un hilo de luz en el margen a lo largo del verso que se marcaría y un halo suave detrás de su número;
   el verso se elige solo si se ve de verdad (su número o al menos dos renglones bajo las barras), así nada queda tapado */
/* (15-nov-2026, fluidez: «la luz titila como un cortocircuito») el hilo y el halo tienen tamaño fijo y se colocan y estiran solo con
   transformaciones (sin tocar el diseño de la hoja); al pasar de un verso al siguiente se deslizan en vez de apagarse y encenderse,
   y el tono del verso ya marcado entra con un fundido */
.jg-ah .f{position:absolute;left:-1px;top:0;width:2px;height:100px;transform-origin:50% 0;will-change:transform,opacity;transition:transform .26s cubic-bezier(.2,.7,.2,1)}
.jg-ah .f>i{position:absolute;inset:0;border-radius:2px;transition:opacity .35s ease}
.jg-ah .f .fo{background:linear-gradient(180deg,transparent,var(--oro-vivo) 14%,color-mix(in srgb,var(--oro-vivo) 70%,#fff8e6) 50%,var(--oro-vivo) 86%,transparent)}
.jg-ah .f>i::before{content:"";position:absolute;left:-10px;right:-10px;top:-4px;bottom:-4px;border-radius:50%;background:radial-gradient(closest-side,color-mix(in srgb,var(--oro) 30%,transparent),transparent)}
.jg-ah .n{position:absolute;left:0;top:0;width:40px;height:40px;transform-origin:0 0;will-change:transform,opacity;transition:transform .26s cubic-bezier(.2,.7,.2,1)}
.jg-ah .n>i{position:absolute;inset:0;border-radius:50%;transition:opacity .35s ease}
.jg-ah .n .no{background:radial-gradient(closest-side,color-mix(in srgb,var(--oro-vivo) 48%,transparent),color-mix(in srgb,var(--oro) 16%,transparent) 64%,transparent)}
.jg-ah .n.oculto{visibility:hidden}
.jg-ah.sin-t .f,.jg-ah.sin-t .n{transition:none}
.jg-ah .fa,.jg-ah .na{opacity:0}
.jg-ah.marcado .fa,.jg-ah.marcado .na{opacity:1}
.jg-ah.marcado .fo,.jg-ah.marcado .no{opacity:0}
.jg-ah .f,.jg-ah .n{animation:jg-ah 3.4s ease-in-out infinite}
/* Neon (23-nov-2026): en la lectura por versos (.hoja.jg-pies) cada verso lleva UNA sola línea vertical limpia (.vn::after);
   se omite la línea duplicada del borde (.vl::before / .jg-ah .f), dejando el hilo únicamente en vista continua y el halo suave en el número */
.hoja.jg-pies .vl{position:relative;contain:layout style}
.hoja.jg-pies .jg-ah .f{display:none}
/* AC17 + Neon (23-nov-2026): la clasificación y el prestigio, desplegados con simetría exacta en 4 columnas */
.jg-cl2{display:grid;gap:11px;padding:12px;border-radius:15px;background:color-mix(in srgb,var(--hoja-2) 70%,transparent);border:1px solid var(--linea-2)}
.jg-cl2-seg{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr));width:100%}
.jg-cl2-z{display:grid;gap:9px;min-width:0}
.jg-cl2-sub{text-align:center;margin:0}
.jg-cl2-z .jg-lista{margin:0}
.jg-cl2-tu{border-top:1px dashed var(--linea);padding-top:6px}
.jg-cl2-yo{text-align:center}
.jg-cl2-mas{justify-self:center;margin-top:2px}
.jg-cl2-mas svg{width:14px;height:14px}
/* AC10 (15-nov-2026): sobre un verso ya marcado el resplandor no se apaga: se queda en un tono más sereno (azul de repaso) */
.jg-ah .f .fa{background:linear-gradient(180deg,transparent,color-mix(in srgb,var(--repaso,#8fd0ff) 80%,transparent) 14%,color-mix(in srgb,var(--repaso,#8fd0ff) 55%,#fff) 50%,color-mix(in srgb,var(--repaso,#8fd0ff) 80%,transparent) 86%,transparent)}
.jg-ah .f .fa::before{background:radial-gradient(closest-side,color-mix(in srgb,var(--repaso,#8fd0ff) 22%,transparent),transparent)}
.jg-ah .n .na{background:radial-gradient(closest-side,color-mix(in srgb,var(--repaso,#8fd0ff) 34%,transparent),color-mix(in srgb,var(--repaso,#8fd0ff) 10%,transparent) 64%,transparent)}
@keyframes jg-ah{0%,100%{opacity:.66}50%{opacity:1}}
html[data-mov="no"] .jg-ah .f,html[data-mov="no"] .jg-ah .n{animation:none}
@media (prefers-reduced-motion:reduce){.jg-ah .f,.jg-ah .n{animation:none}}
/* Marcas de lectura en oro cepillado y zafiro de repaso (Neon, 23-nov-2026): alta legibilidad y 0 % CPU */
.vn.jg-meta,.vs>sup.jg-meta{color:var(--oro-vivo)}
.vn.jg-leido,.vs>sup.jg-leido{color:var(--oro-vivo);text-shadow:0 0 11px color-mix(in srgb,var(--oro) 44%,transparent)}
.vl .vn.jg-leido::before{content:"";position:absolute;left:0;top:.72em;width:7.5px;height:3.8px;border:solid var(--oro-vivo);border-width:0 0 1.8px 1.8px;border-radius:0;background:none;transform:rotate(-45deg);opacity:1}
.vl:not(.mk):not(.anadido):not(.an-parcial) .vn.jg-leido::after{background:linear-gradient(180deg,color-mix(in srgb,var(--oro-vivo) 28%,transparent),var(--oro-vivo) 26%,var(--oro) 74%,color-mix(in srgb,var(--oro) 24%,transparent));box-shadow:0 0 8px -1px color-mix(in srgb,var(--oro) 50%,transparent)}
.vs>sup.jg-leido{padding:0 2px 2px;background:linear-gradient(90deg,transparent,var(--oro-vivo) 20%,var(--oro) 80%,transparent) 50% 100%/92% 1.6px no-repeat}
.vl .vn.jg-leido.jg-repaso::before{width:7px;height:3.6px;border-color:var(--repaso,#8fd0ff);box-shadow:-2.6px 2.6px 0 -.2px transparent;filter:drop-shadow(-3.2px 1.2px 0 var(--oro-vivo))}
.vl:not(.mk):not(.anadido):not(.an-parcial) .vn.jg-repaso::after{width:3px;border:0;background:linear-gradient(180deg,var(--oro-vivo) 0 46%,var(--repaso,#8fd0ff) 54% 100%);border-radius:2px;box-shadow:0 0 8px -1px color-mix(in srgb,var(--repaso,#8fd0ff) 45%,transparent)}
.vn.jg-repaso,.vs>sup.jg-repaso{text-shadow:0 0 10px color-mix(in srgb,var(--repaso,#8fd0ff) 42%,transparent)}
.vs>sup.jg-repaso{padding:0 2px 3px;background:linear-gradient(90deg,transparent,var(--oro-vivo) 20%,var(--oro) 80%,transparent) 50% calc(100% - 3px)/92% 1.3px no-repeat,linear-gradient(90deg,transparent,var(--repaso,#8fd0ff) 20%,var(--repaso,#8fd0ff) 80%,transparent) 50% 100%/92% 1.3px no-repeat}
:root[data-theme="light"]{--repaso:#1f6fb8}
.vn.jg-quiere,.vs>sup.jg-quiere{text-decoration:underline dotted color-mix(in srgb,var(--oro-vivo) 80%,transparent);text-underline-offset:4px}
.jg-pie-p{color:color-mix(in srgb,var(--oro-vivo) 38%,var(--tinta));border-color:color-mix(in srgb,var(--oro) 46%,transparent);background:radial-gradient(120% 100% at 50% -30%,rgba(255,246,214,.22),transparent 62%),linear-gradient(180deg,color-mix(in srgb,var(--oro) 14%,var(--hoja-2)),color-mix(in srgb,var(--hoja) 96%,transparent))}
.fin-leido.jg-fin{display:grid;justify-items:center;gap:8px}
.fin-leido.jg-fin.hecho{display:flex;width:max-content;max-width:100%;box-sizing:border-box;margin:22px auto 6px;gap:9px;align-items:center;justify-content:center;padding:9px 19px 9px 15px;border-radius:999px;border:1.2px solid transparent;
  background:radial-gradient(110% 120% at 50% -20%,color-mix(in srgb,var(--oro-vivo) 24%,transparent),transparent 64%) padding-box,linear-gradient(180deg,color-mix(in srgb,var(--hoja-2) 94%,transparent),color-mix(in srgb,var(--hoja) 98%,transparent)) padding-box,linear-gradient(135deg,#fff5cf,var(--oro) 35%,color-mix(in srgb,var(--oro-2) 60%,#4d330c) 68%,#ffeeb8) border-box;
  color:var(--oro-vivo);font:600 .78rem/1 var(--f-ui);letter-spacing:.12em;text-transform:uppercase;box-shadow:inset 0 1px 0 rgba(255,248,224,.3),0 10px 24px -14px rgba(0,0,0,.75),0 0 18px -8px color-mix(in srgb,var(--oro) 65%,transparent)}
.fin-leido.jg-fin.hecho svg{width:17px;height:17px;flex:none}
:root[data-theme="light"] .fin-leido.jg-fin.hecho{color:#7a5510;box-shadow:inset 0 1px 0 rgba(255,255,255,.85),0 8px 18px -12px rgba(60,45,20,.35)}
.jg-fin-n{max-width:34em;text-align:center;margin:0}
/* Misión mundial activa: faro de participación y llamada directa a leer (Neon, 23-nov-2026) */
.jg-tarjeta.jg-mis-mund{border-color:color-mix(in srgb,var(--oro) 48%,var(--linea-2));background:radial-gradient(125% 95% at 50% -20%,color-mix(in srgb,var(--oro) 16%,transparent),transparent 62%),var(--hoja);box-shadow:inset 0 1px 0 rgba(255,248,224,.18),0 14px 28px -20px rgba(0,0,0,.78)}
.jg-mm-aviso{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;padding:8px 11px;margin:0 0 10px;border-radius:12px;border:1px solid color-mix(in srgb,var(--oro) 42%,transparent);background:linear-gradient(180deg,color-mix(in srgb,var(--oro) 15%,var(--hoja-2)),color-mix(in srgb,var(--oro) 6%,var(--hoja)))}
.jg-mm-aviso.ya{border-color:color-mix(in srgb,#6fbf8f 48%,transparent);background:linear-gradient(180deg,color-mix(in srgb,#6fbf8f 14%,var(--hoja-2)),color-mix(in srgb,#6fbf8f 5%,var(--hoja)))}
.jg-mm-est{display:inline-flex;align-items:center;gap:8px;font:600 .66rem/1.2 var(--f-ui);letter-spacing:.14em;text-transform:uppercase;color:var(--oro-vivo)}
.jg-mm-aviso.ya .jg-mm-est{color:#7cd99e}
:root[data-theme="light"] .jg-mm-aviso.ya .jg-mm-est{color:#1d6f42}
.jg-mm-dot{position:relative;flex:none;width:7px;height:7px;border-radius:50%;background:var(--oro-vivo);box-shadow:0 0 8px color-mix(in srgb,var(--oro-vivo) 75%,transparent)}
.jg-mm-aviso.ya .jg-mm-dot{background:#6fbf8f;box-shadow:0 0 8px rgba(111,191,143,.7)}
.jg-mm-dot::after{content:"";position:absolute;inset:-4px;border-radius:50%;border:1.5px solid currentColor;color:var(--oro-vivo);opacity:0;animation:jg-coloso-pulso 2.6s ease-out infinite}
.jg-mm-aviso.ya .jg-mm-dot::after{color:#6fbf8f}
html.con-modal .jg-mm-dot::after,html.desplazando .jg-mm-dot::after{animation-play-state:paused}
html[data-mov="no"] .jg-mm-dot::after{animation:none;display:none}
@media (prefers-reduced-motion:reduce){.jg-mm-dot::after{animation:none;display:none}}
.jg-mm-meta{font:600 .68rem/1 var(--f-ui);padding:4px 9px;border-radius:999px;color:var(--oro-vivo);border:1px solid color-mix(in srgb,var(--oro) 38%,transparent);background:color-mix(in srgb,var(--oro) 10%,transparent);white-space:nowrap}
.jg-mm-aviso.ya .jg-mm-meta{color:#7cd99e;border-color:color-mix(in srgb,#6fbf8f 42%,transparent);background:color-mix(in srgb,#6fbf8f 10%,transparent)}
:root[data-theme="light"] .jg-mm-aviso.ya .jg-mm-meta{color:#1d6f42}
.jg-mm-cta{display:inline-flex;align-items:center;justify-content:center;gap:7px;width:100%;box-sizing:border-box;margin:10px 0 8px;text-decoration:none}
.jg-mm-cta svg{width:15px;height:15px;flex:none}
.jg-mm-hoy[hidden]{display:none}
.jg-mm-hoy{display:grid;gap:8px;padding:13px 15px;border-radius:var(--radio);border:1px solid color-mix(in srgb,var(--oro) 48%,var(--linea-2));background:radial-gradient(120% 100% at 10% -20%,color-mix(in srgb,var(--oro) 18%,transparent),transparent 62%),var(--hoja);box-shadow:inset 0 1px 0 rgba(255,248,224,.18),0 12px 24px -18px rgba(0,0,0,.72)}
.jg-mm-hoy-cab{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}
.jg-mm-hoy-t{margin:0;font:500 1.04rem/1.25 var(--f-display);color:var(--tinta)}
.jg-mm-hoy-acc{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.jg-mm-hoy-acc .btn{flex:1 1 auto;justify-content:center}
.jg-mm-hoy-acc .btn svg{width:14px;height:14px}
/* Selector de vibración en Cuenta › Preferencias */
.jg-vib-pref{display:grid;gap:7px;padding:10px 0 2px;border-top:1px solid var(--linea-2);margin-top:4px}
.jg-vib-pref .jg-vib-tit{font:500 .92rem/1.3 var(--f-ui);color:var(--tinta)}
.jg-vib-pref .jg-seg{margin:0}
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
.ap-savia{position:absolute;left:0;top:0;width:1000px;height:1110px;transform-origin:0 0;transform:scale(var(--k,.38));pointer-events:none}
.ap-sv{position:absolute;left:0;top:0;width:var(--s);height:var(--s);border-radius:50%;background:radial-gradient(circle,#fffdf3 0 22%,var(--c) 40%,color-mix(in srgb,var(--c) 0%,transparent) 72%);opacity:0;will-change:transform,opacity}
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
/* Neon (23-nov-2026): bloques flotantes en Hallazgos, cantos en Liga y Papiro épico (100 % compositor transform+opacity, pausa fuera de vista/modal) */
@keyframes jg-flota{0%,100%{transform:translate3d(0,0,0)}50%{transform:translate3d(0,-5px,0)}}
@keyframes jg-sombra{0%,100%{transform:scaleX(1);opacity:.5}50%{transform:scaleX(.74);opacity:.22}}
@keyframes jg-pp-flota{0%,100%{transform:translate3d(0,0,0)}50%{transform:translate3d(0,-5.5px,0)}}
@keyframes jg-pp-luz{0%,14%{transform:translate3d(-130%,0,0);opacity:0}38%{opacity:.34}62%{transform:translate3d(250%,0,0);opacity:0}100%{transform:translate3d(250%,0,0);opacity:0}}
.jg-piedras{gap:12px 5px}
@media (max-width:330px){.jg-piedras{grid-template-columns:repeat(3,minmax(0,1fr))}}
.jg-piedra{position:relative;gap:4px;padding:7px 2px 6px;border-radius:14px;border:1px solid transparent;min-width:0;transition:border-color .22s ease,background-color .22s ease}
.jg-piedra>span:not(.jg-pd-esc){max-width:100%;overflow:hidden;text-overflow:ellipsis;font-size:clamp(.62rem,2.6vw,.73rem);line-height:1.2;letter-spacing:-.01em;white-space:nowrap}
.jg-piedra.tiene{background:radial-gradient(110% 85% at 50% 18%,color-mix(in srgb,var(--pg,var(--oro)) 14%,transparent),transparent 72%);border-color:color-mix(in srgb,var(--pg,var(--oro)) 22%,transparent)}
.jg-piedra.tiene:hover{border-color:color-mix(in srgb,var(--pg,var(--oro)) 54%,transparent);background:radial-gradient(110% 85% at 50% 18%,color-mix(in srgb,var(--pg,var(--oro)) 22%,transparent),transparent 74%)}
.jg-piedra:not(.tiene){opacity:.68}
.jg-pd-esc{position:relative;width:50px;height:54px;display:grid;place-items:center;margin-bottom:2px}
.jg-pd-halo{position:absolute;inset:-4px;border-radius:50%;pointer-events:none;opacity:.55;background:radial-gradient(closest-side,color-mix(in srgb,var(--pg,var(--oro)) 38%,transparent),color-mix(in srgb,var(--pg,var(--oro)) 10%,transparent) 58%,transparent 100%)}
.jg-pd-gema{position:relative;z-index:1;width:44px;height:44px;display:grid;place-items:center;will-change:transform}
.jg-piedra.tiene .jg-pd-gema{animation:jg-flota var(--ft,5.1s) ease-in-out var(--fd,0s) infinite}
.jg-piedra.tiene:hover .jg-pd-gema{animation-play-state:paused;transform:translate3d(0,-6px,0) scale(1.06)}
.jg-pd-gema svg{width:100%;height:100%;max-width:44px;display:block}
.jg-pd-sombra{position:absolute;left:50%;bottom:0;width:30px;height:7px;margin-left:-15px;border-radius:50%;pointer-events:none;background:radial-gradient(closest-side,rgba(0,0,0,.62),transparent);will-change:transform,opacity;animation:jg-sombra var(--ft,5.1s) ease-in-out var(--fd,0s) infinite}
:root[data-theme="light"] .jg-pd-sombra{background:radial-gradient(closest-side,rgba(45,30,10,.34),transparent)}
.jg-cel .arte.jg-pd-modal{position:relative;display:grid;place-items:center;width:108px;height:114px;margin:0 auto}
.jg-cel .arte.jg-pd-modal .jg-pd-halo{inset:-14px;opacity:.72}
.jg-cel .arte.jg-pd-modal .jg-pd-gema{width:84px;height:84px;animation:jg-flota 4.9s ease-in-out infinite}
.jg-cel .arte.jg-pd-modal .jg-pd-gema svg{max-width:84px}
.jg-cel .arte.jg-pd-modal .jg-pd-sombra{width:54px;height:11px;margin-left:-27px;animation:jg-sombra 4.9s ease-in-out infinite}
/* Cantos en Liga de la semana: piedra protagonista flotante y peldaños con profundidad */
.jg-gema-viva{position:relative;width:68px;height:74px;display:grid;place-items:center;filter:none}
.jg-gv-halo{position:absolute;inset:-8px;border-radius:50%;pointer-events:none;background:radial-gradient(closest-side,color-mix(in srgb,var(--g,var(--oro)) 46%,transparent),color-mix(in srgb,var(--g,var(--oro)) 12%,transparent) 60%,transparent 100%);animation:ap-respira 4.6s ease-in-out infinite}
.jg-gv-wrap{position:relative;z-index:1;width:60px;height:60px;display:grid;place-items:center;will-change:transform;animation:jg-flota 5.2s ease-in-out infinite}
.jg-gv-wrap svg{width:100%;height:100%;display:block}
.jg-gv-som{position:absolute;left:50%;bottom:1px;width:40px;height:8px;margin-left:-20px;border-radius:50%;pointer-events:none;background:radial-gradient(closest-side,rgba(0,0,0,.64),transparent);animation:jg-sombra 5.2s ease-in-out infinite}
:root[data-theme="light"] .jg-gv-som{background:radial-gradient(closest-side,rgba(45,30,10,.34),transparent)}
.jg-pel{position:relative;display:grid;justify-items:center;padding-bottom:6px}
.jg-pel-g{display:block;width:100%;will-change:transform;transition:transform .24s cubic-bezier(.2,.8,.2,1)}
.jg-pel.ya .jg-pel-g{animation:jg-flota var(--ft,5.5s) ease-in-out var(--fd,0s) infinite}
.jg-pel.act .jg-pel-g{animation:jg-flota 4.5s ease-in-out infinite}
.jg-pel.ver .jg-pel-g{transform:translate3d(0,-3px,0) scale(1.08)}
.jg-pel-s{display:block;width:62%;height:4px;margin-top:2px;border-radius:50%;background:radial-gradient(closest-side,rgba(0,0,0,.55),transparent);opacity:.45;pointer-events:none}
.jg-pel.ya .jg-pel-s,.jg-pel.act .jg-pel-s{animation:jg-sombra var(--ft,5.5s) ease-in-out var(--fd,0s) infinite}
:root[data-theme="light"] .jg-pel-s{background:radial-gradient(closest-side,rgba(45,30,10,.3),transparent)}
/* Papiro y fragmentos: escena relicario flotante con aura cálida y barrido de luz por compositor */
.jg-pp-escena{position:relative;display:grid;place-items:center;padding:12px 6px 20px;margin:2px auto 4px;width:100%;max-width:460px;contain:layout style}
.jg-pp-halo{position:absolute;inset:2% 6% 10%;border-radius:50%;pointer-events:none;background:radial-gradient(ellipse at 50% 48%,color-mix(in srgb,var(--oro-vivo) 28%,transparent),color-mix(in srgb,var(--oro) 9%,transparent) 52%,transparent 76%);opacity:.82;animation:ap-respira 5.8s ease-in-out infinite}
:root[data-theme="light"] .jg-pp-halo{background:radial-gradient(ellipse at 50% 48%,color-mix(in srgb,var(--oro) 22%,transparent),transparent 72%)}
.jg-pp{position:relative;z-index:1;width:100%;max-width:440px;margin:0 auto;aspect-ratio:2/1;border-radius:14px;overflow:hidden;will-change:transform;animation:jg-pp-flota 6.4s ease-in-out infinite}
.jg-pp svg{width:100%;height:100%;display:block;filter:none}
.jg-pp-brillo{position:absolute;inset:-10% 7%;width:34%;pointer-events:none;background:linear-gradient(108deg,transparent 14%,rgba(255,248,220,.44) 50%,transparent 86%);transform:translate3d(-130%,0,0);opacity:0;animation:jg-pp-luz 9.4s ease-in-out 1.4s infinite;will-change:transform,opacity}
.jg-pp-sombra{position:absolute;left:14%;right:14%;bottom:4px;height:14px;border-radius:50%;pointer-events:none;background:radial-gradient(closest-side,rgba(0,0,0,.62),rgba(0,0,0,.18) 56%,transparent 100%);will-change:transform,opacity;animation:jg-sombra 6.4s ease-in-out infinite}
:root[data-theme="light"] .jg-pp-sombra{background:radial-gradient(closest-side,rgba(54,36,12,.3),rgba(54,36,12,.08) 58%,transparent 100%)}
.jg-pp-prox{display:grid;grid-template-columns:42px minmax(0,1fr) auto;align-items:center;gap:10px;padding:9px 11px;border-radius:14px;border:1px solid color-mix(in srgb,var(--oro) 34%,var(--linea-2));background:radial-gradient(120% 90% at 0% 0%,color-mix(in srgb,var(--oro) 13%,transparent),transparent 70%),color-mix(in srgb,var(--hoja-2) 84%,transparent)}
.jg-pp-prox-ico{width:42px;height:42px;border-radius:11px;display:grid;place-items:center;border:1px solid color-mix(in srgb,var(--oro) 42%,transparent);background:radial-gradient(circle at 40% 32%,color-mix(in srgb,var(--oro) 24%,#1a150e),#090806 80%)}
.jg-pp-prox-ico svg{width:34px;height:34px;display:block}
.jg-pp-prox-t{display:grid;gap:2px;min-width:0}.jg-pp-prox-t small{font:600 .58rem/1.15 var(--f-ui);letter-spacing:.12em;text-transform:uppercase;color:var(--oro)}.jg-pp-prox-t b{font:600 .84rem/1.25 var(--f-ui);color:var(--tinta);text-wrap:balance}
.jg-pp-prox-n{font:600 .72rem/1.1 var(--f-ui);padding:4px 8px;border-radius:999px;color:var(--oro-vivo);border:1px solid color-mix(in srgb,var(--oro) 38%,transparent);background:color-mix(in srgb,var(--oro) 11%,transparent);white-space:nowrap;font-variant-numeric:tabular-nums}
.jg-pausa-vis .jg-pd-gema,.jg-pausa-vis .jg-pd-sombra,.jg-pausa-vis .jg-gv-wrap,.jg-pausa-vis .jg-gv-som,.jg-pausa-vis .jg-gv-halo,.jg-pausa-vis .jg-pel-g,.jg-pausa-vis .jg-pel-s,.jg-pausa-vis .jg-pp,.jg-pausa-vis .jg-pp-sombra,.jg-pausa-vis .jg-pp-halo,.jg-pausa-vis .jg-pp-brillo,
html.con-modal #vista .jg-pd-gema,html.con-modal #vista .jg-pd-sombra,html.con-modal #vista .jg-gv-wrap,html.con-modal #vista .jg-gv-som,html.con-modal #vista .jg-gv-halo,html.con-modal #vista .jg-pel-g,html.con-modal #vista .jg-pel-s,html.con-modal #vista .jg-pp,html.con-modal #vista .jg-pp-sombra,html.con-modal #vista .jg-pp-halo,html.con-modal #vista .jg-pp-brillo,
html.tab-oculta .jg-pd-gema,html.tab-oculta .jg-pd-sombra,html.tab-oculta .jg-gv-wrap,html.tab-oculta .jg-gv-som,html.tab-oculta .jg-gv-halo,html.tab-oculta .jg-pel-g,html.tab-oculta .jg-pel-s,html.tab-oculta .jg-pp,html.tab-oculta .jg-pp-sombra,html.tab-oculta .jg-pp-halo,html.tab-oculta .jg-pp-brillo{animation-play-state:paused!important}
@media (prefers-reduced-motion:reduce){.jg-pd-gema,.jg-pd-sombra,.jg-gv-wrap,.jg-gv-som,.jg-gv-halo,.jg-pel-g,.jg-pel-s,.jg-pp,.jg-pp-sombra,.jg-pp-halo,.jg-pp-brillo{animation:none!important}}
html[data-mov="no"] .jg-pd-gema,html[data-mov="no"] .jg-pd-sombra,html[data-mov="no"] .jg-gv-wrap,html[data-mov="no"] .jg-gv-som,html[data-mov="no"] .jg-gv-halo,html[data-mov="no"] .jg-pel-g,html[data-mov="no"] .jg-pel-s,html[data-mov="no"] .jg-pp,html[data-mov="no"] .jg-pp-sombra,html[data-mov="no"] .jg-pp-halo,html[data-mov="no"] .jg-pp-brillo{animation:none!important}
/* Progresión de Poder: comparativa 3 tiempos (Antes → Hoy → Nivel siguiente), rutas de salto y delta en chipPoder */
.ap-pd-delta{font:700 .62rem/1 var(--f-ui);padding:2.5px 6px;border-radius:999px;background:color-mix(in srgb,#6fbf8f 22%,transparent);color:#9be7b6;border:1px solid color-mix(in srgb,#6fbf8f 48%,transparent);font-variant-numeric:tabular-nums;white-space:nowrap}
:root[data-theme="light"] .ap-pd-delta{color:#1b683c;background:color-mix(in srgb,#6fbf8f 18%,transparent)}
.ap-vp-evo{display:grid;gap:9px;padding:12px;border-radius:16px;border:1px solid color-mix(in srgb,var(--oro) 32%,var(--linea-2));background:radial-gradient(120% 95% at 100% 0%,color-mix(in srgb,var(--oro) 11%,transparent),transparent 66%),color-mix(in srgb,var(--hoja-2) 84%,transparent);contain:layout style}
.ap-vp-3t{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}
.ap-vp-3c{display:grid;justify-items:center;align-content:center;gap:2px;padding:9px 6px;border-radius:12px;text-align:center;border:1px solid var(--linea-2);background:color-mix(in srgb,var(--hoja) 76%,transparent);min-width:0}
.ap-vp-3c.hoy{border-color:color-mix(in srgb,var(--oro) 58%,transparent);background:radial-gradient(110% 90% at 50% 0%,color-mix(in srgb,var(--oro) 16%,transparent),transparent 72%),color-mix(in srgb,var(--hoja) 88%,transparent)}
.ap-vp-3c.sig{border-color:color-mix(in srgb,#7cb8f2 48%,transparent);background:radial-gradient(110% 90% at 50% 0%,color-mix(in srgb,#7cb8f2 14%,transparent),transparent 72%),color-mix(in srgb,var(--hoja) 88%,transparent)}
.ap-vp-3c small{font:600 .56rem/1.15 var(--f-ui);letter-spacing:.1em;text-transform:uppercase;color:var(--tenue)}
.ap-vp-3c b{font:600 1.15rem/1.1 var(--f-display);color:var(--tinta);font-variant-numeric:lining-nums tabular-nums}
.ap-vp-3c.hoy b{color:var(--oro-vivo)}.ap-vp-3c.sig b{color:var(--vp-c2)}
.ap-vp-3c em{font:600 .62rem/1.15 var(--f-ui);font-style:normal;color:#7cd99e;font-variant-numeric:tabular-nums}
:root[data-theme="light"] .ap-vp-3c em{color:#1d6f42}
.ap-vp-3c span{font:400 .6rem/1.2 var(--f-ui);color:var(--tenue);text-wrap:balance}
.ap-vp-hist{display:flex;flex-wrap:wrap;gap:5px;justify-content:center}
.ap-vp-hchip{font:500 .64rem/1.1 var(--f-ui);padding:4px 8px;border-radius:999px;border:1px solid var(--linea-2);background:color-mix(in srgb,var(--hoja) 74%,transparent);color:var(--tinta-2);font-variant-numeric:tabular-nums}
.ap-vp-hchip b{color:var(--oro-vivo);font-weight:600}
.ap-vp-rutas{list-style:none;margin:0;padding:0;display:grid;gap:6px}
.ap-vp-ruta{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:8px;padding:8px 10px;border-radius:12px;border:1px solid var(--linea-2);background:color-mix(in srgb,var(--hoja) 78%,transparent)}
.ap-vp-ruta.cerca{border-color:color-mix(in srgb,var(--oro) 55%,transparent);background:linear-gradient(90deg,color-mix(in srgb,var(--oro) 12%,transparent),color-mix(in srgb,var(--hoja) 82%,transparent) 68%)}
.ap-vp-ruta b{display:block;font:600 .76rem/1.2 var(--f-ui);color:var(--tinta)}
.ap-vp-ruta small{display:block;font:400 .68rem/1.3 var(--f-ui);color:var(--tinta-2);margin-top:2px}
.ap-vp-rgan{font:700 .74rem/1 var(--f-display);padding:4px 8px;border-radius:999px;color:var(--oro-vivo);border:1px solid color-mix(in srgb,var(--oro) 42%,transparent);background:color-mix(in srgb,var(--oro) 12%,transparent);white-space:nowrap;font-variant-numeric:lining-nums tabular-nums}
.ap-vp-etprox{margin:0;padding:8px 10px;border-radius:11px;border:1px dashed color-mix(in srgb,var(--vp-et,var(--oro)) 44%,transparent);background:color-mix(in srgb,var(--vp-et,var(--oro)) 7%,transparent);font:400 .73rem/1.4 var(--f-ui);color:var(--tinta-2)}
.ap-vp-etprox b{color:var(--oro-vivo)}
@media (max-width:350px){.ap-vp-3t{grid-template-columns:1fr}}
/* Salas abiertas: barra superior con contador, refresco y controles accesibles estando ya en una sala */
.jg-salas-cab{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;margin:2px 0 6px}
.jg-salas-cab .jg-salas-n{margin:0}
.jg-salas-ref{font-size:.72rem;padding:4px 9px;min-height:28px}
.jg-sala-est{display:inline-block;margin-left:6px;padding:1.5px 6px;border-radius:999px;font:600 .62rem/1.2 var(--f-ui);letter-spacing:.04em;color:var(--oro-vivo);background:color-mix(in srgb,var(--oro) 16%,transparent);border:1px solid color-mix(in srgb,var(--oro) 34%,transparent);vertical-align:1px}
.jg-sala-extra{margin-top:10px;border-top:1px solid var(--linea-2);padding-top:9px}
.jg-sala-extra summary{cursor:pointer;font:500 .8rem/1.3 var(--f-ui);color:var(--oro);list-style:none;display:flex;align-items:center;justify-content:space-between;gap:8px}
.jg-sala-extra summary::-webkit-details-marker{display:none}
.jg-sala-extra summary::after{content:"▾";opacity:.75;transition:transform .2s}
.jg-sala-extra[open] summary::after{transform:rotate(180deg)}
.jg-sala-extra-c{display:grid;gap:10px;margin-top:10px}
/* Ficha pública espectacular (Relicario Astral), nombres de sala y batalla táctica contra El Coloso (B4/B5) */
.jg-jug-btn{all:unset;display:inline;font:600 inherit var(--f-ui);color:var(--tinta);cursor:pointer;border-bottom:1px dotted color-mix(in srgb,var(--oro) 50%,transparent);transition:color .18s,border-color .18s}
.jg-jug-btn:hover,.jg-jug-btn:focus-visible{color:var(--oro-vivo);border-bottom-color:var(--oro-vivo)}
.jg-jug-btn:focus-visible{outline:2px solid var(--oro-vivo);outline-offset:2px;border-radius:3px}
.jg-jp{display:grid;gap:14px;padding:2px 0 4px}
.jg-jp-hero{position:relative;overflow:hidden;display:grid;justify-items:center;gap:10px;padding:20px 16px 16px;border-radius:20px;text-align:center;border:1px solid color-mix(in srgb,var(--et,var(--oro)) 48%,var(--linea-2));background:radial-gradient(95% 75% at 50% 8%,color-mix(in srgb,var(--et,var(--oro)) 22%,transparent),transparent 72%),radial-gradient(65% 55% at 85% 95%,color-mix(in srgb,var(--oro) 12%,transparent),transparent 70%),linear-gradient(180deg,color-mix(in srgb,var(--hoja-2) 92%,transparent),color-mix(in srgb,var(--hoja) 96%,transparent));box-shadow:inset 0 1px 0 color-mix(in srgb,var(--oro-vivo) 30%,transparent),0 18px 36px -22px rgba(0,0,0,.72)}
.jg-jp-hero::before{content:"";position:absolute;inset:-40% -25%;pointer-events:none;background:radial-gradient(circle at 50% 50%,color-mix(in srgb,var(--et,var(--oro)) 14%,transparent),transparent 54%);opacity:.85;animation:jp-halo 7s ease-in-out infinite;will-change:transform,opacity}
.jg-jp-hero::after{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(115deg,transparent 34%,color-mix(in srgb,var(--oro-vivo) 12%,transparent) 50%,transparent 66%);transform:translate3d(-120%,0,0);animation:jp-brillo 6.5s ease-in-out infinite;will-change:transform}
@keyframes jp-halo{0%,100%{transform:scale(.96);opacity:.62}50%{transform:scale(1.06);opacity:.96}}
@keyframes jp-brillo{0%,62%{transform:translate3d(-120%,0,0)}100%{transform:translate3d(130%,0,0)}}
.jg-jp-emb-wrap{position:relative;width:96px;height:96px;display:grid;place-items:center;z-index:1}
.jg-jp-aro{position:absolute;inset:0;border-radius:50%;border:1px dashed color-mix(in srgb,var(--et,var(--oro)) 54%,transparent);opacity:.7;animation:jp-gira 26s linear infinite;will-change:transform}
.jg-jp-aro.b{inset:8px;border-style:solid;border-color:color-mix(in srgb,var(--et,var(--oro)) 28%,transparent);animation-direction:reverse;animation-duration:38s}
@keyframes jp-gira{to{transform:rotate(360deg)}}
.jg-jp-emb{position:relative;z-index:1;width:74px;height:74px;display:grid;place-items:center;filter:drop-shadow(0 8px 18px color-mix(in srgb,var(--et,var(--oro)) 32%,rgba(0,0,0,.6)))}
.jg-jp-emb .jg-e{width:70px;height:70px;font-size:1.95rem}
.jg-jp-id{position:relative;z-index:1;min-width:0;display:grid;gap:3px}
.jg-jp-id h3{margin:0;font:600 1.5rem/1.1 var(--f-display);color:var(--tinta);letter-spacing:.02em;overflow-wrap:anywhere}
.jg-jp-id .jg-mini{margin:0;color:var(--tinta-2)}
.jg-jp-hero .jg-chips{position:relative;z-index:1;justify-content:center;margin:0}
.jg-jp-track{position:relative;z-index:1;width:100%;display:grid;gap:6px;margin-top:4px;padding-top:10px;border-top:1px solid color-mix(in srgb,var(--et,var(--oro)) 22%,var(--linea-2))}
.jg-jp-tr-cab{display:flex;align-items:baseline;justify-content:space-between;gap:8px;font:500 .72rem/1.2 var(--f-ui);color:var(--tinta-2)}
.jg-jp-tr-cab b{font:600 .86rem/1 var(--f-display);color:var(--oro-vivo);font-variant-numeric:tabular-nums}
.jg-jp-bar{height:7px;border-radius:999px;background:color-mix(in srgb,var(--hoja-3) 86%,transparent);overflow:hidden;border:1px solid color-mix(in srgb,var(--et,var(--oro)) 26%,transparent)}
.jg-jp-bar i{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,var(--oro-2),var(--et,var(--oro-vivo)))}
.jg-jp-pasos{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:4px;font:600 .62rem/1.2 var(--f-ui);letter-spacing:.08em;color:var(--tenue)}
.jg-jp-pasos span{padding:2px 0;border-radius:6px;text-align:center;border:1px solid transparent}
.jg-jp-pasos span.on{color:var(--et,var(--oro-vivo));border-color:color-mix(in srgb,var(--et,var(--oro)) 38%,transparent);background:color-mix(in srgb,var(--et,var(--oro)) 10%,transparent)}
:root[data-theme="light"] .jg-jp-pasos span.on{color:var(--et-l,var(--oro-vivo));border-color:color-mix(in srgb,var(--et-l,var(--oro)) 42%,transparent);background:color-mix(in srgb,var(--et-l,var(--oro)) 10%,transparent)}
:root[data-theme="light"] .jg-jp-hero{border-color:color-mix(in srgb,var(--et-l,var(--oro)) 46%,var(--linea-2));background:radial-gradient(95% 75% at 50% 8%,color-mix(in srgb,var(--et-l,var(--oro)) 15%,transparent),transparent 72%),linear-gradient(180deg,#fffdf8,#f5eee1);box-shadow:inset 0 1px 0 rgba(255,255,255,.9),0 16px 32px -22px rgba(60,45,20,.3)}
.jg-jp-vivo{display:grid;grid-template-columns:10px minmax(0,1fr) auto;align-items:center;gap:10px;padding:10px 13px;border-radius:14px;border:1px solid color-mix(in srgb,#6fbf8f 48%,var(--linea-2));background:linear-gradient(90deg,color-mix(in srgb,#6fbf8f 14%,var(--hoja-2)),color-mix(in srgb,var(--hoja-2) 92%,transparent));font:400 .82rem/1.35 var(--f-ui);color:var(--tinta);box-shadow:0 8px 20px -14px rgba(0,0,0,.5)}
.jg-jp-dot{width:9px;height:9px;border-radius:50%;background:#79d99f;box-shadow:0 0 8px rgba(121,217,159,.8)}
.jg-jp-grid{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}
.jg-jp-grid li{position:relative;display:grid;justify-items:center;align-content:center;gap:3px;padding:13px 8px 11px;border-radius:15px;text-align:center;border:1px solid color-mix(in srgb,var(--oro) 24%,var(--linea-2));background:linear-gradient(180deg,color-mix(in srgb,var(--hoja-2) 92%,transparent),color-mix(in srgb,var(--hoja) 96%,transparent));box-shadow:inset 0 1px 0 color-mix(in srgb,var(--oro-vivo) 22%,transparent),0 12px 24px -18px rgba(0,0,0,.68);min-width:0;transition:transform .25s cubic-bezier(.2,.8,.2,1),border-color .2s}
.jg-jp-grid li:hover{transform:translate3d(0,-2px,0);border-color:color-mix(in srgb,var(--oro) 54%,transparent)}
.jg-jp-ico{width:22px;height:22px;display:grid;place-items:center;border-radius:50%;background:color-mix(in srgb,var(--oro) 13%,transparent);color:var(--oro-vivo);margin-bottom:2px}
.jg-jp-ico svg{width:13px;height:13px}
.jg-jp-grid b{font:600 1.12rem/1.15 var(--f-display);color:var(--oro-vivo);font-variant-numeric:lining-nums tabular-nums}
.jg-jp-grid span{font:600 .67rem/1.2 var(--f-ui);letter-spacing:.05em;color:var(--tinta)}
.jg-jp-grid small{font:400 .63rem/1.2 var(--f-ui);color:var(--tenue);text-wrap:balance}
.jg-jp-gemas{display:grid;grid-template-columns:repeat(6,6px);justify-content:center;gap:5px;margin-top:4px}
.jg-jp-gemas i{width:6px;height:6px;border-radius:1.8px;transform:rotate(45deg);background:var(--hoja-3);border:1px solid var(--linea-2)}
.jg-jp-gemas i.on{background:var(--oro-vivo);border-color:var(--oro);box-shadow:0 0 6px color-mix(in srgb,var(--oro-vivo) 65%,transparent)}
.jg-jp-pie{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px 12px;padding:10px 13px;border-radius:14px;border:1px solid var(--linea-2);background:color-mix(in srgb,var(--hoja-2) 72%,transparent);font:400 .75rem/1.35 var(--f-ui);color:var(--tinta-2)}
.jg-jp-pie b{color:var(--oro-vivo);font-weight:600}
.jg-jp-priv{margin:8px 0;text-align:center}
.jg-jp-et{border-color:color-mix(in srgb,var(--et,var(--oro)) 55%,transparent);color:var(--et,var(--oro-vivo))}
:root[data-theme="light"] .jg-jp-et{border-color:color-mix(in srgb,var(--et-l,var(--oro-vivo)) 48%,transparent);background:color-mix(in srgb,var(--et-l,var(--oro)) 10%,transparent);color:var(--et-l,var(--oro-vivo))}
@media (max-width:430px){.jg-jp-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
.jg-qz-dif{justify-self:center;margin:0 auto 2px;padding:4px 11px;border-radius:999px;font:600 .66rem/1.15 var(--f-ui);letter-spacing:.1em;text-transform:uppercase;border:1px solid color-mix(in srgb,var(--oro) 44%,transparent);background:color-mix(in srgb,var(--oro) 12%,transparent);color:var(--oro-vivo)}
.jg-qz-dif.d2{border-color:color-mix(in srgb,#7cb8f2 52%,transparent);background:color-mix(in srgb,#7cb8f2 12%,transparent);color:#9ccbff}
.jg-qz-dif.d3{border-color:color-mix(in srgb,#ff7d93 52%,transparent);background:color-mix(in srgb,#ff7d93 12%,transparent);color:#ff9dad}
:root[data-theme="light"] .jg-qz-dif.d2{color:#1f5894}:root[data-theme="light"] .jg-qz-dif.d3{color:#a11c36}
.ap-reasig-nota{margin:8px 0 0;text-align:center}
.jg-sala-nom{display:grid;gap:6px;padding:10px 12px;border-radius:13px;border:1px solid var(--linea-2);background:color-mix(in srgb,var(--hoja-2) 72%,transparent)}
.jg-sala-nom-cab{display:flex;align-items:baseline;justify-content:space-between;gap:8px;font:600 .72rem/1.2 var(--f-ui);letter-spacing:.08em;text-transform:uppercase;color:var(--oro)}
.jg-sala-nom-cab small{font-weight:400;text-transform:none;letter-spacing:0;color:var(--tenue)}
/* B4 + B5 · El Coloso de la Tradición — Santuario Chiaroscuro Volumétrico y Controles Tácticos de Reliquia (Neon, 23-nov-2026) */
.jg-col-arena{display:grid;gap:16px}
.jg-col-prev{position:relative;overflow:hidden;border-radius:14px;aspect-ratio:16/7.6;max-height:190px;background:#050506;border:1px solid color-mix(in srgb,var(--oro) 38%,transparent);box-shadow:inset 0 0 0 1px rgba(255,235,176,.08),0 14px 30px -18px rgba(0,0,0,.85)}
.jg-col-prev img{width:100%;height:100%;object-fit:cover;object-position:50% 34%;display:block;opacity:.92;animation:col-respira 10s ease-in-out infinite;will-change:transform,opacity}
.jg-col-prev::after{content:"";position:absolute;inset:0;pointer-events:none;background:radial-gradient(85% 75% at 50% 36%,transparent 35%,rgba(5,5,6,.72) 100%),linear-gradient(180deg,rgba(5,5,6,.18) 0%,transparent 36%,rgba(5,5,6,.86) 100%)}
.jg-col-prev-cap{position:absolute;left:12px;right:12px;bottom:10px;z-index:2;display:flex;align-items:flex-end;justify-content:space-between;gap:8px}
.jg-col-prev-cap strong{font:500 clamp(1rem,3.6vw,1.2rem)/1.15 var(--f-display);color:#f7f1e4;text-shadow:0 2px 12px rgba(0,0,0,.95)}
.jg-col-prev-cap span{font:600 .62rem/1 var(--f-ui);letter-spacing:.12em;text-transform:uppercase;color:#f4dea8;padding:4px 8px;border-radius:999px;background:rgba(12,10,8,.76);border:1px solid rgba(212,175,105,.46);white-space:nowrap}
.jg-col-escena{position:relative;overflow:hidden;display:grid;border-radius:22px;border:1px solid color-mix(in srgb,var(--oro) 58%,rgba(255,232,168,.2));background:linear-gradient(180deg,#050506 0%,#0b0a09 62%,#0f0d0a 100%);color:#f6f0e4;box-shadow:inset 0 1px 0 rgba(255,236,184,.22),inset 0 0 0 1px rgba(212,175,105,.12),0 28px 60px -28px rgba(0,0,0,.9)}
.jg-col-stage{position:relative;width:100%;aspect-ratio:16/10;min-height:224px;max-height:410px;overflow:hidden;background:#050506;isolation:isolate}
@media (max-width:520px){.jg-col-stage{aspect-ratio:16/11.4;min-height:216px}}
.jg-col-art-w{position:absolute;inset:0;will-change:transform}
.jg-col-art-w.golpe{animation:col-sacude .44s cubic-bezier(.2,.8,.2,1)}
.jg-col-art-w.caido .jg-col-art{animation:none;opacity:.52;filter:saturate(.28) brightness(.72)}
.jg-col-art{position:absolute;inset:-4% -3%;width:106%;height:108%;object-fit:cover;object-position:50% 22%;display:block;pointer-events:none;user-select:none;animation:col-respira 9.5s ease-in-out infinite;will-change:transform,opacity}
.jg-col-velo{position:absolute;inset:-12% -24%;pointer-events:none;will-change:transform,opacity}
.jg-col-velo.a{background:radial-gradient(44% 58% at 24% 64%,rgba(5,5,6,.82) 0%,rgba(8,7,6,.44) 48%,transparent 76%),radial-gradient(40% 52% at 78% 54%,rgba(5,5,6,.76) 0%,rgba(8,7,6,.36) 46%,transparent 74%);animation:col-bruma-a 16s ease-in-out infinite}
.jg-col-velo.b{background:radial-gradient(48% 50% at 58% 72%,rgba(4,4,5,.72) 0%,rgba(9,8,7,.28) 46%,transparent 74%),radial-gradient(34% 44% at 38% 42%,rgba(218,162,74,.11) 0%,transparent 70%);animation:col-bruma-b 21s ease-in-out infinite}
.jg-col-fx{position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none;z-index:2}
.jg-col-vig{position:absolute;inset:0;z-index:3;pointer-events:none;background:radial-gradient(76% 68% at 50% 40%,transparent 32%,rgba(5,5,6,.68) 100%),linear-gradient(180deg,rgba(5,5,6,.68) 0%,rgba(5,5,6,.1) 24%,transparent 48%,rgba(8,7,6,.56) 78%,#0b0a09 100%)}
.jg-col-top{position:absolute;top:12px;left:12px;right:12px;z-index:4;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:6px 8px}
.jg-col-badge{display:inline-flex;align-items:center;gap:7px;padding:5px 11px;border-radius:999px;font:600 .62rem/1 var(--f-ui);letter-spacing:.13em;text-transform:uppercase;color:#f6e2ac;background:rgba(10,9,8,.76);border:1px solid rgba(212,175,105,.48);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}
.jg-col-badge.tenue{color:#d8d0c0;border-color:rgba(240,234,222,.2)}
.jg-col-premio{display:flex;align-items:center;justify-content:center;gap:8px;flex-wrap:wrap;padding:8px 12px;border-radius:12px;background:linear-gradient(90deg,rgba(212,175,105,.08),rgba(244,207,115,.14),rgba(212,175,105,.08));border:1px solid rgba(212,175,105,.32);font:500 .75rem/1.3 var(--f-ui);color:#e9dfc9;text-align:center}
.jg-col-premio b{color:#fae3a7;font-weight:600}
.jg-col-tit-wrap{position:absolute;left:16px;right:16px;bottom:10px;z-index:4;text-align:center;display:grid;gap:3px;pointer-events:none}
.jg-col-tit-wrap h2{margin:0;font:500 clamp(1.38rem,4.6vw,1.92rem)/1.1 var(--f-display);color:#fbf5e9;letter-spacing:.03em;text-shadow:0 3px 22px rgba(0,0,0,.95)}
.jg-col-fase{font:600 .66rem/1.2 var(--f-ui);letter-spacing:.2em;text-transform:uppercase;color:#dfb96e;text-shadow:0 2px 12px rgba(0,0,0,.95)}
.jg-col-dano{position:absolute;top:38%;left:50%;transform:translate3d(-50%,0,0);font:700 clamp(1.7rem,6vw,2.35rem)/1 var(--f-display);color:#fff0bd;text-shadow:0 0 22px rgba(245,188,78,.92),0 4px 16px rgba(0,0,0,.95);pointer-events:none;z-index:5;animation:col-dano 1.35s cubic-bezier(.18,.82,.24,1) forwards}
@keyframes col-respira{0%,100%{transform:scale(1.01) translate3d(0,0,0);opacity:.9}50%{transform:scale(1.055) translate3d(0,-4px,0);opacity:1}}
@keyframes col-bruma-a{0%,100%{transform:translate3d(-3%,1%,0) scale(1);opacity:.82}50%{transform:translate3d(4%,-2%,0) scale(1.06);opacity:.54}}
@keyframes col-bruma-b{0%,100%{transform:translate3d(4%,0,0) scale(1.04);opacity:.56}50%{transform:translate3d(-4%,2%,0) scale(.98);opacity:.84}}
@keyframes col-sacude{0%{transform:translate3d(0,0,0)}18%{transform:translate3d(-9px,-4px,0) scale(1.02)}42%{transform:translate3d(8px,3px,0) scale(.99)}68%{transform:translate3d(-5px,1px,0)}100%{transform:translate3d(0,0,0)}}
@keyframes col-dano{0%{opacity:0;transform:translate3d(-50%,16px,0) scale(.72)}20%{opacity:1;transform:translate3d(-50%,-12px,0) scale(1.16)}100%{opacity:0;transform:translate3d(-50%,-62px,0) scale(.92)}}
.jg-col-hud{position:relative;z-index:4;display:grid;gap:12px;padding:12px 16px 16px;background:linear-gradient(180deg,#0b0a09 0%,#12100d 100%);border-top:1px solid rgba(212,175,105,.18)}
.jg-col-hp{width:100%;display:grid;gap:7px}
.jg-col-hp-cab{display:flex;flex-wrap:wrap;align-items:baseline;justify-content:space-between;gap:6px 10px;font:500 .78rem/1.2 var(--f-ui);color:#d7cfbf}
.jg-col-hp-cab b{font:600 1.12rem/1 var(--f-display);color:#f7e2aa;font-variant-numeric:lining-nums tabular-nums;letter-spacing:.02em}
.jg-col-hp-bar{position:relative;height:14px;border-radius:999px;background:linear-gradient(180deg,#1a1612,#0c0a08);overflow:hidden;border:1px solid rgba(212,175,105,.46);padding:2px;box-shadow:inset 0 2px 6px rgba(0,0,0,.85),0 0 16px -6px rgba(235,172,72,.35)}
.jg-col-hp-bar>i{position:relative;display:block;height:100%;border-radius:inherit;overflow:hidden;background:linear-gradient(90deg,#8f241c 0%,#cc5a28 38%,#e8a23c 78%,#ffe69c 100%);box-shadow:0 0 14px rgba(238,164,62,.55);transition:width .55s cubic-bezier(.2,.8,.2,1)}
.jg-col-hp-bar>i::after{content:"";position:absolute;inset:0;background:linear-gradient(105deg,transparent 28%,rgba(255,250,232,.46) 50%,transparent 72%);transform:translate3d(-120%,0,0);animation:col-hp-luz 4.8s ease-in-out infinite;will-change:transform}
@keyframes col-hp-luz{0%,42%{transform:translate3d(-120%,0,0)}100%{transform:translate3d(140%,0,0)}}
.jg-col-hp-m{position:absolute;top:0;bottom:0;width:1.5px;background:rgba(5,5,6,.72);box-shadow:1px 0 0 rgba(255,232,168,.24);pointer-events:none;z-index:2}
.jg-col-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
@media (max-width:540px){.jg-col-stats{grid-template-columns:repeat(2,minmax(0,1fr))}}
.jg-col-st{display:grid;gap:2px;padding:8px 10px;border-radius:12px;text-align:center;background:rgba(255,244,214,.04);border:1px solid rgba(212,175,105,.2)}
.jg-col-st b{font:600 .98rem/1.15 var(--f-display);color:#f7e2aa;font-variant-numeric:lining-nums tabular-nums}
.jg-col-st span{font:500 .66rem/1.2 var(--f-ui);letter-spacing:.06em;text-transform:uppercase;color:#b8afa0}
.jg-col-pre{display:flex;align-items:flex-start;gap:10px;padding:11px 13px;border-radius:14px;border:1px solid color-mix(in srgb,var(--oro) 44%,transparent);background:linear-gradient(135deg,color-mix(in srgb,var(--oro) 13%,var(--hoja-2)),color-mix(in srgb,var(--hoja-2) 94%,transparent));font:400 .8rem/1.48 var(--f-ui);color:var(--tinta-2)}
.jg-col-pre b{color:var(--oro-vivo);font-weight:600}
.jg-col-pre-ico{width:22px;height:22px;border-radius:50%;flex:none;display:grid;place-items:center;margin-top:1px;background:color-mix(in srgb,var(--oro) 18%,transparent);border:1px solid color-mix(in srgb,var(--oro) 48%,transparent);color:var(--oro-vivo)}
.jg-col-pre-ico svg{width:13px;height:13px}
.jg-col-panel{display:grid;gap:14px;padding:16px;border-radius:20px;border:1px solid color-mix(in srgb,var(--oro) 44%,var(--linea-2));background:radial-gradient(110% 80% at 50% 0%,color-mix(in srgb,var(--oro) 11%,transparent),transparent 65%),linear-gradient(180deg,color-mix(in srgb,var(--hoja-2) 95%,transparent),color-mix(in srgb,var(--hoja) 98%,transparent));box-shadow:inset 0 1px 0 color-mix(in srgb,var(--oro-vivo) 24%,transparent),0 18px 36px -24px rgba(0,0,0,.78)}
.jg-col-cg-cab{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px 12px}
.jg-col-cg-tit{display:grid;gap:2px}
.jg-col-cg-tit span{font:600 .66rem/1.1 var(--f-ui);letter-spacing:.16em;text-transform:uppercase;color:var(--oro)}
.jg-col-cg-tit b{font:600 1.05rem/1.15 var(--f-display);color:var(--tinta)}
.jg-col-cg-sub{display:flex;flex-wrap:wrap;align-items:center;gap:6px;font:500 .74rem/1.2 var(--f-ui);color:var(--tenue)}
.jg-col-mult{padding:4px 9px;border-radius:999px;font:600 .72rem/1 var(--f-ui);color:var(--oro-vivo);background:color-mix(in srgb,var(--oro) 15%,transparent);border:1px solid color-mix(in srgb,var(--oro) 46%,transparent)}
.jg-col-crist{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:8px;padding:8px 10px;border-radius:14px;background:color-mix(in srgb,var(--hoja) 76%,transparent);border:1px solid var(--linea-2)}
.jg-col-cg-c{position:relative;height:26px;display:grid;place-items:center}
.jg-col-cg-c i{position:relative;display:block;width:16px;height:16px;border-radius:3.5px;transform:rotate(45deg);background:var(--hoja-3);border:1.5px solid color-mix(in srgb,var(--linea) 70%,transparent);transition:transform .28s cubic-bezier(.2,.8,.2,1),background-color .28s,border-color .28s,box-shadow .28s}
.jg-col-cg-c.on i{background:linear-gradient(135deg,#fff3c8 0%,var(--oro-vivo) 44%,var(--oro) 100%);border-color:#fff2c6;box-shadow:0 0 14px color-mix(in srgb,var(--oro-vivo) 72%,transparent),inset 0 0 4px rgba(255,255,255,.72);transform:rotate(45deg) scale(1.06)}
:root[data-theme="light"] .jg-col-cg-c.on i{background:linear-gradient(135deg,#f6d98a 0%,#c79234 55%,#8f6116 100%);border-color:#754d0c;box-shadow:0 0 10px rgba(152,102,24,.4)}
.jg-col-habs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:11px}
@media (max-width:640px){.jg-col-habs{grid-template-columns:1fr}}
.jg-col-hab{--hc:#d79b5b;--hc-l:#8c5418;position:relative;overflow:hidden;display:grid;align-content:space-between;gap:10px;text-align:left;padding:15px 14px 13px;border-radius:17px;border:1px solid color-mix(in srgb,var(--hc) 46%,var(--linea-2));background:radial-gradient(120% 80% at 10% 0%,color-mix(in srgb,var(--hc) 16%,transparent),transparent 62%),linear-gradient(180deg,color-mix(in srgb,var(--hoja-2) 96%,transparent),color-mix(in srgb,var(--hoja) 98%,transparent));color:var(--tinta);cursor:pointer;box-shadow:inset 0 1px 0 color-mix(in srgb,var(--hc) 34%,transparent),0 14px 28px -20px rgba(0,0,0,.8);transition:transform .22s cubic-bezier(.2,.8,.2,1),border-color .22s,box-shadow .22s,opacity .22s}
.jg-col-hab.t2{--hc:#7eb8f0;--hc-l:#1f5894}
.jg-col-hab.t3{--hc:#f4cf73;--hc-l:#8a600e;border-color:color-mix(in srgb,var(--hc) 62%,var(--linea-2));background:radial-gradient(125% 90% at 50% 0%,color-mix(in srgb,var(--hc) 22%,transparent),transparent 66%),linear-gradient(180deg,color-mix(in srgb,var(--hoja-2) 96%,transparent),color-mix(in srgb,var(--hoja) 99%,transparent))}
:root[data-theme="light"] .jg-col-hab{border-color:color-mix(in srgb,var(--hc-l) 44%,var(--linea-2));background:radial-gradient(120% 80% at 10% 0%,color-mix(in srgb,var(--hc-l) 11%,transparent),transparent 64%),linear-gradient(180deg,#fffdf8,#f4ecde);box-shadow:inset 0 1px 0 rgba(255,255,255,.9),0 12px 24px -18px rgba(48,34,14,.28)}
.jg-col-hab.t3.listo::after{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(112deg,transparent 30%,color-mix(in srgb,var(--hc) 22%,transparent) 50%,transparent 70%);transform:translate3d(-120%,0,0);animation:jp-brillo 5.2s ease-in-out infinite;will-change:transform}
.jg-col-hab:hover:not(:disabled){transform:translate3d(0,-3px,0);border-color:var(--hc);box-shadow:inset 0 1px 0 color-mix(in srgb,var(--hc) 52%,transparent),0 18px 34px -18px color-mix(in srgb,var(--hc) 42%,rgba(0,0,0,.85))}
.jg-col-hab:active:not(:disabled){transform:scale(.975)}
.jg-col-hab:focus-visible{outline:2px solid var(--oro-vivo);outline-offset:2px}
.jg-col-hab:disabled{opacity:.44;cursor:not-allowed;filter:saturate(.65)}
.jg-col-hab-top{display:grid;grid-template-columns:42px minmax(0,1fr);align-items:center;gap:10px}
.jg-col-sig{width:42px;height:42px;border-radius:12px;display:grid;place-items:center;color:var(--hc);background:radial-gradient(circle at 35% 25%,color-mix(in srgb,var(--hc) 24%,transparent),color-mix(in srgb,var(--hoja) 88%,transparent));border:1px solid color-mix(in srgb,var(--hc) 46%,transparent);box-shadow:inset 0 1px 0 color-mix(in srgb,var(--hc) 35%,transparent)}
:root[data-theme="light"] .jg-col-sig{color:var(--hc-l);border-color:color-mix(in srgb,var(--hc-l) 45%,transparent)}
.jg-col-sig svg{width:24px;height:24px;display:block}
.jg-col-hab-id{display:grid;gap:3px;min-width:0}
.jg-col-hab-id b{font:600 1.06rem/1.12 var(--f-display);color:var(--tinta)}
.jg-col-hab-cost{display:inline-flex;align-items:center;gap:5px;width:fit-content;font:600 .64rem/1 var(--f-ui);letter-spacing:.08em;text-transform:uppercase;color:var(--hc)}
:root[data-theme="light"] .jg-col-hab-cost{color:var(--hc-l)}
.jg-col-hab-dots{display:inline-flex;gap:3px}
.jg-col-hab-dots i{width:5.5px;height:5.5px;border-radius:1.2px;transform:rotate(45deg);background:currentColor}
.jg-col-hab-mid{display:flex;align-items:baseline;justify-content:space-between;gap:8px;padding:8px 10px;border-radius:11px;background:color-mix(in srgb,var(--hoja) 72%,transparent);border:1px solid color-mix(in srgb,var(--hc) 24%,var(--linea-2))}
.jg-col-hab-dmg{font:600 1.24rem/1 var(--f-display);color:var(--oro-vivo);font-variant-numeric:lining-nums tabular-nums}
.jg-col-hab-ef{font:600 .65rem/1.1 var(--f-ui);letter-spacing:.06em;text-transform:uppercase;color:var(--hc)}
:root[data-theme="light"] .jg-col-hab-ef{color:var(--hc-l)}
.jg-col-hab-desc{font:400 .75rem/1.38 var(--f-ui);color:var(--tinta-2)}
.jg-col-hab-go{display:flex;align-items:center;justify-content:space-between;gap:6px;padding-top:8px;border-top:1px solid color-mix(in srgb,var(--linea-2) 85%,transparent);font:600 .7rem/1 var(--f-ui);letter-spacing:.1em;text-transform:uppercase;color:var(--hc)}
:root[data-theme="light"] .jg-col-hab-go{color:var(--hc-l)}
.jg-col-hab:disabled .jg-col-hab-go{color:var(--tenue)}
.jg-col-ens{display:grid;gap:8px;padding:15px 16px;border-radius:18px;border:1px solid color-mix(in srgb,var(--oro) 34%,var(--linea-2));background:radial-gradient(110% 90% at 0% 0%,color-mix(in srgb,var(--oro) 10%,transparent),transparent 68%),color-mix(in srgb,var(--hoja-2) 86%,transparent)}
.jg-col-ens p{margin:0;font:400 .92rem/1.55 var(--f-texto);color:var(--tinta)}
.jg-col-cita{display:grid;gap:5px;padding:10px 12px;border-radius:12px;border-left:2px solid var(--oro);background:color-mix(in srgb,var(--hoja) 84%,transparent);font:400 .88rem/1.55 var(--f-texto);color:var(--tinta)}
.jg-col-cita a{font:600 .72rem/1.2 var(--f-ui);letter-spacing:.1em;text-transform:uppercase;color:var(--oro-vivo);text-decoration:none}
.jg-col-cita a:hover{text-decoration:underline}
.jg-col-live{display:grid;gap:10px;margin-top:8px}
.jg-col-cta-row{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px 12px;margin-top:4px}
html.con-modal .jg-col-art,html.con-modal .jg-col-velo,html.con-modal .jg-col-hp-bar>i::after,html.con-modal .jg-col-hab.t3.listo::after,html.desplazando .jg-col-art,html.desplazando .jg-col-velo,html.desplazando .jg-col-prev img{animation-play-state:paused}
@media (prefers-reduced-motion:reduce){.jg-jp-hero::before,.jg-jp-hero::after,.jg-jp-aro,.jg-col-art,.jg-col-velo,.jg-col-prev img,.jg-col-hp-bar>i::after,.jg-col-hab.t3.listo::after{animation:none}}
html[data-mov="no"] .jg-jp-hero::before,html[data-mov="no"] .jg-jp-hero::after,html[data-mov="no"] .jg-jp-aro,html[data-mov="no"] .jg-col-art,html[data-mov="no"] .jg-col-velo,html[data-mov="no"] .jg-col-prev img,html[data-mov="no"] .jg-col-hp-bar>i::after,html[data-mov="no"] .jg-col-hab.t3.listo::after{animation:none}
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
    // P14 (BiEx, 11-nov-2026): al pasar de una sección a otra la página no brinca: la nueva conserva por un momento la altura
    // de la anterior (el pie no sube mientras llegan sus datos) y entra con un fundido breve, solo opacidad
    const kSec = claveVista(), cambia = S.marcoK !== kSec; S.marcoK = kSec;
    const ant = cont.firstElementChild, alto = cambia && ant ? Math.round(ant.getBoundingClientRect().height) : 0;
    const nueva = h("div", { class: "in" }, h("section", { class: "panel jg" }, ...hijos));
    cont.replaceChildren(nueva);
    if (alto > 240 && !MV.pend) {
      nueva.style.minHeight = alto + "px";
      let ro = null; const sec = nueva.firstElementChild, soltar = () => { if (ro) ro.disconnect(); nueva.style.minHeight = ""; };
      ro = window.ResizeObserver ? new ResizeObserver(() => { if (sec.getBoundingClientRect().height >= alto - 24) soltar(); }) : null;
      if (ro) ro.observe(sec); setTimeout(soltar, 1600);
    }
    if (cambia && ant && !sinAnim() && nueva.animate) nueva.animate([{ opacity: 0.001 }, { opacity: 1 }], { duration: 200, easing: "cubic-bezier(.2,.7,.2,1)" });
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
    if (que === "coloso") return pintarColoso(cont);
    if (que === "compania") return pintarCompania(cont);
    if (que === "c" && S.sub[1]) return pintarUnirCompania(cont, S.sub[1]);
    if (que === "sala" && S.sub[1]) return pintarSalaRuta(cont, S.sub[1]);
    retomarSala();
    if (que === "buzon") return pintarBuzon(cont);
    if (que === "cuenta") return pintarCuenta(cont);
    return pintarPanel(cont);
  }
  // P21 (BiEx, 11-nov-2026): lo que hacen las demás personas, en vivo y con el mínimo gasto. Una sección se refresca sola
  // solo mientras está en pantalla, la pestaña está visible y alguien usó la página en los últimos 3 minutos; se detiene
  // al salir de ella. El servidor guarda cada respuesta pública unos segundos, así que muchos mirando no cuestan más.
  let ULT_USO = Date.now();
  for (const ev of ["pointerdown", "keydown", "wheel", "touchstart", "scroll"]) addEventListener(ev, () => { ULT_USO = Date.now(); }, { passive: true, capture: true });
  function enVivo(el, cada, fn) {
    let vis = !("IntersectionObserver" in window), fallos = 0;
    const io = vis ? null : new IntersectionObserver((e) => { vis = e.some((x) => x.isIntersecting); });
    if (io) io.observe(el);
    const paso = async () => {
      if (!el.isConnected) { if (io) io.disconnect(); return; }
      if (vis && navigator.onLine && document.visibilityState === "visible" && Date.now() - ULT_USO < 180e3) {
        try {
          const r = await fn();
          fallos = r && r.error ? Math.min(3, fallos + 1) : 0;
        } catch (e) { fallos = Math.min(3, fallos + 1); }
      }
      setTimeout(paso, cada * Math.pow(2, fallos));
    };
    setTimeout(paso, cada);
  }
  // una cifra que cambia sube (o baja) hasta su valor nuevo con un destello breve
  function cifraViva(el, n) {
    if (!el) return;
    const de = Number(el.dataset.v || 0) || 0; n = Math.max(0, Math.round(Number(n) || 0)); el.dataset.v = String(n);
    if (de === n) return;
    if (sinAnim() || document.hidden || !el.animate) { el.textContent = fmt(n); return; }
    const t0 = performance.now(), ms = 700, paso = (t) => { const k = Math.min(1, (t - t0) / ms); el.textContent = fmt(Math.round(de + (n - de) * (1 - Math.pow(1 - k, 2.4)))); if (k < 1) requestAnimationFrame(paso); };
    requestAnimationFrame(paso);
    el.animate([{ color: "var(--oro-vivo)", textShadow: "0 0 14px color-mix(in srgb,var(--oro) 70%,transparent)" }, { color: "", textShadow: "none" }], { duration: 1200, easing: "ease-out" });
  }
  function vivoLinea() {
    const el = h("p", { class: "jg-vivo", "aria-live": "off" });
    const B = {};
    const pintar = (v) => {
      if (v.error) return;
      const filas = [["leyendo", "", " persona leyendo ahora", " personas leyendo ahora", true], ["versosHoy", "", " verso leído hoy", " versos leídos hoy"], ["jugadores", "", " estudiante", " estudiantes"]];
      if (filas.every(([k]) => B[k] && (v[k] > 0) === !!B[k].isConnected)) { for (const [k, , s1, s2] of filas) if (v[k] > 0) { cifraViva(B[k], v[k]); B[k].nextSibling.textContent = v[k] === 1 ? s1 : s2; } return; }
      el.replaceChildren(...filas.filter(([k]) => v[k] > 0).map(([k, , s1, s2, punto]) => { B[k] = h("b", { "data-v": String(v[k]), text: fmt(v[k]) }); return h("span", {}, punto ? h("i") : null, B[k], v[k] === 1 ? s1 : s2); }));
      for (const [k] of filas) if (!(v[k] > 0)) B[k] = null;
    };
    pedir("/vivo", { sin: true }).then(pintar);
    enVivo(el, 25e3, () => pedir("/vivo", { sin: true }).then(pintar));
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
      cfg.google ? h("button", { class: "btn", type: "button", onclick: () => conectar("google", "entrar", pistaC) }, ico("google"), h("span", { text: "Entrar con Google" })) : null);
    marco(cont, cabecera(),
      avisoEnApp(), franjaInv, franjaGrupo, tarjetaPrerregistro(entrada),
      tarjeta("Cómo se juega", null,
        h("p", { text: "Lee la Nueva Voluntad y cada verso que de verdad lees te da experiencia. Cada día tienes de 2 a 5 misiones pequeñas, a tu ritmo y sin culpa. Al leer puedes hallar, muy de vez en cuando, una de las doce piedras del fundamento o un lauro trenzado incorruptible." }),
        h("p", { class: "jg-mini", text: "Hay clasificaciones por ciudad, departamento o estado, país y continente, separadas por rango para que nadie compita en desventaja, y el prestigio local de cada ciudad. Cada persona que llega con tu enlace hace crecer tu árbol de la siembra. Puedes crear tu cuenta oficial, o sencillamente participar con un código de invitado, sin necesidad de correo, nombre ni contraseña." }),
        h("div", { class: "jg-acciones" }, h("a", { class: "btn", href: "#/escudrina/guia", onclick: () => { S.guiaPaso = 0; } }, ico("jugar"), h("span", { text: "Ver cómo se juega, paso a paso" })))),
      h("div", { class: "jg-dos" },
        tarjeta("Empezar con un apodo", null, h("div", { class: "jg-form" }, entrada, btn), pista,
          h("p", { class: "jg-mini", text: "Recibirás un código único para entrar desde otros dispositivos; después podrás asegurar tu avance con una llave de acceso o con Google." }),
          cfg.google ? h("div", { class: "jg-empezar-con" }, h("p", { class: "jg-mini", text: "O empieza de una vez con tu cuenta oficial: tu lugar queda asegurado desde el primer momento y no tienes que guardar ningún código." }),
            h("div", { class: "jg-entrar" },
              h("button", { class: "btn", type: "button", onclick: () => conectar("google", "crear", pista) }, ico("google"), h("span", { text: "Empezar con Google" })))) : null,
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

  // --- asegurar el avance (llave de acceso, Google)
  function tarjetaAsegurar(ahora) {
    const y = S.yo || {}, v = y.vinculado || {}, cfg = S.cfg || {};
    if (y.asegurado && !ahora) return null;
    const pista = h("p", { class: "jg-pista", role: "status" });
    const btns = h("div", { class: "jg-entrar" },
      puedeLlave() ? h("button", { class: "btn", type: "button", onclick: (e) => registrarLlave(e.currentTarget, pista) }, ico("llave"), h("span", { text: v.llave ? "Añadir otra llave de acceso" : "Crear una llave de acceso (huella, rostro o PIN)" })) : null,
      cfg.google && !v.google ? h("button", { class: "btn", type: "button", onclick: () => conectar("google", "vincular", pista) }, ico("google"), h("span", { text: "Vincular mi cuenta de Google" })) : null);
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
      rel, h("span", { class: "jg-epica-vidrio", "aria-hidden": "true" }), h("span", { class: "jg-marcas", "aria-hidden": "true" }), borde);
    const pctRed = Math.round(pct * 10) / 10;
    const pctVis = y.xpSig && y.xpNivel < y.xpSig ? Math.min(99.9, pctRed) : pctRed;
    const cab = h("div", { class: "jg-epica-cab", "aria-hidden": "true" },
      h("span", { class: "jg-epica-rumbo", text: y.enTope ? "Nivel tope · " + y.tope : "Nivel " + y.nivel + " › " + (y.nivel + 1) }),
      h("span", { class: "jg-epica-pct", text: pctVis.toFixed(1).replace(".", ",") + " %" }));
    const visto = A.store.get("jg:xpv", null), desde = visto && visto.n === y.nivel ? visto.p : visto && visto.n < y.nivel ? 0 : 0;
    A.store.set("jg:xpv", { n: y.nivel, p: pct });
    if (desde < pct - 0.3 && !sinAnim() && rel.animate) requestAnimationFrame(() => {
      for (const el of [rel, borde]) el.animate([{ transform: "translate3d(" + (desde - 100).toFixed(2) + "%,0,0)" }, { transform: "translate3d(" + (pct - 100).toFixed(2) + "%,0,0)" }], { duration: 1250, easing: "cubic-bezier(.2,.8,.2,1)" });
      bar.classList.add("crece"); setTimeout(() => bar.classList.remove("crece"), 1550);
    });
    return h("div", { class: "jg-epica-bl" }, cab, h("div", { class: "jg-epica-marco" }, bar));
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
        h("div", { class: "jg-nivel" }, h("span", { text: y.enTope ? "Llegaste al nivel tope de este mes (" + y.tope + "): el 1.º del mes se abren de 2 a 7 niveles nuevos y tu reserva sube contigo" : fmt(y.xpNivel) + " de " + fmt(y.xpSig) + " para el nivel " + (y.nivel + 1) }))));
    t.classList.add("jg-yo");
    // P24 + V18 (BiEx, 11 y 12-nov-2026): la tarjeta crece por etapas con tu poder (Semilla, Brote, Raíz honda, Copa, Fruto;
    // Tehillim [Salmos] 1:3): marco con filigrana de vid en las esquinas, cada etapa con su metal; desde la segunda, un aura que
    // respira tras el emblema; desde la cuarta, motas de luz; en la quinta, destellos rubí. Todo quieto salvo la opacidad.
    const poder = (y.av && y.av.poder) | 0, et = poder >= 2400 ? 5 : poder >= 1200 ? 4 : poder >= 600 ? 3 : poder >= 250 ? 2 : 1;
    const ETN = ["", "Semilla", "Brote", "Raíz honda", "Copa", "Fruto"], ETC = ["", "#c9813f", "#c3ccd8", "#f0c04a", "#ffe39a", "#ff7d93"];
    t.classList.add("etapa-" + et); t.style.setProperty("--et", ETC[et]);
    const esq = (cl) => h("span", { class: "jg-esq " + cl, "aria-hidden": "true" }, A.svg('<path d="M3 41C3 21 21 3 41 3" fill="none" stroke="var(--et)" stroke-width="1.6" stroke-linecap="round"/><path d="M9 41C9 25 25 9 41 9" fill="none" stroke="var(--et)" stroke-opacity=".5" stroke-width="1"/>' +
      '<path d="M15 24c3-6 9-8 13-5-4 4-9 6-13 5zM24 15c5-4 11-3 13 1-5 2-10 2-13-1z" fill="var(--et)" fill-opacity=".75"/><circle cx="8" cy="20" r="1.6" fill="var(--et)"/>', "0 0 44 44"));
    t.prepend(esq("e1"), esq("e2"));
    const rg = t.querySelector(".jg-rango"); if (rg) rg.after(h("div", { class: "jg-etapa", title: "Tu tarjeta crece con tu poder (" + fmt(poder) + ")", text: "Etapa " + ["", "I", "II", "III", "IV", "V"][et] + " · " + ETN[et] }));
    if (et >= 4) for (let i = 0; i < 4; i++) t.append(h("i", { class: "jg-mota", "aria-hidden": "true", style: "left:" + (14 + i * 23) + "%;--d:" + (i * 1.7).toFixed(1) + "s;--t:" + (6.5 + i * 0.9).toFixed(1) + "s" }));
    // V18: lo ganado hoy se ve en la barra (tramo más claro antes del borde) y en el renglón de abajo
    const hoyXp = (y.hoy && y.hoy.xp) | 0, bar = t.querySelector(".jg-epica");
    if (bar && hoyXp > 0 && y.xpSig) { const ph = Math.min(pct, (100 * hoyXp) / y.xpSig); if (ph >= 0.6) bar.append(h("i", { class: "jg-hoy", "aria-hidden": "true", style: "left:" + (pct - ph).toFixed(2) + "%;width:" + ph.toFixed(2) + "%" })); }
    const nv = t.querySelector(".jg-nivel span"); if (nv && hoyXp > 0) nv.append(h("b", { class: "jg-hoy-t", text: " · hoy +" + fmt(hoyXp) }));
    return t;
  }
  function botonSeguir() {
    const u = A.ultimo && A.ultimo();
    const hh = u ? u.h : "#/MAT/1";
    return h("a", { class: "btn oro jg-grande", href: hh }, A.svg(A.ICO.seguir), h("span", {}, u ? "Seguir leyendo" : "Empezar a leer", h("small", { text: u ? u.t : "Mattáy 1" })));
  }
  // adónde lleva cada misión: a la lectura exacta que la cumple (dinámico según el avance local del lector)
  function buscarCapMision(filtro, modo) {
    const cf = A.store.get("jg:cf", null) || {}, K = lecturasK();
    const libs = A.progresoLibros ? A.progresoLibros(cf, K) : [];
    const sub = filtro ? libs.filter((b) => filtro(b.c)) : libs;
    if (modo === "repaso") {
      // busca un capítulo que ya tenga versos marcados antes de hoy
      for (const b of sub) {
        for (let cap = 1; cap <= b.caps; cap++) {
          const s = cf[b.c + "." + cap] || "";
          if (s && /[^0]/.test(s)) return "#/" + b.c + "/" + cap;
        }
      }
      return null;
    }
    // «nuevos» / «vida» / «cartas»: primer capítulo con versos sin marcar en el libro actual (si aplica) o en el primer libro pendiente
    const u = A.ultimo && A.ultimo(), uC = u && (u.h.match(/^#\/([1-3A-Z]{3})\//) || [])[1];
    const orden = uC ? [...sub.filter((b) => b.c === uC), ...sub.filter((b) => b.c !== uC)] : sub;
    const cand = orden.find((b) => b.l < b.t && b.sig);
    return cand ? "#/" + cand.c + "/" + cand.sig : (orden[0] ? "#/" + orden[0].c + "/1" : null);
  }
  function destinoMision(m) {
    const u = A.ultimo && A.ultimo(), seguir = u ? u.h : "#/MAT/1";
    if (m.tipo === "libros") return "#/libros";
    if (m.tipo === "vida") return buscarCapMision((c) => ["LUK", "MAT", "MRK", "JHN"].includes(c), "nuevo") || "#/LUK/1";
    if (m.tipo === "cartas") return buscarCapMision((c) => !["MAT", "MRK", "LUK", "JHN", "ACT", "REV"].includes(c), "nuevo") || "#/ROM/1";
    if (m.tipo === "nuevos") return buscarCapMision(null, "nuevo") || seguir;
    if (m.tipo === "repaso") return buscarCapMision(null, "repaso") || seguir;
    if (m.tipo === "preguntas") {
      const p = (espejo().p || [])[0];
      if (p) { const [lib, cap] = p.split("."); return "#/" + lib + "/" + cap; }
      return seguir;
    }
    return seguir;
  }
  function tarjetaMisiones(y) {
    // una misión cumplida muestra siempre su meta completa (13-nov-2026: «0 de 1 · cumplida» tras el cambio de conteo de P20)
    const lista = h("ul", { class: "jg-misiones" }, (y.mis || []).map((m) => (m.hecha && !(m.prog >= m.meta) ? Object.assign({}, m, { prog: m.meta }) : m)).map((m, i) => h("li", { class: "jg-mision" + (m.hecha ? " hecha" : "") },
      h("span", { class: "jg-ok", "aria-hidden": "true" }, ico("marca")),
      h(m.hecha ? "div" : "a", m.hecha ? {} : { class: "jg-mis-ir", href: destinoMision(m), title: "Ir a cumplirla", onclick: m.tipo === "preguntas" ? () => {
        const hayP = (espejo().p || []).length > 0;
        setTimeout(() => A.avisar(hayP ? "Tienes una prueba lista al final de este capítulo: desplázate abajo para abrirla." : "Completa un capítulo leyendo a tu ritmo: la prueba de 3 preguntas aparece al final del capítulo."), 350);
      } : null }, h("div", { class: "jg-mt", text: textoMision(m) }), h("div", { class: "jg-barra", "aria-hidden": "true" }, h("i", { style: "width:" + Math.min(100, (100 * m.prog) / m.meta).toFixed(0) + "%" })),
        h("span", { class: "jg-mini", text: fmt(m.prog) + " de " + fmt(m.meta) + (m.hecha ? " · cumplida" : m.tipo === "preguntas" ? " · las pruebas salen al final de cada capítulo" : " · tócala para ir a cumplirla") })),
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
  function fechaJerusalen() {
    if (A.fechaHoraJerusalen) return A.fechaHoraJerusalen();
    try { return new Intl.DateTimeFormat("es", { timeZone: "Asia/Jerusalem", day: "numeric", month: "long", year: "numeric" }).format(new Date()) + " d.H.D."; }
    catch (e) { return ""; }
  }
  function tarjetaHoy(y) {
    const fJer = fechaJerusalen();
    return tarjeta("Hoy", null, h("div", { class: "jg-cifras" },
      h("div", {}, h("b", { text: fmt(y.hoy.versos) }), h("span", { text: "versos" })),
      h("div", {}, h("b", { text: fmt(Math.floor((y.hoy.mr || y.hoy.ms || 0) / MIN)) }), h("span", { text: "minutos" })),
      h("div", {}, h("b", { text: fmt(y.hoy.xp) }), h("span", { text: "experiencia" }))),
      y.pers > 0 ? h("p", { class: "jg-mini" }, A.svg(ICO_JG.llama, "0 0 24 24"), " Perseverancia: ", h("b", { text: plural(y.pers, "día", "días") }), " · tu mejor marca: " + plural(y.persMejor, "día", "días") +
        " · descansos guardados: " + y.desc + " de 3. Cada 7 días seguidos ganas un descanso que cubre un día sin lectura y media pieza de Renuevo (con dos medias, el Renuevo sale sin dracmas).")
        : h("p", { class: "jg-mini" }, A.svg(ICO_JG.llama, "0 0 24 24"), " Tu perseverancia empieza con el primer verso de hoy." + (y.persMejor ? " Tu mejor marca: " + plural(y.persMejor, "día", "días") + "." : "") + " Cada 7 días seguidos ganas un descanso que cubre un día sin lectura y media pieza de Renuevo (con dos medias, el Renuevo sale sin dracmas)."),
      fJer ? h("p", { class: "jg-hoy-jer", text: "Yᵉrūshāláyim [Jerusalén] · " + fJer }) : null);
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
  const FT_PD = [4.3, 4.9, 5.3, 5.7, 6.1, 4.7, 5.5, 6.3, 5.1, 5.9, 6.5, 4.6];
  function tarjetaHallazgos(y) {
    const p = y.piedras || [], n = p.filter((x) => x > 0).length;
    const rejilla = observarFlotantes(h("div", { class: "jg-piedras" }, PIEDRAS.map((pd, i) => {
      const tiene = (p[i] | 0) > 0;
      const esc = h("span", { class: "jg-pd-esc", "aria-hidden": "true" },
        tiene ? h("span", { class: "jg-pd-halo" }) : null,
        h("span", { class: "jg-pd-gema" }, gema(i, tiene)),
        tiene ? h("span", { class: "jg-pd-sombra" }) : null);
      return h("button", { class: "jg-piedra" + (tiene ? " tiene" : ""), type: "button", style: "--pg:" + pd[2] + ";--ft:" + FT_PD[i] + "s;--fd:-" + (i * 0.47).toFixed(2) + "s",
        "aria-label": pd[3] + " [" + pd[1] + "]" + (p[i] ? ", hallada " + p[i] + (p[i] === 1 ? " vez" : " veces") : ", aún no hallada"),
        onclick: () => verPiedra(i, p[i] || 0) }, esc, h("span", { text: pd[3] }), p[i] > 1 ? h("b", { text: "×" + p[i] }) : null);
    })));
    return tarjeta("Hallazgos", null, rejilla,
      h("div", { class: "jg-tesoros" },
        h("span", { class: "jg-tesoro" }, lauro(), h("span", { text: (y.lauros && y.lauros.trenzado ? plural(y.lauros.trenzado, "lauro trenzado", "lauros trenzados") : "Ningún lauro trenzado todavía") })),
        h("span", { class: "jg-tesoro" }, dracma(), h("span", { text: plural(y.dr, "dracma", "dracmas") }))),
      y.lauroP != null ? h("div", { class: "jg-lauro-p", title: "Es una estimación: cada hallazgo se decide aleatoriamente en el servidor" },
        // (BiEx, 14-nov-2026: «no parece variar») con dos decimales; no es una falla: la probabilidad cambia con cada hallazgo
        // (no con cada verso), y se dice cuánto sube y cuántos hallazgos van sin lauro
        h("div", { class: "jg-lauro-p-t" }, h("span", { text: "Lauro trenzado en tu próximo hallazgo" }), h("b", { text: "≈\u00a0" + (y.lauroP * 100).toFixed(2).replace(".", ",") + "\u00a0%" })),
        h("div", { class: "jg-barra", "aria-hidden": "true" }, h("i", { style: "width:" + Math.min(100, (y.lauroP / 0.6) * 100).toFixed(2) + "%" })),
        h("p", { class: "jg-mini", text: (() => { const k = Math.max(0, Math.round((y.lauroP - 0.03) / 0.015)); return "Sube un 1,50 % con cada piedra que hallas" + (k ? " (llevas " + plural(k, "hallazgo", "hallazgos") + " sin lauro)" : "") + " y vuelve a empezar al conseguir un lauro. Cambia con cada hallazgo, no con cada verso."; })() })) : null,
      h("p", { class: "jg-mini", text: n === 12 ? "Reuniste las doce piedras: tu experiencia vale un 5 % más para siempre." : "Piedras del fundamento: " + n + " de 12 (Ἀpοκάlυpsις 21:19-20). Cada verso leído puede revelar una, muy de vez en cuando." }));
  }
  function verPiedra(i, veces) {
    const pd = PIEDRAS[i];
    A.abrirModal(() => A.cajaModal(A.cabModal("Las doce piedras", "Ἀpοκάlυpsις 21:19-20"), h("div", { class: "jg-cel" },
      h("div", { class: "arte jg-pd-modal", style: "--pg:" + pd[2] },
        veces > 0 ? h("span", { class: "jg-pd-halo", "aria-hidden": "true" }) : null,
        h("span", { class: "jg-pd-gema" }, gema(i, veces > 0)),
        h("span", { class: "jg-pd-sombra", "aria-hidden": "true" })),
      h("h3", { text: piedraNombre(i) }), h("p", { class: "jg-mini", lang: "grc", text: pd[0] }),
      h("p", { text: "La " + ORDINAL[i] + " piedra del fundamento del muro de la ciudad. " + (veces ? "La hallaste " + plural(veces, "vez", "veces") + "." : "Aún no la hallas: sigue leyendo.") }),
      h("a", { class: "btn chico", href: "#/REV/21/l/" + (i < 4 ? 19 : 20) }, h("span", { text: "Leer el verso" })))));
  }
  const NOVEDAD = { frag: (a) => (a.n === 1 ? "Hallaste un fragmento de papiro" : "Hallaste " + a.n + " fragmentos de papiro") + (a.c ? " · " + a.c + " de " + (a.meta || 70) + " en tu rollo (Tesoro)" : "") + ".", drl: (a) => "Hallaste " + a.dr + " dracmas al marcar «Leído».",
    piedra: (a) => "Hallaste " + piedraNombre(a.i) + ".", lauro: () => "Hallaste un lauro trenzado incorruptible.", unido: (a) => a.a + " llegó con tu invitación.", leyo: (a) => a.a + " leyó sus primeros 20 versos: +" + a.xp + ".",
    conf: (a) => a.a + " confirmó su lugar: sumas un peldaño de tu escalera.", marco: (a) => "¡Subiste al peldaño «" + ((marcos()[a.m - 1] || [])[1] || "") + "» de la escalera del Sembrador" + (a.v > 1 ? " (vuelta " + a.v + ")" : "") + "!" + (a.h ? " +" + a.h + " h de experiencia doble." : ""),
    lanzamiento: (a) => "¡Escudriña abrió! " + (a.p ? "Conservaste el " + String(a.p).replace(".", ",") + " % de tu avance de práctica y, por inscribirte antes, recibiste " + a.h + " horas de experiencia doble." : "Por inscribirte antes recibiste " + a.h + " horas de experiencia doble."),
    micro: (a) => a.a + " confirmó su lugar en tu " + (a.g === 2 ? "segunda" : "tercera") + " generación" + (a.via ? " (llegó por " + a.via + ")" : "") + ": +" + a.min + " min de experiencia doble.",
    adoptados: (a) => (a.n === 1 ? "1 persona que llegó con lo que compartiste antes de tener cuenta ya está en tu árbol de la siembra." : fmt(a.n) + " personas que llegaron con lo que compartiste antes de tener cuenta ya están en tu árbol de la siembra."), propuesta: (a) => "Tu propuesta se hizo realidad: +" + a.h + " h de experiencia doble. ¡Gracias por construir Escudriña!",
    nivel10: (a) => a.a + " llegó al nivel 10: +" + a.xp + ".", reparo: (a) => "Te devolvimos " + plural(a.pts | 0, "punto de atributo", "puntos de atributo") + (a.compras ? " (los " + a.compras + " que compraste por " + fmt(a.dr | 0) + " dracmas y los de tus niveles nuevos)" : " de tus niveles nuevos") + " que no se veían por un fallo. Ya puedes repartirlos.",
    libroInv: (a) => a.a + " terminó su primer libro" + (a.lib ? ", " + nombreLibro(a.lib) + "," : "") + " y tú recibes +" + fmt(a.xp) + " de experiencia.", libro: (a) => "Terminaste " + nombreLibro(a.lib) + ": +" + a.xp + ".",
    liga: (a) => "Semana de liga cerrada: puesto " + a.pos + " de " + a.n + (a.nvNuevo > a.nv ? "; ¡subiste a la liga " + ligaNombre(a.nvNuevo) + "!" : "") + (a.h ? " +" + horas(a.h * 3600e3) + " de experiencia doble" + (a.dr ? " y " + a.dr + " dracmas" : "") : "") + ".",
    compania: (a) => "¡«" + a.nombre + "» logró su meta común de la semana! +" + a.h + " h de experiencia doble.",
    renuevo: (a) => "¡Renuevo cumplido! Recuperaste " + plural(a.p, "día", "días") + " de perseverancia: ahora llevas " + plural(a.pers, "día", "días") + ".",
    renuevo_vence: (a) => "Tu Renuevo venció sin completar sus misiones; tus " + plural(a.p, "día", "días") + " de perseverancia siguen esperando otro Renuevo.",
    fruto: (a) => "Tu " + ({ be: "benevolencia", go: "gozosidad", pl: "placidez", lo: "longanimidad", bn: "benignidad", bo: "bondad", cf: "confiabilidad", ma: "mansedumbre", te: "templanza" }[a.f] || "fruto") + " subió al nivel " + a.n + ": su cámara de la granada brilla más.",
    mision: (a) => (a.ok ? (a.e ? "¡Se logró el relevo " + (a.e + 1) + " de la misión mundial! " : "¡La misión mundial se logró! ") : (a.e ? "El relevo " + (a.e + 1) + " no se alcanzó esta vez, pero tu aporte cuenta: " : "La misión mundial no se alcanzó esta vez, pero tu aporte cuenta: ")) + "+" + horas(a.h * 3600e3) + " de experiencia doble" + (a.dr ? " y " + plural(a.dr, "dracma", "dracmas") : "") + ".",
    renMedia: (a) => (a.m % 2 ? "Siete días seguidos de perseverancia: ganaste un descanso y media pieza de Renuevo (te falta otra media para un Renuevo sin dracmas)." : "Siete días seguidos de perseverancia: ganaste un descanso y completaste una pieza de Renuevo: tu próximo Renuevo sale sin dracmas."),
    adelantado: (a) => {
      const quien = (a.a || "Un lector") + (a.nv ? " (nivel " + a.nv + ")" : "") + (a.otros > 0 ? " y " + plural(a.otros, "lector más", "lectores más") : "");
      const tramo = a.de && a.pos ? ": pasaste del puesto " + fmt(a.de) + " al " + fmt(a.pos) : a.pos ? " (ahora vas en el puesto " + fmt(a.pos) + ")" : "";
      const vEst = a.dif > 0 ? Math.max(1, Math.ceil(a.dif / 10)) : 0;
      const brecha = a.dif > 0 ? " Te lleva " + fmt(a.dif) + " de experiencia (unos " + plural(vEst, "verso", "versos") + " para recuperar tu lugar)." : "";
      return quien + (a.otros > 0 ? " te adelantaron" : " te adelantó") + (a.amb ? " en " + a.amb : "") + tramo + "." + brecha;
    },
    adelantaste: (a) => {
      const tramo = a.de && a.pos ? "del puesto " + fmt(a.de) + " al " + fmt(a.pos) : a.pos ? "al puesto " + fmt(a.pos) : "de puesto";
      return "¡Subiste " + tramo + (a.amb ? " en " + a.amb : "") + (a.a ? " al superar a " + a.a : "") + "! Sigue leyendo para defender tu posición.";
    },
    cerca_puesto: (a) => {
      const vEst = a.dif > 0 ? Math.max(1, Math.ceil(a.dif / 10)) : 1;
      return "Estás a solo " + fmt(a.dif) + " de experiencia (unos " + plural(vEst, "verso", "versos") + ") de superar a " + (a.a || "quien te antecede") + (a.pos ? " por el puesto " + fmt(a.pos) : "") + (a.amb ? " en " + a.amb : "") + ".";
    },
    interaccion: (a) => {
      const nMis = (a.misiones >= 2 && a.misiones <= 5) ? a.misiones : (S.yo && Array.isArray(S.yo.misiones) && S.yo.misiones.length >= 2 ? S.yo.misiones.length : 0);
      const txtMis = nMis ? "tus " + nMis + " misiones de hoy" : "todas tus misiones de hoy";
      const INT = {
        desafio: "te lanzó un desafío amistoso: completar " + txtMis,
        animo: "te envió ánimo para cuidar tu perseverancia",
        relevo: "te pasó el relevo de lectura de hoy",
        revancha: "te pidió revancha tras perder su puesto contigo",
        mision: "te invitó a completar " + txtMis,
        saludo: "te saludó desde la lectura"
      };
      const quien = (a.a || "Un lector") + (a.nv ? " (nivel " + a.nv + ")" : "");
      return quien + " " + (INT[a.tipo] || a.txt || "te envió una señal de ánimo") + (a.det ? ": " + a.det : "") + ".";
    } };
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
  // AC12: lo que sale al marcar «Leído» (fragmentos y dracmas) también queda en Novedades: se guarda en este dispositivo y se
  // une a las novedades del servidor por su hora
  function novedadLocal(k, d) { const l = A.store.get("jg:novL", null) || []; l.unshift(Object.assign({ k, t: Date.now() }, d)); A.store.set("jg:novL", l.slice(0, 30)); }
  // Competencia en Novedades: guarda una foto ligera de tu puesto en cada ámbito (liga, clasificación, compañía) y registra
  // quién te adelantó (o a quién superaste) con la hora y la diferencia de experiencia, sin duplicar avisos ya enviados por el servidor.
  function comprobarAdelantamientos(clave, lista, amb, ruta, yoExtra) {
    if (!S.yo || !S.yo.inv || !Array.isArray(lista) || !lista.length) return;
    const xpDe = (x) => (x && (x.xp != null ? x.xp : x.x)) | 0;
    const yo = lista.find((x) => x && x.yo) || (yoExtra && yoExtra.p ? { p: yoExtra.p, xp: xpDe(yoExtra), yo: true } : null);
    if (!yo || !(yo.p >= 1)) return;
    const id = S.yo.inv + ":" + clave;
    const snaps = A.store.get("jg:snapPos", null) || {};
    const prev = snaps[id];
    const yoXp = xpDe(yo);
    const arribaAhora = lista.filter((x) => x && !x.yo && x.p < yo.p).sort((a, b) => b.p - a.p);
    const ahora = Date.now();
    const novsLoc = A.store.get("jg:novL", null) || [];
    const yaReciente = (k, ap, ms) => novsLoc.some((n) => n && n.k === k && n.amb === amb && (!ap || n.a === ap) && ahora - (n.t || 0) < ms) ||
      ((S.yo.avisos || []).some((n) => n && n.k === k && (!ap || n.a === ap) && ahora - (n.t || 0) < ms));
    if (prev && prev.p >= 1) {
      if (yo.p > prev.p) {
        const prevArriba = new Set(prev.arriba || []);
        const nuevos = arribaAhora.filter((x) => x.p >= prev.p || !prevArriba.has(x.apodo));
        const rival = nuevos[0] || arribaAhora[0];
        if (rival && !yaReciente("adelantado", rival.apodo, 30 * 60e3)) {
          const dif = Math.max(1, xpDe(rival) - yoXp);
          novedadLocal("adelantado", { a: rival.apodo, nv: rival.nivel | 0, otros: Math.max(0, nuevos.length - 1), amb, de: prev.p, pos: yo.p, dif, ruta });
        }
      } else if (yo.p < prev.p) {
        const superado = lista.find((x) => x && !x.yo && x.p === yo.p + 1);
        if (!yaReciente("adelantaste", superado ? superado.apodo : "", 30 * 60e3)) {
          novedadLocal("adelantaste", { a: superado ? superado.apodo : "", amb, de: prev.p, pos: yo.p, ruta });
        }
      } else if (yo.p > 1 && arribaAhora[0]) {
        const r = arribaAhora[0], dif = xpDe(r) - yoXp;
        if (dif > 0 && dif <= 60 && !yaReciente("cerca_puesto", r.apodo, 18 * 3600e3)) {
          novedadLocal("cerca_puesto", { a: r.apodo, pos: r.p, dif, amb, ruta });
        }
      }
    }
    snaps[id] = { p: yo.p, xp: yoXp, t: ahora, arriba: arribaAhora.slice(0, 6).map((x) => x.apodo) };
    const ks = Object.keys(snaps);
    if (ks.length > 18) ks.sort((a, b) => (snaps[a].t || 0) - (snaps[b].t || 0)).slice(0, ks.length - 18).forEach((k) => { delete snaps[k]; });
    A.store.set("jg:snapPos", snaps);
  }
  function tarjetaNovedades(y) {
    const loc = (A.store.get("jg:novL", null) || []).filter((a) => a && a.t);
    const l = [...(y.avisos || []), ...loc].filter((a) => NOVEDAD[a.k]).sort((a, b) => (b.t || 0) - (a.t || 0)).slice(0, 8);
    if (!l.length) return null;
    const horas = [];
    const u = A.ultimo && A.ultimo(), seguir = (u && u.h) || "#/MAT/1";
    const ul = h("ul", { class: "jg-novedades" }, l.map((a) => {
      const t = a.t ? h("time", { class: "jg-nov-t", datetime: new Date(a.t).toISOString(), text: cuandoFue(a.t) }) : null;
      if (t) horas.push([t, a.t]);
      const esComp = a.k === "adelantado" || a.k === "cerca_puesto" || a.k === "interaccion";
      const esSub = a.k === "adelantaste";
      const acc = a.k === "adelantado" || a.k === "cerca_puesto"
        ? h("a", { class: "jg-nov-acc", href: seguir, text: a.k === "adelantado" ? "Leer para recuperar tu puesto ›" : "Leer para adelantarlo ›" })
        : (a.k === "interaccion" ? h("a", { class: "jg-nov-acc", href: a.ruta || seguir, text: "Ir a leer ›" }) : a.ruta && esSub ? h("a", { class: "jg-nov-acc", href: a.ruta, text: "Ver puestos ›" }) : null);
      return h("li", { class: esComp ? "comp" : esSub ? "subio" : "" }, t, h("span", { class: "jg-nov-x", text: NOVEDAD[a.k](a) }), acc);
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
  // AC20 (BiEx, 15-nov-2026): el Árbol pasa al lugar de Juntos y Juntos al del Árbol
  const SECC = [["hoy", "Hoy", "hoy"], ["mundo", "Mundo", "mundo"], ["tesoro", "Tesoro", "liga"], ["arbol", "Árbol", "arbol"], ["juntos", "Juntos", "compania"], ["mas", "Más", "mas"]];
  const SECC_DE = { tesoro: "tesoro", mundo: "mundo", liga: "mundo", coloso: "mundo", clasificacion: "mundo", prestigio: "mundo", juntos: "juntos", compania: "juntos", companias: "juntos", c: "juntos", sala: "juntos", arbol: "arbol",
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
    insigniaSalas();
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
  // AA21 · Renuevo (BiEx, 14-nov-2026; אִיּוֹב [Job] 14:7): el árbol cortado vuelve a brotar. Muestra el Renuevo en curso con sus
  // misiones de la semana, o las perseverancias rotas que esperan uno (se compra en la tienda del Árbol, uno cada 2 semanas)
  const REN_MIS = { vc: ["Marca «Leído» en", "versos"], dias: ["Lee en", "días distintos"], min: ["Lee", "minutos"], ac: ["Acierta", "preguntas de la prueba"], pal: ["Lee", "palabras griegas"] };
  function bloqueRenuevo(y) {
    const c = y.ren, rup = y.rup || [];
    if (!c && !rup.length) return null;
    const fechaR = (f) => { try { return new Date(f + "T12:00:00Z").toLocaleDateString(LOC_ES, { day: "numeric", month: "short" }); } catch (e) { return f; } };
    if (c) {
      const falta = c.hasta - Date.now();
      return h("div", { class: "jg-ren" }, h("div", { class: "jg-ren-cab" }, h("span", { class: "jg-ren-i", "aria-hidden": "true" }, A.svg(ICO_USO.renuevo)),
        h("div", {}, h("b", { text: "Renuevo en curso" }), h("small", { text: "Recupera " + plural(c.p, "día", "días") + " de perseverancia · " + (falta > 48 * 3600e3 ? "quedan " + plural(Math.ceil(falta / 864e5), "día", "días") : falta > 0 ? "quedan " + horas(falta) : "vence hoy") }))),
        h("ul", { class: "jg-ren-l" }, c.mis.map(([k, meta, hecho]) => { const [a, b] = REN_MIS[k] || ["", k]; const ok = hecho >= meta;
          return h("li", { class: ok ? "ok" : "" }, h("span", { text: a + " " + fmt(meta) + " " + b }), h("em", { text: ok ? "✓" : fmt(hecho) + " / " + fmt(meta) }), h("i", { class: "jg-barra", "aria-hidden": "true" }, h("i", { style: "width:" + Math.min(100, (100 * hecho) / Math.max(1, meta)).toFixed(1) + "%" }))); })));
    }
    const t = y.renHasta && y.renHasta > Date.now() ? " El próximo Renuevo se puede comprar desde el " + new Date(y.renHasta).toLocaleDateString(LOC_ES, { day: "numeric", month: "long" }) + "." : (y.renMed | 0) >= 2 ? " Tienes una pieza completa de Renuevo: ábrelo sin dracmas en la tienda del Árbol (aparecen de 2 a 5 misiones para cumplir en una semana)." : " Cómpralo en la tienda del Árbol: aparecen de 2 a 5 misiones para cumplir en una semana.";
    return h("p", { class: "jg-mini jg-ren-esp" }, h("span", { class: "jg-ren-i", "aria-hidden": "true" }, A.svg(ICO_USO.renuevo)), "Perseverancias que un Renuevo puede recuperar: " + rup.slice().sort((a, b) => b[1] - a[1]).slice(0, 4).map(([f, p]) => plural(p, "día", "días") + " (hasta el " + fechaR(f) + ")").join(", ") + "." + t);
  }
  // medias piezas de Renuevo (AF45): «1½», «2», «½»…
  const piezasRenuevo = (m) => { m = m | 0; const e = Math.floor(m / 2), med = m % 2; return (e ? String(e) : med ? "" : "0") + (med ? "½" : ""); };
  function tarjetaPotencias(y) {
    const extra = [];
    if (y.dob > 0) extra.push("Experiencia doble: " + horas(y.dob) + " de lectura (no vence).");
    if (y.imp && y.imp.ms > 0) extra.push("Impulso ×" + String(y.imp.f).replace(".", ",") + ": " + horas(y.imp.ms) + " de lectura.");
    extra.push("Tu mejor marca de perseverancia: " + plural(y.persMejor || 0, "día", "días") + ". Cada 7 días seguidos ganas un descanso que cubre un día sin lectura y media pieza de Renuevo (con dos medias, el Renuevo sale sin dracmas).");
    return tarjeta("Tus reservas", ico("llama"), h("div", { class: "jg-cifras" },
      h("div", {}, cifra(y.dr), h("span", { text: "dracmas" })),
      h("div", {}, cifra(y.pers), h("span", { text: y.pers === 1 ? "día de perseverancia" : "días de perseverancia" })),
      h("div", {}, h("b", { text: String(y.desc || 0) + " de 3" }), h("span", { text: "descansos guardados" })),
      h("div", {}, h("b", { text: piezasRenuevo(y.renMed) }), h("span", { text: "piezas de Renuevo" }))),
      h("p", { class: "jg-mini", text: extra.join(" ") }), bloqueRenuevo(y));
  }
  // AC17 (BiEx, 15-nov-2026): las posiciones ya desplegadas en la tarjeta, con dos vistas que se intercambian en el mismo lugar
  // (clasificación de tu rango y prestigio de las ciudades), sin botones que lleven a otra página para verlas. El cambio es un
  // fundido en su sitio (nada se mueve a los lados) y la altura se conserva para que no salte; «Ver todo» abre la vista
  // completa con sus filtros. Se recuerda la última vista elegida.
  function tarjetaClasificacion(y) {
    const lugar = y.lugar || {}, zona = h("div", { class: "jg-cl2-z", "aria-live": "polite" }, h("p", { class: "cargando", text: "Cargando…" }));
    let vista = A.store.get("jg:clVista", "clas") === "pres" ? "pres" : "clas", alto = 0;
    const icoCiu = () => h("span", { class: "jg-ciu", "aria-hidden": "true" }, A.svg('<path d="M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0 1 13 0c0 4.8-6.5 11-6.5 11z" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="12" cy="10" r="2.4" fill="currentColor"/>'));
    const fila = (x) => { const [l, c] = embDe(x.emb), ex = resumenStatsPub(x); return h("li", { class: "jg-fila" + (x.yo ? " yo" : "") + (x.p <= 3 ? " p" + x.p : "") }, h("span", { class: "p", text: String(x.p) }), emblema(l, c, x.marco, x.foto),
      h("span", { class: "n" }, nombreClicable(x.apodo), h("small", { text: "nivel " + x.nivel + (ex ? " · " + ex : "") + (x.ciudad ? " · " + x.ciudad : "") })), h("span", { class: "x" }, fmt(x.xp), h("small", { text: "exp." }))); };
    const filaC = (x) => h("li", { class: "jg-fila" + (x.ciudad === lugar.ciudad && x.pais === lugar.pais ? " yo" : "") + (x.p <= 3 ? " p" + x.p : "") }, h("span", { class: "p", text: String(x.p) }), icoCiu(),
      h("span", { class: "n" }, h("b", { text: x.ciudad }), h("small", { text: [nombrePais(x.pais), x.top ? "n.º 1: " + x.top : ""].filter(Boolean).join(" · ") })), h("span", { class: "x" }, fmt(x.pr), h("small", { text: "pts." })));
    const pie = (href, t) => h("a", { class: "btn chico jg-cl2-mas", href }, h("span", { text: t }), A.svg(A.ICO.der));
    async function pintar() {
      alto = Math.max(alto, zona.offsetHeight); if (alto) zona.style.minHeight = alto + "px";
      const yoVista = vista;
      let nodos;
      if (vista === "clas") {
        const r = await pedir("/clasificacion?" + new URLSearchParams({ ambito: lugar.pais ? "pais" : "mundo", periodo: "semana" }));
        if (yoVista !== vista || !zona.isConnected) return;
        if (r.error) nodos = [h("p", { class: "jg-mini", text: mensaje(r) })];
        else {
          const l = r.lista || [], mio = r.yo && !l.slice(0, 5).some((x) => x.yo);
          comprobarAdelantamientos("clas:" + (lugar.pais ? "pais" : "mundo") + ":semana:" + r.rango, l, lugar.pais ? nombrePais(lugar.pais) : "la clasificación mundial", "#/escudrina/clasificacion", r.yo);
          nodos = [h("p", { class: "jg-mini jg-cl2-sub", text: "Esta semana · " + (RANGOS[r.rango] || "tu rango") + " · " + (lugar.pais ? nombrePais(lugar.pais) : "el mundo") }),
            l.length ? h("ol", { class: "jg-lista" }, l.slice(0, 5).map(fila)) : h("p", { class: "jg-mini", text: "Todavía nadie de tu rango suma experiencia aquí. ¡Puedes ser la primera persona!" }),
            mio ? h("p", { class: "jg-mini jg-cl2-yo", text: "Tu puesto: " + fmt(r.yo.p) + " · " + fmt(r.yo.xp) + " de experiencia" }) : null,
            pie("#/escudrina/clasificacion", "Ver toda la clasificación")];
        }
      } else {
        const r = await pedir("/prestigio?" + new URLSearchParams({ periodo: "semana", pais: lugar.pais || "" }), { guardable: true });
        if (yoVista !== vista || !zona.isConnected) return;
        if (r.error) nodos = [h("p", { class: "jg-mini", text: mensaje(r) })];
        else {
          const l = r.lista || [], mia = l.find((x) => x.ciudad === lugar.ciudad && x.pais === lugar.pais), arriba = l.slice(0, 5);
          nodos = [h("p", { class: "jg-mini jg-cl2-sub", text: "Esta semana · " + (lugar.pais ? nombrePais(lugar.pais) : "el mundo") + " · cada ciudad suma a sus 12 mejores lectores" }),
            l.length ? h("ol", { class: "jg-lista" }, arriba.map(filaC)) : h("p", { class: "jg-mini", text: "Todavía ninguna ciudad suma prestigio aquí. ¡La tuya puede ser la primera!" }),
            mia && !arriba.includes(mia) ? h("ol", { class: "jg-lista jg-cl2-tu", start: String(mia.p) }, filaC(mia)) : null,
            pie("#/escudrina/prestigio", "Ver todo el prestigio local")];
        }
      }
      zona.replaceChildren(...nodos.filter(Boolean));
      if (zona.animate && !sinAnim()) zona.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 240, easing: "ease-out" });
      requestAnimationFrame(() => { zona.style.minHeight = ""; alto = 0; });
    }
    const seg = h("div", { class: "jg-seg fila jg-cl2-seg", role: "group", "aria-label": "Qué ver" }, [["clas", "Clasificación"], ["pres", "Prestigio"]].map(([k, t]) => h("button", { type: "button", "aria-pressed": String(vista === k), onclick: (e) => {
      if (vista === k) return; vista = k; A.store.set("jg:clVista", k); for (const b of e.currentTarget.parentNode.children) b.setAttribute("aria-pressed", String(b === e.currentTarget)); vibrar(6); pintar(); } }, t)));
    setTimeout(pintar, 0);
    return tarjeta("Clasificación", ico("mundo"), h("p", { text: "Tu puesto en tu ciudad, tu departamento o estado, tu país, tu continente y el mundo, entre quienes tienen tu mismo rango, y el prestigio local de tu ciudad." }),
        h("div", { class: "jg-cl2" }, seg, zona), tarjetaColeccion(y), vivoLinea());
  }
  function dibujarPanel(cont, y) {
    const sec = SECC_DE[S.sub[0] || ""] || "hoy";
    if (sec !== "juntos") salasAbiertas(false).catch(() => {});
    const pend = null; // P20 (12-nov-2026): ya no se piden confirmaciones manuales
    const salaInv = (() => { const ps = A.store.get("jg:salaInv", null); return ps && ps.c && !SL.cod ? h("div", { class: "jg-aviso" }, "Te invitaron a la sala de lectura ", h("b", { text: ps.c }), ". ", h("a", { href: "#/escudrina/sala/" + ps.c, text: "Entrar" })) : null; })();
    let partes;
    if (sec === "tesoro") partes = [tarjetaPapiros(y), tarjetaHallazgos(y), tarjetaLecturas(y), tarjetaPotencias(y)].filter(Boolean);
    else if (sec === "mundo") partes = [tarjetaColoso(false), tarjetaQuienLee(), h("div", { class: "jg-dos" }, tarjetaLiga(y), tarjetaMision(y)), tarjetaClasificacion(y)];
    else if (sec === "juntos") partes = [salaInv, tarjetaSalasAbiertas(), h("div", { class: "jg-dos" }, tarjetaSala(y), tarjetaCompania(y)), tarjetaCampana(y)];
    else if (sec === "mas") partes = [y.asegurado ? null : tarjetaAsegurar(false),
      tarjeta("Tu cuenta", ico("persona"), h("p", { text: "Tu emblema, tu apodo, tus formas de entrar y tus preferencias." }),
        h("div", { class: "jg-acciones" }, h("a", { class: "btn", href: "#/escudrina/cuenta" }, ico("persona"), h("span", { text: "Cuenta, emblema y preferencias" })))),
      tarjetaOpinion(true), notaConstruccion()];
    else partes = [tarjetaPerfil(y), y.apodoProvisional ? tarjetaApodo(true) : null, botonSeguir(), tarjetaColoso(true), avisoMisionMundial(y), pend,
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
    ["Perseverancia", "Cada día que lees suma a tu perseverancia. Cada 7 días seguidos ganas un descanso que cubre un día sin lectura y media pieza de Renuevo (con dos medias, el Renuevo sale sin dracmas).", "perseverancia"],
    ["Nunca a solas", "Entra en la liga de la semana, aporta a la misión mundial, forma una compañía de 2 a 24 personas o abre una sala para leer en compañía.", "juntos"],
    ["Tu siembra", "Comparte tu enlace. Quien llega contigo empieza con 3 horas de experiencia doble, y tu árbol de la siembra crece generación tras generación.", "siembra"],
    // BiEx (10-nov-2026): el menú cambió (seis botones, con el Árbol): el paso 7 lo dice tal como es
    ["El menú del juego", "Abajo tienes seis botones: Hoy (tu lectura y tus misiones), Mundo (la liga, la misión mundial y las clasificaciones), Tesoro (lo que hallas leyendo), Juntos (tu compañía y las salas), Árbol (tu ser interior: atributos, armadura y tienda) y Más (tu cuenta). Con ellos llegas a todo. Y guarda bien tu acceso: es tu llave.", "menu"]];
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
  // La semana del juego es la misma para todos: de domingo a sábado en UTC, la hora científica, que no cambia con los horarios
  // de verano e invierno (BiEx, 13-nov-2026; antes, hora de Bogotá). Se muestra también cuándo cambia en la hora de quien lee.
  function finSemanaMs() { const b = new Date(), hoy0 = Date.UTC(b.getUTCFullYear(), b.getUTCMonth(), b.getUTCDate()); return hoy0 + (7 - b.getUTCDay()) * 864e5; }
  function textoSemana() {
    let tuya = ""; try { tuya = new Date(finSemanaMs()).toLocaleString("es", { timeZone: (S.yo && S.yo.tz) || undefined, weekday: "long", hour: "numeric", minute: "2-digit" }).replace(",", " a las"); } catch (e) { tuya = ""; }
    return "de domingo a sábado; cambia el domingo a las 0:00 UTC" + (tuya && !/^domingo a las 0:00$/.test(tuya) ? " (en tu hora, el " + tuya + ")" : "");
  }
  function horaEn(ms, tz) { try { return new Date(ms).toLocaleString("es", { timeZone: tz, weekday: "short", hour: "numeric", minute: "2-digit" }); } catch (e) { return ""; } }
  function zonasLanzamiento(ms) {
    return h("details", { class: "jg-zonas" }, h("summary", { text: "Ver la hora en otras ciudades" }),
      h("ul", {}, CIUDADES.map(([tz, n]) => h("li", {}, h("span", { text: n }), h("b", { text: horaEn(ms, tz) })))));
  }
  const uni = (n, a, b) => h("span", {}, h("b", { text: String(n) }), h("small", { text: n === 1 ? a : b }));
  // AC4 (BiEx, 15-nov-2026): COMPONENTE REUTILIZABLE, no quitar. La cuenta regresiva del lanzamiento ya no se ve porque solo
  // se pinta en el pre-registro (cfg.ciclo «previa»), pero sirve para cualquier momento con hora fija (incursiones del Coloso,
  // eventos de las salas, misiones con preaviso, fechas especiales): cuentaAtras(ms, «Rótulo», «texto al llegar a cero»).
  // Muestra días, horas, minutos y segundos, la fecha en la hora de quien lee y, plegada, la hora en otras ciudades.
  function cuentaAtras(ms, rotulo, alTerminar) {
    if (!ms) return null;
    const UN = [["día", "días"], ["hora", "horas"], ["minuto", "minutos"], ["segundo", "segundos"]];
    const celdas = UN.map(([a, b]) => { const nb = h("b", { text: "0" }), sm = h("small", { text: b }); return { sp: h("span", {}, nb, sm), nb, sm, a, b, v: -1 }; });
    const reloj = h("span", { class: "jg-reloj", role: "timer" }, ...celdas.map((c) => c.sp));
    const el = h("div", { class: "jg-cuenta" }, h("span", { class: "jg-mini", text: (rotulo || "Lanzamiento") + ": " + fechaLarga(ms) + " (tu hora local)" }), reloj, zonasLanzamiento(ms));
    const pintar = () => {
      if (document.hidden) return true;
      const f = ms - Date.now();
      if (f <= 0) { el.replaceChildren(h("span", { text: alTerminar || "¡Escudriña ya abrió!" })); return false; }
      const vals = [Math.floor(f / 864e5), Math.floor((f % 864e5) / 36e5), Math.floor((f % 36e5) / 6e4), Math.floor((f % 6e4) / 1000)];
      for (let i = 0; i < 4; i++) {
        const c = celdas[i], v = vals[i];
        if (c.v !== v) { c.v = v; c.nb.textContent = String(v); c.sm.textContent = v === 1 ? c.a : c.b; }
      }
      return true;
    };
    pintar();
    // con segundos, como en la portada (BiEx, 10-nov-2026); se detiene con la pestaña oculta y actualiza en sitio sin reconstruir nodos
    const t = setInterval(() => { if (!el.isConnected || !pintar()) clearInterval(t); }, 1000);
    return el;
  }
  // B4 + B5 · El Coloso de la Tradición (Neon, 23-nov-2026): incursión cooperativa semanal en vivo (GET /coloso + POST /coloso/accion)
  const COLOSO_MS = Date.UTC(2026, 10, 28, 18, 0, 0);
  const COLOSO_CACHE = { d: null, t: 0 };
  const COLOSO_IMG = (window.BIEX_BASE || "") + "img/coloso-velo.webp";
  const COLOSO_HABS = [
    ["golpe", "Golpe certero", 1, 100, "Impacto constante que mantiene la presión cada pocas horas."],
    ["palabra", "Palabra afilada", 2, 260, "+30 % por carga · precisión táctica sobre las grietas."],
    ["fuerza", "Fuerza plena", 4, 620, "+55 % por carga · descarga decisiva amplificada por tu Árbol."],
  ];
  // Sigilos vectoriales de reliquia (cero cruces, cero estrellas de cinco puntas, cero rayos solares)
  function colosoSigilo(id) {
    if (id === "palabra") {
      return A.svg(
        '<path d="M12 2.5C15.6 6.8 17.5 11.4 17.5 15.6c0 2.6-1.9 4.9-5.5 5.9-3.6-1-5.5-3.3-5.5-5.9 0-4.2 1.9-8.8 5.5-13.1Z" fill="currentColor" fill-opacity=".16" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>' +
        '<path d="M12 5.4v14.8M9.3 14.2c.8-2.2 1.7-4.5 2.7-6.6 1 2.1 1.9 4.4 2.7 6.6" fill="none" stroke="currentColor" stroke-width="1.45" stroke-linecap="round" stroke-linejoin="round"/>',
        "0 0 24 24"
      );
    }
    if (id === "fuerza") {
      return A.svg(
        '<polygon points="12,2.2 19,5.1 21.8,12 19,18.9 12,21.8 5,18.9 2.2,12 5,5.1" fill="currentColor" fill-opacity=".13" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>' +
        '<polygon points="12,6.2 16.8,12 12,17.8 7.2,12" fill="currentColor" fill-opacity=".3" stroke="currentColor" stroke-width="1.45" stroke-linejoin="round"/>' +
        '<circle cx="12" cy="12" r="1.9" fill="currentColor"/>',
        "0 0 24 24"
      );
    }
    return A.svg(
      '<circle cx="12" cy="12" r="8.8" fill="none" stroke="currentColor" stroke-width="1.3" stroke-dasharray="10 4" stroke-linecap="round"/>' +
      '<polygon points="12,4.4 16.6,12 12,19.6 7.4,12" fill="currentColor" fill-opacity=".18" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>' +
      '<circle cx="12" cy="12" r="2.2" fill="currentColor"/>',
      "0 0 24 24"
    );
  }
  function faseColoso(pct, derrotado) {
    if (derrotado) return "Coloso derribado · Victoria de la comunidad";
    if (pct > 75) return "Fase I · Presencia entre la bruma";
    if (pct > 50) return "Fase II · Primeras grietas de luz";
    if (pct > 25) return "Fase III · El velo comienza a ceder";
    return "Fase IV · Al borde del derrumbe";
  }
  // Motor atmosférico HiDPI <canvas>: bruma abisal «sí y no», brasas doradas, pulso de fracturas y onda de choque al impactar.
  // Se pausa automáticamente fuera de pantalla (IntersectionObserver), en pestaña oculta, con modal abierto o en modo sin animaciones.
  function montarAtmosferaColoso(canvas, opts) {
    const ctx = canvas && canvas.getContext && canvas.getContext("2d");
    if (!ctx) return;
    const pct = Math.max(0, Math.min(100, Number(opts.pct) || 0));
    const derrotado = !!opts.derrotado;
    const danoFrac = derrotado ? 1 : (100 - pct) / 100;
    let w = 0, hC = 0, dpr = 1, raf = 0, visible = true, t0 = performance.now();
    const nBrasas = derrotado ? 14 : Math.round(26 + danoFrac * 18);
    const brasas = Array.from({ length: nBrasas }, (_, i) => ({
      x: ((i * 73.1 + 19) % 100) / 100,
      y: ((i * 41.7 + 7) % 100) / 100,
      r: 0.9 + ((i * 17) % 10) * 0.22,
      vy: 0.016 + ((i * 29) % 11) * 0.0032,
      amp: 0.008 + ((i * 13) % 7) * 0.003,
      f: 0.7 + ((i * 19) % 9) * 0.16,
      ph: i * 1.37,
      oro: i % 3 !== 0,
    }));
    const brumas = [
      { x: 0.18, y: 0.76, rx: 0.42, ry: 0.26, vx: 0.011, ph: 0.3, op: 0.42 },
      { x: 0.82, y: 0.72, rx: 0.44, ry: 0.28, vx: -0.009, ph: 2.1, op: 0.4 },
      { x: 0.48, y: 0.86, rx: 0.56, ry: 0.24, vx: 0.007, ph: 4.2, op: 0.46 },
      { x: 0.32, y: 0.52, rx: 0.34, ry: 0.26, vx: 0.008, ph: 1.4, op: 0.24 },
      { x: 0.68, y: 0.48, rx: 0.36, ry: 0.26, vx: -0.01, ph: 3.6, op: 0.24 },
    ];
    let onda = opts.impacto ? 1 : 0;
    const chispas = opts.impacto ? Array.from({ length: 36 }, (_, i) => {
      const ang = (Math.PI * 2 * i) / 36 + (i % 3) * 0.07;
      const spd = 0.16 + ((i * 23) % 15) * 0.028;
      return { x: 0.5, y: 0.56, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd - 0.04, life: 1, r: 1.3 + (i % 4) * 0.65 };
    }) : [];
    const medir = () => {
      if (!canvas.isConnected) return false;
      const rc = canvas.getBoundingClientRect();
      if (!rc.width || !rc.height) return false;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = Math.round(rc.width); hC = Math.round(rc.height);
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(hC * dpr)) {
        canvas.width = Math.round(w * dpr); canvas.height = Math.round(hC * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return true;
    };
    const dibujar = (ahora, dt) => {
      if (!w || !hC) return;
      const t = (ahora - t0) / 1000;
      ctx.clearRect(0, 0, w, hC);
      // 1) Resplandor interior de grietas en el pecho (crece al bajar la vida del Coloso)
      const cx = w * 0.5, cy = hC * 0.58;
      const pulso = 0.5 + 0.5 * Math.sin(t * (derrotado ? 0.9 : 1.7 + danoFrac * 1.4));
      const intGrieta = derrotado ? 0.14 : (0.12 + danoFrac * 0.34) * (0.72 + 0.28 * pulso);
      const rg = ctx.createRadialGradient(cx, cy, 2, cx, cy, Math.max(w, hC) * (0.2 + danoFrac * 0.14));
      rg.addColorStop(0, "rgba(255,232,162," + (intGrieta * 0.95).toFixed(3) + ")");
      rg.addColorStop(0.42, "rgba(224,142,46," + (intGrieta * 0.48).toFixed(3) + ")");
      rg.addColorStop(1, "rgba(224,142,46,0)");
      ctx.globalCompositeOperation = "screen";
      ctx.fillStyle = rg;
      ctx.fillRect(0, 0, w, hC);
      // 2) Volutas de bruma abisal oscureciendo y revelando contornos («sí y no»)
      ctx.globalCompositeOperation = "source-over";
      for (const b of brumas) {
        const bx = ((b.x + Math.sin(t * 0.35 + b.ph) * 0.09 + t * b.vx) % 1.3 + 1.3) % 1.3 - 0.15;
        const by = b.y + Math.cos(t * 0.26 + b.ph) * 0.03;
        const rad = Math.max(w * b.rx, hC * b.ry);
        const g = ctx.createRadialGradient(bx * w, by * hC, rad * 0.06, bx * w, by * hC, rad);
        g.addColorStop(0, "rgba(4,4,6," + b.op + ")");
        g.addColorStop(0.58, "rgba(7,6,6," + (b.op * 0.45).toFixed(3) + ")");
        g.addColorStop(1, "rgba(5,5,6,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.ellipse(bx * w, by * hC, w * b.rx, hC * b.ry, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      // 3) Brasas y polvo de oro ascendentes
      ctx.globalCompositeOperation = "lighter";
      for (const p of brasas) {
        p.y -= p.vy * dt;
        if (p.y < -0.05) { p.y = 1.06; p.x = (p.x + 0.31) % 1; }
        const px = (p.x + Math.sin(t * p.f + p.ph) * p.amp) * w;
        const py = p.y * hC;
        const al = Math.sin(Math.max(0, Math.min(1, p.y)) * Math.PI) * (0.38 + 0.52 * (0.5 + 0.5 * Math.sin(t * 2.4 + p.ph)));
        if (al < 0.04) continue;
        ctx.fillStyle = p.oro ? "rgba(255,224,142," + al.toFixed(3) + ")" : "rgba(232,148,66," + (al * 0.85).toFixed(3) + ")";
        ctx.beginPath();
        ctx.arc(px, py, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      // 4) Onda expansiva y lluvia radial de chispas al golpear
      if (onda > 0) {
        onda = Math.max(0, onda - dt * 1.15);
        const prog = 1 - onda;
        const rOnda = Math.max(w, hC) * (0.04 + prog * 0.52);
        ctx.strokeStyle = "rgba(255,232,162," + (onda * 0.85).toFixed(3) + ")";
        ctx.lineWidth = Math.max(1.2, 4.5 * onda);
        ctx.beginPath();
        ctx.arc(cx, cy, rOnda, 0, Math.PI * 2);
        ctx.stroke();
        const flash = ctx.createRadialGradient(cx, cy, 0, cx, cy, rOnda * 0.8);
        flash.addColorStop(0, "rgba(255,244,205," + (onda * 0.42).toFixed(3) + ")");
        flash.addColorStop(1, "rgba(255,212,112,0)");
        ctx.fillStyle = flash;
        ctx.fillRect(0, 0, w, hC);
      }
      for (const ch of chispas) {
        if (ch.life <= 0) continue;
        ch.x += ch.vx * dt; ch.y += ch.vy * dt; ch.vy += 0.24 * dt; ch.life -= dt * 1.05;
        if (ch.life <= 0) continue;
        ctx.fillStyle = "rgba(255,238,180," + ch.life.toFixed(3) + ")";
        ctx.beginPath();
        ctx.arc(ch.x * w, ch.y * hC, ch.r * (0.5 + 0.5 * ch.life), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";
    };
    let ult = performance.now();
    const limpiar = () => {
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      if (io) io.disconnect();
      if (ro) ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
    const paso = (ahora) => {
      raf = 0;
      if (!canvas.isConnected) return limpiar();
      if (!visible || document.hidden) return;
      const dt = Math.min(0.05, Math.max(0.008, (ahora - ult) / 1000));
      ult = ahora;
      if (!document.documentElement.classList.contains("con-modal") && !document.documentElement.classList.contains("desplazando")) {
        dibujar(ahora, dt);
      }
      raf = requestAnimationFrame(paso);
    };
    const arrancar = () => {
      if (!canvas.isConnected || !medir()) return;
      if (sinAnim()) { dibujar(performance.now() + 900, 0.016); return; }
      if (!raf && visible && !document.hidden) { ult = performance.now(); raf = requestAnimationFrame(paso); }
    };
    const onVis = () => {
      if (!canvas.isConnected) return limpiar();
      if (document.hidden) { if (raf) { cancelAnimationFrame(raf); raf = 0; } }
      else arrancar();
    };
    const io = window.IntersectionObserver ? new IntersectionObserver((es) => {
      visible = !!(es[0] && es[0].isIntersecting);
      if (visible) arrancar(); else if (raf) { cancelAnimationFrame(raf); raf = 0; }
    }, { threshold: 0.04 }) : null;
    if (io) io.observe(canvas);
    const ro = window.ResizeObserver ? new ResizeObserver(() => { if (medir() && sinAnim()) dibujar(performance.now() + 900, 0.016); }) : null;
    if (ro) ro.observe(canvas);
    document.addEventListener("visibilitychange", onVis);
    requestAnimationFrame(arrancar);
  }
  function avisoPrelanzamientoColoso(compacto) {
    if (S.yo && S.yo.lanzado) return null;
    const gemSvg = A.svg('<polygon points="12,3 20,12 12,21 4,12" fill="currentColor" fill-opacity=".22" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><circle cx="12" cy="12" r="2" fill="currentColor"/>', "0 0 24 24");
    return h("div", { class: "jg-col-pre", role: "note" },
      h("span", { class: "jg-col-pre-ico", "aria-hidden": "true" }, gemSvg),
      h("div", {},
        h("b", { text: "Prelanzamiento activo · " }),
        compacto
          ? "Quienes participen ya suman recompensas reales y conservarán de forma aleatoria " + textoConserva() + " al abrir el juego oficial."
          : "Quienes participen desde ahora contra El Coloso ya ganan experiencia, dracmas y aporte real; al empezar el juego oficial conservarán, de forma aleatoria, " + textoConserva() + " de estas recompensas, igual que en el resto de la práctica."));
  }
  function parseCitaColoso(cita) {
    const m = /^([1-3A-Z]{3})\s+(\d{1,3}):(\d{1,3})(?:-(\d{1,3}))?/.exec(String(cita || "").trim());
    return m ? { lib: m[1], cap: +m[2], v1: +m[3], v2: m[4] ? +m[4] : +m[3] } : null;
  }
  function bloqueCitaColoso(cita) {
    const p = parseCitaColoso(cita);
    if (!p) return null;
    const refTxt = nombreLibro(p.lib) + " " + p.cap + ":" + p.v1 + (p.v2 > p.v1 ? "–" + p.v2 : "");
    const enlace = "#/" + p.lib + "/" + p.cap + "/l/" + p.v1;
    const caja = h("div", { class: "jg-col-cita" },
      h("a", { href: enlace, text: refTxt + " ›" }),
      h("span", { class: "jg-mini", text: "Cargando verso en BiEx…" }));
    if (A.versos) {
      A.versos(p.lib, p.cap, p.v1, p.v2).then((ls) => {
        if (!caja.isConnected) return;
        if (!ls || !ls.length) return caja.replaceChildren(h("a", { href: enlace, text: "Leer " + refTxt + " en BiEx ›" }));
        caja.replaceChildren(h("a", { href: enlace, text: refTxt + " · Lectura BiEx ›" }), ...ls.map(([, nodo]) => h("div", {}, nodo)));
      }).catch(() => { if (caja.isConnected) caja.replaceChildren(h("a", { href: enlace, text: "Leer " + refTxt + " en BiEx ›" })); });
    }
    return caja;
  }
  const premioColosoTxt = (p) => {
    if (!p) return "";
    if (typeof p === "string") return p;
    const ps = [];
    if (p.xp) ps.push("+" + fmt(p.xp) + " de experiencia");
    if (p.dr) ps.push("+" + fmt(p.dr) + " dracmas");
    if (p.desc) ps.push(p.desc);
    return ps.join(" · ");
  };
  async function cargarColoso(forzar) {
    if (!S.token) return null;
    if (!forzar && COLOSO_CACHE.d && Date.now() - COLOSO_CACHE.t < 18e3) return COLOSO_CACHE.d;
    const r = await pedir("/coloso");
    if (!r || r.error) return null;
    COLOSO_CACHE.d = r; COLOSO_CACHE.t = Date.now();
    return r;
  }
  function tarjetaColoso(compacta) {
    const ms = (S.cfg && S.cfg.colosoEn) || COLOSO_MS;
    const falta = ms - Date.now();
    const zona = h("div", { class: "jg-col-live" });
    const card = h("section", { class: "jg-coloso" + (compacta ? " comp" : "") },
      h("div", { class: "jg-coloso-cab" },
        h("span", { class: "jg-coloso-nov" }, h("i", { class: "jg-coloso-dot", "aria-hidden": "true" }), h("span", { text: falta > 0 ? "Novedad · Próximo evento" : "Incursión cooperativa" })),
        h("span", { class: "jg-coloso-chip", text: falta > 0 ? "Sábado 28 nov · 18:00 UTC" : "Desafío semanal" })),
      h("h2", { class: "jg-coloso-h", text: "El Coloso de la Tradición" }),
      zona);
    const prevArte = (subt, etiq) => h("div", { class: "jg-col-prev" },
      h("img", { src: COLOSO_IMG, alt: "Presencia velada de El Coloso de la Tradición entre bruma oscura", loading: "lazy", decoding: "async" }),
      h("div", { class: "jg-col-prev-cap" },
        h("strong", { text: subt || "El Coloso de la Tradición" }),
        etiq ? h("span", { text: etiq }) : null));
    const pintarCuenta = () => {
      zona.replaceChildren(
        prevArte("Presencia entre la bruma", "Incursión cooperativa"),
        h("p", { class: "jg-coloso-p", text: compacta
          ? "Primer desafío comunitario de Escudriña. Fortalece tu ser interior antes de la apertura."
          : "Toda la comunidad frente al primer gran desafío conjunto de Escudriña. Fortalece tu ser interior, tu armadura y el fruto del espíritu antes de la apertura." }),
        cuentaAtras(ms, "Apertura", "¡El Coloso de la Tradición ha despertado!"),
        S.token ? h("div", { class: "jg-col-cta-row" }, h("a", { class: "btn chico oro", href: "#/escudrina/coloso" }, h("span", { text: "Ver la incursión" }), A.svg(A.ICO.der))) : null);
    };
    const pintarVivo = (c) => {
      if (!zona.isConnected) return;
      if (!c || (c.estado !== "activo" && c.estado !== "derrotado")) return pintarCuenta();
      const derrotado = c.estado === "derrotado" || (c.vida | 0) <= 0;
      const vida = Math.max(0, c.vida | 0), vmax = Math.max(1, c.vidaMax | 0);
      const pct = Math.max(0, Math.min(100, (100 * vida) / vmax));
      const jefe = c.jefe || {};
      const nov = card.querySelector(".jg-coloso-nov span"), ch = card.querySelector(".jg-coloso-chip");
      if (nov) nov.textContent = derrotado ? "Coloso derribado · Victoria común" : "Incursión activa · en vivo";
      if (ch) ch.textContent = c.cargas != null ? (c.cargas | 0) + " / " + (c.cargasMax || 6) + " cargas" : (c.semana || "Semana actual");
      zona.replaceChildren(
        prevArte(jefe.nombre || "El Coloso de la Tradición", derrotado ? "Derribado" : pct.toFixed(0) + " %"),
        jefe.ensenanza && !compacta ? h("p", { class: "jg-coloso-p", text: jefe.ensenanza }) : null,
        h("div", { class: "jg-col-hp" },
          h("div", { class: "jg-col-hp-cab" }, h("span", { text: derrotado ? "Coloso derribado" : "Resistencia del Coloso" }), h("b", { text: fmt(vida) + " / " + fmt(vmax) })),
          h("div", { class: "jg-col-hp-bar", role: "progressbar", "aria-valuemin": "0", "aria-valuemax": String(vmax), "aria-valuenow": String(vida), "aria-label": "Vida restante de El Coloso" },
            h("i", { style: "width:" + pct.toFixed(1) + "%" }),
            h("span", { class: "jg-col-hp-m", style: "left:25%", "aria-hidden": "true" }),
            h("span", { class: "jg-col-hp-m", style: "left:50%", "aria-hidden": "true" }),
            h("span", { class: "jg-col-hp-m", style: "left:75%", "aria-hidden": "true" }))),
        avisoPrelanzamientoColoso(true),
        h("div", { class: "jg-col-cta-row" },
          h("span", { class: "jg-mini", text: plural(c.participantes | 0, "lector combate", "lectores combaten") + (c.miAporte ? " · tu aporte: " + fmt(c.miAporte) : "") + (c.fin && !derrotado ? " · cierra en " + restaTexto(c.fin) : "") }),
          h("a", { class: "btn oro chico", href: "#/escudrina/coloso" }, h("span", { text: derrotado ? "Ver victoria y enseñanza" : "Entrar a la batalla" }), A.svg(A.ICO.der))));
    };
    pintarCuenta();
    if (S.token) cargarColoso(false).then(pintarVivo);
    return card;
  }
  async function pintarColoso(cont) {
    document.title = "El Coloso de la Tradición · Escudriña · BiEx";
    const zona = h("div", { class: "jg jg-col-arena" }, h("p", { class: "cargando", text: "Despertando la incursión…" }));
    marco(cont, cabSub("El Coloso de la Tradición", "Batalla táctica cooperativa de toda la comunidad · tu poder del Árbol amplifica cada acción manual.", "#/escudrina/mundo"), zona);
    const pintar = (c, ultDano) => {
      if (cont !== S.cont || !zona.isConnected) return;
      if (!c) {
        const ms = (S.cfg && S.cfg.colosoEn) || COLOSO_MS;
        return zona.replaceChildren(tarjeta("Incursión en preparación", ico("mundo"),
          h("p", { text: "El Coloso de la Tradición se activa en ventanas semanales para toda la comunidad. Mientras tanto, fortalece tus atributos, tu armadura y tu fruto en Tu Árbol." }),
          cuentaAtras(ms, "Próxima apertura", "¡El Coloso de la Tradición ha despertado!"),
          h("div", { class: "jg-acciones" }, h("a", { class: "btn oro", href: "#/escudrina/arbol" }, ico("arbol"), h("span", { text: "Fortalecer mi Árbol" })))));
      }
      const derrotado = c.estado === "derrotado" || (c.vida | 0) <= 0;
      const vida = Math.max(0, c.vida | 0), vmax = Math.max(1, c.vidaMax | 0);
      const pct = Math.max(0, Math.min(100, (100 * vida) / vmax));
      const jefe = c.jefe || {};
      const poderYo = (S.yo && S.yo.av && S.yo.av.poder) || 0;
      const mult = 1 + poderYo / 2000;
      const cargas = Math.max(0, c.cargas | 0), cmax = Math.max(1, c.cargasMax || 6);
      const lienzoFx = h("canvas", { class: "jg-col-fx", "aria-hidden": "true" });
      const artWrap = h("div", { class: "jg-col-art-w" + (derrotado ? " caido" : "") + (ultDano ? " golpe" : "") },
        h("img", { class: "jg-col-art", src: COLOSO_IMG, alt: "Presencia velada y monumental de El Coloso de la Tradición entre bruma oscura y grietas doradas", decoding: "async" }),
        h("div", { class: "jg-col-velo a", "aria-hidden": "true" }),
        h("div", { class: "jg-col-velo b", "aria-hidden": "true" }));
      const premioTxt = premioColosoTxt(c.premio);
      const stage = h("div", { class: "jg-col-stage" },
        artWrap,
        lienzoFx,
        h("div", { class: "jg-col-vig", "aria-hidden": "true" }),
        h("div", { class: "jg-col-top" },
          h("span", { class: "jg-col-badge" }, h("i", { class: "jg-coloso-dot", "aria-hidden": "true" }), h("span", { text: derrotado ? "Coloso derribado" : "Incursión activa · en vivo" })),
          c.semana ? h("span", { class: "jg-col-badge tenue", text: "Semana " + c.semana }) : null),
        ultDano ? h("span", { class: "jg-col-dano", text: "−" + fmt(ultDano) }) : null,
        h("div", { class: "jg-col-tit-wrap" },
          h("span", { class: "jg-col-fase", text: faseColoso(pct, derrotado) }),
          h("h2", { text: jefe.nombre || "El Coloso de la Tradición" })));
      const hud = h("div", { class: "jg-col-hud" },
        h("div", { class: "jg-col-hp" },
          h("div", { class: "jg-col-hp-cab" },
            h("span", { text: derrotado ? "¡Derribado entre todos!" : "Resistencia restante · " + pct.toFixed(1).replace(".", ",") + " %" }),
            h("b", { text: fmt(vida) + " / " + fmt(vmax) })),
          h("div", { class: "jg-col-hp-bar", role: "progressbar", "aria-valuemin": "0", "aria-valuemax": String(vmax), "aria-valuenow": String(vida), "aria-label": "Vida del Coloso" },
            h("i", { style: "width:" + pct.toFixed(1) + "%" }),
            h("span", { class: "jg-col-hp-m", style: "left:25%", "aria-hidden": "true" }),
            h("span", { class: "jg-col-hp-m", style: "left:50%", "aria-hidden": "true" }),
            h("span", { class: "jg-col-hp-m", style: "left:75%", "aria-hidden": "true" }))),
        h("div", { class: "jg-col-stats" },
          h("div", { class: "jg-col-st" }, h("b", { text: fmt(c.participantes | 0) }), h("span", { text: (c.participantes | 0) === 1 ? "Lector" : "Lectores" })),
          h("div", { class: "jg-col-st" }, h("b", { text: fmt(c.miAporte | 0) }), h("span", { text: "Tu aporte" })),
          h("div", { class: "jg-col-st" }, h("b", { text: "×" + mult.toFixed(2).replace(".", ",") }), h("span", { text: "Bono Árbol" })),
          h("div", { class: "jg-col-st" }, h("b", { text: derrotado ? "Cerrado" : (c.fin ? restaTexto(c.fin) : "Activo") }), h("span", { text: derrotado ? "Estado" : "Restante" }))),
        premioTxt ? h("div", { class: "jg-col-premio" }, h("span", { text: "Recompensa por victoria:" }), h("b", { text: premioTxt })) : null);
      const escena = h("section", { class: "jg-col-escena" }, stage, hud);
      const avisoPre = avisoPrelanzamientoColoso(false);
      // B5 · Enseñanza del jefe + cita real de BiEx
      const ens = jefe.ensenanza || jefe.cita ? h("section", { class: "jg-col-ens" },
        h("span", { class: "eyebrow", text: "Enseñanza de esta incursión" }),
        jefe.ensenanza ? h("p", { text: jefe.ensenanza }) : null,
        jefe.cita ? bloqueCitaColoso(jefe.cita) : null) : null;
      // B4 · Cargas y habilidades manuales estratégicas de reliquia
      const actuar = async (hab, bt) => {
        if (bt) bt.disabled = true;
        const r = await pedir("/coloso/accion", { metodo: "POST", cuerpo: { hab } });
        if (r.error) {
          if (bt) bt.disabled = false;
          return A.avisar(mensaje(r));
        }
        vibrar([14, 26, 22]); sonar("chispa");
        const dano = Number(r.dano || r.impacto || 0);
        if (r.yo) actualizarYo(r.yo);
        const nuevo = Object.assign({}, c, r.coloso || r);
        if (r.vida != null) nuevo.vida = r.vida;
        if (r.cargas != null) nuevo.cargas = r.cargas;
        if (r.cargaEn != null) nuevo.cargaEn = r.cargaEn;
        if (r.miAporte != null) nuevo.miAporte = r.miAporte;
        if (r.estado) nuevo.estado = r.estado;
        if (Array.isArray(r.top)) nuevo.top = r.top;
        COLOSO_CACHE.d = nuevo; COLOSO_CACHE.t = Date.now();
        A.avisar(dano ? "¡Impacto de " + fmt(dano) + " contra El Coloso!" : "Acción registrada contra El Coloso");
        pintar(nuevo, dano || 1);
        const escEl = zona.querySelector(".jg-col-escena");
        if (escEl && escEl.getBoundingClientRect().top < 40) escEl.scrollIntoView({ behavior: sinAnim() ? "auto" : "smooth", block: "start" });
      };
      const habsFuente = Array.isArray(c.habilidades) && c.habilidades.length
        ? c.habilidades.map((x) => [x.id || x.hab, x.nombre || x.id, x.cargas || x.costo || 1, x.dano || x.base || 100, x.desc || ""])
        : COLOSO_HABS;
      const efEtiqueta = (cost) => cost >= 4 ? "+55 % · Decisivo" : cost >= 2 ? "+30 % / carga" : "Presión constante";
      const comb = !derrotado ? h("section", { class: "jg-col-panel" },
        h("div", { class: "jg-col-cg-cab" },
          h("div", { class: "jg-col-cg-tit" },
            h("span", { text: "Conducto de energía táctica" }),
            h("b", { text: cargas + " de " + cmax + " cargas listas" })),
          h("div", { class: "jg-col-cg-sub" },
            h("span", { class: "jg-col-mult", text: "Poder " + fmt(poderYo) + " · ×" + mult.toFixed(2).replace(".", ",") }),
            h("span", { text: cargas >= cmax ? "Al máximo · elige tu golpe" : c.cargaEn ? "Próxima en " + restaTexto(c.cargaEn) : "+1 cada 3 h" }))),
        h("div", { class: "jg-col-crist", "aria-hidden": "true" }, Array.from({ length: cmax }, (_, i) => h("span", { class: "jg-col-cg-c" + (i < cargas ? " on" : "") }, h("i", {})))),
        h("div", { class: "jg-col-habs" }, habsFuente.map(([id, nom, cost, base, desc], idx) => {
          const est = Math.round(base * mult);
          const lista = cargas >= cost;
          const faltaCg = Math.max(0, cost - cargas);
          const tier = id === "fuerza" || cost >= 4 ? "t3" : id === "palabra" || cost >= 2 ? "t2" : ("t" + Math.min(3, idx + 1));
          const dots = h("span", { class: "jg-col-hab-dots", "aria-hidden": "true" }, Array.from({ length: Math.min(6, cost) }, () => h("i", {})));
          return h("button", { class: "jg-col-hab " + tier + (lista ? " listo" : ""), type: "button", disabled: !lista, onclick: (e) => actuar(id, e.currentTarget) },
            h("div", { class: "jg-col-hab-top" },
              h("span", { class: "jg-col-sig", "aria-hidden": "true" }, colosoSigilo(id)),
              h("span", { class: "jg-col-hab-id" },
                h("b", { text: nom }),
                h("span", { class: "jg-col-hab-cost" }, dots, h("span", { text: plural(cost, "carga", "cargas") })))),
            h("div", { class: "jg-col-hab-mid" },
              h("span", { class: "jg-col-hab-dmg", text: "~" + fmt(est) }),
              h("span", { class: "jg-col-hab-ef", text: efEtiqueta(cost) })),
            h("span", { class: "jg-col-hab-desc", text: desc || "Escalado directamente con tu poder del Árbol." }),
            h("span", { class: "jg-col-hab-go" },
              h("span", { text: lista ? "Desatar acción" : "Faltan " + plural(faltaCg, "carga", "cargas") }),
              h("span", { "aria-hidden": "true", text: lista ? "›" : "·" })));
        }))) : null;
      const topL = Array.isArray(c.top) ? c.top : [];
      const topCard = topL.length ? tarjeta("Mayores aportes de la semana", ico("liga"),
        h("ol", { class: "jg-lista mini" }, topL.slice(0, 15).map((x, idx) => {
          const ap = x.apodo || x.a || "Lector", [l, col] = embDe(x.emb || x.e);
          const pts = x.aporte != null ? x.aporte : (x.dano != null ? x.dano : (x.pts | 0));
          return h("li", { class: "jg-fila" + (x.yo || (S.yo && ap === S.yo.apodo) ? " yo" : "") },
            h("span", { class: "p", text: String(idx + 1) }),
            emblema(l, col, x.marco || x.m || 0, x.foto || x.f),
            h("span", { class: "n" }, nombreClicable(ap), h("small", { text: x.nivel ? "nivel " + x.nivel + (x.poder != null ? " · poder " + fmt(x.poder) : "") : "participante" })),
            h("span", { class: "x", text: fmt(pts) }));
        }))) : null;
      zona.replaceChildren(...[escena, avisoPre, comb, ens, topCard].filter(Boolean));
      montarAtmosferaColoso(lienzoFx, { pct, derrotado, impacto: ultDano > 0 });
    };
    const d = await cargarColoso(true);
    pintar(d, 0);
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
  // AF19 (BiEx, 21 y 22-nov-2026): ya no cada 2 meses. La primera Designación se abre al llegar a 120 lectores constantes (con su
  // barra a la vista) y luego hay una por cada 120 lectores constantes nuevos, con al menos 60 días entre una y otra. «Lector
  // constante»: cuenta asegurada y 14 días con lectura dentro de 60 días seguidos; una vez alcanzado cuenta para siempre, así que
  // la barra nunca retrocede.
  function avanceDesignacion(y, resumen) {
    const et = h("span", { class: "jg-dg-t", text: "Primera Designación" }), num = h("b", { text: "…" }), barra = h("i", { style: "width:0%" });
    const nota = h("p", { class: "jg-mini jg-dg-n", text: "Lectores constantes en toda la comunidad." }), yo = h("p", { class: "jg-mini jg-dg-yo" });
    if (y) yo.textContent = y.cte ? "Tú ya cuentas como lector constante." : y.cteL && !y.asegurado ? "Ya cumples los días: asegura tu cuenta para contar como lector constante."
      : "Tú: " + plural(y.cteN | 0, "día", "días") + " con lectura en tus últimos 60 (la meta es " + (y.cteMeta || 14) + ").";
    const el = h("div", { class: "jg-dg" }, h("div", { class: "jg-dg-f" }, et, num), h("div", { class: "jg-barra oro", "aria-hidden": "true" }, barra), nota, y ? yo : null);
    pedir("/designacion", { sin: true, guardable: true }).then((d) => {
      if (!d || d.error || !d.paso) { el.hidden = true; return; }
      et.textContent = d.hechas ? "Designación n.º " + (d.hechas + 1) : "Primera Designación";
      num.textContent = fmt(Math.min(d.nuevos, d.paso)) + " de " + fmt(d.paso);
      barra.style.width = Math.max(1.5, Math.min(100, (100 * d.nuevos) / d.paso)).toFixed(1) + "%";
      nota.textContent = d.nuevos >= d.paso && d.desde && d.desde > Date.now()
        ? "Meta alcanzada: la Designación se abre el " + new Date(d.desde).toLocaleDateString(LOC_ES, { day: "numeric", month: "long", year: "numeric" }) + " (al menos " + d.minDias + " días entre una y otra)."
        : d.hechas ? "Lectores constantes nuevos desde la Designación anterior." : "Lectores constantes en toda la comunidad.";
      if (resumen) resumen.textContent = "Dos PDF exclusivos por cada " + fmt(d.paso) + " lectores constantes · " + fmt(Math.min(d.nuevos, d.paso)) + " de " + fmt(d.paso);
    });
    return el;
  }
  function tarjetaColeccion(y, plegable) {
    const ico0 = () => h("span", { class: "jg-col-ico", "aria-hidden": "true" }, A.svg('<path d="M6 4.5h10.5a2.5 2.5 0 0 1 0 5H8.5v10a2 2 0 0 1-4 0V6.5a2 2 0 0 1 1.5-2z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M8.5 9.5h9v8.5a2 2 0 0 1-2 2H6.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M11 13h4.5M11 16h3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>'));
    const texto = "En cada Designación se entregan dos Rollos: PDF exclusivos y numerados de un libro de la Nueva Voluntad, a nombre de quien los recibe y con firma criptográfica. «La Designación» los asigna aleatoriamente, con un método que cualquiera puede comprobar y que nadie puede inclinar: uno entre los 24 primeros de cada rango del período y otro para cualquiera desde el puesto 25 (con cuenta asegurada y al menos 14 días de lectura en el período).";
    const regla = "La primera Designación se abre al llegar a 120 lectores constantes y después hay una por cada 120 lectores constantes nuevos, con al menos 60 días entre una y otra. Lector constante: cuenta asegurada y 14 días con lectura dentro de 60 días seguidos; una vez alcanzado, cuenta para siempre.";
    if (plegable) {
      const res = h("small", { text: "Dos PDF exclusivos por cada 120 lectores constantes" });
      return h("details", { class: "jg-coleccion plegable" }, h("summary", {}, ico0(), h("span", {}, h("b", { text: "Rollos de colección" }), res), h("i", { class: "jg-col-v", "aria-hidden": "true" })),
        h("div", { class: "jg-col-c" }, avanceDesignacion(y, res), h("p", { text: regla }), h("p", { text: texto })));
    }
    return h("div", { class: "jg-coleccion" },
      h("div", { class: "jg-col-cab" }, ico0(), h("div", {}, h("b", { text: "Rollos de colección" }), h("small", { text: "Dos PDF exclusivos y numerados por cada Designación" }))),
      h("div", { class: "jg-col-c" }, avanceDesignacion(y), h("p", { text: regla }), h("p", { class: "jg-mini", text: texto })));
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
  // «Por generación» (BiEx, 13-nov-2026): región (departamento o estado), país, nivel y, si es Primicia, su número
  const datosGen = (n) => [n.re, n.pa ? nombrePais(n.pa) : "", n.nv ? "nivel " + n.nv : "", n.pr ? "Primicia" + (n.pn ? " n.º " + fmt(n.pn) : "") : ""].filter(Boolean).join(" · ");
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
  let FOTO_N = 0, IO_ARBOL = null, MO_MODAL = null;
  function observarModal() {
    if (MO_MODAL || !window.MutationObserver) return;
    MO_MODAL = new MutationObserver(() => {
      const ab = document.documentElement.classList.contains("con-modal");
      for (const el of document.querySelectorAll("#vista .ap-arbol")) {
        for (const a of el._anims || []) { try { if (!ab && el._vis !== false) a.play(); else a.pause(); } catch (er) { /* nada */ } }
      }
      if (!ab) for (const el of document.querySelectorAll("#vista .ser-in")) if (el._desp) el._desp();
    });
    MO_MODAL.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  }
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
      // (BiEx, 13-nov-2026) la raíz termina DENTRO de su medallón (opaco, se dibuja encima): así su comienzo nunca asoma por un
      // lado del círculo, llegue con el ángulo que llegue; la savia sigue la misma curva y nace en el borde del medallón.
      const ini = "M" + (488 + i * 5) + " 800C" + f1(470 + (x - 500) * 0.25) + " " + (880 + rnd() * 30).toFixed(0) + " " + f1(x + (500 - x) * 0.25) + " " + (900 + rnd() * 30).toFixed(0) + " ";
      const d = ini + x + " " + (yy - 12), dS = ini + x + " " + (yy - 46);
      raices += '<path d="' + d + '" stroke="' + col + '" stroke-width="' + f1(w + 10) + '" opacity=".14" fill="none" stroke-linecap="round"/><path d="' + d + '" stroke="' + col + '" stroke-width="' + f1(w) + '" opacity="' + op + '" fill="none" stroke-linecap="round"/>';
      raizD.push([d, col, val, x, yy]); // (AF28, 21-nov-2026) la savia sigue la MISMA curva dibujada (dS, con otro final, se apartaba de ella)
      med += '<g class="ap-med" style="color:' + col + '"><circle cx="' + x + '" cy="' + yy + '" r="44" fill="#0d0b08" stroke="' + col + '" stroke-width="3" stroke-opacity="' + op + '"/><circle cx="' + x + '" cy="' + yy + '" r="38" fill="' + col + '" opacity=".1"/>' +
        '<g transform="translate(' + (x - 15) + " " + (yy - 30) + ') scale(1.25)">' + ATR_ICO[k] + '</g><text x="' + x + '" y="' + (yy + 25) + '" text-anchor="middle" font-size="25" font-weight="600" fill="currentColor" style="font-family:var(--f-ui)">' + val + '</text>' +
        '<text x="' + x + '" y="' + (yy + 76) + '" text-anchor="middle" font-size="' + (k === "r" ? 19 : 22) + '" fill="var(--tinta-2)" style="font-family:var(--f-ui);letter-spacing:.04em">' + nombres[k] + "</text></g>";
    });
    // corazón: emblema o foto, aro del nivel
    const e = y.emb || {}, col = COLORES[e.c] || COLORES[0], p = y.xpSig ? Math.max(0, Math.min(1, y.xpNivel / y.xpSig)) : 0, foto = y.foto ? fotoUrl(y.inv + "." + y.foto) : "", id = "apf" + (++FOTO_N);
    const txtPoder = fmt(av.poder | 0), wPod = Math.max(166, 138 + 15.5 * txtPoder.length);
    const corazon = '<circle cx="500" cy="640" r="96" fill="url(#ap-halo2)"/><circle cx="500" cy="640" r="74" fill="#0d0b08" stroke="' + col + '" stroke-width="4"/>' +
      (foto ? '<clipPath id="' + id + '"><circle cx="500" cy="640" r="68"/></clipPath><image href="' + esc(foto) + '" x="432" y="572" width="136" height="136" clip-path="url(#' + id + ')" preserveAspectRatio="xMidYMid slice"/>'
        : '<text x="500" y="' + (/[֐-׿]/.test(e.l || "") ? 664 : 670) + '" text-anchor="middle" font-size="78" fill="' + col + '" style="font-family:' + (/[֐-׿]/.test(e.l || "") ? "'Frank Ruhl Libre'," : "") + "'BiEx Texto','Gentium Book Plus',serif\">" + esc(e.l || "α") + "</text>") +
      '<circle cx="500" cy="640" r="86" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="7"/><circle class="ap-aro" cx="500" cy="640" r="86" fill="none" stroke="url(#ap-oro)" stroke-width="7" stroke-linecap="round" pathLength="100" stroke-dasharray="' + (p * 100).toFixed(1) + ' 100" transform="rotate(-90 500 640)"/>' +
      '<g transform="translate(500 752)"><rect x="' + (-wPod / 2).toFixed(1) + '" y="-20" width="' + wPod.toFixed(1) + '" height="40" rx="20" fill="url(#ap-oro)"/><text y="9" text-anchor="middle" font-size="25" font-weight="700" fill="#16120b" style="font-family:var(--f-ui);letter-spacing:.06em">PODER ' + txtPoder + "</text></g>";
    // BiEx (23-nov-2026): el medallón bajo el corazón muestra el poder actual (en vez de repetir el nivel que ya aparece debajo)
    // Vida del árbol fuera del SVG (BiEx, 10-nov-2026: «está borroso»): el dibujo queda quieto y se rasteriza una sola vez a la
    // densidad real; los destellos de la copa, los frutos y las motas son capas pequeñas que solo cambian opacidad y posición
    // (las mueve el compositor, sin volver a pintar el árbol) y se detienen cuando el árbol sale de la pantalla.
    // Neon (23-nov-2026): capas GPU recortadas (~66 → ~22) preservando exactamente la secuencia rnd() para desplazamiento sedoso en móvil.
    const pc = (x, yy) => "left:" + (x / 10).toFixed(2) + "%;top:" + (yy / 11.1).toFixed(2) + "%";
    const vida = h("div", { class: "ap-vida", "aria-hidden": "true" }, h("i", { class: "ap-copa-v" }));
    const paso = Math.max(1, Math.floor(brillos.length / 6));
    for (let i = 0, n = 0; i < brillos.length && n < 6; i += paso, n++) { const [x, yy, r, dl] = brillos[i];
      vida.append(h("i", { class: "ap-gl", style: pc(x, yy) + ";--s:" + (1.6 + r / 7).toFixed(2) + ";--d:" + dl.toFixed(2) + "s;--t:" + (4.6 + (i % 5) * 0.7).toFixed(1) + "s" })); }
    frutXY.slice(0, 4).forEach(([x, yy], i) => vida.append(h("i", { class: "ap-gl fr", style: pc(x, yy) + ";--s:4.2;--d:" + (i * 0.9).toFixed(1) + "s;--t:6.5s" })));
    for (let i = 0; i < 8; i++) {
      const stMo = pc(80 + rnd() * 840, 160 + rnd() * 700) + ";--d:" + (rnd() * 9).toFixed(2) + "s;--t:" + (7 + rnd() * 6).toFixed(1) + "s";
      if (i < 5) vida.append(h("i", { class: "ap-mo", style: stMo }));
    }
    // V22 + Neon (23-nov-2026): la granada del fruto del espíritu anidada más abajo en el corazón de la copa, sostenida por su
    // tallo al ramaje central y abrazada por brotes dorados en primer plano sin tapar ninguna de las nueve cámaras
    const GR_X = 500, GR_Y = 316, gr = granadaSVG(av.fr || {}, 66);
    const ramita = '<ellipse cx="500" cy="322" rx="75" ry="70" fill="#120a03" opacity=".48"/>' +
      '<path d="M500 374C498 398 494 422 496 446" fill="none" stroke="url(#ap-tronco)" stroke-width="7.5" stroke-linecap="round"/>' +
      '<path d="M501 376C500 398 496 420 498 442" fill="none" stroke="#f5d37a" stroke-opacity=".38" stroke-width="1.5" stroke-linecap="round"/>';
    const ramasFrente = '<g class="ap-gr-frente" pointer-events="none">' +
      '<path d="M406 394C428 376 448 368 474 376" fill="none" stroke="url(#ap-tronco)" stroke-width="5.6" stroke-linecap="round"/>' +
      '<path d="M408 392C429 375 448 368 472 375" fill="none" stroke="#f7dc8e" stroke-opacity=".38" stroke-width="1.2" stroke-linecap="round"/>' +
      '<path d="M432 374C427 359 437 348 450 356C445 366 439 371 432 374Z" fill="url(#ap-oro)" stroke="#4a3210" stroke-opacity=".65" stroke-width=".95"/>' +
      '<path d="M451 372C453 358 466 353 475 363C467 369 459 372 451 372Z" fill="#e5ba54" stroke="#4a3210" stroke-opacity=".65" stroke-width=".95"/>' +
      '<path d="M445 376C456 385 468 388 477 380C468 374 456 372 445 376Z" fill="#c79434" stroke="#4a3210" stroke-opacity=".62" stroke-width=".9"/>' +
      '<path d="M594 260C574 269 558 269 540 258" fill="none" stroke="url(#ap-tronco)" stroke-width="4.6" stroke-linecap="round"/>' +
      '<path d="M592 259C574 267 558 267 542 258" fill="none" stroke="#f7dc8e" stroke-opacity=".36" stroke-width="1" stroke-linecap="round"/>' +
      '<path d="M570 265C566 252 552 248 547 257C556 263 564 266 570 265Z" fill="url(#ap-oro)" stroke="#4a3210" stroke-opacity=".65" stroke-width=".9"/>' +
      '<path d="M558 266C564 278 576 280 583 271C574 265 566 264 558 266Z" fill="#d6a540" stroke="#4a3210" stroke-opacity=".62" stroke-width=".9"/>' +
      '</g>';
    vida.append(h("i", { class: "ap-gr-v", style: pc(GR_X, GR_Y) + ";--o:" + Math.min(1, 0.35 + gr.tot / 40).toFixed(2) }));
    const el = A.svg('<defs>' + gr.defs + '<radialGradient id="ap-halo" cx=".5" cy=".42" r=".55"><stop offset="0" stop-color="#f5c64e" stop-opacity=".34"/><stop offset=".55" stop-color="#b9862f" stop-opacity=".1"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>' +
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
      ramita + '<g class="ap-granada" transform="translate(' + GR_X + " " + GR_Y + ')">' + gr.cuerpo + "</g>" + ramasFrente +
      '<line x1="40" y1="812" x2="960" y2="812" stroke="url(#ap-oro)" stroke-opacity=".35" stroke-width="2"/>' + raices + med + corazon, "0 0 1000 1110");
    el.setAttribute("class", "ap-svg"); el.setAttribute("role", "img");
    el.setAttribute("aria-label", "Tu árbol: poder " + txtPoder + ", nivel " + nivel + ", " + Math.round(p * 100) + " % hacia el siguiente; " + claves.map((k) => nombres[k] + " " + (ef[k] || 0)).join(", ") + (frutos ? "; " + plural(frutos, "fruto de tu siembra", "frutos de tu siembra") : "") + "; en la copa, la granada del fruto del espíritu con " + plural(gr.tot, "nivel", "niveles"));
    // Savia (BiEx, 10-nov-2026: «me gustaba el movimiento de las raíces; vuélvelo más espectacular»): luces del color de cada
    // atributo suben por su raíz desde el medallón hasta el tronco, con su estela; cuantos más puntos tiene el atributo, más
    // luces y más rápidas. Capa aparte en las coordenadas del dibujo (offset-path): el árbol sigue quieto y nítido.
    // V19 (BiEx, 12-nov-2026: fluidez del Árbol): la savia ya no anima «offset-path» (el navegador lo calcula en el hilo
    // principal en cada cuadro); cada luz recorre puntos tomados de su raíz con traslados (compositor) y opacidad, y se
    // detiene cuando el árbol sale de la pantalla. Neon (23-nov-2026): hasta 2 pulsos integrados por raíz (máx. 12 capas WAAPI
    // en vez de 36) y pausa automática cuando hay una ventana modal abierta.
    const savia = h("div", { class: "ap-savia", "aria-hidden": "true" }), saviaA = [];
    try {
      const ns = "http://www.w3.org/2000/svg", sv = document.createElementNS(ns, "svg"); sv.setAttribute("style", "position:absolute;width:0;height:0;overflow:hidden"); document.body.append(sv);
      raizD.forEach(([d, col, val, mx, my], i) => {
        const pa = document.createElementNS(ns, "path"); pa.setAttribute("d", d); sv.append(pa);
        // nace en el borde del medallón (radio 44) sobre la raíz dibujada y sube por ella hasta el tronco
        const L = pa.getTotalLength(), fuera = (l) => { const p = pa.getPointAtLength(l); return Math.hypot(p.x - mx, p.y - my) >= 44; };
        let a = 0, z = L; for (let it = 0; it < 22; it++) { const m = (a + z) / 2; if (fuera(m)) a = m; else z = m; }
        const L0 = a, pts = []; for (let q = 0; q <= 18; q++) { const pt = pa.getPointAtLength(L0 * (1 - q / 18)); pts.push([pt.x, pt.y]); }
        const n = 1 + Math.min(1, Math.floor(val / 12)), dur = Math.max(2.3, 4.8 - val * 0.06) * 1000, tam = 16, op = 0.96;
        for (let k = 0; k < n; k++) {
          const el = h("i", { class: "ap-sv", style: "--c:" + col + ";--s:" + tam + "px" }); savia.append(el);
          const kf = pts.map(([x, y], q) => ({ transform: "translate3d(" + (x - tam / 2).toFixed(1) + "px," + (y - tam / 2).toFixed(1) + "px,0)", opacity: q === 0 ? 0 : q === 2 ? op : q === 16 ? op : q === 18 ? 0 : undefined, offset: q / 18 }));
          for (const f of kf) if (f.opacity === undefined) delete f.opacity;
          if (el.animate && !sinAnim()) saviaA.push(el.animate(kf, { duration: dur, delay: -((dur * k) / n + i * 410), iterations: Infinity, easing: "cubic-bezier(.45,.05,.55,.95)" }));
        }
      });
      sv.remove();
    } catch (e) { /* sin savia */ }
    savia.append(h("b", { class: "ap-bebe" }));
    const verFruto = h("button", { class: "ap-gr-b", type: "button", style: pc(GR_X, GR_Y), "aria-label": "Ver el fruto del espíritu", onclick: () => { const t = document.getElementById("jg-fruto"); if (t) t.scrollIntoView({ behavior: sinAnim() ? "auto" : "smooth", block: "start" }); } });
    const caja = h("div", { class: "ap-arbol" }, el, vida, savia, verFruto);
    if (window.ResizeObserver) { const ro = new ResizeObserver(() => { const w = caja.clientWidth; if (w) savia.style.setProperty("--k", (w / 1000).toFixed(4)); }); ro.observe(caja); }
    caja._anims = saviaA;
    observarModal();
    if ("IntersectionObserver" in window) {
      if (!IO_ARBOL) IO_ARBOL = new IntersectionObserver((es) => {
        const mod = document.documentElement.classList.contains("con-modal");
        for (const e of es) {
          e.target._vis = e.isIntersecting; e.target.classList.toggle("quieto", !e.isIntersecting);
          for (const a of e.target._anims || []) { try { if (e.isIntersecting && !mod) a.play(); else a.pause(); } catch (er) { /* nada */ } }
        }
      });
      IO_ARBOL.observe(caja);
    }
    // (BiEx, 21-nov-2026, AF5) la savia corre también mientras se desplaza la página (solo se detiene fuera de la pantalla o bajo modal)
    return caja;
  }
  // Z1 · El ser interior (BiEx, 13 y 14-nov-2026: «Presencia velada», «vivo y sereno»): realista y sin sexo (es espíritu: el
  // rostro queda en penumbra con su luz, sin rasgos), sin caja (luz de lo alto, halo y niebla que se desvanecen sin bordes) y
  // con movimientos que nunca se repiten (respiración de período y hondura distintos en cada ciclo, gestos con esperas y
  // amplitudes elegidas aleatoriamente). Armadura de Ἐfέsιοι 6:13-17 sin cruces: espada μάχαιρα (curva, de un filo, sin
  // guarda), escudo θυρεός (largo, de puerta), peto de bandas horizontales y celada lisa sin cimera. Capas vectoriales quietas
  // (se pintan una sola vez a la densidad real); solo se mueven por el compositor (traslados y opacidad).
  let FA_N = 0, FIG_PREV = null;
  const SI_MET = [null, ["#fbf6e6", "#e6d9b6", "#a8966a"], ["#ffd9a6", "#c9813f", "#5e3210"], ["#ffffff", "#c3ccd8", "#5f6b7a"], ["#fff3c4", "#f0c04a", "#8a5a0c"], ["#dcfff6", "#7fb8ff", "#7a4dff"]];
  const SI_MANTO = { "manto-lino": ["#f6efdf", "#ddd1b8", "#a99c80", "#6f6450"], "manto-escarlata": ["#d4555a", "#9c262c", "#5a0f14", "#2b0508"], "manto-azul": ["#5d8fe6", "#2f5fb8", "#16336e", "#081633"], "manto-purpura": ["#a865c2", "#7a3594", "#45165a", "#200829"] };
  const SI_AURA = { "aura-oro": "#f5c64e", "aura-zafiro": "#7da2ff", "aura-esmeralda": "#5fdca6", "aura-amatista": "#c39bff", "aura-alba": "#ffc4a0", "aura-columna": "#ff9a52", "aura-nube": "#eef4fb" };
  function figuraArmadura(av) {
    const g = (k) => Math.max(0, Math.min(5, (av.eq || {})[k] | 0)), acc = av.acc || {}, u = "si" + (++FA_N) + "-", url = (n) => "url(#" + u + n + ")";
    const M = SI_MANTO[acc.manto] || ["#4a5a6e", "#2a3644", "#121921", "#070b10"], luz = SI_AURA[acc.aura] || "#ffe4a0", borde = acc.manto === "manto-lino" ? "#fffaf0" : "#ffe9b8";
    const st = (a) => a.map(([o, c, op]) => '<stop offset="' + o + '" stop-color="' + c + '"' + (op != null ? ' stop-opacity="' + op + '"' : "") + "/>").join("");
    const lin = (n, x2, y2, a) => '<linearGradient id="' + u + n + '" x1="0" y1="0" x2="' + x2 + '" y2="' + y2 + '">' + st(a) + "</linearGradient>";
    const rad = (n, cx, cy, r, a) => '<radialGradient id="' + u + n + '" cx="' + cx + '" cy="' + cy + '" r="' + r + '">' + st(a) + "</radialGradient>";
    // metal convexo (peto, celada): la luz cae arriba a la izquierda y se apaga hacia los bordes; la hoja, un reflejo a lo largo
    const met = (n, k) => { const c = SI_MET[k]; return n === "g-espada" || n === "g-cinto" || n === "g-calzado" ? lin(n, 1, 0, [[0, c[2]], [0.4, c[1]], [0.5, c[0]], [0.62, c[1]], [1, c[2]]])
      : rad(n, ".38", ".3", ".78", [[0, c[0]], [0.35, c[1]], [0.85, c[2]], [1, c[2]]]); };
    let defs = lin("m", 1, 0, [[0, M[3]], [0.22, M[2]], [0.46, M[1]], [0.6, M[0]], [0.8, M[2]], [1, M[3]]]) + lin("mv", 0, 1, [[0, "#fff", 0.14], [0.4, "#fff", 0], [1, "#000", 0.42]]) +
      lin("capa", 1, 0, [[0, M[3]], [0.3, M[2]], [0.55, M[0]], [0.75, M[1]], [1, M[3]]]) + rad("cara", ".5", ".62", ".62", [[0, luz, 0.18], [0.42, luz, 0.04], [1, "#030405", 0.97]]) +
      lin("oro", 1, 1, [[0, "#fff3c4"], [0.45, "#e6b445"], [1, "#6e460b"]]) + lin("cuero", 1, 1, [[0, "#a2723f"], [0.55, "#6d4520"], [1, "#3c220c"]]) + lin("mtv", 0, 1, [[0, "#fff", 0.25], [1, "#000", 0.3]]) +
      lin("pies", 0, 1, [[0.74, "#fff"], [0.985, "#fff", 0]]) + '<mask id="' + u + 'fun" maskUnits="userSpaceOnUse" x="0" y="0" width="300" height="420"><rect width="300" height="420" fill="' + url("pies") + '"/></mask>' +
      '<filter id="' + u + 'b2" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.2"/></filter>';
    for (const k of ["coraza", "cinto", "calzado", "escudo", "yelmo", "espada"]) if (g(k)) defs += met("g-" + k, g(k));
    const fant = (d) => '<path d="' + d + '" fill="none" stroke="#e8cf94" stroke-opacity=".38" stroke-width="1.2" stroke-dasharray="3 3"/>';
    const fulgor = (x, y, r) => '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="#fff" opacity=".55"/><circle cx="' + x + '" cy="' + y + '" r="' + (r * 2.6).toFixed(1) + '" fill="#bff3ff" opacity=".14"/>'; // bloque precioso: luz redonda, sin puntas
    const P = {
      manto: "M108 196C100 240 94 290 88 340C85 362 82 380 78 398C112 410 192 408 224 400C220 380 216 360 213 338C208 288 202 240 194 196Z",
      capa: "M100 122C86 142 80 172 77 214C96 228 118 232 128 230C126 196 124 164 124 140C134 132 166 132 176 140C176 164 174 196 172 230C182 232 204 228 223 214C220 172 214 142 200 122C184 112 116 112 100 122Z",
      capucha: "M150 30C124 30 105 50 102 84C99 108 102 126 96 144C112 134 132 130 150 130C168 130 188 134 204 144C198 126 201 108 198 84C195 50 176 30 150 30Z",
      cara: "M150 56C133 56 123 73 123 95C123 113 133 125 150 129C167 125 177 113 177 95C177 73 167 56 150 56Z",
      coraza: "M127 141C137 135 163 135 173 141C176 158 175 180 170 197C162 205 138 205 130 197C125 180 124 158 127 141Z",
      cinto: "M120 202C134 209 166 209 180 202L181 214C166 221 134 221 119 214Z",
      calzado: "M130 400C131 393 142 391 145 397L146 405H128ZM156 397C159 391 170 393 171 400L173 405H155Z",
      espada: "M146.5 254C146 300 148 334 156 362C152 340 152 300 153.5 254Z",
      escudo: "M198 176C214 168 236 168 252 176L250 318C236 330 214 330 200 318Z",
      yelmo: "M108 76C106 48 124 32 150 32C176 32 194 48 192 76C178 66 122 66 108 76Z",
    };
    // manto, túnica, calzado y el escudo apoyado (capa quieta, anclada al suelo)
    let pl = "";
    for (const [x0, x1, x2, w, a] of [[112, 104, 96, 7, 0.34], [122, 118, 112, 4, 0.2], [188, 196, 206, 7, 0.34], [178, 182, 190, 4, 0.22], [103, 98, 90, 3, 0.18]]) {
      const k = x0 < 150 ? 4 : -4;
      pl += '<path d="M' + x0 + " 206C" + x1 + " 270 " + x1 + " 330 " + x2 + ' 398" fill="none" stroke="#000" stroke-opacity="' + a + '" stroke-width="' + w + '" stroke-linecap="round" filter="' + url("b2") + '"/>' +
        '<path d="M' + (x0 + k) + " 210C" + (x1 + k) + " 272 " + (x1 + k) + " 330 " + (x2 + k) + ' 396" fill="none" stroke="' + borde + '" stroke-opacity=".17" stroke-width="1.1" stroke-linecap="round"/>';
    }
    const calz = g("calzado") ? '<path d="' + P.calzado + '" fill="' + url("cuero") + '"/><path d="M131 397H145M157 397H171" stroke="' + url("g-calzado") + '" stroke-width="2.2" stroke-linecap="round"/>' + (g("calzado") === 5 ? fulgor(138, 396, 1.6) : "") : fant(P.calzado);
    const esc = g("escudo") ? '<g transform="rotate(4 224 260)"><path d="' + P.escudo + '" fill="' + url("cuero") + '" stroke="rgba(0,0,0,.5)" stroke-width="1"/>' +
      '<path d="M202 180C216 173 234 173 248 180L246 314C234 324 216 324 204 314Z" fill="none" stroke="' + url("g-escudo") + '" stroke-width="2.8"/><path d="' + P.escudo + '" fill="' + url("mv") + '"/>' +
      '<circle cx="225" cy="246" r="12" fill="' + url("g-escudo") + '" stroke="rgba(0,0,0,.45)" stroke-width=".8"/><circle cx="221" cy="242" r="3.6" fill="#fff" opacity=".45"/>' +
      '<path d="M213 272C218 268 222 268 225 272C228 268 232 268 237 272L237 284C232 280 228 280 225 284C222 280 218 280 213 284Z" fill="none" stroke="#f3d08a" stroke-opacity=".78" stroke-width="1.1"/>' + (g("escudo") === 5 ? fulgor(236, 190, 2) : "") + "</g>"
      : '<g transform="rotate(4 224 260)">' + fant(P.escudo) + "</g>";
    // V6·2 (BiEx, 12-nov-2026: «que los mantos se vean épicos»): el escarlata y la púrpura con orla de oro bordada; el azul con
    // sus flecos y su cordón azul (Bᵉmiḏbar [Números] 15:38); el de lino, con su brillo fino
    const orla = acc.manto === "manto-escarlata" || acc.manto === "manto-purpura";
    const bordado = (d, w) => '<path d="' + d + '" fill="none" stroke="' + url("oro") + '" stroke-width="' + w + '"/><path d="' + d + '" fill="none" stroke="#fff6d6" stroke-opacity=".55" stroke-width=".7" stroke-dasharray="1.2 2.4"/>';
    const flecos = (x, y, sx) => { let f2 = ""; for (let i = 0; i < 5; i++) f2 += '<path d="M' + (x + sx * i * 2.2).toFixed(1) + " " + y + "q" + (sx * 0.8).toFixed(1) + " 7 " + (sx * 0.2).toFixed(1) + ' 14" fill="none" stroke="' + (i === 2 ? "#3f7be0" : "#f3ead6") + '" stroke-width="' + (i === 2 ? 1.3 : 0.9) + '" stroke-linecap="round"/>'; return f2; };
    const adorno = (orla ? bordado("M80 394C96 388 108 400 126 395M176 397C192 392 206 401 222 396", 2.4) : "") + (acc.manto === "manto-azul" ? flecos(84, 392, 1) + flecos(214, 392, -1) : "");
    const adornoCapa = (orla ? bordado("M78 212C96 226 118 230 128 228M222 212C204 226 182 230 172 228M126 140C126 170 127 200 128 228M174 140C174 170 173 200 172 228", 2.2) : "") +
      (acc.manto === "manto-azul" ? flecos(80, 212, 1) + flecos(220, 212, -1) : "") + (acc.manto === "manto-lino" ? '<path d="M110 130C106 160 104 190 102 216M196 132C200 160 202 190 204 214" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="1.6" filter="' + url("b2") + '"/>' : "");
    const capaManto = '<g mask="url(#' + u + 'fun)"><path d="' + P.manto + '" fill="' + url("m") + '"/><path d="' + P.manto + '" fill="' + url("mv") + '"/>' +
      '<path d="M134 214C132 280 129 340 126 402C142 406 160 406 176 402C172 340 168 280 166 214Z" fill="' + M[3] + '" opacity=".75"/>' +
      '<path d="M139 216C138 282 136 342 134 404C146 406 156 406 168 404C165 342 162 282 161 216Z" fill="#e9dfca"/><path d="M139 216C138 282 136 342 134 404C146 406 156 406 168 404C165 342 162 282 161 216Z" fill="' + url("mv") + '"/>' +
      '<path d="M134 214C132 280 129 340 126 402M166 214C168 280 172 340 176 402" fill="none" stroke="#000" stroke-opacity=".46" stroke-width="5" filter="' + url("b2") + '"/>' + pl +
      '<path d="M78 398C96 392 108 404 126 399M176 401C192 396 206 405 224 400" fill="none" stroke="' + borde + '" stroke-opacity=".34" stroke-width="1.3"/>' + adorno + calz + "</g>" + esc;
    // torso: capa, peto, cinta, mangas, manos y la μάχαιρα (respira junto con la cabeza)
    const peto = g("coraza") ? '<path d="' + P.coraza + '" fill="' + url("g-coraza") + '" stroke="rgba(0,0,0,.42)" stroke-width="1"/><path d="' + P.coraza + '" fill="' + url("mtv") + '"/>' +
      '<path d="M126.3 158C137 164 163 164 173.7 158M126.6 174C137 180 163 180 173.4 174M128.3 189C138 195 162 195 171.7 189" fill="none" stroke="#2f3843" stroke-opacity=".5" stroke-width="1.3"/>' +
      '<path d="M127 156.4C137 162.4 163 162.4 173 156.4M127.3 172.4C137 178.4 163 178.4 172.7 172.4" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width=".8"/>' + (g("coraza") === 5 ? fulgor(136, 150, 2) : "")
      : '<path d="' + P.coraza + '" fill="#e9dfca" opacity=".92"/><path d="' + P.coraza + '" fill="' + url("mtv") + '"/>' + fant(P.coraza);
    const cinta = g("cinto") ? '<path d="' + P.cinto + '" fill="' + url("cuero") + '"/>' + [128, 137, 163, 172].map((x) => '<rect x="' + (x - 2.6) + '" y="' + (x < 150 ? 206.5 : 206.5) + '" width="5.2" height="7" rx="1.2" fill="' + url("g-cinto") + '"/>').join("") + '<circle cx="150" cy="211" r="5.4" fill="' + url("g-cinto") + '" stroke="rgba(0,0,0,.45)" stroke-width=".8"/>'
      : '<path d="' + P.cinto + '" fill="' + url("cuero") + '" opacity=".55"/>' + fant(P.cinto);
    const espada = g("espada") ? '<path d="M148 240L152 240L152 254L148 254Z" fill="' + url("cuero") + '"/><path d="' + P.espada + '" fill="' + url("g-espada") + '" stroke="rgba(0,0,0,.35)" stroke-width=".7"/>' +
      '<path d="M150.5 258C150.6 300 152 332 155 352" fill="none" stroke="#fff" stroke-opacity=".75" stroke-width=".8"/>' + (g("espada") === 5 ? fulgor(153, 300, 1.8) : "") : fant(P.espada);
    const manos = '<path d="M144 236C146 230 154 230 156 236C155 240 145 240 144 236Z" fill="' + url("oro") + '"/>' +
      '<path d="M139 232C140 224 148 222 152 226L151 236C147 240 141 238 139 232Z" fill="#c9a37e"/><path d="M161 232C160 224 152 222 148 226L149 236C153 240 159 238 161 232Z" fill="#b48c66"/>' +
      '<path d="M141 230C144 228 148 228 150 230M150 230C152 228 156 228 159 230" fill="none" stroke="#000" stroke-opacity=".25" stroke-width=".8"/>';
    const capaTorso = peto + cinta + '<path d="' + P.capa + '" fill="' + url("capa") + '"/><path d="' + P.capa + '" fill="' + url("mv") + '"/>' +
      '<path d="M104 132C96 160 92 190 90 218M196 132C204 160 208 190 210 218" fill="none" stroke="#000" stroke-opacity=".32" stroke-width="4" filter="' + url("b2") + '"/>' +
      '<path d="M126 140C126 170 127 200 128 230M174 140C174 170 173 200 172 230" fill="none" stroke="' + borde + '" stroke-opacity=".22" stroke-width="1.1"/>' + adornoCapa + espada +
      '<path d="M112 206C116 220 126 230 140 236L146 226C134 222 126 214 122 204Z" fill="' + url("capa") + '"/><path d="M188 206C184 220 174 230 160 236L154 226C166 222 174 214 178 204Z" fill="' + url("capa") + '"/>' + manos;
    // cabeza: capucha honda (o celada lisa), el rostro en penumbra, el lauro y el sello en el broche del manto
    let cab = '<path d="' + P.capucha + '" fill="' + url("capa") + '"/><path d="' + P.capucha + '" fill="' + url("mv") + '"/><path d="' + P.cara + '" fill="' + url("cara") + '"/>' +
      '<path d="M123 95C123 73 133 56 150 56C167 56 177 73 177 95" fill="none" stroke="' + borde + '" stroke-opacity=".38" stroke-width="1.4"/>' +
      '<path d="M126 96C127 112 136 122 150 126C164 122 173 112 174 96" fill="none" stroke="#000" stroke-opacity=".5" stroke-width="5" filter="' + url("b2") + '"/>' +
      '<path d="M110 70C118 48 134 38 150 38C166 38 182 48 190 70" fill="none" stroke="' + borde + '" stroke-opacity=".26" stroke-width="1.2"/>';
    cab += g("yelmo") ? '<path d="' + P.yelmo + '" fill="' + url("g-yelmo") + '" stroke="rgba(0,0,0,.45)" stroke-width="1"/><path d="' + P.yelmo + '" fill="' + url("mtv") + '"/><path d="M110 74C126 66 174 66 190 74" fill="none" stroke="#fff" stroke-opacity=".4" stroke-width="1"/>' + (g("yelmo") === 5 ? fulgor(134, 46, 2) : "") : fant(P.yelmo);
    if (acc.corona) { const pal = acc.corona === "corona-palmas", verde = acc.corona === "corona-laurel" ? "#5f9a4c" : pal ? "#b9c96a" : "#8fbf6a"; let h2 = "";
      for (let i = 0; i < 7; i++) for (const a of [Math.PI * (1.06 + i * 0.062), Math.PI * (1.94 - i * 0.062)]) { const x = 150 + 34 * Math.cos(a), y = 70 + 13 * Math.sin(a);
        h2 += '<ellipse cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" rx="' + (pal ? 6 : 5) + '" ry="' + (pal ? 1.7 : 2.2) + '" transform="rotate(' + ((a * 180) / Math.PI + 90).toFixed(0) + " " + x.toFixed(1) + " " + y.toFixed(1) + ')" fill="' + verde + '"/>';
        if (acc.corona === "corona-laurel" && i % 2) h2 += '<circle cx="' + x.toFixed(1) + '" cy="' + (y - 2).toFixed(1) + '" r="1.2" fill="#fffaf0"/>'; }
      cab += h2; }
    if (acc.sello && SELLO_RARO[acc.sello]) cab += '<g transform="translate(140.4 127.4) scale(.4)"><circle cx="24" cy="24" r="19" fill="#f2c14e" stroke="#7a5212" stroke-width="2"/>' + SELLO_RARO[acc.sello] + "</g>";
    else if (acc.sello) cab += '<circle cx="150" cy="137" r="7.5" fill="#f2c14e" stroke="#7a5212"/>' + (acc.sello === "sello-estrella" ? '<path d="M144.6 139.6h10.8" stroke="#7a5212" stroke-width="1.2" stroke-linecap="round"/><circle cx="150" cy="135.8" r="3.9" fill="#fff6d6" opacity=".4"/><circle cx="150" cy="135.8" r="2.1" fill="#fffaf0"/>' : '<path d="M146.5 139h7l-1.2 2.6h-4.6zM148.5 139c0-3 1.5-5 1.5-5s1.5 2 1.5 5" fill="#7a5212"/>');
    // luz de la pieza que se elige para forjar (capa aparte: solo cambia su opacidad)
    const LUZ = { coraza: P.coraza, cinto: P.cinto, calzado: P.calzado, escudo: P.escudo, yelmo: P.yelmo, espada: P.espada };
    // (15-nov-2026, fluidez y calor) cada luz de pieza va en su propia capa HTML: su latido es solo de opacidad, por el compositor.
    // Antes era un <g> dentro del SVG de la figura, y animar un <g> obligaba a volver a pintar la figura (con su desenfoque) en
    // cada cuadro mientras se veía el Árbol.
    const luces = h("div", { class: "si-luces" }, ...Object.entries(LUZ).map(([k, d]) => { const el = A.svg('<defs><filter id="' + u + 'luz' + k + '" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="3.4"/></filter></defs><g' + (k === "escudo" ? ' transform="rotate(4 224 260)"' : "") + '><path d="' + d + '" fill="#ffe6a3" fill-opacity=".2" stroke="#ffe39a" stroke-width="5" filter="url(#' + u + 'luz' + k + ')"/><path d="' + d + '" fill="none" stroke="#fff4cf" stroke-width="1.5" stroke-linejoin="round"/></g>', "0 0 300 420"); el.setAttribute("aria-hidden", "true"); return h("div", { class: "fa-luz", "data-pz": k }, el); }));
    const capa = (cls, cuerpo, conDefs) => { const el = A.svg((conDefs ? "<defs>" + defs + "</defs>" : "") + cuerpo, "0 0 300 420"); el.setAttribute("class", "si-c " + cls); el.setAttribute("aria-hidden", "true"); return el; };
    // escena sin bordes: el halo del color del aura, el haz desde lo alto y el suelo con su niebla
    const fondo = capa("si-fondo", '<defs><radialGradient id="' + u + 'halo" cx=".5" cy=".34" r=".5">' + st([[0, luz, 0.4], [0.35, luz, 0.13], [0.75, luz, 0.02], [1, luz, 0]]) + '</radialGradient>' +
      lin("haz", 0, 1, [[0, "#fff8e4", 0], [0.22, "#fff8e4", 0.17], [0.32, "#fff8e4", 0.2], [0.8, "#fff8e4", 0]]) + '<radialGradient id="' + u + 'suelo">' + st([[0, luz, 0.5], [0.45, luz, 0.14], [1, luz, 0]]) + "</radialGradient></defs>" +
      // (BiEx, 15-nov-2026, 19:25: «la luz de arriba no debe verse cortada; parte del entorno, no una caja») el haz nace por encima
      // de la figura, transparente, y el halo se dibuja entero (la capa no recorta: overflow visible)
      '<ellipse cx="150" cy="200" rx="158" ry="222" fill="' + url("halo") + '"/><path d="M127 -62H173L236 420H64Z" fill="' + url("haz") + '" opacity=".75"/><ellipse cx="152" cy="400" rx="126" ry="18" fill="' + url("suelo") + '"/>');
    const caja = h("div", { class: "av-fig ser-in", role: "img", "aria-label": "Tu ser interior, con su armadura: " + ["coraza", "cinto", "calzado", "escudo", "yelmo", "espada"].map((p) => p + " " + (g(p) ? "grado " + g(p) : "por forjar")).join(", ") },
      fondo, h("i", { class: "si-niebla n1" }), h("i", { class: "si-niebla n2" }),
      // la figura entera (manto, torso, cabeza y luces de las piezas) respira como un todo (vivirSer)
      h("div", { class: "si-fig" }, capa("si-manto", capaManto, true),
        h("div", { class: "si-mueve si-torso" }, capa("", capaTorso, true), h("i", { class: "si-pecho" }),
          h("div", { class: "si-mueve si-cabeza" }, capa("", cab, true), h("i", { class: "si-alma" }))),
        luces), ...Array.from({ length: 4 }, (_, i) => h("i", { class: "si-mo", style: "left:" + (24 + ((i * 37) % 52)) + "%;--t:" + (6.4 + (i % 3) * 1.7).toFixed(1) + "s;--d:" + (i * 1.6).toFixed(1) + "s" })));
    caja.style.setProperty("--si-luz", luz);
    caja.dataset.sig = JSON.stringify([av.eq || {}, acc]); // si no cambia, al ponerse al día el Árbol se conserva este mismo (sin redibujarlo)
    setTimeout(() => vivirSer(caja), 60);
    return caja;
  }
  // Vida del ser interior: nada se repite. (BiEx, 15-nov-2026, 19:25: «no he visto sus movimientos»: la respiración movía el
  // torso menos de un píxel.) Ahora TODA la figura respira como en el resto del sitio (los libros en oro, Manuscritos): crece
  // hasta un 3,5–5 % desde los pies y vuelve, cada ciclo con su propio período (4,2–6,2 s), hondura y pausa; el halo se aviva al
  // inhalar. Gestos sueltos tras esperas distintas (4–11 s): alzar la mirada hacia la luz, acomodar los hombros, la luz del rostro
  // que crece y se calma. Al llegar con versos leídos hoy, la luz del pecho crece una vez. Solo transformaciones y opacidad
  // (compositor); en pausa fuera de la pantalla, con la pestaña oculta y con «Sin animaciones». Si la figura aún no está en la
  // página (o se mueve al ponerse al día el Árbol), espera a estarlo en vez de detenerse para siempre.
  function vivirSer(caja, intento) {
    if (!caja.animate || sinAnim() || caja._vive) return;
    if (!caja.isConnected) { if ((intento | 0) < 50) setTimeout(() => vivirSer(caja, (intento | 0) + 1), 160); return; }
    caja._vive = true;
    observarModal();
    const fig = caja.querySelector(".si-fig"), fondo = caja.querySelector(".si-fondo"), torso = caja.querySelector(".si-torso"), cabeza = caja.querySelector(".si-cabeza"), alma = caja.querySelector(".si-alma"), pecho = caja.querySelector(".si-pecho");
    const al = (a, b) => a + Math.random() * (b - a);
    let visible = true, t1 = 0, t2 = 0, fuera = 0;
    const enModal = () => !!caja.closest(".modal");
    const vivo = () => caja.isConnected && visible && !document.hidden && (enModal() || !document.documentElement.classList.contains("con-modal"));
    const io = "IntersectionObserver" in window ? new IntersectionObserver((e) => {
      const v = e.some((x) => x.isIntersecting);
      caja.classList.toggle("quieto", !v);
      if (v && !visible) { visible = true; if (vivo()) { respira(); gesto(); } } else if (!v) visible = false;
    }) : null;
    if (io) io.observe(caja);
    const alVolver = () => { if (vivo()) { respira(); gesto(); } };
    caja._desp = alVolver;
    const parar = () => { clearTimeout(t1); clearTimeout(t2); if (io) io.disconnect(); document.removeEventListener("visibilitychange", alVolver); caja._desp = null; caja._vive = false; };
    // fuera del documento por un momento (al ponerse al día el Árbol): espera; si no vuelve en 30 s, se detiene
    const ausente = () => { if (caja.isConnected) { fuera = 0; return false; } if (++fuera > 20) { parar(); return true; } t1 = setTimeout(respira, 1500); return true; };
    function respira() {
      clearTimeout(t1); if (ausente()) return; if (!vivo()) return;
      // (BiEx, 21-nov-2026, AF10) la mitad de evidente y nunca igual: hondura de 1,4 a 2,5 % (antes 3,5–5 %), ciclo de 3,6 a 7,4 s,
      // inhalación y exhalación de largo distinto, a veces una más corta y somera, y pausas de 0,2 a 2,2 s
      const somera = Math.random() < 0.22, T = somera ? al(2600, 3800) : al(3600, 7400), k = somera ? al(0.009, 0.015) : al(0.014, 0.025), pico = al(0.34, 0.58);
      const curva = ["ease-in-out", "cubic-bezier(.42,0,.5,1)", "cubic-bezier(.36,.06,.6,1)", "cubic-bezier(.5,0,.4,1)"][Math.floor(Math.random() * 4)];
      const a = (fig || torso).animate([{ transform: "scale(1)" }, { transform: "scale(" + (1 + k).toFixed(4) + ")", offset: pico }, { transform: "scale(1)" }], { duration: T, easing: curva });
      if (fondo) fondo.animate([{ opacity: 0.86 }, { opacity: 1, offset: pico }, { opacity: 0.86 }], { duration: T, easing: "ease-in-out" });
      pecho.animate([{ opacity: 0.55 }, { opacity: 0.55 + k * 7, offset: pico }, { opacity: 0.55 }], { duration: T, easing: "ease-in-out" });
      a.onfinish = () => { t1 = setTimeout(respira, al(200, 2200)); };
    }
    const GESTOS = [
      () => cabeza.animate([{ transform: "translate3d(0,0,0)" }, { transform: "translate3d(" + al(-0.9, 0.9).toFixed(2) + "px," + (-al(1.4, 2.6)).toFixed(2) + "px,0)", offset: al(0.3, 0.5) }, { transform: "translate3d(0,0,0)" }], { duration: al(2600, 4800), easing: "cubic-bezier(.4,0,.2,1)" }),
      () => alma.animate([{ opacity: 0.38 }, { opacity: al(0.62, 0.8), offset: al(0.35, 0.6) }, { opacity: 0.38 }], { duration: al(2200, 4200), easing: "ease-in-out" }),
      () => torso.animate([{ transform: "translate3d(0,0,0)" }, { transform: "translate3d(" + al(-1.4, 1.4).toFixed(2) + "px," + al(-0.6, 0.4).toFixed(2) + "px,0)", offset: 0.5 }, { transform: "translate3d(0,0,0)" }], { duration: al(1800, 3200), easing: "ease-in-out" }),
    ];
    function gesto() {
      clearTimeout(t2); if (!caja.isConnected) return; if (!vivo()) return;
      t2 = setTimeout(() => { if (!vivo()) return; try { GESTOS[Math.floor(Math.random() * GESTOS.length)](); } catch (e) { /* sin gesto */ } gesto(); }, al(4000, 11000));
    }
    document.addEventListener("visibilitychange", alVolver);
    // al llegar con versos leídos hoy que aún no había visto, la luz del pecho y del rostro crece una vez (reacción a la lectura)
    try { const y = S.yo || {}, n = (y.hoy && y.hoy.versos) | 0, ant = A.store.get("jg:siV", null) || {}; const f = (y.hoy && y.hoy.f) || "";
      caja.style.setProperty("--si-pecho", (0.4 + Math.min(0.55, n / 40)).toFixed(2));
      if (n > (ant.f === f ? ant.n | 0 : 0)) { A.store.set("jg:siV", { f, n }); setTimeout(() => { if (!vivo()) return; pecho.animate([{ opacity: 0.55 }, { opacity: 1 }, { opacity: 0.55 }], { duration: 2600, easing: "ease-in-out" }); alma.animate([{ opacity: 0.38 }, { opacity: 0.85 }, { opacity: 0.38 }], { duration: 2800, easing: "ease-in-out" }); }, 900); } } catch (e) { /* sin datos */ }
    respira(); gesto();
  }
  const errPoder = (r) => r.error === "tope_atributo" ? "Ese atributo ya llega a su tope (60)" + (r.cabe ? ": le caben " + plural(r.cabe, "punto", "puntos") : "") + ". Reparte en otro" : r.error === "compra_revertida" ? "La compra no se pudo completar y tus " + fmt(r.dr | 0) + " dracmas volvieron intactas" : r.error === "sin_dracmas" ? "Te faltan " + fmt(r.falta || 0) + " dracmas: cada perícopa leída te acerca" : r.error === "sin_cantos" ? "Te faltan " + plural(r.falta || 1, "canto", "cantos") + " para esa forja: aparecen al leer" : r.error === "sin_puntos" ? "No tienes tantos puntos por repartir" : r.error === "tope" ? "Ya llegaste al tope" : r.error === "ya_tienes" ? "Ya lo tienes" : mensaje(r);
  async function accionPoder(ruta, cuerpo, ok, son) {
    const r = await pedir(ruta, { metodo: "POST", cuerpo: cuerpo || {} });
    if (r.error) { A.avisar(errPoder(r)); return null; }
    if (r.yo) actualizarYo(r.yo); PODER = null;
    if (ok) A.avisar(ok); if (son !== "forja") { sonar("chispa"); vibrar([10, 30, 12]); }
    return r;
  }
  // (BiEx, 15-nov-2026, 19:25) La forja se celebra a la vista del ser interior: su pieza nueva se enciende y respira con él, saltan
  // las chispas de la forja, cuentan el atributo y el poder, y se lee el verso de esa pieza (Ἐfέsιοι 6:14-17, texto de BiEx). El
  // mensaje queda hasta «Continuar»; al cerrar, el Árbol se pone al día sin volver a entrar entero.
  const VERSO_PZ = { cinto: 14, coraza: 14, calzado: 15, escudo: 16, yelmo: 17, espada: 17 };
  function celebrarForja(id, n, grNuevo, grado, at, nAt, antes, r, rehacer) {
    sonar("forja"); vibrar([16, 60, 16, 80, 28]);
    const av = r.av || null, fig = av ? figuraArmadura(av) : null;
    if (fig) for (const g of fig.querySelectorAll(".fa-luz")) if (g.getAttribute("data-pz") === id) g.classList.add("on", "forjada");
    const fem = /a$/i.test(n), valA = h("b", { text: String((antes.ef && antes.ef[at]) | 0) }), cifraP = h("b", { text: fmt(antes.poder || 0) });
    const verso = h("div", { class: "jg-fj-v" }), v = VERSO_PZ[id] || 14, ref = A.nombreLibro("EPH") + " 6:" + v;
    const cuerpo = h("div", { class: "jg-cel jg-fj" },
      h("div", { class: "jg-fj-fig" + (sinAnim() ? "" : " anim") }, fig || h("span")),
      h("h3", { text: n + " " + (fem ? "forjada" : "forjado") + " en " + grado.toLowerCase() }),
      h("p", { class: "jg-fj-at" }, h("span", { class: "jg-fj-c", style: "--ac:" + (ATR_COL[at] || "var(--oro)") }, h("small", { text: nAt }), valA), h("span", { class: "jg-fj-c" }, h("small", { text: "Poder" }), cifraP)),
      h("p", { class: "jg-fj-t", text: "Tu ser interior se robustece: cada grado suma 2 a su atributo (Ἐfέsιοι 3:16)." }),
      verso,
      h("div", { class: "jg-acciones" }, h("button", { class: "btn oro", type: "button", onclick: () => A.cerrarModal() }, h("span", { text: "Continuar" }))));
    A.abrirModal(() => A.cajaModal(A.cabModal("Forja", "Escudriña"), cuerpo), () => rehacer());
    const anim = !sinAnim();
    setTimeout(() => { const luzP = fig && fig.querySelector('.fa-luz[data-pz="' + id + '"]'); if (anim) chispas(16, luzP || fig || cuerpo, ["estela", "brasas"]); }, 380);
    setTimeout(() => { const ef = av && av.ef ? av.ef[at] : null; if (ef != null) contarDesde(valA, (antes.ef && antes.ef[at]) | 0, ef, 900); }, 700);
    setTimeout(() => { if (av && av.poder != null) contarDesde(cifraP, antes.poder || 0, av.poder, 1100); }, 900);
    (A.versos ? A.versos("EPH", 6, v, v) : Promise.reject(new Error("sin versos"))).then((l) => {
      verso.replaceChildren(h("button", { class: "ap-cita", type: "button", title: "Ver lo que dice", "aria-label": "Ver " + ref, onclick: () => verCita("EPH", 6, v, v) }, h("i", { class: "ap-lumbre", "aria-hidden": "true" }), ref), ...l.map(([, nodo]) => h("p", {}, nodo)));
    }).catch(() => { verso.replaceChildren(h("button", { class: "ap-cita", type: "button", onclick: () => verCita("EPH", 6, v, v) }, h("i", { class: "ap-lumbre", "aria-hidden": "true" }), ref)); });
  }
  // cuenta de un valor a otro (sube o baja), con el mismo ritmo que contarRapido
  function contarDesde(el, desde, hasta, ms) {
    if (!el) return; desde = Math.round(desde || 0); hasta = Math.round(hasta || 0);
    if (el._cnt) cancelAnimationFrame(el._cnt);
    if (sinAnim() || document.hidden || desde === hasta) { el.textContent = fmt(hasta); return; }
    const t0 = performance.now(); let ult = null;
    const paso = (t) => { const k = Math.min(1, (t - t0) / ms), x = Math.round(desde + (hasta - desde) * (1 - Math.pow(1 - k, 2.2))); if (x !== ult) { ult = x; el.textContent = fmt(x); } el._cnt = k < 1 ? requestAnimationFrame(paso) : 0; };
    el._cnt = requestAnimationFrame(paso);
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
      // (BiEx, 14-nov-2026) se leía «1+1» como una suma: ahora el valor de hoy y, si se reparte, a cuánto llega («0 → 2»)
      const pint = () => { mas.textContent = plan[k] ? "→ " + (av.ef[k] + plan[k]) : ""; val.textContent = String(av.ef[k]); li.classList.toggle("sube", !!plan[k]); };
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
    const quedan = h("span", { class: "ap-pts" }), btnRep = h("button", { class: "btn oro", type: "button", disabled: true, onclick: async (e) => {
      e.currentTarget.disabled = true; const antes = Object.assign({}, av.ef), dado = Object.assign({}, plan), p0 = av.poder;
      const r = await accionPoder("/poder/repartir", { at: plan }, null); if (r) celebrarReparto(defs, antes, dado, p0, rehacer); else e.currentTarget.disabled = false; } }, h("span", { text: "Repartir" }));
    function total() { const n = Object.values(plan).reduce((a, x) => a + x, 0); quedan.replaceChildren(h("b", { text: String(libres) }), " " + (libres === 1 ? "punto por repartir" : "puntos por repartir")); btnRep.disabled = !n; }
    total();
    const gratis = av.reasigGratis != null ? !!av.reasigGratis : av.sem !== semanaClave();
    const proxTs = Number(av.reasigProx) || 0, semN = Math.max(1, Math.min(3, (av.reasigSem | 0) || 1));
    const fmtProx = proxTs > Date.now() ? (() => { try { return new Intl.DateTimeFormat("es", { day: "numeric", month: "short" }).format(new Date(proxTs)); } catch (e) { return ""; } })() : "";
    const saldoDr = h("span", { class: "ap-saldo", "aria-label": "Tienes " + fmt(P.dr) + " dracmas" }, ico("dracma"), h("b", { text: fmt(P.dr) }), " dr.");
    const puedePunto = P.dr >= av.precioPunto, puedeReasig = gratis || P.dr >= 60;
    const hayRep = av.tot - av.pts > 0;
    const notaReasig = hayRep ? h("p", { class: "jg-mini ap-reasig-nota", text: gratis
      ? "Tienes un restablecimiento gratis disponible (escalera al usarlo: 1 semana, luego 2, y en adelante cada 3 semanas)."
      : (fmtProx ? "Próximo restablecimiento gratis el " + fmtProx + " (tramo de " + plural(semN, "semana", "semanas") + "). Ahora puedes reasignar por 60 dracmas." : "Tu próximo restablecimiento gratis se habilita al cumplirse el plazo (1 → 2 → 3 semanas); ahora cuesta 60 dracmas.") }) : null;
    return tarjeta("Atributos", ico("arbol"),
      h("div", { class: "ap-cab" }, h("div", { class: "ap-cab-l" }, quedan, saldoDr), h("div", { class: "ap-cab-r" }, chipPoder(av.poder, () => abrirVentanaPoder(y, P)))),
      lista, desc,
      h("div", { class: "jg-acciones ap-acc-b" }, btnRep,
        h("button", { class: "btn " + (puedePunto ? "dr-ok" : "dr-falta"), type: "button", onclick: async (ev) => { const b = ev.currentTarget; if (b.disabled) return; b.disabled = true; const r = await accionPoder("/tienda/comprar", { item: "punto" }, "Compraste un punto de atributo: ya puedes repartirlo"); b.disabled = false; if (r) rehacer(); } }, h("span", { text: "Comprar punto · " + fmt(av.precioPunto) + " dr." })),
        // (un lector, 14-nov-2026: «se me borraron todos los puntos») antes de reasignar se explica qué pasa y se confirma
        hayRep ? h("button", { class: "btn" + (gratis ? "" : (puedeReasig ? " dr-ok" : " dr-falta")), type: "button", onclick: async () => {
          const rep = av.tot - av.pts;
          const det = gratis
            ? "Este restablecimiento es gratis (la espera siguiente escala: 1 semana, luego 2, y en adelante siempre cada 3 semanas)."
            : (fmtProx ? "Tu próximo restablecimiento gratis será el " + fmtProx + ". Hacerlo hoy cuesta 60 dracmas." : "Aún no se cumple el plazo del restablecimiento gratis: hacerlo hoy cuesta 60 dracmas.");
          if (!(await confirmar("¿Reasignar tus atributos?", "Tus " + plural(rep, "punto ya repartido vuelve", "puntos ya repartidos vuelven") + " a quedar libres y tus atributos bajan a lo que da la armadura hasta que los repartas otra vez. " + det, gratis ? "Reasignar gratis" : "Reasignar · 60 dr."))) return;
          const r = await accionPoder("/poder/reasignar", {}, "Tus puntos volvieron: repártelos de nuevo"); if (r) rehacer(); } }, h("span", { text: gratis ? "Reasignar (gratis)" : "Reasignar · 60 dr." })) : null),
      notaReasig);
  }
  // V22 · Granada de nueve cámaras (BiEx, 13-nov-2026; Gálatas 5:22-23, καρπός en singular): el corte de la fruta con sus
  // nueve cámaras de arilos; cada cámara se llena de luz rubí con el nivel de su aspecto. Vectorial y quieta (se pinta una
  // sola vez a la densidad real); la luz que respira va aparte, por el compositor. En el corte no se ve la corona del fruto.
  const FR_ORDEN = ["be", "go", "pl", "lo", "bn", "bo", "cf", "ma", "te"];
  const CACHE_GRANADA = new Map();
  function granadaSVG(fr, R, sel) {
    const f = (v) => v.toFixed(1), niv = (k) => (fr && fr[k] ? fr[k].n | 0 : 0);
    const sigG = R + ":" + (sel || "") + ":" + FR_ORDEN.map(niv).join(",");
    if (CACHE_GRANADA.has(sigG)) return CACHE_GRANADA.get(sigG);
    const id = "gr" + R + "_";
    const clase = (n) => (n <= 0 ? 0 : n < 3 ? 1 : n < 6 ? 2 : n < 10 ? 3 : 4);
    const ARIL = [["#5c1422", "#2a050c", 0.2], ["#a51d33", "#4d0814", 0.45], ["#cf2640", "#6a0b1c", 0.58], ["#f03c58", "#8c1024", 0.7], ["#ff7d93", "#b3132e", 0.82]];
    let defs = "";
    ARIL.forEach(([a, b], i) => { defs += '<radialGradient id="' + id + "a" + i + '" cx=".36" cy=".32" r=".78"><stop offset="0" stop-color="' + a + '"/><stop offset="1" stop-color="' + b + '"/></radialGradient>'; });
    defs += '<radialGradient id="' + id + 'c" cx=".42" cy=".36" r=".72"><stop offset="0" stop-color="#b52a3b"/><stop offset=".72" stop-color="#7a0f1f"/><stop offset="1" stop-color="#430610"/></radialGradient>' +
      '<radialGradient id="' + id + 'p" cx=".5" cy=".5" r=".56"><stop offset="0" stop-color="#f4e2c8"/><stop offset=".78" stop-color="#e7c9a0"/><stop offset="1" stop-color="#cfa274"/></radialGradient>' +
      '<radialGradient id="' + id + 'l"><stop offset="0" stop-color="#ff6680" stop-opacity=".95"/><stop offset=".6" stop-color="#e3223f" stop-opacity=".32"/><stop offset="1" stop-color="#e3223f" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="' + id + 'h"><stop offset="0" stop-color="#ff3a5c" stop-opacity=".4"/><stop offset=".6" stop-color="#c8183a" stop-opacity=".12"/><stop offset="1" stop-color="#c8183a" stop-opacity="0"/></radialGradient>';
    // contorno apenas facetado: la granada no es una esfera perfecta
    const borde = (rr, a1, a2) => { let d = ""; for (let i = 0; i <= 96; i++) { const t = (i / 96) * Math.PI * 2, r = rr * (1 + a1 * Math.cos(9 * t + 0.4) + a2 * Math.cos(4 * t + 1.1)); d += (i ? "L" : "M") + f(r * Math.sin(t)) + " " + f(-r * Math.cos(t)); } return d + "Z"; };
    let out = '<circle r="' + f(R * 1.32) + '" fill="url(#' + id + 'h)"/><path d="' + borde(R, 0.022, 0.012) + '" fill="url(#' + id + 'c)" stroke="#36050d" stroke-width="' + f(R * 0.022) + '"/>' +
      '<path d="' + borde(R * 0.985, 0.022, 0.012) + '" fill="none" stroke="#e0596a" stroke-opacity=".28" stroke-width="' + f(R * 0.012) + '"/><path d="' + borde(R * 0.9, 0.02, 0.01) + '" fill="url(#' + id + 'p)"/>';
    FR_ORDEN.forEach((k, i) => {
      const n = niv(k), c = clase(n), a0 = (i / 9) * Math.PI * 2, w = (Math.PI / 9) * 0.93, r0 = R * 0.15, r1 = R * 0.84;
      const P = (r, a) => f(r * Math.sin(a)) + " " + f(-r * Math.cos(a));
      // cámara: cuña de bordes redondeados; entre una y otra queda la membrana blanca
      const cam = "M" + P(r0, a0 - w * 0.55) + "Q" + P(r0 * 1.45, a0 - w * 1.02) + " " + P(R * 0.5, a0 - w) + "Q" + P(r1 * 1.02, a0 - w * 0.98) + " " + P(r1, a0) +
        "Q" + P(r1 * 1.02, a0 + w * 0.98) + " " + P(R * 0.5, a0 + w) + "Q" + P(r0 * 1.45, a0 + w * 1.02) + " " + P(r0, a0 + w * 0.55) + "Q" + P(r0 * 0.9, a0) + " " + P(r0, a0 - w * 0.55) + "Z";
      let g = '<g class="gr-cam' + (sel === k ? " sel" : "") + '" data-k="' + k + '"><path d="' + cam + '" fill="#2c050b"/>';
      [[0.26, 1], [0.35, 2], [0.44, 2], [0.53, 3], [0.62, 3], [0.71, 4], [0.79, 4]].forEach(([rr, m]) => {
        for (let j = 0; j < m; j++) {
          const aa = a0 + (m === 1 ? 0 : (j / (m - 1) - 0.5) * w * (0.5 + rr * 0.92) * (m > 3 ? 1.06 : 1)), rad = R * rr, ax = rad * Math.sin(aa), ay = -rad * Math.cos(aa), sz = R * (0.041 + rr * 0.027);
          g += '<ellipse cx="' + f(ax) + '" cy="' + f(ay) + '" rx="' + f(sz) + '" ry="' + f(sz * 0.82) + '" transform="rotate(' + f((aa * 180) / Math.PI) + " " + f(ax) + " " + f(ay) + ')" fill="url(#' + id + "a" + c + ')"/>' +
            '<ellipse cx="' + f(ax - sz * 0.3) + '" cy="' + f(ay - sz * 0.32) + '" rx="' + f(sz * 0.32) + '" ry="' + f(sz * 0.2) + '" fill="#fff" opacity="' + (ARIL[c][2] * 0.8).toFixed(2) + '"/>';
        }
      });
      if (n > 0) g += '<path d="' + cam + '" fill="url(#' + id + 'l)" opacity="' + Math.min(0.9, 0.2 + n / 14).toFixed(2) + '" style="mix-blend-mode:screen"/>';
      out += g + "</g>";
    });
    out += '<circle r="' + f(R * 0.11) + '" fill="url(#' + id + 'p)" stroke="#cfa77a" stroke-width="' + f(R * 0.012) + '"/>' +
      '<ellipse cx="' + f(-R * 0.3) + '" cy="' + f(-R * 0.36) + '" rx="' + f(R * 0.5) + '" ry="' + f(R * 0.28) + '" transform="rotate(-28 ' + f(-R * 0.3) + " " + f(-R * 0.36) + ')" fill="#fff" opacity=".06"/>';
    const res = { defs, cuerpo: out, tot: FR_ORDEN.reduce((t, k) => t + niv(k), 0) };
    if (CACHE_GRANADA.size >= 24) CACHE_GRANADA.delete(CACHE_GRANADA.keys().next().value);
    CACHE_GRANADA.set(sigG, res);
    return res;
  }
  // La tarjeta del fruto: la granada grande y los nueve aspectos en rejilla de 3 × 3; al tocar uno, su cámara se ilumina y
  // abajo se lee qué lo hace crecer, qué da y su cita (con su lumbrerita, abre los versos en BiEx)
  function tarjetaFruto(y, P) {
    const defs = P.def && P.def.fruto, fr = (P.av && P.av.fr) || {}; if (!Array.isArray(defs)) return null;
    const caja = h("div", { class: "fr-gr" }), desc = h("p", { class: "fr-desc", "aria-live": "polite" });
    const pintar = (sel) => { const g = granadaSVG(fr, 80, sel), el = A.svg("<defs>" + g.defs + "</defs>" + g.cuerpo, "-108 -108 216 216"); el.setAttribute("role", "img");
      el.setAttribute("aria-label", "La granada del fruto del espíritu: " + defs.map((d) => d[1] + " nivel " + ((fr[d[0]] || {}).n | 0)).join(", ")); caja.classList.toggle("elige", !!sel); caja.replaceChildren(el); };
    const rej = h("ul", { class: "fr-rej" });
    const ver = (d, li) => {
      const [k, n, crece, efecto, c] = d, x = fr[k] || { p: 0, n: 0, a: 0, b: 10 }, falta = Math.max(0, x.b - x.p), atr = k === "pl" || k === "cf";
      for (const o of rej.children) o.firstChild.classList.toggle("sel", o === li);
      pintar(k);
      const cita = A.nombreLibro(c[0]) + " " + c[1] + ":" + c[2] + (c[3] > c[2] ? "-" + c[3] : "");
      desc.replaceChildren(h("b", { text: n + " · nivel " + x.n }), x.n >= (P.def.frTope || 40) ? " (el más alto). " : " (faltan " + plural(falta, "punto", "puntos") + " para el nivel " + (x.n + 1) + "). ",
        "Crece: " + crece.charAt(0).toLowerCase() + crece.slice(1) + ". Da: " + efecto.replace(/^\+1 /, "+1 por nivel ").replace("+1 por nivel % ", "+1 % por nivel ") + (x.n ? " (ahora +" + x.n + (atr ? "" : " %") + ")" : "") + ". ",
        h("button", { class: "ap-cita", type: "button", title: "Ver lo que dice", "aria-label": "Ver " + cita, onclick: () => verCita(c[0], c[1], c[2], c[3] || c[2]) }, h("i", { class: "ap-lumbre", "aria-hidden": "true" }), cita));
    };
    defs.forEach((d) => {
      const x = fr[d[0]] || { p: 0, n: 0, a: 0, b: 10 }, pct = x.b > x.a ? Math.max(0, Math.min(100, (100 * (x.p - x.a)) / (x.b - x.a))) : 100;
      const li = h("li");
      li.append(h("button", { class: "fr-t", type: "button", "aria-label": d[1] + ", nivel " + x.n, onclick: () => ver(d, li) },
        h("i", { class: "fr-dot" + (x.n ? "" : " cero"), style: "--l:" + Math.min(16, 3 + x.n * 1.2).toFixed(1) + "px", "aria-hidden": "true" }),
        h("b", { text: d[1] }), h("small", { text: "nivel " + x.n }), h("span", { class: "fr-bar", "aria-hidden": "true" }, h("i", { style: "--p:" + pct.toFixed(1) + "%" }))));
      rej.append(li);
    });
    pintar(null);
    const tot = defs.reduce((t, d) => t + ((fr[d[0]] || {}).n | 0), 0), citaG = A.nombreLibro("GAL") + " 5:22-23";
    desc.replaceChildren("Un solo fruto con nueve cámaras. Cada una se llena de luz rubí al crecer su aspecto, y lo ganado nunca se pierde. Toca un aspecto para ver qué lo hace crecer.");
    const sec = tarjeta("El fruto del espíritu", ico("arbol"), h("div", { class: "fr-c" }, caja, rej, desc,
      h("p", { class: "fr-pie" }, plural(tot, "nivel", "niveles") + " en total · ", h("button", { class: "ap-cita", type: "button", title: "Ver lo que dice", "aria-label": "Ver " + citaG, onclick: () => verCita("GAL", 5, 22, 23) }, h("i", { class: "ap-lumbre", "aria-hidden": "true" }), citaG))));
    sec.id = "jg-fruto";
    return sec;
  }
  // Cosecha del Árbol (BiEx, 14-nov-2026; YÔḥānā́n 4:36-38: uno siembra y otro siega). La cesta se llena con el tiempo hasta
  // 18 h y su medida crece con lo que siembran todos; se recoge cuando se quiera. Al recogerla, una aguja recorre de 0,20 % a
  // 0,50 % y se detiene en la parte que tocó (el fruto del espíritu sube la probabilidad de lo alto).
  const CACHE_CESTA = new Map();
  function cestaSVG(f) {
    // (BiEx, 14-nov-2026: «más fotorrealismo, que no parezca de dibujo animado») cesta de mimbre vista desde arriba en
    // perspectiva: cada hebra del tejido con su volumen (pasa sobre y bajo las varas) y su tono propio, fibras con textura,
    // borde enrollado con sus ataduras, sombra de contacto y luz desde lo alto a la izquierda. Dentro, el grano (trigo con su
    // surco y algunos arilos de granada) sube con lo sembrado y, llena, asoma en montón sobre el borde. Todo vectorial.
    f = Math.round(Math.max(0, Math.min(1, f)) * 200) / 200;
    if (CACHE_CESTA.has(f)) return CACHE_CESTA.get(f);
    const id = "co_", r = azar(77), f1 = (v) => v.toFixed(1), PI = Math.PI;
    const CX = 100, CY = 54, RX = 78, RY = 27, BY = 142, BRX = 56, BRY = 15;
    const el = (t) => ({ y: CY + (BY - CY) * t, rx: RX + (BRX - RX) * t, ry: RY + (BRY - RY) * t });
    const pt = (t, a) => { const e = el(t); return [CX + e.rx * Math.cos(a), e.y + e.ry * Math.sin(a)]; };
    const P = (q) => f1(q[0]) + " " + f1(q[1]);
    // el frente de la cesta (entre la mitad delantera del borde y la de la base)
    const cuerpo = "M" + P(pt(0, PI)) + "A" + RX + " " + RY + " 0 0 0 " + P(pt(0, 0)) + "L" + P(pt(1, 0)) + "A" + BRX + " " + BRY + " 0 0 1 " + P(pt(1, PI)) + "Z";
    // tejido: filas de hebras escalonadas, cada tramo con volumen (más claro al centro, se hunde en sus extremos)
    const FILAS = 9, SEG = 13; let tej = "", varas = "", luces = "";
    for (let k = 0; k < FILAS; k++) {
      const t0 = k / FILAS + 0.007, t1 = (k + 1) / FILAS - 0.007, off = (k % 2) * 0.5, e0 = el(t0), e1 = el(t1);
      for (let i = -1; i < SEG; i++) {
        const a0 = Math.max(0, ((i + off) / SEG) * PI) + 0.013, a1 = Math.min(PI, ((i + 1 + off) / SEG) * PI) - 0.013; if (a1 - a0 < 0.03) continue;
        tej += '<path d="M' + P(pt(t0, a0)) + "A" + f1(e0.rx) + " " + f1(e0.ry) + " 0 0 1 " + P(pt(t0, a1)) + "L" + P(pt(t1, a1)) + "A" + f1(e1.rx) + " " + f1(e1.ry) + " 0 0 0 " + P(pt(t1, a0)) + 'Z" fill="url(#' + id + "h" + Math.floor(r() * 4) + ')"/>';
      }
      // la vara queda a la vista donde la hebra de esta fila pasa por detrás
      for (let i = 0; i <= SEG; i++) { const a = ((i + off) / SEG) * PI; if (a <= 0.02 || a >= PI - 0.02) continue; const q0 = pt(t0 - 0.004, a), q1 = pt(t1 + 0.004, a);
        varas += '<path d="M' + P(q0) + "L" + P(q1) + '"/>'; luces += '<path d="M' + f1(q0[0] - 0.55) + " " + f1(q0[1] + 0.6) + "L" + f1(q1[0] - 0.55) + " " + f1(q1[1] - 0.6) + '"/>'; }
    }
    // grano: cada uno como elipse girada por su arco (el degradado no gira: la luz viene siempre de arriba a la izquierda)
    let gr = "";
    const grano = (x, y) => {
      const a = (-20 + r() * 220) * PI / 180, c = Math.cos(a), sn = Math.sin(a), rojo = r() < 0.07, rx = rojo ? 2.3 : 2.9 + r() * 0.5, ry = rojo ? 2 : 1.65 + r() * 0.25, gd = (a * 180 / PI).toFixed(0);
      const el2 = (dx, dy) => "M" + f1(x + dx + rx * c) + " " + f1(y + dy + rx * sn) + "A" + rx + " " + ry + " " + gd + " 1 1 " + f1(x + dx - rx * c) + " " + f1(y + dy - rx * sn) + "A" + rx + " " + ry + " " + gd + " 1 1 " + f1(x + dx + rx * c) + " " + f1(y + dy + rx * sn) + "Z";
      gr += '<path d="' + el2(0.55, 0.85) + '" fill="#1a0f04" opacity=".42"/><path d="' + el2(0, 0) + '" fill="url(#' + id + (rojo ? "r" : "g" + Math.floor(r() * 3)) + ')"/>';
      if (!rojo) { const k = 0.72 * rx, nx = -sn * 0.42, ny = c * 0.42; gr += '<path d="M' + f1(x - k * c) + " " + f1(y - k * sn) + "Q" + f1(x + nx) + " " + f1(y + ny) + " " + f1(x + k * c) + " " + f1(y + k * sn) + '" fill="none" stroke="#6a3e0c" stroke-opacity=".5" stroke-width=".42" stroke-linecap="round"/>'; }
      else gr += '<circle cx="' + f1(x - 0.7) + '" cy="' + f1(y - 0.7) + '" r=".62" fill="#fff" opacity=".6"/>';
    };
    const ys = CY + 4 + (1 - f) * 40, rxs = 52 + 23 * f, rys = (RY * rxs) / RX, hd = 26 * Math.max(0, (f - 0.82) / 0.18);
    if (f > 0.02) {
      for (let y = ys - rys; y <= ys + rys; y += 3.3) { const hw = rxs * Math.sqrt(Math.max(0, 1 - Math.pow((y - ys) / rys, 2))); for (let x = -hw + 1 + r() * 3; x < hw - 1; x += 5.4 + r() * 1.4) grano(CX + x, y + r() * 1.4); }
      for (let y = CY - hd; hd > 0 && y <= CY; y += 3.4) { const hw = (RX - 3) * Math.sqrt(Math.max(0, 1 - Math.pow((CY - y) / hd, 2))); for (let x = -hw + 1 + r() * 3; x < hw - 1; x += 5.6 + r() * 1.4) grano(CX + x, y + r() * 1.4); }
    }
    const boca = '<ellipse cx="' + CX + '" cy="' + CY + '" rx="' + (RX - 4) + '" ry="' + (RY - 3.6) + '"/>' + (hd > 0 ? '<path d="M' + (CX - RX + 4) + " " + CY + "A" + (RX - 4) + " " + f1(hd) + " 0 0 1 " + (CX + RX - 4) + " " + CY + 'Z"/>' : "");
    // ataduras del borde delantero
    const torsion = (a0, a1, paso, lado) => { let o = "";
      for (let a = a0; a < a1; a += paso) { const q = pt(0, a), g = (Math.atan2(RY * Math.cos(a), -RX * Math.sin(a)) * 180 / PI - 38 * lado).toFixed(0);
        o += '<ellipse cx="' + f1(q[0]) + '" cy="' + f1(q[1]) + '" rx="5.3" ry="3.3" transform="rotate(' + g + " " + f1(q[0]) + " " + f1(q[1]) + ')" fill="url(#' + id + "h" + (Math.floor(a * 7) % 4) + ')"/>'; }
      return o; };
    const at = torsion(-0.09, PI + 0.1, 0.105, 1);
    // paredes interiores (al fondo, sobre el grano): hebras tenues
    let fondo = ""; for (let k = 1; k <= 4; k++) { const e = el(k * 0.09); fondo += '<path d="M' + P(pt(k * 0.09, PI)) + "A" + f1(e.rx) + " " + f1(e.ry) + " 0 0 1 " + P(pt(k * 0.09, 0)) + '" fill="none" stroke="#c99a55" stroke-opacity="' + (0.11 - k * 0.018).toFixed(3) + '" stroke-width="3.2" stroke-dasharray="7 2.2"/>'; }
    const trasero = '<path d="M' + P(pt(0, 0)) + "A" + RX + " " + RY + " 0 0 0 " + P(pt(0, PI)) + '" fill="none" stroke="#2a1806" stroke-width="8.5" stroke-linecap="round"/>' +
      '<g filter="url(#' + id + 't)" opacity=".86">' + torsion(PI - 0.05, 2 * PI + 0.05, 0.11, -1) + "</g>";
    const hebra = (k, c0, c1, c2) => '<radialGradient id="' + id + "h" + k + '" cx=".5" cy=".36" r=".62"><stop offset="0" stop-color="' + c0 + '"/><stop offset=".58" stop-color="' + c1 + '"/><stop offset="1" stop-color="' + c2 + '"/></radialGradient>';
    const trigo = (k, c0, c1, c2) => '<radialGradient id="' + id + "g" + k + '" cx=".36" cy=".3" r=".78"><stop offset="0" stop-color="' + c0 + '"/><stop offset=".55" stop-color="' + c1 + '"/><stop offset="1" stop-color="' + c2 + '"/></radialGradient>';
    const out = '<defs>' + hebra(0, "#f2d29a", "#d2a462", "#7a4c1c") + hebra(1, "#e8c486", "#c7975a", "#704419") + hebra(2, "#ddb878", "#bb8b4e", "#653d15") + hebra(3, "#f6dcaa", "#d9ad6c", "#82531f") +
      trigo(0, "#fff1c4", "#e7b85c", "#93601c") + trigo(1, "#fbe6b0", "#dcaa50", "#865616") + trigo(2, "#fff6d6", "#efc56d", "#a06a22") +
      '<radialGradient id="' + id + 'r" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#ffb3c0"/><stop offset=".45" stop-color="#d42a48"/><stop offset="1" stop-color="#6e0a1c"/></radialGradient>' +
      '<linearGradient id="' + id + 'b" gradientUnits="userSpaceOnUse" x1="20" x2="180"><stop offset="0" stop-color="#4a2e0e"/><stop offset=".3" stop-color="#c8954a"/><stop offset=".42" stop-color="#f0cf8e"/><stop offset=".7" stop-color="#b07c38"/><stop offset="1" stop-color="#3e270c"/></linearGradient>' +
      '<linearGradient id="' + id + 'o" x1="0" x2="1"><stop offset="0" stop-color="#000" stop-opacity=".62"/><stop offset=".2" stop-color="#000" stop-opacity=".14"/><stop offset=".38" stop-color="#fff4dc" stop-opacity=".1"/><stop offset=".64" stop-color="#000" stop-opacity=".06"/><stop offset=".86" stop-color="#000" stop-opacity=".38"/><stop offset="1" stop-color="#000" stop-opacity=".66"/></linearGradient>' +
      '<linearGradient id="' + id + 'v" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".3"/><stop offset=".22" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".42"/></linearGradient>' +
      '<radialGradient id="' + id + 'i" cx=".5" cy=".62" r=".62"><stop offset="0" stop-color="#3a2408"/><stop offset=".7" stop-color="#1f1204"/><stop offset="1" stop-color="#0d0702"/></radialGradient>' +
      '<radialGradient id="' + id + 'a" cx=".42" cy=".38" r=".66"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".5"/></radialGradient>' +
      '<radialGradient id="' + id + 's" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#000" stop-opacity=".55"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>' +
      '<filter id="' + id + 't" x="-2%" y="-2%" width="104%" height="104%"><feTurbulence type="fractalNoise" baseFrequency=".22 1.5" numOctaves="2" seed="7" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 .1  0 0 0 0 .06  0 0 0 0 .02  0 0 0 -1.25 1.05" result="a"/><feComposite in="a" in2="SourceGraphic" operator="in" result="t"/><feBlend in="t" in2="SourceGraphic" mode="multiply"/></filter>' +
      '<clipPath id="' + id + 'c">' + boca + '</clipPath><clipPath id="' + id + 'f"><path d="' + cuerpo + '"/></clipPath></defs>' +
      '<ellipse cx="100" cy="147" rx="84" ry="11" fill="url(#' + id + 's)"/>' +
      // boca: interior oscuro, paredes del fondo, grano y su sombra junto a las paredes
      '<ellipse cx="' + CX + '" cy="' + CY + '" rx="' + RX + '" ry="' + RY + '" fill="url(#' + id + 'i)"/>' + fondo + (hd > 0 ? trasero : "") +
      '<g clip-path="url(#' + id + 'c)">' + gr + (f > 0.02 ? '<ellipse cx="' + CX + '" cy="' + f1(ys) + '" rx="' + f1(rxs + 3) + '" ry="' + f1(rys + 2) + '" fill="url(#' + id + 'a)"/>' : "") + "</g>" +
      // borde trasero (enrollado): delante del grano; llena, detrás del montón que asoma
      (hd > 0 ? "" : trasero) +
      // frente tejido con textura de fibra, volumen y sombra del borde
      '<path d="' + cuerpo + '" fill="#2a1806"/>' +
      '<g filter="url(#' + id + 't)">' + tej + '<g fill="none" stroke-linecap="round" stroke="url(#' + id + 'h1)" stroke-width="2.6">' + varas + '</g></g><g fill="none" stroke="#ffe9bb" stroke-opacity=".22" stroke-width=".7">' + luces + "</g>" +
      '<path d="' + cuerpo + '" fill="url(#' + id + 'o)"/><path d="' + cuerpo + '" fill="url(#' + id + 'v)"/>' +
      '<path d="M' + P(pt(1, PI)) + "A" + BRX + " " + BRY + " 0 0 0 " + P(pt(1, 0)) + '" fill="none" stroke="#140b03" stroke-width="3"/>' +
      // borde delantero enrollado con sus ataduras y su brillo
      '<path d="M' + P(pt(0, PI)) + "A" + RX + " " + RY + " 0 0 0 " + P(pt(0, 0)) + '" fill="none" stroke="#1a0f04" stroke-opacity=".55" stroke-width="12" stroke-linecap="round" transform="translate(0 3)"/>' +
      '<path d="M' + P(pt(0, PI)) + "A" + RX + " " + RY + " 0 0 0 " + P(pt(0, 0)) + '" fill="none" stroke="#2a1806" stroke-width="9.5" stroke-linecap="round"/>' +
      '<g filter="url(#' + id + 't)">' + at + "</g>" +
      '<path d="M' + P(pt(0, PI)) + "A" + RX + " " + RY + " 0 0 0 " + P(pt(0, 0)) + '" fill="none" stroke="url(#' + id + 'o)" stroke-width="10" stroke-linecap="round" opacity=".55"/>' +
      '<path d="M' + P(pt(0, PI - 0.06)) + "A" + RX + " " + RY + " 0 0 0 " + P(pt(0, 0.9)) + '" fill="none" stroke="#fff1cc" stroke-opacity=".38" stroke-width="1.3" transform="translate(-1 -2.6)"/>';
    if (CACHE_CESTA.size >= 12) CACHE_CESTA.delete(CACHE_CESTA.keys().next().value);
    CACHE_CESTA.set(f, out);
    return out;
  }
  // AC5 (BiEx, 15-nov-2026: «híper realista y épico»): instrumento de joyería en vector (nítido a cualquier densidad): bisel de
  // oro cepillado con su brillo, esfera honda de esmalte negro con grabado de rayas, escala mayor y menor grabadas, arco de
  // gemas del ámbar al rubí con su resplandor, cifras en la letra de los títulos y un cristal con su reflejo. La aguja de
  // metal y su eje de gema van en la capa que gira (medidorAguja).
  function medidorSVG() {
    const C = 120, R0 = 104, P = (r, a) => (C + r * Math.cos(a)).toFixed(2) + " " + (C - r * Math.sin(a)).toFixed(2);
    let esc = "";
    for (let i = 0; i <= 30; i++) { const a = Math.PI * (1 - i / 30), m = i % 5 === 0;
      esc += '<path d="M' + P(m ? 70 : 74, a) + "L" + P(m ? 83 : 80, a) + '" stroke="' + (m ? "#f6dc9a" : "#cfae6a") + '" stroke-opacity="' + (m ? 0.95 : 0.55) + '" stroke-width="' + (m ? 2.2 : 1.1) + '" stroke-linecap="round"/>'; }
    const cif = [0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5].map((x, i) => { const a = Math.PI * (1 - i / 6); return '<text x="' + (C + 58 * Math.cos(a)).toFixed(1) + '" y="' + (C - 58 * Math.sin(a) + 3.6).toFixed(1) + '" text-anchor="middle" font-size="' + (i % 3 === 0 ? 9.6 : 7.6) + '" fill="#f2dfb0" fill-opacity="' + (i % 3 === 0 ? 0.92 : 0.6) + '" style="font-family:var(--f-display);letter-spacing:.02em">' + String(x.toFixed(2)).replace(".", ",") + "</text>"; }).join("");
    const rayas = Array.from({ length: 36 }, (_, i) => { const a = Math.PI * (i / 35); return '<path d="M' + P(18, a) + "L" + P(96, a) + '" stroke="#ffffff" stroke-opacity=".025" stroke-width="2.2"/>'; }).join("");
    return '<defs>' +
      '<linearGradient id="co-bisel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff2c4"/><stop offset=".22" stop-color="#e2b55a"/><stop offset=".5" stop-color="#8a5a1a"/><stop offset=".74" stop-color="#d8a648"/><stop offset="1" stop-color="#5b3a10"/></linearGradient>' +
      '<radialGradient id="co-esfera" cx=".5" cy=".95" r=".95"><stop offset="0" stop-color="#2a1e12"/><stop offset=".55" stop-color="#140f0a"/><stop offset="1" stop-color="#060504"/></radialGradient>' +
      '<linearGradient id="co-gema" x1="0" x2="1"><stop offset="0" stop-color="#b9772a"/><stop offset=".35" stop-color="#e8a640"/><stop offset=".62" stop-color="#d6344f"/><stop offset="1" stop-color="#ff6f8a"/></linearGradient>' +
      '<linearGradient id="co-cristal" x1="0" y1="0" x2=".2" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity=".22"/><stop offset=".45" stop-color="#ffffff" stop-opacity=".04"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></linearGradient>' +
      '<filter id="co-brillo" x="-20%" y="-40%" width="140%" height="180%"><feGaussianBlur stdDeviation="3.2"/></filter></defs>' +
      // bisel y esfera
      '<path d="M' + P(R0 + 8, Math.PI) + "A" + (R0 + 8) + " " + (R0 + 8) + " 0 0 1 " + P(R0 + 8, 0) + "L" + P(R0 - 8, 0) + "A" + (R0 - 8) + " " + (R0 - 8) + ' 0 0 0 ' + P(R0 - 8, Math.PI) + 'Z" fill="url(#co-bisel)"/>' +
      '<path d="M' + P(R0 + 8, Math.PI) + "A" + (R0 + 8) + " " + (R0 + 8) + " 0 0 1 " + P(R0 + 8, 0) + '" fill="none" stroke="#fff6d8" stroke-opacity=".55" stroke-width=".9"/>' +
      '<path d="M' + P(R0 - 8, Math.PI) + "A" + (R0 - 8) + " " + (R0 - 8) + " 0 0 1 " + P(R0 - 8, 0) + 'L' + P(R0 - 8, 0) + 'Z" fill="url(#co-esfera)"/>' + rayas +
      // arco de gemas con su resplandor
      '<path d="M' + P(88, Math.PI) + "A88 88 0 0 1 " + P(88, 0) + '" fill="none" stroke="url(#co-gema)" stroke-width="7" stroke-linecap="round" filter="url(#co-brillo)" opacity=".55"/>' +
      '<path d="M' + P(88, Math.PI) + "A88 88 0 0 1 " + P(88, 0) + '" fill="none" stroke="url(#co-gema)" stroke-width="4.2" stroke-linecap="round"/>' +
      '<path d="M' + P(89.6, Math.PI - 0.05) + "A89.6 89.6 0 0 1 " + P(89.6, 0.05) + '" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width=".7"/>' +
      esc + cif +
      // cristal
      '<path d="M' + P(R0 - 9, Math.PI - 0.02) + "A" + (R0 - 9) + " " + (R0 - 9) + " 0 0 1 " + P(R0 - 9, 0.02) + 'Q120 40 ' + P(R0 - 9, Math.PI - 0.02) + 'Z" fill="url(#co-cristal)"/>';
  }
  function medidorAguja() {
    return '<defs><linearGradient id="co-ag" x1="0" x2="1"><stop offset="0" stop-color="#8f6420"/><stop offset=".5" stop-color="#fff0c2"/><stop offset="1" stop-color="#a87628"/></linearGradient>' +
      '<radialGradient id="co-eje" cx=".38" cy=".32" r=".7"><stop offset="0" stop-color="#ffd9e2"/><stop offset=".35" stop-color="#e0405e"/><stop offset="1" stop-color="#5e0c1c"/></radialGradient></defs>' +
      '<path d="M120 26L123.4 118L120 132L116.6 118Z" fill="url(#co-ag)" stroke="#3a2608" stroke-width=".6"/>' +
      '<path d="M120 26L121 118" stroke="#fffbe8" stroke-opacity=".7" stroke-width=".6"/>' +
      '<circle cx="120" cy="120" r="10" fill="#1a1208" stroke="url(#co-ag)" stroke-width="2.4"/><circle cx="120" cy="120" r="6.2" fill="url(#co-eje)"/><circle cx="118" cy="118" r="1.8" fill="#fff" fill-opacity=".8"/>';
  }
  function medidorSVGViejo() {
    let t = "";
    for (let i = 0; i <= 6; i++) { const a = Math.PI * (1 - i / 6), x1 = 120 + 86 * Math.cos(a), y1 = 120 - 86 * Math.sin(a), x2 = 120 + 76 * Math.cos(a), y2 = 120 - 76 * Math.sin(a);
      t += '<line x1="' + x1.toFixed(1) + '" y1="' + y1.toFixed(1) + '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) + '" stroke="#f3d08a" stroke-opacity=".5" stroke-width="2" stroke-linecap="round"/>'; }
    return '<defs><linearGradient id="co-arco" x1="0" x2="1"><stop offset="0" stop-color="#c9902e"/><stop offset=".6" stop-color="#e3485f"/><stop offset="1" stop-color="#ff7d93"/></linearGradient></defs>' +
      '<path d="M20 120A100 100 0 0 1 220 120" fill="none" stroke="rgba(127,127,127,.18)" stroke-width="12" stroke-linecap="round"/>' +
      '<path d="M20 120A100 100 0 0 1 220 120" fill="none" stroke="url(#co-arco)" stroke-width="8" stroke-linecap="round"/>' + t +
      '<text x="20" y="138" text-anchor="middle" font-size="12" fill="currentColor" opacity=".7" style="font-family:var(--f-ui)">0,20 %</text><text x="220" y="138" text-anchor="middle" font-size="12" fill="currentColor" opacity=".7" style="font-family:var(--f-ui)">0,50 %</text>';
  }
  const pctTxt = (p) => (p * 100).toFixed(2).replace(".", ",") + " %";
  // AC12 (BiEx, 15-nov-2026: «no puedo ver en dónde se almacenan ni cuántos tengo ni cómo lucen»): los fragmentos de papiro se
  // guardan en Tesoro, en un rollo de 70 piezas que se va completando (las que tienes, en papiro iluminado; las que faltan,
  // apenas trazadas). Al reunir 70 se abre un accesorio raro de la vitrina del Árbol; luego empieza otro rollo.
  const CACHE_PAPIRO = new Map();
  function papiroSVG(c, meta) {
    const N = meta || 70, clave = c + ":" + N;
    if (CACHE_PAPIRO.has(clave)) return CACHE_PAPIRO.get(clave);
    const cols = 10, filas = Math.ceil(N / cols), W = 300, H = 150, x0 = 26, y0 = 22, w = (W - 2 * x0) / cols, hh = (H - 2 * y0) / filas;
    let piezas = "", lineas = "";
    for (let r = 0; r < filas; r++) {
      const ly = (y0 + r * hh + hh * 0.5).toFixed(1);
      lineas += '<line x1="25" y1="' + ly + '" x2="275" y2="' + ly + '" stroke="#c9a46a" stroke-opacity=".1" stroke-width=".5"/>';
    }
    for (let i = 0; i < N; i++) {
      const cx = x0 + (i % cols) * w, cy = y0 + Math.floor(i / cols) * hh, j = ((i * 37) % 11) / 11, k = ((i * 53) % 7) / 7, si = i < c, ult = si && i === c - 1;
      // cada pieza con su borde roto propio (determinista); la pieza más reciente lleva un destello de oro fino
      const x1 = (cx + 1.4 + j * 1.8).toFixed(1), y1 = (cy + 1.1).toFixed(1);
      const x2 = (cx + w - 1.1).toFixed(1), y2 = (cy + 0.9 + k * 1.9).toFixed(1);
      const x3 = (cx + w - 1.5 - j * 1.4).toFixed(1), y3 = (cy + hh - 1.3).toFixed(1);
      const x4 = (cx + 1 + k * 1.6).toFixed(1), y4 = (cy + hh - 1).toFixed(1);
      const d = "M" + x1 + " " + y1 + "L" + x2 + " " + y2 + "L" + x3 + " " + y3 + "L" + x4 + " " + y4 + "Z";
      if (si) {
        const tono = (i + Math.floor(i / cols)) % 3 === 0 ? "pp-f2" : "pp-f";
        piezas += '<path d="' + d + '" fill="url(#' + tono + ')" stroke="' + (ult ? "#fff1be" : "#785022") + '" stroke-opacity="' + (ult ? ".92" : ".58") + '" stroke-width="' + (ult ? "1.1" : ".6") + '"/>';
        piezas += '<path d="M' + x1 + " " + y1 + "L" + x2 + " " + y2 + '" stroke="#fff7df" stroke-opacity="' + (ult ? ".72" : ".32") + '" stroke-width=".55" fill="none"/>';
        const l1 = (w - 6.5 - j * 3).toFixed(1), l2 = (w - 8.5 - k * 3).toFixed(1);
        piezas += '<path d="M' + (cx + 3.2).toFixed(1) + " " + (cy + hh * 0.42).toFixed(1) + "h" + l1 + ((i * 7) % 2 === 0 ? "M" + (cx + 3.6).toFixed(1) + " " + (cy + hh * 0.68).toFixed(1) + "h" + l2 : "") + '" stroke="#523311" stroke-opacity=".34" stroke-width=".62" stroke-linecap="round"/>';
      } else {
        piezas += '<path d="' + d + '" fill="#1f150b" fill-opacity=".22" stroke="#c9a46a" stroke-opacity=".22" stroke-width=".65" stroke-dasharray="2 2"/>';
      }
    }
    const svg = '<defs><linearGradient id="pp-f" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f7e7bf"/><stop offset=".52" stop-color="#e1bd7d"/><stop offset="1" stop-color="#b68545"/></linearGradient>' +
      '<linearGradient id="pp-f2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f2dda9"/><stop offset=".58" stop-color="#d5ae6c"/><stop offset="1" stop-color="#a8793c"/></linearGradient>' +
      '<radialGradient id="pp-fondo" cx=".5" cy=".46" r=".62"><stop offset="0" stop-color="#4e3418" stop-opacity=".54"/><stop offset="1" stop-color="#191008" stop-opacity=".68"/></radialGradient></defs>' +
      '<rect x="18" y="13" width="264" height="124" rx="7" fill="url(#pp-fondo)" stroke="#c9a46a" stroke-opacity=".24" stroke-width=".75"/>' +
      lineas + piezas + rolloPapiro(4, false) + rolloPapiro(280, true);
    if (CACHE_PAPIRO.size > 12) CACHE_PAPIRO.clear();
    CACHE_PAPIRO.set(clave, svg);
    return svg;
  }
  // (BiEx, 15-nov-2026, adjunto 1: «que las hojas de los lados se vean fotorrealistas») los dos extremos enrollados del rollo:
  // cilindro de papiro con su sombreado, fibras horizontales y verticales, bordes que no son rectos, las vueltas del rollo en
  // la tapa de arriba y la sombra que cada rollo echa sobre la hoja abierta. Vectorial y quieto (se dibuja una sola vez).
  function rolloPapiro(x, der) {
    const w = 16, y0 = 7, y1 = 143, cx = x + w / 2, id = "pr" + (der ? "d" : "i");
    const borde = "M" + (x + 0.9) + " " + (y0 + 2.4) + "Q" + cx + " " + (y0 + 0.6) + " " + (x + w - 0.9) + " " + (y0 + 2.4) + "L" + (x + w - 0.5) + " " + (y0 + 40) + "L" + (x + w - 0.8) + " " + (y0 + 41.5) + "L" + (x + w - 0.4) + " " + (y1 - 30) + "L" + (x + w - 0.9) + " " + (y1 - 2.2) +
      "Q" + cx + " " + (y1 - 0.2) + " " + (x + 0.9) + " " + (y1 - 2.2) + "L" + (x + 0.5) + " " + (y1 - 52) + "L" + (x + 0.9) + " " + (y1 - 50.6) + "L" + (x + 0.4) + " " + (y0 + 26) + "Z";
    const anillos = [5.9, 4.6, 3.3, 2.1, 1.1].map((r, i) => '<ellipse cx="' + cx + '" cy="' + (y0 + 2.4) + '" rx="' + r + '" ry="' + (r * 0.3).toFixed(2) + '" fill="none" stroke="' + (i % 2 ? "#5b3a13" : "#f0d9a6") + '" stroke-opacity="' + (i % 2 ? 0.75 : 0.85) + '" stroke-width=".5"/>').join("");
    const sx = der ? x - 11 : x + w - 0.5;
    // fibras: tiras horizontales de largo, grosor y tono distintos (como las del papiro, que nunca son regulares) y unas pocas verticales
    let fib = ""; for (let i = 0; i < 46; i++) { const a = ((i * 73 + (der ? 29 : 11)) % 97) / 97, b = ((i * 41 + 7) % 89) / 89, yy = y0 + 4 + i * ((y1 - y0 - 8) / 46) + (a - 0.5) * 1.6, x1 = x + 0.6 + b * 4, x2 = x + w - 0.6 - a * 4;
      fib += '<path d="M' + x1.toFixed(1) + " " + yy.toFixed(1) + "Q" + cx + " " + (yy + (b - 0.5) * 0.9).toFixed(1) + " " + x2.toFixed(1) + " " + (yy + (a - 0.5) * 0.5).toFixed(1) + '" stroke="' + (i % 3 ? "#4b3214" : "#f3e2bb") + '" stroke-opacity="' + (i % 3 ? 0.1 + a * 0.16 : 0.08 + b * 0.12).toFixed(2) + '" stroke-width="' + (0.22 + a * 0.3).toFixed(2) + '" fill="none"/>'; }
    for (let i = 0; i < 5; i++) { const xx = x + 2.4 + i * 2.8 + (((i * 37) % 10) / 10 - 0.5); fib += '<path d="M' + xx.toFixed(1) + " " + (y0 + 5) + "V" + (y1 - 5) + '" stroke="#2d1c08" stroke-opacity=".08" stroke-width=".35"/>'; }
    return '<defs><linearGradient id="' + id + 'c" x1="0" x2="1"><stop offset="0" stop-color="#33230e"/><stop offset=".13" stop-color="#7a5830"/><stop offset=".34" stop-color="#c8a875"/><stop offset=".49" stop-color="#ead8b0"/><stop offset=".6" stop-color="#d6b986"/><stop offset=".83" stop-color="#7f5b2e"/><stop offset="1" stop-color="#2f1f0b"/></linearGradient>' +
      '<linearGradient id="' + id + 'v" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff4d8" stop-opacity=".22"/><stop offset=".12" stop-color="#fff4d8" stop-opacity="0"/><stop offset=".88" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".35"/></linearGradient>' +
      '<linearGradient id="' + id + 's" x1="' + (der ? 1 : 0) + '" x2="' + (der ? 0 : 1) + '"><stop offset="0" stop-color="#000" stop-opacity=".5"/><stop offset=".45" stop-color="#000" stop-opacity=".16"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>' +

      '<linearGradient id="' + id + 'l" x1="' + (der ? 1 : 0) + '" x2="' + (der ? 0 : 1) + '"><stop offset="0" stop-color="#5a3d1a" stop-opacity=".85"/><stop offset=".55" stop-color="#a5814f" stop-opacity=".6"/><stop offset="1" stop-color="#c7a676" stop-opacity=".25"/></linearGradient>' +
      '<clipPath id="' + id + 'k"><path d="' + borde + '"/></clipPath></defs>' +
      // sombra sobre la hoja, el cilindro, sus fibras, el brillo de la curva y las vueltas de la tapa
      '<rect x="' + sx + '" y="' + (y0 + 7) + '" width="11.5" height="' + (y1 - y0 - 12) + '" fill="url(#' + id + 's)"/>' +
      '<path d="M' + (der ? x + 0.6 : x + w - 0.6) + " " + (y0 + 7.5) + "C" + (der ? x - 2.4 : x + w + 2.4) + " " + (y0 + 8) + " " + (der ? x - 3.4 : x + w + 3.4) + " " + (y0 + 9) + " " + (der ? x - 3.6 : x + w + 3.6) + " " + (y0 + 11) + "V" + (y1 - 11) + "C" + (der ? x - 3.4 : x + w + 3.4) + " " + (y1 - 9) + " " + (der ? x - 2.4 : x + w + 2.4) + " " + (y1 - 8) + " " + (der ? x + 0.6 : x + w - 0.6) + " " + (y1 - 7.5) + 'Z" fill="url(#' + id + 'l)"/>' +
      '<path d="' + borde + '" fill="url(#' + id + 'c)" stroke="#2c1a07" stroke-opacity=".55" stroke-width=".5"/>' +
      '<g clip-path="url(#' + id + 'k)">' + fib + '<rect x="' + x + '" y="' + y0 + '" width="' + w + '" height="' + (y1 - y0) + '" fill="url(#' + id + 'v)"/>' +
      '<path d="M' + (cx - 1.6) + " " + (y0 + 6) + "V" + (y1 - 6) + '" stroke="#fffaf0" stroke-opacity=".38" stroke-width=".9" stroke-linecap="round"/>' +
      '<path d="M' + (x + 2.2) + " " + (y0 + 31) + "c1.6 .8 3.4 .6 4.8 -.3M" + (x + 9) + " " + (y1 - 44) + "c1.4 .6 3 .5 4.4 -.4" + '" fill="none" stroke="#4a2e0f" stroke-opacity=".45" stroke-width=".45"/></g>' +
      '<ellipse cx="' + cx + '" cy="' + (y0 + 2.4) + '" rx="7.2" ry="2.2" fill="#3b240b"/>' + anillos +
      '<path d="M' + (x + 1) + " " + (y1 - 2.2) + "Q" + cx + " " + (y1 + 0.9) + " " + (x + w - 1) + " " + (y1 - 2.2) + '" fill="none" stroke="#2a1806" stroke-opacity=".6" stroke-width=".8"/>';
  }
  function tarjetaPapiros(y) {
    const f = y.frag || { n: 0, c: 0, meta: 70 }, meta = f.meta || 70, c = Math.min(meta, f.c || 0), faltan = Math.max(0, meta - c);
    const raros = (S.cfg && S.cfg.raros) || RAROS_C, inv = (y.av && y.av.inv) || [], sig = raros.find((x) => !inv.includes(x[0])) || null; // el servidor abre el primer raro que aún no tienes
    const arte = h("div", { class: "jg-pp", role: "img", "aria-label": "Rollo de papiro: " + c + " de " + meta + " fragmentos" },
      A.svg(papiroSVG(c, meta), "0 0 300 150"),
      h("span", { class: "jg-pp-brillo", "aria-hidden": "true" }));
    const escena = observarFlotantes(h("div", { class: "jg-pp-escena" },
      h("span", { class: "jg-pp-halo", "aria-hidden": "true" }),
      arte,
      h("span", { class: "jg-pp-sombra", "aria-hidden": "true" })));
    const prox = sig ? h("div", { class: "jg-pp-prox" },
      h("span", { class: "jg-pp-prox-ico", "aria-hidden": "true" }, A.svg(muestraAcc(sig[0], sig[1]), "0 0 48 48")),
      h("div", { class: "jg-pp-prox-t" }, h("small", { text: "Próximo accesorio raro · +25 poder" }), h("b", { text: sig[2] })),
      h("span", { class: "jg-pp-prox-n", text: faltan ? "Faltan " + fmt(faltan) : "¡Listo!" })) : null;
    return tarjeta("Tus fragmentos de papiro", ico("liga"), escena,
      h("p", { class: "jg-pp-c" }, h("b", { text: fmt(c) }), h("span", { text: " de " + meta }), h("small", { text: "fragmentos en este rollo" + (f.n > c ? " · " + fmt(f.n) + " en total" : "") })),
      h("div", { class: "jg-barra oro", "aria-hidden": "true" }, h("i", { style: "width:" + (100 * c / meta).toFixed(1) + "%" })),
      prox,
      h("p", { class: "jg-mini", text: "Salen al marcar «Leído» en los versos (cada vez hay más probabilidad hasta que sale uno). Al reunir " + meta + " se abre " + (sig ? "un accesorio raro: «" + sig[2] + "»" : "un premio: 100 dracmas y 1 hora de experiencia doble") + ", y empieza otro rollo. Cada hallazgo queda en tus Novedades." }));
  }
  // AC5 y AC6 (BiEx, 15-nov-2026): un verso aleatorio de la Lectura acompaña la cosecha y el reparto de atributos. Solo versos
  // con su traducción completa (datos/juego/versos_lectura.json); la mitad de las veces, de los textos de BiEx. Se dibuja como
  // en el lector (A.versos respeta sus opciones del texto) y lleva a su capítulo.
  let VL = null;
  async function versoDeLectura() {
    if (!VL) VL = A.cargar("datos/juego/versos_lectura.json").catch(() => { VL = null; return null; });
    const d = await VL; if (!d) return null;
    const l = Math.random() < 0.5 && d.a && d.a.length ? d.a : d.b; if (!l || !l.length) return null;
    const [c, cap, v] = l[Math.floor(Math.random() * l.length)];
    try { const r = await A.versos(c, cap, v, v); return r && r[0] ? { c, cap, v, nodo: r[0][1] } : null; } catch (e) { return null; }
  }
  function tarjetaVerso(titulo) {
    const cuerpo = h("p", { class: "jg-vl-t" }, h("span", { class: "cargando-mini", text: "Buscando un verso…" })), pie = h("div", { class: "jg-vl-pie" });
    const el = h("div", { class: "jg-vl", role: "group", "aria-label": titulo || "Un verso para ti" }, h("span", { class: "jg-vl-luz", "aria-hidden": "true" }), h("small", { class: "jg-vl-rot", text: titulo || "Un verso para ti" }), cuerpo, pie);
    let tVis = Date.now();
    el._visto = () => { tVis = Date.now(); };
    versoDeLectura().then((x) => {
      if (!x) { el.remove(); return; }
      cuerpo.replaceChildren(x.nodo);
      if (!el.classList.contains("espera")) tVis = Date.now();
      const lc = x.c + "." + x.cap, clave = lc + "." + x.v;
      const esRep = marcadoAntes(lc, x.v), ya = LB.ok.has(clave);
      const pal = Math.max(4, (x.nodo.textContent || "").trim().split(/\s+/).filter(Boolean).length);
      const reqMs = Math.max((S.cfg && S.cfg.msMin) || 2500, Math.min(18000, Math.round(pal * ((S.cfg && S.cfg.msPalabra) || 450))));
      const btnT = h("span", { text: ya ? (esRep ? "Repasado" : "Leído") : (esRep ? "Marcar repasado" : "Marcar leído") });
      const btn = h("button", { class: "jg-vl-lei" + (ya ? " hecho" : ""), type: "button", disabled: ya, "aria-pressed": String(ya) }, ico("marca"), btnT);
      let esperando = false;
      const completar = () => {
        esperando = false;
        const ms = Math.max(reqMs, Math.round(Date.now() - tVis));
        LB.ok.add(clave);
        if (esRep) {
          const l = repasos(); if (!l.includes(clave)) { l.push(clave); A.store.set("jg:rep", { f: diaRep(), k: l.slice(-600) }); }
          const o = A.store.get("jg:rp", null) || {}, s = o[lc] || ""; if (s[x.v - 1] !== "1") { o[lc] = pon(s, x.v - 1, "1"); A.store.set("jg:rp", o); }
        }
        if (A.marcarLeido) A.marcarLeido(x.c, x.cap, [x.v]);
        const cf = cfDe(lc); guardarCf(lc, pon(cf, x.v - 1, B36[Math.min(35, vecesCar(cf[x.v - 1]) + 1)]), true);
        const e = espejo(), h0 = e.m[lc] || "";
        e.m[lc] = pon(h0, x.v - 1, String(Math.min(9, (+(h0[x.v - 1] || 0)) + 1)));
        if (!e.c) e.c = {}; e.c[lc] = pon(e.c[lc] || "", x.v - 1, "1");
        A.store.set("jg:hoy", e);
        if (S.token) { R.cola.push([x.c, x.cap, x.v, ms, 3]); if (!R.ultEnvio) R.ultEnvio = Date.now(); guardarCola(false); enviar(false); }
        btn.classList.remove("esp"); btn.classList.add("hecho"); btn.disabled = true; btn.setAttribute("aria-pressed", "true");
        btnT.textContent = esRep ? "Repasado" : "Leído";
        vibrar([12, 30, 16]); sonar("chispa"); chispas(12, btn, ["polvo", "aro"]);
        A.avisar(esRep ? "Verso repasado: sumado a tu avance" : "Verso marcado como leído: sumado a tu avance");
      };
      btn.onclick = () => {
        if (btn.disabled || esperando) return;
        const falta = reqMs - (Date.now() - tVis);
        if (falta <= 0) return completar();
        esperando = true; btn.classList.add("esp");
        const paso = () => {
          if (!el.isConnected) { esperando = false; return; }
          const r = reqMs - (Date.now() - tVis);
          if (r <= 0) return completar();
          btnT.textContent = "Leyendo… " + Math.ceil(r / 1000) + " s";
          setTimeout(paso, Math.min(450, r));
        };
        if (falta > 1200) A.avisar("Léelo con calma unos segundos: se marcará como leído al cumplir su tiempo.");
        paso();
      };
      pie.replaceChildren(btn,
        h("a", { class: "jg-vl-ref", href: "#/" + x.c + "/" + x.cap + "/l/" + x.v, onclick: () => { if (document.documentElement.classList.contains("con-modal")) A.cerrarModal(); } }, nombreLibro(x.c) + " " + x.cap + ":" + x.v, A.svg(A.ICO.der)));
      el.classList.add("listo");
    });
    return el;
  }
  function tarjetaCosecha(y, rehacer) {
    const co = y.co; if (!co || !co.lleno) return null;
    const dur = Math.max(1, co.lleno - co.t), fr = () => Math.max(0, Math.min(1, (Date.now() - co.t) / dur));
    const cesta = h("div", { class: "co-cesta", "aria-hidden": "true" }), est = h("p", { class: "co-est" }), txt = h("p", { class: "co-txt" });
    const btn = h("button", { class: "btn oro", type: "button" }, h("span", { text: "Recoger" })), zona = h("div", { class: "co-c" });
    let fUlt = -1;
    const pintar = () => {
      const f = fr(), lleno = f >= 1;
      if (Math.abs(f - fUlt) >= 0.004 || lleno !== fUlt >= 1) { fUlt = f; cesta.replaceChildren(A.svg(cestaSVG(f), "0 0 200 160")); cesta.style.setProperty("--f", f.toFixed(3)); cesta.classList.toggle("llena", lleno); }
      const falta = co.lleno - Date.now();
      txt.replaceChildren(lleno ? "Tu cesta está llena: recógela. Mientras no la recojas, no se llena más." : "Se llena en " + horas(falta) + ". A las 18 h se detiene hasta que la recojas; puedes recogerla antes, cuantas veces quieras.");
      est.textContent = "Ahora daría entre " + fmt(Math.round(co.min1 * f)) + " y " + fmt(Math.round(co.max1 * f)) + " de experiencia · " + Math.round(f * 100) + " % llena";
    };
    btn.onclick = async () => {
      btn.disabled = true;
      const r = await pedir("/cosecha", { metodo: "POST", cuerpo: {} });
      if (r.error === "pronto") { btn.disabled = false; return A.avisar("Tu cesta aún está casi vacía: vuelve en " + (r.falta > 90 ? Math.ceil(r.falta / 60) + " min" : r.falta + " s")); }
      if (r.error) { btn.disabled = false; return A.avisar(mensaje(r)); }
      if (r.yo) actualizarYo(r.yo);
      revelar(r);
    };
    function revelar(r) {
      const med = h("div", { class: "co-medidor", role: "img", "aria-label": "Tocó el " + pctTxt(r.p) + " de lo sembrado" }), ag = h("div", { class: "co-aguja", "aria-hidden": "true" });
      med.append(A.svg(medidorSVG(), "0 0 240 140")); ag.append(A.svg(medidorAguja(), "0 0 240 140")); med.append(ag, h("i", { class: "co-destello", "aria-hidden": "true" }));
      const cifra = h("b", { text: "+0" }), res = h("p", { class: "co-res", "aria-live": "polite" }, cifra, h("small", { text: "de experiencia · " + pctTxt(r.p) + " de lo sembrado" + (r.f < 0.999 ? " · cesta al " + Math.round(r.f * 100) + " %" : "") }));
      res.style.opacity = "0";
      const vers = tarjetaVerso("Un verso para tu cosecha"); vers.classList.add("espera");
      zona.replaceChildren(med, res, h("p", { class: "co-est", text: (r.plena ? "¡Cosecha plena! " : "") + "Tu fruto del espíritu (" + plural(r.F || 0, "nivel", "niveles") + ") sube la probabilidad de lo alto." }),
        vers, h("div", { class: "jg-acciones" }, h("button", { class: "btn", type: "button", onclick: () => rehacer() }, h("span", { text: "Ver mi cesta" }))));
      sonar("cosecha");
      const T = -90 + (180 * Math.max(0, Math.min(1, (r.p - 0.002) / 0.003)));
      const fin = () => { ag.style.transform = "rotate(" + T.toFixed(1) + "deg)"; res.style.opacity = "1"; med.classList.add("brilla"); contarRapido(cifra, r.xp, 900, "+"); chispas(r.plena ? 30 : 16); if (r.plena) vibrar([20, 40, 20]); setTimeout(() => { vers.classList.remove("espera"); if (vers._visto) vers._visto(); }, 650); };
      if (sinAnim() || !ag.animate) return fin();
      ag.animate([{ transform: "rotate(-90deg)" }, { transform: "rotate(" + Math.min(84, T + 70).toFixed(1) + "deg)", offset: 0.55 }, { transform: "rotate(" + (T - 6).toFixed(1) + "deg)", offset: 0.8 }, { transform: "rotate(" + T.toFixed(1) + "deg)" }],
        { duration: 1900, easing: "cubic-bezier(.25,.8,.25,1)", fill: "forwards" }).finished.then(fin, fin);
    }
    pintar();
    const citaC = A.nombreLibro("JHN") + " 4:36-38";
    zona.append(cesta, txt, est, h("div", { class: "jg-acciones" }, btn),
      h("p", { class: "co-est" }, "Uno siembra y otro siega: la medida de tu cesta crece con lo que siembran todos los estudiantes · ", h("button", { class: "ap-cita", type: "button", title: "Ver lo que dice", "aria-label": "Ver " + citaC, onclick: () => verCita("JHN", 4, 36, 38) }, h("i", { class: "ap-lumbre", "aria-hidden": "true" }), citaC)));
    const sec = tarjeta("La cosecha", ico("arbol"), zona); sec.id = "jg-cosecha";
    enVivo(sec, 30e3, async () => { if (zona.contains(cesta)) pintar(); });
    return sec;
  }
  // V16 + AF33 (Neon, 22-nov-2026): medallón de alta relojería para el poder: gema facetada (sin cruz ni estrella),
  // filo de oro labrado, reflejo metálico por compositor y descargas eléctricas finas que nunca se repiten (pausadas fuera
  // de pantalla, en pestaña oculta y con «Sin animaciones»). Al tocarlo abre la Ventana del poder (AF33).
  function chipPoder(valor, alTocar) {
    const capa = h("span", { class: "ap-rayos", "aria-hidden": "true" }), aura = h("span", { class: "ap-pd-aura", "aria-hidden": "true" });
    const gema = h("span", { class: "ap-pd-gema", "aria-hidden": "true" }, h("span", { class: "ap-pd-gema-luz" }),
      A.svg('<path d="M12 2.4L19.2 12L12 21.6L4.8 12Z" fill="#183a6e" stroke="#efd493" stroke-width="1.2" stroke-linejoin="round"/>' +
        '<path d="M12 2.4L19.2 12L12 12Z" fill="#7fc2ff" opacity=".88"/><path d="M12 2.4L4.8 12L12 12Z" fill="#d9f0ff"/>' +
        '<path d="M12 12L19.2 12L12 21.6Z" fill="#2e67ad"/><path d="M12 12L4.8 12L12 21.6Z" fill="#4f93db" opacity=".85"/>' +
        '<path d="M12 6.8L15.4 12L12 17.2L8.6 12Z" fill="#ffffff" opacity=".48"/>', "0 0 24 24"));
    const corte = h("span", { class: "ap-pd-corte", "aria-hidden": "true" }, h("i", { class: "ap-pd-brillo" }));
    const inv = (S.yo && S.yo.inv) || "", vis = A && A.store ? A.store.get("jg:poderVis", null) : null;
    const delta = vis && vis.inv === inv && (valor | 0) > (vis.p | 0) ? (valor | 0) - (vis.p | 0) : 0;
    const chip = h("button", { class: "ap-poder", type: "button", title: "Abrir la ventana del poder", "aria-label": "Poder " + fmt(valor) + (delta > 0 ? " (+" + fmt(delta) + " nuevo)" : "") + ": abrir detalles y estadísticas", onclick: alTocar },
      aura, corte, gema, h("span", { class: "ap-pd-t", text: "Poder" }), h("b", { text: fmt(valor) }),
      delta > 0 ? h("span", { class: "ap-pd-delta", title: "Aumento de poder desde tu última visita", text: "+" + fmt(delta) }) : null,
      h("span", { class: "ap-pd-ir", "aria-hidden": "true", text: "›" }), capa);
    let t = 0, visible = true;
    const io = "IntersectionObserver" in window ? new IntersectionObserver((e) => { visible = e.some((x) => x.isIntersecting); }) : null; if (io) io.observe(chip);
    const al = (a, b) => a + Math.random() * (b - a);
    function rayo(W, H) {
      const lado = Math.floor(Math.random() * 4), m = 13;
      let x = lado < 2 ? al(m + 8, W + m - 8) : lado === 2 ? m : W + m, y = lado === 0 ? m : lado === 1 ? H + m : al(m + 5, H + m - 5);
      const dx = lado === 2 ? -1 : lado === 3 ? 1 : al(-0.55, 0.55), dy = lado === 0 ? -1 : lado === 1 ? 1 : al(-0.48, 0.48);
      let d = "M" + x.toFixed(1) + " " + y.toFixed(1), ram = "";
      const pasos = 3 + Math.floor(Math.random() * 3);
      for (let i = 0; i < pasos; i++) {
        x += dx * al(2.2, 4.6) + al(-2.5, 2.5); y += dy * al(2.2, 4.6) + al(-2.5, 2.5); d += "L" + x.toFixed(1) + " " + y.toFixed(1);
        if (!ram && i === 1 && Math.random() < 0.52) ram = "M" + x.toFixed(1) + " " + y.toFixed(1) + "l" + (dx * al(3, 6.2) + al(-3, 3)).toFixed(1) + " " + (dy * al(3, 6.2) + al(-3, 3)).toFixed(1);
      }
      return d + ram;
    }
    function descarga() {
      clearTimeout(t); if (!chip.isConnected) { if (io) io.disconnect(); return; }
      if (visible && !document.hidden && !sinAnim() && capa.animate) {
        const W = chip.offsetWidth, H = chip.offsetHeight, n = 1 + Math.floor(Math.random() * 3);
        let d = ""; for (let i = 0; i < n; i++) d += rayo(W, H);
        capa.replaceChildren(A.svg('<path d="' + d + '" fill="none" stroke="#bfe3ff" stroke-width="1" stroke-linejoin="round" stroke-linecap="round"/><path d="' + d + '" fill="none" stroke="#fff" stroke-width=".42" stroke-linejoin="round"/>', "0 0 " + (W + 26) + " " + (H + 26)));
        const dur = al(300, 680), pico = al(0.72, 1);
        capa.animate([{ opacity: 0 }, { opacity: 1, offset: 0.07 }, { opacity: 0.14, offset: 0.18 }, { opacity: pico, offset: 0.28 }, { opacity: 0 }], { duration: dur, easing: "linear" });
        aura.animate([{ opacity: 0 }, { opacity: 0.9, offset: 0.08 }, { opacity: 0.22, offset: 0.19 }, { opacity: pico * 0.78, offset: 0.3 }, { opacity: 0 }], { duration: dur * 1.25, easing: "linear" });
        gema.animate([{ opacity: 1 }, { opacity: 0.68, offset: 0.11 }, { opacity: 1, offset: 0.32 }, { opacity: 1 }], { duration: dur, easing: "linear" });
      }
      t = setTimeout(descarga, al(2800, 8200));
    }
    t = setTimeout(descarga, al(900, 2200));
    return chip;
  }
  // AF33 v3 · Ventana del poder (Neon, 23-nov-2026): cámara orbital de alta relojería optimizada para desplazamiento sedoso en
  // móvil sin cortes — 3 planos excéntricos de oro entrelazados en períodos coprimos (31,7 s · 53,1 s · 83,9 s), sin preserve-3d
  // anidado dentro de recorte circular, reposo en transform:none, relieve 3D+paralaje al interactuar con el dedo o puntero, pausa
  // automática cuando la esfera sale del campo visual al desplazarse, pilares resonantes, medallones vivos y citas in-situ
  // (2 Κοrίndsιοι 4:7 y Ἐfέsιοι 3:16). Cierra con ×, Esc y el gesto atrás.
  let VP_N = 0;
  function abrirVentanaPoder(y, P) {
    const yy = S.yo || y || {}, av = (P && P.av) || yy.av || {}, poder = av.poder | 0;
    const ET = [[1, "I", "Semilla", 0, 250, "#c9813f"], [2, "II", "Brote", 250, 600, "#c3ccd8"], [3, "III", "Raíz honda", 600, 1200, "#f0c04a"], [4, "IV", "Copa", 1200, 2400, "#ffe39a"], [5, "V", "Fruto", 2400, null, "#ff7d93"]];
    const cur = poder >= 2400 ? ET[4] : poder >= 1200 ? ET[3] : poder >= 600 ? ET[2] : poder >= 250 ? ET[1] : ET[0];
    const sig = ET[cur[0]] || null, inicio = cur[3], meta = cur[4];
    const fracEt = meta ? Math.max(0, Math.min(1, (poder - inicio) / (meta - inicio))) : 1;
    const sumAt = Object.values(av.ef || {}).reduce((a, x) => a + (x | 0), 0);
    const niv = yy.nivel | 0;
    const sumFr = Object.values(av.fr || {}).reduce((a, x) => a + ((x && x.n) | 0), 0);
    const nInv = Array.isArray(av.inv) ? av.inv.length : 0;
    const grArm = Object.values(av.eq || {}).reduce((a, x) => a + (x | 0), 0);
    const nEqAcc = Object.values(av.acc || {}).filter(Boolean).length;
    const cantos = (P && Array.isArray(P.piedras) ? P.piedras : yy.piedras || []).reduce((a, x) => a + (x | 0), 0);
    const dr = P && P.dr != null ? P.dr : yy.dr | 0;
    const pAt = sumAt * 10, pNv = niv * 15, pFr = sumFr * 6, pAc = nInv * 25;
    const totP = Math.max(1, pAt + pNv + pFr + pAc);
    const pct = (v) => ((100 * v) / totP).toFixed(1).replace(".", ",") + " %";
    const u = "vp" + (++VP_N) + "-", C1 = 2 * Math.PI * 119, C2 = 2 * Math.PI * 130;
    const PILARES = [
      { k: "at", n: "Atributos", v: pAt, col: "var(--vp-c1)", luz: "#f0c86a", g: [u + "g1", "#fff4cd", "#c79230"], fm: fmt(sumAt) + " pts × 10",
        det: "Tus seis raíces suman " + fmt(sumAt) + " puntos efectivos (" + plural(grArm * 2, "punto", "puntos") + " de los " + grArm + " grados de armadura forjada y " + fmt(Math.max(0, sumAt - grArm * 2)) + " repartidos). Cada punto nuevo añade +10 al poder." },
      { k: "nv", n: "Nivel", v: pNv, col: "var(--vp-c2)", luz: "#7cb8f2", g: [u + "g2", "#cde7ff", "#3c78ba"], fm: "Nivel " + fmt(niv) + " × 15",
        det: yy.enTope ? "En el nivel tope de este mes (" + yy.tope + "). La reserva (" + fmt(yy.reserva) + ") sube contigo al abrirse niveles nuevos."
          : "Nivel " + fmt(niv) + " (" + fmt(yy.xpNivel) + " de " + fmt(yy.xpSig) + " hacia el nivel " + fmt(niv + 1) + "). Cada nivel suma +15 de poder y " + ((P && P.def && P.def.ptsNivel) || 3) + " puntos libres." },
      { k: "fr", n: "Fruto", v: pFr, col: "var(--vp-c3)", luz: "#f05c78", g: [u + "g3", "#ffa4b4", "#b81d3b"], fm: fmt(sumFr) + " niv. × 6",
        det: "Las nueve cámaras del fruto del espíritu suman " + plural(sumFr, "nivel", "niveles") + " (Gαlάται 5:22-23). Crece leyendo con constancia, acompañando y sembrando; lo ganado nunca se pierde." },
      { k: "ac", n: "Accesorios", v: pAc, col: "var(--vp-c4)", luz: "#55ccb9", g: [u + "g4", "#b0f5e8", "#2b877d"], fm: fmt(nInv) + " × 25",
        det: plural(nInv, "accesorio", "accesorios") + " en tu vitrina (" + plural(nEqAcc, "equipado", "equipados") + " en el ser interior). Cada accesorio obtenido suma +25 de poder." },
    ];
    // 3 planos orbitales consolidados en SVG estáticos (filamentos excéntricos de oro + elipses + 60 marcas vernier; cero animaciones dentro del SVG)
    const arco = (cx, cy, r, a1, a2) => {
      const p1 = [(cx + r * Math.cos(a1)).toFixed(1), (cy + r * Math.sin(a1)).toFixed(1)];
      const p2 = [(cx + r * Math.cos(a2)).toFixed(1), (cy + r * Math.sin(a2)).toFixed(1)];
      const lg = Math.abs(a2 - a1) > Math.PI ? 1 : 0;
      return "M" + p1[0] + " " + p1[1] + "A" + r + " " + r + " 0 " + lg + " 1 " + p2[0] + " " + p2[1];
    };
    const oroG = (id, x1, y1, x2, y2, op) => '<linearGradient id="' + u + id + '" x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '">' +
      '<stop offset="0" stop-color="#a87620" stop-opacity="0"/><stop offset=".24" stop-color="#d49e3a" stop-opacity="' + (op * 0.72).toFixed(2) + '"/>' +
      '<stop offset=".52" stop-color="#fff4ce" stop-opacity="' + op + '"/><stop offset=".78" stop-color="#c9902e" stop-opacity="' + (op * 0.65).toFixed(2) + '"/>' +
      '<stop offset="1" stop-color="#7a5111" stop-opacity="0"/></linearGradient>';
    const hilo = (d, gid, w, glow) => (glow ? '<path d="' + d + '" fill="none" stroke="url(#' + u + gid + ')" stroke-width="' + (w * 3.2).toFixed(1) + '" stroke-linecap="round" opacity=".18"/>' : "") +
      '<path d="' + d + '" fill="none" stroke="url(#' + u + gid + ')" stroke-width="' + w + '" stroke-linecap="round"/>';
    const orb1 = A.svg("<defs>" + oroG("oa1", 0, 0, 1, 1, 0.94) + oroG("oa2", 1, 0, 0, 1, 0.76) + oroG("oa3", 0, 0.2, 1, 0.8, 0.82) + "</defs>" +
      '<g transform="rotate(-24 150 150)"><ellipse cx="150" cy="150" rx="126" ry="78" fill="none" stroke="url(#' + u + 'oa3)" stroke-width="3.6" opacity=".15"/>' +
      '<ellipse cx="150" cy="150" rx="126" ry="78" fill="none" stroke="url(#' + u + 'oa3)" stroke-width="1.15"/></g>' +
      hilo(arco(114, 122, 108, -0.75, 2.35), "oa1", 1.35, 1) +
      hilo(arco(196, 178, 94, 1.35, 4.45), "oa2", 1.05, 1), "0 0 300 300");
    const orb2 = A.svg("<defs>" + oroG("ob1", 1, 0, 0, 1, 0.92) + oroG("ob2", 0, 1, 1, 0, 0.74) + oroG("ob3", 0.2, 1, 0.8, 0, 0.8) + "</defs>" +
      '<g transform="rotate(34 150 150)"><ellipse cx="150" cy="150" rx="116" ry="70" fill="none" stroke="url(#' + u + 'ob3)" stroke-width="3.4" opacity=".15"/>' +
      '<ellipse cx="150" cy="150" rx="116" ry="70" fill="none" stroke="url(#' + u + 'ob3)" stroke-width="1.1"/></g>' +
      hilo(arco(186, 112, 112, 0.55, 3.65), "ob1", 1.35, 1) +
      hilo(arco(118, 196, 86, -2.3, 0.78), "ob2", 1.05, 1), "0 0 300 300");
    let marcas = "";
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * Math.PI * 2, m = i % 5 === 0;
      marcas += '<line x1="' + (150 + (m ? 133 : 136) * Math.cos(a)).toFixed(1) + '" y1="' + (150 + (m ? 133 : 136) * Math.sin(a)).toFixed(1) + '" x2="' + (150 + 140 * Math.cos(a)).toFixed(1) + '" y2="' + (150 + 140 * Math.sin(a)).toFixed(1) + '" stroke="' + (m ? "#f5d78e" : "#a88339") + '" stroke-opacity="' + (m ? ".52" : ".22") + '" stroke-width="' + (m ? "1.1" : ".6") + '" stroke-linecap="round"/>';
    }
    const orb3 = A.svg("<defs>" + oroG("oc1", 1, 1, 0, 0, 0.68) + oroG("oc2", 0, 0, 1, 1, 0.64) + "</defs>" +
      marcas + '<circle cx="150" cy="150" r="141" fill="none" stroke="#e5bd66" stroke-opacity=".14" stroke-width=".7"/>' +
      hilo(arco(156, 166, 70, -0.9, 2.15), "oc1", 0.95, 0) +
      hilo(arco(132, 110, 88, 2.35, 5.4), "oc2", 0.9, 0), "0 0 300 300");
    const gira = (svg, vt, inv) => h("span", { class: "ap-vp-gira" + (inv ? " inv" : ""), "aria-hidden": "true", style: "--vt:" + vt }, svg);
    // 3 destellos ópticos circulares (sin cruces ni estrellas) en períodos coprimos donde cruzan las órbitas
    const destellos = [
      ["17.3s", 0, "50%", "7%", "18px"],
      ["29.1s", 1, "86%", "34%", "14px"],
      ["43.7s", 0, "24%", "82%", "16px"],
    ].map(([dt, inv, dx, dy, ds]) => h("span", { class: "ap-vp-dest" + (inv ? " inv" : ""), "aria-hidden": "true", style: "--dt:" + dt },
      h("i", { style: "--dx:" + dx + ";--dy:" + dy + ";--ds:" + ds })));
    // Anillo perimetral de etapa + gema diamante de avance
    const angTip = -Math.PI / 2 + fracEt * Math.PI * 2, tx = 150 + 130 * Math.cos(angTip), ty = 150 + 130 * Math.sin(angTip);
    const anillo = h("span", { class: "ap-vp-anillo", "aria-hidden": "true" }, A.svg(
      '<circle cx="150" cy="150" r="130" fill="none" stroke="rgba(255,244,210,.09)" stroke-width="1.6"/>' +
      '<circle cx="150" cy="150" r="130" fill="none" stroke="' + cur[5] + '" stroke-width="2.4" stroke-linecap="round" stroke-dasharray="' + C2.toFixed(1) + '" stroke-dashoffset="' + (C2 * (1 - fracEt)).toFixed(1) + '" transform="rotate(-90 150 150)"/>' +
      '<g transform="translate(' + tx.toFixed(1) + " " + ty.toFixed(1) + ') rotate(45)"><rect x="-3.8" y="-3.8" width="7.6" height="7.6" rx="1.4" fill="#fffaf0" stroke="' + cur[5] + '" stroke-width="1.3"/></g>', "0 0 300 300"));
    // 4 arcos independientes de pilares (capa HTML por pilar: resaltar uno al tocarlo cuesta cero repintado SVG)
    const parcs = h("span", { class: "ap-vp-parcs", "aria-hidden": "true" });
    const mapaArc = new Map();
    let acum = 0;
    for (const p of PILARES) {
      const len = (p.v / totP) * C1, gap = len > 7 ? 4.5 : 0;
      const svgP = A.svg('<defs><linearGradient id="' + p.g[0] + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + p.g[1] + '"/><stop offset="1" stop-color="' + p.g[2] + '"/></linearGradient></defs>' +
        (len > 0.5 ? '<g transform="rotate(-90 150 150)"><circle cx="150" cy="150" r="119" fill="none" stroke="url(#' + p.g[0] + ')" stroke-width="4.2" stroke-linecap="round" stroke-dasharray="' + Math.max(0, len - gap).toFixed(1) + " " + C1.toFixed(1) + '" stroke-dashoffset="' + (-acum).toFixed(1) + '"/></g>' : ""), "0 0 300 300");
      const wrap = h("span", { class: "ap-vp-parc" }, svgP);
      mapaArc.set(p.k, wrap); parcs.append(wrap); acum += len;
    }
    const capaRay = h("span", { class: "ap-vp-rayos", "aria-hidden": "true" });
    const valPoder = h("b", { class: "ap-vp-val", text: fmt(poder) });
    const camara = h("div", { class: "ap-vp-cam" }, h("span", { class: "ap-vp-luz", "aria-hidden": "true" }),
      gira(orb1, "31.7s", 0), gira(orb2, "53.1s", 1), gira(orb3, "83.9s", 0), ...destellos);
    const escena = h("div", { class: "ap-vp-escena" }, camara, anillo, parcs, capaRay, h("span", { class: "ap-vp-velo", "aria-hidden": "true" }),
      h("div", { class: "ap-vp-centro" },
        h("span", { class: "ap-vp-rot", text: "Poder" }),
        valPoder,
        h("span", { class: "ap-vp-et", text: "Etapa " + cur[1] + " · " + cur[2] }),
        h("span", { class: "ap-vp-falta", text: sig ? "Faltan " + fmt(Math.max(0, meta - poder)) + " para " + sig[2] : "+" + fmt(Math.max(0, poder - 2400)) + " sobre 2.400" })));
    const reloj = h("div", { class: "ap-vp-reloj", role: "img", "aria-label": "Poder " + fmt(poder) + ", Etapa " + cur[1] + " " + cur[2] + ": Atributos " + fmt(pAt) + ", Nivel " + fmt(pNv) + ", Fruto " + fmt(pFr) + ", Accesorios " + fmt(pAc) }, escena);
    const pista = h("p", { class: "ap-vp-pista", text: "Desliza la esfera para explorar su relieve" });
    const marco = h("div", { class: "ap-vp-marco" }, reloj, pista);
    // Banda de etapas (del nivel inicial 0 hasta la siguiente etapa)
    const barraEt = h("i");
    const banda = h("div", { class: "ap-vp-banda" },
      h("div", { class: "ap-vp-bcab" },
        h("span", {}, "Desde ", h("b", { text: fmt(inicio) }), " (inicial ", h("b", { text: "0" }), ")"),
        h("span", {}, sig ? h("b", { text: Math.round(fracEt * 100) + " %" }) : h("b", { text: "Etapa máxima" }), sig ? " hacia " + sig[2] + " (" + fmt(meta) + ")" : "")),
      h("div", { class: "ap-vp-tramo", role: "progressbar", "aria-valuemin": String(inicio), "aria-valuemax": String(meta || poder || 2400), "aria-valuenow": String(poder), "aria-label": "Avance de poder hacia la siguiente etapa", style: "--p:" + (fracEt * 100).toFixed(1) }, barraEt),
      h("ol", { class: "ap-vp-etapas", "aria-label": "Etapas del poder" }, ET.map(([n, rom, nom, ini, , col]) =>
        h("li", { class: n < cur[0] ? "ok" : n === cur[0] ? "act" : "", style: "--ec:" + col }, h("em", { text: rom }), h("i", { "aria-hidden": "true" }), h("b", { text: nom }), h("small", { text: fmt(ini) })))));
    // Neon (23-nov-2026): consciencia de progresión — comparativa Antes → Hoy → Nivel N+1, puntajes previos, rutas de costo/ganancia y vista de próxima etapa
    const histP = registrarPoder(yy, av);
    A.store.set("jg:poderVis", { inv: yy.inv || "", p: poder });
    for (const dEl of document.querySelectorAll("#vista .ap-pd-delta")) dEl.remove();
    const ptsNivel = (P && P.def && P.def.ptsNivel) || 3;
    const saltoTotal = 15 + ptsNivel * 10;
    const faltaXp = yy.enTope ? 0 : Math.max(0, (yy.xpSig | 0) - (yy.xpNivel | 0));
    const versosEst = faltaXp > 0 ? Math.max(1, Math.ceil(faltaXp / 10)) : 0;
    let prevP = null;
    for (let k = histP.length - 2; k >= 0; k--) { if (histP[k].p !== poder) { prevP = histP[k]; break; } }
    if (!prevP && histP.length > 1) prevP = histP[histP.length - 2];
    const fmtDiaP = (ts) => { try { return new Intl.DateTimeFormat("es", { day: "numeric", month: "short" }).format(new Date(ts)); } catch (e) { return ""; } };
    const deltaPrev = prevP ? poder - prevP.p : poder;
    const colAntes = prevP
      ? h("div", { class: "ap-vp-3c" },
          h("small", { text: "Previo" }),
          h("b", { text: fmt(prevP.p) }),
          h("em", { text: (deltaPrev >= 0 ? "+" : "") + fmt(deltaPrev) + " desde entonces" }),
          h("span", { text: "Nv. " + fmt(prevP.nv) + (prevP.t ? " · " + fmtDiaP(prevP.t) : "") }))
      : h("div", { class: "ap-vp-3c" },
          h("small", { text: "Inicio" }),
          h("b", { text: "0" }),
          h("em", { text: poder > 0 ? "+" + fmt(poder) + " ganados" : "Punto de partida" }),
          h("span", { text: "Base al comenzar" }));
    const colHoy = h("div", { class: "ap-vp-3c hoy" },
      h("small", { text: "Hoy" }),
      h("b", { text: fmt(poder) }),
      h("em", { text: "Nivel " + fmt(niv) }),
      h("span", { text: "Etapa " + cur[1] + " · " + cur[2] }));
    const colSig = h("div", { class: "ap-vp-3c sig" },
      h("small", { text: "Al nivel " + fmt(niv + 1) }),
      h("b", { text: fmt(poder + saltoTotal) }),
      h("em", { text: "+15 directo · +" + (ptsNivel * 10) + " con " + ptsNivel + " pts" }),
      h("span", { text: yy.enTope ? "Al abrirse el mes · reserva " + fmt(yy.reserva) : (faltaXp ? "Faltan " + fmt(faltaXp) + " XP (~" + plural(versosEst, "verso", "versos") + ")" : "¡Listo para subir!") }));
    const prevLista = histP.slice(0, -1).slice(-4);
    const histBl = prevLista.length
      ? h("div", { class: "ap-vp-hist", "aria-label": "Puntajes de poder previos" }, prevLista.map((x) =>
          h("span", { class: "ap-vp-hchip" }, "Nv. " + fmt(x.nv) + " · ", h("b", { text: fmt(x.p) }), x.t ? " · " + fmtDiaP(x.t) : "")))
      : h("p", { class: "jg-mini", style: "margin:0;text-align:center", text: "Tus puntajes previos de poder se guardarán aquí automáticamente al subir para que compares tu avance." });
    // Rutas reales de costo vs ganancia de poder
    const rutas = [];
    if ((av.pts | 0) > 0) {
      rutas.push({ ord: 1.2, cerca: true, tit: "Repartir " + plural(av.pts | 0, "punto libre", "puntos libres"),
        sub: "Sin costo · ya disponibles en Atributos de tu Árbol", gan: "+" + fmt((av.pts | 0) * 10) });
    }
    if (!yy.enTope) {
      const rNv = yy.xpSig ? Math.min(1, (yy.xpNivel | 0) / Math.max(1, yy.xpSig | 0)) : 0;
      rutas.push({ ord: rNv, cerca: rNv >= 0.72, tit: "Subir al nivel " + fmt(niv + 1),
        sub: (faltaXp ? "Faltan " + fmt(faltaXp) + " XP (~" + plural(versosEst, "verso", "versos") + ")" : "¡Listo para subir!") + " · +15 al subir y +" + (ptsNivel * 10) + " al repartir " + ptsNivel + " pts", gan: "+" + saltoTotal });
    }
    if (P && P.def && P.def.forja && Array.isArray(P.def.piezas)) {
      let mej = null;
      for (const [pid, pnom] of P.def.piezas) {
        const gr = (av.eq && av.eq[pid]) | 0, s = P.def.forja[gr + 1];
        if (!s) continue;
        const ok = dr >= s.dr && cantos >= s.cantos;
        const ratio = Math.min(1, dr / Math.max(1, s.dr)) * (s.cantos ? Math.min(1, cantos / s.cantos) : 1);
        if (!mej || (ok && !mej.ok) || (ok === mej.ok && (s.dr < mej.s.dr || (s.dr === mej.s.dr && s.cantos < mej.s.cantos)))) {
          mej = { pnom, gr, s, ok, ratio, grado: (P.def.grados && P.def.grados[gr + 1]) || ("grado " + (gr + 1)) };
        }
      }
      if (mej) {
        const falDr = Math.max(0, mej.s.dr - dr), falCa = Math.max(0, mej.s.cantos - cantos);
        const detF = mej.ok ? "¡Ya puedes forjarla en Tu ser interior!"
          : "Cuesta " + fmt(mej.s.dr) + " dr." + (mej.s.cantos ? " + " + plural(mej.s.cantos, "canto", "cantos") : "") + " · faltan " + [falDr ? fmt(falDr) + " dr." : "", falCa ? plural(falCa, "canto", "cantos") : ""].filter(Boolean).join(" y ");
        rutas.push({ ord: mej.ok ? 1.05 : mej.ratio, cerca: mej.ok || mej.ratio >= 0.72, tit: "Forjar " + mej.pnom + " (" + mej.grado + ")", sub: detF, gan: "+20" });
      }
    }
    if (av.precioPunto > 0) {
      const pr = av.precioPunto | 0, okP = dr >= pr, rP = Math.min(1, dr / Math.max(1, pr));
      rutas.push({ ord: okP ? 1.0 : rP, cerca: okP || rP >= 0.75, tit: "Comprar 1 punto de atributo",
        sub: okP ? "Cuesta " + fmt(pr) + " dracmas · ya tienes suficientes en Atributos" : "Cuesta " + fmt(pr) + " dracmas · te faltan " + fmt(pr - dr) + " dr.", gan: "+10" });
    }
    const fg = yy.frag || null, raros = (S.cfg && S.cfg.raros) || RAROS_C, invA = Array.isArray(av.inv) ? av.inv : [];
    const sigRaro = raros.find((x) => !invA.includes(x[0])) || null;
    if (fg && sigRaro) {
      const mF = fg.meta || 70, cF = Math.min(mF, fg.c || 0), rF = cF / Math.max(1, mF);
      rutas.push({ ord: rF, cerca: rF >= 0.72, tit: "Rollo de papiro · «" + sigRaro[2] + "»",
        sub: fmt(cF) + " de " + mF + " fragmentos · faltan " + fmt(Math.max(0, mF - cF)) + " marcando «Leído»", gan: "+25" });
    }
    rutas.sort((a, b) => b.ord - a.ord);
    if (rutas.length && !rutas.some((r) => r.cerca)) rutas[0].cerca = true;
    const ET_DESC = { 2: "marco plateado y aura viva tras tu emblema", 3: "filigrana de oro bruñido en tu tarjeta", 4: "oro radiante y motas de luz ascendentes", 5: "destellos rubí y corona plena del poder" };
    const etProx = sig
      ? h("p", { class: "ap-vp-etprox" }, "Próxima etapa · ", h("b", { text: sig[2] + " (" + fmt(meta) + ")" }), ": faltan ", h("b", { text: fmt(Math.max(0, meta - poder)) }), " de poder → desbloquea " + ET_DESC[sig[0]] + ".")
      : h("p", { class: "ap-vp-etprox" }, h("b", { text: "Etapa máxima alcanzada (Fruto)" }), ": llevas todos los distintivos visuales activos y cada punto sigue elevando tu poder.");
    const evoBox = h("div", { class: "ap-vp-evo" },
      h("div", { class: "ap-vp-3t" }, colAntes, colHoy, colSig),
      histBl,
      rutas.length ? h("ul", { class: "ap-vp-rutas", "aria-label": "Rutas más cercanas para subir poder" }, rutas.slice(0, 4).map((rt) =>
        h("li", { class: "ap-vp-ruta" + (rt.cerca ? " cerca" : "") },
          h("div", {}, h("b", { text: rt.tit }), h("small", { text: rt.sub })),
          h("span", { class: "ap-vp-rgan", text: rt.gan })))) : null,
      etProx);
    // Pilares interactivos resonantes con la esfera (2 × 2 simétrico)
    const foco = h("p", { class: "ap-vp-foco", "aria-live": "polite" });
    const ulPil = h("ul", { class: "ap-vp-pilares" });
    const pilBars = [], pilNums = [];
    let cuerpo = null;
    const verP = (p, bt, usuario) => {
      for (const b of ulPil.querySelectorAll(".ap-vp-pbtn")) b.classList.toggle("sel", b === bt);
      for (const [k, el] of mapaArc) { el.classList.toggle("act", k === p.k); el.classList.toggle("ten", k !== p.k); }
      if (cuerpo) cuerpo.style.setProperty("--vp-luz", p.luz);
      foco.replaceChildren(h("b", { text: p.n + " (+" + fmt(p.v) + " · " + pct(p.v) + "): " }), p.det);
      if (usuario) vibrar(6);
    };
    PILARES.forEach((p, idx) => {
      const pctP = Math.max(2, (100 * p.v) / totP), barI = h("i", { style: "--w:" + pctP.toFixed(1) }), numB = h("b", { text: "+" + fmt(p.v) });
      pilBars.push([barI, pctP]); pilNums.push([numB, p.v]);
      const bt = h("button", { class: "ap-vp-pbtn" + (idx === 0 ? " sel" : ""), type: "button", style: "--pc:" + p.col, onclick: () => verP(p, bt, 1) },
        h("span", { class: "ap-vp-ptop" }, h("span", { class: "ap-vp-pnom" }, h("i", { "aria-hidden": "true" }), p.n), h("span", { class: "ap-vp-ppct", text: pct(p.v) })),
        h("span", { class: "ap-vp-pnum" }, numB, h("small", { text: p.fm })),
        h("span", { class: "ap-vp-pbar", "aria-hidden": "true" }, barI));
      ulPil.append(h("li", {}, bt));
      if (idx === 0) verP(p, bt, 0);
    });
    // Estadísticas vivas del ser interior (medallones interactivos con destello al seleccionar y nota al tocar)
    const STATS = [
      { k: "nv", sc: "var(--vp-c2)", val: "Nivel " + fmt(niv), cnt: null, nom: yy.rangoNombre || "Lector", sub: yy.enTope ? "tope del mes" : fmt(yy.xpNivel) + " / " + fmt(yy.xpSig),
        nota: yy.enTope ? "Has alcanzado el tope mensual (" + yy.tope + "). Tu experiencia sigue acumulándose en reserva (" + fmt(yy.reserva) + ")." : "Te faltan " + fmt(Math.max(0, (yy.xpSig | 0) - (yy.xpNivel | 0))) + " XP para ascender al nivel " + fmt(niv + 1) + " (+15 poder)." },
      { k: "ar", sc: "var(--vp-c1)", val: grArm + " / 30", cnt: null, nom: "Armadura", sub: "+" + fmt(grArm * 2) + " a atributos",
        nota: grArm >= 30 ? "Armadura forjada al grado máximo (30/30): aporta +60 puntos efectivos (+600 de poder)." : "Faltan " + fmt(30 - grArm) + " grados de forja por completar; cada grado suma +2 a su atributo (+20 de poder)." },
      { k: "fr", sc: "var(--vp-c3)", val: fmt(sumFr), cnt: sumFr, nom: "Fruto", sub: "en 9 cámaras",
        nota: "Las nueve cámaras del fruto del espíritu (Gαlάται 5:22-23) suman " + fmt(sumFr) + " niveles y aportan +" + fmt(pFr) + " al poder total." },
      { k: "ac", sc: "var(--vp-c4)", val: fmt(nInv), cnt: nInv, nom: "Accesorios", sub: plural(nEqAcc, "equipado", "equipados"),
        nota: "Cada aura, manto, lauro o sello que guardas en tu tesoro suma +25 de poder aunque no lo lleves equipado en este momento." },
      { k: "vc", sc: "var(--vp-c5)", val: fmt(yy.vc || 0), cnt: yy.vc || 0, nom: "Versos leídos", sub: yy.lk && yy.lk.k ? plural(yy.lk.k, "lectura plena", "lecturas plenas") : fmt(yy.xp || 0) + " XP total",
        nota: "Solo cuentan los versos confirmados en BiEx («Leído», capítulo marcado o prueba respondida): lectura real, sin atajos." },
      { k: "cn", sc: "var(--vp-c6)", val: fmt(cantos), cnt: cantos, nom: "Cantos", sub: fmt(dr) + " dr.",
        nota: "Tienes " + plural(cantos, "canto", "cantos") + " para forjar grados altos de la armadura y " + fmt(dr) + " dracmas ganadas leyendo." },
    ];
    const stNota = h("p", { class: "ap-vp-stnota", "aria-live": "polite" });
    const ulStats = h("ul", { class: "ap-vp-stats" });
    const stNums = [];
    const verSt = (st, bt, usuario) => {
      for (const b of ulStats.querySelectorAll(".ap-vp-stbtn")) b.classList.toggle("sel", b === bt);
      stNota.replaceChildren(h("b", { text: st.nom + ": " }), st.nota);
      if (usuario) vibrar(5);
    };
    STATS.forEach((st, idx) => {
      const bNum = h("b", { text: st.val });
      if (st.cnt != null && st.cnt > 0) stNums.push([bNum, st.cnt]);
      const bt = h("button", { class: "ap-vp-stbtn" + (idx === 0 ? " sel" : ""), type: "button", style: "--sc:" + st.sc, onclick: () => verSt(st, bt, 1) },
        h("span", { class: "ap-vp-sttop" }, h("i", { "aria-hidden": "true" }), bNum),
        h("span", { text: st.nom }),
        h("small", { text: st.sub }));
      ulStats.append(h("li", {}, bt));
      if (idx === 0) verSt(st, bt, 0);
    });
    // Citas desplegables in-situ en formato de Lectura BiEx (2 Κοrίndsιοι 4:7 y Ἐfέsιοι 3:16)
    const panelV = h("div", { class: "ap-versos", hidden: true });
    let citaAct = "";
    const mkCita = (cod, cap, v) => {
      const ref = A.nombreLibro(cod) + " " + cap + ":" + v, idC = cod + cap + ":" + v;
      const bt = h("button", { class: "ap-cita", type: "button", "aria-expanded": "false", title: "Ver lo que dice", onclick: async () => {
        const mismo = citaAct === idC && !panelV.hidden;
        for (const x of pie.querySelectorAll(".ap-cita")) x.setAttribute("aria-expanded", "false");
        if (mismo) { panelV.hidden = true; citaAct = ""; return; }
        citaAct = idC; panelV.hidden = false; bt.setAttribute("aria-expanded", "true");
        panelV.replaceChildren(h("p", { class: "jg-mini", text: "Cargando…" }));
        try {
          const l = await A.versos(cod, cap, v, v);
          panelV.replaceChildren(...l.map(([vv, nodo]) => h("p", {}, nodo)),
            h("a", { class: "jg-vl-ref", href: "#/" + cod + "/" + cap + "/l/" + v, onclick: () => A.cerrarModal() }, "Leer en el capítulo", A.svg(A.ICO.der)));
        } catch (e) { panelV.replaceChildren(h("p", { class: "jg-mini", text: "No se pudo cargar el verso." })); }
      } }, h("i", { class: "ap-lumbre", "aria-hidden": "true" }), ref, h("span", { class: "ap-cita-fl", "aria-hidden": "true", text: "▾" }));
      return bt;
    };
    const pie = h("div", { class: "ap-vp-pie" }, "Potencia de ʾĔlōhî́m en el ser interior · ", mkCita("2CO", 4, 7), mkCita("EPH", 3, 16));
    cuerpo = h("div", { class: "flot-cel ap-vp", style: "--vp-et:" + cur[5] + ";--vp-luz:" + PILARES[0].luz },
      marco, banda,
      h("p", { class: "ap-vp-sec", text: "Evolución y próximo salto" }), evoBox,
      h("p", { class: "ap-vp-sec", text: "Composición del poder" }), ulPil, foco,
      h("p", { class: "ap-vp-sec", text: "Estadísticas del ser interior" }), ulStats, stNota,
      pie, panelV);
    // Inclinación 3D + paralaje 2.5D solo al interactuar con dedo o puntero: al soltar vuelve a reposo (transform:none, 0 % CPU)
    // sin eventos continuos de giroscopio que interfieran con el desplazamiento vertical en móvil.
    let rx = 0, ry = 0, trx = 0, tryy = 0, raf = 0, arrastra = false;
    const limpiar3D = () => {
      escena.classList.remove("inclinada");
      escena.style.removeProperty("--rx"); escena.style.removeProperty("--ry");
      escena.style.removeProperty("--px"); escena.style.removeProperty("--py");
    };
    const animar3D = () => {
      raf = 0; if (!cuerpo.isConnected) return;
      rx += (trx - rx) * 0.18; ry += (tryy - ry) * 0.18;
      if (!arrastra && Math.abs(trx) < 0.01 && Math.abs(tryy) < 0.01 && Math.abs(rx) < 0.06 && Math.abs(ry) < 0.06) {
        rx = 0; ry = 0; limpiar3D(); return;
      }
      escena.classList.add("inclinada");
      escena.style.setProperty("--rx", rx.toFixed(2) + "deg");
      escena.style.setProperty("--ry", ry.toFixed(2) + "deg");
      escena.style.setProperty("--px", (ry * 0.36).toFixed(2) + "px");
      escena.style.setProperty("--py", (-rx * 0.36).toFixed(2) + "px");
      if (Math.abs(trx - rx) > 0.04 || Math.abs(tryy - ry) > 0.04) raf = requestAnimationFrame(animar3D);
    };
    const mover3D = (nx, ny) => {
      if (sinAnim()) return;
      trx = Math.max(-14, Math.min(14, -ny * 14));
      tryy = Math.max(-14, Math.min(14, nx * 14));
      if (!raf) raf = requestAnimationFrame(animar3D);
    };
    const desdeEvento = (e) => {
      const r = reloj.getBoundingClientRect(); if (!r.width || !r.height) return;
      mover3D(((e.clientX - r.left) / r.width - 0.5) * 2, ((e.clientY - r.top) / r.height - 0.5) * 2);
    };
    const onDown = (e) => { if (sinAnim()) return; arrastra = true; pista.classList.add("visto"); desdeEvento(e); };
    const onMove = (e) => { if (sinAnim()) return; if (arrastra || e.pointerType === "mouse") { if (arrastra) pista.classList.add("visto"); desdeEvento(e); } };
    const onUp = () => { arrastra = false; mover3D(0, 0); };
    const onVis = () => { cuerpo.classList.toggle("pausa", document.hidden); };
    reloj.addEventListener("pointerdown", onDown);
    reloj.addEventListener("pointermove", onMove);
    reloj.addEventListener("pointerup", onUp);
    reloj.addEventListener("pointercancel", onUp);
    reloj.addEventListener("pointerleave", onUp);
    document.addEventListener("visibilitychange", onVis);
    // Filamentos dorados sutiles en la capa HTML (solo opacidad; en pausa cuando la esfera queda fuera de pantalla al desplazarse)
    let tRay = 0, ioEsf = null;
    const al = (a, b) => a + Math.random() * (b - a);
    const chispa = () => {
      clearTimeout(tRay); if (!cuerpo.isConnected) return;
      if (!document.hidden && !sinAnim() && !cuerpo.classList.contains("fuera") && capaRay.animate) {
        let d = ""; const n = 1 + Math.floor(Math.random() * 2);
        for (let i = 0; i < n; i++) {
          const ang = al(0, Math.PI * 2); let x = 150 + 114 * Math.cos(ang), y0 = 150 + 114 * Math.sin(ang);
          const dx = Math.cos(ang + al(-0.5, 0.5)), dy = Math.sin(ang + al(-0.5, 0.5)); d += "M" + x.toFixed(1) + " " + y0.toFixed(1);
          for (let k = 0; k < 4; k++) { x += dx * al(4, 7.5) + al(-3.6, 3.6); y0 += dy * al(4, 7.5) + al(-3.6, 3.6); d += "L" + x.toFixed(1) + " " + y0.toFixed(1); }
        }
        capaRay.replaceChildren(A.svg('<path d="' + d + '" fill="none" stroke="#f5d584" stroke-width="1.05" stroke-linejoin="round" stroke-linecap="round"/><path d="' + d + '" fill="none" stroke="#fffef6" stroke-width=".42" stroke-linejoin="round"/>', "0 0 300 300"));
        const dur = al(340, 720);
        capaRay.animate([{ opacity: 0 }, { opacity: 0.88, offset: 0.08 }, { opacity: 0.14, offset: 0.2 }, { opacity: 0.72, offset: 0.34 }, { opacity: 0 }], { duration: dur, easing: "linear" });
      }
      tRay = setTimeout(chispa, al(3900, 8600));
    };
    const vista = () => A.cajaModal(A.cabModal("Poder", "En el ser interior"), cuerpo);
    vista.alMostrar = () => {
      const raizScroll = reloj.closest(".m-cuerpo");
      if ("IntersectionObserver" in window && raizScroll) {
        ioEsf = new IntersectionObserver((es) => {
          const vis = es.some((x) => x.isIntersecting);
          cuerpo.classList.toggle("fuera", !vis);
        }, { root: raizScroll, threshold: 0.02 });
        ioEsf.observe(reloj);
      }
      if (!sinAnim()) {
        if (poder > 0) contarRapido(valPoder, poder, 950);
        if (barraEt.animate) barraEt.animate([{ transform: "translate3d(-100%,0,0)" }, { transform: "translate3d(" + (fracEt * 100 - 100).toFixed(1) + "%,0,0)" }], { duration: 920, easing: "cubic-bezier(.2,.8,.2,1)" });
        pilBars.forEach(([el, w], i) => { if (el.animate) el.animate([{ transform: "translate3d(-100%,0,0)" }, { transform: "translate3d(" + (w - 100).toFixed(1) + "%,0,0)" }], { duration: 760 + i * 95, easing: "cubic-bezier(.2,.8,.2,1)" }); });
        pilNums.forEach(([el, v], i) => { if (v > 0) setTimeout(() => contarRapido(el, v, 680, "+"), 80 + i * 70); });
        stNums.forEach(([el, v], i) => setTimeout(() => contarRapido(el, v, 720), 160 + i * 65));
        tRay = setTimeout(chispa, 900);
      }
    };
    A.abrirModal(vista, () => {
      clearTimeout(tRay); tRay = 0; if (raf) { cancelAnimationFrame(raf); raf = 0; }
      if (ioEsf) { ioEsf.disconnect(); ioEsf = null; }
      document.removeEventListener("visibilitychange", onVis);
    });
  }
  // V21 + Neon › Argon (23-nov-2026): estadísticas del día, la semana y el mes con tablero horológico interactivo. Al tocar cualquiera
  // de las cinco métricas el gráfico cambia al instante a esa magnitud; se recortan los días iniciales en cero para no dejar vacío el
  // lado izquierdo y la cabecera reparte simétricamente el foco seleccionado a la izquierda y el acumulado/media a la derecha.
  function tarjetaAvance(y, P) {
    const hist = Array.isArray(P.hist) ? P.hist.slice() : []; if (P.hoyR) hist.push(Object.assign({ hoy: 1 }, P.hoyR)); if (hist.length < 1) return null;
    const MET = [["xp", "experiencia", "Experiencia"], ["v", "versos", "Versos marcados"], ["m", "minutos", "Minutos leídos"], ["a", "aciertos", "Aciertos en pruebas"], ["c", "capítulos", "Capítulos completos"]];
    const suma = (l) => l.reduce((o, d) => { for (const [k] of MET) o[k] = (o[k] || 0) + (d[k] | 0); return o; }, {});
    const sem = (f) => { const d = new Date(f + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() - d.getUTCDay()); return d.toISOString().slice(0, 10); }; // la semana empieza el domingo
    const grupos = (clave) => { const m = new Map(); for (const d of hist) { const k = clave(d.f); if (!m.has(k)) m.set(k, []); m.get(k).push(d); } return [...m].map(([k, l]) => Object.assign({ k }, suma(l))); };
    const recortarCeros = (arr, minCols) => {
      const iAct = arr.findIndex((d) => MET.some(([k]) => (d[k] | 0) > 0));
      if (iAct <= 1) return arr;
      const desde = Math.max(0, Math.min(iAct - 1, arr.length - minCols));
      return arr.slice(desde);
    };
    const DIAS_L = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sá"], DIAS_C = ["D", "L", "M", "X", "J", "V", "S"];
    const F_D = new Intl.DateTimeFormat(LOC_ES, { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
    const F_DM = new Intl.DateTimeFormat(LOC_ES, { day: "numeric", month: "short", timeZone: "UTC" });
    const F_M = new Intl.DateTimeFormat(LOC_ES, { month: "short", timeZone: "UTC" });
    const F_MY = new Intl.DateTimeFormat(LOC_ES, { month: "long", year: "numeric", timeZone: "UTC" });
    const mesC = (dt) => F_M.format(dt).replace(/\.$/, "");
    const VISTAS = {
      dia: () => ({ l: recortarCeros(hist.slice(-14), 5).map((d) => {
        const dt = new Date(d.f + "T12:00:00Z"), dow = dt.getUTCDay(), dn = String(dt.getUTCDate());
        return Object.assign({ et: d.hoy ? "Hoy (" + F_DM.format(dt) + ")" : F_D.format(dt), etA: d.hoy ? "Hoy" : DIAS_L[dow], etAC: d.hoy ? "Hoy" : DIAS_C[dow], etB: dn }, d);
      }), ahora: "Hoy", antes: "ayer", serie: "últimos días" }),
      semana: () => ({ l: recortarCeros(grupos(sem).slice(-8), 4).map((g2, i, a) => {
        const dt = new Date(g2.k + "T12:00:00Z"), ult = i === a.length - 1, top = ult ? "Esta" : String(dt.getUTCDate());
        return Object.assign({ et: ult ? "Esta semana" : "Sem. " + F_DM.format(dt), etA: top, etAC: top, etB: ult ? "sem." : mesC(dt) }, g2);
      }), ahora: "Esta semana", antes: "sem. anterior", serie: "últimas semanas" }),
      mes: () => ({ l: recortarCeros(grupos((f) => f.slice(0, 7)).slice(-6), 3).map((g2, i, a) => {
        const dt = new Date(g2.k + "-15T12:00:00Z"), ult = i === a.length - 1, top = ult ? "Este" : mesC(dt);
        return Object.assign({ et: ult ? "Este mes" : F_MY.format(dt), etA: top, etAC: top, etB: ult ? "mes" : "'" + String(dt.getUTCFullYear()).slice(-2) }, g2);
      }), ahora: "Este mes", antes: "mes anterior", serie: "últimos meses" }),
    };
    const zona = h("div", { class: "av-z" });
    let vista = A.store.get("jg:avVista", null) || "dia";
    let met = A.store.get("jg:avMet", null) || "xp";
    if (!MET.some((x) => x[0] === met)) met = "xp";
    let selGuardado = -1;
    function pintar(soloGraf) {
      const V = VISTAS[vista](), l = V.l;
      let selIdx = soloGraf && selGuardado >= 0 && selGuardado < l.length ? selGuardado : Math.max(0, l.length - 1);
      selGuardado = selIdx;
      const cur = l[selIdx] || {}, prev = selIdx > 0 ? l[selIdx - 1] : null;
      const metInfo = MET.find((x) => x[0] === met) || MET[0];
      const vals = l.map((d) => d[met] | 0);
      const max = Math.max(1, ...vals), totP = vals.reduce((a, b) => a + b, 0);
      const activosN = vals.filter((v) => v > 0).length;
      const med = vals.length ? Math.round(totP / vals.length) : 0;
      let iMax = vals.length - 1;
      for (let i = 0; i < vals.length; i++) if (vals[i] >= vals[iMax]) iMax = i;
      const badge = h("span", { class: "av-badge" });
      const focoTit = h("span", { class: "av-tit" });
      const focoNum = h("b", { class: "av-tot" });
      const focoSub = h("small", { "aria-live": "polite" });
      const cab = h("div", { class: "jg-av-cab" },
        h("div", { class: "jg-av-izq" }, focoTit, focoNum, focoSub),
        h("div", { class: "jg-av-der" },
          badge,
          h("span", { class: "av-foco-v", text: "Total (" + V.serie + "): " + fmt(totP) }),
          h("span", { class: "av-meta-r", text: activosN + " de " + vals.length + (vista === "dia" ? " días activos" : vista === "semana" ? " sem. activas" : " meses activos") + " · media " + fmt(med) })));
      const tarjetasMet = [];
      const initIdx = selIdx;
      let tocoUsuario = false;
      const cifras = h("ul", { class: "av-cif", role: "group", "aria-label": "Elegir magnitud del gráfico" }, MET.map(([k, nom, tit]) => {
        const a = cur[k] | 0;
        const num = h("b", { text: soloGraf ? fmt(a) : "0" });
        const cmp = h("span", { class: "av-antes" });
        if (!soloGraf) setTimeout(() => { if (!tocoUsuario && selIdx === initIdx && num.isConnected) contarRapido(num, a, 760); }, 40);
        const btn = h("button", { type: "button", class: "av-cif-b", "aria-pressed": String(k === met), "aria-label": tit + ": " + fmt(a), onclick: () => { if (met === k) return; met = k; A.store.set("jg:avMet", k); vibrar(6); pintar(true); } },
          num, h("small", { text: nom }), cmp);
        tarjetasMet.push({ k, tit, num, cmp, btn });
        return h("li", { class: k === met ? "sel" : "" }, btn);
      }));
      const cols = [];
      const aplicarSeleccion = (idx, animarNum) => {
        selIdx = idx; selGuardado = idx;
        cols.forEach((cEl, j) => { cEl.classList.toggle("sel", j === idx); cEl.setAttribute("aria-pressed", String(j === idx)); });
        const d = l[idx]; if (!d) return;
        const ant = idx > 0 ? l[idx - 1] : null, esUlt = idx === l.length - 1;
        const etAnt = esUlt ? V.antes : (vista === "dia" ? "día ant." : vista === "semana" ? "sem. ant." : "mes ant.");
        const dV = d[met] | 0, antV = ant ? ant[met] | 0 : 0;
        const subeM = ant && dV > antV && antV > 0 ? Math.round((100 * (dV - antV)) / antV) : 0;
        const esPico = dV > 0 && dV >= max && vals.length > 1;
        if (subeM > 0) { badge.className = "av-badge sube"; badge.textContent = "▲ +" + subeM + " % frente a " + etAnt; }
        else if (esPico) { badge.className = "av-badge pico"; badge.textContent = "Mejor marca del período"; }
        else { badge.className = "av-badge"; badge.textContent = "Media: " + fmt(med) + " " + metInfo[1]; }
        focoTit.textContent = (d.et || V.ahora) + " · " + metInfo[2];
        focoNum.textContent = fmt(dV);
        focoSub.textContent = (ant ? etAnt + ": " + fmt(antV) + " " + metInfo[1] + " · " : "") + "mejor: " + fmt(max) + " " + metInfo[1];
        // Todas las tarjetas de métricas reflejan directamente la fecha seleccionada (BiEx, 23-nov-2026)
        for (const m of tarjetasMet) {
          const a = d[m.k] | 0, b = ant ? ant[m.k] | 0 : 0;
          const sube = ant && a > b && b > 0 ? Math.round((100 * (a - b)) / b) : 0;
          if (!animarNum) m.num.textContent = fmt(a);
          m.btn.setAttribute("aria-label", m.tit + " (" + (d.et || V.ahora) + "): " + fmt(a));
          if (sube > 0) { m.cmp.className = "av-sube"; m.cmp.textContent = "▲ " + sube + " %"; m.cmp.hidden = false; }
          else if (ant) { m.cmp.className = "av-antes"; m.cmp.textContent = etAnt + ": " + fmt(b); m.cmp.hidden = false; }
          else { m.cmp.textContent = ""; m.cmp.hidden = true; }
        }
      };
      const seleccionar = (idx) => { tocoUsuario = true; aplicarSeleccion(idx, false); };
      const pctMed = Math.max(4, Math.min(96, (100 * med) / max));
      const barras = h("div", { class: "av-bar" + (l.length > 8 ? " denso" : ""), role: "group", "aria-label": metInfo[2] + " por fecha: toca una barra para ver todas las cifras de ese período" },
        l.map((d, i) => {
          const val = d[met] | 0, hp = val > 0 ? Math.max(5, (100 * val) / max) : 2;
          const esTope = val > 0 && i === iMax && vals.some((x) => x > 0);
          const col = h("button", { type: "button", class: "av-col" + (i === l.length - 1 ? " ya" : "") + (esTope ? " tope" : "") + (i === selIdx ? " sel" : ""), "aria-pressed": String(i === selIdx), "aria-label": d.et + ": " + fmt(val) + " " + metInfo[1],
            onclick: () => { vibrar(5); seleccionar(i); }, onpointerenter: (e) => { if (e.pointerType === "mouse") seleccionar(i); } },
            h("span", { class: "av-pozo" }, h("i", { style: "height:" + hp.toFixed(1) + "%;--i:" + i }), esTope ? h("em", { class: "av-pico", "aria-hidden": "true" }) : null),
            h("small", {},
              h("span", { class: "av-et-a" }, d.etA !== d.etAC ? [h("span", { class: "av-et-l", text: d.etA }), h("span", { class: "av-et-c", text: d.etAC })] : d.etA),
              h("span", { class: "av-et-b", text: d.etB })));
          cols.push(col);
          return col;
        }));
      aplicarSeleccion(selIdx, !soloGraf);
      const rej = h("div", { class: "av-rej", "aria-hidden": "true" },
        h("span", { class: "av-ln av-ln-max" }, h("em", { text: fmt(max) })),
        h("span", { class: "av-ln av-ln-mid" }, h("em", { text: fmt(Math.round(max / 2)) })),
        med > 0 ? h("span", { class: "av-ln av-ln-med", style: "bottom:" + pctMed.toFixed(1) + "%" }) : null);
      const graf = h("div", { class: "av-graf" }, rej, barras);
      zona.replaceChildren(cab, cifras, graf);
    }
    const seg = h("div", { class: "jg-seg fila", role: "group" }, [["dia", "Día"], ["semana", "Semana"], ["mes", "Mes"]].map(([k, t]) => h("button", { type: "button", "aria-pressed": String(vista === k), onclick: (e) => {
      vista = k; selGuardado = -1; A.store.set("jg:avVista", k); for (const b of e.currentTarget.parentNode.children) b.setAttribute("aria-pressed", String(b === e.currentTarget)); pintar(false); } }, t)));
    pintar(false);
    return tarjeta("Tu avance", ico("arbol"), seg, zona);
  }
  // Proyección estadística para completar la Nueva Voluntad (BiEx, 23-nov-2026): media exponencial ponderada (vida media
  // de 7 días) con recorte de picos extremos (winsorización) e intervalo de confianza, recalculada 4 veces al día (00:00, 06:00, 12:00 y 18:00).
  function fmtDuracionDias(d) {
    d = Math.max(1, Math.round(d));
    if (d > 3650) return "más de 10 años";
    if (d < 45) return plural(d, "día", "días");
    if (d < 365) {
      let m = Math.floor(d / 30.4375), r = Math.round(d - m * 30.4375);
      if (r >= 29) { m++; r = 0; }
      return plural(m, "mes", "meses") + (r >= 3 ? " y " + plural(r, "día", "días") : "");
    }
    let a = Math.floor(d / 365.25), m = Math.round((d - a * 365.25) / 30.4375);
    if (m >= 12) { a++; m = 0; }
    return plural(a, "año", "años") + (m > 0 ? " y " + plural(m, "mes", "meses") : "");
  }
  function calcularProyeccionLectura(y, P) {
    const L = y && y.lk; if (!L || !L.total) return null;
    const ahora = new Date(), hr = ahora.getHours(), corte = Math.floor(hr / 6);
    const fechaLoc = ahora.getFullYear() + "-" + String(ahora.getMonth() + 1).padStart(2, "0") + "-" + String(ahora.getDate()).padStart(2, "0");
    const clave = fechaLoc + "#" + corte + "#" + (y.inv || "") + "#" + (L.k | 0);
    const tieneHist = !!(P && Array.isArray(P.hist));
    if (L.faltan <= 0) return { estado: "completa", clave, corte, sig: L.k + 1 };
    const cache = A.store.get("jg:lkProy", null);
    if (cache && cache.clave === clave && (cache.fuente === "hist" || !tieneHist)) return cache;
    const mapa = new Map();
    if (tieneHist) for (const d of P.hist) if (d && d.f) mapa.set(d.f, (mapa.get(d.f) || 0) + Math.max(0, d.v | 0));
    const hoyF = (P && P.hoyR && P.hoyR.f) || (y.hoy && y.hoy.f) || fechaLoc;
    const hoyV = Math.max((P && P.hoyR && P.hoyR.v) | 0, (y.hoy && y.hoy.versos) | 0);
    const prevFechas = [...mapa.keys()].filter((f) => f < hoyF).sort();
    const hoyMs = Date.parse(hoyF + "T12:00:00Z") || Date.now();
    const serie = [];
    if (prevFechas.length) {
      const primeraAct = prevFechas.find((f) => (mapa.get(f) || 0) > 0);
      if (primeraAct) {
        const iniMs = Math.max(Date.parse(primeraAct + "T12:00:00Z"), hoyMs - 30 * 864e5);
        const finMs = hoyMs - 864e5;
        for (let t = iniMs; t <= finMs + 1000; t += 864e5) {
          const f = new Date(t).toISOString().slice(0, 10);
          const age = Math.max(1, Math.round((hoyMs - t) / 864e5));
          serie.push({ v: mapa.get(f) || 0, age, wMul: 1 });
        }
      }
    }
    if (hoyV > 0) {
      if (serie.length) {
        const media0 = serie.reduce((a, x) => a + x.v, 0) / serie.length;
        const wHoy = hoyV >= media0 ? 1 : Math.max(0.25, (hr + ahora.getMinutes() / 60) / 24);
        serie.push({ v: hoyV, age: 0, wMul: wHoy });
      } else {
        serie.push({ v: hoyV, age: 0, wMul: 1 });
      }
    }
    const activos = serie.map((x) => x.v).filter((v) => v > 0).sort((a, b) => a - b);
    const fuente = tieneHist ? "hist" : "min";
    if (!activos.length) {
      const res0 = { estado: "sin_ritmo", clave, corte, faltan: L.faltan, fuente };
      A.store.set("jg:lkProy", res0);
      return res0;
    }
    const medAct = activos[Math.floor(activos.length / 2)];
    const p90 = activos[Math.min(activos.length - 1, Math.floor(activos.length * 0.9))];
    const techo = Math.max(medAct * 2.5, p90, 20);
    const lam = Math.LN2 / 7;
    let sw = 0, sw2 = 0, sv = 0;
    for (const x of serie) {
      const w = Math.exp(-lam * x.age) * x.wMul, vv = Math.min(x.v, techo);
      sw += w; sw2 += w * w; sv += w * vv;
    }
    const mu = sw > 0 ? sv / sw : 0;
    if (mu < 0.2) {
      const res0 = { estado: "sin_ritmo", clave, corte, faltan: L.faltan, fuente };
      A.store.set("jg:lkProy", res0);
      return res0;
    }
    let varS = 0;
    for (const x of serie) {
      const w = Math.exp(-lam * x.age) * x.wMul, vv = Math.min(x.v, techo);
      varS += w * (vv - mu) * (vv - mu);
    }
    const nEf = sw2 > 0 ? (sw * sw) / sw2 : 1;
    const sd = Math.sqrt(varS / sw);
    const se = nEf > 1.25 ? sd / Math.sqrt(nEf) : mu * 0.25;
    const muLow = Math.max(mu * 0.45, mu - 0.85 * se);
    const muHigh = Math.min(mu * 1.75, mu + 0.85 * se);
    const dias = Math.max(1, Math.ceil(L.faltan / mu));
    const diasOpt = Math.max(1, Math.ceil(L.faltan / muHigh));
    const diasCons = Math.max(dias, Math.ceil(L.faltan / muLow));
    const salto = mu >= 40 ? 15 : 10;
    const diasImp = Math.max(1, Math.ceil(L.faltan / (mu + salto)));
    const ahorro = Math.max(0, dias - diasImp);
    const fechaMeta = dias <= 3650 ? new Date(Date.now() + dias * 864e5).toLocaleDateString("es", dias > 365 ? { month: "long", year: "numeric" } : { day: "numeric", month: "long", year: "numeric" }) + " d.H.D." : "";
    const res = { estado: "ok", clave, corte, fuente, mu: Math.round(mu * 10) / 10, dias, diasOpt, diasCons, fechaMeta, diasBase: serie.length, salto, diasImp, ahorro, sig: L.k + 1 };
    A.store.set("jg:lkProy", res);
    return res;
  }
  function pintarProyeccionLectura(caja, res) {
    const CORTES = ["00:00", "06:00", "12:00", "18:00"], PROX = ["06:00", "12:00", "18:00", "00:00"];
    const tag = "Corte " + CORTES[res.corte] + " · próx. " + PROX[res.corte];
    if (res.estado === "completa") {
      caja.replaceChildren(
        h("div", { class: "lk-proy-cab" }, h("span", { class: "lk-proy-tit", text: "Proyección estadística" }), h("span", { class: "lk-proy-corte", text: tag })),
        h("div", { class: "lk-proy-hero" },
          h("div", { class: "lk-proy-hero-izq" }, h("small", { text: "Estado de la lectura" }), h("b", { text: "¡Meta cumplida!" })),
          h("span", { class: "lk-proy-meta", text: "100 % completada" })),
        h("p", { class: "lk-proy-pie", text: "Completaste todos los versos de esta lectura de la Nueva Voluntad." }));
      return;
    }
    if (res.estado === "sin_ritmo") {
      caja.replaceChildren(
        h("div", { class: "lk-proy-cab" }, h("span", { class: "lk-proy-tit", text: "Proyección estadística" }), h("span", { class: "lk-proy-corte", text: tag })),
        h("div", { class: "lk-proy-hero" },
          h("div", { class: "lk-proy-hero-izq" }, h("small", { text: "Esperando tu ritmo de hoy" }), h("b", { text: fmt(res.faltan || 7957) + " versos por delante" })),
          h("span", { class: "lk-proy-meta", text: "4 cortes diarios" })),
        h("p", { class: "lk-proy-pie", text: "Lee unos versos hoy y estimaremos en cuánto tiempo alcanzarás la lectura completa de la Nueva Voluntad." }));
      return;
    }
    const ritmoTxt = res.mu.toFixed(1).replace(".", ",") + " versos/día";
    const tieneHorq = res.diasBase >= 2 && res.diasCons > res.diasOpt && res.dias <= 3650;
    const horqVal = tieneHorq ? fmtDuracionDias(res.diasOpt) + " – " + fmtDuracionDias(res.diasCons) : fmtDuracionDias(Math.max(1, Math.round(res.dias * 0.85))) + " – " + fmtDuracionDias(Math.round(res.dias * 1.2));
    const tieneImp = res.ahorro >= 1 && res.dias <= 3650;
    caja.replaceChildren(
      h("div", { class: "lk-proy-cab" }, h("span", { class: "lk-proy-tit", text: "Proyección estadística · lectura n.º " + res.sig }), h("span", { class: "lk-proy-corte", text: tag })),
      h("div", { class: "lk-proy-hero" },
        h("div", { class: "lk-proy-hero-izq" }, h("small", { text: "Tiempo restante estimado" }), h("b", { text: fmtDuracionDias(res.dias) })),
        res.fechaMeta ? h("span", { class: "lk-proy-meta", text: "Meta: " + res.fechaMeta }) : null),
      h("div", { class: "lk-proy-grid" },
        h("div", { class: "lk-proy-cel" },
          h("small", { text: "Ritmo ponderado" }),
          h("b", { text: ritmoTxt }),
          h("span", { text: "Muestra de " + plural(res.diasBase, "día", "días") })),
        h("div", { class: "lk-proy-cel" },
          h("small", { text: "Horquilla probable" }),
          h("b", { text: horqVal }),
          h("span", { text: "Según tu constancia reciente" })),
        h("div", { class: "lk-proy-cel imp" },
          h("small", { text: "Impulso +" + res.salto + " versos/día" }),
          h("b", { text: tieneImp ? "Adelantas " + fmtDuracionDias(res.ahorro) : "Meta en " + fmtDuracionDias(res.diasImp) }),
          h("span", { text: "Llegarías en " + fmtDuracionDias(res.diasImp) }))),
      h("p", { class: "lk-proy-pie", text: "Media exponencial ponderada con control de picos · se recalcula 4 veces al día (00:00, 06:00, 12:00 y 18:00)." }));
  }
  // AD2 + Neon › Argon (23-nov-2026): lecturas completas de la Nueva Voluntad en Tesoro, con proyección estadística 4×/día y desglose local por libro (%)
  function tarjetaLecturas(y) {
    const L = y && y.lk; if (!L || !L.total) return null;
    const hechos = L.total - L.faltan, fr = hechos / L.total, C = 2 * Math.PI * 34, u = "lk" + Math.random().toString(36).slice(2, 7);
    const anillo = A.svg('<defs><linearGradient id="' + u + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff3cc"/><stop offset=".5" stop-color="#e8cf94"/><stop offset="1" stop-color="#b8892f"/></linearGradient></defs>' +
      '<circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,240,200,.13)" stroke-width="4.5"/>' +
      '<circle cx="40" cy="40" r="34" fill="none" stroke="url(#' + u + ')" stroke-width="4.5" stroke-linecap="round" stroke-dasharray="' + C.toFixed(2) + '" stroke-dashoffset="' + (C * (1 - fr)).toFixed(2) + '" transform="rotate(-90 40 40)"/>', "0 0 80 80");
    const sig = L.k + 1, H = L.h || [];
    const cel = [["sin marcar", H[0]], ["1 vez", H[1]], ["2 veces", H[2]], ["3 veces", H[3]], ["4 o más", H[4]]];
    const proyBox = h("div", { class: "lk-proy", "aria-live": "polite" });
    const proyIni = calcularProyeccionLectura(y, PODER);
    if (proyIni) pintarProyeccionLectura(proyBox, proyIni);
    if (S.token && (!proyIni || proyIni.fuente !== "hist") && L.faltan > 0) {
      cargarPoder(false).then((P) => {
        if (!proyBox.isConnected || !P || P.error) return;
        const res = calcularProyeccionLectura(y, P);
        if (res) pintarProyeccionLectura(proyBox, res);
      }).catch(() => {});
    }
    const porLibro = (() => {
      if (!A.progresoLibros) return null;
      const lista = A.progresoLibros(A.store.get("jg:cf", null) || {}, lecturasK());
      if (!lista || !lista.length) return null;
      const iniciados = lista.filter((b) => b.l > 0).length;
      const cont = h("ul", { class: "lk-lib-l" });
      const pintarL = () => {
        cont.replaceChildren(...lista.map((b) => {
          const pc = b.t ? Math.min(100, Math.round((100 * b.l) / b.t)) : 0;
          return h("li", { class: pc >= 100 ? "hecho" : b.l > 0 ? "en" : "" },
            h("a", { href: "#/" + b.c + "/" + (b.sig || 1), class: "lk-lib-a" },
              h("span", { class: "lk-lib-n", text: b.n }),
              h("span", { class: "lk-lib-p", text: pc + " %" }),
              h("span", { class: "lk-lib-bar", "aria-hidden": "true" }, h("i", { style: "width:" + pc + "%" })),
              h("small", { class: "lk-lib-c", text: fmt(b.l) + " / " + fmt(b.t) + " versos" }),
              h("small", { class: "lk-lib-ir", text: pc >= 100 ? "Completado ✓" : "Cap. " + (b.sig || 1) + " ›" })));
        }));
      };
      const sumLoc = lista.reduce((a, b) => a + (b.l || 0), 0);
      const notaSinc = hechos > sumLoc ? h("p", { class: "jg-mini lk-libs-nota", text: "Tu total exacto (" + fmt(hechos) + " versos) está guardado en tu cuenta. El desglose por libro en este dispositivo refleja los capítulos abiertos aquí y se sincroniza al visitar cada capítulo." }) : null;
      const det = h("details", { class: "jg-pc lk-libs" },
        h("summary", {}, h("span", { text: L.k ? "Progreso por libro · lectura n.º " + sig : "Progreso por libro" }), h("small", { text: iniciados + " de " + lista.length + " iniciados" })),
        notaSinc, cont);
      det.addEventListener("toggle", () => { if (det.open && !det.dataset.ok) { det.dataset.ok = "1"; pintarL(); } });
      return det;
    })();
    return tarjeta("Lecturas completas", ico("libro"),
      h("div", { class: "lk-z" },
        h("div", { class: "jg-qz-med lk-med", role: "img", "aria-label": plural(L.k, "lectura completa", "lecturas completas") }, anillo, h("b", { text: String(L.k) }), h("small", { text: L.k === 1 ? "lectura" : "lecturas" })),
        h("div", { class: "lk-tx" },
          h("p", { class: "lk-t" }, L.k ? "Has leído la Nueva Voluntad completa " + (L.k === 1 ? "una vez" : L.k + " veces") + ", verso a verso." : "Tu primera lectura completa de la Nueva Voluntad, verso a verso."),
          h("p", { class: "jg-mini" }, "Para la lectura n.º " + sig + ": " + fmt(hechos) + " de " + fmt(L.total) + " versos (" + Math.round(fr * 100) + " %) · faltan " + fmt(L.faltan) + "."),
          L.k ? h("p", { class: "jg-mini" }, "Al completarse una lectura, cada marca baja un nivel: la doble queda sencilla y la sencilla se vacía para la lectura nueva. Cada cuenta queda aquí.") : null)),
      proyBox,
      h("ul", { class: "av-cif lk-h", "aria-label": "Cuántas veces se marcó cada verso" }, cel.map(([t, n]) => h("li", {}, h("b", { text: fmt(n | 0) }), h("small", { text: t })))),
      porLibro);
  }
  const semanaClave = () => { const d = new Date(), j = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())), dia = (j.getUTCDay() + 6) % 7; j.setUTCDate(j.getUTCDate() - dia + 3); const y0 = new Date(Date.UTC(j.getUTCFullYear(), 0, 4)); return j.getUTCFullYear() + "-" + String(1 + Math.round(((j - y0) / 864e5 - 3 + ((y0.getUTCDay() + 6) % 7)) / 7)).padStart(2, "0"); };
  const ICO_FORJA = '<path d="M5 20h9M7.5 16.5h4l1 3.5h-6zM13.6 4.2l5.6 5.6-2.3 2.3-1.6-1.6-5.4 5.4-1.8-1.8 5.4-5.4-1.6-1.6z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>';
  let CACHE_ARBOL = { sig: "", el: null }, CACHE_FIG = { sig: "", el: null };
  // Armadura: la figura y las seis piezas en rejilla (2 × 3) con su grado en cinco cuentas; la pieza elegida muestra abajo
  // qué gana con la forja siguiente y el botón para forjarla (se elige sola la primera que ya se puede forjar).
  function tarjetaArmadura(y, P, rehacer) {
    const av = P.av, d = P.def, cantos = (P.piedras || []).reduce((a, x) => a + x, 0);
    const puede = (gr) => { const s = d.forja[gr + 1]; return !!s && P.dr >= s.dr && cantos >= s.cantos; };
    const piezas = h("ul", { class: "ap-piezas" }), det = h("div", { class: "ap-forja", "aria-live": "polite" });
    // al ponerse al día el Árbol (o al volver de otra pestaña), la misma figura sigue viva en caché si su armadura y sus accesorios no cambiaron
    const sigF = JSON.stringify([av.eq || {}, av.acc || {}]);
    const previa = (FIG_PREV && FIG_PREV.dataset.sig === sigF) ? FIG_PREV : (CACHE_FIG.sig === sigF && CACHE_FIG.el && !CACHE_FIG.el.isConnected) ? CACHE_FIG.el : null;
    FIG_PREV = null;
    const serEl = previa || (CACHE_FIG = { sig: sigF, el: figuraArmadura(av) }).el;
    if (previa) setTimeout(() => { if (serEl._desp) serEl._desp(); else vivirSer(serEl); }, 60);
    const fig = h("div", { class: "ap-fig" }, serEl);
    const elegir = (i) => {
      const [id, n, at] = d.piezas[i], gr = av.eq[id] | 0, sig = d.forja[gr + 1], nAt = (d.atrib.find((a) => a[0] === at) || [])[1];
      [...piezas.children].forEach((li, j) => li.classList.toggle("sel", j === i));
      for (const gz of fig.querySelectorAll(".fa-luz")) gz.classList.toggle("on", gz.getAttribute("data-pz") === id);
      det.replaceChildren(h("span", { class: "ap-n" }, h("b", { text: n + " · " + d.grados[gr] + (sig ? " › " + d.grados[gr + 1] : "") }),
        // (BiEx, 15-nov-2026, 19:25) al final de la línea, las dracmas que tiene ahora
        h("small", {}, "Fortalece " + nAt + " (+" + 2 * gr + (sig ? " › +" + 2 * (gr + 1) : "") + ")" + (sig ? " · " + sig.dr + "\u00a0dr." + (sig.cantos ? " + " + plural(sig.cantos, "canto", "cantos") : "") : " · grado máximo"),
          h("span", { class: "ap-tienes" + (sig && P.dr < sig.dr ? " falta" : "") }, " · tienes ", h("b", { text: fmt(P.dr) + " dr." })))),
        sig ? h("button", { class: "btn chico " + (puede(gr) ? "dr-ok" : "dr-falta"), type: "button", onclick: async (e) => { const b = e.currentTarget; b.disabled = true;
          // (BiEx, 15-nov-2026, 19:25: «se actualizó la pantalla y solo vi un mensaje breve») la forja se celebra con el ser interior
          const antes = { poder: av.poder, ef: Object.assign({}, av.ef) };
          const r = await accionPoder("/tienda/comprar", { item: "forja:" + id }, null, "forja"); if (r) celebrarForja(id, n, gr + 1, d.grados[gr + 1], at, nAt, antes, r, rehacer); else b.disabled = false; } },
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
  // Sellos raros (vitrina y pecho de la figura, 48 × 48 sin ids para repetirse): rollo de siete sellos y candelero de siete brazos
  const SELLO_RARO = {
    "sello-rollo": '<circle cx="24" cy="24" r="16.2" fill="#231214" stroke="#8f6318" stroke-width=".9"/>' +
      '<rect x="13.8" y="16.4" width="20.4" height="15.2" rx="1.8" fill="#f7e6bd" stroke="#6d460e" stroke-width=".9"/>' +
      '<path d="M16.2 19.6h15.6M16.2 22h11.2M16.2 28.4h15.6" stroke="#b9985a" stroke-width=".65" opacity=".75" stroke-linecap="round"/>' +
      '<rect x="11.4" y="14.2" width="25.2" height="3.6" rx="1.8" fill="#e7be62" stroke="#5e3a0a" stroke-width=".8"/>' +
      '<rect x="11.4" y="30.2" width="25.2" height="3.6" rx="1.8" fill="#e7be62" stroke="#5e3a0a" stroke-width=".8"/>' +
      '<circle cx="12.6" cy="16" r="1" fill="#fff4cf"/><circle cx="35.4" cy="16" r="1" fill="#fff4cf"/><circle cx="12.6" cy="32" r="1" fill="#fff4cf"/><circle cx="35.4" cy="32" r="1" fill="#fff4cf"/>' +
      [16.2, 20.1, 24, 27.9, 31.8].map((x) => '<circle cx="' + x + '" cy="24.2" r="1.55" fill="#b32428" stroke="#5a0d12" stroke-width=".4"/><circle cx="' + (x - 0.4) + '" cy="23.7" r=".42" fill="#ffd9d4"/>').join("") +
      '<circle cx="19.2" cy="27.9" r="1.35" fill="#b32428" stroke="#5a0d12" stroke-width=".4"/><circle cx="18.8" cy="27.5" r=".36" fill="#ffd9d4"/>' +
      '<circle cx="28.8" cy="27.9" r="1.35" fill="#b32428" stroke="#5a0d12" stroke-width=".4"/><circle cx="28.4" cy="27.5" r=".36" fill="#ffd9d4"/>',
    "sello-candelero": '<circle cx="24" cy="24" r="16.2" fill="#14110b" stroke="#8f6318" stroke-width=".9"/>' +
      '<path d="M24 34.4V17.4M17.4 20.4c0 5.6 2.8 8.6 6.6 8.6s6.6-3 6.6-8.6M13.8 19.6c0 8.5 4.4 12.6 10.2 12.6s10.2-4.1 10.2-12.6M20.7 21.8c0 2.9 1.3 4.3 3.3 4.3s3.3-1.4 3.3-4.3" fill="none" stroke="#f0c45c" stroke-width="1.45" stroke-linecap="round"/>' +
      '<path d="M20.2 35.2h7.6M18.2 37.2h11.6" stroke="#f0c45c" stroke-width="1.65" stroke-linecap="round"/>' +
      [13.8, 17.4, 20.7, 24, 27.3, 30.6, 34.2].map((x) => '<circle cx="' + x + '" cy="18.6" r="1.15" fill="#c9922c"/>' +
        '<path d="M' + x + ' 18.2c-1.35-1.4-1.05-3.1 0-4.7 1.05 1.6 1.35 3.3 0 4.7z" fill="#ffae3d"/>' +
        '<path d="M' + x + ' 17.6c-.55-.7-.45-1.5 0-2.4.45.9.55 1.7 0 2.4z" fill="#fff8de"/>').join(""),
  };
  // Muestra de cada accesorio (48 × 48, sin ids para repetirse): arte multicapa escalado según rareza y coste; cero cruces ni estrellas
  function muestraAcc(id, ran, tier) {
    const t = tier || 1;
    if (ran === "aura") {
      if (id === "aura-columna") {
        return '<circle cx="24" cy="24" r="21" fill="#ff7324" opacity=".12"/><circle cx="24" cy="24" r="15" fill="#ff8e38" opacity=".18"/>' +
          '<ellipse cx="24" cy="25" rx="19" ry="9.5" fill="none" stroke="#ffbe5c" stroke-width=".95" opacity=".68" transform="rotate(-28 24 25)"/>' +
          '<ellipse cx="24" cy="24" rx="18" ry="8.5" fill="none" stroke="#ffe7a8" stroke-width=".8" opacity=".55" transform="rotate(30 24 24)"/>' +
          '<path d="M24 7C29 14 32 21 30 30C29 35 27 39 24 41C21 39 19 35 18 30C16 21 19 14 24 7Z" fill="#d94414" opacity=".88"/>' +
          '<path d="M24 11C27.8 17 29.5 23 28 30.5C27.2 34.5 25.8 37.5 24 39.2C22.2 37.5 20.8 34.5 20 30.5C18.5 23 20.2 17 24 11Z" fill="#ff8d2e"/>' +
          '<path d="M24 15.5C26.4 20 27.2 25 26.2 30.5C25.6 33.4 24.8 35.5 24 37C23.2 35.5 22.4 33.4 21.8 30.5C20.8 25 21.6 20 24 15.5Z" fill="#ffe188"/>' +
          '<path d="M24 20.5C25.3 23.8 25.6 27.6 24 34C22.4 27.6 22.7 23.8 24 20.5Z" fill="#fffdf2"/>' +
          '<circle cx="15" cy="15" r="1.1" fill="#ffd98a"/><circle cx="33.5" cy="18" r="1.2" fill="#ffe8b0"/><circle cx="16.5" cy="33" r=".95" fill="#ff9e4a"/><circle cx="32" cy="31" r="1" fill="#ffd178"/>';
      }
      if (id === "aura-nube") {
        return '<circle cx="24" cy="24" r="21" fill="#dce8fa" opacity=".11"/><ellipse cx="24" cy="25" rx="19" ry="9" fill="none" stroke="#dbe9ff" stroke-width=".9" opacity=".56" transform="rotate(-24 24 25)"/>' +
          '<ellipse cx="24" cy="23" rx="17.5" ry="8" fill="none" stroke="#ffe8b5" stroke-width=".7" opacity=".46" transform="rotate(28 24 23)"/>' +
          '<path d="M12 37Q24 34 36 37" fill="none" stroke="#c9a865" stroke-width="1.2" stroke-linecap="round" opacity=".75"/>' +
          '<path d="M18 35.5C15 34.5 14 31 16.5 28.8C14.8 26 16.8 22.2 20 21.8C19.5 17.6 22 13.8 25.5 13.5C29.4 13.2 31.8 16.8 30.8 20.5C33.8 21.2 35 25.2 32.8 28C34.8 30.4 33.4 34.6 30 35.5Z" fill="#a8bed9" opacity=".72"/>' +
          '<path d="M19.5 34.5C17 33.5 16.5 30.5 18.6 28.6C17.2 26 19 22.8 21.8 22.5C21.6 18.8 23.6 16 26.2 16C28.8 16 30.2 18.8 29.4 21.6C31.6 22.4 32.2 25.5 30.4 27.8C32 29.8 30.8 33.5 28.4 34.5Z" fill="#eef5ff" opacity=".95"/>' +
          '<circle cx="25.2" cy="19.2" r="3.4" fill="#ffffff" opacity=".88"/><circle cx="21.5" cy="26.2" r="3" fill="#ffffff" opacity=".68"/>' +
          '<circle cx="15" cy="14" r=".95" fill="#fff8e0" opacity=".8"/><circle cx="34" cy="16" r="1.1" fill="#e6f0ff" opacity=".85"/>';
      }
      const c = AURA_C[id] || "#f5c64e";
      if (id === "aura-esmeralda") {
        return '<circle cx="24" cy="24" r="20" fill="' + c + '" opacity=".1"/><path d="M9.5 30A15.5 15.5 0 0 1 38.5 30" fill="none" stroke="#8df7cc" stroke-width="2.4" stroke-linecap="round" opacity=".55"/>' +
          '<path d="M12.5 31A12.5 12.5 0 0 1 35.5 31" fill="none" stroke="' + c + '" stroke-width="1.6" stroke-linecap="round" opacity=".9"/>' +
          '<ellipse cx="24" cy="25" rx="18" ry="8.5" fill="none" stroke="#f2cf78" stroke-width=".8" opacity=".48" transform="rotate(-18 24 25)"/>' +
          '<path d="M24 14L31 24L24 34L17 24Z" fill="#135e40" stroke="#9bf5ce" stroke-width="1"/><path d="M24 14L31 24L24 24Z" fill="#63e6af"/><path d="M24 14L17 24L24 24Z" fill="#d8fff0"/><circle cx="24" cy="24" r="2.6" fill="#fff" opacity=".85"/>';
      }
      if (id === "aura-zafiro" || id === "aura-amatista") {
        const hi = id === "aura-zafiro" ? "#cfe4ff" : "#ebd8ff", dk = id === "aura-zafiro" ? "#163578" : "#441c78";
        return '<circle cx="24" cy="24" r="20" fill="' + c + '" opacity=".12"/><ellipse cx="24" cy="24" rx="19" ry="9" fill="none" stroke="' + hi + '" stroke-width=".9" opacity=".6" transform="rotate(-26 24 24)"/>' +
          '<ellipse cx="24" cy="24" rx="18" ry="8.5" fill="none" stroke="#f2cf78" stroke-width=".75" opacity=".46" transform="rotate(32 24 24)"/>' +
          '<path d="M24 11L33 24L24 37L15 24Z" fill="' + dk + '" stroke="' + hi + '" stroke-width="1"/><path d="M24 11L33 24L24 24Z" fill="' + c + '"/><path d="M24 11L15 24L24 24Z" fill="' + hi + '"/><path d="M24 17.5L28 24L24 30.5L20 24Z" fill="#fff" opacity=".42"/>' +
          '<circle cx="13" cy="16" r="1" fill="' + hi + '"/><circle cx="35" cy="31" r="1.1" fill="#ffeab8"/>';
      }
      if (id === "aura-alba") {
        return '<circle cx="24" cy="24" r="20" fill="#ffb38a" opacity=".12"/><circle cx="24" cy="28" r="13" fill="#ff9868" opacity=".28"/><circle cx="24" cy="28" r="8.5" fill="#ffd49e" opacity=".62"/><circle cx="24" cy="28" r="4.5" fill="#fffdf4"/>' +
          '<path d="M8 32Q24 28.5 40 32" fill="none" stroke="#e3b659" stroke-width="1.35" stroke-linecap="round"/><path d="M12 35.5Q24 33 36 35.5" fill="none" stroke="#ffb38a" stroke-width=".9" opacity=".6" stroke-linecap="round"/>' +
          '<ellipse cx="24" cy="24" rx="18.5" ry="9" fill="none" stroke="#ffe5b4" stroke-width=".8" opacity=".52" transform="rotate(-16 24 24)"/>';
      }
      return '<circle cx="24" cy="24" r="20" fill="' + c + '" opacity=".12"/><circle cx="24" cy="24" r="14.5" fill="' + c + '" opacity=".2"/>' +
        '<ellipse cx="24" cy="24" rx="18.5" ry="9" fill="none" stroke="' + c + '" stroke-width=".95" opacity=".72" transform="rotate(-24 24 24)"/>' +
        (t >= 2 ? '<ellipse cx="24" cy="24" rx="17" ry="8" fill="none" stroke="#fff2c9" stroke-width=".75" opacity=".52" transform="rotate(34 24 24)"/>' : "") +
        '<circle cx="24" cy="24" r="7.5" fill="' + c + '" opacity=".78"/><circle cx="24" cy="24" r="4" fill="#fffef4"/><circle cx="14.5" cy="15.5" r="1" fill="#fff3cc"/>';
    }
    if (ran === "manto") {
      const [a, b] = MANTO_C[id] || ["#2f3a47", "#0b1015"], raro = id === "manto-purpura", azul = id === "manto-azul", escM = id === "manto-escarlata";
      const orla = raro || escM ? '<path d="M9.5 39.2Q24 43.2 38.5 39.2" fill="none" stroke="#f4cd68" stroke-width="1.6" stroke-linecap="round"/><path d="M10.5 37.2Q24 41 37.5 37.2" fill="none" stroke="#fff2c4" stroke-width=".65" stroke-dasharray="1.6 1.8" opacity=".8"/>' : "";
      const flec = azul ? [12, 16, 20, 24, 28, 32, 36].map((x, i) => '<path d="M' + x + ' 41.2v3.6" stroke="' + (i % 2 ? "#5998ff" : "#f4ecdc") + '" stroke-width="1.15" stroke-linecap="round"/>').join("") : "";
      const broche = raro ? '<path d="M24 7.5L28 11.2L24 14.8L20 11.2Z" fill="#f5cc64" stroke="#5e3a0a" stroke-width=".8"/><circle cx="24" cy="11.2" r="1.4" fill="#e59eff"/>' : '<circle cx="24" cy="11" r="3" fill="#f2c14e" stroke="#6b440e" stroke-width=".9"/><circle cx="23.2" cy="10.2" r=".85" fill="#fff8de"/>';
      return '<path d="M16 9.5Q24 6.2 32 9.5L41.5 41.2Q24 45.8 6.5 41.2Z" fill="' + b + '" stroke="rgba(255,235,180,.28)" stroke-width=".7"/>' +
        '<path d="M17 9.8Q24 7 31 9.8L37.2 40.4Q24 44 10.8 40.4Z" fill="' + a + '"/>' +
        '<path d="M20.2 12.2L17.4 40.2M27.8 12.2L30.6 40.2M24 12.5V41.5" stroke="rgba(0,0,0,.28)" stroke-width="1.45" fill="none" stroke-linecap="round"/>' +
        '<path d="M21.8 13.5L20 38.5M26.4 13.5L28.2 38.5" stroke="rgba(255,250,235,.22)" stroke-width=".8" fill="none" stroke-linecap="round"/>' +
        '<path d="M16.4 10.4Q24 14.4 31.6 10.4" fill="none" stroke="#f0c55e" stroke-width="1.2" opacity=".85"/>' + orla + flec + broche;
    }
    if (ran === "sello" && SELLO_RARO[id]) {
      return '<circle cx="24" cy="24" r="20.2" fill="#d9a538" stroke="#5e3a0a" stroke-width="1.2"/><circle cx="24" cy="24" r="18.2" fill="none" stroke="#fff4cb" stroke-width=".9" stroke-dasharray="1.6 1.8" opacity=".82"/>' + SELLO_RARO[id];
    }
    if (ran === "corona") {
      const pal = id === "corona-palmas", mir = id === "corona-laurel";
      const v1 = mir ? "#487f3d" : pal ? "#84ab38" : "#6c9952", v2 = mir ? "#78be64" : pal ? "#d8ea72" : "#a8d17f";
      let s = '<path d="M13 38.5A15.5 15.5 0 0 1 13.5 11.5M35 38.5A15.5 15.5 0 0 0 34.5 11.5" fill="none" stroke="' + (pal ? "#e8bd56" : "#8e6b2a") + '" stroke-width="1.2" stroke-linecap="round"/>';
      for (let i = 0; i < 7; i++) for (const lado of [-1, 1]) {
        const g = (lado < 0 ? 204 - i * 24 : -24 + i * 24) * Math.PI / 180, x = 24 + 15.2 * Math.cos(g), y = 25.5 + 15.2 * Math.sin(g);
        const rot = ((g * 180) / Math.PI + 90 + lado * 30).toFixed(0);
        s += '<ellipse cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" rx="' + (pal ? "6.6" : "4.8") + '" ry="' + (pal ? "1.45" : "2.15") + '" transform="rotate(' + rot + " " + x.toFixed(1) + " " + y.toFixed(1) + ')" fill="' + v1 + '"/>' +
          '<ellipse cx="' + (x - lado * 0.4).toFixed(1) + '" cy="' + (y - 0.5).toFixed(1) + '" rx="' + (pal ? "4.6" : "3.1") + '" ry="' + (pal ? ".75" : "1.05") + '" transform="rotate(' + rot + " " + x.toFixed(1) + " " + y.toFixed(1) + ')" fill="' + v2 + '"/>';
      }
      const ad = id === "corona-olivo" ? '<circle cx="15" cy="17.5" r="2" fill="#3a5220" stroke="#9ec46a" stroke-width=".45"/><circle cx="33" cy="17.5" r="2" fill="#3a5220" stroke="#9ec46a" stroke-width=".45"/><circle cx="11.5" cy="29" r="1.7" fill="#3a5220"/>'
        : pal ? '<circle cx="11.5" cy="24" r="1.5" fill="#fff5d0"/><circle cx="36.5" cy="24" r="1.5" fill="#fff5d0"/><circle cx="16.2" cy="13.2" r="1.4" fill="#ffe48f"/><circle cx="31.8" cy="13.2" r="1.4" fill="#ffe48f"/><path d="M24 38.4L27.2 41L24 43.4L20.8 41Z" fill="#f7d272" stroke="#6d460e" stroke-width=".7"/>'
        : '<circle cx="11.5" cy="24.5" r="1.5" fill="#fffaf0"/><circle cx="36.5" cy="24.5" r="1.5" fill="#fffaf0"/><circle cx="16" cy="13.8" r="1.35" fill="#fffaf0"/><circle cx="32" cy="13.8" r="1.35" fill="#fffaf0"/>';
      return s + '<path d="M18.5 40.8c3.2 1.8 7.8 1.8 11 0" fill="none" stroke="#f5cb62" stroke-width="1.9" stroke-linecap="round"/>' + ad;
    }
    return '<circle cx="24" cy="24" r="19" fill="#d9a538" stroke="#5e3a0a" stroke-width="1.2"/><circle cx="24" cy="24" r="16.2" fill="none" stroke="#fff3c8" stroke-width=".85" stroke-dasharray="1.8 2" opacity=".75"/>' +
      (id === "sello-estrella"
        ? '<circle cx="24" cy="24" r="14.4" fill="#121c36" stroke="#7a5212" stroke-width=".8"/><path d="M12.5 30.2Q24 27 35.5 30.2" fill="none" stroke="#f2c866" stroke-width="1.5" stroke-linecap="round"/><path d="M16.5 33.6Q24 31.6 31.5 33.6" fill="none" stroke="#f2c866" stroke-width=".9" opacity=".6" stroke-linecap="round"/><circle cx="24" cy="21.5" r="7.2" fill="#ffe8a8" opacity=".24"/><circle cx="24" cy="21.5" r="4.5" fill="#ffeeb8" opacity=".65"/><circle cx="24" cy="21.5" r="2.6" fill="#fffef8"/>'
        : '<circle cx="24" cy="24" r="14.4" fill="#22170a" stroke="#7a5212" stroke-width=".8"/><path d="M15.8 29.2h16.4l-2.8 4.4h-10.8z" fill="#e6b74c" stroke="#5e3a0a" stroke-width=".7"/><path d="M19.6 29.2c.4-4.2 2.4-7.4 4.4-7.4s4 3.2 4.4 7.4z" fill="#c9922c"/><path d="M24 13.8c2 2.2 2 4.6 0 6.4-2-1.8-2-4.2 0-6.4z" fill="#ffae3d"/><path d="M24 15.8c.9 1.1.9 2.3 0 3.3-.9-1-.9-2.2 0-3.3z" fill="#fffbe6"/>');
  }
  const ICO_USO = {
    pergamino: '<path d="M7 4.5h9.5a2.5 2.5 0 0 1 0 5H9v9.5a2 2 0 0 1-4 0V6.5a2 2 0 0 1 2-2z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M9 9.5h8.5V18a2 2 0 0 1-2 2H7" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M11.5 13h3.5M11.5 16h2.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
    // AA21 · Renuevo: el tocón del árbol cortado con su brote nuevo (אִיּוֹב [Job] 14:7)
    renuevo: '<path d="M6.2 20.5l1.1-7.2h9.4l1.1 7.2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><ellipse cx="12" cy="13.3" rx="4.7" ry="1.6" fill="none" stroke="currentColor" stroke-width="1.4"/><ellipse cx="12" cy="13.3" rx="2.2" ry=".7" fill="none" stroke="currentColor" stroke-width=".9" opacity=".7"/><path d="M4.4 20.5h15.2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M14.6 12.4c.4-3 1.6-5.3 3.6-6.8" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M16.4 8.4c-1.9-.2-3.2-1.3-3.6-3.2 1.9.1 3.2 1.2 3.6 3.2z" fill="currentColor"/><path d="M17.6 6.2c1.3-1.2 2.9-1.5 4.1-.9-1.1 1.1-2.6 1.5-4.1.9z" fill="currentColor"/>',
    descanso: '<path d="M18.5 15.2A7.5 7.5 0 0 1 8.8 5.5a7.5 7.5 0 1 0 9.7 9.7z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M15.5 4.5h3l-3 3.5h3" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>',
    apodo: '<path d="M4 20l1.2-4.6L15.8 4.8a2 2 0 0 1 2.8 0l.6.6a2 2 0 0 1 0 2.8L8.6 18.8z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M13.8 6.8l3.4 3.4" stroke="currentColor" stroke-width="1.6"/>',
  };
  // Tienda: saldo a la vista, objetos de uso en filas finas y los accesorios en una vitrina por pestañas (una ranura a la vez)
  function tarjetaTienda(y, P, rehacer) {
    const av = P.av, d = P.def;
    const comprar = async (e, item, ok, fx) => { const b = e.currentTarget; b.disabled = true; const r = await accionPoder("/tienda/comprar", { item }, ok); if (r) { if (fx) chispas(fx); rehacer(); } else b.disabled = false; };
    const fila = (ic, n, ds, boton) => h("li", {}, h("span", { class: "ap-ui", "aria-hidden": "true" }, A.svg(ICO_USO[ic])), h("span", { class: "ap-n" }, h("b", { text: n }), h("small", { text: ds })), boton);
    const conPieza = (id) => id === "renuevo" && (y.renMed | 0) >= 2;
    const prAp = (y.apodoCambio && y.apodoCambio.precio) || 120;
    const uso = h("ul", { class: "ap-uso" }, d.uso.map(([id, n, pr, ds]) => fila(id, n, conPieza(id) ? ds + " · con tu pieza de Renuevo, sin dracmas" : ds, h("button", { class: "btn chico " + (P.dr >= pr || conPieza(id) ? "dr-ok" : "dr-falta"), type: "button", onclick: (e) => comprar(e, "uso:" + id, n + ": listo") }, h("span", { text: conPieza(id) ? "Pieza" : pr + " dr." })))),
      fila("apodo", "Cambio de apodo", "Una vez cada 3 semanas", h("a", { class: "btn chico " + (P.dr >= prAp ? "dr-ok" : "dr-falta"), href: "#/escudrina/cuenta" }, h("span", { text: prAp + " dr." }))));
    const NOM = { aura: "Auras", manto: "Mantos", corona: "Lauros", sello: "Sellos" };
    // Qué da cada accesorio (BiEx, 12-nov-2026): +25 de poder al tenerlo (cifra de tu ser interior), se luce en el emblema y en
    // el Árbol, y cada uno con su enseñanza (tema en palabras de Claude, con la cita para leerla en BiEx)
    // [enseñanza, libro, capítulo:versos]; los raros llevan su cita propia (RAROS_C)
    const DA = { "aura-oro": ["La luz que desciende de lo alto", "JAS", "1:17"], "aura-zafiro": ["El zafiro, segundo fundamento", "REV", "21:19"], "aura-esmeralda": ["El arco alrededor del trono, como de esmeralda", "REV", "4:3"],
      "aura-amatista": ["La amatista, duodécimo fundamento", "REV", "21:20"], "aura-alba": ["La senda que brilla como la luz del alba", "PRO", "4:18"],
      "manto-lino": ["El lino fino: las obras justas", "REV", "19:8"], "manto-escarlata": ["Vestidos de escarlata para el frío", "PRO", "31:21"], "manto-azul": ["Los flecos con su cordón azul, para recordar", "NUM", "15:38-39"],
      "corona-olivo": ["El lauro incorruptible", "1CO", "9:25"], "corona-laurel": ["El mirto en lugar de la ortiga", "ISA", "55:13"],
      "sello-lampara": ["La lámpara sobre el candelero", "MAT", "5:15"], "sello-estrella": ["La estrella resplandeciente de la mañana", "REV", "22:16"],
      "aura-columna": ["", "EXO", "13:21"], "aura-nube": ["", "EXO", "13:21"], "corona-palmas": ["", "REV", "7:9"], "manto-purpura": ["", "ACT", "16:14"], "sello-rollo": ["", "REV", "5:1"], "sello-candelero": ["", "REV", "1:12"] };
    const AV_COD = new Set(["GEN", "EXO", "LEV", "NUM", "DEU", "JOS", "JDG", "RUT", "1SA", "2SA", "1KI", "2KI", "1CH", "2CH", "EZR", "NEH", "EST", "JOB", "PSA", "PRO", "ECC", "SNG", "ISA", "JER", "LAM", "EZK", "DAN", "HOS", "JOL", "AMO", "OBA", "JON", "MIC", "NAM", "HAB", "ZEP", "HAG", "ZEC", "MAL"]);
    const refAcc = (x) => (AV_COD.has(x[1]) && A.nombreAV ? A.nombreAV(x[1]) : A.nombreLibro(x[1])) + " " + x[2];
    // (BiEx, 14-nov-2026) el verso de cada accesorio se despliega ahí mismo al tocarlo (sin salir de la tienda)
    const daAcc = (id, cita) => {
      const x = DA[id], base = "Da +25 de poder y se luce en tu emblema y en tu ser interior.";
      if (!x || !x[1]) return [base + (cita ? " Enseñanza: " + cita + "." : "")];
      const panel = h("div", { class: "ap-versos", hidden: true }), ref = refAcc(x);
      const bt = h("button", { class: "ap-cita", type: "button", "aria-expanded": "false", title: "Ver lo que dice", onclick: async (ev) => {
        ev.stopPropagation(); const ab = panel.hidden; panel.hidden = !ab; bt.setAttribute("aria-expanded", String(ab)); if (!ab || panel.dataset.listo) return;
        const [cap, vv] = x[2].split(":"), [v1, v2] = vv.split("-").map(Number); panel.replaceChildren(h("p", { class: "jg-mini", text: "Cargando…" }));
        try {
          if (AV_COD.has(x[1])) panel.replaceChildren(...(await A.versosAV(x[1], +cap, v1, v2 || v1)));
          else { const l = await A.versos(x[1], +cap, v1, v2 || v1); panel.replaceChildren(...l.map(([v, nodo]) => h("p", {}, l.length > 1 ? h("sup", { text: String(v) }) : null, l.length > 1 ? " " : null, nodo))); }
          panel.dataset.listo = "1";
          if (panel.animate && !sinAnim()) panel.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220, easing: "ease-out" });
        } catch (e) { panel.replaceChildren(h("p", { class: "jg-mini", text: "No se pudo cargar el texto. Revisa tu conexión." })); }
      } }, h("i", { class: "ap-lumbre", "aria-hidden": "true" }), ref, h("span", { class: "ap-cita-fl", "aria-hidden": "true", text: "▾" }));
      return [base + (x[0] ? " " + x[0] + ": " : " Enseñanza: "), bt, panel];
    };
    const tituloAcc = (id, cita) => { const x = DA[id]; return x && x[1] ? "Da +25 de poder. " + (x[0] ? x[0] + " (" + refAcc(x) + ")." : refAcc(x)) : "Da +25 de poder." + (cita ? " " + cita : ""); };
    let ran = A.store.get("jg:tiendaRan", "aura"); if (!d.ranuras.includes(ran)) ran = d.ranuras[0];
    const vitrina = h("ul", { class: "ap-vitrina", "aria-live": "polite" });
    const pestanas = h("div", { class: "jg-seg fila", role: "group", "aria-label": "Accesorios" }, d.ranuras.map((r) => h("button", { type: "button", "aria-pressed": String(r === ran), onclick: (e) => {
      ran = r; A.store.set("jg:tiendaRan", r); for (const b of pestanas.children) b.setAttribute("aria-pressed", String(b === e.currentTarget)); pintarV(); vibrar(6); } }, NOM[r] || r)));
    const colorAcc = (id, r) => r === "aura" ? AURA_C[id] || "#f5c64e" : r === "manto" ? (MANTO_C[id] || ["#d4a84a"])[0] : r === "corona" ? (id === "corona-palmas" ? "#c2e058" : id === "corona-laurel" ? "#6eb85e" : "#9bc46a") : id === "sello-rollo" ? "#e55b5b" : id === "sello-estrella" ? "#8bb8ff" : "#f5c64e";
    function pintarV() {
      // los raros (70 fragmentos de papiro marcando «Leído») se muestran en su relicario con barra de avance hacia los 70 papiros
      const raros = (d.raros || RAROS_C).filter((x) => x[1] === ran).map((x) => [x[0], x[1], x[2], null, x[3]]), frag = y.frag || { c: 0, meta: 70 };
      const rp = Math.max(0, Math.min(100, (100 * (frag.c || 0)) / Math.max(1, frag.meta || 70)));
      const PER = ["11.3s", "14.9s", "17.7s", "21.1s", "13.1s", "19.3s"];
      vitrina.replaceChildren(...d.acc.filter((x) => x[1] === ran).concat(raros).map(([id, , n, pr, cita], idx) => {
        const tiene = av.inv.includes(id), puesto = av.acc[ran] === id, esRaro = pr == null;
        const tier = esRaro ? 4 : pr >= 180 ? 3 : pr >= 100 ? 2 : 1;
        const sty = "--ac-c:" + colorAcc(id, ran) + ";--at:" + PER[idx % PER.length] + ";--ad:-" + (1.7 + idx * 2.9).toFixed(1) + "s";
        if (esRaro && !tiene) return h("li", { class: "raro cerrado ap-acc-t4", style: sty },
          h("span", { class: "ap-mu", "aria-hidden": "true" }, A.svg(muestraAcc(id, ran, 4), "0 0 48 48")),
          h("span", { class: "ap-mn", text: n }),
          h("small", { class: "ap-raro" },
            h("span", { text: "Se abre con 70 fragmentos de papiro (" + (frag.c || 0) + " de " + (frag.meta || 70) + ")" }),
            h("span", { class: "ap-raro-bar", "aria-hidden": "true" }, h("i", { style: "--rp:" + rp.toFixed(1) }))),
          h("div", { class: "ap-da" }, ...daAcc(id, cita)));
        const cls = "ap-acc-t" + tier + (esRaro ? " raro" : "") + (puesto ? " puesto" : "");
        return h("li", { class: cls, style: sty, title: tituloAcc(id, cita) },
          h("span", { class: "ap-mu", "aria-hidden": "true" }, A.svg(muestraAcc(id, ran, tier), "0 0 48 48")),
          h("span", { class: "ap-mn" }, n, esRaro ? h("em", { class: "ap-rtag", text: "Raro" }) : null),
          h("div", { class: "ap-da" }, ...daAcc(id, cita)),
          tiene ? h("button", { class: "btn chico" + (puesto ? "" : " oro"), type: "button", onclick: async (e) => { const b = e.currentTarget; b.disabled = true;
            const r = await accionPoder("/poder/equipar", { ranura: ran, id: puesto ? null : id }, puesto ? "Te lo quitaste" : "Equipado"); if (r) rehacer(); else b.disabled = false; } }, h("span", { text: puesto ? "Quitar" : "Equipar" }))
            : h("button", { class: "btn chico " + (P.dr >= pr ? "dr-ok" : "dr-falta"), type: "button", "aria-label": "Comprar " + n + " por " + pr + " dracmas", onclick: (e) => comprar(e, "acc:" + id, n + ": tuyo y equipado", 14) }, h("span", { text: pr + " dr." })));
      }));
    }
    pintarV();
    return tarjeta("Tienda de dracmas", ico("dracma"), h("div", { class: "ap-tienda-cab" }, h("p", { class: "jg-mini", text: "Se ganan leyendo: misiones, hallazgos y versos marcados «Leído». Nada se compra con dinero." }),
      h("span", { class: "ap-saldo", "aria-label": "Tienes " + fmt(P.dr) + " dracmas" }, ico("dracma"), h("b", { text: fmt(P.dr) }), " dr.")), pestanas, vitrina,
      // los objetos de uso (pergamino, descanso, cambio de apodo) van debajo de la vitrina: Auras, Mantos, Lauros y Sellos primero (BiEx, 13-nov-2026)
      h("h4", { class: "ap-uso-t", text: "Para usar" }), uso);
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
  async function pintarPoder(zona, y, suave) {
    // (12-nov-2026, P14 y adjunto 11: sin sobresalto al entrar al Árbol) lo traído al tocar su ícono se usa en el acto
    const habia = !!zona.querySelector(".cargando");
    const P = await cargarPoder(PODER && Date.now() - PODER.t < 20e3 ? false : true); if (!zona.isConnected) return;
    if (P.error) return zona.replaceChildren(tarjeta(null, null, h("p", { text: mensaje(P) })));
    // tras una compra o un cambio: datos frescos, puestos al día sin que el Árbol vuelva a entrar entero (BiEx, 15-nov-2026, 19:25:
    // «la pantalla se actualizó, un parpadeo sin sentido»): el árbol y la figura se conservan si no cambiaron, las tarjetas no
    // repiten su entrada y las cifras que cambian cuentan del valor anterior al nuevo
    const rehacer = () => { PODER = null; pintarPoder(zona, S.yo || y, true); };
    const yy = S.yo || y, av = P.av, pct = yy.xpSig ? Math.max(0, Math.min(100, (100 * yy.xpNivel) / yy.xpSig)) : 0;
    registrarPoder(yy, av);
    const datos = h("div", { class: "ap-datos" },
      h("p", { class: "ap-ap" }, h("b", { text: yy.apodo }), h("span", { text: yy.rangoNombre + " · nivel " + yy.nivel })),
      h("div", { class: "jg-barra ap-nivel-bar", role: "progressbar", "aria-valuemin": "0", "aria-valuemax": String(yy.xpSig), "aria-valuenow": String(yy.xpNivel), "aria-label": "Experiencia hacia el nivel siguiente" }, h("i", { style: "width:" + pct.toFixed(1) + "%" })),
      h("p", { class: "jg-mini ap-prog", text: fmt(yy.xpNivel) + " de " + fmt(yy.xpSig) + " para el nivel " + (yy.nivel + 1) + " · " + fmt(yy.xp) + " en total" }),
      h("ul", { class: "ap-cifras" },
        h("li", { class: "ap-cif-p" }, h("button", { class: "ap-cif-btn", type: "button", title: "Abrir la ventana del poder", "aria-label": "Poder " + fmt(av.poder) + ": abrir detalles y estadísticas", onclick: () => abrirVentanaPoder(yy, P) }, h("b", { text: fmt(av.poder) }), h("small", { text: "poder ›" }))),
        h("li", {}, h("b", { text: yy.fundador ? "n.º " + fmt(yy.n) : "—" }), h("small", { text: yy.fundador ? "Primicia" : "sin Primicia" })),
        h("li", { class: "ap-cif-dr" }, h("b", { text: fmt(P.dr) }), h("small", { text: "dracmas" })),
        h("li", {}, h("b", { text: String(av.pts) }), h("small", { text: av.pts === 1 ? "punto libre" : "puntos libres" })),
        h("li", { title: "Solo cuentan los versos que marcas: «Leído», el capítulo marcado o la prueba bien respondida" }, h("b", { text: fmt(yy.vc || 0) }), h("small", { text: "versos leídos" })),
        h("li", {}, h("b", { text: fmt((yy.invi && yy.invi.unidos) || 0) }), h("small", { text: "frutos de tu siembra" }))),
      tarjetaColeccion(yy, true),
      h("div", { class: "jg-acciones ap-foto" }, h("button", { class: "btn", type: "button", onclick: () => elegirFoto(rehacer) }, ico("persona"), h("span", { text: yy.foto ? "Cambiar mi imagen personalizada" : "Subir mi imagen personalizada" })),
        yy.foto ? h("button", { class: "btn", type: "button", onclick: async () => { const r = await accionPoder("/foto/quitar", {}, "Quitaste tu imagen personalizada"); if (r) rehacer(); } }, h("span", { text: "Quitar mi imagen personalizada" })) : null,
        yy.fotoOculta ? h("p", { class: "jg-mini", text: "Tu imagen personalizada está oculta mientras el equipo la revisa." }) : null));
    const frutos = (yy.invi && yy.invi.unidos) || 0, sigA = JSON.stringify([yy.inv, yy.nivel, av.poder | 0, yy.vt, yy.xpNivel, yy.xpSig, yy.emb, yy.foto, av.ef, av.fr, frutos]);
    const lienzoV = suave ? zona.querySelector(".ap-lienzo") : null, cifrasV = suave ? [...zona.querySelectorAll(".ap-cifras b")].map((b) => b.textContent) : null;
    FIG_PREV = suave ? zona.querySelector(".ser-in") : null;
    const lienzo = (lienzoV && lienzoV.dataset.sig === sigA) ? lienzoV : (CACHE_ARBOL.sig === sigA && CACHE_ARBOL.el && !CACHE_ARBOL.el.isConnected) ? CACHE_ARBOL.el : (CACHE_ARBOL = { sig: sigA, el: h("div", { class: "ap-lienzo", "data-sig": sigA }, arbolPoder(yy, av, frutos)) }).el;
    const heroe = h("section", { class: "ap-heroe" }, lienzo, datos);
    const tarjetas = [heroe, ...[tarjetaCosecha(yy, rehacer), tarjetaFruto(yy, P), tarjetaAvance(yy, P)].filter(Boolean), tarjetaAtributos(yy, P, rehacer), h("div", { class: "jg-dos ap-dos" }, tarjetaArmadura(yy, P, rehacer), tarjetaTienda(yy, P, rehacer))];
    FIG_PREV = null;
    if (suave) {
      // sin entrada de nuevo: se dan por vistas antes de ponerlas
      for (const t of tarjetas) { animados.add(t); for (const x of t.querySelectorAll(".jg-tarjeta, .jg-campana, .jg-heroe, .jg-barra>i, .jg-gen .b i, .jg-meta>i")) animados.add(x); }
      zona.replaceChildren(...tarjetas);
      const bs = [...zona.querySelectorAll(".ap-cifras b")];
      bs.forEach((b, i) => { const a = cifrasV[i], n = b.textContent, na = parseInt(String(a || "").replace(/\D/g, ""), 10), nn = parseInt(n.replace(/\D/g, ""), 10); if (a && a !== n && /^[\d.\s]+$/.test(a) && /^[\d.\s]+$/.test(n) && !isNaN(na) && !isNaN(nn)) contarDesde(b, na, nn, 800); });
      return;
    }
    zona.replaceChildren(...tarjetas);
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
    if (raiz) marco(cont, cabSub("Árbol de la siembra", "Cada persona que llegó con tu enlace y las que llegaron por ellas, generación tras generación: hasta dónde llegó lo que sembraste al compartir el Mensaje.", "#/escudrina/juntos"), zona);
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
      ficha.replaceChildren(h("p", { class: "jg-nombre" }, n.a, n.pa || n.re ? h("small", { class: "jg-pais", text: " · " + [n.re, n.pa ? nombrePais(n.pa) : ""].filter(Boolean).join(", ") }) : null),
        h("p", { class: "jg-mini", text: ordGen(n.k) + " generación" + (padre ? " · llegó por " + padre.a : "") + (n.f ? " · " + diaCorto(n.f) : "") + (n.nv ? " · nivel " + n.nv : "") + (n.pr ? " · Primicia" + (n.pn ? " n.º " + fmt(n.pn) : "") : "") }),
        h("p", { text: (n.ok ? "Confirmó su lugar." : "Todavía no confirma su lugar (lo hace al leer sus primeros 20 versos o al asegurar su cuenta).") + (n.h ? " Trajo a " + plural(n.h, "persona", "personas") + (n.d > n.h ? " y su rama ya suma " + fmt(n.d) : "") + "." : "") }),
        n.h ? h("a", { class: "btn chico", href: "#/escudrina/arbol/" + n.c }, ico("arbol"), h("span", { text: "Ver su rama" })) : null);
    };
    dib.addEventListener("click", (e) => { const g = e.target.closest && e.target.closest(".jg-nodo"); if (g) elegir(g.getAttribute("data-c")); });
    dib.addEventListener("keydown", (e) => { if (e.key !== "Enter" && e.key !== " ") return; const g = e.target.closest && e.target.closest(".jg-nodo"); if (g) { e.preventDefault(); elegir(g.getAttribute("data-c")); } });
    const lista = h("ol", { class: "jg-arbol-lista" }, r.nodos.map((n) => { const padre = n.p ? porC.get(n.p) : null; return h("li", { class: n.ok ? "ok" : "" },
      h("span", {}, h("b", { text: n.a }), h("small", { text: " · " + ordGen(n.k) + (padre ? " · por " + padre.a : "") }), h("span", { class: "jg-act", "data-c": n.c, "aria-live": "off" }), datosGen(n) ? h("small", { class: "jg-gen-dat", text: datosGen(n) }) : null),
      h("span", { class: "jg-mini", text: n.d ? fmt(n.d) + " en sus ramas" : "" })); }));
    const cuentaAct = h("p", { class: "jg-mini jg-act-t", "aria-live": "polite" });
    // compacta: las primeras 6 personas y el resto al tocar «Ver a todas»
    let verMas = null;
    if (r.nodos.length > 6) {
      lista.classList.add("plegada");
      verMas = h("button", { class: "btn chico jg-arbol-mas", type: "button", "aria-expanded": "false", onclick: () => { const ab = lista.classList.toggle("plegada"); verMas.setAttribute("aria-expanded", String(!ab)); verMas.querySelector("span").textContent = ab ? "Ver a todas (" + fmt(r.nodos.length) + ")" : "Ver menos"; } }, h("span", { text: "Ver a todas (" + fmt(r.nodos.length) + ")" }));
    }
    const tarjGen = tarjeta("Por generación", null, cuentaAct, lista, verMas, r.nodos.length < R0.d ? h("p", { class: "jg-mini", text: "Se muestran " + fmt(r.nodos.length) + " de " + fmt(R0.d) + " personas (hasta la " + ordGen(r.prof) + " generación). Toca una persona y abre su rama para ver más." }) : null);
    // «Las ramas» va primero y «Tu siembra» después (BiEx, 13-nov-2026)
    zona.replaceChildren(tarjeta("Las ramas", null, arbolVivo(dib, r), h("p", { class: "jg-mini", text: "● confirmó su lugar · ○ todavía no · +N: personas que se ven al abrir su rama · pellizca o usa + y − para acercarte" }), ficha),
      resumen, tarjGen);
    animarCifras(zona);
    // P21: qué hace ahora cada persona de tu árbol, en vivo mientras la sección está a la vista (sin filas leídas ni escritas)
    async function actividad() {
      const q = await pedir("/arbol/vivo?" + new URLSearchParams(raiz ? { raiz, prof: "3" } : { prof: "3" }));
      if (q.error || !lista.isConnected) return;
      const E = q.estados || {}; let ahora = 0;
      for (const el of lista.querySelectorAll(".jg-act")) {
        const x = E[el.getAttribute("data-c")], ya = !!x && x[1] < 150; if (ya) ahora++;
        el.classList.toggle("on", !!x); el.classList.toggle("ya", ya);
        el.textContent = !x ? "" : ya ? (x[0] ? "Leyendo " + nombreLC(x[0]) + " · ahora" : "Leyendo ahora") : "Hace " + Math.max(1, Math.round(x[1] / 60)) + " min" + (x[0] ? " · " + nombreLC(x[0]) : "");
      }
      for (const g of dib.querySelectorAll(".jg-nodo")) { const x = E[g.getAttribute("data-c")]; g.classList.toggle("activo", !!x && x[1] < 150); }
      cuentaAct.textContent = ahora ? plural(ahora, "persona de tu árbol lee", "personas de tu árbol leen") + " ahora mismo." : "Nadie de tu árbol lee en este momento; aquí lo verás en cuanto alguien empiece.";
    }
    actividad(); enVivo(tarjGen, 25e3, actividad);
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
    caja.addEventListener("wheel", (e) => { if (!e.ctrlKey && !e.metaKey) return; e.preventDefault(); acercar(e.deltaY < 0 ? 1.15 : 1 / 1.15); }, { passive: false });
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
  const enlaceVolver = (dest) => h("a", {
    class: "eyebrow",
    href: dest || "#/escudrina",
    text: "‹ Escudriña",
    onclick: (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button) return;
      if (A.volver) { e.preventDefault(); A.volver(dest || "#/escudrina"); }
    },
  });
  const cabSub = (t, sub, dest) => h("div", { class: "panel-cab" }, enlaceVolver(dest), h("h1", { class: "texto", text: t }), sub ? h("p", { class: "est-sub", text: sub }) : null);
  async function pintarPropuestas(cont) {
    document.title = "Propuestas de la comunidad · Escudriña · BiEx";
    const zona = h("div", {}, h("p", { class: "cargando", text: "Cargando…" }));
    marco(cont, cabSub("Propuestas de la comunidad", "Lo que la comunidad propone para Escudriña. Apoya las que quieres ver hechas realidad: las más apoyadas se estudian primero.", "#/escudrina/mas"),
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
    marco(cont, cabSub("Buzón del equipo", "Opiniones, errores y propuestas de la comunidad. Las propuestas marcadas «Pública» aparecen para votar.", "#/escudrina/mas"),
      tarjeta(null, null, h("div", { class: "jg-form" }, clave, h("button", { class: "btn", type: "button", onclick: () => { A.store.set("jg:admin", clave.value.trim()); abrirB(); } }, h("span", { text: "Abrir" })))), tarjeta(null, null, zona));
    abrirB();
  }

  // --- «Tu ciudad y tu hora» (P31, P28, X1; BiEx, 11 y 13-nov-2026): la ciudad la elige cada quien (la conexión puede ubicar
  // en otra: a BiEx lo ponía en Cali); se busca en cualquier idioma sobre datos/lugares.json (GeoNames, 30 480 ciudades con su
  // zona y su departamento o estado); la elegida se cambia una vez cada 2 meses; si nadie elige, se sigue asignando sola.
  let LUG = null;
  const normL = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  function lugares() {
    if (!LUG) LUG = (A.cargar ? A.cargar("datos/lugares.json") : fetch(PUBLICO + "/datos/lugares.json", { credentials: "omit" }).then((r) => r.json())).then((d) => {
      const paises = {}; for (const e of d.c) if (!paises[e[1]]) paises[e[1]] = normL(nombrePais(e[1]));
      d.ix = d.c.map((e) => [normL(e[0]), ...e.slice(4).map(normL)]); d.paises = paises; d.rnN = d.rn.map(normL); return d;
    }).catch((e) => { LUG = null; throw e; });
    return LUG;
  }
  // abreviatura de la zona, con el cambio de horario: EST/EDT, PST/PDT, CST, CET/CEST, GMT/BST; si no tiene, UTC−5
  function zonaCorta(tz, ms) {
    const parte = (loc) => { try { const x = new Intl.DateTimeFormat(loc, { timeZone: tz, timeZoneName: "short" }).formatToParts(ms || Date.now()).find((y) => y.type === "timeZoneName"); return x ? x.value : ""; } catch (e) { return ""; } };
    let z = /^(America|Pacific\/Honolulu)/.test(tz) ? parte("en-US") : /^(Europe|Atlantic\/(Canary|Madeira|Faroe))/.test(tz) ? parte("en-GB") : "";
    if (!z || /^GMT[+-]|^UTC/.test(z)) { const g = parte("en-GB"); z = g === "GMT" ? "UTC" : g.replace(/^GMT/, "UTC").replace("-", "−"); }
    return z;
  }
  const horaZona = (tz, ms) => { try { return new Date(ms || Date.now()).toLocaleTimeString("es", { timeZone: tz, hour: "numeric", minute: "2-digit" }); } catch (e) { return ""; } };
  function buscarLugares(d, q, max) {
    let [qc, qp] = q.split(","); qc = normL(qc); qp = normL(qp || "");
    if (qc.length < 2) return [];
    const res = [];
    for (let i = 0; i < d.c.length; i++) {
      const e = d.c[i], ns = d.ix[i]; let sc = 0;
      for (let k = 0; k < ns.length; k++) { const n = ns[k]; if (n === qc) { sc = Math.max(sc, k ? 3.4 : 4); break; } if (n.startsWith(qc)) sc = Math.max(sc, k ? 2.4 : 3); else if (sc < 1.4 && n.includes(" " + qc)) sc = 1.4; }
      const rN = d.r[i] >= 0 ? d.rnN[d.r[i]] : "", pN = d.paises[e[1]] || "";
      if (!sc && (rN.startsWith(qc) || pN.startsWith(qc))) sc = rN.startsWith(qc) ? 1.2 : 1;
      if (!sc) continue;
      if (qp && !(pN.startsWith(qp) || rN.startsWith(qp) || normL(e[1]) === qp)) continue;
      res.push([sc + Math.log10(1 + e[3]) / 10, i]);
    }
    return res.sort((a, b) => b[0] - a[0]).slice(0, max || 8).map((x) => x[1]);
  }
  function tarjetaLugar(compacta) {
    const caja = h("section", { class: "jg-tarjeta jg-lugar" });
    const pintar = () => {
      const y = S.yo || {}, l = y.lugar || {}, tz = y.tz || "America/Bogota", ahora = Date.now(), espera = (y.lugHasta || 0) > ahora;
      const reloj = h("b", { class: "lg-hora", text: horaZona(tz) + " · " + zonaCorta(tz) });
      const t = setInterval(() => { if (!reloj.isConnected) return clearInterval(t); reloj.textContent = horaZona(tz) + " · " + zonaCorta(tz); }, 30000);
      const panel = h("div", { class: "lg-panel", hidden: true });
      const boton = h("button", { class: "btn" + (l.manual ? "" : " oro"), type: "button", disabled: espera, onclick: () => { panel.hidden = !panel.hidden; boton.setAttribute("aria-expanded", String(!panel.hidden)); if (!panel.hidden) abrirBuscador(panel); } },
        A.svg('<path d="M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0 1 13 0c0 4.8-6.5 11-6.5 11z" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="12" cy="10" r="2.4" fill="currentColor"/>'),
        h("span", { text: l.manual ? "Cambiar mi ciudad" : "Elegir mi ciudad" }));
      boton.setAttribute("aria-expanded", "false");
      caja.replaceChildren(h("h2", {}, ico("mundo"), h("span", { text: "Tu ciudad y tu hora" })),
        h("div", { class: "lg-actual" }, h("span", { class: "jg-ciu", "aria-hidden": "true" }, A.svg('<path d="M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0 1 13 0c0 4.8-6.5 11-6.5 11z" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="12" cy="10" r="2.4" fill="currentColor"/>')),
          h("span", { class: "lg-n" }, h("b", { text: l.ciudad || "Sin ciudad todavía" }), h("small", { text: [l.region, l.pais ? nombrePais(l.pais) : ""].filter(Boolean).join(" · ") })), reloj),
        h("p", { class: "jg-mini", text: (l.manual ? "La elegiste tú." : "La asignó tu conexión: si no es la tuya, elígela.") + " Tus misiones y tu día cambian a medianoche de tu hora." + (compacta ? "" : " La ciudad se puede cambiar una vez cada 2 meses.") }),
        h("div", { class: "jg-acciones" }, boton), espera ? h("p", { class: "jg-mini", text: "Podrás cambiarla de nuevo el " + fechaDia(y.lugHasta) + "." }) : null, panel);
    };
    async function guardar(lugar) {
      const r = await pedir("/cuenta/preferencias", { metodo: "POST", cuerpo: { lugar } });
      if (r.error) { A.avisar(r.error === "lugar_espera" && r.hasta ? "Podrás cambiarla de nuevo el " + fechaDia(r.hasta) + "." : mensaje(r)); return; }
      actualizarYo(r.yo); A.avisar("Tu ciudad: " + lugar.ciudad); pintar();
    }
    async function elegir(lugar) {
      if (!(await confirmar("¿Guardar " + lugar.ciudad + " como tu ciudad?", (lugar.region ? lugar.region + " · " : "") + nombrePais(lugar.pais) + " · " + horaZona(lugar.tz) + " (" + zonaCorta(lugar.tz) + ")." + " Solo se puede cambiar una vez cada 2 meses.", "Guardar mi ciudad"))) return;
      guardar(lugar);
    }
    async function abrirBuscador(panel) {
      const entrada = h("input", { type: "search", class: "lg-q", placeholder: "Tu ciudad, región o país, en cualquier idioma", "aria-label": "Buscar tu ciudad", autocomplete: "off", enterkeyhint: "search" });
      const lista = h("ul", { class: "lg-res", role: "list" }), otra = h("div", { class: "lg-otra", hidden: true });
      const enlaceOtra = h("button", { class: "lg-link", type: "button", text: "¿No está tu ciudad?", onclick: () => { otra.hidden = !otra.hidden; if (!otra.hidden) formOtra(otra); } });
      panel.replaceChildren(entrada, lista, enlaceOtra, otra); entrada.focus({ preventScroll: true });
      let d; try { d = await lugares(); } catch (e) { lista.replaceChildren(h("li", { class: "jg-mini", text: "No se pudo cargar la lista de ciudades. Vuelve a intentarlo." })); return; }
      let tm = 0;
      const correr = () => {
        const ids = buscarLugares(d, entrada.value, 8), ms = Date.now();
        lista.replaceChildren(...(ids.length ? ids.map((i) => { const e = d.c[i], tz = d.z[e[2]], reg = d.r[i] >= 0 ? d.rn[d.r[i]] : "";
          return h("li", {}, h("button", { type: "button", class: "lg-op", onclick: () => elegir({ ciudad: e[0], pais: e[1], region: reg, tz }) },
            h("span", { class: "lg-n" }, h("b", { text: e[0] }), h("small", { text: [reg, nombrePais(e[1])].filter(Boolean).join(" · ") })),
            h("span", { class: "lg-z", text: horaZona(tz, ms) + " · " + zonaCorta(tz, ms) }))); })
          : normL(entrada.value).length >= 2 ? [h("li", { class: "jg-mini", text: "Sin resultados: prueba con otro nombre o usa «¿No está tu ciudad?»." })] : []));
      };
      entrada.addEventListener("input", () => { clearTimeout(tm); tm = setTimeout(correr, 140); });
    }
    async function formOtra(otra) {
      const d = await lugares().catch(() => null); if (!d) return;
      const paises = Object.keys(d.paises).sort((a, b) => nombrePais(a).localeCompare(nombrePais(b), "es"));
      const nom = h("input", { type: "text", placeholder: "Nombre de tu ciudad", "aria-label": "Nombre de tu ciudad", maxlength: 60, autocomplete: "address-level2" });
      const selP = h("select", { "aria-label": "País" }, h("option", { value: "", text: "País…" }), paises.map((p) => h("option", { value: p, text: nombrePais(p) })));
      const selR = h("select", { "aria-label": "Departamento o estado" }), selZ = h("select", { "aria-label": "Zona horaria" });
      const alPais = () => {
        const p = selP.value, regs = new Set(), zs = new Map();
        d.c.forEach((e, i) => { if (e[1] !== p) return; if (d.r[i] >= 0) regs.add(d.rn[d.r[i]]); zs.set(d.z[e[2]], (zs.get(d.z[e[2]]) || 0) + e[3]); });
        selR.replaceChildren(h("option", { value: "", text: p ? nombreRegion(p) + " (opcional)" : "Departamento o estado" }), ...[...regs].sort((a, b) => a.localeCompare(b, "es")).map((r) => h("option", { value: r, text: r })));
        selZ.replaceChildren(...[...zs].sort((a, b) => b[1] - a[1]).map(([z]) => h("option", { value: z, text: z.split("/").pop().replace(/_/g, " ") + " · " + horaZona(z) + " · " + zonaCorta(z) })));
      };
      selP.addEventListener("change", alPais);
      const y = S.yo || {}; if (y.lugar && y.lugar.pais) { selP.value = y.lugar.pais; alPais(); }
      otra.replaceChildren(h("p", { class: "jg-mini", text: "Escribe tu ciudad y elige su país y su zona horaria." }), nom, selP, selR, selZ,
        h("div", { class: "jg-acciones" }, h("button", { class: "btn oro", type: "button", onclick: () => {
          const ciudad = nom.value.replace(/\s+/g, " ").trim();
          if (ciudad.length < 2 || !selP.value || !selZ.value) { A.avisar("Escribe la ciudad y elige el país y la zona"); return; }
          elegir({ ciudad, pais: selP.value, region: selR.value, tz: selZ.value });
        } }, h("span", { text: "Usar esta ciudad" }))));
    }
    // si los datos de la cuenta llegan después (o cambian en otra pestaña), la tarjeta se pone al día, salvo mientras se busca
    const alYo = () => { if (!caja.isConnected) return document.removeEventListener("jg:yo", alYo); if (!caja.querySelector(".lg-panel:not([hidden])")) pintar(); };
    document.addEventListener("jg:yo", alYo);
    if (!S.yo || !S.yo.lugar) pedir("/yo").then((r) => { if (r && !r.error) actualizarYo(r.yo); });
    pintar();
    return caja;
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
    marco(cont, cabSub("Prestigio local", "Cada ciudad suma la experiencia de sus 12 mejores lectores: así una ciudad pequeña puede brillar tanto como una grande. Lee e invita a los tuyos para llevar a tu ciudad a lo más alto.", "#/escudrina/mundo"),
      tarjeta(null, null, seg([["pais", lugar.pais ? nombrePais(lugar.pais) : "Mi país"], ["mundo", "El mundo"]], "ambito"), seg([["semana", "Esta semana"], ["total", "Desde el comienzo"]], "periodo"),
        y.verCiudad === false ? h("p", { class: "jg-mini", text: "Ocultaste tu ciudad en tu perfil: tu lectura no suma a su prestigio." }) : null),
      tarjetaLugar(true), tarjeta(null, null, zona));
    cargarP();
    rehacerAlCambiarLugar(zona, lugar, () => pintarPrestigio(cont));
  }
  // (BiEx, 14-nov-2026) al elegir otra ciudad, toda la vista se pone al día en el acto (lista, país y fila propia), sin salir y volver
  const claveLugar = (l) => (l ? [l.pais, l.region, l.ciudad, l.zona || l.tz].map((x) => x || "").join("|") : "");
  function rehacerAlCambiarLugar(el, lugar, rehacer) {
    const k0 = claveLugar(lugar);
    const alYo = () => {
      if (!el.isConnected) return document.removeEventListener("jg:yo", alYo);
      if (claveLugar((S.yo || {}).lugar) === k0 || document.querySelector(".lg-panel:not([hidden])")) return;
      document.removeEventListener("jg:yo", alYo); rehacer();
    };
    document.addEventListener("jg:yo", alYo);
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
      const ambTxt = (r.lugar && lugarDe(q.ambito)) || (q.ambito === "mundo" ? "la clasificación mundial" : "tu clasificación");
      comprobarAdelantamientos("clas:" + q.ambito + ":" + q.periodo + ":" + r.rango, r.lista, ambTxt, "#/escudrina/clasificacion", r.yo);
      const titulo = h("p", { class: "jg-mini", text: (q.periodo === "semana" ? "Esta semana (" + textoSemana() + ")" : "Desde el comienzo") + " · " + RANGOS[r.rango] + " · " + ((r.lugar && lugarDe(q.ambito)) || (q.ambito === "mundo" ? "el mundo" : "sin datos de tu lugar")) });
      if (!r.lista.length) return zona.replaceChildren(titulo, h("p", { text: "Todavía nadie de este rango suma experiencia aquí. ¡Puedes ser la primera persona!" }));
      const fila = (x) => { const [l, c] = embDe(x.emb), ex = resumenStatsPub(x); return h("li", { class: "jg-fila" + (x.yo ? " yo" : "") }, h("span", { class: "p", text: String(x.p) }), emblema(l, c, x.marco, x.foto),
        h("span", { class: "n" }, nombreClicable(x.apodo), h("small", { text: "nivel " + x.nivel + (ex ? " · " + ex : "") + (x.n ? " · Primicia n.º " + x.n : "") + (q.ambito !== "ciudad" && x.ciudad ? " · " + x.ciudad : "") })), h("span", { class: "x", text: fmt(x.xp) })); };
      zona.replaceChildren(...[titulo, h("ol", { class: "jg-lista" }, r.lista.map(fila)),
        r.yo && !r.lista.some((x) => x.yo) ? h("p", { class: "jg-mini", text: "Tu puesto: " + fmt(r.yo.p) + " · " + fmt(r.yo.xp) + " de experiencia." }) : null].filter(Boolean));
    }
    function filaDe(x) { const [l, c] = embDe(x.emb), ex = resumenStatsPub(x); return h("li", { class: "jg-fila" + (x.yo ? " yo" : "") }, h("span", { class: "p", text: String(x.p) }), emblema(l, c, x.marco, x.foto),
      h("span", { class: "n" }, nombreClicable(x.apodo), h("small", { text: "nivel " + x.nivel + (ex ? " · " + ex : "") + (x.n ? " · Primicia n.º " + x.n : "") + (q.ambito !== "ciudad" && x.ciudad ? " · " + x.ciudad : "") })), h("span", { class: "x", text: fmt(x.xp) })); }
    async function cargarTodos() {
      // Opus (23-nov-2026): /clasificacion acepta rango=todos en una sola consulta con caché de borde
      const rAll = await pedir("/clasificacion?" + new URLSearchParams({ ambito: q.ambito, periodo: q.periodo, rango: "todos" }));
      if (q.rango !== -1) return;
      if (rAll && !rAll.error && Array.isArray(rAll.lista)) {
        const ambTxt = (rAll.lugar && lugarDe(q.ambito)) || (q.ambito === "mundo" ? "la clasificación general" : lugarDe(q.ambito) || "tu clasificación");
        comprobarAdelantamientos("clas:" + q.ambito + ":" + q.periodo + ":todos", rAll.lista, ambTxt, "#/escudrina/clasificacion", rAll.yo);
        const titulo = h("p", { class: "jg-mini", text: (q.periodo === "semana" ? "Esta semana (" + textoSemana() + ")" : "Desde el comienzo") + " · todos los rangos · " + ((rAll.lugar && lugarDe(q.ambito)) || (q.ambito === "mundo" ? "el mundo" : lugarDe(q.ambito) || "")) });
        if (!rAll.lista.length) return zona.replaceChildren(titulo, h("p", { text: "Todavía nadie suma experiencia aquí. ¡Puedes ser la primera persona!" }));
        return zona.replaceChildren(...[titulo, h("ol", { class: "jg-lista" }, rAll.lista.map(filaDe)),
          rAll.yo && !rAll.lista.some((x) => x.yo) ? h("p", { class: "jg-mini", text: "Tu puesto general: " + fmt(rAll.yo.p) + " · " + fmt(rAll.yo.xp) + " de experiencia." }) : null].filter(Boolean));
      }
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
        if (r.yo) {
          mia = { i, p: r.yo.p, xp: r.yo.xp, id };
          const ambTxt = (r.lugar && lugarDe(q.ambito)) || (q.ambito === "mundo" ? "la clasificación mundial" : "tu clasificación");
          comprobarAdelantamientos("clas:" + q.ambito + ":" + q.periodo + ":" + i, lista, ambTxt, "#/escudrina/clasificacion", r.yo);
        }
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
    marco(cont, h("div", { class: "panel-cab" }, enlaceVolver("#/escudrina/mundo"), h("h1", { class: "texto", text: "Clasificación" }),
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
    const estado = [v.llave ? plural(v.llave, "llave de acceso", "llaves de acceso") : null, v.google ? "Google" : null, v.facebook ? "vínculo anterior conservado" : null].filter(Boolean);
    const borrarIn = h("input", { type: "text", placeholder: "Escribe BORRAR", "aria-label": "Escribe BORRAR para confirmar", autocomplete: "off" });
    marco(cont, h("div", { class: "panel-cab" }, enlaceVolver("#/escudrina/mas"), h("h1", { class: "texto", text: "Cuenta" })),
      tarjetaApodo(false), tarjetaLugar(false),
      tarjeta("Emblema", null, h("div", { class: "jg-perfil" }, vista, h("p", { class: "jg-mini", text: "Elige una letra hebrea o griega y un color. Así te verán en las clasificaciones." })), letras, colores),
      tarjeta("Formas de entrar", ico("llave"), h("p", { text: estado.length ? "Tu avance está asegurado con: " + estado.join(", ") + "." : "Tu avance todavía depende solo de tu código." })),
      tarjetaAsegurar(true),
      tarjeta("Código de acceso", ico("codigo"), h("p", { text: "Si tu código anterior se pudo ver o lo perdiste, crea uno nuevo." }), h("button", { class: "btn", type: "button", onclick: codigoNuevo }, h("span", { text: "Crear un código nuevo" })), zonaCodigo),
      tarjeta("Preferencias", null, pref("verApodo", "Mostrar mi apodo", "En las clasificaciones, tu compañía y «quién está leyendo». Si lo ocultas, en su lugar se verá tu ciudad."),
        pref("verCiudad", "Mostrar mi ciudad en las clasificaciones", "Si la ocultas, sigues apareciendo en tu región, tu país, tu continente y el mundo."),
        pref("tranquilo", "Modo tranquilo", "Sin sonidos. Para menos movimiento, usa también «Sin animaciones» en la apariencia del lector."),
        (() => {
          let vMod = A.store.get("vib", "normal");
          const segV = h("div", { class: "jg-seg", role: "group", "aria-label": "Vibración de las recompensas" },
            [["normal", "Normal"], ["suave", "Suave"], ["no", "Desactivada"]].map(([k, t]) => h("button", { type: "button", "aria-pressed": String(vMod === k), onclick: (e) => {
              vMod = k; A.store.set("vib", k);
              for (const b of segV.children) b.setAttribute("aria-pressed", String(b === e.currentTarget));
              if (k !== "no") vibrar(k === "suave" ? 10 : [14, 30, 18]);
            } }, t)));
          return h("div", { class: "jg-vib-pref" },
            h("span", { class: "jg-vib-tit", text: "Vibración en recompensas" }),
            segV,
            h("p", { class: "jg-mini", text: "Permanece activa incluso en Modo tranquilo. En Android, el modo «No molestar» del teléfono puede silenciar los navegadores por seguridad del sistema: si quieres sentirla también así, permite tu navegador en Ajustes › No molestar › Aplicaciones." }));
        })()),
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
    const lc = lib && cap ? lib + "." + cap : "";
    if (!S.token || modo !== "l") {
      salir(!!(S.token && lc));
      if (S.token && lc) { SL.lcAct = lc; retomarSala(); if (SL.cod) setTimeout(() => posSala(true), 250); }
      return;
    }
    SL.lcAct = lc;
    estilos(); escuchar(); recuperarCola(); medidor(true);
    if (R.lib !== lib || R.cap !== cap) {
      soltar();
      Object.assign(R, { lib, cap, pal: [], hoy: "", acc: new Map(), accA: new Map(), pend: new Map(), hechos: new Set(), quiere: new Set(), prueba: false, dw: cargarDw(lib + "." + cap) });
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
  function salir(conservarCap) {
    guardarCola(true);
    soltar(); medidor(false);
    if (R.reloj) { clearInterval(R.reloj); R.reloj = 0; }
    if (!conservarCap) SL.lcAct = "";
    guardarDw(true);
    Object.assign(R, { lib: null, cap: 0, pal: [], acc: new Map(), accA: new Map(), pend: new Map(), hechos: new Set(), prueba: false, dw: new Map() });
    // fuera de los capítulos, lo pendiente sale pronto si no se ha enviado aún en esta lectura (mantiene la presencia al día)
    if (R.cola.length && S.token) setTimeout(() => { if (!R.lib && R.cola.length && (Date.now() - R.ultEnvio > CADA || R.tPres)) enviar(false); }, 1000);
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
    let el = null, hay = false; const Tv = topeBarras() + 20;
    for (const e of R.els) {
      const v = +e.id.slice(1);
      if (!R.vis.get(e) || R.hechos.has(v) || !valeLeer(v)) continue;
      // (14-nov-2026) un verso que solo asoma bajo las barras no se está leyendo: su tiempo no corre
      if (e.getBoundingClientRect().bottom < Tv) continue;
      hay = true;
      if (!R.pend.has(v)) { el = e; break; }
    }
    // tiempo de lectura activo (P20; salvaguarda X17, BiEx 13-nov-2026): solo suma el verso que está en la línea de lectura,
    // y cada verso tiene un tope (1,6 veces el tiempo que pide el capítulo para sus palabras). Así, dejar la vista abierta
    // sobre unos mismos versos no acumula tiempo para el resto del capítulo: el capítulo solo se habilita leyendo cada parte.
    if (el || hay) acumularLinea(dt);
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
  const msCap = () => (S.cfg && S.cfg.msCap) || 850;
  const topeDw = (v) => 1.6 * msCap() * (R.pal[v - 1] || 0);
  function acumularLinea(dt) {
    if (!R.dw) R.dw = new Map();
    const libre = (v) => !!v && !R.hechos.has(v) && !yaLeido(v) && valeLeer(v) && (R.dw.get(v) || 0) < topeDw(v);
    let destino = versoFranja();
    if (!libre(destino)) destino = alFinalPag() ? debajoFranja(libre) : 0; // al final ya no se puede bajar: el primero que falte
    if (!destino) return;
    const ya = R.dw.get(destino) || 0, add = Math.min(dt, topeDw(destino) - ya); if (add <= 0) return;
    R.dw.set(destino, ya + add);
    const lc = R.lib + "." + R.cap; R.tl[lc] = (R.tl[lc] || 0) + add;
    guardarDw();
  }
  function cargarDw(lc) {
    const o = A.store.get("jg:dw", null) || {}, x = o[lc];
    if (!x || !x.d || Date.now() - (x.t || 0) > 7 * 864e5) return new Map();
    return new Map(Object.entries(x.d).map(([v, ms]) => [+v, +ms || 0]));
  }
  function guardarDw(ya) {
    if (!R.lib || !R.dw) return;
    const ahora = Date.now(); if (!ya && ahora - (R.dwT || 0) < 5000) return; R.dwT = ahora;
    const o = A.store.get("jg:dw", null) || {}, lc = R.lib + "." + R.cap;
    for (const k of Object.keys(o)) if (ahora - (o[k].t || 0) > 7 * 864e5) delete o[k];
    if (R.dw.size) o[lc] = { t: ahora, d: Object.fromEntries([...R.dw].map(([v, ms]) => [v, Math.round(ms)])) }; else delete o[lc];
    A.store.set("jg:dw", o);
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
  // «Leído» (T3 + P20, BiEx, 11 y 12-nov-2026; Y4, 13-nov-2026). En la vista continua, un botón fijo abajo al centro (no
  // tapa la sala ni los saltos); en la vista por versos, al pie del verso. El resplandor va en el verso que se está leyendo:
  // el que ocupa la franja fija de lectura (versoFranja). Solo cuenta como leído lo marcado a mano: «Leído»,
  // el capítulo marcado con su tiempo de seguridad (0,85 s por palabra griega) o la prueba bien respondida. La
  // experiencia sigue llegando con el tiempo de lectura (30 %) y al marcar (70 %).
  const LB = { el: null, ah: null, v: 0, io: null, ioB: null, zona: new Set(), bajo: new Set(), ok: new Set(), t: 0 };
  const LD = LB; // (nombre anterior)
  const numeroDe = (el) => el && (el.querySelector(":scope > .vn") || el.querySelector(":scope > sup"));
  // AD2 (BiEx, 15-nov-2026, versión exacta): «jg:cf» guarda por capítulo cuántas veces se marcó cada verso (un carácter en
  // base 36, como en el servidor); la marca que se ve es la cuenta menos las lecturas completas (K): 1 sencilla, 2 o más doble
  const B36 = "0123456789abcdefghijklmnopqrstuvwxyz";
  const vecesCar = (ch) => { if (!ch || ch === "0") return 0; const i = B36.indexOf(ch); return i < 0 ? 1 : i; };
  const cfDe = (lc) => (A.store.get("jg:cf", null) || {})[lc] || "";
  const lecturasK = () => (S.yo && S.yo.lk && S.yo.lk.k) | 0;
  const vecesDe = (lc, v) => vecesCar(cfDe(lc)[v - 1]);
  const nivelMarca = (lc, v) => Math.max(0, Math.min(2, vecesDe(lc, v) - lecturasK()));
  // exacto: la cuenta del servidor (cns) manda; si llega solo 0/1 (cfs, lectores anteriores), se suma sin bajar ninguna cuenta
  function guardarCf(lc, s, exacto) {
    if (typeof s !== "string") return; const o = A.store.get("jg:cf", null) || {}; let x = s;
    if (!exacto) { const y = o[lc] || ""; x = ""; for (let i = 0; i < Math.max(s.length, y.length); i++) x += s[i] === "1" && vecesCar(y[i]) === 0 ? "1" : y[i] || "0"; }
    if (/[^0]/.test(x)) o[lc] = x; else delete o[lc]; A.store.set("jg:cf", o);
  }
  const guardarMarcas = (r) => { if (!r) return; if (r.cns) for (const [k, x] of Object.entries(r.cns)) guardarCf(k, x, true); else for (const [k, x] of Object.entries(r.cfs || {})) guardarCf(k, x); };
  const yaLeido = (v) => LB.ok.has(R.lib + "." + R.cap + "." + v);
  const marcadoAntes = (lc, v) => nivelMarca(lc, v) >= 1;
  const marcable = (v) => (R.pal[v - 1] || 0) > 0 && !yaLeido(v) && !R.quiere.has(v);
  function sellos() {
    for (const s of document.querySelectorAll(".jg-sello, .jg-ld")) s.remove();
    if (LB.io) { LB.io.disconnect(); LB.io = null; } if (LB.ioB) { LB.ioB.disconnect(); LB.ioB = null; } if (LB.ro) { LB.ro.disconnect(); LB.ro = null; }
    LB.vis = new Set();
    if (!S.token || !R.lib || !R.pal.length || !R.els.length || !("IntersectionObserver" in window)) { ponerLB(0); return; }
    const hoja = document.querySelector(".hoja"); if (!hoja) return;
    // cada fila reserva el lugar de su «Leído» desde que se dibuja (app.js lo pone ya al dibujar con sesión): nunca crece al leer
    hoja.classList.toggle("jg-pies", enFilaVista());
    LB.y0 = null; LB.pieV = 0; LB.pieY = null;
    if (!LB.el || !LB.el.isConnected) {
      LB.el = h("button", { type: "button", class: "jg-lb fuera", onclick: (ev) => { ev.stopPropagation(); tocarLB(); } },
        h("span", { class: "jg-lb-i", "aria-hidden": "true" }), h("span", { class: "jg-lb-t" }, h("b", { text: "Leído" }), h("small", { text: "" })));
      document.body.append(LB.el);
    }
    if (!LB.ah || LB.ah.parentElement !== hoja) { if (LB.ah) LB.ah.remove(); LB.ah = h("div", { class: "jg-ah", hidden: true, "aria-hidden": "true" }, h("i", { class: "f" }, h("i", { class: "fo" }), h("i", { class: "fa" })), h("i", { class: "n" }, h("i", { class: "no" }), h("i", { class: "na" }))); hoja.append(LB.ah); }
    // X15 y X16 (BiEx, 13-nov-2026): en la vista por versos, «Leído» va discreto al pie del verso; al terminar una perícopa
    // cuyos versos ya tienen su tiempo, se ofrece también marcarla entera. En la vista continua, el botón fijo de abajo y,
    // encima, el de la perícopa cuando su final está a la vista.
    if (!LB.pie || !hoja.contains(LB.pie)) {
      if (LB.pie) LB.pie.remove();
      LB.pie = h("div", { class: "jg-pie", hidden: true },
        h("button", { type: "button", class: "jg-pie-b jg-pie-p", hidden: true, onclick: (ev) => { ev.stopPropagation(); tocarPeri(ev.currentTarget); } }, h("span", { class: "jg-pie-i", "aria-hidden": "true" }), h("span", { class: "jg-pie-t" })),
        h("button", { type: "button", class: "jg-pie-b jg-pie-v", onclick: (ev) => { ev.stopPropagation(); tocarLB(ev.currentTarget); } }, h("span", { class: "jg-pie-i", "aria-hidden": "true" }), h("span", { class: "jg-pie-t", text: "Leído" }), h("small", { class: "jg-pie-n" })));
      for (const ev of ["pointerdown", "click", "keydown"]) LB.pie.addEventListener(ev, (e) => e.stopPropagation());
      hoja.append(LB.pie);
    }
    if (!LB.pb || !LB.pb.isConnected) {
      LB.pb = h("button", { type: "button", class: "jg-lbp fuera", onclick: (ev) => { ev.stopPropagation(); tocarPeri(LB.pb); } },
        h("span", { class: "jg-lb-i", "aria-hidden": "true" }), h("span", { class: "jg-lb-t" }, h("b", { text: "Perícopa leída" }), h("small", { text: "" })));
      document.body.append(LB.pb);
    }
    LB.ok = new Set([...LB.ok].filter((k) => k.startsWith(R.lib + "." + R.cap + ".")));
    pintarMarcados();
    // los versos a la vista (la franja fija de lectura los recorre: ver zonaLectura y versoFranja)
    LB.io = new IntersectionObserver((ents) => { for (const e of ents) { const v = +e.target.id.slice(1); if (e.isIntersecting) LB.vis.add(v); else LB.vis.delete(v); } pedirLB(); }, { threshold: 0 });
    for (const e of R.els) LB.io.observe(e);
    // si cambia la letra, la vista o el ancho, el hilo y el halo vuelven a su verso
    // si la hoja cambia de alto (letra, imágenes, ventana), el resplandor y el pie se vuelven a colocar eligiendo de nuevo
    // (antes se llamaba a ponerLB sin su verso de «Leído»: el pie se ocultaba y volvía a aparecer, un titileo)
    if ("ResizeObserver" in window) { LB.ro = new ResizeObserver(() => { LB.vnMet = null; LB.pieKey = ""; if (LB.v) { LB.forzar = true; pedirLB(); } }); LB.ro.observe(hoja); }
    // al detenerse el desplazamiento, y otra vez cuando las barras terminan de esconderse o volver (.42 s)
    if (!LB.scroll) {
      LB.scroll = true;
      addEventListener("scroll", () => { clearTimeout(LB.st); clearTimeout(LB.st2); LB.st = setTimeout(pedirLB, 110); LB.st2 = setTimeout(pedirLB, 650); }, { passive: true });
      addEventListener("resize", () => { LB.vnMet = null; LB.pieKey = ""; if (LB.v) { LB.forzar = true; pedirLB(); } }, { passive: true });
      if (window.visualViewport) visualViewport.addEventListener("resize", () => { LB.vnMet = null; LB.pieKey = ""; if (LB.v) { LB.forzar = true; pedirLB(); } }, { passive: true });
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
  const enFilaVista = () => !!(R.els && R.els.length && R.els[0].classList.contains("vl"));
  // la perícopa de un verso: en la vista por versos, de una fila con § a la siguiente; en la continua, su párrafo
  function periDe(v) {
    const el = document.getElementById("v" + v); if (!el) return null;
    let grupo;
    if (el.classList.contains("vl")) {
      const i = R.els.indexOf(el); if (i < 0) return null;
      let a = i; while (a > 0 && !R.els[a].classList.contains("p")) a--;
      let b = i; while (b + 1 < R.els.length && !R.els[b + 1].classList.contains("p")) b++;
      grupo = R.els.slice(a, b + 1);
    } else { const par = el.closest(".peri"); if (!par) return null; grupo = [...par.querySelectorAll(":scope > .vs")]; }
    const vs = grupo.map((e) => +e.id.slice(1)), marc = vs.filter((x) => marcable(x));
    return { a: vs[0], b: vs[vs.length - 1], vs, marc, fin: grupo[grupo.length - 1], ok: vs.length >= 2 && marc.length >= 2 && marc.every((x) => R.pend.has(x)) };
  }
  // Y4 (BiEx, 13-nov-2026, 18:26, con capturas): UNA franja fija en la pantalla decide el verso que se está leyendo, igual
  // en las dos vistas y sin depender de que las barras de arriba estén desplegadas o plegadas: del 32 % al 56 % del alto de
  // la ventana (en pantallas bajas, nunca bajo las barras). Manda el verso que ocupa más de la franja con sus palabras (el
  // área de sus renglones dentro de ella); para no titilar, el actual se conserva hasta que otro ocupe claramente más (20 %).
  // Ese verso lleva el resplandor, recibe el tiempo de lectura y es el que marca «Leído». Arriba del capítulo, mientras la
  // franja no llega a ningún verso, vale el primero a la vista; al final, cuando ya no se puede bajar, el primero sin marcar
  // que quedó debajo de la franja.
  const FRANJA = [0.32, 0.56]; // (anterior, ya no se usa: ver ZONA)
  // AC10 (BiEx, 15-nov-2026, con captura): la ZONA de activación es una banda fina y fija en la pantalla, como en su captura:
  // un renglón, más o menos del 38 % al 43 % del alto de la ventana; igual en las dos vistas y en cualquier dispositivo, sin
  // pelear con las barras que se pliegan y se despliegan. Manda el verso cuyo NÚMERO fue el último en tocar la zona (ya no el
  // que más palabras tiene en ella: así ningún verso corto, como YÔḥānā́n 1:2, se queda sin detectar); si hay dos números a la
  // vez en la zona, se ofrecen los dos. Mientras ningún número la toca, sigue el último; si ese ya no está a la vista, vale el
  // verso cuyo texto atraviesa la zona.
  const ZONA = [0.38, 0.43];
  // BiEx (13-nov-2026, 1 Τιmόdsεος 1): la franja no se mueve cuando las barras se pliegan o se despliegan: se mide con su
  // alto desplegado (offsetHeight no cambia con la transformación que las esconde), no con lo que se ve en ese instante
  function topeFijo() {
    let t = 0; const b = document.querySelector("header.barra"); if (b) t = b.offsetHeight;
    const bh = document.querySelector(".barra-hoja.bh-pegada"); if (bh) t += bh.offsetHeight;
    return t;
  }
  function zonaLectura() {
    const vh = innerHeight, T = topeFijo() + 8;
    let a = vh * ZONA[0], b = vh * ZONA[1];
    const x = R.els && R.els[0], lh = x ? parseFloat(getComputedStyle(x).lineHeight) : NaN;
    if (!isNaN(lh) && b - a < lh * 1.05) b = a + lh * 1.05; // al menos un renglón, con cualquier tamaño de letra
    if (a < T) { b += T - a; a = T; }
    return [a, Math.min(b, vh - 24)];
  }
  function enFranja(el, a, b) {
    let s = 0;
    for (const r of el.getClientRects()) { const o = Math.min(r.bottom, b) - Math.max(r.top, a); if (o > 0) s += o * r.width; }
    return s;
  }
  function versoFranja() {
    if (!R.els || !R.els.length) return 0;
    const [a, b] = zonaLectura(), vis = LB.vis && LB.vis.size ? LB.vis : null, dentro = [];
    let cruza = 0;
    for (const el of R.els) {
      const v = +el.id.slice(1); if (vis && !vis.has(v)) continue;
      const nr = rectNum(el); if (!nr.height) continue;
      if (nr.top >= b) break;
      cruza = v; // el último número que empieza antes del fin de la zona: su texto la atraviesa
      if (nr.bottom > a) dentro.push(v);
    }
    const antes = LB.zona || [];
    if (dentro.length) {
      const llega = dentro.filter((x) => !antes.includes(x)); // el último en tocarla es el que acaba de llegar
      R.vf = llega.length ? llega[llega.length - 1] : (dentro.includes(R.vf) ? R.vf : dentro[dentro.length - 1]);
      LB.zona = dentro; LB.dos = dentro.length > 1 ? dentro.slice() : null;
      return R.vf;
    }
    LB.zona = []; LB.dos = null;
    const sigue = R.vf && document.getElementById("v" + R.vf);
    if (sigue && (!vis || vis.has(R.vf))) { const r = sigue.getBoundingClientRect(); if (r.bottom > topeFijo() && r.top < innerHeight) return R.vf; }
    R.vf = cruza || +R.els[0].id.slice(1);
    return R.vf;
  }
  // al final del capítulo (ya no se puede bajar): el primero que cumpla «ok» entre los que quedaron debajo de la franja
  function debajoFranja(ok) {
    const [, b] = zonaLectura();
    for (const el of R.els) { const x = +el.id.slice(1), r = el.getBoundingClientRect(); if (r.top >= b - 4 && r.bottom <= innerHeight && ok(x)) return x; }
    return 0;
  }
  const alFinalPag = () => { const se = document.scrollingElement || document.documentElement; return se.scrollHeight - (scrollY + innerHeight) < 8; };
  // (BiEx, 14-nov-2026: versos cortos como YÔḥānā́n 11:35 o Yaʿăqṓḇ 1:8) el primero, de arriba hacia abajo, que ya cumplió su
  // tiempo y falta marcar, desde las barras hasta el final de la franja: recibe el «Leído» aunque otro verso más largo ocupe más
  // la franja. Así ningún verso corto se queda sin su «Leído», y se marca en el orden en que se lee.
  // (BiEx, 14-nov-2026, 05:25, con capturas: «queda casi siempre detrás de la franja superior») Dos papeles separados:
  //  · el RESPLANDOR (hilo y halo) va SIEMPRE en el verso de la franja fija de lectura (versoFranja): nunca salta a un verso
  //    tapado por las barras;
  //  · el «Leído» va en ese mismo verso cuando ya cumplió su tiempo; si no, en el primer verso de ARRIBA que ya lo cumplió y
  //    falta marcar, solo si se ve ENTERO bajo las barras tal como están en ese instante (versos cortos, AA5).
  function listoArriba(H) {
    const T = topeBarras() + 4, vis = LB.vis && LB.vis.size ? LB.vis : null;
    for (const el of R.els) {
      const v = +el.id.slice(1); if (H && v >= H) break; if (vis && !vis.has(v)) continue;
      if (!marcable(v) || !R.pend.has(v)) continue;
      const r = el.getBoundingClientRect(); if (!r.height || r.top < T || r.bottom > innerHeight - 6) continue;
      return v;
    }
    return 0;
  }
  const primeroListo = () => listoArriba(0); // (nombre anterior)
  function elegirLB() {
    if (!R.lib || !LB.vis) return ponerLB(0);
    let v = versoFranja();
    if (alFinalPag() && (!v || !marcable(v))) { const d = debajoFranja(marcable); if (d) v = d; }
    const H = v && marcable(v) ? v : 0;
    const m = H && R.pend.has(H) ? H : (listoArriba(H || v) || H);
    const dos = LB.dos && LB.dos.includes(v) ? LB.dos.filter((x) => marcable(x)) : null;
    const f = !!LB.forzar; LB.forzar = false;
    // AC10: el resplandor no desaparece en un verso ya marcado: se queda, en otro tono (.jg-ah.marcado)
    ponerLB(v, f, m, dos && dos.length > 1 ? dos : null);
  }
  function numeroVisible(v, T, B) { const el = document.getElementById("v" + v); if (!el) return false; const nr = rectNum(el); return nr.height > 0 && nr.top >= T && nr.bottom <= B; }
  // la caja de las cifras del número (la celda del número ocupa todo el alto del verso en la vista por fila)
  function rectNum(el) {
    const num = numeroDe(el); if (!num) return el.getBoundingClientRect();
    const tn = [...num.childNodes].reverse().find((x) => x.nodeType === 3); if (!tn) return num.getBoundingClientRect();
    const rg = document.createRange(); rg.selectNodeContents(tn); return rg.getBoundingClientRect();
  }
  // v: el verso que se está leyendo (resplandor); m: el verso al que va el «Leído» (el mismo, o uno corto de arriba ya listo)
  function ponerLB(v, forzar, m, dos) {
    if (!LB.el) return;
    LB.modal = document.documentElement.classList.contains("con-modal");
    if (!v || LB.modal) { const habia = LB.v; LB.v = 0; LB.m = 0; LB.mm = []; LB.clave = ""; LB.el.classList.add("fuera"); LB.el.tabIndex = -1; if (LB.ah) LB.ah.hidden = true; if (LB.pie) LB.pie.hidden = true; if (LB.pb) { LB.pb.classList.add("fuera"); LB.pb.tabIndex = -1; } document.documentElement.classList.remove("jg-con-lb"); quitarMeta(); if (habia && !LB.modal && R.lib) document.dispatchEvent(new CustomEvent("biex:verso-activo", { detail: { c: R.lib, cap: R.cap, v: 0 } })); return; }
    const el = document.getElementById("v" + v); if (!el) return;
    m = m || 0;
    // m: el verso al que va el «Leído» (0 = nada que marcar); dos: los dos versos que tocan la zona a la vez
    const mm = dos && dos.length > 1 ? dos : m ? [m] : [], elm = (m && document.getElementById("v" + (dos ? dos[dos.length - 1] : m))) || el;
    const clave = mm.join(","), listo = mm.length > 0 && mm.every((x) => R.pend.has(x));
    const cambioV = LB.v !== v, nuevo = cambioV || LB.clave !== clave;
    if (LB.ah) LB.ah.classList.toggle("marcado", !marcable(v));
    if (!nuevo && !forzar && (!mm.length || !LB.el.classList.contains("fuera") || (LB.pie && !LB.pie.hidden))) { LB.el.classList.toggle("espera", !listo); if (LB.pie) LB.pie.classList.toggle("espera", !listo); halo(el); return; }
    const lc = R.lib + "." + R.cap, rep = m ? marcadoAntes(lc, m) : false;
    const fila = el.classList.contains("vl"), pe = periDe(v);
    if (fila && mm.length) { ponerPie(elm, m, pe, rep, dos); }
    else if (LB.pie) LB.pie.hidden = true;
    const sp = document.querySelector(".jg-sala-p"), alza = sp ? Math.round(sp.offsetHeight + 10) + "px" : "0px";
    if (LB.pb) {
      // vista continua: la perícopa entera, cuando su final se ve y todos sus versos por marcar ya tienen su tiempo
      let ver = false;
      if (!fila && pe && pe.ok) { const rf = pe.fin.getBoundingClientRect(), T = topeFijo(); ver = rf.bottom > T + 20 && rf.bottom < innerHeight - 70; }
      LB.pb.classList.toggle("fuera", !ver); LB.pb.tabIndex = ver ? 0 : -1;
      if (ver) { LB.pb.querySelector("small").textContent = "versos " + pe.a + "–" + pe.b; LB.pb.setAttribute("aria-label", "Marcar como leída la perícopa, versos " + pe.a + " a " + pe.b); LB.pb.style.setProperty("--jg-lb-alza", alza); }
    }
    if (nuevo) {
      LB.v = v; LB.m = m; LB.mm = mm; LB.clave = clave; LB.el.classList.remove("hecho");
      const et = rep ? "Repasado" : "Leído";
      LB.el.querySelector("b").textContent = et;
      LB.el.querySelector("small").textContent = dos ? "versos " + dos.join(" y ") : m ? "verso " + m : "";
      LB.el.setAttribute("aria-label", et + ": marcar " + (dos ? "los versos " + dos.join(" y ") + " como leídos" : "el verso " + m + " como leído"));
      if (cambioV && R.lib) document.dispatchEvent(new CustomEvent("biex:verso-activo", { detail: { c: R.lib, cap: R.cap, v } }));
    }
    LB.el.classList.toggle("espera", !listo);
    const hoja = LB.ah && LB.ah.parentElement;
    // (15-nov-2026 + Neon 23-nov-2026, fluidez) todas las lecturas de geometría antes de escribir estilos o clases: evita
    // reflujos síncronos en la vista verso por fila y guarda las métricas estables del número (.vn)
    let rh = null, r = null, fx = 0, y0 = 0, y1 = 0;
    const num = numeroDe(el), enFila = el.classList.contains("vl");
    if (hoja) {
      rh = hoja.getBoundingClientRect();
      const r0 = el.getBoundingClientRect(), e1 = dos && document.getElementById("v" + dos[0]), e2 = dos && document.getElementById("v" + dos[dos.length - 1]);
      r = e1 && e2 ? { top: Math.min(e1.getBoundingClientRect().top, r0.top), bottom: Math.max(e2.getBoundingClientRect().bottom, r0.bottom) } : r0;
      if (enFila && num) {
        const nr = num.getBoundingClientRect();
        if (!LB.vnMet) { const cs = getComputedStyle(num), ra = parseFloat(getComputedStyle(num, "::after").right); LB.vnMet = { ra: isNaN(ra) ? -8 : ra, fs: parseFloat(cs.fontSize) || 18 }; }
        fx = nr.right - LB.vnMet.ra - 1.5; y0 = nr.top + 0.55 * LB.vnMet.fs; y1 = r.bottom - 8;
      } else {
        const cont = el.closest(".lectura, .continuo") || el.parentElement, rc = cont.getBoundingClientRect();
        if (!LB.plCont) LB.plCont = parseFloat(getComputedStyle(cont).paddingLeft) || 12;
        fx = rc.left + Math.max(4, Math.min(LB.plCont / 2, 22)); y0 = r.top + 3; y1 = r.bottom - 3;
      }
    }
    if (LB.el.style.getPropertyValue("--jg-lb-alza") !== alza) LB.el.style.setProperty("--jg-lb-alza", alza);
    if (fila || !mm.length) { LB.el.classList.add("fuera"); LB.el.tabIndex = -1; }
    else if (LB.el.classList.contains("fuera")) { LB.el.classList.remove("fuera"); LB.el.tabIndex = 0; }
    document.documentElement.classList.toggle("jg-con-lb", !LB.el.classList.contains("fuera") || !!(LB.pb && !LB.pb.classList.contains("fuera")));
    if (!hoja) return;
    const f = LB.ah.firstChild, antes = LB.ah.hidden, ty = y0 - rh.top;
    const salto = antes || LB.y0 == null || Math.abs(ty - LB.y0) > innerHeight * 0.9;
    LB.y0 = ty;
    LB.ah.classList.toggle("sin-t", salto);
    const tf = "translate3d(" + (fx - rh.left).toFixed(1) + "px," + ty.toFixed(1) + "px,0) scaleY(" + (Math.max(18, y1 - y0) / 100).toFixed(4) + ")";
    if (f.style.transform !== tf) f.style.transform = tf;
    if (LB.meta !== num) { quitarMeta(); if (num) { num.classList.add("jg-meta"); LB.meta = num; } }
    halo(el, rh);
    if (antes) { LB.ah.hidden = false; if (LB.ah.animate && document.documentElement.getAttribute("data-mov") !== "no") LB.ah.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 280, easing: "ease-out" }); }
  }
  function quitarMeta() { if (LB.meta) { LB.meta.classList.remove("jg-meta"); LB.meta = null; } }
  // al pie del verso, a la derecha de su texto (15-nov-2026, fluidez: «micro sobresaltos» y «la luz titila»). Antes el pie se
  // metía en la fila y la hacía crecer cuando no cabía: los versos de abajo se movían y se volvía a calcular el diseño de todo el
  // capítulo en cada cambio. Ahora vive en la capa de la hoja (como el resplandor) y se coloca con una transformación: al final
  // del último renglón si cabe; si no, justo debajo, en la franja que cada fila ya reserva para él desde que se dibuja
  // (.hoja.jg-pies). Dentro de su verso siempre; al pasar al siguiente se desliza.
  function ponerPie(el, v, pe, rep, dos) {
    const P = LB.pie, hoja = P && P.parentElement; if (!hoja) return;
    // medidas primero
    const rb = el.getBoundingClientRect(), T = topeFijo();
    // el verso largo se sigue leyendo: su «Leído» aparece cuando su pie ya está a la vista
    if (rb.bottom > innerHeight - 8 || rb.bottom < T + 18) { if (!P.hidden) P.hidden = true; LB.pieV = 0; return; }
    const rh = hoja.getBoundingClientRect();
    // a la derecha del texto; si los saltos rápidos flotan sobre ese borde derecho (sin desplazarlo al hacer zoom táctil), a su izquierda
    let der = 10; const sr = document.querySelector(".saltos-rap");
    if (sr && sr.classList.contains("vis") && sr.offsetHeight) {
      const q = sr.getBoundingClientRect();
      if (q.width && q.left > rh.left + rh.width * 0.5 && q.left < rb.right - 10) der = Math.max(10, Math.min(72, Math.round(rb.right - q.left + 8)));
    }
    // el último renglón real del texto (las cajas de cada renglón, no la del bloque entero)
    // (solo las últimas piezas del texto: el último renglón está en ellas, y medir el verso entero costaba en los versos largos)
    const vt = el.querySelector(":scope > .vt") || el, vtRect = vt.getBoundingClientRect(), rg = document.createRange(), hijos = vt.childNodes;
    if (hijos.length > 14) { rg.setStartBefore(hijos[hijos.length - 14]); rg.setEndAfter(hijos[hijos.length - 1]); } else rg.selectNodeContents(vt);
    const rs = [...rg.getClientRects()].filter((q) => q.width > 0.5 && q.height > 1), fondo = rs.reduce((m, q) => Math.max(m, q.bottom), -1e9);
    const enUlt = rs.filter((q) => q.bottom > fondo - 4), ult = enUlt.length ? { top: Math.min(...enUlt.map((q) => q.top)), bottom: fondo, right: Math.max(...enUlt.map((q) => q.right)), height: fondo - Math.min(...enUlt.map((q) => q.top)) } : rb;
    // después, textos y estado (cambian solo dentro de la capa del pie)
    const conPeri = !!(pe && pe.ok && v === pe.b);
    const bp = P.querySelector(".jg-pie-p"); if (bp.hidden === conPeri) bp.hidden = !conPeri;
    const tp = conPeri ? "Perícopa " + pe.a + "–" + pe.b : "";
    if (conPeri) { const bpt = bp.querySelector(".jg-pie-t"); if (bpt.textContent !== tp) bpt.textContent = tp; bp.setAttribute("aria-label", "Marcar como leída la perícopa, versos " + pe.a + " a " + pe.b); }
    const bv = P.querySelector(".jg-pie-v"), et = rep ? "Repasado" : "Leído", nn = dos ? dos.join(" y ") : String(v);
    const bvt = bv.querySelector(".jg-pie-t"), bvn = bv.querySelector(".jg-pie-n");
    if (bvt.textContent !== et) bvt.textContent = et;
    if (bvn.textContent !== nn) bvn.textContent = nn;
    bv.setAttribute("aria-label", et + ": marcar " + (dos ? "los versos " + dos.join(" y ") + " como leídos" : "el verso " + v + " como leído"));
    const espera = !(dos || [v]).every((x) => R.pend.has(x));
    P.classList.toggle("espera", espera); P.classList.remove("hecho-v", "hecho-p");
    const vuelve = P.hidden; if (vuelve) P.hidden = false;
    // Neon (23-nov-2026): guardar el ancho/alto del pie por su contenido para evitar un reflujo síncrono en cada cambio de verso
    const pKey = (conPeri ? "p:" + tp.length : "v") + ":" + et + ":" + nn.length;
    if (LB.pieKey !== pKey || !LB.pieW) { LB.pieW = P.offsetWidth || 90; LB.pieH = P.offsetHeight || 18; LB.pieKey = pKey; }
    const pw = LB.pieW, ph = LB.pieH, cabe = rb.right - der - ult.right >= pw + 12;
    const minX = Math.max(8, vtRect.left - rh.left), maxX = Math.max(minX, Math.min(rb.right, rh.right) - rh.left - pw - 6);
    const x = Math.max(minX, Math.min(maxX, rb.right - der - pw - rh.left));
    const y = (cabe ? ult.top + (ult.height - ph) / 2 : ult.bottom + 3) - rh.top;
    P.classList.toggle("jg-pie-quieto", vuelve || !LB.pieV || LB.pieY == null || Math.abs(y - LB.pieY) > innerHeight * 0.9);
    const t = "translate3d(" + x.toFixed(1) + "px," + y.toFixed(1) + "px,0)";
    if (P.style.transform !== t) P.style.transform = t;
    if (vuelve && P.animate && document.documentElement.getAttribute("data-mov") !== "no") P.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: "ease-out" });
    LB.pieV = v; LB.pieY = y;
  }
  function tocarPeri(desde) {
    const pe = LB.v && periDe(LB.v); if (!pe || !pe.ok || !R.lib) return;
    vibrar([12, 30, 16, 30, 20]); sonar("chispa");
    for (const x of pe.marc) tocarLeido(x, null, true);
    if (desde) chispas(16, desde, ["aro", "polvo"]);
    A.avisar("Perícopa " + pe.a + "–" + pe.b + ": " + plural(pe.marc.length, "verso marcado", "versos marcados") + " como leídos.");
    if (LB.pie) LB.pie.classList.add("hecho-p");
    clearTimeout(LB.t); LB.t = setTimeout(() => { if (LB.pie) LB.pie.classList.remove("hecho-p", "hecho-v"); LB.v = 0; elegirLB(); }, 480);
  }
  // el halo detrás de las cifras del número (sin el § de la perícopa); solo si el número se ve (nunca medio tapado por las barras).
  // Tamaño fijo (40 px) estirado con scale: se mueve y se ajusta solo con transformaciones (15-nov-2026, fluidez)
  function halo(el, rh0) {
    const n = LB.ah && LB.ah.lastChild, hoja = LB.ah && LB.ah.parentElement, num = numeroDe(el); if (!n || !hoja) return;
    if (!num) { n.classList.add("oculto"); return; }
    const tn = [...num.childNodes].reverse().find((x) => x.nodeType === 3), rg = document.createRange(); rg.selectNodeContents(tn || num);
    const r = rg.getBoundingClientRect(), rh = rh0 || hoja.getBoundingClientRect(), T = topeFijo();
    if (!r.width || r.top < T + 2) { n.classList.add("oculto"); return; }
    const w = Math.max(30, r.width + 24), hh = Math.max(28, r.height + 16);
    const t = "translate3d(" + (r.left + r.width / 2 - w / 2 - rh.left).toFixed(1) + "px," + (r.top + r.height / 2 - hh / 2 - rh.top).toFixed(1) + "px,0) scale(" + (w / 40).toFixed(3) + "," + (hh / 40).toFixed(3) + ")";
    if (n.style.transform !== t) n.style.transform = t;
    n.classList.remove("oculto");
  }
  function tocarLB(desde) {
    const vs = LB.mm && LB.mm.length ? LB.mm : LB.m ? [LB.m] : []; if (!vs.length || !R.lib) return;
    const b = desde || LB.el;
    vs.forEach((x, k) => tocarLeido(x, k ? null : b, k > 0));
    LB.el.classList.add("hecho"); if (LB.pie) LB.pie.classList.add("hecho-v");
    clearTimeout(LB.t); LB.t = setTimeout(() => { if (LB.el) LB.el.classList.remove("hecho"); if (LB.pie) LB.pie.classList.remove("hecho-v", "hecho-p"); LB.v = 0; LB.m = 0; elegirLB(); }, 480);
  }
  // los versos ya marcados (en este u otro dispositivo) llevan su número en oro
  function pintarMarcados() {
    if (!R.lib) return;
    const lc = R.lib + "." + R.cap, cf = cfDe(lc);
    for (const el of R.els) {
      const v = +el.id.slice(1), num = numeroDe(el); if (!num) continue;
      num.classList.toggle("jg-leido", vecesCar(cf[v - 1]) > lecturasK() || yaLeido(v) || (lecturasK() === 0 && !!(A.leido && A.leido(R.lib, R.cap, v))));
      num.classList.toggle("jg-repaso", esRepaso(R.lib, R.cap, v));
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
    if (num) { num.classList.remove("jg-quiere"); num.classList.add("jg-leido"); num.classList.toggle("jg-repaso", esRepaso(R.lib, R.cap, v)); }
    if (A.marcarLeido) A.marcarLeido(R.lib, R.cap, [v]);
    const cf = cfDe(lc); guardarCf(lc, pon(cf, v - 1, B36[Math.min(35, vecesCar(cf[v - 1]) + 1)]), true);
  }
  // AA9 (BiEx, 14-nov-2026): los versos repasados (ya marcados otro día y marcados de nuevo) llevan una marca doble
  const diaRep = () => new Date().toISOString().slice(0, 10);
  const repasos = () => { const o = A.store.get("jg:rep", null); return o && o.f === diaRep() && Array.isArray(o.k) ? o.k : []; };
  // AC10 (BiEx, 15-nov-2026): la marca doble de un verso releído (otro día) se conserva siempre, no solo el día del repaso:
  // «jg:rp» guarda por capítulo qué versos se repasaron alguna vez (como «jg:cf»); «jg:rep» sigue siendo lo de hoy
  const rpDe = (lc) => (A.store.get("jg:rp", null) || {})[lc] || "";
  const esRepaso = (lib, cap, v) => nivelMarca(lib + "." + cap, v) >= 2 || (lecturasK() === 0 && (rpDe(lib + "." + cap)[v - 1] === "1" || repasos().includes(lib + "." + cap + "." + v)));
  function anotarRepaso(v) {
    const lc = R.lib + "." + R.cap, k = lc + "." + v, l = repasos(); if (!l.includes(k)) { l.push(k); A.store.set("jg:rep", { f: diaRep(), k: l.slice(-600) }); }
    const o = A.store.get("jg:rp", null) || {}, x = o[lc] || ""; if (x[v - 1] !== "1") { o[lc] = pon(x, v - 1, "1"); A.store.set("jg:rp", o); }
  }
  let tAvisoEsp = 0;
  function tocarLeido(v, boton, quieto) {
    if (!v || !R.lib || yaLeido(v) || R.quiere.has(v)) return;
    const esRep = marcadoAntes(R.lib + "." + R.cap, v);
    if (esRep) anotarRepaso(v);
    if (!quieto) { vibrar([12, 30, 16]); sonar("chispa"); }
    const p = R.pend.get(v);
    if (p) { R.pend.delete(v); guardarPend(); R.hechos.add(v); acreditar(R.lib, R.cap, v, p[0], 3, true); marcarLeidoV(v); if (tocaPremio()) enviar(false); }
    else { R.quiere.add(v); const num = numeroDe(document.getElementById("v" + v)); if (num) num.classList.add("jg-quiere"); } // cuenta completo al cumplir su tiempo
    if (boton) chispas(10, boton, Math.random() < 0.5 ? ["polvo"] : ["aro"]);
    if (quieto) { /* la perícopa avisa una sola vez */ }
    else if (!p && Date.now() - tAvisoEsp > 18000) {
      tAvisoEsp = Date.now();
      A.store.set("jg:leidoEsp", 1);
      A.avisar(esRep ? "Repásalo con calma unos segundos: contará como repasado al cumplir su tiempo." : "Léelo con calma unos segundos: contará como leído al cumplir su tiempo.");
    }
    else if (p && !A.store.get("jg:leidoOk2", 0)) { A.store.set("jg:leidoOk2", 1); A.avisar("«Leído»: solo cuentan como leídos los versos que marcas. Márcalo cuando de verdad lo leíste."); }
    finCapJuego();
  }
  function estadoSellos(v) {
    // un verso que acaba de cumplir su tiempo puede ser el del «Leído» (el que se lee o uno corto de arriba): se vuelve a elegir
    if (LB.el && LB.v) { LB.forzar = true; pedirLB(); }
    finCapJuego();
  }
  // AF29 (BiEx, 21-nov-2026): el capítulo cuenta como leído solo si quien lee lo marca, y el botón del final se habilita únicamente
  // cuando todas sus perícopas ya se marcaron a mano (cada verso con su marca de esta lectura o de hoy) y su tiempo de lectura
  // activo alcanza 0,85 s por palabra griega. Si no se habilita, la nota dice por qué.
  let tFin = 0;
  const selladoHoy = (lc) => !!(S.yo && S.yo.hoy && Array.isArray(S.yo.hoy.ccL) && S.yo.hoy.ccL.includes(lc));
  function estadoCap() {
    const lc = R.lib + "." + R.cap, cf = cfDe(lc), ms = (S.cfg && S.cfg.msCap) || 850, K = lecturasK();
    let total = 0, pal = 0, hechos = 0;
    for (let i = 0; i < R.pal.length; i++) {
      const w = R.pal[i] || 0, v = i + 1; if (!w) continue; total++; pal += w;
      if (vecesCar(cf[i]) > K || yaLeido(v)) hechos++;
    }
    const t = (R.tlc[lc] || 0) + (R.tl[lc] || 0), req = Math.round(pal * ms), falta = Math.max(0, total - hechos);
    return { total, hechos, falta, pal, t, req, sellado: selladoHoy(lc), listo: total > 0 && !falta && t >= req && !selladoHoy(lc) };
  }
  function finCapJuego() {
    clearTimeout(tFin); tFin = setTimeout(pintarFinCap, 120);
  }
  function pintarFinCap() {
    const caja = document.querySelector(".hoja .fin-leido");
    if (!caja || !S.token || !R.lib || !R.pal.length) return;
    const E = estadoCap(), lc = R.lib + "." + R.cap;
    let firma;
    if (E.sellado) firma = "hecho";
    else if (E.listo) firma = "listo";
    else firma = "falta:" + E.falta + ":" + Math.ceil(Math.max(0, E.req - E.t) / 60000) + ":" + E.pal;
    if (caja.dataset.jg === firma) return;
    caja.dataset.jg = firma; caja.classList.add("jg-fin"); caja.classList.toggle("hecho", firma === "hecho");
    if (firma === "hecho") { caja._fin = null; return caja.replaceChildren(A.svg(ICO_JG.marca || ICO_JG.llama, "0 0 24 24"), h("span", { text: "Capítulo leído" })); }
    // (15-nov-2026, fluidez) mientras se lee, la cuenta de lo que falta cambia a menudo: se actualizan los textos en su sitio, sin
    // volver a crear el botón (cada vez que se rehacía, se recalculaba el estilo de toda la página)
    let F = caja._fin && caja.contains(caja._fin.btn) ? caja._fin : null;
    if (!F) {
      const btn = h("button", { class: "btn chico", type: "button", onclick: () => marcarCapitulo(btn) }, h("span"));
      F = caja._fin = { btn, t: btn.firstChild, nota: h("p", { class: "jg-mini jg-fin-n" }) };
      caja.replaceChildren(btn, F.nota);
    }
    F.btn.classList.toggle("oro", !!E.listo); F.btn.disabled = !E.listo;
    const tb = "Marcar el capítulo como leído"; if (F.t.textContent !== tb) F.t.textContent = tb;
    let nota;
    if (E.listo) nota = "Todas sus perícopas ya están marcadas a mano: márcalo como leído.";
    else if (E.falta > 0) nota = "Se habilita cuando marques a mano todas sus perícopas (con el botón de cada perícopa o con «Leído» en cada verso): " + (E.falta === 1 ? "falta 1 verso" : "faltan " + E.falta + " versos") + " por marcar.";
    else nota = "Ya marcaste sus perícopas; se habilita con unos " + plural(Math.max(1, Math.ceil((E.req - E.t) / 60000)), "minuto", "minutos") + " más de lectura en este capítulo (0,85 s por palabra griega).";
    if (F.nota.textContent !== nota) F.nota.textContent = nota;
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
      A.avisar(r.error === "pericopas" ? "Primero marca a mano todas sus perícopas: " + (r.faltan === 1 ? "falta 1 verso" : "faltan " + plural(r.faltan || 1, "verso", "versos")) + " por marcar."
        : r.error === "ya_sellado" ? "Este capítulo ya quedó marcado como leído hoy."
        : r.error === "faltan" ? "Aún faltan " + plural(r.faltan || 1, "verso", "versos") + " por leer con calma en este capítulo."
        : r.error === "tiempo" ? "Aún falta un poco de lectura en este capítulo (0,85 s por palabra griega)."
        : r.error === "nada" ? "No hay versos leídos con su tiempo por marcar en este capítulo." : mensaje(r));
      const c = document.querySelector(".hoja .fin-leido"); if (c) delete c.dataset.jg; finCapJuego();
      return;
    }
    for (const v of r.cf || []) { R.pend.delete(v); R.hechos.add(v); marcarLeidoV(v); }
    guardarPend();
    guardarMarcas(r);
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
    const fresco = !R.ultEnvio || Date.now() - R.ultEnvio > 120e3;
    R.cola.push([lib, cap, v, ms, a == null ? 1 : a]);
    if (!R.ultEnvio) R.ultEnvio = Date.now();
    guardarCola(false);
    const antes = R.pred ? R.pred.xp : 0, suceso = predecir(lib, cap, v, ms, nuevo, conf ? Math.max(0, cD - 1) : cD, a === 0 ? 0.3 : conf ? 0.7 : 1, a === 0 ? "auto" : conf ? "conf" : "completo");
    pulsoMedidor((R.pred ? R.pred.xp : 0) - antes);
    if (suceso) enviar(false);
    else if (fresco && !R.tPres) {
      // Neon (23-nov-2026): primer envío temprano (25 s) para que /presentes, /vivo y /arbol/vivo muestren de inmediato qué lees
      R.tPres = setTimeout(() => { R.tPres = 0; if (R.cola.length && !R.enviando) enviar(false); }, 25000);
    }
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
    if (R.tPres) { clearTimeout(R.tPres); R.tPres = 0; }
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
    guardarMarcas(r);
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
    // AL12: las chispas que salen del escudo no se dibujan sobre otra vista ni sobre una ventana que lo tapa
    if (ref === MED.el && !escudoVisible()) return;
    const r = ref.getBoundingClientRect(); if (!r.width) return;
    const cx = r.left + r.width / 2, cy = r.top + r.height * 0.46, capa = h("div", { class: "jg-chispas", "aria-hidden": "true" });
    document.body.append(capa);
    // con una ventana abierta (capa superior), las chispas van también en la capa superior, por encima de ella (15-nov-2026)
    if (document.querySelector("dialog[open]") && capa.showPopover) { capa.setAttribute("popover", "manual"); try { capa.showPopover(); } catch (e) { /* sin capa superior */ } }
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
  // el escudo está a la vista: en la página, sin una ventana abierta encima y sin ocultarse por el estilo
  const escudoVisible = () => !!(MED.el && MED.el.isConnected && !document.querySelector("dialog[open]") && MED.el.getClientRects().length && getComputedStyle(MED.el).visibility !== "hidden");
  function chispasAzar() {
    clearTimeout(MED.tz);
    if (!MED.el) return;
    // AL12 (BiEx, 22-nov-2026, 18:53): las chispas al azar solo donde el escudo se ve (no detrás de una ventana como la de una palabra)
    MED.tz = setTimeout(() => { if (MED.el && !document.hidden && escudoVisible()) chispas(3 + Math.floor(Math.random() * 5)); chispasAzar(); }, 14000 + Math.random() * 30000);
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
  const bonoSalaVivo = () => !!(SL.cod && SL.ws && SL.ws.readyState === 1 && R.lib && SL.miembros.some((x) => x.j !== SL.yo6 && x.lc === R.lib + "." + R.cap));
  function bonosActivos(y) {
    const out = [], coma = (n) => String(n).replace(".", ",");
    if (y.dob > 0) out.push(["×2", "Experiencia doble: " + horas(y.dob) + " de lectura (se gasta solo mientras lees)", "dob"]);
    if (y.imp && y.imp.ms > 0) out.push(["×" + coma(y.imp.f), "Impulso por tu hallazgo: " + horas(y.imp.ms) + " de lectura", "imp"]);
    // (BiEx, 22-nov-2026) el bono de la sala solo se muestra cuando de verdad corre: otra persona de la sala lee ahora el mismo capítulo
    // (el servidor lo exige igual: Sala.presentes cuenta a los demás en ese capítulo durante los últimos 3 minutos); crear la sala no basta
    if (bonoSalaVivo()) out.push(["×1,25", "Leer en compañía: experiencia ×1,25 mientras alguien más de la sala lee contigo el mismo capítulo", "sala"]);
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
    setTimeout(() => { try { for (const r of l) { if (r && r._recibir) recibir(r._recibir); else celebrar(r); } } finally { setTimeout(() => { S.silencio = false; }, 1200); } }, 450);
  });
  // Premios de «Leído» (fragmentos de papiro y dracmas): fichas pequeñas que suben, con su cifra que cuenta
  // AC12: cada premio con su figura (un fragmento de papiro que gira y brilla; una dracma que destella)
  const FIG_PREMIO = { frag: '<path d="M5 4.5 17.5 3 20 9.5 18.6 20 7 21 4 13z" fill="url(#fpf)" stroke="#6f4a20" stroke-width=".8"/><path d="M7.5 9h9M7 12.5h10M7.6 16h7" stroke="#5d3b16" stroke-opacity=".45" stroke-width=".9" stroke-linecap="round"/><defs><linearGradient id="fpf" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6e3b6"/><stop offset="1" stop-color="#c39553"/></linearGradient></defs>',
    dr: '<circle cx="12" cy="12" r="8.6" fill="url(#fdr)" stroke="#7a5418" stroke-width=".9"/><circle cx="12" cy="12" r="5.6" fill="none" stroke="#fff3c8" stroke-opacity=".55" stroke-width=".8"/><defs><radialGradient id="fdr" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff2b8"/><stop offset=".55" stop-color="#e2b04a"/><stop offset="1" stop-color="#8f6118"/></radialGradient></defs>' };
  function premioPop(txt, n, clase, i) {
    const fig = FIG_PREMIO[clase] ? h("span", { class: "jg-premio-fig", "aria-hidden": "true" }, A.svg(FIG_PREMIO[clase])) : null;
    const num = h("b", { text: "+0" });
    const el = h("div", { class: "jg-pop jg-premio " + (clase || ""), role: "status", style: "--i:" + (i || 0) }, fig, num, h("small", { text: txt }));
    document.body.append(el); contarRapido(num, n, 900, "+");
    const extra = clase === "frag" ? 550 : 0;
    if (sinAnim() || !el.animate) { el.style.opacity = "1"; setTimeout(() => el.remove(), 3200 + extra); return; }
    // (AF12 + Neon, 23-nov-2026) medio segundo más a la vista para los fragmentos de papiro (3,85 s)
    el.animate([{ opacity: 0, transform: "translate(-50%,12px)" }, { opacity: 1, transform: "translate(-50%,0)", offset: 0.1 }, { opacity: 1, transform: "translate(-50%,-8px)", offset: clase === "frag" ? 0.89 : 0.87 }, { opacity: 0, transform: "translate(-50%,-18px)" }],
      { duration: 3300 + extra, delay: 260 + (i || 0) * 380, easing: "ease-out", fill: "both" }).finished.then(() => el.remove(), () => el.remove());
  }
  function celebrar(r) {
    if (document.hidden) { if (CEL_PEND.length < 6) CEL_PEND.push(r); return; }
    if (r.xp > 0) { pop(r.xp); sonar("chispa"); }
    if (r.leido) {
      const L = r.leido, f = (S.yo && S.yo.frag) || { c: 0, meta: 70 };
      let k = 0;
      if (L.frag) { premioPop(L.frag === 1 ? "fragmento de papiro · " + f.c + " de " + (f.meta || 70) : "fragmentos de papiro · " + f.c + " de " + (f.meta || 70), L.frag, "frag", k++); sonar("fragmento"); novedadLocal("frag", { n: L.frag, c: f.c, meta: f.meta || 70 }); }
      if (L.dr) { premioPop("dracmas", L.dr, "dr", k++); setTimeout(() => sonar("dracma"), 380); novedadLocal("drl", { dr: L.dr }); }
      if (L.raro && L.raro !== "dones") setTimeout(() => celebracion({ tipo: "raro", id: L.raro }), 900);
      else if (L.raro === "dones") A.avisar("¡70 fragmentos de papiro! Ya tienes todos los accesorios raros: +100 dracmas y 1 h de experiencia doble.");
    }
    const avisos = [], premios = [];
    // AA8 (BiEx, 14-nov-2026): las recompensas de las misiones esperan a que se toque «Recibir» (que se note lo ganado)
    for (const m of r.misiones || []) premios.push({ t: "Misión cumplida", d: textoMision(m), xp: m.xp | 0, ico: "mision" });
    if (r.diaCompleto) premios.push({ t: "¡Todas las misiones de hoy!", d: "El día completo", xp: 50, dr: 10, ico: "corona" });
    let grande = null;
    for (const x of r.hallazgos || []) {
      if (x.tipo === "lauro") grande = { tipo: "lauro" };
      else if (x.tipo === "piedra" && (!grande || grande.tipo !== "lauro")) grande = x;
      else if (x.tipo === "dracma") avisos.push("Hallaste " + x.dr + " dracmas");
      else if (x.tipo === "libro") premios.push({ t: "¡Libro terminado!", d: nombreLibro(x.lib), xp: 200, dr: 20, ico: "libro" });
      else if (x.tipo === "lectura") premios.push({ t: "¡Lectura completa n.º " + x.n + "!", d: "Toda la Nueva Voluntad, verso a verso", xp: 500, dr: 50, ico: "libro" });
    }
    if (premios.length) setTimeout(() => recibir(premios), grande ? 2600 : 500);
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
  // AA8 · «Recibir» (BiEx, 14-nov-2026): una tarjeta de cristal con lo ganado (misiones, el día completo, un libro terminado)
  // que se queda hasta tocar «Recibir»: entonces cuenta la experiencia, suenan las monedas y se apaga con un fundido. Si llegan
  // más mientras está abierta, se suman a la misma. Solo opacidad y traslados (compositor).
  const REC = { el: null, lista: null, items: [] };
  function recibir(items) {
    if (!items || !items.length) return;
    if (document.hidden) { if (CEL_PEND.length < 6) CEL_PEND.push({ _recibir: items }); return; }
    REC.items.push(...items);
    const fila = (x) => h("li", { class: "jg-rec-it" }, h("span", { class: "jg-rec-i", "aria-hidden": "true" }, ico(x.ico === "mision" ? "hoy" : x.ico === "libro" ? "liga" : "arbol")),
      h("span", { class: "jg-rec-t" }, h("b", { text: x.t }), x.d ? h("small", { text: x.d }) : null),
      h("span", { class: "jg-rec-v" }, x.xp ? h("b", { text: "+" + fmt(x.xp) }) : null, x.xp ? h("small", { text: "exp." }) : null, x.dr ? h("em", {}, dracma(), "+" + x.dr) : null));
    if (REC.el && REC.el.isConnected) { REC.lista.append(...items.map(fila)); return; }
    REC.lista = h("ul", { class: "jg-rec-l" }, REC.items.map(fila));
    const boton = h("button", { class: "btn oro jg-rec-b", type: "button" }, h("span", { text: "Recibir" }));
    const tarjeta = h("div", { class: "jg-rec-c", role: "dialog", "aria-modal": "true", "aria-label": "Recompensas" },
      h("div", { class: "jg-rec-sello", "aria-hidden": "true" }, gema(0, true)), h("h3", { text: REC.items.length > 1 ? "¡Recompensas!" : "¡Recompensa!" }), REC.lista, boton);
    REC.el = h("div", { class: "jg-rec" }, h("div", { class: "jg-rec-velo" }), tarjeta);
    document.body.append(REC.el);
    sonar("chispa"); vibrar([10, 40, 14]);
    if (!sinAnim() && tarjeta.animate) { tarjeta.animate([{ opacity: 0, transform: "translate3d(0,26px,0)" }, { opacity: 1, transform: "none" }], { duration: 420, easing: "cubic-bezier(.2,.8,.2,1)" }); REC.el.firstChild.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300 }); }
    setTimeout(() => { try { boton.focus({ preventScroll: true }); } catch (e) { /* */ } }, 60);
    boton.onclick = () => {
      boton.disabled = true;
      const xp = REC.items.reduce((a, x) => a + (x.xp | 0), 0), dr = REC.items.reduce((a, x) => a + (x.dr | 0), 0);
      chispas(26, boton, ["aro", "polvo"]); sonar("nivel"); vibrar([18, 40, 24, 40, 30]);
      if (xp) { pulsoMedidor(xp); pop(xp); }
      const fin = () => { if (REC.el) REC.el.remove(); REC.el = null; REC.items = []; };
      if (sinAnim() || !tarjeta.animate) return setTimeout(fin, 200);
      tarjeta.animate([{ opacity: 1, transform: "none" }, { opacity: 0, transform: "translate3d(0,-22px,0)" }], { duration: 520, delay: 380, easing: "ease-in", fill: "forwards" }).finished.then(fin, fin);
      REC.el.firstChild.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 520, delay: 380, fill: "forwards" });
    };
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
  // AC6 (BiEx, 15-nov-2026): al repartir, una presentación breve y perceptible: los medallones que subieron se encienden con
  // el color de su atributo, cada cifra cuenta hasta su valor nuevo, el poder sube con su chispa y un verso de la Lectura cierra.
  // Al seguir, el Árbol se rehace ya con lo nuevo.
  async function celebrarReparto(defs, antes, dado, p0, rehacer) {
    const P = await cargarPoder().catch(() => null), ef = (P && P.av && P.av.ef) || {}, poder = P && P.av ? P.av.poder : p0;
    const subieron = defs.filter(([k]) => dado[k] > 0);
    sonar("reparto"); vibrar([12, 40, 18, 40, 24]);
    const fila = subieron.map(([k, n, efecto], i) => { const v = h("b", { class: "jg-rp-v", text: String(antes[k] | 0) });
      return { el: h("li", { class: "jg-rp-m", style: "--ac:" + ATR_COL[k] + ";--i:" + i }, h("span", { class: "jg-rp-ico", "aria-hidden": "true" }, A.svg(ATR_ICO[k])), h("span", { class: "jg-rp-n", text: n }), v, h("small", { text: "+" + dado[k] })), v, hasta: ef[k] != null ? ef[k] : (antes[k] | 0) + dado[k] }; });
    const cifraP = h("b", { text: fmt(p0 || 0) });
    const cuerpo = h("div", { class: "jg-cel jg-rp" }, h("ul", { class: "jg-rp-l" }, fila.map((x) => x.el)), h("p", { class: "jg-rp-p" }, h("span", { text: "Poder " }), cifraP),
      // AH (BiEx, 22-nov-2026): la cita va en su propia línea, centrada, para que la distribución quede simétrica
      h("p", { class: "jg-rp-cita" }, h("span", { text: "Repartiste tus puntos: tu ser interior se robustece." }), h("span", { class: "jg-rp-ref", text: "(Ἐfέsιοι 3:16)" })), tarjetaVerso("Un verso para tu ser interior"),
      h("div", { class: "jg-acciones" }, h("button", { class: "btn oro", type: "button", onclick: () => A.cerrarModal() }, h("span", { text: "Continuar" }))));
    A.abrirModal(() => A.cajaModal(A.cabModal("Atributos fortalecidos", "Escudriña"), cuerpo), () => rehacer());
    const anim = !sinAnim();
    fila.forEach((x, i) => setTimeout(() => { x.el.classList.add("on"); contarRapido(x.v, x.hasta, 700, ""); if (anim) chispas(8, x.el, ["aro"]); }, 260 + i * 260));
    setTimeout(() => { if (poder != null) contarRapido(cifraP, poder, 900, ""); }, 300 + fila.length * 260);
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
      // AL8 (BiEx, 22-nov-2026): el verso completo va por defecto en la Lectura (la más inteligible); un toque muestra la Textual,
      // donde está la palabra de la pregunta tal como se preguntó
      const vc = resultado && completos[i] && (completos[i][0] || completos[i][1]) ? (() => {
        const [fL, fT] = completos[i], tx = h("p", { class: "jg-vc-t vt" }), et = h("span", { class: "jg-vc-et" });
        const bts = [["Lectura", fL], ["Textual", fT]].filter((x) => x[1]).map(([t, f]) => h("button", { type: "button", class: "jg-vc-b", "aria-pressed": "false", text: t, onclick: () => poner(t, f) }));
        const poner = (t, f) => { et.textContent = "Verso completo · " + t + " de BiEx"; tx.replaceChildren(f()); for (const b of bts) b.setAttribute("aria-pressed", String(b.textContent === t)); };
        const caja = h("div", { class: "jg-vc" }, h("div", { class: "jg-vc-cab" }, et, bts.length > 1 ? h("span", { class: "jg-vc-sel", role: "group", "aria-label": "Formato del verso" }, bts) : null), tx);
        poner(fL ? "Lectura" : "Textual", fL || fT); return caja;
      })() : null;
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
          guardarMarcas(x);
          if ((x.cf || []).length) { if (A.marcarLeido) A.marcarLeido(lib, cap, x.cf); if (R.lib === lib && R.cap === cap) { for (const v of x.cf) LB.ok.add(lib + "." + cap + "." + v); pintarMarcados(); elegirLB(); finCapJuego(); } }
          if (x.aciertos === n) sonar("nivel"); else if (x.aciertos) sonar("chispa");
          for (const m of x.misiones || []) A.avisar("Misión cumplida: " + textoMision(m) + " · +" + m.xp);
          // V23: el verso completo de cada pregunta, en la Textual de BiEx
          completos = await Promise.all(r.preguntas.map((p) => Promise.all([A.versoLectura ? A.versoLectura(lib, cap, p.v).catch(() => null) : null, A.versoTextual ? A.versoTextual(lib, cap, p.v).catch(() => null) : null])));
          A.reemplazarModal(vistaP);
          setTimeout(() => { const c = document.querySelector(".modal[open] .jg-qz-res"); if (c) c.scrollIntoView({ block: "start", behavior: sinAnim() ? "auto" : "smooth" }); }, 140);
          if (x.aciertos === n) setTimeout(() => { const m = document.querySelector(".modal[open] .jg-qz-med"); if (m) chispas(16, m, ["aro", "polvo"]); }, 700);
        } }, h("span", { text: "Elige una opción en cada pregunta" }));
        pie = btnVer; setTimeout(pintarListo, 0);
      }
      const dif = r.dificultad | 0;
      const DIF_T = ["", "Dificultad I · Nivel inicial", "Dificultad II · Nivel intermedio", "Dificultad III · Nivel profundo"];
      return h("div", { class: "jg-qz" + (resultado ? " res" : "") }, h("div", { class: "jg-qz-fondo", "aria-hidden": "true" }, h("i"), h("i"), h("i")),
        dif >= 1 && dif <= 3 ? h("p", { class: "jg-qz-dif d" + dif, text: DIF_T[dif] }) : null,
        h("p", { class: "jg-qz-intro", text: resultado ? "Así quedó tu prueba. Debajo de cada pregunta está su verso completo." : "Completa cada verso con la palabra que falta, tal como está en la Textual de BiEx." }), ...preguntas, pie);
    };
    const DIF_SUB = ["", " · Dificultad I", " · Dificultad II", " · Dificultad III"][r.dificultad | 0] || "";
    const vistaP = () => A.cajaModal(A.cabModal("Prueba del capítulo", nombreLibro(lib) + " " + cap + DIF_SUB), cuerpo());
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
    for (const b of raiz.querySelectorAll(".jg-barra:not(.jg-epica)>i, .jg-gen .b i, .jg-meta>i")) {
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
  // La escalera de las doce piedras; con «alTocar» (BiEx, 21-nov-2026) cada piedra es un botón que muestra a quienes leen esta
  // semana en ese fundamento
  const FT_LIGA = [4.7, 5.3, 5.9, 6.1, 5.1, 6.5, 4.9, 6.3, 5.7, 6.7, 5.5, 6.1];
  function escaleraPiedras(nv, alTocar) {
    const cuerpo = (i) => [h("span", { class: "jg-pel-g", "aria-hidden": "true" }, gema(i, i + 1 <= nv)), h("span", { class: "jg-pel-s", "aria-hidden": "true" })];
    const st = (i) => "--ft:" + FT_LIGA[i] + "s;--fd:-" + (i * 0.43).toFixed(2) + "s";
    if (!alTocar) return observarFlotantes(h("div", { class: "jg-escalera-p", role: "img", "aria-label": "Liga " + ligaNombre(nv) + ": " + ORDF[nv - 1] + " fundamento de 12" },
      PIEDRAS.map((p, i) => h("span", { class: "jg-pel" + (i + 1 === nv ? " act" : i + 1 < nv ? " ya" : ""), style: st(i), title: "Liga " + ligaNombre(i + 1) }, ...cuerpo(i)))));
    return observarFlotantes(h("div", { class: "jg-escalera-p", role: "group", "aria-label": "Las doce ligas: toca una piedra para ver quiénes leen en ese fundamento" },
      PIEDRAS.map((p, i) => h("button", { type: "button", class: "jg-pel" + (i + 1 === nv ? " act ver" : i + 1 < nv ? " ya" : ""), style: st(i), "aria-pressed": i + 1 === nv ? "true" : "false",
        "aria-label": "Liga " + ligaNombre(i + 1) + ", " + ORDF[i] + " fundamento" + (i + 1 === nv ? " (la tuya)" : ""), title: "Liga " + ligaNombre(i + 1),
        onclick: (e) => { const yo = e.currentTarget; for (const b of yo.parentNode.children) { const sel = b === yo; b.classList.toggle("ver", sel); b.setAttribute("aria-pressed", sel ? "true" : "false"); } alTocar(i + 1); } }, ...cuerpo(i)))));
  }
  // Quienes leen esta semana en otro fundamento: los 40 de más experiencia de toda la liga
  function tarjetaFundamento(k, v) {
    const cab = h("p", { class: "jg-mini" }, h("span", { lang: "grc", text: PIEDRAS[k - 1][0] }), " · " + ORDF[k - 1] + " fundamento de 12");
    if (v.error) return tarjeta("Liga " + ligaNombre(k), null, cab, h("p", { text: mensaje(v) }));
    if (!v.n) return tarjeta("Liga " + ligaNombre(k), null, cab, h("p", { class: "jg-mini", text: "Nadie lee todavía esta semana en este fundamento." }));
    return tarjeta("Liga " + ligaNombre(k), null, cab,
      h("p", { class: "jg-total" }, cifra(v.n), " " + (v.n === 1 ? "lector" : "lectores") + " esta semana · " + plural(v.grupos, "grupo", "grupos")),
      h("ol", { class: "jg-lista jg-lista-liga" }, v.lista.map((x) => filaLiga(x, 0))),
      h("p", { class: "jg-mini", text: (v.n > v.lista.length ? "Se ven los " + v.lista.length + " de más experiencia de la semana en toda la liga. " : "") + "Para subir cuenta el puesto dentro de cada grupo de hasta " + (v.tam || 30) + " personas." }));
  }
  function filaLiga(x, suben) {
    const [l, c] = embDe(x.emb), ex = resumenStatsPub(x);
    return h("li", { class: "jg-fila" + (x.yo ? " yo" : "") + (x.p <= suben && x.xp > 0 ? " sube" : "") }, h("span", { class: "p", text: String(x.p) }), emblema(l, c, x.marco, x.foto),
      h("span", { class: "n" }, nombreClicable(x.apodo), h("small", { text: "nivel " + x.nivel + (ex ? " · " + ex : "") + (x.n ? " · Primicia n.º " + x.n : "") })), h("span", { class: "x", text: fmt(x.xp) }));
  }
  function resumenLiga(r, mini) {
    const nv = r.nv || 1, i = nv - 1, yo = (r.lista || []).find((x) => x.yo);
    if (r.enGrupo && Array.isArray(r.lista) && r.lista.length) {
      comprobarAdelantamientos("liga:" + (r.sem || semanaClave()) + ":" + nv, r.lista, "la liga " + ligaNombre(nv), "#/escudrina/liga");
    }
    const gemaViva = observarFlotantes(h("span", { class: "jg-gema-viva", style: "--g:" + PIEDRAS[i][2] },
      h("span", { class: "jg-gv-halo", "aria-hidden": "true" }),
      h("span", { class: "jg-gv-wrap" }, gema(i, true)),
      h("span", { class: "jg-gv-som", "aria-hidden": "true" })));
    const cab = h("div", { class: "jg-liga-cab" }, gemaViva,
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
    marco(cont, cabSub("Liga de la semana", "La semana va " + textoSemana() + ". Cada liga lleva el nombre de una de las doce piedras del fundamento (Ἀpοκάlυpsις 21:19-20): se sube de fundamento en fundamento.", "#/escudrina/mundo"), zona);
    const r = await pedir("/liga");
    if (cont !== S.cont || !zona.isConnected) return;
    if (r.error) return zona.replaceChildren(tarjeta(null, null, h("p", { text: mensaje(r) })));
    const nv = r.nv || 1;
    const propio = r.enGrupo ? tarjeta("Tu grupo", null, h("ol", { class: "jg-lista jg-lista-liga" }, r.lista.map((x, i) => [filaLiga(x, r.suben), i + 1 === r.suben && r.lista.length > r.suben ? h("li", { class: "jg-corte", "aria-hidden": "true" }, h("span", { text: "▲ suben de fundamento" })) : null]).flat().filter(Boolean)),
      h("p", { class: "jg-mini", text: "La experiencia de la semana se actualiza cada media hora mientras lees, y al cerrar la lectura." })) : null;
    const verZona = h("div", { class: "jg-ver-fund", "aria-live": "polite" }, propio); let viendo = nv;
    const verFundamento = async (k) => {
      viendo = k;
      if (k === nv) { verZona.replaceChildren(...(propio ? [propio] : [])); return; }
      verZona.replaceChildren(tarjeta("Liga " + ligaNombre(k), null, h("p", { class: "jg-mini", text: "Cargando a los lectores de este fundamento…" })));
      const v = await pedir("/liga/ver?nv=" + k, { guardable: true });
      if (viendo !== k || !verZona.isConnected) return;
      verZona.replaceChildren(tarjetaFundamento(k, v)); animarCifras(verZona);
    };
    zona.replaceChildren(
      h("section", { class: "jg-tarjeta jg-heroe" }, resumenLiga(r, false), escaleraPiedras(nv, verFundamento), h("p", { class: "jg-mini jg-esc-nota", text: "Toca una piedra para ver quiénes leen en ese fundamento esta semana." })),
      verZona,
      tarjeta("Premios", null, h("p", { class: "jg-mini", text: PREMIOS_LIGA })));
    animarCifras(zona);
  }

  // ================================================================== compañías (de 2 a 24)
  const enlaceCompania = (cod) => PUBLICO + "/#/escudrina/c/" + cod;
  const limpiarNomComp = (s) => String(s || "").replace(/\s+/g, " ").trim().slice(0, 30);
  const nombresCompLoc = () => { const m = A.store.get("jg:compNom", null); return m && typeof m === "object" ? m : {}; };
  const nombreCompDe = (cod, srvNom) => {
    const loc = nombresCompLoc()[String(cod || "").toUpperCase()];
    if (loc && loc.n && loc.t) return limpiarNomComp(loc.n);
    return limpiarNomComp(srvNom) || "";
  };
  const guardarNomComp = (cod, nom, marcarCambio) => {
    cod = String(cod || "").toUpperCase(); if (!cod) return;
    const m = nombresCompLoc(), prev = m[cod] || {}, limpio = limpiarNomComp(nom);
    if (limpio) m[cod] = { n: limpio, t: marcarCambio ? Date.now() : (prev.t || 0) };
    A.store.set("jg:compNom", m);
  };
  const puedeRenombrarComp = (cod) => {
    const loc = nombresCompLoc()[String(cod || "").toUpperCase()];
    const ult = Number(loc && loc.t) || 0;
    const falta = ult ? (ult + 864e5) - Date.now() : 0;
    return { ok: falta <= 0, faltaMs: Math.max(0, falta) };
  };
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
    const nomComp = nombreCompDe(y.comp.cod, y.comp.nombre);
    const zona = h("div", {}, h("p", { class: "jg-mini", text: "Cargando…" }));
    pedir("/compania", { guardable: true }).then((r) => {
      if (!zona.isConnected || r.error || !r.comp) return;
      const nomR = nombreCompDe(r.comp.cod, r.comp.nombre);
      if (Array.isArray(r.miembros) && r.miembros.length) comprobarAdelantamientos("comp:" + r.comp.cod, r.miembros, "tu compañía «" + nomR + "»", "#/escudrina/compania");
      zona.replaceChildren(metaCompania(r)); animarCifras(zona);
    });
    return tarjeta("Compañía · " + nomComp, ico("compania"), zona, h("div", { class: "jg-acciones" }, h("a", { class: "btn", href: "#/escudrina/compania" }, ico("compania"), h("span", { text: "Ver mi compañía" })),
      h("a", { class: "btn", href: "#/escudrina/companias" }, h("span", { text: "Clasificación de compañías" }))));
  }
  async function pintarCompania(cont) {
    document.title = "Compañía · Escudriña · BiEx";
    const zona = h("div", { class: "jg" }, h("p", { class: "cargando", text: "Cargando…" }));
    marco(cont, cabSub("Compañía", "De 2 a 24 personas que leen juntas: meta común cada semana y su propia clasificación.", "#/escudrina/juntos"), zona);
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
    const nomComp = nombreCompDe(c.cod, c.nombre);
    if (Array.isArray(r.miembros) && r.miembros.length) comprobarAdelantamientos("comp:" + c.cod, r.miembros, "tu compañía «" + nomComp + "»", "#/escudrina/compania");
    const ren = puedeRenombrarComp(c.cod);
    const renIn = h("input", { type: "text", maxlength: "30", value: nomComp, placeholder: "Nombre de la compañía (3 a 30)", "aria-label": "Nombre de la compañía", disabled: !ren.ok });
    const renPista = h("p", { class: "jg-pista", role: "status" });
    const renombrarComp = async (ev) => {
      const nuevo = limpiarNomComp(renIn.value);
      if (nuevo.length < 3) { renPista.textContent = "El nombre debe tener entre 3 y 30 caracteres."; renPista.className = "jg-pista mal"; return; }
      const st = puedeRenombrarComp(c.cod);
      if (!st.ok) { renPista.textContent = "Ya cambiaste el nombre hoy · disponible en " + restaTexto(Date.now() + st.faltaMs) + "."; renPista.className = "jg-pista mal"; return; }
      const bt = ev.currentTarget; bt.disabled = true;
      const x = await pedir("/compania/nombre", { metodo: "POST", cuerpo: { nombre: nuevo } });
      bt.disabled = false;
      if (x && x.error === "nombre_espera") { renPista.textContent = mensaje(x); renPista.className = "jg-pista mal"; return; }
      if (x && !x.error && x.yo) actualizarYo(x.yo);
      guardarNomComp(c.cod, nuevo, true);
      A.avisar("Nombre de la compañía actualizado a «" + nuevo + "»");
      repintar();
    };
    const cajaNomComp = c.mia ? h("div", { class: "jg-sala-nom" },
      h("div", { class: "jg-sala-nom-cab" }, h("span", { text: "Nombre de la compañía" }), h("small", { text: ren.ok ? "Se puede cambiar 1 vez al día" : "Próximo cambio en " + restaTexto(Date.now() + ren.faltaMs) })),
      h("div", { class: "jg-form" }, renIn, h("button", { class: "btn chico", type: "button", disabled: !ren.ok, onclick: renombrarComp }, h("span", { text: "Guardar" }))),
      renPista) : null;
    const salir = h("button", { class: "btn", type: "button", onclick: async (e) => {
      if (!e.currentTarget.dataset.seguro) { e.currentTarget.dataset.seguro = "1"; e.currentTarget.querySelector("span").textContent = "Toca otra vez para salir"; return; }
      const x = await pedir("/compania/salir", { metodo: "POST", cuerpo: {} }); if (x.error) return A.avisar(mensaje(x));
      actualizarYo(x.yo); A.avisar("Saliste de «" + nomComp + "»"); repintar();
    } }, h("span", { text: "Salir de la compañía" }));
    zona.replaceChildren(
      h("section", { class: "jg-tarjeta jg-heroe" }, h("p", { class: "jg-tit", text: nomComp }), h("p", { class: "jg-mini", text: plural(c.n, "persona", "personas") + " de " + ((S.cfg && S.cfg.comp && S.cfg.comp.max) || 24) + (c.mia ? " · la cuidas tú" : "") }), metaCompania(r), cajaNomComp),
      tarjeta("Invitar", ico("compartir"), h("div", { class: "jg-codigo", text: c.cod }),
        h("div", { class: "jg-acciones" }, h("button", { class: "btn", type: "button", onclick: () => copiar(c.cod, "Código copiado") }, ico("copiar"), h("span", { text: "Copiar el código" })),
          h("button", { class: "btn oro", type: "button", onclick: () => compartir("Escudriña · compañía «" + nomComp + "»", "Únete a mi compañía «" + nomComp + "» en Escudriña: leemos juntos la Nueva Voluntad traducida palabra por palabra del griego.", enlaceCompania(c.cod)) }, ico("compartir"), h("span", { text: "Compartir el enlace" }))),
        c.mia ? h("button", { class: "btn chico jg-cod-nuevo", type: "button", onclick: async () => { const x = await pedir("/compania/codigo", { metodo: "POST", cuerpo: {} }); if (x.error) return A.avisar(mensaje(x)); actualizarYo(x.yo); A.avisar("Código nuevo: el anterior ya no sirve"); repintar(); } }, "Cambiar el código") : null),
      tarjeta("Esta semana", null, h("ol", { class: "jg-lista" }, r.miembros.map((x) => { const [l, cc] = embDe(x.emb), ex = resumenStatsPub(x); return h("li", { class: "jg-fila" + (x.yo ? " yo" : "") }, h("span", { class: "p", text: String(x.p) }), emblema(l, cc, x.marco, x.foto),
        h("span", { class: "n" }, nombreClicable(x.apodo), h("small", { text: plural(x.v, "verso", "versos") + " · nivel " + x.nivel + (ex ? " · " + ex : "") })), h("span", { class: "x", text: fmt(x.x) })); })),
        h("p", { class: "jg-mini", text: "Se actualiza cada media hora mientras leen, y al cerrar la lectura." })),
      h("div", { class: "jg-acciones" }, h("a", { class: "btn", href: "#/escudrina/companias" }, h("span", { text: "Clasificación de compañías" })), salir));
    animarCifras(zona);
  }
  async function pintarCompanias(cont) {
    document.title = "Compañías · Escudriña · BiEx";
    const zona = h("div", { class: "jg" }, h("p", { class: "cargando", text: "Cargando…" }));
    marco(cont, cabSub("Clasificación de compañías", "Por la experiencia promedio de sus personas esta semana: una compañía de 2 compite de igual a igual con una de 24.", "#/escudrina/juntos"), zona);
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
    marco(cont, cabSub("Invitación a una compañía", "Lean juntos la Nueva Voluntad con una meta común cada semana.", "#/escudrina/juntos"), zona);
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
    // P28 (BiEx, 11-nov-2026): primero la hora de quien lee (su zona elegida o asignada) y luego, como información, las demás
    const y = S.yo || {}, propia = y.tz ? [y.tz, "tu hora" + (y.lugar && y.lugar.ciudad ? " (" + y.lugar.ciudad + ")" : "")] : null;
    const lista = propia ? [propia, ...CIUDADES.filter((c) => c[0] !== propia[0])] : CIUDADES;
    const el = h("span", { class: "jg-rota" }); let i = propia ? 0 : Math.floor(Math.random() * lista.length);
    const pinta = () => { const c = lista[i % lista.length]; el.textContent = prefijo + " " + horaEn(ms, c[0]).replace(",", "") + (c === propia ? " · " + c[1] : " · hora de " + c[1].split(" · ")[0]); i++; };
    pinta();
    const t = setInterval(() => {
      if (!el.isConnected) { clearInterval(t); return; }
      if (sinAnim() || !el.animate) { pinta(); return; }
      el.animate([{ opacity: 1 }, { opacity: 0 }, { opacity: 1 }], { duration: 700, easing: "ease-in-out" }); setTimeout(pinta, 350);
    }, 3800);
    return el;
  }
  function enlaceMisionMundial(m) {
    if (m && m.ambito === "libro" && m.lib) return "#/" + m.lib + "/1";
    if (m && m.ambito === "vida") return "#/MRK/1";
    if (m && m.ambito === "cartas") return "#/ROM/1";
    const u = A.ultimo && A.ultimo();
    return u && u.h ? u.h : "#/MRK/1";
  }
  function avisoMisionMundial(y) {
    const caja = h("aside", { class: "jg-mm-hoy", hidden: true, "aria-label": "Misión mundial activa" });
    pedir("/vivo", { sin: true, guardable: true }).then((v) => {
      if (!caja.isConnected || !v || v.error) return;
      const m = v.mision;
      if (!m || m.ok) return;
      const mio = y.mision && y.mision.k === m.k && (y.mision.e | 0) === (m.e | 0) ? y.misAporte || 0 : 0;
      const min = (S.cfg && S.cfg.misMin) || 10;
      if (mio >= min) return;
      const pct = Math.max(0, Math.min(100, (100 * m.total) / Math.max(1, m.meta)));
      const falta = Math.max(1, min - mio);
      caja.hidden = false;
      caja.replaceChildren(
        h("div", { class: "jg-mm-hoy-cab" },
          h("span", { class: "jg-mm-est" }, h("i", { class: "jg-mm-dot", "aria-hidden": "true" }), "Misión mundial activa"),
          h("span", { class: "jg-mm-meta", text: mio > 0 ? "Te faltan " + plural(falta, "verso", "versos") : "Aporta " + min + " versos" })),
        h("p", { class: "jg-mm-hoy-t", text: textoMisionMundial(m) }),
        h("div", { class: "jg-barra oro", role: "progressbar", "aria-valuemin": "0", "aria-valuemax": String(m.meta), "aria-valuenow": String(m.total), "aria-label": "Avance de la misión mundial" }, h("i", { style: "width:" + pct.toFixed(1) + "%" })),
        h("p", { class: "jg-mini", text: fmt(m.total) + " de " + fmt(m.meta) + " · " + plural(m.part, "persona aporta", "personas aportan") + " · termina en " + restaTexto(m.fin) }),
        h("div", { class: "jg-mm-hoy-acc" },
          h("a", { class: "btn chico oro", href: enlaceMisionMundial(m) }, h("span", { text: "Participar leyendo" }), A.svg(A.ICO.der)),
          h("a", { class: "btn chico", href: "#/escudrina/mundo" }, h("span", { text: "Ver en Mundo" }))));
    });
    return caja;
  }
  function tarjetaMision(y) {
    const zona = h("div", {}, h("p", { class: "jg-mini", text: "Cargando la misión…" }));
    const card = tarjeta("Misión mundial", ico("mundo"), zona);
    let firma = "";
    const pintarM = (v) => {
      if (!zona.isConnected || v.error) return;
      const f = JSON.stringify([v.mision && [v.mision.k, v.mision.e, v.mision.total, v.mision.part, v.mision.ok], v.proxMision]); if (f === firma) return; firma = f;
      const m = v.mision;
      card.classList.toggle("jg-mis-mund", !!(m && !m.ok));
      if (!m) return zona.replaceChildren(h("p", { text: v.proxMision ? "La primera misión mundial empieza el " + fechaLarga(v.proxMision) + "." : "Pronto empieza una misión mundial." }));
      const pct = Math.max(0, Math.min(100, (100 * m.total) / Math.max(1, m.meta))), mio = y.mision && y.mision.k === m.k && (y.mision.e | 0) === (m.e | 0) ? y.misAporte || 0 : 0, min = (S.cfg && S.cfg.misMin) || 10;
      const yaPart = mio >= min;
      const aviso = !m.ok ? h("div", { class: "jg-mm-aviso" + (yaPart ? " ya" : ""), role: "status" },
        h("span", { class: "jg-mm-est" }, h("i", { class: "jg-mm-dot", "aria-hidden": "true" }), yaPart ? "¡Ya participas en la misión!" : mio > 0 ? "Misión activa · en marcha" : "Misión activa · participa hoy"),
        h("span", { class: "jg-mm-meta", text: yaPart ? "Aporte: " + fmt(mio) : mio > 0 ? "Faltan " + fmt(min - mio) : "Mínimo " + min + " versos" })) : null;
      const cta = !m.ok ? h("a", { class: "btn oro jg-mm-cta", href: enlaceMisionMundial(m) }, h("span", { text: yaPart ? "Seguir aportando versos" : "Participar leyendo ahora" }), A.svg(A.ICO.der)) : null;
      // relevos (BiEx, 10-nov-2026): lograda antes de tiempo, la siguiente abre a los 20 min y corre hasta el final de la franja
      zona.replaceChildren(aviso,
        m.e ? h("p", { class: "jg-chip jg-relevo", text: "Relevo " + (m.e + 1) + " de " + ((m.relevos || 3) + 1) }) : null,
        h("p", { class: "jg-tit jg-mis-t", text: textoMisionMundial(m) }),
        h("p", { class: "jg-total" }, cifra(m.total), " de " + fmt(m.meta) + (m.ok ? " · ¡lograda!" : "")),
        m.ok && m.relevo ? h("p", { class: "jg-aviso" }, h("b", { text: "¡Lograda antes de tiempo! " }), "El relevo " + (m.e + 2) + " abre en ", (() => { const el = h("b", { class: "jg-rel-t", text: restaTexto(m.relevo) }); const t = setInterval(() => { if (!el.isConnected) return clearInterval(t); el.textContent = m.relevo > Date.now() ? restaTexto(m.relevo) : "un momento"; }, 15000); return el; })(), ": una misión nueva hasta el final de esta franja.") : null,
        h("div", { class: "jg-barra oro", role: "progressbar", "aria-valuemin": "0", "aria-valuemax": String(m.meta), "aria-valuenow": String(m.total), "aria-label": "Avance de la misión mundial" }, h("i", { style: "width:" + pct.toFixed(1) + "%" })),
        cta,
        h("p", { class: "jg-mini" }, plural(m.part, "persona aporta", "personas aportan") + " · termina en " + restaTexto(m.fin) + (mio ? " · tu aporte: " + fmt(mio) : "")),
        h("p", { class: "jg-mini" }, relojCiudades(m.fin, "Termina el")),
        h("p", { class: "jg-mini", text: "Quien aporte " + min + " versos o más recibe 1 h de experiencia doble y 4 dracmas en cuanto se logra, y 15 min y 1 dracma si no se alcanza. Hay una misión nueva cada dos días; su hora de comienzo se alterna para que a cada región del mundo le toque una cómoda. Si se logra antes de tiempo, a los 20 min abre un relevo (hasta " + (m.relevos || 3) + ") con su propia meta y su propio premio." }),
        v.proxMision ? h("p", { class: "jg-mini" }, relojCiudades(v.proxMision, "La siguiente empieza el")) : "");
      animarCifras(zona);
    };
    pedir("/vivo", { sin: true, guardable: true }).then(pintarM);
    enVivo(zona, 25e3, () => pedir("/vivo", { sin: true }).then(pintarM));
    return card;
  }

  // ================================================================== lectura en compañía (salas en tiempo real)
  const SL = { cod: null, ws: null, miembros: [], anf: "", yo6: "", seguir: false, guia: false, ultPos: 0, pos: "", intentos: 0, cerrada: true, t: null, marcas: new Map(), pub: true, lcAct: "", lcCreada: "", nombre: "", nomEn: 0 };
  const limpiarNomSala = (s) => String(s || "").replace(/\s+/g, " ").trim().slice(0, 36);
  const nombresSalaLoc = () => { const m = A.store.get("jg:salaNom", null); return m && typeof m === "object" ? m : {}; };
  const nombreSalaDe = (cod, srvNom) => {
    const s = limpiarNomSala(srvNom); if (s) return s;
    if (cod && cod === SL.cod && SL.nombre) return SL.nombre;
    const loc = nombresSalaLoc()[String(cod || "").toUpperCase()];
    return loc && loc.n ? limpiarNomSala(loc.n) : "";
  };
  const guardarNomSala = (cod, nom, marcarCambio) => {
    cod = String(cod || "").toUpperCase(); if (!cod) return;
    const m = nombresSalaLoc(), prev = m[cod] || {};
    const limpio = limpiarNomSala(nom);
    if (limpio) m[cod] = { n: limpio, t: marcarCambio ? Date.now() : (prev.t || 0) };
    else if (m[cod]) delete m[cod];
    const ks = Object.keys(m); if (ks.length > 24) for (const k of ks.slice(0, ks.length - 24)) delete m[k];
    A.store.set("jg:salaNom", m);
    if (cod === SL.cod) { SL.nombre = limpio; if (marcarCambio) SL.nomEn = Date.now(); }
  };
  const puedeRenombrarSala = (cod) => {
    const loc = nombresSalaLoc()[String(cod || "").toUpperCase()];
    const ult = Math.max(Number(cod === SL.cod ? SL.nomEn : 0) || 0, Number(loc && loc.t) || 0);
    const falta = ult ? (ult + 864e5) - Date.now() : 0;
    return { ok: falta <= 0, faltaMs: Math.max(0, falta) };
  };
  function entrarSala(cod) {
    cod = String(cod || "").toUpperCase(); if (!/^[2-9A-HJKMNP-Z]{6}$/.test(cod) || !S.token) return false;
    if (SL.cod === cod && SL.ws && SL.ws.readyState <= 1) return true;
    salirSala(true);
    Object.assign(SL, { cod, cerrada: false, intentos: 0, miembros: [], seguir: false, guia: false, nombre: nombreSalaDe(cod, ""), nomEn: Number((nombresSalaLoc()[cod] || {}).t) || 0 });
    A.store.set("jg:sala", { c: cod, t: Date.now() });
    conectarSala(); latirPresencia(true); return true;
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
      posSala(true); pintarSalaPildora(); syncSalasTrasEvento();
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
    SL.ws = null; SL.cod = null; SL.miembros = []; SL.lcCreada = ""; SL.nombre = ""; SL.nomEn = 0; A.store.set("jg:sala", null); quitarMarcas(); pintarSalaPildora();
    VIVO.salas = null;
    if (!silencio) { A.avisar("Saliste de la sala"); syncSalasTrasEvento(); latirPresencia(true); }
  }
  function mensajeSala(m) {
    if (m.t === "abierta") { SL.pub = !!m.on; if (SL.abierta) { try { A.reemplazarModal(SL.vista); } catch (e) { SL.abierta = false; } } syncSalasTrasEvento(); return; }
    if (m.t === "nombre") {
      SL.nombre = limpiarNomSala(m.nombre); if (m.nomEn) SL.nomEn = Number(m.nomEn) || SL.nomEn;
      if (SL.cod) guardarNomSala(SL.cod, SL.nombre, false);
      pintarSalaPildora(); if (SL.abierta) { try { A.reemplazarModal(SL.vista); } catch (e) { SL.abierta = false; } } syncSalasTrasEvento(); return;
    }
    if (m.t === "estado") {
      const antesN = SL.miembros.length, antesPub = SL.pub;
      if (m.abierta !== undefined) SL.pub = !!m.abierta;
      if (m.nombre !== undefined) SL.nombre = limpiarNomSala(m.nombre);
      if (m.nomEn) SL.nomEn = Number(m.nomEn) || SL.nomEn;
      SL.miembros = m.miembros || []; SL.anf = m.anf || ""; if (m.yo) SL.yo6 = m.yo;
      const yo = SL.miembros.find((x) => x.j === SL.yo6); SL.guia = !!(yo && yo.guia);
      pintarSalaPildora(); pintarMarcas(); if (S.yo) pintarMedidor();
      if (SL.abierta) { try { A.reemplazarModal(SL.vista); } catch (e) { SL.abierta = false; } }
      if (antesN !== SL.miembros.length || antesPub !== SL.pub) syncSalasTrasEvento();
    } else if (m.t === "pos") {
      const x = SL.miembros.find((y) => y.j === m.j); const antes = bonoSalaVivo(); if (x) { x.lc = m.lc; x.v = m.v; x.guia = !!m.guia; }
      pintarMarcas(); if (S.yo && antes !== bonoSalaVivo()) pintarMedidor();
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
    const lc = R.lib ? R.lib + "." + R.cap : SL.lcAct;
    if (!SL.ws || SL.ws.readyState !== 1 || !lc) return;
    const v = R.lib ? versoVisible() : 0; const k = lc + ":" + v;
    if (k === SL.pos || (!ya && Date.now() - SL.ultPos < 3000)) return;
    SL.pos = k; SL.ultPos = Date.now();
    try { SL.ws.send(JSON.stringify({ t: "pos", lc, v })); } catch (e) { /* ignorar */ }
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
    document.documentElement.classList.toggle("jg-con-sala", !!SL.cod);
    if (!SL.cod) { if (p) p.remove(); return; }
    // AL6 (BiEx, 22-nov-2026): la píldora vive entre las dos partes del pie (pegada al borde mientras se lee; en su hueco al final)
    if (!p) p = h("button", { class: "jg-sala-p", type: "button", onclick: abrirSala });
    const anclaP = document.getElementById("pie-b");
    if (anclaP ? p.nextElementSibling !== anclaP : !p.isConnected) anclaP ? anclaP.before(p) : document.body.append(p);
    const n = SL.miembros.length, conectada = SL.ws && SL.ws.readyState === 1, nom = nombreSalaDe(SL.cod, SL.nombre);
    const et = nom ? nom : "Sala " + SL.cod;
    p.replaceChildren(h("i", { class: conectada ? "on" : "", "aria-hidden": "true" }), h("span", { text: et }), h("b", { text: conectada ? plural(n, "persona", "personas") : "conectando…" }));
    p.setAttribute("aria-label", et + " (" + SL.cod + "): " + (conectada ? plural(n, "persona", "personas") : "conectando"));
  }
  function abrirSala() {
    const vistaS = () => {
      const anf = SL.miembros.find((x) => x.anf);
      const lista = h("ul", { class: "jg-lista mini sala" }, SL.miembros.map((x) => { const [l, c] = embDe(x.emb); const [lib, cap] = (x.lc || "").split(".");
        return h("li", { class: "jg-fila" + (x.j === SL.yo6 ? " yo" : "") }, emblema(l, c, x.marco, x.foto), h("span", { class: "n" }, nombreClicable(x.apodo), h("small", { text: [x.anf ? "anfitrión" : "", resumenStatsPub(x), x.pais ? nombrePais(x.pais) : "", x.lc ? nombreLibro(lib) + " " + cap + (x.v ? ":" + x.v : "") + (x.guia ? " · guía la lectura" : "") : "todavía no abre un capítulo"].filter(Boolean).join(" · ") })),
          x.lc && x.j !== SL.yo6 ? h("a", { class: "btn chico", href: "#/" + lib + "/" + cap + "/l" + (x.v ? "/" + x.v : ""), onclick: () => A.cerrarModal() }, h("span", { text: "Ir" })) : null); }));
      const soyAnf = !anf || anf.j === SL.yo6;
      const nomAct = nombreSalaDe(SL.cod, SL.nombre);
      const ren = puedeRenombrarSala(SL.cod);
      const renIn = h("input", { type: "text", maxlength: "36", value: nomAct, placeholder: "Nombre de la sala (ej. Estudio de Mattáy)", "aria-label": "Nombre de la sala", disabled: !ren.ok });
      const renPista = h("p", { class: "jg-pista", role: "status" });
      const renombrar = async (ev) => {
        const nuevo = limpiarNomSala(renIn.value);
        if (!nuevo) { renPista.textContent = "Escribe un nombre de entre 2 y 36 caracteres."; renPista.className = "jg-pista mal"; return; }
        if (nuevo.length < 2) { renPista.textContent = "El nombre debe tener al menos 2 caracteres."; renPista.className = "jg-pista mal"; return; }
        const st = puedeRenombrarSala(SL.cod);
        if (!st.ok) { renPista.textContent = "Ya cambiaste el nombre hoy · disponible en " + restaTexto(Date.now() + st.faltaMs) + "."; renPista.className = "jg-pista mal"; return; }
        const bt = ev.currentTarget; bt.disabled = true;
        const r = await pedir("/sala/nombre", { metodo: "POST", cuerpo: { c: SL.cod, nombre: nuevo } });
        bt.disabled = false;
        if (r && r.error === "nombre_espera") { renPista.textContent = mensaje(r); renPista.className = "jg-pista mal"; return; }
        try { if (SL.ws && SL.ws.readyState === 1) SL.ws.send(JSON.stringify({ t: "nombre", nombre: nuevo })); } catch (e) { /* ignorar */ }
        guardarNomSala(SL.cod, nuevo, true);
        pintarSalaPildora(); syncSalasTrasEvento();
        A.avisar("Nombre de la sala actualizado a «" + nuevo + "»");
        if (SL.abierta) { try { A.reemplazarModal(vistaS); } catch (e) { SL.abierta = false; } }
      };
      const cajaNom = soyAnf ? h("div", { class: "jg-sala-nom" },
        h("div", { class: "jg-sala-nom-cab" }, h("span", { text: "Nombre de la sala" }), h("small", { text: ren.ok ? "Se puede cambiar 1 vez al día" : "Próximo cambio en " + restaTexto(Date.now() + ren.faltaMs) })),
        h("div", { class: "jg-form" }, renIn, h("button", { class: "btn chico", type: "button", disabled: !ren.ok, onclick: renombrar }, h("span", { text: "Guardar" }))),
        renPista) : null;
      return A.cajaModal(A.cabModal(nomAct ? nomAct : "Sala " + SL.cod, nomAct ? "Sala " + SL.cod + " · Lectura en compañía" : "Lectura en compañía"), h("div", { class: "jg" },
        h("p", { class: "jg-mini", text: "Cuando al menos dos personas de la sala leen el mismo capítulo, cada verso les da un 25 % más de experiencia (crear la sala no basta)." }), lista,
        cajaNom,
        soyAnf ? h("label", { class: "jg-check" }, h("input", { type: "checkbox", checked: SL.pub !== false, onchange: (e) => { try { SL.ws.send(JSON.stringify({ t: "abierta", on: e.currentTarget.checked })); } catch (er) { /* ignorar */ } } }), h("span", { text: "Sala abierta: aparece en la lista de Juntos y cualquiera puede entrar" })) : null,
        soyAnf ? h("label", { class: "jg-check" }, h("input", { type: "checkbox", checked: SL.guia, onchange: (e) => { try { SL.ws.send(JSON.stringify({ t: "guia", on: e.currentTarget.checked })); } catch (er) { /* ignorar */ } } }), h("span", { text: "Guiar la lectura (quien te siga irá contigo)" }))
          : anf && anf.guia ? h("label", { class: "jg-check" }, h("input", { type: "checkbox", checked: SL.seguir, onchange: (e) => { SL.seguir = e.currentTarget.checked; if (SL.seguir && anf.lc) seguirA(anf); } }), h("span", { text: "Seguir a " + anf.apodo })) : null,
        h("div", { class: "jg-acciones" },
          R.lib ? h("button", { class: "btn", type: "button", onclick: () => { const v = versoVisible(); if (v && SL.ws && SL.ws.readyState === 1) { SL.ws.send(JSON.stringify({ t: "luz", lc: R.lib + "." + R.cap, v })); sonar("chispa"); A.avisar("Quienes están en la sala ven ahora una luz en el verso " + v); } }, title: "Enciende por unos segundos una luz en el verso que tienes en pantalla, para que los demás lo vean en su texto" }, ico("idea"), h("span", { text: "Señalar este verso a la sala" })) : null,
          h("button", { class: "btn oro", type: "button", onclick: () => compartir("Escudriña · leamos juntos", "Leamos juntos la Nueva Voluntad en Escudriña: entra a mi sala" + (nomAct ? " «" + nomAct + "»" : "") + ".", PUBLICO + "/#/escudrina/sala/" + SL.cod) }, ico("compartir"), h("span", { text: "Invitar" })),
          h("button", { class: "btn", type: "button", onclick: () => { salirSala(false); SL.abierta = false; A.cerrarModal(); } }, h("span", { text: "Salir de la sala" })))));
    };
    SL.vista = vistaS; SL.abierta = true;
    A.abrirModal(vistaS, () => { SL.abierta = false; });
  }
  // ================================================================== salas abiertas y quién está leyendo (tanda 3)
  // Neon (23-nov-2026): salvaguarda de visibilidad total de salas abiertas — refresco inmediato al abrir WS/cambiar visibilidad,
  // salto de caché de borde en recargas explícitas y respaldo optimista de la sala propia abierta si el servidor aún no la devuelve.
  const VIVO = { salas: null, ts: 0, err: false, pres: new Map(), onSalas: null, tSync: 0 };
  function syncSalasTrasEvento() {
    VIVO.salas = null;
    clearTimeout(VIVO.tSync);
    const run = () => salasAbiertas("fresco").then((L) => { if (VIVO.onSalas) VIVO.onSalas(L); });
    run();
    VIVO.tSync = setTimeout(run, 1800);
  }
  async function salasAbiertas(forzar) {
    const fresco = forzar === "fresco";
    if (!forzar && VIVO.salas && Date.now() - VIVO.ts < 30e3) return VIVO.salas;
    const r = await pedir("/salas" + (fresco ? "?_=" + Date.now() : ""), { sin: true });
    if (r.error) { VIVO.err = true; return VIVO.salas || []; }
    VIVO.err = false;
    VIVO.salas = Array.isArray(r.salas) ? r.salas : []; VIVO.ts = Date.now();
    insigniaSalas();
    return VIVO.salas;
  }
  // AL16 (BiEx, 22-nov-2026, 19:02): el número de «Juntos» son las salas abiertas de otras personas (la propia no cuenta). Se apaga al
  // entrar en Juntos, donde «Salas abiertas» dice cuántas hay, y vuelve solo si se abre una sala nueva (como las demás insignias)
  function insigniaSalas() {
    const j = MU && MU.querySelector('a[data-s="juntos"]'); if (!j) return;
    const otras = (VIVO.salas || []).filter((x) => x.c !== SL.cod), firma = otras.map((x) => x.c).sort().join(",");
    const visto = A.store.get("jg:insig", null) || {};
    if (!otras.length) { j.removeAttribute("data-n"); j.removeAttribute("title"); return; }
    if (j.classList.contains("act")) { j.removeAttribute("data-n"); if (visto.juntos !== firma) { visto.juntos = firma; A.store.set("jg:insig", visto); } return; }
    if (visto.juntos === firma) { j.removeAttribute("data-n"); j.removeAttribute("title"); return; }
    j.setAttribute("data-n", String(otras.length)); j.title = otras.length === 1 ? "Hay 1 sala abierta para leer en compañía" : "Hay " + otras.length + " salas abiertas para leer en compañía";
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
      else { const r = await pedir("/sala/crear", { metodo: "POST", cuerpo: { abierta: true, lc } }); if (r.error) return A.avisar(mensaje(r)); SL.pub = true; SL.lcCreada = lc; entrarSala(r.cod); A.avisar("Abriste una sala en " + nombreLC(lc) + ": quien lea aquí puede acompañarte"); }
      VIVO.salas = null; VIVO.pres.clear(); syncSalasTrasEvento();
      const [lib, cap] = lc.split("."); if (R.lib !== lib || R.cap !== +cap) A.irA("#/" + lib + "/" + cap);
    } finally { if (boton) boton.disabled = false; }
  }
  function tarjetaSalasAbiertas() {
    const zona = h("div", { class: "jg-salas" }, h("p", { class: "jg-mini", text: "Buscando salas abiertas…" }));
    const combinarSalas = (srv) => {
      const lista = Array.isArray(srv) ? srv.slice() : [];
      // Salvaguarda optimista: si tu propia sala está abierta y el servidor aún no la incluyó (caché o apertura en curso), se muestra siempre
      if (SL.cod && SL.pub !== false && !lista.some((x) => x.c === SL.cod)) {
        const y = S.yo || {}, e = y.emb || {};
        const anf = SL.miembros.find((m) => m.anf);
        lista.unshift({
          c: SL.cod,
          nombre: nombreSalaDe(SL.cod, SL.nombre),
          lc: (anf && anf.lc) || (R.lib ? R.lib + "." + R.cap : SL.lcAct || SL.lcCreada || ultimoLC() || ""),
          anf: (anf && anf.apodo) || y.apodo || "Tú",
          emb: (e.l || "α") + String(e.c || 0),
          marco: marcoVisible(y),
          foto: y.foto ? y.inv + "." + y.foto : "",
          poder: y.av && y.av.poder != null ? y.av.poder : null,
          n: Math.max(1, SL.miembros.length || 1),
          _loc: true,
        });
      }
      return lista;
    };
    const pintar = (srv) => {
      if (!zona.isConnected && zona.dataset.ok) return;
      zona.dataset.ok = "1";
      const L = combinarSalas(srv);
      const btnRef = h("button", { class: "btn chico jg-salas-ref", type: "button", onclick: async (e) => {
        const b = e.currentTarget; b.disabled = true;
        const fresh = await salasAbiertas("fresco");
        b.disabled = false; pintar(fresh);
      } }, h("span", { text: "Actualizar" }));
      if (!L.length) {
        const msg = VIVO.err ? "No se pudo consultar la lista de salas ahora. Toca «Actualizar» para reintentarlo."
          : "Ahora no hay salas abiertas. Crea una y aparecerá aquí para que cualquiera pueda acompañarte.";
        return zona.replaceChildren(h("div", { class: "jg-salas-cab" }, h("p", { class: "jg-mini jg-salas-n", text: msg }), btnRef));
      }
      const otras = L.filter((x) => x.c !== SL.cod).length;
      const totTxt = L.length === 1
        ? (otras ? "Ahora hay 1 sala abierta de otra persona." : "Tu sala está abierta ahora.")
        : "Ahora hay " + fmt(L.length) + " salas abiertas" + (otras && SL.cod && L.some((x) => x.c === SL.cod) ? " (" + plural(otras, "otra disponible para cambiar", "otras disponibles para cambiar") + ")." : ".");
      zona.replaceChildren(
        h("div", { class: "jg-salas-cab" }, h("p", { class: "jg-mini jg-salas-n", text: totTxt }), btnRef),
        h("ul", { class: "jg-salas-l" }, L.map((x) => { const [l, c] = embDe(x.emb); const esMia = x.c === SL.cod; const nomS = nombreSalaDe(x.c, x.nombre);
          return h("li", { class: esMia ? "yo" : "" }, emblema(l, c, x.marco || 0, x.foto),
            h("span", { class: "n" },
              h("b", {}, nomS ? nomS + " · " + nombreLC(x.lc) : nombreLC(x.lc), esMia ? h("span", { class: "jg-sala-est", text: x._loc ? "Activa · sincronizando" : "Tu sala activa" }) : null),
              h("small", {}, "Sala " + x.c + " · de ", x.anf ? nombreClicable(x.anf) : "un lector", (x.poder != null ? " · poder " + fmt(x.poder) : "") + " · " + plural(x.n, "persona", "personas"))),
            esMia ? h("button", { class: "btn chico", type: "button", onclick: abrirSala }, h("span", { text: "Abrir" }))
              : h("button", { class: "btn chico oro", type: "button", onclick: (e) => { e.currentTarget.disabled = true; const cambiaba = !!SL.cod; entrarSala(x.c); A.avisar((cambiaba ? "Cambiaste a la sala " : "Entraste a la sala ") + (nomS || x.c)); syncSalasTrasEvento(); if (x.lc) A.irA("#/" + x.lc.replace(".", "/")); else repintar(); } }, h("span", { text: SL.cod ? "Cambiarme" : "Entrar" }))); })));
    };
    VIVO.onSalas = (L) => { if (zona.isConnected) pintar(L); else VIVO.onSalas = null; };
    salasAbiertas("fresco").then(pintar);
    enVivo(zona, 30e3, () => salasAbiertas(true).then(pintar));
    return tarjeta("Salas abiertas", ico("sala"), h("p", { class: "jg-mini", text: "Todas las salas de lectura abiertas aparecen aquí aunque ya estés en una, para que puedas entrar o cambiarte en cualquier momento." }), zona);
  }
  // Mundo: las luces de los 27 libros (quién lee ahora) y los lectores con «Acompañar»
  function tarjetaQuienLee() {
    const zona = h("div", { class: "jg-quien" }, h("p", { class: "jg-mini", text: "Mirando quién lee ahora…" }));
    let libSel = "", detAb = false, firma = "";
    const ver = async (lib, vivo) => {
      libSel = lib || "";
      const r = await presentes(lib || ""); if (r.error) { if (!vivo) zona.replaceChildren(h("p", { class: "jg-mini", text: mensaje(r) })); return; }
      const f = JSON.stringify([lib, r.libros, r.caps, (r.lectores || []).map((x) => [x.a, x.l, x.act]), r.salas]); if (vivo && f === firma) return; firma = f;
      const libros = (S.cfg && S.cfg.orden) || Object.keys(r.libros || {}), max = Math.max(1, ...Object.values(r.libros || { x: 1 }));
      const mapa = h("div", { class: "jg-luces", role: "list" }, (libros.length ? libros : Object.keys(r.libros || {})).map((b) => { const n = (r.libros || {})[b] || 0;
        return h("button", { class: "jg-lz" + (n ? " on" : "") + (b === lib ? " sel" : ""), type: "button", role: "listitem", style: "--k:" + (n ? (0.35 + 0.65 * n / max).toFixed(2) : 0), "aria-label": nombreLibro(b) + ": " + plural(n, "persona", "personas"), title: nombreLibro(b), onclick: () => ver(b === lib ? "" : b) },
          h("span", { text: corto(b) }), n ? h("b", { text: String(n) }) : null); }));
      const caps = Object.entries(r.caps || {}).sort((a, b) => b[1] - a[1]).slice(0, 12);
      const filas = caps.map(([lc, n]) => h("li", {}, h("span", { class: "n" }, h("b", { text: nombreLC(lc) }), h("small", { text: plural(n, "persona lee", "personas leen") + ((r.salas || {})[lc] ? " · sala abierta" : "") })),
        h("button", { class: "btn chico oro", type: "button", onclick: (e) => acompanar(lc, e.currentTarget) }, h("span", { text: "Acompañar" }))));
      const quien = (r.lectores || []).slice(0, 12).map((x) => { const [l, c] = embDe(x.e), actTxt = x.act ? x.act + (x.l ? " · " + nombreLC(x.l) : "") : nombreLC(x.l);
        return h("li", {}, emblema(l, c, x.m, x.f), h("span", { class: "n" }, nombreClicable(x.a || "Lector"), h("small", { text: "nivel " + x.nv + (x.poder != null ? " · poder " + fmt(x.poder) : "") + " · " + actTxt })),
          x.l ? h("button", { class: "btn chico", type: "button", onclick: (e) => acompanar(x.l, e.currentTarget) }, h("span", { text: "Acompañar" })) : null); });
      zona.replaceChildren(h("p", { class: "jg-total" }, cifra(r.total || 0), " " + (r.total === 1 ? "persona lee" : "personas leen") + " ahora" + (lib ? " · " + nombreLibro(lib) : "")), mapa,
        filas.length ? h("ul", { class: "jg-salas-l" }, filas) : h("p", { class: "jg-mini", text: lib ? "Nadie lee " + nombreLibro(lib) + " en este momento." : "Cuando alguien lea, su libro se encenderá aquí." }),
        quien.length ? h("details", { class: "jg-pc", open: detAb || null, ontoggle: (e) => { detAb = e.currentTarget.open; } }, h("summary", {}, h("span", { text: "Quiénes leen" }), h("small", { text: plural(quien.length, "lector", "lectores") })), h("ul", { class: "jg-salas-l quien" }, quien)) : null);
      if (!vivo) animarCifras(zona);
    };
    ver("");
    enVivo(zona, 30e3, () => { VIVO.pres.delete(libSel); return ver(libSel, true); });
    return tarjeta("Quién está leyendo", ico("mundo"), h("p", { class: "jg-mini", text: "Cada libro brilla según cuántas personas lo leen ahora. Toca uno para ver sus capítulos, y «Acompañar» para leer con quien está ahí (entras a su sala o abres una nueva)." }), zona);
  }
  function tarjetaSala() {
    const cod = h("input", { type: "text", maxlength: "8", autocapitalize: "characters", placeholder: "Código de sala (6)", "aria-label": "Código de la sala", spellcheck: "false" });
    const nomIn = h("input", { class: "jg-in", type: "text", maxlength: "36", placeholder: "Nombre de la sala (opcional)", "aria-label": "Nombre opcional de la sala" });
    const pista = h("p", { class: "jg-pista", role: "status" });
    const ab = h("input", { type: "checkbox", checked: true });
    const crear = async (e) => {
      const bt = e.currentTarget; bt.disabled = true;
      const lc = R.lib ? R.lib + "." + R.cap : (SL.lcAct || ultimoLC());
      const nom = limpiarNomSala(nomIn.value);
      const r = await pedir("/sala/crear", { metodo: "POST", cuerpo: Object.assign({ abierta: ab.checked, lc }, nom ? { nombre: nom } : {}) });
      bt.disabled = false;
      if (r.error) { pista.textContent = mensaje(r); pista.className = "jg-pista mal"; return; }
      SL.pub = r.abierta !== false; SL.lcCreada = lc || ""; VIVO.salas = null;
      if (nom) guardarNomSala(r.cod, nom, false);
      entrarSala(r.cod);
      A.avisar((nom ? "Sala «" + nom + "» (" + r.cod + ")" : "Sala " + r.cod) + (r.abierta !== false ? " abierta: aparece en la lista y puedes invitar a quien quieras" : " creada: entra quien tenga su enlace"));
      repintar();
      syncSalasTrasEvento();
    };
    const formEntrar = h("div", { class: "jg-form" }, cod, h("button", { class: "btn", type: "button", onclick: async () => { const c = cod.value.trim().toUpperCase(); const i = await pedir("/sala/info?c=" + encodeURIComponent(c), { sin: true });
      if (i.error) { pista.textContent = "Esa sala no existe o ya venció."; pista.className = "jg-pista mal"; return; } entrarSala(c); repintar(); syncSalasTrasEvento(); } }, h("span", { text: SL.cod ? "Cambiarme" : "Entrar" })));
    if (SL.cod) {
      const nomAct = nombreSalaDe(SL.cod, SL.nombre);
      const anf = SL.miembros.find((x) => x.anf);
      const soyAnf = !anf || anf.j === SL.yo6;
      const ren = puedeRenombrarSala(SL.cod);
      const renIn = h("input", { type: "text", maxlength: "36", value: nomAct, placeholder: "Nombre de la sala (2 a 36)", "aria-label": "Nombre de tu sala activa", disabled: !ren.ok });
      const renPista = h("p", { class: "jg-pista", role: "status" });
      const renombrarDir = async (ev) => {
        const nuevo = limpiarNomSala(renIn.value);
        if (nuevo.length < 2) { renPista.textContent = "Escribe un nombre de entre 2 y 36 caracteres."; renPista.className = "jg-pista mal"; return; }
        const st = puedeRenombrarSala(SL.cod);
        if (!st.ok) { renPista.textContent = "Ya cambiaste el nombre hoy · disponible en " + restaTexto(Date.now() + st.faltaMs) + "."; renPista.className = "jg-pista mal"; return; }
        const bt = ev.currentTarget; bt.disabled = true;
        const r = await pedir("/sala/nombre", { metodo: "POST", cuerpo: { c: SL.cod, nombre: nuevo } });
        bt.disabled = false;
        if (r && r.error === "nombre_espera") { renPista.textContent = mensaje(r); renPista.className = "jg-pista mal"; return; }
        try { if (SL.ws && SL.ws.readyState === 1) SL.ws.send(JSON.stringify({ t: "nombre", nombre: nuevo })); } catch (e) { /* ignorar */ }
        guardarNomSala(SL.cod, nuevo, true);
        pintarSalaPildora(); syncSalasTrasEvento();
        A.avisar("Nombre de la sala actualizado a «" + nuevo + "»");
        repintar();
      };
      const cajaRen = soyAnf ? h("div", { class: "jg-sala-nom" },
        h("div", { class: "jg-sala-nom-cab" }, h("span", { text: "Nombre de tu sala" }), h("small", { text: ren.ok ? "Se puede cambiar 1 vez al día" : "Próximo cambio en " + restaTexto(Date.now() + ren.faltaMs) })),
        h("div", { class: "jg-form" }, renIn, h("button", { class: "btn chico", type: "button", disabled: !ren.ok, onclick: renombrarDir }, h("span", { text: "Guardar" }))),
        renPista) : null;
      return tarjeta("Leer en compañía", ico("sala"), h("p", {}, "Estás activo en ", h("b", { text: nomAct ? "«" + nomAct + "» (" + SL.cod + ")" : "la sala " + SL.cod }), " con " + plural(SL.miembros.length, "persona", "personas") + ". El bono del +25 % suma únicamente por tu sala activa."),
        h("div", { class: "jg-acciones" }, h("button", { class: "btn oro", type: "button", onclick: abrirSala }, ico("sala"), h("span", { text: "Abrir la sala" }))),
        cajaRen,
        h("details", { class: "jg-sala-extra" }, h("summary", { text: "Crear otra sala o entrar por código" }),
          h("div", { class: "jg-sala-extra-c" },
            nomIn,
            h("label", { class: "jg-check" }, ab, h("span", { text: "Sala abierta (aparece en la lista de salas y cualquiera puede entrar)" })),
            h("div", { class: "jg-acciones" }, h("button", { class: "btn chico oro", type: "button", onclick: crear }, ico("sala"), h("span", { text: "Crear otra sala" }))),
            formEntrar, pista)));
    }
    return tarjeta("Leer en compañía", ico("sala"), h("p", { text: "Crea una sala con el nombre que elijas y comparte su enlace: verán dónde lee cada quien, en vivo, y mientras lean el mismo capítulo cada verso da un 25 % más de experiencia." }),
      nomIn,
      h("label", { class: "jg-check" }, ab, h("span", { text: "Sala abierta (aparece en la lista de salas y cualquiera puede entrar)" })),
      h("div", { class: "jg-acciones" }, h("button", { class: "btn oro", type: "button", onclick: crear }, ico("sala"), h("span", { text: "Crear una sala" }))),
      formEntrar, pista);
  }
  async function pintarSalaRuta(cont, cod) {
    cod = String(cod || "").toUpperCase();
    document.title = "Sala de lectura · Escudriña · BiEx";
    const zona = h("div", { class: "jg" }, h("p", { class: "cargando", text: "Entrando a la sala…" }));
    marco(cont, cabSub("Lectura en compañía", "Lean juntos, en vivo: cada quien ve dónde lee el resto.", "#/escudrina/juntos"), zona);
    const i = await pedir("/sala/info?c=" + encodeURIComponent(cod), { sin: true });
    if (cont !== S.cont || !zona.isConnected) return;
    if (i.error) return zona.replaceChildren(tarjeta(null, null, h("p", { text: "Esa sala no existe o ya venció (duran 7 días). Puedes crear una nueva desde tu panel." }), h("a", { class: "btn", href: "#/escudrina" }, h("span", { text: "Ir a mi panel" }))));
    if (i.nombre) guardarNomSala(cod, i.nombre, false);
    entrarSala(cod); A.store.set("jg:salaInv", null);
    const nomS = nombreSalaDe(cod, i.nombre);
    zona.replaceChildren(h("section", { class: "jg-tarjeta jg-heroe" }, h("p", { class: "jg-tit", text: nomS ? nomS : "Sala " + cod }), h("p", { class: "jg-mini", text: (nomS ? "Sala " + cod + " · " : "") + "La creó " + i.anf + " · " + plural(i.n, "persona", "personas") + " ahora" }),
      h("div", { class: "jg-acciones" }, h("button", { class: "btn oro", type: "button", onclick: () => { const a = SL.miembros.find((x) => x.anf); if (a && a.lc) { const [l, c] = a.lc.split("."); A.irA("#/" + l + "/" + c + "/l" + (a.v ? "/" + a.v : "")); } else A.irA("#/MAT/1"); } }, h("span", { text: "Ir a leer con " + i.anf })),
        h("button", { class: "btn", type: "button", onclick: abrirSala }, ico("sala"), h("span", { text: "Ver la sala" })))));
    animarCifras(zona);
  }
  // al volver al lector con una sala abierta (en las últimas 12 h), se reconecta sola
  function retomarSala() { const s = A.store.get("jg:sala", null); if (s && s.c && Date.now() - (s.t || 0) < 12 * 3600e3 && !SL.cod && S.token) entrarSala(s.c); }

  // ================================================================== presencia en vivo (POST /presencia) y ficha pública (GET /jugador)
  const PRES = { act: "", lc: "", t: 0, iv: 0, visEsc: false };
  function actividadDeRuta(ruta) {
    const hh = String(ruta || location.hash || "");
    const m = /^#\/([1-3A-Z]{3})\/(\d{1,3})(?:\/([alo]))?/.exec(hh);
    if (SL.cod) return { act: "En sala", lc: R.lib ? R.lib + "." + R.cap : (m ? m[1] + "." + m[2] : SL.lcAct || "") };
    if (m) return { act: m[3] === "a" ? "Analizando" : "Leyendo", lc: m[1] + "." + m[2] };
    if (/^#\/fuente-q\b/i.test(hh)) return { act: "En Fuente Q", lc: "" };
    if (/^#\/escudrina\b/i.test(hh)) return { act: "En Escudriña", lc: "" };
    return { act: "", lc: "" };
  }
  function latirPresencia(forzar, ruta) {
    if (!S.token || document.hidden) return;
    const { act, lc } = actividadDeRuta(ruta);
    if (!act) return;
    const ahora = Date.now();
    if (!forzar && act === PRES.act && lc === PRES.lc && ahora - PRES.t < 70e3) return;
    PRES.act = act; PRES.lc = lc; PRES.t = ahora;
    pedir("/presencia", { metodo: "POST", cuerpo: lc ? { act, lc } : { act } }).catch(() => {});
  }
  function iniciarPresencia() {
    if (!PRES.iv) PRES.iv = setInterval(() => latirPresencia(false), 90e3);
    if (!PRES.visEsc) {
      PRES.visEsc = true;
      document.addEventListener("visibilitychange", () => { if (!document.hidden) latirPresencia(false); });
    }
  }
  const CACHE_JUG = new Map();
  const ET_PUB = [[1, "I", "Semilla", "#c9813f", "#8a4c14"], [2, "II", "Brote", "#c3ccd8", "#425062"], [3, "III", "Raíz honda", "#f0c04a", "#7f5c0f"], [4, "IV", "Copa", "#ffe39a", "#6b4b09"], [5, "V", "Fruto", "#ff7d93", "#9c1d38"]];
  function nombreClicable(apodo) {
    const ap = String(apodo || "").trim();
    if (!ap || /^lector\b/i.test(ap) || /^tú$/i.test(ap)) return h("b", { text: ap || "Lector" });
    return h("button", { class: "jg-jug-btn", type: "button", title: "Ver perfil público de " + ap, onclick: (e) => { e.stopPropagation(); abrirJugadorPublico(ap); } }, ap);
  }
  const ET_UMBRAL = [0, 250, 600, 1200, 2400];
  function abrirJugadorPublico(apodo) {
    const ap = String(apodo || "").trim();
    if (!ap) return;
    estilos();
    const zona = h("div", { class: "jg-jp" }, h("p", { class: "cargando", text: "Cargando perfil de " + ap + "…" }));
    A.abrirModal(() => A.cajaModal(A.cabModal(ap, "Perfil público · Escudriña"), zona));
    const pintar = (j) => {
      if (!zona.isConnected) return;
      if (!j || j.error) {
        return zona.replaceChildren(h("p", { class: "jg-mini jg-jp-priv", text: "Este lector mantiene su perfil reservado o aún no tiene datos públicos disponibles." }));
      }
      const [l, c] = embDe(j.emb);
      const poder = Math.max(0, j.poder | 0);
      const etN = Math.max(1, Math.min(5, (j.etapa | 0) || (poder >= 2400 ? 5 : poder >= 1200 ? 4 : poder >= 600 ? 3 : poder >= 250 ? 2 : 1)));
      const et = ET_PUB[etN - 1];
      const baseEt = ET_UMBRAL[etN - 1], sigEt = ET_UMBRAL[etN] || null;
      const pctEt = sigEt ? Math.max(4, Math.min(100, Math.round((100 * (poder - baseEt)) / Math.max(1, sigEt - baseEt)))) : 100;
      const lugar = [j.ciudad, j.pais ? nombrePais(j.pais) : ""].filter(Boolean).join(" · ");
      const chips = [];
      chips.push(h("span", { class: "jg-chip jg-jp-et", style: "--et:" + et[3] + ";--et-l:" + et[4], text: "Etapa " + et[1] + " · " + et[2] }));
      if (j.fundador && j.n) chips.push(h("span", { class: "jg-chip", text: "Primicia n.º " + fmt(j.n) }));
      if (j.marco && marcos()[j.marco - 1]) chips.push(h("span", { class: "jg-chip tenue", text: marcos()[j.marco - 1][1] }));
      const hero = h("section", { class: "jg-jp-hero", style: "--et:" + et[3] + ";--et-l:" + et[4] },
        h("div", { class: "jg-jp-emb-wrap" },
          h("span", { class: "jg-jp-aro", "aria-hidden": "true" }),
          h("span", { class: "jg-jp-aro b", "aria-hidden": "true" }),
          h("span", { class: "jg-jp-emb" }, emblema(l, c, j.marco, j.foto))),
        h("div", { class: "jg-jp-id" },
          h("h3", { text: j.apodo || ap }),
          h("p", { class: "jg-mini", text: (j.rangoNombre || "Lector") + " · nivel " + fmt(j.nivel | 0) + (lugar ? " · " + lugar : "") })),
        h("div", { class: "jg-chips" }, chips),
        h("div", { class: "jg-jp-track" },
          h("div", { class: "jg-jp-tr-cab" },
            h("span", { text: sigEt ? "Camino a Etapa " + ET_PUB[etN][1] + " (" + fmt(sigEt) + ")" : "Etapa cumbre alcanzada" }),
            h("b", { text: fmt(poder) + " poder" })),
          h("div", { class: "jg-jp-bar", "aria-hidden": "true" }, h("i", { style: "width:" + pctEt + "%" })),
          h("div", { class: "jg-jp-pasos", "aria-hidden": "true" }, ET_PUB.map(([n, rom]) => h("span", { class: n <= etN ? "on" : "", text: rom })))));
      const vivo = j.act || j.lc ? h("div", { class: "jg-jp-vivo" },
        h("span", { class: "jg-jp-dot", "aria-hidden": "true" }),
        h("span", {}, h("b", { text: j.act || "En línea" }), j.lc ? " · " + nombreLC(j.lc) : ""),
        j.lc ? h("a", { class: "btn chico", href: "#/" + j.lc.replace(".", "/"), onclick: () => A.cerrarModal() }, h("span", { text: "Ir" })) : null) : null;
      const lauros = j.lauros || {}, piedrasN = Math.max(0, Math.min(12, j.piedrasN | 0));
      const tiles = [
        ["arbol", fmt(poder), "Poder", "Etapa " + et[1] + " · " + et[2], null],
        ["arriba", "Nivel " + fmt(j.nivel | 0), j.rangoNombre || "Lector", j.fundador ? "Primicia" : "Rango actual", null],
        ["llama", plural(j.pers | 0, "día", "días"), "Perseverancia", "mejor: " + fmt(j.persMejor | 0) + " d", null],
        ["libro", fmt(j.vc | 0), "Versos leídos", j.lk ? plural(j.lk, "lectura plena", "lecturas plenas") : "confirmados", null],
        ["dracma", piedrasN + " / 12", "Piedras", lauros.doce ? "fundamento completo" : "del fundamento", h("span", { class: "jg-jp-gemas", "aria-hidden": "true" }, Array.from({ length: 12 }, (_, k) => h("i", { class: k < piedrasN ? "on" : "" })))],
        ["liga", fmt(lauros.trenzado | 0), "Lauros", lauros.libros ? plural(lauros.libros, "libro completo", "libros completos") : "trenzados", null],
      ];
      const miPoder = S.yo && S.yo.av ? (S.yo.av.poder | 0) : null;
      const esOtro = S.yo && S.yo.apodo && S.yo.apodo !== (j.apodo || ap);
      const pie = h("div", { class: "jg-jp-pie" },
        h("span", { text: esOtro && miPoder != null ? "Tu poder actual: " : "Códice Viviente · " }, esOtro && miPoder != null ? h("b", { text: fmt(miPoder) }) : h("b", { text: "Escudriña" })),
        h("span", { text: esOtro && miPoder != null ? (poder > miPoder ? "Te lleva " + fmt(poder - miPoder) + " de poder · ¡gran meta!" : poder === miPoder ? "¡Exactamente al mismo poder!" : "Llevas " + fmt(miPoder - poder) + " de ventaja") : "Cada verso confirmado forja el árbol interior" }));
      zona.replaceChildren(
        hero,
        vivo,
        h("ul", { class: "jg-jp-grid" }, tiles.map(([ic, v, t, s, ex]) => h("li", {}, h("span", { class: "jg-jp-ico", "aria-hidden": "true" }, ico(ic)), h("b", { text: v }), h("span", { text: t }), h("small", { text: s }), ex))),
        pie);
    };
    const hit = CACHE_JUG.get(ap);
    if (hit && Date.now() - hit.t < 20e3) return pintar(hit.d);
    pedir("/jugador?a=" + encodeURIComponent(ap), { sin: true }).then((r) => {
      if (!r.error) { if (CACHE_JUG.size > 40) CACHE_JUG.clear(); CACHE_JUG.set(ap, { t: Date.now(), d: r }); }
      pintar(r);
    });
  }

  // ------------------------------------------------------------------ interfaz pública del módulo
  // solo para las pruebas automáticas (navegador controlado): efectos a demanda
  if (navigator.webdriver) window.__biexJg = { chispas, celebracion, fanfarria, contarRapido, pulsoMedidor, recibir, abrirJugadorPublico, abrirPrueba, abrirSala, entrarSala, lb: () => ({ v: LB.v, m: LB.m, pend: [...R.pend.keys()], vis: [...(LB.vis || [])], T: topeBarras(), Z: zonaLectura(), vf: R.vf, marc: [...(LB.vis || [])].map((x) => [x, marcable(x), Math.round(rectNum(document.getElementById("v" + x)).top)]) }) };
  window.BiExJuego = {
    iniciar(api) { A = api; if (!S.token) S.token = A.store.get("jg:t", null); if (!S.yo && S.token) S.yo = A.store.get("jg:yo", null); limpiarMarcasAuto(); iniciarPresencia(); if (S.token) setTimeout(() => latirPresencia(false), 1800); },
    vista, capitulo, salir, franja, guardarInvitacion, marcarVerso: marcarVersoDesdeLector, activo: () => !!S.token,
    abrirJugador: abrirJugadorPublico,
    actividadRuta(ruta) { if (S.token) latirPresencia(false, ruta); },
    // AC16: la sesión volvió desde la copia del sitio oficial (el marco había perdido su almacenamiento)
    retomarSesion() { if (!A) return; const t = A.store.get("jg:t", null); if (!t || t === S.token) return; S.token = t; S.yo = null; latirPresencia(true); if (A.nube) { A.nube.bajado = false; A.nube.bajar(); } if (S.cont && S.cont.isConnected) repintar(); },
    // AA9: hoy (marcado hoy), antes (marcado otro día), repaso (marcado hoy como repaso)
    estadoVerso: (c, cap, v) => (S.token && R.lib === c && R.cap === cap ? { hoy: yaLeido(v), antes: marcadoAntes(c + "." + cap, v), repaso: esRepaso(c, cap, v), veces: vecesDe(c + "." + cap, v), k: lecturasK() } : null),
    // el verso que se está leyendo (el del hilo de luz): referencia al cambiar de vista y para sincronizar el marcador flotante (14-nov-2026 · Argon 23-nov-2026)
    versoActivo: (c, cap) => (R.lib && (!c || R.lib === c) && (!cap || R.cap === cap) && (LB.v || R.vf)) || 0,
    // V22 · benignidad: compartir un verso o un capítulo hace crecer ese aspecto del fruto (cuenta una vez al día por pasaje)
    async compartido(hh) {
      const m = /^#\/([1-3A-Z]{3})\/(\d{1,3})(?:\/[a-z]+)?(?:\/(\d{1,3}))?/.exec(String(hh || "")); if (!m || !S.token) return;
      const r = await pedir("/compartir", { metodo: "POST", cuerpo: { lib: m[1], cap: +m[2], v: m[3] ? +m[3] : 0 } });
      if (r && r.fr > 0) A.avisar("Compartiste: tu benignidad crece");
    },
  };
})();
