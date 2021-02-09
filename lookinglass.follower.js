// assume jQuery is loaded already
/*jslint es6 */
"use strict";

const paginaPrefix = "pagina - ";
const dataSource = "https://lookinglass-backend.herokuapp.com/";

function savePageInformation($) {
  // the page has to be identified by metro-title,
  // since the url doesn't always change
  var title = $('h2.metro-title').text().trim(); // must be var
  const timestamp = new Date();
  console.log("title: " + title);
  if(title == "Prodotto AUTOVETTURE") {
    // this works with the ( > ) button
    $("a.linkball").last().click(function(e) {
      const info = takeProdottoAutovetture($);
      const jsonObj = makePage(title, timestamp.toISOString(), info);
      if(window.sessionStorage.getItem(paginaPrefix + title) !== null) {
        title = title + " 2";
      }
      window.sessionStorage.setItem(paginaPrefix + title, JSON.stringify(jsonObj));
    });
  } else if(title === 'Riepilogo') {
    // ending action
    const info = takeRiepilogoGenerale($);
    const jsonObj = makePage(title, timestamp.toISOString(), info);
    window.sessionStorage.setItem(paginaPrefix + title, JSON.stringify(jsonObj));
    sendToServer();
  } else if(title === 'Riepilogo Garanzie') {
    // ending action
    const user = window.sessionStorage.getItem('User');
    $.get(dataSource + "user-profiles/?filter={%22where%22:{%22user%22:%22" + user + "%22}}", assignDiscounts);
  } else {
    // assuming all other submit buttons are called "Prosegui"
    $("a:contains('Prosegui')").click(function(e) {
      const info = takeSwitch(title, $);
      const jsonObj = makePage(title, timestamp.toISOString(), info);
      if(window.sessionStorage.getItem(paginaPrefix + title) !== null) {
        title = title + " 2";
      }
      window.sessionStorage.setItem(paginaPrefix + title, JSON.stringify(jsonObj));
    });
  }

}

// Functions with take- are each customed for one page

function makePage(title, time, info, param1) {
  const data = {};
  data.url = window.location.href;
  data.inizio = time;
  data.classePagina = window.location.pathname.substring(1);
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
      console.error("Some Unknown page!");
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
  const data = Object.assign(generale, rate);
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
        }).filter(function(x){ return x.id != "";});
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
    const tds = $(x).children();
    const chbx = tds[0].firstChild;
    const data = {};

    data.Sel = chbx.checked;
    data.name = chbx.name;
    data.id = chbx.id;
    data.Garanzia = tds[1].innerText;
    data.Oggetto = tds[2].innerText;
    data.Premio = ncd(tds[3].innerText);
    data.Sconto = ncd(tds[4].firstElementChild.value);
    if(tds[5].firstElementChild) {
      data.PremioLibero = ncd(tds[5].firstElementChild.value);
    }

    return data;
  }

  const data = {};
  data.Tabella = $('form[name=form0] tr').toArray().slice(2,8).map(child);
  data.Totale = ncd($("td.labelB:contains('Totale')").next().text().trim());
  return data;
}

