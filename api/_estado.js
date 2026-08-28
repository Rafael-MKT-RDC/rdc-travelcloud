/* Estado compartilhado do Travel Cloud, guardado no Blob da Vercel.
   Tudo o que o editor grava passa por aqui — assim todo mundo que abre
   o site vê a mesma lista. */
import { put, list } from '@vercel/blob';
import crypto from 'node:crypto';

const PREFIXO = 'estado/';
const SENHA_PADRAO = 'rdc2026';
const EMAILS_PADRAO = [
  'gustavo.klein@rdcviagens.com.br',
  'rafael.valenca@rdcviagens.com.br',
  'marketing@rdcviagens.com.br'
];

export function sha(txt) {
  return crypto.createHash('sha256').update(String(txt)).digest('hex');
}
function segredo() {
  // deriva do token do Blob: existe só no servidor e nunca vai para o navegador
  return crypto.createHash('sha256')
    .update('travelcloud|' + (process.env.BLOB_READ_WRITE_TOKEN || 'sem-token'))
    .digest();
}

/** Cria um token de sessão assinado, válido por 30 dias. */
export function assinar(email) {
  const corpo = Buffer.from(JSON.stringify({
    email, exp: Date.now() + 30 * 24 * 3600 * 1000
  })).toString('base64url');
  const firma = crypto.createHmac('sha256', segredo()).update(corpo).digest('base64url');
  return corpo + '.' + firma;
}

/** Devolve o e-mail do token, ou null se estiver inválido/vencido. */
export function conferir(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const [corpo, firma] = token.split('.');
  const esperado = crypto.createHmac('sha256', segredo()).update(corpo).digest('base64url');
  const a = Buffer.from(firma || ''), b = Buffer.from(esperado);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const d = JSON.parse(Buffer.from(corpo, 'base64url').toString());
    if (!d.exp || d.exp < Date.now()) return null;
    return d.email;
  } catch { return null; }
}

export function tokenDaRequisicao(req) {
  const h = req.headers.authorization || '';
  return h.startsWith('Bearer ') ? h.slice(7) : '';
}

/** Lê o estado. O caminho tem sufixo aleatório, então a URL não é adivinhável. */
export async function lerEstado() {
  const { blobs } = await list({ prefix: PREFIXO, limit: 20 });
  const atual = blobs.sort((x, y) => new Date(y.uploadedAt) - new Date(x.uploadedAt))[0];
  if (!atual) {
    return { emails: EMAILS_PADRAO, senhaHash: sha(SENHA_PADRAO), clientes: [], novo: true };
  }
  const r = await fetch(atual.url, { cache: 'no-store' });
  const d = await r.json();
  return {
    emails: Array.isArray(d.emails) && d.emails.length ? d.emails : EMAILS_PADRAO,
    senhaHash: d.senhaHash || sha(SENHA_PADRAO),
    clientes: Array.isArray(d.clientes) ? d.clientes : []
  };
}

export async function gravarEstado(estado) {
  const limpo = {
    emails: estado.emails,
    senhaHash: estado.senhaHash,
    clientes: estado.clientes,
    atualizadoEm: new Date().toISOString()
  };
  await put(PREFIXO + 'travelcloud.json', JSON.stringify(limpo), {
    access: 'public', contentType: 'application/json',
    addRandomSuffix: true, cacheControlMaxAge: 0
  });
  // guarda só as duas versões mais recentes
  const { blobs } = await list({ prefix: PREFIXO, limit: 50 });
  const velhos = blobs.sort((x, y) => new Date(y.uploadedAt) - new Date(x.uploadedAt)).slice(3);
  if (velhos.length) {
    const { del } = await import('@vercel/blob');
    await del(velhos.map(b => b.url)).catch(() => {});
  }
  return limpo;
}
