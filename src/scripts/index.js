const MAX_LENGTH = 48;
const DEFAULT_GTIN_VALUE = '9780345418913';
const QR_SIZE = 180;
const QR_TIMEOUT = 500;
const DOMAINS = {
  TN_GG: { value: 'tngg', label: 'tn.gg (EVRYTHNG)', url: 'tn.gg' },
  ID_GS1: { value: 'idgs1org', label: 'id.gs1.org (Canonical)', url: 'id.gs1.org' },
  CUSTOM: { value: 'custom', label: 'Custom domain...', url: 'domain.example.org' },
};

const customAttributes = [];  // [{ key, value, row }]
let digitalLink, qrFetchTimeout;

const getElement = id => document.getElementById(id);

const truncate = str => (str.length < MAX_LENGTH) ? str : `${str.substring(0, MAX_LENGTH - 2)}...`;

const setVisible = (id, state) => {
  getElement(id).style.display = state ? 'block' : 'none';
};

const getIdFromAI = code => `input_gs1_attribute_${code}`;

const getIdFromKeyQualifier = code => `input_key_qualifier_${code}`;

const generateQrCode = () => {
  const url = `http://api.qrserver.com/v1/create-qr-code?data=${digitalLink}&size=${QR_SIZE}x${QR_SIZE}&format=png`;
  getElement('img_qr_code').src = url;
};

const updateQrCode = () => {
  // Don't request for every keystroke
  if (qrFetchTimeout) clearTimeout(qrFetchTimeout);

  qrFetchTimeout = setTimeout(generateQrCode, QR_TIMEOUT);
};

