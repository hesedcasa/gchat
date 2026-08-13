import {Args, Command} from '@oclif/core'

import {readConfigOrEmpty, writeConfig} from '../../../config.js'

export default class ConfigAddToken extends Command {
  static override args = {
    profile: Args.string({description: 'Config profile name', required: true}),
    spaceId: Args.string({description: 'Google Chat space ID', required: true}),
    token: Args.string({description: 'API token for this space', required: true}),
  }

  static override description = 'Add or update an API token for a Google Chat space within a profile'
  static override examples = ['<%= config.bin %> <%= command.id %> default AAQAKA6hsFw your-space-token']

  public async run(): Promise<void> {
    const {args} = await this.parse(ConfigAddToken)
    const config = await readConfigOrEmpty(this.config.configDir)
    const profile = config.profiles[args.profile] ?? {key: '', tokens: {}}
    profile.tokens[args.spaceId] = args.token
    config.profiles[args.profile] = profile
    await writeConfig(this.config.configDir, config)
    this.log(`Token for space ${args.spaceId} in profile '${args.profile}' updated successfully.`)
  }
}
