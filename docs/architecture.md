# Arquitectura y diseño de implementación

Este documento describe cómo se estructura Semordnilab y qué restricciones debe respetar su implementación. Debe evolucionar junto con el código y distinguir siempre entre el estado actual y la arquitectura de destino.

## Estado técnico actual

El repositorio contiene actualmente:

- una SPA con React, TypeScript y Vite;
- separación efectiva entre dominio, aplicación, infraestructura, presentación y composición;
- tres datasets TSV servidos desde `public/datasets`;
- carga, parseo y validación de los datasets incluidos;
- casos de uso para listar conjuntos y cargar `AtomicSemordnilap`;
- un área de composición persistente con cursor, movimiento e historial;
- un catálogo bilingüe con filas alineadas y filtros combinados;
- estados genéricos de catálogo persistidos con Dexie e IndexedDB;
- etiquetas personales globales con asignación y filtrado por dataset;
- revisión léxica por idioma con estados pendiente, verificado y excluido, diccionarios, impacto y aplicación independiente por lado;
- favoritos de posición estable, vista de descartados, restauración y selección múltiple;
- búsqueda con relevancia visual, resaltado, descubrimiento y ventana virtual;
- criterios de ordenación combinables desde cualquiera de los idiomas;
- filtros reversibles por frecuencia, número de palabras y puntuación, con impacto visible de exclusiones;
- inspector léxico derivado para la composición;
- presentación adaptable con selector compacto, barras táctiles y ordenación móvil;
- diálogos portados al documento con hoja inferior y zonas seguras en móvil;
- guardado, deduplicación y resolución recursiva de composites;
- gestión de composites con análisis transitivo y eliminación en cascada protegida;
- copias JSON en versión 6 con inspección, combinación, validación semántica e importación atómica, compatibles con las versiones 1–5;
- preferencias de vista persistentes por dataset;
- esquema IndexedDB en versión 8, con decisiones léxicas de identidad exacta indexadas por idioma y estado;
- CSS Modules y estilos globales basados en tokens;
- pruebas con Vitest para dominio, aplicación, infraestructura y presentación;
- TypeScript estricto, alias `@/`, ESLint y Prettier;
- un repositorio Dexie conectado mediante casos de uso y un puerto de aplicación;
- la ruta base de Vite para publicar en `/semordnilab/`;
- un workflow de GitHub Actions para desplegar en GitHub Pages.

La persistencia local está conectada para estados del catálogo, etiquetas, composites, borradores y preferencias. La colección personal puede exportarse e importarse. La importación de datasets lingüísticos externos sigue sin estar implementada.

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
- consultar, añadir y retirar estados genéricos del catálogo;
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
  datasetId: DatasetId
  components: readonly SemordnilapReference[]
  atomicComponents: readonly AtomicSemordnilapReference[]
  source: SemordnilapExpression
  target: SemordnilapExpression
  title?: string
  createdAt: string
  updatedAt: string
}

type SemordnilapReference =
  | {
      kind: 'atomic'
      datasetId: DatasetId
      semordnilapId: SemordnilapId
    }
  | {
      kind: 'composite'
      datasetId: DatasetId
      semordnilapId: SemordnilapId
    }
```

Todas las referencias incluyen el dataset. La primera implementación restringe cada composite a un único conjunto lingüístico.

`components` conserva el orden canónico del idioma de origen. Las expresiones resultantes se derivan de esta secuencia y no se mantienen como una segunda fuente de verdad.

Un composite puede compartirse entre varias composiciones. Por tanto, las relaciones persistidas forman un grafo dirigido y no únicamente un árbol. Los composites guardados son inmutables desde la interfaz y el resolutor rechaza referencias circulares, ausentes o inconsistentes.

La expansión recursiva obtiene una secuencia plana de `AtomicSemordnilap`. Esta secuencia permite calcular las expresiones completas, validar la inversión y conservar la procedencia.

Los identificadores atómicos utilizan una huella determinista del dataset y del contenido lingüístico estable de la fila. No incorporan la posición ni cantidades que puedan variar al regenerar el corpus. El cargador rechaza colisiones dentro de un dataset. El identificador de un composite se deriva de la secuencia expandida de identificadores atómicos, lo que permite detectar duplicados antes de escribir.

## Representaciones de datos

El modelo de dominio no reproduce las columnas del TSV ni el esquema de IndexedDB. Cada capa utiliza una representación adecuada para su responsabilidad:

- `TsvSemordnilapRecord` pertenece a infraestructura y representa una fila completa del archivo externo;
- `AtomicSemordnilap` pertenece al dominio y conserva únicamente los datos necesarios para identificar y validar el semordnilap;
- `SemordnilapCatalogItem` es un DTO de aplicación que añade los metadatos necesarios para búsqueda, filtros y presentación;
- `SemordnilapStatusRecord` es un DTO de aplicación que identifica un estado mediante dataset, semordnilap y nombre de estado;
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

La presentación mantiene un índice de inserción canónico entre cero y el número de componentes. El espacio `i` de origen corresponde al espacio `n - i` de destino. Insertar desplaza el cursor a la posición siguiente. Los movimientos intercambian componentes en la secuencia canónica y el destino vuelve a derivarse. Los elementos que proporcionan la geometría de estos espacios tienen una anchura fija. La indicación del destino utiliza `transform` sobre el botón interior, por lo que resaltar un único `+` no desplaza el texto ni altera el cálculo del hueco más cercano.

La interacción directa de cada componente pertenece exclusivamente a presentación y utiliza Pointer Events. Una máquina de estados pura modela las transiciones siguientes:

```text
idle
  | pulsación de ratón
  v
