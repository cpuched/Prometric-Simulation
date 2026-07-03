export function calculateTypingMetrics(target, value) {
  if (!target.length) return { mistakes: 0, accuracy: 100 };
  const mistakes = [...target].reduce((total, character, index) => total + (value[index] !== character ? 1 : 0), 0);
  return { mistakes, accuracy: Math.round(((target.length - mistakes) / target.length) * 100) };
}
