// ---------- State ----------
let triggerData = null;
const chatWindow = document.getElementById("chatWindow");
const activityLog = document.getElementById("activityLog");
const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");
const candidateIdLabel = document.getElementById("candidateIdLabel");
const liveTimerEl = document.getElementById("liveTimer");
const noteArea = document.getElementById("noteArea");
const addNoteBtn = document.getElementById("addNoteBtn");

// ---------- Load trigger data ----------
async function loadTriggers() {
  try {
    const res = await fetch("data/triggers.json");
    triggerData = await res.json();
  } catch (err) {
    // Fallback if opened directly as file:// (fetch blocked by CORS).
    console.warn("Could not fetch data/triggers.json — using built-in fallback. Run this via a local server (e.g. VS Code Live Server) to load the real file.", err);
    triggerData = {
      candidateName: "Chedrick Rodriguez",
      candidateId: "8800000001644794",
      sessionLabel: "ZZDEMO Testing",
      triggers: [
        { keywords: ["hello", "hi"], reply: "Hello! I'm your proctor for today's session." },
        { keywords: ["thank you", "thanks"], reply: "You're welcome!" }
      ],
      fallbackReplies: ["Noted, thank you."]
    };
  }
  candidateIdLabel.textContent = triggerData.candidateId;
  seedInitialChat();
  seedActivityLog();
  startLiveTimer();
}

// ---------- Chat rendering ----------
function formatTime(date = new Date()) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function addMessage({ text, who, direction, showRead = false }) {
  const msg = document.createElement("div");
  msg.className = `msg ${direction}`;

  const meta = document.createElement("div");
  meta.className = "msg-meta";
  meta.innerHTML = direction === "out"
    ? `<span class="who">${who}</span> ${formatTime()}`
    : `<span class="who">${who}</span> ${formatTime()}`;

  const bubble = document.createElement("div");
  bubble.className = "msg-bubble";
  bubble.textContent = text;

  msg.appendChild(meta);
  msg.appendChild(bubble);

  if (showRead && direction === "out") {
    const status = document.createElement("div");
    status.className = "msg-status";
    status.textContent = "Read ✓";
    msg.appendChild(status);
  }

  chatWindow.appendChild(msg);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function showTypingIndicator() {
  const el = document.createElement("div");
  el.className = "msg in";
  el.id = "typingIndicator";
  el.innerHTML = `<div class="msg-meta"><span class="who">${triggerData.candidateName}</span></div>
                   <div class="msg-bubble">typing…</div>`;
  chatWindow.appendChild(el);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function removeTypingIndicator() {
  const el = document.getElementById("typingIndicator");
  if (el) el.remove();
}

function seedInitialChat() {
  addMessage({ text: "thank you", who: "Me", direction: "in" });
  addMessage({ text: "No problem.", who: "You", direction: "out" });
}

// ---------- Activity log ----------
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
  logEvent({ title: "Candidate started the exam. Attempt: 1", sub: `${triggerData.sessionLabel}<br>Candidate`, tag: "note", tagLabel: "note" });
  logEvent({ title: "You accepted the assignment", sub: "Trainee@Contractor.simulator.com<br>Proctor", tag: "assignment", tagLabel: "assignment" });
}

// ---------- Live timer ----------
function startLiveTimer() {
  let seconds = 4 * 60 + 49; // matches reference screenshot start point
  setInterval(() => {
    if (seconds <= 0) return;
    seconds--;
    const m = String(Math.floor(seconds / 60)).padStart(2, "0");
    const s = String(seconds % 60).padStart(2, "0");
    liveTimerEl.textContent = `${m}:${s}`;
  }, 1000);
}

// ---------- Trigger matching ----------
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

// ---------- Form submit ----------
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = chatInput.value.trim();
  if (!text) return;

  addMessage({ text, who: "You", direction: "out", showRead: false });
  chatInput.value = "";

  logEvent({
    title: "Proctor sent a chat message",
    sub: `${triggerData.sessionLabel}<br>Proctor`,
  });

  const delay = 900 + Math.random() * 900;
  showTypingIndicator();
  setTimeout(() => {
    removeTypingIndicator();
    const reply = findReply(text);
    addMessage({ text: reply, who: triggerData.candidateName, direction: "in" });
  }, delay);
});

// ---------- Notes ----------
addNoteBtn.addEventListener("click", () => {
  const note = noteArea.value.trim();
  if (!note) return;
  logEvent({
    title: "Note added",
    sub: note,
    tag: "note",
    tagLabel: "note",
  });
  noteArea.value = "";
});

// ---------- Tabs (visual only for now) ----------
document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
  });
});

loadTriggers();
