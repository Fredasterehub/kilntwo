## Prompt: Implement `src/manifest.js` — KilnTwo Manifest Read/Write Module

### Context

You are implementing a module for the KilnTwo project located at `/DEV/kilntwo/`.

Read the following file before starting to understand the project:
- `/DEV/kilntwo/package.json` — project metadata (name: `kilntwo`, version: `0.1.0`, Node >=18, CommonJS, zero external dependencies)

The `src/` directory exists at `/DEV/kilntwo/src/` but is currently empty. You will be creating two files:
1. `/DEV/kilntwo/src/paths.js` — a helper module you must stub (see requirements below)
2. `/DEV/kilntwo/src/manifest.js` — the primary deliverable

### Task

Implement `/DEV/kilntwo/src/manifest.js`, a CommonJS Node.js module with zero external dependencies that reads, writes, validates, and checksums the KilnTwo manifest file.

You must also create `/DEV/kilntwo/src/paths.js` as a minimal stub so that `manifest.js` can `require('./paths.js')` successfully. The stub must export a `resolvePaths(homeOverride)` function — implement it properly (see spec below).

### Files to Create

- `/DEV/kilntwo/src/paths.js` — `resolvePaths` helper
- `/DEV/kilntwo/src/manifest.js` — primary deliverable

---

### Specification: `src/paths.js`

Export a single function:

```js
/**
 * Resolves KilnTwo directory paths.
 * @param {string|undefined} homeOverride - Optional override for the home directory.
 * @returns {{ home: string, configDir: string, manifestPath: string }}
 */
function resolvePaths(homeOverride) { ... }

module.exports = { resolvePaths };
```

Behavior:
- `home` = `homeOverride` if provided, otherwise `os.homedir()`
- `configDir` = `path.join(home, '.claude', 'kilntwo')`
- `manifestPath` = `path.join(configDir, 'manifest.json')`

Use only `node:os` and `node:path`.

---

### Specification: `src/manifest.js`

#### Imports

```js
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { resolvePaths } = require('./paths.js');
```

#### Manifest Schema

The manifest file lives at `<home>/.claude/kilntwo/manifest.json` and conforms to:

```json
{
  "manifestVersion": 1,
  "kwVersion": "0.1.0",
  "installedAt": "2026-02-18T00:00:00.000Z",
  "files": [
    { "path": "agents/kw-planner-claude.md", "checksum": "sha256:abc123..." }
  ],
  "protocolMarkers": {
    "begin": "kilntwo:protocol:begin",
    "end": "kilntwo:protocol:end"
  }
}
```

#### Exported Functions

**1. `readManifest(homeOverride)`**

```js
/**
 * Reads and parses the manifest.json file.
 * @param {string|undefined} homeOverride
 * @returns {object|null} Parsed manifest object, or null if the file does not exist.
 * @throws {SyntaxError} If the file exists but contains invalid JSON.
 */
function readManifest(homeOverride) { ... }
```

Behavior:
- Call `resolvePaths(homeOverride)` to get `manifestPath`.
- If the file does not exist (catch `ENOENT`), return `null`.
- Read with `fs.readFileSync(manifestPath, 'utf8')` and parse with `JSON.parse`.
- Do NOT swallow non-ENOENT errors (e.g. permission errors, malformed JSON) — let them propagate.

**2. `writeManifest(data, homeOverride)`**

```js
/**
 * Serializes and writes data to manifest.json, creating parent directories if needed.
 * @param {object} data - The manifest object to serialize.
 * @param {string|undefined} homeOverride
 * @returns {void}
 */
function writeManifest(data, homeOverride) { ... }
```

Behavior:
- Call `resolvePaths(homeOverride)` to get `configDir` and `manifestPath`.
- Create parent directories: `fs.mkdirSync(configDir, { recursive: true })`.
- Serialize with `JSON.stringify(data, null, 2)`.
- Write with `fs.writeFileSync(manifestPath, serialized, 'utf8')`.

**3. `computeChecksum(filePath)`**

```js
/**
 * Computes the SHA-256 checksum of a file.
 * @param {string} filePath - Absolute path to the file.
 * @returns {string} Checksum in the format "sha256:<hex>".
 * @throws If the file cannot be read.
 */
function computeChecksum(filePath) { ... }
```

Behavior:
- Read the file as a Buffer: `fs.readFileSync(filePath)`.
- Compute: `crypto.createHash('sha256').update(fileBuffer).digest('hex')`.
- Return `'sha256:' + hex`.

**4. `validateManifest(data)`**

```js
/**
 * Validates a manifest object against the required schema.
 * @param {object} data - The object to validate (may be null/undefined).
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateManifest(data) { ... }
```

Behavior — collect all errors into an `errors` array, then return `{ valid: errors.length === 0, errors }`:

