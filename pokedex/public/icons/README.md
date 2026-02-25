# Iconos para PWA - Pokédex App

## Generación de Iconos

Para crear los iconos de la aplicación, sigue estos pasos:

### 1. Prepara tu logo original
- Crea un logo cuadrado de alta resolución (mínimo 512x512px)
- Usa un diseño relacionado con Pokémon (ej: una Pokébola, Pikachu, etc.)
- Formato recomendado: PNG con fondo transparente

### 2. Genera los iconos en diferentes tamaños

#### Opción A: Usando herramientas online
1. Visita: https://www.icoconverter.com/
2. Sube tu logo de 512x512px
3. Genera los siguientes tamaños:
   - 48x48
   - 72x72
   - 96x96
   - 144x144
   - 168x168
   - 192x192
   - 512x512

#### Opción B: Usando ImageMagick (CLI)
```bash
# Instalar ImageMagick primero
# Luego ejecutar:

convert logo.png -resize 48x48 icon-48x48.png
convert logo.png -resize 72x72 icon-72x72.png
convert logo.png -resize 96x96 icon-96x96.png
convert logo.png -resize 144x144 icon-144x144.png
convert logo.png -resize 168x168 icon-168x168.png
convert logo.png -resize 192x192 icon-192x192.png
convert logo.png -resize 512x512 icon-512x512.png
```

#### Opción C: Usando herramientas online adicionales
- **PWA Asset Generator**: https://progressiveapp.store/pwa-icons
- **RealFaviconGenerator**: https://realfavicongenerator.net/
- **Favicon.io**: https://favicon.io/

### 3. Coloca los archivos
Guarda todos los iconos generados en esta carpeta (`pokedex/public/icons/`) con los nombres:
- `icon-48x48.png`
- `icon-72x72.png`
- `icon-96x96.png`
- `icon-144x144.png`
- `icon-168x168.png`
- `icon-192x192.png`
- `icon-512x512.png`

### 4. Verifica la configuración
Una vez que tengas los iconos, verifica que:
- El manifest.json está correctamente vinculado en tu HTML
- Los colores theme_color y background_color coinciden con tu diseño
- Los iconos se cargan correctamente

## Configuración del Splash Screen

El splash screen se genera automáticamente usando:
- **theme_color**: `#EF5350` (rojo Pokémon)
- **background_color**: `#FFFFFF` (blanco)
- **icons**: El icono de 192x192 o 512x512 según el dispositivo

Puedes personalizar estos colores en el `manifest.json` según tu paleta de colores.

## Recursos adicionales

- [MDN: Web App Manifest](https://developer.mozilla.org/es/docs/Web/Progressive_web_apps/Manifest)
- [Google: Add a web app manifest](https://web.dev/add-manifest/)
- [Maskable Icons](https://maskable.app/)
