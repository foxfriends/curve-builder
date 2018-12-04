export async function * event(eventName) {
  let next;
  this.addEventListener(eventName, event => next(event));
  for (;;) {
    yield new Promise(resolve => next = resolve);
  }
}

export async function * enumerate() {
  let i = 0;
  for await (const element of this) {
    yield [i++, element];
  }
}

export async function * map(transform) {
  for await (const element of this) {
    yield transform(element);
  }
}

export async function * filter(keep) {
  for await (const element of this)
    if (await keep(element))
      yield element;
}

export async function forEach(handler) {
  for await (const element of this) {
    handler(element);
  }
}

export async function * tap(handler) {
  for await (const element of this) {
    await handler(element);
    yield element;
  }
}

export async function * skip(count) {
  for await (const element of this) {
    if (count > 0) {
      --count;
    } else {
      yield element;
    }
  }
}
