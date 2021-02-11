/*jslint es6 */
/*jslint white: true */
/*jslint browser */
/*global window, console, $ */ // jQuery is already loaded

// ##############################
// ########### UTILS ############
// ##############################

// PARAMS
const paginaPrefix = "pagina - ";
const dataSource = "https://lookinglass-backend.herokuapp.com/";

function checkMinMax(event) {
  const $that = $(event.target);
  const max = parseInt($that.attr('max'));
  const min = parseInt($that.attr('min'));
  if ($that.val() > max) {
    $that.val(max);
  }
  else if ($that.val() < min) {
    $that.val(min);
  }
}
// gets parameters from the url
function getParameterByName(name, url = window.location.href) {
    name = name.replace(/[\[\]]/g, '\\$&');
    const regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)');
    const results = regex.exec(url);
    if (!results) {return null; }
    if (!results[2]){ return ''; }
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

// for floats with commas
function ncd(num) {
  if(num.trim() === "") {
    return 0;
  } else {
    return parseFloat(num.replace(".", "").replace(",", "."));
  }
}

function intoPairs(arr, invert = false) {
  return arr.reduce(function(result, ignore, index, array) {
    if (index % 2 === 0) {
      result.push(array.slice(index, index + 2));
    }
    return result;
  }, []).map(function(x){
    const t = {};
    if(invert) { t[x[1]] = x[0]; } else { t[x[0]] = x[1]; }
    return t;
  });
}

function isTextOnPage(str) {
  const ddEl = document.documentElement;
  const textContent = ddEl.textContent || ddEl.innerText;
  return textContent.indexOf(str) > -1;
}

function getSessionIdFromCookies() {
  return document.cookie
  .split('; ')
  .find(function(row){return row.startsWith('JSESSIONID');})
  .split('=')[1];
}

// ##############################
// ######## END UTILS ###########
// ##############################

function takeFromInput(name) {
  return $('input[name=' + name + ']').val();
}
function takeFromSelect(name) {
  return $('select[name=' + name + '] option:selected').text();
}
function takeTextNextTo(name) {
  return $("td.formleft:contains('" + name + "')").next().get(0).innerText.trim();
}


// ################################################
// ## FUNCTIONS SPECIFIC TO AUTOVETTURE PROCESS ###
// ################################################

