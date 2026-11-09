---
name: loopeng-plan
description: Discovery and planning for loop engineering — reads the repo's docs and code, asks until it has enough, then writes an approved spec file in the repo (dependencies and blockers first, suggested splits, subtasks with testable acceptance-criteria checklists, human checks last) for /loopeng:loopeng-auto to execute. Run only when the user invokes /loopeng:loopeng-plan.
argument-hint: <task + any context, free text; name an md file to update if you want one>
disable-model-invocation: true
---

# Loop engineering: plan

Task: $ARGUMENTS

This skill only plans. It writes code nowhere, makes no commits, creates no
branches and runs no other git writes. The spec it produces is executed
later by `/loopeng:loopeng-auto <spec file>`.

**The repo** is the git repository the task is in: the current working
directory's repo, unless the task names another. If that is unclear, ask
before doing anything else.

**The docs** are the repo's own context files, whichever exist: `README.md`,
`CLAUDE.md`/`AGENTS.md`, the md files in `docs/` (e.g. ARCHITECTURE,
CONTRACTS, SETUP), the split contracts files in `docs/contracts/` if
present, and the ADRs in `docs/adr/` (one past decision per
file; skip any marked `status: superseded`). They are the source of truth
for scope, contracts and past decisions. If the repo has none, say so in
the spec. If a decision in the spec contradicts an ADR, mark it `OPEN Qn`
and name the ADR.

## 1. Discovery

- Read the docs relevant to the task and the code it touches.
- Check the git state of the repo (`git status`, current branch,
  `git log --oneline -10` for commit style and scopes).
  - If the branch is `main`/`master`, propose a feature branch name.
  - List any uncommitted changes that aren't part of this task. They must
    not end up in any commit.
- If something the spec depends on is unclear (behaviour, scope, an
  interface, a choice between approaches) and the code and docs don't
  settle it, it is an open question. Don't ask what you can look up.
- As soon as the scope and approach are clear enough to split the task
  into subtasks, write the draft spec file (step 2) and show it. Don't
  wait for every detail.
- In the draft, mark each unsettled point inline as `OPEN Qn` and list it
  under **Open questions**. You may fill a gap with an assumption, but
  mark it inline as `ASSUMED` and list it there too, so the user can
  confirm or correct it.
- Discuss the open questions with the user conversationally. Don't use
  multiple-choice question tools.
- As each one is settled, write the decision into the spec where it
  applies (see **Decisions** in step 2), remove its marker and its Open
  questions entry, and update the affected subtasks.
- Keep going until no open questions or assumptions remain: scope and
  what is out of scope, behaviour, interfaces, error and edge-case
  handling, naming, data shapes.
- If the repo has a glossary (`GLOSSARY.md`, or `GLOSSARY-MAP.md` pointing
  to per-context ones), read it. Use its terms in your questions and the
  spec. If the user or the task uses a term differently from the
  glossary, ask which meaning is meant. Every new or changed term becomes
  a doc delta on the subtask that introduces it.

## 2. Write the spec file

Once the task can be split into subtasks, write the spec **in the repo**:
`docs/specs/<YYYY-MM-DD>-<task-slug>.md`, where `<task-slug>` is the task
title in lowercase kebab-case (e.g. `add-csv-export`). If the repo already
keeps specs somewhere else, use that folder instead. Don't stage or commit
it: `/loopeng:loopeng-auto` commits it on the feature branch.

The spec is the source of truth for the whole run: the verifiers and the
final review read it. Write only facts and decisions in it, no persuasion
or confidence ("this should be safe", "I'm confident"), because verifiers
read it.

The spec is a work order, not documentation: after the run it may be
deleted, and the docs, code and tests must still hold everything that
matters. So every Decision, Interface and Out of scope item that should
still apply after the run must be a doc delta on some subtask (see **Doc
deltas**). Mark anything that matters only during the run `transient`
where it is written.

Split the task into subtasks. Each one should be small enough to verify on
its own, but still a meaningful unit of work (no "add import" steps). Each
subtask becomes one commit.

Prefactor first: if the existing code makes the change awkward (logic
duplicated in several places, a tangled function the change must go
through), make the restructuring its own subtask, before the subtasks
that need it. A prefactor subtask changes no behaviour: its acceptance
criteria are that the existing tests still pass unchanged, plus any test
it adds for the new structure. Don't mix restructuring into a feature
subtask.

