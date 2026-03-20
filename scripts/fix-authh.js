const fs = require('fs');
const files = [
  'app/admin/users/page.tsx',
  'app/admin/orders/page.tsx', 
  'app/admin/vendors/page.tsx',
  'app/admin/machines/page.tsx',
  'app/admin/reports/page.tsx',
  'app/admin/payments/page.tsx',
];
const authHFunc = "\nfunction authH() { return { 'Content-Type': 'application/json', Authorization: 'Bearer '+(typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '') } }\n";
files.forEach(f => {
  try {
    let c = fs.readFileSync(f, 'utf8');
    if (c.includes('authH') && !c.includes('function authH')) {
      c = c.replace("const API = 'http://localhost:4000'", "const API = 'http://localhost:4000'" + authHFunc);
      fs.writeFileSync(f, c, 'utf8');
      console.log('Fixed:', f);
    } else {
      console.log('OK:', f);
    }
  } catch(e) { console.log('Skip:', f); }
});
console.log('DONE');
