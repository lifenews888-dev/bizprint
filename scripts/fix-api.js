const fs = require('fs');

const files = [
  'app/admin/users/page.tsx',
  'app/admin/orders/page.tsx',
  'app/admin/vendors/page.tsx',
  'app/admin/machines/page.tsx',
  'app/admin/reports/page.tsx',
  'app/admin/payments/page.tsx',
];

files.forEach(f => {
  try {
    let c = fs.readFileSync(f, 'utf8');
    if (!c.includes('const API') && !c.includes("'http://localhost:4000'")) {
      c = c.replace("'use client'", "'use client'\nconst API = 'http://localhost:4000'");
      fs.writeFileSync(f, c, 'utf8');
      console.log('Fixed:', f);
    } else {
      console.log('OK:', f);
    }
  } catch(e) {
    console.log('Skip:', f);
  }
});
console.log('DONE');
