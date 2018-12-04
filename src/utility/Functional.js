export function id(x) { return x; }
export function compose(fn = id, ...rest) {
  return (...args) => fn(compose(...rest)(...args));
}
export function flip(fn) { return a => b => fn(b)(a); }
export function uncurry(fn) { return (a, b) => fn(a)(b); }
export function curry(fn, n = fn.length) {
  if (n === 0) { return fn; }
  const step = (...args) => a => {
    return args.length === n - 1
      ? fn(...args, a)
      : step(...args, a);
  }
  return step();
}
export function callWith(...args) { return fn => fn(...args); }
export function print(v) {
  console.log(v);
  return v;
}
