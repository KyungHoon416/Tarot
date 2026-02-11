const chatEl = document.querySelector("#chat");
const formEl = document.querySelector("#input-form");
const inputEl = document.querySelector("#user-input");
const sendBtnEl = document.querySelector("#send-btn");
const messageTemplate = document.querySelector("#message-template");
const cardPickerEl = document.querySelector("#card-picker");
const cardGridEl = document.querySelector("#card-grid");
const pickerStatusEl = document.querySelector("#picker-status");
const tarotSourceUrl = "https://tarotapi.dev/api/v1/cards";

const tarotDeck = [
  { id: 1, name: "The Fool", meanings: ["새출발", "호기심", "모험"], tags: ["설렘", "도전", "변화"] },
  { id: 2, name: "The Magician", meanings: ["집중", "실행력", "의지"], tags: ["결단", "성장", "도전"] },
  { id: 3, name: "The High Priestess", meanings: ["직관", "비밀", "내면"], tags: ["사색", "치유", "회복"] },
  { id: 4, name: "The Empress", meanings: ["풍요", "돌봄", "매력"], tags: ["로맨스", "설렘", "연결"] },
  { id: 5, name: "The Emperor", meanings: ["질서", "안정", "책임"], tags: ["결단", "정리", "성장"] },
  { id: 6, name: "The Hierophant", meanings: ["가치관", "전통", "학습"], tags: ["성장", "사색", "결단"] },
  { id: 7, name: "The Lovers", meanings: ["선택", "관계", "조화"], tags: ["로맨스", "연결", "결단"] },
  { id: 8, name: "The Chariot", meanings: ["전진", "통제", "승리"], tags: ["도전", "결단", "성장"] },
  { id: 9, name: "Strength", meanings: ["용기", "인내", "균형"], tags: ["회복", "성장", "결단"] },
  { id: 10, name: "The Hermit", meanings: ["고독", "탐구", "성찰"], tags: ["사색", "회복", "정리"] },
  { id: 11, name: "Wheel of Fortune", meanings: ["전환", "순환", "기회"], tags: ["변화", "희망", "결단"] },
  { id: 12, name: "Justice", meanings: ["균형", "판단", "원칙"], tags: ["결단", "정리", "성장"] },
  { id: 13, name: "The Hanged Man", meanings: ["멈춤", "관점전환", "양보"], tags: ["사색", "정리", "회복"] },
  { id: 14, name: "Death", meanings: ["종결", "이별", "재시작"], tags: ["정리", "변화", "새출발"] },
  { id: 15, name: "Temperance", meanings: ["절제", "조율", "회복"], tags: ["회복", "치유", "성장"] },
  { id: 16, name: "The Devil", meanings: ["집착", "유혹", "속박"], tags: ["불안", "정리", "결단"] },
  { id: 17, name: "The Tower", meanings: ["충격", "붕괴", "각성"], tags: ["불안", "변화", "정리"] },
  { id: 18, name: "The Star", meanings: ["희망", "회복", "영감"], tags: ["희망", "치유", "성장"] },
  { id: 19, name: "The Moon", meanings: ["불확실", "감정", "환상"], tags: ["불안", "사색", "회복"] },
  { id: 20, name: "The Sun", meanings: ["성공", "기쁨", "명료"], tags: ["희망", "설렘", "성장"] },
  { id: 21, name: "Judgement", meanings: ["각성", "호출", "결산"], tags: ["결단", "정리", "성장"] },
  { id: 22, name: "The World", meanings: ["완성", "달성", "확장"], tags: ["희망", "성장", "변화"] },
  { id: 23, name: "Ace of Cups", meanings: ["감정시작", "공감", "호감"], tags: ["로맨스", "설렘", "연결"] },
  { id: 24, name: "Two of Cups", meanings: ["유대", "교감", "합의"], tags: ["로맨스", "연결", "희망"] },
  { id: 25, name: "Three of Cups", meanings: ["축하", "친밀", "친구"], tags: ["설렘", "연결", "희망"] },
  { id: 26, name: "Four of Cups", meanings: ["권태", "정체", "재고"], tags: ["사색", "불안", "정리"] },
  { id: 27, name: "Five of Cups", meanings: ["상실", "아쉬움", "치유필요"], tags: ["불안", "치유", "회복"] },
  { id: 28, name: "Six of Cups", meanings: ["추억", "순수", "재회"], tags: ["로맨스", "회복", "연결"] },
  { id: 29, name: "Seven of Cups", meanings: ["선택지", "환상", "갈등"], tags: ["불안", "결단", "사색"] },
  { id: 30, name: "Eight of Cups", meanings: ["떠남", "거리두기", "전환"], tags: ["정리", "변화", "회복"] },
  { id: 31, name: "Nine of Cups", meanings: ["만족", "소망", "기쁨"], tags: ["희망", "설렘", "성장"] },
  { id: 32, name: "Ten of Cups", meanings: ["가족", "안정", "완성"], tags: ["연결", "희망", "로맨스"] },
  { id: 33, name: "Page of Cups", meanings: ["고백", "감수성", "제안"], tags: ["로맨스", "설렘", "성장"] },
  { id: 34, name: "Knight of Cups", meanings: ["로맨틱", "행동", "접근"], tags: ["로맨스", "도전", "연결"] },
  { id: 35, name: "Queen of Cups", meanings: ["공감", "직감", "포용"], tags: ["치유", "회복", "연결"] },
  { id: 36, name: "King of Cups", meanings: ["감정조절", "성숙", "신뢰"], tags: ["결단", "회복", "성장"] },
  { id: 37, name: "Ace of Wands", meanings: ["불씨", "열정", "시도"], tags: ["도전", "설렘", "변화"] },
  { id: 38, name: "Two of Wands", meanings: ["계획", "확장", "탐색"], tags: ["결단", "도전", "성장"] },
  { id: 39, name: "Three of Wands", meanings: ["전망", "기대", "진행"], tags: ["희망", "도전", "변화"] },
  { id: 40, name: "Four of Wands", meanings: ["안정", "축하", "공동체"], tags: ["연결", "희망", "설렘"] },
  { id: 41, name: "Five of Wands", meanings: ["경쟁", "긴장", "충돌"], tags: ["불안", "도전", "결단"] },
  { id: 42, name: "Six of Wands", meanings: ["인정", "승리", "자신감"], tags: ["희망", "성장", "설렘"] },
  { id: 43, name: "Seven of Wands", meanings: ["방어", "의지", "버팀"], tags: ["도전", "결단", "성장"] },
  { id: 44, name: "Eight of Wands", meanings: ["속도", "소식", "전개"], tags: ["변화", "설렘", "희망"] },
  { id: 45, name: "Nine of Wands", meanings: ["경계", "지침", "인내"], tags: ["불안", "회복", "성장"] }
];

