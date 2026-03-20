const fs = require('fs');
const path = require('path');

function clean(content) {
  return content
    .replace(/\uFFFD/g, '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
}

function walk(dir) {
  fs.readdirSync(dir).forEach(file => {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) {
      walk(full);
    } else if (full.endsWith('.tsx') || full.endsWith('.ts')) {
      let c = fs.readFileSync(full, 'utf8');
      let fixed = clean(c);
      if (c !== fixed) {
        fs.writeFileSync(full, fixed, 'utf8');
        console.log('fixed:', full);
      }
    }
  });
}

walk('./app');
console.log('FINAL CLEAN DONE');
