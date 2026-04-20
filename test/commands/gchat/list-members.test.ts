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
        {member: {name: 'users/1', type: 'HUMAN'}, name: 'spaces/AAQAKA6hsFw/members/1', role: 'ROLE_MEMBER'},
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
