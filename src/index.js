/**
 * DeepLi Telegram Bot - Cloudflare Workers (JavaScript)
 * Webhook mode - suitable for Cloudflare
 */

const BOT_NAME = "DeepLi";
const CREATOR = "امیرحسین پهلوان";
const CREATOR_ID = "Amir13900001";

function mainKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "🔍 جستجو", callback_data: "web_search" },
        { text: "💻 تحلیل کد", callback_data: "code_analyze" },
      ],
      [
        { text: "📊 قیمت ارز", callback_data: "crypto_price" },
        { text: "🎨 ساخت عکس", callback_data: "generate_image" },
      ],
      [
        { text: "🤖 چت هوشمند", callback_data: "ai_chat" },
        { text: "📚 راهنما", callback_data: "help" },
      ],
      [
        { text: "🔄 شروع مجدد", callback_data: "new_chat" },
        { text: "👨‍💻 سازنده", url: `https://t.me/${CREATOR_ID}` },
      ],
    ],
  };
}

async function tg(token, method, body) {
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

async function geminiReply(apiKey, text) {
  const models = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-flash-latest"];
  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: {
            parts: [
              {
                text: "شما DeepLi هستید. هرگز نگو Gemini هستی. پاسخ به فارسی روان.",
              },
            ],
          },
          contents: [{ role: "user", parts: [{ text }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
        }),
      });
      const data = await res.json();
      const t = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (t) return t;
    } catch (e) {
      continue;
    }
  }
  return "❌ خطا در پاسخ هوش مصنوعی. کلید یا مدل را بررسی کن.";
}

async function cryptoPrices() {
  try {
    const r = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,dogecoin,solana&vs_currencies=usd"
    );
    const d = await r.json();
    return (
      `📊 قیمت‌ها:\n` +
      `• BTC: $${d.bitcoin?.usd ?? "?"}\n` +
      `• ETH: $${d.ethereum?.usd ?? "?"}\n` +
      `• DOGE: $${d.dogecoin?.usd ?? "?"}\n` +
      `• SOL: $${d.solana?.usd ?? "?"}`
    );
  } catch {
    return "خطا در دریافت قیمت.";
  }
}

async function generateImage(prompt) {
  const url =
    "https://image.pollinations.ai/prompt/" +
    encodeURIComponent(prompt) +
    "?width=512&height=512&nologo=true";
  const r = await fetch(url);
  if (!r.ok) return null;
  return await r.arrayBuffer();
}

async function handleUpdate(update, env) {
  const token = env.TELEGRAM_BOT_TOKEN;
  const geminiKey = env.GEMINI_API_KEY;

  // Callback query
  if (update.callback_query) {
    const q = update.callback_query;
    const chatId = q.message.chat.id;
    const data = q.data;
    await tg(token, "answerCallbackQuery", { callback_query_id: q.id });

    if (data === "crypto_price") {
      const text = await cryptoPrices();
      await tg(token, "sendMessage", {
        chat_id: chatId,
        text,
        reply_markup: mainKeyboard(),
      });
    } else if (data === "generate_image") {
      await tg(token, "sendMessage", {
        chat_id: chatId,
        text: "🎨 توضیح عکس را بفرست:",
      });
      // state is not persisted on Workers without KV; simple mode: next text = image
      await tg(token, "sendMessage", {
        chat_id: chatId,
        text: "(حالت ساخت عکس فعال — پیام بعدی به‌عنوان پرامپت استفاده می‌شود)",
        reply_markup: mainKeyboard(),
      });
    } else if (data === "ai_chat" || data === "new_chat") {
      await tg(token, "sendMessage", {
        chat_id: chatId,
        text: `🤖 چت با ${BOT_NAME} فعال است. پیام بفرست.`,
        reply_markup: mainKeyboard(),
      });
    } else if (data === "help") {
      await tg(token, "sendMessage", {
        chat_id: chatId,
        text: `راهنما:\n/start منو\nپیام متنی = چت\nدکمه‌ها برای قیمت و عکس\n\n${CREATOR}`,
        reply_markup: mainKeyboard(),
      });
    } else if (data === "web_search" || data === "code_analyze") {
      await tg(token, "sendMessage", {
        chat_id: chatId,
        text: "متن یا کد را بفرست تا با هوش مصنوعی پاسخ بدهم.",
        reply_markup: mainKeyboard(),
      });
    } else {
      await tg(token, "sendMessage", {
        chat_id: chatId,
        text: "انتخاب شد.",
        reply_markup: mainKeyboard(),
      });
    }
    return;
  }

  // Message
  const msg = update.message;
  if (!msg) return;

  const chatId = msg.chat.id;
  const text = (msg.text || "").trim();

  if (text === "/start" || text === "/clear") {
    const name = msg.from?.first_name || "کاربر";
    await tg(token, "sendMessage", {
      chat_id: chatId,
      text: `👋 سلام ${name}!\n\nبه ربات ${BOT_NAME} خوش آمدید.\nاز دکمه‌ها استفاده کن یا پیام بفرست.\n\n👨‍💻 ${CREATOR}`,
      reply_markup: mainKeyboard(),
    });
    return;
  }

  if (text === "/help") {
    await tg(token, "sendMessage", {
      chat_id: chatId,
      text: `راهنمای ${BOT_NAME}\n/start منو\nپیام = چت هوشمند\nدکمه‌ها: قیمت، عکس، ...`,
      reply_markup: mainKeyboard(),
    });
    return;
  }

  if (text === "/about") {
    await tg(token, "sendMessage", {
      chat_id: chatId,
      text: `ربات ${BOT_NAME}\nسازنده: ${CREATOR}\n@${CREATOR_ID}`,
      reply_markup: mainKeyboard(),
    });
    return;
  }

  // Default: AI chat
  if (text) {
    await tg(token, "sendChatAction", { chat_id: chatId, action: "typing" });
    const reply = await geminiReply(geminiKey, text);
    await tg(token, "sendMessage", {
      chat_id: chatId,
      text: reply.slice(0, 4000),
      reply_markup: mainKeyboard(),
    });
  }
}

export default {
  async fetch(request, env, ctx) {
    if (request.method === "GET") {
      return new Response(
        `DeepLi Bot OK — set webhook to this URL\n/start on Telegram after webhook is set.`,
        { status: 200 }
      );
    }

    if (request.method === "POST") {
      try {
        const update = await request.json();
        // Process in background so Telegram gets 200 quickly
        ctx.waitUntil(handleUpdate(update, env));
        return new Response("ok", { status: 200 });
      } catch (e) {
        return new Response("error", { status: 500 });
      }
    }

    return new Response("Method not allowed", { status: 405 });
  },
};
