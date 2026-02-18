## Prompt: Create `assets/commands/kw/start.md` — The `/kw:start` Slash Command for KilnTwo

### Context

You are creating a Claude Code slash command definition file for KilnTwo, a Node.js CLI
tool located at `/DEV/kilntwo/`. Read the following files before writing anything:

- `/DEV/kilntwo/package.json` — project metadata and conventions
- `/DEV/kilntwo/.kw/prompts/install.md` — shows how assets/commands/kw/ files are
  deployed: each `*.md` file in `assets/commands/kw/` is copied verbatim to
  `<home>/.claude/commands/kw/` during `kilntwo install`
- `/DEV/kilntwo/.kw/prompts/paths.md` — documents `resolvePaths`, `encodeProjectPath`,
  and `projectMemoryDir` so you understand path conventions used throughout
- `/DEV/kilntwo/.kw/prompts/agent-researcher.md` — shows the style and structure of
  a KilnTwo agent/command asset file

The `assets/commands/kw/` directory currently exists but is empty. This is the
first slash command definition to be placed there.

When KilnTwo is installed, this file is copied to `~/.claude/commands/kw/start.md`.
A user in any project can then type `/kw:start` in Claude Code, and Claude Code will
expand the full markdown contents of this file as a prompt to the orchestrator
(Claude itself, in Claude Code's chat context). There are no arguments or variables
injected — the command file must be entirely self-contained instructions for Claude.

### Task

Create `/DEV/kilntwo/assets/commands/kw/start.md`.

This file IS the `/kw:start` slash command. Its contents are a detailed prompt that
Claude Code reads and executes as the entry point for the entire KilnTwo protocol.
When a user types `/kw:start`, Claude (the orchestrator) receives these instructions
and must carry them out autonomously.

The command orchestrates three sequential stages: Initialization & Brainstorm,
Planning, and Execution. It must use real Claude Code capabilities: filesystem
tools, the Task tool (to spawn sub-agents), and bash commands.

### Files to Create

- `/DEV/kilntwo/assets/commands/kw/start.md`

---

### Specification: Contents of `start.md`

The file has no YAML front-matter. It is pure markdown — a prompt that Claude
reads and executes. Write it in clear, imperative prose directed at Claude (the
orchestrator). Use markdown headings to delineate stages and numbered lists for
sequential steps. Write as if addressing Claude directly.

#### Overall structure

```
# /kw:start — KilnTwo Protocol Entry Point

[one-paragraph overview]

---

## Stage 1: Initialization & Brainstorm

[steps 1–7]

---

## Stage 2: Planning

[steps 8–12]

---

## Stage 3: Execution

[steps 13–15]

---

## Key Rules

[enforcement rules]
```

---

#### Stage 1: Initialization & Brainstorm (steps 1–7)

Write these steps exactly, in order, as numbered items under the `## Stage 1` heading.

**Step 1 — Detect project path and initialize git**

Instruct Claude to:
- Capture the current working directory as `PROJECT_PATH` (use the `pwd` bash command
  or the equivalent; remind Claude that all subsequent paths are derived from this value)
- Check whether a git repository exists by running `git rev-parse --git-dir` in that
  directory; if the command fails (exit code != 0), run `git init` to create one

**Step 2 — Create `.kw/` directory and `.gitignore`**

Instruct Claude to:
- Create the directory `<PROJECT_PATH>/.kw/` if it does not already exist
- Write (or overwrite) `<PROJECT_PATH>/.kw/.gitignore` with exactly these four lines,
  one per line, no trailing whitespace:
  ```
  plans/
  prompts/
  reviews/
  outputs/
  ```

**Step 3 — Resolve memory paths**

Instruct Claude to compute the following paths. Explain the derivation:
- `HOME` = the user's home directory (run `echo $HOME` if needed)
- `ENCODED_PATH` = `PROJECT_PATH` with every `/` replaced by `-`
  (e.g. `/DEV/myapp` becomes `-DEV-myapp`)
- `MEMORY_DIR` = `<HOME>/.claude/projects/<ENCODED_PATH>/memory`

Create `MEMORY_DIR` with `mkdir -p` if it does not exist.

**Step 4 — Instantiate memory templates**

Instruct Claude to read each template from `<HOME>/.claude/kilntwo/templates/`
and write the initial version into `MEMORY_DIR`. The templates and their initial
fill instructions are:

- `MEMORY.md` — the main memory file. Fill in:
  - `project_name`: the basename of `PROJECT_PATH`
  - `project_path`: the full `PROJECT_PATH` value
  - `date_started`: today's date in ISO-8601 format (YYYY-MM-DD)
  - `status`: `"brainstorming"`
  - Leave all other template placeholders as-is if the template contains them,
    or initialize them to empty strings if the template uses blank fields.

- `vision.md` — project vision. Write the template content but leave the body
  section empty (it will be filled during brainstorm).

- `master-plan.md` — master plan. Write the template content with an empty body.

- `decisions.md` — key decisions log. Write the template with an empty log.

- `pitfalls.md` — known pitfalls and lessons. Write the template with an empty list.

If a template file does not exist in `<HOME>/.claude/kilntwo/templates/`, create
the corresponding memory file from scratch with a minimal header: a markdown H1
of the filename stem and a single blank line below it.

Do not overwrite any memory file that already exists and has non-empty content
beyond the header — read first and skip if already populated.

**Step 5 — Ask for debate mode**

Instruct Claude to ask the user:

> "What debate mode would you like for planning?
>   1 = Skip (no debate — synthesize immediately)
>   2 = Focused (one round of critique and rebuttal) [default]
>   3 = Full rounds (iterative debate until consensus)
>
> Press Enter to accept the default (2)."

Store the response as `DEBATE_MODE`. If the user presses Enter or gives an empty
response, set `DEBATE_MODE = 2`. If the input is not 1, 2, or 3, re-prompt once;
if still invalid, default to 2. Record `DEBATE_MODE` in `MEMORY_DIR/MEMORY.md`
under a `debate_mode` field.

**Step 6 — Brainstorming conversation**

Instruct Claude to enter an interactive brainstorming loop:

- Begin with an opening question:
  > "Let's define the project vision. Tell me: what are you building, who is it
  >  for, and what problem does it solve?"

- Continue the conversation freely, asking follow-up questions about:
  - Goals and success criteria
  - Constraints (time, budget, team size, technology restrictions)
  - Tech stack preferences or requirements
  - Known risks or unknowns

- Every approximately 5 exchanges, checkpoint: update `MEMORY_DIR/vision.md` with
  the key points captured so far, and update `MEMORY_DIR/MEMORY.md`'s `status`
  field to `"brainstorming — checkpoint N"` where N increments with each checkpoint.
  Do this silently (without interrupting the conversation flow).

- When the user indicates brainstorming is complete (phrases like "done", "that's it",
  "let's move on", "ready to plan"), write the final `MEMORY_DIR/vision.md` with a
  complete, well-structured project vision covering:
  - Problem statement
  - Goals
  - Target users / stakeholders
  - Constraints
  - Tech stack decisions
  - Open questions

**Step 7 — Pre-flight checklist**

Before proceeding to Stage 2, instruct Claude to verify and report:
- `vision.md` is non-empty (contains at least a problem statement)
- `DEBATE_MODE` is set to 1, 2, or 3
- `.kw/` directory exists in `PROJECT_PATH`
- Git repository is initialized in `PROJECT_PATH`
- `MEMORY_DIR` exists and contains all five memory files

Print a summary:
```
Pre-flight check complete.
  Project: <PROJECT_PATH>
  Memory:  <MEMORY_DIR>
  Debate mode: <DEBATE_MODE>
  Vision: ready
Proceeding to Stage 2: Planning.
```

If any check fails, halt and tell the user what is missing before continuing.

---

#### Stage 2: Planning (steps 8–12)

**Step 8 — Spawn dual planners in parallel**

Instruct Claude to use the Task tool to spawn two planning sub-agents in parallel:

- **kw-planner-claude**: A Task with the description `"KilnTwo Claude Planner"`.
  The task prompt must include:
  - The full contents of `MEMORY_DIR/vision.md`
  - The full contents of `MEMORY_DIR/MEMORY.md`
  - The instruction: "Create a detailed, phased implementation plan. Output it as
    markdown with sections: Overview, Phases (each with a name, goal, tasks, and
    acceptance criteria), Risks, and Open Questions. This is the Claude perspective plan."
  - `PROJECT_PATH` and `MEMORY_DIR` for context.

- **kw-planner-codex**: A Task with the description `"KilnTwo Codex Planner"`.
  The task prompt must include:
  - The same vision and memory contents
  - The instruction: "Create a detailed, phased implementation plan. Output it as
    markdown with sections: Overview, Phases (each with a name, goal, tasks, and
    acceptance criteria), Risks, and Open Questions. This is the Codex perspective plan."
  - `PROJECT_PATH` and `MEMORY_DIR` for context.

Wait for both tasks to complete. Store their outputs as `PLAN_CLAUDE` and `PLAN_CODEX`.

**Step 9 — Conditional debate**

If `DEBATE_MODE >= 2`, instruct Claude to spawn a **kw-debater** Task:
- Task description: `"KilnTwo Plan Debater"`
- Task prompt must include:
  - Both `PLAN_CLAUDE` and `PLAN_CODEX` in full
  - If `DEBATE_MODE == 2`: "Perform one focused round of critique: identify the
    top 3 strengths and top 3 weaknesses of each plan, then produce a rebuttal for
    each weakness. Output structured markdown."
  - If `DEBATE_MODE == 3`: "Perform iterative debate rounds between the two plans
    until you reach consensus on the strongest approach. Run at least 2 rounds,
    up to 4. Each round: critique weaknesses, propose improvements, refine. Output
    each round as a markdown section, then a final consensus summary."
  - `PROJECT_PATH` and `MEMORY_DIR` for context.

Wait for completion. Store the output as `DEBATE_OUTPUT`. If `DEBATE_MODE == 1`,
set `DEBATE_OUTPUT` to an empty string and skip this step.

**Step 10 — Synthesize master plan**

Instruct Claude to spawn a **kw-synthesizer** Task:
- Task description: `"KilnTwo Plan Synthesizer"`
- Task prompt must include:
  - `PLAN_CLAUDE`, `PLAN_CODEX`, and `DEBATE_OUTPUT` in full
  - The instruction: "Synthesize these inputs into a single authoritative master
    plan. The master plan must be structured as markdown with these top-level
    sections: ## Overview, ## Phases (each phase as ### Phase N: Name with Goal,
    Tasks as a numbered list, and Acceptance Criteria as a checklist), ## Risks,
    ## Open Questions. Be concrete and actionable — no vague tasks."
  - `PROJECT_PATH` and `MEMORY_DIR` for context.

