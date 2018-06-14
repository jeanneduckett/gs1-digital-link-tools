const KEY_QUALIFIERS_LIST = require('../data/key-qualifier-list.json');
const IDENTIFIER_LIST = require('../data/identifier-list.json');
const AI_LIST = require('../data/ai-list.json');
const ALPHA_MAP = require('../data/alpha-map.json');

const { grammarObject } = require('../lib/verifier/GS1_Web_URI.js');
const { getElement } = require('./util');
const runVerifier = require('../lib/verifier/runVerifier');

const setupUI = () => {
  const inputQuery = getElement('input_verifier_query');
  inputQuery.oninput = () => runVerifier(inputQuery.value);

  var grammarStr = new grammarObject().toString();
  getElement('div_grammar').innerHTML = grammarStr;
};

(() => {
  setupUI();
  
  console.log('Script loaded!');
})();