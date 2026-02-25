// Push Notifications Manager
const webpush = require('web-push');

// Configurar VAPID keys
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:pokedex@example.com';

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    vapidSubject,
    vapidPublicKey,
    vapidPrivateKey
  );
  console.log('✅ Push Notifications configuradas correctamente');
} else {
  console.warn('⚠️  VAPID keys no encontradas. Push notifications deshabilitadas.');
  console.warn('   Genera las keys con: node generate-vapid-keys.js');
}

/**
 * Enviar push notification a un usuario
 * @param {Array} userSubs - Array de suscripciones del usuario
 * @param {Object} payload - Payload de la notificación
 */
async function sendPushNotification(userSubs, payload) {
  
  if (!vapidPublicKey || !vapidPrivateKey) {
    console.error('❌ VAPID keys no configuradas');
    return { success: false, message: 'VAPID keys not configured' };
  }
  
  if (!userSubs || userSubs.length === 0) {
    console.log(`📱 Sin suscripciones para este usuario`);
    return { success: false, message: 'No subscriptions found' };
  }
  
  console.log(`📤 Intentando enviar notificación a ${userSubs.length} suscripción(es)...`);
  console.log(`📦 Payload:`, JSON.stringify(payload));
  
  const payloadString = JSON.stringify(payload);
  const results = [];
  const invalidEndpoints = [];
  
  for (const subscription of userSubs) {
    try {
      console.log(`🔄 Enviando a endpoint: ${subscription.endpoint.substring(0, 50)}...`);
      await webpush.sendNotification(subscription, payloadString);
      results.push({ success: true, endpoint: subscription.endpoint });
      console.log(`✅ Push notification enviada exitosamente`);
    } catch (error) {
      console.error(`❌ Error enviando push:`, error.message);
      console.error(`   Status Code:`, error.statusCode);
      console.error(`   Body:`, error.body);
      
      // Si la suscripción expiró o es inválida (410, 404), marcarla para eliminar
      if (error.statusCode === 410 || error.statusCode === 404) {
        invalidEndpoints.push(subscription.endpoint);
      }
      
      results.push({ 
        success: false, 
        endpoint: subscription.endpoint, 
        error: error.message 
      });
    }
  }
  
  return { 
    success: results.some(r => r.success), 
    results,
    invalidEndpoints
  };
}

/**
 * Crear payload de notificación de invitación de amistad
 */
function createFriendRequestPayload(friendName) {
  return {
    title: '👥 Nueva solicitud de amistad',
    body: `${friendName} quiere ser tu amigo en Pokedex!`,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-72.png',
    tag: 'friend-request',
    data: {
      type: 'friend-request',
      url: '/friends'
    }
  };
}

/**
 * Crear payload de notificación de reto de batalla
 */
function createBattleChallengePayload(challengerName, battleId) {
  return {
    title: '⚔️ Nuevo reto de batalla',
    body: `${challengerName} te ha retado a una batalla!`,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-72.png',
    tag: 'battle-challenge',
    data: {
      type: 'battle-challenge',
      battleId: battleId,
      url: `/battle?id=${battleId}`
    },
    actions: [
      {
        action: 'accept',
        title: 'Aceptar'
      },
      {
        action: 'view',
        title: 'Ver detalles'
      }
    ]
  };
}

/**
 * Crear payload de notificación de batalla aceptada
 */
function createBattleAcceptedPayload(opponentName, battleId) {
  return {
    title: '⚔️ Batalla aceptada',
    body: `${opponentName} ha aceptado tu desafío!`,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-72.png',
    tag: 'battle-accepted',
    data: {
      type: 'battle-accepted',
      battleId: battleId,
      url: `/battle?id=${battleId}`
    }
  };
}

/**
 * Crear payload de notificación de amistad aceptada
 */
function createFriendAcceptedPayload(friendName) {
  return {
    title: '✅ Solicitud aceptada',
    body: `${friendName} aceptó tu solicitud de amistad!`,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-72.png',
    tag: 'friend-accepted',
    data: {
      type: 'friend-accepted',
      url: '/friends'
    }
  };
}

module.exports = {
  sendPushNotification,
  createFriendRequestPayload,
  createBattleChallengePayload,
  createBattleAcceptedPayload,
  createFriendAcceptedPayload,
  getVapidPublicKey: () => vapidPublicKey
};

