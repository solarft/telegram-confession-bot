import process from 'node:process'

export const TOKEN = process.env.TOKEN!
export const BOT_TOKEN = process.env.BOT_TOKEN!
export const CHANNEL_ID = process.env.CHANNEL_ID!
export const ADMIN_GROUP_ID = process.env.ADMIN_GROUP_ID!
export const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL!
export const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN!

export const APPROVAL_THRESHOLD =
  Number.parseInt(process.env.APPROVAL_THRESHOLD ?? '', 10) || 3
export const VOTE_TTL_SECONDS =
  Number.parseInt(process.env.VOTE_TTL_SECONDS ?? '', 10) || 172800

const required = [
  'TOKEN',
  'BOT_TOKEN',
  'CHANNEL_ID',
  'ADMIN_GROUP_ID',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
] as const

const missing = required.filter((key) => !process.env[key])
if (missing.length > 0) {
  throw new Error(`Missing env: ${missing.join(', ')}`)
}
