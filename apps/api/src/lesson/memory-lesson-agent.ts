import type { LessonActivity, LessonGenerationAgent } from "@growfun/domain";
import { lessonDraftSchema } from "@growfun/domain";

type ActivitySeed = Omit<LessonActivity, "id" | "durationMinutes" | "evidenceIds">;

const fruitActivities: ActivitySeed[] = [
  {
    type: "vocabulary_listening",
    title: "听描述猜水果",
    instruction: "播放描述，让孩子根据关键信息选择水果。",
    stimulus: "This fruit can be red or green. It grows on a tree.",
    question: "描述的是哪一种水果？",
    choices: ["apple", "banana", "grape"],
    answer: "apple",
    answerExplanation: "Apple 可以是红色或绿色，并且长在树上。",
    languageSupport: ["It is...", "I think it is..."],
    targetConcepts: ["apple", "颜色", "描述性听力"],
  },
  {
    type: "listening_comprehension",
    title: "水果店里买了什么",
    instruction: "先听完整短句，再回答数量问题。",
    stimulus: "Mia buys two bananas and one orange at the fruit shop.",
    question: "Mia 买了几个香蕉？",
    choices: ["one", "two", "three"],
    answer: "two",
    answerExplanation: "短句中明确说 two bananas。",
    languageSupport: ["She buys...", "I heard..."],
    targetConcepts: ["banana", "数量", "信息提取"],
  },
  {
    type: "guided_speaking",
    title: "在水果店表达选择",
    instruction: "让孩子选择一种水果，并用句型完成购买请求。",
    stimulus: "You are at a fruit shop. Choose one fruit you would like to buy.",
    question: "你会怎样告诉店员想买什么？",
    choices: [],
    answer: "I would like an apple, please.",
    answerExplanation: "示例使用礼貌请求句型，孩子可以替换水果名称。",
    languageSupport: ["I would like...", "Can I have... please?"],
    targetConcepts: ["礼貌请求", "水果词汇", "情境表达"],
  },
  {
    type: "vocabulary_listening",
    title: "根据动作找到水果",
    instruction: "听一个生活动作，选择最符合的水果。",
    stimulus: "Peel the long yellow fruit before you eat it.",
    question: "应该选择哪一种水果？",
    choices: ["banana", "apple", "orange"],
    answer: "banana",
    answerExplanation: "Banana 通常是长形、黄色，而且食用前需要剥皮。",
    languageSupport: ["It is a...", "The key word is..."],
    targetConcepts: ["banana", "peel", "语义线索"],
  },
  {
    type: "listening_comprehension",
    title: "听喜好做判断",
    instruction: "听孩子的喜好，再选择正确答案。",
    stimulus: "Leo likes grapes, but he does not like oranges.",
    question: "Leo 喜欢什么？",
    choices: ["grapes", "oranges", "apples"],
    answer: "grapes",
    answerExplanation: "句子先说明 Leo likes grapes。",
    languageSupport: ["He likes...", "He does not like..."],
    targetConcepts: ["grapes", "like", "否定信息"],
  },
];

const fruitActivitiesAlternate: ActivitySeed[] = [
  {
    type: "listening_comprehension",
    title: "野餐篮里有什么",
    instruction: "听野餐准备清单，找到没有被提到的水果。",
    stimulus: "For our picnic, we pack apples, grapes and a watermelon.",
    question: "哪一种水果没有放进野餐篮？",
    choices: ["banana", "grapes", "watermelon"],
    answer: "banana",
    answerExplanation: "清单提到 apples、grapes 和 watermelon，没有提到 banana。",
    languageSupport: ["They pack...", "They do not pack..."],
    targetConcepts: ["水果清单", "否定推断", "野餐情境"],
  },
  {
    type: "vocabulary_listening",
    title: "颜色和大小线索",
    instruction: "听谜语中的颜色与大小信息，选择正确水果。",
    stimulus: "I am small, purple, and I grow in a bunch.",
    question: "谜底是什么？",
    choices: ["grape", "pear", "watermelon"],
    answer: "grape",
    answerExplanation: "Grapes 通常较小，成串生长，也可以是紫色。",
    languageSupport: ["It is small...", "It grows..."],
    targetConcepts: ["grape", "形容词", "谜语听力"],
  },
  {
    type: "guided_speaking",
    title: "设计一份水果沙拉",
    instruction: "选择两种水果，说出自己的水果沙拉配方。",
    stimulus: "You can choose two fruits for a colourful fruit salad.",
    question: "你的水果沙拉里有什么？",
    choices: [],
    answer: "My fruit salad has strawberries and bananas.",
    answerExplanation: "示例提供 has 句型，孩子可以自由替换两种水果。",
    languageSupport: ["My fruit salad has...", "I choose... and..."],
    targetConcepts: ["水果组合", "and", "自主表达"],
  },
  {
    type: "listening_comprehension",
    title: "比较两个人的选择",
    instruction: "听两个人分别选择什么，再回答对应问题。",
    stimulus: "Nora chooses a pear. Sam chooses a peach.",
    question: "谁选择了桃子？",
    choices: ["Nora", "Sam", "Both"],
    answer: "Sam",
    answerExplanation: "第二句明确说 Sam chooses a peach。",
    languageSupport: ["... chooses...", "It was..."],
    targetConcepts: ["pear", "peach", "人物对应"],
  },
  {
    type: "guided_speaking",
    title: "推荐一种水果",
    instruction: "向家长推荐一种水果，并给出一个简单理由。",
    stimulus: "Recommend one fruit for a snack and say why.",
    question: "你推荐什么？为什么？",
    choices: [],
    answer: "I recommend an orange because it is juicy.",
    answerExplanation: "示例使用 because 连接选择和理由。",
    languageSupport: ["I recommend...", "because it is..."],
    targetConcepts: ["推荐", "because", "水果描述"],
  },
];

