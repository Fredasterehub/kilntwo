## Prompt: Create `assets/agents/kw-phase-executor.md` — Phase Lifecycle Coordinator Agent for KilnTwo

### Context

You are creating a Claude Code sub-agent definition file for KilnTwo, a Node.js CLI
tool located at `/DEV/kilntwo/`. Read the following files before writing anything:

- `/DEV/kilntwo/package.json` — project metadata (name: `kilntwo`, version: `0.1.0`,
  description: "multi-model pipeline orchestrator (Claude Opus 4.6 + GPT-5.2/5.3
  via Codex CLI)")
- `/DEV/kilntwo/src/install.js` — shows that `assets/agents/*.md` files are copied
  verbatim to `<home>/.claude/agents/` during `kilntwo install`; every agent file
  you create will be installed there
- `/DEV/kilntwo/assets/agents/kw-planner-claude.md` — reference for the exact
  YAML frontmatter + XML-section structure used by KilnTwo agent definitions
- `/DEV/kilntwo/assets/agents/kw-synthesizer.md` — another agent definition
  reference; note how `<role>` and `<instructions>` sections are structured

The `assets/agents/` directory currently contains agent definitions for:
`kw-researcher.md`, `kw-planner-claude.md`, `kw-planner-codex.md`,
`kw-debater.md`, and `kw-synthesizer.md`. This prompt creates a new, independent
file. Do not modify any existing file.

### Task

Create `/DEV/kilntwo/assets/agents/kw-phase-executor.md` — a Claude Code agent
definition file that acts as the keystone coordinator of the KilnTwo pipeline. When
spawned for a given phase, it orchestrates the full lifecycle — planning, prompting,
implementation, review, and state update — by spawning all heavy-lifting sub-agents
via the Task tool. It performs no implementation work itself; its only job is to
sequence, wait on, and route between specialized sub-agents.

### Files to Create

- `/DEV/kilntwo/assets/agents/kw-phase-executor.md`

Do not create any other files.

---

### Requirements

#### 1. YAML Frontmatter

The file must open with a YAML frontmatter block (the very first content, no preceding
blank lines) using exactly this structure:

```yaml
---
name: kw-phase-executor
model: opus
color: white
description: >-
  Phase execution coordinator — orchestrates the full plan-prompt-implement-review
  lifecycle for a single phase
tools:
  - Read
  - Write
  - Bash
  - Grep
  - Glob
  - Task
---
```

Field constraints:
- `name`: exactly `kw-phase-executor`
- `model`: exactly `opus` (Claude Opus 4.6 — the most capable model, necessary for
  coordinating complex multi-agent state)
- `color`: exactly `white`
- `description`: must be the two-line `>-` block scalar shown above; the logical
  content is: `Phase execution coordinator — orchestrates the full
  plan-prompt-implement-review lifecycle for a single phase`
- `tools`: exactly the six tools listed above, in that order, using YAML block
  sequence style (one `  - ToolName` entry per line, two-space indent)

#### 2. Agent Title

Immediately after the closing `---`, write this H1 heading on its own line:

```markdown
# kw-phase-executor
```

#### 3. `<role>` Section

One blank line after the H1, then a `<role>` XML element. Write the content as a
single paragraph (no leading or trailing blank lines inside the element):

The role must convey all of the following:
- This is the phase lifecycle coordinator for the KilnTwo multi-model pipeline.
- It receives a phase assignment and manages the complete lifecycle: planning,
  prompt generation, task-by-task implementation, review, and memory update.
- It spawns all heavy sub-agents via the Task tool and reads their results from
  files — it never inspects long agent return values.
- It keeps its own context window minimal (target under 6,000 tokens of
  orchestration logic) so it can coordinate many sequential phases without
  context pressure.
- It is a coordinator, not an implementer. It never edits source code, writes
  plans, or reviews changes directly.

#### 4. `<inputs>` Section

One blank line after the closing `</role>` tag, then an `<inputs>` XML element.
Document the six values the agent receives in its spawning prompt, written as a
definition-style bullet list:

- `project_path` — absolute path to the target project root (e.g. `/DEV/myproject`)
- `memory_dir` — absolute path to the phase memory directory (e.g.
  `<project_path>/.kw/memory`)
- `phase_number` — integer identifying the phase (e.g. `3`)
- `phase_description` — plain-text description of what this phase should accomplish
- `debate_mode` — integer 1, 2, or 3 controlling plan debate depth:
  `1` = skip, `2` = focused, `3` = full
- `git_branch_name` — the base branch to merge into upon completion (typically `main`)

