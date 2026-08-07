# Documentación de Semordnilab

Esta carpeta reúne la documentación funcional y técnica del proyecto. Su propósito es explicar qué es la aplicación y cómo se organiza, siempre desde la perspectiva del producto y su implementación.

## Documentos

- [Guía de la aplicación](application.md): conceptos, experiencia de uso y alcance funcional.
- [Arquitectura](architecture.md): estado técnico actual y diseño de implementación.
- [ADR 0001: primera interfaz](adr/0001-first-interface.md): decisión visual y plan de implementación adoptado.
- [ADR 0002: estados del catálogo](adr/0002-catalog-statuses.md): modelo genérico para favoritos y descartes persistentes.
- [ADR 0003: composites persistentes](adr/0003-persistent-composites.md): identidad estable, migración y edición del espacio de trabajo.
- [ADR 0004: datos personales y gestión de composites](adr/0004-personal-data-and-composite-management.md): copias atómicas, preferencias y eliminación segura.
- [ADR 0005: interacción directa en la composición](adr/0005-direct-composition-interaction.md): gestos, máquina de estados, desplazamiento lateral y avisos transitorios.
- [ADR 0006: exploración eficiente del catálogo](adr/0006-efficient-catalog-exploration.md): orden estable, relevancia, descubrimiento y renderizado virtual.
- [ADR 0007: etiquetas y eliminación en cascada](adr/0007-tags-and-cascade-deletion.md): clasificación personal, migración aditiva y cierre transitivo de dependencias.
- [ADR 0008: interfaz adaptable para móvil](adr/0008-adaptive-mobile-interface.md): una única interfaz, controles táctiles y diálogos seguros en pantallas estrechas.
- [ADR 0009: gestos táctiles en las filas](adr/0009-catalog-row-gestures.md): coordinación de toque, scroll, selección y acciones laterales.
- [ADR 0010: gestión compacta de composites](adr/0010-compact-composite-management.md): resumen estructural, confirmación segura y política de dependencias.

## Estado del proyecto

Semordnilab está en una fase inicial funcional. La aplicación permite explorar tres colecciones lingüísticas, mantiene alineados los dos lados de cada semordnilap y ofrece búsqueda, descubrimiento, ordenación, favoritos y descarte. El espacio de trabajo admite inserción y reordenación directa, historial de cambios y composites anidados. La misma pantalla se adapta a escritorio y móvil con controles táctiles, selector compacto y diálogos que respetan el área segura del dispositivo.

Los estados del catálogo, las etiquetas, los borradores, los composites y las preferencias se conservan en IndexedDB. El menú superior permite exportar e importar estos datos mediante una copia versionada. La importación de colecciones lingüísticas externas todavía no está disponible: la importación actual restaura únicamente los datos personales generados por la aplicación.

La aplicación se verifica mediante pruebas de dominio, aplicación, infraestructura y presentación, además de comprobaciones de formato, lint, tipos y construcción. El flujo de integración continua publica la versión de `main` en GitHub Pages cuando todas las comprobaciones finalizan correctamente.

## Arquitectura

El código sigue Clean Architecture y separa las reglas del producto de los detalles de interfaz y persistencia:

```text
Presentation
     |
     v
Application
     |
     v
Domain
     ^
     |
Infrastructure
```

`app` actúa como punto de composición. El dominio no depende de frameworks, los casos de uso trabajan contra contratos del dominio y la presentación no accede directamente a Dexie ni a IndexedDB. La infraestructura implementa la carga de datasets y la persistencia local sin trasladar esos detalles a las reglas de negocio.

La descripción completa de responsabilidades, dependencias, modelos y persistencia está en la [documentación de arquitectura](architecture.md). Los ADR registran las decisiones relevantes y el contexto que motivó cada una.

## Mantenimiento de la documentación

La documentación debe mantenerse como una descripción fiel del producto. Cuando una decisión técnica o el comportamiento de la aplicación cambien, los documentos correspondientes deberán actualizarse para reflejarlo.
