---
name: loop
description: Build one subtask of an approved spec on the current branch, fix it until verification passes, then commit it.
argument-hint: <path to an approved spec file> <subtask ID>
disable-model-invocation: true
---

# Loop engineering: subtask feedback loop

Input when typed by a human: $ARGUMENTS

This skill covers exactly one subtask. Its caller owns iteration over subtasks.

A branch skill that reads this file supplies the spec path, the subtask as the
scope, and the base commit. Otherwise, follow **Direct invocation** in
`../../references/run.md`, relative to this skill's base directory. The
subtask ID in the input is the whole scope. If the input names no subtask, stop
and ask which one to run.

Agents used:
- `objectiveness-verifier`: a fresh one checks every verification prompt is
  objective before it is sent on.
- `main-verifier`: a fresh one for each subtask and for each code-review fix
  round. It reads the spec itself.

## 1. Check the subtask

If the subtask is already done, or a blocker in "Dependencies and blockers" is
not done, stop and say so. Otherwise run steps 2-4.

## 2. Build

- Work on this subtask only: code + tests, then step 3, then step 4. Docs are
  updated once, by the sweep.
- Build test-first: call the Skill tool with "mattpocock-skills:tdd". Test only
  at the subtask's seams. Every acceptance criterion needs a test (or command)
  that proves it.
- Run typechecking and single test files often while building. Run the full
  test suite once before verification. Use the spec header's **Commands**.
- Follow the subtask's **Decisions**, and the spec's **Out of scope** and
  **Interfaces** exactly. If one turns out impossible or wrong, stop and flag
  it to the user; don't work around it.
- If a test fails on a shared or environmental resource (`EADDRINUSE`, a
  database lock, a "database already exists" error, a locked temp file), wait
  briefly and rerun. Don't change code to work around it. If it keeps failing,
  stop and flag it to the user.
- Keep a **Decisions made** list: every design decision the spec didn't
  dictate, one line each, the decision and why. Before committing, add each one
  to the subtask's **Doc deltas** in the spec file (or note there why it needs
  no doc). The diff shows what changed, not why, so this is the only record of
  the reason.
- Before verification, tick each acceptance criterion in the spec file that its
  test now proves. Leave unproved ones unticked.
- If the spec changes during implementation, update the spec file, say so, and
  add the change to the doc deltas.

## 3. Verify: objectiveness check, then the main verifier

Every verification prompt goes through two agents, in order:

1. **`objectiveness-verifier`** (`subagent_type: "loopeng:objectiveness-verifier"`,
   a fresh one each time, `run_in_background: false`). Send it the exact prompt
   you intend to give the main verifier. It only judges whether the prompt is
   objective and returns **PASS** or **FAIL**.
   - **FAIL**: rewrite the prompt without the quoted lines and send it to a new
     objectiveness verifier. Nothing goes to the main verifier.
   - **PASS**: send that exact prompt, unchanged, to the main verifier.
2. **`main-verifier`** (`subagent_type: "loopeng:main-verifier"`).
   - Spawn a new one for the subtask's first verification round, and keep its
     agent ID.
   - Re-verification of the same subtask after a FAIL: continue that agent with
     `SendMessage`, so it re-checks its own findings.
   - Spawn a fresh one for each code-review fix round.
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

- Use the same template for re-verification. Never write "again", "round 2",
  what was fixed, or why.
- Code-review fix round: the first line is
  `Verify the uncommitted working-tree changes. Spec: <path>.`, with no Goal
  line. Everything else is the same.
- An environment workaround goes in as the command itself (e.g.
  `python -m jupyter` instead of `jupyter`), never as a note explaining it.
- **Never include your reasoning, justifications, confidence, or "I think this
  is correct."** That includes on re-verification: don't say what was fixed or
  argue against earlier findings. The review has to be objective.

Main verifier verdicts:
- **PASS**: go to step 4.
- **FAIL**: apply the listed fixes, then re-verify (objectiveness check first,
  then that subtask's main verifier via `SendMessage`).
- If you're certain a FAIL finding is not a bug, don't override the verifier.
  Stop and flag it to the user with evidence. Nothing gets committed until it's
  resolved.

Limits, counted separately per subtask:
- **3 objectiveness FAILs**: stop and flag it to the user with the latest
  objectiveness output. Don't send a 4th prompt.
- **3 main-verifier FAILs**: stop and flag it to the user with the main
  verifier's latest output. Don't run a 4th round and don't commit it.

## 4. Commit (only after PASS)

- Stage **only** the files this subtask changed (code, tests) plus the spec
  file (its ticked criteria and doc deltas), by explicit path. Never use
  `git add -A` or `git add .`. Check with `git status` /
  `git diff --cached --stat` that nothing unrelated is staged.
- Write every commit message by calling the Skill tool with
  "loopeng:commit-message".
- Never use `--no-verify` or `--amend`, and never push. If a pre-commit hook
  fails, fix the cause, re-stage and make a new commit. If the fix touches
  code, re-verify first.
- Report the commit hash and message in one line.

## 5. Finish

Read by a branch skill: return to it, keeping the subtask's objectiveness FAIL
count, main verifier rounds and Decisions made for the sweep's report. Typed by
a human: report those, the commit made, the acceptance criteria and the
subtasks left, tell the user that `/loopeng:sweep` has not run, and
remind them that nothing was pushed.
