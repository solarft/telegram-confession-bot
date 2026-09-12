import process from 'node:process'

export const TOKEN = process.env.TOKEN!
export const BOT_TOKEN = process.env.BOT_TOKEN!
export const CHANNEL_ID = process.env.CHANNEL_ID!
export const ADMIN_GROUP_ID = process.env.ADMIN_GROUP_ID!
export const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_URL!
export const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_TOKEN!

if (!TOKEN || !BOT_TOKEN) {
  throw new Error('missing env')
}
