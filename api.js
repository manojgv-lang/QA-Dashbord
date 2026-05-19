// api.js – Vercel serverless function exposed at /api

export default async function handler(req, res) {
  const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx20-majQxyCLQaSjvkZ8sZ6za2c86SoKqXasoffs3eM9u38otubiHHkcLeJXcBAFfZIw/exec;

  // Take over the query string (?listAgents=1, ?agent=..., etc.)
  const queryPart = req.url.includes("?") ? req.url.substring(req.url.indexOf("?")) : "";
  const targetUrl = `${APPS_SCRIPT_URL}${queryPart}`;

  // CORS preflight
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

    // Forward POST body (for disputes)
    if (req.method === "POST") {
      fetchOptions.body = await getRawBody(req);
    }

    const appsRes = await fetch(targetUrl, fetchOptions);
    const text = await appsRes.text();

    // Add CORS headers so browser accepts the response
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    res.status(appsRes.status).send(text);
  } catch (err) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(500).json({ ok: false, error: err.message });
  }
}

// helper: read raw body for POST
function getRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", chunk => (data += chunk));
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}
