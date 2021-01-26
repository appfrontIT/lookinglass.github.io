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
  w.sessionStorage.setItem('User', w.localStorage.getItem('lookinglassUserID'));
  w.sessionStorage.setItem('SessionID', getSessionIdFromCookies());
  w.sessionStorage.setItem('TimestampISO', (new Date()).toISOString());
}

function savePageInformation(w, $, url) {
  // the page has to be identified by metro-title,
  // since the url doesn't always change
  var title = $('h2.metro-title').text();
  var timestamp = new Date();

  // assuming all submit buttons are called "Prosegui"
  $("a:contains('Prosegui')").click(function(e) {
    var info = takeSwitch(title, $);
    var jsonObj = makePage(w, title, timestamp.toISOString(), info);
    w.sessionStorage.setItem("pag" + pageNumber(w), JSON.stringify(jsonObj));
  });
}
function pageNumber(w) {
  return w.sessionStorage.length - 3 + 1
}
function makePage(w, title, time, info, param1) {
  var data = {};
  data.url = w.location.href;
  data.inizio = time;
  data.classePagina = w.location.pathname.substring(1);
  data.sottoClassePagina = title;
  if(data.classePagina === "garanzieList.do") {
    data.codprod = getParameterByName('codprod');
  }
  if(data.classePagina === "prodList.do") {
    data.codgruppo = getParameterByName('codgruppo');
  }
  data.form = info;
  return data;
}

function takeSwitch(title, $) {
  switch(title) {
    case 'Elenco Garanzie':
      return takeElencoGaranzie($);
    case 'Dati Anagrafici':
      return Object.fromEntries(intoPairs(allFormFieldsText($)));
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
    case 'Prodotto AUTOVETTURE':
      if($("td:contains('GARANZIA PRESTATA')").length == 0) {
        return takeProdottoAutovetture($);
      } else
        return {};
    default:
      return {};
  }
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
          };
        }).filter(function(x){ return x.id != ""});
    }
    return data;
  }

  var data = {};
  var trs = $('form[name=form0] tr').toArray();
  data.title = trs[1].firstChild.innerText;
  data.Tabella = $('form[name=form0] tr').toArray().slice(2,10).map(child);
  data.CodiceAutorizzazione = takeFromInput('PN03_NUMERO_AUTOR');
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
  var data = {};
  data.compagniaProv = takeFromSelect('compagniaProv');
  var tmp = {};
  $('input.input5').toArray().forEach(function(x){
    if(x.value!="")
      tmp[x.name] = x.value;
  });
  data.input5 = tmp;
  return data;
}

function takeProdottoAutovetture($) {
  function takeFromInput(name) {return $('input[name='+name+']').val();}
  function takeFromSelect(name) {return $('select[name='+name+'] option:selected').text();}
  var data = {};
  data.Massimale = takeFromInput('dt_057');
  data.CavalliFiscali = takeFromInput('dt_037');
  data.PotenzaKw = takeFromInput('dt_056');
  data.Alimentazione = takeFromInput('dt_151');
  data.ProprietarioContraente = takeFromInput('dt_981');
  data.Proprietario10Anni = takeFromInput('dt_382');
  data.TipologiaGuida = takeFromInput('dt_900');
  data.RinunciaRivalsa = takeFromInput('dt_945');
}

function takeDatiContratto($) {
  function takeFromInput(name) {return $('input[name='+name+']').val();}
  function takeFromSelect(name) {return $('select[name='+name+'] option:selected').text();}
  var data = {};
  data.Decorrenza = takeFromInput('dataDecor');
  data.Ora = takeFromInput('oraDecor');
  data.ScadenzaPolizza = takeFromInput('dataView1');
  data.Frazionamento = takeFromSelect('fraz')
  data.ScadenzaRata = takeFromSelect('scadRataC');
  data.DurataAnni = takeFromInput('durataAnni');
  data.DurataMesi = takeFromInput('durataMesi');
  data.DurataGiorni = takeFromInput('durataGiorni');
  data.CodiceIntermediario = takeFromInput('codSubagente');
  data.CodiceConvenzione = takeFromSelect('codConvenzione');
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

function allFormFieldsText($) {
  return $('tr > td.formleft, tr > td.label')
    .toArray()
    .map(function(x){ return x.innerText; });
}

function intoPairs(arr) {
  var groups = [];

  for(var i = 0; i < arr.length; i += 2) {
    groups.push(arr.slice(i, i + 2));
  }

  return groups;
}

function getSessionIdFromCookies() {
  return document.cookie
  .split('; ')
  .find(row => row.startsWith('JSESSIONID'))
  .split('=')[1];
}

$(document).ready(function(){
  if(window.location.pathname === "/prodGrpList.do") {
    saveInitialPageInformation(window);
  }
  // adds listeners after each page loads
  savePageInformation(window, $, location.href);
});
