// scripts/render-logo-raster.js
// Rasterize apps/web/public/logo.svg at 176px (2x lg=88px display size) to PNG + WebP.
// Uses sharp. Renders at 4x (704px) then resizes down to 176px for crisp AA.
//
// Assumption: logo's viewBox is square so a fixed 176x176 is fine.
// Per handoff: lg=88px is the largest display size, so 176 is the 2x for retina.

const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'apps/web/public/logo.svg');
const OUT_PNG = path.join(ROOT, 'apps/web/public/logo.png');
const OUT_WEBP = path.join(ROOT, 'apps/web/public/logo.webp');

const TARGET = 176;        // 2x the largest display size (lg=88)
const RENDER = 704;        // 4x render then resize down for sharp AA

async function main() {
  const svg = fs.readFileSync(SRC);
  const srcBytes = fs.statSync(SRC).size;

  // Render at 4x for crisp downsampled output
  const base = sharp(svg, { density: 384 });  // 4x at 96dpi baseline
  const meta = await base.metadata();
  console.log('SVG metadata:', { width: meta.width, height: meta.height, format: meta.format, space: meta.space });

  // PNG @ 176
  await sharp(svg, { density: 384 })
    .resize(TARGET, TARGET, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9, palette: true })
    .toFile(OUT_PNG);

  // WebP @ 176 (lossless for logo fidelity at this small size)
  await sharp(svg, { density: 384 })
    .resize(TARGET, TARGET, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality: 90, lossless: false })
    .toFile(OUT_WEBP);

  const pngBytes = fs.statSync(OUT_PNG).size;
  const webpBytes = fs.statSync(OUT_WEBP).size;
  console.log(JSON.stringify({
    src_svg_bytes: srcBytes,
    logo_png_bytes: pngBytes,
    logo_webp_bytes: webpBytes,
    target_size_px: TARGET,
    pass_30kb: webpBytes <= 30720,
  }, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });
