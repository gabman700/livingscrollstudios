'use strict';

// Homepage (International) portfolio: the five Featured Shorts are present once each, the two existing Shorts are not duplicated, and the Featured Shorts filter exists. No network access.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const block = html.match(/const films=\[([\s\S]*?)\n\];/);
const films = eval('[' + block[1] + ']');

test('all five Featured Shorts are in the homepage portfolio', function () {
  const shorts = films.filter(function (x) { return x.shorts; }).map(function (x) { return x.id; });
  ['WKdoRQToIVc', 'ERpq_5jUbP4', 'ZpQgVRqv7is', 'GtJBdLrgl38', 'msya4chEh10'].forEach(function (id) {
    assert.ok(shorts.includes(id), 'missing short ' + id);
  });
});

test('no video appears twice in the homepage portfolio', function () {
  const ids = films.map(function (x) { return x.id; });
  assert.equal(new Set(ids).size, ids.length);
});

test('the existing Biblical and Music films are kept', function () {
  ['PURCv5nHZ6I', '8KvAYfOOLuA', 'pKyHAwMQ35Q', 'x-gnlZfUs_U', 'RBP6v1-6Yxs', 'IJYsBCmVcic', 'QcLVR67B0rg'].forEach(function (id) {
    assert.ok(films.some(function (x) { return x.id === id; }), 'missing ' + id);
  });
});

test('the Featured Shorts filter is present and the existing filters are unchanged', function () {
  assert.match(html, /<button class="on" data-f="all">All<\/button>/);
  assert.match(html, /<button data-f="bible">Biblical &amp; worship<\/button>/);
  assert.match(html, /<button data-f="music">Music videos<\/button>/);
  assert.match(html, /<button data-f="shorts">Featured Shorts<\/button>/);
});

test('no pricing, Selar or booking links were changed on the homepage', function () {
  assert.match(html, /href="\/booking-request\/"/);
  assert.match(html, /href="\/south-africa\/"/);
  assert.match(html, /href="\/nigeria\/"/);
});
