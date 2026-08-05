# Documentación de Semordnilab

Esta carpeta reúne la documentación funcional y técnica del proyecto. Su propósito es explicar qué es la aplicación y cómo se organiza, siempre desde la perspectiva del producto y su implementación.

## Documentos

- [Guía de la aplicación](application.md): conceptos, experiencia de uso y alcance funcional.
- [Arquitectura](architecture.md): estado técnico actual y diseño de implementación.
- [ADR 0001: primera interfaz](adr/0001-first-interface.md): decisión visual y plan de implementación adoptado.
- [ADR 0002: estados del catálogo](adr/0002-catalog-statuses.md): modelo genérico para favoritos y descartes persistentes.

## Estado del proyecto

Semordnilab está en una fase inicial funcional. El repositorio dispone de una interfaz de exploración y composición en memoria, carga los tres datasets bilingües en TSV y separa dominio, aplicación, infraestructura, presentación y composición. Los estados del catálogo se conservan localmente. El guardado y anidamiento de composites permanecen pendientes.

La documentación debe mantenerse como una descripción fiel del producto. Cuando una decisión técnica o el comportamiento de la aplicación cambien, los documentos correspondientes deberán actualizarse para reflejarlo.