let stage = "question";
let pendingQuestion = "";
let selectedCardIds = [];
let novelRings = [];
let tarotInfoByName = new Map();
const tarotKeywordMap = new Map([
  ["new beginnings", "새로운 시작"],
  ["innocence", "순수함"],
  ["adventure", "모험"],
  ["manifestation", "실현"],
  ["resourcefulness", "문제 해결력"],
  ["intuition", "직관"],
  ["wisdom", "지혜"],
  ["femininity", "수용성"],
  ["abundance", "풍요"],
  ["nurturing", "돌봄"],
  ["authority", "권위"],
  ["structure", "질서"],
  ["tradition", "전통"],
  ["commitment", "헌신"],
  ["partnership", "파트너십"],
  ["choices", "선택의 기로"],
  ["determination", "결단력"],
  ["willpower", "의지력"],
  ["courage", "용기"],
  ["patience", "인내"],
  ["introspection", "내면 성찰"],
  ["solitude", "고독"],
  ["change", "변화"],
  ["luck", "행운"],
  ["balance", "균형"],
  ["truth", "진실"],
  ["surrender", "내려놓음"],
  ["transformation", "전환"],
  ["endings", "마무리"],
  ["moderation", "절제"],
  ["healing", "회복"],
  ["temptation", "유혹"],
  ["bondage", "속박"],
  ["upheaval", "격변"],
  ["revelation", "각성"],
  ["hope", "희망"],
  ["inspiration", "영감"],
  ["illusion", "환상"],
  ["anxiety", "불안"],
  ["joy", "기쁨"],
  ["success", "성취"],
  ["rebirth", "재탄생"],
  ["calling", "소명"],
  ["completion", "완성"],
  ["fulfillment", "충만함"],
  ["love", "사랑"],
  ["union", "연결"],
  ["celebration", "축하"],
  ["apathy", "권태"],
  ["loss", "상실"],
  ["nostalgia", "추억"],
  ["options", "선택지"],
  ["walking away", "거리두기"],
  ["satisfaction", "만족"],
  ["harmony", "조화"],
  ["creative spark", "창의적 불씨"],
  ["progress", "진전"],
  ["conflict", "갈등"],
  ["recognition", "인정"],
  ["defensiveness", "방어"],
  ["speed", "빠른 전개"],
  ["resilience", "회복 탄력성"],
  ["recovery", "회복"],
  ["growth", "성장"]
]);

