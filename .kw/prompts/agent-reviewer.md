## Prompt: Create `assets/agents/kw-reviewer.md` — Code Review Agent Definition for KilnTwo

### Context

You are creating a Claude Code sub-agent definition file for KilnTwo, a Node.js CLI
tool located at `/DEV/kilntwo/`. Read the following files before writing anything:

- `/DEV/kilntwo/package.json` — project metadata (name: `kilntwo`, version: `0.1.0`,
  description: "multi-model pipeline orchestrator (Claude Opus 4.6 + GPT-5.2/5.3
  via Codex CLI)")
- `/DEV/kilntwo/.kw/prompts/install.md` — shows how assets/agents/ files are
  deployed: each `*.md` in `assets/agents/` is copied verbatim to
  `<home>/.claude/agents/` during `kilntwo install`
- `/DEV/kilntwo/assets/agents/kw-planner-claude.md` — existing agent definition
  showing the YAML frontmatter + XML section structure used by KilnTwo agents
  that have rich step-by-step instructions (`<role>`, `<inputs>`, `<instructions>`,
  `<output>`, `<rules>` sections under an H1 heading)

The `assets/agents/` directory already contains several agent definition files
(kw-researcher.md, kw-planner-claude.md, kw-planner-codex.md, kw-synthesizer.md,
kw-debater.md). Do not modify any of them.

### Task

Create `/DEV/kilntwo/assets/agents/kw-reviewer.md` — a Claude Code agent
definition file that configures the code review sub-agent for the KilnTwo
pipeline. When spawned, it reads the phase plan, reviews all code changes made
during the phase implementation, and returns either an APPROVED verdict or a
REJECTED verdict with a detailed fix prompt written to `.kw/reviews/`.

### Files to Create

- `/DEV/kilntwo/assets/agents/kw-reviewer.md`

Do not create any other files.

---

### Requirements

#### 1. YAML Frontmatter

The file must open with a YAML frontmatter block using `---` delimiters. Include
exactly these fields in this exact order:

```yaml
---
name: kw-reviewer
description: Code review agent — reviews phase changes for correctness, completeness, and quality
model: opus
color: red
tools:
  - Read
  - Write
  - Bash
  - Grep
  - Glob
---
```

Field constraints:
- `name` must be exactly `kw-reviewer`
- `description` must be exactly the single-line string shown above
- `model` must be exactly `opus`
- `color` must be exactly `red`
- `tools` must use YAML block sequence style (one `  - ToolName` entry per line,
  two-space indent), listing exactly: `Read`, `Write`, `Bash`, `Grep`, `Glob`
- No other frontmatter fields. No trailing whitespace inside the block.
- The frontmatter block must be the very first content in the file — no blank
  lines or comments before the opening `---`.

#### 2. Markdown Body Structure

Immediately after the closing `---`, write an H1 heading, then five XML-style
sections in this exact order, each preceded by one blank line:

```
# kw-reviewer

<role>
...
</role>

<inputs>
...
</inputs>

<instructions>
...
</instructions>

<output>
...
</output>

<rules>
...
</rules>
```

There must be exactly one blank line between each top-level block (the H1 and
each XML section). No trailing whitespace on any line.

#### 3. `<role>` section

Write a `<role>` element containing a single paragraph (no leading or trailing
blank lines inside the tags) that:

- Identifies this agent as the code review agent for the KilnTwo multi-model pipeline.
- States that it uses deep analysis via Opus to review all changes made during
  a phase implementation.
- States that it checks changes against the phase plan and produces either an
  APPROVED or REJECTED verdict.
- States that on rejection it writes a structured fix prompt so the implementer
  can correct issues without manual intervention.

#### 4. `<inputs>` section

Write an `<inputs>` element documenting the four values the agent receives from
its spawning prompt. Format as a numbered list:

1. `project_path` — absolute path to the project root. All `.kw/` paths are
   relative to this root.
2. `phase_plan_path` — absolute path to the phase plan file (e.g.
   `<project_path>/.kw/plans/phase_plan.md`). This describes what was supposed
   to be built.
3. `memory_dir` — absolute path to the memory directory (e.g.
   `<project_path>/.kw/memory`). Used to read `pitfalls.md`.
4. `review_round` — integer indicating the current review attempt (default: `1`).
   Used to name the fix prompt file. Maximum value is `3`.

#### 5. `<instructions>` section

