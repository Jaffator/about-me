// Bento: dlaždice najíždějí po řadě, jak se dostávají do obrazu. Jednou.
(() => {
  const grid = document.querySelector(".bento");
  if (!grid || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const tiles = [...grid.querySelectorAll(".tile")];
  grid.classList.add("js");
  const io = new IntersectionObserver((entries) => {
    // dlaždice, které se objeví zároveň (jedna řada), dostanou malé zpoždění podle pořadí
    entries.filter((e) => e.isIntersecting).forEach((e, i) => {
      e.target.style.setProperty("--d", (i * 0.08).toFixed(2) + "s");
      e.target.classList.add("in");
      io.unobserve(e.target);
    });
  }, { rootMargin: "0px 0px -8% 0px" });
  tiles.forEach((t) => io.observe(t));
})();
