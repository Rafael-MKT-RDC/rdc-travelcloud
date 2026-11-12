/* ============================================================
   Travel Cloud — Editor de protótipos por cliente
   Uso interno: o gerente cria, edita e exclui protótipos.
   ============================================================ */
(function(){
'use strict';
var CHAVE = 'tc_prototipos_v1';
var app = document.getElementById('app');
var lista = [], editando = null, rascunho = null;

/* ---------- armazenamento ----------
   No site publicado tudo vive no servidor: todo mundo que entra vê a mesma
   lista. Sem servidor (pacote de visualização) cai no navegador. */
var TEM_API = !window.TC_INLINE;
/* endereco do site: o link de cada cliente e sempre SITE + '/' + apelido */
var SITE = (location.protocol === 'https:' || location.protocol === 'http:')
             ? location.origin : 'https://rdc-travelcloud.vercel.app';
function linkDe(p){ return SITE + '/' + (p && p.slug ? p.slug : ''); }
function copiaAntiga(txt, feito){
  try{
    var t = document.createElement('textarea');
    t.value = txt; t.setAttribute('readonly','');
    t.style.cssText = 'position:fixed;top:-1000px;opacity:0';
    document.body.appendChild(t); t.select(); t.setSelectionRange(0, 99999);
    document.execCommand('copy'); t.remove(); feito();
  }catch(e){ window.prompt('Copie o link:', txt); }
}
var emailsAcesso = [];
var somenteLeitura = false;   // armazenamento fora do ar
var sessao = { token:'', email:'' };
try{
  sessao.token = localStorage.getItem('tc_sessao') || '';
  sessao.email = localStorage.getItem('tc_email') || '';
}catch(e){}

function guardarSessao(t, e){
  sessao.token = t; sessao.email = e;
  try{ localStorage.setItem('tc_sessao', t); localStorage.setItem('tc_email', e); }catch(x){}
}
function limparSessao(){
  sessao = { token:'', email:'' };
  try{ localStorage.removeItem('tc_sessao'); localStorage.removeItem('tc_email'); }catch(x){}
}
function pedir(caminho, opcoes){
  opcoes = opcoes || {};
  opcoes.headers = Object.assign({'content-type':'application/json'}, opcoes.headers||{},
    sessao.token ? {authorization:'Bearer '+sessao.token} : {});
  return fetch(caminho, opcoes).then(function(r){
    return r.json().catch(function(){ return {}; }).then(function(d){
      if(!r.ok){ var err = new Error(d.erro || 'Falhou'); err.status = r.status; throw err; }
      return d;
    });
  });
}
function carregar(){
  if(!TEM_API){
    try{ var b = localStorage.getItem(CHAVE); return Promise.resolve(b ? JSON.parse(b) : []); }
    catch(e){ return Promise.resolve([]); }
  }
  return pedir('/api/dados').then(function(d){
    emailsAcesso = d.emails || [];
    somenteLeitura = !!d.somenteLeitura;
    return d.clientes || [];
  });
}
function gravar(){
  if(!TEM_API){
    try{ localStorage.setItem(CHAVE, JSON.stringify(lista)); }catch(e){}
    return Promise.resolve();
  }
  return pedir('/api/dados', {method:'PUT', body: JSON.stringify({clientes: lista})})
    .then(function(d){ emailsAcesso = d.emails || emailsAcesso; })
    .catch(function(e){
      alert('Não consegui salvar no servidor: ' + e.message);
      throw e;
    });
}

/* ---------- cores ---------- */
function hex2rgb(h){h=h.replace('#','');if(h.length===3)h=h.split('').map(function(c){return c+c}).join('');
  return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)];}
function rgb2hex(r){return '#'+r.map(function(v){v=Math.max(0,Math.min(255,Math.round(v)));
  return ('0'+v.toString(16)).slice(-2)}).join('').toUpperCase();}
function rgb2hsl(c){var r=c[0]/255,g=c[1]/255,b=c[2]/255,mx=Math.max(r,g,b),mn=Math.min(r,g,b),
  h,s,l=(mx+mn)/2,d=mx-mn;
  if(!d){h=s=0}else{s=l>.5?d/(2-mx-mn):d/(mx+mn);
    h=mx===r?(g-b)/d+(g<b?6:0):mx===g?(b-r)/d+2:(r-g)/d+4;h/=6}
  return [h*360,s,l];}
function hsl2rgb(hs){var h=hs[0]/360,s=hs[1],l=hs[2];
  function f(p,q,t){if(t<0)t+=1;if(t>1)t-=1;if(t<1/6)return p+(q-p)*6*t;if(t<1/2)return q;
    if(t<2/3)return p+(q-p)*(2/3-t)*6;return p}
  if(!s)return [l*255,l*255,l*255];
  var q=l<.5?l*(1+s):l+s-l*s,p=2*l-q;
  return [f(p,q,h+1/3)*255,f(p,q,h)*255,f(p,q,h-1/3)*255];}
function lum(c){var a=c.map(function(v){v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)});
  return .2126*a[0]+.7152*a[1]+.0722*a[2];}
// mesma fórmula do motor (tc.js) — se mudar lá, mude aqui
function contraste(a, b){
  var la = lum(hex2rgb(a)), lb = lum(hex2rgb(b));
  var hi = Math.max(la, lb), lo = Math.min(la, lb);
  return (hi + 0.05) / (lo + 0.05);
}
/* A cor da marca quando ela precisa ser lida sobre fundo claro: devolve a
   própria cor quando ela já tem contraste, e uma versão escurecida quando não
   tem (amarelo, laranja, verdes claros). O editor pode mandar uma cor pronta,
   tirada do logo ou do site, e ela tem prioridade. */
function corDeTexto(brand, escolhida){
  if(escolhida && /^#[0-9a-f]{3,8}$/i.test(escolhida)) return escolhida.toUpperCase();
  if(contraste(brand, '#FFFFFF') >= 4.5) return brand.toUpperCase();
  var hsl = rgb2hsl(hex2rgb(brand)), l = hsl[2];
  while(l > 0.04){
    l -= 0.02;
    var tenta = rgb2hex(hsl2rgb([hsl[0], Math.min(1, hsl[1] * 1.08), l]));
    if(contraste(tenta, '#FFFFFF') >= 4.5) return tenta;
  }
  return '#14202B';
}
/* ---- as opções de cor de texto que a pessoa escolhe com um clique ---- */
function tomDaMarca(brand, satAlvo, alvoContraste){
  var hsl = rgb2hsl(hex2rgb(brand)), l = hsl[2];
  var sat = Math.max(hsl[1], satAlvo);
  while(l > 0.04){
    var tenta = rgb2hex(hsl2rgb([hsl[0], Math.min(1, sat), l]));
    if(contraste(tenta, '#FFFFFF') >= alvoContraste) return tenta;
    l -= 0.02;
  }
  return rgb2hex(hsl2rgb([hsl[0], Math.min(1, sat), 0.12]));
}
function opcoesDeTexto(brand, paleta){
  var fora = {}, saida = [];
  function põe(cor, nome, de){
    if(!cor || !/^#[0-9a-f]{6}$/i.test(cor)) return;
    cor = cor.toUpperCase();
    if(fora[cor]) return;
    if(contraste(cor, '#FFFFFF') < 4.5) return;
    fora[cor] = 1;
    saida.push({ cor: cor, nome: nome, de: de });
  }
  põe(brand, 'Cor da marca', 'marca');
  (paleta || []).forEach(function(c){
    var hsl = rgb2hsl(hex2rgb(c || '#FFFFFF'));
    põe(c, hsl[1] < 0.12 ? 'Neutro do logo' : 'Cor da identidade', 'identidade');
  });
  põe(tomDaMarca(brand, 0, 4.5),   'Tom escuro da marca',  'tom');
  põe(tomDaMarca(brand, 0.62, 7),  'Tom escuro intenso',   'tom');
  põe(tomDaMarca(brand, 0.45, 12), 'Quase preta, no matiz','tom');
  põe('#171B21', 'Cinza-escuro neutro', 'neutro');
  return saida;
}

/* ---- a melhor cor da identidade para texto sobre fundo claro ----
   Se a cor principal já tem contraste, é ela mesma. Se não tem (amarelo,
   laranja, verdes claros), procura entre as cores do logo e do site a mais
   característica que passe no contraste — é o que o Banco do Brasil faz:
   fundo amarelo, texto azul. Só escurece a cor original se não achar nada. */
function melhorTexto(brand, paleta){
  if(contraste(brand, '#FFFFFF') >= 4.5) return { cor: brand.toUpperCase(), motivo: 'propria' };
  var bons = (paleta || []).filter(function(c){
    if(!/^#[0-9a-f]{6}$/i.test(c)) return false;
    if(c.toUpperCase() === String(brand).toUpperCase()) return false;
    var hsl = rgb2hsl(hex2rgb(c));
    if(hsl[1] < 0.12) return false;                 /* cinza não é cor de marca */
    return contraste(c, '#FFFFFF') >= 4.5;
  });
  if(bons.length){
    bons.sort(function(a, b){ return rgb2hsl(hex2rgb(b))[1] - rgb2hsl(hex2rgb(a))[1]; });
    return { cor: bons[0].toUpperCase(), motivo: 'paleta' };
  }
  return { cor: corDeTexto(brand), motivo: 'escurecida' };
}
function textoDoRascunho(r){
  var c = r.cores || {};
  if(c.textoManual && c.texto) return { cor: c.texto.toUpperCase(), motivo: 'manual' };
  return melhorTexto(c.brand || '#0A66C2', c.paleta);
}

function derivar(brand, texto){
  var rgb=hex2rgb(brand), hsl=rgb2hsl(rgb);
  return {
    brand: brand.toUpperCase(),
    dark : rgb2hex(hsl2rgb([hsl[0], Math.min(1,hsl[1]*1.05), Math.max(.12, hsl[2]-0.13)])),
    light: rgb2hex(hsl2rgb([hsl[0], Math.min(.85,Math.max(.25,hsl[1]*0.75)), 0.945])),
    ink  : lum(rgb) > 0.55 ? '#14202B' : '#FFFFFF',
    texto: corDeTexto(brand, texto)
  };
}
// aceita #00AEEF, 00AEEF, 0,174,239, rgb(0 174 239)
function lerCor(txt){
  if(!txt) return null;
  var t = String(txt).trim();
  var h = t.replace(/^#/,'');
  if(/^([0-9a-f]{3}|[0-9a-f]{6})$/i.test(h)){
    if(h.length===3) h=h.split('').map(function(c){return c+c}).join('');
    return '#'+h.toUpperCase();
  }
  var n = t.match(/-?\d+(\.\d+)?/g);
  if(n && n.length>=3){
    var v=[+n[0],+n[1],+n[2]];
    if(v.every(function(x){return x>=0 && x<=255})) return rgb2hex(v);
  }
  return null;
}

/* ---------- cores a partir do logo ---------- */
function coresDoLogo(url, feito){
  var im = new Image();
  im.crossOrigin = 'anonymous';     /* sem isto o canvas fica sujo e não dá para ler */
  im.onload = function(){
    var L = 120, c = document.createElement('canvas');
    var r = Math.min(L/im.width, L/im.height, 1);
    c.width = Math.max(1,Math.round(im.width*r)); c.height = Math.max(1,Math.round(im.height*r));
    var x = c.getContext('2d'); x.drawImage(im,0,0,c.width,c.height);
    var d;
    try{ d = x.getImageData(0,0,c.width,c.height).data; }catch(e){ feito([]); return; }
    var caixas = {};
    for(var i=0;i<d.length;i+=4){
      if(d[i+3] < 200) continue;
      var rgb=[d[i],d[i+1],d[i+2]], hsl=rgb2hsl(rgb);
      if(hsl[1] < 0.18) continue;               // cinza demais
      if(hsl[2] > 0.93 || hsl[2] < 0.08) continue; // quase branco/preto
      var k = Math.round(hsl[0]/12)+'|'+Math.round(hsl[1]*4)+'|'+Math.round(hsl[2]*5);
      if(!caixas[k]) caixas[k] = {n:0, r:0, g:0, b:0, s:hsl[1]};
      var q = caixas[k]; q.n++; q.r+=rgb[0]; q.g+=rgb[1]; q.b+=rgb[2];
    }
    function junta(qs){
      var arr = Object.keys(qs).map(function(k){ var q=qs[k];
        return {peso:q.n*(0.55+q.s), cor:rgb2hex([q.r/q.n,q.g/q.n,q.b/q.n])}; });
      arr.sort(function(a,b){return b.peso-a.peso});
      var vistos = {}, saida = [];
      for(var j=0;j<arr.length && saida.length<8;j++){
        var hsl = rgb2hsl(hex2rgb(arr[j].cor));
        /* agrupa por matiz, mas em cinza o matiz não diz nada: aí separa por tom */
        var faixa = hsl[1] < 0.18 ? 'c'+Math.round(hsl[2]*6) : 'm'+Math.round(hsl[0]/20);
        if(vistos[faixa]) continue; vistos[faixa]=1; saida.push(arr[j].cor);
      }
      return saida;
    }
    var saida = junta(caixas);
    /* logo preto e branco não tem cor viva nenhuma: em vez de devolver
       lista vazia, volta a olhar os tons neutros */
    if(!saida.length){
      var neutras = {};
      for(var i=0;i<d.length;i+=4){
        if(d[i+3] < 200) continue;
        var rgb=[d[i],d[i+1],d[i+2]], hsl=rgb2hsl(rgb);
        if(hsl[2] > 0.9) continue;                 /* branco do fundo, não */
        var k = Math.round(hsl[2]*6);
        if(!neutras[k]) neutras[k] = {n:0,r:0,g:0,b:0,s:hsl[1]};
        var q = neutras[k]; q.n++; q.r+=rgb[0]; q.g+=rgb[1]; q.b+=rgb[2];
      }
      saida = junta(neutras);
    }
    feito(saida);
  };
  im.onerror = function(){ feito([]); };
  im.src = url;
}

/* ---------- utilidades ---------- */
function apelido(nome){
  return String(nome||'').normalize? String(nome||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,32)
    : String(nome||'').toLowerCase();
}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){
  return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]});}