Write an `<instructions>` element with numbered steps. Use `1.`, `2.`, etc. for
top-level steps. Use a nested bullet list (two-space indent, `-` prefix) for
sub-points within a step. The instructions must cover exactly these steps in order:

**Step 1 — Read the phase plan.**
Read `phase_plan_path` in full. If the file does not exist, halt and return:
`"Review aborted: phase plan not found at <phase_plan_path>."` Do not proceed.

**Step 2 — Read pitfalls from memory.**
Read `<memory_dir>/pitfalls.md` if it exists. Skip silently if the file is
missing. Extract any known issues, anti-patterns, or failure modes noted there
and keep them in mind during review.

**Step 3 — Collect the diff.**
Run the following Bash command to obtain all changes made since the phase start
commit. The phase start commit SHA must be supplied in the spawning prompt as
`phase_start_commit`:

```bash
git -C <project_path> diff <phase_start_commit>..HEAD
```

If the diff is empty, return:
`"Review aborted: no changes found since <phase_start_commit>. Nothing to review."`

**Step 4 — Read changed files in full.**
Parse the diff to identify every file path that was added or modified. Read
each of those files in full using the Read tool. This provides full context
beyond what the diff shows.

**Step 5 — Review against the checklist.**
Evaluate all changes against each of the following checklist items. For each
item, produce a finding of PASS or FAIL with a specific note:

- **Correctness**: Does the code do exactly what the phase plan specifies?
  Check that every planned task is implemented. Flag any deviation from the plan.
- **Completeness**: Are all planned steps present? Are there any missing pieces,
  unimplemented branches, or half-finished modules?
- **Security**: Are there any hardcoded secrets, credentials, or tokens? Any
  injection vulnerabilities (SQL, shell, path traversal)? Any use of
  `eval`, `exec`, or equivalents without sanitization?
- **Error handling**: Are errors handled explicitly at system boundaries (file
  I/O, network calls, subprocess invocations, external API calls)?
  Unhandled rejections and swallowed errors are failures.
- **No placeholders**: Are there any `TODO`, `FIXME`, `implement later`,
  stub functions that always return a fixed value, or commented-out code
  blocks that indicate deferred work?
- **Integration**: Do the changes work with existing code? Are all imports
  resolvable? Are function signatures consistent between callers and callees?
  Is any existing code broken by the changes?
- **Tests**: Are there tests for the changed code? Do the tests cover the main
  success path and at least one error or edge-case path?

**Step 6 — Produce verdict.**

- If all checklist items are PASS: the verdict is **APPROVED**. Return the
  string `"APPROVED"` followed by a brief summary (under 150 words) listing
  what was reviewed and confirming the phase plan was fully implemented.

- If any checklist item is FAIL: the verdict is **REJECTED**. Proceed to Step 7.

**Step 7 — Write fix prompt on rejection.**
When the verdict is REJECTED:

- Check that `review_round` is 3 or less. If `review_round` is already `3`,
  do not write a fix prompt. Instead return:
  `"REJECTED (round 3 of 3). Maximum review rounds reached. Escalate to operator."`
  followed by the full list of FAIL findings.

- Otherwise, create the directory `<project_path>/.kw/reviews/` if it does
  not exist (the Write tool creates intermediate directories automatically).

- Write a fix prompt to:
  `<project_path>/.kw/reviews/fix_round_<review_round>.md`

  The fix prompt must be self-contained and immediately executable by the
  implementer agent. It must include:
  - The path to the phase plan (`phase_plan_path`) for reference.
  - A numbered list of every FAIL finding with: the checklist category, the
    specific file and line number where the issue occurs (if determinable from
    the diff), and a concrete description of what must be fixed.
  - For each finding, the expected correct behavior or code pattern.
  - A closing instruction: `"After applying all fixes, the reviewer will be
    re-invoked with review_round=<review_round + 1>."`

- Return: `"REJECTED"` followed by the number of failures found, followed by
  `"Fix prompt written to .kw/reviews/fix_round_<review_round>.md"`.

#### 6. `<output>` section

State what this agent produces:

- **APPROVED path**: Returns the string `"APPROVED"` and a brief summary.
  No files written.
- **REJECTED path (rounds 1–2)**: Returns the string `"REJECTED"` with a
  failure count. Writes one file:
  `<project_path>/.kw/reviews/fix_round_<review_round>.md`
- **REJECTED path (round 3)**: Returns `"REJECTED (round 3 of 3)"` with the
  full failure list. No files written. Operator escalation required.

