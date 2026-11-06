'use strict';

// Site improvements: mobile menu, WhatsApp enquiry, SEO metadata, sitemap and robots, portfolio context.
// Reads files only; no network access.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = function (p) { return fs.readFileSync(path.join(ROOT, p), 'utf8'); };
const home = read('index.html');
const ng = read('nigeria/index.html');
const sa = read('south-africa/index.html');
const WA = '2347047237739';
const SITE = 'https://livingscrollstudios.com';

test('every page has a CSS-only mobile menu with access to the page sections', function () {
  [home, ng, sa].forEach(function (html) {
    assert.match(html, /<details class="mnav">/);
    assert.match(html, /<summary aria-label="Open menu">/);
    assert.match(html, /<div class="mnav-panel">[\s\S]*?<a href="#work">Work<\/a>/);
  });
  assert.match(home, /<div class="mnav-panel">[\s\S]*?<a href="#services">Services<\/a>[\s\S]*?<a href="#pricing">Pricing<\/a>/);
});

test('mobile menu adds no script and keeps the desktop navigation', function () {
  [ng, sa].forEach(function (html) {
    assert.equal(/<script/i.test(html), false);
  });
  assert.match(home, /<div class="navlinks">/);
  assert.match(ng, /<div class="navlinks">/);
  assert.match(sa, /<div class="navlinks">/);
});

test('homepage WhatsApp enquiry uses the verified number and sits beside email', function () {
  const wa = home.match(/href="https:\/\/wa\.me\/(\d+)\?[^"]*"[^>]*>Message us on WhatsApp</);
  assert.ok(wa, 'WhatsApp enquiry link missing');
  assert.equal(wa[1], WA);
  const gap = home.indexOf('Message us on WhatsApp') - home.indexOf('Email the studio');
  assert.ok(gap > 0 && gap < 400, 'WhatsApp should sit next to the email button');
});

test('canonical URLs and Open Graph metadata are consistent on all three pages', function () {
  assert.match(home, /<link rel="canonical" href="https:\/\/livingscrollstudios\.com\/">/);
  assert.match(home, /<meta property="og:url" content="https:\/\/livingscrollstudios\.com\/">/);
  assert.match(ng, /<link rel="canonical" href="https:\/\/livingscrollstudios\.com\/nigeria\/">/);
  assert.match(sa, /<link rel="canonical" href="https:\/\/livingscrollstudios\.com\/south-africa\/">/);
  [home, ng, sa].forEach(function (html) {
    assert.match(html, /<meta property="og:title" content="[^"]+">/);
    assert.match(html, /<meta property="og:description" content="[^"]+">/);
    assert.match(html, /<meta property="og:image" content="https:\/\/i\.ytimg\.com\/[^"]+">/);
    assert.match(html, /<meta name="twitter:card" content="summary_large_image">/);
  });
  const titleOf = function (html) { return html.match(/<title>([^<]+)<\/title>/)[1]; };
  const ogOf = function (html) { return html.match(/<meta property="og:title" content="([^"]+)">/)[1]; };
  [home, ng, sa].forEach(function (html) { assert.equal(ogOf(html), titleOf(html)); });
});

test('homepage structured data is valid JSON and makes no unverified claims', function () {
  const block = home.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  assert.ok(block, 'JSON-LD block missing');
  const data = JSON.parse(block[1]);
  const types = data['@graph'].map(function (n) { return n['@type']; });
  assert.deepEqual(types.sort(), ['Organization', 'Service', 'Service', 'WebSite']);
  const org = data['@graph'].find(function (n) { return n['@type'] === 'Organization'; });
  assert.equal(org.email, 'gabrielogunsanya@livingscrollstudios.com');
  assert.equal(JSON.stringify(data).includes('founder'), false, 'founder is not a verified role');
  assert.equal(JSON.stringify(data).includes('aggregateRating'), false, 'no ratings are claimed');
});

test('robots.txt allows crawling and points to the sitemap; sitemap lists the public pages', function () {
  const robots = read('robots.txt');
  assert.match(robots, /^User-agent: \*$/m);
  assert.match(robots, /^Allow: \/$/m);
  assert.match(robots, new RegExp('^Sitemap: ' + SITE.replace(/\./g, '\\.') + '/sitemap\\.xml$', 'm'));
  const sitemap = read('sitemap.xml');
  ['/', '/nigeria/', '/south-africa/', '/privacy.html'].forEach(function (u) {
    assert.ok(sitemap.includes('<loc>' + SITE + u + '</loc>'), 'missing ' + u);
  });
  assert.equal(/booking-request|uk-gospel/.test(sitemap), false);
});

test('regional pages keep their strict CSP exactly and gain no scripts', function () {
  [ng, sa].forEach(function (html) {
    assert.match(html, /http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline' https:\/\/fonts\.googleapis\.com; font-src https:\/\/fonts\.gstatic\.com; img-src 'self' data: https:\/\/i\.ytimg\.com; frame-src https:\/\/www\.youtube-nocookie\.com; base-uri 'none'; form-action 'none'"/);
    assert.equal(/<script/i.test(html), false);
  });
});

test('each regional portfolio card has a format tag, and descriptions come from approved copy', function () {
  [ng, sa].forEach(function (html) {
    const cards = html.match(/<article class="work-card">[\s\S]*?<\/article>/g) || [];
    assert.equal(cards.length, 9);
    cards.forEach(function (c) { assert.match(c, /<p class="work-tag">[^<]+<\/p>/); });
  });
});
