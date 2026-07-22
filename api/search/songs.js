const https = require('https');
const zlib = require('zlib');

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

module.exports = async (req, res) => {
    // Set CORS headers for mobile PWA & GitHub Pages
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const query = req.query.query || 'Telugu Melodies';
    const targetUrl = `https://saavn.sumit.co/api/search/songs?query=${encodeURIComponent(query)}`;

    try {
        const rawData = await fetchJioSaavn(targetUrl);
        res.status(200).json(rawData);
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