| Check | Error message if failing |
|---|---|
| `data` is a non-null object | `'manifest must be a non-null object'` |
| `data.manifestVersion === 1` (strict number) | `'manifestVersion must be the number 1'` |
| `typeof data.kwVersion === 'string'` and non-empty | `'kwVersion must be a non-empty string'` |
| `typeof data.installedAt === 'string'` and parses as a valid date via `new Date(data.installedAt)` with `!isNaN(...)` | `'installedAt must be a valid ISO-8601 date string'` |
| `Array.isArray(data.files)` | `'files must be an array'` |
| Every entry in `data.files` has `typeof entry.path === 'string'` and `typeof entry.checksum === 'string'` | `'files[N] must have string path and checksum'` (use the actual index N) |
| `data.protocolMarkers` is a non-null object | `'protocolMarkers must be a non-null object'` |
| `typeof data.protocolMarkers.begin === 'string'` and non-empty | `'protocolMarkers.begin must be a non-empty string'` |
| `typeof data.protocolMarkers.end === 'string'` and non-empty | `'protocolMarkers.end must be a non-empty string'` |

Important: if `data` is not an object, add the first error and return immediately (do not attempt to access properties on a non-object).

If `data.files` is not an array, skip the per-entry check. If `data.protocolMarkers` is not a valid object, skip the begin/end checks.

#### Module Exports

```js
module.exports = {
  readManifest,
  writeManifest,
  computeChecksum,
  validateManifest,
};
```

---

### Acceptance Criteria

Run these checks manually to verify correctness. All must pass.

**1. Module loads without error.**
```bash
node -e "require('/DEV/kilntwo/src/manifest.js'); console.log('OK')"
```
Expected output: `OK`

**2. `validateManifest` accepts a fully valid manifest.**
```bash
node -e "
const { validateManifest } = require('/DEV/kilntwo/src/manifest.js');
const result = validateManifest({
  manifestVersion: 1,
  kwVersion: '0.1.0',
  installedAt: new Date().toISOString(),
  files: [{ path: 'agents/foo.md', checksum: 'sha256:abc' }],
  protocolMarkers: { begin: 'kilntwo:protocol:begin', end: 'kilntwo:protocol:end' }
});
console.log(result.valid, result.errors.length);
"
```
Expected output: `true 0`

**3. `validateManifest` rejects a null input.**
```bash
node -e "
const { validateManifest } = require('/DEV/kilntwo/src/manifest.js');
const result = validateManifest(null);
console.log(result.valid, result.errors[0]);
"
```
Expected output: `false manifest must be a non-null object`

**4. `validateManifest` reports per-entry file errors with correct index.**
```bash
node -e "
const { validateManifest } = require('/DEV/kilntwo/src/manifest.js');
const result = validateManifest({
  manifestVersion: 1,
  kwVersion: '0.1.0',
  installedAt: new Date().toISOString(),
  files: [{ path: 'ok.md', checksum: 'sha256:abc' }, { path: 123, checksum: 456 }],
  protocolMarkers: { begin: 'b', end: 'e' }
});
console.log(result.valid, result.errors[0]);
"
```
Expected output: `false files[1] must have string path and checksum`

**5. `readManifest` returns null when no manifest exists.**
```bash
node -e "
const { readManifest } = require('/DEV/kilntwo/src/manifest.js');
const result = readManifest('/tmp/kilntwo-no-such-dir-' + Date.now());
console.log(result);
"
```
Expected output: `null`

**6. Round-trip write and read.**
```bash
node -e "
const { writeManifest, readManifest } = require('/DEV/kilntwo/src/manifest.js');
const tmpHome = '/tmp/kilntwo-test-' + Date.now();
const data = {
  manifestVersion: 1,
  kwVersion: '0.1.0',
  installedAt: new Date().toISOString(),
  files: [],
  protocolMarkers: { begin: 'kilntwo:protocol:begin', end: 'kilntwo:protocol:end' }
};
writeManifest(data, tmpHome);
const read = readManifest(tmpHome);
console.log(read.kwVersion, read.manifestVersion, Array.isArray(read.files));
"
```
Expected output: `0.1.0 1 true`

**7. `computeChecksum` returns a valid sha256 prefix.**
```bash
node -e "
const { computeChecksum } = require('/DEV/kilntwo/src/manifest.js');
const result = computeChecksum('/DEV/kilntwo/package.json');
console.log(result.startsWith('sha256:'), result.length > 10);
"
```
Expected output: `true true`

---

### Important

- Write complete, working code — no placeholders, no TODOs, no `// implement later`.
- Use only `node:fs`, `node:path`, `node:crypto`, `node:os` (standard Node built-ins). Zero external dependencies.
- CommonJS only (`require`/`module.exports`). Do not use ES module syntax (`import`/`export`).
- Do not add a test runner or any test files — only the two source files listed above.
- Do not modify `/DEV/kilntwo/package.json`.
- Follow the error propagation rules exactly: ENOENT is silenced in `readManifest`; all other errors propagate.
