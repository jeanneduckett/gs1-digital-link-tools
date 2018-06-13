var setup = function() {
  "use strict";
  var htmlResult, htmlStats, htmlTrace
  var doStats = true;
  var doTrace = true;
  try {
    var parser = new apglib.parser();
    var grammar = new grammarObject();
    var id = apglib.ids;
    var utils = apglib.utils;
    if (doStats) {
      parser.stats = new apglib.stats();
    }
    if (doTrace) {
      parser.trace = new apglib.trace();
    }
    /* our input GS1 Web URI */
    var inputString = $("#string").val();
    /* convert string to character codes */
    var inputCharacterCodes = utils.stringToChars(inputString);
    /* the callback function's *data* */
    var uriParts = [];
    /* the rule to start with... */
    var startRule = "customGS1webURI";
    if(inputString.indexOf("id.gs1.org") !== -1) {
      // Cannonical GS1 Web URI
      startRule = "canonicalGS1webURI";
    }

    /*
    This will start parsing the string to verify it...
      grammar - an instantiated grammar object - the output of apg for a specific SABNF grammar
      startRule - the rule name or rule index to be used as the root of the parse tree. This is usually the first rule, index = 0, of the grammar but can be any rule defined in the above grammar object.
      inputCharacterCodes - the input string. Can be a string or an array of integer character codes representing the string.
      uriParts - user-defined data object to be passed to the user’s callback functions. This is not used by the parser in any way, merely passed on to the user. May be null or omitted.
    */
    var result = parser.parse(grammar, startRule, inputCharacterCodes, uriParts);
    htmlResult = "";
    htmlResult += "<h3>Parser Results</h3>";
    htmlResult += apglib.utils.parserResultToHtml(result);
    if (result.success) {
      htmlResult += "<p>";
      htmlResult += "The syntax of this GS1 Digital Link is <b>valid<b>."
      htmlResult += "</p>";
      $("#result").html(htmlResult);
    }else{
      htmlResult += "<p>";
      htmlResult += "The syntax of this GS1 Digital Link is <b>invalid</b> ";
      htmlResult += "see trace for more details.";
      htmlResult += "</p>";
      $("#result").html(htmlResult);
    }
    if (doStats) {
      // Parsing stats...
      htmlStats = "";
      htmlStats += parser.stats.toHtml("ops", "ops-only stats");
      htmlStats += parser.stats.toHtml("index", "rules ordered by index");
      htmlStats += parser.stats.toHtml("alpha", "rules ordered alphabetically");
      htmlStats += parser.stats.toHtml("hits", "rules ordered by hit count");
      $("#tabs-stats").html(htmlStats);
    }

    if (doTrace) {
      // Full trace of the parsing...
      htmlTrace = parser.trace.toHtmlPage("ascii", "Parsing details:");
      $("#tabs-trace").html(htmlTrace);
    }
  } catch (e) {
    var msg = "EXCEPTION THROWN: ";
    if (e instanceof Error) {
      msg += e.name + ": " + e.message;
    } else if (typeof (e) === "string") {
      msg += e;
    }else{
      msg += "unknown";
    }
    $("#result").html(msg);
  }
}
$(document).ready(function(){
  var con = new grammarObject();
  $("#grammar-bnf").html(con.toString())
  $("#parse").click(setup);
  $("#string").val("https://id.gs1.org/gtin/40082330/cpv/123");
  //$("#string").val("https://gs1.tn.gg/gtin/40082330/c/549");
  $("#tabs").tabs();
});
