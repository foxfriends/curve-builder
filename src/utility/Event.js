import { map, fold } from './Iterator';
import { bor } from './Operator';
import { uncurry } from './Functional';

export const Mouse = {
  Left: 0,
  Right: 1,
  Middle: 2,
  Back: 3,
  Forward: 4,

  mask(...buttons) {
    return buttons::map(x => 1 << x)::fold(0, uncurry(bor));
  }
};

export const Key = {
  name({ key, ctrlKey }) {
    return `${ctrlKey ? '^' : ''}${key}`;
  }
};
