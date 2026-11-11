---
name: execute
description: Execute an approved spec's Branch plan as a chain of local branches, or a named subset of its subtasks on the current branch, with no push or PR.
argument-hint: <path to an approved spec file> [subtask IDs] [--sweep]
disable-model-invocation: true
---

# Loop engineering: run a spec

Input: $ARGUMENTS

This skill owns the git hygiene and the run order. Read these files, relative
to this skill's base directory, and follow them when a step names them:

- `../../references/run.md`
- `../verification-loop/SKILL.md`
- `../sweep/SKILL.md`

## 1. Prepare

1. Follow **Load the spec** and **Check the repo**.
2. Set the scope:
   - **Full run** (no subtask IDs given): scope is every subtask. If the spec
     has no **Branch plan**, stop and tell the user to run
     `/loopeng:orchestrate <spec file>`. If the first branch in the Branch
     plan is the default branch, stop and ask.
   - **Subset run** (subtask IDs given): scope is those IDs. If an ID isn't
     in the spec, stop and say so. The run ignores the Branch plan and works
     on the current branch. If that is the default branch, stop and tell the
     user to switch.
3. Sweep: a full run always sweeps. A subset run sweeps only with `--sweep`.

## 2. Execute

Track the subtasks in scope in the task list, in run order. Mark done subtasks
complete. Run them yourself, serially, in this session.

A **Sweeps** entry counts only if its **end** commit is an ancestor of `HEAD`
(entries from sibling branches don't).

**Run base**: the **end** commit of the latest counting **Sweeps** entry. If
there is none, the spec's **Base commit**.

### Full run

For each branch in the Branch plan, in order:

1. Switch to the branch if it exists. Otherwise create it from its **Based on**
   branch.
2. On the first branch, follow **Commit the spec**.
3. Set the base commit: the run base on the first branch, otherwise
   `git merge-base HEAD <based on>`.
4. For each subtask on this branch, by **Order on branch**, skip it if it is
   done. Otherwise run the verification-loop skill with the spec path, that subtask as the
   scope, and the base commit. Skip its direct-invocation steps.
5. Continue to the next branch without pausing.

### Subset run

1. Follow **Commit the spec**.
2. For each subtask in scope, in the spec's run order, skip it if it is done.
   Otherwise run the verification-loop skill with the spec path, that subtask as the scope,
   and the run base. Skip its direct-invocation steps.

If a verification loop stops, the run stops with it.

## 3. Sweep

Skip this step if step 1 said not to sweep.

Sweep scope: the subtasks in scope that are not listed in a counting **Sweeps**
entry. If none are left, skip the sweep and say so.

On the current branch (the last branch on a full run), run the sweep skill with
the spec path, the sweep scope and the run base. Skip its direct-invocation
steps.

On a subset run, then record the sweep in the spec. Add a `## Sweeps` section
at the end of the spec if there is none, and append:

```
- <sweep scope IDs> on `<branch>`: base `<run base>`, end `<HEAD sha>`
```

Commit the spec file alone, by explicit path, with
`docs(specs): record sweep of <sweep scope IDs>`. The next run that branches
from here uses that end commit as its run base.

## 4. Finish

Report each branch and its subtasks, in order, then the sweep's report (or that
no sweep ran). End with the last branch's name.
