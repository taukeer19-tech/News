const https = require('https');

const TOKEN = 'vcp_5kVpBrJwIz5Hcu1Fshci1F685URLUZGbjIWXXxe9guCQSdGkDp2vNUf4';
const PROJECT_ID = 'prj_WPWbnwC3UXX3TcoYHjJLbuiWuMNH';
const TEAM_ID = 'team_1Bhj7jPOZFHHWmhb4kDTxyIs';

const options = {
  hostname: 'api.vercel.com',
  path: `/v6/deployments?projectId=${PROJECT_ID}&teamId=${TEAM_ID}&limit=5`,
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
    if (response.deployments && response.deployments.length > 0) {
      response.deployments.forEach(d => {
        console.log(`- ID: ${d.uid}, State: ${d.state}, URL: ${d.url}, Created: ${new Date(d.createdAt).toISOString()}`);
      });
    } else {
      console.log("No deployments found.");
      console.log(JSON.stringify(response, null, 2));
    }
  });
});

req.on('error', (e) => { console.error(e); });
req.end();
