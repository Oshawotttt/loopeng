---
name: orchestrate
description: Suggest how to split a spec into a chain of branches, write the Branch plan into the spec, and approve the spec once nothing blocks it.
argument-hint: <path to a spec file from /loopeng:plan>
disable-model-invocation: true
---

# Loop engineering: group subtasks into branches

Spec file: $ARGUMENTS

This skill only edits the spec file. It makes no commits and creates no
branches. `/loopeng:stack <spec file>` executes the plan it writes.

If no spec file is given, ask which one to use. Read the spec file. If its status
is `**Status:** approved`, change it to `**Status:** draft`.

## 1. Suggest

The branches form a chain: each branch is based on the one before it. The first
branch is a new branch based on the starting branch, or the starting branch
itself unless that is the default branch. The starting branch is the current
branch, unless the user names another.

Order the subtasks so each one comes after its **Blocked by**, then cut that
order into branches. By default, each subtask gets its own branch. Suggest
putting subtasks on one branch only when a branch's tip wouldn't pass the full
test suite without the other subtask, or a reviewer couldn't judge one without
the other. Give the reason for each grouping.

Every branch must:

- pass the full test suite at its tip
- be a change a reviewer can judge in one sitting

A prefactor gets its own branch.

Branches never run in parallel. If the user wants independent groups of
subtasks on parallel branches, tell them to use subset runs instead and stop:
`/loopeng:stack <spec> <trunk IDs> --sweep` on a feature branch, then
`/loopeng:stack <spec> <group IDs> --sweep` in its own worktree per group,
branched from the trunk.

## 2. Write the plan

Add this section to the spec, after **Dependencies and blockers**, replacing any
existing one:

```
## Branch plan

Starting branch: `<branch>`

| Order | Branch | Based on | Subtasks |
|---|---|---|---|
| <n> | `<branch>` | `<branch>` | <IDs, in order on the branch> |
```

List the rows in chain order. Each branch's **Based on** is the branch in the
row before it. The first branch's **Based on** is the starting branch, or `none`
when the first branch is the starting branch. Add these two lines to each
subtask, after **Blocked by**:

```
- **Branch**: `<branch>`
- **Order on branch**: <n>
```

## 3. Present and wait

- Keep it a conversation. The user reads the spec in their own time, so don't
  repeat what's in it or what you've already asked.
- The spec can't be approved while anything blocks it: an `OPEN Qn` or `ASSUMED`
  marker, an **Open questions** entry, or an open external blocker under
  **Dependencies and blockers**. Discuss these with the user and write each
  decision into the spec. If a blocker can't be cleared now, list it and stop,
  leaving the spec as a draft.
- Once nothing blocks it, tell the user.
- Wait for approval. Questions, pushback or change requests are not approval:
  discuss them, revise the spec file, and say what changed.
- On explicit approval, set `**Status:** approved`.

Then stop and give the user the command to run: `/loopeng:stack <spec file path>`.
