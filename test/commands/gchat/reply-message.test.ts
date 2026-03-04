/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from 'chai'
import esmock from 'esmock'
import {type SinonStub, stub} from 'sinon'

describe('gchat:reply-message', () => {
  let GChatReplyMessage: any
  let readConfigStub: SinonStub
  let replyMessageStub: SinonStub
  let clearClientsStub: SinonStub
  let formatAsToonStub: SinonStub

  const mockConfig = {
    auth: {
      key: 'test-api-key',
      tokens: {AAQAKA6hsFw: 'space-token'},
    },
  }

  const mockResult = {data: {name: 'spaces/AAQAKA6hsFw/messages/msg2'}, success: true}
  const THREAD_NAME = 'spaces/AAQAKA6hsFw/threads/D1NI3W2B6vA'

  beforeEach(async () => {
    readConfigStub = stub().resolves(mockConfig)
    replyMessageStub = stub().resolves(mockResult)
    clearClientsStub = stub()
    formatAsToonStub = stub().returns('toon-output')

    const imported = await esmock('../../../src/commands/gchat/reply-message.js', {
      '../../../src/config.js': {readConfig: readConfigStub},
      '../../../src/format.js': {formatAsToon: formatAsToonStub},
      '../../../src/gchat/gchat-client.js': {
        clearClients: clearClientsStub,
        replyMessage: replyMessageStub,
      },
    })
    GChatReplyMessage = imported.default
  })

  it('calls replyMessage with correct args and outputs JSON', async () => {
    const cmd = new GChatReplyMessage([THREAD_NAME, 'Reply here'], {
      configDir: '/tmp/test-config',
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    const logJsonStub = stub(cmd, 'logJson')

    await cmd.run()

    expect(readConfigStub.calledOnce).to.be.true
    expect(replyMessageStub.calledOnce).to.be.true
    expect(replyMessageStub.firstCall.args[0]).to.deep.equal(mockConfig.auth)
    expect(replyMessageStub.firstCall.args[1]).to.equal(THREAD_NAME)
    expect(replyMessageStub.firstCall.args[2]).to.equal('Reply here')
    expect(clearClientsStub.calledOnce).to.be.true
    expect(logJsonStub.calledOnce).to.be.true
    expect(logJsonStub.firstCall.args[0]).to.deep.equal(mockResult)
  })

  it('passes formatted flag to replyMessage', async () => {
    const cmd = new GChatReplyMessage([THREAD_NAME, '*Bold*', '--formatted'], {
      configDir: '/tmp/test-config',
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    stub(cmd, 'logJson')

    await cmd.run()

    expect(replyMessageStub.firstCall.args[3]).to.be.true
  })

  it('returns early when config is missing', async () => {
    readConfigStub.resolves(null)

    const cmd = new GChatReplyMessage([THREAD_NAME, 'Reply'], {
      configDir: '/tmp/test-config',
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    const logJsonStub = stub(cmd, 'logJson')

    await cmd.run()

    expect(readConfigStub.calledOnce).to.be.true
    expect(replyMessageStub.called).to.be.false
    expect(clearClientsStub.called).to.be.false
    expect(logJsonStub.called).to.be.false
  })

  it('outputs TOON format when --toon flag is used', async () => {
    const cmd = new GChatReplyMessage([THREAD_NAME, 'Reply', '--toon'], {
      configDir: '/tmp/test-config',
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    const logStub = stub(cmd, 'log')

    await cmd.run()

    expect(replyMessageStub.calledOnce).to.be.true
    expect(clearClientsStub.calledOnce).to.be.true
    expect(formatAsToonStub.calledOnce).to.be.true
    expect(formatAsToonStub.firstCall.args[0]).to.deep.equal(mockResult)
    expect(logStub.calledWith('toon-output')).to.be.true
  })
})
