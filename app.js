const chatEl = document.querySelector("#chat");
const formEl = document.querySelector("#input-form");
const inputEl = document.querySelector("#user-input");
const sendBtnEl = document.querySelector("#send-btn");
const messageTemplate = document.querySelector("#message-template");
const cardPickerEl = document.querySelector("#card-picker");
const cardGridEl = document.querySelector("#card-grid");
const pickerStatusEl = document.querySelector("#picker-status");
const directionPanelEl = document.querySelector("#direction-panel");
const categoryEl = document.querySelector("#question-category");
const filterEl = document.querySelector("#recommend-filter");

const tarotSymbols = ["✦", "☾", "✶", "✷", "☉", "⚝", "✺", "◇"];
const cardImageExtensions = ["jpg", "png", "webp", "jpeg", "JPG", "PNG", "WEBP", "JPEG"];
const suitSymbols = {
  Major: "✶",
  Wands: "⚚",
  Cups: "☾",
  Swords: "✦",
  Pentacles: "◆"
};

const categoryTagBoost = {
  연애: ["로맨스", "연결", "설렘"],
  진로: ["성장", "결단", "도전"],
  금전: ["성장", "정리", "결단"],
  인간관계: ["연결", "회복", "사색"],
  전체: []
};

let stage = "question";
let pendingQuestion = "";
let pendingCategory = "연애";
let pendingFilter = "all";
let selectedCardStates = [];
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
  categoryEl.disabled = !enabled;
  filterEl.disabled = !enabled;
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
  addIf(/성장|학습|전문|숙련|연마|목표|확장|재물|번영/, "성장");
  addIf(/치유|평온|수용|내면|성찰|회복|안식/, "회복");
  addIf(/결단|판단|선택|통제|리더십|의지/, "결단");
  addIf(/풍요|매력|기쁨|활력|영감|낙관/, "설렘");
  addIf(/탐구|직관|지혜|신중|고독|잠재의식/, "사색");

  if (card.suit === "Cups") {
    tags.add("연결");
    tags.add("로맨스");
  }
  if (card.suit === "Wands") tags.add("도전");
  if (card.suit === "Swords") tags.add("정리");
  if (card.suit === "Pentacles") tags.add("성장");
  if (card.arcana === "Major") tags.add("변화");

  const fallback = ["변화", "성장", "회복"];
  for (const item of fallback) {
    if (tags.size >= 3) break;
    tags.add(item);
  }

  return [...tags];
}

function getDirectionalTags(card, direction) {
  if (direction === "upright") return card.tags;
  const extra = new Set(["불안", "정리"]);
  if (card.suit === "Cups") extra.add("회복");
  return [...new Set([...card.tags, ...extra])];
}

function getTopTags(selectedCards, category) {
  const score = new Map();
  selectedCards.forEach(({ card, direction }) => {
    const tags = getDirectionalTags(card, direction);
    tags.forEach((tag, idx) => {
      score.set(tag, (score.get(tag) || 0) + (3 - Math.min(idx, 2)));
    });
  });

  (categoryTagBoost[category] || []).forEach((tag) => {
    score.set(tag, (score.get(tag) || 0) + 2);
  });

  return [...score.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([tag]) => tag);
}

function matchesFilter(item, filterType) {
  if (filterType === "all") return true;
  if (filterType === "short") return item.length === "짧음";
  if (filterType === "happy") return item.ending === "해피";
  if (filterType === "romance") return item.romance_level === "강";
  return true;
}

function recommendNovelRings(tags, category, filterType) {
  return novelRings
    .map((item) => {
      const matchedTags = item.tags.filter((tag) => tags.includes(tag));
      const categoryMatch = category !== "전체" && item.categories?.includes(category);
      const filterMatch = matchesFilter(item, filterType);
      const score = matchedTags.length + (categoryMatch ? 1 : 0) + (filterMatch ? 0.5 : -5);

      return {
        ...item,
        score,
        matchedTags,
        categoryMatch,
        filterMatch
      };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

function saveSession(payload) {
  const prev = JSON.parse(localStorage.getItem("tarot-history") || "[]");
  const next = [payload, ...prev].slice(0, 10);
  localStorage.setItem("tarot-history", JSON.stringify(next));
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
      cardDescription: card.card_description || "",
      interpretation: card.interpretation || { upright: "", reversed: "" },
      guidance: card.guidance || {},
      deepInterpretation: card.deep_interpretation || null,
      tags: mapCardToTags(card)
    }))
    .sort((a, b) => a.id - b.id);
}

