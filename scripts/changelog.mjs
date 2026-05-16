import { execSync } from 'node:child_process'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// ── Pure functions (exported for testing) ────────────────────────────────────

export function extractBaseline(changelogContent) {
  const match = changelogContent.match(/<!-- changelog-hash: ([a-f0-9]+) -->/)
  return match ? match[1] : null
}

export function parseCommits(gitLogOutput) {
  if (!gitLogOutput.trim()) return []
  return gitLogOutput.trim().split('\n').map(line => {
    const spaceIdx = line.indexOf(' ')
    return { hash: line.slice(0, spaceIdx), message: line.slice(spaceIdx + 1) }
  })
}

export function filterConventionalCommits(commits) {
  const pattern = /^(feat|fix|docs|chore|refactor|perf)(\([^)]+\))?:\s+(.+)$/
  return commits.flatMap(commit => {
    const match = commit.message.match(pattern)
    if (!match) return []
    const raw = match[3]
    const pipeIdx = raw.indexOf(' | ')
    const description = pipeIdx !== -1 ? raw.slice(pipeIdx + 3) : raw
    return [{ ...commit, type: match[1], description }]
  })
}

export function groupByCategory(commits) {
  const groups = { feat: [], fix: [], other: [] }
  for (const { type, description } of commits) {
    if (type === 'feat') groups.feat.push(description)
    else if (type === 'fix') groups.fix.push(description)
    else groups.other.push(description)
  }
  return groups
}

export function generateVersion(changelogContent, date = new Date()) {
  const dateStr = date.toISOString().slice(0, 10)
  const base = `v${dateStr}`
  const matches = changelogContent.match(new RegExp(`^## ${base}`, 'gm')) ?? []
  if (matches.length === 0) return base
  return `${base}.${matches.length}`
}

const COLORS = {
  'commission-template': 0x9B59B6,
  'commission-hub': 0x3498DB,
}

function truncateList(items, max = 10) {
  if (items.length <= max) return { displayed: items, extra: 0 }
  return { displayed: items.slice(0, max), extra: items.length - max }
}

export function formatMarkdown(version, groups, headHash) {
  const lines = [`## ${version}`, '']
  if (groups.feat.length > 0) {
    lines.push('### ✨ 新功能', ...groups.feat.map(d => `- ${d}`), '')
  }
  if (groups.fix.length > 0) {
    lines.push('### 🐛 修復', ...groups.fix.map(d => `- ${d}`), '')
  }
  if (groups.other.length > 0) {
    lines.push('### 📝 其他', ...groups.other.map(d => `- ${d}`), '')
  }
  lines.push(`<!-- changelog-hash: ${headHash} -->`, '')
  return lines.join('\n')
}

export function formatDiscordEmbed(repoName, version, groups, totalCommits, date = new Date()) {
  const color = COLORS[repoName] ?? 0x7289DA
  const dateStr = date.toISOString().slice(0, 10)
  const fields = []

  for (const [key, label] of [['feat', '✨ 新功能'], ['fix', '🐛 修復'], ['other', '📝 其他']]) {
    if (groups[key].length === 0) continue
    const { displayed, extra } = truncateList(groups[key])
    let value = displayed.map(d => `• ${d}`).join('\n')
    if (extra > 0) value += `\n還有 ${extra} 條...`
    fields.push({ name: label, value, inline: false })
  }

  return {
    embeds: [{
      title: `🆕  ${repoName}  ${version}`,
      color,
      fields,
      footer: { text: `${dateStr} · ${totalCommits} commits` },
    }],
  }
}

// ── Side-effectful main (not tested directly) ─────────────────────────────────

async function main() {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL
  if (!webhookUrl) throw new Error('DISCORD_WEBHOOK_URL env var is required')

  const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
  const repoName = process.env.REPO_NAME ?? pkg.name

  const changelogPath = 'CHANGELOG.md'
  const changelogContent = existsSync(changelogPath)
    ? readFileSync(changelogPath, 'utf8')
    : ''

  const baseline = extractBaseline(changelogContent)
  const range = baseline ? `${baseline}..HEAD` : 'HEAD'
  const gitLog = execSync(`git log ${range} --oneline`, { encoding: 'utf8' })

  const allCommits = parseCommits(gitLog)
  const headHash = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim()

  const conventional = filterConventionalCommits(allCommits)
  if (conventional.length === 0) {
    console.log('No qualifying commits since last changelog. Nothing to do.')
    return
  }

  const version = generateVersion(changelogContent)
  const groups = groupByCategory(conventional)
  const entry = formatMarkdown(version, groups, headHash)
  const newContent = entry + changelogContent
  writeFileSync(changelogPath, newContent, 'utf8')
  console.log(`Written to ${changelogPath}`)

  const totalCommits = allCommits.length
  const payload = formatDiscordEmbed(repoName, version, groups, totalCommits)
  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`Discord POST failed: ${res.status} ${await res.text()}`)
  console.log(`Posted to Discord: ${version}`)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(err => { console.error(err.message); process.exit(1) })
}
