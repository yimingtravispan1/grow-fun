# Contributing for AI and Humans

This file is the operating contract for Codex and human contributors.

## 1. Before changing code

1. Read `PROJECT_BLUEPRINT.md` and the relevant package README.
2. Check `FOUNDER_VALIDATION.md` when a change depends on a user or business assumption.
3. State the user story and acceptance criteria in the issue, task, or change description.
4. Do not turn an open product decision into code without recording the assumption.

## 2. Dependency direction

- `packages/domain` contains provider-neutral types, schemas, and business rules.
- `apps/api` composes use cases and adapters.
- `apps/mobile` consumes the HTTP contract; it does not import server modules.
- Domain code must not import OpenAI, Supabase, Expo, Fastify, or future workflow frameworks.
- Vendor SDK objects must be converted to application-owned types at the adapter boundary.

## 3. Change rules

- Prefer the smallest vertical slice that tests one product assumption.
- Do not add a framework for a hypothetical future requirement.
- Keep model names, prompts, provider credentials, and endpoints in configuration/adapters.
- Validate data at trust boundaries.
- Never commit secrets, real family data, or raw child conversations.
- Preserve safe behavior when AI or network services fail.
- Add dependencies only when the standard library or existing dependency is insufficient.

## 4. Required checks

Run before handing off a code change:

```bash
npm run typecheck
npm test
```

Run the relevant app locally for changes affecting startup, routing, environment configuration, or UI.

## 5. Documentation rules

- Update `PROJECT_BLUEPRINT.md` for architectural, API, data, safety, or scope decisions.
- Update `FOUNDER_VALIDATION.md` only with sourced observations and explicit decisions.
- Add a dated decision row rather than silently changing a foundational choice.
- Mark uncertain content as `Provisional`, `Assumption`, or `Open decision`.
- Do not claim validation from implementation completion.

## 6. AI-specific quality bar

- Use typed structured inputs and outputs.
- Record prompt version and model alias in traces.
- Add representative eval fixtures before materially changing prompts.
- Treat model output as untrusted until schema and policy checks pass.
- Bound retries and tool loops.
- Require application authorization for side effects.
- Keep a deterministic test provider so tests do not call paid services.

## 7. Commit and handoff format

Summaries should state:

- User outcome changed
- Files or boundaries changed
- Tests performed and their result
- Assumptions, risks, and remaining decisions

## 8. When to consider LangGraph

Propose an orchestrator only with evidence for at least one of:

- persisted and resumable multi-step execution
- meaningful conditional branching that has become hard to maintain
- human approval inside a long-running workflow
- multiple agents with distinct responsibilities
- operational traces showing the current workflow abstraction is insufficient

Any migration must implement the existing workflow port before adding framework-specific capabilities.
