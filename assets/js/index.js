const SOLAR_API = "https://api.le-systeme-solaire.net/rest/bodies";
const IDS = ["soleil","mercury","venus","earth","mars","jupiter","saturn","uranus","neptune"];

const NAMES = {
  soleil: "Sonne",
  mercury: "Merkur",
  venus: "Venus",
  earth: "Erde",
  mars: "Mars",
  jupiter: "Jupiter",
  saturn: "Saturn",
  uranus: "Uranus",
  neptune: "Neptun"
};

const TEXTURES = {
  mercury: "radial-gradient(circle at 30% 30%, #c8c8c8, #5f6166 70%, #2f3136 100%)",
  venus:   "radial-gradient(circle at 30% 30%, #ffe2a8, #d7a255 65%, #6e4a2a 100%)",
  earth:   "radial-gradient(circle at 30% 30%, #c8f0ff, #2b7cff 55%, #10234a 100%)",
  mars:    "radial-gradient(circle at 30% 30%, #ffcab3, #d25a3a 60%, #5f1f17 100%)",
  jupiter: "repeating-linear-gradient(180deg, #e7d3b6 0 12px, #c59b77 12px 24px, #d9c4a3 24px 36px)",
  saturn:  "repeating-linear-gradient(180deg, #f0e0b8 0 12px, #d6bf85 12px 24px, #e8d6a7 24px 36px)",
  uranus:  "radial-gradient(circle at 30% 30%, #d9fbff, #74d7ff 60%, #1b4c63 100%)",
  neptune: "radial-gradient(circle at 30% 30%, #cfe2ff, #2e65ff 60%, #0e1a4a 100%)"
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
  document.getElementById("sunBtn").addEventListener("click", () => {
    location.href = "planet.html?body=soleil";
  });
  init();
});

async function init() {
  let bodies;
  try{
    bodies = await fetchSizes();
  }catch(e){
    bodies = FALLBACK.slice();
  }
  renderSystem(bodies);
}

async function fetchSizes() {
  const url = `${SOLAR_API}/?filter[]=isPlanet,eq,true&data=id,meanRadius,semimajorAxis&order=semimajorAxis,asc`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("list");
  const data = await res.json();
  const map = new Map((data.bodies || []).map(b => [b.id, b]));
  const planets = IDS.slice(1).map(id => map.get(id)).filter(Boolean);
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

  planets.forEach((p, i) => {
    const idx = i + 1;
    const rx = 170 + idx * 80;
    const ry = 62 + idx * 24;
    const angle = -0.60 + idx * 0.045;

    const x = cx + rx * Math.cos(angle);
    const y = cy + ry * Math.sin(angle);

    const btn = document.createElement("button");
    btn.className = "planet-btn";
    btn.type = "button";
    btn.setAttribute("role", "listitem");
    btn.dataset.id = p.id;
    btn.setAttribute("aria-label", NAMES[p.id] || p.id);

    const dot = document.createElement("div");
    dot.className = "planet-dot";
    if (p.id === "saturn") dot.classList.add("ring");

    const logR = p.meanRadius ? Math.log10(p.meanRadius) : minLog;
    const size = mapRange(logR, minLog, maxLog, 44, 120);
    dot.style.setProperty("--size", `${Math.round(size)}px`);
    dot.style.setProperty("--tex", TEXTURES[p.id] || TEXTURES.mercury);

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
      location.href = `planet.html?body=${encodeURIComponent(p.id)}`;
    });

    container.appendChild(btn);
  });
}