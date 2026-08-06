# ADR 0001: Primera interfaz de exploración y composición

- Estado: aceptado
- Fecha: 2026-08-05

Los controles visibles de movimiento y retirada descritos en esta decisión fueron sustituidos posteriormente por la interacción directa del ADR 0005. La estructura general de la pantalla y su identidad visual permanecen vigentes.

## Contexto

La primera interfaz debe permitir validar una iteración vertical completa de la aplicación sin introducir todavía persistencia local. La experiencia está pensada para una pantalla más ancha que alta, debe enfrentar visualmente los dos idiomas y reservar un área clara para agrupar semordnilaps.

La solución debe respetar Clean Architecture, cargar todos los `AtomicSemordnilap` del conjunto seleccionado y mantener una implementación modular sin crear abstracciones prematuras.

## Decisión

Se adopta una pantalla única con header, área de composición, catálogo bilingüe en dos columnas y footer. Este documento registra la estructura, las interacciones y el plan utilizados para implementarla.

## Resultado esperado

La aplicación permite elegir un conjunto lingüístico, cargar todos sus `AtomicSemordnilap`, explorarlos desde ambos idiomas y agrupar los seleccionados en un área de composición.

El resultado de la composición todavía no se persiste. El objetivo de este paso es validar el flujo principal entre datos, dominio, casos de uso y presentación.

## Estructura de la pantalla

```text
+-----------------------------------------------------------------------+
| Semordnilab       [ Español / Gallego  v ]       1.091 elementos      |
+-----------------------------------------------------------------------+
|                                                                       |
|                        ÁREA DE COMPOSICIÓN                            |
|                                                                       |
| origen    [A] [B] [C]                                                 |
| destino   [C′] [B′] [A′]                                             |
|                                                                       |
+----------------------------------+------------------------------------+
| ESPAÑOL                          | GALLEGO                            |
| [ Buscar...                    ] | [ Buscar...                      ] |
|                                  |                                    |
|                           ella   | a lle                              |
|                          no se   | e son                              |
|                            años  | son a                              |
|                            nada  | adán                               |
+----------------------------------+------------------------------------+
|                              SemordniLAB                              |
+-----------------------------------------------------------------------+
```

La estructura principal utiliza la altura completa disponible:

- el header es compacto y estable;
- el área de composición ocupa el ancho completo y una altura suficiente para reconocer la secuencia;
- el catálogo utiliza el espacio restante y permite desplazamiento interno;
- el footer permanece al final del flujo y no tapa contenido.

## Header

El header contiene:

- el nombre `Semordnilab`;
- un selector de conjuntos lingüísticos disponibles;
- un contador de semordnilaps cargados;
- el estado de carga o error cuando corresponda.

Seleccionar un conjunto inicia su carga automáticamente. Un cambio rápido de selección cancela o ignora la carga anterior para evitar mostrar datos del conjunto equivocado.

## Área de composición

El área de composición representa un borrador de `CompositeSemordnilap`.

Inicialmente muestra un estado vacío sencillo:

```text
Selecciona semordnilaps de las listas para empezar a componer.
```

Cada selección añade una referencia al final de la secuencia canónica de origen. La secuencia de destino se deriva en orden inverso. Seleccionar desde la columna de destino utiliza el mismo `AtomicSemordnilap` y no crea una segunda fuente de verdad.

En este primer paso el área permite:

- añadir un semordnilap desde cualquiera de las listas;
- retirar un componente concreto;
- vaciar la composición;
- mostrar el resultado normalizado y su estado de validez;
- admitir repeticiones intencionadas.

La inserción por ambos extremos, el reordenamiento, el anidamiento de composites guardados y el arrastre se incorporarán cuando el flujo básico esté comprobado.

Si la secuencia supera el ancho disponible, sus componentes se desplazan horizontalmente dentro del área sin ensanchar la página.

## Catálogo bilingüe

Las dos columnas consumen el mismo conjunto de `AtomicSemordnilap`:

- la izquierda representa `source` y alinea el texto hacia la derecha;
- la derecha representa `target` y alinea el texto hacia la izquierda;
- ambas identifican cada elemento mediante el mismo `SemordnilapId`;
- cada idioma mantiene su propia consulta de búsqueda;
- las consultas se combinan mediante intersección sobre el conjunto compartido;
- cada fila representa las dos expresiones de un mismo semordnilap;
- ambas columnas utilizan una única posición de desplazamiento.

Una consulta en cualquiera de los idiomas reduce simultáneamente las dos columnas. La segunda consulta solo puede refinar el conjunto producido por la primera. Esta relación evita mostrar expresiones sin su correspondencia y mantiene la alineación en todo momento.

La primera búsqueda admite coincidencia parcial sobre el texto visible y la forma normalizada. La búsqueda difusa avanzada no es necesaria para comprobar esta interfaz.

Todos los semordnilaps del conjunto seleccionado se cargan en memoria. `PairedSemordnilapCatalog` encapsula el filtrado y el renderizado de filas para que se pueda incorporar virtualización más adelante sin modificar la página ni los casos de uso. La primera implementación se mantiene sencilla y se optimiza solo después de medir el conjunto más grande.

