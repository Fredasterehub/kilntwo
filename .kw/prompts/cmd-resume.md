## Prompt: Create `assets/commands/kw/resume.md` — `/kw:resume` Slash Command for KilnTwo

### Context

You are creating a Claude Code slash command definition file for KilnTwo, a Node.js CLI
tool located at `/DEV/kilntwo/`. Read the following files before writing anything:

- `/DEV/kilntwo/package.json` — project metadata and conventions
- `/DEV/kilntwo/src/paths.js` — path resolution module; pay close attention to
  `encodeProjectPath` and `projectMemoryDir`, which define how the memory directory
  path is derived from the project path:
  ```
  encodeProjectPath('/DEV/myproject')  => '-DEV-myproject'
  projectMemoryDir(undefined, '/DEV/myproject')
    => '~/.claude/projects/-DEV-myproject/memory'
  ```
- `/DEV/kilntwo/.kw/prompts/install.md` — shows how `assets/commands/kw/*.md` files
  are deployed: each file is copied verbatim to `~/.claude/commands/kw/` during
  `kilntwo install`. The filename becomes the sub-command name, so `resume.md`
  becomes the `/kw:resume` command.

The `assets/commands/kw/` directory currently exists at `/DEV/kilntwo/assets/commands/kw/`
and is empty. This is a slash command file — plain markdown that Claude Code expands
when a user types `/kw:resume` in a conversation.

### Task

Create `/DEV/kilntwo/assets/commands/kw/resume.md` — the Claude Code slash command
that restores full project context from persisted memory and continues work exactly
where the session left off.

When Claude Code expands this command, it is acting as the orchestrator. The markdown
content is injected into the conversation as an instruction to Claude. Write it in the
second person, imperative voice, addressed directly to Claude as the executing agent.

### Files to Create

- `/DEV/kilntwo/assets/commands/kw/resume.md`

Do not create any other files.

---

### Requirements

#### 1. File format

The file is plain markdown — no YAML front-matter, no code fences wrapping the outer
document. It begins with a top-level heading (`# /kw:resume`) and is structured into
clearly delimited sections. Claude Code injects this content verbatim into the
conversation as an instruction, so write it as a direct, imperative prompt addressed
to Claude.

#### 2. Top-level heading

The first line must be:

```
# /kw:resume
```

#### 3. Section: Purpose (one-sentence summary)

Immediately after the heading, include a single sentence describing what this command
does. Keep it under 20 words. Example shape (write your own words):

```
Restore full project context from memory and continue work from where the last session ended.
```

#### 4. Section: Step 1 — Detect project path

Instruct Claude to:

- Use `process.cwd()` semantics: the project path is the current working directory
  of the conversation (the directory where Claude Code was launched, available as
  `$PWD` or equivalent).
- Store it as `PROJECT_PATH`.
- If `PROJECT_PATH` cannot be determined, halt and tell the user:
  `"Cannot determine project path. Please run this command from the project root."`

#### 5. Section: Step 2 — Compute the memory directory path

Instruct Claude to derive the memory directory using the same encoding that
`src/paths.js` implements:

1. Split `PROJECT_PATH` on `/` (path separator).
2. Join the parts with `-` to get the encoded path (this produces a leading `-`
   from the leading `/`).
3. The memory directory is: `~/.claude/projects/<encoded-path>/memory/`

Provide a worked example in the instruction text so Claude can verify its arithmetic:
```
PROJECT_PATH = /DEV/myproject
encoded      = -DEV-myproject
memory dir   = ~/.claude/projects/-DEV-myproject/memory/
```

#### 6. Section: Step 3 — Read MEMORY.md (required)

Instruct Claude to read `<memory-dir>/MEMORY.md`.

If the file does not exist, or if it is empty, Claude must halt immediately and
output exactly this warning block (and nothing else):

```
[kw:resume] No memory found at <resolved memory dir path>.
Memory may not have been initialized. Run /kw:start to begin a new project session.
```

If the file exists, extract and store these fields. Tell Claude the exact keys to
look for, in MEMORY.md sections or key-value pairs:

- `stage` — one of: `brainstorm`, `planning`, `execution`, `validation`, `complete`
- `phase_number` — integer (only present during `execution` stage; may be absent
  or `null` for other stages)
- `phase_name` — string (only present during `execution` stage; may be absent or
  `null` for other stages)
- `phase_total` — integer, total number of phases (only present during `execution`
  stage)
