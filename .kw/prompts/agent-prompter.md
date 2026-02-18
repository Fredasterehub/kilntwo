## Prompt: Create `assets/agents/kw-prompter.md` — Prompter Agent Definition for KilnTwo

### Context

You are creating a Claude Code sub-agent definition file for KilnTwo, a Node.js CLI
tool located at `/DEV/kilntwo/`. Read the following files before writing anything:

- `/DEV/kilntwo/package.json` — project metadata and conventions
- `/DEV/kilntwo/assets/agents/kw-researcher.md` — an existing agent definition in
  the same directory; use it as the canonical reference for file format, front-matter
  field ordering, XML section structure, and whitespace conventions

The `assets/agents/` directory already contains `kw-researcher.md`. You are adding
a second agent definition file to that directory.

Agent definition files in `assets/agents/` are copied verbatim to
`<home>/.claude/agents/` during `kilntwo install`. They must be valid Claude Code
agent definitions the moment they are written.

### Task

Create `/DEV/kilntwo/assets/agents/kw-prompter.md` — a Claude Code agent definition
file that configures the KilnTwo prompter sub-agent. This agent receives a synthesized
phase plan, invokes GPT-5.2 via the Codex CLI to generate individual task prompts,
parses the output into numbered files, and writes a manifest listing them all.

### Files to Create

- `/DEV/kilntwo/assets/agents/kw-prompter.md`

### Requirements

#### Front-matter block

The file must open with a YAML front-matter block (fenced by `---`) containing
exactly these fields in this order:

```
---
name: kw-prompter
description: GPT-5.2 prompt generation agent — converts phase plans into atomic task prompts for Codex implementation
model: sonnet
color: green
tools: Read, Write, Bash, Grep, Glob
---
```

No other front-matter fields. No trailing whitespace inside the block.

#### `<role>` section

Immediately after the front-matter closing `---`, one blank line, then the
`<role>` XML element:

```
<role>
Takes a synthesized phase plan and invokes GPT-5.2 via Codex CLI to generate N
individual task prompts, each containing complete implementation instructions for
a single atomic unit of work.
</role>
```

The text must appear as a single paragraph inside the tags with no leading or
trailing blank lines inside the element.

#### `<instructions>` section

One blank line after `</role>`, then an `<instructions>` XML element. The
instructions must describe the agent's full operating procedure as an ordered
markdown list. Each top-level step uses `1.`, `2.`, etc. Sub-steps use a nested
`-` bullet list indented two spaces.

The instructions must cover all of the following steps, in this order:

1. **Receive inputs** — accept two inputs: `projectPath` (absolute path to the
   project root) and `phasePlanPath` (path to the phase plan file, conventionally
   `.kw/plans/phase_plan.md` relative to `projectPath`). Both are received via the
   spawn prompt.

2. **Read the phase plan** — use the Read tool to load the full contents of the
   phase plan file. Identify every discrete implementation step listed in the plan.

3. **Construct the meta-prompt for GPT-5.2** — build a prompt string that:
   - Embeds the full phase plan text verbatim
   - Instructs GPT-5.2 to generate exactly one self-contained implementation prompt
     per step
   - Requires each generated prompt to include: task title, context (what prior
     steps produced), files to create or modify with exact paths, detailed
     implementation requirements, verification commands, and acceptance criteria
   - Requires each generated prompt to follow Codex Prompting Guide best practices:
     autonomous execution without clarification, bias to action with reasonable
     assumptions, specific file paths and function signatures, and clear testable
     acceptance criteria
   - Instructs GPT-5.2 to delimit each prompt with `## Task [N]: <title>` headings
     so they can be parsed by line-scanning

4. **Invoke Codex CLI** — run the following command using the Bash tool with a
   timeout of at least 600000 ms (10 minutes):
   ```
   codex exec -m gpt-5.2 \
     -c 'model_reasoning_effort="high"' \
     --skip-git-repo-check \
     -C <projectPath> \
     "<meta-prompt>" \
     -o .kw/prompts/tasks_raw.md
   ```
   Capture both stdout and the exit code.

