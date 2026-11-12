data←["deltaAngle":33 "attenuation":0.7 "startLength":189]

render←{
    turns←ω.attenuation×○ ω.deltaAngle π 180 ¯180
    grow←{
        q←ω.p+ω.step
        geom←∨ω.p ,¹ ∨q
        color←["green" "brown"].[ω.depth>3]
        shapes←[["stroke-width":5 "stroke":color] lines geom; ["fill":"green"] points ∨q]
        ω.depth=0?shapes;
        shapes,∇["p":2#q "step":,ω.step×⊗turns "depth":ω.depth-1]
    }
    base←0ⱼ(view.height÷2 - 30)
    [points ∨base; "deltaAngle" "attenuation" affects grow ["p":,base "step":,0j¯1×ω.startLength "depth":8]]
}
