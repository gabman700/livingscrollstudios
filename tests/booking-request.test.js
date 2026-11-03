'use strict';

// USD booking page: theme restyle must not change prices, Selar links, WhatsApp/email, or add payment flows. No network access.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'booking-request', 'index.html'), 'utf8');

test('USD prices and package names are unchanged', function () {
  ['$150', '$350–500', '$700+', 'Pay $75 deposit &amp; book', 'Pay $175 deposit &amp; book', 'Pay $350 deposit &amp; book'].forEach(function (t) {
    assert.ok(html.includes(t), 'missing ' + t);
  });
  ['Promo Clip', 'Full Video', 'Full Song'].forEach(function (n) { assert.match(html, new RegExp('<h3>' + n + '</h3>')); });
});

test('Selar checkout links are unchanged, with the USD currency parameter', function () {
  ['https://selar.com/541t30k971?currency=USD', 'https://selar.com/t79r9z9g59?currency=USD', 'https://selar.com/14368065xa?currency=USD', 'https://selar.com/showlove/livingscrollstudios?currency=USD'].forEach(function (u) {
    assert.ok(html.includes(u), 'missing ' + u);
  });
});

test('WhatsApp and email contacts are preserved', function () {
  assert.match(html, /wa\.me\/2347047237739\?text=/);
  assert.match(html, /mailto:gabrielogunsanya@livingscrollstudios\.com/);
  assert.match(html, /WhatsApp: \+234 704 723 7739/);
});

test('no form or new payment flow is introduced, and the CSP still blocks scripts', function () {
  assert.equal(/<form|<script/i.test(html), false);
  assert.match(html, /script-src|default-src 'none'/);
});

test('privacy and homepage links remain', function () {
  assert.match(html, /href="\/privacy\.html"/);
  assert.match(html, /href="\/"/);
});
