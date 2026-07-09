# Horizon — Solar System Observatory (Grok 4.5 Test)

An interactive Three.js simulation of the solar system with Keplerian orbits, a procedural starfield, adjustable time warp, and a modern glass-style HUD.

## Features

- **Realistic orbital motion** — elliptical orbits with eccentricity, inclination, ascending node, and argument of periapsis
- **Time warp** — logarithmic slider from hours/sec to ~100 years/sec, pause, and reset to J2000 epoch
- **Bodies** — Sun, eight planets, Earth’s Moon; Saturn rings; procedural surface textures
- **Cosmos** — multi-layer starfield, milky band, faint nebula sprites, bloom
- **Camera** — orbit / zoom / pan, focus any body (`1`–`9`), frame system (`0` or button)
- **View toggles** — orbit paths, labels, motion trails, ecliptic reference rings

## Run

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

## Deploy (GitHub Pages)

Site: **https://kaisingl.github.io/horizon/**

On every push to `master`/`main`, GitHub Actions:

1. Builds from source (`vite` always rewrites the entry to `/src/main.js`)
2. Verifies the bundle is not a stale re-pack of old assets
3. Commits production `index.html` + `assets/` (+ `docs/`) for branch Pages
4. Publishes `gh-pages` as well

**Settings → Pages:** Deploy from a branch → `master` / `(root)` *or* `/docs` *or* `gh-pages`.

### Why Pages went stale before

Production `index.html` pointed at `./assets/old-bundle.js`. That file was committed for Pages, and the next `vite build` treated it as the entry — so CI kept re-shipping the **old** JS even when `src/` was fixed.

## Controls

| Input | Action |
|--------|--------|
| Drag | Orbit camera |
| Scroll | Zoom |
| Space | Play / pause |
| `R` | Reset epoch |
| `1`–`9` | Focus body (Sun → Neptune) |
| `0` | Frame whole system |

## Stack

- [Three.js](https://threejs.org/) + OrbitControls + UnrealBloom
- Vite
- Vanilla JS (ES modules)

## Notes on scale

Planet sizes are exaggerated relative to orbital distances so the system is readable. Orbital periods, eccentricities, and inclinations follow approximate real values for educational visualization—not spacecraft-grade ephemerides.
