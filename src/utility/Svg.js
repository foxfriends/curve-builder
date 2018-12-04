const svgNS = "http://www.w3.org/2000/svg";

export function createElement(name) {
  return document.createElementNS(svgNS, name);
}

export function setAttribute(name, value) {
  this.setAttributeNS(null, name, value);
  return this;
}
