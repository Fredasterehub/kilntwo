## Prompt: Create `assets/agents/kw-planner-codex.md` — Codex Planner Agent Definition for KilnTwo

### Context

You are creating a Claude Code sub-agent definition file for KilnTwo, a Node.js CLI
tool located at `/DEV/kilntwo/`. Read the following files before writing anything:

- `/DEV/kilntwo/package.json` — project metadata and conventions
- `/DEV/kilntwo/.kw/prompts/install.md` — shows how assets/agents/ files are
  deployed: each `*.md` file in `assets/agents/` is copied verbatim to
  `<home>/.claude/agents/` during `kilntwo install`
- `/DEV/kilntwo/assets/agents/kw-researcher.md` — existing agent definition,
  shows the expected front-matter + `<role>` + `<instructions>` file structure

The `assets/agents/` directory currently contains `kw-researcher.md`.
This is the second agent definition file to be placed there.

### Task

Create `/DEV/kilntwo/assets/agents/kw-planner-codex.md` — a Claude Code agent
definition file that configures a shell agent wrapping the Codex CLI to invoke
GPT-5.2 for implementation planning. The agent receives a phase description and
project context, constructs a comprehensive planning prompt, calls GPT-5.2 via
Codex CLI, validates the output, and returns a brief plan summary.

### Files to Create

- `/DEV/kilntwo/assets/agents/kw-planner-codex.md`

### Requirements

#### Front-matter block

The file must open with a YAML front-matter block (fenced by `---`) containing
exactly these fields in this order:

```
---
name: kw-planner-codex
description: GPT-5.2 planning agent via Codex CLI — produces alternative implementation plans
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
Codex CLI wrapper that invokes GPT-5.2 for implementation planning. Constructs
a detailed planning prompt from project context, invokes GPT-5.2 via Codex CLI,
validates the output, and returns a brief summary of the resulting plan.
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
Accept three inputs from the spawn prompt: phase description, project path, and
memory directory path.

**Step 2 — Read memory and understand the codebase.**
Read all files in the memory directory (vision, decisions, pitfalls, and any
other `.md` files present). Use Glob to discover the memory directory contents
first, then Read each file. Use Grep and Glob on the project path to understand
the current codebase structure.

**Step 3 — Construct a comprehensive planning prompt.**
Build a prompt string that includes all of the following sub-sections (include
each as a labeled section in the prompt):

- Project context: the project path and a summary of the codebase structure
  discovered in Step 2.
- Phase goal and requirements: the full phase description received in Step 1.
- Memory contents: the full text of each memory file read in Step 2, labeled
  by filename (vision, decisions, pitfalls, etc.).
- Output format request: ask GPT-5.2 to produce a step-by-step plan of atomic
  tasks, where each task specifies its goal, the files it changes, its
  dependencies on prior tasks, and how to verify it succeeded.

**Step 4 — Invoke Codex CLI.**
Run the following command via Bash, substituting the actual project path and the
constructed prompt. Use a timeout of at least 600 seconds (10 minutes) — GPT-5.2
is slow but thorough:

```
codex exec -m gpt-5.2 -c 'model_reasoning_effort="high"' --skip-git-repo-check -C <projectPath> "<prompt>" -o .kw/plans/codex_plan.md
```

Create the `.kw/plans/` directory under the project path before invoking if it
does not already exist (`mkdir -p`).

**Step 5 — Validate output.**
After the command completes, verify that `<projectPath>/.kw/plans/codex_plan.md`
exists and is non-empty. If the file is missing or empty, retry once with a
simplified prompt that omits codebase structure details and includes only the
phase description and memory contents. If the retry also fails, write an error
message to `<projectPath>/.kw/plans/codex_plan.md` explaining what failed and
exit.

**Step 6 — Return summary.**
Read the first 50 lines of the generated plan and return a brief summary (under
200 words) describing the number of tasks found, the first task title, and
whether the plan appears complete.

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

1. The file `/DEV/kilntwo/assets/agents/kw-planner-codex.md` exists.
2. The file begins with `---` on line 1.
3. `name: kw-planner-codex` appears in the front-matter.
4. `model: sonnet` appears in the front-matter.
5. `color: green` appears in the front-matter.
6. The `tools:` field lists all five tools in YAML block sequence style:
   `Read`, `Write`, `Bash`, `Grep`, `Glob` (one per line, two-space indent).
7. A `<role>` element is present with a non-empty paragraph describing the
   agent as a Codex CLI wrapper that invokes GPT-5.2 for planning.
8. An `<instructions>` element is present and contains exactly six numbered
   top-level steps.
9. The instructions mention a timeout of at least 600 seconds for the Codex
   command.
10. The instructions include the exact codex command pattern:
    `codex exec -m gpt-5.2 -c 'model_reasoning_effort="high"' --skip-git-repo-check`
    with `-o .kw/plans/codex_plan.md` as the output flag.
11. The instructions include a retry-once rule for when the output file is
    missing or empty.
12. The instructions specify that the return summary must be under 200 words.
13. The instructions specify reading memory files and using them in the prompt.
14. The instructions specify that the planning prompt must request atomic tasks
    with goals, file changes, dependencies, and verification criteria.
15. The file ends with exactly one trailing newline.
16. No line in the file contains trailing whitespace.

### Important

- Write the complete file content — no placeholders, no TODOs.
- Do not create any other files.
- Do not modify any existing files in the repository.
- Do not install any packages or run any commands.
- This is a plain markdown/YAML file — no JavaScript, no code to execute.
- The file will be deployed verbatim to `~/.claude/agents/kw-planner-codex.md`
  by the KilnTwo installer; it must be valid as a Claude Code agent definition
  the moment it is written.
- The `tools` front-matter field must use YAML block sequence style (indented
  list), not inline style — match the format shown in the Requirements section
  exactly, not the inline `tools: Read, Write, ...` style used by
  `kw-researcher.md`.
