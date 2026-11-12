(() => {
  const nav = [
    { href: '/', label: 'Главная' },
    { href: '/o-platforme/', label: 'О платформе' },
    { href: '/magaziny/', label: 'Магазины' },
    { href: '/instruktsiya/', label: 'Инструкция' }
  ];
  const path = location.pathname.replace(/\/?$/, '/');
  const header = document.getElementById('site-header');
  const footer = document.getElementById('site-footer');

  if (header) {
    header.innerHTML = `
      <header class="site-header">
        <div class="container header-inner">
          <a class="brand" href="/" aria-label="Главная">
            <span class="brand-mark">B</span><span>ИНФО<span class="brand-accent">ПОРТАЛ</span></span>
          </a>
          <button class="menu-toggle" type="button" aria-label="Открыть меню" aria-expanded="false">☰</button>
          <nav class="main-nav" aria-label="Основная навигация">
            ${nav.map(item => `<a href="${item.href}"${path === item.href ? ' class="active" aria-current="page"' : ''}>${item.label}</a>`).join('')}
          </nav>
        </div>
      </header>`;
    const toggle = header.querySelector('.menu-toggle');
    const menu = header.querySelector('.main-nav');
    toggle?.addEventListener('click', () => {
      const opened = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!opened));
      menu.classList.toggle('is-open', !opened);
    });
  }

  if (footer) {
    footer.innerHTML = `
      <footer class="site-footer">
        <div class="container footer-inner">
          <div>
            <a class="brand footer-brand" href="/"><span class="brand-mark">B</span><span>ИНФО<span class="brand-accent">ПОРТАЛ</span></span></a>
            <p class="footer-note">Независимый информационный материал о цифровой безопасности и рисках даркнета.</p>
          </div>
          <nav class="footer-links" aria-label="Дополнительная навигация">
            <a href="/o-platforme/">О проекте</a><a href="/magaziny/">Категории и риски</a><a href="/instruktsiya/">Безопасность Tor</a>
          </nav>
          <p class="copyright">© ${new Date().getFullYear()} Информационный портал. Не связан с торговыми площадками.</p>
        </div>
      </footer>`;
  }
})();