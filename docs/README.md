# Documentación de Semordnilab

Esta carpeta reúne la documentación funcional y técnica del proyecto. Su propósito es explicar qué es la aplicación y cómo se organiza, siempre desde la perspectiva del producto y su implementación.

## Documentos

- [Guía de la aplicación](application.md): conceptos, experiencia de uso y alcance funcional.
- [Arquitectura](architecture.md): estado técnico actual y diseño de implementación.
- [ADR 0001: primera interfaz](adr/0001-first-interface.md): decisión visual y plan de implementación adoptado.

## Estado del proyecto

Semordnilab está en una fase inicial funcional. El repositorio dispone de una interfaz de exploración y composición en memoria, carga los tres datasets bilingües en TSV y separa dominio, aplicación, infraestructura, presentación y composición. La persistencia local y el anidamiento de composites permanecen pendientes.

La documentación debe mantenerse como una descripción fiel del producto. Cuando una decisión técnica o el comportamiento de la aplicación cambien, los documentos correspondientes deberán actualizarse para reflejarlo.
