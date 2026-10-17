/* BiEx · motor del buscador (navegador y Node). Sin dependencias.
   Reconoce citas, libros, escenas, nombres, palabras griegas, preguntas de ayuda y texto libre. El texto libre se busca en
   la traducción de BiEx y, sin mostrarlo nunca, en el vocabulario de otras traducciones (para encontrar un verso aunque
   se recuerde con otras palabras), además de por conceptos (palabras griegas de la idea buscada). */
(function (raiz) {
  "use strict";
  const BQ = {};

  // ---------------------------------------------------------------- normalización
  const MARCAS = /[̀-ͯ͂̓᷀ͅ-᷿]/g;
  BQ.sinMarcas = (s) => String(s || "").normalize("NFD").replace(MARCAS, "").normalize("NFC");
  BQ.norm = (s) => BQ.sinMarcas(String(s || "").toLowerCase()).replace(/ñ/g, "n").replace(/ς/g, "σ");
  const LETRA = /[a-z0-9α-ω]+/g;
  BQ.palabras = (s) => (BQ.norm(s).replace(/[ʰ-˿⁰-ⁿᵃ-ᶿ`´]/g, "").match(LETRA) || []);
  BQ.griego = (s) => /[Ͱ-Ͽἀ-῿]/.test(String(s || ""));

  const VACIAS_ES = new Set(("a al ante bajo cabe con contra de del desde durante e el ella ellas ello ellos en entre era eran eres es esa esas ese eso esos esta estas este esto estos fue fueron ha han has hasta he la las le les lo los mas me mi mis muy ni no nos nosotros o os para pero por que quien se si sin sino so sobre su sus te ti tu tus u un una uno unos unas y ya yo cual cuales como cuando donde porque pues tambien incluso aun asi esto aquel aquella aquellos aquellas otro otra otros otras todo toda todos todas cada mismo misma hay ser estar sea son estan estaba estaban fue habia han hemos haber tiene tienen tenia dijo dice decia dicho entonces luego mientras ser cosa cosas algo alguien alguno alguna nada nadie quiero busco buscar donde dice habla texto verso versiculo versiculos pasaje pasajes cita biblia parte capitulo libro").split(" "));
  const VACIAS_EN = new Set(("a an and are as at be but by for from had has have he her him his i in into is it its me my not of on or our out shall she so than that the their them then there these they this those thou thee thy to unto up us was we were what when which who whom will with ye you your yea also said say says saith").split(" "));
  BQ.vaciaEs = (w) => VACIAS_ES.has(w);

  // Raíces del español (ligeras: plurales, género, terminaciones verbales frecuentes)
  const SUF_ES = ["aciones", "acion", "amientos", "amiento", "imientos", "imiento", "aremos", "eremos", "iremos", "abamos", "iamos", "aramos", "ieramos", "ieron", "aron", "asteis", "isteis", "aban", "abas", "aran", "eran", "iran", "arian", "erian", "irian", "arais", "ando", "iendo", "yendo", "ados", "adas", "idos", "idas", "ado", "ada", "ido", "ida", "aba", "amos", "emos", "imos", "ar", "er", "ir", "an", "en"];
  BQ.raizEs = function (w) {
    if (w.length <= 3 || /^\d+$/.test(w)) return w;
    if (w.endsWith("ces") && w.length > 4) w = w.slice(0, -3) + "z";
    else if (/[^aeiou]es$/.test(w) && w.length > 4) w = w.slice(0, -2);
    else if (w.endsWith("s") && w.length > 3) w = w.slice(0, -1);
    if (w.endsWith("mente") && w.length > 7) w = w.slice(0, -5);
    for (const s of SUF_ES) if (w.length - s.length >= 3 && w.endsWith(s)) { w = w.slice(0, -s.length); break; }
    if (w.length > 3 && /[aeo]$/.test(w)) w = w.slice(0, -1);
    return w;
  };
  BQ.raizEn = function (w) {
    if (w.length <= 3 || /^\d+$/.test(w)) return w;
    if (w.endsWith("ies") && w.length > 4) w = w.slice(0, -3) + "y";
    else if (w.endsWith("sses")) w = w.slice(0, -2);
    else if (/(ch|sh|x|z|ss)es$/.test(w)) w = w.slice(0, -2);
    else if (w.endsWith("s") && !w.endsWith("ss") && w.length > 3) w = w.slice(0, -1);
    for (const s of ["ingly", "edly", "ing", "eth", "est", "ed", "ly"]) if (w.length - s.length >= 3 && w.endsWith(s)) { w = w.slice(0, -s.length); break; }
    if (/([bdfgmnprt])\1$/.test(w)) w = w.slice(0, -1);
    if (w.endsWith("e") && w.length > 4) w = w.slice(0, -1);
    return w;
  };
  // Nombres propios: no se reducen a raíz («Tomás» no es «tomar»). La lista viaja dentro del índice (campo n).
  let NOMBRES = new Set();
  BQ.fijarNombres = (lista) => { NOMBRES = new Set((lista || []).map((w) => BQ.norm(w))); };
  BQ.esNombre = (w) => NOMBRES.has(w);
  BQ.raizEsN = (w) => (NOMBRES.has(w) ? w : BQ.raizEs(w));
  BQ.terminosEs = (s) => BQ.palabras(s).filter((w) => !VACIAS_ES.has(w) && !BQ.griego(w)).map(BQ.raizEsN);
  BQ.terminosEn = (s) => BQ.palabras(s).filter((w) => !VACIAS_EN.has(w) && !BQ.griego(w)).map(BQ.raizEn);
  // Clave fonética del español (para errores de escritura: b/v, c/s/z, ll/y, h muda, qu/k, g/j)
  BQ.fonetica = (w) => w.replace(/h/g, "").replace(/v/g, "b").replace(/z/g, "s").replace(/c([ei])/g, "s$1").replace(/qu/g, "k").replace(/c/g, "k").replace(/ll/g, "y").replace(/g([ei])/g, "j$1").replace(/(.)\1/g, "$1");

  // ---------------------------------------------------------------- índice (formato compacto)
  const desB64 = (s) => {
    if (typeof atob === "function") { const bin = atob(s); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u; }
    return new Uint8Array(Buffer.from(s, "base64"));
  };
  function leerVarints(u) { const out = []; let x = 0, sh = 0; for (const b of u) { x |= (b & 127) << sh; if (b & 128) sh += 7; else { out.push(x >>> 0); x = 0; sh = 0; } } return out; }
  function campo(c) {
    const terminos = c.t ? c.t.split("\n") : null;
    const off = leerVarints(desB64(c.o));
    let acc = 0; const ini = off.map((d) => (acc += d));
    const post = desB64(c.p);
    const lens = c.l ? desB64(c.l) : null;
    let suma = 0; if (lens) for (const x of lens) suma += x;
    const mapa = new Map();
    if (terminos) terminos.forEach((t, i) => mapa.set(t, i));
    return { terminos, ini, post, lens, media: lens ? suma / Math.max(1, lens.length) : 1, mapa, n: off.length };
  }
  function postings(C, i) {
    const a = C.ini[i], z = i + 1 < C.ini.length ? C.ini[i + 1] : C.post.length;
    const out = []; let x = 0, sh = 0, prev = -1, esperaTf = false, ult = null;
    for (let k = a; k < z; k++) {
      const b = C.post[k]; x |= (b & 127) << sh;
      if (b & 128) { sh += 7; continue; }
      if (esperaTf) { ult[1] = x + 1; esperaTf = false; }
      else { const d = x >>> 1, tf = x & 1; prev = prev + d + 1; ult = [prev, 1]; out.push(ult); if (tf) esperaTf = true; }
      x = 0; sh = 0;
    }
    return out;
  }
  BQ.preparar = function (I) {
    const R = { versos: [], porRef: new Map(), campos: {} };
    for (const [lib, caps] of I.v) for (const [cap, a, z, falta] of caps) for (let v = a; v <= z; v++) {
      if (falta && falta.includes(v)) continue;
      R.porRef.set(lib + " " + cap + ":" + v, R.versos.length);
      R.versos.push([lib, cap, v]);
    }
    for (const [k, c] of Object.entries(I.c)) R.campos[k] = campo(c);
    R.N = R.versos.length;
    if (I.n) BQ.fijarNombres(I.n);
    return R;
  };
  // Conceptos: [[palabras], [lemas], propio?] → palabras sueltas por raíz y frases completas
  BQ.conceptos = function (lista) {
    const pal = new Map(), frases = [];
    for (const [palabras, lemas] of lista || []) for (const p of palabras) {
      const ws = BQ.palabras(p);
      if (!ws.length) continue;
      if (ws.length === 1) {
        const k = BQ.raizEsN(ws[0]);
        const a = pal.get(k) || []; for (const l of lemas) if (!a.includes(l)) a.push(l); pal.set(k, a);
      } else frases.push([" " + ws.join(" ") + " ", lemas]);
    }
    return { pal, frases };
  };
  BQ.postingsDe = (R, campoK, termino) => {
    const C = R.campos[campoK]; if (!C) return [];
    const i = typeof termino === "number" ? termino : C.mapa.get(termino);
    return i == null || i < 0 || i >= C.n ? [] : postings(C, i);
  };

  // ---------------------------------------------------------------- libros y citas
  // ctx.libros: [{c, n, t, he?, alias: [...], caps: [{c, total}]}]
  const ORD = { primera: "1", primero: "1", primer: "1", "1a": "1", "1ra": "1", i: "1", segunda: "2", segundo: "2", "2a": "2", "2da": "2", ii: "2", tercera: "3", tercero: "3", "3a": "3", "3ra": "3", iii: "3" };
  BQ.aliasLibros = {
    MAT: ["mt", "mat", "mateo", "matthew", "matt", "matityahu", "mattityahu", "mattay", "evangelio de mateo"],
    MRK: ["mc", "mr", "mar", "marcos", "marco", "mark", "markos", "evangelio de marcos"],
    LUK: ["lc", "lu", "luc", "lucas", "luke", "loukas", "evangelio de lucas"],
    JHN: ["jn", "juan", "john", "yohanan", "evangelio de juan"],
    ACT: ["hch", "hech", "hechos", "hechos de los apostoles", "acts", "actos", "praxeis", "hechos del espiritu santo"],
    ROM: ["ro", "rom", "romanos", "romans", "carta a los romanos"],
    "1CO": ["1co", "1cor", "1 corintios", "1 corinthians"],
    "2CO": ["2co", "2cor", "2 corintios", "2 corinthians"],
    GAL: ["ga", "gal", "galatas", "galatians"],
    EPH: ["ef", "efe", "efesios", "ephesians"],
    PHP: ["flp", "fil", "filip", "filipenses", "philippians"],
    COL: ["col", "colosenses", "colossians"],
    "1TH": ["1ts", "1tes", "1 tesalonicenses", "1 thessalonians"],
    "2TH": ["2ts", "2tes", "2 tesalonicenses", "2 thessalonians"],
    "1TI": ["1ti", "1tim", "1 timoteo", "1 timothy"],
    "2TI": ["2ti", "2tim", "2 timoteo", "2 timothy"],
    TIT: ["tit", "tito", "titus"],
    PHM: ["flm", "filem", "filemon", "philemon"],
    HEB: ["heb", "hebreos", "hebrews", "ivrim"],
    JAS: ["stg", "sant", "santiago", "jacobo", "james", "yaaqov"],
    "1PE": ["1p", "1pe", "1ped", "1 pedro", "1 peter"],
    "2PE": ["2p", "2pe", "2ped", "2 pedro", "2 peter"],
    "1JN": ["1jn", "1 juan", "1 john"],
    "2JN": ["2jn", "2 juan", "2 john"],
    "3JN": ["3jn", "3 juan", "3 john"],
    JUD: ["jud", "judas", "jude", "yehudah"],
    REV: ["ap", "apoc", "apocalipsis", "rev", "revelacion", "revelation", "hazon", "hitgalut"],
  };
  function claveLibro(s) {
    let k = BQ.norm(s).replace(/[.,;:]/g, " ").replace(/\s+/g, " ").trim();
    k = k.replace(/^(el |la |los |las )/, "").replace(/^(evangelio|carta|epistola|libro) (segun |de |a |del )?(san |los |las |el |la )?/, "");
    const m = k.match(/^(primera|primero|primer|segunda|segundo|tercera|tercero|1a|1ra|2a|2da|3a|3ra|iii|ii|i)\s+(de |a )?(.*)$/);
    if (m) k = ORD[m[1]] + " " + m[3].replace(/^(los |las |el |la )/, "");
    k = k.replace(/^([123])\s*/, "$1 ");
    return k;
  }
  const clavesLibro = new Map();
  BQ.libroPorNombre = function (s, libros) {
    const kk = claveLibro(s).replace(/\s+/g, "");
    if (!kk) return null;
    let mejor = null, md = 9;
    for (const b of libros) {
      let nombres = clavesLibro.get(b.c);
      if (!nombres) { nombres = [b.c, b.n, b.t || "", ...(BQ.aliasLibros[b.c] || [])].map((x) => claveLibro(x).replace(/\s+/g, "")).filter(Boolean); clavesLibro.set(b.c, nombres); }
      for (const nn of nombres) {
        if (nn === kk) return b;
        if (kk.length >= 4 && nn.length >= 4 && /^[123]?[a-z]/.test(kk)) {
          const d = BQ.distancia(kk, nn, 2);
          if (d < md && d <= (kk.length >= 9 ? 2 : 1)) { md = d; mejor = b; }
        }
      }
    }
    return mejor;
  };
  // Cita: «Jn 3:16», «Juan 3», «1 Co 13:4-7», «primera de corintios 13», «Mc 1,1»
  BQ.cita = function (q, libros) {
    const s = String(q || "").trim();
    const m = s.match(/^\s*((?:[123]|i{1,3}|primera|segunda|tercera|primer[oa]?|segund[oa]|tercer[oa]?)?\s*[^\d:]+?)\.?\s*(\d{1,3})(?:\s*[:.,]\s*(\d{1,3})(?:\s*[-–]\s*(\d{1,3}))?)?\s*$/i);
    if (!m) { const b = BQ.libroPorNombre(s, libros); return b ? { b, cap: null, v: null } : null; }
    const b = BQ.libroPorNombre(m[1], libros);
    if (!b) return null;
    const cap = Math.max(1, Math.min(+m[2], b.caps.length));
    return { b, cap, v: m[3] ? +m[3] : null, hasta: m[4] ? +m[4] : null };
  };
  BQ.distancia = function (a, b, tope) {
    if (a === b) return 0;
    if (Math.abs(a.length - b.length) > (tope == null ? 99 : tope)) return 99;
    let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
      const cur = [i]; let mn = i;
      for (let j = 1; j <= b.length; j++) {
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
        if (cur[j] < mn) mn = cur[j];
      }
      if (tope != null && mn > tope) return 99;
      prev = cur;
    }
    return prev[b.length];
  };

  // ---------------------------------------------------------------- texto libre
  // Pesos de cada campo: b (traducción BiEx), e (otras traducciones en español), i (en inglés), g (palabras griegas)
  const PESO = { b: 1.25, e: 1.0, i: 0.85, g: 1.1 };
  function bm25(C, posts, N) {
    const df = posts.length || 1;
    const idf = Math.log(1 + (N - df + 0.5) / (df + 0.5));
    const k1 = 1.2, bb = 0.75;
    const out = new Map();
    for (const [d, tf] of posts) {
      const len = C.lens ? C.lens[d] || C.media : C.media;
      out.set(d, idf * (tf * (k1 + 1)) / (tf + k1 * (1 - bb + bb * len / C.media)));
    }
    return out;
  }
  // Corrige una palabra que no está en el vocabulario (distancia de edición o clave fonética)
  BQ.corregir = function (R, k, t) {
    const C = R.campos[k]; if (!C || !C.terminos || C.mapa.has(t) || t.length < 4) return null;
    const tope = t.length >= 8 ? 2 : 1;
    const fo = BQ.fonetica(t);
    let mejor = null, md = 9, mdf = 0;
    for (let i = 0; i < C.terminos.length; i++) {
      const x = C.terminos[i];
      if (Math.abs(x.length - t.length) > tope || x[0] !== t[0] && BQ.fonetica(x[0]) !== fo[0]) continue;
      const d = BQ.fonetica(x) === fo ? 0.5 : BQ.distancia(t, x, tope);
      if (d > tope) continue;
      const df = (C.ini[i + 1] || C.post.length) - C.ini[i];
      if (d < md || (d === md && df > mdf)) { md = d; mdf = df; mejor = x; }
    }
    return mejor;
  };
  // conceptos: Map(raíz española → [índices de lema]); lemas de la consulta griega directa en ctx.lemasGriegos
  BQ.versos = function (R, q, ctx) {
    ctx = ctx || {};
    const crudo = BQ.palabras(q).filter((w) => !BQ.griego(w));
    // cada palabra de la consulta es una «idea»; todo lo que la representa (raíz española, inglesa, lemas) cuenta para ella
    const terminosB = new Map(), terminosI = new Map(), lemas = new Map(), correcciones = [];
    let ideas = 0;
    crudo.forEach((w, i) => {
      if (VACIAS_ES.has(w) || VACIAS_EN.has(w)) return;
      const re = BQ.raizEsN(w), ri = BQ.raizEn(w);
      let tE = re, tI = ri;
      const enEs = tE && (R.campos.b.mapa.has(tE) || R.campos.e.mapa.has(tE));
      const enEn = tI && R.campos.i.mapa.has(tI);
      const latin = ctx.latin && w.length >= 4 ? ctx.latin.get(w) : null; // palabra griega escrita con letras latinas («agape», «logos»)
      if (tE && !enEs && !enEn) {
        if (latin) tE = null;
        else if (!(ctx.vocab && ctx.vocab.has(tE))) { const c = BQ.corregir(R, "e", tE) || BQ.corregir(R, "b", tE); if (c) { correcciones.push([w, c]); tE = c; } }
      }
      if (latin) for (const li of latin) if (!lemas.has(li)) lemas.set(li, [enEs || enEn ? 0.7 : 1.0, i]);
      if (!tE && !tI && !latin) return;
      if (tE && !terminosB.has(tE)) terminosB.set(tE, i);
      if (tI && (enEn || !enEs) && !terminosI.has(tI)) terminosI.set(tI, i);
      if (ctx.conceptos && tE) for (const li of ctx.conceptos.pal.get(tE) || []) if (!lemas.has(li)) lemas.set(li, [BQ.esNombre(tE) ? 1.0 : 0.8, i]);
    });
    if (ctx.conceptos) {
      const frase = " " + crudo.join(" ") + " ";
      for (const [f, ls] of ctx.conceptos.frases) {
        const at = frase.indexOf(f);
        if (at < 0) continue;
        const primera = frase.slice(0, at + 1).trim().split(" ").filter(Boolean).length; // índice de la primera palabra de la frase
        for (const li of ls) if (!lemas.has(li)) lemas.set(li, [0.9, primera]);
      }
    }
    for (const li of ctx.lemas || []) lemas.set(li, [1.0, "g" + li]);
    const total = new Map(), cubiertas = new Map(), porCampo = new Map(), conHallazgo = new Set();
    const sumar = (k, posts, peso, idea) => {
      if (posts.length) conHallazgo.add(idea);
      const sc = bm25(R.campos[k], posts, R.N);
      for (const [d, s] of sc) {
        total.set(d, (total.get(d) || 0) + PESO[k] * peso * s);
        let st = cubiertas.get(d); if (!st) cubiertas.set(d, (st = new Set()));
        st.add(idea);
        let pc = porCampo.get(d); if (!pc) porCampo.set(d, (pc = new Set()));
        pc.add(k);
      }
    };
    for (const [t, i] of terminosB) { sumar("b", BQ.postingsDe(R, "b", t), 1, i); sumar("e", BQ.postingsDe(R, "e", t), 1, i); }
    for (const [t, i] of terminosI) sumar("i", BQ.postingsDe(R, "i", t), 1, i);
    for (const [li, [p, i]] of lemas) sumar("g", BQ.postingsDe(R, "g", li), p, i);
    // solo cuentan las ideas que aparecen en algún verso (una palabra sin ningún hallazgo no castiga a los demás)
    ideas = Math.max(1, conHallazgo.size);
    const res = [];
    for (const [d, s] of total) {
      const cubre = Math.min(1, cubiertas.get(d).size / ideas);
      res.push({ d, s: s * Math.pow(0.35 + cubre, 2), cubre, campos: porCampo.get(d) });
    }
    res.sort((a, b) => b.s - a.s);
    return { res, correcciones, terminos: [...terminosB.keys()], ingles: [...terminosI.keys()], ideas };
  };

  // ---------------------------------------------------------------- escenas, ayuda y nombres (coincidencia por palabras)
  BQ.puntuarListas = function (q, items, campos) {
    const t = new Set(BQ.terminosEs(q));
    if (!t.size) return [];
    const out = [];
    for (const it of items) {
      if (!it._t) it._t = new Set(BQ.terminosEs(campos.map((c) => it[c] || "").join(" ")));
      let n = 0; for (const x of t) if (it._t.has(x)) n++;
      if (!n) continue;
      const s = Math.pow(n / t.size, 1.5) + (n / Math.max(4, it._t.size)) * 0.3;
      out.push({ it, s, n });
    }
    out.sort((a, b) => b.s - a.s);
    return out;
  };
  BQ.esPregunta = (q) => /[¿?]/.test(q) || /^\s*(como|que|que es|que son|que significa|por que|para que|donde|cual|cuales|quien|puedo|se puede|hay|ayuda|explica|explicame)\b/.test(BQ.norm(q));

  // ---------------------------------------------------------------- griego
  const TL = { α: "a", β: "b", γ: "g", δ: "d", ε: "e", ζ: "z", η: "e", θ: "th", ι: "i", κ: "k", λ: "l", μ: "m", ν: "n", ξ: "x", ο: "o", π: "p", ρ: "r", σ: "s", τ: "t", υ: "u", φ: "f", χ: "ch", ψ: "ps", ω: "o" };
  // clave latina simple de una palabra griega (sin acentos; ph=f, y=u, k=c, j=ch) para reconocer «agape», «logos», «pneuma», «kyrios»
  BQ.claveLatina = (w) => BQ.norm(w).replace(/ph/g, "f").replace(/qu/g, "k").replace(/c(?!h)/g, "k").replace(/j/g, "ch").replace(/y/g, "u").replace(/v/g, "u").replace(/([ct])h/g, "$1\u0001").replace(/h/g, "").replace(/\u0001/g, "h").replace(/ou/g, "u").replace(/(.)\1/g, "$1");
  BQ.translit = (g) => {
    let s = BQ.sinMarcas(String(g).toLowerCase()).replace(/ς/g, "σ");
    s = s.replace(/γ([γκξχ])/g, "n$1");
    let out = ""; for (const ch of s) out += TL[ch] != null ? TL[ch] : /[a-z]/.test(ch) ? ch : "";
    return out.replace(/ou/g, "u");
  };
  BQ.prepararGriego = function (T) {
    const porNorm = new Map(), latin = new Map();
    const poner = (m, k, li) => { if (!k) return; const a = m.get(k); if (!a) m.set(k, [li]); else if (!a.includes(li)) a.push(li); };
    (T.L || []).forEach((l, li) => {
      for (const parte of String(l).split(/,\s*/)) {
        poner(porNorm, BQ.norm(parte), li);
        const t = BQ.translit(parte);
        if (t.length >= 4 && (T.LN ? T.LN[li] >= 2 : true)) poner(latin, BQ.claveLatina(t), li);
      }
    });
    (T.LP || []).forEach((lst, li) => { for (const e of lst || []) { const f = (T.F || [])[e[0]]; if (f) poner(porNorm, BQ.norm(f), li); } });
    // la clave latina se consulta con la palabra tal cual la escribe la persona
    const latinConsulta = { get: (w) => latin.get(BQ.claveLatina(w)) || null };
    return { porNorm, latin: latinConsulta };
  };

  // ---------------------------------------------------------------- rangos «LIB c:v-c:v»
  BQ.rangos = function (txt) {
    const out = [];
    for (const parte of String(txt || "").split(";")) {
      const m = parte.trim().match(/^([1-3]?[A-Z]{2,3})\s+(\d+)(?::(\d+))?(?:\s*-\s*(\d+)(?::(\d+))?)?$/);
      if (!m) continue;
      const lib = m[1], c1 = +m[2];
      const v1 = m[3] ? +m[3] : 1;
      let c2 = c1, v2 = m[3] ? v1 : 999;
      if (m[4] && m[5]) { c2 = +m[4]; v2 = +m[5]; } else if (m[4]) { if (m[3]) v2 = +m[4]; else { c2 = +m[4]; v2 = 999; } }
      out.push([lib, c1, v1, c2, v2]);
    }
    return out;
  };
  BQ.enRango = (r, lib, c, v) => lib === r[0] && (c > r[1] || (c === r[1] && v >= r[2])) && (c < r[3] || (c === r[3] && v <= r[4]));

  // ---------------------------------------------------------------- consulta completa
  // ctx: { libros, conceptos (BQ.conceptos), griego (BQ.prepararGriego), escenas: [{t, r, k, s}], ayuda: [{p, r, k, a}] }
  BQ.buscar = function (R, q, ctx) {
    ctx = ctx || {};
    const out = { q, cita: null, libros: [], escenas: [], ayuda: [], versos: null, filtro: null, griego: [] };
    const limpio = String(q || "").replace(/\s+/g, " ").trim();
    if (!limpio) return out;
    const libros = ctx.libros || [];
    // 1. cita o libro
    const c = BQ.cita(limpio, libros);
    if (c && (c.cap || BQ.palabras(limpio).length <= 4)) out.cita = c;
    // libros por prefijo («cor» → 1 y 2 Corintios)
    const nq = claveLibro(limpio).replace(/\s+/g, "");
    if (nq.length >= 3 && !/\d{1,3}\s*$/.test(limpio.replace(/^[123]\s*/, ""))) {
      for (const b of libros) {
        const nombres = [b.n, b.t || "", ...(BQ.aliasLibros[b.c] || [])].map((x) => claveLibro(x).replace(/\s+/g, ""));
        if (nombres.some((x) => x.startsWith(nq) || (nq.length >= 5 && x.includes(nq)))) out.libros.push(b);
      }
    }
    if (out.cita && !out.cita.cap && !out.libros.includes(out.cita.b)) out.libros.unshift(out.cita.b);
    // 2. filtro por libro al final: «amor en juan», «fe en romanos»
    let consulta = limpio;
    const mf = limpio.match(/^(.+?)\s+(?:en|de|del libro de|en el libro de)\s+((?:[123]\s*)?[^\s].*)$/i);
    if (mf) {
      const b = BQ.libroPorNombre(mf[2], libros);
      if (b && BQ.palabras(mf[1]).length) { out.filtro = b; consulta = mf[1]; }
    }
    if (ctx.filtro) out.filtro = ctx.filtro;
    // 3. griego escrito en griego
    const lemas = [];
    if (ctx.griego) for (const w of BQ.palabras(consulta).filter(BQ.griego)) {
      const ls = ctx.griego.porNorm.get(w) || [];
      for (const li of ls) if (!lemas.includes(li)) lemas.push(li);
      out.griego.push([w, ls]);
    }
    // 4. versos
    if (!ctx._vocab) {
      ctx._vocab = new Set();
      for (const it of (ctx.escenas || []).concat(ctx.ayuda || [])) for (const t of BQ.terminosEs([it.t, it.k, it.p].filter(Boolean).join(" "))) ctx._vocab.add(t);
    }
    if (!(out.cita && out.cita.cap)) {
      const v = BQ.versos(R, consulta, { conceptos: ctx.conceptos, lemas, latin: ctx.griego && ctx.griego.latin, vocab: ctx._vocab });
      if (out.filtro) v.res = v.res.filter((x) => R.versos[x.d][0] === out.filtro.c);
      out.versos = v;
    }
    // 5. escenas: por sus palabras y por los versos encontrados dentro de ellas
    if (ctx.escenas && ctx.escenas.length) {
      const porEscena = new Map();
      for (const { it, s } of BQ.puntuarListas(consulta, ctx.escenas, ["t", "k"])) porEscena.set(it, { kw: s, v: 0 });
      if (out.versos && out.versos.res.length) {
        const top = out.versos.res.slice(0, 40), max = top[0].s || 1;
        for (const it of ctx.escenas) {
          if (!it._r) it._r = BQ.rangos(it.r);
          let sv = 0;
          top.forEach((x, k) => { const [lib, cc, vv] = R.versos[x.d]; if (it._r.some((r) => BQ.enRango(r, lib, cc, vv))) sv += (x.s / max) * x.cubre / (1 + k * 0.08); });
          if (sv > 0) { const e = porEscena.get(it) || { kw: 0, v: 0 }; e.v = sv; porEscena.set(it, e); }
        }
      }
      const lista = [];
      for (const [it, e] of porEscena) {
        if (out.filtro && !(it._r || (it._r = BQ.rangos(it.r))).some((r) => r[0] === out.filtro.c)) continue;
        const s = e.kw + 0.4 * Math.min(1.5, e.v);
        if (s >= 0.45) lista.push({ it, s });
      }
      lista.sort((a, b) => b.s - a.s);
      out.escenas = lista.slice(0, 6);
    }
    // 6. ayuda sobre el uso de la página
    if (ctx.ayuda && ctx.ayuda.length) {
      const pregunta = BQ.esPregunta(limpio);
      out.ayuda = BQ.puntuarListas(limpio, ctx.ayuda, ["p", "k"]).filter((x) => x.s >= (pregunta ? 0.34 : 0.6)).slice(0, pregunta ? 3 : 1);
    }
    return out;
  };

  if (typeof module !== "undefined" && module.exports) module.exports = BQ;
  else raiz.BiExBusqueda = BQ;
})(typeof window !== "undefined" ? window : globalThis);
