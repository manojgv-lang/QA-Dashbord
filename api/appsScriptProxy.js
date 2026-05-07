// api/appsScriptProxy.js – serverless function at /api/appsScriptProxy

export default async function handler(req, res) {
  const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxnottuUJ8uDxE5IuDdpvXGoKbs14Sk4M_5jtOWwhcFu73NyJ8FWodl5SoA_V99V5vh/exec";

  const queryPart = req.url.includes("?") ? req.url.substring(req.url.indexOf("?")) : "";
  const targetUrl = `${APPS_SCRIPT_URL}${queryPart}`;

  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(200).end();
  }

  try {
    const fetchOptions = {
      method: req.method,
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" }
    };

    if (req.method === "POST") {
      fetchOptions.body = await getRawBody(req);
    }

    const appsRes = await fetch(targetUrl, fetchOptions);
    const text = await appsRes.text();

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.status(appsRes.status).send(text);
  } catch (err) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(500).json({ ok: false, error: err.message });
  }
}

function getRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", chunk => (data += chunk));
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}
