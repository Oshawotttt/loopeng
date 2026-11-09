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

- `mattpocock-skills`: required. The loopeng execution skills call its `tdd` and `code-review` skills.
- `diagram-design`: needed only for `/loopeng:generate-summary`.

## Workflow

1. `/loopeng:generate-map`: add a docs map to the repo's `CLAUDE.md`.
2. `/loopeng:plan <task>`: write and approve a spec in `docs/specs/`.
3. Run the spec with the git hygiene you want. Both build, verify and commit each subtask, review the work, then update the docs:
   - `/loopeng:branch <spec file>`: one branch per spec, no push.
   - `/loopeng:orchestrate <spec file>`, then `/loopeng:stack <spec file> [subtask IDs]`: a tree of local branches, no push. The first skill suggests a grouping, and you approve it. With subtask IDs, the second runs only those, skips the sweep, and leaves the rest to you, so you can use parallel worktrees.
4. `/loopeng:generate-summary`: build or update `docs/summary.html`, a visual summary for people.

To step through a run by hand on a feature branch, use the parts directly:

- `/loopeng:loop <spec file> <subtask ID>`: the feedback loop for one subtask. Run it once per subtask, in dependency order.
- `/loopeng:sweep <spec file>`: the code review, docs update and report.

Only a person or a loopeng branch skill runs these. They set `disable-model-invocation`, so Claude can't fire them on its own, and the branch skills read their files directly.

## Contents

| Item | Role |
|---|---|
| `plugins/loopeng/skills/plan` | Discovery and approved spec |
| `plugins/loopeng/skills/branch` | Git hygiene: one branch per spec |
| `plugins/loopeng/skills/orchestrate` | Spec phase: suggests a grouping and writes the approved Branch plan |
| `plugins/loopeng/skills/stack` | Git hygiene: tree of branches from the Branch plan |
| `plugins/loopeng/skills/loop` | Feedback loop for one subtask: build, verify, fix until it passes, commit |
| `plugins/loopeng/skills/sweep` | Final code review, docs update and report |
| `plugins/loopeng/skills/auto` | Older single-skill execution with auto-commit. No other skill calls it |
| `plugins/loopeng/references/run.md` | Run terms and checks shared by the execution skills |
| `plugins/loopeng/skills/commit-message` | Commit message style, called by the execution skills |
| `plugins/loopeng/skills/generate-map` | Docs map in `CLAUDE.md` |
| `plugins/loopeng/skills/generate-summary` | Visual summary from the docs |
| `plugins/loopeng/agents/objectiveness-verifier.md` | Checks each verification prompt is objective |
| `plugins/loopeng/agents/main-verifier.md` | Verifies one subtask or code-review fix round |
| `plugins/loopeng/agents/docs-updater.md` | Updates docs from the spec and the diff |
