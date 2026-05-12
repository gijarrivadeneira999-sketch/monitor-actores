export default async function handler(req, res) {
  const NOTION_TOKEN = process.env.NOTION_TOKEN;
  const DB_ID = "316e58c975138354aa81813fbabf296a";
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  try {
    let all = [], hasMore = true, cursor = undefined;
    while (hasMore) {
      const body = { page_size: 100, sorts: [{ property: "Fecha", direction: "descending" }] };
      if (cursor) body.start_cursor = cursor;
      const r = await fetch("https://api.notion.com/v1/databases/" + DB_ID + "/query", {
        method: "POST",
        headers: { "Authorization": "Bearer " + NOTION_TOKEN, "Notion-Version": "2022-06-28", "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      if (!r.ok) return res.status(r.status).json({ error: await r.text() });
      const data = await r.json();
      all = all.concat(data.results);
      hasMore = data.has_more;
      cursor = data.next_cursor;
    }
    const noticias = all.map(page => {
      const p = page.properties;
      const fecha = p["Fecha"]?.date?.start || null;
      return {
        id: page.id,
        titulo: p["Título"]?.title?.[0]?.plain_text || "",
        desc: p["Descripción"]?.rich_text?.[0]?.plain_text || "",
        impacto: p["Impacto"]?.select?.name || "",
        sector: p["Sector"]?.select?.name || "",
        factor: p["Factor"]?.select?.name || "",
        fuente: p["Fuente"]?.rich_text?.[0]?.plain_text || "",
        prioritario: p["Prioritario"]?.checkbox || false,
        fecha,
        dia: fecha ? parseInt(fecha.split("-")[2]) : null,
        mes: fecha ? parseInt(fecha.split("-")[1]) : null,
        anio: fecha ? parseInt(fecha.split("-")[0]) : null,
      };
    });
    res.status(200).json(noticias);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
