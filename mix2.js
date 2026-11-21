// mix2: postupné objevování nových bloků (karty projektů, osa praxe, stack, koníčky).
// Bez JS nebo s omezeným pohybem je vše rovnou vidět.
(() => {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const els = [...document.querySelectorAll(".m2-rv")];
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.classList.add("in");
    io.unobserve(e.target);
  }), { rootMargin: "0px 0px -6% 0px" });
  els.forEach((el) => {
    // sourozenci v jedné řadě nastupují postupně
    const i = [...el.parentElement.children].filter((c) => c.classList.contains("m2-rv")).indexOf(el);
    el.style.setProperty("--d", i * 0.08 + "s");
    el.classList.add("rv");
    io.observe(el);
  });
})();
