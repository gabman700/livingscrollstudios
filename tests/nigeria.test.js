'use strict';

// Nigeria booking page. Prices are NGN only. Book Now opens the matching Selar NGN deposit checkout; WhatsApp stays
// for questions and for sending the song and brief. Only the three public deposit links may appear: balance links
// are private and must never be added to this page or this repository. No network access.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'nigeria', 'index.html'), 'utf8');

// Public Selar NGN deposit checkouts, one per package (approved 4 November 2026).
const PACKAGES = [
  { name: 'Promo Clip', total: '₦105,000', half: '₦52,500', enc: 'Promo%20Clip', encTotal: '%E2%82%A6105%2C000', checkout: 'https://selar.com/8qu78410en?currency=NGN' },
  { name: 'Full Video', total: '₦245,000', half: '₦122,500', enc: 'Full%20Video', encTotal: '%E2%82%A6245%2C000', checkout: 'https://selar.com/4e93a7171q?currency=NGN' },
  { name: 'Full Song', total: '₦490,000', half: '₦245,000', enc: 'Full%20Song', encTotal: '%E2%82%A6490%2C000', checkout: 'https://selar.com/22n13d6ff9?currency=NGN' }
];
// Selar products used by other pages (international USD and South Africa ZAR) must not appear here.
const OTHER_SELAR = ['541t30k971', 't79r9z9g59', '14368065xa', 'showlove', '911136411q', '1c79r9cd3r', '49492p2bm4'];

function tierBlocks() {
  return html.match(/<div class="tier[\s\S]*?<\/div>\s*<\/div>/g) || [];
}

test('package prices are the approved naira amounts', function () {
  assert.match(html, /<h3>Promo Clip<\/h3>\s*<div class="price">₦105,000<\/div>/);
  assert.match(html, /<h3>Full Video<\/h3>\s*<div class="price">₦245,000<\/div>/);
  assert.match(html, /<h3>Full Song<\/h3>\s*<div class="price">₦490,000<\/div>/);
  const pkgs = html.slice(html.indexOf('id="packages"'), html.indexOf('</section>', html.indexOf('id="packages"')));
  assert.equal(/R\d|ZAR|\$\d|USD/.test(pkgs), false);
});

test('each package shows a 50% deposit and 50% balance', function () {
  PACKAGES.forEach(function (p) {
    assert.match(html, new RegExp('<h3>' + p.name + '</h3>\\s*<div class="price">' + p.total + '</div>\\s*<p class="split">Deposit ' + p.half + ' <span>·</span> Balance ' + p.half + '</p>'));
    assert.equal(Number(p.total.replace(/[₦,]/g, '')) / 2, Number(p.half.replace(/[₦,]/g, '')));
  });
  assert.match(html, /Deposit: 50%\.<\/strong> The deposit secures your production slot\. You pay it in naira when you book, through Selar/);
  assert.match(html, /Balance: 50%\.<\/strong> The balance is due before final delivery\. We send you a private Selar payment link, in naira, when it is due/);
  assert.equal(/confirmed when you contact us/.test(html), false);
});

test("each package's Book Now button opens its own Selar NGN deposit checkout", function () {
  const tiers = tierBlocks();
  assert.equal(tiers.length, 3);
  PACKAGES.forEach(function (p, i) {
    const t = tiers[i];
    assert.match(t, new RegExp('<h3>' + p.name + '</h3>'));
    const book = t.match(/<a href="([^"]+)"[^>]*>Book Now · pay (₦[\d,]+) deposit<\/a>/);
    assert.ok(book, 'no Book Now button for ' + p.name);
    assert.equal(book[1], p.checkout, 'wrong checkout for ' + p.name);
    assert.equal(book[2], p.half, 'wrong deposit label for ' + p.name);
    assert.match(book[1], /\?currency=NGN$/);
    assert.match(t, new RegExp('href="' + p.checkout.replace(/[.?]/g, '\\$&') + '" class="btn btn-gold" target="_blank" rel="noopener"'));
    assert.match(t, /Secure checkout on Selar, charged in naira \(₦\)/);
    assert.match(t, new RegExp('wa\\.me/2347047237739\\?text=[^"]*' + p.enc + '%20package%20%28' + p.encTotal + '%29[^"]*"[^>]*>Questions\\? Ask on WhatsApp<'));
  });
  assert.match(tiers[1], /^<div class="tier feat">/);
  assert.equal((html.match(/>Book on WhatsApp</g) || []).length, 0);
  assert.equal((html.match(/>Book by email</g) || []).length, 0);
});

