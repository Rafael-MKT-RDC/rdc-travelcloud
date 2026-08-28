/* ============================================================
   Travel Cloud — Editor de protótipos por cliente
   Uso interno: o gerente cria, edita e exclui protótipos.
   ============================================================ */
(function(){
'use strict';
var CHAVE = 'tc_prototipos_v1';
var app = document.getElementById('app');
var lista = [], editando = null, rascunho = null;

/* ---------- armazenamento ---------- */
function carregar(){
  try{ var b = localStorage.getItem(CHAVE); return b ? JSON.parse(b) : []; }
  catch(e){ return []; }
}
function gravar(){
  try{ localStorage.setItem(CHAVE, JSON.stringify(lista)); }
  catch(e){ aviso('Não consegui gravar no navegador. O trabalho desta sessão continua, mas não será lembrado.','ruim'); }
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
    var arr = Object.keys(caixas).map(function(k){ var q=caixas[k];
      return {peso:q.n*(0.55+q.s), cor:rgb2hex([q.r/q.n,q.g/q.n,q.b/q.n])}; });
    arr.sort(function(a,b){return b.peso-a.peso});
    var vistos = {}, saida = [];
    for(var j=0;j<arr.length && saida.length<4;j++){
      var hh = rgb2hsl(hex2rgb(arr[j].cor))[0], faixa = Math.round(hh/25);
      if(vistos[faixa]) continue; vistos[faixa]=1; saida.push(arr[j].cor);
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
  fr.onload = function(){ feito(fr.result); };
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
    cabeca = '<link rel="stylesheet" href="../assets/tc.css">';
    corpo  = '<scr'+'ipt>window.TC='+JSON.stringify(tc)+';</scr'+'ipt>'+
             '<scr'+'ipt src="../assets/tc.js"></scr'+'ipt>';
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

/* ---------- arquivo do cliente ---------- */
function arquivoCliente(cfg){
  var tons = derivar(cfg.cores.brand);
  var c = ['  cliente : '+JSON.stringify(cfg.cliente),
           '  rotulo  : '+JSON.stringify(cfg.rotulo),
           '  logo    : '+(cfg.logo? JSON.stringify(cfg.logo) : 'null'),
           '  prime   : '+(cfg.prime!==false)];
  var cores = ['    brand : '+JSON.stringify(cfg.cores.brand)];
  if(cfg.manual){
    cores.push('    brandDark : '+JSON.stringify(cfg.cores.brandDark || tons.dark));
    cores.push('    brandLight: '+JSON.stringify(cfg.cores.brandLight || tons.light));
    cores.push('    brandInk  : '+JSON.stringify(cfg.cores.brandInk || tons.ink));
  }
  var ap = cfg.appProprio||{};
  var app = ap.ativo
    ? '  appProprio: {\n    ativo   : true,\n    imagem  : '+JSON.stringify(ap.imagem||'')+',\n    hotspot : '+
      JSON.stringify(ap.hotspot)+'\n  }'
    : '  appProprio: { ativo: false }';
  return '<!DOCTYPE html>\n<html lang="pt-BR">\n<head>\n<meta charset="UTF-8">\n'+
  '<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">\n'+
  '<meta name="theme-color" content="'+cfg.cores.brand+'">\n'+
  '<title>'+esc(cfg.cliente)+' · '+esc(cfg.rotulo)+'</title>\n'+
  '<link rel="preconnect" href="https://fonts.googleapis.com">\n'+
  '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'+
  '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">\n'+
  '<link rel="stylesheet" href="../assets/tc.css">\n</head>\n<body>\n'+
  '<div class="phone"><div class="vp" id="vp"></div></div>\n\n'+
  '<!-- bloco gerado pelo editor -->\n<script>\nwindow.TC = {\n'+
  c.join(',\n')+',\n\n  cores: {\n'+cores.join(',\n')+'\n  },\n\n'+app+'\n};\n</'+'script>\n\n'+
  '<script src="../assets/tc.js"></'+'script>\n</body>\n</html>\n';
}
function baixarDireto(nome, txt){
  try{
    var b = new Blob([txt], {type:'text/html;charset=utf-8'});
    var a = document.createElement('a');
    a.href = URL.createObjectURL(b); a.download = nome;
    document.body.appendChild(a); a.click();
    setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); }, 1500);
    return true;
  }catch(e){ return false; }
}
// Publicado como Artifact o download passa pela permissão do visualizador;
// no site em Vercel/arquivo local vai direto pelo navegador.
function salvarArquivo(nome, txt, feito){
  function direto(){ feito(baixarDireto(nome, txt) ? 'direto' : 'falhou'); }
  if(window.claude && typeof window.claude.use === 'function'){
    window.claude.use('downloads').then(function(d){
      if(!d) return direto();
      d.save({filename:nome, data:txt}).then(
        function(){ feito('salvo'); },
        function(e){ feito(e && e.code==='declined' ? 'recusado' : 'falhou'); });
    }, direto);
  } else direto();
}

/* ============================================================
   TELA 1 — GALERIA
   ============================================================ */
function verGaleria(){
  editando = null; rascunho = null;
  var cartoes = lista.length ? lista.map(function(p,i){
    var t = derivar(p.cores.brand);
    var capa = p.logo
      ? '<img src="'+esc(p.logo)+'" alt="">'
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
        '</div></div>'+
      '<div class="acoes">'+
        '<button class="b mini" data-abrir="'+i+'">Abrir</button>'+
        '<button class="b mini" data-editar="'+i+'">Editar</button>'+
        '<button class="b mini" data-copiar="'+i+'">Duplicar</button>'+
        '<button class="b mini perigo" data-excluir="'+i+'">Excluir</button>'+
      '</div></div>';
  }).join('') : '';

  app.innerHTML =
   '<div class="topo"><div><h1>Protótipos por cliente</h1>'+
     '<p class="sub">Cada protótipo vira um link com a marca do cliente. Crie um novo, ajuste a qualquer momento '+
     'e gere o arquivo para publicar.</p></div>'+
     '<button class="b forte" id="btNovo">+ Novo protótipo</button></div>'+
   (lista.length
     ? '<div class="grade">'+cartoes+'</div>'
     : '<div class="vazio">Nenhum protótipo ainda.<br>Comece pelo <b>+ Novo protótipo</b> — leva menos de um minuto.</div>');

  document.getElementById('btNovo').onclick = function(){ verEditor(novoModelo(), null); };
  app.querySelectorAll('[data-editar]').forEach(function(b){
    b.onclick = function(){ var i=+b.dataset.editar; verEditor(JSON.parse(JSON.stringify(lista[i])), i); };
  });
  app.querySelectorAll('[data-abrir]').forEach(function(b){
    b.onclick = function(){ abrirPrevia(lista[+b.dataset.abrir]); };
  });
  app.querySelectorAll('[data-copiar]').forEach(function(b){
    b.onclick = function(){
      var c = JSON.parse(JSON.stringify(lista[+b.dataset.copiar]));
      c.cliente += ' (cópia)'; c.slug = apelido(c.cliente);
      lista.push(c); gravar(); verGaleria();
    };
  });
  app.querySelectorAll('[data-excluir]').forEach(function(b){
    b.onclick = function(){
      var i = +b.dataset.excluir;
      if(b.dataset.confirmando){ lista.splice(i,1); gravar(); verGaleria(); return; }
      b.dataset.confirmando = '1'; b.textContent = 'Confirmar exclusão';
      setTimeout(function(){ if(b.isConnected){ delete b.dataset.confirmando; b.textContent='Excluir'; } }, 4000);
    };
  });
}

function abrirPrevia(cfg){
  var d = document.createElement('div');
  d.style.cssText='position:fixed;inset:0;z-index:99;background:rgba(10,14,22,.72);display:flex;'+
    'align-items:center;justify-content:center;padding:20px;flex-direction:column;gap:14px';
  d.innerHTML = '<iframe style="width:392px;max-width:100%;height:min(812px,84vh);border:0;border-radius:30px;background:#fff"></iframe>'+
    '<button class="b" style="background:#fff;color:#171B21">Fechar</button>';
  d.querySelector('iframe').srcdoc = montarDoc(cfg);
  d.querySelector('button').onclick = function(){ d.remove(); };
  d.onclick = function(e){ if(e.target===d) d.remove(); };
  document.body.appendChild(d);
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
        '<div class="ajuda">Fica <code>seusite.com/<span id="vSlug">'+esc(cfg.slug||'cliente')+'</span></code></div></div>'+
    '</div></div>'+

  '<div class="bloco"><h2>Marca</h2>'+
    '<p class="dica">Comece pelo site do cliente. Se a captura não trouxer o que você quer, envie o logo e ajuste a cor à mão.</p>'+
    '<div class="campo2"><label>Site do cliente</label>'+
      '<div class="juntos"><input type="url" id="fSite" placeholder="https://www.brb.com.br">'+
      '<button class="b" id="btBuscar">Buscar marca</button></div></div>'+
    '<div class="campo2"><label>Logo</label>'+
      '<label class="solta" id="zonaLogo">Clique ou arraste o arquivo do logo aqui<br>'+
        '<small>PNG com fundo transparente ou SVG</small>'+
        '<input type="file" id="fLogo" accept="image/*"></label>'+
      '<div class="previa-logo'+(cfg.logo?'':' esconde')+'" id="previaLogo">'+
        '<div class="cx"><img id="imgLogo" src="'+esc(cfg.logo||'')+'" alt=""></div>'+
        '<button class="b mini" id="btCoresLogo">Extrair cores do logo</button>'+
        '<button class="b mini perigo" id="btTiraLogo">Remover</button></div>'+
      '<div id="sugestoes" class="tons"></div></div>'+
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
    '<div id="areaApp" class="'+(ap.ativo?'':'esconde')+'">'+
      '<label class="solta" id="zonaApp" style="margin-top:14px">Clique ou arraste o print da home do app'+
        '<input type="file" id="fApp" accept="image/*"></label>'+
      '<div id="mapaBox" class="'+(ap.imagem?'':'esconde')+'">'+
        '<p class="dica" style="margin:14px 0 0">Arraste sobre a imagem para marcar onde fica o botão que abre as viagens.</p>'+
        '<div class="mapa" id="mapa"><img id="imgApp" src="'+esc(ap.imagem||'')+'" alt="">'+
        '<span class="alvo" id="alvo"></span></div></div>'+
    '</div></div>'+

  '<div class="bloco"><h2>Publicar</h2>'+
    '<p class="dica">Salve para guardar na galeria. Gere o arquivo para levar o cliente ao ar em '+
      '<code>seusite.com/<span id="vSlug2">'+esc(cfg.slug||'cliente')+'</span></code>.</p>'+
    '<div class="rodape-acoes">'+
      '<button class="b forte" id="btSalvar">Salvar protótipo</button>'+
      '<button class="b" id="btArquivo">Gerar index.html</button>'+
      '<button class="b" id="btCopiar">Copiar código</button>'+
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
    repintarTons(); atualizarPrevia(); return true;
  }

  $('btVoltar').onclick = verGaleria;

  $('fNome').oninput = function(){
    rascunho.cliente = this.value;
    if(!slugTocado){ rascunho.slug = apelido(this.value); $('fSlug').value = rascunho.slug; }
    $('vSlug').textContent = rascunho.slug||'cliente'; $('vSlug2').textContent = rascunho.slug||'cliente';
    atualizarPrevia();
  };
  $('fSlug').oninput = function(){
    slugTocado = true; rascunho.slug = apelido(this.value); this.value = rascunho.slug;
    $('vSlug').textContent = rascunho.slug||'cliente'; $('vSlug2').textContent = rascunho.slug||'cliente';
  };
  $('fRotulo').oninput = function(){ rascunho.rotulo = this.value; atualizarPrevia(); };

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
  function usarLogo(url){
    rascunho.logo = url;
    $('imgLogo').src = url; $('previaLogo').classList.remove('esconde');
    atualizarPrevia();
    coresDoLogo(url, function(cores){
      if(!cores.length){ $('sugestoes').innerHTML=''; return; }
      $('sugestoes').innerHTML = '<span class="tom" style="background:none;padding-left:0">Cores do logo:</span>'+
        cores.map(function(c){ return '<button class="tom" data-sug="'+c+'" style="cursor:pointer;border:0">'+
          '<i style="background:'+c+'"></i>'+c+'</button>'; }).join('');
      $('sugestoes').querySelectorAll('[data-sug]').forEach(function(b){
        b.onclick = function(){ aplicarCor(b.dataset.sug,'sugestao'); };
      });
    });
  }
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
  $('btCoresLogo').onclick = function(){ if(rascunho.logo) usarLogo(rascunho.logo); };
  $('btTiraLogo').onclick = function(){
    rascunho.logo = null; $('previaLogo').classList.add('esconde'); $('sugestoes').innerHTML='';
    atualizarPrevia();
  };

  /* app próprio */
  $('chApp').onclick = function(){
    rascunho.appProprio.ativo = !rascunho.appProprio.ativo;
    this.classList.toggle('on', rascunho.appProprio.ativo);
    $('areaApp').classList.toggle('esconde', !rascunho.appProprio.ativo);
    atualizarPrevia();
  };
  ligarSolta($('zonaApp'), $('fApp'), function(url){
    rascunho.appProprio.imagem = url;
    $('imgApp').src = url; $('mapaBox').classList.remove('esconde');
    desenharAlvo(); atualizarPrevia();
  });
  function desenharAlvo(){
    var h = rascunho.appProprio.hotspot, a = $('alvo');
    if(!a) return;
    a.style.cssText = 'left:'+h.x+'%;top:'+h.y+'%;width:'+h.w+'%;height:'+h.h+'%';
  }
  var mapa = $('mapa'), arrastando=false, ax=0, ay=0;
  if(mapa){
    desenharAlvo();
    mapa.addEventListener('pointerdown', function(e){
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
    gravar(); verGaleria();
  };
  $('btArquivo').onclick = function(){
    var pasta = rascunho.slug || 'cliente';
    aviso2('Preparando o arquivo…','info');
    salvarArquivo(pasta+'-index.html', arquivoCliente(rascunho), function(r){
      if(r==='salvo' || r==='direto')
        aviso2('Arquivo pronto. Crie a pasta <code>'+esc(pasta)+'/</code> dentro de <code>travelcloud/</code> e '+
               'renomeie para <code>index.html</code>. O logo já vai embutido — é um arquivo só.','bom');
      else if(r==='recusado') aviso2('Download cancelado.','info');
      else aviso2('Não consegui entregar o arquivo aqui. Use <b>Copiar código</b> e cole num <code>index.html</code>.','ruim');
    });
  };
  $('btCopiar').onclick = function(){
    var txt = arquivoCliente(rascunho);
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(txt).then(
        function(){ aviso2('Código copiado. Cole num arquivo <code>index.html</code> dentro da pasta do cliente.','bom'); },
        function(){ mostrarCodigo(txt); });
    } else mostrarCodigo(txt);
  };
  if($('btApagar')) $('btApagar').onclick = function(){
    if(this.dataset.c){ lista.splice(editando,1); gravar(); verGaleria(); return; }
    this.dataset.c='1'; this.textContent='Confirmar exclusão';
  };

  $('btBuscar').onclick = function(){ buscarMarca($('fSite').value, usarLogo, aplicarCor); };

  function aviso2(txt,tipo){
    var el=$('recado2'); el.className='recado '+(tipo||'info'); el.innerHTML=txt; el.classList.remove('esconde');
  }
  function mostrarCodigo(txt){
    var ta=document.createElement('textarea');
    ta.value=txt; ta.style.cssText='width:100%;height:180px;margin-top:12px;font-size:11px;border-radius:8px';
    $('recado2').className='recado info'; $('recado2').textContent='Selecione tudo e copie:';
    $('recado2').classList.remove('esconde'); $('recado2').appendChild(ta); ta.select();
  }
}

/* ---------- captura pelo site ---------- */
function buscarMarca(url, usarLogo, aplicarCor){
  if(!url || !/\./.test(url)){ aviso('Digite o endereço do site, por exemplo <code>brb.com.br</code>.','ruim'); return; }
  if(!/^https?:/i.test(url)) url = 'https://' + url;
  aviso('Procurando logo e cores em '+esc(url)+'…','info');
  fetch('/api/brand?url=' + encodeURIComponent(url))
    .then(function(r){ if(!r.ok) throw new Error('http'); return r.json(); })
    .then(function(d){
      var achou = [];
      if(d.logo){ usarLogo(d.logo); achou.push('logo'); }
      if(d.cor){ aplicarCor(d.cor,'site'); achou.push('cor '+d.cor); }
      aviso(achou.length
        ? 'Encontrei: '+achou.join(' e ')+'. Confira e ajuste se precisar.'
        : 'O site respondeu, mas não achei logo nem cor declarada. Envie o logo abaixo.', achou.length?'bom':'info');
    })
    .catch(function(){
      aviso('A captura automática precisa da versão publicada (ela roda no servidor, porque o navegador '+
            'não consegue ler o site de outra empresa direto). <b>Envie o logo abaixo</b> — eu extraio as cores dele.','info');
    });
}

/* ---------- início ---------- */
lista = carregar();
verGaleria();
})();
