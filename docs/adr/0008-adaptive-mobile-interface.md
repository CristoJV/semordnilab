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

La barra del catálogo separa controles primarios y secundarios. El primer grupo contiene `Todos`, `Guardados`, `Favoritos`, `Descartados` y `Etiquetas`. El segundo comienza con `Descubrir`, continúa con `Seleccionar`, muestra `Restablecer` cuando existe algún filtro y termina con `Restaurar todos` en la vista de descartados. La pestaña activa ya comunica esa vista, por lo que no se repite mediante un mensaje adicional. Los grupos admiten desplazamiento horizontal si el ancho disponible no permite conservar tamaños táctiles seguros.

En selección múltiple, las acciones de favorito, descarte y etiquetado conservan sus nombres accesibles, pero muestran únicamente una estrella, una papelera y una etiqueta en modo compacto. Las tres acciones forman un grupo visual continuo, mientras que la cruz de cierre queda separada y pegada al extremo derecho. El trazo de la cruz es pequeño y discreto, pero su superficie táctil sigue midiendo al menos 44 píxeles.

Una pulsación prolongada sobre cualquiera de las dos expresiones de una fila activa la selección múltiple y deja seleccionada esa unidad bilingüe. La misma máquina de estados distingue el toque breve, el scroll vertical y el desplazamiento horizontal. El toque breve conserva su función de añadir a la composición y se suprime cualquier clic generado después de otro gesto.

En móvil, el centro de una fila ordinaria muestra dos cheurones. Una fila composite sitúa entre ellos una nota con lápiz que sustituye al símbolo de agrupación. Tocar el conjunto abre una hoja con acciones textuales y la gestión del composite. Deslizar revela un fondo con icono y etiqueta: derecha cambia el favorito e izquierda descarta o restaura. La decisión completa se registra en el ADR 0009.

El filtro móvil de etiquetas utiliza `AnchoredPopover`: se monta en `document.body` para escapar del overflow horizontal, calcula su posición bajo el botón y se recoloca ante scroll, redimensionado o cambios del viewport visual. No usa un fondo modal y se cierra al aplicar, pulsar fuera o usar Escape.

El área mantiene su tamaño y el título corto `Compón`. Los avisos ordinarios del guardado local dejan de mostrarse como una línea visible y permanecen como una región viva para tecnologías de asistencia. Los errores de persistencia siguen visibles. Las acciones principales usan objetivos de 44 píxeles en modo compacto y conservan nombres accesibles aunque su texto no se vea.

`ModalDialog` utiliza un portal a `document.body`. En móvil se presenta como una hoja inferior, limita su altura con unidades dinámicas, contiene su propio scroll y respeta las zonas seguras. El portal evita recortes causados por el scroll u `overflow` de la página. La coordinación superior representa menú, selector y gestor de etiquetas como estados excluyentes, de modo que no se solapen por accidente.

La página usa `100dvh`. El catálogo conserva el desplazamiento vertical, las secuencias largas mantienen desplazamiento horizontal y los avisos flotantes se separan del pie y de la zona segura. No se modifica el dominio, los casos de uso, los puertos, IndexedDB ni el formato de las copias.

## Verificación

Las funciones de ordenación tienen pruebas unitarias para combinación, prioridad, retirada y ciclo. El control compacto se prueba como interacción completa. La prueba de la página simula la consulta de medios, cambia el dataset desde la hoja móvil, comprueba los comandos de composición mediante iconos, entra en selección mediante una pulsación prolongada, ejecuta gestos laterales y verifica que el estado normal de persistencia no ocupe una barra visible.

Los diálogos tienen pruebas específicas para portal, foco, Escape y cierre mediante fondo. El filtro de etiquetas comprueba por separado el anclaje, el portal, la aplicación y el cierre exterior. La respuesta a cambios de la consulta de medios también se comprueba de forma aislada. La validación automatizada se completa con tipos, lint, formato, pruebas y construcción.

## Consecuencias

- Móvil y escritorio no pueden divergir en reglas de composición, filtrado u ordenación.
- Una nueva variante visual puede reutilizar comandos sin introducir una segunda página.
- Las acciones principales resultan pulsables sin aumentar la altura del área de trabajo.
- La selección por pulsación prolongada ahorra un toque sin impedir el desplazamiento normal del catálogo.
- Las acciones frecuentes pueden ejecutarse con un gesto y conservan una alternativa textual accesible.
- Los overlays dejan de depender del árbol de overflow que los abrió.
- La consulta de medios existe tanto en TypeScript como en CSS y debe mantenerse en 560 píxeles hasta que una medición justifique otro límite.
- Las diferencias de barras, teclado virtual y entrada táctil entre navegadores todavía requieren comprobación manual en dispositivos reales.
