# Bitácora de Neon · BiEx – Biblia Exacta

Registro vivo de cambios, decisiones de diseño, correcciones y aprendizajes técnicos para revisión conjunta con BiEx y Opus.

---

## Entrada #1 — 22 de noviembre de 2026

**Rama:** `neon/AF33-ventana-poder` (desde `origin/main` en `ee62546`)
**Propuesta:** [PR #1 · AF33 · Ventana del poder (borrador)](https://github.com/cristianteologo/biex-lector/pull/1)
**Archivos modificados:** `juego.js` (y sellos automáticos vía `python3 wix/sellar.py` en `app.js`, `index.html`, `datos/archivos.json`).

### 1. Cambios realizados

1. **AF33 · Ventana del poder (`abrirVentanaPoder` en `juego.js`):**
   - Accesible desde el botón de Poder en *Árbol → Atributos* y desde la tarjeta «poder» en el héroe del *Árbol*.
   - Ventana flotante nativa (`A.abrirModal` con `.flot-cel.ap-vp`): cierra con `×`, `Esc` y el gesto de atrás, y devuelve a la vista exacta.
   - **Instrumento horológico central:** SVG estático pintado una sola vez (bisel de oro cepillado, esfera de esmalte negro con 60 graduaciones radiales, 4 arcos proporcionales de los pilares, arco interno de avance de etapa con prisma facetado y brillo de cristal). Descargas eléctricas sutiles en capa HTML separada (`opacity` puro), detenidas automáticamente al cerrar, ocultar pestaña o activar «Sin animaciones».
   - **Nivel inicial, etapas y avance:** muestra nivel inicial (`0`), inicio de etapa actual, progreso exacto hacia la siguiente etapa y las 5 etapas (*I Semilla · II Brote · III Raíz honda · IV Copa · V Fruto*) sin cortes de texto.
   - **Pilares y estadísticas sin peticiones nuevas:** desglose interactivo 2 × 2 (*Atributos ×10*, *Nivel ×15*, *Fruto ×6*, *Accesorios ×25*) + 6 tarjetas de estadísticas reales del ser interior + verso desplegable in-situ de `Ἐfέsιοι [Efesios] 3:16` en formato de la Lectura.
2. **Botón medallón de Poder en Árbol → Atributos (`chipPoder` / `.ap-poder`):**
   - Sustituyó la píldora plana con círculo celeste difuso por un medallón de obsidiana y oro labrado con gema facetada (sin cruz ni estrella), reflejo metálico lento por compositor (`transform`), tipografía `var(--f-display)` y descargas eléctricas finas de doble trazo.
3. **Barra horológica de nivel en Hoy (`barraEpica` / `.jg-epica`):**
   - Rediseñada con cabecera de nivel y porcentaje (`Nivel X › Y` · `68 %`), bisel de oro cepillado, canal hondo de obsidiana, graduaciones finas grabadas al borde, reflejo de cristal de zafiro y prisma facetado en la punta de avance.

### 2. Comparativa visual (capturas reales a 3× de densidad)

#### Barra de avance de nivel en Hoy (Antes vs. Después · 360 px a 3×)
*(Capturas 3× HD verificadas y archivadas en la bitácora local de sesión.)*

#### Botón de Poder en Árbol → Atributos (Antes vs. Después · 360 px a 3×)
*(Capturas 3× HD verificadas y archivadas en la bitácora local de sesión.)*

#### AF33 · Ventana del poder (Teléfono 360 px, Escritorio Obsidiana, Estadísticas y Tema Pergamino)
*(Capturas 3× HD verificadas y archivadas en la bitácora local de sesión.)*

### 3. Aprendizajes clave y hallazgos (para BiEx y Opus)

1. **Bug real detectado y corregido en `.jg-epica` (`animarCifras`):**
   Al capturar *Hoy* antes de editar, se observó que la barra de nivel se llenaba al 100 % durante los primeros 1,15 s y luego saltaba hacia atrás al porcentaje real. Causa: `animarCifras` seleccionaba todo `.jg-barra>i` y animaba `scaleX(0) → scaleX(1)`, sobrescribiendo el `translate3d(calc(var(--p) * 1% - 100%),0,0)` de `barraEpica`. Al cambiar el selector a `.jg-barra:not(.jg-epica)>i`, la animación de entrada corre limpia por compositor desde el primer cuadro.
2. **Variable tipográfica inexistente en `.ap-poder b`:**
   El CSS previo usaba `var(--f-titulo,var(--f-ui))`, pero `app.css` define `--f-display` (no `--f-titulo`), por lo que la cifra de poder caía a sans-serif. Al corregirla a `var(--f-display)`, gana de inmediato la jerarquía editorial de BiEx.
3. **Verificación visual obligatoria en tema claro Pergamino (`data-theme="light"`):**
   La primera captura a 3× en Pergamino reveló bajo contraste en el dorado `#e8cf94` sobre crema; definir `--vp-c1..--vp-c4` por tema (`#8a6418`, `#275e96`, `#a81834`, `#1d786b` en claro) y oscurecer el relleno de la barra de etapa resolvió por completo el contraste.
4. **Etiquetas de etapa sin truncamiento en 280–412 px:**
   Escribir «III · Raíz honda» en una sola línea provocaba `III · Raíz...`. Separar el numeral romano en `<em>` arriba del rombo y permitir `text-wrap: balance` en `<b>` mantuvo las 5 etapas legibles incluso en pantallas de 280 px.
5. **Lección de dirección visual y precisión léxica:**
   - Un boceto plano con utilidades genéricas desentona frente a la calidad real de *BiEx* (`medidorSVG`, `cestaSVG`, `Ser interior`). Siempre se debe diseñar e inspeccionar dentro del lector real con sus tipografías propias y capturas a 3×.
   - Toda propuesta de juego y cada accesorio debe verificarse directamente contra `datos/libros/` y la lista de palabras de BiEx (ej. `aljófar` y no «perla», `olio` y no «aceite», `candelabra áurea`, `inmoladero`, `declarante`, `convocación fuera [asamblea]`, `Revelación` / `Ἀpοκάlυpsις`, cero aureolas/cruces/estrellas/soles con rayos).

### 4. Comprobaciones pasadas
- `node --check` en todos los scripts del repositorio: **correcto**.
- Validación de todos los archivos `.json` y `.webmanifest`: **correcto**.
- `python3 wix/sellar.py`: **al día** (`1e0683657af4`).
- Prueba de humo en las 8 vistas principales (`360 px` y `1280 px`): **0 errores de consola, 0 px de desplazamiento lateral**.
- Comprobación en `280 px`, `360 px`, `412 px` y `1280 px` en los **9 tamaños de letra (`--k`)**: **0 px de desplazamiento lateral** y cierre verificado con `Esc`.

---

## Entrada #2 — 23 de noviembre de 2026

**Rama:** `neon/AF33-ventana-poder` (commit `df59f33`, sobre `origin/main` en `ee62546` — sin divergencia respecto al último cambio de Opus)
**Propuesta:** [PR #1 · AF33 v2 (borrador)](https://github.com/cristianteologo/biex-lector/pull/1)
**Vista previa en vivo:** [https://neon-af33-ventana-poder.bibliaexacta.pages.dev/#/escudrina/arbol](https://neon-af33-ventana-poder.bibliaexacta.pages.dev/#/escudrina/arbol)
**Archivos modificados:** `juego.js` (+ sellos automáticos vía `python3 wix/sellar.py` en `app.js`, `index.html`, `datos/archivos.json`).

### 1. Cambios realizados (con base en las indicaciones directas de BiEx)

1. **AF33 v2 · Ventana del Poder (`abrirVentanaPoder` en `juego.js`):**
   - **Corrección teológica del título:** renombrado de «Tu poder» a **«Poder»** (subtítulo «En el ser interior»), en fidelidad a `2 Κοrίndsιοι [2 Corintios] 4:7` (*«para que la hipérbole de la potencia [fortaleza] sea [esté] de ʾĔlōhî́m y no procedente de nosotros»*).
   - **Cámara Orbital 3D del Poder (inspirada en las referencias de filamentos dorados entrelazados):**
     - 5 planos orbitales vectoriales estáticos (`translateZ` escalonado e inclinaciones `rotateX`/`rotateY` distintas) girando por compositor puro (`transform`) en **períodos coprimos** (`31.7 s`, `47.3 s`, `61.9 s`, `79.1 s`, `103.3 s`) que **nunca repiten un bucle mecánico**.
     - 4 destellos ópticos circulares de luz cálida donde cruzan las órbitas (sin cruces ni estrellas de 4 o 5 puntas).
     - **Relieve interactivo en mano:** arrastre táctil con el dedo, movimiento del puntero e inclinación suave del teléfono con física amortiguada que cae exactamente a **0 % CPU en reposo**; en tema claro *Pergamino* la esfera conserva su cámara de obsidiana enmarcada en oro cepillado como un reloj astronómico real.
     - **Arcos resonantes por pilar:** cada uno de los 4 pilares tiene su propia capa HTML; al tocar cualquier pilar se enciende únicamente su arco y cambia la luz interior de la esfera (`--vp-luz`) con cero repintado del SVG.
   - **Pilares y estadísticas vivas:** contadores animados al abrir (`contarRapido`), barras deslizantes por compositor y **6 medallones interactivos** con destellos especulares asíncronos coprimos (`13.1 s` a `29.3 s`) que revelan una nota concreta de progreso al tocar cada estadística.
   - **Doble cita desplegable in-situ:** **`2 Κοrίndsιοι 4:7`** y **`Ἐfέsιοι 3:16`** en formato Lectura exacto de BiEx.
2. **Granada del fruto del espíritu en el Árbol (`arbolPoder` en `juego.js`):**
   - Bajada de `GR_Y = 236` a **`GR_Y = 316`** (`R = 66`), anidada en el corazón dorado de la copa con sombra ambiental suave, tallo unido al ramaje central y brotes dorados en primer plano (`ramasFrente`) dibujados sobre su contorno sin tapar ninguna de las 9 cámaras ni alterar la secuencia `rnd()` del árbol de cada lector.
3. **Vitrina escalonada de Accesorios (`muestraAcc`, `SELLO_RARO`, `tarjetaTienda` en `juego.js`):**
   - Arte vectorial multicapa renovado para las **18 piezas activas** (*Auras, Mantos, Lauros y Sellos*, incluyendo *Columna de fuego*, *Columna de nube*, *Manto de púrpura*, *Lauro de palmas*, *Rollo de siete sellos* y *Candelero de oro* — sin degradados con `id` para repetirse en cualquier vista y en el pecho del Ser Interior).
   - **Escalado visual por coste y rareza:** `t1` estándar (≤ 95 dr.) → `t2` fino (100–175 dr.) → `t3` selecto (≥ 180 dr.) → `t4` raro (70 fragmentos de papiro, con marco prismático-holográfico por compositor y barra de avance `44 de 70`).
   - Eliminado el apagado gris (`opacity:.38; filter:grayscale(.6)`) de los accesorios raros por abrir para que cautiven al coleccionista desde el primer vistazo.

### 2. Comparativa visual (capturas reales a 3× de densidad)

#### AF33 v2 · Cámara Orbital 3D del Poder (Teléfono 360 px, Estadísticas + 2 Κοrίndsιοι 4:7, Escritorio Obsidiana y Pergamino)
*(Capturas 3× HD verificadas y archivadas en la bitácora local de sesión.)*

#### Granada del Fruto del Espíritu en el Árbol (Antes vs. Después · 3×)
*(Capturas 3× HD verificadas y archivadas en la bitácora local de sesión.)*

#### Vitrina de Accesorios por Rareza y Coste (Antes vs. Auras, Mantos, Lauros y Sellos · 3×)
*(Capturas 3× HD verificadas y archivadas en la bitácora local de sesión.)*

### 3. Aprendizajes clave de la Entrada #2 (para BiEx y Opus)

1. **Solapamiento detectado en accesorios Raros ya obtenidos (`Sello del candelero de oro`):**
   Al inspeccionar la captura a 3× de *Sellos*, la insignia absoluta `li.raro::before` («RARO» arriba a la derecha) montaba encima del botón «Quitar» cuando el jugador **ya poseía** la pieza rara. Solución: mantener `::before` arriba a la derecha únicamente en `.raro.cerrado` (donde no hay botón) y renderizar `<em class="ap-rtag">Raro</em>` en línea junto al nombre en las piezas raras ya desbloqueadas, con `.ap-mn { display: block }`.
2. **Contraste temático de las 6 métricas en Pergamino:**
   Al añadir los medallones 5.º y 6.º (*Versos leídos* y *Cantos*), usar variables CSS `--vp-c5` / `--vp-c6` redefinidas bajo `:root[data-theme="light"] .ap-vp` garantizó contraste nítido en ambos temas.
3. **Semilla intacta en `arbolPoder`:**
   Bajar `GR_Y` a `316` y dibujar `ramita` y `ramasFrente` sin consumir ninguna llamada adicional de `rnd()` preservó al 100 % el contorno único del árbol de cada lector existente.
4. **Verificación léxica directa en `datos/libros/` (regla irrompible):**
   - `Prάc̅ṣεις 13:10` traduce **`sendas [rutas] directas`** (corregido en `propuesta_af18_af22.md` v2).
   - `Ἀpοκάlυpsις 12:3, 13:1, 19:12` **autoriza `diademas`** (distinto de `lauro [trenzado]` en `1 Κοrίndsιοι 9:25`).
   - `2 Κοrίndsιοι 11:8-9` (*saqueo/estipendio para diaconía*) da un fundamento escritural impecable para la competencia sana con bolsa excedente sin destruir jamás el progreso del lector.

### 4. Comprobaciones pasadas (Entrada #2)
- `node --check` en todos los scripts y validación de todos los `.json` / `.webmanifest`: **correcto**.
- `python3 wix/sellar.py`: **al día** (`2c36e68a291c`).
- Auditoría léxica de `juego.js` y `propuesta_af18_af22.md` v2 contra la lista prohibida de BiEx: **0 coincidencias**.
- Prueba de humo de las 8 rutas (`360 px` y `1280 px`): **0 errores de consola, 0 px de desplazamiento lateral**.
- Pruebas interactivas y capturas 3× (`280 px`, `360 px`, `412 px`, `1280 px`, 9 tamaños `--k`): **0 px de overflow**, arrastre 3D verificado (`--rx`/`--ry`), resonancia de pilares verificada (`--vp-luz`), cita `2 Κοrίndsιοι 4:7` desplegada in-situ y cierre con `Esc` verificado.

---

## Entrada #3 — 23 de noviembre de 2026 (Fluidez 60 FPS en Móvil, 12 Piedras Minerales, El Coloso, Cero Flasheo y Regletas)

**Rama:** `neon/AF33-ventana-poder` → **fusionada y publicada en `main`** (con autorización expresa de BiEx tras verificación completa)
**Archivos modificados:** `app.css`, `app.js`, `juego.js` (+ sellos automáticos vía `python3 wix/sellar.py` en `app.js`, `index.html`, `datos/archivos.json`).

### 1. Cambios realizados y causas raíz resueltas

1. **Eliminación total de cortes al desplazarse en AF33 · Ventana del Poder (`abrirVentanaPoder` v3) y en la ventana de Árbol:**
   - **Causa raíz #1 (el fondo seguía corriendo tras el modal bajo un desenfoque de pantalla completa):** `.modal::backdrop` aplicaba `backdrop-filter: blur(10px)` a toda la pantalla mientras las 66+ capas del Árbol seguían animándose detrás. Solución: `.modal.flot::backdrop` usa velo obsidiana/pergamino sin `backdrop-filter`, y un nuevo `MutationObserver` (`MO_MODAL`) + reglas `html.con-modal #vista ...` pausan al instante TODAS las animaciones CSS y WAAPI de `#vista` en cuanto abre una ventana modal (manteniendo viva la figura dentro de `celebrarForja`).
   - **Causa raíz #2 (giroscopio continuo + `preserve-3d` anidado bajo recorte circular):** `deviceorientation` disparaba ~60 veces por segundo en teléfonos buenos, re-invalidando `--rx`/`--ry` mientras el usuario desplazaba el modal; además, anidar `transform-style: preserve-3d` dentro de `.ap-vp-cam { overflow: hidden; border-radius: 50% }` obligaba a Chrome Android a recomponer en CPU. Solución en **AF33 v3**:
     - 5 planos orbitales consolidados en **3 planos SVG coprimos (`31.7 s`, `53.1 s`, `83.9 s`)** + **3 destellos ópticos circulares** directamente dentro de `.ap-vp-cam` (`contain: layout style paint`), sin `preserve-3d` anidado ni `filter: drop-shadow` sobre texto animado.
     - Relieve 3D + paralaje 2.5D activados **únicamente al interactuar** (`.inclinada`), regresando a `transform: none` y **0 % CPU en reposo**, sin `setPointerCapture` que pelee con el gesto vertical ni giroscopio pasivo.
     - `IntersectionObserver` sobre la esfera dentro de `.m-cuerpo` que activa `.ap-vp.fuera` (pausa automática al bajar a Pilares y Estadísticas).
     - Los 6 brillos infinitos de `.ap-vp-stbtn::after` se sustituyeron por un destello metálico único al tocar cada medallón.
   - **Causa raíz #3 (8–10 FPS en la página de Árbol):** `.ap-arbol` promovía ~66 capas simultáneas (`36` de savia + `30` de copa/motas), `.ser-in` nunca pausaba sus motas ni su niebla fuera de pantalla, las tarjetas de tienda corrían brillos infinitos y el muelle inferior `.jg-muelle` tenía `backdrop-filter: blur(18px)` fijo sobre toda la pantalla al desplazarse. Solución:
     - Recorte limpio de capas GPU en `arbolPoder` (~66 → ~29 totales: **12 capas WAAPI de savia** con pulso integrado de 16 px y **17 capas de vida** conservando exactamente la secuencia `rnd()` de cada lector).
     - `.ser-in` alterna `.quieto` fuera de pantalla y reduce motas de 6 a 4; brillos infinitos de `.ap-vitrina` sustituidos por lustre estático/hover; `.jg-muelle` migrado al patrón de vidrio sin `backdrop-filter` (K15); `contain: layout style` en `.ap-arbol`, `.ser-in` y `.jg-tarjeta`.
2. **Tesoro (`gema(i, tiene)` en `juego.js`) — 12 bloques minerales bíblicos únicos (`Ἀpοκάlυpsις 21:19-20`):**
   - Sustituido el rombo genérico idéntico por **12 siluetas y texturas minerales esculpidas**: *Jaspe* (cabujón verde veteado), *Zafiro* (óvalo azul real con motas doradas de pirita), *Calcedonia* (ágata azul-gris bandeada), *Esmeralda* (talla escalonada octogonal), *Sardónice* (estratos horizontales de camafeo), *Sardio* (gota cornalina encendida), *Crisólito* (cojín verde-oliva dorado), *Berilo* (prisma hexagonal cristalino), *Topacio* (talla radiante imperial), *Crisopraso* (cabujón verde manzana translúcido), *Jacinto* (marquesa ámbar-fuego) y *Amatista* (drusa de 3 cristales violetas).
3. **Cuenta atrás oficial de *El Coloso de la Tradición* (`sábado 28 de noviembre de 2026 · 18:00 UTC`):**
   - `cuentaAtras` optimizada para actualizar `.textContent` **en sitio** sin reconstruir nodos DOM cada segundo y en pausa con la pestaña oculta.
   - `tarjetaColoso(compacta)` en **Escudriña → Mundo** (completa) y **Escudriña → Hoy** (compacta), con rejilla horológica simétrica de **4 columnas** (días, horas, minutos y segundos en una sola fila limpia en móvil) y conversión automática a hora local y ciudades del mundo.
   - Aviso discreto global en `app.js` (`avisoColoso` vía `dslMostrar`): máximo **2 veces al día** (espaciadas ≥ 6 h), silencioso si hay modal abierta o navegación automatizada.
4. **Eliminación del flasheo y doble parpadeo al volver atrás desde Buscar (cierre definitivo de `AL10` — nota para Opus):**
   - **4 causas raíz resueltas conjuntamente en `app.css` y `app.js`:**
     1. `.modal.sin-entrada` solo anulaba `animation`, pero bajo `@supports (overlay: auto)` seguía corriendo `transition: opacity .2s, transform .2s`. Ahora `.modal.sin-entrada` y su `::backdrop` anulan tanto `animation` como `transition`.
     2. En `popstate` (`app.js`), se aplica `.sin-entrada` con forzado síncrono de reflujo (`void modal.offsetWidth`) antes de reabrir el modal guardado.
     3. En `enrutar()` (`app.js`), navegar desde un resultado cierra el modal con `.sin-entrada` para evitar choque visual con la vista de llegada, y `velar()` suprime `html.aparece #vista` mientras un modal cubre la pantalla.
     4. `abrirBusqueda()` (`app.js`) conserva en memoria el listado de resultados ya renderizado (`st.bq`) y ejecuta `buscarYa()` de forma síncrona al volver atrás, eliminando el salto vacío de `30 ms` y el recargado de versos (`…`).
5. **Supresión reforzada de barras de desplazamiento («regletas») en `app.css`:**
   - Eliminadas 3 reglas heredadas que aún declaraban `scrollbar-width: thin` (`.riel`, `.tl-mapa`, `.mm-pop`).
   - Blindaje global con `scrollbar-width: none !important; scrollbar-color: transparent transparent !important; -ms-overflow-style: none !important` y `::-webkit-scrollbar* { display: none !important; width: 0 !important; height: 0 !important }`.

### 2. Capturas verificadas a 3× de densidad (Entrada #3)

#### Tesoro: las 12 piedras del fundamento con diseño mineral propio y ventana de detalle (360 px · 3×)
*(Capturas 3× HD verificadas y archivadas en la bitácora local de sesión.)*

#### Cuenta atrás de *El Coloso de la Tradición* en Mundo y en Hoy (360 px · 3×)
*(Capturas 3× HD verificadas y archivadas en la bitácora local de sesión.)*

#### AF33 v3 · Cámara Orbital del Poder optimizada sin cortes (Móvil 360 px, Estadísticas + cita, Escritorio Obsidiana y Pergamino)
*(Capturas 3× HD verificadas y archivadas en la bitácora local de sesión.)*

### 3. Notas técnicas para Opus (`biex-juego` y seguimiento)

1. **`AL10` (flasheo al volver atrás desde Buscar):** ya resuelto en `app.css` y `app.js` y verificado cuadro por cuadro en Playwright (`open: true`, `n: 24`, `opacity: 1`, `aparece: false`, `sin-entrada: true` desde la microtarea inicial). Puede tacharse del tablero.
2. **4 optimizaciones concretas de llamadas al Worker de Cloudflare encontradas al auditar `juego.js`:**
   - **Clasificación «Todos los rangos» (`juego.js`):** dispara `Promise.all(RANGOS.map(...))` (una petición por cada rango en paralelo). Un solo endpoint `/clasificacion?rango=todos` con `Cache-Control: public, max-age=60, s-maxage=60` reduce ~6× las invocaciones de esa vista.
   - **Sondeo en vivo `/vivo` y `/presentes` (`juego.js:1966, 6730, 6899`):** consulta cada `25 s` sin caché de borde. Añadir `Cache-Control: public, max-age=30, s-maxage=30` en el Worker hace que 500 lectores concurrentes consuman ~2 invocaciones/min en vez de ~1.200/min.
   - **`dibujarPanel` (`juego.js:2587`):** `if (sec !== "juntos") salasAbiertas(false)` consulta `/salas` en cambios de pestaña fuera de *Juntos*. Subir TTL cliente a 90 s + caché de borde de 30 s evita llamadas redundantes.
   - **Vista de *Árbol*:** dispara `/yo`, `/poder`, `/arbol?prof=3` y `/arbol/vivo` por separado; omitir `/yo` si está fresco (< 60 s) y cachear `/arbol` 30 s en borde recorta ~40 % de invocaciones por visita.
3. **Arquitectura sugerida para avisos automáticos de errores (`biex-juego` + `app.js`):**
   - Cliente (`app.js`): `window.addEventListener("error")` y `unhandledrejection` deduplicando por firma (`mensaje + archivo + línea`), tope estricto de **3 envíos por sesión**, sin datos personales ni contenido del usuario, enviado con `navigator.sendBeacon("/api/juego/error", payload)` (~20 líneas, 0 impacto en rendimiento).
   - Servidor (`biex-juego`): endpoint ligero `POST /api/juego/error` con límite por IP/huella de publicación (`datos/archivos.json`), agrupando los últimos 100 errores únicos en KV/D1 y avisando (Telegram/correo/webhook) únicamente cuando aparece una firma nueva o supera un umbral de usuarios tras un despliegue.

### 4. Comprobaciones pasadas (Entrada #3)
- `node --check` en los 12 scripts `.js` del repositorio y validación de todos los `.json` / `.webmanifest`: **correcto**.
- `python3 wix/sellar.py`: **al día** (`e354dcf10fb2`).
- Auditoría léxica y de pureza iconográfica en todo el diff (`app.css`, `app.js`, `juego.js`) y en `propuesta_af18_af22.md`: **0 coincidencias prohibidas**.
- Prueba de humo de las 8 rutas (`360 px` y `1280 px`): **0 errores de consola, 0 px de overflow, `scrollbar-width: none` y `sbW = 0` en todas**.
- Prueba automatizada *Buscar → abrir verso → volver atrás*: **0 cuadros vacíos, `opacity: 1` inmediato, 24 resultados presentes desde el cuadro 0**.
- Prueba de rendimiento AF33 v3 y Árbol: `inclinadaAtRest: false`, `transformAtRest: "none"`, `bgArbolPaused: true`, `fuera_when_scrolled: true`, `saviaLayers: 12`, `muelleBlur: "none"`, `overflowX_9: []` en `280 / 360 / 412 / 1280 px`.

---

## Entrada #4 — 23 de noviembre de 2026 (`N10`, `AF35`, `AF49`, Tablero «Tu avance», Tesoro por libro, Simetría en Mundo, Fluidez y Reseñas)

**Rama:** `neon/pulido-n10-af35-af49` (commit `534bdc8`, desde `origin/main` en `0648f3d`)
**Propuesta:** [PR #2 · N10, AF35, AF49 y pulido general](https://github.com/cristianteologo/biex-lector/pull/2) (revisión automática `revision` y `Cloudflare Pages` en verde; lista para que BiEx apruebe y fusione a `main`)
**Vista previa en vivo:** [https://neon-pulido-n10-af35-af49.bibliaexacta.pages.dev/#/escudrina/arbol](https://neon-pulido-n10-af35-af49.bibliaexacta.pages.dev/#/escudrina/arbol)
**Archivos modificados:** `app.css`, `app.js`, `juego.js` (+ sellos automáticos vía `python3 wix/sellar.py` en `index.html`, `datos/archivos.json`).

### 1. Tareas del tablero de Opus cerradas

1. **`N10 · Escudo de nivel` (`.jg-med` en `juego.js`):**
   - El escudo usaba `em` relativos a `html { font-size }` (`--k` hasta `1.42` en tamaño 9) y heredaba la fuente de lectura (`dislexia`), haciendo que «NIVEL» atravesara el aro dorado y rozara la cifra.
   - Se fijaron dimensiones exactas en `px` sobre el aro interno (`50 × 58.6 px`, radio libre `14.22 px`), con tipografías fijas de la casa (`"BiEx Interfaz"` a `5.4 px` con `letter-spacing: .7px` para «NIVEL» y `"BiEx Titular"` a `15 / 13.5 / 11 px` para 1, 2 o 3 cifras). Resultado a tamaño 9 (`21.3 px` raíz): separación vertical limpia de **`2.39 px`** entre «NIVEL» y el dígito, sin colisión con el aro ni con «Adelante» en `360 px` y `412 px` ni en ninguna de las 3 tipografías.
2. **`AF35 · Secciones en páginas largas` (`app.js` + `app.css`):**
   - Declaradas marcas `data-sec` en `vistaFuenteQ` (las 9 partes), `vistaCronologia` (10), `vistaRanking` (4), `vistaEstudio` (`datos` 12, `fechas` 6, `falacias` 5), `vistaNiveles`, `vistaMarcadores`, `vistaPlanes` / `vistaPlan` (2) y `vistaApp` (3).
   - Límite de `secciones()` ampliado de 8 a 12 con lista desplegable desplazable sin barra visible (`.sr-secs`).
   - `irSec(el)` mejorada: centra las secciones entre la barra superior y el muelle inferior cuando caben en pantalla, y posiciona el encabezado holgado bajo la barra superior (`~102 px` en `360 px`, `barH = 57 px`) cuando la sección es más alta que el área visible.
3. **`AF49 · Armonía tipográfica` (`app.css` + `juego.js`):**
   - Corregida la variable inexistente `var(--f-titulo)` → `var(--f-display)` en `.cuenta-m b`, `.co-res b` y `.av-cif b`.
   - Armonizados interlineados, pesos, espaciado de cintillos (`.eyebrow`), encabezados en `clara` (`font-weight: 500`, `line-height: 1.2`) y `dislexia` (`line-height: 1.26`), títulos modales (`.m-cab .m-tit b`) y herencia de `var(--lh)` en párrafos de estudio y Jünemann (`.jnm-v`). **Cero alteración del tamaño del texto del verso al leer.**

#### Tabla AF49 · Antes vs. Después (comprobada en los 9 tamaños `--k` y las 3 letras)

| Elemento | Antes | Después | Efecto visual |
| --- | --- | --- | --- |
| `.cuenta-m b`, `.co-res b`, `.av-cif b` | `var(--f-titulo)` (inexistente → caía a sans-serif) | `var(--f-display)` (`BiEx Titular`) | Cifras horológicas y de avance con jerarquía editorial unificada |
| `.jg-med .nvk` / `.jg-med b` (`N10`) | `.44em` / `1.05em` (crecía con `--k` hasta chocar con el aro) | `5.4 px` (`BiEx Interfaz`) / `15 · 13.5 · 11 px` (`BiEx Titular`) | Lectura nítida en tamaño 1..9 y en `dislexia`, `2.39 px` de aire |
| `.eyebrow` | `letter-spacing: .24em` (muy abierto en `clara`) | `.2em` (`clásica`/`dislexia`), `.14em` (`clara`), `line-height: 1.35` | Cintillos equilibrados sin saltos bruscos en 280–360 px |
| Encabezados (`h1` / `h2` de vistas) | Peso único `600` y `line-height` ajustado al 1.05 en todas las letras | `clásica`: `1.08–1.15`; `clara`: peso `500`, `lh: 1.2`; `dislexia`: `lh: 1.26` | Sin apelotonamiento en letras anchas ni en tamaño 9 |
| `.m-cab .m-tit b` (título modal) | Tamaño fijo | `clamp(.94rem, .86rem + .38vw, 1.12rem)`, `letter-spacing: .08em` | Escala proporcionada entre 280 px y 1280 px |
| Párrafos largos (`.q-p`, `.est-c p`, `.jnm-v`, `.pl-tarjeta p`) | `line-height` fijo (ignoraba «Interlineado amplio») | `calc(1.65 * var(--lh))` / `calc(1.7 * var(--lh))` | Respetan la preferencia de interlineado del lector |
| Texto del verso (`.vl .vt`, `.vs`) | Escala `--k` (`15.39 px` en t1 → `24.28 px` en t9) | **Intacto (0 px de cambio)** | Lectura bíblica 100 % preservada |

### 2. Mejoras de diseño, fluidez y sugerencias de lectores

1. **Tablero horológico interactivo «Tu avance» (`tarjetaAvance` en `juego.js`):**
   - Cabecera de resumen (`.jg-av-cab`, prefijada para evitar colisión con `.av-cab` del modo Análisis) con total del período en `BiEx Titular`, insignia positiva de crecimiento o mejor marca (nunca flechas de pérdida) y lectura viva del día seleccionado.
   - 5 tarjetas interactivas (*Experiencia, Versos, Minutos, Aciertos, Capítulos*): al tocar cualquiera, el gráfico cambia al instante a esa magnitud.
   - Rejilla con máximo, mitad y línea punteada de media, columnas biseladas doradas con columna actual destacada en carmesí y punto luminoso en la mejor marca, inspeccionables al toque o con puntero.
2. **«Lecturas completas» movida de Árbol → Tesoro + «Progreso por libro (%)» (`tarjetaLecturas`, `A.progresoLibros`):**
   - Ubicada junto a las 12 piedras y los fragmentos de papiro en *Tesoro* (descargando *Árbol*).
   - Nuevo desplegable **«Progreso por libro»** (0 peticiones al servidor: calcula localmente desde `jg:cf` y `LEI`), mostrando el porcentaje, barra dorada, versos leídos/totales de los 27 libros y enlace directo al siguiente capítulo sin leer.
3. **Simetría en *Mundo → Clasificación / Prestigio* y aviso sutil en *El Coloso*:**
   - Corregida la asimetría en *Prestigio* (`filaC`): se añadió la 2.ª columna `.jg-ciu` con medallón de ubicación que faltaba en la rejilla de 4 columnas (antes el nombre de la ciudad quedaba aplastado en el hueco de `34 px` como «Bo...», «Me...»).
   - *El Coloso de la Tradición* (`.jg-coloso`): añadido destello dorado pulsante «Novedad · Próximo evento» y barrido diagonal especular muy sutil por compositor puro (`::after`), pausado automáticamente al desplazarse, en modales o con «Sin animaciones».
4. **Causa raíz y corrección de las caídas aleatorias de FPS y de la fluidez en lectura verso a verso (`.vl`):**
   - **Caídas intermitentes aleatorias:** `lucesVivas` (canvas ambiental de haces de luz) seguía redibujándose cada `140 ms` incluso durante el desplazamiento táctil, y `meteoros` (asteroides) lanzaba `.met-letra` giratorios con `-webkit-background-clip: text` (repintado en CPU en cada cuadro). Solución: pausa inmediata de `lucesVivas` durante `html.desplazando` con cadencia suave de `260 ms`; diferimiento de nuevos meteoros mientras hay scroll y sustitución de `background-clip: text` por color dorado luminoso con `will-change: transform`; `.vivo-motas` reducidas de 16 a 10.
   - **Lectura verso a verso (`.vl`) y zoom con trackpad (`.jg-pie`):** `AF40` (`.hoja.jg-pies .vl::before`) enganchaba y desenganchaba `animation-timeline: view()` + `box-shadow` en 60–80 versos en cada arranque/parada de scroll; ahora la línea de tiempo permanece montada y solo alterna `visibility` sin `box-shadow`. Además se eliminaron lecturas síncronas forzadas (`getComputedStyle` en `ponerLB` y `P.offsetWidth` tras escritura DOM en `ponerPie`) cacheando métricas de `.vn` y `.jg-pie`, y se escuchó `visualViewport.resize` con límite dentro de `.hoja` para que el icono de leído/repaso nunca se desplace al hacer pellizco/zoom en el trackpad.
5. **Cierre del último sobresalto (~0,5 s) al volver atrás desde Buscar y apertura estable de `vistaPalabra`:**
   - Cuando `popstate` reabre Buscar, `enrutar()` ya no reconstruye el capítulo subyacente al mismo tiempo (guarda la ruta en `M.rutaPend` y solo la aplica si el usuario cierra Buscar sin elegir otro resultado).
   - En `.modal[open]` dentro de `@supports (overlay: auto)`, se sustituyó la animación simultánea por `@starting-style` para eliminar el doble rebote; se quitó el salto de `html.con-modal .barra { transform: none }`; se reservó `min-height` en `.lx-caja` y `.ms-pal`, y se precarga `lexico()` en segundo plano al abrir capítulo.
6. **Ajustes aplicados de `Reseñas_y_sugerencias_.docx`:**
   - **Las Ramas (`dibujoArbol`):** la rueda normal del ratón/trackpad vuelve a desplazar la página; el gráfico solo hace zoom con pellizco (`e.ctrlKey || e.metaKey`).
   - **Misiones dinámicas (`destinoMision`):** `nuevos`, `vida` y `cartas` saltan al primer capítulo local con versos sin marcar (ya no mandan siempre al inicio de `Lουκᾶς` ni repiten capítulos completos); `repaso` lleva a versos ya leídos; `preguntas` busca una prueba pendiente o guía con aviso claro.
   - **Claridad en «Repasado» / «Leído»:** al tocar el icono mientras corre la espera breve del temporizador, ahora avisa siempre con claridad en vez de encolar en silencio, y `vistaVerso` no anuncia «Verso repasado» antes de confirmarse.
   - **Copiado rápido con cita+enlace BiEx y marcadores de color en 1 toque:** micro-barra única ligera `.vq-bar` flotando sobre el borde superior derecho del verso en escritorio/teclado (sin tapar ni una palabra ni añadir nodos por verso) + tira rápida `.fv-rap` justo debajo del texto del verso en `vistaVerso` para móvil y escritorio.
   - **Robustez extra detectada al probar:** blindaje `Object.keys(r.libros || {})` en la vista *En vivo* de *Mundo* (`juego.js:7131`).

### 3. Comparativa visual verificada a 3× de densidad (Entrada #4)

#### `N10 · Escudo de nivel` a tamaño máximo (`tam = 9`, `--k = 1.42`, 360 px y 412 px · 3×)
*(Capturas 3× HD verificadas y archivadas en la bitácora local de sesión.)*

#### *Mundo → Clasificación / Prestigio* y aviso sutil de *El Coloso* (Antes vs. Después · 3×)
*(Capturas 3× HD verificadas y archivadas en la bitácora local de sesión.)*

#### Nuevo tablero «Tu avance» (móvil y escritorio), «Lecturas completas» en Tesoro con progreso por libro (%), `AF35` y herramientas rápidas del verso
*(Capturas 3× HD verificadas y archivadas en la bitácora local de sesión.)*

### 4. Aprendizajes clave y notas técnicas para Opus (`biex-juego` y seguimiento)

1. **Colisión evitada con `.av-cab` del modo Análisis (`app.css:356`):**
   Al inspeccionar la primera captura de *Tu avance*, la cifra total salía alineada a la derecha porque `app.css` ya emplea `.av-cab b` para el número de verso en el modo *Análisis*. Renombrar el bloque del juego a `.jg-av-cab` / `.jg-av-izq` / `.jg-av-der` protegió ambas vistas y confirmó la importancia de auditar colisiones CSS entre `juego.js` y `app.css` (auditoría automatizada final: 0 colisiones).
2. **Petición de BiEx sobre *Rollos de colección* (`AF19` en `biex-juego`):**
   BiEx pidió revisar la regla actual («14 días con lectura dentro de 60 días seguidos; una vez alcanzado, cuenta para siempre») para pasar a un **marcador dinámico de al menos 14 días en un mes** que sí pueda variar. Siguiendo la regla de no contradecir en la interfaz lo que calcula el servidor, se dejó el texto actual intacto hasta que Opus ajuste el cómputo en `biex-juego` y ambos repositorios se actualicen sincronizados.
3. **Puntos de `Reseñas_y_sugerencias_.docx` que requieren `biex-juego` (Opus):**
   - **Pruebas de preguntas (`POST /api/juego/prueba`):** un lector reportó «algo no salió bien» al abrir una prueba; conviene revisar en logs del Worker si faltaba contenido de preguntas en ciertos capítulos o si hubo algún rechazo HTTP puntual.
   - **Marcadores personalizados compartibles para estudios comunitarios:** los marcadores y etiquetas propias ya existen localmente (`.mk-etiq`), y compartirlos para que BiEx descubra estudios/patrones de la comunidad entra dentro de **`AC9 · Muro de reflexiones`** (reservada a BiEx y Opus).
   - **Persistencia de lecturas (`jg:cf`):** aclarar si el lector vio versos de `Lουκᾶς` «para leer de nuevo» por completar una lectura (`K` sube y las marcas bajan un nivel conservando el historial en `lk.h`) o por cambiar de dispositivo/navegador sin vincular cuenta; el servidor conserva todas las cuentas sin borrar avance.
4. **`AA12 · Widget en Windows 11`:** se presentó a BiEx el plan arquitectónico completo (manifiesto + tarjetas adaptables en Edge + guías manuales Android/iPhone/Linux) sin tocar `sw.js` ni los manifiestos hasta recibir su aprobación.

### 5. Comprobaciones pasadas (Entrada #4)
- `node --check` en todos los scripts `.js` del repositorio y validación de todos los `.json` / `.webmanifest`: **correcto**.
- `python3 wix/sellar.py`: **al día** (`1f22109dd1c6`).
- Auditoría léxica y de pureza iconográfica en todo el diff (`app.css`, `app.js`, `juego.js`): **0 palabras ni glifos prohibidos**.
- Prueba de humo en modo desconectado (`360 px` y `1280 px`, 8 rutas): **0 errores, 0 px de overflow**.
- Prueba completa en Playwright con cuenta simulada (`280 / 360 / 412 / 1280 px`, 3 letras × tamaños 1, 3, 9): **0 errores de ejecución, 0 px de overflow**, `N10` (`2.39 px` de separación a tamaño 9), `AF35` (9/10/4/12/6/5/2/3 secciones + salto centrado en `top: 102 px`), `Tu avance` interactivo, `Lecturas` en Tesoro con 5/27 libros iniciados (`Fιlḗmōn 100 %`), `Prestigio` 4 columnas simétricas, misiones dinámicas saltando capítulos ya leídos (`#/MRK/3`), micro-barra `.vq-bar` y tira `.fv-rap` operativas, y vuelta atrás desde Buscar sin recarga ni salto.


---

## Entrada #5 — 23 de noviembre de 2026 (Fusión de PR #2, Pulido UX Integral, Fuente Q Interactiva, Nitidez HD, Dracmas Uniformes, Blindaje de Red/Audio y `AA12 · Widget`)

**PR #2 fusionada a `main`:** con autorización expresa de BiEx, PR #2 quedó fusionada y publicada en producción (`23a98ad` → `https://bibliaexacta.pages.dev/`).
**Nueva rama:** `neon/pulido-ux-fuenteq-aa12` (commit `b372dab`, desde `origin/main` en `23a98ad`)
**Propuesta:** [PR #3 · Pulido UX integral, Fuente Q interactiva, nitidez HD, blindaje de red y AA12](https://github.com/cristianteologo/biex-lector/pull/3)
**Vista previa en vivo:** [https://neon-pulido-ux-fuenteq-aa12.bibliaexacta.pages.dev/](https://neon-pulido-ux-fuenteq-aa12.bibliaexacta.pages.dev/)
**Archivos modificados:** `app.css`, `app.js`, `juego.js`, `intro.js`, `manifest.webmanifest`, `sw.js`, `widgets/verso-dia.json`, `widgets/verso-dia-datos.json` (+ sellos automáticos vía `python3 wix/sellar.py` en `index.html`, `intro-cargador.js`, `datos/archivos.json`).

### 1. Mejoras aplicadas y causas raíz resueltas

1. **Navegación de libros, capítulos, versos y análisis de palabra (`app.js` + `app.css`):**
   - **Libros por categorías en el menú del capítulo (`navLibros`):** comparte `gruposLibros(chips)` con `abrirLibros()` para agrupar los 27 libros por categorías con simetría en la última fila.
   - **Marcas de avance de lectura y botón «Continuar donde quedé» (`navContenido`):** cruza `jg:cf` / `jg:rp` / `jg:rep` con `LEI` para marcar capítulos completos (`.lei-c` con `✓`), parciales (`.lei-p` con punto dorado) y versos leídos/repasados (`.lei-v` / `.lei-r`), ofreciendo arriba el botón `.nav-cont` directo al siguiente verso pendiente.
   - **Selector rápido de capítulo y verso dentro del Análisis de palabra (`vistaPalabra`):** `cabModal` acepta título interactivo (`.m-tit-btn`) que despliega `.fp-ir-pan` con capítulos y versos del mismo libro (con sus marcas de lectura) y salta al verso elegido sin salir del análisis.
   - **Gesto «Atrás» limpio desde la Biblioteca (`irDesdeModal`):** antes, llamar a `cerrarModal()` (`history.go(-n)` asíncrono) justo antes de `location.hash = ...` provocaba que el salto atrás chocara con la nueva ruta. `irDesdeModal` desenrolla los pasos temporales de la ventana y ejecuta la navegación dentro del `popstate` (`M.irTrasSalto`), logrando que «Atrás» regrese directo a la vista real inmediatamente anterior (`#/MRK/1 → Biblioteca → #/MAT/5/l/3 → Atrás → #/MRK/1`).
   - **Cero flasheo y cero salto al abrir Análisis de palabra:** `vistaLibro` conserva el capítulo abierto sin borrar a `[cargando()]` al pasar de Lectura a Análisis; `enfocar()` omite `scrollIntoView(start)` + `asentar()` cuando `destelloSig` va directo a `destellarPalabra()`; y `MS_CAP_SYNC` pinta el aparato manuscrito en el cuadro 0 cuando ya fue precargado en reposo (`msPending: false`).

2. **Legibilidad, estética y gestos en lectura (`app.css`, `app.js`, `juego.js`):**
   - **Palabras casi exóticas (`--rara-sub`):** cambiado el subrayado verde al azul real-medianoche más oscuro perceptible (`#234fa8` en obsidiana / `#14316b` en pergamino, `1.4 px`).
   - **Una sola línea vertical en versos (`.vl`):** eliminadas las 4 fuentes de línea doble (`box-shadow: inset` en `.vl.mk`/`.vl.marcado`/`.vl.anadido`, `.hoja.jg-pies .vl::before` con `animation-timeline: view()`, `.jg-ah .f` duplicado en `.hoja.jg-pies`, y el doble borde de `.vl .vn.jg-repaso::after` unificado en un degradado de `3 px`).
   - **Halos luminosos sutiles en toda la hoja del capítulo:** `.hoja` suavemente translúcida (`82 %` oscuro / `86 %` claro) con `.libro .hoja::before` estático de 0 % CPU en `z-index: -1`.
   - **Teclado virtual en móvil (`visualViewport`):** `html.teclado-abierto .modal[open]` sincroniza `top: var(--vvt)` y `height: var(--vvh)` al área real visible para que al desplazarse hacia arriba escribiendo notas nunca quede oculta la cabecera.
   - **Aviso flotante de perícopa (`.aviso-flot`):** rediseñado en cápsula obsidiana/oro (y pergamino/oro en tema claro) y elevado automáticamente (`gap: 26 px`) sobre `.jg-sala-p` y sobre los botones `.jg-lb` / `.jg-lbp` (`html.jg-con-lb`).
   - **8 colores de marcador y barra rápida limpia:** añadidos `turquesa` («Conexión») y `ámbar` («Promesa»); panel `.fv-rap` simétrico con 2 botones iguales, lectura viva del tema activo y rejilla de 8 gemas; en móvil, `.vq-bar` se abre con pulsación prolongada (`360 ms`, cancelada si hay scroll) y bloquea aperturas accidentales por `focusin` al cerrar una ventana (`M.cerradaEn`).

3. **Fuente Q interactiva (`vistaFuenteQ` en `app.js` + `app.css`):**
   - Barras porcentuales biseladas con foco interactivo entre tramos y tarjetas de leyenda (conteo + `%`).
   - Filtro `.q-orden-seg` en 3 columnas exactamente simétricas (`103 px × 3` en `360 px`).
   - Mapa de orden rediseñado con **58 cintas Bézier cúbicas doradas** + curvas azul-pizarra de Μᾶrκος, **116 nodos luminosos**, selector paso a paso (`1 / 58`) y tarjeta viva `.q-orden-ficha` con `% literal` y salto directo a columnas.

4. **Escudriña: nitidez HD, barra de Árbol, dracmas uniformes y transparencia de progreso (`juego.js`):**
   - **Escudo de nivel HD (`.jg-med`):** `filter: drop-shadow` retirado del contenedor padre y aplicado únicamente a `.jg-med svg`, eliminando el suavizado raster sobre `NIVEL` y los dígitos a 3× DPR.
   - **Barra de nivel única en Árbol (`.jg-barra.ap-nivel-bar`):** mantiene exactamente `8 px` de alto con marcas grabadas de cuarto, relleno de bronce y savia dorada y cuenta luminosa en el borde (0 % CPU).
   - **Dracmas uniformes (`--dr-oro` / `--dr-falta`):** mismo color en Árbol (`.ap-cif-dr`), Ser interior (`.ap-tienes`), Atributos (nueva píldora `.ap-saldo`) y Tienda; botones codificados en oro (`.dr-ok`) cuando alcanzan o terracota sobria (`.dr-falta`) cuando faltan dracmas.
   - **Transparencia en «Progreso por libro» (`tarjetaLecturas`):** si el total guardado en el servidor supera los capítulos cacheados localmente en ese dispositivo, muestra una nota clara explicando que el total exacto permanece intacto en la cuenta y el desglose se completa al visitar cada capítulo.

5. **Resiliencia en conexiones deficientes, audio cinematográfico y `AA12 · Widget en Windows 11`:**
   - **Red y audio:** `redLenta()` y `fetchConTope()` con `AbortController` (`10 s` / `14 s` / `7 s`) en `traer()`, `NUBE.pedir()`, `dslVivo()` y `juego.js pedir()`; retroceso exponencial en `enVivo()`; eliminación del bombardeo `60 fps` de `audio.play()` en `abrirGuia` (`readyState >= 2` + enfriamiento `1200 ms`); margen ampliado a `950 ms` en `intro.js asegurarSonido()` y omisión de descarga de fuentes externas en red lenta/ahorro de datos.
   - **`AA12 · Widget en Windows 11` (aprobado por BiEx):** plantilla Adaptive Card v1.5 en `widgets/verso-dia.json`, respaldo `widgets/verso-dia-datos.json`, bloque `"widgets"` y acceso rápido `"Escudriña"` en `manifest.webmanifest`, ciclo completo (`widgetinstall`, `widgetresume`, `widgetclick`, `widgetDatos`) en `sw.js` usando `datos/destacados.json` en caché local (0 peticiones extra al servidor) y tarjeta guía «Widget en tu pantalla» en `#/app` para Windows 11, Android, iPhone/iPad y Linux.

### 2. Capturas verificadas a 3× de densidad (Entrada #5)

#### Escudo HD a 3×, aviso obsidiana/oro sobre Sala, una sola línea vertical y subrayado azul profundo (`VEREDAS`)
*(Capturas 3× HD verificadas y archivadas en la bitácora local de sesión.)*

#### Navegador con marcas de lectura + «Continuar donde quedé», libros por categorías, selector en Análisis de palabra y 8 gemas de marcador
*(Capturas 3× HD verificadas y archivadas en la bitácora local de sesión.)*

#### Fuente Q interactiva, barra compacta de Árbol, dracmas uniformes y guía `AA12` en `#/app`
*(Capturas 3× HD verificadas y archivadas en la bitácora local de sesión.)*

### 3. Nota breve para Opus (`biex-juego`)
- **Sincronía inicial de «Progreso por libro» en dispositivos nuevos:** hoy `biex-juego` guarda permanentemente el mapa completo de marcas por verso (`cns`) y devuelve el capítulo abierto al llamar `/leer`, `/leido`, `/prueba` y `/marcas/repasos`, pero si un jugador entra en un teléfono nuevo sin abrir capítulos previos, el caché local `jg:cf` empieza vacío (aunque el total exacto `lk` del servidor es siempre correcto). Un endpoint ligero opcional `GET /api/juego/marcas` que devuelva `{ cns }` (una sola vez al iniciar sesión en un dispositivo nuevo, ~3–5 KB comprimidos) completaría al instante las barras de los 27 libros y las marcas del navegador de capítulos en cualquier dispositivo recién vinculado.

### 4. Comprobaciones pasadas (Entrada #5)
- `python3 wix/sellar.py && git diff --exit-code --stat`: **al día** (`4749579b190a`).
- `node --check` en todos los `.js` (incluidos `sw.js`, `intro.js`, `app.js`, `juego.js`) y validación de **469** archivos `.json` / `.webmanifest` (incluidos `widgets/verso-dia*.json`): **correcto**.
- Auditoría léxica y de pureza iconográfica en todo el diff, `widgets/` y `propuesta_ajedrez_biblico.md`: **0 palabras prohibidas de usuario, 0 glifos prohibidos**.
- Prueba de humo de las 8 rutas (`360 px` y `1280 px`): **0 errores de consola, 0 px de overflow**.
- Auditoría de simetría y tipografía (`280 / 360 / 412 / 1280 px` × 3 fuentes × tamaños 1 y 9): **0 desbordes (`symmetry_audit_issues: []`)**, **0 errores de ejecución**.


---

## Entrada #6 — 23 de noviembre de 2026 (Fusión de PR #3, Cesta «Marcar leído», Fuente Q Azul 60 fps, 12 Colores Libres, Marcas Horológicas y Cero Solapes en Escudriña)

**PR #3 fusionada a `main`:** con autorización expresa de BiEx, PR #3 quedó publicada en producción (`c881c4c` → `https://bibliaexacta.pages.dev/`).
**Nueva rama:** `neon/pulido-t7-cesta-q-marcas` (commit `0dad494`, desde `origin/main` en `c881c4c`)
**Propuesta:** [PR #4 · Pulido integral: Cesta leída, Fuente Q azul 60 fps, 12 colores libres, marcas horológicas y cero solapes](https://github.com/cristianteologo/biex-lector/pull/4) (revisión automática `revision` y `Cloudflare Pages` en verde)
**Vista previa en vivo:** [https://neon-pulido-t7-cesta-q-marca.bibliaexacta.pages.dev/](https://neon-pulido-t7-cesta-q-marca.bibliaexacta.pages.dev/)
**Archivos modificados:** `app.css`, `app.js`, `busqueda.js`, `juego.js` (+ sellos automáticos vía `python3 wix/sellar.py` en `index.html`, `datos/archivos.json`).

### 1. Cambios aplicados y causas raíz resueltas

1. **Verso de la Cesta / Reparto con botón «Marcar leído» (`tarjetaVerso` en `juego.js`):**
   - El verso que acompaña *La cosecha* y el *Reparto de atributos* ahora incluye un botón **«Marcar leído»** (o **«Marcar repasado»** si ya se leyó otro día) junto al enlace al capítulo.
   - Mide el tiempo real de lectura desde que el verso queda visible (`_visto` tras el fundido de la aguja) frente a `S.cfg.msMin` / `S.cfg.msPalabra`: si se toca pronto, muestra una cuenta serena (`Leyendo… X s`) antes de acreditarlo —sin falsificar jamás el tiempo— y lo envía al endpoint existente `POST /lectura/tanda` (`[c, cap, v, ms, 3]`), actualizando `A.marcarLeido`, `jg:cf`, `jg:hoy` y celebrando cualquier premio o misión que se complete.

2. **Eliminación total de contenedores pegados y solapes en las 6 pestañas de Escudriña (`juego.js`):**
   - **Causa raíz hallada con auditoría geométrica en Playwright:** `.jg-dos` únicamente tenía `display: grid; gap: 18px` dentro de `@media (min-width: 720px)`. Por debajo de `720 px` carecía de `gap`, pegando las tarjetas en **Mundo** (*Tu liga* ↔ *Misión mundial*), **Hoy** (*Misiones de hoy* ↔ *Hoy*), **Juntos** (*Leer en compañía* ↔ *Compañía*), **Árbol** (*Tu ser interior* ↔ *Tienda de dracmas*) y **Bienvenida**.
   - **Segundo solape hallado en *Árbol › Tu ser interior*:** `.ap-arm` cambiaba a 1 columna solo bajo `359 px`, dejando botones de `81 px` entre `360–480 px` donde «Calzado de la placidez» y «Escudo de la confiabilidad» se apretaban. Al ampliar el punto de corte a `max-width: 480px` y unificar `.panel.jg > .ap { gap: 18px }`, los 6 botones de armadura lucen holgados (`142 px`, `0 px` de desborde) y las 6 pestañas pasan con **`touching: []`** en `360 px` y `1280 px`.

3. **Cabecera simétrica de *Atributos* (`.ap-cab` en `juego.js`):**
   - En móvil (`< 520 px`), organiza la cabecera en una banda arquitectónica simétrica de 2 filas: `puntos por repartir` centrado arriba sobre un filete dorado sutil, y debajo `[◎ dracmas]` a la izquierda y `[◆ PODER ›]` a la derecha (`18 px` de aire entre ambos, cero colisión). En pantallas `>= 520 px`, una sola barra horizontal equilibrada.

4. **Aviso llamativo para participar en la *Misión mundial* (`tarjetaMision` y `avisoMisionMundial` en `juego.js`):**
   - En **Mundo**, la tarjeta activa se ilumina con marco dorado (`.jg-mis-mund`), faro pulsante superior (`.jg-mm-aviso`) indicando cuántos versos faltan para asegurar el premio y botón dorado directo **«Participar leyendo ahora ›»** hacia el ámbito de la misión.
   - En **Hoy**, aparece un aviso compacto (`.jg-mm-hoy`, usando la respuesta cacheada de `/vivo`) únicamente mientras la misión esté activa y el lector aún no alcance el mínimo de aporte; desaparece solo en cuanto participa.

5. **Notificación de fragmentos de papiro (`premioPop` en `juego.js`):**
   - Ampliada en **`+550 ms`** (`3,85 s` visibles, respaldo sin animaciones `3,75 s` con `opacity: 1`).
   - **Bug oculto corregido:** antes `contarRapido(el.firstChild, n, 900, "+")` apuntaba al `<span class="jg-premio-fig">` (ícono) en lugar del nodo `<b>+0</b>`. Ahora anima el elemento `<b>` real con precisión.

6. **Vibración configurable en 3 modos (`Normal` · `Suave` · `Desactivada`):**
   - Selector sincronizado (`biex:vib`) tanto en **Lectura y apariencia (`Aa`)** como en **Escudriña › Cuenta › Preferencias**.
   - `vibrar()` mantiene activa la vibración en recompensas incluso con *Modo tranquilo* activado, con nota transparente sobre la limitación de seguridad de «No molestar» a nivel de Android/iOS (y el paso en Android para permitir el navegador en excepciones de *No molestar*).

7. **Marcas de lectura horológicas (versos, repasos, perícopas y capítulos) en `app.css` y `juego.js`:**
   - Versos leídos en oro cepillado con filamento vertical luminoso (`.vn.jg-leido::after`, sin invadir el color del marcador del lector); repasos con doble marca oro + zafiro y barra bipartita; botón de perícopa refinado; placa centrada **«✓ CAPÍTULO LEÍDO»** en bisel obsidiana-oro (`centeredDiff: 0 px`, `0 % CPU`).

8. **Lector, Análisis, Marcadores y Fuente Q (`app.css`, `app.js`, `busqueda.js`):**
   - **Palabras casi exóticas en azul profundo también en tarjetas (`--rara`):** sustituido el verde residual por `#3568d4` (oscuro) y `#14316b` (claro).
   - **4 colores de marcador de libre elección (12 en total):** `Personal 1..4` con selector nativo circular `<input type="color">` y nombre editable en *Colores y temas*, persistidos e incluidos en exportar/importar.
   - **Marcador rápido flotante encima de Compartir (`.sr-mk` + `.sr-mk-pan`):** desactivada la pulsación prolongada sobre los versos en móvil para no chocar con la selección nativa; botón circular sobre *Compartir* con cajón acoplado de 12 colores, paso `< >`, Copiar y Nota, posicionado a `bottom: 78px` para despejar completamente el escudo de nivel (`clearsShield: true`).
   - **Selector rápido de capítulo y verso en cabecera de *Análisis de verso* y *Análisis de palabra* (`selectorCapVerso`):** con filtro **«Sin leer»** (también en el menú del capítulo) y **«Siguiente con nota ›»** en *Tu estudio*.
   - **Cero sobresalto al tocar una palabra + `Nota de estudio` visible sobre el teclado:** `DATOS_MEM` + `versoTokensSync()` con precarga en reposo, centrado único en `fn.alMostrar` y `irANotaEnModal()` + `syncVV` al abrirse el teclado móvil.
   - **Fuente Q — curvas azules interactivas a 60 fps (`mapaOrden`):** eliminados los `<linearGradient>` y las >200 transiciones SVG que desplomaban los FPS tras interactuar; ahora las **133 curvas azules** de *Lo que sigue a Μᾶrκος* se seleccionan al toque y paso a paso (`1 / 133`) con capítulos y enlaces directos a Mattáy y Lουκᾶς.
   - **Buscador semántico (`busqueda.js`):** ampliación de palabras vacías conversacionales, `+65` grupos de sinónimos del español actual en palabras completas (para que `BQ.raizEsN` empate exacto con las raíces del índice) y respaldo por prefijo (`prefijoEs`).
   - **Pie de página actualizado (`23 de noviembre de 2026`)** con lectura automática de la fecha de `datos/archivos.json`, y lista ampliada de navegadores compatibles en `#/app` (Chrome, Firefox, Vivaldi, Edge, Brave, Samsung Internet, Opera y Safari).
   - **Propuesta de Ajedrez Bíblico (`propuesta_ajedrez_biblico.md` v2):** ampliada a **12 figuras bíblicas** (6 mujeres y 6 hombres con ortografía oficial de BiEx), **siluetas etéreas translúcidas sin rostro ni tonos de piel** y **aparición aleatoria dentro de las 2–5 misiones diarias** (incluso al cambiar una misión).

### 2. Capturas verificadas a 3× de densidad (Entrada #6)

*(Capturas 3× HD verificadas y archivadas en la bitácora local de sesión.)*

### 3. Aprendizajes clave (para BiEx y Opus)
1. **Raíces dobles en `busqueda.js`:** las entradas de `SINONIMOS` deben escribirse como palabras españolas completas (`"descanso"`, `"preocupar"`), nunca raíces recortadas (`"descans"`), porque `BQ.raizEsN()` vuelve a recortarlas y rompería el empate con `indice.json`.
2. **Inspección visual 3× obligatoria:** la comprobación automatizada detectó `.jg-dos` sin `gap` bajo `720 px`, pero fue la revisión directa de las capturas 3× la que reveló el roce de `"puntos por repartir"` contra `PODER` en `360 px` y el solape del borde inferior izquierdo de `.sr-mk-pan` con el escudo de nivel —ambos corregidos antes de proponer PR #4.
3. **SVG interactivo de >100 trazos en móvil:** quitar `<linearGradient>` compartidos y transiciones CSS sobre cientos de `<path>` + añadir `contain: layout paint style` y seguimiento O(1) del trazo activo elimina por completo los desplomes de FPS al interactuar con gráficos complejos.

### 4. Comprobaciones pasadas (Entrada #6)
- `python3 wix/sellar.py && git diff --exit-code --stat`: **al día** (`38be4437974d`).
- `node --check` en todos los `.js` y validación JSON de todos los `.json` / `.webmanifest`: **correcto**.
- Auditoría léxica y de pureza iconográfica en todo el diff y en `propuesta_ajedrez_biblico.md` v2: **0 palabras de interfaz prohibidas, 0 glifos prohibidos**.
- Prueba completa Playwright `3× HD` (`280 px`, `360 px` y `1280 px`): **0 errores de consola, 0 px de desplazamiento lateral, `touching: []` en las 6 pestañas de Escudriña (móvil y escritorio), `clearsShield: true`, `centeredDiff: 0`**.

---

## Entrada #7 — 23 de noviembre de 2026 (Fusión de PR #6, Consciencia de Poder, Salas Abiertas, Flotantes GPU en Hallazgos/Liga/Papiro, Tu Avance completo, Fuente Q simétrica, Botón Adelante y Entrega Detallada para Opus)

**PR #6 fusionada a `main`:** con autorización expresa de BiEx, PR #6 (de Argon) quedó fusionada en `main` (`f535e33` → `https://bibliaexacta.pages.dev/`).
**Nueva rama:** `neon/pulido-salas-poder-flotantes-q-avance` (desde `origin/main` en `f535e33`)
**Propuesta:** [PR #7 · Consciencia de poder, salvaguarda de salas y presencia, flotantes GPU en Hallazgos/Liga/Papiro, Tu avance completo, Q simétrica y Adelante](https://github.com/cristianteologo/biex-lector/pull/7)
**Archivos modificados:** `app.css`, `app.js`, `juego.js`, `BITACORA_NEON.md` (+ sellos automáticos vía `python3 wix/sellar.py` en `index.html`, `datos/archivos.json`).

### 1. Cambios aplicados en el cliente (PR #7)

1. **Consciencia de progresión de Poder (`registrarPoder`, `chipPoder`, `abrirVentanaPoder` en `juego.js`):**
   - **Historial local de puntajes (`jg:poderHist`):** guarda hasta 36 hitos de `{ t, p, nv }` vinculados a `yo.inv` con 0 peticiones extra al servidor.
   - **Indicador de subida en el medallón (`chipPoder` › `.ap-pd-delta`):** compara el poder actual frente a la última visita a la Ventana del poder (`jg:poderVis`) y resalta `+Δ` hasta abrir el detalle.
   - **Bloque «Evolución y próximo salto» (`.ap-vp-evo` dentro de `abrirVentanaPoder`):**
     - **Comparativa a 3 tiempos (*Previo → Hoy → Al nivel N+1*):** muestra el puntaje previo con el aumento ganado, el poder actual con nivel y etapa, y la proyección exacta al siguiente nivel (`+15` directo + `+30` al repartir los 3 puntos libres = `+45`, con XP y versos aproximados faltantes).
     - **Historial de puntajes previos (`.ap-vp-hchip`):** chips cronológicos con nivel, poder y fecha.
     - **«Tu próximo salto más cercano» (`.ap-vp-rutas`):** ordena por cercanía real las vías con costo exacto y ganancia en poder: repartir puntos libres (`+10` c/u, sin costo), forjar la pieza de armadura más cercana (`+20`), subir de nivel (`+45`), completar el rollo de papiro (`+25`) y comprar 1 punto de atributo (`+10`).
     - **Anticipo visual de la siguiente etapa (`.ap-vp-etprox`):** muestra cuántos puntos faltan para la próxima etapa (`250`, `600`, `1.200`, `2.400`) y qué distintivo visual desbloquea.

2. **Salvaguarda de visibilidad total de Salas Abiertas y mejora de Presencia en vivo (`juego.js`):**
   - **`tarjetaSalasAbiertas` y `syncSalasTrasEvento`:** muestra **todas** las salas abiertas sin importar cuántas existan ni si el usuario ya está activo en una (botones «Abrir» para la propia y «Cambiarme» / «Entrar» para las demás). Añade recarga inmediata + reintento a `1,8 s` con salto de caché (`?_=<ts>`) al crear, abrir o cambiar visibilidad de una sala, respaldo optimista local de la sala propia abierta (usando el formato `embDe` sin separador, p. ej. `"Λ0"`), aviso honesto si falla la red y botón manual **«Actualizar»**.
   - **`tarjetaSala`:** estando ya dentro de una sala activa, deja accesible el desplegable **«Crear otra sala o entrar por código»** y aclara que el bono del `+25 %` suma únicamente por la sala activa.
   - **Presencia más rápida al empezar a leer (`acreditar`, `capitulo`, `salir`):** antes, la primera tanda esperaba `CADA = 5 min` si no se disparaba un suceso, dejando `/presentes`, `/vivo` y `/arbol/vivo` vacíos durante minutos. Ahora programa un envío liviano temprano (`R.tPres` a los `25 s` al iniciar o retomar lectura tras >2 min), manteniendo el intervalo de `5 min` en lectura continua. Además, `SL.lcAct` reporta a la sala el capítulo abierto también en modo **Análisis** (no solo Lectura).

3. **Bloques flotantes en Hallazgos, Cantos en Liga y Papiro épico (`juego.js`, 100 % compositor GPU):**
   - **Hallazgos (`tarjetaHallazgos` y `verPiedra`):** cada una de las 12 piedras descubiertas flota sobre un pedestal mineral translúcido con halo de su color, sombra en contrafase y períodos coprimos (`4,3 s` a `6,5 s`); la ventana modal también exhibe la piedra flotando sobre su pedestal. Ajuste tipográfico responsivo + 3 columnas bajo `330 px` para que ningún nombre griego (como `Xrusόprαsος` o `Ἀmέdsusτος`) parta su letra final `ς` en `360 px` ni desborde en `280 px`.
   - **Liga de la semana (`resumenLiga` y `escaleraPiedras`):** la piedra protagonista flota con halo respirante y sombra suave; los 12 peldaños de la escalera de fundamentos incorporan levitación sutil con profundidad y sombra.
   - **Papiro y fragmentos (`papiroSVG` y `tarjetaPapiros`):** caché `CACHE_PAPIRO` para el SVG estático, líneas sutiles de manuscrito, doble tono de papiro en los fragmentos reunidos, borde dorado fino en el fragmento más reciente, escenario relicario flotante (`.jg-pp-escena`) con halo cálido, barrido diagonal de luz por compositor (`transform`) y sombra en contrafase, más tarjeta de anticipo del próximo accesorio raro (`.jg-pp-prox`, `+25 poder`) con su ícono vectorial y nombre completo sin recortes.
   - **Consumo mínimo garantizado:** 0 animaciones dentro de SVG (`<g>`/`<path>` quietos), solo `transform: translate3d` + `opacity` en envoltorios HTML, pausa automática fuera de pantalla mediante `IntersectionObserver` compartido (`observarFlotantes` › `.jg-pausa-vis`), pausa con modal abierta (`html.con-modal`), pestaña oculta (`html.tab-oculta`), `prefers-reduced-motion` y «Sin animaciones» (`html[data-mov="no"]`).

4. **Estadísticas públicas de jugadores preparadas en cliente (`resumenStatsPub` en `juego.js`):**
   - `tarjetaClasificacion`, `pintarClasificacion`, `filaLiga`, `pintarCompania`, `abrirSala`, `tarjetaSalasAbiertas` y `tarjetaQuienLee` ahora renderizan automáticamente `poder`, `pers` (días de perseverancia), `vc` (versos leídos) y `act` (actividad en curso) en cuanto Opus los incluya en las respuestas públicas del servidor.

5. **Pulidos de interfaz y blindaje defensivo (`app.css`, `app.js`, `juego.js`):**
   - **Hoy (`tarjetaPerfil`):** eliminada la cifra redundante `«X en total»` debajo de la barra de nivel.
   - **Árbol (`arbolPoder` y `pintarPoder`):** sustituida la píldora central `NIVEL X` por **`PODER {n}`** con ancho dinámico y firma `av.poder` incluida en `CACHE_ARBOL`.
   - **Tu avance (`bloqueAvance`):** tocar o señalar cualquier barra actualiza directamente las **5 tarjetas** (*Experiencia, Versos, Minutos, Aciertos, Capítulos*), sus variaciones frente al período previo y la insignia de cabecera, conservando la fecha elegida al cambiar de magnitud.
   - **Botón «Adelante» (`.adelante` en `app.css`):** reducido un **20 %** (`min-height: 32px`, `font-size: .68rem`, flecha `13px`) y con **5 % de transparencia** (`opacity: .95` en reposo, `1` al pasar el puntero o enfocar).
   - **Fuente Q › «Cinco maneras de explicar los mismos datos» (`#q-hip > .q-chips` en `app.css` y `app.js`):** distribución simétrica en rejilla centrada de botones de igual ancho (`3 + 2` en escritorio/tableta y `2 + 2 + 1` en móvil `≤ 520 px`) con numeración romana `I–V` de alto contraste.
   - **Blindaje defensivo del gesto Atrás (`app.js`):** refuerzo en `modal.close` (`M.sinRuta`), `vistaLibro` (`velar(false)` garantizado cuando `v == null` y en errores) y `enrutar` para impedir que cualquier `hashchange` residual vele la vista al regresar desde el Análisis de una palabra.

---

### 2. Instrucciones detalladas para Opus (Servidor `biex-juego` en Cloudflare y Prompts A/B)

> **Para Opus:** Neon no tiene acceso al Worker `biex-juego`, a Cloudflare KV/D1/Durable Objects ni a los Prompts A y B. A continuación queda especificado todo lo que requiere intervención en servidor o traducción, con contratos exactos para que el frontend de PR #7 lo encienda al instante sin otra ronda de cambios de cliente.

#### A. Salas abiertas (`GET /api/juego/salas`, `POST /api/juego/sala/crear`, Durable Object de Sala) — **PRIORIDAD ALTA**
1. **Problema observado en producción:** `GET /api/juego/salas` devolvió `{"salas":[]}` incluso tras abrir salas públicas, con `cache-control: public, max-age=20`.
2. **Garantía / salvaguarda solicitada por BiEx:** *siempre* debe mostrarse **cada sala abierta creada**, sin importar cuántas salas existan ni si quien consulta ya está en una sala (para que pueda verlas todas y cambiarse si desea).
3. **Causas a auditar y corregir en el Worker:**
   - **Registro inmediato al crear:** en `POST /api/juego/sala/crear`, cuando `abierta !== false`, inscribir la sala en el índice global de salas abiertas **síncronamente dentro de la propia respuesta HTTP de creación**, sin esperar a que el WebSocket del anfitrión complete la primera conexión ni a que `n >= 1`.
   - **No filtrar salas recién abiertas o con `n === 0` temporal:** durante una ventana de gracia (p. ej., 10–15 min tras creación o mientras el anfitrión esté activo/reciente) y mientras siga abierta y no vencida, **nunca** ocultar una sala abierta por recuento momentáneo `0` ni por pertenecer al mismo usuario que consulta.
   - **Límite y equilibrio de hasta 2 salas simultáneas por cuenta:** BiEx definió que un jugador puede tener **hasta 2 salas creadas a la vez**, pero **solo suma el bono del `+25 %` por la sala en la que esté activo actualmente** (conectado/enviando `pos` en esa sala; al cambiar a otra sala o desconectarse de la primera, la otra sala deja de bonificar al creador hasta volver a ella). Si intenta crear una 3.ª sala activa, devolver error claro (p. ej. `error: "max_salas"`, con mensaje amable indicando cerrar una antes).
   - **Caché de borde en `/salas`:** respetar el parámetro `?_=` sin caché (o cambiar `Cache-Control` a `no-store` / `max-age=3`) para que tras crear, cerrar o cambiar visibilidad (`t: "abierta"`) la lista refleje el cambio en `< 1 s`.
   - **Campos recomendados por sala en `/salas`:** `{ c, lc, anf, emb, marco, foto, poder, n, t }`. El cliente ya consume todos estos campos (incluyendo `poder`, `marco` y `foto`).

#### B. Presencia en vivo («qué está leyendo o haciendo cada jugador») (`POST /api/juego/presencia`, `GET /api/juego/presentes`, `GET /api/juego/vivo`) — **PRIORIDAD ALTA**
1. **Problema observado:** hoy `/presentes` y `/vivo` solo registran actividad cuando llega un `POST /lectura/tanda`. Por ello: (a) quien lee en modo **Análisis**, consulta **Fuente Q**, explora el **Léxico** o navega en **Escudriña** aparece invisible; (b) si el TTL de presencia en el servidor es corto (p. ej. 2–5 min) frente a la cadencia de `CADA = 5 min` de `/tanda`, el jugador desaparece entre tandas aun leyendo sin pausa.
2. **Solución recomendada en servidor:**
   - **Alinear TTL de presencia** en `/presentes` y `/vivo` a **≥ 7 min** (mayor que `CADA = 5 min`) para que un lector constante nunca parpadee ni desaparezca entre envíos.
   - **Endpoint liviano de latido de actividad (opcional, recomendado):** `POST /api/juego/presencia` (rate-limited a 1 petición cada 60–90 s por cuenta, en memoria/DO sin escribir en D1 en cada latido) recibiendo `{ act, lc }` donde `act` ∈ `"Leyendo" | "Analizando" | "En Fuente Q" | "En Escudriña" | "En sala"` y `lc` opcional (`"MAT.5"`).
   - **Exponer `act` y `poder` en `GET /api/juego/presentes`:** cada lector en `lectores[]` devuelve `{ a, nv, poder, act, l, e, m, f }`. **PR #7 ya muestra `act` y `poder` automáticamente en `tarjetaQuienLee` en cuanto el servidor los envíe.**

#### C. Reasignación gratuita escalonada de Atributos (`POST /api/juego/poder/reasignar` y `GET /api/juego/poder`) — **PRIORIDAD MEDIA-ALTA**
- **Regla nueva fijada por BiEx:** el restablecimiento gratuito de atributos ya no debe ser libre cada semana; debe escalar según uso:
  - 1.er uso gratis → siguiente gratis disponible tras **1 semana (7 días)**.
  - 2.º uso gratis → siguiente gratis disponible tras **2 semanas (14 días)**.
  - 3.er uso gratis y todos los siguientes → siguiente gratis disponible siempre tras **3 semanas (21 días)**.
- **Contrato para el cliente (`GET /api/juego/poder`):** conservar `av.reasigGratis` (boolean) y añadir opcionalmente `av.reasigProx` (timestamp ms en que vuelve el próximo restablecimiento gratis) y `av.reasigSem` (`1 | 2 | 3`, semanas del tramo actual) para que Neon pueda mostrar la fecha exacta y la regla en la tarjeta de Atributos sin contradecir al servidor.

#### D. Más estadísticas públicas de los jugadores (`GET /clasificacion`, `GET /liga`, `GET /liga/ver`, `GET /compania`, `GET /salas`, `GET /presentes`, WS sala y futuro `GET /jugador`) — **PRIORIDAD MEDIA-ALTA**
- **Pedido de BiEx:** mostrar públicamente el **Poder** y otros detalles relevantes (perseverancia, versos leídos, etapa) en las vistas sociales para fomentar la interacción y la autosuperación.
- **Campos exactos ya soportados en PR #7 (`resumenStatsPub`):**
  - `poder` (entero, poder actual del jugador)
  - `pers` (entero, días de perseverancia activa)
  - `vc` (entero, versos confirmados leídos)
  - `etapa` (opcional, `1..5`)
- **Paso adicional sugerido:** añadir un endpoint de ficha pública de solo lectura `GET /api/juego/jugador?c=<inv>` (o por `id` público opaco) devolviendo `{ apodo, nivel, rangoNombre, poder, etapa, pers, persMejor, vc, lk, piedrasN, lauros, marco, emb, foto, ciudad, pais, fundador, n }` para que al tocar cualquier jugador en Clasificación, Liga, Compañía o Sala se abra su tarjeta pública interactiva.

#### E. Transliteración de meses del calendario hebreo (`MESES_HEB` en `app.js`) — **DELEGADO A OPUS**
- BiEx delegó explícitamente a **Opus** la revisión y transliteración exacta de los 13 nombres de mes del calendario hebreo según los **Prompts A y B** (actualmente `MESES_HEB` en `app.js` usa formas provisionales como `"Nisán"`, `"Iyár"`, `"Tishréi"`, etc.). Neon no tocó esos nombres para evitar inventar transliteraciones fuera de norma.

#### F. Otros pendientes de servidor identificados al auditar `peticiones-pagina-web-biex.md` y bitácoras previas
1. **Rollos de colección PDF + Designación (`B8` / `AF19`):** confirmar regla de lector constante (`14 días` de lectura dentro de 60 días seguidos, primera Designación al llegar a `120` constantes y mínimo `60 días` entre Designaciones) + generación server-side del PDF de colección con firma criptográfica.
2. **Dificultad escalada de pruebas de capítulo según nivel (`B7`):** escalar complejidad de preguntas en `POST /prueba/pedir` conforme sube el nivel de la cuenta.
3. **Incursiones cooperativas contra «El Coloso de la Tradición» (`B4`):** backend de eventos aleatorios con preaviso, habilidades manuales/estratégicas y mensaje de enseñanza en cada jefe (`B5`).
4. **Retirar OAuth de Facebook del servidor (`B1`):** `GET /salud` aún reporta `facebookSecreto: "falta"`; confirmar retiro definitivo del proveedor Facebook (BiEx descartó inicio con Facebook; solo queda Google, llaves WebAuthn y código único).
5. **Sincronización en la nube de Planes de lectura (`A4`) y Marcadores/Notas (`GET/POST /api/juego/marcas`):** para que los planes, marcadores de 12 colores y notas viajen entre dispositivos del usuario.
6. **Optimización Cloudflare Worker + `/api/juego/error`:** recordatorio de Entrada #5 (evitar `PUT` redundantes en `/tanda`, consolidar `Promise.all` en `/yo` y telemetría liviana de errores JS).

---

### 3. Auditoría completa de `peticiones-pagina-web-biex.md` (20 puntos contrastados contra el código real)

| Clave | Petición | Estado real verificado | Responsable sugerido |
| :--- | :--- | :--- | :--- |
| **A1** | Strong en español propio de BiEx | **PENDIENTE** (editorial / `datos/lexico.json`) | BiEx + Opus |
| **A2** | Citas de la Antigua Voluntad dentro del sitio | **PARCIAL / EN ESPERA** (activo con Jünemann `datos/av/jnm/`; espera permisos de otras traducciones) | BiEx (permisos) |
| **A3** | Sección de donaciones al pie (1 Co 16:1-2) | **PENDIENTE** (0 menciones en código) | Neon (UI) cuando BiEx defina canales y texto |
| **A4** | Planes de lectura (confirmación, gráficos, hitos/aprendizajes, Habitica neurodivergente, nube, ranking) | **PARCIAL** — Hechos: 6 planes, confirmación al desactivar, anillo y gráfico 30 d, marcado automático. Faltan: **hitos/aprendizajes/datos clave + modo neurodivergente tipo Habitica** (cliente) y **nube + ranking** (servidor) | Neon (cliente) + Opus (nube/ranking) |
| **A5** | Centro completo de herramientas eruditas en español | **EN CURSO** — Sólida base actual; siguientes hitos aprobados en Sección D (Grafo estilo Obsidian, Mesa sinóptica, Pulso exegético, Tarjetas HD 3×, Diario) | Neon |
| **A6** | Lectura por defecto + Textual en orden del griego | **HECHO** (`prefs.lorg: true` por defecto) | — |
| **A7** | Nombre tradicional entre comillas bajo transliteración | **HECHO** (`tradQ` en `app.js`) | — |
| **A8** | «Cronológico» → `χrοnοlόgικο` / `χrοnοlοgικός` / «Orden en el tiempo» | **HECHO** (`app.js`, planes) | — |
| **A9** | Modo «Contemplar» (antes sanctuary/zen) | **PENDIENTE** (solo existe auto-ocultado `inmersivo`; falta el modo dedicado «Contemplar») | Neon (100 % cliente) |
| **A10** | Créditos de fuentes discretos y pequeños | **HECHO** (`creditosPie` plegado en vistas interiores) | — |
| **A11** | Sección «info» en Wix | **FUERA DEL REPO** (Wix) | BiEx |
| **B1** | Cuentas Google / llaves / invitado con código único; sin Facebook | **PARCIAL** — Google, llaves y código único hechos; faltan limpiar 3 restos de botón/texto Facebook en `juego.js` (`L2369`, `L5540`, `L5599`) y retirar OAuth en Worker | Neon (UI) + Opus (Worker) |
| **B2** | Puntos por invitar y viralidad orgánica | **HECHO** (Escalera del Sembrador, árbol multigeneración, +3 h doble, semilla anónima) | — |
| **B3** | Ser interior (sin sexo, sin caja, fruto 9 cámaras, dracmas) | **HECHO** | — |
| **B4** | Incursiones manuales/estratégicas contra El Coloso de la Tradición | **PENDIENTE** (solo cuenta atrás al 28-nov-2026) | Opus (backend) + Neon (UI táctica) |
| **B5** | Enseñanza en cada jefe y micro-enseñanzas bíblicas | **PARCIAL** (hay citas en tienda/cosecha/reparto/poder; faltan jefes/Coloso y ampliar micro-enseñanzas) | Neon + Opus |
| **B6** | Variabilidad sin sensación de pérdida | **EN CURSO** (se amplía con Ajedrez Bíblico, Coloso y Geografía bíblica) | Neon + Opus |
| **B7** | Dificultad de preguntas escalada por nivel | **PENDIENTE EN SERVIDOR** | Opus |
| **B8** | Rollos PDF con firma criptográfica + Designación 120 / 60 d | **PARCIAL** (tarjeta y barra `/designacion` en UI; faltan ajuste `AF19` y PDF firmado) | Opus |
| **B9** | Lanzamiento 15-nov-2026 multi-ciudad | **HECHO** (`cuentaAtras` + `CIUDADES`) | — |

---

### 4. Capturas verificadas a 3× de densidad (Entrada #7)

*(Capturas 3× HD verificadas y archivadas en la bitácora local de sesión.)*

### 5. Aprendizajes clave (Entrada #7)
1. **Formato exacto de `embDe(s)` en `juego.js`:** `embDe` analiza `^(.+?)(\d)$` (sin separador `|`, p. ej. `"Λ0"`). La inspección de la captura 3× de *Salas abiertas* detectó de inmediato un `|` visible junto a la letra en el respaldo optimista local, corregido antes de abrir PR #7.
2. **Contraste de numerales romanos sobre botones activos en oro:** en `#q-hip .q-chip[aria-pressed="true"]`, usar `color: inherit` en `.q-hip-n` en vez de `var(--oro-vivo)` garantiza legibilidad nítida (obsidiana sobre oro) tanto en tema oscuro como en claro.
3. **Nombres griegos largos en rejillas de 4 columnas a `360 px`:** al añadir borde y relleno a los bloques de *Hallazgos*, 3 nombres (`Xrusόprαsος`, `῾Ηuάκινdsος`, `Ἀmέdsusτος`) partían su `ς` final. Ajustar `clamp(.62rem, 2.6vw, .73rem)` + `white-space: nowrap` y pasar a 3 columnas bajo `330 px` dejó las 12 piedras en una sola línea en `360 px` y `0 px` de desborde en `280 px`.

### 6. Hoja de ruta aprobada para PR #8+ (siguiente fase)
- **PR #8 · Sección D (aprobada):**
  1. **Constelación del Léxico y Notas (Grafo estilo Obsidian PC en `<canvas>` 2D DPR):** motor de fuerzas amortiguado que **se congela a 0 % CPU en reposo** y solo redibuja al arrastrar/hacer zoom/filtrar; 3 capas conmutables 100 % con datos existentes (raíces griegas → lemas → libros; referencias cruzadas; marcadores y notas del usuario en sus 12 colores) + minigrafo local en `#/raiz/:id`, `#/lema/:id` y `#/marcadores`.
  2. **Mesa sinóptica libre** (comparar 2 versos lado a lado con paralelos léxicos resaltados).
  3. **Pulso del texto al cerrar capítulo** (micro-síntesis léxica del capítulo recién leído).
  4. **Tarjetas compartibles vectoriales HD 3×** (estilo códice BiEx).
  5. **Diario de estudio en `#/marcadores`** (línea de tiempo filtrable y exportable).
- **PR #9 · Ajedrez Bíblico (Fase 1):** motor FIDE 100 % en cliente + piezas SVG bíblicas/Staunton sin cruces + campaña «Sendas de los Antiguos» (13 figuras con `Sτέfαnος [Esteban]` #12 y `Pαῦlος [Pablo]` #13).
- **PR #10 · Pendientes adelantables de `peticiones-pagina-web-biex.md`:** Modo «Contemplar» (`A9`), hitos/aprendizajes y motivación neurodivergente en Planes (`A4`), y retiro de los 3 restos visuales de login Facebook (`B1`).

### 7. Comprobaciones pasadas (Entrada #7)
- `node --check` en todos los scripts (`app.js`, `juego.js`, `busqueda.js`, `intro.js`, `intro-cargador.js`, `sw.js`, `functions/api/juego/[[ruta]].js`): **correcto**.
- Validación JSON de todos los `.json` y `.webmanifest`: **correcto**.
- Auditoría léxica, iconográfica y de colisiones CSS en todo el diff: **0 palabras prohibidas, 0 glifos prohibidos, 0 choques de clases**.
- Suite Playwright 3× HD (`280 px`, `360 px`, `412 px`, `1280 px`, temas oscuro y claro, `--k = 1.42`, `data-mov="no"`): **0 errores de consola, 0 px de desplazamiento lateral, todas las aserciones de PR #7 en verde (`ALL_PR7_VERIFICATIONS_PASSED`)**.
- `python3 wix/sellar.py && git diff --exit-code --stat`: **al día** (`45dc6c09b41c`).

---

## Entrada #8 — 23 de noviembre de 2026 (Presencia en vivo, Ficha pública de jugador, Escalera de reasignación, `B7`, `rango=todos`, `B1` sin Facebook y `A9` Modo «Contemplar»)

**Rama:** `neon/pr8-presencia-jugador-b1-contemplar` (desde `origin/main` en `d4b3758`, que ya incluye los meses hebreos `MESES_HEB` actualizados)
**Servidor verificado en producción (`biex-juego`, commit `5084523`):** `/salud` (`google: "bien"`, `buzon: "bien"`, sin Facebook), `/config` (`facebook: false`), `/clasificacion?rango=todos`, `/jugador?a=`, `/planes/ranking`, `/coloso` (401 autenticado) y `/rollo/clave` (JWK ES256).
**Archivos modificados:** `app.css`, `app.js`, `juego.js`, `BITACORA_NEON.md` (+ sellos automáticos vía `python3 wix/sellar.py` en `index.html`, `datos/archivos.json`).

### 1. Cambios implementados y verificados

1. **Presencia en vivo (`POST /presencia`, `juego.js` + `app.js`):**
   - Nuevo latido ligero `PRES` (`latirPresencia`) que informa la actividad exacta del lector con deduplicación (intervalo de 90 s, pausa con pestaña oculta y disparo inmediato al cambiar de ruta o entrar/salir de una sala): **`Leyendo`**, **`Analizando`**, **`En Fuente Q`**, **`En Escudriña`** y **`En sala`** (con `lc` del capítulo cuando aplica).
   - También carga el módulo en segundo plano cuando una cuenta iniciada entra directamente en frío a `#/fuente-q`.
2. **Ficha pública interactiva de jugador (`GET /jugador?a=<apodo>`, `juego.js`):**
   - `nombreClicable(apodo)` + `abrirJugadorPublico(apodo)` con caché corta de 20 s: al tocar cualquier apodo público en **Clasificación**, **Liga**, **Compañía**, **Salas abiertas**, **Sala en vivo** o **Quién está leyendo**, se abre una ventana limpia con emblema/marco/foto, insignia de **Etapa I–V** con alto contraste en tema oscuro y Pergamino, insignia de **Primicia**, banda verde de actividad en vivo con enlace directo **«Ir»** al capítulo y rejilla simétrica de **6 métricas** (*Poder*, *Nivel*, *Perseverancia*, *Versos leídos*, *Piedras*, *Lauros*).
   - Si el perfil está reservado (`404`), muestra un aviso respetuoso sin romper la vista.
3. **Escalera de reasignación gratuita de atributos (`av.reasigGratis`, `av.reasigProx`, `av.reasigSem`, `juego.js`):**
   - `tarjetaAtributos` muestra si el restablecimiento gratis está disponible o, tras usarlo, la **fecha exacta** del próximo restablecimiento gratis y el tramo vigente de la escalera (**1 → 2 → 3 → 3 semanas**), junto al botón `Reasignar · 60 dr.`.
4. **Límite claro de 2 salas simultáneas (`max_salas`, `juego.js`):**
   - Añadido `MENSAJES.max_salas` en español claro y retirado `sin_facebook`.
5. **`B7` · Insignia de dificultad en la prueba de capítulo (`dificultad: 1|2|3`, `juego.js`):**
   - `abrirPrueba` muestra el nivel de dificultad asignado por el servidor en el subtítulo (`Dificultad I / II / III`) y en una insignia temática adaptada a tema oscuro y Pergamino (`Dificultad I · Nivel inicial`, `Dificultad II · Nivel intermedio`, `Dificultad III · Nivel profundo`).
6. **Clasificación «Todos los rangos» en una sola petición (`rango=todos`, `juego.js`):**
   - `cargarTodos()` consulta primero `GET /clasificacion?...&rango=todos` (1 sola llamada cacheada en borde en lugar de N peticiones paralelas por rango), conservando el respaldo automático si alguna respuesta no trae `lista`.
7. **`B1` · Retiro completo de botones de entrada/vínculo con Facebook (`juego.js`):**
   - Eliminados los botones de inicio, registro y vinculación con Facebook en `pintarInicio` y `tarjetaAsegurar` (se mantiene intacto el botón de compartir en Facebook y el aviso honesto «vínculo anterior conservado» en *Cuenta* para perfiles antiguos).
8. **`A9` · Modo «Contemplar» (`app.js` + `app.css`):**
   - Modo de lectura serena centrado exclusivamente en el texto sagrado: accesible desde el botón de ojo en la barra del capítulo (`.btn-cont`), desde **Lectura y apariencia (`Aa`) → Enfoque: Contemplar**, y con **`Mayús+C`**.
   - Oculta la barra superior (`transform` + `opacity: 0` por compositor), la barra de capítulo, la cabecera estadística del libro (`.banda`), el riel lateral (`.riel`), las barras de revisión/reordenamiento (`.encab-cifras`), la nota semanal (`.nota-obra`) y los elementos flotantes del juego; colapsa `.libro-grid` a columna única centrada con interlineado holgado (`1.92`) y ofrece la píldora discreta **«Salir de Contemplar»** abajo a la derecha (o tecla **`Esc`**), saliendo automáticamente al cambiar a *Análisis* o fuera del texto bíblico.

### 2. Capturas verificadas a 3× de densidad (Entrada #8)

*(Capturas 3× HD verificadas y archivadas en la bitácora local de sesión.)*

### 3. Aprendizajes clave (Entrada #8)
1. **Ocultamiento integral de Modo Contemplar (`app.css`):** ocultar solo `.barra` y `.barra-hoja` dejaba visibles `.banda`, `.riel`, `.nota-obra` y `.encab-cifras`; la inspección 3× HD permitió ocultarlos todos y colapsar `.libro-grid` a columna única centrada, elevando `.aviso-flot` para evitar cruce con `.btn-cont-salir`.
2. **Orden flex en escritorio (`min-width: 1024px`):** al añadir `.btn-cont` a `.barra-hoja`, fue imprescindible darle `order: 3` (y `.btn-opc` `order: 4`) en la media query de escritorio para que no saltara al inicio junto a `.seg-modo`.
3. **Contraste de fichas de Etapa en tema Pergamino:** los colores claros pensados para fondo oscuro (`#ffe39a` en Etapa IV) perdían legibilidad sobre crema claro; definir pares `--et` / `--et-l` en CSS garantizó contraste AAA en ambos temas.

### 4. Comprobaciones pasadas (Entrada #8)
- `node --check` en `app.js`, `juego.js`, `busqueda.js`, `intro.js`, `intro-cargador.js`, `sw.js`, `functions/api/juego/[[ruta]].js`: **correcto**.
- Validación JSON y balanceo de llaves CSS (`app.css`): **correcto (diff 0)**.
- Auditoría léxica y de glifos en el diff completo: **CLEAN (0 palabras o elementos prohibidos)**.
- Suite Playwright 3× HD (`280 / 360 / 412 / 1280 px`, temas oscuro y claro, `--k = 1.42`): **0 errores de consola/página, 0 px de desborde, todas las pruebas funcionales en verde**.
- `python3 wix/sellar.py`: **al día** (`84e2be51016c`).

---

## Entrada #9 — 23 de noviembre de 2026 (Contraste global +5 %, Modo Contemplar simétrico, Ficha de jugador Relicario Astral, Nombres de sala 1/día, Nube `/nube`, Planes `A4` y Batalla contra *El Coloso* `B4`/`B5`)

**Rama:** `neon/pr9-pulido-nube-planes-coloso` (desde `main` en `5dce72f`)
**Archivos modificados:** `app.css`, `app.js`, `juego.js`, `BITACORA_NEON.md` (+ sellos automáticos vía `python3 wix/sellar.py` en `index.html`, `datos/archivos.json`).

### 1. Cambios implementados y verificados

1. **Contraste global +5 % en toda la página (`app.css`):**
   - Ajuste directo de variables de color en `:root` (oscuro: `--bg: #040405`, `--tinta: #f8f3e8`, `--tinta-2: #ebe4d6`, `--tenue: #b7afa3`, `--oro: #d5b470`, `--oro-vivo: #f7e2ae`, hoja `86 %`) y `:root[data-theme="light"]` (Pergamino: `--bg: #f6f1e6`, `--tinta: #0d0b08`, `--tinta-2: #221e17`, `--tenue: #51493f`, `--oro: #70531a`, `--oro-vivo: #533c0f`, hoja `92 %`), sin filtros CSS que afecten capas fijas ni coste de CPU.
2. **Modo «Contemplar» (`A9`) con simetría superior/inferior inteligente en cualquier capítulo (`app.css` + `app.js`):**
   - Ocultamiento de `.barra` y `.pie` con `display: none !important`, centrado vertical automático (`min-height: 100dvh; display: grid; align-content: center;`), márgenes exteriores idénticos (`--cont-y: clamp(48px, 6.2dvh, 62px)` → verificado **48 px arriba == 48 px abajo** tanto en capítulos breves como `3 YÔḥānā́n 1` como en largos como `Mattáy 1`), folio enmarcado en móvil y escritorio, cintillo discreto del libro (`.cont-lib`) y píldora compacta `Salir de Contemplar` alojada en el margen inferior.
3. **Ficha pública del jugador renovada a «Relicario Astral» (`abrirJugadorPublico`, `juego.js`):**
   - Cabecera monumental centrada con halo radial según Etapa I–V, doble aro astrolabio contrarrotatorio GPU alrededor del emblema ampliado (`74 px`), barra de progreso de poder hacia la siguiente Etapa con los 5 escalones romanos (`I · II · III · IV · V`), banda verde de actividad en vivo con salto directo «Ir», 6 medallones biselados con íconos vectoriales y mini-rejilla simétrica `6 × 2` de las 12 piedras del fundamento, y pie respetuoso con comparativa amable de poder. Exportado también en `BiExJuego.abrirJugador`.
4. **Nombres personalizados de salas con cambio 1 vez al día (`juego.js`):**
   - Campo opcional de nombre al crear una sala (`POST /sala/crear { abierta, lc, nombre }`) y control de cambio dentro de `abrirSala()` para el anfitrión con bloqueo automático de 24 horas (`puedeRenombrarSala`), envío por WebSocket (`{ t: "nombre", nombre }`) y petición `POST /sala/nombre` (respetando `nombre_espera`), visible en la píldora flotante, la ventana de sala y las tarjetas de *Salas abiertas*.
   - **Nota técnica para el Worker (`biex-juego`):** el cliente ya envía `nombre` en `POST /sala/crear`, soporta `POST /sala/nombre { c, nombre }` (con error `nombre_espera` 1/día) y mensajes WS `{ t: "nombre", nombre }`; en cuanto el Worker guarde y devuelva `nombre` en `/salas` y `/sala/info`, el nombre personalizado se propagará automáticamente a todos los lectores.
5. **Sincronización en la nube (`GET/PUT /nube`, `NUBE_DAT` en `app.js`):**
   - Motor `NUBE_DAT` (`window.BiExNube` + `A.nube`) para `{ planes, estudio, ajedrez, ts }` con tope de seguridad < 122 KB, sincronización al iniciar/retomar pestaña y resolución automática sin pérdida ante `{ conflicto: true }` (unión de días cumplidos y reintento con `forzar: true`). Calcula automáticamente `planes.rk = { planId, pct, dias }`.
6. **`A4` · Planes de lectura mejorados (`app.js` + `app.css`):**
   - **4 hitos de travesía** (`25 %`, `50 %`, `75 %`, `100 %`) con desbloqueo luminoso en cada uno de los 6 planes.
   - **Dato clave y aprendizaje de hoy** generado con fechas históricas reales del catálogo BiEx y síntesis por libro.
   - **Paso amable neurodivergente (tipo Habitica sin culpa):** 3 micro-pasos claros, botón directo «Leer en Contemplar» y confirmación positiva.
   - **Ranking en vivo del plan (`GET /planes/ranking?plan=<id>`):** casilla voluntaria «Aparecer en el ranking», lista en tiempo real con perfiles clicables e indicador de nube sincronizada.
7. **`B4` + `B5` · Batalla táctica cooperativa contra *El Coloso de la Tradición* (`GET /coloso`, `POST /coloso/accion`, `#/escudrina/coloso`, `juego.js` + `app.js`):**
   - `tarjetaColoso` en *Hoy* y *Mundo* detecta en vivo la incursión semanal (`estado: "activo" | "derrotado"`), muestra resistencia restante, cargas listas y acceso directo a la arena `#/escudrina/coloso`.
   - Arena completa `#/escudrina/coloso` con monumento SVG vectorial puro del Coloso (estratos de oro, plata, bronce, hierro y barro con grietas luminosas progresivas según HP, cero cruces), barra de 6 cargas cristalinas, 3 habilidades manuales estratégicas (`Golpe certero` 1c / `Palabra afilada` 2c / `Fuerza plena` 4c) con estimación escalada por poder (`1 + poder/2000`), daño flotante al impactar, bloque **B5** de enseñanza con el verso real cargado dinámicamente desde `A.versos` (`jefe.cita`) y clasificación de mayores aportes clicable.

### 2. Capturas verificadas a 3× de densidad (Entrada #9)

*(Capturas 3× HD verificadas y archivadas en la bitácora local de sesión.)*

### 3. Aprendizajes clave (Entrada #9)
1. **Lista blanca de subrutas en `app.js` (`mostrarRuta`):** cualquier subruta nueva de `#/escudrina/*` debe agregarse también a la expresión regular y al arreglo `SUB` de `app.js:7519-7520`; ya quedaron registradas `coloso` y `ajedrez`.
2. **Simetría vertical real en Modo Contemplar:** pasar `.barra` y `.pie` a `display: none !important` + `align-content: center` en `100dvh` con `--cont-y` idéntico logró `48 px == 48 px` en capítulos cortos y largos.
3. **Contraste +5 % sin `filter` en raíz:** ajustar los tokens de color directamente dio +5 % real en ambos temas con 0 % de coste de composición y sin afectar elementos `position: fixed`.

### 4. Comprobaciones pasadas (Entrada #9)
- `node --check` en todos los scripts y validación JSON / llaves CSS (`diff 0`): **correcto**.
- Auditoría léxica, iconográfica y de transliteraciones verbatim: **CLEAN**.
- Suite Playwright 3× HD (`280 / 360 / 412 / 1280 px`, temas oscuro y Pergamino, `--k = 1.42`): **0 errores de consola/página, 0 px de desborde, todas las comprobaciones en verde**.
- `python3 wix/sellar.py`: **al día** (`fb791722a585`).


---

## Entrada #10 — 24 de noviembre de 2026 (Rediseño cinematográfico de *El Coloso de la Tradición*, contraste global +3 %, Hoy centrado, Contemplar con botones gemelos, renombrado visible de Salas y Compañía, y retorno real en `‹ Escudriña`)

**Rama:** `neon/pr10-coloso-epico-y-pulidos` (desde `main` en `d7cca1f`)
**Archivos modificados / añadidos:** `img/coloso-velo.webp`, `app.css`, `app.js`, `juego.js`, `BITACORA_NEON.md` (+ sellos automáticos vía `python3 wix/sellar.py` en `index.html`, `datos/archivos.json`).

### 1. Cambios implementados y verificados

1. **Rediseño cinematográfico de *El Coloso de la Tradición* (`B4` + `B5`, `img/coloso-velo.webp` + `juego.js`):**
   - **Obra chiaroscuro de galería (`img/coloso-velo.webp`, `1152×648`, 46,5 KB):** presencia monumental velada y ambigua («sí y no» perceptible entre humo denso obsidiana y grietas doradas fundidas), 100 % libre de cruces, estrellas de cinco puntas o rayos solares, servida a densidad nativa 1.7×–3.0× (jamás ampliada).
   - **Escenario volumétrico vivo (`montarAtmosferaColoso`):** respiración GPU (`transform`/`opacity`) + doble velo de bruma abisal en deriva opuesta + motor `<canvas>` HiDPI con bruma viva, brasas doradas ascendentes, pulso interno de fracturas proporcional al daño recibido y **onda expansiva dorada con lluvia radial de 36 chispas** al impactar (pausado automáticamente vía `IntersectionObserver`, `visibilitychange`, `html.con-modal`, `html.desplazando`, `data-mov="no"` y `prefers-reduced-motion`).
   - **Pedestal monumental de resistencia:** barra segmentada con 3 marcas de fase grabadas (`25 % / 50 % / 75 %`), subtítulo de fase narrativo (*Fase I–IV*), 4 fichas tácticas, cinta de recompensa por victoria y scroll suave al escenario al golpear para ver el impacto en vivo.
   - **Controles tácticos de reliquia:** conducto de 6 cristales romboidales facetados + 3 medallones de habilidad (`Golpe certero` bronce, `Palabra afilada` zafiro, `Fuerza plena` oro fundido imperial con destello de disponibilidad) con sigilos vectoriales a medida sin cruces/estrellas/rayos.
   - **Tarjeta previa en *Hoy* y *Mundo* (`tarjetaColoso`):** miniatura panorámica cinematográfica de `img/coloso-velo.webp` con viñeta obsidiana y barra de resistencia segmentada.
   - **Aviso de prelanzamiento (`textoConserva()`):** indica explícitamente tanto en la tarjeta previa como en la arena que quienes participen desde el prelanzamiento ya suman experiencia, dracmas y aporte real, conservando aleatoriamente `entre el 0,72 % y el 40 %` al abrir el lanzamiento oficial.
2. **Contraste global calibrado a +3 % (`app.css`):**
   - Ajustado desde el +5 % del PR #9 a exactamente +3 % (interpolación al 60 % desde la base del 12-nov) tanto en tema oscuro (`--bg: #050506`, `--tinta: #f6f0e4`, `--oro: #d0af6b`, `.hoja` 84 %) como en tema claro Pergamino (`--bg: #f5efe4`, `--tinta: #100d0a`, `--oro: #75571d`, `.hoja` 90 %).
3. **Hoy — Texto de progreso de nivel centrado (`juego.js`):**
   - `.jg-nivel` pasa a `justify-content: center; text-align: center;` para centrar la leyenda bajo la barra dorada de nivel.
4. **Modo «Contemplar» (`A9`) — Botones inferiores gemelos sin colisión (`app.css` + `app.js`):**
   - En `html.contemplar`, `.jg-lb` (`Leído · VERSO`) se alinea a la izquierda (`left: max(12px, ...)`, `bottom: 8px`, `min-height: 32px`, `transform: none`) en simetría exacta con `.btn-cont-salir` a la derecha (`right: max(12px, ...)`, `bottom: 8px`, `min-height: 32px`); en pantallas `<= 440 px` el botón derecho compacta su texto visible a «Salir» manteniendo el `aria-label` completo, logrando **147 px de separación en `360 px`** y **67 px en `280 px`** con `0 px` de desborde.
5. **Renombrado visible 1 vez/día en Salas y Compañías (`juego.js`):**
   - El campo `Nombre de la sala (opcional)` de `tarjetaSala` ahora usa `.jg-in` (mismo acabado obsidiana-oro que `.jg-form input`); las salas activas muestran el control de renombrado directo en su propia tarjeta (además del modal `abrirSala`).
   - Añadido control de renombrado 1 vez al día dentro de `pintarCompania` (para quien cuida la compañía), enviando `POST /compania/nombre { nombre }` con enfriamiento de 24 h (`jg:compNom`) y sincronización visual inmediata.
6. **Enlace superior izquierdo `‹ Escudriña` vuelve a la vista anterior real (`juego.js`):**
   - Nuevo helper `enlaceVolver(dest)` que invoca `A.volver(dest)` (historial real de la app con respaldo inteligente a la pestaña padre: `#/escudrina/juntos`, `#/escudrina/mundo`, `#/escudrina/mas`), aplicado en `cabSub`, `pintarClasificacion` y `pintarCuenta`.

### 2. Pendientes acumulados opcionales para el Worker de Opus (reservados hasta terminar todos los PRs)
- `POST /sala/nombre` (`{ c, nombre }` con enfriamiento de 24 h por sala y difusión WS `{ t: "nombre", nombre }`) y devolver `nombre` en `/salas` y `/sala/info`.
- `POST /compania/nombre` (`{ nombre }`, 3–30 caracteres, solo cuidador de la compañía, enfriamiento de 24 h por compañía) para persistir el cambio de nombre en D1/KV entre dispositivos.

### 3. Comprobaciones pasadas (Entrada #10)
- `node --check` en todos los scripts (`app.js`, `juego.js`, `busqueda.js`, `intro.js`, `intro-cargador.js`, `sw.js`): **correcto**.
- Suite Playwright 3× HD (`280 / 360 / 390 / 1280 px`, temas oscuro y Pergamino, impacto en vivo de `Fuerza plena`, retorno real `Compañía → ‹ Escudriña → Juntos`, contraste `+3 %`, simetría de píldoras inferiores en Contemplar): **0 errores de consola, 0 px de desborde, todas las aserciones en verde**.
- `python3 wix/sellar.py`: **al día**.


---

## Entrada #11 — 24 de noviembre de 2026 (PR #11 · Sección D completa: Constelación del léxico y notas, Mesa sinóptica libre, Pulso del texto, Tarjetas HD 3× y Diario de estudio)

**Rama:** `neon/pr11-seccion-d-constelacion-obsidian` (desde `main` en `847fd14`, que incluye PR #10 fusionado)
**Archivos modificados:** `app.css`, `app.js`, `BITACORA_NEON.md` (+ sellos automáticos vía `python3 wix/sellar.py` en `index.html`, `datos/archivos.json`).

### 1. Cambios implementados y verificados

1. **Constelación del léxico, referencias y notas (`#/constelacion` + minigrafos en `#/raiz/:id`, `#/lema/:id` y `#/marcadores`, `app.js` + `app.css`):**
   - **Motor `<canvas>` 2D HiDPI a 0 % CPU en reposo (`motorConstelacion`):** simulación física de fuerzas con repulsión anticolisión, gravedad proporcional a la orientación de la pantalla, 95 pasos de pre-asentamiento instantáneo y congelamiento automático en estado `reposo` (0 cuadros/s hasta que el lector arrastre un nodo o toque/acerque la vista).
   - **Acabado cartográfico de museo:** polvo estelar estático determinista, anillos concéntricos de astrolabio, filamentos curvos de Bézier con doble pase de resplandor al enfocar un nodo, orbes con brillo especular, capa de etiquetas priorizada **sin solapamientos** en tipografía local `"BiEx Texto"` / `"BiEx Interfaz"`, HUD dividido en esquinas opuestas (`zoom` arriba a la derecha, indicador de estado abajo a la izquierda) y soporte completo para tema oscuro y tema claro *Pergamino*.
   - **3 capas conmutables:**
     1. *Léxico y raíces:* panorama de los **27 libros** (garantizando conexión léxica en todos sin islas sueltas) + 22 grandes familias conceptuales + 8 accesos directos (`λέγω`, `ἀγαπάω`, `πείθω`, `πνέω`, `χαίρω`, `ζωή`, `ἀληθής`, `βασιλεύς`) y buscador vivo tolerante a griego, transliteración y español (`llanoCn` + `busq`).
     2. *Referencias cruzadas:* red de ecos de cualquier libro de la Nueva Voluntad hacia sus capítulos más densos y libros de la Nueva y Antigua Voluntad.
     3. *Mis notas (12 colores):* mapa personal vivo de libros, temas de color y versos marcados.
   - **Minigrafos interactivos integrados (`tarjetaMinigrafo`):** embebidos directamente en `vistaRaiz`, `vistaLema` y `vistaMarcadores`, con botón «Pantalla completa» hacia `#/constelacion`.
2. **Mesa sinóptica libre (`#/sinopsis`, `vistaSinopsis`):**
   - Comparación palabra por palabra en griego de cualquier par de versos de la Nueva Voluntad (accesible desde *Herramientas › Leer y guardar* y desde `vistaVerso`).
   - Iluminación sincronizada al toque: lemas compartidos en oro, raíces comunes en azul, barra de afinidad léxica (%), 6 pares clásicos de ejemplo, intercambio rápido y guardado directo en el Diario de estudio.
3. **Pulso del texto al cerrar cada capítulo (`.ps-cap`, `bloquePulsoCapitulo`):**
   - Tarjeta desplegable de carga perezosa (`IntersectionObserver`) al pie de cada capítulo con las 5 raíces conceptuales dominantes, las joyas singulares (`≤ 3` apariciones en la Nueva Voluntad), la barra proporcional de pulso verbal (*Aoristo, Presente, Participios, Imperativos, Otros*) y saltos directos a *Constelación* y *Sinopsis*. Oculta automáticamente en **Modo Contemplar**.
4. **Tarjetas compartibles HD 3× (`vistaTarjetaVerso` desde `vistaVerso`):**
   - Exportador nativo en `<canvas>` a **`1080 × 1350 px`** (formato 4:5 de alta nitidez) con marco doble de códice, rombos geométricos en esquinas (cero cruces/estrellas/rayos), 3 acabados (*Obsidiana y Oro*, *Pergamino*, *Zafiro Nocturno*), opción de incluir texto griego original y tipografía de la casa (`"BiEx Texto"`, `"BiEx Titular"`, `"BiEx Interfaz"`), con descarga PNG directa y `navigator.share`.
5. **Diario de estudio y sincronización en la nube (`#/marcadores`, `NUBE_DAT.unirObj`):**
   - Conmutador *Por libro / Diario de estudio* con reflexiones libres (título, cita opcional y nota), pares sinópticos guardados, línea cronológica agrupada por día y exportación `.md`.
   - `NUBE_DAT.unirObj` ampliado con fusión profunda por marca de tiempo `t` para mapas anidados (`estudio.diario`, `estudio.pares`) sin pérdida entre dispositivos.

### 2. Aprendizajes clave (Entrada #11)
1. **Normalización de sigma final en `claveGr`:** `claveGr` sustituye `ς → σ`; los catálogos internos de búsqueda griega (como `CN_PRESETS_GR`) deben declararse siempre con `σ` medial (`λογοσ`, `πιστισ`, `χαρισ`) y combinar un normalizador griego→latín (`llanoCn`) para que búsquedas como `"logos"` o `"pistis"` coincidan de inmediato contra las transliteraciones mixtas del catálogo (`lόgος`, `pίsτις`).
2. **Tipografía de la casa en `<canvas>` sin red:** usar los nombres `@font-face` locales `"BiEx Texto"`, `"BiEx Titular"` y `"BiEx Interfaz"` (servidos desde `fuentes/`) garantiza acentos politónicos griegos y signos combinables (`YÔḥānā́n`, `ʾĔlōhî́m`) impecables tanto en la Constelación como en las Tarjetas HD `1080 × 1350`, incluso sin conexión a internet.
3. **Motor de etiquetas sin solapamientos + cero nodos huérfanos:** en grafos de 45–55 nodos, garantizar ≥ 2 aristas reales por libro evita que libros breves se disparen al borde y compriman el núcleo; y renderizar etiquetas en un pase final ordenado por prioridad con prueba de colisión de cajas elimina por completo el apilamiento de texto.

### 3. Comprobaciones pasadas (Entrada #11)
- `node --check` en `app.js`, `juego.js`, `busqueda.js`, validación de todos los `.json` / `.webmanifest` y balance de llaves CSS (`2953` bloques): **correcto**.
- Auditoría editorial y de pureza iconográfica (0 palabras prohibidas, 0 cruces/estrellas/rayos, prefijos CSS `.cn-*`/`.sn-*`/`.ps-*`/`.tc-*`/`.di-*` sin colisión): **CLEAN**.
- Suite Playwright 3× HD (`280 / 390 / 1280 px`, temas oscuro y Pergamino, reposo `0 % CPU`, foco por búsqueda `"logos"`, capas *Léxico / Referencias / Notas*, minigrafo en `#/raiz/539`, *Sinopsis*, *Pulso* oculto en *Contemplar*, *Tarjeta HD* `1080×1350`, *Diario* y estrés en `280 px`): **0 errores de consola/página, 0 px de desborde, 13/13 capturas inspeccionadas a 10/10**.
- `python3 wix/sellar.py`: **al día**.