Wait for completion. Store the output as `MASTER_PLAN`.

**Step 11 — Present master plan for review**

Display `MASTER_PLAN` to the user in full. Then ask:

> "Does this master plan look correct? You may:
>   - Type 'yes' or press Enter to proceed to execution
>   - Type 'edit' to provide corrections (I will revise and show you again)
>   - Type 'abort' to stop here and save the plan for later"

If the user types `edit`, collect their feedback, revise `MASTER_PLAN` accordingly
(Claude may do this inline without spawning a new task for minor edits, or re-run
the synthesizer for major changes), then show the revised plan and ask again.

If the user types `abort`, write the current `MASTER_PLAN` to
`MEMORY_DIR/master-plan.md` and `MEMORY_DIR/MEMORY.md` status to
`"planning complete — awaiting execution"`, then tell the user to run `/kw:resume`
when ready. Stop.

**Step 12 — Update memory after planning**

Write the approved `MASTER_PLAN` to `MEMORY_DIR/master-plan.md`.
Update `MEMORY_DIR/MEMORY.md`:
- `status` → `"planning complete"`
- `plan_approved_at` → current ISO-8601 timestamp

---

#### Stage 3: Execution (steps 13–15)

**Step 13 — Execute each phase**

Read `MEMORY_DIR/master-plan.md`. Parse the list of phases (sections beginning
with `### Phase`). For each phase in order:

Instruct Claude to spawn a **kw-phase-executor** Task:
- Task description: `"KilnTwo Phase Executor — <phase name>"`
- Task prompt must include:
  - The full phase section from the master plan (name, goal, tasks, acceptance criteria)
  - The full `MEMORY_DIR/MEMORY.md` (for project context)
  - The full `MEMORY_DIR/vision.md` (for alignment)
  - `PROJECT_PATH` (the executor must work in this directory)
  - `MEMORY_DIR` (the executor must record results here)
  - The instruction: "Implement this phase completely. Write working code, create
    real files, run tests. When done, write a phase summary to
    `<MEMORY_DIR>/phase-<N>-results.md` with sections: Completed Tasks, Files
    Created or Modified, Tests Run and Results, Blockers or Issues. Do not
    proceed to the next phase — stop after this phase is complete."

Wait for the task to complete before spawning the next phase executor.

After each phase completes:
- Read `MEMORY_DIR/phase-<N>-results.md`
- Append a summary line to `MEMORY_DIR/MEMORY.md` under a `## Phase Results` section:
  `- Phase N (<phase name>): complete — <one-sentence summary from results file>`
- Update `MEMORY_DIR/MEMORY.md` `status` to `"executing — phase N complete"`

**Step 14 — Final validation**

After all phases are complete, spawn a **kw-validator** Task:
- Task description: `"KilnTwo Final Validator"`
- Task prompt must include:
  - The full `MEMORY_DIR/master-plan.md`
  - All `MEMORY_DIR/phase-*-results.md` files
  - `PROJECT_PATH` and `MEMORY_DIR`
  - The instruction: "Validate that all phases of the master plan have been
    implemented. For each phase, check that every acceptance criterion is met.
    Run any test commands referenced in the plan. Output a validation report as
    markdown with sections: ## Summary (pass/fail), ## Phase Checklist (one row
    per phase with pass/fail per criterion), ## Issues Found (empty if none),
    ## Recommendations. Write this report to `<MEMORY_DIR>/validation-report.md`."