- `status` — one of: `in-progress`, `paused`, `blocked`
- `handoff_note` — free-text string written by `/kw:reset` describing what was
  happening when the session ended; may be empty
- `debate_mode` — boolean (`true` / `false`); defaults to `false` if absent

If any of `stage` or `status` are missing or contain unrecognized values, treat
it as corruption and halt with:

```
[kw:resume] MEMORY.md is corrupted or incomplete (missing required fields: <list>).
Run /kw:start to reinitialize, or manually repair ~/.claude/projects/<encoded>/memory/MEMORY.md.
```

#### 7. Section: Step 4 — Read supporting memory files (parallel)

Instruct Claude to read all of the following files in parallel (batch reads):

- `<memory-dir>/vision.md` — project vision and goals
- `<memory-dir>/master-plan.md` — full implementation plan
- `<memory-dir>/decisions.md` — architectural and design decisions log
- `<memory-dir>/pitfalls.md` — known pitfalls and anti-patterns to avoid

For each file: if it exists, store its full content. If it does not exist, note
it as absent but do not halt — absence of supporting files is non-fatal.

#### 8. Section: Step 5 — Display the continuity banner

Instruct Claude to print the following banner to the user verbatim, substituting
the bracketed values from the data read in steps 3-4. The banner must be rendered
as a code block so the pipe characters align correctly:

```
=== KilnTwo Resume ===
Project: [PROJECT_PATH]
Stage:   [stage]
Phase:   [phase_number]/[phase_total] [phase_name]   (omit this line if not in execution stage)
Status:  [status]
Handoff: [handoff_note, or "(none)" if empty]
=====================
```

Rules for the Phase line:
- Include it only when `stage === 'execution'` and `phase_number` is non-null.
- If `phase_total` is absent, render as `[phase_number]/? [phase_name]`.

#### 9. Section: Step 6 — Route to the correct stage

Instruct Claude to branch on the value of `stage` and perform the following
action for each case. Each case must be described precisely:

**`brainstorm`**
- Re-read `vision.md` in full (already loaded in step 4).
- Tell the user: "Resuming brainstorming session. Here is the current vision:"
- Print the full content of `vision.md`.
- Then invite the user to continue the brainstorm: "What would you like to
  explore or refine next?"

**`planning`**
- Re-read `master-plan.md` in full (already loaded in step 4).
- Check `MEMORY.md` for a `planning_sub_stage` field. Recognize these values:
  - `dual-plan` — two competing plans are being drafted
  - `debate` — plans are being debated (check `debate_mode` flag)
  - `synthesis` — plans are being merged into the final master plan
  - absent/unknown — treat as `dual-plan`
- Tell the user: "Resuming planning stage ([planning_sub_stage])."
- Print the current master plan (or note if `master-plan.md` was absent).
- Invite the user to continue.

**`execution`**
- Look for phase state files in the project's `.kw/` directory:
  `<PROJECT_PATH>/.kw/phase_<N>.md` where N is `phase_number`.
- If the phase file exists, read it and summarize: "Resuming execution —
  Phase [N]/[total]: [phase_name]. Last recorded state: [brief summary from
  phase file]."
- If the phase file does not exist, fall back to master-plan.md and tell the
  user: "Resuming execution — Phase [N]/[total]: [phase_name]. No phase state
  file found; reading master plan for context."
- Print the relevant section of the master plan.
- Ask the user: "Shall I continue from where we left off?"

**`validation`**
- Re-read `master-plan.md` and `decisions.md` (already loaded in step 4).
- Tell the user: "Resuming validation stage."
- Summarize what was built (from master-plan.md) and what decisions were made
  (from decisions.md).
- Invite the user to continue validation.

**`complete`**
- Tell the user:

  ```
  This project is marked complete.

  What would you like to do next?
    1. Start a new project in this directory (/kw:start)
    2. Review the decisions log
    3. Review the pitfalls log
    4. Archive this project's memory
  ```

- Do not resume any work. Wait for the user's choice.

#### 10. Section: Step 7 — Update MEMORY.md

After routing (except for `complete`, where the project is done), instruct Claude to
update `<memory-dir>/MEMORY.md` with:

- `status` set to `in-progress`
- A new line appended under a `## Resume Log` section (create the section if absent):
  ```
  - Resumed: <ISO-8601 timestamp>
  ```

Instruct Claude to make this update atomically: read the current MEMORY.md content,
apply both changes, write the full updated content back. Do not lose any existing
content.

