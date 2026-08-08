#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, '..');
const publicDirectory = path.join(projectRoot, 'public');
const configPath = path.join(projectRoot, 'translation.config.json');
const cacheDirectory = path.resolve(
  projectRoot,
  process.env.OYSTER_TRANSLATION_CACHE_DIR || path.join('.cache', 'oyster-translations')
);
const cachePath = path.join(cacheDirectory, 'en.json');
const promptVersion = 'oyster-technical-translation-2026-08-09-v4';
const cjkPattern = /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/;
const blockSelector = [
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'p',
  'li',
  'dt',
  'dd',
  'th',
  'td',
  'figcaption',
  'summary'
].join(',');
const excludedSelector = [
  'script',
  'style',
  'svg',
  'pre',
  'code',
  '.highlight',
  '.katex',
  '.MathJax',
  'math',
  '[data-no-translate]',
  '[data-language-content="zh"]'
].join(',');
const fixedTranslations = new Map([
  ['风扇叔叔', 'Smallfan'],
  ['关于', 'About'],
  ['归档', 'Archives'],
  ['分类', 'Categories'],
  ['标签', 'Tags'],
  ['标签：', 'Tags:'],
  ['脚注', 'Footnotes']
]);

const config = JSON.parse(await fs.readFile(configPath, 'utf8'));
const ollamaEndpoint = process.env.OYSTER_OLLAMA_ENDPOINT || config.ollamaEndpoint;

if (config.enabled === false) {
  console.log('[translate] Disabled by translation.config.json.');
  process.exit(0);
}

const sourceSiteTitle = config.siteTitle?.[config.sourceLanguage] || '风扇叔叔';
const targetSiteTitle = config.siteTitle?.[config.targetLanguage] || 'Smallfan';
let cache = await readCache();
const pendingRecords = new Map();
let selectedProvider;

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function containsChinese(value) {
  return cjkPattern.test(String(value || ''));
}

