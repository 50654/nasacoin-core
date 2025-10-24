#!/usr/bin/env node
/* Simple build script to package the dashboard into dist/ */

const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();
const distDir = path.join(projectRoot, 'dist');

const filesToCopy = [
  'index.html',
  'styles.css',
  'config.js',
  'app.js',
  'wallet-integration.js',
  'trading-features.js',
  'enhanced-features.js',
  'analytics-dashboard.js',
  'staking-pool.js'
];

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function copyFile(src, dest) {
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
}

function main() {
  console.log('Building NASA Coin Dashboard...');
  ensureDir(distDir);

  filesToCopy.forEach((relPath) => {
    const src = path.join(projectRoot, relPath);
    const dest = path.join(distDir, path.basename(relPath));
    if (!fs.existsSync(src)) {
      console.warn(`Warning: ${relPath} not found, skipping.`);
      return;
    }
    copyFile(src, dest);
    console.log(`Copied ${relPath} -> dist/${path.basename(relPath)}`);
  });

  console.log('Dashboard build complete. Output in dist/.');
}

main();
