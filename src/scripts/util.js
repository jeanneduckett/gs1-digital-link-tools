const getElement = id => document.getElementById(id);

const setVisible = (id, state) => {
  getElement(id).style.display = state ? 'block' : 'none';
};
