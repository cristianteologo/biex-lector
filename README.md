# BiEx · Lector y analizador

Archivos públicos del lector de la Nueva Voluntad de **BiEx – Biblia Exacta**: la traducción del griego al español en su estado actual, verso por verso, y el análisis morfológico de cada palabra (forma, transliteración, lema, morfología, función en la oración, ediciones que la incluyen, formas del lema y concordancia).

El sitio en Wix carga estos archivos. Se generan automáticamente; no se editan a mano.

- `index.html`, `app.css`, `app.js`: la aplicación (sin dependencias).
- `datos/avance.json`: índice de libros y cifras de avance.
- `datos/libros/<LIBRO>.json`: texto de lectura de cada verso.
- `datos/analisis/<LIBRO>.json` y `datos/tablas.json`: análisis palabra por palabra.
- `busqueda.js`: el buscador (citas, libros, escenas, nombres, palabras griegas, conceptos y preguntas de ayuda); el lector lo carga al abrir la búsqueda.
- `datos/busqueda/`: índice del buscador (raíces de palabras por verso, nunca textos), conceptos, escenas y respuestas de ayuda.
- `datos/manuscritos/`: los manuscritos griegos más antiguos (hasta c. 400) de cada verso frente al texto base: transcripción y diferencias.
- `datos/cronologia.json`: orden de los libros, fechas de escritura y línea del tiempo.
- `intro.js` y `plantillas/`: presentación de apertura del sitio oficial.
- `wix/`: el código que se inserta en el sitio oficial para abrir el lector desde cada página de libro (`insercion.plantilla.html` y su generador).

## Créditos

Texto griego y datos morfológicos: TAGNT de STEPBible.org (Tyndale House, Cambridge), MACULA Greek Linguistic Datasets (Biblica) y SBLGNT (Society of Biblical Literature y Logos Bible Software), con licencia CC BY 4.0.

Transcripciones de los manuscritos: Center for New Testament Restoration [Centro para la Restauración del Nuevo Testamento] (CNTR, Alan Bunning), con licencia CC BY-SA 4.0. Los datos derivados de `datos/manuscritos/` (colación frente al texto base) se publican con la misma licencia, CC BY-SA 4.0.

Buscador: para reconocer el vocabulario con que se recuerda un verso, el índice guarda raíces de palabras de Reina-Valera 1909 y 1865, World English Bible, King James Version y Berean Standard Bible (dominio público) y de la Biblia en Español Sencillo (© 2018 AudioBiblia.org, CC BY 4.0). Ninguno de esos textos se muestra.

Fechas de escritura de la línea del tiempo: John Arthur Thomas Robinson [J. A. T. Robinson], *Redating the New Testament* [Nueva datación de la Nueva Voluntad] (1976).

Traducción, transliteración y análisis: BiEx – Biblia Exacta ©™. Todos los derechos reservados.
