## Prompt: Create `assets/agents/kw-researcher.md` — Researcher Agent Definition for KilnTwo

### Context

You are creating a Claude Code sub-agent definition file for KilnTwo, a Node.js CLI
tool located at `/DEV/kilntwo/`. Read the following files before writing anything:

- `/DEV/kilntwo/package.json` — project metadata and conventions
- `/DEV/kilntwo/.kw/prompts/install.md` — shows how assets/agents/ files are
  deployed: each `*.md` file in `assets/agents/` is copied verbatim to
  `<home>/.claude/agents/` during `kilntwo install`

The `assets/agents/` directory is currently empty. This is the first agent
definition file to be placed there.

### Task

Create `/DEV/kilntwo/assets/agents/kw-researcher.md` — a Claude Code agent
definition file that configures a fast, read-only research sub-agent used by
other agents in the KilnTwo pipeline to perform documentation lookups, codebase
exploration, and web research without consuming expensive model tokens.

### Files to Create

- `/DEV/kilntwo/assets/agents/kw-researcher.md`

### Requirements

#### Front-matter block

The file must open with a YAML front-matter block (fenced by `---`) containing
exactly these fields in this order:

```
---
name: kw-researcher
description: Fast documentation and codebase research agent
tools: Read, Grep, Glob, WebSearch, WebFetch, mcp__context7__resolve-library-id, mcp__context7__query-docs
model: haiku
color: cyan
---
```

No other front-matter fields. No trailing whitespace inside the block.

#### `<role>` section

Immediately after the front-matter, include a `<role>` XML element (one blank
line between front-matter closing `---` and the opening tag):

```
<role>
Fast retrieval agent for documentation lookups, codebase exploration, and web
research. Used by other agents when they need to look something up quickly
without burning expensive model tokens.
</role>
```

The text must appear exactly as a single paragraph inside the tags with no
leading or trailing blank lines inside the element.

#### `<instructions>` section

One blank line after the closing `</role>` tag, then an `<instructions>` XML
element containing the behavioral rules as a markdown bullet list. The
instructions must cover each of the following points, in this order, with no
additional points added:

1. Receive a research question and optional scope (files, URLs, libraries).
2. Use the most efficient tool for each lookup:
   - Glob for locating files by name pattern
   - Grep for searching file contents
   - WebSearch and WebFetch for external documentation
   - mcp__context7__resolve-library-id then mcp__context7__query-docs for
     library API documentation
3. Return a concise summary under 500 words with key findings.
4. Include file paths and line numbers for any code references.
5. If the question cannot be answered with available tools, say so clearly.
6. Never write files — research only.
7. Use paths received in the spawn prompt; never hardcode project paths.

Format each point as a single `-` list item. Sub-points under item 2 (the tool
routing rules) must be formatted as a nested bullet list indented with two
spaces under that item. Keep language direct and imperative.

#### Overall file structure

```
---
[front-matter]
---

<role>
[single paragraph]
</role>

<instructions>
[bullet list]
</instructions>
```

There must be exactly one blank line between each top-level block. The file
must end with a single trailing newline and no trailing whitespace on any line.

### Acceptance Criteria

1. The file `/DEV/kilntwo/assets/agents/kw-researcher.md` exists.
2. The file begins with `---` on line 1.
3. `name: kw-researcher` appears in the front-matter.
4. `model: haiku` appears in the front-matter.
5. `color: cyan` appears in the front-matter.
6. The `tools:` field lists all seven tools:
   `Read, Grep, Glob, WebSearch, WebFetch, mcp__context7__resolve-library-id, mcp__context7__query-docs`
7. A `<role>` element is present with a non-empty paragraph describing the agent
   as a fast retrieval agent used by other agents.
8. An `<instructions>` element is present and contains at least seven list items.
9. The instructions mention "500 words" as the summary length cap.
10. The instructions include a rule prohibiting file writes.
11. The instructions include a rule about not hardcoding project paths.
12. The instructions include the tool-routing guidance for Glob, Grep,
    WebSearch/WebFetch, and context7.
13. The file ends with exactly one trailing newline.
14. No line in the file contains trailing whitespace.

### Important

- Write the complete file content — no placeholders, no TODOs.
- Do not create any other files.
- Do not modify any existing files in the repository.
- Do not install any packages or run any commands.
- This is a plain markdown/YAML file — no JavaScript, no code to execute.
- The file will be deployed verbatim to `~/.claude/agents/kw-researcher.md`
  by the KilnTwo installer; it must be valid as a Claude Code agent definition
  the moment it is written.
