# list-members Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `gchat list-members <spaceId>` command that fetches all members in a Google Chat space with full auto-pagination.

**Architecture:** Follows the existing two-tier pattern — a `get()` + `listMembers()` method on `GChatApi`, a `listMembers()` wrapper in `gchat-client.ts`, and a new Oclif command. The API layer auto-paginates by looping on `nextPageToken`.

**Tech Stack:** TypeScript, Oclif, native fetch, Mocha/Chai/sinon/esmock

---

### Task 1: Add `get()` and `listMembers()` to GChatApi

**Files:**
- Modify: `src/gchat/gchat-api.ts`
- Modify: `test/gchat/gchat-api.test.ts`

- [ ] **Step 1: Write failing tests for `listMembers`**

Add to `test/gchat/gchat-api.test.ts` inside the `describe('GChatApi', ...)` block, after the `replyMessage` describe block:

```typescript
  describe('listMembers', () => {
    it('GETs the correct URL with key and token', async () => {
      const responseData = {memberships: [{name: 'spaces/X/members/Y', member: {name: 'users/1', type: 'HUMAN'}, role: 'ROLE_MEMBER'}]}
      fetchStub.resolves(new Response(JSON.stringify(responseData), {status: 200}))

      await api.listMembers(SPACE_ID, API_TOKEN)

      const [url, options] = fetchStub.firstCall.args
      expect(url).to.include(`/spaces/${SPACE_ID}/members`)
      expect(url).to.include(`key=${API_KEY}`)
      expect(url).to.include(`token=${API_TOKEN}`)
      expect(url).to.include('pageSize=1000')
      expect(options.method).to.equal('GET')
    })

    it('returns success with memberships on 200 response', async () => {
      const responseData = {memberships: [{name: 'spaces/X/members/Y', member: {name: 'users/1', type: 'HUMAN'}, role: 'ROLE_MEMBER'}]}
      fetchStub.resolves(new Response(JSON.stringify(responseData), {status: 200}))

      const result = await api.listMembers(SPACE_ID, API_TOKEN)

      expect(result.success).to.be.true
      expect(result.data).to.deep.equal({memberships: responseData.memberships})
    })

    it('returns success with empty memberships when none exist', async () => {
      fetchStub.resolves(new Response(JSON.stringify({memberships: []}), {status: 200}))

      const result = await api.listMembers(SPACE_ID, API_TOKEN)

      expect(result.success).to.be.true
      expect(result.data).to.deep.equal({memberships: []})
    })

    it('auto-paginates by following nextPageToken', async () => {
      const page1 = {
        memberships: [{name: 'spaces/X/members/1'}],
        nextPageToken: 'page2token',
      }
      const page2 = {
        memberships: [{name: 'spaces/X/members/2'}],
      }

      fetchStub.onFirstCall().resolves(new Response(JSON.stringify(page1), {status: 200}))
      fetchStub.onSecondCall().resolves(new Response(JSON.stringify(page2), {status: 200}))

      const result = await api.listMembers(SPACE_ID, API_TOKEN)

      expect(result.success).to.be.true
      expect(result.data).to.deep.equal({
        memberships: [{name: 'spaces/X/members/1'}, {name: 'spaces/X/members/2'}],
      })
      expect(fetchStub.calledTwice).to.be.true
      expect(fetchStub.secondCall.args[0]).to.include('pageToken=page2token')
    })

    it('returns error on non-OK response', async () => {
      const errorBody = {error: {status: 'PERMISSION_DENIED'}}
      fetchStub.resolves(new Response(JSON.stringify(errorBody), {status: 403}))

      const result = await api.listMembers(SPACE_ID, API_TOKEN)

      expect(result.success).to.be.false
      expect(result.error).to.deep.equal(errorBody)
    })

    it('returns error on network exception', async () => {
      fetchStub.rejects(new Error('Network timeout'))

      const result = await api.listMembers(SPACE_ID, API_TOKEN)

      expect(result.success).to.be.false
      expect(result.error).to.equal('Network timeout')
    })
  })
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx mocha test/gchat/gchat-api.test.ts --timeout 60000`
Expected: FAIL — `api.listMembers is not a function`

- [ ] **Step 3: Implement `get()` and `listMembers()`**

Add to `src/gchat/gchat-api.ts` — a new private `get()` method after the `post()` method, and a new public `listMembers()` method after `replyMessage()`:

