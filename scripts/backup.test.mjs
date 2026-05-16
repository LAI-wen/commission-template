import { test } from 'node:test'
import assert from 'node:assert/strict'
import { zipSync, unzipSync } from 'fflate'

test('ZIP round-trip: JSON data is preserved', () => {
  const enc = new TextEncoder()
  const dec = new TextDecoder()

  const manifest = {
    schema_version: 1,
    exported_at: '2026-01-01T00:00:00.000Z',
    included_images: { works: false, types: false },
  }
  const creator = { id: 'main', display_name: 'Test Artist', email_mode: 'none' }
  const commissionTypes = [
    { id: 'ct1', name: '全身圖', base_price: 1500, sort_order: 0, is_active: 1, preview_images: '[]' },
  ]

  const zipped = zipSync({
    'manifest.json':              enc.encode(JSON.stringify(manifest)),
    'data/creator.json':          enc.encode(JSON.stringify(creator)),
    'data/commission_types.json': enc.encode(JSON.stringify(commissionTypes)),
    'data/commissions.json':      enc.encode(JSON.stringify([])),
  })

  assert.ok(zipped instanceof Uint8Array, 'output should be Uint8Array')
  assert.ok(zipped.length > 0, 'ZIP should not be empty')

  const files = unzipSync(zipped)

  assert.deepEqual(
    JSON.parse(dec.decode(files['manifest.json'])),
    manifest,
    'manifest should survive round-trip'
  )
  assert.deepEqual(
    JSON.parse(dec.decode(files['data/creator.json'])),
    creator,
    'creator should survive round-trip'
  )
  assert.deepEqual(
    JSON.parse(dec.decode(files['data/commission_types.json'])),
    commissionTypes,
    'commission_types should survive round-trip'
  )
  assert.deepEqual(
    JSON.parse(dec.decode(files['data/commissions.json'])),
    [],
    'empty array should survive round-trip'
  )
})

test('ZIP round-trip: binary image data is preserved', () => {
  const enc = new TextEncoder()
  // Minimal PNG header bytes
  const pngHeader = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])

  const zipped = zipSync({
    'manifest.json': enc.encode(JSON.stringify({ schema_version: 1 })),
    'images/works/test.png': pngHeader,
    'images/types/preview.webp': new Uint8Array([82, 73, 70, 70]), // RIFF header
  })

  const files = unzipSync(zipped)

  assert.deepEqual(files['images/works/test.png'], pngHeader, 'work image should survive round-trip')
  assert.deepEqual(files['images/types/preview.webp'], new Uint8Array([82, 73, 70, 70]), 'type image should survive round-trip')
})

test('extractR2Key: extracts key from various URL formats', () => {
  function extractR2Key(url) {
    const match = url.match(/\/api\/assets\/([^?#]+)/)
    return match ? match[1] : null
  }

  assert.equal(extractR2Key('/api/assets/abc123.webp'), 'abc123.webp')
  assert.equal(extractR2Key('https://example.com/api/assets/xyz-456.jpg'), 'xyz-456.jpg')
  assert.equal(extractR2Key('https://hub.example.com/api/assets/foo.png'), 'foo.png')
  assert.equal(extractR2Key('https://other.com/different-path'), null)
  assert.equal(extractR2Key(''), null)
})
