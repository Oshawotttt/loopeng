---
name: loopeng-auto
description: Loop-engineering execution with auto-commit — takes an approved spec file from /loopeng-plan, then each subtask is built test-first, independently verified (objectiveness check, then a fresh main verifier per subtask that reads the spec itself) and committed without pausing, then a final code review of the whole task, then one docs-updater agent updates the docs from the spec and the diff so the spec can be deleted without losing anything. Run only when the user invokes /loopeng-auto.
argument-hint: <path to an approved spec file from /loopeng-plan>
disable-model-invocation: true
---

# Loop engineering: execute (auto-commit)

Spec file: $ARGUMENTS

## 0. Load the spec

- If no spec file is given, list the spec files in the repo's
  `docs/specs/` and ask which one to run. Don't plan here: if the user
  has no spec, tell them to run `/loopeng-plan <task>` first.
- Read the spec file. If its status is not `**Status:** approved`, stop
  and tell the user to approve it through `/loopeng-plan`.
- The spec is the source of truth. Its header names the repo and any md
  file to update. **The docs** are the repo's own context files
  (`README.md`, `CLAUDE.md`/`AGENTS.md`, `docs/*.md`, `docs/adr/`).

Invoking this skill is the user's explicit permission to create the
spec's feature branch and to commit, but only as described in steps 1, 4
and 6: no pushing, no other git writes.

Three agents and one skill are used:
- `objectiveness-verifier`: a fresh one checks every verification prompt
  is objective before it is sent on.
- `main-verifier`: a fresh one for each subtask and for each code-review
  fix round. It reads the spec itself.
- `mattpocock-skills:code-review`: reviews the whole task at the end.
- `docs-updater`: one, after the code review, updates the docs from the
  spec and the diff.

## 1. Set up

- Check `git status` and the current branch. If uncommitted changes exist
  that the spec doesn't list (other than the spec file), stop and ask.
- If any external blocker in the spec is still open, stop and ask.
- If the spec names a feature branch, create it and switch to it.
- Commit the spec file alone, by explicit path, with
  `docs(specs): add <task title in lowercase> spec`.
- Record the **base commit**: `git rev-parse HEAD` after the spec commit.
  The final review and the docs update diff against it.

## 2. Execute: one subtask at a time

- Track the subtasks in the task list. Run them in the order from
  "Dependencies and blockers". Never start a subtask before every subtask
  it is blocked by is committed.
- Work on one at a time: code + tests, then verification (step 3), then
  commit (step 4), then continue to the next subtask without pausing.
  Don't edit docs here: step 6 does that for the whole task.
- Run the subtasks yourself, serially. Don't hand them to subagents.
- Build test-first: call the Skill tool with "mattpocock-skills:tdd" for
  each subtask. Test only at the subtask's seams. Every acceptance
  criterion needs a test (or command) that proves it.
- Run typechecking and single test files often while building. Run the
  full test suite once before sending the subtask to verification. Use
  the spec header's **Commands**.
- Follow each subtask's **Decisions**, and the spec's **Out of scope** and
  **Interfaces** exactly. If one turns out impossible or wrong, stop and
  flag it to the user; don't work around it.
- If a test fails on a shared or environmental resource (`EADDRINUSE`, a
  database lock, a "database already exists" error, a locked temp file),
  wait briefly and rerun. Don't change code to work around it. If it keeps
  failing, stop and flag it to the user.
- Keep a **Decisions made** list per subtask: every design decision the
  spec didn't dictate, one line each, the decision and why. Before
  committing, add each one to the subtask's **Doc deltas** in the spec
  file (or note there why it needs no doc). The diff shows what changed,
  not why, so this is the only record of the reason.
- Before verification, tick each acceptance criterion in the spec file
  that its test now proves. Leave unproved ones unticked.
- If the spec changes during implementation, update the spec file, say
  so, and add the change to the doc deltas.

## 3. Verify: objectiveness check, then the main verifier

Every verification prompt goes through two agents, in order:

1. **`objectiveness-verifier`** (`subagent_type: "objectiveness-verifier"`,
   a fresh one each time, `run_in_background: false`). Send it the exact
   prompt you intend to give the main verifier. It only judges whether
   the prompt is objective and returns **PASS** or **FAIL**.
   - **FAIL**: rewrite the prompt without the quoted lines and send it to
     a new objectiveness verifier. Nothing goes to the main verifier.
   - **PASS**: send that exact prompt, unchanged, to the main verifier.
2. **`main-verifier`** (`subagent_type: "main-verifier"`).
   - Spawn a new one for the first verification round of each subtask,
     and keep its agent ID.
   - Re-verification of the same subtask after a FAIL: continue that
     agent with `SendMessage`, so it re-checks its own findings.
   - Spawn a fresh one for the next subtask and for each code-review fix
     round (step 5).
   - Pass no summary of earlier subtasks.

Every verification prompt uses this template. Fill in the blanks and add
nothing else:

