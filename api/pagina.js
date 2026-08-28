/* Página do cliente, montada na hora a partir do estado compartilhado.
   É isto que faz /brb, /alelo, /qualquer-cliente existir assim que o
   protótipo é salvo no editor — sem gerar arquivo nenhum à mão. */
import { lerEstado } from './_estado.js';

const V = '13';

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}
/* JSON seguro dentro de <script>: nada pode fechar a tag */
function json(v) {
  return JSON.stringify(v).replace(/</g, '\\u003c').replace(/-->/g, '--\\u003e');
}

function documento(cfg) {
  const cores = { brand: (cfg.cores && cfg.cores.brand) || '#001489' };
  if (cfg.manual && cfg.cores) {
    if (cfg.cores.brandDark)  cores.brandDark  = cfg.cores.brandDark;
    if (cfg.cores.brandLight) cores.brandLight = cfg.cores.brandLight;
    if (cfg.cores.brandInk)   cores.brandInk   = cfg.cores.brandInk;
  }
  if (cfg.cores && cfg.cores.accent) cores.accent = cfg.cores.accent;

  const ap = cfg.appProprio || {};
  const tc = {
    cliente: cfg.cliente || 'Sua Marca',
    rotulo : cfg.rotulo || 'Viagens',
    logo   : cfg.logo || null,
    prime  : cfg.prime !== false,
    cores  : cores,
    appProprio: ap.ativo ? { ativo: true, imagem: ap.imagem || '', hotspot: ap.hotspot || null }
                         : { ativo: false }
  };
  if (cfg.padrao) tc.padrao = true;

  return '<!DOCTYPE html>\n<html lang="pt-BR">\n<head>\n<meta charset="UTF-8">\n' +
'<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">\n' +
'<meta name="theme-color" content="' + esc(cores.brand) + '">\n' +
'<meta name="robots" content="noindex">\n' +
'<title>' + esc(tc.cliente) + ' · ' + esc(tc.rotulo) + '</title>\n' +
'<link rel="preconnect" href="https://fonts.googleapis.com">\n' +
'<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n' +
'<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">\n' +
'<link rel="stylesheet" href="/assets/tc.css?v=' + V + '">\n</head>\n<body>\n' +
'<div class="phone"><div class="vp" id="vp"></div></div>\n' +
'<script>window.TC=' + json(tc) + ';</' + 'script>\n' +
'<script src="/assets/tc.js?v=' + V + '"></' + 'script>\n</body>\n</html>\n';
}

function naoAchei(slug) {
  return '<!DOCTYPE html>\n<html lang="pt-BR"><head><meta charset="UTF-8">' +
'<meta name="viewport" content="width=device-width,initial-scale=1">' +
'<title>Protótipo não encontrado</title>' +
'<style>body{margin:0;min-height:100dvh;display:flex;align-items:center;justify-content:center;' +
'background:#EBEDF1;color:#171B21;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;padding:24px}' +
'.cx{background:#fff;border:1px solid #DDE1E7;border-radius:16px;padding:30px 26px;max-width:420px;text-align:center}' +
'h1{font-size:20px;margin:0 0 8px}p{color:#626C78;font-size:14.5px;line-height:1.6;margin:0 0 18px}' +
'code{background:#F4F6F9;border-radius:5px;padding:2px 6px}' +
'a{display:inline-block;background:#001489;color:#fff;text-decoration:none;border-radius:999px;padding:11px 22px;font-weight:600;font-size:14px}' +
'</style></head><body><div class="cx"><h1>Protótipo não encontrado</h1>' +
'<p>Não existe nenhum protótipo com o link <code>/' + esc(slug) + '</code>. ' +
'Confira o endereço ou crie o protótipo no editor.</p>' +
'<a href="/">Abrir o editor</a></div></body></html>\n';
}

export default async function handler(req, res) {
  const bruto = (req.query && (req.query.slug || req.query.cliente)) || '';
  const slug = String(bruto).toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 60);
  res.setHeader('content-type', 'text/html; charset=utf-8');
  res.setHeader('cache-control', 'public, max-age=0, must-revalidate');
  if (!slug) return res.status(404).send(naoAchei(''));
  try {
    const estado = await lerEstado();
    const cli = (estado.clientes || []).find(
      c => String(c.slug || '').toLowerCase() === slug
    );
    if (!cli) return res.status(404).send(naoAchei(slug));
    return res.status(200).send(documento(cli));
  } catch (e) {
    return res.status(503).send(naoAchei(slug));
  }
}
