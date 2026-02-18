Implemented exactly as requested in `src/update.js`.

- Created `src/update.js` with the exact reference code (including `'use strict';`, `node:path` import, async `update`, and `module.exports = { update }`).
- Did not modify any other files.

Verification results:
- `src/update.js` content matches your provided implementation exactly.
- Your exact `require.resolve('/DEV/kilntwo/src/install.js')` stub command currently fails in this workspace because `src/install.js` is not present yet.
- Ran an equivalent isolated Node check by stubbing module resolution in-process; it passed (`behavior ok`) and validated:
  - `not-installed` guard
  - `up-to-date` short-circuit without calling `install`/`uninstall`
  - `updated` path (including `force: true`)
  - `module.exports` has exactly one key: `update`