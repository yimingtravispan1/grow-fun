import type { KnowledgeMatch } from "@growfun/domain";

type KnowledgeDocument = Omit<KnowledgeMatch, "score">;

const britishCouncilChart = {
  sourceTitle: "British Council TeachingEnglish — Phonemic chart for English teachers",
  sourceUrl:
    "https://www.teachingenglish.org.uk/teaching-resources/teaching-secondary/teaching-tools/phonemic-chart-english-teachers",
};

const britishCouncilMinimalPairs = {
  sourceTitle: "British Council TeachingEnglish — Minimal pair",
  sourceUrl:
    "https://www.teachingenglish.org.uk/professional-development/teachers/teaching-knowledge-database/d-h/minimal-pair",
};

const britishCouncilVoicing = {
  sourceTitle: "British Council TeachingEnglish — Voiced and unvoiced consonants",
  sourceUrl:
    "https://www.teachingenglish.org.uk/teaching-resources/teaching-secondary/activities/beginner-a1/voiced-and-unvoiced-consonants",
};

const ipaChart = {
  sourceTitle: "International Phonetic Association — The IPA Chart",
  sourceUrl: "https://www.internationalphoneticassociation.org/content/ipa-chart",
};

const eefOralLanguage = {
  sourceTitle: "Education Endowment Foundation — Oral language interventions",
  sourceUrl: "https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit/oral-language-interventions",
};

const britishCouncilYoungListening = {
  sourceTitle: "British Council TeachingEnglish — Listening for young learners",
  sourceUrl: "https://www.teachingenglish.org.uk/professional-development/teachers/knowing-subject/listening-young-learners",
};

const cefrActionOriented = {
  sourceTitle: "Council of Europe — Common European Framework of Reference for Languages",
  sourceUrl: "https://www.coe.int/en/web/common-european-framework-reference-languages",
};

function document(
  knowledgeId: string,
  title: string,
  summary: string,
  content: string,
  keywords: string[],
  examples: KnowledgeDocument["examples"],
  source: typeof britishCouncilChart,
): KnowledgeDocument {
  return { knowledgeId, title, summary, content, keywords, examples, ...source };
}

