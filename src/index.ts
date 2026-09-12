import { Redis } from '@upstash/redis'
import { Bot } from 'grammy'
import { BOT_TOKEN, UPSTASH_REDIS_TOKEN, UPSTASH_REDIS_URL } from './env'
import * as commands from './handlers/commands'

export const bot = new Bot(BOT_TOKEN)
export const redis = new Redis({
  url: UPSTASH_REDIS_URL,
  token: UPSTASH_REDIS_TOKEN,
})

bot.command('start', commands.start)