Wait for completion.

**Step 15 — Finalize**

Update `MEMORY_DIR/MEMORY.md`:
- `status` → `"complete"`
- `completed_at` → current ISO-8601 timestamp

Print a final summary to the user:
```
KilnTwo protocol complete.
  Project: <PROJECT_PATH>
  Phases completed: <N>
  Validation report: <MEMORY_DIR>/validation-report.md

Run `kilntwo doctor` to verify your installation health.
To resume a paused run, use /kw:resume.
```

---

#### Key Rules

Write these as a numbered list under the `## Key Rules` heading. These are
enforcement rules that Claude must follow throughout all stages.

1. **All paths are dynamic.** Never hardcode any path. Derive every path from
   `PROJECT_PATH`, `HOME`, and `ENCODED_PATH` as computed in Step 3. The command
   must work correctly regardless of what directory the user is in when they
   invoke `/kw:start`.

2. **Memory is the source of truth.** Before every stage transition (1→2, 2→3),
   re-read `MEMORY_DIR/MEMORY.md` to confirm state. If `MEMORY_DIR/MEMORY.md`
   already shows `status: "planning complete"` when Stage 2 begins, skip to
   Step 11 using the existing `master-plan.md`. If it shows
   `status: "executing — phase N complete"`, resume from phase N+1.