function lerArquivo(f, feito){
  var fr = new FileReader();
  fr.onload = function(){
    var dados = fr.result;
    if(!TEM_API) return feito(dados);
    // sobe para o servidor: assim o logo aparece para todo mundo, não só aqui
    pedir('/api/arquivo', {method:'POST', body: JSON.stringify({nome: f.name, dados: dados})})
      .then(function(d){ feito(d.url); })
      .catch(function(){ feito(dados); });   // deu ruim: segue embutido
  };
  fr.readAsDataURL(f);
}
function aviso(txt, tipo){
  var el = document.getElementById('recado');
  if(!el) return;
  el.className = 'recado ' + (tipo||'info');
  el.innerHTML = txt;
  el.classList.remove('esconde');
}
function novoModelo(){
  return { slug:'', cliente:'', rotulo:'Viagens', logo:null, prime:true,
    cores:{ brand:'#0A66C2' }, manual:false,
    appProprio:{ ativo:false, imagem:null, hotspot:{x:3,y:36,w:94,h:7} } };
}
window.TC_EDITOR_LISTA = function(){ return lista; };

/* ============================================================
   QR Code — codificador próprio, sem depender de biblioteca de fora.
   Modo byte, correção M, versões 1 a 10 (dá e sobra para uma URL).
   ============================================================ */
function qrMatriz(texto){
  /* --- bytes do texto (UTF-8) --- */
  var dados = [];
  for(var i=0;i<texto.length;i++){
    var c = texto.charCodeAt(i);
    if(c < 0x80) dados.push(c);
    else if(c < 0x800){ dados.push(0xC0|(c>>6), 0x80|(c&63)); }
    else if(c < 0xD800 || c >= 0xE000){ dados.push(0xE0|(c>>12), 0x80|((c>>6)&63), 0x80|(c&63)); }
    else { i++; var u = 0x10000 + (((c&0x3FF)<<10) | (texto.charCodeAt(i)&0x3FF));
           dados.push(0xF0|(u>>18), 0x80|((u>>12)&63), 0x80|((u>>6)&63), 0x80|(u&63)); }
  }

  /* --- tabela das versões, nível M: [ecc por bloco, [blocos, dados], [blocos, dados]] --- */
  var TAB = {
    1:[10,[1,16]], 2:[16,[1,28]], 3:[26,[1,44]], 4:[18,[2,32]], 5:[24,[2,43]],
    6:[16,[4,27]], 7:[18,[4,31]], 8:[22,[2,38],[2,39]], 9:[22,[3,36],[2,37]],
    10:[26,[4,43],[1,44]]
  };
  function totalDados(v){
    var t = TAB[v], n = t[1][0]*t[1][1];
    if(t[2]) n += t[2][0]*t[2][1];
    return n;
  }
  /* escolhe a menor versão que cabe */
  var versao = 0;
  for(var v=1; v<=10; v++){
    var cab = totalDados(v);
    var bitsCabecalho = 4 + (v < 10 ? 8 : 16);
    if(dados.length + Math.ceil(bitsCabecalho/8) <= cab){ versao = v; break; }
  }
  if(!versao) throw new Error('texto longo demais para este gerador');

  /* --- fluxo de bits --- */
  var bits = [];
  function poe(valor, n){ for(var b=n-1;b>=0;b--) bits.push((valor>>b)&1); }
  poe(4, 4);                                   /* modo byte */
  poe(dados.length, versao < 10 ? 8 : 16);     /* quantos bytes */
  for(var i=0;i<dados.length;i++) poe(dados[i], 8);
  var capacidade = totalDados(versao) * 8;
  for(var i=0;i<4 && bits.length < capacidade;i++) bits.push(0);   /* terminador */
  while(bits.length % 8) bits.push(0);
  var cw = [];
  for(var i=0;i<bits.length;i+=8){
    var b=0; for(var j=0;j<8;j++) b = (b<<1) | bits[i+j];
    cw.push(b);
  }
  var enche = [0xEC, 0x11], k = 0;
  while(cw.length < totalDados(versao)) cw.push(enche[k++ % 2]);

  /* --- Reed-Solomon em GF(256) --- */
  var EXP = new Array(512), LOG = new Array(256);
  for(var i=0,x=1;i<255;i++){ EXP[i]=x; LOG[x]=i; x<<=1; if(x&0x100) x^=0x11D; }
  for(var i=255;i<512;i++) EXP[i] = EXP[i-255];
  function mul(a,b){ return (a===0||b===0) ? 0 : EXP[LOG[a]+LOG[b]]; }
  function gerador(n){
    var g = [1];
    for(var i=0;i<n;i++){
      var novo = g.concat([0]);
      for(var j=0;j<g.length;j++) novo[j+1] ^= mul(g[j], EXP[i]);
      g = novo;
    }
    return g;
  }
  function resto(bloco, n){
    var g = gerador(n), r = bloco.concat(new Array(n).fill(0));
    for(var i=0;i<bloco.length;i++){
      var f = r[i];
      if(f === 0) continue;
      for(var j=0;j<g.length;j++) r[i+j] ^= mul(g[j], f);
    }
    return r.slice(bloco.length);
  }

  /* --- divide em blocos, calcula a correção e intercala --- */
  var t = TAB[versao], nEcc = t[0], grupos = [t[1]];
  if(t[2]) grupos.push(t[2]);
  var blocosDados = [], blocosEcc = [], p = 0;
  grupos.forEach(function(g){
    for(var i=0;i<g[0];i++){
      var b = cw.slice(p, p+g[1]); p += g[1];
      blocosDados.push(b);
      blocosEcc.push(resto(b, nEcc));
    }
  });
  var fluxo = [];
  var maiorD = Math.max.apply(null, blocosDados.map(function(b){ return b.length; }));
  for(var i=0;i<maiorD;i++) blocosDados.forEach(function(b){ if(i<b.length) fluxo.push(b[i]); });
  for(var i=0;i<nEcc;i++) blocosEcc.forEach(function(b){ fluxo.push(b[i]); });

  /* --- desenho --- */
  var n = versao*4 + 17;
  var m = [], reservado = [];
  for(var i=0;i<n;i++){ m.push(new Array(n).fill(0)); reservado.push(new Array(n).fill(0)); }
  function poeQuadro(lin, col, tam, desenho){
    for(var y=0;y<tam;y++) for(var x=0;x<tam;x++){
      var Y=lin+y, X=col+x;
      if(Y<0||X<0||Y>=n||X>=n) continue;
      m[Y][X] = desenho(y,x); reservado[Y][X] = 1;
    }
  }
  function finder(y,x){
    /* 7x7: borda preta (d=3), anel branco (d=2), miolo preto (d<=1) */
    var d = Math.max(Math.abs(y-3), Math.abs(x-3));
    return d===2 ? 0 : 1;
  }
  [[0,0],[0,n-7],[n-7,0]].forEach(function(pos){
    poeQuadro(pos[0]-1, pos[1]-1, 9, function(y,x){
      var Y=y-1, X=x-1;
      if(Y<0||X<0||Y>6||X>6) return 0;
      return finder(Y,X);
    });
  });
  /* temporização */
  for(var i=8;i<n-8;i++){
    m[6][i] = (i%2===0)?1:0; reservado[6][i]=1;
    m[i][6] = (i%2===0)?1:0; reservado[i][6]=1;
  }
  /* alinhamento */
  var ALI = {1:[],2:[6,18],3:[6,22],4:[6,26],5:[6,30],6:[6,34],7:[6,22,38],8:[6,24,42],9:[6,26,46],10:[6,28,50]};
  var cs = ALI[versao];
  for(var a=0;a<cs.length;a++) for(var b=0;b<cs.length;b++){
    var cy=cs[a], cx=cs[b];
    if((cy<=8&&cx<=8) || (cy<=8&&cx>=n-9) || (cy>=n-9&&cx<=8)) continue;
    poeQuadro(cy-2, cx-2, 5, function(y,x){
      var d = Math.max(Math.abs(y-2), Math.abs(x-2));
      return d===1 ? 0 : 1;
    });
  }
  /* módulo escuro e áreas de formato */
  m[n-8][8] = 1; reservado[n-8][8] = 1;
  for(var i=0;i<9;i++){ if(!reservado[8][i]){ reservado[8][i]=1; } if(!reservado[i][8]){ reservado[i][8]=1; } }
  for(var i=0;i<8;i++){ reservado[8][n-1-i]=1; reservado[n-1-i][8]=1; }
  /* informação de versão (7 em diante) */
  if(versao >= 7){
    var vi = versao << 12, g = 0x1F25;
    var d = vi;
    for(var i=17;i>=12;i--) if(d & (1<<i)) d ^= g << (i-12);
    vi |= d;
    for(var i=0;i<18;i++){
      var bit = (vi >> i) & 1;
      var y = Math.floor(i/3), x = i%3;
      m[y][n-11+x] = bit; reservado[y][n-11+x] = 1;
      m[n-11+x][y] = bit; reservado[n-11+x][y] = 1;
    }
  }
  /* dados em ziguezague */
  var idx = 0, subindo = true;
  for(var col = n-1; col > 0; col -= 2){
    if(col === 6) col--;
    for(var passo=0; passo<n; passo++){
      var lin = subindo ? (n-1-passo) : passo;
      for(var c=0;c<2;c++){
        var x = col - c;
        if(reservado[lin][x]) continue;
        var bit = 0;
        if(idx < fluxo.length*8){
          bit = (fluxo[idx>>3] >> (7-(idx&7))) & 1;
        }
        m[lin][x] = bit; idx++;
      }
    }
    subindo = !subindo;
  }
  /* máscaras */
  var MASC = [
    function(y,x){ return (y+x)%2===0; },
    function(y,x){ return y%2===0; },
    function(y,x){ return x%3===0; },
    function(y,x){ return (y+x)%3===0; },
    function(y,x){ return (Math.floor(y/2)+Math.floor(x/3))%2===0; },
    function(y,x){ return ((y*x)%2 + (y*x)%3)===0; },
    function(y,x){ return (((y*x)%2 + (y*x)%3)%2)===0; },
    function(y,x){ return (((y+x)%2 + (y*x)%3)%2)===0; }
  ];
  function formato(masc){
    var v = (0 << 3) | masc;   /* nível M = 00 */
    var d = v << 10, g = 0x537;
    for(var i=14;i>=10;i--) if(d & (1<<i)) d ^= g << (i-10);
    return ((v<<10) | d) ^ 0x5412;
  }
  function penalidade(mm){
    var p = 0, i, j, k;
    /* 1: sequências de 5 ou mais */
    for(i=0;i<n;i++){
      for(var eixo=0; eixo<2; eixo++){
        var cor = -1, run = 0;
        for(j=0;j<n;j++){
          var c = eixo ? mm[j][i] : mm[i][j];
          if(c === cor) run++;
          else { if(run >= 5) p += run - 2; cor = c; run = 1; }
        }
        if(run >= 5) p += run - 2;
      }
    }
    /* 2: blocos 2x2 */
    for(i=0;i<n-1;i++) for(j=0;j<n-1;j++){
      var c = mm[i][j];
      if(c===mm[i][j+1] && c===mm[i+1][j] && c===mm[i+1][j+1]) p += 3;
    }
    /* 3: padrão 1:1:3:1:1 */
    var alvo = [1,0,1,1,1,0,1,0,0,0,0];
    var alvo2 = [0,0,0,0,1,0,1,1,1,0,1];
    for(i=0;i<n;i++) for(j=0;j<=n-11;j++){
      var okA=true, okB=true, okC=true, okD=true;
      for(k=0;k<11;k++){
        if(mm[i][j+k] !== alvo[k]) okA=false;
        if(mm[i][j+k] !== alvo2[k]) okB=false;
        if(mm[j+k][i] !== alvo[k]) okC=false;
        if(mm[j+k][i] !== alvo2[k]) okD=false;
      }
      if(okA) p+=40; if(okB) p+=40; if(okC) p+=40; if(okD) p+=40;
    }
    /* 4: proporção de escuros */
    var escuros = 0;
    for(i=0;i<n;i++) for(j=0;j<n;j++) escuros += mm[i][j];
    var pct = escuros * 100 / (n*n);
    p += Math.floor(Math.abs(pct - 50) / 5) * 10;
    return p;
  }
  var melhor = null, melhorNota = Infinity, melhorMasc = 0;
  for(var masc=0; masc<8; masc++){
    var mm = m.map(function(l){ return l.slice(); });
    for(var y=0;y<n;y++) for(var x=0;x<n;x++)
      if(!reservado[y][x] && MASC[masc](y,x)) mm[y][x] ^= 1;
    var f = formato(masc);
    /* os 15 bits entram do mais significativo para o menos, nas duas cópias */
    var lugares1 = [[8,0],[8,1],[8,2],[8,3],[8,4],[8,5],[8,7],[8,8],[7,8],[5,8],[4,8],[3,8],[2,8],[1,8],[0,8]];
    var lugares2 = [];
    for(var i=0;i<7;i++) lugares2.push([n-1-i, 8]);
    for(var i=0;i<8;i++) lugares2.push([8, n-8+i]);
    for(var i=0;i<15;i++){
      var bit = (f >> (14-i)) & 1;
      mm[lugares1[i][0]][lugares1[i][1]] = bit;
      mm[lugares2[i][0]][lugares2[i][1]] = bit;
    }
    mm[n-8][8] = 1;
    var nota = penalidade(mm);
    if(nota < melhorNota){ melhorNota = nota; melhor = mm; melhorMasc = masc; }
  }
  return { m: melhor, n: n, versao: versao, mascara: melhorMasc };
}

/* ---------- QR code: desenho e download ---------- */
function qrDesenha(canvas, texto, modulo){
  var r = qrMatriz(texto), margem = 4, lado = (r.n + margem*2) * modulo;
  canvas.width = lado; canvas.height = lado;
  var g = canvas.getContext('2d');
  g.fillStyle = '#FFFFFF'; g.fillRect(0, 0, lado, lado);
  g.fillStyle = '#000000';
  for(var y=0;y<r.n;y++) for(var x=0;x<r.n;x++){
    if(r.m[y][x]) g.fillRect((x+margem)*modulo, (y+margem)*modulo, modulo, modulo);
  }
  return r;
}
function qrSVG(texto){
  var r = qrMatriz(texto), margem = 4, lado = r.n + margem*2, d = '';
  for(var y=0;y<r.n;y++) for(var x=0;x<r.n;x++){
    if(r.m[y][x]) d += 'M' + (x+margem) + ' ' + (y+margem) + 'h1v1h-1z';
  }
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + lado + ' ' + lado + '" ' +
         'width="1024" height="1024" shape-rendering="crispEdges">' +
         '<rect width="' + lado + '" height="' + lado + '" fill="#fff"/>' +
         '<path d="' + d + '" fill="#000"/></svg>';
}
function baixa(nome, url){
  var a = document.createElement('a');
  a.href = url; a.download = nome;
  document.body.appendChild(a); a.click();
  setTimeout(function(){ a.remove(); }, 600);
}
function qrBaixaPNG(texto, nome){
  var c = document.createElement('canvas');
  qrDesenha(c, texto, 16);              /* bem grande, serve para impresso */
  baixa(nome + '.png', c.toDataURL('image/png'));
}
function qrBaixaSVG(texto, nome){
  var b = new Blob([qrSVG(texto)], {type:'image/svg+xml;charset=utf-8'});
  var u = URL.createObjectURL(b);
  baixa(nome + '.svg', u);
  setTimeout(function(){ URL.revokeObjectURL(u); }, 4000);
}

