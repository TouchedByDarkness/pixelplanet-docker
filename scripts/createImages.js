/*
 * Create needed images from SVG
 * Creates images needed for pixelplanet out of svg files
 */

const fs = require('fs');
const path = require('path');
const sharp = require("sharp");
const ico= require("sharp-ico");

const svgLogo = path.resolve(__dirname, '..', 'dist', 'public', 'logo.svg');
// const svgLogoOverride = path.resolve(__dirname, '..', 'overrides', 'logo.svg');
const targetIco = path.resolve(__dirname, '..', 'dist', 'public', 'favicon.ico');
const tilePng = path.resolve(__dirname, '..', 'dist', 'public', 'tile.png');
const touchIconPng = path.resolve(__dirname, '..', 'dist', 'public', 'apple-touch-icon.png');

async function createImages() {
  /*
  if (fs.existsSync(svgLogoOverride)) {
    fs.copyFileSync(svgLogoOverride, svgLogo);
  }
  */
  await ico.sharpsToIco(
    [ sharp(svgLogo) ],
    targetIco,
    {
      sizes: [256, 128, 64, 32, 24],
    }
  );
  console.log('Created favicon');
  await sharp(svgLogo)
    .resize({ height: 256 })
    .png()
    .toFile(tilePng);
  console.log('Created tile.png');
  fs.copyFileSync(tilePng, touchIconPng);
  console.log('Created apple-touch-icon.png');
}

module.exports = createImages;
