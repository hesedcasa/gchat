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
  if (raw.users && typeof raw.users === 'object' && !Array.isArray(raw.users)) {
    return raw.users
  }

  return {}
}

export async function readConfigOrEmpty(configDir: string, log: (msg: string) => void): Promise<GChatConfig | null> {
  const configPath = path.join(configDir, 'gchat-config.json')
  try {
    const raw = JSON.parse(await readFile(configPath, 'utf8')) as RawConfig
    return {profiles: parseProfiles(raw), users: parseUsers(raw)}
  } catch (error) {
    // A missing file means the user has not configured anything yet — start empty.
    // Any other failure (malformed JSON, unreadable file) must not be treated as
    // an empty config, or the next write would silently destroy the existing one.
    if (error instanceof Error && (error as {code?: string}).code === 'ENOENT') {
      return {profiles: {}, users: {}}
    }

    log(`Error: Could not read config from ${configPath}`)
    log('Fix or remove the file and retry — nothing was overwritten.')
    return null
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
  if (!value.startsWith(USER_PREFIX)) return false
  const id = value.slice(USER_PREFIX.length)
  return id.length > 0 && [...id].every((char) => char.trim().length > 0)
}

export async function addUser(
  configDir: string,
  name: string,
  userId: string,
  log: (msg: string) => void,
): Promise<GChatConfig | null> {
  const config = await readConfigOrEmpty(configDir, log)
  if (!config) return null

  const normalized = userId.startsWith(USER_PREFIX) ? userId : `${USER_PREFIX}${userId}`
  if (!isUserId(normalized)) {
    log(`Error: Invalid user ID '${userId}'. Expected a 'users/<id>' value with a non-empty, whitespace-free ID.`)
    return null
  }

  config.users[name] = normalized
  await writeConfig(configDir, config)
  return config
}

export function resolveTags(config: GChatConfig, names: string[], log: (msg: string) => void): null | string[] {
  const resolved: string[] = []
  const invalid: string[] = []
  const unknown: string[] = []
  for (const name of names) {
    // Own-property lookup only — inherited names like 'toString' must count as unknown.
    const saved = Object.hasOwn(config.users, name) ? config.users[name] : undefined
    if (saved === undefined) {
      if (isUserId(name)) {
        resolved.push(name)
      } else {
        unknown.push(name)
      }

      continue
    }

    if (isUserId(saved)) {
      resolved.push(saved)
    } else {
      invalid.push(name)
    }
  }

  if (invalid.length === 0 && unknown.length === 0) return resolved

  for (const name of invalid) {
    log(`Error: Saved user '${name}' has an invalid ID: '${config.users[name]}'.`)
  }

  for (const name of unknown) {
    log(`Error: User '${name}' not found in the users list.`)
  }

  log("Run 'gchat config add-user <name> <userId>' to add or update a user.")
  return null
}
