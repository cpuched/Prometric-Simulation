import { findReply } from "./matching-engine.js";

export function createChat(app) {
  return {
    send(text) {
      const candidate = app.activeCandidate();
      app.addMessage({ text, who: "You", direction: "out" });
      app.logEvent({ title: "Proctor sent a chat message", sub: `${app.state.triggerData.sessionLabel}<br>${candidate.name}` });
      app.showTypingIndicator(candidate);
      setTimeout(() => {
        app.removeTypingIndicator(candidate);
        app.addMessage({ text: findReply(text, app.state.triggerData), who: candidate.name, direction: "in" }, candidate);
      }, 900 + Math.random() * 900);
    },
  };
}
