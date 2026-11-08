// Shared storage helper — uses Upstash Redis REST API (Vercel Marketplace → "Upstash for Redis").
// Vercel auto-adds KV_REST_API_URL + KV_REST_API_TOKEN (or UPSTASH_REDIS_REST_URL/TOKEN) when you connect it.
// Keys are prefixed "tg_" so this site can safely share the same Redis DB with the WhatsApp site.
const fs = require('fs');
const path = require('path');

const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

const DEFAULT_LINK = process.env.DEFAULT_TG_LINK || 'https://t.me/tradepoint_global';

// Local dev fallback: no KV configured → store in a JSON file
const LOCAL = (!URL_ || !TOKEN) && !!process.env.LOCAL_DEV;
const LOCAL_FILE = path.join(__dirname, '..', '.local-store.json');
function localAll() {
  try { return JSON.parse(fs.readFileSync(LOCAL_FILE, 'utf8')); } catch { return {}; }
}

async function redis(cmd) {
  if (!URL_ || !TOKEN) throw new Error('Storage not configured (KV_REST_API_URL / KV_REST_API_TOKEN missing)');
  const r = await fetch(URL_, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmd),
  });
  const data = await r.json();
  if (data.error) throw new Error(data.error);
  return data.result;
}

async function getVal(key) {
  if (LOCAL) return localAll()[key] ?? null;
  try { return await redis(['GET', key]); } catch (e) { console.error(e.message); return null; }
}

async function setVal(key, val) {
  if (LOCAL) {
    const all = localAll(); all[key] = val;
    return fs.writeFileSync(LOCAL_FILE, JSON.stringify(all, null, 2));
  }
  await redis(['SET', key, val]);
}

// Main Telegram link — falls back to the public channel, so the site works even before admin saves anything
async function getLink() { return (await getVal('tg_link')) || DEFAULT_LINK; }
const setLink = (link) => setVal('tg_link', link);

// Auto-redirect: default ON when never set
async function getAuto() {
  const v = await getVal('tg_auto_redirect');
  return v === null ? true : String(v) === '1';
}
const setAuto = (on) => setVal('tg_auto_redirect', on ? '1' : '0');

function isValidTgLink(link) {
  try {
    const u = new URL(link);
    return u.protocol === 'https:' &&
      ['t.me', 'telegram.me', 'www.telegram.me', 'telegram.dog'].includes(u.hostname) &&
      u.pathname.length > 1;
  } catch {
    return false;
  }
}

module.exports = { getLink, setLink, getAuto, setAuto, isValidTgLink };
