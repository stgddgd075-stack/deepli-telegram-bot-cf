# DeepLi Telegram Bot — Cloudflare Workers

ربات تلگرام DeepLi مخصوص **Cloudflare Workers** (JavaScript + Webhook).

## پیش‌نیاز

1. حساب [Cloudflare](https://dash.cloudflare.com)
2. نصب Node.js و Wrangler:

```bash
npm install -g wrangler
wrangler login
```

## راه‌اندازی سریع

```bash
git clone https://github.com/stgddgd075-stack/deepli-telegram-bot-cf.git
cd deepli-telegram-bot-cf
npm install
```

### ۱) Secrets را تنظیم کن

```bash
wrangler secret put TELEGRAM_BOT_TOKEN
# توکن ربات را وارد کن

wrangler secret put GEMINI_API_KEY
# کلید Gemini را وارد کن
```

### ۲) دیپلوی

```bash
npm run deploy
```

خروجی یک آدرس می‌دهد مثل:
`https://deepli-bot.<account>.workers.dev`

### ۳) Webhook تلگرام را ست کن

در مرورگر یا با curl:

```
https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://deepli-bot.<account>.workers.dev
```

### ۴) تست

در تلگرام به ربات `/start` بزن.

## اتصال از داشبورد Cloudflare (بدون CLI)

1. Cloudflare Dashboard → Workers & Pages → Create
2. Connect to Git → این ریپوی GitHub را انتخاب کن
3. Build command: خالی / Deploy command: `npx wrangler deploy`
4. در Settings → Variables، Secrets را اضافه کن:
   - `TELEGRAM_BOT_TOKEN`
   - `GEMINI_API_KEY`
5. بعد از Deploy، URL ورکر را در `setWebhook` بگذار.

## توکن و کلید نمونه (فقط برای تست — در production عوض کن)

- Bot token: از BotFather
- Gemini: از Google AI Studio

## قابلیت‌ها

- `/start` منو با دکمه‌ها
- چت هوشمند (Gemini)
- قیمت ارز (CoinGecko)
- ساخت عکس (pollinations)

ساخته شده برای @Amir13900001