/* ============================================================
   Mockup: a imagem pronta para colocar em proposta e apresentação.
   Com app próprio, saem dois aparelhos — a home do cliente na frente e
   o portal atrás. Sem app próprio, sai só o portal.
   ============================================================ */
var MOCK_HERO = '/assets/img/hero-home.jpg';
var MOCK_RDC  = '/assets/img/rdc.svg';

var MOCK_IC_AJUDA = "<svg width=\"30\" height=\"30\" viewBox=\"0 0 40 40\" fill=\"currentColor\" aria-hidden=\"true\"><path d=\"M8.84621 32.5C8.00432 32.5 7.29171 32.2083 6.70838 31.625C6.12504 31.0416 5.83337 30.329 5.83337 29.4871V18.3333C5.83337 16.3846 6.20518 14.5513 6.94879 12.8334C7.69237 11.1154 8.70732 9.61329 9.99362 8.32696C11.28 7.04065 12.7821 6.02571 14.5 5.28212C16.218 4.53851 18.0513 4.16671 20 4.16671C21.9487 4.16671 23.782 4.53851 25.5 5.28212C27.2179 6.02571 28.72 7.04065 30.0064 8.32696C31.2927 9.61329 32.3076 11.1154 33.0512 12.8334C33.7948 14.5513 34.1666 16.3846 34.1666 18.3333V33.9743C34.1666 34.8162 33.875 35.5288 33.2916 36.1121C32.7083 36.6954 31.9957 36.9871 31.1538 36.9871H21.25C20.8953 36.9871 20.5983 36.8674 20.359 36.6281C20.1197 36.3888 20 36.0918 20 35.7371C20 35.3824 20.1197 35.0854 20.359 34.8461C20.5983 34.6068 20.8953 34.4871 21.25 34.4871H31.1538C31.3034 34.4871 31.4263 34.439 31.5224 34.3429C31.6186 34.2467 31.6667 34.1238 31.6667 33.9743V32.4999H28.7821C27.9509 32.4999 27.241 32.2056 26.6523 31.6169C26.0636 31.0282 25.7693 30.3183 25.7693 29.4871V23.7179C25.7693 22.8868 26.0636 22.1768 26.6523 21.5881C27.241 20.9995 27.9509 20.7051 28.7821 20.7051H31.6667V18.3333C31.6667 15.1111 30.5278 12.3611 28.25 10.0833C25.9722 7.80556 23.2222 6.66667 20 6.66667C16.7778 6.66667 14.0278 7.80556 11.75 10.0833C9.47222 12.3611 8.33333 15.1111 8.33333 18.3333V20.7052H11.2179C12.0491 20.7052 12.759 20.9995 13.3477 21.5882C13.9364 22.1769 14.2307 22.8868 14.2307 23.718V29.4871C14.2307 30.3183 13.9364 31.0283 13.3477 31.6169C12.759 32.2056 12.0491 32.5 11.2179 32.5H8.84621ZM8.84621 30H11.2179C11.3675 30 11.4904 29.9519 11.5865 29.8557C11.6827 29.7596 11.7308 29.6367 11.7308 29.4871V23.718C11.7308 23.5684 11.6827 23.4455 11.5865 23.3494C11.4904 23.2532 11.3675 23.2051 11.2179 23.2051H8.33333V29.4871C8.33333 29.6367 8.38142 29.7596 8.47758 29.8557C8.57375 29.9519 8.69663 30 8.84621 30ZM28.7821 30H31.6667V23.2051H28.7821C28.6325 23.2051 28.5096 23.2532 28.4135 23.3494C28.3173 23.4455 28.2692 23.5684 28.2692 23.718V29.4871C28.2692 29.6367 28.3173 29.7596 28.4135 29.8557C28.5096 29.9519 28.6325 30 28.7821 30ZM28.7821 23.2051H28.2692H31.6667H28.7821Z\"/></svg>";
var MOCK_IC_ZAP   = "<svg width=\"20\" height=\"20\" viewBox=\"0 0 20 20\" fill=\"currentColor\" aria-hidden=\"true\"><path d=\"M10.08 0C4.48 0 0 4.47067 0 10.059C0 12.1347 0.639995 14.37 1.92 15.9667L1.12 19.639L4.96001 18.681C9.76001 21.3954 15.84 19.7987 18.72 15.0087C19.68 13.412 20 11.8153 20 10.059C20 4.47067 15.52 0 10.08 0ZM14.88 13.891L14.4 14.37C13.92 14.849 13.28 15.0087 12.64 15.0087C6.23999 14.0507 5.12001 9.42035 4.96001 7.50435C4.96001 6.86568 5.12 6.22701 5.6 5.90768L6.23999 5.26901C6.55999 4.94967 7.2 4.94967 7.52 5.26901L8.8 6.54634C9.12 6.86567 9.12 7.50435 8.8 7.82368L8.16001 8.46235C8.00001 8.62201 8 8.94135 8 9.10102C8.48 10.538 9.76 11.8154 11.2 12.2944C11.36 12.454 11.68 12.2943 11.84 12.1347L12.48 11.496C12.8 11.1767 13.44 11.1767 13.76 11.496L15.04 12.7734C15.2 12.933 15.2 13.5717 14.88 13.891Z\"/></svg>";
/* As quatro categorias da home do protótipo. O desenho vem do mesmo SVG que o
   motor usa; aqui ele é pintado na cor de texto da marca. */
var MOCK_CATS = [
  { n:"Hospedagens", breve:false, svg:"<svg width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"currentColor\" aria-hidden=\"true\"><path d=\"M20.7905 5.0085C20.0369 4.35438 19.0754 3.99638 18.0821 4.00003H5.91793C4.80457 4.00633 3.73858 4.45612 2.9513 5.25179C2.16403 6.04745 1.71898 7.1248 1.71274 8.25002V12.0918C1.25199 12.7436 1.00294 13.5239 1 14.3249V20.2797C1.00595 20.4688 1.08295 20.6486 1.21534 20.7824C1.34774 20.9162 1.5256 20.994 1.71274 21C1.90177 21 2.08306 20.9241 2.21673 20.789C2.35039 20.6539 2.42549 20.4707 2.42549 20.2797V17.4463H21.5745V20.2797C21.5745 20.4707 21.6496 20.6539 21.7833 20.789C21.9169 20.9241 22.0982 21 22.2873 21C22.4744 20.994 22.6523 20.9162 22.7847 20.7824C22.9171 20.6486 22.9941 20.4688 23 20.2797V14.3249C22.9971 13.5239 22.748 12.7436 22.2873 12.0918V8.25002C22.2859 7.63224 22.1512 7.02219 21.8928 6.46236C21.6343 5.90253 21.2581 5.40639 20.7905 5.0085ZM4.11231 6.11302C4.61579 5.6788 5.25605 5.4404 5.91793 5.4407H18.0821C18.4471 5.4407 18.8086 5.51337 19.1458 5.65455C19.4831 5.79573 19.7895 6.00266 20.0476 6.26353C20.3057 6.5244 20.5105 6.8341 20.6502 7.17494C20.7899 7.51578 20.8618 7.8811 20.8618 8.25002V10.8913C20.4668 10.6916 20.0409 10.5616 19.6026 10.5071V9.25849C19.6026 8.74904 19.4023 8.26045 19.0459 7.90021C18.6895 7.53997 18.206 7.33759 17.7019 7.33759H14.7559C14.2519 7.33759 13.7684 7.53997 13.412 7.90021C13.0555 8.26045 12.8553 8.74904 12.8553 9.25849V10.4831H11.1447V9.25849C11.1447 8.74904 10.9445 8.26045 10.588 7.90021C10.2316 7.53997 9.74814 7.33759 9.24406 7.33759H6.29806C5.79397 7.33759 5.31054 7.53997 4.95409 7.90021C4.59765 8.26045 4.39741 8.74904 4.39741 9.25849V10.5071C3.95908 10.5616 3.53321 10.6916 3.13823 10.8913V8.25002C3.13807 7.84382 3.22508 7.44242 3.39324 7.07349C3.56141 6.70456 3.80674 6.37687 4.11231 6.11302ZM18.1771 10.4831H14.2808V9.25849C14.2808 9.13113 14.3308 9.00898 14.4199 8.91892C14.5091 8.82886 14.6299 8.77827 14.7559 8.77827H17.7019C17.828 8.77827 17.9488 8.82886 18.0379 8.91892C18.127 9.00898 18.1771 9.13113 18.1771 9.25849V10.4831ZM9.71922 10.4831H5.82289V9.25849C5.82289 9.13113 5.87296 9.00898 5.96207 8.91892C6.05118 8.82886 6.17204 8.77827 6.29806 8.77827H9.24406C9.37008 8.77827 9.49094 8.82886 9.58005 8.91892C9.66916 9.00898 9.71922 9.13113 9.71922 9.25849V10.4831ZM2.42549 16.0057V14.3249C2.4234 13.7219 2.64362 13.1398 3.0432 12.6921H3.06695C3.28395 12.4514 3.54803 12.2588 3.84248 12.1265C4.13692 11.9943 4.45532 11.9252 4.77754 11.9237H19.2225C19.5447 11.9252 19.8631 11.9943 20.1575 12.1265C20.452 12.2588 20.716 12.4514 20.933 12.6921H20.9568C21.3589 13.1286 21.58 13.7045 21.5745 14.3009V15.9816L2.42549 16.0057Z\"/></svg>" },
  { n:"Passagens", breve:false, svg:"<svg width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"currentColor\" aria-hidden=\"true\"><path fill-rule=\"evenodd\" clip-rule=\"evenodd\" d=\"M9.57892 2.53469L8.86967 2.71201L11.4426 10.4308H5.4774L3.9774 7.93083H2.17668L4.26001 11.6808L2.17668 15.4308H3.9774L5.4774 12.9308H11.4426L8.86967 20.6497L9.57892 20.827L14.486 13.6894C14.8125 13.2145 15.3518 12.9308 15.9281 12.9308H20.902C21.5924 12.9308 22.152 12.3712 22.152 11.6808C22.152 10.9905 21.5924 10.4308 20.902 10.4308H15.9281C15.3518 10.4308 14.8125 10.1471 14.486 9.67226L9.57892 2.53469ZM9.38346 1.03739C9.88961 0.910857 10.4211 1.11199 10.7167 1.54191L15.7221 8.82246C15.7687 8.8903 15.8457 8.93083 15.9281 8.93083H20.902C22.4208 8.93083 23.652 10.162 23.652 11.6808C23.652 13.1996 22.4208 14.4308 20.902 14.4308H15.9281C15.8457 14.4308 15.7687 14.4714 15.7221 14.5392L10.7167 21.8197C10.4211 22.2497 9.88961 22.4508 9.38346 22.3243L8.24396 22.0394C7.53756 21.8628 7.13102 21.1222 7.36127 20.4314L9.36147 14.4308H6.32668L5.19081 16.324C4.96491 16.7005 4.55802 16.9308 4.11895 16.9308H1.7518C0.798693 16.9308 0.196232 15.9069 0.659101 15.0738L2.54407 11.6808L0.659102 8.28789C0.196233 7.45472 0.798692 6.43083 1.7518 6.43083H4.11895C4.55802 6.43083 4.96491 6.6612 5.19081 7.03771L6.32668 8.93083H9.36147L7.36127 2.93023C7.13102 2.23946 7.53756 1.49887 8.24396 1.32227L9.38346 1.03739Z\"/></svg>" },
  { n:"Aluguel de Carros", breve:true, svg:"<svg width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"currentColor\" aria-hidden=\"true\"><path d=\"M5 14C5 13.5858 5.33579 13.25 5.75 13.25H8.25C8.66421 13.25 9 13.5858 9 14C9 14.4142 8.66421 14.75 8.25 14.75H5.75C5.33579 14.75 5 14.4142 5 14Z\"/><path d=\"M15 14C15 13.5858 15.3358 13.25 15.75 13.25H18.25C18.6642 13.25 19 13.5858 19 14C19 14.4142 18.6642 14.75 18.25 14.75H15.75C15.3358 14.75 15 14.4142 15 14Z\"/><path fill-rule=\"evenodd\" clip-rule=\"evenodd\" d=\"M8.012 3.25C6.50267 3.25 5.19091 4.28991 4.84764 5.76052C4.84373 5.77726 4.8404 5.79413 4.83765 5.8111L4.30896 9.07556L2.26657 8.29898C1.8794 8.15177 1.4462 8.3463 1.29899 8.73347C1.15177 9.12064 1.3463 9.55384 1.73347 9.70105L2.67364 10.0585C1.80635 10.7454 1.25 11.8077 1.25 13V18.75C1.25 19.8542 2.14579 20.75 3.25 20.75H5.5C6.74221 20.75 7.75 19.7422 7.75 18.5V18.25H16.25V18.5C16.25 19.7422 17.2578 20.75 18.5 20.75H20.75C21.8542 20.75 22.75 19.8542 22.75 18.75V13C22.75 11.8082 22.1942 10.7463 21.3275 10.0595L22.2675 9.70072C22.6544 9.55301 22.8484 9.11956 22.7007 8.73258C22.553 8.34559 22.1196 8.15162 21.7326 8.29932L19.748 9.0568C19.7522 9.00119 19.7502 8.94425 19.7414 8.88677L19.2814 5.87477C19.2793 5.86111 19.2769 5.8475 19.274 5.83397C18.9582 4.32899 17.6312 3.25 16.092 3.25H8.012ZM18.2927 9.25C18.2774 9.20635 18.2658 9.16065 18.2586 9.11323L17.802 6.12352C17.6249 5.32218 16.9145 4.75 16.092 4.75H8.012C7.20719 4.75 6.50675 5.29932 6.31387 6.07861L5.80025 9.25H18.2927ZM2.75 13C2.75 11.7572 3.75721 10.75 5 10.75H19C20.2428 10.75 21.25 11.7572 21.25 13V18.75C21.25 19.0258 21.0258 19.25 20.75 19.25H18.5C18.0862 19.25 17.75 18.9138 17.75 18.5V17.5C17.75 17.0858 17.4142 16.75 17 16.75H7C6.58579 16.75 6.25 17.0858 6.25 17.5V18.5C6.25 18.9138 5.91379 19.25 5.5 19.25H3.25C2.97421 19.25 2.75 19.0258 2.75 18.75V13Z\"/></svg>" },
  { n:"Monte sua Viagem", breve:true, svg:"<svg width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"currentColor\" aria-hidden=\"true\"><path fill-rule=\"evenodd\" clip-rule=\"evenodd\" d=\"M7.25002 4.00006C7.25002 2.48085 8.4808 1.25006 10 1.25006H14C15.5192 1.25006 16.75 2.48085 16.75 4.00006V6.25006H17C18.5192 6.25006 19.75 7.48085 19.75 9.00006V19.0001C19.75 20.5193 18.5192 21.7501 17 21.7501H16.75V22.0001C16.75 22.4143 16.4142 22.7501 16 22.7501C15.5858 22.7501 15.25 22.4143 15.25 22.0001V21.7501H8.75002V22.0001C8.75002 22.4143 8.41423 22.7501 8.00002 22.7501C7.5858 22.7501 7.25002 22.4143 7.25002 22.0001V21.7501H7.00002C5.4808 21.7501 4.25002 20.5193 4.25002 19.0001V9.00006C4.25002 7.48085 5.4808 6.25006 7.00002 6.25006H7.25002V4.00006ZM15.25 4.00006C15.25 3.30927 14.6908 2.75006 14 2.75006H10C9.30923 2.75006 8.75002 3.30927 8.75002 4.00006V6.25006H15.25V4.00006ZM16 7.75006H8.00002H7.00002C6.30923 7.75006 5.75002 8.30927 5.75002 9.00006V19.0001C5.75002 19.6908 6.30923 20.2501 7.00002 20.2501H8.00002H16H17C17.6908 20.2501 18.25 19.6908 18.25 19.0001V9.00006C18.25 8.30927 17.6908 7.75006 17 7.75006H16ZM10 9.25006H14C14.4142 9.25006 14.75 9.58585 14.75 10.0001C14.75 10.4143 14.4142 10.7501 14 10.7501H10C9.5858 10.7501 9.25002 10.4143 9.25002 10.0001C9.25002 9.58585 9.5858 9.25006 10 9.25006ZM12.75 13.0001C12.75 12.5858 12.4142 12.2501 12 12.2501C11.5858 12.2501 11.25 12.5858 11.25 13.0001V18.0001C11.25 18.4143 11.5858 18.7501 12 18.7501C12.4142 18.7501 12.75 18.4143 12.75 18.0001V13.0001ZM8.00002 12.2501C7.5858 12.2501 7.25002 12.5858 7.25002 13.0001V18.0001C7.25002 18.4143 7.5858 18.7501 8.00002 18.7501C8.41423 18.7501 8.75002 18.4143 8.75002 18.0001V13.0001C8.75002 12.5858 8.41423 12.2501 8.00002 12.2501ZM16.75 13.0001C16.75 12.5858 16.4142 12.2501 16 12.2501C15.5858 12.2501 15.25 12.5858 15.25 13.0001V18.0001C15.25 18.4143 15.5858 18.7501 16 18.7501C16.4142 18.7501 16.75 18.4143 16.75 18.0001V13.0001Z\"/></svg>" }
];
function iconeDoMotor(svg, cor){
  /* o ícone vive embutido no HTML do protótipo e por isso não declara xmlns;
     como imagem solta, sem ele o navegador recusa o SVG */
  var pronto = svg.replace(/currentColor/g, cor);
  if(pronto.indexOf('xmlns') < 0)
    pronto = pronto.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(pronto);
}

