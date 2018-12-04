import { of, zip, chain, map, mapWith, enumerate, filter, forEach, skip, last, find, contains, findIndex, collect } from '../utility/Iterator';
import { createElement, setAttribute, toggleClass } from '../utility/Svg';
import { _, λ } from '../utility/Keypath';
import { Option, None, Some, maybe } from '../utility/Option';
import { Node, Move, Line } from './Node';
import { Edge } from './Edge';
import { Point } from '../utility/Geometry';

const [KEY, NODES, CLOSED] = Symbol.generate('KEY', 'NODES', 'CLOSED');

class UnresolvablePoint extends Error {
  constructor() {
    super('Cannot resolve `point` of `Node`');
  }
}

class NonexistentFocus extends Error {
  constructor() {
    super('Focused `Node` does not exist in this `Path`');
  }
}

let pathKey = 0;
export class Path {
  constructor(basis = None, node = None) {
    basis.match({
      None: () => {
        this[CLOSED] = false;
        this[KEY] = `path-${pathKey++}`;
        this[NODES] = [...node];
      },
      Some: (basis) => {
        this[CLOSED] = basis[CLOSED];
        this[KEY] = basis[KEY];
        this[NODES] = [...basis[NODES], ...node];
      }
    });
  }

  get isClosed() {
    return this[CLOSED];
  }

  get id() {
    return this[KEY];
  }

  get length() {
    return this[NODES].length;
  }

  // firstControlPoint(index) {
  //   return maybe(this[NODES][index].control1)
  //     .valueOrElse(() => this.previousControlPoint(index + 1))
  // }

  secondControlPoint(index) {
    // eventually converges: the first node has the trivial `control2` point.
    return maybe(this[NODES][index].control2)
      .valueOrElse(() => this.nextControlPoint(index - 1));
  }

  nextControlPoint(node) {
    let index = node;
    if (typeof node === 'number') {
      node = this[NODES][index];
    } else {
      index = this[NODES].indexOf(node);
    }
    return this.secondControlPoint(index).reflectOver(node.point);
  }

  isStart(node) {
    return this[NODES][0] === node && !this.isClosed;
  }

  isEnd(node) {
    return this[NODES][this[NODES].length - 1] === node && !this.isClosed;
  }

  contains(id) {
    return this.nodes
      ::chain(this.edges)
      ::find(node => node.id === id)
      .isSome;
  }

  append(node) {
    const clone = new Path(Some(this));
    clone[NODES].push(node);
    return clone;
  }

  prepend(node) {
    const clone = new Path(Some(this));
    const oldPosition = clone[NODES][0].point;
    const { x, y } = node.point;
    clone[NODES][0] = node.move(oldPosition);
    clone[NODES].unshift(new Move(x, y));
    return clone;
  }

  closed() {
    if (this.isClosed || this.length === 1) { return this; }
    const clone = new Path(Some(this));
    clone[CLOSED] = true;
    return clone;
  }

  moveNode(node, x, y) {
    return maybe(this[NODES].indexOf(node))
      ::map(index => {
        const clone = new Path(Some(this));
        clone[NODES][index] = node.move(new Point(x, y));
        return clone;
      })
      ::collect(Option)
      .valueOr(this);
  }

  deleteNode(node) {
    return maybe(this[NODES].indexOf(node))
      ::map(index => {
        if (index === 0) {
          if (this[NODES].length === 1) { return []; }
          const clone = new Path(Some(this));
          clone[NODES][1] = clone[NODES][0].move(clone[NODES][1].point);
          clone[NODES].shift();
          clone[CLOSED] = false;
          return [clone];
        } else if (index === this[NODES].length - 1) {
          const clone = new Path(Some(this));
          clone[NODES].pop();
          clone[CLOSED] = false;
          return [clone];
        } else if (this.isClosed) {
          const clone = new Path(Some(this));
          const left = clone[NODES].slice(0, index);
          const right = clone[NODES].slice(index + 1);
          left[0] = new Line(...left[0].point);
          right[0] = new Move(...right[0].point);
          clone[NODES] = [...right, ...left];
          clone[CLOSED] = false;
          return [clone];
        } else {
          const left = new Path(Some(this));
          left[NODES] = left[NODES].slice(0, index);
          const right = new Path();
          right[NODES] = this[NODES].slice(index + 1);
          right[NODES][0] = new Move(...right[NODES][0].point)
          return [left, right];
        }
      })
      ::collect(Option)
      .valueOr([this])
  }

  node(id) {
    return this.nodes::findIndex(node => node.id === id);
  }

  edge(id) {
    return this.edges::findIndex(edge => edge.id === id);
  }

  get nodes() {
    return this[NODES];
  }

  get edges() {
    return this[NODES]
      ::zip(this[NODES]::skip(1))
      ::map(([start, end]) => new Edge(start, end))
      ::chain(
        this.isClosed
          ? of(new Edge(this[NODES][this[NODES].length - 1], this[NODES][0]))
          : of()
      )
  }

  toString() {
    return this[NODES].map(λ.toString()).join(' ') + (this.isClosed ? 'Z' : '');
  }

  render(group) {
    const path = maybe(group.querySelector('.path')).valueOrElse(() => {
      const path = createElement('path')
        ::setAttribute('class', 'path');
      group.appendChild(path);
      return path;
    });
    path::setAttribute('d', this.toString());

    const nodes = group.querySelectorAll(':scope > .node');
    nodes
      ::filter(element => !this.nodes::contains(node => node.id === element.id))
      ::forEach(λ.remove());
    this.nodes
      ::mapWith(node => nodes::find(element => element.id === node.id).valueOrElse(() => {
        const element = createElement('g')
          ::setAttribute('id', node.id)
          ::setAttribute('class', 'node');
        group.appendChild(element);
        return element;
      }))
      ::forEach(([node, element]) => {
        node.render(element);
        element.classList.toggle('end', this.isEnd(node));
      });
  }
}
