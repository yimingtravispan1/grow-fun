import type { LessonActivityType, LessonPlan } from "@growfun/domain";

const activityLabels: Record<LessonActivityType, string> = {
  sound_discrimination: "声音辨别",
  vocabulary_listening: "词汇听力",
  listening_comprehension: "听力理解",
  guided_speaking: "引导表达",
};

const workflowLabels: Record<LessonPlan["orchestration"]["events"][number]["state"], string> = {
  received: "接收需求",
  retrieved: "检索教材",
  generated: "生成内容",
  validated: "程序校验",
  reviewed: "Agent 审核",
  revising: "定向修订",
  published: "发布课程",
};

function speak(text: string, language: string) {
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = language;
  utterance.rate = 0.76;
  window.speechSynthesis.speak(utterance);
}

function sourceLabel(source: LessonPlan["orchestration"]["generation"]["source"]) {
  if (source === "open_source") return "开源模型 + RAG";
  if (source === "openai") return "OpenAI + RAG";
  return "本地编排 + RAG";
}

export function LessonPreview({ lesson, onStartLegacy }: { lesson: LessonPlan; onStartLegacy: () => void }) {
  const reviewCopy =
    lesson.orchestration.review.status === "not_required"
      ? "成本策略：未调用审核模型"
      : lesson.orchestration.review.status === "revised"
        ? "审核后已修订"
        : "教学审核已通过";
  const uniqueEvents = lesson.orchestration.events.filter(
    (event, index, events) => events.findIndex(({ state }) => state === event.state) === index,
  );

  return (
    <section className="agentic-preview" aria-labelledby="lesson-title">
      <div className="course-heading">
        <div>
          <span className="eyebrow">本次 Agentic Workflow 结果</span>
          <h1 id="lesson-title">{lesson.title}</h1>
          <p>{lesson.summary}</p>
        </div>
        <div className="course-meta-card">
          <strong>{sourceLabel(lesson.orchestration.generation.source)}</strong>
          <span>{lesson.request.activityCount} 个练习 · {lesson.request.minutesAvailable} 分钟</span>
          <span>{reviewCopy}</span>
          <span>与最近 {lesson.orchestration.novelty.comparedLessons} 套课程查重</span>
          {lesson.orchestration.generation.modelVersion ? <small>{lesson.orchestration.generation.modelVersion}</small> : null}
        </div>
      </div>

      <div className="workflow-strip" aria-label="课程生成工作流">
        {uniqueEvents.map((event, index) => (
          <div key={`${event.state}-${index}`}><span>{index + 1}</span><strong>{workflowLabels[event.state]}</strong></div>
        ))}
      </div>

      <div className="objective-row">
        {lesson.learningObjectives.map((objective) => <span key={objective}>{objective}</span>)}
      </div>

      <div className="course-activity-grid">
        {lesson.activities.map((activity, index) => (
          <article className="course-activity" key={activity.id}>
            <div className="activity-heading">
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div><small>{activityLabels[activity.type]} · {activity.durationMinutes} 分钟</small><h2>{activity.title}</h2></div>
            </div>
            <p>{activity.instruction}</p>
            <div className="stimulus-box">
              <button aria-label={`播放：${activity.title}`} onClick={() => speak(activity.stimulus, lesson.request.accent)} type="button">▶</button>
              <span>{activity.stimulus}</span>
            </div>
            <h3>{activity.question}</h3>
            {activity.choices.length > 0 ? (
              <div className="course-choices">{activity.choices.map((choice) => <span key={choice}>{choice}</span>)}</div>
            ) : (
              <div className="language-support">{activity.languageSupport.map((support) => <span key={support}>{support}</span>)}</div>
            )}
            <details><summary>查看答案与设计依据</summary><strong>{activity.answer}</strong><p>{activity.answerExplanation}</p></details>
            <div className="evidence-id-row">{activity.evidenceIds.map((id) => <span key={id}>{id}</span>)}</div>
          </article>
        ))}
      </div>

      <div className="agentic-audit-grid">
        <div className="audit-card">
          <span className="eyebrow">RAG 教材依据</span>
          {lesson.evidence.map((item) => (
            <a href={item.sourceUrl} key={item.knowledgeId} rel="noreferrer" target="_blank">
              <strong>{item.title}</strong><small>{item.sourceTitle}</small>
            </a>
          ))}
        </div>
        <div className="audit-card">
          <span className="eyebrow">确定性质量门</span>
          {lesson.orchestration.validationChecks.map((check) => <p key={check}>✓ {check}</p>)}
        </div>
        <div className="audit-card parent-note">
          <span className="eyebrow">给家长的使用提示</span>
          <p>{lesson.parentNote}</p>
          <button className="text-button" onClick={onStartLegacy} type="button">体验原有发音评分 Demo →</button>
        </div>
      </div>
    </section>
  );
}
