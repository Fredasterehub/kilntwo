## Prompt: Implement `src/doctor.js` — Prerequisites and Integrity Checker for KilnTwo

### Context

You are implementing the doctor/health-check module for KilnTwo, a Node.js CLI
tool located at `/DEV/kilntwo/`. Read `/DEV/kilntwo/package.json` for project
metadata before you begin.

The project uses CommonJS modules (`require`/`module.exports`), targets Node >= 18,
and has zero runtime dependencies. All source files live under `src/`.

Two sibling modules you must import from already exist (or will exist by the
time this module runs):

**`./paths.js`** — read `/DEV/kilntwo/.kw/prompts/paths.md` for its full
specification. The function you need:

```js
const { resolvePaths } = require('./paths');
// resolvePaths(homeOverride?) => {
//   claudeDir:    string,   // e.g. '/home/user/.claude'
//   manifestPath: string,   // e.g. '/home/user/.claude/kilntwo/manifest.json'
//   // ...other properties not needed here
// }
```

**`./manifest.js`** — a sibling module that exports:

```js
const { readManifest, computeChecksum } = require('./manifest');

// readManifest(manifestPath) => object | null
//   Reads and JSON-parses the file at `manifestPath`.
//   Returns the parsed object on success, or null if the file does not exist
//   or is not valid JSON.

// computeChecksum(filePath) => string
//   Reads the file at `filePath` synchronously and returns its SHA-256 hex
//   digest as a lowercase hex string.
//   Throws if the file cannot be read.
```

Do not implement those two modules. Only implement `doctor.js`, importing them
as shown above.

### Task

Create `/DEV/kilntwo/src/doctor.js` — a pure Node.js CommonJS module (no
third-party dependencies) that runs a series of named health checks and returns
a structured result object.

### Files to Create

- `/DEV/kilntwo/src/doctor.js`

### Requirements

#### Imports

Use only these built-in modules, with the `node:` prefix:

```js
const fs    = require('node:fs');
const path  = require('node:path');
const { execSync } = require('node:child_process');
```

Plus the two local imports shown in the Context section.

#### Exported function signature

```js
/**
 * Run KilnTwo prerequisite and integrity checks.
 *
 * @param {object}  [opts={}]
 * @param {string}  [opts.home]   - Override the home directory (default: os.homedir() via resolvePaths)
 * @param {boolean} [opts.strict] - When true, also verify per-file checksums
 * @returns {{ ok: boolean, checks: Array<{ name: string, status: 'pass'|'warn'|'fail', message: string }> }}
 */
function doctor({ home, strict } = {}) { ... }

module.exports = { doctor };
```

`ok` is `true` when no check has `status === 'fail'`; otherwise `false`.

#### Checks (run in this order)

Each check produces one entry in the `checks` array. Use exactly these `name`
values (they are referenced by consumers and tests).

---

**a. `node-version`**

Parse `process.versions.node` (e.g. `'20.11.0'`) and extract the major
version integer.

- `pass`  — major >= 18. Message: `"Node.js vX.Y.Z (major X >= 18)"`
- `fail`  — major < 18.  Message: `"Node.js vX.Y.Z is below the required v18"`

---

**b. `claude-cli`**

Check whether the `claude` CLI is on `$PATH`:

```js
execSync('which claude', { stdio: 'ignore' });
```

- `pass` — command exits 0. Message: `"claude CLI found"`
- `fail` — throws (command not found). Message: `"claude CLI not found — install via npm i -g @anthropic-ai/claude-code"`

---

**c. `codex-cli`**

Check whether the `codex` CLI is on `$PATH`:

```js
execSync('which codex', { stdio: 'ignore' });
```

- `pass` — command exits 0. Message: `"codex CLI found"`
- `fail` — throws. Message: `"codex CLI not found — install via npm i -g @openai/codex"`

---

**d. `claude-dir`**

Obtain `claudeDir` from `resolvePaths(home)`. Use `fs.accessSync(claudeDir, fs.constants.W_OK)` to test that the directory exists and is writable.

- `pass` — `accessSync` does not throw. Message: `"~/.claude/ exists and is writable"`
- `fail` — throws. Message: `"~/.claude/ is missing or not writable"`

---

**e. `teams-enabled`**

Derive the settings file path as:

```js
const settingsPath = path.join(resolvePaths(home).claudeDir, 'settings.json');
```

Attempt to read and parse the file with `fs.readFileSync` + `JSON.parse`. Then
check whether the parsed object contains a truthy `teams` key at the top level
(i.e. `parsed.teams`).

