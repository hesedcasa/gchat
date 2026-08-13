export type ApiResult = {
  data?: unknown
  error?: unknown
  success: boolean
}

const BASE_URL = 'https://chat.googleapis.com/v1'

export class GChatApi {
  private readonly apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async newMessage(spaceId: string, apiToken: string, message: string, formatted = false): Promise<ApiResult> {
    const url = `${BASE_URL}/spaces/${spaceId}/messages?key=${this.apiKey}&token=${apiToken}`
    const payload: Record<string, unknown> = {text: message}
    if (formatted) payload.formattedText = message
    return this.post(url, payload)
  }

  // eslint-disable-next-line max-params -- mirrors the Google Chat reply payload fields
  async replyMessage(
    threadName: string,
    spaceId: string,
    apiToken: string,
    message: string,
    formatted = false,
  ): Promise<ApiResult> {
    const url = `${BASE_URL}/spaces/${spaceId}/messages?key=${this.apiKey}&token=${apiToken}&messageReplyOption=REPLY_MESSAGE_FALLBACK_TO_NEW_THREAD`
    const payload: Record<string, unknown> = {text: message, thread: {name: threadName}}
    if (formatted) payload.formattedText = message
    return this.post(url, payload)
  }

  private async post(url: string, payload: Record<string, unknown>): Promise<ApiResult> {
    try {
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
