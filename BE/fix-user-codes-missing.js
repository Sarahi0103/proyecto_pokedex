const { pool } = require('./lib/db');

async function fixUserCodes() {
  try {
    // Encuentra usuarios sin código
    const usersWithoutCode = await pool.query(
      'SELECT id, email FROM users WHERE code IS NULL OR code = \'\''
    );
    
    console.log(`📋 Usuarios sin código: ${usersWithoutCode.rows.length}`);
    
    if (usersWithoutCode.rows.length === 0) {
      console.log('✅ Todos los usuarios tienen código');
      process.exit(0);
    }
    
    // Genera y actualiza códigos para cada usuario
    for (const user of usersWithoutCode.rows) {
      const newCode = Math.random().toString(36).slice(2, 9).toUpperCase();
      await pool.query(
        'UPDATE users SET code = $1 WHERE id = $2',
        [newCode, user.id]
      );
      console.log(`✅ Código ${newCode} asignado a ${user.email}`);
    }
    
    console.log('\n✅ Todos los códigos han sido generados');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixUserCodes();
