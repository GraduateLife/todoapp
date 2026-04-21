---
name: todoapp-collab
description: Collaboration rules for the todoapp repo when Codex and Claude Code work in parallel. Use when planning or implementing work in this project and you need to follow the agreed branch naming, worktree isolation, ownership boundaries, and daily integration flow.
---

# Todoapp Collab

## Overview

Follow this skill when working in the todoapp repository with parallel AI agents. Optimize for low-conflict changes, short-lived branches, and daily integration into `ci` or `main`.

## Branch Strategy

Use short-lived feature branches.

Name active branches by agent and task:
- `cc/<feature-name>` for Claude Code work
- `codex/<feature-name>` for Codex work

Name daily integration branches by date:
- `YYYY-MM-DD/<integration-name>`

Treat daily integration branches as temporary. Merge them into `ci` or `main` after verification, then delete them.

Start each new day from the latest integrated base. Do not keep stacking new work on yesterday's feature branch.

## Worktree Rules

Prefer separate worktrees when Codex and Claude Code are both actively editing.

Use one worktree per active agent branch so uncommitted changes, generated files, and formatting do not interfere across agents.

If separate worktrees are not available, keep ownership boundaries strict and avoid broad formatting or refactors.

## Ownership Boundaries

Default split:
- Claude Code owns frontend-heavy work such as layout, styling, interaction polish, and visual iteration.
- Codex owns backend-heavy work such as APIs, storage wiring, Cloudflare integration, and minimal frontend plumbing required to connect backend behavior.

Avoid editing the other agent's active area unless the task clearly requires it. If cross-boundary edits are necessary, keep them minimal and call them out explicitly.

Do not run repo-wide formatting as part of routine work.

## Daily Integration Flow

1. Create or continue agent-specific feature work on `cc/...` or `codex/...`.
2. Merge the day's finished branches into `YYYY-MM-DD/<integration-name>`.
3. Resolve conflicts, run checks, and verify the integrated result.
4. Merge the integration branch into `ci` or `main`.
5. Delete merged feature branches and the integration branch when no longer needed.
6. Start the next day's work from the latest `ci` or `main`.

## Working Norms

Keep changes scoped and easy to merge.

Prefer additive backend changes over sweeping structural rewrites when another agent is actively building nearby.

When changing shared contracts, document the exact frontend-backend touchpoints that the other agent needs to know.

Before making large changes, check whether the branch already has unrelated user edits and avoid reverting them.

## Response Style For Future Runs

When this skill is active:
- Mention the likely ownership boundary before making substantial edits.
- Prefer branch-safe, low-conflict implementation plans.
- Warn if a proposed change is likely to collide with the other agent's current area.
- Suggest a new short-lived branch or worktree when the current state looks risky.
