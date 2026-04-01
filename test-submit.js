const http = require('http');

const data = JSON.stringify({
  name: 'Test SMTP Config',
  provider: 'smtp',
  host: 'smtp.bombinoexp.com',
  port: '465',
  encryption: 'ssl',
  username: 'taukeer@bombinoexp.com',
  password: 'testpassword',
  fromEmail: 'taukeer@bombinoexp.com',
  fromName: 'Taukeer'
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/smtp-configs',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, res => {
  console.log(`statusCode: ${res.statusCode}`);
  let body = '';
  res.on('data', d => {
    body += d;
  });
  res.on('end', () => {
    console.log(body);
  });
});

req.on('error', error => {
  console.error('Error:', error.message);
});

req.write(data);
req.end();
