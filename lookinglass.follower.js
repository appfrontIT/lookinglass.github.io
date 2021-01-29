// assume jQuery is loaded already
/**
flow:
  - prodList.do?_uymHJLU_=lj7&codgruppo=103
  - garanzieList.do?_Tyy9z_=tP7DQL&codprod=203
    (cb + cod. autorizz ) -> Prosegui
  - garanzieList.do?_j0x_=zJwIRX (tipo di polizza?)
    dati anagrafici
  - garanzieList.do?_GmFSPs_=9eddYU (Dati anagrafici)
  - anagEmissione.do?_qkVDIke_=wxG0E
    (campi di testo)
  - anagEmissione.do?_qkVDIke_=wxG0E
  - adeguatezza.do?_LkKZ_=pjXX7Xk&result=go
  - datiContratto.do?_PWUo_=RSi (Dati Contratto)
  - datiContratto.do?_PWUo_=RSi (Attestato di rischio - 1)
  - attestatoRischio.do?_PWUo_=RSi (Attestato di rischio - 2)
  - attestatoRischio.do?_PWUo_=RSi (Prodotto autovetture)
  - matriceGaranzie.do?_PWUo_=RSi (Matrice Garanzie)
  - matriceGaranzie.do?_PWUo_=RSi (Riepilogo Garanzie)
  -
 */
function saveInitialPageInformation(w) {
  w.sessionStorage.clear();
  w.sessionStorage.setItem('User', w.localStorage.getItem('lookinglassUserID'));
  w.sessionStorage.setItem('SessionID', getSessionIdFromCookies());
  w.sessionStorage.setItem('TimestampISO', (new Date()).toISOString());
}

const paginaPrefix = "pagina - ";

function savePageInformation(w, $, url) {
  // the page has to be identified by metro-title,
  // since the url doesn't always change
  var title = $('h2.metro-title').text().trim();
  var timestamp = new Date();
  console.log("running " + title);
  if(title == "Prodotto AUTOVETTURE") {
    // this works with the ( > ) button
    $("a.linkball").last().click(function(e) {
      var info = takeProdottoAutovetture($);
      var jsonObj = makePage(w, title, timestamp.toISOString(), info);
      if(w.sessionStorage.getItem(paginaPrefix + title) !== null)
        title = title + " 2";
      w.sessionStorage.setItem(paginaPrefix + title, JSON.stringify(jsonObj));
    });
  } else if(title === 'Riepilogo') {
    // ending action
    var info = takeRiepilogoGenerale($);
    var jsonObj = makePage(w, title, timestamp.toISOString(), info);
    w.sessionStorage.setItem(paginaPrefix + title, JSON.stringify(jsonObj));
    sendToServer(w);
  } else {
    // assuming all other submit buttons are called "Prosegui"
    $("a:contains('Prosegui')").click(function(e) {
      var info = takeSwitch(title, $);
      var jsonObj = makePage(w, title, timestamp.toISOString(), info);
      if(w.sessionStorage.getItem(paginaPrefix + title) !== null)
        title = title + " 2";
      w.sessionStorage.setItem(paginaPrefix + title, JSON.stringify(jsonObj));
    });
  }

}

function makePage(w, title, time, info, param1) {
  var data = {};
  data.url = w.location.href;
  data.inizio = time;
  data.classePagina = w.location.pathname.substring(1);
  data.sottoClassePagina = title;
  if(data.classePagina === "garanzieList.do") {
    data.codprod = parseInt(getParameterByName('codprod'));
  }
  if(data.classePagina === "prodList.do") {
    data.codgruppo = parseInt(getParameterByName('codgruppo'));
  }
  data.form = info;
  return data;
}

function takeSwitch(title, $) {
  switch(title) {
    case 'Elenco Garanzie':
      return takeElencoGaranzie($);
    case 'Dati Anagrafici':
      return takeDatiAnagrafici($);
    case 'Questionario':
      return takeQuestionario($);
    case 'Dati Contratto':
      return takeDatiContratto($);
    case 'Attestato di Rischio':
      if(isTextOnPage('Polizza di riferimento Dallbogg')){
        return takeAttestatoDiRischio($);
      } else {
        return takeAttestatoDiRischioSummary($);
      }
    case 'Riepilogo Garanzie':
      return takeRiepilogoGaranzie($);
    case 'Prodotto AUTOVETTURE - Dati Integrativi':
      return takeDatiIntegrativi($);
    default:
      console.error("Some Unknown page!")
      return {};
  }
}

