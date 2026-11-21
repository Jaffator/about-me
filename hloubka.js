// Jemné natočení prostorového nadpisu podle kurzoru (jen myš, ne při omezeném pohybu).
(() => {
  const el = document.getElementById("deep");
  if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches || !matchMedia("(hover: hover)").matches) return;

  let tx = 0, ty = 0, x = 0, y = 0, raf = 0;
  const tick = () => {
    x += (tx - x) * 0.08; y += (ty - y) * 0.08;
    el.style.setProperty("--ry", (x * 8).toFixed(2) + "deg");
    el.style.setProperty("--rx", (-y * 5).toFixed(2) + "deg");
    raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.001 ? requestAnimationFrame(tick) : 0;
  };
  addEventListener("pointermove", (e) => {
    tx = e.clientX / innerWidth - 0.5;
    ty = e.clientY / innerHeight - 0.5;
    if (!raf) raf = requestAnimationFrame(tick);
  }, { passive: true });
})();

// Pilulka v menu: plynule přejede pod položku, nad kterou je kurzor.
(() => {
  const nav = document.querySelector(".bar__nav");
  const pill = nav?.querySelector(".bar__pill");
  if (!nav || !pill || !matchMedia("(hover: hover)").matches) return;
  nav.classList.add("js");
  const links = [...nav.querySelectorAll("a")];
  let first = true;

  const moveTo = (a) => {
    const n = nav.getBoundingClientRect(), r = a.getBoundingClientRect();
    if (first) pill.style.transition = "none";           // první najetí: objevit se rovnou na místě
    nav.style.setProperty("--px", r.left - n.left + "px");
    nav.style.setProperty("--pw", r.width + "px");
    nav.style.setProperty("--ph", r.height + "px");
    pill.style.top = r.top - n.top + "px";
    if (first) { pill.offsetWidth; pill.style.transition = ""; first = false; }
    nav.classList.add("has-pill");
    links.forEach((l) => l.classList.toggle("is-lit", l === a));
  };
  links.forEach((a) => a.addEventListener("pointerenter", () => moveTo(a)));
  nav.addEventListener("pointerleave", () => {
    nav.classList.remove("has-pill");
    links.forEach((l) => l.classList.remove("is-lit"));
    first = true;
  });
})();

// Scroll: nadpis se při odjezdu z úvodu odklání a ustupuje do hloubky (--sp 0–1).
(() => {
  const el = document.getElementById("deep");
  const hero = document.querySelector(".hero--deep");
  if (!el || !hero || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  let raf = 0;
  const update = () => {
    raf = 0;
    const p = Math.min(1, Math.max(0, scrollY / (hero.offsetHeight * 0.85)));
    el.style.setProperty("--sp", p.toFixed(4));
  };
  addEventListener("scroll", () => { if (!raf) raf = requestAnimationFrame(update); }, { passive: true });
  addEventListener("resize", update);
  update();
})();

// Postupné objevování: zpoždění podle pořadí v seznamu, štítky naskočí po řádku.
(() => {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const groups = [".list > .item", ".projects > .proj", "#kontakt .sec__body > *"];
  const extra = [];
  groups.forEach((sel) => document.querySelectorAll(sel).forEach((el, i) => {
    el.style.setProperty("--d", (i * 0.12).toFixed(2) + "s");
    el.querySelectorAll(".tags li").forEach((li, j) => li.style.setProperty("--i", j));
    if (!el.classList.contains("rv")) { el.classList.add("rv"); extra.push(el); }
  }));
  const done = (el) => setTimeout(() => {          // po dojetí uklidit, ať funguje hover
    el.classList.remove("rv", "in");
    el.style.removeProperty("--d");
  }, 1800 + (parseFloat(el.style.getPropertyValue("--d")) || 0) * 1000);
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.classList.add("in"); io.unobserve(e.target);
  }), { rootMargin: "0px 0px -6% 0px" });
  extra.forEach((el) => io.observe(el));
  // úklid i pro prvky, které objevuje main.js
  new MutationObserver((ms) => ms.forEach((m) => {
    if (m.target.classList.contains("in") && m.target.classList.contains("rv")) done(m.target);
  })).observe(document.querySelector("main"), { subtree: true, attributes: true, attributeFilter: ["class"] });
})();

