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
- `catalog-sort` contiene las funciones puras utilizadas por las dos representaciones para conservar prioridades y combinaciones.

La barra del catálogo separa controles primarios y secundarios. El primer grupo contiene `Todos`, `Guardados`, `Favoritos`, `Descartados` y `Etiquetas`. El segundo comienza con `Seleccionar varios` y muestra `Restablecer` cuando existe algún filtro. Los grupos admiten desplazamiento horizontal si el ancho disponible no permite conservar tamaños táctiles seguros.

El área mantiene su tamaño y el título corto `Compón`. Los avisos ordinarios del guardado local dejan de mostrarse como una línea visible y permanecen como una región viva para tecnologías de asistencia. Los errores de persistencia siguen visibles. Las acciones principales usan objetivos de 44 píxeles en modo compacto y conservan nombres accesibles aunque su texto no se vea.

`ModalDialog` utiliza un portal a `document.body`. En móvil se presenta como una hoja inferior, limita su altura con unidades dinámicas, contiene su propio scroll y respeta las zonas seguras. El portal evita recortes causados por el scroll u `overflow` de la página. La coordinación superior representa menú, selector y gestor de etiquetas como estados excluyentes, de modo que no se solapen por accidente.

La página usa `100dvh`. El catálogo conserva el desplazamiento vertical, las secuencias largas mantienen desplazamiento horizontal y los avisos flotantes se separan del pie y de la zona segura. No se modifica el dominio, los casos de uso, los puertos, IndexedDB ni el formato de las copias.

## Verificación

Las funciones de ordenación tienen pruebas unitarias para combinación, prioridad, retirada y ciclo. El control compacto se prueba como interacción completa. La prueba de la página simula la consulta de medios, cambia el dataset desde la hoja móvil, comprueba los comandos de composición mediante iconos y verifica que el estado normal de persistencia no ocupe una barra visible.

Los diálogos tienen pruebas específicas para portal, foco, Escape y cierre mediante fondo. La respuesta a cambios de la consulta de medios también se comprueba de forma aislada. La validación automatizada se completa con tipos, lint, formato, pruebas y construcción.

## Consecuencias

- Móvil y escritorio no pueden divergir en reglas de composición, filtrado u ordenación.
- Una nueva variante visual puede reutilizar comandos sin introducir una segunda página.
- Las acciones principales resultan pulsables sin aumentar la altura del área de trabajo.
- Los overlays dejan de depender del árbol de overflow que los abrió.
- La consulta de medios existe tanto en TypeScript como en CSS y debe mantenerse en 560 píxeles hasta que una medición justifique otro límite.
- Las diferencias de barras, teclado virtual y entrada táctil entre navegadores todavía requieren comprobación manual en dispositivos reales.
