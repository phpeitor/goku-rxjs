## Goku RxJs

[![forthebadge](http://forthebadge.com/images/badges/made-with-javascript.svg)](https://www.linkedin.com/in/drphp/)
[![forthebadge](http://forthebadge.com/images/badges/built-with-love.svg)](https://www.linkedin.com/in/drphp/)

[![Video](https://img.youtube.com/vi/e03SYkcAgR4/0.jpg)](https://www.youtube.com/watch?v=e03SYkcAgR4)  
[![Video Demo](https://img.shields.io/badge/YouTube-FF0000?style=for-the-badge&logo=youtube)](https://www.youtube.com/watch?v=e03SYkcAgR4)

## Características
- UI retro con sprites y animaciones por frames.
- Control del nivel de poder con teclado y botones.
- Fondo gradiente movible y reactivo (parallax + variables CSS).
- Uso de RxJS para orquestar inputs, hold, decay y animaciones.

## Tech stack
- Vanilla JS + RxJS (bundled `js/rxjs.umd.js`)
- CSS moderno con variables y pseudo-elementos

## Quick start

1. Clona el repositorio:

```bash
git clone https://github.com/phpeitor/goku-rxjs.git
cd goku-rxjs
```

2. Instala dependencias:

```bash
npm install
```

3. Levanta el servidor local:

```bash
npm run serve
```

4. Abre `http://127.0.0.1:5500`.

### Alternativa sin npm

Si prefieres no instalar dependencias de Node, puedes usar un servidor local alternativo (no uses `file://`):

```bash
# usando Python 3
python -m http.server 8000

# o con Node (http-server)
npx http-server -c-1
```

## Desarrollo

- Ver `CONTRIBUTING.md` para reglas y convenciones de desarrollo.
- Archivo principal: `index.html`. Scripts en `js/`, estilos en `css/`.
- Para cambios visuales revisa DevTools → Elements para inspeccionar `#root::before` y las variables CSS.

## Notas
- Respeta `prefers-reduced-motion` para accesibilidad.
- Usa ramas por feature y commits claros (`feat(scope): descripción`).