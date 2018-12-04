export function add(a) { return b => b + a; }
export function sub(a) { return b => b - a; }
export function mul(a) { return b => b * a; }
export function div(a) { return b => b / a; }
export function mod(a) { return b => b % a; }
export function pow(a) { return b => b ** a; }
export function eq(a) { return b => a === b; }
export function ne(a) { return b => a !== b; }
export function and(a) { return b => a && b; }
export function or(a) { return b => a || b; }
export function not() { return a => !a; }
export function lt(a) { return b => b < a; }
export function le(a) { return b => b <= a; }
export function gt(a) { return b => b > a; }
export function ge(a) { return b => b >= a; }
export function band(a) { return b => a & b; }
export function bor(a) { return b => a | b; }
export function xor(a) { return b => a ^ b; }
export function inv() { return a => ~a; }
export function lsh(a) { return b => b << a; }
export function rsh(a) { return b => b >> a; }
export function zrsh(a) { return b => b >>> a; }
export function del(key) { return obj => delete obj[key]; }
export function instanceOf(Type) { return obj => obj instanceof Type; }
export function type() { return obj => typeof obj; }
export function hasKey(key) { return obj => key in obj; }
