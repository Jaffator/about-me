// Skripty pro mix.html. Žádný listener na scroll: stav se odvozuje z IntersectionObserveru.

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

// Jméno a nadpis v úvodu se „dekódují“ zleva doprava (nejdřív jméno, pak nadpis).
// Nadpis po dekódování zůstane jako obrys a zespodu se vyplní barvou (mix.css).
// Po najetí myší na úvod se znovu dekóduje jméno.
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
    const run = (delay, done) => {
      if (busy) return;
      busy = true;
      const t0 = performance.now() + delay;
      let last = 0;
      const step = (t) => {
        const p = t - t0;
        if (t - last >= TICK) {
          last = t;
          chars.forEach(({ s, c }, i) => {
            const from = i * STEP, to = from + HOLD;
            if (p < from) return;
            if (p >= to) { s.textContent = c; s.classList.remove("is-x", "is-wait"); return; }
            s.textContent = G[(Math.random() * G.length) | 0];
            s.classList.remove("is-wait"); s.classList.add("is-x");
          });
        }
        if (p < chars.length * STEP + HOLD) requestAnimationFrame(step);
        else { busy = false; done?.(); }
      };
      requestAnimationFrame(step);
    };
    return { lock, run, len: chars.length };
  };

  const nameEl = document.querySelector(".mx__kicker");
  const titleEl = document.querySelector(".mx__title:not(.glowt)");   // bento má vlastní nadpis
  const name = nameEl && decoder(nameEl);
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

  document.fonts.ready.then(() => {
    name?.lock(); title?.lock(); geo();
    name?.run(350);
    // nadpis začne, když je jméno zhruba v půlce; po dokončení se zespodu vyplní
    title?.run(350 + (name ? name.len * STEP * .5 : 0), () => titleEl.classList.add("is-fill"));
  });
  addEventListener("resize", () => { name?.lock(); title?.lock(); geo(); });
  if (name && matchMedia("(hover: hover)").matches)
    document.querySelector(".mx__type")?.addEventListener("pointerenter", () => name.run(0));
})();

// Reveal: prvky kontaktu najíždějí v pořadí čtení (zbytek stránky objevuje main.js).
(() => {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const els = [...document.querySelectorAll("#kontakt .shout, #kontakt .ask, #kontakt .copy, #kontakt .profiles, .about__big, .stats > div, .about__cols, .case, .work--sub")];
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
    btn.classList.add("is-done"); label.textContent = "Zkopírováno"; live.textContent = "E-mail zkopírován";
    clearTimeout(t);
    t = setTimeout(() => { btn.classList.remove("is-done"); label.textContent = "Kopírovat"; live.textContent = ""; }, 2200);
  });
})();
