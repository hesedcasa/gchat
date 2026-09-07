import {Args, Command} from '@oclif/core'

import {readConfigOrEmpty, writeConfig} from '../../../config.js'

export default class ConfigSetKey extends Command {
  /* eslint-disable perfectionist/sort-objects -- profile must precede key in CLI arg order */
  static override args = {
    profile: Args.string({description: 'Config profile name', required: true}),
    key: Args.string({description: 'Google Chat API key', required: true}),
  }
  /* eslint-enable perfectionist/sort-objects */

  static override description = 'Set the Google Chat API key for a profile'
  static override examples = [
    '<%= config.bin %> <%= command.id %> default your-api-key',
    '<%= config.bin %> <%= command.id %> work your-work-api-key',
  ]

  public async run(): Promise<void> {
    const {args} = await this.parse(ConfigSetKey)
    const config = await readConfigOrEmpty(this.config.configDir, this.log.bind(this))
    if (!config) return
    const profile = config.profiles[args.profile] ?? {key: '', tokens: {}}
    profile.key = args.key
    config.profiles[args.profile] = profile
    await writeConfig(this.config.configDir, config)
    this.log(`API key for profile '${args.profile}' updated successfully.`)
  }
}
