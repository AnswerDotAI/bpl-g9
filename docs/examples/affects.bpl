⍝ Black moves freely; red changes only its start; blue changes start x and end y.
data←[¯100 ¯50 100 ¯50◇¯100 0 100 0◇¯100 50 100 50]
render←{
  colors←"#000" "red" "blue"
  columns←[ι4;0 1;0 3]
  draw←{
    ["stroke":colors.[ω]] attrs refs.[ω;columns.[ω]] affects lines α
  }
  ["stroke-width":10] attrs ↓ω draw¨ ι≢ω
}
