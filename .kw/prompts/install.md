## Prompt: Implement `src/install.js` — Asset Installation Module for KilnTwo

### Context

You are implementing the asset installation module for KilnTwo, a Node.js CLI tool
located at `/DEV/kilntwo/`. Read the following files before writing any code:

- `/DEV/kilntwo/package.json` — project metadata (version is `0.1.0`)
- `/DEV/kilntwo/src/paths.js` — provides `resolvePaths(homeOverride?)` which
  returns `{ claudeDir, agentsDir, commandsDir, kilntwoDir, templatesDir, manifestPath }`
- `/DEV/kilntwo/src/manifest.js` — provides `writeManifest(manifestPath, data)`,
  `computeChecksum(filePath)`, and `readManifest(manifestPath)`
- `/DEV/kilntwo/src/markers.js` — provides `insertProtocol(claudeMdPath, protocolContent)`

The project uses CommonJS (`require`/`module.exports`), targets Node >= 18, and has
zero runtime dependencies. Only `node:fs` and `node:path` are permitted imports
(plus the local modules and `package.json` listed above).

Assets live under `/DEV/kilntwo/assets/` in these subdirectories:
- `agents/` — `*.md` files to copy to `<home>/.claude/agents/`
- `commands/kw/` — `*.md` files to copy to `<home>/.claude/commands/kw/`
- `templates/` — `*.md` files to copy to `<home>/.claude/kilntwo/templates/`
- `protocol.md` — content to inject into the project's `CLAUDE.md`

### Task

Create `/DEV/kilntwo/src/install.js` — a pure Node.js module that copies KilnTwo
assets into a user's `~/.claude/` directory tree, manages a manifest of installed
files, and injects the KilnTwo protocol block into the project's `CLAUDE.md`.

### Files to Create

- `/DEV/kilntwo/src/install.js`

### Requirements

#### Module imports

```js
'use strict';
const fs   = require('node:fs');
const path = require('node:path');
const { resolvePaths }                          = require('./paths');
const { writeManifest, computeChecksum, readManifest } = require('./manifest');
const { insertProtocol }                        = require('./markers');
const VERSION = require('../package.json').version;
const ASSETS_DIR = path.join(__dirname, '..', 'assets');
```

#### Exported function signature

```js
/**
 * @param {object}  [opts={}]
 * @param {string}  [opts.home]        - override home directory (default: os.homedir() via resolvePaths)
 * @param {boolean} [opts.force=false] - overwrite user-edited files when true
 * @param {string}  [opts.projectPath] - project root whose CLAUDE.md receives the protocol block
 *                                       (default: process.cwd())
 * @returns {{ installed: string[], skipped: string[], version: string }}
 */
function install({ home, force = false, projectPath } = {}) { ... }

module.exports = { install };
```

#### Step-by-step implementation

**1. Resolve paths**

Call `resolvePaths(home)` and destructure:
```js
const { agentsDir, commandsDir, kilntwoDir, templatesDir, manifestPath } = resolvePaths(home);
```

**2. Create directories**

Use `fs.mkdirSync(dir, { recursive: true })` for each of:
`agentsDir`, `commandsDir`, `kilntwoDir`, `templatesDir`

**3. Load existing manifest**

Call `readManifest(manifestPath)`. It should return either `null` (no prior
install) or an object shaped `{ version, files: { [destPath]: checksum } }`.
Treat `null` as `{ files: {} }`.

**4. Define copy jobs**

Build an array of `{ srcDir, destDir }` pairs:
```js
const copyJobs = [
  { srcDir: path.join(ASSETS_DIR, 'agents'),        destDir: agentsDir    },
  { srcDir: path.join(ASSETS_DIR, 'commands', 'kw'), destDir: commandsDir  },
  { srcDir: path.join(ASSETS_DIR, 'templates'),     destDir: templatesDir },
];
```

**5. Copy files with force / skip logic**

For each job, read all `*.md` files in `srcDir` using `fs.readdirSync(srcDir)`
filtered to entries ending in `.md`. For each file:

- `srcPath = path.join(srcDir, filename)`
- `destPath = path.join(destDir, filename)`

Decide whether to write:
- If `force` is `true`: always copy (`fs.copyFileSync`). Add `destPath` to
  `installed`.
