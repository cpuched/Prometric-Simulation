# Maintaining ProctorSim

ProctorSim separates editable training content, feature behavior, reusable calculations, and visual styling. Keep these boundaries intact so future content updates remain small and predictable.

## What to edit

| Change | File | Additional interface change? |
|---|---|---|
| Candidate identity | `data/candidates.json` | No |
| Ordinary trigger or reply | `data/triggers.json` | No |
| Typing exercise | `data/typing-tests.json` | No |
| Scenario wording or criteria | Its module in `data/scenarios/` | Register the module only |
| Feature appearance | Relevant file in `assets/css/` | No HTML unless adding a control |

Content IDs must be non-empty and unique. JSON files use double quotes and cannot contain comments.

## Candidates

Add or edit candidate definitions in `data/candidates.json`:

```json
{
  "id": "0000000001645112",
  "name": "Candidate 1",
  "email": "Candidate1@datamatics.com",
  "examName": "ZZDEMO Test",
  "initials": "C1",
  "color": "#4a90d9"
}
```

Runtime transcripts, notes, timers, and captures are created separately by `app.js`; they do not belong in the candidate data file.

## Ordinary trigger replies

Edit `data/triggers.json`:

```json
{
  "id": "workspace-check",
  "priority": 10,
  "anyOf": [
    ["show", "workspace"],
    ["show me your desk"]
  ],
  "noneOf": ["do not"],
  "reply": "Okay, here is my entire workspace."
}
```

- Every inner `anyOf` array is one complete match option; all its words or phrases must be present.
- Completing any one option matches the trigger.
- `noneOf` is optional and prevents a match when one of its phrases is present.
- Multiple matches resolve by highest `priority`, greatest phrase specificity, then file order.
- Unmatched messages use an entry from `fallbackReplies`.

Adding or editing an ordinary trigger requires no HTML, CSS, or JavaScript change.

## Typing Test exercises

Add an object to `data/typing-tests.json`:

```json
{
  "id": "workspace-check",
  "category": "Security Scan",
  "title": "Check the Workspace",
  "difficulty": "Intermediate",
  "script": "Please show me the top and underside of your workspace.",
  "purpose": "Practices the required workspace inspection instruction."
}
```

The Typing Test behavior and metric calculation do not need modification for ordinary exercise changes.

## Scenario definitions

Scenario definitions contain training content only: setup text, ordered exchanges, scoring criteria, Action Tab fields, tier feedback, and an ideal response.

```js
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
```

Each criterion awards points once. Missing required criteria and their specific feedback are shown in the coaching modal.

### Add a scenario

1. Create `data/scenarios/<scenario-id>.js` and export its definition.
2. Import the definition in `data/scenarios/index.js`.
3. Add it to the exported frozen `scenarios` array.

No HTML or CSS change is required when the scenario uses the existing conversation, Action Tab, scoring, and coaching interface.

## Stylesheets

- `base.css`: colors, typography defaults, reset, and top bar.
- `layout.css`: page grid, candidate rail, center panel, controls, and tabs.
- `components.css`: reusable modal and confirmation controls.
- `chat.css`: transcript, message bubbles, and chat input.
- `typing-test.css`: Typing Test presentation.
- `candidate.css`: Candidate Info, captures, and pagination.
- `scenario.css`: Scenario selection, results, and coaching presentation.
- `activity.css`: activity rail, notes, and responsive layout rules.

`style.css` only imports these sections. Put new rules in the stylesheet owned by the affected feature instead of expanding the entry file.

## Module responsibilities

- `app.js`: application state, initialization, navigation, candidate switching, timers, notes, and capture rendering.
- Feature modules: Chat, Typing Test, and Scenario user-interface behavior.
- Utility modules: data validation, trigger matching, scoring, typing calculations, and pagination.
- `data/`: editable content without DOM manipulation or feature flow logic.

Feature modules use explicit imports and injected services. Do not add new `window` globals or make content definitions manipulate the interface directly.
