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
    'Hi': 'hi-gifs',
    'Movie & Popcorn': 'popcorn-movie-gifs',
    'Vibing': 'vibing-to-music-gifs',
    'Hit on Head': 'hit-on-head-gifs',
    'Slap': 'cute-slap-gifs',
    'Bike Ride': 'couple-bike-ride-gifs',
    'Car Driving': 'couple-driving-gifs',
    'Love': 'romantic-couple-gifs',
    'Hug': 'hug-gifs',
    'Kiss': 'kiss-gifs',
    'Telugu Memes': 'telugu-comedy-gifs',
    'Sensual Kiss': 'sensual-kiss-gifs',
    'Sensual Hug': 'sensual-hug-gifs',
    'Sensual Cuddle': 'sensual-cuddle-gifs'
  };
  
  const result = {};
  for (const [tag, q] of Object.entries(queries)) {
    console.log(`Fetching ${tag}...`);
    result[tag] = await fetchTenor(q, 6);
  }
  
  const fs = require('fs');
  fs.writeFileSync('gif_data.json', JSON.stringify(result, null, 2));
  console.log('Done!');
};
run();