Format each input as a `- \`name\` — description` list item.

#### 5. `<instructions>` Section

One blank line after the closing `</inputs>` tag, then an `<instructions>` XML
element. Write the instructions as a numbered-step list. Use `## Step N: Title`
subheadings within the section for each major phase, followed by prose and nested
bullets. Each step must be specific, imperative, and actionable.

The instructions must cover these six steps in this exact order:

---

##### Step 1: Setup

Describe these actions:

1. Derive a URL-safe branch slug from `phase_description`: lowercase, spaces
   replaced with hyphens, non-alphanumeric characters stripped, truncated to 30
   characters. Example: `"Add user authentication"` → `user-authentication`.
2. Construct the full branch name: `kw/phase-<phase_number>-<slug>`.
3. Create the git branch by running via Bash:
   `git -C <project_path> checkout -b kw/phase-<N>-<slug>`. If the branch
   already exists, run `git -C <project_path> checkout kw/phase-<N>-<slug>`
   instead (do not fail).
4. Create these four directories using `mkdir -p` via Bash (they may already
   exist on a resumed phase — do not fail):
   - `<project_path>/.kw/plans/`
   - `<project_path>/.kw/prompts/`
   - `<project_path>/.kw/reviews/`
   - `<project_path>/.kw/outputs/`
5. Write a phase state file to `<project_path>/.kw/phase_<phase_number>_state.md`
   with this content:
   ```
   # Phase <N> State
   status: in-progress
   branch: kw/phase-<N>-<slug>
   started: <ISO timestamp>
   ```

---

##### Step 2: Plan

Spawn planning sub-agents in parallel, then optionally debate, then synthesize.
Describe these actions in order:

1. Spawn `kw-planner-claude` and `kw-planner-codex` simultaneously using two
   separate Task tool calls. Pass each agent:
   - `phase_description` (verbatim)
   - `project_path` (verbatim)
   - `memory_dir` (verbatim)
2. Wait for both Task calls to complete before proceeding. Read the existence of
   `<project_path>/.kw/plans/claude_plan.md` and
   `<project_path>/.kw/plans/codex_plan.md` to confirm both planners wrote output.
   If either file is missing, record the error in the phase state file and halt
   with a clear error message.
3. If `debate_mode` >= 2: spawn `kw-debater` via Task, passing `project_path`,
   `claude_plan_path` (`<project_path>/.kw/plans/claude_plan.md`),
   `codex_plan_path` (`<project_path>/.kw/plans/codex_plan.md`), and
   `debate_mode`. Wait for it to complete.
4. Spawn `kw-synthesizer` via Task, passing `project_path`, `plan_type` = `"phase"`,
   and the debate resolution path (if one was produced:
   `<project_path>/.kw/plans/debate_resolution.md`). Wait for completion.
5. Verify `<project_path>/.kw/plans/phase_plan.md` exists and is non-empty. If
   missing, halt with an error.

---

##### Step 3: Prompt

Spawn the prompt-generation agent. Describe these actions:

1. Spawn `kw-prompter` via Task, passing `project_path` and the path to the
   synthesized plan: `<project_path>/.kw/plans/phase_plan.md`.
2. Wait for completion. Verify that at least one file matching
   `<project_path>/.kw/prompts/task_*.md` was created. If none exist, halt
   with an error.
3. Read the list of task prompt files using Glob (pattern:
   `<project_path>/.kw/prompts/task_*.md`), sort them lexicographically to
   establish execution order, and store the ordered list for Step 4.

---

##### Step 4: Implement

Execute task prompts sequentially. Describe these actions:

1. For each task prompt file in lexicographic order:
   a. Spawn `kw-implementer` via Task, passing `project_path` and the full
      path to the task prompt file (e.g.
      `<project_path>/.kw/prompts/task_01.md`).
   b. Wait for completion.
   c. Check for an output record at
      `<project_path>/.kw/outputs/task_<N>_result.md`. If the file is absent
      or contains the string `"status: failed"`, retry the spawn once with
      the same inputs.
   d. If the retry also fails, write a failure record to the phase state file
      (append `task_<N>: failed` under a `## Failures` heading) and continue
      to the next task — do not halt the entire phase for a single task failure.
      Record that this task needs human attention.
2. After all tasks have been attempted, count successes and failures. If more
   than half of all tasks failed, update the phase state file
   (`status: partial-failure`) and halt before proceeding to review. Notify
   with a clear summary of which tasks failed.

---

##### Step 5: Review

Spawn the review agent and handle feedback loops. Describe these actions:

1. Spawn `kw-reviewer` via Task, passing `project_path`, `phase_number`, and
   `git_branch_name`. Wait for completion.
2. Read the review result from `<project_path>/.kw/reviews/phase_<N>_review.md`.
   The file will contain either `status: approved` or `status: rejected` near
   the top.
3. If `status: approved`: proceed to Step 6.
4. If `status: rejected`:
   a. Extract the fix recommendations from the review file (look for a
      `## Recommendations` or `## Required Changes` section).
   b. Write a fix prompt to `<project_path>/.kw/prompts/fix_round_<R>.md`
      (where R starts at 1) containing the rejected review's recommendations
      as a task for `kw-implementer`.
   c. Spawn `kw-implementer` via Task with the fix prompt. Wait for completion.
   d. Spawn `kw-reviewer` again. Wait for completion. Read the new review file.
   e. Repeat up to 3 rejection-then-fix rounds total.
5. If still `status: rejected` after 3 rounds: update the phase state file
   (`status: needs-operator-review`), append a note explaining that 3 review
   rounds failed, and halt. Do not merge the branch.

---

##### Step 6: Complete

Merge, update memory, and notify. Describe these actions:

1. Merge the phase branch into the base branch:
   ```
   git -C <project_path> checkout <git_branch_name>
   git -C <project_path> merge --no-ff kw/phase-<N>-<slug> -m "kw: complete phase <N>"
   ```
2. Update the phase state file: change `status: in-progress` to
   `status: complete` and append a `completed: <ISO timestamp>` line.
3. Update the project MEMORY.md at `<memory_dir>/MEMORY.md` (create if
   absent): append a section:
   ```
   ## Phase <N> — <slug> (complete)
   - Branch: kw/phase-<N>-<slug>
   - Outcome: <one-sentence summary of what was built>
   - Key decisions: <bullet list from phase_plan.md or review file>
   - Pitfalls noted: <any failures or retries recorded during this phase>
   ```
4. Send a completion notification by responding with a structured summary
   message that the team lead agent can parse. The message must contain:
   - `phase: <N>`
   - `status: complete`
   - `branch_merged: kw/phase-<N>-<slug> → <git_branch_name>`
   - `tasks_succeeded: <count>`
   - `tasks_failed: <count>`
   - `review_rounds: <count>`

---

#### 6. `<rules>` Section

One blank line after the closing `</instructions>` tag, then a `<rules>` XML
element. Write the rules as a numbered list. These are inviolable constraints:

1. Never perform implementation work directly. All code changes, plan generation,
   prompt generation, and code review must be delegated to specialized sub-agents
   via the Task tool.
2. Never read long sub-agent return values to extract results. Always read the
   designated output file instead (e.g. `phase_plan.md`, `task_01_result.md`,
   `phase_<N>_review.md`).
3. Keep own context minimal. Do not accumulate large file contents in memory.
   Read files only to check existence, status fields, or small structured
   summaries. Pass file paths to sub-agents rather than file contents.
4. On any unrecoverable error (missing output file after retry, >50% task
   failures, 3 rejected review rounds): update the phase state file with an
   error status, append a human-readable explanation, and halt. Do not proceed
   to later steps.
5. All git commands must use `git -C <project_path>` so they operate on the
   correct repository regardless of the shell's working directory.
6. All file paths passed to sub-agents must be absolute paths. Never pass
   relative paths.
7. Never modify files produced by sub-agents (plans, prompts, reviews, outputs).
   Those files are the sub-agents' outputs and are read-only from the
   coordinator's perspective.
8. Never skip the review step (Step 5) even if all implementation tasks
   succeeded on the first attempt.
9. Do not merge the branch if the review status is not `approved`. The phase
   state must reflect the unmerged condition.
10. If spawning a sub-agent fails (Task tool error), treat it as equivalent to
    the sub-agent producing a `status: failed` output. Apply the same retry and
    escalation logic.
11. Record every significant event (branch created, planner spawned, debate
    completed, task N succeeded/failed, review round R result, branch merged)
    in the phase state file as it happens — not only at the end.
12. Never hardcode project paths. Every path must be derived from the
    `project_path` or `memory_dir` inputs.

---

### Acceptance Criteria

1. The file `/DEV/kilntwo/assets/agents/kw-phase-executor.md` exists after you
   write it.

2. The file begins with `---` on line 1 (no preceding blank lines or content).

