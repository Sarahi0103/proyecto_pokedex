import { saveOfflineRequest } from './main.js';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000'

// Debug: Mostrar la URL del API en consola
console.log('🔧 API_BASE configurado:', API_BASE);
console.log('🔧 Variables de entorno:', import.meta.env);

export async function api(path, opts = {}){
  const headers = opts.headers || {};
  if(localStorage.token) headers['Authorization'] = 'Bearer ' + localStorage.token;
  
  const method = opts.method || 'GET';
  const fullUrl = API_BASE + path;
  const fetchOptions = Object.assign({ headers, credentials: 'include' }, opts);
  
  try {
    const res = await fetch(fullUrl, fetchOptions);
    
    // Verificar si la respuesta es HTML (error común cuando hay problemas de CORS o configuración)
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('text/html')) {
      console.error('❌ El servidor devolvió HTML en lugar de JSON. Probablemente hay un error de configuración.');
      console.error('URL solicitada:', fullUrl);
      console.error('API_BASE configurado:', API_BASE);
      throw new Error('Error de comunicación con el servidor. Verifica que el backend esté funcionando correctamente.');
    }
    
    // Si hay error de autenticación (401), no intentar offline
    if (res.status === 401) {
      console.error('❌ Error de autenticación - Token inválido o expirado');
      const errorData = await res.json().catch(() => ({ error: 'Unauthorized' }));
      throw new Error(errorData.error || 'No autorizado. Por favor inicia sesión de nuevo.');
    }
    
    // Si la petición fue exitosa, devolver el resultado
    if (res.ok) {
      return res.json();
    }
    
    // Si falla por otros motivos (400, 404, 500, etc.), lanzar error con el mensaje
    const errorData = await res.json().catch(() => ({ error: 'Error en el servidor' }));
    throw new Error(errorData.error || `Error ${res.status}`);
    
  } catch (error) {
    // Si es un error de autenticación, no guardar offline
    if (error.message.includes('No autorizado') || error.message.includes('Unauthorized')) {
      throw error;
    }
    
    // Si hay error de red (offline) y NO es GET, guardar para sincronización
    if (error.message.includes('fetch') || error.message.includes('Failed to fetch') || !navigator.onLine) {
      if (method !== 'GET') {
        console.warn('🔌 Sin conexión, guardando petición para sincronización:', path);
        await saveOfflineRequest(fullUrl, fetchOptions);
        throw new Error('Sin conexión. La petición se sincronizará automáticamente cuando vuelva la conexión.');
      }
    }
    
    throw error;
  }
}

export function login(token, user){
  localStorage.token = token;
  localStorage.user = JSON.stringify(user||{});
}

export function logout(){
  delete localStorage.token;
  delete localStorage.user;
}

export function currentUser(){
  try{
    if(!localStorage.token) return null;
    const userData = localStorage.user;
    if(!userData || userData === '{}') return null;
    const parsed = JSON.parse(userData);
    if(!parsed.email) return null;
    return parsed;
  }catch(e){
    return null;
  }
}
