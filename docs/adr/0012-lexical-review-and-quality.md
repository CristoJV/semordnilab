# ADR 0012: revisión léxica y calidad de candidatos

- Estado: aceptado
- Fecha: 2026-10-04

## Contexto

La lista inicial de filtros reutilizaba una clave sin diacríticos para buscar, identificar y excluir palabras. Esa simplificación unía grafías con significados distintos, como `si` y `sí`, e impedía registrar que una palabra ya había sido revisada y aceptada. La revisión también necesita consultar fuentes léxicas sin convertir el contenido de terceros en una dependencia de la aplicación.

## Decisión

La identidad de una palabra conserva diacríticos y letras propias de cada idioma. Se normaliza con Unicode NFKC, unificación de apóstrofos y minúsculas. La búsqueda utiliza una proyección separada que elimina marcas combinantes y admite coincidencias aproximadas.

Las decisiones léxicas tienen tres estados de trabajo: pendiente, verificada y excluida. Pendiente se deriva del vocabulario y no necesita persistencia; verificada y excluida se almacenan por idioma y clave exacta. Solo las excluidas eliminan semordnilaps del catálogo.

La consulta de diccionarios se implementa mediante proveedores declarativos de enlaces profundos. La interfaz los identifica de forma compacta como `RAE (ES)`, `RAG (GL)` y `AdC (PT)`; portugués utiliza únicamente el Diccionario de la Academia de Ciencias de Lisboa. La aplicación no extrae ni reproduce definiciones de terceros sin una API y licencia adecuadas. La acción de consulta es explícita y accesible; un doble clic puede ser un atajo, pero nunca la única vía.

La revisión utiliza rutas hash propias, sin incorporar un router. `pending`, `verified` y `excluded` forman parte de la URL; abrir la revisión añade historial y cambiar de colección reemplaza la entrada actual. La activación de exclusiones se guarda por dataset dentro de las preferencias personales.

Los metadatos existentes de frecuencia, tamaño del n-grama y puntuación de pareja se consideran señales de calidad del catálogo. Se utilizan para ordenar sin alterar el dataset original. La política de filtrado reversible se conserva, pero su control explícito se retira provisionalmente de la barra para priorizar espacio.

Los filtros de calidad son efímeros y reversibles. Los composites no tienen estos metadatos, por lo que permanecen visibles y se ordenan después de los resultados medibles. La vista `Guardados` continúa siendo la biblioteca canónica: busca tanto expresiones como títulos y permite insertar o abrir cada composite. La composición incorpora un inspector derivado, sin persistencia adicional, que enumera palabras únicas de ambos resultados.

## Consecuencias

- Las búsquedas continúan ignorando tildes, pero las decisiones ya no mezclan palabras distintas.
- IndexedDB pasa a versión 8: la versión 7 recalcula claves desde la grafía visible y la 8 marca como excluidas las decisiones históricas.
- El backup pasa a versión 6 y conserva estados de revisión y filtros activos; las versiones anteriores se migran como exclusiones.
- Las escrituras de revisión se ejecutan inmediatamente y se serializan; la animación deja de gobernar la persistencia.
- Los diccionarios permanecen como recursos externos reemplazables y no contaminan dominio ni persistencia.
- Los enlaces directos sustituyen al doble clic como vía principal: son descubribles, compatibles con teclado y no dependen de temporización táctil.
- La calidad es una proyección reversible: no reescribe frecuencias, puntuaciones ni expresiones.
- La activación de exclusiones se controla localmente en la cabecera de cada idioma, junto a su contador.
- El inspector y la revisión comparten la misma política declarativa de proveedores de diccionario.
