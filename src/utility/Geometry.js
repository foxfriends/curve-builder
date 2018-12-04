export class NoIntersection extends Error {
  constructor() {
    super('Lines do not intersect');
  }
}

export class Point {
  static get origin() { return new Point(0, 0); }

  constructor(x, y) {
    this.x = Math.round(x);
    this.y = Math.round(y);
  }

  reflectOver({ x, y }) {
    return new Point(
      2 * x - this.x,
      2 * y - this.y,
    );
  }

  mirrorTowards(target, around) {
    const line = Line.solve(target, around);
    const perp = line.perpendicular(around);
    const axis = perp.perpendicular(this);
    return this.reflectOver(axis.intersection(perp));
  }

  follow(from, to) {
    return new Point(
      this.x + to.x - from.x,
      this.y + to.y - from.y,
    );
  }

  distanceTo({ x, y }) {
    return Math.sqrt((this.x - x) ** 2 + (this.y - y) ** 2);
  }

  equals({ x, y }) {
    return this.x === x && this.y === y;
  }

  *[Symbol.iterator]() {
    yield this.x;
    yield this.y;
  }
}

export class Line {
  static solve(start, end) {
    if (end.x === start.x) {
      return new Line(Infinity, start.x);
    }
    const m = (end.y - start.y) / (end.x - start.x);
    const b = start.y - m * start.x;
    return new Line(m, b);
  }

  static radial(m, { x, y }) {
    if (Math.abs(m) === Infinity) {
      return new Line(Infinity, x);
    }
    const b = y - m * x;
    return new Line(m, b);
  }

  constructor(m, b) {
    this.m = m;
    this.b = b;
  }

  at(x) {
    return this.m * x + this.b;
  }

  inverse(y) {
    return (y - this.b) / this.m;
  }

  perpendicular(cross) {
    return Line.radial(-1 / this.m, cross);
  }

  intersection(other) {
    if (this.m === other.m) {
      throw new NoIntersection;
    }
    if (Math.abs(this.m) === Infinity) {
      return new Point(this.b, other.at(this.b));
    } else if (Math.abs(other.m) === Infinity) {
      return new Point(other.b, this.at(other.b));
    } else if (this.m === 0) {
      return new Point(other.inverse(this.b), this.b);
    } else if (other.m === 0) {
      return new Point(this.inverse(other.b), other.b);
    }

    const ratio = other.m / this.m;
    const y = (other.b - ratio * this.b) / (1 - ratio);
    return new Point(this.inverse(y), y);
  }

  *[Symbol.iterator]() {
    yield this.start;
    yield this.end;
  }
}
