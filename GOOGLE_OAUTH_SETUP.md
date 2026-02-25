# Configuración de Google OAuth

Para habilitar el inicio de sesión con Google, sigue estos pasos:

## 1. Crear proyecto en Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita la "Google+ API" (o "Google Identity Services")

## 2. Configurar OAuth Consent Screen

1. En el menú lateral, ve a **APIs & Services** > **OAuth consent screen**
2. Selecciona **External** (o Internal si es para organización)
3. Completa el formulario:
   - **App name**: PokeMinimal
   - **User support email**: Tu email
   - **Developer contact information**: Tu email
4. Guarda y continúa
5. En **Scopes**, agrega:
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
6. Guarda y continúa

## 3. Crear Credenciales OAuth 2.0

1. Ve a **APIs & Services** > **Credentials**
2. Click en **Create Credentials** > **OAuth client ID**
3. Selecciona **Web application**
4. Configura:
   - **Name**: PokeMinimal Web Client
   - **Authorized JavaScript origins**:
     ```
     http://localhost:5173
     http://localhost:4000
     ```
   - **Authorized redirect URIs**:
     ```
     http://localhost:4000/auth/google/callback
     ```
5. Click en **Create**
6. **IMPORTANTE**: Copia el **Client ID** y **Client Secret**

## 4. Configurar variables de entorno

Edita el archivo `BE/.env` y reemplaza los valores:

```env
GOOGLE_CLIENT_ID=tu-client-id-aqui.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu-client-secret-aqui
```

## 5. Reiniciar el servidor backend

```bash
cd BE
# Detén el servidor (Ctrl+C)
npm start
```

## 6. Probar la autenticación

1. Abre http://localhost:5173/login
2. Click en "Iniciar sesión con Google"
3. Selecciona tu cuenta de Google
4. Acepta los permisos
5. Serás redirigido a la app con la sesión iniciada

---

## Notas importantes:

- **Desarrollo**: Las URLs de localhost solo funcionan en desarrollo
- **Producción**: Deberás agregar tus URLs de producción en Google Cloud Console
- **Seguridad**: NUNCA subas el archivo `.env` a Git (ya está en `.gitignore`)
- **Testing**: Puedes agregar cuentas de prueba en "OAuth consent screen" > "Test users"

## Solución de problemas:

**Error: redirect_uri_mismatch**
- Verifica que la URL en Google Cloud Console coincida exactamente con la configurada

**Error: invalid_client**
- Verifica que el CLIENT_ID y CLIENT_SECRET sean correctos en el archivo `.env`

**No funciona el botón de Google**
- Asegúrate de haber reiniciado el servidor backend después de configurar las variables

---

## Alternativa sin OAuth (actual)

El proyecto ya funciona con autenticación tradicional email/password sin necesidad de configurar Google OAuth. Puedes usar cualquier email para registrarte.
