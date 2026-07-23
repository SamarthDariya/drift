# Drift Chat CLI

> Terminal-based chat client for Drift Chat - create and join temporary chat rooms from your command line

[![npm version](https://img.shields.io/npm/v/drift-chat-cli.svg)](https://www.npmjs.com/package/drift-chat-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🚀 Quick Start

### Installation

```bash
npm install -g drift-chat-cli
```

### Usage

```bash
drift
```

## ✨ Features

- 🆕 **Create rooms** - Generate unique room codes instantly
- 🚪 **Join rooms** - Connect using room codes
- 💬 **Real-time chat** - WebSocket-powered messaging
- 🎨 **Beautiful interface** - Colorful terminal UI
- ⚡ **Fast & lightweight** - No browser required
- 🔒 **Temporary rooms** - Rooms auto-delete when empty

## 🎯 How to Use

1. **Install the CLI globally**:
   ```bash
   npm install -g drift-chat-cli
   ```

2. **Start the CLI**:
   ```bash
   drift
   ```

3. **Choose an option**:
   - Create a new chat room
   - Join an existing room with a code

4. **Start chatting**!

## 🕶️ Incognito Mode

Disguises the chat as terminal log output — ideal when you don't want shoulder-surfers reading your screen.

```bash
drift --incognito
# or
drift -ic
```

**Disguise styles** — pick how the screen looks with `--mode=`:

```bash
drift -ic --mode=htop    # process monitor (default)
drift -ic --mode=syslog  # plain syslog lines
drift -ic --mode=json    # structured JSON logs
drift -ic --mode=ci      # CI/CD pipeline (green ✓ steps; messages as ✗ failures)
```

**Set a default mode** so you don't have to pass `--mode=` every time:

```bash
drift --set-mode=json    # saved to ~/.config/drift/config.json
drift -ic                # now uses json
drift -ic --mode=htop    # a --mode= flag still overrides the saved default
```

Precedence: `--mode=` flag → saved default → `htop`.

In `json` mode every line is a JSON log object
(`{"timestamp","level","author","log"}`). A background stream of decoy
`info`/`debug`/`warn` logs keeps the screen busy; your incoming chat messages
arrive at `level: "error"` fenced with full-width `===` bars so you can spot
them at a glance while a passerby just sees a noisy service log.

**Entry flow:**
- `host:` — room code to join (leave blank to create a new room)
- `user:` — your nickname

**In-chat commands (incognito):**

| Command | Action |
|---------|--------|
| `exit` | Leave the room |
| `pwd` | Show room code as `/rooms/ABC123` |
| `seed` | Toggle the background decoy-log stream on/off |
| `hide` | Toggle hiding real messages (show only decoy noise) |
| `mode?` | List available disguises (current one marked) |
| `mode=<name>` | Switch disguise live, e.g. `mode=htop` — re-renders the conversation so far in the new style (decoy noise is dropped and refills) |
| `man` | Show usage help |

Messages render as fake timestamped log lines. Games, emoji suggestions, and slash commands are disabled.

## 💬 Chat Commands

While in a chat room (normal mode), you can use these commands:

- `/quit` - Leave the current room
- `/room` - Show the current room code

## 🌐 About Drift Chat

Drift Chat is a real-time chat application that allows you to create temporary chat rooms for quick conversations. No registration required - just create a room, share the code, and start chatting!

- **Web version**: [drift.abhinavaditya.com](https://drift.abhinavaditya.com)
- **Source code**: [GitHub](https://github.com/abhinav162/drift)

## 🛠️ Requirements

- Node.js >= 14.0.0
- Internet connection

## 📝 License

MIT © [Abhinav Aditya](https://github.com/abhinav162)

## 🐛 Issues & Support

Found a bug or have a suggestion? Please [open an issue](https://github.com/abhinav162/drift/issues) on GitHub.