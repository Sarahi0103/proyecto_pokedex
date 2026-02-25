// Test para verificar que el endpoint de registro está funcionando correctamente
const API_BASE = 'https://pokedex-backend-rzjl.onrender.com';

async function testRegister() {
  try {
    console.log('🧪 Probando registro...');
    
    const email = `test${Date.now()}@example.com`;
    const password = 'test123456';
    const name = 'Usuario Test';
    
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password, name })
    });
    
    const data = await response.json();
    
    console.log('📦 Respuesta completa:', JSON.stringify(data, null, 2));
    console.log('👤 Usuario:', data.user);
    console.log('🔑 Código:', data.user?.code);
    console.log('🎫 Token:', data.token ? 'Presente' : 'NO PRESENTE');
    
    if (!data.user?.code) {
      console.error('❌ ERROR: El código no está en la respuesta del backend');
    } else {
      console.log(`✅ El backend está devolviendo el código correctamente: ${data.user.code}`);
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testRegister();
