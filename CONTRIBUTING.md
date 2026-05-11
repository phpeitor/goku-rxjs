# Contribuir / Reglas de desarrollo

Estas son las reglas y convenciones para desarrollar en este proyecto.

## Principios generales
- Mantén las responsabilidades separadas: CSS en `css/`, JS en `js/`, assets en `img/` y `fonts/`.
- Prefiere código claro y pequeño: commits atómicos y descriptivos.

## RxJS y manejo de eventos
- Usa RxJS para streams, entradas y timers (observables en lugar de múltiples listeners).
- Evita lógica imperativa dispersa; centraliza el flujo de eventos cuando sea posible.

## Accesibilidad y motion
- Respeta `prefers-reduced-motion`: desactiva o atenúa animaciones para usuarios que lo soliciten.
- Añade `alt` en imágenes y asegúrate de que controles sean navegables con teclado.

## Variables CSS y rendimiento
- Exponer configuraciones visuales (blur, opacidad, saturación, posiciones) mediante variables CSS y actualizar desde JS.
- Anima preferiblemente `transform` y `opacity` para reducir repaints.
- Usa `will-change` con moderación.

## Branching y commits
- Trabaja en ramas feature: `feature/<nombre>`, `fix/<descripcion>` para hotfixes.
- Mensajes de commit: `tipo(scope): descripción breve` (ej.: `feat(ui): fondo dinámico con RxJS`).
- Tipos comunes: `feat`, `fix`, `chore`, `docs`, `refactor`, `style`, `test`.

## Pull Request / Checklist
- Describir el cambio en el PR y la razón.
- Incluir capturas o pasos para reproducir cambios visuales.
- Asegurarse de que no haya errores en la consola y comprobar `prefers-reduced-motion`.

## Probar localmente
- Servir desde un servidor local (no abrir `file://`):

  - Python 3: `python -m http.server 8000`
  - Node (http-server): `npx http-server -c-1` (instala `http-server` si lo necesitas)

- Luego abre `http://localhost:8000` (o el puerto usado).

## Contacto
- Para dudas o revisiones, abre un issue describiendo el problema y el objetivo del cambio.
