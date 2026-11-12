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
function derivar(brand, texto){
  var rgb=hex2rgb(brand), hsl=rgb2hsl(rgb);
  return {
    brand: brand.toUpperCase(),
    dark : rgb2hex(hsl2rgb([hsl[0], Math.min(1,hsl[1]*1.05), Math.max(.12, hsl[2]-0.13)])),
    light: rgb2hex(hsl2rgb([hsl[0], Math.min(.85,Math.max(.25,hsl[1]*0.75)), 0.945])),
    /* NÃO MUDAR sem combinar: esta linha decide o texto sobre a cor de cada
       cliente já publicado. Trocar pelo critério de maior contraste melhora a
       legibilidade em marcas de tom médio, mas altera parceiros existentes. */
    ink  : lum(rgb) > 0.55 ? '#14202B' : '#FFFFFF',
    texto: corDeTexto(brand, texto)
  };
}
C.cores = C.cores || {};
var P = derivar(C.cores.brand || '#0A66C2', C.cores.texto);
var TH = {
  '--brand'      : C.cores.brand      || P.brand,
  '--brand-dark' : C.cores.brandDark  || P.dark,
  '--brand-light': C.cores.brandLight || P.light,
  '--brand-ink'  : C.cores.brandInk   || P.ink,
  '--brand-texto': P.texto,
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
/* ---- base de destinos ----------------------------------------------
   Cidades e aeroportos do mundo todo, guardados como texto compacto e
   abertos uma vez no carregamento. O índice sem acento (k) é montado
   junto: a busca não recalcula acento a cada tecla digitada.
   Recorte: aeroportos com 10 ou mais rotas regulares (204 países). */
var PAISES = ["Brasil", "Estados Unidos", "China", "Reino Unido", "França", "Alemanha", "Países Baixos", "Singapura", "Espanha", "Coreia do Sul", "Turquia", "Emirados Árabes Unidos", "Hong Kong", "Itália", "Tailândia", "Rússia", "Canadá", "Bélgica", "Áustria", "Japão", "Índia", "Taiwan", "Malásia", "Suíça", "México", "Dinamarca", "Suécia", "Portugal", "Irlanda", "Austrália", "Grécia", "Filipinas", "Catar", "Arábia Saudita", "Indonésia", "Noruega", "República Tcheca", "África do Sul", "Finlândia", "Colômbia", "Egito", "Israel", "Quênia", "Marrocos", "Polônia", "Kuwait", "Peru", "Romênia", "Malta", "Jordânia", "Vietnã", "Etiópia", "Nova Zelândia", "Panamá", "Omã", "Porto Rico", "Sri Lanka", "Ucrânia", "Letônia", "Hungria", "Chipre", "Venezuela", "Argélia", "Tunísia", "Sérvia", "Bahrein", "Uzbequistão", "Macau", "Chile", "Argentina", "Costa Rica", "Bangladesh", "República Dominicana", "Luxemburgo", "Bahamas", "Cazaquistão", "Senegal", "Líbano", "Bulgária", "Azerbaijão", "Irã", "Paquistão", "Croácia", "Nigéria", "Lituânia", "Antilhas Holandesas", "Belarus", "Gana", "Tadjiquistão", "El Salvador", "Costa do Marfim", "Papua-Nova Guiné", "Mianmar", "Camarões", "Líbia", "Angola", "Islândia", "Aruba", "Armênia", "Quirguistão", "Jamaica", "Nepal", "Cuba", "Maldivas", "Fiji", "Maurício", "Sudão", "Camboja", "Benin", "Ruanda", "Equador", "Guatemala", "Polinésia Francesa", "Jersey", "Estônia", "Iêmen", "Albânia", "Guam", "Trinidad e Tobago", "Antígua e Barbuda", "Geórgia", "Moldávia", "Tanzânia", "Uganda", "Zâmbia", "Eslovênia", "Burkina Faso", "Ilhas Virgens Americanas", "Ilhas Turcas e Caicos", "Iraque", "Guadalupe", "Zimbábue", "Belize", "Vanuatu", "Mali", "República Democrática do Congo", "Afeganistão", "Madagascar", "Congo", "Ilhas Cayman", "Bolívia", "Laos", "Ilhas Salomão", "Gabão", "Haiti", "Macedônia do Norte", "Barbados", "Brunei", "Martinica", "Uruguai", "Honduras", "Serra Leoa", "Togo", "Mongólia", "Eslováquia", "Djibuti", "Reunião", "Namíbia", "Santa Lúcia", "Paraguai", "Guiné", "Guernsey", "Dominica", "Cabo Verde", "Moçambique", "Níger", "Libéria", "Bósnia e Herzegovina", "Montenegro", "Turcomenistão", "Bermudas", "Mayotte", "Granada", "Nicarágua", "Guiné Equatorial", "Burundi", "Ilhas Cook", "Gâmbia", "Nova Caledônia", "Seicheles", "Malawi", "Ilhas Virgens Britânicas", "Sudão do Sul", "Somália", "Mauritânia", "Ilha de Man", "São Cristóvão e Névis", "Comores", "Suriname", "Ilhas Marianas do Norte", "Chade", "Palau", "Botsuana", "Groenlândia", "Guiana", "Eritreia", "Guiana Francesa", "Guiné-Bissau", "Anguilla", "Gibraltar", "Samoa", "Coreia do Norte", "Butão", "Tonga", "São Vicente e Granadinas", "Kiribati", "Timor-Leste", "Saara Ocidental", "Ilhas Faroé", "Ilhas Marshall", "São Tomé e Príncipe", "República Centro-Africana", "Saint-Pierre e Miquelon", "Nauru", "Micronésia", "Wallis e Futuna"];
var CIDADES_TXT = "Rio de Janeiro|RJ|0;São Paulo|SP|0;Belo Horizonte|MG|0;Brasília|DF|0;Salvador|BA|0;Fortaleza|CE|0;Recife|PE|0;Porto Alegre|RS|0;Curitiba|PR|0;Manaus|AM|0;Belém|PA|0;Goiânia|GO|0;Vitória|ES|0;Florianópolis|SC|0;Natal|RN|0;João Pessoa|PB|0;Maceió|AL|0;Aracaju|SE|0;Teresina|PI|0;São Luís|MA|0;Campo Grande|MS|0;Cuiabá|MT|0;Palmas|TO|0;Porto Velho|RO|0;Rio Branco|AC|0;Boa Vista|RR|0;Macapá|AP|0;Santos|SP|0;Guarujá|SP|0;São Vicente|SP|0;Praia Grande|SP|0;Bertioga|SP|0;Ubatuba|SP|0;Ilhabela|SP|0;São Sebastião|SP|0;Caraguatatuba|SP|0;Peruíbe|SP|0;Itanhaém|SP|0;Mongaguá|SP|0;Ilha Comprida|SP|0;Campinas|SP|0;Ribeirão Preto|SP|0;São José dos Campos|SP|0;Sorocaba|SP|0;Bauru|SP|0;São José do Rio Preto|SP|0;Piracicaba|SP|0;Araraquara|SP|0;São Carlos|SP|0;Presidente Prudente|SP|0;Marília|SP|0;Franca|SP|0;Jundiaí|SP|0;Santo André|SP|0;São Bernardo do Campo|SP|0;Osasco|SP|0;Barueri|SP|0;Guarulhos|SP|0;Taubaté|SP|0;Jacareí|SP|0;Campos do Jordão|SP|0;Águas de Lindóia|SP|0;Serra Negra|SP|0;Socorro|SP|0;Amparo|SP|0;Atibaia|SP|0;Bragança Paulista|SP|0;Itu|SP|0;Brotas|SP|0;Olímpia|SP|0;Holambra|SP|0;Botucatu|SP|0;Limeira|SP|0;Americana|SP|0;Rio Claro|SP|0;Registro|SP|0;Niterói|RJ|0;Angra dos Reis|RJ|0;Ilha Grande|RJ|0;Paraty|RJ|0;Armação dos Búzios|RJ|0;Cabo Frio|RJ|0;Arraial do Cabo|RJ|0;Saquarema|RJ|0;Maricá|RJ|0;Rio das Ostras|RJ|0;Macaé|RJ|0;Campos dos Goytacazes|RJ|0;Petrópolis|RJ|0;Teresópolis|RJ|0;Nova Friburgo|RJ|0;Itatiaia|RJ|0;Penedo|RJ|0;Resende|RJ|0;Mangaratiba|RJ|0;Volta Redonda|RJ|0;Ouro Preto|MG|0;Tiradentes|MG|0;São João del-Rei|MG|0;Diamantina|MG|0;Serro|MG|0;Capitólio|MG|0;São Thomé das Letras|MG|0;Poços de Caldas|MG|0;Araxá|MG|0;Caxambu|MG|0;São Lourenço|MG|0;Monte Verde|MG|0;Juiz de Fora|MG|0;Uberlândia|MG|0;Uberaba|MG|0;Montes Claros|MG|0;Governador Valadares|MG|0;Ipatinga|MG|0;Betim|MG|0;Contagem|MG|0;Lavras|MG|0;Varginha|MG|0;Pouso Alegre|MG|0;Porto Seguro|BA|0;Arraial d'Ajuda|BA|0;Trancoso|BA|0;Caraíva|BA|0;Praia do Forte|BA|0;Costa do Sauípe|BA|0;Morro de São Paulo|BA|0;Ilhéus|BA|0;Itacaré|BA|0;Lençóis|BA|0;Barreiras|BA|0;Feira de Santana|BA|0;Vitória da Conquista|BA|0;Juazeiro|BA|0;Camaçari|BA|0;Porto de Galinhas|PE|0;Olinda|PE|0;Caruaru|PE|0;Gravatá|PE|0;Petrolina|PE|0;Fernando de Noronha|PE|0;Tamandaré|PE|0;Jericoacoara|CE|0;Canoa Quebrada|CE|0;Cumbuco|CE|0;Beberibe|CE|0;Juazeiro do Norte|CE|0;Sobral|CE|0;Pipa|RN|0;Genipabu|RN|0;São Miguel do Gostoso|RN|0;Mossoró|RN|0;Maragogi|AL|0;Japaratinga|AL|0;São Miguel dos Milagres|AL|0;Barra de São Miguel|AL|0;Praia do Francês|AL|0;Arapiraca|AL|0;Campina Grande|PB|0;Cabedelo|PB|0;Conde|PB|0;Parnaíba|PI|0;Barreirinhas|MA|0;Lençóis Maranhenses|MA|0;Alcântara|MA|0;Imperatriz|MA|0;Santarém|PA|0;Alter do Chão|PA|0;Salinópolis|PA|0;Soure|PA|0;Marabá|PA|0;Presidente Figueiredo|AM|0;Parintins|AM|0;Mateiros|TO|0;Caldas Novas|GO|0;Rio Quente|GO|0;Pirenópolis|GO|0;Alto Paraíso de Goiás|GO|0;Anápolis|GO|0;Rio Verde|GO|0;Chapada dos Guimarães|MT|0;Nobres|MT|0;Poconé|MT|0;Alta Floresta|MT|0;Rondonópolis|MT|0;Sinop|MT|0;Bonito|MS|0;Corumbá|MS|0;Aquidauana|MS|0;Dourados|MS|0;Três Lagoas|MS|0;Foz do Iguaç|PR|0;Londrina|PR|0;Maringá|PR|0;Morretes|PR|0;Antonina|PR|0;Paranaguá|PR|0;Ilha do Mel|PR|0;Ponta Grossa|PR|0;Cascavel|PR|0;Guarapuava|PR|0;Matinhos|PR|0;Guaratuba|PR|0;Balneário Camboriú|SC|0;Bombinhas|SC|0;Itapema|SC|0;Porto Belo|SC|0;Penha|SC|0;Itajaí|SC|0;Navegantes|SC|0;Blumenau|SC|0;Joinville|SC|0;Jaraguá do Sul|SC|0;São Francisco do Sul|SC|0;Garopaba|SC|0;Imbituba|SC|0;Laguna|SC|0;Urubici|SC|0;São Joaquim|SC|0;Treze Tílias|SC|0;Lages|SC|0;Chapecó|SC|0;Criciúma|SC|0;Gramado|RS|0;Canela|RS|0;Bento Gonçalves|RS|0;Garibaldi|RS|0;Caxias do Sul|RS|0;Nova Petrópolis|RS|0;Cambará do Sul|RS|0;São Francisco de Paula|RS|0;Torres|RS|0;Capão da Canoa|RS|0;Tramandaí|RS|0;Pelotas|RS|0;Rio Grande|RS|0;Santa Maria|RS|0;Passo Fundo|RS|0;Santo Ângelo|RS|0;Guarapari|ES|0;Vila Velha|ES|0;Domingos Martins|ES|0;Pedra Azul|ES|0;Anchieta|ES|0;Linhares|ES|0;Cachoeiro de Itapemirim|ES|0;Conceição da Barra|ES|0;Buenos Aires||69;Bariloche||69;Mendoza||69;Córdoba||69;El Calafate||69;Ushuaia||69;Santiago||68;Valparaíso||68;San Pedro de Atacama||68;Montevidéu||149;Punta del Este||149;Colonia del Sacramento||149;Assunção||159;Lima||46;Cusco||46;Bogotá||39;Cartagena||39;Medellín||39;Cidade do México||24;Cancún||24;Playa del Carmen||24;Punta Cana||72;Havana||102;Aruba||97;Cidade do Panamá||53;San José||70;Miami||1;Orlando||1;Nova York||1;Las Vegas||1;Los Angeles||1;San Francisco||1;Chicago||1;Boston||1;Washington||1;Toronto||16;Vancouver||16;Lisboa||27;Porto||27;Madri||8;Barcelona||8;Sevilha||8;Paris||4;Nice||4;Roma||13;Milão||13;Veneza||13;Florença||13;Riomaggiore||13;Londres||3;Amsterdã||6;Berlim||5;Munique||5;Praga||36;Viena||18;Zurique||23;Atenas||30;Istambul||10;Dubai||11;Tóquio||19;Bangkok||14;Bali||34;Atlanta||1;Pequim||2;Frankfurt||5;Dallas||1;Xangai||2;Singapura||7;Seul||9;Denver||1;Hong Kong||12;Guangzhou||2;Bangcoc||14;Moscou||15;Chengdu||2;Bruxelas||17;Manchester||3;Charlotte||1;Filadélfia||1;Düsseldorf||5;Xi'an||2;Palma de Maiorca||8;Kunming||2;Chongqing||2;Nova Délhi||20;Taipé||21;Kuala Lumpur||22;Phoenix||1;Hangzhou||2;São Francisco||1;Houston||1;Abu Dhabi||11;Shenzhen||2;Xiamen||2;Copenhague||25;Mumbai||20;Estocolmo||26;Detroit||1;Minneapolis||1;Dublin||28;Málaga||8;Sydney||29;Seattle||1;Manila||31;Milão||13;Changcha||2;Doha||32;Jidá||33;Qingdao||2;Fort Lauderdale||1;Wuhan||2;Montreal||16;São Petersburgo||15;Jacarta||34;Oslo||35;Zhengzhou||2;Nanjing||2;Genebra||23;Hamburgo||5;Joanesburgo||37;Helsinque||38;Tenerife||8;Alicante||8;Gran Canaria||8;Urumqi||2;Osaka||19;Cairo||40;Brisbane||29;Tianjin||2;Baltimore||1;Dalian||2;Salt Lake City||1;Riad||33;Tampa||1;Lyon||4;Guiyang||2;Stuttgart||5;Shenyang||2;Tel Aviv||41;Jinan||2;Melbourne||29;Fuzhou||2;Colônia||5;Marselha||4;Birmingham||3;Harbin||2;Nairóbi||42;Antalya||10;Casablanca||43;Nova Orleans||1;Varsóvia||44;Cidade do Kuwait||45;San Diego||1;Edimburgo||3;Arrecife||8;Catânia||13;Honolulu||1;Portland||1;Nanning||2;Calgary||16;Bucareste||47;Malta||48;Amã||49;St. Louis||1;Taiyuan||2;Heraklion||30;Ho Chi Minh||50;Sanya||2;Haikou||2;Adis Abeba||51;Guilin||2;Auckland||52;Faro||27;Chennai||20;Mascate||54;San Juan||55;Colombo||56;Ibiza||8;Kiev||57;Riga||58;Bristol||3;Yekaterinburg||15;Glasgow||3;Bangalore||20;Budapeste||59;Sharjah||11;Kolkata||20;East Midlands||3;Fuerteventura||8;Larnaca||60;Mulhouse||4;Guadalajara||24;Nantes||4;Perth||29;Caracas||61;Novosibirsk||15;Argel||62;Bolonha||13;Túnis||63;Hanói||50;Hohhot||2;Salônica||30;Nanchang||2;Belgrado||64;Manama||65;Fukuoka||19;Nagoya||19;Charleroi||17;Lanzhou||2;Ninbo||2;Rodes||30;Austin||1;Raleigh||1;Newcastle||3;Nashville||1;Dammam||33;Shijiazhuang||2;Valência||8;Bérgamo||13;Sapporo||19;Wenzhou||2;Cleveland||1;Toulouse||4;Leeds||3;Busan||9;Tashkent||66;Kansas City||1;Macau||67;Nápoles||13;Hefei||2;Hannover||5;Pisa||13;Cincinnati||1;Dhaka||71;Pittsburgh||1;Hyderabad||20;Monterrey||24;Marraquexe||43;Luxemburgo||73;Edmonton||16;Phuket||14;Indianapolis||1;Bergen||35;San Antonio||1;Eindhoven||6;Nassau||74;Almaty||75;Bordeaux||4;Dakar||76;Esmirna||10;Beirute||77;Sofia||78;Changchun||2;Surabaya||34;Kaohsiung||21;Lijiang||2;Bilbao||8;Columbus||1;Baku||79;Mashhad||80;Fort Myers||1;Sevilha||8;Palermo||13;Karachi||81;Milwaukee||1;Teerã||80;Okinawa||19;Teerã||80;Dubrovnik||82;Beauvais||4;San José||1;Lagos||83;Zhuhai||2;Anchorage||1;Jeju||9;Kochi||20;Islamabad||81;Dalaman||10;Liverpool||3;Vilnius||84;Cracóvia||44;Philipsburg||85;Memphis||1;Makassar||34;Yantai||2;Lahore||81;Oakland||1;Cairns||29;Minsk||86;Sacramento||1;Accra||87;Dushanbe||88;Gotemburgo||26;Stavanger||35;Ancara||10;San Salvador||89;Kota Kinabalu||22;Funchal||27;Olbia||13;Astana||75;Hartford||1;Corfu||30;Abidjan||90;Adelaide||29;Port Moresby||91;Gdansk||44;San Jose del Cabo||24;Bremen||5;Bari||13;Yangon||92;Xining||2;Douala||93;Girona||8;Medina||33;Cebu||31;Sanford||1;Split||82;Chiang Mai||14;Nuremberg||5;Trípoli||94;Halifax||16;Billund||25;Hahn||5;Wuxi||2;Santo Domingo||72;Krasnoyarsk||15;Luanda||95;Puerto Vallarta||24;Jacksonville||1;Keflavík||96;Krasnodar||15;Chania||30;Darwin||29;Erevan||98;Bishkek||99;Kos||30;Enfidha||63;Montego Bay||100;Ottawa||16;Quanzhou||2;Katmandu||101;West Palm Beach||1;Cagliari||13;Cidade do Cabo||37;Santa Ana||1;Trondheim||35;Turim||13;Maldivas||103;Paphos||60;Zagreb||82;Kahului||1;Penang||22;Trivandrum||20;Albuquerque||1;Nadi||104;Louisville||1;Tijuana||24;Aberdeen||3;Irkutsk||15;Port Louis||105;Alexandria||40;Cartum||106;Oklahoma City||1;Siem Reap||107;Winnipeg||16;Cotonou||108;Lille||4;Hurghada||40;Leipzig||5;Ajaccio||4;Kigali||109;Shiraz||80;Quito||110;Cidade da Guatemala||111;Papeete||112;Sharm el Sheikh||40;Verona||13;Jersey||113;Weeze||5;Richmond||1;Tallinn||114;Treviso||13;Yakutsk||15;Dallas||1;Khabarovsk||15;Sana||115;Changzhou||2;Norfolk||1;Rygge||35;Sandefjord||35;Djerba||63;Bastia||4;Balikpapan||34;Christchurch||52;Tirana||116;Birmingham||1;Buffalo||1;Guayaquil||110;Shantou||2;Ahmedabad||20;Belfast||3;Hagåtña||117;Menorca||8;Port of Spain||118;Santiago de Compostela||8;Antigua||119;Charleston||1;Omaha||1;Estrasburgo||4;Salzburgo||18;Tbilisi||120;Chisinau||121;Myrtle Beach||1;Cork||28;Oran||62;Pune||20;Dar Es Salaam||122;Dortmund||5;Entebbe||123;Lusaka||124;Da Nang||50;Khujand||88;Ljubljana||125;Ouagadougou||126;Rotterdam||6;Southampton||3;St. Thomas||127;Wroclaw||44;Mesa||1;Dayton||1;Wellington||52;Bodrum||10;Curaçao||85;Cardiff||3;Guwahati||20;Alghero||13;São Petersburgo||1;Providenciales||128;Sendai||19;Tucson||1;Knoxville||1;Calicut||20;Phnom Penh||107;Abuja||83;Albany||1;Erbil||129;Lhasa||2;Osh||99;Peshawar||81;Rochester||1;Baotou||2;Goa||20;Greenville||1;Yogyakarta||34;Kingston||100;Little Rock||1;Pointe-à-Pitre||130;Taichung||21;Shannon||28;Yuncheng||2;Yellowknife||16;Bethel||1;Cali||39;Des Moines||1;Harare||131;Quebec||16;Agadir||43;Cidade de Belize||132;Grand Rapids||1;Katowice||44;Kazan||15;Coolangatta||29;Reno||1;Rostov||15;Trapani||13;Port Vila||133;Bamako||134;Kinshasa||135;Providence||1;Tulsa||1;Batam||34;Fairbanks||1;Kabul||136;Samara||15;Antananarivo||137;Sochi||15;Kuching||22;Rionegro||39;Syracuse||1;Tromsø||35;Huangshan||2;Vladivostok||15;Zadar||82;Brazzaville||138;Georgetown||139;Greensboro||1;La Paz||140;Palm Springs||1;Bengasi||94;Dongsheng||2;Ontario||1;Lamezia Terme||13;Vientiane||141;Exeter||3;Nome||1;Ahwaz||80;Honiara||142;Hermosillo||24;Jinghonggasa||2;Libreville||143;Montpellier||4;Miri||22;Porto Príncipe||144;Skopje||145;Santa Cruz de la Sierra||140;Bentonville||1;Yichang||2;Rankin Inlet||16;El Paso||1;Ponta Delgada||27;Barbados||146;Bandar Seri Begawan||147;Fort-de-France||148;Memmingen||5;White Plains||1;San Pedro Sula||150;Savannah||1;Ufa||15;Liberia||70;Kotzebue||1;Tyumen||15;Áden||115;Brindisi||13;Akron||1;Dresden||5;Freetown||151;Ketchikan||1;Mineralnye Vody||15;Sept-Îles||16;Mianyang||2;Jerez||8;St. John's||16;Bandung||34;Cluj-Napoca||47;Durban||37;Dayong||2;Lihue||1;Manado||34;Prestwick||3;Pensacola||1;Poznan||44;Pristina||64;Aktau||75;Aalborg||25;Boise||1;Kilimanjaro||122;Kona||1;Lomé||152;Ulan Bator||153;Beihai||2;Bratislava||154;Chelyabinsk||15;Calvi||4;Fresno||1;Karlsruhe/Baden-Baden||5;Gênova||13;Wichita||1;Isfahan||80;Djibouti||155;Juneau||1;Lexington||1;Manchester||1;Múrcia||8;Saint-Denis||156;Xuzhou||2;Harrisburg||1;Porlamar||61;Reus||8;Bandar Abbas||80;Bournemouth||3;Graz||18;Kaunas||84;Iaundé||93;Santander||8;Tânger||43;Windhoek||157;Zhanjiang||2;Odessa||57;Vieux Fort||158;Burbank||1;Conakry||160;Fez||43;Guernsey||161;Nizhniy Novgorod||15;Hailar||2;Huntsville||1;Jackson||1;Johor Bahru||22;Kalibo||31;Kagoshima||19;Almería||8;Long Beach||1;Lucknow||20;Linyi||2;El Aroui||43;Pekanbaru||34;Pointe-Noire||138;Tegucigalpa||150;Ko Samui||14;Visakhapatnam||20;Iqaluit||16;Yiwu||2;Yangzhou||2;Bodø||35;Cedar Rapids||1;Jayapura||34;Dominica||162;Punta Gorda||1;Ilha do Sal||163;Adana||10;Brest||4;Columbia||1;Coimbatore||20;Hiroshima||19;Jaipur||20;Kanazawa||19;Langkawi||22;Lviv||57;Maputo||164;Madison||1;Nagasaki||19;Niamey||165;Omsk||15;Avilés||8;Praia||163;Semarang||34;Yancheng||2;Sioux Lookout||16;Chihuahua||24;Key West||1;Islip||1;Ilha de Kish||80;Mandalay||92;Yuzhno-Sakhalinsk||15;Regina||16;Zakynthos||30;Chittagong||71;Chattanooga||1;Changzhi||2;Culiacán||24;Constantine||62;Cozumel||24;Fort Wayne||1;Indore||20;Baghdogra||20;Jingdezhen||2;Jiuzhaigou||2;Krabi||14;Niigata||19;Praya||34;Lianyungang||2;Malmö||26;Novy Urengoy||15;Monrovia||166;Sarajevo||167;Podgorica||168;Townsville||29;Veracruz||24;Mangalore||20;Santorini||30;Monastir||63;Wabush||16;Ashgabat||169;Bermuda||170;Chifeng||2;Donetsk||57;Dzaoudzi||171;Freeport||74;Spokane||1;Kaliningrad||15;Mérida||24;Moline||1;Mazatlán||24;Nagpur||20;Connaught||28;Peoria||1;Pula||82;Roanoke||1;Tabriz||80;Tallahassee||1;Wuyishan||2;Kelowna||16;Saskatoon||16;Goose Bay||16;Zunyi||2;Abha||33;Banjarmasin||34;León||24;St. George's||172;Managua||173;Norilsk||15;Puerto Plata||72;Srinagar||20;Ambon||34;Bagdá||129;Biarritz||4;Boa Vista||163;Dnipro||57;Davao||31;Nicósia||60;Fargo||1;Figari||4;Huangyan||2;Ishigaki||19;Kota Bahru||22;Liuzhou||2;Maracaibo||61;Marsh Harbor||74;Nizhnevartovsk||15;Roatán||150;Southend||3;Surgut||15;Springfield||1;Malabo||174;Trenton||1;Quetta||81;Yanji||2;Bujumbura||175;Burlington||1;Colorado Springs||1;Eugene||1;Palembang||34;Avarua||176;Toluca||24;Thunder Bay||16;Allentown||1;Ålesund||35;Banjul||177;Canberra||29;Charlottesville||1;Angeles City||31;Friedrichshafen||5;Flint||1;Sioux Falls||1;Zhoushan||2;Wilmington||1;Mount Isa||29;Mykonos||30;Kashi||2;Ganzhou||2;Luang Prabang||141;Luzhou||2;Mombasa||42;Nouméa||178;Okayama||19;Rennes||4;Mahé||179;Sarasota||1;Tongliao||2;Taif||33;Timisoara||47;Villahermosa||24;Xiangfan||2;Victoria||16;Aniak||1;Gassim||33;Lilongwe||180;Patna||20;Tokua||91;Fort McMurray||16;Alice Springs||29;Asheville||1;Billings||1;Broome||29;Bloomington||1;Bourgas||78;Berna||23;Ciudad Juárez||24;Tortola||181;Gainesville||1;Haugesund||35;Huai An||2;Iasi||47;Foz do Iguaçu|PR|0;Jammu||20;Juba||182;La Coruña||8;Mogadishu||183;Multan||81;Matsuyama||19;Namangan||66;Tampere||38;Kobe||19;Yulin||2;Varadero||102;Wanxian||2;Zanzibar||122;Linz||18;Nouakchott||184;Sialkot||81;Suva||104;San Andrés||39;Antofagasta||68;Barcelona||61;Chiang Rai||14;Cusco||46;Datong||2;Bergerac||4;Belgorod||15;Münster||5;Fuyang||2;Mount Hagen||91;Chita||15;Ilha de Man||185;Port Blair||20;Miyazaki||19;Kirkwall||3;Kristiansand||35;Nadzab||91;Limoges||4;Manzhouli||2;Paderborn||5;Preveza||30;Guayana||61;Rabat||43;Mukalla||115;Raipur||20;Rzeszów||44;South Bend||1;Basseterre||186;Santo||133;San Pedro||132;Santiago||72;Lajes||27;Tivat||168;Ronchi de Legionari||13;Ulan-Ude||15;Vigo||8;Zahedan||80;Shymkent||75;Inverness||3;Ranchi||20;Kupang||34;Najaf||129;Gustavia||4;Castries||158;Valparaiso||1;Atlantic City||1;Alta||35;Ancona||13;Arequipa||46;Barranquilla||39;Bellingham||1;Carcassonne||4;Lubumbashi||135;Atyrau||75;Moroni||187;Hakodate||19;Hami||2;Holguín||102;Iloilo||31;Sulaymaniyah||129;Jiamusi||2;Jining||2;Kalamata||30;Korla||2;La Paz||24;La Rochelle||4;La Romana||72;Luxor||40;Mudanjiang||2;Mitilene||30;Morelia||24;Monterey||1;Ndola||124;Norwich||3;Oujda||43;Paramaribo||188;Puerto Montt||68;Rasht||80;Sfax||63;Saipan||189;Torreón||24;Trabzon||10;Unalakleet||1;Valência||61;Varanasi||20;Volgograd||15;Yibin||2;Moncton||16;Prince George||16;Amarillo||1;Scranton||1;Cochabamba||140;Kharkiv||57;Iquique||68;Lubbock||1;Maastricht||6;N'Djamena||190;Koror||191;Yenbo||33;Kuujjuaq||16;Annaba||62;Aguascalientes||24;Nampula||164;Arkhangelsk||15;Amritsar||20;Appleton||1;Blackpool||3;Kralendijk||85;Béziers||4;Clermont-Ferrand||4;Cheongju||9;Dazhou||2;Doncaster||3;Harstad||35;Evansville||1;Farmington||1;Gaborone||192;Great Exuma||74;Nuuk||193;Gulfport||1;Granada||8;Gaziantep||10;Hobart||29;Sohag||40;Hatay||10;Imphal||20;Chandigarh||20;Jian||2;Upernavik||193;Kumamoto||19;Luoyang||2;Medford||1;Mobile||1;Oita||19;Cidade do Panamá||53;Newport News||1;Port Elizabeth||37;Puerto Princesa||31;Pescara||13;Sibu||22;Saarbrücken||5;Syktyvkar||15;Samos||30;Santa Clara||102;St. Croix||127;Toyama||19;Tiruchirappalli||20;Tabuk||33;Varna||78;Zihuatanejo||24;Acapulco||24;Kodiak||1;Bhubaneswar||20;Liège||17;Midland||1;Mirny||15;Charlestown||186;Queenstown||52;Aarhus||25;Astrakhan||15;Akita||19;Bijie||2;Bangor||1;Basra||129;Baton Rouge||1;Bozeman||1;Changde||2;Comiso||13;North Eleuthera||74;Fayetteville||1;Georgetown||194;Grand Junction||1;Green Bay||1;Westerland||5;Guangyuan||2;Heho||92;Hammerfest||35;Khanty-Mansiysk||15;Innsbruck||18;Agartala||20;Madurai||20;Kununurra||29;Kutaisi||120;Lansing||1;Launceston||29;Madang||91;Qiqihar||2;Nanyang||2;Newcastle||29;Nadym||15;Port Harcourt||83;Port Hedland||29;Pierre||1;Pemba||164;Pasco||1;Sétif||62;Rapid City||1;Bend||1;Reynosa||24;Santa Barbara||1;Kangerlussuaq||193;Shreveport||1;San Luis Potosí||24;Salekhard||15;Solo||34;Sorong||34;Santa Cruz de la Palma||8;Takamatsu||19;Trinidad||140;Tuxtla Gutiérrez||24;Tarija||140;Turku||38;Ternate||34;Ust Kamenogorsk||75;Umeå||26;Visby||26;Voronezh||15;Villavicencio||39;Wuhai||2;Inuvik||16;Miho||19;Red Lake||16;Churchill||16;Mont Joli||16;Saragoça||8;Asmara||195;Kayseri||10;Berbera||183;Hargeisa||183;Harlingen||1;Kristiansund||35;La Ceiba||150;Palu||34;Orenburg||15;Samarkand||66;Urgench||66;Växjö||26;Deer Lake||16;Augusta||1;Asahikawa||19;King Salmon||1;Aktobe||75;Anqing||2;Yazd||80;Beira||164;Bhopal||20;Buon Ma Thuot||50;San Carlos de Bariloche||69;Bintulu||22;Cayenne||196;Cayo Coco||102;Cherepovets||15;Cagayan de Oro||31;Comodoro Rivadavia||69;Nha Trang||50;Shangri-La||2;Diyarbakir||10;Dali||2;Dunhuang||2;Panama City||1;Fergana||66;Galena||1;Great Falls||1;Ulanhot||2;Hamilton Island||29;Iquitos||46;Silchar||20;Jiayuguan||2;Qianjiang||2;Qaqortoq||193;Chizhou||2;Kano||83;Karaganda||75;Klagenfurt||18;Karratha||29;La Serena||68;Livingstone||124;Montgomery||1;Manokwari||34;Mackay||29;Murmansk||15;Molde||35;Missoula||1;Maun||192;Nizhnekamsk||15;Jacksonville||1;Bissau||197;Puebla||24;Plattsburgh||1;Padang||34;Pangkal Pinang||34;Poitiers||4;Pangkalan Bun||34;Querétaro||24;Rijeka||82;Rosario||69;Qinhuangdao||2;Simferopol||57;Salalah||54;Szczecin||44;Taiz||115;Tampico||24;Tete||164;Kuala Terengganu||22;Bristol||1;Tarakan||34;Tawau||22;Udaipur||20;Uummannaq||193;Vadsø||35;Victoria Falls||131;Vinh||50;Weifang||2;Xilinhot||2;Arviat||16;Kuujjuarapik||16;Comox||16;Val-d'Or||16;Zacatecas||24;Manzanillo||24;Karpathos||30;Bukhara||66;Barrow||1;Calama||68;Cefalônia||30;Fort Yukon||1;Groningen||6;Mattala||56;Juliaca||46;Kirkenes||35;Bagan||92;Punta Arenas||68;Kulyab||88;Toamasina||137;Thompson||16;Abadan||80;Nantucket||1;Xingyi||2;Alexandria||1;Aizawl||20;Alamosa||1;Asyut||40;The Valley||198;Kalamazoo||1;Samana||72;Bacolod||31;Bakersfield||1;Bismarck||1;Béjaïa||62;Bora Bora||112;Batumi||120;Cheyenne||1;Mohanbari||20;Jambi||34;Dongying||2;Elmira||1;Erfurt||5;Elazig||10;Gorgan||80;Magadan||15;Gällivare||26;Gibraltar||199;Gizan||33;Killeen||1;Alanya||10;Handan||2;Hat Yai||14;Herat||136;Hoskins||91;Hassi Messaoud||62;Horta||27;Hotan||2;Qingyang||2;Leh||20;Jodhpur||20;Jinchuan||2;Jiujiang||2;Chios||30;Kalymnos||30;Quzhou||2;Jixi||2;Kerry||28;Bakhtaran||80;Kavala||30;Leticia||39;Lafayette||1;Luleå||26;Lar||80;Leros||30;Luxi||2;Lublin||44;McGrath||1;McAllen||1;Monroe||1;Memanbetsu||19;Mildura||29;Marudi||22;Muan||9;Mwanza||122;Mulu||22;Nanchong||2;Neuquén||69;Newquay||3;Navoi||66;Oaxaca||24;Poza Rica||24;Pucallpa||46;Perm||15;Pereira||39;Page||1;Petropavlovsk||15;Pontianak||34;Port Macquarie||29;Reggio Calabria||13;Marsa Alam||40;Santa Fe||1;Sandakan||22;Salta||69;Show Low||1;Sucre||140;Sari||80;Santa Rosa||1;Newburgh||1;Daegu||9;Tlemcen||62;Tarapoto||46;Quibdó||39;Lensk||15;Udon Thani||14;Ondjiva||95;Vieques||55;São Vicente||163;Wajir||42;Wewak||91;Baie-Comeau||16;Baker Lake||16;Campbell River||16;Cambridge Bay||16;Chesterfield Inlet||16;Yichun||2;Waskaganish||16;Natashquan||16;Norman Wells||16;Fort Saint John||16;London||16;Zamboanga||31;Chah Bahar||80;La Romaine||16;Aksu||2;Apia||200;Adrar||62;Bahawalpur||81;Brive||4;Concepción||68;Yan'an||2;Gurney||91;Kosice||154;Ouargla||62;Trelew||69;Rangiroa||112;Rio Gallegos||69;Deadhorse||1;Santiago de Cuba||102;Shaktoolik||1;Sukkur||81;Bandar Lampung||34;Turbat||81;Sudbury||16;Timmins||16;Whale Cove||16;Coral Harbour||16;Zweibrücken||5;Aomori||19;Alor Setar||22;Vadodara||20;Bucaramanga||39;Bengkulu||34;Blantyre||180;Ballina Byron Bay||29;Brønnøysund||35;Blagoveschensk||15;Barquisimeto||61;Banda Aceh||34;Bushehr||80;Cold Bay||1;Ciudad Obregón||24;Cloncurry||29;Corpus Christi||1;Cuneo||13;Wausau||1;Daytona Beach||1;Dodge City||1;Dandong||2;Dehradun||20;Durango||24;Antsiranana||137;Dalat||50;Daqing||2;Durango||1;Dunedin||52;Ilha de Elba||13;Saint-Étienne||4;East London||37;Erzurum||10;Eilat||41;Metz||4;New Bern||1;Kalispell||1;Pyongyang||201;Fort Smith||1;Romblon||31;Grand Forks||1;Governor's Harbor||74;Goroka||91;Sanliurfa||10;Gove||29;George||37;Sayun||115;Halmstad||26;Hail||33;Heringsdorf||5;Huntington||1;Humberside||3;Niagara Falls||1;Ibaraki||19;Aurangabad||20;Ilulissat||193;Jinzhou||2;Sitia||30;Kandahar||136;Kalgoorlie||29;Koyuk||1;Karlovy Vary||36;Kinmen||21;St. Mary's||1;Khanabad||66;Kuantan||22;Kushiro||19;Liberal||1;Tarbes||4;Londonderry||3;Los Mochis||24;Sumburgh||3;Limnos||30;Nyingchi||2;Momote||91;Saginaw||1;Maroochydore||29;Mehamn||35;Melbourne||1;Melilla||8;Miyako||19;Minot||1;Mardin||10;Meixian||2;Malindi||42;Makung||21;Baishan||2;Neryungri||15;Noyabrsk||15;Norsup||133;Sovetskiy||15;Thimphu||202;Perúgia||13;Perpignan||4;Khalije Fars||80;Pakse||141;Palmerston North||52;Girua||91;Phu Quoc||50;Pau||4;Yakutia||15;Port Sudan||106;Rockford||1;Reykjavík||96;Laage||5;Bayannur||2;Rockhampton||29;Saratov||15;State College||1;Sundsvall||26;Stornoway||3;Tacloban||31;Tanna||133;Nukuʻalofa||203;Tengchong||2;Tongren||2;Tefé|AM|0;Tomsk||15;Toledo||1;Tours||4;Traverse City||1;Narsarsuaq||193;Vaasa||38;Van||10;Volos||30;Xichang||2;Kugluktuk||16;Igloolik||16;Kamloops||16;Schefferville||16;The Pas||16;Rouyn||16;Williams Lake||16;Terrace||16;Whitehorse||16;Sylhet||71;Arica||68;Bettles||1;Elim||1;Floro||35;Gizo||142;Helena||1;Hodeidah||115;Kurgan Tyube||88;Ganja||79;Quinhagak||1;Mosjoen||35;Mo i Rana||35;Ruby||1;Raiatea Island||112;Sibiu||47;Sandnessjoen||35;Kingstown||204;Scarborough||118;Tachilek||92;Tobruk||94;Kiunga||91;Wales||1;Quepos||70;Flin Flon||16;Gjoa Haven||16;Big Trout Lake||16;Abakan||15;Ambler||1;Albury||29;Ciudad del Este||159;Carepa||39;Watertown||1;Aswan||40;Hiva-oa||112;Araguaína|TO|0;Anshun||2;Uluru||29;Balmaceda||68;Kasane||192;Bloemfontein||37;Binghamton||1;Bahia Blanca||69;Broken Hill||29;Biak||34;Batsfjord||35;Buckland||1;Branson||1;Batna||62;Aguadilla||55;Bosaso||183;Biskra||62;Bratsk||15;Buka Island||91;Bulawayo||131;Berlevag||35;Butuan||31;Yacuiba||140;Caen||4;Coff's Harbour||29;Parauapebas|PA|0;Champaign||1;Choibalsan||153;Copiapo||68;Charlieville||29;Cucuta||39;Kiritimati||205;Daru||91;Daocheng||2;Dumaguete||31;Dili||206;Duluth||1;Dipolog||31;Deering||1;Ende||34;Enshi||2;Erie||1;El Aaiún||207;Beloyarsky||15;Vagar||208;Fukushima||19;Flores||27;Nimes||4;Fukue||19;Gambell||1;Cockburn Town||128;Ghardaia||62;Galcaio||183;Gladstone||29;Golovin||1;Grand Island||1;Groote Eylandt||29;Gorontalo||34;Hilton Head Island||1;Hamilton||52;Hanamaki||19;Orsta-Volda||35;Haiphong||50;Huslia||1;Huahine Island||112;Hue||50;Hualien||21;Kiana||1;Idaho Falls||1;Iguazu Falls||69;Izhevsk||15;Ithaca||1;Hilo||1;Jiagedaqi District||2;Nanortalik||193;Astypalaia||30;Kochi||19;Kendari||34;Kerman||80;Kithira||30;Kalskag||1;Kumasi||87;Kramfors||26;Kasos||30;Brevig Mission||1;Kavieng||91;Kwangju||9;Kzyl-Orda||75;Lamu||42;Luebeck||5;Labuhan Bajo||34;Labuan||22;Legazpi||31;Laredo||1;Paraguana||61;Lewiston||1;Lycksele||26;Majuro||209;Makhachkala||15;Manhattan||1;Mariehamn||38;Malatya||10;Caticlan||31;Mpumalanga||37;Muskrat Dam||16;Munda||142;Maturin||61;Vineyard Haven MA||1;Mexicali||24;Myitkyina||92;Mazar-i-sharif||136;Nukus||66;Nouadhibou||184;Nuku Hiva||112;Naryan-Mar||15;Nosy-be||137;Nelson||52;Nyagan||15;Nanyuki||42;Noorvik||1;Osijek||82;Ostrava||36;Oulu||38;Ozamis||31;Pico||27;Puerto Jimenez||70;Parma||13;Puerto Asis||39;Panzhihua||2;Rodez||4;Russian Mission||1;San Luis Obispo||1;Salisbury||1;San Cristóbal||110;St. Martin||130;St. Michael||1;Santa Marta||39;Sogndal||35;Santo Domingo||61;Stavropol||15;Savoonga||1;Tabubil||91;Timika||34;Tanjung Pandan||34;Tamanrasset||62;Toowoomba||29;Ukhta||15;Surat Thani||14;Bugulma||15;Sivas||10;Vilhelmina||26;Spanish Town||181;Vilankulu||164;Maroantsetra||137;White Mountain||1;Bearskin Lake||16;Sault Sainte Marie||16;Bagotville||16;Clyde River||16;Nain||16;Fredericton||16;Hamilton||16;Hopedale||16;Chevery||16;St-Augustin||16;Yining||2;Chisasibi||16;Makkovik||16;Youngstown||1;Natuashish||16;Puvirnituq||16;Grande Prairie||16;Quesnel||16;Fort Smith||16;Postville||16;Repulse Bay||16;Hall Beach||16;Cranbrook||16;Pangnirtung||16;Smithers||16;Charlottetown||16;Spence Bay||16;Cockburn Town||74;Anaktuvuk Pass||1;Andoya||35;Altamira|PA|0;Craig Cove||133;Dzhambul||75;Eldoret||42;Sege||142;Emmonak||1;Fak Fak||34;Golfito||70;Haines||1;Ikaria||30;Kotlik||1;Kwigillingok||1;Konya||10;Lanai||1;Longreach||29;Molokai||1;Moorea||112;Masai Mara||42;Skagway||1;Stokmarknes||35;Tirgu Mures||47;Sao Tome||210;Nicoya||70;Samburu South||42;Valladolid||8;Dryden||16;Inukjuak||16;Pikangikum||16;Bonaventure||16;Anapa||15;El-baha||33;Arcata CA||1;Ardabil||80;Baise||2;Ängelholm||26;Alliance||1;Kufra||94;Akiak||1;Sittwe||92;Albany||29;Antalaha||137;Anvik||1;Anshan||2;Arthur's Town||74;Alexandroupolis||30;Andizhan||66;Batman||10;Barnaul||15;Tanjung Redep-Borneo Island||34;Bangui||211;Woodbourne||52;Bisha||33;Bima||34;Banja Luka||167;Bangda||2;Brusselton||29;Brunswick||1;Brownsville||1;Burnie||29;Bydgoszcz||44;Cap Haitien||144;Cotabato||31;Chadron||1;Cordova||1;Chaoyang||2;College Station||1;Colima||24;Ciudad del Carmen||24;Camaguey||102;Casper||1;Cuenca||110;Cox's Bazar||71;Chefornak||1;Dubbo||29;Castres||4;Dothan||1;Dire Dawa||51;Dole||4;Dillingham||1;Doomadgee||29;Dinard||4;Puntarenas||70;Unalaska||1;Nejran||33;San Sebastian||8;Eek||1;Kenai||1;Enugu||83;Esquel||69;Erzincan||10;Esmeraldas||110;Essadouira||43;La Fortuna/San Carlos||70;Flores||111;St.-pierre||212;Yamagata||19;Gan Island||103;Gillette||1;Geraldton||29;Sigiriya||56;Goma||135;Patras||30;Gustavus||1;Columbus Mississippi||1;Gwadar||81;Holy Cross||1;Heihe||2;Sacheon||9;Zhijiang||2;Hoonah||1;Al-ahsa||33;Huron||1;Huatulco||24;Liping||2;Ibague||39;Inhambane||164;Nauru||213;Ipota||133;Kirakira||142;ST MARY\\'S||3;La Isabela||72;Joaçaba|SC|0;Aasiaat||193;Sisimiut||193;Jijiga||51;Jabalpur||20;Jessore||71;Kaltag||1;Kahramanmaras||10;Kemorovo||15;Kananga||135;Kongiganak||1;Kitakyushu||19;Kalkmar||26;Klawock||1;Kruunupyy||38;Kipnuk||1;Pohang||9;Kiruna||26;Kostanay||75;Kars||10;Kivalina||1;Kirov||15;Kwajalein||209;Kwethluk||1;Al Bayda'||94;Latrobe||1;Lake Charles||1;Lord Howe Island||29;Learmonth||29;Lamerd||80;Lifou||178;Leknes||35;Yongzhou||2;Lalibella||51;Lampedusa||13;Lonorore||133;Lincoln||1;Lappeenranta||38;La Crosse||1;Langgur-Kei Islands||34;Lawas||22;Svalbard||35;Maupiti||112;Mar del Plata||69;Merimbula||29;Mahajanga||137;Merauke||34;Malang||34;Teesside||3;Maningrida||29;Moranbah||29;Gwinn||1;Makale||51;Mus||10;Metakatla||1;Monteria||39;Ablow||133;Mitu||39;Moro||91;Qaanaaq||193;Nabire||34;Huambo||95;NAPIER||52;New Plymouth||52;North Ronaldsay||3;Nulato||1;Obihiro||19;Kobuk||1;Coca||110;Mohe County||2;Uromiyeh||80;Mornington Island||29;Toksook Bay||1;Oruro||140;Östersund||26;Mosul||129;Namsos||35;Zouerat||184;Paraburdoo||29;Puerto Carreno||39;Puerto Inírida||39;Puerto Maldonado||46;Phitsanulok||14;Palangkaraya||34;Palanga||84;Semiplatinsk||75;Palmar Sur||70;Pohnpei||214;Pantelleria||13;Pori||38;Prosserpine||29;Papa Westray||3;Pasto||39;Provo||1;Pavlodar||75;Puerto Escondido||24;Porto Santo||27;Pleiku||50;Rajkot||20;Rajahmundry||20;Rock Springs||1;Roma||29;Rimini||13;Ronneby||26;Rotorua||52;Yeosu||9;Rørvik||35;Roxas City||31;Rahim Yar Khan||81;Lubango||95;Skelleftea||26;Shungnak||1;Shishmaref||1;Shageluk||1;Sitka||1;Skiros||30;Sola||133;Santa Maria (island)||27;Sainte Marie||137;St. Paul Island||1;Menongue||95;Stord||35;Point Barrow||1;Surat||20;Sangley Point||31;Sambava||137;Svolvær||35;Savusavu||104;Simao||2;Soyo||95;Tagbilaran||31;Cat Island||74;Tari||91;Teller||1;Toliara||137;Hyeres||4;Waikabubak-Sumba Island||34;Tamale||87;Tanjung Pinang||34;Tozeur||63;Loh/Linua||133;Tepic||24;Tauranga||52;Tarawa||205;Tsushima||19;Tuguegarao||31;Matei||104;Tyler||1;Null||167;Ua Huka||112;Ua Pou||112;Yamaguchi||19;Ubon Ratchathani||14;Quelimane||164;Phucat||50;Ukunda||42;Uralsk||75;Uraj||15;Ulsan||9;Busuanga||31;Vanimo||91;Vardø||35;Can Tho||50;Hierro||8;Vijayawada||20;El Vigía||61;Dakhla||207;Valdosta||1;Vasteras||26;Wagga Wagga||29;Wallis||215;Worland||1;Wuzhou||2;Walvis Bay||157;Manihi||112;St. Anthony||16;Lourdes-De-Blanc-Sablon||16;Fort Hope||16;La Grande Riviere||16;Iles de la Madeleine||16;Havre-Saint-Pierre||16;Holman Island||16;Hay River||16;Pond Inlet||16;Waterloo||16;Kangirsuk||16;Moosonee||16;Chibougamau||16;Aupaluk||16;Red Deer Industrial||16;Windsor||16;Kenora||16;Gander||16;St. John||16;Sanikiluaq||16;Cape Dorset||16;Umiujaq||16;Yuma||1;Fort Nelson||16;Zhangye||2;Zhaotong||2;Temuco||68;Gaua Island||133;St.-pierre||156;Sandy Lake||16;Savannakhet||141;Cobija||140;Erechim|RS|0;Almeirim|PA|0;Araracuara||39;San Rafael||69;Araçatuba|SP|0;Arauca||39;Armenia||39;Ayacucho||46;Barinas||61;Buenaventura||39;Caçador|SC|0;Cajamarca||46;Corozal||39;Yopal||39;Florencia||39;Guapi||39;Galapagos||110;Huánuco||46;Easter Island||68;Itaituba|PA|0;Ji-Paraná|RO|0;Jujuy||69;La Toma (Catamayo)||110;Latacunga||110;Mérida||61;Neiva||39;Puerto Cabello||61;Piura||46;Potosi||140;Parana||69;Rerrenabaque||140;Rio Grande||69;Saravena||39;Santa Fe||69;San Jose del Guaviare||39;San Vincente de Caguan||39;Tacna||46;Tame||39;Tucuman||69;San Juan||69;Valera||61;Valledupar||39;Valdivia||68;San Luis||69;Ourilândia do Norte|PA|0;Oriximiná|PA|0;Patos de Minas|MG|0;Andahuaylas||46;Anta||46;Barcelos|AM|0;Bahia Solano||39;Vilhena|RO|0;Canaima||61;Conceição do Araguaia|PA|0;Chiclayo||46;Coari|AM|0;San Martin Des Andes||69;Catamarca||69;Cumana||61;Coro||61;Cruzeiro do Sul|AC|0;Barrancabermeja||39;Eirunepé|AM|0;Santa Rosa||110;Formosa||69;Guanambi|BA|0;Gurupi|TO|0;Guayaramerín||140;Ipiales||39;La Rioja||69;Santa Isabel do Rio Negro|AM|0;Jauja||46;Bom Jesus da Lapa|BA|0;La Fria||61;La Pedrera||39;Puerto Leguízamo||39;Manta||110;Castro||68;Minaçu|GO|0;Manizales||39;Nuquí||39;Cacoal|RO|0;São Paulo de Olivença|AM|0;Paulo Afonso|BA|0;Puerto Madryn||69;Popayan||39;Posadas||69;Providencia||39;Puerto Ayacucho||61;Rio Hacha||39;Redenção|PA|0;Resistencia||69;Rio Hondo||69;Riberalta||140;Santa Rosa||69;Santiago del Estero||69;São Gabriel da Cachoeira|AM|0;Santa Ana de Uairen||61;San Tome||61;Santa Rosa|RS|0;San Antonio||61;São Félix do Araguaia|MT|0;Tumbes||46;Tabatinga|AM|0;Tumaco||39;Tingo Maria||46;Tena||110;Trujillo||46;Tucuruí|PA|0;Uruguaiana|RS|0;Uyuni||140;Viedma||69;Villa Garzon||39;Macas||110;Osorno||68;Breves||0;Santana do Araguaia||0;Santa Terezinha||0;Sao Felix do Xingu||0";
var AEROPORTOS_TXT = "ATL|Atlanta||1|Hartsfield Jackson|336|-844|-5;ORD|Chicago||1|O'Hare|420|-879|-6;PEK|Pequim||2|Beijing Capital|401|1166|8;LHR|Londres||3|London Heathrow|515|-5|0;CDG|Paris||4|Charles de Gaulle|490|26|1;FRA|Frankfurt||5|am Main|500|86|1;LAX|Los Angeles||1||339|-1184|-8;DFW|Dallas||1|Dallas Fort Worth|329|-970|-6;JFK|Nova York||1|John F Kennedy|406|-738|-5;AMS|Amsterdã||6|Amsterdam Schiphol|523|48|1;PVG|Xangai||2|Shanghai Pudong|311|1218|8;SIN|Singapura||7|Singapore Changi|14|1040|8;BCN|Barcelona||8||413|21|1;ICN|Seul||9|Incheon|375|1265|9;DEN|Denver||1||399|-1047|-7;MIA|Miami||1||258|-803|-5;MUC|Munique||5|Munich|484|118|1;IST|Istambul||10|Istanbul|413|288|3;DXB|Dubai||11||253|554|4;HKG|Hong Kong||12||223|1139|8;LGW|Londres||3|London Gatwick|511|-2|0;CAN|Guangzhou||2|Baiyun|234|1133|8;FCO|Roma||13|Leonardo da|418|122|1;MAD|Madri||8|Adolfo Suárez|405|-36|1;BKK|Bangcoc||14|Suvarnabhumi|137|1007|7;DME|Moscou||15|Domodedovo|554|379|3;CTU|Chengdu||2|Shuangliu|306|1039|8;YYZ|Toronto||16|Lester B. Pearson|437|-796|-5;BRU|Bruxelas||17|Brussels|509|45|1;MAN|Manchester||3||534|-23|0;VIE|Viena||18|Vienna|481|166|1;CLT|Charlotte||1|Douglas|352|-809|-5;PHL|Filadélfia||1|Philadelphia|399|-752|-5;NRT|Tóquio||19|Narita|358|1404|9;DUS|Düsseldorf||5|Düsseldorf|513|68|1;XIY|Xi'an||2|Xianyang|344|1088|8;PMI|Palma de Maiorca||8|Palma De Mallorca|396|27|1;KMG|Kunming||2|Changshui|251|1029|8;CKG|Chongqing||2|Jiangbei|297|1066|8;DEL|Nova Délhi||20|Indira Gandhi|286|771|5.5;TPE|Taipé||21|Taiwan Taoyuan|251|1212|8;KUL|Kuala Lumpur||22||27|1017|8;PHX|Phoenix||1|Sky Harbor|334|-1120|-7;HGH|Hangzhou||2|Xiaoshan|302|1204|8;EWR|Nova York||1|Newark Liberty|407|-742|-5;SFO|São Francisco||1|San Francisco|376|-1224|-8;LAS|Las Vegas||1|McCarran|361|-1152|-8;ZRH|Zurique||23|Zürich|475|85|1;IAH|Houston||1|George Bush|300|-953|-6;MEX|Cidade do México||24|Licenciado Benito|194|-991|-6;AUH|Abu Dhabi||11||244|547|4;MCO|Orlando||1||284|-813|-5;SZX|Shenzhen||2|Bao'an|226|1138|8;XMN|Xiamen||2|Gaoqi|245|1181|8;CPH|Copenhague||25|Copenhagen Kastrup|556|127|1;BOM|Mumbai||20|Chhatrapati Shivaji|191|729|5.5;ARN|Estocolmo||26|Stockholm-Arlanda|597|179|1;LIS|Lisboa||27|Humberto Delgado|388|-91|0;DTW|Detroit||1|Metropolitan Wayne|422|-834|-5;MSP|Minneapolis||1|Minneapolis-St|449|-932|-6;BOS|Boston||1|General Edward Lawrence|424|-710|-5;TXL|Berlim||5|Berlin-Tegel|526|133|1;DUB|Dublin||28||534|-63|0;SHA|Xangai||2|Shanghai Hongqiao|312|1213|8;AGP|Málaga||8||367|-45|1;SYD|Sydney||29|Kingsford Smith|-339|1512|10;ORY|Paris||4|Paris-Orly|487|24|1;ATH|Atenas||30|Eleftherios Venizelos|379|239|2;SEA|Seattle||1|Tacoma|474|-1223|-8;SVO|Moscou||15|Sheremetyevo|560|374|3;DCA|Washington||1|Ronald Reagan|389|-770|-5;GRU|São Paulo|SP|0|Guarulhos|-234|-465|-3;IAD|Washington||1|Dulles|389|-775|-5;MNL|Manila||31|Ninoy Aquino|145|1210|8;MXP|Milão||13|Malpensa|456|87|1;CSX|Changcha||2|Changsha Huanghua|282|1132|8;DOH|Doha||32|Hamad|253|516|3;JED|Jidá||33|King Abdulaziz|217|392|3;TAO|Qingdao||2|Liuting|363|1204|8;FLL|Fort Lauderdale||1|Hollywood|261|-802|-5;WUH|Wuhan||2|Tianhe|308|1142|8;YUL|Montreal||16|/ Pierre Elliott|455|-737|-5;LED|São Petersburgo||15|Pulkovo|598|303|3;CGK|Jacarta||34|Soekarno-Hatta|-61|1067|7;OSL|Oslo||35|Lufthavn|601|111|1;PRG|Praga||36|Václav Havel Prague|501|143|1;CGO|Zhengzhou||2|Xinzheng|345|1138|8;STN|Londres||3|London Stansted|519|2|0;NKG|Nanjing||2|Lukou|317|1189|8;GVA|Genebra||23|Geneva Cointrin|462|61|1;HAM|Hamburgo||5|Hamburg|536|100|1;JNB|Joanesburgo||37|OR Tambo|-261|282|2;HEL|Helsinque||38|Helsinki Vantaa|603|250|2;TFS|Tenerife||8|South|280|-166|0;LGA|Nova York||1|La Guardia|408|-739|-5;HND|Tóquio||19|Tokyo Haneda|356|1398|9;YVR|Vancouver||16||492|-1232|-8;ALC|Alicante||8||383|-6|1;CUN|Cancún||24||210|-869|-5;LPA|Gran Canaria||8||279|-154|0;BOG|Bogotá||39|El Dorado|47|-741|-5;URC|Urumqi||2|Diwopu|439|875|8;KIX|Osaka||19|Kansai|344|1352|9;CAI|Cairo||40||301|314|2;BNE|Brisbane||29||-274|1531|10;TSN|Tianjin||2|Binhai|391|1173|8;SAW|Istambul||10|Sabiha Gökçen|409|293|3;BWI|Baltimore||1|Baltimore/Washington|392|-767|-5;DLC|Dalian||2|Zhoushuizi|390|1215|8;SLC|Salt Lake City||1||408|-1120|-7;RUH|Riad||33|King Khaled|250|467|3;TPA|Tampa||1||280|-825|-5;LYS|Lyon||4|Saint-Exupéry|457|51|1;KWE|Guiyang||2|Longdongbao|265|1068|8;STR|Stuttgart||5||487|92|1;SHE|Shenyang||2|Taoxian|416|1235|8;MDW|Chicago||1|Midway|418|-878|-6;TLV|Tel Aviv||41|Ben Gurion|320|349|2;TNA|Jinan||2|Yaoqiang|369|1172|8;MEL|Melbourne||29||-377|1448|10;NCE|Nice||4|Nice-Côte d'Azur|437|72|1;FOC|Fuzhou||2|Changle|259|1197|8;CGN|Colônia||5|Cologne Bonn|509|71|1;MRS|Marselha||4|Marseille Provence|434|52|1;BHX|Birmingham||3||525|-17|0;HRB|Harbin||2|Taiping|456|1262|8;NBO|Nairóbi||42|Jomo Kenyatta|-13|369|3;AYT|Antalya||10||369|308|3;CMN|Casablanca||43|Mohammed V|334|-76|0;MSY|Nova Orleans||1|Louis Armstrong New|300|-903|-6;VCE|Veneza||13|Venice Marco Polo|455|124|1;WAW|Varsóvia||44|Warsaw Chopin|522|210|1;KWI|Cidade do Kuwait||45||292|480|3;SAN|San Diego||1||327|-1172|-8;EDI|Edimburgo||3|Edinburgh|560|-34|0;ACE|Arrecife||8|Lanzarote|289|-136|0;CTA|Catânia||13|Catania-Fontanarossa|375|151|1;HNL|Honolulu||1|Daniel K Inouye|213|-1579|-10;LIM|Lima||46|Jorge Chávez|-120|-771|-5;PDX|Portland||1||456|-1226|-8;NNG|Nanning||2|Wuxu|226|1082|8;YYC|Calgary||16||511|-1140|-7;OTP|Bucareste||47|Henri Coandă|446|261|2;MLA|Malta||48||359|145|1;AMM|Amã||49|Queen Alia|317|360|2;STL|St. Louis||1|St Louis Lambert|387|-904|-6;TYN|Taiyuan||2|Wusu|377|1126|8;HER|Heraklion||30|Nikos Kazantzakis|353|252|2;SGN|Ho Chi Minh||50|Tan Son Nhat|108|1067|7;SYX|Sanya||2|Phoenix|183|1094|8;HAK|Haikou||2|Meilan|199|1105|8;ADD|Adis Abeba||51|Bole|90|388|3;KWL|Guilin||2|Liangjiang|252|1100|8;LTN|Londres||3|London Luton|519|-4|0;AKL|Auckland||52||-370|1748|12;PTY|Cidade do Panamá||53|Tocumen|91|-794|-5;FAO|Faro||27||370|-80|0;MAA|Chennai||20|Chennai|130|802|5.5;MCT|Mascate||54||236|583|4;SJU|San Juan||55|Luis Munoz Marin|184|-660|-4;CMB|Colombo||56|Bandaranaike Colombo|72|799|5.5;IBZ|Ibiza||8||389|14|1;KBP|Kiev||57|Boryspil|503|309|2;OPO|Porto||27|Francisco de Sá|412|-87|0;RIX|Riga||58||569|240|2;DPS|Bali||34|Ngurah Rai (Bali)|-87|1152|8;BRS|Bristol||3||514|-27|0;SVX|Yekaterinburg||15|Koltsovo|567|608|5;BSB|Brasília|DF|0|Presidente Juscelino|-159|-479|-3;GLA|Glasgow||3||559|-44|0;BLR|Bangalore||20|Kempegowda|132|777|5.5;BUD|Budapeste||59|Budapest Liszt Ferenc|474|193|1;SHJ|Sharjah||11||253|555|4;CCU|Kolkata||20|Netaji Subhash Chandra|227|884|5.5;GIG|Rio de Janeiro|RJ|0|Rio Galeão – Tom Jobim|-228|-433|-3;EMA|East Midlands||3||528|-13|0;FUE|Fuerteventura||8||285|-139|0;LCA|Larnaca||60||349|336|2;BSL|Mulhouse||4|EuroAirport|476|75|1;GDL|Guadalajara||24|Don Miguel Hidalgo Y|205|-1033|-6;NTE|Nantes||4|Atlantique|472|-16|1;PER|Perth||29||-319|1160|8;CCS|Caracas||61|Simón Bolívar|106|-670|-4;OVB|Novosibirsk||15|Tolmachevo|550|827|7;ALG|Argel||62|Houari Boumediene|367|32|1;BLQ|Bolonha||13|Bologna Guglielmo|445|113|1;TUN|Túnis||63|Carthage|369|102|1;HAN|Hanói||50|Noi Bai|212|1058|7;HET|Hohhot||2|Baita|409|1118|8;SKG|Salônica||30|Thessaloniki Macedonia|405|230|2;KHN|Nanchang||2|Changbei|289|1159|8;BEG|Belgrado||64|Nikola Tesla|448|203|1;VKO|Moscou||15|Vnukovo|556|373|3;BAH|Manama||65||263|506|3;FUK|Fukuoka||19||336|1305|9;NGO|Nagoya||19|Chubu Centrair|349|1368|9;CRL|Charleroi||17|Brussels South|505|45|1;LHW|Lanzhou||2|Zhongchuan|365|1036|8;NGB|Ninbo||2|Ningbo Lishe|298|1215|8;RHO|Rodes||30|Diagoras|364|281|2;AUS|Austin||1|Bergstrom|302|-977|-6;RDU|Raleigh||1|Raleigh Durham|359|-788|-5;NCL|Newcastle||3||550|-17|0;SXF|Berlim||5|Berlin-Schönefeld|524|135|1;BNA|Nashville||1||361|-867|-6;DMM|Dammam||33|King Fahd|265|498|3;SJW|Shijiazhuang||2|Daguocun|383|1147|8;VLC|Valência||8||395|-5|1;BGY|Bérgamo||13|Il Caravaggio|457|97|1;CTS|Sapporo||19|New Chitose|428|1417|9;WNZ|Wenzhou||2|Longwan|279|1209|8;CLE|Cleveland||1|Hopkins|414|-818|-5;TLS|Toulouse||4|Toulouse-Blagnac|436|14|1;LBA|Leeds||3|Bradford|539|-17|0;NAY|Pequim||2|Beijing Nanyuan|398|1164|8;PUS|Busan||9|Gimhae|352|1289|9;TAS|Tashkent||66||413|693|5;MCI|Kansas City||1||393|-947|-6;MFM|Macau||67||221|1136|8;NAP|Nápoles||13|Naples|409|143|1;SCL|Santiago||68|Comodoro Arturo Merino|-334|-708|-4;HFE|Hefei||2|Luogang|318|1173|8;HAJ|Hannover||5||525|97|1;PSA|Pisa||13||437|104|1;CVG|Cincinnati||1|Northern Kentucky|390|-847|-5;EZE|Buenos Aires||69|Ministro Pistarini|-348|-585|-3;HOU|Houston||1|William P Hobby|296|-953|-6;SJO|San José||70|Juan Santamaria|100|-842|-6;DAC|Dhaka||71|Hazrat Shahjalal|238|904|6;PIT|Pittsburgh||1||405|-802|-5;HYD|Hyderabad||20|Rajiv Gandhi|172|784|5.5;MTY|Monterrey||24|General Mariano|258|-1001|-6;RAK|Marraquexe||43|Menara|316|-80|0;PUJ|Punta Cana||72||186|-684|-4;LUX|Luxemburgo||73|Luxembourg-Findel|496|62|1;YEG|Edmonton||16||533|-1136|-7;HKT|Phuket||14||81|983|7;IND|Indianapolis||1||397|-863|-5;BGO|Bergen||35|Flesland|603|52|1;SAT|San Antonio||1||295|-985|-6;EIN|Eindhoven||6||515|54|1;NAS|Nassau||74|Lynden Pindling|250|-775|-5;ALA|Almaty||75|Almaty|434|770|6;BOD|Bordeaux||4|Bordeaux-Mérignac|448|-7|1;DKR|Dakar||76|Léopold Sédar Senghor|147|-175|0;DMK|Bangcoc||14|Don Mueang|139|1006|7;ADB|Esmirna||10|Adnan Menderes|383|272|3;BEY|Beirute||77|Rafic Hariri|338|355|2;SOF|Sofia||78||427|234|2;CGQ|Changchun||2|Longjia|440|1257|8;SUB|Surabaya||34|Juanda|-74|1128|7;KHH|Kaohsiung||21||226|1203|8;LJG|Lijiang||2||267|1002|8;AEP|Buenos Aires||69|Jorge Newbery Airpark|-346|-584|-3;BIO|Bilbao||8||433|-29|1;CMH|Columbus||1|John Glenn Columbus|400|-829|-5;GYD|Baku||79|Heydar Aliyev|405|500|4;LCY|Londres||3|London City|515|1|0;MHD|Mashhad||80||362|596|3.5;RSW|Fort Myers||1|Southwest Florida|265|-818|-5;SVQ|Sevilha||8||374|-59|1;PMO|Palermo||13|Falcone–Borsellino|382|131|1;KHI|Karachi||81|Jinnah|249|672|5;MKE|Milwaukee||1|General Mitchell|429|-879|-6;THR|Teerã||80|Mehrabad|357|513|3.5;OKA|Okinawa||19|Naha|262|1276|9;IKA|Teerã||80|Imam Khomeini|354|512|3.5;DBV|Dubrovnik||82||426|183|1;BVA|Beauvais||4|Paris Beauvais Tillé|495|21|1;LIN|Milão||13|Milano Linate|454|93|1;SJC|San José||1|Norman Y. Mineta San|374|-1219|-8;LOS|Lagos||83|Murtala Muhammed|66|33|1;ZUH|Zhuhai||2|Jinwan|220|1134|8;ANC|Anchorage||1|Ted Stevens Anchorage|612|-1500|-9;CJU|Jeju||9|Jeju|335|1265|9;COK|Kochi||20|Cochin|102|764|5.5;ISB|Islamabad||81|New Islamabad|336|729|5;DLM|Dalaman||10||367|288|3;LPL|Liverpool||3|John Lennon|533|-28|0;SSA|Salvador|BA|0|Deputado Luiz Eduardo|-129|-383|-3;VNO|Vilnius||84||546|253|2;KRK|Cracóvia||44|Kraków John Paul II|501|198|1;SXM|Philipsburg||85|Princess Juliana|180|-631|-4;VCP|Campinas|SP|0|Viracopos|-230|-471|-3;MEM|Memphis||1||350|-900|-6;UPG|Makassar||34|Hasanuddin|-51|1196|8;YNT|Yantai||2|Laishan|374|1214|8;LHE|Lahore||81|Alama Iqbal|315|744|5;OAK|Oakland||1|Metropolitan Oakland|377|-1222|-8;CNF|Belo Horizonte|MG|0|Tancredo Neves|-196|-440|-3;CNS|Cairns||29||-169|1458|10;MSQ|Minsk||86|Minsk National|539|280|3;SMF|Sacramento||1||387|-1216|-8;ACC|Accra||87|Kotoka|56|-2|0;DYU|Dushanbe||88||385|688|5;FLR|Florença||13|Peretola|438|112|1;GOT|Gotemburgo||26|Gothenburg-Landvetter|577|123|1;SVG|Stavanger||35|Sola|589|56|1;ESB|Ancara||10|Esenboğa|401|330|3;SAL|San Salvador||89|Monseñor Óscar Arnulfo|134|-891|-6;BKI|Kota Kinabalu||22||59|1161|8;FNC|Funchal||27|Madeira|327|-168|0;OLB|Olbia||13|Costa Smeralda|409|95|1;TSE|Astana||75|Astana|510|715|6;BDL|Hartford||1|Bradley|419|-727|-5;CFU|Corfu||30|Ioannis Kapodistrias|396|199|2;ABJ|Abidjan||90|Port Bouet|53|-39|0;ADL|Adelaide||29||-349|1385|9.5;POM|Port Moresby||91|Jacksons|-94|1472|10;GDN|Gdansk||44|Lech Wałęsa|544|185|1;SJD|San Jose del Cabo||24|Los Cabos|232|-1097|-7;BRE|Bremen||5||530|88|1;BRI|Bari||13|Karol Wojtyła|411|168|1;CIA|Roma||13|Ciampino–G. B. Pastine|418|126|1;RGN|Yangon||92||169|961|6.5;XNN|Xining||2|Caojiabu|365|1020|8;DLA|Douala||93||40|97|1;GRO|Girona||8|Girona|419|28|1;MED|Medina||33|Prince Mohammad Bin|246|397|3;CEB|Cebu||31|Mactan Cebu|103|1240|8;SFB|Sanford||1|Orlando Sanford|288|-812|-5;SPU|Split||82||435|163|1;CNX|Chiang Mai||14||188|990|7;NUE|Nuremberg||5|Nuremberg|495|111|1;TIP|Trípoli||94||327|132|2;YHZ|Halifax||16|/ Stanfield|449|-635|-4;BLL|Billund||25||557|92|1;CGH|São Paulo|SP|0|Congonhas|-236|-467|-3;HHN|Hahn||5|Frankfurt-Hahn|499|73|1;WUX|Wuxi||2|Sunan Shuofang|315|1204|8;SDQ|Santo Domingo||72|Las Américas|184|-697|-4;DWC|Dubai||11|Al Maktoum|249|552|4;KJA|Krasnoyarsk||15|Yemelyanovo|562|925|7;LAD|Luanda||95|Quatro de Fevereiro|-89|132|1;PVR|Puerto Vallarta||24|Licenciado Gustavo Díaz|207|-1053|-6;JAX|Jacksonville||1||305|-817|-5;KEF|Keflavík||96||640|-226|0;KRR|Krasnodar||15|Pashkovsky|450|392|3;AUA|Aruba||97|Queen Beatrix|125|-700|-4;CHQ|Chania||30||355|241|2;DRW|Darwin||29||-124|1309|9.5;EVN|Erevan||98|Zvartnots|401|444|4;FRU|Bishkek||99|Manas|431|745|6;KGS|Kos||30||368|271|2;NBE|Enfidha||63||361|104|1;MBJ|Montego Bay||100|Sangster|185|-779|-5;YOW|Ottawa||16|Macdonald-Cartier|453|-757|-5;JJN|Quanzhou||2|Jinjiang|248|1186|8;KTM|Katmandu||101|Tribhuvan|277|854|5.75;PBI|West Palm Beach||1|Palm Beach|267|-801|-5;HAV|Havana||102|José Martí|230|-824|-5;CAG|Cagliari||13|Elmas|393|91|1;CPT|Cidade do Cabo||37|Cape Town|-340|186|2;CWB|Curitiba|PR|0|Afonso Pena|-255|-492|-3;POA|Porto Alegre|RS|0|Salgado Filho|-300|-512|-3;SNA|Santa Ana||1|John Wayne-Orange|337|-1179|-8;TRD|Trondheim||35|Værnes|635|109|1;TRN|Turim||13|Turin|452|76|1;MLE|Maldivas||103|Malé|42|735|5;PFO|Paphos||60||347|325|2;ZAG|Zagreb||82||457|161|1;ITM|Osaka||19||348|1354|9;OGG|Kahului||1||209|-1564|-10;PEN|Penang||22||53|1003|8;TRV|Trivandrum||20||85|769|5.5;ABQ|Albuquerque||1|Sunport|350|-1066|-7;NAN|Nadi||104|Nadi|-178|1774|12;SDF|Louisville||1|Standiford Field|382|-857|-5;TIJ|Tijuana||24|General Abelardo L.|325|-1170|-8;ABZ|Aberdeen||3|Dyce|572|-22|0;IKT|Irkutsk||15||523|1044|8;MRU|Port Louis||105|Sir Seewoosagur|-204|577|4;HBE|Alexandria||40|Borg El Arab|309|297|2;KRT|Cartum||106||156|326|3;OKC|Oklahoma City||1|Will Rogers World|354|-976|-6;REP|Siem Reap||107|Siem Reap|134|1038|7;YWG|Winnipeg||16|/ James Armstrong|499|-972|-6;COO|Cotonou||108|Cadjehoun|64|24|1;LIL|Lille||4|Lille-Lesquin|506|31|1;TSA|Taipé||21|Taipei Songshan|251|1216|8;HRG|Hurghada||40||272|338|2;LEJ|Leipzig||5|Leipzig/Halle|514|122|1;AJA|Ajaccio||4|Ajaccio-Napoléon|419|88|1;GMP|Seul||9|Gimpo|376|1268|9;KGL|Kigali||109||-20|301|2;SYZ|Shiraz||80|Shahid Dastghaib|295|526|3.5;UIO|Quito||110|Mariscal Sucre|-1|-784|-5;GUA|Cidade da Guatemala||111|La Aurora|146|-905|-6;PPT|Papeete||112|Faa'a|-176|-1496|-10;SSH|Sharm el Sheikh||40||280|344|2;VRN|Verona||13|Verona Villafranca|454|109|1;JER|Jersey||113||492|-22|0;NRN|Weeze||5||516|61|1;RIC|Richmond||1||375|-773|-5;TLL|Tallinn||114|Lennart Meri Tallinn|594|248|2;TSF|Treviso||13|Treviso-Sant'Angelo|456|122|1;YKS|Yakutsk||15||621|1298|9;DAL|Dallas||1|Love Field|328|-969|-6;KHV|Khabarovsk||15|Khabarovsk-Novy|485|1352|10;SAH|Sana||115|Sana'a|155|442|3;CZX|Changzhou||2|Benniu|319|1198|8;ORF|Norfolk||1||369|-762|-5;RYG|Rygge||35|Moss, Rygge|594|108|1;TRF|Sandefjord||35|Sandefjord, Torp|592|103|1;DJE|Djerba||63|Zarzis|339|108|1;BIA|Bastia||4|Bastia-Poretta|426|95|1;BPN|Balikpapan||34|Sultan Aji Muhamad|-13|1169|8;CHC|Christchurch||52||-435|1725|12;REC|Recife|PE|0|Guararapes|-81|-349|-3;TIA|Tirana||116|Mother Teresa|414|197|1;BHM|Birmingham||1|Birmingham-Shuttlesworth|336|-868|-6;BUF|Buffalo||1|Niagara|429|-787|-5;FOR|Fortaleza|CE|0|Pinto Martins|-38|-385|-3;GYE|Guayaquil||110|José Joaquín de Olmedo|-22|-799|-5;SWA|Shantou||2|Jieyang Chaoshan|236|1165|8;AMD|Ahmedabad||20|Sardar Vallabhbhai|231|726|5.5;BEL|Belém|PA|0|Val de Cans/Júlio Cezar|-14|-485|-3;BFS|Belfast||3||547|-62|0;GUM|Hagåtña||117|Antonio B. Won Pat|135|1448|10;MAH|Menorca||8||399|42|1;POS|Port of Spain||118|Piarco|106|-613|-4;SCQ|Santiago de Compostela||8|de Compostela|429|-84|1;ANU|Antigua||119|V.C. Bird|171|-618|-4;CHS|Charleston||1|Air Force|329|-800|-5;OMA|Omaha||1|Eppley|413|-959|-6;SXB|Estrasburgo||4||485|76|1;SZG|Salzburgo||18||478|130|1;TBS|Tbilisi||120||417|450|4;KIV|Chisinau||121||469|289|2;MYR|Myrtle Beach||1||337|-789|-5;ORK|Cork||28||518|-85|0;ORN|Oran||62|Es Senia|356|-6|1;PNQ|Pune||20||186|739|5.5;DAR|Dar Es Salaam||122|Julius Nyerere|-69|392|3;DTM|Dortmund||5||515|76|1;EBB|Entebbe||123||0|324|3;LUN|Lusaka||124|Kenneth Kaunda Lusaka|-153|285|2;CGB|Cuiabá|MT|0|Marechal Rondon|-157|-561|-4;DAD|Da Nang||50|Da Nang|160|1082|7;LBD|Khujand||88||402|697|5;LJU|Ljubljana||125|Jože Pučnik|462|145|1;OUA|Ouagadougou||126||124|-15|0;RTM|Rotterdam||6|The Hague|520|44|1;SOU|Southampton||3||510|-14|0;STT|St. Thomas||127|Cyril E. King|183|-650|-4;TFN|Tenerife||8|Norte|285|-163|0;WRO|Wroclaw||44|Copernicus Wrocław|511|169|1;AZA|Mesa||1|Phoenix-Mesa-Gateway|333|-1117|-7;DAY|Dayton||1|James M Cox Dayton|399|-842|-5;MAO|Manaus|AM|0|Eduardo Gomes|-30|-600|-4;WLG|Wellington||52||-413|1748|12;BJV|Bodrum||10|Milas Bodrum|373|277|3;CUR|Curaçao||85|Hato|122|-690|-4;CWL|Cardiff||3||514|-33|0;GAU|Guwahati||20|Lokpriya Gopinath|261|916|5.5;AHO|Alghero||13|Alghero-Fertilia|406|83|1;NYO|Estocolmo||26|Stockholm Skavsta|588|169|1;PIE|São Petersburgo||1|St Petersburg|279|-827|-5;PLS|Providenciales||128||218|-723|-4;SDJ|Sendai||19||381|1409|9;TUS|Tucson||1||321|-1109|-7;TYS|Knoxville||1|McGhee Tyson|358|-840|-5;CCJ|Calicut||20||111|760|5.5;PNH|Phnom Penh||107|Phnom Penh|115|1048|7;SDU|Rio de Janeiro|RJ|0|Santos Dumont|-229|-432|-3;ABV|Abuja||83|Nnamdi Azikiwe|90|73|1;ALB|Albany||1||427|-738|-5;EBL|Erbil||129||362|440|3;LXA|Lhasa||2|Gonggar|293|909|8;OSS|Osh||99||406|728|6;PEW|Peshawar||81||340|715|5;ROC|Rochester||1|Greater Rochester|431|-777|-5;BAV|Baotou||2||406|1100|8;GOI|Goa||20|Dabolim|154|738|5.5;GSP|Greenville||1|Spartanburg|349|-822|-5;JOG|Yogyakarta||34|Adi Sutjipto|-78|1104|7;KIN|Kingston||100|Norman Manley|179|-768|-5;LIT|Little Rock||1|Bill & Hillary Clinton|347|-922|-6;PTP|Pointe-à-Pitre||130|Le Raizet|163|-615|-4;RMQ|Taichung||21|Ching Chuang Kang|243|1206|8;SNN|Shannon||28||527|-89|0;SZB|Kuala Lumpur||22|Sultan Abdul Aziz Shah|31|1015|8;YCU|Yuncheng||2|Guangong|351|1110|8;YZF|Yellowknife||16||625|-1144|-7;BET|Bethel||1||608|-1618|-9;CLO|Cali||39|Alfonso Bonilla Aragon|35|-764|-5;DSM|Des Moines||1||415|-937|-6;HRE|Harare||131|Robert Gabriel Mugabe|-179|311|2;YQB|Quebec||16|Jean Lesage|468|-714|-5;AGA|Agadir||43|Al Massira|303|-94|0;BZE|Cidade de Belize||132|Philip S. W. Goldson|175|-883|-6;GRR|Grand Rapids||1|Gerald R. Ford|429|-855|-5;KTW|Katowice||44||505|191|1;KZN|Kazan||15||556|493|3;OOL|Coolangatta||29|Gold Coast|-282|1535|10;RNO|Reno||1|Tahoe|395|-1198|-8;ROV|Rostov||15|Platov|475|399|3;TPS|Trapani||13|Vincenzo Florio|379|125|1;VLI|Port Vila||133|Bauerfield|-177|1683|11;BKO|Bamako||134|Modibo Keita|125|-79|0;FIH|Kinshasa||135|Ndjili|-44|154|1;PVD|Providence||1|Theodore Francis Green|417|-714|-5;TUL|Tulsa||1||362|-959|-6;BMA|Estocolmo||26|Stockholm-Bromma|594|179|1;BTH|Batam||34|Hang Nadim|11|1041|7;FAI|Fairbanks||1||648|-1479|-9;KBL|Kabul||136|Hamid Karzai|346|692|4.5;KUF|Samara||15|Kurumoch|535|502|4;TNR|Antananarivo||137|Ivato|-188|475|3;AER|Sochi||15||434|400|3;KCH|Kuching||22||15|1103|8;MDE|Rionegro||39|Jose Maria Córdova|62|-754|-5;SYR|Syracuse||1|Hancock|431|-761|-5;TOS|Tromsø||35|Tromsø|697|189|1;TXN|Huangshan||2|Tunxi|297|1183|8;VVO|Vladivostok||15||434|1321|10;WMI|Varsóvia||44|Modlin|525|207|1;ZAD|Zadar||82||441|153|1;BZV|Brazzaville||138|Maya-Maya|-43|153|1;GCM|Georgetown||139|Owen Roberts|193|-814|-5;GSO|Greensboro||1|Piedmont Triad|361|-799|-5;LPB|La Paz||140|El Alto|-165|-682|-4;PSP|Palm Springs||1||338|-1165|-8;BEN|Bengasi||94|Benina|321|203|2;DSN|Dongsheng||2|Ordos Ejin Horo|395|1099|8;ONT|Ontario||1||341|-1176|-8;SUF|Lamezia Terme||13|Terme|389|162|1;VTE|Vientiane||141|Wattay|180|1026|7;EXT|Exeter||3||507|-34|0;OME|Nome||1||645|-1654|-9;AWZ|Ahwaz||80||313|488|3.5;HIR|Honiara||142||-94|1601|11;HMO|Hermosillo||24|General Ignacio P.|291|-1110|-7;JHG|Jinghonggasa||2|Xishuangbanna Gasa|220|1008|8;LBV|Libreville||143|Leon M'ba|5|94|1;MPL|Montpellier||4|Montpellier-Méditerranée|436|40|1;MYY|Miri||22||43|1140|8;PAP|Porto Príncipe||144|Toussaint Louverture|186|-723|-5;SKP|Skopje||145|Alexander the Great|420|216|1;VVI|Santa Cruz de la Sierra||140|Viru Viru|-176|-631|-4;XNA|Bentonville||1|Northwest Arkansas|363|-943|-6;YIH|Yichang||2|Sanxia|306|1115|8;YRT|Rankin Inlet||16||628|-921|-6;ELP|El Paso||1||318|-1064|-7;PDL|Ponta Delgada||27|João Paulo II|377|-257|-1;BGI|Barbados||146|Sir Grantley Adams|131|-595|-4;BWN|Bandar Seri Begawan||147|Brunei|49|1149|8;FDF|Fort-de-France||148|Martinique Aimé Césaire|146|-610|-4;FMM|Memmingen||5|Allgau|480|102|1;HPN|White Plains||1|Westchester County|411|-737|-5;MVD|Montevidéu||149|Carrasco /General C L|-348|-560|-3;SAP|San Pedro Sula||150|Ramón Villeda Morales|155|-879|-6;SAV|Savannah||1|Hilton Head|321|-812|-5;UFA|Ufa||15||546|559|5;LIR|Liberia||70|Daniel Oduber Quiros|106|-855|-6;OTZ|Kotzebue||1|Ralph Wien Memorial|669|-1626|-9;TJM|Tyumen||15|Roshchino|572|653|5;ADE|Áden||115||128|450|3;BDS|Brindisi||13|Salento|407|179|1;CAK|Akron||1|Canton|409|-814|-5;DRS|Dresden||5||511|138|1;FNA|Freetown||151|Lungi|86|-132|0;IEV|Kiev||57|Zhuliany|504|305|2;KTN|Ketchikan||1||554|-1317|-9;MRV|Mineralnye Vody||15|Mineralnyye Vody|442|431|3;YZV|Sept-Îles||16||502|-663|-5;GYN|Goiânia|GO|0|Santa Genoveva|-166|-492|-3;MIG|Mianyang||2||314|1047|8;XRY|Jerez||8||367|-61|1;YYT|St. John's||16||476|-528|-3.5;BDO|Bandung||34|Husein Sastranegara|-69|1076|7;BHD|Belfast||3|George Best Belfast|546|-59|0;CLJ|Cluj-Napoca||47||468|237|2;DUR|Durban||37|King Shaka|-296|311|2;DYG|Dayong||2||291|1104|8;FLN|Florianópolis|SC|0|Hercílio Luz|-277|-486|-3;GSE|Gotemburgo||26|Gothenburg City|578|119|1;LIH|Lihue||1||220|-1593|-10;MDC|Manado||34|Sam Ratulangi|15|1249|8;PIK|Prestwick||3|Glasgow Prestwick|555|-46|0;PNS|Pensacola||1||305|-872|-6;POZ|Poznan||44|Poznań-Ławica|524|168|1;PRN|Pristina||64||426|210|1;SCO|Aktau||75||439|511|5;AAL|Aalborg||25||571|98|1;BOI|Boise||1|Air Terminal/Gowen|436|-1162|-7;JRO|Kilimanjaro||122||-34|371|3;KOA|Kona||1|Ellison Onizuka Kona At|197|-1560|-10;LFW|Lomé||152|Lomé-Tokoin|62|13|0;ULN|Ulan Bator||153|Chinggis Khaan|478|1068|8;BHY|Beihai||2||215|1093|8;BTS|Bratislava||154|M. R. Štefánik|482|172|1;CEK|Chelyabinsk||15|Balandino|553|615|5;CLY|Calvi||4|Calvi-Sainte-Catherine|425|88|1;FAT|Fresno||1|Yosemite|368|-1197|-8;FKB|Karlsruhe/Baden-Baden||5|Karlsruhe Baden-Baden|488|81|1;GOA|Gênova||13|Genoa Cristoforo|444|88|1;ICT|Wichita||1|Eisenhower National|376|-974|-6;IFN|Isfahan||80|Shahid Beheshti|328|519|3.5;JIB|Djibouti||155|Djibouti-Ambouli|115|432|3;JNU|Juneau||1||584|-1346|-9;LEX|Lexington||1|Blue Grass|380|-846|-5;MHT|Manchester||1|Manchester-Boston|429|-714|-5;MJV|Múrcia||8|San Javier|378|-8|1;RUN|Saint-Denis||156|Roland Garros|-209|555|4;XUZ|Xuzhou||2|Guanyin|341|1176|8;MDT|Harrisburg||1||402|-768|-5;PMV|Porlamar||61|Del Caribe Santiago|109|-640|-4;REU|Reus||8||411|12|1;BND|Bandar Abbas||80||272|564|3.5;BOH|Bournemouth||3||508|-18|0;GRZ|Graz||18||470|154|1;KUN|Kaunas||84||550|241|2;NSI|Iaundé||93|Nsimalen|37|116|1;RAO|Ribeirão Preto|SP|0|Leite Lopes|-211|-478|-3;SDR|Santander||8||434|-38|1;TNG|Tânger||43|Ibn Batouta|357|-59|0;WDH|Windhoek||157|Hosea Kutako|-225|175|1;ZHA|Zhanjiang||2||212|1104|8;ODS|Odessa||57||464|307|2;UVF|Vieux Fort||158|Hewanorra|137|-610|-4;WIL|Nairóbi||42|Wilson|-13|368|3;ASU|Assunção||159|Silvio Pettirossi|-252|-575|-4;BUR|Burbank||1|Bob Hope|342|-1184|-8;CKY|Conakry||160||96|-136|0;FEZ|Fez||43|Saïss|339|-50|0;GCI|Guernsey||161||494|-26|0;GOJ|Nizhniy Novgorod||15|Nizhny Novgorod|562|438|3;HLD|Hailar||2|Dongshan|492|1198|8;HSV|Huntsville||1|Carl T Jones Field|346|-868|-6;JAN|Jackson||1|Jackson-Medgar Wiley|323|-901|-6;JHB|Johor Bahru||22|Senai|16|1037|8;KLO|Kalibo||31||117|1224|8;KOJ|Kagoshima||19||318|1307|9;LEI|Almería||8||368|-24|1;LGB|Long Beach||1|/Daugherty Field/|338|-1182|-8;LKO|Lucknow||20|Chaudhary Charan Singh|268|809|5.5;LYI|Linyi||2|Shubuling|350|1184|8;NDR|El Aroui||43|Nador|350|-30|0;PKU|Pekanbaru||34|Sultan Syarif Kasim Ii|5|1014|7;PNR|Pointe-Noire||138|Pointe Noire|-48|119|1;TGU|Tegucigalpa||150|Toncontín|141|-872|-6;USM|Ko Samui||14|Samui|95|1001|7;VTZ|Visakhapatnam||20||177|832|5.5;YFB|Iqaluit||16||638|-686|-5;YIW|Yiwu||2||293|1200|8;YTY|Yangzhou||2|Taizhou|326|1197|8;BOO|Bodø||35|Bodø|673|144|1;CID|Cedar Rapids||1|The Eastern Iowa|419|-917|-6;DJJ|Jayapura||34|Sentani|-26|1405|9;DOM|Dominica||162|Douglas-Charles|155|-613|-4;PGD|Punta Gorda||1|Charlotte County|269|-820|-5;SID|Ilha do Sal||163||167|-229|-1;ADA|Adana||10||370|353|3;BES|Brest||4|Bretagne|484|-44|1;CAE|Columbia||1|Metropolitan|339|-811|-5;CGR|Campo Grande|MS|0||-205|-547|-4;CJB|Coimbatore||20||110|770|5.5;HIJ|Hiroshima||19||344|1329|9;JAI|Jaipur||20||268|758|5.5;KMQ|Kanazawa||19|Komatsu|364|1364|9;LGK|Langkawi||22||63|997|8;LWO|Lviv||57|Lviv|498|240|2;MPM|Maputo||164||-259|326|2;MSN|Madison||1|Dane County Truax Field|431|-893|-6;NGS|Nagasaki||19||329|1299|9;NIM|Niamey||165|Diori Hamani|135|22|1;OMS|Omsk||15|Central|550|733|6;OVD|Avilés||8|Asturias|436|-60|1;RAI|Praia||163|Praia|149|-235|-1;SRG|Semarang||34|Achmad Yani|-70|1104|7;YNZ|Yancheng||2||334|1202|8;YXL|Sioux Lookout||16||501|-919|-6;CUU|Chihuahua||24|General Roberto Fierro|287|-1060|-7;EYW|Key West||1||246|-818|-5;ISP|Islip||1|Long Island Mac Arthur|408|-731|-5;KIH|Ilha de Kish||80|Kish|265|540|3.5;MDL|Mandalay||92||217|960|6.5;UUS|Yuzhno-Sakhalinsk||15||469|1427|11;YQR|Regina||16||504|-1047|-6;ZTH|Zakynthos||30|\"Dionysios Solomos\"|378|209|2;CGP|Chittagong||71|Shah Amanat|222|918|6;CHA|Chattanooga||1|Lovell Field|350|-852|-5;CIH|Changzhi||2||362|1131|8;CUL|Culiacán||24|Bachigualato Federal|248|-1075|-7;CZL|Constantine||62|Mohamed Boudiaf|363|66|1;CZM|Cozumel||24||205|-869|-5;FWA|Fort Wayne||1||410|-852|-5;IDR|Indore||20|Devi Ahilyabai Holkar|227|758|5.5;IXB|Baghdogra||20|Bagdogra|267|883|5.5;JDZ|Jingdezhen||2||293|1172|8;JZH|Jiuzhaigou||2|Jiuzhai Huanglong|329|1037|8;KBV|Krabi||14||81|990|7;KIJ|Niigata||19||380|1391|9;LOP|Praya||34|Lombok|-88|1163|8;LYG|Lianyungang||2||346|1189|8;MMX|Malmö||26|Malmö Sturup|555|134|1;NAT|Natal|RN|0|Governador Aluízio|-58|-354|-3;NUX|Novy Urengoy||15||661|765|5;ROB|Monrovia||166|Roberts|62|-104|0;SJJ|Sarajevo||167||438|183|1;TGD|Podgorica||168||424|193|1;TSV|Townsville||29||-193|1468|10;VER|Veracruz||24|General Heriberto Jara|191|-962|-6;VIX|Vitória|ES|0|Eurico de Aguiar Salles|-203|-403|-3;IXE|Mangalore||20||130|749|5.5;JTR|Santorini||30|Santorini|364|255|2;MIR|Monastir||63|Habib Bourguiba|358|108|1;SLZ|São Luís|MA|0|Marechal Cunha Machado|-26|-442|-3;YWK|Wabush||16||529|-669|-4;ASB|Ashgabat||169|Ashgabat|380|584|5;BDA|Bermuda||170|L.F. Wade|324|-647|-4;CIF|Chifeng||2||422|1189|8;DOK|Donetsk||57||481|377|2;DZA|Dzaoudzi||171|Pamandzi|-128|453|3;FPO|Freeport||74|Grand Bahama|266|-787|-5;GEG|Spokane||1||476|-1175|-8;KGD|Kaliningrad||15|Khrabrovo|549|206|2;MID|Mérida||24|Licenciado Manuel|209|-897|-6;MLI|Moline||1|Quad City|414|-905|-6;MZT|Mazatlán||24|General Rafael Buelna|232|-1063|-7;NAG|Nagpur||20|Dr. Babasaheb Ambedkar|211|790|5.5;NOC|Connaught||28|Ireland West Knock|539|-88|0;PIA|Peoria||1|General Wayne A.|407|-897|-6;PUY|Pula||82||449|139|1;ROA|Roanoke||1|Roanoke–Blacksburg|373|-800|-5;TBZ|Tabriz||80||381|462|3.5;TLH|Tallahassee||1||304|-844|-5;UDI|Uberlândia|MG|0|Ten. Cel. Aviador César|-189|-482|-3;WUS|Wuyishan||2|Nanping Wuyishan|277|1180|8;YLW|Kelowna||16||500|-1194|-8;YXE|Saskatoon||16|John G. Diefenbaker|522|-1067|-6;YYR|Goose Bay||16||533|-604|-4;ZYI|Zunyi||2|Xinzhou|276|1070|8;AHB|Abha||33||182|427|3;BDJ|Banjarmasin||34|Syamsudin Noor|-34|1148|8;BJX|León||24||210|-1015|-6;GND|St. George's||172||120|-618|-4;MGA|Managua||173|Augusto C. Sandino|121|-862|-6;NSK|Norilsk||15|Norilsk-Alykel|693|873|7;POP|Puerto Plata||72|Gregorio Luperon|198|-706|-4;SXR|Srinagar||20|Sheikh ul Alam|340|748|5.5;AMQ|Ambon||34|Pattimura, Ambon|-37|1281|9;BGW|Bagdá||129||333|442|3;BIQ|Biarritz||4|Biarritz-Anglet-Bayonne|435|-15|1;BVC|Boa Vista||163|Rabil|161|-229|-1;DNK|Dnipro||57|Dnipropetrovsk|484|351|2;DVO|Davao||31|Francisco Bangoy|71|1256|8;ECN|Nicósia||60|Ercan|352|335|2;FAR|Fargo||1|Hector|469|-968|-6;FSC|Figari||4|Sud-Corse|415|91|1;HYN|Huangyan||2|Luqiao|286|1214|8;ISG|Ishigaki||19|New Ishigaki|244|1242|9;KBR|Kota Bahru||22|Sultan Ismail Petra|62|1023|8;LZH|Liuzhou||2|Bailian|242|1094|8;MAR|Maracaibo||61|La Chinita|106|-717|-4;MHH|Marsh Harbor||74|Leonard M Thompson|265|-771|-5;NJC|Nizhnevartovsk||15||609|765|5;RTB|Roatán||150|Juan Manuel Galvez|163|-865|-6;SEN|Southend||3||516|7|0;SGC|Surgut||15||613|734|5;SGF|Springfield||1|Branson National|372|-934|-6;SSG|Malabo||174||38|87|1;STM|Santarém|PA|0|Maestro Wilson Fonseca|-24|-548|-3;TTN|Trenton||1|Mercer|403|-748|-5;UET|Quetta||81||303|669|5;YNJ|Yanji||2|Chaoyangchuan|429|1295|8;YTZ|Toronto||16|Billy Bishop Toronto|436|-794|-5;BJM|Bujumbura||175||-33|293|2;BTV|Burlington||1||445|-732|-5;COS|Colorado Springs||1|City of Colorado|388|-1047|-7;EUG|Eugene||1|Mahlon Sweet Field|441|-1232|-8;PLM|Palembang||34|Sultan Mahmud|-29|1047|7;RAR|Avarua||176|Rarotonga|-212|-1598|-10;TLC|Toluca||24|Licenciado Adolfo Lopez|193|-996|-6;YQT|Thunder Bay||16||484|-893|-5;ABE|Allentown||1|Lehigh Valley|407|-754|-5;AES|Ålesund||35||626|61|1;AJU|Aracaju|SE|0|Santa Maria|-110|-371|-3;BJL|Banjul||177||133|-167|0;CBR|Canberra||29||-353|1492|10;CHO|Charlottesville||1|Charlottesville|381|-785|-5;COR|Córdoba||69|Ingeniero Ambrosio|-313|-642|-3;CRK|Angeles City||31|Diosdado Macapagal|152|1206|8;FDH|Friedrichshafen||5||477|95|1;FNT|Flint||1|Bishop|430|-837|-5;FSD|Sioux Falls||1|Joe Foss Field|436|-967|-6;HSN|Zhoushan||2||299|1224|8;ILM|Wilmington||1||343|-779|-5;ISA|Mount Isa||29||-207|1395|10;JMK|Mykonos||30|Mikonos|374|253|2;KHG|Kashi||2|Kashgar|395|760|8;KOW|Ganzhou||2||259|1148|8;LPQ|Luang Prabang||141|Luang Phabang|199|1022|7;LZO|Luzhou||2||289|1054|8;MBA|Mombasa||42|Moi|-40|396|3;MCZ|Maceió|AL|0|Zumbi dos Palmares|-95|-358|-3;NOU|Nouméa||178|La Tontouta|-220|1662|11;OKJ|Okayama||19||348|1339|9;RNS|Rennes||4|Rennes-Saint-Jacques|481|-17|1;SEZ|Mahé||179|Seychelles|-47|555|4;SRQ|Sarasota||1|Bradenton|274|-826|-5;TGO|Tongliao||2||436|1222|8;TIF|Taif||33|Ta’if|215|405|3;TSR|Timisoara||47|Traian Vuia|458|213|2;VSA|Villahermosa||24|Carlos Rovirosa Pérez|180|-928|-6;XFN|Xiangfan||2|Xiangyang Liuji|322|1123|8;YYJ|Victoria||16||486|-1234|-8;ANI|Aniak||1||616|-1595|-9;ELQ|Gassim||33||263|438|3;LLW|Lilongwe||180||-138|338|2;PAT|Patna||20|Lok Nayak Jayaprakash|256|851|5.5;PLU|Belo Horizonte|MG|0|Pampulha|-199|-440|-3;RAB|Tokua||91||-43|1524|10;YMM|Fort McMurray||16||567|-1112|-7;ASP|Alice Springs||29||-238|1339|9.5;AVL|Asheville||1||354|-825|-5;BIL|Billings||1|Logan|458|-1085|-7;BME|Broome||29||-179|1222|8;BMI|Bloomington||1|Central Illinois at|405|-889|-6;BOJ|Bourgas||78|Burgas|426|275|2;BRN|Berna||23|Belp|469|75|1;CJS|Ciudad Juárez||24|Abraham González|316|-1064|-7;CTG|Cartagena||39|Rafael Nuñez|104|-755|-5;EIS|Tortola||181|Terrance B. Lettsome|184|-645|-4;GNV|Gainesville||1||297|-823|-5;HAU|Haugesund||35||593|52|1;HIA|Huai An||2|Lianshui|338|1191|8;IAS|Iasi||47||472|276|2;IGU|Foz do Iguaçu|PR|0|Cataratas|-256|-545|-3;IXJ|Jammu||20||327|748|5.5;JUB|Juba||182||49|316|3;LCG|La Coruña||8|A Coruña|433|-84|1;MGQ|Mogadishu||183|Aden Adde|20|453|3;MUX|Multan||81||302|714|5;MYJ|Matsuyama||19||338|1327|9;NMA|Namangan||66||410|716|5;TMP|Tampere||38|Tampere-Pirkkala|614|236|2;UKB|Kobe||19||346|1352|9;UYN|Yulin||2|Yuyang|384|1096|8;VRA|Varadero||102|Juan Gualberto Gomez|230|-814|-5;WXN|Wanxian||2||308|1084|8;ZNZ|Zanzibar||122|Abeid Amani Karume|-62|392|3;LDB|Londrina|PR|0|Governador José Richa|-233|-511|-3;LNZ|Linz||18|Hörsching|482|142|1;NKC|Nouakchott||184|Nouakchott–Oumtounsy|183|-160|0;SKT|Sialkot||81||325|744|5;SUV|Suva||104||-180|1786|12;ADZ|San Andrés||39|Gustavo Rojas Pinilla|126|-817|-5;ANF|Antofagasta||68|Andrés Sabella Gálvez|-234|-704|-4;BLA|Barcelona||61|General José Antonio|101|-647|-4;CEI|Chiang Rai||14||200|999|7;CUZ|Cusco||46|Alejandro Velasco|-135|-719|-5;DAT|Datong||2||401|1135|8;EGC|Bergerac||4|Bergerac-Roumanière|448|5|1;EGO|Belgorod||15||506|366|3;EOH|Medellín||39|Enrique Olaya Herrera|62|-756|-5;FMO|Münster||5|Osnabrück|521|77|1;FUG|Fuyang||2|Xiguan|329|1157|8;HGU|Mount Hagen||91|Kagamuga|-58|1443|10;HTA|Chita||15|Chita-Kadala|520|1133|9;IOM|Ilha de Man||185||541|-46|0;IXZ|Port Blair||20|Vir Savarkar|116|927|5.5;JPA|João Pessoa|PB|0|Presidente Castro Pinto|-71|-349|-3;KMI|Miyazaki||19||319|1314|9;KOI|Kirkwall||3||590|-29|0;KRS|Kristiansand||35||582|81|1;LAE|Nadzab||91||-66|1467|10;LIG|Limoges||4||459|12|1;MAB|Marabá|PA|0|João Correa da Rocha|-54|-491|-3;NZH|Manzhouli||2|Xijiao|496|1173|8;PAD|Paderborn||5|Lippstadt|516|86|1;PVK|Preveza||30|Aktion National|389|208|2;PZO|Guayana||61|General Manuel Carlos|83|-628|-4;RBA|Rabat||43|Rabat-Salé|341|-68|0;RIY|Mukalla||115||147|494|3;RPR|Raipur||20||212|817|5.5;RZE|Rzeszów||44|Rzeszów-Jasionka|501|220|1;SBN|South Bend||1||417|-863|-5;SKB|Basseterre||186|Robert L. Bradshaw|173|-627|-4;SON|Santo||133|Pekoa|-155|1672|11;SPR|San Pedro||132||179|-880|-6;STI|Santiago||72|Cibao|194|-706|-4;TER|Lajes||27|Lajes|388|-271|-1;THE|Teresina|PI|0|Senador Petrônio|-51|-428|-3;TIV|Tivat||168||424|187|1;TRS|Ronchi de Legionari||13|Trieste–Friuli Venezia|458|135|1;UUD|Ulan-Ude||15|(Mukhino)|518|1074|8;VGO|Vigo||8||422|-86|1;ZAH|Zahedan||80||295|609|3.5;BPS|Porto Seguro|BA|0||-164|-391|-3;CIT|Shymkent||75|Shymkent|424|695|6;CRW|Charleston||1|Yeager|384|-816|-5;INV|Inverness||3||575|-40|0;IXR|Ranchi||20|Birsa Munda|233|853|5.5;KOE|Kupang||34|El Tari|-102|1237|8;MDZ|Mendoza||69|El Plumerillo|-328|-688|-3;NJF|Najaf||129|Al Najaf|320|444|3;SBH|Gustavia||4|Gustaf III|179|-628|-4;SLU|Castries||158|George F. L. Charles|140|-610|-4;VPS|Valparaiso||1|Destin-Ft Walton Beach|305|-865|-6;ACY|Atlantic City||1||395|-746|-5;ALF|Alta||35||700|234|1;AOI|Ancona||13|Falconara|436|134|1;AQP|Arequipa||46|Rodríguez Ballón|-163|-716|-5;BAQ|Barranquilla||39|Ernesto Cortissoz|109|-748|-5;BLI|Bellingham||1||488|-1225|-8;CCF|Carcassonne||4||432|23|1;FBM|Lubumbashi||135|Lubumbashi|-116|275|2;GUW|Atyrau||75||471|518|5;HAH|Moroni||187|Prince Said Ibrahim|-115|433|3;HKD|Hakodate||19||418|1408|9;HMI|Hami||2||428|937|8;HOG|Holguín||102|Frank Pais|208|-763|-5;ILO|Iloilo||31||108|1225|8;ISU|Sulaymaniyah||129||356|453|3;JMU|Jiamusi||2||468|1305|8;JNG|Jining||2|Qufu|353|1163|8;KLX|Kalamata||30||371|220|2;KRL|Korla||2||417|861|8;LAP|La Paz||24|Manuel Márquez de León|241|-1104|-7;LRH|La Rochelle||4|La Rochelle-Île de Ré|462|-12|1;LRM|La Romana||72|Casa De Campo|185|-689|-4;LXR|Luxor||40||257|327|2;MDG|Mudanjiang||2|Hailang|445|1296|8;MGF|Maringá|PR|0|Regional de Maringá|-235|-520|-3;MJT|Mitilene||30|Mytilene|391|266|2;MLM|Morelia||24|General Francisco J.|198|-1010|-6;MRY|Monterey||1|Peninsula|366|-1218|-8;NLA|Ndola||124|Simon Mwansa Kapwepwe|-130|287|2;NWI|Norwich||3||527|13|0;OUD|Oujda||43|Angads|348|-19|0;PBM|Paramaribo||188|Johan Adolf Pengel|55|-552|-3;PMC|Puerto Montt||68|El Tepual|-414|-731|-4;PWM|Portland||1|Jetport|436|-703|-5;RAS|Rasht||80|Sardar-e-Jangal|373|496|3.5;SFA|Sfax||63|Thyna|347|107|1;SPN|Saipan||189||151|1457|10;TRC|Torreón||24|Francisco Sarabia|256|-1034|-6;TZX|Trabzon||10||410|398|3;UNK|Unalakleet||1||639|-1608|-9;VLN|Valência||61|Arturo Michelena|101|-679|-4;VNS|Varanasi||20|Lal Bahadur Shastri|255|829|5.5;VOG|Volgograd||15||488|443|3;YBP|Yibin||2|Caiba|288|1045|8;YQM|Moncton||16|Greater Moncton|461|-647|-4;YXS|Prince George||16||539|-1227|-8;AMA|Amarillo||1|Rick Husband Amarillo|352|-1017|-6;AVP|Scranton||1|Wilkes Barre Scranton|413|-757|-5;CBB|Cochabamba||140|Jorge Wilsterman|-174|-662|-4;HRK|Kharkiv||57|Kharkiv|499|363|2;IQQ|Iquique||68|Diego Aracena|-205|-702|-4;LBB|Lubbock||1|Preston Smith|337|-1018|-6;MST|Maastricht||6|Aachen|509|58|1;NDJ|N'Djamena||190||121|150|1;ROR|Koror||191||74|1345|9;YNB|Yenbo||33|Prince Abdulmohsin Bin|241|381|3;YVP|Kuujjuaq||16|Kuujjuaq|581|-684|-5;AAE|Annaba||62|Rabah Bitat|368|78|1;AGU|Aguascalientes||24|Jesús Terán Paredo|217|-1023|-6;APL|Nampula||164||-151|393|2;ARH|Arkhangelsk||15|Talagi|646|407|3;ATQ|Amritsar||20|Sri Guru Ram Dass Jee|317|748|5.5;ATW|Appleton||1||443|-885|-6;BLK|Blackpool||3||538|-30|0;BON|Kralendijk||85|Flamingo|121|-683|-4;BZR|Béziers||4|Béziers-Vias|433|34|1;CFE|Clermont-Ferrand||4|Auvergne|458|32|1;CJJ|Cheongju||9|Cheongju/Cheongju|367|1275|9;DAX|Dazhou||2|Dachuan|311|1074|8;DSA|Doncaster||3|Robin Hood Doncaster|535|-10|0;EVE|Harstad||35|Harstad/Narvik, Evenes|685|167|1;EVV|Evansville||1||380|-875|-6;FMN|Farmington||1|Four Corners|367|-1082|-7;GBE|Gaborone||192|Sir Seretse Khama|-246|259|2;GGT|Great Exuma||74|Exuma|236|-759|-5;GOH|Nuuk||193|/ Nuuk|642|-517|-3;GPT|Gulfport||1|Biloxi|304|-891|-6;GRX|Granada||8|Federico Garcia Lorca|372|-38|1;GZT|Gaziantep||10||369|375|3;HBA|Hobart||29||-428|1475|10;HMB|Sohag||40||263|317|2;HTY|Hatay||10||364|363|3;IMF|Imphal||20||248|939|5.5;IOS|Ilhéus|BA|0|Bahia|-148|-390|-3;IXC|Chandigarh||20||307|768|5.5;JGS|Jian||2|Jinggangshan|269|1147|8;JUV|Upernavik||193||728|-561|-3;KMJ|Kumamoto||19||328|1309|9;LYA|Luoyang||2||347|1124|8;MFR|Medford||1|Rogue Valley Medford|424|-1229|-8;MOB|Mobile||1||307|-882|-6;OIT|Oita||19||335|1317|9;PAC|Cidade do Panamá||53|Marcos A. Gelabert|90|-796|-5;PHF|Newport News||1|Williamsburg|371|-765|-5;PLZ|Port Elizabeth||37||-340|256|2;PPS|Puerto Princesa||31||97|1188|8;PSR|Pescara||13||424|142|1;PVH|Porto Velho|RO|0|Governador Jorge|-87|-639|-4;SBW|Sibu||22||23|1120|8;SCN|Saarbrücken||5|Saarbrücken|492|71|1;SCW|Syktyvkar||15||616|508|3;SMI|Samos||30||377|269|2;SNU|Santa Clara||102|Abel Santamaria|225|-799|-5;STX|St. Croix||127|Henry E Rohlsen|177|-648|-4;TOY|Toyama||19||366|1372|9;TRZ|Tiruchirappalli||20|Tiruchirapally Civil|108|787|5.5;TUU|Tabuk||33||284|366|3;VAR|Varna||78||432|278|2;ZIH|Zihuatanejo||24|Ixtapa Zihuatanejo|176|-1015|-6;ACA|Acapulco||24|General Juan N Alvarez|168|-998|-6;ADQ|Kodiak||1||578|-1525|-9;BBI|Bhubaneswar||20|Biju Patnaik|202|858|5.5;GEA|Nouméa||178|Magenta|-223|1665|11;LGG|Liège||17||506|54|1;MAF|Midland||1||319|-1022|-6;MJZ|Mirny||15|Mirny|625|1140|9;NEV|Charlestown||186|Vance W. Amory|172|-626|-4;ZQN|Queenstown||52|Queenstown|-450|1687|12;AAR|Aarhus||25||563|106|1;ASF|Astrakhan||15||463|480|4;AXT|Akita||19||396|1402|9;BFJ|Bijie||2|Feixiong|273|1055|8;BGR|Bangor||1||448|-688|-5;BSR|Basra||129||305|477|3;BTR|Baton Rouge||1|Metropolitan|305|-911|-6;BZN|Bozeman||1|Gallatin Field|458|-1112|-7;CGD|Changde||2||289|1116|8;CIY|Comiso||13||370|146|1;ELH|North Eleuthera||74||255|-767|-5;FAY|Fayetteville||1|Grannis Field|350|-789|-5;GEO|Georgetown||194|Cheddi Jagan|65|-583|-4;GJT|Grand Junction||1||391|-1085|-7;GRB|Green Bay||1|Austin Straubel|445|-881|-6;GWT|Westerland||5|Sylt|549|83|1;GYS|Guangyuan||2||324|1057|8;HEH|Heho||92||207|968|6.5;HFT|Hammerfest||35||707|237|1;HMA|Khanty-Mansiysk||15|Khanty Mansiysk|610|691|5;INN|Innsbruck||18||473|113|1;IXA|Agartala||20||239|912|5.5;IXM|Madurai||20||98|781|5.5;KNX|Kununurra||29||-158|1287|8;KUT|Kutaisi||120|Kopitnari|422|425|4;LAN|Lansing||1|Capital City|428|-846|-5;LST|Launceston||29||-415|1472|10;MAG|Madang||91||-52|1458|10;NDG|Qiqihar||2|Sanjiazi|472|1239|8;NNY|Nanyang||2|Jiangying|330|1126|8;NTL|Newcastle||29||-328|1518|10;NYM|Nadym||15||655|727|5;PHC|Port Harcourt||83|Port Harcourt|50|69|1;PHE|Port Hedland||29||-204|1186|8;PIR|Pierre||1||444|-1003|-6;POL|Pemba||164||-130|405|2;PSC|Pasco||1|Tri Cities|463|-1191|-8;QSF|Sétif||62|Ain Arnat|362|53|1;RAP|Rapid City||1||440|-1031|-7;RDM|Bend||1|Roberts Field|443|-1212|-8;REX|Reynosa||24|General Lucio Blanco|260|-982|-6;SBA|Santa Barbara||1||344|-1198|-8;SFJ|Kangerlussuaq||193|Kangerlussuaq|670|-507|-3;SHV|Shreveport||1||324|-938|-6;SJP|São José do Rio Preto|SP|0|Prof. Eribelto Manoel|-208|-494|-3;SLP|San Luis Potosí||24|Ponciano Arriaga|223|-1009|-6;SLY|Salekhard||15||666|666|5;SOC|Solo||34|Adi Sumarmo Wiryokusumo|-75|1108|7;SOQ|Sorong||34|Dominique Edward Osok|-9|1313|9;SPC|Santa Cruz de la Palma||8|La Palma|286|-178|0;TAK|Takamatsu||19||342|1340|9;TDD|Trinidad||140|Teniente Av. Jorge|-148|-649|-4;TGZ|Tuxtla Gutiérrez||24|Angel Albino Corzo|166|-930|-6;TJA|Tarija||140|Capitan Oriel Lea Plaza|-216|-647|-4;TKU|Turku||38||605|223|2;TTE|Ternate||34|Sultan Khairun Babullah|8|1274|9;UKK|Ust Kamenogorsk||75|Ust-Kamennogorsk|500|825|6;UME|Umeå||26||638|203|1;VBY|Visby||26||577|183|1;VOZ|Voronezh||15||518|392|3;VVC|Villavicencio||39|Vanguardia|42|-736|-5;WUA|Wuhai||2||398|1068|8;YEV|Inuvik||16|Mike Zubko|683|-1335|-7;YGJ|Miho||19|Yonago|355|1332|9;YRL|Red Lake||16||511|-938|-6;YYQ|Churchill||16||587|-941|-6;YYY|Mont Joli||16||486|-682|-5;ZAZ|Saragoça||8||417|-10|1;ASM|Asmara||195||153|389|3;ASR|Kayseri||10|Erkilet|388|355|3;BBO|Berbera||183||104|449|3;HGA|Hargeisa||183|Egal|95|441|3;HRL|Harlingen||1|Valley|262|-977|-6;KSU|Kristiansund||35|(Kvernberget)|631|78|1;LCE|La Ceiba||150|Goloson|157|-869|-6;PLW|Palu||34|Mutiara|-9|1199|8;REN|Orenburg||15|Central|518|555|5;SKD|Samarkand||66||397|670|5;UGC|Urgench||66||416|606|5;VXO|Växjö||26|Kronoberg|569|147|1;YDF|Deer Lake||16||492|-574|-3.5;AGS|Augusta||1|Augusta At Bush Field|334|-820|-5;AKJ|Asahikawa||19||437|1424|9;AKN|King Salmon||1||587|-1566|-9;AKX|Aktobe||75|Aktobe|502|572|5;AQG|Anqing||2|Tianzhushan|306|1171|8;AZD|Yazd||80|Shahid Sadooghi|319|543|3.5;BEW|Beira||164||-198|349|2;BHO|Bhopal||20|Raja Bhoj|233|773|5.5;BMV|Buon Ma Thuot||50|Buon Ma Thuot|127|1081|7;BRC|San Carlos de Bariloche||69||-412|-712|-3;BTU|Bintulu||22||31|1130|8;CAY|Cayenne||196|Cayenne-Rochambeau|48|-524|-3;CCC|Cayo Coco||102|Jardines Del Rey|225|-783|-5;CEE|Cherepovets||15||593|380|3;CGY|Cagayan de Oro||31|Laguindingan|0|0|0;CRD|Comodoro Rivadavia||69|General E. Mosconi|-458|-675|-3;CXR|Nha Trang||50|Cam Ranh|120|1092|7;DIG|Shangri-La||2|Diqing|278|997|8;DIY|Diyarbakir||10|Diyarbakir|379|402|3;DLU|Dali||2||256|1003|8;DNH|Dunhuang||2||402|948|8;ECP|Panama City||1|Northwest Florida|304|-858|-6;FEG|Fergana||66||404|717|5;GAL|Galena||1|Edward G. Pitka Sr|647|-1569|-9;GTF|Great Falls||1||475|-1114|-7;HLH|Ulanhot||2||462|1220|8;HTI|Hamilton Island||29||-204|1490|10;IMP|Imperatriz|MA|0|Prefeito Renato Moreira|-55|-475|-3;IQT|Iquitos||46|Coronel FAP Francisco|-38|-733|-5;IXS|Silchar||20||249|930|5.5;JGN|Jiayuguan||2||399|983|8;JIQ|Qianjiang||2|Wulingshan|295|1088|8;JJU|Qaqortoq||193|Heliport|607|-460|-3;JUH|Chizhou||2|Jiuhuashan|307|1177|8;KAN|Kano||83|Mallam Aminu|120|85|1;KGF|Karaganda||75|Sary-Arka|497|733|6;KLU|Klagenfurt||18||466|143|1;KTA|Karratha||29||-207|1168|8;LSC|La Serena||68|La Florida|-299|-712|-4;LVI|Livingstone||124||-178|258|2;MGM|Montgomery||1|(Dannelly Field)|323|-864|-6;MKW|Manokwari||34|Rendani|-9|1340|9;MKY|Mackay||29||-212|1492|10;MMK|Murmansk||15||688|328|3;MOL|Molde||35||627|73|1;MSO|Missoula||1||469|-1141|-7;MUB|Maun||192||-200|234|2;NBC|Nizhnekamsk||15|Begishevo|556|521|3;NVT|Navegantes|SC|0|Ministro Victor Konder|-269|-487|-3;OAJ|Jacksonville||1|Albert J Ellis|348|-776|-5;OXB|Bissau||197|Osvaldo Vieira|119|-157|0;PBC|Puebla||24|Hermanos Serdán|192|-984|-6;PBG|Plattsburgh||1||447|-735|-5;PDG|Padang||34|Minangkabau|-8|1003|7;PGK|Pangkal Pinang||34|(Depati Amir)|-22|1061|7;PIS|Poitiers||4|Poitiers-Biard|466|3|1;PKN|Pangkalan Bun||34|Iskandar|-27|1117|7;PMW|Palmas|TO|0|Brigadeiro Lysias|-103|-484|-3;QRO|Querétaro||24|Intercontinental|206|-1002|-6;RJK|Rijeka||82||452|146|1;ROS|Rosario||69|Islas Malvinas|-329|-608|-3;SHP|Qinhuangdao||2|Shanhaiguan|400|1197|8;SIP|Simferopol||57||451|340|3;SLL|Salalah||54||170|541|4;SRZ|Santa Cruz de la Sierra||140|El Trompillo|-178|-632|-4;SZZ|Szczecin||44|Szczecin-Goleniów|536|149|1;TAI|Taiz||115|Ta'izz|137|441|3;TAM|Tampico||24|General Francisco|223|-979|-6;TET|Tete||164|Chingozi|-161|336|2;TGG|Kuala Terengganu||22|Sultan Mahmud|54|1031|8;TRI|Bristol||1|Tri-Cities TN/VA|365|-824|-5;TRK|Tarakan||34|Juwata|33|1176|8;TWU|Tawau||22||43|1181|8;UDR|Udaipur||20|Maharana Pratap|246|739|5.5;UMD|Uummannaq||193|Heliport|707|-521|-3;VDS|Vadsø||35||701|298|1;VFA|Victoria Falls||131||-181|258|2;VII|Vinh||50||187|1057|7;WEF|Weifang||2||366|1191|8;XIL|Xilinhot||2||439|1160|8;YEK|Arviat||16|Arviat|611|-941|-6;YGW|Kuujjuarapik||16||553|-778|-5;YQQ|Comox||16||497|-1249|-8;YVO|Val-d'Or||16|Val-d'Or|481|-778|-5;ZCL|Zacatecas||24|General Leobardo C.|229|-1027|-6;ZLO|Manzanillo||24|Playa De Oro|191|-1046|-6;AOK|Karpathos||30||354|271|2;BHK|Bukhara||66||398|645|5;BRW|Barrow||1|Wiley Post Will Rogers|713|-1568|-9;CJC|Calama||68|El Loa|-225|-689|-4;EFL|Cefalônia||30|Kefallinia|381|205|2;FYU|Fort Yukon||1||666|-1452|-9;GRQ|Groningen||6|Eelde|531|66|1;HRI|Mattala||56|Rajapaksa|63|811|5.5;JUL|Juliaca||46|Inca Manco Capac|-155|-702|-5;KKN|Kirkenes||35|(Høybuktmoen)|697|299|1;NYU|Bagan||92||212|949|6.5;PUQ|Punta Arenas||68|Pdte. Carlos Ibañez del|-530|-709|-4;TJU|Kulyab||88|Kulob|380|698|5;TMM|Toamasina||137||-181|494|3;YTH|Thompson||16||558|-979|-6;ABD|Abadan||80||304|482|3.5;ACK|Nantucket||1|Memorial|413|-701|-5;ACX|Xingyi||2||251|1050|8;AEX|Alexandria||1||313|-925|-6;AJL|Aizawl||20|Lengpui|238|926|5.5;ALS|Alamosa||1|San Luis Valley Bergman|374|-1059|-7;ATZ|Asyut||40|Assiut|270|310|2;AXA|The Valley||198|Clayton J Lloyd|182|-631|-4;AZO|Kalamazoo||1|Battle Creek|422|-856|-5;AZS|Samana||72|El Catey|193|-697|-4;BCD|Bacolod||31|Bacolod-Silay|108|1230|8;BFL|Bakersfield||1|Meadows Field|354|-1191|-8;BIS|Bismarck||1||468|-1007|-6;BJA|Béjaïa||62|Soummam|367|51|1;BOB|Bora Bora||112||-164|-1518|-10;BRA|Barreiras|BA|0||-121|-450|-3;BUS|Batumi||120||416|416|4;CYS|Cheyenne||1|Jerry Olson Field|412|-1048|-7;DIB|Mohanbari||20|Dibrugarh|275|950|5.5;DJB|Jambi||34|Sultan Thaha|-16|1036|7;DOY|Dongying||2|Shengli|375|1188|8;ELM|Elmira||1|Corning|422|-769|-5;ERF|Erfurt||5||510|110|1;EZS|Elazig||10|Elazığ|386|393|3;GBT|Gorgan||80||369|544|3.5;GDX|Magadan||15|Sokol|599|1507|11;GEV|Gällivare||26||671|208|1;GIB|Gibraltar||199||362|-53|1;GIZ|Gizan||33|Jizan|169|426|3;GRK|Killeen||1|Robert Gray  Army Air|311|-978|-6;GZP|Alanya||10|Gazipaşa|363|323|3;HDG|Handan||2||365|1144|8;HDY|Hat Yai||14||69|1004|7;HEA|Herat||136||342|622|4.5;HKN|Hoskins||91|Kimbe|-55|1504|10;HME|Hassi Messaoud||62|Oued Irara|317|61|1;HOR|Horta||27||385|-287|-1;HTN|Hotan||2||370|799|8;ILG|Wilmington||1|New Castle|397|-756|-5;IQN|Qingyang||2||358|1076|8;IXL|Leh||20|Kushok Bakula Rimpochee|341|775|5.5;JDH|Jodhpur||20||263|730|5.5;JIC|Jinchuan||2||385|1023|8;JIU|Jiujiang||2|Lushan|295|1158|8;JKH|Chios||30|Island National|383|261|2;JKL|Kalymnos||30||370|269|2;JUZ|Quzhou||2||290|1189|8;JXA|Jixi||2|Xingkaihu|453|1312|8;KIR|Kerry||28||522|-95|0;KSH|Bakhtaran||80|Shahid Ashrafi Esfahani|343|472|3.5;KVA|Kavala||30|Alexander the Great|409|246|2;LET|Leticia||39|Alfredo Vásquez Cobo|-42|-699|-5;LFT|Lafayette||1||302|-920|-6;LLA|Luleå||26||655|221|1;LRR|Lar||80||277|544|3.5;LRS|Leros||30||372|268|2;LUM|Luxi||2|Mangshi|244|985|8;LUZ|Lublin||44||512|227|1;MCG|McGrath||1||630|-1556|-9;MFE|McAllen||1|Mc Allen Miller|262|-982|-6;MLU|Monroe||1||325|-920|-6;MMB|Memanbetsu||19||439|1442|9;MQL|Mildura||29||-342|1421|10;MUR|Marudi||22||42|1143|8;MWX|Muan||9||350|1264|9;MWZ|Mwanza||122||-24|329|3;MZV|Mulu||22||40|1148|8;NAO|Nanchong||2||308|1062|8;NKM|Nagoya||19||353|1369|9;NQN|Neuquén||69|Presidente Peron|-389|-682|-3;NQY|Newquay||3|Newquay Cornwall|504|-50|0;NVI|Navoi||66||401|652|5;OAX|Oaxaca||24|Xoxocotlán|170|-967|-6;PAZ|Poza Rica||24|El Tajín National|206|-975|-6;PCL|Pucallpa||46|Cap FAP David Abenzur|-84|-746|-5;PEE|Perm||15|Bolshoye Savino|579|560|5;PEI|Pereira||39|Matecaña|48|-757|-5;PGA|Page||1||369|-1114|-7;PKC|Petropavlovsk||15|Yelizovo|532|1585|12;PNK|Pontianak||34|Supadio|-2|1094|7;PQQ|Port Macquarie||29||-314|1529|10;REG|Reggio Calabria||13||381|157|1;RMF|Marsa Alam||40||256|346|2;SAF|Santa Fe||1||356|-1061|-7;SDK|Sandakan||22||59|1181|8;SLA|Salta||69|Martin Miguel De Guemes|-249|-655|-3;SOW|Show Low||1||343|-1100|-7;SRE|Sucre||140|Juana Azurduy De|-190|-653|-4;SRY|Sari||80|Dasht-e Naz|366|532|3.5;STS|Santa Rosa||1|Charles M. Schulz|385|-1228|-8;SWF|Newburgh||1|Stewart|415|-741|-5;TAE|Daegu||9|Daegu|359|1287|9;TLM|Tlemcen||62|Zenata – Messali El|350|-15|1;TPP|Tarapoto||46|Cadete FAP Guillermo|-65|-764|-5;UIB|Quibdó||39|El Caraño|57|-766|-5;ULK|Lensk||15||607|1148|9;UTH|Udon Thani||14||174|1028|7;VDC|Vitória da Conquista|BA|0||-149|-409|-3;VPE|Ondjiva||95|Ngjiva Pereira|-170|157|1;VQS|Vieques||55|Vieques|181|-654|-4;VXE|São Vicente||163|São Pedro|168|-251|-1;WJR|Wajir||42||17|401|3;WWK|Wewak||91||-36|1437|10;YBC|Baie-Comeau||16||491|-682|-5;YBK|Baker Lake||16||643|-961|-6;YBL|Campbell River||16||500|-1253|-8;YCB|Cambridge Bay||16||691|-1051|-7;YCS|Chesterfield Inlet||16||633|-907|-6;YIC|Yichun||2|Mingyueshan|278|1143|8;YKQ|Waskaganish||16||515|-788|-5;YNA|Natashquan||16||502|-618|-5;YVQ|Norman Wells||16||653|-1268|-7;YXJ|Fort Saint John||16|Fort St John|562|-1207|-7;YXU|London||16|London|430|-812|-5;ZAM|Zamboanga||31||69|1221|8;ZBR|Chah Bahar||80|Konarak|254|604|3.5;ZGS|La Romaine||16||503|-607|-4;AKU|Aksu||2||413|803|8;APW|Apia||200||-138|-1720|13;AZR|Adrar||62|Touat Cheikh Sidi|278|-2|1;BHV|Bahawalpur||81||293|717|5;BVE|Brive||4|Souillac|450|15|1;CCP|Concepción||68|Carriel Sur|-368|-731|-4;ENY|Yan'an||2|Ershilipu|366|1096|8;GUR|Gurney||91||-103|1503|10;KSC|Kosice||154||487|212|1;OGX|Ouargla||62|Ain el Beida|319|54|1;REL|Trelew||69|Almirante Marco Andres|-432|-653|-3;RGI|Rangiroa||112||-150|-1477|-10;RGL|Rio Gallegos||69|Piloto Civil N.|-516|-693|-3;SCC|Deadhorse||1||702|-1485|-9;SCU|Santiago de Cuba||102|Antonio Maceo|200|-758|-5;SKK|Shaktoolik||1||644|-1612|-9;SKZ|Sukkur||81||277|688|5;TKG|Bandar Lampung||34|Radin Inten II (Branti)|-52|1052|7;TUK|Turbat||81||260|630|5;YSB|Sudbury||16||466|-808|-5;YTS|Timmins||16|Timmins/Victor M. Power|486|-814|-5;YXN|Whale Cove||16||622|-926|-6;YZS|Coral Harbour||16||642|-834|-5;ZQW|Zweibrücken||5|Zweibrücken|492|74|1;AOJ|Aomori||19||407|1407|9;AOR|Alor Setar||22|Sultan Abdul Halim|62|1004|8;BDQ|Vadodara||20|Vadodara|223|732|5.5;BGA|Bucaramanga||39|Palonegro|71|-732|-5;BKS|Bengkulu||34|Fatmawati Soekarno|-39|1023|7;BLZ|Blantyre||180|Chileka|-157|350|2;BNK|Ballina Byron Bay||29|Ballina Byron Gateway|-288|1536|10;BNN|Brønnøysund||35|Brønnøysund|655|122|1;BQS|Blagoveschensk||15|Ignatyevo|504|1274|9;BRM|Barquisimeto||61||100|-694|-4;BTJ|Banda Aceh||34|Sultan Iskandar Muda|55|954|7;BUZ|Bushehr||80||289|508|3.5;CDB|Cold Bay||1||552|-1627|-9;CEN|Ciudad Obregón||24||274|-1098|-7;CNJ|Cloncurry||29||-207|1405|10;CRP|Corpus Christi||1||278|-975|-6;CUF|Cuneo||13||445|76|1;CWA|Wausau||1|Central Wisconsin|448|-897|-6;DAB|Daytona Beach||1||292|-811|-5;DDC|Dodge City||1||378|-1000|-6;DDG|Dandong||2||400|1243|8;DED|Dehradun||20|Dehradun|302|782|5.5;DGO|Durango||24|General Guadalupe|241|-1045|-6;DIE|Antsiranana||137|Arrachart|-123|493|3;DLI|Dalat||50|Lien Khuong|118|1084|7;DQA|Daqing||2|Saertu|467|1251|8;DRO|Durango||1|La Plata County|372|-1078|-7;DUD|Dunedin||52||-459|1702|12;EBA|Ilha de Elba||13||428|102|1;EBU|Saint-Étienne||4|Saint-Étienne-Bouthéon|455|43|1;ELS|East London||37|Ben Schoeman|-330|278|2;ERZ|Erzurum||10||400|412|3;ETH|Eilat||41|Eilat|296|350|2;ETZ|Metz||4|Metz-Nancy-Lorraine|490|63|1;EWN|New Bern||1|Coastal Carolina|351|-770|-5;FCA|Kalispell||1|Glacier Park|483|-1143|-7;FNJ|Pyongyang||201|Sunan|392|1257|8.5;FSM|Fort Smith||1||353|-944|-6;GES|Romblon||31|General Santos|61|1251|8;GFK|Grand Forks||1||479|-972|-6;GHB|Governor's Harbor||74|Governor's Harbour|253|-763|-5;GKA|Goroka||91||-61|1454|10;GNY|Sanliurfa||10|Şanlıurfa GAP|374|389|3;GOV|Gove||29||-123|1368|9.5;GRJ|George||37||-340|224|2;GXF|Sayun||115|Sayun|160|488|3;HAD|Halmstad||26||567|128|1;HAS|Hail||33|Ha'il|274|417|3;HDF|Heringsdorf||5||539|142|1;HTS|Huntington||1|Tri-State/Milton J.|384|-826|-5;HUY|Humberside||3||536|-4|0;IAG|Niagara Falls||1||431|-789|-5;IBR|Ibaraki||19|Hyakuri|362|1404|9;IXU|Aurangabad||20||199|754|5.5;JAV|Ilulissat||193||692|-511|-3;JDO|Juazeiro do Norte|CE|0|Orlando Bezerra de|-72|-393|-3;JNZ|Jinzhou||2||411|1211|8;JOI|Joinville|SC|0|Lauro Carneiro de|-262|-488|-3;JSH|Sitia||30||352|261|2;KDH|Kandahar||136||315|658|4.5;KGI|Kalgoorlie||29|Boulder|-308|1215|8;KKA|Koyuk||1|Alfred Adams|649|-1612|-9;KLV|Karlovy Vary||36||502|129|1;KNH|Kinmen||21||244|1184|8;KSM|St. Mary's||1||621|-1633|-9;KSQ|Khanabad||66|Karshi Khanabad|388|659|5;KUA|Kuantan||22||38|1032|8;KUH|Kushiro||19||430|1442|9;LBL|Liberal||1|Mid-America|370|-1010|-6;LDE|Tarbes||4|Tarbes-Lourdes-Pyrénées|432|0|1;LDY|Londonderry||3|City of Derry|550|-72|0;LMM|Los Mochis||24|Valle del Fuerte|257|-1091|-7;LSI|Sumburgh||3||599|-13|0;LXS|Limnos||30||399|252|2;LZY|Nyingchi||2||293|943|8;MAS|Momote||91||-21|1474|10;MBS|Saginaw||1|MBS|435|-841|-5;MCY|Maroochydore||29|Sunshine Coast|-266|1531|10;MEH|Mehamn||35||710|278|1;MLB|Melbourne||1||281|-806|-5;MLN|Melilla||8||353|-30|1;MMY|Miyako||19||248|1253|9;MOT|Minot||1||483|-1013|-6;MQM|Mardin||10||372|406|3;MXZ|Meixian||2||244|1161|8;MYD|Malindi||42||-32|401|3;MZG|Makung||21||236|1196|8;NBS|Baishan||2|Changbaishan|421|1276|8;NER|Neryungri||15|Chulman|569|1249|9;NOJ|Noyabrsk||15||632|753|5;NUS|Norsup||133||-161|1674|11;OVS|Sovetskiy||15||613|636|5;PBH|Thimphu||202|Paro|274|894|6;PEG|Perúgia||13|San Francesco d'Assisi|431|125|1;PFB|Passo Fundo|RS|0|Lauro Kurtz|-282|-523|-3;PGF|Perpignan||4|Perpignan-Rivesaltes|427|29|1;PGU|Khalije Fars||80|Persian Gulf|274|527|3.5;PKZ|Pakse||141||151|1058|7;PMR|Palmerston North||52||-403|1756|12;PNP|Girua||91||-88|1483|10;PNZ|Petrolina|PE|0|Senador Nilo Coelho|-94|-406|-3;PQC|Phu Quoc||50|Phu Quoc|102|1040|7;PUF|Pau||4|Pyrénées|434|-4|1;PYJ|Yakutia||15|Polyarny|664|1120|9;PZU|Port Sudan||106|New|194|372|3;RBR|Rio Branco|AC|0|Plácido de Castro|-99|-679|-5;RFD|Rockford||1|Chicago Rockford|422|-891|-6;RKV|Reykjavík||96||641|-219|0;RLG|Laage||5|Rostock-Laage|539|123|1;RLK|Bayannur||2|Tianjitai|409|1077|8;ROK|Rockhampton||29||-234|1505|10;RTW|Saratov||15|Central|516|460|3;SCE|State College||1|University Park|408|-778|-5;SDL|Sundsvall||26|Sundsvall-Härnösand|625|174|1;SYY|Stornoway||3||582|-63|0;TAC|Tacloban||31|Daniel Z. Romualdez|112|1250|8;TAH|Tanna||133||-195|1692|11;TBU|Nukuʻalofa||203|Fua'amotu|-212|-1751|13;TCZ|Tengchong||2|Tuofeng|249|985|8;TEN|Tongren||2|Fenghuang|279|1093|8;TFF|Tefé|AM|0||-34|-647|-4;TOF|Tomsk||15|Bogashevo|564|852|7;TOL|Toledo||1|Express|416|-838|-5;TUF|Tours||4|Tours-Val-de-Loire|474|7|1;TVC|Traverse City||1|Cherry Capital|447|-856|-5;UAK|Narsarsuaq||193|Narsarsuaq|612|-454|-3;USH|Ushuaia||69|Malvinas Argentinas|-548|-683|-3;VAA|Vaasa||38||631|218|2;VAN|Van||10|Ferit Melen|385|433|3;VOL|Volos||30|Nea Anchialos|392|228|2;XAP|Chapecó|SC|0|Serafin Enoss Bertaso|-271|-527|-3;XIC|Xichang||2|Qingshan|280|1022|8;YCO|Kugluktuk||16|Kugluktuk|678|-1151|-7;YGT|Igloolik||16||694|-818|-5;YKA|Kamloops||16||507|-1204|-8;YKL|Schefferville||16||548|-668|-5;YQD|The Pas||16||540|-1011|-6;YUY|Rouyn||16|Noranda|482|-788|-5;YWL|Williams Lake||16||522|-1221|-8;YXT|Terrace||16|Northwest|545|-1286|-8;YXY|Whitehorse||16|/ Erik Nielsen|607|-1351|-8;ZYL|Sylhet||71|Osmany|250|919|6;ARI|Arica||68|Chacalluta|-183|-703|-4;BTT|Bettles||1||669|-1515|-9;ELI|Elim||1||646|-1623|-9;FRO|Floro||35|Florø|616|50|1;GZO|Gizo||142|Nusatupe|-81|1569|11;HLN|Helena||1||466|-1120|-7;HOD|Hodeidah||115||148|430|3;KQT|Kurgan Tyube||88|Qurghonteppa|379|689|5;KVD|Ganja||79||407|463|4;KWN|Quinhagak||1||598|-1618|-9;MJF|Mosjoen||35|Mosjøen (Kjærstad)|658|132|1;MQN|Mo i Rana||35|Mo i Rana, Røssvoll|664|143|1;RBY|Ruby||1||647|-1555|-9;RFP|Raiatea Island||112|Raiatea|-167|-1515|-10;SBZ|Sibiu||47||458|241|2;SSJ|Sandnessjoen||35|Sandnessjøen (Stokka)|660|125|1;SVD|Kingstown||204|Argyle|132|-611|-4;TAB|Scarborough||118|Tobago-Crown Point|111|-608|-4;THL|Tachilek||92|Tachileik|205|999|6.5;TOB|Tobruk||94|Gamal Abdel Nasser|319|239|2;UNG|Kiunga||91||-61|1413|10;WAA|Wales||1||656|-1681|-9;XQP|Quepos||70|Managua|94|-841|-6;YFO|Flin Flon||16||547|-1017|-6;YHK|Gjoa Haven||16||686|-958|-7;YTL|Big Trout Lake||16||538|-899|-6;ABA|Abakan||15||537|914|7;ABL|Ambler||1||671|-1579|-9;ABX|Albury||29||-361|1470|10;ABY|Albany||1|Southwest Georgia|315|-842|-5;AGT|Ciudad del Este||159|Guarani|-255|-548|-4;APO|Carepa||39|Antonio Roldan|78|-767|-5;ART|Watertown||1||440|-760|-5;ASW|Aswan||40||240|328|2;AUQ|Hiva-oa||112|Hiva Oa-Atuona|-98|-1390|-9.5;AUX|Araguaína|TO|0||-72|-482|-3;AVA|Anshun||2|Huangguoshu|263|1059|8;AYQ|Uluru||29|Ayers Rock Connellan|-252|1310|9.5;AZI|Abu Dhabi||11|Bateen|244|545|4;BBA|Balmaceda||68||-459|-717|-4;BBK|Kasane||192||-178|252|2;BFN|Bloemfontein||37|Bram Fischer|-291|263|2;BGM|Binghamton||1|Greater|422|-760|-5;BHI|Bahia Blanca||69|Comandante Espora|-387|-622|-3;BHQ|Broken Hill||29||-320|1415|9.5;BIK|Biak||34|Frans Kaisiepo|-12|1361|9;BJF|Batsfjord||35||706|297|1;BKC|Buckland||1||660|-1611|-9;BKG|Branson||1||365|-932|-6;BLJ|Batna||62||358|63|1;BQN|Aguadilla||55|Rafael Hernandez|185|-671|-4;BSA|Bosaso||183||113|491|3;BSK|Biskra||62||348|57|1;BTK|Bratsk||15||564|1017|8;BUA|Buka Island||91|Buka|-54|1547|10;BUQ|Bulawayo||131|Joshua Mqabuko Nkomo|-200|286|2;BVG|Berlevag||35||709|290|1;BXU|Butuan||31|Bancasi|90|1255|8;BYC|Yacuiba||140||-220|-637|-4;CFR|Caen||4|Caen-Carpiquet|492|-4|1;CFS|Coff's Harbour||29|Coffs Harbour|-303|1531|10;CKS|Parauapebas|PA|0|Carajás|-61|-500|-3;CMI|Champaign||1|University of Illinois|400|-883|-6;COQ|Choibalsan||153||481|1146|8;COU|Columbia||1||388|-922|-6;CPO|Copiapo||68|Desierto de Atacama|0|0|0;CTL|Charlieville||29|Charleville|-264|1463|10;CUC|Cucuta||39|Camilo Daza|79|-725|-5;CXI|Kiritimati||205|Cassidy|20|-1574|-12;DAU|Daru||91||-91|1432|10;DCY|Daocheng||2|Yading|293|1001|8;DGT|Dumaguete||31|Sibulan|93|1233|8;DIL|Dili||206|Presidente Nicolau|-85|1255|9;DLH|Duluth||1||468|-922|-6;DPL|Dipolog||31||86|1233|8;DRG|Deering||1||661|-1628|-9;ENE|Ende||34|(H Hasan Aroeboesman)|-88|1217|8;ENH|Enshi||2||303|1095|8;ERI|Erie||1|Tom Ridge Field|421|-802|-5;EUN|El Aaiún||207|Hassan I|272|-132|0;EYK|Beloyarsky||15|Beloyarskiy|637|667|5;FAE|Vagar||208||621|-73|0;FKS|Fukushima||19||372|1404|9;FLW|Flores||27||395|-311|-1;FNI|Nimes||4|Nîmes-Arles-Camargue|438|44|1;FTE|El Calafate||69||-503|-721|-3;FUJ|Fukue||19||327|1288|9;GAM|Gambell||1||638|-1717|-9;GDT|Cockburn Town||128|JAGS McCartney|214|-711|-4;GHA|Ghardaia||62|Noumérat|324|38|1;GLK|Galcaio||183||68|475|3;GLT|Gladstone||29||-239|1512|10;GLV|Golovin||1||646|-1630|-9;GRI|Grand Island||1|Central Nebraska|410|-983|-6;GTE|Groote Eylandt||29||-140|1365|9.5;GTO|Gorontalo||34|Jalaluddin|6|1228|8;HHH|Hilton Head Island||1|Hilton Head|322|-807|-5;HLA|Joanesburgo||37|Lanseria|-259|279|2;HLZ|Hamilton||52||-379|1753|12;HNA|Hanamaki||19||394|1411|9;HOV|Orsta-Volda||35|Ørsta-Volda, Hovden|622|61|1;HPH|Haiphong||50|Cat Bi|208|1067|7;HSL|Huslia||1||657|-1564|-9;HUH|Huahine Island||112|Huahine-Fare|-167|-1510|-10;HUI|Hue||50|Phu Bai|164|1077|7;HUN|Hualien||21||240|1216|8;IAN|Kiana||1|Bob Baker Memorial|670|-1604|-9;IDA|Idaho Falls||1||435|-1121|-7;IGR|Iguazu Falls||69|Cataratas Del Iguazú|-257|-545|-3;IJK|Izhevsk||15||568|535|4;ITH|Ithaca||1|Tompkins|425|-765|-5;ITO|Hilo||1||197|-1550|-10;JGD|Jiagedaqi District||2|Jiagedaqi|504|1241|8;JNN|Nanortalik||193|Heliport|601|-452|-3;JTY|Astypalaia||30||366|264|2;KCZ|Kochi||19|Ryōma|335|1337|9;KDI|Kendari||34|Wolter Monginsidi|-41|1224|8;KER|Kerman||80||303|570|3.5;KIT|Kithira||30||363|230|2;KLG|Kalskag||1||615|-1603|-9;KMS|Kumasi||87||67|-16|0;KRF|Kramfors||26|Sollefteå|630|178|1;KSJ|Kasos||30||354|269|2;KTS|Brevig Mission||1||653|-1665|-9;KVG|Kavieng||91||-26|1508|10;KWJ|Kwangju||9|Gwangju|351|1268|9;KZO|Kzyl-Orda||75|Southwest|447|656|6;LAU|Lamu||42|Manda Airstrip|-23|409|3;LBC|Luebeck||5|Lübeck Blankensee|538|107|1;LBJ|Labuhan Bajo||34|Komodo|-85|1199|8;LBU|Labuan||22||53|1152|8;LGP|Legazpi||31|City|132|1237|8;LRD|Laredo||1||275|-995|-6;LSP|Paraguana||61|Josefa Camejo|118|-702|-4;LWS|Lewiston||1|Nez Perce County|464|-1170|-8;LYC|Lycksele||26||645|187|1;MAJ|Majuro||209|Marshall Islands|71|1713|12;MCX|Makhachkala||15|Uytash|428|477|3;MEA|Macaé|RJ|0||-223|-418|-3;MHK|Manhattan||1||391|-967|-6;MHQ|Mariehamn||38||601|199|2;MLX|Malatya||10|Erhaç|384|381|3;MPH|Caticlan||31|Godofredo P. Ramos|119|1220|8;MQP|Mpumalanga||37|Kruger Mpumalanga|-254|311|2;MSA|Muskrat Dam||16||534|-918|-6;MUA|Munda||142||-83|1573|11;MUN|Maturin||61||98|-631|-4;MVY|Vineyard Haven MA||1|Martha's Vineyard|414|-706|-5;MXL|Mexicali||24|General Rodolfo Sánchez|326|-1152|-8;MYT|Myitkyina||92||254|974|6.5;MZR|Mazar-i-sharif||136|Mazar I Sharif|367|672|4.5;NCU|Nukus||66||425|596|5;NDB|Nouadhibou||184||209|-170|0;NHV|Nuku Hiva||112||-88|-1402|-9.5;NNM|Naryan-Mar||15|Naryan Mar|676|531|3;NOS|Nosy-be||137|Fascene|-133|483|3;NSN|Nelson||52||-413|1732|12;NYA|Nyagan||15||621|656|5;NYK|Nanyuki||42||-1|370|3;ORV|Noorvik||1|Robert (Bob) Curtis|668|-1610|-9;OSI|Osijek||82||455|188|1;OSR|Ostrava||36|Leos Janáček|497|181|1;OUL|Oulu||38||649|254|2;OZC|Ozamis||31|Labo|82|1238|8;PIX|Pico||27||386|-284|-1;PJM|Puerto Jimenez||70||85|-833|-6;PMF|Parma||13||448|103|1;PUU|Puerto Asis||39|Tres De Mayo|5|-765|-5;PZI|Panzhihua||2|Bao'anying|265|1018|8;RDZ|Rodez||4|Rodez-Marcillac|444|25|1;RIA|Santa Maria|RS|0||-297|-537|-3;RSH|Russian Mission||1||618|-1613|-9;RST|Rochester||1||439|-925|-6;SBP|San Luis Obispo||1|San Luis County|352|-1206|-8;SBY|Salisbury||1|Ocean City Wicomico|383|-755|-5;SCY|San Cristóbal||110||-9|-896|-6;SFG|St. Martin||130|L'Espérance|181|-630|-4;SMK|St. Michael||1|St Michael|635|-1621|-9;SMR|Santa Marta||39|Simón Bolívar|111|-742|-5;SOG|Sogndal||35||612|71|1;STD|Santo Domingo||61|Mayor Buenaventura|76|-720|-4;STW|Stavropol||15|Shpakovskoye|451|421|3;SVA|Savoonga||1||637|-1705|-9;TBG|Tabubil||91||-53|1412|10;TIM|Timika||34|Moses Kilangin|-45|1369|9;TJQ|Tanjung Pandan||34|Buluh Tumbang|-27|1078|7;TMR|Tamanrasset||62|Aguenar – Hadj Bey|228|55|1;TWB|Toowoomba||29||-275|1519|10;UBA|Uberaba|MG|0|Mário de Almeida Franco|-198|-480|-3;UCT|Ukhta||15||636|538|3;URT|Surat Thani||14||91|991|7;UUA|Bugulma||15||546|528|3;VAS|Sivas||10|Nuri Demirağ|398|369|3;VHM|Vilhelmina||26||646|168|1;VIJ|Spanish Town||181|Virgin Gorda|184|-644|-4;VNX|Vilankulu||164|Vilankulo|-220|353|2;WMN|Maroantsetra||137||-154|497|3;WMO|White Mountain||1||647|-1634|-9;XBE|Bearskin Lake||16||540|-910|-6;YAM|Sault Sainte Marie||16|Sault Ste Marie|465|-845|-5;YBG|Bagotville||16|CFB Bagotville|483|-710|-5;YCY|Clyde River||16||705|-685|-5;YDP|Nain||16||565|-617|-4;YFC|Fredericton||16||459|-665|-4;YHM|Hamilton||16|John C. Munro Hamilton|432|-799|-5;YHO|Hopedale||16||554|-602|-4;YHR|Chevery||16||505|-596|-4;YHU|Montreal||16|/ Saint-Hubert|455|-734|-5;YIF|St-Augustin||16|St Augustin|512|-587|-4;YIN|Yining||2||440|813|8;YKU|Chisasibi||16||538|-789|-5;YMN|Makkovik||16||551|-592|-4;YNG|Youngstown||1|Warren|413|-807|-5;YNP|Natuashish||16||559|-612|-4;YPX|Puvirnituq||16||601|-773|-5;YQU|Grande Prairie||16||552|-1189|-7;YQZ|Quesnel||16||530|-1225|-8;YSM|Fort Smith||16||600|-1120|-7;YSO|Postville||16||549|-598|-4;YUT|Repulse Bay||16||665|-862|-6;YUX|Hall Beach||16||688|-812|-5;YXC|Cranbrook||16|Cranbrook/Canadian|496|-1158|-7;YXP|Pangnirtung||16||661|-657|-5;YYD|Smithers||16||548|-1272|-8;YYG|Charlottetown||16||463|-631|-4;YYH|Spence Bay||16|Taloyoak|695|-936|-7;ZSA|Cockburn Town||74|San Salvador|241|-745|-5;AKP|Anaktuvuk Pass||1||681|-1517|-9;ANX|Andoya||35|Andøya|693|161|1;ATM|Altamira|PA|0||-33|-523|-3;CAW|Campos dos Goytacazes|RJ|0|Bartolomeu Lisandro|-217|-413|-3;CCV|Craig Cove||133||-163|1679|11;DMB|Dzhambul||75|Taraz|429|713|6;EDL|Eldoret||42||4|352|3;EGM|Sege||142||-86|1579|11;EMK|Emmonak||1||628|-1645|-9;FKQ|Fak Fak||34|Fakfak|-29|1323|9;GLF|Golfito||70||87|-832|-6;HNS|Haines||1||592|-1355|-9;JIK|Ikaria||30||377|263|2;KOT|Kotlik||1||630|-1635|-9;KWK|Kwigillingok||1||599|-1632|-9;KYA|Konya||10||380|326|3;LNY|Lanai||1||208|-1570|-10;LRE|Longreach||29||-234|1443|10;MKK|Molokai||1||212|-1571|-10;MOZ|Moorea||112||-175|-1498|-10;MRE|Masai Mara||42|Mara Serena Lodge|-14|350|3;PET|Pelotas|RS|0|João Simões Lopes Neto|-317|-523|-3;SGY|Skagway||1||595|-1353|-9;SKN|Stokmarknes||35|Skagen|686|150|1;TGM|Tirgu Mures||47|Transilvania Târgu|465|244|2;TMS|Sao Tome||210||4|67|0;TMU|Nicoya||70|Tambor|97|-850|-6;UAS|Samburu South||42|Buffalo Spring|5|375|3;VLL|Valladolid||8||417|-49|1;YHD|Dryden||16||498|-927|-6;YPH|Inukjuak||16||585|-781|-5;YPM|Pikangikum||16||518|-940|-6;YVB|Bonaventure||16||481|-655|-5;AAQ|Anapa||15|Vityazevo|450|373|3;ABT|El-baha||33|Al Baha|203|416|3;ACV|Arcata CA||1|California Redwood|410|-1241|-8;ADU|Ardabil||80||383|484|3.5;AEB|Baise||2|Youjiang|237|1070|8;AGH|Ängelholm||26|Ängelholm-Helsingborg|563|128|1;AIA|Alliance||1||421|-1028|-7;AKF|Kufra||94||242|233|2;AKI|Akiak||1||609|-1612|-9;AKY|Sittwe||92||201|929|6.5;ALH|Albany||29||-349|1178|8;ANM|Antalaha||137|Antsirabato|-150|503|3;ANV|Anvik||1||626|-1602|-9;AOG|Anshan||2||411|1229|8;ATC|Arthur's Town||74||246|-757|-5;ATY|Watertown||1||449|-972|-6;AXD|Alexandroupolis||30|Dimokritos|409|260|2;AZN|Andizhan||66||407|723|5;BAL|Batman||10||379|411|3;BAX|Barnaul||15||534|835|7;BEJ|Tanjung Redep-Borneo Island||34|Kalimarau|22|1174|8;BGF|Bangui||211|M'Poko|44|185|1;BHE|Woodbourne||52||-415|1739|12;BHH|Bisha||33||200|426|3;BMU|Bima||34|Muhammad Salahuddin|-85|1187|8;BNX|Banja Luka||167||449|173|1;BPX|Bangda||2|Qamdo Bangda|306|971|8;BQB|Brusselton||29|Busselton|-337|1154|8;BQK|Brunswick||1|Golden Isles|313|-815|-5;BRO|Brownsville||1|South Padre Island|259|-974|-6;BVB|Boa Vista|RR|0|Atlas Brasil Cantanhede|28|-607|-4;BWT|Burnie||29|Wynyard|-410|1457|10;BZG|Bydgoszcz||44|Ignacy Jan Paderewski|531|180|1;CAC|Cascavel|PR|0||-250|-535|-3;CAP|Cap Haitien||144||197|-722|-5;CBO|Cotabato||31|Awang|72|1242|8;CDR|Chadron||1||428|-1031|-7;CDV|Cordova||1|Merle K (Mudhole) Smith|605|-1455|-9;CFB|Cabo Frio|RJ|0||-229|-421|-3;CHG|Chaoyang||2||415|1204|8;CLL|College Station||1|Easterwood Field|306|-964|-6;CLQ|Colima||24|Licenciado Miguel de la|193|-1036|-6;CME|Ciudad del Carmen||24||187|-918|-6;CMW|Camaguey||102|Ignacio Agramonte|214|-778|-5;CPR|Casper||1|Casper-Natrona County|429|-1065|-7;CSG|Columbus||1|Metropolitan|325|-849|-5;CUE|Cuenca||110|Mariscal Lamar|-29|-790|-5;CXB|Cox's Bazar||71||215|920|6;CXJ|Caxias do Sul|RS|0|Hugo Cantergiani|-292|-512|-3;CYF|Chefornak||1||601|-1643|-9;DBO|Dubbo||29|City|-322|1486|10;DCM|Castres||4|Castres-Mazamet|436|23|1;DHN|Dothan||1||313|-854|-6;DIR|Dire Dawa||51|Aba Tenna Dejazmach|96|419|3;DLE|Dole||4|Dole-Tavaux|470|54|1;DLG|Dillingham||1||590|-1585|-9;DMD|Doomadgee||29||-179|1388|10;DNR|Dinard||4|Dinard-Pleurtuit-Saint-M|486|-21|1;DOU|Dourados|MS|0||-222|-549|-4;DRK|Puntarenas||70|Drake Bay|87|-836|-6;DUT|Unalaska||1||539|-1665|-9;EAM|Nejran||33||176|444|3;EAS|San Sebastian||8||434|-18|1;EEK|Eek||1||602|-1620|-9;ENA|Kenai||1||606|-1512|-9;ENU|Enugu||83|Akanu Ibiam|65|76|1;EQS|Esquel||69|Brigadier Antonio|-429|-711|-3;ERC|Erzincan||10||397|395|3;ERS|Windhoek||157|Eros|-226|171|1;ESM|Esmeraldas||110|General Rivadeneira|10|-796|-5;ESU|Essadouira||43|Mogador|314|-97|0;FEN|Fernando de Noronha|PE|0||-39|-324|-3;FON|La Fortuna/San Carlos||70|Arenal|105|-846|-6;FRS|Flores||111|Mundo Maya|169|-899|-6;FSP|St.-pierre||212|St Pierre|468|-562|-3;GAJ|Yamagata||19||384|1404|9;GAN|Gan Island||103|Gan|-7|732|5;GCC|Gillette||1|Campbell County|443|-1055|-7;GET|Geraldton||29||-288|1147|8;GIU|Sigiriya||56|Air Force Base|80|807|5.5;GOM|Goma||135||-17|292|2;GPA|Patras||30|Araxos|382|214|2;GST|Gustavus||1||584|-1357|-9;GTR|Columbus Mississippi||1|Golden Triangle|335|-886|-6;GWD|Gwadar||81||252|623|5;HCR|Holy Cross||1||622|-1598|-9;HEK|Heihe||2||502|1273|8;HIN|Sacheon||9|Sacheon/Airport|351|1281|9;HJJ|Zhijiang||2||274|1097|8;HNH|Hoonah||1||581|-1354|-9;HOF|Al-ahsa||33|Al Ahsa|253|495|3;HON|Huron||1||444|-982|-6;HUX|Huatulco||24|Bahías de Huatulco|158|-963|-6;HZH|Liping||2||263|1091|8;IBE|Ibague||39|Perales|44|-751|-5;INH|Inhambane||164||-239|354|2;INU|Nauru||213||-5|1669|12;IPA|Ipota||133||-189|1693|11;IPN|Ipatinga|MG|0|Usiminas|-195|-425|-3;IRA|Kirakira||142|Ngorangora|-104|1619|11;ISC|ST MARY\\'S||3|St. Mary's|499|-63|0;JBQ|La Isabela||72||186|-700|-4;JCB|Joaçaba|SC|0|Santa Terezinha|-272|-516|-3;JEG|Aasiaat||193||687|-528|-3;JHS|Sisimiut||193||670|-537|-3;JIJ|Jijiga||51|Wilwal|93|429|3;JLR|Jabalpur||20||232|801|5.5;JSR|Jessore||71||232|892|6;JTC|Bauru|SP|0||-222|-491|-3;KAL|Kaltag||1||643|-1587|-9;KCM|Kahramanmaras||10||375|370|3;KEJ|Kemorovo||15|Kemerovo|553|861|7;KGA|Kananga||135||-59|225|2;KKH|Kongiganak||1||600|-1629|-9;KKJ|Kitakyushu||19||338|1310|9;KLR|Kalkmar||26|Kalmar|567|163|1;KLW|Klawock||1||556|-1331|-9;KOK|Kruunupyy||38|Kokkola-Pietarsaari|637|231|2;KPN|Kipnuk||1||599|-1640|-9;KPO|Pohang||9|(G-815/K-3)|360|1294|9;KRN|Kiruna||26||678|203|1;KSN|Kostanay||75|West|532|636|6;KSY|Kars||10||406|431|3;KVL|Kivalina||1||677|-1646|-9;KVX|Kirov||15|Pobedilovo|585|493|3;KWA|Kwajalein||209|Bucholz Army Air Field|87|1677|12;KWT|Kwethluk||1||608|-1614|-9;LAQ|Al Bayda'||94|La Abraq|328|220|2;LBE|Latrobe||1|Arnold Palmer|403|-794|-5;LCH|Lake Charles||1||301|-932|-6;LDH|Lord Howe Island||29||-315|1591|10.5;LEA|Learmonth||29||-222|1141|8;LFM|Lamerd||80||274|532|3.5;LIF|Lifou||178||-208|1672|11;LKN|Leknes||35||682|136|1;LLF|Yongzhou||2|Lingling|263|1116|8;LLI|Lalibella||51||120|390|3;LMP|Lampedusa||13||355|126|1;LNE|Lonorore||133||-159|1682|11;LNK|Lincoln||1||409|-968|-6;LPP|Lappeenranta||38||610|281|2;LSE|La Crosse||1||439|-913|-6;LUK|Cincinnati||1|Lunken Field|391|-844|-5;LUV|Langgur-Kei Islands||34|Dumatumbun|-57|1327|9;LWY|Lawas||22||48|1154|8;LYR|Svalbard||35|Svalbard, Longyear|782|155|1;MAU|Maupiti||112||-164|-1522|-10;MCP|Macapá|AP|0|Alberto Alcolumbre|1|-511|-3;MDQ|Mar del Plata||69|Ástor Piazzola|-379|-576|-3;MIM|Merimbula||29||-369|1499|10;MJN|Mahajanga||137|Amborovy|-157|464|3;MKQ|Merauke||34|Mopah|-85|1404|9;MLG|Malang||34|Abdul Rachman Saleh|-79|1127|7;MME|Teesside||3|Durham Tees Valley|545|-14|0;MNG|Maningrida||29||-121|1342|9.5;MOC|Montes Claros|MG|0|Mário Ribeiro|-167|-438|-3;MOV|Moranbah||29||-221|1481|10;MQT|Gwinn||1|Sawyer|464|-874|-5;MQX|Makale||51|Mekele|135|395|3;MSR|Mus||10||387|417|3;MTM|Metakatla||1|Metlakatla Seaplane|551|-1316|-9;MTR|Monteria||39|Los Garzones|88|-758|-5;MTV|Ablow||133|Mota Lava|-137|1677|11;MVP|Mitu||39|Fabio Alberto Leon|13|-702|-5;MXH|Moro||91||-64|1432|10;NAQ|Qaanaaq||193||775|-694|-4;NBX|Nabire||34||-34|1355|9;NOV|Huambo||95|Nova Lisboa|-128|158|1;NPE|NAPIER||52|Hawke's Bay|-395|1769|12;NPL|New Plymouth||52||-390|1742|12;NRL|North Ronaldsay||3||594|-24|0;NUL|Nulato||1||647|-1581|-9;OBO|Obihiro||19|Tokachi-Obihiro|427|1432|9;OBU|Kobuk||1||669|-1569|-9;OCC|Coca||110|Francisco De Orellana|-5|-770|-5;OHE|Mohe County||2|Gu-Lian|529|1224|8;OMH|Uromiyeh||80|Urmia|377|451|3.5;ONG|Mornington Island||29||-167|1392|10;OOK|Toksook Bay||1||605|-1651|-9;OPS|Sinop|MT|0|Presidente João Batista|-119|-556|-4;ORU|Oruro||140|Juan Mendoza|-180|-671|-4;OSD|Östersund||26|Åre Östersund|632|145|1;OSM|Mosul||129||363|431|3;OSY|Namsos||35|Høknesøra|645|116|1;OUZ|Zouerat||184|Tazadit|228|-125|0;PBO|Paraburdoo||29||-232|1177|8;PCR|Puerto Carreno||39|German Olano|62|-675|-5;PDA|Puerto Inírida||39|Obando|39|-679|-5;PDP|Punta del Este||149|Capitan Corbeta CA|-349|-551|-3;PEM|Puerto Maldonado||46|Padre Aldamiz|-126|-692|-5;PHS|Phitsanulok||14||168|1003|7;PKY|Palangkaraya||34|Tjilik Riwut|-22|1139|7;PLQ|Palanga||84||560|211|2;PLX|Semiplatinsk||75|Semipalatinsk|504|802|6;PMZ|Palmar Sur||70||90|-835|-6;PNI|Pohnpei||214||70|1582|11;PNL|Pantelleria||13||368|120|1;POR|Pori||38||615|218|2;PPP|Prosserpine||29|Proserpine Whitsunday|-205|1486|10;PPW|Papa Westray||3||594|-29|0;PSO|Pasto||39|Antonio Narino|14|-773|-5;PVU|Provo||1||402|-1117|-7;PWQ|Pavlodar||75||522|771|6;PXM|Puerto Escondido||24||159|-971|-6;PXO|Porto Santo||27||331|-164|0;PXU|Pleiku||50||140|1080|7;RAJ|Rajkot||20||223|708|5.5;RJA|Rajahmundry||20||171|818|5.5;RKS|Rock Springs||1|Southwest Wyoming|416|-1091|-7;RMA|Roma||29||-265|1488|10;RMI|Rimini||13|Federico Fellini|440|126|1;RNB|Ronneby||26||563|153|1;ROT|Rotorua||52||-381|1763|12;RSU|Yeosu||9||348|1276|9;RVK|Rørvik||35|Rørvik, Ryum|648|111|1;RXS|Roxas City||31|Roxas|116|1228|8;RYK|Rahim Yar Khan||81|Shaikh Zaid|284|703|5;SDD|Lubango||95||-149|136|1;SDV|Tel Aviv||41|Sde Dov|321|348|2;SFT|Skelleftea||26||646|211|1;SHG|Shungnak||1||669|-1572|-9;SHH|Shishmaref||1||662|-1661|-9;SHX|Shageluk||1||627|-1596|-9;SIT|Sitka||1|Rocky Gutierrez|570|-1354|-9;SJK|São José dos Campos|SP|0|Professor Urbano|-232|-459|-3;SKU|Skiros||30||390|245|2;SLH|Sola||133||-139|1675|11;SMA|Santa Maria (island)||27|Santa Maria|370|-252|-1;SMS|Sainte Marie||137||-171|498|3;SNP|St. Paul Island||1|St Paul Island|572|-1702|-9;SPP|Menongue||95||-147|177|1;SRP|Stord||35||598|53|1;STG|Point Barrow||1|St George|566|-1697|-9;STV|Surat||20||211|727|5.5;SUG|Sangley Point||31|Surigao|98|1255|8;SVB|Sambava||137||-143|502|3;SVJ|Svolvær||35|Helle|682|147|1;SVU|Savusavu||104||-168|1793|12;SYM|Simao||2|Pu'er Simao|228|1010|8;SZA|Soyo||95||-61|124|1;TAG|Tagbilaran||31||97|1239|8;TBI|Cat Island||74|New Bight|243|-755|-5;TIZ|Tari||91||-58|1429|10;TLA|Teller||1||652|-1663|-9;TLE|Toliara||137||-234|437|3;TLN|Hyeres||4|Toulon-Hyères|431|61|1;TMC|Waikabubak-Sumba Island||34|Tambolaka|-94|1192|8;TML|Tamale||87||96|-9|0;TNJ|Tanjung Pinang||34|Raja Haji Fisabilillah|9|1045|7;TOE|Tozeur||63|Nefta|339|81|1;TOH|Loh/Linua||133|Torres Airstrip|-133|1666|11;TPQ|Tepic||24|Amado Nervo National|214|-1048|-7;TRG|Tauranga||52||-377|1762|12;TRW|Tarawa||205|Bonriki|14|1731|12;TSJ|Tsushima||19||343|1293|9;TUG|Tuguegarao||31||176|1217|8;TVU|Matei||104||-167|-1799|12;TYR|Tyler||1|Pounds|324|-954|-6;TZL|Null||167|Tuzla|445|187|1;UAH|Ua Huka||112||-89|-1396|-9.5;UAP|Ua Pou||112||-94|-1401|-9.5;UBJ|Yamaguchi||19|Ube|339|1313|9;UBP|Ubon Ratchathani||14||153|1049|7;UEL|Quelimane||164||-179|369|2;UIH|Phucat||50|Phu Cat|140|1090|7;UKA|Ukunda||42|Airstrip|-43|396|3;URA|Uralsk||75||512|515|5;URJ|Uraj||15|Uray|601|648|5;USN|Ulsan||9||356|1294|9;USU|Busuanga||31|Francisco B. Reyes|121|1201|8;VAI|Vanimo||91||-27|1413|10;VAW|Vardø||35|Vardø, Svartnes|704|310|1;VCA|Can Tho||50||101|1057|7;VDE|Hierro||8||278|-179|0;VGA|Vijayawada||20||165|808|5.5;VIG|El Vigía||61|Juan Pablo Pérez|86|-717|-4;VIL|Dakhla||207||237|-159|0;VLD|Valdosta||1||308|-833|-5;VST|Vasteras||26|Stockholm Västerås|596|166|1;WGA|Wagga Wagga||29|City|-352|1475|10;WLS|Wallis||215|Hihifo|-132|-1762|12;WRL|Worland||1||440|-1080|-7;WUZ|Wuzhou||2|Changzhoudao|235|1112|8;WVB|Walvis Bay||157||-230|146|1;XMH|Manihi||112||-144|-1461|-10;YAY|St. Anthony||16||514|-561|-3.5;YBX|Lourdes-De-Blanc-Sablon||16|Lourdes de Blanc Sablon|514|-572|-4;YFH|Fort Hope||16||516|-879|-5;YGL|La Grande Riviere||16||536|-777|-5;YGR|Iles de la Madeleine||16|Îles-de-la-Madeleine|474|-618|-5;YGV|Havre-Saint-Pierre||16|Havre St Pierre|503|-636|-5;YHI|Holman Island||16|Ulukhaktok Holman|708|-1178|-7;YHY|Hay River||16|/ Merlyn Carter|608|-1158|-7;YIO|Pond Inlet||16||727|-780|-5;YKF|Waterloo||16||435|-804|-5;YKG|Kangirsuk||16||600|-700|-5;YMO|Moosonee||16||513|-806|-5;YMT|Chibougamau||16|Chapais|498|-745|-5;YPJ|Aupaluk||16||593|-696|-5;YQF|Red Deer Industrial||16|Red Deer|522|-1139|-7;YQG|Windsor||16||423|-830|-5;YQK|Kenora||16||498|-944|-6;YQX|Gander||16||489|-546|-3.5;YSJ|St. John||16|Saint John|453|-659|-4;YSK|Sanikiluaq||16||565|-792|-5;YTE|Cape Dorset||16||642|-765|-5;YUD|Umiujaq||16||565|-765|-5;YUM|Yuma||1|MCAS/Yuma|327|-1146|-7;YYE|Fort Nelson||16||588|-1226|-8;YZY|Zhangye||2|Ganzhou|388|1007|8;ZAT|Zhaotong||2||273|1038|8;ZCO|Temuco||68|La Araucanía|-389|-727|-3;ZGU|Gaua Island||133||-142|1676|11;ZSE|St.-pierre||156|Pierrefonds|-213|554|4;ZSJ|Sandy Lake||16||531|-933|-6;ZVK|Savannakhet||141||166|1048|7;CIJ|Cobija||140|Capitán Aníbal Arab|-110|-688|-4;ERM|Erechim|RS|0||-277|-523|-3;MEU|Almeirim|PA|0|Monte Dourado|-9|-526|-3;ACR|Araracuara||39||-6|-724|-5;AFA|San Rafael||69|Suboficial Ay Santiago|-346|-684|-3;ARU|Araçatuba|SP|0||-211|-504|-3;AUC|Arauca||39|Santiago Perez|71|-707|-5;AXM|Armenia||39|El Eden|45|-758|-5;AYP|Ayacucho||46|Coronel FAP Alfredo|-132|-742|-5;BNS|Barinas||61||86|-702|-4;BUN|Buenaventura||39|Gerardo Tobar López|38|-770|-5;CCM|Criciúma|SC|0|Diomício Freitas|-287|-494|-3;CFC|Caçador|SC|0||-268|-509|-3;CJA|Cajamarca||46|Mayor General FAP|-71|-785|-5;CLV|Caldas Novas|GO|0|Nelson Ribeiro|-177|-486|-3;CPV|Campina Grande|PB|0|Presidente João|-73|-359|-3;CZU|Corozal||39|Las Brujas|93|-753|-5;EYP|Yopal||39|El Yopal|53|-724|-5;FLA|Florencia||39|Gustavo Artunduaga|16|-756|-5;GEL|Santo Ângelo|RS|0||-283|-542|-3;GPI|Guapi||39|Juan Casiano|26|-779|-5;GPS|Galapagos||110|Seymour|-5|-903|-6;HUU|Huánuco||46|Alferez Fap David|-99|-762|-5;IPC|Easter Island||68|Mataveri|-272|-1094|-6;ITB|Itaituba|PA|0||-42|-560|-3;IZA|Juiz de Fora|MG|0|Zona da Mata|-215|-432|-3;JPR|Ji-Paraná|RO|0||-109|-618|-4;JUJ|Jujuy||69|Gobernador Horacio|-244|-651|-3;LOH|La Toma (Catamayo)||110|Camilo Ponce Enriquez|-40|-794|-5;LTX|Latacunga||110|Cotopaxi|-9|-786|-5;MII|Marília|SP|0|Frank Miloye|-222|-499|-3;MRD|Mérida||61|Alberto Carnevalli|86|-712|-4;NVA|Neiva||39|Benito Salas|30|-753|-5;PBL|Puerto Cabello||61|General Bartolome Salom|105|-681|-4;PHB|Parnaíba|PI|0|Prefeito Doutor João|-29|-417|-3;PIU|Piura||46|Capitán FAP Guillermo|-52|-806|-5;POI|Potosi||140|Capitan Nicolas Rojas|-195|-657|-4;PPB|Presidente Prudente|SP|0||-222|-514|-3;PRA|Parana||69|General Urquiza|-318|-605|-3;RBQ|Rerrenabaque||140|Rurenabaque|-144|-675|-4;RGA|Rio Grande||69|Hermes Quijada|-538|-677|-3;RVE|Saravena||39|Los Colonizadores|70|-719|-5;SFN|Santa Fe||69|Sauce Viejo|-317|-608|-3;SJE|San Jose del Guaviare||39|Jorge E. Gonzalez|26|-726|-5;SVI|San Vincente de Caguan||39|Eduardo Falla Solano|22|-748|-5;TCQ|Tacna||46|Coronel FAP Carlos|-181|-703|-5;TME|Tame||39|Gustavo Vargas|65|-718|-5;TUC|Tucuman||69|Teniente Benjamin|-268|-651|-3;UAQ|San Juan||69|Domingo Faustino|-316|-684|-3;VLV|Valera||61|Dr. Antonio Nicolás|93|-706|-4;VUP|Valledupar||39|Alfonso López Pumarejo|104|-732|-5;ZAL|Valdivia||68|Pichoy|-397|-731|-4;LUQ|San Luis||69|Brigadier Mayor D Cesar|-333|-664|-3;OIA|Ourilândia do Norte|PA|0||-68|-510|-3;ORX|Oriximiná|PA|0||-17|-558|-3;POJ|Patos de Minas|MG|0||-187|-465|-3;AAX|Araxá|MG|0|Romeu Zema|-196|-470|-3;AFL|Alta Floresta|MT|0|Piloto Osvaldo Marques|-99|-561|-4;ANS|Andahuaylas||46||-137|-734|-5;AQA|Araraquara|SP|0||-218|-481|-3;ATA|Anta||46|Comandante FAP German|-93|-776|-5;BAZ|Barcelos|AM|0||-10|-629|-4;BSC|Bahia Solano||39|José Celestino Mutis|62|-774|-5;BVH|Vilhena|RO|0|Brigadeiro Camarão|-127|-601|-4;BYO|Bonito|MS|0||-212|-565|-4;CAJ|Canaima||61||62|-629|-4;CDJ|Conceição do Araguaia|PA|0||-83|-493|-3;CIX|Chiclayo||46|Capitan FAP Jose A|-68|-798|-5;CIZ|Coari|AM|0||-41|-631|-4;CMG|Corumbá|MS|0||-190|-577|-4;CPC|San Martin Des Andes||69|Aviador C. Campos|-401|-711|-3;CTC|Catamarca||69||-286|-658|-3;CUM|Cumana||61|(Antonio José de Sucre)|105|-641|-4;CZE|Coro||61|José Leonardo Chirinos|114|-697|-4;CZS|Cruzeiro do Sul|AC|0||-76|-728|-5;EJA|Barrancabermeja||39|Yariguíes|70|-738|-5;ERN|Eirunepé|AM|0||-66|-699|-4;ETR|Santa Rosa||110||-34|-800|-5;FMA|Formosa||69||-262|-582|-3;GNM|Guanambi|BA|0||-142|-427|-3;GPB|Guarapuava|PR|0|Tancredo Thomas de|-254|-515|-3;GRP|Gurupi|TO|0||-117|-491|-3;GVR|Governador Valadares|MG|0|Coronel Altino Machado|-189|-420|-3;GYA|Guayaramerín||140|Capitán de Av. Emilio|-108|-653|-4;IPI|Ipiales||39|San Luis|9|-777|-5;IRJ|La Rioja||69|Capitan V A Almonacid|-294|-668|-3;IRZ|Santa Isabel do Rio Negro|AM|0|Tapuruquara|-4|-650|-4;JAU|Jauja||46|Francisco Carle|-118|-755|-5;LAZ|Bom Jesus da Lapa|BA|0||-133|-434|-3;LEC|Lençóis|BA|0|Coronel Horácio de|-125|-413|-3;LFR|La Fria||61||82|-723|-4;LPD|La Pedrera||39||-13|-696|-5;LQM|Puerto Leguízamo||39|Caucaya|-2|-748|-5;MEC|Manta||110|Eloy Alfaro|-9|-807|-5;MHC|Castro||68|Mocopulli|-423|-737|-4;MQH|Minaçu|GO|0||-135|-482|-3;MZL|Manizales||39|La Nubia|50|-755|-5;NQU|Nuquí||39|Reyes Murillo|57|-773|-5;OAL|Cacoal|RO|0||-115|-615|-4;OGL|Georgetown||194|Eugene F. Correira|68|-581|-4;OLC|São Paulo de Olivença|AM|0|Senadora Eunice|-35|-689|-4;PAV|Paulo Afonso|BA|0||-94|-383|-3;PIN|Parintins|AM|0||-27|-568|-4;PMY|Puerto Madryn||69|El Tehuelche|-428|-651|-3;PPN|Popayan||39|Guillermo León Valencia|25|-766|-5;PSS|Posadas||69|Libertador Gral D Jose|-274|-560|-3;PVA|Providencia||39|El Embrujo|134|-814|-5;PYH|Puerto Ayacucho||61|Cacique Aramare|56|-676|-4;RCH|Rio Hacha||39|Almirante Padilla|115|-729|-5;RDC|Redenção|PA|0||-80|-500|-3;RES|Resistencia||69||-274|-591|-3;RHD|Rio Hondo||69|Termas de Río Hondo|-275|-649|-3;RIB|Riberalta||140|Capitán Av. Selin|-110|-660|-4;ROO|Rondonópolis|MT|0|Maestro Marinho Franco|-166|-547|-4;RSA|Santa Rosa||69||-366|-643|-3;RVD|Rio Verde|GO|0|General Leite de Castro|-178|-510|-3;SDE|Santiago del Estero||69|Vicecomodoro Angel D.|-278|-643|-3;SJL|São Gabriel da Cachoeira|AM|0||-1|-670|-4;SNV|Santa Ana de Uairen||61|Santa Elena de Uairen|46|-612|-4;SOM|San Tome||61||89|-642|-4;SRA|Santa Rosa|RS|0||-279|-545|-3;SVZ|San Antonio||61|Del Tachira|78|-724|-4;SXO|São Félix do Araguaia|MT|0||-116|-507|-4;TBP|Tumbes||46|Capitan FAP Pedro Canga|-36|-804|-5;TBT|Tabatinga|AM|0||-43|-699|-4;TCO|Tumaco||39|La Florida|18|-787|-5;TGI|Tingo Maria||46||-91|-759|-5;TMT|Oriximiná|PA|0|Trombetas|-15|-564|-3;TNW|Tena||110|Jumandy|-11|-776|-5;TRU|Trujillo||46|Capitan FAP Carlos|-81|-791|-5;TUR|Tucuruí|PA|0||-38|-497|-3;URG|Uruguaiana|RS|0|Rubem Berta|-298|-570|-3;UYU|Uyuni||140||-204|-668|-4;VDM|Viedma||69|Gobernador Castello|-409|-630|-3;VGZ|Villa Garzon||39||10|-766|-5;XMS|Macas||110|Coronel E Carvajal|-23|-781|-5;ZOS|Osorno||68|Cañal Bajo Carlos|-406|-731|-4;BVS|Breves||0||-16|-504|-3;CMP|Santana do Araguaia||0||-93|-503|-3;STZ|Santa Terezinha||0||-105|-505|-4;SXX|Sao Felix do Xingu||0||-66|-520|-3";
var CIDADES = [], AEROPORTOS = [], PORTO = {};
var PK = [];   /* nome de cada país sem acento, para procurar por país */
(function abrirBase(){
  for(var q = 0; q < PAISES.length; q++) PK.push(semAcento(PAISES[q]));
  var b = CIDADES_TXT.split(';'), i, c, o;
  for(i = 0; i < b.length; i++){
    c = b[i].split('|');
    o = { n:c[0], uf:c[1], p:PAISES[+c[2]] };
    o.k = semAcento(o.n); o.kp = PK[+c[2]]; o.i = i;
    CIDADES.push(o);
  }
  b = AEROPORTOS_TXT.split(';');
  for(i = 0; i < b.length; i++){
    c = b[i].split('|');
    o = { iata:c[0], n:c[1], uf:c[2], p:PAISES[+c[3]], aero:c[4] || '',
          la:(+c[5])/10, lo:(+c[6])/10, tz:+c[7] };
    o.k = semAcento(o.n); o.ka = o.aero ? semAcento(o.aero) : '';
    o.kp = PK[+c[3]]; o.i = i;
    AEROPORTOS.push(o);
    PORTO[o.iata] = o;
  }
})();
/* As últimas pesquisas saem da própria base: o item guarda o índice (c.i),
   que é o que o clique usa para achar a cidade de volta. */
var HIST = (function(){
  var quero = ['Rio de Janeiro', 'Porto Seguro', 'Gramado'], saida = [];
  for(var i = 0; i < quero.length; i++){
    var achou = CIDADES.filter(function(c){ return c.n === quero[i] && c.p === 'Brasil'; })[0];
    if(achou) saida.push(achou);
  }
  return saida;
})();
function guardarHist(c){
  if(!c || c.i === undefined) return;
  HIST = HIST.filter(function(h){ return h.i !== c.i; });
  HIST.unshift(c);
  if(HIST.length>5) HIST.length=5;
}
var HOTEIS=[
 {id:1,n:'Rio Othon Palace',b:'Copacabana',e:4,cat:'Midscale',img:'hotel-1.jpg',de:3847.28,por:3445.32,
  am:['cafe','piscina'],
  end:'Av. Atlântica, 3265, Copacabana',
  d:'Localizado à beira-mar da Praia de Copacabana, o Othon Palace oferece academia e piscina na cobertura com vista para o Pão de Açúcar. O café da manhã é servido no 3º andar com vista panorâmica. Wi-Fi grátis em todas as áreas.'},
 {id:2,n:'Hotel Atlântico Avenida',b:'Centro',e:3,cat:'Econômico',img:'hotel-2.jpg',de:2190.00,por:1962.40,
  am:['cafe'],
  end:'Av. Rio Branco, 152, Centro',
  d:'A poucos passos do metrô, ideal para quem viaja a trabalho. Café da manhã incluso, academia 24h e sala de reuniões.'},
 {id:3,n:'Praia Bella Resort',b:'Barra da Tijuca',e:5,cat:'Upscale',img:'hotel-3.jpg',de:5410.00,por:4785.90,
  am:['piscina','pet'],
  end:'Av. Lúcio Costa, 8000, Barra',
  d:'Resort pé na areia com três piscinas, spa completo e restaurante assinado. Kids club e day use de pranchas inclusos.'},
 {id:4,n:'Copa Sunset Hotel',b:'Leme',e:4,cat:'Midscale',img:'hotel-4.jpg',de:3120.00,por:2760.15,
  am:['cafe','pet'],
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
/* O catálogo base é carioca. Para destinos de fora, os quatro hotéis ganham
   nome, bairro e endereço da cidade escolhida — as cidades mais procuradas têm
   texto próprio, as demais usam um molde neutro. */
var HOTEIS_CIDADE = {
 'Lisboa': [
   ['Avenida Palace','Baixa','R. 1º de Dezembro, 123','Em pleno Rossio, a dois passos do Chiado e do elevador de Santa Justa. Pequeno-almoço servido no salão nobre.'],
   ['Hotel Baixa Avenida','Baixa','Av. da Liberdade, 152','Na principal avenida da cidade, perto do metrô Avenida. Ideal para quem viaja a trabalho.'],
   ['Belém Tejo Resort','Belém','Av. Brasília, 800','De frente para o Tejo, com piscina, spa e restaurante de cozinha portuguesa contemporânea.'],
   ['Alfama Sunset Hotel','Alfama','Largo do Chafariz, 86','Rooftop com vista para o rio e para o Castelo de São Jorge. Quartos reformados em 2025.']],
 'Nova York': [
   ['Midtown Grand Palace','Midtown','5th Ave, 3265','A quarteirões do Central Park e do MoMA. Academia e piscina na cobertura.'],
   ['Hotel Hudson Avenue','Hell\u2019s Kitchen','W 42nd St, 152','Ao lado da estação Times Square, bom para viagem de negócios. Café da manhã incluso.'],
   ['Brooklyn Bay Resort','Brooklyn','Furman St, 800','De frente para a ponte do Brooklyn, com três piscinas e spa completo.'],
   ['Upper Sunset Hotel','Upper East Side','Lexington Ave, 866','Rooftop com vista para o skyline e traslado do aeroporto incluso.']],
 'Paris': [
   ['Louvre Palace Hôtel','1er','Rue de Rivoli, 32','A cem metros do Louvre, com café da manhã servido no pátio interno.'],
   ['Hôtel Avenue Centrale','9e','Bd Haussmann, 152','Perto da Ópera e das Galeries Lafayette, com sala de reuniões e academia 24h.'],
   ['Seine Bella Resort','7e','Quai Branly, 80','Às margens do Sena, com vista para a Torre Eiffel, spa e restaurante estrelado.'],
   ['Montmartre Sunset','18e','Rue Lepic, 86','Terraço com vista para toda a cidade, a um quarteirão do Sacré-Cœur.']],
 'Buenos Aires': [
   ['Recoleta Palace','Recoleta','Av. Alvear, 3265','No bairro mais elegante da cidade, com piscina climatizada e parrilla própria.'],
   ['Hotel Avenida de Mayo','Monserrat','Av. de Mayo, 152','Em frente ao metrô, a dez minutos da Casa Rosada. Café da manhã incluso.'],
   ['Puerto Madero Resort','Puerto Madero','Av. Alicia M. de Justo, 800','Nos docks reformados, com três piscinas, spa e vista para o rio.'],
   ['Palermo Sunset Hotel','Palermo Soho','Thames, 866','Rooftop no coração de Palermo, cercado de bares e lojas de design.']],
 'Madri': [
   ['Gran Vía Palace','Centro','Gran Vía, 32','No eixo dos teatros, a cinco minutos da Puerta del Sol.'],
   ['Hotel Avenida Atocha','Atocha','Paseo del Prado, 152','Entre o Prado e o Reina Sofía, ao lado da estação de Atocha.'],
   ['Retiro Bella Resort','Retiro','C. de Alfonso XII, 80','De frente para o parque do Retiro, com spa e piscina coberta.'],
   ['Chueca Sunset Hotel','Chueca','C. de Hortaleza, 86','Terraço com vista para os telhados do centro histórico.']],
 'Orlando': [
   ['International Grand Palace','International Drive','International Dr, 3265','A dez minutos dos parques, com transporte gratuito e piscina aquecida.'],
   ['Hotel Avenue Lake Buena','Lake Buena Vista','Palm Pkwy, 152','Ao lado do outlet, com café da manhã incluso e lavanderia.'],
   ['Kissimmee Bella Resort','Kissimmee','W Irlo Bronson Hwy, 800','Resort com parque aquático próprio, kids club e quadra de tênis.'],
   ['Celebration Sunset Hotel','Celebration','Celebration Ave, 866','Em frente ao lago, com traslado para os parques incluso na diária.']]
};
var MOLDE_HOTEL = [
 ['{c} Palace Hotel','Centro','Rua Central, 3265','No centro histórico, com academia e piscina na cobertura. Café da manhã com vista panorâmica.'],
 ['Hotel Avenida {c}','Centro','Avenida Central, 152','A poucos passos do transporte público, ideal para quem viaja a trabalho. Café da manhã incluso.'],
 ['{c} Bella Resort','Orla','Avenida Beira-Mar, 800','Resort com três piscinas, spa completo e restaurante assinado. Kids club incluso.'],
 ['{c} Sunset Hotel','Centro','Rua das Flores, 866','Rooftop com vista para a cidade e quartos reformados em 2025.']
];
function catalogoHoteis(){
  var cidade = S.cidade, pais = S.pais;
  if(!cidade || !pais || pais === 'Brasil') return HOTEIS;
  var molde = HOTEIS_CIDADE[cidade] || MOLDE_HOTEL.map(function(m){
    return [m[0].replace('{c}', cidade), m[1], m[2], m[3]];
  });
  return HOTEIS.map(function(h, i){
    var m = molde[i] || molde[0];
    var novo = {}; for(var k in h) novo[k] = h[k];
    novo.n = m[0]; novo.b = m[1]; novo.end = m[2] + ', ' + m[1]; novo.d = m[3];
    return novo;
  });
}
/* ---------- filtros da hospedagem ----------
   Antes os chips eram enfeite: nasciam marcados no HTML, o contador era um "2"
   escrito à mão e a lista não mudava. Agora o filtro vive no estado e a tela
   responde a ele, como já acontece no aéreo. */
var FAIXAS = [['Até R$ 400', 0, 400], ['R$ 400–800', 400, 800], ['R$ 800+', 800, 1e9]];
var COMODIDADES = [['cafe', 'Café da manhã'], ['piscina', 'Piscina'], ['pet', 'Pet friendly']];
function filtrosHotel(){
  if(!S.filtros) S.filtros = { preco:[], estrelas:[], com:[] };
  return S.filtros;
}
function rascunhoHotel(){
  if(!S.rascunhoF){
    var f = filtrosHotel();
    S.rascunhoF = { preco:f.preco.slice(), estrelas:f.estrelas.slice(), com:f.com.slice() };
  }
  return S.rascunhoF;
}
/* o card mostra o total da estada; o filtro é por noite */
function precoNoite(h){ return h.por / (noites() || 5); }
function filtrosHotelAplicados(f){
  return (f.preco.length ? 1 : 0) + (f.estrelas.length ? 1 : 0) + (f.com.length ? 1 : 0);
}
function hotelPassa(h, f){
  if(f.preco.length){
    var p = precoNoite(h), cabe = false;
    for(var i = 0; i < f.preco.length; i++){
      var fx = FAIXAS[+f.preco[i]];
      if(fx && p >= fx[1] && p < fx[2]) cabe = true;
    }
    if(!cabe) return false;
  }
  if(f.estrelas.length && f.estrelas.indexOf(String(h.e)) < 0) return false;
  for(var j = 0; j < f.com.length; j++)       /* comodidade é "e", não "ou" */
    if((h.am || []).indexOf(f.com[j]) < 0) return false;
  return true;
}
/* restaurante e wi-fi todos têm; o resto o card mostra conforme o hotel, para
   quem filtra por piscina ver no card por que aquele hotel ficou */
function amenidades(h){
  var am = h.am || [], s = I.rest + I.wifi;
  if(am.indexOf('cafe') >= 0)    s += I.cafe;
  if(am.indexOf('piscina') >= 0) s += I.piscina;
  if(am.indexOf('pet') >= 0)     s += I.pet;
  return s;
}
function hoteisFiltrados(){
  var f = filtrosHotel();
  return catalogoHoteis().filter(function(h){ return hotelPassa(h, f); });
}
function precoBase(){ var h=S.hotel||catalogoHoteis()[0]; var q=S.quarto? S.quarto.dif:0; return h.por+q; }
function precoDe(){ var h=S.hotel||catalogoHoteis()[0]; var q=S.quarto? S.quarto.dif:0; return h.de+q; }
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
 filtro:'<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M11.9997 20.75C11.7871 20.75 11.609 20.6781 11.4654 20.5344C11.3218 20.3906 11.25 20.2125 11.25 20V16C11.25 15.7875 11.3219 15.6094 11.4657 15.4657C11.6095 15.3219 11.7877 15.25 12.0003 15.25C12.2129 15.25 12.391 15.3219 12.5346 15.4657C12.6782 15.6094 12.75 15.7875 12.75 16V17.25H20C20.2125 17.25 20.3906 17.3219 20.5344 17.4657C20.6781 17.6095 20.75 17.7877 20.75 18.0003C20.75 18.2129 20.6781 18.391 20.5344 18.5346C20.3906 18.6782 20.2125 18.75 20 18.75H12.75V20C12.75 20.2125 12.6781 20.3906 12.5343 20.5344C12.3905 20.6781 12.2123 20.75 11.9997 20.75ZM4 18.75C3.7875 18.75 3.60938 18.6781 3.46565 18.5343C3.3219 18.3905 3.25003 18.2123 3.25003 17.9997C3.25003 17.7871 3.3219 17.609 3.46565 17.4654C3.60938 17.3218 3.7875 17.25 4 17.25H8C8.2125 17.25 8.39062 17.3219 8.53435 17.4657C8.6781 17.6095 8.74997 17.7877 8.74997 18.0003C8.74997 18.2129 8.6781 18.391 8.53435 18.5346C8.39062 18.6782 8.2125 18.75 8 18.75H4ZM7.99968 14.75C7.78707 14.75 7.60898 14.6781 7.4654 14.5344C7.32182 14.3906 7.25003 14.2125 7.25003 14V12.75H4C3.7875 12.75 3.60938 12.6781 3.46565 12.5343C3.3219 12.3905 3.25003 12.2123 3.25003 11.9997C3.25003 11.7871 3.3219 11.609 3.46565 11.4654C3.60938 11.3218 3.7875 11.25 4 11.25H7.25003V10C7.25003 9.7875 7.32193 9.60938 7.46573 9.46563C7.60954 9.32189 7.78774 9.25002 8.00033 9.25002C8.21293 9.25002 8.39102 9.32189 8.5346 9.46563C8.67818 9.60938 8.74997 9.7875 8.74997 10V14C8.74997 14.2125 8.67808 14.3906 8.53428 14.5344C8.39046 14.6781 8.21226 14.75 7.99968 14.75ZM12 12.75C11.7875 12.75 11.6094 12.6781 11.4657 12.5343C11.3219 12.3905 11.25 12.2123 11.25 11.9997C11.25 11.7871 11.3219 11.609 11.4657 11.4654C11.6094 11.3218 11.7875 11.25 12 11.25H20C20.2125 11.25 20.3906 11.3219 20.5344 11.4657C20.6781 11.6095 20.75 11.7877 20.75 12.0003C20.75 12.2129 20.6781 12.391 20.5344 12.5346C20.3906 12.6782 20.2125 12.75 20 12.75H12ZM15.9997 8.74998C15.7871 8.74998 15.609 8.67811 15.4654 8.53438C15.3218 8.39062 15.25 8.2125 15.25 8V4C15.25 3.7875 15.3219 3.60937 15.4657 3.46562C15.6095 3.32189 15.7877 3.25002 16.0003 3.25002C16.2129 3.25002 16.391 3.32189 16.5346 3.46562C16.6782 3.60937 16.75 3.7875 16.75 4V5.25002H20C20.2125 5.25002 20.3906 5.32193 20.5344 5.46573C20.6781 5.60954 20.75 5.78774 20.75 6.00033C20.75 6.21293 20.6781 6.39102 20.5344 6.5346C20.3906 6.67818 20.2125 6.74998 20 6.74998H16.75V8C16.75 8.2125 16.6781 8.39062 16.5343 8.53438C16.3905 8.67811 16.2123 8.74998 15.9997 8.74998ZM4 6.74998C3.7875 6.74998 3.60938 6.67807 3.46565 6.53427C3.3219 6.39046 3.25003 6.21226 3.25003 5.99968C3.25003 5.78708 3.3219 5.60898 3.46565 5.4654C3.60938 5.32182 3.7875 5.25002 4 5.25002H12C12.2125 5.25002 12.3906 5.32193 12.5344 5.46573C12.6781 5.60954 12.75 5.78774 12.75 6.00033C12.75 6.21293 12.6781 6.39102 12.5344 6.5346C12.3906 6.67818 12.2125 6.74998 12 6.74998H4Z"/></svg>',
 cama:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M3 18v-9m0 5h18m0 4v-6a3 3 0 0 0-3-3H9"/><circle cx="7" cy="11" r="2"/></svg>',
 in:'<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M7 17L17 7M9 7h8v8"/></svg>',
 out:'<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M7 7l10 10M15 17H7V9"/></svg>',
 check:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M4 12.5l5.2 5L20 7"/></svg>',
 carrinho:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><circle cx="9" cy="20" r="1.4"/><circle cx="17" cy="20" r="1.4"/><path d="M2 3h3l2.6 12h10.2L21 7H6"/></svg>',
 relogio:'<svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M10.625 9.74679V6.45831C10.625 6.28124 10.5651 6.13281 10.4452 6.01302C10.3254 5.89323 10.1769 5.83333 9.99973 5.83333C9.82256 5.83333 9.67415 5.89323 9.5545 6.01302C9.43485 6.13281 9.37502 6.28124 9.37502 6.45831V9.9391C9.37502 10.0372 9.39318 10.1322 9.4295 10.2242C9.46582 10.3162 9.52298 10.4012 9.60098 10.4792L12.4551 13.3333C12.5705 13.4487 12.7156 13.5077 12.8902 13.5104C13.0649 13.5131 13.2126 13.4541 13.3333 13.3333C13.4541 13.2126 13.5144 13.0663 13.5144 12.8943C13.5144 12.7222 13.4541 12.5759 13.3333 12.4551L10.625 9.74679ZM10.0014 17.9166C8.90645 17.9166 7.87726 17.7089 6.91381 17.2933C5.95035 16.8778 5.11228 16.3138 4.3996 15.6014C3.68691 14.8891 3.12269 14.0514 2.70696 13.0883C2.29122 12.1253 2.08335 11.0963 2.08335 10.0014C2.08335 8.90645 2.29113 7.87726 2.70669 6.91381C3.12224 5.95035 3.6862 5.11229 4.39856 4.39961C5.11094 3.68691 5.94864 3.12269 6.91167 2.70696C7.87468 2.29122 8.90366 2.08335 9.9986 2.08335C11.0935 2.08335 12.1227 2.29113 13.0862 2.70669C14.0496 3.12224 14.8877 3.6862 15.6004 4.39856C16.3131 5.11094 16.8773 5.94864 17.293 6.91167C17.7088 7.87468 17.9166 8.90366 17.9166 9.99861C17.9166 11.0936 17.7089 12.1227 17.2933 13.0862C16.8778 14.0496 16.3138 14.8877 15.6014 15.6004C14.8891 16.3131 14.0514 16.8773 13.0883 17.293C12.1253 17.7088 11.0963 17.9166 10.0014 17.9166ZM10 16.6667C11.8472 16.6667 13.4201 16.0174 14.7188 14.7188C16.0174 13.4201 16.6667 11.8472 16.6667 10C16.6667 8.15278 16.0174 6.57986 14.7188 5.28125C13.4201 3.98264 11.8472 3.33333 10 3.33333C8.15278 3.33333 6.57986 3.98264 5.28125 5.28125C3.98264 6.57986 3.33333 8.15278 3.33333 10C3.33333 11.8472 3.98264 13.4201 5.28125 14.7188C6.57986 16.0174 8.15278 16.6667 10 16.6667Z"/></svg>',
 mala:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><rect x="3" y="7" width="18" height="14" rx="2.5"/><path d="M8.5 7V5a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v2"/></svg>',
 mail:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3.5 7l8.5 6 8.5-6"/></svg>',
 rest:'<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 3v8a2 2 0 0 0 4 0V3M8 11v10M17 3c-1.5 1.5-2 3-2 5s.6 3 2 3.4V21"/></svg>',
 cafe:'<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 8h12v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V8zM16 9h2a2.5 2.5 0 0 1 0 5h-2M4 21h13"/></svg>',
 wifi:'<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 9a13 13 0 0 1 16 0M7 13a8 8 0 0 1 10 0"/><circle cx="12" cy="17.5" r="1.2" fill="currentColor"/></svg>',
 piscina:'<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 14.5c1.9 0 1.9 1.6 3.8 1.6s1.9-1.6 3.8-1.6 1.9 1.6 3.8 1.6 1.9-1.6 3.8-1.6 1.9 1.6 3.8 1.6"/><path d="M2.5 19c1.9 0 1.9 1.6 3.8 1.6S8.2 19 10.1 19s1.9 1.6 3.8 1.6S15.8 19 17.7 19s1.9 1.6 3.8 1.6"/><path d="M8 13V6a2.3 2.3 0 0 1 4.6 0M12.6 12V6"/><path d="M8 9.2h4.6"/></svg>',
 pet:'<svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><ellipse cx="7" cy="8.2" rx="1.9" ry="2.5"/><ellipse cx="12" cy="6.6" rx="1.9" ry="2.6"/><ellipse cx="17" cy="8.2" rx="1.9" ry="2.5"/><path d="M12 11.6c2.6 0 5 2.3 5 4.6 0 1.6-1.3 2.6-3 2.6-.8 0-1.4-.3-2-.3s-1.2.3-2 .3c-1.7 0-3-1-3-2.6 0-2.3 2.4-4.6 5-4.6Z"/></svg>',
 cartao:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 9.5h19"/></svg>',
 alerta:'<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7.4v5.4M12 16.2v.1"/></svg>',
/* ícones da faixa de produtos, iguais aos do Figma (Produtos/*) */
 pHotel:'<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.7905 5.0085C20.0369 4.35438 19.0754 3.99638 18.0821 4.00003H5.91793C4.80457 4.00633 3.73858 4.45612 2.9513 5.25179C2.16403 6.04745 1.71898 7.1248 1.71274 8.25002V12.0918C1.25199 12.7436 1.00294 13.5239 1 14.3249V20.2797C1.00595 20.4688 1.08295 20.6486 1.21534 20.7824C1.34774 20.9162 1.5256 20.994 1.71274 21C1.90177 21 2.08306 20.9241 2.21673 20.789C2.35039 20.6539 2.42549 20.4707 2.42549 20.2797V17.4463H21.5745V20.2797C21.5745 20.4707 21.6496 20.6539 21.7833 20.789C21.9169 20.9241 22.0982 21 22.2873 21C22.4744 20.994 22.6523 20.9162 22.7847 20.7824C22.9171 20.6486 22.9941 20.4688 23 20.2797V14.3249C22.9971 13.5239 22.748 12.7436 22.2873 12.0918V8.25002C22.2859 7.63224 22.1512 7.02219 21.8928 6.46236C21.6343 5.90253 21.2581 5.40639 20.7905 5.0085ZM4.11231 6.11302C4.61579 5.6788 5.25605 5.4404 5.91793 5.4407H18.0821C18.4471 5.4407 18.8086 5.51337 19.1458 5.65455C19.4831 5.79573 19.7895 6.00266 20.0476 6.26353C20.3057 6.5244 20.5105 6.8341 20.6502 7.17494C20.7899 7.51578 20.8618 7.8811 20.8618 8.25002V10.8913C20.4668 10.6916 20.0409 10.5616 19.6026 10.5071V9.25849C19.6026 8.74904 19.4023 8.26045 19.0459 7.90021C18.6895 7.53997 18.206 7.33759 17.7019 7.33759H14.7559C14.2519 7.33759 13.7684 7.53997 13.412 7.90021C13.0555 8.26045 12.8553 8.74904 12.8553 9.25849V10.4831H11.1447V9.25849C11.1447 8.74904 10.9445 8.26045 10.588 7.90021C10.2316 7.53997 9.74814 7.33759 9.24406 7.33759H6.29806C5.79397 7.33759 5.31054 7.53997 4.95409 7.90021C4.59765 8.26045 4.39741 8.74904 4.39741 9.25849V10.5071C3.95908 10.5616 3.53321 10.6916 3.13823 10.8913V8.25002C3.13807 7.84382 3.22508 7.44242 3.39324 7.07349C3.56141 6.70456 3.80674 6.37687 4.11231 6.11302ZM18.1771 10.4831H14.2808V9.25849C14.2808 9.13113 14.3308 9.00898 14.4199 8.91892C14.5091 8.82886 14.6299 8.77827 14.7559 8.77827H17.7019C17.828 8.77827 17.9488 8.82886 18.0379 8.91892C18.127 9.00898 18.1771 9.13113 18.1771 9.25849V10.4831ZM9.71922 10.4831H5.82289V9.25849C5.82289 9.13113 5.87296 9.00898 5.96207 8.91892C6.05118 8.82886 6.17204 8.77827 6.29806 8.77827H9.24406C9.37008 8.77827 9.49094 8.82886 9.58005 8.91892C9.66916 9.00898 9.71922 9.13113 9.71922 9.25849V10.4831ZM2.42549 16.0057V14.3249C2.4234 13.7219 2.64362 13.1398 3.0432 12.6921H3.06695C3.28395 12.4514 3.54803 12.2588 3.84248 12.1265C4.13692 11.9943 4.45532 11.9252 4.77754 11.9237H19.2225C19.5447 11.9252 19.8631 11.9943 20.1575 12.1265C20.452 12.2588 20.716 12.4514 20.933 12.6921H20.9568C21.3589 13.1286 21.58 13.7045 21.5745 14.3009V15.9816L2.42549 16.0057Z"/></svg>',
 pAviao:'<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" clip-rule="evenodd" d="M9.57892 2.53469L8.86967 2.71201L11.4426 10.4308H5.4774L3.9774 7.93083H2.17668L4.26001 11.6808L2.17668 15.4308H3.9774L5.4774 12.9308H11.4426L8.86967 20.6497L9.57892 20.827L14.486 13.6894C14.8125 13.2145 15.3518 12.9308 15.9281 12.9308H20.902C21.5924 12.9308 22.152 12.3712 22.152 11.6808C22.152 10.9905 21.5924 10.4308 20.902 10.4308H15.9281C15.3518 10.4308 14.8125 10.1471 14.486 9.67226L9.57892 2.53469ZM9.38346 1.03739C9.88961 0.910857 10.4211 1.11199 10.7167 1.54191L15.7221 8.82246C15.7687 8.8903 15.8457 8.93083 15.9281 8.93083H20.902C22.4208 8.93083 23.652 10.162 23.652 11.6808C23.652 13.1996 22.4208 14.4308 20.902 14.4308H15.9281C15.8457 14.4308 15.7687 14.4714 15.7221 14.5392L10.7167 21.8197C10.4211 22.2497 9.88961 22.4508 9.38346 22.3243L8.24396 22.0394C7.53756 21.8628 7.13102 21.1222 7.36127 20.4314L9.36147 14.4308H6.32668L5.19081 16.324C4.96491 16.7005 4.55802 16.9308 4.11895 16.9308H1.7518C0.798693 16.9308 0.196232 15.9069 0.659101 15.0738L2.54407 11.6808L0.659102 8.28789C0.196233 7.45472 0.798692 6.43083 1.7518 6.43083H4.11895C4.55802 6.43083 4.96491 6.6612 5.19081 7.03771L6.32668 8.93083H9.36147L7.36127 2.93023C7.13102 2.23946 7.53756 1.49887 8.24396 1.32227L9.38346 1.03739Z"/></svg>',
 pCarro:'<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M5 14C5 13.5858 5.33579 13.25 5.75 13.25H8.25C8.66421 13.25 9 13.5858 9 14C9 14.4142 8.66421 14.75 8.25 14.75H5.75C5.33579 14.75 5 14.4142 5 14Z"/><path d="M15 14C15 13.5858 15.3358 13.25 15.75 13.25H18.25C18.6642 13.25 19 13.5858 19 14C19 14.4142 18.6642 14.75 18.25 14.75H15.75C15.3358 14.75 15 14.4142 15 14Z"/><path fill-rule="evenodd" clip-rule="evenodd" d="M8.012 3.25C6.50267 3.25 5.19091 4.28991 4.84764 5.76052C4.84373 5.77726 4.8404 5.79413 4.83765 5.8111L4.30896 9.07556L2.26657 8.29898C1.8794 8.15177 1.4462 8.3463 1.29899 8.73347C1.15177 9.12064 1.3463 9.55384 1.73347 9.70105L2.67364 10.0585C1.80635 10.7454 1.25 11.8077 1.25 13V18.75C1.25 19.8542 2.14579 20.75 3.25 20.75H5.5C6.74221 20.75 7.75 19.7422 7.75 18.5V18.25H16.25V18.5C16.25 19.7422 17.2578 20.75 18.5 20.75H20.75C21.8542 20.75 22.75 19.8542 22.75 18.75V13C22.75 11.8082 22.1942 10.7463 21.3275 10.0595L22.2675 9.70072C22.6544 9.55301 22.8484 9.11956 22.7007 8.73258C22.553 8.34559 22.1196 8.15162 21.7326 8.29932L19.748 9.0568C19.7522 9.00119 19.7502 8.94425 19.7414 8.88677L19.2814 5.87477C19.2793 5.86111 19.2769 5.8475 19.274 5.83397C18.9582 4.32899 17.6312 3.25 16.092 3.25H8.012ZM18.2927 9.25C18.2774 9.20635 18.2658 9.16065 18.2586 9.11323L17.802 6.12352C17.6249 5.32218 16.9145 4.75 16.092 4.75H8.012C7.20719 4.75 6.50675 5.29932 6.31387 6.07861L5.80025 9.25H18.2927ZM2.75 13C2.75 11.7572 3.75721 10.75 5 10.75H19C20.2428 10.75 21.25 11.7572 21.25 13V18.75C21.25 19.0258 21.0258 19.25 20.75 19.25H18.5C18.0862 19.25 17.75 18.9138 17.75 18.5V17.5C17.75 17.0858 17.4142 16.75 17 16.75H7C6.58579 16.75 6.25 17.0858 6.25 17.5V18.5C6.25 18.9138 5.91379 19.25 5.5 19.25H3.25C2.97421 19.25 2.75 19.0258 2.75 18.75V13Z"/></svg>',
 pPacote:'<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" clip-rule="evenodd" d="M7.25002 4.00006C7.25002 2.48085 8.4808 1.25006 10 1.25006H14C15.5192 1.25006 16.75 2.48085 16.75 4.00006V6.25006H17C18.5192 6.25006 19.75 7.48085 19.75 9.00006V19.0001C19.75 20.5193 18.5192 21.7501 17 21.7501H16.75V22.0001C16.75 22.4143 16.4142 22.7501 16 22.7501C15.5858 22.7501 15.25 22.4143 15.25 22.0001V21.7501H8.75002V22.0001C8.75002 22.4143 8.41423 22.7501 8.00002 22.7501C7.5858 22.7501 7.25002 22.4143 7.25002 22.0001V21.7501H7.00002C5.4808 21.7501 4.25002 20.5193 4.25002 19.0001V9.00006C4.25002 7.48085 5.4808 6.25006 7.00002 6.25006H7.25002V4.00006ZM15.25 4.00006C15.25 3.30927 14.6908 2.75006 14 2.75006H10C9.30923 2.75006 8.75002 3.30927 8.75002 4.00006V6.25006H15.25V4.00006ZM16 7.75006H8.00002H7.00002C6.30923 7.75006 5.75002 8.30927 5.75002 9.00006V19.0001C5.75002 19.6908 6.30923 20.2501 7.00002 20.2501H8.00002H16H17C17.6908 20.2501 18.25 19.6908 18.25 19.0001V9.00006C18.25 8.30927 17.6908 7.75006 17 7.75006H16ZM10 9.25006H14C14.4142 9.25006 14.75 9.58585 14.75 10.0001C14.75 10.4143 14.4142 10.7501 14 10.7501H10C9.5858 10.7501 9.25002 10.4143 9.25002 10.0001C9.25002 9.58585 9.5858 9.25006 10 9.25006ZM12.75 13.0001C12.75 12.5858 12.4142 12.2501 12 12.2501C11.5858 12.2501 11.25 12.5858 11.25 13.0001V18.0001C11.25 18.4143 11.5858 18.7501 12 18.7501C12.4142 18.7501 12.75 18.4143 12.75 18.0001V13.0001ZM8.00002 12.2501C7.5858 12.2501 7.25002 12.5858 7.25002 13.0001V18.0001C7.25002 18.4143 7.5858 18.7501 8.00002 18.7501C8.41423 18.7501 8.75002 18.4143 8.75002 18.0001V13.0001C8.75002 12.5858 8.41423 12.2501 8.00002 12.2501ZM16.75 13.0001C16.75 12.5858 16.4142 12.2501 16 12.2501C15.5858 12.2501 15.25 12.5858 15.25 13.0001V18.0001C15.25 18.4143 15.5858 18.7501 16 18.7501C16.4142 18.7501 16.75 18.4143 16.75 18.0001V13.0001Z"/></svg>',
 headset:'<svg width="30" height="30" viewBox="0 0 40 40" fill="currentColor" aria-hidden="true"><path d="M8.84621 32.5C8.00432 32.5 7.29171 32.2083 6.70838 31.625C6.12504 31.0416 5.83337 30.329 5.83337 29.4871V18.3333C5.83337 16.3846 6.20518 14.5513 6.94879 12.8334C7.69237 11.1154 8.70732 9.61329 9.99362 8.32696C11.28 7.04065 12.7821 6.02571 14.5 5.28212C16.218 4.53851 18.0513 4.16671 20 4.16671C21.9487 4.16671 23.782 4.53851 25.5 5.28212C27.2179 6.02571 28.72 7.04065 30.0064 8.32696C31.2927 9.61329 32.3076 11.1154 33.0512 12.8334C33.7948 14.5513 34.1666 16.3846 34.1666 18.3333V33.9743C34.1666 34.8162 33.875 35.5288 33.2916 36.1121C32.7083 36.6954 31.9957 36.9871 31.1538 36.9871H21.25C20.8953 36.9871 20.5983 36.8674 20.359 36.6281C20.1197 36.3888 20 36.0918 20 35.7371C20 35.3824 20.1197 35.0854 20.359 34.8461C20.5983 34.6068 20.8953 34.4871 21.25 34.4871H31.1538C31.3034 34.4871 31.4263 34.439 31.5224 34.3429C31.6186 34.2467 31.6667 34.1238 31.6667 33.9743V32.4999H28.7821C27.9509 32.4999 27.241 32.2056 26.6523 31.6169C26.0636 31.0282 25.7693 30.3183 25.7693 29.4871V23.7179C25.7693 22.8868 26.0636 22.1768 26.6523 21.5881C27.241 20.9995 27.9509 20.7051 28.7821 20.7051H31.6667V18.3333C31.6667 15.1111 30.5278 12.3611 28.25 10.0833C25.9722 7.80556 23.2222 6.66667 20 6.66667C16.7778 6.66667 14.0278 7.80556 11.75 10.0833C9.47222 12.3611 8.33333 15.1111 8.33333 18.3333V20.7052H11.2179C12.0491 20.7052 12.759 20.9995 13.3477 21.5882C13.9364 22.1769 14.2307 22.8868 14.2307 23.718V29.4871C14.2307 30.3183 13.9364 31.0283 13.3477 31.6169C12.759 32.2056 12.0491 32.5 11.2179 32.5H8.84621ZM8.84621 30H11.2179C11.3675 30 11.4904 29.9519 11.5865 29.8557C11.6827 29.7596 11.7308 29.6367 11.7308 29.4871V23.718C11.7308 23.5684 11.6827 23.4455 11.5865 23.3494C11.4904 23.2532 11.3675 23.2051 11.2179 23.2051H8.33333V29.4871C8.33333 29.6367 8.38142 29.7596 8.47758 29.8557C8.57375 29.9519 8.69663 30 8.84621 30ZM28.7821 30H31.6667V23.2051H28.7821C28.6325 23.2051 28.5096 23.2532 28.4135 23.3494C28.3173 23.4455 28.2692 23.5684 28.2692 23.718V29.4871C28.2692 29.6367 28.3173 29.7596 28.4135 29.8557C28.5096 29.9519 28.6325 30 28.7821 30ZM28.7821 23.2051H28.2692H31.6667H28.7821Z"/></svg>',
 whats:'<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M10.08 0C4.48 0 0 4.47067 0 10.059C0 12.1347 0.639995 14.37 1.92 15.9667L1.12 19.639L4.96001 18.681C9.76001 21.3954 15.84 19.7987 18.72 15.0087C19.68 13.412 20 11.8153 20 10.059C20 4.47067 15.52 0 10.08 0ZM14.88 13.891L14.4 14.37C13.92 14.849 13.28 15.0087 12.64 15.0087C6.23999 14.0507 5.12001 9.42035 4.96001 7.50435C4.96001 6.86568 5.12 6.22701 5.6 5.90768L6.23999 5.26901C6.55999 4.94967 7.2 4.94967 7.52 5.26901L8.8 6.54634C9.12 6.86567 9.12 7.50435 8.8 7.82368L8.16001 8.46235C8.00001 8.62201 8 8.94135 8 9.10102C8.48 10.538 9.76 11.8154 11.2 12.2944C11.36 12.454 11.68 12.2943 11.84 12.1347L12.48 11.496C12.8 11.1767 13.44 11.1767 13.76 11.496L15.04 12.7734C15.2 12.933 15.2 13.5717 14.88 13.891Z"/></svg>',
 casa:'<svg width="18"  height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 10.5 12 3.5l8.5 7"/><path d="M5.5 9.6V20h13V9.6"/><path d="M10 20v-5h4v5"/></svg>',
 okcirc:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M8 12.3l2.7 2.7L16 9.6"/></svg>',
 tv:'<svg width="17"  height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="2.5" y="5" width="19" height="13" rx="2"/><path d="M8 21h8"/></svg>',
 ac:'<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M12 2v20M4 7l16 10M20 7L4 17M12 6l2.4-2.4M12 6 9.6 3.6M12 18l2.4 2.4M12 18l-2.4 2.4"/></svg>',
 hist:'<svg width="18"  height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M3.2 12a8.8 8.8 0 1 1 2.6 6.2"/><path d="M3 19v-5h5"/><path d="M12 7.6V12l3 1.9"/></svg>',
 user:'<svg width="17"  height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="8.5" r="3.6"/><path d="M4.8 20a7.2 7.2 0 0 1 14.4 0"/></svg>',
 primeMark:'<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3.5 21 20H3z"/></svg>',
 carro:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5v2a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-2"/><path d="M22.5 16.5v2a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-2"/><path d="M2 16.5v-3.2a2 2 0 0 1 .3-1l1.9-3A2 2 0 0 1 5.9 8h8.2a2 2 0 0 1 1.7.9l2 3a2 2 0 0 1 .3 1.1v3.5a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1z" transform="translate(2)"/><circle cx="8.5" cy="16.5" r="1.3"/><circle cx="17.5" cy="16.5" r="1.3"/></svg>',
 cal:'<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
 ppl:'<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><circle cx="9.5" cy="8" r="3"/><path d="M3.5 19a6 6 0 0 1 12 0"/><circle cx="17.5" cy="8.5" r="2.3"/><path d="M16 14.6a5.2 5.2 0 0 1 4.5 4.4"/></svg>',
 info:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.6v.1"/></svg>',
 decola:'<svg width="19" height="19" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" clip-rule="evenodd" d="M8.38767 3.41906C8.23149 3.32797 8.04196 3.30838 7.86957 3.36553L5.39433 4.18602C5.18962 4.25387 5.03621 4.42071 4.98971 4.62604C4.94322 4.83138 5.01038 5.04541 5.16686 5.19055L8.04665 7.86172L6.38685 8.86104L5.41478 8.38887C5.00814 8.19073 4.52979 8.1913 4.12342 8.38875L2.84222 9.01107C2.66426 9.09751 2.5399 9.26185 2.50801 9.45273C2.47612 9.64362 2.54058 9.83777 2.68125 9.97451L4.85616 12.0887C5.18576 12.4091 5.65419 12.5544 6.11223 12.4816L6.1141 12.4813L10.3369 11.7971C10.618 11.7517 10.8878 11.6546 11.1311 11.5127L18.0642 7.46876C18.9203 6.96944 19.3415 5.98386 19.0985 5.04144C18.7341 3.62365 17.0769 2.93573 15.7712 3.66128L12.2023 5.64393L8.38767 3.41906ZM9.47998 7.52833L6.75922 5.00467L7.99719 4.59431L11.8763 6.8568C12.0682 6.96874 12.3074 6.97121 12.5017 6.86326L16.3855 4.70572C16.9789 4.37594 17.7325 4.6892 17.898 5.33387C18.0082 5.76135 17.8172 6.20982 17.4274 6.43715L10.4943 10.481C10.3829 10.546 10.2597 10.59 10.1334 10.6104L5.91186 11.2944C5.84536 11.3047 5.77777 11.2832 5.73129 11.238L4.16363 9.71411L4.6769 9.4648C4.73568 9.43624 4.80336 9.43667 4.86026 9.46442L6.14254 10.0873C6.33452 10.1805 6.56251 10.1704 6.74497 10.0606L9.37862 8.47491C9.54148 8.37686 9.64844 8.21102 9.66827 8.0258C9.6881 7.84058 9.61857 7.65688 9.47998 7.52833Z"/><path d="M2.29167 16.25C1.94649 16.25 1.66667 16.5298 1.66667 16.875C1.66667 17.2202 1.94649 17.5 2.29167 17.5H13.5417C13.8868 17.5 14.1667 17.2202 14.1667 16.875C14.1667 16.5298 13.8868 16.25 13.5417 16.25H2.29167Z"/></svg>',
 pousa:'<svg width="19" height="19" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><g transform="translate(20,0) scale(-1,1)"><path fill-rule="evenodd" clip-rule="evenodd" d="M8.38767 3.41906C8.23149 3.32797 8.04196 3.30838 7.86957 3.36553L5.39433 4.18602C5.18962 4.25387 5.03621 4.42071 4.98971 4.62604C4.94322 4.83138 5.01038 5.04541 5.16686 5.19055L8.04665 7.86172L6.38685 8.86104L5.41478 8.38887C5.00814 8.19073 4.52979 8.1913 4.12342 8.38875L2.84222 9.01107C2.66426 9.09751 2.5399 9.26185 2.50801 9.45273C2.47612 9.64362 2.54058 9.83777 2.68125 9.97451L4.85616 12.0887C5.18576 12.4091 5.65419 12.5544 6.11223 12.4816L6.1141 12.4813L10.3369 11.7971C10.618 11.7517 10.8878 11.6546 11.1311 11.5127L18.0642 7.46876C18.9203 6.96944 19.3415 5.98386 19.0985 5.04144C18.7341 3.62365 17.0769 2.93573 15.7712 3.66128L12.2023 5.64393L8.38767 3.41906ZM9.47998 7.52833L6.75922 5.00467L7.99719 4.59431L11.8763 6.8568C12.0682 6.96874 12.3074 6.97121 12.5017 6.86326L16.3855 4.70572C16.9789 4.37594 17.7325 4.6892 17.898 5.33387C18.0082 5.76135 17.8172 6.20982 17.4274 6.43715L10.4943 10.481C10.3829 10.546 10.2597 10.59 10.1334 10.6104L5.91186 11.2944C5.84536 11.3047 5.77777 11.2832 5.73129 11.238L4.16363 9.71411L4.6769 9.4648C4.73568 9.43624 4.80336 9.43667 4.86026 9.46442L6.14254 10.0873C6.33452 10.1805 6.56251 10.1704 6.74497 10.0606L9.37862 8.47491C9.54148 8.37686 9.64844 8.21102 9.66827 8.0258C9.6881 7.84058 9.61857 7.65688 9.47998 7.52833Z"/><path d="M2.29167 16.25C1.94649 16.25 1.66667 16.5298 1.66667 16.875C1.66667 17.2202 1.94649 17.5 2.29167 17.5H13.5417C13.8868 17.5 14.1667 17.2202 14.1667 16.875C14.1667 16.5298 13.8868 16.25 13.5417 16.25H2.29167Z"/></g></svg>',
 lapis:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>',
 setadir:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
 carrinho:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M2 3h2.2l2.1 11.2a1.8 1.8 0 0 0 1.8 1.5h8.6a1.8 1.8 0 0 0 1.8-1.4L21 7H5.3"/></svg>',
 chev2:'<svg class="seta" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>',
 chev:'<svg width="18"  height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M9 5l7 7-7 7"/></svg>',
 down:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M5 9l7 7 7-7"/></svg>',
 selo:'<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l2.1 1.5 2.5-.3 1 2.3 2.2 1.2-.6 2.5.6 2.5-2.2 1.2-1 2.3-2.5-.3L12 17.5 9.9 16l-2.5.3-1-2.3L4.2 12.8l.6-2.5-.6-2.5 2.2-1.2 1-2.3 2.5.3z"/><path d="M9.6 10.4l1.8 1.8 3-3.2"/></svg>',
 etiqueta:'<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 11.2V4.6a1 1 0 0 1 1-1h6.6c.3 0 .5.1.7.3l8 8a1 1 0 0 1 0 1.4l-6.6 6.6a1 1 0 0 1-1.4 0l-8-8a1 1 0 0 1-.3-.7z"/><circle cx="7.8" cy="7.8" r="1.4"/></svg>',
 bilhete:'<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8.5V6.4a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v2.1a2.4 2.4 0 0 0 0 4.8v2.1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-2.1a2.4 2.4 0 0 0 0-4.8z"/><path d="M9.5 9.2v1M9.5 13v1"/></svg>'
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
/* barra de status igual à do Figma: alarme, bluetooth, wi-fi, sinal e bateria */
var SVG_ALARME =
  '<svg class="si" viewBox="0 0 22 24" fill="none" stroke="currentColor" stroke-width="2" '+
   'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+
    '<circle cx="11" cy="13.5" r="8"/>'+
    '<path d="M3 5.5 6.2 2.6"/><path d="M19 5.5 15.8 2.6"/>'+
    '<path d="M11 8.5v5l3.3 2.3"/></svg>';
var SVG_BLUETOOTH =
  '<svg class="si" viewBox="0 0 14 24" fill="none" stroke="currentColor" stroke-width="2" '+
   'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+
    '<path d="m1.5 6.5 11 11L7 23V1l5.5 5.5L1.5 17.5"/></svg>';
var SVG_WIFI =
  '<svg class="si" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" '+
   'stroke-linecap="round" aria-hidden="true">'+
    '<path d="M1.42 7.5a16 16 0 0 1 21.16 0"/>'+
    '<path d="M5 11.05a11 11 0 0 1 14.08 0"/>'+
    '<path d="M8.53 14.61a6 6 0 0 1 6.95 0"/>'+
    '<circle cx="12" cy="18.4" r="1.15" fill="currentColor" stroke="none"/></svg>';
var SVG_SINAL =
  '<svg class="si" viewBox="0 0 20.5 24" fill="currentColor" aria-hidden="true">'+
    '<rect x="0" y="16" width="3.6" height="5.5" rx="1.8"/>'+
    '<rect x="5.6" y="12" width="3.6" height="9.5" rx="1.8"/>'+
    '<rect x="11.2" y="7.5" width="3.6" height="14" rx="1.8"/>'+
    '<rect x="16.8" y="3" width="3.6" height="18.5" rx="1.8"/></svg>';
var SVG_BATERIA =
  '<svg class="si" viewBox="0 0 30 24" fill="none" aria-hidden="true">'+
    '<rect x="1" y="6" width="24" height="12" rx="3.5" stroke="currentColor" stroke-width="2"/>'+
    '<rect x="26.4" y="9.8" width="2.4" height="4.4" rx="1.2" fill="currentColor"/>'+
    '<rect x="5.2" y="9" width="3" height="6" rx="1.5" fill="currentColor"/>'+
    '<rect x="10.2" y="9" width="3" height="6" rx="1.5" fill="currentColor"/>'+
    '<rect x="15.2" y="9" width="3" height="6" rx="1.5" fill="currentColor"/></svg>';
var ICONES_STATUS = SVG_ALARME + SVG_BLUETOOTH + SVG_WIFI + SVG_SINAL + SVG_BATERIA;
function sysbar(light){
  return '<div class="sysbar'+(light?' light':'')+'"><span>16:53</span>'+
   '<span class="ic">'+ICONES_STATUS+'</span></div>';
}
/* ---------- "Fale com a nossa equipe": simulação da conversa ----------
   O protótipo NÃO abre o WhatsApp de verdade. Quem está vendo é um prospect
   numa demonstração: sair do app levaria a pessoa para fora da apresentação e
   não teria como voltar. Esta tela imita a conversa e devolve a pessoa
   exatamente para onde ela estava, com a mesma rolagem. */
var zapVolta = { tela:'home', rolagem:0 };
/* só a vela da marca, sem o texto: o resto do logo fica fora do viewBox */
function marcaRDC(classe){
  return LOGO_RDC.replace('viewBox="0 0 82 32"', 'viewBox="-2 -2 29 26"')
                 .replace('class="lg-rdc"', 'class="' + classe + '"');
}
var ZAP_IC = {
  volta : '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" ' +
          'stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/>' +
          '<path d="m12 19-7-7 7-7"/></svg>',
  lupa  : '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" ' +
          'stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/></svg>',
  menu  : '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><circle cx="12" cy="5" r="1.8"/>' +
          '<circle cx="12" cy="12" r="1.8"/><circle cx="12" cy="19" r="1.8"/></svg>',
  clipe : '<svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" ' +
          'stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
          '<path d="M21 11.5 12.5 20a5 5 0 0 1-7-7l8-8a3.4 3.4 0 0 1 4.8 4.8l-8 8a1.8 1.8 0 0 1-2.5-2.5l7.4-7.4"/></svg>',
  emoji : '<svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" ' +
          'stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M8.5 14.5a4.5 4.5 0 0 0 7 0"/>' +
          '<circle cx="9" cy="9.8" r="1.1" fill="currentColor" stroke="none"/>' +
          '<circle cx="15" cy="9.8" r="1.1" fill="currentColor" stroke="none"/></svg>',
  mic   : '<svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" ' +
          'stroke-width="2" stroke-linecap="round"><rect x="9" y="3" width="6" height="11" rx="3"/>' +
          '<path d="M5 11a7 7 0 0 0 14 0"/><path d="M12 18v3"/></svg>'
};
/* A hora entra no fim do texto, e não flutuando: numa bolha que se ajusta ao
   conteúdo, um elemento flutuante não conta na largura e escapa da bolha. */
function bolhaZap(texto, hora){
  return '<div class="bolha ela">' + texto +
    '<span class="h">' + hora + '</span></div>';
}
function telaWhats(){      /* vira V.whats logo depois que V nasce */
  return '<div class="zap">' + sysbar(true) +
   '<div class="zap-hd">' +
     '<button class="zap-voltar" data-zapvolta="1" aria-label="Voltar">' + ZAP_IC.volta + '</button>' +
     '<span class="zap-av">' + marcaRDC('zap-logo') + '</span>' +
     '<div class="zap-nome"><b>RDC Viagens</b><small>+55 11 99603-8621</small></div>' +
     '<span class="zap-ic">' + ZAP_IC.lupa + ZAP_IC.menu + '</span>' +
   '</div>' +
   '<div class="zap-corpo">' +
     '<div class="zap-chip">Hoje</div>' +
     '<div class="zap-aviso">Esta empresa usa um serviço seguro da Meta para gerenciar esta conversa.</div>' +
     bolhaZap('Oi! Aqui é a Julia, da RDC Viagens 🧭', '16:53') +
     bolhaZap('Que bom ter você por aqui! Agora você tem acesso a condições exclusivas em viagens, ' +
              'com especialistas para ajudar a planejar cada detalhe.', '16:53') +
     bolhaZap('Por aqui, posso ajudar com dúvidas sobre destinos, hospedagens, datas e formas de ' +
              'pagamento.', '16:53') +
     bolhaZap('Como posso ajudar você hoje?', '16:53') +
   '</div>' +
   '<div class="zap-pe">' +
     '<span class="zap-pe-ic">' + ZAP_IC.clipe + ZAP_IC.emoji + '</span>' +
     '<div class="zap-campo">Digite uma mensagem</div>' +
     '<span class="zap-pe-ic">' + ZAP_IC.mic + '</span>' +
   '</div>' +
   '<div class="zap-nota" data-zapvolta="1">Simulação do protótipo — no aplicativo do cliente este ' +
     'botão abre o WhatsApp da nossa equipe. <b>Toque para voltar.</b></div>' +
  '</div>';
}

function headerMarca(){
  /* logo + nome do benefício levam de volta ao início, como a marca no topo
     de qualquer site. O avatar fica de fora: ele é a conta, não a home. */
  return sysbar(true)+'<div class="hd plain">'+
   '<button class="hd-ini" data-go="home" aria-label="Voltar ao início">'+
     logoHTML()+'<div class="div"></div>'+
     '<div class="rot">'+esc(C.rotulo)+'</div>'+
   '</button>'+
   '<div class="hd-right">'+
     /* o selo do Prime saiu do topo: ele continua onde vende — na oferta,
        no resumo e na conclusão */
     '<span class="avatar">'+I.user+'</span>'+
   '</div></div>';
}
function headerVolta(titulo,destino){
  return sysbar()+'<div class="hd"><button class="back" data-go="'+destino+'">‹</button>'+
   '<div class="ttl">'+esc(titulo)+'</div></div>';
}
function barraBusca(mostraFiltro){
  var r=resumoBusca();
  var nFiltrosHotel = filtrosHotelAplicados(filtrosHotel());
  return '<div class="searchwrap"><div class="swtitle">Buscar Hospedagens</div><div style="display:flex;gap:10px;align-items:center">'+
   '<div class="search" data-go="motor">'+I.lupa+'<div class="txt"><b>'+esc(r.a)+'</b><small>'+esc(r.b)+'</small></div></div>'+
   (mostraFiltro?'<button class="filtbtn" data-modal="filtros">'+I.filtro+
     (nFiltrosHotel?'<span class="n">'+nFiltrosHotel+'</span>':'')+'</button>':'')+
   '</div></div>';
}
function rodape(fixo){
  return '<div class="foot'+(fixo?' fixo':'')+'">'+
   '<div class="ajuda">'+
     '<div class="aj-tit">'+I.headset+'<b>Precisa de ajuda<br>com sua viagem?</b></div>'+
     '<a class="aj-btn" href="#" data-whats="1" onclick="return false">'+I.whats+'Fale com a nossa equipe</a>'+
   '</div>'+
   '<div class="foot-hr"></div>'+
   '<div class="foot-base">'+
     '<div class="cr">©RDC Viagens<br>Todos os direitos reservados.'+
       '<a href="#" onclick="return false">Política de Privacidade</a></div>'+
     '<div class="by">Tecnologia e operação<br>turística por<b>'+LOGO_RDC+'</b></div>'+
   '</div></div>';
}

/* ---------- 6b. PEÇAS DO CHECKOUT ---------- */
function passo(destino, rotulo, n){
  return '<div class="passo"><button class="voltar" data-go="'+destino+'">'+
    '<span class="seta">←</span> Voltar para <b>'+esc(rotulo)+'</b></button>'+
    (n ? '<span class="etapa">Etapa '+n+' de 2</span>' : '')+'</div>';
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
V.whats = telaWhats;

/* Tela de partida do protótipo: a home do app do cliente, quando ele tem uma
   (e o print foi enviado); senão, o portal padrão. */
/* ---------- fim da trilha: volta do zero ----------
   Quem conclui a reserva e toca em "Voltar para Início" devolve o celular
   limpo para a próxima pessoa: destino, datas, hóspedes, hotel, quarto, voo,
   tarifa, passageiros e filtros voltam ao estado de fábrica.
   As ÚLTIMAS PESQUISAS ficam — é o histórico, e ele existe justamente para
   guardar o que já foi procurado. */
var ESTADO0 = {}, AEREO0 = {};
function guardarEstadoDeFabrica(){
  ESTADO0 = JSON.stringify(S); AEREO0 = JSON.stringify(A);
}
function restaurar(alvo, texto){
  var novo = JSON.parse(texto), k;
  for(k in alvo) if(alvo.hasOwnProperty(k)) delete alvo[k];
  for(k in novo) alvo[k] = novo[k];
}
function zerarTrilha(){
  restaurar(S, ESTADO0);
  restaurar(A, AEREO0);
  for(var z = 0; z < VOOS.length; z++){      /* horário e tarifa mexidos no voo */
    VOOS[z].tarifa = 'light';
    ['ida', 'volta'].forEach(function(q){
      var t = VOOS[z][q]; if(!t) return;
      if(t.p0 !== undefined){ t.p = t.p0; delete t.p0; }
      delete t.alt;
    });
  }
}
function telaInicial(){
  return (C.appProprio && C.appProprio.ativo && C.appProprio.imagem) ? 'appcliente' : 'home';
}

V.appcliente = function(){
  var a = C.appProprio || {};
  var h = a.hotspot || {x:3,y:36,w:94,h:7};
  return '<div class="appscreen"><img src="'+esc(a.imagem||'')+'" alt="App '+esc(C.cliente)+'">'+
   '<button class="hot pulse" data-go="home" style="left:'+h.x+'%;top:'+h.y+'%;width:'+h.w+'%;height:'+h.h+'%"></button></div>';
};

/* Tela informativa do RDC Prime (Figma · Prospects · @Prime).
   Abre pelo "Entenda o Prime" do resumo e volta para a tela de onde veio. */
var voltaDoPrime = 'hotel';
function vantagem(icone, titulo, texto){
  return '<div class="vant"><div class="vt">'+icone+'<b>'+titulo+'</b></div><p>'+texto+'</p></div>';
}
V.prime = function(){
  return '<div class="stickytop">'+sysbar(true)+
   '<div class="hd plain">'+logoHTML()+'<div class="div"></div>'+
     '<div class="rot">'+esc(C.rotulo)+'</div></div>'+
   '<div class="pfaixa"><span><b>RDC Prime.</b> Mais economia para viajar o ano todo.</span>'+
     '<button class="pfechar" data-go="'+voltaDoPrime+'" aria-label="Fechar">✕</button></div>'+
   '</div>'+
  '<div class="pbody">'+
    '<h2 class="ptit">Mais economia em cada <i>oportunidade de viajar</i>.</h2>'+
    '<div class="pcard"><div class="pval">R$ 29,90<small>/mês</small></div>'+
      '<p>Assine o RDC Prime e encontre <b>descontos de até 40% em serviços '+
      'turísticos selecionados</b>.</p></div>'+
    '<h3 class="psub">O que é o RDC Prime?</h3>'+
    '<p class="ptxt">O <b>RDC Prime é um acelerador adicional, disponível por '+
      'assinatura mensal</b>.</p>'+
    '<p class="ptxt">Com ele, você pode encontrar <b>descontos de até 40% em serviços '+
      'turísticos selecionados</b>, criando <b>novas oportunidades para viajar</b> ao longo do ano.</p>'+
    '<p class="ptxt destaque">Porque viajar mais não precisa esperar as próximas férias.</p>'+
    '<h3 class="psub">O que você encontra com o RDC Prime</h3>'+
    vantagem(I.etiqueta,'Até 40% de desconto',
      'Economize em serviços turísticos selecionados, conforme disponibilidade e regras de cada oferta.')+
    vantagem(I.mala,'Mais oportunidades para viajar',
      'Aproveite a economia para planejar férias, feriados, finais de semana e pequenas pausas ao longo do ano.')+
    '<p class="pfecho">Mais economia para ajudar a transformar <b>viagem em hábito</b>.</p>'+
    '<p class="pnota">*Os descontos variam conforme a disponibilidade, o serviço escolhido '+
      'e as regras de cada oferta.</p>'+
    '<a class="ptermos">Termos de uso e regulamento</a>'+
    '<div class="pacao"><button class="btn ghost" data-go="'+voltaDoPrime+'">Fechar ✕</button></div>'+
  '</div>'+ rodape();
};

function faixaCategorias(ativa){
  var cats = [
    { k:'hosp',  ic:I.pHotel,  n:'Hospedagens' },
    { k:'aereo', ic:I.pAviao,  n:'Passagens' },
    { k:'carro', ic:I.pCarro,  n:'Aluguel de Carros', breve:true },
    { k:'monte', ic:I.pPacote, n:'Monte sua Viagem',  breve:true }
  ];
  return '<div class="cats">'+cats.map(function(c){
    return '<button class="cat'+(c.k===ativa?' on':'')+(c.breve?' breve':'')+'" data-cat="'+c.k+'">'+
      (c.breve? '<span class="breve-tag">em breve</span>':'')+
      '<span class="cat-ic">'+c.ic+'</span><span class="cat-n">'+esc(c.n)+'</span></button>';
  }).join('')+'</div>';
}
V.home = function(){
  /* sem barra de busca: com quatro categorias, a entrada é a faixa de cima */
  return '<div class="portal">'+headerMarca()+ faixaCategorias('') +
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
function hojeZero(){ var h = new Date(); h.setHours(0,0,0,0); return h; }
function mesHTML(y,m,ctx){
  ctx = ctx || S;
  var d=new Date(y,m,1), ini=d.getDay(), tot=new Date(y,m+1,0).getDate(), out='';
  var limite = hojeZero().getTime();
  for(var i=0;i<ini;i++) out+='<div class="day off"></div>';
  for(var n=1;n<=tot;n++){
    var cur=new Date(y,m,n), cls='day', t=cur.getTime();
    if(t < limite) cls+=' off passado';   /* data que já passou */
    else if(t === limite) cls+=' hoje';
    if(ctx.ini&&ctx.fim&&t>ctx.ini.getTime()&&t<ctx.fim.getTime()) cls+=' rng';
    if(ctx.ini&&t===ctx.ini.getTime()) cls+=' sel'+(ctx.fim?' a rng':'');
    if(ctx.fim&&t===ctx.fim.getTime()) cls+=' sel b rng';
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
  var lista = hoteisFiltrados(), todos = catalogoHoteis();
  /* 189 é a vitrine do protótipo: ao filtrar, o número encolhe na mesma
     proporção, senão a tela diria 189 com dois cards na frente */
  var achados = lista.length === todos.length ? 189
              : Math.max(lista.length, Math.round(189 * lista.length / todos.length));
  var vazioH = '<div class="vazio alto">'+I.filtro+
    '<b>Nenhum hotel com esses filtros.</b>'+
    '<span>Tente outra faixa de preço, outra categoria ou menos comodidades.</span>'+
    '<button class="btn ghost" data-limpar-hotel-tudo="1">Limpar filtros</button></div>';
  return headerMarca()+barraBusca(true)+
   (lista.length ? '<div class="count"><b>'+achados+'</b> '+
     (achados>1?'hotéis encontrados':'hotel encontrado')+' para<br><b>'+
     esc(S.cidade||'Rio de Janeiro')+(S.uf?', '+S.uf:'')+'</b></div>' : '')+
   (lista.length ? '' : vazioH)+
   lista.map(function(h){
     return '<div class="card" data-hotel="'+h.id+'">'+
      '<div class="ph"><img src="'+img(h.img)+'" alt="">'+
        '<span class="gnav l">‹</span><span class="gnav r">›</span></div>'+
      '<div class="bd"><h4>'+esc(h.n)+'</h4>'+
      '<div class="loc">'+esc(S.cidade||'Rio de Janeiro')+(S.uf?', '+S.uf:'')+' - ('+h.cat+')</div>'+
      '<div class="stars">'+estrelas(h.e)+'</div>'+
      '<div class="amen">'+amenidades(h)+'</div>'+
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
  var h=S.hotel||catalogoHoteis()[0];
  var escolhido = S.quartoIdx !== null;
  return headerMarca()+barraBusca(false)+
   passo('resultados', 'Hotéis')+
   '<div class="body" style="padding-bottom:6px"><h3 style="font-size:20px;margin-bottom:4px">'+esc(h.n)+'</h3>'+
   '<div style="font-size:12.5px;color:var(--ink-3)">'+esc(h.end)+', '+
     esc(S.cidade||'Rio de Janeiro')+' - '+esc(S.pais||'Brasil')+'</div>'+
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
  var h=S.hotel||catalogoHoteis()[0];
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
  var h=S.hotel||catalogoHoteis()[0];
  var comPrime = h.por + q.dif, semPrime = h.de + q.dif, economia = semPrime - comPrime;
  var selCom = (S.quartoIdx===i && S.prime), selSem = (S.quartoIdx===i && !S.prime);
  var ofertas;
  if(C.prime){
    ofertas =
     '<div class="oferta com'+(selCom?' sel':'')+'" data-opt="'+i+':1">'+
       '<div class="of-top"><span class="radio">'+(selCom?I.check:'')+'</span>'+
       // o cartao ja nasce com a cor da marca: o logo acompanha o texto
       '<span class="of-tit">Com '+LOGO_PRIME_W+'</span>'+
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
  var h=S.hotel||catalogoHoteis()[0], q=S.quarto||QUARTOS[0], idx=(S.quartoIdx===null?0:S.quartoIdx)+1;
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
      '<div class="primebox" data-prime="1">Entenda o '+LOGO_PRIME+'<span class="chev">›</span></div>'
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

/* a mesma gaveta serve hospedagem e aéreo: muda só o que vai dentro */
function conteudoSheet(){
  return telaDoAereo(atual) ? resumoAereoHTML() : resumoHTML(atual==='hotel');
}
function montarSheet(animarEntrada){
  var velho = document.getElementById('sheet');
  if(velho) velho.parentNode.removeChild(velho);
  var aer = telaDoAereo(atual);
  if(!aer && S.quartoIdx === null) return;
  var d = document.createElement('div');
  d.id = 'sheet';
  // nasce fechado quando vai animar a entrada; senao ja nasce no estado certo
  d.className = 'sheet' + (aer ? ' aereo' : '') + ((animarEntrada || !sheetAberto) ? ' fechado' : '');
  d.innerHTML = '<div class="sheet-bar" id="sheetBar"><span class="puxador"></span>'+
      I.carrinho+' Resumo da reserva<span class="chev">'+I.down+'</span></div>'+
    '<div class="sheet-body">'+conteudoSheet()+'</div>';
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
  if(b) b.innerHTML = conteudoSheet();
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
  var h=S.hotel||catalogoHoteis()[0], q=S.quarto||QUARTOS[0];
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
  var h=S.hotel||catalogoHoteis()[0], q=S.quarto||QUARTOS[0];
  var comPrime = h.por + q.dif, semPrime = h.de + q.dif, economia = semPrime - comPrime;
  var novoAssinante = C.prime && S.prime;
  var email = '<b>'+esc(S.email)+'</b>';

  var fecho = '<div class="boa">Tenha uma boa viagem!</div>'+
    '<div style="padding:0 16px 22px"><button class="btn ghost casa" data-zerar="1" '+
      'data-go="'+telaInicial()+'">'+I.casa+' Voltar para Início</button></div>'+ rodape();

  if(!novoAssinante){
    // 04. Conclusão/Corporativo — fechamento sem Prime
    return headerMarca()+
      '<div class="fim-foto topo"><img src="'+img('fim-sem.jpg')+'" alt="">'+
        '<span>Sua viagem,<br>nosso compromisso.</span></div>'+
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


/* ============================================================
   7-B. PASSAGENS AÉREAS
   Nova categoria do portal. Vive ao lado da hospedagem: mesma marca,
   mesmo motor de navegação, estado próprio em A.
   ============================================================ */

var A = {
  tipo    : 'iv',                 /* 'iv' ida e volta · 'si' somente ida */
  origem  : null, destino: null,  /* {n, uf, iata} */
  ini     : null, fim: null,
  adultos : 2, menores: 0, bebes: 0, classe: 'Econômica',
  voo     : null, tarifa: 'light',
  idaIdx  : 0, voltaIdx: 0,
  ordem   : 'preco-asc',
  filtros : null,
  rascunho: null,
  trecho  : 'ida',                /* aba do modal de horários */
  pax     : [],                   /* dados preenchidos de cada passageiro */
  paxEdit : 0,                    /* qual passageiro o formulário está editando */
  cartoes : 1,                    /* 1 ou 2 cartões no pagamento */
  resumo  : false                 /* painel "Resumo da reserva" aberto */
};
window.TC_AEREO = A;

var CLASSES = ['Econômica', 'Executiva', 'Primeira Classe', 'Premium Econômica', 'Premium Business'];

var ORDEM_CIAS = ['gol', 'azul', 'latam', 'tap'];
var CIAS = {
  latam: { n:'Latam',  cod:'LA', cor:'#E1251B' },
  gol  : { n:'Gol',    cod:'G3', cor:'#FF7A00' },
  azul : { n:'Azul',   cod:'AD', cor:'#0F4C9B' },
  tap  : { n:'TAP',    cod:'TP', cor:'#0B7A43' }
};

/* Aeroportos por praça. O motor busca cidade; a listagem mostra o IATA. */
/* AEROPORTOS vem da base acima */

/* Nome completo dos terminais, para o modal de detalhes */
var TERMINAIS = {
  GRU:'Guarulhos, SP - Governador André Franco Montoro Int.',
  CGH:'São Paulo, SP - Congonhas',
  VCP:'Campinas, SP - Viracopos Int.',
  SDU:'Rio de Janeiro, RJ - Santos Dumont',
  GIG:'Rio de Janeiro, RJ - Galeão Int.',
  BSB:'Brasília, DF - Presidente Juscelino Kubitschek Int.',
  CNF:'Confins, MG - Tancredo Neves Int.'
};

/* As ofertas do protótipo. Preço é o total para 2 viajantes na tarifa Light.
   A variedade de horário, duração, paradas e companhia existe para o filtro
   ter o que filtrar — cada ajuste muda a lista de verdade. */
var VOOS = [
  { id:1, cia:'latam', voo:'LA3366', preco:800,
    ida  :{ p:'06:00', c:'07:15', dur:75,  par:0, de:'GRU', para:'SDU' },
    volta:{ p:'06:20', c:'07:40', dur:80,  par:0, de:'SDU', para:'VCP' } },
  { id:2, cia:'gol', voo:'G31402', preco:846,
    ida  :{ p:'08:25', c:'09:45', dur:80,  par:0, de:'GRU', para:'SDU' },
    volta:{ p:'10:10', c:'11:30', dur:80,  par:0, de:'SDU', para:'GRU' } },
  { id:3, cia:'azul', voo:'AD4091', preco:912,
    ida  :{ p:'11:10', c:'12:25', dur:75,  par:0, de:'VCP', para:'SDU' },
    volta:{ p:'13:05', c:'14:20', dur:75,  par:0, de:'SDU', para:'VCP' } },
  { id:4, cia:'latam', voo:'LA3512', preco:968,
    ida  :{ p:'15:35', c:'16:50', dur:75,  par:0, de:'GRU', para:'SDU' },
    volta:{ p:'18:40', c:'19:55', dur:75,  par:0, de:'SDU', para:'GRU' } },
  { id:5, cia:'gol', voo:'G31780', preco:742,
    ida  :{ p:'05:40', c:'08:55', dur:195, par:1, de:'GRU', para:'GIG', esc:'BSB' },
    volta:{ p:'20:15', c:'23:35', dur:200, par:1, de:'GIG', para:'GRU', esc:'BSB' } },
  { id:6, cia:'azul', voo:'AD2255', preco:788,
    ida  :{ p:'09:50', c:'13:30', dur:220, par:1, de:'VCP', para:'GIG', esc:'CNF' },
    volta:{ p:'15:20', c:'18:50', dur:210, par:1, de:'GIG', para:'VCP', esc:'CNF' } },
  { id:7, cia:'tap', voo:'TP1130', preco:1054,
    ida  :{ p:'13:15', c:'14:35', dur:80,  par:0, de:'GRU', para:'GIG' },
    volta:{ p:'21:00', c:'22:20', dur:80,  par:0, de:'GIG', para:'GRU' } },
  { id:8, cia:'latam', voo:'LA3080', preco:698,
    ida  :{ p:'18:30', c:'23:05', dur:275, par:2, de:'GRU', para:'GIG', esc:'BSB' },
    volta:{ p:'06:05', c:'10:50', dur:285, par:2, de:'GIG', para:'GRU', esc:'CNF' } }
];

/* Horários alternativos do mesmo voo — "Ver mais opções de horários".
   O preço é o mesmo, só muda a partida (é assim que o Figma descreve). */
var HORARIOS_ALT = {
  ida  : [{p:'06:00',c:'07:15',dur:75},{p:'08:25',c:'09:45',dur:80},
          {p:'11:10',c:'12:25',dur:75},{p:'15:35',c:'16:50',dur:75}],
  volta: [{p:'06:20',c:'07:40',dur:80},{p:'10:10',c:'11:30',dur:80},
          {p:'16:45',c:'18:05',dur:80},{p:'21:30',c:'22:50',dur:80}]
};

/* As quatro tarifas. O acréscimo é sobre a Light, para o total de viajantes. */
var TARIFAS = [
  { k:'light', n:'Light', mais:0, benef:[
      ['1 item pessoal até 10 kg','Deve ir debaixo do assento da frente','b'],
      ['1 mala pequena até 12 kg','Sujeita a ser despachada no embarque','b'],
      ['Remarcação com taxa + diferença de preço','','f']
    ]},
  { k:'standard', n:'Standard', mais:175, rec:true, benef:[
      ['1 item pessoal até 10 kg','Deve ir debaixo do assento da frente','b'],
      ['1 mala pequena até 12 kg','Sujeita a ser despachada no embarque','b'],
      ['Remarcação com taxa + diferença de preço','','f'],
      ['1 bagagem despachada até 23 kg','','b'],
      ['Upgrade de cabine','','s']
    ]},
  { k:'full', n:'Full', mais:434, benef:[
      ['1 item pessoal até 10 kg','Deve ir debaixo do assento da frente','b'],
      ['1 mala pequena até 12 kg','Sujeita a ser despachada no embarque','b'],
      ['Remarcação sem taxa + diferença de preço','','f'],
      ['2 bagagens despachadas até 23 kg','','b'],
      ['Upgrade de cabine','','s'],
      ['Marcação de assento','','s']
    ]},
  { k:'premium', n:'Premium', mais:690, benef:[
      ['1 item pessoal até 10 kg','Deve ir debaixo do assento da frente','b'],
      ['1 mala de mão até 12 kg','','b'],
      ['Remarcação e cancelamento sem taxa','','f'],
      ['2 bagagens despachadas até 32 kg','','b'],
      ['Embarque prioritário','','s'],
      ['Assento com mais espaço','','s']
    ]}
];

/* ---------- 7-B.1 helpers ---------- */
function minutos(hhmm){ var p = hhmm.split(':'); return (+p[0]) * 60 + (+p[1]); }
function hhmm(min){ min = Math.max(0, Math.round(min)); return d2(Math.floor(min/60)) + ':' + d2(min%60); }
function durTxt(min){ var h = Math.floor(min/60), m = min%60; return h + 'h' + (m ? d2(m) : '00'); }
function paradasTxt(n){ return n === 0 ? 'Direto' : n === 1 ? '1 parada' : n + ' paradas'; }
function viajantes(){ return A.adultos + A.menores + A.bebes; }
function viajantesTxt(){
  var p = [];
  p.push(A.adultos + ' adulto' + (A.adultos > 1 ? 's' : ''));
  if(A.menores) p.push(A.menores + ' menor' + (A.menores > 1 ? 'es' : ''));
  if(A.bebes)   p.push(A.bebes + ' bebê' + (A.bebes > 1 ? 's' : ''));
  return p.join(', ');
}
function idaEVolta(){ return A.tipo === 'iv'; }
function ondeLugar(c){ return c ? (c.uf || c.p) : ''; }
function nomeAeroporto(iata){
  var a = AEROPORTOS.filter(function(x){ return x.iata === iata; })[0];
  if(!a) return TERMINAIS[iata] || iata;
  return a.n + (a.aero ? ' - ' + a.aero : '');
}
/* ---------- 7-B.1b tempo de voo ----------
   O protótipo não consulta companhia nenhuma, mas o horário tem de ser
   crível: a duração vem da distância real entre os dois aeroportos e a
   chegada é calculada no fuso do destino. */
function rad(x){ return x * Math.PI / 180; }
function distKm(a, b){
  if(!a || !b) return 0;
  var dla = rad(b.la - a.la), dlo = rad(b.lo - a.lo);
  var h = Math.sin(dla/2) * Math.sin(dla/2) +
          Math.cos(rad(a.la)) * Math.cos(rad(b.la)) * Math.sin(dlo/2) * Math.sin(dlo/2);
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}
function kmDoTrecho(qual){
  var pt = pontas(qual);
  return distKm(PORTO[pt.de], PORTO[pt.para]);
}
/* voo direto: 25 min de taxiamento e subida + cruzeiro a ~800 km/h */
function duracaoVoo(km, paradas, tempero){
  var m = 25 + (km / 800) * 60;
  if(paradas) m += paradas * (55 + (tempero % 4) * 10 + Math.min(60, km * 0.008));
  m += (tempero % 5) * 5;
  return Math.max(45, Math.round(m / 5) * 5);
}
function minDoHora(h){ var p = String(h).split(':'); return (+p[0]) * 60 + (+p[1]); }
function hhmmDe(m){
  m = ((m % 1440) + 1440) % 1440;
  var h = Math.floor(m / 60), i = m % 60;
  return (h < 10 ? '0' : '') + h + ':' + (i < 10 ? '0' : '') + i;
}
/* devolve {dur, c, dias} para um trecho, respeitando o fuso do destino */
function tempos(qual, partida, paradas, tempero){
  var pt = pontas(qual), a = PORTO[pt.de], b = PORTO[pt.para];
  var km = distKm(a, b);
  var dur = duracaoVoo(km, paradas || 0, tempero || 0);
  var fuso = ((b ? b.tz : 0) - (a ? a.tz : 0)) * 60;
  var fim = minDoHora(partida) + dur + fuso;
  return { dur:dur, c:hhmmDe(fim), dias:Math.floor(fim / 1440), km:Math.round(km) };
}
function maisDia(n){ return n > 0 ? '<i class="mdia">+' + n + '</i>' : ''; }
/* o horario de partida e o numero de paradas vem do catalogo fixo;
   duracao e chegada sao sempre recalculadas para a rota escolhida */
/* hubs usados como escala: a parada escolhida e a que menos desvia a rota */
var HUBS = ('GRU CNF BSB GIG SSA REC FOR MAO POA CWB VCP BEL CGB SCL EZE LIM BOG PTY MEX ' +
  'MIA JFK ATL DFW IAH LAX ORD YYZ YVR LIS MAD BCN CDG AMS FRA MUC LHR FCO ZRH VIE IST ' +
  'ATH CPH ARN HEL WAW DUB DXB DOH AUH RUH TLV CAI ADD NBO JNB CPT LOS CMN DKR ACC DEL ' +
  'BOM BKK SIN KUL HKG ICN NRT HND PVG PEK CAN TPE SYD MEL AKL').split(' ');
function escalasDe(qual, n, tempero){
  if(!n) return [];
  var pt = pontas(qual), a = PORTO[pt.de], b = PORTO[pt.para];
  if(!a || !b) return [];
  var cand = [];
  for(var i = 0; i < HUBS.length; i++){
    var h = PORTO[HUBS[i]];
    if(!h || h.iata === a.iata || h.iata === b.iata) continue;
    cand.push({ h:h, volta:distKm(a, h) + distKm(h, b), de:distKm(a, h) });
  }
  cand.sort(function(x, y){ return x.volta - y.volta; });
  var pool = cand.slice(0, Math.min(cand.length, 4 + n));
  var saida = [], usados = {};
  for(var j = 0; j < n; j++){
    var e = pool[(tempero + j * 3) % pool.length];
    if(!e || usados[e.h.iata]) e = pool[j % pool.length];
    if(!e || usados[e.h.iata]) continue;
    usados[e.h.iata] = 1; saida.push(e);
  }
  saida.sort(function(x, y){ return x.de - y.de; });
  return saida.map(function(e){ return e.h.iata; });
}
function trechoDe(v, qual){
  var t = v[qual]; if(!t) return null;
  var tempero = v.id * 3 + (t.alt || 0);
  var r = tempos(qual, t.p, t.par, tempero);
  return { p:t.p, c:r.c, dur:r.dur, par:t.par, dias:r.dias, km:r.km,
           esc:escalasDe(qual, t.par, tempero) };
}

function maisDias(d, n){
  if(!d || !n) return d;
  return new Date(d.getTime() + n * 864e5);
}
function fmtKm(n){ return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
function dtCurta(d){
  if(!d) return '';
  return d.getDate() + ' ' + MES[d.getMonth()].slice(0,3).toLowerCase() + '.';
}
var SEMANA = ['domingo','segunda-feira','terça-feira','quarta-feira','quinta-feira','sexta-feira','sábado'];
function dtLonga(d){ return d ? dtCurta(d) + ' / ' + SEMANA[d.getDay()] : ''; }

function filtrosPadrao(){
  return {
    horaIda  : [0, 1439], horaVolta: [0, 1439],
    durIda   : 999, durVolta: 999,
    paradas  : [],  cias: []
  };
}
function limitesVoos(){
  var l = { hIdaMin:1439, hIdaMax:0, hVoltaMin:1439, hVoltaMax:0, dIda:0, dVolta:0 };
  for(var i = 0; i < VOOS.length; i++){
    var v = VOOS[i], mi = minutos(v.ida.p);
    l.hIdaMin = Math.min(l.hIdaMin, mi); l.hIdaMax = Math.max(l.hIdaMax, mi);
    l.dIda = Math.max(l.dIda, trechoDe(v, 'ida').dur);
    if(v.volta){
      var mv = minutos(v.volta.p);
      l.hVoltaMin = Math.min(l.hVoltaMin, mv); l.hVoltaMax = Math.max(l.hVoltaMax, mv);
      l.dVolta = Math.max(l.dVolta, trechoDe(v, 'volta').dur);
    }
  }
  return l;
}
function garantirFiltros(){
  if(A.filtros) return;
  var l = limitesVoos();
  A.filtros = filtrosPadrao();
  A.filtros.horaIda   = [l.hIdaMin, l.hIdaMax];
  A.filtros.horaVolta = [l.hVoltaMin, l.hVoltaMax];
  A.filtros.durIda    = l.dIda;
  A.filtros.durVolta  = l.dVolta;
}
/* Quantos grupos de filtro estão fora do padrão — vira o "(N aplicados)" */
function filtrosAplicados(f){
  var l = limitesVoos(), n = 0;
  if(f.horaIda[0] > l.hIdaMin || f.horaIda[1] < l.hIdaMax) n++;
  if(idaEVolta() && (f.horaVolta[0] > l.hVoltaMin || f.horaVolta[1] < l.hVoltaMax)) n++;
  if(f.durIda < l.dIda) n++;
  if(idaEVolta() && f.durVolta < l.dVolta) n++;
  if(f.paradas.length) n++;
  if(f.cias.length) n++;
  return n;
}
function vooPassa(v, f){
  var l = limitesVoos(), mi = minutos(v.ida.p);
  if(mi < f.horaIda[0] && f.horaIda[0] > l.hIdaMin) return false;
  if(mi > f.horaIda[1] && f.horaIda[1] < l.hIdaMax) return false;
  if(f.durIda < l.dIda && trechoDe(v, 'ida').dur > f.durIda) return false;
  if(idaEVolta() && v.volta){
    var mv = minutos(v.volta.p);
    if(mv < f.horaVolta[0] && f.horaVolta[0] > l.hVoltaMin) return false;
    if(mv > f.horaVolta[1] && f.horaVolta[1] < l.hVoltaMax) return false;
    if(f.durVolta < l.dVolta && trechoDe(v, 'volta').dur > f.durVolta) return false;
  }
  if(f.paradas.length){
    var par = idaEVolta() && v.volta ? Math.max(v.ida.par, v.volta.par) : v.ida.par;
    if(f.paradas.indexOf(par) < 0) return false;
  }
  if(f.cias.length && f.cias.indexOf(v.cia) < 0) return false;
  return true;
}
function duracaoTotal(v){
  return trechoDe(v, 'ida').dur + (idaEVolta() && v.volta ? trechoDe(v, 'volta').dur : 0);
}
/* os precos do catalogo foram desenhados para uma ponte aerea curta (~360 km);
   numa rota longa eles sao esticados para continuar fazendo sentido na tela */
function fatorRota(){
  var km = kmDoTrecho('ida');
  if(!km) return 1;
  return Math.max(0.6, 0.78 + km / 1650);
}
function precoDoVoo(v){
  var p = v.preco * fatorRota();
  return Math.round(idaEVolta() ? p : p * 0.58);
}
function vooFiltrados(){
  garantirFiltros();
  var f = A.filtros;
  var lista = VOOS.filter(function(v){ return vooPassa(v, f); });
  lista.sort(function(a, b){
    if(A.ordem === 'preco-desc') return precoDoVoo(b) - precoDoVoo(a);
    if(A.ordem === 'dur-asc')    return duracaoTotal(a) - duracaoTotal(b);
    if(A.ordem === 'dur-desc')   return duracaoTotal(b) - duracaoTotal(a);
    return precoDoVoo(a) - precoDoVoo(b);
  });
  return lista;
}
/* A tarifa vale por voo: trocar a de um card não pode mexer nos outros.
   TARIFAS[0] (Light) é a de entrada, com que todo voo nasce. */
function tarifaDe(v){
  var k = (v && v.tarifa) || 'light';
  for(var i = 0; i < TARIFAS.length; i++) if(TARIFAS[i].k === k) return TARIFAS[i];
  return TARIFAS[0];
}
function tarifaAtual(){ return tarifaDe(A.voo || VOOS[0]); }
function precoComTarifa(v){ return precoDoVoo(v) + tarifaDe(v).mais; }
function totalAereo(){ return precoComTarifa(A.voo || VOOS[0]); }
function rotaTxt(){
  var o = A.origem ? A.origem.iata : 'SAO', d = A.destino ? A.destino.iata : 'RIO';
  return o + ' - ' + d;
}
function datasTxt(){
  if(!A.ini) return 'Escolher datas';
  return idaEVolta() && A.fim ? dtCurta(A.ini) + ' - ' + dtCurta(A.fim) : dtCurta(A.ini);
}
var LOGOS_CIA = {
  gol: '<svg width="24" height="9.81" viewBox="0 0 24 9.8125" fill="none" aria-hidden="true"><path fill="#EB7302" d="M12.3053 9.8125C15.0203 9.8125 17.2208 7.61572 17.2208 4.90655C17.2208 2.19678 15.0203 0 12.3053 0C9.99202 0 8.05251 1.59434 7.52877 3.74183C7.50316 3.84772 7.40804 3.92196 7.2989 3.92196H5.14234C5.01125 3.92196 4.90577 4.02784 4.90577 4.15807V5.64409C4.90577 5.77431 5.01125 5.8802 5.14234 5.8802H6.63797C6.76845 5.8802 6.87454 5.98547 6.87454 6.11631V7.01023C6.87454 7.08082 6.84284 7.14776 6.78796 7.19279C6.27763 7.60902 5.62645 7.85974 4.91614 7.85974C3.2821 7.85974 1.95719 6.53741 1.95719 4.90655C1.95719 3.2757 3.2821 1.95337 4.91614 1.95337C5.37952 1.95337 5.8179 2.05986 6.20873 2.24972C6.31909 2.30328 6.45201 2.26371 6.51542 2.15784L7.27512 0.881756C7.30866 0.825771 7.31719 0.758834 7.29951 0.696155C7.28122 0.633477 7.23854 0.581144 7.18062 0.551327C6.50322 0.199597 5.73315 0 4.91614 0C2.20107 0 0 2.19678 0 4.90655C0 7.61572 2.20107 9.8125 4.91614 9.8125C6.29897 9.8125 7.54767 9.24292 8.4409 8.32587C8.48541 8.28023 8.54638 8.25406 8.6104 8.25406C8.67442 8.25406 8.73539 8.28023 8.7799 8.32587C9.67374 9.24292 10.9224 9.8125 12.3053 9.8125V9.8125ZM12.3053 7.85974C10.6712 7.85974 9.34633 6.53741 9.34633 4.90655C9.34633 3.2757 10.6712 1.95337 12.3053 1.95337C13.9393 1.95337 15.2636 3.2757 15.2636 4.90655C15.2636 6.53741 13.9393 7.85974 12.3053 7.85974"/><path fill="#B0B0B3" d="M20.4225 3.96212C19.981 1.70448 17.9891 0 15.5978 0C15.0198 0 14.4661 0.0997992 13.9509 0.282357C14.8984 0.618873 15.7124 1.23653 16.2904 2.03552C17.5903 2.34709 18.5567 3.51364 18.5567 4.90655C18.5567 6.53741 17.2318 7.85974 15.5978 7.85974C13.9637 7.85974 12.6388 6.53741 12.6388 4.90655C12.6388 3.88423 13.1595 2.983 13.9503 2.45297C13.4802 2.13776 12.9138 1.95337 12.3047 1.95337C12.0657 1.95337 11.834 1.98197 11.6115 2.03491C11.0267 2.84243 10.6816 3.83433 10.6816 4.90655C10.6816 7.61572 12.8827 9.8125 15.5978 9.8125C17.9891 9.8125 19.981 8.10862 20.4225 5.85038V3.96212"/><path fill="#EB7302" d="M20.7478 7.73612C20.6174 7.73612 20.5119 7.63084 20.5119 7.50001V0.389368C20.5119 0.259144 20.4058 0.153259 20.2753 0.153259H18.7913C18.6602 0.153259 18.5547 0.259144 18.5547 0.389368V9.45338C18.5547 9.5836 18.6602 9.68949 18.7913 9.68949H23.7641C23.8946 9.68949 24 9.5836 24 9.45338V7.97223C24 7.842 23.8946 7.73612 23.7641 7.73612H20.7478Z"/></svg>',
  azul: '<svg width="23.75" height="24" viewBox="0 0 23.75 24" fill="none" aria-hidden="true"><path fill-rule="evenodd" clip-rule="evenodd" fill="#5061AA" d="M14.6732 2.25928H16.0867V3.37364H14.6716L14.6732 2.25928Z"/><path fill-rule="evenodd" clip-rule="evenodd" fill="#8B328A" d="M9.46192 14.2013H13.7887V18.819H9.46192V14.2013Z"/><path fill-rule="evenodd" clip-rule="evenodd" fill="#5D80C0" d="M12.3075 19.8066H15.1514V21.5316H12.3075V19.8066Z"/><path fill-rule="evenodd" clip-rule="evenodd" fill="#E94E29" d="M10.6204 20.6127H14.0384V24H10.6211L10.6204 20.6127Z"/><path fill-rule="evenodd" clip-rule="evenodd" fill="#D5262A" d="M14.855 17.5375H17.7812V18.8198H14.8565L14.855 17.5375Z"/><path fill-rule="evenodd" clip-rule="evenodd" fill="#F6A022" d="M13.7849 15.2027H16.785V15.9621H13.7849V15.2027Z"/><path fill-rule="evenodd" clip-rule="evenodd" fill="#6A95CD" d="M17.7772 17.5375H19.8739V18.1153H17.7772V17.5375Z"/><path fill-rule="evenodd" clip-rule="evenodd" fill="#306FB6" d="M13.7849 11.5253H16.6516V15.2042H13.7849V11.5253Z"/><path fill-rule="evenodd" clip-rule="evenodd" fill="#73C8DD" d="M8.18547 8.70422H13.7894V14.202H8.18547V8.70422Z"/><path fill-rule="evenodd" clip-rule="evenodd" fill="#92C143" d="M4.92584 8.70575H8.66788V11.7466H4.92584V8.70575Z"/><path fill-rule="evenodd" clip-rule="evenodd" fill="#5061AA" d="M9.7804 3.55682H16.1208V8.74472H9.7804V3.55682Z"/><path fill-rule="evenodd" clip-rule="evenodd" fill="#169BD6" d="M16.6465 9.37744H21.2669V15.0233H16.6465V9.37744Z"/><path fill-rule="evenodd" clip-rule="evenodd" fill="#F6A022" d="M15.9196 12.5908H19.8743V17.552H15.9188L15.9196 12.5908Z"/><path fill-rule="evenodd" clip-rule="evenodd" fill="#D5262A" d="M13.7849 15.9507H16.7111V18.8152H13.7849V15.9507Z"/><path fill-rule="evenodd" clip-rule="evenodd" fill="#199AA6" d="M12.0744 17.7496H15.85V19.8257H12.0729L12.0744 17.7496Z"/><path fill-rule="evenodd" clip-rule="evenodd" fill="#A5BFDF" d="M19.8686 14.5203H20.6768V17.0062H19.8686V14.5203Z"/><path fill-rule="evenodd" clip-rule="evenodd" fill="#3FB7AF" d="M21.2641 9.2027H23.3783V10.5109H21.2649L21.2641 9.2027Z"/><path fill-rule="evenodd" clip-rule="evenodd" fill="#AE2258" d="M21.068 10.5101H22.5929V11.3612H21.068V10.5101Z"/><path fill-rule="evenodd" clip-rule="evenodd" fill="#79C199" d="M13.7849 6.49921H16.6516V11.5322H13.7849V6.49921Z"/><path fill-rule="evenodd" clip-rule="evenodd" fill="#E5DF1F" d="M16.6465 4.47272H20.5029V9.37668H16.6481L16.6465 4.47272Z"/><path fill-rule="evenodd" clip-rule="evenodd" fill="#33BACF" d="M16.1163 3.55682H18.9274V8.15472H16.1163V3.55682Z"/><path fill-rule="evenodd" clip-rule="evenodd" fill="#6CA9DB" d="M19.915 8.02722H23.75V9.37819H19.915V8.02722Z"/><path fill-rule="evenodd" clip-rule="evenodd" fill="#DE5097" d="M20.5066 5.0658H22.338V8.02878H20.5066V5.0658Z"/><path fill-rule="evenodd" clip-rule="evenodd" fill="#604596" d="M21.7879 5.99768H23.4866V7.24027H21.7879V5.99768Z"/><path fill-rule="evenodd" clip-rule="evenodd" fill="#FAD803" d="M21.3519 7.24109H23.7497V8.48292H21.3519V7.24109Z"/><path fill="#5061AA" d="M14.6615 2.20587H16.1025V3.37366H14.6615V2.20587ZM9.7804 2.24174H12.3956V5.14443H9.7804V2.24174Z"/><path fill-rule="evenodd" clip-rule="evenodd" fill="#0BB8E7" d="M1.70226 2.2417H9.79171V8.74469H1.70226V2.2417Z"/><path fill-rule="evenodd" clip-rule="evenodd" fill="#41AD4C" d="M5.85157 0H8.66649V3.66747H5.85157V0Z"/><path fill-rule="evenodd" clip-rule="evenodd" fill="#E7B720" d="M0 8.18976H5.22269V10.2277H0V8.18976Z"/><path fill-rule="evenodd" clip-rule="evenodd" fill="#B9CF37" d="M12.3894 0.332764H14.4175V3.55678H12.3894V0.332764Z"/><path fill-rule="evenodd" clip-rule="evenodd" fill="#92C143" d="M15.0978 12.5908H15.9189V13.4105H15.0955L15.0978 12.5908Z"/></svg>',
  latam: '<svg width="15" height="24" viewBox="0 0 15 23.9999" fill="none" aria-hidden="true"><path fill-rule="evenodd" clip-rule="evenodd" fill="#ED1651" d="M1.72532 9.82355L4.40294 9.06224C4.40294 9.06224 4.37427 8.88422 4.27826 8.79685C4.18224 8.70947 4.00954 8.65545 4.00954 8.65545L0.287937 7.30983C0.287937 7.30983 0.169786 7.27029 0.083466 7.31788C-0.00285435 7.36547 0.000209436 7.48912 0.000209436 7.48912V9.21179C0.000209436 9.21179 -0.00907456 9.37672 0.230929 9.74642C0.470937 10.1161 1.03944 10.022 1.03944 10.022L1.72532 9.82355Z"/><path fill-rule="evenodd" clip-rule="evenodd" fill="#ED1651" d="M12.3847 5.66712L14.8754 4.27811C14.8754 4.27811 14.9129 4.03809 14.8169 3.95072C14.7209 3.86334 14.6066 3.83644 14.6066 3.83644L3.84955 0.015412C3.84955 0.015412 3.7314 -0.0241311 3.64508 0.0234623C3.55876 0.0710556 3.56182 0.194699 3.56182 0.194699V1.68C3.56182 1.68 3.56032 2.02415 3.80033 2.39384C4.04034 2.76353 4.42978 2.85924 4.42978 2.85924L12.3847 5.66712Z"/><path fill-rule="evenodd" clip-rule="evenodd" fill="#ED1651" d="M12.3847 9.99055L14.8754 8.70615C14.8754 8.70615 14.9285 8.38089 14.8325 8.29353C14.7365 8.20616 14.6066 8.15988 14.6066 8.15988L0.287741 2.98285C0.287741 2.98285 0.16959 2.94331 0.08327 2.9909C-0.00305032 3.03849 1.34598e-05 3.16214 1.34598e-05 3.16214V4.64744C1.34598e-05 4.64744 -0.00148468 4.99159 0.238519 5.36128C0.478526 5.73096 0.867966 5.82668 0.867966 5.82668L12.3847 9.99055Z"/><path fill-rule="evenodd" clip-rule="evenodd" fill="#2A0088" d="M14.6066 3.83619C14.6066 3.83619 14.752 3.85812 14.8753 3.97759C14.9986 4.09705 15 4.24298 15 4.24298V6.20956C15 6.20956 14.9941 6.47824 14.8834 6.71986C14.7726 6.96149 14.6105 7.01865 14.6105 7.01865L3.52308 11.0274C3.52308 11.0274 3.47138 11.0433 3.40413 11.0433C3.33687 11.0433 3.28518 11.0274 3.28518 11.0274L0.29003 9.94442C0.29003 9.94442 0.215725 9.92722 0.1103 9.76282C-0.00842715 9.57838 0.000136092 9.21222 0.000136092 9.21222C0.000136092 9.21222 0.0187626 9.39994 0.125365 9.48909C0.231968 9.57823 0.516074 9.48043 0.516074 9.48043L14.2732 4.50644C14.2732 4.50644 14.8195 4.28462 14.8195 4.05925C14.8195 3.90364 14.6067 3.83682 14.6067 3.83682L14.6066 3.83619Z"/><path fill-rule="evenodd" clip-rule="evenodd" fill="#2A0088" d="M14.6066 8.15961C14.6066 8.15961 14.752 8.18155 14.8753 8.30101C14.9986 8.42047 15 8.5664 15 8.5664V10.533C15 10.533 14.9941 10.8017 14.8834 11.0433C14.7726 11.2849 14.6105 11.3421 14.6105 11.3421L3.52308 15.3508V12.716L14.2731 8.82924C14.2731 8.82924 14.8194 8.60742 14.8194 8.38205C14.8194 8.22644 14.6066 8.15961 14.6066 8.15961Z"/><path fill-rule="evenodd" clip-rule="evenodd" fill="#2A0088" d="M9.27011 15.0814C9.373 15.1839 9.373 15.4092 9.373 15.4092V16.8798C9.373 16.8798 9.36707 17.1485 9.25635 17.3901C9.14564 17.6317 8.98349 17.6889 8.98349 17.6889L3.52296 19.6633V17.0284L8.64612 15.1761C8.64612 15.1761 9.16723 14.979 9.27011 15.0814Z"/><path fill-rule="evenodd" clip-rule="evenodd" fill="#2A0088" d="M5.96522 20.5805C6.06811 20.6829 6.06811 20.9082 6.06811 20.9082V22.3788C6.06811 22.3788 6.06218 22.6475 5.95146 22.8891C5.84074 23.1308 5.6786 23.1879 5.6786 23.1879L5.34123 23.3099L3.52296 23.9999V21.365L5.34123 20.6751C5.34123 20.6751 5.86234 20.478 5.96522 20.5805Z"/></svg>',
  tap: '<svg width="28" height="4.58" viewBox="0 0 28 4.57824" fill="none" aria-hidden="true"><path fill-rule="evenodd" clip-rule="evenodd" fill="#2B2523" d="M16.5913 3.30631C17.1359 3.32388 17.5892 2.89874 17.6067 2.35764V2.27682C17.6278 1.74978 17.2202 1.30355 16.6932 1.28247H16.6089C16.0607 1.26842 15.604 1.70059 15.5899 2.24872V2.3225C15.5723 2.84954 15.9834 3.29577 16.514 3.31334H16.5843L16.5913 3.30631ZM16.5913 3.09901C16.1451 3.09901 15.8675 2.73359 15.8675 2.30845C15.8675 1.88681 16.1205 1.48626 16.5983 1.48626C17.0762 1.48626 17.3256 1.88681 17.3256 2.29088C17.3256 2.75468 17.0445 3.10604 16.5948 3.10604L16.5913 3.09901Z"/><path fill-rule="evenodd" clip-rule="evenodd" fill="#2B2523" d="M14.0966 3.27117H14.3637V2.49115C14.441 2.50872 14.5218 2.51574 14.6026 2.51223C14.838 2.52628 15.0664 2.44898 15.2456 2.2979C15.358 2.18546 15.4178 2.03086 15.4107 1.86924C15.4142 1.71112 15.3475 1.56004 15.2315 1.45815C15.0629 1.33517 14.8521 1.27544 14.6448 1.28949C14.4656 1.28949 14.2864 1.30003 14.1107 1.32814L14.0966 3.27117ZM14.3637 1.52139C14.455 1.50382 14.5499 1.49679 14.6412 1.50031C14.9294 1.50031 15.1472 1.60923 15.1472 1.88681C15.1472 2.16438 14.9504 2.30493 14.6131 2.30493C14.5288 2.30844 14.4445 2.2979 14.3637 2.27682V1.52139Z"/><path fill-rule="evenodd" clip-rule="evenodd" fill="#2B2523" d="M18.0705 3.27116H17.8035L17.8105 1.33516C17.9862 1.30705 18.1654 1.293 18.3446 1.293C18.6362 1.293 18.8189 1.34922 18.9524 1.46165C19.0543 1.55652 19.1141 1.69004 19.1106 1.83058C19.1106 2.06599 18.9489 2.26978 18.7241 2.32952V2.33654C18.8822 2.40682 18.9911 2.55087 19.0192 2.71953C19.0579 2.90575 19.1106 3.09197 19.1808 3.27116H18.9138C18.8541 3.12008 18.8084 2.96548 18.7803 2.80737C18.717 2.54033 18.6046 2.43492 18.3622 2.42438H18.0705V3.27116ZM18.3657 1.49679C18.2673 1.49328 18.1689 1.5003 18.0705 1.52138V2.22411H18.3832C18.6749 2.22411 18.8541 2.08005 18.8541 1.85869C18.8541 1.59517 18.6397 1.49679 18.3657 1.49679Z"/><path fill="#2B2523" d="M19.9257 3.27117H20.1928V1.53193H20.8709V1.31408H19.2511V1.53193H19.9257V3.27117Z"/><path fill="#2B2523" d="M21.0255 2.41736V1.31408H21.2855V2.42439C21.2855 2.88818 21.5069 3.09549 21.809 3.09549C22.1393 3.09549 22.3536 2.88116 22.3536 2.42439V1.31408H22.6207V2.41033C22.6207 3.03927 22.2693 3.3063 21.7985 3.3063C21.3628 3.3063 21.0255 3.06738 21.0255 2.41736Z"/><path fill="#2B2523" d="M24.6656 2.24167H23.9664V2.44898H24.4091V3.01467C24.2826 3.06386 24.1455 3.08494 24.0085 3.07792C23.4745 3.07792 23.1547 2.75115 23.1547 2.29086C23.1547 1.83058 23.4815 1.51084 24.0331 1.51084C24.2053 1.50382 24.3774 1.53895 24.5356 1.60571L24.6023 1.39489C24.4231 1.32462 24.2334 1.28948 24.0401 1.293C23.2812 1.293 22.8736 1.77788 22.8736 2.30141C22.8666 2.56844 22.972 2.82493 23.1582 3.01116C23.3831 3.20792 23.6782 3.30981 23.9804 3.29225C24.2158 3.29225 24.4477 3.25008 24.6656 3.16927V2.24167Z"/><path fill-rule="evenodd" clip-rule="evenodd" fill="#2B2523" d="M26.3556 3.27116L26.1202 2.64574H25.3367L25.1118 3.27116H24.8342L25.5721 1.31057H25.8953L26.6437 3.27116H26.3556ZM25.6213 1.85166L25.3964 2.44195H26.0675L25.8321 1.85518C25.7864 1.7322 25.7548 1.63031 25.7232 1.52841C25.6951 1.63382 25.6634 1.73571 25.6213 1.85166Z"/><path fill="#2B2523" d="M26.8018 3.27117H28V3.05332H27.0654V1.31408H26.8018V3.27117Z"/><path fill="#2B2523" d="M11.2752 1.31408H11.6512V3.27468H11.2752V1.31408Z"/><path fill-rule="evenodd" clip-rule="evenodd" fill="#2B2523" d="M10.4179 2.70548L10.6216 3.27468H11.0327L10.3195 1.31408H9.83108L9.1389 3.27117H9.53242L9.71865 2.70196H10.4179V2.70548ZM9.78541 2.42439L9.96109 1.92897C9.98665 1.85459 10.0076 1.77713 10.028 1.70168C10.0385 1.66308 10.0488 1.62501 10.0595 1.58815C10.0623 1.59762 10.0652 1.60722 10.0681 1.61691C10.0975 1.71504 10.13 1.82376 10.1684 1.93248L10.3476 2.4279H9.78541V2.42439Z"/><path fill-rule="evenodd" clip-rule="evenodd" fill="#2B2523" d="M12.6631 2.52981H12.4277L12.4347 3.2782H12.0693V1.35977L12.1114 1.35274C12.2941 1.32112 12.4804 1.30707 12.6631 1.30707C12.9652 1.30707 13.1655 1.35977 13.3061 1.48626C13.4185 1.58816 13.4817 1.73221 13.4817 1.88681C13.4817 2.10817 13.3517 2.30845 13.1515 2.39629C13.2674 2.48764 13.3482 2.61765 13.3798 2.7617L13.3904 2.80387C13.4255 2.96198 13.4712 3.12009 13.5239 3.27469H13.1409C13.0988 3.14469 13.0601 3.01117 13.032 2.87414C12.9758 2.62467 12.8809 2.54035 12.6631 2.52981ZM12.6701 1.60221C12.5893 1.60221 12.5085 1.60924 12.4277 1.61978L12.4206 2.23115H12.6912C12.9477 2.23115 13.1093 2.10817 13.1093 1.91492C13.1093 1.65491 12.8704 1.60221 12.6701 1.60221Z"/><path fill="#C8D400" d="M2.91981 2.45602H3.60497L3.26063 1.31409L2.91981 2.45602ZM0.973271 4.57824V1.31409H0V0H4.24445V4.57824L3.99147 3.74903V3.76308H2.52629L2.28034 4.57824H0.973271Z"/><path fill="#7AB92C" d="M0.973267 4.57824H2.28033V1.31409H3.26063V0.00702286H2.28033L0.973267 4.57824Z"/><path fill-rule="evenodd" clip-rule="evenodd" fill="#E31118" d="M6.52827 0H4.24442V4.57824H5.54797V3.26766H6.52827C7.43127 3.26766 8.1621 2.53683 8.1621 1.63383C8.1621 0.730832 7.43127 0 6.52827 0ZM6.70046 1.91843L6.74965 1.87978L6.7883 1.83762L6.82344 1.77789L6.84452 1.72167L6.85506 1.64085L6.85155 1.58815L6.82344 1.50031L6.78479 1.43707L6.72857 1.38436L6.6583 1.3422L6.57748 1.3176L5.54799 1.31409V1.96762H6.52829L6.59505 1.96059L6.65127 1.94303L6.70046 1.91843Z"/><path fill="#B91918" d="M4.24095 4.57824H5.54802L4.24095 0.00702286V4.57824Z"/></svg>'
};
function logoCia(k){
  var c = CIAS[k] || CIAS.latam;
  return '<span class="cia cia-' + k + '" title="' + esc(c.n) + '">' +
    (LOGOS_CIA[k] || esc(c.cod)) + '</span>';
}

/* ---------- 7-B.2 motor de passagens ---------- */

V.aereoMotor = function(){
  function campoA(destino, icone, rotulo, valor){
    return '<div class="mfield' + (valor ? ' ok' : '') + '" data-go="' + destino + '">' + icone +
      '<div class="mf-txt">' + (valor ? '<label>' + esc(rotulo) + '</label><b>' + esc(valor) + '</b>'
                                      : '<span class="ph">' + esc(rotulo) + '</span>') + '</div></div>';
  }
  var o = A.origem  ? A.origem.n  + ', ' + ondeLugar(A.origem)  : null;
  var d = A.destino ? A.destino.n + ', ' + ondeLugar(A.destino) : null;
  var datas = A.ini ? (idaEVolta() && A.fim ? dt(A.ini) + ' - ' + dt(A.fim) : dt(A.ini)) : null;
  var pax = viajantesTxt() + ' . ' + A.classe;
  var pronto = !!(A.origem && A.destino);

  return sysbar() + '<div class="hd hd-motor aereo"><div class="ttl">Buscar Passagens</div>' +
    '<button class="closex" data-go="home">✕</button></div>' +
   '<div class="tiporota">' +
     '<button class="tr' + (A.tipo === 'iv' ? ' on' : '') + '" data-tipo="iv">' +
       '<span class="radio"></span>Ida e volta</button>' +
     '<button class="tr' + (A.tipo === 'si' ? ' on' : '') + '" data-tipo="si">' +
       '<span class="radio"></span>Somente ida</button>' +
   '</div>' +
   '<div class="mfields">' +
    campoA('aereoOrigem',  I.decola, 'De onde vai partir?', o) +
    campoA('aereoDestino', I.pin,    'Para aonde deseja ir?', d) +
    campoA('aereoDatas',   I.cal,    'Quando?', datas) +
    campoA('aereoPax',     I.ppl,    'Passageiros e classe', pax) +
   '</div>' +
   '<div class="fixcta on"><button class="btn block' + (pronto ? '' : ' off') + '" ' +
     (pronto ? 'data-buscar-aereo="1"' : 'data-go="aereoOrigem"') + '>Buscar ' + I.lupa + '</button></div>';
};

/* Origem e destino usam a mesma tela, só muda o campo que recebe a escolha */
function telaLocal(titulo, rotulo, campo){
  var val = A[campo] ? A[campo].n : '';
  return headerVolta(titulo, 'aereoMotor') +
   '<div class="field" style="position:relative">' + (campo === 'origem' ? I.decola : I.pin) +
    '<label>' + esc(rotulo) + '</label>' +
    '<input id="qAer" data-campo="' + campo + '" placeholder="Cidade ou aeroporto" autocomplete="off" value="' + esc(val) + '">' +
    '<button class="x" id="qAerClear">✕</button></div>' +
   '<div id="qAerList"></div>';
}
V.aereoOrigem  = function(){ return telaLocal('De onde vai partir?',  'De onde vai partir?',   'origem'); };
V.aereoDestino = function(){ return telaLocal('Para aonde deseja ir?','Para aonde deseja ir?', 'destino'); };

var HIST_AEREO = (function(){
  var quero = ['GIG', 'SSA', 'LIS'], saida = [];
  for(var i = 0; i < quero.length; i++){
    var achou = AEROPORTOS.filter(function(a){ return a.iata === quero[i]; })[0];
    if(achou) saida.push(achou);
  }
  return saida;
})();
function listaAeroportos(termo, campo){
  var el = document.getElementById('qAerList'); if(!el) return;
  var t = (termo || '').trim();
  /* o outro ponto da viagem sai da lista: ninguém voa de SSA para SSA */
  var outro = A[campo === 'origem' ? 'destino' : 'origem'];
  var livre = function(c){ return !outro || c.iata !== outro.iata; };

  function linha(c, marca){
    return '<div class="opt" data-aer="' + c.i + '" data-campo="' + campo + '">' +
      '<div>' + (marca || esc(c.n)) +
        '<span class="onde">, ' + esc(c.uf || c.p) + '</span>' +
        (c.aero ? '<small class="portos">' + esc(c.aero) + '</small>' : '') +
      '</div><span class="iata">' + esc(c.iata) + '</span></div>';
  }

  if(!t){
    var recentes = HIST_AEREO.filter(livre);
    el.innerHTML = recentes.length
      ? '<div class="grouptitle">Buscas recentes</div>' + recentes.map(function(c){ return linha(c); }).join('')
      : '<div class="vazio">Comece a digitar a cidade ou a sigla do aeroporto.</div>';
    return;
  }

  var tt = semAcento(t), achados = [];
  for(var n = 0; n < AEROPORTOS.length; n++){
    var c = AEROPORTOS[n]; if(!livre(c)) continue;
    var peso = -1, i = -1;
    if(c.iata.toLowerCase().indexOf(tt) === 0){ peso = 0; }
    else {
      i = c.k.indexOf(tt);
      if(i === 0) peso = 1;
      else if(i > 0) peso = (c.k.charAt(i-1) === ' ' || c.k.charAt(i-1) === '-') ? 2 : 3;
      else if(c.kp.indexOf(tt) === 0) peso = 4;          /* achou pelo país: "argentina" */
      else if(c.ka && c.ka.indexOf(tt) >= 0) peso = 5;   /* achou pelo nome do aeroporto */
    }
    if(peso < 0) continue;
    achados.push({c:c, i:i, peso:peso});
  }
  if(!achados.length){
    el.innerHTML = '<div class="vazio">Nenhum aeroporto encontrado para “' + esc(t) + '”.<br>' +
      'Tente a cidade (<b>lis</b>), o aeroporto (<b>viracopos</b>), a sigla (<b>GRU</b>) ' +
      'ou o país (<b>argentina</b>).</div>';
    return;
  }
  achados.sort(function(a, b){
    if(a.peso !== b.peso) return a.peso - b.peso;
    var ba = a.c.p === 'Brasil' ? 0 : 1, bb = b.c.p === 'Brasil' ? 0 : 1;
    if(ba !== bb) return ba - bb;                        /* destino nacional primeiro */
    return a.c.i - b.c.i;                               /* mais rotas primeiro */
  });
  var sobra = achados.length - LIMITE_DESTINOS;
  el.innerHTML = '<div class="grouptitle">Cidade ou aeroporto</div>' +
    achados.slice(0, LIMITE_DESTINOS).map(function(r){
      var marca = esc(r.c.n);
      if(r.i >= 0){
        marca = esc(r.c.n.slice(0, r.i)) + '<em>' + esc(r.c.n.slice(r.i, r.i + t.length)) +
                '</em>' + esc(r.c.n.slice(r.i + t.length));
      }
      return linha(r.c, marca);
    }).join('') +
    (sobra > 0 ? '<div class="vazio">+' + sobra + ' resultado' + (sobra > 1 ? 's' : '') +
       '. Continue digitando para refinar.</div>' : '');
}

V.aereoDatas = function(){
  var hoje = new Date(), y = hoje.getFullYear(), m = hoje.getMonth(), html = '';
  for(var k = 0; k < 4; k++) html += mesHTML(y, m + k, A);
  var sub = idaEVolta() ? 'Escolha a ida e a volta' : 'Escolha a data de ida';
  return '<div class="stickytop">' + sysbar() +
   '<div class="hd"><button class="back" data-go="aereoMotor">‹</button>' +
   '<div class="ttl">Quando?<small>' + sub + '</small></div></div>' +
   '<div class="wk">' + WK.map(function(w){ return '<span>' + w + '</span>'; }).join('') + '</div></div>' +
   '<div style="padding-bottom:8px">' + html + '</div>' +
   '<div class="fixcta on rodape-datas">' +
     '<div class="switchrow"><div class="sw" id="swDataAer"><i></i></div>' +
     '<span>Tenho datas flexíveis</span></div>' +
     '<button class="btn block" id="okDatasAer">Continuar ' + I.chev + '</button>' +
   '</div>';
};

V.aereoPax = function(){
  function st(lb, sub, key, min){
    return '<div class="stepper"><div class="lb">' + lb + '<small>' + sub + '</small></div>' +
    '<div class="ct"><button data-paxa="' + key + '" data-v="-1"' + (A[key] <= min ? ' disabled' : '') + '>−</button>' +
    '<span class="n">' + A[key] + '</span><button data-paxa="' + key + '" data-v="1">+</button></div></div>';
  }
  return headerVolta('Passageiros e classe', 'aereoMotor') +
   st('Adultos', 'Acima de 12 anos', 'adultos', 1) +
   st('Menores', 'Até 12 anos', 'menores', 0) +
   st('Bebês', '23 meses no final da viagem', 'bebes', 0) +
   seletorClasse() +
   '<div class="fixcta on"><button class="btn block" data-go="aereoMotor">Salvar</button></div>';
};

/* o seletor do sistema não aceita estilo; este é o do Figma */
function seletorClasse(){
  return '<div class="campo-classe">' + seletorLista('classe', 'Classe', CLASSES, A.classe) + '</div>';
}


/* ---------- 7-B.3 listagem ---------- */

function barraVoos(){
  garantirFiltros();
  var n = filtrosAplicados(A.filtros);
  return '<div class="hd hd-voos"><button class="back" data-go="aereoMotor">‹</button>' +
    '<div class="ttl">Escolha os voos</div></div>' +
   '<div class="searchwrap voos"><div style="display:flex;gap:10px;align-items:center">' +
    '<div class="search" data-go="aereoMotor">' + I.lupa +
      '<div class="txt"><b>' + esc(rotaTxt()) + '</b><small>' + esc(datasTxt()) + ' | ' + esc(viajantesTxt()) + '</small></div></div>' +
    '<button class="filtbtn" data-modal="aereoFiltros">' + I.filtro +
      (n ? '<span class="n">' + n + '</span>' : '') + '</button>' +
   '</div></div>';
}

/* o protótipo tem horários fixos, mas as siglas seguem a rota que a pessoa
   escolheu — senão a lista de GRU para Lisboa mostraria voos para o Rio */
function pontas(qual){
  var o = A.origem ? A.origem.iata : 'GRU', d = A.destino ? A.destino.iata : 'SDU';
  return qual === 'ida' ? { de:o, para:d } : { de:d, para:o };
}
function trechoHTML(v, qual, data){
  var t = trechoDe(v, qual); if(!t) return '';
  var pt = pontas(qual);
  return '<div class="vt-linha">' +
    '<div class="vt-cab"><div class="vt-tipo">' + (qual === 'ida' ? I.decola : I.pousa) +
      '<b>' + (qual === 'ida' ? 'Ida' : 'Volta') + '</b></div>' +
      '<span>' + esc(dtLonga(data)) + '</span></div>' +
    '<div class="vt-horas">' + logoCia(v.cia) +
      '<div class="vt-pt"><b>' + t.p + '</b><small>' + pt.de + '</small></div>' +
      '<div class="vt-meio"><span>' + durTxt(t.dur) + '</span><i></i>' +
        '<small>' + paradasTxt(t.par) + '</small></div>' +
      '<div class="vt-pt fim"><b>' + t.c + maisDia(t.dias) + '</b><small>' + pt.para + '</small></div>' +
    '</div>' +
    '<button class="vt-det" data-detalhe="' + v.id + '">Detalhes do voo ' + I.chev + '</button>' +
  '</div>';
}

V.aereoLista = function(){
  var lista = vooFiltrados();
  var maisBarato = lista.length ? lista.reduce(function(a, b){
    return precoDoVoo(a) <= precoDoVoo(b) ? a : b;
  }) : null;

  var cards = lista.map(function(v){
    var eco = maisBarato && v.id === maisBarato.id;
    return '<div class="voocard' + (eco ? ' eco' : '') + '" data-voo="' + v.id + '">' +
      (eco ? '<span class="selo-eco">Mais econômico</span>' : '') +
      trechoHTML(v, 'ida', A.ini) +
      (idaEVolta() ? trechoHTML(v, 'volta', A.fim) : '') +
      '<div class="vt-preco">' +
        '<div><small>' + viajantes() + ' viajante' + (viajantes() > 1 ? 's' : '') +
          (tarifaDe(v).mais ? ' na tarifa ' + esc(tarifaDe(v).n) : ' a partir de') + '</small>' +
          '<b><small>R$</small> ' + money(precoComTarifa(v)).replace('R$ ', '') + '</b>' +
          '<small>Taxas e impostos inclusos</small></div>' +
        '<button class="btn mini" data-selvoo="' + v.id + '">Selecionar</button>' +
      '</div>' +
      '<div class="vt-tarifa"><span>Tarifa:</span><b class="tg">' + esc(tarifaDe(v).n) + '</b>' +
        '<button class="linkbtn" data-tarifa="' + v.id + '">Ver opções de tarifa ' + I.chev + '</button></div>' +
      '<button class="vt-hor" data-horarios="' + v.id + '">' + I.relogio + ' Ver mais opções de horários</button>' +
    '</div>';
  }).join('');

  var vazio = '<div class="vazio alto">' + I.filtro +
    '<b>Nenhum voo com esses filtros.</b>' +
    '<span>Tente ampliar o horário, a duração ou liberar mais companhias.</span>' +
    '<button class="btn ghost" data-limpar-filtros="1">Limpar filtros</button></div>';

  return headerMarca() + barraVoos() +
    '<div class="voocount">' + (lista.length ? '<b>' + lista.length + '</b> ' +
      (lista.length > 1 ? 'opções encontradas' : 'opção encontrada') +
      ' para <b>' + esc(rotaTxt()) + '</b>' : '') + '</div>' +
    (lista.length ? cards : vazio) +
    (lista.length > 2 ? '<button class="aotopo" id="aoTopo">↑ Ir para o Topo</button>' : '') +
    rodape();
};

/* ---------- 8. MODAIS ---------- */
var M = {};
M.filtros = function(){
  var f = rascunhoHotel();
  var n = filtrosHotelAplicados(f);
  function chips(tipo, itens){
    return '<div class="chips">' + itens.map(function(it){
      return '<div class="chip' + (f[tipo].indexOf(String(it[0])) >= 0 ? ' on' : '') + '"' +
        ' data-fh="' + tipo + '" data-fv="' + esc(it[0]) + '">' + esc(it[1]) + '</div>';
    }).join('') + '</div>';
  }
  var faixas = FAIXAS.map(function(x, i){ return [i, x[0]]; });
  return '<div class="mhead"><b>Filtros</b>' +
      '<span class="mcount">(' + n + ' aplicado' + (n === 1 ? '' : 's') + ')</span>' +
      '<button class="mx" data-close="1" aria-label="Fechar">✕</button></div>' +
    '<div class="mbody">' +
      grupoHTML('fpreco', 'Faixa de preço por noite', chips('preco', faixas)) +
      grupoHTML('fcat',   'Categoria', chips('estrelas', [[3,'3★'],[4,'4★'],[5,'5★']])) +
      grupoHTML('fcom',   'Comodidades', chips('com', COMODIDADES)) +
      '<button class="linkbtn limpa" data-limpar-hotel="1">Limpar filtros</button>' +
    '</div>' +
    '<div class="mfoot"><button class="btn" data-aplicar-hotel="1">Aplicar filtros</button></div>';
};


/* ---------- 7-B.4 modais da listagem ---------- */

/* Slider do filtro. dual=1 tem dois botões (faixa); dual=0 tem um só (máximo).
   fmt 'hora' mostra 07:30; fmt 'dur' mostra 1h15. */
function sliderHTML(chave, titulo, min, max, vA, vB, dual, fmt){
  var f = fmt === 'dur' ? durTxt : hhmm;
  var pa = ((vA - min) / (max - min)) * 100, pb = ((vB - min) / (max - min)) * 100;
  return '<div class="fsl" data-sl="' + chave + '" data-min="' + min + '" data-max="' + max + '" ' +
    'data-dual="' + (dual ? 1 : 0) + '" data-fmt="' + fmt + '">' +
    '<div class="fsl-lab"><b class="lo">' + (dual ? f(vA) : f(min)) + '</b>' +
      '<span>' + esc(titulo) + '</span><b class="hi">' + f(vB) + '</b></div>' +
    '<div class="fsl-track">' +
      '<div class="fsl-ativo" style="left:' + (dual ? pa : 0) + '%;right:' + (100 - pb) + '%"></div>' +
      (dual ? '<button class="fsl-k a" style="left:' + pa + '%" aria-label="mínimo"></button>' : '') +
      '<button class="fsl-k b" style="left:' + pb + '%" aria-label="máximo"></button>' +
    '</div></div>';
}
function grupoHTML(chave, titulo, corpo){
  return '<div class="fgrupo" data-grupo="' + chave + '">' +
    '<button class="fgtit" data-dobra="' + chave + '">' + esc(titulo) + I.down + '</button>' +
    '<div class="fgbody">' + corpo + '</div></div>';
}
function checkHTML(attr, val, rotulo, marcado, extra){
  return '<button class="fcheck' + (marcado ? ' on' : '') + '" ' + attr + '="' + val + '">' +
    '<span class="qd">' + I.check + '</span>' + (extra || '') +
    '<span class="ft">' + esc(rotulo) + '</span></button>';
}

M.aereoFiltros = function(){
  garantirFiltros();
  if(!A.rascunho) A.rascunho = { f: JSON.parse(JSON.stringify(A.filtros)), ordem: A.ordem };
  var r = A.rascunho, f = r.f, l = limitesVoos();
  var n = filtrosAplicados(f);

  var ordens = [
    ['preco-asc',  'Preço: menor para maior'],
    ['preco-desc', 'Preço: maior para menor'],
    ['dur-asc',    'Menor duração'],
    ['dur-desc',   'Maior duração']
  ];
  var ordenar = '<div class="fgrupo fixo"><h4 class="fgtit estatico">Ordenar por</h4>' +
    '<div class="fgbody">' + ordens.map(function(o){
      return '<button class="fradio' + (r.ordem === o[0] ? ' on' : '') + '" data-ordem="' + o[0] + '">' +
        '<span class="rd"></span>' + esc(o[1]) + '</button>';
    }).join('') + '</div></div>';

  var horarios = sliderHTML('horaIda', 'Voo de ida', l.hIdaMin, l.hIdaMax,
                            f.horaIda[0], f.horaIda[1], 1, 'hora') +
    (idaEVolta() ? sliderHTML('horaVolta', 'Voo de volta', l.hVoltaMin, l.hVoltaMax,
                              f.horaVolta[0], f.horaVolta[1], 1, 'hora') : '');

  var duracao = sliderHTML('durIda', 'Voo de ida', 60, l.dIda, 60, f.durIda, 0, 'dur') +
    (idaEVolta() ? sliderHTML('durVolta', 'Voo de volta', 60, l.dVolta, 60, f.durVolta, 0, 'dur') : '');

  var paradas = checkHTML('data-parada', 'todas', 'Todas as paradas', !f.paradas.length) +
    [0,1,2].map(function(p){
      return checkHTML('data-parada', p, paradasTxt(p), f.paradas.indexOf(p) >= 0);
    }).join('');

  var cias = checkHTML('data-cia', 'todas', 'Todas', !f.cias.length) +
    ORDEM_CIAS.map(function(k){
      return checkHTML('data-cia', k, CIAS[k].n, f.cias.indexOf(k) >= 0, logoCia(k));
    }).join('');

  return '<div class="mhead"><b>Ordenar e Filtros</b>' +
      '<span class="mcount">(' + n + ' aplicado' + (n === 1 ? '' : 's') + ')</span>' +
      '<button class="mx" data-close="1" aria-label="Fechar">✕</button></div>' +
    '<div class="mbody" id="filtroBody">' + ordenar +
      grupoHTML('horarios', 'Horários de ida e volta', horarios) +
      grupoHTML('duracao',  'Duração do voo', duracao) +
      grupoHTML('paradas',  'Paradas', '<div class="fchecks">' + paradas + '</div>') +
      grupoHTML('cias',     'Companhias aéreas', '<div class="fchecks">' + cias + '</div>') +
      '<button class="linkbtn limpa" data-limpar-filtros="1">Limpar filtros</button>' +
    '</div>' +
    '<div class="mfoot"><button class="btn" data-aplicar-filtros="1">Aplicar filtros</button></div>';
};

M.aereoDetalhes = function(){
  var v = A.voo || VOOS[0];
  function bloco(qual, data){
    var t = trechoDe(v, qual); if(!t) return '';
    var cia = CIAS[v.cia], pt = pontas(qual);
    var nomeDe = nomeAeroporto(pt.de), nomePara = nomeAeroporto(pt.para);
    return '<div class="det-card">' +
      '<div class="vt-cab"><div class="vt-tipo">' + (qual === 'ida' ? I.decola : I.pousa) +
        '<b>' + (qual === 'ida' ? 'Ida' : 'Volta') + '</b></div>' +
        '<span>' + esc(dtLonga(data)) + '</span></div>' +
      '<div class="vt-horas">' + logoCia(v.cia) +
        '<div class="vt-pt"><b>' + t.p + '</b><small>' + pt.de + '</small></div>' +
        '<div class="vt-meio"><span>' + durTxt(t.dur) + '</span><i></i><small>' + paradasTxt(t.par) + '</small></div>' +
        '<div class="vt-pt fim"><b>' + t.c + maisDia(t.dias) + '</b><small>' + pt.para + '</small></div></div>' +
      '<div class="det-cia"><b>' + esc(cia.n) + ' Airlines</b><span>' + esc(v.voo) + '</span></div>' +
      '<div class="det-op">Operado pela ' + esc(cia.n) + ' Brasil</div>' +
      '<div class="det-pt"><i></i><div><b>' + esc(nomeDe.split(' - ')[0]) + '</b>' +
        '<small>' + esc(nomeDe) + ' (' + pt.de + ')</small></div>' +
        '<span>' + t.p + '<small>' + esc(dtCurta(data)) + '</small></span></div>' +
      t.esc.map(function(e){
        return '<div class="det-escala">' + I.relogio + ' Parada em ' +
          esc(nomeAeroporto(e).split(' - ')[0]) + ' (' + e + ')</div>';
      }).join('') +
      '<div class="det-pt"><i></i><div><b>' + esc(nomePara.split(' - ')[0]) + '</b>' +
        '<small>' + esc(nomePara) + ' (' + pt.para + ')</small></div>' +
        '<span>' + t.c + '<small>' + esc(dtCurta(maisDias(data, t.dias))) + '</small></span></div>' +
      '<div class="det-dur">' + (t.par ? 'Voo com parada: ' : 'Voo direto: ') + durTxt(t.dur) +
        (t.km ? ' &middot; ' + fmtKm(t.km) + ' km' : '') + '</div>' +
    '</div>';
  }
  return '<div class="mhead"><b>Confira os detalhes dos voos</b>' +
      '<button class="mx" data-close="1" aria-label="Fechar">✕</button></div>' +
    '<div class="mbody">' + bloco('ida', A.ini) + (idaEVolta() ? bloco('volta', A.fim) : '') + '</div>';
};

/* as opções de horário de um trecho — trocadas sozinhas ao mudar de aba */
function horariosOpcoesHTML(v, qual){
  var opts = HORARIOS_ALT[qual] || HORARIOS_ALT.ida;
  var sel  = qual === 'ida' ? A.idaIdx : A.voltaIdx;
  var pt   = pontas(qual);
  return opts.map(function(o, i){
    var r = tempos(qual, o.p, v[qual].par, v.id * 3 + i);
    return '<button class="hopt' + (i === sel ? ' on' : '') + '" data-hora="' + i + '" data-qual="' + qual + '">' +
      '<span class="rd"></span>' +
      '<div class="vt-pt"><b>' + o.p + '</b><small>' + pt.de + '</small></div>' +
      '<div class="vt-meio"><span>' + durTxt(r.dur) + '</span><i></i><small>' + paradasTxt(v[qual].par) + '</small></div>' +
      '<div class="vt-pt fim"><b>' + r.c + maisDia(r.dias) + '</b><small>' + pt.para + '</small></div></button>';
  }).join('');
}
M.aereoHorarios = function(){
  var v = A.voo || VOOS[0];
  var qual = idaEVolta() ? A.trecho : 'ida';
  var abas = idaEVolta() ? '<div class="habas">' +
      '<button class="haba' + (qual === 'ida' ? ' on' : '') + '" data-trecho="ida">' + I.decola +
        '<div><b>Ida</b><small>' + esc(dtLonga(A.ini)) + '</small></div></button>' +
      '<button class="haba' + (qual === 'volta' ? ' on' : '') + '" data-trecho="volta">' + I.pousa +
        '<div><b>Volta</b><small>' + esc(dtLonga(A.fim)) + '</small></div></button>' +
    '</div>' : '';

  return '<div class="mhead"><b>Escolha os horários</b>' +
      '<button class="mx" data-close="1" aria-label="Fechar">✕</button></div>' +
    '<div class="mbody">' +
      '<p class="mnota">O preço é o mesmo para todos os horários.</p>' + abas +
      '<div id="horaOpts">' + horariosOpcoesHTML(v, qual) + '</div>' +
    '</div>' +
    '<div class="mfoot duplo">' +
      '<div class="mf-preco"><small>Preço total para ' + viajantes() + ' viajantes</small>' +
        '<b><small>R$</small> ' + money(totalAereo()).replace('R$ ', '') + '</b>' +
        '<small>Taxas e impostos inclusos</small></div>' +
      '<button class="btn" data-aplicar-horario="1">Aplicar</button></div>';
};

/* miolo do cartão de tarifa — trocado sozinho quando a pessoa escolhe outra,
   para a tela não piscar inteira a cada clique */
function tarifaDetalheHTML(){
  var base = precoDoVoo(A.voo || VOOS[0]), t = tarifaAtual();
  return '<span class="tar-nome">' + esc(t.n) + '</span>' +
    t.benef.map(function(b){
      return '<div class="tar-item">' + I.okcirc + '<div><b>' + esc(b[0]) + '</b>' +
        (b[1] ? '<small>' + esc(b[1]) + '</small>' : '') + '</div></div>';
    }).join('') +
    '<div class="tar-total"><span class="tar-sel">' + I.okcirc + ' Tarifa selecionada</span>' +
      '<div><b><small>R$</small> ' + money(base + t.mais).replace('R$ ', '') + '</b>' +
      '<small>Total para ' + viajantes() + ' viajantes<br>Inclui taxas e impostos</small></div></div>';
}
M.aereoTarifa = function(){
  var v = A.voo || VOOS[0];
  var base = precoDoVoo(v);
  var t = tarifaAtual();
  var pi = pontas('ida'), pv = pontas('volta');
  var ti = trechoDe(v, 'ida'), tv = trechoDe(v, 'volta');
  var resumo = '<div class="tar-viagem"><b>Sua viagem</b>' +
    '<p><b>Ida:</b> ' + esc(dtCurta(A.ini)) + ' | ' + pi.de + ' ' + ti.p + ' → ' + pi.para + ' ' + ti.c + maisDia(ti.dias) + '</p>' +
    (idaEVolta() && tv ? '<p><b>Volta:</b> ' + esc(dtCurta(A.fim)) + ' | ' + pv.de + ' ' + tv.p +
       ' → ' + pv.para + ' ' + tv.c + maisDia(tv.dias) + '</p>' : '') + '</div>';

  var aviso = idaEVolta()
    ? '<div class="tar-aviso">' + I.info + '<span>A tarifa escolhida será aplicada aos voos de ida e de volta</span></div>'
    : '';

  var chips = '<div class="tar-wrap"><div class="tar-chips">' + TARIFAS.map(function(x){
      return '<button class="tchip' + (x.k === tarifaDe(v).k ? ' on' : '') + '" data-tar="' + x.k + '">' +
        (x.rec ? '<span class="rec">Recomendado</span>' : '') +
        '<b>' + esc(x.n) + '</b>' +
        '<small>' + (x.mais ? '+' + money(x.mais) : money(base)) + '</small></button>';
    }).join('') + '</div></div>';

  var detalhe = '<div class="tar-det">' + tarifaDetalheHTML() + '</div>';

  return '<div class="mhead"><b>' + (A.tarifaSegue ? 'Revise a tarifa' : 'Escolha a tarifa') + '</b>' +
      '<button class="mx" data-close="1" aria-label="Fechar">✕</button></div>' +
    '<div class="mbody">' + resumo + aviso +
      '<p class="mnota forte">' + TARIFAS.length + ' opções de tarifa disponíveis</p>' +
      chips + detalhe + '</div>' +
    '<div class="mfoot duplo">' +
      '<button class="btn ghost" data-close="1">Voltar</button>' +
      '<button class="btn" data-aplicar-tarifa="1">Aplicar tarifa</button></div>';
};

/* ---------- 7-B.5 checkout e conclusão ---------- */


/* ---------- 7-B.6 checkout: passageiros, resumo e pagamento ---------- */

var SEXOS  = ['Feminino', 'Masculino', 'Prefiro não informar'];
var DOCTOS = ['CPF', 'Passaporte', 'RG'];

/* dados de exemplo para o formulário já vir preenchido */
var PAX_EXEMPLO = [
  { n:'Ana Clara Silva', d:'16/04/1990', s:'Feminino',  doc:'CPF', num:'470.779.420-31',
    pais:'Brasil', e:'anasilva@gmail.com',  t:'(011) 98458-3231' },
  { n:'Rosângela Bueno', d:'23/07/1990', s:'Feminino',  doc:'CPF', num:'748.679.440-33',
    pais:'Brasil', e:'rosangela@email.com', t:'(011) 98458-3231' },
  { n:'Marcos Bueno',    d:'02/11/1986', s:'Masculino', doc:'CPF', num:'322.145.870-02',
    pais:'Brasil', e:'marcos@email.com',    t:'(011) 99712-4410' }
];
function exemploPax(i){
  var b = PAX_EXEMPLO[i % PAX_EXEMPLO.length];
  return { n:b.n, d:b.d, s:b.s, doc:b.doc, num:b.num, pais:b.pais, e:b.e, t:b.t };
}
function tiposPax(){
  var t = [], i;
  for(i = 0; i < A.adultos; i++) t.push('Adulto');
  for(i = 0; i < A.menores; i++) t.push('Menor');
  for(i = 0; i < A.bebes;   i++) t.push('Bebê');
  return t;
}
function ordinal(n){ return n + 'º'; }

/* ---- campo com lista própria (o seletor do sistema não aceita estilo) ---- */
function seletorLista(id, rotulo, opcoes, valor){
  return '<div class="selbox' + (valor ? '' : ' vazio') + '" data-sel="' + esc(id) + '">' +
    '<button type="button" class="campo sel"><label>' + esc(rotulo) + '</label>' +
      '<span class="val">' + esc(valor || rotulo) + '</span>' + I.chev2 + '</button>' +
    '<div class="classes" role="listbox">' + opcoes.map(function(o){
      return '<button type="button" class="cls' + (o === valor ? ' on' : '') +
        '" data-opt="' + esc(o) + '">' + esc(o) + '</button>';
    }).join('') + '</div></div>';
}
function valorSel(id){
  var box = document.querySelector('.selbox[data-sel="' + id + '"]');
  if(!box || box.classList.contains('vazio')) return '';
  return box.querySelector('.val').textContent;
}
function fecharListas(menos){
  var bs = document.querySelectorAll('.selbox.aberto');
  for(var i = 0; i < bs.length; i++) if(bs[i] !== menos) bs[i].classList.remove('aberto');
}

/* ---------- lista de passageiros ---------- */
V.aereoPassageiros = function(){
  var tipos = tiposPax(), blocos = '';
  for(var i = 0; i < tipos.length; i++){
    var d = A.pax[i];
    blocos += '<button class="paxcard' + (d ? ' ok' : '') + '" data-paxabrir="' + i + '">' +
      '<span class="pax-ic">' + I.user +
        (d ? '<i class="pax-ok">' + I.check + '</i>' : '<i class="pax-al">!</i>') + '</span>' +
      '<div class="pax-txt">' +
        '<b>' + (d ? esc(d.n) : 'Passageiro ' + (i + 1) + ' - ' + tipos[i]) + '</b>' +
        '<small>' + (d ? esc(d.num) + ' &middot; ' + esc(d.d) : 'Adicionar dados') + '</small>' +
      '</div>' +
      '<span class="pax-ac">' + (d ? 'Modificar ' + I.lapis : 'Inserir ' + I.setadir) + '</span>' +
    '</button>';
  }
  return headerMarca() +
   passo('aereoLista', 'Voos', 1) +
   '<h2 class="tituloEtapa">Passageiros</h2>' +
   '<p class="txt">Insira os dados de todos os passageiros para continuar com a sua reserva.</p>' +
   blocos +
   '<div class="acao"><button class="btn avancar" data-go="aereoPagamento">' +
     'Continuar para pagamento ' + I.setadir + '</button></div>' +
   rodape();
};

/* ---------- formulário de um passageiro ---------- */
V.aereoPaxForm = function(){
  var i = A.paxEdit, tipos = tiposPax();
  var d = A.pax[i] || exemploPax(i);
  var paises = ['Brasil'].concat(PAISES.slice(1, 10));
  return headerMarca() +
   '<h2 class="tituloEtapa">' + ordinal(i + 1) + ' passageiro - ' + esc(tipos[i] || 'Adulto') + '</h2>' +
   '<div class="paxform">' +
     campoId('px_n', 'Nome completo', d.n) +
     campoId('px_d', 'Data de nascimento', d.d) +
     seletorLista('px_s', 'Sexo', SEXOS, d.s) +
     '<div class="linha2 docs">' + seletorLista('px_doc', 'Documento', DOCTOS, d.doc) +
       campoId('px_num', 'Número do ' + (d.doc || 'CPF'), d.num) + '</div>' +
     seletorLista('px_pais', 'País de residência', paises, d.pais) +
     campoId('px_e', 'E-mail', d.e, 'email') +
     campoId('px_t', 'Telefone', d.t) +
   '</div>' +
   '<div class="acao dupla">' +
     '<button class="btn ghost" data-go="aereoPassageiros">Cancelar</button>' +
     '<button class="btn" data-paxsalvar="1">Salvar</button>' +
   '</div>' + rodape();
};
function campoId(id, rot, val, tipo){
  return '<div class="campo"><label>' + esc(rot) + '</label>' +
    '<input id="' + id + '" type="' + (tipo || 'text') + '" value="' + esc(val || '') + '"></div>';
}

/* ---------- painel "Resumo da reserva" ---------- */
function linhaValor(rot, val, forte){
  return '<div class="rr-linha' + (forte ? ' forte' : '') + '"><span>' + esc(rot) + '</span>' +
    '<b>' + money(val) + '</b></div>';
}
function cartaoVooResumo(qual, data){
  var v = A.voo || VOOS[0], t = trechoDe(v, qual); if(!t) return '';
  var pt = pontas(qual);
  return '<div class="rr-voo">' +
    '<div class="vt-cab vt-linha-top"><div class="vt-tipo">' + (qual === 'ida' ? I.decola : I.pousa) +
      '<b>' + (qual === 'ida' ? 'Ida' : 'Volta') + '</b></div>' +
      '<span>' + esc(dtLonga(data)) + '</span></div>' +
    '<div class="vt-horas">' + logoCia(v.cia) +
      '<div class="vt-pt"><b>' + t.p + '</b><small>' + pt.de + '</small></div>' +
      '<div class="vt-meio"><span>' + durTxt(t.dur) + '</span><i></i>' +
        '<small>' + paradasTxt(t.par) + '</small></div>' +
      '<div class="vt-pt fim"><b>' + t.c + maisDia(t.dias) + '</b><small>' + pt.para + '</small></div>' +
    '</div>' +
    '<button class="vt-det" data-detalhe="' + v.id + '">Mostrar todos os detalhes ' + I.chev + '</button>' +
  '</div>';
}
function grupoBenef(titulo, itens){
  if(!itens.length) return '';
  return '<div class="rr-grupo"><h5>' + esc(titulo) + '</h5>' + itens.map(function(b){
    return '<div class="tar-item">' + I.okcirc + '<div><b>' + esc(b[0]) + '</b>' +
      (b[1] ? '<small>' + esc(b[1]) + '</small>' : '') + '</div></div>';
  }).join('') + '</div>';
}
/* O resumo do aéreo usa a MESMA gaveta da hospedagem: barra fixa no rodapé,
   que sobe sobre o conteúdo. Antes ele era um painel no meio da página e
   ninguém entendia que ali havia o total da compra. */
function resumoAereoHTML(){
  var v = A.voo || VOOS[0], t = tarifaAtual();
  var total = precoDoVoo(v) + t.mais;
  var taxas = Math.round(total * 0.075), voo = total - taxas;
  function g(k){ return t.benef.filter(function(b){ return (b[2] || 'f') === k; }); }

  return '<div class="rr-corpo">' +
    cartaoVooResumo('ida', A.ini) + (idaEVolta() ? cartaoVooResumo('volta', A.fim) : '') +
    '<div class="rr-tarifa"><span class="tar-nome">' + esc(t.n) + '</span>' +
      grupoBenef('Bagagem', g('b')) + grupoBenef('Flexibilidade', g('f')) + grupoBenef('Serviços', g('s')) +
      '<button class="linkbtn dir" data-modal="aereoTarifa">Escolher outra tarifa ' + I.chev + '</button>' +
    '</div>' +
    '<div class="rr-pag"><div class="rr-tit">' + I.okcirc + '<b>Pagamento</b></div>' +
      linhaValor('Voo para ' + viajantes() + ' pessoa' + (viajantes() > 1 ? 's' : ''), voo) +
      linhaValor('Impostos e taxas', taxas) +
      '<div class="rr-hr"></div>' +
      linhaValor('Total', total, true) +
      '<p class="rr-nota">Pagamento em até 10x sem juros.</p>' +
    '</div>' +
  '</div>';
}
function telaDoAereo(id){
  return id === 'aereoPassageiros' || id === 'aereoPagamento';
}

/* ---------- pagamento do aéreo: 1 ou 2 cartões ---------- */
V.aereoPagamento = function(){
  var t = tarifaAtual(), total = precoDoVoo(A.voo || VOOS[0]) + t.mais;
  var dois = A.cartoes === 2;
  var v1 = Math.round(total * 0.4), v2 = total - v1;

  function blocoCartao(titulo, num, nome, cpf, val, cvv, valor, parc){
    return (titulo ? '<h5 class="cartaoTit">' + titulo + '</h5>' : '') +
      campo('Número do Cartão', num) + campo('Nome no cartão', nome) +
      campo('CPF do titular do cartão', cpf) +
      linha2(campo('Validade', val), campo('CVV', cvv)) +
      (valor !== null ? campoLeitura('Valor neste cartão', money(valor)) : '') +
      (parc !== null ? selectCampo('Parcelamento',
          ['4x ' + money(parc / 4), '2x ' + money(parc / 2), '1x ' + money(parc)]) +
        '<p class="minima">* Parcela mínima ' + money(150) + '</p>' : '');
  }

  var op1 = '<div class="opcaoPag' + (dois ? '' : ' sel') + '" data-paya="1">' +
      '<div class="op-cab"><span class="radio">' + (dois ? '' : I.check) + '</span>' +
      '<div><b>Pagar com 1 Cartão</b><small>Em até 4x sem juros.</small></div>' +
      '<span class="op-ic">' + I.cartao + '</span></div>' +
      (dois ? '' : '<div class="op-corpo">' +
        blocoCartao(null, '4196 6485 6739 8526', 'Ana Clara Silva', '470.779.420-31',
                    '11/2026', '174', null, total) + '</div>') +
    '</div>';

  var op2 = '<div class="opcaoPag' + (dois ? ' sel' : '') + '" data-paya="2">' +
      '<div class="op-cab"><span class="radio">' + (dois ? I.check : '') + '</span>' +
      '<div><b>Pagar com 2 Cartões</b><small>Em até 4x sem juros.</small></div>' +
      '<span class="op-ic">' + I.cartao + I.cartao + '</span></div>' +
      (dois ? '<div class="op-corpo">' +
        blocoCartao('Cartão 1', '4196 6485 6739 8526', 'Ana Clara Silva', '470.779.420-31',
                    '11/2026', '174', v1, null) +
        blocoCartao('Cartão 2', '5395 1919 3039 4142', 'Rosângela Bueno', '748.679.440-33',
                    '02/2028', '344', v2, v2) + '</div>' : '') +
    '</div>';

  return headerMarca() +
   passo('aereoPassageiros', 'Passageiros', 2) +
   '<h2 class="tituloEtapa">Pagamento</h2>' + op1 + op2 +
   '<h2 class="tituloEtapa" style="margin-top:24px">Informações importantes</h2>' +
   '<p class="txt corta4">O nome dos passageiros deve ser exatamente igual ao do documento apresentado no embarque. ' +
   'Alterações de nome após a emissão podem ser cobradas pela companhia aérea. Menores desacompanhados seguem as ' +
   'regras da companhia e da legislação vigente.</p>' +
   '<a class="link dir" onclick="return false" href="#">Saiba mais ' + I.down + '</a>' +
   '<div class="termo" data-check="1"><span class="quadro"></span>' +
     '<span>Li e aceito as <a onclick="return false" href="#">Condições de compra</a> e a ' +
     '<a onclick="return false" href="#">Política de privacidade.</a></span></div>' +
   '<div class="termo" data-check="2"><span class="quadro"></span>' +
     '<span>Li e compreendi as regras da tarifa <b>' + esc(t.n) + '</b> para remarcação e cancelamento.</span></div>' +
   '<div class="acao"><button class="btn avancar off" data-go="aereoConclusao">Concluir reserva ' + I.okcirc + '</button></div>' +
   rodape();
};

/* o aviso vai para o e-mail que a pessoa informou no 1º passageiro */
function emailDaReserva(){
  var p = A.pax[0];
  return (p && p.e) ? p.e : S.email;
}
V.aereoConclusao = function(){
  return headerMarca() +
   '<div class="fim-hero"><img src="' + img('fim-sem.jpg') + '" alt="">' +
     '<span>Mais uma experiência<br>incrível no seu caminho!</span></div>' +
   '<div class="fim-ok">' +
     '<span class="fim-sel">' + I.decola + I.check + '</span>' +
     '<h3>Solicitação recebida</h3>' +
     '<p>Estamos preparando tudo para você.</p>' +
     '<p>Assim que estiver tudo confirmado, enviaremos os detalhes da sua viagem para <b>' +
       esc(emailDaReserva()) + '</b></p>' +
     '<p class="obrigado">Obrigado por viajar com a gente.</p>' +
   '</div>' +
   '<div style="padding:0 16px 22px"><button class="btn ghost casa" data-zerar="1" ' +
     'data-go="' + telaInicial() + '">' + I.casa + ' Voltar para Início</button></div>' +
   rodape();
};

/* ---------- 7-B.6 eventos da categoria aérea ---------- */

function irParaVoos(){
  if(!A.ini){
    var h = new Date(); h.setHours(0,0,0,0);
    A.ini = new Date(h.getTime() + 32 * 864e5);
  }
  if(idaEVolta() && !A.fim) A.fim = new Date(A.ini.getTime() + 2 * 864e5);
  if(!idaEVolta()) A.fim = null;
  A.filtros = null; garantirFiltros();
  A.voo = null;
  for(var z = 0; z < VOOS.length; z++) VOOS[z].tarifa = 'light';   /* nova busca, tarifa de entrada */
  go('aereoLista');
}

/* ------- atualização no lugar: o modal não é redesenhado a cada clique ------- */
function marcarUm(sel, attr, valor){
  var bs = document.querySelectorAll(sel);
  for(var i = 0; i < bs.length; i++)
    bs[i].classList.toggle('on', bs[i].getAttribute(attr) === String(valor));
}
function marcarVarios(attr, escolhidos){
  var bs = document.querySelectorAll('[' + attr + ']');
  for(var i = 0; i < bs.length; i++){
    var v = bs[i].getAttribute(attr);
    bs[i].classList.toggle('on', v === 'todas' ? !escolhidos.length
                                               : escolhidos.indexOf(isNaN(+v) ? v : +v) >= 0);
  }
}
function contadorHotel(){
  var cab = document.querySelector('.modal .mcount');
  if(!cab) return;
  var n = filtrosHotelAplicados(rascunhoHotel());
  cab.textContent = '(' + n + ' aplicado' + (n === 1 ? '' : 's') + ')';
}
function contadorFiltro(){
  var cab = document.querySelector('.modal .mcount');
  if(!cab || !A.rascunho) return;
  var n = filtrosAplicados(A.rascunho.f);
  cab.textContent = '(' + n + ' aplicado' + (n === 1 ? '' : 's') + ')';
}
function pintarSlider(sl){
  if(!A.rascunho) return;
  var f = A.rascunho.f, chave = sl.getAttribute('data-sl');
  var min = +sl.getAttribute('data-min'), max = +sl.getAttribute('data-max');
  var dual = sl.getAttribute('data-dual') === '1';
  var fmt = sl.getAttribute('data-fmt') === 'dur' ? durTxt : hhmm;
  var a = dual ? f[chave][0] : min, b = dual ? f[chave][1] : f[chave];
  var pa = ((a - min) / (max - min)) * 100, pb = ((b - min) / (max - min)) * 100;
  sl.querySelector('.fsl-ativo').style.left  = (dual ? pa : 0) + '%';
  sl.querySelector('.fsl-ativo').style.right = (100 - pb) + '%';
  if(dual) sl.querySelector('.fsl-k.a').style.left = pa + '%';
  sl.querySelector('.fsl-k.b').style.left = pb + '%';
  sl.querySelector('.lo').textContent = fmt(a);
  sl.querySelector('.hi').textContent = fmt(b);
}
function pintarSliders(){
  var sls = document.querySelectorAll('.fsl');
  for(var i = 0; i < sls.length; i++) pintarSlider(sls[i]);
}
function remontarModal(nome){
  var corpo = document.querySelector('.modal .mbody');
  var topo = corpo ? corpo.scrollTop : 0;
  abrirModal(nome, true);
  var novo = document.querySelector('.modal .mbody');
  if(novo) novo.scrollTop = topo;
}

/* Arrastar os botões do slider: funciona no dedo e no mouse */
function ligarSliders(){
  var sls = document.querySelectorAll('.fsl');
  for(var i = 0; i < sls.length; i++) (function(sl){
    var trilho = sl.querySelector('.fsl-track');
    var min = +sl.getAttribute('data-min'), max = +sl.getAttribute('data-max');
    var dual = sl.getAttribute('data-dual') === '1';
    var fmt = sl.getAttribute('data-fmt') === 'dur' ? durTxt : hhmm;
    var chave = sl.getAttribute('data-sl');
    var knobs = sl.querySelectorAll('.fsl-k');

    function valorDe(x){
      var r = trilho.getBoundingClientRect();
      var p = Math.max(0, Math.min(1, (x - r.left) / r.width));
      return Math.round(min + p * (max - min));
    }
    function pintar(){ pintarSlider(sl); contadorFiltro(); }
    for(var k = 0; k < knobs.length; k++) (function(bt){
      var qual = bt.classList.contains('a') ? 0 : 1;
      bt.addEventListener('pointerdown', function(e){
        e.preventDefault(); bt.setPointerCapture(e.pointerId); bt.classList.add('peg');
      });
      bt.addEventListener('pointermove', function(e){
        if(!bt.classList.contains('peg')) return;
        var v = valorDe(e.clientX), f = A.rascunho.f;
        if(dual){
          if(qual === 0) f[chave][0] = Math.min(v, f[chave][1] - 10);
          else           f[chave][1] = Math.max(v, f[chave][0] + 10);
        } else {
          f[chave] = Math.max(min, v);
        }
        pintar();
      });
      function solta(e){
        if(!bt.classList.contains('peg')) return;
        bt.classList.remove('peg');
        try{ bt.releasePointerCapture(e.pointerId); }catch(err){}
      }
      bt.addEventListener('pointerup', solta);
      bt.addEventListener('pointercancel', solta);
    })(knobs[k]);
  })(sls[i]);
}


/* As tarifas não cabem na largura do celular: arrastar de lado funciona no
   dedo e também no mouse, e a borda ganha um degradê enquanto houver mais. */
function ligarArrastoLateral(sel){
  var el = document.querySelector(sel); if(!el) return;
  var caixa = el.parentNode, x0 = 0, s0 = 0, pegou = false;
  function dica(){
    var temMais = el.scrollWidth > el.clientWidth + 2 &&
                  el.scrollLeft + el.clientWidth < el.scrollWidth - 2;
    caixa.classList.toggle('tem-mais', temMais);
  }
  el.addEventListener('pointerdown', function(e){
    if(e.button) return;
    pegou = true; x0 = e.clientX; s0 = el.scrollLeft;
    /* nada de setPointerCapture aqui: com o ponteiro capturado o clique
       chega na faixa inteira e o botão da tarifa nunca é selecionado */
  });
  el.addEventListener('pointermove', function(e){
    if(!pegou) return;
    var d = e.clientX - x0;
    if(!el.classList.contains('arrastando')){
      if(Math.abs(d) <= 4) return;                 // ainda pode ser um clique
      el.classList.add('arrastando');
      try{ el.setPointerCapture(e.pointerId); }catch(err){}  // só depois que virou arrasto
    }
    el.scrollLeft = s0 - d;
  });
  function solta(e){
    if(!pegou) return; pegou = false;
    try{ el.releasePointerCapture(e.pointerId); }catch(err){}
    setTimeout(function(){ el.classList.remove('arrastando'); }, 0);
  }
  el.addEventListener('pointerup', solta);
  el.addEventListener('pointercancel', solta);
  /* um arrasto não pode virar clique na tarifa que passou embaixo do dedo */
  el.addEventListener('click', function(e){
    if(el.classList.contains('arrastando')){ e.preventDefault(); e.stopPropagation(); }
  }, true);
  el.addEventListener('scroll', dica, {passive:true});
  dica();
  /* só rola se a tarifa escolhida estiver mesmo fora de vista */
  var sel2 = el.querySelector('.tchip.on');
  if(sel2){
    var a = sel2.getBoundingClientRect(), b = el.getBoundingClientRect();
    if(a.left < b.left - 1)       el.scrollLeft -= (b.left - a.left) + 8;
    else if(a.right > b.right + 1) el.scrollLeft += (a.right - b.right) + 8;
  }
}

/* o atalho para o topo só faz sentido depois que a pessoa rolou a lista */
function ligarAoTopo(){
  var bt = document.getElementById('aoTopo'), sc = document.getElementById('scr');
  if(!bt || !sc) return;
  function ver(){ bt.classList.toggle('on', sc.scrollTop > 320); }
  sc.addEventListener('scroll', ver, {passive:true});
  ver();
}
function bindAereo(){
  document.addEventListener('click', function(e){
    var t = e.target.closest('[data-tipo],[data-buscar-aereo],[data-aer],[data-paxa],[data-voo],' +
      '[data-detalhe],[data-horarios],[data-tarifa],[data-selvoo],[data-tar],[data-aplicar-tarifa],' +
      '[data-trecho],[data-hora],[data-aplicar-horario],[data-ordem],[data-parada],[data-cia],[data-dobra],' +
      '[data-aplicar-filtros],[data-limpar-filtros],[data-cat],#aoTopo,#okDatasAer,#qAerClear');
    if(!t) return;

    if(t.hasAttribute('data-cat')){
      var cat = t.getAttribute('data-cat');
      if(cat === 'hosp') go('motor');
      else if(cat === 'aereo') go('aereoMotor');
      else { t.classList.add('tremer'); setTimeout(function(){ t.classList.remove('tremer'); }, 500); }
      return;
    }
    if(t.hasAttribute('data-tipo')){
      A.tipo = t.getAttribute('data-tipo');
      if(!idaEVolta()) A.fim = null;
      A.filtros = null; go('aereoMotor'); return;
    }
    if(t.hasAttribute('data-buscar-aereo')){ irParaVoos(); return; }
    if(t.hasAttribute('data-aer')){
      var c = AEROPORTOS[+t.getAttribute('data-aer')], campo = t.getAttribute('data-campo');
      A[campo] = c;
      var jaTem = HIST_AEREO.filter(function(x){ return x.iata === c.iata; }).length;
      if(!jaTem) HIST_AEREO.unshift(c);
      if(campo === 'origem' && !A.destino) go('aereoDestino');
      else if(campo === 'destino' && !A.ini) go('aereoDatas');
      else go('aereoMotor');
      return;
    }
    if(t.id === 'qAerClear'){
      var q = document.getElementById('qAer'); q.value = '';
      listaAeroportos('', q.getAttribute('data-campo')); q.focus(); return;
    }
    if(t.id === 'okDatasAer'){
      if(!A.ini){
        var h = new Date(); h.setHours(0,0,0,0);
        A.ini = new Date(h.getTime() + 32 * 864e5);
      }
      if(idaEVolta() && !A.fim) A.fim = new Date(A.ini.getTime() + 2 * 864e5);
      go('aereoMotor'); return;
    }
    if(t.hasAttribute('data-paxa')){
      var k = t.getAttribute('data-paxa'), v = +t.getAttribute('data-v');
      var minimo = k === 'adultos' ? 1 : 0;
      A[k] = Math.max(minimo, Math.min(9, A[k] + v));
      if(A.bebes > A.adultos) A.bebes = A.adultos;
      go('aereoPax'); return;
    }
    if(t.id === 'aoTopo'){
      var sc = document.getElementById('scr');
      if(sc){ if(sc.scrollTo) sc.scrollTo({top:0, behavior:'smooth'}); else sc.scrollTop = 0; }
      return;
    }

    /* --- modais --- */
    if(t.hasAttribute('data-detalhe')){
      A.voo = acharVoo(t.getAttribute('data-detalhe')); abrirModal('aereoDetalhes', true); return;
    }
    if(t.hasAttribute('data-horarios')){
      A.voo = acharVoo(t.getAttribute('data-horarios')); A.trecho = 'ida';
      abrirModal('aereoHorarios', true); return;
    }
    if(t.hasAttribute('data-tarifa')){
      A.voo = acharVoo(t.getAttribute('data-tarifa')); A.tarifaSegue = false;
      abrirModal('aereoTarifa', true); return;
    }
    if(t.hasAttribute('data-selvoo')){
      A.voo = acharVoo(t.getAttribute('data-selvoo')); A.tarifaSegue = true;
      abrirModal('aereoTarifa', true); return;
    }
    if(t.hasAttribute('data-tar')){
      if(A.voo) A.voo.tarifa = t.getAttribute('data-tar');
      marcarUm('.tchip', 'data-tar', tarifaAtual().k);
      var det = document.querySelector('.tar-det');
      if(det) det.innerHTML = tarifaDetalheHTML(); else remontarModal('aereoTarifa');
      return;
    }
    if(t.hasAttribute('data-aplicar-tarifa')){
      // quem trocou a tarifa de dentro do resumo volta para onde estava
      var volta = telaDoAereo(atual) ? atual : (A.tarifaSegue ? 'aereoPassageiros' : 'aereoLista');
      fecharModal(); go(volta); return;
    }
    if(t.hasAttribute('data-trecho')){
      A.trecho = t.getAttribute('data-trecho');
      marcarUm('.haba', 'data-trecho', A.trecho);
      var cx = document.getElementById('horaOpts');
      if(cx) cx.innerHTML = horariosOpcoesHTML(A.voo || VOOS[0], A.trecho);
      else remontarModal('aereoHorarios');
      return;
    }
    if(t.hasAttribute('data-aplicar-horario')){ fecharModal(); go('aereoLista'); return; }
    if(t.hasAttribute('data-hora')){
      var i = +t.getAttribute('data-hora'), qual = t.getAttribute('data-qual');
      var alt = (HORARIOS_ALT[qual] || HORARIOS_ALT.ida)[i];
      var limAntes = limitesVoos();
      if(A.voo && A.voo[qual]){
        if(A.voo[qual].p0 === undefined) A.voo[qual].p0 = A.voo[qual].p;   /* para o zerar */
        A.voo[qual].p = alt.p; A.voo[qual].alt = i;
      }
      seguirLimites(limAntes);
      if(qual === 'ida') A.idaIdx = i; else A.voltaIdx = i;
      marcarUm('.hopt', 'data-hora', i);
      return;
    }

    /* --- filtro --- */
    if(t.hasAttribute('data-ordem')){
      A.rascunho.ordem = t.getAttribute('data-ordem');
      marcarUm('.fradio', 'data-ordem', A.rascunho.ordem); contadorFiltro(); return;
    }
    if(t.hasAttribute('data-parada')){
      var p = t.getAttribute('data-parada'), f = A.rascunho.f;
      if(p === 'todas') f.paradas = [];
      else {
        p = +p; var j = f.paradas.indexOf(p);
        if(j >= 0) f.paradas.splice(j, 1); else f.paradas.push(p);
      }
      marcarVarios('data-parada', f.paradas); contadorFiltro(); return;
    }
    if(t.hasAttribute('data-cia')){
      var cc = t.getAttribute('data-cia'), ff = A.rascunho.f;
      if(cc === 'todas') ff.cias = [];
      else { var jj = ff.cias.indexOf(cc); if(jj >= 0) ff.cias.splice(jj, 1); else ff.cias.push(cc); }
      marcarVarios('data-cia', ff.cias); contadorFiltro(); return;
    }
    if(t.hasAttribute('data-dobra')){
      var g = t.closest('.fgrupo'); if(g) g.classList.toggle('fechado'); return;
    }
    if(t.hasAttribute('data-aplicar-filtros')){
      A.filtros = A.rascunho.f; A.ordem = A.rascunho.ordem; A.rascunho = null;
      fecharModal(); go('aereoLista'); return;
    }
    if(t.hasAttribute('data-limpar-filtros')){
      var l = limitesVoos(), novo = filtrosPadrao();
      novo.horaIda = [l.hIdaMin, l.hIdaMax]; novo.horaVolta = [l.hVoltaMin, l.hVoltaMax];
      novo.durIda = l.dIda; novo.durVolta = l.dVolta;
      if(A.rascunho){
        A.rascunho.f = novo;
        marcarVarios('data-parada', novo.paradas); marcarVarios('data-cia', novo.cias);
        pintarSliders(); contadorFiltro();
      }
      else { A.filtros = novo; go('aereoLista'); }
      return;
    }
  });

  document.addEventListener('input', function(e){
    if(e.target.id === 'qAer') listaAeroportos(e.target.value, e.target.getAttribute('data-campo'));
  });
  /* ------- checkout: passageiros, resumo e cartões ------- */
  document.addEventListener('click', function(e){
    var ab = e.target.closest('[data-paxabrir]');
    if(ab){ A.paxEdit = +ab.getAttribute('data-paxabrir'); go('aereoPaxForm'); return; }

    if(e.target.closest('[data-paxsalvar]')){
      function v(id){ var n = document.getElementById(id); return n ? n.value.trim() : ''; }
      A.pax[A.paxEdit] = {
        n:v('px_n') || exemploPax(A.paxEdit).n, d:v('px_d'),
        s:valorSel('px_s'), doc:valorSel('px_doc') || 'CPF', num:v('px_num'),
        pais:valorSel('px_pais'), e:v('px_e'), t:v('px_t')
      };
      go('aereoPassageiros'); return;
    }

    var pa = e.target.closest('[data-paya]');
    if(pa){ A.cartoes = +pa.getAttribute('data-paya'); go('aereoPagamento'); return; }

    /* campos com lista própria (classe, sexo, documento, país) */
    var sb = e.target.closest('.selbox .campo.sel');
    if(sb){
      e.preventDefault();
      var cxs = sb.parentNode;
      fecharListas(cxs); cxs.classList.toggle('aberto'); return;
    }
    var op = e.target.closest('.selbox [data-opt]');
    if(op){
      var box = op.closest('.selbox'), valor = op.getAttribute('data-opt');
      box.querySelector('.val').textContent = valor;
      box.classList.remove('vazio', 'aberto');
      var irmaos = box.querySelectorAll('.cls');
      for(var k = 0; k < irmaos.length; k++) irmaos[k].classList.toggle('on', irmaos[k] === op);
      if(box.getAttribute('data-sel') === 'classe') A.classe = valor;
      if(box.getAttribute('data-sel') === 'px_doc'){
        var rotulo = document.querySelector('#px_num');
        if(rotulo) rotulo.parentNode.querySelector('label').textContent = 'Número do ' + valor;
      }
      return;
    }
    if(!e.target.closest('.selbox')) fecharListas(null);
  });

  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape') fecharListas(null);
  });
  document.addEventListener('click', function(e){
    var sw = e.target.closest('#swDataAer');
    if(sw){ sw.classList.toggle('on'); if(sw.classList.contains('on')){ A.ini = null; A.fim = null; } }
  });
}
/* Depois de mexer nos dados de um voo, as pontas do filtro que estavam
   coladas no limite anterior passam a valer o limite novo. Sem isso, escolher
   um horário mais longo fazia o próprio voo escolhido sumir da lista. */
function seguirLimites(antes){
  var f = A.filtros; if(!f) return;
  var l = limitesVoos();
  if(f.durIda      === antes.dIda)      f.durIda      = l.dIda;
  if(f.durVolta    === antes.dVolta)    f.durVolta    = l.dVolta;
  if(f.horaIda[0]  === antes.hIdaMin)   f.horaIda[0]  = Math.min(f.horaIda[0], l.hIdaMin);
  if(f.horaIda[1]  === antes.hIdaMax)   f.horaIda[1]  = Math.max(f.horaIda[1], l.hIdaMax);
  if(f.horaVolta[0]=== antes.hVoltaMin) f.horaVolta[0]= Math.min(f.horaVolta[0], l.hVoltaMin);
  if(f.horaVolta[1]=== antes.hVoltaMax) f.horaVolta[1]= Math.max(f.horaVolta[1], l.hVoltaMax);
}
function acharVoo(id){
  var r = VOOS.filter(function(v){ return String(v.id) === String(id); });
  return r[0] || VOOS[0];
}

/* ---------- 9. NAVEGAÇÃO ---------- */
var vp, modal, atual='home', tabAtual='v';
/* Onde a pessoa estava em cada tela, para devolver no lugar quando ela volta */
var rolagens = {}, voltando = false;

function go(id){
  if(!V[id]) return;
  var anterior = document.getElementById('scr');
  if(anterior) rolagens[atual] = anterior.scrollTop;

  atual=id;
  /* A troca é instantânea: a tela nova já nasce pintada e desliza 8px para o
     lugar. Animar a opacidade de 0 deixava o viewport branco por ~45ms — era
     isso que parecia um piscar. E manter a tela antiga por baixo para dissolver
     uma na outra deixaria duas cópias de tudo na página durante a animação. */
  vp.innerHTML='<div class="screen on" id="scr">'+V[id]()+'</div>';
  var s=document.getElementById('scr');
  // As barras fixas saem do container que rola e passam a viver no viewport,
  // senao elas rolam junto com o conteudo e somem no meio da tela.
  var fixos = s.querySelectorAll('.fixcta, .fixbar');
  for(var f=0; f<fixos.length; f++) vp.appendChild(fixos[f]);
  if(id==='hotel'){ montarSheet(); ligarEspia(); }
  if(id==='checkout' || id==='pagamento'){ sheetAberto = false; montarSheet(); }
  // o aéreo ganha a mesma gaveta: a barra do resumo mora no rodapé e sobe
  if(telaDoAereo(id)){ sheetAberto = false; montarSheet(); }
  if(id==='home') s.classList.add('noscroll');
  if(id==='datas' || id==='aereoDatas') s.classList.add('with-cta-datas');
  if(id==='aereoLista') ligarAoTopo();
  if(id==='aereoOrigem' || id==='aereoDestino'){
    var qa=document.getElementById('qAer');
    listaAeroportos(qa.value, qa.getAttribute('data-campo'));
    var dedoA = window.matchMedia && window.matchMedia('(pointer:coarse)').matches;
    if(!dedoA) setTimeout(function(){ qa.focus(); qa.select(); }, 60);
  }
  if(document.querySelector('.fixcta.on')) s.classList.add('with-cta');
  if(document.querySelector('.fixbar.on')) s.classList.add('with-bar');
  /* voltando, a tela reabre onde a pessoa parou; avançando, começa do topo */
  s.scrollTop = (voltando && rolagens[id]) ? rolagens[id] : 0;
  voltando = false;
  if(id==='destino'){
    var q=document.getElementById('qDest'); listaDestinos(q.value);
    // no celular o teclado não sobe sozinho: atrapalha ver as últimas pesquisas
    var dedo = window.matchMedia && window.matchMedia('(pointer:coarse)').matches;
    if(!dedo) setTimeout(function(){q.focus();q.select()},60);
  }
  window.scrollTo(0,0);
}
window.TC_GO=go;
function abrirModal(nome, alto){
  if(nome.indexOf('aereo')===0 || nome==='filtros') alto = true;   // modais de filtro são de tela cheia
  clearTimeout(saidaModal); saidaModal = null;   /* abriu outro antes de fechar */
  modal.classList.remove('saindo');
  modal.innerHTML='<div class="bk" data-close="1"></div><div class="sh'+(alto?' alto':'')+'">'+M[nome]()+'</div>';
  modal.classList.add('on');
  if(nome==='aereoFiltros') ligarSliders();
  if(nome==='aereoTarifa') ligarArrastoLateral('.tar-chips');
}
/* O modal sai pelo mesmo caminho que entrou: a folha desce e o fundo clareia.
   O conteúdo só é apagado depois da animação, senão a tela pisca branca. */
var saidaModal = null;
function fecharModal(){
  A.rascunho = null;              // sair pelo X descarta o rascunho do filtro
  S.rascunhoF = null;
  if(!modal.classList.contains('on')) return;
  var reduzido = window.matchMedia && window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  if(reduzido){ limparModal(); return; }
  modal.classList.add('saindo');
  clearTimeout(saidaModal);
  saidaModal = setTimeout(limparModal, 170);
}
function limparModal(){
  clearTimeout(saidaModal); saidaModal = null;
  modal.classList.remove('on', 'saindo'); modal.innerHTML = '';
}

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
        return '<div class="opt hist" data-pick="'+c.i+'">'+I.hist+
          '<div>'+esc(c.n)+'<span class="onde">, '+esc(ondeCidade(c))+'</span></div></div>';
      }).join('');
    return;
  }

  // digitando -> cidades. Busca ignora acento e ordena: começa com > palavra > contém.
  var tt = semAcento(t);
  var achados = [];
  for(var k=0;k<CIDADES.length;k++){
    var c = CIDADES[k], sn = c.k, i = sn.indexOf(tt), peso;
    if(i < 0){
      if(c.kp.indexOf(tt) !== 0) continue;
      peso = 3;                                    /* achou pelo país: "argentina" */
    } else {
      peso = (i === 0) ? 0 : (sn.charAt(i-1) === ' ' || sn.charAt(i-1) === '-') ? 1 : 2;
    }
    achados.push({c:c, i:i, peso:peso});
  }
  if(!achados.length){
    el.innerHTML='<div class="vazio">Nenhum destino encontrado para “'+esc(termo.trim())+'”.<br>'+
      'Tente o começo do nome (<b>san</b> para Santos) ou o país (<b>argentina</b>).</div>';
    return;
  }
  achados.sort(function(a,b){
    if(a.peso !== b.peso) return a.peso - b.peso;
    var ba = a.c.p === 'Brasil' ? 0 : 1, bb = b.c.p === 'Brasil' ? 0 : 1;
    if(ba !== bb) return ba - bb;                       // destino nacional primeiro
    return a.c.i - b.c.i;                              // mais procurado primeiro
  });
  var sobra = achados.length - LIMITE_DESTINOS;
  var topo = achados.slice(0, LIMITE_DESTINOS);
  el.innerHTML='<div class="grouptitle">Cidade</div>'+topo.map(function(r){
    var nome=r.c.n, i=r.i, n=t.length;
    var marca = i < 0 ? esc(nome)
      : esc(nome.slice(0,i))+'<em>'+esc(nome.slice(i,i+n))+'</em>'+esc(nome.slice(i+n));
    return '<div class="opt" data-pick="'+r.c.i+'"><div>'+marca+
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
  /* "Fale com a nossa equipe" abre a conversa simulada; qualquer toque nela
     devolve a pessoa para a tela e a rolagem de onde ela saiu. */
  document.addEventListener('click', function(e){
    if(e.target.closest('[data-whats]')){
      var sc = document.getElementById('scr');
      zapVolta = { tela: atual, rolagem: sc ? sc.scrollTop : 0 };
      go('whats'); return;
    }
    if(atual === 'whats'){
      go(zapVolta.tela || 'home');
      var sv = document.getElementById('scr');
      if(sv) sv.scrollTop = zapVolta.rolagem || 0;
    }
  });

  /* A gaveta fecha pela barra ou pelo arrasto, como na produção. Um toque fora
     não fecha: isso foi testado e descartado, não reintroduzir sem combinar. */
  document.addEventListener('click',function(e){
    var t=e.target.closest('[data-prime],[data-go],[data-modal],[data-close],[data-cidade],[data-hotel],[data-opt],[data-pay],[data-check],[data-sec],#sheetBar,[data-step],[data-pick],[data-d],.chip,.paytab .p,' +
      '[data-aplicar-hotel],[data-limpar-hotel],[data-limpar-hotel-tudo]');
    if(!t) return;

    if(t.hasAttribute('data-close')){ fecharModal(); return; }
    if(t.hasAttribute('data-modal')){ abrirModal(t.getAttribute('data-modal')); return; }

    if(t.hasAttribute('data-pick')){
      var c=CIDADES[+t.getAttribute('data-pick')];
      if(!c) return;
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
      var ctx = (atual==='aereoDatas') ? A : S;
      if(atual==='aereoDatas' && !idaEVolta()){ ctx.ini=d; ctx.fim=null; }
      else if(!ctx.ini || (ctx.ini&&ctx.fim) || d<=ctx.ini){ ctx.ini=d; ctx.fim=null; }
      else { ctx.fim=d; }
      var sc=document.getElementById('scr').scrollTop;
      go(atual==='aereoDatas' ? 'aereoDatas' : 'datas');
      document.getElementById('scr').scrollTop=sc; return;
    }
    if(t.hasAttribute('data-step')){
      var k=t.getAttribute('data-step'), v=+t.getAttribute('data-v');
      var min = k==='criancas'?0:1;
      S[k]=Math.max(min,Math.min(9,S[k]+v)); go('hospedes'); return;
    }
    if(t.hasAttribute('data-hotel')){
      S.hotel=catalogoHoteis().filter(function(h){return h.id==t.getAttribute('data-hotel')})[0];
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
      var bt=document.querySelector('.acao .btn.avancar');
      if(bt) bt.classList.toggle('off', aceitos < total);
      return;
    }
    /* Só as ofertas de quarto, que vêm como "indice:prime". As listas próprias
       (classe, sexo, documento, país) também usam data-opt, e sem este filtro
       escolher "Executiva" no aéreo apagava o botão Salvar e abria o resumo
       da hospedagem por cima. */
    if(t.hasAttribute('data-opt') && /^\d+:[01]$/.test(t.getAttribute('data-opt'))){
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
    /* chips do filtro de hospedagem: escolha múltipla, no rascunho */
    if(t.hasAttribute('data-fh')){
      var tipoF = t.getAttribute('data-fh'), valF = t.getAttribute('data-fv');
      var arr = rascunhoHotel()[tipoF], ja = arr.indexOf(valF);
      if(ja >= 0) arr.splice(ja, 1); else arr.push(valF);
      t.classList.toggle('on', ja < 0);
      contadorHotel(); return;
    }
    if(t.hasAttribute('data-limpar-hotel')){
      S.rascunhoF = { preco:[], estrelas:[], com:[] };
      remontarModal('filtros'); return;
    }
    if(t.hasAttribute('data-aplicar-hotel')){
      S.filtros = rascunhoHotel(); S.rascunhoF = null;
      fecharModal(); go('resultados'); return;
    }
    if(t.hasAttribute('data-limpar-hotel-tudo')){
      S.filtros = { preco:[], estrelas:[], com:[] }; S.rascunhoF = null;
      go('resultados'); return;
    }
    if(t.parentNode&&t.parentNode.classList.contains('paytab')){
      Array.prototype.forEach.call(t.parentNode.children,function(c){c.classList.remove('on')});
      t.classList.add('on'); return;
    }
    if(t.hasAttribute('data-prime')){
      voltaDoPrime = (atual === 'prime') ? 'hotel' : atual;
      go('prime'); return;
    }
    if(t.hasAttribute('data-go')){
      if(t.classList.contains('off')) return;
      if(t.hasAttribute('data-zerar')) zerarTrilha();
      /* seta e "Voltar para" devolvem a pessoa onde ela parou na tela anterior */
      voltando = t.classList.contains('back') || t.classList.contains('voltar');
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
  guardarEstadoDeFabrica();     /* antes de qualquer toque */
  vp=document.getElementById('vp');
  modal=document.createElement('div'); modal.className='modal'; modal.id='modal';
  vp.parentNode.appendChild(modal);
  bind();
  bindAereo();
  escalar();
  var inicial = telaInicial();
  go(inicial);
}
// o motor sobe assim que o #vp existe — não espera folha de estilo externa (fontes)
if(document.getElementById('vp')) init();
else if(document.readyState!=='loading') init();
else document.addEventListener('DOMContentLoaded', init);
})();
