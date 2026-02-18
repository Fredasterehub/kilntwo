## Prompt: Create `assets/commands/kw/reset.md` — `/kw:reset` Slash Command

### Context

You are creating a Claude Code slash command definition file for KilnTwo, a Node.js CLI tool
located at `/DEV/kilntwo/`.

Read the following files before writing anything:

- `/DEV/kilntwo/package.json` — project metadata (name: `kilntwo`, version: `0.1.0`,
  description: "multi-model pipeline orchestrator")
- `/DEV/kilntwo/src/paths.js` — exports `projectMemoryDir(homeOverride, projectPath)`
  which resolves to `<home>/.claude/projects/<encodedPath>/memory`; this is where
  MEMORY.md, decisions.md, and pitfalls.md live for a given project

Understand how assets/commands/kw/ files are deployed: during `kilntwo install`, every
`*.md` file in `assets/commands/kw/` is copied verbatim to `<home>/.claude/commands/kw/`.
Once installed, typing `/kw:reset` in Claude Code expands the contents of
`<home>/.claude/commands/kw/reset.md` as a prompt to the Claude Code orchestrator.

The `assets/commands/kw/` directory exists at `/DEV/kilntwo/assets/commands/kw/` and is
currently empty. This is the first slash command file to be placed there.

For slash command format reference, review the installed example at
`/home/dev/.claude/commands/gsd/pause-work.md` — it shows the YAML frontmatter schema
(`name`, `description`, `allowed-tools`) followed by XML-style process sections.

### Task

Create `/DEV/kilntwo/assets/commands/kw/reset.md` — a Claude Code slash command definition
that saves complete session state to persistent memory files and prepares the operator
for a context reset.

When a user types `/kw:reset`, the Claude Code orchestrator reads this file and executes
the instructions within it. The command's purpose is to ensure that no work is lost when
the operator needs to run `/clear` (which wipes the context window). Everything essential
is written to disk so that `/kw:resume` can restore full context in the next session.

### Files to Create

- `/DEV/kilntwo/assets/commands/kw/reset.md`

Do not create any other files.

---

### Specification

#### YAML Frontmatter

The file must begin with a YAML frontmatter block using `---` delimiters.
Include exactly these fields in this order:

```yaml
---
name: kw:reset
description: Save session state to memory and prepare for context reset (/clear)
allowed-tools:
  - Read
  - Write
  - Bash
  - Task
  - SendMessage
---
```

Field constraints:

- `name`: exactly `kw:reset`
- `description`: exactly `Save session state to memory and prepare for context reset (/clear)`
- `allowed-tools`: exactly the five tools listed above, in that order

No other frontmatter fields. No trailing whitespace inside the block.

#### Markdown Body

After the frontmatter, include an `<objective>` block and a `<process>` block with named
steps. There must be exactly one blank line between the closing `---` of the frontmatter
and the first element of the body, and one blank line between each top-level block.

Use this structure:

```
---

<objective>
...
</objective>

<process>

<step name="detect">
...
</step>

<step name="save-state">
...
</step>

<step name="shutdown-agents">
...
</step>

<step name="write-decisions">
...
</step>

<step name="write-pitfalls">
...
</step>

<step name="confirm">
...
</step>

</process>

<success_criteria>
...
</success_criteria>
```

---

#### `<objective>` block

Write a concise 2-4 sentence description of what this command does. It must convey:

- The command saves all session state to persistent memory before a context reset.
- Nothing is lost — the handoff note in MEMORY.md is what `/kw:resume` reads to restore
  context in the next session.
- The operator must run `/clear` manually after this command completes; Claude Code cannot
  do that programmatically.

---

#### `<process>` block — step details

**Step `detect`**

Detect the two values needed for all subsequent steps:

1. **Project path** — use `Bash` to run `pwd` and capture the absolute path of the current
   working directory. This is `$PROJECT_PATH`.

2. **Memory directory** — derive it from the project path using the KilnTwo convention:
   `<home>/.claude/projects/<encodedPath>/memory` where `<encodedPath>` is the project
   path with every `/` replaced by `-` (a leading `/` becomes a leading `-`).
   Use `Bash` to compute the encoded path:
   ```bash
   echo "$PROJECT_PATH" | sed 's|/|-|g'
   ```
   Then construct `MEMORY_DIR="$HOME/.claude/projects/$ENCODED/memory"`.

3. Check whether the memory directory exists (`[ -d "$MEMORY_DIR" ]`). If it does not
   exist, create it with `mkdir -p "$MEMORY_DIR"`.

4. If MEMORY.md exists in `$MEMORY_DIR`, read it using the `Read` tool to understand
   current state (stage, phase, active tasks). Use this to populate the handoff note
   accurately. If it does not exist, proceed with sensible defaults.

