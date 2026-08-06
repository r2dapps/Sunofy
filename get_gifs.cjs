const https = require('https');

https.get('https://tenor.com/search/party-gifs', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const regex = /src=\"(https:\/\/media\.tenor\.com\/[^\"]+\.gif)\"/g;
    const matches = [...data.matchAll(regex)];
    console.log(matches.slice(0, 6).map(m => m[1]));
  });
});
