# Guía de Continuación de Neon · BiEx – Biblia Exacta (`biex-lector`)

> **Propósito de este documento:** Permitir que un chat completamente nuevo de **Neon** (sin historial previo) retome el trabajo en `cristianteologo/biex-lector` con **100 % de contexto operativo, reglas permanentes, decisiones acordadas con BiEx y Opus, lecciones aprendidas y hoja de ruta viva** en menos de 60 segundos.

---

## 1. Identidad, arquitectura y repositorio

- **Proyecto:** **BiEx – Biblia Exacta** (`https://bibliaexacta.pages.dev`, también incrustado en `https://bibliaexacta.wixsite.com/biex` mediante `iframe` con `?incrustado=1`).
- **Repositorio local:** `/home/antigravity/cristianteologo/biex-lector` (rama principal `main`, publicada automáticamente en Cloudflare Pages).
- **Colaboradores:**
  - **BiEx** (`cristianteologo`): creador, teólogo, traductor y director de producto y estética.
  - **Opus**: arquitecto de backend (`Worker biex-juego`, `functions/`, datos, infraestructura) y revisor eventual.
  - **Neon** (tú): desarrollo frontend del lector y de *Escudriña*, experiencia visual, accesibilidad, rendimiento y verificación 3× HD.
- **Régimen de fusión aprobado por BiEx (Opción B, 27-nov-2026):**
  - Trabajar siempre en rama `neon/<tema>`, abrir PR en GitHub, verificar en navegador real a **3× HD** (oscuro + Pergamino, móvil + escritorio + `?incrustado=1` Wix) y con **Deque `axe-core` WCAG 2.1 AA**, esperar **CI en verde** (`revision` + `Cloudflare Pages`) y fusionar con `gh pr merge <N> --squash --delete-branch --admin`.
  - **Obligatorio en cada PR:** dejar registro técnico completo y honesto en `BITACORA_NEON.md` (raíz del repo) y en la bitácora local del entorno para la revisión eventual de Opus.

### Archivos que SÍ toca Neon vs. rutas intocables

| Permitido (Neon) | Intocable (Opus / generación automática) |
|---|---|
| `app.js`, `app.css`, `juego.js` | `datos/**` (**EXCEPTO** `datos/archivos.json`, actualizado solo vía `python3 wix/sellar.py`) |
| `img/*` (arte HD optimizado WebP cuando se solicite) | `wix/**`, `sw.js`, `_headers`, `functions/**`, `.github/**` |
| `BITACORA_NEON.md`, `CONTINUACION_NEON.md` | `index.html` (solo sellos automáticos vía `python3 wix/sellar.py`, salvo autorización explícita) |

### Comando obligatorio antes de cada commit

```bash
node --check app.js && node --check juego.js
python3 wix/sellar.py
git status --short
```

---

## 2. Reglas editoriales, teológicas y visuales (NO NEGOCIABLES)

