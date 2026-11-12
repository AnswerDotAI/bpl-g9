import init, {Session, configure} from 'basedpl/basedpl_wasm.js';
import g9 from 'g9';

const shaped = value => value && Array.isArray(value.shape) && value.data != null;
const list = value => shaped(value) ? Array.from(value.data) : Array.isArray(value) ? value : [value];
const dimensions = {point: 2, line: 4, circle: 3, rect: 4, text: 3, image: 5};

function coordinate(index, shape) {
  const indices = [];
  for (let axis = shape.length - 1; axis >= 0; axis--) {
    indices.unshift(index % shape[axis]);
    index = Math.floor(index / shape[axis]);
  }
  return indices;
}

function numericLeaves(value, path, visit) {
  if (typeof value === 'number' || typeof value === 'bigint') visit(path, Number(value));
  else if (shaped(value)) Array.from(value.data).forEach((item, i) => numericLeaves(item, [...path, ...coordinate(i, value.shape)], visit));
  else if (Array.isArray(value)) value.forEach((item, i) => numericLeaves(item, [...path, i], visit));
  else if (value && typeof value === 'object') Object.entries(value).forEach(([key, item]) => numericLeaves(item, [...path, key], visit));
}

/** Flatten only numeric state for g9, retaining BPL array shapes on the way back. */
export function stateCodec(template) {
  const byPath = new Map();
  numericLeaves(template, [], (path, value) => {
    if (!Number.isFinite(value)) throw new Error(`Initial parameter ${JSON.stringify(path)} is not finite`);
    byPath.set(JSON.stringify(path), `v${byPath.size}`);
  });
  if (!byPath.size) throw new Error('data needs at least one numeric parameter');
  const flatten = value => {
    const flat = {};
    numericLeaves(value, [], (path, number) => {
      const key = byPath.get(JSON.stringify(path));
      if (key !== undefined) flat[key] = number;
    });
    for (const key of byPath.values()) if (!(key in flat)) throw new Error('setData must preserve the model’s parameter structure');
    return flat;
  };
  const restore = (flat, references = false) => {
    const build = (value, path) => {
      if (typeof value === 'number' || typeof value === 'bigint') return flat[byPath.get(JSON.stringify(path))];
      if (shaped(value)) {
        const data = Array.from(value.data, (item, i) => build(item, [...path, ...coordinate(i, value.shape)]));
        return {...value, data: data.every(item => typeof item === 'number') ? Float64Array.from(data) : data};
      }
      if (Array.isArray(value)) return value.map((item, i) => build(item, [...path, i]));
      if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, build(item, [...path, key])]));
      return references ? [] : value;
    };
    return build(template, []);
  };
  const refs = restore(Object.fromEntries([...byPath.values()].map((key, i) => [key, i])), true);
  const affects = selection => {
    const selected = new Set();
    const collect = value => {
      if (typeof value === 'string') {
        if (!Object.hasOwn(refs, value)) throw new Error(`Unknown affects parameter: ${value}`);
        collect(refs[value]);
      } else numericLeaves(value, [], (_, id) => {
        if (!Number.isInteger(id) || id < 0 || id >= byPath.size) throw new Error(`Unknown parameter reference: ${id}`);
        selected.add(`v${id}`);
      });
    };
    for (const value of list(selection)) collect(value);
    return [...selected];
  };
  return {flatten, restore, affects, refs};
}

/** Resolve nested scene groups, with child attributes overriding inherited ones. */
export function* sceneLayers(scene, inherited = {}) {
  if (scene == null) return;
  const options = {...inherited, ...(shaped(scene.options) ? {} : scene.options)};
  if (scene.kind) yield {...scene, options};
  else if (scene.children != null) yield* sceneLayers(scene.children, options);
  else {
    if (!shaped(scene) && !Array.isArray(scene)) throw new Error('render must return scene fragments or a vector of fragments');
    for (const layer of list(scene)) yield* sceneLayers(layer, inherited);
  }
}

