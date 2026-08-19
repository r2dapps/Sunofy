const fs = require('fs');
const path = require('path');

const gifDataPath = path.join(__dirname, 'gif_data.json');
const extraGifDataPath = path.join(__dirname, 'extra_gif_data.json');
const originalGifsPath = path.join(__dirname, '../original_gifs.txt');
const targetFilePath = path.join(__dirname, '../src/components/tabs/SyncPartyTab.tsx');

const gifData = JSON.parse(fs.readFileSync(gifDataPath, 'utf8'));
const extraGifData = JSON.parse(fs.readFileSync(extraGifDataPath, 'utf8'));
const allData = { ...gifData, ...extraGifData };

// Extract original object
const originalContent = fs.readFileSync(originalGifsPath, 'utf8');
const objMatch = originalContent.match(/const GIF_CATEGORIES = (\{[\s\S]*?\});/);
let originalObj = {};
if (objMatch) {
  // Use Function to evaluate the string safely to an object
  originalObj = new Function('return ' + objMatch[1])();
}

let output = 'const GIF_CATEGORIES = {\n';
for (const [category, urls] of Object.entries(allData)) {
  output += `  "${category}": [\n`;
  
  const originalItems = originalObj[category] || [];
  const originalUrls = originalItems.map(item => item.url);
  
  // Deduplicate URLs from the API
  const uniqueUrls = Array.from(new Set(urls));
  
  const finalItems = [...originalItems];
  
  // Append new unique URLs up to a total of 15
  for (let i = 0; i < uniqueUrls.length; i++) {
    if (finalItems.length >= 15) break;
    const url = uniqueUrls[i];
    if (!originalUrls.includes(url)) {
      finalItems.push({ name: `${category} ${finalItems.length + 1}`, url });
    }
  }
  
  for (let i = 0; i < finalItems.length; i++) {
    output += `    { name: "${finalItems[i].name}", url: "${finalItems[i].url}" }${i < finalItems.length - 1 ? ',' : ''}\n`;
  }
  output += `  ],\n`;
}
output += '};\n';

let fileContent = fs.readFileSync(targetFilePath, 'utf8');

const startIndex = fileContent.indexOf('const GIF_CATEGORIES = {');
const endIndex = fileContent.indexOf('export const SyncPartyTab');

if (startIndex !== -1 && endIndex !== -1) {
  const block = fileContent.substring(startIndex, endIndex);
  const closingBraceIndex = block.lastIndexOf('};');
  if (closingBraceIndex !== -1) {
    const fullEndIndex = startIndex + closingBraceIndex + 3;
    fileContent = fileContent.substring(0, startIndex) + output + fileContent.substring(fullEndIndex);
    fs.writeFileSync(targetFilePath, fileContent);
    console.log('Successfully updated GIF_CATEGORIES (merged with original) in SyncPartyTab.tsx');
  } else {
    console.error('Could not find closing brace for GIF_CATEGORIES');
  }
} else {
  console.error('Could not find GIF_CATEGORIES block');
}
