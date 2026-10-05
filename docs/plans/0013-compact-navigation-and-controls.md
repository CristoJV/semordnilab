# Plan 0013: navegación y controles compactos

- Estado: completado
- Fecha: 2026-10-05
- Alcance: cabecera, catálogo, composición, menú y gestión de etiquetas

## Objetivo

Recuperar espacio útil sin perder claridad, estabilidad ni accesibilidad, y convertir el menú y la gestión de etiquetas en una navegación coherente con una aplicación móvil.

## Fase 1 — Compactar los controles de trabajo

- [x] Mantener en una fila `Todos` y los iconos de guardados, favoritos, descartados y etiquetas.
- [x] Retirar el botón visible de calidad.
- [x] Mover cada activación de filtro léxico junto al contador de su idioma.
- [x] Unificar las acciones de composición con fondo transparente y estados violeta.
- [x] Mantener guardar y vaciar visibles y deshabilitarlos según su capacidad real.
- [x] Verificar nombres accesibles, orden, estados y contención del ancho.

Resultado: el catálogo concentra sus cinco vistas en una fila, cada idioma controla localmente su filtro y la barra de composición ya no cambia de geometría.

## Fase 2 — Consolidar navegación, etiquetas y documentación

- [x] Reducir la cabecera global a selector y botón de hamburguesa.
- [x] Convertir el menú en un drawer derecho con navegación, datos, preferencias, etiquetas y About.
- [x] Añadir la ruta `#/tags` y convertir la gestión y edición de etiquetas en una página.
- [x] Respetar foco, portal, zonas seguras y reducción de movimiento.
- [x] Actualizar ADR, plan, documentación funcional y arquitectura.
- [x] Ejecutar formato, lint, tipos, pruebas y build de producción.

Resultado: la navegación se mantiene disponible en composición, revisión y etiquetas; el gestor deja de apilar modales. Formato, lint y tipos terminan sin avisos, las 39 suites con 169 pruebas pasan y el build Vite de producción se genera correctamente.

## Verificación

```text
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
```
