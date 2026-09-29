// Choosing a layout never changes refresh state or saved pages.
(() => {
  const classic = location.pathname.includes('/classic/');
  const preferred = localStorage.getItem('popupDesign') || 'editorial';
  if ((preferred === 'classic') !== classic) {
    location.replace(chrome.runtime.getURL(preferred === 'classic' ? 'classic/popup.html' : 'editorial.html'));
  }
  document.addEventListener('click', event => {
    if (event.target.closest('[data-reload-extension]')) {
      chrome.runtime.reload();
      return;
    }
    const link = event.target.closest('[data-design]');
    if (link) localStorage.setItem('popupDesign', link.dataset.design);
  });
})();
