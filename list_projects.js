const https = require('https');

const TOKEN = 'vcp_5kVpBrJwIz5Hcu1Fshci1F685URLUZGbjIWXXxe9guCQSdGkDp2vNUf4';
const TEAM_ID = 'team_1Bhj7jPOZFHHWmhb4kDTxyIs';

const options = {
  hostname: 'api.vercel.com',
  path: `/v9/projects?teamId=${TEAM_ID}`,
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${TOKEN}`
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    const response = JSON.parse(data);
    if (response.projects) {
      console.log(`Found ${response.projects.length} projects:`);
      response.projects.forEach(p => {
        console.log(`- Name: ${p.name}, ID: ${p.id}, Framework: ${p.framework}`);
      });
    } else {
      console.log(JSON.stringify(response, null, 2));
    }
  });
});

req.on('error', (e) => { console.error(e); });
req.end();
