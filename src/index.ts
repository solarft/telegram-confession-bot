import { conversations, createConversation } from '@grammyjs/conversations'
import { session } from 'grammy'
import './handlers/admin'
import * as commands from './handlers/commands'
import { submitConfession, type BotContext } from './handlers/confession'
import { bot } from './bot'

bot.use(session({ initial: () => ({}) }))
bot.use(conversations())
bot.use(createConversation(submitConfession, 'submitConfession'))

bot.command('start', commands.start)
bot.hears('📝 New confession', (ctx) =>
  ctx.conversation.enter('submitConfession'),
)
