# Project Blueprint

Status: Draft v0.3  
Last updated: 2026-09-28  
Purpose: Single source of truth for product and engineering decisions

## 1. Product intent

GrowFun is testing a parent-guided English sound-discrimination and pronunciation product built around a short parent/child journey. The MVP is designed to learn whether this focused activity creates real value, not to demonstrate the maximum capability of an AI framework.

Known constraints:

- Target an MVP in 6–8 weeks.
- Pilot with roughly 20–30 families.
- Aim for a 10–15 minute daily experience.
- Preserve the ability to replace AI, workflow, data, and infrastructure providers.

Pronunciation and listening are the current product hypothesis, not yet validated demand. Exact age range, activity progression, market, and pricing remain open decisions.

## 2. Product principles

1. Validate behavior before scaling architecture.
2. A parent must understand the value without understanding AI.
3. The parent remains in control of child-facing experiences.
4. Collect the minimum child and family data necessary.
5. Every third-party dependency sits behind an application-owned interface.
6. Prefer observable, deterministic workflows before autonomous behavior.
7. Documentation changes with the product; it is not a post-development report.

## 3. MVP scope

### Included

- Minimal family onboarding and consent checkpoint
- A single defined daily learning journey
- Retrieval from an internally reviewed pronunciation knowledge set
- Playable system-voice examples for listening practice
- Visible source evidence for parents and reviewers
- AI-assisted generation or adaptation through a provider-neutral API
- Session completion and lightweight progress history
- Parent feedback after a session
- Operational logging, error reporting, and basic product analytics
- A safe fallback when the AI provider is unavailable
- A web-first listening and speaking practice flow with local recording
- Evidence-backed scoring for listening, task completion, content, and text grammar
- An explicit `not_assessed` result for pronunciation until a suitable acoustic provider is integrated

### Excluded until validated

- Multi-agent systems
- General-purpose autonomous planning
- Complex LangGraph graphs
- Social features and public child profiles
- Large content marketplaces
- Premature multi-region or enterprise infrastructure
- Long-term memory based on unreviewed conversation archives
- Production pronunciation scoring or automated learning-outcome claims

## 4. Provisional user journey

1. Parent creates a family profile and acknowledges data/AI disclosures.
2. Parent supplies only the context required for today's activity.
3. System prepares a short daily plan through the workflow service.
4. Parent and child complete the guided activity.
5. Parent confirms completion and gives lightweight feedback.
6. System stores a structured progress event and proposes the next session.

This journey is provisional. Replace it with evidence from the concierge experiment before building deep feature branches.

## 5. Architecture

```text
Web app       Expo mobile app
      \         /
Application API
      |
Use cases / workflow and scoring ports
   |              |               |
AI/scoring port  Knowledge port  Repository ports
   |              |               |
OpenAI/local     Local/OpenAI     Supabase
adapters         retrievers       adapters
```

The domain and use cases may depend only on ports. Provider adapters may depend on vendor SDKs; domain packages may not.

### Initial stack

- Web client: React 19, Vite, and TypeScript for the fastest product validation loop
- Mobile client: React Native 0.86 with Expo SDK 57, Expo Development Build, and TypeScript
- Local iOS validation: Xcode 26.4+ and iOS Simulator
- API: Node.js, TypeScript, Fastify
- Data/auth target: Supabase, introduced through repository and identity ports
- AI target: OpenAI Responses API; optional Agents SDK only where its tracing or tool loop produces clear value
- RAG: application-owned `KnowledgeRetriever`; deterministic local retrieval by default, optional OpenAI Vector Store adapter
- Workflow: application-owned TypeScript use cases
- Validation: Vitest plus API integration tests

### Why LangGraph is deferred

The first workflow is expected to be short and knowable. A graph framework adds value when there are durable multi-step states, branching, human approval, resumability, or multiple cooperating agents. Until those requirements appear in validated journeys, the workflow port uses a small TypeScript implementation. A future LangGraph adapter must satisfy the same workflow contract.

## 6. Core boundaries

