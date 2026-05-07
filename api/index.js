export default async function handler(req, res) {
  const APPS_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbxnottuUJ8uDxE5IuDdpvXGoKbs14Sk4M_5jtOWwhcFu73NyJ8FWodl5SoA_V99V5vh/exec";

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const payload =
      typeof req.body === "string"
        ? JSON.parse(req.body || "{}")
        : req.body || {};

    const response = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      redirect: "follow",
    });

    const text = await response.text();

    if (text.trim().startsWith("<")) {
      return res.status(500).json({
        ok: false,
        error:
          "Apps Script returned HTML. Check deployment access: Execute as Me, Who has access Anyone.",
      });
    }

    return res.status(200).send(text);
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err.message,
    });
  }
}
