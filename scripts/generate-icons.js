const path = require('path')
const sharp = require('sharp')

const iconSvg = path.join(__dirname, 'icon-source.svg')
const maskableSvg = path.join(__dirname, 'icon-maskable-source.svg')
const outDir = path.join(__dirname, '..', 'public', 'icons')

const targets = [
  { src: iconSvg, size: 192, name: 'icon-192.png' },
  { src: iconSvg, size: 512, name: 'icon-512.png' },
  { src: iconSvg, size: 180, name: 'apple-touch-icon.png' },
  { src: maskableSvg, size: 192, name: 'icon-maskable-192.png' },
  { src: maskableSvg, size: 512, name: 'icon-maskable-512.png' }
]

async function main() {
  const fs = require('fs')
  fs.mkdirSync(outDir, { recursive: true })

  for (const { src, size, name } of targets) {
    await sharp(src)
      .resize(size, size)
      .png()
      .toFile(path.join(outDir, name))
    console.log(`wrote ${name} (${size}x${size})`)
  }
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
