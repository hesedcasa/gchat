export interface ApiResult {
  data?: unknown
  error?: unknown
  success: boolean
}

export class GChatApi {
  private static readonly BASE_URL = 'https://chat.googleapis.com/v1'
  private readonly apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async newMessage(spaceId: string, apiToken: string, message: string, formatted = false): Promise<ApiResult> {
    const url = `${GChatApi.BASE_URL}/spaces/${spaceId}/messages?key=${this.apiKey}&token=${apiToken}`
    const payload: Record<string, unknown> = {text: message}
    if (formatted) payload.formattedText = message
    return this.post(url, payload)
  }

  // eslint-disable-next-line max-params
  async replyMessage(
    threadName: string,
    spaceId: string,
    apiToken: string,
    message: string,
    formatted = false,
  ): Promise<ApiResult> {
    const url = `${GChatApi.BASE_URL}/spaces/${spaceId}/messages?key=${this.apiKey}&token=${apiToken}&messageReplyOption=REPLY_MESSAGE_FALLBACK_TO_NEW_THREAD`
    const payload: Record<string, unknown> = {text: message, thread: {name: threadName}}
    if (formatted) payload.formattedText = message
    return this.post(url, payload)
  }

  private async post(url: string, payload: Record<string, unknown>): Promise<ApiResult> {
    try {
      // eslint-disable-next-line n/no-unsupported-features/node-builtins -- fetch is available in Node 18+
      const response = await fetch(url, {
        body: JSON.stringify(payload),
        headers: {'Content-Type': 'application/json'},
        method: 'POST',
      })

      if (!response.ok) {
        const errorText = await response.text()
        let errorData: unknown
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = errorText
        }

        return {error: errorData, success: false}
      }

      const data: unknown = await response.json()
      return {data, success: true}
    } catch (error: unknown) {
      return {
        error: error instanceof Error ? error.message : String(error),
        success: false,
      }
    }
  }
}
