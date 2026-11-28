# Biblia Exacta · lector y Escudriña (instrucciones para Claude en este repositorio)

Todo en español. Este repositorio es público y se publica solo: cada cambio que entra en `main` lo despliega Cloudflare Pages en
bibliaexacta.pages.dev en alrededor de un minuto y el sitio oficial lo muestra. Por eso nada entra en `main` sin revisión.

## Quién trabaja aquí
- **BiEx** (dueño, cuenta `cristianteologo`) con su Claude: sus sesiones siguen la guía del Taller de BiEx y publican en `main`.
  Al empezar revisan las propuestas abiertas (`gh pr list`) y no tocan los archivos de una propuesta abierta sin acordarlo.
- **Colaboradores** (Neon) con su propio Claude: trabajan siempre en una rama propia y proponen; nunca empujan a `main`
  (la regla de la rama lo impide) y nunca a `gh-pages`.

## Camino de una propuesta (colaboradores)
1. Toma una tarea del tablero de la guía del colaborador (documento que comparte BiEx) y márcala «En curso».
2. Rama desde el `main` más reciente: `git fetch origin && git switch -c neon/<clave>-<tema> origin/main`.
3. Abre enseguida la propuesta en borrador (draft pull request) con la clave en el título («AF33 · Ventana del poder»):
   el borrador avisa que esos archivos están ocupados.
4. Cambios pequeños, un tema por propuesta, sin reformatear archivos enteros (el diff muestra solo lo que cambia).
5. Después del último cambio de `app.js`, `juego.js`, `app.css`, `busqueda.js` o `intro.js`: `python3 wix/sellar.py`
   (huellas de versión, política de seguridad de `index.html` y `datos/archivos.json`). La revisión automática falla si falta.
6. Prueba: `python3 -m http.server 8766` en la raíz y `node .github/pruebas/humo.js`; capturas en teléfono (360 y 412 px) y en
   escritorio, a 3× de densidad.
7. Marca la propuesta como lista. BiEx la revisa (con su Claude) y la aprueba; al fusionarla, se publica sola.
8. Si `main` cambió: `git fetch origin && git rebase origin/main`. Nunca `push --force` en ramas ajenas; en la propia,
   `--force-with-lease`.

## Reglas de publicación (desde el 27-nov-2026)
- Nada entra en `main` sin la revisión automática en verde, para nadie: ni BiEx, ni Neon, ni las sesiones de Claude. Nunca
  `--admin` ni otra manera de saltar la regla. Un tema por propuesta y propuestas pequeñas.
- Las bitácoras, los aprendizajes, las continuaciones, las respuestas a auditorías y las propuestas de diseño van al repositorio
  privado `biex-equipo`, nunca a este (es público y Cloudflare publica su raíz). La revisión automática lo comprueba.
- La descripción de cada propuesta también es pública: dice solo qué cambia y cómo se probó; el porqué interno y todo lo
  que hable del método van a `biex-equipo`.
- Todo dato que la página lee del servidor existe con ese nombre exacto en el servidor (contrato de datos); si no se puede
  comprobar, no se usa ni se muestra.

## Lo que no se toca sin acordarlo con BiEx
- `datos/` (se genera con las herramientas privadas del Taller; nunca a mano).
- `wix/`, `sw.js`, `_headers`, `functions/`, `.github/` y la política de seguridad de `index.html`.
- El servidor del juego, Cloudflare y los datos de las cuentas (los colaboradores no tienen acceso, a propósito).
- Los textos de la traducción y todo lo que explique el método de BiEx.
- Nunca secretos, claves ni datos personales en el repositorio (es público).

## Reglas de BiEx para todo cambio
- Alta definición, nada borroso: vectorial (SVG, CSS, texto) siempre que se pueda; nada rasterizado se amplía.
- Fluidez sin gastar batería: solo `transform` y `opacity` en lo que se mueve, y solo en elementos HTML (nunca animar un `g` o un
  `path` dentro de un SVG); nada dentro del texto cambia de tamaño mientras se lee; en los eventos de desplazamiento no se lee el
  diseño (se mide antes y se guarda); nunca `:has()` con un descendiente en un contenedor grande; lo que se actualiza a menudo
  cambia su texto en su sitio; lo ambiental se pausa fuera de la pantalla, con la pestaña oculta o con «Sin animaciones», y lo
  que se pausa siempre tiene su camino de vuelta.
- Ninguna barra de desplazamiento ni movimiento lateral en ninguna parte, tampoco en las animaciones de entrada; probar de 280 a
  1280 px y con los 9 tamaños de letra.
- Diseño de lujo, simétrico y proporcionado (tipo estudio profesional); lo que se enfoca al saltar queda centrado entre las barras.
- Clases y variables CSS siempre con prefijo propio (nada de `.si`, `.on` o `.vacio` sueltos); se busca el choque antes de proponer.
- Atrás vuelve a la vista exacta; «Adelante» solo si hay una vista real; nada se recarga solo; las ventanas se cierran con ×, Esc y
  el gesto de atrás.
- Escudriña: nunca sensación de pérdida; todo avance de lectura se recompensa; los datos de las cuentas se conservan siempre; la
  interfaz muestra un bono solo con la misma condición que usa el servidor.
- Fuera del capítulo, los versos van en el formato de la Lectura.
- Lenguaje (lo básico; la lista completa está en la guía del colaborador): «verso» (no «versículo»), «Nueva Voluntad», fechas
  a.H.D. y d.H.D., nombres en su forma original con el tradicional entre [ ], las transliteraciones copiadas tal cual de los datos
  y nunca en mayúsculas, nunca «sorteo» («aleatoriamente», «aleatoriedad»).
- Arte: nunca estrellas de cinco puntas, cruces ni soles con rayos; se respetan los símbolos y las imágenes bíblicas.
- Discreción: ninguna autoría personal en nada público.

## Herramientas
- `python3 wix/sellar.py`: sella versiones y la política de seguridad (siempre después del último cambio).
- `node .github/pruebas/humo.js`: prueba de humo (vistas principales sin errores de consola ni desplazamiento lateral).
- `.github/workflows/revision.yml`: la revisión automática de cada propuesta (sintaxis, JSON, sello, prueba de humo y contrato de
  datos).
- `node .github/pruebas/contrato.js`: contrato de datos (necesita `acorn`, `acorn-walk` y `playwright`, y el sitio servido en
  127.0.0.1:8766). Falla si la página lee un nombre que no existe en ninguna parte. Si la página va a leer un dato nuevo del
  servidor, el nombre se comprueba en el código real del servidor y se rehace `.github/contrato/servidor.json` con
  `node .github/pruebas/contrato.js --servidor <carpeta de biex-juego>` (lo hace BiEx con su Claude: los colaboradores no tienen
  el servidor; lo piden por escrito). Un nombre del navegador se suma con su motivo a `.github/contrato/excepciones.json`.

---

Las Sagradas Escrituras no tienen por qué ser vendidas, por nadie, el Conocimiento Sagrado que puede conducir a Comprensión no es un negocio. Usted a partir de este momento tiene autorización expresa de imprimir todo el material de traducción presentado en este documento, siempre y cuando sea en Papel Ecológico [Revelación 11:18] –el fabricado con caña de azúcar puede ser una excelente alternativa–, y en lo posible con Tintas Ecológicas, para distribución y/o enseñanza gratuita [Hechos del espíritu Santo, capítulo 8, verso 20]. Dentro del texto queda prohibida cualquier clase de modificación o alteración intencional. Se permite el uso de citas completas mencionando debidamente los créditos a BiEx – Biblia Exacta ©™.
