# ADR 0008: Interfaz adaptable para móvil

- Estado: aceptado
- Fecha: 2026-08-07

## Contexto

La pantalla principal nació para una ventana más ancha que alta. En un dispositivo Android estrecho, el selector lingüístico ocupaba una fila completa, los controles de composición conservaban etiquetas largas, la ordenación competía con los títulos y algunos diálogos podían quedar recortados por sus contenedores. Reducir todos los elementos de forma proporcional habría creado objetivos difíciles de pulsar.

Una página móvil independiente duplicaría la coordinación del catálogo, la composición, las preferencias y los overlays. Esa duplicación podría producir comportamientos distintos según el dispositivo y aumentaría el coste de cada nueva función.

## Decisión

La aplicación conserva una sola `WorkspacePage`, los mismos hooks y los mismos casos de uso. La adaptación pertenece a presentación y utiliza dos modos: `wide` y `compact`. `useResponsiveLayout` observa la consulta compartida de 560 píxeles mediante `useSyncExternalStore` y comunica el modo a los componentes que necesitan una representación distinta.

Los cambios de representación respetan contratos comunes:

- `DatasetPicker` muestra el selector habitual en modo amplio y un botón con los códigos lingüísticos en modo compacto;
- `DatasetPickerDialog` permite cambiar el conjunto desde una hoja inferior y llama al mismo comando de selección;
- `CompositionToolbar` recibe capacidades y comandos, utiliza texto e iconos en escritorio y conserva solo los iconos visibles en móvil;
- `CatalogViewSwitcher` mantiene juntas y ordenadas las cuatro vistas del catálogo;
- `CatalogSortControl` recorre criterios mediante botones en escritorio y ofrece las tres direcciones en un diálogo móvil;
- las cabeceras colocan el contador antes del menú de tres puntos, que queda alineado al extremo derecho;
- `catalog-sort` contiene las funciones puras utilizadas por las dos representaciones para conservar prioridades y combinaciones.

La barra compacta del catálogo contiene una sola fila desplazable con `Todos`, `Guardados`, `Favoritos`, `Descartados` y `Etiquetas`. Si existe alguna consulta, ordenación o etiqueta activa, un icono de restablecimiento aparece al final de esa misma fila. La pestaña activa ya comunica la vista, por lo que no se repite mediante otro mensaje.

`Descubrir` se separa de la barra y se representa mediante un botón flotante circular con dados. Conserva 56 píxeles de superficie, respeta las zonas seguras y el listado reserva espacio inferior para no ocultar resultados. El botón desaparece durante la selección y no compite visualmente con overlays. `Seleccionar` deja de ocupar espacio permanente porque la pulsación prolongada abre ese modo; el menú superior mantiene una entrada accesible alternativa. `Restaurar todos` permanece en escritorio, mientras que en móvil se sustituye por selección múltiple y selección global.

En selección múltiple, una casilla triestado actúa sobre el resultado filtrado completo, incluidas las filas que la virtualización no ha montado. Después aparece el recuento flexible. Las acciones de favorito, descarte o restauración y etiquetado se anclan al extremo derecho y conservan su posición cuando cambia el número. Favorito se oculta en `Descartados`, donde es incompatible. Sus nombres siguen siendo accesibles, pero muestran únicamente una estrella, una papelera o flecha y una etiqueta. La cruz de cierre queda separada al final. El trazo de la cruz es pequeño y discreto, pero su superficie táctil sigue midiendo al menos 44 píxeles.

Una pulsación prolongada sobre cualquiera de las dos expresiones de una fila activa la selección múltiple y deja seleccionada esa unidad bilingüe. La misma máquina de estados distingue el toque breve, el scroll vertical y el desplazamiento horizontal. El toque breve conserva su función de añadir a la composición y se suprime cualquier clic generado después de otro gesto.

En móvil, el centro de una fila atómica activa muestra dos cheurones no interactivos. Una fila composite activa sitúa entre ellos una nota con lápiz y tocarla abre directamente su gestión. En `Descartados`, el centro muestra únicamente un cheurón izquierdo y no ejecuta ninguna acción. Ya no existe una hoja intermedia. Deslizar revela un fondo con icono y etiqueta: en vistas activas la derecha cambia el favorito y la izquierda descarta; en `Descartados` solo la izquierda restaura. La decisión completa se registra en el ADR 0009.

La lista integra visualmente ambas columnas sin convertirlas en una única cabecera. Cada fila carece de redondeado y borde central, y usa un fondo continuo del violeta al mostaza. La cabecera separa sus controles mediante una línea vertical y reduce el ancho de ese canal en móvil. La selección cambia el fondo de la fila de forma discreta en vez de dibujar un contorno. La información compartida se representa una sola vez: las etiquetas ocupan el carril exterior izquierdo y el contador de usos el derecho. Ambos espacios conservan su anchura para que textos de distinta longitud no los desplacen.

