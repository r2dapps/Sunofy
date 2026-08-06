const fs = require('fs');
const path = require('path');

// All TS/TSX files to scan
const srcDir = path.join(__dirname, 'src');

function walk(dir) {
  const files = [];
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) files.push(...walk(full));
    else if (/\.(tsx?|ts)$/.test(f)) files.push(full);
  }
  return files;
}

let count = 0;
for (const file of walk(srcDir)) {
  const original = fs.readFileSync(file, 'utf-8');
  // Replace './icon-192.png' -> '/icon-192.png' and './icon-512.png' -> '/icon-512.png'
  const updated = original
    .replace(/['"]\.\/icon-192\.png['"]/g, "'/icon-192.png'")
    .replace(/['"]\.\/icon-512\.png['"]/g, "'/icon-512.png'");
  if (updated !== original) {
    fs.writeFileSync(file, updated);
    count++;
    console.log('Fixed:', path.relative(__dirname, file));
  }
}
console.log(`\nFixed ${count} files.`);
