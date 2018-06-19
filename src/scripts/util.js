const getElement = id => document.getElementById(id);

const setVisible = (element, state) => {
  if (typeof element === 'string') element = getElement(element);

  element.style.display = state ? 'block' : 'none';
};

const setRowVisible = (row, state) => {
  row.style.display = state ? 'block' : 'none';
};

module.exports = {
  getElement,
  setVisible,
  setRowVisible,
};
