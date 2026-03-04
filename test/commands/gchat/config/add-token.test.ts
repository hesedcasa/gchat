/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from 'chai'
import esmock from 'esmock'
import {type SinonStub, stub} from 'sinon'

describe('gchat:config:add-token', () => {
  let ConfigAddToken: any
  let readConfigOrEmptyStub: SinonStub
  let writeConfigStub: SinonStub

  const mockConfig = {auth: {key: 'my-api-key', tokens: {}}}

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

  it('reads existing config and writes token for given space', async () => {
    const cmd = new ConfigAddToken(['AAQAKA6hsFw', 'my-space-token'], {
      configDir: '/tmp/test-config',
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    const logStub = stub(cmd, 'log')

    await cmd.run()

    expect(readConfigOrEmptyStub.calledWith('/tmp/test-config')).to.be.true
    expect(writeConfigStub.calledOnce).to.be.true
    const writtenConfig = writeConfigStub.firstCall.args[1]
    expect(writtenConfig.auth.tokens.AAQAKA6hsFw).to.equal('my-space-token')
    expect(logStub.calledWith('Token for space AAQAKA6hsFw updated successfully.')).to.be.true
  })

  it('preserves existing tokens when adding a new one', async () => {
    readConfigOrEmptyStub.resolves({auth: {key: 'key', tokens: {EXISTING: 'existing-tok'}}})

    const cmd = new ConfigAddToken(['NEW_SPACE', 'new-tok'], {
      configDir: '/tmp/test-config',
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    stub(cmd, 'log')

    await cmd.run()

    const writtenConfig = writeConfigStub.firstCall.args[1]
    expect(writtenConfig.auth.tokens.EXISTING).to.equal('existing-tok')
    expect(writtenConfig.auth.tokens.NEW_SPACE).to.equal('new-tok')
  })

  it('overwrites an existing token for the same space', async () => {
    readConfigOrEmptyStub.resolves({auth: {key: 'key', tokens: {SPACE1: 'old-token'}}})

    const cmd = new ConfigAddToken(['SPACE1', 'updated-token'], {
      configDir: '/tmp/test-config',
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    stub(cmd, 'log')

    await cmd.run()

    const writtenConfig = writeConfigStub.firstCall.args[1]
    expect(writtenConfig.auth.tokens.SPACE1).to.equal('updated-token')
  })

  it('preserves the API key when adding a token', async () => {
    readConfigOrEmptyStub.resolves({auth: {key: 'preserved-key', tokens: {}}})

    const cmd = new ConfigAddToken(['SPACE1', 'tok'], {
      configDir: '/tmp/test-config',
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    stub(cmd, 'log')

    await cmd.run()

    const writtenConfig = writeConfigStub.firstCall.args[1]
    expect(writtenConfig.auth.key).to.equal('preserved-key')
  })
})
