# TRADEPOINT — Telegram Landing page + Admin (tradepointe.xyz)

- `/` → Landing page (FB ads-এর লিংক এটা). ৩ সেকেন্ড পর অটো Telegram চ্যানেলে যায়, বাটনেও যায়।
- `/admin` → পাসওয়ার্ড দিয়ে Telegram লিংক পরিবর্তন।
- `/api/go` → সবসময় বর্তমান Telegram লিংকে redirect করে। কিছু সেভ না করলেও ডিফল্ট `https://t.me/tradepoint_global`।

## Vercel-এ Setup (একবারই)
1. GitHub repo-টা Vercel-এ Import করুন (Framework: **Other**)।
2. Project → **Storage** → **Upstash for Redis** (free) → Create → এই project-এ Connect।
3. **Settings → Environment Variables**: `ADMIN_PASSWORD` = শক্ত পাসওয়ার্ড
   (optional: `DEFAULT_TG_LINK`)
4. **Redeploy**।
5. **Settings → Domains** → `tradepointe.xyz` add করুন → Vercel যে DNS রেকর্ড দেখাবে
   (সাধারণত `A  @  76.76.21.21` আর `CNAME  www  cname.vercel-dns.com`) সেগুলো domain registrar-এ বসান।

## Customize
- Meta Pixel: `index.html` → `FB_PIXEL_IDS` এ নতুন Pixel/Dataset ID দিন। বাটনে ক্লিক = `Lead`, অটো-redirect = `AutoRedirect` (custom)।
- অটো-redirect সময়: `index.html` → `AUTO_REDIRECT_SECONDS`
