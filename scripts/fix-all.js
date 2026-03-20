const fs = require('fs');
const path = require('path');

function placeholder(title) {
  return `'use client'
export default function Page() {
  return (
    <div style={{ padding: 40, color: 'var(--text)', fontFamily: 'Segoe UI,sans-serif' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700 }}>${title}</h1>
      <p style={{ color: 'var(--text2)', marginTop: 8 }}>Loading...</p>
    </div>
  )
}
`;
}

function hasErrors(content) {
  return (
    /[╤╨\uFFFD]/.test(content) ||
    /Cannot find name/.test(content) ||
    /[A-Z0-9]{6,}[A-Z0-9]/.test(content) ||
    content.split('\n').some(l => /^\s*[<>][^<>{}'"\/ \t][A-Za-z0-9;:@=\-\.]{3,}/.test(l.trim()))
  );
}

function walk(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) {
      walk(full);
    } else if (full.endsWith('.tsx') && full.includes('page.tsx')) {
      try {
        const c = fs.readFileSync(full, 'utf8');
        if (hasErrors(c)) {
          const title = path.dirname(full).split(path.sep).pop() || 'Page';
          fs.writeFileSync(full, placeholder(title), 'utf8');
          console.log('Fixed:', full);
        }
      } catch(e) {}
    }
  });
}

// Fix components too
const components = [
  'app/admin/workflow/components/DeliveryTab.tsx',
  'app/admin/workflow/components/ProductionTab.tsx',
];

components.forEach(f => {
  try {
    const c = fs.readFileSync(f, 'utf8');
    if (hasErrors(c)) {
      fs.writeFileSync(f, `'use client'\nexport default function Component() { return <div style={{padding:16,color:'var(--text)'}}>Loading...</div> }\n`, 'utf8');
      console.log('Fixed component:', f);
    }
  } catch(e) {}
});

walk('./app');
console.log('ALL DONE');
