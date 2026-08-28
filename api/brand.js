/* Procura o logo e a cor da marca de um cliente.
   - ?url=brb.com.br   -> devolve varias opcoes de logo (so as URLs) e a cor declarada
   - ?pegar=<url>      -> baixa uma imagem e devolve em data URL (o navegador nao consegue,
                          por causa de CORS, e o editor precisa disso para tirar as cores)
   Roda no servidor porque o navegador nao pode ler o site de outra empresa. */

const UA = 'Mozilla/5.0 (compatible; TravelCloudBot/1.0; +https://rdc-travelcloud.vercel.app)';

async function baixar(u, ms = 7000) {
  return fetch(u, { redirect: 'follow', headers: { 'user-agent': UA }, signal: AbortSignal.timeout(ms) });
}

/* devolve a imagem em data URL, ou null */
async function comoDataUrl(u) {
  try {
    const r = await baixar(u, 8000);
    if (!r.ok) return null;
    const tipo = (r.headers.get('content-type') || '').split(';')[0];
    if (!/^image\//.test(tipo)) return null;
    const buf = Buffer.from(await r.arrayBuffer());
    if (!buf.length || buf.length > 3 * 1024 * 1024) return null;
    return `data:${tipo};base64,${buf.toString('base64')}`;
  } catch { return null; }
}

/* candidatos a logo dentro do HTML da pagina */
function acharNoHtml(html, base) {
  const abs = (u) => { try { return new URL(u, base).href; } catch { return null; } };
  const achados = [];
  const põe = (u, origem, peso) => { const a = abs(u); if (a) achados.push({ url: a, origem, peso }); };

  const todos = (re, grupo, origem, peso) => {
    let m; const r = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
    while ((m = r.exec(html)) !== null) põe(m[grupo], origem, peso);
  };

  todos(/<meta[^>]+property=["']og:logo["'][^>]+content=["']([^"']+)["']/i, 1, 'og:logo', 10);
  todos(/<link[^>]+rel=["'][^"']*apple-touch-icon[^"']*["'][^>]+href=["']([^"']+)["']/i, 1, 'apple-touch-icon', 8);
  todos(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["'][^"']*apple-touch-icon[^"']*["']/i, 1, 'apple-touch-icon', 8);
  // <img> que cheira a logo, pelo caminho, pelo alt ou pela classe
  todos(/<img[^>]+(?:src|data-src)=["']([^"']*(?:logo|marca|brand)[^"']*\.(?:svg|png|webp|jpg|jpeg))["']/i, 1, 'imagem do site', 9);
  todos(/<img[^>]+(?:class|id|alt)=["'][^"']*logo[^"']*["'][^>]*(?:src|data-src)=["']([^"']+)["']/i, 1, 'imagem do site', 7);
  todos(/<link[^>]+rel=["'](?:shortcut )?icon["'][^>]+href=["']([^"']+)["']/i, 1, 'ícone', 4);
  todos(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i, 1, 'og:image', 3);
  return achados;
}

export default async function handler(req, res) {
  res.setHeader('cache-control', 's-maxage=600');

  /* --- baixar uma imagem escolhida --- */
  const pegar = req.query.pegar;
  if (pegar) {
    const d = await comoDataUrl(String(pegar));
    if (!d) return res.status(502).json({ erro: 'Não consegui baixar essa imagem.' });
    return res.status(200).json({ dados: d });
  }

  /* --- procurar a marca --- */
  let alvo = String(req.query.url || '').trim();
  if (!alvo) return res.status(400).json({ erro: 'Informe url=' });
  if (!/^https?:\/\//i.test(alvo)) alvo = 'https://' + alvo.replace(/^\/+/, '');

  let html = '', base = alvo, nome = null, cor = null;
  try {
    const r = await baixar(alvo, 9000);
    base = r.url;
    html = (await r.text()).slice(0, 500000);
  } catch {
    return res.status(502).json({ erro: 'Não consegui abrir esse site.' });
  }

  const pega = (re) => { const m = html.match(re); return m ? m[1].trim() : null; };
  cor = pega(/<meta[^>]+name=["']theme-color["'][^>]+content=["']([^"']+)["']/i)
     || pega(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']theme-color["']/i);
  if (cor && !/^#?[0-9a-f]{3,8}$/i.test(cor.replace('#', ''))) cor = null;
  if (cor && cor[0] !== '#') cor = '#' + cor;
  nome = pega(/<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i)
      || (pega(/<title[^>]*>([^<]+)</i) || '').split(/[|\-–—]/)[0].trim() || null;

  const host = new URL(base).host;
  const candidatos = acharNoHtml(html, base);

  // logo declarado em CSS (background-image), comum em sites feitos em WordPress
  let m2; const reCss = /url\((['"]?)([^'")]*(?:logo|marca|brand)[^'")]*\.(?:svg|png|webp|jpg|jpeg))\1\)/gi;
  while ((m2 = reCss.exec(html)) !== null) {
    try { candidatos.push({ url: new URL(m2[2], base).href, origem: 'logo no CSS', peso: 8 }); } catch {}
  }

  // Wikidata: pega o logo oficial de marcas conhecidas, pelo nome
  const doWiki = [];
  if (nome) {
    try {
      const busca = await baixar('https://www.wikidata.org/w/api.php?action=wbsearchentities&format=json&language=pt&uselang=pt&limit=1&search=' + encodeURIComponent(nome), 6000);
      const jb = await busca.json();
      const id = jb.search && jb.search[0] && jb.search[0].id;
      if (id) {
        const cl = await baixar(`https://www.wikidata.org/w/api.php?action=wbgetclaims&format=json&entity=${id}&property=P154`, 6000);
        const jc = await cl.json();
        const arquivo = jc.claims && jc.claims.P154 && jc.claims.P154[0]
          && jc.claims.P154[0].mainsnak.datavalue && jc.claims.P154[0].mainsnak.datavalue.value;
        if (arquivo) {
          doWiki.push({
            url: 'https://commons.wikimedia.org/wiki/Special:FilePath/' + encodeURIComponent(arquivo) + '?width=480',
            origem: 'Wikipédia', peso: 12
          });
        }
      }
    } catch {}
  }

  // agrupa variações do mesmo ícone (favicon-57, favicon-114…) e fica com a maior
  const familia = (u) => u.replace(/\d+/g, '#');
  const porFamilia = new Map();
  for (const c of candidatos.sort((a, b) => b.peso - a.peso)) {
    const f = familia(c.url);
    const atual = porFamilia.get(f);
    const tamanho = (c.url.match(/(\d{2,4})/g) || ['0']).map(Number).sort((a, b) => b - a)[0];
    if (!atual || c.peso > atual.peso || (c.peso === atual.peso && tamanho > atual.tamanho)) {
      porFamilia.set(f, { ...c, tamanho });
    }
  }

  const fila = [
    ...doWiki,
    ...Array.from(porFamilia.values()).sort((a, b) => b.peso - a.peso || b.tamanho - a.tamanho).slice(0, 8),
    { url: `https://www.google.com/s2/favicons?domain=${host}&sz=256`, origem: 'ícone do site', peso: 2 },
    { url: `https://icons.duckduckgo.com/ip3/${host}.ico`, origem: 'ícone alternativo', peso: 1 }
  ];

  const checados = await Promise.all(fila.map(async (c) => {
    try {
      const r = await baixar(c.url, 5000);
      if (!r.ok) return null;
      const tipo = (r.headers.get('content-type') || '').split(';')[0];
      if (!/^image\//.test(tipo)) return null;
      const bytes = Number(r.headers.get('content-length') || 0);
      if (bytes > 3 * 1024 * 1024) return null;
      return { url: r.url, origem: c.origem, tipo, peso: c.peso + (/svg/.test(tipo) ? 3 : 0), bytes };
    } catch { return null; }
  }));

  const vistas = new Set();
  const logos = checados.filter(Boolean)
    .filter(l => { if (vistas.has(l.url)) return false; vistas.add(l.url); return true; })
    .sort((a, b) => b.peso - a.peso || b.bytes - a.bytes)
    .slice(0, 8);

  return res.status(200).json({ logos, cor, nome, origem: base });
}
