---
name: verification-loop
description: Build one subtask of an approved spec on the current branch with atomic commits, fix it until verification passes, then mark it done.
argument-hint: <path to an approved spec file> <subtask ID>
disable-model-invocation: true
---

# Loop engineering: subtask feedback loop

Input when typed by a human: $ARGUMENTS

This skill covers exactly one subtask. Its caller owns iteration over subtasks.

When `execute` reads this file, it supplies the spec path, the subtask as the
scope, and the base commit. Otherwise, follow **Direct invocation** in
`../../references/run.md`, relative to this skill's base directory. The
subtask ID in the input is the whole scope. If the input names no subtask, stop
and ask which one to run.

Agents used:
- `objectiveness-verifier`: a fresh one checks every verification prompt is
  objective before it is sent on.
- `main-verifier`: one per run, shared by every subtask in it. It reads the
  spec itself.

## 1. Check the subtask

If the subtask is already done, or a blocker in "Dependencies and blockers" is
not done, stop and say so. Otherwise run steps 2-4.

## 2. Build

- Work on this subtask only: code + tests, then step 3, then step 4. Docs are
  updated once, by the sweep.
- Note `HEAD` before you start: the **subtask start**.
- Commit as you go, following **Commit rules**: each time a logical change is
  done and the tests pass, commit it. Keep the spec file out of these commits.
- Build test-first: call the Skill tool with "mattpocock-skills:tdd". Test only
  at the subtask's seams. Every acceptance criterion needs a test (or command)
  that proves it.
- Run typechecking and single test files often while building. Run the full
  test suite once before verification. Use the spec header's **Commands**.
- Follow the subtask's **Decisions**, and the spec's **Out of scope** and
  **Interfaces** exactly. If one turns out impossible or wrong, stop and flag
  it to the user; don't work around it.
- You may update the spec file when the work shows it needs to change (e.g. its
  **Files** or **Seams**), as long as every Decision, Interface, Out of scope
  item and acceptance criterion still holds. Say what changed and add it to the
  doc deltas.
- If a test fails on a shared or environmental resource (`EADDRINUSE`, a
  database lock, a "database already exists" error, a locked temp file), wait
  briefly and rerun. Don't change code to work around it. If it keeps failing,
  stop and flag it to the user.
- Before verification, add every design decision the spec didn't dictate to
  the subtask's **Doc deltas** in the spec file, one line each with why (or
  note there why it needs no doc). The diff shows what changed, not why, so
  this is the only record of the reason, and the sweep's report reads it.
- Before verification, tick each acceptance criterion in the spec file that its
  test now proves. Every criterion must be ticked before verification. If one
  can't be proved by a test or command, stop and flag it to the user.

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
   - If the caller supplied a main verifier agent ID, continue that agent with
     `SendMessage` for every round, including this subtask's first.
   - Otherwise spawn a new one for the first round and keep its agent ID. Use
     `SendMessage` to that agent for every later round.
   - Re-verification after a FAIL goes to the same agent, so it re-checks its
     own findings.
   - Pass no summary of earlier subtasks.

Every verification prompt uses this template. Fill in the blanks and add
nothing else:

```
Verify subtask <ID> — <title exactly as in spec>. Spec: `<spec path>`.

Repo: `<repo path>` (branch `<branch>`; base commit `<sha>`; HEAD `<sha>`; changes are `<subtask start>..HEAD` plus the working tree).

Goal: <goal verbatim>

Files changed: <paths, each with (new) or (edited)>

Commands:
- <each command from the spec header, verbatim>

Relevant docs: <paths>

Return a verdict.
```

- Use the same template for re-verification. Never write "again", "round 2",
  what was fixed, or why.
- An environment workaround goes in as the command itself (e.g.
  `python -m jupyter` instead of `jupyter`), never as a note explaining it.
- **Never include your reasoning, justifications, confidence, or "I think this
  is correct."** That includes on re-verification: don't say what was fixed or
  argue against earlier findings. The review has to be objective.

Main verifier verdicts:
- **PASS**: go to step 4.
- **FAIL**: apply the listed fixes as new commits, then re-verify
  (objectiveness check first, then the same main verifier via
  `SendMessage`).
- If you're certain a FAIL finding is not a bug, don't override the verifier.
  Stop and flag it to the user with evidence. Make no more commits until it's
  resolved.

Limits, per subtask:
- **3 objectiveness FAILs**: stop and flag it to the user with the latest
  objectiveness output. Don't send a 4th prompt.
- **3 main-verifier FAILs**: stop and flag it to the user with the main
  verifier's latest output. Don't run a 4th round and don't mark it done.

## 4. Mark done (only after PASS)

Commit any changes left in the working tree, then commit the spec file alone
(its ticked criteria and doc deltas) with
`docs(specs): complete <subtask title in lowercase>`. The subtask counts as
done only from this commit. Report each commit since the subtask start, hash
and message, one line each.

### Commit rules

- One logical change per commit, with its tests, leaving the tests passing.
- Stage everything except the spec file: `git add -A -- . ':!<spec path>'`.
- Message: call the Skill tool with "loopeng:commit-message".
- Never use `--no-verify` or `--amend`. If a pre-commit hook fails, fix the
  cause and make a new commit.

## 5. Finish

Read by `execute`: hand the main verifier's agent ID back to `execute`, then
continue with its next step. Typed by a human: report the
commits made, the new decisions and spec changes, and the subtasks left, and
tell the user that `/loopeng:sweep` has not run.
