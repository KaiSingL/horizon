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

This repo deploys with **GitHub Actions** on every push to `main` or `master`.

### One-time setup (required)

Open this link on your repo:

**https://github.com/KaiSingL/horizon/settings/pages**

Under **Build and deployment**:

| Field | Value |
|--------|--------|
| **Source** | **Deploy from a branch** |
| **Branch** | **`gh-pages`** |
| **Folder** | **`/ (root)`** |

Click **Save**. Wait ~1–2 minutes, then hard-refresh:

**https://kaisingl.github.io/horizon/**

#### Why this matters

| Branch | What it contains | Works? |
|--------|------------------|--------|
| `master` | Vite **source** (`/src/main.js`) | No — 404 |
| `gh-pages` | Production **build** (`./assets/...`) | Yes |

If Pages points at `master`, the browser requests `/src/main.js` and fails.  
The deploy workflow always publishes the built site to `gh-pages`.

### Manual deploy

**Actions → Deploy to GitHub Pages → Run workflow**.

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
