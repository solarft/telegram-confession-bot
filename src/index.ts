import { Redis } from '@upstash/redis'
import { UPSTASH_REDIS_TOKEN, UPSTASH_REDIS_URL } from './env'

export { bot } from './bot'
export const redis = new Redis({
  url: UPSTASH_REDIS_URL,
  token: UPSTASH_REDIS_TOKEN,
})
