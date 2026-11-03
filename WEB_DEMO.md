# GrowFun Web Practice Demo

Status: executable product-validation slice  
Last updated: 2026-09-28

## What this Demo validates

The Demo tests one narrow user journey for a parent and a 6–8-year-old child:

1. Listen to eight randomized-by-content `ship`/`sheep` discrimination prompts.
2. Record one sentence containing both target words.
3. Let the parent confirm the sentence as text and add three bounded observations.
4. Receive evidence-backed feedback for listening, task completion, content, and basic text grammar.
5. See clearly that pronunciation accuracy is not yet assessed.

It is designed to validate comprehension, completion, trust, and willingness to repeat—not to prove learning outcomes or clinical-grade speech measurement.

## Run locally

```bash
npm install
npm run start:api:memory
```

In a second terminal:

```bash
npm run dev:web
```

Open `http://127.0.0.1:5173`.

## Scoring design

The application-owned `ScoringAgent` combines deterministic listening evidence with a replaceable `LanguageAssessmentProvider`.

- `memory`: local rules for repeatable product testing with no API cost.
- `openai`: structured content and grammar feedback through the Responses API.
- pronunciation: explicitly `not_assessed` until a child-calibrated acoustic provider is evaluated and integrated.

The displayed overall score normalizes only the assessed 80% of the rubric. The report separately shows `scoreCoverage: 0.8`, confidence, rubric version, provider mode, and evidence for every dimension. This prevents a text model from being presented as a pronunciation model.

## Privacy boundary

- The raw audio Blob and playback URL stay in the current browser tab.
- The API receives the parent-confirmed transcript, bounded observations, listening attempts, and recording metadata—not raw audio.
- Automatic browser speech recognition is intentionally disabled because browser implementations may use an external transcription service.
- There is no identity, persistence, or analytics in this Demo.

Before a family pilot, add consent text, retention/deletion rules, authentication, encrypted object storage, audit logging, and a reviewed child-data policy.

## Portability

`PracticeExercise`, `PracticeSubmission`, `PracticeScore`, `LanguageAssessmentProvider`, and `ScoringAgent` live in the shared domain package. React/Vite owns only web presentation and browser recording. The same contracts can be consumed by Expo/React Native, while media capture is replaced by a mobile adapter.

## API

- `GET /v1/practice/demo` — returns the versioned exercise definition.
- `POST /v1/practice/score` — validates and scores one version-matched submission.
- `POST /v1/practice/feedback` — accepts whether the report matches the parent's observation.

## Verification

Run `npm run typecheck`, `npm test`, and `npm run build:web` from the repository root. Browser acceptance should cover desktop and narrow mobile layouts. Microphone capture must also be checked manually in the intended production browsers because it depends on user permission and device hardware.
