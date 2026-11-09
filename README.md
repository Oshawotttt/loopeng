# loopeng

Loop engineering workflow, packaged as a Claude Code plugin.

Only `plugins/loopeng/` is installed. Everything else in this repo stays out of the plugin, so notes, docs and other files can live alongside it.

## Install

Install this plugin:

```
/plugin marketplace add Oshawotttt/loopeng
/plugin install loopeng@loopeng
```

Install the plugins it depends on. These are not included:

```
/plugin marketplace add mattpocock/skills
/plugin install mattpocock-skills@mattpocock
/plugin marketplace add cathrynlavery/diagram-design
/plugin install diagram-design@diagram-design
```

- `mattpocock-skills`: required. `/loopeng:loopeng-auto` calls its `tdd` and `code-review` skills.
- `diagram-design`: needed only for `/loopeng:generate-summary`.

## Workflow

1. `/loopeng:generate-map`: add a docs map to the repo's `CLAUDE.md`.
2. `/loopeng:loopeng-plan <task>`: write and approve a spec.
3. `/loopeng:loopeng-auto <spec file>`: build, verify and commit each subtask, review the work, then update the docs.
4. `/loopeng:generate-summary`: build or update `docs/summary.html`, a visual summary for people.

## Contents

| Item | Role |
|---|---|
| `plugins/loopeng/skills/loopeng-plan` | Discovery and approved spec |
| `plugins/loopeng/skills/loopeng-auto` | Executes a spec with auto-commit |
| `plugins/loopeng/skills/commit-message` | Commit message style, called by `loopeng-auto` |
| `plugins/loopeng/skills/generate-map` | Docs map in `CLAUDE.md` |
| `plugins/loopeng/skills/generate-summary` | Visual summary from the docs |
| `plugins/loopeng/agents/objectiveness-verifier.md` | Checks each verification prompt is objective |
| `plugins/loopeng/agents/main-verifier.md` | Verifies one subtask or code-review fix round |
| `plugins/loopeng/agents/docs-updater.md` | Updates docs from the spec and the diff |
