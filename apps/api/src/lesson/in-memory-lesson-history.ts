import type { LessonPlan, RecentLessonSummary } from "@growfun/domain";

export interface LessonHistoryStore {
  recent(learnerId: string, limit?: number): RecentLessonSummary[];
  save(learnerId: string, lesson: LessonPlan): void;
}

export class InMemoryLessonHistoryStore implements LessonHistoryStore {
  private readonly lessonsByLearner = new Map<string, LessonPlan[]>();

  constructor(private readonly maximumLessonsPerLearner = 50) {}

  recent(learnerId: string, limit = 10): RecentLessonSummary[] {
    return (this.lessonsByLearner.get(learnerId) ?? [])
      .slice(-limit)
      .reverse()
      .map(({ id, title, learningObjectives, activities }) => ({ id, title, learningObjectives, activities }));
  }

  save(learnerId: string, lesson: LessonPlan) {
    const lessons = [...(this.lessonsByLearner.get(learnerId) ?? []), lesson].slice(-this.maximumLessonsPerLearner);
    this.lessonsByLearner.set(learnerId, lessons);
  }
}

