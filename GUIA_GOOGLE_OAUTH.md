# 🔐 Guía Paso a Paso: Configurar Google OAuth

## ✅ Paso 1: Acceder a Google Cloud Console

1. Abre tu navegador y ve a: **https://console.cloud.google.com/**
2. Inicia sesión con tu cuenta de Google (Gmail)

---

## ✅ Paso 2: Crear un Proyecto

1. En la parte superior, haz click en el **selector de proyectos**
2. Click en **"NUEVO PROYECTO"**
3. Completa:
   - **Nombre del proyecto**: `PokeMinimal` (o el nombre que prefieras)
   - **Ubicación**: Deja por defecto o selecciona tu organización
4. Click en **"CREAR"**
5. Espera unos segundos y selecciona tu nuevo proyecto

---

## ✅ Paso 3: Habilitar la API de Google+

1. En el menú lateral (☰), ve a: **"APIs y servicios"** > **"Biblioteca"**
2. Busca: `Google+ API` o `Google Identity Services`
3. Click en el resultado
4. Click en **"HABILITAR"**

---

## ✅ Paso 4: Configurar Pantalla de Consentimiento OAuth

1. En el menú lateral, ve a: **"APIs y servicios"** > **"Pantalla de consentimiento de OAuth"**
2. Selecciona **"Externos"** (o "Internos" si tienes Google Workspace)
3. Click en **"CREAR"**

### Información de la aplicación:
- **Nombre de la aplicación**: `PokeMinimal`
- **Correo de asistencia**: Tu email de Gmail
- **Logo de la aplicación**: (Opcional, puedes saltarlo)
- **Dominio de la aplicación**: Deja vacío por ahora
- **Dominios autorizados**: Deja vacío
- **Información de contacto del desarrollador**: Tu email

4. Click en **"GUARDAR Y CONTINUAR"**

### Permisos (Scopes):
5. Click en **"AÑADIR O QUITAR PERMISOS"**
6. Filtra y selecciona:
   - ✅ `.../auth/userinfo.email`
   - ✅ `.../auth/userinfo.profile`
7. Click en **"ACTUALIZAR"**
8. Click en **"GUARDAR Y CONTINUAR"**

### Usuarios de prueba:
9. Click en **"AÑADIR USUARIOS"**
10. Agrega tu email de Gmail (y cualquier otro que quieras usar para pruebas)
11. Click en **"AÑADIR"**
12. Click en **"GUARDAR Y CONTINUAR"**
13. Click en **"VOLVER AL PANEL"**

---

## ✅ Paso 5: Crear Credenciales OAuth 2.0

1. En el menú lateral, ve a: **"APIs y servicios"** > **"Credenciales"**
2. Click en **"+ CREAR CREDENCIALES"** (arriba)
3. Selecciona **"ID de cliente de OAuth"**

### Configuración del cliente:
4. **Tipo de aplicación**: Selecciona **"Aplicación web"**
5. **Nombre**: `PokeMinimal Web Client`

### Orígenes de JavaScript autorizados:
6. Click en **"+ AGREGAR URI"**
7. Agrega estas URLs (una por una):
   ```
   http://localhost:5173
   http://localhost:4000
   ```

### URIs de redireccionamiento autorizados:
8. Click en **"+ AGREGAR URI"**
9. Agrega esta URL:
   ```
   http://localhost:4000/auth/google/callback
   ```

10. Click en **"CREAR"**

---

## ✅ Paso 6: Copiar las Credenciales

Aparecerá un modal con tus credenciales:

1. **Copia el "ID de cliente"** (algo como: `123456789-abc123.apps.googleusercontent.com`)
2. **Copia el "Secreto del cliente"** (algo como: `GOCSPX-abc123xyz789`)
3. Puedes descargar el JSON o simplemente copiarlos

⚠️ **IMPORTANTE**: Guarda estas credenciales de forma segura

---

## ✅ Paso 7: Configurar Variables de Entorno

1. Abre el archivo `BE/.env` en VS Code
2. Reemplaza estas líneas:

```env
GOOGLE_CLIENT_ID=PEGA_AQUI_TU_CLIENT_ID
GOOGLE_CLIENT_SECRET=PEGA_AQUI_TU_CLIENT_SECRET
```

**Ejemplo:**
```env
GOOGLE_CLIENT_ID=123456789-abc123def456.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abc123xyz789def456ghi789
```

3. Guarda el archivo (Ctrl+S)

---

## ✅ Paso 8: Reiniciar el Servidor Backend

El backend ya está corriendo, pero necesitas reiniciarlo:

1. En VS Code, ve a la terminal donde corre el backend
2. Presiona `Ctrl+C` para detenerlo
3. Ejecuta de nuevo:
   ```bash
   cd BE
   node index.js
   ```

---

## ✅ Paso 9: ¡Probar!

1. Abre tu navegador en: **http://localhost:5173/login**
2. Verás el botón **"Iniciar sesión con Google"**
3. Click en el botón
4. Selecciona tu cuenta de Google
5. Acepta los permisos
6. Serás redirigido a la aplicación ¡con sesión iniciada!

---

## 🎉 ¡Listo!

Tu aplicación ahora soporta:
- ✅ Login con email/password tradicional
- ✅ Login con Google OAuth
- ✅ Registro con email/password
- ✅ Registro con Google

---

## 🐛 Solución de Problemas

### Error: "redirect_uri_mismatch"
- Verifica que `http://localhost:4000/auth/google/callback` esté EXACTAMENTE en Google Cloud Console
- Asegúrate de no tener espacios o barras extra

### Error: "invalid_client"
- Verifica que copiaste correctamente el CLIENT_ID y CLIENT_SECRET
- Asegúrate de que no haya espacios al inicio o final

### El botón no funciona
- Verifica que el backend esté corriendo en el puerto 4000
- Abre la consola del navegador (F12) para ver errores
- Verifica que reiniciaste el backend después de agregar las credenciales

### Error: "Access blocked: This app's request is invalid"
- Asegúrate de haber agregado tu email en "Usuarios de prueba"
- Verifica que la aplicación esté configurada como "Externa"

---

## 📝 Notas Finales

- **Desarrollo**: Estas URLs solo funcionan en localhost
- **Producción**: Necesitarás agregar tus URLs de producción en Google Cloud Console
- **Seguridad**: El archivo `.env` NO debe subirse a Git (ya está en `.gitignore`)
- **Publicación**: Para publicar la app, necesitarás verificar el dominio y pasar por el proceso de revisión de Google

---

**¿Necesitas ayuda?** Estoy aquí para cualquier duda durante el proceso.
