const chatEl = document.querySelector("#chat");
const formEl = document.querySelector("#input-form");
const inputEl = document.querySelector("#user-input");
const sendBtnEl = document.querySelector("#send-btn");
const messageTemplate = document.querySelector("#message-template");
const cardPickerEl = document.querySelector("#card-picker");
const cardGridEl = document.querySelector("#card-grid");
const pickerStatusEl = document.querySelector("#picker-status");

const tarotSymbols = ["✦", "☾", "✶", "✷", "☉", "⚝", "✺", "◇"];
const suitSymbols = {
  Major: "✶",
  Wands: "⚚",
  Cups: "☾",
  Swords: "✦",
  Pentacles: "◆"
};

let stage = "question";
let pendingQuestion = "";
let selectedCardIds = [];
let tarotDeck = [];
let novelRings = [];

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

function mapCardToTags(card) {
  const text = `${card.keywords.join(" ")} ${card.interpretation.upright} ${card.interpretation.reversed}`;
  const tags = new Set();

  const addIf = (pattern, tag) => {
    if (pattern.test(text)) tags.add(tag);
  };

  addIf(/사랑|연인|고백|로맨|유대|결합/, "로맨스");
  addIf(/관계|우정|화합|가족|소속|조화/, "연결");
  addIf(/시작|기회|전환|변화|전진|이행|여행|속도/, "변화");
  addIf(/도전|추진|모험|승리|돌파|의지/, "도전");
  addIf(/불안|혼란|상실|비탄|악몽|속박|붕괴|갈등|파멸/, "불안");
  addIf(/정리|종결|끝|결정|책임|질서|정의|한계|청산/, "정리");
  addIf(/희망|행운|성공|완성|회생|기쁨|보상|승인/, "희망");
  addIf(/성장|학습|전문|숙련|연마|목표|확장/, "성장");
  addIf(/치유|평온|수용|내면|성찰|회복|안식/, "회복");
  addIf(/결단|판단|선택|통제|리더십|의지/, "결단");
  addIf(/풍요|매력|기쁨|활력|영감|낙관/, "설렘");
  addIf(/탐구|직관|지혜|신중|고독|잠재의식/, "사색");

  if (card.suit === "Cups") {
    tags.add("연결");
    tags.add("로맨스");
  }
  if (card.suit === "Wands") {
    tags.add("도전");
  }
  if (card.suit === "Swords") {
    tags.add("정리");
  }
  if (card.suit === "Pentacles") {
    tags.add("성장");
  }
  if (card.arcana === "Major") {
    tags.add("변화");
  }

  const fallback = ["변화", "성장", "회복"];
  for (const item of fallback) {
    if (tags.size >= 3) break;
    tags.add(item);
  }

  return [...tags];
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

async function loadTarotDeck() {
  const response = await fetch("./data/tarot-cards.json");
  if (!response.ok) throw new Error("타로 데이터 로딩 실패");

  const payload = await response.json();
  if (!Array.isArray(payload.cards)) throw new Error("타로 데이터 형식 오류");

  tarotDeck = payload.cards
    .map((card) => ({
      id: card.id,
      name: card.name_en,
      nameKo: card.name_ko,
      arcana: card.arcana,
      suit: card.suit,
      keywords: card.keywords || [],
      interpretation: card.interpretation || { upright: "", reversed: "" },
      tags: mapCardToTags(card)
    }))
    .sort((a, b) => a.id - b.id);
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
  addMessage("bot", "좋아요. 이제 타로 카드 45장 중에서 딱 3장을 선택해주세요.");
  setInputState(false, "카드 선택 중...");
  resetPicker();
}

function closePicker() {
  cardPickerEl.classList.remove("active");
}

function renderCardGrid() {
  const fragment = document.createDocumentFragment();

  tarotDeck.forEach((card) => {
    const displayNo = card.id + 1;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "tarot-card-btn";
    button.dataset.cardId = String(card.id);
    button.dataset.suit = card.suit;
    button.title = `${displayNo}번 카드 (${card.nameKo}) 선택`;
    button.setAttribute("aria-label", `${displayNo}번 카드 ${card.nameKo}`);
    button.innerHTML = `
      <span class="card-frame">
        <span class="card-corner card-corner-top">${displayNo}</span>
        <span class="card-sigil">${suitSymbols[card.suit] || tarotSymbols[card.id % tarotSymbols.length]}</span>
        <span class="card-corner card-corner-bottom">${displayNo}</span>
      </span>
    `;

    fragment.appendChild(button);
  });

  cardGridEl.innerHTML = "";
  cardGridEl.appendChild(fragment);
}

function formatCardDetail(card, positionLabel) {
  const direction = Math.random() < 0.7 ? "upright" : "reversed";
  const directionLabel = direction === "upright" ? "정방향" : "역방향";
  const detailText =
    direction === "upright" ? card.interpretation.upright : card.interpretation.reversed;

  return {
    summary: `${positionLabel}: ${card.nameKo} (${card.name})\n- 키워드: ${card.keywords.join(", ")}\n- ${directionLabel} 해석: ${detailText}`,
    directionLabel
  };
}

function runReading() {
  const cards = selectedCardIds
    .map((id) => tarotDeck.find((item) => item.id === id))
    .filter(Boolean);

  if (cards.length !== 3) return;

  const [current, obstacle, advice] = cards;
  const currentText = formatCardDetail(current, "1) 현재");
  const obstacleText = formatCardDetail(obstacle, "2) 장애물");
  const adviceText = formatCardDetail(advice, "3) 조언");

  addMessage("bot", `질문 \"${pendingQuestion}\" 에 대한 리딩을 시작할게요.`);
  addMessage("bot", currentText.summary);
  addMessage("bot", obstacleText.summary);
  addMessage("bot", adviceText.summary);

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
    cards: cards.map((card) => card.nameKo),
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

  try {
    await Promise.all([loadNovelRings(), loadTarotDeck()]);
    renderCardGrid();
    updatePickerStatus();
    showIntro();
  } catch (error) {
    addMessage("bot", "초기화 중 문제가 발생했어요. 데이터 파일을 확인해주세요.");
  }
}

init();