3. **Never skip stages.** Execute Stage 1 before Stage 2, Stage 2 before Stage 3.
   The only exception is resumption (see Rule 2). Use `/kw:resume` for resumption;
   do not implement resume logic inside this command.

4. **Use the Task tool for all sub-agents.** Do not attempt to invoke kw-planner-claude,
   kw-planner-codex, kw-debater, kw-synthesizer, kw-phase-executor, or kw-validator
   as slash commands. Spawn them exclusively via the Task tool with a complete,
   self-contained prompt that includes all required context.

5. **Parallel where safe, sequential where required.** Spawn the two planners
   (Step 8) in parallel. All other Task spawns are sequential — wait for each to
   complete before spawning the next.

6. **Write working outputs only.** Phase executors must create real files with real
   content. Placeholders, TODOs, and stub implementations are not acceptable outputs
   from phase executors. If an executor produces placeholder output, fail the phase
   and report it to the user before continuing.

7. **Checkpoint memory after every significant action.** Update `MEMORY_DIR/MEMORY.md`
   status at: after Step 2, after Step 4, after Step 5, at each brainstorm checkpoint,
   after Step 7, after Step 10, after Step 12, after each phase in Step 13, after
   Step 14, and after Step 15.

---

### Acceptance Criteria

The file `/DEV/kilntwo/assets/commands/kw/start.md` must satisfy:

1. The file exists and is non-empty (at least 200 lines of substantive instruction).
2. The file contains no YAML front-matter block (no `---` delimiter at line 1).
3. The file begins with `# /kw:start` as the H1 heading.
4. The file contains exactly three `##` stage headings:
   `## Stage 1: Initialization & Brainstorm`,
   `## Stage 2: Planning`,
   `## Stage 3: Execution`.
5. The file contains a `## Key Rules` section.
6. Stage 1 contains numbered steps 1 through 7 as described above.
7. Stage 2 contains steps 8 through 12.
8. Stage 3 contains steps 13 through 15.
9. The debate mode prompt text (the three options) appears verbatim or with
   equivalent wording showing options 1, 2, and 3 with a default of 2.
10. The encoded-path formula (`/` replaced with `-`) appears explicitly.
11. The five memory files (MEMORY.md, vision.md, master-plan.md, decisions.md,
    pitfalls.md) are all mentioned by name.
12. The Task tool is referenced by name for spawning all sub-agents.
13. The six sub-agent names appear: kw-planner-claude, kw-planner-codex,
    kw-debater, kw-synthesizer, kw-phase-executor, kw-validator.
14. The brainstorm checkpoint behavior (every ~5 exchanges, update vision.md
    and MEMORY.md) is described.
15. The pre-flight checklist (Step 7) lists all five verification points and
    the exact print format.
16. The file ends with exactly one trailing newline and no trailing whitespace
    on any line.

---

### Important

- Write the complete file content — no placeholders, no TODOs.
- The file is a prompt that Claude Code will expand and execute verbatim. It
  must be written in imperative prose directed at Claude (the orchestrator), not
  at a human developer.
- Do not add YAML front-matter. Slash command files in `assets/commands/kw/`
  are plain markdown, unlike agent files in `assets/agents/` which have front-matter.
- Do not create any other files.
- Do not modify any existing files in the repository.
- Do not install any packages or run any commands.
- The file will be deployed verbatim to `~/.claude/commands/kw/start.md` by
  the KilnTwo installer. It must function correctly as a Claude Code slash
  command the moment it is written.
- Keep the prose direct and imperative. Avoid hedging language ("you might",
  "consider", "perhaps"). Claude must know exactly what to do at each step.
- Aim for thorough coverage of every step — this is the most critical command
  in the KilnTwo protocol. Completeness matters more than brevity.
