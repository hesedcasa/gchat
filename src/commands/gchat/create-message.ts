import {Args, Command, Flags} from '@oclif/core'

import {DEFAULT_PROFILE, readConfig, resolveProfile} from '../../config.js'
import {formatAsToon} from '../../format.js'
import {clearClients, newMessage} from '../../gchat/gchat-client.js'

export default class GChatCreateMessage extends Command {
  /* eslint-disable perfectionist/sort-objects -- spaceId must precede message in CLI arg order */
  static override args = {
    spaceId: Args.string({description: 'Google Chat space ID', required: true}),
    message: Args.string({description: 'Message text to send', required: true}),
  }
  /* eslint-enable perfectionist/sort-objects */

  static override description = 'Send a message to a Google Chat space'
  static override examples = [
    '<%= config.bin %> <%= command.id %> AAQAKA6hsFw "Hello team"',
    '<%= config.bin %> <%= command.id %> AAQAKA6hsFw "Hello work" --profile work',
    '<%= config.bin %> <%= command.id %> AAQAKA6hsFw "*Bold message*" --formatted',
    '<%= config.bin %> <%= command.id %> AAQAKA6hsFw "<https://example.com|Click here>" -f',
  ]

  static override flags = {
    formatted: Flags.boolean({char: 'f', description: 'Enable formatted text (bold, italic, links)', required: false}),
    profile: Flags.string({
      char: 'p',
      default: DEFAULT_PROFILE,
      description: 'Config profile to use',
      required: false,
    }),
    toon: Flags.boolean({description: 'Format output as toon', required: false}),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(GChatCreateMessage)
    const config = await readConfig(this.config.configDir, this.log.bind(this))
    if (!config) return
    const auth = resolveProfile(config, flags.profile, this.log.bind(this))
    if (!auth) return
    const result = await newMessage(auth, args.spaceId, args.message.replaceAll(String.raw`\n`, '\n'), flags.formatted)
    clearClients()

    if (flags.toon) {
      this.log(formatAsToon(result))
    } else {
      this.logJson(result)
    }
  }
}
