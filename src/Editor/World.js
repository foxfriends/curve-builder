import { map, mapWith, flatMap, filter, filterMap, forEach, extend, nth, find, findIndex, collect } from '../utility/Iterator';
import { createElement, setAttribute } from '../utility/Svg';
import { _, λ } from '../utility/Keypath';
import { Option, maybe, None, Some } from '../utility/Option';
import { Line, Move } from './Node';
import { Path } from './Path';

const [PATHS, PATH_FOCUS, NODE_FOCUS, EDGE_FOCUS, PATH_ACTIVE, NODE_ACTIVE, EDGE_ACTIVE] = Symbol.generate();

export class World {
  constructor(basis = None) {
    basis.match({
      None: () => {
        this[PATHS] = [];
        this[PATH_FOCUS] = None;
        this[NODE_FOCUS] = None;
        this[EDGE_FOCUS] = None;
        this[PATH_ACTIVE] = None;
        this[NODE_ACTIVE] = None;
        this[EDGE_ACTIVE] = None;
      },
      Some: (basis) => {
        this[PATHS] = [...basis[PATHS]];
        this[PATH_FOCUS] = basis[PATH_FOCUS];
        this[NODE_FOCUS] = basis[NODE_FOCUS];
        this[EDGE_FOCUS] = basis[EDGE_FOCUS];
        this[PATH_ACTIVE] = basis[PATH_ACTIVE];
        this[NODE_ACTIVE] = basis[NODE_ACTIVE];
        this[EDGE_ACTIVE] = basis[EDGE_ACTIVE];
      }
    });
  }

  get pathFocus() {
    return this[PATH_FOCUS]
      ::map(index => this[PATHS][index])
      ::collect(Option);
  }

  get nodeFocus() {
    return this[NODE_FOCUS].and(this.pathFocus)
      ::flatMap(([index, path]) => path.nodes::nth(index))
      ::collect(Option);
  }

  get edgeFocus() {
    return this[EDGE_FOCUS].and(this.pathFocus)
      ::flatMap(([index, path]) => path.edges::nth(index))
      ::collect(Option);
  }

  get pathActive() {
    return this[PATH_ACTIVE]
      ::map(index => this[PATHS][index])
      ::collect(Option);
  }

  get nodeActive() {
    return this[NODE_ACTIVE].and(this.pathActive)
      ::flatMap(([index, path]) => path.nodes::nth(index))
      ::collect(Option);
  }

  get edgeActive() {
    return this[EDGE_ACTIVE].and(this.pathActive)
      ::flatMap(([index, path]) => path.edges::nth(index))
      ::collect(Option);
  }

  get canAppend() {
    return this.nodeFocus.and(this.pathFocus)
      ::map(([node, path]) => path.isEnd(node) || path.isStart(node))
      ::collect(Option)
      .valueOr(false);
  }

  closePath() {
    return this.pathFocus
      ::filter(path => !path.isClosed)
      ::filter(path => path.length > 1)
      ::map(path => {
        const clone = new World(Some(this));
        clone[PATHS][clone[PATH_FOCUS].valueOf()] = path.closed();
        return clone;
      })
      ::collect(Option)
      .valueOr(this);
  }

  startPath(x, y) {
    const path = new Path(None, Some(new Move(x, y)));
    const clone = new World(Some(this));
    clone[PATH_ACTIVE] = clone[PATH_FOCUS] = Some(clone[PATHS].length);
    clone[NODE_ACTIVE] = clone[NODE_FOCUS] = Some(0);
    clone[PATHS].push(path);
    return clone;
  }

  appendNode(newNode) {
    return this.nodeFocus.and(this.pathFocus)
      ::filterMap(([node, path]) => {
        if (path.isEnd(node)) {
          const clone = new World(Some(this));
          clone[PATHS][clone[PATH_FOCUS].valueOf()] = path.append(newNode);
          clone[NODE_ACTIVE] = clone[NODE_FOCUS] = clone[NODE_FOCUS]
            ::map(index => index + 1)
            ::collect(Option);
          clone[PATH_ACTIVE] = clone[PATH_FOCUS];
          return Some(clone);
        } else if (path.isStart(node)) {
          const clone = new World(Some(this));
          clone[PATHS][clone[PATH_FOCUS].valueOf()] = path.prepend(newNode);
          clone[NODE_ACTIVE] = clone[NODE_FOCUS];
          clone[PATH_ACTIVE] = clone[PATH_FOCUS];
          return Some(clone);
        }
        return None;
      })
      ::collect(Option)
      .valueOrElse(() => this.startPath(...newNode.point));
  }