function addMessage(role, text) {
  const node = messageTemplate.content.firstElementChild.cloneNode(true);
  node.classList.add(role);
  node.querySelector(".bubble").textContent = text;
  chatEl.appendChild(node);
  chatEl.scrollTop = chatEl.scrollHeight;
}

function setInputState(enabled, placeholder = "") {
  inputEl.disabled = !enabled;
  sendBtnEl.disabled = !enabled;
  inputEl.placeholder = placeholder;
  if (enabled) inputEl.focus();
}

function getTopTags(cards) {
  const score = new Map();
  cards.forEach((card) => {
    card.tags.forEach((tag, idx) => {
      score.set(tag, (score.get(tag) || 0) + (3 - idx));
    });
  });
  return [...score.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([tag]) => tag);
}

function recommendNovelRings(tags) {
  return novelRings
    .map((item) => {
      const matches = item.tags.filter((tag) => tags.includes(tag));
      return { ...item, score: matches.length };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

function saveSession(payload) {
  localStorage.setItem("tarot-session", JSON.stringify(payload));
}

async function loadNovelRings() {
  const response = await fetch("./data/novel-rings.json");
  if (!response.ok) throw new Error("추천 데이터 로딩 실패");
  novelRings = await response.json();
}

function normalizeCardName(value) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function getNameAliases(name) {
  const aliases = [name];
  if (name === "Strength") aliases.push("Fortitude");
  return aliases.map(normalizeCardName);
}

function toKey(text) {
  return text.toLowerCase().replace(/[^a-z\s]/g, "").replace(/\s+/g, " ").trim();
}

function translateTarotPhrase(phrase) {
  const key = toKey(phrase);
  if (!key) return null;
  if (tarotKeywordMap.has(key)) return tarotKeywordMap.get(key);

  for (const [source, target] of tarotKeywordMap.entries()) {
    if (key.includes(source)) return target;
  }
  return null;
}

function extractKeywordText(text) {
  if (!text) return "해석 데이터 보강 중";
  const translated = text
    .split(/[,.;/]/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => translateTarotPhrase(chunk))
    .filter(Boolean);

  if (!translated.length) return "해석 데이터 보강 중";
  return [...new Set(translated)].slice(0, 3).join(", ");
}

function extractSummaryText(card, info) {
  const up = extractKeywordText(info?.meaning_up);
  const rev = extractKeywordText(info?.meaning_rev);
  return `${card.meanings.join(", ")} 중심의 카드이며, 정방향은 ${up}, 역방향은 ${rev} 흐름으로 해석합니다.`;
}

function getExternalCardInfo(card) {
  const aliases = getNameAliases(card.name);
  for (const alias of aliases) {
    const info = tarotInfoByName.get(alias);
    if (info) return info;
  }
  return null;
}

function formatCardDetail(card, positionLabel) {
  const info = getExternalCardInfo(card);
  const baseLine = `${positionLabel}: ${card.name} (${card.meanings.join(", ")})`;

  if (!info) {
    return `${baseLine}\n- 외부 데이터: 연결 실패 (기본 해석 사용)`;
  }

  return `${baseLine}
- 정방향 키워드: ${extractKeywordText(info.meaning_up)}
- 역방향 키워드: ${extractKeywordText(info.meaning_rev)}
- 카드 요약: ${extractSummaryText(card, info)}`;
}

async function loadTarotInfoLibrary() {
  const response = await fetch(tarotSourceUrl);
  if (!response.ok) throw new Error("타로 카드 데이터 로딩 실패");
  const payload = await response.json();
  if (!Array.isArray(payload.cards)) throw new Error("타로 카드 데이터 포맷 오류");

  tarotInfoByName = new Map(
    payload.cards.map((card) => [normalizeCardName(card.name), card])
  );
}

function updatePickerStatus() {
  pickerStatusEl.textContent = `${selectedCardIds.length} / 3 선택됨`;
}

function syncCardButtons() {
  const maxed = selectedCardIds.length >= 3;
  cardGridEl.querySelectorAll(".tarot-card-btn").forEach((button) => {
    const cardId = Number(button.dataset.cardId);
    const isSelected = selectedCardIds.includes(cardId);
    button.classList.toggle("selected", isSelected);
    button.disabled = maxed && !isSelected;
  });
}

function resetPicker() {
  selectedCardIds = [];
  updatePickerStatus();
  syncCardButtons();
}

function openPicker() {
  stage = "pick";
  cardPickerEl.classList.add("active");
  addMessage("bot", "좋아요. 이제 카드 45장 중에서 딱 3장을 선택해주세요.");
  setInputState(false, "카드 선택 중...");
  resetPicker();
}

function closePicker() {
  cardPickerEl.classList.remove("active");
}

function renderCardGrid() {
  const fragment = document.createDocumentFragment();
  tarotDeck.forEach((card) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "tarot-card-btn";
    button.dataset.cardId = String(card.id);
    button.textContent = `${card.id}`;
    button.title = `${card.id}번 카드`;
    fragment.appendChild(button);
  });
  cardGridEl.innerHTML = "";
  cardGridEl.appendChild(fragment);
}

function runReading() {
  const cards = selectedCardIds
    .map((id) => tarotDeck.find((item) => item.id === id))
    .filter(Boolean);

  if (cards.length !== 3) return;

  const [current, obstacle, advice] = cards;
  addMessage("bot", `질문 "${pendingQuestion}" 에 대한 리딩을 시작할게요.`);
  addMessage("bot", `선택한 카드:\n${formatCardDetail(current, "1) 현재")}`);
  addMessage("bot", formatCardDetail(obstacle, "2) 장애물"));
  addMessage("bot", formatCardDetail(advice, "3) 조언"));

  const tags = getTopTags(cards);
  const picks = recommendNovelRings(tags);
  if (!picks.length) {
    addMessage("bot", `오늘의 키워드: ${tags.join(", ")}\n아직 매칭 데이터가 부족해요.`);
  } else {
    const lines = picks.map(
      (item, idx) =>
        `${idx + 1}. ${item.title}\n- 무드: ${item.tags.join(", ")}\n- 추천 이유: ${item.reason}\n- 링크: ${item.link}`
    );
    addMessage("bot", `오늘의 감정 키워드: ${tags.join(", ")}\n추천 소설링:\n\n${lines.join("\n\n")}`);
  }

  saveSession({
    question: pendingQuestion,
    cards: cards.map((card) => card.name),
    tags,
    createdAt: new Date().toISOString()
  });

  closePicker();
  stage = "question";
  pendingQuestion = "";
  setInputState(true, "새 질문을 입력해주세요");
  addMessage("bot", "다른 질문도 가능해요. 한 문장으로 다시 보내주세요.");
}

function handleCardPick(cardId) {
  if (stage !== "pick") return;

  const idx = selectedCardIds.indexOf(cardId);
  if (idx >= 0) {
    selectedCardIds.splice(idx, 1);
  } else if (selectedCardIds.length < 3) {
    selectedCardIds.push(cardId);
  }

  updatePickerStatus();
  syncCardButtons();

  if (selectedCardIds.length === 3) {
    setTimeout(runReading, 250);
  }
}

function showIntro() {
  addMessage("bot", "안녕하세요. 타로 상담을 시작할게요.");
  addMessage("bot", "먼저 질문을 한 문장으로 보내주세요. 그 다음 45장 중 3장을 직접 고르게 됩니다.");
  setInputState(true, "질문을 입력해주세요");
}

formEl.addEventListener("submit", (event) => {
  event.preventDefault();
  if (stage !== "question") return;

  const text = inputEl.value.trim();
  if (!text) return;

  addMessage("user", text);
  inputEl.value = "";
  pendingQuestion = text;
  openPicker();
});

cardGridEl.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  const button = target.closest(".tarot-card-btn");
  if (!button) return;
  handleCardPick(Number(button.dataset.cardId));
});

async function init() {
  setInputState(false, "데이터 로딩 중...");
  renderCardGrid();
  updatePickerStatus();

  try {
    const results = await Promise.allSettled([loadNovelRings(), loadTarotInfoLibrary()]);
    if (results[1].status === "rejected") {
      addMessage("bot", "카드 외부 정보를 불러오지 못해 기본 해석으로 진행할게요.");
    }
    showIntro();
  } catch (error) {
    addMessage("bot", "초기화 중 문제가 발생했어요. 추천 데이터 파일을 확인해주세요.");
  }
}

init();
