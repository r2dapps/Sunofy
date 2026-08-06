const https = require('https');

const fetchTenor = (url) => {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const regex = /src=\"(https:\/\/media\.tenor\.com\/[^\"]+\.gif)\"/g;
        const matches = [...data.matchAll(regex)];
        resolve(matches.slice(0, 4).map(m => m[1])); // Get top 4 from each
      });
    });
  });
};

const run = async () => {
  const urls = [
    'https://tenor.com/en-GB/search/sensual-kiss-gifs',
    'https://tenor.com/en-GB/search/sensual-hug-gifs',
    'https://tenor.com/en-GB/search/sensual-cuddle-gifs'
  ];
  
  for (const url of urls) {
    console.log(url);
    console.log(await fetchTenor(url));
  }
};
run();
