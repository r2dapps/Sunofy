const https = require('https');

const fetchTenor = (query, limit = 5) => {
  return new Promise((resolve) => {
    https.get(`https://tenor.com/en-GB/search/${query}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const regex = /src=\"(https:\/\/media\.tenor\.com\/[^\"]+\.gif)\"/g;
        const matches = [...data.matchAll(regex)];
        resolve(matches.slice(0, limit).map(m => m[1])); 
      });
    });
  });
};

const run = async () => {
  const queries = {
    'Forehead Kiss': 'forehead-kiss-gifs',
    'Neck Kiss': 'neck-kiss-gifs',
    'Cheek Kiss': 'cheek-kiss-gifs',
    'Bite': 'couple-bite-gifs',
    'Tease': 'couple-tease-gifs',
    'Massage': 'couple-massage-gifs',
    'Whisper': 'whisper-in-ear-gifs',
    'Holding Hands': 'holding-hands-gifs'
  };
  
  const result = {};
  for (const [tag, q] of Object.entries(queries)) {
    result[tag] = await fetchTenor(q, 15);
  }
  
  const fs = require('fs');
  fs.writeFileSync('extra_gif_data.json', JSON.stringify(result, null, 2));
};
run();
