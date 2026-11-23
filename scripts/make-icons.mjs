// Renders the PWA / home-screen icons from the Nook brand SVGs in public/brand. Run: node scripts/make-icons.mjs
import sharp from 'sharp'
import { readFileSync } from 'node:fs'

const icon = readFileSync('public/brand/app-icon.svg', 'utf8')
const maskable = readFileSync('public/brand/app-icon-maskable.svg', 'utf8')
const square = icon.replace('rx="112"', 'rx="0"') // iOS rounds the corners itself
const png = (svg, size, file) => sharp(Buffer.from(svg), { density: 300 }).resize(size, size).png().toFile(`public/icons/${file}`)
await png(icon, 192, 'icon-192.png')
await png(icon, 512, 'icon-512.png')
await png(maskable, 512, 'icon-maskable-512.png')
await png(square, 180, 'apple-touch-icon.png')
console.log('icons written')
