import {Args, Command, Flags} from '@oclif/core'

import {DEFAULT_PROFILE, readConfig, resolveProfile, resolveTags} from '../../config.js'
import {formatAsToon} from '../../format.js'
import {clearClients, replyMessage} from '../../gchat/gchat-client.js'

export default class GChatReplyMessage extends Command {
  /* eslint-disable perfectionist/sort-objects -- threadName must precede message in CLI arg order */
  static override args = {
    threadName: Args.string({
      description: 'Thread name (e.g. spaces/SPACE_ID/threads/THREAD_ID)',
      required: true,
    }),
    message: Args.string({description: 'Message text to send', required: true}),
  }
  /* eslint-enable perfectionist/sort-objects */

  static override description = 'Reply to a message thread in Google Chat'
  static override examples = [
    '<%= config.bin %> <%= command.id %> spaces/AAQAKA6hsFw/threads/D1NI3W2B6vA "Reply here"',
    '<%= config.bin %> <%= command.id %> spaces/AAQAKA6hsFw/threads/D1NI3W2B6vA "Reply here" --profile work',
    '<%= config.bin %> <%= command.id %> spaces/AAQAKA6hsFw/threads/D1NI3W2B6vA "*Bold reply*" --formatted',
    '<%= config.bin %> <%= command.id %> spaces/AAQAKA6hsFw/threads/D1NI3W2B6vA "Check this" --tag "Jane Doe"',
  ]

  static override flags = {
    formatted: Flags.boolean({char: 'f', description: 'Enable formatted text (bold, italic, links)', required: false}),
    profile: Flags.string({
      char: 'p',
      default: DEFAULT_PROFILE,
      description: 'Config profile to use',
      required: false,
    }),
    tag: Flags.string({
      char: 't',
      description: 'User name or users/<id> to tag (repeatable)',
      multiple: true,
      required: false,
    }),
    toon: Flags.boolean({description: 'Format output as toon', required: false}),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(GChatReplyMessage)
    const config = await readConfig(this.config.configDir, this.log.bind(this))
    if (!config) return
    const auth = resolveProfile(config, flags.profile, this.log.bind(this))
    if (!auth) return
    const tags = resolveTags(config, flags.tag ?? [], this.log.bind(this))
    if (!tags) return
    let message = args.message.replaceAll(String.raw`\n`, '\n')
    for (const tag of tags) {
      message += `\n<${tag}>`
    }

    const result = await replyMessage(auth, args.threadName, message, flags.formatted)
    clearClients()

    if (flags.toon) {
      this.log(formatAsToon(result))
    } else {
      this.logJson(result)
    }
  }
}