function normalizeWhitespace(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function makeToken(index) {
  return `⟦${index}⟧`;
}

function createProtector() {
  const values = [];

  function protect(value) {
    const token = makeToken(values.length);
    values.push(String(value));
    return token;
  }

  function restore(value) {
    let result = String(value || '');

    for (let index = values.length - 1; index >= 0; index -= 1) {
      const original = values[index];
      const token = makeToken(index);
      const occurrences = result.split(token).length - 1;
      if (occurrences !== 1) {
        throw new Error(`The model changed protected token ${token} (found ${occurrences}, expected 1).`);
      }
      result = result.replace(token, original);
    }

    return result;
  }

  return { protect, restore };
}

function protectTechnicalText(value, protect) {
  return value.replace(
    /https?:\/\/[A-Za-z0-9._~:/?#\[\]@!$&'()*+,;=%-]+|\b[A-Za-z0-9+/]{24,}={0,2}\b/g,
    match => protect(match)
  );
}

function protectHtmlFragment(fragment) {
  const protector = createProtector();
  const normalizedFragment = String(fragment).split(sourceSiteTitle).join(targetSiteTitle);
  const fragmentDocument = cheerio.load(
    `<oyster-fragment>${normalizedFragment}</oyster-fragment>`,
    { decodeEntities: false },
    false
  );
  const root = fragmentDocument('oyster-fragment');
  const protectedElements = 'code,kbd,pre,math,.katex,svg,img,video,audio,iframe';

  const topLevelProtectedElements = root.find(protectedElements).toArray().filter(element => {
    return fragmentDocument(element).parents(protectedElements).length === 0;
  });

  topLevelProtectedElements.forEach(element => {
    const item = fragmentDocument(element);
    item.replaceWith(protector.protect(fragmentDocument.html(element)));
  });

  let value = root.html() || '';
  value = value.replace(/<!--[\s\S]*?-->|<\/?[A-Za-z][^>]*>|&(?:#\d+|#x[\da-f]+|[a-z][\da-z]+);/gi, match => {
    return protector.protect(match);
  });
  value = protectTechnicalText(value, protector.protect);

  try {
    protector.restore(value);
  } catch (error) {
    error.message += ` Protected fragment: ${value.slice(0, 500)}`;
    throw error;
  }

  return {
    input: value,
    restore: translated => protector.restore(translated)
  };
}

function protectPlainText(value) {
  const protector = createProtector();
  const normalizedValue = String(value).split(sourceSiteTitle).join(targetSiteTitle);
  return {
    input: protectTechnicalText(normalizedValue, protector.protect),
    restore: translated => protector.restore(translated)
  };
}

function protectCodeComment(value) {
  const protector = createProtector();
  let normalizedValue = String(value).split(sourceSiteTitle).join(targetSiteTitle);
  const prefix = normalizedValue.match(/^\s*(?:\/\/+|\/\*+|\*+|#+|<!--)\s*/)?.[0];

  if (prefix) normalizedValue = protector.protect(prefix) + normalizedValue.slice(prefix.length);
  const suffix = normalizedValue.match(/\s*(?:\*\/|-->)\s*$/)?.[0];
  if (suffix) normalizedValue = normalizedValue.slice(0, -suffix.length) + protector.protect(suffix);

  return {
    input: protectTechnicalText(normalizedValue, protector.protect),
    restore: translated => protector.restore(translated)
  };
}

function validateCodeComment(source, translated) {
  const prefix = String(source).match(/^\s*(?:\/\/+|\/\*+|\*+|#+|<!--)/)?.[0];
  const suffix = String(source).match(/(?:\*\/|-->)\s*$/)?.[0];

  if (prefix && !String(translated).startsWith(prefix)) {
    throw new Error('The model changed a code-comment prefix.');
  }
  if (suffix && !String(translated).endsWith(suffix)) {
    throw new Error('The model changed a code-comment suffix.');
  }
}

function queueTranslation(value, options) {
  const source = String(value ?? '');
  const fixed = fixedTranslations.get(source);

  if (!containsChinese(source)) {
    options.apply(source);
    return;
  }
  if (fixed) {
    options.apply(fixed);
    return;
  }

  const protectedValue = options.kind === 'html_fragment'
    ? protectHtmlFragment(source)
    : options.kind === 'code_comment'
      ? protectCodeComment(source)
      : protectPlainText(source);
  const key = sha256([
    promptVersion,
    options.kind,
    options.context || '',
    source
  ].join('\n'));

  if (cache.entries[key]) {
    options.apply(cache.entries[key]);
    return;
  }

  const existing = pendingRecords.get(key);
  if (existing) {
    existing.applications.push(options.apply);
    return;
  }

  pendingRecords.set(key, {
    key,
    id: key.slice(0, 16),
    kind: options.kind,
    context: options.context || '',
    source,
    input: protectedValue.input,
    restore: translated => {
      const restored = protectedValue.restore(translated);
      if (options.kind === 'code_comment') validateCodeComment(source, restored);
      return restored;
    },
    applications: [options.apply]
  });
}

function hasExcludedAncestor($, element, scopeNode) {
  let current = element;
  while (current && current !== scopeNode) {
    if (current.type === 'tag' && $(current).is(excludedSelector)) return true;
    current = current.parent;
  }
  return false;
}

function hasSelectedAncestor(element, selected, scopeNode) {
  let current = element.parent;
  while (current && current !== scopeNode) {
    if (selected.has(current)) return true;
    current = current.parent;
  }
  return false;
}

function collectVisibleTranslations($, scope) {
  const scopeNode = scope.get(0);
  if (!scopeNode) return;

  const selected = new Set();
  const candidates = scope.find(blockSelector).addBack(blockSelector).toArray();

  candidates.forEach(element => {
    if (hasExcludedAncestor($, element, scopeNode)) return;

    let parent = element.parent;
    while (parent && parent !== scopeNode) {
      if (parent.type === 'tag' && $(parent).is(blockSelector)) return;
      parent = parent.parent;
    }

    const item = $(element);
    const html = item.html() || '';
    if (!containsChinese(item.text())) return;
    selected.add(element);
    queueTranslation(html, {
      kind: 'html_fragment',
      context: 'Rendered technical article prose. Preserve every protected HTML token exactly.',
      apply: translated => item.html(translated)
    });
  });

  const fallbackParents = new Set();
  const nodes = scope.find('*').addBack().contents().toArray();

  nodes.forEach(node => {
    if (node.type !== 'text' || !containsChinese(node.data)) return;
    const parent = node.parent;
    if (!parent || fallbackParents.has(parent)) return;
    if (hasExcludedAncestor($, parent, scopeNode)) return;
    if (selected.has(parent) || hasSelectedAncestor(parent, selected, scopeNode)) return;

    const item = $(parent);
    fallbackParents.add(parent);
    queueTranslation(item.html() || '', {
      kind: 'html_fragment',
      context: 'Short interface or taxonomy text from a technical blog.',
      apply: translated => item.html(translated)
    });
  });

  scope.find('.comment').each((index, element) => {
    const item = $(element);
    const source = item.text();
    if (!containsChinese(source)) return;
    const language = item.closest('figure.highlight').attr('class') || 'code';

    queueTranslation(source, {
      kind: 'code_comment',
      context: `Comment inside ${language.replace(/\s+/g, ' ')}. Translate only the human-language comment text.`,
      apply: translated => item.text(translated)
    });
  });
}

function collectAttributeTranslations($, scope) {
  const attributes = ['title', 'alt', 'aria-label', 'placeholder'];
  scope.find('*').addBack().each((index, element) => {
    const item = $(element);
    if (item.closest('[data-language-content="zh"]').length) return;
    if (item.closest('script,style,svg,[data-no-translate]').length) return;

    attributes.forEach(attribute => {
      const source = item.attr(attribute);
      if (!containsChinese(source)) return;
      queueTranslation(source, {
        kind: 'plain_text',
        context: `HTML ${attribute} attribute on a technical blog.`,
        apply: translated => item.attr(attribute, translated)
      });
    });
  });
}

function namespaceIds($, root, prefix) {
  const idMap = new Map();
  root.find('[id]').addBack('[id]').each((index, element) => {
    const item = $(element);
    const oldId = item.attr('id');
    if (!oldId) return;
    const newId = `${prefix}-${oldId}`;
    idMap.set(oldId, newId);
    item.attr('id', newId);
  });

  root.find('a[href^="#"]').addBack('a[href^="#"]').each((index, element) => {
    const item = $(element);
    const oldId = decodeURIComponent((item.attr('href') || '').slice(1));
    if (idMap.has(oldId)) item.attr('href', `#${encodeURIComponent(idMap.get(oldId))}`);
  });

  root.find('[itemprop]').addBack('[itemprop]').removeAttr('itemprop');
}

function duplicateForLanguages($, selector) {
  $(selector).each((index, element) => {
    const chinese = $(element);
    if (chinese.attr('data-language-content')) return;

    const english = chinese.clone();
    english
      .attr('data-language-content', 'en')
      .attr('lang', 'en')
      .removeAttr('hidden');
    chinese
      .attr('data-language-content', 'zh')
      .attr('lang', 'zh-CN')
      .attr('hidden', '');
    namespaceIds($, chinese, 'zh');
    chinese.before(english);
  });
}

function formatEnglishDates($, scope) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Shanghai'
  });

  scope.find('time[datetime]').addBack('time[datetime]').each((index, element) => {
    const item = $(element);
    const value = new Date(item.attr('datetime'));
    if (!Number.isNaN(value.getTime())) item.text(formatter.format(value));
  });
}

function setSiteIdentity($, bilingual) {
  const siteLink = $('.site-title a').first();
  if (!siteLink.length) return;

  if (bilingual) {
    siteLink.html(
      `<span data-language-content="en" lang="en">${targetSiteTitle}</span>` +
      `<span data-language-content="zh" lang="zh-CN" hidden>${sourceSiteTitle}</span>`
    );
  } else {
    siteLink.text(targetSiteTitle);
  }

  $('[data-search-page]').attr('data-site-title', targetSiteTitle);
  $('meta[property="og:site_name"]').attr('content', targetSiteTitle);
  $('meta[property="og:locale"]').attr('content', 'en_US');
}

function preparePage(file, html) {
  const $ = cheerio.load(html, { decodeEntities: false });
  const bilingual = $('[data-language-switch]').length > 0;
  const htmlElement = $('html');

  htmlElement
    .attr('lang', 'en')
    .attr('data-oyster-translated', 'true')
    .attr('data-oyster-language-page', bilingual ? 'bilingual' : 'english');
  if (bilingual) $('body').addClass('language-bilingual');
  else $('body').removeClass('language-bilingual');
  $('[data-language-switch]').removeAttr('hidden');
  setSiteIdentity($, bilingual);

  if (bilingual) {
    duplicateForLanguages($, 'article.post-detail > header.entry-header');
    duplicateForLanguages($, 'article.post-detail > .entry-content');
    duplicateForLanguages($, 'article.post-detail > footer.entry-footer');
    duplicateForLanguages($, 'nav.post-navigation');
  }

  const scopes = bilingual
    ? $('[data-language-content="en"]').toArray().map(element => $(element))
    : [$('#main')];

  scopes.forEach(scope => {
    formatEnglishDates($, scope);
    collectVisibleTranslations($, scope);
  });

  const originalTitle = $('title').text();
  if (bilingual) htmlElement.attr('data-title-zh', originalTitle);
  queueTranslation(originalTitle, {
    kind: 'plain_text',
    context: `HTML document title. Translate ${sourceSiteTitle} exactly as ${targetSiteTitle}.`,
    apply: translated => {
      $('title').text(translated);
      if (bilingual) htmlElement.attr('data-title-en', translated);
    }
  });

  [
    'meta[property="og:title"]',
    'meta[property="og:description"]',
    'meta[name="description"]',
    'meta[name="twitter:title"]',
    'meta[name="twitter:description"]'
  ].forEach(selector => {
    $(selector).each((index, element) => {
      const item = $(element);
      const source = item.attr('content');
      if (!containsChinese(source)) return;
      queueTranslation(source, {
        kind: 'plain_text',
        context: 'SEO metadata for an English technical blog.',
        apply: translated => item.attr('content', translated)
      });
    });
  });

  return { file, $, bilingual, scopes };
}

async function readCache() {
  try {
    const parsed = JSON.parse(await fs.readFile(cachePath, 'utf8'));
    if (parsed.promptVersion === promptVersion && parsed.entries) return parsed;
  } catch (error) {
    if (error.code !== 'ENOENT') console.warn(`[translate] Ignoring unreadable cache: ${error.message}`);
  }
  return { promptVersion, entries: {} };
}

async function writeCache() {
  await fs.mkdir(cacheDirectory, { recursive: true });
  const temporaryPath = `${cachePath}.${process.pid}.tmp`;
  await fs.writeFile(temporaryPath, `${JSON.stringify(cache, null, 2)}\n`);
  await fs.rename(temporaryPath, cachePath);
}

async function walkHtmlFiles(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const output = [];

  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) output.push(...await walkHtmlFiles(absolutePath));
    else if (entry.isFile() && entry.name.endsWith('.html')) output.push(absolutePath);
  }

  return output;
}

async function chooseProvider() {
  if (selectedProvider) return selectedProvider;

  const requested = String(
    process.env.OYSTER_TRANSLATION_PROVIDER ||
    (process.env.GITHUB_ACTIONS === 'true' ? config.ciProvider : '') ||
    ''
  ).toLowerCase();

  if (requested && requested !== 'ollama') {
    throw new Error(`Unknown translation provider: ${requested}`);
  }
  if (requested === 'ollama') {
    selectedProvider = {
      type: 'ollama',
      endpoint: String(ollamaEndpoint || 'http://127.0.0.1:11434').replace(/\/$/, '')
    };
    return selectedProvider;
  }
  if (process.env.GITHUB_ACTIONS === 'true') {
    throw new Error('GitHub Actions must set OYSTER_TRANSLATION_PROVIDER=ollama.');
  }
  return null;
}

function translationSystemPrompt() {
  return [
    'You are a senior Chinese-to-English technical translator specializing in internet engineering, computer science, software architecture, cryptography, mobile development, and artificial intelligence.',
    'Translate into accurate, natural, concise American English for a professional engineering blog.',
    'Use canonical English terminology. Preserve product names, framework names, API names, acronyms, commands, identifiers, paths, versions, equations, and factual meaning.',
    `Always translate the personal name and site identity “${sourceSiteTitle}” exactly as “${targetSiteTitle}”.`,
    'For html_fragment items, every token shaped like ⟦0⟧ or ⟦12⟧ is immutable markup or technical text. Reproduce every token exactly once. You may move tokens only when required by natural English word order.',
    'For code_comment items, translate only human-language comment prose. Preserve comment delimiters, indentation, line breaks, identifiers, literals, and code syntax exactly.',
    'Do not summarize, explain, add information, or omit details. Do not leave Chinese prose in the output.',
    'Return only valid JSON matching the requested schema.'
  ].join('\n');
}

function translationUserPrompt(records) {
  return JSON.stringify({
    task: 'Translate every item from Simplified Chinese to English.',
    output: {
      translations: records.map(record => ({ id: record.id, text: 'translated text' }))
    },
    items: records.map(record => ({
      id: record.id,
      kind: record.kind,
      context: record.context,
      text: record.input
    }))
  });
}

async function requestOllama(provider, records) {
  const body = {
    model: process.env.OYSTER_OLLAMA_MODEL || config.ollamaModel,
    stream: false,
    think: false,
    format: {
      type: 'object',
      properties: {
        translations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              text: { type: 'string' }
            },
            required: ['id', 'text']
          }
        }
      },
      required: ['translations']
    },
    keep_alive: '30m',
    options: {
      temperature: 0,
      num_ctx: 32768,
      num_predict: 16000
    },
    messages: [
      { role: 'system', content: translationSystemPrompt() },
      { role: 'user', content: translationUserPrompt(records) }
    ]
  };

  const response = await fetch(`${provider.endpoint}/api/chat`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const detail = await response.text();
    const error = new Error(`Ollama returned ${response.status}: ${detail.slice(0, 300)}`);
    error.status = response.status;
    throw error;
  }

  const payload = await response.json();
  return payload.message?.content || '';
}

