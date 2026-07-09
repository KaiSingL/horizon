/**
 * Solar system body catalog.
 * Distances in AU, periods in Earth days, radii in Earth radii (visual scale applied at runtime).
 * Orbital elements approximate (J2000-ish averages) for educational fidelity.
 */

export const AU = 28; // scene units per AU (compromise scale)
export const EARTH_RADIUS_VIS = 0.55; // visual Earth radius in scene units
export const SUN_RADIUS_VIS = 3.2;

/** @typedef {{
 *  id: string,
 *  name: string,
 *  type: string,
 *  color: string,
 *  emissive?: string,
 *  a: number,
 *  e: number,
 *  i: number,
 *  period: number,
 *  radius: number,
 *  day: number,
 *  axialTilt: number,
 *  blurb: string,
 *  rings?: { inner: number, outer: number, color: string, opacity: number },
 *  moons?: Array<{ name: string, a: number, period: number, radius: number, color: string }>,
 *  meanAnomaly0?: number,
 *  node?: number,
 *  argPeri?: number,
 * }} BodyDef
 */

/** @type {BodyDef[]} */
export const BODIES = [
  {
    id: "sun",
    name: "Sun",
    type: "Star · G2V",
    color: "#ffcc66",
    emissive: "#ffaa33",
    a: 0,
    e: 0,
    i: 0,
    period: 0,
    radius: 109,
    day: 25.4,
    axialTilt: 7.25,
    blurb:
      "A G-type main-sequence star — 99.86% of the system’s mass. Nuclear fusion in its core powers light, wind, and the gravitational ballet of the planets.",
  },
  {
    id: "mercury",
    name: "Mercury",
    type: "Terrestrial",
    color: "#9a9a9a",
    a: 0.387,
    e: 0.2056,
    i: 7.0,
    period: 87.969,
    radius: 0.383,
    day: 58.646,
    axialTilt: 0.03,
    meanAnomaly0: 174.8,
    node: 48.3,
    argPeri: 29.1,
    blurb:
      "The innermost world: a cratered, airless rock with the most eccentric orbit among the classical planets and extreme day–night temperature swings.",
  },
  {
    id: "venus",
    name: "Venus",
    type: "Terrestrial",
    color: "#e8c99a",
    a: 0.723,
    e: 0.0068,
    i: 3.39,
    period: 224.701,
    radius: 0.949,
    day: -243.025,
    axialTilt: 177.4,
    meanAnomaly0: 50.4,
    node: 76.7,
    argPeri: 54.9,
    blurb:
      "Earth’s twin in size, wrapped in a crushing CO₂ atmosphere. Slow retrograde spin makes a Venusian day longer than its year.",
  },
  {
    id: "earth",
    name: "Earth",
    type: "Terrestrial",
    color: "#4f8fd8",
    a: 1.0,
    e: 0.0167,
    i: 0.0,
    period: 365.256,
    radius: 1.0,
    day: 0.997,
    axialTilt: 23.44,
    meanAnomaly0: 357.5,
    node: 0,
    argPeri: 114.2,
    blurb:
      "Our home — liquid water, a magnetic shield, and a large Moon that stabilizes the axial tilt. The reference for AU and the day.",
    moons: [
      {
        name: "Moon",
        a: 0.09,
        period: 27.322,
        radius: 0.272,
        color: "#c8c4b8",
      },
    ],
  },
  {
    id: "mars",
    name: "Mars",
    type: "Terrestrial",
    color: "#c45c3e",
    a: 1.524,
    e: 0.0934,
    i: 1.85,
    period: 686.98,
    radius: 0.532,
    day: 1.026,
    axialTilt: 25.19,
    meanAnomaly0: 19.4,
    node: 49.6,
    argPeri: 286.5,
    blurb:
      "The red planet: thin CO₂ air, polar ice, and evidence of ancient rivers. Two tiny moons — Phobos and Deimos — orbit nearby.",
  },
  {
    id: "jupiter",
    name: "Jupiter",
    type: "Gas giant",
    color: "#d4a574",
    a: 5.203,
    e: 0.0484,
    i: 1.3,
    period: 4332.59,
    radius: 11.21,
    day: 0.414,
    axialTilt: 3.13,
    meanAnomaly0: 20.0,
    node: 100.5,
    argPeri: 273.9,
    blurb:
      "King of planets — a hydrogen–helium world with a fierce storm system and a miniature system of moons. Dominates outer-system dynamics.",
  },
  {
    id: "saturn",
    name: "Saturn",
    type: "Gas giant",
    color: "#e8d5a3",
    a: 9.537,
    e: 0.0539,
    i: 2.49,
    period: 10759.22,
    radius: 9.45,
    day: 0.444,
    axialTilt: 26.73,
    meanAnomaly0: 317.0,
    node: 113.7,
    argPeri: 339.4,
    blurb:
      "Low-density giant famous for its icy ring system. Less massive than Jupiter but more visually iconic from afar.",
    rings: {
      inner: 1.2,
      outer: 2.25,
      color: "#d4c4a0",
      opacity: 0.75,
    },
  },
  {
    id: "uranus",
    name: "Uranus",
    type: "Ice giant",
    color: "#9fd9e0",
    a: 19.191,
    e: 0.0472,
    i: 0.77,
    period: 30688.5,
    radius: 4.01,
    day: -0.718,
    axialTilt: 97.77,
    meanAnomaly0: 142.2,
    node: 74.0,
    argPeri: 96.5,
    blurb:
      "An ice giant tipped on its side — seasons last decades. Methane in the atmosphere gives the pale cyan hue.",
  },
  {
    id: "neptune",
    name: "Neptune",
    type: "Ice giant",
    color: "#4169e1",
    a: 30.07,
    e: 0.0086,
    i: 1.77,
    period: 60182,
    radius: 3.88,
    day: 0.671,
    axialTilt: 28.32,
    meanAnomaly0: 256.2,
    node: 131.8,
    argPeri: 273.2,
    blurb:
      "The outermost classical planet: deep blue methane atmosphere, supersonic winds, and the distant moon Triton in retrograde orbit.",
  },
];

/** Visual radius scale: compress giant planet sizes so the system remains readable. */
export function visualRadius(body) {
  if (body.id === "sun") return SUN_RADIUS_VIS;
  const r = body.radius * EARTH_RADIUS_VIS;
  // Soft log-ish compression for gas giants
  if (body.radius > 3) {
    return EARTH_RADIUS_VIS * (1.4 + Math.log10(body.radius) * 2.8);
  }
  return Math.max(r, 0.18);
}
