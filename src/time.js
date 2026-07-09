/**
 * Logarithmic time-warp mapping for the control slider.
 * Slider 0..100 → days per second (0 at low end = paused feel, but play still gates).
 */

/** Map slider value 0–100 to days/second */
export function sliderToDaysPerSecond(value) {
  const t = Math.max(0, Math.min(100, value)) / 100;
  if (t <= 0.02) return 0;

  // Curve: ~1 hour/s → 1 day/s → 1 year/s → 100 years/s
  // Use piecewise log from 1/24 day/s to 36500 day/s
  const min = 1 / 24; // 1 hour per second
  const max = 365.25 * 100; // 100 years per second
  const logMin = Math.log(min);
  const logMax = Math.log(max);
  const u = (t - 0.02) / 0.98;
  return Math.exp(logMin + u * (logMax - logMin));
}

/** Inverse: days/s → slider 0–100 */
export function daysPerSecondToSlider(daysPerSec) {
  if (daysPerSec <= 0) return 0;
  const min = 1 / 24;
  const max = 365.25 * 100;
  const u = (Math.log(daysPerSec) - Math.log(min)) / (Math.log(max) - Math.log(min));
  return Math.max(0, Math.min(100, 2 + u * 98));
}

export function formatWarp(daysPerSec) {
  if (daysPerSec <= 0) return "Paused";
  if (daysPerSec < 1 / 12) {
    const hours = daysPerSec * 24;
    return `${fmt(hours)} h / s`;
  }
  if (daysPerSec < 1) {
    return `${fmt(daysPerSec * 24)} h / s`;
  }
  if (daysPerSec < 30) {
    return `${fmt(daysPerSec)} day / s`;
  }
  if (daysPerSec < 365.25) {
    return `${fmt(daysPerSec / 30.44)} mo / s`;
  }
  const years = daysPerSec / 365.25;
  if (years < 10) return `${fmt(years)} yr / s`;
  return `${fmt(years)} yr / s`;
}

export function formatEpoch(days) {
  const sign = days >= 0 ? "+" : "−";
  const d = Math.abs(days);
  if (d < 365.25) {
    return `J2000 ${sign} ${fmt(d, 1)}d`;
  }
  const years = d / 365.25;
  if (years < 100) {
    return `J2000 ${sign} ${fmt(years, 2)}y`;
  }
  return `J2000 ${sign} ${fmt(years, 1)}y`;
}

function fmt(n, digits = 2) {
  if (n >= 100) return n.toFixed(0);
  if (n >= 10) return n.toFixed(1);
  return n.toFixed(digits);
}

export function formatPeriod(days) {
  if (!days || days <= 0) return "—";
  if (days < 400) return `${days.toFixed(1)} d`;
  return `${(days / 365.25).toFixed(2)} yr`;
}

export function formatDistanceAU(a) {
  if (!a) return "—";
  if (a < 0.01) return `${(a * 149597870.7).toFixed(0)} km`;
  return `${a.toFixed(3)} AU`;
}

export function formatRadiusEarth(r) {
  if (r > 50) return `${r.toFixed(0)} R⊕`;
  return `${r.toFixed(2)} R⊕`;
}

export function formatDay(d) {
  if (d === 0) return "—";
  const abs = Math.abs(d);
  const ret = d < 0 ? " (ret.)" : "";
  if (abs < 2) return `${(abs * 24).toFixed(1)} h${ret}`;
  return `${abs.toFixed(2)} d${ret}`;
}
