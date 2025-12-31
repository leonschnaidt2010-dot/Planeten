(function () {
  const path = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  document.querySelectorAll(".navbar .nav-link").forEach(a => {
    const href = (a.getAttribute("href") || "").toLowerCase();
    if (href === path) a.classList.add("active");
  });
})();

function fmtNumber(n, digits = 0) {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return "—";
  return Number(n).toLocaleString("de-DE", { maximumFractionDigits: digits });
}

function fmtUnit(n, unit, digits = 0) {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return "—";
  return `${fmtNumber(n, digits)} ${unit}`;
}

function mapRange(value, inMin, inMax, outMin, outMax) {
  const t = (value - inMin) / (inMax - inMin);
  const clamped = Math.min(1, Math.max(0, t));
  return outMin + (outMax - outMin) * clamped;
}