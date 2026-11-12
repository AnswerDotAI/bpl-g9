⍝ Drag the curve or grey chords to change t; drag the black control points too.
data←["p":[¯140 82◇9 ¯224◇190 77] "t":0.5066666666666662]
render←{
  p←ω.p
  r←ω.t × ι30 ÷ 30
  a←(1-r)×⊗p₀ + r×⊗p₁
  b←(1-r)×⊗p₁ + r×⊗p₂
  curve←(1-r)×a + r×b
  label←"tween=",4↑⍕ω.t
  [
    "t" affects [
      ["alignment-baseline":"middle"] text [label; (ω.t-0.5)×300; view.height÷2 - 30];
      ["stroke":"rgba(0,0,0,.1)"] lines a,¹b;
      ["stroke-width":5] path curve
    ];
    path p;
    "p" affects points p
  ]
}
