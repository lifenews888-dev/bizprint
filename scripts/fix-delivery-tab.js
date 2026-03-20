const fs = require('fs');
const file = 'app/admin/workflow/components/DeliveryTab.tsx';
let c = fs.readFileSync(file, 'utf8');

// Fix broken Authorization header
c = c.replace(/Authorization: Bearer \\ /g, "Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('token') || '' : ''}`");
c = c.replace(/Authorization: Bearer\\$/gm, "Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('token') || '' : ''}`");

// Also fix any other encoding issues
c = c.replace(/[╤╨\uFFFD]/g, '');

fs.writeFileSync(file, c, 'utf8');
console.log('Fixed:', file);
console.log('Line 33:', c.split('\n')[32]);
