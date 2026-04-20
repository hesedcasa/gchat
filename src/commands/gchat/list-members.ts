import {Args, Command, Flags} from '@oclif/core'

import {readConfig} from '../../config.js'
import {formatAsToon} from '../../format.js'
import {clearClients, listMembers} from '../../gchat/gchat-client.js'

export default class GChatListMembers extends Command {
  static override args = {
    spaceId: Args.string({description: 'Google Chat space ID', required: true}),
  }
  static override description = 'List all members in a Google Chat space'
  static override examples = ['<%= config.bin %> <%= command.id %> AAQAKA6hsFw']
  static override flags = {
    toon: Flags.boolean({description: 'Format output as toon', required: false}),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(GChatListMembers)
    const config = await readConfig(this.config.configDir, this.log.bind(this))
    if (!config) return
    const result = await listMembers(config.auth, args.spaceId)
    clearClients()

    if (flags.toon) {
      this.log(formatAsToon(result))
    } else {
      this.logJson(result)
    }
  }
}
