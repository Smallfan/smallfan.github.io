# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Hexo blog** using the local **Oyster theme**. Hexo is a static site generator written in Node.js that transforms Markdown files into a complete blog website.

### Key Technologies
- **Hexo 8.1.2**: Static site generator framework metadata used by this checkout
- **Oyster Theme**: Minimal, reading-first local theme using Matrix67-inspired typography and colors with a wider responsive layout
- **Node.js**: Runtime environment
- **Markdown**: Content format for blog posts
- **EJS**: Template engine used by Oyster
- **CSS**: Native theme styling; the legacy Explorer theme still contains Stylus and Pug files

## Essential Commands

### Development Commands
```bash
# Install dependencies
npm install

# Build the translated site and serve the generated static output
npm run server

# Raw Chinese Hexo watch server for template debugging only
npm run server:hexo

# Generate static files for production
hexo generate
# Alternative: npm run build

# Clean generated files and cache
hexo clean
# Alternative: npm run clean

# Deploy to configured target
hexo deploy
# Alternative: npm run deploy
```

### Content Management
```bash
# Create a new post
hexo new post "Post Title"

# Create a new draft
hexo new draft "Draft Title"

# Create a new page
hexo new page "page-name"

# Publish a draft
hexo publish "draft-title"
```

## Architecture & Directory Structure

### Core Directories
- **`source/`**: Contains all content files
  - `source/_posts/`: Blog posts in Markdown format
  - `source/images/`: Static images and assets
- **`themes/oyster/`**: The active Oyster theme directory
- **`themes/explorer/`**: Retained legacy Explorer theme; it is not loaded while `_config.yml` uses `theme: oyster`
- **`public/`**: Generated static site files (created by Hexo, then translated by `tools/translate-site.mjs`)
- **`scaffolds/`**: Templates for new posts, pages, and drafts

### Configuration Files
- **`_config.yml`**: Main Hexo configuration
  - Site metadata (title, author, URL)
  - Directory paths and URL structure
  - Plugin and theme settings
- **`_config.oyster.yml`**: Active Oyster site-level theme configuration
  - Search routes, excerpt length, Markdown outline behavior and footer start year
  - Site custom CSS and JavaScript injection
- **`translation.config.json`**: Translation languages, fixed `风扇叔叔`/`Smallfan` identity mapping and free AI provider models
- **`tools/translate-site.mjs`**: Cached post-build translator for prose, metadata and highlighted code comments

### Content Organization
- Posts are created in `source/_posts/` as Markdown files
- Each post has YAML front matter for metadata
- Oyster provides a single-column responsive reading layout, archive/category/tag/page templates, code highlighting styles and mobile handling
- The active theme intentionally omits Explorer's card sidebar and dark-mode controls

## Development Workflow

1. **Content Creation**: Use `hexo new post` to create new blog posts
2. **Local Development**: Run `npm run server` to preview the production-shaped static build (Chinese by default without a provider); use `npm run server:hexo` for untranslated template watch mode
3. **Theme Customization**: Modify `_config.oyster.yml` for site-level theme settings, or `themes/oyster/` for theme implementation
4. **Build**: Run `hexo generate` to create production-ready static files
5. **Deployment**: Use `hexo deploy` (requires deployment configuration)

## Important Notes

- **No Testing Framework**: This is a static blog project without automated tests
- **No Linting**: No ESLint or similar code quality tools configured
- **Theme Dependencies**: Oyster uses the already-declared `hexo-renderer-ejs`; legacy Pug/Stylus dependencies remain installed for Explorer
- **Chinese Content Source**: Authors write only Chinese Markdown; production HTML defaults to English
- **Free AI Translation**: Cache misses are translated through Google's neural translation endpoint in GitHub Actions. Local builds skip translation by default, and neither local nor cloud builds download a model.
- **Static Site**: Final output is pure HTML/CSS/JS that can be hosted anywhere

## Oyster Theme Design

Oyster follows the public Matrix67 visual system for the key reading values:
- System font stack: `Helvetica Neue`, Arial, `Hiragino Sans GB`, `Microsoft YaHei`, sans-serif
- Body text `#404040`, titles `#333333`, links `#0075c9`, hover state `#009bdf`, metadata `#c8c8c8`
- Article titles at 24px; homepage titles at 28px (25px on mobile), with excerpt H1 reduced to 21px for a clear hierarchy
- A centered fluid content width capped at 1040px, with a 90% mobile layout
- Minimal single-column pages and a centered footer
- H1/H2/H3 and their following body sections use progressively deeper indentation; the mobile step is reduced to preserve readable width
- GFM-compatible Markdown with tables, task lists, description lists and footnotes
- Server-rendered KaTeX compatibility for legacy math delimiters and a locally adapted Highlight.js StackOverflow Light palette for common programming languages; code blocks use 12px text, fixed-width line-number gutters and horizontal scrolling for long lines

## Custom Features

### Navigation

- The site title remains the homepage entry point.
- The former **分类** and **关于** header links are hidden; archive, category and tag pages are still generated for taxonomy links.
- The top-right header control is an expanding search field inspired by Matrix67.
- The About page source is `source/about/index.md`; its visible entry is the Footer's `About Me` link.
- The former homepage music player, playlist and injected script have been removed.

### Static Search

- `source/search/index.md` uses `themes/oyster/layout/search.ejs` for the search results shell.
- `themes/oyster/scripts/search-index.js` generates `public/search.json` from post titles, categories, tags and plain-text content at build time.
- `themes/oyster/source/js/search.js` ranks local matches, renders dated Oyster-style summaries, highlights keywords and handles empty/error states without an external search service.

### Automatic English Translation

- `npm run build` uses npm's `postbuild` lifecycle to run `tools/translate-site.mjs` after Hexo has rendered Markdown, Highlight.js and KaTeX.
- Semantic HTML fragments are translated with protected markup tokens. Inline code, links, formulas, identifiers and string literals remain unchanged; Highlight.js `.comment` nodes are translated separately.
- Homepage, archive, taxonomy and search pages are English-only. Post detail and About pages contain an English copy plus the untouched Chinese rendering and load `themes/oyster/source/js/language-switch.js`.
- English is the first-visit default. The fixed site identity is `Smallfan` in English and `风扇叔叔` in Chinese, including the About introduction.
- Translation responses live in ignored `.cache/oyster-translations/`; GitHub Actions restores and incrementally saves this cache. No translation model is downloaded to the author's Mac, the runner, or Git.

### Homepage Link Behavior

All links on the homepage open in new tabs, with exceptions:
- **Post title and Read more links**: Open the article in the current tab
- **Site title/logo**: Opens in current tab
- **Pagination links**: Stay in the current tab for chronological navigation
- **Anchor links** (#): Stay on current page
- **Special links**: `mailto:`, `tel:`, `javascript:` behave normally

Implementation: `source/js/homepage-links.js`

## Custom Styling

### Footer Customization
The footer has custom styling applied via `source/css/custom.css`:
- White background (`#ffffff`)
- Black text color (`#000000`)
- Black link color

### Injection Configuration
Custom scripts and styles are loaded through `_config.oyster.yml`:
```yaml
custom_css:
  - /css/custom.css

custom_js:
  - /js/homepage-links.js
```
