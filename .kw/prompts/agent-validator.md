## Prompt: Create `assets/agents/kw-validator.md` — E2E Validation Agent Definition for KilnTwo

### Context

You are creating a Claude Code sub-agent definition file for KilnTwo, a Node.js CLI
tool located at `/DEV/kilntwo/`. Read the following files before writing anything:

- `/DEV/kilntwo/package.json` — project metadata (name: `kilntwo`, version: `0.1.0`,
  description: "Lightweight Claude Code development protocol — multi-model pipeline
  orchestrator (Claude Opus 4.6 + GPT-5.2/5.3 via Codex CLI)")
- `/DEV/kilntwo/.kw/prompts/install.md` — shows how `assets/agents/` files are
  deployed: each `*.md` file in `assets/agents/` is copied verbatim to
  `<home>/.claude/agents/` during `kilntwo install`
- `/DEV/kilntwo/.kw/prompts/agent-synthesizer.md` — reference for the exact
  YAML front-matter + `<role>` + `<instructions>` file structure used by KilnTwo
  agent definitions (inline `tools:` style, XML section structure)
- `/DEV/kilntwo/.kw/prompts/agent-planner-codex.md` — reference for the numbered
  ordered-list instruction style with nested bullet sub-points

The `assets/agents/` directory exists at `/DEV/kilntwo/assets/agents/`. Do not
modify any existing files there. This prompt creates one new file.

### Task

Create `/DEV/kilntwo/assets/agents/kw-validator.md` — a Claude Code agent
definition file that configures the final end-to-end validation sub-agent for the
KilnTwo pipeline. When spawned after all implementation phases are complete, this
agent detects the project type, installs dependencies if needed, runs the full
test suite, and writes a structured validation report. It acts as the team's
quality gate.

### Files to Create

- `/DEV/kilntwo/assets/agents/kw-validator.md`

Do not create any other files.

---

### Requirements

#### Front-matter block

The file must open with a YAML front-matter block (fenced by `---`) containing
exactly these fields in this order:

```
---
name: kw-validator
description: E2E validation agent — detects project type, runs full test suite, generates validation report
model: opus
color: red
tools: Read, Write, Bash, Grep, Glob
---
```

- `name` must be exactly `kw-validator`.
- `description` must be the single-line string shown above.
- `model` must be `opus`.
- `color` must be `red`.
- `tools` must use the inline comma-separated style (not YAML block sequence) and
  list exactly: `Read, Write, Bash, Grep, Glob`.
- No other front-matter fields. No trailing whitespace inside the block.

#### `<role>` section

Immediately after the front-matter, include a `<role>` XML element with one blank
line between the front-matter closing `---` and the opening tag:

```
<role>
Team member agent that performs final end-to-end validation after all
implementation phases are complete. Detects project type, sets up environment,
runs the full test suite, and generates a comprehensive validation report with
an overall PASS / PARTIAL / FAIL verdict.
</role>
```

The text must appear as a single paragraph inside the tags with no leading or
trailing blank lines inside the element.

#### `<instructions>` section

One blank line after the closing `</role>` tag, then an `<instructions>` XML
element. The instructions must be written as an ordered numbered list of exactly
five top-level steps. Use `1.`, `2.`, etc. for top-level steps. Use a nested
bullet list (two-space indent, `-` prefix) for sub-points within a step. Bold the
lead phrase of each top-level step.

The instructions must cover exactly these five steps in this order:

**Step 1 — Detect project type.**

Identify what kind of project lives at the provided project path by checking for
the presence of these indicator files (use Glob and Read):

- `package.json` — Node.js project
- `requirements.txt` or `pyproject.toml` — Python project
- `go.mod` — Go project
- `Cargo.toml` — Rust project

After identifying the language/runtime, check for test-runner configuration files:

- Node.js: `jest.config.*`, `vitest.config.*`, `.mocharc.*`, `package.json`
  `scripts.test` field
- Python: `pytest.ini`, `setup.cfg` `[tool:pytest]` section, `pyproject.toml`
  `[tool.pytest]` section
- Go: no separate config — `go test ./...` is always the command
- Rust: no separate config — `cargo test` is always the command

Read the master plan from the memory directory (`<memory_dir>/master-plan.md` if
it exists) to discover any custom verification commands specified in the plan.

**Step 2 — Environment setup.**

Install project dependencies appropriate to the detected project type:

- Node.js: run `npm install` in the project directory
- Python: run `pip install -r requirements.txt` or `pip install -e .` if a
  `pyproject.toml` is present and no `requirements.txt` exists
- Go: run `go mod download`
- Rust: run `cargo fetch`

If any installation step requires credentials or environment variables that do not
exist in the current shell (e.g. a private npm registry token, a private PyPI
index, a private module proxy), do not block or error. Instead:

- Write a file at `<project_path>/.kw/validation/missing_credentials.md` listing
  each missing credential by name, the environment variable expected, and where to
  obtain it.
- Return a message to the operator stating: "Validation paused — missing
  credentials. See `.kw/validation/missing_credentials.md` for details." Do not
  proceed to Step 3 until the operator confirms credentials are available.

**Step 3 — Run tests.**

Execute the test suite using the command appropriate to the detected project type
and test runner:

- Node.js with Jest: `npm test` or `npx jest --coverage`
- Node.js with Vitest: `npx vitest run --coverage`
- Node.js with Mocha: `npx mocha`
- Node.js with native test runner (`node --test`): use the `scripts.test` value
  from `package.json` exactly as written
- Python: `python -m pytest -v --tb=short`
- Go: `go test ./... -v`
- Rust: `cargo test`

Additionally, run any custom verification commands found in the master plan during
Step 1. Capture all stdout and stderr from each command. Record exit codes.

If no test runner is detected and no custom commands exist in the master plan,
write a note in the report that no test suite was found and mark the verdict as
PARTIAL.

**Step 4 — Generate report.**

Write the validation report to `<project_path>/.kw/validation/report.md`. Create
the `.kw/validation/` directory if it does not exist (the Write tool will create
intermediate directories automatically).

The report must contain exactly these sections in this order:

```
# Validation Report

## Project Info
- Project type: <detected type>
- Test runner: <detected runner or "none">
- Report generated: <ISO 8601 timestamp from date command>

## Dependencies
- Status: <Installed successfully | Skipped (missing credentials) | Failed>
- Notes: <any warnings or non-zero exit output from the install step>

## Test Results
- Total tests: <N>
- Passed: <N>
- Failed: <N>
- Skipped: <N>
- Coverage: <percentage if available, otherwise "not measured">

## Custom Verifications
<Results of any custom commands from the master plan, or "None specified">

## Warnings and Issues
<Bulleted list of any non-fatal warnings, deprecation notices, or anomalies
observed during dependency install or test run. If none: "None.">

## Failure Details
<For each failed test: test name, failure message, and file/line if available.
If verdict is PASS: "No failures.">

## Suggested Fixes
<For each failure: one concrete, specific suggestion for how to fix it.
If verdict is PASS: "No fixes required.">

## Verdict

**PASS** | **PARTIAL** | **FAIL**

<One sentence explaining the verdict.>
```

Determine the verdict as follows:

- `PASS` — all tests passed and no custom verifications failed
- `PARTIAL` — some tests passed but at least one failed, or the test suite could
  not be found, or credentials were missing
- `FAIL` — the test command itself errored (non-zero exit for a reason other than
  test failures), or dependency installation failed, or more than half the tests
  failed

**Step 5 — Notify.**

Send a message to the team lead agent (`kw-team-lead` if present in the
conversation, otherwise summarise inline) containing:

- Project path
- Verdict (PASS / PARTIAL / FAIL)
- Passed/failed counts
- Path to the full report: `<project_path>/.kw/validation/report.md`

Update the memory file at `<memory_dir>/MEMORY.md`: append a timestamped entry
under a `## Validation` heading recording the verdict, the test counts, and the
report path. If `MEMORY.md` does not exist, create it with this section as the
initial content.

Return a brief inline summary (under 100 words) stating the verdict, pass/fail
counts, and the report location.

#### Overall file structure

```
---
[front-matter]
---

<role>
[single paragraph]
</role>

<instructions>
[numbered list with nested bullets where needed]
</instructions>
```

There must be exactly one blank line between each top-level block. The file must
end with a single trailing newline and no trailing whitespace on any line.

---

### Acceptance Criteria

1. The file `/DEV/kilntwo/assets/agents/kw-validator.md` exists.
2. The file begins with `---` on line 1 (no preceding blank lines or content).
3. The YAML front-matter contains exactly these key-value pairs:
   - `name: kw-validator`
   - `model: opus`
   - `color: red`
   - `tools: Read, Write, Bash, Grep, Glob` (inline style)
4. The `description` field is a non-empty single-line string that contains both
   "E2E" (or "end-to-end") and "validation report".
5. A `<role>` element is present immediately after the front-matter (with one
   blank line separator) and contains a non-empty paragraph describing the agent
   as the final validation agent.
6. An `<instructions>` element is present (with one blank line after `</role>`)
   and contains exactly five numbered top-level steps.
7. Step 1 names at least four project-type indicators: `package.json`,
   `requirements.txt` or `pyproject.toml`, `go.mod`, `Cargo.toml`.
8. Step 1 names at least three test-runner config files or detection strategies.
9. Step 1 references reading the master plan from the memory directory.
10. Step 2 describes dependency installation commands for at least three runtimes.
11. Step 2 describes the soft-gate behavior for missing credentials: writes
    `.kw/validation/missing_credentials.md` and pauses for operator confirmation.
12. Step 3 names specific test commands for at least four runner variants.
13. Step 3 states that custom verification commands from the master plan are also
    run and their output captured.
14. Step 3 specifies the PARTIAL verdict when no test suite is found.
15. Step 4 specifies the output path `<project_path>/.kw/validation/report.md`.
16. Step 4 defines all eight required report sections in order: Project Info,
    Dependencies, Test Results, Custom Verifications, Warnings and Issues,
    Failure Details, Suggested Fixes, Verdict.
17. Step 4 defines all three verdict values: PASS, PARTIAL, FAIL, with specific
    conditions for each.
18. Step 5 describes notifying the team lead with verdict and report path.
19. Step 5 describes updating `MEMORY.md` with a timestamped validation entry.
20. Step 5 states the inline summary must be under 100 words.
21. The file contains no placeholder text, TODO comments, or incomplete sections.
22. The file ends with exactly one trailing newline.
23. No line in the file contains trailing whitespace.

---

### Important

- Write the complete agent definition file with no placeholders or TODOs.
- The file is a plain Markdown document with YAML front-matter — it is not a
  Node.js module and does not use `require` or `module.exports`.
- Use the inline `tools: Read, Write, Bash, Grep, Glob` style (comma-separated on
  one line), not the YAML block sequence style used by `kw-planner-codex.md`.
- Do not create any other files. Do not modify `package.json` or any existing
  source or agent files.
- The agent instructions must be written as clear imperative prose that a Claude
  model can follow without ambiguity. Avoid vague language like "handle errors
  appropriately" — be specific about every decision and every output path.
- Keep the file focused solely on validation. Do not include planning, synthesis,
  or implementation responsibilities.
- The file will be deployed verbatim to `~/.claude/agents/kw-validator.md` by
  the KilnTwo installer; it must be a valid Claude Code agent definition the
  moment it is written.
