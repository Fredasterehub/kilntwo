## Prompt: Create `assets/agents/kw-implementer.md` — Implementer Agent Definition for KilnTwo

### Context

You are creating a Claude Code sub-agent definition file for KilnTwo, a Node.js CLI
tool located at `/DEV/kilntwo/`. Read the following files before writing anything:

- `/DEV/kilntwo/package.json` — project metadata and conventions
- `/DEV/kilntwo/.kw/prompts/install.md` — shows how assets/agents/ files are
  deployed: each `*.md` file in `assets/agents/` is copied verbatim to
  `<home>/.claude/agents/` during `kilntwo install`
- `/DEV/kilntwo/assets/agents/kw-researcher.md` — existing agent definition,
  shows the expected front-matter + `<role>` + `<instructions>` file structure
- `/DEV/kilntwo/assets/agents/kw-planner-codex.md` — existing agent definition,
  shows YAML block-sequence tool format and numbered-step instructions style

The `assets/agents/` directory currently contains `kw-researcher.md` and
`kw-planner-codex.md`. This is the third agent definition file to be placed there.

### Task

Create `/DEV/kilntwo/assets/agents/kw-implementer.md` — a Claude Code agent
definition file that configures a shell agent wrapping the Codex CLI to invoke
GPT-5.3-codex for code implementation. The agent receives a task prompt file path
and project path, pipes the task prompt to GPT-5.3-codex via Codex CLI, runs the
verification commands defined in the task prompt, commits on success, and reports
the outcome.

### Files to Create

- `/DEV/kilntwo/assets/agents/kw-implementer.md`

### Requirements

#### Front-matter block

The file must open with a YAML front-matter block (fenced by `---`) containing
exactly these fields in this order:

```
---
name: kw-implementer
description: GPT-5.3-codex implementation agent — executes task prompts to write actual code
model: sonnet
color: green
tools:
  - Read
  - Write
  - Bash
  - Grep
  - Glob
---
```

The `tools` field must use YAML block sequence style (one `  - ToolName` entry
per line, indented two spaces). No other front-matter fields. No trailing
whitespace inside the block.

#### `<role>` section

Immediately after the front-matter, include a `<role>` XML element (one blank
line between the front-matter closing `---` and the opening tag):

```
<role>
Core code-writing agent. Every line of project code flows through this agent.
Pipes task prompts to GPT-5.3-codex via Codex CLI, runs defined verification
steps, and git commits on success. Never writes code directly.
</role>
```

The text must appear as a single paragraph inside the tags with no leading or
trailing blank lines inside the element.

#### `<instructions>` section

One blank line after the closing `</role>` tag, then an `<instructions>` XML
element. The instructions must be written as an ordered numbered list covering
each step below in sequence. Use `1.`, `2.`, etc. for top-level steps. Use a
nested bullet list (two-space indent, `-` prefix) for sub-points within a step.

The instructions must cover exactly these steps in this order:

**Step 1 — Receive inputs.**
Accept three inputs from the spawn prompt: project path, task prompt path (e.g.,
`.kw/prompts/task_01.md`), and task number (e.g., `01`).

**Step 2 — Read the task prompt.**
Read the full contents of the task prompt file at the given task prompt path
under the project path. Parse out the task title from the first heading line for
use in the git commit message.

**Step 3 — Invoke Codex CLI.**
Run the following command via Bash, substituting the actual project path, task
prompt path, and task number. Use a timeout of at least 600000 milliseconds
(10 minutes) — GPT-5.3-codex is slow but thorough. Never timeout these calls:

```
cat <projectPath>/<taskPromptPath> | codex exec -m gpt-5.3-codex -c 'model_reasoning_effort="high"' --full-auto --skip-git-repo-check -C <projectPath> - -o .kw/outputs/task_<NN>_output.md
```

Create the `.kw/outputs/` directory under the project path before invoking if it
does not already exist (`mkdir -p`).

**Step 4 — Verify codex output.**
After the command completes, verify that `<projectPath>/.kw/outputs/task_<NN>_output.md`
exists and is non-empty. If the file is missing or empty, write an error message
to `<projectPath>/.kw/outputs/task_<NN>_error.md` explaining that codex produced
no output, then return a failure summary and stop.

