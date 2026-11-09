# Genera el modelo 3D provisional de "Ver cómo era": una esfera, solo para probar el visor y el
# recorrido hasta que exista el modelo real. No representa nada de la iglesia.
#
# Va en gajos de dos colores (yellow-400 y surface, de docs/diseno/tokens.json) porque una esfera
# de un solo color se ve igual desde todos los lados y no se notaría que gira.
#
# Uso:
#   "C:\Program Files\Blender Foundation\Blender 5.2\blender.exe" --background --factory-startup \
#     --python scripts/generar-modelo-provisional.py

import math
from pathlib import Path

import bmesh
import bpy

DESTINO = Path(__file__).resolve().parent.parent / "src" / "assets" / "modelos" / "esfera-provisional.glb"
GAJOS = 12
PARALELOS = 24


def lineal(hexadecimal):
    """sRGB (#RRGGBB) a color lineal, que es lo que guarda glTF."""
    canales = [int(hexadecimal[i : i + 2], 16) / 255 for i in (1, 3, 5)]
    return [c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in canales]


def material(nombre, hexadecimal):
    mat = bpy.data.materials.new(nombre)
    mat.use_nodes = True
    principled = mat.node_tree.nodes["Principled BSDF"]
    principled.inputs["Base Color"].default_value = (*lineal(hexadecimal), 1)
    principled.inputs["Roughness"].default_value = 0.6
    return mat


bpy.ops.wm.read_factory_settings(use_empty=True)

malla = bpy.data.meshes.new("esfera-provisional")
objeto = bpy.data.objects.new("esfera-provisional", malla)
bpy.context.collection.objects.link(objeto)
malla.materials.append(material("amarillo", "#FCD13F"))
malla.materials.append(material("blanco", "#FFFFFF"))

bm = bmesh.new()
bmesh.ops.create_uvsphere(bm, u_segments=GAJOS * 4, v_segments=PARALELOS, radius=1)
for cara in bm.faces:
    centro = cara.calc_center_median()
    angulo = math.atan2(centro.y, centro.x) % (2 * math.pi)
    cara.material_index = int(angulo / (2 * math.pi) * GAJOS) % 2
    cara.smooth = True
bm.to_mesh(malla)
bm.free()

DESTINO.parent.mkdir(parents=True, exist_ok=True)
bpy.ops.object.select_all(action="SELECT")
bpy.ops.export_scene.gltf(filepath=str(DESTINO), export_format="GLB", use_selection=True)
print(f"Escrito {DESTINO} ({DESTINO.stat().st_size / 1024:.0f} KB)")
