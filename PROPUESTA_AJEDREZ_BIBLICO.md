# Propuesta de Diseño: Ajedrez Bíblico de Escudriña («Escudriña · Estrategia»)

> **Estado**: Propuesta aprobada por BiEx el 23 de noviembre de 2026 d.H.D. (diseño original de **Neon** en `4425542d-57a3-4708-91ec-0526a8c69982`, actualizado por **Argon** en `355cba4c-949f-471e-9277-614d10c712f8` para incorporar 13 figuras con **`Sτέfαnος [Esteban]`** en el escalón 12 y **`Pαῦlος [Pablo]`** en el escalón 13).

---

## 1. Visión general: cómo armoniza con Escudriña y BiEx

En lugar de ser un minijuego desconectado de la lectura, el **Ajedrez Bíblico** nace como una extensión natural del estudio y del progreso en **Escudriña**:

- **La lectura alimenta el tablero**: nadie puede avanzar solo jugando ajedrez. Para desbloquear oponentes, abrir variantes históricas, activar ayudas de estudio o disputar partidas clasificatorias se requiere **experiencia de lectura del día**, **versos confirmados («Leído»)** o **aciertos en pruebas de capítulo**.
- **El tablero refuerza el texto bíblico**: cada figura del juego encarna un personaje real de las Escrituras (con su nombre original en hebreo o griego y el tradicional entre corchetes `[ ]`, siguiendo las reglas de BiEx), su estilo táctico refleja su carácter en el relato bíblico, y antes o después de cada partida se presenta una **cápsula textual y léxica** con citas directas para abrir en el lector.
- **Estética de alta relojería y códice**: piezas talladas en SVG puro con acabado de obsidiana, marfil antiguo, oro bruñido y bronce (cero imágenes externas, cero cruces, cero estrellas de cinco puntas ni soles radiados).

---

## 2. Las piezas del tablero (simbología de las Escrituras)

Se mantiene el reglamento oficial e internacional del ajedrez FIDE (para que cualquier lector que sepa jugar ajedrez pueda disfrutarlo al instante y el motor sea 100 % justo), pero con iconografía e identidad del mundo bíblico antiguo:

| Pieza tradicional | Nombre en BiEx | Geometría SVG (sin cruces ni estrellas) | Sentido escritural |
| :--- | :--- | :--- | :--- |
| **Rey** | **Ungido / Soberano (`Māshîaḥ` / `Bαsιlεύς`)** | Diadema real antigua con aro de oro y gema central tallada en cabujón (sin cruz superior) | La cabeza que debe ser resguardada por todo el cuerpo |
| **Dama** | **Sabiduría (`Ḥoḵmā́h` / `Sοfία`)** | Lámpara de aceite encendida sobre pedestal labrado | *«La sabiduría edificó su casa…»* — alcance en todas las direcciones |
| **Torre** | **Baluarte (`Miḡdā́l` / `Pύrgος`)** | Torreón amurallado de piedra sillar con almenas | *«Torre fuerte es el nombre…»* — firmeza en columnas y filas |
| **Alfil** | **Mensajero / Profeta (`Nāḇî́ʾ` / `Prοfήτης`)** | Rollo de papiro o pergamino con sello de lacre | Traza caminos diagonales conectando de extremo a extremo |
| **Caballo** | **Corcel (`Sûs` / `Ἵppος`)** | Cabeza de corcel antiguo en perfil de bajorrelieve | Salto táctico que supera obstáculos cerrados |
| **Peón** | **Discípulo / Caminante (`Talmîḏ` / `Μαθητής`)** | Cayado o bordón de caminante sobre base circular | Avanza paso a paso; al perseverar hasta la última fila, alcanza plenitud (coronación) |

*(El jugador puede alternar con un toque entre las siluetas bíblicas de BiEx y las siluetas clásicas Staunton sin cruz en el Rey).*

---

## 3. Modos de juego

### A. «Sendas de los Antiguos» (Campaña progresiva contra 13 figuras bíblicas — 100 % en el navegador)
Un recorrido de **13 niveles de maestría** donde el lector se enfrenta a **13 personajes de las Escrituras**. Cada uno tiene un árbol de aperturas, un estilo posicional propio (defensivo, táctico, paciente, audaz) y una cita clave que enseña una lección del texto:

