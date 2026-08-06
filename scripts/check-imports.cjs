const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.resolve(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('src');
let hasError = false;

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf-8');
  const matches = content.match(/from\s+['"](\.[^'"]+)['"]/g);
  if (matches) {
    matches.forEach(match => {
      const importPath = match.match(/['"]([^'"]+)['"]/)[1];
      const dir = path.dirname(file);
      let target = path.resolve(dir, importPath);
      const parentDir = path.dirname(target);
      const basename = path.basename(target);
      
      if (fs.existsSync(parentDir)) {
        const filesInParent = fs.readdirSync(parentDir);
        
        // Exact match check for case sensitivity
        if (!filesInParent.includes(basename) && 
            !filesInParent.includes(basename + '.ts') && 
            !filesInParent.includes(basename + '.tsx') && 
            !filesInParent.includes(basename + '/index.ts') && 
            !filesInParent.includes(basename + '/index.tsx')) {
            
          console.log('CASE SENSITIVITY ERROR:', match, 'in', file, 'expected one of:', filesInParent.filter(f => f.toLowerCase().includes(basename.toLowerCase())));
          hasError = true;
        }
      }
    });
  }
});

if (!hasError) console.log('All imports check out exactly with case sensitivity.');
