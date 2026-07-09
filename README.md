# Amigo Invisible

Aplicación web estática para organizar sorteos de Amigo Invisible con participantes editables, restricciones entre personas, resultados privados y descarga en formato JSON.

## Características

- Diseño moderno, responsive y con modo oscuro por defecto.
- Colores principales en azul, violeta y detalles dorados.
- Participantes editables con validación de nombres repetidos.
- Restricciones para evitar que dos personas se asignen entre sí.
- Sorteo aleatorio donde nadie puede regalarse a sí mismo.
- Resultado privado por participante.
- Links privados para enviar un resultado individual a cada persona.
- Guardado local en el navegador para no perder el sorteo al recargar.
- Copia del resultado al portapapeles.
- Descarga de resultados en JSON.
- Reinicio del sorteo sin borrar participantes ni restricciones.
- Animación de confeti al finalizar.

## Estructura

```text
/
├── index.html
├── ayuda.html
├── styles.css
├── script.js
├── README.md
└── assets/
```

## Cómo usar

1. Abrí `index.html` en el navegador.
2. Completá el nombre del evento, presupuesto y fecha si querés guardar esos datos.
3. Agregá al menos 3 participantes.
4. Agregá restricciones si dos personas no pueden tocarse entre sí.
5. Presioná **Realizar sorteo**.
6. Para enviar resultados sin mostrar toda la lista, copiá el link privado de cada participante.
7. Mandale a cada persona únicamente su propio link.
8. Si querés ver un resultado desde la pantalla principal, seleccioná un participante y presioná **Ver mi amigo invisible**.
9. Cerrá el resultado para mantenerlo oculto.

## Cómo compartir los resultados

Después de realizar el sorteo, la app genera un link privado por participante. Ese link contiene solamente el resultado de esa persona, por lo que puede abrirse desde otro navegador, celular o computadora sin depender de los datos guardados en tu navegador.

Importante: como el sorteo se genera en tu navegador y no hay backend, la persona que organiza técnicamente podría abrir cualquier link antes de enviarlo. La app evita mostrar todos los resultados juntos, pero para que ni la persona organizadora pueda conocerlos haría falta un servidor o un sistema de claves más avanzado.

## Publicar en GitHub Pages

1. Subí estos archivos a un repositorio de GitHub.
2. Entrá en **Settings** del repositorio.
3. Abrí la sección **Pages**.
4. En **Build and deployment**, elegí **Deploy from a branch**.
5. Seleccioná la rama principal, normalmente `main`, y la carpeta `/root`.
6. Guardá los cambios.

GitHub generará una URL pública para compartir la aplicación.

## Notas técnicas

El proyecto usa solamente HTML, CSS y JavaScript. No requiere backend, base de datos ni frameworks. La única librería externa es `canvas-confetti`, cargada por CDN para la animación final del sorteo.
