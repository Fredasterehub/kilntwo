## Prompt: Implement `src/update.js` — Version-Aware Update Module for KilnTwo

### Context

You are implementing the update module for KilnTwo, a Node.js CLI tool located at
`/DEV/kilntwo/`. Read the following files for project context before writing any code:

- `/DEV/kilntwo/package.json` — project metadata, current version is in `.version`
- `/DEV/kilntwo/.kw/prompts/paths.md` — documents the path resolution conventions
  used throughout the project (read it to understand `manifest.json` location)

The project uses CommonJS modules (`require`/`module.exports`), targets Node >= 18,
and has zero runtime dependencies. All sibling source modules in `src/` follow the
same conventions.

Prior steps have established (or will establish before this module runs) the following
modules that `update.js` must import from:

| Module               | Exported symbol | Signature (brief)                                           |
|----------------------|-----------------|-------------------------------------------------------------|
| `./manifest.js`      | `readManifest`  | `readManifest({ home }) => { version, ... } \| null`       |
| `./install.js`       | `install`       | `install({ home, force }) => { installed, ... }`           |
| `./uninstall.js`     | `uninstall`     | `uninstall({ home }) => { removed, ... }`                  |

Do not create those files — they already exist (or will exist when this module is
invoked). Only create `src/update.js`.

### Task

Create `/DEV/kilntwo/src/update.js` — a pure Node.js module (zero third-party
dependencies) that orchestrates a version-aware upgrade of KilnTwo by reading the
currently-installed version from the on-disk manifest, comparing it to the bundled
package version, and running uninstall then install only when an update is required.

### Files to Create

- `/DEV/kilntwo/src/update.js`

### Requirements

#### Imports

```js
const path = require('node:path');
const { readManifest } = require('./manifest.js');
const { install }      = require('./install.js');
const { uninstall }    = require('./uninstall.js');
const currentVersion   = require('../package.json').version;
```

`node:path` is the only Node built-in you may import. No other built-ins, no
third-party packages.

#### Exported function: `update({ home, force } = {})`

Export a single named function. The function is **synchronous or async** — choose
whichever is consistent with how `readManifest`, `install`, and `uninstall` are
designed. Because you do not have their source, write `update` as an `async`
function and `await` each call; this is safe regardless of whether the callee
returns a plain value or a Promise.

##### Step-by-step logic

1. **Read the installed manifest.**

   ```js
   const manifest = await readManifest({ home });
   ```

2. **Guard: not installed.**

   If `manifest` is falsy (null, undefined, or any falsy value), return immediately:

   ```js
   return { error: 'not-installed', hint: 'Run kilntwo install first' };
   ```

3. **Guard: already up to date.**

   Capture the installed version:

   ```js
   const oldVersion = manifest.version;
   ```

   If `oldVersion === currentVersion` AND `force` is falsy, return immediately:

   ```js
   return { status: 'up-to-date', version: currentVersion };
   ```

4. **Perform the update.**

   Run uninstall, then install, in that order:

   ```js
   const { removed }    = await uninstall({ home });
   const { installed }  = await install({ home, force: true });
   ```

5. **Return the result.**

   ```js
   return {
     status:    'updated',
     from:      oldVersion,
     to:        currentVersion,
     installed,
     removed,
   };
   ```

#### Complete `module.exports` shape

```js
module.exports = { update };
```

Only `update` is exported. Do not export any helper symbols.

### Full reference implementation (exact code to produce)

```js
'use strict';

const path = require('node:path');
const { readManifest } = require('./manifest.js');
const { install }      = require('./install.js');
const { uninstall }    = require('./uninstall.js');
const currentVersion   = require('../package.json').version;

async function update({ home, force } = {}) {
  const manifest = await readManifest({ home });

  if (!manifest) {
    return { error: 'not-installed', hint: 'Run kilntwo install first' };
  }

  const oldVersion = manifest.version;

  if (oldVersion === currentVersion && !force) {
    return { status: 'up-to-date', version: currentVersion };
  }

  const { removed }   = await uninstall({ home });
  const { installed } = await install({ home, force: true });

  return {
    status:    'updated',
    from:      oldVersion,
    to:        currentVersion,
    installed,
    removed,
  };
}

module.exports = { update };
```

Write exactly this code. Do not add extra exports, helpers, comments, or logging
unless the acceptance criteria below require them.

### Acceptance Criteria

1. `/DEV/kilntwo/src/update.js` exists after this step.

2. The file can be required without errors when its dependencies are stubbed.
   Verify with:

   ```bash
   node -e "
     // Stub dependencies so require works in isolation
     require.cache[require.resolve('/DEV/kilntwo/src/manifest.js')] =
       { id: 'manifest', filename: 'manifest', loaded: true,
         exports: { readManifest: async () => ({ version: '0.1.0' }) } };
     require.cache[require.resolve('/DEV/kilntwo/src/install.js')] =
       { id: 'install', filename: 'install', loaded: true,
         exports: { install: async () => ({ installed: [] }) } };
     require.cache[require.resolve('/DEV/kilntwo/src/uninstall.js')] =
       { id: 'uninstall', filename: 'uninstall', loaded: true,
         exports: { uninstall: async () => ({ removed: [] }) } };
     const { update } = require('/DEV/kilntwo/src/update.js');
     console.assert(typeof update === 'function', 'update must be a function');
     console.log('require ok');
   "
   ```

   Expected output: `require ok` with exit code 0.

3. When `readManifest` returns `null`, `update()` resolves to an object with
   `error === 'not-installed'` and `hint === 'Run kilntwo install first'`.

4. When the manifest version equals `currentVersion` and `force` is not set,
   `update()` resolves to `{ status: 'up-to-date', version: currentVersion }`.
   Neither `install` nor `uninstall` are called in this path.

5. When the manifest version differs from `currentVersion` (or `force` is true),
   `update()` resolves to an object with `status === 'updated'`, `from` set to the
   old version, `to` set to `currentVersion`, and `installed`/`removed` arrays
   populated from the return values of `install`/`uninstall`.

6. `module.exports` has exactly one key: `update`.

7. The file uses only `node:path` as a Node built-in. No other built-ins
   (`node:fs`, `node:os`, etc.) are imported.

8. The file uses `module.exports` (CommonJS), not `export` or `export default`.

9. `'use strict';` is present as the first line.

### Important

- Write complete, working code with no placeholders, TODOs, or stub bodies.
- Do not create any other files (`manifest.js`, `install.js`, `uninstall.js`,
  tests, etc.).
- Do not install any packages.
- Do not modify `/DEV/kilntwo/package.json` or any existing file.
- The implementation must be under ~35 lines; keep it minimal and direct.
- `node:path` is required in the imports section but is not explicitly used in the
  logic above — include it anyway, as it is specified in the module contract and
  may be used by callers who inspect the module's dependency list, or reserved for
  future path-joining helpers.
