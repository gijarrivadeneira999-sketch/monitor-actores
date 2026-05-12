exports.handler = async function(event) {
  const NOTION_TOKEN = process.env.NOTION_TOKEN;
  const DB_ID = "316e58c9-7513-8354-aa81-813fbabf296a";
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  };
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers, body: "" };
  try {
    let all = [], hasMore = true, cursor = undefined;
    while (hasMore) {
      const body = { page_size: 100, sorts: [{ property: "Fecha", direction: "descending" }] };
      if (cursor) body.start_cursor = cursor;
      const res = await fetch("https://api.notion.com/v1/databases/" + DB_ID + "/query", {
        method: "POST",
        headers: { "Authorization": "Bearer " + NOTION_TOKEN, "Notion-Version": "2022-06-28", "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      if (!res.ok) return { statusCode: res.status, headers, body: JSON.stringify({ error: await res.text() }) };
      const data = await res.json();
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
    return { statusCode: 200, headers, body: JSON.stringify(noticias) };
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
  }
};
