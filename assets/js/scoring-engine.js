import { normalizeText } from "./matching-engine.js";

export function matchCriterion(text, criterion) {
  const answer = normalizeText(text);
  return criterion.anyOf.some(group => group.every(term => ` ${answer} `.includes(` ${normalizeText(term)} `)));
}

export function score(text, criteria) {
  const matched = [];
  const missingRequired = [];
  let points = 0;
  criteria.forEach(criterion => {
    if (matchCriterion(text, criterion)) {
      matched.push(criterion);
      points += criterion.points;
    } else if (criterion.required) missingRequired.push(criterion);
  });
  return { points, possiblePoints: criteria.reduce((sum, criterion) => sum + criterion.points, 0), matched, missingRequired };
}
