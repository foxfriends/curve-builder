import './extension/Symbol+Generate';

import { Toolbar } from './Toolbar';
import { Editor } from './Editor';

const toolbar = new Toolbar(document.querySelector('#toolbar'));

const svg = document.querySelector('#svg');
svg.setAttribute('width', window.innerWidth - toolbar.width);
svg.setAttribute('height', window.innerHeight);

const editor = new Editor(svg, toolbar);