```ts
export interface AiProvider {
  prepareJourney(input: JourneyRequest): Promise<DailyJourney>;
}

export interface KnowledgeRetriever {
  search(input: KnowledgeQuery): Promise<KnowledgeMatch[]>;
}

export interface LanguageAssessmentProvider {
  readonly mode: "memory" | "openai";
  assess(input: LanguageAssessmentInput): Promise<LanguageAssessment>;
}

export interface ScoringAgent {
  score(exercise: PracticeExercise, submission: PracticeSubmission): Promise<PracticeScore>;
}

export interface DailyJourneyWorkflow {
  prepare(input: PrepareJourneyInput): Promise<DailyJourney>;
}

export interface ProgressRepository {
  record(event: ProgressEvent): Promise<void>;
  listForFamily(familyId: string): Promise<ProgressEvent[]>;
}
```

Provider names, SDK response objects, prompts, and model identifiers must not escape their adapter modules.

## 7. Provisional data model

- `Family`: id, locale, timezone, consent version, timestamps
- `ChildProfile`: id, family id, coarse age band, preferences, optional goals
- `DailyJourney`: id, family id, date, structured steps, status, generation metadata
- `KnowledgeDocument`: id, teaching summary, guidance, keywords, examples, source metadata, review status
- `Evidence`: knowledge id, source URL, retrieval score, course linkage
- `ProgressEvent`: id, journey id, event type, structured payload, timestamp
- `ParentFeedback`: journey id, usefulness, effort, safety flag, note
- `AiRun`: internal trace id, provider, model alias, latency, token/cost metadata, outcome
- `PracticeSubmission`: exercise version, listening attempts, parent-confirmed transcript, bounded observations, recording metadata
- `PracticeScore`: assessed dimensions, coverage, confidence, evidence, rubric/provider provenance

Rules:

- Avoid free-text child data where a bounded field works.
- Keep analytics identifiers separate from personal information.
- AI outputs are proposals; persist reviewed structured results, not opaque SDK objects.
- Define retention and deletion policies before the family pilot.

## 8. AI design

### Model routing

Application code requests a capability alias such as `daily-plan-default`; configuration maps it to a provider/model. No UI or domain module contains a raw model name.

### Prompt management

- Prompts live in the AI adapter, versioned with stable identifiers.
- Inputs and outputs use schemas.
- Prompt changes require representative fixtures or eval cases.
- User/child content is treated as untrusted input and cannot redefine system policy.

### Memory

MVP memory is explicit structured state: preferences, goals, prior completion, and parent-approved notes. Do not implement unbounded conversational memory. Memory reads and writes use a port so storage can migrate.

### Retrieval-augmented generation

- Retrieval happens before course construction.
- Local knowledge keeps the Demo deterministic and usable without API credit.
- Retrieved source metadata is returned with the course; the model cannot invent or overwrite citations.
- Zod enforces structure and deterministic business rules, not pedagogical truth.
- `demo_reviewed` means internal Demo review, not certification by a speech professional.
- Multi-Agent review remains deferred until a controlled evaluation shows material benefit.

### Tools and workflow

Tool calls must be allowlisted, schema-validated, observable, and limited to the current use case. Side-effecting tools require an application-level permission check. The workflow—not the model—owns completion criteria and retries.

### Safety

- Define child-safety policy and escalation behavior before pilot use.
- Provide parent visibility and correction controls.
- Minimize personal data passed to models.
- Log safety outcomes without logging unnecessary sensitive content.
- Fail closed for missing consent or invalid structured output.

## 9. API v0

- `GET /health` — process and provider readiness
- `POST /v1/journeys/preview` — generates a non-persisted provisional daily journey
- `POST /v1/knowledge/search` — exposes retrieved evidence for Demo inspection
- `GET /v1/practice/demo` — returns the versioned listening/speaking exercise
- `POST /v1/practice/score` — validates and scores a practice submission
- `POST /v1/practice/feedback` — records whether the score matches the parent's observation

Future endpoints for families, persisted journeys, audio upload, and progress history are added only with an approved user story and data policy.

### Web Demo acceptance path

