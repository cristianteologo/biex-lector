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
  const MARCOS = [[1, "Sembrador"], [3, "Cordón de tres"], [7, "Siete"], [12, "Doce"], [24, "Veinticuatro"], [70, "Setenta"]];
  const PIEDRAS = [["ἴασπις", "jaspe", "#5f9f72"], ["σάπφειρος", "zafiro", "#3f72d8"], ["χαλκηδών", "calcedonia", "#93a9c2"], ["σμάραγδος", "esmeralda", "#22a876"],
    ["σαρδόνυξ", "sardónice", "#c2643f"], ["σάρδιον", "cornalina", "#cc452f"], ["χρυσόλιθος", "crisólito", "#c3c23c"], ["βήρυλλος", "berilo", "#4db9ae"],
    ["τοπάζιον", "topacio", "#e4a92f"], ["χρυσόπρασος", "crisopraso", "#86d070"], ["ὑάκινθος", "jacinto", "#e57b3d"], ["ἀμέθυστος", "amatista", "#9663d0"]];
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

  // ------------------------------------------------------------------ red
  async function pedir(ruta, o) {
    o = o || {};
    const cab = {};
    if (o.cuerpo !== undefined) cab["content-type"] = "application/json";
    const t = S.token; if (t && !o.sin) cab.authorization = "Bearer " + t;
    let r;
    try { r = await fetch(API + ruta, { method: o.metodo || "GET", headers: cab, body: o.cuerpo !== undefined ? JSON.stringify(o.cuerpo) : undefined, keepalive: !!o.keepalive, credentials: "omit", cache: "no-store" }); }
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
    llaves_max: "Ya tienes 10 llaves de acceso.", ya_vinculada: "Esa cuenta ya está vinculada a otro perfil.", sin_google: "La entrada con Google todavía no está activa.", sin_facebook: "La entrada con Facebook todavía no está activa." };
  const mensaje = (r) => (r && (r.detalle && r.error === "apodo" ? r.detalle : MENSAJES[r.error])) || "Algo no salió bien. Vuelve a intentarlo.";

  function guardarSesion(token, yo) {
    S.token = token; A.store.set("jg:t", token);
    if (yo) actualizarYo(yo);
  }
  function actualizarYo(yo) {
    if (!yo) return;
    S.yo = yo; A.store.set("jg:yo", yo);
    if (yo.inv) A.store.set("jg:mio", yo.inv);
    A.store.set("jg:inv", null);
  }
  function olvidarSesion(aviso) {
    R.cola = [];
    S.token = null; S.yo = null; A.store.set("jg:t", null); A.store.set("jg:yo", null); A.store.set("jg:mio", null);
    salir();
    if (aviso) A.avisar("Tu sesión de Escudriña terminó. Entra de nuevo con tu código, tu llave o tu cuenta.");
    if (S.cont && S.cont.isConnected) repintar();
  }
  async function config() {
    if (S.cfg && !S.cfg.sinServidor) return S.cfg;
    const c = await pedir("/config", { sin: true });
    S.cfg = c.error ? { sinServidor: true, error: c.error, msPalabra: 250, msMin: 1000 } : c;
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
  function emblema(l, c, marco) {
    const col = COLORES[c] || COLORES[0], heb = /[֐-׿]/.test(l || "");
    const anillo = marco ? '<circle cx="24" cy="24" r="23" fill="none" stroke="var(--oro-vivo)" stroke-width="1.2" stroke-dasharray="' + (marco >= 6 ? "none" : (2 + marco) + " 2.2") + '"/>' : "";
    return A.svg(anillo + '<circle cx="24" cy="24" r="20" fill="var(--hoja-2)" stroke="' + col + '" stroke-width="2"/><text x="24" y="' + (heb ? 31 : 32) + '" text-anchor="middle" font-size="' + (heb ? 21 : 25) +
      '" fill="' + col + '" style="font-family:' + (heb ? "'Frank Ruhl Libre','Gentium Book Plus',serif" : "'Gentium Book Plus',Georgia,serif") + '">' + esc(l || "α") + "</text>", "0 0 48 48");
  }
  const embDe = (s) => { const t = String(s || ""); const m = /^(.+?)(\d)$/u.exec(t); return m ? [m[1], +m[2]] : ["α", 0]; };
  const ICO_JG = {
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
    persona: '<circle cx="12" cy="8.5" r="3.6" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M5 20c.8-3.9 3.6-6 7-6s6.2 2.1 7 6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
  };
  const ico = (k) => A.svg(ICO_JG[k]);

  // ------------------------------------------------------------------ sonido (campanas breves sintetizadas; nunca en modo tranquilo)
  let AC = null;
  function sonar(tipo) {
    if (!S.yo || S.yo.tranquilo) return;
    try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === "suspended") AC.resume().catch(() => {}); } catch (e) { return; }
    if (AC.state !== "running") return;
    const N = { chispa: [[1046.5, 0, 0.16], [1568, 0.07, 0.22]], nivel: [[659.3, 0, 0.3], [880, 0.11, 0.3], [1318.5, 0.22, 0.55]], hallazgo: [[784, 0, 1.1], [1174.7, 0.06, 1.2], [1568, 0.12, 1.4], [2349.3, 0.18, 0.9]] }[tipo] || [];
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
.jg-letras button{font:400 1.25rem/1 "Gentium Book Plus",Georgia,serif;height:40px;border-radius:10px;border:1px solid var(--linea-2);background:var(--hoja-2);color:var(--tinta);cursor:pointer}
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
.jg-entrar .btn{justify-content:flex-start;text-align:left}
.jg-entrar .btn svg{width:20px;height:20px}
.jg-espera{display:flex;align-items:center;gap:10px;font:400 .9rem/1.4 var(--f-ui);color:var(--tinta-2)}
@keyframes jg-sube{0%{opacity:0;transform:translate(-50%,10px)}15%{opacity:1;transform:translate(-50%,0)}80%{opacity:1;transform:translate(-50%,-6px)}100%{opacity:0;transform:translate(-50%,-14px)}}
@keyframes jg-brilla{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}
.jg-cel .arte.anim{animation:jg-brilla 1.6s ease-in-out 2}
@media (min-width:720px){.jg-piedras{grid-template-columns:repeat(12,1fr)}.jg-dos{display:grid;grid-template-columns:1fr 1fr;gap:18px;align-items:start}}
@media (prefers-reduced-motion:reduce){.jg-cel .arte.anim{animation:none}}
:root[data-theme=light] .jg-fila .p,:root[data-theme=light] .jg-tarjeta>h2{color:var(--oro)}
`;

  // ------------------------------------------------------------------ vistas
  const h = (...a) => A.h(...a);
  function cabecera(sub) {
    return h("div", { class: "panel-cab" },
      h("span", { class: "eyebrow", text: "El juego de Biblia Exacta" }),
      h("h1", { class: "texto", text: "Escudriña" }),
      h("p", { class: "jg-lema" }, h("span", { lang: "grc", text: "ἐρευνᾶτε τὰς γραφάς" }), " · «Escudriñan a las escrituras» (", h("a", { href: "#/JHN/5/l/39", text: "YÔḥānā́n 5:39" }), ")"),
      sub ? h("p", { class: "est-sub", text: sub }) : null);
  }
  const tarjeta = (titulo, icoSvg, ...hijos) => h("section", { class: "jg-tarjeta" }, titulo ? h("h2", {}, icoSvg || null, h("span", { text: titulo })) : null, ...hijos);
  function marco(cont, ...hijos) {
    cont.replaceChildren(h("div", { class: "in" }, h("section", { class: "panel jg" }, ...hijos)));
  }
  function repintar() { if (S.cont) vista(S.cont, S.sub); }
  async function vista(cont, sub) {
    estilos();
    S.cont = cont; S.sub = sub || [];
    const que = S.sub[0] || "";
    if (que === "i" && S.sub[1]) guardarInvitacion(S.sub[1]);
    if (!S.token) S.token = A.store.get("jg:t", null);
    if (!S.yo && S.token) S.yo = A.store.get("jg:yo", null);
    await config();
    if (cont !== S.cont) return;
    if (S.codigoNuevo) return pintarCodigo(cont);
    if (!S.token) return pintarEntrada(cont);
    if (que === "clasificacion") return pintarClasificacion(cont);
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
    const franjaInv = inv ? h("div", { class: "jg-aviso" }, "Llegaste con una invitación: ", h("b", { text: "tus primeros 3 días cuentan doble." })) : null;
    if (inv) pedir("/invitacion?c=" + encodeURIComponent(inv), { sin: true }).then((r) => { if (r.apodo && franjaInv) franjaInv.replaceChildren(h("b", { text: r.apodo }), " te invitó: tus primeros 3 días cuentan doble."); });
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
      sonar("nivel");
      repintar();
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
      franjaInv,
      tarjeta("Cómo se juega", null,
        h("p", { text: "Lee la Nueva Voluntad y cada verso que de verdad lees te da experiencia. Cada día tienes de 2 a 5 misiones pequeñas, a tu ritmo y sin culpa. Al leer puedes hallar, muy de vez en cuando, una de las doce piedras del fundamento o un lauro trenzado." }),
        h("p", { class: "jg-mini", text: "Hay clasificaciones por ciudad, país y continente, separadas por rango para que nadie compita en desventaja. No se piden correo, nombre ni contraseña." })),
      h("div", { class: "jg-dos" },
        tarjeta("Empezar con un apodo", null, h("div", { class: "jg-form" }, entrada, btn), pista,
          h("p", { class: "jg-mini", text: "Recibirás un código único para entrar desde otros dispositivos; después podrás asegurar tu avance con una llave de acceso, Google o Facebook." })),
        tarjeta("Ya juego", null, opciones)),
      vivoLinea());
  }

  // --- código recién creado (se muestra una sola vez)
  function pintarCodigo(cont) {
    const c = S.codigoNuevo;
    document.title = "Tu código de acceso · Escudriña · BiEx";
    const sigue = h("button", { class: "btn oro jg-grande", type: "button", disabled: true, onclick: () => { S.codigoNuevo = null; A.irA("#/escudrina"); repintar(); try { window.scrollTo({ top: 0, behavior: "instant" }); } catch (e) { window.scrollTo(0, 0); } } }, h("span", { text: "Continuar" }));
    const casilla = h("input", { type: "checkbox", onchange: () => { sigue.disabled = !casilla.checked; } });
    const texto = "Escudriña · Biblia Exacta\nApodo: " + (S.yo ? S.yo.apodo : "") + "\nCódigo de acceso: " + c + "\n\nGuárdalo: es tu llave para entrar desde otros dispositivos mientras no asegures tu avance.";
    const guardarTel = window.PasswordCredential ? h("button", { class: "btn", type: "button", onclick: async () => {
      try { await navigator.credentials.store(new window.PasswordCredential({ id: (S.yo && S.yo.apodo) || "Escudriña", password: c, name: "Escudriña · Biblia Exacta" })); A.avisar("Guardado en el gestor de contraseñas"); }
      catch (e) { A.avisar("El navegador no permitió guardarlo; usa Copiar o Descargar"); }
    } }, ico("llave"), h("span", { text: "Guardar en el teléfono" })) : null;
    marco(cont, cabecera(),
      tarjeta("Tu código de acceso", ico("codigo"),
        h("p", { text: "Te damos la bienvenida, " + (S.yo ? S.yo.apodo : "") + ". Este es tu código para entrar desde cualquier otro dispositivo:" }),
        h("div", { class: "jg-codigo", "data-codigo": "" , text: c }),
        h("div", { class: "jg-acciones" },
          h("button", { class: "btn", type: "button", onclick: () => copiar(c, "Código copiado") }, ico("copiar"), h("span", { text: "Copiar" })),
          h("button", { class: "btn", type: "button", onclick: () => descargarTexto("escudrina-codigo.txt", texto) }, ico("descargar"), h("span", { text: "Descargar" })),
          navigator.share ? h("button", { class: "btn", type: "button", onclick: () => compartir("Mi código de Escudriña", texto, OFICIAL) }, ico("compartir"), h("span", { text: "Enviármelo" })) : null,
          guardarTel),
        h("div", { class: "jg-aviso" }, h("b", { text: "Guárdalo bien. " }), "Este código es tu única llave mientras no asegures tu avance. Si lo pierdes antes de vincular tu perfil con una llave de acceso, Google o Facebook, tu avance no se podrá recuperar: no guardamos datos personales para reconocerte.")),
      tarjetaAsegurar(true),
      tarjeta(null, null, h("label", { class: "jg-check" }, casilla, h("span", { text: "Ya guardé mi código" })), sigue));
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
      y.asegurado ? null : h("p", { text: "Con una llave de acceso no das ningún dato: tu teléfono la guarda y la sincroniza con tu cuenta de Google o de Apple. Con ella, o con Google o Facebook, tu avance ya no depende del código." }),
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
    if (y.fundador) chips.push(h("span", { class: "jg-chip", title: "Las 1000 primeras cuentas de Escudriña", text: "Primicia n.º " + fmt(y.n) }));
    if (y.marco) chips.push(h("span", { class: "jg-chip", title: "Por invitar a personas que leen", text: MARCOS[y.marco - 1][1] }));
    if (y.mult > 1) chips.push(h("span", { class: "jg-chip", title: "Experiencia multiplicada", text: "Experiencia ×" + String(y.mult).replace(".", ",") }));
    if (y.bienvenida) chips.push(h("span", { class: "jg-chip tenue", text: "Bienvenida hasta el " + new Date(y.bienvenida).toLocaleString("es", { weekday: "long", hour: "numeric", minute: "2-digit" }) }));
    if (y.imp && y.imp.ms > 0) chips.push(h("span", { class: "jg-chip tenue", text: "Impulso ×" + String(y.imp.f).replace(".", ",") + " · quedan " + Math.max(1, Math.round(y.imp.ms / MIN)) + " min de lectura" }));
    return tarjeta(null, null, h("div", { class: "jg-perfil" },
      h("a", { class: "jg-emb", href: "#/escudrina/cuenta", "aria-label": "Tu emblema: cambiarlo en Cuenta" }, emblema(l, c, y.marco)),
      h("div", {}, h("p", { class: "jg-nombre", text: y.apodo }), h("div", { class: "jg-rango", text: y.rangoNombre + " · nivel " + y.nivel }), chips.length ? h("div", { class: "jg-chips" }, chips) : null)),
      h("div", {}, h("div", { class: "jg-barra", role: "progressbar", "aria-valuemin": "0", "aria-valuemax": String(y.xpSig), "aria-valuenow": String(y.xpNivel), "aria-label": "Experiencia hacia el nivel siguiente" }, h("i", { style: "width:" + pct.toFixed(1) + "%" })),
        h("div", { class: "jg-nivel" }, h("span", { text: fmt(y.xpNivel) + " de " + fmt(y.xpSig) + " para el nivel " + (y.nivel + 1) }), h("span", { text: fmt(y.xp) + " en total" }))));
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
      h("p", { class: "jg-mini", text: y.completo ? "¡Cumpliste todas las misiones de hoy! Mañana habrá otras." : "Todas a tu ritmo. Al cumplirlas todas ganas 50 de experiencia y 10 dracmas más." + (y.cambio ? "" : " Puedes cambiar una misión por día.") }));
  }
  async function cambiarMision(i) {
    const r = await pedir("/mision/cambiar", { metodo: "POST", cuerpo: { i } });
    if (r.error) return A.avisar(r.error === "ya_cambiada" ? "Ya cambiaste una misión hoy" : mensaje(r));
    actualizarYo(r.yo); repintar();
  }
  function tarjetaHoy(y) {
    return tarjeta("Hoy", null, h("div", { class: "jg-cifras" },
      h("div", {}, h("b", { text: fmt(y.hoy.versos) }), h("span", { text: "versos" })),
      h("div", {}, h("b", { text: fmt(Math.floor(y.hoy.ms / MIN)) }), h("span", { text: "minutos" })),
      h("div", {}, h("b", { text: fmt(y.hoy.xp) }), h("span", { text: "experiencia" }))),
      y.pers > 0 ? h("p", { class: "jg-mini" }, A.svg(ICO_JG.llama, "0 0 24 24"), " Perseverancia: ", h("b", { text: plural(y.pers, "día", "días") }), " · tu mejor marca: " + plural(y.persMejor, "día", "días") +
        " · descansos guardados: " + y.desc + " de 3. Cada 7 días seguidos ganas un descanso que cubre un día sin lectura.")
        : h("p", { class: "jg-mini" }, A.svg(ICO_JG.llama, "0 0 24 24"), " Tu perseverancia empieza con el primer verso de hoy." + (y.persMejor ? " Tu mejor marca: " + plural(y.persMejor, "día", "días") + "." : "") + " Cada 7 días seguidos ganas un descanso que cubre un día sin lectura."));
  }
  function tarjetaHallazgos(y) {
    const p = y.piedras || [], n = p.filter((x) => x > 0).length;
    return tarjeta("Hallazgos", null,
      h("div", { class: "jg-piedras" }, PIEDRAS.map((pd, i) => h("button", { class: "jg-piedra", type: "button", "aria-label": pd[1] + (p[i] ? ", hallada " + p[i] + (p[i] === 1 ? " vez" : " veces") : ", aún no hallada"),
        onclick: () => verPiedra(i, p[i] || 0) }, gema(i, p[i] > 0), h("span", { text: pd[1] }), p[i] > 1 ? h("b", { text: "×" + p[i] }) : null))),
      h("div", { class: "jg-tesoros" },
        h("span", { class: "jg-tesoro" }, lauro(), h("span", { text: (y.lauros && y.lauros.trenzado ? plural(y.lauros.trenzado, "lauro trenzado", "lauros trenzados") : "Ningún lauro trenzado todavía") })),
        h("span", { class: "jg-tesoro" }, dracma(), h("span", { text: plural(y.dr, "dracma", "dracmas") }))),
      h("p", { class: "jg-mini", text: n === 12 ? "Reuniste las doce piedras: tu experiencia vale un 5 % más para siempre." : "Piedras del fundamento: " + n + " de 12 (Ḥăzṓn Hiṯgallū́ṯ 21:19-20). Cada verso leído puede revelar una, muy de vez en cuando." }));
  }
  function verPiedra(i, veces) {
    const pd = PIEDRAS[i];
    A.abrirModal(() => A.cajaModal(A.cabModal("Las doce piedras", "Ḥăzṓn Hiṯgallū́ṯ 21:19-20"), h("div", { class: "jg-cel" },
      h("div", { class: "arte" }, gema(i, veces > 0)), h("h3", {}, h("span", { lang: "grc", text: pd[0] }), " [" + pd[1] + "]"),
      h("p", { text: "La " + ORDINAL[i] + " piedra del fundamento del muro de la ciudad. " + (veces ? "La hallaste " + plural(veces, "vez", "veces") + "." : "Aún no la hallas: sigue leyendo.") }),
      h("a", { class: "btn chico", href: "#/REV/21/l/" + (i < 4 ? 19 : 20) }, h("span", { text: "Leer el verso" })))));
  }
  function tarjetaInvitar(y) {
    const url = enlaceInvitacion();
    return tarjeta("Invita a leer", ico("compartir"),
      h("p", { text: "Quien entra con tu enlace lee con experiencia doble sus primeros 3 días. Tú recibes 100 de experiencia cuando lee sus primeros 20 versos, 300 cuando llega al nivel 10, 500 cuando termina su primer libro, y un regalo del 5 % de lo que lea durante un mes." }),
      h("div", { class: "jg-acciones" },
        h("button", { class: "btn oro", type: "button", onclick: compartirInvitacion }, ico("compartir"), h("span", { text: "Compartir mi enlace" })),
        h("button", { class: "btn", type: "button", onclick: () => copiar(url, "Enlace copiado") }, ico("copiar"), h("span", { text: "Copiar" }))),
      h("p", { class: "jg-mini", text: (y.invi && y.invi.unidos ? plural(y.invi.unidos, "persona llegó", "personas llegaron") + " con tu enlace; " + plural(y.invi.leyeron, "ya lee", "ya leen") + ". " : "") +
        "Al compartir un verso desde el lector, el enlace también lleva tu invitación." + (y.marco ? " Tu marco: " + MARCOS[y.marco - 1][1] + "." : "") }));
  }
  const NOVEDAD = { piedra: (a) => "Hallaste " + PIEDRAS[a.i][1] + ".", lauro: () => "Hallaste un lauro trenzado.", unido: (a) => a.a + " llegó con tu invitación.", leyo: (a) => a.a + " leyó sus primeros 20 versos: +" + a.xp + ".",
    nivel10: (a) => a.a + " llegó al nivel 10: +" + a.xp + ".", libroInv: (a) => a.a + " terminó su primer libro: +" + a.xp + ".", libro: (a) => "Terminaste " + nombreLibro(a.lib) + ": +" + a.xp + "." };
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
    const r = await pedir("/yo");
    if (r.error) { if (!y && S.token) marco(cont, cabecera(), tarjeta(null, null, h("p", { text: mensaje(r) }), h("button", { class: "btn", type: "button", onclick: repintar }, h("span", { text: "Reintentar" })))); return; }
    actualizarYo(r.yo);
    if (cont === S.cont && S.cont.isConnected && (S.sub[0] || "") === "") dibujarPanel(cont, r.yo);
  }
  function dibujarPanel(cont, y) {
    const apodo = y.apodoProvisional ? tarjetaApodo(true) : null;
    marco(cont, cabecera(),
      tarjetaPerfil(y), apodo, botonSeguir(),
      h("div", { class: "jg-dos" }, tarjetaMisiones(y), h("div", { class: "jg" }, tarjetaHoy(y), tarjetaNovedades(y))),
      tarjetaHallazgos(y),
      y.asegurado ? null : tarjetaAsegurar(false),
      tarjetaInvitar(y),
      tarjeta("Clasificación", ico("mundo"), h("p", { text: "Tu puesto en tu ciudad, tu país, tu continente y el mundo, entre quienes tienen tu mismo rango." }),
        h("a", { class: "btn", href: "#/escudrina/clasificacion" }, h("span", { text: "Ver la clasificación" })), vivoLinea()),
      h("div", { class: "jg-acciones" }, h("a", { class: "btn chico", href: "#/escudrina/cuenta" }, ico("persona"), h("span", { text: "Cuenta, emblema y preferencias" }))));
  }
  function tarjetaApodo(provisional) {
    const entrada = h("input", { type: "text", maxlength: "20", value: provisional ? "" : (S.yo && S.yo.apodo) || "", placeholder: "Tu apodo (3 a 20 letras)", "aria-label": "Tu apodo", spellcheck: "false" });
    const pista = h("p", { class: "jg-pista", role: "status" });
    const guardar = async () => {
      const r = await pedir("/cuenta/apodo", { metodo: "POST", cuerpo: { apodo: entrada.value.trim() } });
      if (r.error) { pista.textContent = mensaje(r); pista.className = "jg-pista mal"; return; }
      actualizarYo(r.yo); A.avisar("Apodo guardado"); repintar();
    };
    entrada.addEventListener("keydown", (e) => { if (e.key === "Enter") guardar(); });
    return tarjeta(provisional ? "Elige tu apodo" : "Apodo", ico("persona"), provisional ? h("p", { text: "Así aparecerás en las clasificaciones. Nadie verá tu nombre real." }) : null,
      h("div", { class: "jg-form" }, entrada, h("button", { class: "btn oro", type: "button", onclick: guardar }, h("span", { text: "Guardar" }))), pista);
  }

  // --- clasificación
  const AMBITOS = [["ciudad", "Ciudad"], ["region", "Región"], ["pais", "País"], ["continente", "Continente"], ["mundo", "Mundo"]];
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
      const titulo = h("p", { class: "jg-mini", text: (q.periodo === "semana" ? "Esta semana (de lunes a domingo, hora de Bogotá)" : "Desde el comienzo") + " · " + RANGOS[r.rango] + " · " + (r.lugar ? lugarDe(q.ambito) : q.ambito === "mundo" ? "el mundo" : "sin datos de tu lugar") });
      if (!r.lista.length) return zona.replaceChildren(titulo, h("p", { text: "Todavía nadie de este rango suma experiencia aquí. ¡Puedes ser la primera persona!" }));
      const fila = (x) => { const [l, c] = embDe(x.emb); return h("li", { class: "jg-fila" + (x.yo ? " yo" : "") }, h("span", { class: "p", text: String(x.p) }), emblema(l, c, x.marco),
        h("span", { class: "n" }, x.apodo, h("small", { text: "nivel " + x.nivel + (x.n ? " · Primicia n.º " + x.n : "") + (q.ambito !== "ciudad" && x.ciudad ? " · " + x.ciudad : "") })), h("span", { class: "x", text: fmt(x.xp) })); };
      zona.replaceChildren(...[titulo, h("ol", { class: "jg-lista" }, r.lista.map(fila)),
        r.yo && !r.lista.some((x) => x.yo) ? h("p", { class: "jg-mini", text: "Tu puesto: " + fmt(r.yo.p) + " · " + fmt(r.yo.xp) + " de experiencia." }) : null].filter(Boolean));
    }
    marco(cont, h("div", { class: "panel-cab" }, h("a", { class: "eyebrow", href: "#/escudrina", text: "‹ Escudriña" }), h("h1", { class: "texto", text: "Clasificación" }),
      h("p", { class: "est-sub", text: "Cada rango tiene su propia clasificación: los nuevos compiten con nuevos y los veteranos con veteranos." })),
      tarjeta(null, null, seg(AMBITOS, "ambito"), seg([["semana", "Esta semana"], ["total", "Desde el comienzo"]], "periodo"), seg(RANGOS.map((t, i) => [i, t]), "rango")),
      tarjeta(null, null, zona), vivoLinea());
    cargar();
  }

  // --- cuenta
  function pintarCuenta(cont) {
    document.title = "Cuenta · Escudriña · BiEx";
    const y = S.yo || {};
    const [l0, c0] = [y.emb ? y.emb.l : "α", y.emb ? y.emb.c : 0];
    const vista = h("div", { class: "jg-emb", style: "width:72px;height:72px" }, emblema(l0, c0, y.marco));
    const emb = { l: l0, c: c0 };
    const guardarEmb = async () => { const r = await pedir("/cuenta/preferencias", { metodo: "POST", cuerpo: { emb } }); if (!r.error) { actualizarYo(r.yo); A.avisar("Emblema guardado"); } else A.avisar(mensaje(r)); };
    const letras = h("div", { class: "jg-letras", role: "group", "aria-label": "Letra del emblema" }, [...LETRAS].map((x) => h("button", { type: "button", "aria-pressed": String(x === emb.l), lang: /[֐-׿]/.test(x) ? "he" : "grc", text: x, onclick: (e) => {
      emb.l = x; for (const b of letras.children) b.setAttribute("aria-pressed", String(b === e.currentTarget)); vista.replaceChildren(emblema(emb.l, emb.c, y.marco)); guardarEmb();
    } })));
    const colores = h("div", { class: "jg-colores", role: "group", "aria-label": "Color del emblema" }, COLORES.map((col, i) => h("button", { type: "button", "aria-pressed": String(i === emb.c), "aria-label": "Color " + (i + 1), style: "background:" + col, onclick: (e) => {
      emb.c = i; for (const b of colores.children) b.setAttribute("aria-pressed", String(b === e.currentTarget)); vista.replaceChildren(emblema(emb.l, emb.c, y.marco)); guardarEmb();
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
      tarjeta("Preferencias", null, pref("verCiudad", "Mostrar mi ciudad en las clasificaciones", "Si la ocultas, sigues apareciendo en tu región, tu país, tu continente y el mundo."),
        pref("tranquilo", "Modo tranquilo", "Sin sonidos. Para menos movimiento, usa también «Sin animaciones» en la apariencia del lector.")),
      tarjeta("Sesiones", null, h("div", { class: "jg-acciones" },
        h("button", { class: "btn", type: "button", onclick: () => { if (confirm("¿Salir de Escudriña en este dispositivo? Para volver necesitarás tu código, tu llave o tu cuenta.")) { olvidarSesion(false); A.irA("#/escudrina"); } } }, h("span", { text: "Salir en este dispositivo" })),
        h("button", { class: "btn", type: "button", onclick: async () => { if (!confirm("Se cerrarán todas tus sesiones, también en otros dispositivos. ¿Seguir?")) return; const r = await pedir("/cuenta/salir-todos", { metodo: "POST" }); if (r.error) return A.avisar(mensaje(r)); guardarSesion(r.token); A.avisar("Cerraste las demás sesiones"); } }, h("span", { text: "Cerrar todas las sesiones" })))),
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
    // la ventana se abre ya, dentro del toque (si no, el navegador la bloquea); luego se le da su dirección
    const w = window.open("", "biex-entrar", "popup,width=480,height=680");
    const r = await pedir("/auth/" + prov + "/preparar", { metodo: "POST", cuerpo: { modo }, sin: modo !== "vincular" });
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
      A.avisar(x.vinculada ? "Cuenta vinculada: tu avance quedó asegurado" : x.nuevo ? "¡Te damos la bienvenida a Escudriña!" : "¡Qué bueno verte de nuevo!");
      repintar(); return;
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
  const enlaceInvitacion = () => OFICIAL + "?lector=escudrina/i/" + ((S.yo && S.yo.inv) || A.store.get("jg:mio", ""));
  function compartirInvitacion() {
    compartir("Escudriña · Biblia Exacta", "Estoy leyendo la Nueva Voluntad traducida palabra por palabra del griego, y lo hago jugando a Escudriña. Entra con mi enlace: tus primeros 3 días cuentan doble.", enlaceInvitacion());
  }
  // Franja discreta para quien abre un verso compartido con invitación (una sola vez por invitación)
  async function franja(c) {
    estilos();
    c = String(c || "").toLowerCase();
    if (A.store.get("jg:t", null) || A.store.get("jg:franja:" + c, false) || document.querySelector(".jg-franja")) return;
    const r = await pedir("/invitacion?c=" + encodeURIComponent(c), { sin: true });
    if (r.error || !r.apodo) return;
    const cerrar = () => { A.store.set("jg:franja:" + c, true); el.remove(); };
    const el = h("div", { class: "jg-franja", role: "region", "aria-label": "Invitación a Escudriña" }, lauro(),
      h("span", {}, h("b", { text: r.apodo }), " te invitó a Escudriña, el juego de Biblia Exacta: tus primeros 3 días cuentan doble."),
      h("span", { style: "display:flex;align-items:center;gap:4px" }, h("a", { class: "btn oro chico", href: "#/escudrina", onclick: cerrar }, h("span", { text: "Conocer" })),
        h("button", { class: "x", type: "button", "aria-label": "Cerrar", onclick: cerrar }, A.svg(A.ICO.cerrar))));
    document.body.append(el);
  }

  // ------------------------------------------------------------------ lectura validada
  // Un «cursor de lectura»: el tiempo se acredita al primer verso visible (en orden) que aún no se validó; al llegar a su
  // tiempo mínimo pasa al siguiente. Solo cuenta con la pestaña visible, sin ventanas encima y con actividad reciente.
  const R = { lib: null, cap: 0, pase: null, pal: [], hoy: "", acc: new Map(), hechos: new Set(), cola: [], vis: new Map(), els: [], io: null, reloj: 0, ultTick: 0, ultAct: 0, ultEnvio: 0, enviando: false };
  const actividad = () => { R.ultAct = performance.now(); };
  let escuchando = false;
  function escuchar() {
    if (escuchando) return; escuchando = true;
    for (const ev of ["scroll", "wheel", "touchstart", "keydown", "pointerdown"]) window.addEventListener(ev, actividad, { passive: true, capture: true });
    let pm = 0; window.addEventListener("pointermove", () => { const t = performance.now(); if (t - pm > 2000) { pm = t; actividad(); } }, { passive: true });
    document.addEventListener("visibilitychange", () => { if (document.hidden) enviar(true); else { R.ultTick = performance.now(); actividad(); } });
    window.addEventListener("pagehide", () => enviar(true));
  }
  function capitulo(lib, cap, modo) {
    if (!S.token) S.token = A.store.get("jg:t", null);
    if (!S.token || modo !== "l") { salir(); return; }
    estilos(); escuchar();
    if (R.lib !== lib || R.cap !== cap) {
      salir();
      Object.assign(R, { lib, cap, pase: null, pal: [], hoy: "", acc: new Map(), hechos: new Set(), cola: [], prueba: false });
      pedirPase();
    } else if (R.prueba) setTimeout(tarjetaPrueba, 50);
    observar();
    actividad(); R.ultTick = performance.now();
    if (!R.reloj) R.reloj = setInterval(tick, 250);
  }
  function salir() {
    // lo leído y aún no enviado sale con su propio pase (aunque haya otra tanda en camino)
    if (R.cola.length && R.pase && S.token) {
      const lib = R.lib, cap = R.cap, lote = R.cola.splice(0);
      pedir("/lectura/enviar", { metodo: "POST", cuerpo: { pase: R.pase, versos: lote }, keepalive: true }).then((r) => {
        if (r.error) return;
        actualizarYo(r.yo); if (r.xp > 0) pop(r.xp);
        if (r.aceptados && r.aceptados.length && A.marcarLeido) A.marcarLeido(lib, cap, r.aceptados);
      });
    }
    if (R.io) { R.io.disconnect(); R.io = null; }
    if (R.reloj) { clearInterval(R.reloj); R.reloj = 0; }
    clearTimeout(R.reintento);
    Object.assign(R, { els: [], vis: new Map(), lib: null, cap: 0, pase: null, cola: [], acc: new Map(), hechos: new Set(), prueba: false });
  }
  async function pedirPase() {
    const lib = R.lib, cap = R.cap;
    if (!S.cfg) await config();
    const r = await pedir("/lectura/pase", { metodo: "POST", cuerpo: { lib, cap } });
    if (R.lib !== lib || R.cap !== cap) return;
    if (r.error) { if (r.error !== "sesion") R.reintento = setTimeout(pedirPase, 45000); return; }
    R.pase = r.pase; R.pal = r.palabras || []; R.hoy = r.hoy || ""; R.prueba = !!r.prueba;
    if (R.prueba) tarjetaPrueba();
  }
  function observar() {
    if (R.io) R.io.disconnect();
    R.vis = new Map();
    R.els = [...document.querySelectorAll(".hoja [id^='v']")].filter((el) => /^v\d+$/.test(el.id) && /^(vl|vs)$/.test(el.classList[0]));
    if (!("IntersectionObserver" in window)) return;
    R.io = new IntersectionObserver((ents) => { for (const e of ents) R.vis.set(e.target, e.isIntersecting); }, { rootMargin: "-10% 0px -15% 0px", threshold: 0 });
    for (const el of R.els) R.io.observe(el);
  }
  const tMin = (v) => Math.max((S.cfg && S.cfg.msMin) || 1000, ((S.cfg && S.cfg.msPalabra) || 250) * (R.pal[v - 1] || 0));
  const valeLeer = (v) => (R.pal[v - 1] || 0) > 0 && +(R.hoy[v - 1] || 0) < 2;
  function tick() {
    const ahora = performance.now(), dt = Math.min(1000, Math.max(0, ahora - (R.ultTick || ahora)));
    R.ultTick = ahora;
    if (!R.pase || document.hidden || ahora - R.ultAct > 60000 || document.documentElement.classList.contains("con-modal")) return;
    if (R.els.length && !R.els[0].isConnected) observar();
    let el = null;
    for (const e of R.els) { const v = +e.id.slice(1); if (R.vis.get(e) && !R.hechos.has(v) && valeLeer(v)) { el = e; break; } }
    if (el) {
      const v = +el.id.slice(1), t = (R.acc.get(v) || 0) + dt;
      R.acc.set(v, t);
      if (t >= tMin(v)) { R.hechos.add(v); R.cola.push([v, Math.round(t)]); }
    }
    if (R.cola.length && (R.cola.length >= 12 || ahora - R.ultEnvio > 15000)) enviar(false);
  }
  async function enviar(final) {
    if (R.enviando || !R.cola.length || !R.pase || !S.token) return;
    R.enviando = true; R.ultEnvio = performance.now();
    const lote = R.cola.splice(0, 80), lib = R.lib, cap = R.cap;
    const r = await pedir("/lectura/enviar", { metodo: "POST", cuerpo: { pase: R.pase, versos: lote }, keepalive: !!final });
    R.enviando = false;
    if (r.error) {
      if (r.error === "pase_vencido") { R.pase = null; for (const [v] of lote) R.hechos.delete(v); pedirPase(); }
      else if ((r.error === "red" || r.error === "sin_servidor" || /^http5/.test(r.error)) && R.lib === lib && R.cap === cap) R.cola.unshift(...lote);
      return;
    }
    if (R.lib === lib && R.cap === cap) {
      for (const [v] of r.rechazados || []) { R.hechos.delete(v); R.acc.delete(v); }
      if (r.hoyCap) R.hoy = r.hoyCap;
    }
    if (r.aceptados && r.aceptados.length && A.marcarLeido) A.marcarLeido(lib, cap, r.aceptados);
    actualizarYo(r.yo);
    celebrar(r, lib, cap);
  }

  // ------------------------------------------------------------------ celebraciones
  function pop(xp) {
    const el = h("div", { class: "jg-pop", role: "status" }, "+" + fmt(xp), h("small", { text: "de experiencia" }));
    document.body.append(el);
    if (sinAnim() || !el.animate) { el.style.opacity = "1"; setTimeout(() => el.remove(), 1800); return; }
    el.animate([{ opacity: 0, transform: "translate(-50%,10px)" }, { opacity: 1, transform: "translate(-50%,0)", offset: 0.15 }, { opacity: 1, transform: "translate(-50%,-6px)", offset: 0.8 }, { opacity: 0, transform: "translate(-50%,-14px)" }],
      { duration: 1900, easing: "ease-out" }).finished.then(() => el.remove(), () => el.remove());
  }
  function celebrar(r, lib, cap) {
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
    if (r.completo && r.prueba) { avisos.push("Capítulo completo: al final te espera su prueba"); R.prueba = true; tarjetaPrueba(); }
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
    if (x.tipo === "lauro") { arte = lauro(); titulo = h("h3", { text: "¡Un lauro trenzado!" }); texto = "El hallazgo más raro de Escudriña (1 Κοrίndsιοι 9:25). Durante tus próximos 30 minutos de lectura, tu experiencia vale el doble."; compartirT = "¡Hallé un lauro trenzado en Escudriña, el juego de Biblia Exacta!"; }
    else if (x.tipo === "piedra") { arte = gema(x.i, true); titulo = h("h3", {}, h("span", { lang: "grc", text: PIEDRAS[x.i][0] }), " [" + PIEDRAS[x.i][1] + "]"); texto = "Hallaste la " + ORDINAL[x.i] + " piedra del fundamento (Ḥăzṓn Hiṯgallū́ṯ 21:19-20). Durante tus próximos 15 minutos de lectura, tu experiencia vale ×1,5." + (x.doce ? " ¡Y reuniste las doce: tu experiencia vale un 5 % más para siempre!" : ""); compartirT = "Hallé " + PIEDRAS[x.i][1] + ", una de las doce piedras del fundamento, en Escudriña, el juego de Biblia Exacta."; }
    else { arte = emblema(S.yo && S.yo.emb ? S.yo.emb.l : "α", S.yo && S.yo.emb ? S.yo.emb.c : 0, S.yo && S.yo.marco); titulo = h("h3", { text: "Nuevo rango: " + x.rango }); texto = "Llegaste al nivel " + x.nivel + ". Desde ahora compites en la clasificación de " + x.rango + "."; compartirT = "Llegué al rango de " + x.rango + " en Escudriña, el juego de Biblia Exacta."; }
    A.abrirModal(() => A.cajaModal(A.cabModal(x.tipo === "rango" ? "Nuevo rango" : "Hallazgo", "Escudriña"), h("div", { class: "jg-cel" },
      h("div", { class: "arte" + (sinAnim() ? "" : " anim") }, arte), titulo, h("p", { text: texto }),
      h("div", { class: "jg-acciones" }, h("button", { class: "btn oro", type: "button", onclick: () => A.cerrarModal() }, h("span", { text: "Seguir leyendo" })),
        h("button", { class: "btn", type: "button", onclick: () => compartir("Escudriña · Biblia Exacta", compartirT + " Entra con mi enlace: tus primeros 3 días cuentan doble.", enlaceInvitacion()) }, ico("compartir"), h("span", { text: "Compartir" }))))));
  }

  // ------------------------------------------------------------------ prueba del capítulo
  function tarjetaPrueba() {
    if (!R.prueba || !R.lib) return;
    const fin = document.querySelector(".hoja nav.fin-cap");
    if (!fin || document.querySelector(".jg-prueba")) return;
    const lib = R.lib, cap = R.cap;
    fin.before(h("div", { class: "jg-prueba" }, lauro(), h("p", {}, h("b", { text: "Prueba del capítulo. " }), "Tres preguntas sobre lo que leíste hoy: 10 de experiencia por acierto y 15 más si aciertas todas."),
      h("button", { class: "btn oro chico", type: "button", onclick: () => abrirPrueba(lib, cap) }, h("span", { text: "Hacer la prueba" }))));
  }
  async function abrirPrueba(lib, cap) {
    const r = await pedir("/prueba/pedir", { metodo: "POST", cuerpo: { lib, cap } });
    if (r.error) { A.avisar(r.error === "ya_hecha" ? "Ya hiciste la prueba de este capítulo hoy" : r.error === "sin_preguntas" ? "Este capítulo aún no tiene preguntas" : mensaje(r)); if (r.error === "ya_hecha") quitarPrueba(); return; }
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
          resultado = x; actualizarYo(x.yo); quitarPrueba();
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

  // ------------------------------------------------------------------ interfaz pública del módulo
  window.BiExJuego = {
    iniciar(api) { A = api; if (!S.token) S.token = A.store.get("jg:t", null); if (!S.yo && S.token) S.yo = A.store.get("jg:yo", null); },
    vista, capitulo, salir, franja, guardarInvitacion,
  };
})();