const updateDigitalLink = () => {
  // Domain
  const domainKey = Object.keys(DOMAINS)
    .find(item => DOMAINS[item].value === getElement('select_domain').value);
  const domain = DOMAINS[domainKey];
  
  // Identifier
  const identifier = IDENTIFIER_LIST.find(item => item.code === getElement('select_identifier').value);
  const identifierValue = getElement('input_identifier_value').value;
  digitalLink = `https://${domain.url}/${identifier.code}/${identifierValue}`;

  // Key qualifiers
  KEY_QUALIFIERS_LIST.forEach((item) => {
    const input = getElement(getIdFromKeyQualifier(item.code));
    if (input.value) digitalLink += `/${item.code}/${input.value}`;
  });

  // Query params present?
  const queryParams = AI_LIST.some(item => getElement(getIdFromAI(item.code)).value) || 
    customAttributes.some(item => item.key && item.value);

  // GS1 Data Attributes
  if (queryParams) {
    digitalLink += '?';

    // Key-value pairs
    const gs1Attributes = AI_LIST.filter(item => item.value);
    gs1Attributes.forEach((item, i) => {
      if (i !== 0) digitalLink += '&';
      digitalLink += `${item.code}=${item.value}`;
    });
  }

  // Custom Data Attributes
  customAttributes.forEach((item, i) => {
    if (!item.key || !item.value) return;
    if (i !== 0 || digitalLink.charAt(digitalLink.length - 1) !== '&') digitalLink += '&';

    digitalLink += `${item.key}=${item.value}`;
  });

  // Update UI
  getElement('span_digital_link').innerHTML = digitalLink;
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
  const rowInput = getElement(inputId);
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

const tableHasEmptyRows = (table) => {
  for (let i = 0; i < table.rows.length; i += 1) {
    const row = table.rows[i];
    const inputKey = row.querySelector('#input_custom_attribute_row_key');
    const inputValue = row.querySelector('#input_custom_attribute_row_value');

    if (!inputKey.value && !inputValue.value) return true;
  }

  return false;
};

const updateCustomAttributeRows = () => {
  const table = getElement('table_custom_attributes');
  for (let i = 0; i < table.rows.length; i += 1) {
    const row = table.rows[i];
    const inputKey = row.querySelector('#input_custom_attribute_row_key');
    const inputValue = row.querySelector('#input_custom_attribute_row_value');

    // Delete empty rows
    if (!inputKey.value && !inputValue.value) table.deleteRow(i);
  };

  // No rows left?
  if (!table.rows.length) addCustomAttributeRow();

  // No empty rows?
  if (!tableHasEmptyRows(table)) addCustomAttributeRow();
};

const addCustomAttributeRow = () => {
  const table = getElement('table_custom_attributes');
  const nextIndex = table.rows.length;

  const newRow = table.insertRow(nextIndex);
  const newCell = newRow.insertCell(0);
  newCell.innerHTML = `<div class="input-group">
    <input id="input_custom_attribute_row_key" type="text" class="form-control" placeholder="Key...">
    <input id="input_custom_attribute_row_value" type="text" class="form-control" placeholder="Value...">
  </div>`;

  // Add data model item
  const customAttributeModel = {
    key: '',
    value: '',
    row: newRow,
  };
  customAttributes.push(customAttributeModel);

  // Add listeners
  const inputKey = newCell.querySelector('#input_custom_attribute_row_key');
  inputKey.oninput = () => {
    customAttributeModel.key = inputKey.value;
    updateCustomAttributeRows();
    updateDigitalLink();
  };
  const inputValue = newCell.querySelector('#input_custom_attribute_row_value');
  inputValue.oninput = () => {
    customAttributeModel.value = inputValue.value;
    updateCustomAttributeRows();
    updateDigitalLink();
  };
};

const injectTableRows = () => {
  // Add rows to Key Qualifier table
  const keyQualifierTable = getElement('table_key_qualifiers');
  KEY_QUALIFIERS_LIST.forEach(item => insertAttributeRow(keyQualifierTable, item, getIdFromKeyQualifier));

  // Add rows to GS1 Data Attributes table
  const gs1AttributeTable = getElement('table_gs1_data_attributes');
  AI_LIST.forEach(item => insertAttributeRow(gs1AttributeTable, item, getIdFromAI));

  // Add first row to custom attributes table
  addCustomAttributeRow();
};

const updateVisibleKeyQualifiers = () => {
  // Hide all, unless they have a value
  KEY_QUALIFIERS_LIST.forEach(item => setRowVisible(item.row, item.value));

  // Show relevant key qualifiers for this identifier
  const currentIdentifier = IDENTIFIER_LIST.find(item => item.code === getElement('select_identifier').value);
  const visibleRows = KEY_QUALIFIERS_LIST.filter(item => currentIdentifier.keyQualifiers.includes(item.code));
  visibleRows.forEach(item => setRowVisible(item.row, true));
};

const setupUI = () => {
  // Domain
  const selectDomain = getElement('select_domain');
  selectDomain.value = DOMAINS.ID_GS1.value;
  selectDomain.onchange = () => {
    setVisible('div_domain_wrapper', selectDomain.value === DOMAINS.CUSTOM.value);
    updateDigitalLink();
  };

  const inputDomainValue = getElement('input_domain_value');
  inputDomainValue.value = DOMAINS.CUSTOM.url;
  inputDomainValue.oninput = () => {
    DOMAINS.CUSTOM.url = inputDomainValue.value;
    updateDigitalLink();
  };

  // Set identifier options
  const selectIdentifier = getElement('select_identifier');
  selectIdentifier.options.length = 0;
  IDENTIFIER_LIST.forEach(item => selectIdentifier.options.add(new Option(item.label, item.code)));
  // Different key qualifiers show depending on the identifier
  selectIdentifier.onchange = () => {
    updateVisibleKeyQualifiers();
    updateDigitalLink();
  };
  selectIdentifier.value = IDENTIFIER_LIST[1].code;

  const inputIdentifierValue = getElement('input_identifier_value');
  inputIdentifierValue.oninput = updateDigitalLink;
  inputIdentifierValue.value = DEFAULT_GTIN_VALUE;

  // Data qualifiers
  const checkQualifiers = getElement('check_key_qualifiers');
  checkQualifiers.onclick = () => setVisible('div_key_qualifiers_group', checkQualifiers.checked);

  getElement(getIdFromKeyQualifier(22)).oninput = updateDigitalLink;
  getElement(getIdFromKeyQualifier(10)).oninput = updateDigitalLink;
  getElement(getIdFromKeyQualifier(21)).oninput = updateDigitalLink;

  // GS1 Attributes
  const checkGS1Attributes = getElement('check_gs1_data_attributes');
  checkGS1Attributes.onclick = () => setVisible('div_gs1_data_attributes_group', checkGS1Attributes.checked);

  // Setup attribute search
  const inputSearchAiList = getElement('input_search_ai_list');
  inputSearchAiList.oninput = () => {
    // Hide all, unless they have a value
    AI_LIST.forEach(item => setRowVisible(item.row, item.value));

    // Show those that matched the query
    const results = searchAiList(inputSearchAiList.value);
    results.forEach(item => setRowVisible(item.row, true));
  };

  // Custom Attributes
  const checkCustomAttributes = getElement('check_custom_data_attributes');
  checkCustomAttributes.onclick = () => setVisible('div_custom_attributes_group', checkCustomAttributes.checked);
};

(() => {
  injectTableRows();
  setupUI();
  updateDigitalLink();
  updateVisibleKeyQualifiers();

  console.log('Script loaded!');
})();