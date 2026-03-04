import {Args, Command} from '@oclif/core'

import {readConfigOrEmpty, writeConfig} from '../../../config.js'

export default class ConfigAddToken extends Command {
  static override args = {
    spaceId: Args.string({description: 'Google Chat space ID', required: true}),
    token: Args.string({description: 'API token for this space', required: true}),
  }
  static override description = 'Add or update an API token for a Google Chat space'
  static override examples = ['<%= config.bin %> <%= command.id %> AAQAKA6hsFw your-space-token']

  public async run(): Promise<void> {
    const {args} = await this.parse(ConfigAddToken)
    const config = await readConfigOrEmpty(this.config.configDir)
    config.auth.tokens[args.spaceId] = args.token
    await writeConfig(this.config.configDir, config)
    this.log(`Token for space ${args.spaceId} updated successfully.`)
  }
}
