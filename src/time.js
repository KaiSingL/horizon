/**
 * Logarithmic time-warp mapping for the control slider.
 * Slider 0..SLIDER_MAX → days per second (always > 0; pause is the play button only).
 */

/** Integer slider range — higher = finer control on a log curve */
export const SLIDER_MAX = 1000;

const MIN_DAYS_PER_SEC = 1 / 24; // 1 hour of sim per real second
const MAX_DAYS_PER_SEC = 365.25 * 100; // 100 years per second

/** Map slider value 0–SLIDER_MAX to days/second (never zero). */
export function sliderToDaysPerSecond(value) {
  const t = Math.max(0, Math.min(SLIDER_MAX, Number(value))) / SLIDER_MAX;
  const logMin = Math.log(MIN_DAYS_PER_SEC);
  const logMax = Math.log(MAX_DAYS_PER_SEC);
  return Math.exp(logMin + t * (logMax - logMin));
}

/** Inverse: days/s → slider 0–SLIDER_MAX */
export function daysPerSecondToSlider(daysPerSec) {
  const d = Math.max(MIN_DAYS_PER_SEC, Math.min(MAX_DAYS_PER_SEC, daysPerSec));
  const u =
    (Math.log(d) - Math.log(MIN_DAYS_PER_SEC)) /
    (Math.log(MAX_DAYS_PER_SEC) - Math.log(MIN_DAYS_PER_SEC));
  return Math.round(u * SLIDER_MAX);
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
