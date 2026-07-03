import { score } from "./scoring-engine.js";

// Scenario definitions are injected; this module contains behavior only.
export function createScenarioEngine(app, scenarios, typingTest) {
  let mode = "inactive";
  let current = null;
  let replyIndex = -1;
  let awaitingReply = false;
  let results = [];
  let tabButton;
  let modalOverlay;
  let modalBox;
  let coachingOverlay;
  let coachingBody;
  let reviewButton;
  let acknowledgeButton;
  let feedbackButton;
  let sessionToken = 0;

  function closeCoachingModal() {
    coachingOverlay.classList.remove("open");
    coachingOverlay.setAttribute("aria-hidden", "true");
  }

  function showCoachingModal() {
    app.elements.scenarioReviewRow.hidden = true;
    coachingOverlay.classList.add("open");
    coachingOverlay.setAttribute("aria-hidden", "false");
    reviewButton.focus();
  }

  function reviewConversation() {
    closeCoachingModal();
    app.elements.chatForm.hidden = true;
    app.elements.scenarioReviewRow.hidden = false;
    app.elements.chatWindow.scrollTop = 0;
    feedbackButton.focus();
  }

  function addScenarioMessage(text, who, direction) {
    app.renderSingleMessage({ text, who, direction, time: app.formatTime() });
    app.elements.chatWindow.scrollTop = app.elements.chatWindow.scrollHeight;
  }

  function enterSelectionMode() {
    mode = "selecting";
    current = null;
    replyIndex = -1;
    awaitingReply = false;
    results = [];
    sessionToken += 1;
    document.querySelectorAll(".tab").forEach(tab => tab.classList.remove("active"));
    tabButton.classList.add("active");
    app.elements.mainPanel.classList.remove("typing-mode");
    app.elements.mainPanel.classList.add("scenario-mode");
    app.elements.candidateInfoPanel.hidden = true;
    app.elements.securityPanel.hidden = true;
    app.elements.chatWindow.hidden = false;
    app.elements.chatForm.hidden = true;
    app.elements.scenarioReviewRow.hidden = true;
    closeCoachingModal();
    typingTest.hide();

    const prompt = document.createElement("section");
    prompt.className = "scenario-selection-prompt";
    const icon = document.createElement("div");
    icon.className = "scenario-selection-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = "◇";
    const eyebrow = document.createElement("span");
    eyebrow.className = "scenario-selection-eyebrow";
    eyebrow.textContent = "Scenario Mode";
    const title = document.createElement("h2");
    title.textContent = "Choose a training scenario";
    const instructions = document.createElement("p");
    instructions.textContent = "Select an exercise below. Scenario chat becomes available after your selection.";
    const options = document.createElement("div");
    options.className = "scenario-selection-options";
    scenarios.forEach(scenario => {
      const option = document.createElement("button");
      option.type = "button";
      option.className = "scenario-option";
      const optionLabel = document.createElement("span");
      optionLabel.textContent = scenario.label;
      const optionAction = document.createElement("small");
      optionAction.textContent = "Start scenario";
      option.append(optionLabel, optionAction);
      option.addEventListener("click", () => start(scenario));
      options.appendChild(option);
    });
    prompt.append(icon, eyebrow, title, instructions, options);
    app.elements.chatWindow.replaceChildren(prompt);
  }

  function start(scenario) {
    mode = "running";
    current = scenario;
    replyIndex = -1;
    awaitingReply = false;
    results = [];
    sessionToken += 1;
    document.querySelectorAll(".tab").forEach(tab => tab.classList.remove("active"));
    tabButton.classList.add("active");
    app.elements.mainPanel.classList.remove("typing-mode");
    app.elements.mainPanel.classList.add("scenario-mode");
    app.elements.candidateInfoPanel.hidden = true;
    app.elements.securityPanel.hidden = true;
    app.elements.chatWindow.hidden = false;
    app.elements.chatForm.hidden = false;
    app.elements.scenarioReviewRow.hidden = true;
    closeCoachingModal();
    typingTest.hide();
    app.elements.chatWindow.innerHTML = "";
    const setup = document.createElement("div");
    setup.className = "chat-instructions";
    setup.innerHTML = scenario.setupText(app.activeCandidate().name);
    app.elements.chatWindow.appendChild(setup);
    showNextCandidateMessage();
  }

  function showNextCandidateMessage() {
    replyIndex += 1;
    awaitingReply = false;
    const exchange = current.exchanges[replyIndex];
    const token = sessionToken;
    app.showTypingIndicator();
    setTimeout(() => {
      if (token !== sessionToken || mode !== "running") return;
      app.removeTypingIndicator();
      addScenarioMessage(exchange.candidateMessage, app.activeCandidate().name, "in");
      awaitingReply = true;
    }, 800);
  }

  function canHandleReply() {
    return Boolean(mode === "running" && current && awaitingReply && replyIndex >= 0 && replyIndex < current.exchanges.length);
  }

  function handleReply(text) {
    if (!canHandleReply()) return;
    awaitingReply = false;
    addScenarioMessage(text, "You", "out");
    results.push(score(text, current.exchanges[replyIndex].criteria));
    if (replyIndex + 1 < current.exchanges.length) showNextCandidateMessage();
    else {
      replyIndex = current.exchanges.length;
      const prompt = document.createElement("div");
      prompt.className = "chat-instructions scenario-action-prompt";
      prompt.textContent = "Complete the Action Tab to finish this scenario.";
      app.elements.chatWindow.appendChild(prompt);
      openModal();
    }
  }

  function openModal() {
    modalBox.replaceChildren();
    const title = document.createElement("h3");
    title.className = "modal-title";
    title.textContent = `Action Tab — ${current.label}`;
    modalBox.appendChild(title);
    current.actionFields.forEach(field => {
      const label = document.createElement("label");
      label.className = "modal-field-label";
      label.textContent = field.label;
      const prompt = document.createElement("div");
      prompt.className = "modal-field-prompt";
      prompt.textContent = field.prompt;
      const input = document.createElement("textarea");
      input.className = "modal-field-input";
      input.id = `actionField_${field.key}`;
      input.rows = 2;
      modalBox.append(label, prompt, input);
    });
    const submit = document.createElement("button");
    submit.className = "modal-submit-btn";
    submit.textContent = "Submit";
    submit.addEventListener("click", finish);
    modalBox.appendChild(submit);
    modalOverlay.classList.add("open");
  }

  function resultList(label, criteria, emptyText) {
    const section = document.createElement("div");
    const heading = document.createElement("strong");
    heading.textContent = label;
    section.appendChild(heading);
    const list = document.createElement("ul");
    (criteria.length ? criteria : [{ label: emptyText }]).forEach(criterion => {
      const item = document.createElement("li");
      item.textContent = criterion.label;
      list.appendChild(item);
    });
    section.appendChild(list);
    return section;
  }

  function finish() {
    mode = "completed";
    const values = {};
    current.actionFields.forEach(field => { values[field.key] = document.getElementById(`actionField_${field.key}`).value.trim(); });
    modalOverlay.classList.remove("open");
    const points = results.reduce((sum, result) => sum + result.points, 0);
    const possible = results.reduce((sum, result) => sum + result.possiblePoints, 0);
    const matched = results.flatMap(result => result.matched);
    const missing = results.flatMap(result => result.missingRequired);
    const ratio = possible ? points / possible : 0;
    const tier = missing.length === 0 && ratio === 1 ? "max" : ratio >= 0.5 ? "mid" : ratio > 0 ? "min" : "wrong";
    const labels = { wrong: "Needs Improvement", min: "Minimum Trigger Achieved", mid: "Mid Trigger Achieved", max: "Maximum Trigger Achieved" };
    app.elements.chatWindow.querySelector(".scenario-action-prompt")?.remove();
    app.elements.chatForm.hidden = true;
    app.elements.scenarioReviewRow.hidden = true;

    coachingBody.replaceChildren();
    const modalTitle = document.createElement("h3");
    modalTitle.className = "modal-title";
    modalTitle.id = "scenarioCoachingTitle";
    modalTitle.textContent = `Coaching Feedback — ${current.label}`;
    const feedback = document.createElement("div");
    feedback.className = `scenario-feedback tier-${tier}`;
    const heading = document.createElement("strong");
    heading.textContent = `${labels[tier]} — ${points}/${possible} points`;
    feedback.appendChild(heading);
    const summary = document.createElement("p");
    summary.textContent = current.feedback[tier];
    feedback.append(summary, resultList("Matched criteria", matched, "None"), resultList("Missing required criteria", missing, "None"));
    missing.forEach(criterion => {
      if (!criterion.feedback) return;
      const note = document.createElement("p");
      note.textContent = criterion.feedback;
      feedback.appendChild(note);
    });
    const ideal = document.createElement("div");
    ideal.className = "scenario-feedback tier-ideal";
    ideal.innerHTML = `<strong>Ideal Response</strong>${current.idealResponse}`;
    coachingBody.append(modalTitle, feedback, ideal);
    const noteSummary = current.actionFields.map(field => `${field.label}: ${values[field.key] || "—"}`).join("<br>");
    app.logEvent({ title: `Scenario complete: ${current.label}`, sub: `${noteSummary}<br>${app.activeCandidate().name}`, tag: "note", tagLabel: "note" });
    showCoachingModal();
  }

  function exit() {
    mode = "inactive";
    current = null; replyIndex = -1; awaitingReply = false; results = [];
    sessionToken += 1;
    modalOverlay.classList.remove("open");
    closeCoachingModal();
    app.elements.mainPanel.classList.remove("scenario-mode");
    app.elements.scenarioReviewRow.hidden = true;
    app.elements.chatForm.hidden = false;
    app.renderChatWindow();
  }

  tabButton = document.getElementById("scenarioTabBtn");
  modalOverlay = document.getElementById("actionModalOverlay");
  modalBox = document.getElementById("actionModalBox");
  coachingOverlay = document.getElementById("scenarioCoachingOverlay");
  coachingBody = document.getElementById("scenarioCoachingBody");
  reviewButton = document.getElementById("scenarioReviewBtn");
  acknowledgeButton = document.getElementById("scenarioAcknowledgeBtn");
  feedbackButton = document.getElementById("scenarioFeedbackBtn");
  reviewButton.addEventListener("click", reviewConversation);
  feedbackButton.addEventListener("click", showCoachingModal);
  acknowledgeButton.addEventListener("click", () => { closeCoachingModal(); enterSelectionMode(); });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && coachingOverlay.classList.contains("open")) { event.preventDefault(); reviewConversation(); }
  });

  return {
    isActive: () => mode !== "inactive",
    getMode: () => mode,
    showSelection: enterSelectionMode,
    hasProgress: () => mode === "running" || mode === "completed",
    canHandleReply,
    handleReply,
    exit,
  };
}
