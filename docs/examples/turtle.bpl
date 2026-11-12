data←["r":20 "theta":123]

render←{
    i←ι30
    angles←i × ω.theta π 180
    p←0,+\ω.r×i×○angles
    ["stroke-width":5] path ∨p
}
