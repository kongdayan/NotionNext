const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { spawnSync } = require('node:child_process')

// Yarn 1 fetches development packages even with --production. Install from a
// temporary manifest so docs/test tooling never enters the deployment graph.
// The repository manifest and lockfile remain unchanged.
if (process.env.VERCEL !== '1') {
  throw new Error('This installer is only for Vercel build containers')
}

const root = path.resolve(__dirname, '..')
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'notionnext-install-'))
const manifest = JSON.parse(
  fs.readFileSync(path.join(root, 'package.json'), 'utf8')
)
delete manifest.devDependencies
manifest.scripts = {}
fs.writeFileSync(path.join(temporary, 'package.json'), JSON.stringify(manifest))
fs.copyFileSync(path.join(root, 'yarn.lock'), path.join(temporary, 'yarn.lock'))
fs.copyFileSync(path.join(root, '.npmrc'), path.join(temporary, '.npmrc'))

console.log(
  '[install] Installing blog and compiler dependencies with the frozen lockfile'
)
const result = spawnSync(
  'npx',
  [
    '--yes',
    'yarn@1.22.22',
    'install',
    '--frozen-lockfile',
    '--non-interactive',
    '--network-timeout',
    '60000',
    '--registry',
    'https://registry.npmjs.org'
  ],
  { cwd: temporary, stdio: 'inherit', env: process.env }
)

if (result.error || result.status !== 0) {
  fs.rmSync(temporary, { recursive: true, force: true })
  if (result.error) console.error(result.error.message)
  process.exit(result.status || 1)
}

const modules = path.join(root, 'node_modules')
const previous = path.join(temporary, 'previous-node_modules')
if (fs.existsSync(modules)) fs.renameSync(modules, previous)
fs.renameSync(path.join(temporary, 'node_modules'), modules)
fs.rmSync(temporary, { recursive: true, force: true })
console.log(
  '[install] Blog dependencies ready; repository manifest and lockfile preserved'
)
