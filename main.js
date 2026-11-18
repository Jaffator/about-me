(() => {
  const root = document.documentElement;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.getElementById("y").textContent = new Date().getFullYear();

  /* ── kurzor jako baterka nad fotkou (jen desktop s myší) ── */
  const photo = document.querySelector(".photo");
  if (matchMedia("(hover: hover) and (pointer: fine)").matches && !reduce) {
    let tx = -999, ty = -999, x = -999, y = -999, raf = null;
    const tick = () => {
      x += (tx - x) * 0.12; y += (ty - y) * 0.12;
      root.style.setProperty("--mx", x + "px");
      root.style.setProperty("--my", y + "px");
      raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.5 ? requestAnimationFrame(tick) : null;
    };
    addEventListener("pointermove", (e) => {
      const r = photo.getBoundingClientRect();
      if (x === -999) { x = e.clientX - r.left; y = e.clientY - r.top; }
      tx = e.clientX - r.left; ty = e.clientY - r.top;
      if (!raf) raf = requestAnimationFrame(tick);
    }, { passive: true });
    document.addEventListener("pointerleave", () => { tx = ty = -999; x = y = -999; root.style.setProperty("--mx", "-999px"); });
  }

  /* ── aktivní položka navigace ── */
  const links = [...document.querySelectorAll(".nav a")];
  const byId = new Map(links.map((a) => [a.getAttribute("href").slice(1), a]));
  const navIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      links.forEach((a) => a.classList.remove("is-active"));
      byId.get(e.target.id)?.classList.add("is-active");
    });
  }, { rootMargin: "-35% 0px -60% 0px" });
  document.querySelectorAll("main section[id]").forEach((s) => navIO.observe(s));

  /* ── agent v terminálu ── */
  const log = document.getElementById("log");
  const typing = document.getElementById("typing");
  const state = document.getElementById("state");
  const stateText = state.querySelector("b");

  // typy kroků: user | event | think | call | answer
  const scenarios = [
    [
      ["user", "Co mám na kole Trail servisovat?"],
      ["think", "Potřebuji stav komponent a najeté km od posledního servisu."],
      ["call", "get_components", '{ bike: "Trail" }', "7 komponent · 38 ms"],
      ["call", "get_rides", '{ since: "last_service" }', "14 jízd · 612 km · 41 ms"],
      ["think", "Řetěz 92 %, destičky 71 %. Priorita je řetěz."],
      ["answer", "Vyměň řetěz do ~100 km. Destičky vydrží zhruba měsíc."],
    ],
    [
      ["event", "strava.webhook → nová jízda, 48 km"],
      ["think", "Jízda patří ke kolu Trail. Přepočítám opotřebení."],
      ["call", "update_wear", "{ ride: 18342 }", "7 dílů aktualizováno · 22 ms"],
      ["think", "Řetěz přešel 95 %. Jezdec má zapnuté notifikace."],
      ["call", "notify", '{ channel: "push" }', "doručeno · 112 ms"],
      ["answer", "Hotovo. Jezdec dostal upozornění na servis."],
    ],
    [
      ["user", "Pošli mi servisní historii jako PDF."],
      ["think", "Načíst záznamy, vyrenderovat report, vytvořit sdílený odkaz."],
      ["call", "get_service_log", '{ bike: "Trail" }', "23 záznamů · 19 ms"],
      ["call", "render_pdf", '{ template: "service-report" }', "report.pdf · 184 kB · 1.2 s"],
      ["call", "create_share_link", '{ expires: "7d" }', "bikecheck.cloud/r/k2f9…"],
      ["answer", "Report je připravený, odkaz platí 7 dní."],
    ],
    [
      ["user", "Jaký tlak do vidlice, když vážím 82 kg?"],
      ["think", "Nevymýšlet. Načíst uložený setup a přepočítat."],
      ["call", "get_suspension_setup", '{ part: "fork" }', "profil Enduro · 78 kg · 84 psi"],
      ["call", "calc_pressure", "{ rider_kg: 82, sag: 0.2 }", "88 psi · 3 tokeny"],
      ["answer", "Dej 88 psi a nech 3 tokeny. Sag ověř na 20 %."],
    ],
  ];

  const LABEL = { user: "› user", event: "● event", think: "◇ think", call: "→ tool", answer: "◆ agent" };
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const setState = (txt, busy) => { stateText.textContent = txt; state.classList.toggle("is-busy", busy); };

  const addLine = (type, html = "") => {
    const li = document.createElement("li");
    li.className = "l-" + type;
    li.innerHTML = `<span class="k">${type === "res" ? "" : LABEL[type]}</span><span class="v">${html}</span>`;
    log.append(li);
    while (log.children.length > 22) log.firstElementChild.remove();
    return li.querySelector(".v");
  };
  const esc = (s) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));

  async function stream(el, text, speed = 18) {
    for (let i = 1; i <= text.length; i++) {
      el.textContent = text.slice(0, i);
      await wait(speed + Math.random() * speed);
    }
  }

  async function run(step) {
    const [type, a, b, c] = step;
    if (type === "user") {
      setState("listening", false);
      await stream(typing, a, 34);
      await wait(350);
      typing.textContent = "";
      addLine("user", esc(a));
      await wait(300);
    } else if (type === "event") {
      setState("received", true);
      addLine("event", esc(a));
      await wait(500);
    } else if (type === "think") {
      setState("deciding", true);
      const v = addLine("think", "");
      v.classList.add("spin");
      await wait(700);
      v.classList.remove("spin");
      await stream(v, a, 14);
      await wait(350);
    } else if (type === "call") {
      setState("tool call", true);
      const v = addLine("call", `<b>${a}</b>(${esc(b)})`);
      v.classList.add("spin");
      await wait(650 + Math.random() * 500);
      v.classList.remove("spin");
      addLine("res", esc(c));
      await wait(300);
    } else if (type === "answer") {
      setState("responding", true);
      const v = addLine("answer", "");
      await stream(v, a, 20);
      setState("idle", false);
    }
  }

  async function loop() {
    for (let i = 0; ; i = (i + 1) % scenarios.length) {
      for (const step of scenarios[i]) await run(step);
      await wait(2200);
      const gap = document.createElement("li");
      gap.className = "l-gap";
      log.append(gap);
    }
  }

  if (reduce) {
    // statická ukázka jednoho běhu
    for (const [type, a, b, c] of scenarios[0]) {
      if (type === "call") { addLine("call", `<b>${a}</b>(${esc(b)})`); addLine("res", esc(c)); }
      else addLine(type, esc(a));
    }
  } else {
    // spustit, až je terminál vidět
    const term = document.querySelector(".term");
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { io.disconnect(); loop(); }
    });
    io.observe(term);
  }

  /* ── reveal při scrollu ── */
  if (!reduce) {
    const els = document.querySelectorAll(".prose p, .item, .sec__lede, .more, .mail");
    const rio = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); rio.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -6% 0px" });
    els.forEach((el) => { el.classList.add("rv"); rio.observe(el); });
  }
})();
