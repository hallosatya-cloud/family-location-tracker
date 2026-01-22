// Service Worker untuk Background Location Sync
const CACHE_NAME = 'family-tracker-v1';

self.addEventListener('install', (event) => {
  console.log('Service Worker installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activated');
  event.waitUntil(clients.claim());
});

self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);
  
  if (event.tag === 'sync-location') {
    event.waitUntil(syncLocation());
  }
});

async function syncLocation() {
  try {
    // Get cached locations
    const cache = await caches.open(CACHE_NAME);
    const cachedData = await cache.match('pending-locations');
    
    if (cachedData) {
      const locations = await cachedData.json();
      
      // Send to server
      for (const loc of locations) {
        await fetch('/api/sync-location', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(loc)
        });
      }
      
      // Clear cache
      await cache.delete('pending-locations');
    }
  } catch (error) {
    console.error('Sync error:', error);
  }
}

self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  
  const options = {
    body: data.body || 'Ada pembaruan lokasi',
    icon: '/icon.png',
    badge: '/badge.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/'
    }
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Family Tracker', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});

// Handle messages from main app
self.addEventListener('message', (event) => {
  if (event.data.type === 'CACHE_LOCATION') {
    cacheLocation(event.data.location);
  }
});

async function cacheLocation(location) {
  const cache = await caches.open(CACHE_NAME);
  
  // Get existing cached locations
  let locations = [];
  const cached = await cache.match('pending-locations');
  if (cached) {
    locations = await cached.json();
  }
  
  // Add new location
  locations.push({
    ...location,
    timestamp: new Date().toISOString()
  });
  
  // Save back to cache
  await cache.put('pending-locations', new Response(JSON.stringify(locations)));
  
  // Trigger background sync
  await self.registration.sync.register('sync-location');
}

