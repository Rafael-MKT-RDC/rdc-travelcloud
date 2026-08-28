/* Captura de marca a partir do site do cliente (Vercel Serverless Function).
   Roda no servidor porque o navegador não consegue ler o site de outra empresa (CORS).
   GET /api/brand?url=https://www.brb.com.br  ->  { logo, cor, nome } */
export default async function handler(req, res) {
  const alvo = String(req.query.url || '');
  if (!/^https?:\/\//i.test(alvo)) {
    return res.status(400).json({ erro: 'Informe url=https://...' });
  }
  try {
    const r = await fetch(alvo, {
      redirect: 'follow',
      headers: { 'user-agent': 'Mozilla/5.0 (compatible; TravelCloudBot/1.0)' },
      signal: AbortSignal.timeout(9000)
    });
    const html = (await r.text()).slice(0, 400000);
    const base = new URL(r.url);
    const abs = (u) => { try { return new URL(u, base).href; } catch { return null; } };

    const pegar = (re) => { const m = html.match(re); return m ? m[1].trim() : null; };

    // cor: <meta name="theme-color"> é a mais confiável
    let cor = pegar(/<meta[^>]+name=["']theme-color["'][^>]+content=["']([^"']+)["']/i)
           || pegar(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']theme-color["']/i);
    if (cor && !/^#?[0-9a-f]{3,8}$/i.test(cor.replace('#',''))) cor = null;
    if (cor && cor[0] !== '#') cor = '#' + cor;

    // logo: og:image, apple-touch-icon, <link rel=icon>, ou uma <img> com "logo" no caminho
    const cand = [
      pegar(/<meta[^>]+property=["']og:logo["'][^>]+content=["']([^"']+)["']/i),
      pegar(/<link[^>]+rel=["']apple-touch-icon[^"']*["'][^>]+href=["']([^"']+)["']/i),
      pegar(/<img[^>]+src=["']([^"']*logo[^"']*\.(?:svg|png))["']/i),
      pegar(/<link[^>]+rel=["'](?:shortcut )?icon["'][^>]+href=["']([^"']+)["']/i),
      pegar(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
    ].filter(Boolean).map(abs).filter(Boolean);

    let logo = null;
    for (const u of cand) {
      try {
        const ir = await fetch(u, { signal: AbortSignal.timeout(6000) });
        if (!ir.ok) continue;
        const tipo = ir.headers.get('content-type') || '';
        if (!/^image\//.test(tipo)) continue;
        const buf = Buffer.from(await ir.arrayBuffer());
        if (buf.length > 900000) continue;
        logo = `data:${tipo.split(';')[0]};base64,${buf.toString('base64')}`;
        break;
      } catch { /* tenta o próximo */ }
    }

    const nome = pegar(/<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i)
              || pegar(/<title[^>]*>([^<]+)</i);

    res.setHeader('cache-control', 's-maxage=3600');
    return res.status(200).json({ logo, cor, nome, origem: r.url });
  } catch (e) {
    return res.status(502).json({ erro: 'Não consegui ler esse site.' });
  }
}