pressed ----------------------> idle + retirar
  | movimiento intencionado
  v
dragging ---------------------> idle + mover o cancelar

idle
  | contacto táctil
  v
waiting-for-long-press -------> idle + retirar
  | pulsación prolongada
  v
dragging ---------------------> idle + mover o cancelar
```

La máquina recibe eventos semánticos y devuelve el siguiente estado junto con efectos declarativos. No accede al DOM, a React, a temporizadores ni a repositorios. Un hook de presentación interpreta esos efectos, gestiona la captura del puntero y calcula el espacio canónico más cercano. El movimiento del ratón necesita superar un umbral para distinguirse de una pulsación. En entrada táctil, moverse antes de la pulsación prolongada cancela el gesto y deja continuar el desplazamiento natural.

Durante el estado `dragging`, la posición cercana a los extremos produce desplazamiento horizontal mediante `requestAnimationFrame`. `CompositionPhrasesViewport` coloca las dos secuencias en un único viewport horizontal, por lo que el hook desplaza ese contenedor común y mantiene alineadas ambas representaciones. Un `ResizeObserver` compara el ancho visible y el ancho desplazable; si existe overflow presenta un `input[type=range]` cuyo valor refleja y modifica el mismo `scrollLeft`. Las etiquetas de idioma pertenecen a una columna hermana fija y la barra de herramientas queda por encima de toda esta estructura. Los carriles no crean scrollbars independientes y los límites `min-width: 0` y `max-width: 100%` impiden que el contenido intrínseco amplíe la página. El cálculo geométrico y la conversión del espacio visual a índice canónico son funciones puras. El destino utiliza los mismos índices canónicos aunque su orden visual esté invertido. Soltar dentro de la franja aplica un único movimiento al historial; soltar claramente fuera la cancela.

La retirada por pulsación ofrece una recuperación exacta mediante un aviso transitorio. La recuperación conserva la instancia y el índice originales, pero verifica primero que el semordnilap siga disponible en el dataset activo. Esta interacción no cambia los contratos de aplicación ni el modelo de dominio.

El historial conserva hasta cien estados anteriores durante la sesión. Cambiar el cursor no añade una entrada al historial porque no modifica la composición. IndexedDB conserva el último estado y el índice de inserción de cada dataset después de un breve intervalo, además de intentar escribir el último cambio al desmontar o cambiar de conjunto.

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

El filtrado y la relevancia sencilla pertenecen a presentación porque solo adaptan un catálogo ya cargado a la vista actual. Las funciones puras normalizan una consulta continua, comprueban cada lado y asignan prioridad a coincidencia exacta, inicial o parcial. Las reglas de normalización lingüística compartidas con la composición permanecen en el dominio. Si la búsqueda incorpora indexación persistente u otras reglas de producto reutilizables, esa coordinación se trasladará a un caso de uso y el índice optimizado permanecerá en infraestructura.

La implementación actual busca, filtra y ordena en memoria. La ordenación mantiene una lista de criterios con lado, campo y dirección. Además de texto y longitud, compara frecuencia, número de palabras y puntuación de pareja desde los metadatos de catálogo. Se evalúan según su prioridad de activación y el orden original resuelve el último empate. Los composites, que no contienen esas magnitudes, permanecen visibles y quedan después de los resultados medibles. Favoritos y composites no forman grupos prioritarios, por lo que cambiar un estado no desplaza inesperadamente la fila ni reinicia su contenedor.

`advanceDiscoverySession` mantiene una bolsa efímera de identificadores atómicos elegibles. `shuffleCatalogItems` aplica Fisher-Yates y recibe una fuente de azar opcional para poder verificarse de forma determinista. Cada avance consume hasta 24 identificadores sin reemplazo; al agotar la bolsa se crea otra permutación. `resolveDiscoveryItems` cruza después esos identificadores con el catálogo activo, de modo que un descarte concurrente no mantenga una unidad obsoleta en pantalla. Los composites se excluyen antes de barajar y las etiquetas activas delimitan el universo. Este estado no amplía las preferencias persistidas.

`useVirtualCatalogRows` calcula una ventana de altura fija con margen anterior y posterior. El DOM contiene solo las filas cercanas al área visible, mientras que los rellenos conservan la altura total y los atributos `aria-posinset` y `aria-setsize` describen la posición lógica. Si las mediciones muestran bloqueos en el filtrado con conjuntos mayores, un adaptador de infraestructura podrá trasladar ese cálculo a un Web Worker sin cambiar el contrato utilizado por la presentación.

La implementación no añade una librería de búsqueda ni una dependencia de virtualización. Una dependencia solo se evaluará cuando el comportamiento requerido y las mediciones demuestren que las funciones actuales no son suficientes.

## Persistencia local

Dexie implementa repositorios internos sobre IndexedDB. `DATABASE_VERSION` marca actualmente la versión 8. La declaración de la versión 1 permanece intacta y contiene `semordnilapStatuses`, con la clave compuesta:

```text
[datasetId + semordnilapId + status]
```

El registro no contiene `source` ni `target`. Un `SemordnilapId` dentro de su dataset representa las dos expresiones de la unidad. Aunque la clave conserva `status` y dispone de un índice `[datasetId + status]`, la aplicación mantiene una única selección funcional por semordnilap: `favorite`, `discarded` o ninguna.

El puerto `SemordnilapStatusRepository` expone consulta, selección en lote y retirada por colección. `SetSemordnilapStatuses` recibe la selección final de cada identidad y Dexie elimina los valores anteriores y escribe los nuevos dentro de una sola transacción. `useSemordnilapStatuses` proyecta la misma transición de forma optimista y vuelve a consultar el repositorio si falla. Al cargar, `NormalizeSemordnilapStatuses` repara conflictos antiguos dando prioridad a `discarded`. La importación, la exportación y los resúmenes aplican la misma política sin cambiar el esquema ni la versión de IndexedDB.

La versión 2 conserva esa tabla y añade:

- `savedComposites`, indexada por `id` y `datasetId`;
- `compositionDrafts`, con `datasetId` como clave primaria.

La versión 3 conserva las tres tablas y añade:

- `workspacePreferences`, con el identificador constante `workspace` como clave primaria.

La versión 4 conserva las cuatro tablas y añade:

- `tags`, indexada por su identidad y por el nombre normalizado único;
- `semordnilapTags`, con clave compuesta `[datasetId + semordnilapId + tagId]` e índices para consultar por dataset y etiqueta.

La versión 5 conserva los esquemas y completa cada etiqueta con un identificador de icono. La migración asigna `tag` a los registros de versión 4, sin modificar nombres, colores ni asignaciones.

La versión 6 añade `wordFilters`, con clave compuesta `[language + normalizedWord]`. La versión 7 reconstruye esa clave desde la grafía visible para conservar diacríticos. La versión 8 añade índices por estado y migra cada registro histórico a `excluded`; las nuevas decisiones pueden ser `verified` o `excluded`, mientras que `pending` se deriva del vocabulario.

Las actualizaciones son aditivas. Las pruebas abren bases reales de versiones 1, 2, 3 y 4, las actualizan a la versión actual y comprueban que los datos anteriores sobreviven. Las referencias de estado basadas en antiguas posiciones del TSV se reemplazan posteriormente dentro de una transacción, una vez que el dataset permite conocer la correspondencia segura.

La base local almacena únicamente aquello que no pueda reconstruirse de forma fiable. Actualmente persiste:

- estados genéricos del catálogo mediante referencias estables;
- registros de composites con referencias, identidad atómica, título y fechas;
- un borrador y su posición de inserción por dataset;
- preferencias globales y vistas de catálogo por dataset.
- definiciones globales de etiquetas y sus asignaciones a semordnilaps.
- decisiones léxicas por idioma y la activación de filtros por dataset.

La copia de seguridad utiliza un sobre con nombre de formato, versión y fecha de exportación. La versión 2 incorporó etiquetas y asignaciones; la 3, sus iconos; la 4, filtros por palabra; la 5, claves con diacríticos, y la 6, estados de revisión y filtros activos por dataset. El analizador continúa aceptando las versiones 1–5 y completa los campos ausentes durante la migración. En una combinación, las etiquetas se reconcilian por identidad y nombre normalizado antes de unir sus asignaciones.

La selección del dataset utiliza un puerto de aplicación independiente y una implementación pequeña sobre `localStorage`. La presentación solo conoce los casos de uso de lectura y escritura. Esta sesión ligera queda fuera de IndexedDB y de las copias personales porque puede reconstruirse y no contiene trabajo creado por el usuario.

La capa de aplicación analiza datos desconocidos, construye el resultado de la estrategia elegida y vuelve a resolver todos los composites contra los datasets incluidos. La infraestructura solo sustituye las siete tablas después de completar esa validación y lo hace dentro de una transacción Dexie. Un error de escritura revierte también los vaciados previos.

Renombrar un composite actualiza únicamente su título y fecha. La eliminación construye primero el cierre transitivo de sus dependencias. La presentación utiliza el plan para enumerar los derivados y la capa de aplicación rechaza la operación mientras exista alguno o mientras un borrador conserve la referencia. Solo un plan sin dependientes abre la confirmación final. La transacción vuelve a construir ese plan, bloquea la escritura si el grafo ha cambiado y elimina el composite, sus estados y sus asignaciones de etiquetas. El repositorio conserva la operación atómica sobre el conjunto exacto descrito por el plan como garantía de integridad, aunque la política de aplicación actual solo autoriza una raíz sin derivados. Estas operaciones dirigidas evitan reescribir colecciones no relacionadas y reducen el riesgo de perder una escritura concurrente.

Las expresiones derivadas de los composites y el contenido completo de los TSV no se guardan en IndexedDB.

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

La adaptación a pantallas estrechas pertenece únicamente a presentación. `useResponsiveLayout` observa una única consulta de medios y expone los modos `wide` y `compact`. `WorkspacePage` conserva una sola composición de hooks y casos de uso, y entrega ese modo únicamente a los componentes que necesitan cambiar de representación. No existe una página móvil paralela ni un segundo estado del catálogo.

Las variantes comparten contratos semánticos. `DatasetPicker` alterna entre el selector amplio y un botón compacto, pero ambos terminan en el mismo callback de selección. `CatalogSortControl` presenta botones directos en escritorio y una hoja inferior en móvil, mientras que `catalog-sort` concentra las transiciones puras para establecer, recorrer y combinar criterios. `CompositionToolbar` recibe capacidades y comandos, sin conocer el borrador ni la persistencia, y conserva todas sus acciones montadas para evitar cambios geométricos. `AnchoredPopover` resuelve posición, portal, cambios del viewport y cierre exterior para paneles no modales que deben permanecer vinculados visualmente a su control.

La interacción táctil de una fila también queda aislada en presentación. `catalog-row-pointer-machine` distingue espera, scroll, desplazamiento lateral y selección prolongada sin conocer React. Su configuración declara las direcciones permitidas; una dirección sin acción conserva desplazamiento cero y nunca alcanza el umbral de confirmación. `useCatalogRowPointerInteraction` aporta el temporizador, la captura del puntero, la vibración opcional y la supresión del clic posterior. `SemordnilapCatalogRow` conserva este estado por fila y solo comunica intenciones semánticas al catálogo. El catálogo traduce después esas intenciones a los mismos comandos de favoritos, descarte y restauración que utiliza la interfaz amplia.

La fila visible se desplaza mediante `transform` sobre un fondo independiente. `CatalogSwipeFeedback` representa la acción con icono, texto, dirección y estado de confirmación, pero no conoce repositorios ni ejecuta comandos. Añadir un favorito utiliza mostaza y una estrella; retirarlo utiliza violeta y una estrella con un signo menos. El umbral direccional deja libre el scroll vertical y el umbral de confirmación evita cambios accidentales. En el centro compacto, `SemordnilapRowActions` permite editar un composite activo. Una unidad descartada solo muestra el cheurón izquierdo y se restaura mediante gesto o selección múltiple. La pulsación prolongada y la entrada del menú mantienen una alternativa accesible.

`TriStateCheckbox` representa la selección global sin conocer virtualización ni persistencia. `PairedSemordnilapCatalog` calcula sus tres estados sobre `displayedItems`, que contiene el resultado lógico completo y no solo la ventana montada. Por tanto, seleccionar todos alcanza también filas fuera del DOM. `CatalogDiscoveryFab` recibe únicamente si existe una sesión y el comando para avanzar; su visibilidad depende de la representación compacta, la selección y los overlays, no de reglas de aplicación.

La integración visual de la pareja pertenece a CSS Modules. `WorkspacePage` limita las columnas de página y contenido con `minmax(0, 1fr)`; el marco y `PairedSemordnilapCatalog` declaran `width` y `max-width` del 100 %, y el catálogo contiene su tamaño inline. Este límite evita que una toolbar o un encabezado largo ensanche el grid antes de repartirlo. `SemordnilapCatalogRow` y la cabecera declaran exactamente dos columnas `minmax(0, 1fr)`, una para cada idioma. `SemordnilapRowActions` se posiciona sobre el 50 % del ancho y no participa en el cálculo del grid; `SemordnilapOption` reserva padding interior alrededor de esa superposición. La fila aplica un fondo continuo con dos matices y un estado seleccionado compartido. Cada opción mantiene un carril exterior estable y `SemordnilapRowMetadata` decide qué información única ocupa cada lado: etiquetas en el extremo de origen, y recuento seguido del indicador favorito en el extremo de destino. La cabecera sustituye el antiguo hueco central por una línea vertical superpuesta con los dos colores. En compacto, la toolbar envuelve únicamente grupos secundarios; `CatalogViewSwitcher` mantiene `Todos` y tres iconos sin wrapping, y el icono de etiquetas completa esa misma fila.

El inspector léxico de la composición reutiliza `AnchoredPopover`: se monta en `document.body`, queda visualmente unido al disparador y no provoca reflow del constructor. Su contenido conserva un grid de dos columnas iguales y limita cada lista a cinco filas con overflow vertical independiente. Los enlaces se derivan de la misma política que usa la revisión general.

Los overlays generales de la pantalla se coordinan mediante una unión explícita de estados excluyentes. `ModalDialog` se monta en `document.body` para no quedar recortado por contenedores con scroll, conserva el foco y adopta forma de hoja inferior en pantallas estrechas. Su variante `drawer` se alinea a la derecha, ocupa `100dvh` y anima una traslación horizontal; el resto del contrato de foco y cierre no cambia. `WorkspaceRoute` añade `tags`, por lo que `TagManagerPage` sustituye al antiguo overlay y permanece dentro del grid principal con la cabecera global disponible.

`AppHeader` ofrece un solo disparador de navegación con icono de hamburguesa. `AppMenuDialog` presenta en un único scroll navegación, resumen y backup de datos, preferencias, etiquetas y About. `WorkspacePage` traduce sus destinos a rutas hash y cierra el drawer antes de cambiar de pantalla. Los filtros léxicos ya no forman parte de esa cabecera global: `CatalogLanguageHeader` recibe el estado y el comando de activación de su propio idioma.

La estructura principal utiliza `100dvh`, áreas seguras y scroll interno. El catálogo contiene el desplazamiento vertical y un viewport común contiene el desplazamiento horizontal de las dos secuencias de composición. Los grupos de controles del catálogo envuelven sus elementos en filas nuevas; solo las secuencias de composición utilizan desplazamiento horizontal compartido.

## Animación y accesibilidad

Las interacciones sencillas utilizan CSS nativo con `transition`, `transform`, `opacity` y `@keyframes`. Las variables CSS comparten duraciones y curvas cuando resulte útil.

Toda animación debe:

- responder a una finalidad concreta;
- respetar `prefers-reduced-motion`;
- mantener la navegación mediante teclado;
- evitar movimientos inesperados de contenido;
- priorizar `transform` y `opacity` cuando sea posible.

Motion no forma parte del stack inicial. Solo se evaluará si aparecen gestos, reordenaciones o transiciones coordinadas que CSS no pueda mantener de forma razonable. Si se incorpora, permanecerá exclusivamente en presentación.

Arrastrar es una ayuda y no la única forma de componer. Los componentes admiten retirada con `Intro`, espacio, Suprimir o Retroceso, y movimiento con `Mayús` y las flechas laterales. El foco sigue siendo visible y cada pieza expone una descripción accesible de las acciones. Los estados de selección, error y confirmación tienen texto y semántica accesible y no dependen solo del color.

En la disposición compacta, los controles principales utilizan objetivos táctiles de al menos 44 píxeles. Las acciones representadas solo mediante iconos conservan `aria-label`, estado de disponibilidad y foco visible. Los mensajes normales de persistencia se mantienen como una región viva visualmente oculta para no consumir altura; los errores continúan visibles. Las hojas inferiores conservan cierre mediante botón, fondo o tecla Escape y evitan que el contenido quede bajo las barras o recortes del dispositivo.

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
