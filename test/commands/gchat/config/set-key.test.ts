/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from 'chai'
import esmock from 'esmock'
import {type SinonStub, stub} from 'sinon'

describe('gchat:config:set-key', () => {
  let ConfigSetKey: any
  let readConfigOrEmptyStub: SinonStub
  let writeConfigStub: SinonStub

  const mockConfig = {auth: {key: 'old-key', tokens: {SPACE1: 'tok1'}}}

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

  it('reads existing config and writes updated key', async () => {
    const cmd = new ConfigSetKey(['new-api-key'], {
      configDir: '/tmp/test-config',
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    const logStub = stub(cmd, 'log')

    await cmd.run()

    expect(readConfigOrEmptyStub.calledWith('/tmp/test-config')).to.be.true
    expect(writeConfigStub.calledOnce).to.be.true
    const writtenConfig = writeConfigStub.firstCall.args[1]
    expect(writtenConfig.auth.key).to.equal('new-api-key')
    expect(writtenConfig.auth.tokens).to.deep.equal({SPACE1: 'tok1'})
    expect(logStub.calledWith('API key updated successfully.')).to.be.true
  })

  it('preserves existing tokens when updating the key', async () => {
    readConfigOrEmptyStub.resolves({auth: {key: '', tokens: {A: 'tok-a', B: 'tok-b'}}})

    const cmd = new ConfigSetKey(['my-key'], {
      configDir: '/tmp/test-config',
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    stub(cmd, 'log')

    await cmd.run()

    const writtenConfig = writeConfigStub.firstCall.args[1]
    expect(writtenConfig.auth.tokens).to.deep.equal({A: 'tok-a', B: 'tok-b'})
  })

  it('works when no config exists yet (empty config)', async () => {
    readConfigOrEmptyStub.resolves({auth: {key: '', tokens: {}}})

    const cmd = new ConfigSetKey(['brand-new-key'], {
      configDir: '/tmp/test-config',
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    stub(cmd, 'log')

    await cmd.run()

    const writtenConfig = writeConfigStub.firstCall.args[1]
    expect(writtenConfig.auth.key).to.equal('brand-new-key')
  })
})
