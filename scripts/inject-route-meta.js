#!/usr/bin/env node
// Patches per-route <title>/description/Open Graph tags into specific
// static HTML files after `expo export -p web`.
//
// Why this exists: expo-router/head's <Head> component only takes effect
// once client JS hydrates (it gates on navigation focus, which never
// resolves during the static prerender pass — confirmed by inspecting the
// actual export output). So non-JS crawlers like WhatsApp/Facebook/Twitter
// always see +html.tsx's site-wide defaults for every route unless we patch
// the file directly. Only routes worth a differentiated link preview are
// listed here — the group invite link is the one URL people actually share.
const fs = require('fs');
const path = require('path');

const SITE_URL = 'https://spliteasy-app.onrender.com';
const DIST_DIR = path.join(process.cwd(), 'dist');

const ROUTES = [
  {
    file: 'join/[token].html',
    title: 'SplitEasy — Join group',
    description: "You've been invited to split expenses together on SplitEasy — tap to join.",
    url: `${SITE_URL}/join`,
  },
];

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function patch(filePath, { title, description, url }) {
  let html = fs.readFileSync(filePath, 'utf8');
  const escTitle = escapeHtml(title);
  const escDescription = escapeHtml(description);
  const escUrl = escapeHtml(url);

  html = html
    .replace(/<title>.*?<\/title>/, `<title>${escTitle}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(")/, `$1${escDescription}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${escTitle}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${escDescription}$2`)
    .replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${escUrl}$2`)
    .replace(/(<meta name="twitter:title" content=")[^"]*(")/, `$1${escTitle}$2`)
    .replace(/(<meta name="twitter:description" content=")[^"]*(")/, `$1${escDescription}$2`);

  fs.writeFileSync(filePath, html);
}

for (const route of ROUTES) {
  const filePath = path.join(DIST_DIR, route.file);
  if (!fs.existsSync(filePath)) {
    console.warn(`[inject-route-meta] skipping ${route.file} — not found in dist/ (did the export succeed?)`);
    continue;
  }
  patch(filePath, route);
  console.log(`[inject-route-meta] patched ${route.file}`);
}
