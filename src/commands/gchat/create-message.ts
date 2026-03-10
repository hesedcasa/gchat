import {Args, Command, Flags} from '@oclif/core'

import {readConfig} from '../../config.js'
import {formatAsToon} from '../../format.js'
import {clearClients, newMessage} from '../../gchat/gchat-client.js'

export default class GChatCreateMessage extends Command {
  /* eslint-disable perfectionist/sort-objects */
  static override args = {
    spaceId: Args.string({description: 'Google Chat space ID', required: true}),
    message: Args.string({description: 'Message text to send', required: true}),
  }
  /* eslint-enable perfectionist/sort-objects */
  static override description = 'Send a message to a Google Chat space'
  static override examples = [
    '<%= config.bin %> <%= command.id %> AAQAKA6hsFw "Hello team"',
    '<%= config.bin %> <%= command.id %> AAQAKA6hsFw "*Bold message*" --formatted',
    '<%= config.bin %> <%= command.id %> AAQAKA6hsFw "<https://example.com|Click here>" -f',
  ]
  static override flags = {
    formatted: Flags.boolean({char: 'f', description: 'Enable formatted text (bold, italic, links)', required: false}),
    toon: Flags.boolean({description: 'Format output as toon', required: false}),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(GChatCreateMessage)
    const config = await readConfig(this.config.configDir, this.log.bind(this))
    if (!config) return
    // eslint-disable-next-line unicorn/prefer-string-replace-all
    const result = await newMessage(config.auth, args.spaceId, args.message.replace(/\\n/g, '\n'), flags.formatted)
    clearClients()

    if (flags.toon) {
      this.log(formatAsToon(result))
    } else {
      this.logJson(result)
    }
  }
}
