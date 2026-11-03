# GrowFun RAG Exercise Generation

Status: implemented Demo pipeline  
Last updated: 2026-09-28

## Objective

Generate a short listening and speaking exercise from a parent's free-text prompt while keeping teaching facts, answer keys, and provenance outside model control.

## Pipeline

```text
Parent prompt
  -> Zod request validation
  -> KnowledgeRetriever
  -> reviewed minimal-pair selection
  -> model or local copy generator
  -> deterministic trial construction
  -> Zod and cross-field domain validation
  -> temporary versioned exercise store
  -> web practice and scoring flow
```

The model may generate the title, child-friendly explanation, speaking prompt, and example sentence. It may not create or replace the target words, IPA, answer key, trial balance, source citations, or rubric version.

## Generation providers

### Local validation

```env
EXERCISE_PROVIDER=memory
RAG_PROVIDER=memory
```

This mode uses the same retrieval and validation pipeline without an external model. It is the default for product and UI testing.

### OpenAI-compatible open-source model API

```env
EXERCISE_PROVIDER=open_source
RAG_PROVIDER=memory
OPEN_SOURCE_LLM_BASE_URL=http://127.0.0.1:11434/v1
OPEN_SOURCE_LLM_API_KEY=
OPEN_SOURCE_LLM_MODEL=your-model-name
OPEN_SOURCE_LLM_JSON_MODE=true
```

The endpoint must implement OpenAI-compatible Chat Completions. Set `OPEN_SOURCE_LLM_JSON_MODE=false` only if the endpoint rejects `response_format: {"type":"json_object"}`. In either mode GrowFun parses the response with Zod, checks that both approved words occur in the example sentence, constructs trials itself, and retries one invalid model response.

An empty API key is intended only for a trusted local server. Do not put a browser-visible key in Vite or Expo environment variables. The API key remains server-side.

### OpenAI Responses API

```env
EXERCISE_PROVIDER=openai
OPENAI_API_KEY=...
OPENAI_EXERCISE_MODEL=...
```

This adapter uses Structured Outputs. It satisfies the same `PracticeExerciseGenerator` interface as the local and open-source adapters.

## API

`POST /v1/practice/generate`

```json
{
  "childAgeBand": "6–8 岁",
  "goal": "孩子容易混淆 right 和 light，先听辨再说一句话",
  "accent": "en-GB",
  "trialCount": 8
}
```

The response contains a versioned `PracticeExercise`, RAG evidence, model provenance, and the deterministic validation checks that passed. Generated exercises remain in a bounded in-memory store for two hours in the Demo. Production requires a persistent repository and user ownership checks.

## Evaluation

Run the deterministic baseline:

```bash
npm run eval:exercise:memory
```

To evaluate a configured external provider:

```bash
npm run eval:exercise --workspace @growfun/api
```

The fixed evaluation set checks structural pass rate, retrieved word-pair consistency, balanced answer distribution, evidence presence, and latency. Human review must separately score age appropriateness, sentence naturalness, parent usability, and professional teaching quality.

Do not call the content "scientifically validated" based on schema success or a single good example. That claim requires a reviewed knowledge set, expert content evaluation, child testing, and measured learning outcomes.
