# Arquitectura y diseño de implementación

Este documento describe cómo se estructura Semordnilab y qué restricciones debe respetar su implementación. Debe evolucionar junto con el código y distinguir siempre entre el estado actual y la arquitectura de destino.

## Estado técnico actual

El repositorio contiene actualmente:

- una SPA con React, TypeScript y Vite;
- separación efectiva entre dominio, aplicación, infraestructura, presentación y composición;
- tres datasets TSV servidos desde `public/datasets`;
- carga, parseo y validación de los datasets incluidos;
- casos de uso para listar conjuntos y cargar `AtomicSemordnilap`;
- un área de composición en memoria con inversión derivada;
- un catálogo bilingüe con filas alineadas y filtros combinados;
- CSS Modules y estilos globales basados en tokens;
- pruebas con Vitest para dominio, aplicación, infraestructura y presentación;
- TypeScript estricto, alias `@/`, ESLint y Prettier;
- Dexie como dependencia preparada para trabajar con IndexedDB;
- la ruta base de Vite para publicar en `/semordnilab/`;
- un workflow de GitHub Actions para desplegar en GitHub Pages.

La persistencia local todavía no está conectada. Tampoco están implementados el guardado, el anidamiento de `CompositeSemordnilap`, la importación externa ni la exportación.

## Stack y política de dependencias

El stack inicial de referencia está formado por:

- React;
- TypeScript en modo estricto;
- Vite;
- Dexie sobre IndexedDB;
- CSS Modules y CSS nativo;
- Vitest;
- ESLint y Prettier;
- GitHub Actions y GitHub Pages.

No se incorporan inicialmente Redux, Zustand, Tailwind CSS, Material UI, Motion, GSAP ni otra librería general de estado, componentes o animación. Una dependencia nueva debe responder a una necesidad concreta, justificar por qué la plataforma o el stack actual no la resuelven de forma razonable y permanecer en la capa que corresponda.

El funcionamiento sin backend es una restricción del producto. Las capacidades de almacenamiento, archivos y procesamiento se implementan con APIs del navegador detrás de puertos internos cuando necesiten aislamiento.

## Estilo arquitectónico

Semordnilab sigue una Clean Architecture adaptada a una SPA que funciona completamente en el navegador y no necesita un backend propio.

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

Las flechas representan dependencias de código. Las capas externas pueden conocer contratos de las capas internas. Las capas internas nunca importan React, Dexie, IndexedDB, CSS o Vite.

### Regla de dependencias

| Capa             | Puede depender de                      | No puede depender de                            |
| ---------------- | -------------------------------------- | ----------------------------------------------- |
| `domain`         | TypeScript y código del propio dominio | Todas las demás capas y cualquier framework     |
| `application`    | `domain`                               | `presentation`, `infrastructure`, React y Dexie |
| `infrastructure` | Contratos de `domain` y `application`  | `presentation`                                  |
| `presentation`   | Casos de uso y DTO de `application`    | Dexie, IndexedDB e implementaciones concretas   |
| `app`            | Todas las capas durante la composición | Reglas de negocio propias                       |

`app` es el punto de composición. Es el único lugar donde se crean la base de datos, los repositorios concretos y los casos de uso que consume la presentación.

## Responsabilidad de cada capa

### Domain

Contiene el lenguaje y las reglas propias de Semordnilab:

- `Semordnilap` como tipo común del dominio;
- `AtomicSemordnilap` para las unidades indivisibles de un dataset;
- `CompositeSemordnilap` para composiciones que pueden contener otros semordnilaps;
- value objects para identificadores, idiomas y claves normalizadas cuando aporten invariantes reales;
- reglas de inversión, composición y expansión de componentes;
- validación de semordnilaps compuestos;
- detección de referencias circulares;
- errores de dominio;
- contratos de repositorio que expresen necesidades del dominio.

El dominio se implementa con TypeScript sin dependencias externas. Sus pruebas no necesitan React, Dexie ni un navegador.

