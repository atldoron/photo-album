import sharp from 'sharp'
import { writeFileSync } from 'fs'

// The circle icon (option C) as SVG — rendered at 512px base
function makeSVG(size) {
  const r = size / 2
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="sky" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#42a5f5"/>
      <stop offset="100%" stop-color="#1565c0"/>
    </linearGradient>
    <clipPath id="circle">
      <circle cx="${r}" cy="${r}" r="${r * 0.968}"/>
    </clipPath>
  </defs>

  <!-- background circle -->
  <circle cx="${r}" cy="${r}" r="${r * 0.968}" fill="url(#sky)"/>

  <g clip-path="url(#circle)">
    <!-- mountains / ground -->
    <path d="M0 ${size*0.66} L${size*0.185} ${size*0.438} L${size*0.354} ${size*0.554} L${size*0.538} ${size*0.338} L${size*0.738} ${size*0.485} L${size} ${size*0.323} L${size} ${size} L0 ${size}Z" fill="#0d47a1"/>

    <!-- snow peaks -->
    <path d="M${size*0.477} ${size*0.338} L${size*0.561} ${size*0.469} L${size*0.393} ${size*0.469}Z" fill="rgba(255,255,255,0.90)"/>
    <path d="M${size*0.715} ${size*0.323} L${size*0.815} ${size*0.469} L${size*0.615} ${size*0.469}Z" fill="rgba(255,255,255,0.84)"/>

    <!-- sun -->
    <circle cx="${r * 1.508}" cy="${r * 0.431}" r="${size * 0.131}" fill="#fdd835"/>
    <circle cx="${r * 1.508}" cy="${r * 0.431}" r="${size * 0.092}" fill="#ffee58"/>

    <!-- cloud -->
    <ellipse cx="${size*0.246}" cy="${size*0.246}" rx="${size*0.154}" ry="${size*0.092}" fill="white"/>
    <ellipse cx="${size*0.154}" cy="${size*0.285}" rx="${size*0.1}" ry="${size*0.077}" fill="white"/>
    <ellipse cx="${size*0.354}" cy="${size*0.285}" rx="${size*0.115}" ry="${size*0.077}" fill="white"/>
  </g>

  <!-- subtle ring -->
  <circle cx="${r}" cy="${r}" r="${r * 0.955}" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="${size * 0.016}"/>
</svg>`
}

// Generate 512x512
await sharp(Buffer.from(makeSVG(512)))
  .png()
  .toFile('public/icon-512.png')
console.log('✓ icon-512.png')

// Generate 192x192
await sharp(Buffer.from(makeSVG(192)))
  .png()
  .toFile('public/icon-192.png')
console.log('✓ icon-192.png')

// Generate favicon 32x32
await sharp(Buffer.from(makeSVG(32)))
  .png()
  .toFile('public/favicon-32.png')
console.log('✓ favicon-32.png')

// Also overwrite app/favicon.ico using sharp → ico via png
await sharp(Buffer.from(makeSVG(64)))
  .png()
  .toFile('public/favicon-64.png')
console.log('✓ favicon-64.png')

console.log('All icons generated!')
