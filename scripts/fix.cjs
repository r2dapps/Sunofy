const fs = require('fs');
let code = fs.readFileSync('src/components/tabs/VideoTab.tsx', 'utf-8');

// handleSelectVideo
code = code.replace(
  /const handleSelectVideo = \(video: SampleVideo \| SavedVideoItem\) => {/,
  "const handleSelectVideo = (video: SampleVideo | SavedVideoItem) => {\n    onVideoPlay?.();"
);

// handleLocalUpload
code = code.replace(
  /setLocalFileSize\(`\$\{sizeStr\} Local File`\);\n\n      setIsPlaying\(true\);/,
  "setLocalFileSize(`${sizeStr} Local File`);\n      onVideoPlay?.();\n      setIsPlaying(true);"
);

// handleLoadCustomUrl - 1
code = code.replace(
  /const ytId = extractYoutubeId\(url\);\n    if \(ytId\) {/,
  "const ytId = extractYoutubeId(url);\n    if (ytId) {\n      onVideoPlay?.();"
);

// handleLoadCustomUrl - 2
code = code.replace(
  /const dmId = extractDailymotionId\(url\);\n    if \(dmId\) {/,
  "const dmId = extractDailymotionId(url);\n    if (dmId) {\n      onVideoPlay?.();"
);

// handleLoadCustomUrl - 3
code = code.replace(
  /const vimeoId = extractVimeoId\(url\);\n    if \(vimeoId\) {/,
  "const vimeoId = extractVimeoId(url);\n    if (vimeoId) {\n      onVideoPlay?.();"
);

// handleLoadCustomUrl - 4
code = code.replace(
  /const driveId = extractGoogleDriveId\(url\);\n    if \(driveId\) {/,
  "const driveId = extractGoogleDriveId(url);\n    if (driveId) {\n      onVideoPlay?.();"
);

// handleLoadCustomUrl - 5
code = code.replace(
  /if \(url\.startsWith\('http:\/\/'\) \|\| url\.startsWith\('https:\/\/'\) \|\| url\.startsWith\('blob:'\)\) {/,
  "if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) {\n      onVideoPlay?.();"
);

// togglePlayPause
code = code.replace(
  /video\.play\(\)\.catch\(\(\) => {}\);\n      setIsPlaying\(true\);/,
  "onVideoPlay?.();\n      video.play().catch(() => {});\n      setIsPlaying(true);"
);

fs.writeFileSync('src/components/tabs/VideoTab.tsx', code);
