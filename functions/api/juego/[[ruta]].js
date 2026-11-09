// Escudriña · puerta del juego en Cloudflare Pages: /api/juego/* pasa al servidor del juego (Worker «biex-juego», sin
// dirección pública) por el enlace de servicio JUEGO. Añade el lugar aproximado de la conexión, que da Cloudflare
// (nunca el navegador): sirve para las clasificaciones por ciudad, región, país y continente.
export async function onRequest({ request, env }) {
  if (!env.JUEGO) {
    return new Response(JSON.stringify({ error: "sin_servidor" }), { status: 503, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
  }
  const cf = request.cf || {};
  const h = new Headers(request.headers);
  for (const k of [...h.keys()]) if (k.startsWith("x-biex-")) h.delete(k);
  const poner = (k, v) => { if (v) h.set("x-biex-" + k, encodeURIComponent(String(v))); };
  poner("ip", request.headers.get("cf-connecting-ip"));
  poner("pais", cf.country); poner("region", cf.region); poner("ciudad", cf.city); poner("cont", cf.continent); poner("tz", cf.timezone);
  return env.JUEGO.fetch(new Request(request, { headers: h, redirect: "manual" }));
}
