import fs from 'node:fs/promises'
import path from 'node:path'
import pngToIco from 'png-to-ico'
import sharp from 'sharp'

const root = process.cwd()
const pngPath = path.join(root, 'resources', 'icon.png')
const icoPath = path.join(root, 'resources', 'icon.ico')
const templatePath = path.join(root, 'resources', 'icon-template.png')
const foregroundPath = path.join(root, 'resources', 'icon.png')

async function main() {
  await fs.access(pngPath)

  // Optional: compose "foreground" content into a template-style icon background.
  // This is useful when you want to keep the icon's outer style but swap the inner logo.
  // If template/foreground exist, we generate a fresh icon.png first.
  const [hasTemplate, hasForeground] = await Promise.all([
    fs.access(templatePath).then(() => true).catch(() => false),
    fs.access(foregroundPath).then(() => true).catch(() => false)
  ])

  if (hasTemplate && hasForeground) {
    const tMeta = await sharp(templatePath).metadata()
    const tw = tMeta.width ?? 0
    const th = tMeta.height ?? 0
    if (!tw || !th) throw new Error('Unable to read icon-template.png dimensions.')

    // Sample center pixel as background color (avoids the shortcut-arrow corner).
    const cx = Math.floor(tw / 2)
    const cy = Math.floor(th / 2)
    const pixel = await sharp(templatePath)
      .extract({ left: cx, top: cy, width: 1, height: 1 })
      .ensureAlpha()
      .raw()
      .toBuffer()
    const [r, g, b, a] = pixel

    const canvasSize = 512
    const fgMax = Math.floor(canvasSize * 0.68) // inner logo size
    const fg = await sharp(foregroundPath)
      .resize(fgMax, fgMax, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer()

    const composed = await sharp({
      create: {
        width: canvasSize,
        height: canvasSize,
        channels: 4,
        background: { r, g, b, alpha: a / 255 }
      }
    })
      .composite([{ input: fg, gravity: 'center' }])
      .png()
      .toBuffer()

    await fs.writeFile(pngPath, composed)
  }

  // png-to-ico requires a square PNG. Pad/center to square while preserving aspect ratio.
  const meta = await sharp(pngPath).metadata()
  const w = meta.width ?? 0
  const h = meta.height ?? 0
  if (!w || !h) throw new Error('Unable to read icon.png dimensions.')

  const size = Math.max(w, h)
  const squarePng = await sharp(pngPath)
    .resize(size, size, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png()
    .toBuffer()

  const buf = await pngToIco(squarePng)
  await fs.writeFile(icoPath, buf)
  // eslint-disable-next-line no-console
  console.log(`Generated: ${path.relative(root, icoPath)}`)
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err)
  process.exit(1)
})

