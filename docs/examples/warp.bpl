⍝ Drag the grid to change its scale and radius-dependent spin.
data←["spin":0 "scale":1]
v←¯10+ι21
z←,v+⊗0j1×v
render←{points ∨30×ω.scale×z×○ω.spin×|z}
