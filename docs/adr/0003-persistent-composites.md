# ADR 0003: Composites y espacio de trabajo persistente

- Estado: aceptado
- Fecha: 2026-08-06

## Contexto

El área de composición necesitaba insertar piezas en posiciones intermedias, conservar el trabajo entre sesiones y permitir que una construcción útil se reutilizase dentro de otra. La persistencia existente utilizaba identificadores atómicos derivados de la posición en el TSV, por lo que reordenar filas podía romper estados y futuras referencias.

La base instalada en navegadores ya tenía una versión 1 con `semordnilapStatuses`. La ampliación no podía reinterpretar ni eliminar esos registros sin disponer del dataset que originó cada identificador.

## Decisión de identidad

Los identificadores atómicos pasan a derivarse de una huella determinista del dataset, idiomas, textos y formas normalizadas. La posición, el corpus y los valores cuantitativos no forman parte de la identidad. El cargador comprueba que no existan colisiones en el conjunto.

Cada DTO atómico conserva temporalmente el identificador basado en la antigua línea como alias. Cuando el dataset está disponible, el repositorio sustituye los estados antiguos por los identificadores estables dentro de una única transacción.

El identificador de un composite se deriva de la secuencia expandida de identificadores atómicos. Esta regla permite reconocer una composición ya guardada aunque se intente crear mediante otra agrupación anidada.

## Decisión de persistencia

La base utiliza `DATABASE_VERSION = 2`. La declaración de la versión 1 no se modifica. La versión 2 conserva `semordnilapStatuses` y añade:

```text
savedComposites: id, datasetId, createdAt, updatedAt
compositionDrafts: datasetId, updatedAt
```

`savedComposites` guarda las referencias directas, la secuencia atómica que protege su identidad, un título opcional y fechas. Las expresiones se derivan al cargar y no se persisten.

`compositionDrafts` guarda un borrador por dataset con sus referencias ordenadas y el índice de inserción. Las escrituras utilizan `put`, que reemplaza atómicamente el registro completo. Un borrador vacío elimina su registro.

## Decisión de composición

El borrador conserva una secuencia canónica y un cursor entre componentes. El espacio `i` de origen se refleja como `n - i` en destino. La selección de una pieza la inserta en el cursor y lo avanza.

Los componentes disponen de movimiento y retirada accesibles y el historial de sesión permite deshacer y rehacer operaciones que modifican la secuencia. La decisión visual inicial de utilizar botones fue sustituida por la interacción directa descrita en el ADR 0005. La secuencia canónica y el contrato del historial permanecen sin cambios.

Los composites guardados pueden utilizar favoritos y descartes existentes porque comparten `datasetId` y `semordnilapId`. Su promoción automática sobre los atómicos fue sustituida por el orden estable del ADR 0006; la vista `Guardados` continúa ofreciendo acceso directo a la colección.

## Integridad

Al resolver un composite se comprueban:

- todas las referencias directas;
- el dataset de cada referencia;
- la ausencia de ciclos;
- la secuencia atómica expandida;
- el identificador determinista;
- la relación inversa de las expresiones resultantes.

Un registro que no supere estas comprobaciones no se incorpora al catálogo y produce un error visible. La estructura de los composites es inmutable desde la interfaz. El título puede actualizarse como metadato y la eliminación está protegida por las referencias existentes. Guardar una secuencia existente devuelve el registro anterior y no escribe un duplicado.

## Consecuencias

- Reordenar filas de los TSV no cambia la identidad de sus semordnilaps.
- La migración de esquema no elimina estados de la versión 1.
- La migración semántica de identificadores ocurre solo con la correspondencia del dataset disponible.
- Los borradores sobreviven a recargas y cambios de dataset.
- Los composites pueden anidarse sin duplicar textos derivados.
- La exportación y la eliminación permanente se definen posteriormente en el ADR 0004.
