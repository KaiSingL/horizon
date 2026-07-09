import * as THREE from "three";
import { BODIES, AU, visualRadius } from "./data/bodies.js";
import { heliocentricPosition, orbitPolyline } from "./orbit.js";

const _pos = { x: 0, y: 0, z: 0 };

/**
 * Build the full solar system: meshes, orbits, labels, trail buffers.
 */
export function createSolarSystem(scene) {
  const root = new THREE.Group();
  root.name = "solarSystem";
  scene.add(root);

  /** @type {Map<string, BodyRuntime>} */
  const byId = new Map();
  const orbitGroup = new THREE.Group();
  orbitGroup.name = "orbits";
  root.add(orbitGroup);

  const trailGroup = new THREE.Group();
  trailGroup.name = "trails";
  trailGroup.visible = false;
  root.add(trailGroup);

  const ecliptic = createEclipticGrid();
  ecliptic.visible = false;
  root.add(ecliptic);

  for (const def of BODIES) {
    const runtime = createBody(def);
    root.add(runtime.pivot);
    byId.set(def.id, runtime);

    if (def.a > 0) {
      const orbit = createOrbitLine(def);
      orbitGroup.add(orbit);
      runtime.orbitLine = orbit;

      const trail = createTrail(def);
      trailGroup.add(trail.line);
      runtime.trail = trail;
    }
  }

  return {
    root,
    byId,
    orbitGroup,
    trailGroup,
    ecliptic,
    bodies: BODIES,

    /**
     * @param {number} days
     */
    update(days) {
      for (const def of BODIES) {
        const rt = byId.get(def.id);
        if (!rt) continue;

        if (def.id === "sun") {
          rt.mesh.rotation.y += 0.002;
          continue;
        }

        heliocentricPosition(def, days, AU, _pos);
        rt.pivot.position.set(_pos.x, _pos.y, _pos.z);

        // Axial spin proportional to day length (visual)
        if (def.day !== 0) {
          const spin = ((2 * Math.PI) / Math.abs(def.day)) * 0.02 * Math.sign(def.day || 1);
          rt.mesh.rotation.y += spin;
        }

        // Moons
        if (rt.moons) {
          for (const m of rt.moons) {
            const ang = (days / m.period) * Math.PI * 2;
            m.mesh.position.set(
              Math.cos(ang) * m.a * AU,
              0,
              Math.sin(ang) * m.a * AU
            );
          }
        }

        // Trails
        if (rt.trail) {
          rt.trail.push(_pos.x, _pos.y, _pos.z);
        }
      }
    },

    setOrbitsVisible(v) {
      orbitGroup.visible = v;
    },
    setTrailsVisible(v) {
      trailGroup.visible = v;
      if (!v) {
        for (const rt of byId.values()) {
          if (rt.trail) rt.trail.clear();
        }
      }
    },
    setEclipticVisible(v) {
      ecliptic.visible = v;
    },
  };
}

/**
 * @typedef {{
 *  def: import('./data/bodies.js').BodyDef,
 *  pivot: THREE.Group,
 *  mesh: THREE.Object3D,
 *  orbitLine?: THREE.Line,
 *  trail?: ReturnType<typeof createTrail>,
 *  moons?: Array<{ mesh: THREE.Mesh, a: number, period: number }>,
 * }} BodyRuntime
 */

/** @param {import('./data/bodies.js').BodyDef} def */
function createBody(def) {
  const pivot = new THREE.Group();
  pivot.name = def.id;

  const radius = visualRadius(def);
  let mesh;

  if (def.id === "sun") {
    mesh = createSun(radius);
  } else {
    mesh = createPlanet(def, radius);
  }

  // Axial tilt
  mesh.rotation.z = THREE.MathUtils.degToRad(def.axialTilt || 0);
  pivot.add(mesh);

  /** @type {BodyRuntime} */
  const runtime = { def, pivot, mesh };

  if (def.moons?.length) {
    runtime.moons = [];
    for (const m of def.moons) {
      const mr = Math.max(m.radius * 0.35, 0.08);
      const geo = new THREE.SphereGeometry(mr, 24, 24);
      const mat = new THREE.MeshStandardMaterial({
        color: m.color,
        roughness: 0.9,
        metalness: 0.05,
      });
      const moonMesh = new THREE.Mesh(geo, mat);
      moonMesh.castShadow = false;
      pivot.add(moonMesh);
      runtime.moons.push({ mesh: moonMesh, a: m.a, period: m.period });
    }
  }

  return runtime;
}

