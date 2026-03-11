// Verificar endpoint de push subscriptions
const { pool } = require('./lib/db');

async function checkEndpoint() {
  console.log('\n🔍 Verificando endpoint /api/push/subscribe\n');
  
  try {
    // Ver las suscripciones actuales
    const result = await pool.query('SELECT * FROM push_subscriptions');
    console.log(`📊 Suscripciones en BD: ${result.rows.length}\n`);
    
    if (result.rows.length > 0) {
      result.rows.forEach((sub, index) => {
        console.log(`${index + 1}. Usuario ID: ${sub.user_id}`);
        console.log(`   Endpoint: ${sub.endpoint.substring(0, 60)}...`);
        console.log(`   Creada: ${sub.created_at}\n`);
      });
    }
    
    // Ver estructura de la tabla
    const tableInfo = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'push_subscriptions'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Estructura de la tabla push_subscriptions:');
    tableInfo.rows.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'})`);
    });
    console.log('');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
    console.log('✅ Verificación completada\n');
  }
}

checkEndpoint();
