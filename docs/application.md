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

1. Una barra superior compacta con la identidad de la aplicación, el selector del conjunto lingüístico, el estado de carga y el acceso al menú.
2. Un área de composición donde se agrupan los semordnilaps seleccionados.
3. Un catálogo inferior con los dos idiomas en columnas paralelas.
4. Un pie de página compacto con la marca `SemordniLAB`.

El área de composición ocupa todo el ancho disponible y permanece por encima de las listas. Muestra dos secuencias relacionadas. La secuencia de origen conserva el orden de selección y la secuencia de destino se presenta en orden inverso. El documento ocupa la altura de la ventana y el desplazamiento vertical pertenece al catálogo. El área comienza expandida tanto en escritorio como en móvil y puede plegarse para dejar más espacio a las listas. Si el usuario decide recordar este estado, su preferencia explícita prevalece en visitas posteriores.

```text
origen:  [A]  [B]  [C]
destino: [C′] [B′] [A′]
```

Cuando todavía no hay componentes, el área ofrece una indicación breve para empezar. No se llena con paneles decorativos ni información secundaria.

Debajo aparecen los dos exploradores. La columna izquierda alinea sus semordnilaps hacia la derecha y la columna derecha los alinea hacia la izquierda. Las expresiones quedan orientadas visualmente hacia el punto de encuentro entre ambos idiomas.

Cada explorador dispone de búsqueda y ordenación propias. En una pantalla amplia los controles de ordenación se sitúan junto al título del idioma. En una pantalla estrecha se reúnen en un botón que abre un panel táctil y permite combinar los mismos criterios. Al seleccionar una expresión, el semordnilap completo se añade al área de composición y su expresión correspondiente aparece en la secuencia inversa. Las acciones situadas entre ambas columnas actúan sobre el semordnilap completo.

Las listas personales de palabras inválidas se activan por idioma desde el catálogo. Cada lado se controla de forma independiente y una pareja deja de mostrarse si contiene como token completo cualquier palabra de una lista activa. La exclusión sólo afecta a la vista: no elimina borradores, favoritos, etiquetas ni composites guardados.

El acceso `Filtrar` de la cabecera abre una pantalla de revisión sin desplazar la navegación superior. Allí se elige el idioma y se alterna entre `Filtrar palabras` y `Recuperar palabras`. Ambos modos comparten una rejilla multicolumna y un buscador aproximado que ignora diferencias de acentuación. Al tocar una palabra, una transición roja confirma el filtrado o una verde confirma la recuperación antes de moverla entre listas. La pantalla permite exportar el mismo backup personal versionado que ofrece el menú.

La cabecera conserva una separación clara entre los idiomas mediante una línea vertical fina, pero las filas del catálogo se presentan como unidades continuas. En móvil el canal de esa línea se estrecha para ceder más espacio a las cabeceras; en escritorio conserva una separación más holgada. Las filas no tienen esquinas redondeadas ni divisores en el centro. Un fondo muy suave pasa del violeta de origen al mostaza de destino por detrás de los controles centrales. El hover y la selección afectan a la pareja completa sin cambiar su geometría. La información compartida no se duplica: las etiquetas ocupan un carril estable en el extremo izquierdo y el contador de usos otro en el extremo derecho, mientras que ambos textos permanecen orientados hacia el centro.

Los espacios situados antes, después y entre componentes permiten elegir la posición de la siguiente inserción. El espacio final está activo inicialmente y el cursor avanza después de cada incorporación. Seleccionar un espacio en el idioma de destino activa su posición canónica equivalente en origen. Los espacios conservan una anchura fija para que la frase no cambie de distribución durante un arrastre. Solo crece visualmente el signo `+` del destino actual, con violeta en origen o mostaza en destino.

Los componentes se presentan como fragmentos de texto compactos. No muestran flechas ni un botón de cierre permanente. Con ratón, una pulsación breve retira el componente y un movimiento intencionado inicia el arrastre. En una pantalla táctil, un toque breve lo retira y una pulsación prolongada inicia el arrastre, de modo que un desplazamiento normal de la página no reorganiza la frase accidentalmente. Las dos secuencias comparten un único desplazamiento horizontal: la misma barra mueve ambos composites a la vez. Los títulos de los idiomas y la barra de herramientas quedan fuera del viewport, permanecen fijos y no necesitan un fondo que los oculte durante el movimiento. Al acercar el puntero a un extremo durante el arrastre, este viewport común se desplaza para alcanzar posiciones que no están visibles sin ampliar el documento.