function makePage(title, time, info) {
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

function takeRiepilogoGenerale() {
  const generale = Object.fromEntries(
    $('td.formLeft').map(function(ignore,x){
      const j = {};
      j[$(x).text().slice(0,-1)] = $(x).next().text();
      return j;
    })
    .toArray()
  );

  const rate = Object.fromEntries(
    $('td.formleft').toArray().slice(1,8).map(function(x){
      const sibs = $(x).siblings();
      const pair = [ncd(sibs[0].innerText), ncd(sibs[1].innerText)];
      return [$(x).text().replace(/\./g, ''), pair];
    })
  );
  const data = Object.assign(generale, rate);
  data.Frazionamento = $('select[name=fraz] option:selected').text();
  data.ScadenzaRata = $("td.formleft:contains('Scadenza Rata')").next().get(0).innerText;
  return data;
}

function takeDatiIntegrativi() {
  const data = {};
  data.DescrizioneVeicolo = $('input[name=dt_009]').val();
  data.TargaVeicolo = takeTextNextTo('TARGA VEICOLO');
  data.PotenzaKw = parseInt(takeTextNextTo('POTENZA KW (P.2)'));
  data.CodiceFiscale = takeTextNextTo('COD.FISCALE INT. PRA');
  data.Nominativo = takeTextNextTo('NOMINATIVO');
  data.ComuneIntPra = takeTextNextTo('COMUNE');
  data.ProvinciaIntPra = takeTextNextTo('PROVINCIA');
  return data;
}

function takeQuestionario() {
  function child(x, idx) {
    const data = {};
    const tds = $(x).children();
    if(idx % 2===0) {
      data.label = tds[0].innerText;
      data.checkboxes = $(tds[1])
        .children()
        .toArray()
        .map(function(x){
          return {"id": x.id, "name": x.name,
            "value": x.value, "checked": x.checked
        };
      }).filter(function(x){ return x.id !== "";});
    }
    return data;
  }

  const tab = $('form[name=form0] tr')
    .toArray()
    .slice(2,10)
    .map(child).filter(function(x){
      return !$.isEmptyObject(x);
    });

  return {
    Tabella: tab
  };
}

function parsePremioNetto() {
  return ncd($("td.labelB").last().text().substring(7).trim());
}

function takeDatiAnagrafici() {
  const fields = $('tr > td.formleft, tr > td.label')
    .toArray()
    .map(function(x){ return x.innerText; });

  const data = {};
  data.DatiContraente = intoPairs(fields.slice(14));
  data.DatiProprietario = intoPairs(fields.slice(15, 28), true);
  return data;
}

function takeRiepilogoGaranzie() {
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

function takeElencoGaranzie() {
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

  const data = {};
  data.Tabella = $('form[name=form0] tr').toArray().slice(1,8).map(child);
  data.CodiceAutorizzazione = takeFromInput('PN03_NUMERO_AUTOR');
  return data;
}

function takeAttestatoDiRischio() {
  const data = {};
  data.siglaTarga = takeFromInput('siglaTarga');
  data.numTarga = takeFromInput('numTarga');
  data.siglaTargaATR = takeFromInput('siglaTargaATR');
  data.numTargaATR = takeFromInput('numTargaATR');
  data.siglaTargaAnia = takeFromInput('siglaTargaAnia');
  data.numTargaAnia = takeFromInput('numTargaAnia');
  data.polRif = takeFromInput('polRif');
  return data;
}

function takeAttestatoDiRischioSummary() {
  function takeRow(label) {
    return $(label).toArray().map(function(x){
        const t = {};
        t[x.id] = x.value;
        return t;
    });
  }

  const data = {};
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


function takeProdottoAutovetture() {
  const data = {};
  const nameOfGaranzia = $(".labelB").first().next().text().trim();
  if(nameOfGaranzia === "ASSISTENZA AUTO GOLD") {
    data.Garanzia = "ASSISTENZA AUTO GOLD";
    data.Premio = parsePremioNetto();
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
  data.PremioNetto = parsePremioNetto();

  return data;
}

function takeDatiContratto() {
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

function getPageFromStorage(name) {
  return JSON.parse(window.sessionStorage.getItem(paginaPrefix + name));
}

function groupFullObjectsAsJson() {
  const generalFields = {
    "user": window.sessionStorage.getItem('User'),
    "session_id": window.sessionStorage.getItem('SessionID'),
    "timestamp_iso": window.sessionStorage.getItem('TimestampISO')
  };

  const autovetturePagine = [
    'Elenco Garanzie',
    'Dati Anagrafici',
    'Questionario',
    'Dati Contratto',
    'Attestato di Rischio', 'Attestato di Rischio 2',
    'Riepilogo Garanzie',
    'Prodotto AUTOVETTURE', 'Prodotto AUTOVETTURE 2',
    'Prodotto AUTOVETTURE - Dati Integrativi',
    'Riepilogo'
  ];

  const pages = autovetturePagine.map(function(x, i){
    const retrievedJson = getPageFromStorage(x);
    if(retrievedJson) {
      return Object.assign(retrievedJson, {"id": i});
    }
  }).filter(function(x){
    return x !== null;
  });

  return JSON.stringify(Object.assign(generalFields, {"pagine": pages}));
}

function sendToServer() {
  $.ajax({ // Content-Type necessary
    type: "POST",
    contentType: 'application/json',
    dataType: "json",
    url: dataSource + "navigation-actions",
    data: groupFullObjectsAsJson(),
    success: function(data){
      console.log(data);
    },
    error: function(qXHR, status, errorThrown) {
      console.log(qXHR, status, errorThrown);
      window.alert("Error on sending the session");
    }
  });
}

function checkCU(sinistri, cuPermessi) {
  return sinistri[4] <= cuPermessi[0]
  && sinistri[3] <= cuPermessi[1]
  && sinistri[2] <= cuPermessi[2]
  && sinistri[1] <= cuPermessi[3]
  && sinistri[0] <= cuPermessi[4];
}

function activateDiscounts(elencoGaranzie, garanzieVendibili, getSconto, fields) {
  elencoGaranzie.forEach(function(item) {
    const codGaranzia = fields[item.name];
    if(item.Sel && ($.inArray(codGaranzia, garanzieVendibili) !== -1)) {
      const sconti = getSconto(codGaranzia);
      $('input[name='+item.name.replace("chk", "sc")+']')
      .prop("disabled", false)
      .val("0.00")
      .attr({
        type: 'range',
        min: sconti[1],
        max: sconti[0],
        step: 0.5
      })
      .change(checkMinMax);
    }
  });
}

// json function
function assignDiscounts(jsonObject) {
  console.log(jsonObject);
  // disable all inputs first
  $('.input5').prop('disabled', true);

  // retrieves user info from the SessionStorage
  const datiAnagrafici   = getPageFromStorage('Dati Anagrafici');
  const prodAutovetture  = getPageFromStorage('Prodotto AUTOVETTURE');
  const attestatoRischio = getPageFromStorage('Attestato di Rischio 2');
  const elencoGaranzie   = getPageFromStorage('Elenco Garanzie').form.Tabella;
  const chosenProdottoVendibile = window.sessionStorage.getItem("CodiceProdotto");
  const provincia = datiAnagrafici.form.DatiContraente[6].Provincia;
  const etaContraente = prodAutovetture.form.Eta;
  const etaVeicolo = prodAutovetture.form.EtaVeicolo;
  // slice(0,-1) because the last one has letters
  const sinistri1 = attestatoRischio.form.SinistriPagatiRespParit.slice(0, -1).map(function(x){ return parseInt(Object.values(x)[0]);});
  const sinistriTotale = attestatoRischio.form.SinistriPagatiRespPrinc.slice(0, -1).map(function(x, i){ return parseInt(Object.values(x)[0]) + sinistri1[i];});

  const siglePermesse = jsonObject
    .arrProvince
    .filter(function(x){ return x.sconto; })
    .map(function(x){ return x.prov; });

  siglePermesse.push('RM');

  const garanzieVendibili = jsonObject
    .arrProdottiVendibili
    .find(function(x){ return x.prodotto === chosenProdottoVendibile;})
    .arrGaranzie;

  const cuPermessi = jsonObject.arrCU;
  const etaVeicoloMassimaPermessa = jsonObject.etaMaxVeicolo;
  const etaMassimaPermessa = jsonObject.etaMaxContraente;

  function getSconto(codGaranzia) {
    const sconto = jsonObject.arrSconti.find(function(x) {
      return x.garanzia === codGaranzia;
    });
    if(sconto === -1) {
      return [0,0];
    }
    else {
      return [sconto.scontoMax, sconto.scontoMin];
    }
  }

  const codiciGaranzie = JSON.parse(window.sessionStorage.getItem("CodiciGaranzie"));
  const fields = Object.fromEntries(
    codiciGaranzie.map(function(x){
      return [x.codice_web, x.codice];
    })
  );
  // checking if conditions are respected
  if(($.inArray(provincia, siglePermesse) !== -1)
    && (etaContraente <= etaMassimaPermessa)
    && (etaVeicolo <= etaVeicoloMassimaPermessa)
    && checkCU(sinistriTotale, cuPermessi) // to implement
  ) {
    activateDiscounts(elencoGaranzie, garanzieVendibili, getSconto, fields);
  }
}

function whichAutovetturePage(title) {
  switch(title) {
    case 'Elenco Garanzie':
      return takeElencoGaranzie();
    case 'Dati Anagrafici':
      return takeDatiAnagrafici();
    case 'Questionario':
      return takeQuestionario();
    case 'Dati Contratto':
      return takeDatiContratto();
    case 'Attestato di Rischio':
      if(isTextOnPage('Polizza di riferimento Dallbogg')){
        return takeAttestatoDiRischio();
      } else {
        return takeAttestatoDiRischioSummary();
      }
    case 'Riepilogo Garanzie':
      return takeRiepilogoGaranzie();
    case 'Prodotto AUTOVETTURE - Dati Integrativi':
      return takeDatiIntegrativi();
    default:
      console.error("Wrong page title");
      return {};
  }
}

function getUserProfile() {
  return JSON.parse(window.sessionStorage.getItem('UserProfile'));
}

function setStorageKey(key, val) {
  window.sessionStorage.setItem(key, val);
}

function selectGaranzie(dataProdotti, dataGaranzie) {
  const profile = getUserProfile();
  const codprod = getParameterByName("codprod");
  const scod = dataProdotti.find(function(x){ return x.codice_web === codprod; });
  if(scod !== undefined) {
    setStorageKey("CodiceProdotto", scod.codice);
    const garanzieVendibili = profile.arrProdottiVendibili.find(function(x){ return x.prodotto === scod.codice;});
    if(garanzieVendibili !== undefined) {
      dataGaranzie.forEach(function(x){
        if($.inArray(x.codice, garanzieVendibili.arrGaranzie) === -1) {
          const $input = $("input[name="+x.codice_web+"]").get(0);
          if($input !== undefined) {
            $input.disabled = "disabled";
          }
        }
      });
    }
  }
}
// ending action
function endSessionTaking(title, ts) {
  const infoGeneral = takeRiepilogoGenerale();
  const jsonObject = makePage(title, ts.toISOString(), infoGeneral);
  setStorageKey(paginaPrefix + title, JSON.stringify(jsonObject));
  sendToServer();
}

function getProdottiVendibiliIndices() {
  return getUserProfile()
    .arrProdottiVendibili
    .map(function(x){ return parseInt(x.prodotto.substring(1))-1;});
}

function saveInitialPageInformation() {
  window.sessionStorage.clear();
  const user = window.localStorage.getItem('lookinglassUserID');
  setStorageKey('User', user);
  setStorageKey('SessionID', getSessionIdFromCookies());
  setStorageKey('TimestampISO', (new Date()).toISOString());

  $.get(dataSource + "user-profiles/?filter={%22where%22:{%22user%22:%22" + user + "%22}}", function(data){
    setStorageKey('UserProfile', JSON.stringify(data[0]));
  });
}

function selectProdottiVendibili() {
  const idxs = getProdottiVendibiliIndices();
  $("a.link").toArray().forEach(function(item, idx){
    if($.inArray(idx, idxs) === -1) {
      $(item).removeAttr("href").attr('disabled', 'disabled').css("background", "grey");
    }
  });
}

$(document).ready(function(){
  // adds listeners after each page loads
  // the page has to be identified by metro-title,
  // since the url doesn't always change
  var title = $('h2.metro-title').text().trim(); // must be var
  const timestamp = new Date();
  console.log("title: " + title);

  switch(title) {
  case "Prodotto AUTOVETTURE":
    // this works with the ( > ) button
    $("a.linkball").last().click(function() {
      const info = takeProdottoAutovetture();
      const jsonObj = makePage(title, timestamp.toISOString(), info);
      if(window.sessionStorage.getItem(paginaPrefix + title) !== null) {
        title = title + " 2";
      }
      setStorageKey(paginaPrefix + title, JSON.stringify(jsonObj));
    });
    break;
  case 'Gruppi Prodotto':
    saveInitialPageInformation();

    $("td.alternate").click(function(ev){
      if(getUserProfile() === null){
        ev.preventDefault();
        window.alert("still downloading UserProfile");
      }
    });
    break;
  case 'Elenco Prodotti':
    selectProdottiVendibili();
    break;
  case 'Riepilogo':
    endSessionTaking(title, timestamp);
    break;
  case 'Riepilogo Garanzie':
    assignDiscounts(JSON.parse(window.sessionStorage.getItem('UserProfile')));
    break;
  default:
    if(title === 'Elenco Garanzie') {
      $.get(dataSource + "codici-prodotti.json", function(dataProdotti){
        $.get(dataSource + "codici-garanzie.json", function(dataGaranzie){
          setStorageKey("CodiciGaranzie", JSON.stringify(dataGaranzie));
          selectGaranzie(dataProdotti, dataGaranzie);
        });
      });
    }
    // assuming all other submit buttons are called "Prosegui"
    $("a:contains('Prosegui')").click(function() {
      const info = whichAutovetturePage(title, $);
      const jsonObj = makePage(title, timestamp.toISOString(), info);
      if(window.sessionStorage.getItem(paginaPrefix + title) !== null) {
        title = title + " 2";
      }
      setStorageKey(paginaPrefix + title, JSON.stringify(jsonObj));
    });
  }
});
