/**
 * Keplerian orbital mechanics (2-body, Sun-centered).
 * Solves Kepler's equation and returns heliocentric position in scene units.
 */

const DEG = Math.PI / 180;

/**
 * Solve Kepler's equation M = E - e sin E for eccentric anomaly E.
 * @param {number} M mean anomaly (rad)
 * @param {number} e eccentricity
 */
export function solveKepler(M, e) {
  // Normalize M to [-π, π]
  let m = ((M + Math.PI) % (2 * Math.PI)) - Math.PI;
  if (m < -Math.PI) m += 2 * Math.PI;

  let E = e < 0.8 ? m : Math.PI;
  for (let i = 0; i < 12; i++) {
    const f = E - e * Math.sin(E) - m;
    const fp = 1 - e * Math.cos(E);
    const d = f / fp;
    E -= d;
    if (Math.abs(d) < 1e-10) break;
  }
  return E;
}

/**
 * @param {import('./data/bodies.js').BodyDef} body
 * @param {number} daysSinceEpoch
 * @param {number} auScale
 * @param {{ x: number, y: number, z: number }} out
 */
export function heliocentricPosition(body, daysSinceEpoch, auScale, out) {
  if (!body.a || body.period <= 0) {
    out.x = 0;
    out.y = 0;
    out.z = 0;
    return out;
  }

  const n = (2 * Math.PI) / body.period; // rad/day
  const M0 = (body.meanAnomaly0 ?? 0) * DEG;
  const M = M0 + n * daysSinceEpoch;
  const e = body.e;
  const E = solveKepler(M, e);

  // True anomaly
  const cosE = Math.cos(E);
  const sinE = Math.sin(E);
  const sqrt1e = Math.sqrt(1 - e * e);
  const cosNu = (cosE - e) / (1 - e * cosE);
  const sinNu = (sqrt1e * sinE) / (1 - e * cosE);
  const r = body.a * (1 - e * cosE) * auScale;

  // Perifocal coordinates (orbital plane)
  let x = r * cosNu;
  let y = 0;
  let z = r * sinNu;

  // Rotate by argument of periapsis, inclination, longitude of ascending node
  const w = (body.argPeri ?? 0) * DEG;
  const i = (body.i ?? 0) * DEG;
  const Omega = (body.node ?? 0) * DEG;

  // R3(Ω) · R1(i) · R3(ω)
  const cosw = Math.cos(w);
  const sinw = Math.sin(w);
  const cosi = Math.cos(i);
  const sini = Math.sin(i);
  const cosO = Math.cos(Omega);
  const sinO = Math.sin(Omega);

  // First: arg periapsis about Y (out of plane is Y in our scene — we use XZ orbital plane, Y up)
  // Standard astronomy: orbital plane in XY, Z out. We map: astro X→scene X, astro Y→scene Z, astro Z→scene Y
  const x1 = x * cosw - z * sinw;
  const z1 = x * sinw + z * cosw;
  // y1 = 0

  // Inclination about X
  const x2 = x1;
  const y2 = z1 * sini; // raised out of plane
  const z2 = z1 * cosi;

  // Node about Y
  out.x = x2 * cosO - z2 * sinO;
  out.y = y2;
  out.z = x2 * sinO + z2 * cosO;

  return out;
}

/**
 * Build a THREE.BufferGeometry line of an elliptical orbit.
 * @param {import('./data/bodies.js').BodyDef} body
 * @param {number} auScale
 * @param {number} segments
 * @returns {Float32Array} positions length segments*3
 */
export function orbitPolyline(body, auScale, segments = 256) {
  const positions = new Float32Array((segments + 1) * 3);

  // Closed orbit via true anomaly 0..2π (independent of epoch)
  for (let i = 0; i <= segments; i++) {
    const nu = (i / segments) * Math.PI * 2;
    const e = body.e;
    const a = body.a * auScale;
    const r = (a * (1 - e * e)) / (1 + e * Math.cos(nu));
    let x = r * Math.cos(nu);
    let z = r * Math.sin(nu);

    const w = (body.argPeri ?? 0) * DEG;
    const inc = (body.i ?? 0) * DEG;
    const Omega = (body.node ?? 0) * DEG;
    const cosw = Math.cos(w);
    const sinw = Math.sin(w);
    const cosi = Math.cos(inc);
    const sini = Math.sin(inc);
    const cosO = Math.cos(Omega);
    const sinO = Math.sin(Omega);

    const x1 = x * cosw - z * sinw;
    const z1 = x * sinw + z * cosw;
    const y2 = z1 * sini;
    const z2 = z1 * cosi;
    x = x1 * cosO - z2 * sinO;
    const y = y2;
    z = x1 * sinO + z2 * cosO;

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
  }

  return positions;
}
