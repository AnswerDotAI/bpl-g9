⍝ Drag either hand to change time. Animation pauses while dragging.
data←["time":72]
options←["fps":20]
render←{
  angles←ω.time÷60 1
  hands←0 0,¹∨70 100×○angles
  [
    ["stroke-width":10 "stroke-linecap":"round"] attrs [["stroke":"gray"] ⍬] lines¨ ↓hands;
    ["fill":"none" "stroke":"black"] circle 0 0 120
  ]
}
tick←0.01+ @["time"]
