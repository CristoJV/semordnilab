# Semordnilab

Semordnilab es una aplicación web para explorar y componer semordnilaps bilingües encontrados en corpus lingüísticos.

La interfaz combina dos exploradores de idioma con un constructor central. Al combinar semordnilaps individuales en un lado, la aplicación ordena sus expresiones correspondientes de forma inversa en el otro.

## Estado

El proyecto se encuentra en su fase inicial. Actualmente incluye:

- una SPA con React, TypeScript y Vite;
- una estructura funcional basada en Clean Architecture;
- datasets de español con español, gallego y portugués en TSV;
- carga y validación de todos los semordnilaps de un conjunto seleccionado;
- exploración bilingüe con filtros combinados y filas siempre alineadas;
- favoritos, descarte y restauración persistentes por semordnilap;
- selección múltiple y criterios de ordenación combinables en ambos idiomas;
- cursor de inserción, movimiento, deshacer y rehacer en la composición;
- borradores conservados automáticamente por conjunto lingüístico;
- guardado, deduplicación y reutilización de composites anidados;
- una interfaz adaptable con paleta violeta y mostaza;
- pruebas de dominio, aplicación, infraestructura y presentación;
- persistencia versionada de estados, composites y borradores con Dexie e IndexedDB;
- configuración de Vite y GitHub Actions para desplegar en GitHub Pages;
- documentación funcional y técnica.

La importación de datasets externos y la exportación de la colección local todavía no están implementadas.

## Arquitectura

El proyecto sigue Clean Architecture con cinco áreas principales:

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

`app` actúa como punto de composición. El dominio no depende de frameworks, los casos de uso solo dependen del dominio y React nunca accede directamente a Dexie o IndexedDB. La [documentación de arquitectura](docs/architecture.md) define las responsabilidades y los límites completos.

## Documentación

- [Guía de la aplicación](docs/application.md)
- [Arquitectura y diseño de implementación](docs/architecture.md)
- [ADR 0001: primera interfaz](docs/adr/0001-first-interface.md)
- [ADR 0002: estados del catálogo](docs/adr/0002-catalog-statuses.md)
- [ADR 0003: composites y espacio de trabajo persistente](docs/adr/0003-persistent-composites.md)

La documentación distingue entre el estado actual y las decisiones previstas. Debe actualizarse junto con la implementación para continuar siendo una referencia del comportamiento real.

## Desarrollo local

Requisitos:

- Node.js;
- npm.

Instalación e inicio del servidor de desarrollo:

```bash
npm install
npm run dev
```

Verificaciones disponibles actualmente:

```bash
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
```

## Datos incluidos

Los conjuntos de referencia están en `public/datasets`:

| Archivo     | Idiomas             | Semordnilaps |
| ----------- | ------------------- | -----------: |
| `es_es.tsv` | Español y español   |        6.642 |
| `es_gl.tsv` | Español y gallego   |        1.091 |
| `es_pt.tsv` | Español y portugués |        4.513 |

Cada fila incluye el texto y la forma normalizada de ambos idiomas, corpus, frecuencia, número de palabras y una puntuación asociada al semordnilap. El esquema técnico y el comportamiento previsto de importación se explican en la [documentación de arquitectura](docs/architecture.md#carga-de-datasets).

## Licencia

El repositorio todavía no declara una licencia. Hasta que se añada una, no debe asumirse permiso de redistribución o reutilización fuera de sus titulares.
