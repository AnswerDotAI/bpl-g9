# BPL + g9

[Open the gallery](index.html).

Write a mathematical relationship, then drag its drawing to explore it. Move a Bézier control point and watch the curve follow. Drag the curve itself and change the interpolation parameter. The same model describes both interactions.

[g9](https://github.com/bijection/g9), created by [bijection](https://github.com/bijection), supplies this automatic interactivity. You write a function from data to a drawing. When you drag a shape, g9 searches for parameter values that bring it towards your pointer, starting from the current values. It redraws everything from the new data.

This project rewrites all 15 models from the [original JavaScript gallery](https://omrelli.ug/g9/gallery/) in [BPL](https://answerdotai.github.io/basedpl/), with an array-oriented binding between BPL and g9.

## Explore by dragging

Start with [Mirrored points](index.html#basic). Drag either point and watch the other move. The two points share two parameters, with their coordinates swapped.

In [Bézier curve](index.html#bezier), drag the black control points to change the curve. Drag its thick curve, grey construction lines or label to change the interpolation parameter. [Tree](index.html#tree) uses the same idea for a whole branching structure. Drag a branch to change its angle and attenuation.

Select an example, drag its shapes, or edit its BPL and press Run changes. Clock starts automatically; Crank has a Play button. Reset restores the selected example.

## A model in two lines

Each model defines its parameters, `data`, and a function, `render`, that returns drawing instructions:

```bpl
data←10 0
render←points ⊢,₁⌽
```

`⌽` reverses the coordinates, and `⊢,₁⌽` joins the original and reversed vectors as columns: `[10 0◇0 10]`. `points` draws one point for each row. Dragging either point changes the two coordinates, and both points are drawn again from those values. The model needs no drag handler or inverse formula.

## Why BPL fits

BPL is an array programming language descended from APL, with ideas from J and BQN. Arithmetic works on whole vectors and matrices. Functions combine into short expressions, and operators apply them across array cells. Within a braced function, `ω` names its argument. For `render`, this is the current data.

A point is a row of coordinates. A curve is a matrix of points. In the Bézier example, `a` and `b` contain the endpoints of the grey construction lines, and `r` contains one interpolation weight per row. This formula gives all the points on the curve:

```bpl
curve←(1-r)×a + r×b
```

BPL broadcasts each weight across both coordinates in its row. The same expression interpolates x and y for every point.

Complex numbers express rotations directly. In [Counter-rotating rings](index.html#rings), `○` turns an angle into a unit-circle point, and `∨` splits complex numbers into coordinate pairs:

```bpl
z←ω.radius×○ ω.angle + ι10 π 5
[points ∨z; ["fill":"red"] points ∨0.5×+z]
```

The sequence `ι10 π 5` gives ten angles, spaced by π/5. Conjugation, `+z`, reverses the rotation for the smaller red ring.

You can keep the formula beside its drawing, change it, press Run changes and explore again. BPL also has a [REPL](https://answerdotai.github.io/basedpl/repl.html), [notebooks](https://answerdotai.github.io/basedpl/notebooks.html) and a [Python API](https://answerdotai.github.io/basedpl/python.html) for working on the mathematics outside this page. [Getting started](https://answerdotai.github.io/basedpl/getting-started.html) introduces the language.

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

Styles can be arrays too. [Circle](index.html#circle) styles its construction lines from a repeating colour array:

```bpl
segments←edges⍪bisectors
styles←{["stroke":ω]}¨ ≢segments ρ "red" "blue"
styles lines¨ ↓segments
```

`↓` exposes the segment rows. Each, `¨`, pairs a style with each row. The same drawing function handles one line or an array of lines.

## Choosing what moves

`affects` restricts which parameters a shape can change. A parameter name selects that whole field; a vector of names selects several fields. It applies to a group through the same attribute mechanism:

```bpl
"t" affects [text [label x y]; lines chords; path curve]
```

For selected rows or coordinates, use `refs`, which mirrors the structure of `data`. Its values are parameter references, not coordinates. Ordinary BPL indexing selects them. With a point matrix as `data`, the same index array can select both the references and the geometry:

```bpl
render←{
  i←2 0
  refs.[i] affects points ω.[i]
}
```

This draws handles for rows 2 and 0. Every shape in the group receives the union of the selected references; `affects` does not pair reference rows with geometry rows. Here each point depends on its own row. [Choosing what moves](index.html#affects) uses Each over shared row indices when individual shapes need different selections.

`refs₀ ₁` selects one coordinate; `refs.[:;0]` selects every x coordinate. Arrays of references work with normal BPL broadcasting, Rank and Each. An empty selection allows no parameter changes. Without `affects`, g9 can change every numeric parameter.

Coordinates are centred in the drawing area, with positive y pointing down. `view.width` and `view.height` give the drawing area's dimensions. Parameters can be numeric scalars or arrays, including matrices, or records containing them. Their keys and array dimensions stay fixed while dragging. Bare numbers in BPL are floats, suitable for continuous motion. Whole-valued floats such as `2 0` work as indices with Mathish on or off. These examples disable Mathish comparisons.

## Animation

Define `tick` to return the next parameter record. Clock advances its `time` field with Under, `@`:

```bpl
tick←0.01+ @["time"]
```

`options` accepts `fps` (default 30) and `animate` (default true when `tick` exists). Animation pauses during a drag.

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

## Credits

[g9's source](https://github.com/bijection/g9) is MIT-licensed. Its minimizer adapts the gradient and unconstrained-minimization routines from [Numeric.js](https://github.com/sloisel/numeric), by Sébastien Loisel.

[BPL](https://github.com/AnswerDotAI/basedpl) provides the array language and browser WebAssembly runtime. It is developed by Jeremy Howard and contributors and is licensed under Apache 2.0.
