#!/usr/bin/env node

// Force disable Jest workers and run Next.js dev server
process.env.JEST_WORKER_ID = '1';
process.env.NEXT_TELEMETRY_DISABLED = '1';
process.env.NODE_OPTIONS = '--max-old-space-size=2048 --no-deprecation --no-warnings';

// Override worker creation to prevent Jest worker usage
const originalRequire = require;
require = function(id) {
  if (id.includes('jest-worker') || id.includes('worker_threads')) {
    // Return a mock that doesn't use workers
    return {
      Worker: class MockWorker {
        constructor() {}
        async initialize() { return this; }
        async end() {}
        async getStdout() { return ''; }
        async getStderr() { return ''; }
      }
    };
  }
  return originalRequire.apply(this, arguments);
};

// Start Next.js
const { createServer } = require('http');
const next = require('next');

const dev = true;
const hostname = 'localhost';
const port = 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      await handle(req, res);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  }).listen(port, hostname, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});