# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**gchat** (`@hesed/gchat`) is an Oclif-based CLI tool for sending messages to Google Chat spaces via the Google Chat REST API.

## Development Commands

```bash
# Build
npm run build

# Run all tests
npm test

# Run a single test file
npx mocha test/path/to/test.test.ts

# Lint and format
npm run lint
npm run format

# Find dead code
npm run find-deadcode

# Test with coverage (50% minimum threshold)
npm run test:coverage
```

## Architecture

```
src/
├── commands/gchat/        # Oclif CLI commands
│   ├── create-message.ts  # Send a new message to a space
│   ├── reply-message.ts   # Reply to a thread
│   └── config/
│       ├── set-key.ts     # Set global API key
│       └── add-token.ts   # Add/update per-space token
├── gchat/
│   ├── gchat-api.ts       # GChatApi class (native fetch, POST to Google Chat REST API)
│   └── gchat-client.ts    # Singleton wrapper functions + clearClients()
├── config.ts              # Config read/write (gchat-config.json)
└── format.ts              # TOON output formatting
```

### Key Architectural Patterns

**Two-Tier API Pattern:**
- **Client layer** (`gchat-client.ts`) — singleton `GChatApi` instance, exported functions (`newMessage`, `replyMessage`), `clearClients()` for cleanup
- **API layer** (`gchat-api.ts`) — `GChatApi` class using native `fetch`, returns `ApiResult`

**ApiResult:**
```typescript
interface ApiResult {
  data?: unknown
  error?: unknown
  success: boolean
}
```

**Authentication:** Google Chat requires two credentials per space:
- A global API key (`auth.key`) — shared across all spaces
- A per-space token (`auth.tokens[spaceId]`) — unique per space

**Config functions:**
- `readConfig()` — returns `GChatConfig | null`, logs error if missing (use in message commands)
- `readConfigOrEmpty()` — returns `GChatConfig` with empty defaults (use in config commands)
- `writeConfig()` — creates dir if needed, writes `auth` object as JSON

Config is stored at `~/.config/gchat/gchat-config.json`:
```json
{
  "key": "your-api-key",
  "tokens": {
    "SPACE_ID": "space-token"
  }
}
```

## Adding a New Command

1. Create `src/commands/gchat/<name>.ts` extending `Command`
2. In `run()`: parse args, call `readConfig()`, call client function, `clearClients()`, output via `this.logJson()` or `this.log(formatAsToon(result))`
3. Use `--toon` flag for TOON output, `--formatted` / `-f` flag for Google Chat formatted text

**Argument ordering:** When positional args aren't alphabetically ordered, wrap `static args` with `/* eslint-disable/enable perfectionist/sort-objects */`.

Example (`create-message.ts`):
```typescript
/* eslint-disable perfectionist/sort-objects */
static override args = {
  spaceId: Args.string({description: 'Google Chat space ID', required: true}),
  message: Args.string({description: 'Message text to send', required: true}),
}
/* eslint-enable perfectionist/sort-objects */
```

## Testing

- Tests mirror source structure under `test/`
- Mocha + Chai + sinon; `esmock` for ES module mocking
- `esmock` paths must use `.js` extensions even for `.ts` source files
- `posttest` runs `npm run lint` — clean test run requires lint to pass
- 60-second timeout

**Test pattern:**
```typescript
const imported = await esmock('../../../../src/commands/gchat/create-message.js', {
  '../../../../src/config.js': {readConfig: readConfigStub},
  '../../../../src/gchat/gchat-client.js': {clearClients: clearClientsStub, newMessage: newMessageStub},
})
GChatCreateMessage = imported.default

const cmd = new GChatCreateMessage(['SPACE_ID', 'Hello'], {
  configDir: '/tmp/test-config',
  root: process.cwd(),
  runHook: stub().resolves({failures: [], successes: []}),
} as any)
```

- Positional arg array order must match `static args` definition order
- `configDir` required in constructor options for commands that call `readConfig`

### Linting quirks

- `unicorn/no-useless-undefined`: use `stub.firstCall.args[0] === undefined` instead of `stub.calledWith(undefined)`

## Commit Message Convention

Always use Conventional Commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`
