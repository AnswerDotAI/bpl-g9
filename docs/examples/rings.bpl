⍝ Drag either ring to change its radius and angle.
data←["radius":100 "angle":0]
render←{
  z←ω.radius×○ ω.angle + ι10 π 5
  ⍝ Conjugation reverses the inner ring's rotation.
  [points ∨z; ["fill":"red"] points ∨0.5×+z]
}