/** Adapt pure BPL scene fragments to the six g9 shapes. */
export function drawScene(scene, ctx, codec) {
  for (const {kind, geometry, options} of sceneLayers(scene)) {
    const width = dimensions[kind];
    if (!width) throw new Error(`Unknown scene shape: ${kind}`);
    if ('affects' in options) options.affects = codec.affects(options.affects);
    const shape = geometry?.shape ?? [geometry?.length], data = shaped(geometry) ? geometry.data : geometry;
    if (!data || !shape.length || shape.length > 2 || shape.at(-1) !== width) {
      throw new Error(`${kind} geometry needs rows of ${width} values`);
    }
    const rows = shape.length === 1 ? 1 : shape[0];
    const draw = row => {
      const start = row * width;
      const args = Array.from(data.slice(start, start + width));
      for (let column = kind === 'text' || kind === 'image' ? 1 : 0; column < width; column++) {
        const value = args[column];
        if ((typeof value !== 'number' && typeof value !== 'bigint') || !Number.isFinite(Number(value))) {
          throw new Error(`${kind} geometry row ${row + 1}, column ${column + 1} needs a finite number`);
        }
        args[column] = Number(value);
      }
      ctx[kind](...args, options);
    };
    const drawRow = ctx.pure(draw);
    for (let row = 0; row < rows; row++) drawRow(row);
  }
}

let initialized;
function runtime() {
  initialized ??= init().then(() => configure(location.href, message => console.error(message)));
  return initialized;
}

function errorOf(error) { return new Error(error.display || error.message || String(error)); }

/** A synchronous model over an initialized BPL Session, independent of the DOM. */
export function createModel(session, source, {width = 640, height = 400, library = ''} = {}) {
  session.bind({view: {width, height}});
  const error = session.run(`${library}\n${source}`, () => {});
  if (error) throw errorOf(error);
  const exists = name => session.eval(`•nc "${name}"`) !== 0;
  const options = exists('options') ? session.eval('options') : {};
  const initial = session.eval('data'), codec = stateCodec(initial);
  session.bind({refs: codec.refs});
  return {
    session, options, initial, codec, hasTick: exists('tick'),
    render(state = initial, view = {width, height}) {
      session.bind({state, view});
      return session.eval('render state');
    },
    tick(state) { session.bind({state}); return session.eval('tick state'); }
  };
}

/** Mount a BPL model after its initial evaluation, never re-entering an active Session. */
export async function createBplG9({source, element, onChange = () => {}, onError = error => console.error(error)}) {
  await runtime();
  const session = new Session();
  let model;
  try {
    const library = await fetch(new URL('./scene.bpl', import.meta.url)).then(response => {
      if (!response.ok) throw new Error('Could not load the scene library');
      return response.text();
    });
    model = createModel(session, source, {width: element.clientWidth || 640, height: element.clientHeight || 400, library});
  } catch (error) { session.free(); throw error; }
  const {options, initial, codec} = model;
  let disposed = false, timer, playing = model.hasTick && options.animate !== false;
  let metrics = {renders: 0, milliseconds: 0};
  let graphics;
  try {
    graphics = g9(codec.flatten(initial), (flat, ctx) => {
      const start = performance.now();
      drawScene(model.render(codec.restore(flat), {width: ctx.width, height: ctx.height}), ctx, codec);
      metrics.renders++;
      metrics.milliseconds += performance.now() - start;
    }, flat => { if (!disposed) onChange(codec.restore(flat)); });
    graphics.node.style.cssText = 'display:block;width:100%;height:100%;touch-action:none';
    graphics.insertInto(element);
  } catch (error) { if (graphics?.node.parentNode) graphics.remove(); session.free(); throw error; }
  const resize = new ResizeObserver(() => { if (!disposed) graphics.resize(); });
  resize.observe(element);
  const getData = () => codec.restore(graphics.getData());
  const setData = data => graphics.setData(codec.flatten(data));
  const tick = () => {
    if (disposed) return;
    if (playing && !graphics.isManipulating) {
      try { setData(model.tick(getData())); }
      catch (error) { playing = false; onError(errorOf(error)); }
    }
    timer = setTimeout(tick, 1000 / (options.fps || 30));
  };
  if (model.hasTick) timer = setTimeout(tick, 1000 / (options.fps || 30));
  return {
    graphics, session, options, initial, hasTick: model.hasTick, getData, setData,
    get data() { return getData(); },
    get playing() { return playing; },
    set playing(value) { playing = Boolean(value); },
    get metrics() { return {...metrics}; },
    reset() { setData(initial); metrics = {renders: 0, milliseconds: 0}; },
    dispose() {
      if (disposed) return;
      disposed = true;
      clearTimeout(timer);
      resize.disconnect();
      if (graphics.node.parentNode) graphics.remove();
      const ends = ['mouseup', 'touchend', 'touchcancel'];
      const release = () => {
        ends.forEach(event => document.removeEventListener(event, release));
        session.free();
      };
      // g9 retains document move handlers until this drag ends, even after remove().
      if (graphics.isManipulating) ends.forEach(event => document.addEventListener(event, release));
      else release();
    }
  };
}
