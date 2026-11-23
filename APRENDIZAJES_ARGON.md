# Bitácora y Aprendizajes Técnicos — Argon

> **Registro de relevo de agentes (23 de noviembre de 2026 d.H.D.)**
> - Hasta la conversación `4425542d-57a3-4708-91ec-0526a8c69982` (inclusive PR #3), el análisis e implementación estuvieron a cargo de **Neon** (precedido por **Opus**).
> - Desde la conversación `355cba4c-949f-471e-9277-614d10c712f8` (PR #4, PR #5 y PR #6 en adelante), toma el relevo **Argon**.
> - Este documento propio de **Argon** queda en la raíz del repositorio en GitHub para que **Opus**, **Neon** y futuros agentes consulten los hitos resueltos sin confusiones ni solapamientos.

---

## 1. Eliminación de sobresaltos al ir al Análisis de una palabra y al abrir «Nota»

### Causa raíz
1. **En el Análisis de palabra (`vistaAnalisis` / `fichaPalabra`)**: cuando se navegaba a una palabra o se abría su ficha, la carga asíncrona de `analisis(libro)`, `tablas()`, `refsDe(libro)` y `msCap(libro, cap)` insertaba bloques debajo o encima del foco después del primer pintado, provocando reflujos encadenados.
2. **Al abrir «Nota» desde el marcador rápido (`.sr-mk`)**: `abrirVerso(..., enfocarNota = true)` llamaba a `inp.focus()` sin `preventScroll: true` mientras la ventana modal ejecutaba su animación de entrada y mientras las secciones asíncronas de referencias y manuscritos se inyectaban encima del `<textarea>`. El navegador recalculaba la posición del cursor varias veces seguidas.

### Solución aplicada
- **Precarga anticipada**: al desplegar el panel `.sr-mk-pan`, se disparan en segundo plano `analisis(esc.libro)`, `tablas()`, `refsDe(esc.libro)`, `testigos()` y `msCap(esc.libro, esc.cap)`.
- **Enfoque estabilizado en un único fotograma**: en `vistaVerso`, cuando `enfocarNota` está activo, la ventana modal se posiciona de inmediato al fondo del contenedor (`.m-cuerpo`) en el primer fotograma y aplica `inp.focus({ preventScroll: true })`, suprimiendo la animación de entrada competitiva y cualquier salto posterior cuando terminan las cargas secundarias.

---

## 2. Solución al bug de doble toque en el marcador rápido (`.sr-mk` y `.sr-mk-pan`)

### Causa raíz
- Al tocar `.sr-mk` (`mkBtn`) para abrir el panel `.sr-mk-pan`, `mkBtn` quedaba con el foco activo (`document.activeElement === mkBtn`).
- Al tocar a continuación cualquier botón dentro de `.sr-mk-pan` (un círculo de color `.vq-dot`, `Nota`, `Copiar` o las flechas de verso), el evento `pointerdown` desenfocaba `mkBtn` **antes** de que se produjera `pointerup` / `click`.
- El contenedor `.saltos-rap` escuchaba `caja.addEventListener("focusout", mostrar)`, y `mostrar()` invocaba `actualizarBtnMk()` › `pintarMkPan()` › `mkPan.replaceChildren(...)`.
- Al destruirse y recrearse los nodos DOM de `.sr-mk-pan` en mitad del gesto (entre `pointerdown` y `pointerup`), el navegador descartaba el evento `click` del primer toque. En el segundo toque, como `mkBtn` ya había perdido el foco, `focusout` no se disparaba y el botón recién obedecía.
- Adicionalmente, en pantallas táctiles durante la deceleración de un desplazamiento por inercia, Android Chrome podía suprimir el `click` sintetizado sobre `.sr-mk`.

### Solución aplicada (`app.js` › `saltosRapidos`)
1. `mkPan.addEventListener("pointerdown", (e) => { if (e.target.closest("button")) e.preventDefault(); })` evita que tocar un botón interno desenfoque `mkBtn`.
2. Guardas `mkVPintado` y `mkColPintado`: `actualizarBtnMk()` solo llama a `pintarMkPan()` cuando realmente cambia el número de verso activo o su color de marca.
3. `mouseleave` y `focusout` en `.saltos-rap` pasaron a usar `alSalirCaja(e)`, que verifica `!caja.contains(e.relatedTarget)` y únicamente programa el temporizador de ocultamiento sin reconstruir el DOM.
4. En `mkBtn`, un detector de toque limpio (`pointerdown` + `pointerup` con desplazamiento `< 14 px` y guarda temporal `ultToqueMk` de `420 ms`) garantiza respuesta inmediata al primer toque incluso al detener un scroll inercial.

---

## 3. Sincronización exacta del marcador rápido con el brillo luminoso de Escudriña

### Causa raíz
- El marcador rápido `.sr-mk` calculaba el verso por proximidad geométrica al tercio superior de la pantalla, mientras que el brillo luminoso de Escudriña (`ponerLB` en `juego.js`) determina el verso activo con sus propias reglas de visibilidad (`versoFranja`, `listoArriba` y final de página).

### Solución aplicada
- `juego.js` expone `BiExJuego.versoActivo(c, cap)` y emite el evento `CustomEvent("biex:verso-activo", { detail: { c, cap, v } })` cada vez que `ponerLB` cambia o limpia el verso iluminado.
- `versoIluminado()` en `app.js` consulta primero `BiExJuego.versoActivo(esc.libro, esc.cap)` y escucha `biex:verso-activo`, manteniendo `.sr-mk` 100 % sincronizado con el verso iluminado.

---

## 4. Estrategia de caché de fondos con halos e ilustraciones vectoriales

### Qué conviene cachear y cómo
1. **Halos del fondo vivo (`.fondo-vivo`)**:
   - Se promueven a capas fijas de GPU con `contain: strict`, `backface-visibility: hidden` y `transform: translate3d(...)` puro (sin `scale()` variable en los fotogramas clave), evitando que el navegador re-rasterice la textura del gradiente radial en cada fotograma.
2. **Ilustraciones vectoriales complejas de Escudriña (`juego.js`)**:
   - **`CACHE_ARBOL`**: conserva en memoria el nodo `.ap-lienzo` del Árbol de la Vida firmado por `[inv, nivel, vt, xpNivel, xpSig, emb, foto, ef, fr, frutos]`. Al cambiar entre pestañas (*Hoy* ↔ *Árbol* ↔ *Misiones* ↔ *Tesoro*), el árbol se monta al instante desde la caché sin recalcular ramas ni raíces.
   - **`CACHE_FIG`**: conserva el nodo `.ser-in` (ser interior y sus 6 piezas de armadura + manto + aura + sello) firmado por `[eq, acc]`, reanudando su respiración (`vivirSer`) sin recrear filtros ni máscaras SVG.
   - **`CACHE_GRANADA`**: memoriza hasta 24 estados de `granadaSVG(fr, R, sel)` con identificadores deterministas (`gr66_`, `gr80_`).
   - **`CACHE_CESTA`**: memoriza hasta 12 niveles de llenado de `cestaSVG(f)` cuantizados en pasos de `0,5 %` (`co_`).

---

## 5. Simetría del HUD inferior en la lectura de capítulos

- **`.jg-bonos` (`+50 %`, `×2`)**: en lugar de desplegarse a la derecha del escudo `.jg-med` (donde invadían el centro y chocaban con la píldora de `Sala`), se apilan verticalmente centrados **encima de `.jg-med`** (`left: 50%; bottom: calc(100% + 5px); transform: translateX(-50%)`) y se desvanecen brevemente durante `.pulso` o `.sube`.
- **`.sr-min` (`≈ X min`)**: se ubica encima de `.saltos-rap` en el borde derecho (`right: 0; bottom: calc(100% + 6px)`), dejando libre el canal central para `Perícopa leída` y `Leído`.
- **`.adelante` (`Adelante ›`)**: cuando `.jg-med` está presente (`html.jg-con-med`), sube a `bottom: calc(122px + env(safe-area-inset-bottom, 0px))` (`134px` con `.jg-con-lb`), quedando por encima de `.jg-bonos` y de `Perícopa leída`.
- **`ponerLB`**: calcula `alza` (la altura de `.jg-sala-p`) **antes** de posicionar `LB.pb` (`Perícopa leída`), garantizando que ambas píldoras centrales compartan exactamente el mismo desplazamiento vertical desde el primer fotograma.

---

## 6. Calendario hebreo y hora en `Yᵉrūshāláyim [Jerusalén]`

- `fechaHoraJerusalen()` en `app.js` emplea `Intl.DateTimeFormat("en-u-ca-hebrew", { timeZone: "Asia/Jerusalem", day: "numeric", month: "long", year: "numeric" }).formatToParts(...)` junto con el mapa canónico `MESES_HEB` (`Tishréi`, `Jeshván`, `Kislév`, `Tevét`, `Shevát`, `Adár`, `Adár I`, `Adár II`, `Nisán`, `Iyár`, `Siván`, `Tamúz`, `Av`, `Elúl`) y el reloj de 24 horas en `Asia/Jerusalem`, en color neutro heredado del texto secundario (`color: inherit` / `var(--tenue)`).

---

## 7. Síntesis comparativa y dseológica automática en el buscador (`busqueda.js`)

- `BQ.comparar(R, q, ctx)` opera directamente en el cliente (sin pasos manuales ni descargas extra) aprovechando el índice invertido `datos/busqueda/indice.json`, `conceptos.json`, `tablas.json` y `datos/estudios.json`.
- Reconoce consultas comparativas entre autores/corpus (*«compara Pablo y Jacobo sobre la fe»*, *«qué enseña Juan sobre el discurso»*) y contrastes conceptuales (*«diferencia entre alma y espíritu»*), presentando en `.res-comp` los estudios de BiEx relacionados, los lemas griegos con sus frecuencias y glosas de BiEx por cada polo, los versos representativos y la intersección de versos donde ambos términos convergen.
