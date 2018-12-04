import { _ } from './Keypath';
import { maybe } from './Option';
import { id } from './Functional';
import { add } from './Operator';

// Creation

export function * of(...elements) {
  yield * elements;
}

export function * zip(...others) {
  const all = [this, ...others].map(iter => iter[Symbol.iterator]());
  for (;;) {
    const nexts = all.map(iter => iter.next());
    if (nexts.some(_.done)) { return; }
    yield nexts.map(_.value);
  }
}

export function chain(...others) {
  return [this, ...others]::flatten();
}

// Operators

export function * flatMap(transform) {
  for (const element of this) {
    yield* transform(element);
  }
}

export function * map(transform) {
  for (const element of this) yield transform(element);
}

export function mapWith(transform) {
  return this::map(x => [x, transform(x)]);
}

export function flatten() {
  return this::flatMap(id);
}

export function * filter(keep) {
  for (const element of this)
    if (keep(element))
      yield element;
}

export function * filterMap(transform) {
  for (const element of this) {
    const transformed = element |> transform |> maybe;
    if (transformed.isSome) yield transformed.valueOf();
  }
}

export function * enumerate() {
  let i = 0;
  for (const element of this) {
    yield [i++, element];
  }
}

// Access

export function * skip(count) {
  for (const element of this) {
    if (count > 0) {
      --count;
    } else {
      yield element;
    }
  }
}

export function * take(count) {
  for (const element of this) {
    if (count > 0) {
      --count;
      yield element;
    }
  }
}

export function nth(n) {
  const [element] = this::skip(n)::take(1);
  return maybe(element);
}

export function last() {
  const array = this::collect(Array);
  return maybe(array[array.length - 1]);
}

// Consumption

export function * scan(init, acc) {
  for (const element of this) {
    yield init = acc(init, element);
  }
}

export function fold(init, acc) {
  for (const element of this) {
    init = acc(init, element);
  }
  return init;
}

export function find(keep) {
  return this::filter(keep)::nth(0);
}

export function contains(pred) {
  return this::find(pred).isSome;
}

export function findIndex(keep) {
  return this
    ::enumerate()
    ::filter(([_, item]) => keep(item))
    ::map(_[0])
    ::nth(0);
}

export function count() {
  return this::fold(0, c => c + 1);
}

export function forEach(handler) {
  for (const element of this) {
    handler(element);
  }
}

export function collect(Type) {
  return Type.fromIter(this);
}

export function * tap(handler) {
  for (const element of this) {
    handler(element);
    yield element;
  }
}

Array.fromIter = iter => [...iter];
Map.fromIter = iter => new Map(iter);
Set.fromIter = iter => new Set(iter);
String.fromIter = iter => new String([...iter].join());