function carregaImagem(src){
  return new Promise(function(ok){
    if(!src){ ok(null); return; }
    var im = new Image();
    if(!/^data:/.test(src)) im.crossOrigin = 'anonymous';
    im.onload = function(){ ok(im); };
    im.onerror = function(){ ok(null); };
    im.src = src;
  });
}
function caminhoArredondado(g, x, y, w, h, r){
  g.beginPath();
  g.moveTo(x+r, y);
  g.arcTo(x+w, y,   x+w, y+h, r);
  g.arcTo(x+w, y+h, x,   y+h, r);
  g.arcTo(x,   y+h, x,   y,   r);
  g.arcTo(x,   y,   x+w, y,   r);
  g.closePath();
}
/* quebra o texto na largura disponível e devolve as linhas */
function quebra(g, txt, larg){
  var palavras = txt.split(' '), linhas = [], atual = '';
  for(var i=0;i<palavras.length;i++){
    var teste = atual ? atual + ' ' + palavras[i] : palavras[i];
    if(g.measureText(teste).width > larg && atual){ linhas.push(atual); atual = palavras[i]; }
    else atual = teste;
  }
  if(atual) linhas.push(atual);
  return linhas;
}

/* ---- a tela do portal, desenhada do zero ---- */
function telaPortal(g, x, y, w, h, cfg, logo, hero, rdc, sys, icones, icAjuda, icZap){
  var t = derivar(cfg.cores.brand, cfg.cores.texto);
  var corTexto = t.texto;
  var k = w / 368;                       /* a tela real tem 368 de largura */
  g.save();
  caminhoArredondado(g, x, y, w, h, 30*k); g.clip();
  g.fillStyle = '#FFFFFF'; g.fillRect(x, y, w, h);

  /* barra do sistema */
  var hSis = 28*k;
  g.fillStyle = '#171B21';
  g.font = '700 ' + (11.5*k) + 'px Inter, system-ui, sans-serif';
  g.textBaseline = 'middle';
  g.fillText('16:53', x + 16*k, y + hSis/2 + 2*k);
  if(sys){
    var altIc = 12*k, largIc = altIc * (130.5/24);
    g.drawImage(sys, x + w - 16*k - largIc, y + hSis/2 + 2*k - altIc/2, largIc, altIc);
  }

  /* cabeçalho branco: logo | Viagens ......... avatar */
  var hCab = 54*k, yCab = y + hSis;
  g.fillStyle = '#FFFFFF'; g.fillRect(x, yCab, w, hCab);
  g.strokeStyle = '#E9EDF2'; g.lineWidth = 1*k;
  g.beginPath(); g.moveTo(x, yCab+hCab); g.lineTo(x+w, yCab+hCab); g.stroke();

  var cx = x + 16*k, meio = yCab + hCab/2;
  if(logo){
    var alt = 26*k, larg = Math.min(104*k, logo.width * (alt/logo.height));
    g.drawImage(logo, cx, meio - alt/2, larg, alt);
    cx += larg + 12*k;
  } else {
    /* o padrão RDC mostra o espaço reservado do logo */
    var lw = 52*k, lh = 26*k;
    g.strokeStyle = corTexto; g.lineWidth = 1.5*k;
    caminhoArredondado(g, cx, meio-lh/2, lw, lh, 7*k); g.stroke();
    g.fillStyle = corTexto;
    g.font = '700 ' + (7*k) + 'px Inter, sans-serif';
    g.textAlign = 'center';
    g.fillText('seu logo aqui', cx + lw/2, meio);
    g.textAlign = 'left';
    cx += lw + 12*k;
  }
  g.fillStyle = '#E9EDF2';
  g.fillRect(cx, meio - 11*k, 1*k, 22*k);
  cx += 12*k;
  g.fillStyle = corTexto;
  g.font = '600 ' + (16.5*k) + 'px Inter, system-ui, sans-serif';
  g.fillText(cfg.rotulo || 'Viagens', cx, meio + 1*k);

  var raio = 14.5*k, ax = x + w - 16*k - raio;
  g.fillStyle = '#F5F7FA'; g.beginPath(); g.arc(ax, meio, raio, 0, 7); g.fill();
  g.strokeStyle = '#E9EDF2'; g.lineWidth = 1*k; g.stroke();
  g.strokeStyle = '#626C78'; g.lineWidth = 1.6*k;
  g.beginPath(); g.arc(ax, meio - 3*k, 4.2*k, 0, 7); g.stroke();
  g.beginPath(); g.arc(ax, meio + 9*k, 8*k, Math.PI*1.15, Math.PI*1.85); g.stroke();

  /* faixa da marca com as categorias (16 + 48 do tile + 7 + 29 do rótulo + 18) */
  var ink = (cfg.cores && cfg.cores.brandInk) || t.ink;
  var rgbInk = hex2rgb(ink).join(',');
  var yCat = yCab + hCab, hCat = 118*k;
  g.fillStyle = cfg.cores.brand; g.fillRect(x, yCat, w, hCat);
  var colunas = MOCK_CATS.length, padLado = 12*k, vao = 8*k;
  var largCol = (w - padLado*2 - vao*(colunas-1)) / colunas;
  var ladoIc = 48*k, yTile = yCat + 16*k;
  for(var ci = 0; ci < colunas; ci++){
    var cat = MOCK_CATS[ci];
    var meioCol = x + padLado + ci*(largCol + vao) + largCol/2;
    g.globalAlpha = cat.breve ? 0.7 : 1;
    g.fillStyle = 'rgba(' + rgbInk + ',0.12)';
    caminhoArredondado(g, meioCol - ladoIc/2, yTile, ladoIc, ladoIc, 16*k); g.fill();
    var im = icones && icones[ci];
    if(im) g.drawImage(im, meioCol - 12*k, yTile + ladoIc/2 - 12*k, 24*k, 24*k);
    g.fillStyle = ink;
    g.font = '500 ' + (11.5*k) + 'px Inter, system-ui, sans-serif';
    g.textAlign = 'center';
    var linhasCat = quebra(g, cat.n, largCol);
    for(var li = 0; li < linhasCat.length; li++)
      g.fillText(linhasCat[li], meioCol, yTile + ladoIc + 14*k + li*14.5*k);
    g.globalAlpha = 1;
    if(cat.breve){
      /* o selo não apaga junto: quem apaga é só o ícone e o rótulo */
      g.font = '700 ' + (8.5*k) + 'px Inter, system-ui, sans-serif';
      var larguraSelo = g.measureText('em breve').width + 12*k, alturaSelo = 15*k;
      var ySelo = yTile - 9*k;
      g.fillStyle = '#FFFFFF';
      caminhoArredondado(g, meioCol - larguraSelo/2, ySelo, larguraSelo, alturaSelo, alturaSelo/2);
      g.fill();
      g.fillStyle = '#4A5866';
      g.fillText('em breve', meioCol, ySelo + alturaSelo/2 + 0.5*k);
    }
    g.textAlign = 'left';
  }

  /* foto com a chamada */
  var yFoto = yCat + hCat, hRodape = 239*k;
  var hFoto = (y + h) - yFoto - hRodape;
  if(hero){
    /* a foto cobre a largura e sobra em altura: sem recorte ela transborda
       para cima e come a faixa de categorias */
    g.save();
    g.beginPath(); g.rect(x, yFoto, w, hFoto); g.clip();
    var escala = Math.max(w / hero.width, hFoto / hero.height);
    var lw2 = hero.width*escala, lh2 = hero.height*escala;
    g.drawImage(hero, x + (w-lw2)/2, yFoto + (hFoto-lh2)/2, lw2, lh2);
    g.restore();
  } else {
    g.fillStyle = '#DDE3EA'; g.fillRect(x, yFoto, w, hFoto);
  }
  g.save();
  g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = 14*k; g.shadowOffsetY = 2*k;
  var tx = x + 40*k, ty = yFoto + 30*k, tw = w - 62*k;
  g.fillStyle = '#FFFFFF';
  g.font = '700 ' + (19*k) + 'px Inter, system-ui, sans-serif';
  var linhas = quebra(g, 'Há viagens que levam a novos lugares.', tw)
        .concat(quebra(g, 'E há viagens que ficam com a gente para sempre.', tw));
  var lh3 = 25*k;
  linhas.forEach(function(l, i){ g.fillText(l, tx, ty + i*lh3 + lh3/2); });
  var yFim = ty + linhas.length*lh3;
  g.font = '400 ' + (12.5*k) + 'px Inter, system-ui, sans-serif';
  g.globalAlpha = .92;
  quebra(g, 'Escolha o destino da próxima história que você quer viver.', tw)
    .forEach(function(l, i){ g.fillText(l, tx, yFim + 6*k + i*16*k + 8*k); });
  g.globalAlpha = 1;
  g.restore();
  /* tarja da marca */
  g.fillStyle = cfg.cores.brand;
  caminhoArredondado(g, x + 22*k, ty + 4*k, 6*k, 64*k, 4*k); g.fill();

  /* rodapé: o bloco de ajuda e, abaixo da linha, o aviso legal.
     As medidas vêm da tela real, lidas no navegador. */
  var yR = y + h - hRodape;
  var acento = (cfg.cores && cfg.cores.accent) || '#FF9100';
  g.fillStyle = '#F5F7FA'; g.fillRect(x, yR, w, hRodape);
  g.strokeStyle = '#E9EDF2'; g.lineWidth = 1*k;
  g.beginPath(); g.moveTo(x, yR); g.lineTo(x+w, yR); g.stroke();

  /* "Precisa de ajuda com sua viagem?" */
  if(icAjuda) g.drawImage(icAjuda, x + 16*k, yR + 24.8*k, 30*k, 30*k);
  g.fillStyle = corTexto;
  g.font = '700 ' + (15*k) + 'px Inter, system-ui, sans-serif';
  g.fillText('Precisa de ajuda', x + 58*k, yR + 30.4*k);
  g.fillText('com sua viagem?', x + 58*k, yR + 49.1*k);

  /* botão "Fale com a nossa equipe", vazado na cor de destaque */
  g.font = '600 ' + (14.5*k) + 'px Inter, system-ui, sans-serif';
  var largBotao = 42*k + g.measureText('Fale com a nossa equipe').width + 16*k;
  g.strokeStyle = acento; g.lineWidth = 1*k;
  caminhoArredondado(g, x + 16*k, yR + 71.5*k, largBotao, 38*k, 19*k); g.stroke();
  if(icZap) g.drawImage(icZap, x + 27*k, yR + 80.5*k, 20*k, 20*k);
  g.fillStyle = acento;
  g.fillText('Fale com a nossa equipe', x + 58*k, yR + 90.5*k);

  /* linha e aviso legal */
  g.strokeStyle = '#E9EDF2'; g.lineWidth = 1*k;
  g.beginPath(); g.moveTo(x + 16*k, yR + 127.5*k); g.lineTo(x + w - 16*k, yR + 127.5*k); g.stroke();
  g.fillStyle = '#8B95A2';
  g.font = '400 ' + (10.5*k) + 'px Inter, system-ui, sans-serif';
  g.fillText('©RDC Viagens', x + 16*k, yR + 154*k);
  g.fillText('Todos os direitos reservados.', x + 16*k, yR + 169.8*k);
  g.fillStyle = '#626C78';
  g.fillText('Política de Privacidade', x + 16*k, yR + 198*k);
  g.textAlign = 'right';
  g.fillStyle = '#8B95A2';
  g.fillText('Tecnologia e operação', x + w - 16*k, yR + 154*k);
  g.fillText('turística por', x + w - 16*k, yR + 169.2*k);
  if(rdc){
    var rh = 30*k, rw = rdc.width * (rh/rdc.height);
    g.drawImage(rdc, x + w - 16*k - rw, yR + 181.9*k, rw, rh);
  }
  g.textAlign = 'left';
  g.restore();
}

