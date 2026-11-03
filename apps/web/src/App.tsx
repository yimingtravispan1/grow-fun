import type {
  LessonGenerationRequest,
  LessonPlan,
  PracticeExercise,
  PracticeScore,
  PracticeSubmission,
} from "@growfun/domain";
import { useEffect, useMemo, useRef, useState } from "react";
import { LessonPreview } from "./LessonPreview.js";

const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:3000";
type Screen = "welcome" | "listening" | "speaking" | "report";
type ListeningAttempt = PracticeSubmission["listeningAttempts"][number];
type Rating = PracticeSubmission["parentObservation"];

const initialRating: Rating = {
  listening: "sometimes",
  production: "needs_prompt",
  difficulty: "appropriate",
  note: "",
};

function speak(text: string, language: string) {
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = language;
  utterance.rate = 0.72;
  const matchingVoice = window.speechSynthesis.getVoices().find((voice) => voice.lang === language);
  if (matchingVoice) utterance.voice = matchingVoice;
  window.speechSynthesis.speak(utterance);
}

export default function App() {
  const [exercise, setExercise] = useState<PracticeExercise | null>(null);
  const [lesson, setLesson] = useState<LessonPlan | null>(null);
  const [screen, setScreen] = useState<Screen>("welcome");
  const [attempts, setAttempts] = useState<ListeningAttempt[]>([]);
  const [trialIndex, setTrialIndex] = useState(0);
  const [replays, setReplays] = useState(0);
  const [trialStartedAt, setTrialStartedAt] = useState(Date.now());
  const [answerState, setAnswerState] = useState<"idle" | "correct" | "wrong">("idle");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const [recordingMeta, setRecordingMeta] = useState<PracticeSubmission["recording"]>(null);
  const [transcript, setTranscript] = useState("");
  const [rating, setRating] = useState<Rating>(initialRating);
  const [score, setScore] = useState<PracticeScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fatalError, setFatalError] = useState<string | null>(null);
  const [feedbackSent, setFeedbackSent] = useState(false);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordingStartedAtRef = useRef(0);

  useEffect(() => {
    fetch(`${API_URL}/v1/practice/demo`)
      .then(async (response) => {
        if (!response.ok) throw new Error(String(response.status));
        return (await response.json()) as PracticeExercise;
      })
      .then(setExercise)
      .catch(() => setFatalError(`无法连接 GrowFun API（${API_URL}）。请先启动本地 API。`))
      .finally(() => setLoading(false));
  }, []);

  useEffect(
    () => () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if (recordingUrl) URL.revokeObjectURL(recordingUrl);
    },
    [recordingUrl],
  );

  const progress = useMemo(() => {
    if (!exercise) return 0;
    if (screen === "welcome") return 0;
    if (screen === "listening") return Math.round((attempts.length / exercise.listeningTrials.length) * 60);
    if (screen === "speaking") return 78;
    return 100;
  }, [attempts.length, exercise, screen]);

  if (loading) return <LoadingScreen />;
  if (!exercise || fatalError) return <ErrorScreen message={fatalError ?? "练习加载失败。"} />;

  const trial = exercise.listeningTrials[trialIndex];

  function playTrial() {
    if (!trial) return;
    speak(trial.audioText, exercise!.accent);
    setReplays((value) => value + 1);
    if (answerState !== "idle") setAnswerState("idle");
  }

  function chooseAnswer(selectedWord: string) {
    if (!trial || answerState !== "idle") return;
    const correct = selectedWord === trial.audioText;
    setAnswerState(correct ? "correct" : "wrong");
    const attempt: ListeningAttempt = {
      trialId: trial.id,
      selectedWord,
      replayCount: Math.max(0, replays - 1),
      responseTimeMs: Date.now() - trialStartedAt,
    };
    setAttempts((current) => [...current, attempt]);

    window.setTimeout(() => {
      if (trialIndex + 1 >= exercise!.listeningTrials.length) {
        setScreen("speaking");
      } else {
        setTrialIndex((value) => value + 1);
        setReplays(0);
        setTrialStartedAt(Date.now());
        setAnswerState("idle");
      }
    }, 550);
  }

  async function startRecording() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const preferredType = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"].find((type) =>
        MediaRecorder.isTypeSupported(type),
      );
      const recorder = new MediaRecorder(stream, preferredType ? { mimeType: preferredType } : undefined);
      recorderRef.current = recorder;
      recordingStartedAtRef.current = Date.now();
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        if (recordingUrl) URL.revokeObjectURL(recordingUrl);
        setRecordingUrl(URL.createObjectURL(blob));
        setRecordingMeta({
          durationMs: Math.max(250, Date.now() - recordingStartedAtRef.current),
          mimeType: blob.type || "audio/webm",
          sizeBytes: blob.size,
        });
        stream.getTracks().forEach((track) => track.stop());
      };
      recorder.start();

      setIsRecording(true);
      window.setTimeout(() => {
        if (recorder.state === "recording") stopRecording();
      }, 20_000);
    } catch {
      setError("无法使用麦克风。请允许浏览器访问麦克风，或检查系统权限后重试。");
    }
  }

  function stopRecording() {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    setIsRecording(false);
  }

  async function submitPractice() {
    if (!recordingMeta) {
      setError("请先完成一段录音。");
      return;
    }
    if (!transcript.trim()) {
      setError("请确认或补充录音转写文字。当前评分 Agent 依据文字评价内容与语法。");
      return;
    }

    setSubmitting(true);
    setError(null);
    const submission: PracticeSubmission = {
      sessionId: crypto.randomUUID(),
      exerciseId: exercise!.id,
      exerciseVersion: exercise!.version,
      childAgeBand: exercise!.childAgeBand,
      listeningAttempts: attempts,
      transcript: transcript.trim(),
      recording: recordingMeta,
      parentObservation: rating,
    };

    try {
      const response = await fetch(`${API_URL}/v1/practice/score`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submission),
      });
      if (!response.ok) throw new Error(String(response.status));
      setScore((await response.json()) as PracticeScore);
      setScreen("report");
    } catch {
      setError("评分暂时失败，录音仍保留在当前浏览器中。请确认 API 已启动后重试。");
    } finally {
      setSubmitting(false);
    }
  }

  async function sendFeedback(helpful: boolean) {
    if (!score) return;
    await fetch(`${API_URL}/v1/practice/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scoreId: score.id, helpful, note: "" }),
    }).catch(() => undefined);
    setFeedbackSent(true);
  }

  async function generateLesson(request: LessonGenerationRequest) {
    setGenerating(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/v1/lessons/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });
      if (!response.ok) throw new Error(String(response.status));
      setLesson((await response.json()) as LessonPlan);
    } catch {
      setError("课程编排失败。请确认 API、模型额度和 LESSON_PROVIDER 配置后重试。");
    } finally {
      setGenerating(false);
    }
  }

  function resetPracticeState() {
    if (recordingUrl) URL.revokeObjectURL(recordingUrl);
    setAttempts([]);
    setTrialIndex(0);
    setReplays(0);
    setTrialStartedAt(Date.now());
    setAnswerState("idle");
    setRecordingUrl(null);
    setRecordingMeta(null);
    setTranscript("");
    setRating(initialRating);
    setScore(null);
    setFeedbackSent(false);
    setError(null);
    setScreen("welcome");
  }

  function resetDemo() {
    resetPracticeState();
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <div className="brand-mark">G</div>
          <div>
            <strong>GrowFun</strong>
            <span>听辨与表达练习</span>
          </div>
        </div>
        <div className="session-meta">
          <span>{lesson ? lessonSourceLabel(lesson.orchestration.generation.source) : generationSourceLabel(exercise.generation.source)}</span>
          <span>{lesson?.request.childAgeBand ?? exercise.childAgeBand}</span>
        </div>
      </header>

      <div className="progress-track" aria-label={`练习进度 ${progress}%`}>
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <main>
        {screen === "welcome" ? (
          <Welcome
            error={error}
            exercise={exercise}
            lesson={lesson}
            generating={generating}
            onGenerate={generateLesson}
            onStart={() => { setError(null); setTrialStartedAt(Date.now()); setScreen("listening"); }}
          />
        ) : null}

        {screen === "listening" && trial ? (
          <section className="practice-layout">
            <div className="step-copy">
              <span className="eyebrow">第 1 部分 · 听辨</span>
              <h1>你听到的是哪个词？</h1>
              <p>先听声音，再选择答案。需要时可以重复播放。</p>
              <div className="trial-count">{trialIndex + 1} / {exercise.listeningTrials.length}</div>
            </div>
            <div className="activity-card listening-card">
              <button className="play-orb" onClick={playTrial} type="button" aria-label="播放单词">
                <span>▶</span>
              </button>
              <p className="listen-hint">点击播放 · 不显示答案文字</p>
              <div className="answer-grid">
                {trial.choices.map((choice) => (
                  <button
                    className="answer-button"
                    disabled={answerState !== "idle"}
                    key={choice}
                    onClick={() => chooseAnswer(choice)}
                    type="button"
                  >
                    {choice}
                  </button>
                ))}
              </div>
              <div className={`answer-feedback ${answerState}`} aria-live="polite">
                {answerState === "correct" ? "听对了！" : answerState === "wrong" ? "没关系，继续听下一题。" : ""}
              </div>
            </div>
          </section>
        ) : null}

        {screen === "speaking" ? (
          <section className="practice-layout speaking-layout">
            <div className="step-copy">
              <span className="eyebrow">第 2 部分 · 表达</span>
              <h1>{exercise.speakingPrompt}</h1>
              <p>最多录制20秒。录音只保留在当前浏览器，API 接收的是转写和录音元数据。</p>
              <button className="text-button" onClick={() => setTranscript(exercise.suggestedSentence)} type="button">
                需要帮助？使用示例句
              </button>
            </div>
            <div className="activity-card recording-card">
              <div className={`record-status ${isRecording ? "active" : ""}`}>
                <span className="record-dot" />
                {isRecording ? "正在录音…" : recordingMeta ? "录音完成" : "准备录音"}
              </div>
              <button
                className={`record-button ${isRecording ? "stop" : ""}`}
                onClick={isRecording ? stopRecording : startRecording}
                type="button"
              >
                {isRecording ? "停止录音" : recordingMeta ? "重新录音" : "开始录音"}
              </button>
              {recordingUrl ? <audio className="audio-player" controls src={recordingUrl} /> : null}

              <label className="field-label" htmlFor="transcript">确认录音转写</label>
              <textarea
                id="transcript"
                onChange={(event) => setTranscript(event.target.value)}
                placeholder="请由家长填写孩子刚才说的句子，或使用左侧示例句。"
                rows={3}
                value={transcript}
              />
              <p className="field-help">内容与语法评分依据这段文字；当前版本不会用它推断发音。</p>

              <ParentRating onChange={setRating} value={rating} />
              {error ? <div className="inline-error">{error}</div> : null}
              <button className="primary-button" disabled={submitting} onClick={submitPractice} type="button">
                {submitting ? "评分中…" : "提交练习并查看报告"}
              </button>
            </div>
          </section>
        ) : null}

        {screen === "report" && score ? (
          <Report
            feedbackSent={feedbackSent}
            onFeedback={sendFeedback}
            onReset={resetDemo}
            score={score}
          />
        ) : null}
      </main>
    </div>
  );
}

function lessonSourceLabel(source: LessonPlan["orchestration"]["generation"]["source"]) {
  if (source === "open_source") return "开源主生成 Agent";
  if (source === "openai") return "OpenAI 主生成 Agent";
  return "本地主生成 Agent";
}

function generationSourceLabel(source: PracticeExercise["generation"]["source"]) {
  if (source === "open_source") return "开源模型 + RAG";
  if (source === "openai") return "OpenAI + RAG";
  return "本地 RAG";
}

function Welcome({
  exercise,
  lesson,
  onStart,
  onGenerate,
  generating,
  error,
}: {
  exercise: PracticeExercise;
  lesson: LessonPlan | null;
  onStart: () => void;
  onGenerate: (request: LessonGenerationRequest) => Promise<void>;
  generating: boolean;
  error: string | null;
}) {
  const [goal, setGoal] = useState("给7岁孩子生成水果主题的听说练习，内容要新颖并包含表达任务");
  const [childAgeBand, setChildAgeBand] = useState(exercise.childAgeBand);
  const [accent, setAccent] = useState<LessonGenerationRequest["accent"]>(exercise.accent);
  const [minutesAvailable, setMinutesAvailable] = useState(10);
  const [activityCount, setActivityCount] = useState(4);
  const promptExamples = ["水果主题听说练习", "动物主题听力与表达", "在商店完成一段简短对话"];

  return (
    <>
      <section className="generator-section" aria-labelledby="generator-title">
        <div>
          <span className="eyebrow">Agentic 课程生成器</span>
          <h1 id="generator-title">你想让孩子练什么？</h1>
          <p>主生成 Agent 自由设计新内容与题型；RAG 提供教学依据，程序负责答案、时长和重复度，审核 Agent 只在必要时介入。</p>
        </div>
        <form
          className="generator-form"
          onSubmit={(event) => {
            event.preventDefault();
            void onGenerate({
              learnerId: "demo-learner",
              prompt: goal,
              childAgeBand,
              accent,
              minutesAvailable,
              activityCount,
            });
          }}
        >
          <label htmlFor="generation-goal">学习目标或家长 Prompt</label>
          <textarea
            id="generation-goal"
            maxLength={200}
            onChange={(event) => setGoal(event.target.value)}
            placeholder="例如：给7岁孩子生成水果主题的听说练习，包含听力理解和情境表达。"
            required
            rows={3}
            value={goal}
          />
          <div className="prompt-examples">
            {promptExamples.map((example) => (
              <button key={example} onClick={() => setGoal(example)} type="button">{example}</button>
            ))}
          </div>
          <div className="generator-options">
            <label>年龄
              <select onChange={(event) => setChildAgeBand(event.target.value)} value={childAgeBand}>
                <option>4–5 岁</option><option>6–8 岁</option><option>9–11 岁</option>
              </select>
            </label>
            <label>发音样本
              <select onChange={(event) => setAccent(event.target.value as LessonGenerationRequest["accent"])} value={accent}>
                <option value="en-GB">英式</option><option value="en-US">美式</option>
              </select>
            </label>
            <label>课程时长
              <select onChange={(event) => setMinutesAvailable(Number(event.target.value))} value={minutesAvailable}>
                <option value={5}>5 分钟</option><option value={10}>10 分钟</option><option value={15}>15 分钟</option>
              </select>
            </label>
            <label>练习数量
              <select onChange={(event) => setActivityCount(Number(event.target.value))} value={activityCount}>
                <option value={2}>2 个</option><option value={3}>3 个</option><option value={4}>4 个</option><option value={5}>5 个</option>
              </select>
            </label>
          </div>
          {error ? <div className="inline-error">{error}</div> : null}
          <button className="primary-button generate-button" disabled={generating || goal.trim().length < 2} type="submit">
            {generating ? "Agent 正在编排课程…" : "生成一套新课程"}
          </button>
        </form>
      </section>

      {lesson ? <LessonPreview lesson={lesson} onStartLegacy={onStart} /> : <section className="hero-grid generated-preview">
      <div className="hero-copy">
        <span className="eyebrow">当前生成结果</span>
        <h1>{exercise.title}</h1>
        <p className="hero-lead">{exercise.targetDescription}</p>
        <div className="lesson-chip-row">
          <span>{generationSourceLabel(exercise.generation.source)}</span>
          <span>{exercise.listeningTrials.length} 道听辨</span>
          <span>{exercise.accent}</span>
        </div>
        <button className="primary-button hero-button" onClick={onStart} type="button">开始这套练习</button>
        <p className="privacy-copy">无需登录 · 不上传原始录音 · 评分结果仅用于 Demo</p>
      </div>
      <div className="lesson-card">
        <div className="lesson-card-top"><span>{exercise.targetLabel}</span><span className="accent-badge">{exercise.accent}</span></div>
        <div className="sound-pair">
          {exercise.words.map((word) => (
            <button key={word.word} onClick={() => speak(word.word, exercise.accent)} type="button">
              <span className="tiny-play">▶</span>
              <strong>{word.word}</strong>
              <small>{word.ipa}</small>
            </button>
          ))}
        </div>
        <div className="lesson-rule"><span>1</span><p>听辨相近声音</p></div>
        <div className="lesson-rule"><span>2</span><p>录制一句表达</p></div>
        <div className="lesson-rule"><span>3</span><p>查看结构化反馈</p></div>
        <div className="rag-evidence">
          <strong>RAG 依据</strong>
          {exercise.generation.evidence.map((item) => (
            <a href={item.sourceUrl} key={item.knowledgeId} rel="noreferrer" target="_blank">
              {item.title}<small>{item.sourceTitle}</small>
            </a>
          ))}
          <p>{exercise.generation.validationChecks.length} 项程序校验已通过{exercise.generation.modelVersion ? ` · ${exercise.generation.modelVersion}` : ""}</p>
        </div>
      </div>
      </section>
      }
    </>
  );
}

function ParentRating({ value, onChange }: { value: Rating; onChange: (value: Rating) => void }) {
  return (
    <div className="parent-rating">
      <h3>家长快速观察</h3>
      <RatingRow
        label="能否听出区别"
        onChange={(listening) => onChange({ ...value, listening: listening as Rating["listening"] })}
        options={[["not_yet", "暂时不能"], ["sometimes", "有时可以"], ["stable", "稳定可以"]]}
        value={value.listening}
      />
      <RatingRow
        label="能否完成表达"
        onChange={(production) => onChange({ ...value, production: production as Rating["production"] })}
        options={[["difficult", "比较困难"], ["needs_prompt", "需要提示"], ["independent", "独立完成"]]}
        value={value.production}
      />
      <RatingRow
        label="本次难度"
        onChange={(difficulty) => onChange({ ...value, difficulty: difficulty as Rating["difficulty"] })}
        options={[["too_easy", "太简单"], ["appropriate", "正合适"], ["too_hard", "太难"]]}
        value={value.difficulty}
      />
    </div>
  );
}

function RatingRow({ label, options, value, onChange }: { label: string; options: Array<readonly [string, string]>; value: string; onChange: (value: string) => void }) {
  return (
    <div className="rating-row">
      <span>{label}</span>
      <div>{options.map(([key, copy]) => <button className={value === key ? "selected" : ""} key={key} onClick={() => onChange(key)} type="button">{copy}</button>)}</div>
    </div>
  );
}

function Report({ score, onReset, onFeedback, feedbackSent }: { score: PracticeScore; onReset: () => void; onFeedback: (helpful: boolean) => void; feedbackSent: boolean }) {
  const dimensions = [
    ["听辨", score.dimensions.listening],
    ["任务完成", score.dimensions.taskCompletion],
    ["内容", score.dimensions.content],
    ["语法", score.dimensions.grammar],
  ] as const;

  return (
    <section className="report-page">
      <div className="report-hero">
        <span className="eyebrow">练习完成</span>
        <div className="score-ring"><strong>{score.overallScore}</strong><span>练习完成度</span></div>
        <div><h1>{score.childMessage}</h1><p>{score.parentMessage}</p></div>
      </div>
      <div className="report-grid">
        <div className="report-card dimension-card">
          <h2>本次表现</h2>
          {dimensions.map(([label, dimension]) => (
            <div className="dimension-row" key={label}>
              <div><span>{label}</span><small>{dimension.evidence}</small></div>
              <div className="bar"><i style={{ width: `${dimension.score}%` }} /></div>
              <strong>{Math.round(dimension.score)}</strong>
            </div>
          ))}
        </div>
        <div className="report-card next-card">
          <span className="card-kicker">做得好的地方</span><h2>{score.strength}</h2>
          <span className="card-kicker warm">下一步</span><p>{score.nextAction}</p>
        </div>
        <div className="report-card transparency-card">
          <h2>评分透明度</h2>
          <p>{score.dimensions.pronunciation.evidence}</p>
          <div className="meta-row"><span>已覆盖评分维度</span><strong>{Math.round(score.scoreCoverage * 100)}%</strong></div>
          <div className="meta-row"><span>内容评分模式</span><strong>{score.provenance.scoringMode === "openai" ? "OpenAI" : "本地规则"}</strong></div>
          <div className="meta-row"><span>评分置信度</span><strong>{Math.round(score.confidence * 100)}%</strong></div>
        </div>
      </div>
      <div className="report-actions">
        {feedbackSent ? <p>感谢反馈，本次 Demo 已记录。</p> : <><span>这份反馈符合你的观察吗？</span><button onClick={() => onFeedback(true)} type="button">符合</button><button onClick={() => onFeedback(false)} type="button">不太符合</button></>}
        <button className="primary-button" onClick={onReset} type="button">重新体验</button>
      </div>
    </section>
  );
}

function LoadingScreen() {
  return <div className="center-state"><div className="brand-mark">G</div><p>正在准备练习…</p></div>;
}

function ErrorScreen({ message }: { message: string }) {
  return <div className="center-state error-state"><div className="brand-mark">G</div><h1>暂时无法开始</h1><p>{message}</p></div>;
}
