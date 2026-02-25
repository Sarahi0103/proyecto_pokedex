// Push Notifications Manager
const webpush = require('web-push');
const { getPushSubscriptions, removePushSubscription } = require('./db');

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
 */
async function sendPushNotification(userId, payload) {
  const userSubs = await getPushSubscriptions(userId);
  
  if (userSubs.length === 0) {
    console.log(`📱 Sin suscripciones para usuario ${userId}`);
    return { success: false, message: 'No subscriptions found' };
  }
  
  const payloadString = JSON.stringify(payload);
  const results = [];
  
  for (const subscription of userSubs) {
    try {
      await webpush.sendNotification(subscription, payloadString);
      results.push({ success: true, endpoint: subscription.endpoint });
      console.log(`📤 Push enviado a usuario ${userId}`);
    } catch (error) {
      console.error(`❌ Error enviando push:`, error.message);
      
      // Si la suscripción expiró o es inválida (410, 404), eliminarla
      if (error.statusCode === 410 || error.statusCode === 404) {
        await removePushSubscription(userId, subscription.endpoint);
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
    results 
  };
}

/**
 * Enviar notificación de invitación de amistad
 */
async function sendFriendRequestNotification(userId, friendName) {
  const payload = {
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
  
  return await sendPushNotification(userId, payload);
}

/**
 * Enviar notificación de reto de batalla
 */
async function sendBattleChallengeNotification(userId, challengerName, battleId) {
  const payload = {
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
  
  return await sendPushNotification(userId, payload);
}

/**
 * Enviar notificación de batalla aceptada
 */
async function sendBattleAcceptedNotification(userId, opponentName, battleId) {
  const payload = {
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
  
  return await sendPushNotification(userId, payload);
}

/**
 * Enviar notificación de amistad aceptada
 */
async function sendFriendAcceptedNotification(userId, friendName) {
  const payload = {
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
  
  return await sendPushNotification(userId, payload);
}

module.exports = {
  sendPushNotification,
  sendFriendRequestNotification,
  sendBattleChallengeNotification,
  sendBattleAcceptedNotification,
  sendFriendAcceptedNotification,
  getVapidPublicKey: () => vapidPublicKey
};