function parseModelResponse(value) {
  const source = String(value || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  const start = source.indexOf('{');
  const end = source.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('The model did not return a JSON object.');
  const parsed = JSON.parse(source.slice(start, end + 1));
  if (!Array.isArray(parsed.translations)) throw new Error('The model response has no translations array.');
  return new Map(parsed.translations.map(item => [item.id, String(item.text ?? '')]));
}

function delay(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

async function requestBatch(provider, records) {
  let lastError;

  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      const raw = await requestOllama(provider, records);
      const translations = parseModelResponse(raw);
      const output = new Map();

      for (const record of records) {
        if (!translations.has(record.id)) throw new Error(`Missing translation for ${record.id}.`);
        const protectedTranslation = translations.get(record.id);
        if (containsChinese(protectedTranslation)) {
          throw new Error(`Translation ${record.id} still contains Chinese prose.`);
        }
        output.set(record.key, record.restore(protectedTranslation));
      }

      return output;
    } catch (error) {
      lastError = error;
      if (attempt === 4) break;
      const waitSeconds = Math.min(2 ** attempt, 20);
      console.warn(`[translate] Retry ${attempt}/3 after error: ${error.message}`);
      await delay(waitSeconds * 1000);
    }
  }

  throw lastError;
}

function makeBatches(records, characterLimit = 24000, itemLimit = 80) {
  const batches = [];
  let current = [];
  let currentSize = 0;

  records.forEach(record => {
    const size = record.input.length + record.context.length + 180;
    if (current.length && (currentSize + size > characterLimit || current.length >= itemLimit)) {
      batches.push(current);
      current = [];
      currentSize = 0;
    }
    current.push(record);
    currentSize += size;
  });

  if (current.length) batches.push(current);
  return batches;
}

