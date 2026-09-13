/**
 * PWA icon generation (HO-L) — build-time script, NOT shipped to clients.
 *
 * Rasterizes apps/web/public/logo.svg (the official ∞ logo — the mobile
 * app's branding; no new branding invented) into the manifest icons:
 *   icon-192.png, icon-512.png  (purpose: any)
 *   maskable-512.png            (purpose: maskable — logo inset on the
 *                                brand gradient so safe-zone cropping
 *                                never clips the mark)
 *
 * Usage: node scripts/build-pwa-icons.mjs   (repo root)
 * Sharp is already hoisted in node_modules — no new dependency.
 */
import sharp from 'sharp';
import { readFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const webPublic = join(root, 'apps', 'web', 'public');
const iconsDir = join(webPublic, 'icons');
const svgPath = join(webPublic, 'logo.svg');

mkdirSync(iconsDir, { recursive: true });

const svgBuffer = readFileSync(svgPath);

// Brand gradient matching the existing OG treatment (#6366f1 → #8b5cf6).
async function renderIcon(size, { maskable = false } = {}) {
  // Maskable: scale the logo into the ~80% safe zone over a full-bleed
  // brand background. Square icons: full-bleed logo on transparent.
  const logoSize = maskable ? Math.round(size * 0.62) : size;
  const inset = Math.round((size - logoSize) / 2);

  const logo = await sharp(svgBuffer, { density: 300 })
    .resize(logoSize, logoSize)
    .png()
    .toBuffer();

  const background = maskable
    ? {
        create: {
          width: size,
          height: size,
          channels: 4,
          background: { r: 99, g: 102, b: 241, alpha: 1 }, // #6366f1
        },
      }
    : undefined;

  const composite = [{ input: logo, top: inset, left: inset }];

  const pipeline = sharp({
    create: background?.create ?? {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  }).composite(composite);

  return pipeline.png().toBuffer();
}

const out192 = await renderIcon(192);
const out512 = await renderIcon(512);
const outMask512 = await renderIcon(512, { maskable: true });

await sharp(out192).toFile(join(iconsDir, 'icon-192.png'));
await sharp(out512).toFile(join(iconsDir, 'icon-512.png'));
await sharp(outMask512).toFile(join(iconsDir, 'maskable-512.png'));

console.log('[pwa-icons] wrote icon-192.png, icon-512.png, maskable-512.png');
