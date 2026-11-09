---
name: generate-map
description: Reads a repo's docs and updates the project's CLAUDE.md (creating it if missing) with a docs map of only the docs an agent may need — what each covers and when to read it, no content — merged into the existing CLAUDE.md rather than appended. Re-running updates the map in place.
argument-hint: "[repo path, optional]"
disable-model-invocation: true
---

# Generate docs map

Repo: $ARGUMENTS (default: the current working directory's git repo)

Update the repo's root `CLAUDE.md` with a **docs map**. The map tells an
agent what each doc covers, so it can decide whether to open it. It holds
**descriptions only, never content**: no facts, values, decisions or
definitions from the docs.

## 1. Find the docs

- Collect the doc files in the repo: `*.md`, plus `*.html` files under
  `docs/`. Use `git ls-files` so ignored files are skipped, and add
  untracked docs from `git status --short`.
- Skip: dependency and build folders (`node_modules/`, `vendor/`,
  `dist/`, `build/`, `.venv/`), `.git/`, `.github/` templates, and
  `CLAUDE.md` itself.

## 2. Pick the docs an agent may need

Only docs an agent working on the code would read go in the map:
architecture, contracts and interfaces, decisions, glossaries, setup,
testing and conventions, and similar.

Leave out:
- Docs for humans only: generated or visual files (e.g.
  `docs/summary.html`, `docs/ARCHITECTURE.html`), slides, meeting notes,
  marketing or end-user guides.
- Docs with nothing an agent acts on: changelogs, licences, codes of
  conduct, empty stubs.
- Folders of one-off working files (e.g. `docs/specs/`), unless the
  repo's docs say agents should read them.

A folder of many docs of one kind that agents do need (`docs/adr/`,
`docs/decisions/`) is **one row** for the folder, not one per file. Read
enough of them to describe the kind and the naming pattern.

## 3. Read each picked doc

Read every picked doc in full (for a folder row, a sample). For each,
work out:

- **Covers**: the topics it holds, as nouns: "endpoint request/response
  shapes for auth and orders", not "auth uses JWT". Name the areas, not
  what the doc says about them.
- **Read when**: the kind of task that needs it: "changing an API",
  "naming domain concepts", "setting up locally".

Each row is one line, short enough to scan: about 25 words across both
columns.

## 4. Update CLAUDE.md

Format of the map:

```markdown
<!-- docs-map:start -->
## Docs map

Read a doc only when its row matches the task.

| Doc | Covers | Read when |
|---|---|---|
| `docs/ARCHITECTURE.md` | Modules, how they connect, data flow | Touching structure or adding a module |
| `docs/adr/` | One decision per file (`NNNN-title.md`) | Before changing past behaviour |
<!-- docs-map:end -->
```

- Order rows: root docs first (`README.md`, `GLOSSARY.md`, ...), then
  `docs/` alphabetically, then folder rows, then other locations.
- Read the whole of `CLAUDE.md` first, then merge the map into it:
  - **Map markers exist**: replace everything between them. Keep any row
    the user added by hand whose doc still exists; drop rows for docs
    that are gone.
  - **A section already lists or points to docs** (e.g. `## Docs`,
    `## Documentation`, a "read X before Y" list): turn that section into
    the map in place and add the markers. Fold its existing pointers into
    the rows; keep any instruction in it that isn't a doc pointer.
  - **No map and no such section**: place the map where it fits the
    file's structure, normally right after the project overview near the
    top. Append at the end only if nothing fits better.
- Elsewhere in `CLAUDE.md`, fix references to docs: update paths of docs
  that moved, and remove or flag references to docs that no longer exist.
  Don't add descriptions of docs outside the map.
- Change nothing else in `CLAUDE.md`.
- **`CLAUDE.md` doesn't exist**: create it with only the map.

## 5. Finish

- Don't commit and don't stage. The user decides.
- Report in a few lines: created or updated `CLAUDE.md`, where the map
  went, rows added, changed and removed, docs left out and why (one line
  each), other references fixed, and any doc you couldn't describe.
