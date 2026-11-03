import type { PracticeExercise } from "@growfun/domain";

type StoredExercise = { exercise: PracticeExercise; expiresAt: number };

export class InMemoryExerciseStore {
  private readonly entries = new Map<string, StoredExercise>();

  constructor(
    private readonly ttlMs = 2 * 60 * 60 * 1_000,
    private readonly maximumEntries = 100,
  ) {}

  save(exercise: PracticeExercise) {
    this.removeExpired();
    if (this.entries.size >= this.maximumEntries) {
      const oldestId = this.entries.keys().next().value;
      if (oldestId) this.entries.delete(oldestId);
    }
    this.entries.set(exercise.id, { exercise, expiresAt: Date.now() + this.ttlMs });
  }

  get(id: string) {
    const entry = this.entries.get(id);
    if (!entry) return undefined;
    if (entry.expiresAt <= Date.now()) {
      this.entries.delete(id);
      return undefined;
    }
    return entry.exercise;
  }

  private removeExpired() {
    const now = Date.now();
    for (const [id, entry] of this.entries) {
      if (entry.expiresAt <= now) this.entries.delete(id);
    }
  }
}
