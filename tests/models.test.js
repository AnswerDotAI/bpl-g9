import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import init, {Session} from 'basedpl/basedpl_wasm.js';
import {createModel, sceneLayers} from '../docs/src/binding.js';

await init({module_or_path: await readFile(new URL('../node_modules/basedpl/basedpl_wasm_bg.wasm', import.meta.url))});
const library = await readFile(new URL('../docs/src/scene.bpl', import.meta.url), 'utf8');
const values = a => Array.from(a.data ?? a);
const counts = {basic: 2, rings: 20, affects: 3, bezier: 65, circle: 9, cube: 12, dragon: 514,
  image: 1, tongs: 8, tree: 1023, limits: 4, clock: 3, turtle: 30, warp: 441, crank: 5};

test('gallery geometry and parameter round trips in BPL/WASM', async () => {
  for (const file of await readdir(new URL('../docs/examples', import.meta.url))) {
    const name = file.replace('.bpl', ''), session = new Session();
    try {
      const source = await readFile(new URL(`../docs/examples/${file}`, import.meta.url), 'utf8');
      const model = createModel(session, source, {library, width: 800, height: 500});
      const {initial, codec} = model;
      const scene = [...sceneLayers(model.render(codec.restore(codec.flatten(initial))))];
      let count = 0;
      for (const {kind, geometry, options} of scene) {
        const width = {point: 2, line: 4, circle: 3, rect: 4, text: 3, image: 5}[kind];
        assert.ok(width, `${name}: unknown shape ${kind}`);
        const data = values(geometry);
        assert.equal(data.length % width, 0, `${name}: incomplete row`);
        assert.ok(data.every((x, i) => (i % width === 0 && (kind === 'text' || kind === 'image'))
          ? typeof x === 'string' : typeof x === 'number' && Number.isFinite(x)), `${name}: finite numeric coordinates`);
        if (Object.hasOwn(options, 'affects')) assert.ok(codec.affects(options.affects).length, `${name}: affects resolves`);
        count += data.length / width;
      }
      assert.equal(count, counts[name], `${name}: complete scene`);
      if (name === 'basic') assert.deepEqual(values(scene[0].geometry), [10, 0, 0, 10]);
      if (name === 'image') assert.deepEqual(codec.affects(scene[0].options.affects), ['v0', 'v1']);
      if (name === 'circle') {
        const [x, y, r] = values(scene.find(s => s.kind === 'circle').geometry), p = values(initial);
        for (let i = 0; i < p.length; i += 2) assert.ok(Math.abs(Math.hypot(p[i] - x, p[i + 1] - y) - r) < 1e-9);
      }
      if (name === 'affects') {
        const selected = codec.affects(scene[2].options.affects), flat = codec.flatten(initial);
        selected.forEach(key => flat[key] += 10);
        assert.deepEqual(values(codec.restore(flat)), [-100, -50, 100, -50, -100, 0, 100, 0, -90, 50, 100, 60]);
        assert.deepEqual(codec.restore(flat).shape, [3, 4]);
      }
      if (model.hasTick) {
        const next = model.tick(initial);
        assert.notDeepEqual(codec.flatten(next), codec.flatten(initial), `${name}: animation advances`);
        model.render(next);
      }
    } finally { session.free(); }
  }
});

test('structured selections share BPL indices and group attributes', () => {
  const session = new Session();
  try {
    const model = createModel(session, `
data←["p":[1 2◇3 4◇5 6] "p[0][0]":70 "scalar":⊂9]
render←{
  i←2 0
  ["stroke":"black" "stroke-width":4] attrs [
    refs.p.[i] affects ["stroke":"red"] points ω.p.[i];
    refs.p₀ ₀ affects points ω.p₀;
    ⍬ affects points ω.p₂
  ]
}`, {library});
    const scene = [...sceneLayers(model.render())];
    assert.deepEqual(values(scene[0].geometry), [5, 6, 1, 2]);
    assert.deepEqual(model.codec.affects(scene[0].options.affects), ['v4', 'v5', 'v0', 'v1']);
    assert.equal(scene[1].options.affects, 0);
    assert.deepEqual(model.codec.affects(scene[1].options.affects), ['v0']);
    assert.deepEqual(model.codec.affects(scene[2].options.affects), []);
    assert.deepEqual(model.codec.affects('p[0][0]'), ['v6']);
    const flat = model.codec.flatten(model.initial), restored = model.codec.restore(flat);
    assert.deepEqual(flat, {v0: 1, v1: 2, v2: 3, v3: 4, v4: 5, v5: 6, v6: 70, v7: 9});
    assert.deepEqual(restored.scalar.shape, []);
    assert.deepEqual(values(restored.scalar), [9]);
    assert.deepEqual(session.eval('refs.scalar').shape, []);
    assert.deepEqual(model.codec.affects(model.codec.refs.scalar), ['v7']);
    assert.deepEqual(scene.map(s => s.options.stroke), ['red', 'black', 'black']);
    assert.ok(scene.every(s => s.options['stroke-width'] === 4));
  } finally { session.free(); }
});
