// Choosing a layout never changes refresh state or saved pages.
(() => {
  function applyFinish() {
    const previous = localStorage.getItem('popupFinish') === 'previous';
    const sheet = document.getElementById('popupStyle');
    if (sheet) sheet.href = previous ? 'editorial-previous.css' : 'editorial.css?v=metallic-coral-2';
    const button = document.getElementById('toggleFinish');
    if (button) button.textContent = previous ? 'Metallic style' : 'Previous style';
  }
  applyFinish();
  document.addEventListener('DOMContentLoaded', applyFinish);
  const classic = location.pathname.includes('/classic/');
  const preferred = localStorage.getItem('popupDesign') || 'editorial';
  if ((preferred === 'classic') !== classic) {
    location.replace(chrome.runtime.getURL(preferred === 'classic' ? 'classic/popup.html' : 'editorial.html'));
  }
  document.addEventListener('click', event => {
    if (event.target.closest('#toggleFinish')) {
      localStorage.setItem('popupFinish', localStorage.getItem('popupFinish') === 'previous' ? 'metallic' : 'previous');
      applyFinish();
      return;
    }
    if (event.target.closest('[data-reload-extension]')) {
      chrome.runtime.reload();
      return;
    }
    const link = event.target.closest('[data-design]');
    if (link) localStorage.setItem('popupDesign', link.dataset.design);
  });
})();
