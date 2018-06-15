const Qrious = require('qrious');

const {
  getElement,
  setVisible,
} = require('./util');

const KEY_QUALIFIERS_LIST = require('../data/key-qualifier-list.json');
const IDENTIFIER_LIST = require('../data/identifier-list.json');
const AI_LIST = require('../data/ai-list.json');
const ALPHA_MAP = require('../data/alpha-map.json');
const QR_CODE_CONFIGS = require('../data/qr-code-configs.json');

const MAX_LENGTH = 48;
const DEFAULT_GTIN_VALUE = '9780345418913';
const QR_SIZE = 180;
const DOMAINS = {
  TN_GG: { value: 'tngg', label: 'tn.gg (EVRYTHNG)', url: 'tn.gg' },
  ID_GS1: { value: 'idgs1org', label: 'id.gs1.org (Canonical)', url: 'id.gs1.org' },
  CUSTOM: { value: 'custom', label: 'Custom domain...', url: 'domain.example.org' },
};
const UI = {
  aQrCodeGenerate: getElement('a_qrcode_generate'),
  canvasQRCode: getElement('canvas_qr_code'),
  checkCustomAttributes: getElement('check_custom_data_attributes'),
  checkFormatAlphanumeric: getElement('check_format_alphanumeric'),
  checkFormatNumeric: getElement('check_format_numeric'),
  checkGS1Attributes: getElement('check_gs1_data_attributes'),
  checkQualifiers: getElement('check_key_qualifiers'),
  inputIdentifierValue: getElement('input_identifier_value'),
  inputSearchAiList: getElement('input_search_ai_list'),
  selectQrCodeStyle: getElement('select_qr_code_style'),
  selectDomain: getElement('select_domain'),
  selectIdentifier: getElement('select_identifier'),
  spanDigitalLink: getElement('span_digital_link'),
  spanIdentifierLabel: getElement('span_identifier_label'),
  tableCustomAttributes: getElement('table_custom_attributes'),
  tableGS1Attribute: getElement('table_gs1_data_attributes'),
  tableKeyQualifier: getElement('table_key_qualifiers'),
  inputDomainValue: getElement('input_domain_value'),
};

// [{ key, value, row }]
const customAttributes = [];
let qrCode;
let digitalLink;

const truncate = (str) => {
  if (str.length < MAX_LENGTH) return str;

  return `${str.substring(0, MAX_LENGTH - 2)}...`;
};

const getIdFromAI = code => `input_gs1_attribute_${code}`;

const getIdFromKeyQualifier = code => `input_key_qualifier_${code}`;

const generateClassicQrCode = () => {
  if (!qrCode) {
    qrCode = new Qrious({
      element: UI.canvasQRCode,
      size: QR_SIZE,
      value: digitalLink,
      level: 'L',
      foreground: '#000000',
      background: '#FFFFFF',
    });
  }

  qrCode.value = digitalLink;
};

const updateQrCode = () => {
  const key = UI.selectQrCodeStyle.value;
  const map = {
    default: generateClassicQrCode,
    roundedBlueLogo: () => {
      // Call mashape
    },
    // ...
  };

  if (map[key]) map[key]();
};

const mapAlphaNumeric = (code) => {
  if (!UI.checkFormatAlphanumeric.checked) return code;

  return ALPHA_MAP[`${code}`] || code;
};

const customAttributesSpecified = () => customAttributes.some(item => item.key && item.value);

const updateDigitalLink = () => {
  // Domain
  const domainKey = Object.keys(DOMAINS)
    .find(item => DOMAINS[item].value === UI.selectDomain.value);
  const domain = DOMAINS[domainKey];

  // Identifier
  const identifier = IDENTIFIER_LIST.find(item => item.code === UI.selectIdentifier.value);
  const identifierValue = UI.inputIdentifierValue.value;
  digitalLink = `https://${domain.url}/${mapAlphaNumeric(identifier.code)}/${identifierValue}`;

  // Key qualifiers
  KEY_QUALIFIERS_LIST.forEach((item) => {
    const input = getElement(getIdFromKeyQualifier(item.code));
    if (input.value) digitalLink += `/${mapAlphaNumeric(item.code)}/${input.value}`;
  });

  // Query params present?
  const queryPresent = AI_LIST.some(item => getElement(getIdFromAI(item.code)).value) ||
    customAttributesSpecified();
  if (queryPresent) digitalLink += '?';

  const queryParams = [];

  // GS1 Data Attributes
  const gs1Attributes = AI_LIST.filter(item => item.value);
  gs1Attributes.forEach(item => queryParams.push([item.code, item.value]));

  // Custom Data Attributes
  customAttributes.forEach((item) => {
    if (!item.key || !item.value) return;

    queryParams.push([item.key, item.value]);
  });

  queryParams.forEach((item, i) => {
    if (i !== 0) digitalLink += '&';

    digitalLink += `${item[0]}=${item[1]}`;
  });

  // Update UI
  UI.spanDigitalLink.innerHTML = digitalLink;
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
  for (let i = 0; i < UI.tableCustomAttributes.rows.length; i += 1) {
    const row = UI.tableCustomAttributes.rows[i];
    const inputKey = row.querySelector('#input_custom_attribute_row_key');
    const inputValue = row.querySelector('#input_custom_attribute_row_value');

    // Delete empty rows
    if (!inputKey.value && !inputValue.value) UI.tableCustomAttributes.deleteRow(i);
  }

  // No rows left?
  if (!UI.tableCustomAttributes.rows.length) addCustomAttributeRow();

  // No empty rows?
  if (!tableHasEmptyRows(UI.tableCustomAttributes)) addCustomAttributeRow();
};