export const pronunciationKnowledge: KnowledgeDocument[] = [
  document(
    "method-purposeful-oral-language",
    "用有意义的互动发展听说能力",
    "听说练习应围绕明确目的、真实情境和语言互动，而不只是孤立记忆单词。",
    "将词汇和句型放进孩子能够理解的任务中，通过示范、结构化提问、对话和表达支架连接听力输入与口语输出。",
    ["水果", "动物", "家庭", "词汇", "听说", "对话", "故事", "主题", "表达", "互动", "口语"],
    [],
    eefOralLanguage,
  ),
  document(
    "method-comprehensible-listening",
    "让儿童带着明确任务听可理解的语言",
    "听力材料应适龄、简短、目的明确，并引导孩子关注需要理解的信息。",
    "使用熟悉主题、短而简单的句子和清楚的关键词。先说明为什么听，再设置具体任务；允许重听、改述和使用背景知识推断。",
    ["听力", "听懂", "适龄", "短句", "理解", "关键词", "任务", "水果", "小故事"],
    [],
    britishCouncilYoungListening,
  ),
  document(
    "method-action-oriented",
    "通过情境任务使用语言",
    "把学习者视为使用语言完成任务的人，课程同时覆盖理解、表达与互动。",
    "使用孩子能识别的生活情境，例如购物、介绍喜好或描述物品。任务需要可观察的沟通结果，并提供符合当前能力的语言支架。",
    ["情境", "任务", "交流", "角色扮演", "水果店", "购物", "喜好", "描述", "互动"],
    [],
    cefrActionOriented,
  ),
  document(
    "method-listen-first",
    "先听辨，再模仿",
    "先确认孩子能听出差异，再进入口型提示和模仿。",
    "每轮先播放两个词，让孩子只判断相同或不同；确认能稳定听辨后，再让孩子看口型并模仿。",
    ["听辨", "听力", "先听", "模仿", "same or different", "same", "different"],
    [],
    britishCouncilChart,
  ),
  document(
    "method-minimal-pairs",
    "用最小对立词突出一个声音差异",
    "一次只比较一个音位差异，降低任务负担。",
    "最小对立词只有一个声音不同。用一组对比词进行听辨和模仿，避免同一轮混入多个新难点。",
    ["最小对立", "minimal pair", "对比词", "两个音"],
    [],
    britishCouncilMinimalPairs,
  ),
  document(
    "method-short-rounds",
    "短轮次、重复练习",
    "将练习拆成短轮次，在孩子注意力下降前结束。",
    "每轮只做三到五次判断或模仿。准确后更换顺序，不靠固定交替让孩子猜答案。",
    ["短时间", "重复", "轮次", "注意力", "亲子"],
    [],
    britishCouncilChart,
  ),
  document(
    "method-neutral-feedback",
    "反馈描述声音，不评价孩子",
    "使用可观察提示，避免把发音结果变成对孩子的评价。",
    "反馈应指出可观察动作，例如声音更长、声带是否振动、气流位置；听错时直接重播，不使用嘲笑或惩罚。",
    ["反馈", "纠音", "鼓励", "家长提示", "错了"],
    [],
    britishCouncilVoicing,
  ),
  document(
    "vowel-i-long-short",
    "/ɪ/ 与 /iː/",
    "比较 ship–sheep 等词，听辨较短、较松与较长、较紧的元音。",
    "保持辅音相同，只比较中间元音。先随机播放，再让孩子模仿；不要只依赖汉字近似音。",
    ["ship", "sheep", "sit", "seat", "短元音", "长元音", "/ɪ/", "/iː/"],
    [
      { word: "ship", ipa: "/ʃɪp/", contrastWord: "sheep", contrastIpa: "/ʃiːp/" },
      { word: "sit", ipa: "/sɪt/", contrastWord: "seat", contrastIpa: "/siːt/" },
    ],
    britishCouncilChart,
  ),
  document(
    "vowel-a-e",
    "/æ/ 与 /e/",
    "比较 bad–bed，听辨两个前元音的差异。",
    "使用 bad–bed、man–men 等对比。先让孩子听出是哪一个词，再观察下巴开合差异并模仿。",
    ["bad", "bed", "man", "men", "/æ/", "/e/"],
    [
      { word: "bad", ipa: "/bæd/", contrastWord: "bed", contrastIpa: "/bed/" },
      { word: "man", ipa: "/mæn/", contrastWord: "men", contrastIpa: "/men/" },
    ],
    britishCouncilChart,
  ),
  document(
    "vowel-a-caret",
    "/æ/ 与 /ʌ/",
    "比较 cap–cup，感受前元音和中央元音的区别。",
    "先随机播放 cap–cup，再提示 /æ/ 时嘴巴更展开，/ʌ/ 更放松居中；提示只作为模仿辅助。",
    ["cap", "cup", "bad", "bud", "/æ/", "/ʌ/"],
    [
      { word: "cap", ipa: "/kæp/", contrastWord: "cup", contrastIpa: "/kʌp/" },
      { word: "bad", ipa: "/bæd/", contrastWord: "bud", contrastIpa: "/bʌd/" },
    ],
    britishCouncilChart,
  ),
  document(
    "vowel-e-i",
    "/e/ 与 /ɪ/",
    "比较 bed–bid，练习相邻前元音的听辨。",
    "保持首尾辅音相同，随机播放 bed–bid。孩子先指认，再跟读，不要求一次完全准确。",
    ["bed", "bid", "set", "sit", "/e/", "/ɪ/"],
    [
      { word: "bed", ipa: "/bed/", contrastWord: "bid", contrastIpa: "/bɪd/" },
      { word: "set", ipa: "/set/", contrastWord: "sit", contrastIpa: "/sɪt/" },
    ],
    britishCouncilChart,
  ),
  document(
    "vowel-u-long-short",
    "/ʊ/ 与 /uː/",
    "比较 full–fool，听辨两个后元音的时长和口形差异。",
    "用 full–fool、pull–pool 进行随机听辨。让孩子先听，再观察圆唇程度并模仿。",
    ["full", "fool", "pull", "pool", "/ʊ/", "/uː/"],
    [
      { word: "full", ipa: "/fʊl/", contrastWord: "fool", contrastIpa: "/fuːl/" },
      { word: "pull", ipa: "/pʊl/", contrastWord: "pool", contrastIpa: "/puːl/" },
    ],
    britishCouncilChart,
  ),
  document(
    "consonant-th-s",
    "/θ/ 与 /s/",
    "比较 thin–sin，注意舌尖位置与连续气流。",
    "听辨 thin–sin 后，让孩子照镜子观察 /θ/ 时舌尖轻触上下齿之间；不要用力咬舌。",
    ["thin", "sin", "th", "咬舌音", "/θ/", "/s/"],
    [{ word: "thin", ipa: "/θɪn/", contrastWord: "sin", contrastIpa: "/sɪn/" }],
    ipaChart,
  ),
  document(
    "consonant-th-z",
    "/ð/ 与 /z/",
    "比较 then–zen，注意舌位与声带振动。",
    "先听 then–zen，再将手指轻放喉部感受两者都有振动；区别主要来自舌尖位置。",
    ["then", "zen", "this", "those", "/ð/", "/z/"],
    [{ word: "then", ipa: "/ðen/", contrastWord: "zen", contrastIpa: "/zen/" }],
    ipaChart,
  ),
  document(
    "consonant-r-l",
    "/r/ 与 /l/",
    "比较 right–light，听辨两个近音的舌位差异。",
    "随机播放 right–light。模仿时提示 /l/ 舌尖接触上齿龈，英语 /r/ 不在该处形成同样接触。",
    ["right", "light", "rice", "lice", "r和l", "/r/", "/l/"],
    [
      { word: "right", ipa: "/raɪt/", contrastWord: "light", contrastIpa: "/laɪt/" },
      { word: "rice", ipa: "/raɪs/", contrastWord: "lice", contrastIpa: "/laɪs/" },
    ],
    ipaChart,
  ),
  document(
    "consonant-v-w",
    "/v/ 与 /w/",
    "比较 vest–west，注意唇齿摩擦与圆唇滑音。",
    "听辨 vest–west。/v/ 时下唇轻触上齿并保持摩擦，/w/ 从圆唇滑向后面的元音。",
    ["vest", "west", "vine", "wine", "v和w", "/v/", "/w/"],
    [
      { word: "vest", ipa: "/vest/", contrastWord: "west", contrastIpa: "/west/" },
      { word: "vine", ipa: "/vaɪn/", contrastWord: "wine", contrastIpa: "/waɪn/" },
    ],
    ipaChart,
  ),
  document(
    "consonant-s-sh",
    "/s/ 与 /ʃ/",
    "比较 sip–ship，听辨两个摩擦音。",
    "先随机听 sip–ship。模仿时比较舌位与嘴唇形状，保持气流连续，不额外添加元音。",
    ["sip", "ship", "see", "she", "s和sh", "/s/", "/ʃ/"],
    [
      { word: "sip", ipa: "/sɪp/", contrastWord: "ship", contrastIpa: "/ʃɪp/" },
      { word: "see", ipa: "/siː/", contrastWord: "she", contrastIpa: "/ʃiː/" },
    ],
    ipaChart,
  ),
  document(
    "consonant-p-b",
    "/p/ 与 /b/",
    "比较 pack–back，感受清浊辅音差异。",
    "随机听 pack–back。将手指放在喉部，比较 /b/ 的声带振动；避免在辅音后加多余元音。",
    ["pack", "back", "pig", "big", "p和b", "清浊", "/p/", "/b/"],
    [
      { word: "pack", ipa: "/pæk/", contrastWord: "back", contrastIpa: "/bæk/" },
      { word: "pig", ipa: "/pɪɡ/", contrastWord: "big", contrastIpa: "/bɪɡ/" },
    ],
    britishCouncilVoicing,
  ),
  document(
    "consonant-t-d",
    "/t/ 与 /d/",
    "比较 tie–die，感受清浊辅音差异。",
    "随机听 tie–die。用喉部触觉帮助孩子发现 /d/ 的声带振动，再交换顺序测试。",
    ["tie", "die", "two", "do", "t和d", "清浊", "/t/", "/d/"],
    [
      { word: "tie", ipa: "/taɪ/", contrastWord: "die", contrastIpa: "/daɪ/" },
      { word: "two", ipa: "/tuː/", contrastWord: "do", contrastIpa: "/duː/" },
    ],
    britishCouncilVoicing,
  ),
  document(
    "consonant-k-g",
    "/k/ 与 /ɡ/",
    "比较 coat–goat，感受同一发音位置上的清浊差异。",
    "随机听 coat–goat。让孩子用手指感受 /ɡ/ 的振动，保持后面的元音相同。",
    ["coat", "goat", "came", "game", "k和g", "清浊", "/k/", "/ɡ/"],
    [
      { word: "coat", ipa: "/kəʊt/", contrastWord: "goat", contrastIpa: "/ɡəʊt/" },
      { word: "came", ipa: "/keɪm/", contrastWord: "game", contrastIpa: "/ɡeɪm/" },
    ],
    britishCouncilVoicing,
  ),
  document(
    "consonant-f-v",
    "/f/ 与 /v/",
    "比较 fan–van，感受唇齿摩擦音的清浊差异。",
    "随机听 fan–van。两个音的唇齿位置相近，/v/ 有声带振动；用手指轻触喉部验证。",
    ["fan", "van", "fine", "vine", "f和v", "清浊", "/f/", "/v/"],
    [
      { word: "fan", ipa: "/fæn/", contrastWord: "van", contrastIpa: "/væn/" },
      { word: "fine", ipa: "/faɪn/", contrastWord: "vine", contrastIpa: "/vaɪn/" },
    ],
    britishCouncilVoicing,
  ),
  document(
    "final-consonants",
    "听清词尾辅音",
    "保留词尾辅音有助于区分不同单词和语法形式。",
    "先比较带词尾辅音和不带词尾辅音的版本，再让孩子轻声、完整地收尾；不要在词尾辅音后添加额外元音。",
    ["词尾", "尾音", "final consonant", "末尾", "漏音"],
    [
      { word: "cap", ipa: "/kæp/", contrastWord: "cat", contrastIpa: "/kæt/" },
      { word: "rice", ipa: "/raɪs/", contrastWord: "ride", contrastIpa: "/raɪd/" },
    ],
    ipaChart,
  ),
  document(
    "word-stress",
    "听辨单词重音",
    "把多音节词看成强弱节奏，而不是每个音节同样用力。",
    "先听整词并拍出重读音节，再慢速分音节，最后恢复自然速度。用大小圆点表示强弱，避免只提高音量。",
    ["重音", "word stress", "音节", "节奏", "多音节"],
    [
      { word: "banana", ipa: "/bəˈnɑːnə/", contrastWord: null, contrastIpa: null },
      { word: "computer", ipa: "/kəmˈpjuːtə/", contrastWord: null, contrastIpa: null },
    ],
    ipaChart,
  ),
  document(
    "schwa",
    "弱读元音 /ə/",
    "非重读音节常出现放松、较短的中央元音。",
    "先听完整单词中的强弱变化，再单独注意非重读音节；不要让每个元音都读得同样清楚和用力。",
    ["弱读", "schwa", "中央元音", "/ə/", "banana", "about"],
    [
      { word: "about", ipa: "/əˈbaʊt/", contrastWord: null, contrastIpa: null },
      { word: "banana", ipa: "/bəˈnɑːnə/", contrastWord: null, contrastIpa: null },
    ],
    britishCouncilChart,
  ),
  document(
    "connected-speech",
    "从单词过渡到短语",
    "孩子能稳定听辨和模仿单词后，再把目标音放回短语。",
    "先练目标词，再放进三到五个词的短语，最后说一句有意义的话。短语阶段保持自然节奏，不逐字停顿。",
    ["连读", "短语", "句子", "connected speech", "自然表达"],
    [],
    britishCouncilChart,
  ),
];