### Application

Coordina los casos de uso de la aplicación:

- seleccionar y cargar un dataset;
- importar un dataset externo;
- buscar y filtrar semordnilaps;
- crear y modificar un semordnilap compuesto;
- guardar y recuperar semordnilaps compuestos;
- marcar favoritos;
- exportar e importar una colección personal;
- eliminar o recuperar datos locales.

Los casos de uso reciben sus dependencias mediante el constructor o mediante parámetros explícitos. Esta capa define DTO, mappers y puertos para capacidades que no pertenecen al dominio, como lectura de archivos o generación de exportaciones.

La capa de aplicación no conoce componentes React ni implementaciones de IndexedDB.

### Infrastructure

Implementa los contratos requeridos por las capas internas:

- base de datos Dexie;
- esquema y migraciones de IndexedDB;
- repositorios persistentes;
- carga de los TSV incluidos;
- lectura y validación técnica de archivos externos;
- serialización de importaciones y exportaciones;
- adaptadores del navegador;
- Web Workers si las mediciones justifican mover el parseo o la búsqueda.

La infraestructura transforma registros externos a DTO o entidades mediante mappers. No decide reglas de validez propias del negocio.

### Presentation

Contiene la interfaz y adapta la interacción del usuario a casos de uso:

- páginas y layouts;
- componentes visuales reutilizables;
- hooks de presentación;
- contextos de dependencias o información global estable;
- view models;
- CSS Modules y estilos compartidos;
- estados de carga, vacío y error;
- comportamiento accesible y responsive.

Los hooks pueden coordinar casos de uso y estado de React. No contienen reglas de negocio ni consultan Dexie directamente.

### App

Configura y conecta la aplicación:

- crea la instancia de Dexie;
- crea las implementaciones de repositorio;
- inyecta los repositorios en los casos de uso;
- expone dependencias preparadas para la presentación;
- configura proveedores y navegación cuando sea necesaria;
- inicia la aplicación.

Esta capa contiene cableado. No debe convertirse en otro lugar para lógica de dominio o de presentación.

## Organización prevista del código

```text
src/
  app/
    composition/
    providers/
    App.tsx
    main.tsx
  domain/
    entities/
    value-objects/
    repositories/
    services/
    errors/
  application/
    use-cases/
    dto/
    mappers/
    ports/
  infrastructure/
    database/
      dexie/
      migrations/
      schema/
    repositories/
    services/
  presentation/
    pages/
    layouts/
    components/
      ui/
    hooks/
    contexts/
    view-models/
    styles/
  shared/
    constants/
    types/
    utils/
    errors/
  assets/

tests/
  application/
  domain/
  infrastructure/
  presentation/
  support/
  setup.ts
```

Esta estructura representa el destino arquitectónico. No se crean carpetas vacías. Cada directorio aparece cuando contiene una responsabilidad real.

`shared` se mantiene pequeño y libre de conceptos de negocio. Un tipo o una función que solo utiliza una capa permanece dentro de esa capa. Se evitan archivos genéricos como `helpers.ts`, `manager.ts` o `service.ts`.

## Flujo de una operación

Guardar un semordnilap compuesto ilustra el recorrido completo:

```text
CompositeSemordnilapPage
      |
      v
useSaveCompositeSemordnilap
      |
      v
SaveCompositeSemordnilap use case
      |
      v
CompositeSemordnilapRepository (contrato interno)
      ^
      |
DexieCompositeSemordnilapRepository
      |
      v
IndexedDB
```

La página recoge la intención del usuario. El hook adapta el estado visual. El caso de uso coordina la validación del dominio y el repositorio. La implementación Dexie persiste el resultado. La página nunca conoce la base de datos.

## Modelo de dominio

`Semordnilap` es un tipo discriminado que representa las dos formas del mismo concepto:

```ts
type Semordnilap = AtomicSemordnilap | CompositeSemordnilap

type SemordnilapExpression = {
  language: LanguageCode
  text: string
  normalized: NormalizedKey
}
```

