var grammarStr = new grammarObject().toString();

const verifyQuery = (query) => {
  runVerifier(query);
};

const setupUI = () => {
  const inputQuery = getElement('input_verifier_query');
  inputQuery.oninput = () => verifyQuery(inputQuery.value);
};

(() => {
  setupUI();
  
  console.log('Script loaded!');
})();