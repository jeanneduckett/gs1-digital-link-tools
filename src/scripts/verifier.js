const verifyQuery = (query) => {
  runVerifier(query);
};

const setupUI = () => {
  const inputQuery = getElement('input_verifier_query');
  inputQuery.oninput = () => verifyQuery(inputQuery.value);

  var grammarStr = new grammarObject().toString();
  getElement('div_grammar').innerHTML = grammarStr;
};

(() => {
  setupUI();
  
  console.log('Script loaded!');
})();