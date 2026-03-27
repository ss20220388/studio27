
$content = Get-Content -Raw client\src\components\Header2.astro
$oldUl = 'class="flex-col md:flex-row px-4 md:py-2 items-center justify-between text-base absolute md:static left-0 top-full w-full md:w-auto bg-neutral-900/95 backdrop-blur-xl md:bg-transparent border-neutral-800 md:border-none shadow-2xl md:shadow-none z-40 transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] max-h-0 md:max-h-none opacity-0 md:opacity-100 pointer-events-none md:pointer-events-auto origin-top overflow-hidden md:overflow-visible gap-1 md:gap-0 flex"'
$newUl = 'class="flex-col md:flex-row py-2 px-4 items-center justify-between text-base absolute md:static left-0 top-full w-full md:w-auto bg-neutral-900/95 backdrop-blur-md md:bg-transparent border-b border-neutral-800 md:border-none z-40 hidden md:flex shadow-xl md:shadow-none"'
$content = $content.Replace($oldUl, $newUl)

$newScript = @"
  <script>
    if (typeof window !== "undefined") {
      const btn = document.getElementById("mobile-menu-btn");
      const nav = document.getElementById("main-nav");

      if (btn && nav) {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          nav.classList.toggle("hidden");
        });

        nav.addEventListener("click", () => {
          if (window.innerWidth < 768) {
            nav.classList.add("hidden");
          }
        });

        document.addEventListener("click", (e) => {
          try {
            const target = e.target as Node;
            if (window.innerWidth < 768 && !nav.contains(target) && !btn.contains(target)) {
              nav.classList.add("hidden");
            }
          } catch (err) {}
        });
      }
    }
  </script>
"@
$content = $content -replace "(?s)<script>.*?</script>", $newScript
Set-Content client\src\components\Header2.astro -Value $content