Retirar una pieza muestra un aviso temporal de color naranja claro con la acción `Deshacer`. Guardar correctamente muestra un aviso verde claro. Los avisos aparecen en la zona inferior, no cambian la distribución del contenido y desaparecen después de unos segundos. Si el conjunto activo ha cambiado y la pieza ya no puede recuperarse con seguridad, la aplicación lo comunica sin insertar una referencia incompatible.

El teclado ofrece la misma funcionalidad sin depender de los gestos: `Intro`, espacio, Suprimir o Retroceso retiran la pieza, mientras que `Mayús` con las flechas laterales la desplaza. Deshacer y rehacer cubren inserciones, movimientos, retiradas y vaciado. Cada cambio actualiza simultáneamente los dos idiomas y conserva automáticamente el borrador del dataset activo. La persistencia correcta se anuncia de forma accesible sin ocupar una barra visible. Los errores continúan apareciendo junto al área porque sí requieren atención.

La correspondencia visual entre componentes permanece visible para que se entienda cómo se forma el resultado. Al señalar o enfocar una pieza, su aparición relacionada se resalta simultáneamente en el otro idioma.

## Experiencia en pantallas estrechas

La versión móvil conserva la misma pantalla, los mismos datos y las mismas operaciones. No existe una página móvil independiente. La adaptación solo cambia cómo se presentan los controles:

- el selector central muestra los códigos del par lingüístico y abre una hoja de selección;
- el estado general de carga deja de ocupar espacio en la barra superior, aunque sigue disponible mediante anuncios accesibles;
- el área se titula `Compón` y utiliza iconos para plegar, deshacer, rehacer, guardar y vaciar;
- las acciones principales mantienen un área táctil mínima de 44 píxeles y un nombre accesible aunque oculten su etiqueta visual;
- las vistas se presentan en el orden `Todos`, `Guardados`, `Favoritos`, `Descartados` y `Etiquetas`;
- la barra de filtros ocupa una sola línea desplazable; cuando existe alguna consulta, ordenación o etiqueta activa, un icono compacto permite restablecerlas desde esa misma línea;
- `Descubrir` se presenta como un botón flotante circular con dados en la esquina inferior derecha, respeta la zona segura y reserva espacio para no cubrir la última fila;
- `Seleccionar` y `Restaurar todos` no ocupan una segunda barra; una pulsación prolongada abre la selección y el menú superior conserva una entrada accesible alternativa;
- una pulsación prolongada sobre cualquier expresión entra directamente en selección múltiple y selecciona su fila bilingüe; un toque normal sigue añadiendo la pieza a la composición y el movimiento vertical cede el control al scroll;
- desplazar una fila activa hacia la derecha añade o retira el favorito, mientras que desplazarla hacia la izquierda la descarta; en `Descartados` solo el gesto izquierdo restaura y el movimiento derecho no desplaza la fila ni revela una acción;
- el centro de cada fila muestra dos cheurones como indicación del gesto; en un composite aparece entre ellos una nota con lápiz en lugar del símbolo de agrupación;
- los cheurones de una unidad atómica activa son solo una indicación; tocar la nota con lápiz abre directamente la gestión del composite y una unidad descartada muestra únicamente el cheurón que sugiere el gesto izquierdo;
- durante la selección múltiple, favorito, descarte y etiquetado se agrupan en una única superficie y se representan mediante estrella, papelera y etiqueta para conservar espacio sin reducir su zona táctil; en `Descartados` no se ofrece la acción de favorito;
- una casilla triestado permite seleccionar o deseleccionar todos los resultados del filtro completo; muestra un estado parcial cuando solo se ha seleccionado una parte y permite restaurar en lote desde `Descartados`;
- una cruz visualmente pequeña, situada en el extremo derecho, cierra la selección y conserva alrededor un objetivo táctil de 44 píxeles;
- cada idioma coloca el contador junto a un menú de tres puntos en el extremo derecho y abre su ordenación en una hoja inferior;
- el filtro de etiquetas aparece anclado justo debajo de su botón, aunque se monta fuera del contenedor de scroll para evitar recortes;
- los diálogos se montan sobre el documento, ocupan el ancho disponible y respetan las zonas seguras del dispositivo;
- el documento utiliza la altura dinámica del navegador y mantiene el desplazamiento vertical dentro del catálogo.