El filtro móvil de etiquetas utiliza `AnchoredPopover`: se monta en `document.body` para escapar del overflow horizontal, calcula su posición bajo el botón y se recoloca ante scroll, redimensionado o cambios del viewport visual. No usa un fondo modal y se cierra al aplicar, pulsar fuera o usar Escape.

El área mantiene su tamaño y el título corto `Compón`. Comienza expandida en ambos modos, salvo que una preferencia explícita recuerde otro estado. La flecha para plegarla se presenta en móvil como un trazo pequeño y discreto, pero conserva un objetivo táctil de 44 píxeles. Los avisos ordinarios del guardado local dejan de mostrarse como una línea visible y permanecen como una región viva para tecnologías de asistencia. Los errores de persistencia siguen visibles. Las acciones principales usan objetivos de 44 píxeles en modo compacto y conservan nombres accesibles aunque su texto no se vea.

`ModalDialog` utiliza un portal a `document.body`. En móvil se presenta como una hoja inferior, limita su altura con unidades dinámicas, contiene su propio scroll y respeta las zonas seguras. Las confirmaciones breves y decisivas pueden solicitar la variante centrada sin crear otro sistema modal. El portal evita recortes causados por el scroll u `overflow` de la página. La coordinación superior representa menú, selector y gestor de etiquetas como estados excluyentes, de modo que no se solapen por accidente.

La página usa `100dvh`. El catálogo conserva el desplazamiento vertical. En el área de composición, únicamente las dos frases pertenecen al viewport horizontal compartido; los títulos de idioma y las herramientas son elementos hermanos fijos. Los límites de ancho del viewport evitan que una secuencia larga desplace la página. En móvil la columna de esos títulos tiene un límite explícito para que su tamaño intrínseco nunca ensanche el grid.

Cuando las frases superan el ancho disponible, `CompositionPhrasesViewport` muestra bajo ellas un deslizador táctil fino con un tirador circular. Su recorrido representa exactamente `scrollWidth - clientWidth`, actualiza el mismo `scrollLeft` que utilizan el gesto directo, el teclado y el auto-scroll del arrastre, y desaparece cuando todo el contenido cabe. El inspector léxico conserva ambos idiomas en dos columnas también en móvil, de modo que abrirlo revela las dos colecciones en una sola interacción.

Los avisos flotantes se separan del pie y de la zona segura. No se modifica el dominio, los casos de uso, los puertos, IndexedDB ni el formato de las copias.

## Verificación

Las funciones de ordenación tienen pruebas unitarias para combinación, prioridad, retirada y ciclo. El control compacto se prueba como interacción completa. La prueba de la página simula la consulta de medios, cambia el dataset desde la hoja móvil, comprueba los comandos de composición mediante iconos, entra en selección mediante una pulsación prolongada y desde el menú, verifica la casilla triestado, ejecuta gestos laterales y comprueba la restauración por gesto. El estado normal de persistencia no ocupa una barra visible.

Los diálogos tienen pruebas específicas para portal, foco, Escape y cierre mediante fondo. El filtro de etiquetas comprueba por separado el anclaje, el portal, la aplicación y el cierre exterior. La respuesta a cambios de la consulta de medios también se comprueba de forma aislada. La validación automatizada se completa con tipos, lint, formato, pruebas y construcción.

El viewport de composición verifica además que el deslizador no exista sin overflow, que aparezca con el recorrido calculado y que su movimiento actualice el desplazamiento compartido. El inspector comprueba que ambos idiomas queden visibles tras una única apertura.

## Consecuencias

- Móvil y escritorio no pueden divergir en reglas de composición, filtrado u ordenación.
- Una nueva variante visual puede reutilizar comandos sin introducir una segunda página.
- Las acciones principales resultan pulsables sin aumentar la altura del área de trabajo.
- El catálogo móvil recupera una fila vertical completa y mantiene una vía accesible hacia la selección.
- La selección por pulsación prolongada ahorra un toque sin impedir el desplazamiento normal del catálogo.
- Las acciones frecuentes pueden ejecutarse con un gesto y conservan una alternativa textual accesible.
- Los overlays dejan de depender del árbol de overflow que los abrió.
- La consulta de medios existe tanto en TypeScript como en CSS y debe mantenerse en 560 píxeles hasta que una medición justifique otro límite.
- Las diferencias de barras, teclado virtual y entrada táctil entre navegadores todavía requieren comprobación manual en dispositivos reales.
