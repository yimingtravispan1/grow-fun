# GrowFun Agentic Lesson Workflow

Status: implemented Demo pipeline  
Last updated: 2026-09-29

## Product objective

Generate fresh English listening and speaking lessons from a parent's prompt without reducing every request to a minimal word pair. The LLM is free to choose age-appropriate situations, language, and exercise combinations. Reviewed RAG evidence supplies pedagogical constraints; deterministic tools own hard correctness and novelty gates.

The Demo does not claim that generated lessons are scientifically validated. It demonstrates evidence-grounded generation and auditable controls. Scientific effectiveness still requires expert review and measured learner outcomes.

## Runtime workflow

```text
validated request
  -> deterministic Orchestrator
  -> reviewed RAG retrieval
  -> recent learner history
  -> primary creative generation Agent
  -> Zod and business-rule validation
  -> exact and near-duplicate checks
  -> conditional teaching review Agent
  -> bounded targeted revision (maximum two generation attempts)
  -> published lesson and history record
```

The Orchestrator is ordinary TypeScript, not another LLM. It owns workflow state, retry limits, branching, provenance, and publication.

## Supported activities

- `sound_discrimination`
- `vocabulary_listening`
- `listening_comprehension`
- `guided_speaking`

Every activity contains an instruction, spoken stimulus, question, answer contract, target concepts, duration, and one or more retrieved evidence IDs. Closed activities require at least two unique choices and an answer contained in those choices. Guided speaking uses an example response and language support instead of a fixed answer list.

## Agent boundaries

### Primary generation Agent

The primary Agent plans the lesson and creates all activities in one call. It can invent new scenarios, vocabulary combinations, short stories, questions, and speaking tasks. It receives only the current request, reviewed evidence, recent lesson summaries, and targeted revision issues.

### Teaching review Agent

The review Agent does not rewrite content. It returns `pass` or `revise` with focused issues. `LESSON_REVIEW_MODE` controls cost:

- `auto` — call it only for model risk flags, deterministic warnings, or weak retrieval.
- `always` — call it for every lesson; useful for evaluation and high-risk publishing.
- `never` — rely on deterministic gates; useful for low-cost experiments.

There are no open-ended Agent conversations. The entire workflow allows at most two generation attempts.

### Deterministic tools

Program code—not an Agent—checks activity count, total time, answer membership, duplicate choices, evidence IDs, exercise-type diversity, exact duplicates, and near duplicates. Zod validates the complete contract.

## RAG trust boundary

RAG controls teaching principles and evidence, not surface creativity. The local reviewed set currently includes pronunciation guidance plus principles for purposeful oral interaction, comprehensible listening, scaffolding, and action-oriented tasks. Sources include the Education Endowment Foundation, British Council TeachingEnglish, the Council of Europe CEFR, and the International Phonetic Association.

Each generated activity must cite IDs from the evidence retrieved for that request. A model cannot invent a citation and pass publication.

## Novelty boundary

The Demo stores up to 50 lessons per learner in process memory. New activities are compared with recent activity type, stimulus, question, and answer fingerprints. Exact matches and high character-ngram similarity trigger one targeted regeneration.

This memory is intentionally temporary and is lost when the API restarts. Production needs a persistent learner-owned repository and, later, embedding-based semantic similarity. Pedagogically intentional spaced review should be represented explicitly rather than bypassing the duplicate check.

## Configuration

Local deterministic Demo:

```env
RAG_PROVIDER=memory
LESSON_PROVIDER=memory
LESSON_REVIEW_PROVIDER=memory
LESSON_REVIEW_MODE=auto
```

OpenAI primary and review Agents:

```env
LESSON_PROVIDER=openai
LESSON_REVIEW_PROVIDER=openai
LESSON_REVIEW_MODE=auto
OPENAI_API_KEY=...
OPENAI_LESSON_MODEL=...
OPENAI_LESSON_REVIEW_MODEL=...
```

OpenAI-compatible open-source endpoint:

```env
LESSON_PROVIDER=open_source
LESSON_REVIEW_PROVIDER=open_source
LESSON_REVIEW_MODE=auto
OPEN_SOURCE_LLM_BASE_URL=http://127.0.0.1:11434/v1
OPEN_SOURCE_LLM_API_KEY=
OPEN_SOURCE_LLM_MODEL=your-model-name
OPEN_SOURCE_LLM_JSON_MODE=true
```

The OpenAI adapter uses Structured Outputs. The open-source adapter uses JSON mode when supported and always validates the result with Zod.

## API

`POST /v1/lessons/generate`

```json
{
  "learnerId": "demo-learner",
  "childAgeBand": "6–8 岁",
  "prompt": "给7岁孩子生成水果主题的听说练习，包含听力理解和表达",
  "accent": "en-US",
  "minutesAvailable": 10,
  "activityCount": 4
}
```

The response includes the lesson, per-activity evidence mapping, workflow events, generation attempts, review decision, novelty report, validation checks, provider, and model version.

