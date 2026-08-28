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
function derivar(brand){
  var rgb=hex2rgb(brand), hsl=rgb2hsl(rgb);
  return {
    brand: brand.toUpperCase(),
    dark : rgb2hex(hsl2rgb([hsl[0], Math.min(1,hsl[1]*1.05), Math.max(.12, hsl[2]-0.13)])),
    light: rgb2hex(hsl2rgb([hsl[0], Math.min(.85,Math.max(.25,hsl[1]*0.75)), 0.945])),
    ink  : lum(rgb) > 0.55 ? '#14202B' : '#FFFFFF'
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
      for(var j=0;j<arr.length && saida.length<6;j++){
        var hsl = rgb2hsl(hex2rgb(arr[j].cor));
        /* agrupa por matiz, mas em cinza o matiz não diz nada: aí separa por tom */
        var faixa = hsl[1] < 0.18 ? 'c'+Math.round(hsl[2]*6) : 'm'+Math.round(hsl[0]/25);
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
function telaPortal(g, x, y, w, h, cfg, logo, hero, rdc){
  var t = derivar(cfg.cores.brand);
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
  g.textAlign = 'right';
  g.fillText('▮▮▮ ▲ ▮', x + w - 16*k, y + hSis/2 + 2*k);
  g.textAlign = 'left';

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
    g.strokeStyle = cfg.cores.brand; g.lineWidth = 1.5*k;
    caminhoArredondado(g, cx, meio-lh/2, lw, lh, 7*k); g.stroke();
    g.fillStyle = cfg.cores.brand;
    g.font = '700 ' + (7*k) + 'px Inter, sans-serif';
    g.textAlign = 'center';
    g.fillText('seu logo aqui', cx + lw/2, meio);
    g.textAlign = 'left';
    cx += lw + 12*k;
  }
  g.fillStyle = '#E9EDF2';
  g.fillRect(cx, meio - 11*k, 1*k, 22*k);
  cx += 12*k;
  g.fillStyle = cfg.cores.brand;
  g.font = '600 ' + (16.5*k) + 'px Inter, system-ui, sans-serif';
  g.fillText(cfg.rotulo || 'Viagens', cx, meio + 1*k);

  var raio = 14.5*k, ax = x + w - 16*k - raio;
  g.fillStyle = '#F5F7FA'; g.beginPath(); g.arc(ax, meio, raio, 0, 7); g.fill();
  g.strokeStyle = '#E9EDF2'; g.lineWidth = 1*k; g.stroke();
  g.strokeStyle = '#626C78'; g.lineWidth = 1.6*k;
  g.beginPath(); g.arc(ax, meio - 3*k, 4.2*k, 0, 7); g.stroke();
  g.beginPath(); g.arc(ax, meio + 9*k, 8*k, Math.PI*1.15, Math.PI*1.85); g.stroke();

  /* faixa da marca com a busca */
  var yBusca = yCab + hCab, hBusca = 70*k;
  g.fillStyle = cfg.cores.brand; g.fillRect(x, yBusca, w, hBusca);
  var px = x + 16*k, pw = w - 32*k, ph = 46*k, py = yBusca + (hBusca - ph)/2;
  g.fillStyle = '#FFFFFF'; caminhoArredondado(g, px, py, pw, ph, ph/2); g.fill();
  g.strokeStyle = '#8B95A2'; g.lineWidth = 2*k;
  g.beginPath(); g.arc(px + 26*k, py + ph/2, 7*k, 0, 7); g.stroke();
  g.beginPath(); g.moveTo(px + 31*k, py + ph/2 + 5*k); g.lineTo(px + 36*k, py + ph/2 + 10*k); g.stroke();
  g.fillStyle = '#8B95A2';
  g.font = '500 ' + (13.5*k) + 'px Inter, system-ui, sans-serif';
  g.fillText('Buscar Hospedagens', px + 48*k, py + ph/2 + 1*k);

  /* foto com a chamada */
  var yFoto = yBusca + hBusca, hRodape = 86*k;
  var hFoto = (y + h) - yFoto - hRodape;
  if(hero){
    var escala = Math.max(w / hero.width, hFoto / hero.height);
    var lw2 = hero.width*escala, lh2 = hero.height*escala;
    g.drawImage(hero, x + (w-lw2)/2, yFoto + (hFoto-lh2)/2, lw2, lh2);
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

  /* rodapé */
  var yR = y + h - hRodape;
  g.fillStyle = '#F5F7FA'; g.fillRect(x, yR, w, hRodape);
  g.strokeStyle = '#E9EDF2'; g.lineWidth = 1*k;
  g.beginPath(); g.moveTo(x, yR); g.lineTo(x+w, yR); g.stroke();
  g.fillStyle = '#8B95A2';
  g.font = '400 ' + (10.5*k) + 'px Inter, system-ui, sans-serif';
  g.fillText('© 2026 RDC Viagens.', x + 16*k, yR + 20*k);
  g.fillText('Todos os direitos reservados.', x + 16*k, yR + 34*k);
  g.fillStyle = '#626C78';
  g.font = '400 ' + (10.5*k) + 'px Inter, system-ui, sans-serif';
  g.fillText('Política de Privacidade', x + 16*k, yR + 58*k);
  g.textAlign = 'right';
  g.fillStyle = '#8B95A2';
  g.fillText('Tecnologia e operação', x + w - 16*k, yR + 20*k);
  g.fillText('turística por', x + w - 16*k, yR + 34*k);
  if(rdc){
    var rh = 26*k, rw = rdc.width * (rh/rdc.height);
    g.drawImage(rdc, x + w - 16*k - rw, yR + 42*k, rw, rh);
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
  Promise.all([
    carregaImagem(cfg.logo || null),
    carregaImagem(MOCK_HERO),
    carregaImagem(MOCK_RDC),
    comApp ? carregaImagem(cfg.appProprio.imagem) : Promise.resolve(null)
  ]).then(function(r){
    var logo = r[0], hero = r[1], rdc = r[2], app = r[3];
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
          telaPortal(g, x, y, w, h, cfg, logo, hero, rdc);
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
        telaPortal(g, x, y, w, h, cfg, logo, hero, rdc);
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
    cabeca = '<link rel="stylesheet" href="/assets/tc.css?v=18">';
    corpo  = '<scr'+'ipt>window.TC='+JSON.stringify(tc)+';</scr'+'ipt>'+
             '<scr'+'ipt src="/assets/tc.js?v=18"></scr'+'ipt>';
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
  var cartoes = lista.length ? lista.map(function(p,i){
    var t = derivar(p.cores.brand);
    var capa = p.logo
      ? '<img src="'+esc(p.logo)+'" alt="'+esc(p.cliente)+'">'
      : '<b>'+esc(p.cliente)+'</b>';
    return '<div class="proto">'+
      '<div class="capa" style="background:'+(p.logo?'#fff':'linear-gradient(120deg,'+p.cores.brand+','+t.dark+')')+'">'+capa+'</div>'+
      '<div class="corpo"><h3>'+esc(p.cliente)+'</h3>'+
        '<div class="meta"><span class="pt" style="background:'+p.cores.brand+'"></span>'+
          esc(p.cores.brand)+' · /'+esc(p.slug)+'</div>'+
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
  }).join('') : '';

  app.innerHTML =
   '<div class="topo"><div><h1>Protótipos por cliente</h1>'+
     '<p class="sub">Cada protótipo vira um link com a marca do cliente. Salvou, está no ar — '+
     'é só copiar o link e apresentar.</p></div>'+
     '<div class="rodape-acoes">'+
       (TEM_API ? '<button class="b" id="btEmails">Quem pode entrar</button>'+
                  '<button class="b" id="btSair">Sair</button>' : '')+
       '<button class="b forte" id="btNovo">+ Novo protótipo</button></div></div>'+
   (lista.length
     ? '<div class="grade">'+cartoes+'</div>'
     : '<div class="vazio">Nenhum protótipo ainda.<br>Comece pelo <b>+ Novo protótipo</b> — leva menos de um minuto.</div>')+
   (somenteLeitura ? '<div class="recado ruim" style="margin-bottom:18px">'+
      '<b>O armazenamento do projeto está indisponível.</b> Você está vendo os protótipos '+
      'que já estavam no ar e <b>não é possível salvar</b> agora — nada foi perdido. '+
      'Alguém do time precisa conferir o Blob do projeto na Vercel.</div>' : '')+
   (TEM_API ? '<p class="assinado">Você entrou como <b>'+esc(sessao.email)+'</b>. '+
      'Tudo o que você salvar aqui aparece para todo mundo do time.</p>' : '');

  document.getElementById('btNovo').onclick = function(){ verEditor(novoModelo(), null); };
  if(document.getElementById('btEmails')) document.getElementById('btEmails').onclick = verEmails;
  if(document.getElementById('btSair')) document.getElementById('btSair').onclick = function(){
    limparSessao(); lista = []; verLogin();
  };
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
        '<span class="tom"><i style="background:'+t.ink+'"></i>texto '+t.ink+'</span>'+
      '</div>'+
      '<label class="chave'+(cfg.manual?' on':'')+'" id="chManual" style="margin-top:14px">'+
        '<i></i><span>Ajustar os tons à mão</span></label>'+
      '<div class="linha '+(cfg.manual?'':'esconde')+'" id="manual">'+
        '<div class="campo2"><label>Tom escuro</label><input type="text" id="fDark" value="'+(cfg.cores.brandDark||t.dark)+'"></div>'+
        '<div class="campo2"><label>Tom claro</label><input type="text" id="fLight" value="'+(cfg.cores.brandLight||t.light)+'"></div>'+
        '<div class="campo2"><label>Texto sobre a cor</label><input type="text" id="fInk" value="'+(cfg.cores.brandInk||t.ink)+'"></div>'+
      '</div>'+
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
      '<span class="tom"><i style="background:'+(rascunho.cores.brandInk||t.ink)+'"></i>texto '+(rascunho.cores.brandInk||t.ink)+'</span>';
    document.querySelector('.cor-amostra').style.background = rascunho.cores.brand;
    if(!rascunho.manual){ $('fDark').value=t.dark; $('fLight').value=t.light; $('fInk').value=t.ink; }
  }
  function aplicarCor(txt, origem){
    var c = lerCor(txt);
    if(!c){ if(origem!=='digitando') aviso('Não reconheci essa cor. Use <code>#00AEEF</code> ou <code>0,174,239</code>.','ruim'); return false; }
    rascunho.cores.brand = c;
    $('fCorPicker').value = c;
    if(origem!=='campo') $('fCor').value = c;
    repintarTons(); atualizarPrevia(); pintaMock(); return true;
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
    var h = rascunho.appProprio.hotspot, a = $('alvo');
    if(!a) return;
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
