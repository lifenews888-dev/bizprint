const fs = require('fs');

const files = [
  'app/courier/page.tsx',
  'app/dashboard/factory/page.tsx', 
  'app/order/page.tsx',
  'app/products/page.tsx',
  'app/sales/page.tsx',
];

files.forEach(f => {
  try {
    let lines = fs.readFileSync(f, 'utf8').split('\n');
    let fixed = lines.map(l => {
      // Remove lines with garbage characters
      if (/[\u2550-\u2566\u2510-\u255E\u0400-\u04FF\uFFFD]/.test(l)) return '';
      // Remove lines that are just garbage tokens like "< 9;42M@89="
      if (/^\s*[<>][^<>{}'"\/ \t\n][A-Za-z0-9;:@=\-\.]+\s*$/.test(l.trim())) return '';
      // Fix broken button tags like "> tton>"
      if (l.includes('> tton>')) return l.replace('> tton>', '></button>');
      return l;
    });
    fs.writeFileSync(f, fixed.join('\n'), 'utf8');
    console.log('Fixed:', f);
  } catch(e) {
    console.log('Error:', f, e.message);
  }
});
console.log('DONE');
