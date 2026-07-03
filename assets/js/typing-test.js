import { calculateTypingMetrics } from "./typing-metrics.js";

export function createTypingTest(scripts, root = document) {
  const panel = root.getElementById("typingTest");
  const input = root.getElementById("typingInput");
  const scriptEl = root.getElementById("typingScript");
  const results = root.getElementById("typingResults");
  const nextButton = root.getElementById("nextScriptBtn");
  let currentIndex = 0;
  let status = "inactive";

  function currentScript() { return scripts[currentIndex]; }
  function renderCharacters(value) {
    const target = currentScript().script;
    scriptEl.replaceChildren();
    [...target].forEach((character, index) => {
      const span = document.createElement("span");
      span.textContent = character;
      span.className = index >= value.length ? "typing-char remaining" : value[index] === character ? "typing-char correct" : "typing-char incorrect";
      scriptEl.appendChild(span);
    });
  }
  function loadScript() {
    const item = currentScript();
    root.getElementById("typingCategory").textContent = item.category;
    root.getElementById("typingTitle").textContent = item.title;
    const difficulty = root.getElementById("typingDifficulty");
    difficulty.textContent = item.difficulty;
    difficulty.dataset.difficulty = item.difficulty.toLowerCase();
    root.getElementById("typingPurpose").textContent = item.purpose;
    input.value = ""; input.maxLength = item.script.length; input.disabled = false;
    results.hidden = true; nextButton.hidden = true; status = "ready"; renderCharacters("");
  }
  function finishScript(value) {
    const metrics = calculateTypingMetrics(currentScript().script, value);
    root.getElementById("typingAccuracy").textContent = `${metrics.accuracy}%`;
    root.getElementById("typingMistakes").textContent = metrics.mistakes;
    results.hidden = false; nextButton.hidden = false; input.disabled = true; status = "completed";
  }
  input.addEventListener("input", () => {
    const value = input.value;
    status = value.length ? "running" : "ready";
    renderCharacters(value);
    if (value.length === currentScript().script.length) finishScript(value);
  });
  nextButton.addEventListener("click", () => { currentIndex = (currentIndex + 1) % scripts.length; loadScript(); input.focus(); });

  return {
    show() { panel.hidden = false; if (status === "inactive") loadScript(); input.focus(); },
    hide() { panel.hidden = true; },
    reset() { status = "inactive"; input.value = ""; input.disabled = false; results.hidden = true; nextButton.hidden = true; panel.hidden = true; },
    getState: () => status,
    hasProgress: () => status === "running" || status === "completed",
  };
}
