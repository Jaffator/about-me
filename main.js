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

  /* ── po odscrollování pozadí ztlumit ── */
  // po opuštění úvodu pozadí ztlumit (IntersectionObserver místo scroll listeneru)
  new IntersectionObserver(([e]) => body.classList.toggle("is-scrolled", !e.isIntersecting), { threshold: 0.5 })
    .observe(document.querySelector(".hero"));

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

  /* ── reveal při scrollu ── */
  if (!reduce) {
    const els = document.querySelectorAll(".sec__h, .prose p, .item, .proj, .mail, .sec__body > .big");
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -6% 0px" });
    els.forEach((el) => { el.classList.add("rv"); io.observe(el); });
  }

  /* ── mobilní menu ── */
  const bar = document.querySelector(".bar");
  const menuBtn = document.querySelector(".bar__menu");
  if (bar && menuBtn) {
    const setMenu = (open) => {
      bar.classList.toggle("is-open", open);
      menuBtn.setAttribute("aria-expanded", String(open));
      menuBtn.textContent = open ? (document.documentElement.lang === "en" ? "Close" : "Zavřít") : "Menu";
    };
    menuBtn.addEventListener("click", () => setMenu(!bar.classList.contains("is-open")));
    links.forEach((a) => a.addEventListener("click", () => setMenu(false)));
    addEventListener("langchange", () => setMenu(bar.classList.contains("is-open")));
    addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });
  }

  if (!document.getElementById("agents")) return;   // stránka bez agentního grafu

  /* ════════════════ AGENTNÍ SMYČKA NA POZADÍ ════════════════
     orchestrátor běží ve smyčce plan → act → observe → reflect,
     volá nástroje (i paralelně), spouští sub-agenty a ti můžou spustit další.
     Pod grafem běží hierarchický log stejného běhu. */
  const svg = document.getElementById("agents");
  const NS = "http://www.w3.org/2000/svg";
  const mk = (tag, attrs = {}, parent = svg) => {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    parent.append(e);
    return e;
  };
  const gEdges = mk("g"), gNodes = mk("g"), gFx = mk("g");

  const P = {};          // pozice uzlů
  const nodeEl = {};     // id → <g>
  const edgeEl = {};     // "a|b" → <line>

  function node(id, x, y, label, kind = "tool", spawned = false) {
    P[id] = { x, y };
    const r = kind === "orch" ? 7 : kind === "agent" ? 5 : kind === "client" ? 4 : 3.5;
    const g = mk("g", { class: `nd nd-${kind}${spawned ? " sp" : ""}` }, gNodes);
    if (kind === "agent") mk("circle", { class: "spin", cx: x, cy: y, r: r + 7 }, g);
    mk("circle", { class: "ring", cx: x, cy: y, r }, g);
    if (kind === "tool") mk("rect", { class: "n", x: x - r, y: y - r, width: r * 2, height: r * 2, rx: 1.5 }, g);
    else mk("circle", { class: "n", cx: x, cy: y, r }, g);
    mk("text", { class: "t", x, y: y + r + (kind === "agent" ? 20 : 15) }, g).textContent = label;
    nodeEl[id] = g;
    if (spawned) requestAnimationFrame(() => requestAnimationFrame(() => g.classList.add("in")));
    return g;
  }
  const key = (a, b) => [a, b].sort().join("|");
  function edge(a, b, dashed = false) {
    const k = key(a, b);
    if (!edgeEl[k]) {
      edgeEl[k] = mk("line", { class: "e" + (dashed ? " dash" : ""), x1: P[a].x, y1: P[a].y, x2: P[b].x, y2: P[b].y }, gEdges);
      if (dashed) requestAnimationFrame(() => requestAnimationFrame(() => edgeEl[k].classList.add("in")));
    }
    return edgeEl[k];
  }
  function despawn(ids) {
    ids.forEach((id) => {
      nodeEl[id]?.classList.remove("in");
      for (const k in edgeEl) if (k.split("|").includes(id)) edgeEl[k].classList.remove("in"), edgeEl[k].classList.add("out");
    });
    setTimeout(() => ids.forEach((id) => {
      nodeEl[id]?.remove(); delete nodeEl[id]; delete P[id];
      for (const k in edgeEl) if (k.split("|").includes(id)) { edgeEl[k].remove(); delete edgeEl[k]; }
    }), 900);
  }

  // statická kostra: klient, orchestrátor, sdílené nástroje
  // vodorovné rozložení: klient → orchestrátor → (sub-agenti vpravo), nástroje nahoře a dole
  const O = { x: 200, y: 150 };
  node("client", 40, 150, "client", "client");
  node("orch", O.x, O.y, "orchestrator", "orch");
  node("rag", 120, 40, "rag");
  node("db", 280, 40, "db");
  node("api", 120, 258, "api");
  node("queue", 280, 258, "queue");
  ["client", "rag", "db", "api", "queue"].forEach((id) => edge("orch", id));

  // fáze smyčky kolem orchestrátoru
  const PH = ["plan", "act", "observe", "reflect"];
  const loop = mk("g", { class: "loop" }, gNodes);
  mk("circle", { class: "loop-ring", cx: O.x, cy: O.y, r: 30 }, loop);
  PH.forEach((p, i) => {
    const a = (i * 90 - 90) * Math.PI / 180;
    const lx = O.x + Math.cos(a) * 46, ly = O.y + Math.sin(a) * 46 + 3;
    mk("text", { class: "ph", "data-ph": p, x: lx, y: ly, "text-anchor": i === 1 ? "start" : i === 3 ? "end" : "middle" }, loop).textContent = p;
  });
  const marker = mk("circle", { class: "marker", cx: O.x, cy: O.y - 30, r: 2.4 }, loop);
  let phaseTurns = 0;
  function phase(p) {
    const i = PH.indexOf(p);
    const cur = phaseTurns % 4;
    phaseTurns += (i - cur + 4) % 4 || 0;
    marker.style.transform = `rotate(${phaseTurns * 90}deg)`;
    loop.querySelectorAll(".ph").forEach((t) => t.classList.toggle("on", t.dataset.ph === p));
  }

  // pulzy (může jich běžet víc najednou)
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const ease = (t) => (t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  function flash(id) {
    const g = nodeEl[id]; if (!g) return;
    g.classList.remove("on"); void g.getBBox(); g.classList.add("on");
    setTimeout(() => g.classList.remove("on"), 900);
  }
  function hop(a, b, back = false) {
    return new Promise((done) => {
      const e = edge(a, b);
      e.classList.add("on");
      const A = P[a], B = P[b];
      const dot = mk("circle", { class: back ? "pulse back" : "pulse", r: 2.2 }, gFx);
      const tr = mk("line", { class: back ? "trail back" : "trail" }, gFx);
      const dur = 380 + Math.hypot(B.x - A.x, B.y - A.y) * 1.9;
      const t0 = performance.now();
      const frame = (now) => {
        const t = Math.min(1, (now - t0) / dur), k = ease(t), kt = ease(Math.max(0, t - .16));
        const x = A.x + (B.x - A.x) * k, y = A.y + (B.y - A.y) * k;
        dot.setAttribute("cx", x); dot.setAttribute("cy", y);
        tr.setAttribute("x1", A.x + (B.x - A.x) * kt); tr.setAttribute("y1", A.y + (B.y - A.y) * kt);
        tr.setAttribute("x2", x); tr.setAttribute("y2", y);
        if (t < 1) requestAnimationFrame(frame);
        else { dot.remove(); tr.remove(); setTimeout(() => e.classList.remove("on"), 120); flash(b); done(); }
      };
      requestAnimationFrame(frame);
    });
  }
  const call = async (a, tool, latency = 300) => { await hop(a, tool); await sleep(latency); await hop(tool, a, true); };

  // ── log vedle grafu (HTML) ──
  const head = document.getElementById("rtRun");
  const logEl = document.getElementById("rtLog");
  const MAX = 12;
  const span = (cls, txt) => { const s = document.createElement("span"); s.className = cls; s.textContent = txt; return s; };
  // simulované hodiny: posouvají se o realistické latence, ne o délku animace
  let vt = Date.now(), runStart = vt;
  const ts = () => {
    const d = new Date(vt), p = (n, l = 2) => String(n).padStart(l, "0");
    return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}.${p(d.getMilliseconds(), 3)}`;
  };
  function log(who, text, kind = "", depth = 0, meta = null) {
    logEl.querySelector(".cur")?.classList.remove("cur");
    const li = document.createElement("li");
    li.className = `${kind} cur`;
    li.style.setProperty("--d", depth);
    // rozhodnutí modelu trvá stovky ms až sekundy, ostatní kroky jen pár ms
    vt += (kind === "plan" || kind === "warn") ? 600 + Math.random() * 1400 : 1 + Math.random() * 4;
    li.append(span("ts", ts()));
    if (who) li.append(span("who", who));
    li.append(text);
    // rozhodovací kroky modelu nesou spotřebu tokenů, výsledky nástrojů dobu trvání
    if (kind === "plan" || kind === "warn") {
      const tin = 600 + Math.floor(Math.random() * 1800), tout = 40 + Math.floor(Math.random() * 220);
      stats && (stats.tokens += tin + tout);
      meta = `${(tin / 1000).toFixed(1)}k→${tout} tok`;
    }
    if (meta) li.append(span("dur", meta));
    logEl.append(li);
    while (logEl.children.length > MAX) logEl.firstElementChild.remove();
    const items = [...logEl.children];
    items.forEach((el, i) => { el.style.opacity = String(Math.max(.35, 1 - (items.length - 1 - i) * .06)); });
  }

  // ── statistiky běhu ──
  let stats;
  const resetStats = () => { subN = 0; vt = runStart = Date.now(); stats = { calls: 0, agents: 1, tokens: 0 }; };
  const tool = async (from, id, who, sig, res, depth, latency) => {
    stats.calls++;
    log(who, `→ ${sig}`, "call", depth);
    await call(from, id, latency);
    // realistické latence podle typu nástroje (animace je pomalejší než skutečnost)
    const base = { db: 24, queue: 9, rag: 140, api: 210 }[id] ?? 320;
    const ms = Math.round(base * (0.7 + Math.random() * 0.9));
    vt += ms;
    const hasTime = /\d\s?(ms|s)\b/.test(res);
    log("", `← ${res}`, "res", depth + 1, hasTime ? null : (ms >= 1000 ? (ms / 1000).toFixed(2) + " s" : ms + " ms"));
  };
  let subN = 0;
  const SLOTS = [{ x: 400, y: 62 }, { x: 420, y: 150 }, { x: 400, y: 238 }];
  async function spawn(parent, slot, name, depth) {
    const id = "s" + (++subN);
    stats.agents++;
    const pos = typeof slot === "number" ? SLOTS[slot] : slot;
    node(id, pos.x, pos.y, name, "agent", true);
    edge(parent, id, true);
    log(parent === "orch" ? "orch" : nodeEl[parent]?.dataset.tag || "sub", `spawn → ${name}`, "spawn", depth);
    await sleep(350);
    await hop(parent, id);
    nodeEl[id].classList.add("busy");
    nodeEl[id].dataset.tag = `#${subN}`;
    return id;
  }
  async function finish(id, parent) {
    nodeEl[id].classList.remove("busy");
    await hop(id, parent, true);
  }
  // nástroj sub-agenta, který se objeví jen na dobu běhu
  function tempTool(parentId, label) {
    const id = "t" + Math.random().toString(36).slice(2, 7);
    const p = P[parentId];
    node(id, p.x + 104, p.y, label, "tool", true);
    edge(parentId, id, true);
    return id;
  }

  // ════════ scénáře ════════
  const RUNS = [
    // 1) audit: rozpad na podúlohy, paralelní sub-agenti, jeden spustí dalšího
    async () => {
      head.textContent = "run 7f3a, task: weekly service audit";
      log("client", "→ audit service intervals for all riders", "req");
      await hop("client", "orch");
      phase("plan");
      log("orch", "plan: 2 workers in parallel", "plan"); await sleep(700);
      phase("act");
      await tool("orch", "db", "orch", "db.riders(active)", "128 riders", 0, 250);
      const [a, b] = await Promise.all([spawn("orch", 0, "strava-sync", 0), spawn("orch", 2, "wear-calc", 0)]);
      const fetchT = tempTool(a, "fetch");
      await Promise.all([
        (async () => { await tool(a, fetchT, "#1", "strava.rides(128)", "2 340 rides", 1, 500); await tool(a, "api", "#1", "api.normalize()", "ok, 41 ms", 1, 200); })(),
        (async () => {
          await sleep(500);
          await tool(b, "db", "#2", "db.components()", "1 204 parts", 1, 300);
          const c = await spawn(b, { x: 520, y: 238 }, "rag-lookup", 1);
          await tool(c, "rag", "#3", "rag.search(wear limits)", "6 chunks", 2, 300);
          await finish(c, b); log("#3", "done → #2", "ok", 2);
          despawn([c]);
        })(),
      ]);
      phase("observe");
      await Promise.all([finish(a, "orch"), finish(b, "orch")]);
      log("orch", "observe: 2/2 subtasks ok, 17 parts due", "plan"); await sleep(500);
      phase("reflect");
      log("orch", "reflect: notify riders, then stop", "plan"); await sleep(500);
      phase("act");
      await tool("orch", "queue", "orch", "queue.add(notify × 17)", "17 jobs queued", 0, 250);
      despawn([a, b, fetchT]);
      await hop("orch", "client");
    },
    // 2) dotaz: smyčka se zopakuje, protože první pokus nestačí
    async () => {
      head.textContent = "run 81c2, task: answer rider question";
      log("client", "→ why is my chain wearing so fast?", "req");
      await hop("client", "orch");
      phase("plan"); log("orch", "plan: check rides + wear model", "plan"); await sleep(600);
      phase("act");
      await Promise.all([
        tool("orch", "db", "orch", "db.rides(90d)", "41 rides, 1 980 km", 0, 300),
        (async () => { await sleep(250); await tool("orch", "rag", "orch", "rag.search(chain wear)", "4 chunks", 0, 350); })(),
      ]);
      phase("observe"); log("orch", "observe: wear 2.1× above model", "plan"); await sleep(500);
      phase("reflect"); log("orch", "reflect: not enough evidence → dig deeper", "warn"); await sleep(600);
      phase("plan"); await sleep(300);
      phase("act");
      const s = await spawn("orch", 1, "ride-analyst", 0);
      const w = tempTool(s, "weather");
      await Promise.all([
        tool(s, "api", "#" + subN, "strava.streams(41)", "mud, 63 % wet", 1, 450),
        (async () => { await sleep(300); await tool(s, w, "#" + subN, "weather.history(90d)", "rain 27 days", 1, 300); })(),
      ]);
      await finish(s, "orch");
      phase("observe"); log("orch", "observe: wet rides explain wear", "plan"); await sleep(400);
      phase("reflect"); log("orch", "reflect: confident, answer", "plan"); await sleep(400);
      despawn([s, w]);
      await hop("orch", "client");
    },
    // 3) report: fan-out na tři sub-agenty, jeden selže a orchestrátor ho zopakuje
    async () => {
      head.textContent = "run 9d05, task: monthly fleet report";
      log("client", "→ build monthly report for bike shop", "req");
      await hop("client", "orch");
      phase("plan"); log("orch", "plan: fan-out 3 workers", "plan"); await sleep(600);
      phase("act");
      const ids = await Promise.all([spawn("orch", 0, "collector", 0), spawn("orch", 1, "analyst", 0), spawn("orch", 2, "renderer", 0)]);
      const [c1, c2, c3] = ids;
      const pdf = tempTool(c3, "pdf");
      await Promise.all([
        tool(c1, "db", "#" + (subN - 2), "db.service_log(30d)", "312 rows", 1, 300),
        (async () => { await sleep(200); await tool(c2, "rag", "#" + (subN - 1), "rag.search(benchmarks)", "5 chunks", 1, 300); })(),
        (async () => { await sleep(400); log("#" + subN, "→ pdf.render(report)", "call", 1); stats.calls++; await hop(c3, pdf); await sleep(400); await hop(pdf, c3, true); vt += 30000; log("", "✗ timeout after 30 s", "err", 2); })(),
      ]);
      phase("observe");
      await Promise.all([finish(c1, "orch"), finish(c2, "orch")]);
      log("orch", "observe: 2/3 ok, renderer failed", "warn"); await sleep(500);
      phase("reflect"); log("orch", "reflect: retry renderer, smaller batch", "plan"); await sleep(500);
      phase("act");
      await tool(c3, pdf, "#" + subN, "pdf.render(batch=2)", "report.pdf, 1.4 s", 1, 400);
      await finish(c3, "orch");
      await tool("orch", "api", "orch", "share.create(7d)", "201, link", 0, 200);
      despawn([c1, c2, c3, pdf]);
      await hop("orch", "client");
    },
  ];

  async function agentLoop() {
    for (let i = 0; ; i = (i + 1) % RUNS.length) {
      resetStats();
      await RUNS[i]();
      const s = ((vt - runStart) / 1000).toFixed(1);
      log("", `✓ done, ${stats.agents} agents, ${stats.calls} tool calls, ${s} s, ${(stats.tokens / 1000).toFixed(1)}k tok`, "done");
      loop.querySelectorAll(".ph").forEach((t) => t.classList.remove("on"));
      await sleep(3200);
    }
  }

  if (reduce) {
    // statický obraz jednoho běhu
    head.textContent = "run 7f3a, task: weekly service audit";
    [["client", "→ audit service intervals for all riders", "req", 0],
     ["orch", "plan: 2 workers in parallel", "plan", 0],
     ["orch", "spawn → strava-sync", "spawn", 0],
     ["orch", "spawn → wear-calc", "spawn", 0],
     ["#1", "→ strava.rides(128)", "call", 1],
     ["#2", "spawn → rag-lookup", "spawn", 1],
     ["#3", "→ rag.search(wear limits)", "call", 2],
     ["orch", "observe: 2/2 subtasks ok, 17 parts due", "plan", 0],
     ["", "✓ done, 4 agents, 6 tool calls", "done", 0]].forEach((a) => log(...a));
    phase("observe");
  } else {
    agentLoop();
  }

})();