/* ---- a tela do app do cliente: é só a imagem enviada ---- */
function telaImagem(g, x, y, w, h, im){
  g.save();
  caminhoArredondado(g, x, y, w, h, 30*(w/368)); g.clip();
  g.fillStyle = '#0E1A2B'; g.fillRect(x, y, w, h);
  if(im){
    var e = Math.max(w/im.width, h/im.height);
    g.drawImage(im, x + (w - im.width*e)/2, y, im.width*e, im.height*e);
  }
  g.restore();
}

/* ---- a moldura do aparelho ---- */
function aparelho(g, x, y, larguraTela, dentro){
  var alturaTela = larguraTela * (814/368);
  var borda = larguraTela * 0.035;
  var lw = larguraTela + borda*2, lh = alturaTela + borda*2;
  g.save();
  g.shadowColor = 'rgba(14,26,43,.30)';
  g.shadowBlur = larguraTela*0.16; g.shadowOffsetY = larguraTela*0.05;
  g.fillStyle = '#0E1A2B';
  caminhoArredondado(g, x, y, lw, lh, larguraTela*0.115); g.fill();
  g.restore();
  g.strokeStyle = '#223247'; g.lineWidth = Math.max(1, larguraTela*0.006);
  caminhoArredondado(g, x, y, lw, lh, larguraTela*0.115); g.stroke();
  dentro(x + borda, y + borda, larguraTela, alturaTela);
  /* alto-falante */
  g.fillStyle = '#243449';
  caminhoArredondado(g, x + lw/2 - larguraTela*0.16, y + borda*0.55,
                     larguraTela*0.32, Math.max(2, larguraTela*0.014), larguraTela*0.01);
  g.fill();
  return { w: lw, h: lh };
}

/* ---- a mesma barra de status do protótipo, num SVG só ---- */
var SVG_TIRA_STATUS =
  '<svg xmlns="http://www.w3.org/2000/svg" width="130.5" height="24" viewBox="0 0 130.5 24" '+
   'fill="none" stroke="#171B21" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+
    '<g opacity="0.9">'+
    '<g><circle cx="11" cy="13.5" r="8"/><path d="M3 5.5 6.2 2.6"/>'+
      '<path d="M19 5.5 15.8 2.6"/><path d="M11 8.5v5l3.3 2.3"/></g>'+
    '<g transform="translate(27 0)"><path d="m1.5 6.5 11 11L7 23V1l5.5 5.5L1.5 17.5"/></g>'+
    '<g transform="translate(46 0)" stroke-linejoin="round">'+
      '<path d="M1.42 7.5a16 16 0 0 1 21.16 0"/><path d="M5 11.05a11 11 0 0 1 14.08 0"/>'+
      '<path d="M8.53 14.61a6 6 0 0 1 6.95 0"/>'+
      '<circle cx="12" cy="18.4" r="1.15" fill="#171B21" stroke="none"/></g>'+
    '<g transform="translate(75 0)" fill="#171B21" stroke="none">'+
      '<rect x="0" y="16" width="3.6" height="5.5" rx="1.8"/>'+
      '<rect x="5.6" y="12" width="3.6" height="9.5" rx="1.8"/>'+
      '<rect x="11.2" y="7.5" width="3.6" height="14" rx="1.8"/>'+
      '<rect x="16.8" y="3" width="3.6" height="18.5" rx="1.8"/></g>'+
    '<g transform="translate(100.5 0)">'+
      '<rect x="1" y="6" width="24" height="12" rx="3.5"/>'+
      '<rect x="26.4" y="9.8" width="2.4" height="4.4" rx="1.2" fill="#171B21" stroke="none"/>'+
      '<rect x="5.2" y="9" width="3" height="6" rx="1.5" fill="#171B21" stroke="none"/>'+
      '<rect x="10.2" y="9" width="3" height="6" rx="1.5" fill="#171B21" stroke="none"/>'+
      '<rect x="15.2" y="9" width="3" height="6" rx="1.5" fill="#171B21" stroke="none"/></g>'+
    '</g></svg>';
var MOCK_STATUS = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(SVG_TIRA_STATUS);

/* ---- inclinação: gira em torno do próprio centro ---- */
function cantos(x, y, w, h, ang){
  var cx = x + w/2, cy = y + h/2, co = Math.cos(ang), si = Math.sin(ang);
  return [[x,y],[x+w,y],[x+w,y+h],[x,y+h]].map(function(v){
    var dx = v[0]-cx, dy = v[1]-cy;
    return [cx + dx*co - dy*si, cy + dx*si + dy*co];
  });
}
function extremos(listas){
  var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  listas.forEach(function(l){ l.forEach(function(p){
    if(p[0]<minX) minX=p[0]; if(p[0]>maxX) maxX=p[0];
    if(p[1]<minY) minY=p[1]; if(p[1]>maxY) maxY=p[1];
  }); });
  return {minX:minX, minY:minY, maxX:maxX, maxY:maxY};
}
function inclinado(g, x, y, w, h, ang, desenha){
  var cx = x + w/2, cy = y + h/2;
  g.save(); g.translate(cx, cy); g.rotate(ang); g.translate(-cx, -cy);
  desenha(); g.restore();
}

/* ---- monta a cena e devolve o canvas pronto ---- */
function montaMockup(cfg, escala, feito){
  var comApp = !!(cfg.appProprio && cfg.appProprio.ativo && cfg.appProprio.imagem);
  var tonsMock = derivar(cfg.cores.brand, cfg.cores.texto);
  var inkMock = (cfg.cores && cfg.cores.brandInk) || tonsMock.ink;
  Promise.all([
    carregaImagem(cfg.logo || null),
    carregaImagem(MOCK_HERO),
    carregaImagem(MOCK_RDC),
    comApp ? carregaImagem(cfg.appProprio.imagem) : Promise.resolve(null),
    carregaImagem(MOCK_STATUS),
    Promise.all(MOCK_CATS.map(function(c){
      return carregaImagem(iconeDoMotor(c.svg, inkMock));
    })),
    carregaImagem(iconeDoMotor(MOCK_IC_AJUDA, tonsMock.texto)),
    carregaImagem(iconeDoMotor(MOCK_IC_ZAP, (cfg.cores && cfg.cores.accent) || '#FF9100'))
  ]).then(function(r){
    var logo = r[0], hero = r[1], rdc = r[2], app = r[3], sys = r[4], icones = r[5];
    var icAjuda = r[6], icZap = r[7];
    var c = document.createElement('canvas');
    var g = c.getContext('2d');
    var larguraFrente = 300 * escala;
    var larguraFundo  = 232 * escala;
    var margem = 30 * escala;

    if(comApp && app){
      /* dois aparelhos levemente inclinados: o app do cliente na frente,
         o portal padrão atrás, saindo pela esquerda */
      var cheiaFrente = larguraFrente * 1.07, cheiaFundo = larguraFundo * 1.07;
      var alturaFrente = larguraFrente * (814/368) * 1.07;
      var alturaFundo  = larguraFundo  * (814/368) * 1.07;
      var angFundo = -9 * Math.PI/180, angFrente = -4 * Math.PI/180;
      var xFundo = 0, yFundo = alturaFrente * 0.17;
      var xFrente = cheiaFundo * 0.86, yFrente = 0;
      var caixa = extremos([
        cantos(xFundo,  yFundo,  cheiaFundo,  alturaFundo,  angFundo),
        cantos(xFrente, yFrente, cheiaFrente, alturaFrente, angFrente)
      ]);
      c.width  = Math.round(caixa.maxX - caixa.minX + margem*2);
      c.height = Math.round(caixa.maxY - caixa.minY + margem*2);
      g.translate(margem - caixa.minX, margem - caixa.minY);
      /* primeiro o de trás: o portal padrão */
      inclinado(g, xFundo, yFundo, cheiaFundo, alturaFundo, angFundo, function(){
        aparelho(g, xFundo, yFundo, larguraFundo, function(x,y,w,h){
          telaPortal(g, x, y, w, h, cfg, logo, hero, rdc, sys, icones, icAjuda, icZap);
        });
      });
      /* por cima, a home do app do cliente */
      inclinado(g, xFrente, yFrente, cheiaFrente, alturaFrente, angFrente, function(){
        aparelho(g, xFrente, yFrente, larguraFrente, function(x,y,w,h){
          telaImagem(g, x, y, w, h, app);
        });
      });
    } else {
      var altura = larguraFrente * (814/368) * 1.07;
      c.width  = Math.round(margem*2 + larguraFrente*1.07);
      c.height = Math.round(margem*2 + altura);
      aparelho(g, margem, margem, larguraFrente, function(x,y,w,h){
        telaPortal(g, x, y, w, h, cfg, logo, hero, rdc, sys, icones, icAjuda, icZap);
      });
    }
    feito(c, comApp && !!app);
  });
}

/* ---------- documento da prévia ---------- */
function montarDoc(cfg){
  var tc = {
    cliente: cfg.cliente || 'Sua Marca',
    rotulo : cfg.rotulo || 'Viagens',
    logo   : cfg.logo || null,
    prime  : cfg.prime !== false,
    cores  : cfg.cores || {},
    appProprio: cfg.appProprio && cfg.appProprio.ativo ? cfg.appProprio : {ativo:false}
  };
  if(cfg.padrao) tc.padrao = true;
  var cabeca, corpo;
  if(window.TC_INLINE){                       // versão empacotada (visualização)
    cabeca = '<style>'+window.TC_INLINE.css+'</style>';
    corpo  = '<scr'+'ipt>window.TC_IMG='+JSON.stringify(window.TC_INLINE.img)+';window.TC='+
             JSON.stringify(tc)+';</scr'+'ipt><scr'+'ipt>'+window.TC_INLINE.js+'</scr'+'ipt>';
  } else {                                    // versão em arquivos, na pasta do projeto
    cabeca = '<link rel="stylesheet" href="/assets/tc.css?v=22">';
    corpo  = '<scr'+'ipt>window.TC='+JSON.stringify(tc)+';</scr'+'ipt>'+
             '<scr'+'ipt src="/assets/tc.js?v=22"></scr'+'ipt>';
  }
  // a folha de fontes vai no fim: no head ela bloqueia a execução dos scripts
  var fonte = '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'+
    '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">';
  return '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8">'+
    '<meta name="viewport" content="width=device-width,initial-scale=1">'+
    cabeca+'</head><body><div class="phone"><div class="vp" id="vp"></div></div>'+corpo+fonte+'</body></html>';
}
var tmrPrevia = null;
function atualizarPrevia(){
  clearTimeout(tmrPrevia);
  tmrPrevia = setTimeout(function(){
    var fr = document.getElementById('fr');
    if(fr) fr.srcdoc = montarDoc(rascunho);
  }, 220);
}


/* ============================================================
   TELA 0 — ENTRAR
   ============================================================ */
function verLogin(recado){
  app.innerHTML =
   '<div class="portao"><div class="bloco">'+
     '<h1 style="font-size:24px;margin-bottom:4px">Travel Cloud</h1>'+
     '<p class="dica" style="margin-bottom:20px">Entre com o e-mail cadastrado para ver e editar os protótipos.</p>'+
     '<div class="campo2"><label>E-mail</label>'+
       '<input type="text" id="lgEmail" placeholder="nome@rdcviagens.com.br" value="'+esc(sessao.email||'')+'"></div>'+
     '<div class="campo2"><label>Senha</label>'+
       '<input type="password" id="lgSenha" placeholder="••••••••"></div>'+
     '<div class="rodape-acoes" style="margin-top:4px">'+
       '<button class="b forte" id="btEntrar">Entrar</button></div>'+
     (recado ? '<div class="recado ruim" style="margin-top:14px">'+recado+'</div>' : '')+
   '</div></div>';

  function tentar(){
    var email = document.getElementById('lgEmail').value.trim();
    var senha = document.getElementById('lgSenha').value;
    if(!email || !senha) return verLogin('Preencha e-mail e senha.');
    document.getElementById('btEntrar').textContent = 'Entrando…';
    fetch('/api/entrar', {method:'POST', headers:{'content-type':'application/json'},
      body: JSON.stringify({email:email, senha:senha})})
      .then(function(r){ return r.json().then(function(d){ return {ok:r.ok, d:d}; }); })
      .then(function(x){
        if(!x.ok) return verLogin(esc(x.d.erro || 'Não consegui entrar.'));
        guardarSessao(x.d.token, x.d.email);
        iniciar();
      })
      .catch(function(){ verLogin('Servidor fora do ar. Tente de novo em instantes.'); });
  }
  document.getElementById('btEntrar').onclick = tentar;
  app.querySelectorAll('#lgEmail,#lgSenha').forEach(function(i){
    i.onkeydown = function(e){ if(e.key === 'Enter') tentar(); };
  });
}

/* ============================================================
   TELA 3 — QUEM PODE ENTRAR
   ============================================================ */
