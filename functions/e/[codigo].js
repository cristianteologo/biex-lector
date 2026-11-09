// Escudriña · página de invitación de cada estudiante: https://bibliaexacta.pages.dev/e/<código>
// Vista previa propia en WhatsApp, Facebook, Telegram o X («Ana te invita a Escudriña»), cuenta la apertura (una por
// navegador; los robots que arman la vista previa no cuentan) y lleva al lector con la invitación guardada.
const BOTS = /facebookexternalhit|facebot|whatsapp|twitterbot|telegrambot|slackbot|discordbot|linkedinbot|pinterest|googlebot|bingbot|applebot|embedly|skypeuripreview|vkshare|redditbot|preview|crawler|spider|\bbot\b/i;
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const LANZA = Date.UTC(2026, 10, 29, 1, 0); // a más tardar: sábado 28-nov-2026, 20:00 de Bogotá (el servidor manda la fecha vigente)

export async function onRequestGet({ request, env, params }) {
  const url = new URL(request.url);
  const c = String(params.codigo || "").toLowerCase();
  if (!/^[a-z0-9]{4,12}$/.test(c)) return Response.redirect(url.origin + "/#/escudrina", 302);
  const bot = BOTS.test(request.headers.get("user-agent") || "");
  const vista = new RegExp("(?:^|;\\s*)biex_e_" + c + "=1").test(request.headers.get("cookie") || "");
  let apodo = "", quedan = null, lanza = LANZA;
  if (env.JUEGO && typeof env.JUEGO.fetch === "function") {
    try {
      const r = await env.JUEGO.fetch(new Request(url.origin + "/api/juego/invitacion?c=" + c + (!bot && !vista ? "&a=1" : "")));
      const d = await r.json(); apodo = d.apodo || ""; if (Number.isFinite(d.quedan)) quedan = d.quedan;
    } catch (e) { /* sin servidor: la página sigue sirviendo */ }
  }
  const quien = apodo ? esc(apodo) + " te invita" : "Te invitan";
  const titulo = (apodo ? apodo + " te invita" : "Te invitan") + " a Escudriña · El Códice Viviente";
  const desc = "Solo hay 1440 Primicias" + (quedan != null ? " (quedan " + quedan + ")" : "") + ". Lee la Nueva Voluntad traducida palabra por palabra del griego y juega: misiones diarias, hallazgos y clasificaciones. Llegas con 3 horas de lectura con experiencia doble.";
  const destino = "/#/escudrina/i/" + c;
  const img = url.origin + "/escudrina/og.png";
  const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(titulo)}</title><meta name="description" content="${esc(desc)}"><meta name="robots" content="noindex"><meta name="theme-color" content="#09090a">
