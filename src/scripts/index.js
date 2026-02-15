// CSS imports
import '../styles/styles.css';

import App from './pages/app';
import { dbManager, pushNotificationManager, syncManager } from './utils';

// Register service worker
async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('./service-worker.js', {
        scope: './',
      });
      console.log('Service Worker registered successfully:', registration);
      
      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        console.log('Service Worker update found');
        
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('New Service Worker available');
            // You could show a notification to the user here
          }
        });
      });

      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  } else {
    console.warn('Service Workers are not supported');
    return null;
  }
}

// Initialize PWA features
async function initializePWA() {
  console.log('Initializing PWA features...');

  // Register service worker
  await registerServiceWorker();

  // Initialize IndexedDB
  try {
    await dbManager.init();
    console.log('IndexedDB initialized');
  } catch (error) {
    console.error('Failed to initialize IndexedDB:', error);
  }

  // Initialize push notifications
  try {
    await pushNotificationManager.init();
    console.log('Push notification manager initialized');
  } catch (error) {
    console.error('Failed to initialize push notifications:', error);
  }

  // Initialize sync manager
  try {
    await syncManager.init();
    console.log('Sync manager initialized');
  } catch (error) {
    console.error('Failed to initialize sync manager:', error);
  }

  // Listen for app install prompt
  let deferredPrompt;
  window.addEventListener('beforeinstallprompt', (e) => {
    console.log('Install prompt available');
    e.preventDefault();
    deferredPrompt = e;
    
    // Show custom install button if you have one
    const installButton = document.querySelector('#install-button');
    if (installButton) {
      installButton.style.display = 'block';
      installButton.addEventListener('click', async () => {
        if (deferredPrompt) {
          deferredPrompt.prompt();
          const { outcome } = await deferredPrompt.userChoice;
          console.log(`User response to install prompt: ${outcome}`);
          deferredPrompt = null;
          installButton.style.display = 'none';
        }
      });
    }
  });

  // Listen for app installed event
  window.addEventListener('appinstalled', () => {
    console.log('PWA was installed');
    deferredPrompt = null;
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  console.log('DOM Content Loaded');
  
  // Initialize PWA features
  await initializePWA();

  const contentElement = document.querySelector('#main-content');
  const drawerButtonElement = document.querySelector('#drawer-button');
  const navigationDrawerElement = document.querySelector('#navigation-drawer');
  
  console.log('Elements found:', {
    content: !!contentElement,
    drawerButton: !!drawerButtonElement,
    navigationDrawer: !!navigationDrawerElement
  });

  const app = new App({
    content: contentElement,
    drawerButton: drawerButtonElement,
    navigationDrawer: navigationDrawerElement,
  });
  
  console.log('App initialized, rendering page...');
  await app.renderPage();
  console.log('Initial page rendered');

  window.addEventListener('hashchange', async () => {
    console.log('Hash changed to:', location.hash);
    await app.renderPage();
  });
});

