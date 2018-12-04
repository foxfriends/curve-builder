const [START, END] = Symbol.generate('START', 'END');

export class Edge {
  constructor(start, end) {
    this[START] = start;
    this[END] = end;
  }

  get start() { return this[START]; }
  get end() { return this[END]; }
  get id() { return `${this.start.id}_${this.end.id}`; }

  toString() {
    return `M${this.start.x},${this.start.y} ${this.end.toString()}`;
  }

  render() {}
  renderFocus() {}
}
