data←["squareness":0.8 "p":[175 96◇¯220 39]]

render←{
    sq←ω.squareness
    refine←{
        n←≢ω ◇ [a b]←⍉ω
        dir←nρ¯1 1
        m←0.5× a+b - 0j1×sq×dir×b-a
        [2×n 2]ρ⍉[a◇m◇m◇b]
    }
    ends←∨⁻ω.p
    seg←refine⍣9 [1 2]ρends
    ["squareness" affects ["stroke-width":4 "stroke-linecap":"round"] lines ,²∨seg; points ω.p]
}