async function resolvePendingTranslations() {
  const records = Array.from(pendingRecords.values());
  pendingRecords.clear();
  if (!records.length) return;

  const batches = makeBatches(records);
  console.log(`[translate] Prepared ${records.length} uncached segment(s) in ${batches.length} batch(es).`);
  const provider = await chooseProvider();
  if (!provider) {
    if (process.env.OYSTER_TRANSLATION_REQUIRED === '1') {
      throw new Error('AI translation is required, but no translation provider is configured.');
    }
    console.warn('[translate] No CI translation provider configured locally; keeping the raw Chinese Hexo build.');
    return false;
  }
  console.log(`[translate] ${records.length} new segments in ${batches.length} ${provider.type} batch(es).`);

  for (let index = 0; index < batches.length; index += 1) {
    const batch = batches[index];
    console.log(`[translate] Translating batch ${index + 1}/${batches.length} (${batch.length} segments).`);
    const translations = await requestBatch(provider, batch);

    batch.forEach(record => {
      const translated = translations.get(record.key);
      cache.entries[record.key] = translated;
      record.applications.forEach(apply => apply(translated));
    });
    await writeCache();

  }

  return true;
}

function publicPathForUrl(url) {
  const pathname = decodeURIComponent(new URL(url, 'https://smallfan.top').pathname);
  const relative = pathname.replace(/^\/+/, '');
  if (!relative || relative.endsWith('/')) return path.join(publicDirectory, relative, 'index.html');
  return path.join(publicDirectory, relative);
}

