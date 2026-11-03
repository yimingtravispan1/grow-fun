# GrowFun

GrowFun is an early-stage parent-guided English listening and speaking product. The current web Demo combines a cost-aware agentic lesson workflow with the original sound-discrimination and pronunciation-validation flow.

## Repository map

- `apps/mobile` — Expo/React Native client
- `apps/web` — React/Vite product-validation client
- `apps/api` — TypeScript HTTP API and AI adapter boundary
- `packages/domain` — provider-independent domain contracts
- `apps/api/src/knowledge` — curated pronunciation knowledge and replaceable retrievers
- `RAG_DEMO.md` — RAG architecture, limits, and Demo walkthrough
- `FOUNDER_VALIDATION.md` — assumptions and experiments
- `PROJECT_BLUEPRINT.md` — product and architecture source of truth
- `CONTRIBUTING_FOR_AI.md` — working rules for Codex and contributors
- `WEB_DEMO.md` — web exercise scope, scoring boundaries, and runbook
- `AGENTIC_LESSON_WORKFLOW.md` — free-form lesson orchestration, RAG grounding, review policy, and novelty controls

## Web practice Demo

The fastest way to validate the current product slice is the web client:

1. Run `npm install` from the repository root.
2. Run `npm run start:api:memory` in the first terminal.
3. Run `npm run dev:web` in the second terminal.
4. Open `http://127.0.0.1:5173`.

The main generator accepts a parent prompt and creates a multi-activity lesson across vocabulary listening, listening comprehension, guided speaking, and—when useful—sound discrimination. A deterministic Orchestrator retrieves reviewed teaching evidence, invokes one creative generation Agent, validates answers and novelty, and invokes a separate review Agent only when the configured cost policy requires it. The original sound-pair practice and scoring experience remains available from the generated lesson page.

To evaluate OpenAI-backed content and grammar feedback, set `SCORING_PROVIDER=openai`, `OPENAI_API_KEY`, and `OPENAI_SCORING_MODEL`, then run `npm run dev:api`. This mode still does not claim to assess pronunciation accuracy.

For an OpenAI-compatible open-source model endpoint, set `EXERCISE_PROVIDER=open_source`, `OPEN_SOURCE_LLM_BASE_URL`, and `OPEN_SOURCE_LLM_MODEL`. See `GENERATION_PIPELINE.md` for configuration, trust boundaries, and the fixed evaluation command.

For free-form agentic lessons, configure `LESSON_PROVIDER`. It supports `memory`, `openai`, and `open_source`. `LESSON_REVIEW_MODE=auto` is the recommended default: deterministic checks always run, while the second model is called only for risk flags, validation warnings, or weak retrieval. See `AGENTIC_LESSON_WORKFLOW.md`.

## iOS Simulator MVP setup

Requirements: Node.js 22.13 or later, Xcode 26.4 or later, an installed iOS Simulator runtime, and CocoaPods.

1. Run `npm install` from the repository root.
2. Run `npm run start:api:memory` in the first terminal. This deliberately bypasses OpenAI so local product validation cannot be blocked by credentials or network access. Use `npm run dev:api:memory` only when you need automatic restart after API code changes.
3. Boot an iPhone simulator.
4. The first time, run `npm run ios --workspace @growfun/mobile` to compile and install the Development Build.
5. On later runs, keep the Development Build installed and run `npm run dev:mobile` in the second terminal.

The Simulator MVP validates this flow: choose an age band and sound contrast, retrieve relevant teaching knowledge, generate a short parent-guided activity, play example words, inspect source evidence, complete the steps, and record lightweight feedback. Session state is intentionally temporary.

To exercise the OpenAI adapter separately, set `AI_PROVIDER=openai`, `OPENAI_API_KEY`, and an explicit `OPENAI_MODEL`, then use `npm run dev:api`. Retrieval remains local by default. See `RAG_DEMO.md` for the optional OpenAI Vector Store configuration.

### Simulator boundaries

Use Simulator for navigation, forms, API integration, system-voice playback, loading/error states, and session completion. Microphone quality, pronunciation assessment, device permissions, and real-device performance require physical-device testing and are outside this milestone. The web and mobile clients share provider-neutral contracts from `packages/domain`, so the validated exercise and scoring flow can move to mobile without importing browser UI code.

## First milestone

The current milestone proves the provisional journey and technical boundaries, not market demand. Before expanding it, replace the provisional assumptions in `FOUNDER_VALIDATION.md` with evidence from family interviews.
