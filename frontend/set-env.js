const fs = require('fs');
const dotenv = require('dotenv');

// Load .env file from the root directory
dotenv.config({ path: '../.env' });

// Determine if we're in deployment
const isDeployment = process.env.REPL_SLUG && process.env.REPL_OWNER;

if (isDeployment) {
  // Use deployment URLs
  process.env.REACT_APP_API_URL = `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co:5000`;
  process.env.REACT_APP_WS_API_URL = `wss://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co:5000`;
}

// Write the current environment to a file
fs.writeFileSync('.env.runtime', Object.entries(process.env)
  .filter(([key]) => key.startsWith('REACT_APP_'))
  .map(([key, value]) => `${key}=${value}`)
  .join('\n'));