async function updateSearchIndex(pagesByPath) {
  const searchPath = path.join(publicDirectory, 'search.json');
  let payload;

  try {
    payload = JSON.parse(await fs.readFile(searchPath, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return;
    throw error;
  }

  const formatter = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Shanghai'
  });

  (payload.posts || []).forEach(item => {
    const page = pagesByPath.get(path.normalize(publicPathForUrl(item.url)));
    if (!page) return;

    const title = normalizeWhitespace(
      page.$('article.post-detail > header[data-language-content="en"] .entry-title').text()
    );
    const content = normalizeWhitespace(
      page.$('article.post-detail > .entry-content[data-language-content="en"]').text()
    );
    const taxonomy = normalizeWhitespace(
      page.$('article.post-detail > footer[data-language-content="en"] .tag-links a, ' +
        'article.post-detail > footer[data-language-content="en"] .category-links a').map((index, element) => {
        return page.$(element).text();
      }).get().join(' ')
    );

    if (title) item.title = title;
    if (content) {
      item.content = content;
      item.excerpt = content.slice(0, 280).trim();
    }
    item.taxonomy = taxonomy;
    const date = new Date(item.date);
    if (!Number.isNaN(date.getTime())) item.dateText = formatter.format(date);
  });

  await fs.writeFile(searchPath, JSON.stringify(payload));
}

