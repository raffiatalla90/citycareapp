import CONFIG from '../config';

const VAPID_PUBLIC_KEY = 'BN_sgx2Ps3Tsjw8sHo-1T0RS3ov3TJCzzRoJ2JKXbJmUVixDLBi7wRuLb0FCCaLCU-CdlDpGi0F3jI4swDNy1Yw';

class PushNotificationManager {
  constructor() {
    this.registration = null;
    this.subscription = null;
  }

  // Initialize push notifications
  async init() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications are not supported');
      return false;
    }

    try {
      // Wait for service worker to be ready
      this.registration = await navigator.serviceWorker.ready;
      console.log('Service Worker ready for push notifications');

      // Check if already subscribed
      this.subscription = await this.registration.pushManager.getSubscription();
      
      if (this.subscription) {
        console.log('Already subscribed to push notifications');
        this.saveSubscriptionToLocalStorage(this.subscription);
      }

      return true;
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
      return false;
    }
  }

  // Request notification permission
  async requestPermission() {
    if (!('Notification' in window)) {
      console.warn('Notifications not supported');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      console.log('Notification permission:', permission);
      return permission === 'granted';
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return false;
    }
  }

  // Subscribe to push notifications
  async subscribe() {
    if (!this.registration) {
      await this.init();
    }

    if (!this.registration) {
      console.error('Service Worker not registered');
      return null;
    }

    try {
      // Request permission first
      const permissionGranted = await this.requestPermission();
      if (!permissionGranted) {
        console.warn('Notification permission denied');
        return null;
      }

      // Convert VAPID key
      const convertedVapidKey = this.urlBase64ToUint8Array(VAPID_PUBLIC_KEY);

      // Subscribe to push
      this.subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey,
      });

      console.log('Push subscription created:', this.subscription);

      // Save subscription
      await this.saveSubscriptionToServer(this.subscription);
      this.saveSubscriptionToLocalStorage(this.subscription);

      return this.subscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return null;
    }
  }

  // Unsubscribe from push notifications
  async unsubscribe() {
    if (!this.subscription) {
      this.subscription = await this.registration?.pushManager.getSubscription();
    }

    if (!this.subscription) {
      console.log('No active subscription to unsubscribe from');
      return true;
    }

    try {
      await this.subscription.unsubscribe();
      console.log('Unsubscribed from push notifications');
      
      // Remove from localStorage
      localStorage.removeItem('push_subscription');
      this.subscription = null;
      
      return true;
    } catch (error) {
      console.error('Failed to unsubscribe:', error);
      return false;
    }
  }

  // Check if currently subscribed
  async isSubscribed() {
    if (!this.registration) {
      await this.init();
    }

    if (!this.registration) {
      return false;
    }

    try {
      this.subscription = await this.registration.pushManager.getSubscription();
      return this.subscription !== null;
    } catch (error) {
      console.error('Failed to check subscription status:', error);
      return false;
    }
  }

  // Get current subscription
  async getSubscription() {
    if (!this.registration) {
      await this.init();
    }

    if (!this.registration) {
      return null;
    }

    try {
      this.subscription = await this.registration.pushManager.getSubscription();
      return this.subscription;
    } catch (error) {
      console.error('Failed to get subscription:', error);
      return null;
    }
  }

  // Save subscription to server
  async saveSubscriptionToServer(subscription) {
    const token = localStorage.getItem(CONFIG.TOKEN_KEY);
    if (!token) {
      console.warn('Not authenticated, cannot save subscription to server');
      return;
    }

    try {
      // In a real app, you would send this to your backend
      // For this demo, we'll just log it
      console.log('Subscription to save to server:', JSON.stringify(subscription));
      
      // Uncomment this if you have a backend endpoint
      /*
      const response = await fetch(`${CONFIG.BASE_URL}/push-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(subscription),
      });

      if (!response.ok) {
        throw new Error('Failed to save subscription to server');
      }
      */
    } catch (error) {
      console.error('Failed to save subscription to server:', error);
    }
  }

  // Save subscription to localStorage
  saveSubscriptionToLocalStorage(subscription) {
    try {
      localStorage.setItem('push_subscription', JSON.stringify(subscription));
    } catch (error) {
      console.error('Failed to save subscription to localStorage:', error);
    }
  }

  // Utility: Convert VAPID key
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Show a test notification
  async showTestNotification() {
    if (!this.registration) {
      await this.init();
    }

    if (Notification.permission !== 'granted') {
      await this.requestPermission();
    }

    if (Notification.permission === 'granted' && this.registration) {
      this.registration.showNotification('Story App Test', {
        body: 'Push notifications are working!',
        icon: '/images/icon-192x192.png',
        badge: '/images/icon-96x96.png',
        vibrate: [200, 100, 200],
        tag: 'test-notification',
      });
    }
  }
}

// Create singleton instance
const pushNotificationManager = new PushNotificationManager();

export default pushNotificationManager;
