const CONFIG = {
  STATS: true,
  TRACE: true,
};

/*
 * This will start parsing the string to verify it...
 * grammar - an instantiated grammar object - the output of apg for a specific SABNF grammar
 * startRule - the rule name or rule index to be used as the root of the parse tree. This is usually the first rule, index = 0, of the grammar but can be any rule defined in the above grammar object.
 * inputChars - the input string. Can be a string or an array of integer character codes representing the string.
 * uriParts - user-defined data object to be passed to the user’s callback functions. This is not used by the parser in any way, merely passed on to the user. May be null or omitted.
*/
const runVerifier = (inputString) => {
  try {
    const parser = new apglib.parser();

    if (CONFIG.STATS) parser.stats = new apglib.stats();
    if (CONFIG.TRACE) parser.trace = new apglib.trace();

    const grammar = new grammarObject();
    const inputChars = apglib.utils.stringToChars(inputString);
    const startRule = inputString.includes('id.gs1.org') ? 'canonicalGS1webURI' : 'customGS1webURI';
    const uriParts = [];
    const result = parser.parse(grammar, startRule, inputChars, uriParts);

    // Parsing stats...
    if (CONFIG.STATS) {
      let statsHtml = parser.stats.toHtml('ops', 'ops-only stats');
      statsHtml += parser.stats.toHtml('index', 'rules ordered by index');
      statsHtml += parser.stats.toHtml('alpha', 'rules ordered alphabetically');
      statsHtml += parser.stats.toHtml('hits', 'rules ordered by hit count');
      getElement('div_stats').innerHTML = statsHtml;
    }

    // Full trace of the parsing...
    if (CONFIG.TRACE) {
      const traceHtml = parser.trace.toHtmlPage('ascii', 'Parsing details:');
      getElement('div_trace').innerHTML = traceHtml;
    }
    
    getElement('div_verdict').innerHTML = `The syntax of this GS1 Digital Link is <strong>${result.success ? 'valid' : 'invalid'}!</strong>`;
    getElement('div_results').innerHTML = apglib.utils.parserResultToHtml(result);
  } catch (e) {
    console.log(e);
    getElement('div_results').innerHTML = `EXCEPTION THROWN: ${e.message || e}`;
  }
};