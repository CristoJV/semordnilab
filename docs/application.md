# Guía de la aplicación

## Qué es Semordnilab

Semordnilab es una aplicación web para explorar y construir semordnilaps bilingües. Un semordnilap relaciona dos expresiones cuyas formas normalizadas se corresponden al invertir el orden de sus caracteres.

La aplicación parte de semordnilaps extraídos previamente de corpus lingüísticos. Cada uno contiene una expresión de origen y su expresión inversa en otro idioma (o en el mismo idioma), junto con información que puede ayudar a explorarlo, como frecuencia, número de palabras y puntuación.

El propósito es ofrecer un espacio creativo de exploración lingüística. No hay puntos, clasificaciones ni mecánicas competitivas.

## Plataforma

La aplicación funciona completamente en el navegador, sin un backend propio, y se publica mediante GitHub Pages. Los datasets incluidos forman parte de los recursos estáticos. Los estados del catálogo, los borradores y los composites guardados permanecen en IndexedDB.

El funcionamiento sin conexión se ofrecerá cuando los recursos necesarios ya estén disponibles en el navegador. Una experiencia offline garantizada requerirá definir y verificar una estrategia de caché.

## Conceptos principales

### Semordnilap individual

Es un semordnilap indivisible procedente de un dataset. Puede contener una palabra o una expresión de varias palabras, pero la aplicación siempre lo trata como una sola unidad. En el modelo de dominio se denomina `AtomicSemordnilap`.

### Semordnilap compuesto

Es un semordnilap formado por una secuencia ordenada de otros semordnilaps. Sus componentes pueden ser individuales o compuestos, por lo que la estructura admite anidamiento. En el modelo de dominio se denomina `CompositeSemordnilap`.

Si el lado de origen contiene `A + B + C`, el lado de destino contiene `C′ + B′ + A′`. El resultado completo conserva la misma propiedad inversa y puede utilizarse como una única pieza dentro de otra composición.

### Componente

Es la aparición de un semordnilap dentro del constructor. El componente conserva una referencia al semordnilap original. Aunque el usuario lo seleccione desde uno de los idiomas, la aplicación incorpora también su expresión correspondiente.

### Forma normalizada

Es la representación utilizada para comparar e invertir expresiones. Los datasets incluidos ya proporcionan esta forma sin espacios y con las transformaciones lingüísticas aplicadas durante su generación. El texto original se conserva para mostrarlo al usuario.

## Experiencia principal

La pantalla se organiza verticalmente para aprovechar una ventana más ancha que alta:

1. Una barra superior con la identidad de la aplicación, el selector del conjunto lingüístico y el estado de carga.
2. Un área de composición donde se agrupan los semordnilaps seleccionados.
3. Un catálogo inferior con los dos idiomas en columnas paralelas.
4. Un pie de página compacto con la marca `SemordniLAB`.

El área de composición ocupa todo el ancho disponible y permanece por encima de las listas. Muestra dos secuencias relacionadas. La secuencia de origen conserva el orden de selección y la secuencia de destino se presenta en orden inverso. El documento ocupa la altura de la ventana y el desplazamiento vertical pertenece al catálogo. En pantallas estrechas el área puede plegarse para dejar más espacio a las listas.

```text
origen:  [A]  [B]  [C]
destino: [C′] [B′] [A′]
```

Cuando todavía no hay componentes, el área ofrece una indicación breve para empezar. No se llena con paneles decorativos ni información secundaria.

Debajo aparecen los dos exploradores. La columna izquierda alinea sus semordnilaps hacia la derecha y la columna derecha los alinea hacia la izquierda. Las expresiones quedan orientadas visualmente hacia el punto de encuentro entre ambos idiomas.

Cada explorador dispone de búsqueda y ordenación propias. Al seleccionar una expresión, el semordnilap completo se añade al área de composición y su expresión correspondiente aparece en la secuencia inversa. Las acciones situadas entre ambas columnas actúan sobre el semordnilap completo.

Los espacios situados antes, después y entre componentes permiten elegir la posición de la siguiente inserción. El espacio final está activo inicialmente y el cursor avanza después de cada incorporación. Seleccionar un espacio en el idioma de destino activa su posición canónica equivalente en origen.

Cada componente se puede mover hacia la izquierda o la derecha, retirar o recuperar mediante el historial. Deshacer y rehacer cubren inserciones, movimientos, retiradas y vaciado. Cada cambio actualiza simultáneamente los dos idiomas y conserva automáticamente el borrador del dataset activo.

La correspondencia visual entre componentes debe permanecer visible para que se entienda cómo se forma el resultado.

## Identidad visual

La interfaz utiliza una base neutra y una combinación de violeta y mostaza:

- el violeta identifica el idioma de origen y sus componentes;
- el mostaza identifica el idioma de destino y sus componentes;
- los fondos de ambos colores son claros y poco saturados;
- el texto utiliza tonos oscuros con contraste suficiente;
- selección, foco y validación incluyen forma, borde o texto además del color.

El mostaza intenso se reserva para fondos, bordes e indicadores. Sobre superficies claras se utiliza una variante mostaza oscura para mantener la legibilidad.

La marca del pie de página se escribe como `SemordniLAB`, destacando visualmente `LAB` sin alterar el texto accesible.

## Selección de un conjunto lingüístico