function verEmails(){
  var linhas = emailsAcesso.map(function(e, i){
    var eu = e === sessao.email;
    return '<div class="fila"><span>'+esc(e)+(eu?' <span class="selo">você</span>':'')+'</span>'+
      (eu ? '' : '<button class="b mini perigo" data-tira="'+i+'">Remover</button>')+'</div>';
  }).join('');
  app.innerHTML =
   '<div class="topo"><div><h1>Quem pode entrar</h1>'+
     '<p class="sub">Só estes e-mails conseguem abrir o editor. A senha é a mesma para todos.</p></div>'+
     '<button class="b" id="btVoltar">← Voltar</button></div>'+
   '<div class="bloco" style="max-width:620px">'+
     '<h2>E-mails cadastrados</h2><p class="dica">Você não pode remover o seu próprio acesso.</p>'+
     '<div id="filas">'+linhas+'</div>'+
     '<div class="juntos" style="margin-top:16px">'+
       '<input type="text" id="novoEmail" placeholder="nome@rdcviagens.com.br">'+
       '<button class="b forte" id="btAddEmail">Cadastrar</button></div>'+
     '<div id="recadoEmail" class="recado info esconde"></div>'+
   '</div>';

  function salvarEmails(novos){
    return pedir('/api/dados', {method:'PUT', body: JSON.stringify({emails: novos})})
      .then(function(d){ emailsAcesso = d.emails || novos; verEmails(); })
      .catch(function(e){ recado(e.message, 'ruim'); });
  }
  function recado(t, tipo){
    var el = document.getElementById('recadoEmail');
    el.className = 'recado ' + (tipo||'info'); el.textContent = t; el.classList.remove('esconde');
  }
  document.getElementById('btVoltar').onclick = verGaleria;
  document.getElementById('btAddEmail').onclick = function(){
    var v = document.getElementById('novoEmail').value.trim().toLowerCase();
    if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) return recado('Esse e-mail não parece válido.','ruim');
    if(emailsAcesso.indexOf(v) >= 0) return recado('Esse e-mail já tem acesso.','info');
    salvarEmails(emailsAcesso.concat([v]));
  };
  document.getElementById('novoEmail').onkeydown = function(e){
    if(e.key === 'Enter') document.getElementById('btAddEmail').click();
  };
  app.querySelectorAll('[data-tira]').forEach(function(b){
    b.onclick = function(){
      var i = +b.dataset.tira;
      salvarEmails(emailsAcesso.filter(function(_, k){ return k !== i; }));
    };
  });
}

/* ============================================================
   TELA 1 — GALERIA
   ============================================================ */
function verGaleria(){
  editando = null; rascunho = null;
  var busca = '', ordem = 'recentes';
  try{ ordem = localStorage.getItem('tc-ordem') || 'recentes'; }catch(e){}

  function quando(p, i){
    return p.atualizadoEm || p.criadoEm || (i + 1);   /* sem data: vale a ordem de criação */
  }
  function dataCurta(ms){
    if(!ms || ms < 1e11) return '';
    var d = new Date(ms), z = function(n){ return (n<10?'0':'')+n; };
    return z(d.getDate())+'/'+z(d.getMonth()+1)+'/'+d.getFullYear();
  }
  function filtrados(){
    var alvo = busca.trim().toLowerCase();
    var itens = lista.map(function(p, i){ return { p: p, i: i }; });
    if(alvo) itens = itens.filter(function(o){
      return (o.p.cliente+' '+o.p.slug+' '+(o.p.rotulo||'')).toLowerCase().indexOf(alvo) >= 0;
    });
    itens.sort(function(a, b){
      if(ordem === 'nome')     return a.p.cliente.localeCompare(b.p.cliente, 'pt');
      if(ordem === 'nome-z')   return b.p.cliente.localeCompare(a.p.cliente, 'pt');
      if(ordem === 'antigos')  return quando(a.p, a.i) - quando(b.p, b.i);
      return quando(b.p, b.i) - quando(a.p, a.i);
    });
    return itens;
  }
  function cartao(p, i){
    var t = derivar(p.cores.brand, p.cores.texto);
    var capa = p.logo
      ? '<img src="'+esc(p.logo)+'" alt="'+esc(p.cliente)+'">'
      : '<b>'+esc(p.cliente)+'</b>';
    var dia = dataCurta(p.criadoEm);
    return '<div class="proto">'+
      '<div class="capa" style="background:'+(p.logo?'#fff':'linear-gradient(120deg,'+p.cores.brand+','+t.dark+')')+'">'+capa+'</div>'+
      '<div class="corpo"><h3>'+esc(p.cliente)+'</h3>'+
        '<div class="meta"><span class="pt" style="background:'+p.cores.brand+'"></span>'+
          esc(p.cores.brand)+' · /'+esc(p.slug)+(dia ? ' · criado em '+dia : '')+'</div>'+
        '<div class="marcas">'+
          (p.prime!==false ? '<span class="selo ok">Prime</span>' : '<span class="selo">Sem Prime</span>')+
          (p.appProprio && p.appProprio.ativo ? '<span class="selo">App próprio</span>' : '')+
          (p.logo ? '' : '<span class="selo">Sem logo</span>')+
          '<span class="selo ar">No ar</span>'+
        '</div></div>'+
      '<div class="acoes">'+
        '<button class="b mini forte" data-editar="'+i+'">Editar</button>'+
        '<a class="b mini" href="'+esc(linkDe(p))+'" target="_blank" rel="noopener">Abrir link</a>'+
        '<button class="b mini" data-link="'+i+'">Copiar link</button>'+
        '<button class="b mini" data-qr="'+i+'">QR code</button>'+
        '<div class="acoes-fim"><button class="b mini perigo" data-excluir="'+i+'">Excluir</button></div>'+
      '</div></div>';
  }

  app.innerHTML =
   '<div class="topo"><div><h1>Protótipos por cliente</h1>'+
     '<p class="sub">Cada protótipo vira um link com a marca do cliente. Salvou, está no ar — '+
     'é só copiar o link e apresentar.</p></div>'+
     '<div class="rodape-acoes">'+
       (TEM_API ? '<button class="b" id="btEmails">Quem pode entrar</button>'+
                  '<button class="b" id="btSair">Sair</button>' : '')+
       '<button class="b forte" id="btNovo">+ Novo protótipo</button></div></div>'+
   (lista.length ? '<div class="filtros">'+
     '<div class="campo-busca">'+
       '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" '+
         'stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>'+
       '<input type="search" id="buscaProto" placeholder="Buscar por cliente ou link" autocomplete="off">'+
     '</div>'+
     '<label class="campo-ordem"><span>Ordenar por</span>'+
       '<select id="ordemProto">'+
         '<option value="recentes">Mais recentes</option>'+
         '<option value="antigos">Mais antigos</option>'+
         '<option value="nome">Nome (A–Z)</option>'+
         '<option value="nome-z">Nome (Z–A)</option>'+
       '</select></label>'+
     '<span class="conta" id="contaProto"></span>'+
   '</div>' : '')+
   (lista.length ? '<div class="grade" id="grade"></div>' : '')+
   (lista.length ? '' : '<div class="vazio">Nenhum protótipo ainda.<br>Comece pelo <b>+ Novo protótipo</b> — leva menos de um minuto.</div>')+
   (somenteLeitura ? '<div class="recado ruim" style="margin-bottom:18px">'+
      '<b>O armazenamento do projeto está indisponível.</b> Você está vendo os protótipos '+
      'que já estavam no ar e <b>não é possível salvar</b> agora — nada foi perdido. '+
      'Alguém do time precisa conferir o Blob do projeto na Vercel.</div>' : '')+
   (TEM_API ? '<p class="assinado">Você entrou como <b>'+esc(sessao.email)+'</b>. '+
      'Tudo o que você salvar aqui aparece para todo mundo do time.</p>' : '');

  function pintaGrade(){
    var grade = document.getElementById('grade'); if(!grade) return;
    var itens = filtrados();
    grade.innerHTML = itens.length
      ? itens.map(function(o){ return cartao(o.p, o.i); }).join('')
      : '<div class="vazio" style="grid-column:1/-1">Nenhum protótipo com <b>'+esc(busca)+'</b>.</div>';
    document.getElementById('contaProto').textContent = itens.length === lista.length
      ? lista.length + (lista.length === 1 ? ' protótipo' : ' protótipos')
      : itens.length + ' de ' + lista.length;
    ligarCartoes();
  }

  function ligarCartoes(){
    app.querySelectorAll('[data-editar]').forEach(function(b){
      b.onclick = function(){ var i=+b.dataset.editar; verEditor(JSON.parse(JSON.stringify(lista[i])), i); };
    });
    app.querySelectorAll('[data-qr]').forEach(function(b){
      b.onclick = function(){
        var p = lista[+b.dataset.qr];
        try{
          qrBaixaPNG(linkDe(p), 'qr-' + (p.slug || 'cliente'));
          var antes = b.textContent; b.textContent = 'Baixando…';
          setTimeout(function(){ if(b.isConnected) b.textContent = antes; }, 1600);
        }catch(e){ alert('Não consegui gerar o QR code: ' + e.message); }
      };
    });
    app.querySelectorAll('[data-link]').forEach(function(b){
      b.onclick = function(){
        var url = linkDe(lista[+b.dataset.link]);
        function pronto(){
          var antes = b.textContent; b.textContent = 'Link copiado';
          setTimeout(function(){ if(b.isConnected) b.textContent = antes; }, 1800);
        }
        if(navigator.clipboard && navigator.clipboard.writeText){
          navigator.clipboard.writeText(url).then(pronto, function(){ copiaAntiga(url, pronto); });
        } else copiaAntiga(url, pronto);
      };
    });
    app.querySelectorAll('[data-excluir]').forEach(function(b){
      b.onclick = function(){
        var i = +b.dataset.excluir;
        if(b.dataset.confirmando){ lista.splice(i,1); gravar().then(verGaleria, verGaleria); return; }
        b.dataset.confirmando = '1'; b.textContent = 'Confirmar exclusão';
        setTimeout(function(){ if(b.isConnected){ delete b.dataset.confirmando; b.textContent='Excluir'; } }, 4000);
      };
    });
  }

  document.getElementById('btNovo').onclick = function(){ verEditor(novoModelo(), null); };
  if(document.getElementById('btEmails')) document.getElementById('btEmails').onclick = verEmails;
  if(document.getElementById('btSair')) document.getElementById('btSair').onclick = function(){
    limparSessao(); lista = []; verLogin();
  };
  var cxBusca = document.getElementById('buscaProto'), cxOrdem = document.getElementById('ordemProto');
  if(cxBusca){
    cxOrdem.value = ordem;
    cxBusca.oninput = function(){ busca = this.value; pintaGrade(); };
    cxOrdem.onchange = function(){
      ordem = this.value;
      try{ localStorage.setItem('tc-ordem', ordem); }catch(e){}
      pintaGrade();
    };
  }
  pintaGrade();
}

/* ============================================================
   TELA 2 — NOVO / EDITAR
   ============================================================ */
