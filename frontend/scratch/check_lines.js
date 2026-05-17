const fs = require('fs');
const lines = fs.readFileSync('src/pages/ParentPortal.js', 'utf8').split('\n');
for (let i = 633; i <= 639; i++) {
  console.log(`${i + 1}: ${JSON.stringify(lines[i])}`);
}
