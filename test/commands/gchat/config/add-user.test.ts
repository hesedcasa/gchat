/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from 'chai'
import esmock from 'esmock'
import {type SinonStub, stub} from 'sinon'

describe('gchat:config:add-user', () => {
  let ConfigAddUser: any
  let addUserStub: SinonStub

  beforeEach(async () => {
    addUserStub = stub().resolves({profiles: {}, users: {'Jane Doe': 'users/123'}})

    const imported = await esmock('../../../../src/commands/gchat/config/add-user.js', {
      '../../../../src/config.js': {addUser: addUserStub},
    })
    ConfigAddUser = imported.default
  })

  it('calls addUser with the config dir, name, and user ID', async () => {
    const cmd = new ConfigAddUser(['Jane Doe', 'users/123'], {
      configDir: '/tmp/test-config',
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    const logStub = stub(cmd, 'log')

    await cmd.run()

    expect(addUserStub.calledWith('/tmp/test-config', 'Jane Doe', 'users/123')).to.be.true
    expect(logStub.calledWith("User 'Jane Doe' saved as users/123 in the users list.")).to.be.true
  })

  it('logs the normalized ID returned from addUser', async () => {
    addUserStub.resolves({profiles: {}, users: {'Jane Doe': 'users/123456789012345678901'}})

    const cmd = new ConfigAddUser(['Jane Doe', '123456789012345678901'], {
      configDir: '/tmp/test-config',
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    const logStub = stub(cmd, 'log')

    await cmd.run()

    expect(addUserStub.calledWith('/tmp/test-config', 'Jane Doe', '123456789012345678901')).to.be.true
    expect(logStub.calledWith("User 'Jane Doe' saved as users/123456789012345678901 in the users list.")).to.be.true
  })

  it('passes its logger to addUser and stays silent when addUser fails', async () => {
    addUserStub.resolves(null)

    const cmd = new ConfigAddUser(['Jane Doe', 'users/foo bar'], {
      configDir: '/tmp/test-config',
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    const logStub = stub(cmd, 'log')

    await cmd.run()

    expect(typeof addUserStub.firstCall.args[3]).to.equal('function')
    expect(logStub.called).to.be.false
  })
})