test('only the three approved Selar deposit links appear; no balance or other-page checkout links', function () {
  const selar = html.match(/https?:\/\/(?:www\.)?selar\.(?:com|co)[^"'\s<)]*/gi) || [];
  assert.deepEqual(selar, PACKAGES.map(function (p) { return p.checkout; }));
  OTHER_SELAR.forEach(function (id) { assert.equal(html.indexOf(id), -1, 'other Selar link on Nigeria page: ' + id); });
  assert.equal(/currency=(USD|ZAR)/i.test(html), false);
});

test('booking steps run choose, Book Now, deposit, song and brief, production, balance', function () {
  const list = html.match(/<ol class="steps">([\s\S]*?)<\/ol>/);
  assert.ok(list, 'How it works list missing');
  assert.equal((list[1].match(/<li>/g) || []).length, 6);
  let at = -1;
  ['Choose a package', 'Click Book Now', 'Pay the deposit', 'Send your song and brief', 'Production begins', 'Balance before delivery'].forEach(function (s) {
    const i = list[1].indexOf(s);
    assert.ok(i > at, 'step out of order or missing: ' + s);
    at = i;
  });
});

test('WhatsApp stays for questions and the song and brief; production timeline unchanged', function () {
  assert.equal((html.match(/>Questions\? Ask on WhatsApp<\/a>/g) || []).length, 3);
  assert.match(html, /Send your song and creative brief on WhatsApp or by email/);
  assert.match(html, />Message us on WhatsApp<\/a>/);
  assert.match(html, /Production takes 5 days, starting once your deposit and your song and brief have been received/);
});

test('no placeholder, draft or noindex markers; no other payment providers linked', function () {
  assert.equal(/PLACEHOLDER|DRAFT|noindex|flutterwave|paystack/i.test(html), false);
});

test('SEO: Nigeria-specific title and description, canonical URL, indexable', function () {
  assert.match(html, /<title>Book a music video in Nigeria \| Living Scroll Studios<\/title>/);
  assert.match(html, /<meta name="description" content="[^"]*Nigerian[^"]*naira/);
  assert.match(html, /<link rel="canonical" href="https:\/\/livingscrollstudios\.com\/nigeria\/">/);
});

test('referrer policy lets the nine portfolio videos play, and watch links remain', function () {
  assert.equal(/<meta name="referrer" content="no-referrer">/.test(html), false);
  assert.equal([...html.matchAll(/youtube-nocookie\.com\/embed\//g)].length, 9);
  assert.equal([...html.matchAll(/Watch on YouTube/g)].length, 9);
});

test('email contact and cross-links are present', function () {
  assert.match(html, /mailto:gabrielogunsanya@livingscrollstudios\.com/);
  assert.match(html, /href="\/south-africa\/"/);
  assert.match(html, /href="\/booking-request\/"/);
});

test('five Featured Shorts and four Full Music Videos, with no duplicate embeds', function () {
  const ids = [...html.matchAll(/youtube-nocookie\.com\/embed\/([A-Za-z0-9_-]{11})\?rel=0/g)].map(function (m) { return m[1]; });
  assert.deepEqual(ids.slice(0, 5), ['WKdoRQToIVc', 'ERpq_5jUbP4', 'ZpQgVRqv7is', 'GtJBdLrgl38', 'msya4chEh10']);
  assert.deepEqual(ids.slice(5), ['pKyHAwMQ35Q', 'x-gnlZfUs_U', '8KvAYfOOLuA', 'PURCv5nHZ6I']);
  assert.equal(new Set(ids).size, 9);
  assert.match(html, /<h3 class="group-title">Featured Shorts<\/h3>/);
  assert.match(html, /<h3 class="group-title">Full Music Videos<\/h3>/);
});
