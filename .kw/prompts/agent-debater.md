## Prompt: Create `assets/agents/kw-debater.md` — Plan Debate and Resolution Agent for KilnTwo

### Context

You are creating an agent definition file for KilnTwo, a multi-model pipeline
orchestrator located at `/DEV/kilntwo/`. Read the following file before writing
anything:

- `/DEV/kilntwo/package.json` — project metadata (name: `kilntwo`, version:
  `0.1.0`, description: "multi-model pipeline orchestrator (Claude Opus 4.6 +
  GPT-5.2/5.3 via Codex CLI)")

The `assets/agents/` directory exists at `/DEV/kilntwo/assets/agents/` and is
currently empty. Agent definition files in this project follow the Claude Code
sub-agent format: YAML frontmatter delimited by `---` followed by the agent
body written in plain Markdown with XML-style section headers.

The agent's runtime environment:
- It will be spawned inside a project whose `.kw/` directory holds all pipeline
  artifacts.
- Plan files live at `<project-path>/.kw/plans/claude_plan.md` and
  `<project-path>/.kw/plans/codex_plan.md`.
- The resolution output is written to `<project-path>/.kw/plans/debate_resolution.md`.
- The agent receives its inputs via the spawning prompt, not via environment
  variables.

### Task

Create `/DEV/kilntwo/assets/agents/kw-debater.md` — a Claude Code agent
definition file that acts as the plan debate and resolution agent for the
KilnTwo pipeline. When spawned, it reads two implementation plans (one produced
by a Claude planner, one produced by a Codex planner), identifies disagreements
between them, resolves those disagreements through structured analysis, and
writes a debate resolution document.

### Files to Create

- `/DEV/kilntwo/assets/agents/kw-debater.md`

Do not create any other files.

---

### Requirements

#### 1. YAML Frontmatter

The file must open with a YAML frontmatter block using exactly this structure:

```yaml
---
name: kw-debater
description: Plan debate and resolution agent — identifies disagreements between Claude and Codex plans and resolves them
model: claude-opus-4-5
color: magenta
tools:
  - Read
  - Write
  - Grep
  - Glob
---
```

- `name` must be exactly `kw-debater` (kebab-case).
- `description` must be the single-line string shown above.
- `model` must be `claude-opus-4-5` (the opus-class model).
- `color` must be `magenta`.
- `tools` must list exactly: `Read`, `Write`, `Grep`, `Glob` — no Bash, no
  Task, no Edit.
- The frontmatter block must be the very first content in the file — no blank
  lines or comments before the opening `---`.

#### 2. Agent Title

Immediately after the closing `---`, write this H1 heading:

```markdown
# KW Debater
```

#### 3. Role Section

Write an `## Role` section that describes the agent's purpose in 2–4 sentences:

- It is the debate and resolution agent for the KilnTwo multi-model pipeline.
- It receives two implementation plans (from a Claude planner and a Codex
  planner) along with a debate mode, then identifies disagreements and produces
  a structured resolution.
- Its output is a `debate_resolution.md` file that downstream pipeline stages
  use to reconcile the two plans into a single synthesized approach.

#### 4. Inputs Section

Write an `## Inputs` section that documents the three values the agent receives
in its spawning prompt:

- `project_path` — absolute path to the project root. All `.kw/` paths are
  relative to this root.
- `claude_plan_path` — path to the Claude planner's output, defaulting to
  `<project_path>/.kw/plans/claude_plan.md`.
- `codex_plan_path` — path to the Codex planner's output, defaulting to
  `<project_path>/.kw/plans/codex_plan.md`.
- `debate_mode` — integer 1, 2, or 3 controlling depth of analysis:
  - `1` = Skip (no debate performed, return immediately)
  - `2` = Focused (identify and resolve specific disagreements)
  - `3` = Full (thorough multi-round analysis with confidence levels)

#### 5. Instructions Section

Write an `## Instructions` section with the following subsections.

##### 5a. Mode 1 — Skip

When `debate_mode` is `1`:
- Do not read either plan file.
- Do not write `debate_resolution.md`.
- Return immediately with a brief summary: `"Debate skipped (mode 1). No
  resolution file written."`.

##### 5b. Mode 2 — Focused

When `debate_mode` is `2`, follow these steps in order:

**Step 1: Read both plans.**
Read `claude_plan_path` and `codex_plan_path` in parallel. If either file does
not exist, return an error summary: `"Cannot run debate: <path> not found."`.

**Step 2: Identify disagreements.**
Compare the two plans and find specific disagreements. A disagreement is any
place where:
- The plans propose different approaches to the same problem.
- One plan includes a step or consideration that the other omits.
- The plans make conflicting decisions about architecture, ordering, tooling,
  or error handling.

Ignore purely stylistic differences (naming conventions, prose phrasing).

**Step 3: Evaluate each disagreement.**
For each disagreement, evaluate both positions against three criteria:
1. **Correctness** — which approach is more likely to produce working code?
2. **Simplicity** — which approach is easier to implement and maintain?
3. **Alignment** — which approach better reflects the project's apparent vision
   and prior decisions as evidenced by the plan content itself?

**Step 4: Write `debate_resolution.md`.**
Write the resolution file to `<project_path>/.kw/plans/debate_resolution.md`.
Create the `<project_path>/.kw/plans/` directory if it does not exist (use the
Write tool — it will create intermediate directories automatically).

The file must follow the output format specified in the Output Format section
below.

**Step 5: Return summary.**
Return a brief inline summary listing: number of agreements found, number of
disagreements found, and number of resolutions written.

