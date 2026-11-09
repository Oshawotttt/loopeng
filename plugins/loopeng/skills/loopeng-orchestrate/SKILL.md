---
name: loopeng-orchestrate
description: Suggest how to split a spec into a tree of branches, write the Branch plan into the spec, and approve the spec once nothing blocks it.
argument-hint: <path to a spec file from /loopeng:loopeng-plan>
disable-model-invocation: true
---

# Loop engineering: group subtasks into branches

Spec file: $ARGUMENTS

This skill only edits the spec file. It makes no commits and creates no
branches. `/loopeng:loopeng-stack <spec file>` executes the plan it writes.

If no spec file is given, ask which one to use. Read the spec file. If its status
is `**Status:** approved`, change it to `**Status:** draft`.

## 1. Suggest

Use each subtask's **Blocked by** to shape the branches. They form a tree: each
branch is based on one other branch, up to one root branch. The root is a new
branch based on the starting branch, or the starting branch itself unless that
is the default branch. The starting branch is the current branch, unless the
user names another.

If the subtasks would need several roots, make the starting branch the root. If
it is the default branch, chain them, or tell the user to split the spec as its
**Suggested splits** describes.

By default, each subtask gets its own branch. Suggest putting subtasks on one
branch only when a branch's tip wouldn't pass the full test suite without the
other subtask, or a reviewer couldn't judge one without the other. Give the
reason for each grouping.

Every branch must:

- have each subtask's blockers on that branch or on a branch it is based on,
  directly or not
- pass the full test suite at its tip
- be a change a reviewer can judge in one sitting

A prefactor gets its own branch.

Number the branches and subtasks:

- **Run order**: Branches with the same run order must be able to run in parallel worktrees, so they must not share a file in their subtasks' **Files**.
- **Order on branch**: each subtask's position on its branch, after its
  blockers.

## 2. Write the plan

Add this section to the spec, after **Suggested splits**, replacing any existing
one:

```
## Branch plan

Starting branch: `<branch>`

| Run order | Branch | Based on | Subtasks |
|---|---|---|---|
| <n> | `<branch>` | `<branch>` | <IDs, in order on the branch> |
```

List the rows by run order. When the root is the starting branch, its **Based
on** is `none`. Add these two lines to each subtask, after
**Blocked by**:

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

Then stop and give the user the commands to run:

- Everything in sequence: `/loopeng:loopeng-stack <spec file path>`.
- Parallel worktrees: run the root branch first, with
  `/loopeng:loopeng-stack <spec file path> <its subtask IDs>`. If it holds
  no subtasks, set the spec's **Base commit** to `git rev-parse HEAD` on it and
  commit the spec there instead. Once the
  subtasks on its base are done, each later branch gets its own worktree and the
  same command with its subtask IDs:
  `git worktree add -b <branch> <path> <based on>`.
