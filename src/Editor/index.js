import {
  event,
  skip as skipAsync,
  tap as tapAsync,
  enumerate as enumerateAsync,
  filter as filterAsync,
  map as mapAsync,
  forEach as forEachAsync
} from '../utility/AsyncIterator';
import { of, chain, map, forEach, collect } from '../utility/Iterator';
import { λ } from '../utility/Keypath';
import { Mouse, Key } from '../utility/Event';
import { World } from './World';
import { Move, Line, Cubic, ContinueCubic, Quadratic, ContinueQuadratic, Arc } from './Node';
import { StateStack } from './StateStack';
import { Button } from '../Toolbar/Button';
import { Point } from '../utility/Geometry';

const [SVG, STATE, TOOL] = Symbol.generate('SVG', 'STATE', 'TOOL');

const preventDefault = ['Backspace', '^s', '^d', '^a'];

export class Editor {
  constructor(svg, toolbar) {
    this[SVG] = svg;
    this[STATE] = new StateStack(new World);
    this[TOOL] = Line;

    const tools = [
      [Button.titled('M'), Move],
      [Button.titled('L'), Line],
      [Button.titled('C'), Cubic],
      [Button.titled('S'), ContinueCubic],
      [Button.titled('Q'), Quadratic],
      [Button.titled('T'), ContinueQuadratic],
      [Button.titled('A'), Arc],
    ];
    const undo = Button.titled('Undo');
    undo::forEachAsync(() => this[STATE].undo());
    const redo = Button.titled('Redo');
    redo::forEachAsync(() => this[STATE].redo());
    const close = Button.titled('Close');
    close::forEachAsync(() => this[STATE].do((world, transient, commit) => commit(world.closePath())));

    tools
      ::forEach(([button, tool]) => button
        ::skipAsync(1)
        ::forEachAsync(() => this.tool = tool)
      );

    window
      ::event('keydown')
      ::tapAsync(event => preventDefault.includes(Key.name(event)) && event.preventDefault())
      ::forEachAsync(::this.handleKeyDown);
    this[SVG]
      ::event('mousedown')
      ::mapAsync(::this.parseMouseEvent)
      ::forEachAsync(::this.handleMouseDown);
    this[SVG]
      ::event('mouseup')
      ::mapAsync(::this.parseMouseEvent)
      ::forEachAsync(::this.handleMouseUp);
    this[SVG]
      ::event('mousemove')
      ::mapAsync(::this.parseMouseEvent)
      ::forEachAsync(::this.handleMouseMove);
    this[STATE]
      ::enumerateAsync()
      ::forEachAsync(([generation, world]) => {
        console.log(`Rendering generation ${generation}`);
        world.render(this[SVG]);
        tools
          ::map(([button, tool]) => button.setAttribute('class', tool === this.tool ? 'selected' : ''))
          ::chain(of(
            undo.setAttribute('disabled', !this[STATE].canUndo),
            redo.setAttribute('disabled', !this[STATE].canRedo),
            close,
          ))
          ::collect(Array)
          |> ::toolbar.render;
      });
  }

  get tool() { return this[TOOL]; }
  set tool(newValue) {
    this[TOOL] = newValue;
    this[STATE].refresh();
  }

  get offset() {
    const { top: y, left: x } = this[SVG].getBoundingClientRect();
    return { x, y };
  }

  parseMouseEvent({ clientX, clientY, target, button, buttons }) {
    return {
      x: clientX - this.offset.x,
      y: clientY - this.offset.y,
      target,
      button,
      buttons,
    }
  }

  handleKeyDown(event) {
    switch (Key.name(event)) {
      case 'z':
        this[STATE].do((world, transient, commit) => commit(world.closePath()));
        break;
      case '^z':
        this[STATE].undo();
        break;
      case '^Z':
        this[STATE].redo();
        break;
      case '^y':
        this[STATE].redo();
        break;
      case '^d':
        this[STATE].do((world, transient, commit) => commit(world.blur()));
        break;
      case 'm':
        this.tool = Move;
        break;
      case 'l':
        this.tool = Line;
        break;
      case 'c':
        this.tool = Cubic;
        break;
      case 's':
        this.tool = ContinueCubic;
        break;
      case 'q':
        this.tool = Quadratic;
        break;
      case 't':
        this.tool = ContinueQuadratic;
        break;
      case 'a':
        this.tool = Arc;
        break;
      case 'Delete':
        this[STATE].do((world, transient, commit) => commit(world.deleteNode()));
        break;
      case 'Escape':
        this[STATE].discard();
        break;
    }
  }

  handleMouseDown({ x, y, target, button, buttons }) {
    this[STATE].do((world, transient, commit) => {
      switch (button) {
        case Mouse.Left:
          if (target === svg) {
            const point = new Point(x, y);
            if (this.tool === Move || !world.canAppend) {
              return transient(world.startPath(...point));
            }
            const path = world.pathFocus.valueOf();
            const nodeFocus = world.nodeFocus.valueOf();
            let control = path.isEnd(nodeFocus) ? path.nextControlPoint(nodeFocus) : path.previousControlPoint(nodeFocus);
            let node;
            switch (this.tool) {
              case Line:
              case Arc:
              case ContinueQuadratic:
                node = new this.tool(...point);
                break;
              case ContinueCubic:
                control = control.follow(nodeFocus.point, point).mirrorTowards(control, point);
              case Quadratic:
                node = new this.tool(...control, ...point);
                break;
              case Cubic:
                node = new this.tool(...control, ...control.follow(nodeFocus.point, point).mirrorTowards(nodeFocus.point, point), x, y);
                break;
            }
            return transient(world.appendNode(node));
          }
          while (target && !target.id) {
            target = target.parentNode;
          }
          if (target) {
            return transient(world.activate(target.id));
          }
          break;
      }
    });
  }

  handleMouseUp({ x, y, target, button, buttons }) {
    this[STATE].do((world, transient, commit) => {
      switch (button) {
        case Mouse.Left:
          return commit(world.deactivate());
          break;
      }
    });
  }

  handleMouseMove({ x, y, buttons }) {
    this[STATE].do((world, transient, commit) => {
      if (buttons === Mouse.mask(Mouse.Left)) {
        return transient(world.dragNode(x, y));
      }
    });
  }
}
