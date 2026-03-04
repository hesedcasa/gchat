/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from 'chai'
import esmock from 'esmock'
import {type SinonStub, stub} from 'sinon'

describe('config', () => {
  let readConfig: any
  let readConfigOrEmpty: any
  let writeConfig: any
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
  })

  describe('readConfig', () => {
    it('returns GChatConfig with auth on success', async () => {
      readFileStub.resolves(JSON.stringify({key: 'my-key', tokens: {SPACE1: 'tok1'}}))

      const result = await readConfig('/tmp/config', logStub)

      expect(result).to.deep.equal({auth: {key: 'my-key', tokens: {SPACE1: 'tok1'}}})
    })

    it('defaults tokens to empty object when missing', async () => {
      readFileStub.resolves(JSON.stringify({key: 'my-key'}))

      const result = await readConfig('/tmp/config', logStub)

      expect(result).to.not.be.null
      expect(result!.auth.tokens).to.deep.equal({})
    })

    it('returns null and logs error when file cannot be read', async () => {
      readFileStub.rejects(new Error('ENOENT'))

      const result = await readConfig('/tmp/config', logStub)

      expect(result).to.be.null
      expect(logStub.called).to.be.true
    })

    it('logs the config path in the error message', async () => {
      readFileStub.rejects(new Error('ENOENT'))

      await readConfig('/my/config/dir', logStub)

      const loggedMessages = logStub.args.flat().join(' ')
      expect(loggedMessages).to.include('/my/config/dir')
    })
  })

  describe('readConfigOrEmpty', () => {
    it('returns parsed config when file exists', async () => {
      readFileStub.resolves(JSON.stringify({key: 'my-key', tokens: {SPACE1: 'tok1'}}))

      const result = await readConfigOrEmpty('/tmp/config')

      expect(result).to.deep.equal({auth: {key: 'my-key', tokens: {SPACE1: 'tok1'}}})
    })

    it('defaults key to empty string when missing', async () => {
      readFileStub.resolves(JSON.stringify({tokens: {}}))

      const result = await readConfigOrEmpty('/tmp/config')

      expect(result.auth.key).to.equal('')
    })

    it('returns empty config when file does not exist', async () => {
      readFileStub.rejects(new Error('ENOENT'))

      const result = await readConfigOrEmpty('/tmp/config')

      expect(result).to.deep.equal({auth: {key: '', tokens: {}}})
    })
  })

  describe('writeConfig', () => {
    it('creates the config directory and writes the file', async () => {
      const config = {auth: {key: 'my-key', tokens: {SPACE1: 'tok1'}}}

      await writeConfig('/tmp/config', config)

      expect(mkdirStub.calledWith('/tmp/config', {recursive: true})).to.be.true
      expect(writeFileStub.calledOnce).to.be.true
    })

    it('writes auth content as JSON to the config path', async () => {
      const config = {auth: {key: 'my-key', tokens: {SPACE1: 'tok1'}}}

      await writeConfig('/tmp/config', config)

      const [filePath, content] = writeFileStub.firstCall.args
      expect(filePath).to.include('gchat-config.json')
      expect(JSON.parse(content)).to.deep.equal({key: 'my-key', tokens: {SPACE1: 'tok1'}})
    })
  })
})
