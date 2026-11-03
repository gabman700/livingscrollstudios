'use strict';

// South Africa booking page (DRAFT, noindex). Prices are ZAR only; no Selar or payment links. No network access.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'south-africa', 'index.html'), 'utf8');
const home = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const OFFICIAL_EMAIL = 'gabrielogunsanya@livingscrollstudios.com';
const OFFICIAL_WA = '2347047237739';

const PACKAGES = [
  { name: 'Music Video under 1 minute', total: 'R1,500', deposit: 'R750', balance: 'R750', enc: 'Music%20Video%20under%201%20minute', encTotal: 'R1%2C500' },
  { name: 'Music Video under 2 minutes', total: 'R2,500', deposit: 'R1,250', balance: 'R1,250', enc: 'Music%20Video%20under%202%20minutes', encTotal: 'R2%2C500' },
  { name: 'Full Song Music Video', total: 'R3,500', deposit: 'R1,750', balance: 'R1,750', enc: 'Full%20Song%20Music%20Video', encTotal: 'R3%2C500' }
];

test('only the three approved ZAR prices appear; no naira, USD, GBP or Selar', function () {
  assert.equal(/₦|\bNGN\b|\bUSD\b|\bGBP\b|\$\s?\d/.test(html), false);
  const prices = [...new Set(html.match(/\bR\s?\d[\d,]*/g) || [])].sort();
  assert.deepEqual(prices, ['R750', 'R1,250', 'R1,500', 'R1,750', 'R2,500', 'R3,500'].sort());
  assert.equal(/selar\.com|PLACEHOLDER/i.test(html), false);
  assert.equal(/paystack|flutterwave|paypal|stripe/i.test(html), false);
});

test('page is live: no DRAFT banner and indexable', function () {
  assert.equal(/DRAFT, not for publication/.test(html), false);
  assert.equal(/noindex/.test(html), false);
});

test('three packages show their total and a 50/50 deposit and balance', function () {
  const names = [...html.matchAll(/<h3>(Music Video under 1 minute|Music Video under 2 minutes|Full Song Music Video)<\/h3>/g)].map(function (m) { return m[1]; });
  assert.deepEqual(names, ['Music Video under 1 minute', 'Music Video under 2 minutes', 'Full Song Music Video']);
  PACKAGES.forEach(function (p) {
    assert.match(html, new RegExp('<div class="price">' + p.total + '</div>\\s*<p class="split">Deposit ' + p.deposit + ' <span>·</span> Balance ' + p.balance + '</p>'));
    assert.equal(Number(p.total.replace(/[R,]/g, '')) / 2, Number(p.deposit.replace(/[R,]/g, '')));
    assert.equal(Number(p.total.replace(/[R,]/g, '')) / 2, Number(p.balance.replace(/[R,]/g, '')));
  });
});

test('each package has a Book on WhatsApp and a Book by email button with its package and price', function () {
  PACKAGES.forEach(function (p) {
    assert.match(html, new RegExp('wa\\.me/' + OFFICIAL_WA + '\\?text=[^"]*' + p.enc + '%20package%20at%20' + p.encTotal + '[^"]*"[^>]*>Book on WhatsApp<'));
    assert.match(html, new RegExp('mailto:' + OFFICIAL_EMAIL + '\\?subject=Booking%20-%20' + p.enc + '%20-%20' + p.encTotal + '%20-%20Living%20Scroll%20Studios%20South%20Africa"[^>]*>Book by email<'));
  });
});

test('the deposit and balance terms are explained', function () {
  assert.match(html, /<h3>Deposit and balance<\/h3>/);
  assert.match(html, /secures your production slot/);
  assert.match(html, /Balance: 50%\.<\/strong> The balance is due before final delivery/);
  assert.match(html, /Prices are in South African rand \(ZAR\)/);
});

test('package features are copied from the homepage', function () {
  const cards = html.match(/<div class="tier[\s\S]*?<\/ul>/g) || [];
  assert.equal(cards.length, 3);
  const items = cards.flatMap(function (c) { return [...c.matchAll(/<li>([^<]+)<\/li>/g)].map(function (m) { return m[1].replace(/&amp;/g, '&'); }); });
  assert.equal(items.length, 12);
  const h = home.replace(/&amp;/g, '&');
  items.forEach(function (li) { assert.ok(h.indexOf(li) !== -1, '"' + li + '" is not on the homepage'); });
});

test('the process runs choose, contact, deposit, production in order', function () {
  const list = html.match(/<ol class="steps">([\s\S]*?)<\/ol>/);
  assert.ok(list, 'How it works list missing');
  const steps = ['Choose a package', 'Contact us', 'Pay the deposit', 'Production begins'];
  let at = -1;
  steps.forEach(function (s) {
    const i = list[1].indexOf(s);
    assert.ok(i > at, 'step out of order or missing: ' + s);
    at = i;
  });
});

test('only the official WhatsApp number and email are used', function () {
  assert.deepEqual([...new Set(html.match(/wa\.me\/\d+/g) || [])], ['wa.me/' + OFFICIAL_WA]);
  assert.deepEqual([...new Set(html.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g) || [])], [OFFICIAL_EMAIL]);
});