function takeRiepilogoGenerale($) {
  var generale = Object.fromEntries(
    $('td.formLeft').map(function(_i,x){
      var j = {};
      j[$(x).text().slice(0,-1)] = $(x).next().text();
      return j;
    })
    .toArray()
  );
  var rate = Object.fromEntries(
    $('td.formleft').toArray().slice(1,8).map(function(x){
      var sibs = $(x).siblings();
      var pair = [ncd(sibs[0].innerText), ncd(sibs[1].innerText)];
      return [$(x).text(), pair];
    })
  );
  var data = Object.assign(generale, rate);
  data.Frazionamento = $('select[name=fraz] option:selected').text();
  data.ScadenzaRata = $("td.formleft:contains('Scadenza Rata')").next().get(0).innerText;
  return data;
}

function takeDatiIntegrativi($) {
  function takeTextNextTo(label) {
    return $("td.formleft:contains('"+label+"')").next().get(0).innerText;
  }
  var data = {};

  data.DescrizioneVeicolo = $('input[name=dt_009]').val();
  data.TargaVeicolo = takeTextNextTo('TARGA VEICOLO');
  data.PotenzaKw = parseInt(takeTextNextTo('POTENZA KW (P.2)'));
  data.CodiceFiscale = takeTextNextTo('COD.FISCALE INT. PRA');
  data.Nominativo = takeTextNextTo('NOMINATIVO');
  data.ComuneIntPra = takeTextNextTo('COMUNE');
  data.ProvinciaIntPra = takeTextNextTo('PROVINCIA');

  return data;
}

function takeQuestionario($) {
  function child(x, idx) {
    var data = {};
    var tds = $(x).children();
    if(idx%2==0) {
        data.label = tds[0].innerText;
        data.checkboxes = $(tds[1]).children().toArray().map(function(x){
          return {
            "id": x.id,
            "name": x.name,
            "value": x.value,
            "checked": x.checked
          };
        }).filter(function(x){ return x.id != ""});
    }
    return data;
  }

  var data = {};
  var trs = $('form[name=form0] tr').toArray();
  data.Tabella = $('form[name=form0] tr').toArray().slice(2,10).map(child).filter(function(x){ return x!={};});
  return data;
}

function takeRiepilogoGaranzie($) {
  function child(x) {
    var tds = $(x).children();
    var chbx = tds[0].firstChild;
    var data = {};

    data.Sel = chbx.checked;
    data.name = chbx.name;
    data.id = chbx.id;
    data.Garanzia = tds[1].innerText;
    data.Oggetto = tds[2].innerText;
    data.Premio = ncd(tds[3].innerText);
    data.Sconto = ncd(tds[4].firstElementChild.value);
    if(tds[5].firstElementChild)
      data.PremioLibero = ncd(tds[5].firstElementChild.value);

    return data;
  }

  var data = {};
  data.Tabella = $('form[name=form0] tr').toArray().slice(2,8).map(child);
  data.Totale = ncd($("td.labelB:contains('Totale')").next().text().trim());
  return data;
}

function takeElencoGaranzie($) {
  function takeFromInput(name) {return $('input[name='+name+']').val();}
  function child(x) {
    var tds = $(x).children();
    var chbx = tds[0].firstChild;
    var data = {};

    data.Sel = chbx.checked;
    data.name = chbx.name;
    data.id = chbx.id;
    data.Garanzia = tds[1].innerText;
    data.Oggetto = tds[2].innerText;

    return data;
  }

  var data = {};
  data.Tabella = $('form[name=form0] tr').toArray().slice(1,8).map(child);
  data.CodiceAutorizzazione = takeFromInput('PN03_NUMERO_AUTOR');
  return data;
}

