⍝ Drag the crank or piston. Play starts the optional animation.
data←["time":72]
options←["fps":100 "animate":$f]
render←{
  [x y]←∨40×○ω.time
  piston←y - √120²-x²
  fill←"hsl(",(⍕300+1.5×x),",100%,90%)"
  [
    ["fill":fill "stroke":"black"] rect ¯40 0 80 ¯235;
    ["fill":"white" "stroke":"black"] circle 0 0 70;
    ["stroke-width":10 "stroke":"gray" "stroke-linecap":"round"] lines [x y 0 piston];
    ["stroke-width":40 "stroke":"black" "stroke-linecap":"round"] lines [0 0 x y];
    ["stroke-width":70 "stroke":"gray"] lines [0 piston 0 piston-70]
  ]
}
tick←0.05+ @["time"]