function validateTranslatedPages(pages) {
  pages.forEach(page => {
    const { $, file, bilingual } = page;
    const relativePath = path.relative(publicDirectory, file);
    const ids = $('[id]').map((index, element) => $(element).attr('id')).get();
    if (new Set(ids).size !== ids.length) {
      throw new Error(`Translated page contains duplicate IDs: ${relativePath}`);
    }
    if ($('html').attr('lang') !== 'en' || !$('.site-title').text().includes(targetSiteTitle)) {
      throw new Error(`Translated page has an invalid default identity: ${relativePath}`);
    }

    if (bilingual) {
      const englishBodies = $('article.post-detail > .entry-content[data-language-content="en"]');
      const chineseBodies = $('article.post-detail > .entry-content[data-language-content="zh"]');
      if (englishBodies.length !== 1 || chineseBodies.length !== 1) {
        throw new Error(`Bilingual page is missing a language body: ${relativePath}`);
      }
      if (englishBodies.find('.highlight .code .line').length !== chineseBodies.find('.highlight .code .line').length) {
        throw new Error(`Code line structure changed during translation: ${relativePath}`);
      }
      if (englishBodies.find('.katex').length !== chineseBodies.find('.katex').length) {
        throw new Error(`Math structure changed during translation: ${relativePath}`);
      }
    }

    const visibleEnglish = $('body').clone();
    visibleEnglish.find([
      '[data-language-content="zh"]',
      '[data-no-translate]',
      'script',
      'style',
      'svg',
      'pre',
      'code',
      '.highlight',
      '.katex',
      '.MathJax',
      'math'
    ].join(',')).remove();
    const visibleEnglishText = visibleEnglish.text();
    if (containsChinese(visibleEnglishText)) {
      const chineseIndex = visibleEnglishText.search(cjkPattern);
      const context = normalizeWhitespace(visibleEnglishText.slice(
        Math.max(0, chineseIndex - 80),
        chineseIndex + 160
      ));
      throw new Error(`English page still contains visible Chinese prose: ${relativePath} (${context})`);
    }

    const englishComments = bilingual
      ? $('[data-language-content="en"] .highlight .comment')
      : $('.highlight .comment');
    if (containsChinese(englishComments.text())) {
      throw new Error(`English code comments still contain Chinese prose: ${relativePath}`);
    }
  });
}

async function main() {
  const htmlFiles = await walkHtmlFiles(publicDirectory);
  const pages = [];

  for (const file of htmlFiles) {
    const html = await fs.readFile(file, 'utf8');
    pages.push(preparePage(file, html));
  }

  const translated = await resolvePendingTranslations();
  if (translated === false) return;

  pages.forEach(page => {
    page.scopes.forEach(scope => collectAttributeTranslations(page.$, scope));
  });
  await resolvePendingTranslations();

  const pagesByPath = new Map(pages.map(page => [path.normalize(page.file), page]));
  await updateSearchIndex(pagesByPath);
  validateTranslatedPages(pages);

  await Promise.all(pages.map(page => fs.writeFile(page.file, page.$.html())));
  await writeCache();
  console.log(`[translate] Generated ${pages.length} English page(s); article and About pages remain bilingual.`);
}

main().catch(error => {
  console.error(`[translate] ${error.stack || error.message}`);
  process.exitCode = 1;
});
