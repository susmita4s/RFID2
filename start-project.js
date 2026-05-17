const { spawn } = require('child_process');
const path = require('path');

console.log('\n======================================================');
console.log('🚀 Starting RFID School Management System Services...');
console.log('======================================================\n');

function runProcess(name, command, args, cwd, colorPrefix) {
  console.log(`[System] Starting ${name} in ${cwd}...`);
  
  // Use shell on Windows
  const child = spawn(command, args, { cwd, shell: true });

  child.stdout.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach(line => {
      if (line.trim()) {
        console.log(`${colorPrefix}[${name}]${'\x1b[0m'} ${line}`);
      }
    });
  });

  child.stderr.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach(line => {
      if (line.trim()) {
        console.error(`\x1b[31m[${name}-Error]\x1b[0m ${line}`);
      }
    });
  });

  child.on('close', (code) => {
    console.log(`[System] ${name} process exited with code ${code}`);
    if (code !== 0) {
      console.log(`\x1b[33m[System] ${name} crashed. Auto-restarting in 5 seconds...\x1b[0m`);
      setTimeout(() => runProcess(name, command, args, cwd, colorPrefix), 5000);
    }
  });

  child.on('error', (err) => {
    console.error(`\x1b[31m[System] Failed to start ${name} process: ${err.message}\x1b[0m`);
  });

  return child;
}

const backendDir = path.join(__dirname, 'backend');
const frontendDir = path.join(__dirname, 'frontend');

// Run Backend (Blue prefix)
runProcess('Backend', 'npm', ['run', 'dev'], backendDir, '\x1b[36m');

// Run Frontend (Magenta prefix)
runProcess('Frontend', 'npm', ['start'], frontendDir, '\x1b[35m');

// Handle root process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down all services gracefully...');
  process.exit(0);
});
process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down all services gracefully...');
  process.exit(0);
});
