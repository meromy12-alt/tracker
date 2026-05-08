export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  const { key } = req.query;
  if (!key) return res.status(400).json({ error: "Missing key" });
  try {
    const r = await fetch(`https://openlibrary.org${key}.json`);
    if (!r.ok) return res.status(404).json({ error: "Not found" });
    const data = await r.json();
    const description = data.description
   ? (typeof data.description === "string" ? data.description : data.description.value || null)
   : null;
    return res.status(200).json({ description });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
} 