Las filas bilingües permanecen alineadas y la composición conserva un desplazamiento horizontal compartido. La barra principal puede desplazarse lateralmente sin ensanchar la página ni reducir sus objetivos táctiles. El botón flotante desaparece durante la selección y queda cubierto por los overlays para no competir con una tarea modal.

La primera vez que están disponibles los gestos, un aviso temporal explica ambas direcciones. Favoritos, descartes y restauraciones ofrecen `Deshacer`. En escritorio, restaurar directamente una colección descartada grande solicita confirmación. En móvil, la misma operación se realiza entrando en selección, marcando todos los resultados y restaurando el lote.

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

El usuario puede elegir uno de los conjuntos disponibles. Los archivos incluidos marcan el esquema de referencia para incorporar otros conjuntos compatibles.

## Búsqueda y filtros

Cada idioma dispone de su propio campo de búsqueda, pero ambos campos filtran un único conjunto compartido. El resultado aplica la intersección de las dos consultas y muestra siempre las dos expresiones del mismo `AtomicSemordnilap` en una fila común.

Por ejemplo, una búsqueda en español reduce simultáneamente la columna gallega a sus correspondencias. Una consulta posterior en gallego se aplica únicamente a ese conjunto ya reducido. Las dos columnas comparten desplazamiento y nunca pierden la alineación.

Cada campo interpreta su contenido como una consulta continua. La búsqueda actual admite:

- diferencias de mayúsculas, minúsculas y tildes;
- expresiones con espacios y coincidencias parciales;
- consulta sobre el texto visible y la forma normalizada.

Cuando no hay una ordenación explícita, una consulta muestra primero la coincidencia exacta, después las expresiones que empiezan por ella y finalmente las coincidencias parciales. El fragmento visible se resalta sin perder sus diacríticos. Una ordenación elegida por el usuario sustituye esa prioridad.

Cada cabecera permite ordenar por el texto o por la longitud en caracteres. Un control recorre tres estados: ascendente, descendente y desactivado. Los criterios se acumulan según su orden de activación y muestran su prioridad numérica. Pueden combinar comparaciones de ambos idiomas, pero la fila bilingüe sigue siendo indivisible. Favoritos y composites no alteran por sí mismos el orden de `Todos`; sus indicadores permanecen en la posición correspondiente y sus vistas especializadas conservan el mismo criterio.

En móvil el panel de ordenación muestra simultáneamente `Sin orden`, la dirección ascendente y la descendente para cada criterio. Elegir una opción aplica la misma lista ordenada que utilizan los controles de escritorio, por lo que cambiar de tamaño no altera el resultado ni las preferencias guardadas.

La acción `Descubrir` selecciona hasta 24 semordnilaps atómicos activos. Nunca incluye composites, aunque estos continúan disponibles en `Todos` y `Guardados`. Si existen etiquetas activas, el descubrimiento respeta ese filtro. Una bolsa barajada entrega grupos sin repetir ninguna unidad hasta agotarse; después se vuelve a barajar. `Otro grupo` avanza por esa bolsa. Empezar una búsqueda, elegir otra vista u ordenar vuelve al catálogo normal.

El catálogo conserva todos los resultados en memoria, pero solo monta las filas visibles y un margen próximo. Esta ventana virtual mantiene la altura y la posición de desplazamiento sin crear miles de controles simultáneos.

## Estados del catálogo

Un semordnilap puede tener un único estado funcional del catálogo. La identidad persistida se compone de `datasetId`, `semordnilapId` y `status`. No contiene un lado de origen o destino porque ambos textos representan la misma unidad y la referencia ya la identifica por completo.

La interfaz utiliza actualmente dos estados:

- `favorite` muestra una estrella y permite encontrar el semordnilap en la vista de favoritos sin mover su fila;
- `discarded` lo retira de la vista activa y lo muestra en la vista de descartados.