function takeElencoGaranzie($) {
  function takeFromInput(name) {return $('input[name='+name+']').val();}
  function child(x) {
    const tds = $(x).children();
    const chbx = tds[0].firstChild;
    const data = {};

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
  const data = {};
  if($(".labelB").first().next().text().trim() === "ASSISTENZA AUTO GOLD") {
    data.Garanzia = "ASSISTENZA AUTO GOLD";
    data.Premio = takePremioNetto($);
    return data;
  }
  data.ClassificazioneVeicolo = takeTextNextTo('CLASSIFICAZIONE VEICOLO');
  data.Massimale = $('select[name=dt_057] option:selected').text();
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
  const data = {};
  data.Decorrenza = takeFromInput('dataDecor');
  data.Ora = parseInt(takeFromInput('oraDecor'));
  data.ScadenzaPolizza = takeFromInput('dataView1');
  data.Frazionamento = takeFromSelect('fraz');
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
  return ((
    document.documentElement.textContent || document.documentElement.innerText
  ).indexOf(str)) > -1;
}

function getParameterByName(name, url = window.location.href) {
    name = name.replace(/[\[\]]/g, '\\$&');
    const regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)');
    const results = regex.exec(url);
    if (!results) {return null; }
    if (!results[2]){ return ''; }
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

function takeDatiAnagrafici($) {
  var arr = $('tr > td.formleft, tr > td.label')
    .toArray()
    .map(function(x){ return x.innerText; });

  const data = {};
  data.DatiContraente = intoPairs(arr.slice(14));
  data.DatiProprietario = intoPairsInvert(arr.slice(15, 28));
  return data;
}

function intoPairs(arr) {
  var groups = [];
  for(var i = 0; i < arr.length; i += 2) {
    groups.push(arr.slice(i, i + 2));
  }

  return groups.map(function(x){
    var t = {};
    t[x[0]] = x[1];
    return t;
  });
}

function intoPairsInvert(arr) {
  var groups = [];

  for(var i = 0; i < arr.length; i += 2) {
    groups.push(arr.slice(i, i + 2));
  }

  return groups.map(function(x){ var t = {}; t[x[1]] = x[0]; return t;});
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

function getJsonFromSessionStorage(name) {
  return JSON.parse(window.sessionStorage.getItem(name));
}

function save() {
  var generalFields = Object.fromEntries(['User', 'SessionID', 'TimestampISO'].map(function(x){
    return [x, window.sessionStorage.getItem(x)];
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
    return Object.assign(getJsonFromSessionStorage(paginaPrefix + x), {"id": i});
  });

  return Object.assign(generalFields, {"pagine": pages});
}

function sendToServer() {
  var jsonObject = save();
  // $.post(url, jsonObject);
  console.log(jsonObject);
  // window.sessionStorage.setItem('FullObject', JSON.stringify(jsonObject));
}

  function checkCU(sinistri) {
    return sinistri[4] <= cuPermessi[0]
    && sinistri[3] <= cuPermessi[1]
    && sinistri[2] <= cuPermessi[2]
    && sinistri[1] <= cuPermessi[3]
    && sinistri[0] <= cuPermessi[4];
  }

  function getSconto(codGaranzia) {
    const sconto = jsonObject.arrSconti.find(function(x) {
      return x.garanzia === codGaranzia;
    });
    if(sconto == -1)
      return [0,0];
    else
      return [sconto.scontoMax, sconto.scontoMin];
  }
// json function
function assignDiscounts(data) {
  const jsonObject = data[0];
  console.log(jsonObject);
  // disable all inputs
  $('.input5').prop('disabled', true);

  // retrieves user info from the SessionStorage
  const datiAnagrafici    = getJsonFromSessionStorage(paginaPrefix + 'Dati Anagrafici');
  const prodAutovetture   = getJsonFromSessionStorage(paginaPrefix + 'Prodotto AUTOVETTURE');
  const attestatoRischio  = getJsonFromSessionStorage(paginaPrefix + 'Attestato di Rischio 2');
  const elencoGaranzie    = getJsonFromSessionStorage(paginaPrefix + 'Elenco Garanzie').form.Tabella;

  const provincia = datiAnagrafici.form.DatiContraente[6].Provincia;
  const etaContraente = prodAutovetture.form.Eta;
  const etaVeicolo = prodAutovetture.form.EtaVeicolo;
  const chosenProdottoVendibile = 'S1';
  // slice(0,-1) because the last one has letters
  const sinistri1 = attestatoRischio.form.SinistriPagatiRespParit.slice(0, -1).map(function(x){ return parseInt(Object.values(x)[0]);})
  const sinistriTotale = attestatoRischio.form.SinistriPagatiRespPrinc.slice(0, -1).map(function(x, i){ return parseInt(Object.values(x)[0]) + sinistri1[i];})

  const siglePermesse = jsonObject
    .arrProvince
    .filter(function(x){ return x.sconto; })
    .map(function(x){ return x.prov; });
  siglePermesse.push('RM');

  const garanzieVendibili = jsonObject.arrProdottiVendibili.find(function(x){ return x.prodotto === chosenProdottoVendibile;});

  const cuPermessi = jsonObject.arrCU;
  const etaVeicoloMassimaPermessa = jsonObject.etaMaxVeicolo;
  const etaMassimaPermessa = jsonObject.etaMaxContraente;

  $.ajax({
    dataType: "json",
    url: "https://lookinglass-backend.herokuapp.com/codici-garanzie.json",
    data: data,
    success: function(data){
    console.log(data);
    const fields = Object.fromEntries(data.map(function(x){
      return [x["codice_web"], x["codice"]];
    }));
    debugger;
    // checking if conditions are respected
    if(($.inArray(provincia, siglePermesse) !== -1)
      && (etaContraente <= etaMassimaPermessa)
      && (etaVeicolo <= etaVeicoloMassimaPermessa)
      && checkCU(sinistriTotale) // to implement
    ) {
      activateDiscounts(elencoGaranzie, garanzieVendibili, sconti, fields);
    }
  }});
}

function checkMinMax() {
  const max = parseInt($(this).attr('max'));
  const min = parseInt($(this).attr('min'));
  if ($(this).val() > max)
    $(this).val(max);
  else if ($(this).val() < min)
    $(this).val(min);
}


function activateDiscounts(elencoGaranzie, garanzieVendibili, sconti, fields) {
  elencoGaranzie.forEach(function(item, i) {
    const codGaranzia = fields[item.name];
    if(item.Sel && ($.inArray(codGaranzia, garanzieVendibili) !== -1)) {
      const sconti = getSconto(codGaranzia);
      $('input[name='+webname+']')
      .prop("disabled", false)
      .val("0.00")
      .attr("type", "number")
      .attr("min", sconti[1])
      .attr("max", sconti[0])
      .attr("placeholder", '0.00')
      .attr("step", "0.5")
      .change(checkMinMax);
    }
  });
}

function saveInitialPageInformation() {
  window.sessionStorage.clear();
  window.sessionStorage.setItem('User', window.localStorage.getItem('lookinglassUserID'));
  window.sessionStorage.setItem('SessionID', getSessionIdFromCookies());
  window.sessionStorage.setItem('TimestampISO', (new Date()).toISOString());
}

$(document).ready(function(){
  if(window.location.pathname === "/prodGrpList.do") {
    saveInitialPageInformation();
  }
  // adds listeners after each page loads
  savePageInformation($);
});