**Step `save-state`**

Write a complete MEMORY.md to `$MEMORY_DIR/MEMORY.md` using the `Write` tool.

The file must use this exact structure:

```markdown
# KilnTwo Project Memory

## Status

status: paused
reset_at: <ISO-8601 timestamp from `date -u +"%Y-%m-%dT%H:%M:%SZ"`>
project: <$PROJECT_PATH>

## Current Position

stage: <current stage, e.g. "planning", "implementation", "review" — infer from context>
phase: <current phase name or number if known, otherwise "unknown">

## Warm Handoff

### What Was Being Worked On

<1-3 sentences describing the specific task or step in progress at time of reset.
Be concrete: name the file, function, or feature being implemented or discussed.>

### Agent Context

<List any active sub-agents by name/role that were running or recently used.
List any pending tasks that were queued but not yet started.
If no agents were active, write "No active agents at time of reset.">

### Operator Note

<A plain-language message for the human operator. Summarize what happened this
session in 2-4 sentences. What was accomplished? What is the current state of
the work? What should they be aware of before resuming?>

### Next Action

<The single most important next action to take when resuming. Be specific:
name the exact command, file, or function to start with. This must be concrete
enough that a fresh Claude Code session with no other context can act on it.>

## Notes

<Any other relevant context that does not fit above. Can be left empty.>
```

When populating fields, use what you know from the current conversation context.
Do not write placeholder text like "[fill this in]" — infer from available context
or write an honest "unknown" if you genuinely cannot determine a value.

The `reset_at` timestamp must be generated by running:
```bash
date -u +"%Y-%m-%dT%H:%M:%SZ"
```

**Step `shutdown-agents`**

Check whether any KilnTwo sub-agents are active by using the `Task` tool to list
running tasks (or by checking context for any recently spawned agents).

If active agents are detected:

1. For each active agent, use `SendMessage` to send a `shutdown_request`:
   ```
   Shutdown requested. Please save any work in progress and acknowledge.
   A context reset is about to occur. Note your current state before stopping.
   ```
2. Wait up to 10 seconds for acknowledgment from each agent. If an agent does not
   acknowledge within 10 seconds, note it as "no acknowledgment received" in the
   confirmation output.
3. Record the name and final status of each agent (acknowledged / timed out / not started).

If no active agents are detected, skip this step and note "No active agents" in the
confirmation output.

**Step `write-decisions`**

Use `Read` to check whether `$MEMORY_DIR/decisions.md` exists.

If it exists, read it. Compare the decisions recorded there against decisions made
or referenced in the current session. If any decisions were made this session that
are not already recorded in decisions.md, append them in this format:

```markdown

---

## Decision: <title>

**Date:** <today's date>
**Context:** <brief description of the situation that prompted this decision>
**Decision:** <what was decided>
**Rationale:** <why>
**Alternatives considered:** <other options that were weighed, or "none">
```

If decisions.md does not exist and decisions were made this session, create it with
a header and the new decisions:

```markdown
# Decisions

Project decisions, rationale, and context for future reference.
```

If no new decisions were made this session and the file does not exist, do not create it.
If no new decisions were made and the file exists, do not modify it.

**Step `write-pitfalls`**

Use `Read` to check whether `$MEMORY_DIR/pitfalls.md` exists.

If it exists, read it. If any issues, gotchas, or pitfalls were encountered or discovered
this session that are not already recorded, append them in this format:

```markdown

---

## Pitfall: <title>

**Discovered:** <today's date>
**Symptom:** <what the problem looked like when encountered>
**Cause:** <root cause, if known>
**Workaround / Fix:** <how to handle or avoid it>
**Affects:** <which files, systems, or workflows are impacted>
```

If pitfalls.md does not exist and pitfalls were discovered this session, create it with:

```markdown
# Pitfalls

Known issues, gotchas, and things to avoid in this project.
```

If no new pitfalls were discovered and the file does not exist, do not create it.
If no new pitfalls were discovered and the file exists, do not modify it.

**Step `confirm`**

After all files are written, display the following block to the operator — substituting
actual values for the placeholders:

```
=== KilnTwo Reset ===
State saved to memory.

Memory directory: <$MEMORY_DIR>
Files written:
  - MEMORY.md        (status: paused, handoff note recorded)
  - decisions.md     (<N new decisions recorded> | not modified)
  - pitfalls.md      (<N new pitfalls recorded> | not modified)

Active agents: <"shut down" with agent names | "N still running (no acknowledgment)" | "none">

What was preserved:
  - Current stage and phase
  - Warm handoff note (what was being worked on)
  - Agent context and pending tasks
  - Operator note and next action

What will be lost after /clear:
  - Full conversation history
  - In-memory reasoning and intermediate results
  - Any tool call outputs not written to disk

Next steps:
  1. Type /clear to reset context
  2. Type /kw:resume to continue from where you left off
====================
```

