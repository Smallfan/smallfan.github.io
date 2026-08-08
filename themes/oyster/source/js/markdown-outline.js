(function () {
  'use strict';

  var headingPattern = /^H([1-6])$/;

  document.querySelectorAll('.entry-content').forEach(function (content) {
    if (content.dataset.markdownOutlined === 'true') return;

    var nodes = Array.from(content.childNodes);
    var bodyGroup = null;
    var depth = 0;

    nodes.forEach(function (node) {
      var headingMatch = node.nodeType === Node.ELEMENT_NODE
        ? node.tagName.match(headingPattern)
        : null;

      if (headingMatch) {
        depth = Math.min(Number(headingMatch[1]), 3);
        node.dataset.markdownDepth = String(depth);
        bodyGroup = null;
        return;
      }

      if (depth === 0) return;

      if (!bodyGroup) {
        bodyGroup = document.createElement('div');
        bodyGroup.className = 'markdown-section-body';
        bodyGroup.dataset.depth = String(depth);
        content.insertBefore(bodyGroup, node);
      }

      bodyGroup.appendChild(node);
    });

    content.dataset.markdownOutlined = 'true';
  });
})();