La aplicación incluye inicialmente estos datasets:

| Conjunto            | Archivo                     | Contenido actual aproximado |
| ------------------- | --------------------------- | --------------------------: |
| Español y español   | `public/datasets/es_es.tsv` |          6.642 semordnilaps |
| Español y gallego   | `public/datasets/es_gl.tsv` |          1.091 semordnilaps |
| Español y portugués | `public/datasets/es_pt.tsv` |          4.513 semordnilaps |

El usuario podrá elegir uno de los conjuntos disponibles. Los archivos incluidos marcan el esquema de referencia para incorporar otros conjuntos compatibles.

## Búsqueda y filtros

Cada idioma dispone de su propio campo de búsqueda, pero ambos campos filtran un único conjunto compartido. El resultado aplica la intersección de las dos consultas y muestra siempre las dos expresiones del mismo `AtomicSemordnilap` en una fila común.

Por ejemplo, una búsqueda en español reduce simultáneamente la columna gallega a sus correspondencias. Una consulta posterior en gallego se aplica únicamente a ese conjunto ya reducido. Las dos columnas comparten desplazamiento y nunca pierden la alineación.

La búsqueda actual admite:

- diferencias de mayúsculas, minúsculas y tildes;
- coincidencias parciales y por varias palabras;
- consulta sobre el texto visible y la forma normalizada.

Cada cabecera permite ordenar por el texto o por la longitud en caracteres. Un control recorre tres estados: ascendente, descendente y desactivado. Los criterios se acumulan según su orden de activación y muestran su prioridad numérica. Pueden combinar comparaciones de ambos idiomas, pero la fila bilingüe sigue siendo indivisible. Los favoritos conservan prioridad y los composites guardados aparecen antes que los atómicos dentro de su grupo.

## Estados del catálogo

Un semordnilap puede recibir uno o varios estados. La identidad persistida se compone de `datasetId`, `semordnilapId` y `status`. No contiene un lado de origen o destino porque ambos textos representan la misma unidad y la referencia ya la identifica por completo.

La interfaz utiliza actualmente dos estados:

- `favorite` coloca el semordnilap al principio del catálogo sin modificarlo;
- `discarded` lo retira de la vista activa y lo muestra en la vista de descartados.

Los estados son independientes. Por ejemplo, un favorito puede descartarse sin perder la marca de favorito. Este modelo permite incorporar otros estados sin cambiar la identidad del registro ni crear una estructura específica para cada uno.

Descartar o restaurar una fila actualiza las dos expresiones a la vez. Los botones de descartados de ambas cabeceras abren la misma colección compartida. Desde ella se puede restaurar una unidad, seleccionar varias o restaurarlas todas. La selección múltiple también permite aplicar favoritos o descartes por lotes desde la vista activa. Después de descartar, un aviso temporal permite deshacer inmediatamente la operación.

La búsqueda sigue funcionando dentro de la vista activa o descartada y continúa aplicando la intersección de ambos idiomas. Restablecer los filtros elimina consultas y ordenación, pero no borra estados persistentes.

## Validación de una composición

El constructor informa de su estado sin interrumpir la exploración. Un semordnilap compuesto guardable debe cumplir al menos estas condiciones:

- contiene dos o más componentes;
- todos los componentes hacen referencia a un semordnilap válido;
- la concatenación normalizada de un idioma es la inversión de la del otro;
- la estructura anidada no contiene referencias circulares.

La repetición de un componente no se considera inválida por defecto: puede ser una decisión creativa. La interfaz debe hacerla visible y permitir retirarla. Esta regla evita interpretar como error una intención que la aplicación no puede conocer.

## Guardado y reutilización

Un semordnilap compuesto válido se guarda con:

- la lista ordenada de referencias a sus componentes;
- un título opcional;
- la fecha de creación y de última modificación.

Las expresiones resultantes se derivan de los componentes y no constituyen una fuente de verdad independiente.

Los composites guardados aparecen directamente en el catálogo con un indicador propio. Pueden buscarse, marcarse como favoritos, descartarse e insertarse como una sola pieza dentro de otra composición. La resolución recursiva conserva la procedencia atómica y comprueba la integridad antes de mostrar cada resultado.

La identidad de un composite se deriva de la secuencia expandida de componentes atómicos. Guardar de nuevo la misma construcción no crea un duplicado. Los registros son inmutables desde la interfaz actual, por lo que una composición nueva no puede modificar indirectamente otra ya guardada ni introducir referencias circulares.

## Persistencia y exportación

La aplicación no requiere cuenta ni servidor. Guarda en el navegador los estados del catálogo, un borrador por dataset y los composites. Los datasets incluidos se sirven como archivos estáticos y no se duplican en la base de datos local.

La base tiene una versión explícita y las actualizaciones conservan las tablas anteriores mediante migraciones aditivas. Los identificadores atómicos son estables aunque una fila cambie de posición en el TSV. Las preferencias guardadas con los identificadores antiguos se convierten dentro de una transacción cuando se carga cada dataset.

El usuario podrá exportar su colección para conservarla o trasladarla. El formato de intercambio deberá incluir referencias suficientes para reconstruir y validar las composiciones anidadas.

Una futura ampliación podría añadir sincronización entre dispositivos, colecciones compartidas y colaboración. Estas posibilidades no forman parte de la especificación actual.
