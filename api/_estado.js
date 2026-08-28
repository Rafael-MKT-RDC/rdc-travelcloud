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
/* Protótipos que existem desde o começo. Servem de rede de segurança: se o
   armazenamento estiver fora do ar, os links desses clientes continuam abrindo
   (em modo somente leitura) em vez de devolver erro para quem for apresentar. */
const CLIENTES_PADRAO = [
  { cliente: 'Padrão Travel Cloud', slug: 'padrao', rotulo: 'Viagens', logo: null,
    prime: true, padrao: true, cores: { brand: '#001489' }, appProprio: { ativo: false } },
  { cliente: 'BRB', slug: 'brb', rotulo: 'Viagens', logo: '/brb/logo.png', prime: true,
    cores: { brand: '#00AEEF' },
    appProprio: { ativo: true, imagem: '/brb/app-home.jpg', hotspot: { x: 2.4, y: 35.8, w: 95, h: 6.4 } } },
  { cliente: 'Alelo', slug: 'alelo', rotulo: 'Viagens', logo: null, prime: true,
    cores: { brand: '#00A859' }, appProprio: { ativo: false } }
];

/* Cada leitura do estado gastava uma "advanced operation" do Blob (o list).
   Com a página do cliente sendo montada no servidor, isso multiplicava por
   visita. O cache abaixo vive na instância da função e segura o resultado por
   um tempo curto — o suficiente para uma apresentação inteira caber em uma
   leitura só, sem deixar o editor desatualizado. */
const TTL_MS = 60 * 1000;
let cache = { quando: 0, dados: null };

export function limparCache() { cache = { quando: 0, dados: null }; }

function reserva(motivo) {
  return {
    emails: EMAILS_PADRAO, senhaHash: sha(SENHA_PADRAO),
    clientes: CLIENTES_PADRAO, indisponivel: String(motivo).slice(0, 120)
  };
}

export async function lerEstado(semCache) {
  if (!semCache && cache.dados && (Date.now() - cache.quando) < TTL_MS) return cache.dados;
  let blobs;
  try {
    ({ blobs } = await list({ prefix: PREFIXO, limit: 20 }));
  } catch (e) {
    return reserva((e && e.message) || 'listagem indisponível');
  }
  const atual = blobs.sort((x, y) => new Date(y.uploadedAt) - new Date(x.uploadedAt))[0];
  if (!atual) {
    return { emails: EMAILS_PADRAO, senhaHash: sha(SENHA_PADRAO), clientes: [], novo: true };
  }
  let d;
  try {
    const r = await fetch(atual.url, { cache: 'no-store' });
    if (!r.ok) throw new Error('leitura recusada (' + r.status + ')');
    d = await r.json();
  } catch (e) {
    // armazenamento fora do ar: modo somente leitura, com os protótipos conhecidos
    return reserva((e && e.message) || 'leitura indisponível');
  }
  const estado = {
    emails: Array.isArray(d.emails) && d.emails.length ? d.emails : EMAILS_PADRAO,
    senhaHash: d.senhaHash || sha(SENHA_PADRAO),
    clientes: Array.isArray(d.clientes) ? d.clientes : []
  };
  cache = { quando: Date.now(), dados: estado };
  return estado;
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
  cache = { quando: Date.now(), dados: {
    emails: limpo.emails, senhaHash: limpo.senhaHash, clientes: limpo.clientes } };
  return limpo;
}
