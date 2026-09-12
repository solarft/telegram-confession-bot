import { Bot } from 'grammy'
import { BOT_TOKEN } from './env'
import type { BotContext } from './handlers/confession'

export const bot = new Bot<BotContext>(BOT_TOKEN)
