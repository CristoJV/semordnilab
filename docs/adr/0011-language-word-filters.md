# ADR 0011: Filtros personales de palabras por idioma

- Estado: reemplazado parcialmente por ADR 0012
- Fecha: 2026-10-04

## Contexto

Los descartes existentes actúan sobre semordnilaps completos. Revisar n-gramas requiere además identificar con rapidez unigramas inválidos y excluir cualquier resultado que los contenga, sin repetir el descarte para cada pareja ni mezclar palabras de idiomas diferentes.

Las listas son datos personales locales: deben sobrevivir a una recarga, viajar en la copia de seguridad y seguir funcionando en una SPA sin backend. La interacción principal debe ser viable con ratón, teclado o toque y conservar el espacio de composición aunque se cambie de vista.

## Decisión

Cada filtro se guarda como un registro identificado por `(language, normalizedWord)`, junto con su grafía visible y fecha de creación. Desde la versión 7 de la base, la identidad usa Unicode NFKC, conserva diacríticos, unifica apóstrofos y pasa a minúsculas. La búsqueda dispone de una proyección separada sin diacríticos. La coincidencia se realiza sobre tokens completos de las expresiones visibles, no sobre subcadenas ni sobre la clave normalizada continua del semordnilap.

El vocabulario disponible se deriva de las expresiones del dataset cargado. Si ambos lados comparten idioma, sus palabras se combinan. Las listas son globales por código de idioma, de modo que una palabra española se reutiliza en todos los datasets que incluyan español.

La tabla `wordFilters` se añade en la versión 6 de IndexedDB y migra sus claves exactas en la versión 7. ADR 0012 amplía los registros con su estado en la versión 8. Los casos de uso y el puerto de aplicación aíslan Dexie de presentación. El backup personal se amplía en la versión 4, migra a la versión 5 para distinguir la nueva identidad y a la versión 6 para conservar la revisión; acepta versiones anteriores y reconstruye las claves antiguas desde la grafía visible. La importación por combinación une registros por su identidad compuesta; la sustitución reemplaza también las listas.

En el catálogo, cada idioma del dataset tiene una activación independiente y desactivada inicialmente. Un semordnilap desaparece si cualquiera de sus expresiones contiene una palabra filtrada en uno de los idiomas activos. Esta operación sólo modifica la proyección del catálogo: no borra semordnilaps, estados, composites ni componentes del borrador.

La aplicación utiliza estado de navegación interno en lugar de añadir una dependencia de routing. La misma cabecera y una única vista de palabras sirven para filtrar y recuperar; sólo cambian título, ayuda, conjunto visible y tono de la transición.

## Consecuencias

- Una lista por idioma sirve en varios pares lingüísticos y evita colisiones entre palabras homógrafas de idiomas distintos.
- La coincidencia por token impide que filtrar `mar` elimine `amar`.
- Los filtros se pueden activar en un solo lado o en ambos, y no alteran los datos que ya forman parte de una composición.
- La copia personal crece con las listas, pero sigue siendo un único JSON importable de forma atómica.
- El vocabulario depende del dataset cargado; una palabra filtrada que no aparezca en él continúa guardada y se ofrece en la vista de recuperación.
- ADR 0012 reemplaza la limitación anterior y añade rutas hash compartibles para cada colección de revisión.
