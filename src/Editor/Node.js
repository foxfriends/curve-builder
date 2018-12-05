import { _, λ } from '../utility/Keypath';
import { map, filter, nth, forEach, collect } from '../utility/Iterator';
import { Option, None, Some, maybe } from '../utility/Option';
import { createElement, setAttribute } from '../utility/Svg';
import { Point } from '../utility/Geometry';

const [KEY, TYPE, POINTS] = Symbol.generate('KEY', 'TYPE', 'POINTS');

let nodeKey = 0;
export class Node {
  constructor(type, ...points) {
    this[KEY] = `node-${nodeKey++}`;
    this[TYPE] = type;
    this[POINTS] = points::map(Math.floor)::collect(Array);
  }

  get id() {
    return this[KEY];
  }

  toString() {
    return `${this[TYPE]}${this[POINTS].join(',')}`;
  }

  get point() { return new Point(this.x, this.y); }

  render(group) {
    maybe(group.querySelector('.node'))
      .orElse(() => group
        ::createElement('circle')
        ::setAttribute('r', 4)
        ::setAttribute('class', 'node')
      )
      ::forEach(circle => circle
        ::setAttribute('cx', this.x)
        ::setAttribute('cy', this.y)
      );
  }
}

export class Move extends Node {
  constructor(x, y) {
    super('M', x, y);
  }

  move({ x, y }) { return new Move(x, y); }
  get x() { return this[POINTS][0]; }
  get y() { return this[POINTS][1]; }
}

export class Line extends Node {
  constructor(x, y) {
    super('L', x, y);
  }

  move({ x, y }) { return new Line(x, y); }
  get control2() { return this.point; }
  get x() { return this[POINTS][0]; }
  get y() { return this[POINTS][1]; }
}

export class Cubic extends Node {
  constructor(cx1, cy1, cx2, cy2, ex, ey) {
    super('C', cx1, cy1, cx2, cy2, ex, ey);
  }

  move({ x, y }) { return new Cubic(...this.control1, ...this.control2.follow(this.point, new Point(x, y)), x, y); }
  get control1() { return new Point(this[POINTS][0], this[POINTS][1]); }
  get control2() { return new Point(this[POINTS][2], this[POINTS][3]); }
  get x() { return this[POINTS][4]; }
  get y() { return this[POINTS][5]; }
}

export class ContinueCubic extends Node {
  constructor(cx2, cy2, ex, ey) {
    super('S', cx2, cy2, ex, ey);
  }

  move({ x, y }) { return new ContinueCubic(...this.control2.follow(this.point, new Point(x, y)), x, y); }
  get control2() { return new Point(this[POINTS][0], this[POINTS][1]); }
  get x() { return this[POINTS][2]; }
  get y() { return this[POINTS][3]; }
}

export class Quadratic extends Node {
  constructor(cx2, cy2, ex, ey) {
    super('Q', cx2, cy2, ex, ey);
  }

  move({ x, y }) { return new Quadratic(...this.control1, x, y); }
  get control1() { return new Point(this[POINTS][0], this[POINTS][1]); }
  get control2() { return this.control1; }
  get x() { return this[POINTS][2]; }
  get y() { return this[POINTS][3]; }
}

export class ContinueQuadratic extends Node {
  constructor(ex, ey) {
    super('T', ex, ey);
  }

  move({ x, y }) { return new ContinueQuadratic(x, y); }
  get x() { return this[POINTS][0]; }
  get y() { return this[POINTS][1]; }
}

export class Arc extends Node {
  constructor(rx, ry, rotation, arc, sweep, ex, ey) {
    super('A', rx, ry, rotation, arc, sweep, ex, ey);
  }

  move({ x, y }) { return new Arc(...this[POINTS].slice(0, 5), x, y); }

  get xRadius() { return this[POINTS][0]; }
  get yRadius() { return this[POINTS][1]; }

  get rotation() { return this[POINTS][2]; }
  get arc() { return this[POINTS][3]; }
  get sweep() { return this[POINTS][4]; }

  get x() { return this[POINTS][5]; }
  get y() { return this[POINTS][6]; }
}
