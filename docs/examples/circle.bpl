⍝ Three points determine a circle. Drag any point or construction line.
data←[100 100◇¯100 100◇0 ¯50]
render←{
  s←+/ω²
  c←(1↓s)-↑s ⌹ 2×(1↓ω)-¹↑ω
  r←√+/⊼c-↑ω
  q←[[0 2]]⌷ω
  m←0.5×q+¹ω₁
  edges←q,¹ω₁
  bisectors←m ,¹ 2×c -¹ m
  segments←edges⍪bisectors
  styles←{["stroke":ω]}¨ ≢segments ρ "red" "blue"
  [
    styles lines¨ ↓segments;
    points c;
    ["fill":"none" "stroke":"green" "stroke-width":3] circle c,r;
    points ω
  ]
}
