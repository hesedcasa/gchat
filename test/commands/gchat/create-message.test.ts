/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from 'chai'
import esmock from 'esmock'
import {type SinonStub, stub} from 'sinon'

describe('gchat:create-message', () => {
  let GChatCreateMessage: any
  let readConfigStub: SinonStub
  let newMessageStub: SinonStub
  let clearClientsStub: SinonStub
  let formatAsToonStub: SinonStub

  const mockConfig = {
    auth: {
      key: 'test-api-key',
      tokens: {AAQAKA6hsFw: 'space-token'},
    },
  }

  const mockResult = {data: {name: 'spaces/AAQAKA6hsFw/messages/msg1'}, success: true}

  beforeEach(async () => {
    readConfigStub = stub().resolves(mockConfig)
    newMessageStub = stub().resolves(mockResult)
    clearClientsStub = stub()
    formatAsToonStub = stub().returns('toon-output')

    const imported = await esmock('../../../src/commands/gchat/create-message.js', {
      '../../../src/config.js': {readConfig: readConfigStub},
      '../../../src/format.js': {formatAsToon: formatAsToonStub},
      '../../../src/gchat/gchat-client.js': {
        clearClients: clearClientsStub,
        newMessage: newMessageStub,
      },
    })
    GChatCreateMessage = imported.default
  })

  it('calls newMessage with correct args and outputs JSON', async () => {
    const cmd = new GChatCreateMessage(['AAQAKA6hsFw', 'Hello team'], {
      configDir: '/tmp/test-config',
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    const logJsonStub = stub(cmd, 'logJson')

    await cmd.run()

    expect(readConfigStub.calledOnce).to.be.true
    expect(newMessageStub.calledOnce).to.be.true
    expect(newMessageStub.firstCall.args[0]).to.deep.equal(mockConfig.auth)
    expect(newMessageStub.firstCall.args[1]).to.equal('AAQAKA6hsFw')
    expect(newMessageStub.firstCall.args[2]).to.equal('Hello team')
    expect(clearClientsStub.calledOnce).to.be.true
    expect(logJsonStub.calledOnce).to.be.true
    expect(logJsonStub.firstCall.args[0]).to.deep.equal(mockResult)
  })

  it('passes formatted flag to newMessage', async () => {
    const cmd = new GChatCreateMessage(['AAQAKA6hsFw', '*Bold*', '--formatted'], {
      configDir: '/tmp/test-config',
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    stub(cmd, 'logJson')

    await cmd.run()

    expect(newMessageStub.firstCall.args[3]).to.be.true
  })

  it('returns early when config is missing', async () => {
    readConfigStub.resolves(null)

    const cmd = new GChatCreateMessage(['AAQAKA6hsFw', 'Hello'], {
      configDir: '/tmp/test-config',
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    const logJsonStub = stub(cmd, 'logJson')

    await cmd.run()

    expect(readConfigStub.calledOnce).to.be.true
    expect(newMessageStub.called).to.be.false
    expect(clearClientsStub.called).to.be.false
    expect(logJsonStub.called).to.be.false
  })

  it('outputs TOON format when --toon flag is used', async () => {
    const cmd = new GChatCreateMessage(['AAQAKA6hsFw', 'Hello', '--toon'], {
      configDir: '/tmp/test-config',
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    const logStub = stub(cmd, 'log')

    await cmd.run()

    expect(newMessageStub.calledOnce).to.be.true
    expect(clearClientsStub.calledOnce).to.be.true
    expect(formatAsToonStub.calledOnce).to.be.true
    expect(formatAsToonStub.firstCall.args[0]).to.deep.equal(mockResult)
    expect(logStub.calledWith('toon-output')).to.be.true
  })
})
