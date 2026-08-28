/* Login: e-mail precisa estar cadastrado e a senha precisa bater. */
import { lerEstado, gravarEstado, assinar, sha } from './_estado.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ erro: 'Use POST.' });
  const { email = '', senha = '' } = req.body || {};
  const alvo = String(email).trim().toLowerCase();
  if (!alvo || !senha) return res.status(400).json({ erro: 'Informe e-mail e senha.' });

  try {
    const estado = await lerEstado();
    if (estado.novo && !estado.indisponivel) { await gravarEstado(estado); delete estado.novo; }

    const cadastrado = estado.emails.some(e => String(e).trim().toLowerCase() === alvo);
    if (!cadastrado) {
      return res.status(403).json({ erro: 'Este e-mail não está cadastrado. Peça para alguém do time liberar o seu acesso.' });
    }
    if (sha(senha) !== estado.senhaHash) {
      return res.status(403).json({ erro: 'Senha incorreta.' });
    }
    return res.status(200).json({ token: assinar(alvo), email: alvo });
  } catch (e) {
    return res.status(500).json({ erro: 'Não consegui verificar o acesso agora.' });
  }
}
