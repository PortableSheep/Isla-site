const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '../public/creatures');
if (!fs.existsSync(dir)) {
  console.error('Creatures directory not found:', dir);
  process.exit(1);
}

const files = fs.readdirSync(dir).filter(f => f.endsWith('.svg'));

const burtonFilter = `
    <filter id="burton-sketch" x="-20%" y="-20%" width="140%" height="140%">
      <!-- Hand-drawn wobbly displacement -->
      <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" result="noise" />
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="3.5" xChannelSelector="R" yChannelSelector="G" result="wobbly" />
      
      <!-- Mute colors for a gothic palette -->
      <feColorMatrix in="wobbly" type="saturate" values="0.35" result="muted" />
      
      <!-- Boost contrast slightly -->
      <feComponentTransfer in="muted" result="final">
        <feFuncR type="linear" slope="1.1" intercept="-0.05" />
        <feFuncG type="linear" slope="1.1" intercept="-0.05" />
        <feFuncB type="linear" slope="1.1" intercept="-0.05" />
      </feComponentTransfer>
    </filter>
`;

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Ensure <defs> exists and inject filter
  if (!content.includes('id="burton-sketch"')) {
    if (content.includes('<defs>')) {
      content = content.replace(/<defs>/, `<defs>${burtonFilter}`);
    } else {
      content = content.replace(/<svg([^>]*)>/, `<svg$1>\n  <defs>${burtonFilter}\n  </defs>`);
    }
  }

  // 2. Apply filter to root <svg>
  if (!content.includes('filter="url(#burton-sketch)"')) {
    content = content.replace(/<svg /, `<svg filter="url(#burton-sketch)" `);
  }

  // 3. Inject dark eye bags
  // Regex finds circles that have classes ending in "-eye"
  // Captures cx, cy, and r
  const eyeRegex = /<circle[^>]*class="[^"]*-eye"[^>]*cx="([^"]+)"[^>]*cy="([^"]+)"[^>]*r="([^"]+)"[^>]*\/>/g;
  
  content = content.replace(eyeRegex, (match, cx, cy, r) => {
    const bagRadius = parseFloat(r) + 4.5;
    const bagCy = parseFloat(cy) + 2.5;
    const eyeBag = `<circle cx="${cx}" cy="${bagCy}" r="${bagRadius}" fill="#1A1623" opacity="0.35" />`;
    return eyeBag + '\n  ' + match;
  });

  fs.writeFileSync(filePath, content, 'utf8');
});

console.log(`Successfully burtonized ${files.length} SVGs!`);
