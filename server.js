const http = require('http');
const https = require('https');
const zlib = require('zlib');

const PORT = 3000;

function fetchJioSaavn(url) {
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                return fetchJioSaavn(res.headers.location).then(resolve).catch(reject);
            }

            let stream = res;
            if (res.headers['content-encoding'] === 'gzip') {
                stream = res.pipe(zlib.createGunzip());
            } else if (res.headers['content-encoding'] === 'deflate') {
                stream = res.pipe(zlib.createInflate());
            }

            const chunks = [];
            stream.on('data', chunk => chunks.push(chunk));
            stream.on('end', () => {
                try {
                    const body = Buffer.concat(chunks).toString('utf8');
                    resolve(JSON.parse(body));
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

const server = http.createServer(async (req, res) => {
    // Enable CORS for all local requests
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    const reqUrl = new URL(req.url, `http://localhost:${PORT}`);

    if (reqUrl.pathname.includes('/search/songs') || reqUrl.pathname.includes('/api/search/songs')) {
        const query = reqUrl.searchParams.get('query') || 'Telugu Melodies';
        const targetUrl = `https://saavn.sumit.co/api/search/songs?query=${encodeURIComponent(query)}`;

        try {
            const rawData = await fetchJioSaavn(targetUrl);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(rawData));
        } catch (err) {
            // Fallback to secondary mirror if primary mirror rate limits
            try {
                const fallbackUrl = `https://jiosaavn-api-v3.vercel.app/api/search/songs?query=${encodeURIComponent(query)}`;
                const fallbackData = await fetchJioSaavn(fallbackUrl);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(fallbackData));
            } catch(e2) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: err.message }));
            }
        }
                
    } else {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: "Sunofy Local API Gateway Running OK" }));
    }
});

server.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🚀 Sunofy Music Local Server running at http://localhost:${PORT}`);
    console.log(`======================================================\n`);
});
