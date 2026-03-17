const https = require('https');
const fs = require('fs');
const path = require('path');
const next = require('next');

// Configuration
const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';  // Listen on all interfaces
const port = process.env.PORT || 3001;

// Tailscale certificate paths
const domain = process.env.TAILSCALE_DOMAIN || 'lovelace.tail20b481.ts.net';

// Try multiple locations for certificates
const possibleCertDirs = [
  process.env.CERT_DIR,
  `${process.env.HOME}/.config/tailscale`,
  '/root/.config/tailscale',
  '/home/ada/.config/tailscale',
  __dirname,  // Current directory (where https-server.js is)
].filter(Boolean);

let certDir = possibleCertDirs[0];
let certPath, keyPath;

for (const dir of possibleCertDirs) {
  const possibleCert = path.join(dir, `${domain}.crt`);
  const possibleKey = path.join(dir, `${domain}.key`);
  if (fs.existsSync(possibleCert) && fs.existsSync(possibleKey)) {
    certDir = dir;
    certPath = possibleCert;
    keyPath = possibleKey;
    break;
  }
}

// Fallback to default if not found
if (!certPath) {
  certDir = process.env.CERT_DIR || `${process.env.HOME}/.config/tailscale`;
  certPath = path.join(certDir, `${domain}.crt`);
  keyPath = path.join(certDir, `${domain}.key`);
}

// Check if certificates exist
if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
  console.error('❌ Tailscale certificates not found!');
  console.error(`   Expected at: ${certPath}`);
  console.error(`   and: ${keyPath}`);
  console.error('');
  console.error('Run this command first:');
  console.error(`   sudo tailscale cert ${domain}`);
  process.exit(1);
}

console.log('🔐 Loading certificates...');
console.log(`   Cert: ${certPath}`);
console.log(`   Key: ${keyPath}`);

const httpsOptions = {
  cert: fs.readFileSync(certPath),
  key: fs.readFileSync(keyPath)
};

// Initialize Next.js
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare()
  .then(() => {
    https.createServer(httpsOptions, async (req, res) => {
      try {
        await handle(req, res);
      } catch (err) {
        console.error('Error handling request:', err);
        res.statusCode = 500;
        res.end('Internal Server Error');
      }
    }).listen(port, hostname, (err) => {
      if (err) throw err;
      console.log('');
      console.log('✅ HTTPS Server running');
      console.log(`   https://${domain}:${port}`);
      console.log(`   https://100.125.135.46:${port}`);
      console.log('');
      console.log('Press Ctrl+C to stop');
    });
  })
  .catch((err) => {
    console.error('Error starting server:', err);
    process.exit(1);
  });
