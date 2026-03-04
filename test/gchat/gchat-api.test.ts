/* eslint-disable n/no-unsupported-features/node-builtins */
import {expect} from 'chai'
import {type SinonStub, stub} from 'sinon'

import {GChatApi} from '../../src/gchat/gchat-api.js'

describe('GChatApi', () => {
  const API_KEY = 'test-api-key'
  const API_TOKEN = 'test-api-token'
  const SPACE_ID = 'AAQAKA6hsFw'
  const THREAD_NAME = 'spaces/AAQAKA6hsFw/threads/D1NI3W2B6vA'

  let api: GChatApi
  let fetchStub: SinonStub

  beforeEach(() => {
    api = new GChatApi(API_KEY)
    fetchStub = stub(globalThis, 'fetch')
  })

  afterEach(() => {
    fetchStub.restore()
  })

  it('creates an instance with apiKey', () => {
    expect(api).to.be.instanceOf(GChatApi)
  })

  describe('newMessage', () => {
    it('POSTs to the correct URL with key and token', async () => {
      fetchStub.resolves(new Response(JSON.stringify({name: 'spaces/X/messages/Y'}), {status: 200}))

      await api.newMessage(SPACE_ID, API_TOKEN, 'Hello')

      const [url, options] = fetchStub.firstCall.args
      expect(url).to.include(`/spaces/${SPACE_ID}/messages`)
      expect(url).to.include(`key=${API_KEY}`)
      expect(url).to.include(`token=${API_TOKEN}`)
      expect(options.method).to.equal('POST')
    })

    it('sends message text in payload', async () => {
      fetchStub.resolves(new Response(JSON.stringify({}), {status: 200}))

      await api.newMessage(SPACE_ID, API_TOKEN, 'Hello team')

      const [, options] = fetchStub.firstCall.args
      const body = JSON.parse(options.body)
      expect(body.text).to.equal('Hello team')
      expect(body.formattedText).to.be.undefined
    })

    it('includes formattedText when formatted=true', async () => {
      fetchStub.resolves(new Response(JSON.stringify({}), {status: 200}))

      await api.newMessage(SPACE_ID, API_TOKEN, '*Bold*', true)

      const [, options] = fetchStub.firstCall.args
      const body = JSON.parse(options.body)
      expect(body.text).to.equal('*Bold*')
      expect(body.formattedText).to.equal('*Bold*')
    })

    it('sets Content-Type header', async () => {
      fetchStub.resolves(new Response(JSON.stringify({}), {status: 200}))

      await api.newMessage(SPACE_ID, API_TOKEN, 'Hello')

      const [, options] = fetchStub.firstCall.args
      expect(options.headers['Content-Type']).to.equal('application/json')
    })

    it('returns success with parsed JSON on 200 response', async () => {
      const responseData = {name: 'spaces/X/messages/Y', text: 'Hello'}
      fetchStub.resolves(new Response(JSON.stringify(responseData), {status: 200}))

      const result = await api.newMessage(SPACE_ID, API_TOKEN, 'Hello')

      expect(result.success).to.be.true
      expect(result.data).to.deep.equal(responseData)
      expect(result.error).to.be.undefined
    })

    it('returns error with parsed JSON on non-OK response', async () => {
      const errorBody = {error: {status: 'PERMISSION_DENIED'}}
      fetchStub.resolves(new Response(JSON.stringify(errorBody), {status: 403}))

      const result = await api.newMessage(SPACE_ID, API_TOKEN, 'Hello')

      expect(result.success).to.be.false
      expect(result.error).to.deep.equal(errorBody)
      expect(result.data).to.be.undefined
    })

    it('returns error with raw text on non-JSON error response', async () => {
      fetchStub.resolves(new Response('Service Unavailable', {status: 503}))

      const result = await api.newMessage(SPACE_ID, API_TOKEN, 'Hello')

      expect(result.success).to.be.false
      expect(result.error).to.equal('Service Unavailable')
    })

    it('returns error on network exception', async () => {
      fetchStub.rejects(new Error('Network timeout'))

      const result = await api.newMessage(SPACE_ID, API_TOKEN, 'Hello')

      expect(result.success).to.be.false
      expect(result.error).to.equal('Network timeout')
    })

    it('returns error on non-Error exception', async () => {
      fetchStub.rejects('string error')

      const result = await api.newMessage(SPACE_ID, API_TOKEN, 'Hello')

      expect(result.success).to.be.false
      expect(result.error).to.be.a('string')
    })
  })

  describe('replyMessage', () => {
    it('POSTs to the correct URL with messageReplyOption', async () => {
      fetchStub.resolves(new Response(JSON.stringify({}), {status: 200}))

      await api.replyMessage(THREAD_NAME, SPACE_ID, API_TOKEN, 'Reply')

      const [url, options] = fetchStub.firstCall.args
      expect(url).to.include(`/spaces/${SPACE_ID}/messages`)
      expect(url).to.include(`key=${API_KEY}`)
      expect(url).to.include(`token=${API_TOKEN}`)
      expect(url).to.include('messageReplyOption=REPLY_MESSAGE_FALLBACK_TO_NEW_THREAD')
      expect(options.method).to.equal('POST')
    })

    it('includes thread name in payload', async () => {
      fetchStub.resolves(new Response(JSON.stringify({}), {status: 200}))

      await api.replyMessage(THREAD_NAME, SPACE_ID, API_TOKEN, 'Reply')

      const [, options] = fetchStub.firstCall.args
      const body = JSON.parse(options.body)
      expect(body.text).to.equal('Reply')
      expect(body.thread).to.deep.equal({name: THREAD_NAME})
      expect(body.formattedText).to.be.undefined
    })

    it('includes formattedText when formatted=true', async () => {
      fetchStub.resolves(new Response(JSON.stringify({}), {status: 200}))

      await api.replyMessage(THREAD_NAME, SPACE_ID, API_TOKEN, '*Bold reply*', true)

      const [, options] = fetchStub.firstCall.args
      const body = JSON.parse(options.body)
      expect(body.formattedText).to.equal('*Bold reply*')
    })

    it('returns success with data on 200 response', async () => {
      const responseData = {name: 'spaces/X/messages/Z', text: 'Reply'}
      fetchStub.resolves(new Response(JSON.stringify(responseData), {status: 200}))

      const result = await api.replyMessage(THREAD_NAME, SPACE_ID, API_TOKEN, 'Reply')

      expect(result.success).to.be.true
      expect(result.data).to.deep.equal(responseData)
    })

    it('returns error on non-OK response', async () => {
      fetchStub.resolves(new Response(JSON.stringify({error: 'Not found'}), {status: 404}))

      const result = await api.replyMessage(THREAD_NAME, SPACE_ID, API_TOKEN, 'Reply')

      expect(result.success).to.be.false
    })
  })
})