`favorite` y `discarded` son mutuamente excluyentes. Descartar retira el favorito dentro de la misma transición y restaurar deja la unidad activa sin convertirla de nuevo en favorita. Deshacer recupera el estado completo anterior. Las copias importadas y los registros antiguos que contengan ambos valores se normalizan dando prioridad a `discarded`.

La barra del catálogo ofrece cuatro vistas compartidas:

- `Todos` reúne las unidades activas;
- `Guardados` muestra únicamente composites;
- `Favoritos` reúne las unidades activas con ese estado;
- `Descartados` muestra las unidades retiradas de la vista activa.

Descartar o restaurar una fila actualiza las dos expresiones a la vez. La vista superior `Descartados` abre la colección compartida. Desde ella se puede restaurar una unidad, seleccionar varias o restaurarlas todas. La selección múltiple también permite aplicar favoritos o descartes por lotes desde la vista activa. Después de descartar, el sistema común de avisos permite deshacer inmediatamente la operación.

La búsqueda sigue funcionando dentro de la vista activa o descartada y continúa aplicando la intersección de ambos idiomas. Restablecer los filtros elimina consultas y ordenación, pero no borra estados persistentes.

## Etiquetas personales

Las etiquetas son clasificaciones creadas por el usuario y se mantienen separadas de los estados funcionales. Cada etiqueta tiene una identidad estable, un nombre único normalizado y una apariencia formada por un color y un icono de las paletas disponibles. Las etiquetas son globales para poder reutilizarlas en distintos pares lingüísticos, mientras que cada asignación identifica el dataset y el semordnilap etiquetado.

La asignación se realiza desde la selección múltiple. Una misma etiqueta puede aplicarse a semordnilaps atómicos y composites, siempre sobre la unidad bilingüe completa. `Etiquetar` permanece deshabilitado hasta que exista una selección. Al activarlo abre un diálogo donde marcar o desmarcar etiquetas prepara una edición temporal; `Aplicar` guarda todos los cambios en una única transacción. Un botón compacto con una cruz abandona después el modo de selección sin sugerir que se revierten cambios ya aplicados.

Las filas reservan dos carriles exteriores fijos para la información de la unidad bilingüe. El extremo izquierdo muestra hasta tres iconos coloreados. El extremo derecho muestra su contador de usos y, a continuación, una estrella mostaza cuando la unidad es favorita. Ambos indicadores aparecen una sola vez. Las etiquetas adicionales se resumen mediante un contador y los nombres permanecen disponibles como información textual. Reservar los espacios incluso cuando están vacíos evita que la longitud de una palabra desplace esos indicadores.

El control `Etiquetas` filtra por cualquiera de las etiquetas seleccionadas sin romper la alineación de las columnas. Las casillas preparan el filtro y el botón `Aplicar` lo activa y cierra el desplegable. El gestor también está accesible desde el menú superior y permite crear, renombrar, cambiar el icono o el color y eliminar etiquetas. La apariencia se elige en una cuadrícula visual de opciones, no mediante selectores nativos. Eliminar una etiqueta retira sus asignaciones en todas las colecciones, pero no modifica los semordnilaps.

## Validación de una composición

El dominio valida la composición sin añadir ruido permanente al constructor. La interfaz habilita el guardado cuando el borrador puede formar un composite, pero no muestra continuamente la concatenación normalizada ni un mensaje de éxito. Un semordnilap compuesto guardable debe cumplir al menos estas condiciones:

- contiene dos o más componentes;
- todos los componentes hacen referencia a un semordnilap válido;
- la concatenación normalizada de un idioma es la inversión de la del otro;
- la estructura anidada no contiene referencias circulares.

La repetición de un componente no se considera inválida por defecto: puede ser una decisión creativa. La interfaz debe hacerla visible y permitir retirarla. Esta regla evita interpretar como error una intención que la aplicación no puede conocer.

## Guardado y reutilización

Un semordnilap compuesto válido se guarda desde una acción compacta en el encabezado del área. La creación no solicita un nombre. El título es un metadato opcional que puede cambiarse posteriormente desde la gestión del composite. El registro conserva:

- la lista ordenada de referencias a sus componentes;
- un título opcional generado o editado después del guardado;
- la fecha de creación y de última modificación.

