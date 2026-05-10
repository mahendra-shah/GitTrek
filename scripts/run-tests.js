// eslint-disable-next-line @typescript-eslint/no-require-imports
const { spawn } = require('child_process');

const args = process.argv.slice(2);
const isDeep = args.includes('--deep');

// Filter out --deep so Vitest doesn't complain about unknown CLI option
const filteredArgs = args.filter(arg => arg !== '--deep');

const env = { ...process.env };
if (isDeep) {
  env.DEEP_TEST = 'true';
}

console.log(`[Testing Architect] Starting test suite. Deep Mode: ${isDeep ? 'ON' : 'OFF'}`);

// Execute Vitest run with remaining arguments and appropriate environment variables
const child = spawn('npx', ['vitest', 'run', ...filteredArgs], {
  stdio: 'inherit',
  env,
  shell: true,
});

child.on('close', (code) => {
  process.exit(code);
});
