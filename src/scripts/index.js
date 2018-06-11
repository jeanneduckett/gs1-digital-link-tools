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

const truncate = str => (str.length < MAX_LENGTH) ? str : `${str.substring(0, MAX_LENGTH - 2)}...`;

const setVisible = (id, state) => {
  get(id).style.display = state ? 'block' : 'none';
};

const getIdFromAICode = code => `input_gs1_attribute_${code}`;

const getIdFromKeyQualifierCode = code => `input_key_qualifier_${code}`;

const generateQrCode = () => {
  const url = `http://api.qrserver.com/v1/create-qr-code?data=${digitalLink}&size=${QR_SIZE}x${QR_SIZE}&format=png`;
  get('img_qr_code').src = url;
};

const updateQrCode = () => {
  // Don't request for every keystroke
  if (qrFetchTimeout) clearTimeout(qrFetchTimeout);

  qrFetchTimeout = setTimeout(generateQrCode, QR_TIMEOUT);
};

const updateDigitalLink = () => {
  // Domain
  const domainKey = Object.keys(DOMAINS)
    .find(item => DOMAINS[item].value === get('select_domain').value);
  const domain = DOMAINS[domainKey];
  
  // Identifier
  const identifier = IDENTIFIER_LIST.find(item => item.code === get('select_identifier').value);
  const identifierValue = get('input_identifier_value').value;
  digitalLink = `https://${domain.url}/${identifier.code}/${identifierValue}`;

  // Key qualifiers
  KEY_QUALIFIERS_LIST.forEach((item) => {
    const input = get(getIdFromKeyQualifierCode(item.code));
    if (input.value) digitalLink += `/${item.code}/${input.value}`;
  });

  // Query params present?
  const queryParams = AI_LIST.some(item => get(getIdFromAICode(item.code)).value);

  // GS1 Data Attributes
  if (queryParams) {
    digitalLink += '?';

    // Key-value pairs
    const usedDataAttributes = AI_LIST.filter(item => item.value);
    usedDataAttributes.forEach((item, i) => {
      if (i !== 0) digitalLink += '&';
      digitalLink += `${item.code}=${item.value}`;
    });
  }

  // Update UI
  get('span_digital_link').innerHTML = digitalLink;
  updateQrCode();
};

const insertAttributeRow = (table, item, generator) => {
  const { label, code } = item;
  const inputId = generator(code);

  const newRow = table.insertRow(table.rows.length);
  const labelCell = newRow.insertCell(0);
  labelCell.innerHTML = `<span>${truncate(label)}</span><span class="italic light-grey"> (${code})</span>`;
  const valueCell = newRow.insertCell(1);
  valueCell.innerHTML = `<input id="${inputId}" type="text" class="form-control ml-2">`;

  // Listen for value input
  const rowInput = get(inputId);
  rowInput.oninput = () => {
    item.value = rowInput.value;
    updateDigitalLink();
  };

  // Start hidden and save a reference to table row and value container
  newRow.style.display = 'none';
  item.row = newRow;
};

const setRowVisible = (row, state) => {
  row.style.display = state ? 'block' : 'none';
};

const searchAiList = (query) => {
  if (!query) return [];

  return AI_LIST.filter(item => item.label.toLowerCase().includes(query) || item.code === query);
};

const injectTableRows = () => {
  // Add rows to GS1 Data Attributes table
  const gs1AttributeTable = get('table_gs1_data_attributes');
  AI_LIST.forEach(item => insertAttributeRow(gs1AttributeTable, item, getIdFromAICode));

  // Add rows to Key Qualifier table
  const keyQualifierTable = get('table_key_qualifiers');
  KEY_QUALIFIERS_LIST.forEach(item => insertAttributeRow(keyQualifierTable, item, getIdFromKeyQualifierCode));
};

const updateVisibleKeyQualifiers = () => {
  // Hide all
  KEY_QUALIFIERS_LIST.forEach(item => setRowVisible(item.row, item.value));

  // Show relevant key qualifiers for this identifier
  const currentIdentifier = IDENTIFIER_LIST.find(item => item.code === get('select_identifier').value);
  const visibleRows = KEY_QUALIFIERS_LIST.filter(item => currentIdentifier.keyQualifiers.includes(item.code));
  visibleRows.forEach(item => setRowVisible(item.row, true));
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
  IDENTIFIER_LIST.forEach(item => selectIdentifier.options.add(new Option(item.label, item.code)));
  // Different key qualifiers show depending on the identifier
  selectIdentifier.onchange = () => {
    updateVisibleKeyQualifiers();
    updateDigitalLink();
  };
  selectIdentifier.value = IDENTIFIER_LIST[1].code;

  const inputIdentifierValue = get('input_identifier_value');
  inputIdentifierValue.oninput = updateDigitalLink;
  inputIdentifierValue.value = DEFAULT_GTIN_VALUE;

  // Data qualifiers
  const checkQualifiers = get('check_key_qualifiers');
  checkQualifiers.onclick = () => setVisible('div_key_qualifiers_group', checkQualifiers.checked);

  const inputCPV = get(getIdFromKeyQualifierCode(22));
  inputCPV.oninput = updateDigitalLink;
  const inputBatchOrLot = get(getIdFromKeyQualifierCode(10));
  inputBatchOrLot.oninput = updateDigitalLink;
  const inputSerialNumber = get(getIdFromKeyQualifierCode(21));
  inputSerialNumber.oninput = updateDigitalLink;

  // GS1 Attributes
  const checkGS1Attributes = get('check_gs1_data_attributes');
  checkGS1Attributes.onclick = () => setVisible('div_gs1_data_attributes_group', checkGS1Attributes.checked);

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

  injectTableRows();
  setupUI();
  updateDigitalLink();
  updateVisibleKeyQualifiers();
})();