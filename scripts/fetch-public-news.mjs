import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const feeds = [
  { query: '"Samsung Display" automotive OLED OR slidable OR rollable', who: 'samsung', category: 'competitor' },
  { query: 'BOE automotive OLED slidable rollable display', who: 'boe', category: 'competitor' },
  { query: 'Tianma automotive OLED display', who: '', category: 'competitor' },
  { query: 'AUO automotive OLED display', who: '', category: 'competitor' },
  { query: 'LG Display automotive slidable OLED OR rollable OLED', who: 'lgd', category: 'lgd' },
  { query: '(Mercedes-Benz OR Genesis OR BMW OR Zeekr OR "Li Auto" OR NIO OR XPeng) (automotive OLED OR cockpit display OR slidable OR rollable)', who: '', category: 'oem' },
];

const text = value => value
  .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
  .replace(/<[^>]*>/g, ' ')
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
  .replace(/&#x([\da-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
  .replace(/\s+/g, ' ').trim();

function field(xml, name) {
  const match = xml.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, 'i'));
  return match ? text(match[1]) : '';
}

export function parseRss(xml, feed, now = new Date()) {
  return [...xml.matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi)].map(([, item]) => {
    const title = field(item, 'title');
    const url = field(item, 'link');
    if (!title || !/^https:\/\//i.test(url)) return null;
    const published = new Date(field(item, 'pubDate'));
    const source = field(item, 'source') || 'Google News RSS';
    return {
      id: `rss-${createHash('sha256').update(url).digest('hex').slice(0, 20)}`,
      who: feed.who,
      category: feed.category,
      date: Number.isNaN(published.getTime()) ? now.toISOString().slice(0, 10) : published.toISOString().slice(0, 10),
      title,
      summary: source,
      url,
      source,
      mode: 'live',
    };
  }).filter(Boolean);
}

export async function collectNews(fetchImpl = fetch) {
  const results = await Promise.all(feeds.map(async feed => {
    const url = new URL('https://news.google.com/rss/search');
    url.search = new URLSearchParams({ q: feed.query, hl: 'ko', gl: 'KR', ceid: 'KR:ko' });
    try {
      const response = await fetchImpl(url, { headers: { 'user-agent': 'TWIN-BLOOMING-public-monitor/1.0' }, signal: AbortSignal.timeout(15000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return { ok: true, articles: parseRss(await response.text(), feed) };
    } catch (error) {
      return { ok: false, error: String(error?.message || error) };
    }
  }));
  const unique = new Map();
  for (const result of results) for (const article of result.articles || []) {
    if (!unique.has(article.url)) unique.set(article.url, article);
  }
  return {
    checkedAt: new Date().toISOString(),
    sourcesSucceeded: results.filter(result => result.ok).length,
    sourcesTotal: feeds.length,
    articles: [...unique.values()].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 100),
    errors: results.filter(result => !result.ok).map(result => result.error),
  };
}

async function main() {
  const output = resolve(dirname(fileURLToPath(import.meta.url)), '../public/news-feed.json');
  const data = await collectNews();
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  console.log(`Fetched ${data.articles.length} articles from ${data.sourcesSucceeded}/${data.sourcesTotal} RSS feeds.`);
  if (!data.sourcesSucceeded) console.warn('No RSS source succeeded. The site will show its verified reference items and mark live news as unavailable.');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