##### 5c. Mode 3 — Full

When `debate_mode` is `3`, follow all Mode 2 steps, plus:

**Extended analysis:**
- Consider edge cases, performance implications, maintainability, and testing
  implications for each disagreement.
- Perform up to 3 rounds of analysis: after producing initial resolutions,
  re-examine each resolution from the perspective of the opposing plan to check
  for gaps or hidden strengths that the first pass may have missed.
- Stop early if round 2 or 3 produces no new insights.

**Confidence levels:**
- For each resolution in the `## Resolutions` section, add a `**Confidence:**`
  line after the reasoning. Use one of:
  - `High` — both criteria and edge-case analysis strongly favor this resolution.
  - `Medium` — the resolution is sound but the opposing approach has at least
    one valid point worth monitoring.
  - `Low` — genuine uncertainty remains; the synthesizer should apply extra
    scrutiny to this decision.

**Return summary:**
Include the number of rounds completed and the confidence distribution
(e.g., `3 High, 1 Medium, 0 Low`).

#### 6. Output Format Section

Write an `## Output Format` section that specifies the exact structure of
`debate_resolution.md`. The file must contain these four top-level sections in
this order:

```markdown
## Agreements

<Bullet list of points both plans handled correctly or identically.
Each bullet is a concise statement of the shared approach.>

## Disagreements

<Numbered list. Each item names the disagreement and presents both positions:>

1. **<Disagreement title>**
   - Claude plan: <position>
   - Codex plan: <position>

## Resolutions

<Numbered list matching the Disagreements list. Each item names the chosen
resolution and provides reasoning:>

1. **<Resolution title>** — <which plan's approach was chosen, or a hybrid>
   **Reasoning:** <why this resolution was selected based on correctness,
   simplicity, and alignment criteria>
   <!-- In Mode 3 only: -->
   **Confidence:** <High | Medium | Low>

## Recommendations

<Bullet list of any additional insights, caveats, or process notes that arose
during the debate that the synthesizer should be aware of.
If there are none, write: "No additional recommendations.">
```

The section markers (`## Agreements`, etc.) must appear exactly as shown.
Downstream pipeline tools pattern-match on these headings.

#### 7. Behavioral Rules

Include a `## Behavioral Rules` section with the following rules written as a
numbered list:

1. Never modify `claude_plan_path` or `codex_plan_path`. These are read-only inputs.
2. The only file this agent writes is `debate_resolution.md`. Write no other files.
3. If `debate_mode` is not 1, 2, or 3, treat it as mode 2 and add a note to
   the `## Recommendations` section: `"Unknown debate mode — defaulted to mode 2 (focused)."`
4. Do not hallucinate disagreements. Only report disagreements that are directly
   evidenced by the text of the two plan files.
5. Do not invent plan content. Quote or closely paraphrase the actual plan text
   when describing each position.
6. If both plans are identical or contain no meaningful disagreements, write
   `## Disagreements` with a single entry: `"No meaningful disagreements found."`
   and `## Resolutions` with a matching single entry: `"No resolutions required."`
7. Keep `debate_resolution.md` concise. Aim for under 400 lines. Depth of
   analysis lives in the reasoning, not in repetition of plan text.

---

### Acceptance Criteria

1. The file `/DEV/kilntwo/assets/agents/kw-debater.md` exists after creation.

2. The file begins with `---` on line 1 (no preceding blank lines or content).

3. The YAML frontmatter contains exactly these keys with exactly these values:
   - `name: kw-debater`
   - `model: claude-opus-4-5`
   - `color: magenta`
   - `tools:` listing `Read`, `Write`, `Grep`, `Glob` (no others)

4. The frontmatter `description` field is a non-empty single-line string that
   mentions both "debate" and "resolution".

5. The body (after the closing `---`) begins with `# KW Debater`.

6. The body contains all five required H2 sections in order:
   `## Role`, `## Inputs`, `## Instructions`, `## Output Format`,
   `## Behavioral Rules`.

7. The `## Instructions` section contains three clearly labeled subsections
   corresponding to modes 1, 2, and 3.

8. Mode 1 instructions explicitly state that no files are read or written and
   the agent returns immediately.

9. Mode 2 instructions describe a step-by-step process that ends with writing
   `debate_resolution.md`.

10. Mode 3 instructions extend Mode 2 with edge-case/performance analysis,
    up-to-3 rounds, and per-resolution confidence levels.

11. The `## Output Format` section defines all four subsections:
    `## Agreements`, `## Disagreements`, `## Resolutions`, `## Recommendations`,
    with their exact heading text.

12. The `## Behavioral Rules` section contains at least 7 numbered rules.

13. Rule 1 explicitly states that `claude_plan_path` and `codex_plan_path` are
    read-only (never modified).

14. Rule 2 states that `debate_resolution.md` is the only file written.

15. The file contains no placeholder text, TODO comments, or incomplete
    sections.

16. The file is valid Markdown — no unclosed fences, no broken YAML syntax
    in the frontmatter.

---

### Important

- Write the complete agent definition file with no placeholders or TODOs.
- The file is a Markdown document with YAML frontmatter — it is not a Node.js
  module and does not use `require` or `module.exports`.
- Do not create any other files. Do not modify `package.json` or any existing
  source files.
- The agent instructions must be written as clear imperative prose that a
  Claude model can follow without ambiguity. Avoid vague phrasing like "handle
  appropriately" — be specific about every decision.
- Keep the total file length reasonable. The full agent definition should be
  between 100 and 250 lines.
