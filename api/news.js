export default async function handler(req, res) {
  const target = "https://www.thedailystar.net/json/dynamic-news/1624211";
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 7000);

  try {
    const upstream = await fetch(target, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });

    clearTimeout(timeoutId);

    if (!upstream.ok) {
      return res.status(502).json({ ok: false, data: [] });
    }

    const json = await upstream.json();
    const data = Array.isArray(json && json.data) ? json.data : [];

    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
    return res.status(200).json({ ok: true, data });
  } catch {
    clearTimeout(timeoutId);
    return res.status(504).json({ ok: false, data: [] });
  }
}
