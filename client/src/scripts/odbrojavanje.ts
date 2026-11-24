// Odbrojavanje do kraja popusta (data-do = ms); posle isteka traka nestaje
const dvocifreno = (n: number) => String(n).padStart(2, "0");
function osvezi() {
  document.querySelectorAll<HTMLElement>("[data-popust-traka]").forEach((traka) => {
    const kraj = Number(traka.dataset.do);
    if (!kraj) return;
    const ostalo = kraj - Date.now();
    if (ostalo <= 0) {
      traka.hidden = true;
      return;
    }
    const s = Math.floor(ostalo / 1000);
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sek = s % 60;
    const vrednosti: Record<string, string> = { d: String(d), h: dvocifreno(h), m: dvocifreno(m), s: dvocifreno(sek) };
    traka.querySelectorAll<HTMLElement>("[data-jedinica]").forEach((el) => {
      el.textContent = vrednosti[el.dataset.jedinica || ""] ?? "";
    });
    traka.querySelectorAll<HTMLElement>("[data-odbrojavanje]").forEach((el) => {
      el.textContent = `${d > 0 ? `${d}d ` : ""}${dvocifreno(h)}:${dvocifreno(m)}:${dvocifreno(sek)}`;
    });
  });
}
osvezi();
setInterval(osvezi, 1000);
