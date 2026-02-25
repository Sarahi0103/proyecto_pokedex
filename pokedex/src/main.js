import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(router)

app.mount('#app')

// Registrar Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then(registration => {
        console.log('✅ Service Worker registrado:', registration.scope);
        
        // Verificar si hay actualizaciones cada 60 segundos
        setInterval(() => {
          registration.update();
        }, 60000);

        // Escuchar cambios en el Service Worker
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          // console.log('🔄 Nueva versión del Service Worker detectada');
          
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // Hay un nuevo SW listo, activar automáticamente
              // console.log('🚀 Activando nuevo Service Worker...');
              newWorker.postMessage({ type: 'SKIP_WAITING' });
              
              // Recargar la página para usar el nuevo SW
              // window.location.reload(); // COMENTADO: Causaba loop infinito
            }
          });
        });
      })
      .catch(error => {
        console.error('❌ Error al registrar Service Worker:', error);
      });
  });
  
  // Recargar cuando el nuevo SW tome control
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true;
      console.log('🔄 Nuevo Service Worker activado, recargando...');
      window.location.reload();
    }
  });
}

// Configuración de IndexedDB para peticiones offline
let dbInstance = null;

function openDB() {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }
    
    const request = window.indexedDB.open('pokedex-offline-db', 1);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Store para peticiones pendientes
      if (!db.objectStoreNames.contains('pending-requests')) {
        db.createObjectStore('pending-requests', { keyPath: 'id', autoIncrement: true });
      }
    };
    
    request.onsuccess = (event) => {
      dbInstance = event.target.result;
      console.log('✅ IndexedDB abierta correctamente');
      resolve(dbInstance);
    };
    
    request.onerror = (event) => {
      console.error('❌ Error al abrir IndexedDB:', event.target.error);
      reject(event.target.error);
    };
  });
}

// Función para guardar petición offline
export async function saveOfflineRequest(url, options) {
  try {
    const db = await openDB();
    const transaction = db.transaction(['pending-requests'], 'readwrite');
    const store = transaction.objectStore('pending-requests');
    
    const requestData = {
      url,
      method: options.method || 'GET',
      headers: options.headers || {},
      body: options.body,
      timestamp: Date.now()
    };
    
    const request = store.add(requestData);
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        console.log('💾 Petición guardada en IndexedDB:', requestData);
        resolve(request.result);
        
        // Registrar sincronización en segundo plano
        if ('serviceWorker' in navigator && 'sync' in navigator.serviceWorker) {
          navigator.serviceWorker.ready.then((registration) => {
            return registration.sync.register('sync-requests');
          }).then(() => {
            console.log('🔄 Sincronización programada');
          }).catch(err => {
            console.warn('⚠️ Background sync no disponible:', err);
          });
        }
      };
      
      request.onerror = () => {
        console.error('❌ Error al guardar en IndexedDB:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('❌ Error en saveOfflineRequest:', error);
    throw error;
  }
}

// Función para obtener todas las peticiones pendientes
export async function getPendingRequests() {
  try {
    const db = await openDB();
    const transaction = db.transaction(['pending-requests'], 'readonly');
    const store = transaction.objectStore('pending-requests');
    const request = store.getAll();
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        resolve(request.result);
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('❌ Error al obtener peticiones pendientes:', error);
    return [];
  }
}

// Función para eliminar una petición procesada
export async function deleteOfflineRequest(id) {
  try {
    const db = await openDB();
    const transaction = db.transaction(['pending-requests'], 'readwrite');
    const store = transaction.objectStore('pending-requests');
    const request = store.delete(id);
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        console.log('🗑️ Petición eliminada de IndexedDB:', id);
        resolve();
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('❌ Error al eliminar petición:', error);
  }
}

// Inicializar la base de datos al cargar
openDB();