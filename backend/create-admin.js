// Superadmin үүсгэх script
// Ажиллуулах: node create-admin.js

const http = require('http');

const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD;
if (!ADMIN_PASSWORD) {
  console.error('SEED_ADMIN_PASSWORD орчны хувьсагч шаардлагатай (нууц үгийг кодонд бүү бич).');
  process.exit(1);
}

const data = JSON.stringify({
  email: 'admin@bizprint.mn',
  password: ADMIN_PASSWORD,
  full_name: 'Super Admin',
  role: 'superadmin'
});

const req = http.request({
  hostname: 'localhost',
  port: 4000,
  path: '/auth/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', body);
    if (res.statusCode === 201 || res.statusCode === 200) {
      console.log('\n=== SUPERADMIN АМЖИЛТТАЙ ҮҮСЛЭЭ ===');
      console.log('Email:    admin@bizprint.mn');
      console.log('Password: (SEED_ADMIN_PASSWORD env)');
    }
  });
});

req.on('error', (e) => {
  console.log('АЛДАА: Backend сервер асаалттай байх ёстой!');
  console.log('Эхлээд: npm run start:dev');
  console.log(e.message);
});

req.write(data);
req.end();
