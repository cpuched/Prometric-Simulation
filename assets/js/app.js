import { createChat } from "./chat.js";
import { createTypingTest } from "./typing-test.js";
import { createScenarioEngine } from "./scenario-engine.js";
import { loadJson, validateCandidates, validateTriggerData, validateTypingTests } from "./data-loader.js";
import { paginateNewest } from "./pagination.js";
import { scenarios } from "../../data/scenarios/index.js";

  const state = { triggerData: null, activeIndex: 0 };
  const elements = {};
  let candidates = [];
  let chat;
  let typingTest;
  let scenarioEngine;
  const capturePages = new Map();
  let pendingNavigation = null;
  let navigationTrigger = null;

  function activeCandidate() { return candidates[state.activeIndex]; }
  function formatTime(date = new Date()) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  function renderSingleMessage({ text, who, direction, time }) {
    const message = document.createElement("div");
    message.className = `msg ${direction}`;
    const meta = document.createElement("div");
    meta.className = "msg-meta";
    meta.innerHTML = `<span class="who">${who}</span> ${time}`;
    const bubble = document.createElement("div");
    bubble.className = "msg-bubble";
    bubble.textContent = text;
    message.append(meta, bubble);
    elements.chatWindow.appendChild(message);
  }

  function renderChatWindow() {
    const candidate = activeCandidate();
    elements.chatWindow.innerHTML = "";
    if (!candidate.messages.length) {
      const instructions = document.createElement("div");
      instructions.className = "chat-instructions";
      instructions.innerHTML = `You are the <strong>proctor</strong> in this simulation, now viewing <strong>${candidate.name}</strong>'s session. Type your script lines below and the simulated candidate will respond automatically.`;
      elements.chatWindow.appendChild(instructions);
    }
    candidate.messages.forEach(renderSingleMessage);
    elements.chatWindow.scrollTop = elements.chatWindow.scrollHeight;
  }

  function addMessage({ text, who, direction }, candidate = activeCandidate()) {
    const entry = { text, who, direction, time: formatTime() };
    candidate.messages.push(entry);
    if (candidate === activeCandidate()) {
      renderSingleMessage(entry);
      elements.chatWindow.scrollTop = elements.chatWindow.scrollHeight;
    }
  }

  function showTypingIndicator(candidate = activeCandidate()) {
    if (candidate !== activeCandidate()) return;
    const indicator = document.createElement("div");
    indicator.className = "msg in";
    indicator.id = `typingIndicator-${candidate.id}`;
    indicator.innerHTML = `<div class="msg-meta"><span class="who">${candidate.name}</span></div><div class="msg-bubble">typing…</div>`;
    elements.chatWindow.appendChild(indicator);
    elements.chatWindow.scrollTop = elements.chatWindow.scrollHeight;
  }

  function removeTypingIndicator(candidate = activeCandidate()) {
    document.getElementById(`typingIndicator-${candidate.id}`)?.remove();
  }

  function renderActivityLog() {
    elements.activityLog.innerHTML = "";
    activeCandidate().activityLog.forEach(item => {
      const entry = document.createElement("div");
      entry.className = "log-entry";
      entry.innerHTML = `<span class="log-time">${item.time}</span><span class="log-title">${item.title}</span>${item.sub ? `<div class="log-sub">${item.sub}</div>` : ""}${item.tag ? `<div class="log-tag ${item.tag}">${item.tagLabel}</div>` : ""}`;
      elements.activityLog.appendChild(entry);
    });
  }

  function renderCandidateInfo() {
    const candidate = activeCandidate();
    elements.infoCandidateName.textContent = candidate.name;
    elements.infoCandidateEmail.textContent = candidate.email;
    elements.infoExamName.textContent = candidate.examName;
    elements.infoConfirmationNumber.textContent = candidate.id;
    elements.captureCount.textContent = `${candidate.photoCaptures.length} capture${candidate.photoCaptures.length === 1 ? "" : "s"}`;
    elements.candidateCaptures.replaceChildren();

    if (!candidate.photoCaptures.length) {
      const empty = document.createElement("div");
      empty.className = "capture-empty";
      empty.innerHTML = `<span class="capture-empty-icon">▣</span><strong>No candidate photos captured</strong><span>Use the camera icon above to add a placeholder capture.</span>`;
      elements.candidateCaptures.appendChild(empty);
      return;
    }

    const page = paginateNewest(candidate.photoCaptures, capturePages.get(candidate.id) || 1, 12);
    capturePages.set(candidate.id, page.currentPage);
    page.items.forEach((capture, index) => {
      const card = document.createElement("article");
      card.className = "capture-card";
      const captureNumber = page.total - ((page.currentPage - 1) * 12 + index);
      card.innerHTML = `<div class="capture-placeholder" style="--candidate-color:${candidate.color}"><span>${candidate.initials}</span><small>Candidate photo placeholder</small></div><div class="capture-meta"><strong>Candidate photo ${captureNumber}</strong><time>${capture.capturedAt}</time></div>`;
      elements.candidateCaptures.appendChild(card);
    });
    if (page.pageCount > 1) {
      const navigation = document.createElement("nav");
      navigation.className = "capture-pagination";
      navigation.setAttribute("aria-label", "Candidate photo pages");
      const previous = document.createElement("button");
      previous.type = "button"; previous.textContent = "Previous"; previous.disabled = page.currentPage === 1;
      const status = document.createElement("span");
      status.textContent = `Page ${page.currentPage} of ${page.pageCount}`;
      const next = document.createElement("button");
      next.type = "button"; next.textContent = "Next"; next.disabled = page.currentPage === page.pageCount;
      previous.addEventListener("click", () => { capturePages.set(candidate.id, page.currentPage - 1); renderCandidateInfo(); });
      next.addEventListener("click", () => { capturePages.set(candidate.id, page.currentPage + 1); renderCandidateInfo(); });
      navigation.append(previous, status, next);
      elements.candidateCaptures.appendChild(navigation);
    }
  }

  function logEvent({ title, sub, tag, tagLabel }, candidate = activeCandidate()) {
    candidate.activityLog.unshift({ title, sub, tag, tagLabel, time: formatTime() });
    if (candidate === activeCandidate()) renderActivityLog();
  }

  function getExamStatus(candidate) {
    if (!candidate.examStarted) return "Waiting to start exam";
    return candidate.examPaused ? "Exam paused" : "Live exam in progress";
  }

  function formatSeconds(seconds) {
    return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  }

  function updateExamDisplay() {
    const candidate = activeCandidate();
    const action = !candidate.examStarted ? "start" : candidate.examPaused ? "resume" : "pause";
    const symbol = action === "pause" ? "⏸" : "▶";
    elements.examToggleBtn.dataset.action = action;
    elements.examToggleBtn.innerHTML = `${symbol}<span>${action[0].toUpperCase() + action.slice(1)} Exam</span>`;
    elements.mainCandidateStatus.textContent = getExamStatus(candidate);
    elements.liveTimer.textContent = formatSeconds(candidate.secondsElapsed);
  }

  function renderCandidateRail() {
    elements.camRail.innerHTML = "";
    candidates.forEach((candidate, index) => {
      const card = document.createElement("div");
      card.className = `cam-card${index === state.activeIndex ? " active" : ""}`;
      card.tabIndex = 0;
      card.setAttribute("role", "button");
      card.setAttribute("aria-label", `Open ${candidate.name}'s session`);
      card.innerHTML = `<div class="cam-thumb" style="background:${candidate.color}22"><span class="cam-initials" style="color:${candidate.color}">${candidate.initials}</span><span class="cam-status-dot ${candidate.status}"></span></div><div class="cam-label">${candidate.name}</div><div class="cam-sub">${state.triggerData.sessionLabel}</div>`;
      card.addEventListener("click", () => switchCandidate(index, card));
      card.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") { event.preventDefault(); switchCandidate(index, card); }
      });
      elements.camRail.appendChild(card);
    });
  }

  function applyCandidate(index) {
    state.activeIndex = index;
    const candidate = activeCandidate();
    elements.mainCandidateAvatar.textContent = candidate.initials;
    elements.mainCandidateAvatar.style.cssText = `color:${candidate.color};border-color:${candidate.color};background-color:${candidate.color}22`;
    elements.mainCandidateName.textContent = candidate.name;
    elements.candidateIdLabel.textContent = candidate.id;
    elements.mainSessionLabel.textContent = state.triggerData.sessionLabel;
    elements.noteArea.value = candidate.noteDraft;
    updateExamDisplay();
    renderCandidateRail();
    renderChatWindow();
    renderActivityLog();
    if (!elements.candidateInfoPanel.hidden) renderCandidateInfo();
  }

  function protectedFeatureName() {
    if (typingTest.hasProgress()) return "Typing Test";
    if (scenarioEngine.hasProgress()) return "Scenario Mode";
    return null;
  }

  function closeProgressConfirmation(restoreFocus = true) {
    elements.progressConfirmOverlay.classList.remove("open");
    elements.progressConfirmOverlay.setAttribute("aria-hidden", "true");
    const trigger = navigationTrigger;
    navigationTrigger = null;
    if (restoreFocus && trigger?.isConnected) trigger.focus();
  }

  function requestProtectedNavigation(action, trigger) {
    const featureName = protectedFeatureName();
    if (!featureName) {
      action();
      return;
    }
    pendingNavigation = action;
    navigationTrigger = trigger || document.activeElement;
    elements.progressConfirmTitle.textContent = `Leave ${featureName}?`;
    elements.progressConfirmMessage.textContent = `Your current ${featureName} progress will be lost. Stay to continue, or abandon the exercise and proceed.`;
    elements.progressConfirmOverlay.classList.add("open");
    elements.progressConfirmOverlay.setAttribute("aria-hidden", "false");
    elements.progressStayBtn.focus();
  }

  function abandonActiveFeature() {
    if (scenarioEngine.isActive()) scenarioEngine.exit();
    if (typingTest.getState() !== "inactive") typingTest.reset();
  }

  function activateTab(tabName, focusTab = true) {
    const tab = document.querySelector(`.tab[data-tab="${tabName}"]`);
    document.querySelectorAll(".tab").forEach(item => item.classList.remove("active"));
    tab.classList.add("active");
    elements.mainPanel.classList.remove("typing-mode", "scenario-mode");
    elements.chatWindow.hidden = true;
    elements.chatForm.hidden = true;
    elements.scenarioReviewRow.hidden = true;
    elements.candidateInfoPanel.hidden = true;
    elements.securityPanel.hidden = true;
    typingTest.hide();

    if (tabName === "chat") {
      elements.chatWindow.hidden = false;
      elements.chatForm.hidden = false;
      renderChatWindow();
    } else if (tabName === "info") {
      elements.candidateInfoPanel.hidden = false;
      renderCandidateInfo();
    } else if (tabName === "security") {
      elements.securityPanel.hidden = false;
    } else if (tabName === "typing") {
      elements.mainPanel.classList.add("typing-mode");
      typingTest.show();
    } else if (tabName === "scenario") {
      scenarioEngine.showSelection();
    }

    if (focusTab) tab.focus();
  }

  function navigateToTab(tabName, trigger) {
    const activeTab = document.querySelector(".tab.active")?.dataset.tab;
    if (activeTab === tabName) return;
    requestProtectedNavigation(() => {
      abandonActiveFeature();
      activateTab(tabName);
    }, trigger);
  }

  function switchCandidate(index, trigger = null, force = false) {
    if (!force && index === state.activeIndex) return;
    const commitSwitch = () => {
      abandonActiveFeature();
      applyCandidate(index);
      activateTab("chat", !force);
    };
    if (force) commitSwitch();
    else requestProtectedNavigation(commitSwitch, trigger);
  }

  function toggleExamState() {
    const candidate = activeCandidate();
    if (!candidate.examStarted) { candidate.examStarted = true; candidate.examPaused = false; candidate.status = "live"; }
    else if (!candidate.examPaused) { candidate.examPaused = true; candidate.status = "paused"; }
    else { candidate.examPaused = false; candidate.status = "live"; }
    logEvent({ title: candidate.examPaused ? "Exam paused" : candidate.secondsElapsed ? "Exam resumed" : "Candidate started the exam. Attempt: 1", sub: `${state.triggerData.sessionLabel}<br>${candidate.name}`, tag: "note", tagLabel: "note" });
    updateExamDisplay();
    renderCandidateRail();
  }

  function initializeCandidateState() {
    candidates.forEach(candidate => Object.assign(candidate, {
      messages: [], activityLog: [], noteDraft: "", secondsElapsed: 0,
      examStarted: false, examPaused: false, status: "ready", photoCaptures: [],
    }));
    candidates.forEach(candidate => logEvent({ title: "You accepted the assignment", sub: "Trainee@Contractor.simulator.com<br>Proctor", tag: "assignment", tagLabel: "assignment" }, candidate));
  }

  function initializeTabs() {
    document.querySelectorAll(".tab").forEach(tab => {
      tab.addEventListener("click", () => navigateToTab(tab.dataset.tab, tab));
    });
  }

  async function initialize() {
    ["camRail", "chatWindow", "activityLog", "chatForm", "chatInput", "candidateIdLabel", "mainCandidateAvatar", "mainCandidateName", "mainCandidateStatus", "mainSessionLabel", "liveTimer", "noteArea", "addNoteBtn", "examToggleBtn", "micToggleBtn", "takePhotoBtn", "candidateInfoPanel", "securityPanel", "infoCandidateName", "infoCandidateEmail", "infoExamName", "infoConfirmationNumber", "captureCount", "candidateCaptures", "progressConfirmOverlay", "progressConfirmTitle", "progressConfirmMessage", "progressStayBtn", "progressAbandonBtn", "scenarioReviewRow"].forEach(id => { elements[id] = document.getElementById(id); });
    elements.mainPanel = document.querySelector(".main-panel");
    try {
      const loaded = await Promise.all([
        loadJson("data/candidates.json", validateCandidates),
        loadJson("data/triggers.json", validateTriggerData),
        loadJson("data/typing-tests.json", validateTypingTests),
      ]);
      candidates = loaded[0].map(definition => ({ ...definition }));
      state.triggerData = loaded[1];
      typingTest = createTypingTest(loaded[2]);
    } catch (error) {
      console.error("Application data could not be loaded.", error);
      elements.mainPanel.innerHTML = `<section class="startup-error" role="alert"><h2>Training content could not be loaded</h2><p>${error.message}</p><p>Run the project through the provided local server and check the data files.</p></section>`;
      return;
    }

    initializeCandidateState();
    const services = { state, elements, activeCandidate, formatTime, addMessage, renderSingleMessage, renderChatWindow, showTypingIndicator, removeTypingIndicator, logEvent };
    chat = createChat(services);
    scenarioEngine = createScenarioEngine(services, scenarios, typingTest);
    initializeTabs();
    elements.progressStayBtn.addEventListener("click", () => {
      pendingNavigation = null;
      closeProgressConfirmation(true);
    });
    elements.progressAbandonBtn.addEventListener("click", () => {
      const action = pendingNavigation;
      pendingNavigation = null;
      closeProgressConfirmation(false);
      action?.();
    });
    elements.progressConfirmOverlay.addEventListener("click", event => {
      if (event.target === elements.progressConfirmOverlay) {
        pendingNavigation = null;
        closeProgressConfirmation(true);
      }
    });
    document.addEventListener("keydown", event => {
      if (!elements.progressConfirmOverlay.classList.contains("open")) return;
      if (event.key === "Escape") {
        event.preventDefault();
        pendingNavigation = null;
        closeProgressConfirmation(true);
      } else if (event.key === "Tab") {
        const first = elements.progressStayBtn;
        const last = elements.progressAbandonBtn;
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    });
    elements.chatForm.addEventListener("submit", event => {
      event.preventDefault();
      const text = elements.chatInput.value.trim();
      if (!text) return;
      if (scenarioEngine.canHandleReply()) scenarioEngine.handleReply(text);
      else chat.send(text);
      elements.chatInput.value = "";
    });
    elements.noteArea.addEventListener("input", () => { activeCandidate().noteDraft = elements.noteArea.value; });
    elements.addNoteBtn.addEventListener("click", () => {
      const note = elements.noteArea.value.trim();
      if (!note) return;
      logEvent({ title: "Note added", sub: `${note}<br>${activeCandidate().name}`, tag: "note", tagLabel: "note" });
      elements.noteArea.value = ""; activeCandidate().noteDraft = "";
    });
    elements.examToggleBtn.addEventListener("click", toggleExamState);
    elements.takePhotoBtn.addEventListener("click", () => {
      const candidate = activeCandidate();
      candidate.photoCaptures.push({ capturedAt: new Date().toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) });
      capturePages.set(candidate.id, 1);
      logEvent({ title: "Candidate photo captured", sub: `${candidate.name}<br>${candidate.id}`, tag: "note", tagLabel: "note" }, candidate);
      if (!elements.candidateInfoPanel.hidden) renderCandidateInfo();
    });
    elements.micToggleBtn.addEventListener("click", () => {
      const muted = elements.micToggleBtn.classList.toggle("is-muted");
      elements.micToggleBtn.setAttribute("aria-pressed", String(muted));
      elements.micToggleBtn.setAttribute("aria-label", muted ? "Unmute microphone" : "Mute microphone");
    });
    switchCandidate(0, null, true);
    setInterval(() => {
      candidates.forEach(candidate => { if (candidate.examStarted && !candidate.examPaused) candidate.secondsElapsed += 1; });
      updateExamDisplay();
    }, 1000);
  }

  document.addEventListener("DOMContentLoaded", initialize);
