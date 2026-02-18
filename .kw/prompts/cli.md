## Prompt: Implement `bin/kilntwo.js` — CLI Entry Point for KilnTwo

### Context

You are implementing the CLI entry point for KilnTwo, a Node.js tool located at
`/DEV/kilntwo/`. Read the following files before starting:

- `/DEV/kilntwo/package.json` — project metadata (name: `kilntwo`, version:
  `0.1.0`, Node >=18, CommonJS, zero external dependencies, `bin.kilntwo`
  points to `./bin/kilntwo.js`)

The `bin/` directory exists at `/DEV/kilntwo/bin/` and is currently empty.
The `src/` directory exists at `/DEV/kilntwo/src/` and may already contain
`install.js`, `uninstall.js`, `update.js`, and `doctor.js`. Read each of those
files if they exist to understand their exported function signatures before
wiring them up. If a src module does not exist yet, stub its import with a
`TODO` comment and skip calling it (do not create those files as part of this
task).

### Task

Create `/DEV/kilntwo/bin/kilntwo.js` — the hashbang CLI entry point. It is the
single file described in `package.json`'s `"bin"` field. It must:

1. Be executable as `node bin/kilntwo.js <args>` and (after `chmod +x`) as
   `./bin/kilntwo.js <args>`.
2. Parse arguments without any third-party library.
3. Dispatch to the corresponding `src/` module.
4. Print human-readable ANSI-colored output by default, or JSON when `--json`
   is passed.
5. Exit with code 0 on success, 1 on error or unknown/missing command.

### Files to Create

- `/DEV/kilntwo/bin/kilntwo.js`

Do not create any other files.

---

### Requirements

#### 1. Hashbang and module format

The very first line of the file must be exactly:

```
#!/usr/bin/env node
```

The rest of the file uses CommonJS (`require` / `module.exports`). Do not use
ES module syntax.

#### 2. Argument parsing

Parse `process.argv.slice(2)` with a simple hand-written loop — no `yargs`,
`commander`, `minimist`, or any other third-party package.

Parsing rules:

- Iterate the array left to right.
- `--version` — set `flags.version = true`.
- `--force` — set `flags.force = true`.
- `--json` — set `flags.json = true`.
- `--strict` — set `flags.strict = true`.
- `--home <dir>` — the **next** element in the array is the value; set
  `flags.home = argv[i + 1]` and advance the index by an extra 1 to skip the
  value token.
- The first argument that does not start with `--` is the command. Store it in
  `command`. Any subsequent non-flag arguments are ignored.
- Unknown flags (start with `--` but are not in the list above) are silently
  ignored.

Result shape:

```js
// Example after parsing: kilntwo install --home /tmp --force --json
{
  command: 'install',
  flags: { home: '/tmp', force: true, json: true, strict: false, version: false }
}
```

#### 3. Version flag

When `flags.version` is `true` (regardless of command):

- Read `version` from `/DEV/kilntwo/package.json` using
  `require('../package.json').version`.
- Print `kilntwo v<version>` to stdout.
- Exit with code 0.

Handle this check before dispatching to any command.

#### 4. ANSI color helpers

Define these small helpers at the top of the file (no external dependency).
Use the standard ANSI escape sequences:

```js
const RESET  = '\x1b[0m';
const GREEN  = '\x1b[32m';
const RED    = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BOLD   = '\x1b[1m';

const ok   = (msg) => `${GREEN}✓${RESET} ${msg}`;
const fail = (msg) => `${RED}✗${RESET} ${msg}`;
const warn = (msg) => `${YELLOW}!${RESET} ${msg}`;
const bold = (msg) => `${BOLD}${msg}${RESET}`;
```

#### 5. Output mode

All output goes to `process.stdout` via `console.log`.

- **Default (no `--json`):** Print human-readable lines using the helpers
  above. Format specifics are described per-command below.
- **`--json`:** Print a single `JSON.stringify(result, null, 2)` of the object
  returned by the src module function, then exit. Do not print any other lines
  when `--json` is active.

Errors (thrown exceptions) are always printed to `process.stderr` via
`console.error` with the red `fail()` helper for human mode, or as a JSON
object `{ error: err.message }` for `--json` mode, followed by `process.exit(1)`.

#### 6. Help text

Define a constant `HELP_TEXT` that produces the following output when printed
(use template literals for multi-line; keep exact spacing):

```
Usage: kilntwo <command> [options]

Commands:
  install    Install KilnTwo agents and commands into ~/.claude
  uninstall  Remove KilnTwo files from ~/.claude
  update     Update installed KilnTwo files to the current version
  doctor     Check the KilnTwo installation for problems
  help       Show this help message

Options:
  --home <dir>  Use <dir> instead of ~ as the home directory
  --force       Overwrite existing files (install/update)
  --json        Output results as JSON
  --strict      Treat warnings as errors (doctor)
  --version     Print the kilntwo version and exit
```

#### 7. Command dispatch

After parsing args and handling `--version`, dispatch on `command`:

```
'install'   → require('../src/install.js')
'uninstall' → require('../src/uninstall.js')
'update'    → require('../src/update.js')
'doctor'    → require('../src/doctor.js')
'help'      → print HELP_TEXT, exit 0
undefined / anything else → print HELP_TEXT, exit 1
```

