# Amigo Invisible

Aplicación web estática para organizar sorteos de Amigo Invisible con participantes editables, restricciones entre personas, resultados privados y descarga en formato JSON.

## Características

- Diseño moderno, responsive y con modo oscuro por defecto.
- Colores principales en azul, violeta y detalles dorados.
- Participantes editables con validación de nombres repetidos.
- Restricciones para evitar que dos personas se asignen entre sí.
- Sorteo aleatorio donde nadie puede regalarse a sí mismo.
- Resultado privado por participante.
- Copia del resultado al portapapeles.
- Descarga de resultados en JSON.
- Reinicio del sorteo sin borrar participantes ni restricciones.
- Animación de confeti al finalizar.

## Estructura

```text
/
├── index.html
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
6. Para ver un resultado, seleccioná un participante y presioná **Ver mi amigo invisible**.
7. Cerrá el resultado para mantenerlo oculto.

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