## Paleta

La paleta inicial utiliza estos roles, que podrán ajustarse durante la implementación visual:

```css
:root {
  --color-surface: #fbfaf6;
  --color-surface-strong: #ffffff;
  --color-text: #27232f;
  --color-border: #ded9d0;

  --color-violet: #6b4bb6;
  --color-violet-soft: #f0ebfa;

  --color-mustard: #c79a26;
  --color-mustard-dark: #70520a;
  --color-mustard-soft: #fff4d2;
}
```

El violeta se utiliza para origen, foco y acciones principales. El mostaza identifica el destino. `--color-mustard-dark` se utiliza cuando el color aparece como texto sobre un fondo claro.

Los componentes del área de composición combinan ambos lenguajes visuales sin utilizar degradados o efectos que dificulten la lectura.

## Componentes de presentación

La primera interfaz necesita componentes específicos y pequeños:

```text
presentation/
  pages/
    WorkspacePage
  components/
    AppHeader
    DatasetSelector
    CompositionWorkspace
    SemordnilapComponent
    PairedSemordnilapCatalog
    CatalogLanguageHeader
    SemordnilapOption
    AppFooter
  hooks/
    useSemordnilapCatalog
    useCompositionWorkspace
  view-models/
    SemordnilapCatalogViewModel
    CompositionWorkspaceViewModel
```

No se crea todavía un catálogo genérico de componentes visuales. Una abstracción compartida aparece únicamente cuando dos componentes reales repiten la misma responsabilidad.

## Casos de uso y puertos

La iteración utiliza:

- `ListAvailableDatasets`;
- `LoadAtomicSemordnilaps`;
- un puerto `SemordnilapDatasetSource`;
- un adaptador `StaticTsvSemordnilapDatasetSource`;
- validación del `AtomicSemordnilap` en dominio;
- composición e inversión mediante funciones puras de dominio.

El borrador de composición vive durante esta iteración en memoria. Dexie no participa porque todavía no existe una operación de guardado.

## Plan de implementación adoptado

### 1. Base del dominio

- definir `AtomicSemordnilap`, expresiones, identificadores y códigos de idioma;
- implementar inversión y validación Unicode;
- implementar la derivación de una composición desde referencias ordenadas;
- probar secuencias vacías, simples, repetidas e inválidas.

### 2. Carga del catálogo

- definir los datasets disponibles;
- crear el puerto de lectura y sus casos de uso;
- implementar el parser TSV y sus mappers;
- añadir estados de carga, error y conjunto vacío;
- comprobar el cambio rápido entre datasets.

### 3. Estructura visual

- crear el layout vertical de pantalla completa;
- implementar header, área de composición, columnas y footer;
- aplicar los tokens neutros, violetas y mostaza mediante CSS Modules;
- adaptar el layout para evitar desbordamiento vertical u horizontal.

### 4. Exploración

- mostrar las expresiones enfrentadas;
- alinear la columna izquierda hacia el centro y la derecha hacia el centro;
- añadir dos consultas combinadas sobre un único conjunto filtrado;
- representar cada correspondencia en una fila bilingüe con desplazamiento compartido;
- incorporar navegación y selección mediante teclado;
- medir el renderizado con el dataset más grande.

### 5. Composición en memoria

- añadir componentes desde cualquiera de las listas;
- representar origen y destino en orden inverso;
- permitir retirar y vaciar componentes;
- mostrar validación y estado vacío;
- mantener una única secuencia canónica.

### 6. Verificación

- probar dominio y casos de uso sin React ni Dexie;
- probar carga correcta, errores de TSV y cancelación;
- comprobar foco, contraste, movimiento reducido y mensajes accesibles;
- ejecutar formato, lint, pruebas y compilación;
- actualizar esta documentación según el comportamiento final.

## Criterios de finalización

Este primer paso se considera completo cuando:

- el selector carga cualquiera de los datasets incluidos;
- todos sus semordnilaps quedan disponibles para búsqueda y selección;
- ambas columnas muestran el idioma correcto y se orientan hacia el centro;
- cualquier búsqueda actualiza ambas columnas sin romper la alineación;
- la combinación de consultas solo refina el conjunto compartido;
- una selección desde cualquier columna añade el componente correcto;
- el destino se actualiza siempre en orden inverso;
- retirar o vaciar componentes no desincroniza las expresiones;
- los estados de carga, vacío y error son comprensibles;
- la interfaz principal funciona con ratón y teclado;
- no existe acceso a archivos o persistencia desde componentes React.

## Consecuencias

- La aplicación ofrece una funcionalidad completa y verificable antes de incorporar IndexedDB.
- El área de composición utiliza una única secuencia canónica y deriva el destino, lo que evita estados duplicados.
- Los datasets completos se mantienen en memoria durante la sesión seleccionada.
- El renderizado de las listas queda encapsulado para poder añadir virtualización si las mediciones la justifican.
- La primera composición solo admite `AtomicSemordnilap`, inserción al final, retirada y vaciado.
- El guardado, el anidamiento de `CompositeSemordnilap` y el reordenamiento requieren decisiones posteriores.