// Běh agenta = průchod stránkou. Uzly jsou sekce, signál dojede k sekci, kterou čteš.
// Navštívené uzly zůstávají „hotové“, první dojetí ke kontaktu = dokončený běh.
(() => {
  const svg = document.getElementById("flow");
  const status = document.getElementById("flowStatus");
  const dots = [...document.querySelectorAll("#barRun i")];
  if (!svg) return;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const NS = "http://www.w3.org/2000/svg";
  const mk = (tag, attrs, parent = svg) => {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    parent.append(e); return e;
  };

  const ids = ["top", "o-mne", "praxe", "projekty", "kontakt"];
  const names = ["start", "o_mne", "praxe", "projekty", "kontakt"];
  const secs = ids.map((id) => document.getElementById(id));
  // body na „podlaze“: dole je blíž, nahoře daleko
  const P = [[70, 352], [214, 300], [118, 214], [272, 150], [178, 58]];
  const curve = (a, b) => {
    const [x1, y1] = P[a], [x2, y2] = P[b], my = (y1 + y2) / 2;
    return `M${x1} ${y1} C${x1} ${my} ${x2} ${my} ${x2} ${y2}`;
  };

  const gE = mk("g", {}), gN = mk("g", {});
  const edges = [0, 1, 2, 3].map((i) => {
    mk("path", { d: curve(i, i + 1), class: "fe" }, gE);
    const lit = mk("path", { d: curve(i, i + 1), class: "fe fe--lit" }, gE);
    const len = lit.getTotalLength();
    lit.style.strokeDasharray = len; lit.style.strokeDashoffset = len;
    return { lit, len, done: false };
  });
  const nodes = P.map(([x, y], i) => {
    const g = mk("g", { class: "fn" }, gN);
    mk("circle", { cx: x, cy: y, r: 13, class: "fn__ring" }, g);
    mk("circle", { cx: x, cy: y, r: 5, class: "fn__dot" }, g);
    const t = mk("text", { x: x + (x > 200 ? -14 : 14), y: y + 4, class: "fn__t", "text-anchor": x > 200 ? "end" : "start" }, g);
    t.textContent = names[i];
    return g;
  });
  const sig = mk("circle", { r: 4, class: "fsig", cx: P[0][0], cy: P[0][1] });

  // Linka se plní plynule podle scrollu: 0 = úvod, 4 = kontakt. Zpátky se zase vyprazdňuje.
  let anchors = [], target = 0, shown = 0, cur = -1, raf = 0;

  const measure = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    anchors = secs.map((s, k) => k === 0 ? 0 : Math.min(max, s.getBoundingClientRect().top + scrollY - innerHeight * 0.5));
    for (let k = 1; k < anchors.length; k++) anchors[k] = Math.max(anchors[k], anchors[k - 1] + 1);
  };
  const progress = () => {
    const y = scrollY;
    for (let k = 1; k < anchors.length; k++)
      if (y < anchors[k]) return k - 1 + Math.max(0, (y - anchors[k - 1]) / (anchors[k] - anchors[k - 1]));
    return 4;
  };

  const render = () => {
    edges.forEach((e, i) => {
      const f = Math.min(1, Math.max(0, shown - i));
      e.lit.style.strokeDashoffset = e.len * (1 - f);
    });
    const idx = Math.min(3, Math.floor(shown)), frac = shown - idx;
    const pt = edges[idx].lit.getPointAtLength(Math.min(1, frac) * edges[idx].len);
    sig.setAttribute("cx", pt.x); sig.setAttribute("cy", pt.y);
    sig.classList.toggle("is-moving", frac > .02 && frac < .98 && shown < 3.98);

    const c = Math.min(4, Math.floor(shown + .02));
    nodes.forEach((n, i) => n.classList.toggle("is-done", i <= c));
    if (c !== cur) {
      if (c === 4 && cur !== -1) {               // dojetí ke kontaktu = dokončený běh (pokaždé)
        svg.classList.remove("is-complete"); void svg.getBBox();
        svg.classList.add("is-complete");
        setTimeout(() => svg.classList.remove("is-complete"), 2200);
      }
      cur = c;
      nodes.forEach((n, i) => n.classList.toggle("is-on", i === c));
      dots.forEach((d, i) => { d.classList.toggle("is-on", i === c); d.classList.toggle("is-done", i < c); });
      status.innerHTML = c === 4 ? `run · <b>done</b> · 4/4 ✓` : `run · <b>${names[c]}</b> · ${c}/4`;
    }
  };

  const tick = () => {
    shown += (target - shown) * (reduce ? 1 : 0.14);
    if (Math.abs(target - shown) < .001) shown = target;
    render();
    raf = shown !== target ? requestAnimationFrame(tick) : 0;
  };
  const update = () => {
    target = progress();
    const toEnd = document.documentElement.scrollHeight - (innerHeight + scrollY);
    svg.closest(".flow").classList.toggle("is-end", toEnd < 90);   // nad patičkou posunout stav výš
    if (!raf) raf = requestAnimationFrame(tick);
  };
  addEventListener("scroll", update, { passive: true });
  addEventListener("resize", () => { measure(); update(); });
  addEventListener("load", () => { measure(); update(); });
  measure(); update();
})();

// Kontakt: zkopírovat e-mail (mailto bez poštovního klienta nic neudělá) + místní čas.
(() => {
  const btn = document.querySelector(".copy");
  if (btn) {
    const label = btn.querySelector("span");
    const live = document.createElement("span");
    live.className = "sr"; live.setAttribute("aria-live", "polite"); btn.after(live);
    let t;
    btn.addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(btn.dataset.copy); }
      catch {
        const r = document.createRange(); r.selectNodeContents(document.querySelector(".mail"));
        getSelection().removeAllRanges(); getSelection().addRange(r); document.execCommand("copy");
      }
      btn.classList.add("is-done"); label.textContent = "Zkopírováno ✓"; live.textContent = "E-mail zkopírován";
      clearTimeout(t);
      t = setTimeout(() => { btn.classList.remove("is-done"); label.textContent = "Kopírovat"; live.textContent = ""; }, 2200);
    });
  }
  const el = document.getElementById("localTime");
  if (el) {
    const fmt = new Intl.DateTimeFormat("cs-CZ", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Prague" });
    const zone = new Intl.DateTimeFormat("en-GB", { timeZoneName: "short", timeZone: "Europe/Prague" });
    const tick = () => {
      el.textContent = fmt.format(new Date());
      const z = zone.formatToParts(new Date()).find((p) => p.type === "timeZoneName")?.value;
      if (z) el.nextSibling.textContent = ` (Praha, ${z === "GMT+1" ? "CET" : z === "GMT+2" ? "CEST" : z})`;
    };
    tick(); setInterval(tick, 30000);
  }
})();
