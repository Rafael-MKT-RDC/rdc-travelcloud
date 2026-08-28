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
    info.ok = true;
  } catch (e) {
    info.ok = false;
    info.erro = { nome: e && e.name, mensagem: String(e && e.message).slice(0, 300) };
  }
  res.setHeader('cache-control', 'no-store');
  return res.status(200).json(info);
}