function takeAttestatoDiRischio($) {
  function takeFromInput(name) {return $('input[name='+name+']').val();}
  var data = {};
  data.siglaTarga = takeFromInput('siglaTarga');
  data.numTarga = takeFromInput('numTarga');
  data.siglaTargaATR = takeFromInput('siglaTargaATR');
  data.numTargaATR = takeFromInput('numTargaATR');
  data.siglaTargaAnia = takeFromInput('siglaTargaAnia');
  data.numTargaAnia = takeFromInput('numTargaAnia');
  data.polRif = takeFromInput('polRif');
  return data;
}

function takeAttestatoDiRischioSummary($) {
  function takeFromSelect(name) {return $('select[name='+name+'] option:selected').text();}
  function takeTextNextTo(label) {
    return $("td.formleft:contains('"+label+"')").next().get(0).innerText;
  }
  function takeRow(label) {
    return $(label).toArray().map(function(x){
        var t = {};
        t[x.id] = x.value;
        return t;
    });
  }
  var data = {};
  data.compagniaProv = takeFromSelect('compagniaProv');
  data.Targa = takeTextNextTo('Targa');
  data.TipoEmissione = takeTextNextTo('Tipo Emissione');
  data.FormaTariffaria = takeTextNextTo('Forma tariffaria');
  data.ClasseProvenienzaCU = takeTextNextTo('Classe provenienza CU');
  data.ClasseAssegnazioneCU = takeTextNextTo('Classe assegn. CU');
  data.ClasseImpresa = takeTextNextTo('Classe Impresa');
  data.Pejus = takeTextNextTo('Pejus');
  data.NumSinistri12Mesi = takeTextNextTo('Numero sinistri 12 mesi');
  data.DataScadenzaContratto = takeTextNextTo('Data scadenza contratto');
  data.SinistriPagatiRespPrinc = takeRow('input[id^="sinPP"].input5');
  data.SinistriPagatiRespParit = takeRow('input[id^="sinPU"].input5');
  data.DettaglioSinistriPagati = takeRow('input[id^="dettPU"].input5');
  return data;
}

function takePremioNetto($) {
  return ncd($("td.labelB").last().text().substring(7).trim());
}

function takeProdottoAutovetture($) {
  function takeFromInput(name) {return $('input[name='+name+']').val();}
  function takeTextNextTo(label) {
    return $("td.formleft:contains('"+label+"')").next().get(0).innerText.trim();
  }
  var data = {};
  if($(".labelB").first().next().text().trim() === "ASSISTENZA AUTO GOLD") {
    data.Garanzia = "ASSISTENZA AUTO GOLD";
    data.Premio = takePremioNetto($);
    return data;
  }
  data.ClassificazioneVeicolo = takeTextNextTo('CLASSIFICAZIONE VEICOLO');
  data.Massimale = takeFromInput('dt_057');
  data.Eta = parseInt(takeTextNextTo('ETA'));
  data.CavalliFiscali = takeFromInput('dt_037');
  data.TipoCliente = takeTextNextTo('TIPO CLIENTE');
  data.ProvinciaTariffa = takeTextNextTo('PROVINCIA DI TARIFFA');
  data.CapIntestatarioPra = takeTextNextTo('CAP INTESTATARIO PRA');
  data.PotenzaKw = ncd(takeFromInput('dt_056'));
  data.Alimentazione = takeFromInput('dt_151');
  // apostrophs removed
  data.EtaVeicolo = parseInt(takeTextNextTo('DEL VEICOLO (IN MESI)'));
  data.ClasseImpresa = takeTextNextTo('CLASSE DI B/M DELL');
  data.ProprietarioContraente = takeFromInput('dt_981');
  data.Proprietario10Anni = takeFromInput('dt_382');
  data.TipologiaGuida = takeFromInput('dt_900');
  data.NumSinistriInAdr = takeTextNextTo('NUM. SINISTRI IN ADR');
  data.AnniConsecutivi = ncd(takeTextNextTo('ANNI CONSECUTIVI SENZA SX'));
  data.RinunciaRivalsa = takeFromInput('dt_945');
  data.PremioNetto = takePremioNetto($);

  return data;
}

