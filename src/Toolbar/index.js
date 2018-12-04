import { tap, map, flatten, filter, contains, forEach } from '../utility/Iterator';
import { _, λ } from '../utility/Keypath';
const [ELEMENT, BUTTONS] = Symbol.generate('ELEMENT', 'BUTTONS');

export class Toolbar {
  constructor(element) {
    this[ELEMENT] = element;
  }

  get width() {
    return this[ELEMENT].clientWidth;
  }

  get height() {
    return this[ELEMENT].clientHeight;
  }

  render(buttons) {
    this[ELEMENT].children
      ::filter(element => !buttons::contains(button => button.id === element.id))
      ::forEach(λ.remove());
    buttons::forEach(button => {
      if (button.element.parentNode !== this.element) {
        this[ELEMENT].appendChild(button.element);
      }
    });
  }
}
