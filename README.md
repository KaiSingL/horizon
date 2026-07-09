# Horizon — Solar System Observatory

An interactive Three.js simulation of the solar system with Keplerian orbits, a procedural starfield, adjustable time warp, and a modern glass-style HUD.

## Features

- **Realistic orbital motion** — elliptical orbits with eccentricity, inclination, ascending node, and argument of periapsis
- **Time warp** — logarithmic slider from ~1 h/s to ~100 years/s (pause is the play button)
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

## Deploy (GitHub Pages via Actions)

Site: **https://kaisingl.github.io/horizon/**

The workflow builds `dist/` and deploys it with the official Pages actions. **No bot commits** on `master`.

### One-time setting

1. Open **https://github.com/KaiSingL/horizon/settings/pages**
2. **Build and deployment → Source:** **GitHub Actions** (not “Deploy from a branch”)
3. Push to `master` (or run **Actions → Deploy to GitHub Pages → Run workflow**)

The build sets Vite `base` to `/horizon/` so assets resolve under the project URL.

### Manual deploy

**Actions → Deploy to GitHub Pages → Run workflow**

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
