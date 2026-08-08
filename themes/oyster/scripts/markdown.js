/* global hexo */

'use strict';

const markedFootnote = require('marked-footnote');

hexo.extend.filter.register('marked:use', use => {
  use(markedFootnote({
    description: '脚注',
    refMarkers: true,
    backRefLabel: '返回脚注引用 {0}'
  }));
});
