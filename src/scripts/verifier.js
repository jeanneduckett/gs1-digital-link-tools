/* eslint new-cap: 0 */

const apglib = require('apg-lib');

const { grammarObject } = require('./grammar');
const { getElement } = require('./util');

const DEFAULT_QUERY = 'https://gs1.example.org/gtin/9780345418913/ser/43768';
const UI = {
  aVerify: getElement('a_verify'),
  divGrammar: getElement('div_grammar'),
  divResults: getElement('div_results'),
  divStats: getElement('div_stats'),
  divTrace: getElement('div_trace'),
  imgVerdict: getElement('img_verdict'),
  inputVerifierQuery: getElement('input_verifier_query'),
  spanVerdictLabel: getElement('span_verdict_label'),
  spanVerdictResult: getElement('span_verdict_result'),
};

const runVerifier = (inputString, startRule) => {
  try {
    const parser = new apglib.parser();

    parser.stats = new apglib.stats();
    parser.trace = new apglib.trace();

    const grammar = new grammarObject();
    const inputChars = apglib.utils.stringToChars(inputString);
    const uriParts = [];
    const result = parser.parse(grammar, startRule, inputChars, uriParts);

    // Parsing stats...
    let statsHtml = parser.stats.toHtml('ops', 'ops-only stats');
    statsHtml += parser.stats.toHtml('index', 'rules ordered by index');
    statsHtml += parser.stats.toHtml('alpha', 'rules ordered alphabetically');
    statsHtml += parser.stats.toHtml('hits', 'rules ordered by hit count');
    UI.divStats.innerHTML = statsHtml;

    // Full trace of the parsing...
    const traceHtml = parser.trace.toHtmlPage('ascii', 'Parsing details:');
    UI.divTrace.innerHTML = traceHtml;

    UI.spanVerdictLabel.innerHTML = 'The syntax of your GS1 Digital Link is';
    UI.spanVerdictResult.innerHTML = `<strong>${result.success ? 'VALID' : 'INVALID'}</strong>`;
    UI.imgVerdict.src = `./assets/${result.success ? '' : 'in'}valid.svg`;
    UI.divResults.innerHTML = apglib.utils.parserResultToHtml(result);
  } catch (e) {
    console.log(e);
    UI.divResults.innerHTML = `EXCEPTION THROWN: ${e.message || e}`;
  }
};

const setupUI = () => {
  UI.inputVerifierQuery.value = DEFAULT_QUERY;

  UI.aVerify.onclick = () => {
    const inputString = UI.inputVerifierQuery.value;
    const startRule = inputString.includes('id.gs1.org') ? 'canonicalGS1webURI' : 'customGS1webURI';
    runVerifier(inputString, startRule);
  };

  UI.divGrammar.innerHTML = new grammarObject().toString();
};

(() => {
  setupUI();

  console.log('Script loaded!');
})();