  dragNode(x, y) {
    return this.nodeActive.and(this.pathActive)
      ::map(([node, path]) => {
        const clone = new World(Some(this));
        clone[PATHS][clone[PATH_ACTIVE].valueOf()] = path.moveNode(node, x, y);
        return clone;
      })
      ::collect(Option)
      .valueOr(this);
  }

  deleteNode() {
    return this.nodeFocus.and(this.pathFocus)
      ::map(([node, path]) => {
        const clone = new World(Some(this));
        const newPaths = path.deleteNode(node);
        clone[PATHS].splice(this[PATH_FOCUS].valueOf(), 1, ...newPaths);
        if (newPaths.length === 0) {
          clone[PATH_FOCUS] = None;
          clone[NODE_FOCUS] = None;
        } else {
          clone[NODE_FOCUS] = clone[NODE_FOCUS]
            ::map(index => Math.max(0, index - 1))
            ::map(index => (index === 0 || index === newPaths[0].length - 1)
              ? index
              : (newPaths[0].length - 1)
            )
            ::collect(Option);
        }
        return clone;
      })
      ::collect(Option)
      .valueOr(this);
  }

  focus(id) {
    return this[PATHS]
      ::findIndex(λ.contains(id))
      ::map(index => {
        const clone = new World(Some(this));
        clone[PATH_FOCUS] = Some(index);
        clone[NODE_FOCUS] = clone.pathFocus.valueOf().node(id);
        clone[EDGE_FOCUS] = clone.pathFocus.valueOf().edge(id);
        return clone;
      })
      ::collect(Option)
      .valueOr(this);
  }

  activate(id) {
    const clone = new World(Some(this.focus(id)));
    clone[PATH_ACTIVE] = clone[PATH_FOCUS];
    clone[NODE_ACTIVE] = clone[NODE_FOCUS];
    clone[EDGE_ACTIVE] = clone[EDGE_FOCUS];
    return clone;
  }

  blur() {
    if (this[PATH_FOCUS].or(this[NODE_FOCUS]).or(this[EDGE_FOCUS]).isSome) {
      const clone = new World(Some(this));
      clone[PATH_FOCUS] = None;
      clone[NODE_FOCUS] = None;
      clone[EDGE_FOCUS] = None;
      return clone;
    }
    return this;
  }

  deactivate() {
    if (this[PATH_ACTIVE].or(this[NODE_ACTIVE]).or(this[EDGE_ACTIVE]).isSome) {
      const clone = new World(Some(this));
      clone[PATH_ACTIVE] = None;
      clone[NODE_ACTIVE] = None;
      clone[EDGE_ACTIVE] = None;
      return clone;
    }
    return this;
  }

  render(svg) {
    const focusContainer = maybe(svg.querySelector('.focus'));
    this.pathFocus.and(this.nodeFocus).match({
      None: () => focusContainer::forEach(λ.remove()),
      Some: ([path, node]) => focusContainer
        .orElse(() => svg
          ::createElement('g')
          ::setAttribute('class', 'focus')
        )
        ::forEach(container => path.renderFocus(container, node))
    });

    const paths = svg.querySelectorAll(':scope > .path');
    paths
      ::filter(element => !this[PATHS].find(path => path.id === element.id))
      ::forEach(λ.remove());
    this[PATHS]
      ::mapWith(path => paths::find(element => element.id === path.id).valueOrElse(() => svg
        ::createElement('g')
        ::setAttribute('id', path.id)
        ::setAttribute('class', 'path')
      ))
      ::forEach(([path, element]) => path.render(element));
  }
}