function verEditor(cfg, idx){
  rascunho = cfg; editando = idx;
  var t = derivar(cfg.cores.brand);
  var ap = cfg.appProprio || (cfg.appProprio = {ativo:false, imagem:null, hotspot:{x:3,y:36,w:94,h:7}});

  app.innerHTML =
  '<div class="topo"><div><h1>'+(idx===null?'Novo protótipo':'Editar '+esc(cfg.cliente||'protótipo'))+'</h1>'+
    '<p class="sub">Preencha a marca do cliente. A prévia ao lado responde a cada mudança.</p></div>'+
    '<button class="b" id="btVoltar">← Voltar</button></div>'+
  '<div class="duas"><div>'+

  '<div class="bloco"><h2>Cliente</h2>'+
    '<p class="dica">O nome aparece nos textos do protótipo. O link é a pasta que vai ao ar.</p>'+
    '<div class="linha">'+
      '<div class="campo2"><label>Nome do cliente</label>'+
        '<input type="text" id="fNome" value="'+esc(cfg.cliente)+'" placeholder="BRB"></div>'+
      '<div class="campo2"><label>Link</label>'+
        '<input type="text" id="fSlug" value="'+esc(cfg.slug)+'" placeholder="brb">'+
        '<div class="ajuda">Fica <code>'+esc(SITE)+'/<span id="vSlug">'+esc(cfg.slug||'cliente')+'</span></code></div></div>'+
    '</div></div>'+

  '<div class="bloco"><h2>Marca</h2>'+
    '<p class="dica">Comece pelo site do cliente. Se a captura não trouxer o que você quer, envie o logo e ajuste a cor à mão.</p>'+
    '<div class="campo2"><label>Site do cliente</label>'+
      '<div class="juntos"><input type="url" id="fSite" placeholder="brb.com.br">'+
      '<button class="b" id="btBuscar">Buscar logos</button></div>'+
      '<div class="ajuda">Traz os logos que existem no site do cliente. Clique em um para usar.</div></div>'+
    '<div id="achadosLogo"></div>'+
    '<div class="campo2"><label>Logo</label>'+
      '<label class="solta" id="zonaLogo">Clique ou arraste o arquivo do logo aqui<br>'+
        '<small>PNG com fundo transparente ou SVG</small>'+
        '<input type="file" id="fLogo" accept="image/*"></label>'+
      '<div class="previa-logo'+(cfg.logo?'':' esconde')+'" id="previaLogo">'+
        '<div class="cx"><img id="imgLogo" src="'+esc(cfg.logo||'')+'" alt=""></div>'+
        '<button class="b mini" id="btCoresLogo">Reler cores</button>'+
        '<button class="b mini perigo" id="btTiraLogo">Remover</button></div>'+
      '<div id="coresLogo" class="cores-logo"></div></div>'+
    '<div class="campo2"><label>Cor principal</label>'+
      '<div class="cor-linha">'+
        '<span class="cor-amostra" style="background:'+cfg.cores.brand+'">'+
          '<input type="color" id="fCorPicker" value="'+cfg.cores.brand+'"></span>'+
        '<input type="text" id="fCor" value="'+cfg.cores.brand+'" placeholder="#00AEEF ou 0,174,239">'+
      '</div>'+
      '<div class="ajuda">Aceita HEX (<code>#00AEEF</code>) ou RGB (<code>0,174,239</code>).</div>'+
      '<div class="tons" id="tons">'+
        '<span class="tom"><i style="background:'+t.brand+'"></i>principal '+t.brand+'</span>'+
        '<span class="tom"><i style="background:'+t.dark+'"></i>escuro '+t.dark+'</span>'+
        '<span class="tom"><i style="background:'+t.light+'"></i>claro '+t.light+'</span>'+
        '<span class="tom"><i style="background:'+t.ink+'"></i>sobre a cor '+t.ink+'</span>'+
      '</div>'+
      '<label class="chave'+(cfg.manual?' on':'')+'" id="chManual" style="margin-top:14px">'+
        '<i></i><span>Ajustar os tons à mão</span></label>'+
      '<div class="linha '+(cfg.manual?'':'esconde')+'" id="manual">'+
        '<div class="campo2"><label>Tom escuro</label><input type="text" id="fDark" value="'+(cfg.cores.brandDark||t.dark)+'"></div>'+
        '<div class="campo2"><label>Tom claro</label><input type="text" id="fLight" value="'+(cfg.cores.brandLight||t.light)+'"></div>'+
        '<div class="campo2"><label>Texto sobre a cor</label><input type="text" id="fInk" value="'+(cfg.cores.brandInk||t.ink)+'"></div>'+
      '</div>'+
    '</div>'+
    '<div class="campo2"><label>Cor do texto</label>'+
      '<p class="ajuda" style="margin:0 0 9px">A marca quando vira letra ou ícone sobre fundo branco: '+
      'o nome do benefício no header, links, abas e seleções. Os fundos continuam na cor principal.</p>'+
      '<div id="textoOpcoes" class="texto-opcoes"></div>'+
      '<div class="cor-linha '+(cfg.cores.textoManual?'':'esconde')+'" id="textoManual">'+
        '<span class="cor-amostra" id="textoAmostra"><input type="color" id="fTextoPicker"></span>'+
        '<input type="text" id="fTexto" placeholder="#001489 ou 0,20,137">'+
      '</div>'+
      '<div id="textoProva" class="prova"></div>'+
    '</div>'+
    '<div id="recado" class="recado info esconde"></div></div>'+

  '<div class="bloco"><h2>Benefício</h2>'+
    '<div class="linha"><div class="campo2"><label>Nome do benefício no header</label>'+
      '<input type="text" id="fRotulo" value="'+esc(cfg.rotulo)+'" placeholder="Viagens"></div></div>'+
    '<label class="chave'+(cfg.prime!==false?' on':'')+'" id="chPrime"><i></i>'+
      '<span>Vender o RDC Prime neste protótipo</span></label>'+
    '<p class="dica" style="margin:8px 0 0">Desligado, somem o selo do header, a oferta Prime nos quartos e a conclusão de novo assinante.</p></div>'+

  '<div class="bloco"><h2>App próprio do cliente</h2>'+
    '<p class="dica">Para clientes que já têm app. O protótipo abre na home deles e o botão que você marcar inicia a navegação.</p>'+
    '<label class="chave'+(ap.ativo?' on':'')+'" id="chApp"><i></i><span>Começar pela tela do app do cliente</span></label>'+
    '<div id="areaApp" class="app-area'+(ap.imagem?' com-imagem':'')+(ap.ativo?'':' esconde')+'">'+
      '<div id="mapa" class="mapa'+(ap.imagem?'':' esconde')+'">'+
        '<img id="imgApp" src="'+esc(ap.imagem||'')+'" alt="">'+
        '<span class="alvo" id="alvo"></span></div>'+
      '<div class="lado">'+
        '<p class="dica so-com-img">Arraste sobre a imagem para marcar onde fica o botão '+
          'que abre as viagens. O retângulo azul é a área que o cliente vai tocar.</p>'+
        '<label class="solta" id="zonaApp">'+
          '<b class="so-sem-img">Clique ou arraste o print da home do app</b>'+
          '<b class="so-com-img">Trocar o print</b>'+
          '<small class="so-sem-img">PNG ou JPG da tela inicial do app do cliente</small>'+
          '<input type="file" id="fApp" accept="image/*"></label>'+
        '<button class="b mini perigo so-com-img" id="btTiraApp">Remover imagem</button>'+
      '</div>'+
    '</div></div>'+

  '<div class="bloco"><h2>QR code do link</h2>'+
    '<p class="dica">Para a apresentação, o e-mail ou o impresso: quem apontar a câmera '+
    'abre o protótipo do cliente. Ele acompanha o link acima.</p>'+
    '<div class="qr-linha">'+
      '<div class="qr-moldura"><canvas id="qrTela"></canvas></div>'+
      '<div class="qr-lado">'+
        '<code id="qrLink"></code>'+
        '<div class="rodape-acoes">'+
          '<button class="b" id="btQrPng">Baixar PNG</button>'+
          '<button class="b" id="btQrSvg">Baixar SVG</button>'+
        '</div>'+
        '<p class="dica" style="margin:0">O PNG sai grande, bom para slide e impresso. '+
        'O SVG não perde qualidade em nenhum tamanho.</p>'+
      '</div>'+
    '</div></div>'+

  '<div class="bloco"><h2>Imagem do protótipo</h2>'+
    '<p class="dica" id="mockDica">Aparelho montado com a marca do cliente, pronto para '+
    'proposta, e-mail e apresentação.</p>'+
    '<div class="mock-linha">'+
      '<div class="mock-caixa"><canvas id="mockTela"></canvas></div>'+
      '<div class="mock-lado">'+
        '<div class="rodape-acoes"><button class="b" id="btMockPng">Baixar PNG</button></div>'+
        '<p class="dica" style="margin:0">Fundo transparente, em tamanho grande — dá para '+
        'colocar em cima de qualquer cor de slide.</p>'+
      '</div>'+
    '</div></div>'+

  '<div class="bloco"><h2>Publicar</h2>'+
    '<p class="dica">É só salvar: o link entra no ar na hora, em '+
      '<code>'+esc(SITE)+'/<span id="vSlug2">'+esc(cfg.slug||'cliente')+'</span></code>.</p>'+
    '<div class="rodape-acoes">'+
      '<button class="b forte" id="btSalvar">Salvar protótipo</button>'+
      (idx===null?'':'<button class="b" id="btVerLink">Abrir link</button>')+
      (idx===null?'':'<button class="b perigo" id="btApagar">Excluir</button>')+
    '</div>'+
    '<div id="recado2" class="recado info esconde"></div></div>'+

  '</div><div class="previa"><div class="moldura"><iframe id="fr" title="Prévia"></iframe></div>'+
    '<p class="rot">Prévia ao vivo · o link do cliente mostra só o telefone</p></div></div>';

  ligarEditor();
  atualizarPrevia();
}