#### 11. Key rules block

At the end of the file, include a `## Key Rules` section with the following rules
as a bullet list. Write them as imperative constraints on Claude's behaviour:

- Memory is the sole source of truth. Never infer project stage, phase, or status
  from source files, directory structure, or conversation history. Read only from
  `~/.claude/projects/<encoded>/memory/`.
- If MEMORY.md is missing or corrupted, warn the user and suggest `/kw:start`.
  Do not attempt to reconstruct state.
- Preserve all previous context. Do not re-ask questions that memory already
  answers.
- Do not modify any project source files during resume. This command is read-only
  except for the MEMORY.md status update in Step 7.
- The handoff note is authoritative about what was happening. Trust it over any
  inferences from other context.

---

### File structure (top-level outline)

The finished file must follow this structure exactly (section titles are your guide;
use `##` for each section heading):

```
# /kw:resume

[one-sentence purpose]

## Step 1: Detect Project Path
## Step 2: Compute Memory Directory Path
## Step 3: Read MEMORY.md
## Step 4: Read Supporting Memory Files
## Step 5: Display Continuity Banner
## Step 6: Route to Stage
## Step 7: Update MEMORY.md
## Key Rules
```

---

### Acceptance Criteria

1. `/DEV/kilntwo/assets/commands/kw/resume.md` exists after this step.

2. The file begins with exactly `# /kw:resume` on line 1.

3. The file contains exactly 8 `##`-level sections matching the structure above.

4. Step 2 contains a worked encoding example showing how `/DEV/myproject` becomes
   `-DEV-myproject` and maps to `~/.claude/projects/-DEV-myproject/memory/`.

5. Step 3 specifies all seven fields to extract from MEMORY.md: `stage`,
   `phase_number`, `phase_name`, `phase_total`, `status`, `handoff_note`,
   `debate_mode`.

6. Step 3 includes the exact halt message for missing/empty MEMORY.md, referencing
   the resolved memory directory path and suggesting `/kw:start`.

7. Step 3 includes the exact halt message for corrupted MEMORY.md, listing the
   missing fields and providing the path for manual repair.

8. Step 4 lists all four supporting files (`vision.md`, `master-plan.md`,
   `decisions.md`, `pitfalls.md`) and instructs Claude to read them in parallel.

9. Step 5 contains the continuity banner template with all five fields (Project,
   Stage, Phase, Status, Handoff) and the rule that the Phase line is omitted
   outside the execution stage.

10. Step 6 handles all five stage values: `brainstorm`, `planning`, `execution`,
    `validation`, `complete`.

11. The `execution` branch in Step 6 references `.kw/phase_<N>.md` phase state
    files inside the project directory.

12. The `planning` branch in Step 6 checks `planning_sub_stage` and handles
    `dual-plan`, `debate`, and `synthesis`.

13. The `complete` branch in Step 6 presents the user with the four numbered
    next-step options and does not resume work.

14. Step 7 specifies both the `status → in-progress` update and the append to a
    `## Resume Log` section with an ISO-8601 timestamp, and states that no
    existing content must be lost.

15. The Key Rules section contains all five bullet-point rules, including the
    "memory is sole source of truth" rule and the "do not modify source files"
    rule.

16. The file is written in second-person imperative voice addressed to Claude
    (e.g., "Read ...", "Display ...", "Update ...") — not in first person and
    not as documentation about what the command does.

17. The file ends with a single trailing newline and contains no trailing
    whitespace on any line.

18. The file contains no YAML front-matter block.

---

### Important

- Write the complete file content — no placeholders, no TODOs, no `[fill in here]`
  markers.
- This is a plain markdown file that Claude Code injects verbatim as an instruction.
  It is not JavaScript, not a config file, not documentation. Every sentence is a
  direct instruction to Claude.
- Write in the imperative, second-person voice throughout ("Read MEMORY.md",
  "Compute the encoded path", "Tell the user..."). Do not write in the third person
  ("The command reads...") or passive voice ("MEMORY.md is read...").
- Be precise about halt conditions. If Claude should stop and not proceed, say
  "halt immediately" and give the exact output string.
- The encoding algorithm in Step 2 must match `src/paths.js` exactly:
  `absolutePath.split('/').join('-')` — splitting on `/` (not `path.sep`) since
  Claude Code runs on POSIX and the memory paths are always POSIX paths.
- Do not create any other files.
- Do not modify any existing files in the repository.
- Do not install any packages or run any commands.