1. Parent starts the versioned `ship`/`sheep` exercise without login.
2. Child completes eight listening-discrimination trials using system voice.
3. Browser records one short sentence and keeps the raw audio local.
4. Parent confirms the sentence text and supplies three bounded observations.
5. API returns a structured report with evidence, confidence, coverage, rubric version, and provider provenance.
6. Report does not infer pronunciation from transcript text and states that pronunciation is not assessed.

Acceptance requires the full path to work with `SCORING_PROVIDER=memory`, a narrow-screen layout to remain usable, and an OpenAI scoring adapter to satisfy the same application-owned contract.

### Simulator acceptance path

The first executable product slice is intentionally narrower than the future persisted API:

1. Parent selects an age band and a sound/listening goal.
2. API retrieves one target sound document plus supporting teaching methods.
3. API builds a 5, 10, or 15 minute listen-first journey.
4. Parent plays examples, guides the activity, and inspects source evidence.
5. Parent checks off each step and records lightweight feedback.
6. Restarting the app clears the session; persistence and identity remain out of scope.

Acceptance requires the Development Build to install in Simulator, the full path to be usable without an OpenAI key, and connection failures to be understandable and recoverable.

## 10. Repository structure

```text
apps/
  web/          React/Vite product-validation client
  mobile/       Expo client
  api/          HTTP composition root, AI/scoring adapters, and knowledge retrievers
packages/
  domain/       provider-neutral contracts and schemas
```

## 11. Delivery plan

### Phase 0 — Foundation

- Establish documents, workspace, lint/type/test commands, health endpoint, and mock AI path.
- Confirm first user segment and journey through interviews.

### Phase 1 — Concierge prototype

- Implement the smallest screens and workflow required to reproduce the manual test.
- Add structured events for start, completion, feedback, and failure.

### Phase 2 — Family pilot

- Add authentication, Supabase adapters, consent, operational controls, and OpenAI production configuration.
- Run the pre-registered pilot and update the evidence log weekly.

### Phase 3 — Architecture review

- Review traces and complexity.
- Adopt LangGraph or another orchestrator only if branching, resumption, human approval, or multi-agent requirements are evidenced.

## 12. Definition of done

A feature is done only when:

- Its user story and acceptance criteria are documented.
- Domain logic is provider-neutral.
- Failure and fallback behavior are defined.
- Relevant tests pass.
- Required analytics and privacy impacts are documented.
- The Blueprint or validation evidence is updated when assumptions changed.

## 13. Open decisions

1. First child age band and priority pronunciation contrasts
2. Buyer/user segment and launch geography
3. Exact daily journey and one-week observable outcome
4. Pilot success thresholds and duration
5. Child data classification, retention, and deletion rules
6. Parent consent and safety review process
7. Hosting target and regional requirements

## 14. Decision record

| Date | Decision | Reason | Revisit trigger |
|---|---|---|---|
| 2026-08-04 | Start with application-owned workflows, not LangGraph | Faster MVP and fewer premature dependencies | Validated need for branching, resumability, HITL, or multiple agents |
| 2026-08-04 | Isolate OpenAI and Supabase behind ports | Preserve migration path and testability | Architecture review after pilot |
| 2026-08-05 | Use Expo SDK 57 with Xcode 26.4+ and pin the mobile dependency family | Keep a supported Development Build path and avoid drifting `latest` packages | A planned SDK upgrade with simulator and device regression tests |
| 2026-08-05 | Validate the first journey with the deterministic provider and ephemeral state | Prove product flow independently of credentials, model availability, auth, and storage | Begin instrumented family pilot |
| 2026-09-06 | Focus the Demo on listening discrimination and pronunciation with local RAG | Test one concrete teaching value proposition while retaining provider portability | User tests reject the problem or require a different first learning outcome |
| 2026-09-28 | Validate the complete exercise on web before copying UI to mobile | Shorter iteration loop while shared domain/API contracts preserve portability | Validated demand requires native device capabilities or store distribution |
| 2026-09-28 | Score text content and grammar but mark pronunciation as unassessed | Transcript correctness is not acoustic pronunciation evidence | A child-calibrated pronunciation provider passes an explicit evaluation set |
