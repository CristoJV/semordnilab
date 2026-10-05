# Plan 0012: revisión léxica y flujo de calidad

- Estado: completado
- Fecha: 2026-10-04
- Alcance: identidad lingüística, revisión de vocabulario, diccionarios, filtros de calidad y asistencia a la composición

## Objetivo

Convertir el filtrado de palabras en un flujo de revisión léxica fiable y trazable. Una palabra debe poder quedar pendiente, verificada o excluida sin confundir grafías con diacríticos. La revisión debe mostrar su impacto, ofrecer enlaces de diccionario por idioma, conservarse en el backup y alimentar controles de calidad del catálogo y de la composición.

## Fase 1 — Integridad y robustez del modelo

- [x] Escribir pruebas que separen identidad exacta y búsqueda tolerante a diacríticos.
- [x] Migrar las decisiones léxicas existentes sin perder filtros guardados.
- [x] Validar idiomas, palabras y magnitudes de datasets y backups.
- [x] Eliminar carreras y temporizadores de persistencia en la revisión.
- [x] Resolver la carga de datasets vacíos.
- [x] Ejecutar pruebas, tipos, lint y build.
- [x] Actualizar ADR, README y documentación técnica.

Resultado: la identidad conserva diacríticos, la búsqueda sigue plegándolos, IndexedDB 7 y backup 5 migran los filtros existentes, las mutaciones se serializan y 157 pruebas superan la verificación de la fase.

## Fase 2 — Revisión léxica completa y consulta de diccionarios

- [x] Escribir pruebas de los estados pendiente, verificada y excluida.
- [x] Reutilizar una sola pantalla para las tres colecciones.
- [x] Añadir impacto, ejemplos, deshacer, foco accesible y acciones rápidas.
- [x] Añadir enlaces profundos de diccionario para español, gallego y portugués.
- [x] Incorporar navegación recuperable mediante URL e historial.
- [x] Persistir la activación de filtros por dataset.
- [x] Ejecutar la batería completa y actualizar documentación.

Resultado: una única revisión presenta pendientes, verificadas y excluidas, calcula el impacto con ejemplos, conserva el foco, permite deshacer y abre RAE, RAG o AdC según el idioma. Las rutas `#/words/...` sobreviven a recarga y navegación, la activación por dataset es una preferencia personal, IndexedDB 8 y backup 6 conservan todos los estados. La fase supera 164 pruebas y el build de producción.

## Fase 3 — Calidad del catálogo y asistencia a la composición

- [x] Escribir pruebas de filtros y ordenación por frecuencia, tamaño y puntuación.
- [x] Añadir controles de calidad al catálogo y mostrar el impacto de filtros activos.
- [x] Añadir un inspector léxico de la composición con accesos al diccionario.
- [x] Mejorar la biblioteca de composiciones guardadas para buscar y reutilizar resultados.
- [x] Ejecutar las comprobaciones de accesibilidad disponibles, pruebas, formato, lint, tipos y build.
- [x] Cerrar ADR, plan, README y documentación de producto y arquitectura.

Resultado: el catálogo filtra por frecuencias mínimas, máximo de palabras y puntuación mínima, y ordena esas tres señales desde cualquiera de los idiomas. La barra informa de los resultados ocultos por exclusiones. La composición ofrece un inspector de palabras únicas con los mismos diccionarios. `Guardados` mantiene buscables los títulos y expresiones, conserva composites sin metadatos al aplicar calidad y ofrece un vacío específico. No hay motor axe instalado; las comprobaciones disponibles cubren nombres, roles, foco, teclado y enlaces mediante Testing Library. El cierre supera 167 pruebas.

## Criterios de aceptación

- Las tildes, la `ñ` y la `ç` forman parte de la identidad de una palabra.
- La búsqueda continúa siendo tolerante a diacríticos y aproximada.
- Las decisiones verificadas y excluidas sobreviven a recarga y backup.
- No hay escrituras diferidas únicamente para sostener una animación.
- Cada palabra puede abrir el diccionario correspondiente sin depender de doble toque.
- El usuario conoce cuántos semordnilaps afecta una exclusión.
- La navegación de revisión funciona con atrás, recarga y enlaces directos.
- El catálogo puede reducir candidatos utilizando los metadatos de calidad existentes.
- La composición permite revisar las palabras resultantes y consultar sus diccionarios.

## Verificación final prevista

```text
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
```

Verificación ejecutada al completar las tres fases: formato, lint y tipos sin avisos; 38 archivos con 167 pruebas; build Vite de producción correcto.

## Ajuste posterior — composición móvil

- [x] Impedir que los títulos de idioma ensanchen la pantalla compacta.
- [x] Mostrar un deslizador táctil compartido sólo cuando la composición desborda.
- [x] Abrir simultáneamente los dos idiomas del inspector léxico.
- [x] Simplificar `Filtrar palabras` en la cabecera a una acción textual sin borde.
- [x] Mantener transiciones breves y respetar `prefers-reduced-motion`.
- [x] Añadir pruebas específicas y repetir la verificación completa.

Resultado: 39 archivos con 168 pruebas, formato, lint y tipos sin avisos, y build Vite de producción correcto.

## Corrección posterior — equilibrio e inspector flotante

- [x] Restaurar dos mitades reales 50/50 en cabecera y filas del catálogo.
- [x] Superponer las acciones centrales sin convertirlas en un tercer track.
- [x] Abrir la revisión léxica en un popover que no desplaza la composición.
- [x] Mostrar ambos idiomas en dos columnas y limitar cada lista a cinco filas con scroll.
- [x] Reducir los proveedores visibles a `RAE (ES)`, `RAG (GL)` y `AdC (PT)`.
- [x] Cubrir por prueba el portal, el reparto de columnas, el overflow y la política de enlaces.
- [x] Repetir formato, lint, tipos, pruebas completas y build de producción.

Resultado: 39 archivos con 168 pruebas, formato, lint y tipos sin avisos, y build Vite de producción correcto. Las comprobaciones de presentación validan los dos tracks iguales, el portal sin reflow, las listas desplazables de cinco filas y el proveedor único de cada idioma.
