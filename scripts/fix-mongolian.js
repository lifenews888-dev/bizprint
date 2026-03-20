const fs = require('fs');

const files = [
  'app/admin/commission/page.tsx',
  'app/courier/page.tsx',
  'app/dashboard/factory/page.tsx',
  'app/dashboard/vendor/page.tsx',
  'app/order/page.tsx',
  'app/partner/page.tsx',
  'app/products/page.tsx',
  'app/sales/page.tsx',
  'app/vendor/store/page.tsx'
];

function fixMojibake(str) {
  return Buffer.from(str, 'latin1').toString('utf8');
}

files.forEach(f => {
  try {
    let c = fs.readFileSync(f, 'utf8');
    let fixed = fixMojibake(c);
    fs.writeFileSync(f, fixed, 'utf8');
    console.log('restored:', f);
  } catch (err) {
    console.log('skip:', f, err.message);
  }
});

console.log('DONE RESTORE');
