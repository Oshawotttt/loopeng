---
name: loopeng-stack
description: Execute an approved spec's Branch plan on local branches, whole or for a subset of its subtasks, with no push or PR.
argument-hint: <path to an approved spec file with a Branch plan from /loopeng:loopeng-orchestrate> [subtask IDs]
disable-model-invocation: true
---

# Loop engineering: branches per spec

Spec file, then any subtask IDs: $ARGUMENTS

This skill owns the git hygiene and the run order. Read these files, relative
to this skill's base directory, and follow them when a step names them:

- `../../references/loopeng-run.md`
- `../loopeng-loop/SKILL.md`
- `../loopeng-sweep/SKILL.md`

A **whole run** has no subtask IDs, or names every subtask. A **subset run**
names fewer. A subset run does not sweep: the user invokes the other subtasks
and the final sweep.

## 1. Prepare

1. Follow **Load the spec** and **Check the repo**.
2. If the spec has no **Branch plan**, stop and tell the user to run
   `/loopeng:loopeng-orchestrate <spec file>`.
3. If the root branch is the default branch, stop and ask.
4. On a subset run, check that nothing is blocked. Every blocker of a named
   subtask must be named too, or be done at the tip of the subtask's branch
   (`git show <branch>:<spec path>`), or of its **Based on** branch if its
   branch doesn't exist. If any is blocked, list it with its blockers and stop.

## 2. Execute each branch, by run order

Track the run's subtasks in the task list. Run them yourself, serially, in this
session.

A whole run takes every branch. A subset run takes the branches holding its
subtasks, plus the root branch if the spec isn't committed on it. For each
branch:

1. Switch to the branch if it exists. Otherwise create it from its **Based on**
   branch. If the **Based on** branch doesn't exist, stop and name it.
2. On the root branch, follow **Commit the spec**.
3. Set the base commit: the spec's **Base commit** on the root branch,
   otherwise `git merge-base HEAD <based on>`.
4. For each of the run's subtasks on this branch, by **Order on branch**, skip
   it if it is done. Otherwise run the loop skill with the spec path, that
   subtask as the scope, and the base commit. Skip its direct-invocation steps.
5. Continue to the next branch without pausing.

If a loop stops, the run stops with it.

## 3. Sweep (whole run only)

A leaf branch is one that no other branch is based on. For each leaf branch, by
run order:

1. Switch to it.
2. Set the scope: the subtasks on the leaf and on the branches it is based on,
   directly or not, that are in no earlier sweep's scope.
3. Set the base commit: the spec's **Base commit** if the scope has a
   subtask on the root branch. Otherwise `git merge-base HEAD <branch>`, where `<branch>`
   is the nearest branch the leaf is based on, directly or not, with no subtask
   in the scope.
4. Run the sweep skill with the spec path, scope and base commit. Skip its
   direct-invocation steps.

If a sweep stops, the run stops with it.

## 4. Finish

**Whole run**: report each branch and its subtasks, by run order, then each
sweep's report.

**Subset run**: report each branch and its subtasks, the commits made, and each
subtask's objectiveness FAILs, main verifier rounds and Decisions made. Then list
the spec's subtasks not yet done. State that no sweep ran. Give the command for
each leaf branch, to run on that branch once its subtasks are done:
`/loopeng:loopeng-sweep <spec file> <IDs on the leaf and the branches it is based on>`.

Remind the user that nothing was pushed.
