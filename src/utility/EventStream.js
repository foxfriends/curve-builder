import { callWith } from './Functional';

const [ACCEPTORS] = Symbol.generate('ACCEPTORS');

export class EventStream {
  constructor() {
    this[ACCEPTORS] = [];
  }

  emit(event) {
    this[ACCEPTORS].forEach(callWith(event));
    this[ACCEPTORS] = [];
  }

  async *[Symbol.asyncIterator]() {
    yield this.current;
    for (;;) {
      yield new Promise(::this[ACCEPTORS].push);
    }
  }
}
