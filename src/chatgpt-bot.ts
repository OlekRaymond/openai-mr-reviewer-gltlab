import {info, setFailed, warning} from './gitlab-core'
import {
  ChatGPTAPI,
  ChatGPTError,
  ChatMessage,
  SendMessageOptions
  // eslint-disable-next-line import/no-unresolved
} from 'chatgpt'

import {Ids, Bot} from "./bot-common"
import pRetry from 'p-retry'
import {LLMOptions, Options} from './options'


export class ChatGptBot implements Bot {
  private readonly api: ChatGPTAPI | null = null

  private readonly options: Options

  constructor(options: Options, llmOptions: LLMOptions) {
    this.options = options
    
    const currentDate = new Date().toISOString().split('T')[0]
    const systemMessage = `${options.systemMessage} 
Knowledge cutoff: ${llmOptions.tokenLimits.knowledgeCutOff}
Current date: ${currentDate}`

    this.api = new ChatGPTAPI({
      apiBaseUrl: options.apiBaseUrl,
      systemMessage,
      apiKey: "",
      apiOrg: process.env.OPENAI_API_ORG ?? undefined,
      debug: options.debug,
      maxModelTokens: llmOptions.tokenLimits.maxTokens,
      maxResponseTokens: llmOptions.tokenLimits.responseTokens,
      completionParams: {
        temperature: options.llmTemperature,
        model: llmOptions.model
      }
    })

  }

  chat = async (message: string, ids: Ids): Promise<[string, Ids]> => {
    let res: [string, Ids] = ['', {}]
    try {
      res = await this.chat_(message, ids)
      return res
    } catch (e: unknown) {
      if (e instanceof ChatGPTError) {
        warning(`Failed to chat: ${e}, backtrace: ${e.stack}`)
      }
      return res
    }
  }

  private readonly chat_ = async (
    message: string,
    ids: Ids
  ): Promise<[string, Ids]> => {
    // record timing
    const start = Date.now()
    if (!message) {
      return ['', {}]
    }

    let response: ChatMessage | undefined

    if (this.api != null) {
      const opts: SendMessageOptions = {
        timeoutMs: this.options.llmTimeoutMS
      }
      // never occurs
      if (ids.parentMessageId) {
        opts.parentMessageId = ids.parentMessageId
      }
      try {
        response = await pRetry(() => this.api!.sendMessage(message, opts), {
          retries: this.options.llmRetries
        })
      } catch (e: unknown) {
        if (e instanceof ChatGPTError) {
          info(
            `response: ${response}, failed to send message to openai: ${e}, backtrace: ${e.stack}`
          )
        }
      }
      const end = Date.now()
      info(`response: ${JSON.stringify(response)}`)
      info(
        `openai sendMessage (including retries) response time: ${
          end - start
        } ms`
      )
    } else {
      // Never hit?
      setFailed('The OpenAI API is not initialized')
    }
    let responseText = ''
    if (response != null) {
      responseText = response.text
    } else {
      warning('openai response is null')
    }
    // remove the prefix "with " in the response
    if (responseText.startsWith('with ')) {
      responseText = responseText.substring(5)
    }
    if (this.options.debug) {
      info(`openai responses: ${responseText}`)
    }
    const newIds: Ids = {
      parentMessageId: response?.id,
      conversationId: response?.conversationId
    }
    return [responseText, newIds]
  }
}
