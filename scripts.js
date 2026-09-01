document.addEventListener("DOMContentLoaded", async () => {
  const loadFragment = async (id, url) => { const container = document.getElementById(id); if (!container) return; const response = await fetch(url); if (!response.ok) throw new Error(`Erro ao carregar ${url}`); container.innerHTML = await response.text(); };
  try {
    await loadFragment("header", "/components/header.html");
    const current = window.location.pathname.replace(/\/$/, "") || "/";
    document.querySelectorAll(".site-header a[href]").forEach((link) => { const target = new URL(link.href).pathname.replace(/\/$/, "") || "/"; if (target === current) { link.classList.add("active"); link.setAttribute("aria-current", "page"); } });
    const button = document.getElementById("menu-btn"); const menu = document.getElementById("mobile-menu");
    button?.addEventListener("click", () => { const open = menu.classList.toggle("menu-open"); button.classList.toggle("open", open); button.setAttribute("aria-expanded", String(open)); button.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu"); });
  } catch (error) { console.error(error); }
  try { await loadFragment("footer", "/components/footer.html"); } catch (error) { console.error(error); }
  if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const observer = new IntersectionObserver((entries) => entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add("fade-in"); observer.unobserve(entry.target); } }), { threshold:.08, rootMargin:"0px 0px -30px" });
  document.querySelectorAll(".fade-in").forEach((item) => observer.observe(item));
});
