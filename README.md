# Travel Cloud — Padrão white-label

Protótipo de navegação 100% funcional, simulado dentro de um smartphone,
com a marca do cliente aplicada automaticamente.

## Como funciona

Todas as telas foram **refeitas em HTML/CSS**. Antes elas eram PNGs exportados do Figma,
com a cor da marca "queimada" dentro da imagem — por isso não dava para trocar de cliente
sem um designer reexportar tudo. Agora a cor vive em variáveis de CSS e muda em tempo real.

```
travelcloud/
├── index.html          galeria dos protótipos criados
├── assets/
│   ├── tc.css          estilo (nenhuma cor de marca escrita direto)
│   ├── tc.js           motor: telas, navegação, estado da viagem
│   └── img/            fotos (não têm cor de marca — servem para todos)
├── padrao/index.html   ← O PADRÃO (referência)
├── brb/                cliente com app próprio
└── alelo/              teste de troca de cor
```

Para criar um cliente novo: **duplique `padrao/`**, renomeie a pasta e edite o bloco
`window.TC` no `index.html`. O link final fica `seusite.com/nome-da-pasta`.

## O bloco que muda por cliente

```js
window.TC = {
  cliente : "BRB",          // nome (aparece nos textos)
  rotulo  : "Viagens",      // nome do benefício no header
  logo    : "logo.png",     // null = placeholder "seu logo aqui"
  prime   : true,           // mostrar blocos RDC Prime
  cores   : { brand: "#00AEEF" },   // ÚNICA cor obrigatória
  appProprio: {             // cliente que já tem app próprio
    ativo   : true,
    imagem  : "app-home.jpg",
    hotspot : {x:2.4, y:35.8, w:95, h:6.4}   // botão "Viagens", em % da imagem
  }
};
```

## Onde a cor da marca aparece (mapa de tokens)

| Token | O que é | Onde aparece |
|---|---|---|
| `--brand` | cor principal do cliente | header do motor de busca, faixa "Buscar Hospedagens", botões (CTA), links, "Viagens" no header, dia selecionado no calendário, switch ligado, aba ativa do hotel, barra "Resumo da reserva", ícone/valor de economia, barra de status |
| `--brand-dark` | tom escuro derivado | fecha o degradê das faixas da marca (header do motor, faixa de busca, calendário), estado pressionado |
| `--brand-light` | tom claro derivado | intervalo de datas no calendário, chip de filtro ativo, faixa "Reembolsável", card do quarto escolhido, foco dos campos do formulário |
| `--brand-ink` | texto sobre a cor principal | textos e ícones em cima do header/CTA (branco ou escuro, calculado pelo contraste) |
| `--accent` | destaque secundário | selo e caixa **RDC Prime** (laranja, igual para todos por padrão) |

**Só `--brand` é obrigatório.** Os outros três tons são calculados a partir dele
(HSL: escurece 13% para o dark, dessatura e clareia para o light, e escolhe branco ou
grafite para o texto conforme a luminância). Qualquer um pode ser sobrescrito à mão
se a marca do cliente exigir.

### O que NUNCA muda por cliente
Neutros de texto e borda, verde de sucesso, dourado das estrelas, laranja do RDC Prime,
fotos, tipografia (Inter), espaçamentos e raios de canto.

## Fluxo implementado

Segue o padrão **01. Portal Assinante Prime** da página 📱Mobile do Figma:

Tela do app do cliente (opcional) → **Portal** (header + busca + imagem + rodapé fixo, sem rolagem) →
**Buscar Hospedagens** (os três campos num só lugar: destino, datas, hóspedes, com botão fixo no rodapé) →
cada campo abre sua tela e volta preenchido → **Listagem** (contagem + cards + paginação + rodapé) →
Detalhe do hotel (Visão geral / Sobre / Quartos) → Resumo da reserva → Pagamento → Conclusão.

Elementos fixos no rodapé: o rodapé da RDC no Portal, e o botão de ação (Buscar / Continuar /
Escolher quarto / Continuar para pagamento / Finalizar reserva) nas telas de decisão.

Header do padrão: logo do cliente | divisor | nome do benefício | selo **prime** | ícone de conta.

O destino, as datas e o número de hóspedes escolhidos alimentam todas as telas seguintes:
barra de busca, contagem de resultados, número de noites, datas de check-in/check-out,
prazo de reembolso, total, parcelamento e a economia do Prime.

## Publicação

Pasta estática — funciona em qualquer host. No Netlify/Vercel, publique a pasta
`travelcloud/` como raiz do site: cada cliente vira uma rota (`/brb`, `/alelo`, ...).
