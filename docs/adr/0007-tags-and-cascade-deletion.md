# ADR 0007: Etiquetas y eliminación en cascada

## Contexto

Los favoritos y descartes permiten acciones concretas, pero no sirven para organizar libremente una colección. Los usuarios necesitan clasificaciones personales reutilizables sin convertir cada clasificación en un nuevo estado funcional.

La eliminación de composites ya protegía las referencias directas, aunque solo devolvía cantidades y obligaba a eliminar manualmente cada derivado. Como los composites forman un grafo dirigido acíclico, eliminar una raíz exige considerar también todas las unidades que dependen de ella de forma transitiva.

Ambas ampliaciones deben preservar las bases IndexedDB existentes y viajar en las copias de seguridad.

## Decisión

### Etiquetas

Una etiqueta es una entidad global con identidad estable, nombre normalizado único, color e icono de paletas cerradas y fechas. La relación `SemordnilapTagAssignment` contiene `datasetId`, `semordnilapId`, `tagId` y la fecha de asignación. No contiene un lado lingüístico porque el semordnilap es una unidad bilingüe indivisible.

Los estados funcionales y las etiquetas permanecen separados. Favorito y descartado determinan vistas y acciones, mientras que las etiquetas solo clasifican y filtran. La selección múltiple permite preparar varias modificaciones y aplicarlas mediante una única escritura transaccional. Su acción permanece deshabilitada sin elementos seleccionados y abre un diálogo propio. El filtro conserva una selección temporal hasta que `Aplicar` la activa y cierra su panel.

El catálogo muestra iconos compactos y coloreados en un espacio fijo y combina con una operación inclusiva las etiquetas elegidas en el filtro.

El gestor permite crear, renombrar, cambiar la combinación visual y eliminar etiquetas. Los colores aparecen como círculos y los iconos como una cuadrícula visual. El gestor está disponible tanto desde el catálogo como desde el menú superior. Eliminar una definición retira todas sus asignaciones dentro de la misma transacción, sin modificar unidades atómicas ni composites.

### Eliminación de composites

Antes de confirmar, un caso de uso obtiene un `CompositeDeletionPlan` con la raíz, los dependientes directos, el cierre transitivo de dependientes y los borradores afectados. La presentación muestra los composites del plan en el mismo diálogo de gestión.

Un borrador afectado bloquea la operación. La aplicación no lo modifica automáticamente. Al confirmar, la infraestructura vuelve a calcular el plan dentro de una transacción. Si la raíz ha desaparecido, aparece una referencia nueva o cambia el conjunto de dependencias, la transacción se cancela y solicita una nueva revisión.

Cuando el plan sigue vigente se eliminan la raíz, todos sus derivados, sus estados y sus asignaciones de etiquetas. Los registros no relacionados permanecen intactos.

### Persistencia y copias

La versión 4 de IndexedDB añade `tags` y `semordnilapTags` sin cambiar los esquemas anteriores. No necesita una transformación de registros porque ambas tablas comienzan vacías. Las pruebas actualizan bases de versión 3 y verifican que el contenido anterior se conserva.

La versión 5 añade el icono a la definición sin cambiar índices ni asignaciones. La migración escribe el icono neutro `tag` únicamente en etiquetas que todavía no lo tienen. Las pruebas parten de una base de versión 4 con una etiqueta asignada y comprueban que ambos registros sobreviven.

La versión 2 de la copia personal incluye definiciones y asignaciones. La versión 3 incorpora el icono. El importador continúa aceptando las versiones 1 y 2; una etiqueta de versión 2 recibe el icono neutro. En modo de combinación, una etiqueta importada se reconcilia primero por identidad y después por nombre normalizado. Las asignaciones se remapean y se unen sin duplicados.

## Consecuencias

- Las clasificaciones personales pueden crecer sin ampliar el enum de estados.
- Un mismo vocabulario de etiquetas puede reutilizarse en todos los datasets.
- La altura fija de las filas se conserva y el renderizado virtual no cambia.
- Las eliminaciones no dejan composites, estados o etiquetas huérfanos.
- Los borradores nunca se modifican como efecto secundario de una cascada.
- Las bases y copias anteriores continúan siendo compatibles.