Las expresiones resultantes se derivan de los componentes y no constituyen una fuente de verdad independiente.

Los composites guardados aparecen directamente en el catálogo con un indicador propio. Pueden buscarse, marcarse como favoritos, descartarse e insertarse como una sola pieza dentro de otra composición. La resolución recursiva conserva la procedencia atómica y comprueba la integridad antes de mostrar cada resultado.

El indicador con una nota y un lápiz es el mismo en móvil y escritorio. Abre un diálogo de gestión que identifica cada expresión mediante el nombre real de su idioma. El resumen conserva las cantidades de componentes directos y unidades atómicas, indica si el composite es favorito y muestra sus etiquetas cuando las tiene. No enumera cada componente porque esa estructura ya puede consultarse al abrir el composite como borrador. Desde el diálogo se puede:

- insertar el composite en la posición activa;
- abrir sus componentes directos como nuevo borrador, con confirmación si sustituye trabajo existente;
- cambiar el título sin modificar la identidad ni la estructura;
- exportar una copia de seguridad;
- revisar qué composites dependen de él y eliminarlo cuando no queden referencias.

La eliminación calcula dependencias directas y transitivas. Si existen composites derivados, el mismo diálogo los enumera y pide eliminarlos primero. Si un borrador utiliza el composite, la operación permanece bloqueada hasta que el usuario retire manualmente esa referencia. En ninguno de estos casos se abre una confirmación que no pueda completarse. Cuando el composite ya no tiene dependencias, aparece un diálogo central de confirmación antes de eliminarlo. La capa de aplicación aplica la misma política y la transacción vuelve a calcular el plan antes de escribir, por lo que un cambio concurrente cancela la operación.

La edición estructural no modifica un composite guardado. Abrirlo como borrador y guardar otra construcción produce una identidad nueva o reutiliza otra ya existente.

La identidad de un composite se deriva de la secuencia expandida de componentes atómicos. Guardar de nuevo la misma construcción no crea un duplicado. La estructura guardada es inmutable, aunque su título puede cambiar. Por tanto, una composición nueva no puede modificar indirectamente otra ya guardada ni introducir referencias circulares.

## Persistencia y exportación

La aplicación no requiere cuenta ni servidor. Guarda en el navegador los estados del catálogo, las etiquetas, un borrador por dataset y los composites. Los datasets incluidos se sirven como archivos estáticos y no se duplican en la base de datos local.

El conjunto lingüístico seleccionado se conserva como estado ligero de sesión en `localStorage`. Al recargar se valida que siga perteneciendo al catálogo disponible antes de restaurarlo. Esta preferencia no forma parte de los datos personales ni de la copia de seguridad, y un fallo o bloqueo del almacenamiento no impide utilizar la aplicación.

La base tiene una versión explícita y las actualizaciones conservan las tablas anteriores mediante migraciones aditivas. Los identificadores atómicos son estables aunque una fila cambie de posición en el TSV. Los estados guardados con los identificadores antiguos se convierten dentro de una transacción cuando se carga cada dataset.

El menú de la barra superior separa `Datos` y `Preferencias` e incluye un acceso directo al gestor de etiquetas. La sección de datos resume el almacenamiento local y permite exportar una copia JSON versionada. La copia contiene estados, composites, borradores, etiquetas, asignaciones y preferencias, pero no duplica los TSV incluidos.

Antes de importar se analiza todo el archivo y se muestra un resumen. El usuario puede combinarlo con los datos actuales o sustituirlos, decidir cómo resolver conflictos de borradores y excluir las preferencias. La validación comprueba formato, versión, datasets, identificadores, referencias, ciclos e integridad de composites. Solo después se reemplazan las tablas dentro de una única transacción. La aplicación descarga automáticamente una copia del estado anterior antes de confirmar la escritura.

Las preferencias permiten recordar por dataset las búsquedas, el modo del catálogo y la combinación ordenada de criterios. También pueden recordar si el área de composición está plegada. Restablecerlas no modifica favoritos, descartados, borradores ni composites.

Una futura ampliación podría añadir sincronización entre dispositivos, colecciones compartidas y colaboración. Estas posibilidades no forman parte de la especificación actual.
