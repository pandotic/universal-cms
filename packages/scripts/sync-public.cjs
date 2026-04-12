#!/usr/bin/env node

// Copies skills/, knowledgebases/, and their manifests into public/ so Netlify
// dev serves them locally. In production the app fetches from GitHub raw.

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const SKILLS_SRC = path.join(ROOT, 'skills');
const SKILLS_DST = path.join(ROOT, 'public', 'skills');
const SKILLS_MANIFEST_SRC = path.join(ROOT, 'skills-manifest.json');
const SKILLS_MANIFEST_DST = path.join(ROOT, 'public', 'skills-manifest.json');

const KB_SRC = path.join(ROOT, 'knowledgebases');
const KB_DST = path.join(ROOT, 'public', 'knowledgebases');
const KB_MANIFEST_SRC = path.join(ROOT, 'knowledgebases-manifest.json');
const KB_MANIFEST_DST = path.join(ROOT, 'public', 'knowledgebases-manifest.json');

function copyDir(src, dst) {
  if (fs.existsSync(dst)) fs.rmSync(dst, { recursive: true });
  fs.mkdirSync(dst, { recursive: true });

  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const dstPath = path.join(dst, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, dstPath);
    } else {
      fs.copyFileSync(srcPath, dstPath);
    }
  }
}

// Sync skills
copyDir(SKILLS_SRC, SKILLS_DST);
fs.copyFileSync(SKILLS_MANIFEST_SRC, SKILLS_MANIFEST_DST);

// Sync knowledgebases (if they exist)
if (fs.existsSync(KB_SRC)) {
  copyDir(KB_SRC, KB_DST);
}
if (fs.existsSync(KB_MANIFEST_SRC)) {
  fs.copyFileSync(KB_MANIFEST_SRC, KB_MANIFEST_DST);
}

console.log('Synced skills/ and knowledgebases/ with manifests → public/');