**Step 5 — Run verification commands.**
Read the task prompt file again and locate the verification commands section
(look for a heading containing "Acceptance Criteria", "Verification", or
"Tests"). Run each command found there via Bash from the project path. Capture
stdout and stderr for each command.
  - If all commands exit with code 0: proceed to Step 6.
  - If any command fails: write the full error output to
    `<projectPath>/.kw/outputs/task_<NN>_error.md`, then return a failure
    summary containing the failing command and its output, and stop.

**Step 6 — Git commit.**
Stage all changes and create a commit:

```
git -C <projectPath> add -A && git -C <projectPath> commit -m "kw: task <NN> - <title>"
```

Where `<title>` is the task title parsed from the task prompt in Step 2.

**Step 7 — Return summary.**
Return a brief summary (under 150 words) containing: success or failure status,
the list of files changed (from the git commit output or codex output file), and
the test results from Step 5.

Format each top-level step as a numbered list item with a bold lead phrase. Keep
language direct and imperative. Sub-points under a step must be formatted as a
nested bullet list indented with two spaces.

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

There must be exactly one blank line between each top-level block. The file
must end with a single trailing newline and no trailing whitespace on any line.

### Acceptance Criteria

1. The file `/DEV/kilntwo/assets/agents/kw-implementer.md` exists.
2. The file begins with `---` on line 1.
3. `name: kw-implementer` appears in the front-matter.
4. `model: sonnet` appears in the front-matter.
5. `color: green` appears in the front-matter.
6. `description: GPT-5.3-codex implementation agent — executes task prompts to write actual code`
   appears in the front-matter.
7. The `tools:` field lists all five tools in YAML block sequence style:
   `Read`, `Write`, `Bash`, `Grep`, `Glob` (one per line, two-space indent).
8. A `<role>` element is present with a non-empty paragraph describing the agent
   as the core code-writing agent that pipes task prompts to GPT-5.3-codex and
   never writes code directly.
9. An `<instructions>` element is present and contains exactly seven numbered
   top-level steps.
10. The instructions mention a timeout of at least 600000 milliseconds (10 minutes)
    for the Codex command.
11. The instructions include the exact codex command pattern:
    `codex exec -m gpt-5.3-codex -c 'model_reasoning_effort="high"' --full-auto --skip-git-repo-check`
    with `- -o .kw/outputs/task_<NN>_output.md` as the stdin and output flags.
12. The instructions specify that the task prompt is piped via `cat` into codex
    using `-` (stdin) as the prompt argument.
13. The instructions specify checking that the output file exists and is non-empty
    before proceeding.
14. The instructions specify writing errors to
    `.kw/outputs/task_<NN>_error.md` on failure.
15. The instructions specify running verification commands from the task prompt and
    stopping on failure.
16. The instructions specify a git commit command of the form
    `git -C <projectPath> add -A && git -C <projectPath> commit -m "kw: task <NN> - <title>"`.
17. The instructions specify that the return summary must be under 150 words.
18. The instructions include a rule that the agent never modifies code directly —
    all code changes come from Codex.
19. The file ends with exactly one trailing newline.
20. No line in the file contains trailing whitespace.

### Important

- Write the complete file content — no placeholders, no TODOs.
- Do not create any other files.
- Do not modify any existing files in the repository.
- Do not install any packages or run any commands.
- This is a plain markdown/YAML file — no JavaScript, no code to execute.
- The file will be deployed verbatim to `~/.claude/agents/kw-implementer.md`
  by the KilnTwo installer; it must be valid as a Claude Code agent definition
  the moment it is written.
- The `tools` front-matter field must use YAML block sequence style (indented
  list), not inline style — match the format shown in `kw-planner-codex.md`
  exactly, not the inline `tools: Read, Write, ...` style used by
  `kw-researcher.md`.
- The agent must never write or edit code itself. All code changes are produced
  exclusively by GPT-5.3-codex via the Codex CLI invocation in Step 3.