5. **Handle failure with one retry** — if the Codex command exits with a non-zero
   code or `.kw/prompts/tasks_raw.md` is not created:
   - Retry once using a simplified meta-prompt that omits the embedded phase plan
     and instead references its file path, asking GPT-5.2 to read the file directly
   - If the retry also fails, stop and report the error clearly; do not proceed to
     parsing

6. **Parse raw output into individual task files** — read `.kw/prompts/tasks_raw.md`
   and split on `## Task [N]:` delimiters. For each task section:
   - Determine its one-based index N
   - Write the section content to `.kw/prompts/task_NN.md` where NN is zero-padded
     to two digits (e.g. `task_01.md`, `task_02.md`)
   - Each written file must contain the full section text, starting from the
     `## Task [N]:` heading line

7. **Write the manifest** — create `.kw/prompts/manifest.md` with the following
   structure:
   - A top-level `# Task Manifest` heading
   - One line per task in the format: `- [task_NN.md](.kw/prompts/task_NN.md) — <title>`
   - A summary line at the end: `Total: N tasks`

8. **Return a brief summary** — output to stdout:
   - The total number of task prompts generated
   - The path to the manifest file
   - A one-line estimated scope if GPT-5.2 included one in its output

#### Path handling

All `.kw/prompts/` paths are relative to `projectPath`. When invoking Bash commands
or writing files, construct absolute paths by joining `projectPath` with the relative
segment. Never hardcode `/DEV/` or any other project-specific prefix.

#### Error handling

- If the phase plan file does not exist, stop immediately and print:
  `[kw-prompter] error: phase plan not found at <phasePlanPath>`
- If Codex produces output but it contains no `## Task` delimiters, write the raw
  output to `.kw/prompts/tasks_raw.md` and stop with:
  `[kw-prompter] error: no task delimiters found in Codex output; raw output saved`
- Never silently swallow errors; always surface them with a `[kw-prompter]` prefix

#### Overall file structure

```
---
[front-matter]
---

<role>
[single paragraph]
</role>

<instructions>
[ordered list with nested bullets]
</instructions>
```

There must be exactly one blank line between each top-level block. The file must
end with a single trailing newline and no trailing whitespace on any line.

### Acceptance Criteria

1. The file `/DEV/kilntwo/assets/agents/kw-prompter.md` exists.
2. The file begins with `---` on line 1.
3. `name: kw-prompter` appears in the front-matter.
4. `model: sonnet` appears in the front-matter.
5. `color: green` appears in the front-matter.
6. The `tools:` field lists exactly: `Read, Write, Bash, Grep, Glob`
7. The `description:` field contains the substring `GPT-5.2 prompt generation agent`.
8. A `<role>` element is present with a non-empty paragraph describing the agent's
   purpose as generating task prompts via GPT-5.2.
9. An `<instructions>` element is present containing all eight numbered steps.
10. The instructions mention a Bash timeout of at least `600000` ms for the Codex
    command.
11. The instructions include the exact Codex invocation flags:
    `-m gpt-5.2`, `-c 'model_reasoning_effort="high"'`, `--skip-git-repo-check`.
12. The instructions specify `-o .kw/prompts/tasks_raw.md` as the Codex output path.
13. The instructions describe a single retry on Codex failure.
14. The instructions specify zero-padded two-digit task file names (`task_01.md`,
    `task_02.md`, etc.).
15. The instructions describe writing `.kw/prompts/manifest.md` with a `# Task Manifest`
    heading and a `Total: N tasks` summary line.
16. The instructions include a rule against hardcoding project-specific paths.
17. The file ends with exactly one trailing newline.
18. No line in the file contains trailing whitespace.

### Important

- Write the complete file content — no placeholders, no TODOs.
- Do not create any other files.
- Do not modify any existing files in the repository.
- Do not install any packages or run any commands.
- This is a plain markdown/YAML file — no JavaScript, no code to execute.
- The file will be deployed verbatim to `~/.claude/agents/kw-prompter.md` by the
  KilnTwo installer; it must be a valid Claude Code agent definition the moment
  it is written.
- Match the formatting conventions of the existing agent at
  `/DEV/kilntwo/assets/agents/kw-researcher.md` exactly: same front-matter style,
  same blank-line spacing between blocks, same XML tag style.
