const MAX_LABEL_LENGTH = 48;

const setVisible = (id, state) => document.getElementById(id).style.display = state ? 'block' : 'none';

const getInputIdFromGS1AI = ai => `input_gs1_attribute_${ai}`;

const maxLength = str => (str.length < MAX_LABEL_LENGTH)
  ? str 
  : `${str.substring(0, MAX_LABEL_LENGTH - 2)}...`;

const addRowToTable = (table, item) => {
  const { label, ai } = item;
  const row = table.insertRow(table.rows.length);
  const labelCell = row.insertCell(0);
  labelCell.innerHTML = `<span class="overflow">${maxLength(label)}</span><span class="italic light-grey"> (${ai})</span>`;
  const valueCell = row.insertCell(1);
  valueCell.innerHTML = `<input id="${getInputIdFromGS1AI(ai)}" type="text" class="form-control ml-2">`;

  // Listen for value input
  const rowInput = document.getElementById(getInputIdFromGS1AI(item.ai));
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

const setupUI = () => {
  const checkQualifiers = document.getElementById('check_key_qualifiers');
  checkQualifiers.onclick = () => setVisible('div_key_qualifiers_group', checkQualifiers.checked);
  const checkGS1Attributes = document.getElementById('check_gs1_data_attributes');
  checkGS1Attributes.onclick = () => setVisible('div_gs1_data_attributes_group', checkGS1Attributes.checked);

  // Add rows to GS1 Data Attributes table
  const table = document.getElementById('table_gs1_data_attributes');
  AI_LIST.forEach(item => addRowToTable(table, item));

  // Setup attribute search
  const inputSearchAiList = document.getElementById('input_search_ai_list');
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
})();