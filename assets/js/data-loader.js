const schemas = {
  candidates: ["id", "name", "email", "examName", "initials", "color"],
  typingTests: ["id", "category", "title", "difficulty", "script", "purpose"],
};

function assertCollection(name, value, requiredFields) {
  if (!Array.isArray(value) || value.length === 0) throw new Error(`${name} must be a non-empty array.`);
  const ids = new Set();
  value.forEach((item, index) => {
    if (!item || typeof item !== "object") throw new Error(`${name}[${index}] must be an object.`);
    requiredFields.forEach(field => {
      if (typeof item[field] !== "string" || !item[field].trim()) throw new Error(`${name}[${index}].${field} is required.`);
    });
    if (ids.has(item.id)) throw new Error(`${name} contains duplicate id "${item.id}".`);
    ids.add(item.id);
  });
  return value;
}

export function validateCandidates(value) { return assertCollection("candidates", value, schemas.candidates); }
export function validateTypingTests(value) { return assertCollection("typingTests", value, schemas.typingTests); }

export function validateTriggerData(value) {
  if (!value || typeof value !== "object") throw new Error("triggers.json must contain an object.");
  assertCollection("triggers", value.triggers, ["id", "reply"]);
  value.triggers.forEach((trigger, index) => {
    if (!Array.isArray(trigger.anyOf) || !trigger.anyOf.length || trigger.anyOf.some(group => !Array.isArray(group) || !group.length)) {
      throw new Error(`triggers[${index}].anyOf must contain non-empty phrase groups.`);
    }
  });
  if (!Array.isArray(value.fallbackReplies) || !value.fallbackReplies.length) throw new Error("fallbackReplies must be non-empty.");
  return value;
}

export async function loadJson(url, validator) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`${url} returned HTTP ${response.status}.`);
  return validator(await response.json());
}
