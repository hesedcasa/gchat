import {Args, Command} from '@oclif/core'

import {addUser} from '../../../config.js'

export default class ConfigAddUser extends Command {
  static override args = {
    name: Args.string({description: 'Display name of the user, used with --tag', required: true}),
    userId: Args.string({description: 'Google Chat user ID (e.g. users/123456789)', required: true}),
  }

  static override description = 'Add or update a user in the users list for tagging messages'
  static override examples = [
    '<%= config.bin %> <%= command.id %> "Jane Doe" users/123456789012345678901',
    '<%= config.bin %> <%= command.id %> "Jane Doe" 123456789012345678901',
  ]

  public async run(): Promise<void> {
    const {args} = await this.parse(ConfigAddUser)
    const config = await addUser(this.config.configDir, args.name, args.userId)
    this.log(`User '${args.name}' saved as ${config.users[args.name]} in the users list.`)
  }
}
