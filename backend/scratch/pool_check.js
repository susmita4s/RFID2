const db = require('../db');

console.log('Testing DB pool connection...');
db.query('SELECT 1 + 1 AS result', (err, results) => {
  if (err) {
    console.error('❌ Pool Query Failed:', err.message);
    process.exit(1);
  } else {
    console.log('✅ Pool Query Successful! Result:', results[0].result);
    process.exit(0);
  }
});
