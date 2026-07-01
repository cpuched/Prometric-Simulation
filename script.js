// ============================================================
// State
// ============================================================
let triggerData = null;
let activeIndex = 0;

// ---- Scenario mode state (Scenario tab feature) ----
// currentScenario: the active scenario object from data/scenarios.js, or null when not in scenario mode
// scenarioStep: 0 idle | 2 waiting for reply #1 | 4 waiting for reply #2 | 8 complete
let currentScenario = null;
let scenarioStep = 0;
let scenarioReply1Score = 0;
let scenarioReply2Score = 0;

const camRailEl = document.getElementById("camRail");
const chatWindow = document.getElementById("chatWindow");
const activityLog = document.getElementById("activityLog");
const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");
const candidateIdLabel = document.getElementById("candidateIdLabel");
const mainSessionLabel = document.getElementById("mainSessionLabel");
const liveTimerEl = document.getElementById("liveTimer");
const noteArea = document.getElementById("noteArea");
const addNoteBtn = document.getElementById("addNoteBtn");

// Up to 8 candidates in the queue. Each has its own independent chat history
// and countdown timer, so switching tiles feels like switching between real
// concurrent sessions instead of resetting everything.
const CANDIDATE_ROSTER = [
  { id: "0000000001644794", name: "Chedrick Rodriguez", initials: "CR", color: "#3ecf6b" },
  { id: "0000000001645112", name: "Candidate 1",   initials: "C1", color: "#4a90d9" },
  { id: "0000000001645873", name: "Candidate 2",          initials: "C2", color: "#e8823c" },
  { id: "0000000001646210", name: "Candidate 3",      initials: "C3", color: "#c15fd6" },
  { id: "0000000001646932", name: "Candidate 4",     initials: "C4", color: "#d9534f" },
  { id: "0000000001647401", name: "Canddidate 5",   initials: "C5", color: "#2fb8b8" },
  { id: "0000000001647988", name: "Canddidate 6",       initials: "C6", color: "#b8a12f" },
  { id: "0000000001648550", name: "Canddidate 7",        initials: "C7", color: "#7a8bd9" },
];

// ============================================================
// Load trigger data, then build the candidate roster + rail
// ============================================================
async function loadTriggers() {
  try {
    const res = await fetch("data/triggers.json?v=" + Date.now()); // cache-bust so updates always show
    triggerData = await res.json();
  } catch (err) {
    console.warn("Could not fetch data/triggers.json — using built-in fallback. Run this via a local server (e.g. VS Code Live Server) to load the real file.", err);
    triggerData = {
      sessionLabel: "ZZDEMO Testing",
      triggers: [
        { keywords: ["hello"], reply: "Hi, yes I can see your message." },
        { keywords: ["camera view"], reply: "Understood, I'll stay in view." },
        { keywords: ["cellphone"], reply: "Sure, it's right here, powered off." }
      ],
      fallbackReplies: ["Okay, understood.", "Got it, thank you."]
    };
  }

  // Attach live runtime state to each roster entry: its own message list and
  // its own countdown, so candidates behave like independent sessions.
  CANDIDATE_ROSTER.forEach((cand, i) => {
    cand.messages = [];
    cand.secondsLeft = 180 + i * 37 + Math.floor(Math.random() * 60); // stagger timers so they don't all match
    cand.status = "live";
  });

  renderCamRail();
  switchCandidate(0);
  seedActivityLog();
  startLiveTimers();
  renderScenarioDropdown();
}

// ============================================================
// Left rail: candidate queue tiles
// ============================================================
function renderCamRail() {
  camRailEl.innerHTML = "";
  CANDIDATE_ROSTER.forEach((cand, idx) => {
    const card = document.createElement("div");
    card.className = "cam-card" + (idx === activeIndex ? " active" : "");
    card.setAttribute("role", "button");
    card.setAttribute("tabindex", "0");
    card.setAttribute("aria-label", `Open ${cand.name}'s session`);

    card.innerHTML = `
      <div class="cam-thumb" style="background:${cand.color}22">
        <span class="cam-initials" style="color:${cand.color}">${cand.initials}</span>
        <span class="cam-status-dot ${cand.status}"></span>
      </div>
      <div class="cam-label">${cand.name}</div>
      <div class="cam-sub">${triggerData.sessionLabel}</div>
    `;

    card.addEventListener("click", () => switchCandidate(idx));
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); switchCandidate(idx); }
    });

    camRailEl.appendChild(card);
  });
}

