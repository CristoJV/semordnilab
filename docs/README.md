# Documentación de Semordnilab

Esta carpeta reúne la documentación funcional y técnica del proyecto. Su propósito es explicar qué es la aplicación y cómo se organiza, siempre desde la perspectiva del producto y su implementación.

## Documentos

- [Guía de la aplicación](application.md): conceptos, experiencia de uso y alcance funcional.
- [Arquitectura](architecture.md): estado técnico actual y diseño de implementación.
- [ADR 0001: primera interfaz](adr/0001-first-interface.md): decisión visual y plan de implementación adoptado.
- [ADR 0002: estados del catálogo](adr/0002-catalog-statuses.md): modelo genérico para favoritos y descartes persistentes.
- [ADR 0003: composites persistentes](adr/0003-persistent-composites.md): identidad estable, migración y edición del espacio de trabajo.

## Estado del proyecto

Semordnilab está en una fase inicial funcional. El repositorio dispone de una interfaz de exploración y composición persistente, carga los tres datasets bilingües en TSV y separa dominio, aplicación, infraestructura, presentación y composición. Los estados del catálogo, los borradores y los composites anidados se conservan localmente.

La documentación debe mantenerse como una descripción fiel del producto. Cuando una decisión técnica o el comportamiento de la aplicación cambien, los documentos correspondientes deberán actualizarse para reflejarlo.
