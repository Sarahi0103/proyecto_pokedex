# ⚡ PASOS RÁPIDOS - ARREGLAR CÓDIGO DE AMIGO

## 🎯 Objetivo
Hacer que tu código de amigo aparezca en la app (actualmente muestra "------")

## 📝 Pasos (en orden)

### 1️⃣ Espera que Render termine de desplegar (2-3 minutos)
- Ve a: https://dashboard.render.com/
- Busca tu servicio backend
- Debe estar "Live" (punto verde)

### 2️⃣ Abre esta URL para arreglar códigos de usuario:
```
https://pokedex-backend-rzjl.onrender.com/api/fix-user-codes
```
✅ Verás cuántos usuarios se arreglaron

### 3️⃣ Ejecuta la migración de notificaciones:
```
https://pokedex-backend-rzjl.onrender.com/api/run-migration
```
✅ Debe decir "Migration executed successfully"

### 4️⃣ Cierra sesión y vuelve a iniciar sesión en tu app
1. Clic en "Salir"
2. Inicia sesión de nuevo
3. Ve a "Agregar Amigos"
4. ¡Tu código debería aparecer!

## ✅ Resultado Esperado
En lugar de ver "------", deberías ver algo como:
```
Tu código es: ABC1234
```

## ❌ Si no funciona
1. Presiona F12 en tu navegador
2. Ve a la pestaña "Console"
3. Escribe: `localStorage.clear()`
4. Presiona Enter
5. Recarga la página (Ctrl+F5)
6. Vuelve a iniciar sesión

---

**Última actualización:** 25/02/2026 - Commit: 03e42bb
