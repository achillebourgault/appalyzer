const pngToIco = require('png-to-ico');
const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, '../public/icon.png');
const outputPath = path.join(__dirname, '../public/icon.ico');

try {
    const buf = await pngToIco(inputPath);
    fs.writeFileSync(outputPath, buf);
    console.log('[convert-icon-service] Icon converted successfully!');
} catch (error) {
    console.error('[convert-icon-service] Error converting icon:', error);
    process.exit(1);
}