# CLI Incognito Mode — Design

**Date:** 2026-07-21
**Scope:** `packages/cli` only. No server changes.

## Goal

Add an incognito mode to the `drift` CLI so that a shoulder-surfer glancing at
the terminal cannot tell a chat is happening — the screen reads as ordinary
application log output. Activated with `drift --incognito` or `drift -ic`.

## Threat model

Casual shoulder-surfing: someone glancing at the screen for a few seconds.
Not: forensic inspection, scrollback analysis, or an attacker who controls the
machine. The disguise only needs to survive a glance.

## Activation & scope

- Flag: `--incognito` or `-ic`, parsed from `process.argv` in `cli.js`.
- The flag lives as `display.incognito` on the single `Display` instance.
  `ChatClient` and `InputHandler` already hold a reference to `display`, so they
  read `this.display.incognito` — no new constructor parameters anywhere.
- Client-only. The server is untouched.
- Snake mode is **not** offered in incognito.

## Behavior by area

### 1. Entry flow (no banner, disguised prompts)

- Skip `display.displayBanner()`.
- Skip the version-checker notice (`versionChecker.checkForUpdates()` output).
- Replace the `create / join / snake / exit` menu with two bare `inquirer`
  input prompts, no color/emoji:
  - `host:` — room code. **Blank → create a new room.** Non-blank → join it.
  - `user:` — nickname.
- `Connecting…` → plain `connecting...`.
- On **create**: the generated room code surfaces as a log line (you need it to
  invite others):
  `2026-07-21 13:04:20.001 [INFO ] boot  room=ABC123 listening`
- On **join**: no "Joined room" banner, no `--- Previous Messages ---`
  separators. Message history renders as log lines (via the incognito-aware
  `displayMessage`), followed by one `[INFO ] boot  session established`.

### 2. Message rendering (fake logs) — in `Display`

- Line format:
  `YYYY-MM-DD HH:MM:SS.mmm [LEVEL] module.name  <message text>`
  Muted / no color.
- Sender → deterministic fake module name: hash the nickname into a fixed pool
  (`auth.session`, `cache.redis`, `http.worker`, `queue.consumer`, `db.pool`,
  `net.gateway`). Same nickname always maps to the same module. Your own
  messages get a stable module too.
- Level: stable per sender, mostly `INFO` with some `DEBUG`, so the stream reads
  as varied rather than uniform.
- Timestamp comes from `message.timestamp` (existing field).
- Join/leave (`displaySystemMessage`) → **nickname-free** disguise:
  `[INFO ] net.pool  peer connected` / `peer disconnected`.
- Errors → `[ERROR] ...` line. Connection-lost → `[WARN ] connection reset`
  instead of the `❌` / `💔` text.

### 3. Input line

- `redrawInputBox` renders `$ ` (plain) instead of the blue `> `.
- `$ ` is 2 chars, same as `> `, so the existing cursor-position math is
  unchanged.

### 4. Stealth commands (replace `/`-commands while incognito)

| Incognito | Normal equivalent | Output |
|-----------|-------------------|--------|
| `exit`    | `/quit`           | leaves the room |
| `pwd`     | `/room`           | room code as a path: `/rooms/ABC123` |
| `man`     | `/help`           | terse plain usage: `usage: <text to send> | pwd | man | exit` |

- Any other non-empty line → sent as a chat message (same as today, just without
  the `/`-command branch).
- **Disabled in incognito:** games (`/trivia`, `/fortune`, `/art`), the `:`
  emoji-suggestion popup, and emoji-shortcut conversion on send. All of these
  produce colored/emoji output that contradicts the log disguise. They remain
  fully available in normal (non-incognito) mode.

## Deferred (not in this PR)

- **`ls` (list who's online).** The server's `joined_room` payload contains only
  message history, no member roster; the client learns about members only via
  `user_joined` / `user_left` events *after* joining, so it cannot list people
  who were already in the room. Doing `ls` honestly requires adding a roster to
  the server's `joined_room` payload — a separate, server-side change, out of
  scope for this client-only PR.

## Files touched

- `cli.js` — argv parse for `--incognito`/`-ic`; skip banner/version notice;
  disguised `host:`/`user:` entry flow; route setup output through incognito
  helpers.
- `modules/display.js` — `incognito` flag; `logLine()` formatter;
  `moduleFor(nickname)` mapper; incognito branches in `displayMessage`,
  `displaySystemMessage`, `redrawInputBox`; a `boot()`/`sysLog()` helper for
  callers.
- `modules/input-handler.js` — incognito command table (`exit`/`pwd`/`man`);
  skip emoji suggestions + conversion when incognito.
- `modules/chat-client.js` — route the `room_created` / `joined_room` /
  `error` / connection-lost console output through the incognito-aware display
  helpers.
- `README.md` (CLI) — document the flag.

## Non-goals

- No panic key / no runtime toggle (launch-flag only).
- No scrollback scrubbing.
- No server changes.

## Verification

- `drift` (no flag): unchanged — banner, menu, colored chat, games, emoji all
  work as before.
- `drift -ic` create: no banner; `host:`/`user:` prompts; room code appears as a
  `boot` log line; messages render as log lines; `$` prompt.
- `drift -ic` join: history renders as log lines, no chat separators.
- `exit` / `pwd` / `man` behave per the table; games/emoji popup do nothing.
- A deterministic self-check on `moduleFor()` (same nickname → same module) and
  on the `logLine()` format.
