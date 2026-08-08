(function () {
  'use strict';

  var switcher = document.querySelector('[data-language-switch]');
  if (!switcher) return;

  var storageKey = 'oyster-language';
  var html = document.documentElement;
  var buttons = Array.from(switcher.querySelectorAll('[data-language-option]'));

  function storedLanguage() {
    try {
      return window.localStorage.getItem(storageKey) === 'zh' ? 'zh' : 'en';
    } catch (error) {
      return 'en';
    }
  }

  function saveLanguage(language) {
    try {
      window.localStorage.setItem(storageKey, language);
    } catch (error) {
      // The language switch remains usable when storage is unavailable.
    }
  }

  function applyLanguage(language, persist) {
    var activeLanguage = language === 'zh' ? 'zh' : 'en';

    document.querySelectorAll('[data-language-content]').forEach(function (element) {
      element.hidden = element.dataset.languageContent !== activeLanguage;
    });

    buttons.forEach(function (button) {
      var isActive = button.dataset.languageOption === activeLanguage;
      button.setAttribute('aria-pressed', String(isActive));
      button.classList.toggle('is-active', isActive);
    });

    html.lang = activeLanguage === 'zh' ? 'zh-CN' : 'en';
    html.dataset.activeLanguage = activeLanguage;

    var pageTitle = html.getAttribute('data-title-' + activeLanguage);
    if (pageTitle) document.title = pageTitle;
    if (persist) saveLanguage(activeLanguage);
  }

  buttons.forEach(function (button) {
    button.addEventListener('click', function () {
      applyLanguage(button.dataset.languageOption, true);
    });
  });

  applyLanguage(storedLanguage(), false);
})();