Wrap all dispatch logic in a `try/catch`. If the required src module does not
export a function (e.g. the file doesn't exist yet), catch the error, print it
as a failure, and exit 1.

#### 8. Command-specific output (human mode)

Each src module is called synchronously and returns a result object. Use the
following conventions when `--json` is NOT set:

**`install({ home, force })`**

The result is expected to have a `files` array where each entry has `{ path,
status }`. `status` is one of `'installed'`, `'skipped'`, `'error'`.

Print one line per file:
- `'installed'` → `ok(path)`
- `'skipped'`   → `warn(\`${path} (skipped)\`)`
- `'error'`     → `fail(path)`

After the list, print a summary line using `bold()`:
```
bold(`\n${installed} installed, ${skipped} skipped, ${errors} errors`)
```

If the result object has a top-level `error` string, print `fail(result.error)`
and exit 1.

**`uninstall({ home })`**

The result is expected to have a `removed` array of file path strings and
optionally a `notFound` array.

Print one line per removed file: `ok(\`removed: ${path}\`)`.
If `notFound` exists and has entries, print each as: `warn(\`not found: ${path}\`)`.
After the list: `bold(\`\n${removed.length} file(s) removed\`)`.

**`update({ home, force })`**

The result is expected to have an `updates` array where each entry has `{ path,
status }`. `status` is one of `'updated'`, `'skipped'`, `'error'`.

Print identically to install output but substitute `'updated'` for
`'installed'` in the summary:
```
bold(`\n${updated} updated, ${skipped} skipped, ${errors} errors`)
```

**`doctor({ home, strict })`**

The result is expected to have a `checks` array where each entry has `{ name,
status, message }`. `status` is one of `'ok'`, `'warn'`, `'error'`.

Print one line per check:
- `'ok'`   → `ok(name)` (append `: ${message}` if message is non-empty)
- `'warn'` → `warn(name)` (append `: ${message}` if message is non-empty)
- `'error'`→ `fail(name)` (append `: ${message}` if message is non-empty)

After all checks, if `strict` is true treat any `'warn'` as a failure. Print a
final summary:
```
bold(`\nPassed: ${passed}  Warned: ${warned}  Failed: ${failed}`)
```

If any check has `status === 'error'`, or (`strict` is true and any check has
`status === 'warn'`), exit with code 1. Otherwise exit 0.

#### 9. Exit codes

| Situation | Exit code |
|---|---|
| `--version` printed | 0 |
| `help` command or no command | 0 / 1 (see above) |
| Command succeeded (no errors) | 0 |
| Command returned errors | 1 |
| Unhandled exception | 1 |
| Unknown command | 1 |

#### 10. Structure of the file

Write the code in this top-level order:

1. Hashbang line
2. `'use strict';`
3. ANSI constants and helper functions (`ok`, `fail`, `warn`, `bold`)
4. `HELP_TEXT` constant
5. `parseArgs(argv)` function — pure function, takes an array, returns
   `{ command, flags }`
6. `printResult(command, result, flags)` function — handles human-mode output
   for all commands; returns exit code (`0` or `1`)
7. `main()` async function — reads args, handles `--version`, dispatches,
   calls `printResult` or JSON-prints, manages exit codes
8. `main().catch(err => { console.error(fail(err.message)); process.exit(1); })`

---

### Acceptance Criteria

Run each check manually. All must pass.

**1. File loads without error.**
```bash
node /DEV/kilntwo/bin/kilntwo.js help
```
Expected: prints the usage text, exits 0.

**2. `--version` flag.**
```bash
node /DEV/kilntwo/bin/kilntwo.js --version
```
Expected stdout contains: `kilntwo v0.1.0`
Expected exit code: `0`

**3. No command exits 1 and prints help.**
```bash
node /DEV/kilntwo/bin/kilntwo.js; echo "exit:$?"
```
Expected: usage text printed, `exit:1` on last line.

**4. Unknown command exits 1 and prints help.**
```bash
node /DEV/kilntwo/bin/kilntwo.js foobar; echo "exit:$?"
```
Expected: usage text printed, `exit:1` on last line.

**5. `parseArgs` unit-level check (inline).**
```bash
node -e "
const argv = ['install', '--home', '/tmp/x', '--force', '--json'];
// inline a copy of parseArgs here is not needed — test the full binary:
"
```
Instead, verify parsing via the binary with `--json`:
```bash
node /DEV/kilntwo/bin/kilntwo.js install --home /tmp --force --json 2>&1 | head -5
```
Expected: either valid JSON output or a clean error message (not a Node.js
stack trace crash), exit code 0 or 1 but no uncaught exception.

**6. ANSI colors are emitted in default mode.**
```bash
node /DEV/kilntwo/bin/kilntwo.js help | cat -v | grep -c '\\^\\['
```
Expected: a number greater than 0 (ANSI codes present).

**7. `--json` suppresses ANSI colors (no `\x1b` in output).**
When running a command with `--json`, the output must not contain ANSI escape
sequences. (This will be verifiable once src modules exist.)

**8. File is syntactically valid.**
```bash
node --check /DEV/kilntwo/bin/kilntwo.js
```
Expected: exits 0 (no syntax errors).

**9. Hashbang is the first line.**
```bash
head -1 /DEV/kilntwo/bin/kilntwo.js
```
Expected: `#!/usr/bin/env node`

---

### Important

- Write complete, working code — no placeholders, no TODOs (except for the
  `require` call comments when a src module does not yet exist on disk, as
  noted in Context above).
- The file must use CommonJS (`require` / `module.exports`). Do not use ES
  module `import`/`export`.
- Do not install any packages. Do not add entries to `package.json`.
- Do not create any src module files — only `bin/kilntwo.js`.
- Do not modify `/DEV/kilntwo/package.json`.
- Use only Node.js built-in modules: `node:fs`, `node:path`. No other imports
  besides `require('../package.json')` (JSON) and the `../src/` modules
  (dynamic, inside try/catch).
- The ANSI escape sequences must be defined as plain string literals — do not
  use `chalk`, `kleur`, `picocolors`, or any other coloring library.
- Keep the implementation straightforward and readable. Aim for under 200 lines.