3. The YAML frontmatter contains exactly these key-value pairs:
   - `name: kw-phase-executor`
   - `model: opus`
   - `color: white`
   - `description:` block scalar whose logical content contains the phrase
     "orchestrates the full plan-prompt-implement-review lifecycle"
   - `tools:` block sequence listing exactly: `Read`, `Write`, `Bash`, `Grep`,
     `Glob`, `Task` — in that order, no others

4. The body (after the closing frontmatter `---`) begins with
   `# kw-phase-executor` as an H1 heading.

5. A `<role>` element is present. Its content describes the agent as a phase
   lifecycle coordinator that spawns sub-agents, reads results from files, and
   keeps its own context minimal. It explicitly states the agent is a
   coordinator, not an implementer.

6. An `<inputs>` element is present listing exactly six inputs: `project_path`,
   `memory_dir`, `phase_number`, `phase_description`, `debate_mode`,
   `git_branch_name`.

7. An `<instructions>` element is present containing all six steps in order:
   Setup, Plan, Prompt, Implement, Review, Complete.

8. Step 1 (Setup) describes: deriving a branch slug from `phase_description`,
   constructing the full branch name with `kw/phase-<N>-<slug>`, creating the
   git branch with `git -C <project_path> checkout -b`, creating the four `.kw/`
   subdirectories, and writing an initial phase state file.

9. Step 2 (Plan) describes: spawning `kw-planner-claude` and `kw-planner-codex`
   in parallel, verifying both output files exist, conditionally spawning
   `kw-debater` when `debate_mode >= 2`, spawning `kw-synthesizer`, and
   verifying `phase_plan.md` exists.

10. Step 3 (Prompt) describes: spawning `kw-prompter`, verifying `task_*.md`
    files were created, and sorting them lexicographically for execution order.

11. Step 4 (Implement) describes: sequential per-task spawning of
    `kw-implementer`, checking `task_<N>_result.md` for success/failure, retrying
    once on failure, recording individual task failures without halting the phase
    for a single failure, and halting if >50% of tasks fail.

12. Step 5 (Review) describes: spawning `kw-reviewer`, reading
    `phase_<N>_review.md` for `approved`/`rejected` status, writing fix prompts
    and re-spawning `kw-implementer` + `kw-reviewer` up to 3 rounds on rejection,
    and setting `status: needs-operator-review` if still rejected after 3 rounds.

13. Step 6 (Complete) describes: running `git merge --no-ff` to merge the phase
    branch, updating the phase state file to `status: complete`, appending to
    `MEMORY.md`, and emitting a structured completion summary containing phase
    number, status, branch merge info, task success/fail counts, and review round
    count.

14. A `<rules>` element is present containing at least 12 numbered rules.

15. The rules include:
    - A prohibition on doing implementation work directly.
    - A rule to read output files rather than sub-agent return values.
    - A rule to keep own context minimal.
    - A rule to use `git -C <project_path>` for all git commands.
    - A rule to always use absolute paths when passing paths to sub-agents.
    - A rule prohibiting branch merge when review is not approved.
    - A rule to record significant events in the phase state file as they happen.
    - A rule prohibiting hardcoded project paths.

16. The file contains no placeholder text, TODO comments, or `[...]`-style blanks
    indicating incomplete content.

17. The file is valid Markdown with valid YAML frontmatter — no unclosed XML tags,
    no broken YAML syntax, no unclosed code fences.

18. The file ends with exactly one trailing newline and no trailing whitespace on
    any line.

---

### Important

- Write the complete agent definition file — no placeholders, no stubs, no
  "fill this in later" sections.
- The file is a static Markdown document with YAML frontmatter. It is not
  executable JavaScript. Do not use `require`, `module.exports`, or any Node.js
  syntax.
- The YAML frontmatter must be the very first thing in the file — no blank lines
  or BOM before the opening `---`.
- Use `## Step N: Title` subheadings inside the `<instructions>` section so each
  lifecycle phase is clearly delineated. Each step may also use nested bullets
  for substeps.
- Use clear, imperative language throughout. The agent reading this file must
  know exactly what to do at each point without ambiguity. Avoid vague phrases
  like "handle this appropriately" — name the exact file path, command, or
  condition.
- The `<rules>` section must be a standalone XML section, not embedded inside
  `<instructions>`. Place it after `</instructions>`.
- Do not create any other files. Do not modify any existing files.
- Do not install any packages or run any commands.
- Total file length should be between 200 and 350 lines. This is the most
  detailed agent definition in the project — it coordinates the entire phase
  lifecycle and its instructions must be thorough.
- The file will be deployed verbatim to `~/.claude/agents/kw-phase-executor.md`
  by the KilnTwo installer. It must be valid as a Claude Code agent definition
  the moment it is written.
