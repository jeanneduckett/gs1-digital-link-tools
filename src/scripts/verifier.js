const { grammarObject } = require('./grammar');
const parser = require('./parser');
const { getElement } = require('./util');

const DEFAULT_QUERY = 'https://gs1.example.org/gtin/9780345418913/ser/43768';
const UI = {
  aVerify: getElement('a_verify'),
  divGrammar: getElement('div_grammar'),
  inputVerifierQuery: getElement('input_verifier_query'),
};

const setupUI = () => {
  UI.inputVerifierQuery.value = DEFAULT_QUERY;

  UI.aVerify.onclick = () => {
    const inputString = UI.inputVerifierQuery.value;
    const startRule = inputString.includes('id.gs1.org') ? 'canonicalGS1webURI' : 'customGS1webURI';
    parser.generateReport(inputString, startRule);
  };

  UI.divGrammar.innerHTML = new grammarObject().toString();
};

(() => {
  setupUI();

  console.log('Script loaded!');
})();
