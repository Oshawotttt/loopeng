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
3. Optional: `/loopeng:orchestrate <spec file>`: split the spec's Branch plan into a chain of local branches, each based on the one before. It suggests a grouping, and you approve it. By default the plan is one branch. For parallel branches, split the spec instead: one spec per branch.
4. `/loopeng:execute <spec file>`: run the Branch plan. It builds, verifies and commits each subtask, reviews the work, then updates the docs. No push.
5. `/loopeng:generate-summary`: build or update `docs/summary.html`, a visual summary for people. It needs `docs/ARCHITECTURE.md`, and stops if it is missing.

To step through a run by hand on a feature branch, use the parts directly:

- `/loopeng:verification-loop <spec file> <subtask ID>`: the feedback loop for one subtask. Run it once per subtask, in dependency order.
- `/loopeng:sweep <spec file>`: the code review, docs update and report.

Only a person or `/loopeng:execute` runs these. They set `disable-model-invocation`, so Claude can't fire them on its own, and `execute` reads their files directly.

## Contents

| Item | Role |
|---|---|
| `plugins/loopeng/skills/plan` | Discovery and approved spec |
| `plugins/loopeng/skills/orchestrate` | Spec phase: splits the Branch plan into a chain of branches, with your approval |
| `plugins/loopeng/skills/execute` | Runs the Branch plan: one branch or a chain, no push |
| `plugins/loopeng/skills/verification-loop` | Feedback loop for one subtask: build, verify, fix until it passes, commit |
| `plugins/loopeng/skills/sweep` | Final code review, docs update and report |
| `plugins/loopeng/references/run.md` | Run terms and checks shared by the execution skills |
| `plugins/loopeng/skills/commit-message` | Commit message style, called by the execution skills |
| `plugins/loopeng/skills/generate-map` | Docs map in `CLAUDE.md` |
| `plugins/loopeng/skills/generate-summary` | Visual summary from the docs |
| `plugins/loopeng/agents/objectiveness-verifier.md` | Checks each verification prompt is objective |
| `plugins/loopeng/agents/main-verifier.md` | Verifies one subtask or code-review fix round |
| `plugins/loopeng/agents/docs-updater.md` | Updates docs from the spec and the diff |
