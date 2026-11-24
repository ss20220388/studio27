// Korpa (localStorage "cart_items") pamti cenu iz trenutka dodavanja kursa.
// Pre plaćanja se cene osvežavaju sa servera, jer je popust u međuvremenu mogao da počne ili istekne.
// Vraća osveženu korpu; ako server ne odgovori, vraća korpu kakva jeste.
export async function osveziCeneKorpe(API_URL, korpa) {
  if (!Array.isArray(korpa) || korpa.length === 0) return korpa;
  try {
    const res = await fetch(`${API_URL}/api/cene-korpe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(korpa.map((s) => ({ kursId: s.id || s.kursId, paketId: s.paketId || null }))),
    });
    if (!res.ok) return korpa;
    const cene = await res.json();
    let promenjeno = false;
    const nova = korpa.map((s) => {
      const c = cene.find((c) => String(c.kursId) === String(s.id || s.kursId));
      if (!c || Number(c.cena) === Number(s.price || s.cena)) return s;
      promenjeno = true;
      // stara cena (za precrtan prikaz) ostaje samo ako je nova i dalje niža
      const oldPrice = Number(s.oldPrice) > Number(c.cena) ? s.oldPrice : undefined;
      return { ...s, price: c.cena, cena: c.cena, oldPrice };
    });
    if (promenjeno) localStorage.setItem("cart_items", JSON.stringify(nova));
    return nova;
  } catch {
    return korpa;
  }
}