```typescript
  async listMembers(spaceId: string, apiToken: string): Promise<ApiResult> {
    let allMemberships: unknown[] = []
    let pageToken = ''
    while (true) {
      const url = `${GChatApi.BASE_URL}/spaces/${spaceId}/members?key=${this.apiKey}&token=${apiToken}&pageSize=1000${pageToken ? `&pageToken=${pageToken}` : ''}`
      // eslint-disable-next-line n/no-unsupported-features/node-builtins
      const result = await this.get(url)
      if (!result.success) return result
      const data = result.data as {memberships?: unknown[]; nextPageToken?: string}
      allMemberships = allMemberships.concat(data.memberships ?? [])
      pageToken = data.nextPageToken ?? ''
      if (!pageToken) break
    }

    return {data: {memberships: allMemberships}, success: true}
  }

  private async get(url: string): Promise<ApiResult> {
    try {
      // eslint-disable-next-line n/no-unsupported-features/node-builtins -- fetch is available in Node 18+
      const response = await fetch(url, {
        headers: {'Content-Type': 'application/json'},
        method: 'GET',
      })

      if (!response.ok) {
        const errorText = await response.text()
        let errorData: unknown
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = errorText
        }

        return {error: errorData, success: false}
      }

      const data: unknown = await response.json()
      return {data, success: true}
    } catch (error: unknown) {
      return {
        error: error instanceof Error ? error.message : String(error),
        success: false,
      }
    }
  }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx mocha test/gchat/gchat-api.test.ts --timeout 60000`
Expected: All PASS

- [ ] **Step 5: Commit**

```bash
git add src/gchat/gchat-api.ts test/gchat/gchat-api.test.ts
git commit -m "feat: add listMembers with auto-pagination to GChatApi"
```

---

### Task 2: Add `listMembers()` to gchat-client

**Files:**
- Modify: `src/gchat/gchat-client.ts`
- Modify: `test/gchat/gchat-client.test.ts`

- [ ] **Step 1: Write failing tests for `listMembers` client wrapper**

Add to `test/gchat/gchat-client.test.ts` inside the top-level `describe('gchat-client', ...)`, after the `replyMessage` describe block:

```typescript
  describe('listMembers', () => {
    it('delegates to GChatApi.listMembers with correct args', async () => {
      const result = await listMembersFn(mockAuth, SPACE_ID)

      expect(mockApiInstance.listMembers.calledOnce).to.be.true
      expect(mockApiInstance.listMembers.firstCall.args[0]).to.equal(SPACE_ID)
      expect(mockApiInstance.listMembers.firstCall.args[1]).to.equal('token-for-space')
      expect(result).to.deep.equal(mockResult)
    })

    it('returns error when space has no token configured', async () => {
      const result = await listMembersFn(mockAuth, 'UNKNOWN_SPACE')

      expect(result.success).to.be.false
      expect(result.error).to.include('UNKNOWN_SPACE')
      expect(mockApiInstance.listMembers.called).to.be.false
    })
  })
```

Also update the `beforeEach` to add `listMembers` to the mock API instance and import `listMembersFn`:

In the `mockApiInstance` object, add:
```typescript
      listMembers: stub().resolves(mockResult),
```

In the `const mod = await esmock(...)` block, add after `replyMessageFn`:
```typescript
    listMembersFn = mod.listMembers
```

