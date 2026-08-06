# Semordnilab

**Un laboratorio para descubrir, ordenar y combinar palabras que esconden otra expresión al leerse en sentido inverso.**

Semordnilab convierte colecciones de semordnilaps en un espacio de exploración bilingüe. Cada resultado mantiene alineadas sus dos caras para que puedas comparar palabras, guardar hallazgos y construir composiciones más largas sin perder la relación entre idiomas.

[Probar Semordnilab](https://cristojv.github.io/semordnilab/) · [Conocer el proyecto](docs/README.md)

## Explora palabras en ambos sentidos

Un semordnilap relaciona dos expresiones distintas: al invertir una aparece la otra. La aplicación muestra cada par en dos columnas coordinadas y deja el centro para trabajar con ellos.

Con Semordnilab puedes:

- recorrer colecciones de español, gallego y portugués sin perder la alineación entre pares;
- buscar, ordenar y descubrir resultados desde cualquiera de los dos idiomas;
- marcar favoritos o apartar temporalmente palabras que no te interesan;
- crear etiquetas personales para clasificar y filtrar hallazgos;
- arrastrar semordnilaps hasta el área de trabajo y colocarlos en el punto exacto de una composición;
- guardar composites y reutilizarlos como nuevas piezas;
- conservar borradores y preferencias directamente en el navegador;
- exportar una copia de seguridad e importarla cuando la necesites.

No requiere una cuenta ni envía tu trabajo a un servidor. Las preferencias, los borradores y las composiciones guardadas permanecen en el almacenamiento local del navegador.

## Colecciones disponibles

La primera colección reúne más de doce mil semordnilaps distribuidos entre tres pares de idiomas:

| Par de idiomas      | Semordnilaps |
| ------------------- | -----------: |
| Español y español   |        6.642 |
| Español y gallego   |        1.091 |
| Español y portugués |        4.513 |

## Hacia dónde va

- [x] Explorar pares lingüísticos con listas siempre alineadas
- [x] Crear, guardar y reutilizar composites
- [x] Conservar preferencias y copias de seguridad en local
- [x] Organizar semordnilaps mediante etiquetas personales
- [ ] Afinar la experiencia táctil y la accesibilidad
- [ ] Ampliar las herramientas para revisar y organizar colecciones
- [ ] Preparar una experiencia instalable y disponible sin conexión

El roadmap muestra la dirección general del producto, no compromete fechas ni versiones. Las decisiones y el comportamiento implementado se explican en la [documentación del proyecto](docs/README.md).

## Desarrollo local

```bash
npm install
npm run dev
```

Las comprobaciones disponibles son `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm test` y `npm run build`.

## Licencia

El repositorio todavía no declara una licencia. Hasta que se añada una, no debe asumirse permiso de redistribución o reutilización fuera de sus titulares.
