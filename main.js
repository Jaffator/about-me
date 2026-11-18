(() => {
  const root = document.documentElement;
  const body = document.body;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.getElementById("y").textContent = new Date().getFullYear();

  /* ── kurzor jako baterka nad fotkou ── */
  const ghost = document.querySelector(".ghost");
  body.classList.add("is-off"); // baterka se rozsvítí až při pohybu myši
  if (matchMedia("(hover: hover) and (pointer: fine)").matches && !reduce) {
    let tx = 0, ty = 0, x = 0, y = 0, raf = null;
    const tick = () => {
      x += (tx - x) * 0.12; y += (ty - y) * 0.12;
      root.style.setProperty("--mx", x + "px");
      root.style.setProperty("--my", y + "px");
      raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.5 ? requestAnimationFrame(tick) : null;
    };
    addEventListener("pointermove", (e) => {
      const r = ghost.getBoundingClientRect();
      tx = e.clientX - r.left; ty = e.clientY - r.top;
      body.classList.remove("is-off");
      if (!raf) raf = requestAnimationFrame(tick);
    }, { passive: true });
    document.addEventListener("pointerleave", () => body.classList.add("is-off"));
  } else {
    body.classList.add("is-off");
  }

  /* ── po odscrollování fotku ještě víc ztlumit ── */
  const onScroll = () => body.classList.toggle("is-scrolled", scrollY > innerHeight * 0.6);
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ── live trace agenta ── */
  const log = document.getElementById("trace");
  const script = [
    ["obs",  "strava.webhook → nová jízda"],
    ["plan", "goal: přepočítat opotřebení dílů"],
    ["tool", "strava.getActivity(id)"],
    ["obs",  "48.2 km · 1 210 m ↑ · trail"],
    ["tool", "db.components(bike: 'Trail')"],
    ["plan", "řetěz 92 % → naplánovat servis"],
    ["tool", "queue.add('notify', rider)"],
    ["obs",  "doručeno · 112 ms"],
    ["ok",   "wear updated · 7 dílů"],
  ];
  const t0 = Date.now();
  const stamp = () => {
    const s = ((Date.now() - t0) / 1000).toFixed(2).padStart(6, "0");
    return `+${s}s`;
  };
  const line = ([k, msg]) => {
    const li = document.createElement("li");
    li.innerHTML = `<span class="t">${stamp()}</span><span class="k k-${k}">${k}</span>`;
    li.append(document.createTextNode(msg));
    return li;
  };
  let i = 0;
  const push = () => {
    log.querySelector(".cursor")?.classList.remove("cursor");
    const li = line(script[i % script.length]);
    li.classList.add("cursor");
    log.append(li);
    while (log.children.length > 8) log.firstElementChild.remove();
    i++;
    setTimeout(push, i % script.length === 0 ? 2600 : 900 + Math.random() * 700);
  };
  if (reduce) script.slice(-6).forEach((s) => log.append(line(s)));
  else push();

  /* ── smyčka: aktivní krok ── */
  const steps = [...document.querySelectorAll(".loop__step")];
  const loop = document.getElementById("loop");
  let step = 0, loopTimer = null;
  const setStep = (n) => {
    step = n % steps.length;
    loop.style.setProperty("--step", step);
    steps.forEach((el, j) => el.classList.toggle("is-on", j === step));
  };
  setStep(0);
  if (!reduce) {
    new IntersectionObserver(([e]) => {
      clearInterval(loopTimer);
      if (e.isIntersecting) loopTimer = setInterval(() => setStep(step + 1), 1600);
    }, { threshold: 0.4 }).observe(loop);
    steps.forEach((el, j) => el.addEventListener("pointerenter", () => setStep(j)));
  }

  /* ── reveal při scrollu ── */
  if (!reduce && "IntersectionObserver" in window) {
    const els = document.querySelectorAll(".sec__head, .do__row, .big, .tenets li, .xp__row, .work li, .stack div, .contact > *");
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    els.forEach((el) => { el.classList.add("rv"); io.observe(el); });
  }
})();
