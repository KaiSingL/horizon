import * as THREE from "three";

/**
 * Multi-layer procedural cosmos: distant stars, bright foreground stars, milky band.
 */
export function createStarfield(rng = Math.random) {
  const group = new THREE.Group();
  group.name = "starfield";

  group.add(makeStarLayer({ count: 8000, radius: 900, size: 0.7, rng, brightness: 0.85 }));
  group.add(makeStarLayer({ count: 2500, radius: 700, size: 1.4, rng, brightness: 1.0, colorful: true }));
  group.add(makeStarLayer({ count: 400, radius: 500, size: 2.2, rng, brightness: 1.15, colorful: true }));
  group.add(createMilkyWay(rng));
  group.add(createNebulaHints(rng));

  return group;
}

function makeStarLayer({ count, radius, size, rng, brightness = 1, colorful = false }) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);

  const palette = [
    new THREE.Color(0xffffff),
    new THREE.Color(0xa8c8ff),
    new THREE.Color(0xffe4b5),
    new THREE.Color(0xffc8a0),
    new THREE.Color(0xc8e0ff),
    new THREE.Color(0xffeedd),
  ];

  for (let i = 0; i < count; i++) {
    // Uniform-ish on sphere
    const u = rng();
    const v = rng();
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);
    const r = radius * (0.75 + rng() * 0.25);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);

    const c = colorful ? palette[(rng() * palette.length) | 0] : palette[0];
    const b = brightness * (0.45 + rng() * 0.55);
    colors[i * 3] = c.r * b;
    colors[i * 3 + 1] = c.g * b;
    colors[i * 3 + 2] = c.b * b;
    sizes[i] = size * (0.5 + rng());
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geo.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));

  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexColors: true,
    uniforms: {
      uScale: { value: size },
    },
    vertexShader: /* glsl */ `
      attribute float aSize;
      varying vec3 vColor;
      void main() {
        vColor = color;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = aSize * (280.0 / -mv.z);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec3 vColor;
      void main() {
        vec2 uv = gl_PointCoord - 0.5;
        float d = length(uv);
        float alpha = smoothstep(0.5, 0.0, d);
        alpha *= alpha;
        gl_FragColor = vec4(vColor, alpha);
      }
    `,
  });

  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  return points;
}

function createMilkyWay(rng) {
  const count = 6000;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  // Galactic plane tilted ~60° for drama
  const tilt = 1.05;
  for (let i = 0; i < count; i++) {
    const angle = rng() * Math.PI * 2;
    const arm = Math.sin(angle * 2.5) * 40;
    const spread = (rng() - 0.5) * (25 + Math.abs(arm) * 0.3);
    const radius = 200 + rng() * 550;
    let x = Math.cos(angle) * radius + (rng() - 0.5) * 30;
    let y = spread + arm * 0.15;
    let z = Math.sin(angle) * radius + (rng() - 0.5) * 30;

    // Tilt
    const cy = y * Math.cos(tilt) - z * Math.sin(tilt);
    const cz = y * Math.sin(tilt) + z * Math.cos(tilt);
    y = cy;
    z = cz;

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    const warm = rng() > 0.55;
    const b = 0.15 + rng() * 0.35;
    if (warm) {
      colors[i * 3] = 0.85 * b;
      colors[i * 3 + 1] = 0.75 * b;
      colors[i * 3 + 2] = 0.95 * b;
    } else {
      colors[i * 3] = 0.55 * b;
      colors[i * 3 + 1] = 0.65 * b;
      colors[i * 3 + 2] = 1.0 * b;
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.PointsMaterial({
    size: 1.6,
    vertexColors: true,
    transparent: true,
    opacity: 0.7,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  });

  const pts = new THREE.Points(geo, mat);
  pts.frustumCulled = false;
  return pts;
}

function createNebulaHints(rng) {
  const group = new THREE.Group();
  const sprites = 5;
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  const g = ctx.createRadialGradient(128, 128, 10, 128, 128, 128);
  g.addColorStop(0, "rgba(120,160,255,0.55)");
  g.addColorStop(0.35, "rgba(80,100,200,0.18)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(canvas);

  const hues = [0x6688cc, 0x8866aa, 0x5599aa, 0xaa7755, 0x6677bb];
  for (let i = 0; i < sprites; i++) {
    const mat = new THREE.SpriteMaterial({
      map: tex,
      color: hues[i % hues.length],
      transparent: true,
      opacity: 0.12 + rng() * 0.1,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const s = new THREE.Sprite(mat);
    const ang = rng() * Math.PI * 2;
    const r = 350 + rng() * 200;
    s.position.set(Math.cos(ang) * r, (rng() - 0.5) * 120, Math.sin(ang) * r);
    const sc = 80 + rng() * 140;
    s.scale.set(sc, sc * (0.6 + rng() * 0.5), 1);
    group.add(s);
  }
  return group;
}
