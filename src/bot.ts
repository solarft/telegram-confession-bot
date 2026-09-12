import { conversations, createConversation } from '@grammyjs/conversations'
import { Bot, session } from 'grammy'
import { BOT_TOKEN } from './env'
import { registerAdminHandlers } from './handlers/admin'
import * as commands from './handlers/commands'
import { submitConfession, type BotContext } from './handlers/confession'

export const bot = new Bot<BotContext>(BOT_TOKEN)

bot.use(session({ initial: () => ({}) }))
bot.use(conversations())
bot.use(createConversation(submitConfession, 'submitConfession'))

bot.command('start', commands.start)
bot.hears('🗣️ New confession', (ctx) =>
  ctx.conversation.enter('submitConfession'),
)
registerAdminHandlers(bot)