function updatePickerStatus() {
  pickerStatusEl.textContent = `${selectedCardStates.length} / 3 선택됨`;
}

function syncCardButtons() {
  const maxed = selectedCardStates.length >= 3;
  cardGridEl.querySelectorAll(".tarot-card-btn").forEach((button) => {
    const cardId = Number(button.dataset.cardId);
    const selectedState = selectedCardStates.find((item) => item.id === cardId);
    const isSelected = Boolean(selectedState);

    button.classList.toggle("selected", isSelected);
    button.classList.toggle("reversed", isSelected && selectedState.direction === "reversed");
    button.disabled = maxed && !isSelected;
  });
}

function resetPicker() {
  selectedCardStates = [];
  updatePickerStatus();
  syncCardButtons();
  renderDirectionPanel();
}

function openPicker() {
  stage = "pick";
  cardPickerEl.classList.add("active");
  addMessage("bot", `좋아요. 카드 ${tarotDeck.length}장 중 3장을 고르고, 각 카드의 정방향/역방향을 직접 선택한 뒤 해석을 시작해주세요.`);
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

function getMajorNameAliases(nameKo) {
  const aliases = new Set([nameKo]);
  const map = {
    "광대": ["바보"],
    "고위 여사제": ["여사제"],
    "매달린 사람": ["행맨"],
    "은둔자": ["은둔자"],
    "정의": ["정의"],
    "운명의 수레바퀴": ["운명의 수레바퀴"],
    "악마": ["악마"],
    "탑": ["타워"]
  };
  (map[nameKo] || []).forEach((item) => aliases.add(item));
  return [...aliases];
}

function getMinorImageStem(card) {
  const suitMap = {
    Wands: "완드",
    Cups: "컵",
    Swords: "소드",
    Pentacles: "펜타클"
  };
  const suitStem = suitMap[card.suit];
  if (!suitStem) return [];

  const normalized = card.nameKo.replace(/^(지팡이|완드|컵|검|소드|펜타클)\s*/, "");
  const rankMap = {
    소년: "페이지",
    페이지: "페이지",
    기사: "나이트",
    나이트: "나이트",
    여왕: "퀸",
    퀸: "퀸",
    왕: "킹",
    킹: "킹"
  };
  const rankToken = rankMap[normalized] || normalized;
  const stems = [`./image/${suitStem} ${rankToken}`];

  if (/^\d+$/.test(rankToken)) {
    stems.push(`./image/${suitStem}${rankToken}`);
  }

  return stems;
}

function buildCardImageCandidates(card) {
  const displayNo = card.id + 1;
  const baseNames = [
    `./assets/cards/${displayNo}`,
    `./assets/cards/${String(displayNo).padStart(2, "0")}`,
    `./assets/cards/${card.id}`,
    `./assets/cards/${String(card.id).padStart(2, "0")}`,
    `./image/${displayNo}`,
    `./image/${card.id}`
  ];

  if (card.arcana === "Major") {
    const aliases = getMajorNameAliases(card.nameKo);
    aliases.forEach((alias) => {
      baseNames.push(`./image/${card.id}. ${alias} 카드`);
      baseNames.push(`./image/${card.id}. ${alias}`);
      baseNames.push(`./image/${displayNo}. ${alias} 카드`);
      baseNames.push(`./image/${displayNo}. ${alias}`);
    });
  } else {
    baseNames.push(...getMinorImageStem(card));
  }

  const result = [];
  baseNames.forEach((base) => {
    cardImageExtensions.forEach((ext) => {
      result.push(`${base}.${ext}`);
    });
  });

  return [...new Set(result)];
}

function renderDirectionPanel() {
  if (!selectedCardStates.length) {
    directionPanelEl.innerHTML = '<p class="direction-help">카드를 먼저 선택해주세요.</p>';
    return;
  }

  const rows = selectedCardStates
    .map((state, idx) => {
      const card = tarotDeck.find((item) => item.id === state.id);
      if (!card) return "";
      const displayNo = card.id + 1;
      const candidates = buildCardImageCandidates(card);
      const defaultSrc = candidates[0];
      return `
        <div class="direction-item">
          <div class="direction-meta">
            <div class="card-thumb" data-thumb>
              <img
                class="card-thumb-image"
                src="${defaultSrc}"
                alt="${card.nameKo} 카드 이미지"
                loading="lazy"
                data-candidates='${JSON.stringify(candidates)}'
                data-candidate-index="0"
              />
              <div class="card-thumb-fallback" aria-hidden="true">
                <span class="card-thumb-no">${displayNo}</span>
                <span class="card-thumb-sigil">${suitSymbols[card.suit] || tarotSymbols[card.id % tarotSymbols.length]}</span>
              </div>
            </div>
            <div class="direction-name">${idx + 1}. ${card.nameKo}</div>
          </div>
          <div class="direction-toggle">
            <button class="dir-btn ${state.direction === "upright" ? "active" : ""}" data-action="direction" data-id="${state.id}" data-value="upright">정방향</button>
            <button class="dir-btn ${state.direction === "reversed" ? "active" : ""}" data-action="direction" data-id="${state.id}" data-value="reversed">역방향</button>
          </div>
        </div>
      `;
    })
    .join("");

  directionPanelEl.innerHTML = `
    ${rows}
    <button class="reading-start-btn" data-action="start-reading" ${selectedCardStates.length !== 3 ? "disabled" : ""}>해석 시작</button>
  `;
}

function resolveCategoryDetailKey(category) {
  if (category === "연애") return "love";
  if (category === "진로") return "career";
  if (category === "금전") return "money";
  if (category === "인간관계") return "love";
  return "summary";
}

function formatCardDetail(card, positionLabel, direction, category) {
  const directionLabel = direction === "upright" ? "정방향" : "역방향";
  const detailText = direction === "upright" ? card.interpretation.upright : card.interpretation.reversed;
  const guidance = card.guidance?.[category] || "현재 질문 맥락에서 핵심 키워드를 기준으로 신중하게 선택하세요.";
  const section = card.deepInterpretation?.[direction];
  const detailKey = resolveCategoryDetailKey(category);
  const deepSummary = section?.summary;
  const deepCategory = section?.[detailKey];
  const deepHealth = section?.health;
  const cardDescription =
    card.cardDescription ||
    `${card.nameKo} 카드는 ${card.keywords.slice(0, 2).join("·")} 키워드를 중심으로 읽는 해석 카드입니다.`;

  const parts = [
    `${positionLabel}: ${card.nameKo} (${card.name})`,
    `- 카드 설명: ${cardDescription}`,
    `- 키워드: ${card.keywords.join(", ")}`,
    `- ${directionLabel} 기본 해석: ${detailText}`
  ];

  if (deepSummary) {
    parts.push(`- ${directionLabel} 핵심 요약: ${deepSummary}`);
  }

  if (deepCategory) {
    parts.push(`- ${category} 상세 해석: ${deepCategory}`);
  }

  if (deepHealth && category !== "전체") {
    parts.push(`- 건강 참고: ${deepHealth}`);
  }

  parts.push(`- ${category} 조언: ${guidance}`);
  return parts.join("\n");
}

function runReading() {
  const selectedCards = selectedCardStates
    .map((state) => ({
      ...state,
      card: tarotDeck.find((item) => item.id === state.id)
    }))
    .filter((item) => item.card);

  if (selectedCards.length !== 3) return;

  const [current, obstacle, advice] = selectedCards;

  addMessage("bot", `질문 \"${pendingQuestion}\" 에 대한 리딩을 시작할게요.`);
  addMessage("bot", `카테고리: ${pendingCategory} / 필터: ${filterEl.options[filterEl.selectedIndex].text}`);
  addMessage("bot", formatCardDetail(current.card, "1) 현재", current.direction, pendingCategory));
  addMessage("bot", formatCardDetail(obstacle.card, "2) 장애물", obstacle.direction, pendingCategory));
  addMessage("bot", formatCardDetail(advice.card, "3) 조언", advice.direction, pendingCategory));

  const tags = getTopTags(selectedCards, pendingCategory);
  const picks = recommendNovelRings(tags, pendingCategory, pendingFilter);

  if (!picks.length) {
    addMessage("bot", `오늘의 키워드: ${tags.join(", ")}\n현재 필터 조건에 맞는 소설링이 부족해요.`);
  } else {
    const lines = picks.map((item, idx) => {
      const reasons = [`태그 일치: ${item.matchedTags.join(", ") || "없음"}`];
      if (item.categoryMatch) reasons.push("카테고리 일치(+1)");
      if (pendingFilter !== "all" && item.filterMatch) reasons.push("필터 일치(+0.5)");

      return `${idx + 1}. ${item.title}\n- 무드: ${item.tags.join(", ")}\n- 추천 이유: ${item.reason}\n- 매칭 근거: ${reasons.join(" / ")}\n- 링크: ${item.link}`;
    });
    addMessage("bot", `오늘의 감정 키워드: ${tags.join(", ")}\n추천 소설링:\n\n${lines.join("\n\n")}`);
  }

  saveSession({
    question: pendingQuestion,
    category: pendingCategory,
    filter: pendingFilter,
    cards: selectedCards.map((item) => ({ name: item.card.nameKo, direction: item.direction })),
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

  const idx = selectedCardStates.findIndex((item) => item.id === cardId);
  if (idx >= 0) {
    selectedCardStates.splice(idx, 1);
  } else if (selectedCardStates.length < 3) {
    selectedCardStates.push({ id: cardId, direction: "upright" });
  }

  updatePickerStatus();
  syncCardButtons();
  renderDirectionPanel();
}

function setCardDirection(cardId, direction) {
  const target = selectedCardStates.find((item) => item.id === cardId);
  if (!target) return;
  target.direction = direction;
  syncCardButtons();
  renderDirectionPanel();
}

function showIntro() {
  addMessage("bot", "안녕하세요. 타로 상담을 시작할게요.");
  addMessage("bot", "질문 카테고리와 추천 필터를 고른 뒤 질문을 보내주세요.");
  addMessage("bot", `카드 ${tarotDeck.length}장 중 3장 선택 후 정방향/역방향을 직접 선택해 해석할 수 있어요.`);
  setInputState(true, "질문을 입력해주세요");
}

formEl.addEventListener("submit", (event) => {
  event.preventDefault();
  if (stage !== "question") return;

  const text = inputEl.value.trim();
  if (!text) return;

  pendingCategory = categoryEl.value;
  pendingFilter = filterEl.value;

  addMessage("user", `[${pendingCategory}] ${text}`);
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

directionPanelEl.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;

  const button = target.closest("button");
  if (!button) return;

  const action = button.dataset.action;
  if (action === "direction") {
    setCardDirection(Number(button.dataset.id), button.dataset.value);
    return;
  }

  if (action === "start-reading" && selectedCardStates.length === 3) {
    runReading();
  }
});

directionPanelEl.addEventListener(
  "error",
  (event) => {
    const target = event.target;
    if (!(target instanceof HTMLImageElement)) return;
    if (!target.classList.contains("card-thumb-image")) return;

    const currentIndex = Number(target.dataset.candidateIndex || "0");
    const nextIndex = currentIndex + 1;
    const candidates = JSON.parse(target.dataset.candidates || "[]");

    if (nextIndex < candidates.length) {
      target.dataset.candidateIndex = String(nextIndex);
      target.src = candidates[nextIndex];
      return;
    }

    const holder = target.closest("[data-thumb]");
    if (holder) holder.classList.add("fallback");
    target.remove();
  },
  true
);

async function init() {
  setInputState(false, "데이터 로딩 중...");

  try {
    await Promise.all([loadNovelRings(), loadTarotDeck()]);
    renderCardGrid();
    updatePickerStatus();
    renderDirectionPanel();
    showIntro();
  } catch (error) {
    addMessage("bot", "초기화 중 문제가 발생했어요. 데이터 파일을 확인해주세요.");
  }
}

init();