- If `force` is `false`:
  - If the destination file does **not** exist: copy it. Add `destPath` to
    `installed`.
  - If it **does** exist: compute `computeChecksum(destPath)` for the destination
    and `computeChecksum(srcPath)` for the source.
    - If checksums match: the file is already up-to-date. Add `destPath` to
      `installed` (idempotent, counts as installed, not skipped).
    - If checksums differ: the user has edited the file. Print a warning to
      stderr:
      ```
      [kilntwo] skipping <destPath> (user-edited; use --force to overwrite)
      ```
      Add `destPath` to `skipped`. Do **not** overwrite.

**6. Inject protocol into CLAUDE.md**

```js
const resolvedProject = projectPath || process.cwd();
const claudeMdPath    = path.join(resolvedProject, 'CLAUDE.md');
const protocolSrc     = path.join(ASSETS_DIR, 'protocol.md');
const protocolContent = fs.readFileSync(protocolSrc, 'utf8');
insertProtocol(claudeMdPath, protocolContent);
```

Do not add `claudeMdPath` to `installed` or `skipped` — the manifest tracks only
copied asset files.

**7. Build and write manifest**

Construct a `files` object mapping every `destPath` in `installed` to its
checksum (call `computeChecksum(destPath)` for each):

```js
const files = {};
for (const destPath of installed) {
  files[destPath] = computeChecksum(destPath);
}
writeManifest(manifestPath, { version: VERSION, files });
```

**8. Return result**

```js
return { installed, skipped, version: VERSION };
```

#### Idempotency guarantee

Running `install()` twice with no file changes must produce identical results:
the same `installed` list, an empty `skipped` list, and the same manifest
content. The `computeChecksum` comparison in step 5 ensures this.

### Complete Expected `module.exports` shape

```js
module.exports = {
  install, // ({ home?, force?, projectPath? }?) => { installed: string[], skipped: string[], version: string }
};
```

### Acceptance Criteria

1. `node -e "require('./src/install')"` in `/DEV/kilntwo` exits with code 0.
2. Calling `install({ home: '/tmp/testhome', projectPath: '/tmp/testproject' })`
   creates directories `/tmp/testhome/.claude/agents`,
   `/tmp/testhome/.claude/commands/kw`, `/tmp/testhome/.claude/kilntwo`,
   and `/tmp/testhome/.claude/kilntwo/templates` (verified with `fs.existsSync`).
3. Every `*.md` file in `assets/agents/` appears under
   `/tmp/testhome/.claude/agents/` after install.
4. Every `*.md` file in `assets/commands/kw/` appears under
   `/tmp/testhome/.claude/commands/kw/` after install.
5. Every `*.md` file in `assets/templates/` appears under
   `/tmp/testhome/.claude/kilntwo/templates/` after install.
6. A second call to `install({ home: '/tmp/testhome', projectPath: '/tmp/testproject' })`
   returns `skipped: []` (idempotent — checksums match, nothing skipped).
7. If a destination file is manually modified before the second call and `force`
   is `false`, that file's path appears in `skipped` and the file is not
   overwritten.
8. If `force: true` is passed, all files are overwritten regardless of checksum
   differences; `skipped` is empty.
9. The return value always has the shape
   `{ installed: string[], skipped: string[], version: string }` where `version`
   equals the value in `package.json`.
10. `/tmp/testhome/.claude/kilntwo/manifest.json` exists after install and
    contains a `files` object whose keys are absolute destination paths and
    values are checksum strings.
11. The file uses only `node:fs`, `node:path`, and the four local imports listed
    above — no other imports.
12. The file uses `module.exports` (CommonJS), not `export`.

### Important

- Write complete, working code with no placeholders or TODOs.
- Do not create any other files.
- Do not install any packages.
- If `assets/agents/`, `assets/commands/kw/`, or `assets/templates/` do not
  exist at runtime, skip that job silently (use a try/catch around
  `fs.readdirSync` or check `fs.existsSync` before reading).
- The `srcDir` directories for copy jobs may be empty; handle zero-file
  directories without error.
- Do not modify `/DEV/kilntwo/src/paths.js`, `manifest.js`, or `markers.js`.
- The implementation should be under ~90 lines; keep it straightforward and direct.
