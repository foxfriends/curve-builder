import { of, zip, chain, map, flatMap, mapWith, enumerate, filter, forEach, skip, last, find, contains, findIndex, collect } from '../utility/Iterator';
import { createElement, setAttribute, toggleClass } from '../utility/Svg';
import { _, λ } from '../utility/Keypath';
import { Option, None, Some, maybe } from '../utility/Option';
import { Node, Move, Line, ContinueCubic, Cubic, ContinueQuadratic, Quadratic } from './Node';
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

  firstControlPoint(index) {
    return maybe(this[NODES][index].control1)
      .valueOrElse(() => this.nextControlPoint(index - 1))
  }

  secondControlPoint(index) {
    if (index <= 0) {
      return this[NODES][0].point;
    }
    return maybe(this[NODES][index].control2)
      .valueOrElse(() => this.nextControlPoint(index - 1));
  }

  previousControlPoint(node) {
    let index = node;
    if (typeof node === 'number') {
      node = this[NODES][index];
    } else {
      index = this[NODES].indexOf(node);
    }
    return this.firstControlPoint(index).reflectOver(node.point);
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

  moveControl(node, control, x, y) {
    return maybe(this[NODES].indexOf(node))
      ::flatMap(index => {
        const clone = new Path(Some(this));
        if (control === 1 && node.control1) {
          clone[NODES][index] = node.moveControl1(new Point(x, y));
          return Some(clone);
        } else if (control === 2 && node.control2) {
          clone[NODES][index] = node.moveControl2(new Point(x, y));
          return Some(clone);
        }
        return None;
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
    const path = maybe(group.querySelector('.path')).valueOrElse(() => group
      ::createElement('path')
      ::setAttribute('class', 'path')
    );
    path::setAttribute('d', this.toString());

    const nodes = group.querySelectorAll(':scope > .node');
    nodes
      ::filter(element => !this.nodes::contains(node => node.id === element.id))
      ::forEach(λ.remove());
    this.nodes
      ::mapWith(node => nodes::find(element => element.id === node.id).valueOrElse(() => group
        ::createElement('g')
        ::setAttribute('id', node.id)
        ::setAttribute('class', 'node')
      ))
      ::forEach(([node, element]) => {
        node.render(element);
        element.classList.toggle('end', this.isEnd(node));
      });
  }

  renderFocus(element, node) {
    const index = this[NODES].indexOf(node);
    const previous = maybe(this[NODES][index - 1]);
    const next = maybe(this[NODES][index + 1]);

    maybe(element.querySelector(':scope > .highlight'))
      .orElse(() => element
        ::createElement('circle')
        ::setAttribute('r', 8)
        ::setAttribute('class', 'highlight')
      )
      ::forEach(element => element
        ::setAttribute('cx', node.x)
        ::setAttribute('cy', node.y)
      );

    const previousControlElement = maybe(element.querySelector(':scope > .control.previous'));
    const nextControlElement = maybe(element.querySelector(':scope > .control.next'));
    const createControl = className => () => element::createElement('g')::setAttribute('class', `control ${className}`);

    switch (node.constructor) {
    case ContinueCubic:
    case ContinueQuadratic:
      this.renderControl(
        previousControlElement.valueOrElse(createControl('previous')),
        this.firstControlPoint(index),
        previous.valueOf().point,
        true,
        false,
      );
      break;
    case Cubic:
    case Quadratic:
      this.renderControl(
        previousControlElement.valueOrElse(createControl('previous')),
        this.firstControlPoint(index),
        previous.valueOf().point,
      );
      break;
    default:
      previousControlElement::forEach(λ.remove());
    }

    switch (node.constructor) {
    case ContinueCubic:
    case ContinueQuadratic:
    case Cubic:
    case Quadratic:
      this.renderControl(
        nextControlElement.valueOrElse(createControl('next')),
        this.secondControlPoint(index),
        node.point,
        next
          ::map(next => next instanceof ContinueQuadratic || next instanceof ContinueCubic)
          ::collect(Option)
          .valueOr(false),
        !!node.control2,
      );
      break;
    default:
      nextControlElement::forEach(λ.remove());
    }
  }

  renderControl(element, control, anchor, reflect = false, owned = true) {
    maybe(element.querySelector(':scope > .line.primary'))
      .orElse(() => element
        ::createElement('line')
        ::setAttribute('class', 'line primary')
      )
      ::forEach(line => line
        ::setAttribute('x1', control.x)
        ::setAttribute('y1', control.y)
        ::setAttribute('x2', anchor.x)
        ::setAttribute('y2', anchor.y)
      );
    maybe(element.querySelector(':scope > .control.primary'))
      .orElse(() => element
        ::createElement('circle')
        ::setAttribute('r', 4)
        ::setAttribute('class', `control primary`)
      )
      ::forEach(circle => circle
        ::setAttribute('cx', control.x)
        ::setAttribute('cy', control.y)
        ::toggleClass('owned', owned)
      );
    if (reflect) {
      const reflected = control.reflectOver(anchor);
      maybe(element.querySelector(':scope > .line.secondary'))
        .orElse(() => element
          ::createElement('line')
          ::setAttribute('class', 'line secondary')
        )
        ::forEach(line => line
          ::setAttribute('x1', reflected.x)
          ::setAttribute('y1', reflected.y)
          ::setAttribute('x2', anchor.x)
          ::setAttribute('y2', anchor.y)
        );
      maybe(element.querySelector(':scope > .control.secondary'))
        .orElse(() => element
          ::createElement('circle')
          ::setAttribute('r', 4)
          ::setAttribute('class', 'control secondary')
        )
        ::forEach(circle => circle
          ::setAttribute('cx', reflected.x)
          ::setAttribute('cy', reflected.y)
        );
    } else {
      element.querySelectorAll(':scope > .secondary')
        ::forEach(λ.remove())
    }
  }
}
