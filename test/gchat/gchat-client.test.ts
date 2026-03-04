/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from 'chai'
import esmock from 'esmock'
import {type SinonStub, stub} from 'sinon'

describe('gchat-client', () => {
  const mockAuth = {
    key: 'test-api-key',
    tokens: {
      AAQAKA6hsFw: 'token-for-space',
    },
  }
  const mockResult = {data: {name: 'spaces/X/messages/Y'}, success: true}
  const SPACE_ID = 'AAQAKA6hsFw'
  const THREAD_NAME = 'spaces/AAQAKA6hsFw/threads/D1NI3W2B6vA'

  let clearClients: any
  let newMessageFn: any
  let replyMessageFn: any
  let mockApiInstance: Record<string, SinonStub>
  let GChatApiStub: SinonStub

  beforeEach(async () => {
    mockApiInstance = {
      newMessage: stub().resolves(mockResult),
      replyMessage: stub().resolves(mockResult),
    }
    GChatApiStub = stub().returns(mockApiInstance)

    const mod = await esmock('../../src/gchat/gchat-client.js', {
      '../../src/gchat/gchat-api.js': {GChatApi: GChatApiStub},
    })

    clearClients = mod.clearClients
    newMessageFn = mod.newMessage
    replyMessageFn = mod.replyMessage
  })

  afterEach(() => {
    clearClients()
  })

  it('clearClients does not throw', () => {
    expect(() => clearClients()).to.not.throw()
  })

  describe('singleton pattern', () => {
    it('reuses the same GChatApi instance on subsequent calls', async () => {
      await newMessageFn(mockAuth, SPACE_ID, 'Hello')
      await newMessageFn(mockAuth, SPACE_ID, 'World')

      expect(GChatApiStub.calledOnce).to.be.true
    })

    it('creates a new instance after clearClients', async () => {
      await newMessageFn(mockAuth, SPACE_ID, 'Hello')
      clearClients()
      await newMessageFn(mockAuth, SPACE_ID, 'World')

      expect(GChatApiStub.calledTwice).to.be.true
    })

    it('initializes GChatApi with the API key', async () => {
      await newMessageFn(mockAuth, SPACE_ID, 'Hello')

      expect(GChatApiStub.calledWith('test-api-key')).to.be.true
    })
  })

  describe('newMessage', () => {
    it('delegates to GChatApi.newMessage with correct args', async () => {
      const result = await newMessageFn(mockAuth, SPACE_ID, 'Hello')

      expect(mockApiInstance.newMessage.calledOnce).to.be.true
      expect(mockApiInstance.newMessage.firstCall.args[0]).to.equal(SPACE_ID)
      expect(mockApiInstance.newMessage.firstCall.args[1]).to.equal('token-for-space')
      expect(mockApiInstance.newMessage.firstCall.args[2]).to.equal('Hello')
      expect(result).to.deep.equal(mockResult)
    })

    it('passes formatted flag to GChatApi.newMessage', async () => {
      await newMessageFn(mockAuth, SPACE_ID, 'Hello', true)

      expect(mockApiInstance.newMessage.firstCall.args[3]).to.be.true
    })

    it('returns error when space has no token configured', async () => {
      const result = await newMessageFn(mockAuth, 'UNKNOWN_SPACE', 'Hello')

      expect(result.success).to.be.false
      expect(result.error).to.include('UNKNOWN_SPACE')
      expect(mockApiInstance.newMessage.called).to.be.false
    })
  })

  describe('replyMessage', () => {
    it('delegates to GChatApi.replyMessage with extracted spaceId', async () => {
      const result = await replyMessageFn(mockAuth, THREAD_NAME, 'Reply')

      expect(mockApiInstance.replyMessage.calledOnce).to.be.true
      expect(mockApiInstance.replyMessage.firstCall.args[0]).to.equal(THREAD_NAME)
      expect(mockApiInstance.replyMessage.firstCall.args[1]).to.equal(SPACE_ID)
      expect(mockApiInstance.replyMessage.firstCall.args[2]).to.equal('token-for-space')
      expect(mockApiInstance.replyMessage.firstCall.args[3]).to.equal('Reply')
      expect(result).to.deep.equal(mockResult)
    })

    it('passes formatted flag to GChatApi.replyMessage', async () => {
      await replyMessageFn(mockAuth, THREAD_NAME, 'Reply', true)

      expect(mockApiInstance.replyMessage.firstCall.args[4]).to.be.true
    })

    it('returns error for invalid thread name format', async () => {
      const result = await replyMessageFn(mockAuth, 'invalid-thread', 'Reply')

      expect(result.success).to.be.false
      expect(result.error).to.include('invalid-thread')
      expect(mockApiInstance.replyMessage.called).to.be.false
    })

    it('returns error when extracted space has no token', async () => {
      const result = await replyMessageFn(mockAuth, 'spaces/UNKNOWN/threads/T123', 'Reply')

      expect(result.success).to.be.false
      expect(result.error).to.include('UNKNOWN')
      expect(mockApiInstance.replyMessage.called).to.be.false
    })
  })
})
