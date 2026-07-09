import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

import { createStarfield } from "./starfield.js";
import { createSolarSystem } from "./system.js";
import {
  sliderToDaysPerSecond,
  formatWarp,
  formatEpoch,
  formatPeriod,
  formatDistanceAU,
  formatRadiusEarth,
  formatDay,
} from "./time.js";

// ── Renderer & scene ──────────────────────────────────────────────
const canvas = document.getElementById("c");
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: "high-performance",
  alpha: false,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x03050a);
scene.fog = new THREE.FogExp2(0x03050a, 0.00022);

const camera = new THREE.PerspectiveCamera(
  50,
  window.innerWidth / window.innerHeight,
  0.05,
  2500
);
camera.position.set(0, 45, 95);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.minDistance = 2;
controls.maxDistance = 900;
controls.target.set(0, 0, 0);
controls.maxPolarAngle = Math.PI * 0.95;

// Ambient + hemi for subtle fill (sun point light is primary)
scene.add(new THREE.AmbientLight(0x1a2238, 0.35));
const hemi = new THREE.HemisphereLight(0x9bb8ff, 0x080a12, 0.25);
scene.add(hemi);

// Starfield & system
const stars = createStarfield();
scene.add(stars);

const system = createSolarSystem(scene);

// Postprocessing bloom for sun & stars
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.55,
  0.6,
  0.85
);
composer.addPass(bloom);
composer.addPass(new OutputPass());

// ── Simulation state ──────────────────────────────────────────────
let simDays = 0;
let playing = true;
let daysPerSecond = sliderToDaysPerSecond(35);
let focusId = "sun";
let labelsVisible = true;

/** Smooth camera focus */
const focusState = {
  active: false,
  follow: true,
  offset: new THREE.Vector3(8, 4, 12),
  targetPos: new THREE.Vector3(),
};

// ── DOM refs ──────────────────────────────────────────────────────
const $ = (id) => document.getElementById(id);
const elEpoch = $("epoch-label");
const elSpeed = $("speed-label");
const elFocus = $("focus-label");
const elWarp = $("warp-readout");
const elSlider = $("time-slider");
const elBodyList = $("body-list");
const elInfoName = $("info-name");
const elInfoType = $("info-type");
const elInfoDist = $("info-distance");
const elInfoPeriod = $("info-period");
const elInfoEcc = $("info-ecc");
const elInfoIncl = $("info-incl");
const elInfoRadius = $("info-radius");
const elInfoDay = $("info-day");
const elInfoBlurb = $("info-blurb");
const btnPlay = $("btn-play");
const iconPlay = btnPlay.querySelector(".icon-play");
const iconPause = btnPlay.querySelector(".icon-pause");

// Labels overlay
const labelLayer = document.createElement("div");
labelLayer.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:5;";
document.getElementById("app").appendChild(labelLayer);

/** @type {Map<string, HTMLElement>} */
const labelEls = new Map();
const _proj = new THREE.Vector3();

function buildUI() {
  elBodyList.innerHTML = "";
  for (const def of system.bodies) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "body-item" + (def.id === focusId ? " active" : "");
    btn.dataset.id = def.id;
    btn.setAttribute("role", "option");
    btn.setAttribute("aria-selected", def.id === focusId ? "true" : "false");

    const sw = document.createElement("span");
    sw.className = "body-swatch";
    sw.style.background = def.color;
    sw.style.color = def.color;

    const name = document.createElement("span");
    name.className = "name";
    name.textContent = def.name;

    const dist = document.createElement("span");
    dist.className = "dist";
    dist.textContent = def.a ? `${def.a.toFixed(2)} AU` : "center";

    btn.append(sw, name, dist);
    btn.addEventListener("click", () => focusBody(def.id));
    elBodyList.appendChild(btn);

    // World label
    const lab = document.createElement("div");
    lab.className = "world-label visible";
    lab.innerHTML = `<span class="dot" style="background:${def.color};color:${def.color}"></span>${def.name}`;
    labelLayer.appendChild(lab);
    labelEls.set(def.id, lab);
  }

  $("body-count").textContent = String(system.bodies.length);
  updateInfo(focusId);
  syncPlayUI();
  syncWarpLabels();
}

function updateInfo(id) {
  const def = system.bodies.find((b) => b.id === id);
  if (!def) return;
  elInfoName.textContent = def.name;
  elInfoType.textContent = def.type;
  elInfoDist.textContent = def.a ? formatDistanceAU(def.a) : "—";
  elInfoPeriod.textContent = formatPeriod(def.period);
  elInfoEcc.textContent = def.a ? def.e.toFixed(4) : "—";
  elInfoIncl.textContent = def.a ? `${def.i.toFixed(2)}°` : "—";
  elInfoRadius.textContent = formatRadiusEarth(def.radius);
  elInfoDay.textContent = formatDay(def.day);
  elInfoBlurb.textContent = def.blurb;
  elFocus.textContent = def.name;

  elBodyList.querySelectorAll(".body-item").forEach((el) => {
    const active = el.dataset.id === id;
    el.classList.toggle("active", active);
    el.setAttribute("aria-selected", active ? "true" : "false");
  });
}