const generalActivities: ActivitySeed[] = [
  {
    type: "vocabulary_listening",
    title: "听关键词选答案",
    instruction: "听简短提示，选择本次学习主题。",
    stimulus: "Listen for the key idea in today's topic.",
    question: "今天练习的内容是什么？",
    choices: ["the requested topic", "an unrelated topic"],
    answer: "the requested topic",
    answerExplanation: "练习围绕家长指定的主题展开。",
    languageSupport: ["The topic is..."],
    targetConcepts: ["主题词汇", "关键词"],
  },
  {
    type: "listening_comprehension",
    title: "听懂一句关键信息",
    instruction: "先听主旨，再选择说话者的目的。",
    stimulus: "I am learning new words so I can talk about this topic.",
    question: "说话者为什么学习新词？",
    choices: ["to talk about the topic", "to stop the lesson"],
    answer: "to talk about the topic",
    answerExplanation: "句子使用 so 表达学习新词的目的。",
    languageSupport: ["The speaker wants to..."],
    targetConcepts: ["主旨", "学习目的"],
  },
  {
    type: "guided_speaking",
    title: "用一句话表达",
    instruction: "根据家长给出的主题，说一句自己知道或喜欢的内容。",
    stimulus: "Say one thing you know or like about the topic.",
    question: "你能用一句英语表达吗？",
    choices: [],
    answer: "I like learning about this topic.",
    answerExplanation: "答案是表达支架，不要求孩子逐字照读。",
    languageSupport: ["I like...", "I know...", "My favourite... is..."],
    targetConcepts: ["自主表达", "句型支架"],
  },
  {
    type: "listening_comprehension",
    title: "听后核对细节",
    instruction: "第二次听时注意具体细节。",
    stimulus: "First listen for the big idea. Then listen again for one detail.",
    question: "第二次听的时候要注意什么？",
    choices: ["one detail", "a new topic"],
    answer: "one detail",
    answerExplanation: "提示明确要求第二次听一个具体细节。",
    languageSupport: ["I heard..."],
    targetConcepts: ["细节听力", "重听策略"],
  },
  {
    type: "guided_speaking",
    title: "向家长提一个问题",
    instruction: "围绕本次主题提出一个简短问题。",
    stimulus: "Ask one question about today's topic.",
    question: "你想了解什么？",
    choices: [],
    answer: "What do you like about this topic?",
    answerExplanation: "示例展示开放式问题，孩子可以替换关键词。",
    languageSupport: ["What is...?", "Do you like...?", "Why do...?"],
    targetConcepts: ["提问", "互动"],
  },
];

function durations(minutesAvailable: number, activityCount: number) {
  const base = Math.floor(minutesAvailable / activityCount);
  const remainder = minutesAvailable % activityCount;
  return Array.from({ length: activityCount }, (_, index) => base + (index < remainder ? 1 : 0));
}

export function createMemoryLessonAgent(): LessonGenerationAgent {
  return {
    mode: "memory",
    modelVersion: null,
    async generate({ request, evidence, recentLessons }) {
      const fruitTheme = /水果|apple|banana|orange|grape|fruit/i.test(request.prompt);
      const seeds = fruitTheme
        ? recentLessons.length % 2 === 0
          ? fruitActivities
          : fruitActivitiesAlternate
        : generalActivities;
      const offset = fruitTheme ? 0 : recentLessons.length % seeds.length;
      const selected = Array.from(
        { length: request.activityCount },
        (_, index) => seeds[(index + offset) % seeds.length]!,
      );
      const allocatedMinutes = durations(request.minutesAvailable, request.activityCount);

      return lessonDraftSchema.parse({
        title: fruitTheme ? "水果小侦探：听懂、选择和表达" : `围绕“${request.prompt.slice(0, 24)}”的听说任务`,
        summary: fruitTheme
          ? "通过描述、短句和水果店情境，把词汇理解逐步迁移到真实表达。"
          : "先带着任务听关键信息，再使用句型支架完成简短表达。",
        learningObjectives: fruitTheme
          ? ["听懂常见水果名称与描述", "从短句中提取数量和喜好信息", "在购物情境中完成一句表达"]
          : ["带着明确任务理解简短输入", "提取主旨和一个细节", "使用句型支架完成表达"],
        activities: selected.map((seed, index) => ({
          ...seed,
          id: `activity-${index + 1}`,
          durationMinutes: allocatedMinutes[index],
          evidenceIds: [evidence[index % evidence.length]!.knowledgeId],
        })),
        parentNote: "先播放完整内容，不要求孩子听懂每个词；需要时重听一次，并鼓励使用提供的句型支架。",
        riskFlags: [],
      });
    },
  };
}
