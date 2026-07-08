/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from 'chai'
import esmock from 'esmock'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {type SinonStub, stub} from 'sinon'

describe('config', () => {
  let readConfig: any
  let readConfigOrEmpty: any
  let writeConfig: any
  let resolveProfile: any
  let DEFAULT_PROFILE: any
  let readFileStub: SinonStub
  let writeFileStub: SinonStub
  let mkdirStub: SinonStub
  let logStub: SinonStub

  beforeEach(async () => {
    readFileStub = stub()
    writeFileStub = stub().resolves()
    mkdirStub = stub().resolves()
    logStub = stub()

    const mod = await esmock('../src/config.js', {
      'node:fs/promises': {mkdir: mkdirStub, readFile: readFileStub, writeFile: writeFileStub},
    })
    readConfig = mod.readConfig
    readConfigOrEmpty = mod.readConfigOrEmpty
    writeConfig = mod.writeConfig
    resolveProfile = mod.resolveProfile
    DEFAULT_PROFILE = mod.DEFAULT_PROFILE
  })

  describe('readConfig', () => {
    it('parses a profiles-based config', async () => {
      readFileStub.resolves(JSON.stringify({profiles: {work: {key: 'work-key', tokens: {SPACE1: 'tok1'}}}}))

      const result = await readConfig('/tmp/config', logStub)

      expect(result).to.deep.equal({profiles: {work: {key: 'work-key', tokens: {SPACE1: 'tok1'}}}})
    })

    it('migrates a legacy config into the default profile', async () => {
      readFileStub.resolves(JSON.stringify({key: 'my-key', tokens: {SPACE1: 'tok1'}}))

      const result = await readConfig('/tmp/config', logStub)

      expect(result).to.deep.equal({profiles: {default: {key: 'my-key', tokens: {SPACE1: 'tok1'}}}})
    })

    it('defaults tokens to empty object when missing in a profile', async () => {
      readFileStub.resolves(JSON.stringify({profiles: {default: {key: 'my-key'}}}))

      const result = await readConfig('/tmp/config', logStub)

      expect(result!.profiles.default.tokens).to.deep.equal({})
    })

    it('returns null and logs error when file cannot be read', async () => {
      readFileStub.rejects(new Error('ENOENT'))

      const result = await readConfig(tmpdir(), logStub)

      expect(result).to.be.null
      expect(logStub.called).to.be.true
    })

    it('logs the config path in the error message', async () => {
      readFileStub.rejects(new Error('ENOENT'))

      await readConfig(join('my', 'config', 'dir'), logStub)

      const loggedMessages = logStub.args.flat().join(' ')
      expect(loggedMessages).to.include(join('my', 'config', 'dir'))
    })
  })

  describe('readConfigOrEmpty', () => {
    it('returns parsed profiles when file exists', async () => {
      readFileStub.resolves(JSON.stringify({profiles: {default: {key: 'my-key', tokens: {SPACE1: 'tok1'}}}}))

      const result = await readConfigOrEmpty('/tmp/config')

      expect(result).to.deep.equal({profiles: {default: {key: 'my-key', tokens: {SPACE1: 'tok1'}}}})
    })

    it('migrates a legacy config into the default profile', async () => {
      readFileStub.resolves(JSON.stringify({key: 'my-key', tokens: {SPACE1: 'tok1'}}))

      const result = await readConfigOrEmpty('/tmp/config')

      expect(result).to.deep.equal({profiles: {default: {key: 'my-key', tokens: {SPACE1: 'tok1'}}}})
    })

    it('returns empty profiles when file does not exist', async () => {
      readFileStub.rejects(new Error('ENOENT'))

      const result = await readConfigOrEmpty('/tmp/config')

      expect(result).to.deep.equal({profiles: {}})
    })
  })

  describe('writeConfig', () => {
    it('creates the config directory and writes the file', async () => {
      const config = {profiles: {default: {key: 'my-key', tokens: {SPACE1: 'tok1'}}}}

      await writeConfig('/tmp/config', config)

      expect(mkdirStub.calledWith('/tmp/config', {recursive: true})).to.be.true
      expect(writeFileStub.calledOnce).to.be.true
    })

    it('writes profiles content as JSON to the config path', async () => {
      const config = {profiles: {default: {key: 'my-key', tokens: {SPACE1: 'tok1'}}}}

      await writeConfig('/tmp/config', config)

      const [filePath, content] = writeFileStub.firstCall.args
      expect(filePath).to.include('gchat-config.json')
      expect(JSON.parse(content)).to.deep.equal({profiles: {default: {key: 'my-key', tokens: {SPACE1: 'tok1'}}}})
    })
  })

  describe('resolveProfile', () => {
    it('returns the auth for an existing profile', () => {
      const auth = {key: 'work-key', tokens: {SPACE1: 'tok1'}}
      const config = {profiles: {work: auth}}

      const result = resolveProfile(config, 'work', logStub)

      expect(result).to.equal(auth)
      expect(logStub.called).to.be.false
    })

    it('returns null and logs when the profile is missing', () => {
      const config = {profiles: {default: {key: 'k', tokens: {}}}}

      const result = resolveProfile(config, 'missing', logStub)

      expect(result).to.be.null
      const loggedMessages = logStub.args.flat().join(' ')
      expect(loggedMessages).to.include('missing')
    })
  })

  describe('DEFAULT_PROFILE', () => {
    it('is "default"', () => {
      expect(DEFAULT_PROFILE).to.equal('default')
    })
  })
})
