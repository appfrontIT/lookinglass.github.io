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
 */

function savePageInformation(url) {
  // the page has to be identified by metro-title,
  // since the url doesn't always change

  // these vars are actually inside
  // SessionStorage
  var loadingTimestamp = ""
  var clickedStuff = []:
  var checkboxesSelected = []:
  var datiAnagrafici = [];
  var datiContratto = {};

  $(document).load(function(_e){
    loadingTimestamp = Date.now();
  });

  $(document).click(function(e) {
    clickedStuff.push($(e.target).html());
  });

  // assuming all submit buttons are called "Prosegui"
  $("a:contains('Prosegui')").click(function(e) {
    datiAnagrafici = intoPairs(allFormFieldsText());
    datiContratto = takeDatiContratto();
    checkboxesSelected = $('input[type=checkbox]:checked').toArray();
  });

}

function takeDatiContratto() {
  function takeFromInput(name) {$('input[name='+name+']').val();}
  function takeFromSelect(name) {$('select[name='+name+'] option:selected').text();}
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


function allFormFieldsText() {
  return $('tr > td.formleft, tr > td.label').toArray().map(function(x){ return x.innerText; });
}

function allCheckedBoxes() {
  // TODO take text, not object
  return $('input[type=checkbox]:checked').toArray();
}

function intoPairs(arr) {
  var groups = [];

  for(var i = 0; i < arr.length; i += 2) {
    groups.push(arr.slice(i, i + 2));
  }

  return groups;
}
