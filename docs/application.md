# Guía de la aplicación

## Qué es Semordnilab

Semordnilab es una aplicación web para explorar y construir semordnilaps bilingües. Un semordnilap relaciona dos expresiones cuyas formas normalizadas se corresponden al invertir el orden de sus caracteres.

La aplicación parte de semordnilaps extraídos previamente de corpus lingüísticos. Cada uno contiene una expresión de origen y su expresión inversa en otro idioma (o en el mismo idioma), junto con información que puede ayudar a explorarlo, como frecuencia, número de palabras y puntuación.

El propósito es ofrecer un espacio creativo de exploración lingüística. No hay puntos, clasificaciones ni mecánicas competitivas.

## Plataforma

La aplicación funciona completamente en el navegador, sin un backend propio, y se publica mediante GitHub Pages. Los datasets incluidos forman parte de los recursos estáticos. Las preferencias, favoritos y semordnilaps compuestos guardados permanecen en IndexedDB.

El funcionamiento sin conexión se ofrecerá cuando los recursos necesarios ya estén disponibles en el navegador. Una experiencia offline garantizada requerirá definir y verificar una estrategia de caché.

## Conceptos principales

### Semordnilap individual

Es un semordnilap indivisible procedente de un dataset. Puede contener una palabra o una expresión de varias palabras, pero la aplicación siempre lo trata como una sola unidad. En el modelo de dominio se denomina `AtomicSemordnilap`.

### Semordnilap compuesto

Es un semordnilap formado por una secuencia ordenada de otros semordnilaps. Sus componentes pueden ser individuales o compuestos, por lo que la estructura admite anidamiento. En el modelo de dominio se denomina `CompositeSemordnilap`.

Si el lado de origen contiene `A + B + C`, el lado de destino contiene `C′ + B′ + A′`. El resultado completo conserva la misma propiedad inversa y puede utilizarse como una única pieza dentro de otra composición.

### Componente

Es la aparición de un semordnilap dentro del constructor. El componente conserva una referencia al semordnilap original. Aunque el usuario lo seleccione desde uno de los idiomas, la aplicación incorpora también su expresión correspondiente.

### Forma normalizada

Es la representación utilizada para comparar e invertir expresiones. Los datasets incluidos ya proporcionan esta forma sin espacios y con las transformaciones lingüísticas aplicadas durante su generación. El texto original se conserva para mostrarlo al usuario.

## Experiencia principal

La pantalla se organiza verticalmente para aprovechar una ventana más ancha que alta:

1. Una barra superior con la identidad de la aplicación, el selector del conjunto lingüístico y el estado de carga.
2. Un área de composición donde se agrupan los semordnilaps seleccionados.
3. Un catálogo inferior con los dos idiomas en columnas paralelas.
4. Un pie de página compacto con la marca `SemordniLAB`.

El área de composición ocupa todo el ancho disponible y permanece por encima de las listas. Muestra dos secuencias relacionadas. La secuencia de origen conserva el orden de selección y la secuencia de destino se presenta en orden inverso.

```text
origen:  [A]  [B]  [C]
destino: [C′] [B′] [A′]
```

Cuando todavía no hay componentes, el área ofrece una indicación breve para empezar. No se llena con paneles decorativos ni información secundaria.

Debajo aparecen los dos exploradores. La columna izquierda alinea sus semordnilaps hacia la derecha y la columna derecha los alinea hacia la izquierda. Las expresiones quedan orientadas visualmente hacia el punto de encuentro entre ambos idiomas.

Cada explorador dispone de búsqueda y filtros propios. Al seleccionar una expresión, el semordnilap completo se añade al área de composición y su expresión correspondiente aparece en la secuencia inversa.

Desde el constructor se pueden añadir componentes a cualquiera de los extremos, cambiar el orden cuando la operación sea válida y retirar componentes. Cada cambio actualiza simultáneamente los dos idiomas.

