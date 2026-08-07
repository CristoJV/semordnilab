# ADR 0005: Interacción directa en la composición

- Estado: aceptado
- Fecha: 2026-08-06

## Contexto

Cada componente del área de composición mostraba controles para moverlo a ambos lados y retirarlo. Esos controles ocupaban más espacio que el texto, fragmentaban la lectura de la frase y trasladaban al usuario la mecánica interna de la secuencia. El mismo comportamiento debía resultar predecible con ratón, pantalla táctil y teclado, incluso en composites más anchos que el lienzo visible.

La interacción incluye varias condiciones temporales y espaciales. Resolverlas como estados booleanos dispersos en componentes dificultaría distinguir una pulsación, el inicio de un arrastre, el desplazamiento natural de una pantalla táctil y una cancelación.

## Decisión

Los componentes se muestran como piezas de texto compactas sin flechas ni botón de cierre. Una pulsación breve retira la pieza y presenta un aviso temporal con recuperación. El arrastre la mueve a otro espacio canónico.

Con ratón, superar un umbral pequeño de movimiento inicia el arrastre. Con pantalla táctil o lápiz, el arrastre solo comienza después de una pulsación prolongada de 300 milisegundos. Si el contacto se mueve antes de ese instante, el gesto se cancela para permitir el desplazamiento normal de la interfaz.

La interacción se representa mediante una máquina de estados pura con cuatro estados:

```text
idle
pressed
waiting-for-long-press
dragging
```

La función de transición solo recibe estado y evento. Como resultado devuelve un nuevo estado y efectos declarativos: programar o cancelar la espera, iniciar el arrastre, retirar, mover o cancelar. Los temporizadores, Pointer Events, captura del puntero, vibración opcional y referencias al DOM se mantienen en un hook de presentación.

El índice de destino se obtiene a partir de los espacios visibles, pero siempre se expresa en el orden canónico del idioma de origen. Cada espacio conserva una caja de geometría fija. Durante el arrastre solo se amplía mediante `transform` el botón `+` correspondiente al destino actual, en violeta para origen y mostaza para destino. Los demás indicadores pierden protagonismo sin cambiar de anchura. Mover una pieza genera una única operación de historial. Soltar claramente fuera de la franja vertical cancela el movimiento.

Las dos secuencias se alojan dentro de un único viewport horizontal. Una sola barra, adaptada a la paleta, mueve los composites de ambos idiomas al mismo tiempo. Las etiquetas de idioma se sitúan en una columna fija fuera del viewport y la barra de herramientas permanece en un bloque superior independiente. Cada carril delega el overflow en el contenedor compartido, por lo que no aparecen barras independientes ni el contenido intrínseco puede ensanchar la página.

Mientras se arrastra, acercarse a los extremos del viewport compartido inicia un desplazamiento horizontal progresivo. El ciclo utiliza `requestAnimationFrame`, se detiene en el centro o al alcanzar el límite y recalcula el espacio de destino después de cada avance. Esto permite ordenar composites largos sin ampliar el área de trabajo ni desalinear sus dos representaciones.

## Accesibilidad y avisos

El gesto no es el único medio disponible. Cada componente recibe foco, `Intro`, espacio, Suprimir y Retroceso lo retiran, y `Mayús` con las flechas laterales lo mueve. La descripción accesible informa de la pulsación y el arrastre.

Los resultados breves se presentan como cajas flotantes en la parte inferior. Los avisos usan naranja claro, los éxitos verde claro y los errores un rojo claro compatible con la paleta. Tienen un tiempo de vida corto, admiten cierre manual y permiten una acción contextual cuando puede revertirse la operación.

La recuperación de una retirada conserva la instancia y la posición exactas. Antes de aplicarla se comprueba que la referencia siga disponible en el dataset actual para evitar reintroducir datos incompatibles después de un cambio de contexto.

## Consecuencias

- La frase utiliza menos altura y se lee con menos interrupciones visuales.
- Ratón, entrada táctil y teclado comparten una regla explícita sin duplicar lógica de negocio.
- La máquina de estados y los cálculos geométricos se prueban sin renderizar React.
- El dominio, los casos de uso y la persistencia no conocen eventos de puntero.
- El arrastre largo puede alcanzar posiciones no visibles mediante desplazamiento lateral automático.
- Una sola posición horizontal mantiene sincronizados ambos idiomas sin eventos de scroll cruzados.
- La indicación del destino no altera la longitud visual de la frase ni el cálculo de los espacios.
- Retirar con una pulsación es una acción rápida, por lo que la recuperación temporal es parte necesaria de la interacción.
