---
name: branch
description: Execute an approved spec on one feature branch, with no push or PR.
argument-hint: <path to an approved spec file from /loopeng:plan>
disable-model-invocation: true
---

# Loop engineering: one branch per spec

Spec file: $ARGUMENTS

This skill owns the git hygiene and the run order. Read these files, relative
to this skill's base directory, and follow them when a step names them:

- `../../references/run.md`
- `../loop/SKILL.md`
- `../sweep/SKILL.md`

## 1. Prepare

1. Follow **Load the spec** and **Check the repo**.
2. Switch to the branch the spec names, creating it if needed.
3. Follow **Commit the spec**.

The base commit is the spec's **Base commit**. Scope is every subtask.

## 2. Execute

1. Track the subtasks in the task list, in the order from "Dependencies and
   blockers". Mark done subtasks complete.
2. For each subtask that isn't done, run the loop skill with the spec path,
   that subtask as the scope, and the base commit. Skip its direct-invocation
   steps. Continue to the next subtask without pausing. Run the subtasks
   yourself, serially, in this session.
3. Run the sweep skill with the spec path, scope and base commit. Skip its
   direct-invocation steps.

If a loop stops, the run stops with it.

## 3. Finish

End the sweep's report with the branch name and a reminder that nothing was
pushed.
