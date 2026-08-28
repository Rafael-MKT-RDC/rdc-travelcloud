/* Diagnóstico temporário: diz por que a leitura do estado está falhando.
   Não expõe segredo nenhum — só o nome/mensagem do erro. */
import { list } from '@vercel/blob';

export default async function handler(req, res) {
  const info = {
    temToken: !!process.env.BLOB_READ_WRITE_TOKEN,
    tamanhoToken: (process.env.BLOB_READ_WRITE_TOKEN || '').length,
    node: process.version
  };
  try {
    const r = await list({ prefix: 'estado/', limit: 5 });
    info.blobs = (r.blobs || []).map(b => ({ pathname: b.pathname, uploadedAt: b.uploadedAt, size: b.size }));
    const atual = (r.blobs || []).sort((x, y) => new Date(y.uploadedAt) - new Date(x.uploadedAt))[0];
    if (atual) {
      try {
        const resp = await fetch(atual.url, { cache: 'no-store' });
        const txt = await resp.text();
        info.leitura = { status: resp.status, bytes: txt.length, inicio: txt.slice(0, 120) };
        try { const d = JSON.parse(txt); info.leitura.chaves = Object.keys(d); info.leitura.clientes = Array.isArray(d.clientes) ? d.clientes.length : null; }
        catch (e2) { info.leitura.jsonErro = String(e2.message).slice(0, 200); }
      } catch (e1) { info.leitura = { fetchErro: String(e1 && e1.message).slice(0, 300) }; }
    }
    info.ok = true;
  } catch (e) {
    info.ok = false;
    info.erro = { nome: e && e.name, mensagem: String(e && e.message).slice(0, 300) };
  }
  res.setHeader('cache-control', 'no-store');
  return res.status(200).json(info);
}
