// Minimal, dependency-free ZIP builder. Produces a valid .zip archive with one
// or more STORED (uncompressed) entries — enough for bundling text manifests and
// small files on the client without pulling in a library. Not a general-purpose
// zip (no compression/encryption), but the output opens in any archive tool.

/** CRC-32 (IEEE 802.3), the checksum every ZIP entry needs. */
const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c >>> 0
  }
  return table
})()

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff
  for (let i = 0; i < bytes.length; i++) crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

export interface ZipEntry {
  name: string
  /** UTF-8 encoded before storing. */
  content: string
}

/**
 * Build a ZIP archive (STORED, no compression) from text entries and return it
 * as a Blob. Timestamps are fixed (no Date() dependency) so output is stable.
 */
export function buildZip(entries: ZipEntry[]): Blob {
  const encoder = new TextEncoder()
  const chunks: Uint8Array[] = []
  const central: Uint8Array[] = []
  let offset = 0

  const u16 = (v: number) => new Uint8Array([v & 0xff, (v >>> 8) & 0xff])
  const u32 = (v: number) =>
    new Uint8Array([v & 0xff, (v >>> 8) & 0xff, (v >>> 16) & 0xff, (v >>> 24) & 0xff])

  for (const entry of entries) {
    const nameBytes = encoder.encode(entry.name)
    const data = encoder.encode(entry.content)
    const crc = crc32(data)
    const size = data.length

    // Local file header
    const local = concat([
      u32(0x04034b50), // signature
      u16(20), // version needed
      u16(0), // flags
      u16(0), // method: 0 = STORED
      u16(0), // mod time
      u16(0x21), // mod date (fixed: 1980-01-01)
      u32(crc),
      u32(size), // compressed size
      u32(size), // uncompressed size
      u16(nameBytes.length),
      u16(0), // extra length
      nameBytes,
      data,
    ])
    chunks.push(local)

    // Central directory record for this entry
    central.push(
      concat([
        u32(0x02014b50), // signature
        u16(20), // version made by
        u16(20), // version needed
        u16(0), // flags
        u16(0), // method
        u16(0), // mod time
        u16(0x21), // mod date
        u32(crc),
        u32(size),
        u32(size),
        u16(nameBytes.length),
        u16(0), // extra length
        u16(0), // comment length
        u16(0), // disk number
        u16(0), // internal attrs
        u32(0), // external attrs
        u32(offset), // local header offset
        nameBytes,
      ]),
    )
    offset += local.length
  }

  const centralBlob = concat(central)
  const end = concat([
    u32(0x06054b50), // end of central directory signature
    u16(0), // disk number
    u16(0), // disk with central dir
    u16(entries.length), // entries on this disk
    u16(entries.length), // total entries
    u32(centralBlob.length),
    u32(offset), // central dir offset
    u16(0), // comment length
  ])

  const archive = concat([concat(chunks), centralBlob, end])
  // Copy into a fresh ArrayBuffer so the Blob part is a plain (non-shared) buffer.
  const buffer = archive.slice().buffer
  return new Blob([buffer], { type: 'application/zip' })
}

function concat(parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((n, p) => n + p.length, 0)
  const out = new Uint8Array(total)
  let pos = 0
  for (const p of parts) {
    out.set(p, pos)
    pos += p.length
  }
  return out
}
