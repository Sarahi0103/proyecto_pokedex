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
        await getPublicKey();
      }

      // Obtener service worker registration
      const registration = await navigator.serviceWorker.ready;

      // Crear suscripción
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey.value)
      });

      subscription.value = sub;

      // Enviar suscripción al servidor
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      await api('/api/push/subscribe', 'POST', { subscription: sub });

      isSubscribed.value = true;
      console.log('✅ Suscrito a push notifications');

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
      await api('/api/push/unsubscribe', 'POST', {
        endpoint: subscription.value.endpoint
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

      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.getSubscription();

      if (sub) {
        subscription.value = sub;
        isSubscribed.value = true;
        console.log('📱 Ya está suscrito a push notifications');
      } else {
        isSubscribed.value = false;
        console.log('📱 No está suscrito a push notifications');
      }
    } catch (err) {
      console.error('Error verificando suscripción:', err);
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
    requestPermission
  };
}