### AtomicSemordnilap

Representa un semordnilap indivisible procedente de un dataset. Una expresión puede contener varias palabras sin dejar de ser una unidad atómica para la aplicación.

```ts
type AtomicSemordnilap = {
  kind: 'atomic'
  id: SemordnilapId
  datasetId: DatasetId
  source: SemordnilapExpression
  target: SemordnilapExpression
}
```

El identificador debe ser estable y no depender únicamente del texto. Puede haber textos repetidos, variantes con la misma normalización y semordnilaps simétricos en conjuntos monolingües.

### CompositeSemordnilap

Representa un semordnilap formado por una secuencia ordenada de otros semordnilaps. Cada componente puede hacer referencia a un `AtomicSemordnilap` o a otro `CompositeSemordnilap`.

```ts
type CompositeSemordnilap = {
  kind: 'composite'
  id: SemordnilapId
  components: readonly SemordnilapReference[]
  title?: string
  tags: readonly string[]
  notes?: string
  createdAt: Date
  updatedAt: Date
}

type SemordnilapReference =
  | {
      kind: 'atomic'
      datasetId: DatasetId
      semordnilapId: SemordnilapId
    }
  | {
      kind: 'composite'
      semordnilapId: SemordnilapId
    }
```

La referencia a un semordnilap individual incluye el dataset porque su identificador solo necesita ser único dentro de ese conjunto. La referencia a un composite apunta a la colección local.

`components` conserva el orden canónico del idioma de origen. Las expresiones resultantes se derivan de esta secuencia y no se mantienen como una segunda fuente de verdad.

Un composite puede compartirse entre varias composiciones. Por tanto, las relaciones persistidas forman un grafo dirigido y no únicamente un árbol. El dominio rechaza referencias circulares antes de aceptar o guardar un cambio.

La expansión recursiva obtiene una secuencia plana de `AtomicSemordnilap`. Esta secuencia permite calcular las expresiones completas, validar la inversión y conservar la procedencia.

## Representaciones de datos

El modelo de dominio no reproduce las columnas del TSV ni el esquema de IndexedDB. Cada capa utiliza una representación adecuada para su responsabilidad:

- `TsvSemordnilapRecord` pertenece a infraestructura y representa una fila completa del archivo externo;
- `AtomicSemordnilap` pertenece al dominio y conserva únicamente los datos necesarios para identificar y validar el semordnilap;
- `SemordnilapCatalogItem` es un DTO de aplicación que añade los metadatos necesarios para búsqueda, filtros y presentación;
- los registros Dexie pertenecen a infraestructura y responden al esquema de persistencia local.

Frecuencia, corpus, número de palabras y puntuación no forman parte automáticamente de la entidad de dominio. Se mantienen en el DTO de catálogo cuando exista una función que los utilice.

## Carga de datasets

Los archivos incluidos utilizan TSV con cabecera. El adaptador de infraestructura convierte cada fila en un `TsvSemordnilapRecord`. Un mapper crea el `AtomicSemordnilap` y el DTO de catálogo correspondientes. El caso de uso de aplicación coordina la carga y solicita al dominio la validación de las reglas lingüísticas.

El flujo de carga debe:

1. Comprobar las columnas requeridas.
2. Convertir cantidades y puntuaciones a valores numéricos.
3. Informar de filas incompletas o mal formadas.
4. Comprobar que las claves normalizadas formen un semordnilap válido.
5. Generar identificadores estables.
6. Producir un resumen antes de activar el conjunto.

La importación es atómica. Un archivo inválido no reemplaza el dataset activo por información parcial.

## Composición e inversión

El constructor conserva los componentes de un `CompositeSemordnilap` en el orden del idioma de origen:

```text
origen:  [A, B, C]
destino: [C′, B′, A′]
```

Añadir un componente a la derecha del origen coloca su expresión correspondiente a la izquierda del destino. Añadirlo a la izquierda produce la operación opuesta. Una selección iniciada desde el panel de destino se traduce a la misma secuencia canónica.

