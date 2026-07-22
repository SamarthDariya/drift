# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm install` — install root + workspace deps (npm workspaces).
- `npm run dev` / `npm start` — both just run `node server.js` on port **3000**. No watch/reload, no build step; restart manually after server changes.
- CLI local run: `node packages/cli/cli.js` (or `cd packages/cli && node cli.js`).
- Docker: `docker-compose up -d --build` (maps host **3150** → container 3000). `./deploy.sh` wraps this for the Oracle VM host.

There are **no tests and no linter/formatter** configured. `npm test` does not exist.

## Architecture

Two clients (web + terminal CLI) talk to one Node server over a single WebSocket connection, using a JSON message protocol keyed by a `type` field.

### Server (`server.js`) — the whole backend, one file
- Raw Node `http` + `ws` only. **Not Express** (the README says Express — it's wrong). `http.createServer` serves static files from `public/`; `WebSocket.Server({ server })` shares the same port.
- All state is an in-memory `rooms` Map (`code → { code, clients:Set, messages:[], snakeGame? }`). **Nothing is persisted** — restart wipes everything. Rooms are deleted automatically when their last client disconnects (`ws.on('close')`).
- Each socket carries ad-hoc state: `ws.nickname` and `ws.joinedRooms` (a Set — a single connection can be in multiple rooms). `broadcastToRoom(code, msg, excludeClient?)` is the fan-out primitive.
- The `switch(data.type)` in `wss.on('connection')` is the routing table. Two protocols share it:
  - **Chat**: `create_room`, `join_room`, `send_message` → server replies/broadcasts `room_created`, `joined_room`, `message`, `user_joined`, `user_left`, `error`.
  - **Multiplayer Snake** (all `snake_*` types): the server is authoritative. It runs a fixed-timestep game loop via `setInterval(tickSnakeGame, SNAKE_TICK_MS)` and broadcasts `snake_state` every tick. Game lifecycle is a state machine: `waiting → countdown → playing → gameover`, with restart-by-unanimous-vote. Collision/food/rank logic all lives in `tickSnakeGame` and its helpers. Adding a snake feature usually means touching both a `snake_*` case and the tick loop.

When adding any new realtime feature, add a `case` in the server switch **and** a matching handler in the client(s) below.

### Web client (`public/`) — vanilla JS, no framework/build
- `script.js` opens the WebSocket to `${ws|wss}//${window.location.host}` (auto-picks protocol from page), so it always talks to the server that served the page. `index.html` + `style.css` are static.

### CLI client (`packages/cli/`) — published to npm as `drift-chat-cli`
- Entry `cli.js`, feature modules in `modules/` (`chat-client.js`, `snake-client.js`, `display.js`, `input-handler.js`, `games.js`, `emoji.js`, `version-checker.js`, `snake-renderer.js`).
- **Gotcha for local testing:** chat (`modules/chat-client.js`) is **hardcoded to `wss://drift.abhinavaditya.com`** — it will not hit your local server. Only Snake (`modules/snake-client.js`) honors the `DRIFT_WS_URL` env var. To test CLI chat against a local server you must edit the hardcoded URL.
- **Incognito mode** (`drift --incognito`/`-ic`, optional `--mode=htop|syslog|json`): disguises the chat UI as a boring terminal program. It's a **display skin over the same chat client** — flags are parsed in `cli.js`, which sets `display.incognito`/`display.incognitoMode` and routes startup through `incognitoStart()`. Each skin is a module in `modules/incognito-modes/` (registered in `index.js`; `getMode()` falls back to `htop`) exposing a common interface (`header()`, `formatBoot`, `formatError`, `formatMessage`, `formatSystem`, `seedLine()`, `prompt`). `display.js` calls those hooks when incognito is on; it also keeps a `_timeline` buffer plus a fake-activity **seeder** and a **hide/unhide** toggle (`toggleHide()`) that redraws showing only seeded (decoy) lines. Adding a new disguise = new module implementing that interface + one line in `incognito-modes/index.js`; no server changes.

## Release / CI

`.github/workflows/publish.yml`: any push to `main` that touches `packages/cli/**` will **auto-bump the CLI patch version and `npm publish` it**, then push a `chore: bump CLI version [skip ci]` commit back to main. Treat merging CLI changes to `main` as a real npm release. Server/web changes do not trigger this.

## Note on this fork

This is a fork of the upstream `abhinav162/drift` project. `package.json` fields (`author`, `repository`, `homepage`), the hardcoded CLI server URL, and `deploy.sh`/nginx all still point at the original author's account and `drift.abhinavaditya.com`. Update these if this fork is meant to be published or deployed independently.