const addCustomAttributeRow = () => {
  const nextIndex = UI.tableCustomAttributes.rows.length;

  const newRow = UI.tableCustomAttributes.insertRow(nextIndex);
  const newCell = newRow.insertCell(0);
  newCell.innerHTML = `<div class="input-group">
    <input id="input_custom_attribute_row_key" type="text" class="form-control" placeholder="Key...">
    <input id="input_custom_attribute_row_value" type="text" class="form-control" placeholder="Value...">
  </div>`;

  // Add data model item
  const attributeModel = {
    key: '',
    value: '',
    row: newRow,
  };
  customAttributes.push(attributeModel);

  // Add listeners
  const inputKey = newCell.querySelector('#input_custom_attribute_row_key');
  inputKey.oninput = () => {
    attributeModel.key = inputKey.value;
    updateCustomAttributeRows();
    updateDigitalLink();
  };
  const inputValue = newCell.querySelector('#input_custom_attribute_row_value');
  inputValue.oninput = () => {
    attributeModel.value = inputValue.value;
    updateCustomAttributeRows();
    updateDigitalLink();
  };
};

const injectTableRows = () => {
  // Add rows to Key Qualifier table
  KEY_QUALIFIERS_LIST.forEach((item) => {
    insertAttributeRow(UI.tableKeyQualifier, item, getIdFromKeyQualifier);
  });

  // Add rows to GS1 Data Attributes table
  AI_LIST.forEach(item => insertAttributeRow(UI.tableGS1Attribute, item, getIdFromAI));

  // Add first row to custom attributes table
  addCustomAttributeRow();
};

const updateVisibleKeyQualifiers = () => {
  // Hide all, unless they have a value
  KEY_QUALIFIERS_LIST.forEach(item => setRowVisible(item.row, item.value));

  // Show relevant key qualifiers for this identifier
  const identifier = IDENTIFIER_LIST.find(n => n.code === UI.selectIdentifier.value);
  const visibleRows = KEY_QUALIFIERS_LIST.filter(n => identifier.keyQualifiers.includes(n.code));
  visibleRows.forEach(item => setRowVisible(item.row, true));
};

const updateIdentifierValueLabel = () => {
  const { code } = IDENTIFIER_LIST.find(item => item.code === UI.selectIdentifier.value);
  UI.spanIdentifierLabel.innerHTML = `(${code})`;
};

const setupUI = () => {
  // Domain
  UI.selectDomain.onchange = () => {
    setVisible('div_domain_wrapper', UI.selectDomain.value === DOMAINS.CUSTOM.value);
    updateDigitalLink();
  };

  UI.inputDomainValue.value = DOMAINS.CUSTOM.url;
  UI.inputDomainValue.oninput = () => {
    DOMAINS.CUSTOM.url = UI.inputDomainValue.value;
    updateDigitalLink();
  };

  // Format options
  UI.checkFormatAlphanumeric.onchange = updateDigitalLink;
  UI.checkFormatNumeric.onchange = updateDigitalLink;

  // Set identifier options
  UI.inputIdentifierValue.oninput = updateDigitalLink;
  UI.inputIdentifierValue.value = DEFAULT_GTIN_VALUE;

  UI.selectIdentifier.options.length = 0;
  IDENTIFIER_LIST.forEach((item) => {
    UI.selectIdentifier.options.add(new Option(item.label, item.code));
  });
  UI.selectIdentifier.value = IDENTIFIER_LIST[1].code;
  UI.selectIdentifier.onchange = () => {
    updateDigitalLink();
    updateVisibleKeyQualifiers();
    updateIdentifierValueLabel();
  };

  // Data qualifiers
  UI.checkQualifiers.onclick = () => setVisible('div_key_qualifiers_group', UI.checkQualifiers.checked);

  getElement(getIdFromKeyQualifier(22)).oninput = updateDigitalLink;
  getElement(getIdFromKeyQualifier(10)).oninput = updateDigitalLink;
  getElement(getIdFromKeyQualifier(21)).oninput = updateDigitalLink;

  // GS1 Attributes
  UI.checkGS1Attributes.onclick = () => {
    setVisible('div_gs1_data_attributes_group', UI.checkGS1Attributes.checked);
  };

  // Setup attribute search
  UI.inputSearchAiList.oninput = () => {
    // Hide all, unless they have a value
    AI_LIST.forEach(item => setRowVisible(item.row, item.value));

    // Show those that matched the query
    const results = searchAiList(UI.inputSearchAiList.value);
    results.forEach(item => setRowVisible(item.row, true));
  };

  // Custom Attributes
  UI.checkCustomAttributes.onclick = () => {
    setVisible('div_custom_attributes_group', UI.checkCustomAttributes.checked);
  };

  // QR Code Style
  UI.selectQrCodeStyle.options.length = 0;
  Object.keys(QR_CODE_CONFIGS).forEach((item) => {
    UI.selectQrCodeStyle.options.add(new Option(QR_CODE_CONFIGS[item].label, item));
  });
  UI.selectQrCodeStyle.value = 'default';
  UI.selectQrCodeStyle.onchange = () => {
    const key = UI.selectQrCodeStyle.value;
    setVisible('a_qrcode_generate', key !== 'default');
  };
  setVisible('a_qrcode_generate', false);
  UI.aQrCodeGenerate.onclick = updateQrCode;
};

(() => {
  injectTableRows();
  setupUI();
  updateDigitalLink();
  updateVisibleKeyQualifiers();
  updateIdentifierValueLabel();

  console.log('Script loaded!');
})();
