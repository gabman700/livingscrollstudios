'use strict';

// Homepage navigation: regional links stay in the nav, links do not wrap on desktop, and the CTA is the only item hidden at narrow widths. No network access.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

test('regional and existing nav destinations are all present', function () {
  ['href="#services"', 'href="#work"', 'href="#process"', 'href="#pricing"', 'href="#about"', 'href="#contact"', 'href="/booking-request/"', 'href="/south-africa/">South Africa (ZAR)</a>', 'href="/nigeria/">Nigeria (NGN)</a>'].forEach(function (t) {
    assert.ok(html.includes(t), 'missing ' + t);
  });
});

test('nav links and logo do not wrap on desktop', function () {
  assert.match(html, /\.navlinks a,nav \.logo\{white-space:nowrap\}/);
});

test('the nav CTA is the only item hidden at narrow desktop widths', function () {
  assert.match(html, /@media\(max-width:1040px\)\{\.nav-cta\{display:none\}\}/);
  assert.match(html, /class="btn btn-gold nav-cta"/);
  assert.doesNotMatch(html, /@media\(max-width:1040px\)\{\.navlinks/);
});

test('nav links are hidden only at phone widths, as before', function () {
  assert.match(html, /@media\(max-width:820px\)\{\.navlinks\{display:none\}\}/);
});
