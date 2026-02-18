## Prompt: Implement `src/uninstall.js` — Manifest-Driven Uninstall Module for KilnTwo

### Context

You are implementing the uninstall module for KilnTwo, a Node.js CLI tool located
at `/DEV/kilntwo/`. Read `/DEV/kilntwo/package.json` for project metadata.

The project uses CommonJS modules (`require`/`module.exports`), targets Node >= 18,
and has zero runtime dependencies.

The following sibling modules exist (or will exist) in `/DEV/kilntwo/src/` and must
be imported — do not reimplement their logic:

- `./paths.js` — exports `resolvePaths(homeOverride?)` which returns an object with
  `{ claudeDir, agentsDir, commandsDir, kilntwoDir, templatesDir, manifestPath }`.
  All properties are absolute path strings rooted at `<home>/.claude/`.
  Relevant properties for uninstall:
  - `commandsDir`  → `<home>/.claude/commands/kw`
  - `kilntwoDir`   → `<home>/.claude/kilntwo`
  - `templatesDir` → `<home>/.claude/kilntwo/templates`
  - `manifestPath` → `<home>/.claude/kilntwo/manifest.json`

- `./manifest.js` — exports `readManifest({ manifestPath })` which returns the
  parsed manifest object when the file exists, or `null` when it does not. The
  manifest object has at minimum a `files` array of objects with a `path` property
  (a relative path string such as `"agents/foo.md"` or `"commands/kw/bar.md"`).

- `./markers.js` — exports two functions relevant here:
  - `removeProtocol(claudeMdPath)` — removes the KilnTwo protocol block from the
    given CLAUDE.md file path. Must be called with the absolute path to CLAUDE.md
    in the current working directory. Is a no-op (does not throw) when the file
    does not exist or contains no protocol block.
  - `hasProtocol(claudeMdPath)` — returns a boolean indicating whether the
    protocol block is present. Available for use but not required to call explicitly
    since `removeProtocol` is already a no-op when absent.

### Task

Create `/DEV/kilntwo/src/uninstall.js` — a pure Node.js CommonJS module that
performs a manifest-driven uninstall of KilnTwo from the user's home directory.

### Files to Create

- `/DEV/kilntwo/src/uninstall.js`

### Requirements

Use only `node:fs` and `node:path` from Node's standard library. Import the three
local modules described above. CommonJS only — use `require`/`module.exports`.

#### Exported function: `uninstall({ home } = {})`

Export a single named function `uninstall`. It accepts one optional options object
with an optional `home` property (a path string). When `home` is falsy or omitted,
pass `undefined` to `resolvePaths` so it falls back to `os.homedir()` internally.

The function is synchronous. It must execute the following steps in order:

**Step 1 — Resolve paths.**
Call `resolvePaths(home)` to obtain `{ commandsDir, kilntwoDir, templatesDir, manifestPath }`.

**Step 2 — Read the manifest.**
Call `readManifest({ manifestPath })`. If the return value is `null` (manifest file
does not exist), immediately return the object `{ error: 'not-installed' }` and
perform no further filesystem operations.

**Step 3 — Delete tracked files.**
Iterate `manifest.files`. For each entry, compute the absolute path:

```
path.join(paths.claudeDir, file.path)
```

where `paths.claudeDir` comes from `resolvePaths`. Attempt to delete the file using
`fs.unlinkSync`. Collect results into two arrays:

- `removed`   — absolute paths of files that were successfully deleted.
- `notFound`  — absolute paths of files that did not exist (caught `ENOENT`).

Any error code other than `ENOENT` must be re-thrown so the caller sees it.

**Step 4 — Remove the protocol block from CLAUDE.md.**
Compute the path to `CLAUDE.md` in the current working directory:

```js
path.join(process.cwd(), 'CLAUDE.md')
```

Call `removeProtocol(claudeMdPath)`. Do not guard this with an existence check —
`removeProtocol` is already a no-op when the file or block is absent.

**Step 5 — Remove empty directories.**
Attempt to remove the following directories in this exact order (most-nested first):

1. `templatesDir`  (`<home>/.claude/kilntwo/templates`)
2. `kilntwoDir`    (`<home>/.claude/kilntwo`)
3. `commandsDir`   (`<home>/.claude/commands/kw`)

For each directory, call `fs.rmdirSync(dirPath)`. This call succeeds only when the
directory is empty; when the directory is non-empty Node throws `ENOTEMPTY` (or
`EEXIST` on some platforms). Catch both `ENOTEMPTY` and `EEXIST` silently. Also
catch `ENOENT` silently (directory was never created). Re-throw any other error.

Do not remove `claudeDir` (`<home>/.claude`) itself — only the three directories
listed above.

**Step 6 — Delete the manifest file.**
Call `fs.unlinkSync(manifestPath)`. If the file no longer exists (`ENOENT`), ignore
the error. Re-throw anything else.

**Step 7 — Return the result.**
Return the plain object:

```js
{ removed, notFound }
```

where both values are the arrays populated in Step 3 (arrays of absolute path
strings). Do not include the manifest file path itself in either array.

#### Complete module structure

```js
'use strict';

const fs   = require('node:fs');
const path = require('node:path');

const { resolvePaths }   = require('./paths');
const { readManifest }   = require('./manifest');
const { removeProtocol } = require('./markers');

function uninstall({ home } = {}) {
  // ... implementation ...
}

module.exports = { uninstall };
```

### Acceptance Criteria

1. `node -e "require('./src/uninstall')"` in `/DEV/kilntwo` exits with code 0.
2. When called with a `home` that has no manifest file, the return value strictly
   equals `{ error: 'not-installed' }` (no other keys, no thrown error).
3. When called with a `home` whose manifest lists files that exist, each file is
   deleted and its absolute path appears in the `removed` array.
4. When called with a `home` whose manifest lists files that do not exist, those
   paths appear in `notFound` and no exception is thrown.
5. Files NOT listed in the manifest are never deleted, even if they exist under
   `claudeDir`.
6. `removeProtocol` is called exactly once with the absolute path to `CLAUDE.md`
   in `process.cwd()`.
7. Empty directories (`templatesDir`, `kilntwoDir`, `commandsDir`) are removed
   when empty; non-empty directories are left intact without throwing.
8. The manifest file itself is deleted as the final filesystem operation (Step 6).
9. The manifest file path does not appear in either `removed` or `notFound`.
10. The return value for a successful uninstall contains exactly the keys `removed`
    and `notFound`, both arrays of strings.
11. The module uses only `node:fs`, `node:path`, `./paths`, `./manifest`, and
    `./markers` — no other imports.
12. The module uses `module.exports` (CommonJS), not `export`.

### Important

- Write complete, working code with no placeholders or TODOs.
- Do not create any other files.
- Do not install any packages.
- Do not reimplement logic from `paths.js`, `manifest.js`, or `markers.js` — call
  those modules via `require`.
- The implementation should be under ~70 lines; keep it direct and readable.
- Operate strictly on the manifest's `files` array — never glob or scan directories.
