# list-members Command Design

## Summary

Add a `gchat list-members` CLI command that fetches all members in a Google Chat space with full pagination.

## Google Chat API

- **Endpoint:** `GET /v1/spaces/{spaceId}/members?key={apiKey}&token={token}`
- **Query params:** `pageSize` (max 1000), `pageToken` for pagination
- **Response:** `{ memberships: [...], nextPageToken?: string }`
- **Auth:** Same key+token pattern as existing commands

## New Files

- `src/commands/gchat/list-members.ts` — Oclif command
- `test/commands/gchat/list-members.test.ts` — Command tests

## Modified Files

- `src/gchat/gchat-api.ts` — Add `listMembers()` with auto-pagination via `get()` method
- `src/gchat/gchat-client.ts` — Add `listMembers()` wrapper function
- `test/gchat/gchat-api.test.ts` — Tests for `listMembers()` and new `get()` method
- `test/gchat/gchat-client.test.ts` — Tests for client wrapper

## Architecture

### API Layer (`gchat-api.ts`)

Add a private `get()` method (mirrors existing `post()`) and a public `listMembers()` method that loops until `nextPageToken` is absent, concatenating all `memberships` arrays.

```typescript
async listMembers(spaceId: string, apiToken: string): Promise<ApiResult> {
  let allMemberships = []
  let pageToken = ''
  while (true) {
    const url = `${BASE_URL}/spaces/${spaceId}/members?key=${this.apiKey}&token=${apiToken}&pageSize=1000${pageToken ? `&pageToken=${pageToken}` : ''}`
    const result = await this.get(url)
    if (!result.success) return result
    const data = result.data as any
    allMemberships = allMemberships.concat(data.memberships ?? [])
    pageToken = data.nextPageToken
    if (!pageToken) break
  }
  return { data: { memberships: allMemberships }, success: true }
}
```

### Client Layer (`gchat-client.ts`)

```typescript
export async function listMembers(auth: GChatAuth, spaceId: string): Promise<ApiResult> {
  const apiToken = auth.tokens[spaceId]
  if (!apiToken) return { error: `No API token configured for space: ${spaceId}`, success: false }
  const api = initGChat(auth.key)
  return api.listMembers(spaceId, apiToken)
}
```

### Command (`list-members.ts`)

- **Arg:** `spaceId` (required)
- **Flags:** `--toon` for TOON output
- **Flow:** parse args, readConfig, listMembers, clearClients, output

## Testing

- API tests: single page, multi-page pagination, error response
- Client tests: delegation, missing token error, singleton reuse
- Command tests: correct output, missing config, TOON flag
