/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from 'chai'
import esmock from 'esmock'
import {type SinonStub, stub} from 'sinon'

describe('gchat:config:add-token', () => {
  let ConfigAddToken: any
  let readConfigOrEmptyStub: SinonStub
  let writeConfigStub: SinonStub

  const mockConfig = {profiles: {default: {key: 'my-api-key', tokens: {}}}}

  beforeEach(async () => {
    readConfigOrEmptyStub = stub().resolves(mockConfig)
    writeConfigStub = stub().resolves()

    const imported = await esmock('../../../../src/commands/gchat/config/add-token.js', {
      '../../../../src/config.js': {
        readConfigOrEmpty: readConfigOrEmptyStub,
        writeConfig: writeConfigStub,
      },
    })
    ConfigAddToken = imported.default
  })

  it('reads existing config and writes token for the given profile and space', async () => {
    readConfigOrEmptyStub.resolves({profiles: {default: {key: 'my-api-key', tokens: {}}}})

    const cmd = new ConfigAddToken(['default', 'AAQAKA6hsFw', 'my-space-token'], {
      configDir: '/tmp/test-config',
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    const logStub = stub(cmd, 'log')

    await cmd.run()

    expect(readConfigOrEmptyStub.calledWith('/tmp/test-config')).to.be.true
    expect(writeConfigStub.calledOnce).to.be.true
    const writtenConfig = writeConfigStub.firstCall.args[1]
    expect(writtenConfig.profiles.default.tokens.AAQAKA6hsFw).to.equal('my-space-token')
    expect(logStub.calledWith("Token for space AAQAKA6hsFw in profile 'default' updated successfully.")).to.be.true
  })

  it('preserves existing tokens when adding a new one', async () => {
    readConfigOrEmptyStub.resolves({profiles: {default: {key: 'key', tokens: {EXISTING: 'existing-tok'}}}})

    const cmd = new ConfigAddToken(['default', 'NEW_SPACE', 'new-tok'], {
      configDir: '/tmp/test-config',
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    stub(cmd, 'log')

    await cmd.run()

    const writtenConfig = writeConfigStub.firstCall.args[1]
    expect(writtenConfig.profiles.default.tokens.EXISTING).to.equal('existing-tok')
    expect(writtenConfig.profiles.default.tokens.NEW_SPACE).to.equal('new-tok')
  })

  it('overwrites an existing token for the same space', async () => {
    readConfigOrEmptyStub.resolves({profiles: {default: {key: 'key', tokens: {SPACE1: 'old-token'}}}})

    const cmd = new ConfigAddToken(['default', 'SPACE1', 'updated-token'], {
      configDir: '/tmp/test-config',
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    stub(cmd, 'log')

    await cmd.run()

    const writtenConfig = writeConfigStub.firstCall.args[1]
    expect(writtenConfig.profiles.default.tokens.SPACE1).to.equal('updated-token')
  })

  it('adds a token to a non-default profile, creating it if needed', async () => {
    readConfigOrEmptyStub.resolves({profiles: {default: {key: 'default-key', tokens: {}}}})

    const cmd = new ConfigAddToken(['work', 'SPACE1', 'work-tok'], {
      configDir: '/tmp/test-config',
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    stub(cmd, 'log')

    await cmd.run()

    const writtenConfig = writeConfigStub.firstCall.args[1]
    expect(writtenConfig.profiles.work).to.deep.equal({key: '', tokens: {SPACE1: 'work-tok'}})
    expect(writtenConfig.profiles.default.key).to.equal('default-key')
  })

  it('preserves the API key when adding a token', async () => {
    readConfigOrEmptyStub.resolves({profiles: {default: {key: 'preserved-key', tokens: {}}}})

    const cmd = new ConfigAddToken(['default', 'SPACE1', 'tok'], {
      configDir: '/tmp/test-config',
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    stub(cmd, 'log')

    await cmd.run()

    const writtenConfig = writeConfigStub.firstCall.args[1]
    expect(writtenConfig.profiles.default.key).to.equal('preserved-key')
  })

  it('does not overwrite an unreadable config', async () => {
    readConfigOrEmptyStub.resolves(null)

    const cmd = new ConfigAddToken(['default', 'SPACE1', 'tok'], {
      configDir: '/tmp/test-config',
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    const logStub = stub(cmd, 'log')

    await cmd.run()

    expect(typeof readConfigOrEmptyStub.firstCall.args[1]).to.equal('function')
    expect(writeConfigStub.called).to.be.false
    expect(logStub.called).to.be.false
  })
})
