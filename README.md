# BPL + g9

Write a drawing in BPL, then drag its shapes to change the drawing's parameters. This local prototype implements all 15 examples from the [g9 gallery](https://omrelli.ug/g9/gallery/) using BPL arrays and a small JavaScript adapter.

Select an example, drag its shapes, or edit its BPL and press Run changes. Clock starts automatically; Crank has a Play button. Reset restores the example.

Each model defines a parameter record, `data`, and a function, `render`, that returns scene fragments:

```bpl
data←["x":10 "y":0]
render←points [["x" "y"◇"y" "x"]]⌷
```

Dragging either point changes `x` and `y`. Both points follow the same model.

## Drawing arrays

The helpers accept one shape or a matrix with one shape per row:

| Helper | Row |
| --- | --- |
| `points` | `x y` |
| `lines` | `x1 y1 x2 y2` |
| `circle` | `x y radius` |
| `rect` | `x y width height` |
| `text` | `label x y` |
| `image` | `url x y width height` |
| `path` | successive `x y` points joined by lines |

A left argument supplies SVG attributes. `attrs` applies attributes to a whole group; a child's attributes override the group's. Return a vector to combine layers. Later layers appear on top.

```bpl
data←["p":[¯100 0◇0 80◇100 0]]
render←{ ["stroke":"gray"] attrs [path ω.p; points ω.p] }
```

`affects` restricts which parameters a shape can change. A parameter name selects that whole field; a vector of names selects several fields. It applies to a group through the same attribute mechanism:

```bpl
"t" affects [text [label;x;y]; lines chords; path curve]
```

For selected rows or coordinates, use `refs`, a record mirroring the numeric entries of `data`. Its values are parameter references, not coordinates. Ordinary BPL indexing selects them. The same index array can select both the references and the geometry:

```bpl
render←{
  i←2ₓ 0ₓ
  refs.p.[i] affects points ω.p.[i]
}
```

This draws handles for rows 2 and 0. Every shape in the group receives the union of the selected references; `affects` does not pair reference rows with geometry rows. Here each point depends on its own row. [Choosing what moves](docs/examples/affects.bpl) uses Each over shared row indices when individual shapes need different selections.

`refs.p₀ ₁` selects one coordinate; `refs.p.[:;0]` selects every x coordinate. Arrays of references work with normal BPL broadcasting, Rank and Each. An empty selection allows no parameter changes. Without `affects`, g9 can change every numeric parameter.

Coordinates are centred in the drawing area, with positive y pointing down. `view.width` and `view.height` give the drawing area's dimensions. Parameter records can contain numeric scalars and arrays, including matrices. Their keys and array dimensions stay fixed while dragging. Use floating-point parameters for continuous motion. The shared setup disables Mathish comparisons.

Define `tick` for animation. It takes the current parameter record and returns the next one. `options` accepts `fps` (default 30) and `animate` (default true when `tick` exists). Animation pauses during a drag.

## Embedding

For another browser page in `docs/`, reuse the import map from `index.html`:

```js
import {createBplG9} from './src/binding.js';

const demo = await createBplG9({source, element});
demo.setData({...demo.data, x: 40});
demo.dispose();
```

The controller exposes `data`, `setData`, `reset`, `playing`, and `metrics`. Supply `onChange(data)` to observe parameter changes or `onError(error)` to handle animation failures. Disposing removes the drawing and releases its BPL session when any active drag ends.

BPL evaluates the model source once. Each solver evaluation binds the current parameters and calls `render` in the same browser WASM session. g9 uses its existing finite-difference optimizer; this adapter does not use BPL autodiff. Row-level g9 pruning avoids constructing unrelated JavaScript shapes, but BPL still computes the whole scene during each solver evaluation.

During a model's lifetime, g9 identifies shapes by drawing position. It retains the SVG element when the shape kind changes at that position, and it retains attributes omitted from later updates. Run changes remounts the model. The gallery models keep their shape kinds and attribute names stable.
