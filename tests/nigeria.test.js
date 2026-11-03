'use strict';

// Nigeria booking page. Prices are NGN only; WhatsApp is primary; no Selar or placeholder links. No network access.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'nigeria', 'index.html'), 'utf8');

test('package prices are the approved naira amounts', function () {
  assert.match(html, /<h3>Promo Clip<\/h3>\s*<div class="price">₦105,000<\/div>/);
  assert.match(html, /<h3>Full Video<\/h3>\s*<div class="price">₦245,000<\/div>/);
  assert.match(html, /<h3>Full Song<\/h3>\s*<div class="price">₦490,000<\/div>/);
  const pkgs = html.slice(html.indexOf('id="packages"'), html.indexOf('</section>', html.indexOf('id="packages"')));
  assert.equal(/R\d|ZAR|\$\d|USD/.test(pkgs), false);
});

test('each package WhatsApp CTA names the package and price, using the business number', function () {
  assert.equal((html.match(/wa\.me\/2347047237739\?text=/g) || []).length >= 4, true);
  assert.match(html, /book%20the%20Promo%20Clip%20package%20at%20%E2%82%A6105%2C000/);
  assert.match(html, /book%20the%20Full%20Video%20package%20at%20%E2%82%A6245%2C000/);
  assert.match(html, /book%20the%20Full%20Song%20package%20at%20%E2%82%A6490%2C000/);
});

test('no Selar, placeholder, draft or noindex markers remain', function () {
  assert.equal(/selar\.(co|com)|PLACEHOLDER|DRAFT|noindex|flutterwave|paystack/i.test(html), false);
});

test('SEO: Nigeria-specific title and description, canonical URL, indexable', function () {
  assert.match(html, /<title>Book a music video in Nigeria \| Living Scroll Studios<\/title>/);
  assert.match(html, /<meta name="description" content="[^"]*Nigerian[^"]*naira/);
  assert.match(html, /<link rel="canonical" href="https:\/\/livingscrollstudios\.com\/nigeria\/">/);
});

test('referrer policy lets the four portfolio videos play, and watch links remain', function () {
  assert.equal(/<meta name="referrer" content="no-referrer">/.test(html), false);
  assert.equal([...html.matchAll(/youtube-nocookie\.com\/embed\//g)].length, 4);
  assert.equal([...html.matchAll(/Watch on YouTube/g)].length, 4);
});

test('email contact and cross-links are present', function () {
  assert.match(html, /mailto:gabrielogunsanya@livingscrollstudios\.com/);
  assert.match(html, /href="\/south-africa\/"/);
  assert.match(html, /href="\/booking-request\/"/);
});
