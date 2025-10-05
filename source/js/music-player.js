// Music Player Implementation
(function() {
  'use strict';

  // Only initialize on homepage
  const isHomepage = window.location.pathname === '/' || window.location.pathname === '/index.html';
  if (!isHomepage) {
    return;
  }

  const MusicPlayer = {
    playlist: [],
    currentIndex: 0,
    audio: null,
    playerElement: null,
    isDragging: false,
    dragOffset: { x: 0, y: 0 },
    hasUserInteracted: false,
    originalVolume: 1.0,
    tabId: null, // Unique ID for this tab

    // Initialize player
    init: async function() {
      console.log('Music player initializing...');

      // Generate unique tab ID
      this.tabId = 'tab_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      console.log('Tab ID:', this.tabId);

      this.createPlayerUI();
      await this.loadPlaylist();
      console.log('Playlist loaded:', this.playlist);
      this.bindEvents();
      this.loadTrack(0);

      // Setup cross-tab playback control
      this.setupCrossTabControl();

      // Setup autoplay strategy
      this.setupAutoplay();
    },

    // Setup cross-tab playback control
    setupCrossTabControl: function() {
      // Listen for storage changes from other tabs
      window.addEventListener('storage', (e) => {
        if (e.key === 'music_player_active_tab') {
          const activeTabId = e.newValue;

          // If another tab is playing, pause this one
          if (activeTabId && activeTabId !== this.tabId && !this.audio.paused) {
            console.log('Another tab started playing, pausing this tab');
            this.pause();
          }
        }
      });

      // Clean up when tab is closed
      window.addEventListener('beforeunload', () => {
        const activeTabId = localStorage.getItem('music_player_active_tab');
        if (activeTabId === this.tabId) {
          localStorage.removeItem('music_player_active_tab');
        }
      });

      // Listen to audio play event to claim active tab
      this.audio.addEventListener('play', () => {
        this.claimActiveTab();
      });

      // Listen to audio pause event to release if we're the active tab
      this.audio.addEventListener('pause', () => {
        const activeTabId = localStorage.getItem('music_player_active_tab');
        if (activeTabId === this.tabId) {
          localStorage.removeItem('music_player_active_tab');
        }
      });
    },

    // Claim this tab as the active playing tab
    claimActiveTab: function() {
      localStorage.setItem('music_player_active_tab', this.tabId);
      console.log('This tab is now the active player');
    },

    // Setup autoplay with user interaction detection
    setupAutoplay: function() {
      const attemptAutoplay = async () => {
        if (this.hasUserInteracted) return; // Already playing

        // Check if another tab is already playing
        const activeTabId = localStorage.getItem('music_player_active_tab');
        if (activeTabId && activeTabId !== this.tabId) {
          console.log('Another tab is already playing, skipping autoplay for this tab');
          return; // Don't autoplay if another tab is playing
        }

        this.hasUserInteracted = true;
        console.log('User interaction detected, starting playback...');

        // Unmute and play
        this.audio.muted = false;
        this.audio.volume = this.originalVolume;

        try {
          await this.audio.play();
          console.log('Playback started successfully');
          const playBtn = document.querySelector('.play-btn i');
          if (playBtn) {
            playBtn.className = 'fas fa-pause';
          }

          // Remove all interaction listeners
          this.removeInteractionListeners();
        } catch (err) {
          console.warn('Playback failed:', err.message);
          this.hasUserInteracted = false;
        }
      };

      // Mousemove needs debouncing
      let mouseMoveTimer = null;
      const debouncedMouseMove = () => {
        if (this.hasUserInteracted) return;
        if (mouseMoveTimer) clearTimeout(mouseMoveTimer);
        mouseMoveTimer = setTimeout(attemptAutoplay, 50);
      };

      // Store listeners so we can remove them later
      this.interactionListeners = {
        click: attemptAutoplay,
        scroll: attemptAutoplay,
        keydown: attemptAutoplay,
        touchstart: attemptAutoplay,
        mousemove: debouncedMouseMove
      };

      // Listen for various user interactions
      document.addEventListener('click', this.interactionListeners.click, { once: true });
      document.addEventListener('scroll', this.interactionListeners.scroll, { once: true, passive: true });
      document.addEventListener('keydown', this.interactionListeners.keydown, { once: true });
      document.addEventListener('touchstart', this.interactionListeners.touchstart, { once: true, passive: true });

      // Mousemove without 'once' to allow debouncing to work
      document.addEventListener('mousemove', this.interactionListeners.mousemove, { passive: true });

      // Try immediate autoplay anyway (will work if user previously interacted with the domain)
      this.audio.addEventListener('loadedmetadata', async () => {
        console.log('Audio metadata loaded, attempting immediate autoplay...');

        // Check if another tab is already playing
        const activeTabId = localStorage.getItem('music_player_active_tab');
        if (activeTabId && activeTabId !== this.tabId) {
          console.log('Another tab is already playing, skipping immediate autoplay');
          return;
        }

        try {
          await this.audio.play();
          console.log('Immediate autoplay successful!');
          this.hasUserInteracted = true;
          const playBtn = document.querySelector('.play-btn i');
          if (playBtn) {
            playBtn.className = 'fas fa-pause';
          }
          this.removeInteractionListeners();
        } catch (err) {
          console.log('Immediate autoplay prevented, waiting for user interaction...');
        }
      }, { once: true });
    },

    // Remove interaction listeners
    removeInteractionListeners: function() {
      if (this.interactionListeners) {
        document.removeEventListener('click', this.interactionListeners.click);
        document.removeEventListener('scroll', this.interactionListeners.scroll);
        document.removeEventListener('keydown', this.interactionListeners.keydown);
        document.removeEventListener('touchstart', this.interactionListeners.touchstart);
        this.interactionListeners = null;
      }
    },

    // Load playlist from /music/ directory
    loadPlaylist: async function() {
      // Dynamically scan music files in /music/ directory
      // Since we can't scan directory on client-side, we'll try common extensions
      // User needs to ensure files are named properly (will be sorted alphabetically)

      // For now, we'll use a method that tries to load files
      // The actual file discovery will be handled by checking the network
      await this.discoverMusicFiles();
    },

    // Discover music files by trying to load them
    discoverMusicFiles: async function() {
      // We'll need to manually list the files or use a manifest
      // For simplicity, let's create a method that the user can update
      // Or we can read from a JSON file

      // Check if there's a playlist.json file
      try {
        const response = await fetch('/music/playlist.json');
        if (response.ok) {
          const data = await response.json();
          this.playlist = data.files; // Keep original order from playlist.json
        }
      } catch (e) {
        // If no playlist.json, we'll need files to be added manually
        console.log('No playlist.json found. Please create one or music files won\'t load.');
        this.playlist = [];
      }

      if (this.playlist.length === 0) {
        console.warn('No music files found. Please add MP3 files to /source/music/ and create playlist.json');
      }
    },

    // Create player UI
    createPlayerUI: function() {
      const playerHTML = `
        <div id="music-player" class="minimized">
          <div class="player-header">
            <button class="toggle-size-btn" title="展开/收起">
              <i class="fas fa-chevron-up"></i>
            </button>
          </div>

          <div class="song-info">
            <div class="song-name">加载中...</div>
            <div class="song-time">
              <span class="current-time">0:00</span> /
              <span class="total-time">0:00</span>
            </div>
          </div>

          <div class="progress-bar">
            <div class="progress-fill"></div>
          </div>

          <div class="player-controls">
            <button class="control-btn prev-btn" title="上一首">
              <i class="fas fa-step-backward"></i>
            </button>
            <button class="control-btn play-btn" title="播放">
              <i class="fas fa-play"></i>
            </button>
            <button class="control-btn next-btn" title="下一首">
              <i class="fas fa-step-forward"></i>
            </button>
            <button class="control-btn replay-btn" title="重播">
              <i class="fas fa-redo"></i>
            </button>
          </div>

          <div class="volume-control">
            <span class="volume-icon">🔊</span>
            <div class="volume-slider">
              <div class="volume-fill"></div>
            </div>
          </div>
        </div>
      `;

      document.body.insertAdjacentHTML('beforeend', playerHTML);
      this.playerElement = document.getElementById('music-player');
      this.audio = new Audio();
      this.audio.volume = 1.0;
    },

    // Toggle player size
    toggleSize: function() {
      const isMinimized = this.playerElement.classList.contains('minimized');
      const toggleBtn = document.querySelector('.toggle-size-btn i');
      const isMobile = window.innerWidth <= 480;

      if (isMinimized) {
        // Expanding
        this.playerElement.classList.remove('minimized');
        toggleBtn.className = 'fas fa-chevron-down';

        // On mobile, center the expanded player
        if (isMobile) {
          this.playerElement.style.left = 'auto';
          this.playerElement.style.top = 'auto';
          this.playerElement.style.right = '50%';
          this.playerElement.style.bottom = '15px';
          this.playerElement.style.transform = 'translateX(50%)';
        }
      } else {
        // Minimizing
        this.playerElement.classList.add('minimized');
        toggleBtn.className = 'fas fa-chevron-up';

        // On mobile, move to bottom right corner
        if (isMobile) {
          this.playerElement.style.left = 'auto';
          this.playerElement.style.top = 'auto';
          this.playerElement.style.right = '10px';
          this.playerElement.style.bottom = '10px';
          this.playerElement.style.transform = 'none';
        }
      }
    },

    // Load a track
    loadTrack: function(index) {
      if (this.playlist.length === 0) return;

      this.currentIndex = index;
      const filename = this.playlist[index];

      // Check if it's a URL or local file
      if (filename.startsWith('http://') || filename.startsWith('https://')) {
        // Remote URL
        this.audio.src = filename;
      } else {
        // Local file
        this.audio.src = `/music/${filename}`;
      }

      // Preload audio
      this.audio.load();

      // Update song name (extract from URL or filename)
      let songName;
      if (filename.startsWith('http://') || filename.startsWith('https://')) {
        // Extract filename from URL and decode
        const urlPath = new URL(filename).pathname;
        songName = decodeURIComponent(urlPath.split('/').pop().replace(/\.[^/.]+$/, ''));
      } else {
        songName = filename.replace(/\.[^/.]+$/, '');
      }

      document.querySelector('.song-name').textContent = songName;

      console.log('Loaded track:', songName);
    },

    // Play music
    play: function() {
      if (this.playlist.length === 0) {
        console.warn('Playlist is empty');
        return;
      }

      const playPromise = this.audio.play();

      if (playPromise !== undefined) {
        playPromise.then(() => {
          const playBtn = document.querySelector('.play-btn i');
          if (playBtn) {
            playBtn.className = 'fas fa-pause';
          }
        }).catch(err => {
          console.warn('Playback failed:', err.message);
        });
      }
    },

    // Pause music
    pause: function() {
      this.audio.pause();
      const playBtn = document.querySelector('.play-btn i');
      playBtn.className = 'fas fa-play';
    },

    // Toggle play/pause
    togglePlay: function() {
      // Mark that user has interacted
      this.hasUserInteracted = true;
      this.removeInteractionListeners();

      if (this.audio.paused) {
        this.play();
      } else {
        this.pause();
      }
    },

    // Previous track
    prevTrack: function() {
      if (this.playlist.length === 0) return;

      this.hasUserInteracted = true;
      this.removeInteractionListeners();

      this.currentIndex = (this.currentIndex - 1 + this.playlist.length) % this.playlist.length;
      this.loadTrack(this.currentIndex);
      this.play();
    },

    // Next track
    nextTrack: function() {
      if (this.playlist.length === 0) return;

      // Mark user interaction only if called manually (not auto-next)
      const wasManual = arguments[0] !== 'auto';
      if (wasManual) {
        this.hasUserInteracted = true;
        this.removeInteractionListeners();
      }

      this.currentIndex = (this.currentIndex + 1) % this.playlist.length;
      this.loadTrack(this.currentIndex);
      this.play();
    },

    // Replay current track
    replay: function() {
      this.hasUserInteracted = true;
      this.removeInteractionListeners();

      this.audio.currentTime = 0;
      this.play();
    },

    // Format time
    formatTime: function(seconds) {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    },

    // Update progress bar
    updateProgress: function() {
      const progress = (this.audio.currentTime / this.audio.duration) * 100;
      document.querySelector('.progress-fill').style.width = `${progress}%`;

      document.querySelector('.current-time').textContent = this.formatTime(this.audio.currentTime);
      document.querySelector('.total-time').textContent = this.formatTime(this.audio.duration || 0);
    },

    // Seek to position
    seek: function(event) {
      this.hasUserInteracted = true;
      this.removeInteractionListeners();

      const progressBar = document.querySelector('.progress-bar');
      const rect = progressBar.getBoundingClientRect();
      const pos = (event.clientX - rect.left) / rect.width;
      this.audio.currentTime = pos * this.audio.duration;
    },

    // Set volume
    setVolume: function(event) {
      this.hasUserInteracted = true;
      this.removeInteractionListeners();

      const volumeSlider = document.querySelector('.volume-slider');
      const rect = volumeSlider.getBoundingClientRect();
      const pos = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
      this.audio.volume = pos;
      this.originalVolume = pos;
      document.querySelector('.volume-fill').style.width = `${pos * 100}%`;
    },

    // Make player draggable
    makeDraggable: function() {
      const getPosition = (e) => {
        return e.touches ? e.touches[0] : e;
      };

      const startDrag = (e) => {
        // Don't drag if clicking on buttons or interactive elements
        if (e.target.closest('button') || e.target.closest('.progress-bar') || e.target.closest('.volume-slider')) {
          return;
        }

        const pos = getPosition(e);
        this.isDragging = true;
        const rect = this.playerElement.getBoundingClientRect();
        this.dragOffset = {
          x: pos.clientX - rect.left,
          y: pos.clientY - rect.top
        };
        this.playerElement.style.cursor = 'grabbing';
      };

      const doDrag = (e) => {
        if (!this.isDragging) return;

        e.preventDefault();
        const pos = getPosition(e);
        let x = pos.clientX - this.dragOffset.x;
        let y = pos.clientY - this.dragOffset.y;

        // Boundary check
        const maxX = window.innerWidth - this.playerElement.offsetWidth;
        const maxY = window.innerHeight - this.playerElement.offsetHeight;

        x = Math.max(0, Math.min(x, maxX));
        y = Math.max(0, Math.min(y, maxY));

        this.playerElement.style.left = `${x}px`;
        this.playerElement.style.top = `${y}px`;
        this.playerElement.style.right = 'auto';
        this.playerElement.style.bottom = 'auto';
        this.playerElement.style.transform = 'none';
      };

      const endDrag = () => {
        this.isDragging = false;
        this.playerElement.style.cursor = 'move';
      };

      // Mouse events
      this.playerElement.addEventListener('mousedown', startDrag);
      document.addEventListener('mousemove', doDrag);
      document.addEventListener('mouseup', endDrag);

      // Touch events for mobile
      this.playerElement.addEventListener('touchstart', startDrag, { passive: false });
      document.addEventListener('touchmove', doDrag, { passive: false });
      document.addEventListener('touchend', endDrag);
    },

    // Bind all events
    bindEvents: function() {
      // Toggle size button
      document.querySelector('.toggle-size-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleSize();
      });

      // Control buttons
      document.querySelector('.play-btn').addEventListener('click', () => this.togglePlay());
      document.querySelector('.prev-btn').addEventListener('click', () => this.prevTrack());
      document.querySelector('.next-btn').addEventListener('click', () => this.nextTrack());
      document.querySelector('.replay-btn').addEventListener('click', () => this.replay());

      // Progress bar
      document.querySelector('.progress-bar').addEventListener('click', (e) => this.seek(e));

      // Volume
      document.querySelector('.volume-slider').addEventListener('click', (e) => this.setVolume(e));

      // Audio events
      this.audio.addEventListener('timeupdate', () => this.updateProgress());
      this.audio.addEventListener('ended', () => this.nextTrack('auto'));
      this.audio.addEventListener('loadedmetadata', () => this.updateProgress());

      // Make draggable
      this.makeDraggable();
    }
  };

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => MusicPlayer.init());
  } else {
    MusicPlayer.init();
  }
})();
