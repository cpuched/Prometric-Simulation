export function normalizeText(value) {
  return String(value).normalize("NFKD").toLocaleLowerCase().replace(/[’']/g, "'").replace(/[^a-z0-9']+/g, " ").trim().replace(/\s+/g, " ");
}

function containsPhrase(normalizedText, phrase) {
  const normalizedPhrase = normalizeText(phrase);
  if (!normalizedPhrase) return false;
  return ` ${normalizedText} `.includes(` ${normalizedPhrase} `);
}

function specificity(trigger) {
  return Math.max(...trigger.anyOf.map(group => group.reduce((sum, phrase) => sum + normalizeText(phrase).split(" ").length, 0)));
}

export function triggerMatches(text, trigger) {
  const normalized = normalizeText(text);
  if ((trigger.noneOf || []).some(phrase => containsPhrase(normalized, phrase))) return false;
  return trigger.anyOf.some(group => group.every(phrase => containsPhrase(normalized, phrase)));
}

export function findTrigger(text, triggers) {
  return triggers.map((trigger, index) => ({ trigger, index, specificity: specificity(trigger) }))
    .filter(entry => triggerMatches(text, entry.trigger))
    .sort((a, b) => (b.trigger.priority || 0) - (a.trigger.priority || 0) || b.specificity - a.specificity || a.index - b.index)[0]?.trigger || null;
}

export function findReply(text, triggerData, random = Math.random) {
  const match = findTrigger(text, triggerData.triggers);
  if (match) return match.reply;
  const fallbacks = triggerData.fallbackReplies;
  return fallbacks[Math.floor(random() * fallbacks.length)];
}