test('no form, no script; only approved font links', function () {
  assert.equal(/<form|<script|<input|<textarea|<select/i.test(html), false);
  assert.equal(/<(img|object|embed)\b[^>]*\b(src|href)="https?:/i.test(html), false);
  const frames = [...html.matchAll(/<iframe\b[^>]*\bsrc="([^"]+)"/gi)].map(function (m) { return m[1]; });
  frames.forEach(function (u) { assert.ok(/^https:\/\/www\.youtube-nocookie\.com\/embed\/[A-Za-z0-9_-]{11}\?rel=0$/.test(u), 'unexpected frame: ' + u); });
  const links = [...html.matchAll(/<link [^>]*href="(https?:[^"]+)"/g)].map(function (m) { return m[1]; });
  links.forEach(function (u) { assert.ok(/^https:\/\/(fonts\.googleapis\.com|fonts\.gstatic\.com)(\/|$)/.test(u), 'unexpected link: ' + u); });
  assert.match(html, /http-equiv="Content-Security-Policy" content="default-src 'none'/);
});

test('five approved Featured Shorts (portrait) and four Full Music Videos', function () {
  const ids = [...html.matchAll(/youtube-nocookie\.com\/embed\/([A-Za-z0-9_-]{11})\?rel=0/g)].map(function (m) { return m[1]; });
  assert.deepEqual(ids.slice(0, 5), ['WKdoRQToIVc', 'ERpq_5jUbP4', 'ZpQgVRqv7is', 'GtJBdLrgl38', 'msya4chEh10']);
  assert.deepEqual(ids.slice(5), ['pKyHAwMQ35Q', 'x-gnlZfUs_U', '8KvAYfOOLuA', 'PURCv5nHZ6I']);
  assert.equal(new Set(ids).size, 9);
  assert.equal([...html.matchAll(/class="film portrait">/g)].length, 6); // five Shorts plus Yebo, which was already portrait
  assert.match(html, /\.film\.portrait\{aspect-ratio:9\/16/);
  assert.match(html, /\/shorts\/msya4chEh10/);
  assert.equal(/South African slang/i.test(html), false);
});

test('refund commitment uses the approved wording exactly', function () {
  assert.match(html, /Our music videos are created using generative AI, and occasional visual inconsistencies or AI-generated artifacts may occur\./);
  assert.match(html, /If your final video contains noticeable AI artifacts, visual inconsistencies, or other unintended elements that make it look obviously artificial, we will first make reasonable efforts to correct them\./);
  assert.match(html, /If we are unable to resolve these issues to an acceptable standard, we will issue a refund\./);
  assert.match(html, /Our goal is to deliver a cinematic video that meets the quality standard we promise\./);
});

test('WhatsApp is primary and labelled as a Nigerian number; email is the alternative', function () {
  assert.match(html, /WhatsApp: \+234 704 723 7739 \(a Nigerian number\)/);
  assert.match(html, /Email us instead/);
});

test('internal links point to pages that exist', function () {
  ['/booking-request/', '/privacy.html', '/'].forEach(function (h) { assert.match(html, new RegExp('href="' + h.replace(/\//g, '\\/') + '"')); });
  assert.equal(fs.existsSync(path.join(ROOT, 'booking-request', 'index.html')), true);
  assert.equal(fs.existsSync(path.join(ROOT, 'privacy.html')), true);
});

test('referrer policy lets YouTube embeds play (not no-referrer)', function () {
  assert.equal(/<meta name="referrer" content="no-referrer">/.test(html), false);
  assert.match(html, /<meta name="referrer" content="strict-origin-when-cross-origin">/);
  assert.equal([...html.matchAll(/Watch on YouTube/g)].length, 9);
});

test('no unverified Selar or payment links; each package keeps a WhatsApp booking button', function () {
  assert.equal(/selar\.(co|com)|flutterwave|paystack/i.test(html), false);
  const waBooks = html.match(/>Book on WhatsApp<\/a>/g) || [];
  assert.equal(waBooks.length, 3);
  ['Music%20Video%20under%201%20minute', 'Music%20Video%20under%202%20minutes', 'Full%20Song%20Music%20Video'].forEach(function (p) { assert.match(html, new RegExp(p)); });
});

test('homepage links to the South Africa page and keeps the Nigeria and USD links', function () {
  assert.match(home, /href="\/south-africa\/"/);
  assert.match(home, /href="\/booking-request\/"/);
});

test('homepage links to the Nigeria page (NGN) and keeps the South Africa link', function () {
  assert.match(home, /href="\/nigeria\/">Nigeria \(NGN\)</);
  assert.match(home, /href="\/south-africa\/"/);
});
