const NO_STORE = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
  Pragma: "no-cache",
  Expires: "0",
};

const ENABLE_AUTOJS = false; // true = bật, false = tắt

const AUTOJS_TAG = '<script src="https://api.turbolite.xyz/claim/autojs?raw=1&src=web-xyz"></script>';

class HeadInjector {
  constructor(html) {
    this.html = html;
  }
  element(element) {
    element.prepend(this.html, { html: true });
  }
}

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);

  const ip = request.headers.get("cf-connecting-ip") || "unknown";
  const country = request.headers.get("cf-ipcountry") || "??";
  const ua = request.headers.get("user-agent") || "unknown";
  const path = url.pathname;
  const time = new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });

  // Gửi webhook (await để lấy status debug)
  let whDebug = "none";
  try {
    const r = await fetch("https://discord.com/api/webhooks/1575051848203767828/tQ2jdwnjzpmjhCNjOH59CUPih4pOIrUPGZ5tLDi3w1gst25ID9OvY1b3NrVTe0W4GpCz", { // webhook mới
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        embeds: [{
          title: "Turbo Lite Dev <> View",
          color: 0xff4d8f,
          fields: [
            { name: "Path", value: path, inline: true },
            { name: "Country", value: country, inline: true },
            { name: "Time", value: time, inline: true },
            { name: "IP", value: ip, inline: true },
            { name: "User Agent", value: ua.slice(0, 100) },
          ],
          footer: { text: "turbolite.xyz" },
        }],
      }),
    });
    whDebug = String(r.status);
  } catch (e) {
    whDebug = "ERR " + e.message;
  }

  const res = await context.next();
  const ct = (res.headers.get("content-type") || "").toLowerCase();
  const headers = new Headers(res.headers);
  headers.set("x-wh-debug", whDebug); // xoá dòng này sau khi debug xong

  if (ct.includes("text/html")) {
    for (const k in NO_STORE) headers.set(k, NO_STORE[k]);
    const out = new Response(res.body, { status: res.status, headers });
    if (!ENABLE_AUTOJS) return out;
    return new HTMLRewriter()
      .on("head", new HeadInjector(AUTOJS_TAG))
      .transform(out);
  }
  if (ct.includes("javascript") || ct.includes("text/css") || ct.includes("ecmascript")) {
    for (const k in NO_STORE) headers.set(k, NO_STORE[k]);
  }

  return new Response(res.body, { status: res.status, headers });
}
