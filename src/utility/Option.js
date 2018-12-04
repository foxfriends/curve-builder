import { nth } from './Iterator';
const [CASE, ELEMENT, SOME, NONE, NO_ELEMENT] = Symbol.generate('CASE', 'ELEMENT', 'SOME', 'NONE', 'NO_ELEMENT');

export class UnwrapError extends Error {
  constructor() {
    super("Tried to unwrap `Option`, but found `None`");
  }
}

export class Option {
  static fromIter(iter) {
    return iter::nth(0);
  }

  valueOr(alternative) {
    if (this[CASE] === NONE) { return alternative; }
    return this[ELEMENT];
  }

  valueOrElse(alternative) {
    if (this[CASE] === NONE) { return alternative(); }
    return this[ELEMENT];
  }

  valueOf() {
    if (this[CASE] === NONE) { throw new UnwrapError(); }
    return this[ELEMENT];
  }

  constructor(element = NO_ELEMENT) {
    this[CASE] = element === NO_ELEMENT ? NONE : SOME;
    this[ELEMENT] = element;
  }

  get isNone() { return this[CASE] === NONE; }
  get isSome() { return this[CASE] === SOME; }

  and(other) {
    if (this.isSome && other.isSome) {
      return Some([this.valueOf(), other.valueOf()]);
    }
    return None;
  }

  or(alternative) {
    return this.isSome ? this : maybe(alternative);
  }

  orElse(alternative) {
    return this.isSome ? this : maybe(alternative());
  }

  match({ Some, None }) {
    return this.isSome ? Some(this[ELEMENT]) : None();
  }

  toString() {
    return this.match({
      None: () => 'None',
      Some: (value) => `Some(${value})`,
    });
  }

  *[Symbol.iterator]() {
    if (this.isSome) {
      yield this[ELEMENT];
    }
  }
}

export const None = new Option();
export const Some = element => new Option(element);

export const maybe = element => {
  if (element instanceof Option) { return element; }
  if (element === null || element === undefined) { return None; }
  return Some(element);
}
