# Plan 0011: filtros de palabras por idioma

- Estado: completado
- Fecha: 2026-10-04
- Alcance: vocabulario de los datasets incluidos, listas personales por idioma y exclusión de semordnilaps en el catálogo

## Objetivo

Añadir una vista rápida, táctil y accesible para marcar palabras inválidas por idioma, recuperar marcas accidentales y usar esas listas como filtros opcionales del catálogo. Las listas deben persistir en el navegador y formar parte de la copia de seguridad personal.

Una palabra filtrada excluye cualquier semordnilap cuya expresión del idioma correspondiente contenga esa palabra como token completo. Cada idioma se puede activar de forma independiente; no es necesario que los dos lados del dataset tengan filtros activos.

## Decisiones de alcance

- El vocabulario se deriva del dataset seleccionado y se agrupa por código de idioma. En un dataset monolingüe se combinan ambos lados sin duplicados.
- La identidad de una palabra usa una normalización Unicode común; el texto original se conserva para presentarlo.
- La búsqueda de la vista de palabras tolera acentos y coincidencias parciales o no contiguas, y ordena primero las coincidencias más cercanas.
- La navegación se resuelve dentro de la SPA sin incorporar un router: la cabecera conserva su posición y cambia sus controles según la vista.
- La activación de filtros pertenece a la sesión de trabajo. Las listas personales sí son persistentes y exportables.

## Fase 1 — Modelo, persistencia y backup

- [x] Escribir pruebas de normalización, vocabulario, repositorio Dexie y evolución del backup.
- [x] Definir el registro y el puerto de filtros de palabras, con casos de uso para listar, añadir y recuperar.
- [x] Migrar IndexedDB a la versión 6 con una tabla indexada por idioma y palabra normalizada.
- [x] Incluir los filtros en exportación, validación, combinación, reemplazo y resumen de copias; mantener compatibilidad con versiones 1–3.
- [x] Ejecutar las pruebas de la fase y actualizar arquitectura/documentación.

Resultado: 29 pruebas de aplicación e infraestructura superadas. El formato de backup pasa a versión 4 y las versiones 1–3 se migran con una lista vacía.

## Fase 2 — Política de filtrado y aplicación al catálogo

- [x] Escribir pruebas para coincidencia por token, independencia por idioma y semordnilaps compuestos.
- [x] Implementar funciones puras para decidir si un semordnilap contiene palabras filtradas.
- [x] Cargar las listas en presentación y añadir controles compactos para activar cada idioma disponible.
- [x] Excluir del catálogo los resultados que coincidan, conservando intactos borradores y datos guardados.
- [x] Ejecutar las pruebas de la fase y actualizar el ADR y este plan.

Resultado: 34 pruebas de aplicación y presentación superadas. La coincidencia exige tokens completos y los dos idiomas se pueden activar de forma independiente.

## Fase 3 — Navegación y vista interactiva de palabras

- [x] Escribir pruebas de búsqueda aproximada, navegación, filtrado, recuperación y exportación.
- [x] Reutilizar una única vista para los modos `Filtrar palabras` y `Recuperar palabras`.
- [x] Añadir selector de idioma, buscador, rejilla multicolumna, contadores, estados vacío/carga/error y acciones táctiles.
- [x] Aplicar transición roja al filtrar y verde al recuperar, respetando `prefers-reduced-motion`.
- [x] Conectar el acceso `Filtrar` en la cabecera, el regreso al espacio de composición y la exportación de backup.
- [x] Ejecutar la batería completa (`format:check`, `lint`, `typecheck`, tests y build) y cerrar documentación.

Resultado: 152 pruebas superadas en 35 archivos, incluida la migración directa desde IndexedDB 5. Formato, lint, tipos y build de producción finalizan correctamente.

## Criterios de aceptación

- Las palabras se pueden filtrar y recuperar con un toque tanto en escritorio como en móvil.
- Ambas listas permiten búsqueda aproximada sobre todo el vocabulario correspondiente.
- La misma estructura visual y los mismos componentes sirven para filtrar y recuperar.
- Los filtros activos eliminan del catálogo todo semordnilap que contenga al menos una palabra marcada en el idioma correspondiente.
- Español y el segundo idioma se activan o desactivan por separado.
- Las listas sobreviven a una recarga y a una exportación/importación de backup.
- Las copias antiguas siguen siendo importables.
- La cabecera no cambia de posición al navegar entre composición y filtros.
