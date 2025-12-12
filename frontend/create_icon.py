
import struct
import zlib

def create_png(width, height, color):
    # PNG signature
    png = b'\x89PNG\r\n\x1a\n'
    
    # IHDR chunk
    ihdr = struct.pack('!I4sIIBBBBB', 13, b'IHDR', width, height, 8, 2, 0, 0, 0)
    ihdr += struct.pack('!I', zlib.crc32(ihdr[4:]))
    png += ihdr
    
    # IDAT chunk (raw RGB data)
    raw_data = b''
    for _ in range(height):
        raw_data += b'\x00' + (struct.pack('BBB', *color) * width)
    
    compressor = zlib.compressobj()
    compressed_data = compressor.compress(raw_data)
    compressed_data += compressor.flush()
    
    idat = struct.pack('!I4s', len(compressed_data), b'IDAT') + compressed_data
    idat += struct.pack('!I', zlib.crc32(idat[4:]))
    png += idat
    
    # IEND chunk
    iend = struct.pack('!I4s', 0, b'IEND')
    iend += struct.pack('!I', zlib.crc32(iend[4:]))
    png += iend
    
    return png

# Create a purple 192x192 icon (RGB: 124, 58, 237)
icon_data = create_png(192, 192, (124, 58, 237))

with open('/app/frontend/public/logo192.png', 'wb') as f:
    f.write(icon_data)

print("Created logo192.png")
