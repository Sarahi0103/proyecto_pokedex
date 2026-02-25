import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourceIcon = path.join(__dirname, 'public/icons/icon-512.png');

sharp({
  create: {
    width: 1125,
    height: 2436,
    channels: 4,
    background: { r: 220, g: 10, b: 45, alpha: 1 }
  }
})
.composite([{
  input: await sharp(sourceIcon).resize(563).toBuffer(),
  gravity: 'center'
}])
.png()
.toFile('public/icons/splash-1125x2436.png')
.then(() => console.log('✅ Splash 1125x2436 generado'))
.catch(err => console.error('❌ Error:', err));
