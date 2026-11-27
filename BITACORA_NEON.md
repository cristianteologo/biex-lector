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


---

## Entrada #12 — 24 de noviembre de 2026 (PR #12: Faro pulsante TDAH, El Coloso 2.0 inmersivo, Constelación elástica «cauchera», Mesa sinóptica de lujo, Tarjeta BiEx, pie sin botón «Leído» y última conexión aproximada)

### 1. Trabajo realizado
1. **Faro pulsante discreto de pendientes para accesibilidad TDAH (`#btn-faro`, `FARO` en `app.js` / `app.css`):**
   - Botón circular dorado de `36 × 36 px` que **solo aparece si el lector tiene ≥ 1 paso pendiente real** (0 peticiones de red, 100 % desde caché local: día pendiente en plan activo, partida de Ajedrez Bíblico en pausa, El Coloso activo con cargas, misiones diarias reales en `yo.mis`, puntos de atributo libres en `yo.av.pts`, o lectura reciente sin abrir hoy).
   - Se eleva limpiamente sobre el escudo `.jg-med` (`+25 %`, 37 px de separación verificados), sobre `.adelante.vis` y sobre `.jg-muelle`; se oculta automáticamente en **Modo Contemplar** y al abrir cualquier modal, y respeta `data-mov="no"` y `prefers-reduced-motion`.
   - Al tocarlo abre **«Tu faro de hoy»**, una lista serena sin agobio (*«Un paso a la vez: elige solo lo que quieras hacer ahora»*) con navegación directa vía `irDesdeModal`.
2. **El Coloso 2.0 — fluidez sin congelación, combate integrado y Pulso de Resonancia escalado por nivel (`juego.js`):**
   - **Nunca se congelan las esferas al desplazarse:** retirada la pausa CSS de `html.desplazando` sobre `.jg-col-art`/`.jg-col-velo` y sustituida la detención del `<canvas>` por una desaceleración fluida a **`0.42×`** durante el scroll (0 sensación de bug visual).
   - **Consola de combate unificada e inmersiva:** el conducto de cristales y las 3 habilidades viven integrados dentro de `.jg-col-escena`, y el aviso de prelanzamiento (`avisoPrelanzamientoColoso`) se movió **debajo de «Mayores aportes de la semana»** para elevar el monolito y las habilidades en pantalla.
   - **Posturas dinámicas + Pulso de Resonancia escalado al nivel:** el Coloso alterna posturas (*Muro de humo*, *Velo tenso*, *Grieta abierta*) marcando la habilidad con **`Brecha`**. Al enfocar un ataque se abre el **Pulso de Resonancia** cuya banda dorada y velocidad se ajustan al nivel de Escudriña (`Niv. 1–4` Iniciado `28 %` `1.0×`, `Niv. 5–11` Diestro `20 %` `1.32×`, `Niv. 12–20` Maestro `14 %` `1.65×`, `Niv. 21+` Gran Maestro `10 %` `2.0×`), con disparo limpio automático si expira o con `sinAnim()` para no desperdiciar cargas.
   - **VFX multicapa por habilidad, retroceso de cámara y háptica:** lanza broncínea (`golpe`), doble tajo zafiro-oro (`palabra`), destello + triple onda expansiva + 68 brasas (`fuerza`), 3 niveles de sacudida (`sacude-1/2/3`), `vibrar(...)`, texto flotante crítico y `Racha ×N`. Guarda `jg:coloso_snap` y notifica a `biex:faro`.
3. **Constelación del léxico — experiencia táctil elástica («cauchera / resorte») (`motorConstelacion` en `app.js`):**
   - Resistencia hiperbólica progresiva al arrastrar fuera del perímetro de la constelación (`step /= 1 + exc / (80 / k)`), ganancia táctil amortiguada (`0.78`), retorno elástico críticamente amortiguado e inercia acotada (`correrCam`) que vuelve a reposo **0 % CPU**.
   - Zoom de dos dedos anclado al punto medio real (sin saltos laterales), doble toque en zona libre para recentrar, desplazamientos suaves `irA(x, y, k)` y `user-select: none` + `ev.preventDefault()` para evitar selecciones azules al arrastrar.
4. **Mesa sinóptica libre — 3 mejoras (`app.js` / `app.css`):**
   - **Acceso directo en Biblioteca (`abrirLibros`):** botones **Mesa sinóptica** y **Constelación** sobre el buscador de libros.
   - **Selectores de alta relojería obsidiana-oro (`.sn-campo`, `.sn-sel-bar .mm-btn`, `.cn-foco .mm-btn`):** eliminados los botones grises planos por defecto; micro-etiquetas `Libro`, `Capítulo`, `Verso` en temas oscuro y *Pergamino*.
   - **Arreglo definitivo del botón «Sinopsis» dentro de `vistaVerso`:** sustituida la carrera `cerrarModal(); location.hash = ...` por `irDesdeModal("#/sinopsis/" + b.c + "." + cap + "." + ctx.v)`.
5. **Tarjeta HD, Pulso léxico del capítulo, botón inferior «Leído» y última conexión aproximada:**
   - **Tarjeta compartible HD (`vistaTarjetaVerso`):** cabecera actualizada para comenzar siempre con **`BiEx`** (`"B i E x   ·   B I B L I A   E X A C T A"`).
   - **Pulso léxico del capítulo (`bloquePulsoCapitulo`):** resumen más claro (*«Pulso léxico del capítulo»* + conteo de palabras griegas, joyas singulares y raíz líder).
   - **Botón inferior «Leído» oculto al pie de página (`ponerLB` en `juego.js`):** detecta `pegadoPie` (`scrollHeight - (scrollY + innerHeight) <= 24`) y oculta suavemente `.jg-lb` y `.jg-lbp` al llegar al pie, reapareciendo al subir.
   - **Última conexión aproximada (`ultimaConexionTexto` + `abrirJugadorPublico` en `juego.js`):** muestra en el perfil público y en `resumenStatsPub` la hora aproximada amable (*«Hace ~20 min»*, *«Hoy cerca de las 14:30»*, *«Ayer…»*) cuando el lector no está en línea, con TTL ampliado de `CACHE_JUG` a `60 s`.

### 2. Contratos reservados para el mensaje final consolidado al servidor (`biex-juego`)
- **`ultTs` (marca de tiempo aproximada de última actividad en ms)** en `GET /jugador` y en los listados públicos (`/clasificacion`, `/liga`, `/compania`, `/coloso` top): el cliente ya lo formatea automáticamente con `ultimaConexionTexto(...)`.
- **`POST /jugador/beneficio` (envío de beneficios entre lectores):** tras auditar todas las rutas actuales del Worker, no existe aún un endpoint de envío de beneficios/regalos entre lectores; por disciplina no se renderizó ningún botón falso 404. Se reserva en el paquete final de servidor (contrato sugerido: `{ para: apodo, tipo: "animo" | "dracmas" | "xp2", cant }` con tope diario antispam y recibo en `avisos`).
- **Opcional en `POST /coloso/accion`:** aceptar `{ hab, precision, brecha }` para bonificar el daño real del servidor según el Pulso de Resonancia y la postura activa.

### 3. Aprendizajes clave (Entrada #12)
1. **Validar contra el esquema real del Worker (`yo.mis`, `yo.av.pts`, `yo.hoy`):** la prueba Playwright reveló inmediatamente que `FARO` buscaba `yo.misiones`/`yo.av.libres` cuando el servidor entrega `yo.mis`/`yo.av.pts`. Alinear los nombres reales garantizó detección real en producción.
2. **Inspección 3× HD contra colisiones de flotantes:** ver las capturas reales reveló el solapamiento inicial de `.faro-btn` sobre el escudo `.jg-med` (`+25 %`) y la selección de texto azul al arrastrar el canvas de Constelación fuera de su caja — ambos corregidos y reverificados antes de publicar.
3. **Mandato visual permanente:** jamás entregar controles nativos grises sin estilizar ni geometrías planas/primitivas; toda pieza visual debe lucir digna de alta relojería y códice.

### 4. Comprobaciones pasadas (Entrada #12)
- `node --check app.js juego.js busqueda.js`, JSON + balance CSS (`2994` bloques) y auditoría editorial: **correcto**.
- Suite Playwright (`verificar_pr12.py`, `280 / 390 / 1280 px`, temas oscuro y Pergamino): Faro oculto en 0 pendientes y Contemplar, 37 px de separación libre sobre `.jg-med`, botón `Leído` oculto al pie y restaurado al subir, `vistaVerso → Sinopsis` sin reversión, `Coloso` integrado con canvas activo durante `html.desplazando` y aviso de prelanzamiento debajo de Mayores aportes, Pulso de Resonancia + impacto VFX, última conexión aproximada en ficha pública, **0 errores y 0 px de desborde, 18/18 capturas inspeccionadas a 10/10**.
- `python3 wix/sellar.py`: **al día**.


---

## Entrada #13 — 24 de noviembre de 2026 (PR #13 · Ajedrez Bíblico «Escudriña · Estrategia» · 13 figuras bíblicas con Esteban #12 y Pablo #13, Enigmas del Códice, piezas SVG sin cruces y caché blindada por jugada)

