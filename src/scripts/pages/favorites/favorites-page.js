import { dbManager, pushNotificationManager, syncManager } from '../../utils';
import { announceToScreenReader } from '../../utils';

export default class FavoritesPage {
  #favorites = [];
  #currentSort = 'favoritedAt';
  #currentOrder = 'desc';

  async render() {
    return `
      <section class="favorites-section container">
        <div class="page-header">
          <h1>My Favorite Stories</h1>
          <p>Browse and manage your favorite stories</p>
        </div>

        <h2>Favorites Management</h2>

        <div class="favorites-controls">
          <div class="search-box">
            <label for="search-favorites">Search:</label>
            <input 
              type="text" 
              id="search-favorites" 
              placeholder="Search by name or description..."
              aria-label="Search favorite stories"
            />
          </div>

          <div class="sort-controls">
            <label for="sort-by">Sort by:</label>
            <select id="sort-by" aria-label="Sort favorites by">
              <option value="favoritedAt">Date Added</option>
              <option value="createdAt">Date Created</option>
              <option value="name">Name</option>
            </select>

            <label for="sort-order">Order:</label>
            <select id="sort-order" aria-label="Sort order">
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>
        </div>

        <div id="favorites-stats" class="favorites-stats"></div>

        <div id="favorites-list" class="favorites-list">
          <p>Loading favorites...</p>
        </div>
      </section>
    `;
  }

  async afterRender() {
    await this._loadFavorites();
    this._setupSearch();
    this._setupSort();
    this._displayStats();
  }

  async _loadFavorites() {
    const favoritesList = document.getElementById('favorites-list');
    
    try {
      this.#favorites = await dbManager.sortFavorites(this.#currentSort, this.#currentOrder);
      this._displayFavorites(this.#favorites);
      announceToScreenReader(`${this.#favorites.length} favorite stories loaded`);
    } catch (error) {
      console.error('Failed to load favorites:', error);
      favoritesList.innerHTML = `<p class="error-message">Failed to load favorites: ${error.message}</p>`;
      announceToScreenReader('Failed to load favorites');
    }
  }

  _displayFavorites(favorites) {
    const favoritesList = document.getElementById('favorites-list');
    
    if (favorites.length === 0) {
      favoritesList.innerHTML = `
        <div class="empty-state">
          <p>No favorite stories yet.</p>
          <p>Visit the <a href="#/home">home page</a> to add some favorites!</p>
        </div>
      `;
      return;
    }

    favoritesList.innerHTML = favorites.map(story => `
      <article class="favorite-card" data-story-id="${story.id}">
        <img src="${story.photoUrl}" alt="Photo for story: ${story.description.substring(0, 50)}..." />
        <div class="story-content">
          <h3>${story.name}</h3>
          <p>${story.description}</p>
          <div class="story-meta">
            <p class="story-date">Created: ${new Date(story.createdAt).toLocaleDateString()}</p>
            <p class="story-date">Favorited: ${new Date(story.favoritedAt).toLocaleDateString()}</p>
            ${story.lat && story.lon ? 
              `<p class="story-location">📍 ${story.lat.toFixed(4)}, ${story.lon.toFixed(4)}</p>` : 
              '<p class="story-location">No location</p>'
            }
          </div>
        </div>
        <button 
          class="btn-remove-favorite" 
          data-story-id="${story.id}"
          aria-label="Remove from favorites"
        >
          ❌ Remove
        </button>
      </article>
    `).join('');

    // Add remove handlers
    favoritesList.querySelectorAll('.btn-remove-favorite').forEach(button => {
      button.addEventListener('click', async (e) => {
        e.stopPropagation();
        const storyId = button.getAttribute('data-story-id');
        await this._removeFavorite(storyId);
      });
    });
  }

  async _removeFavorite(storyId) {
    try {
      await dbManager.removeFavorite(storyId);
      announceToScreenReader('Story removed from favorites');
      await this._loadFavorites();
      this._displayStats();
    } catch (error) {
      console.error('Failed to remove favorite:', error);
      announceToScreenReader('Failed to remove favorite');
    }
  }

  _setupSearch() {
    const searchInput = document.getElementById('search-favorites');
    
    searchInput.addEventListener('input', async (e) => {
      const query = e.target.value.trim();
      
      if (query) {
        const results = await dbManager.searchFavorites(query);
        this._displayFavorites(results);
        announceToScreenReader(`${results.length} favorites found`);
      } else {
        await this._loadFavorites();
      }
    });
  }

  _setupSort() {
    const sortBySelect = document.getElementById('sort-by');
    const sortOrderSelect = document.getElementById('sort-order');
    
    sortBySelect.addEventListener('change', async () => {
      this.#currentSort = sortBySelect.value;
      await this._loadFavorites();
      announceToScreenReader(`Sorted by ${this.#currentSort}`);
    });

    sortOrderSelect.addEventListener('change', async () => {
      this.#currentOrder = sortOrderSelect.value;
      await this._loadFavorites();
      announceToScreenReader(`Sorted in ${this.#currentOrder}ending order`);
    });
  }

  async _displayStats() {
    const statsDiv = document.getElementById('favorites-stats');
    const stats = await dbManager.getStats();
    
    statsDiv.innerHTML = `
      <div class="stats-card">
        <span class="stat-icon">⭐</span>
        <span class="stat-value">${stats.favoritesCount}</span>
        <span class="stat-label">Favorites</span>
      </div>
      <div class="stats-card">
        <span class="stat-icon">📱</span>
        <span class="stat-value">${stats.offlineStoriesCount}</span>
        <span class="stat-label">Offline Stories</span>
      </div>
      <div class="stats-card">
        <span class="stat-icon">🔄</span>
        <span class="stat-value">${stats.unsyncedStoriesCount}</span>
        <span class="stat-label">Pending Sync</span>
      </div>
    `;
  }
}