Give each an ID (`S1`, `S2`, ...) for use in
the spec only; IDs never appear in commits.

The spec file has this structure, in this order:

0. **Header**: the task title, `**Status:** draft`, the repo path, the
   user-named md file to update (if any), and **Commands**: the exact
   commands to run the full test suite, a single test file, typecheck and
   lint, as the repo defines them. Write "none" for any the repo doesn't
   have.
1. **Dependencies and blockers** (always first after the header):
   - For every subtask, what it is blocked by: other subtask IDs, or
     "none". Then list the order they will run in.
   - External blockers: open questions, decisions the user must make,
     missing access, services or data, other people's work. Write "none"
     if there are none.
   - Uncommitted changes that must stay out of the commits, and the
     proposed branch name if one is needed.
2. **Open questions** (while drafting only): every `OPEN Qn` and
   `ASSUMED` point, numbered, with the subtasks it affects. Delete the
   section once it is empty.
3. **Suggested splits**: group the subtasks by dependency. If two or more
   groups have no dependency between them (no subtask in one group is
   blocked by a subtask in another, and they don't change the same
   files), suggest splitting them into separate specs, one per group, each
   run as its own `/loopeng:loopeng-auto` on its own branch. Name the groups and
   their subtasks. If every subtask is connected, write "No split: all
   subtasks are connected" and say through which dependency.
4. **Out of scope**: what this task deliberately does not do, including
   anything the user ruled out. Write "none" if there is nothing. For
   each item, name the subtask whose doc delta records it, or mark it
   `transient`.
5. **Interfaces** (only when one subtask hands data or calls to another,
   e.g. a split by layer): each interface between subtasks, with its
   exact shape (function signature, record fields and types, endpoint
   request/response). Subtasks on both sides test against it. Each one
   is a doc delta (usually to `docs/CONTRACTS.md`, or the matching
   `docs/contracts/<area>.md` if contracts are split) on the subtask that
   introduces it, unless it is marked `transient`.
6. **Subtasks**, each with:
   - **Goal**: what will be true when it's done.
   - **Blocked by**: subtask IDs, or "none" (same as section 1).
   - **Files**: the files expected to change.
   - **Seams**: the interfaces the tests go through (public functions,
     endpoints, CLI commands). Tests use only these, never internals.
   - **Decisions**: every decision from discovery that this subtask must
     follow, each with who settled it (`user`, `docs: <file>` or
     `code: <file>`). A decision that affects several subtasks goes in
     each of them. Write the user's answers in their own words, keeping
     every exact value, order and "must not": don't soften or summarise
     them. Each decision is either a doc delta on this subtask or marked
     `transient`. Write "none" if there are none.
   - **Acceptance criteria**: a checklist (`- [ ] ...`). Each item is an
     observable behaviour that an agent can prove with an automated test
     or a command it can run. Name the test or command for each one. Put
     anything that needs a human (visual checks, manual UX, real devices,
     third-party dashboards, judgement calls) in **Human checks** instead,
     never here.
   - **Doc deltas**: anything in this subtask that deviates from the docs
     or isn't covered by them, including every Decision, Interface and Out
     of scope item it records that isn't `transient`, and which md file
     it should go in. A decision that isn't ADR-worthy (see the
     `docs-updater` agent) is written as a fact about the system (e.g.
     "exports never include deleted rows"), not as a decision. Write
     "none" if there are none.
7. **Human checks** (always last among the task sections): a checklist
   (`- [ ] ...`) of every check that needs a human, for the whole task.
   For each: the subtask it belongs to, the steps to perform, and the
   expected result. Write "none" if there are none. The user runs these
   after the whole task is done.
8. **Context file** (only if the user named an md file to update): what
   codebase context will be added to it.

## 3. Present and wait

- The spec can't be approved while it has open questions or assumptions.
  Once the last one is settled, show the user the spec file's path and
  its final contents. If you suggested a
  split, ask which way to go: one spec, or separate specs. On a split,
  write each group as its own spec file (same structure, its own
  dependencies, human checks and branch name) and delete the combined one.
- Wait for approval. Questions, pushback or change requests are not
  approval: discuss them, revise the spec file, and present it again.
- On explicit approval, set `**Status:** approved` in each approved spec
  file. Then stop and tell the user the command(s) to run, one per spec:
  `/loopeng:loopeng-auto <spec file path>`.
