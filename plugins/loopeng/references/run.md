# Loop engineering: run context

Shared by the loopeng execution skills. Skills name the sections they need.

## Terms

- **The spec**: the approved spec file from `/loopeng:plan`, and
  the source of truth for the run. Its header names the repo and any md file
  to update.
- **The docs**: the repo's own context files (`README.md`,
  `CLAUDE.md`/`AGENTS.md`, `docs/*.md`, `docs/adr/`).
- **Scope**: the subtask IDs this run covers. All of the spec's subtasks,
  unless the calling skill names fewer. Everything the run checks, builds,
  reviews, documents and reports is limited to its scope.
- **Done**: a subtask whose acceptance criteria are all ticked in the
  committed spec (`git show HEAD:<spec path>`).
- **Base commit**: the commit the calling skill names. Otherwise, the
  **Base commit** in the spec header.

## Load the spec

- If no spec file is given, ask which one to run.
- Read the spec file. If its status is not `**Status:** approved`, stop and
  tell the user.

## Check the repo

- Check `git status` and the current branch. If uncommitted changes exist
  that the spec doesn't list (other than the spec file), stop and ask.
- If any external blocker in the spec is still open, stop and ask.

## Commit the spec

If the spec is not yet committed on the current branch, set **Base commit** in
its header to `git rev-parse HEAD`. Then commit the spec file alone, by explicit
path, with `docs(specs): add <task title in lowercase> spec`.

If the spec is committed with no **Base commit**, stop and ask.

## Direct invocation

The loop and sweep skills run this way when a human types them
instead of `stack` reading them:

1. Load the spec, then check the repo.
2. Work on the current branch. If it is the default branch, stop and tell the
   user to switch.
3. Commit the spec.

Scope is the spec's subtasks unless the skill's input names fewer. The base
commit is the spec's **Base commit**.

## Git limits

Invoking a loopeng execution skill is the user's explicit permission for the
commits its steps describe. `stack` also grants the branch writes it
describes. Every other git write, including any push, needs a separate request.
