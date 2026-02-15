export function showFormattedDate(date, locale = 'en-US', options = {}) {
  return new Date(date).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  });
}

export function sleep(time = 1000) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

/**
 * Announce message to screen readers
 * @param {string} message - Message to announce
 */
export function announceToScreenReader(message) {
  const announcer = document.getElementById('announcements');
  if (announcer) {
    announcer.textContent = message;
    // Clear after a short delay
    setTimeout(() => {
      announcer.textContent = '';
    }, 1000);
  }
}

// Export utility modules
export { default as dbManager } from './indexeddb';
export { default as pushNotificationManager } from './push-notification';
export { default as syncManager } from './sync-manager';
