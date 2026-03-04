import {mkdir, readFile, writeFile} from 'node:fs/promises'
import {join} from 'node:path'

export interface GChatAuth {
  key: string
  tokens: Record<string, string>
}

interface GChatConfig {
  auth: GChatAuth
}

export async function readConfigOrEmpty(configDir: string): Promise<GChatConfig> {
  const configPath = join(configDir, 'gchat-config.json')
  try {
    const raw = JSON.parse(await readFile(configPath, 'utf8'))
    return {auth: {key: raw.key ?? '', tokens: raw.tokens ?? {}}}
  } catch {
    return {auth: {key: '', tokens: {}}}
  }
}

export async function writeConfig(configDir: string, config: GChatConfig): Promise<void> {
  const configPath = join(configDir, 'gchat-config.json')
  await mkdir(configDir, {recursive: true})
  await writeFile(configPath, JSON.stringify(config.auth, null, 2))
}

export async function readConfig(configDir: string, log: (msg: string) => void): Promise<GChatConfig | null> {
  const configPath = join(configDir, 'gchat-config.json')
  try {
    const raw = JSON.parse(await readFile(configPath, 'utf8'))
    return {auth: {key: raw.key, tokens: raw.tokens ?? {}}}
  } catch {
    log(`Error: Could not read config from ${configPath}`)
    log('Please create gchat-config.json with your Google Chat API credentials.')
    return null
  }
}
