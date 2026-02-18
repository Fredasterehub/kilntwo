## Prompt: Implement `src/markers.js` — Versioned Protocol Block Manager

### Context

You are implementing a module for the `kilntwo` project located at `/DEV/kilntwo/`.

Read `/DEV/kilntwo/package.json` for project metadata.

The project is a Node.js CLI tool (CommonJS, `"main": "src/index.js"`, requires Node >= 18). It
currently has no source files — `src/markers.js` is the first module to be written.

No CLAUDE.md exists in this project yet. Do not create one.

---

### Task

Create `/DEV/kilntwo/src/markers.js`.

This module manages versioned **protocol blocks** inside CLAUDE.md files. A protocol block is a
fenced section inserted by kilntwo so that its managed content can be identified, replaced, and
removed without touching anything else in the file.

---

### Protocol Block Format

A protocol block looks exactly like this inside a CLAUDE.md file:

```
<!-- kilntwo:protocol:begin v1.2.3 -->
...arbitrary content lines...
<!-- kilntwo:protocol:end -->
```

Detection regexes (define these as module-level constants):

```js
const BEGIN_RE = /<!-- kilntwo:protocol:begin v([\d.]+) -->/;
const END_RE   = /<!-- kilntwo:protocol:end -->/;
```

The `BEGIN_RE` capture group 1 is the version string (e.g. `"1.2.3"`).

---

### Files to Create

- `/DEV/kilntwo/src/markers.js`

---

### Requirements

#### Module shape

CommonJS. Import only from `node:fs` and `node:path`. No third-party dependencies.

```js
'use strict';

const fs   = require('node:fs');
const path = require('node:path');
```

#### Helper: `buildBlock(content, version)`

Private (not exported). Returns the full protocol block string, always ending with a newline:

```
<!-- kilntwo:protocol:begin vX.Y.Z -->\n
<content>\n          ← append \n only if content doesn't already end with \n
<!-- kilntwo:protocol:end -->\n
```

`content` is the inner text to embed. `version` is a plain version string such as `"1.0.0"`
(no leading `v`; the function adds it).

#### Helper: `findBlock(text)`

Private. Parses the raw file text and returns `null` if no block is found, or an object:

```js
{ start: <line index of begin marker>,
  end:   <line index of end marker>,
  version: <captured version string> }
```

Strategy: split `text` by `\n`, iterate lines, find the first line matching `BEGIN_RE`, then
find the next line at or after it matching `END_RE`. If either marker is missing return `null`.

#### `insertProtocol(filePath, content, version)`

Exported. Synchronous. Behaviour by case:

1. **File does not exist** — write a new file whose entire content is `buildBlock(content, version)`.
2. **File exists, no protocol block** — read the file, append `\n` + `buildBlock(content, version)`
   to the existing content (trim trailing newlines from existing content first, then add exactly
   one `\n` before the block), write back.
3. **File exists, protocol block already present** — delegate to `replaceProtocol(filePath, content, version)`.

#### `replaceProtocol(filePath, content, version)`

Exported. Synchronous.

- Read the file.
- Call `findBlock`. If it returns `null`, throw:
  ```js
  throw new Error(`kilntwo: no protocol block found in ${filePath}`);
  ```
- Splice the lines array: replace lines from `start` through `end` (inclusive) with the lines of
  `buildBlock(content, version)` (split by `\n`; discard the trailing empty string produced by
  the final `\n` if present — rejoin with `\n` when writing).
- Write the result back with `fs.writeFileSync`. The file must end with exactly one `\n`.

Implementation note for the splice + rejoin: work at the **string** level rather than lines if
that is simpler — find the byte offsets of the begin marker line start and the end marker line end
(including its trailing `\n` if present), then do string replacement. Either approach is acceptable
as long as content outside the block is preserved character-for-character.

#### `removeProtocol(filePath)`

Exported. Synchronous.

- If the file does not exist, throw:
  ```js
  throw new Error(`kilntwo: file not found: ${filePath}`);
  ```
- Read the file, call `findBlock`. If `null`, throw:
  ```js
  throw new Error(`kilntwo: no protocol block found in ${filePath}`);
  ```
- Remove the lines from `start` through `end` inclusive.
- Rejoin remaining lines. If the result is empty or contains only whitespace, **delete the file**
  with `fs.unlinkSync(filePath)` and return.
- Otherwise write the trimmed result (trailing whitespace stripped, single trailing `\n` added)
  back to the file.

#### `hasProtocol(filePath)`

Exported. Synchronous. Returns `true` if the file exists and `findBlock` returns non-null;
otherwise `false`. Must not throw.

#### `extractVersion(filePath)`

Exported. Synchronous. Returns the version string (e.g. `"1.2.3"`) from the begin marker if a
block exists, otherwise returns `null`. Must not throw.

#### Exports

```js
module.exports = {
  insertProtocol,
  replaceProtocol,
  removeProtocol,
  hasProtocol,
  extractVersion,
};
```

---

### Edge Cases to Handle

- `content` that already ends with `\n` must not gain an extra blank line inside the block.
- Files that use `\r\n` line endings: acceptable to normalise to `\n` on read; do not need to
  preserve `\r\n`.
- `filePath` may be absolute or relative. Pass it directly to `fs` functions — do not resolve it
  unless needed for directory creation.
- When creating a new file via `insertProtocol`, ensure the parent directory exists. If it does
  not, call `fs.mkdirSync(path.dirname(filePath), { recursive: true })` before writing.

---

### Acceptance Criteria

The following test scenarios must work correctly when verified manually or via a test script:

1. **Insert into non-existent file**: calling `insertProtocol('/tmp/kw-test/CLAUDE.md', 'hello', '1.0.0')`
   creates the file containing exactly:
   ```
   <!-- kilntwo:protocol:begin v1.0.0 -->
   hello
   <!-- kilntwo:protocol:end -->
   ```

2. **Insert into existing file with no block**: the existing content is preserved above the block,
   separated by exactly one blank line.

3. **Insert into file that already has a block**: old block is replaced, surrounding content
   untouched.

4. **replaceProtocol on file with no block**: throws with message containing
   `"kilntwo: no protocol block found in"`.

5. **removeProtocol removes the block**: lines outside the block are preserved.

6. **removeProtocol on file containing only the block**: file is deleted.

7. **removeProtocol on missing file**: throws with message containing `"kilntwo: file not found:"`.

8. **hasProtocol** returns `false` for missing file, `false` for file with no block, `true` for
   file with a block.

9. **extractVersion** returns `null` for missing file / no block, returns `"2.5.1"` when block
   begins with `<!-- kilntwo:protocol:begin v2.5.1 -->`.

---

### Important

- Write complete, working code — no placeholders, no TODOs.
- Follow CommonJS conventions used in the rest of the project.
- Do not create any other files.
- Do not install or reference any npm packages.
