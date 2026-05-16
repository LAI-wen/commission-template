import { test } from 'node:test'
import assert from 'node:assert/strict'

// Copy pure functions here to test without TS/Workers runtime
function last6Months() {
  const months = []
  const d = new Date()
  for (let i = 5; i >= 0; i--) {
    const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - i, 1))
    months.push(t.toISOString().slice(0, 7))
  }
  return months
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`
}

test('last6Months returns 6 entries', () => {
  const months = last6Months()
  assert.equal(months.length, 6)
})

test('last6Months ends with current month', () => {
  const months = last6Months()
  const now = new Date().toISOString().slice(0, 7)
  assert.equal(months[5], now)
})

test('last6Months entries are in ascending order', () => {
  const months = last6Months()
  for (let i = 1; i < months.length; i++) {
    assert.ok(months[i] > months[i - 1], `${months[i]} should be after ${months[i - 1]}`)
  }
})

test('formatBytes: bytes', () => {
  assert.equal(formatBytes(512), '512 B')
})

test('formatBytes: KB', () => {
  assert.equal(formatBytes(2048), '2.0 KB')
})

test('formatBytes: MB', () => {
  assert.equal(formatBytes(18432000), '17.6 MB')
})

test('formatBytes: GB', () => {
  assert.equal(formatBytes(2 * 1024 * 1024 * 1024), '2.00 GB')
})
