const http = require('http');

console.log("=========================================");
console.log("🚀 BOMBINO EXPRESS - CRON ENGINE STARTED");
console.log("=========================================");
console.log("Checking for scheduled campaigns every 30 seconds...");

// Poll the endpoint every 30 seconds
setInterval(() => {
    http.get('http://localhost:3000/api/cron/send-scheduled', (res) => {
        let data = '';

        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            try {
                const response = JSON.parse(data);
                if (response.processed && response.processed.length > 0) {
                    console.log(`[${new Date().toLocaleTimeString()}] ✅ Processed ${response.processed.length} campaigns!`);
                    console.log(response.processed);
                } else if (response.message) {
                    // Just a periodic ping
                    process.stdout.write('.');
                }
            } catch (e) {
                console.error(`[${new Date().toLocaleTimeString()}] ❌ Failed to parse cron response:`, data);
            }
        });

    }).on('error', (err) => {
        console.error(`[${new Date().toLocaleTimeString()}] ⚠️ Cron engine failed to connect to Next.js. Is 'npm run dev' running?`);
    });
}, 30000); // 30 seconds
