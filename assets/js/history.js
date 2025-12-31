const NASA_APOD = "https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY";
const NASA_IMG_SEARCH = "https://images-api.nasa.gov/search";
const TIMELINE_JSON = "assets/data/timeline.json";

let timelineData = [];

document.addEventListener("DOMContentLoaded", async () => {
  const search = document.getElementById("timelineSearch");
  search.addEventListener("input", () => {
    const q = (search.value || "").trim().toLowerCase();
    if (!q) {
      renderTimeline(timelineData);
      setupAnimations();
      return;
    }
    const filtered = timelineData.filter(ev => (ev.title + " " + ev.text + " " + ev.keyword).toLowerCase().includes(q));
    renderTimeline(filtered);
    setupAnimations(true);
  });

  await loadAPOD();
  await loadTimeline();
  renderTimeline(timelineData);
  setupAnimations();
});

async function loadAPOD() {
  try {
    const res = await fetch(NASA_APOD);
    const data = await res.json();
    const img = document.getElementById("apodImg");
    const title = document.getElementById("apodTitle");
    const link = document.getElementById("apodLink");
    const imgUrl = (data.media_type === "image") ? data.url : (data.thumbnail_url || "");
    img.src = imgUrl;
    title.textContent = data.title || "—";
    link.href = data.hdurl || data.url || "https://apod.nasa.gov/";
  } catch (e) {
    document.getElementById("apodTitle").textContent = "—";
  }
}

async function loadTimeline() {
  const res = await fetch(TIMELINE_JSON);
  timelineData = await res.json();
}

function renderTimeline(events) {
  const container = document.getElementById("timeline");
  container.innerHTML = "";

  events.forEach((ev, idx) => {
    const side = (idx % 2 === 0) ? "left" : "right";
    const item = document.createElement("article");
    item.className = `tl-item ${side}`;

    const dot = document.createElement("div");
    dot.className = "tl-dot";

    const card = document.createElement("div");
    card.className = "tl-card";

    const img = document.createElement("img");
    img.className = "tl-img";
    img.alt = `${ev.title} – Bild`;
    img.loading = "lazy";

    const body = document.createElement("div");
    body.className = "p-3";

    const date = document.createElement("div");
    date.className = "small text-white-75";
    date.textContent = formatDate(ev.year);

    const h = document.createElement("h3");
    h.className = "h6 mb-1";
    h.textContent = ev.title;

    const p = document.createElement("p");
    p.className = "text-white-75 mb-0";
    p.textContent = ev.text;

    body.appendChild(date);
    body.appendChild(h);
    body.appendChild(p);

    card.appendChild(img);
    card.appendChild(body);

    item.appendChild(dot);
    item.appendChild(card);
    container.appendChild(item);

    attachNasaImage(img, ev.keyword);
  });
}

async function attachNasaImage(imgEl, keyword) {
  try {
    const q = encodeURIComponent(keyword);
    const url = `${NASA_IMG_SEARCH}?q=${q}&media_type=image&page=1`;
    const res = await fetch(url);
    const data = await res.json();
    const item = data?.collection?.items?.[0];
    const link = item?.links?.find(l => l.render === "image")?.href || item?.links?.[0]?.href;
    if (link) imgEl.src = link;
  } catch (e) {}
}

function setupAnimations(forceInView = false) {
  if (forceInView) {
    document.querySelectorAll(".tl-card").forEach(card => card.classList.add("in-view"));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (en.isIntersecting) en.target.classList.add("in-view");
    });
  }, { threshold: 0.15 });

  document.querySelectorAll(".tl-card").forEach(card => io.observe(card));
}

function formatDate(iso) {
  try {
    const d = new Date(iso);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString("de-DE", { year: "numeric", month: "long", day: "2-digit" });
    }
  } catch (e) {}
  return iso;
}