function updateActiveTileHighlight() {
  [...camRailEl.children].forEach((card, idx) => {
    card.classList.toggle("active", idx === activeIndex);
  });
}

// ============================================================
// Switching the active candidate into the main panel
// ============================================================
function switchCandidate(idx) {
  // Switching candidates while mid-scenario would mix up which session the
  // scenario transcript/score belongs to, so back out to normal chat first.
  if (currentScenario) exitScenarioMode();

  activeIndex = idx;
  const cand = CANDIDATE_ROSTER[idx];

  candidateIdLabel.textContent = cand.id;
  mainSessionLabel.textContent = triggerData.sessionLabel;
  updateLiveTimerDisplay();
  updateActiveTileHighlight();
  renderChatWindow();
}

function activeCandidate() {
  return CANDIDATE_ROSTER[activeIndex];
}

// ============================================================
// Chat rendering (fully re-rendered from the active candidate's
// own message array whenever we switch or send a message)
// ============================================================
function formatTime(date = new Date()) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function renderChatWindow() {
  const cand = activeCandidate();
  chatWindow.innerHTML = "";

  if (cand.messages.length === 0) {
    const el = document.createElement("div");
    el.className = "chat-instructions";
    el.innerHTML = `You are the <strong>proctor</strong> in this simulation, now viewing <strong>${cand.name}</strong>'s session.
      Type your script lines into the box below (e.g. "Please ensure your head to shoulders remain in the camera view")
      and the simulated candidate will respond automatically.`;
    chatWindow.appendChild(el);
  }

  cand.messages.forEach(m => renderSingleMessage(m));
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function renderSingleMessage({ text, who, direction, time }) {
  const msg = document.createElement("div");
  msg.className = `msg ${direction}`;

  const meta = document.createElement("div");
  meta.className = "msg-meta";
  meta.innerHTML = `<span class="who">${who}</span> ${time}`;

  const bubble = document.createElement("div");
  bubble.className = "msg-bubble";
  bubble.textContent = text;

  msg.appendChild(meta);
  msg.appendChild(bubble);
  chatWindow.appendChild(msg);
}

function addMessage({ text, who, direction }) {
  const cand = activeCandidate();
  const entry = { text, who, direction, time: formatTime() };
  cand.messages.push(entry);
  renderSingleMessage(entry);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function showTypingIndicator() {
  const cand = activeCandidate();
  const el = document.createElement("div");
  el.className = "msg in";
  el.id = "typingIndicator";
  el.innerHTML = `<div class="msg-meta"><span class="who">${cand.name}</span></div>
                   <div class="msg-bubble">typing…</div>`;
  chatWindow.appendChild(el);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function removeTypingIndicator() {
  const el = document.getElementById("typingIndicator");
  if (el) el.remove();
}

// ============================================================
// Activity log (shared feed across all candidates, like the real tool)
// ============================================================
function logEvent({ title, sub, tag, tagLabel }) {
  const entry = document.createElement("div");
  entry.className = "log-entry";
  entry.innerHTML = `
    <span class="log-time">${formatTime()}</span>
    <span class="log-title">${title}</span>
    ${sub ? `<div class="log-sub">${sub}</div>` : ""}
    ${tag ? `<div class="log-tag ${tag}">${tagLabel}</div>` : ""}
  `;
  activityLog.prepend(entry);
}

function seedActivityLog() {
  const first = CANDIDATE_ROSTER[0];
  logEvent({ title: "Candidate started the exam. Attempt: 1", sub: `${triggerData.sessionLabel}<br>${first.name}`, tag: "note", tagLabel: "note" });
  logEvent({ title: "You accepted the assignment", sub: "Trainee@Contractor.simulator.com<br>Proctor", tag: "assignment", tagLabel: "assignment" });
}

// ============================================================
// Live timers — every candidate's countdown ticks independently,
// even the ones not currently shown, to simulate concurrent sessions
// ============================================================
function formatSeconds(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  return `${m}:${s}`;
}

function updateLiveTimerDisplay() {
  liveTimerEl.textContent = formatSeconds(activeCandidate().secondsLeft);
}

function startLiveTimers() {
  setInterval(() => {
    CANDIDATE_ROSTER.forEach(cand => {
      if (cand.secondsLeft > 0) cand.secondsLeft--;
    });
    updateLiveTimerDisplay();
  }, 1000);
}

// ============================================================
// Trigger matching
// ============================================================
function findReply(userText) {
  const lower = userText.toLowerCase();
  for (const trigger of triggerData.triggers) {
    if (trigger.keywords.some(kw => lower.includes(kw))) {
      return trigger.reply;
    }
  }
  const fallbacks = triggerData.fallbackReplies || ["Noted, thank you."];
  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}

// ============================================================
// Scenario mode (Scenario tab, right beside Security)
// Drives Steps 1–9 from the scripted scenario flow, using data/scenarios.js
// ============================================================
const scenarioTabBtn = document.getElementById("scenarioTabBtn");
const scenarioDropdown = document.getElementById("scenarioDropdown");
const actionModalOverlay = document.getElementById("actionModalOverlay");
const actionModalBox = document.getElementById("actionModalBox");

function renderScenarioDropdown() {
  scenarioDropdown.innerHTML = "";
  (window.SCENARIOS || []).forEach(sc => {
    const item = document.createElement("div");
    item.className = "scenario-item";
    item.textContent = sc.label;
    item.addEventListener("click", () => {
      scenarioDropdown.classList.remove("open");
      startScenario(sc);
    });
    scenarioDropdown.appendChild(item);
  });
}

scenarioTabBtn.addEventListener("click", () => {
  scenarioDropdown.classList.toggle("open");
});

// close the dropdown if the trainee clicks anywhere else on the page
document.addEventListener("click", (e) => {
  if (!scenarioTabBtn.contains(e.target) && !scenarioDropdown.contains(e.target)) {
    scenarioDropdown.classList.remove("open");
  }
});

// Renders a scenario message into the chat window WITHOUT saving it into
// the candidate's permanent cand.messages history — scenario transcripts
// are transient and separate from the normal working chat.
function addScenarioMessage(text, who, direction) {
  renderSingleMessage({ text, who, direction, time: formatTime() });
}

// Step 1: scenario setup + mark the Scenario tab visually active
function startScenario(sc) {
  currentScenario = sc;
  scenarioStep = 1;
  scenarioReply1Score = 0;
  scenarioReply2Score = 0;

  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  scenarioTabBtn.classList.add("active");

  const cand = activeCandidate();
  chatWindow.innerHTML = "";
  const setupEl = document.createElement("div");
  setupEl.className = "chat-instructions";
  setupEl.innerHTML = sc.setupText(cand.name);
  chatWindow.appendChild(setupEl);

  // Step 2: candidate's first message, after a short "typing" beat
  showTypingIndicator();
  setTimeout(() => {
    removeTypingIndicator();
    addScenarioMessage(sc.candidateMessage1, cand.name, "in");
    scenarioStep = 2; // now waiting on the trainee's Step 3 reply
  }, 800);
}

// Scores a trainee reply against a scenario's trigger/idea-check table
function scoreScenarioReply(text, triggers, minWords, minWordsScore) {
  const lower = text.toLowerCase();
  let score = 0;
  triggers.forEach(t => {
    if (t.keywords.some(kw => lower.includes(kw))) score += t.score;
  });
  if (score === 0 && text.trim().split(/\s+/).filter(Boolean).length >= minWords) {
    score = minWordsScore; // "minimum words implied" fallback
  }
  return score;
}

// Routes a chat-input submission to Step 3 or Step 6 while a scenario is active
function handleScenarioReply(text) {
  const sc = currentScenario;
  const cand = activeCandidate();

  if (scenarioStep === 2) {
    // Step 3: trainee's first reply
    addScenarioMessage(text, "You", "out");
    scenarioReply1Score = scoreScenarioReply(text, sc.reply1Triggers, sc.reply1MinWords, sc.reply1MinWordsScore);
    scenarioStep = 3;

    // Step 5: candidate's second message
    showTypingIndicator();
    setTimeout(() => {
      removeTypingIndicator();
      addScenarioMessage(sc.candidateMessage2, cand.name, "in");
      scenarioStep = 4; // now waiting on the trainee's Step 6 reply
    }, 800);

  } else if (scenarioStep === 4) {
    // Step 6: trainee's second reply
    addScenarioMessage(text, "You", "out");
    scenarioReply2Score = scoreScenarioReply(text, sc.reply2Triggers, sc.reply2MinWords, sc.reply2MinWordsScore);
    scenarioStep = 5;

    const promptEl = document.createElement("div");
    promptEl.className = "chat-instructions";
    promptEl.textContent = "Complete the Action Tab to finish this scenario.";
    chatWindow.appendChild(promptEl);
    chatWindow.scrollTop = chatWindow.scrollHeight;

    openActionModal();
  }
}

// Step 7: Action Tab, shown as a popup/modal overlay
function openActionModal() {
  const sc = currentScenario;
  actionModalBox.innerHTML = `<h3 class="modal-title">Action Tab — ${sc.label}</h3>`;

  sc.actionFields.forEach(f => {
    actionModalBox.innerHTML += `
      <label class="modal-field-label">${f.label}</label>
      <div class="modal-field-prompt">${f.prompt}</div>
      <textarea class="modal-field-input" id="actionField_${f.key}" rows="2"></textarea>
    `;
  });
  actionModalBox.innerHTML += `<button class="modal-submit-btn" id="actionSubmitBtn">Submit</button>`;

  actionModalOverlay.classList.add("open");

  document.getElementById("actionSubmitBtn").addEventListener("click", () => {
    const values = {};
    sc.actionFields.forEach(f => {
      values[f.key] = document.getElementById(`actionField_${f.key}`).value.trim();
    });
    actionModalOverlay.classList.remove("open");
    finishScenario(values);
  });
}

// Step 8 + 9: scenario complete — show feedback + ideal response, and write
// the Action Tab inputs into this candidate's session log as a note
function finishScenario(values) {
  const sc = currentScenario;
  const total = scenarioReply1Score + scenarioReply2Score; // out of 200 (100 per reply)

  let tier = "wrong";
  let tierLabel = "Wrong";
  if (total >= 200) { tier = "max"; tierLabel = "Maximum Trigger Achieved"; }
  else if (total >= 100) { tier = "mid"; tierLabel = "Mid Trigger Achieved"; }
  else if (total > 0) { tier = "min"; tierLabel = "Minimum Trigger Achieved"; }

  const feedbackEl = document.createElement("div");
  feedbackEl.className = `scenario-feedback tier-${tier}`;
  feedbackEl.innerHTML = `<strong>${tierLabel}</strong>${sc.feedback[tier]}`;
  chatWindow.appendChild(feedbackEl);

  const idealEl = document.createElement("div");
  idealEl.className = "scenario-feedback tier-ideal";
  idealEl.innerHTML = `<strong>Ideal Response</strong>${sc.idealResponse}`;
  chatWindow.appendChild(idealEl);
  chatWindow.scrollTop = chatWindow.scrollHeight;

  // Step 7's action-tab inputs become this candidate's session-log note
  const cand = activeCandidate();
  const noteSummary = sc.actionFields.map(f => `${f.label}: ${values[f.key] || "\u2014"}`).join("<br>");
  logEvent({
    title: `Scenario complete: ${sc.label}`,
    sub: `${noteSummary}<br>${cand.name}`,
    tag: "note",
    tagLabel: "note",
  });

  scenarioStep = 8;
}

// Leaving scenario mode (Step 9 tail): clicking back to CHAT restores the
// normal working UI with the regular trigger replies
function exitScenarioMode() {
  currentScenario = null;
  scenarioStep = 0;
  renderChatWindow();
}

// ============================================================
// Form submit
// ============================================================
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = chatInput.value.trim();
  if (!text) return;

  if (currentScenario && (scenarioStep === 2 || scenarioStep === 4)) {
    handleScenarioReply(text);
    chatInput.value = "";
    return;
  }

  const cand = activeCandidate();
  addMessage({ text, who: "You", direction: "out" });
  chatInput.value = "";

  logEvent({
    title: "Proctor sent a chat message",
    sub: `${triggerData.sessionLabel}<br>${cand.name}`,
  });

  const delay = 900 + Math.random() * 900;
  showTypingIndicator();
  setTimeout(() => {
    removeTypingIndicator();
    const reply = findReply(text);
    addMessage({ text: reply, who: cand.name, direction: "in" });
  }, delay);
});

// ============================================================
// Notes
// ============================================================
addNoteBtn.addEventListener("click", () => {
  const note = noteArea.value.trim();
  if (!note) return;
  logEvent({
    title: "Note added",
    sub: `${note}<br>${activeCandidate().name}`,
    tag: "note",
    tagLabel: "note",
  });
  noteArea.value = "";
});

// ============================================================
// Tabs (visual only for now)
// ============================================================
document.querySelectorAll(".tab").forEach(tab => {
  if (tab.id === "scenarioTabBtn") return; // handled separately above (opens the dropdown, doesn't switch tabs)

  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    tab.classList.add("active");

    if (tab.dataset.tab === "chat" && currentScenario) {
      exitScenarioMode(); // Step 9 tail: back to the normal working chat UI
    }
  });
});

loadTriggers();
