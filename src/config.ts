import {mkdir, readFile, writeFile} from 'node:fs/promises'
import path from 'node:path'

export const DEFAULT_PROFILE = 'default'

export type GChatAuth = {
  key: string
  tokens: Record<string, string>
}

export type GChatConfig = {
  profiles: Record<string, GChatAuth>
  users: Record<string, string>
}

type RawProfile = {
  key?: string
  tokens?: Record<string, string>
}

type RawConfig = RawProfile & {
  profiles?: Record<string, RawProfile>
  users?: Record<string, string>
}

function parseProfiles(raw: RawConfig): Record<string, GChatAuth> {
  if (raw.profiles && typeof raw.profiles === 'object') {
    const profiles: Record<string, GChatAuth> = {}
    for (const [name, profile] of Object.entries(raw.profiles)) {
      profiles[name] = {key: profile.key ?? '', tokens: profile.tokens ?? {}}
    }

    return profiles
  }

  // Legacy single-profile config: promote top-level key/tokens to the default profile.
  return {[DEFAULT_PROFILE]: {key: raw.key ?? '', tokens: raw.tokens ?? {}}}
}

function parseUsers(raw: RawConfig): Record<string, string> {
  if (raw.users && typeof raw.users === 'object') {
    return raw.users
  }

  return {}
}

export async function readConfigOrEmpty(configDir: string): Promise<GChatConfig> {
  const configPath = path.join(configDir, 'gchat-config.json')
  try {
    const raw = JSON.parse(await readFile(configPath, 'utf8')) as RawConfig
    return {profiles: parseProfiles(raw), users: parseUsers(raw)}
  } catch {
    return {profiles: {}, users: {}}
  }
}

export async function writeConfig(configDir: string, config: GChatConfig): Promise<void> {
  const configPath = path.join(configDir, 'gchat-config.json')
  await mkdir(configDir, {recursive: true})
  await writeFile(configPath, JSON.stringify({profiles: config.profiles, users: config.users}, null, 2))
}

export async function readConfig(configDir: string, log: (msg: string) => void): Promise<GChatConfig | null> {
  const configPath = path.join(configDir, 'gchat-config.json')
  try {
    const raw = JSON.parse(await readFile(configPath, 'utf8')) as RawConfig
    return {profiles: parseProfiles(raw), users: parseUsers(raw)}
  } catch {
    log(`Error: Could not read config from ${configPath}`)
    log('Please create gchat-config.json with your Google Chat API credentials.')
    return null
  }
}

export function resolveProfile(config: GChatConfig, profile: string, log: (msg: string) => void): GChatAuth | null {
  const auth = config.profiles[profile]
  if (!auth) {
    log(`Error: Profile '${profile}' not found. Run 'gchat gchat config set-key ${profile} <key>' to create it.`)
    return null
  }

  return auth
}

const USER_PREFIX = 'users/'

function isUserId(value: string): boolean {
  return value.startsWith(USER_PREFIX) && value.length > USER_PREFIX.length
}

export async function addUser(configDir: string, name: string, userId: string): Promise<GChatConfig> {
  const config = await readConfigOrEmpty(configDir)
  config.users[name] = userId.startsWith(USER_PREFIX) ? userId : `${USER_PREFIX}${userId}`
  await writeConfig(configDir, config)
  return config
}

export function resolveTags(config: GChatConfig, names: string[], log: (msg: string) => void): null | string[] {
  const unknown = names.filter(name => config.users[name] === undefined && !isUserId(name))
  if (unknown.length > 0) {
    for (const name of unknown) {
      log(`Error: User '${name}' not found in the users list.`)
    }

    log("Run 'gchat config add-user <name> <userId>' to add or update a user.")
    return null
  }

  return names.map(name => config.users[name] ?? name)
}
