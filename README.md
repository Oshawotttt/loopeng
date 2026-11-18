# loopeng

Spec-driven development plugin inspired by loop engineering, aimed at increasing codebase understanding and preventing cognitive surrender.

## Install

Install this plugin:

```
claude plugin marketplace add Oshawotttt/loopeng; claude plugin install loopeng@loopeng
```

## Workflow

loopeng is built on established practice: spec-driven development and widely used principles for working with AI. Each task starts with a spec, which gives you a high-level understanding of the change and clear acceptance criteria. The code is then built test-first, with the [TDD skill from Matt Pocock](https://github.com/mattpocock/skills).

### The problem

Oftentimes, existing AI workflows treat slowness as the enemy. However, I believe understanding is an inherently slow process, and that the real enemy is cognitive surrender.

Many plugins bombard you with questions one after another, and you end up just saying "yes, yes, yes ...". Because of this, usually, all you remember is a string of questions and your answers. You never really have time to sit down and draw the connections between those decisions, so you never really understand your current spec or design. Over time this builds up, until you no longer understand your codebase well enough to extend it.

So each part of the workflow below aims to maximise your understanding of the codebase, and your reviewers'.

### Planning

In this plugin, you build the spec iteratively, so you understand it.

`/loopeng:plan <task>` writes the whole spec first, as fast as it can. You see the architecture straight away and can question it immediately. The draft grounds your understanding. You are not asked questions about an idea that may not yet be solid enough to answer anything.

You control the pace. Answer or question whichever sections you want, in any order. This stops you from half-heartedly saying yes or no to whatever Claude puts in front of you.

Optional: `/loopeng:orchestrate <spec file>` splits the spec's Branch plan into a chain of local branches, each based on the one before. It suggests a grouping, and you approve it. 

### Execution

Execution is kept simple on purpose. The less unnecessary mental load a review takes, the more likely you are to actually do it.

If it's simple, you can follow along with the AI as it works, or trace the commit history afterwards.

Any complicated parts of the execution flow, such as which subagents to use or how branches are split, are added or approved by you in the spec. So, you won't have to work out what your AI did and how it did it at the same time.

Parallel worktrees are not a priority. A task big enough to need them is too big for one session, and the context window would approach the [dumb zone](#context-meter). Split it into one spec per part and run each in its own session.

`/loopeng:execute <spec file>` runs the spec. For each subtask it builds test-first with the `tdd` skill, verifies the work and commits. Then it reviews the whole change and updates the docs. It does not push.

To step through a run by hand on a feature branch, use its parts directly:

- `/loopeng:verification-loop <spec file> <subtask ID>`: the feedback loop for one subtask. Run it once per subtask, in dependency order.
- `/loopeng:sweep <spec file>`: the final code review, docs update and report.

Only you or `/loopeng:execute` can run these. Claude can't start them on its own.

### AI writing

Commit and PR messages are as short as possible.

Many people are scarred by AI slop. When they see a wall of text, they assume AI wrote it and stop reading. AI writing can be good (for example, [Matt Pocock's PR skill](https://github.com/mattpocock/skills)). But readers who expect slop skip it even when it is good. Short messages let people see what changed by scanning.

- `commit-message`: the commit message style. The execution skills call it.
- Optional: `/loopeng:pr-commands <spec file>` writes the `git push` and `gh pr create` commands for each branch into the spec, as stacked PRs. It runs nothing.

### Other skills

- `/loopeng:generate-map`: adds a docs map to the repo's `CLAUDE.md`. Run it once, before your first plan.
- `/loopeng:generate-summary`: builds or updates `docs/summary.html`, a visual summary of the codebase for people. It needs `docs/ARCHITECTURE.md` and stops if the file is missing. It also needs the `diagram-design` plugin. See [Dependencies](#dependencies).

## Context Meter

The plugin includes a meter to show how many tokens fill the current context window. It helps you keep track of the context window and avoid context bloat.

It is based on the idea of the "dumb zone": as the context window fills, the model's output gets worse. The meter changes colour as you approach that zone, to signal that you may need a fresh window:

| Tokens in context | Colour | Meaning |
|---|---|---|
| Under 150k | Green | Fine |
| 150k to 400k | Orange | Approaching the dumb zone. Consider wrapping up or starting fresh |
| 400k and over | Red | In the dumb zone. Start a fresh window |

It is on by default. To turn it off, use either way:

- Run `/config` and set **Context meter** to off.
- Or add `pluginConfigs` to your user settings, `~/.claude/settings.json`:

  ```json
  {
    "pluginConfigs": {
      "loopeng": { "contextMeter": false }
    }
  }
  ```

  If the file already has content, add only the `pluginConfigs` key next to the keys already there.

## Credits

The `tdd` skill and the `spec-reviewer` and `standards-reviewer` agents are adapted from [mattpocock/skills](https://github.com/mattpocock/skills) (MIT, see `plugins/loopeng/LICENSE-mattpocock`).

## Dependencies

`diagram-design` is needed only for `/loopeng:generate-summary`. It is not included. Install it with:

```
claude plugin marketplace add cathrynlavery/diagram-design; claude plugin install diagram-design@diagram-design
```
