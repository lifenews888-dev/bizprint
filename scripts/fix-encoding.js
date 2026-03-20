const fs = require('fs');
const path = require('path');

const TARGET_DIR = './app';

function cleanContent(content) {
  return content
    .replace(/ðŸ[\x80-\xBF]{2,}/g, '')
    .replace(/âœ…/g, '')
    .replace(/âœ"/g, '')
    .replace(/â­/g, '')
    .replace(/â€"/g, '-')
    .replace(/â€œ/g, '"')
    .replace(/â€/g, '"')
    .replace(/â€˜/g, "'")
    .replace(/â€™/g, "'")
    .replace(/Ã+/g, '')
    .replace(/\uFFFD/g, '');
}

function walk(dir) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        const cleaned = cleanContent(content);
        if (content !== cleaned) {
          fs.writeFileSync(fullPath, cleaned, 'utf8');
          console.log('Fixed:', fullPath);
        }
      } catch (err) {
        console.log('Error:', fullPath, err.message);
      }
    }
  });
}

walk(TARGET_DIR);
console.log('DONE');
