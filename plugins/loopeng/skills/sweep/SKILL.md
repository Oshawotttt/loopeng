---
name: sweep
description: Run the final code review, docs update and report for an approved spec's committed subtasks.
argument-hint: <path to an approved spec file> [subtask IDs]
disable-model-invocation: true
---

# Loop engineering: final sweep

Input when typed by a human: $ARGUMENTS

When `execute` reads this file, it supplies the spec path, scope and base
commit. Otherwise, follow **Direct invocation** in
`../../references/run.md`, relative to this skill's base directory.

The sweep runs in a `sweep-orchestrator` agent with a fresh context. This
skill only checks the scope, starts the agent and relays its result.

## 1. Check the scope

If a subtask in scope is not done, stop and list it.

## 2. Run the sweep orchestrator

Spawn one `sweep-orchestrator` (`subagent_type: "loopeng:sweep-orchestrator"`,
`run_in_background: false`). Use this prompt. Fill in the blanks and add
nothing else: no summary of the run, no reasoning, no notes on the code.

```
Sweep. Spec: `<spec path>`.

Repo: `<repo path>` (branch `<branch>`).
Scope: <subtask IDs>
Base commit: `<sha>`
Plugin dir: `<absolute path of ../.. from this skill's base directory>`
```

## 3. Relay the result

- **STATUS: DONE**: run `git status`. If the working tree isn't clean, stop
  and flag it to the user. Otherwise pass the report on: to `execute`, which
  continues with its next step, or to the user if they typed this skill.
- **STATUS: FLAGGED**: stop. Show the user the agent's output verbatim. If
  `execute` is running, the run stops too, and no sweep is recorded in the
  spec. Running the sweep again after the user resolves the flag starts it
  from the top.
