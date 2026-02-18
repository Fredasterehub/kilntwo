# Review: REJECTED

## Files Reviewed

| File | Rating |
|------|--------|
| `/DEV/kilntwo/src/paths.js` | APPROVED |
| `/DEV/kilntwo/src/markers.js` | APPROVED (minor note) |
| `/DEV/kilntwo/src/manifest.js` | APPROVED |
| `/DEV/kilntwo/src/install.js` | NEEDS_FIX (4 critical bugs) |
| `/DEV/kilntwo/src/uninstall.js` | NEEDS_FIX (1 critical bug, depends on install fix) |
| `/DEV/kilntwo/src/doctor.js` | NEEDS_FIX (1 critical bug) |
| `/DEV/kilntwo/src/update.js` | NEEDS_FIX (1 critical bug) |
| `/DEV/kilntwo/bin/kilntwo.js` | APPROVED (with minor notes) |

## Issues Found

### Critical: install.js has 4 inter-module API mismatches

1. **`writeManifest` called with wrong argument order** (`/DEV/kilntwo/src/install.js:85`):
   `writeManifest(manifestPath, { version: VERSION, files })` but `manifest.js` defines
   `writeManifest(data, homeOverride)` -- data must be the first argument, homeOverride second.
   The current code passes the manifestPath string as data and the actual data object as homeOverride.

2. **`readManifest` called with wrong argument type** (`/DEV/kilntwo/src/install.js:27`):
   `readManifest(manifestPath)` passes the full manifest file path as a string, but `manifest.js`
   treats a string argument as a `homeOverride` for `resolvePaths()`. This would resolve to a
   doubly-nested wrong path like `<manifestPath>/.claude/kilntwo/manifest.json`. Should be
   `readManifest({ manifestPath })` or `readManifest(home)`.

3. **`insertProtocol` called with only 2 arguments** (`/DEV/kilntwo/src/install.js:79`):
   `insertProtocol(claudeMdPath, protocolContent)` but `markers.js` defines
   `insertProtocol(filePath, content, version)` requiring 3 arguments. The missing `version`
   parameter becomes `undefined`, producing `<!-- kilntwo:protocol:begin vundefined -->` in
   the protocol block.

4. **Manifest `files` shape mismatch** (`/DEV/kilntwo/src/install.js:81-84`):
   install.js writes `files` as a plain object `{ absolutePath: checksum }`:
   ```js
   const files = {};
   for (const destPath of installed) {
     files[destPath] = computeChecksum(destPath);
   }
   ```
   But `uninstall.js` (line 22) iterates `manifest.files` as an array of objects with
   `file.path` and uses `path.join(paths.claudeDir, file.path)` expecting relative paths.
   `doctor.js` (line 115) also checks `Array.isArray(strictManifest.files)`.
   The prompts for both uninstall and doctor specify `files` as an array:
   `[{ path: "agents/foo.md", checksum: "sha256:abc" }]`.

### Critical: doctor.js readManifest wrong argument

5. **`readManifest` called with manifest file path** (`/DEV/kilntwo/src/doctor.js:94`):
   `readManifest(manifestPath)` passes the full path to manifest.json as if it were a
   homeOverride string. Same issue as install.js item 2. Should use
   `readManifest({ manifestPath })`.

### Critical: update.js readManifest ignores home override

6. **`readManifest({ home })` does not forward home** (`/DEV/kilntwo/src/update.js:10`):
   `readManifest({ home })` passes an object `{ home: '/some/path' }`, but `manifest.js`
   `readManifest` only recognizes `options.manifestPath` when given an object. When it does not
   find `manifestPath`, it falls through and calls `resolvePaths(undefined)`, completely
   ignoring the home override. Should pass the home string directly: `readManifest(home)`.

### Non-critical notes

7. **`assets/protocol.md` does not exist**: `install.js` line 78 reads
   `path.join(ASSETS_DIR, 'protocol.md')` but the file is not present under `/DEV/kilntwo/assets/`.
   This causes install to crash at runtime. This may be expected if protocol.md is to be created
   in a later phase, but install.js will throw `ENOENT` until then.

8. **TODO comments in CLI**: `/DEV/kilntwo/bin/kilntwo.js` lines 241, 253, 265, 277 contain
   `// TODO: src/X.js does not exist yet.` comments. These are dead comments since the modules
   now exist. Not blocking but should be cleaned up.

9. **`markers.js` removeProtocol behavior**: The markers.js prompt specifies that `removeProtocol`
   should throw when the file is missing or has no block. The implementation instead returns
   silently (no-op). This matches what `uninstall.js` needs and is pragmatically correct, so
   this is noted but not flagged as a fix.

---

## Correction Prompt for gpt-5.3-codex

### Context

You previously implemented Phase 1 modules for the KilnTwo project at `/DEV/kilntwo/`.
The following inter-module API mismatches were found during code review and must be fixed.
The core issue is that `install.js`, `doctor.js`, and `update.js` call `manifest.js` functions
with incorrect argument types or order, and `install.js` writes a manifest with a `files` shape
that does not match what `uninstall.js` and `doctor.js` expect.

### Files to Fix

