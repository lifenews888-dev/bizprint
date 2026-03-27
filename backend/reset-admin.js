// Superadmin нууц үг reset хийх script
// Ажиллуулах: node reset-admin.js

const http = require('http');

// Эхлээд login хийж шалгая
const loginData = JSON.stringify({
  email: 'admin@bizprint.mn',
  password: 'Admin@2026'
});

const req = http.request({
  hostname: 'localhost',
  port: 4000,
  path: '/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': loginData.length
  }
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('Login status:', res.statusCode);
    if (res.statusCode === 200 || res.statusCode === 201) {
      const json = JSON.parse(body);
      console.log('\n=== НЭВТРЭЛТ АМЖИЛТТАЙ ===');
      console.log('Email:    admin@bizprint.mn');
      console.log('Password: Admin@2026');
      console.log('Role:    ', json.user?.role || 'unknown');
      console.log('Token:   ', json.access_token?.slice(0, 30) + '...');
    } else {
      console.log('Response:', body);
      console.log('\nНууц үг буруу байна. Шинэ нууц үгтэй хэрэглэгч үүсгэж байна...');
      createNew();
    }
  });
});

req.on('error', (e) => {
  console.log('АЛДАА: Backend сервер асаалттай байх ёстой!');
});

req.write(loginData);
req.end();

function createNew() {
  const data = JSON.stringify({
    email: 'superadmin@bizprint.mn',
    password: 'Admin@2026',
    full_name: 'Super Admin',
    role: 'superadmin'
  });

  const req2 = http.request({
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
      if (res.statusCode === 200 || res.statusCode === 201) {
        console.log('\n=== ШИНЭ SUPERADMIN ҮҮСЛЭЭ ===');
        console.log('Email:    superadmin@bizprint.mn');
        console.log('Password: Admin@2026');
      } else {
        console.log('Response:', body);
      }
    });
  });
  req2.write(data);
  req2.end();
}
