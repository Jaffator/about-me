(() => {
  const root = document.documentElement;
  const body = document.body;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.getElementById("y").textContent = new Date().getFullYear();

  /* ── světlo pod kurzorem nad fotkou (jen desktop s myší) ── */
  const photo = document.querySelector(".photo");
  if (matchMedia("(hover: hover) and (pointer: fine)").matches && !reduce) {
    let tx = 0, ty = 0, x = null, y = null, raf = null;
    const tick = () => {
      x += (tx - x) * 0.12; y += (ty - y) * 0.12;
      root.style.setProperty("--mx", x + "px");
      root.style.setProperty("--my", y + "px");
      raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.5 ? requestAnimationFrame(tick) : null;
    };
    addEventListener("pointermove", (e) => {
      const r = photo.getBoundingClientRect();
      tx = e.clientX - r.left; ty = e.clientY - r.top;
      if (x === null) { x = tx; y = ty; }
      if (!raf) raf = requestAnimationFrame(tick);
    }, { passive: true });
    document.addEventListener("pointerleave", () => {
      x = y = null; root.style.setProperty("--mx", "-999px"); root.style.setProperty("--my", "-999px");
    });
  }

  /* ── po odscrollování fotku ztlumit ── */
  const onScroll = () => body.classList.toggle("is-scrolled", scrollY > innerHeight * 0.5);
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ── aktivní položka v navigaci ── */
  const links = [...document.querySelectorAll(".bar__nav a")];
  const byId = new Map(links.map((a) => [a.getAttribute("href").slice(1), a]));
  const navIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      links.forEach((a) => a.classList.remove("is-active"));
      byId.get(e.target.id)?.classList.add("is-active");
    });
  }, { rootMargin: "-40% 0px -55% 0px" });
  document.querySelectorAll("main section[id]").forEach((s) => navIO.observe(s));

  /* ── agentní síť na pozadí ── */
  const svg = document.getElementById("agents");
  const NS = "http://www.w3.org/2000/svg";
  const N = {
    input:   { x: 110, y: 150, label: "input" },
    orch:    { x: 290, y: 330, label: "orchestrator" },
    planner: { x: 120, y: 470, label: "planner" },
    memory:  { x: 90,  y: 640, label: "memory" },
    rag:     { x: 470, y: 190, label: "rag" },
    db:      { x: 500, y: 450, label: "db" },
    api:     { x: 400, y: 620, label: "api" },
    queue:   { x: 250, y: 720, label: "queue" },
    verify:  { x: 500, y: 780, label: "verify" },
    output:  { x: 340, y: 860, label: "output" },
  };
  const EDGES = [
    ["input", "orch"], ["orch", "planner"], ["planner", "memory"], ["orch", "rag"],
    ["orch", "db"], ["orch", "api"], ["api", "queue"], ["orch", "verify"],
    ["verify", "output"], ["planner", "queue"],
  ];
  const el = (tag, attrs, parent = svg) => {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    parent.append(e);
    return e;
  };
  const key = (a, b) => [a, b].sort().join("|");
  const edgeEl = {};
  EDGES.forEach(([a, b]) => {
    edgeEl[key(a, b)] = el("line", { class: "e", x1: N[a].x, y1: N[a].y, x2: N[b].x, y2: N[b].y });
  });
  const nodeEl = {};
  for (const id in N) {
    const g = el("g", {});
    const { x, y } = N[id];
    el("circle", { class: "ring", cx: x, cy: y, r: id === "orch" ? 6 : 4 }, g);
    el("circle", { class: "n", cx: x, cy: y, r: id === "orch" ? 6 : 4 }, g);
    el("text", { class: "t", x, y: y + 22 }, g).textContent = N[id].label;
    nodeEl[id] = g;
  }
  const trail = el("line", { class: "trail", x1: -9, y1: -9, x2: -9, y2: -9 });
  const pulse = el("circle", { class: "pulse", cx: -9, cy: -9, r: 2.2 });

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const flash = (id) => {
    const g = nodeEl[id];
    g.classList.remove("on"); void g.getBBox(); g.classList.add("on");
    setTimeout(() => g.classList.remove("on"), 900);
  };
  const ease = (t) => (t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

  const hop = (a, b) => new Promise((done) => {
    const e = edgeEl[key(a, b)];
    e.classList.add("on");
    const A = N[a], B = N[b];
    const len = Math.hypot(B.x - A.x, B.y - A.y);
    const dur = 500 + len * 2.2;
    const t0 = performance.now();
    const frame = (now) => {
      const t = Math.min(1, (now - t0) / dur), k = ease(t);
      const x = A.x + (B.x - A.x) * k, y = A.y + (B.y - A.y) * k;
      const kt = ease(Math.max(0, t - .12));
      pulse.setAttribute("cx", x); pulse.setAttribute("cy", y);
      trail.setAttribute("x1", A.x + (B.x - A.x) * kt); trail.setAttribute("y1", A.y + (B.y - A.y) * kt);
      trail.setAttribute("x2", x); trail.setAttribute("y2", y);
      if (t < 1) requestAnimationFrame(frame);
      else { setTimeout(() => e.classList.remove("on"), 150); flash(b); done(); }
    };
    requestAnimationFrame(frame);
  });
  const path = async (...ids) => { for (let i = 0; i < ids.length - 1; i++) { await hop(ids[i], ids[i + 1]); await sleep(260); } };
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  // jeden běh: vstup → orchestrátor rozhodne → 2–3 volání nástrojů → ověření → výstup
  const TOOLS = [
    ["orch", "rag", "orch"],
    ["orch", "db", "orch"],
    ["orch", "api", "orch"],
    ["orch", "api", "queue", "api", "orch"],
    ["orch", "planner", "orch"],
    ["orch", "planner", "memory", "planner", "orch"],
  ];
  async function agentLoop() {
    for (;;) {
      flash("input");
      await sleep(400);
      await path("input", "orch");
      await sleep(500);                                   // rozhoduje se
      const steps = 2 + Math.floor(Math.random() * 2);
      for (let i = 0; i < steps; i++) { await path(...pick(TOOLS)); await sleep(350); }
      await path("orch", "verify");
      if (Math.random() < .3) {                           // ověření neprošlo → ještě jedno kolo
        await path("verify", "orch");
        await path(...pick(TOOLS));
        await path("orch", "verify");
      }
      await path("verify", "output");
      pulse.setAttribute("cx", -9); trail.setAttribute("x1", -9); trail.setAttribute("x2", -9);
      await sleep(1800 + Math.random() * 1600);
    }
  }
  if (!reduce) agentLoop();

  /* ── reveal při scrollu ── */
  if (!reduce) {
    const els = document.querySelectorAll(".sec__h, .prose p, .item, .proj, .mail, .sec__body > .big");
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -6% 0px" });
    els.forEach((el) => { el.classList.add("rv"); io.observe(el); });
  }
})();
