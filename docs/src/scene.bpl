⍝ Pure scene constructors. Geometry stays in BPL; the browser adapter draws its rows.
•prefs ["mathish":$f]
shape←{α←⍬:⍬ ◇ ["kind":⍶ "geometry":ω "options":α]}
attrs←{["options":α "children":ω]}
affects←{["affects":α] attrs ω}
points←"point"shape
lines←"line"shape
circle←"circle"shape
rect←"rect"shape
text←"text"shape
image←"image"shape
path←{α←⍬:⍬ ◇ α lines ,²↕ω}