function takeDatiContratto($) {
  function takeFromInput(name) {return $('input[name='+name+']').val();}
  function takeFromSelect(name) {return $('select[name='+name+'] option:selected').text();}
  function takeTextNextTo(label) {
    return $("td.formleft:contains('"+label+"')").next().get(0).innerText;
  }
  var data = {};
  data.Decorrenza = takeFromInput('dataDecor');
  data.Ora = parseInt(takeFromInput('oraDecor'));
  data.ScadenzaPolizza = takeFromInput('dataView1');
  data.Frazionamento = takeFromSelect('fraz')
  data.ScadenzaRata = takeFromSelect('scadRataC');
  data.DurataAnni = parseInt(takeFromInput('durataAnni'));
  data.DurataMesi = parseInt(takeFromInput('durataMesi'));
  data.DurataGiorni = parseInt(takeFromInput('durataGiorni'));
  data.CodiceIntermediario = takeFromInput('codSubagente');
  data.CodiceConvenzione = takeFromSelect('codConvenzione');
  data.CodiceAutorizzazione =  takeTextNextTo('Codice Autorizzazione');
   // formLeft
  data.PolizzaIndicizzata = $("td.formLeft:contains('Polizza indicizzata')").next().get(0).innerText;
  data.NuovoAttestato = takeTextNextTo('Nuovo Attestato');
  data.NumeroTessera = takeFromInput('numTessera');
  data.CodiceProduttore = takeFromInput('codProduttore');
  data.Vincolo = takeFromInput('vincolo');
  data.ScadenzaVincolo = takeFromInput('dataView3');
  data.PolizzaInAssicurazione = takeFromSelect('coassicurazione');
  data.CodiceAssegnazione = takeFromSelect('codAssegnazione');
  data.DataImmatricolazione = takeFromInput('dataView2');
  return data;
}

function isTextOnPage(str) {
  return (
    document.documentElement.textContent || document.documentElement.innerText
  ).indexOf(str) > -1
}


function getParameterByName(name, url = window.location.href) {
    name = name.replace(/[\[\]]/g, '\\$&');
    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

function takeDatiAnagrafici($) {
  var arr = $('tr > td.formleft, tr > td.label')
    .toArray()
    .map(function(x){ return x.innerText; });

  var data = {};
  data.DatiContraente = intoPairs(arr.slice(14));
  data.DatiProprietario = intoPairs(arr.slice(15, 28));
  return data;
}

function intoPairs(arr) {
  var groups = [];

  for(var i = 0; i < arr.length; i += 2) {
    groups.push(arr.slice(i, i + 2));
  }

  return groups.map(function(x){ var t = {}; t[x[0]] = x[1]; return t;});
}

// for floats with commas
function ncd(num) {
  if(num.trim() === "") {
    return 0;
  } else {
    return parseFloat(num.replace(".", "").replace(",", "."));
  }
}

function getSessionIdFromCookies() {
  return document.cookie
  .split('; ')
  .find(row => row.startsWith('JSESSIONID'))
  .split('=')[1];
}

function save(w) {
  var generalFields = Object.fromEntries(['User', 'SessionID', 'TimestampISO'].map(function(x){
    return [x, w.sessionStorage.getItem(x)];
  }));

  var pages = [
    'Elenco Garanzie',
    'Dati Anagrafici',
    'Questionario',
    'Dati Contratto',
    'Attestato di Rischio', 'Attestato di Rischio 2',
    'Riepilogo Garanzie',
    'Prodotto AUTOVETTURE', 'Prodotto AUTOVETTURE 2',
    'Prodotto AUTOVETTURE - Dati Integrativi',
    'Riepilogo'
  ].map(function(x, i){
    return Object.assign(JSON.parse(w.sessionStorage.getItem(paginaPrefix + x)), {"id": i});
  });

  return Object.assign(generalFields, {"pagine": pages});
}

function sendToServer(w) {
  var jsonObject = save(w);
  // $.post( url, jsonObject);
  console.log(jsonObject);
  w.sessionStorage.setItem('FullObject', JSON.stringify(jsonObject));
}

$(document).ready(function(){
  if(window.location.pathname === "/prodGrpList.do") {
    saveInitialPageInformation(window);
  }
  // adds listeners after each page loads
  savePageInformation(window, $, location.href);
});
