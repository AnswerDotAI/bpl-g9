import {createBplG9} from './binding.js';
import {install} from 'basedpl/browser/bpl-editor.js';

const examples = [
  ['basic', 'Mirrored points', 'Two points share the same two parameters. Drag either one.'],
  ['rings', 'Counter-rotating rings', 'Change the radius and angle by dragging any point.'],
  ['affects', 'Choosing what moves', 'Three lines demonstrate the affects option.'],
  ['bezier', 'Bézier curve', 'Control points define the curve; its construction changes the interpolation parameter.'],
  ['circle', 'Three-point circle', 'The centre and radius follow from three draggable points.'],
  ['cube', 'Cube', 'Rotate a projected cube by dragging its edges.'],
  ['dragon', 'Dragon curve', 'Change the curve’s squareness or move its endpoints.'],
  ['image', 'Image', 'An image is just another draggable shape.'],
  ['tongs', 'Tongs', 'The mechanism follows two angles.'],
  ['tree', 'Tree', 'Drag branches to change the branching angle and attenuation.'],
  ['limits', 'Motion limits', 'Clamping a coordinate constrains one handle without changing the underlying parameter.'],
  ['clock', 'Clock', 'Drag either hand. Animation pauses while you manipulate it.'],
  ['turtle', 'Turtle', 'A path built from accumulated steps and rotations.'],
  ['warp', 'Grid warp', 'Complex rotation turns a regular grid into a radial twist.'],
  ['crank', 'Crank and piston', 'A single parameter drives the linked mechanism.'],
];
const $ = selector => document.querySelector(selector);
let controller, current, request = 0, selection = 0;
const showState = data => { $('#state').textContent = JSON.stringify(data, (_, x) => ArrayBuffer.isView(x) ? Array.from(x) : x, 2); };
const showError = error => {
  $('#status').textContent = 'Error';
  $('#error').textContent = error.display || error.message || String(error);
  $('#error').hidden = false;
  $('#play').textContent = 'Play';
  console.error(error);
};

async function run(source) {
  const id = ++request;
  $('#status').textContent = 'Evaluating…';
  $('#error').hidden = true;
  $('#play').hidden = true;
  controller?.dispose();
  controller = null;
  try {
    const next = await createBplG9({source, element: $('#stage'), onChange: showState, onError: showError});
    if (id !== request) { next.dispose(); return; }
    controller = next;
    window.demo = next;
    showState(next.data);
    $('#play').hidden = !next.hasTick;
    $('#play').textContent = next.playing ? 'Pause' : 'Play';
    $('#status').textContent = 'Ready';
    window.dispatchEvent(new CustomEvent('demo-ready', {detail: current}));
  } catch (error) {
    if (id !== request) return;
    showError(error);
  }
}

async function select(id) {
  const revision = ++selection;
  const info = examples.find(x => x[0] === id) || examples[0];
  current = info[0];
  $('#title').textContent = info[1];
  $('#description').textContent = info[2];
  for (const button of $('#examples').children) {
    if (button.dataset.id === current) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  }
  history.replaceState(null, '', `#${current}`);
  try {
    const response = await fetch(new URL(`../examples/${current}.bpl`, import.meta.url));
    if (!response.ok) throw new Error(`Could not load ${current}`);
    const source = await response.text();
    if (revision !== selection) return;
    $('#source').value = source;
    return run(source);
  } catch (error) { if (revision === selection) showError(error); }
}

for (const [id, name] of examples) {
  const button = document.createElement('button');
  button.type = 'button';
  button.dataset.id = id;
  button.textContent = name;
  button.addEventListener('click', () => select(id));
  $('#examples').append(button);
}
$('#run').addEventListener('click', () => run($('#source').value));
$('#reset').addEventListener('click', () => select(current));
$('#play').addEventListener('click', () => {
  controller.playing = !controller.playing;
  $('#play').textContent = controller.playing ? 'Pause' : 'Play';
});
$('#source').addEventListener('keydown', event => {
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') { event.preventDefault(); run($('#source').value); }
});
window.addEventListener('beforeunload', () => controller?.dispose());
window.bplG9Gallery = {examples, select, run, get controller() { return controller; }};
install();
select(location.hash.slice(1));
