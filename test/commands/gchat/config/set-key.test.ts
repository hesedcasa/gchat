/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from 'chai'
import esmock from 'esmock'
import {type SinonStub, stub} from 'sinon'

describe('gchat:config:set-key', () => {
  let ConfigSetKey: any
  let readConfigOrEmptyStub: SinonStub
  let writeConfigStub: SinonStub

  const mockConfig = {profiles: {default: {key: 'old-key', tokens: {SPACE1: 'tok1'}}}}

  beforeEach(async () => {
    readConfigOrEmptyStub = stub().resolves(mockConfig)
    writeConfigStub = stub().resolves()

    const imported = await esmock('../../../../src/commands/gchat/config/set-key.js', {
      '../../../../src/config.js': {
        readConfigOrEmpty: readConfigOrEmptyStub,
        writeConfig: writeConfigStub,
      },
    })
    ConfigSetKey = imported.default
  })

  it('reads existing config and writes updated key for the profile', async () => {
    readConfigOrEmptyStub.resolves({profiles: {default: {key: 'old-key', tokens: {SPACE1: 'tok1'}}}})

    const cmd = new ConfigSetKey(['default', 'new-api-key'], {
      configDir: '/tmp/test-config',
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    const logStub = stub(cmd, 'log')

    await cmd.run()

    expect(readConfigOrEmptyStub.calledWith('/tmp/test-config')).to.be.true
    expect(writeConfigStub.calledOnce).to.be.true
    const writtenConfig = writeConfigStub.firstCall.args[1]
    expect(writtenConfig.profiles.default.key).to.equal('new-api-key')
    expect(writtenConfig.profiles.default.tokens).to.deep.equal({SPACE1: 'tok1'})
    expect(logStub.calledWith("API key for profile 'default' updated successfully.")).to.be.true
  })

  it('preserves existing tokens when updating the key', async () => {
    readConfigOrEmptyStub.resolves({profiles: {default: {key: '', tokens: {A: 'tok-a', B: 'tok-b'}}}})

    const cmd = new ConfigSetKey(['default', 'my-key'], {
      configDir: '/tmp/test-config',
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    stub(cmd, 'log')

    await cmd.run()

    const writtenConfig = writeConfigStub.firstCall.args[1]
    expect(writtenConfig.profiles.default.tokens).to.deep.equal({A: 'tok-a', B: 'tok-b'})
  })

  it('creates a new profile when it does not exist yet', async () => {
    readConfigOrEmptyStub.resolves({profiles: {default: {key: 'default-key', tokens: {}}}})

    const cmd = new ConfigSetKey(['work', 'work-key'], {
      configDir: '/tmp/test-config',
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    stub(cmd, 'log')

    await cmd.run()

    const writtenConfig = writeConfigStub.firstCall.args[1]
    expect(writtenConfig.profiles.work).to.deep.equal({key: 'work-key', tokens: {}})
    expect(writtenConfig.profiles.default.key).to.equal('default-key')
  })

  it('works when no config exists yet (empty config)', async () => {
    readConfigOrEmptyStub.resolves({profiles: {}})

    const cmd = new ConfigSetKey(['default', 'brand-new-key'], {
      configDir: '/tmp/test-config',
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    stub(cmd, 'log')

    await cmd.run()

    const writtenConfig = writeConfigStub.firstCall.args[1]
    expect(writtenConfig.profiles.default.key).to.equal('brand-new-key')
  })
})
