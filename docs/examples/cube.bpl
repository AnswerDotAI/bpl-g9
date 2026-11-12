data←["ax":0 "ay":0]

i←ι8
vertices←2 2 2⊤i - 0.5
edges←⊃⍸ i<⊗i ∧ i≠ᵇ⊗i ∊ 1 2 4
rx←{[c s]←∨○ω ◇ [1 0 0◇0 c -s◇0 s c]}
ry←{[c s]←∨○ω ◇ [c 0 s◇0 1 0◇-s 0 c]}

render←{
    p←vertices+.×⍉(rx ω.ax)+.×(ry ω.ay)
    q←300×p.[:;0 1] ÷ 2+p.[:;2]
    ["stroke-width":10 "stroke-linecap":"round"] lines ,²q.[edges]
}