<meta property="og:type" content="website"><meta property="og:site_name" content="Biblia Exacta"><meta property="og:title" content="${esc(titulo)}">
<meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${esc(url.origin + "/e/" + c)}"><meta property="og:locale" content="es_LA">
<meta property="og:image" content="${img}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="Escudriña · El Códice Viviente, el juego de Biblia Exacta">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(titulo)}"><meta name="twitter:description" content="${esc(desc)}"><meta name="twitter:image" content="${img}">
<link rel="icon" href="/favicon.ico"><link rel="preload" href="/fuentes/biex-titular.woff2" as="font" type="font/woff2" crossorigin>
<style>
@font-face{font-family:"BiEx Texto";src:url(/fuentes/biex-texto.woff2) format("woff2");font-weight:400;font-display:swap}
@font-face{font-family:"BiEx Texto";src:url(/fuentes/biex-texto-it.woff2) format("woff2");font-weight:400;font-style:italic;font-display:swap}
@font-face{font-family:"BiEx Titular";src:url(/fuentes/biex-titular.woff2) format("woff2");font-weight:300 700;font-display:swap}
@font-face{font-family:"BiEx Titular";src:url(/fuentes/biex-titular-it.woff2) format("woff2");font-weight:300 700;font-style:italic;font-display:swap}
@font-face{font-family:"BiEx Interfaz";src:url(/fuentes/biex-interfaz.woff2) format("woff2");font-weight:100 900;font-display:swap}
:root{--oro:#c9a865;--oro-vivo:#e8cf94;--tinta:#ece5d6;--tenue:#a39a88;color-scheme:dark}
*{box-sizing:border-box}html,body{margin:0;background:#07070a;color:var(--tinta)}
body{min-height:100vh;font:18px/1.55 "BiEx Texto",Georgia,serif;display:grid;place-items:center;padding:24px 16px;
background:radial-gradient(90% 60% at 50% 0%,rgba(201,168,101,.22),transparent 70%),radial-gradient(60% 40% at 0% 100%,rgba(201,168,101,.08),transparent 70%),#07070a}
main{width:min(100%,560px);text-align:center;border:1px solid rgba(201,168,101,.5);border-radius:22px;padding:30px 22px 26px;background:rgba(14,14,18,.72);
-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);box-shadow:0 30px 80px rgba(0,0,0,.45),inset 0 0 0 1px rgba(201,168,101,.12)}
.ceja{font:500 .76rem/1.2 "BiEx Interfaz",system-ui,sans-serif;letter-spacing:.22em;text-transform:uppercase;color:var(--oro)}
h1{margin:.35em 0 0;font:600 clamp(2.4rem,9vw,3.4rem)/1 "BiEx Titular",Georgia,serif;letter-spacing:.14em;color:var(--oro-vivo)}
.sub{margin:.15em 0 1em;font:italic 400 1.35rem/1.2 "BiEx Titular",Georgia,serif;color:var(--oro)}
.quien{font:500 1.1rem/1.4 "BiEx Interfaz",system-ui,sans-serif;margin:0 0 1em}
.prim{margin:0;font:600 clamp(1.7rem,6.5vw,2.2rem)/1.15 "BiEx Titular",Georgia,serif}.prim b{color:var(--oro-vivo)}
.quedan{font:500 .98rem/1.4 "BiEx Interfaz",system-ui,sans-serif;color:var(--tinta);margin:.5em 0}.quedan b{color:var(--oro-vivo)}
.barra{height:8px;border-radius:9px;background:rgba(255,255,255,.08);overflow:hidden;margin:.3em 0 1em}.barra i{display:block;height:100%;background:linear-gradient(90deg,var(--oro),var(--oro-vivo))}
.reloj{display:flex;justify-content:center;gap:10px;margin:.3em 0 .4em}.reloj span{display:grid;min-width:70px;padding:7px 6px;border-radius:12px;border:1px solid rgba(201,168,101,.35)}
.reloj b{font:600 1.6rem/1.1 "BiEx Interfaz",system-ui,sans-serif;color:var(--oro-vivo);font-variant-numeric:tabular-nums}.reloj small{font:500 .68rem/1.2 "BiEx Interfaz",system-ui,sans-serif;letter-spacing:.1em;text-transform:uppercase;color:var(--tenue)}
.nota{font:400 .86rem/1.4 "BiEx Interfaz",system-ui,sans-serif;color:var(--tenue);margin:0 0 1.2em}
ul{list-style:none;padding:0;margin:0 0 1.4em;text-align:left;display:grid;gap:8px}li{padding-left:24px;position:relative}li:before{content:"✦";position:absolute;left:2px;color:var(--oro)}
.btn{display:block;text-decoration:none;font:600 1.12rem/1.2 "BiEx Interfaz",system-ui,sans-serif;letter-spacing:.04em;padding:16px 18px;border-radius:14px;color:#1a1408;
background:linear-gradient(180deg,#f0d9a2,#c9a865);box-shadow:0 10px 30px rgba(201,168,101,.25)}.btn:focus-visible{outline:2px solid #fff;outline-offset:3px}
.sec{display:inline-block;margin-top:14px;font:500 .95rem "BiEx Interfaz",system-ui,sans-serif;color:var(--oro-vivo)}
.verso{margin:1.6em 0 0;color:var(--tenue);font-size:.98rem}.verso span{display:block;color:var(--oro-vivo);font-size:1.2rem}
@media (prefers-reduced-transparency:reduce){main{-webkit-backdrop-filter:none;backdrop-filter:none;background:#0e0e12}}
</style></head><body><main>
<div class="ceja">El juego de Biblia Exacta</div>
<h1>ESCUDRIÑA</h1><p class="sub">El Códice Viviente</p>
<p class="quien">${quien} a reservar tu lugar.</p>
<p class="prim">Solo hay <b>1440</b> Primicias</p>
${quedan != null ? `<p class="quedan">Quedan <b>${quedan}</b> lugares</p><div class="barra"><i style="width:${Math.min(100, ((1440 - quedan) * 100) / 1440).toFixed(1)}%"></i></div>` : ""}
<div class="reloj" id="reloj" data-fin="${lanza}" aria-label="Tiempo para el lanzamiento"></div>
<p class="nota">Lanzamiento, a más tardar el sábado 28 de noviembre, 20:00 (hora de Bogotá)</p>
<ul><li>Lee la Nueva Voluntad traducida palabra por palabra del griego, con su análisis.</li><li>Misiones pequeñas cada día, hallazgos raros (las doce piedras y el lauro trenzado incorruptible), clasificaciones y el prestigio de tu ciudad.</li><li>Llegas con 3 horas de lectura con experiencia doble, que no vencen.</li></ul>
<a class="btn" id="ir" href="${destino}">Reservar mi lugar</a>
<a class="sec" href="https://bibliaexacta.wixsite.com/biex">Conocer Biblia Exacta</a>
<p class="verso"><span lang="grc">ἐρευνᾶτε τὰς γραφάς</span>«Escudriñan a las escrituras» · YÔḥānā́n 5:39</p>
</main><script>
(function(){try{localStorage.setItem("biex:jg:ab:${c}","true")}catch(e){}
var el=document.getElementById("reloj"),fin=+el.getAttribute("data-fin");
function p(n,a,b){return"<span><b>"+n+"</b><small>"+(n===1?a:b)+"</small></span>"}
function t(){var f=fin-Date.now();if(f<=0){el.innerHTML="<span><b>¡Ya abrió!</b><small>Escudriña</small></span>";return}
el.innerHTML=p(Math.floor(f/864e5),"día","días")+p(Math.floor(f%864e5/36e5),"hora","horas")+p(Math.floor(f%36e5/6e4),"minuto","minutos")}
t();setInterval(t,20000)})();
</script></body></html>`;
  const h = new Headers({ "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "referrer-policy": "strict-origin-when-cross-origin", "x-content-type-options": "nosniff" });
  if (!bot && !vista) h.append("set-cookie", "biex_e_" + c + "=1; Max-Age=2592000; Path=/e/; Secure; HttpOnly; SameSite=Lax");
  return new Response(html, { headers: h });
}
