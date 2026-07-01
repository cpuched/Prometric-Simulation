# ProctorSim — BPO Proctoring Tool Trainer

A lightweight, front-end-only simulator of a proctoring/monitoring interface, built to let
newbie BPO agents practice navigating the chat and activity-log workflow before they get
access to the real production tool.

## Features
- Reference-accurate layout: candidate/self camera panels, main video pane, live chat, and
  activity timeline
- **Auto-reply engine** — typing a trigger word/phrase (e.g. `disconnect`, `cant see`,
  `thank you`) in the chat box triggers a simulated candidate response after a short
  "typing…" delay, so trainees get used to real chat pacing
- Editable trigger/response pairs in `data/triggers.json` — no code changes needed to add
  new scenarios
- Live activity log with note-taking, styled to match the real tool's tag system
  (`note`, `assignment`, `disconnect`)
- Countdown "Live" timer for exam-session realism

## Tech stack
Plain HTML / CSS / JavaScript — no build step, no framework, no backend required.

## Running locally
Because `script.js` fetches `data/triggers.json`, opening `index.html` directly as a
`file://` URL will be blocked by the browser's CORS policy. Serve it locally instead:

**Option A — VS Code Live Server extension**
1. Install the "Live Server" extension in VS Code
2. Right-click `index.html` → "Open with Live Server"

**Option B — Python's built-in server**
```bash
cd bpo-sim-tool
python3 -m http.server 8000
```
Then open `http://localhost:8000` in your browser.

## Project structure
```
bpo-sim-tool/
├── index.html          # Page structure / layout
├── style.css            # Dark theme styling matching the reference tool
├── script.js             # Chat logic, trigger matching, activity log
├── data/
│   └── triggers.json    # Editable keyword → auto-reply mapping
└── README.md
```

## Customizing scenarios
Open `data/triggers.json` and add new entries under `triggers`:
```json
{
  "keywords": ["your keyword here"],
  "reply": "The auto-reply text shown to the trainee"
}
```
`fallbackReplies` is used when no keyword matches, so the chat never goes silent.

## Roadmap ideas
- [ ] Score trainees on response time / correct escalation choices
- [ ] Add a "Candidate Info" and "Security" tab with mock data
- [ ] Persist session transcripts (would need a backend + PostgreSQL — see below)
- [ ] Multi-scenario picker (disconnect drill, ID verification drill, etc.)

### If persistence is added later
This version is intentionally backend-free. If trainee session history, scoring, or
multi-user accounts are needed down the line, the natural next step is a small
Node.js + Express API backed by PostgreSQL, since Postgres handles JSON chat-log columns
well and pairs cleanly with a JS/TS backend.
