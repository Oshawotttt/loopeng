---
name: generate-summary
description: Builds or updates docs/summary.html, a visual, human-readable summary of a project. ARCHITECTURE.md is the backbone; the other docs (found through the CLAUDE.md docs map when there is one) are read for anything else a reader needs. Diagrams are drawn with diagram-design. Run only when the user invokes /generate-summary.
argument-hint: "[repo path or sections to focus on, optional]"
disable-model-invocation: true
---

# Generate summary

Focus: $ARGUMENTS

Build or update `docs/summary.html`: a single page a person reads to
understand the project fast. Agents never read it: it is never a source
for planning or for other docs. The markdown docs stay the source of
truth; this page only summarises them.

**The repo** is the current working directory's git repo, unless the
arguments name another.

## 1. Find the docs

- If the project's `CLAUDE.md` (or `AGENTS.md`) has a docs map, use it to
  find every doc and what each one holds.
- Otherwise look for: `README.md`, `CLAUDE.md`/`AGENTS.md`,
  `GLOSSARY.md`/`GLOSSARY-MAP.md`, the md files in `docs/`, and the ADRs
  in `docs/adr/` (skip `docs/specs/` except to note any spec still in
  progress).
- `docs/ARCHITECTURE.md` is the backbone. If it doesn't exist, stop and
  tell the user. Don't invent the architecture from the code.

## 2. Read and pick what matters

Read `ARCHITECTURE.md` in full, then every other doc found. From the
other docs, keep only what a reader needs to understand the project, not
everything. For example:

- **Decisions**: only the major ones, and only from the ADRs in
  `docs/adr/`. An ADR is written only for a decision that is hard to
  reverse, surprising without context and a real trade-off, so every ADR
  is major. List every ADR not marked `status: superseded`, one line each:
  the decision and its why, linking the ADR file. Don't list decisions
  from any other doc.
- **Contracts**: the main interfaces between modules, at a glance (names
  and shapes, not every field).
- **Glossary**: the domain terms a reader must know to follow the page.
- **Running it**: how to set up, run and test, from README/SETUP.
- **Open work**: known gaps, todos and plans in progress.
- Anything else a doc says that changes how a reader understands the
  system (a constraint, a limit, a known risk).

Every fact on the page comes from a doc. Don't add facts from the code,
and don't add your own opinions. If two docs contradict each other, don't
pick one: list both, with their files, in a **Doc conflicts** section and
in your report.

## 3. Write `docs/summary.html`

**If it doesn't exist** (or isn't tracked by git): write the full page.

- Order: what the project is (one paragraph) → architecture (diagram +
  modules + data flow) → contracts → key decisions → glossary → running
  it → open work → doc conflicts (only if any).
- Write the headings and text yourself, short and plain. Under each
  section, link the source doc(s) it came from (relative path).
- Draw each diagram by calling the Skill tool with
  "diagram-design:diagram-design", and embed it as inline SVG. At least
  the architecture overview; add a data-flow or sequence diagram only
  when the architecture doc describes one.
- One self-contained file: inline CSS and SVG, no external scripts, so it
  opens offline. It must read well in light and dark mode and on a
  narrow screen.
- Show at the top the date generated and the commit it was built from
  (`git rev-parse --short HEAD`).

**If it exists**: update it instead of rewriting.

- Find the commit it was last built from (the one shown on the page, or
  `git log -1 --format=%H -- docs/summary.html`).
- Read `git diff <that commit> -- <each source doc>` (plus uncommitted
  changes to them). Edit only the sections whose sources changed, and
  update the date and commit at the top.
- For the ADRs, diff the whole folder, so new ones are caught as well as
  edits: `git diff --name-status <that commit> -- docs/adr/` (`A` new,
  `M` changed, `D` deleted, `R` renamed), plus
  `git ls-files --others --exclude-standard -- docs/adr/` for new ADRs not
  yet committed. Add a line for each new ADR, update changed ones, remove
  deleted ones, and remove any ADR that is now marked
  `status: superseded`.
- Redraw a diagram only when the structure it shows changed.
- If nothing in the sources changed, leave the file unchanged and say so.

## 4. Finish

- Don't commit and don't stage. The user decides.
- The output is the local file `docs/summary.html`, written with the
  Write or Edit tool. Don't publish it with the Artifact tool and don't
  load artifact-design, unless the user asks for a link. Then publish
  that same file as it is, with no restyling.
- If the project has a docs map, check it lists `docs/summary.html` as
  "visual summary, never edit by hand, never read by agents". If it
  doesn't, tell the user the row to add; don't edit `CLAUDE.md` yourself.
- Report in a few lines: created or updated, the sections changed, the
  source docs used, and any doc conflicts found.
