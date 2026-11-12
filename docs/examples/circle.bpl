⍝ Three points determine a circle. Drag any point or construction line.
data←["p":[100 100◇¯100 100◇0 ¯50]]
render←{
  p←ω.p
  s←+/p²
  c←(1↓s)-↑s ⌹ 2×(1↓p)-¹↑p
  r←√+/⊼c-↑p
  q←[[0 2]]⌷p
  m←0.5×q+¹p₁
  edges←q,¹p₁
  bisectors←m ,¹ 2×c -¹ m
  segments←edges⍪bisectors
  styles←{["stroke":ω]}¨ ≢segments ρ "red" "blue"
  [
    styles lines¨ ↓segments;
    points c;
    ["fill":"none" "stroke":"green" "stroke-width":3] circle c,r;
    points p
  ]
}