- `pass` — file exists, is valid JSON, and `parsed.teams` is truthy. Message: `"teams settings found"`
- `warn` — file does not exist, is not valid JSON, or `parsed.teams` is falsy. Message: `"~/.claude/settings.json not found or teams not configured (non-fatal)"`

This check must never produce `fail` — if anything goes wrong, emit `warn`.

---

**f. `manifest`**

Obtain `manifestPath` from `resolvePaths(home)`. Call `readManifest(manifestPath)`.

- `pass` — `readManifest` returns a non-null object. Message: `"manifest found and valid"`
- `warn` — `readManifest` returns `null`. Message: `"manifest not found — run kilntwo install first"`

This check must never produce `fail`.

---

**g. `checksums`** (only when `strict === true`)

If `strict` is falsy, skip this check entirely (do not add an entry to the
`checks` array).

When `strict` is `true`:

1. Call `readManifest(manifestPath)`. If it returns `null`, add a single entry:
   `{ name: 'checksums', status: 'warn', message: 'manifest not found — skipping checksum verification' }`
   and stop.

2. Otherwise iterate over the manifest's `files` array. Each element has the
   shape `{ path: string, checksum: string }` where `path` is an absolute
   filesystem path.

3. For each file, call `computeChecksum(file.path)` inside a try/catch:
   - If the computed checksum equals `file.checksum` — this file passes.
   - If the computed checksum differs — this file is a mismatch.
   - If `computeChecksum` throws — treat as mismatch (file unreadable).

4. After iterating, add **one** summary entry:
   - If all files passed:
     `{ name: 'checksums', status: 'pass', message: 'all N file(s) match their checksums' }`
   - If any mismatches:
     `{ name: 'checksums', status: 'warn', message: 'M of N file(s) have checksum mismatches' }`
     where M is the mismatch count and N is the total count.

   Mismatches are always `warn`, never `fail`, because installed files may be
   intentionally patched by users.

---

#### `ok` computation

After all checks have been collected, set:

```js
const ok = checks.every(c => c.status !== 'fail');
```

#### Implementation skeleton (use this structure)

```js
'use strict';

const fs   = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

const { resolvePaths }             = require('./paths');
const { readManifest, computeChecksum } = require('./manifest');

function doctor({ home, strict } = {}) {
  const checks = [];
  const paths  = resolvePaths(home);

  // a. node-version
  // b. claude-cli
  // c. codex-cli
  // d. claude-dir
  // e. teams-enabled
  // f. manifest
  // g. checksums (strict only)

  const ok = checks.every(c => c.status !== 'fail');
  return { ok, checks };
}

module.exports = { doctor };
```

### Complete Expected `module.exports` shape

```js
module.exports = {
  doctor,  // ({ home?, strict? }?) => { ok: boolean, checks: Array<{ name, status, message }> }
};
```

### Acceptance Criteria

1. `node -e "require('./src/doctor')"` in `/DEV/kilntwo` exits with code 0
   (module loads without error, even though `./paths` and `./manifest` do not
   yet exist on disk — this criterion is satisfied once those modules exist).

2. `doctor()` called with no arguments returns an object with both `ok`
   (boolean) and `checks` (array) properties.

3. `checks` contains exactly 6 entries when `strict` is falsy: `node-version`,
   `claude-cli`, `codex-cli`, `claude-dir`, `teams-enabled`, `manifest`.

4. `checks` contains exactly 7 entries when `strict` is `true` and the
   manifest is valid.

5. `checks` contains exactly 7 entries when `strict` is `true` and the
   manifest is absent (the 7th entry is the `checksums` warn about missing
   manifest).

6. Every entry in `checks` has exactly the keys `name`, `status`, `message`
   with string values.

7. `status` for every entry is one of `'pass'`, `'warn'`, or `'fail'`.

8. `ok` is `false` if and only if at least one check has `status === 'fail'`.

9. The `node-version` check passes on any Node >= 18 (the project's minimum).

10. The `teams-enabled` and `manifest` checks never produce `status === 'fail'`.

11. `execSync` calls are made with `{ stdio: 'ignore' }`.

12. The file uses only `node:fs`, `node:path`, `node:child_process`, `./paths`,
    and `./manifest` — no other imports.

13. The file uses `module.exports` (CommonJS), not `export`.

14. No placeholders, stubs, or TODO comments — the implementation is complete
    and correct.

### Important

- Write complete, working code. No placeholders or TODOs.
- Use `'use strict';` at the top.
- Do not modify `paths.js` or `manifest.js` and do not create those files.
- Do not install any packages.
- The implementation should be under ~100 lines; keep it simple and direct.
- All string messages must match the exact wording specified above — consumers
  may pattern-match on them.