function createSun(radius) {
  const group = new THREE.Group();

  const core = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 64, 64),
    new THREE.MeshBasicMaterial({ color: 0xffcc55 })
  );
  group.add(core);

  // Inner glow shell
  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(radius * 1.15, 48, 48),
    new THREE.MeshBasicMaterial({
      color: 0xffaa22,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.BackSide,
    })
  );
  group.add(glow);

  // Corona
  const corona = new THREE.Mesh(
    new THREE.SphereGeometry(radius * 1.55, 48, 48),
    new THREE.MeshBasicMaterial({
      color: 0xff8800,
      transparent: true,
      opacity: 0.12,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.BackSide,
    })
  );
  group.add(corona);

  // Soft billboard halo
  const haloTex = makeRadialTexture("#ffdd88", "#ff6600");
  const halo = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: haloTex,
      color: 0xffcc66,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  halo.scale.set(radius * 6, radius * 6, 1);
  group.add(halo);

  // Point light from the sun
  const light = new THREE.PointLight(0xfff0d0, 2.8, 0, 0.35);
  light.position.set(0, 0, 0);
  group.add(light);

  // Secondary fill so dark sides aren't pure black
  const fill = new THREE.PointLight(0x8899cc, 0.15, 0, 0.5);
  group.add(fill);

  return group;
}

/** @param {import('./data/bodies.js').BodyDef} def */
function createPlanet(def, radius) {
  const group = new THREE.Group();
  const segs = def.radius > 3 ? 48 : 40;

  const geo = new THREE.SphereGeometry(radius, segs, segs);

  // Slight color variation via canvas texture for terrestrial worlds
  const map = makePlanetTexture(def);
  const mat = new THREE.MeshStandardMaterial({
    map,
    color: 0xffffff,
    roughness: def.type.includes("Gas") || def.type.includes("Ice") ? 0.55 : 0.78,
    metalness: 0.08,
    emissive: new THREE.Color(def.color).multiplyScalar(0.04),
  });

  const planet = new THREE.Mesh(geo, mat);
  group.add(planet);

  // Atmosphere limb for Earth / ice giants
  if (def.id === "earth" || def.id === "uranus" || def.id === "neptune" || def.id === "venus") {
    const atmColor =
      def.id === "earth"
        ? 0x6eb6ff
        : def.id === "venus"
          ? 0xffddaa
          : 0x88ddff;
    const atm = new THREE.Mesh(
      new THREE.SphereGeometry(radius * 1.06, 32, 32),
      new THREE.MeshBasicMaterial({
        color: atmColor,
        transparent: true,
        opacity: def.id === "venus" ? 0.18 : 0.14,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.BackSide,
      })
    );
    group.add(atm);
  }

  // Saturn rings
  if (def.rings) {
    const { inner, outer, color, opacity } = def.rings;
    const ringGeo = new THREE.RingGeometry(radius * inner, radius * outer, 96);
    // UV fix for ring texture feel
    const pos = ringGeo.attributes.position;
    const uv = ringGeo.attributes.uv;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const u = (Math.sqrt(x * x + y * y) - radius * inner) / (radius * (outer - inner));
      uv.setXY(i, u, 0.5);
    }
    const ringMap = makeRingTexture(color);
    const ringMat = new THREE.MeshBasicMaterial({
      map: ringMap,
      color: 0xffffff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity,
      depthWrite: false,
    });
    const rings = new THREE.Mesh(ringGeo, ringMat);
    rings.rotation.x = Math.PI / 2;
    group.add(rings);
  }

  return group;
}

/** @param {import('./data/bodies.js').BodyDef} def */
function createOrbitLine(def) {
  const positions = orbitPolyline(def, AU, 360);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const col = new THREE.Color(def.color);
  col.multiplyScalar(0.55);
  const mat = new THREE.LineBasicMaterial({
    color: col,
    transparent: true,
    opacity: 0.35,
    depthWrite: false,
  });
  const line = new THREE.Line(geo, mat);
  line.name = `orbit-${def.id}`;
  return line;
}

function createTrail(def, maxPoints = 400) {
  const positions = new Float32Array(maxPoints * 3);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setDrawRange(0, 0);
  const col = new THREE.Color(def.color);
  const mat = new THREE.LineBasicMaterial({
    color: col,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
  });
  const line = new THREE.Line(geo, mat);
  let head = 0;
  let count = 0;
  let frameSkip = 0;

  return {
    line,
    push(x, y, z) {
      frameSkip++;
      if (frameSkip % 2 !== 0) return;
      positions[head * 3] = x;
      positions[head * 3 + 1] = y;
      positions[head * 3 + 2] = z;
      head = (head + 1) % maxPoints;
      count = Math.min(count + 1, maxPoints);

      // Rebuild ordered buffer for continuous line
      if (count < maxPoints) {
        geo.setDrawRange(0, count);
      } else {
        // Rotate so line is continuous from oldest to newest
        const ordered = new Float32Array(maxPoints * 3);
        for (let i = 0; i < maxPoints; i++) {
          const src = ((head + i) % maxPoints) * 3;
          ordered[i * 3] = positions[src];
          ordered[i * 3 + 1] = positions[src + 1];
          ordered[i * 3 + 2] = positions[src + 2];
        }
        geo.attributes.position.array.set(ordered);
        geo.setDrawRange(0, maxPoints);
      }
      geo.attributes.position.needsUpdate = true;
    },
    clear() {
      head = 0;
      count = 0;
      geo.setDrawRange(0, 0);
    },
  };
}

