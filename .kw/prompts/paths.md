## Prompt: Implement `src/paths.js` — Path Resolution Module for KilnTwo

### Context

You are implementing the path resolution module for KilnTwo, a Node.js CLI tool
located at `/DEV/kilntwo/`. Read `/DEV/kilntwo/package.json` for project metadata.

The project uses CommonJS modules (`require`/`module.exports`), targets Node >= 18,
and has zero runtime dependencies. The `src/` directory is currently empty.

### Task

Create `/DEV/kilntwo/src/paths.js` — a pure Node.js module (no third-party
dependencies) that centralises all path resolution for the KilnTwo CLI.

### Files to Create

- `/DEV/kilntwo/src/paths.js`

### Requirements

Use `node:path` and `node:os` exclusively. CommonJS only.

#### 1. `resolvePaths(homeOverride)`

Export a function that accepts an optional `homeOverride` string. When omitted
(or falsy), use `os.homedir()` as the base home directory.

Return a plain object with the following properties, all resolved via
`path.join`:

| Property        | Resolved path                                    |
|-----------------|--------------------------------------------------|
| `claudeDir`     | `<home>/.claude`                                 |
| `agentsDir`     | `<home>/.claude/agents`                          |
| `commandsDir`   | `<home>/.claude/commands/kw`                     |
| `kilntwoDir`    | `<home>/.claude/kilntwo`                         |
| `templatesDir`  | `<home>/.claude/kilntwo/templates`               |
| `manifestPath`  | `<home>/.claude/kilntwo/manifest.json`           |

Example:
```js
const { resolvePaths } = require('./paths');
resolvePaths('/tmp/testhome').claudeDir;   // '/tmp/testhome/.claude'
resolvePaths('/tmp/testhome').manifestPath; // '/tmp/testhome/.claude/kilntwo/manifest.json'
resolvePaths().claudeDir;                  // e.g. '/root/.claude'
```

#### 2. `encodeProjectPath(absolutePath)`

Export a function that converts an absolute filesystem path into a safe
directory name by replacing every path separator (`/` on POSIX, `\` on
Windows — use `path.sep`) with a dash (`-`).

A leading separator produces a leading dash, which is the intended and correct
behaviour.

Examples:
```
'/DEV/foo'        → '-DEV-foo'
'/home/user/proj' → '-home-user-proj'
'C:\\Users\\foo'  → '-C:-Users-foo'   (Windows, path.sep is '\\')
```

Implementation note: use `absolutePath.split(path.sep).join('-')` so the
function works cross-platform without importing anything extra.

#### 3. `projectMemoryDir(homeOverride, projectPath)`

Export a function that returns the path to the per-project memory directory:

```
<home>/.claude/projects/<encodedPath>/memory
```

where `<encodedPath>` is the result of `encodeProjectPath(projectPath)`.

Example:
```js
projectMemoryDir('/tmp/testhome', '/DEV/foo');
// '/tmp/testhome/.claude/projects/-DEV-foo/memory'
```

#### 4. `projectClaudeMd(projectPath)`

Export a function that returns the path to the `CLAUDE.md` file inside a
given project directory:

```
<projectPath>/CLAUDE.md
```

Example:
```js
projectClaudeMd('/DEV/foo'); // '/DEV/foo/CLAUDE.md'
```

### Complete Expected `module.exports` shape

```js
module.exports = {
  resolvePaths,       // (homeOverride?) => { claudeDir, agentsDir, commandsDir, kilntwoDir, templatesDir, manifestPath }
  encodeProjectPath,  // (absolutePath) => string
  projectMemoryDir,   // (homeOverride?, projectPath) => string
  projectClaudeMd,    // (projectPath) => string
};
```

### Acceptance Criteria

1. `node -e "require('./src/paths')"` in `/DEV/kilntwo` exits with code 0.
2. `resolvePaths('/tmp/x').claudeDir === '/tmp/x/.claude'`
3. `resolvePaths('/tmp/x').agentsDir === '/tmp/x/.claude/agents'`
4. `resolvePaths('/tmp/x').commandsDir === '/tmp/x/.claude/commands/kw'`
5. `resolvePaths('/tmp/x').kilntwoDir === '/tmp/x/.claude/kilntwo'`
6. `resolvePaths('/tmp/x').templatesDir === '/tmp/x/.claude/kilntwo/templates'`
7. `resolvePaths('/tmp/x').manifestPath === '/tmp/x/.claude/kilntwo/manifest.json'`
8. `resolvePaths()` (no argument) returns paths under the real `os.homedir()` without throwing.
9. `encodeProjectPath('/DEV/foo') === '-DEV-foo'`
10. `encodeProjectPath('/home/user/proj') === '-home-user-proj'`
11. `projectMemoryDir('/tmp/x', '/DEV/foo') === '/tmp/x/.claude/projects/-DEV-foo/memory'`
12. `projectClaudeMd('/DEV/foo') === '/DEV/foo/CLAUDE.md'`
13. The file uses only `node:path` and `node:os` — no other imports.
14. The file uses `module.exports` (CommonJS), not `export`.

### Important

- Write complete, working code with no placeholders or TODOs.
- Do not create any other files.
- Do not install any packages.
- The implementation should be under ~50 lines; keep it simple and direct.
