import {Args, Command} from '@oclif/core'

import {readConfigOrEmpty, writeConfig} from '../../../config.js'

export default class ConfigSetKey extends Command {
  static override args = {
    key: Args.string({description: 'Google Chat API key', required: true}),
  }
  static override description = 'Set the Google Chat API key in the config file'
  static override examples = ['<%= config.bin %> <%= command.id %> your-api-key']

  public async run(): Promise<void> {
    const {args} = await this.parse(ConfigSetKey)
    const config = await readConfigOrEmpty(this.config.configDir)
    config.auth.key = args.key
    await writeConfig(this.config.configDir, config)
    this.log('API key updated successfully.')
  }
}
