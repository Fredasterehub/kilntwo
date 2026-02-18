## Prompt: Create `assets/agents/kw-synthesizer.md` — Synthesizer Agent Definition for KilnTwo

### Context

You are creating a Claude Code sub-agent definition file for KilnTwo, a Node.js CLI
tool located at `/DEV/kilntwo/`. Read the following files before writing anything:

- `/DEV/kilntwo/package.json` — project metadata and conventions
- `/DEV/kilntwo/.kw/prompts/install.md` — shows how assets/agents/ files are
  deployed: each `*.md` file in `assets/agents/` is copied verbatim to
  `<home>/.claude/agents/` during `kilntwo install`
- `/DEV/kilntwo/.kw/prompts/agent-researcher.md` — reference for the exact
  YAML front-matter + XML section structure used by KilnTwo agent definitions

The `assets/agents/` directory may already contain `kw-researcher.md` (written by
a prior step). Do not modify it. This prompt creates a separate, independent file.

### Task

Create `/DEV/kilntwo/assets/agents/kw-synthesizer.md` — a Claude Code agent
definition file that configures the plan synthesis sub-agent for the KilnTwo
pipeline. This agent merges two independently produced plans (one from Claude, one
from Codex) into a single authoritative master plan with atomic, ordered,
dependency-correct implementation steps.

### Files to Create

- `/DEV/kilntwo/assets/agents/kw-synthesizer.md`

### Requirements

#### Front-matter block

The file must open with a YAML front-matter block (fenced by `---`) containing
exactly these fields in this order:

```
---
name: kw-synthesizer
description: Plan synthesis agent — merges dual plans into a single master plan with atomic implementation steps
model: opus
color: yellow
tools: Read, Write, Grep, Glob
---
```

No other front-matter fields. No trailing whitespace inside the block.

#### `<role>` section

Immediately after the front-matter, include a `<role>` XML element (one blank
line between the front-matter closing `---` and the opening tag):

```
<role>
Pure merge agent. Reads the Claude plan, Codex plan, and optional debate
resolution, then produces a single synthesized plan that is the source of
truth for all subsequent implementation steps.
</role>
```

The text must appear exactly as a single paragraph inside the tags with no
leading or trailing blank lines inside the element.

#### `<instructions>` section

One blank line after the closing `</role>` tag, then an `<instructions>` XML
element containing the behavioral rules as a structured markdown list. The
instructions must cover each of the following points, in this order, with no
additional points added:

1. **Receive**: project path, plan type (`"phase"` or `"master"`), and an
   optional debate resolution path.
2. **Read** the following input files in parallel before producing any output:
   - `.kw/plans/claude_plan.md` — Claude's implementation plan
   - `.kw/plans/codex_plan.md` — Codex's implementation plan
   - `.kw/plans/debate_resolution.md` — only if a debate resolution path was
     provided; skip if absent
3. **Synthesis rules** — apply these in order when merging the two plans:
   - If a debate resolution file exists, follow its recommendations for any
     disputed steps; it takes precedence over both individual plans
   - If no debate resolution exists, prefer the more detailed or more specific
     approach for each step
   - Take the best approach from each plan on a step-by-step basis; do not
     wholesale adopt one plan and discard the other
   - Every synthesized step must be atomic: completable in a single Codex
     prompt with no ambiguity
   - Every step must include: what to do, which files to change, and how to
     verify completion
   - Steps must be ordered by dependency — no step may reference code,
     files, or state produced by a later step
   - Steps that would exceed approximately 200 lines of code change must be
     split into smaller steps
4. **Output format** — write the synthesized plan as follows:
   - For `"phase"` plan type: write to `.kw/plans/phase_plan.md`
   - For `"master"` plan type: write to the project memory file `master-plan.md`
     at the project root
   - Each step uses the heading `## Step N: [title]` with these subsections:
     `### Goal`, `### Files`, `### Implementation`, `### Tests`,
     `### Verification`
5. **Return** a brief summary stating the total step count, the plan type
   written, and the estimated overall scope (lines of code, number of files).
6. The synthesized plan is the source of truth going forward — do not hedge,
   qualify, or leave open alternatives in the output.
7. Never modify the input plan files (`claude_plan.md`, `codex_plan.md`,
   `debate_resolution.md`). Write only to the designated output path.
8. Use paths received in the spawn prompt; never hardcode project paths.

Format items 1, 2, 5, 6, 7, and 8 as single `-` list items. Format item 3
(Synthesis rules) as a `-` list item with its sub-rules as a nested bullet list
indented with two spaces. Format item 4 (Output format) as a `-` list item with
its sub-points as a nested bullet list indented with two spaces. Keep language
direct and imperative throughout.

#### Overall file structure

```
---
[front-matter]
---

<role>
[single paragraph]
</role>

<instructions>
[structured bullet list]
</instructions>
```

There must be exactly one blank line between each top-level block. The file
must end with a single trailing newline and no trailing whitespace on any line.

### Acceptance Criteria

1. The file `/DEV/kilntwo/assets/agents/kw-synthesizer.md` exists.
2. The file begins with `---` on line 1.
3. `name: kw-synthesizer` appears in the front-matter.
4. `model: opus` appears in the front-matter.
5. `color: yellow` appears in the front-matter.
6. The `tools:` field lists exactly four tools: `Read, Write, Grep, Glob`.
7. The `description:` field contains the phrase "merges dual plans".
8. A `<role>` element is present with a non-empty paragraph describing the
   agent as a pure merge agent.
9. An `<instructions>` element is present and contains at least eight list
   items at the top level.
10. The instructions mention both `"phase"` and `"master"` as plan types.
11. The instructions specify that steps must be atomic and completable in a
    single Codex prompt.
12. The instructions specify the approximately 200-line maximum per step and
    the requirement to split larger steps.
13. The instructions describe dependency ordering (no step references output
    from a later step).
14. The instructions state that the synthesized plan is the source of truth.
15. The instructions include the five required subsections for each step:
    `Goal`, `Files`, `Implementation`, `Tests`, `Verification`.
16. The instructions include the output path rules:
    - `"phase"` type writes to `.kw/plans/phase_plan.md`
    - `"master"` type writes to `master-plan.md` at the project root
17. The instructions prohibit modifying the input plan files.
18. The instructions include a rule against hardcoding project paths.
19. The instructions reference debate resolution precedence when that file is
    present.
20. The file ends with exactly one trailing newline.
21. No line in the file contains trailing whitespace.

### Important

- Write the complete file content — no placeholders, no TODOs.
- Do not create any other files.
- Do not modify any existing files in the repository, including
  `/DEV/kilntwo/assets/agents/kw-researcher.md` if it exists.
- Do not install any packages or run any commands.
- This is a plain markdown/YAML file — no JavaScript, no code to execute.
- The file will be deployed verbatim to `~/.claude/agents/kw-synthesizer.md`
  by the KilnTwo installer; it must be valid as a Claude Code agent definition
  the moment it is written.
