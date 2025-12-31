const SOLAR_API = "https://api.le-systeme-solaire.net/rest/bodies";
const WIKI_BASE = "https://de.wikipedia.org/wiki/";
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

const SHORT_TEXT = {
  soleil:  "Die Sonne ist der Stern im Zentrum unseres Sonnensystems.",
  mercury: "Merkur ist der innerste Planet.",
  venus:   "Die Venus ist ein sehr heißer Planet mit dichter Atmosphäre.",
  earth:   "Die Erde ist der einzige bekannte Planet mit Leben.",
  mars:    "Der Mars ist das Ziel vieler Missionen.",
  jupiter: "Jupiter ist der größte Planet.",
  saturn:  "Saturn hat ein auffälliges Ringsystem.",
  uranus:  "Uranus rotiert stark gekippt.",
  neptune: "Neptun ist der äußerste Planet."
};

const FALLBACK = [
  { id:"soleil", englishName:"Soleil", meanRadius:696340, bodyType:"Star", gravity:274, density:1.41, axialTilt:7.25, sideralRotation:609.12, sideralOrbit:null, semimajorAxis:null, avgTemp:5778, moons:[] },
  { id:"mercury", englishName:"Mercury", meanRadius:2439.7, bodyType:"Planet", gravity:3.7, density:5.43, axialTilt:0.03, sideralRotation:1407.6, sideralOrbit:87.97, semimajorAxis:57909227, avgTemp:440, moons:[] },
  { id:"venus", englishName:"Venus", meanRadius:6051.8, bodyType:"Planet", gravity:8.87, density:5.24, axialTilt:177.36, sideralRotation:-5832.5, sideralOrbit:224.70, semimajorAxis:108209475, avgTemp:737, moons:[] },
  { id:"earth", englishName:"Earth", meanRadius:6371.0, bodyType:"Planet", gravity:9.81, density:5.51, axialTilt:23.44, sideralRotation:23.93, sideralOrbit:365.25, semimajorAxis:149598262, avgTemp:288, moons:[{moon:"Moon"}] },
  { id:"mars", englishName:"Mars", meanRadius:3389.5, bodyType:"Planet", gravity:3.71, density:3.93, axialTilt:25.19, sideralRotation:24.62, sideralOrbit:686.98, semimajorAxis:227943824, avgTemp:210, moons:[{moon:"Phobos"},{moon:"Deimos"}] },
  { id:"jupiter", englishName:"Jupiter", meanRadius:69911, bodyType:"Planet", gravity:24.79, density:1.33, axialTilt:3.13, sideralRotation:9.93, sideralOrbit:4332.59, semimajorAxis:778340821, avgTemp:165, moons:[] },
  { id:"saturn", englishName:"Saturn", meanRadius:58232, bodyType:"Planet", gravity:10.44, density:0.69, axialTilt:26.73, sideralRotation:10.66, sideralOrbit:10759.22, semimajorAxis:1426666422, avgTemp:134, moons:[] },
  { id:"uranus", englishName:"Uranus", meanRadius:25362, bodyType:"Planet", gravity:8.69, density:1.27, axialTilt:97.77, sideralRotation:-17.24, sideralOrbit:30688.5, semimajorAxis:2870658186, avgTemp:76, moons:[] },
  { id:"neptune", englishName:"Neptune", meanRadius:24622, bodyType:"Planet", gravity:11.15, density:1.64, axialTilt:28.32, sideralRotation:16.11, sideralOrbit:60182, semimajorAxis:4498396441, avgTemp:72, moons:[] }
];

document.addEventListener("DOMContentLoaded", () => init());

function nameOf(b) {
  return NAMES[b.id] || b.englishName || b.id;
}

function getBodyId() {
  const url = new URL(location.href);
  const raw = (url.searchParams.get("body") || "").toLowerCase();
  if (IDS.includes(raw)) return raw;
  return "earth";
}

async function init() {
  const id = getBodyId();
  const list = await loadList();
  renderMini(list, id);

  let body = list.find(x => x.id === id) || FALLBACK.find(x => x.id === id);
  try{ body = await fetchBody(id); }catch(e){}
  renderDetails(body);
}

async function loadList() {
  try{
    const planets = await fetchPlanets();
    let sun;
    try{ sun = await fetchBody("soleil"); }catch(e){ sun = FALLBACK[0]; }
    return [sun, ...planets].filter(Boolean);
  }catch(e){
    return FALLBACK.slice();
  }
}

