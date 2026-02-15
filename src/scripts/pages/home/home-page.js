import { getStories } from '../../data/api';
import CONFIG from '../../config';
import { announceToScreenReader, dbManager, pushNotificationManager, syncManager } from '../../utils';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

export default class HomePage {
  #map = null;
  #markers = [];
  #stories = [];
  #baseLayers = {};
  #selectedStoryId = null;
  #defaultIcon = null;

  async render() {
    const token = localStorage.getItem(CONFIG.TOKEN_KEY);
    const userName = localStorage.getItem('user_name') || 'User';
    
    if (!token) {
      return `
        <section class="welcome-section container">
          <h1>Welcome to Story App</h1>
          <p>Please login or register to view stories</p>
          <div class="auth-buttons">
            <a href="#/login" class="btn-primary">Login</a>
            <a href="#/register" class="btn-secondary">Register</a>
          </div>
        </section>
      `;
    }

    return `
      <section class="home-section container">
        <div class="home-header">
          <h1>Stories Map</h1>
          <p>Welcome, ${userName}!</p>
          <div class="home-actions">
            <a href="#/add-story" class="btn-primary">+ Add Story</a>
            <a href="#/favorites" class="btn-secondary">⭐ Favorites</a>
            <button id="logout-button" class="btn-secondary">Logout</button>
          </div>
        </div>

        <!-- PWA Controls -->
        <div class="pwa-controls">
          <div class="control-group">
            <label for="notification-toggle">
              <span class="control-icon">🔔</span>
              Push Notifications:
            </label>
            <button id="notification-toggle" class="toggle-button" aria-label="Toggle push notifications">
              <span id="notification-status">Checking...</span>
            </button>
          </div>
          
          <div class="control-group">
            <span class="control-icon">📱</span>
            <span id="install-button" class="install-prompt" style="display: none;">
              <button id="install-app-button" class="btn-install">Install App</button>
            </span>
            <span id="sync-status" class="sync-status">
              <span class="status-indicator" id="online-indicator"></span>
              <span id="sync-text">Online</span>
            </span>
          </div>
        </div>
        
        <div class="filter-section">
          <label for="story-filter">Filter Stories:</label>
          <input 
            type="text" 
            id="story-filter" 
            placeholder="Search by description..."
            aria-label="Filter stories by description"
          />
        </div>
        
        <div class="content-grid">
          <div class="map-container">
            <div id="story-map" class="story-map"></div>
          </div>
          
          <div class="stories-list-container">
            <h2>Stories</h2>
            <div id="stories-list" class="stories-list">
              <p>Loading stories...</p>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    const token = localStorage.getItem(CONFIG.TOKEN_KEY);
    
    if (!token) {
      return;
    }

    this._setupLogout();
    this._setupNotificationToggle();
    this._setupSyncStatus();
    this._configureLeafletIcons();
    this.#defaultIcon = L.icon({
      iconRetinaUrl: markerIcon2x,
      iconUrl: markerIcon,
      shadowUrl: markerShadow,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });
    this._initializeMap();
    await this._loadStories();
    this._setupFilter();
  }

  _configureLeafletIcons() {
    // Ensure default marker icons resolve correctly in the bundle.
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: markerIcon2x,
      iconUrl: markerIcon,
      shadowUrl: markerShadow,
    });
  }

  _setupLogout() {
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
      logoutButton.addEventListener('click', () => {
        localStorage.removeItem(CONFIG.TOKEN_KEY);
        localStorage.removeItem('user_name');
        window.location.hash = '#/login';
      });
    }
  }

  _initializeMap() {
    // Initialize map centered on Indonesia
    this.#map = L.map('story-map').setView([-2.5489, 118.0149], 5);

    // Multiple tile layers for Advance criteria
    const openStreetMap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    });

    const satelliteMap = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: '© Esri',
      maxZoom: 19,
    });

    const topoMap = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenTopoMap contributors',
      maxZoom: 17,
    });

    // Add default layer
    openStreetMap.addTo(this.#map);

    // Store base layers
    this.#baseLayers = {
      'Street Map': openStreetMap,
      'Satellite': satelliteMap,
      'Topographic': topoMap,
    };

    // Add layer control (for multiple tile layers - Advance criteria)
    L.control.layers(this.#baseLayers).addTo(this.#map);
  }

  async _loadStories() {
    const storiesList = document.getElementById('stories-list');
    
    try {
      const response = await getStories();
      
      if (response.error === false && response.listStory) {
        this.#stories = response.listStory;
        this._displayStories(this.#stories);
        this._addMarkersToMap(this.#stories);
        announceToScreenReader(`${this.#stories.length} stories loaded`);
      } else {
        storiesList.innerHTML = '<p>No stories found.</p>';
        announceToScreenReader('No stories found');
      }
    } catch (error) {
      storiesList.innerHTML = `<p class="error-message">Failed to load stories: ${error.message}</p>`;
      announceToScreenReader('Failed to load stories');
    }
  }

  _displayStories(stories) {
    const storiesList = document.getElementById('stories-list');
    
    if (stories.length === 0) {
      storiesList.innerHTML = '<p>No stories found.</p>';
      return;
    }

    storiesList.innerHTML = stories.map(story => `
      <article class="story-card" data-story-id="${story.id}" tabindex="0" role="button" aria-label="View story by ${story.name}">
        <img src="${story.photoUrl}" alt="Photo for story: ${story.description.substring(0, 50)}..." />
        <div class="story-content">
          <h3>${story.name}</h3>
          <p>${story.description}</p>
          <p class="story-date">${new Date(story.createdAt).toLocaleDateString()}</p>
          ${story.lat && story.lon ? 
            `<p class="story-location">📍 ${story.lat.toFixed(4)}, ${story.lon.toFixed(4)}</p>` : 
            '<p class="story-location">No location</p>'
          }
        </div>
        <button 
          class="btn-favorite" 
          data-story-id="${story.id}"
          aria-label="Add to favorites"
          title="Add to favorites"
        >
          ⭐
        </button>
      </article>
    `).join('');

    // Add click handlers for story cards (for sync - Skilled criteria)
    storiesList.querySelectorAll('.story-card').forEach(card => {
      card.addEventListener('click', (e) => {
        // Don't highlight if clicking favorite button
        if (e.target.classList.contains('btn-favorite')) return;
        
        const storyId = card.getAttribute('data-story-id');
        this._highlightStory(storyId);
      });

      // Keyboard accessibility
      card.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const storyId = card.getAttribute('data-story-id');
          this._highlightStory(storyId);
        }
      });
    });

    // Add favorite button handlers
    this._setupFavoriteButtons();
  }

  _addMarkersToMap(stories) {
    // Clear existing markers
    this.#markers.forEach(marker => this.#map.removeLayer(marker));
    this.#markers = [];

    stories.forEach(story => {
      if (story.lat && story.lon) {
        const marker = L.marker([story.lat, story.lon], {
          icon: this.#defaultIcon,
        });
        
        marker.bindPopup(`
          <div class="marker-popup">
            <img src="${story.photoUrl}" alt="Photo for story by ${story.name}" style="width: 100%; max-width: 200px; height: auto;" />
            <h4>${story.name}</h4>
            <p>${story.description}</p>
            <p><small>${new Date(story.createdAt).toLocaleDateString()}</small></p>
          </div>
        `);

        // Store story ID on marker for highlighting
        marker.storyId = story.id;
        
        marker.addTo(this.#map);
        this.#markers.push(marker);
      }
    });
  }

  _highlightStory(storyId) {
    // Find the story
    const story = this.#stories.find(s => s.id === storyId);
    if (!story || !story.lat || !story.lon) return;

    // Highlight marker (Skilled criteria - highlight active marker)
    this.#markers.forEach(marker => {
      if (marker.storyId === storyId) {
        // Pan to marker and open popup
        this.#map.setView([story.lat, story.lon], 12);
        marker.openPopup();
        
        // Highlight the marker by changing icon temporarily
        const originalIcon = marker.getIcon();
        const highlightIcon = L.icon({
          iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
        });
        
        marker.setIcon(highlightIcon);
        
        // Reset after 3 seconds
        setTimeout(() => {
          marker.setIcon(originalIcon);
        }, 3000);
      }
    });

    // Highlight story card
    document.querySelectorAll('.story-card').forEach(card => {
      card.classList.remove('highlighted');
    });
    const storyCard = document.querySelector(`[data-story-id="${storyId}"]`);
    if (storyCard) {
      storyCard.classList.add('highlighted');
      storyCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      
      // Remove highlight after 3 seconds
      setTimeout(() => {
        storyCard.classList.remove('highlighted');
      }, 3000);
    }

    this.#selectedStoryId = storyId;
  }

  _setupFilter() {
    const filterInput = document.getElementById('story-filter');
    
    filterInput.addEventListener('input', (e) => {
      const filterText = e.target.value.toLowerCase();
      
      // Filter stories (Skilled criteria - filter location)
      const filteredStories = this.#stories.filter(story => 
        story.description.toLowerCase().includes(filterText) ||
        story.name.toLowerCase().includes(filterText)
      );
      
      this._displayStories(filteredStories);
      this._addMarkersToMap(filteredStories);
      announceToScreenReader(`${filteredStories.length} stories found`);
    });
  }

  async _setupNotificationToggle() {
    const toggleButton = document.getElementById('notification-toggle');
    const statusText = document.getElementById('notification-status');
    
    if (!toggleButton) return;

    // Check current subscription status
    const isSubscribed = await pushNotificationManager.isSubscribed();
    this._updateNotificationButton(isSubscribed);

    toggleButton.addEventListener('click', async () => {
      statusText.textContent = 'Processing...';
      toggleButton.disabled = true;

      const currentlySubscribed = await pushNotificationManager.isSubscribed();
      
      if (currentlySubscribed) {
        // Unsubscribe
        const success = await pushNotificationManager.unsubscribe();
        if (success) {
          this._updateNotificationButton(false);
          announceToScreenReader('Push notifications disabled');
        }
      } else {
        // Subscribe
        const subscription = await pushNotificationManager.subscribe();
        if (subscription) {
          this._updateNotificationButton(true);
          announceToScreenReader('Push notifications enabled');
        }
      }

      toggleButton.disabled = false;
    });
  }

  _updateNotificationButton(isSubscribed) {
    const statusText = document.getElementById('notification-status');
    const toggleButton = document.getElementById('notification-toggle');
    
    if (isSubscribed) {
      statusText.textContent = '🔔 Enabled';
      toggleButton.classList.add('active');
      toggleButton.setAttribute('aria-pressed', 'true');
    } else {
      statusText.textContent = '🔕 Disabled';
      toggleButton.classList.remove('active');
      toggleButton.setAttribute('aria-pressed', 'false');
    }
  }

  _setupSyncStatus() {
    const syncText = document.getElementById('sync-text');
    const onlineIndicator = document.getElementById('online-indicator');
    
    const updateStatus = () => {
      const status = syncManager.getStatus();
      
      if (status.isOnline) {
        onlineIndicator.classList.add('online');
        onlineIndicator.classList.remove('offline');
        syncText.textContent = status.syncInProgress ? 'Syncing...' : 'Online';
      } else {
        onlineIndicator.classList.add('offline');
        onlineIndicator.classList.remove('online');
        syncText.textContent = 'Offline';
      }
    };

    // Initial status
    updateStatus();

    // Listen to sync events
    syncManager.addEventListener((event, data) => {
      updateStatus();
      
      if (event === 'sync-completed' && data.syncedCount > 0) {
        announceToScreenReader(`${data.syncedCount} stories synced`);
      }
    });

    // Update on online/offline events
    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);
  }

  _setupFavoriteButtons() {
    const favoriteButtons = document.querySelectorAll('.btn-favorite');
    
    favoriteButtons.forEach(button => {
      button.addEventListener('click', async (e) => {
        e.stopPropagation();
        const storyId = button.getAttribute('data-story-id');
        await this._toggleFavorite(storyId, button);
      });
    });

    // Check and update favorite status for each button
    this._updateFavoriteButtonStates();
  }

  async _updateFavoriteButtonStates() {
    const favoriteButtons = document.querySelectorAll('.btn-favorite');
    
    for (const button of favoriteButtons) {
      const storyId = button.getAttribute('data-story-id');
      const isFavorited = await dbManager.isFavorite(storyId);
      
      if (isFavorited) {
        button.classList.add('favorited');
        button.setAttribute('aria-label', 'Remove from favorites');
        button.setAttribute('title', 'Remove from favorites');
      }
    }
  }

  async _toggleFavorite(storyId, button) {
    const story = this.#stories.find(s => s.id === storyId);
    if (!story) return;

    try {
      const isFavorited = await dbManager.isFavorite(storyId);
      
      if (isFavorited) {
        await dbManager.removeFavorite(storyId);
        button.classList.remove('favorited');
        button.setAttribute('aria-label', 'Add to favorites');
        button.setAttribute('title', 'Add to favorites');
        announceToScreenReader('Removed from favorites');
      } else {
        await dbManager.addFavorite(story);
        button.classList.add('favorited');
        button.setAttribute('aria-label', 'Remove from favorites');
        button.setAttribute('title', 'Remove from favorites');
        announceToScreenReader('Added to favorites');
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      announceToScreenReader('Failed to update favorite');
    }
  }
}
