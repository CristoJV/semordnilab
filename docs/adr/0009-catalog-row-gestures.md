# ADR 0009: Gestos táctiles en las filas del catálogo

- Estado: aceptado
- Fecha: 2026-08-07

## Contexto

En una pantalla estrecha, la estrella y la papelera del centro competían por un espacio muy pequeño y fragmentaban la lectura de la pareja bilingüe. La aplicación ya distinguía toque breve, pulsación prolongada y desplazamiento vertical. Añadir gestos laterales mediante estados independientes habría permitido que varias interpretaciones intentasen responder al mismo puntero.

La unidad manipulada es el semordnilap completo, no una de sus expresiones. Cualquier movimiento debe conservar juntas y alineadas ambas columnas. Los gestos tampoco pueden ser la única forma de cambiar estados porque necesitan una alternativa comprensible y accesible.

## Decisión

`SemordnilapCatalogRow` representa una fila bilingüe completa y conserva su interacción táctil. La fila utiliza `useCatalogRowPointerInteraction`, que interpreta los efectos de una máquina de estados pura llamada `catalog-row-pointer-machine`.

La máquina contiene estos estados:

```text
idle
pending
scrolling
swiping
selection-triggered
```

Un contacto empieza en `pending`. Soltar sin superar ningún umbral conserva el clic normal y añade el semordnilap a la composición. Esperar 420 milisegundos entra en selección múltiple. Cuando domina el movimiento vertical, el estado pasa a `scrolling` y deja actuar al navegador. Cuando domina el movimiento horizontal, pasa a `swiping` y cancela la espera prolongada.

El gesto necesita 10 píxeles para fijar una dirección y 72 píxeles para confirmar una acción. El desplazamiento visual se limita a 112 píxeles. Cruzar el umbral de confirmación produce una vibración opcional. Soltar antes devuelve suavemente la fila al centro; soltar después emite una única intención semántica.

Las direcciones se traducen en presentación:

- derecha añade el favorito o lo retira si ya estaba presente;
- izquierda descarta desde las vistas activas;
- izquierda restaura desde la vista de descartados.

La fila se mueve mediante `transform` y revela `CatalogSwipeFeedback`. Este fondo muestra un icono sobre una etiqueta textual y cambia de color según la acción. No ejecuta casos de uso ni conoce el estado persistido.

El centro móvil utiliza cheurones como indicación visual. En los composites aparece una nota con lápiz entre ellos. Tocar este control abre una hoja con las mismas acciones escritas y, cuando corresponde, el acceso a la gestión del composite. La selección múltiple continúa disponible mediante el botón `Seleccionar` y la pulsación prolongada.

Los cambios de favorito, descarte y restauración utilizan los casos de uso existentes. Cada acción individual muestra un aviso con recuperación. Restaurar al menos diez descartados solicita confirmación. Un aviso sobre los gestos se presenta una sola vez y su marca local no forma parte de los datos personales exportables.

## Verificación

La máquina de estados se prueba sin React para toque, selección prolongada, scroll, ambos sentidos, límites y umbral de confirmación. El hook se prueba con Pointer Events para comprobar la supresión del clic posterior. Las pruebas de la página verifican el fondo con icono y etiqueta, los cambios de estado, la restauración y la confirmación de colecciones grandes. La hoja alternativa y el icono específico de composites tienen pruebas de componente.

## Consecuencias

- Toque, scroll, selección y gesto lateral tienen una única interpretación coordinada.
- La animación afecta a una fila montada y no obliga a renderizar de nuevo todo el catálogo.
- El dominio, los casos de uso y la base de datos permanecen sin cambios.
- La entrada por teclado y la hoja de acciones evitan depender exclusivamente del gesto.
- La dirección de cada acción puede convertirse en una preferencia futura sin cambiar la máquina de estados.
