# ProctorSim Training Simulator

ProctorSim is a frontend-only training environment for practicing proctor chat, exact-script typing, and scored operational scenarios. It uses native browser modules and external content files without a backend, database, AI API, persistence, or reporting.

## Core features

- **Chat:** the trainee sends proctor messages and receives deterministic candidate replies from configurable trigger rules.
- **Candidate Info:** displays candidate identity, exam details, and placeholder camera captures in newest-first pages of 12.
- **Typing Test:** provides exact-copy practice with live character highlighting, accuracy, and mistake counts.
- **Scenario Mode:** guides scenario conversations, evaluates required criteria, collects Action Tab details, and presents coaching feedback.
- **Security:** remains a separate placeholder for future frontend development.

All candidate conversations, timers, captures, notes, and exercise progress exist only in memory and reset when the page reloads.

## Current architecture

`index.html` loads one module entry point: `assets/js/app.js`. The application shell imports feature modules, utility modules, and the Scenario registry explicitly. No feature depends on global `window` variables or HTML script order.

```text
Prometric-Simulation/
|-- index.html
|-- assets/
|   |-- css/
|   |   |-- style.css          # Imports all stylesheet sections
|   |   |-- base.css           # Theme variables, reset, and top bar
|   |   |-- layout.css         # Main three-panel layout and navigation
|   |   |-- components.css     # Shared controls and modal styling
|   |   |-- chat.css           # Chat transcript and input
|   |   |-- typing-test.css    # Typing Test layout and states
|   |   |-- candidate.css      # Candidate Info and captures
|   |   |-- scenario.css       # Scenario selection and coaching
|   |   `-- activity.css       # Activity log, notes, and responsive rules
|   `-- js/
|       |-- app.js             # State, candidates, tabs, timers, notes, startup
|       |-- chat.js            # Ordinary trigger-reply chat behavior
|       |-- typing-test.js     # Typing Test UI and lifecycle
|       |-- scenario-engine.js # Scenario flow, actions, and feedback
|       |-- data-loader.js     # Content loading and validation
|       |-- matching-engine.js # Deterministic trigger matching
|       |-- scoring-engine.js  # Scenario criterion scoring
|       |-- typing-metrics.js  # Accuracy and mistake calculation
|       `-- pagination.js      # Capture pagination calculation
|-- data/
|   |-- candidates.json
|   |-- triggers.json
|   |-- typing-tests.json
|   `-- scenarios/
|       |-- index.js           # Scenario registry
|       `-- vpn-detected.js    # VPN scenario definition
|-- docs/
|   `-- UPDATING.md
|-- .gitignore
`-- README.md
```

## Content maintenance

- Edit candidates in `data/candidates.json`.
- Edit ordinary chat triggers and replies in `data/triggers.json`.
- Edit Typing Test exercises in `data/typing-tests.json`.
- Add a scenario definition and register it in `data/scenarios/index.js`.
- Edit the stylesheet associated with the feature being changed.

Ordinary content changes do not require editing HTML. HTML should change only when a genuinely new interface element is introduced.

See [docs/UPDATING.md](docs/UPDATING.md) for schemas and detailed maintenance instructions.

## Current scope

Only VPN Detected is registered in Scenario Mode. Trigger and scenario scoring use deterministic phrase rules rather than semantic or AI-based interpretation.
