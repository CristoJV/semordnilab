# ADR 0010: Gestión compacta y eliminación segura de composites

- Estado: aceptado
- Fecha: 2026-08-07

## Contexto

El diálogo de un composite guardado enumeraba todos sus componentes además de mostrar sus cantidades. Esa repetición ocupaba espacio sin sustituir la vista estructural que ya ofrece `Abrir como borrador`. Sus expresiones también se presentaban bajo las etiquetas genéricas `Origen` y `Destino`, aunque el dataset conoce los nombres de los idiomas.

La eliminación enseñaba un mensaje de ausencia de derivados dentro del diálogo y ofrecía una cascada cuando sí existían dependencias. Esta secuencia mezclaba inspección, bloqueo y confirmación. Una confirmación debe aparecer únicamente cuando la acción ya puede completarse sin eliminar otros composites de manera implícita.

## Decisión

La gestión de un composite utiliza el mismo icono de nota con lápiz en las representaciones compacta y amplia. El diálogo muestra:

- las dos expresiones bajo los nombres reales de sus idiomas;
- las cantidades de componentes directos y unidades atómicas;
- el estado de favorito;
- las etiquetas asignadas, cuando existen.

La lista detallada de componentes se retira del resumen. `Abrir como borrador` continúa siendo la vía para inspeccionar y modificar una variante estructural.

Antes de eliminar, presentación solicita un `CompositeDeletionPlan`. Si contiene derivados, estos se enumeran y se indica que deben eliminarse primero. Si contiene borradores afectados, se pide retirar las referencias. La capa de aplicación también rechaza planes con derivados o borradores, por lo que la regla no depende del componente visual.

Solo un plan sin dependencias abre `CompositeDeletionConfirmationDialog`. Es un diálogo central, breve y reutiliza `ModalDialog` mediante su variante `centered`. Al confirmar, el repositorio vuelve a calcular el plan dentro de la transacción y cancela la escritura si el grafo ha cambiado.

El área de composición comienza expandida en escritorio y móvil. Una preferencia recordada puede plegarla. En móvil el control de plegado conserva la superficie táctil mínima, aunque el trazo visible se reduce para no competir con las acciones principales.

No cambia el esquema de IndexedDB, el formato de la copia personal ni la identidad de los composites.

## Consecuencias

- El detalle resulta más corto sin perder las dos medidas estructurales.
- Los idiomas, favoritos y etiquetas pueden reconocerse sin abrir otra vista.
- Ninguna acción visual elimina derivados de manera implícita.
- La confirmación aparece solo cuando el borrado puede completarse.
- La política se verifica en aplicación y no depende exclusivamente de React.
- La adaptación móvil reutiliza los mismos comandos y componentes que escritorio.