Antes de componer, cada referencia se resuelve recursivamente. Los composites anidados se tratan como una única pieza durante la interacción, pero el dominio puede expandirlos hasta sus semordnilaps atómicos para validar el resultado.

La validación fundamental es:

```text
sourceNorm === reverse(targetNorm)
```

`sourceNorm` concatena las claves de origen en orden canónico. `targetNorm` concatena las claves de destino en orden inverso. La inversión debe operar de forma segura con Unicode.

Los textos concatenados, la vista del idioma de destino y el resultado de validación se derivan de la secuencia canónica. No se guardan como estados independientes que puedan quedar desincronizados.

## Estado de React

La presentación utiliza esta prioridad:

1. `useState` para estado local sencillo.
2. `useReducer` para estado local complejo.
3. Context para dependencias o información global estable.
4. Un gestor externo solo cuando exista una necesidad comprobable.

Se distinguen cuatro clases de información:

- estado visual (diálogos, pestañas, selección y formularios);
- estado de aplicación (resultados de casos de uso que se muestran en la vista);
- estado persistente (información obtenida mediante repositorios);
- reglas de negocio (lógica exclusiva del dominio).

IndexedDB es la fuente persistente de verdad. React solo conserva la información necesaria para representar y controlar la interfaz actual. La base de datos completa no se duplica en un estado global.

## Búsqueda

La implementación actual mantiene dos consultas visuales, una para cada idioma. Ambas se aplican mediante intersección sobre el mismo conjunto de DTO de catálogo. El resultado se representa en filas bilingües, cada una identificada por un único `SemordnilapId`, y utiliza un solo contenedor de desplazamiento.

El filtrado sencillo pertenece a presentación porque solo adapta un catálogo ya cargado a la vista actual. Las reglas de normalización compartidas con la composición permanecen en el dominio. Si la búsqueda incorpora relevancia, indexación u otras reglas reutilizables, esa coordinación se trasladará a un caso de uso y el índice optimizado permanecerá en infraestructura.

La implementación actual busca en memoria. Si las mediciones muestran bloqueos con conjuntos mayores, un adaptador de infraestructura trasladará el trabajo a un Web Worker sin cambiar el contrato utilizado por la aplicación.

No se añadirá inicialmente una librería de búsqueda. Una dependencia solo se evaluará cuando el comportamiento requerido y las mediciones demuestren que la implementación propia no es suficiente.

## Persistencia local

Dexie implementa repositorios internos sobre IndexedDB. La base local almacenará únicamente aquello que no pueda reconstruirse de forma fiable:

- preferencias y último dataset utilizado;
- favoritos mediante referencias estables;
- `CompositeSemordnilap` y su secuencia ordenada de componentes;
- datasets externos que deban restaurarse entre sesiones;
- versión del esquema local.

El diseño incluye desde el comienzo versionado, migraciones, manejo de errores, exportación, importación, eliminación de datos y recuperación ante información incompatible.

Los datasets incluidos se cargan desde archivos estáticos y no se duplican en IndexedDB salvo que una medición justifique una caché. La base solo necesita referencias estables al dataset y al semordnilap.

Para restaurar un dataset externo se conservan su identidad y los datos mínimos de cada `AtomicSemordnilap`: identificador, expresiones visibles, claves normalizadas e idiomas. Los metadatos de catálogo como frecuencia, número de palabras y puntuación solo se persisten cuando formen parte del comportamiento disponible. Los datos comunes, como idiomas o corpus, pueden almacenarse una sola vez en el registro del dataset cuando sean homogéneos.

Las expresiones resultantes de un `CompositeSemordnilap` se calculan a partir de sus componentes. No se guardan como fuente de verdad. Una caché derivada solo se añadiría por una necesidad de rendimiento comprobada y siempre podría regenerarse.

Las exportaciones incluyen referencias, metadatos y la información necesaria para reconstruir los composites fuera de la base local. No dependen de claves internas de Dexie.

