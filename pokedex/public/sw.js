// Service Worker - Pokedex PWA
const CACHE_NAME = 'pokedex-v15';
const CACHE_DYNAMIC_NAME = 'pokedex-dynamic-v15';
const CACHE_IMAGES_NAME = 'pokedex-images-v15';

// APP SHELL - Recursos estáticos necesarios para que la app funcione offline
const APP_SHELL = [
  '/',
  '/index.html',
  '/src/main.js',
  '/src/App.vue',
  '/src/styles.css',
  '/src/store.js',
  '/src/api.js',
  '/src/router/index.js',
  '/src/views/Home.vue',
  '/src/views/Login.vue',
  '/src/views/Register.vue',
  '/src/views/Favorites.vue',
  '/src/views/Teams.vue',
  '/src/views/Friends.vue',
  '/src/views/Battle.vue',
  '/src/views/PokemonDetail.vue',
  '/src/views/AuthCallback.vue'
];

// INSTALL - Cachear el APP SHELL
self.addEventListener('install', event => {
  // console.log('[SW] Instalando Service Worker...', event);
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        // console.log('[SW] Cacheando APP SHELL');
        return cache.addAll(APP_SHELL);
      })
      .then(() => {
        // Activar el nuevo SW automáticamente sin esperar
        return self.skipWaiting();
      })
  );
});

// ACTIVATE - Limpiar caches antiguos
self.addEventListener('activate', event => {
  // console.log('[SW] Activando Service Worker...', event);
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            // Eliminar caches que no sean el actual ni el dinámico ni el de imágenes
            if (cacheName !== CACHE_NAME && 
                cacheName !== CACHE_DYNAMIC_NAME && 
                cacheName !== CACHE_IMAGES_NAME) {
              console.log('[SW] Eliminando cache antigua:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        // Tomar control de todas las páginas inmediatamente
        return self.clients.claim();
      })
  );
});

// FETCH - Estrategia: Network First para API, Cache First para estáticos
self.addEventListener('fetch', event => {
  const { request } = event;
  
  // Filtrar extensiones de Chrome y URLs no HTTP/HTTPS al inicio
  if (!request.url.startsWith('http://') && !request.url.startsWith('https://')) {
    return; // Dejar que el navegador maneje estas requests
  }
  
  // NO cachear peticiones que no sean GET
  if (request.method !== 'GET') {
    return; // Dejar que el navegador maneje POST, PUT, DELETE, etc.
  }
  
  try {
    const url = new URL(request.url);

    // Network First para endpoints de API que cambian frecuentemente
    const isDynamicAPI = url.pathname.includes('/api/favorites') || 
                         url.pathname.includes('/api/friends') || 
                         url.pathname.includes('/api/teams');

  if (isDynamicAPI) {
    // Estrategia Network First: Primero red, luego cache si falla
    event.respondWith(
      fetch(request)
        .then(networkResponse => {
          // Actualizar cache con la respuesta más reciente
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_DYNAMIC_NAME).then(cache => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Si falla la red, servir desde cache
          console.log('[SW] Red no disponible, sirviendo desde cache:', request.url);
          return caches.match(request);
        })
    );
    return;
  }

  // Cache First para imágenes de Pokémon (PokeAPI)
  const isPokemonImage = url.hostname.includes('pokeapi.co') || 
                         url.hostname.includes('raw.githubusercontent.com');
  
  if (isPokemonImage) {
    event.respondWith(
      caches.match(request)
        .then(cacheResponse => {
          if (cacheResponse) {
            return cacheResponse;
          }
          
          return fetch(request).then(networkResponse => {
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_IMAGES_NAME).then(cache => {
                cache.put(request, responseToCache);
              });
            }
            return networkResponse;
          });
        })
    );
    return;
  }

  // Cache First para recursos estáticos (APP SHELL y archivos estáticos)
  event.respondWith(
    caches.match(request)
      .then(cacheResponse => {
        if (cacheResponse) {
          return cacheResponse;
        }

        // Si no está en cache, hacer fetch a la red
        return fetch(request)
          .then(networkResponse => {
            // Solo cachear respuestas exitosas
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type === 'error') {
              return networkResponse;
            }

            // Clonar la respuesta porque solo se puede usar una vez
            const responseToCache = networkResponse.clone();

            // Guardar en cache dinámico
            caches.open(CACHE_DYNAMIC_NAME)
              .then(cache => {
                // Solo cachear si no es extensión de Chrome
                if (request.url.startsWith('http://') || request.url.startsWith('https://')) {
                  cache.put(request, responseToCache);
                }
              });

            return networkResponse;
          })
          .catch(error => {
            console.log('[SW] Error de red, buscando en cache dinámico:', error);
            // Si falla la red, intentar buscar en cache dinámico
            return caches.match(request);
          });
      })
  );
  } catch (error) {
    // Ignorar errores de URLs no soportadas
    console.log('[SW] Error procesando fetch:', error);
  }
});

// Mensaje desde el cliente para actualizar el SW
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// SYNC - Sincronización en segundo plano para peticiones offline
self.addEventListener('sync', event => {
  console.log('[SW] Evento sync detectado:', event.tag);
  
  if (event.tag === 'sync-requests') {
    event.waitUntil(syncPendingRequests());
  }
});

