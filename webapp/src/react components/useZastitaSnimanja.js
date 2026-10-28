import { useCallback, useEffect, useRef, useState } from "react";

// Zaštita videa od snimanja ekrana. Pregledač ne javlja da neko snima ekran, pa se
// hvata ponašanje oko snimanja: gubitak fokusa (Snipping Tool, Cmd+Shift+5, prelazak
// u snimač), prečice za snimanje, PrintScreen i otvoren DevTools.
// Video se tada pauzira i zatamni dok korisnik ne klikne "Nastavi gledanje".

const PORUKE = {
  fokus: "Video je pauziran jer je prozor izgubio fokus.",
  precica: "Snimanje i slikanje ekrana nije dozvoljeno.",
  printscreen: "Slikanje ekrana nije dozvoljeno.",
  devtools: "Zatvorite alatke za programere (DevTools) da biste nastavili gledanje.",
};

// disable-devtool je globalan (jedan po stranici), pa se pokreće jednom, a plejer
// koji je trenutno prikazan prima njegove događaje preko ovog slušaoca
let devtoolsSlusalac = null;
let devtoolsOtvoren = false;
let devtoolsPokrenut = null;

function pokreniDevtools() {
  if (!devtoolsPokrenut) {
    devtoolsPokrenut = import("disable-devtool").then(({ default: DisableDevtool }) => {
      DisableDevtool({
        disableMenu: true,
        // podrazumevano šalje na sajt autora biblioteke
        timeOutUrl: window.location.origin,
        ondevtoolopen: () => {
          devtoolsOtvoren = true;
          devtoolsSlusalac?.(true);
        },
        ondevtoolclose: () => {
          devtoolsOtvoren = false;
          devtoolsSlusalac?.(false);
        },
      });
      return DisableDevtool;
    });
  }
  return devtoolsPokrenut;
}

export default function useZastitaSnimanja(videoRef) {
  const [razlog, setRazlog] = useState(null);
  const razlogRef = useRef(null);

  const zakljucaj = useCallback(
    (novi) => {
      const video = videoRef.current;
      if (video && !video.paused) video.pause();
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      if (document.pictureInPictureElement) document.exitPictureInPicture().catch(() => {});
      // devtools poruka ima prednost jer se ne može samo kliknuti dalje
      if (razlogRef.current === "devtools" && novi !== "devtools") return;
      razlogRef.current = novi;
      setRazlog(novi);
    },
    [videoRef]
  );

  const otkljucaj = useCallback(() => {
    if (devtoolsOtvoren) return zakljucaj("devtools");
    razlogRef.current = null;
    setRazlog(null);
    videoRef.current?.play().catch(() => {});
  }, [videoRef, zakljucaj]);

  useEffect(() => {
    const naBlur = () => zakljucaj("fokus");
    const naVidljivost = () => {
      if (document.visibilityState === "hidden") zakljucaj("fokus");
    };
    const naTaster = (e) => {
      // Win+Shift+S, Win+Alt+R (Game Bar), Cmd+Shift+3/4/5
      if (e.metaKey && (e.shiftKey || e.altKey)) zakljucaj("precica");
    };
    const naPrintScreen = (e) => {
      if (e.key !== "PrintScreen") return;
      zakljucaj("printscreen");
      navigator.clipboard?.writeText("").catch(() => {});
    };

    window.addEventListener("blur", naBlur);
    document.addEventListener("visibilitychange", naVidljivost);
    window.addEventListener("keydown", naTaster, true);
    window.addEventListener("keyup", naPrintScreen, true);

    devtoolsSlusalac = (otvoren) => {
      if (otvoren) zakljucaj("devtools");
      else if (razlogRef.current === "devtools") {
        razlogRef.current = "fokus";
        setRazlog("fokus");
      }
    };
    pokreniDevtools().then((d) => (d.isSuspend = false));
    if (devtoolsOtvoren) zakljucaj("devtools");

    return () => {
      window.removeEventListener("blur", naBlur);
      document.removeEventListener("visibilitychange", naVidljivost);
      window.removeEventListener("keydown", naTaster, true);
      window.removeEventListener("keyup", naPrintScreen, true);
      devtoolsSlusalac = null;
      pokreniDevtools().then((d) => (d.isSuspend = true));
    };
  }, [zakljucaj]);

  return { razlog, poruka: razlog && PORUKE[razlog], otkljucaj };
}
