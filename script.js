// ============================================================
// State
// ============================================================
let triggerData = null;
let activeIndex = 0;

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
  { id: "8800000001644794", name: "Chedrick Rodriguez", initials: "CR", color: "#3ecf6b" },
  { id: "8800000001645112", name: "Marian Monlealto",   initials: "MM", color: "#4a90d9" },
  { id: "8800000001645873", name: "Jome Suyat",          initials: "JS", color: "#e8823c" },
  { id: "8800000001646210", name: "Aljerd Abelgas",      initials: "AA", color: "#c15fd6" },
  { id: "8800000001646932", name: "Yonathan Ohayon",     initials: "YO", color: "#d9534f" },
  { id: "8800000001647401", name: "Kristine Bautista",   initials: "KB", color: "#2fb8b8" },
  { id: "8800000001647988", name: "Miguel Santos",       initials: "MS", color: "#b8a12f" },
  { id: "8800000001648550", name: "Denise Lopez",        initials: "DL", color: "#7a8bd9" },
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
// Form submit
// ============================================================
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = chatInput.value.trim();
  if (!text) return;

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
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
  });
});

loadTriggers();
