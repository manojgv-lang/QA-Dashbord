export default async function handler(req, res) {
  const APPS_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbx20-majQxyCLQaSjvkZ8sZ6za2c86SoKqXasoffs3eM9u38otubiHHkcLeJXcBAFfZIw/exec";

  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      error: "Only POST method allowed"
    });
  }

  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(req.body)
    });

    const text = await response.text();

    res.setHeader("Access-Control-Allow-Origin", "*");

    try {
      return res.status(200).json(JSON.parse(text));
    } catch (err) {
      return res.status(500).json({
        ok: false,
        error: "Invalid response from Apps Script",
        details: text
      });
    }
  } catch (err) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.status(500).json({
      ok: false,
      error: err.message
    });
  }
}
