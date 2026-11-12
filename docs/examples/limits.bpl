⍝ The upper middle point stays between the red limits; both middle points move x.
data←["left":¯100 "middle":0 "right":100]
render←{
  m←ω.left+20 ⌈ ω.middle ⌊ ω.right-20
  [
    "middle" affects points [m 0◇ω.middle 20];
    ["fill":"red"] points [ω.left 0◇ω.right 0]
  ]
}