/* ---------- ligações da tela de edição ---------- */
function ligarEditor(){
  var $ = function(id){ return document.getElementById(id); };
  var slugTocado = !!rascunho.slug;

  function repintarTons(){
    var t = derivar(rascunho.cores.brand);
    $('tons').innerHTML =
      '<span class="tom"><i style="background:'+t.brand+'"></i>principal '+t.brand+'</span>'+
      '<span class="tom"><i style="background:'+t.dark+'"></i>escuro '+(rascunho.cores.brandDark||t.dark)+'</span>'+
      '<span class="tom"><i style="background:'+(rascunho.cores.brandLight||t.light)+'"></i>claro '+(rascunho.cores.brandLight||t.light)+'</span>'+
      '<span class="tom"><i style="background:'+(rascunho.cores.brandInk||t.ink)+'"></i>sobre a cor '+(rascunho.cores.brandInk||t.ink)+'</span>';
    $('fCorPicker').parentNode.style.background = rascunho.cores.brand;
    if(!rascunho.manual){ $('fDark').value=t.dark; $('fLight').value=t.light; $('fInk').value=t.ink; }
  }

  /* --- Cor do texto: automático por padrão, manual quando você quiser --- */
  function pintaTexto(){
    var caixa = $('textoOpcoes'); if(!caixa) return;
    var c = rascunho.cores;
    var brand = c.brand || '#0A66C2';
    var auto = melhorTexto(brand, c.paleta);
    var manual = !!c.textoManual;
    var usada = (manual && c.texto ? c.texto : auto.cor).toUpperCase();
    c.texto = usada;

    var opcoes = opcoesDeTexto(brand, c.paleta);
    if(!opcoes.some(function(o){ return o.cor === auto.cor; }))
      opcoes.unshift({ cor: auto.cor, nome: 'Sugerida', de: 'tom' });
    if(manual && !opcoes.some(function(o){ return o.cor === usada; }))
      opcoes.push({ cor: usada, nome: 'Sua cor', de: 'manual' });

    caixa.innerHTML = opcoes.map(function(o){
      var ligada = o.cor === usada;
      return '<button type="button" class="texto-op' + (ligada ? ' sel' : '') + '" data-cor="' + o.cor + '">' +
        '<i style="background:' + o.cor + '"></i><span>' +
        '<b>' + esc(o.nome) + (o.cor === auto.cor ? ' <em>recomendada</em>' : '') + '</b>' +
        '<small>' + o.cor + ' · ' + contraste(o.cor, '#FFFFFF').toFixed(1) + ':1</small>' +
        '</span></button>';
    }).join('') +
    '<button type="button" class="texto-op outra' + (manual ? ' sel' : '') + '" data-outra="1">' +
      '<i style="background:' + usada + '"></i><span><b>Outra cor</b><small>escolher à mão</small></span></button>' +
    '<p class="ajuda" style="margin:9px 0 0;width:100%">' + esc(
      auto.motivo === 'propria'
        ? 'A cor principal tem contraste suficiente, então a recomendada é ela mesma.'
        : auto.motivo === 'paleta'
          ? 'A cor principal não tem contraste para texto. A recomendada é ' + auto.cor + ', que veio do logo/site do cliente.'
          : 'A cor principal não tem contraste para texto e não achei outra na identidade do cliente. '
            + 'A recomendada é ' + auto.cor + ', a própria cor escurecida — escolha abaixo se preferir outra.'
    ) + '</p>';

    caixa.querySelectorAll('[data-cor]').forEach(function(b){
      b.onclick = function(){
        rascunho.cores.textoManual = (b.dataset.cor !== auto.cor);
        rascunho.cores.texto = b.dataset.cor;
        sincronizaTexto();
      };
    });
    caixa.querySelector('[data-outra]').onclick = function(){
      rascunho.cores.textoManual = true;
      if(!rascunho.cores.texto) rascunho.cores.texto = auto.cor;
      sincronizaTexto();
      $('fTexto').focus();
    };
    $('textoManual').classList.toggle('esconde', !manual);
    $('textoAmostra').style.background = usada;
    $('fTextoPicker').value = /^#[0-9a-f]{6}$/i.test(usada) ? usada : '#000000';
    if(document.activeElement !== $('fTexto')) $('fTexto').value = usada;
    pintaProva(usada);
  }
  function pintaProva(cor){
    var caixa = $('textoProva'); if(!caixa) return;
    var brand = rascunho.cores.brand || '#0A66C2';
    var t = derivar(brand, cor);
    var casos = [
      { nome: 'Texto da marca no branco', fundo: '#FFFFFF', frente: cor },
      { nome: 'Texto sobre a cor principal', fundo: brand, frente: t.ink },
      { nome: 'Texto comum no branco', fundo: '#FFFFFF', frente: '#171B21' }
    ];
    caixa.innerHTML = casos.map(function(k){
      var r = contraste(k.frente, k.fundo), ok = r >= 4.5;
      return '<span class="prova-item' + (ok ? ' ok' : ' nao') + '" style="background:' + k.fundo +
        ';color:' + k.frente + '">Viagens<small>' + (ok ? '✓ ' : '✕ ') + r.toFixed(1) + ':1</small></span>';
    }).join('') + '<p class="ajuda" style="margin:8px 0 0;width:100%">Mínimo legível: 4,5:1. ' +
      'Abaixo disso o protótipo ainda abre, mas o texto some em tela de celular.</p>';
  }
  function sincronizaTexto(){ pintaTexto(); atualizarPrevia(); pintaMock(); }

  function aplicarCor(txt, origem){
    var c = lerCor(txt);
    if(!c){ if(origem!=='digitando') aviso('Não reconheci essa cor. Use <code>#00AEEF</code> ou <code>0,174,239</code>.','ruim'); return false; }
    rascunho.cores.brand = c;
    $('fCorPicker').value = c;
    if(origem!=='campo') $('fCor').value = c;
    repintarTons(); pintaTexto(); atualizarPrevia(); pintaMock(); return true;
  }

  $('btVoltar').onclick = verGaleria;

  /* --- QR code do link, sempre igual ao apelido que está no campo --- */
  function linkAtual(){ return SITE + '/' + (rascunho.slug || 'cliente'); }
  function pintaQR(){
    var tela = $('qrTela'); if(!tela) return;
    var url = linkAtual();
    $('qrLink').textContent = url;
    try{ qrDesenha(tela, url, 6); }
    catch(e){ $('qrLink').textContent = 'Não consegui gerar: ' + e.message; }
  }
  pintaQR();
  $('btQrPng').onclick = function(){ qrBaixaPNG(linkAtual(), 'qr-' + (rascunho.slug||'cliente')); };

  /* --- imagem do protótipo, com um ou dois aparelhos --- */
  var mockPendente = null;
  function pintaMock(){
    var alvo = $('mockTela'); if(!alvo) return;
    clearTimeout(mockPendente);
    mockPendente = setTimeout(function(){
      montaMockup(rascunho, 1, function(c, doisAparelhos){
        var g = alvo.getContext('2d');
        alvo.width = c.width; alvo.height = c.height;
        g.clearRect(0,0,c.width,c.height);
        g.drawImage(c, 0, 0);
        $('mockDica').textContent = doisAparelhos
          ? 'Dois aparelhos: a home do app do cliente na frente e o portal com a marca atrás. PNG sem fundo, pronto para proposta, e-mail e apresentação.'
          : 'O portal com a marca do cliente. PNG sem fundo, pronto para proposta, e-mail e apresentação.';
      });
    }, 250);
  }
  pintaMock();
  $('btMockPng').onclick = function(){
    var bt = this, antes = bt.textContent;
    bt.textContent = 'Gerando…'; bt.disabled = true;
    montaMockup(rascunho, 2.4, function(c){          /* o dobro e meio, para impresso */
      baixa('mockup-' + (rascunho.slug || 'cliente') + '.png', c.toDataURL('image/png'));
      bt.textContent = antes; bt.disabled = false;
    });
  };
  $('btQrSvg').onclick = function(){ qrBaixaSVG(linkAtual(), 'qr-' + (rascunho.slug||'cliente')); };

  $('fNome').oninput = function(){
    rascunho.cliente = this.value;
    if(!slugTocado){ rascunho.slug = apelido(this.value); $('fSlug').value = rascunho.slug; }
    $('vSlug').textContent = rascunho.slug||'cliente'; $('vSlug2').textContent = rascunho.slug||'cliente';
    pintaQR();
    atualizarPrevia();
  };
  $('fSlug').oninput = function(){
    slugTocado = true; rascunho.slug = apelido(this.value); this.value = rascunho.slug;
    $('vSlug').textContent = rascunho.slug||'cliente'; $('vSlug2').textContent = rascunho.slug||'cliente';
    pintaQR();
  };
  $('fRotulo').oninput = function(){ rascunho.rotulo = this.value; atualizarPrevia(); pintaMock(); };


  pintaTexto();
  $('fTexto').oninput = function(){
    var c = lerCor(this.value); if(!c) return;
    rascunho.cores.textoManual = true; rascunho.cores.texto = c;
    $('textoAmostra').style.background = c; $('fTextoPicker').value = c;
    pintaProva(c); atualizarPrevia(); pintaMock();
  };
  $('fTexto').onchange = function(){ sincronizaTexto(); };
  $('fTextoPicker').oninput = function(){
    rascunho.cores.textoManual = true; rascunho.cores.texto = this.value.toUpperCase();
    $('fTexto').value = this.value.toUpperCase(); sincronizaTexto();
  };
  $('fCor').oninput  = function(){ aplicarCor(this.value,'digitando'); };
  $('fCor').onchange = function(){ aplicarCor(this.value,'campo'); };
  $('fCorPicker').oninput = function(){ aplicarCor(this.value,'seletor'); };

  $('chManual').onclick = function(){
    rascunho.manual = !rascunho.manual;
    this.classList.toggle('on', rascunho.manual);
    $('manual').classList.toggle('esconde', !rascunho.manual);
    if(!rascunho.manual){
      delete rascunho.cores.brandDark; delete rascunho.cores.brandLight; delete rascunho.cores.brandInk;
    }
    repintarTons(); atualizarPrevia();
  };
  [['fDark','brandDark'],['fLight','brandLight'],['fInk','brandInk']].forEach(function(par){
    $(par[0]).onchange = function(){
      var c = lerCor(this.value);
      if(c){ rascunho.cores[par[1]] = c; this.value = c; repintarTons(); atualizarPrevia(); }
      else aviso('Tom não reconhecido. Use HEX ou RGB.','ruim');
    };
  });

  $('chPrime').onclick = function(){
    rascunho.prime = rascunho.prime === false;
    this.classList.toggle('on', rascunho.prime); atualizarPrevia();
  };

  /* logo */
  function usarLogo(url, daBusca){
    if(daBusca && TEM_API){
      // guarda no servidor para todo mundo enxergar
      pedir('/api/arquivo', {method:'POST', body: JSON.stringify({nome:'logo', dados:url})})
        .then(function(d){ rascunho.logo = d.url; atualizarPrevia(); })
        .catch(function(){});
    }
    rascunho.logo = url;
    $('imgLogo').src = url; $('previaLogo').classList.remove('esconde');
    atualizarPrevia();
    pintaCoresDoLogo(url);
    pintaMock();
  }
  /* As cores que existem dentro do logo, para escolher com um clique —
     o mesmo caminho de quem busca pelo site, só que com o arquivo. */
  function pintaCoresDoLogo(url){
    var caixa = $('coresLogo'); if(!caixa) return;
    caixa.innerHTML = '<p class="dica" style="margin:0">Lendo as cores do logo…</p>';
    coresDoLogo(url, function(cores){
      rascunho.cores.paleta = cores.slice(0, 10);
      if(typeof pintaTexto === 'function') pintaTexto();
      if(!cores.length){
        caixa.innerHTML = '<p class="dica" style="margin:0">Não consegui ler cores deste arquivo. '+
          'Escolha a cor principal abaixo.</p>';
        return;
      }
      caixa.innerHTML = '<div class="cores-topo">Cores encontradas no logo '+
        '<span>clique para usar como cor principal</span></div>'+
        '<div class="cores-grade">'+
        cores.map(function(c){
          var sel = (c.toUpperCase() === String(rascunho.cores.brand||'').toUpperCase()) ? ' sel' : '';
          return '<button type="button" class="cor-achada'+sel+'" data-sug="'+c+'" title="Usar '+c+'">'+
                 '<i style="background:'+c+'"></i><span>'+c+'</span></button>';
        }).join('') + '</div>';
      caixa.querySelectorAll('[data-sug]').forEach(function(b){
        b.onclick = function(){
          aplicarCor(b.dataset.sug, 'sugestao');
          caixa.querySelectorAll('.cor-achada').forEach(function(o){ o.classList.remove('sel'); });
          b.classList.add('sel');
        };
      });
    });
  }
  window.TC_PINTA_CORES = pintaCoresDoLogo;

  function ligarSolta(zona, input, feito){
    zona.addEventListener('dragover', function(e){ e.preventDefault(); zona.classList.add('sobre'); });
    zona.addEventListener('dragleave', function(){ zona.classList.remove('sobre'); });
    zona.addEventListener('drop', function(e){
      e.preventDefault(); zona.classList.remove('sobre');
      var f = e.dataTransfer.files[0]; if(f) lerArquivo(f, feito);
    });
    input.onchange = function(){ if(this.files[0]) lerArquivo(this.files[0], feito); };
  }
  ligarSolta($('zonaLogo'), $('fLogo'), usarLogo);
  $('btCoresLogo').onclick = function(){ if(rascunho.logo) pintaCoresDoLogo(rascunho.logo); };
  if(rascunho.logo) pintaCoresDoLogo(rascunho.logo);
  $('btTiraLogo').onclick = function(){
    rascunho.logo = null; $('previaLogo').classList.add('esconde'); $('coresLogo').innerHTML='';
    pintaMock();
    atualizarPrevia();
  };

  /* app próprio */
  $('chApp').onclick = function(){
    rascunho.appProprio.ativo = !rascunho.appProprio.ativo;
    this.classList.toggle('on', rascunho.appProprio.ativo);
    $('areaApp').classList.toggle('esconde', !rascunho.appProprio.ativo);
    atualizarPrevia(); pintaMock();
  };
  ligarSolta($('zonaApp'), $('fApp'), function(url){
    rascunho.appProprio.imagem = url;
    $('imgApp').src = url;
    $('mapa').classList.remove('esconde');
    $('areaApp').classList.add('com-imagem');
    desenharAlvo(); atualizarPrevia(); pintaMock();
  });
  $('btTiraApp').onclick = function(){
    rascunho.appProprio.imagem = '';
    $('imgApp').removeAttribute('src');
    $('mapa').classList.add('esconde');
    $('areaApp').classList.remove('com-imagem');
    $('fApp').value = '';
    atualizarPrevia(); pintaMock();
  };
  function desenharAlvo(){
    var h = (rascunho.appProprio || {}).hotspot, a = $('alvo');
    if(!a || !h) return;
    a.style.cssText = 'left:'+h.x+'%;top:'+h.y+'%;width:'+h.w+'%;height:'+h.h+'%';
  }
  var mapa = $('mapa'), arrastando=false, ax=0, ay=0;
  if(mapa){
    desenharAlvo();
    mapa.addEventListener('pointerdown', function(e){
      e.preventDefault();
      var r = mapa.getBoundingClientRect();
      arrastando = true; ax = (e.clientX-r.left)/r.width*100; ay = (e.clientY-r.top)/r.height*100;
      mapa.setPointerCapture(e.pointerId);
    });
    mapa.addEventListener('pointermove', function(e){
      if(!arrastando) return;
      var r = mapa.getBoundingClientRect();
      var bx = (e.clientX-r.left)/r.width*100, by = (e.clientY-r.top)/r.height*100;
      var h = rascunho.appProprio.hotspot;
      h.x = Math.max(0, Math.min(ax,bx)); h.y = Math.max(0, Math.min(ay,by));
      h.w = Math.min(100-h.x, Math.abs(bx-ax)); h.h = Math.min(100-h.y, Math.abs(by-ay));
      desenharAlvo();
    });
    mapa.addEventListener('pointerup', function(){
      if(!arrastando) return;
      arrastando = false;
      var h = rascunho.appProprio.hotspot;
      if(h.w < 2 || h.h < 1){ h.w = Math.max(h.w,20); h.h = Math.max(h.h,5); desenharAlvo(); }
      ['x','y','w','h'].forEach(function(k){ h[k] = Math.round(h[k]*10)/10; });
      atualizarPrevia();
    });
  }

  /* publicar */
  $('btSalvar').onclick = function(){
    if(!rascunho.cliente.trim()){ aviso2('Dê um nome ao cliente antes de salvar.','ruim'); return; }
    if(!rascunho.slug) rascunho.slug = apelido(rascunho.cliente);
    var conflito = lista.some(function(p,i){ return p.slug===rascunho.slug && i!==editando; });
    if(conflito){ aviso2('Já existe um protótipo com o link <code>/'+esc(rascunho.slug)+'</code>. Mude o link.','ruim'); return; }
    var agora = Date.now();
    if(!rascunho.criadoEm) rascunho.criadoEm = agora;
    rascunho.atualizadoEm = agora;
    if(editando===null) lista.push(rascunho); else lista[editando] = rascunho;
    aviso2('Salvando…','info');
    gravar().then(verGaleria, function(){ aviso2('Não consegui salvar. Confira a conexão e tente de novo.','ruim'); });
  };
  if($('btVerLink')) $('btVerLink').onclick = function(){
    window.open(linkDe(rascunho), '_blank', 'noopener');
  };
  if($('btApagar')) $('btApagar').onclick = function(){
    if(this.dataset.c){ lista.splice(editando,1); gravar().then(verGaleria, verGaleria); return; }
    this.dataset.c='1'; this.textContent='Confirmar exclusão';
  };

  $('btBuscar').onclick = function(){ buscarMarca($('fSite').value, usarLogo, aplicarCor); };

  function aviso2(txt,tipo){
    var el=$('recado2'); el.className='recado '+(tipo||'info'); el.innerHTML=txt; el.classList.remove('esconde');
  }
}

/* ---------- captura pelo site: mostra as opções e você escolhe ---------- */
var fundoEscuro = false;
function pintarAchados(logos, usarLogo){
  var el = document.getElementById('achadosLogo');
  if(!el) return;
  if(!logos || !logos.length){ el.innerHTML = ''; return; }
  el.innerHTML =
    '<div class="achados-topo"><b>'+logos.length+' logo'+(logos.length>1?'s':'')+' encontrado'+
      (logos.length>1?'s':'')+'</b>'+
      '<button class="b mini" id="btFundo">'+(fundoEscuro?'Ver em fundo claro':'Ver em fundo escuro')+'</button></div>'+
    '<div class="achados'+(fundoEscuro?' escuro':'')+'">'+
      logos.map(function(l,i){
        return '<button class="achado" data-logo="'+i+'" title="'+esc(l.origem)+'">'+
          '<img src="'+esc(l.url)+'" alt="" loading="lazy">'+
          '<span>'+esc(l.origem)+'</span></button>';
      }).join('')+
    '</div>';
  document.getElementById('btFundo').onclick = function(){
    fundoEscuro = !fundoEscuro; pintarAchados(logos, usarLogo);
  };
  el.querySelectorAll('[data-logo]').forEach(function(b){
    b.onclick = function(){
      var l = logos[+b.dataset.logo];
      b.classList.add('pegando');
      aviso('Baixando o logo escolhido…','info');
      fetch('/api/brand?pegar=' + encodeURIComponent(l.url))
        .then(function(r){ return r.json(); })
        .then(function(d){
          b.classList.remove('pegando');
          if(!d.dados) throw new Error(d.erro || 'falhou');
          usarLogo(d.dados, true);
          el.querySelectorAll('.achado').forEach(function(x){ x.classList.remove('sel'); });
          b.classList.add('sel');
          aviso('Logo aplicado. As cores dele aparecem logo abaixo.','bom');
        })
        .catch(function(){ b.classList.remove('pegando');
          aviso('Não consegui baixar esse logo. Tente outro da lista.','ruim'); });
    };
  });
}
function buscarMarca(url, usarLogo, aplicarCor){
  if(!url || !/\./.test(url)){ aviso('Digite o endereço do site, por exemplo <code>brb.com.br</code>.','ruim'); return; }
  var bt = document.getElementById('btBuscar');
  bt.textContent = 'Procurando…'; bt.disabled = true;
  aviso('Procurando logos em '+esc(url.replace(/^https?:\/\//,''))+'…','info');
  fetch('/api/brand?url=' + encodeURIComponent(url))
    .then(function(r){ return r.json().then(function(d){ if(!r.ok) throw new Error(d.erro||'http'); return d; }); })
    .then(function(d){
      bt.textContent = 'Buscar logos'; bt.disabled = false;
      if(d.cor) aplicarCor(d.cor,'site');
      pintarAchados(d.logos, usarLogo);
      if(!d.logos || !d.logos.length){
        aviso('O site respondeu, mas não achei nenhum logo. Envie o arquivo abaixo.','info');
      } else {
        aviso('Escolha um dos logos acima'+(d.cor ? '. A cor declarada pelo site ('+d.cor+') já foi aplicada.' : '.'),'bom');
      }
    })
    .catch(function(e){
      bt.textContent = 'Buscar logos'; bt.disabled = false;
      aviso(window.TC_INLINE
        ? 'A busca precisa da versão publicada — ela roda no servidor. <b>Envie o logo abaixo</b>.'
        : 'Não consegui ler esse site ('+esc(e.message)+'). <b>Envie o logo abaixo</b> — eu tiro as cores dele.', 'info');
    });
}

/* ---------- protótipos que já estão publicados no site ---------- */
function sementes(){
  var noSite = !window.TC_INLINE;   // fora do pacote, os arquivos do site existem
  return [
    { slug:'padrao', cliente:'Padrão Travel Cloud', rotulo:'Viagens', logo:null, prime:true,
      padrao:true, cores:{brand:'#001489'}, publicado:true,
      appProprio:{ativo:false, imagem:null, hotspot:{x:3,y:36,w:94,h:7}} },
    { slug:'brb', cliente:'BRB', rotulo:'Viagens', logo: noSite ? '/brb/logo.png' : null,
      prime:true, cores:{brand:'#00AEEF'}, publicado:true,
      appProprio:{ativo:!!noSite, imagem: noSite ? '/brb/app-home.jpg' : null,
                  hotspot:{x:2.4,y:35.8,w:95,h:6.4}} },
    { slug:'alelo', cliente:'Alelo', rotulo:'Viagens', logo:null, prime:true,
      cores:{brand:'#00A859'}, publicado:true,
      appProprio:{ativo:false, imagem:null, hotspot:{x:3,y:36,w:94,h:7}} }
  ];
}

/* ---------- início ---------- */
function iniciar(){
  if(TEM_API && !sessao.token) return verLogin();
  app.innerHTML = '<div class="carregando">Carregando…</div>';
  carregar().then(function(l){
    lista = l;
    if(!lista.length){            // primeira vez: já entra com o que está no ar
      lista = sementes();
      return gravar().then(verGaleria, verGaleria);
    }
    verGaleria();
  }).catch(function(e){
    if(e && e.status === 401){ limparSessao(); return verLogin('Sua sessão expirou. Entre de novo.'); }
    verLogin('Não consegui falar com o servidor. Tente de novo.');
  });
}
iniciar();
})();
