// VPN training content only. Flow and rendering live in assets/js/scenario-engine.js.
export const vpnDetectedScenario = {
  id: "vpn-detected",
  label: "VPN Detected",
  setupText: candidateName =>
    `You are the <strong>proctor</strong> viewing <strong>${candidateName}</strong>'s session. ` +
    "The candidate cannot proceed because the system reports a VPN. Respond as you would during a live session.",

  exchanges: [
    {
      candidateMessage: "I can’t see my exam. It only says that a VPN was detected.",
      criteria: [
        {
          id: "acknowledge-problem",
          label: "Acknowledge that the candidate cannot see the exam",
          points: 20,
          required: true,
          anyOf: [
            ["understand", "exam", "not visible"],
            ["understand", "can't see", "exam"],
            ["understand", "cannot see", "exam"]
          ],
          feedback: "Acknowledge that the candidate cannot see the exam."
        },
        {
          id: "explain-vpn-detection",
          label: "Explain that the system detected a VPN",
          points: 40,
          required: true,
          anyOf: [
            ["system", "detected", "vpn"],
            ["vpn", "detected"]
          ],
          feedback: "Explain clearly that the system detected VPN usage."
        }
      ]
    },
    {
      candidateMessage: "What should I do next?",
      criteria: [
        {
          id: "exit-application",
          label: "Tell the candidate to exit the application",
          points: 40,
          required: true,
          anyOf: [
            ["exit", "application"],
            ["close", "application"],
            ["log out", "close", "browser"]
          ],
          feedback: "Tell the candidate to exit or close the application."
        }
      ]
    }
  ],

  actionFields: [
    { key: "cpr", label: "CPR Filed", prompt: "What CPR code did you file?" },
    { key: "capture", label: "Capture the Scenario", prompt: "Why did you capture the scenario?" },
    { key: "note", label: "Note", prompt: "What note did you input?" }
  ],

  feedback: {
    wrong: "The response did not address the required VPN-handling steps.",
    min: "Part of the issue was addressed, but several required points are still missing.",
    mid: "The response handled most of the situation but omitted at least one required point.",
    max: "The response acknowledged the problem, explained the VPN detection, and gave the correct next action."
  },

  idealResponse:
    "I understand that your exam is not visible. The system detected that you are using a VPN, which is preventing you from proceeding. Please exit the application now. I’ll document the incident and file a CPR."
};
