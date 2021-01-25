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

function savePageInformation(w, $, url) {
  // the page has to be identified by metro-title,
  // since the url doesn't always change
  var ctx = w.document;
  var title = $('h2.metro-title').text();

  w.sessionStorage.setItem('timestamp_'+ title, Date.now());
  var clickedStuff = [];

  $(ctx).click(function(e) {
    clickedStuff.push($(e.target).text());
  });

  // assuming all submit buttons are called "Prosegui"
  $("a:contains('Prosegui')", w.document).click(function(e) {
    var info = takeSwitch(title, $);
    console.log(info);
    alert("info");
    w.sessionStorage.setItem(title+'-information', JSON.stringify(info));
  });
}

function takeSwitch(title, $) {
  console.log(title);
  switch(title) {
    case 'Elenco Garanzie':
      return intoPairs(allCheckedBoxes($));
    case 'Dati Anagrafici':
      return intoPairs(allFormFieldsText($));
    case 'Questionario':
      return ["not implemented"];
    case 'Dati Contratto':
      return takeDatiContratto($);
    case 'Attestato di rischio':
      if(url.includes('attestatoRischioFr.do')){
        return takeAttestatoDiRischioSummary($);
      } else {
        return takeAttestatoDiRischio($);
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

function takeAttestatoDiRischio(jQuery) {
  function takeFromInput(name) {jQuery('input[name='+name+']').val();}
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

function takeAttestatoDiRischioSummary(jQuery) {
  function takeFromSelect(name) {jQuery('select[name='+name+'] option:selected').text();}
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

function takeProdottoAutovetture(jQuery) {
  function takeFromInput(name) {jQuery('input[name='+name+']').val();}
  function takeFromSelect(name) {jQuery('select[name='+name+'] option:selected').text();}
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

function takeDatiContratto(jQuery) {
  function takeFromInput(name) {jQuery('input[name='+name+']').val();}
  function takeFromSelect(name) {jQuery('select[name='+name+'] option:selected').text();}
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


function allFormFieldsText(jQuery) {
  return jQuery('tr > td.formleft, tr > td.label')
    .toArray()
    .map(function(x){ return x.innerText; });
}

function allCheckedBoxes(jQuery) {
  return jQuery('.formleft > input[type=checkbox]:checked')
    .parent().siblings().toArray()
    .map(function(x){ return x.innerText; })
}

function intoPairs(arr) {
  var groups = [];

  for(var i = 0; i < arr.length; i += 2) {
    groups.push(arr.slice(i, i + 2));
  }

  return groups;
}

savePageInformation(window, $, location.href);