async function fetchPlanets() {
  const url = `${SOLAR_API}/?filter[]=isPlanet,eq,true&data=id,englishName,meanRadius,semimajorAxis,bodyType&order=semimajorAxis,asc`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("list");
  const data = await res.json();
  const map = new Map((data.bodies || []).map(b => [b.id, b]));
  return IDS.slice(1).map(id => map.get(id)).filter(Boolean);
}

async function fetchBody(id) {
  const res = await fetch(`${SOLAR_API}/${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error("body");
  return await res.json();
}

function renderMini(bodies, activeId) {
  const mini = document.getElementById("miniStrip");
  mini.innerHTML = "";

  const radii = bodies.map(b => b.meanRadius).filter(Boolean);
  const logs = radii.map(r => Math.log10(r));
  const minLog = Math.min(...logs);
  const maxLog = Math.max(...logs);

  bodies.forEach(b => {
    const btn = document.createElement("button");
    btn.className = "planet-btn";
    btn.type = "button";
    btn.dataset.id = b.id;
    btn.setAttribute("aria-label", nameOf(b));

    const dot = document.createElement("div");
    dot.className = "planet-dot";

    const logR = b.meanRadius ? Math.log10(b.meanRadius) : minLog;
    const size = mapRange(logR, minLog, maxLog, 18, 64);
    dot.style.setProperty("--size", `${Math.round(size)}px`);

    if (b.id === "saturn") dot.classList.add("ring-img");
    dot.style.backgroundImage = `url("${IMG[b.id]}")`;

    const label = document.createElement("div");
    label.className = "planet-label";
    label.textContent = nameOf(b);

    btn.appendChild(dot);
    btn.appendChild(label);

    if (b.id === activeId) btn.disabled = true;

    btn.addEventListener("click", () => {
      location.href = `planeten.html?body=${encodeURIComponent(b.id)}`;
    });

    mini.appendChild(btn);
  });
}

function renderDetails(b) {
  const title = nameOf(b);
  document.title = `Space Explorer – ${title}`;
  document.getElementById("planetTitle").textContent = title;

  const visual = document.getElementById("selectedPlanetVisual");
  visual.className = "selected-planet-visual giant";
  if (b.id === "saturn") visual.classList.add("ring-img");
  visual.style.backgroundImage = `url("${IMG[b.id]}")`;

  document.getElementById("shortText").textContent = SHORT_TEXT[b.id] || "";

  const wiki = document.getElementById("btnOpenWiki");
  wiki.href = `${WIKI_BASE}${encodeURIComponent(title.replaceAll(" ", "_"))}`;

  const factsGrid = document.getElementById("factsGrid");
  factsGrid.innerHTML = "";

  const facts = [
    ["Radius", b.meanRadius != null ? fmtUnit(b.meanRadius, "km") : "—"],
    ["Durchmesser", b.meanRadius != null ? fmtUnit(b.meanRadius * 2, "km") : "—"],
    ["Gravitation", b.gravity != null ? fmtUnit(b.gravity, "m/s²", 2) : "—"],
    ["Dichte", b.density != null ? fmtUnit(b.density, "g/cm³", 2) : "—"],
    ["Achsneigung", b.axialTilt != null ? fmtUnit(b.axialTilt, "°", 2) : "—"],
    ["Rotation", b.sideralRotation != null ? fmtUnit(b.sideralRotation, "h", 2) : "—"],
    ["Umlaufzeit", b.sideralOrbit != null ? fmtUnit(b.sideralOrbit, "Tage", 1) : "—"],
    ["Distanz", b.semimajorAxis != null ? fmtUnit(b.semimajorAxis, "km") : "—"],
    ["Temperatur", b.avgTemp != null ? fmtUnit(b.avgTemp, "K") : "—"],
    ["Monde", Array.isArray(b.moons) ? fmtNumber(b.moons.length) : "0"]
  ];

  facts.forEach(([k, v]) => {
    const col = document.createElement("div");
    col.className = "col-sm-6 col-xl-4";
    const box = document.createElement("div");
    box.className = "fact";
    const kk = document.createElement("div");
    kk.className = "k";
    kk.textContent = k;
    const vv = document.createElement("div");
    vv.className = "v";
    vv.textContent = v;
    box.appendChild(kk);
    box.appendChild(vv);
    col.appendChild(box);
    factsGrid.appendChild(col);
  });
}