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

  const mockAuth = {
    key: 'test-api-key',
    tokens: {AAQAKA6hsFw: 'space-token'},
  }
  const mockConfig = {
    profiles: {
      default: mockAuth,
      work: {key: 'work-key', tokens: {AAQAKA6hsFw: 'work-token'}},
    },
    users: {'Benson Liang': 'users/456', 'Jane Doe': 'users/123'},
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
    expect(newMessageStub.firstCall.args[0]).to.deep.equal(mockAuth)
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

  it('uses the auth of the profile named by --profile', async () => {
    const cmd = new GChatCreateMessage(['AAQAKA6hsFw', 'Hello', '--profile', 'work'], {
      configDir: '/tmp/test-config',
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    stub(cmd, 'logJson')

    await cmd.run()

    expect(newMessageStub.calledOnce).to.be.true
    expect(newMessageStub.firstCall.args[0]).to.deep.equal(mockConfig.profiles.work)
  })

  it('returns early when the requested profile is not found', async () => {
    const cmd = new GChatCreateMessage(['AAQAKA6hsFw', 'Hello', '--profile', 'ghost'], {
      configDir: '/tmp/test-config',
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    const logStub = stub(cmd, 'log')
    const logJsonStub = stub(cmd, 'logJson')

    await cmd.run()

    expect(newMessageStub.called).to.be.false
    expect(clearClientsStub.called).to.be.false
    expect(logJsonStub.called).to.be.false
    expect(logStub.args.flat().join(' ')).to.include('ghost')
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

  it('appends a mention for a user tagged with --tag', async () => {
    const cmd = new GChatCreateMessage(['AAQAKA6hsFw', 'Hello team', '--tag', 'Jane Doe'], {
      configDir: '/tmp/test-config',
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    stub(cmd, 'logJson')

    await cmd.run()

    expect(newMessageStub.firstCall.args[2]).to.equal('Hello team\n<users/123>')
  })

  it('appends multiple tags in order, including ad-hoc users/ IDs', async () => {
    const cmd = new GChatCreateMessage(['AAQAKA6hsFw', 'Hello', '--tag', 'Jane Doe', '--tag', 'users/999'], {
      configDir: '/tmp/test-config',
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    stub(cmd, 'logJson')

    await cmd.run()

    expect(newMessageStub.firstCall.args[2]).to.equal('Hello\n<users/123>\n<users/999>')
  })

  it('does not send when a tagged user is not in the users list', async () => {
    const cmd = new GChatCreateMessage(['AAQAKA6hsFw', 'Hello', '--tag', 'Ghost'], {
      configDir: '/tmp/test-config',
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    const logStub = stub(cmd, 'log')
    const logJsonStub = stub(cmd, 'logJson')

    await cmd.run()

    expect(newMessageStub.called).to.be.false
    expect(clearClientsStub.called).to.be.false
    expect(logJsonStub.called).to.be.false
    const loggedMessages = logStub.args.flat().join(' ')
    expect(loggedMessages).to.include('Ghost')
    expect(loggedMessages).to.include('add-user')
  })
})
