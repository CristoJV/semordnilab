# ADR 0004: Datos personales, preferencias y gestión de composites

- Estado: aceptado
- Fecha: 2026-08-06

## Contexto

Los composites, estados y borradores solo existían en el almacenamiento de un navegador. La aplicación necesitaba una forma segura de trasladarlos y recuperarlos. La ampliación de la interfaz también necesitaba recordar vistas sin llenar la barra superior de controles secundarios.

Los composites guardados aparecían en el catálogo, pero no disponían de un lugar donde consultar su estructura, cambiar el título o eliminarlos con información suficiente sobre sus dependencias.

## Decisión de interfaz

La barra superior se comprime y añade un único botón `Menú`. Su diálogo contiene dos secciones:

- `Datos` resume el contenido local y permite exportar o importar una copia;
- `Preferencias` controla si se recuerdan las vistas del catálogo y el estado plegado del área de composición.

Los controles cotidianos permanecen en el catálogo. Sus vistas son `Todos`, `Guardados`, `Favoritos` y `Descartados`. La ordenación se muestra junto al idioma. Los accesos duplicados mediante papeleras en cada cabecera fueron retirados posteriormente; la vista superior es el único acceso a la colección de descartados.

El indicador de un composite abre un diálogo de gestión. Cambiar el título no modifica su estructura. Abrir como borrador permite crear una variante sin editar indirectamente el registro original.

## Decisión de persistencia

La base utiliza `DATABASE_VERSION = 3`. Se conservan sin cambios las declaraciones de las versiones 1 y 2. La nueva versión añade:

```text
workspacePreferences: id, updatedAt
```

El registro contiene las opciones globales, el estado plegado y una vista por dataset. Todos los datos personales continúan dentro del mismo límite transaccional. Solo la última selección de dataset se conserva aparte como sesión ligera en `localStorage`; no contiene trabajo del usuario y no forma parte de la copia.

## Formato de copia

El JSON exportado declara:

- un identificador de formato fijo;
- una versión independiente de la versión de IndexedDB;
- la fecha de exportación;
- estados, composites, borradores y preferencias.

El formato y la eliminación descritos aquí se amplían en el [ADR 0007](0007-tags-and-cascade-deletion.md) para incorporar etiquetas y dependencias transitivas sin cambiar las garantías de atomicidad.

Los TSV no se incluyen porque forman parte de la aplicación y las entidades persistidas ya utilizan referencias estables.

La importación admite combinación o sustitución. En una combinación, los estados forman una unión, los composites se deduplican por identidad y los conflictos de borrador requieren una estrategia explícita. Las preferencias pueden excluirse.

Antes de escribir se comprueban la estructura del archivo, su versión, los datasets, los tipos de referencia, las posiciones de borrador y la integridad recursiva de los composites. Después se sustituyen las tablas en una sola transacción. La interfaz genera primero una copia descargable del estado actual.

## Eliminación de composites

La eliminación no puede dejar referencias rotas. Una transacción consulta los composites y el borrador del mismo dataset. Si alguno utiliza el registro, devuelve el número de dependencias y no modifica datos.

Cuando no existen dependencias, la misma transacción elimina el composite y todos sus estados. El borrador visible también impide iniciar la operación mientras contenga directamente la unidad.

Renombrar utiliza una actualización dirigida del registro. No sustituye tablas completas y conserva el identificador, la fecha de creación y los componentes.

## Consecuencias

- Los datos personales pueden trasladarse sin exportar corpus estáticos.
- Un archivo incompatible o corrupto no produce una importación parcial.
- Las migraciones anteriores siguen siendo comprobables y no se reescriben.
- Las preferencias viajan con la copia y pueden omitirse durante la importación.
- Los composites pueden administrarse sin introducir una página adicional.
- Una eliminación bloqueada explica si la dependencia procede de composites o borradores.
