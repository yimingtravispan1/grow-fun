# GrowFun Pronunciation RAG Demo

## Demo goal

This milestone narrows GrowFun to one product hypothesis: a parent can lead a short English sound-discrimination and pronunciation session when the app supplies a clear sequence, playable examples, and traceable teaching references.

It does **not** claim to score a child's pronunciation. Device text-to-speech is a practice sample, not a pronunciation assessment instrument.

## What is implemented

1. A local, curated knowledge set with 22 pronunciation and listening documents.
2. A provider-neutral `KnowledgeRetriever` interface.
3. Deterministic local retrieval with regression tests for representative goals.
4. An optional OpenAI Vector Store retriever adapter. It is inactive by default and requires a prepared vector store.
5. Retrieval before both deterministic and OpenAI course generation.
6. Evidence, source links, review status, and deterministic Zod checks in every course response.
7. A visible mobile Demo with sound-pair presets and system-voice playback.
8. No Multi-Agent workflow yet. It should only be added after an evaluation shows that a separate reviewer improves quality enough to justify its latency and cost.

The local documents are GrowFun's concise teaching interpretations of public sources. `demo_reviewed` means the item passed the current internal rule checks; it does not mean that a speech-language professional has certified it.

## RAG request flow

```text
parent goal
   ↓
KnowledgeRetriever.search()
   ↓
top pronunciation/listening documents
   ↓
course builder (local rules or OpenAI)
   ↓
Zod structure + business-rule validation
   ↓
mobile course + playable words + source links
```

## Run the no-credit Demo

From the repository root:

```bash
npm run start:api:memory
```

In a second terminal:

```bash
npm run dev:mobile
```

Open the existing GrowFun Development Build in iOS Simulator. If the native app was built before `expo-speech` was added, rebuild it once:

```bash
npm run ios --workspace @growfun/mobile
```

Choose a preset, tap **检索并生成课程**, then inspect:

- the order of listening and production activities;
- the play buttons for word pairs;
- the retrieved evidence at the bottom;
- the original source links;
- the `本地 RAG` and `规则审核` labels.

## Inspect retrieval directly

```bash
curl -X POST http://127.0.0.1:3000/v1/knowledge/search \
  -H 'Content-Type: application/json' \
  -d '{"childAgeBand":"6–8 岁","goal":"练习 right 和 light 的区别","limit":3}'
```

## Optional OpenAI modes

Use local retrieval plus OpenAI generation:

```env
AI_PROVIDER=openai
RAG_PROVIDER=memory
OPENAI_API_KEY=...
OPENAI_MODEL=...
```

Use an OpenAI Vector Store plus OpenAI generation:

```env
AI_PROVIDER=openai
RAG_PROVIDER=openai
OPENAI_API_KEY=...
OPENAI_MODEL=...
OPENAI_VECTOR_STORE_ID=vs_...
```

The OpenAI adapter follows the official Vector Store search interface. Uploading and approving production teaching material is intentionally a separate content operation; this repository does not automatically upload files or spend API credit.

## Evaluation before adding Multi-Agent

Evaluate the same 20 goals with and without retrieved knowledge. Have a qualified reviewer score each result from 1–5 on:

- phonetic accuracy;
- age appropriateness;
- whether the listening task isolates one contrast;
- clarity for a parent without teaching experience;
- source support;
- unsafe or misleading correction advice.

Only add a reviewer agent if it catches important failures that Zod rules and deterministic content checks cannot catch.
