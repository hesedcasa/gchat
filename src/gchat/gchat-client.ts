import {type GChatAuth} from '../config.js'
import {type ApiResult, GChatApi} from './gchat-api.js'

let gChatApi: GChatApi | null = null

function initGChat(key: string): GChatApi {
  if (!gChatApi) {
    gChatApi = new GChatApi(key)
  }

  return gChatApi
}

export function clearClients(): void {
  gChatApi = null
}

export async function newMessage(
  auth: GChatAuth,
  spaceId: string,
  message: string,
  formatted = false,
): Promise<ApiResult> {
  const apiToken = auth.tokens[spaceId]
  if (!apiToken) {
    return {error: `No API token configured for space: ${spaceId}`, success: false}
  }

  const api = initGChat(auth.key)
  return api.newMessage(spaceId, apiToken, message, formatted)
}

export async function replyMessage(
  auth: GChatAuth,
  threadName: string,
  message: string,
  formatted = false,
): Promise<ApiResult> {
  const parts = threadName.trim().split('/')
  const spaceId = parts[0] === 'spaces' && parts.length >= 2 ? parts[1] : ''
  if (!spaceId) {
    return {error: `Invalid thread name format: ${threadName}`, success: false}
  }

  const apiToken = auth.tokens[spaceId]
  if (!apiToken) {
    return {error: `No API token configured for space: ${spaceId}`, success: false}
  }

  const api = initGChat(auth.key)
  return api.replyMessage(threadName, spaceId, apiToken, message, formatted)
}
