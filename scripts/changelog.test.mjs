import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  extractBaseline,
  parseCommits,
  filterConventionalCommits,
  groupByCategory,
  generateVersion,
  formatMarkdown,
  formatDiscordEmbed,
} from './changelog.mjs'

test('extractBaseline returns hash from CHANGELOG comment', () => {
  const content = '## v2026-05-16\n\n- foo\n\n<!-- changelog-hash: abc1234 -->\n'
  assert.equal(extractBaseline(content), 'abc1234')
})

test('extractBaseline returns null when no comment', () => {
  assert.equal(extractBaseline('## v2026-05-16\n\n- foo\n'), null)
})

test('parseCommits splits git log lines into objects', () => {
  const log = 'abc1234 feat: add something\ndef5678 fix: broken thing'
  const result = parseCommits(log)
  assert.deepEqual(result, [
    { hash: 'abc1234', message: 'feat: add something' },
    { hash: 'def5678', message: 'fix: broken thing' },
  ])
})

test('parseCommits returns empty array for empty input', () => {
  assert.deepEqual(parseCommits(''), [])
})

test('filterConventionalCommits uses Chinese description after pipe separator', () => {
  const commits = [
    { hash: 'a', message: 'feat: add auto-compress | 自動壓縮圖片上傳' },
    { hash: 'b', message: 'fix: z-index issue | 修復背景層蓋住側欄' },
    { hash: 'c', message: 'feat: plain english only' },
  ]
  const result = filterConventionalCommits(commits)
  assert.equal(result[0].description, '自動壓縮圖片上傳')
  assert.equal(result[1].description, '修復背景層蓋住側欄')
  assert.equal(result[2].description, 'plain english only')
})

test('filterConventionalCommits keeps feat/fix/docs/chore/refactor/perf', () => {
  const commits = [
    { hash: 'a', message: 'feat: new thing' },
    { hash: 'b', message: 'fix(editor): broken' },
    { hash: 'c', message: 'docs: update readme' },
    { hash: 'd', message: 'chore: bump deps' },
    { hash: 'e', message: 'refactor: clean up' },
    { hash: 'f', message: 'perf: faster load' },
    { hash: 'g', message: 'Initialize project' },
    { hash: 'h', message: 'Merge pull request #1' },
  ]
  const result = filterConventionalCommits(commits)
  assert.equal(result.length, 6)
  assert.equal(result[0].type, 'feat')
  assert.equal(result[0].description, 'new thing')
  assert.equal(result[1].type, 'fix')
  assert.equal(result[1].description, 'broken')
})

test('groupByCategory splits feat/fix/other correctly', () => {
  const commits = [
    { type: 'feat', description: 'new thing' },
    { type: 'fix', description: 'broken' },
    { type: 'docs', description: 'update readme' },
    { type: 'chore', description: 'bump deps' },
    { type: 'refactor', description: 'clean up' },
  ]
  const result = groupByCategory(commits)
  assert.deepEqual(result.feat, ['new thing'])
  assert.deepEqual(result.fix, ['broken'])
  assert.deepEqual(result.other, ['update readme', 'bump deps', 'clean up'])
})

test('generateVersion returns base date version when no existing entries', () => {
  const date = new Date('2026-05-16')
  assert.equal(generateVersion('', date), 'v2026-05-16')
})

test('generateVersion appends .1 when base version already exists', () => {
  const date = new Date('2026-05-16')
  const existing = '## v2026-05-16\n\nsome content\n'
  assert.equal(generateVersion(existing, date), 'v2026-05-16.1')
})

test('generateVersion appends .2 when both base and .1 exist', () => {
  const date = new Date('2026-05-16')
  const existing = '## v2026-05-16\n\n...\n## v2026-05-16.1\n\n...\n'
  assert.equal(generateVersion(existing, date), 'v2026-05-16.2')
})

test('formatMarkdown produces correct markdown with all sections', () => {
  const groups = {
    feat: ['new thing'],
    fix: ['broken'],
    other: ['update readme'],
  }
  const result = formatMarkdown('v2026-05-16', groups, 'abc1234')
  assert.ok(result.includes('## v2026-05-16'))
  assert.ok(result.includes('### ✨ 新功能'))
  assert.ok(result.includes('- new thing'))
  assert.ok(result.includes('### 🐛 修復'))
  assert.ok(result.includes('- broken'))
  assert.ok(result.includes('### 📝 其他'))
  assert.ok(result.includes('- update readme'))
  assert.ok(result.includes('<!-- changelog-hash: abc1234 -->'))
})

test('formatMarkdown omits empty sections', () => {
  const groups = { feat: ['new thing'], fix: [], other: [] }
  const result = formatMarkdown('v2026-05-16', groups, 'abc1234')
  assert.ok(!result.includes('🐛'))
  assert.ok(!result.includes('📝'))
})

test('formatDiscordEmbed has correct title and color for commission-template', () => {
  const groups = { feat: ['new thing'], fix: [], other: [] }
  const date = new Date('2026-05-16')
  const payload = formatDiscordEmbed('commission-template', 'v2026-05-16', groups, 1, date)
  assert.equal(payload.embeds[0].title, '🆕  commission-template  v2026-05-16')
  assert.equal(payload.embeds[0].color, 0x9B59B6)
  assert.equal(payload.embeds[0].footer.text, '2026-05-16 · 1 commits')
})

test('formatDiscordEmbed truncates lists longer than 10', () => {
  const manyFeats = Array.from({ length: 13 }, (_, i) => `feature ${i + 1}`)
  const groups = { feat: manyFeats, fix: [], other: [] }
  const date = new Date('2026-05-16')
  const payload = formatDiscordEmbed('commission-template', 'v2026-05-16', groups, 13, date)
  const field = payload.embeds[0].fields[0]
  assert.ok(field.value.includes('還有 3 條...'))
  assert.equal(field.value.split('•').length - 1, 10)
})
