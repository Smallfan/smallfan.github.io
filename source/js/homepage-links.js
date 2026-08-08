(function () {
  'use strict';

  var pathname = window.location.pathname;
  var isHomepage = pathname === '/' || pathname === '/index.html';
  if (!isHomepage) return;

  function isArticleNavigation(link) {
    return Boolean(
      link.closest('.post-summary') &&
      (link.closest('.entry-title') || link.classList.contains('more-link'))
    );
  }

  function shouldStayInCurrentTab(link, href) {
    return href.startsWith('#') ||
      href.startsWith('mailto:') ||
      href.startsWith('tel:') ||
      href.startsWith('javascript:') ||
      Boolean(link.closest('.site-title')) ||
      Boolean(link.closest('.paging-navigation')) ||
      isArticleNavigation(link);
  }

  function removeNewTabBehavior(link) {
    link.removeAttribute('target');

    var rel = (link.getAttribute('rel') || '')
      .split(/\s+/)
      .filter(function (value) {
        return value && value !== 'noopener' && value !== 'noreferrer';
      });

    if (rel.length) link.setAttribute('rel', rel.join(' '));
    else link.removeAttribute('rel');
  }

  function processLink(link) {
    var href = link.getAttribute('href');
    if (!href) return;

    if (shouldStayInCurrentTab(link, href)) {
      removeNewTabBehavior(link);
      return;
    }

    link.setAttribute('target', '_blank');
    var rel = new Set((link.getAttribute('rel') || '').split(/\s+/).filter(Boolean));
    rel.add('noopener');
    rel.add('noreferrer');
    link.setAttribute('rel', Array.from(rel).join(' '));
  }

  function processLinks(root) {
    if (root.matches && root.matches('a[href]')) processLink(root);
    if (root.querySelectorAll) root.querySelectorAll('a[href]').forEach(processLink);
  }

  function initialize() {
    processLinks(document);

    new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        mutation.addedNodes.forEach(function (node) {
          if (node.nodeType === Node.ELEMENT_NODE) processLinks(node);
        });
      });
    }).observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize, { once: true });
  } else {
    initialize();
  }
})();
