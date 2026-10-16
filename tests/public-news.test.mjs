import test from 'node:test';
import assert from 'node:assert/strict';
import { parseRss } from '../scripts/fetch-public-news.mjs';

test('public RSS parser keeps a dated HTTPS article and decodes XML text', () => {
  const xml = `<rss><channel><item><title><![CDATA[OLED &amp; cockpit news]]></title><link>https://publisher.example/article/1</link><pubDate>Thu, 15 Oct 2026 10:00:00 GMT</pubDate><source>Example News</source></item></channel></rss>`;
  const [article] = parseRss(xml, { who: 'boe', category: 'competitor' });
  assert.equal(article.title, 'OLED & cockpit news');
  assert.equal(article.date, '2026-10-15');
  assert.equal(article.source, 'Example News');
  assert.equal(article.category, 'competitor');
  assert.match(article.id, /^rss-[a-f\d]{20}$/);
});

test('public RSS parser rejects missing titles and non-HTTPS links', () => {
  const xml = `<rss><item><title>No secure link</title><link>http://example.com/a</link></item><item><title></title><link>https://example.com/b</link></item></rss>`;
  assert.deepEqual(parseRss(xml, { who: '', category: 'oem' }), []);
});
