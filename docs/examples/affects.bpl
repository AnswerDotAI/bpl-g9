⍝ Black moves freely; red changes only its start; blue changes start x and end y.
data←["ends":[¯100 ¯50 100 ¯50◇¯100 0 100 0◇¯100 50 100 50]]
render←{
  p←ω.ends
  colors←"#000" "red" "blue"
  columns←[ι4;0 1;0 3]
  draw←{
    ["stroke":colors.[ω]] attrs refs.ends.[ω;columns.[ω]] affects lines p.[ω]
  }
  ["stroke-width":10] attrs draw¨ι≢p
}