function createEclipticGrid() {
  const group = new THREE.Group();
  const maxAU = 32;
  const mat = new THREE.LineBasicMaterial({
    color: 0x3a5080,
    transparent: true,
    opacity: 0.2,
    depthWrite: false,
  });

  for (const rAU of [1, 5, 10, 20, 30]) {
    const pts = [];
    const r = rAU * AU;
    for (let i = 0; i <= 128; i++) {
      const a = (i / 128) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    group.add(new THREE.Line(geo, mat));
  }

  // Cross axes
  const axisMat = new THREE.LineBasicMaterial({
    color: 0x4a6090,
    transparent: true,
    opacity: 0.25,
    depthWrite: false,
  });
  const axisLen = maxAU * AU;
  group.add(
    new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-axisLen, 0, 0),
        new THREE.Vector3(axisLen, 0, 0),
      ]),
      axisMat
    )
  );
  group.add(
    new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, -axisLen),
        new THREE.Vector3(0, 0, axisLen),
      ]),
      axisMat
    )
  );

  return group;
}

function makeRadialTexture(inner, outer) {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const ctx = c.getContext("2d");
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, inner);
  g.addColorStop(0.25, outer);
  g.addColorStop(0.55, "rgba(255,100,0,0.15)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** @param {import('./data/bodies.js').BodyDef} def */
function makePlanetTexture(def) {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 256;
  const ctx = c.getContext("2d");
  const base = def.color;

  // Base fill
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 512, 256);

  // Noise bands / continents
  const img = ctx.getImageData(0, 0, 512, 256);
  const d = img.data;
  const seed = hashStr(def.id);

  for (let y = 0; y < 256; y++) {
    for (let x = 0; x < 512; x++) {
      const i = (y * 512 + x) * 4;
      const n =
        fbm(x * 0.02 + seed, y * 0.04 + seed * 0.3) * 0.5 +
        fbm(x * 0.06, y * 0.1) * 0.25;

      if (def.id === "earth") {
        // oceans vs land
        const land = n > 0.12;
        if (land) {
          d[i] = 60 + n * 80;
          d[i + 1] = 110 + n * 90;
          d[i + 2] = 50 + n * 40;
        } else {
          d[i] = 40 + n * 30;
          d[i + 1] = 90 + n * 50;
          d[i + 2] = 180 + n * 40;
        }
        // ice caps
        if (y < 28 || y > 228) {
          d[i] = d[i + 1] = d[i + 2] = 230;
        }
      } else if (def.type.includes("Gas") || def.type.includes("Ice")) {
        const band = Math.sin(y * 0.12 + n * 3) * 0.5 + 0.5;
        const col = new THREE.Color(base);
        col.offsetHSL(0, 0, (band - 0.5) * 0.18 + n * 0.08);
        d[i] = (col.r * 255) | 0;
        d[i + 1] = (col.g * 255) | 0;
        d[i + 2] = (col.b * 255) | 0;
        if (def.id === "jupiter" && Math.abs(y - 150) < 12 && n > 0.2) {
          // great red spot-ish
          d[i] = 200;
          d[i + 1] = 90;
          d[i + 2] = 60;
        }
      } else if (def.id === "mars") {
        const col = new THREE.Color(base);
        col.offsetHSL(0, 0, n * 0.15 - 0.05);
        d[i] = (col.r * 255) | 0;
        d[i + 1] = (col.g * 255) | 0;
        d[i + 2] = (col.b * 255) | 0;
        if (y < 20 || y > 236) {
          d[i] = 220;
          d[i + 1] = 230;
          d[i + 2] = 240;
        }
      } else {
        const col = new THREE.Color(base);
        col.offsetHSL(0, 0, n * 0.12 - 0.06);
        d[i] = (col.r * 255) | 0;
        d[i + 1] = (col.g * 255) | 0;
        d[i + 2] = (col.b * 255) | 0;
      }
      d[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function makeRingTexture(hex) {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 8;
  const ctx = c.getContext("2d");
  const col = new THREE.Color(hex);
  for (let x = 0; x < 512; x++) {
    const t = x / 512;
    const gap = Math.abs(t - 0.55) < 0.03 ? 0.05 : 1; // Cassini-ish
    const band = 0.35 + 0.65 * Math.abs(Math.sin(t * 40));
    const a = band * gap;
    ctx.fillStyle = `rgba(${(col.r * 255) | 0},${(col.g * 255) | 0},${(col.b * 255) | 0},${a})`;
    ctx.fillRect(x, 0, 1, 8);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  return tex;
}

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return (h >>> 0) % 1000;
}

function hash2(x, y) {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

function noise2(x, y) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi);
  const b = hash2(xi + 1, yi);
  const c = hash2(xi, yi + 1);
  const d = hash2(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

function fbm(x, y) {
  let v = 0;
  let a = 0.5;
  let f = 1;
  for (let i = 0; i < 4; i++) {
    v += a * noise2(x * f, y * f);
    a *= 0.5;
    f *= 2;
  }
  return v;
}