1. **`YÔḥānā́n Μᾶrκος [Juan Marcos]`** *(ELO ~650 · Iniciación)* — Rápido y entusiasta; ideal para aprender los fundamentos. *(Hechos 12:12; 2 Timoteo 4:11)*.
2. **`Tιmόdsεος [Timoteo]`** *(ELO ~800 · Prudente)* — Ordenado y fiel a los principios del desarrollo. *(1 Timoteo 4:12)*.
3. **`Lουκᾶς [Lucas]`** *(ELO ~950 · Metódico)* — Investigador cuidadoso desde el origen; calcula con orden cada jugada. *(Lucas 1:3)*.
4. **`Mattáy [Mateo]`** *(ELO ~1100 · Equilibrado)* — Valora cada pieza con exactitud matemática y estructura simétrica. *(Mateo 9:9)*.
5. **`Miryā́m [María de Magdala]`** *(ELO ~1220 · Perseverante)* — Nunca da una posición por perdida; especialista en finales de resistencia. *(Juan 20:1-18)*.
6. **`Kêfáʾ — Pέτrος [Pedro]`** *(ELO ~1350 · Audaz)* — Ataques frontales e impetuosos; si resistes su primera embestida, deja flancos abiertos. *(Mateo 16:18; 1 Pedro 1:7)*.
7. **`Yaʿăqṓḇ [Jacobo]`** *(ELO ~1480 · Firme)* — Defensa de roca; exige que la fe en tu posición se demuestre con obras concretas en el centro del tablero. *(Jacobo 2:18)*.
8. **`YÔḥānā́n [Juan]`** *(ELO ~1600 · Profundo)* — Juego de armonía y visión a largo plazo; domina las grandes diagonales de luz. *(Juan 1:1-5)*.
9. **`Dāwî́ḏ [David]`** *(ELO ~1720 · Táctico)* — Sacrificios inesperados y golpes precisos contra piezas mayores (efecto honda). *(1 Samuel 17:45)*.
10. **`Shᵉlōmṓh [Salomón]`** *(ELO ~1850 · Estratégico)* — Sabiduría posicional clásica; domina el espacio sin apresurarse. *(1 Reyes 3:9)*.
11. **`Mōshéh [Moisés]`** *(ELO ~1980 · Guía)* — Abre paso a través de posiciones cerradas que parecían infranqueables. *(Éxodo 14:21; Hebreos 11:24-27)*.
12. **`Sτέfαnος [Esteban]`** *(ELO ~2060 · Testigo luminoso)* — Defensa inquebrantable frente al asedio del Sanedrín y contraataque de largo alcance con visión abierta del cielo; convierte la presión extrema en victoria táctica. *(Hechos 6:8-15; 7:55-56)*.
13. **`Pαῦlος [Pablo]`** *(ELO ~2150 · Maestro de la Nueva Voluntad)* — Cúspide de la campaña: combina táctica incisiva, adaptación a cualquier rival y visión de campo profundo. *(1 Corintios 9:22-25; 2 Timoteo 4:7)*.

**Requisito de desbloqueo**: cada figura se desbloquea al alcanzar cierto **nivel en Escudriña** o al haber leído determinados capítulos del libro vinculado al personaje.

---

### B. «Enigmas del Códice» (Problemas tácticos diarios ligados a la lectura)
- Cada día se presenta un **problema táctico en 2 o 3 jugadas** (*«Mate en 2»* o *«Ganancia decisiva»*) inspirado metafóricamente en una escena bíblica.
- **Vínculo con la lectura**: el problema del día se **habilita gratis al leer tus primeros 5 versos del día en BiEx**.
- Resolverlo otorga **experiencia (`+35 XP`)**, **dracmas (`+8 dr.`)** y suma puntos al aspecto de **Templanza (`ἐγκράτεια`)** o **Longanimidad (`μακροθυμία`)** en la granada del Fruto del Espíritu.

---

### C. «Encuentro en la Sala / Compañía» (Partidas entre lectores de BiEx)
- Dentro de las **Salas de lectura en vivo** o entre miembros de una misma **Compañía**, dos lectores pueden retarse a una partida amistosa:
  - **En vivo (rápida de 5 min o 10 min)**: sincronizada mediante el servidor de Escudriña.
  - **Por correspondencia (1 jugada por turno al entrar a leer)**: ideal para jugar sin prisa; cada vez que un lector entra a leer su capítulo del día, hace su jugada pendiente en el tablero de la Compañía.

---

## 4. Integración con la economía y los atributos de Escudriña

1. **Vínculo con el Árbol y el Fruto del Espíritu**:
   - Ganar o resolver un enigma diario alimenta la **Longanimidad** (paciencia en el cálculo) y la **Templanza** (dominio propio ante la presión).
   - Tu atributo de **Veracidad** o **Sabiduría** desbloquea en las partidas de práctica contra la máquina la función **«Lumbre de Consejo»** (1 vez por partida permite ver la evaluación de las 2 mejores jugadas candidatas explicadas en español claro).
2. **Trofeos y Vitrina del Árbol**:
   - Superar a los primeros 7 maestros otorga el sello **«Estratega del Atrio»**.
   - Superar a los 13 maestros (incluyendo a **`Sτέfαnος [Esteban]`** y **`Pαῦlος [Pablo]`**) desbloquea en la vitrina un accesorio raro exclusivo (sin coste de dracmas, ganado por mérito): **«Diadema de Consejo»** y un **lauro trenzado**.
3. **Tope sano para que la lectura sea siempre el centro**:
   - El ajedrez otorga experiencia y dracmas en la **primera partida y en el enigma diario** tras haber leído versos ese día. Las partidas adicionales del mismo día son libres para disfrutar y practicar, pero el verdadero motor de subida de nivel sigue siendo **leer y escudriñar las Escrituras**.

---

## 5. Arquitectura técnica (ligera, rápida y 100 % sin conexión)

- **Carga diferida (`ajedrez.js`)**: igual que `juego.js` y `busqueda.js`, el módulo del ajedrez solo se descarga cuando el lector entra a la pestaña o abre el tablero. No añade **ni un solo byte** a la carga inicial del lector bíblico.
- **Motor ultraligero integrado (~18 KB)**: un motor de ajedrez en JavaScript puro con poda alfa-beta, tablas pieza-casilla (*piece-square tables*), búsqueda de quietud (*quiescence search*) y perfiles de personalidad para los 13 personajes bíblicos. Corre en un `Web Worker` (o en tajadas de `25 ms`) para que la interfaz y las animaciones a `60 fps` jamás se detengan.
- **Guardado automático**: cualquier partida en curso queda guardada en `localStorage` (`jg:ajedrez`) en notación FEN/PGN para retomarla exactamente donde se dejó, incluso sin conexión a internet.
