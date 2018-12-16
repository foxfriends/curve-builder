# State Stack

The `StateStack` records all changes in state, providing the ability to undo and redo actions, or
cancel actions that are currently in progress. It then uses an `EventStream` to notify any watchers
of changes to the state.

```js
import { EventStream } from '../utility/EventStream';
==> Global symbols.
export class StateStack extends EventStream {
  ==> StateStack methods.
  ==> StateStack properties.
}
```

## Designing the `StateStack`

First, consider the methods we wish to provide. The `StateStack` needs to be able to undo and redo
actions. To provide the cancellation behaviour, where "in progress" actions are to be discarded, we
must provide a means to commit or discard that state.

We also need a way to provide the initial state, and then perform new actions to compute the next
state.

Lastly, we provide a convenience method to refresh the current state.

```js - StateStack methods
constructor(initial) {
  super();
  ==> StateStack constructor.
}

undo() {
  ==> Undo implementation.
}

redo() {
  ==> Redo implementation.
}

commit() {
  ==> Commit the current action.
}

discard() {
  ==> Discard the action in progress.
}

do(action) {
  ==> Do implementation.
}

refresh() { super.emit(this[TRANSIENT]); }
```

Clearly, we need two stacks for the undo and redo, as well as a way to track the current state --
let's call this current state the "committed" state. Then to track an action in progress, we must
record the "transient" state of that action.

To provide some simulation of a "private" member, define symbols for these properties.

```js - Global symbols
const COMMIT = Symbol('COMMIT');
const TRANSIENT = Symbol('TRANSIENT');
const UNDO = Symbol('UNDO');
const REDO = Symbol('REDO');
```

```js - StateStack constructor
this[COMMIT] = initial;
this[TRANSIENT] = initial;
this[UNDO] = [];
this[REDO] = [];
```

## The current state

At any time, the transient state then is the most up-to-date one, so let's expose the current state
to the public.

```js - StateStack properties
get current() {
  return this[TRANSIENT];
}
```

Since we are emitting updates to this `current` state via the `EventStream`, we'll also write a
setter to make sure that we remember to refresh state whenever it changes.

```js - StateStack properties
set current(newValue) {
  this[TRANSIENT] = newValue;
  this.refresh();
}
```

We can then easily provide the means to commit or discard the current transient state.

```js - Commit the current action
this[COMMIT] = this.current;
```

```js - Discard the action in progress
if (this.current !== this[COMMIT]) {
  this.current = this[COMMIT];
}
```

## Undo and Redo

To implement undo is simple enough -- we simply have to ensure that there is something that can be
undone, and then undo it.

```js - Undo implementation
if (this.canUndo) {
  ==> Undo the action.
}
```

How do we know we can undo something? Simply because there is something in the undo stack:

```js - StateStack properties
get canUndo() {
  return !!this[UNDO].length;
}
```

Then, to actually do an undo, simply move the last committed state into the redo stack (so it can be
redone) and then update the current state to be the previous top of the undo stack. Finally, we
commit this change.

```js - Undo the action
this[REDO].push(this[COMMIT]);
this.current = this[UNDO].pop();
this.commit();
```

Implementing redo is much the same.

```js - StateStack properties
get canRedo() {
  return !!this[REDO].length;
}
```

```js - Redo implementation
if (this.canRedo) {
  this[UNDO].push(this[COMMIT]);
  this.current = this[REDO].pop();
  this.commit();
}
```

## Receiving a new action

Finally, we need to be able to get new states into the `StateStack` by way of actions.

Loosely, an action is a function which transforms the previous state into the next state. An action
can produce a transient state, to indicate that it is in progress still, or it can indicate that it
is completed, and the produced state should be committed.

```js - Do implementation
==> Perform the action transformation, and retrieve the updated state.
==> Check if anything changed.
==> Update the transient state, or commit the updated state.
```

Since an action is a function, it can simply be called with the current state, and return the next
state. However, in order to indicate transient updates versus updates that should be committed, we
provide two signals which the function is expected to call and return. An action can also not return
an update, to indicate no changes should be made.

Note that this is a two-part protocol, and so it is probably not the best design... This is an area
which could be further improved.

```js - Perform the action transformation, and retrieve the updated state
const signalTransient = update => [TRANSIENT, update];
const signalCommit = update => [COMMIT, update];
const [type, updated] = action(this.current, signalTransient, signalCommit) || [TRANSIENT, this.current];
```

To actually update the state, we then check the `type`, and act accordingly.

```js - Update the transient state, or commit the updated state
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
```

The only thing left to watch for is that we don't want to keep emitting the same state if the action
didn't do anything, so there must be a check to see if anything changed.

```js - Check if anything changed
switch (type) {
  case TRANSIENT:
    if (updated === this.current) { return; }
    break;
  case COMMIT:
    if (updated === this[COMMIT]) { return; }
    break;
}
```
