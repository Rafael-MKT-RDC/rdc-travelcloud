/* Sobe uma imagem (logo ou print do app) e devolve a URL definitiva. */
import { put } from '@vercel/blob';
import { conferir, tokenDaRequisicao } from './_estado.js';

export const config = { api: { bodyParser: { sizeLimit: '6mb' } } };

export default async function handler(req, res) {
  const quem = conferir(tokenDaRequisicao(req));
  if (!quem) return res.status(401).json({ erro: 'Faça login para continuar.' });
  if (req.method !== 'POST') return res.status(405).json({ erro: 'Use POST.' });

  const { nome = 'arquivo', dados = '' } = req.body || {};
  const m = /^data:([\w.+-]+\/[\w.+-]+);base64,(.+)$/.exec(String(dados));
  if (!m) return res.status(400).json({ erro: 'Envie a imagem como data URL.' });

  const buf = Buffer.from(m[2], 'base64');
  if (buf.length > 5 * 1024 * 1024) return res.status(413).json({ erro: 'Imagem acima de 5 MB.' });

  try {
    const seguro = String(nome).replace(/[^a-zA-Z0-9._-]/g, '-').slice(0, 60) || 'arquivo';
    const b = await put('marcas/' + seguro, buf, {
      access: 'public', contentType: m[1], addRandomSuffix: true
    });
    return res.status(200).json({ url: b.url });
  } catch (e) {
    return res.status(500).json({ erro: 'Não consegui subir a imagem.' });
  }
}
