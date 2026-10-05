# ADR 0013: navegación lateral y controles compactos

- Estado: aceptado
- Fecha: 2026-10-05

## Contexto

La barra superior y la cabecera del catálogo acumulaban accesos repetidos. En móvil, las vistas escritas, el control de calidad y los filtros de palabras reducían el espacio útil y podían forzar varias filas. El menú superior separaba sus contenidos en pestañas y la edición de etiquetas abría un modal sobre otros overlays, lo que dificultaba entender la navegación.

Las acciones de composición también aparecían y desaparecían según el estado. Ese cambio alteraba la geometría de la cabecera y ocultaba por qué una operación no estaba disponible.

## Decisión

La cabecera global conserva un único botón de hamburguesa, sin las palabras `Menú` o `Filtrar` visibles. En composición muestra título y subtítulo como las demás pantallas, y agrupa el selector lingüístico junto al menú. El botón abre desde el borde derecho un drawer portado a `document.body`, sin esquinas redondeadas. Su cabecera tiene la misma altura que la global y muestra el icono de la aplicación junto a `SemordniLAB`. El contenido mantiene este orden estable: navegación (`Composición`, `Filtrado`), datos y backup, preferencias, etiquetas y un enlace `About` al repositorio. La animación traslada el panel de derecha a izquierda con una curva desacelerada y se elimina con `prefers-reduced-motion`.

La gestión de etiquetas deja de ser un diálogo. La ruta `#/tags` muestra `TagManagerPage` dentro del mismo armazón que las demás pantallas, de forma que la cabecera y el drawer siguen disponibles mientras se crea o edita una etiqueta.

La primera fila del catálogo contiene cinco accesos compactos: `Todos` conserva texto y `Guardados`, `Favoritos`, `Descartados` y `Etiquetas` utilizan iconos con nombres accesibles y ayuda nativa. Los cinco permanecen en una sola fila; los controles secundarios pueden ocupar otra. El control visible `Calidad` se retira provisionalmente, aunque las señales y la política de ordenación permanecen en el modelo. La activación del filtro léxico de cada idioma se sitúa junto a su contador, dentro de la cabecera de ese idioma.

La barra de composición mantiene siempre visibles plegado, deshacer, rehacer, guardar y vaciar. Comparten fondo transparente y texto violeta; un violeta claro comunica el estado deshabilitado sin mover controles. Guardar se deshabilita cuando la composición no es válida, está en proceso o su identidad ya existe. Vaciar se deshabilita cuando no hay componentes. El título interior `Compón` se retira y su lugar lo ocupa `Revisar palabras` solo cuando la composición contiene vocabulario.

## Consecuencias

- El espacio vertical y horizontal del catálogo se dedica principalmente a resultados y búsquedas.
- La navegación global tiene una única entrada estable en todas las pantallas.
- Crear o editar etiquetas no produce modales apilados.
- Los iconos dependen de nombres accesibles y `title`; añadir uno nuevo exige conservar ambos.
- La capacidad de calidad continúa disponible en el código para una futura representación, pero no tiene control visible.
- Los diálogos de tareas breves continúan como hojas inferiores en móvil; el menú es un drawer y la gestión de etiquetas es una página.