### 2.1 Precisión léxica y morfológica (cotejar siempre en `datos/libros/`)
1. **Idioma:** siempre español natural y cuidado.
2. **«verso» / «versos»** — **NUNCA** «versículo» ni «versículos».
3. **«Nueva Voluntad»** — nunca «Nuevo Testamento» en textos de la interfaz.
4. **Fechas históricas:** `a.H.D.` y `d.H.D.` (nunca `a.C.`/`d.C.`).
5. **«canto [bloque]» / «Cantos [Bloques]»** — **NUNCA** usar la palabra «piedra» en textos visibles al lector (aunque existan identificadores internos heredados como `.jg-piedras` o `piedras` en JSON del servidor).
6. **«declarante»** en vez de «profeta» cuando el texto de BiEx use «declarante».
7. **«originario» / «originador» / «texto base»** — **NUNCA** «original» para manuscritos ni «Idioma original».
8. **NUNCA anteponer posesivos a «poder»** (ni «tu poder», ni «mi poder», ni «su poder»). Usar «Poder», «en el ser interior» o «el poder» (cf. `2 Κοrίndsιοι [2 Corintios] 4:7`).
9. **CERO «Maestro» / «Gran Maestro»** en títulos, rangos, sendas o interfaz (cf. `Mattáy [Mateo] 23:8-10`). Usar «Guía», «Estudioso», «Escudriñador», «Senda de…».
10. **NUNCA «sorteo»** (usar «hallazgo», «providencia», «encuentro» o «don»).
11. **Regla permanente de mayúsculas en corchetes (PR #21):** cuando una palabra o título lleva aclaración entre corchetes y la primera comienza con mayúscula, la palabra entre corchetes **también comienza con mayúscula**:
    - Correcto: `Cantos [Bloques]`, `Ἴαspις [Jaspe]`, `Rescriptus [Reescrito]`, `Ἐfέsιοι [Efesios]`.
    - Incorrecto: `Cantos [bloques]`, `Ἴαspις [jaspe]`, `Rescriptus [reescrito]`.
12. **Iconografía limpia:** **CERO cruces, CERO estrellas de 5 puntas, CERO rayos solares / aureolas paganas** en iconos, SVG, ilustraciones o partículas. Preferir geometría sobria de códice, sellos octogonales/circulares, filigrana dorada, hojas de olivo/lauro y marcos minimalistas.
13. **Consejos (`FARO_TIPS` / `GUIA_HIST`):** no anunciar la cantidad total de consejos; cada lector no debe ver el mismo consejo más de 2 veces en 15 días; consejos plegables manualmente.

### 2.2 Estándar estético, holografía, rareza y rendimiento
1. **Regla permanente de impacto escalado por rareza (PR #21):** las animaciones y efectos de descubrimiento deben escalar selectivamente con la rareza del hallazgo. Un elemento excepcional como el **Lauro Trenzado Incorruptible** exige celebración épica multicapa (ondas concéntricas, doble corona de filigrana giratoria, acorde armónico exclusivo `sonar("lauro")` y doble ráfaga de partículas), reservada únicamente a elementos raros.
2. **Holografía y profundidad 3D nítidas (NUNCA velo lechoso):**
   - Usar `mix-blend-mode: color-dodge` con reflejos estrechos prismáticos (`transparent` en los extremos) + halo iridiscente **exterior** en `::after`, en lugar de capas `mix-blend-mode: screen` con blanco opaco que blanquean o apagan el arte oscuro (como ocurrió en PR #20 sobre las semillas rubí de la granada).
   - Aplicar a **Fruto del espíritu** (Árbol + tarjeta inferior, sensibilidad 3× giroscopio), **Cantos [Bloques]** (vista general y detalle, conservando `jg-flota`), **Lauro Trenzado** (botón y detalle) y **El Coloso** (con capas atmosféricas despejadas en el centro del pecho para preservar resolución Ultra HD `1024 × 1024`).
3. **Rendimiento 60 fps y 0 % CPU en reposo:**
   - Animar solo `transform` y `opacity`.
   - **NUNCA** pausar animaciones durante el scroll con `html.desplazando * { animation-play-state: paused }` (causaba tirones); usar `IO_FUERA` (`IntersectionObserver` + `.anim-fuera`) para pausar elementos **fuera del área visible**.
   - Mantener `INMERSION_25D` apagado (`0 % CPU`) en capítulos de lectura; activo únicamente en portada, Constelación, Árbol, Tesoro y Coloso.
   - Respetar siempre `prefers-reduced-motion` y el ajuste `data-mov="no"` («Sin animaciones»).

---

## 3. Protocolo obligatorio de verificación (y autopsia honesta de PR #20)

En PR #20 pasaron varios detalles visuales/interactivos al teléfono real de BiEx porque la verificación de escritorio/móvil simulado no cubrió estos casos exactos. **Quedan convertidos en guardas permanentes:**

1. **Probar SIEMPRE tanto modo independiente (`index.html`) como modo incrustado Wix (`index.html?incrustado=1`):**
   - En `iframe` de Wix, `history.state` puede perderse o desincronizarse y el botón `Atrás` del móvil disparaba `popstate` + `hashchange` con retraso. En PR #21 se blindó con `M.fondo` (captura de scroll antes de `showModal()` y guarda `modal.open` en `anotarPos()`), `ORIGEN_MODAL`, `RP.guardar = false` durante `replaceState`, `A.intentarRestaurar()` invocado desde `vistaJuego()` y `juego.js marco()`, limpieza `S.marcoK = null` al salir de Escudriña, estado limpio `{}` para generar una clave `bx` nueva y deduplicación de `hashchange` (`ultHrefEnrutado`, 260 ms).
2. **Probar SIEMPRE con el modal real de notificaciones/atributos abierto (`irCitaModal` / `irDesdeModal`):**
   - Nunca cerrar un modal con `A.cerrarModal()` **antes** de navegar a una cita desde un enlace `<a href="#/...">`: `cerrarModal()` usa `history.back()`, lo que cancela la navegación del enlace. Usar siempre `A.irDesdeModal(href)` (o `irCitaModal(href)` en `juego.js`).
3. **NUNCA combinar `window.scrollTo(..., { behavior: "smooth" })` con un `window.scrollTo(..., { behavior: "instant" })` posterior a los 300–400 ms:**
   - En Chromium/Android, el compositor suma el delta restante del `smooth` sobre el `instant`, lanzando el scroll +1.200 px más allá del objetivo. En saltos entre rutas desde Faro (`FARO.enfocar`), usar aterrizaje `instant` exacto y un único reajuste `instant` si el bloque desplazó `> 10 px` (cancelado si el usuario toca la pantalla).
4. **Probar especificidad CSS de animaciones 3D en cuadros intermedios (mid-frame):**
   - En PR #20, `.mp-cod-libro .lp-hoja { position: relative }` tenía mayor especificidad que `.lp-hoja.lp-giro { position: absolute }`, anulando el giro 3D del Atlas. Ahora se verifica capturando el frame exacto a `+200 ms` tras pulsar «Página siguiente».
5. **Probar SIEMPRE teléfonos Android altos (`412 × 915 @ 3×`) además de `390 × 844 @ 3×`, `280 × 653` y `1280 × 800`:**
   - Garantiza que modales de 1 pantalla como el Perfil público (`.m-cuerpo:has(.jg-jp)`) llenen dinámicamente el alto real sin franja negra vacía abajo ni scroll accidental.
6. **Inspeccionar visualmente TODAS las capturas 3× HD con `view_file`** (oscuro y Pergamino) y exigir **`0` errores JS, `0` respuestas HTTP 404, `0` violaciones `axe-core` WCAG 2.1 AA y `0 px` de desborde lateral en `280 / 390 / 412 / 1280 px`**.

---

## 4. Estado actual tras PR #21 (27-nov-2026)

PR #21 dejó resueltos y verificados a 3× HD:
- 4 pinceladas diagonales orgánicas distintas (`--br-1`..`--br-4`, sin espejado `scaleX(-1)`, anchura más contenida) en los botones 2–5 de portada.
- Icono rediseñado de **Modo Contemplar** (`ICO.contemplar`: marco de lectura serena, cero ojo; `ICO.ojo` conservado para «Ver significado y familia»).
- **Faro** completamente despejado de `.adelante.vis` (`0 px` solape), opciones clicables en toda la fila (`.faro-it-btn`) y centrado simétrico exacto en pantalla (`FARO.enfocar`).
- **Gesto Atrás blindado** (16/16 transiciones Biblioteca → 4 herramientas → Atrás en modo independiente y `?incrustado=1` Wix) + **todos los enlaces de citas en modales reparados** (`irCitaModal` en Atributos, Novedades, Ventana de Poder, Cantos, Lauro, Presencia, Perfil y Salas).
- **Atlas Bíblico**: doblado 3D de hoja restaurado y verificado en cuadro intermedio (`position: absolute; z-index: 4; rotateY(...)`).
- **Tu Avance**: margen izquierdo ampliado (`54 px` / `48 px`) para cifras de 5 dígitos (`24.980`, `12.490`) dentro del borde.
- **Progreso por libro plegado**: destello perlado reactivo en `.lk-libs > summary::after`.
- **Fruto del espíritu**: holografía `color-dodge` cristalina sin velo lechoso (semillas rubí nítidas a 3×).
- **El Coloso**: nitidez Ultra HD real (sin niebla central sobre el pecho), holografía visible en `z-index: 3` y aura viva de Brecha (`.jg-col-brecha-fx.b-muro / b-velo / b-grieta`).
- **Hallazgos**: los 12 **Cantos [Bloques]** (vista general + modal) y el **Lauro Trenzado** (botón + modal) con holografía 3D, profundidad y flotación `jg-flota`, más celebración épica multicapa `.jg-fan.epico` y acorde `sonar("lauro")`.
- **Última conexión diaria (solo día y fecha, NUNCA horas/minutos):** `ultimaConexionTexto()` en Perfil público y listas, con caché diario `jg:ultDia` actualizado una vez al día.
- **Koiné siglo I**: pausa 2× afinada a **`1000 ms`** (`-0,5 s`), fricativas suavizadas y cargador híbrido **cero-404** listo para `datos/koine-audio.json` (`KOINE_S1.activarNeural()` cuando `datos/archivos.json` lo incluya).
- **Consejos**: retirado «sin cambiar el tamaño de la página.» de *Las ramas de tu árbol*.
- **Perfil público dinámico**: aprovecha el alto de pantallas altas (`412 × 915`) sin hueco negro inferior ni scroll.

### Nota de 1 línea para Opus (backend `biex-juego`)
Para que la fecha de última conexión diaria (`ultDia`) aparezca también para lectores que no han sido vistos aún en la sesión local del navegador, basta con que el Worker exponga **`ultDia: "YYYY-MM-DD"`** (actualizado como máximo 1 vez al día por cuenta, sin hora ni minuto) en las respuestas de `GET /jugador`, `GET /liga`, `GET /clasificacion` y `GET /coloso`. El cliente de PR #21 ya lo lee y formatea automáticamente (`"Jueves 26 de noviembre"` / `"jue 26 nov"`).

---

## 5. Propuestas técnicas listas para PRs #22+

### 5.1 Banco de Voz Neural AFI gratuito en griego koiné del siglo I
`app.js` (`KOINE_S1`) ya soporta reproducción híbrida automática sin 404: si existe `datos/koine-audio.json` en `datos/archivos.json`, reproduce el clip neural humano en caché; para cualquier otra palabra de las ~5.400 formas, cae instantáneamente a `KOINE_S1` local offline.

**Alternativas 100 % gratuitas (0 USD/mes) con soporte AFI exacto (Buth / Allen / Horrocks / Gignac):**
1. **Kokoro-82M (Recomendado · Apache 2.0 · local en CPU):** modelo neural ligero de 82 M parámetros con timbre humano muy cálido, acepta entrada directa `[palabra](/AFI/)`, genera 500 palabras en ~2 min en CPU normal.
2. **Piper TTS VITS ONNX (MIT · local en CPU):** entrada directa de fonemas `[[ AFI ]]` con modelos gratuitos (`es_ES-davefx-medium` / `el_GR-rapunzelina-low`).
3. **Azure Speech capa gratuita permanente F0:** 500.000 caracteres/mes gratis de por vida con SSML nativo `<phoneme alphabet="ipa" ph="...">` (`es-ES-AlvaroNeural` o `el-GR-NestorasNeural`), suficiente para generar el léxico entero sin pagar un centavo.
- **Peso en disco:** 500 palabras frecuentes en **Opus 24 kbps mono** (`-16 LUFS`) ocupan apenas **~1,2 MB** (~2,5 KB/palabra), hospedables directo en Cloudflare Pages o R2 con caché inmutable.
- **Script listo y probado:** `scratch/generar_koine_neural.py` (en el directorio de artefactos de PR #21; se puede copiar a `herramientas/` si BiEx y Opus aprueban generar el primer lote de 300–500 lemas).

### 5.2 Sistema de Cientos de Accesorios con Bonificaciones Variables (Arquitectura escalable)
Para dar a *Escudriña* profundidad prácticamente ilimitada sin inflar `juego.js` ni romper el equilibrio competitivo:
1. **Catálogo compacto basado en familias y rarezas (`datos/juego/accesorios.json`, ~18 KB para 240+ piezas):**
   - **6 ranuras equipables:** *Aura*, *Manto*, *Lauro / Diadema*, *Sello*, *Códice de mano* y *Reliquia del fundamento* (compatibles con las 4 actuales y ampliables gradualmente).
   - **5 grados de rareza** (con impacto visual y de hallazgo escalado por nuestra regla permanente): *Común* → *Fino* → *Selecto* → *Excepcional* → *Incorruptible*.
   - **Combinatoria limpia (240+ piezas con verificación bíblica de cada término):** 8 colecciones temáticas tomadas directamente de la Nueva Voluntad (*Los 12 Cantos del Fundamento*, *Botánica de Judea y Galilea*, *Manuscritos y Papirología*, *Rutas del Atlas*, *Navegación y Puertos*, *Instrumentos del Escriba*, *Fruto del Espíritu*, *Vestidura de Luz*), cada una con arte SVG paramétrico ligero (cero PNG pesados, 100 % nítido a 3×).
2. **Bonificaciones variables acotadas y justas (cero «pagar para ganar»):**
   - Cada accesorio tiene **1 rasgo fijo de su familia** (p. ej. `+2 %` a `+6 %` experiencia en Evangelios, `+4 %` daño en Brecha contra El Coloso, `+3 %` cosecha, `+1` intento de resonancia o `+5 %` probabilidad de fragmento de papiro) **+ 1 afijo variable determinado al hallarlo** dentro de un rango acotado (p. ej. `+1 %` a `+4 %`, visible como calidad *Sencilla / Pura / Clara / Eximia*).
   - **Tope global suave** (*rendimiento decreciente*): suma total acotada para premiar la colección y las combinaciones estratégicas (p. ej. cambiar equipo para *El Coloso* vs. *Lectura profunda* vs. *Cosecha*) sin desbalancear las ligas semanales.
   - **Sinergias de conjunto (2 / 4 piezas):** equipar 2 o 4 piezas de una misma colección desbloquea un efecto visual discreto en el Ser Interior y una bonificación temática (p. ej. *Conjunto del Escriba*: `+8 %` experiencia en modo Análisis).
   - **Resguardo de pureza bíblica:** cada accesorio lleva su cita verificada directamente en `datos/libros/` y pasa auditoría automática contra la lista de palabras prohibidas.

---

## 6. Hoja de ruta aprobada por BiEx (PRs #22+)

1. **Banco de Voz Neural AFI koiné s. I** (primer lote 300–500 palabras más frecuentes vía Kokoro-82M / Piper / Azure F0 + `datos/koine-audio.json`).
2. **Cientos de Accesorios con bonificaciones variables y conjuntos temáticos** (coordinado con Opus para persistencia en `biex-juego`).
3. **6 ideas de alto impacto aprobadas por BiEx:**
   - *Lupa Interlineal de Manuscritos* (`𝔓⁴⁶/𝔓⁶⁶/𝔓⁷⁵, א, B, A` con deslizador cronológico).
   - *Hilos de Oro* (recorridos cronológicos curados por raíz griega en la Nueva Voluntad).
   - *Modo Estudio en Pantalla Dividida* para tableta/escritorio (`≥ 1080 px`).
   - *Diario de Estudio Exportable a PDF / Libro Imprimible*.
   - *Constelación 3D «Viaje por la Red»* (camino dorado más corto entre dos conceptos).
   - *Banco de Voz Neural AFI* (ya integrado en el punto 1).
4. **Pendiente de especificación de BiEx:** diseño específico deseado para las tarjetas de enlace/carga de *DigiVatLib (`Vat. gr. 1209`)* e *INTF Münster* (`app.js:3999–4007`; recordar que ambas instituciones bloquean `iframe` por `X-Frame-Options`/`CSP`).
5. **Pausados / En conversación aparte:** `B8` y `A3` en pausa; revisión de definiciones Strong en español en chat dedicado.