// Función para sincronizar peticiones pendientes
async function syncPendingRequests() {
  console.log('[SW] 🔄 Iniciando sincronización de peticiones pendientes...');
  
  try {
    // Abrir IndexedDB
    const db = await openIndexedDB();
    const transaction = db.transaction(['pending-requests'], 'readwrite');
    const store = transaction.objectStore('pending-requests');
    const requests = await getAllFromStore(store);
    
    if (requests.length === 0) {
      console.log('[SW] No hay peticiones pendientes para sincronizar');
      return;
    }
    
    console.log(`[SW] 📋 Encontradas ${requests.length} peticiones pendientes`);
    
    // Ejecutar cada petición
    for (const requestData of requests) {
      try {
        console.log('[SW] 🚀 Ejecutando petición:', requestData.url);
        
        const response = await fetch(requestData.url, {
          method: requestData.method,
          headers: requestData.headers,
          body: requestData.body,
          credentials: 'include'
        });
        
        if (response.ok) {
          console.log('[SW] ✅ Petición sincronizada exitosamente:', requestData.url);
          
          // Eliminar de IndexedDB después de ejecutar exitosamente
          await deleteFromStore(db, requestData.id);
        } else {
          console.warn('[SW] ⚠️ Petición falló con código:', response.status);
          // Podríamos eliminarla si queremos o dejarla para reintentar
          // Por ahora la dejamos para reintentar en la próxima sincronización
        }
      } catch (error) {
        console.error('[SW] ❌ Error al ejecutar petición:', error);
        // Dejar la petición para reintentar más tarde
      }
    }
    
    console.log('[SW] ✅ Sincronización completada');
  } catch (error) {
    console.error('[SW] ❌ Error en sincronización:', error);
    throw error; // Esto hará que el sync se reintente automáticamente
  }
}

// Funciones auxiliares para IndexedDB en el Service Worker
function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('pokedex-offline-db', 1);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pending-requests')) {
        db.createObjectStore('pending-requests', { keyPath: 'id', autoIncrement: true });
      }
    };
    
    request.onsuccess = (event) => {
      resolve(event.target.result);
    };
    
    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
}

function getAllFromStore(store) {
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    
    request.onsuccess = () => {
      resolve(request.result);
    };
    
    request.onerror = () => {
      reject(request.error);
    };
  });
}

function deleteFromStore(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pending-requests'], 'readwrite');
    const store = transaction.objectStore('pending-requests');
    const request = store.delete(id);
    
    request.onsuccess = () => {
      resolve();
    };
    
    request.onerror = () => {
      reject(request.error);
    };
  });
}

// ============================================
// PUSH NOTIFICATIONS
// ============================================

// PUSH - Recibir push notification
self.addEventListener('push', event => {
  console.log('[SW] 📬 Push notification recibida');
  
  let notificationData = {
    title: 'Pokedex',
    body: 'Tienes una nueva notificación',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-72.png',
    data: {}
  };
  
  // Parsear datos del push
  if (event.data) {
    try {
      // Intentar parsear como JSON
      const text = event.data.text();
      
      // Verificar si es JSON válido
      if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
        notificationData = JSON.parse(text);
        console.log('[SW] Datos del push (JSON):', notificationData);
      } else {
        // Es texto plano, usar como body
        notificationData.body = text;
        console.log('[SW] Datos del push (texto):', text);
      }
    } catch (error) {
      // Si falla el parseo, usar el texto directamente
      try {
        notificationData.body = event.data.text();
        console.log('[SW] Usando texto plano:', notificationData.body);
      } catch (e) {
        console.warn('[SW] No se pudo leer los datos del push:', e);
      }
    }
  }
  
  // Mostrar la notificación
  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon || '/icons/icon-192.png',
      badge: notificationData.badge || '/icons/icon-72.png',
      tag: notificationData.tag || 'default',
      data: notificationData.data || {},
      actions: notificationData.actions || [],
      requireInteraction: notificationData.requireInteraction || false,
      vibrate: [200, 100, 200]
    })
  );
});

// NOTIFICATION CLICK - Manejar clic en notificación
self.addEventListener('notificationclick', event => {
  console.log('[SW] 🖱️ Click en notificación:', event.notification.tag);
  
  event.notification.close();
  
  const notificationData = event.notification.data || {};
  const action = event.action;
  let url = notificationData.url || '/';
  
  // Manejar acciones específicas
  if (action === 'accept' && notificationData.type === 'battle-challenge') {
    url = `/battle?id=${notificationData.battleId}&action=accept`;
  } else if (action === 'view') {
    url = notificationData.url || '/';
  }
  
  // Abrir o enfocar ventana del cliente
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        // Buscar si ya hay una ventana abierta
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus().then(client => {
              // Enviar mensaje al cliente para navegar
              client.postMessage({
                type: 'NOTIFICATION_CLICK',
                url: url,
                data: notificationData
              });
              return client;
            });
          }
        }
        
        // Si no hay ventana abierta, abrir una nueva
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

// NOTIFICATION CLOSE - Manejar cierre de notificación
self.addEventListener('notificationclose', event => {
  console.log('[SW] 🔕 Notificación cerrada:', event.notification.tag);
  
  // Aquí podrías enviar analytics sobre notificaciones cerradas
  const notificationData = event.notification.data || {};
  
  // Enviar evento de analytics si es necesario
  if (notificationData.trackClose) {
    event.waitUntil(
      fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          events: [{
            category: 'Push Notification',
            action: 'Close',
            label: event.notification.tag
          }]
        })
      }).catch(err => console.error('[SW] Error enviando analytics:', err))
    );
  }
});

