# Event Stream

An `EventStream` is an object that represents a stream of events. It is similar to a standard
`EventEmitter`, but rather than emitting events into listener callbacks, it turns them into an
asynchronous iterator which can be subscribed to, to provide a more reactive, functional approach.

Internally, it tracks a list of listeners (called "acceptors"), who subscribe via the
`Symbol.asyncIterator` method. When an event is emitted (by the implementer internally calling the
`emit` method), the event is sent into the `asyncIterator` via a `Promise`, and is then yielded to
the subscribers.

As a bit of a hack, the `EventStream` implementer may define a `current` property, which is emitted
immediately when a new subscriber arrives.

```js
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
    if (this.current) { yield this.current; }
    for (;;) {
      yield new Promise(::this[ACCEPTORS].push);
    }
  }
}
```
