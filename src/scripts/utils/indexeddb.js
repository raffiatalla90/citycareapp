const DB_NAME = 'StoryAppDB';
const DB_VERSION = 1;

class IndexedDBManager {
  constructor() {
    this.db = null;
  }

  // Initialize database
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB initialized successfully');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        console.log('Upgrading IndexedDB schema...');

        // Create object stores if they don't exist
        
        // Favorites store
        if (!db.objectStoreNames.contains('favorites')) {
          const favoritesStore = db.createObjectStore('favorites', { keyPath: 'id' });
          favoritesStore.createIndex('createdAt', 'createdAt', { unique: false });
          favoritesStore.createIndex('name', 'name', { unique: false });
          console.log('Created favorites object store');
        }

        // Offline stories store (for sync)
        if (!db.objectStoreNames.contains('offline-stories')) {
          const offlineStore = db.createObjectStore('offline-stories', { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          offlineStore.createIndex('createdAt', 'createdAt', { unique: false });
          offlineStore.createIndex('synced', 'synced', { unique: false });
          console.log('Created offline-stories object store');
        }
      };
    });
  }

  // Ensure database is initialized
  async ensureDB() {
    if (!this.db) {
      await this.init();
    }
  }

  // ============= FAVORITES OPERATIONS =============

  // Add story to favorites
  async addFavorite(story) {
    await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['favorites'], 'readwrite');
      const store = transaction.objectStore('favorites');
      
      const favoriteData = {
        ...story,
        favoritedAt: new Date().toISOString(),
      };

      const request = store.add(favoriteData);

      request.onsuccess = () => {
        console.log('Story added to favorites:', story.id);
        resolve(favoriteData);
      };

      request.onerror = () => {
        console.error('Failed to add favorite:', request.error);
        reject(request.error);
      };
    });
  }

  // Remove story from favorites
  async removeFavorite(storyId) {
    await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['favorites'], 'readwrite');
      const store = transaction.objectStore('favorites');
      const request = store.delete(storyId);

      request.onsuccess = () => {
        console.log('Story removed from favorites:', storyId);
        resolve();
      };

      request.onerror = () => {
        console.error('Failed to remove favorite:', request.error);
        reject(request.error);
      };
    });
  }

  // Get all favorites
  async getAllFavorites() {
    await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['favorites'], 'readonly');
      const store = transaction.objectStore('favorites');
      const request = store.getAll();

      request.onsuccess = () => {
        console.log('Retrieved favorites:', request.result.length);
        resolve(request.result);
      };

      request.onerror = () => {
        console.error('Failed to get favorites:', request.error);
        reject(request.error);
      };
    });
  }

  // Check if story is favorited
  async isFavorite(storyId) {
    await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['favorites'], 'readonly');
      const store = transaction.objectStore('favorites');
      const request = store.get(storyId);

      request.onsuccess = () => {
        resolve(request.result !== undefined);
      };

      request.onerror = () => {
        console.error('Failed to check favorite:', request.error);
        reject(request.error);
      };
    });
  }

  // Search favorites by name or description
  async searchFavorites(query) {
    const favorites = await this.getAllFavorites();
    const lowerQuery = query.toLowerCase();
    
    return favorites.filter(story => 
      story.name?.toLowerCase().includes(lowerQuery) ||
      story.description?.toLowerCase().includes(lowerQuery)
    );
  }

  // Sort favorites
  async sortFavorites(sortBy = 'createdAt', order = 'desc') {
    const favorites = await this.getAllFavorites();
    
    return favorites.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      // Handle dates
      if (sortBy === 'createdAt' || sortBy === 'favoritedAt') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }
      
      // Handle strings
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (order === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }

  // ============= OFFLINE STORIES OPERATIONS =============

  // Add offline story (for sync later)
  async addOfflineStory(storyData) {
    await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['offline-stories'], 'readwrite');
      const store = transaction.objectStore('offline-stories');
      
      const offlineStory = {
        ...storyData,
        createdAt: new Date().toISOString(),
        synced: false,
      };

      const request = store.add(offlineStory);

      request.onsuccess = () => {
        console.log('Offline story saved:', request.result);
        resolve({ ...offlineStory, id: request.result });
      };

      request.onerror = () => {
        console.error('Failed to save offline story:', request.error);
        reject(request.error);
      };
    });
  }

  // Get all offline stories
  async getAllOfflineStories() {
    await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['offline-stories'], 'readonly');
      const store = transaction.objectStore('offline-stories');
      const request = store.getAll();

      request.onsuccess = () => {
        console.log('Retrieved offline stories:', request.result.length);
        resolve(request.result);
      };

      request.onerror = () => {
        console.error('Failed to get offline stories:', request.error);
        reject(request.error);
      };
    });
  }

  // Get unsynced offline stories
  async getUnsyncedStories() {
    await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['offline-stories'], 'readonly');
      const store = transaction.objectStore('offline-stories');
      const request = store.getAll();

      request.onsuccess = () => {
        // Filter for unsynced stories
        const unsyncedStories = request.result.filter(story => !story.synced);
        console.log('Retrieved unsynced stories:', unsyncedStories.length);
        resolve(unsyncedStories);
      };

      request.onerror = () => {
        console.error('Failed to get unsynced stories:', request.error);
        reject(request.error);
      };
    });
  }

  // Mark story as synced
  async markStorySynced(storyId) {
    await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['offline-stories'], 'readwrite');
      const store = transaction.objectStore('offline-stories');
      const getRequest = store.get(storyId);

      getRequest.onsuccess = () => {
        const story = getRequest.result;
        if (story) {
          story.synced = true;
          story.syncedAt = new Date().toISOString();
          
          const updateRequest = store.put(story);
          updateRequest.onsuccess = () => {
            console.log('Story marked as synced:', storyId);
            resolve();
          };
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          resolve(); // Story not found, already deleted
        }
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  // Delete offline story
  async deleteOfflineStory(storyId) {
    await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['offline-stories'], 'readwrite');
      const store = transaction.objectStore('offline-stories');
      const request = store.delete(storyId);

      request.onsuccess = () => {
        console.log('Offline story deleted:', storyId);
        resolve();
      };

      request.onerror = () => {
        console.error('Failed to delete offline story:', request.error);
        reject(request.error);
      };
    });
  }

  // Clear all synced stories
  async clearSyncedStories() {
    await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['offline-stories'], 'readwrite');
      const store = transaction.objectStore('offline-stories');
      const index = store.index('synced');
      const range = IDBKeyRange.only(true); // Only get synced stories
      const request = index.openCursor(range);

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          console.log('Cleared all synced stories');
          resolve();
        }
      };

      request.onerror = () => {
        console.error('Failed to clear synced stories:', request.error);
        reject(request.error);
      };
    });
  }

  // ============= UTILITY OPERATIONS =============

  // Clear all data
  async clearAll() {
    await this.ensureDB();
    
    const stores = ['favorites', 'offline-stories'];
    
    for (const storeName of stores) {
      await new Promise((resolve, reject) => {
        const transaction = this.db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.clear();

        request.onsuccess = () => {
          console.log(`Cleared ${storeName}`);
          resolve();
        };

        request.onerror = () => {
          console.error(`Failed to clear ${storeName}:`, request.error);
          reject(request.error);
        };
      });
    }
  }

  // Get database statistics
  async getStats() {
    await this.ensureDB();
    
    const favorites = await this.getAllFavorites();
    const offlineStories = await this.getAllOfflineStories();
    const unsyncedStories = await this.getUnsyncedStories();

    return {
      favoritesCount: favorites.length,
      offlineStoriesCount: offlineStories.length,
      unsyncedStoriesCount: unsyncedStories.length,
    };
  }
}

// Create singleton instance
const dbManager = new IndexedDBManager();

export default dbManager;
