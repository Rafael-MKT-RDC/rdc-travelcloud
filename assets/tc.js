/* ============================================================
   TRAVEL CLOUD — MOTOR DO PROTÓTIPO WHITE-LABEL
   O arquivo do cliente só define window.TC (nome, logo, cor).
   Tudo abaixo é igual para todos os clientes.
   ============================================================ */
(function(){
'use strict';
var C = window.TC || {};
C.cliente = C.cliente || 'Sua Marca';
C.rotulo  = C.rotulo  || 'Viagens';
C.prime   = C.prime !== false;

/* ---------- 1. TEMA: uma cor gera a paleta inteira ---------- */
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

function derivar(brand){
  var rgb=hex2rgb(brand), hsl=rgb2hsl(rgb);
  return {
    brand: brand.toUpperCase(),
    dark : rgb2hex(hsl2rgb([hsl[0], Math.min(1,hsl[1]*1.05), Math.max(.12, hsl[2]-0.13)])),
    light: rgb2hex(hsl2rgb([hsl[0], Math.min(.85,Math.max(.25,hsl[1]*0.75)), 0.945])),
    ink  : lum(rgb) > 0.55 ? '#14202B' : '#FFFFFF'
  };
}
C.cores = C.cores || {};
var P = derivar(C.cores.brand || '#0A66C2');
var TH = {
  '--brand'      : C.cores.brand      || P.brand,
  '--brand-dark' : C.cores.brandDark  || P.dark,
  '--brand-light': C.cores.brandLight || P.light,
  '--brand-ink'  : C.cores.brandInk   || P.ink,
  '--accent'     : C.cores.accent     || '#FF9100'
};
Object.keys(TH).forEach(function(k){document.documentElement.style.setProperty(k,TH[k])});
document.title = C.cliente + ' · ' + C.rotulo;
var mt=document.querySelector('meta[name=theme-color]'); if(mt) mt.content = TH['--brand'];
window.TC_TEMA = TH;
window.TC_DERIVAR = derivar;   // o editor usa a mesma fórmula de tons

/* ---------- 2. ESTADO DA VIAGEM ---------- */
var S = {
  cidade:null, uf:null, pais:null,
  ini:null, fim:null,          // Date
  adultos:2, criancas:0, quartos:1,
  hotel:null, quarto:null, quartoIdx:null, prime:C.prime, email:'anasilva@gmail.com', cartoes:1
};
window.TC_STATE = S;

/* ---------- 3. CONTEÚDO DE EXEMPLO ---------- */
var CIDADES=[
{n:"Rio de Janeiro",uf:"RJ",p:"Brasil"},
{n:"São Paulo",uf:"SP",p:"Brasil"},
{n:"Belo Horizonte",uf:"MG",p:"Brasil"},
{n:"Brasília",uf:"DF",p:"Brasil"},
{n:"Salvador",uf:"BA",p:"Brasil"},
{n:"Fortaleza",uf:"CE",p:"Brasil"},
{n:"Recife",uf:"PE",p:"Brasil"},
{n:"Porto Alegre",uf:"RS",p:"Brasil"},
{n:"Curitiba",uf:"PR",p:"Brasil"},
{n:"Manaus",uf:"AM",p:"Brasil"},
{n:"Belém",uf:"PA",p:"Brasil"},
{n:"Goiânia",uf:"GO",p:"Brasil"},
{n:"Vitória",uf:"ES",p:"Brasil"},
{n:"Florianópolis",uf:"SC",p:"Brasil"},
{n:"Natal",uf:"RN",p:"Brasil"},
{n:"João Pessoa",uf:"PB",p:"Brasil"},
{n:"Maceió",uf:"AL",p:"Brasil"},
{n:"Aracaj",uf:"SE",p:"Brasil"},
{n:"Teresina",uf:"PI",p:"Brasil"},
{n:"São Luís",uf:"MA",p:"Brasil"},
{n:"Campo Grande",uf:"MS",p:"Brasil"},
{n:"Cuiabá",uf:"MT",p:"Brasil"},
{n:"Palmas",uf:"TO",p:"Brasil"},
{n:"Porto Velho",uf:"RO",p:"Brasil"},
{n:"Rio Branco",uf:"AC",p:"Brasil"},
{n:"Boa Vista",uf:"RR",p:"Brasil"},
{n:"Macapá",uf:"AP",p:"Brasil"},
{n:"Santos",uf:"SP",p:"Brasil"},
{n:"Guarujá",uf:"SP",p:"Brasil"},
{n:"São Vicente",uf:"SP",p:"Brasil"},
{n:"Praia Grande",uf:"SP",p:"Brasil"},
{n:"Bertioga",uf:"SP",p:"Brasil"},
{n:"Ubatuba",uf:"SP",p:"Brasil"},
{n:"Ilhabela",uf:"SP",p:"Brasil"},
{n:"São Sebastião",uf:"SP",p:"Brasil"},
{n:"Caraguatatuba",uf:"SP",p:"Brasil"},
{n:"Peruíbe",uf:"SP",p:"Brasil"},
{n:"Itanhaém",uf:"SP",p:"Brasil"},
{n:"Mongaguá",uf:"SP",p:"Brasil"},
{n:"Ilha Comprida",uf:"SP",p:"Brasil"},
{n:"Campinas",uf:"SP",p:"Brasil"},
{n:"Ribeirão Preto",uf:"SP",p:"Brasil"},
{n:"São José dos Campos",uf:"SP",p:"Brasil"},
{n:"Sorocaba",uf:"SP",p:"Brasil"},
{n:"Baur",uf:"SP",p:"Brasil"},
{n:"São José do Rio Preto",uf:"SP",p:"Brasil"},
{n:"Piracicaba",uf:"SP",p:"Brasil"},
{n:"Araraquara",uf:"SP",p:"Brasil"},
{n:"São Carlos",uf:"SP",p:"Brasil"},
{n:"Presidente Prudente",uf:"SP",p:"Brasil"},
{n:"Marília",uf:"SP",p:"Brasil"},
{n:"Franca",uf:"SP",p:"Brasil"},
{n:"Jundiaí",uf:"SP",p:"Brasil"},
{n:"Santo André",uf:"SP",p:"Brasil"},
{n:"São Bernardo do Campo",uf:"SP",p:"Brasil"},
{n:"Osasco",uf:"SP",p:"Brasil"},
{n:"Barueri",uf:"SP",p:"Brasil"},
{n:"Guarulhos",uf:"SP",p:"Brasil"},
{n:"Taubaté",uf:"SP",p:"Brasil"},
{n:"Jacareí",uf:"SP",p:"Brasil"},
{n:"Campos do Jordão",uf:"SP",p:"Brasil"},
{n:"Águas de Lindóia",uf:"SP",p:"Brasil"},
{n:"Serra Negra",uf:"SP",p:"Brasil"},
{n:"Socorro",uf:"SP",p:"Brasil"},
{n:"Amparo",uf:"SP",p:"Brasil"},
{n:"Atibaia",uf:"SP",p:"Brasil"},
{n:"Bragança Paulista",uf:"SP",p:"Brasil"},
{n:"It",uf:"SP",p:"Brasil"},
{n:"Brotas",uf:"SP",p:"Brasil"},
{n:"Olímpia",uf:"SP",p:"Brasil"},
{n:"Holambra",uf:"SP",p:"Brasil"},
{n:"Botucat",uf:"SP",p:"Brasil"},
{n:"Limeira",uf:"SP",p:"Brasil"},
{n:"Americana",uf:"SP",p:"Brasil"},
{n:"Rio Claro",uf:"SP",p:"Brasil"},
{n:"Registro",uf:"SP",p:"Brasil"},
{n:"Niterói",uf:"RJ",p:"Brasil"},
{n:"Angra dos Reis",uf:"RJ",p:"Brasil"},
{n:"Ilha Grande",uf:"RJ",p:"Brasil"},
{n:"Paraty",uf:"RJ",p:"Brasil"},
{n:"Armação dos Búzios",uf:"RJ",p:"Brasil"},
{n:"Cabo Frio",uf:"RJ",p:"Brasil"},
{n:"Arraial do Cabo",uf:"RJ",p:"Brasil"},
{n:"Saquarema",uf:"RJ",p:"Brasil"},
{n:"Maricá",uf:"RJ",p:"Brasil"},
{n:"Rio das Ostras",uf:"RJ",p:"Brasil"},
{n:"Macaé",uf:"RJ",p:"Brasil"},
{n:"Campos dos Goytacazes",uf:"RJ",p:"Brasil"},
{n:"Petrópolis",uf:"RJ",p:"Brasil"},
{n:"Teresópolis",uf:"RJ",p:"Brasil"},
{n:"Nova Friburgo",uf:"RJ",p:"Brasil"},
{n:"Itatiaia",uf:"RJ",p:"Brasil"},
{n:"Penedo",uf:"RJ",p:"Brasil"},
{n:"Resende",uf:"RJ",p:"Brasil"},
{n:"Mangaratiba",uf:"RJ",p:"Brasil"},
{n:"Volta Redonda",uf:"RJ",p:"Brasil"},
{n:"Ouro Preto",uf:"MG",p:"Brasil"},
{n:"Tiradentes",uf:"MG",p:"Brasil"},
{n:"São João del-Rei",uf:"MG",p:"Brasil"},
{n:"Diamantina",uf:"MG",p:"Brasil"},
{n:"Serro",uf:"MG",p:"Brasil"},
{n:"Capitólio",uf:"MG",p:"Brasil"},
{n:"São Thomé das Letras",uf:"MG",p:"Brasil"},
{n:"Poços de Caldas",uf:"MG",p:"Brasil"},
{n:"Araxá",uf:"MG",p:"Brasil"},
{n:"Caxamb",uf:"MG",p:"Brasil"},
{n:"São Lourenço",uf:"MG",p:"Brasil"},
{n:"Monte Verde",uf:"MG",p:"Brasil"},
{n:"Juiz de Fora",uf:"MG",p:"Brasil"},
{n:"Uberlândia",uf:"MG",p:"Brasil"},
{n:"Uberaba",uf:"MG",p:"Brasil"},
{n:"Montes Claros",uf:"MG",p:"Brasil"},
{n:"Governador Valadares",uf:"MG",p:"Brasil"},
{n:"Ipatinga",uf:"MG",p:"Brasil"},
{n:"Betim",uf:"MG",p:"Brasil"},
{n:"Contagem",uf:"MG",p:"Brasil"},
{n:"Lavras",uf:"MG",p:"Brasil"},
{n:"Varginha",uf:"MG",p:"Brasil"},
{n:"Pouso Alegre",uf:"MG",p:"Brasil"},
{n:"Porto Seguro",uf:"BA",p:"Brasil"},
{n:"Arraial d'Ajuda",uf:"BA",p:"Brasil"},
{n:"Trancoso",uf:"BA",p:"Brasil"},
{n:"Caraíva",uf:"BA",p:"Brasil"},
{n:"Praia do Forte",uf:"BA",p:"Brasil"},
{n:"Costa do Sauípe",uf:"BA",p:"Brasil"},
{n:"Morro de São Paulo",uf:"BA",p:"Brasil"},
{n:"Ilhéus",uf:"BA",p:"Brasil"},
{n:"Itacaré",uf:"BA",p:"Brasil"},
{n:"Lençóis",uf:"BA",p:"Brasil"},
{n:"Barreiras",uf:"BA",p:"Brasil"},
{n:"Feira de Santana",uf:"BA",p:"Brasil"},
{n:"Vitória da Conquista",uf:"BA",p:"Brasil"},
{n:"Juazeiro",uf:"BA",p:"Brasil"},
{n:"Camaçari",uf:"BA",p:"Brasil"},
{n:"Porto de Galinhas",uf:"PE",p:"Brasil"},
{n:"Olinda",uf:"PE",p:"Brasil"},
{n:"Caruar",uf:"PE",p:"Brasil"},
{n:"Gravatá",uf:"PE",p:"Brasil"},
{n:"Petrolina",uf:"PE",p:"Brasil"},
{n:"Fernando de Noronha",uf:"PE",p:"Brasil"},
{n:"Tamandaré",uf:"PE",p:"Brasil"},
{n:"Jericoacoara",uf:"CE",p:"Brasil"},
{n:"Canoa Quebrada",uf:"CE",p:"Brasil"},
{n:"Cumbuco",uf:"CE",p:"Brasil"},
{n:"Beberibe",uf:"CE",p:"Brasil"},
{n:"Juazeiro do Norte",uf:"CE",p:"Brasil"},
{n:"Sobral",uf:"CE",p:"Brasil"},
{n:"Pipa",uf:"RN",p:"Brasil"},
{n:"Genipab",uf:"RN",p:"Brasil"},
{n:"São Miguel do Gostoso",uf:"RN",p:"Brasil"},
{n:"Mossoró",uf:"RN",p:"Brasil"},
{n:"Maragogi",uf:"AL",p:"Brasil"},
{n:"Japaratinga",uf:"AL",p:"Brasil"},
{n:"São Miguel dos Milagres",uf:"AL",p:"Brasil"},
{n:"Barra de São Miguel",uf:"AL",p:"Brasil"},
{n:"Praia do Francês",uf:"AL",p:"Brasil"},
{n:"Penedo",uf:"AL",p:"Brasil"},
{n:"Arapiraca",uf:"AL",p:"Brasil"},
{n:"Campina Grande",uf:"PB",p:"Brasil"},
{n:"Cabedelo",uf:"PB",p:"Brasil"},
{n:"Conde",uf:"PB",p:"Brasil"},
{n:"Parnaíba",uf:"PI",p:"Brasil"},
{n:"Barreirinhas",uf:"MA",p:"Brasil"},
{n:"Lençóis Maranhenses",uf:"MA",p:"Brasil"},
{n:"Alcântara",uf:"MA",p:"Brasil"},
{n:"Imperatriz",uf:"MA",p:"Brasil"},
{n:"Santarém",uf:"PA",p:"Brasil"},
{n:"Alter do Chão",uf:"PA",p:"Brasil"},
{n:"Salinópolis",uf:"PA",p:"Brasil"},
{n:"Soure",uf:"PA",p:"Brasil"},
{n:"Marabá",uf:"PA",p:"Brasil"},
{n:"Presidente Figueiredo",uf:"AM",p:"Brasil"},
{n:"Parintins",uf:"AM",p:"Brasil"},
{n:"Mateiros",uf:"TO",p:"Brasil"},
{n:"Caldas Novas",uf:"GO",p:"Brasil"},
{n:"Rio Quente",uf:"GO",p:"Brasil"},
{n:"Pirenópolis",uf:"GO",p:"Brasil"},
{n:"Alto Paraíso de Goiás",uf:"GO",p:"Brasil"},
{n:"Anápolis",uf:"GO",p:"Brasil"},
{n:"Rio Verde",uf:"GO",p:"Brasil"},
{n:"Chapada dos Guimarães",uf:"MT",p:"Brasil"},
{n:"Nobres",uf:"MT",p:"Brasil"},
{n:"Poconé",uf:"MT",p:"Brasil"},
{n:"Alta Floresta",uf:"MT",p:"Brasil"},
{n:"Rondonópolis",uf:"MT",p:"Brasil"},
{n:"Sinop",uf:"MT",p:"Brasil"},
{n:"Bonito",uf:"MS",p:"Brasil"},
{n:"Corumbá",uf:"MS",p:"Brasil"},
{n:"Aquidauana",uf:"MS",p:"Brasil"},
{n:"Dourados",uf:"MS",p:"Brasil"},
{n:"Três Lagoas",uf:"MS",p:"Brasil"},
{n:"Foz do Iguaç",uf:"PR",p:"Brasil"},
{n:"Londrina",uf:"PR",p:"Brasil"},
{n:"Maringá",uf:"PR",p:"Brasil"},
{n:"Morretes",uf:"PR",p:"Brasil"},
{n:"Antonina",uf:"PR",p:"Brasil"},
{n:"Paranaguá",uf:"PR",p:"Brasil"},
{n:"Ilha do Mel",uf:"PR",p:"Brasil"},
{n:"Ponta Grossa",uf:"PR",p:"Brasil"},
{n:"Cascavel",uf:"PR",p:"Brasil"},
{n:"Guarapuava",uf:"PR",p:"Brasil"},
{n:"Matinhos",uf:"PR",p:"Brasil"},
{n:"Guaratuba",uf:"PR",p:"Brasil"},
{n:"Balneário Camboriú",uf:"SC",p:"Brasil"},
{n:"Bombinhas",uf:"SC",p:"Brasil"},
{n:"Itapema",uf:"SC",p:"Brasil"},
{n:"Porto Belo",uf:"SC",p:"Brasil"},
{n:"Penha",uf:"SC",p:"Brasil"},
{n:"Itajaí",uf:"SC",p:"Brasil"},
{n:"Navegantes",uf:"SC",p:"Brasil"},
{n:"Blumena",uf:"SC",p:"Brasil"},
{n:"Joinville",uf:"SC",p:"Brasil"},
{n:"Jaraguá do Sul",uf:"SC",p:"Brasil"},
{n:"São Francisco do Sul",uf:"SC",p:"Brasil"},
{n:"Garopaba",uf:"SC",p:"Brasil"},
{n:"Imbituba",uf:"SC",p:"Brasil"},
{n:"Laguna",uf:"SC",p:"Brasil"},
{n:"Urubici",uf:"SC",p:"Brasil"},
{n:"São Joaquim",uf:"SC",p:"Brasil"},
{n:"Treze Tílias",uf:"SC",p:"Brasil"},
{n:"Lages",uf:"SC",p:"Brasil"},
{n:"Chapecó",uf:"SC",p:"Brasil"},
{n:"Criciúma",uf:"SC",p:"Brasil"},
{n:"Gramado",uf:"RS",p:"Brasil"},
{n:"Canela",uf:"RS",p:"Brasil"},
{n:"Bento Gonçalves",uf:"RS",p:"Brasil"},
{n:"Garibaldi",uf:"RS",p:"Brasil"},
{n:"Caxias do Sul",uf:"RS",p:"Brasil"},
{n:"Nova Petrópolis",uf:"RS",p:"Brasil"},
{n:"Cambará do Sul",uf:"RS",p:"Brasil"},
{n:"São Francisco de Paula",uf:"RS",p:"Brasil"},
{n:"Torres",uf:"RS",p:"Brasil"},
{n:"Capão da Canoa",uf:"RS",p:"Brasil"},
{n:"Tramandaí",uf:"RS",p:"Brasil"},
{n:"Pelotas",uf:"RS",p:"Brasil"},
{n:"Rio Grande",uf:"RS",p:"Brasil"},
{n:"Santa Maria",uf:"RS",p:"Brasil"},
{n:"Passo Fundo",uf:"RS",p:"Brasil"},
{n:"Santo Ângelo",uf:"RS",p:"Brasil"},
{n:"Guarapari",uf:"ES",p:"Brasil"},
{n:"Vila Velha",uf:"ES",p:"Brasil"},
{n:"Domingos Martins",uf:"ES",p:"Brasil"},
{n:"Pedra Azul",uf:"ES",p:"Brasil"},
{n:"Anchieta",uf:"ES",p:"Brasil"},
{n:"Linhares",uf:"ES",p:"Brasil"},
{n:"Cachoeiro de Itapemirim",uf:"ES",p:"Brasil"},
{n:"Conceição da Barra",uf:"ES",p:"Brasil"},
{n:"Buenos Aires",uf:"",p:"Argentina"},
{n:"Bariloche",uf:"",p:"Argentina"},
{n:"Mendoza",uf:"",p:"Argentina"},
{n:"Córdoba",uf:"",p:"Argentina"},
{n:"El Calafate",uf:"",p:"Argentina"},
{n:"Ushuaia",uf:"",p:"Argentina"},
{n:"Santiago",uf:"",p:"Chile"},
{n:"Valparaíso",uf:"",p:"Chile"},
{n:"San Pedro de Atacama",uf:"",p:"Chile"},
{n:"Montevidé",uf:"",p:"Uruguai"},
{n:"Punta del Este",uf:"",p:"Uruguai"},
{n:"Colonia del Sacramento",uf:"",p:"Uruguai"},
{n:"Assunção",uf:"",p:"Paraguai"},
{n:"Lima",uf:"",p:"Per"},
{n:"Cusco",uf:"",p:"Per"},
{n:"Bogotá",uf:"",p:"Colômbia"},
{n:"Cartagena",uf:"",p:"Colômbia"},
{n:"Medellín",uf:"",p:"Colômbia"},
{n:"Cidade do México",uf:"",p:"México"},
{n:"Cancún",uf:"",p:"México"},
{n:"Playa del Carmen",uf:"",p:"México"},
{n:"Punta Cana",uf:"",p:"República Dominicana"},
{n:"Havana",uf:"",p:"Cuba"},
{n:"Aruba",uf:"",p:"Aruba"},
{n:"Cidade do Panamá",uf:"",p:"Panamá"},
{n:"San José",uf:"",p:"Costa Rica"},
{n:"Miami",uf:"",p:"Estados Unidos"},
{n:"Orlando",uf:"",p:"Estados Unidos"},
{n:"Nova York",uf:"",p:"Estados Unidos"},
{n:"Las Vegas",uf:"",p:"Estados Unidos"},
{n:"Los Angeles",uf:"",p:"Estados Unidos"},
{n:"San Francisco",uf:"",p:"Estados Unidos"},
{n:"Chicago",uf:"",p:"Estados Unidos"},
{n:"Boston",uf:"",p:"Estados Unidos"},
{n:"Washington",uf:"",p:"Estados Unidos"},
{n:"Toronto",uf:"",p:"Canadá"},
{n:"Vancouver",uf:"",p:"Canadá"},
{n:"Lisboa",uf:"",p:"Portugal"},
{n:"Porto",uf:"",p:"Portugal"},
{n:"Madri",uf:"",p:"Espanha"},
{n:"Barcelona",uf:"",p:"Espanha"},
{n:"Sevilha",uf:"",p:"Espanha"},
{n:"Paris",uf:"",p:"França"},
{n:"Nice",uf:"",p:"França"},
{n:"Roma",uf:"",p:"Itália"},
{n:"Milão",uf:"",p:"Itália"},
{n:"Veneza",uf:"",p:"Itália"},
{n:"Florença",uf:"",p:"Itália"},
{n:"Riomaggiore",uf:"",p:"Itália"},
{n:"Londres",uf:"",p:"Reino Unido"},
{n:"Amsterdã",uf:"",p:"Holanda"},
{n:"Berlim",uf:"",p:"Alemanha"},
{n:"Munique",uf:"",p:"Alemanha"},
{n:"Praga",uf:"",p:"Tchéquia"},
{n:"Viena",uf:"",p:"Áustria"},
{n:"Zurique",uf:"",p:"Suíça"},
{n:"Atenas",uf:"",p:"Grécia"},
{n:"Istambul",uf:"",p:"Turquia"},
{n:"Dubai",uf:"",p:"Emirados Árabes"},
{n:"Tóquio",uf:"",p:"Japão"},
{n:"Bangkok",uf:"",p:"Tailândia"},
{n:"Bali",uf:"",p:"Indonésia"}
];
var HIST=[
 {n:'Rio de Janeiro',uf:'RJ',p:'Brasil'},
 {n:'Porto Seguro',uf:'BA',p:'Brasil'},
 {n:'Gramado',uf:'RS',p:'Brasil'}
];
function guardarHist(c){
  HIST = HIST.filter(function(h){ return h.n !== c.n; });
  HIST.unshift({n:c.n,uf:c.uf,p:c.p});
  if(HIST.length>5) HIST.length=5;
}
var HOTEIS=[
 {id:1,n:'Rio Othon Palace',b:'Copacabana',e:4,cat:'Midscale',img:'hotel-1.jpg',de:3847.28,por:3445.32,
  end:'Av. Atlântica, 3265, Copacabana',
  d:'Localizado à beira-mar da Praia de Copacabana, o Othon Palace oferece academia e piscina na cobertura com vista para o Pão de Açúcar. O café da manhã é servido no 3º andar com vista panorâmica. Wi-Fi grátis em todas as áreas.'},
 {id:2,n:'Hotel Atlântico Avenida',b:'Centro',e:3,cat:'Econômico',img:'hotel-2.jpg',de:2190.00,por:1962.40,
  end:'Av. Rio Branco, 152, Centro',
  d:'A poucos passos do metrô, ideal para quem viaja a trabalho. Café da manhã incluso, academia 24h e sala de reuniões.'},
 {id:3,n:'Praia Bella Resort',b:'Barra da Tijuca',e:5,cat:'Upscale',img:'hotel-3.jpg',de:5410.00,por:4785.90,
  end:'Av. Lúcio Costa, 8000, Barra',
  d:'Resort pé na areia com três piscinas, spa completo e restaurante assinado. Kids club e day use de pranchas inclusos.'},
 {id:4,n:'Copa Sunset Hotel',b:'Leme',e:4,cat:'Midscale',img:'hotel-4.jpg',de:3120.00,por:2760.15,
  end:'Av. Atlântica, 866, Leme',
  d:'Rooftop com vista para a enseada, quartos reformados em 2025 e traslado do aeroporto incluso na diária.'}
];
var QUARTOS=[
 {n:'Standard',pes:2,img:'quarto-1.jpg',dif:0,
  d:'Apartamento com 22m², do 3º ao 5º andar, com cama queen size e vista para a cidade. Equipado com Smart TV 43\', ar-condicionado e frigobar.'},
 {n:'Superior',pes:3,img:'hotel-hero.jpg',dif:430,
  d:'Apartamento com 25m², do 6º ao 13º andar, na lateral do prédio, com sacada e vista para cidade. Equipado com Smart TV 43\', disponível com cama King Size ou 2 camas de solteiro. Crianças: 01 criança de até 12 anos cortesia quando no mesmo apartamento dos pais, utilizando as camas existentes.'},
 {n:'Luxo Família',pes:4,img:'hotel-4.jpg',dif:890,
  d:'Apartamento com 34m², nos andares altos, com 1 cama king size e 2 camas de solteiro, sacada e vista frontal para o mar. Inclui café da manhã para toda a família.'}
];

/* ---------- 4. UTILITÁRIOS ---------- */
var MES=['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
var MES3=['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
var DIA=['domingo','segunda-feira','terça-feira','quarta-feira','quinta-feira','sexta-feira','sábado'];
var WK=['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
function money(v){return 'R$ '+v.toFixed(2).replace('.',',').replace(/\B(?=(\d{3})+(?!\d))/g,'.');}
function d2(n){return (n<10?'0':'')+n;}
function dt(d){return d? d2(d.getDate())+'/'+d2(d.getMonth()+1)+'/'+d.getFullYear() : '';}
function noites(){ if(!S.ini||!S.fim) return 0;
  return Math.round((S.fim-S.ini)/86400000); }
function precoBase(){ var h=S.hotel||HOTEIS[0]; var q=S.quarto? S.quarto.dif:0; return h.por+q; }
function precoDe(){ var h=S.hotel||HOTEIS[0]; var q=S.quarto? S.quarto.dif:0; return h.de+q; }
function economia(){ return precoDe()-precoBase(); }
function esc(s){return String(s).replace(/[&<>"]/g,function(c){
  return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]});}
function resumoBusca(){
  var a = S.cidade ? S.cidade+(S.uf?', '+S.uf:'')+' - '+S.pais : 'Para onde deseja ir?';
  var b = [];
  if(S.ini&&S.fim) b.push(dt(S.ini)+' - '+dt(S.fim)); else b.push('Escolher datas');
  var g = S.adultos+' adulto'+(S.adultos>1?'s':'');
  if(S.criancas) g += ', '+S.criancas+' criança'+(S.criancas>1?'s':'');
  b.push(g);
  return {a:a,b:b.join('  |  ')};
}
function img(f){ if(window.TC_IMG&&window.TC_IMG[f]) return window.TC_IMG[f];
  return (C.base||'../assets/img/')+f; }

/* ---------- 5. ÍCONES ---------- */
var I = {
 lupa:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>',
 pin:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.6"/></svg>',
 filtro:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M7 12h10M10 17h4"/></svg>',
 cama:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M3 18v-9m0 5h18m0 4v-6a3 3 0 0 0-3-3H9"/><circle cx="7" cy="11" r="2"/></svg>',
 in:'<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M7 17L17 7M9 7h8v8"/></svg>',
 out:'<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M7 7l10 10M15 17H7V9"/></svg>',
 check:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M4 12.5l5.2 5L20 7"/></svg>',
 carrinho:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><circle cx="9" cy="20" r="1.4"/><circle cx="17" cy="20" r="1.4"/><path d="M2 3h3l2.6 12h10.2L21 7H6"/></svg>',
 relogio:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5.4l3.4 2"/></svg>',
 mala:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><rect x="3" y="7" width="18" height="14" rx="2.5"/><path d="M8.5 7V5a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v2"/></svg>',
 mail:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3.5 7l8.5 6 8.5-6"/></svg>',
 rest:'<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 3v8a2 2 0 0 0 4 0V3M8 11v10M17 3c-1.5 1.5-2 3-2 5s.6 3 2 3.4V21"/></svg>',
 cafe:'<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 8h12v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V8zM16 9h2a2.5 2.5 0 0 1 0 5h-2M4 21h13"/></svg>',
 wifi:'<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 9a13 13 0 0 1 16 0M7 13a8 8 0 0 1 10 0"/><circle cx="12" cy="17.5" r="1.2" fill="currentColor"/></svg>',
 cartao:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 9.5h19"/></svg>',
 alerta:'<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7.4v5.4M12 16.2v.1"/></svg>',
 casa:'<svg width="18"  height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 10.5 12 3.5l8.5 7"/><path d="M5.5 9.6V20h13V9.6"/><path d="M10 20v-5h4v5"/></svg>',
 okcirc:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M8 12.3l2.7 2.7L16 9.6"/></svg>',
 tv:'<svg width="17"  height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="2.5" y="5" width="19" height="13" rx="2"/><path d="M8 21h8"/></svg>',
 ac:'<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M12 2v20M4 7l16 10M20 7L4 17M12 6l2.4-2.4M12 6 9.6 3.6M12 18l2.4 2.4M12 18l-2.4 2.4"/></svg>',
 hist:'<svg width="18"  height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M3.2 12a8.8 8.8 0 1 1 2.6 6.2"/><path d="M3 19v-5h5"/><path d="M12 7.6V12l3 1.9"/></svg>',
 user:'<svg width="17"  height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="8.5" r="3.6"/><path d="M4.8 20a7.2 7.2 0 0 1 14.4 0"/></svg>',
 primeMark:'<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3.5 21 20H3z"/></svg>',
 cal:'<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
 ppl:'<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><circle cx="9.5" cy="8" r="3"/><path d="M3.5 19a6 6 0 0 1 12 0"/><circle cx="17.5" cy="8.5" r="2.3"/><path d="M16 14.6a5.2 5.2 0 0 1 4.5 4.4"/></svg>',
 info:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.6v.1"/></svg>',
 chev:'<svg width="18"  height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M9 5l7 7-7 7"/></svg>',
 down:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M5 9l7 7 7-7"/></svg>'
};
var LOGO_PRIME = '<svg viewBox="0 0 65 16" fill="none" xmlns="http://www.w3.org/2000/svg" class="lg-prime"><path fill-rule="evenodd" clip-rule="evenodd" d="M23.2061 3.4441C24.3477 3.44411 25.2756 3.86344 25.99 4.70035C26.7043 5.5373 27.0617 6.64453 27.0617 8.01875C27.0617 9.46587 26.6654 10.6381 25.8731 11.534C25.0808 12.4315 24.0467 12.8788 22.7739 12.8788C21.9816 12.8788 21.2252 12.688 20.5031 12.3045V16H18.5395V3.67708H20.4312V4.52014C21.2485 3.80275 22.1735 3.4441 23.2061 3.4441ZM22.8458 5.11319C21.9693 5.11319 21.1878 5.46577 20.5031 6.17222V10.6024C21.1878 11.0093 21.8912 11.2128 22.6118 11.2128L22.6104 11.2111C23.3667 11.2111 23.9639 10.9363 24.4037 10.3868C24.842 9.83712 25.0622 9.05268 25.0622 8.03715C25.0622 7.1164 24.8702 6.39902 24.485 5.88507C24.0998 5.37111 23.5539 5.11321 22.8458 5.11319Z" fill="#FF9100"/><path d="M4.69811 3.66146C5.09893 3.30589 5.73388 3.58847 5.73396 4.12257V11.7764C5.73396 12.0015 5.57166 12.1973 5.32834 12.2392C3.9995 12.4659 2.71431 12.8602 1.49464 12.8882C1.22017 12.8944 0.908244 12.8913 0.644677 12.8556C0.248506 12.8028 -0.051102 12.472 0.00816761 12.0792C0.502601 8.80436 2.20415 5.87418 4.69811 3.66146Z" fill="#FF9100"/><path d="M6.97699 0.661458C6.97701 0.0466226 7.60705 -0.181606 8.05156 0.158333C11.6202 2.86949 14.0581 6.79185 14.7054 11.4222C14.7335 11.621 14.7633 11.9177 14.7898 12.2142L14.7905 12.2552C14.8 12.6913 14.3538 13.0022 13.9413 12.8337C13.6824 12.7281 13.4281 12.6273 13.2706 12.576C11.583 12.0201 9.71266 11.795 7.63198 11.9441C7.27177 11.9704 6.97703 11.6972 6.97699 11.3448V0.661458Z" fill="#FF9100"/><path fill-rule="evenodd" clip-rule="evenodd" d="M61.2603 3.4441C62.2569 3.44411 63.1164 3.71575 63.837 4.26076C64.5576 4.80579 64.9178 5.56847 64.9178 6.54826C64.9178 7.2656 64.6946 7.84637 64.2517 8.28889C63.8072 8.7314 63.1583 8.95174 62.3052 8.95174H58.5025C58.7427 10.4579 59.607 11.2128 61.0981 11.2128V11.2111C62.0822 11.2111 63.0085 10.8648 63.8726 10.1708L64.7741 11.4799C63.7042 12.3882 62.4439 12.8431 60.9903 12.8431C59.6926 12.8431 58.6382 12.4332 57.8287 11.6149C57.0177 10.7966 56.6122 9.68621 56.6122 8.28715C56.6122 6.88814 57.0238 5.77626 57.8458 4.84306C58.6678 3.90983 59.8066 3.4441 61.2603 3.4441ZM61.2055 4.95035C60.4849 4.95036 59.8749 5.18332 59.3758 5.65069C58.8768 6.11651 58.5742 6.75623 58.4666 7.56979H61.9449C62.3052 7.56979 62.5874 7.47359 62.7917 7.28264C62.996 7.09165 63.0976 6.81668 63.0976 6.45799C63.0976 6.04032 62.9258 5.68323 62.5842 5.39132C62.2426 5.09789 61.7826 4.95174 61.2055 4.95174V4.95035Z" fill="#FF9100"/><path d="M51.8908 3.4441C52.8033 3.4441 53.51 3.69251 54.0075 4.18785C54.5066 4.68472 54.7546 5.39281 54.7546 6.31354V12.6458H52.7551V6.7625C52.7551 6.20044 52.652 5.78743 52.4492 5.525C52.2449 5.26259 51.9081 5.13057 51.4402 5.13056C50.5028 5.13056 49.584 5.53738 48.6825 6.35104V12.6476H46.683V6.76389C46.683 6.1894 46.5832 5.77477 46.3851 5.51701C46.1871 5.25929 45.847 5.13197 45.3667 5.13194C44.526 5.13194 43.612 5.56218 42.6278 6.42396V12.649H40.6283V3.67708H42.52V4.9691C43.6493 3.95202 44.7724 3.4441 45.8892 3.4441C47.1619 3.44412 48.0089 3.92865 48.43 4.89757C49.5343 3.92864 50.6885 3.4441 51.8895 3.4441H51.8908Z" fill="#FF9100"/><path d="M33.7114 3.4441C34.1557 3.44418 34.5687 3.53439 34.9538 3.71285L34.575 5.32778C34.1539 5.20821 33.8121 5.14757 33.5486 5.14757C32.6237 5.14758 31.7642 5.5421 30.9718 6.3309V12.6458H29.0082V3.67708H30.9188V4.77187C31.7109 3.88704 32.6419 3.44436 33.7114 3.4441Z" fill="#FF9100"/><path d="M38.1604 12.6458H36.2139V3.67708H38.1604V12.6458Z" fill="#FF9100"/><path d="M37.2061 0C37.5788 3.141e-05 37.8721 0.110274 38.0889 0.332292C38.3056 0.554322 38.4132 0.855575 38.4132 1.2375C38.4132 1.61943 38.3056 1.92538 38.0889 2.15208C37.8721 2.37876 37.5788 2.49372 37.2061 2.49375C36.8334 2.49375 36.537 2.38032 36.314 2.15208C36.0909 1.92538 35.9802 1.61949 35.9802 1.2375C35.9802 0.855549 36.0909 0.552774 36.314 0.332292C36.5354 0.11185 36.8334 0 37.2061 0Z" fill="#FF9100"/></svg>';
var LOGO_RDC = '<svg viewBox="0 0 82 32" fill="none" xmlns="http://www.w3.org/2000/svg" class="lg-rdc"><path d="M7.80869 6.06381C3.66405 9.72884 0.833998 14.5818 0.012565 20.0058C-0.0863667 20.657 0.41129 21.2042 1.06934 21.2904C1.50703 21.3484 2.02568 21.3543 2.48286 21.3439C4.51096 21.2978 6.64699 20.6451 8.85496 20.2689C9.25819 20.2006 9.5295 19.8749 9.5295 19.5017V6.82655C9.5295 5.94041 8.47423 5.47503 7.80719 6.06381M40.0544 5.86607C38.2976 5.86607 36.6818 6.43849 35.3792 7.40939C35.3777 7.40939 35.3732 7.40939 35.3732 7.40642C35.3732 6.73883 34.949 6.13518 34.3059 5.94041C33.2356 5.61479 32.2553 6.39984 32.2553 7.41236V19.7411C32.2553 20.5737 32.8999 21.2904 33.7393 21.3291C34.6342 21.3707 35.3732 20.663 35.3732 19.7842V13.5976C35.3732 11.0343 37.4702 8.95569 40.0559 8.95569C41.4305 8.95569 42.6671 9.54298 43.523 10.4782C43.9937 10.9926 44.7597 11.1547 45.3878 10.8454C46.3156 10.389 46.5435 9.18317 45.8539 8.42341C44.4269 6.85183 42.3583 5.86309 40.0574 5.86309M67.3206 8.91554C68.1825 7.67553 69.3787 6.67936 70.7772 6.05489C70.8747 6.01177 70.8432 5.86755 70.7368 5.86755H63.5447C63.4893 5.86755 63.4458 5.91216 63.4458 5.96568V8.85905C63.4458 8.91406 63.4908 8.95718 63.5447 8.95718H67.2412C67.2727 8.95718 67.3041 8.94082 67.3221 8.91406M61.3487 0.000538061C60.4868 0.000538061 59.7898 0.693399 59.7898 1.54684V13.599C59.7898 16.1623 57.6928 18.2409 55.1071 18.2409C52.5213 18.2409 50.4243 16.1623 50.4243 13.599C50.4243 11.0358 52.5198 8.95718 55.1071 8.95718H59.1543C59.2082 8.95718 59.2532 8.91257 59.2532 8.85905V5.96568C59.2532 5.91067 59.2082 5.86755 59.1543 5.86755H55.1071C50.799 5.86755 47.3064 9.32888 47.3064 13.6005C47.3064 17.8722 50.799 21.3335 55.1071 21.3335C59.4151 21.3335 62.9092 17.8722 62.9092 13.6005V1.54684C62.9092 0.691912 62.2106 0.000538061 61.3502 0.000538061M81.991 13.2511C81.9475 12.2847 81.0152 11.6052 80.0738 11.8535L80.0094 11.8699C79.3094 12.0542 78.8507 12.701 78.8777 13.4191C78.8807 13.4786 78.8806 13.5381 78.8806 13.599C78.8806 16.1623 76.7836 18.2409 74.1979 18.2409C71.6122 18.2409 69.5151 16.1623 69.5151 13.599C69.5151 11.0358 71.6107 8.95718 74.1979 8.95718C74.3118 8.95718 74.4242 8.96164 74.5351 8.96907C75.2202 9.01814 75.8572 8.62115 76.0806 7.97736L76.1106 7.89261C76.4373 6.94996 75.7733 5.96122 74.772 5.88837C74.5831 5.87499 74.3912 5.86755 74.1994 5.86755C69.8913 5.86755 66.3988 9.32888 66.3988 13.6005C66.3988 17.8722 69.8913 21.3335 74.1994 21.3335C78.5074 21.3335 82 17.8722 82 13.6005C82 13.4831 81.997 13.3671 81.9925 13.2526M24.5806 20.2273C24.6496 20.9856 23.8821 21.5446 23.1716 21.2547C22.7399 21.0793 22.3187 20.9142 22.0564 20.828C19.2518 19.9076 16.1429 19.5345 12.6833 19.7813C12.0837 19.8244 11.5951 19.3724 11.5951 18.7896V1.09484C11.5951 0.0763662 12.6414 -0.301288 13.3818 0.260733C19.3132 4.75243 23.365 11.2454 24.4412 18.9144C24.4877 19.243 24.5371 19.7352 24.5806 20.2273ZM57.0692 26.2564H57.9851L56.5131 30.0047C56.4201 30.2426 56.2193 30.3615 55.9075 30.3615C55.7381 30.3615 55.6077 30.3348 55.5148 30.2812C55.4218 30.2277 55.3484 30.1355 55.2944 30.0047L53.8149 26.2564H54.7713L55.9165 29.5423L57.0692 26.2564ZM58.7046 26.2564H59.5875V30.3125H58.7046V26.2564ZM59.556 25.5665C59.4571 25.6691 59.3236 25.7211 59.1558 25.7211C58.9879 25.7211 58.8515 25.6691 58.751 25.5665C58.6491 25.4639 58.5996 25.3256 58.5996 25.1532C58.5996 24.9807 58.6506 24.8439 58.751 24.7428C58.8515 24.6432 58.9864 24.5926 59.1558 24.5926C59.3251 24.5926 59.4585 24.6432 59.556 24.7428C59.6534 24.8439 59.7029 24.9792 59.7029 25.1532C59.7029 25.3271 59.6534 25.4639 59.556 25.5665ZM62.1162 29.7371C62.476 29.7371 62.7563 29.6166 62.9586 29.3758C63.1595 29.1349 63.2719 28.8227 63.2944 28.4391C63.0111 28.4123 62.7758 28.3989 62.5914 28.3989C61.8059 28.3989 61.4132 28.6398 61.4132 29.1215C61.4132 29.3059 61.4777 29.4546 61.6051 29.5676C61.734 29.6806 61.9034 29.7371 62.1162 29.7371ZM62.3605 26.1508C62.9062 26.1508 63.3364 26.2965 63.6527 26.5894C63.9689 26.8823 64.1263 27.2987 64.1263 27.8384V30.3125H63.3169V29.6954C63.0051 30.1712 62.5419 30.4091 61.9258 30.4091C61.5061 30.4091 61.1674 30.2946 60.908 30.0642C60.6487 29.8337 60.5198 29.5334 60.5198 29.1587C60.5198 28.6933 60.7057 28.3558 61.0759 28.1447C61.4462 27.9335 61.9258 27.828 62.5149 27.828C62.7488 27.828 63.0081 27.8473 63.2914 27.8845V27.7953C63.2914 27.4979 63.2075 27.2719 63.0381 27.1173C62.8687 26.9626 62.6289 26.8853 62.3186 26.8853C61.8764 26.8853 61.4567 27.0444 61.0594 27.3641L60.6337 26.7961C61.0864 26.3634 61.662 26.1479 62.359 26.1479M66.8754 28.2606C67.1647 28.2606 67.3941 28.1982 67.562 28.0748C67.7313 27.9499 67.8153 27.7744 67.8153 27.547C67.8153 27.3195 67.7313 27.1425 67.562 27.0162C67.3926 26.8898 67.1632 26.8258 66.8754 26.8258C66.5876 26.8258 66.3598 26.8913 66.1964 27.0206C66.033 27.15 65.9506 27.3314 65.9506 27.5648C65.9506 28.0302 66.2579 28.2621 66.8754 28.2621M67.1377 30.2887C66.6746 30.2351 66.3688 30.1935 66.2219 30.1667C65.9056 30.3125 65.7482 30.5043 65.7482 30.7421C65.7482 31.1421 66.1155 31.3428 66.8529 31.3428C67.6384 31.3428 68.0311 31.1525 68.0311 30.7749C68.0311 30.6187 67.9622 30.5072 67.8228 30.4418C67.6834 30.3764 67.4555 30.3258 67.1392 30.2872M68.9785 26.3456C68.8361 26.5017 68.6397 26.6489 68.3894 26.7842C68.5468 27.0013 68.6262 27.2555 68.6262 27.547C68.6262 27.9633 68.4673 28.2933 68.1481 28.5372C67.8288 28.781 67.4031 28.9015 66.8679 28.9015C66.6341 28.9015 66.4212 28.8777 66.2294 28.8286C66.0825 28.8985 66.009 28.9966 66.009 29.12C66.009 29.233 66.075 29.3193 66.2099 29.3758C66.3433 29.4323 66.5457 29.4769 66.8185 29.5096C67.538 29.6017 67.9937 29.682 68.184 29.7534C68.6532 29.9422 68.887 30.2649 68.887 30.7184C68.887 31.1347 68.7072 31.4528 68.3474 31.6714C67.9877 31.89 67.478 32 66.8185 32C66.2294 32 65.7647 31.9004 65.4244 31.6997C65.0842 31.4989 64.9133 31.2164 64.9133 30.8477C64.9133 30.4373 65.1336 30.134 65.5758 29.9393C65.342 29.7831 65.2236 29.5661 65.2236 29.291C65.2236 29.0159 65.3705 28.7691 65.6658 28.5848C65.3225 28.3469 65.1501 28.0094 65.1501 27.5707C65.1501 27.1321 65.3075 26.8125 65.6238 26.5612C65.9401 26.3099 66.3628 26.1835 66.8919 26.1835C67.2412 26.1835 67.5515 26.243 67.8243 26.362C68.1181 26.2267 68.3639 26.0512 68.5603 25.8341L68.977 26.3456H68.9785ZM71.5222 26.8318C71.1954 26.8318 70.9181 26.9374 70.6918 27.1485C70.4655 27.3596 70.3275 27.6495 70.2781 28.0168H71.8565C72.0199 28.0168 72.1488 27.9737 72.2402 27.8874C72.3332 27.8012 72.3796 27.6763 72.3796 27.5142C72.3796 27.3254 72.3017 27.1634 72.1458 27.031C71.9899 26.8987 71.7815 26.8318 71.5207 26.8318M71.4728 29.6642C71.9194 29.6642 72.3392 29.5081 72.7319 29.1944L73.1411 29.7861C72.6554 30.198 72.0828 30.4031 71.4233 30.4031C70.8342 30.4031 70.356 30.2188 69.9873 29.8471C69.62 29.4769 69.4357 28.9758 69.4357 28.3424C69.4357 27.709 69.6215 27.2065 69.9963 26.7842C70.3695 26.362 70.8867 26.1508 71.5462 26.1508C71.9989 26.1508 72.3886 26.2742 72.7154 26.5196C73.0422 26.7664 73.2056 27.1113 73.2056 27.5544C73.2056 27.8785 73.1051 28.1417 72.9028 28.3409C72.7004 28.5402 72.4066 28.6413 72.0199 28.6413H70.2946C70.404 29.3222 70.7967 29.6642 71.4728 29.6642ZM76.5348 26.1508C76.9545 26.1508 77.2783 26.2638 77.5031 26.4868C77.7279 26.7099 77.8419 27.031 77.8419 27.4473V30.311H76.9335V27.6495C76.9335 27.3849 76.884 27.1961 76.7866 27.0816C76.6877 26.9686 76.5333 26.9106 76.3204 26.9106C75.9217 26.9106 75.499 27.0846 75.0523 27.4295V30.3095H74.1439V26.2534H75.0028V26.7396C75.5155 26.3456 76.0251 26.1479 76.5318 26.1479M80.2897 30.4017C79.5912 30.4017 79.041 30.1905 78.6378 29.7683L79.0216 29.2092C79.4143 29.5393 79.831 29.7043 80.2732 29.7043C80.4905 29.7043 80.6794 29.6612 80.8368 29.575C80.9942 29.4888 81.0736 29.3609 81.0736 29.1944C81.0736 29.1408 81.0646 29.0903 81.0452 29.0442C81.0257 28.9981 80.9957 28.9565 80.9552 28.9178C80.9147 28.8806 80.8743 28.8479 80.8368 28.8212C80.7978 28.7944 80.7424 28.7676 80.6689 28.7409C80.5955 28.7141 80.537 28.6918 80.4935 28.6755C80.4501 28.6591 80.3826 28.6383 80.2927 28.61C80.2027 28.5818 80.1383 28.5639 80.1008 28.5535C79.7081 28.4286 79.4038 28.28 79.1879 28.1075C78.9721 27.935 78.8657 27.6882 78.8657 27.3685C78.8657 26.9849 79.0156 26.6861 79.3154 26.472C79.6151 26.2579 79.9944 26.1508 80.4516 26.1508C81.0137 26.1508 81.4978 26.3025 81.9071 26.6058L81.5398 27.1738C81.1861 26.9418 80.8308 26.8244 80.4771 26.8244C80.2582 26.8244 80.0813 26.869 79.9449 26.9582C79.8085 27.0474 79.7411 27.1619 79.7411 27.3031C79.7411 27.3834 79.762 27.4563 79.8025 27.5187C79.843 27.5812 79.9134 27.6362 80.0109 27.6852C80.1083 27.7343 80.1892 27.7685 80.2522 27.7908C80.3152 27.8131 80.4201 27.8443 80.567 27.8874C80.7963 27.9573 80.9747 28.0198 81.1021 28.0748C81.2295 28.1283 81.3719 28.2026 81.5278 28.2978C81.6837 28.393 81.7961 28.5089 81.8666 28.6472C81.937 28.7855 81.973 28.949 81.973 29.1379C81.973 29.5378 81.8096 29.8486 81.4829 30.0701C81.1561 30.2916 80.7574 30.4031 80.2882 30.4031" fill="#00148A"/></svg>';
var LOGO_PRIME_W = LOGO_PRIME.replace(/#FF9100/g,'currentColor');
function estrelas(n){var s='';for(var i=0;i<n;i++)s+='★';return s;}

/* ---------- 6. PEÇAS REUTILIZÁVEIS ---------- */
function logoHTML(){
  if(C.logo) return '<img class="logo" src="'+esc(C.logo)+'" alt="'+esc(C.cliente)+'">';
  // O placeholder "seu logo aqui" existe SOMENTE no padrão RDC.
  if(C.padrao) return '<div class="logo-ph">seu<br>logo<br>aqui</div>';
  return '<div class="logo-txt">'+esc(C.cliente)+'</div>';
}
function sysbar(light){
  return '<div class="sysbar'+(light?' light':'')+'"><span>16:53</span>'+
   '<span class="ic">▮▮▮ ▲ ▮</span></div>';
}
function headerMarca(){
  return sysbar(true)+'<div class="hd plain">'+logoHTML()+'<div class="div"></div>'+
   '<div class="rot">'+esc(C.rotulo)+'</div>'+
   '<div class="hd-right">'+
     (C.prime? '<span class="badge-prime">'+LOGO_PRIME+'</span>' : '')+
     '<span class="avatar">'+I.user+'</span>'+
   '</div></div>';
}
function headerVolta(titulo,destino){
  return sysbar()+'<div class="hd"><button class="back" data-go="'+destino+'">‹</button>'+
   '<div class="ttl">'+esc(titulo)+'</div></div>';
}
function barraBusca(mostraFiltro){
  var r=resumoBusca();
  return '<div class="searchwrap"><div class="swtitle">Buscar Hospedagens</div><div style="display:flex;gap:10px;align-items:center">'+
   '<div class="search" data-go="motor">'+I.lupa+'<div class="txt"><b>'+esc(r.a)+'</b><small>'+esc(r.b)+'</small></div></div>'+
   (mostraFiltro?'<button class="filtbtn" data-modal="filtros">'+I.filtro+'<span class="n">2</span></button>':'')+
   '</div></div>';
}
function rodape(fixo){
  return '<div class="foot'+(fixo?' fixo':'')+'">'+
   '<div class="cr">© 2026 RDC Viagens.<br>Todos os direitos reservados.'+
     '<a href="#" onclick="return false">Política de Privacidade</a></div>'+
   '<div class="by">Tecnologia e operação<br>turística por<b>'+LOGO_RDC+'</b></div></div>';
}

/* ---------- 6b. PEÇAS DO CHECKOUT ---------- */
function passo(destino, rotulo, n){
  return '<div class="passo"><button class="voltar" data-go="'+destino+'">'+
    '<span class="seta">←</span> Voltar para <b>'+esc(rotulo)+'</b></button>'+
    '<span class="etapa">Etapa '+n+' de 2</span></div>';
}
function campo(rot, val, tipo){
  return '<div class="campo"><label>'+esc(rot)+'</label>'+
    '<input type="'+(tipo||'text')+'" value="'+esc(val||'')+'"></div>';
}
function campoLeitura(rot, val){
  return '<div class="campo travado"><label>'+esc(rot)+'</label>'+
    '<input value="'+esc(val)+'" readonly></div>';
}
function linha2(a,b){ return '<div class="linha2">'+a+b+'</div>'; }
function selectCampo(rot, opcoes){
  return '<div class="campo"><label>'+esc(rot)+'</label><select>'+
    opcoes.map(function(o){return '<option>'+esc(o)+'</option>'}).join('')+'</select></div>';
}
var NOMES=[
 {n:'Ana Clara Silva',  cpf:'470.779.420-31', e:'anasilva@gmail.com',   t:'(011) 98458-3231', d:'16/04/1990'},
 {n:'Rosângela Bueno',  cpf:'748.679.440-33', e:'rosangela@email.com',  t:'(011) 98458-3231', d:'23/07/1990'}
];

/* ---------- 7. TELAS ---------- */
var V = {};

/* Tela de partida do protótipo: a home do app do cliente, quando ele tem uma
   (e o print foi enviado); senão, o portal padrão. */
function telaInicial(){
  return (C.appProprio && C.appProprio.ativo && C.appProprio.imagem) ? 'appcliente' : 'home';
}

V.appcliente = function(){
  var a = C.appProprio || {};
  var h = a.hotspot || {x:3,y:36,w:94,h:7};
  return '<div class="appscreen"><img src="'+esc(a.imagem||'')+'" alt="App '+esc(C.cliente)+'">'+
   '<button class="hot pulse" data-go="home" style="left:'+h.x+'%;top:'+h.y+'%;width:'+h.w+'%;height:'+h.h+'%"></button></div>';
};

V.home = function(){
  return '<div class="portal">'+headerMarca()+
  '<div class="searchwrap home"><div class="search" data-go="motor">'+I.lupa+
    '<div class="txt"><b style="color:var(--ink-3);font-weight:500">Buscar Hospedagens</b></div></div></div>'+
  '<div class="hero grow"><img src="'+img('hero-home.jpg')+'" alt="">'+
    '<div class="cap"><div class="stripe"></div><h2>Há viagens que levam a novos lugares.<br>E há viagens que ficam com a gente para sempre.</h2>'+
    '<p>Escolha o destino da próxima história que você quer viver.</p></div></div>'+
  rodape(true)+'</div>';
};

// Motor de busca: os tres campos em um so lugar (padrao 01-A. Motor)
V.motor = function(){
  function campo(destino,icone,rotulo,valor){
    return '<div class="mfield'+(valor?' ok':'')+'" data-go="'+destino+'">'+icone+
      '<div class="mf-txt">'+(valor? '<label>'+esc(rotulo)+'</label><b>'+esc(valor)+'</b>'
                                   : '<span class="ph">'+esc(rotulo)+'</span>')+'</div></div>';
  }
  var datas = (S.ini&&S.fim) ? dt(S.ini)+' - '+dt(S.fim) : null;
  var hosp  = S.adultos+' adulto'+(S.adultos>1?'s':'')+
              (S.criancas? ' . '+S.criancas+' criança'+(S.criancas>1?'s':''):'')+
              ' . '+S.quartos+' quarto'+(S.quartos>1?'s':'');
  var pronto = !!S.cidade;
  return sysbar()+'<div class="hd hd-motor"><div class="ttl">Buscar Hospedagens</div>'+
    '<button class="closex" data-go="home">✕</button></div>'+
   '<div class="mfields">'+
    campo('destino', I.pin, 'Para aonde deseja ir?', S.cidade ? S.cidade+(S.uf?', '+S.uf:'') : null)+
    campo('datas',   I.cal, 'Quando?', datas)+
    campo('hospedes',I.ppl, 'Hóspedes', hosp)+
   '</div>'+
   '<div class="fixcta on"><button class="btn block'+(pronto?'':' off')+'" '+
     (pronto?'data-go="resultados"':'data-go="destino"')+'>Buscar '+I.lupa+'</button></div>';
};

V.destino = function(){
  return headerVolta('Para aonde deseja ir?','motor')+
  '<div class="field" style="position:relative">'+I.pin+
   '<label>Para onde deseja ir?</label>'+
   '<input id="qDest" placeholder="Digite uma cidade" autocomplete="off" value="'+esc(S.cidade||'')+'">'+
   '<button class="x" id="qClear">✕</button></div>'+
  '<div id="qList"></div>';
};

V.datas = function(){
  var hoje=new Date(), y=hoje.getFullYear(), m=hoje.getMonth();
  var html='';
  for(var k=0;k<4;k++){ html += mesHTML(y, m+k); }
  return '<div class="stickytop">'+sysbar()+'<div class="hd"><button class="back" data-go="motor">‹</button><div class="ttl">Quando?</div></div>'+
   '<div class="wk">'+WK.map(function(w){return '<span>'+w+'</span>'}).join('')+'</div></div>'+
   '<div style="padding-bottom:8px">'+html+'</div>'+
   '<div class="fixcta on rodape-datas">'+
     '<div class="switchrow"><div class="sw" id="swData"><i></i></div>'+
     '<span>Ainda não defini as datas</span></div>'+
     '<button class="btn block" id="okDatas">Continuar '+I.chev+'</button>'+
   '</div>';
};
function mesHTML(y,m){
  var d=new Date(y,m,1), ini=d.getDay(), tot=new Date(y,m+1,0).getDate(), out='';
  for(var i=0;i<ini;i++) out+='<div class="day off"></div>';
  for(var n=1;n<=tot;n++){
    var cur=new Date(y,m,n), cls='day', t=cur.getTime();
    if(S.ini&&S.fim&&t>S.ini.getTime()&&t<S.fim.getTime()) cls+=' rng';
    if(S.ini&&t===S.ini.getTime()) cls+=' sel'+(S.fim?' a rng':'');
    if(S.fim&&t===S.fim.getTime()) cls+=' sel b rng';
    out+='<div class="'+cls+'" data-d="'+y+'-'+m+'-'+n+'"><span>'+n+'</span></div>';
  }
  return '<div class="mon">'+MES[((m%12)+12)%12]+' · '+(y+Math.floor(m/12))+'</div><div class="days">'+out+'</div>';
}

V.hospedes = function(){
  function st(lb,sub,key,min){
    return '<div class="stepper"><div class="lb">'+lb+'<small>'+sub+'</small></div>'+
    '<div class="ct"><button data-step="'+key+'" data-v="-1"'+(S[key]<=min?' disabled':'')+'>−</button>'+
    '<span class="n">'+S[key]+'</span><button data-step="'+key+'" data-v="1">+</button></div></div>';
  }
  return headerVolta('Hóspedes','motor')+
   st('Adultos','13 anos ou mais','adultos',1)+
   st('Crianças','0 a 12 anos','criancas',0)+
   st('Quartos','','quartos',1)+
   '<div class="fixcta on"><button class="btn block" data-go="motor">Confirmar</button></div>';
};

V.resultados = function(){
  var n=noites()||5;
  return headerMarca()+barraBusca(true)+
   '<div class="count"><b>189</b> hotéis encontrados para<br><b>'+esc(S.cidade||'Rio de Janeiro')+(S.uf?', '+S.uf:'')+'</b></div>'+
   HOTEIS.map(function(h){
     return '<div class="card" data-hotel="'+h.id+'">'+
      '<div class="ph"><img src="'+img(h.img)+'" alt="">'+
        '<span class="gnav l">‹</span><span class="gnav r">›</span></div>'+
      '<div class="bd"><h4>'+esc(h.n)+'</h4>'+
      '<div class="loc">'+esc(S.cidade||'Rio de Janeiro')+(S.uf?', '+S.uf:'')+' - ('+h.cat+')</div>'+
      '<div class="stars">'+estrelas(h.e)+'</div>'+
      '<div class="amen">'+I.rest+I.cafe+I.wifi+'</div>'+
      '<div class="cancel">'+I.check+' Verifique as condições de cancelamento</div>'+
      '<div class="pricebox"><div><div class="n">'+n+' noites a partir de</div>'+
        (C.prime?'<div class="prime">'+LOGO_PRIME+I.info+'</div>':'')+
        '<div class="v"><small>R$</small> '+money(h.por).replace('R$ ','')+'</div>'+
        '<div class="par">Em até 6x sem juros.</div></div>'+
      '<button class="btn">Ver hotel</button></div></div></div>';
   }).join('')+
   '<div class="pager"><span>‹</span><b class="on">1</b><b>2</b><b>3</b><span>›</span></div>'+
   rodape();
};

V.hotel = function(){
  var h=S.hotel||HOTEIS[0];
  var escolhido = S.quartoIdx !== null;
  return headerMarca()+barraBusca(false)+
   '<div class="body" style="padding-bottom:6px"><h3 style="font-size:20px;margin-bottom:4px">'+esc(h.n)+'</h3>'+
   '<div style="font-size:12.5px;color:var(--ink-3)">'+esc(h.end)+', '+esc(S.cidade||'Rio de Janeiro')+' - Brasil</div>'+
   '<div class="stars" style="margin-top:6px">'+estrelas(h.e)+'</div></div>'+
   '<div class="tabs"><div class="tab on" data-sec="v">Visão geral</div>'+
     '<div class="tab" data-sec="s">Sobre</div>'+
     '<div class="tab" data-sec="q">Quartos</div></div>'+
   // pagina unica: as abas so rolam ate a secao
   '<div class="sec-anchor" id="sec-v"></div>'+ secVisaoGeral() +
   '<div class="sec-anchor" id="sec-s"></div>'+ secSobre() +
   '<div class="sec-anchor" id="sec-q"></div>'+ secQuartos() +
   rodape()+
   (escolhido ? '' : '<div class="fixcta on"><button class="btn block" data-sec="q">Escolher quarto</button></div>');
};

function comodidades(){
  return '<h3>Comodidades</h3>'+
   '<div class="comod">'+I.ac+'<span>Ar condicionado</span></div>'+
   '<div class="comod">'+I.cafe+'<span>Café da manhã</span></div>'+
   '<div class="comod">'+I.wifi+'<span>Wi-fi grátis</span></div>'+
   '<a class="link" onclick="return false" href="#">+ Mais detalhes</a>';
}
function fotos(){
  return '<div class="fotos"><img class="big" src="'+img('hotel-hero.jpg')+'" alt="">'+
   '<div class="thumbs"><img src="'+img('quarto-1.jpg')+'" alt=""><img src="'+img('hotel-4.jpg')+'" alt=""></div></div>';
}
function secVisaoGeral(){ return fotos(); }
function secSobre(){
  var h=S.hotel||HOTEIS[0];
  return '<div class="body"><h3>Sobre o hotel</h3><p>'+esc(h.d)+'</p>'+
   comodidades()+
   '<h3 style="margin-top:20px">Políticas</h3>'+
   '<p>Check-in a partir das 15h · Check-out até 12h · Cancelamento grátis conforme a regra da tarifa.</p></div>';
}
function quartosInner(){
  return '<h3 style="font-size:17px;margin-bottom:12px">Quartos disponíveis</h3>'+
    QUARTOS.map(cardQuarto).join('')+
    '<a class="link mais" onclick="return false" href="#">Mostrar mais quartos '+I.down+'</a>';
}
function secQuartos(){ return '<div class="body" id="quartosBody">'+quartosInner()+'</div>'; }
function redesenharQuartos(){
  var el=document.getElementById('quartosBody');
  if(el) el.innerHTML = quartosInner();
}

// Cartao do quarto com as duas ofertas (padrao Card/Hotel/Detalhes/Quarto)
function cardQuarto(q,i){
  var h=S.hotel||HOTEIS[0];
  var comPrime = h.por + q.dif, semPrime = h.de + q.dif, economia = semPrime - comPrime;
  var selCom = (S.quartoIdx===i && S.prime), selSem = (S.quartoIdx===i && !S.prime);
  var ofertas;
  if(C.prime){
    ofertas =
     '<div class="oferta com'+(selCom?' sel':'')+'" data-opt="'+i+':1">'+
       '<div class="of-top"><span class="radio">'+(selCom?I.check:'')+'</span>'+
       '<span class="of-tit">Com '+(selCom?LOGO_PRIME_W:LOGO_PRIME)+'</span>'+
       '<span class="melhor">Melhor opção</span></div>'+
       '<div class="of-mes">→ R$ 29,90/mês</div>'+
       '<div class="of-preco"><small>R$</small> '+money(comPrime).replace('R$ ','')+'</div>'+
       '<div class="of-eco">Economize <u>'+money(economia)+'</u>.</div>'+
       '<div class="of-par">Pague em até 6x sem juros.</div>'+
     '</div>'+
     '<div class="oferta sem'+(selSem?' sel':'')+'" data-opt="'+i+':0">'+
       '<div class="of-top"><span class="radio">'+(selSem?I.check:'')+'</span>'+
       '<span class="of-tit">Sem Prime</span></div>'+
       '<div class="of-preco"><small>R$</small> '+money(semPrime).replace('R$ ','')+'</div>'+
       '<div class="of-eco">Valor público.</div>'+
       '<div class="of-par">Pague em até 6x sem juros.</div>'+
     '</div>';
  } else {
    ofertas =
     '<div class="oferta sem'+(S.quartoIdx===i?' sel':'')+'" data-opt="'+i+':0">'+
       '<div class="of-preco"><small>R$</small> '+money(semPrime).replace('R$ ','')+'</div>'+
       '<div class="of-par">Pague em até 6x sem juros.</div>'+
     '</div>';
  }
  return '<div class="quarto">'+
    '<h4>'+esc(q.n)+'</h4>'+
    '<p class="q-desc">'+esc(q.d)+'</p>'+
    '<div class="q-amen">'+I.rest+I.cafe+I.wifi+I.tv+
      '<a class="link" onclick="return false" href="#">+ Mais detalhes</a></div>'+
    '<div class="q-pes">'+I.ppl+' Acomoda até '+q.pes+' pessoas</div>'+
    '<div class="flag mini">'+I.check+' Reembolsável até 05 de dez.</div>'+
    ofertas+
  '</div>';
}

/* ---------- Resumo da reserva: bottom sheet ---------- */
function resumoHTML(comBotao){
  var h=S.hotel||HOTEIS[0], q=S.quarto||QUARTOS[0], idx=(S.quartoIdx===null?0:S.quartoIdx)+1;
  var ini=S.ini||new Date(), fim=S.fim||new Date(Date.now()+5*864e5);
  var comPrime = h.por + q.dif, semPrime = h.de + q.dif, economia = semPrime - comPrime;
  var usaPrime = C.prime && S.prime;
  var total = usaPrime
    ? '<div class="t-tit">Total com '+LOGO_PRIME+'</div>'+
      '<div class="from">de '+money(semPrime)+'</div>'+
      '<div class="now"><span>por</span> '+money(comPrime)+'</div>'+
      '<div class="par">Em até 6x sem juros.</div>'+
      '<div class="eco2">Inclui assinatura mensal de <b>R$ 29,90</b> e gera economia de '+
        '<b class="verde">'+money(economia)+'</b> nesta reserva.</div>'+
      '<div class="primebox">Entenda o '+LOGO_PRIME+'<span class="chev">›</span></div>'
    : '<div class="t-tit">Total</div>'+
      '<div class="now">'+money(semPrime)+'</div>'+
      '<div class="par">Em até 6x sem juros.</div>';
  return '<div class="tile">'+I.cama+' Quarto '+idx+' | '+esc(q.n)+'</div>'+
   '<div class="dates"><div><div class="lb">'+I.in+' Check-in</div><div class="dw">'+DIA[ini.getDay()]+'</div>'+
     '<div class="dd">'+ini.getDate()+' '+MES3[ini.getMonth()]+'. '+ini.getFullYear()+'</div></div>'+
     '<div style="text-align:right"><div class="lb" style="justify-content:flex-end">'+I.out+' Check-out</div>'+
     '<div class="dw">'+DIA[fim.getDay()]+'</div><div class="dd">'+fim.getDate()+' '+MES3[fim.getMonth()]+'. '+fim.getFullYear()+'</div></div></div>'+
   '<div class="flag">'+I.check+' Reembolsável até '+d2(ini.getDate()-7>0?ini.getDate()-7:1)+' de '+MES3[ini.getMonth()]+'.</div>'+
   '<div class="hr"></div>'+
   '<div class="total">'+total+'</div>'+
   (comBotao ? '<div class="avancar-wrap">'+
     '<button class="btn avancar" data-go="checkout">Avançar '+I.chev+'</button></div>'
    : '<div style="height:18px"></div>');
}

var sheetAberto = false;
var ALTURA_BARRA = 62;

function montarSheet(animarEntrada){
  var velho = document.getElementById('sheet');
  if(velho) velho.parentNode.removeChild(velho);
  if(S.quartoIdx === null) return;
  var d = document.createElement('div');
  d.id = 'sheet';
  // nasce fechado quando vai animar a entrada; senao ja nasce no estado certo
  d.className = 'sheet' + ((animarEntrada || !sheetAberto) ? ' fechado' : '');
  d.innerHTML = '<div class="sheet-bar" id="sheetBar"><span class="puxador"></span>'+
      I.carrinho+' Resumo da reserva<span class="chev">'+I.down+'</span></div>'+
    '<div class="sheet-body">'+resumoHTML(atual==='hotel')+'</div>';
  vp.appendChild(d);
  ligarArrasto(d);
  var sc = document.getElementById('scr');
  if(sc) sc.classList.add('with-sheet');
  if(animarEntrada && sheetAberto){
    void d.offsetHeight;                       // força o layout antes de animar
    requestAnimationFrame(function(){ d.classList.remove('fechado'); });
  }
}
function atualizarResumo(){
  var b = document.querySelector('.sheet-body');
  if(b) b.innerHTML = resumoHTML(atual==='hotel');
}
function alternarSheet(){
  var d = document.getElementById('sheet'); if(!d) return;
  sheetAberto = !sheetAberto;
  d.classList.toggle('fechado', !sheetAberto);
}
function abrirSheet(){
  var d = document.getElementById('sheet'); if(!d || sheetAberto) return;
  sheetAberto = true; d.classList.remove('fechado');
}

/* arrastar a barra para abrir/fechar, seguindo o dedo */
function ligarArrasto(d){
  var bar = d.querySelector('.sheet-bar');
  var y0 = 0, base = 0, curso = 0, ativo = false, movido = 0, t0 = 0;
  function curso_(){ return Math.max(1, d.offsetHeight - ALTURA_BARRA); }
  bar.addEventListener('pointerdown', function(e){
    ativo = true; movido = 0; t0 = Date.now();
    y0 = e.clientY; curso = curso_(); base = sheetAberto ? 0 : curso;
    d.classList.add('arrastando');
    try{ bar.setPointerCapture(e.pointerId); }catch(err){}
  });
  bar.addEventListener('pointermove', function(e){
    if(!ativo) return;
    movido = e.clientY - y0;
    var pos = Math.min(curso, Math.max(0, base + movido));
    d.style.transform = 'translate3d(0,'+pos+'px,0)';
  });
  function soltar(e){
    if(!ativo) return;
    ativo = false;
    d.classList.remove('arrastando');
    d.style.transform = '';
    var rapido = Math.abs(movido) > 40 && (Date.now()-t0) < 300;
    var passou = Math.abs(movido) > curso * 0.28;
    if((rapido || passou) && ((sheetAberto && movido > 0) || (!sheetAberto && movido < 0))){
      sheetAberto = !sheetAberto;
    } else if(Math.abs(movido) < 6){
      sheetAberto = !sheetAberto;              // toque simples = alternar
    }
    d.classList.toggle('fechado', !sheetAberto);
    try{ bar.releasePointerCapture(e.pointerId); }catch(err){}
  }
  bar.addEventListener('pointerup', soltar);
  bar.addEventListener('pointercancel', soltar);
}

V.checkout = function(){
  var q=S.quarto||QUARTOS[0], idx=(S.quartoIdx===null?0:S.quartoIdx)+1;
  var blocos='';
  for(var i=0;i<S.adultos;i++){
    var d=NOMES[i]||{n:'',cpf:'',e:'',t:'',d:''};
    var aviso = (i===0)
      ? 'Será responsável pelo check-in e check-out.<br>Deve ter idade acima de 18 anos.'
      : 'Deve ter idade acima de 18 anos.';
    blocos += '<h4 class="hosp">'+(i+1)+'º hóspede - Adulto</h4>'+
      '<div class="aviso">'+I.alerta+'<span>'+aviso+'</span></div>'+
      campo('Nome completo', d.n)+ campo('CPF', d.cpf)+
      campo('E-mail', d.e, 'email')+ campo('Telefone', d.t)+
      campo('Data de nascimento', d.d);
  }
  for(var c=0;c<S.criancas;c++){
    blocos += '<h4 class="hosp">'+(c+1)+'ª criança</h4>'+
      '<div class="aviso">'+I.alerta+'<span>Documento de identidade obrigatório no check-in.</span></div>'+
      campo('Nome completo','')+ campo('Data de nascimento','');
  }
  return headerMarca()+
   passo('hotel','Hotel',1)+
   '<h2 class="tituloEtapa">Hóspedes</h2>'+
   '<div class="tile">'+I.cama+' Quarto '+idx+' | '+esc(q.n)+'</div>'+
   blocos+
   '<div class="acao"><button class="btn avancar" data-go="pagamento">Ir para pagamento '+I.chev+'</button></div>'+
   rodape();
};

V.pagamento = function(){
  var h=S.hotel||HOTEIS[0], q=S.quarto||QUARTOS[0];
  var total = (C.prime && S.prime) ? (h.por+q.dif) : (h.de+q.dif);
  var doisCartoes = S.cartoes===2;
  var v1 = 200, v2 = total - v1;

  function blocoCartao(titulo, num, nome, val, cvv, valor, parc, marcado){
    return (titulo? '<h5 class="cartaoTit">'+titulo+'</h5>'+
       '<div class="assinar'+(marcado?' on':'')+'"><span class="radio">'+(marcado?I.check:'')+'</span>'+
       '<span>Assinar RDC Prime e pagar o Viaje Tranquilo neste cartão.</span></div>' : '')+
      campo('Número do Cartão', num)+ campo('Nome no cartão', nome)+
      linha2(campo('Validade', val), campo('CVV', cvv))+
      (valor!==null ? campoLeitura('Valor neste cartão', money(valor)) : '')+
      (parc!==null ? selectCampo('Parcelamento', ['6x '+money(parc/6), '3x '+money(parc/3), '1x '+money(parc)]) : '');
  }

  var opcao1 =
    '<div class="opcaoPag'+(doisCartoes?'':' sel')+'" data-pay="1">'+
      '<div class="op-cab"><span class="radio">'+(doisCartoes?'':I.check)+'</span>'+
      '<div><b>Pagar com 1 Cartão</b><small>Em até 6x sem juros.</small></div>'+
      '<span class="op-ic">'+I.cartao+'</span></div>'+
      (doisCartoes ? '' :
        '<div class="op-corpo">'+blocoCartao(null,'4196 6485 6739 8526','Ana Clara Silva','11/2026','174',null,total)+'</div>')+
    '</div>';

  var opcao2 =
    '<div class="opcaoPag'+(doisCartoes?' sel':'')+'" data-pay="2">'+
      '<div class="op-cab"><span class="radio">'+(doisCartoes?I.check:'')+'</span>'+
      '<div><b>Pagar com 2 Cartões</b><small>Em até 6x sem juros.</small></div>'+
      '<span class="op-ic">'+I.cartao+I.cartao+'</span></div>'+
      (doisCartoes ?
        '<div class="op-corpo">'+
          blocoCartao('Cartão 1','4196 6485 6739 8526','Ana Clara Silva','11/2026','174',v1,null,true)+
          blocoCartao('Cartão 2','5395 1919 3039 4142','Ana Silva','02/2028','344',v2,v2,false)+
        '</div>' : '')+
    '</div>';

  return headerMarca()+
   passo('checkout','Hóspedes',2)+
   '<h2 class="tituloEtapa">Pagamento</h2>'+
   opcao1 + opcao2 +
   '<h2 class="tituloEtapa" style="margin-top:24px">Informações importantes</h2>'+
   '<p class="txt corta4">Para hospedagem para menores de 18 anos é exigida a apresentação de documento de identidade '+
   '(RG ou Certidão de Nascimento) quando acompanhado dos pais ou responsável legal. Em caso de menor em viagem '+
   'desacompanhado, é necessária autorização judicial ou dos responsáveis, conforme a legislação vigente.</p>'+
   '<a class="link dir" onclick="return false" href="#">Saiba mais '+I.down+'</a>'+
   '<h2 class="tituloEtapa">Acomodação</h2>'+
   '<p class="txt">A criança em idade cortesia é acomodada na mesma cama dos pais.</p>'+
   '<div class="termo" data-check="1"><span class="quadro"></span>'+
     '<span>Li e aceito os <a onclick="return false" href="#">Termos do RDC Prime, Condições de compra</a> e '+
     '<a onclick="return false" href="#">Política de privacidade.</a></span></div>'+
   '<div class="termo" data-check="2"><span class="quadro"></span>'+
     '<span>Li e compreendi que o cancelamento pode ser realizado até <b>05/12/2026</b> sem nenhum ônus.</span></div>'+
   '<div class="acao"><button class="btn avancar off" data-go="conclusao">Concluir reserva '+I.okcirc+'</button></div>'+
   rodape();
};

V.conclusao = function(){
  var h=S.hotel||HOTEIS[0], q=S.quarto||QUARTOS[0];
  var comPrime = h.por + q.dif, semPrime = h.de + q.dif, economia = semPrime - comPrime;
  var novoAssinante = C.prime && S.prime;
  var email = '<b>'+esc(S.email)+'</b>';

  var fecho = '<div class="boa">Tenha uma boa viagem!</div>'+
    '<div style="padding:0 16px 22px"><button class="btn ghost casa" data-go="'+telaInicial()+'">'+
      I.casa+' Voltar para Início</button></div>'+ rodape();

  if(!novoAssinante){
    // 04. Conclusão/Corporativo — fechamento sem Prime
    return headerMarca()+
      '<div class="fim-card destaque">'+
        '<div class="fim-topo"><span class="fim-ico">'+I.mala+'</span>'+
        '<div><h3>Recebemos sua solicitação</h3>'+
        '<p>Sua solicitação de reserva foi recebida e já está sendo processada.</p></div></div>'+
      '</div>'+
      '<div class="fim-card">'+
        '<span class="fim-ico plano">'+I.mail+'</span>'+
        '<p>Estamos confirmando os detalhes da viagem. Assim que o processo for concluído, '+
        'enviaremos todas as informações para o e-mail '+email+'</p>'+
      '</div>'+
      '<div class="fim-foto"><img src="'+img('fim-sem.jpg')+'" alt="">'+
        '<span>Sua viagem,<br>nosso compromisso.</span></div>'+
      fecho;
  }

  // 04. Conclusão/Novo assinante — fechou com Prime e ainda não era assinante
  return headerMarca()+
   '<div class="fim-hero"><img src="'+img('fim-prime.jpg')+'" alt="">'+
     '<span>Que esta seja a primeira<br>de muitas viagens com<br>mais economia.</span></div>'+
   '<div class="fim-card destaque">'+
     '<div class="fim-topo"><span class="fim-ico">'+I.mala+'</span>'+
     '<div><h3>Recebemos sua solicitação</h3>'+
     '<p>Sua solicitação de reserva e de assinatura do <b>RDC Prime</b> foi recebida e já está sendo processada.</p></div></div>'+
     '<div class="hr" style="margin:14px 0"></div>'+
     '<p class="fim-eco">Ao escolher o RDC Prime, você economizou <b>'+money(economia)+'</b> nesta reserva.</p>'+
   '</div>'+
   '<div class="fim-card">'+
     '<h4>Reserva</h4><div class="status espera">'+I.relogio+' Em processamento</div>'+
     '<h4 style="margin-top:16px">RDC Prime</h4><div class="status espera">'+I.relogio+' Ativação em processamento</div>'+
   '</div>'+
   '<div class="fim-card">'+
     '<span class="fim-ico plano">'+I.mail+'</span>'+
     '<p>Estamos confirmando os detalhes da viagem e ativando sua assinatura. Assim que o processo for concluído, '+
     'enviaremos todas as informações para o e-mail '+email+'</p>'+
     '<div class="hr" style="margin:16px 0"></div>'+
     '<span class="fim-ico plano">'+I.okcirc+'</span>'+
     '<p>Com o RDC Prime ativo, você poderá encontrar <b>descontos de até 40% em serviços turísticos selecionados</b> '+
     'e criar mais oportunidades de viajar ao longo do ano.</p>'+
   '</div>'+
   fecho;
};

/* ---------- 8. MODAIS ---------- */
var M = {};
M.filtros = function(){
  return '<div class="grab"></div><div class="sec"><h3>Filtros</h3></div>'+
   '<div class="sec" style="padding-top:6px"><p class="sub">Faixa de preço por noite</p></div>'+
   '<div class="chips" style="padding-left:16px"><div class="chip on">Até R$ 400</div><div class="chip">R$ 400–800</div><div class="chip">R$ 800+</div></div>'+
   '<div class="sec" style="padding-top:6px"><p class="sub">Categoria</p></div>'+
   '<div class="chips" style="padding-left:16px"><div class="chip">3★</div><div class="chip on">4★</div><div class="chip">5★</div></div>'+
   '<div class="sec" style="padding-top:6px"><p class="sub">Comodidades</p></div>'+
   '<div class="chips" style="padding-left:16px"><div class="chip">Café da manhã</div><div class="chip">Piscina</div><div class="chip">Pet friendly</div></div>'+
   '<div style="padding:14px 16px 4px"><button class="btn block" data-close="1">Aplicar filtros</button></div>';
};

/* ---------- 9. NAVEGAÇÃO ---------- */
var vp, modal, atual='home', tabAtual='v';
function go(id){
  if(!V[id]) return;
  atual=id;
  vp.innerHTML='<div class="screen on" id="scr">'+V[id]()+'</div>';
  var s=document.getElementById('scr');
  // As barras fixas saem do container que rola e passam a viver no viewport,
  // senao elas rolam junto com o conteudo e somem no meio da tela.
  var fixos = s.querySelectorAll('.fixcta, .fixbar');
  for(var f=0; f<fixos.length; f++) vp.appendChild(fixos[f]);
  if(id==='hotel'){ montarSheet(); ligarEspia(); }
  if(id==='checkout' || id==='pagamento'){ sheetAberto = false; montarSheet(); }
  if(id==='home') s.classList.add('noscroll');
  if(id==='datas') s.classList.add('with-cta-datas');
  if(document.querySelector('.fixcta.on')) s.classList.add('with-cta');
  if(document.querySelector('.fixbar.on')) s.classList.add('with-bar');
  s.scrollTop=0;
  if(id==='destino'){
    var q=document.getElementById('qDest'); listaDestinos(q.value);
    // no celular o teclado não sobe sozinho: atrapalha ver as últimas pesquisas
    var dedo = window.matchMedia && window.matchMedia('(pointer:coarse)').matches;
    if(!dedo) setTimeout(function(){q.focus();q.select()},60);
  }
  window.scrollTo(0,0);
}
window.TC_GO=go;
function abrirModal(nome){
  modal.innerHTML='<div class="bk" data-close="1"></div><div class="sh">'+M[nome]()+'</div>';
  modal.classList.add('on');
}
function fecharModal(){ modal.classList.remove('on'); modal.innerHTML=''; }

/* ---------- 10. BUSCA DE DESTINO ---------- */
function semAcento(x){
  return x.normalize ? x.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()
                     : x.toLowerCase();
}
function ondeCidade(c){ return c.uf ? c.uf : c.p; }
var LIMITE_DESTINOS = 8;

function listaDestinos(termo){
  var el=document.getElementById('qList'); if(!el) return;
  var t=termo.trim().toLowerCase();

  // vazio -> últimas pesquisas
  if(!t){
    if(!HIST.length){
      el.innerHTML='<div class="vazio">Comece a digitar o nome de uma cidade ou de um hotel.</div>';
      return;
    }
    el.innerHTML='<div class="grouptitle row">Últimas pesquisas'+
      '<button class="linkbtn" id="limparHist">Limpar</button></div>'+
      HIST.map(function(c){
        return '<div class="opt hist" data-pick=\''+JSON.stringify(c)+'\'>'+I.hist+
          '<div>'+esc(c.n)+'<span class="onde">, '+esc(ondeCidade(c))+'</span></div></div>';
      }).join('');
    return;
  }

  // digitando -> cidades. Busca ignora acento e ordena: começa com > palavra > contém.
  var tt = semAcento(t);
  var achados = [];
  for(var k=0;k<CIDADES.length;k++){
    var c = CIDADES[k], sn = semAcento(c.n), i = sn.indexOf(tt);
    if(i < 0) continue;
    var peso = (i === 0) ? 0 : (sn.charAt(i-1) === ' ' || sn.charAt(i-1) === '-') ? 1 : 2;
    achados.push({c:c, i:i, peso:peso});
  }
  if(!achados.length){
    el.innerHTML='<div class="vazio">Nenhum destino encontrado para “'+esc(termo.trim())+'”.<br>'+
      'Tente só o começo do nome — por exemplo, <b>san</b> para Santos.</div>';
    return;
  }
  achados.sort(function(a,b){
    if(a.peso !== b.peso) return a.peso - b.peso;
    var ba = a.c.p === 'Brasil' ? 0 : 1, bb = b.c.p === 'Brasil' ? 0 : 1;
    if(ba !== bb) return ba - bb;                       // destino nacional primeiro
    if(a.c.n.length !== b.c.n.length) return a.c.n.length - b.c.n.length;
    return a.c.n.localeCompare(b.c.n);
  });
  var sobra = achados.length - LIMITE_DESTINOS;
  var topo = achados.slice(0, LIMITE_DESTINOS);
  el.innerHTML='<div class="grouptitle">Cidade</div>'+topo.map(function(r){
    var nome=r.c.n, i=r.i, n=t.length;
    var marca=esc(nome.slice(0,i))+'<em>'+esc(nome.slice(i,i+n))+'</em>'+esc(nome.slice(i+n));
    return '<div class="opt" data-pick=\''+JSON.stringify(r.c)+'\'><div>'+marca+
      '<span class="onde">, '+esc(ondeCidade(r.c))+'</span></div></div>';
  }).join('')+
  (sobra>0 ? '<div class="vazio">+'+sobra+' destino'+(sobra>1?'s':'')+' com esse nome. Continue digitando para refinar.</div>' : '')+
  '<div class="hr"></div><div class="grouptitle">Hotel</div>'+
  '<div class="vazio">Hotéis com esse nome aparecem aqui.</div>';
}

/* ---------- 10b. PÁGINA ÚNICA: abas rolam até a seção ---------- */
function alturaAbas(){
  var tb=document.querySelector('.tabs');
  return tb ? tb.offsetHeight : 46;
}
function irParaSecao(k){
  var alvo=document.getElementById('sec-'+k), sc=document.getElementById('scr');
  if(!alvo||!sc) return;
  var y = alvo.offsetTop - alturaAbas();
  if(sc.scrollTo) sc.scrollTo({top:y, behavior:'smooth'}); else sc.scrollTop=y;
  marcarAba(k);
}
function marcarAba(k){
  var abas=document.querySelectorAll('.tabs .tab');
  for(var i=0;i<abas.length;i++){
    abas[i].classList.toggle('on', abas[i].getAttribute('data-sec')===k);
  }
}
function ligarEspia(){
  var sc=document.getElementById('scr'); if(!sc) return;
  var chaves=['v','s','q'];
  sc.addEventListener('scroll', function(){
    var topo = sc.scrollTop + alturaAbas() + 12, atualK='v';
    for(var i=0;i<chaves.length;i++){
      var el=document.getElementById('sec-'+chaves[i]);
      if(el && el.offsetTop <= topo) atualK=chaves[i];
    }
    marcarAba(atualK);
  }, {passive:true});
}

/* ---------- 11. EVENTOS ---------- */
function bind(){
  document.addEventListener('click',function(e){
    var t=e.target.closest('[data-go],[data-modal],[data-close],[data-cidade],[data-hotel],[data-opt],[data-pay],[data-check],[data-sec],#sheetBar,[data-step],[data-pick],[data-d],.chip,.paytab .p');
    if(!t) return;

    if(t.hasAttribute('data-close')){ fecharModal(); return; }
    if(t.hasAttribute('data-modal')){ abrirModal(t.getAttribute('data-modal')); return; }

    if(t.hasAttribute('data-pick')){
      var c=JSON.parse(t.getAttribute('data-pick'));
      S.cidade=c.n; S.uf=c.uf; S.pais=c.p; guardarHist(c); go('datas'); return;
    }
    if(t.hasAttribute('data-cidade')){
      var nome=t.getAttribute('data-cidade');
      var f=CIDADES.filter(function(c){return c.n===nome})[0]||{n:nome,uf:'',p:'Brasil'};
      S.cidade=f.n; S.uf=f.uf; S.pais=f.p; guardarHist(f); go('datas'); return;
    }
    if(t.hasAttribute('data-d')){
      if(t.classList.contains('off')) return;
      var p=t.getAttribute('data-d').split('-');
      var d=new Date(+p[0],+p[1],+p[2]);
      if(!S.ini || (S.ini&&S.fim) || d<=S.ini){ S.ini=d; S.fim=null; }
      else { S.fim=d; }
      var sc=document.getElementById('scr').scrollTop;
      go('datas'); document.getElementById('scr').scrollTop=sc; return;
    }
    if(t.hasAttribute('data-step')){
      var k=t.getAttribute('data-step'), v=+t.getAttribute('data-v');
      var min = k==='criancas'?0:1;
      S[k]=Math.max(min,Math.min(9,S[k]+v)); go('hospedes'); return;
    }
    if(t.hasAttribute('data-hotel')){
      S.hotel=HOTEIS.filter(function(h){return h.id==t.getAttribute('data-hotel')})[0];
      tabAtual='v'; go('hotel'); return;
    }
    if(t.hasAttribute('data-pay')){
      S.cartoes = +t.getAttribute('data-pay');
      var sy=document.getElementById('scr').scrollTop;
      go('pagamento'); document.getElementById('scr').scrollTop=sy; return;
    }
    if(t.hasAttribute('data-check')){
      t.classList.toggle('on');
      var total=document.querySelectorAll('.termo').length;
      var aceitos=document.querySelectorAll('.termo.on').length;
      var bt=document.querySelector('.acao [data-go=conclusao]');
      if(bt) bt.classList.toggle('off', aceitos < total);
      return;
    }
    if(t.hasAttribute('data-opt')){
      var pr=t.getAttribute('data-opt').split(':');
      var primeira = (S.quartoIdx === null);
      S.quartoIdx=+pr[0]; S.quarto=QUARTOS[S.quartoIdx]; S.prime = pr[1]==='1';
      redesenharQuartos();
      var fc=document.querySelector('.fixcta');
      if(fc && fc.parentNode) fc.parentNode.removeChild(fc);
      if(primeira){ sheetAberto = true; montarSheet(true); }
      else { atualizarResumo(); abrirSheet(); }
      return;
    }
    if(t.hasAttribute('data-sec')){ irParaSecao(t.getAttribute('data-sec')); return; }
    if(t.hasAttribute('data-tab')||t.hasAttribute('data-tabgo')){
      tabAtual=t.getAttribute('data-tab')||t.getAttribute('data-tabgo');
      go('hotel');
      if(t.hasAttribute('data-tabgo')) document.getElementById('scr').scrollTop=260;
      return;
    }
    if(t.classList.contains('chip')){
      var box=t.parentNode; Array.prototype.forEach.call(box.children,function(c){c.classList.remove('on')});
      t.classList.add('on'); return;
    }
    if(t.parentNode&&t.parentNode.classList.contains('paytab')){
      Array.prototype.forEach.call(t.parentNode.children,function(c){c.classList.remove('on')});
      t.classList.add('on'); return;
    }
    if(t.hasAttribute('data-go')){
      if(t.classList.contains('off')) return;
      if(t.getAttribute('data-go')==='conclusao'){
        var em=document.getElementById('inpEmail');
        if(em && em.value.trim()) S.email = em.value.trim();
      }
      go(t.getAttribute('data-go')); return;
    }
  });

  document.addEventListener('input',function(e){
    if(e.target.id==='qDest') listaDestinos(e.target.value);
  });
  document.addEventListener('click',function(e){
    if(e.target.id==='limparHist'){ HIST=[]; listaDestinos(''); return; }
    if(e.target.id==='qClear'){ var q=document.getElementById('qDest'); q.value=''; listaDestinos(''); q.focus(); }
    if(e.target.id==='okDatas'){
      if(!S.ini){ var h=new Date(); h.setHours(0,0,0,0); S.ini=new Date(h.getTime()+20*864e5); }
      if(!S.fim) S.fim=new Date(S.ini.getTime()+5*864e5);
      go('motor');
    }
    var sw=e.target.closest('#swData');
    if(sw){ sw.classList.toggle('on'); if(sw.classList.contains('on')){ S.ini=null; S.fim=null; } }
  });
}

/* ---------- 11-B. ESCALA DA MOLDURA ----------
   No desktop a moldura tem 392x838 FIXOS. Quando a janela diminui, a moldura
   inteira é reduzida na proporção (largura e altura juntas) — nunca achata.
   Em celular de verdade (<520px) não há moldura: o app ocupa a tela toda. */
var LARG_MOLDURA = 392, ALT_MOLDURA = 838;
function escalar(){
  var r = document.documentElement;
  if(window.innerWidth < 520){ r.style.removeProperty('--k'); return; }
  var folgaX = window.innerWidth  < 760 ? 16 : 48;
  var folgaY = window.innerHeight < 700 ? 12 : 36;
  var k = Math.min(1,
            (window.innerWidth  - folgaX) / LARG_MOLDURA,
            (window.innerHeight - folgaY) / ALT_MOLDURA);
  if(k < .3) k = .3;
  r.style.setProperty('--k', String(Math.round(k*1000)/1000));
}
var escTimer = null;
function escalarBrando(){
  if(escTimer) cancelAnimationFrame(escTimer);
  escTimer = requestAnimationFrame(escalar);
}
escalar();
window.addEventListener('resize', escalarBrando);
window.addEventListener('orientationchange', function(){ setTimeout(escalar,180); });

/* ---------- 12. INÍCIO ---------- */
function init(){
  vp=document.getElementById('vp');
  modal=document.createElement('div'); modal.className='modal'; modal.id='modal';
  vp.parentNode.appendChild(modal);
  bind();
  escalar();
  var inicial = telaInicial();
  go(inicial);
}
// o motor sobe assim que o #vp existe — não espera folha de estilo externa (fontes)
if(document.getElementById('vp')) init();
else if(document.readyState!=='loading') init();
else document.addEventListener('DOMContentLoaded', init);
})();