**Rama:** `neon/pr13-ajedrez-biblico` (desde `main` en `29ec923`, que incluye PR #12 fusionado)
**Archivos modificados:** `juego.js`, `BITACORA_NEON.md` (+ sellos automáticos vía `python3 wix/sellar.py` en `app.js`, `index.html`, `datos/archivos.json`).

### 1. Cambios implementados y verificados

1. **Motor de ajedrez FIDE 100 % legal en cliente (`AJ_ENG` en `juego.js`):**
   - Implementación completa y matemática: generación legal de jugadas, enroque corto y largo con verificación de casillas atacadas, captura al paso (*en passant*), coronación con selector modal de 4 piezas, detección de jaque, jaque mate, ahogado, regla de 50 jugadas, triple repetición y material insuficiente.
   - IA ultraligera con búsqueda alfa-beta, tablas pieza-casilla (*piece-square tables*), ordenamiento MVV-LVA, búsqueda de quietud (*quiescence*) y ejecución asíncrona por tajadas para mantener siempre `60 fps` y 100 % funcionamiento sin conexión (`0` peticiones al servidor para jugar).
2. **«Sendas de los Antiguos» — Campaña de 13 figuras bíblicas (`AJ_FIGURAS`):**
   - Los 13 escalones progresivos (`ELO ~650` a `ELO ~2150`), con transliteraciones exactas verificadas palabra por palabra contra `datos/libros/` y `datos/tablas.json`, incluyendo **`Sτέfαnος [Esteban]` (#12)** y **`Shāʾū́l — Pαῦlος [Pablo]` (#13)**, cada uno con personalidad posicional propia, cita oficial BiEx en vivo (`bloqueCitaColoso` + nombres de libro oficiales `Prάc̅ṣεις`, `1 Τιmόdsεος`, `Mattáy`, etc.) y sellos de campaña (**«Estratega del Atrio»** 7/7 y **«Diadema de Consejo»** 13/13).
3. **Piezas artesanales SVG duales (cero cruces, cero estrellas, cero rayos solares):**
   - **Piezas escriturales BiEx** (*Soberano* diadema con cabujón, *Sabiduría* lámpara encendida, *Baluarte* torreón de sillar, *Mensajero* rollo sellado, *Corcel*, *Discípulo* cayado) y alternancia en 1 toque con **piezas clásicas (sin cruz en el Soberano)**, tanto en tema oscuro Obsidiana/Oro como en tema claro *Pergamino*.
4. **Caché blindada jugada por jugada (`biex:ajedrez:partida` + `biex:ajedrez` + `/nube`):**
   - Cada media jugada (propia y de la IA), posición FEN, historial SAN, capturas, rival y estado de *Lumbre de Consejo* se guarda síncronamente en `localStorage` (y en `pagehide` / `visibilitychange`), más sincronización automática en la nube vía `A.nube` (`ajedrez`) y registro opcional de victoria (`POST /ajedrez/victoria`).
   - Si el teléfono se reinicia o se queda sin batería en mitad de una partida, al volver a `#/escudrina/ajedrez` la partida se restaura exactamente donde se dejó (con aviso *«Caché activa · Partida retomada automáticamente desde caché»*), reanuda el turno de la IA si quedó pensando e incluso aparece como acceso rápido en **Tu faro de hoy**.
5. **«Lumbre de Consejo» y «Enigmas del Códice» vinculados a la lectura diaria:**
   - **Lumbre de Consejo** (1 por partida): analiza y dibuja en el tablero las 2 mejores jugadas candidatas (anillo oro sólido + anillo zafiro punteado) con explicación táctica clara en español.
   - **Enigmas del Códice** (8 problemas de Mate en 1 y Mate en 2 matemáticamente verificados): se habilitan al leer tus primeros 5 versos del día en BiEx (dejando siempre el Enigma #1 de muestra abierto) y abren la cápsula del verso oficial BiEx al resolverse.
   - Tarjeta de acceso directo en **Escudriña › Mundo** (`tarjetaAjedrez`) y en **Tu faro de hoy**.

### 2. Aprendizajes clave (Entrada #13)
1. **Despeje táctil del tablero 8×8 en móvil (`:has(.aj-tab)`):** la inspección a 3× HD detectó que el riel lateral `.saltos-rap` rozaba la columna `h` (`h1`/`h2`) en `390 px`; ocultarlo limpiamente mediante `@media (max-width:760px){body:has(.aj-tab) .saltos-rap{...}}` deja las 64 casillas 100 % libres al jugar sin afectar ninguna otra vista.
2. **Cero códigos internos en inglés en la interfaz pública:** añadir `ajCitaBonita` / `ajCitaBonitaPub` convirtió todas las referencias visibles (`ACT`, `1TI`, `MAT`, `1CO`, `HEB`, `JAS`, `2TI`) a los nombres oficiales de BiEx (`Prάc̅ṣεις`, `1 Τιmόdsεος`, `Mattáy`, `1 Κοrίndsιοι`, `ʻIḇrî́m`, `Yaʿăqṓḇ`, `2 Τιmόdsεος`).
3. **Encuadre completo del tablero en escritorio `1280 × 860`:** ajustar la columna del tablero a `minmax(320px, min(468px, calc(100dvh - 440px)))` permite ver las 8 filas completas por encima del muelle inferior sin desplazar la pantalla.

### 3. Comprobaciones pasadas (Entrada #13)
- `node --check juego.js app.js`, validación editorial y pureza iconográfica (0 cruces/estrellas/rayos, transliteraciones verificadas contra `datos/libros/`): **CLEAN**.
- Suite Playwright (`verificar_pr13.py`, `280 / 390 / 1280 px`, temas oscuro y *Pergamino*): pruebas matemáticas FIDE (20 jugadas iniciales, en passant, enroques abiertos y bloqueados bajo ataque, 4 coronaciones, mate y ahogado), verificación matemática de los **8 Enigmas**, 13 figuras con `Esteban` #12 y `Pablo` #13, geometría exacta `64` casillas `1:1` (`maxDiff: 0.02 px`), **recarga completa en mitad de partida con restauración exacta desde caché**, `Lumbre de Consejo` (`2` candidatas), alternancia de piezas, **0 errores de consola y 0 px de desborde lateral, 12/12 capturas inspeccionadas a 10/10**.
- `python3 wix/sellar.py`: **al día**.


---

## Entrada #14 — 25 de noviembre de 2026 (PR #14 · Faro líquido compacto, El Coloso limpio y legible, Ajedrez sin «Maestro» ni «testigo», Cesta recuperable, Constelación viva más compacta, barra a letra máxima, zoom Vivaldi, botón «Leído» sin tirones, navegación Atrás blindada y notificaciones reales)

**Rama:** `neon/pr14-faro-liquido-coloso-vivaldi-nav-notif` (desde `main` en `1f83e62`, que incluye PR #13 fusionado)
**Archivos modificados:** `app.js`, `app.css`, `juego.js`, `sw.js`, `BITACORA_NEON.md` (+ sellos automáticos vía `python3 wix/sellar.py` en `index.html`, `datos/archivos.json`).

### 1. Cambios implementados y verificados (14 puntos solicitados por BiEx)

1. **Zoom táctil de precisión en PC / Vivaldi (`app.js`):**
   - El oyente de `wheel` con `ctrlKey` distingue ahora gestos finos de panel táctil (`deltaMode === 0 && Math.abs(deltaY) < 15`, umbral acumulado `10`, reinicio `480 ms`, pausa `200 ms`) frente a rueda de ratón (umbral `28`), habilitando el gesto de pellizco en Vivaldi y navegadores Chromium de escritorio.
2. **Barra de título `.barra` íntegra en los 2 tamaños máximos de letra (`tam = 8` y `tam = 9`, `app.css` + `app.js`):**
   - Fijados en `px` los tamaños tipográficos del cromo superior (`.nav a`, `.btn-buscar`, `.bb-pista`, `.acc { flex: none }`), recalculado `ajustarBarra()` dentro de `aplicarAp()` y añadida comprobación explícita contra recorte por el borde derecho de `.acc`. Verificado con `0` íconos recortados y `0 px` de desborde en `1280 px`, `1024 px` y `360 px`.
3. **Desaparición del botón inferior «Leído» al pie de página con 0 tirones (`juego.js`):**
   - Sustituida la lectura síncrona de `se.scrollHeight` durante el desplazamiento y el cambio de clase en `<html>` (`jg-con-lb`) por un `IntersectionObserver` pasivo (`LB.pieIO`) sobre `footer.pie-a` que alterna `.en-pie` (`opacity`/`transform` puros por GPU) directamente en `.jg-lb` y `.jg-lbp`, con desconexión limpia en `soltar()`.
4. **Tarjetas laterales de eventos (`.dsl`, `app.js`):**
   - Reducida su duración en `0,8 s` (`11050 ms → 10250 ms`) para agilizar su salida sin restar lectura.
5. **Faro pulsante (`#btn-faro` y `.modal.flot.faro-flot`, `app.css` + `app.js`):**
   - Orbe de cristal líquido reducido un `20 %` (`29 × 29 px`), translúcido con reflejo especular y posicionamiento dinámico libre de colisiones (`FARO.ubicar()`) sobre `.jg-med`, todos los bonos `.jg-bono` (`×2`, `+25 %`, `+50 %`), `.adelante.vis`, `.jg-muelle` y `.jg-sala-p`.
   - Modal flotante compacto a la medida de su contenido (`height: fit-content`, `max-height: min(76dvh, 560px)` — en 1 pendiente ocupa ~47 % de la pantalla sin vacío negro), con sección rotativa **«Descubre BiEx»** (`FARO_TIPS`, 12 consejos contextuales + *«Otro consejo ↻»*), elemento dedicado de verso pendiente o cesta llena en *La cosecha*, salto y enfoque directo (`FARO.enfocar()` + `.faro-resaltar`) a la sección exacta (`#jg-misiones`, `#jg-atributos`, `#jg-cosecha`, etc.) y pie discreto para activar notificaciones.
6. **Ajedrez Bíblico · Leyenda limpia (`juego.js`):**
   - Título acortado a **«Simbología de las piezas»** (eliminado `BiEx (sin cruces ni estrellas)`).
7. **Ajedrez Bíblico · Cápsula sin frase sobrante (`juego.js`):**
   - Retirada la línea de texto descriptivo `fig.frase` dentro de `panelCapsula`, dejando protagonismo puro a la cita bíblica oficial en Lectura BiEx.
8. **Terminología exacta «declarante» en lugar de «testigo» (`juego.js` + `app.js`):**
   - `Sτέfαnος [Esteban]` actualizado a **«Declarante luminoso»**, Enigma #5 a **«Declarante en el Asedio»** (conservando `id: "testigo"` para no romper progreso ya guardado) y hitos de `relatos-40` actualizados a **«declarante»** / **«Cuatro declarantes completos»**.
9. **Retiro absoluto de «Maestro» / «Gran Maestro» (`Mattáy 23:8–10`, `juego.js`):**
   - Escalones de resonancia en El Coloso renombrados a **«Versado»** y **«Sobresaliente»**; en Ajedrez Bíblico `13 maestros → 13 figuras` y `Shāʾū́l — Pαῦlος [Pablo]` actualizado a **«Emisario a las naciones · Visión total»**. Auditoría global: `0` ocurrencias de `maestro` en toda la aplicación.
10. **Cesta de La cosecha · Verso pendiente recuperable (`juego.js`):**
    - `tarjetaVerso` guarda en `jg:cestaUlt` el verso entregado hasta marcarlo como «Leído» (`hecho: true`), y `tarjetaCosecha` ofrece el botón **«Leer último verso (Libro cap:v)»** para retomarlo en cualquier momento aunque se salga de *Tu Árbol*.
11. **Constelación del léxico (`motorConstelacion`, `app.js`):**
    - Encuadre ~35 % más aprovechado (menos margen vacío exterior en `limites()`, `lBase` más compacto y `kFit <= 1.85`), respiración orgánica imperceptible e impredecible con frecuencias coprimas (~18 fps, pausada automáticamente fuera de pantalla, en pestaña oculta, con modales o en «Sin animaciones»), y `ev.stopPropagation()` en `wheel` del lienzo.
12. **Biblioteca alineada a la derecha + navegación Atrás blindada (`app.css` + `app.js`):**
    - `.libs-acc { justify-content: flex-end; }` alinea *Mesa sinóptica* y *Constelación* bajo el botón `×`.
    - `irDesdeModal` guarda posición exacta (`anotarPos()`), marca `M.sinRuta.cualquiera = true`, difiere `ejecutar()` un turno tras `popstate` (evitando colisión con `hashchange` residual de `vistaVerso`) y amplia el respaldo a `420 ms`. Verificada restauración exacta al píxel (`1863 px === 1863 px`) en *Biblioteca → Sinopsis → Atrás*, *Biblioteca → Constelación → Atrás* y *Verso → Sinopsis → Atrás*.
13. **Notificaciones reales nativas en navegador y app instalada (`sw.js` + `app.js` + `juego.js`):**
    - Nuevo gestor `BIEX_NOTIF` + tarjeta **«Avisos y notificaciones»** en `#/app` (permiso, preferencias por categoría: *El Coloso*, *Cesta de la cosecha* y *Recordatorio diario*, prueba en vivo y guía de desbloqueo si están denegadas).
    - `sw.js` atiende `notifConfig`, `notificationclick` (enfoca o abre la ruta exacta de BiEx) y chequeo respetuoso en segundo plano dentro de `periodicsync`. Enlazado a *El Coloso*, avisos en vivo `.dsl` y cesta llena.
14. **El Coloso de la Tradición (`juego.js`):**
    - Despejada la cabecera sobre el arte (solo `En vivo` y `Semana ...`, sin cubrir la figura); postura y brecha movidas a la franja táctica `.jg-col-post-bar` dentro del panel de combate `.jg-col-comb`.
    - Retención del daño flotante `.jg-col-dano` ampliada de `1,45 s` a **`3,6 s`** (`opacity: 1` sostenida entre `18 %–78 %`), y nueva barra persistente **«Último impacto»** (`.jg-col-ult`) visible en la consola táctica hasta el siguiente ataque.

### 2. Aprendizajes clave (Entrada #14)
1. **Un `IntersectionObserver` pasivo elimina tirones de pie de página mejor que cualquier umbral de `scrollY`:** leer `scrollHeight` y mutar clases en `<html>` al llegar al final de capítulos largos disparaba recálculo global justo en la transición; pasar a `.en-pie` directo sobre los dos botones fijos deja `0` reflujos.
2. **Aislar el tamaño del cromo superior del multiplicador `--k` de lectura:** fijar en `px` los botones y texto de `.barra` garantiza accesibilidad real en los 9 tamaños de lectura sin sacrificar jamás herramientas de navegación.
3. **Respeto integral del léxico y el esquema real en pruebas:** validar la respuesta real de `/api/juego/poder` y `/api/juego/arbol` permitió verificar de punta a punta *La cosecha* y su relectura del último verso en móvil `3× HD`.

### 3. Comprobaciones pasadas (Entrada #14)
- `node --check app.js juego.js sw.js busqueda.js`, balance CSS (`3021` bloques), JSON válidos y auditoría editorial (`0` «maestro», `0` «testigo» bíblico, `0` «sorteo», `0` «versículo»): **CLEAN**.
- Suite Playwright (`verificar_pr14.py`, `360 / 390 / 1024 / 1280 px`, temas oscuro y *Pergamino*): zoom táctil Vivaldi (`"" → "1.25"`), barra `.barra` sin recortes en `tam = 8` y `tam = 9` en escritorio y `360 px`, restauración Atrás al píxel exacto (`1863 === 1863`) en las 3 rutas, Faro `29 × 29 px` con `12 px` libres sobre `×2` y `+50 %`, modal compacto (`0,47` de alto en 1 pendiente), salto y enfoque exacto, `Leído` oculto al pie vía `IntersectionObserver`, Coloso con `.jg-col-dano` visible a `2,2 s` (`3,6 s` total) y `.jg-col-ult` persistente a `3,9 s`, Ajedrez limpio (`Simbología de las piezas`, `Declarante luminoso`, `Declarante en el Asedio`, `Emisario a las naciones`, `0` frases sobrantes), *La cosecha* con botón *Leer último verso* funcional, `#/app` notificaciones verificadas en estado bloqueado y activado, **0 errores de consola y 0 px de desborde, 18/18 capturas 3× HD inspeccionadas a 10/10**.
- `python3 wix/sellar.py`: **al día**.


---

## Entrada #15 — 24 de noviembre de 2026

**Rama:** `neon/pr15-armonia-total-transiciones-faro-consejos-notif-bateria` (sobre `main` en `95dc2a0`)
**Propuesta:** PR #15 · Aislamiento de pellizco, Constelación sin vacío extremo, 29 consejos contextuales, Ajedrez bajo Misiones, Faro 15 %, Atrás blindado (incl. Wix), Notificaciones universales, Batería y Armonía WCAG AA 0-flasheos
**Archivos modificados:** `app.css`, `app.js`, `juego.js`, `BITACORA_NEON.md` (+ sellos automáticos vía `python3 wix/sellar.py` en `app.js`, `index.html`, `datos/archivos.json`).

### 1. Cambios realizados

1. **Aislamiento total del gesto de pellizco en las ramas del Árbol y en la Constelación (`app.js` + `juego.js`):**
   - `zonaPellizcoPropio` filtra `touchstart` (2 dedos), `wheel` con `ctrlKey`/`metaKey` y `gesturestart`/`gesturechange` (Safari) cuando el gesto ocurre dentro de `.jg-arbol-vivo`, `.cn-caja`, `.cn-lienzo`, `.tl-mapa` o `[data-sin-pellizco="1"]`.
   - En `arbolVivo` («Las ramas») y `motorConstelacion`: se añade `data-sin-pellizco="1"`, `stopPropagation()` en `touchstart`/`touchmove` de 2 dedos y `wheel` con `ctrlKey`/`metaKey`, y `user-select: none` para evitar selección accidental de texto al arrastrar. Pellizcar las ramas o los grafos **nunca** altera el tamaño de letra general de la página.
2. **29 consejos accesibles para principiantes + franja discreta por sección (`.guia-ctx` en `app.css` + `app.js` + `juego.js`):**
   - Ampliación de `FARO_TIPS` de 12 a **29 consejos en español llano** para personas con o sin conocimientos previos de griego o estudio bíblico.
   - Nueva franja contextual plegable y rotativa `guiaSeccion(sec)` (con botones `Otro ↻` y `×` persistente por sección en `biex:guiasOff`, y opción «Mostrar consejos en secciones» dentro del Faro si se ocultó alguna) habilitada en *Análisis*, *Línea del tiempo*, *La fuente Q*, *Constelación*, *Mesa sinóptica libre*, *Escudriña › Hoy*, *Tu Árbol*, *El Coloso*, *Ajedrez Bíblico* y *Juntos*.
3. **Ajedrez Bíblico debajo de «Misiones de hoy» (`juego.js`):**
   - Reubicada `tarjetaAjedrez(true)` directamente debajo de `tarjetaMisiones(y)` en la columna izquierda de `.jg-dos` dentro de *Escudriña › Hoy*, equilibrando tanto el flujo vertical móvil como las dos columnas de escritorio (`Misiones + Ajedrez` | `Hoy + Novedades`).
4. **Faro con 15 % de transparencia y cero solapamientos (`app.css` + `app.js` + `juego.js`):**
   - `.faro-btn` en reposo con `opacity: .85` (`1` al pasar el cursor, enfocar o tocar).
   - `FARO.ubicar()` reserva espacio para `.jg-med`, `.jg-bonos`, `.jg-muelle` y `.jg-sala-p` incluso durante su entrada, y `medidor()` invoca `A.ubicarFaro()` de forma síncrona y en `rAF`, eliminando cualquier solapamiento con el escudo de nivel.
5. **Constelación: margen inicial al 25 % y tope limpio en arrastre extremo (`app.js`):**
   - El ajuste exterior inicial se suavizó del 35 % al **25 %** (`±31 / -26..+34`, `(W-44)/bw`, `(H-60)/bh`, `kFit <= 1.72`).
   - Nuevo `limitesCam(L, k)` consciente del tamaño real de pantalla (`halfW`, `halfH`): al arrastrar hacia cualquier esquina extrema, la constelación mantiene un margen limpio (~12 %) en vez de vaciar el 75 % del lienzo en negro.
6. **Gesto Atrás blindado desde Biblioteca → Mesa sinóptica / Constelación (`app.js`):**
   - `irDesdeModal` reemplaza in-situ la entrada `[1]` del modal (`history.replaceState({}, "", urlHash(hh))`) en lugar de encadenar `history.go(-1)` + `location.hash`, evitando carreras con Chrome Android y con el `<iframe>` incrustado en Wix (`?incrustado=1`). Probado en 4 rutas directas y dentro de un `<iframe>` HTTP real: devuelve siempre a la vista exacta y al píxel exacto de lectura.
7. **Notificaciones con máxima compatibilidad cross-browser y modo incrustado (`app.js` + `app.css`):**
   - `BIEX_NOTIF.estadoSoporte()` distingue `"ok"`, `"embed"` (Wix iframe), `"ios_safari"` (guía paso a paso para agregar a inicio), `"inseguro"` y `"no_soportado"`.
   - En modo incrustado (`?incrustado=1`), en lugar de «No disponible en este navegador», muestra píldora ámbar **«Disponibles en la dirección directa de la app»**, explicación clara y botón dorado **«Abrir BiEx y activar avisos»** hacia `bibliaexacta.pages.dev/#/app?avisos=1` (que enfoca automáticamente `#app-avisos`).
   - En Android Chrome utiliza obligatoriamente `ServiceWorkerRegistration.showNotification()` vía `asegurarSW()`, y en Safari antiguo soporta tanto promesa como callback en `requestPermission`.
8. **Auditoría integral de armonía visual, cero flasheos, contraste WCAG AA y ahorro de batería (`app.css` + `app.js` + `juego.js`):**
   - **Cero flasheos / CLS en SPA:** `vistaJuego`, `vistaLibro`, `vistaConstelacion`, `vistaSinopsis`, `vistaConcordancia`, `vistaLema`, `vistaRaices`, `vistaRaiz`, `vistaAnalizador`, `vistaBuscar` y `pintarColoso` omiten borrar la vista con `cargando()` cuando los datos ya están en RAM; retirado `opacity: 0` de `html.jg-volviendo`. Resultado: **`0` flasheos en todas las transiciones (`cap → hoy → mundo → arbol → cap`)**.
   - **Simetría y proporciones:** tarjeta de *El Coloso* en 2 columnas equilibradas en PC (`≥ 780 px`), botón *Actualizar* en línea en *Salas abiertas*, `.hero .acciones` proporcionado, `.sn-acc` en 2 columnas móviles, `.seg.tl-seg` equilibrado en *Cronología*, `.app-botones .btn` protegido contra desbordes.
   - **Contraste WCAG AA (Deque `axe-core`):** corregidos `.jg-pr-dr` (dracmas en *Misiones*), `.cuenta-m` / `.cuenta-m small` y `.creditos-tit` en tema claro *Pergamino* → **0 violaciones `axe-core` en las 14 combinaciones Oscuro y Pergamino**.
   - **Ahorro real de batería:** `html.oculto` en `visibilitychange` pausa todas las animaciones de fondo, faro y Escudriña; `R.reloj` (250 ms) y `PRES.iv` se detienen en segundo plano (`0 %` CPU oculto); `arbolVivo` pausa sus animaciones `orbita`/`luz` fuera de pantalla; respiración de Constelación limitada a ~14 fps y auto-pausada; `moTema` ya no repinta el canvas al hacer scroll; todos los `setInterval` (`revisarVersion`, `ponerFechaJer`, `tarjetaMisiones`, `tarjetaNovedades`, `cuentaAtras`, `tPost`, `horaZona`, `relojCiudades`, `relevo`) respetan `document.hidden`.

### 2. Aprendizajes clave (Entrada #15)
1. **Reemplazar la entrada `[1]` del modal (`history.replaceState`) supera cualquier cadena `history.go(-1)` + `location.hash`:** evita por completo las condiciones de carrera en el historial conjunto de Chrome Android y en los `<iframe>` incrustados como el de Wix.
2. **La inspección visual 3× HD + `axe-core` atrapa defectos invisibles para los tests unitarios:** detectó el array literal pasado a `Element.replaceChildren()` en modo `embed`, el `opacity: .82` heredado del padre `.cuenta-m` en tema *Pergamino*, el leve desborde del botón largo en `390 px` y el velo negro residual de `jg-volviendo`.
3. **Los límites de cámara en un grafo deben restar la mitad real del viewport (`halfW`, `halfH`):** acotar el centro de la cámara contra el bounding-box crudo del grafo permite empujar el contenido hacia una esquina dejando 75 % de vacío negro; restar `halfW`/`halfH` garantiza encuadre sólido en cualquier zoom.

### 3. Comprobaciones pasadas (Entrada #15)
- `node --check app.js juego.js sw.js busqueda.js`, balance CSS (`3044` bloques), auditoría editorial limpia (`0` «maestro», `0` «testigo bíblico», `0` «sorteo», `0` «versículo»): **CLEAN**.
- Deque **`axe-core`** en **7 vistas × 2 temas (Oscuro + Pergamino)**: **0 violaciones (14/14 limpio)**.
- Auditoría integral `auditor_biex_completo.py` (18 vistas × 4 viewports `360 / 390 / 768 / 1280 px`): **0 errores de consola**, **0 flasheos** en todas las transiciones SPA (`cap → hoy → mundo → arbol → cap`).
- Suite dedicada `verificar_pr15.py` + capturas 3× HD: Faro `opacity: 0.85` con `58 px` libres sobre `.jg-med`, 29 consejos rotativos + guías contextuales por sección, Ajedrez debajo de Misiones en móvil y PC, Coloso 2 columnas en PC (`380 px` + `648 px`), pellizco aislado en `.jg-arbol-vivo` y `.cn-lienzo` (`tam` sin cambios), pan extremo de Constelación acotado, Atrás desde Biblioteca verificado en 4 rutas directas (con scroll exacto `520 === 520`) y en `<iframe>` Wix real, notificaciones verificadas en modo directo y modo incrustado (`?incrustado=1`), pausa de batería en `document.hidden` verificada (`oculto: true`, `paused`). Todas las capturas 3× HD revisadas visualmente a **10/10**.
- `python3 wix/sellar.py`: **al día**.

---

## Entrada #16 · PR #16 · Pinceladas orgánicas de portada, salas persistentes (7 días), comparador multi-vista, reparación de caché y preparación Web Push (2026-11-25)

### 1. Cambios entregados
1. **Los 5 botones de portada en pinceladas difuminadas (`.hero .acciones > .btn`, `app.css`):**
   - Eliminadas todas las cajas, bordes rectos y sombras de caja en los 5 botones principales de inicio (*Seguir leyendo*, *Leer*, *Analizar palabra por palabra*, *Los 27 libros*, *Escudriña · el juego*).
   - Reemplazados por **3 siluetas SVG caligráficas orgánicas (`--pin-w`, `--pin-a`, `--pin-b`)** combinadas con un difuminado vertical continuo mediante `mask-composite: intersect` / `-webkit-mask-composite: source-in` (sin `<filter>` SVG interno ni `blur` costoso en CPU/GPU), fundiendo los 4 bordes de cada botón en el fondo *Obsidiana* (pan de oro bruñido + tinta ahumada con corazón dorado) y *Pergamino* (tinta dorada oscura + aguada sepia) con contraste WCAG AAA.
   - `z-index: -1` en `::before`/`::after` dentro de `isolation: isolate` para que tanto los íconos `<svg>` como los nodos de texto sin envoltura queden al 100 % de nitidez sobre la pincelada, y `overflow-x: clip` en `.hero` para garantizar `0 px` de desborde horizontal desde `280 px` hasta `1280 px`.
2. **Salas de lectura persistentes durante 7 días (`juego.js`):**
   - Extendido `retomarSala()` de `12 h` (`12 * 3600e3`) a **7 días completos** (`7 * 864e5`), coincidiendo con la vida real de las salas en el servidor, y refrescando `jg:sala` en cada mensaje WS `estado`.
   - Recuperación automática multidispositivo vía `yo.miSala` en `actualizarYo()` (si el usuario no salió manualmente en la sesión actual, recupera su sala activa y pinta inmediatamente la píldora inferior `.jg-sala-p`).
   - Enviado `persistente: ab.checked` (y `persistente: true` en `acompanar`) al crear salas en `POST /sala/crear`.
   - En el modal de sala (`abrirSala`), el anfitrión distingue claramente **«Salir un momento»** (sale localmente sin cerrar la sala) frente a **«Cerrar sala»** (`POST /sala/cerrar { c }`, limpiando la sala en servidor y cliente).
   - En `tarjetaSalasAbiertas`, las salas abiertas con `0` personas conectadas en ese instante muestran **«en espera · abierta»** en lugar de «0 personas»; y `pintarSalaPildora` muestra «conectando…» en lugar de «0 personas» mientras llega el primer estado WS.
3. **Comparador rápido de 4 vistas dentro de cada verso (`vistaVerso` en `app.js` + `.fv-cmp` en `app.css`):**
   - Panel plegable «Comparar vistas de este verso» con carga perezosa (0 coste al abrir el verso) que muestra en paralelo: **Griego original** (con puntuación formateada por `punt()`), **Textual · completa con matices** (`corForzado = "todo"`), **Lectura · limpia y orden natural** (`corForzado = "base"` + `txtVersoL`), y **Jünemann (traducción clásica)**.
4. **Reparación limpia de caché y comprobación de versión en `#/app` (`vistaApp` en `app.js` + `.app-diag` en `app.css`):**
   - Nueva tarjeta «Actualizar versión y reparar caché» con ícono `ICO.actualizar`, botón «Comprobar actualización» (consulta la publicación vigente) y botón «Reparar caché y recargar» que elimina únicamente las cachés `biex-*` del Service Worker y ejecuta `reg.update()` sin tocar jamás `localStorage` ni `sessionStorage` (notas, marcadores, planes, partidas y sesión intactos).
   - Añadido `aria-label="Progreso de la copia sin conexión"` a `.app-barra` para alcanzar **0 violaciones `axe-core`** en `#/app` (Oscuro y Pergamino).
5. **Web Push real en segundo plano listo en cliente y Service Worker (`sw.js` + `app.js`):**
   - Listener `push` en `sw.js` que recibe `{ title, body, ruta/url, tag, renotify }`, sanitiza la ruta interna y dispara `self.registration.showNotification(...)` incluso con el navegador cerrado.
   - Flujo VAPID completo en `BIEX_NOTIF` (`urlBase64ToUint8Array`, `suscribirPush`, `desuscribirPush` conectados a `/push/clave` y `/push/suscribir`), nueva preferencia **«Alguien entra en tu sala de lectura abierta»** (`sala: true`) en `#/app` y auto-suscripción silenciosa en calma al arrancar si ya hay permiso concedido (degrada sin errores mientras el Worker aún no exponga VAPID).

### 2. Aprendizajes clave (Entrada #16)
1. **Nunca colocar `<filter>` (`feTurbulence` / `feGaussianBlur`) dentro de un `data:image/svg+xml` usado en CSS `mask-image`:** en Chromium/Skia headless puede disparar cierres de pestaña al rasterizar varios botones a 3× DPR. En su lugar, una silueta orgánica Bézier pura combinada con un degradado vertical mediante `mask-composite: intersect` (`-webkit-mask-composite: source-in`) logra bordes acuarelados sedosos en los 4 lados con **0 `<filter>` y 0 coste de rasterizado**.
2. **En CSS `isolation: isolate`, un `::before` con `z-index: 0` cubre nodos de texto sin etiqueta envolvente:** fijar `z-index: -1` en `::before` y `::after` asegura que tanto `<svg>` como nodos de texto directos pinten siempre por encima del fondo.
3. **`corForzado` en `app.js` permite mostrar la máxima riqueza textual y la lectura más limpia lado a lado** en el comparador multi-vista incluso en versos cuyo orden griego y español coinciden (como YÔḥānā́n 1:1).

### 3. Comprobaciones pasadas (Entrada #16)
- `node --check app.js juego.js sw.js busqueda.js`, balance CSS (`3086` bloques), auditoría editorial limpia (`0` «maestro», `0` «testigo bíblico», `0` «sorteo», `0` «versículo»): **CLEAN**.
- Portada 5 pinceladas y 4 pinceladas en `280 / 360 / 390 / 1280 px` (Oscuro y Pergamino): **`0 px` de desborde**, **0 violaciones `axe-core` WCAG AA**, inspección visual 3× HD **10/10**.
- Comparador multi-vista en YÔḥānā́n 1:1 (Oscuro y Pergamino, móvil 3× HD y PC 2× HD): 4 paneles distintos y legibles, **0 violaciones `axe-core`**.
- `#/app` (Oscuro y Pergamino, 3× HD): tarjeta «Actualizar versión y reparar caché», casilla «Alguien entra en tu sala de lectura abierta», **0 violaciones `axe-core`**, `0 px` de desborde.
- Salas persistentes (`juego.js`, móvil 3× HD): reconexión automática tras **3 días** (`retomarSala`), refresco del timestamp en WS `estado`, recuperación multidispositivo con `yo.miSala`, texto «en espera · abierta» cuando `n = 0`, botones «Salir un momento» y «Cerrar sala» (`POST /sala/cerrar`), **0 violaciones `axe-core`**, **0 errores de consola / página**.
- `python3 wix/sellar.py`: **al día**.

---

## Entrada #17 · PR #17 · Brochazos caligráficos de portada, Atlas bíblico interactivo, Repaso espaciado de raíces, ciclo completo de salas (7 días), integración Opus `28842cf` y precisión léxica (2026-11-25)

### 1. Cambios entregados
1. **Rediseño artístico de los 5 botones de portada en pincelada de brocha plana (`.hero .acciones > .btn`, `app.css`):**
   - Sustituidas las siluetas anteriores por **trazos caligráficos pintados en SVG puro de brocha plana** (haces de cerdas paralelas, estrías de brocha seca *kasure*, colas de cerdas divididas y motas de pan de oro/sepia en los bordes, **0 `<filter>` SVG**).
   - Legibilidad WCAG AA/AAA en *Obsidiana* (pan de oro bruñido en el principal + tinta ahumada con estrías doradas en secundarios) y *Pergamino* (oro antiguo + aguada sepia cálida), `0 px` de desborde `280–1280 px`, **0 violaciones `axe-core`**.
2. **Línea de verso marcado estrictamente detrás de marcas léxicas (`.vs.mk`, `app.css`):**
   - Retirado el `box-shadow` que montaba sobre las palabras subrayadas; la línea de verso marcado pasa a `background-image: linear-gradient(...)` a `100% 100%` con `z-index: 0`, mientras `.rara-l` / `.rara-t` quedan con `position: relative; z-index: 1` y `text-underline-offset: 2px`, dejando el subrayado azul punto-raya claramente por delante y encima del filete del marcador (verificado a 3× HD en `Yαʿăqṓḇ [Santiago] 1:21`).
3. **Cero solapamientos de íconos flotantes y avisos + armonización del texto base (`app.css`, `app.js`):**
   - `.aviso-flot` movido a la zona superior centrada (`html.en-cap` lo desplaza `60 px` bajo `.barra` para librar `.barra-hoja`, usando clase O(1) en `mostrarRuta` sin `:has()`).
   - Despeje inferior de `.hoja` ampliado a `96 px` en móvil y ocultación automática del texto `≈ N min` en `saltosRapidos` al acercarse al pie (`p > 0.88`, despejando `.ps-cap` con `0 px` de choque).
   - Tamaño base de lectura armonizado con el resto de la interfaz: `.vl .vt` `1.04rem` y `.continuo p` `1.05rem` (`~15.75 px` computados a `tam = 3`).
4. **Correcciones editoriales permanentes y precisión léxica cotejada contra `datos/libros/` (`app.js`, `juego.js`):**
   - **«Originario» / «Originador», nunca «Original»:** corregidas las 5 cadenas de interfaz de manuscritos, texto griego y títulos en `app.js` (p. ej. *Griego originario*, *Manuscritos originarios*). Nota para BiEx/Opus: queda 1 cadena `"el texto original,"` dentro de `datos/estudios.json` (no editado a mano por norma de `CLAUDE.md`, para ajustar en el generador del Taller).
   - **«Canto [bloque]» / «Cantos [bloques]», nunca «piedra» / «piedras»:** sustituidas todas las menciones visibles en `juego.js` (con morfología masculina exacta: `primer`..`duodécimo canto [bloque] del fundamento`, `Lo hallaste`, `muralla de la ciudad`, tarjeta `Cantos` en ficha pública) y en el plan `1PE` de `app.js` (`1 Pέτrος 2:5`: «cantos [bloques] viviendo»), preservando intactas las claves JSON internas del Worker (`y.piedras`, `x.tipo === "piedra"`).
   - Eliminada la frase innecesaria `"(escalera al usarlo: 1 semana, luego 2, y en adelante cada 3 semanas)."` de la tarjeta *Atributos* en `juego.js`.
   - Cotejadas palabra por palabra las **42 descripciones del Atlas bíblico** directamente contra los versos citados en `datos/libros/` (`recinto sagrado`, `Pésaḥ [Paso por encima]`, `fecha de la quincuagésima`, `reunión`, `convocación fuera [asamblea]`, `aprendices [estudiantes]`, `más viejos [mayores]`, `fuente de Yaʿăqṓḇ`, `espíritu [soplo] consagrado [santificado]`, `documento [rollo] de Yᵉshaʿyā́HŪ [Isaías]`, `los entrañables [afectuosos]`, `entrada [abertura] abierta`, `tribulación [aflicción]`, `para un Dios desconocido`, etc.).
5. **Ciclo de vida completo de salas (7 días) e integración total con Opus `28842cf` (`juego.js`, `app.js`):**
   - Aviso anticipado de **48 horas antes del cierre automático** (`.jg-sala-av` en *Leer en compañía* y modal de sala, alerta en `FARO.pendientes()` vía `estadoSalaVence()` y notificación del dispositivo).
   - **Cierre automático** (`POST /sala/cerrar`) de la sala anterior del anfitrión al crear una nueva sala.
   - **Aviso definitivo a creadores tras 7 días de inactividad** (`comprobarSalaVencida`, historial `jg:miSalaHist` y mensaje WS `{ t: "cerrada" }`) invitándolos a crear una nueva sala.
   - Integración completa del paquete de servidor `28842cf`: envío de `brecha: !!brecha` en `POST /coloso/accion` + visualización de `r.bono.mult`; sincronización y manejo de errores en `POST /compania/nombre`; panel interactivo **«Gesto de compañía»** (`POST /jugador/beneficio`, 4 botones) dentro de la ficha pública del jugador; y telemetría liviana de errores `POST /error` en `app.js` (tope 2/sesión).
6. **Insignia 1 · Atlas bíblico interactivo (`#/mapa` y `#/mapa/<id>`, `app.js` + `app.css`):**
   - **42 enclaves históricos** de la Nueva Voluntad sobre mapa SVG puro (`960 × 540`) del Levante y el Mediterráneo (con mar de Gālī́l, río Yardḗn y mar Muerto), 4 capas filtrables (*Todo el mapa (42)*, *Vida de YēshŪ́aʿ*, *Viajes de Pαῦlος [Pablo]* con 4 rutas trazadas, *7 convocaciones · Ἀpοκάlυpsις*).
   - Zoom/arrastre con pellizco aislado (`data-sin-pellizco="1"`), tipografía compensada al zoom y desplazamientos cartográficos direccionales (`ATLAS_OFF`) sin solape, progreso de lectura en verde (`LEI.es`), directorio buscable, accesos desde Biblioteca y Herramientas, y chips clicables `.fv-lugares` dentro de `vistaVerso`.
7. **Insignia 2 · Tarjetas de repaso breve de raíces griegas — 1 min/día (`#/raices/repaso`, `app.js` + `app.css`):**
   - Repaso espaciado Leitner de 5 cajas (1, 2, 4, 8, 16 días) guardado en `estudio.repasoRaices` (sincronizado automáticamente con `/nube`), filtrado a raíces griegas sustantivas (verbos, sustantivos y adjetivos con `["V", "N", "A"].includes(claseLema(r))`, priorizando familias derivadas `fam.length >= 2`), rondas de 6 tarjetas, barra de avance accesible (`aria-label`), familia de palabras y libros principales de la Nueva Voluntad.

### 2. Normas editoriales permanentes añadidas a la memoria de Neon (Entrada #17)
1. **Manuscritos e idioma fuente:** usar siempre **«originario» / «originador»**, nunca **«original»** (no existen autógrafos originales, sino manuscritos originarios con idioma originador de traducción).
2. **`λίθος` y morfología bíblica:** usar siempre **`canto [bloque]` / `cantos [bloques]`** (masculino), nunca «piedra»/«piedras», cuidando siempre la concordancia de género en ordinales y pronombres.
3. **Cotejo obligatorio con el corpus (`datos/libros/`):** antes de escribir cualquier resumen, ficha geográfica, misión o concepto derivado de pasajes bíblicos, contrastar literalmente los versos en `datos/libros/` para respetar al 100 % el vocabulario y la morfología de BiEx.

### 3. Aprendizajes técnicos (Entrada #17)
1. **Nunca usar `:has()` sobre contenedores grandes (`body:has(.barra-hoja)`):** sustituido por clase O(1) `html.en-cap` alternada en `mostrarRuta`.
2. **No sobreescribir `font-size` SVG desde CSS con el shorthand `font:`:** `.mp-pin text` debe omitir el tamaño fijo en CSS para que el escalado inverso al zoom (`tx.style.fontSize`) mantenga las etiquetas cartográficas nítidas y contenidas al acercar el mapa.
3. **Accesibilidad en SVG interactivos y barras de avance (`axe-core`):** un `<svg>` con pins interactivos (`role="button" tabindex="0"`) debe llevar `role="group"` (no `role="img"`, que dispara `nested-interactive`); toda barra `role="progressbar"` debe declarar `aria-label`.

### 4. Comprobaciones pasadas (Entrada #17)
- `node --check app.js juego.js sw.js busqueda.js`, balance CSS (`3192/3192`), cero `:has()`, auditoría léxica sobre todo el diff y las 42 entradas del Atlas cotejadas contra `datos/libros/`: **CLEAN**.
- Suite Playwright 3× HD (`verificar_pr17.py`, Oscuro y Pergamino, `280 / 390 / 1280 px`) + Deque `axe-core`: **`pageerrors=0`, `axe_violations=0`, `0 px` de desborde en todas las vistas (`280 px` incluido)**, todas las capturas 3× HD inspeccionadas visualmente a **10/10**.
- `python3 wix/sellar.py`: **al día** (`f8da4cf622e2`).

---

## Entrada #18 · PR #18 · Fluidez 60 fps, pinceladas flotantes de puntas suaves, Constelación 3D + giroscopio 2.5D, Atlas de museo con hoja de libro, coincidencia exacta de líneas, iluminación de citas, El Coloso a 60 fps, novedades de 3 días y cuidado teológico de «poder» (2026-11-26)

**Rama:** `neon/pr18-fluidez-25d-atlas-lineas-coloso`
**Archivos modificados:** `app.css`, `app.js`, `juego.js`, `BITACORA_NEON.md` (+ sellos automáticos vía `python3 wix/sellar.py` en `index.html`, `datos/archivos.json`).

### 1. Cambios entregados y verificados
1. **Fluidez de desplazamiento a 60 fps en lectura bíblica y portada (`app.css`, `app.js`, `juego.js`):**
   - Eliminado el último selector `:has()` global (`0` ocurrencias de `body:has` / `html:has` / `#vista:has` en todo el repositorio), retirado `backdrop-filter` de los controles flotantes presentes durante el scroll (`.saltos-rap`, `.jg-sala-p`), pausadas las animaciones ambientales durante `html.desplazando` y omitidas las lecturas de geometría en `tick()` mientras la página se desplaza.
2. **Los 5 botones de portada flotando sutilmente con pinceladas de puntas suaves (`.hero .acciones > .btn`, `app.css`):**
   - Extremos dorados y sepia rediseñados en abanico redondeado y aterciopelado (sin puntas agudas ni astillas), con levitación sutil desfasada (`heroFlota` en compositor GPU) y sombra proyectada propia (`::after` centrada con `transform: translate3d(0, 0, 0)` y `animation: none`) directamente bajo cada pincelada en temas *Obsidiana* y *Pergamino*.
3. **Constelación en profundidad 3D real (`#/constelacion`) + inmersión 2.5D sensible al giroscopio (`INMERSION_25D` / `window.BiEx25D`, `app.js`, `app.css`, `juego.js`):**
   - Motor `motorConstelacion` evolucionado a proyección en perspectiva 3D multicapa (`z` determinista por anillo jerárquico, ordenamiento de pintor de fondo a frente, niebla atmosférica y escala focal) sensible en tiempo real a la inclinación del dispositivo (`deviceorientation` con autocalibración suave) y al puntero en escritorio, manteniendo **0 % de uso de CPU/batería en reposo y durante el desplazamiento**, más paralaje 2.5D sutil en Portada, Atlas y El Coloso.
4. **Iluminación dorada exacta del número de verso en saltos directos de citas (`.vn-foco`, `marcarVerso(v, true)`, `BiExJuego.fijarVersoFoco`):**
   - Al tocar cualquier cita en el Atlas Bíblico, buscador, estudios o enlaces directos (`#/LIB/CAP/l/V`), el verso aterriza en la banda de lectura (`39,5 %`, ampliando `padding-bottom` si es uno de los últimos versos del capítulo como `Lουκᾶς 24:50`) e ilumina exactamente su número con halo dorado (`.vn-foco`) sincronizado con el foco activo de *Escudriña*.
5. **Coincidencia exacta línea por línea entre `Lectura ↔ Textual` y `Por versos ↔ Continuo` + cero sobresalto arriba (`capturarAnclaLinea`, `yDeAncla`, `.encab-cifras.dos`):**
   - Unificadas al milímetro las métricas tipográficas (`--t-verso: .98rem`, `line-height: calc(1.76 * var(--lh))`) y el alto de `.encab` (`106 px` idénticos en una sola fila horizontal para *Revisión* y *Reordenamiento*).
   - `capturarAnclaLinea` clava el renglón inicial de `#v1` cuando `.encab` sigue a la vista cerca del inicio (`0 px` de sobresalto arriba) y ancla por rectángulo subpíxel real de línea en el resto del capítulo (`Δ ≤ 0,5 px` en `Lectura ↔ Textual` y `Por versos ↔ Continuo`).
6. **Atlas bíblico de lujo sin recortes + Códice con efecto hoja de libro (`#/mapa`, `vistaMapa`, `libroPaginas`):**
   - Lienzo completo `1080 × 580` (`4:3` en móvil, `width: 100%; max-width: 100%`, `0 px` de corte derecho desde `῾Hrṓmē` hasta `Damméśeq` y el Éufrates) con 14 polígonos costeros e insulares, 8 ríos históricos, 5 cordilleras, gratícula geográfica, rosa astrolabio de 8 puntas (cero cruces/estrellas), escala dinámica en km y estadios romanos, recorrido interactivo etapa por etapa y **Códice de lugares** paginado con giro 3D de hoja de libro (`libroPaginas`).
7. **Armonización general del tamaño del texto (`--t-verso: .98rem`):**
   - Aplicada de forma equilibrada en *Lectura*, *Textual*, *Análisis* (`.av-cab`, `.pal`), *Ficha del verso* (`.fv-es`), *Opciones* (`.op-muestra`), *Búsqueda* (`.rv-tx .vt`) y *Escudriña* (`.jg-vl-t`, `.jg-preg .t`, `.jg-vc-t`, `.jg-fj-v p`, `.jg-gt`).
8. **El Coloso a 60 fps en sitio + estallido diegético acoplado al escenario (`pintarColoso`, `ejecutarGolpe` en `juego.js`):**
   - Suprimida la reconstrucción completa del DOM al atacar (`<canvas>` e `<img>` intactos, `0 ms` de tirón), eliminada la notificación plana `.aviso-flot` sobre la capucha y añadidos el impacto energético diegético `.jg-col-imp` dentro de la escena y la estela de drenaje `.jg-col-hp-trail`.
9. **Ocultación inmediata al pie (`.en-pie`), limpieza de espacios vacíos al final de capítulo, bonos persistentes y salto limpio al capítulo siguiente:**
   - `observarFinVista` (`IntersectionObserver` sobre `footer.pie-a`, `.fin-leido` y `nav.fin-cap`) oculta al instante todos los iconos flotantes inferiores izquierdos al llegar al tramo final; depurados los márgenes verticales al cierre del capítulo; `MED.firma` reiniciada al recrear `.jg-med` para que `+50 %`, `×1,5` y `×2` persistan siempre tras cambiar de vista; `irCapituloInicio` aterriza siempre en `scrollY = 0`; y corregido el botón deshabilitado de capítulo en `.encab` (`<button disabled>`) para cumplir 100 % WCAG AA.
10. **Registro de novedades de los últimos 3 días (`sincronizarNov3d`, `abrirHistorialNovedades` en `juego.js`):**
    - Historial rodante local de 72 horas (`jg:nov3d`) con ventana modal **«Registro de los últimos 3 días»** agrupada por jornadas y formateadores `NOVEDAD` blindados contra campos opcionales ausentes (`0` `undefined` / `NaN`).

### 2. Norma teológico-editorial permanente añadida a la memoria de Neon (Entrada #18)
- **El poder proviene de Dios, nunca es propiedad del creyente:** jamás anteponer posesivos personales de primera o segunda persona delante de «poder» en consejos, descripciones, atributos ni mensajes de interfaz. Se escribe siempre **«subir poder»**, **«el poder»** o **«el poder de Dios obrando en la persona»** (corregidas las 5 apariciones previas en `app.js` y `juego.js`).

### 3. Comprobaciones pasadas (Entrada #18)
- `node --check app.js juego.js sw.js busqueda.js`, balance de llaves CSS (`3263 / 3263`), auditoría editorial y de rendimiento (`0` posesivos ante «poder», `0` palabras prohibidas, `0` `:has()` globales): **CLEAN**.
- Suite Playwright 3× HD (`verificar_pr18.py`, Oscuro y Pergamino, `280 / 390 / 1280 px`) + Deque `axe-core` WCAG 2.1 AA: **`0` violaciones `axe-core` en todas las vistas, `0` errores JS en móvil y escritorio, `0 px` de desborde lateral en `280 / 390 / 1280 px`**, todas las capturas 3× HD inspeccionadas visualmente.
- `python3 wix/sellar.py`: **al día**.


---

## Entrada #19 · PR #19 · Griego koiné histórico del siglo I (motor acústico Klatt), El Coloso inmersivo a pantalla completa + Resonancia de 2–4 marcas, Constelación 3D armilar, Atlas 2× móvil + pantalla completa + Códice iluminado, consejos plegables (15 días) y tope 25 fps sin congelar al desplazarse (2026-11-26)

### 1. Cambios entregados en PR #19
1. **Motor histórico de pronunciación y audio del griego koiné del siglo I (`KOINE_S1`, `pronunciar`, `lineaPron` y `vistaRepasoRaices` en `app.js`):**
   - Implementado sintetizador acústico local 100 % offline en Web Audio API (modelo Klatt de 4 formantes resonantes `F1–F4` + fuente glotal Rosenberg-LF + coarticulación suave + generadores calibrados de fricativas, oclusivas no aspiradas, nasales y vibrante alveolar `/r/` a 27 Hz + caché LRU de 40 `AudioBuffer`).
   - Reconstrucción fiel al consenso académico del griego koiné del siglo I d.H.D. (W. S. Allen *Vox Graeca*, R. Buth *Imperial Koine*, G. Horrocks y F. Gignac): conserva espíritu áspero inicial `/h/` (y `ρ` inicial aspirada `/r̥/`), `η /e̝/` cerrada alta, `υ/οι /y/` anterior redondeada, `αυ/ευ/ηυ → Vβ/Vɸ`, `β /β/`, `φ /ɸ/`, `δ /ð/`, `θ /θ/`, `γ /ɣ,ʝ,ŋ/`, `χ /x,ç/`, sonorización `σ → z` ante `βγδμνρ` (p. ej. `κόσμος [ˈkozmos]`), geminadas reales y acento dinámico con contorno entonacional natural.
   - Integrado con botones **«Escuchar koiné s. I»** y **«0,7×»** e iluminación silábica en vivo en ficha de palabra, página de lema, página de raíz, analizador y `#/raices/repaso`.
2. **El Coloso inmersivo a pantalla completa + Barra de Resonancia táctil de 2–4 marcas (`juego.js`):**
   - Corregido el fallo táctil móvil de la barra de Resonancia: pista elevada a `48 px` con captura instantánea `pointerdown` en pista, caja completa y botón principal (con protección anti-rebote de `115 ms`), secuencia aleatoria de **2 a 4 marcas** (`meta = 2..4`) con gemas de progreso (`◆ ◇ ◇`) que reubican el objetivo tras cada toque y disparan `POST /coloso/accion` de inmediato al completar la última marca.
   - Al entrar en `#/escudrina/coloso` con cargas disponibles (`cargas > 0`), se activa automáticamente la arena inmersiva a pantalla completa (`html.jg-col-inm` / `.jg-col-escena.inm`, `100dvh × 100vw`) enmarcando limpiamente desde la figura del Coloso hasta la 3.ª habilidad (`bottom: 832 px` en `844 px`) con botón discreto **«✕ Salir de arena»**; al gastar la última carga o derrotar al Coloso, espera `1,35 s` el estallido final y se retira automáticamente dejando visible *Enseñanza* y *Mayores aportes*.
3. **Limpieza de `Hoy` vs `Mundo` en Escudriña (`juego.js`):**
   - Retiradas las tarjetas duplicadas de *El Coloso* y *Misión mundial* de la pestaña `Hoy` (quedan exclusivamente en `Mundo`), precargando silenciosamente el estado del Coloso en `Hoy` para iluminar la insignia activa de cargas en la pestaña **`Mundo`** del muelle inferior (`insigniaMundo`).
4. **Consejos replegados por defecto, sin contador total y tope de 2 vistas cada 15 días (`GUIA_HIST`, `guiaSeccion`, `FARO` en `app.js`):**
   - Reemplazados los banners abiertos por `<details class="guia-ctx">` plegados por defecto (`• Consejo · <título>   Leer ▾`) que el lector despliega manualmente solo si desea leerlos.
   - Eliminada la cuenta total `"(" + FARO_TIPS.length + " consejos)"` en el modal del Faro → `"Consejo de BiEx"`.
   - Implementado historial rodante de 15 días (`biex:guiaHist`) que garantiza que nadie vea el mismo consejo más de **2 veces en 15 días**.
5. **Tope de 25 fps en todas las animaciones, sprites cacheados y cero congelamiento al desplazarse (`app.css`, `app.js`, `juego.js`):**
   - Eliminadas todas las reglas `html.desplazando { animation-play-state: paused }` en `app.css` y `juego.js`.
   - Limitados todos los bucles JS/Canvas (`INMERSION_25D`, `motorConstelacion`, `volarVb` del Atlas, `montarAtmosferaColoso`, barra de Resonancia y `animar3D` del Árbol) a **25 fps** (`40 ms`), ralentizando suavemente a `~14 fps` (`72 ms`) durante el desplazamiento sin paralizar jamás las animaciones; añadidos cachés de sprites offscreen para orbes de Constelación y brasas del Coloso.
6. **Coincidencia exacta de líneas en `Por versos ↔ Continuo` y `Lectura ↔ Textual` (`nodosTextoVerso`, `charOffsetDeLinea`, `topDeCharOffset` en `app.js`):**
   - Excluidos `<sup>` y `.vn` al medir renglones del verso y anclada la transición `Por versos ↔ Continuo` por índice exacto de carácter (`charOff`): **`Δ = 0,0–0,41 px`** tanto al inicio como a mitad de capítulo (`LUK 5`).
7. **Pinceladas caligráficas PR #17 restauradas en los 4 botones secundarios de portada (`app.css`):**
   - Recuperados los brochazos planos detallados `--br-a` / `--br-b` de PR #17 para los 4 botones secundarios, conservando el botón primario dorado suave de PR #18, la levitación `heroFlota` y la sombra proyectada centrada.
8. **Constelación 3D profunda real (`motorConstelacion` en `app.js`):**
   - Distribución esférica profunda en 3 ejes (`z` en `-196..+196`, `FOCAL = 460`), 3 anillos armilares 3D con arcos frontales luminosos y traseros punteados, 96 estrellas en esfera 3D, **órbita 3D 360° con un dedo** + auto-órbita suave a 25 fps, calibración fija de **Giroscopio** sin auto-borrado (`INMERSION_25D.recalibrar()`) y **pantalla completa (`⛶`)**.
9. **Atlas Bíblico 2× más legible en móvil, pantalla completa opaca y Códice de lugares iluminado (`vistaMapa` en `app.js` y `app.css`):**
   - Etiquetas calculadas en píxeles CSS reales (`11,4 px` móvil / `12,4 px` escritorio — **3,2× más legibles en teléfono**) con auto-volteo en bordes y reserva de controles/brújula para cero cortes ni solapes; retirada la frase `"sin deformar la página."` del consejo del mapa.
   - Nuevo modo **pantalla completa (`⛶`)** 100 % opaco con encuadre vertical centrado y ficha rápida flotante (`.mp-fs-ficha`) de citas directas.
   - Rediseño total del **Códice de lugares** (`.mp-cod-caja` / `.mp-cod-libro`) como folio encuadernado de museo con lomo, cantos apilados, esquinas doradas, encabezados en numerales romanos (`FOLIO I · VI`) e índice limpio sin cajas pesadas.
10. **Cierre de armonización tipográfica global (`app.css` y `juego.js`):**
    - Equilibrados los rótulos pequeños restantes en tablas morfológicas (`.tf th`, `.tf-f small`), chips de formación/léxico (`.lx-chip small`, `.chip`), pronunciación (`.fp-pron`), palabras del analizador (`.pal .mo`) y estadísticas/habilidades del Coloso.

### 2. Comprobaciones pasadas (Entrada #19)
- `node --check app.js juego.js`, llaves balanceadas en `app.css` (`3328 / 3328`), `0` reglas `html.desplazando.*paused`, auditoría editorial (`0` palabras prohibidas, `0` posesivos ante «poder»): **CLEAN**.
- Suite Playwright 3× HD (`verificar_pr19.py`, Oscuro y Pergamino, `280 / 390 / 1280 px`) + Deque `axe-core` WCAG 2.1 AA: **`0` fallos funcionales, `0` `pageerror`, `0` violaciones `axe-core` en todas las vistas, `0 px` de desborde lateral en `280 / 390 / 1280 px`**, todas las capturas 3× HD y 2× HD inspeccionadas visualmente.
- `python3 wix/sellar.py`: **al día**.


---

## Entrada #20 · PR #20 · Coloso Ultra HD 1024×1024, Fruto holográfico 3× giroscopio, Koiné s. I coarticulado 2×, Atlas opaco y ficha completa, perfil público en 1 pantalla, presencia lectora viva y armonía total (2026-11-27)

### 0. Régimen operativo acordado con BiEx (Opción B)
- BiEx aprobó la **Opción B**: fusión directa (`squash merge`) tras verificación completa en navegador real a 3× HD + Deque `axe-core` WCAG 2.1 AA + CI en verde (`revision` + `Cloudflare Pages`), dejando **registro técnico exhaustivo de cada cambio en las tres bitácoras** (`BITACORA_NEON.md`, `/home/antigravity/upload/bitacora_neon.md` y artefacto `APRENDIZAJES_NEON.md`) para la revisión eventual de Opus.

### 1. Cambios entregados en PR #20 (16 mejoras verificadas)
1. **El Coloso Ultra HD `1024 × 1024` + capa holográfica + 5 habilidades en `100dvh` + ataque exclusivo en inmersivo (`img/coloso-velo.webp`, `juego.js`):**
   - Regenerada `img/coloso-velo.webp` (`1024 × 1024` WebP, `91 KB`, sin cruces, estrellas de 5 puntas ni rayos solares) con detalle de tela pétrea, capucha velada y grietas doradas incandescentes en el pecho (`object-position: 50% 28%`).
   - Añadida capa `.jg-col-holo` con paralaje 2.5D y dos sigilos geométricos adicionales en `colosoSigilo(id, idx)` para las habilidades 4.ª y 5.ª.
   - Rejilla compacta automática `.jg-col-habs.mas-de-3` en modo inmersivo (`100dvh`): enmarca limpiamente hasta **5 habilidades** en pantalla móvil (`bottom: 832 px` en `844 px`) sin desbordar ni requerir scroll.
   - Regla estricta de ataque: pulsar cualquier botón de ataque **fuera del modo inmersivo** activa de inmediato el modo inmersivo **sin ejecutar el ataque ni abrir Resonancia** (verificado `POSTs: 0`, `inmNow: True`, `resHidden: True`).
2. **Faro centrado exactamente en el eje del Escudo (`app.css`):**
   - Ajustado `.faro-btn` a `left: calc(20.5px + env(safe-area-inset-left, 0px))` sin contar el tamaño del globo numérico `.faro-cnt`, logrando alineación matemática exacta con el centro del Escudo `.jg-med` (`faroCx = 35 px`, `medCx = 35 px`, `diff = 0 px`).
3. **Píldora discreta de presencia lectora en vivo + modal comunitario (`app.css`, `juego.js`):**
   - Creada `.jg-pres-pill` en el riel inferior de lectura (`right: 54px; bottom: 20px;`, `8 px` despejada de `.saltos-rap` y `26 px` despejada de «Leído», atenuada con `.en-pie`).
   - Oculta por completo cuando no hay otros lectores ni salas abiertas (`hidden: True` si solo está el propio lector o `0` personas); al tocarla abre `abrirModalPresenciaLectura()` (`.jg-pres-mod`) listando lectores en vivo (con salto directo a su capítulo y perfil) y salas abiertas.
4. **Rescate global de toques durante desplazamiento por inercia + pausa universal de animaciones fuera de pantalla (`app.js`, `app.css`):**
   - `SEL_TAP` en `pointerdown`/`pointermove`/`pointerup` dispara `.click()` a `45 ms` cuando un toque limpio (`< 10 px`, `< 340 ms`) durante `html.desplazando` es absorbido por el navegador móvil al frenar el desplazamiento.
   - `IntersectionObserver` universal (`IO_FUERA`, `window.BiExPausaFuera` + `MutationObserver` con throttle) congela con `.anim-fuera { animation-play-state: paused !important }` cualquier elemento animado fuera del área visible (`5` elementos pausados al bajar en portada).
5. **Gesto `Atrás` blindado desde Biblioteca y limpieza total de pantallas completas (`app.js`, `juego.js`):**
   - `irDesdeModal`, `popstate`, `enrutar()` y `hashchange` aseguran regreso limpio desde Biblioteca hacia las 4 herramientas (`Sinopsis`, `Constelación`, `Atlas bíblico`, `Repaso de raíces`) al capítulo previo, retirando siempre `mp-fs-on`, `cn-fs-on`, `jg-col-inm` y deteniendo audio `KOINE_S1` activo.
6. **Audio histórico Koiné siglo I coarticulado continuo + 2× con pausa de `1,5 s` + iluminación de palabra completa + Formas/Raíz (`app.js`, `app.css`):**
   - Eliminados los cortes a cero entre fonemas en `KOINE_S1`: ahora las transiciones vocal↔consonante fluyen por coarticulación continua (`silentRuns: 0` en `ἀγάπη`, `afi: aˈɣape̝`), reproduciendo automáticamente **2 veces con pausa exacta de `1500 ms`** (`repetir: 2`, `pausaMs: 1500`) e iluminando la palabra completa (`.pr-sil.sonando`, `.fp-g.sonando`, `.rr-gr.sonando`).
   - Añadido `botonAudioMini()` y cajón plegable `cajonAudioFormas()` en `vistaPalabra`, `bloqueRaiz`, `tablaFormas` (`.tf-f.tf-aud`) y `vistaRepasoRaices`.
7. **Atlas Bíblico: hojas 3D opacas en Códice, 0 px de salto al tocar lugar, botón «Ver en el mapa» y ficha completa en pantalla completa (`app.js`, `app.css`):**
   - Base opaca explícita (`background-color: var(--hoja)` / `#fcf8ee`, `rgb(14, 14, 16)`) en `.mp-cod-libro .lp-hoja` para doblado 3D real sin transparencias.
   - Tocar una fila del Códice de lugares mantiene la pantalla quieta (`window.scrollBy({ top: dy, behavior: "instant" })`, verificado `diff = 0,25 px`) y ofrece el botón explícito **«Ver en el mapa»** (`.mp-cod-pie-acc`) en el pie de ficha.
   - En pantalla completa (`⛶`), `.mp-fs-ficha` muestra la ficha completa desplazable con botón **«Ocultar»** (`.mp-fs-oc`) que la repliega en la píldora **«Ver ficha · …»** (`.mp-fs-pill`).
8. **Escudriña `Hoy`, `Mundo`, `Tesoro` y navegación de insignias (`juego.js`):**
   - Retirado `tarjetaAjedrez(true)` de `Hoy` (Ajedrez bíblico queda exclusivamente en `Mundo`).
   - Rejilla simétrica **2 × 2 en móvil / 4 en fila en escritorio (`≥ 640 px`)** en `Tus reservas` (`.jg-cifras.cuatro`).
   - **Misión mundial:** separación con salto de línea (`.jg-mm-bl`, `margin-top: 12px`) entre personas/tiempo restante, fecha/hora local y condiciones de premio.
   - **Botones armonizados y centrados:** `.jg-acciones { justify-content: center }`, `.jg-acciones .btn { flex: 0 1 auto }` y tamaño equilibrado `btn chico` en `Ver mi liga` (`34 px`), `Participar leyendo ahora` (`34 px`), `Ver mi compañía`, `Clasificación de compañías`, `Ver mi árbol` y `Cuenta, emblema y preferencias`.
   - **Indicador visual de insignia pendiente:** `FOCO_INSIG`, `insigniaMundo`, `insigniaSalas` y `resaltarZona` (incluyendo `.jg .jg-coloso`) adjuntan la píldora discreta `.jg-aviso-foco` directamente en la tarjeta origen (`2 misiones pendientes hoy` en *Misiones de hoy*, `5 cargas listas contra El Coloso` en *El Coloso de la Tradición*, salas abiertas en *Juntos* o *Asegura tu cuenta* en *Más*).
9. **Fruto del espíritu holográfico + profundidad + giroscopio 3× y Cosecha 2.5D (`juego.js`, `app.js`):**
   - Habilitado `INMERSION_25D.escenaCss()` también para `#/escudrina/arbol` y `#/escudrina/tesoro` (mantiene **0 % CPU** en capítulos de lectura).
   - Granada viva holográfica 3D con prisma iridiscente, sombra flotante y respuesta **3× al giroscopio (`±16,5° Y / ±14,5° X`)** tanto en la copa del Árbol (`.ap-gr-b` con `<svg>` vivo + `.ap-gr-som` + `.ap-gr-holo`, retirado el `<g class="ap-granada">` estático para evitar doble trazado) como en la tarjeta inferior (`.fr-gr` + `.fr-gr-som` + `.fr-holo`), verificado con `matrix3d` activo.
   - Pedestal 2.5D con reflejo biselado y profundidad en `.co-medidor` tras recoger la cosecha (conservando el pivote exacto `50% 85,7%` de `.co-aguja`), y destello perlado sutil en *Progreso por libro* (`.lk-lib-a::after`).
10. **Fila completa clicable en listas de jugadores + Perfil público compacto en 1 sola pantalla móvil (`juego.js`):**
    - Delegación global en `.jg-fila-jug` (respetando fotos `.emb-foto`, enlaces y otros botones) que abre el perfil público rediseñado (`.jg-jp`): cabecera horizontal `.jg-jp-top`, rejilla compacta `3 × 2` de métricas, `Gesto de compañía` en rejilla simétrica `2 × 2` móvil (`4` columnas en `≥ 440 px`) y pie comparativo, todo dentro de **1 sola pantalla móvil sin desplazamiento** (`scrollH = clientH = 781 px`, `jpH = 626 px`).
11. **Ajuste de espaciado vertical de versos y armonización tipográfica global (`app.css`, `juego.js`):**
    - Espaciado vertical afinado en `.vl` y `.continuo` (`lh = 24,01 px`, `vlPadB = 24,10 px`) y elevación de ~48 micro-etiquetas `.54rem–.68rem` a `.72rem–.74rem` en lector y Escudriña (respetando créditos legales).

### 2. Comprobaciones pasadas (Entrada #20)
- `node --check app.js juego.js`, llaves balanceadas (`app.css`: `3383 / 3383`; `juego.js`: `2310 / 2310`), `0` nuevas reglas `:has()`, `0` reglas `desplazando.*paused`, `img/coloso-velo.webp` `1024 × 1024` WebP, auditoría editorial (`0` palabras prohibidas, `0` posesivos ante «poder»): **CLEAN**.
- Suite Playwright 3× HD (`verificar_pr20.py`, Oscuro y Pergamino, `280 / 390 / 1280 px`) + Deque `axe-core` WCAG 2.1 AA: **`0` errores JS, `0` fallos funcionales, `0` violaciones `axe-core` en todas las vistas, `0 px` de desborde en `280 / 390 / 1280 px`**, y todas las capturas 3× HD / 2× HD inspeccionadas visualmente.
- `python3 wix/sellar.py`: **al día**.

### 3. Hoja de ruta aprobada por BiEx (PRs #21+) y notas pendientes
- **6 ideas de alto impacto aprobadas para hoja de ruta:**
  1. **Lupa Interlineal de Manuscritos:** comparación en paralelo de testigos antiguos (`𝔓⁴⁶/𝔓⁶⁶/𝔓⁷⁵, א, B, A`) con deslizador cronológico de siglos.
  2. **Hilos de Oro:** recorridos cronológicos curados por raíz griega a lo largo de la Nueva Voluntad.
  3. **Banco de Voz Humana / Neural Real en caché:** grabaciones o modelos neurales calibrados al koiné s. I (Allen/Buth/Horrocks/Gignac) para las 300–500 palabras más frecuentes en Opus/MP3 ligero (`audio/koine/` o R2 + caché SW), manteniendo `KOINE_S1` local como respaldo instantáneo offline para las ~5.400 palabras.
  4. **Modo Estudio en Pantalla Dividida** para tableta/escritorio (`≥ 1080 px`).
  5. **Diario de Estudio Exportable a PDF / Libro Imprimible** (notas, marcados, glosas y citas).
  6. **Constelación 3D «Viaje por la Red»:** camino dorado más corto entre dos conceptos léxicos.
- **Nota sobre DigiVatLib (`Vat. gr. 1209`) e INTF Münster (`app.js:3999–4007`):** actualmente operan como enlaces externos compactos en dos renglones introducidos por Opus (`commit 128724c`, 13-nov-2026); ni en `peticiones-pagina-web-biex.md` ni en el historial git existe un diseño aparte de carga/visor embebido (y ambas instituciones restringen `iframe` por `X-Frame-Options`/`CSP`). Pendiente confirmación de BiEx sobre el diseño específico de tarjeta/carga deseado para implementarlo en PR #21.
- **Pausados / Diferidos:** `B8` y `A3` siguen en pausa; la revisión de definiciones Strong en español se tratará en conversación dedicada.
