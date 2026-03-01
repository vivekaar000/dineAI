import numpy as np
from stl import mesh
m = mesh.Mesh.from_file("/Users/aaravvivek/Downloads/ravenwood_pure_box_fixed.stl")
print("Min:", m.x.min(), m.y.min(), m.z.min())
print("Max:", m.x.max(), m.y.max(), m.z.max())
