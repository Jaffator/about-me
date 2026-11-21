(() => {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.getElementById("y").textContent = new Date().getFullYear();

  // pás technologií: ikony Simple Icons / Phosphor, plná a obrysová slova střídavě
  const SI = "https://cdn.jsdelivr.net/npm/simple-icons@13.21.0/icons/";
  const PH = "https://cdn.jsdelivr.net/npm/@phosphor-icons/core@2.1.1/assets/fill/";
  const items = [
    ["Node.js", SI + "nodedotjs.svg"], ["NestJS", SI + "nestjs.svg"], ["PostgreSQL", SI + "postgresql.svg"],
    ["React", SI + "react.svg"], ["TypeScript", SI + "typescript.svg"], ["RAG", PH + "files-fill.svg", 1],
    ["Function calling", PH + "function-fill.svg", 1], ["Build AI agents", PH + "robot-fill.svg", 1],
    ["AI spec-driven dev", PH + "clipboard-text-fill.svg", 1], ["GitHub Actions", SI + "githubactions.svg"], ["Docker", SI + "docker.svg"],
  ];
  const track = document.querySelector(".ticker__track");
  const one = () => items.map(([n, u, ph], i) =>
    `<span${i % 2 ? ' class="o"' : ""}><b class="ic${ph ? " ph" : ""}" style="--i:url(${u})"></b>${n}</span><i>/</i>`).join("");
  track.innerHTML = one() + one();

  // zkopírovat e-mail
  const btn = document.querySelector(".copy");
  const live = Object.assign(document.createElement("span"), { className: "sr" });
  live.style.cssText = "position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)";
  live.setAttribute("aria-live", "polite"); btn.after(live);
  let t;
  btn.addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(btn.dataset.copy); }
    catch { const r = document.createRange(); r.selectNodeContents(document.querySelector(".mail")); getSelection().removeAllRanges(); getSelection().addRange(r); document.execCommand("copy"); }
    btn.textContent = "Zkopírováno ✓"; live.textContent = "E-mail zkopírován";
    clearTimeout(t); t = setTimeout(() => { btn.textContent = "Kopírovat"; live.textContent = ""; }, 2200);
  });

  // místní čas
  const clock = document.getElementById("clock");
  const fmt = new Intl.DateTimeFormat("cs-CZ", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Prague" });
  const zn = new Intl.DateTimeFormat("en-GB", { timeZoneName: "short", timeZone: "Europe/Prague" });
  const tick = () => {
    const z = zn.formatToParts(new Date()).find((p) => p.type === "timeZoneName")?.value;
    clock.textContent = `Praha ${fmt.format(new Date())} ${z === "GMT+1" ? "CET" : z === "GMT+2" ? "CEST" : z || ""}`;
  };
  tick(); setInterval(tick, 30000);

  // aktivní položka v menu
  const links = [...document.querySelectorAll(".nav__links a:not(.nav__cta)")];
  const byId = new Map(links.map((a) => [a.getAttribute("href").slice(1), a]));
  const navIO = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    links.forEach((a) => a.classList.remove("is-active"));
    byId.get(e.target.id)?.classList.add("is-active");
  }), { rootMargin: "-40% 0px -55% 0px" });
  document.querySelectorAll("main section[id]").forEach((s) => navIO.observe(s));

  // nástup při scrollu (obsah je bez JS vidět)
  if (!reduce) {
    document.documentElement.classList.add("js");
    const els = document.querySelectorAll(".card, .row, .showcase, .mini, .sec__head");
    els.forEach((el, i) => { el.setAttribute("data-rv", ""); el.style.setProperty("--d", ((i % 4) * 0.08).toFixed(2) + "s"); });
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    }), { rootMargin: "0px 0px -6% 0px" });
    els.forEach((el) => io.observe(el));
  }
})();
