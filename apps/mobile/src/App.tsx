import { StatusBar } from "expo-status-bar";
import * as Speech from "expo-speech";
import { useMemo, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

type PracticeItem = {
  word: string;
  ipa: string;
  contrastWord: string | null;
  contrastIpa: string | null;
};

type JourneyStep = {
  title: string;
  guidance: string;
  minutes: number;
  activityType: "notice" | "listen" | "contrast" | "produce" | "reflect";
  practiceItems: PracticeItem[];
};

type Evidence = {
  knowledgeId: string;
  title: string;
  summary: string;
  sourceTitle: string;
  sourceUrl: string;
  score: number;
};

type DailyJourney = {
  id: string;
  title: string;
  focus: string;
  steps: JourneyStep[];
  parentNote: string;
  evidence: Evidence[];
  review: {
    status: "demo_reviewed" | "ai_generated";
    checks: string[];
  };
  source: "memory" | "openai";
};

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://127.0.0.1:3000";
const ageBands = ["3–5 岁", "6–8 岁", "9–12 岁"];
const minuteOptions = [5, 10, 15];
const goalPresets = [
  "辨别并练习 ship 和 sheep",
  "练习 right 和 light 的区别",
  "听出 fan 和 van 的不同",
  "练习单词重音和节奏",
];

export default function App() {
  const [ageBand, setAgeBand] = useState(ageBands[1]);
  const [goal, setGoal] = useState(goalPresets[0]);
  const [minutes, setMinutes] = useState(10);
  const [journey, setJourney] = useState<DailyJourney | null>(null);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<"helpful" | "hard" | null>(null);

  const allComplete = useMemo(
    () => Boolean(journey && completedSteps.length === journey.steps.length),
    [completedSteps.length, journey],
  );

  async function prepareJourney() {
    if (!goal.trim()) {
      setError("请先写下今天想练习的声音或听辨目标。");
      return;
    }

    setLoading(true);
    setError(null);
    setFeedback(null);

    try {
      const response = await fetch(`${API_URL}/v1/journeys/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          familyId: "simulator-family",
          childAgeBand: ageBand,
          goal: goal.trim(),
          minutesAvailable: minutes,
        }),
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const result = (await response.json()) as DailyJourney;
      setJourney(result);
      setCompletedSteps([]);
    } catch {
      setError(`暂时无法连接本地服务（${API_URL}）。请确认 API 已启动后重试。`);
    } finally {
      setLoading(false);
    }
  }

  function speak(word: string) {
    Speech.stop();
    Speech.speak(word, { language: "en-GB", pitch: 1, rate: 0.68 });
  }

  function toggleStep(index: number) {
    setCompletedSteps((current) =>
      current.includes(index) ? current.filter((item) => item !== index) : [...current, index],
    );
  }

  function startOver() {
    Speech.stop();
    setJourney(null);
    setCompletedSteps([]);
    setFeedback(null);
    setError(null);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.brandMark}>
            <Text style={styles.brandMarkText}>G</Text>
          </View>
          <View>
            <Text style={styles.brand}>GrowFun</Text>
            <Text style={styles.subtitle}>科学听辨 · 亲子发音练习</Text>
          </View>
        </View>

        {!journey ? (
          <View style={styles.card}>
            <Text style={styles.kicker}>RAG 课程 Demo</Text>
            <Text style={styles.title}>今天练哪组声音？</Text>
            <Text style={styles.body}>
              系统先从审核知识库检索相关方法，再生成一段“先听辨、后模仿”的亲子练习。
            </Text>

            <Text style={styles.label}>孩子年龄</Text>
            <View style={styles.optionsRow}>
              {ageBands.map((item) => (
                <Choice key={item} label={item} selected={ageBand === item} onPress={() => setAgeBand(item)} />
              ))}
            </View>

            <Text style={styles.label}>快速选择</Text>
            <View style={styles.presetList}>
              {goalPresets.map((item) => (
                <Pressable
                  key={item}
                  onPress={() => setGoal(item)}
                  style={[styles.preset, goal === item && styles.presetSelected]}
                >
                  <Text style={[styles.presetText, goal === item && styles.presetTextSelected]}>{item}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>或输入目标</Text>
            <TextInput
              accessibilityLabel="今天的发音目标"
              multiline
              onChangeText={setGoal}
              placeholder="例如：孩子总把 ship 听成 sheep"
              placeholderTextColor="#8B918A"
              style={styles.input}
              value={goal}
            />

            <Text style={styles.label}>可用时间</Text>
            <View style={styles.optionsRow}>
              {minuteOptions.map((item) => (
                <Choice
                  key={item}
                  label={`${item} 分钟`}
                  selected={minutes === item}
                  onPress={() => setMinutes(item)}
                />
              ))}
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <PrimaryButton disabled={loading} onPress={prepareJourney}>
              {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>检索并生成课程</Text>}
            </PrimaryButton>
            <Text style={styles.privacyNote}>Demo 不录音、不评分，也不会保存孩子资料。</Text>
          </View>
        ) : (
          <View style={styles.card}>
            <View style={styles.journeyTopRow}>
              <Text style={styles.kicker}>约 {journey.steps.reduce((sum, step) => sum + step.minutes, 0)} 分钟</Text>
              <Text style={styles.sourceBadge}>{journey.source === "openai" ? "AI + RAG" : "本地 RAG"}</Text>
            </View>
            <Text style={styles.title}>{journey.title}</Text>
            <Text style={styles.focus}>{journey.focus}</Text>

            <View style={styles.steps}>
              {journey.steps.map((step, index) => {
                const complete = completedSteps.includes(index);
                return (
                  <View key={`${step.title}-${index}`} style={[styles.step, complete && styles.stepComplete]}>
                    <Pressable
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: complete }}
                      onPress={() => toggleStep(index)}
                      style={[styles.stepNumber, complete && styles.stepNumberComplete]}
                    >
                      <Text style={[styles.stepNumberText, complete && styles.stepNumberTextComplete]}>
                        {complete ? "✓" : index + 1}
                      </Text>
                    </Pressable>
                    <View style={styles.stepCopy}>
                      <View style={styles.stepTitleRow}>
                        <Text style={styles.stepTitle}>{step.title}</Text>
                        <Text style={styles.stepMinutes}>{step.minutes} 分钟</Text>
                      </View>
                      <Text style={styles.stepGuidance}>{step.guidance}</Text>
                      {step.practiceItems.length > 0 ? (
                        <View style={styles.audioRows}>
                          {step.practiceItems.map((item) => (
                            <View key={`${step.title}-${item.word}`} style={styles.audioRow}>
                              <WordButton ipa={item.ipa} onPress={() => speak(item.word)} word={item.word} />
                              {item.contrastWord && item.contrastIpa ? (
                                <>
                                  <Text style={styles.versus}>vs</Text>
                                  <WordButton
                                    ipa={item.contrastIpa}
                                    onPress={() => speak(item.contrastWord as string)}
                                    word={item.contrastWord}
                                  />
                                </>
                              ) : null}
                            </View>
                          ))}
                        </View>
                      ) : null}
                    </View>
                  </View>
                );
              })}
            </View>

            <View style={styles.parentNote}>
              <Text style={styles.parentNoteTitle}>给家长的小提示</Text>
              <Text style={styles.parentNoteText}>{journey.parentNote}</Text>
            </View>

            <View style={styles.evidenceCard}>
              <View style={styles.evidenceHeader}>
                <Text style={styles.evidenceTitle}>这节课检索了什么？</Text>
                <Text style={styles.reviewBadge}>
                  {journey.review.status === "demo_reviewed" ? "规则审核" : "AI 生成"}
                </Text>
              </View>
              {journey.evidence.map((evidence, index) => (
                <View key={evidence.knowledgeId} style={styles.evidenceItem}>
                  <Text style={styles.evidenceIndex}>{index + 1}</Text>
                  <View style={styles.evidenceCopy}>
                    <Text style={styles.evidenceItemTitle}>{evidence.title}</Text>
                    <Text style={styles.evidenceSummary}>{evidence.summary}</Text>
                    <Pressable onPress={() => Linking.openURL(evidence.sourceUrl)}>
                      <Text style={styles.sourceLink}>来源：{evidence.sourceTitle} ↗</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>

            {allComplete ? (
              <View style={styles.feedbackCard}>
                <Text style={styles.feedbackTitle}>完成啦！这次活动感觉如何？</Text>
                <View style={styles.optionsRow}>
                  <Choice label="听辨更清楚" selected={feedback === "helpful"} onPress={() => setFeedback("helpful")} />
                  <Choice label="还是有点难" selected={feedback === "hard"} onPress={() => setFeedback("hard")} />
                </View>
                {feedback ? <Text style={styles.success}>反馈已记录在本次模拟会话中。</Text> : null}
              </View>
            ) : (
              <Text style={styles.progressText}>点击步骤编号完成练习 · {completedSteps.length}/{journey.steps.length}</Text>
            )}

            <Pressable onPress={startOver} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>换一组声音</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function WordButton({ word, ipa, onPress }: { word: string; ipa: string; onPress: () => void }) {
  return (
    <Pressable accessibilityLabel={`播放 ${word}`} onPress={onPress} style={styles.wordButton}>
      <Text style={styles.speaker}>▶</Text>
      <View>
        <Text style={styles.word}>{word}</Text>
        <Text style={styles.ipa}>{ipa}</Text>
      </View>
    </Pressable>
  );
}

function Choice({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.choice, selected && styles.choiceSelected]}>
      <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>{label}</Text>
    </Pressable>
  );
}

function PrimaryButton({ children, disabled, onPress }: { children: ReactNode; disabled: boolean; onPress: () => void }) {
  return (
    <Pressable disabled={disabled} onPress={onPress} style={[styles.primaryButton, disabled && styles.buttonDisabled]}>
      {children}
    </Pressable>
  );
}

const colors = {
  ink: "#18312B",
  forest: "#286052",
  mint: "#DDEEE7",
  cream: "#F6F2E8",
  paper: "#FFFDF8",
  muted: "#66736E",
  line: "#DDE3DE",
  coral: "#C76652",
  gold: "#8B652E",
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.cream },
  page: { padding: 20, paddingBottom: 48 },
  header: { alignItems: "center", flexDirection: "row", gap: 12, marginBottom: 22, marginTop: 8 },
  brandMark: { alignItems: "center", backgroundColor: colors.forest, borderRadius: 14, height: 44, justifyContent: "center", width: 44 },
  brandMarkText: { color: "#FFFFFF", fontSize: 23, fontWeight: "800" },
  brand: { color: colors.ink, fontSize: 19, fontWeight: "800" },
  subtitle: { color: colors.muted, fontSize: 12, marginTop: 2 },
  card: { backgroundColor: colors.paper, borderRadius: 28, padding: 22, shadowColor: colors.ink, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.08, shadowRadius: 24 },
  kicker: { color: colors.forest, fontSize: 12, fontWeight: "800", letterSpacing: 1.1, textTransform: "uppercase" },
  title: { color: colors.ink, fontSize: 29, fontWeight: "800", lineHeight: 36, marginTop: 10 },
  body: { color: colors.muted, fontSize: 15, lineHeight: 23, marginTop: 10 },
  focus: { backgroundColor: colors.mint, borderRadius: 14, color: colors.forest, fontSize: 14, lineHeight: 21, marginTop: 12, padding: 13 },
  label: { color: colors.ink, fontSize: 14, fontWeight: "700", marginBottom: 9, marginTop: 22 },
  optionsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  choice: { backgroundColor: "#F0F2EE", borderColor: "transparent", borderRadius: 18, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10 },
  choiceSelected: { backgroundColor: colors.mint, borderColor: colors.forest },
  choiceText: { color: colors.muted, fontSize: 14, fontWeight: "600" },
  choiceTextSelected: { color: colors.forest },
  presetList: { gap: 8 },
  preset: { backgroundColor: "#F5F5F1", borderColor: colors.line, borderRadius: 14, borderWidth: 1, paddingHorizontal: 13, paddingVertical: 11 },
  presetSelected: { backgroundColor: colors.mint, borderColor: colors.forest },
  presetText: { color: colors.muted, fontSize: 14, fontWeight: "600" },
  presetTextSelected: { color: colors.forest, fontWeight: "800" },
  input: { backgroundColor: "#F5F5F1", borderColor: colors.line, borderRadius: 16, borderWidth: 1, color: colors.ink, fontSize: 16, lineHeight: 23, minHeight: 78, padding: 14, textAlignVertical: "top" },
  error: { color: colors.coral, fontSize: 13, lineHeight: 19, marginTop: 16 },
  primaryButton: { alignItems: "center", backgroundColor: colors.forest, borderRadius: 17, height: 54, justifyContent: "center", marginTop: 24 },
  primaryButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
  buttonDisabled: { opacity: 0.6 },
  privacyNote: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 12, textAlign: "center" },
  journeyTopRow: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  sourceBadge: { backgroundColor: colors.mint, borderRadius: 12, color: colors.forest, fontSize: 11, fontWeight: "700", overflow: "hidden", paddingHorizontal: 9, paddingVertical: 5 },
  steps: { gap: 11, marginTop: 22 },
  step: { borderColor: colors.line, borderRadius: 18, borderWidth: 1, flexDirection: "row", gap: 12, padding: 14 },
  stepComplete: { backgroundColor: "#F1F8F4", borderColor: "#AACABD" },
  stepNumber: { alignItems: "center", borderColor: colors.line, borderRadius: 14, borderWidth: 1, height: 28, justifyContent: "center", width: 28 },
  stepNumberComplete: { backgroundColor: colors.forest, borderColor: colors.forest },
  stepNumberText: { color: colors.muted, fontSize: 13, fontWeight: "800" },
  stepNumberTextComplete: { color: "#FFFFFF" },
  stepCopy: { flex: 1 },
  stepTitleRow: { alignItems: "center", flexDirection: "row", gap: 8, justifyContent: "space-between" },
  stepTitle: { color: colors.ink, flex: 1, fontSize: 16, fontWeight: "800" },
  stepMinutes: { color: colors.muted, fontSize: 12 },
  stepGuidance: { color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: 6 },
  audioRows: { gap: 8, marginTop: 12 },
  audioRow: { alignItems: "center", flexDirection: "row", gap: 7 },
  wordButton: { alignItems: "center", backgroundColor: colors.mint, borderRadius: 12, flexDirection: "row", gap: 7, paddingHorizontal: 10, paddingVertical: 7 },
  speaker: { color: colors.forest, fontSize: 10 },
  word: { color: colors.ink, fontSize: 14, fontWeight: "800" },
  ipa: { color: colors.muted, fontSize: 11, marginTop: 1 },
  versus: { color: colors.muted, fontSize: 11, fontWeight: "700" },
  parentNote: { backgroundColor: "#FFF4DF", borderRadius: 16, marginTop: 18, padding: 15 },
  parentNoteTitle: { color: "#76552D", fontSize: 13, fontWeight: "800" },
  parentNoteText: { color: "#76552D", fontSize: 13, lineHeight: 20, marginTop: 5 },
  evidenceCard: { borderColor: colors.line, borderRadius: 18, borderWidth: 1, marginTop: 18, padding: 15 },
  evidenceHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 3 },
  evidenceTitle: { color: colors.ink, fontSize: 15, fontWeight: "800" },
  reviewBadge: { backgroundColor: "#F1E9D8", borderRadius: 10, color: colors.gold, fontSize: 10, fontWeight: "800", overflow: "hidden", paddingHorizontal: 8, paddingVertical: 4 },
  evidenceItem: { borderTopColor: colors.line, borderTopWidth: 1, flexDirection: "row", gap: 10, marginTop: 12, paddingTop: 12 },
  evidenceIndex: { color: colors.forest, fontSize: 12, fontWeight: "800" },
  evidenceCopy: { flex: 1 },
  evidenceItemTitle: { color: colors.ink, fontSize: 13, fontWeight: "800" },
  evidenceSummary: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 3 },
  sourceLink: { color: colors.forest, fontSize: 11, lineHeight: 16, marginTop: 5, textDecorationLine: "underline" },
  progressText: { color: colors.muted, fontSize: 13, marginTop: 18, textAlign: "center" },
  feedbackCard: { backgroundColor: colors.mint, borderRadius: 18, marginTop: 18, padding: 16 },
  feedbackTitle: { color: colors.ink, fontSize: 15, fontWeight: "800", marginBottom: 12 },
  success: { color: colors.forest, fontSize: 12, marginTop: 10 },
  secondaryButton: { alignItems: "center", borderColor: colors.line, borderRadius: 17, borderWidth: 1, height: 50, justifyContent: "center", marginTop: 18 },
  secondaryButtonText: { color: colors.forest, fontSize: 15, fontWeight: "700" },
});
