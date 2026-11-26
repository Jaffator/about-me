// Skripty pro index.html (varianta mix). Žádný listener na scroll: stav se odvozuje z IntersectionObserveru.

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

// Nadpis v úvodu se „dekóduje“ zleva doprava, pak zůstane jako obrys a zespodu se vyplní barvou
// (mix.css; řádek FULLSTACK & zůstane obrysem). Potom se každé 4–6 s znovu dekóduje jeden náhodný řádek.
(() => {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const G = "ABCDEFGHJKLMNPRSTUVXYZ0123456789#/_<>";
  const STEP = 42, HOLD = 280, TICK = 50;           // ms: rozestup znaků, doba šumu, frekvence změn

  // každý znak (kromě mezer) do vlastního spanu; vnořené spany (& v Geistu, řádky nadpisu) zůstanou
  const wrap = (el) => {
    const chars = [];
    const walk = (node) => [...node.childNodes].forEach((n) => {
      if (n.nodeType === 1) { walk(n); return; }
      if (n.nodeType !== 3 || !n.textContent.trim()) return;
      const frag = document.createDocumentFragment();
      [...n.textContent].forEach((c) => {
        if (/\s/.test(c)) { frag.append(c); return; }
        const s = document.createElement("span");
        s.className = "dc is-wait"; s.textContent = c; frag.append(s);
        chars.push({ s, c });
      });
      n.replaceWith(frag);
    });
    walk(el);
    return chars;
  };

  // znaky mají zamčenou šířku podle skutečného písmene, takže při šumu nic neposkakuje
  const decoder = (el) => {
    el.classList.add("is-dec");
    const chars = wrap(el);
    let busy = false;
    const lock = () => chars.forEach(({ s, c }) => {
      s.textContent = c; s.style.width = "";
      s.style.width = s.getBoundingClientRect().width + "px";
    });
    const run = (delay, done, list = chars) => {
      if (busy) return;
      busy = true;
      const t0 = performance.now() + delay;
      let last = 0;
      const step = (t) => {
        const p = t - t0;
        if (t - last >= TICK) {
          last = t;
          list.forEach(({ s, c }, i) => {
            const from = i * STEP, to = from + HOLD;
            if (p < from) return;
            if (p >= to) { s.textContent = c; s.classList.remove("is-x", "is-wait"); return; }
            s.textContent = G[(Math.random() * G.length) | 0];
            s.classList.remove("is-wait"); s.classList.add("is-x");
          });
        }
        if (p < list.length * STEP + HOLD) requestAnimationFrame(step);
        else {
          // poslední tik mohl přijít dřív, než se usadil poslední znak: na konci usadit všechny
          list.forEach(({ s, c }) => { s.textContent = c; s.classList.remove("is-x", "is-wait"); });
          busy = false; done?.();
        }
      };
      requestAnimationFrame(step);
    };
    // znaky po řádcích nadpisu (.mx__l), pro opakované dekódování jednoho řádku
    const lines = [...el.querySelectorAll(".mx__l")]
      .map((l) => chars.filter(({ s }) => l.contains(s)))
      .filter((l) => l.length);
    return { lock, run, lines, len: chars.length };
  };

  const titleEl = document.querySelector(".mx__title:not(.glowt)");   // bento má vlastní nadpis
  const title = titleEl && decoder(titleEl);

  // výplň nadpisu jde přes oba řádky jedním tahem: každý znak zná výšku nadpisu a svou polohu v něm
  const geo = () => {
    if (!titleEl) return;
    const r = titleEl.getBoundingClientRect();
    titleEl.style.setProperty("--th", r.height + "px");
    titleEl.querySelectorAll(".dc").forEach((d) => {
      const b = d.getBoundingClientRect();
      d.style.setProperty("--oy", b.top - r.top + "px");
    });
  };

  // opakování: náhodný řádek (ne dvakrát po sobě) každé 4–6 s, jen když je úvod vidět a karta je aktivní
  let seen = true, prev = -1;
  if (titleEl) new IntersectionObserver(([e]) => { seen = e.isIntersecting; }).observe(titleEl);
  const again = () => setTimeout(() => {
    if (seen && !document.hidden && title.lines.length) {
      let i;
      do i = (Math.random() * title.lines.length) | 0; while (i === prev && title.lines.length > 1);
      prev = i;
      title.run(0, null, title.lines[i]);
    }
    again();
  }, 4000 + Math.random() * 2000);

  document.fonts.ready.then(() => {
    title?.lock(); geo();
    title?.run(350, () => { titleEl.classList.add("is-fill"); again(); });   // po dokončení se zespodu vyplní
  });
  addEventListener("resize", () => { title?.lock(); geo(); });
})();

// Reveal: prvky kontaktu najíždějí v pořadí čtení (zbytek stránky objevuje main.js).
(() => {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const els = [...document.querySelectorAll("#kontakt .shout, #kontakt .ask, #kontakt .copy, #kontakt .profiles, .me__txt, .pr, .tl > li, .st__col, .hob > li")];
  els.forEach((el, i) => { el.classList.add("rv"); el.style.setProperty("--d", ((i % 3) * 0.1).toFixed(2) + "s"); });
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.classList.add("in"); io.unobserve(e.target);
  }), { rootMargin: "0px 0px -6% 0px" });
  els.forEach((el) => io.observe(el));
})();

// Kontakt: zkopírovat e-mail (mailto bez poštovního klienta nic neudělá).
(() => {
  const btn = document.querySelector(".copy");
  if (!btn) return;
  const label = btn.querySelector(".copy__t");
  const live = document.createElement("span");
  live.className = "sr"; live.setAttribute("aria-live", "polite"); btn.after(live);
  let t;
  btn.addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(btn.dataset.copy); }
    catch {
      const r = document.createRange(); r.selectNodeContents(document.querySelector(".mail"));
      getSelection().removeAllRanges(); getSelection().addRange(r); document.execCommand("copy");
    }
    const en = document.documentElement.lang === "en";
    btn.classList.add("is-done"); label.textContent = en ? "Copied" : "Zkopírováno"; live.textContent = en ? "Email copied" : "E-mail zkopírován";
    clearTimeout(t);
    t = setTimeout(() => {
      btn.classList.remove("is-done"); label.textContent = document.documentElement.lang === "en" ? "Copy" : "Kopírovat"; live.textContent = "";
    }, 2200);
  });
})();

// Projekty: 3D scény mají pevnou velikost, zoom je zmenší na dostupnou šířku.
(() => {
  const fits = document.querySelectorAll(".pr__fit");
  if (!fits.length) return;
  const ro = new ResizeObserver(entries => {
    for (const e of entries) {
      const fit = e.target.querySelector(".pr__fit");
      const w = parseFloat(getComputedStyle(fit).getPropertyValue("--w")) || 1;
      fit.style.setProperty("--k", Math.min(0.86, e.contentRect.width / w).toFixed(4));
    }
  });
  fits.forEach(f => ro.observe(f.parentElement));
})();
