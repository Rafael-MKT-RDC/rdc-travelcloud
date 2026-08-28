/* Lista de protótipos e lista de e-mails com acesso. Sempre autenticado. */
import { lerEstado, gravarEstado, conferir, tokenDaRequisicao, sha } from './_estado.js';

export default async function handler(req, res) {
  const quem = conferir(tokenDaRequisicao(req));
  if (!quem) return res.status(401).json({ erro: 'Faça login para continuar.' });

  try {
    const estado = await lerEstado();
    delete estado.novo;

    if (req.method === 'GET') {
      return res.status(200).json({ clientes: estado.clientes, emails: estado.emails, quem,
        somenteLeitura: estado.indisponivel ? true : undefined });
    }
    if (estado.indisponivel && req.method === 'PUT') {
      return res.status(503).json({ erro: 'O armazenamento do projeto está indisponível, ' +
        'então não dá para salvar agora — nada foi alterado. Avise o time para conferir o ' +
        'Blob do projeto na Vercel.' });
    }
    if (req.method === 'PUT') {
      const b = req.body || {};
      if (Array.isArray(b.clientes)) estado.clientes = b.clientes;
      if (Array.isArray(b.emails)) {
        const limpos = b.emails.map(e => String(e).trim().toLowerCase()).filter(Boolean);
        if (!limpos.includes(quem)) limpos.push(quem);   // ninguém se remove sozinho
        estado.emails = Array.from(new Set(limpos));
      }
      if (typeof b.senhaNova === 'string' && b.senhaNova.length >= 6) {
        estado.senhaHash = sha(b.senhaNova);
      }
      const salvo = await gravarEstado(estado);
      return res.status(200).json({ clientes: salvo.clientes, emails: salvo.emails, quem });
    }
    return res.status(405).json({ erro: 'Método não suportado.' });
  } catch (e) {
    return res.status(500).json({ erro: 'Não consegui salvar agora. Tente de novo.' });
  }
}
