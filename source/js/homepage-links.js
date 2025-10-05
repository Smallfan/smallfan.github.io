// Homepage Links - Open all links in new tab
console.log('[Homepage Links] Script file loaded!');

(function() {
  'use strict';

  console.log('[Homepage Links] IIFE started');

  // Debug: Log current path
  console.log('[Homepage Links] Current pathname:', window.location.pathname);
  console.log('[Homepage Links] Current href:', window.location.href);

  // Only run on homepage - check multiple possible paths
  const pathname = window.location.pathname;
  const isHomepage = pathname === '/' ||
                     pathname === '/index.html' ||
                     pathname.endsWith('/') && pathname.split('/').filter(Boolean).length === 0;

  console.log('[Homepage Links] Is homepage:', isHomepage);

  if (!isHomepage) {
    console.log('[Homepage Links] Not on homepage, script will not run');
    return;
  }

  console.log('[Homepage Links] Script initialized on homepage');

  // Function to process a single link
  const processLink = (link) => {
    const href = link.getAttribute('href');

    // Skip if no href
    if (!href) return false;

    // Skip anchor links (same page navigation)
    if (href.startsWith('#')) return false;

    // Skip mailto and tel links
    if (href.startsWith('mailto:') || href.startsWith('tel:')) return false;

    // Skip javascript: links
    if (href.startsWith('javascript:')) return false;

    // Skip site title/logo links (keep on same tab)
    if (link.classList.contains('nav-site-title')) return false;
    if (link.classList.contains('site-name')) return false;
    if (link.closest('.nav-site-title')) return false;

    // Check if already processed
    if (link.getAttribute('data-new-tab-processed')) return false;

    // Set target="_blank" and add rel for security
    link.setAttribute('target', '_blank');

    // Add rel="noopener noreferrer" for security
    const currentRel = link.getAttribute('rel') || '';
    if (!currentRel.includes('noopener')) {
      link.setAttribute('rel', currentRel ? `${currentRel} noopener noreferrer` : 'noopener noreferrer');
    }

    // Mark as processed
    link.setAttribute('data-new-tab-processed', 'true');

    return true;
  };

  // Function to set target="_blank" for all links
  const setLinksToNewTab = () => {
    const links = document.querySelectorAll('a');
    let count = 0;

    links.forEach(link => {
      if (processLink(link)) {
        count++;
      }
    });

    console.log(`Processed ${count} links to open in new tab`);
    return count;
  };

  // Run multiple times to catch all links
  const runSetLinks = () => {
    setLinksToNewTab();

    // Run again after a short delay to catch any late-loading content
    setTimeout(setLinksToNewTab, 100);
    setTimeout(setLinksToNewTab, 500);
    setTimeout(setLinksToNewTab, 1000);
  };

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runSetLinks);
  } else {
    runSetLinks();
  }

  // Also run on window load (after all resources)
  window.addEventListener('load', setLinksToNewTab);

  // Use MutationObserver to watch for new links
  const observer = new MutationObserver((mutations) => {
    let hasNewLinks = false;

    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === 1) { // Element node
          if (node.tagName === 'A') {
            if (processLink(node)) {
              hasNewLinks = true;
            }
          }
          // Check child links
          const childLinks = node.querySelectorAll && node.querySelectorAll('a');
          if (childLinks && childLinks.length > 0) {
            childLinks.forEach(link => {
              if (processLink(link)) {
                hasNewLinks = true;
              }
            });
          }
        }
      });
    });

    if (hasNewLinks) {
      console.log('Processed newly added links');
    }
  });

  // Start observing
  const startObserver = () => {
    if (document.body) {
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      console.log('MutationObserver started');
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startObserver);
  } else {
    startObserver();
  }

  // Also intercept click events as a fallback
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (link) {
      const href = link.getAttribute('href');
      // Only process if it's a valid link and not already processed
      if (href && !href.startsWith('#') && !href.startsWith('mailto:') && !href.startsWith('tel:') && !href.startsWith('javascript:')) {
        if (!link.getAttribute('target')) {
          link.setAttribute('target', '_blank');
          link.setAttribute('rel', 'noopener noreferrer');
          console.log('Intercepted click, set target to _blank:', href);
        }
      }
    }
  }, true); // Use capture phase to catch it early
})();
