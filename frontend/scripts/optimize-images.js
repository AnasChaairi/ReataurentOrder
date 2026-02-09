const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '../public');
const images = ['hero-image.png', 'homepage.png', 'homepage2.png', 'homepage3.png'];

async function optimizeImages() {
  console.log('Starting image optimization...\n');

  for (const image of images) {
    const inputPath = path.join(publicDir, image);
    const outputPath = path.join(publicDir, image.replace('.png', '.webp'));

    if (!fs.existsSync(inputPath)) {
      console.log(`⚠️  Skipping ${image} - file not found`);
      continue;
    }

    try {
      await sharp(inputPath)
        .resize(1920, 1080, { fit: 'cover', withoutEnlargement: true })
        .webp({ quality: 85 })
        .toFile(outputPath);

      const originalSize = fs.statSync(inputPath).size;
      const optimizedSize = fs.existsSync(outputPath) ? fs.statSync(outputPath).size : 0;
      const savings = ((originalSize - optimizedSize) / originalSize * 100).toFixed(1);

      console.log(`✅ ${image}:`);
      console.log(`   Original: ${(originalSize/1024).toFixed(0)}KB`);
      console.log(`   Optimized: ${(optimizedSize/1024).toFixed(0)}KB`);
      console.log(`   Savings: ${savings}% reduction\n`);
    } catch (error) {
      console.error(`❌ Error optimizing ${image}:`, error.message);
    }
  }

  console.log('Image optimization complete!');
}

optimizeImages().catch(console.error);
