---
name: sweep
description: Run the final code review, docs update and report for an approved spec's committed subtasks.
argument-hint: <path to an approved spec file>
disable-model-invocation: true
---

# Loop engineering: final sweep

Input when typed by a human: $ARGUMENTS

A branch skill that reads this file supplies the spec path, scope and base
commit. Otherwise, follow **Direct invocation** in
`../../references/run.md`, relative to this skill's base directory.

If a subtask in scope is not done, stop and list it.

## 1. Code review

Review the scope's work with the Skill tool: `mattpocock-skills:code-review`.
Give it the **base commit** as the fixed point, the **spec file** as the spec,
and the scope's subtask IDs as the only part of the spec to check. Wait until
both its Standards and Spec reviews have reported before acting.

Act on the findings:
- **Spec findings** (missing, partial or wrong against the spec): every real
  defect must be fixed.
- **Standards findings**: judgement cues, not rules. Fix each one you agree
  improves the code without changing behaviour. List the rest, with a one-line
  reason each, for the report.
- If you're certain a Spec finding is not a bug, don't drop it. Stop and flag it
  to the user with evidence.

Fixes go through the normal loop: follow the Verify and Commit steps in
`../loop/SKILL.md` (a fresh main verifier, objectiveness check
first), as new commits. A fix that makes a design decision the spec didn't
dictate adds it to the spec's doc deltas. Their messages weren't in the approved
spec, so show them in the report.

Run the code review again from the top of this step, still against the base
commit, only if the round just finished had at least one Spec defect. If it had
only Standards findings (fixed or listed), go to step 2.

Limit: **3 code-review rounds with Spec defects**. After the 3rd, stop and flag
it to the user with the latest review output. Don't run a 4th round.

## 2. Update docs

The spec may be deleted after the run, so everything in it that should outlast
the run must end up in the docs, code or tests.

- Spawn one `docs-updater` (`subagent_type: "loopeng:docs-updater"`,
  `run_in_background: false`). The prompt contains only: the repo path, the spec
  file path, the base commit, the doc paths, the md file to update if the spec
  names one, and the scope's subtask IDs if the scope is not the whole spec. It
  edits the docs and returns a coverage table. It makes no commits.
- Leave the docs to the agent. Check `git status`: it must show only doc files
  changed. Anything else, stop and flag it to the user.
- Commit the changed doc files (Commit step rules) in one commit. If nothing
  changed, make no commit.
- Items the table lists as not placed go in the report, with its reason.

## 3. Report

Limit the report to the scope. Mark any count this session didn't observe as
`not recorded`.

- Give a summary: the spec file path, the commits made (hash + message, marking
  any not in the approved spec), per subtask the objectiveness FAILs and
  main-verifier rounds, how many code-review rounds ran and why the last one was
  the last, and the Standards findings not fixed (with reasons).
- **Docs**: the docs-updater's coverage table, and any items it couldn't place,
  with its reasons.
- **Acceptance criteria**: each one, grouped by subtask, marked `met` or `not
  met`, with the test or command that proves it.
- **Decisions made**: every entry, grouped by subtask, and where it was recorded
  (from the coverage table).
- **Human checks**: end the report with the full checklist from the spec, ready
  for the user to run, with steps and expected results.

Read by a branch skill: return to it. Typed by a human: remind them that nothing
was pushed.
