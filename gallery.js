// Galerie obrazovek BikeCheck: celoobrazovkový <dialog>, sady Mobil / Desktop, šipky, swipe, náhledy.
// Obrázky: assets/projects/bikecheck/full/NN.webp (mobil 1170 px, desktop 1920 px, WebP q90) a thumb/NN.webp.
(() => {
  const dlg = document.querySelector(".gal");
  const openers = document.querySelectorAll("[data-gal-open]");
  if (!dlg || !openers.length) return;

  const SETS = {
    // popisky [čeština, angličtina]
    m: { w: 1170, h: 2532, items: [
      ["Přihlášení", "Sign in"],
      ["Úvod: jízdy ze Stravy opotřebovávají díly", "Intro: Strava rides wear out components"],
      ["Úvod: aplikace hlídá servisní intervaly", "Intro: the app tracks service intervals"],
      ["Úvod: garáž a setup na jednom místě", "Intro: garage and setup in one place"],
      ["Úvod: sdílení profilu a servisní report", "Intro: profile sharing and service report"],
      ["Nové kolo: vyhledání modelu", "New bike: model search"],
      ["Nové kolo: výběr přesného modelu", "New bike: picking the exact model"],
      ["Nové kolo: specifikace", "New bike: specification"],
      ["Nové kolo: kontrola komponent", "New bike: component check"],
      ["Domů: nájezd, poslední jízda a stav kol", "Home: mileage, latest ride and bike status"],
      ["Garáž", "Garage"],
      ["Detail kola", "Bike detail"],
      ["Setup: tlaky, sag a nastavení odpružení", "Setup: pressures, sag and suspension settings"],
      ["Servis", "Service"],
      ["Servis: komponenty, které vyžadují pozornost", "Service: components that need attention"],
      ["Naplánovaný servis", "Scheduled service"],
      ["Detail servisního úkonu", "Service task detail"],
      ["Historie servisu a náklady", "Service history and costs"],
      ["Jízdy ze Stravy", "Rides from Strava"],
      ["Detail jízdy", "Ride detail"],
      ["AI asistent nad daty uživatele", "AI assistant over the user's data"],
      ["Jezdci a sledující", "Riders and followers"],
      ["Nastavení", "Settings"],
      ["Sdílení profilu", "Profile sharing"],
      ["BikeCheck Pro: nabídka", "BikeCheck Pro: offer"],
      ["BikeCheck Pro: souhrn předplatného", "BikeCheck Pro: subscription summary"],
      ["BikeCheck Pro: potvrzování platby", "BikeCheck Pro: confirming payment"],
      ["BikeCheck Pro: neúspěšná platba", "BikeCheck Pro: payment failed"],
      ["BikeCheck Pro: zaplaceno", "BikeCheck Pro: paid"],
    ] },
    d: { w: 1920, h: 1200, items: [
      ["Přihlášení", "Sign in"],
      ["Nové kolo: výsledky hledání", "New bike: search results"],
      ["Nové kolo: výběr modelu", "New bike: model selection"],
      ["Nové kolo: specifikace", "New bike: specification"],
      ["Nové kolo: komponenty", "New bike: components"],
      ["Nové kolo: souhrn", "New bike: summary"],
      ["Domů: dashboard", "Home: dashboard"],
      ["Garáž", "Garage"],
      ["Detail kola", "Bike detail"],
      ["Setup odpružení", "Suspension setup"],
      ["Jízdy", "Rides"],
      ["AI asistent", "AI assistant"],
    ] },
  };
  const en = () => document.documentElement.lang === "en";

  // jedna souvislá řada: mobil 01–29, desktop 30–41
  const all = [];
  for (const [set, s] of Object.entries(SETS)) {
    s.items.forEach(([cs, enCap], i) => {
      const n = String(all.length + 1).padStart(2, "0");
      all.push({ set, i, get cap() { return en() ? enCap : cs; }, w: s.w, h: s.h,
        full: `assets/projects/bikecheck/full/${n}.webp`, thumb: `assets/projects/bikecheck/thumb/${n}.webp` });
    });
  }

  const img = dlg.querySelector(".gal__img");
  const cap = dlg.querySelector(".gal__cap");
  const strip = dlg.querySelector(".gal__strip");
  const outI = dlg.querySelector("[data-gal-i]");
  const outLen = dlg.querySelector("[data-gal-len]");
  const tabs = dlg.querySelectorAll("[data-gal-set]");
  const prev = dlg.querySelector('[data-gal-step="-1"]');
  const next = dlg.querySelector('[data-gal-step="1"]');
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const cache = new Map();
  let cur = -1, shownSet = null, token = 0;

  const load = (k) => {
    if (k < 0 || k >= all.length) return;
    if (!cache.has(k)) { const im = new Image(); im.decoding = "async"; im.src = all[k].full; cache.set(k, im.decode().catch(() => {})); }
    return cache.get(k);
  };

  const renderStrip = (set) => {
    if (shownSet === set) return;
    shownSet = set;
    strip.replaceChildren(...all.map((it, k) => [it, k]).filter(([it]) => it.set === set).map(([it, k]) => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "gal__t"; b.dataset.k = k;
      b.setAttribute("role", "listitem");
      b.setAttribute("aria-label", `${it.i + 1}: ${it.cap}`);
      const t = document.createElement("img");
      t.src = it.thumb; t.alt = ""; t.loading = "lazy"; t.decoding = "async";
      t.width = it.set === "m" ? 30 : 102; t.height = 64;
      b.append(t);
      return b;
    }));
  };

  const show = async (k, dir = 0) => {
    k = Math.max(0, Math.min(all.length - 1, k));
    if (k === cur) return;
    const it = all[k], my = ++token;
    cur = k;

    // texty a ovládání hned, obrázek až po dekódování (žádné probliknutí poloprázdného snímku)
    renderStrip(it.set);
    tabs.forEach((t) => t.setAttribute("aria-pressed", String(t.dataset.galSet === it.set)));
    outI.textContent = String(it.i + 1).padStart(2, "0");
    outLen.textContent = String(SETS[it.set].items.length).padStart(2, "0");
    prev.disabled = k === 0;
    next.disabled = k === all.length - 1;
    strip.querySelectorAll(".gal__t").forEach((b) => {
      const on = +b.dataset.k === k;
      b.setAttribute("aria-current", String(on));
      if (on) b.scrollIntoView({ block: "nearest", inline: "center", behavior: reduce || !dlg.open ? "auto" : "smooth" });
    });

    await load(k);
    if (my !== token) return;              // mezitím se přeskočilo jinam
    img.width = it.w; img.height = it.h;
    img.src = it.full; img.alt = `BikeCheck – ${it.cap}`;
    cap.textContent = it.cap;
    img.style.setProperty("--dx", dir);
    img.classList.remove("is-swap"); void img.offsetWidth; img.classList.add("is-swap");
    load(k + 1); load(k - 1);              // sousedé předem, ať listování nečeká
  };

  const open = (k = 0) => {
    dlg.classList.remove("is-out");
    dlg.showModal();
    cur = -1; shownSet = null;             // náhledy znovu, ať mají popisky v aktuálním jazyce
    show(k);
    dlg.focus();                           // fokus na dialog: šipky fungují hned, bez kroužku na tlačítku
  };
  const close = () => {
    if (!dlg.open || dlg.classList.contains("is-out")) return;
    if (reduce) { dlg.close(); return; }
    dlg.classList.add("is-out");
    setTimeout(() => { dlg.close(); dlg.classList.remove("is-out"); }, 160);
  };

  openers.forEach((b) => b.addEventListener("click", () => open(0)));
  dlg.querySelector("[data-gal-close]").addEventListener("click", close);
  dlg.addEventListener("cancel", (e) => { e.preventDefault(); close(); });   // Esc s animací
  prev.addEventListener("click", () => show(cur - 1, -1));
  next.addEventListener("click", () => show(cur + 1, 1));
  tabs.forEach((t) => t.addEventListener("click", () => {
    const first = all.findIndex((it) => it.set === t.dataset.galSet);
    if (all[cur].set !== t.dataset.galSet) show(first, first > cur ? 1 : -1);
  }));
  strip.addEventListener("click", (e) => {
    const b = e.target.closest(".gal__t");
    if (b) show(+b.dataset.k, Math.sign(+b.dataset.k - cur));
  });

  dlg.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") { e.preventDefault(); show(cur + 1, 1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); show(cur - 1, -1); }
    else if (e.key === "Home") { e.preventDefault(); show(0, -1); }
    else if (e.key === "End") { e.preventDefault(); show(all.length - 1, 1); }
  });

  // klik do prázdna kolem snímku zavře galerii
  dlg.querySelector(".gal__stage").addEventListener("click", (e) => {
    if (e.target.classList.contains("gal__stage") || e.target.classList.contains("gal__fig")) close();
  });

  // swipe na dotykových zařízeních
  let x0 = null, y0 = 0;
  const stage = dlg.querySelector(".gal__stage");
  stage.addEventListener("pointerdown", (e) => { if (e.pointerType !== "mouse") { x0 = e.clientX; y0 = e.clientY; } });
  stage.addEventListener("pointerup", (e) => {
    if (x0 === null) return;
    const dx = e.clientX - x0, dy = e.clientY - y0;
    x0 = null;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.4) show(cur + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
  });
  stage.addEventListener("pointercancel", () => { x0 = null; });
})();
