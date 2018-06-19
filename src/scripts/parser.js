/* eslint new-cap: 0 */

const apglib = require('apg-lib');

const { grammarObject } = require('./grammar');
const { getElement } = require('./util');

const GRAMMAR = new grammarObject();

const UI = {
  divResults: getElement('div_results'),
  divStats: getElement('div_stats'),
  divTrace: getElement('div_trace'),
  imgVerdict: getElement('img_verdict'),
  spanVerdictResult: getElement('span_verdict_result'),
};

const createParser = () => {
  const parser = new apglib.parser();
  parser.stats = new apglib.stats();
  parser.trace = new apglib.trace();

  return parser;
};

const validate = (inputString, startRule) => {
  const parser = createParser();
  const inputChars = apglib.utils.stringToChars(inputString);
  const result = parser.parse(GRAMMAR, startRule, inputChars, []);
  return result.success;
};

const generateReport = (inputString, startRule) => {
  try {
    const parser = createParser();
    const inputChars = apglib.utils.stringToChars(inputString);
    const result = parser.parse(GRAMMAR, startRule, inputChars, []);

    // Parsing stats...
    let statsHtml = parser.stats.toHtml('ops', 'ops-only stats');
    statsHtml += parser.stats.toHtml('index', 'rules ordered by index');
    statsHtml += parser.stats.toHtml('alpha', 'rules ordered alphabetically');
    statsHtml += parser.stats.toHtml('hits', 'rules ordered by hit count');
    UI.divStats.innerHTML = statsHtml;

    // Full trace of the parsing...
    const traceHtml = parser.trace.toHtmlPage('ascii', 'Parsing details:');
    UI.divTrace.innerHTML = traceHtml;

    UI.spanVerdictResult.innerHTML = `<strong>${result.success ? 'VALID' : 'INVALID'}</strong>`;
    UI.imgVerdict.src = `./assets/${result.success ? '' : 'in'}valid.svg`;
    UI.divResults.innerHTML = apglib.utils.parserResultToHtml(result);

    return parser.success;
  } catch (e) {
    console.log(e);
    UI.divResults.innerHTML = `EXCEPTION THROWN: ${e.message || e}`;
    return false;
  }
};

module.exports = {
  generateReport,
  validate,
};