La aplicación no debe guardar información sensible. La interfaz explicará que los datos permanecen en el almacenamiento local del navegador y pueden perderse si el usuario lo elimina.

## Componentes y estilos

La presentación utiliza componentes propios y reutilizables. Se incorporan cuando una interacción real los necesita, sin crear de antemano un catálogo vacío.

Los primeros candidatos son `Button`, `IconButton`, `Card`, `Modal`, `Tooltip`, `Tabs`, `Toast` y los elementos específicos de los paneles y del constructor.

Cada componente tiene una responsabilidad clara. El renderizado, la coordinación con casos de uso, la adaptación de datos y los estilos se separan cuando su combinación dificulta las pruebas o la lectura.

Los estilos de componentes utilizan CSS Modules. Los tokens, el reset y los estilos verdaderamente globales permanecen en `presentation/styles`.

## Animación y accesibilidad

Las interacciones sencillas utilizan CSS nativo con `transition`, `transform`, `opacity` y `@keyframes`. Las variables CSS comparten duraciones y curvas cuando resulte útil.

Toda animación debe:

- responder a una finalidad concreta;
- respetar `prefers-reduced-motion`;
- mantener la navegación mediante teclado;
- evitar movimientos inesperados de contenido;
- priorizar `transform` y `opacity` cuando sea posible.

Motion no forma parte del stack inicial. Solo se evaluará si aparecen gestos, reordenaciones o transiciones coordinadas que CSS no pueda mantener de forma razonable. Si se incorpora, permanecerá exclusivamente en presentación.

Arrastrar y soltar será una ayuda, no la única forma de componer. Los estados de selección, validación y error tendrán texto y semántica accesible y no dependerán solo del color.

## Navegación y GitHub Pages

La interfaz actual contiene una sola pantalla y no necesita una dependencia de navegación. Si aparecen varias rutas, el router pertenecerá a la presentación y se configurará desde `app` con una estrategia compatible con hosting estático.

Vite conserva `base: "/semordnilab/"` y los recursos respetan esa base.

El workflow de GitHub Actions ya compila y despliega el contenido de `dist`. Durante la fase técnica inicial se verificará que lint, pruebas y compilación formen parte de la validación previa al despliegue.

## Calidad y pruebas

TypeScript está configurado en modo estricto. El alias `@/` permite imports internos claros sin atravesar varios niveles de rutas relativas.

Vitest organiza la cobertura en este orden:

1. Entidades y value objects.
2. Servicios de dominio.
3. Casos de uso.
4. Mappers.
5. Repositorios de infraestructura.
6. Hooks y componentes con comportamiento relevante.

Los casos de uso se prueban con repositorios en memoria. Las pruebas de dominio y aplicación no necesitan React, Dexie ni un navegador real.

Todo el código exclusivo de pruebas vive en `tests/`, fuera de `src`. La estructura de tests refleja las capas que verifica y `tests/support` contiene únicamente fixtures y utilidades compartidas entre pruebas. El código de producción no importa ningún módulo de esa carpeta.

Los límites entre capas se comprobarán mediante convenciones de imports y reglas estáticas cuando exista código suficiente. Los requisitos mínimos de cada cambio serán formateo, lint, pruebas y compilación.

Se evitan:

- `any`;
- imports circulares;
- reglas de negocio en React;
- acceso directo a Dexie desde componentes o hooks;
- casos de uso con varias responsabilidades;
- abstracciones sin una necesidad concreta;
- dependencias añadidas solo por comodidad.

## Forma de evolución

El proyecto avanza mediante iteraciones verticales pequeñas. Una funcionalidad atraviesa las capas que necesite y termina con estados de carga, vacío y error, pruebas y revisión de accesibilidad.

No se genera toda la estructura de una vez. Cada abstracción debe resolver un problema observable. Las decisiones con varias alternativas razonables se registran en esta documentación con su coste y beneficio.
