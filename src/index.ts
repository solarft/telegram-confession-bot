import { Bot } from 'grammy'
import { BOT_TOKEN } from './env'
import * as commands from './handlers/commands'

export const bot = new Bot(BOT_TOKEN)
bot.command('start', commands.start)
