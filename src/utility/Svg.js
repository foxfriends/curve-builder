const svgNS = "http://www.w3.org/2000/svg";

export function createElement(name) {
  const element = document.createElementNS(svgNS, name);
  if (this instanceof Node) {
    this.appendChild(element);
  }
  return element;
}

export function setAttribute(name, value) {
  this.setAttributeNS(null, name, value);
  return this;
}
