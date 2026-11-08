// GET  /api/link                → { link, auto }  (admin only)
// POST /api/link {link?, auto?} → saves (admin only)
// Auth: header "x-admin-password" must equal env ADMIN_PASSWORD
const crypto = require('crypto');
const { getLink, setLink, getAuto, setAuto, isValidTgLink } = require('./_store');

async function state() {
  const [link, auto] = await Promise.all([getLink(), getAuto()]);
  return { link, auto };
}

function authorized(req) {
  const expected = process.env.ADMIN_PASSWORD || '';
  const got = String(req.headers['x-admin-password'] || '');
  if (!expected || got.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(got), Buffer.from(expected));
}

function readBody(req) {
  return new Promise((resolve) => {
    if (req.body) return resolve(typeof req.body === 'string' ? JSON.parse(req.body) : req.body);
    let s = '';
    req.on('data', (c) => (s += c));
    req.on('end', () => { try { resolve(JSON.parse(s || '{}')); } catch { resolve({}); } });
  });
}

function json(res, code, obj) {
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(obj));
}

module.exports = async (req, res) => {
  if (!process.env.ADMIN_PASSWORD) {
    return json(res, 500, { error: 'Vercel-এ ADMIN_PASSWORD সেট করা নেই — Settings → Environment Variables এ যোগ করে Redeploy করুন' });
  }
  if (!authorized(req)) return json(res, 401, { error: 'ভুল পাসওয়ার্ড' });

  if (req.method === 'GET') return json(res, 200, await state());

  if (req.method === 'POST') {
    const body = await readBody(req);
    try {
      if (body.link !== undefined) {
        const clean = String(body.link || '').trim();
        if (!isValidTgLink(clean)) {
          return json(res, 400, { error: 'সঠিক Telegram লিংক দিন (https://t.me/...)' });
        }
        await setLink(clean);
      }
      if (body.auto !== undefined) await setAuto(!!body.auto);
      return json(res, 200, { ok: true, ...(await state()) });
    } catch (e) {
      return json(res, 500, { error: e.message });
    }
  }

  json(res, 405, { error: 'Method not allowed' });
};