- `/DEV/kilntwo/src/install.js` (4 issues)
- `/DEV/kilntwo/src/doctor.js` (1 issue)
- `/DEV/kilntwo/src/update.js` (1 issue)
- `/DEV/kilntwo/bin/kilntwo.js` (remove dead TODO comments)

### Required Corrections

1. **In `/DEV/kilntwo/src/install.js:27`**: Change `readManifest(manifestPath)` to
   `readManifest(home)`. The `readManifest` function in `manifest.js` accepts a
   `homeOverride` string (or undefined) as its first argument when not passing an object.
   Passing the home override string allows `resolvePaths` to derive the correct manifest path.

2. **In `/DEV/kilntwo/src/install.js:79`**: Change `insertProtocol(claudeMdPath, protocolContent)`
   to `insertProtocol(claudeMdPath, protocolContent, VERSION)`. The `insertProtocol` function
   in `markers.js` requires three arguments: `(filePath, content, version)`.

3. **In `/DEV/kilntwo/src/install.js:81-85`**: Change the manifest `files` from an object to an
   array of `{ path, checksum }` objects where `path` is relative to `claudeDir`. This matches
   what `uninstall.js` expects when it does `path.join(paths.claudeDir, file.path)` and what
   `doctor.js` expects with `Array.isArray(manifest.files)`.

   Replace:
   ```js
   const files = {};
   for (const destPath of installed) {
     files[destPath] = computeChecksum(destPath);
   }
   writeManifest(manifestPath, { version: VERSION, files });
   ```

   With:
   ```js
   const paths = resolvePaths(home);
   const files = installed.map((destPath) => ({
     path: path.relative(paths.claudeDir, destPath),
     checksum: computeChecksum(destPath),
   }));
   writeManifest({
     manifestVersion: 1,
     kwVersion: VERSION,
     installedAt: new Date().toISOString(),
     files,
     protocolMarkers: {
       begin: 'kilntwo:protocol:begin',
       end: 'kilntwo:protocol:end',
     },
   }, home);
   ```

   Note: `writeManifest(data, homeOverride)` takes the data object as the first argument and
   the optional homeOverride string as the second. Also note the manifest schema from
   `manifest.js` uses `kwVersion` (not `version`) and `manifestVersion: 1`.

4. **In `/DEV/kilntwo/src/install.js:27-28`**: Also update the priorManifest handling to
   match the array shape. Change:
   ```js
   const priorManifest = readManifest(manifestPath) || { files: {} };
   if (!priorManifest.files) priorManifest.files = {};
   ```
   To:
   ```js
   const priorManifest = readManifest(home) || { files: [] };
   if (!Array.isArray(priorManifest.files)) priorManifest.files = [];
   ```
   (Note: `priorManifest` is not actually used for anything beyond initialization in the
   current code, but it should still use the correct shape for future use.)

5. **In `/DEV/kilntwo/src/doctor.js:94`**: Change `readManifest(manifestPath)` to
   `readManifest({ manifestPath })`. The `readManifest` function in `manifest.js` accepts
   an object with a `manifestPath` property to use a specific path directly. Do the same
   on line 107: `readManifest(manifestPath)` should become `readManifest({ manifestPath })`.

6. **In `/DEV/kilntwo/src/update.js:10`**: Change `readManifest({ home })` to
   `readManifest(home)`. The `readManifest` function treats a string argument as a
   `homeOverride` and passes it to `resolvePaths()`. Passing the home string directly
   (which may be undefined) is correct.

7. **In `/DEV/kilntwo/src/update.js:17`**: Change `manifest.version` to `manifest.kwVersion`.
   The manifest schema uses `kwVersion`, not `version`, for the installed KilnTwo version.

8. **In `/DEV/kilntwo/bin/kilntwo.js:241,253,265,277`**: Remove the four `// TODO: src/X.js
   does not exist yet.` comments. The modules now exist. These are dead comments.

### Acceptance Criteria

- `node -e "require('/DEV/kilntwo/src/install')"` exits with code 0.
- `install({ home: '/tmp/kw-test-' + Date.now(), projectPath: '/tmp/kw-proj-test' })`
  succeeds without throwing (assuming assets/protocol.md exists or is created first).
- The manifest written by install has `files` as an array of `{ path, checksum }` objects
  where `path` is relative to `claudeDir` (e.g. `"kilntwo/templates/vision.md"`).
- The manifest written by install includes `manifestVersion: 1`, `kwVersion`, `installedAt`,
  and `protocolMarkers`.
- `insertProtocol` is called with the VERSION string as the third argument.
- `readManifest` calls in doctor.js use `{ manifestPath }` object syntax.
- `readManifest` call in update.js passes the home string directly.
- update.js reads `manifest.kwVersion` not `manifest.version`.
- No TODO comments remain in `bin/kilntwo.js`.
- All modules continue to load without errors.
- Running `install` then `uninstall` works end-to-end (files are tracked and removed correctly).

### Important

- Only fix the listed issues -- do not refactor or change other code.
- Maintain existing behavior for parts that passed review.
- Handle errors explicitly.
- Do not change `manifest.js`, `markers.js`, `paths.js`, or `uninstall.js`.
