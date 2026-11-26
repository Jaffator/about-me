// Přepínač CZ / EN. Čeština je přímo v HTML (výchozí), angličtina je tady.
// - prvky s data-i18n="klíč" dostanou innerHTML z EN[klíč]
// - prvky s data-i18n-a="atribut:klíč" dostanou atribut z EN[klíč] (alt, aria-label, content)
// - smyšlený ZF dashboard se překládá po textových uzlech přes DASH
// Jazyk určí inline skript v <head> (?lang= > localStorage > prohlížeč); tady se jen použije.
// Ostatní skripty čtou aktuální jazyk z <html lang> a poslouchají událost "langchange".
(() => {
  const EN = {
    // hlavička, úvod
    meta: "Fullstack engineer. I build web applications from the database to the interface and can build AI systems into them that work in production.",
    skip: "Skip to content",
    nav: "Main navigation",
    "nav.about": "About",
    "nav.projects": "Projects",
    "nav.exp": "Experience",
    "nav.contact": "Contact",
    "hero.lede":
      'Fullstack developer focused on <span class="acc">production&nbsp;AI</span>. I build applications from database design to UI and integrate well-tested agents into them.',
    "hero.mail": "Send an email",

    // 01 O mně
    "about.h": '<span class="sec__n mono">01</span>About me',
    "about.txt": `
      <p>I have more than 9&nbsp;years of experience developing production software in automotive R&amp;D – software that
        ran on <strong>100+ stations</strong>, where reliability came first. I built control and test software with
        dashboards used by dozens of other people. I'm at home across the whole stack, from database design through the
        backend to the user interface.</p>
      <p>I'm expanding my scope to <strong>production AI agents and RAG systems</strong> that I can test thoroughly: setting
        up evaluations and covering edge cases so they can be relied on in real-world operation.</p>
      <p>How I can help your team or project: I'll build a reliable backend and frontend, from database design all the way
        to the UI. I can safely integrate production AI agents into new and existing products, including evaluations that
        keep output quality in check.</p>
      <p>IT is about constant change, learning and finding the right path – and that's exactly what I enjoy about it.
        Building with AI is the new standard, and I actively base my everyday work on it. I'm a positive person and work
        best with people who enjoy what they do and aren't afraid to share know-how. I like moving things forward,
        learning from others and passing on what I've picked up along the way.</p>`,

    // 02 Projekty: BikeCheck
    "proj.h": '<span class="sec__n mono">02</span>Projects',
    "bc.kind": "Current project",
    "bc.since": "since 2026",
    "bc.lede":
      "Everything about your bike in one place. An app for cyclists: bikes, components and service history, bike setup, service report generation, and profile sharing – publicly or within the app. Rides from Strava are automatically counted toward component wear, based not only on distance but also on the route profile. The app keeps track of wear for you. It comes with 84 built-in service tasks, so logging a new service takes just a few clicks. It includes an <strong>AI assistant</strong> that knows the user's bikes, their components and service history, so it can give advice tailored to the exact setup.",
    "bc.list": `
      <li>Backend in NestJS (TypeScript), Prisma and PostgreSQL – REST API</li>
      <li>Desktop and mobile frontend in React, Android via Capacitor on Google Play, CI/CD with GitHub Actions</li>
      <li>Strava OAuth and webhooks microservice</li>
      <li>AI assistant with function calling over user data and RAG over service manuals</li>
      <li>In production with its first users</li>`,
    "bc.alt1": "bikecheck.cloud landing page: Everything about your bike in one place",
    "bc.alt2": "BikeCheck on a phone: bike detail with mileage, service and wear tracking",
    "bc.alt3": "BikeCheck on a phone: home dashboard with mileage and the latest ride",
    "bc.prev": '<span class="i i--imgs" aria-hidden="true"></span>App preview',

    // ZF
    "zf.h": "Dashboards and control software",
    "zf.lede":
      "Control and test software for brake components that ran on 100+ stations. It also included dashboards for test control, measurement data visualization, and internal calibration and analytics tools used daily by dozens of engineers. Among other things, they cut calibration time from days to hours and reliably processed gigabytes of measurement data every day.",
    "zf.list": `
      <li>Queues, parallel processing and deterministic measurement runs</li>
      <li>Real-time control software</li>
      <li>UI and backend for data analysis</li>
      <li>Measurement database and applications for viewing test progress</li>`,
    "zf.fig":
      "Illustration: three tilted windows with fictional dashboards – a production line station overview, a braking torque test chart and a sensor calibration",

    // Lufihome
    "lh.kind": "Personal project",
    "lh.since": "since 2023 · in use",
    "lh.h": 'Security system<span class="pr__sub">Lufihome</span>',
    "lh.lede":
      "Security and smart home for my house. The system runs on a <strong>Raspberry Pi</strong> and I control it from my phone: alarm, garage door, temperatures and the status of every sensor.",
    "lh.list": `
      <li>Zoned alarm with night mode and arming countdown</li>
      <li>PIR sensors, magnetic contacts and Tuya thermometers, real-time status via WebSockets</li>
      <li>Garage door control, temperature history and alarm log</li>`,
    "lh.alt1": "Lufihome: room temperatures and a list of sensors with their status",
    "lh.alt2": "Lufihome: arming the alarm with a countdown",
    "lh.alt3": "Lufihome: alarm armed, all zones secured",

    // 03 Praxe
    "exp.h": '<span class="sec__n mono">03</span>Experience',
    "exp.dkl.role": "Development",
    "exp.dkl": "First job: writing scripts for the CATIA CAD system.",
    "exp.prec": "Measurement automation, my first own tools in LabVIEW.",
    "exp.zf": "Backend and frontend tools for test control and measurement, data analysis and visualization.",
    "exp.bc.yr": "2025 – present",
    "exp.bc": "Fullstack and mobile development: designing and building a web and mobile app running in production with real users.",

    // 05 Mimo práci
    "hob.h": '<span class="sec__n mono">05</span>Outside work',
    "hob.bike.h": "Cycling",
    "hob.bike": "Enduro and gravel. I service my bikes myself – that's where the idea for BikeCheck came from.",
    "hob.alp.h": "Mountaineering",
    "hob.alp": "Mountains in summer and winter.",
    "hob.shop.h": "Workshop",
    "hob.shop": "I enjoy making things with my hands.",

    // 06 Kontakt, patička
    "ct.n": "06 · Contact",
    "ct.h": "Get in <span>touch.</span>",
    "ct.ask": "Have a project or an open role?",
    "ct.copy": "Copy",
    "foot.top": 'Back to top <span class="i i--up" aria-hidden="true"></span>',

    // galerie
    "gal.tabs": "App version",
    "gal.m": "Mobile",
    "gal.x": "Close gallery",
    "gal.prev": "Previous screen",
    "gal.next": "Next screen",
    "gal.strip": "Screen thumbnails",
  };

  // smyšlený dashboard ZF (dekorace, aria-hidden): přesné texty uzlů
  const DASH = {
    "Linka B2": "Line B2", Stanice: "Station", Aktivní: "Active", "Kusy / h": "Parts / h", Alarmy: "Alarms",
    běží: "running", stojí: "stopped", hotovo: "done", varování: "warning", chyba: "error",
    "Zkouška #48213": "Test #48213", "Brzdný moment · ST-07": "Braking torque · ST-07", Živě: "Live", Historie: "History",
    "Tlak [bar]": "Pressure [bar]", "Moment [Nm]": "Torque [Nm]",
    "START cyklus 1240": "START cycle 1240", "Tlak dosažen 85 bar": "Pressure reached 85 bar",
    "Teplota kanálu T3 61 °C": "Channel T3 temp 61 °C", "Moment v toleranci": "Torque within tolerance",
    "Statistika cyklu": "Cycle stats", "Max tlak": "Max pressure", "Max moment": "Max torque", Náběh: "Rise time", Cyklus: "Cycle",
    "Kalibrace · snímač tlaku PT-07": "Calibration · pressure sensor PT-07", "ref. etalon DPI-620": "ref. standard DPI-620",
    Připojení: "Connection", Nulování: "Zeroing", Body: "Points", Protokol: "Report",
    Bod: "Point", Naměřeno: "Measured", Odchylka: "Deviation", Stav: "Status", "měří…": "measuring…",
    Linearita: "Linearity", "max odch. 0.04 %": "max dev. 0.04 %", Přerušit: "Abort", "Další bod →": "Next point →",
  };

  const root = document.documentElement;
  const html = [...document.querySelectorAll("[data-i18n]")].map((el) => ({ el, k: el.dataset.i18n, cs: el.innerHTML }));
  const attrs = [...document.querySelectorAll("[data-i18n-a]")].map((el) => {
    const [a, k] = el.dataset.i18nA.split(":");
    return { el, a, k, cs: el.getAttribute(a) };
  });
  const texts = [];
  const scene = document.querySelector(".pr__scene--dash");
  if (scene) {
    const w = document.createTreeWalker(scene, NodeFilter.SHOW_TEXT);
    for (let n; (n = w.nextNode()); ) {
      const t = n.nodeValue.trim();
      if (DASH[t]) texts.push({ n, cs: n.nodeValue, en: n.nodeValue.replace(t, DASH[t]) });
    }
  }
  [...html, ...attrs].forEach(({ k }) => { if (!(k in EN)) console.warn("i18n: chybí EN klíč", k); });

  const btns = document.querySelectorAll("[data-lang]");

  const apply = (lang, save) => {
    const en = lang === "en";
    html.forEach((x) => { x.el.innerHTML = en ? EN[x.k] ?? x.cs : x.cs; });
    attrs.forEach((x) => x.el.setAttribute(x.a, en ? EN[x.k] ?? x.cs : x.cs));
    texts.forEach((x) => { x.n.nodeValue = en ? x.en : x.cs; });
    root.lang = lang;
    btns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
    if (save) {
      try { localStorage.setItem("lang", lang); } catch (e) {}
      // adresa se dá poslat dál: ?lang=en otevře rovnou angličtinu
      const u = new URL(location.href);
      if (en) u.searchParams.set("lang", "en"); else u.searchParams.delete("lang");
      history.replaceState(null, "", u);
    }
    root.classList.remove("i18n-wait");
    dispatchEvent(new CustomEvent("langchange", { detail: lang }));
  };

  btns.forEach((b) => b.addEventListener("click", () => { if (root.lang !== b.dataset.lang) apply(b.dataset.lang, true); }));
  apply(root.lang === "en" ? "en" : "cs", false);
})();
