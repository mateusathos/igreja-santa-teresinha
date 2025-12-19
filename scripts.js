document.addEventListener("DOMContentLoaded", () => {
  // === Carregar header ===
  const headerContainer = document.getElementById("header");
  if (headerContainer) {
    fetch("components/header.html")
      .then(response => response.text())
      .then(data => {
        headerContainer.innerHTML = data;

        // === Destacar página ativa ===
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        const menuLinks = document.querySelectorAll('header a[href]');
        
        menuLinks.forEach(link => {
          const href = link.getAttribute('href');
          if (href === currentPage || (currentPage === '' && href === 'index.html')) {
            link.classList.add('active');
          }
        });

        // === Menu Mobile (só roda depois que o header é carregado) ===
        const btn = document.getElementById("menu-btn");
        const menu = document.getElementById("mobile-menu");

        if (btn && menu) {
          btn.addEventListener("click", () => {
            menu.classList.toggle("menu-open");
            btn.classList.toggle("open");
          });
        }
      })
      .catch(error => console.error("Erro ao carregar o header:", error));
  }

  // === Carregar footer ===
  const footerContainer = document.getElementById("footer");
  if (footerContainer) {
    fetch("components/footer.html")
      .then(response => response.text())
      .then(data => {
        footerContainer.innerHTML = data;
      })
      .catch(error => console.error("Erro ao carregar o footer:", error));
  }

  // === Troca de Imagens da Home ===
  const imagens_homepage = [
    "imgs/santa-teresinha-2.jpg",
    "imgs/igreja.jpeg"
  ];

  let index = 1;
  const img_homepage = document.getElementById("home-page");

  function trocarImagem() {
    if (!img_homepage) return;

    img_homepage.classList.add("fade-hidden");

    setTimeout(() => {
      index = (index + 1) % imagens_homepage.length;
      img_homepage.src = imagens_homepage[index];

      img_homepage.classList.remove("fade-hidden");
    }, 600);
  }

  setInterval(trocarImagem, 6000);

  // === Animações de fade-in ao scroll ===
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('fade-in');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Observar elementos com classe fade-in
  document.querySelectorAll('.fade-in').forEach(el => {
    observer.observe(el);
  });

  // Observar cards e imagens
  document.querySelectorAll('#cards > div, .image-card, #avisos > div').forEach(el => {
    observer.observe(el);
  });
});