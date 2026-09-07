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
│       ├── add-token.ts   # Add/update per-space token
│       └── add-user.ts    # Add/update user for --tag mentions
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
type ApiResult = {
  data?: unknown
  error?: unknown
  success: boolean
}
```

**Profiles:** Config is organized into named profiles. Each profile is one `GChatAuth` (one key + many tokens). `DEFAULT_PROFILE` is `'default'`. Message commands take an optional `--profile` / `-p` flag (defaults to `default`); config commands take a **required** `profile` positional arg — except `config add-user`, which has none (the users list is global).

**Authentication:** Google Chat requires two credentials per space, scoped to a profile:

- An API key (`profile.key`) — shared across all spaces in that profile
- A per-space token (`profile.tokens[spaceId]`) — unique per space

**Users list:** `users` is a global map (outside profiles) of display name → Google Chat user ID (`users/123…`). Message commands take a repeatable `--tag` / `-t` flag: each value is a saved name or a raw `users/<id>`; resolved IDs are appended to the message as `<users/…>` mention lines. An unknown name logs an error and aborts the send.

**Config functions:**

- `readConfig()` — returns `GChatConfig | null`, logs error if missing (use in message commands)
- `readConfigOrEmpty(configDir, log)` — returns an empty config **only** when the file is missing (ENOENT); returns `null` + logs on unreadable/malformed config so writers never overwrite it (use in config commands; bail on `null` before mutating)
- `writeConfig()` — creates dir if needed, writes `{profiles, users}` object as JSON
- `resolveProfile(config, name, log)` — returns the profile's `GChatAuth`, or `null` + logs if not found (use in message commands after `readConfig`)
- `addUser(configDir, name, userId, log)` — upserts `users[name]` (prepends `users/` to bare IDs), rejects IDs whose `users/` part is empty or contains whitespace, writes, returns the updated `GChatConfig` or `null` + logs
- `resolveTags(config, names, log)` — maps `--tag` values to user IDs (passes through valid `users/<id>` values, validates saved IDs), or returns `null` + logs unknown names / invalid saved IDs

Config is stored at `~/.config/gchat/gchat-config.json`:

```json
{
  "profiles": {
    "default": {
      "key": "your-api-key",
      "tokens": {"SPACE_ID": "space-token"}
    },
    "work": {
      "key": "your-work-api-key",
      "tokens": {}
    }
  },
  "users": {"Jane Doe": "users/123456789012345678901"}
}
```

**Legacy migration:** A pre-profiles config with top-level `key`/`tokens` is read transparently as the `default` profile; the next `writeConfig()` upgrades the file to the `profiles` shape.

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
- `require-unicode-regexp` enforces the `v` flag, but `tsconfig` targets `es2022` where `tsc` rejects it (TS1501) — avoid regex literals; prefer string methods like `startsWith`

## Commit Message Convention

Always use Conventional Commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`
