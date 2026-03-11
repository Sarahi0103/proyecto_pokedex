// Monitor en tiempo real de suscripciones push
require('dotenv').config();
const { pool } = require('./lib/db');

let lastCount = 0;

async function checkSubscriptions() {
  try {
    const result = await pool.query(`
      SELECT 
        u.name, 
        u.email, 
        ps.endpoint,
        ps.created_at,
        ps.updated_at
      FROM push_subscriptions ps
      JOIN users u ON ps.user_id = u.id
      ORDER BY ps.updated_at DESC
    `);
    
    const count = result.rows.length;
    
    if (count !== lastCount) {
      console.clear();
      console.log('🔄 ==========================================');
      console.log(`   MONITOR PUSH SUBSCRIPTIONS - ${new Date().toLocaleTimeString()}`);
      console.log('==========================================\n');
      
      if (count === 0) {
        console.log('❌ No hay suscripciones activas');
        console.log('💡 Abre http://localhost:3000 y acepta los permisos\n');
      } else {
        console.log(`✅ Total de suscripciones: ${count}\n`);
        
        result.rows.forEach((row, index) => {
          console.log(`${index + 1}. ${row.name} (${row.email})`);
          console.log(`   📍 Endpoint: ${row.endpoint.substring(0, 60)}...`);
          console.log(`   📅 Creado: ${row.created_at}`);
          console.log(`   🔄 Actualizado: ${row.updated_at}`);
          console.log('');
        });
      }
      
      lastCount = count;
    }
  } catch (error) {
    if (error.message.includes('relation "push_subscriptions"')) {
      console.error('\n❌ La tabla push_subscriptions no existe');
      console.error('💡 Ejecuta la migración: npm run migrate\n');
      process.exit(1);
    }
    console.error('Error:', error.message);
  }
}

console.log('🎯 Iniciando monitor de suscripciones push...');
console.log('👀 Monitoreando cambios cada 2 segundos...');
console.log('⏹️  Presiona Ctrl+C para detener\n');

// Verificar inmediatamente
checkSubscriptions();

// Verificar cada 2 segundos
const interval = setInterval(checkSubscriptions, 2000);

// Limpiar al salir
process.on('SIGINT', async () => {
  console.log('\n\n👋 Deteniendo monitor...');
  clearInterval(interval);
  await pool.end();
  process.exit(0);
});
