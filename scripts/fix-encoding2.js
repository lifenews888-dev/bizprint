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
  'app/vendor/store/page.tsx',
];

files.forEach(f => {
  try {
    let c = fs.readFileSync(f, 'utf8');
    const orig = c;
    c = c.replace(/ð\S{0,6}/g, '');
    c = c.replace(/Ð[\x80-\xFF]\S{0,6}/g, '');
    c = c.replace(/Ã\S{0,3}/g, '');
    if (c !== orig) {
      fs.writeFileSync(f, c, 'utf8');
      console.log('Fixed:', f);
    } else {
      console.log('Clean:', f);
    }
  } catch(e) {
    console.log('Error:', f, e.message);
  }
});
console.log('DONE');
