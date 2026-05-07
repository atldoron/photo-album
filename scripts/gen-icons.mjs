import sharp from 'sharp'

// Icon: mountain + sun, rounded square
// Colors: gradient #42a5f5 → #1e88e5 (slightly lighter blue), larger sun
function makeSVG(size) {
  const s = size
  return `<svg width="${s}" height="${s}" viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="sky" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#42a5f5"/>
      <stop offset="100%" stop-color="#1e88e5"/>
    </linearGradient>
    <clipPath id="cl"><rect width="96" height="96" rx="22"/></clipPath>
  </defs>
  <rect width="96" height="96" rx="22" fill="url(#sky)"/>
  <g clip-path="url(#cl)">
    <!-- mountain -->
    <path d="M48 18 L78 72 L18 72Z" fill="white"/>
    <!-- snow cap -->
    <path d="M48 18 L60 42 L36 42Z" fill="#e3f2fd"/>
    <!-- sun — larger -->
    <circle cx="76" cy="22" r="15" fill="#fdd835"/>
    <circle cx="76" cy="22" r="11" fill="#ffee58"/>
  </g>
  <rect x="2" y="2" width="92" height="92" rx="20" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="2"/>
</svg>`
}

await sharp(Buffer.from(makeSVG(512))).resize(512,512).png().toFile('public/icon-512.png')
console.log('✓ icon-512.png')

await sharp(Buffer.from(makeSVG(192))).resize(192,192).png().toFile('public/icon-192.png')
console.log('✓ icon-192.png')

await sharp(Buffer.from(makeSVG(64))).resize(64,64).png().toFile('public/favicon-64.png')
console.log('✓ favicon-64.png')

await sharp(Buffer.from(makeSVG(32))).resize(32,32).png().toFile('public/favicon-32.png')
console.log('✓ favicon-32.png')

// favicon.ico = 64px png renamed
await sharp(Buffer.from(makeSVG(64))).resize(64,64).png().toFile('app/favicon.ico')
console.log('✓ app/favicon.ico')

console.log('Done!')
