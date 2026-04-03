const https = require('https');

const TOKEN = 'vcp_5kVpBrJwIz5Hcu1Fshci1F685URLUZGbjIWXXxe9guCQSdGkDp2vNUf4';
const TEAM_ID = 'team_1Bhj7jPOZFHHWmhb4kDTxyIs';

const options = {
  hostname: 'api.vercel.com',
  path: `/v2/now/aliases?teamId=${TEAM_ID}`,
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
    if (response.aliases) {
      console.log(`Found ${response.aliases.length} aliases:`);
      response.aliases.forEach(a => {
        console.log(`- Alias: ${a.alias}, ProjectID: ${a.projectId}`);
      });
    } else {
      console.log(JSON.stringify(response, null, 2));
    }
  });
});

req.on('error', (e) => { console.error(e); });
req.end();