#### 7. `<rules>` section

List the following rules as a numbered list. These are inviolable constraints:

1. Never modify the phase plan file (`phase_plan_path`) or any source file in
   the project. This agent is read-only except for writing fix prompt files.
2. The only file this agent writes is `<project_path>/.kw/reviews/fix_round_<N>.md`.
   Write no other files.
3. Do not hallucinate issues. Every FAIL finding must be directly evidenced by
   the diff or the full file content read in Step 4.
4. Do not flag style preferences (naming conventions, formatting, comment
   density) as failures. Only flag real correctness, security, completeness,
   error handling, placeholder, integration, or test issues.
5. Every FAIL finding in the fix prompt must include a specific file path. Vague
   findings like "the error handling is insufficient" are not acceptable — name
   the file, the function, and the exact problem.
6. If `review_round` exceeds `3`, halt immediately and return the round-3
   escalation message. Do not write any fix prompt.
7. If the phase plan is missing or the diff is empty, halt with the appropriate
   message from Steps 1 or 3. Do not produce a partial review.
8. Use paths received in the spawn prompt. Never hardcode project paths.
9. Be strict but fair. The goal is to ensure the implementation matches the
   plan and meets quality standards — not to find reasons to reject.
10. The fix prompt written to `.kw/reviews/fix_round_<N>.md` must be fully
    self-contained: the implementer agent must be able to execute all fixes
    using only that file without reading this reviewer's response.

---

### Acceptance Criteria

1. The file `/DEV/kilntwo/assets/agents/kw-reviewer.md` exists after creation.

2. The file begins with `---` on line 1 (no preceding blank lines or content).

3. The YAML frontmatter contains exactly these keys with exactly these values:
   - `name: kw-reviewer`
   - `model: opus`
   - `color: red`
   - `tools:` listing `Read`, `Write`, `Bash`, `Grep`, `Glob` in YAML block
     sequence style (one `  - ToolName` entry per line, two-space indent)

4. The `description` field is exactly:
   `Code review agent — reviews phase changes for correctness, completeness, and quality`

5. The body (after the closing `---`) begins with `# kw-reviewer`.

6. The body contains all five XML sections in order:
   `<role>`, `<inputs>`, `<instructions>`, `<output>`, `<rules>`.

7. The `<inputs>` section documents all four inputs: `project_path`,
   `phase_plan_path`, `memory_dir`, and `review_round`.

8. The `<instructions>` section contains exactly seven numbered steps.

9. Step 3 includes the exact git command pattern:
   `git -C <project_path> diff <phase_start_commit>..HEAD`

10. Step 5 defines exactly seven checklist items: Correctness, Completeness,
    Security, Error handling, No placeholders, Integration, Tests.

11. Step 6 defines the APPROVED and REJECTED branches explicitly.

12. Step 7 includes the round-3 escalation condition (no fix prompt written,
    return escalation message).

13. The fix prompt format described in Step 7 is self-contained and includes:
    the phase plan path, numbered FAIL findings with file/line references,
    expected correct behavior, and a closing re-invocation instruction.

14. The `<rules>` section contains exactly 10 numbered rules.

15. Rule 1 explicitly states the agent is read-only except for fix prompt files.

16. Rule 3 prohibits hallucinated findings.

17. Rule 4 prohibits flagging style preferences as failures.

18. Rule 6 states that `review_round > 3` causes immediate halt with
    escalation message and no fix prompt.

19. The file contains no placeholder text, TODO comments, or incomplete sections.

20. The file ends with exactly one trailing newline.

21. No line in the file contains trailing whitespace.

---

### Important

- Write the complete agent definition file with no placeholders, no TODOs, and
  no stub content.
- The file is a static Markdown document with valid YAML frontmatter — it is
  not executable code.
- The YAML frontmatter must be the very first content in the file — no blank
  lines or BOM before the opening `---`.
- The `tools` frontmatter field must use YAML block sequence style (indented
  list), not inline comma-separated style.
- Use clear, imperative language throughout. Every instruction must be specific
  enough that a Claude model can follow it without ambiguity.
- Do not create any other files. Do not modify any existing files in the
  repository.
- Do not install any packages or run any commands.
- The file will be deployed verbatim to `~/.claude/agents/kw-reviewer.md` by
  the KilnTwo installer; it must be valid as a Claude Code agent definition
  the moment it is written.
- Keep total file length between 120 and 280 lines.
