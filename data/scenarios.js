// ============================================================
// SCENARIO DEFINITIONS
// ============================================================
// This file is loaded as a plain <script> (not fetched as JSON) specifically
// so it can hold comments — makes it easy to add a new scenario or tweak an
// existing one's triggers/feedback without touching script.js.
//
// HOW TO ADD A NEW SCENARIO:
//   1. Copy one of the objects in the SCENARIOS array below.
//   2. Give it a unique `id` and a `label` (the label is what shows up in
//      the Scenario tab's dropdown).
//   3. Fill in setupText / candidateMessage1 / reply1Triggers / etc.
//   4. It will automatically appear in the dropdown — no other code changes
//      needed.
//
// SCORING MODEL:
//   Each of the two trainee replies (Step 3 and Step 6) is scored out of
//   100 by summing the `score` of every trigger whose keywords are found
//   in what the trainee typed. If NO trigger matches but the trainee wrote
//   at least `minWords` words, they get a small "minimum implied" fallback
//   score instead of a flat zero.
//   The two reply scores are added together (max 200) to decide the
//   Step 9 feedback tier:
//     0            -> wrong
//     1-99         -> min   (Minimum Trigger Achieved)
//     100-199      -> mid   (Mid Trigger Achieved)
//     200          -> max   (Maximum Trigger Achieved)
window.SCENARIOS = [
  {
    id: "vpn-detected",
    label: "VPN Detected",

    // ---------- Step 1: scenario setup ----------
    // Replaces the normal "you are the proctor" instructions box when this
    // scenario is selected from the dropdown.
    setupText: (candName) =>
      `You are the <strong>proctor</strong> in this simulation, now viewing <strong>${candName}</strong>'s session, ` +
      `but the candidate had encountered a problem saying there's a VPN Issue that's why he can't proceed. ` +
      `Type your script lines into the box below.`,

    // ---------- Step 2: first candidate message ----------
    candidateMessage1: "I can\u2019t see my exam it only say here that there is a VPN detected",

    // ---------- Step 3: trainee reply #1 — trigger/idea check ----------
    reply1Triggers: [
      {
        label: "Acknowledge the VPN issue",
        keywords: ["i understand why your exam is not visible"],
        score: 50,
      },
      {
        label: "Explain the VPN issue",
        keywords: ["system detected you are using a vpn", "detected a vpn"],
        score: 50,
      },
    ],
    // If neither trigger above matches, but the trainee still typed a real
    // sentence (>= this many words), give minimum-implied partial credit.
    reply1MinWords: 6,
    reply1MinWordsScore: 25,

    // ---------- Step 5: second candidate message ----------
    candidateMessage2: "What should I do next",

    // ---------- Step 6: trainee reply #2 — trigger/idea check ----------
    // *** PLACEHOLDER ***
    // The source PDF re-used the exact same trigger table here as Step 3
    // (looked like a copy-paste, not intentional). Kept as its own,
    // independently-editable block so the real "advise the candidate to
    // exit the application" criteria can be swapped in later without
    // touching reply1Triggers above.
    reply2Triggers: [
      {
        label: "Acknowledge the VPN issue",
        keywords: ["i understand why your exam is not visible"],
        score: 50,
      },
      {
        label: "Explain the VPN issue",
        keywords: ["system detected you are using a vpn", "detected a vpn"],
        score: 50,
      },
    ],
    reply2MinWords: 6,
    reply2MinWordsScore: 25,

    // ---------- Step 7: Action Tab fields (shown in the popup/modal) ----------
    actionFields: [
      { key: "cpr", label: "CPR Filed", prompt: "What CPR code did you file?" },
      { key: "capture", label: "Capture the Scenario", prompt: "Why did you capture the scenario?" },
      { key: "note", label: "Note", prompt: "What note did you input?" },
    ],

    // ---------- Step 9: feedback tiers ----------
    feedback: {
      wrong:
        "Your response does not clearly address the VPN issue. In this scenario, the candidate cannot proceed because the system detected VPN usage and the exam is not visible. You should acknowledge the issue, explain that the system detected a VPN, advise the candidate to exit the application, then document the incident and file CPR. Avoid giving unrelated troubleshooting steps or allowing the candidate to continue without addressing the VPN detection.",
      min:
        "You acknowledged part of the VPN issue, but your response is incomplete. You may have mentioned that the exam is not visible or that there is a VPN issue, but you still need to clearly advise the candidate to exit the application. After that, make sure to take note of the incident and file CPR. Be careful with spelling, punctuation, and clarity because unclear wording may confuse the candidate during a live session.",
      mid:
        "Good response. You addressed the VPN issue and explained why the candidate cannot proceed, but the response can still be more complete. Make sure your reply includes the required next action: advise the candidate to exit the application. Also remember the internal follow-up actions: document the incident properly and file CPR.",
      max:
        "Excellent response. You correctly acknowledged that the candidate\u2019s exam is not visible, explained that the system detected VPN usage, and advised the candidate to exit the application. You also completed the expected internal action by noting the incident and filing CPR. This is a complete and appropriate handling of the VPN detected scenario.",
    },

    // ---------- Ideal response (shown after the feedback box) ----------
    // *** PLACEHOLDER — edit once you have the finalized wording. ***
    idealResponse:
      "I understand why your exam is not visible currently \u2014 the system detected you are using a VPN, which is why it\u2019s blocked. Please exit the application now. I\u2019ll take note of this and file a CPR on my end.",
  },

  // Add more scenarios here later, e.g.:
  // {
  //   id: "id-verification-failed",
  //   label: "ID Verification Failed",
  //   ...
  // },
];
