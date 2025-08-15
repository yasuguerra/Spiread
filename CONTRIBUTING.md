# Contributing to Spiread

## Branches
- `feat/<descripcion>` para nuevas funcionalidades
- `fix/<descripcion>` para correcciones de errores
- `chore/<descripcion>` para tareas de mantenimiento

Todas las PRs deben apuntar a `release/hardening-rc`.

## Commits
Sigue el estándar [Conventional Commits](https://www.conventionalcommits.org/).

## Pull Requests
Antes de abrir una PR ejecuta:
- `yarn build`
- `yarn test:all`

Si tu cambio afecta juegos, incluye al menos una prueba e2e con Playwright.
Verifica accesibilidad básica (sin errores críticos de Axe) y que la CSP/headers se mantengan válidos.

## Tests
Cada nueva característica de juego debe incluir una prueba e2e mínima.