```
Verify subtask <ID> — <title exactly as in spec>. Spec: `<spec path>`.

Repo: `<repo path>` (branch `<branch>`; base commit `<sha>`; HEAD `<sha>`; changes are uncommitted in the working tree).

Goal: <goal verbatim>

Files changed: <paths, each with (new) or (edited)>

Commands:
- <each command from the spec header, verbatim>

Relevant docs: <paths>

Return a verdict.
```

- Use the same template for re-verification. Never write "again",
  "round 2", what was fixed, or why.
- Code-review fix round: the first line is
  `Verify the uncommitted working-tree changes. Spec: <path>.`, with no
  Goal line. Everything else is the same.
- An environment workaround goes in as the command itself (e.g.
  `python -m jupyter` instead of `jupyter`), never as a note explaining
  it.
- **Never include your reasoning, justifications, confidence, or "I think
  this is correct."** That includes on re-verification: don't say what
  was fixed or argue against earlier findings. The review has to be
  objective.

Main verifier verdicts:
- **PASS**: go to step 4.
- **FAIL**: apply the listed fixes, then re-verify (objectiveness check
  first, then that subtask's main verifier via `SendMessage`).
- If you're certain a FAIL finding is not a bug, don't override the
  verifier. Stop and flag it to the user with evidence. Nothing gets
  committed until it's resolved.

Limits, counted separately per subtask:
- **3 objectiveness FAILs**: stop and flag it to the user with the latest
  objectiveness output. Don't send a 4th prompt.
- **3 main-verifier FAILs**: stop and flag it to the user with the main
  verifier's latest output. Don't run a 4th round and don't commit it.

## 4. Commit (only after PASS)

- Stage **only** the files this subtask changed (code, tests) plus the
  spec file (its ticked criteria and doc deltas), by explicit path. Never
  use `git add -A` or `git add .`. Check with `git status` /
  `git diff --cached --stat` that nothing unrelated is staged.
- Write every commit message by calling the Skill tool with
  "commit-message".
- Never use `--no-verify` or `--amend`, and never push. If a pre-commit
  hook fails, fix the cause, re-stage and make a new commit. If the fix
  touches code, re-verify first.
- Report the commit hash and message in one line, then move on to the
  next subtask.

## 5. Final verification: code review (after the last subtask)

Once every subtask is committed, review the whole task with the Skill tool:
`mattpocock-skills:code-review`. Give it the **base commit** from step 1 as
the fixed point and the **spec file** as the spec. Wait until both its
Standards and Spec reviews have reported before acting.

Act on the findings:
- **Spec findings** (missing, partial or wrong against the spec): every
  real defect must be fixed.
- **Standards findings**: judgement cues, not rules. Fix each one you agree
  improves the code without changing behaviour. List the rest, with a
  one-line reason each, for the report.
- If you're certain a Spec finding is not a bug, don't drop it. Stop and
  flag it to the user with evidence.

Fixes go through the normal loop: verify them (step 3, a fresh main
verifier, objectiveness check first) and commit (step 4) as new commits.
A fix that makes a design decision the spec didn't dictate adds it to the
spec's doc deltas, as in step 2. Their messages weren't in the approved
spec, so show them in the report.

Run the code review again from the top of this step, still against the
base commit, only if the round just finished had at least one Spec
defect. If it had only Standards findings (fixed or listed), go to
step 6.

Limit: **3 code-review rounds with Spec defects**. After the 3rd, stop and
flag it to the user with the latest review output. Don't run a 4th round.

## 6. Update docs (after the code review)

The spec may be deleted after the run, so everything in it that should
outlast the run must end up in the docs, code or tests.

- Spawn one `docs-updater` (`subagent_type: "docs-updater"`,
  `run_in_background: false`). The prompt contains only: the repo path,
  the spec file path, the base commit, the doc paths, and the md file to
  update if the spec names one. It edits the docs and returns a coverage
  table. It makes no commits.
- Don't edit the docs yourself. Check `git status`: it must show only doc
  files changed. Anything else, stop and flag it to the user.
- Commit the changed doc files (step 4 rules) in one commit. If nothing
  changed, make no commit.
- Items the table lists as not placed go in the report, with its reason.

## 7. Report

- Give a summary: the spec file path, the commits made (hash + message,
  marking any not in the approved spec), per subtask the objectiveness
  FAILs and main-verifier rounds, how many code-review rounds ran and why
  the last one was the last, and the Standards findings not fixed (with
  reasons).
- **Docs**: the docs-updater's coverage table, and any items it couldn't
  place, with its reasons.
- **Acceptance criteria**: each one, grouped by subtask, marked `met` or
  `not met`, with the test or command that proves it.
- **Decisions made**: every entry, grouped by subtask, and where it was
  recorded (from the coverage table).
- **Human checks**: end the report with the full checklist from the spec,
  ready for the user to run, with steps and expected results.
- Remind the user that nothing was pushed.
