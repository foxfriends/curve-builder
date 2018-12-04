import { Some, None } from '../utility/Option';
import { callWith } from '../utility/Functional';
import { EventStream } from '../utility/EventStream';

const [UNDO, REDO, TRANSIENT, COMMIT] = Symbol.generate('UNDO', 'REDO', 'TRANSIENT', 'COMMIT');

export class StateStack extends EventStream {
  constructor(initial) {
    super();
    this[COMMIT] = initial;
    this[TRANSIENT] = initial;
    this[UNDO] = [];
    this[REDO] = [];
  }

  get current() {
    return this[TRANSIENT];
  }

  set current(value) {
    this[TRANSIENT] = value;
    super.emit(this[TRANSIENT]);
  }

  get canUndo() {
    return this[UNDO].length;
  }

  get canRedo() {
    return this[REDO].length;
  }

  refresh() {
    super.emit(this[TRANSIENT]);
  }

  commit() {
    this[COMMIT] = this[TRANSIENT];
  }

  undo() {
    if (this.canUndo) {
      this[REDO].push(this[COMMIT]);
      this.current = this[UNDO].pop();
      this.commit();
    }
  }

  redo() {
    if (this.canRedo) {
      this[UNDO].push(this[COMMIT]);
      this.current = this[REDO].pop();
      this.commit();
    }
  }

  discard() {
    this.current = this[COMMIT];
  }

  do(action) {
    const [type, updated] = action(this[TRANSIENT], update => [TRANSIENT, update], update => [COMMIT, update]) || [, this.current];
    if (updated === this.current) { return; }
    switch (type) {
      case TRANSIENT:
        this.current = updated;
        break;
      case COMMIT:
        this[UNDO].push(this[COMMIT]);
        this.current = updated;
        this.commit();
        this[REDO] = [];
        break;
    }
  }
}
