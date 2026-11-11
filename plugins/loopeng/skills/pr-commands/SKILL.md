---
name: pr-commands
description: Write the git push and gh pr create commands for a spec's Branch plan into the spec, one stacked PR per branch. Runs nothing.
argument-hint: <path to a spec file>
disable-model-invocation: true
---

# Loop engineering: PR commands

Spec file: $ARGUMENTS

This skill only edits the spec file. It doesn't push, run `gh`, commit or
switch branches. The user runs the commands it writes.

## 1. Check

- If no spec file is given, ask which one to use. Read it.
- If it has no **Branch plan**, stop and say so.
- For each branch in the Branch plan: it must exist locally, and each of its
  subtasks must be done (acceptance criteria ticked in
  `git show <branch>:<spec path>`). Otherwise stop and list what's missing.

## 2. Build each PR

One PR per branch, in Branch plan order.

- **Base**: the branch's **Based on**. If that is `none`, the repo's default
  branch (`gh repo view --json defaultBranchRef -q .defaultBranchRef.name`,
  or `main`/`master` from `git branch -r` if `gh` isn't available).
- **Title**: call the Skill tool with "loopeng:commit-message" for the
  branch's whole change (`git diff <base>...<branch>`), and use only its
  subject line.
- **Body**: if the branch is based on another branch in the plan, start with
  `Read/merge <base branch> first.` Then 1-2 lines on what the branch does and
  why, from the spec's subtasks on this branch.

## 3. Write to the spec

Add a `## PR commands` section at the end of the spec, replacing any existing
one. Start it with: "Run in order, in Git Bash, from the repo root. Each PR
targets the branch before it, so merge them in this order." (drop the second
sentence if there is only one branch).

Then one `bash` block per branch, in Branch plan order:

```bash
git push -u origin <branch>
gh pr create --base <base> --head <branch> --title "<title>" --body "<body>"
```

Escape any `"`, `` ` `` or `$` in the title and body.

Then stop and give the user the spec path. Don't commit it.
