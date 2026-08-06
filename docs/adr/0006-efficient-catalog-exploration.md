# ADR 0006: Exploración eficiente del catálogo

- Estado: aceptado
- Fecha: 2026-08-06

## Contexto

Los datasets incluidos contienen hasta varios miles de semordnilaps. El filtrado en memoria era rápido, pero la vista montaba una fila completa por cada resultado. Además, marcar un favorito o guardar un composite promovía la fila al principio de `Todos`, haciendo que desapareciese de la posición desde la que se estaba explorando.

La aplicación necesitaba facilitar tanto una búsqueda conocida como el descubrimiento creativo sin añadir un lenguaje de consulta, filtros adicionales ni controles permanentes en cada cabecera.

## Decisión de orden y búsqueda

Los estados no modifican el orden. Marcar un favorito actualiza la estrella y su pertenencia a `Favoritos`, pero conserva la posición actual. Los composites se incorporan después de los elementos atómicos y la vista `Guardados` permite aislarlos. Solo una consulta activa o los criterios de ordenación explícitos cambian la secuencia.

Cada campo conserva una única consulta continua. No se divide en términos ni incorpora navegación especial mediante teclado. Cuando no hay ordenación explícita, las coincidencias se clasifican como exactas, iniciales o parciales. La intersección de ambos idiomas se mantiene y el fragmento visible se resalta con una correspondencia segura para diacríticos.

La selección, puntuación y localización del resaltado son funciones puras de presentación. No modifican entidades, casos de uso ni persistencia.

## Decisión de descubrimiento

`Descubrir` toma hasta 24 unidades activas y reparte el grupo entre expresiones cortas, medias y largas. Una semilla produce una selección determinista durante el renderizado, y `Otro grupo` avanza la semilla. Buscar, ordenar o cambiar de vista cancela el modo.

El descubrimiento es efímero. No se incorpora al formato de preferencias ni a la base de datos.

## Decisión de renderizado

El catálogo utiliza filas de altura conocida y calcula una ventana visible con margen. Solo esa ventana se monta en el DOM. Dos rellenos equivalentes a las filas omitidas conservan la altura total, y cada fila visible comunica su posición y el tamaño lógico de la colección mediante atributos accesibles.

El contenedor no se reinicia cuando cambia un favorito o se abre un diálogo de composite. Las consultas, vistas, ordenaciones y nuevos grupos sí vuelven al inicio porque sustituyen deliberadamente el conjunto mostrado.

## Simplificación visual

La pestaña `Descartados` es el único acceso superior a esa colección. Se retiran las papeleras duplicadas de las dos cabeceras. La acción individual de descarte permanece en cada fila como una papelera secundaria, además de la selección múltiple y la recuperación temporal.

Los avisos del catálogo y de la composición comparten una única cola flotante. El indicador textual `C` de los composites se sustituye por un icono de capas. En la composición, señalar o enfocar una pieza resalta también su correspondencia en el otro idioma.

## Consecuencias

- Cambiar estados deja de producir saltos inesperados.
- El número de nodos depende del área visible y no del tamaño completo del resultado.
- La búsqueda conocida y la exploración casual tienen entradas distintas y sencillas.
- No cambia el esquema de IndexedDB ni el formato de las copias de seguridad.
- La altura fija limita cada expresión a dos líneas visibles; el texto completo sigue disponible en el nombre accesible y el título de frecuencia.
- La máquina de estados de puntero y las pruebas de integración cubren la interacción disponible, pero la variación propia de navegadores táctiles requiere validación manual o un entorno end-to-end con navegador instalado.
