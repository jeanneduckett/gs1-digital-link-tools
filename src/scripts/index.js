const MAX_LENGTH = 48;
const DEFAULT_GTIN_VALUE = '9780345418913';
const QR_SIZE = 200;
const QR_TIMEOUT = 500;
const DOMAINS = {
  TN_GG: { value: 'tngg', label: 'tn.gg (EVRYTHNG)', url: 'tn.gg' },
  ID_GS1: { value: 'idgs1org', label: 'id.gs1.org (Canonical)', url: 'id.gs1.org' },
  CUSTOM: { value: 'custom', label: 'Custom domain...', url: 'domain.example.org' },
};

let digitalLink, qrFetchTimeout;

const get = id => document.getElementById(id);

const setVisible = (id, state) => get(id).style.display = state ? 'block' : 'none';

const getInputIdFromGS1AI = ai => `input_gs1_attribute_${ai}`;

const maxLength = str => (str.length < MAX_LENGTH) ? str : `${str.substring(0, MAX_LENGTH - 2)}...`;

const addRowToTable = (table, item) => {
  const { label, ai } = item;
  const row = table.insertRow(table.rows.length);
  const labelCell = row.insertCell(0);
  labelCell.innerHTML = `<span class="overflow">${maxLength(label)}</span><span class="italic light-grey"> (${ai})</span>`;
  const valueCell = row.insertCell(1);
  valueCell.innerHTML = `<input id="${getInputIdFromGS1AI(ai)}" type="text" class="form-control ml-2">`;

  // Listen for value input
  const rowInput = get(getInputIdFromGS1AI(item.ai));
  rowInput.oninput = () => {
    item.value = rowInput.value;
  };

  // Start hidden and save a reference to table row and value container
  row.style.display = 'none';
  item.row = row;
};

const setRowVisible = (row, state) => {
  row.style.display = state ? 'block' : 'none';
};

const searchAiList = (query) => {
  if (!query) return [];

  return AI_LIST.filter(item => item.label.toLowerCase().includes(query) || item.ai === query);
};

const downloadFromQrServer = () => {
  const url = `http://api.qrserver.com/v1/create-qr-code?data=${digitalLink}&size=${QR_SIZE}x${QR_SIZE}&format=png`;
  get('img_qr_code').src = url;
};

const updateQrCode = () => {
  // Don't request for every keystroke
  if (qrFetchTimeout) clearTimeout(qrFetchTimeout);

  qrFetchTimeout = setTimeout(() => {
    qrFetchTimeout = null;

    downloadFromQrServer();  
  }, QR_TIMEOUT);
};

const updateDigitalLink = () => {
  // Domain
  const domainKey = Object.keys(DOMAINS)
    .find(item => DOMAINS[item].value === get('select_domain').value);
  const domain = DOMAINS[domainKey];
  
  // Identifier
  const identifier = ID_LIST.find(item => item.ai === get('select_identifier').value);
  const identifierValue = get('input_identifier_value').value;
  digitalLink = `https://${domain.url}/${identifier.ai}/${identifierValue}`;

  // Key qualifiers
  const inputCPV = get('input_cpv');
  if (inputCPV.value) digitalLink += `/22/${inputCPV.value}`;
  const inputBatchOrLot = get('input_batch_lot');
  if (inputBatchOrLot.value) digitalLink += `/10/${inputBatchOrLot.value}`;
  const inputSerialNumber = get('input_serial_number');
  if (inputSerialNumber.value) digitalLink += `/21/${inputSerialNumber.value}`;

  // Update UI
  get('span_digital_link').innerHTML = digitalLink;
  updateQrCode();
};

const setupUI = () => {
  // Domain
  const selectDomain = get('select_domain');
  selectDomain.value = DOMAINS.ID_GS1.value;
  selectDomain.onchange = () => {
    setVisible('div_domain_wrapper', selectDomain.value === DOMAINS.CUSTOM.value);
    updateDigitalLink();
  };

  const inputDomainValue = get('input_domain_value');
  inputDomainValue.value = DOMAINS.CUSTOM.url;
  inputDomainValue.oninput = () => {
    DOMAINS.CUSTOM.url = inputDomainValue.value;
    updateDigitalLink();
  };

  // Set identifier options
  const selectIdentifier = get('select_identifier');
  selectIdentifier.options.length = 0;
  ID_LIST.forEach(item => selectIdentifier.options.add(new Option(item.label, item.ai)));
  selectIdentifier.onchange = updateDigitalLink;
  selectIdentifier.value = ID_LIST[1].ai;

  const inputIdentifierValue = get('input_identifier_value');
  inputIdentifierValue.oninput = updateDigitalLink;
  inputIdentifierValue.value = DEFAULT_GTIN_VALUE;

  // Data qualifiers
  const checkQualifiers = get('check_key_qualifiers');
  checkQualifiers.onclick = () => setVisible('div_key_qualifiers_group', checkQualifiers.checked);

  const inputCPV = get('input_cpv');
  inputCPV.oninput = updateDigitalLink;
  const inputBatchOrLot = get('input_batch_lot');
  inputBatchOrLot.oninput = updateDigitalLink;
  const inputSerialNumber = get('input_serial_number');
  inputSerialNumber.oninput = updateDigitalLink;

  // GS1 Attributes
  const checkGS1Attributes = get('check_gs1_data_attributes');
  checkGS1Attributes.onclick = () => setVisible('div_gs1_data_attributes_group', checkGS1Attributes.checked);

  // Add rows to GS1 Data Attributes table
  const table = get('table_gs1_data_attributes');
  AI_LIST.forEach(item => addRowToTable(table, item));

  // Setup attribute search
  const inputSearchAiList = get('input_search_ai_list');
  inputSearchAiList.oninput = () => {
    // Hide all, unless they have a value
    AI_LIST.forEach(item => setRowVisible(item.row, item.value));

    // Show those that matched the query
    const results = searchAiList(inputSearchAiList.value);
    results.forEach(item => setRowVisible(item.row, true));
  };
};

(() => {
  console.log('Script loaded!');

  setupUI();
  updateDigitalLink();
})();