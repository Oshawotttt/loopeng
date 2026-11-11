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

Fixes reuse step 3 and **Commit rules** of `../verification-loop/SKILL.md`,
treating each fix round like a subtask:
- Note `HEAD` as the fix round start. Commit fixes as you go.
- Verify with a fresh main verifier per fix round. In the prompt template, the
  first line is `Verify the code-review fixes. Spec: <path>.`, there is no Goal
  line, and the changes are `<fix round start>..HEAD` plus the working tree.
- Its limits count per fix round.
- A fix that makes a design decision the spec didn't dictate adds it to the
  spec's doc deltas; commit the spec after PASS.

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
  file path, the base commit, the md file to update if the spec
  names one, and the scope's subtask IDs if the scope is not the whole spec. It
  edits the docs and returns a coverage table. It makes no commits.
- Leave the docs to the agent. Check `git status`: it must show only doc files
  changed. Anything else, stop and flag it to the user.
- If the table's **Files changed** lists a `(new)` file, follow
  `../generate-map/SKILL.md`, relative to this skill's base directory, steps
  1-4, to add it to the docs map in `CLAUDE.md`.
- Commit the changed doc files (**Commit rules** in `../verification-loop/SKILL.md`) in one commit. If nothing
  changed, make no commit.
- Items the table lists as not placed go in the report, with its reason.

## 3. Report

The user assumes everything in the spec as approved (`git show <commit that
added the spec>:<spec path>`) is done. Report only where the run differs from
it: what was added or changed, and what was left undone. Never repeat what the
approved spec already says. Limit the report to the scope.

- **Not in the approved spec**: find it with `git diff <commit that added the
  spec>..HEAD -- <spec path>`, ignoring ticked checkboxes and **Sweeps**
  entries. Grouped by subtask:
  - **New decisions**: each design decision the spec didn't dictate, why it
    was made, and where it was recorded (from the coverage table).
  - **Spec changes**: each edit to the approved text (e.g. **Files**,
    **Seams**, acceptance criteria), before and after.
  - **Standards fixes**: each change made for a Standards finding, with
    its commit hash.
  Write "none" if there is nothing.
- **Left undone**: anything in the approved spec that isn't done, such as a
  doc delta the docs-updater couldn't place, plus Standards findings not
  fixed. Each with its reason. Omit if empty.
