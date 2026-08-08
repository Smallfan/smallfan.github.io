'use strict';

const { stripHTML, unescapeHTML } = require('hexo-util');

function toPlainText(value) {
  return unescapeHTML(stripHTML(String(value || '')))
    .replace(/\s+/g, ' ')
    .trim();
}

function collectionNames(collection) {
  if (!collection || typeof collection.toArray !== 'function') return [];
  return collection.toArray().map(item => toPlainText(item.name)).filter(Boolean);
}

function dateInfo(value) {
  if (!value) return { iso: '', text: '' };

  if (typeof value.toISO === 'function' && typeof value.toFormat === 'function') {
    return {
      iso: value.toISO(),
      text: value.toFormat('yyyy 年 M 月 d 日')
    };
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return { iso: '', text: '' };

  return {
    iso: parsed.toISOString(),
    text: new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(parsed)
  };
}

hexo.extend.generator.register('oyster-search-index', function (locals) {
  const config = (hexo.theme && hexo.theme.config && hexo.theme.config.search) || {};
  if (config.enabled === false) return [];

  const root = String(hexo.config.root || '/').replace(/\/?$/, '/');
  const outputPath = String(config.index || '/search.json').replace(/^\/+/, '');
  const posts = locals.posts.sort('-date').map(post => {
    const content = toPlainText(post.content);
    const excerpt = toPlainText(post.excerpt) || content.slice(0, 280);
    const categories = collectionNames(post.categories);
    const tags = collectionNames(post.tags);
    const published = dateInfo(post.date);

    return {
      title: toPlainText(post.title),
      titleZh: toPlainText(post.title),
      url: root + String(post.path || '').replace(/^\/+/, ''),
      date: published.iso,
      dateText: published.text,
      excerpt,
      excerptZh: excerpt,
      content,
      contentZh: content,
      taxonomy: categories.concat(tags).join(' '),
      taxonomyZh: categories.concat(tags).join(' ')
    };
  });

  return {
    path: outputPath,
    data: JSON.stringify({ posts })
  };
});
