const SOLAR_API = "https://api.le-systeme-solaire.net/rest/bodies";
const IDS = ["mercury","venus","earth","mars","jupiter","saturn","uranus","neptune"];

const NAMES = {
  mercury: "Merkur",
  venus: "Venus",
  earth: "Erde",
  mars: "Mars",
  jupiter: "Jupiter",
  saturn: "Saturn",
  uranus: "Uranus",
  neptune: "Neptun"
};

const IMG = {
  soleil: "assets/img/sun.png",
  mercury: "assets/img/mercury.png",
  venus: "assets/img/venus.png",
  earth: "assets/img/earth.png",
  mars: "assets/img/mars.png",
  jupiter: "assets/img/jupiter.png",
  saturn: "assets/img/saturn.png",
  uranus: "assets/img/uranus.png",
  neptune: "assets/img/neptune.png"
};

const FALLBACK = [
  { id:"mercury", meanRadius:2439.7 },
  { id:"venus", meanRadius:6051.8 },
  { id:"earth", meanRadius:6371.0 },
  { id:"mars", meanRadius:3389.5 },
  { id:"jupiter", meanRadius:69911 },
  { id:"saturn", meanRadius:58232 },
  { id:"uranus", meanRadius:25362 },
  { id:"neptune", meanRadius:24622 }
];

document.addEventListener("DOMContentLoaded", () => {
  const sunBtn = document.getElementById("sunBtn");
  sunBtn.addEventListener("click", () => {
    location.href = "planeten.html?body=soleil";
  });
  const sunDisc = document.getElementById("sunDisc");
  sunDisc.style.backgroundImage = `url("${IMG.soleil}")`;
  init();
});

async function init() {
  let bodies;
  try{ bodies = await fetchSizes(); }
  catch(e){ bodies = FALLBACK.slice(); }
  renderSystem(bodies);
}

async function fetchSizes() {
  const url = `${SOLAR_API}/?filter[]=isPlanet,eq,true&data=id,meanRadius,semimajorAxis&order=semimajorAxis,asc`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("list");
  const data = await res.json();
  const map = new Map((data.bodies || []).map(b => [b.id, b]));
  const planets = IDS.map(id => map.get(id)).filter(Boolean);
  if (planets.length !== 8) throw new Error("planets");
  return planets.map(p => ({ id: p.id, meanRadius: p.meanRadius }));
}

function renderSystem(planets) {
  const container = document.getElementById("systemPlanets");
  container.innerHTML = "";

  const radii = planets.map(p => p.meanRadius).filter(Boolean);
  const logs = radii.map(r => Math.log10(r));
  const minLog = Math.min(...logs);
  const maxLog = Math.max(...logs);

  const cx = 250;
  const cy = 260;
  const placed = [];

  planets.forEach((p, i) => {
    const idx = i;
    const rx = 170 + idx * 80;
    const ry = 62 + idx * 24;

    const logR = p.meanRadius ? Math.log10(p.meanRadius) : minLog;
    const size = mapRange(logR, minLog, maxLog, 44, 120);
    const sizeAdj = (p.id === "saturn") ? (size * 0.85) : size;

    const baseAngle = -0.05;
    const step = 0.11;


    let angle = baseAngle;
    let x = cx + rx * Math.cos(angle);
    let y = cy + ry * Math.sin(angle);

    const rSelf = (p.id === "saturn") ? (sizeAdj * 0.60) : (sizeAdj / 2);
    const gap = 14;

    for (let attempt = 0; attempt < 80; attempt++) {
      const k = Math.floor((attempt + 1) / 2);
      const dir = attempt % 2 === 0 ? 1 : -1;
      angle = baseAngle + dir * k * step;

      x = cx + rx * Math.cos(angle);
      y = cy + ry * Math.sin(angle);

      let ok = true;
      for (const other of placed) {
        const dx = x - other.x;
        const dy = y - other.y;
        const d = Math.hypot(dx, dy);
        if (d < (rSelf + other.r + gap)) { ok = false; break; }
      }
      if (ok) break;
    }

    placed.push({ x, y, r: rSelf });

    const btn = document.createElement("button");
    btn.className = "planet-btn orbit";
    btn.type = "button";
    btn.setAttribute("role", "listitem");
    btn.dataset.id = p.id;
    btn.setAttribute("aria-label", NAMES[p.id] || p.id);

    const dot = document.createElement("div");
    dot.className = "planet-dot";
    dot.style.setProperty("--size", `${Math.round(sizeAdj)}px`);

    if (p.id === "saturn") dot.classList.add("ring-img");
    dot.style.backgroundImage = `url("${IMG[p.id]}")`;

    const label = document.createElement("div");
    label.className = "planet-label";
    label.textContent = NAMES[p.id] || p.id;

    btn.appendChild(dot);
    btn.appendChild(label);

    btn.style.left = `${(x / 1200) * 100}%`;
    btn.style.top = `${(y / 520) * 100}%`;
    btn.style.transform = "translate(-50%, -50%)";
    btn.style.zIndex = String(10 + idx);

    btn.addEventListener("click", () => {
      location.href = `planeten.html?body=${encodeURIComponent(p.id)}`;
    });

    container.appendChild(btn);
  });
}

function mapRange(v, inMin, inMax, outMin, outMax){
  if (inMax === inMin) return (outMin + outMax) / 2;
  const t = (v - inMin) / (inMax - inMin);
  return outMin + t * (outMax - outMin);
}