And add `listMembersFn` to the variable declarations at the top alongside `newMessageFn` and `replyMessageFn`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx mocha test/gchat/gchat-client.test.ts --timeout 60000`
Expected: FAIL — `mod.listMembers` is undefined or `mockApiInstance.listMembers is not a function`

- [ ] **Step 3: Implement `listMembers` in gchat-client.ts**

Add to `src/gchat/gchat-client.ts` after the `replyMessage` function:

```typescript
export async function listMembers(auth: GChatAuth, spaceId: string): Promise<ApiResult> {
  const apiToken = auth.tokens[spaceId]
  if (!apiToken) {
    return {error: `No API token configured for space: ${spaceId}`, success: false}
  }

  const api = initGChat(auth.key)
  return api.listMembers(spaceId, apiToken)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx mocha test/gchat/gchat-client.test.ts --timeout 60000`
Expected: All PASS

- [ ] **Step 5: Commit**

```bash
git add src/gchat/gchat-client.ts test/gchat/gchat-client.test.ts
git commit -m "feat: add listMembers client wrapper"
```

---

### Task 3: Add the `list-members` command

**Files:**
- Create: `src/commands/gchat/list-members.ts`
- Create: `test/commands/gchat/list-members.test.ts`

- [ ] **Step 1: Write the `list-members` command**

Create `src/commands/gchat/list-members.ts`:

```typescript
import {Args, Command, Flags} from '@oclif/core'

import {readConfig} from '../../config.js'
import {formatAsToon} from '../../format.js'
import {clearClients, listMembers} from '../../gchat/gchat-client.js'

export default class GChatListMembers extends Command {
  static override args = {
    spaceId: Args.string({description: 'Google Chat space ID', required: true}),
  }
  static override description = 'List all members in a Google Chat space'
  static override examples = ['<%= config.bin %> <%= command.id %> AAQAKA6hsFw']
  static override flags = {
    toon: Flags.boolean({description: 'Format output as toon', required: false}),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(GChatListMembers)
    const config = await readConfig(this.config.configDir, this.log.bind(this))
    if (!config) return
    const result = await listMembers(config.auth, args.spaceId)
    clearClients()

    if (flags.toon) {
      this.log(formatAsToon(result))
    } else {
      this.logJson(result)
    }
  }
}
```

- [ ] **Step 2: Write failing tests for the command**

Create `test/commands/gchat/list-members.test.ts`:

```typescript
/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from 'chai'
import esmock from 'esmock'
import {type SinonStub, stub} from 'sinon'

describe('gchat:list-members', () => {
  let GChatListMembers: any
  let readConfigStub: SinonStub
  let listMembersStub: SinonStub
  let clearClientsStub: SinonStub
  let formatAsToonStub: SinonStub

  const mockConfig = {
    auth: {
      key: 'test-api-key',
      tokens: {AAQAKA6hsFw: 'space-token'},
    },
  }

  const mockResult = {
    data: {
      memberships: [
        {name: 'spaces/AAQAKA6hsFw/members/1', member: {name: 'users/1', type: 'HUMAN'}, role: 'ROLE_MEMBER'},
      ],
    },
    success: true,
  }

  beforeEach(async () => {
    readConfigStub = stub().resolves(mockConfig)
    listMembersStub = stub().resolves(mockResult)
    clearClientsStub = stub()
    formatAsToonStub = stub().returns('toon-output')

    const imported = await esmock('../../../src/commands/gchat/list-members.js', {
      '../../../src/config.js': {readConfig: readConfigStub},
      '../../../src/format.js': {formatAsToon: formatAsToonStub},
      '../../../src/gchat/gchat-client.js': {
        clearClients: clearClientsStub,
        listMembers: listMembersStub,
      },
    })
    GChatListMembers = imported.default
  })

  it('calls listMembers with correct args and outputs JSON', async () => {
    const cmd = new GChatListMembers(['AAQAKA6hsFw'], {
      configDir: '/tmp/test-config',
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    const logJsonStub = stub(cmd, 'logJson')

    await cmd.run()

    expect(readConfigStub.calledOnce).to.be.true
    expect(listMembersStub.calledOnce).to.be.true
    expect(listMembersStub.firstCall.args[0]).to.deep.equal(mockConfig.auth)
    expect(listMembersStub.firstCall.args[1]).to.equal('AAQAKA6hsFw')
    expect(clearClientsStub.calledOnce).to.be.true
    expect(logJsonStub.calledOnce).to.be.true
    expect(logJsonStub.firstCall.args[0]).to.deep.equal(mockResult)
  })

  it('returns early when config is missing', async () => {
    readConfigStub.resolves(null)

    const cmd = new GChatListMembers(['AAQAKA6hsFw'], {
      configDir: '/tmp/test-config',
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    const logJsonStub = stub(cmd, 'logJson')

    await cmd.run()

    expect(readConfigStub.calledOnce).to.be.true
    expect(listMembersStub.called).to.be.false
    expect(clearClientsStub.called).to.be.false
    expect(logJsonStub.called).to.be.false
  })

  it('outputs TOON format when --toon flag is used', async () => {
    const cmd = new GChatListMembers(['AAQAKA6hsFw', '--toon'], {
      configDir: '/tmp/test-config',
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    const logStub = stub(cmd, 'log')

    await cmd.run()

    expect(listMembersStub.calledOnce).to.be.true
    expect(clearClientsStub.calledOnce).to.be.true
    expect(formatAsToonStub.calledOnce).to.be.true
    expect(formatAsToonStub.firstCall.args[0]).to.deep.equal(mockResult)
    expect(logStub.calledWith('toon-output')).to.be.true
  })
})
```

- [ ] **Step 3: Run all tests**

Run: `npm test`
Expected: All PASS

- [ ] **Step 4: Commit**

```bash
git add src/commands/gchat/list-members.ts test/commands/gchat/list-members.test.ts
git commit -m "feat: add list-members command"
```
