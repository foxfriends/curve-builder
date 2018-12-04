import { event, forEach } from '../utility/AsyncIterator';
import { EventStream } from '../utility/EventStream';

const [KEY, ELEMENT] = Symbol.generate('KEY');

let buttonKey = 0;
export class Button extends EventStream {
  static titled(title) {
    return new Button(document.createTextNode(title));
  }

  constructor(contents) {
    super();
    this[KEY] = `button-${buttonKey++}`;
    this[ELEMENT] = document.createElement('button');
    this[ELEMENT].setAttribute('id', this.id);

    if (contents instanceof Array) {
      contents::forEach(::this[ELEMENT].appendChild);
    } else {
      this[ELEMENT].appendChild(contents);
    }

    this[ELEMENT]
      ::event('click')
      ::forEach(::this.emit);
  }

  setAttribute(attr, value) {
    if (value) {
      this[ELEMENT].setAttribute(attr, value);
    } else {
      this[ELEMENT].removeAttribute(attr);
    }
    return this;
  }

  get element() {
    return this[ELEMENT];
  }

  get id() {
    return this[KEY];
  }
}
