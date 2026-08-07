# ADR 0002: Estados genéricos del catálogo

- Estado: aceptado
- Fecha: 2026-08-05

## Contexto

El catálogo necesita permitir que una persona destaque semordnilaps útiles, aparte temporalmente los que no desea explorar y recupere los descartados más adelante. Las dos expresiones visibles pertenecen al mismo `AtomicSemordnilap`, por lo que cualquier acción debe conservar la alineación entre idiomas.

Un modelo con propiedades específicas como `favorite` o `discardedFrom` acoplaría el almacenamiento a las primeras interacciones. Guardar además `source` o `target` permitiría representar estados parciales que contradicen la identidad compartida de la fila.

## Decisión

Cada estado se representa como un registro genérico:

```ts
type SemordnilapStatusRecord = {
  datasetId: DatasetId
  semordnilapId: SemordnilapId
  status: 'favorite' | 'discarded'
}
```

La clave persistente es `[datasetId + semordnilapId + status]`. La lista de valores admitidos pertenece al contrato de aplicación, pero `favorite` y `discarded` forman un grupo mutuamente excluyente. La selección final de una unidad es `favorite`, `discarded` o ninguna. Añadir un valor futuro exige declarar si pertenece a este grupo o si constituye una clasificación compatible diferente.

El estado se aplica a la unidad completa. No se almacena el idioma desde el que se inició la acción. Descartar desde cualquier lado oculta la fila completa y la vista de descartados muestra las dos expresiones relacionadas.

La presentación ofrece acciones individuales y selección múltiple. La decisión inicial de promover favoritos fue sustituida por el orden estable del ADR 0006. El catálogo puede ordenarse alfabéticamente o por longitud en ambos idiomas mediante controles con estados ascendente, descendente y desactivado.

## Persistencia y capas

`SemordnilapStatusRepository` se define como puerto de aplicación. Los casos de uso consultan y establecen la selección final de una o varias unidades sin conocer IndexedDB. Infraestructura implementa cada lote mediante una transacción de Dexie que retira los estados previos y añade, cuando corresponde, el nuevo valor. `app` construye las dependencias concretas.

React mantiene una proyección de los estados del dataset seleccionado y actualiza la interfaz de forma optimista. Si una operación falla, el hook de presentación recupera la instantánea persistida y muestra el error. Los registros antiguos y las copias con ambos valores se normalizan dando prioridad a `discarded`. Deshacer un descarte conserva la selección anterior dentro del efecto de recuperación.

Los TSV no se copian a IndexedDB. Los identificadores estables del dataset y del semordnilap son suficientes para volver a aplicar los estados cuando se carga el catálogo estático.

## Consecuencias

- Las dos columnas permanecen alineadas durante favorito, descarte y restauración.
- Favorito y descartado nunca coexisten en la proyección ni en la persistencia normalizada.
- Cambiar el estado de un lote constituye una única escritura transaccional.
- Añadir un estado futuro no requiere rediseñar la identidad del registro.
- El estado local depende de que los identificadores del catálogo sigan siendo estables.
- La eliminación del almacenamiento del navegador también elimina estas preferencias.
- Los gestos de pulsación prolongada o deslizamiento pueden añadirse como atajos de presentación sin modificar el modelo persistente.