La correspondencia visual entre componentes debe permanecer visible para que se entienda cómo se forma el resultado.

## Identidad visual

La interfaz utiliza una base neutra y una combinación de violeta y mostaza:

- el violeta identifica el idioma de origen y sus componentes;
- el mostaza identifica el idioma de destino y sus componentes;
- los fondos de ambos colores son claros y poco saturados;
- el texto utiliza tonos oscuros con contraste suficiente;
- selección, foco y validación incluyen forma, borde o texto además del color.

El mostaza intenso se reserva para fondos, bordes e indicadores. Sobre superficies claras se utiliza una variante mostaza oscura para mantener la legibilidad.

La marca del pie de página se escribe como `SemordniLAB`, destacando visualmente `LAB` sin alterar el texto accesible.

## Selección de un conjunto lingüístico

La aplicación incluye inicialmente estos datasets:

| Conjunto            | Archivo                     | Contenido actual aproximado |
| ------------------- | --------------------------- | --------------------------: |
| Español y español   | `public/datasets/es_es.tsv` |          6.642 semordnilaps |
| Español y gallego   | `public/datasets/es_gl.tsv` |          1.091 semordnilaps |
| Español y portugués | `public/datasets/es_pt.tsv` |          4.513 semordnilaps |

El usuario podrá elegir uno de los conjuntos disponibles. Los archivos incluidos marcan el esquema de referencia para incorporar otros conjuntos compatibles.

## Búsqueda y filtros

La búsqueda se realiza de forma independiente en cada idioma. Debe admitir:

- diferencias de mayúsculas, minúsculas y tildes;
- coincidencias parciales y por varias palabras;
- consulta sobre el texto visible y la forma normalizada;
- pequeños errores tipográficos;
- ordenación por relevancia.

Los filtros previstos incluyen longitud, frecuencia, número de palabras y favoritos. La búsqueda puede aplicar un breve _debounce_ para evitar trabajo innecesario mientras se escribe.

## Validación de una composición

El constructor informa de su estado sin interrumpir la exploración. Un semordnilap compuesto guardable debe cumplir al menos estas condiciones:

- contiene dos o más componentes;
- todos los componentes hacen referencia a un semordnilap válido;
- la concatenación normalizada de un idioma es la inversión de la del otro;
- la estructura anidada no contiene referencias circulares.

La repetición de un componente no se considera inválida por defecto: puede ser una decisión creativa. La interfaz debe hacerla visible y permitir retirarla. Esta regla evita interpretar como error una intención que la aplicación no puede conocer.

## Favoritos

Los semordnilaps individuales y compuestos pueden marcarse como favoritos. El estado se muestra en las listas y se puede utilizar como filtro. Marcar o desmarcar un elemento no modifica su contenido.

## Guardado y reutilización

Un semordnilap compuesto válido se puede guardar con:

- la lista ordenada de referencias a sus componentes;
- un título opcional;
- etiquetas, descripción u observaciones opcionales;
- la fecha de creación y de última modificación.

Las expresiones resultantes se derivan de los componentes y no constituyen una fuente de verdad independiente.

Los semordnilaps compuestos guardados forman una colección local y pueden reutilizarse como componentes de otras composiciones. La reutilización conserva la procedencia, permite resolver los componentes individuales originales y rechaza cualquier ciclo.

## Persistencia y exportación

La aplicación guarda preferencias, favoritos, datasets externos y semordnilaps compuestos en el navegador. No requiere cuenta ni servidor. Los datasets incluidos se sirven como archivos estáticos y no necesitan duplicarse en la base de datos local.

El usuario podrá exportar su colección para conservarla o trasladarla. El formato de intercambio deberá incluir referencias suficientes para reconstruir y validar las composiciones anidadas.

Una futura ampliación podría añadir sincronización entre dispositivos, colecciones compartidas y colaboración. Estas posibilidades no forman parte de la especificación actual.
