const fs = require('fs');
const content = fs.readFileSync('src/pages/ParentPortal.js', 'utf8');
content.split('\n').forEach((l, idx) => {
  if (l.includes('bi-send-fill') || (l.includes('support') && l.includes('tab'))) {
    console.log((idx+1) + ': ' + l.trim());
  }
});
