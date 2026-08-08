(function () {
  'use strict';

  var page = document.querySelector('[data-search-page]');
  if (!page) return;

  var form = page.querySelector('.search-page-form');
  var input = page.querySelector('[data-search-input]');
  var heading = page.querySelector('[data-search-heading]');
  var status = page.querySelector('[data-search-status]');
  var results = page.querySelector('[data-search-results]');
  var query = (new URLSearchParams(window.location.search).get('q') || '').trim();
  var indexUrl = page.dataset.searchIndex;

  function normalize(value) {
    return String(value || '').toLocaleLowerCase('en-US');
  }

  function countOccurrences(source, term) {
    var count = 0;
    var offset = 0;

    while ((offset = source.indexOf(term, offset)) !== -1) {
      count += 1;
      offset += Math.max(term.length, 1);
    }

    return count;
  }

  function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function appendHighlightedText(target, text, terms) {
    var pattern = terms.slice().sort(function (a, b) {
      return b.length - a.length;
    }).map(escapeRegExp).join('|');

    if (!pattern) {
      target.textContent = text;
      return;
    }

    var matcher = new RegExp(pattern, 'gi');
    var cursor = 0;
    var match;

    while ((match = matcher.exec(text)) !== null) {
      target.appendChild(document.createTextNode(text.slice(cursor, match.index)));
      var mark = document.createElement('mark');
      mark.textContent = match[0];
      target.appendChild(mark);
      cursor = match.index + match[0].length;
    }

    target.appendChild(document.createTextNode(text.slice(cursor)));
  }

  function makeSnippet(item, terms) {
    var source = item.content || item.excerpt || '';
    var normalized = normalize(source);
    var firstMatch = -1;

    terms.forEach(function (term) {
      var position = normalized.indexOf(term);
      if (position !== -1 && (firstMatch === -1 || position < firstMatch)) firstMatch = position;
    });

    var start = Math.max(0, firstMatch === -1 ? 0 : firstMatch - 70);
    var end = Math.min(source.length, start + 240);
    return (start > 0 ? '…' : '') + source.slice(start, end).trim() + (end < source.length ? '…' : '');
  }

  function rankPost(item, terms) {
    var title = normalize(item.title);
    var taxonomy = normalize(item.taxonomy);
    var content = normalize(item.content);
    var chinese = normalize([
      item.titleZh,
      item.taxonomyZh,
      item.contentZh
    ].join('\n'));
    var haystack = title + '\n' + taxonomy + '\n' + content + '\n' + chinese;

    if (!terms.every(function (term) { return haystack.includes(term); })) return null;

    var score = 0;
    terms.forEach(function (term) {
      score += countOccurrences(title, term) * 24;
      score += countOccurrences(taxonomy, term) * 8;
      score += Math.min(countOccurrences(content, term), 12);
      if (title.startsWith(term)) score += 12;
    });

    return { item: item, score: score };
  }

  function createResult(item, terms) {
    var article = document.createElement('article');
    article.className = 'hentry post-summary search-result';

    var header = document.createElement('header');
    header.className = 'entry-header';

    var title = document.createElement('h2');
    title.className = 'entry-title';
    var link = document.createElement('a');
    link.href = item.url;
    appendHighlightedText(link, item.title, terms);
    title.appendChild(link);
    header.appendChild(title);

    if (item.dateText) {
      var meta = document.createElement('div');
      meta.className = 'entry-meta';
      var postedOn = document.createElement('span');
      postedOn.className = 'posted-on';
      var time = document.createElement('time');
      if (item.date) time.dateTime = item.date;
      time.textContent = item.dateText;
      postedOn.appendChild(time);
      meta.appendChild(postedOn);
      header.appendChild(meta);
    }

    var content = document.createElement('div');
    content.className = 'entry-content';
    var paragraph = document.createElement('p');
    appendHighlightedText(paragraph, makeSnippet(item, terms), terms);
    content.appendChild(paragraph);

    article.appendChild(header);
    article.appendChild(content);
    return article;
  }

  function setHeading(value) {
    heading.textContent = '';
    if (!value) {
      heading.textContent = 'Search';
      return;
    }

    var keyword = document.createElement('span');
    keyword.textContent = value;
    heading.appendChild(keyword);
    heading.appendChild(document.createTextNode(' — Search results'));
    document.title = 'Search results for ' + value + ' | ' + page.dataset.siteTitle;
  }

  form.addEventListener('submit', function (event) {
    if (!input.value.trim()) {
      event.preventDefault();
      status.textContent = 'Enter at least one search term.';
      input.focus();
    }
  });

  input.value = query;
  setHeading(query);

  if (!query) {
    input.focus();
    return;
  }

  status.textContent = 'Searching…';
  var terms = normalize(query).split(/\s+/).filter(Boolean);

  fetch(indexUrl, { headers: { Accept: 'application/json' } })
    .then(function (response) {
      if (!response.ok) throw new Error('Search index request failed');
      return response.json();
    })
    .then(function (payload) {
      var matches = (payload.posts || []).map(function (item) {
        return rankPost(item, terms);
      }).filter(Boolean).sort(function (a, b) {
        if (b.score !== a.score) return b.score - a.score;
        return String(b.item.date || '').localeCompare(String(a.item.date || ''));
      });

      results.textContent = '';

      if (!matches.length) {
        status.textContent = 'No matching articles found.';
        var empty = document.createElement('p');
        empty.className = 'search-empty';
        empty.textContent = 'Try a shorter or different search term.';
        results.appendChild(empty);
        return;
      }

      status.textContent = matches.length + (matches.length === 1 ? ' article found.' : ' articles found.');
      matches.forEach(function (match) {
        results.appendChild(createResult(match.item, terms));
      });
    })
    .catch(function () {
      results.textContent = '';
      status.textContent = 'The search index could not be loaded. Please try again later.';
    });
})();
