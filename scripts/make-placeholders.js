const fs = require('fs');

const pages = {
  'app/products/page.tsx': 'Products',
  'app/sales/page.tsx': 'Sales Dashboard', 
  'app/courier/page.tsx': 'Courier Dashboard',
  'app/order/page.tsx': 'Order',
  'app/dashboard/factory/page.tsx': 'Factory Dashboard',
};

const template = (title) => `'use client'
export default function Page() {
  return (
    <div style={{ padding: 40, fontFamily: 'Segoe UI, sans-serif', color: 'var(--text)' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700 }}>${title}</h1>
      <p style={{ color: 'var(--text2)', marginTop: 8 }}>This page is being updated.</p>
    </div>
  )
}
`;

Object.entries(pages).forEach(([file, title]) => {
  fs.writeFileSync(file, template(title), 'utf8');
  console.log('Placeholder:', file);
});
console.log('DONE');