function focusBody(id, frame = true) {
  focusId = id;
  focusState.follow = true;
  updateInfo(id);

  const rt = system.byId.get(id);
  if (!rt) return;

  const pos = rt.pivot.position.clone();
  const r = id === "sun" ? 12 : Math.max(rt.mesh.scale?.x || 1, 1);
  // Estimate visual size from children
  let size = id === "sun" ? 8 : 2;
  rt.mesh.traverse((o) => {
    if (o.geometry?.boundingSphere) {
      o.geometry.computeBoundingSphere();
      size = Math.max(size, o.geometry.boundingSphere.radius * 2.5);
    }
  });

  if (frame) {
    focusState.offset.set(size * 3.2, size * 1.4, size * 3.5);
    if (id === "sun") focusState.offset.set(20, 12, 35);
    if (id === "neptune" || id === "uranus") {
      focusState.offset.set(size * 4, size * 2, size * 5);
    }
  }

  const camTarget = pos.clone();
  const camPos = pos.clone().add(focusState.offset);

  // Smooth animate via short lerp flags
  focusState.active = true;
  focusState._fromCam = camera.position.clone();
  focusState._fromTarget = controls.target.clone();
  focusState._toCam = camPos;
  focusState._toTarget = camTarget;
  focusState._t = 0;
}

function frameSystem() {
  focusId = "sun";
  focusState.follow = false;
  focusState.active = true;
  focusState._fromCam = camera.position.clone();
  focusState._fromTarget = controls.target.clone();
  focusState._toCam = new THREE.Vector3(0, 80, 160);
  focusState._toTarget = new THREE.Vector3(0, 0, 0);
  focusState._t = 0;
  updateInfo("sun");
}

function freeCam() {
  focusState.follow = false;
  focusState.active = false;
}

function syncPlayUI() {
  iconPlay.hidden = playing;
  iconPause.hidden = !playing;
  btnPlay.setAttribute("aria-label", playing ? "Pause" : "Play");
}

function syncWarpLabels() {
  const label = formatWarp(playing ? daysPerSecond : 0);
  elWarp.textContent = label;
  elSpeed.textContent = label;
}

// ── Events ────────────────────────────────────────────────────────
elSlider.addEventListener("input", () => {
  daysPerSecond = sliderToDaysPerSecond(Number(elSlider.value));
  syncWarpLabels();
});

btnPlay.addEventListener("click", () => {
  playing = !playing;
  syncPlayUI();
  syncWarpLabels();
});

$("btn-reset").addEventListener("click", () => {
  simDays = 0;
  system.setTrailsVisible($("tog-trails").checked);
});

$("tog-orbits").addEventListener("change", (e) => {
  system.setOrbitsVisible(e.target.checked);
});
$("tog-labels").addEventListener("change", (e) => {
  labelsVisible = e.target.checked;
  labelEls.forEach((el) => el.classList.toggle("visible", labelsVisible));
});
$("tog-trails").addEventListener("change", (e) => {
  system.setTrailsVisible(e.target.checked);
});
$("tog-helpers").addEventListener("change", (e) => {
  system.setEclipticVisible(e.target.checked);
});
$("btn-free").addEventListener("click", freeCam);
$("btn-system").addEventListener("click", frameSystem);

window.addEventListener("keydown", (e) => {
  if (e.target.matches("input, textarea")) return;
  if (e.code === "Space") {
    e.preventDefault();
    playing = !playing;
    syncPlayUI();
    syncWarpLabels();
  }
  if (e.key === "r" || e.key === "R") {
    simDays = 0;
  }
  if (e.key >= "1" && e.key <= "9") {
    const idx = Number(e.key) - 1;
    const def = system.bodies[idx];
    if (def) focusBody(def.id);
  }
  if (e.key === "0") frameSystem();
});

window.addEventListener("resize", () => {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  composer.setSize(w, h);
  bloom.setSize(w, h);
});

// User orbiting cancels follow slightly
controls.addEventListener("start", () => {
  // keep follow but stop cinematic
  focusState.active = false;
});

// ── Loop ──────────────────────────────────────────────────────────
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.1);

  const advancing = playing && daysPerSecond > 0;
  if (advancing) {
    simDays += daysPerSecond * dt;
  }

  // Positions always follow epoch; spin / stars / trails only while advancing
  system.update(simDays, { animate: advancing });

  if (advancing) {
    stars.rotation.y += dt * 0.0015;
  }

  // Camera cinematic + follow
  if (focusState.active) {
    focusState._t = Math.min(1, focusState._t + dt * 1.4);
    const k = easeOutCubic(focusState._t);
    camera.position.lerpVectors(focusState._fromCam, focusState._toCam, k);
    controls.target.lerpVectors(focusState._fromTarget, focusState._toTarget, k);
    if (focusState._t >= 1) focusState.active = false;
  } else if (focusState.follow && focusId) {
    const rt = system.byId.get(focusId);
    if (rt) {
      // Track body as orbit target; leave camera free for OrbitControls
      focusState.targetPos.copy(rt.pivot.position);
      const prev = controls.target.clone();
      controls.target.lerp(focusState.targetPos, 1 - Math.exp(-4 * dt));
      const delta = controls.target.clone().sub(prev);
      camera.position.add(delta);
    }
  }

  controls.update();

  // Labels
  updateLabels();

  // HUD telemetry
  elEpoch.textContent = formatEpoch(simDays);

  composer.render();
}

function updateLabels() {
  for (const [id, el] of labelEls) {
    const rt = system.byId.get(id);
    if (!rt) continue;
    _proj.copy(rt.pivot.position);
    _proj.project(camera);
    const behind = _proj.z > 1;
    const x = (_proj.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-_proj.y * 0.5 + 0.5) * window.innerHeight;
    const onScreen =
      labelsVisible &&
      !behind &&
      x > -40 &&
      x < window.innerWidth + 40 &&
      y > -40 &&
      y < window.innerHeight + 40;
    el.classList.toggle("visible", onScreen);
    if (onScreen) {
      el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -120%)`;
    }
  }
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

// Boot
buildUI();
system.update(0);
frameSystem();
// Soft start not locked to sun follow after frame
setTimeout(() => {
  focusState.follow = false;
}, 900);
animate();