After displaying this block, add a single sentence reminding the operator:

> Claude Code cannot run /clear automatically — you must type it yourself after
> this message.

---

#### `<success_criteria>` block

Write a checklist of success criteria. Include at least these items:

- [ ] `$MEMORY_DIR` exists on disk
- [ ] MEMORY.md has been written with `status: paused`
- [ ] MEMORY.md contains a non-empty "What Was Being Worked On" section
- [ ] MEMORY.md contains a non-empty "Next Action" section
- [ ] decisions.md updated if new decisions were made this session
- [ ] pitfalls.md updated if new pitfalls were discovered this session
- [ ] Active agents received shutdown_request (or "none" confirmed)
- [ ] Confirmation block displayed to operator
- [ ] Operator informed that /clear must be run manually

---

### File structure summary

```
---
[frontmatter]
---

<objective>
[2-4 sentences]
</objective>

<process>

<step name="detect">
[project path and memory directory detection]
</step>

<step name="save-state">
[MEMORY.md write with full handoff structure]
</step>

<step name="shutdown-agents">
[SendMessage to active agents, wait for acknowledgment]
</step>

<step name="write-decisions">
[append new decisions to decisions.md]
</step>

<step name="write-pitfalls">
[append new pitfalls to pitfalls.md]
</step>

<step name="confirm">
[display confirmation block, remind operator to /clear manually]
</step>

</process>

<success_criteria>
[checklist]
</success_criteria>
```

There must be exactly one blank line between the closing `---` of the frontmatter and the
opening `<objective>` tag. There must be exactly one blank line between each top-level
block (`<objective>`, `<process>`, `<success_criteria>`). The file must end with a single
trailing newline and no trailing whitespace on any line.

---

### Acceptance Criteria

1. The file `/DEV/kilntwo/assets/commands/kw/reset.md` exists.
2. The file begins with `---` on line 1 (YAML frontmatter opening).
3. The frontmatter contains `name: kw:reset`.
4. The frontmatter contains `description: Save session state to memory and prepare for context reset (/clear)`.
5. The `allowed-tools` list contains exactly: `Read`, `Write`, `Bash`, `Task`, `SendMessage`.
6. An `<objective>` block is present and explains the purpose of the command.
7. A `<process>` block is present containing exactly six named steps:
   `detect`, `save-state`, `shutdown-agents`, `write-decisions`, `write-pitfalls`, `confirm`.
8. The `detect` step instructs running `pwd` and computing the encoded project path via `sed`.
9. The `save-state` step specifies writing MEMORY.md with `status: paused` and a warm handoff
   note containing at minimum: what was being worked on, agent context, an operator note, and
   a next action.
10. The `save-state` step instructs generating a `reset_at` timestamp via `date -u`.
11. The `shutdown-agents` step instructs using `SendMessage` with a `shutdown_request` and
    waiting for acknowledgment with a timeout.
12. The `write-decisions` step instructs checking for and conditionally updating decisions.md.
13. The `write-pitfalls` step instructs checking for and conditionally updating pitfalls.md.
14. The `confirm` step includes the `=== KilnTwo Reset ===` display block with the four
    "Next steps" listing `/clear` and `/kw:resume`.
15. The `confirm` step explicitly states that `/clear` must be run manually by the operator.
16. A `<success_criteria>` block is present with a checkbox list of at least nine items.
17. No line in the file contains trailing whitespace.
18. The file ends with exactly one trailing newline.
19. The file contains no placeholder text such as `[fill this in]`, `TODO`, or `...` used
    as stub content.

---

### Important

- Write the complete file content — no placeholders, no TODOs, no stub sections.
- This is a plain markdown/YAML file that Claude Code expands as a prompt. It is not
  executable code. Write it as well-formed markdown with valid YAML frontmatter.
- The YAML frontmatter must be the very first content in the file — no blank lines or
  BOM before the opening `---`.
- The instructions in the process steps are directives to the Claude Code orchestrator,
  written in imperative language ("Use `Bash` to run...", "Write the file to...",
  "Display the following block...").
- The memory directory convention (`~/.claude/projects/<encodedPath>/memory`) is
  established in `/DEV/kilntwo/src/paths.js` — the command must follow this same
  convention so that `/kw:resume` can find the files.
- Do not create any other files. Do not modify any existing files in the repository.
- Do not install any packages or run any commands.
- The file will be deployed verbatim to `~/.claude/commands/kw/reset.md` by the
  KilnTwo installer and must be valid as a Claude Code slash command definition
  the moment it is written.
