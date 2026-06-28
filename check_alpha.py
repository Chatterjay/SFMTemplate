import struct, zlib

with open("D:/temp/SFMTemplate/models/灌注室/textures/atlas/atlas_1001.png", "rb") as f:
    data = f.read()

# Find IDAT chunks
pos = 8
compressed = b""
while pos < len(data):
    length = struct.unpack(">I", data[pos:pos+4])[0]
    chunk_type = data[pos+4:pos+8]
    chunk_data = data[pos+8:pos+8+length]
    if chunk_type == b"IDAT":
        compressed += chunk_data
    elif chunk_type == b"IEND":
        break
    pos += 12 + length
    if length % 4:
        pos += 4 - length % 4

raw = zlib.decompress(compressed)
stride = 8192 * 4

# imbuement_chamber UV: u=[0.03125,0.035156] v=[0,0.003906]
# pixel: x=256..288, y=0..32
non255 = 0
min_a = 255
for py in range(0, 32):
    for px in range(256, 288):
        a = raw[py * stride + px * 4 + 3]
        if a < 255: non255 += 1
        min_a = min(min_a, a)
print(f"Imbuement_chamber region: non-255 alpha={non255}/1024 min_a={min_a}")

# creative_source_jar UV: u=[0.012939,0.051758] v=[0,0.005127]
non255_j = 0
min_a_j = 255
for py in range(0, 42):
    for px in range(106, 424):
        a = raw[py * stride + px * 4 + 3]
        if a < 255: non255_j += 1
        min_a_j = min(min_a_j, a)
print(f"Creative_source_jar region: non-255 alpha={non255_j}/{42*318} min_a={min_a_j}")

# Check a broader area around imbuement chamber
print("\nSampling alpha in a wider area around imbuement_chamber:")
for py in [0, 16, 32, 64, 128]:
    alpha_vals = [raw[py * stride + px * 4 + 3] for px in [0, 32, 64, 128, 256, 512, 1024]]
    print(f"  y={py}: alpha=" + ",".join(str(a) for a in alpha_vals))

print("\nDone")
