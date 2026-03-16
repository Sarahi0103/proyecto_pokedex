// Composable para gestionar Push Notifications
import { ref, onMounted, computed } from 'vue';
import { api } from '../api';

export function usePushNotifications() {
  const isSupported = ref(false);
  const isSubscribed = ref(false);
  const subscription = ref(null);
  const publicKey = ref('');
  const loading = ref(false);
  const error = ref(null);

  async function getServiceWorkerRegistration() {
    let registration = await navigator.serviceWorker.getRegistration();

    if (!registration) {
      registration = await navigator.serviceWorker.register('/sw.js');
    }

    await navigator.serviceWorker.ready;
    return registration;
  }

  async function syncSubscriptionWithServer(sub) {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Not authenticated');
    }

    const subscriptionJSON = typeof sub.toJSON === 'function'
      ? sub.toJSON()
      : JSON.parse(JSON.stringify(sub));

    console.log('📤 Enviando suscripción al servidor...');
    console.log('📦 Datos de suscripción:', {
      endpoint: subscriptionJSON.endpoint.substring(0, 50) + '...',
      keys: Object.keys(subscriptionJSON.keys || {})
    });

    const response = await api('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription: subscriptionJSON })
    });

    subscription.value = sub;
    isSubscribed.value = true;
    console.log('✅ Respuesta del servidor:', response);

    return response;
  }

  // Verificar si el navegador soporta push notifications
  function checkSupport() {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Workers no soportados');
      return false;
    }
    
    if (!('PushManager' in window)) {
      console.warn('Push API no soportada');
      return false;
    }
    
    if (!('Notification' in window)) {
      console.warn('Notification API no soportada');
      return false;
    }
    
    return true;
  }

  // Solicitar permiso de notificaciones
  async function requestPermission() {
    if (!('Notification' in window)) {
      throw new Error('Notifications not supported');
    }
    
    const permission = await Notification.requestPermission();
    
    if (permission !== 'granted') {
      throw new Error('Notification permission denied');
    }
    
    return permission;
  }

  // Obtener la VAPID public key del servidor
  async function getPublicKey() {
    try {
      const response = await api('/api/push/vapid-public-key');
      publicKey.value = response.publicKey;
      return response.publicKey;
    } catch (err) {
      // Si VAPID keys no están configuradas, no es un error crítico
      if (err.message && err.message.includes('VAPID keys not configured')) {
        console.warn('⚠️ VAPID keys no configuradas. Las notificaciones push estarán deshabilitadas.');
        return null;
      }
      console.error('Error obteniendo VAPID public key:', err);
      throw err;
    }
  }

  // Convertir base64 a Uint8Array (necesario para VAPID)
  function urlBase64ToUint8Array(base64String) {
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

  // Suscribirse a push notifications
  async function subscribe() {
    try {
      loading.value = true;
      error.value = null;

      // Verificar soporte
      if (!checkSupport()) {
        throw new Error('Push notifications not supported');
      }

      // Solicitar permiso
      const permission = await requestPermission();
      if (permission !== 'granted') {
        throw new Error('Permission denied');
      }

      // Obtener public key
      if (!publicKey.value) {
        const key = await getPublicKey();
        if (!key) {
          // VAPID keys no configuradas, no hacer nada
          console.info('ℹ️ Push notifications no disponibles (VAPID keys no configuradas)');
          return null;
        }
      }

      const registration = await getServiceWorkerRegistration();

      const existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription) {
        console.log('📱 Reutilizando suscripción push existente');
        await syncSubscriptionWithServer(existingSubscription);
        console.log('✅ Suscripción existente sincronizada correctamente');
        return existingSubscription;
      }

      // Crear suscripción
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey.value)
      });

      await syncSubscriptionWithServer(sub);
      console.log('✅ Suscrito a push notifications correctamente');

      return sub;
    } catch (err) {
      console.error('Error suscribiéndose:', err);
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // Desuscribirse de push notifications
  async function unsubscribe() {
    try {
      loading.value = true;
      error.value = null;

      if (!subscription.value) {
        throw new Error('Not subscribed');
      }

      // Desuscribirse en el navegador
      await subscription.value.unsubscribe();

      // Notificar al servidor
      await api('/api/push/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: subscription.value.endpoint })
      });

      subscription.value = null;
      isSubscribed.value = false;
      console.log('✅ Desuscrito de push notifications');
    } catch (err) {
      console.error('Error desuscribiéndose:', err);
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // Verificar estado de suscripción actual
  async function checkSubscription() {
    try {
      if (!checkSupport()) {
        return;
      }

      const registration = await getServiceWorkerRegistration();
      const sub = await registration.pushManager.getSubscription();

      if (sub) {
        subscription.value = sub;
        isSubscribed.value = true;
        console.log('📱 Ya está suscrito a push notifications');

        if (localStorage.getItem('token')) {
          await syncSubscriptionWithServer(sub);
          console.log('🔄 Suscripción sincronizada con el backend');
        }
      } else {
        isSubscribed.value = false;
        console.log('📱 No está suscrito a push notifications');
      }
    } catch (err) {
      console.error('Error verificando suscripción:', err);
    }
  }

  // Auto-suscribirse (agresivo, con reintentos)
  async function autoSubscribe() {
    try {
      console.log('🔔 autoSubscribe() iniciado');
      console.log('📊 Estado actual:', {
        isSubscribed: isSubscribed.value,
        permission: Notification.permission,
        hasToken: !!localStorage.getItem('token')
      });
      
      // Verificar token primero
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('⏳ No hay token, esperando autenticación...');
        return false;
      }
      
      // Verificar si ya está suscrito
      if (isSubscribed.value) {
        console.log('📱 Ya está suscrito, no es necesario suscribirse nuevamente');
        return true;
      }

      // Verificar soporte
      if (!checkSupport()) {
        console.info('ℹ️ Push notifications no soportadas en este navegador');
        return false;
      }

      // Esperar a que el Service Worker esté ready
      console.log('⏳ Esperando Service Worker...');
      const registration = await getServiceWorkerRegistration();
      console.log('✅ Service Worker ready:', registration.scope);

      const existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription) {
        console.log('📱 Se encontró una suscripción existente, sincronizando...');
        await syncSubscriptionWithServer(existingSubscription);
        console.log('✅✅✅ SUSCRIPCIÓN EXISTENTE SINCRONIZADA');
        return true;
      }

      // Verificar si ya tiene permiso concedido
      if (Notification.permission === 'granted') {
        console.log('✅ Permiso ya concedido, suscribiendo automáticamente...');
        try {
          await subscribe();
          console.log('✅✅✅ SUSCRIPCIÓN EXITOSA');
          return true;
        } catch (subError) {
          console.error('❌ Error al suscribirse:', subError);
          console.error('Stack trace:', subError.stack);
          return false;
        }
      }

      // Si el permiso está en "default", esperar activación manual para evitar prompts bloqueados
      if (Notification.permission === 'default') {
        console.info('ℹ️ Permiso pendiente. Esperando activación manual desde la UI.');
        return false;
      }

      // Si el permiso fue denegado, no hacer nada
      if (Notification.permission === 'denied') {
        console.info('ℹ️ Permisos de notificación denegados previamente');
        return false;
      }

      return false;
    } catch (err) {
      console.error('⚠️ Error en autoSubscribe:', err.message);
      console.error('Stack trace:', err.stack);
      return false;
    }
  }

  // Inicializar
  onMounted(async () => {
    isSupported.value = checkSupport();
    
    if (isSupported.value) {
      await checkSubscription();
    }
  });

  return {
    isSupported,
    isSubscribed,
    subscription,
    loading,
    error,
    subscribe,
    unsubscribe,
    checkSubscription,
    requestPermission,
    autoSubscribe
  };
}
