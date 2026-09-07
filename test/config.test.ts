/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from 'chai'
import esmock from 'esmock'
import {tmpdir} from 'node:os'
import path from 'node:path'
import {type SinonStub, stub} from 'sinon'

describe('config', () => {
  let addUser: any
  let readConfig: any
  let readConfigOrEmpty: any
  let resolveProfile: any
  let resolveTags: any
  let writeConfig: any
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
    addUser = mod.addUser
    readConfig = mod.readConfig
    readConfigOrEmpty = mod.readConfigOrEmpty
    resolveProfile = mod.resolveProfile
    resolveTags = mod.resolveTags
    writeConfig = mod.writeConfig
    DEFAULT_PROFILE = mod.DEFAULT_PROFILE
  })

  describe('readConfig', () => {
    it('parses a profiles-based config', async () => {
      readFileStub.resolves(JSON.stringify({profiles: {work: {key: 'work-key', tokens: {SPACE1: 'tok1'}}}}))

      const result = await readConfig('/tmp/config', logStub)

      expect(result).to.deep.equal({profiles: {work: {key: 'work-key', tokens: {SPACE1: 'tok1'}}}, users: {}})
    })

    it('parses users when present in the config', async () => {
      readFileStub.resolves(JSON.stringify({profiles: {}, users: {'Jane Doe': 'users/123'}}))

      const result = await readConfig('/tmp/config', logStub)

      expect(result).to.deep.equal({profiles: {}, users: {'Jane Doe': 'users/123'}})
    })

    it('migrates a legacy config into the default profile', async () => {
      readFileStub.resolves(JSON.stringify({key: 'my-key', tokens: {SPACE1: 'tok1'}}))

      const result = await readConfig('/tmp/config', logStub)

      expect(result).to.deep.equal({profiles: {default: {key: 'my-key', tokens: {SPACE1: 'tok1'}}}, users: {}})
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

      await readConfig(path.join('my', 'config', 'dir'), logStub)

      const loggedMessages = logStub.args.flat().join(' ')
      expect(loggedMessages).to.include(path.join('my', 'config', 'dir'))
    })
  })

  describe('readConfigOrEmpty', () => {
    it('returns parsed profiles when file exists', async () => {
      readFileStub.resolves(JSON.stringify({profiles: {default: {key: 'my-key', tokens: {SPACE1: 'tok1'}}}}))

      const result = await readConfigOrEmpty('/tmp/config', logStub)

      expect(result).to.deep.equal({profiles: {default: {key: 'my-key', tokens: {SPACE1: 'tok1'}}}, users: {}})
    })

    it('migrates a legacy config into the default profile', async () => {
      readFileStub.resolves(JSON.stringify({key: 'my-key', tokens: {SPACE1: 'tok1'}}))

      const result = await readConfigOrEmpty('/tmp/config', logStub)

      expect(result).to.deep.equal({profiles: {default: {key: 'my-key', tokens: {SPACE1: 'tok1'}}}, users: {}})
    })

    it('returns an empty config when the file does not exist', async () => {
      readFileStub.rejects(Object.assign(new Error('not found'), {code: 'ENOENT'}))

      const result = await readConfigOrEmpty('/tmp/config', logStub)

      expect(result).to.deep.equal({profiles: {}, users: {}})
      expect(logStub.called).to.be.false
    })

    it('returns null and logs when the config is malformed', async () => {
      readFileStub.resolves('{not valid json')

      const result = await readConfigOrEmpty('/tmp/config', logStub)

      expect(result).to.be.null
      const loggedMessages = logStub.args.flat().join(' ')
      expect(loggedMessages).to.include('/tmp/config/gchat-config.json')
    })

    it('returns null and logs when the config cannot be read', async () => {
      readFileStub.rejects(Object.assign(new Error('denied'), {code: 'EACCES'}))

      const result = await readConfigOrEmpty('/tmp/config', logStub)

      expect(result).to.be.null
      expect(logStub.called).to.be.true
    })
  })

  describe('writeConfig', () => {
    it('creates the config directory and writes the file', async () => {
      const config = {profiles: {default: {key: 'my-key', tokens: {SPACE1: 'tok1'}}}, users: {'Jane Doe': 'users/123'}}

      await writeConfig('/tmp/config', config)

      expect(mkdirStub.calledWith('/tmp/config', {recursive: true})).to.be.true
      expect(writeFileStub.calledOnce).to.be.true
    })

    it('writes profiles and users content as JSON to the config path', async () => {
      const config = {profiles: {default: {key: 'my-key', tokens: {SPACE1: 'tok1'}}}, users: {'Jane Doe': 'users/123'}}

      await writeConfig('/tmp/config', config)

      const [filePath, content] = writeFileStub.firstCall.args
      expect(filePath).to.include('gchat-config.json')
      expect(JSON.parse(content)).to.deep.equal({
        profiles: {default: {key: 'my-key', tokens: {SPACE1: 'tok1'}}},
        users: {'Jane Doe': 'users/123'},
      })
    })
  })

  describe('resolveProfile', () => {
    it('returns the auth for an existing profile', () => {
      const auth = {key: 'work-key', tokens: {SPACE1: 'tok1'}}
      const config = {profiles: {work: auth}, users: {}}

      const result = resolveProfile(config, 'work', logStub)

      expect(result).to.equal(auth)
      expect(logStub.called).to.be.false
    })

    it('returns null and logs when the profile is missing', () => {
      const config = {profiles: {default: {key: 'k', tokens: {}}}, users: {}}

      const result = resolveProfile(config, 'missing', logStub)

      expect(result).to.be.null
      const loggedMessages = logStub.args.flat().join(' ')
      expect(loggedMessages).to.include('missing')
    })
  })

  describe('addUser', () => {
    it('adds a user with a normalized user ID', async () => {
      readFileStub.resolves(JSON.stringify({profiles: {default: {key: 'my-key', tokens: {}}}}))

      const result = await addUser('/tmp/config', 'Jane Doe', '123456789012345678901', logStub)

      expect(result.users['Jane Doe']).to.equal('users/123456789012345678901')
      expect(JSON.parse(writeFileStub.firstCall.args[1]).users['Jane Doe']).to.equal('users/123456789012345678901')
    })

    it('keeps a users/ prefixed ID as-is', async () => {
      readFileStub.resolves(JSON.stringify({profiles: {}, users: {existing: 'users/1'}}))

      await addUser('/tmp/config', 'Jane Doe', 'users/123', logStub)

      expect(JSON.parse(writeFileStub.firstCall.args[1]).users['Jane Doe']).to.equal('users/123')
    })

    it('overwrites an existing user with the same name', async () => {
      readFileStub.resolves(JSON.stringify({profiles: {}, users: {'Benson Liang': 'users/2', 'Jane Doe': 'users/old'}}))

      await addUser('/tmp/config', 'Jane Doe', 'users/new', logStub)

      const written = JSON.parse(writeFileStub.firstCall.args[1])
      expect(written.users['Jane Doe']).to.equal('users/new')
      expect(written.users['Benson Liang']).to.equal('users/2')
    })

    it('preserves profiles when writing users', async () => {
      readFileStub.resolves(JSON.stringify({profiles: {default: {key: 'my-key', tokens: {SPACE1: 'tok1'}}}}))

      await addUser('/tmp/config', 'Jane Doe', 'users/123', logStub)

      expect(JSON.parse(writeFileStub.firstCall.args[1]).profiles).to.deep.equal({
        default: {key: 'my-key', tokens: {SPACE1: 'tok1'}},
      })
    })

    it('returns null and does not write when the config is unreadable', async () => {
      readFileStub.resolves('{not valid json')

      const result = await addUser('/tmp/config', 'Jane Doe', 'users/123', logStub)

      expect(result).to.be.null
      expect(writeFileStub.called).to.be.false
      expect(logStub.called).to.be.true
    })

    it('rejects a user ID that is only the users/ prefix', async () => {
      readFileStub.resolves(JSON.stringify({profiles: {}, users: {}}))

      const result = await addUser('/tmp/config', 'Jane Doe', 'users/', logStub)

      expect(result).to.be.null
      expect(writeFileStub.called).to.be.false
      const loggedMessages = logStub.args.flat().join(' ')
      expect(loggedMessages).to.include('Invalid user ID')
    })

    it('rejects a user ID containing whitespace', async () => {
      readFileStub.resolves(JSON.stringify({profiles: {}, users: {}}))

      const result = await addUser('/tmp/config', 'Jane Doe', 'users/foo bar', logStub)

      expect(result).to.be.null
      expect(writeFileStub.called).to.be.false
    })

    it('rejects a bare ID that normalizes to an invalid user ID', async () => {
      readFileStub.resolves(JSON.stringify({profiles: {}, users: {}}))

      const result = await addUser('/tmp/config', 'Jane Doe', 'foo bar', logStub)

      expect(result).to.be.null
      expect(writeFileStub.called).to.be.false
    })
  })

  describe('resolveTags', () => {
    const config = {profiles: {}, users: {'Benson Liang': 'users/456', 'Jane Doe': 'users/123'}}

    it('returns user IDs for names in the users list', () => {
      const result = resolveTags(config, ['Jane Doe', 'Benson Liang'], logStub)

      expect(result).to.deep.equal(['users/123', 'users/456'])
      expect(logStub.called).to.be.false
    })

    it('passes through values already shaped like a user ID', () => {
      const result = resolveTags(config, ['users/999'], logStub)

      expect(result).to.deep.equal(['users/999'])
    })

    it('returns an empty array when no tags are given', () => {
      expect(resolveTags(config, [], logStub)).to.deep.equal([])
    })

    it('returns null and logs when a name is not in the users list', () => {
      const result = resolveTags(config, ['Jane Doe', 'Ghost'], logStub)

      expect(result).to.be.null
      const loggedMessages = logStub.args.flat().join(' ')
      expect(loggedMessages).to.include('Ghost')
      expect(loggedMessages).to.include('add-user')
    })

    it('returns null and logs when a saved user has an invalid ID', () => {
      const broken = {profiles: {}, users: {Broken: 'users/foo bar'}}

      const result = resolveTags(broken, ['Broken'], logStub)

      expect(result).to.be.null
      const loggedMessages = logStub.args.flat().join(' ')
      expect(loggedMessages).to.include('Broken')
      expect(loggedMessages).to.include('invalid')
    })

    it('returns null and logs when a raw tag is not a valid user ID', () => {
      const result = resolveTags(config, ['users/foo bar'], logStub)

      expect(result).to.be.null
      expect(logStub.called).to.be.true
    })
  })

  describe('DEFAULT_PROFILE', () => {
    it('is "default"', () => {
      expect(DEFAULT_PROFILE).to.equal('default')
    })
  })
})
