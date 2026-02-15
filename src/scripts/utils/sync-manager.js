import dbManager from './indexeddb';
import CONFIG from '../config';

class SyncManager {
  constructor() {
    this.syncInProgress = false;
    this.listeners = new Set();
  }

  // Initialize sync manager
  async init() {
    console.log('[SyncManager] Initializing...');

    // Listen for online/offline events
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());

    // Listen for messages from service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'STORY_SYNCED') {
          this.notifyListeners('story-synced', event.data.storyId);
        }
      });
    }

    // Register background sync if supported
    if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
      console.log('[SyncManager] Background Sync is supported');
    } else {
      console.warn('[SyncManager] Background Sync is not supported');
    }

    // Try to sync on initialization if online
    if (navigator.onLine) {
      await this.syncOfflineStories();
    }
  }

  // Handle online event
  async handleOnline() {
    console.log('[SyncManager] Device is online');
    this.notifyListeners('online');
    
    // Try to sync offline stories
    await this.syncOfflineStories();
  }

  // Handle offline event
  handleOffline() {
    console.log('[SyncManager] Device is offline');
    this.notifyListeners('offline');
  }

  // Check if online
  isOnline() {
    return navigator.onLine;
  }

  // Sync offline stories to server
  async syncOfflineStories() {
    if (this.syncInProgress) {
      console.log('[SyncManager] Sync already in progress');
      return { success: false, message: 'Sync already in progress' };
    }

    if (!this.isOnline()) {
      console.log('[SyncManager] Device is offline, cannot sync');
      return { success: false, message: 'Device is offline' };
    }

    this.syncInProgress = true;
    this.notifyListeners('sync-started');

    try {
      const unsyncedStories = await dbManager.getUnsyncedStories();
      
      if (unsyncedStories.length === 0) {
        console.log('[SyncManager] No stories to sync');
        this.syncInProgress = false;
        this.notifyListeners('sync-completed', { syncedCount: 0 });
        return { success: true, syncedCount: 0 };
      }

      console.log(`[SyncManager] Syncing ${unsyncedStories.length} offline stories...`);

      let syncedCount = 0;
      let failedCount = 0;
      const errors = [];

      for (const story of unsyncedStories) {
        try {
          await this.uploadStory(story);
          await dbManager.deleteOfflineStory(story.id);
          syncedCount++;
          this.notifyListeners('story-synced', story.id);
        } catch (error) {
          console.error('[SyncManager] Failed to sync story:', error);
          failedCount++;
          errors.push({ storyId: story.id, error: error.message });
        }
      }

      console.log(`[SyncManager] Sync completed: ${syncedCount} synced, ${failedCount} failed`);
      
      this.syncInProgress = false;
      this.notifyListeners('sync-completed', { syncedCount, failedCount, errors });

      return { 
        success: true, 
        syncedCount, 
        failedCount, 
        errors 
      };
    } catch (error) {
      console.error('[SyncManager] Sync failed:', error);
      this.syncInProgress = false;
      this.notifyListeners('sync-failed', error);
      return { success: false, message: error.message };
    }
  }

  // Upload a single story to the server
  async uploadStory(story) {
    const token = localStorage.getItem(CONFIG.TOKEN_KEY);
    if (!token) {
      throw new Error('Not authenticated');
    }

    const formData = new FormData();
    formData.append('description', story.description);
    
    // Convert base64 to blob if needed
    if (story.photo) {
      if (story.photo.startsWith('data:')) {
        // It's a base64 data URL
        const blob = await this.dataURLtoBlob(story.photo);
        formData.append('photo', blob, 'photo.jpg');
      } else if (story.photoFile) {
        // It's a File object
        formData.append('photo', story.photoFile);
      }
    }
    
    if (story.lat && story.lon) {
      formData.append('lat', story.lat);
      formData.append('lon', story.lon);
    }

    const response = await fetch(`${CONFIG.BASE_URL}/stories`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to upload story');
    }

    console.log('[SyncManager] Story uploaded successfully:', data);
    return data;
  }

  // Convert data URL to Blob
  dataURLtoBlob(dataURL) {
    return fetch(dataURL).then(res => res.blob());
  }

  // Request background sync (if supported)
  async requestBackgroundSync() {
    if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register('sync-stories');
        console.log('[SyncManager] Background sync registered');
        return true;
      } catch (error) {
        console.error('[SyncManager] Failed to register background sync:', error);
        return false;
      }
    } else {
      console.warn('[SyncManager] Background sync not supported');
      return false;
    }
  }

  // Add event listener
  addEventListener(callback) {
    this.listeners.add(callback);
  }

  // Remove event listener
  removeEventListener(callback) {
    this.listeners.delete(callback);
  }

  // Notify all listeners
  notifyListeners(event, data) {
    this.listeners.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('[SyncManager] Error in listener:', error);
      }
    });
  }

  // Get sync status
  getStatus() {
    return {
      isOnline: this.isOnline(),
      syncInProgress: this.syncInProgress,
    };
  }
}

// Create singleton instance
const syncManager = new SyncManager();

export default syncManager;
