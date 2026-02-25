import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourceIcon = path.join(__dirname, 'public/icons/favicon/web-app-manifest-512x512.png');
const outputDir = path.join(__dirname, 'public/icons');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

async function generateIcons() {
  console.log('🎨 Generando iconos PWA...');
  
  for (const size of sizes) {
    const outputPath = path.join(outputDir, `icon-${size}.png`);
    
    try {
      await sharp(sourceIcon)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 220, g: 10, b: 45, alpha: 1 } // #DC0A2D
        })
        .png()
        .toFile(outputPath);
      
      console.log(`✅ Generado: icon-${size}.png`);
    } catch (error) {
      console.error(`❌ Error generando icon-${size}.png:`, error.message);
    }
  }
  
  // Generar splash screens
  const splashSizes = [
    { name: 'splash-640x1136', width: 640, height: 1136 },
    { name: 'splash-750x1334', width: 750, height: 1334 },
    { name: 'splash-1242x2208', width: 1242, height: 2208 },
    { name: 'splash-1125x2436', width: 1125, height: 2436 },
    { name: 'splash-1242x2688', width: 1242, height: 2688 },
    { name: 'splash-828x1792', width: 828, height: 1792 },
    { name: 'splash-1536x2048', width: 1536, height: 2048 },
    { name: 'splash-2048x2732', width: 2048, height: 2732 }
  ];
  
  for (const splash of splashSizes) {
    const outputPath = path.join(outputDir, `${splash.name}.png`);
    
    try {
      await sharp({
        create: {
          width: splash.width,
          height: splash.height,
          channels: 4,
          background: { r: 220, g: 10, b: 45, alpha: 1 }
        }
      })
      .composite([{
        input: await sharp(sourceIcon)
          .resize(Math.min(splash.width, splash.height) / 2)
          .toBuffer(),
        gravity: 'center'
      }])
      .png()
      .toFile(outputPath);
      
      console.log(`✅ Generado: ${splash.name}.png`);
    } catch (error) {
      console.error(`❌ Error generando ${splash.name}.png:`, error.message);
    }
  }
  
  console.log('🎉 ¡Todos los iconos generados!');
}

generateIcons().catch(console.error);
