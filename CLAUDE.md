# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Hexo blog** using the **Butterfly theme**. Hexo is a static site generator written in Node.js that transforms Markdown files into a complete blog website.

### Key Technologies
- **Hexo 8.0.0**: Static site generator framework
- **Butterfly Theme**: Modern, feature-rich Hexo theme with card-based design
- **Node.js**: Runtime environment
- **Markdown**: Content format for blog posts
- **Stylus**: CSS preprocessor used by the theme
- **Pug**: Template engine for HTML generation

## Essential Commands

### Development Commands
```bash
# Install dependencies
npm install

# Start development server (watch mode with hot reload)
hexo server
# Alternative: npm run server

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
- **`themes/butterfly/`**: The Butterfly theme directory
- **`public/`**: Generated static site files (created by `hexo generate`)
- **`scaffolds/`**: Templates for new posts, pages, and drafts

### Configuration Files
- **`_config.yml`**: Main Hexo configuration
  - Site metadata (title, author, URL)
  - Directory paths and URL structure
  - Plugin and theme settings
- **`_config.butterfly.yml`**: Butterfly theme configuration
  - Theme appearance and behavior settings
  - Feature toggles (dark mode, comments, analytics)
  - UI components and layout options

### Content Organization
- Posts are created in `source/_posts/` as Markdown files
- Each post has YAML front matter for metadata
- Butterfly theme supports rich features like TOC, code highlighting, and social sharing
- Theme uses a card-based responsive design with customizable layouts

## Development Workflow

1. **Content Creation**: Use `hexo new post` to create new blog posts
2. **Local Development**: Run `hexo server` to preview changes locally
3. **Theme Customization**: Modify `_config.butterfly.yml` for theme settings
4. **Build**: Run `hexo generate` to create production-ready static files
5. **Deployment**: Use `hexo deploy` (requires deployment configuration)

## Important Notes

- **No Testing Framework**: This is a static blog project without automated tests
- **No Linting**: No ESLint or similar code quality tools configured
- **Theme Dependencies**: Requires `hexo-renderer-pug` and `hexo-renderer-stylus` for the Butterfly theme
- **Chinese Content**: Blog is configured for Chinese content (`language: zh`)
- **Static Site**: Final output is pure HTML/CSS/JS that can be hosted anywhere

## Butterfly Theme Features

The theme includes extensive customization options for:
- Dark/light mode toggle
- Multiple layout styles for post listings
- Code highlighting with multiple themes
- Built-in search functionality
- Social sharing and comment systems
- Analytics integration support
- Image galleries and lightboxes

## Custom Features

### Music Player

A custom music player has been implemented for the homepage with the following features:

#### Location and Display
- **Only shows on homepage** (`/` or `/index.html`)
- **Draggable** floating player positioned at bottom-right by default
- **Toggle minimize/expand** mode with a button
- **Responsive design** adapts to PC, tablet, and mobile devices

#### Player Controls
- **Playback controls**: Play, Pause, Previous, Next, Replay
- **Progress bar**: Click to seek, shows current time and duration
- **Volume control**: Adjustable volume slider
- **Playlist loop**: Auto-plays next track when current ends

#### UI Modes
- **Minimized mode** (default): Shows only play/pause button and song name
- **Expanded mode**: Shows all controls, progress bar, and volume slider

#### Cross-Tab Playback Control
- **Prevents multiple playback**: Only one tab plays music at a time
- **First tab priority**: Earliest tab continues playing; new tabs don't auto-play
- **Auto-pause**: When one tab starts playing, others automatically pause
- Uses `localStorage` for cross-tab communication

#### Audio Source Support
- **Remote URLs**: Supports CDN-hosted audio files (recommended)
- **Local files**: Supports files in `source/music/` directory
- **Mixed mode**: Can use both remote and local files in same playlist

#### Configuration
- **Playlist file**: `source/music/playlist.json`
- **Format**:
  ```json
  {
    "files": [
      "https://cdn.example.com/song1.mp3",
      "local-song.mp3"
    ]
  }
  ```
- Plays in the order defined in JSON (no sorting)

#### Implementation Files
- **`source/css/custom.css`**: Player styles with mobile responsive design
- **`source/js/music-player.js`**: Player logic, autoplay, and cross-tab control
- **`source/music/playlist.json`**: Music playlist configuration
- **`_config.butterfly.yml`**: Inject scripts via bottom injection

#### Autoplay Behavior
- Attempts immediate autoplay (works if user previously interacted with domain)
- Listens for user interactions (click, scroll, mousemove, keydown, touchstart)
- Starts playback on first interaction if autoplay was blocked
- Respects browser autoplay policies

### Homepage Link Behavior

All links on the homepage open in new tabs, with exceptions:
- **Site title/logo**: Opens in current tab (preserves music playback)
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
Custom scripts and styles are injected via `_config.butterfly.yml`:
```yaml
inject:
  head:
    - <link rel="stylesheet" href="/css/custom.css">
  bottom:
    - <script src="/js/music-player.js"></script>
    - <script src="/js/homepage-links.js"></script>
```